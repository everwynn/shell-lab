// 白名单命令实现。state = { fs, cwd, user, stdin }；fs 原地修改（每次会话/演示各自建树）。
import {
  GROUPS,
  USERS,
  dirNames,
  ensureDir,
  formatMode,
  getNode,
  groupName,
  hasPerm,
  removeNode,
  resolvePath,
  userName,
  writeFile,
} from './vfs.mjs';

const ok = (stdout = '') => ({ code: 0, stdout, stderr: '' });
const fail = (message, code = 1) => ({ code, stdout: '', stderr: message });
const resolve = (state, raw) => resolvePath(state.cwd, raw);
const parentOf = (abs) => {
  const cut = abs.lastIndexOf('/');
  return cut <= 0 ? '/' : abs.slice(0, cut);
};
const baseOf = (abs) => abs.slice(abs.lastIndexOf('/') + 1);

function nearestExisting(fs, abs) {
  let path = abs;
  while (path !== '/') {
    const node = getNode(fs, path);
    if (node) return { path, node };
    path = parentOf(path);
  }
  return { path: '/', node: fs };
}

function longLine(node, name) {
  const size = node.type === 'dir' ? 4096 : node.content.length;
  return `${formatMode(node)} 1 ${userName(node.uid)} ${groupName(node.gid)} ${String(size).padStart(5)} 01-01 12:00 ${name}`;
}

function copyNode(fs, src, abs) {
  if (src.type === 'file') {
    writeFile(fs, abs, { content: src.content, mode: src.mode, uid: src.uid, gid: src.gid });
    return;
  }
  ensureDir(fs, abs, { mode: src.mode, uid: src.uid, gid: src.gid });
  for (const [name, child] of Object.entries(src.children)) copyNode(fs, child, `${abs}/${name}`);
}

function pwd(state) {
  return ok(`${state.cwd}\n`);
}

function ls(state, args) {
  let all = false;
  let long = false;
  const paths = [];
  for (const arg of args) {
    if (arg === '-a') all = true;
    else if (arg === '-l') long = true;
    else if (arg === '-la' || arg === '-al') { all = true; long = true; }
    else if (arg.startsWith('-')) return fail(`ls: 暂不支持该选项 '${arg}'`);
    else paths.push(arg);
  }
  const targets = paths.length ? paths : ['.'];
  const lines = [];
  const errors = [];
  let code = 0;
  for (const target of targets) {
    const abs = resolve(state, target);
    const node = getNode(state.fs, abs);
    if (!node) { errors.push(`ls: cannot access '${target}': No such file or directory`); code = 2; continue; }
    if (node.type === 'file') { lines.push(long ? longLine(node, baseOf(abs)) : baseOf(abs)); continue; }
    if (targets.length > 1) lines.push(`${target}:`);
    for (const name of dirNames(node)) {
      if (!all && name.startsWith('.')) continue;
      lines.push(long ? longLine(node.children[name], name) : name);
    }
  }
  return { code, stdout: lines.length ? `${lines.join('\n')}\n` : '', stderr: errors.join('\n') };
}

function cd(state, args) {
  const target = args[0] ?? '~';
  if (target === '-') return fail('cd: 不支持 cd -（上一次目录）');
  if (args.length > 1) return fail('cd: 参数过多');
  const abs = resolve(state, target);
  const node = getNode(state.fs, abs);
  if (!node) return fail(`cd: ${target}: No such file or directory`);
  if (node.type !== 'dir') return fail(`cd: ${target}: Not a directory`);
  if (!hasPerm(node, state.user, 'x')) return fail(`cd: ${target}: Permission denied`);
  return { ...ok(), cwd: abs };
}

function mkdir(state, args) {
  let parents = false;
  const targets = [];
  for (const arg of args) {
    if (arg === '-p') parents = true;
    else if (arg.startsWith('-')) return fail(`mkdir: 暂不支持该选项 '${arg}'`);
    else targets.push(arg);
  }
  if (!targets.length) return fail('mkdir: missing operand');
  const errors = [];
  for (const target of targets) {
    const abs = resolve(state, target);
    if (getNode(state.fs, abs)) {
      if (!parents) errors.push(`mkdir: cannot create directory '${target}': File exists`);
      continue;
    }
    const parent = nearestExisting(state.fs, parentOf(abs));
    if (parent.node.type !== 'dir') { errors.push(`mkdir: cannot create directory '${target}': Not a directory`); continue; }
    if (!hasPerm(parent.node, state.user, 'w')) { errors.push(`mkdir: cannot create directory '${target}': Permission denied`); continue; }
    ensureDir(state.fs, abs);
  }
  return { code: errors.length ? 1 : 0, stdout: '', stderr: errors.join('\n') };
}

function touch(state, args) {
  if (!args.length) return fail('touch: missing file operand');
  const errors = [];
  for (const target of args) {
    const abs = resolve(state, target);
    if (getNode(state.fs, abs)) continue;
    const parent = getNode(state.fs, parentOf(abs));
    if (!parent || parent.type !== 'dir') errors.push(`touch: cannot touch '${target}': No such file or directory`);
    else if (!hasPerm(parent, state.user, 'w')) errors.push(`touch: cannot touch '${target}': Permission denied`);
    else writeFile(state.fs, abs, {});
  }
  return { code: errors.length ? 1 : 0, stdout: '', stderr: errors.join('\n') };
}

function rm(state, args) {
  let recursive = false;
  const targets = [];
  for (const arg of args) {
    if (arg === '-r' || arg === '-R' || arg === '-rf' || arg === '-fr') recursive = true;
    else if (arg === '-f') continue;
    else if (arg.startsWith('-')) return fail(`rm: 暂不支持该选项 '${arg}'`);
    else targets.push(arg);
  }
  if (!targets.length) return fail('rm: missing operand');
  const errors = [];
  for (const target of targets) {
    const abs = resolve(state, target);
    const node = getNode(state.fs, abs);
    if (!node) { errors.push(`rm: cannot remove '${target}': No such file or directory`); continue; }
    if (abs === '/') { errors.push(`rm: 拒绝删除 ${target}`); continue; }
    if (node.type === 'dir' && !recursive) { errors.push(`rm: cannot remove '${target}': Is a directory`); continue; }
    const parent = getNode(state.fs, parentOf(abs));
    if (parent && !hasPerm(parent, state.user, 'w')) { errors.push(`rm: cannot remove '${target}': Permission denied`); continue; }
    removeNode(state.fs, abs);
  }
  return { code: errors.length ? 1 : 0, stdout: '', stderr: errors.join('\n') };
}

function cp(state, args) {
  let recursive = false;
  const operands = [];
  for (const arg of args) {
    if (arg === '-r' || arg === '-R') recursive = true;
    else if (arg.startsWith('-')) return fail(`cp: 暂不支持该选项 '${arg}'`);
    else operands.push(arg);
  }
  if (operands.length !== 2) return fail('cp: 需要两个参数：源 目标');
  const [srcRaw, destRaw] = operands;
  const srcAbs = resolve(state, srcRaw);
  const src = getNode(state.fs, srcAbs);
  if (!src) return fail(`cp: cannot stat '${srcRaw}': No such file or directory`);
  if (src.type === 'dir' && !recursive) return fail(`cp: -r not specified; omitting directory '${srcRaw}'`);
  const destAbs = resolve(state, destRaw);
  const destNode = getNode(state.fs, destAbs);
  const targetAbs = destNode?.type === 'dir' ? `${destAbs}/${baseOf(srcAbs)}` : destAbs;
  const parent = nearestExisting(state.fs, parentOf(targetAbs));
  if (parent.node.type !== 'dir') return fail(`cp: cannot create '${destRaw}': No such file or directory`);
  if (!hasPerm(parent.node, state.user, 'w')) return fail(`cp: cannot create '${destRaw}': Permission denied`);
  copyNode(state.fs, src, targetAbs);
  return ok();
}

function mv(state, args) {
  if (args.length !== 2) return fail('mv: 需要两个参数：源 目标');
  const [srcRaw, destRaw] = args;
  const srcAbs = resolve(state, srcRaw);
  const src = getNode(state.fs, srcAbs);
  if (!src) return fail(`mv: cannot stat '${srcRaw}': No such file or directory`);
  const destAbs = resolve(state, destRaw);
  const destNode = getNode(state.fs, destAbs);
  const targetAbs = destNode?.type === 'dir' ? `${destAbs}/${baseOf(srcAbs)}` : destAbs;
  const targetParent = getNode(state.fs, parentOf(targetAbs));
  if (!targetParent || targetParent.type !== 'dir') return fail(`mv: cannot move '${srcRaw}': No such file or directory`);
  const srcParent = getNode(state.fs, parentOf(srcAbs));
  if (!hasPerm(srcParent, state.user, 'w') || !hasPerm(targetParent, state.user, 'w')) return fail(`mv: cannot move '${srcRaw}': Permission denied`);
  removeNode(state.fs, srcAbs);
  copyNode(state.fs, src, targetAbs);
  return ok();
}

function cat(state, args) {
  const files = args.filter((arg) => !arg.startsWith('-'));
  if (!files.length) return ok(state.stdin ?? '');
  let output = '';
  const errors = [];
  for (const raw of files) {
    const node = getNode(state.fs, resolve(state, raw));
    if (!node) { errors.push(`cat: ${raw}: No such file or directory`); continue; }
    if (node.type !== 'file') { errors.push(`cat: ${raw}: Is a directory`); continue; }
    if (!hasPerm(node, state.user, 'r')) { errors.push(`cat: ${raw}: Permission denied`); continue; }
    output += node.content;
  }
  return { code: errors.length ? 1 : 0, stdout: output, stderr: errors.join('\n') };
}

function echo(state, args) {
  return ok(`${args.join(' ')}\n`);
}

function grep(state, args) {
  const options = args.filter((arg) => arg.startsWith('-') && arg.length > 1);
  if (options.length) return fail(`grep: 暂不支持该选项 '${options[0]}'`);
  const [pattern, ...files] = args.filter((arg) => !options.includes(arg));
  if (!pattern) return fail('grep: 缺少匹配模式');
  const lines = [];
  const errors = [];
  let matched = false;
  const sources = files.length ? files : [null];
  for (const raw of sources) {
    let text;
    if (raw === null) text = state.stdin ?? '';
    else {
      const node = getNode(state.fs, resolve(state, raw));
      if (!node) { errors.push(`grep: ${raw}: No such file or directory`); continue; }
      if (node.type !== 'file') { errors.push(`grep: ${raw}: Is a directory`); continue; }
      if (!hasPerm(node, state.user, 'r')) { errors.push(`grep: ${raw}: Permission denied`); continue; }
      text = node.content;
    }
    for (const line of text.split('\n')) {
      if (!line.includes(pattern)) continue;
      matched = true;
      lines.push(files.length > 1 && raw !== null ? `${raw}:${line}` : line);
    }
  }
  return { code: errors.length ? 2 : matched ? 0 : 1, stdout: lines.length ? `${lines.join('\n')}\n` : '', stderr: errors.join('\n') };
}

function headTail(state, args, fromTail) {
  const name = fromTail ? 'tail' : 'head';
  let count = 10;
  const files = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '-n') {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 0) return fail(`${name}: -n 需要非负整数`);
      count = value;
      index += 1;
    } else if (/^-\d+$/.test(args[index])) count = Number(args[index].slice(1));
    else if (args[index].startsWith('-')) return fail(`${name}: 暂不支持该选项 '${args[index]}'`);
    else files.push(args[index]);
  }
  if (files.length > 1) return fail(`${name}: 一次只支持一个文件`);
  let text;
  if (files.length) {
    const node = getNode(state.fs, resolve(state, files[0]));
    if (!node) return fail(`${name}: cannot open '${files[0]}': No such file or directory`);
    if (node.type !== 'file') return fail(`${name}: ${files[0]}: Is a directory`);
    if (!hasPerm(node, state.user, 'r')) return fail(`${name}: cannot open '${files[0]}': Permission denied`);
    text = node.content;
  } else text = state.stdin ?? '';
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const picked = fromTail ? lines.slice(-count) : lines.slice(0, count);
  return ok(picked.length ? `${picked.join('\n')}\n` : '');
}

function head(state, args) { return headTail(state, args, false); }
function tail(state, args) { return headTail(state, args, true); }

function wc(state, args) {
  const unknown = args.find((arg) => arg.startsWith('-') && arg !== '-l');
  if (unknown) return fail(`wc: 暂不支持该选项 '${unknown}'`);
  const linesOnly = args.includes('-l');
  const files = args.filter((arg) => !arg.startsWith('-'));
  if (files.length > 1) return fail('wc: 一次只支持一个文件');
  const measure = (text) => {
    const rows = text.split('\n');
    if (rows.at(-1) === '') rows.pop();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return linesOnly ? String(rows.length) : `${rows.length} ${words} ${text.length}`;
  };
  if (files.length) {
    const node = getNode(state.fs, resolve(state, files[0]));
    if (!node) return fail(`wc: ${files[0]}: No such file or directory`);
    if (!hasPerm(node, state.user, 'r')) return fail(`wc: ${files[0]}: Permission denied`);
    return ok(`${measure(node.content)} ${files[0]}\n`);
  }
  return ok(`${measure(state.stdin ?? '')}\n`);
}

function applySymbolic(mode, expr) {
  const match = /^([ugoa]*)([+-])([rwx]+)$/.exec(expr);
  if (!match) return null;
  const [, whoRaw, op, perms] = match;
  const who = whoRaw || 'a';
  let bits = mode;
  const apply = (value, mask) => (op === '+' ? value | mask : value & ~mask);
  for (const target of who) {
    for (const perm of perms) {
      const mask = 1 << (perm === 'r' ? 2 : perm === 'w' ? 1 : 0);
      if (target === 'u' || target === 'a') bits = (bits & ~(7 << 6)) | (apply((bits >> 6) & 7, mask) << 6);
      if (target === 'g' || target === 'a') bits = (bits & ~(7 << 3)) | (apply((bits >> 3) & 7, mask) << 3);
      if (target === 'o' || target === 'a') bits = (bits & ~7) | apply(bits & 7, mask);
    }
  }
  return bits;
}

function chmod(state, args) {
  if (args.length < 2) return fail('chmod: 用法 chmod MODE 文件…');
  const [spec, ...targets] = args;
  let mode = null;
  if (/^[0-7]{3}$/.test(spec)) mode = parseInt(spec, 8);
  else if (/^[ugoa]*[+-][rwx]+$/.test(spec)) mode = spec;
  else return fail(`chmod: 无效的模式 '${spec}'`);
  const errors = [];
  for (const raw of targets) {
    const node = getNode(state.fs, resolve(state, raw));
    if (!node) { errors.push(`chmod: cannot access '${raw}': No such file or directory`); continue; }
    if (typeof mode === 'string') {
      const next = applySymbolic(node.mode, mode);
      if (next === null) { errors.push(`chmod: 无效的模式 '${spec}'`); continue; }
      node.mode = next;
    } else node.mode = mode;
  }
  return { code: errors.length ? 1 : 0, stdout: '', stderr: errors.join('\n') };
}

function chown(state, args) {
  if (args.length < 2) return fail('chown: 用法 chown user[:group] 文件…');
  const [spec, ...targets] = args;
  const [userRaw, groupRaw] = spec.split(':');
  const user = USERS[userRaw];
  if (!user) return fail(`chown: 无效的用户 '${spec}'`);
  let gid = user.gid;
  if (groupRaw !== undefined) {
    if (!(groupRaw in GROUPS)) return fail(`chown: 无效的组 '${groupRaw}'`);
    gid = GROUPS[groupRaw];
  }
  const errors = [];
  for (const raw of targets) {
    const node = getNode(state.fs, resolve(state, raw));
    if (!node) { errors.push(`chown: cannot access '${raw}': No such file or directory`); continue; }
    node.uid = user.uid;
    node.gid = gid;
  }
  return { code: errors.length ? 1 : 0, stdout: '', stderr: errors.join('\n') };
}

function clear() {
  return { ...ok(), clear: true };
}

function help() {
  return ok(`支持的命令：${Object.keys(COMMANDS).join(' ')}\n`);
}

export const COMMANDS = { pwd, ls, cd, mkdir, touch, rm, cp, mv, cat, echo, grep, head, tail, wc, chmod, chown, clear, help };

/** 按白名单执行一条命令；未知命令返回统一文案。 */
export function runCommand(state, args) {
  const [name, ...rest] = args;
  const command = COMMANDS[name];
  if (!command) {
    return { code: 127, stdout: '', stderr: `shell: ${name}: 本练习场暂不支持该命令（见 /about/ 支持清单）` };
  }
  return command(state, rest);
}
