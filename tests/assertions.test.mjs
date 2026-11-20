import test from 'node:test';
import assert from 'node:assert/strict';

import { createFsFromSetup, getNode, HOME } from '../src/lib/shell/vfs.mjs';
import { ASSERTION_KINDS, describeGoal, evaluate, validateGoal } from '../src/lib/shell/assertions.mjs';

function fixture() {
  return createFsFromSetup({
    files: {
      'notes.txt': { content: 'a\nb\na\n', gid: 1002 },
      'locked.txt': { content: 'x\n', mode: 0o000 },
      'team/plan.md': { content: 'p\n', mode: 0o664 },
      'logs/.keep': '',
    },
  });
}

test('八种断言各自通过', () => {
  const fs = fixture();
  const goals = [
    { kind: 'file-exists', path: '~/notes.txt' },
    { kind: 'file-absent', path: '~/gone.txt' },
    { kind: 'file-contains', path: '~/notes.txt', pattern: 'a', min: 2 },
    { kind: 'file-lines', path: '~/notes.txt', count: 3 },
    { kind: 'mode-is', path: '~/team/plan.md', mode: 0o664 },
    { kind: 'owner-is', path: '~/notes.txt', user: 'me', group: 'dev' },
    { kind: 'cwd-is', path: '~/team' },
    { kind: 'output-contains', pattern: 'done' },
  ];
  const result = evaluate(fs, '/home/me/team', goals, { lastOutput: 'all done\n' });
  assert.deepEqual(result.passed, [true, true, true, true, true, true, true, true]);
  assert.equal(result.allPassed, true);
});

test('失败分支：模式不够、行数不符、目录不算文件、权限不匹配', () => {
  const fs = fixture();
  const result = evaluate(fs, HOME, [
    { kind: 'file-contains', path: '~/notes.txt', pattern: 'z' },
    { kind: 'file-lines', path: '~/notes.txt', count: 2 },
    { kind: 'file-exists', path: '~/team' },
    { kind: 'mode-is', path: '~/locked.txt', mode: 0o600 },
    { kind: 'owner-is', path: '~/notes.txt', group: 'ops' },
    { kind: 'cwd-is', path: '~/logs' },
    { kind: 'output-contains', pattern: 'done' },
  ]);
  assert.deepEqual(result.passed, [false, false, false, false, false, false, false]);
});

test('file-absent 与 file-lines 的边界', () => {
  const fs = fixture();
  assert.equal(evaluate(fs, HOME, [{ kind: 'file-absent', path: '~/locked.txt' }]).allPassed, false);
  assert.equal(evaluate(fs, HOME, [{ kind: 'file-lines', path: '~/logs/.keep', count: 0 }]).allPassed, true);
});

test('describeGoal 文案与 validateGoal 校验', () => {
  assert.equal(describeGoal({ kind: 'file-exists', path: '~/a.txt' }), '文件 ~/a.txt 存在');
  assert.equal(describeGoal({ kind: 'mode-is', path: '~/a.txt', mode: 0o644 }), '~/a.txt 权限为 644');
  assert.deepEqual(ASSERTION_KINDS.length, 8);
  assert.equal(validateGoal({ kind: 'file-exists', path: '~/a' }), null);
  assert.ok(validateGoal({ kind: 'nope', path: '~/a' }));
  assert.ok(validateGoal({ kind: 'file-exists' }));
});
