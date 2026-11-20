// 虚拟文件系统：目录树 + 权限位。命令只在这里读写，不碰真实磁盘。
export const HOME = '/home/me';

export const USERS = {
  me: { uid: 1000, gid: 1000, groups: [1000, 1001] },
  root: { uid: 0, gid: 0, groups: [0] },
};

export const GROUPS = { me: 1000, ops: 1001, dev: 1002, root: 0 };

export function userName(uid) {
  return Object.keys(USERS).find((name) => USERS[name].uid === uid) ?? String(uid);
}

export function groupName(gid) {
  return Object.keys(GROUPS).find((name) => GROUPS[name] === gid) ?? String(gid);
}

/** ~ 展开 + . / .. 归一，返回绝对路径。 */
export function resolvePath(cwd, raw) {
  const text = String(raw ?? '');
  const head = text.startsWith('~') ? HOME + text.slice(1) : text.startsWith('/') ? text : `${cwd}/${text}`;
  const parts = [];
  for (const piece of head.split('/')) {
    if (!piece || piece === '.') continue;
    if (piece === '..') parts.pop();
    else parts.push(piece);
  }
  return '/' + parts.join('/');
}

export function getNode(fs, path) {
  const abs = resolvePath('/', path);
  if (abs === '/') return fs;
  let node = fs;
  for (const name of abs.split('/').filter(Boolean)) {
    if (node?.type !== 'dir') return null;
    node = node.children[name];
    if (!node) return null;
  }
  return node ?? null;
}

export function ensureDir(fs, path, { mode = 0o755, uid = 1000, gid = 1000 } = {}) {
  const abs = resolvePath('/', path);
  if (abs === '/') return true;
  let node = fs;
  for (const name of abs.split('/').filter(Boolean)) {
    let child = node.children[name];
    if (!child) {
      child = { type: 'dir', mode, uid, gid, children: {} };
      node.children[name] = child;
    }
    if (child.type !== 'dir') return false;
    node = child;
  }
  return true;
}

export function writeFile(fs, path, { content = '', mode = 0o644, uid = 1000, gid = 1000 } = {}) {
  const abs = resolvePath('/', path);
  const names = abs.split('/').filter(Boolean);
  const name = names.pop();
  const parent = getNode(fs, '/' + names.join('/'));
  if (!parent || parent.type !== 'dir') return false;
  const existing = parent.children[name];
  if (existing) {
    if (existing.type !== 'file') return false;
    existing.content = content;
    return true;
  }
  parent.children[name] = { type: 'file', mode, uid, gid, content };
  return true;
}

export function removeNode(fs, path) {
  const abs = resolvePath('/', path);
  const names = abs.split('/').filter(Boolean);
  const name = names.pop();
  const parent = getNode(fs, '/' + names.join('/'));
  if (!parent || parent.type !== 'dir' || !parent.children[name]) return false;
  delete parent.children[name];
  return true;
}

export function hasPerm(node, user = 'me', perm = 'r') {
  if (!node) return false;
  const info = USERS[user] ?? USERS.me;
  const shift = perm === 'r' ? 2 : perm === 'w' ? 1 : 0;
  const bits = node.uid === info.uid ? (node.mode >> 6) & 7 : info.groups.includes(node.gid) ? (node.mode >> 3) & 7 : node.mode & 7;
  return (bits & (1 << shift)) !== 0;
}

export function formatMode(node) {
  const bits = node.mode ?? 0o644;
  const triplet = (value) => `${value & 4 ? 'r' : '-'}${value & 2 ? 'w' : '-'}${value & 1 ? 'x' : '-'}`;
  return `${node.type === 'dir' ? 'd' : '-'}${triplet((bits >> 6) & 7)}${triplet((bits >> 3) & 7)}${triplet(bits & 7)}`;
}

export function dirNames(dirNode) {
  return Object.keys(dirNode?.children ?? {}).sort();
}

/** 从关卡 setup 建树：files 的键相对 ~；值为字符串或 { content, mode, uid, gid }。 */
export function createFsFromSetup(setup = {}) {
  const fs = { type: 'dir', mode: 0o755, uid: 0, gid: 0, children: {} };
  ensureDir(fs, '/home');
  ensureDir(fs, HOME);
  for (const [path, value] of Object.entries(setup.files ?? {})) {
    const abs = resolvePath(HOME, path);
    const spec = typeof value === 'string' ? { content: value } : (value ?? {});
    const parent = abs.split('/').slice(0, -1).join('/') || '/';
    ensureDir(fs, parent);
    const ok = writeFile(fs, abs, {
      content: spec.content ?? '',
      mode: spec.mode ?? 0o644,
      uid: spec.uid ?? 1000,
      gid: spec.gid ?? 1000,
    });
    if (!ok) throw new Error(`关卡 setup 非法：${path}`);
  }
  return fs;
}

/** glob 模式（* / ?）转正则；供 execute 的通配符展开与 find -name 共用。 */
export function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}
