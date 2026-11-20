import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HOME,
  createFsFromSetup,
  dirNames,
  ensureDir,
  formatMode,
  getNode,
  hasPerm,
  removeNode,
  resolvePath,
  writeFile,
} from '../src/lib/shell/vfs.mjs';

test('路径归一：~ / 相对 / .. / 绝对', () => {
  assert.equal(resolvePath('/home/me', '~'), HOME);
  assert.equal(resolvePath('/home/me', '~/logs/a.log'), '/home/me/logs/a.log');
  assert.equal(resolvePath('/home/me/logs', '../notes.txt'), '/home/me/notes.txt');
  assert.equal(resolvePath('/home/me', './x/../y'), '/home/me/y');
  assert.equal(resolvePath('/home/me', '/etc/hosts'), '/etc/hosts');
  assert.equal(resolvePath('/home/me', 'a/../../b'), '/home/b');
});

test('setup 建树：自动补目录、字符串与对象两种文件写法', () => {
  const fs = createFsFromSetup({
    files: {
      'logs/app.log': 'INFO ok\nERROR x\n',
      'secret.txt': { content: 'k', mode: 0o600 },
    },
  });
  assert.equal(getNode(fs, '~/logs/app.log').content, 'INFO ok\nERROR x\n');
  assert.equal(getNode(fs, '~/secret.txt').mode, 0o600);
  assert.equal(getNode(fs, '~/logs').type, 'dir');
});

test('写文件要求父目录存在，覆盖保留原 mode', () => {
  const fs = createFsFromSetup({ files: { 'a.txt': 'one' } });
  assert.equal(writeFile(fs, '~/missing/x.txt', { content: 'x' }), false);
  assert.equal(writeFile(fs, '~/a.txt', { content: 'two' }), true);
  assert.equal(getNode(fs, '~/a.txt').content, 'two');
  assert.equal(getNode(fs, '~/a.txt').mode, 0o644);
});

test('ensureDir 多级创建，重复调用幂等', () => {
  const fs = createFsFromSetup({});
  assert.equal(ensureDir(fs, '~/a/b/c'), true);
  assert.equal(ensureDir(fs, '~/a/b/c'), true);
  assert.equal(getNode(fs, '~/a/b/c').type, 'dir');
});

test('权限位：owner / group / other 三段', () => {
  const fs = createFsFromSetup({ files: { 'open.txt': { content: '', mode: 0o644 }, 'mine.txt': { content: '', mode: 0o600 } } });
  assert.equal(hasPerm(getNode(fs, '~/open.txt'), 'me', 'w'), true);
  assert.equal(hasPerm(getNode(fs, '~/mine.txt'), 'root', 'r'), false);
  assert.equal(hasPerm(getNode(fs, '~/open.txt'), 'root', 'r'), true);
});

test('formatMode 与 dirNames 排序', () => {
  const fs = createFsFromSetup({ files: { 'b.txt': '', 'a.txt': '', 'logs/x': '' } });
  assert.equal(formatMode(getNode(fs, '~/a.txt')), '-rw-r--r--');
  assert.equal(formatMode(getNode(fs, '~/logs')), 'drwxr-xr-x');
  assert.deepEqual(dirNames(getNode(fs, '~')), ['a.txt', 'b.txt', 'logs']);
});

test('removeNode：文件与目录都支持，不存在返回 false', () => {
  const fs = createFsFromSetup({ files: { 'logs/x.txt': '' } });
  assert.equal(removeNode(fs, '~/logs/x.txt'), true);
  assert.equal(removeNode(fs, '~/logs/x.txt'), false);
  assert.equal(getNode(fs, '~/logs/x.txt'), null);
});
