import test from 'node:test';
import assert from 'node:assert/strict';

import { HOME, createFsFromSetup, getNode } from '../src/lib/shell/vfs.mjs';
import { expandWord, runLine } from '../src/lib/shell/execute.mjs';

function session(files = {}) {
  return { fs: createFsFromSetup({ files }), cwd: HOME, user: 'me' };
}

test('管道：grep 输出交给 wc', () => {
  const s = session({ 'logs/app.log': 'ERROR a\nINFO b\nERROR c\n' });
  const r = runLine({ ...s, line: 'grep ERROR logs/app.log | wc -l' });
  assert.equal(r.stdout, '2\n');
  assert.equal(r.code, 0);
});

test('重定向 > 覆盖、>> 追加，stdout 被清空', () => {
  const s = session();
  const first = runLine({ ...s, line: 'echo hi > out.txt' });
  assert.equal(first.stdout, '');
  assert.equal(getNode(first.fs, '~/out.txt').content, 'hi\n');
  const second = runLine({ fs: first.fs, cwd: first.cwd, user: 'me', line: 'echo yo >> out.txt' });
  assert.equal(getNode(second.fs, '~/out.txt').content, 'hi\nyo\n');
  const third = runLine({ fs: second.fs, cwd: second.cwd, user: 'me', line: 'echo z > out.txt' });
  assert.equal(getNode(third.fs, '~/out.txt').content, 'z\n');
});

test('通配符展开：多个匹配与无匹配保留字面量', () => {
  const s = session({ 'logs/a.log': '', 'logs/b.log': '', 'logs/c.txt': '' });
  assert.deepEqual(expandWord(s.fs, HOME, 'logs/*.log'), ['logs/a.log', 'logs/b.log']);
  assert.deepEqual(expandWord(s.fs, HOME, 'logs/*.md'), ['logs/*.md']);
  assert.deepEqual(expandWord(s.fs, HOME, 'logs/?.log'), ['logs/a.log', 'logs/b.log']);
  assert.deepEqual(expandWord(s.fs, HOME, 'plain.txt'), ['plain.txt']);
});

test('通配符真正参与执行（rm logs/*.log）', () => {
  const s = session({ 'logs/a.log': '', 'logs/b.log': '', 'logs/c.txt': '' });
  const r = runLine({ ...s, line: 'rm logs/*.log' });
  assert.equal(getNode(r.fs, '~/logs/a.log'), null);
  assert.ok(getNode(r.fs, '~/logs/c.txt'));
});

test('stderr 不进管道', () => {
  const s = session({ 'a.txt': 'x\n' });
  const r = runLine({ ...s, line: 'cat missing.txt | wc -l' });
  assert.match(r.stderr, /No such file or directory/);
  assert.equal(r.stdout, '0\n');
});

test('cd 不允许进入管道', () => {
  const s = session({ 'logs/x.txt': '' });
  const r = runLine({ ...s, line: 'cd logs | cat' });
  assert.match(r.stderr, /不支持在管道中使用/);
  assert.equal(r.code, 1);
  assert.equal(r.cwd, HOME);
});

test('未知命令与语法错误', () => {
  const s = session();
  const unknown = runLine({ ...s, line: 'vim x.txt' });
  assert.equal(unknown.code, 127);
  assert.match(unknown.stderr, /暂不支持该命令/);
  const broken = runLine({ ...s, line: 'echo "abc' });
  assert.equal(broken.code, 2);
  assert.match(broken.stderr, /语法错误/);
});

test('重定向到无写权限的目录报错', () => {
  const s = session({ 'secret/keep.txt': '' });
  getNode(s.fs, '~/secret').mode = 0o555;
  const r = runLine({ ...s, line: 'echo hi > secret/x.txt' });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /无法写入/);
});

test('clear 透传', () => {
  const r = runLine({ ...session(), line: 'clear' });
  assert.equal(r.clear, true);
});
