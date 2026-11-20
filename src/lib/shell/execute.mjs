// 执行器：管道、重定向、通配符展开。stderr 一律直通终端，不参与管道。
import { tokenize } from './tokenize.mjs';
import { COMMANDS } from './commands.mjs';
import { dirNames, getNode, globToRegExp, hasPerm, resolvePath, writeFile } from './vfs.mjs';

/** 对含 * 或 ? 的词做目录内匹配；无匹配按 bash 默认保留字面量。 */
export function expandWord(fs, cwd, word) {
  if (!word.includes('*') && !word.includes('?')) return [word];
  const cut = word.lastIndexOf('/');
  const dirPart = cut >= 0 ? word.slice(0, cut) || '/' : '';
  const pattern = cut >= 0 ? word.slice(cut + 1) : word;
  const dirNode = getNode(fs, resolvePath(cwd, dirPart || '.'));
  if (!dirNode || dirNode.type !== 'dir') return [word];
  const matcher = globToRegExp(pattern);
  const matches = dirNames(dirNode)
    .filter((name) => !name.startsWith('.') && matcher.test(name))
    .map((name) => (cut >= 0 ? `${dirPart}/${name}` : name));
  return matches.length ? matches : [word];
}

function writeRedirect(fs, cwd, user, redirect, text) {
  const abs = resolvePath(cwd, redirect.target);
  const existing = getNode(fs, abs);
  if (existing && existing.type === 'dir') return false;
  if (existing && !hasPerm(existing, user, 'w')) return false;
  const names = abs.split('/').filter(Boolean);
  names.pop();
  const parent = getNode(fs, '/' + names.join('/'));
  if (!parent || parent.type !== 'dir' || !hasPerm(parent, user, 'w')) return false;
  const content = redirect.type === '>>' ? (existing?.content ?? '') + text : text;
  return writeFile(fs, abs, { content, mode: existing?.mode });
}

export function runLine({ fs, cwd, user, line }) {
  const parsed = tokenize(line);
  const base = { fs, cwd, stdout: '', stderr: '', code: 0, clear: false };
  if (parsed.error) return { ...base, code: 2, stderr: `shell: 语法错误：${parsed.error}` };
  if (!parsed.commands.length) return base;
  const errors = [];
  let stdin = '';
  let currentCwd = cwd;
  let code = 0;
  let clear = false;
  for (let index = 0; index < parsed.commands.length; index += 1) {
    const segment = parsed.commands[index];
    // 引号内保持字面量（bash 习惯）：带引号的词跳过通配展开
    const words = segment.words.flatMap((word, position) => (
      parsed.commandQuoted?.[index]?.[position] ? [word] : expandWord(fs, currentCwd, word)
    ));
    const name = words[0];
    if (!COMMANDS[name]) {
      errors.push(`shell: ${name}: 本练习场暂不支持该命令（见 /about/ 支持清单）`);
      return { ...base, cwd: currentCwd, stderr: errors.join('\n'), code: 127 };
    }
    if (name === 'cd' && parsed.commands.length > 1) {
      errors.push('cd: 不支持在管道中使用');
      return { ...base, cwd: currentCwd, stderr: errors.join('\n'), code: 1 };
    }
    const result = COMMANDS[name]({ fs, cwd: currentCwd, user, stdin }, words.slice(1));
    if (result.cwd) currentCwd = result.cwd;
    if (result.clear) clear = true;
    if (result.stderr) errors.push(result.stderr);
    code = result.code;
    const isLast = index === parsed.commands.length - 1;
    if (!isLast) {
      stdin = result.stdout ?? '';
      continue;
    }
    let stdout = result.stdout ?? '';
    if (segment.redirect) {
      const written = writeRedirect(fs, currentCwd, user, segment.redirect, stdout);
      if (written) stdout = '';
      else { errors.push(`shell: ${segment.redirect.target}: 无法写入`); code = 1; stdout = ''; }
    }
    return { fs, cwd: currentCwd, stdout, stderr: errors.join('\n'), code, clear };
  }
  return { ...base, cwd: currentCwd, stderr: errors.join('\n'), code, clear };
}
