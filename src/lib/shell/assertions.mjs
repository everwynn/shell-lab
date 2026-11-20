// 关卡判定：所有断言都是纯函数，关卡测试与 UI 共用同一套实现。
import { GROUPS, USERS, getNode, resolvePath } from './vfs.mjs';

// 比 spec 多一个 output-contains：cat/grep 这类纯读取关卡没有状态变化。
export const ASSERTION_KINDS = [
  'file-exists',
  'file-absent',
  'file-contains',
  'file-lines',
  'mode-is',
  'owner-is',
  'cwd-is',
  'output-contains',
];

function lineCount(content) {
  const rows = content.split('\n');
  if (rows.at(-1) === '') rows.pop();
  return rows.length;
}

export function evaluate(fs, cwd, goals, { lastOutput = '' } = {}) {
  const passed = goals.map((goal) => checkGoal(fs, cwd, goal, lastOutput));
  return { passed, allPassed: passed.every(Boolean) };
}

function checkGoal(fs, cwd, goal, lastOutput) {
  const node = goal.path ? getNode(fs, resolvePath(cwd, goal.path)) : null;
  switch (goal.kind) {
    case 'file-exists':
      return node?.type === 'file';
    case 'file-absent':
      return node === null;
    case 'file-contains': {
      if (node?.type !== 'file') return false;
      return node.content.split(goal.pattern).length - 1 >= (goal.min ?? 1);
    }
    case 'file-lines':
      return node?.type === 'file' && lineCount(node.content) === goal.count;
    case 'mode-is':
      return node?.mode === goal.mode;
    case 'owner-is': {
      if (!node) return false;
      if (goal.user && node.uid !== USERS[goal.user]?.uid) return false;
      if (goal.group && node.gid !== GROUPS[goal.group]) return false;
      return Boolean(goal.user || goal.group);
    }
    case 'cwd-is':
      return cwd === resolvePath(cwd, goal.path);
    case 'output-contains':
      return lastOutput.includes(goal.pattern);
    default:
      return false;
  }
}

export function describeGoal(goal) {
  switch (goal.kind) {
    case 'file-exists': return `文件 ${goal.path} 存在`;
    case 'file-absent': return `${goal.path} 已不存在`;
    case 'file-contains': return `${goal.path} 包含 ${goal.min ?? 1} 处「${goal.pattern}」`;
    case 'file-lines': return `${goal.path} 恰好 ${goal.count} 行`;
    case 'mode-is': return `${goal.path} 权限为 ${Number(goal.mode).toString(8).padStart(3, '0')}`;
    case 'owner-is': return `${goal.path} 属主为 ${[goal.user, goal.group].filter(Boolean).join(':')}`;
    case 'cwd-is': return `当前目录是 ${goal.path}`;
    case 'output-contains': return `最近一次输出包含「${goal.pattern}」`;
    default: return String(goal.kind);
  }
}

export function validateGoal(goal) {
  if (!ASSERTION_KINDS.includes(goal?.kind)) return `未知断言 ${goal?.kind}`;
  if (goal.kind !== 'output-contains' && typeof goal.path !== 'string') return `${goal.kind} 缺少 path`;
  if (goal.kind === 'file-contains' && typeof goal.pattern !== 'string') return 'file-contains 缺少 pattern';
  if (goal.kind === 'file-lines' && !Number.isInteger(goal.count)) return 'file-lines 缺少 count';
  if (goal.kind === 'mode-is' && !Number.isInteger(goal.mode)) return 'mode-is 缺少 mode';
  if (goal.kind === 'output-contains' && typeof goal.pattern !== 'string') return 'output-contains 缺少 pattern';
  return null;
}
