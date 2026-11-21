import test from 'node:test';
import assert from 'node:assert/strict';

import { runCommand } from '../src/lib/shell/commands.mjs';
import { runLine } from '../src/lib/shell/execute.mjs';
import { HOME, createFsFromSetup, getNode } from '../src/lib/shell/vfs.mjs';

function session(files = {}) {
  return { fs: createFsFromSetup({ files }), cwd: HOME, user: 'me', stdin: '' };
}

test('pwd 输出绝对路径', () => {
  assert.equal(runCommand(session(), ['pwd']).stdout, '/home/me\n');
});

test('ls：排序、-a 隐藏文件、-l 权限串', () => {
  const s = session({ 'b.txt': 'x\n', 'a.txt': '', 'logs/app.log': '', '.env': '' });
  assert.equal(runCommand(s, ['ls']).stdout, 'a.txt\nb.txt\nlogs\n');
  assert.ok(runCommand(s, ['ls', '-a']).stdout.includes('.env'));
  const long = runCommand(s, ['ls', '-l']).stdout;
  assert.ok(long.includes('-rw-r--r--'));
  assert.ok(long.includes('drwxr-xr-x'));
});

test('cd：切换、默认回家、目录不存在、缺 x 权限', () => {
  const s = session({ 'logs/app.log': '' });
  assert.equal(runCommand(s, ['cd', 'logs']).cwd, '/home/me/logs');
  assert.equal(runCommand(s, ['cd']).cwd, HOME);
  assert.match(runCommand(s, ['cd', 'nope']).stderr, /No such file or directory/);
  getNode(s.fs, '~/logs').mode = 0o644;
  assert.match(runCommand(s, ['cd', 'logs']).stderr, /Permission denied/);
});

test('mkdir：自动多级、已存在报错、-p 幂等', () => {
  const s = session();
  assert.equal(runCommand(s, ['mkdir', 'a/b/c']).code, 0);
  assert.equal(getNode(s.fs, '~/a/b/c').type, 'dir');
  assert.match(runCommand(s, ['mkdir', 'a']).stderr, /File exists/);
  assert.equal(runCommand(s, ['mkdir', '-p', 'a/b/c']).code, 0);
});

test('touch：新建空文件、不覆盖已有内容', () => {
  const s = session({ 'keep.txt': 'old\n' });
  runCommand(s, ['touch', 'new.txt', 'keep.txt']);
  assert.equal(getNode(s.fs, '~/new.txt').content, '');
  assert.equal(getNode(s.fs, '~/keep.txt').content, 'old\n');
});

test('rm：文件、目录需要 -r、不存在报错', () => {
  const s = session({ 'a.txt': '', 'logs/x.txt': '' });
  assert.match(runCommand(s, ['rm', 'logs']).stderr, /Is a directory/);
  assert.equal(runCommand(s, ['rm', '-r', 'logs']).code, 0);
  assert.equal(getNode(s.fs, '~/logs'), null);
  assert.match(runCommand(s, ['rm', 'a.txt', 'gone.txt']).stderr, /No such file or directory/);
});

test('cp：复制文件、目录缺 -r 报错、-r 递归', () => {
  const s = session({ 'a.txt': 'A\n', 'dst/keep.txt': '', 'src/x.txt': 'X\n' });
  assert.equal(runCommand(s, ['cp', 'a.txt', 'dst']).code, 0);
  assert.equal(getNode(s.fs, '~/dst/a.txt').content, 'A\n');
  assert.match(runCommand(s, ['cp', 'src', 'dst']).stderr, /-r/);
  assert.equal(runCommand(s, ['cp', '-r', 'src', 'dst']).code, 0);
  assert.equal(getNode(s.fs, '~/dst/src/x.txt').content, 'X\n');
});

test('mv：改名与移入目录', () => {
  const s = session({ 'old.txt': 'O\n', 'dst/keep.txt': '' });
  assert.equal(runCommand(s, ['mv', 'old.txt', 'new.txt']).code, 0);
  assert.equal(getNode(s.fs, '~/new.txt').content, 'O\n');
  assert.equal(getNode(s.fs, '~/old.txt'), null);
  assert.equal(runCommand(s, ['mv', 'new.txt', 'dst']).code, 0);
  assert.equal(getNode(s.fs, '~/dst/new.txt').content, 'O\n');
});

test('cat：拼接、缺失、目录、无读权限', () => {
  const s = session({ 'a.txt': 'A\n', 'b.txt': 'B\n', 'locked.txt': { content: 'S\n', mode: 0o000 } });
  assert.equal(runCommand(s, ['cat', 'a.txt', 'b.txt']).stdout, 'A\nB\n');
  assert.match(runCommand(s, ['cat', 'gone.txt']).stderr, /No such file or directory/);
  assert.match(runCommand(s, ['cat', '~']).stderr, /Is a directory/);
  assert.match(runCommand(s, ['cat', 'locked.txt']).stderr, /Permission denied/);
});

test('echo 与 grep：字面量匹配、多文件前缀、无匹配返回 1', () => {
  const s = session({ 'one.log': 'ERROR x\nINFO\n', 'two.log': 'ERROR y\n' });
  assert.equal(runCommand(s, ['echo', 'hi', 'there']).stdout, 'hi there\n');
  const both = runCommand(s, ['grep', 'ERROR', 'one.log', 'two.log']);
  assert.equal(both.stdout, 'one.log:ERROR x\ntwo.log:ERROR y\n');
  assert.equal(runCommand({ ...s, stdin: 'ERROR z\n' }, ['grep', 'ERROR']).stdout, 'ERROR z\n');
  assert.equal(runCommand(s, ['grep', 'WARN', 'one.log']).code, 1);
});

test('head / tail / wc', () => {
  const s = session({ 'n.txt': '1\n2\n3\n4\n5\n' });
  assert.equal(runCommand(s, ['head', '-n', '2', 'n.txt']).stdout, '1\n2\n');
  assert.equal(runCommand(s, ['tail', '-n', '1', 'n.txt']).stdout, '5\n');
  assert.equal(runCommand(s, ['wc', '-l', 'n.txt']).stdout, '5 n.txt\n');
});

test('chmod：八进制与符号模式', () => {
  const s = session({ 'a.sh': '', 'b.txt': { content: '', mode: 0o666 } });
  runCommand(s, ['chmod', '755', 'a.sh']);
  assert.equal(getNode(s.fs, '~/a.sh').mode, 0o755);
  runCommand(s, ['chmod', 'go-w', 'b.txt']);
  assert.equal(getNode(s.fs, '~/b.txt').mode, 0o644);
  assert.match(runCommand(s, ['chmod', 'abc', 'a.sh']).stderr, /无效的模式/);
});

test('chown：用户:组、无效用户报错', () => {
  const s = session({ 'team.txt': '' });
  assert.equal(runCommand(s, ['chown', 'me:dev', 'team.txt']).code, 0);
  assert.equal(getNode(s.fs, '~/team.txt').gid, 1002);
  assert.equal(runCommand(s, ['chown', 'root:root', 'team.txt']).code, 0);
  assert.equal(getNode(s.fs, '~/team.txt').uid, 0);
  assert.match(runCommand(s, ['chown', 'ghost', 'team.txt']).stderr, /无效的用户/);
});

test('clear 与 help', () => {
  const s = session();
  assert.equal(runCommand(s, ['clear']).clear, true);
  assert.ok(runCommand(s, ['help']).stdout.includes('chmod'));
});

test('sort：字典序、-r 倒序、-n 数值、-rn 组合', () => {
  const s = session({ 'names.txt': 'pear\napple\norange\nbanana\n' });
  assert.equal(runCommand(s, ['sort', 'names.txt']).stdout, 'apple\nbanana\norange\npear\n');
  assert.equal(runCommand(s, ['sort', '-r', 'names.txt']).stdout, 'pear\norange\nbanana\napple\n');
  const nums = session({ 'n.txt': '10 a\n2 b\n30 c\n' });
  assert.equal(runCommand(nums, ['sort', '-n', 'n.txt']).stdout, '2 b\n10 a\n30 c\n');
  assert.equal(runCommand(nums, ['sort', '-rn', 'n.txt']).stdout, '30 c\n10 a\n2 b\n');
});

test('sort：stdin 输入、空输入输出空、文件缺失报错', () => {
  const s = session();
  s.stdin = 'b\na\n';
  assert.equal(runCommand(s, ['sort']).stdout, 'a\nb\n');
  assert.equal(runCommand(session(), ['sort']).stdout, '');
  assert.match(runCommand(session(), ['sort', 'gone.txt']).stderr, /No such file or directory/);
});

test('uniq：只合并相邻重复，-c 计数', () => {
  const s = session({ 'errors.log': 'Timeout\nDisk full\nTimeout\nTimeout\n' });
  assert.equal(runCommand(s, ['uniq', 'errors.log']).stdout, 'Timeout\nDisk full\nTimeout\n');
  assert.equal(runCommand(s, ['uniq', '-c', 'errors.log']).stdout, '1 Timeout\n1 Disk full\n2 Timeout\n');
  const sorted = session({ 'errors.log': 'D\nT\nT\nT\n' });
  assert.equal(runCommand(sorted, ['uniq', '-c', 'errors.log']).stdout, '1 D\n3 T\n');
});

test('cut：-f 取列、自定义分隔符、管道与缺参数报错', () => {
  const s = session({ 'access.log': '10.0.0.1 2026-11-20 ERROR\n10.0.0.2 2026-11-20 INFO\n' });
  assert.equal(runCommand(s, ['cut', '-d', ' ', '-f', '1', 'access.log']).stdout, '10.0.0.1\n10.0.0.2\n');
  assert.equal(runCommand(s, ['cut', '-d ', '-f1', 'access.log']).stdout, '10.0.0.1\n10.0.0.2\n');
  const colon = session({ 'kv.txt': 'a:1\nb:2\n' });
  assert.equal(runCommand(colon, ['cut', '-d:', '-f2', 'kv.txt']).stdout, '1\n2\n');
  assert.match(runCommand(session(), ['cut', '-f1']).stderr, /缺少 -d/);
  assert.match(runCommand(session(), ['cut', '-d:', 'x.txt']).stderr, /缺少 -f/);
});

test('管道组合：cut | sort | uniq -c | sort -rn', () => {
  const s = session({
    'access.log': '10.0.0.3 ERROR\n10.0.0.1 ERROR\n10.0.0.3 ERROR\n10.0.0.2 ERROR\n10.0.0.1 ERROR\n10.0.0.3 ERROR\n',
  });
  const result = runLine({ fs: s.fs, cwd: s.cwd, user: 'me', line: "cut -d' ' -f1 access.log | sort | uniq -c | sort -rn" });
  assert.equal(result.stdout, '3 10.0.0.3\n2 10.0.0.1\n1 10.0.0.2\n');
  assert.equal(result.code, 0);
});

test('find：-name 递归匹配与 ./ 前缀', () => {
  const s = session({
    'project/src/app.log': 'A\n',
    'project/docs/guide.md': '# g\n',
    'project/logs/2026/app.log': 'B\n',
    'scratch/tmp.log': 'C\n',
  });
  assert.equal(
    runCommand(s, ['find', '.', '-name', '*.log']).stdout,
    './project/logs/2026/app.log\n./project/src/app.log\n./scratch/tmp.log\n',
  );
});

test('find：-type d 只列目录、无匹配输出空', () => {
  const s = session({ 'project/src/.keep': '', 'project/docs/.keep': '', 'project/README.md': '' });
  assert.equal(
    runCommand(s, ['find', '.', '-type', 'd']).stdout,
    '.\n./project\n./project/docs\n./project/src\n',
  );
  assert.equal(runCommand(s, ['find', '.', '-name', '*.nope']).stdout, '');
});

test('find：路径不存在与起点无权限', () => {
  const s = session({ 'locked/x.txt': '' });
  assert.match(runCommand(s, ['find', 'nope']).stderr, /No such file or directory/);
  getNode(s.fs, '~/locked').mode = 0o644;
  assert.match(runCommand(s, ['find', 'locked']).stderr, /Permission denied/);
});

test('find：/ 前缀保留、起点名用输入词干', () => {
  const s = session({ 'd/x.txt': '' });
  assert.equal(runCommand(s, ['find', '/', '-type', 'd']).stdout, '/\n/home\n/home/me\n/home/me/d\n');
  assert.equal(runCommand(s, ['find', '.', '-name', 'me']).stdout, '');
});

test('mv：多源移入目录，多源目标非目录报错', () => {
  const s = session({ 'a.txt': 'A\n', 'b.txt': 'B\n', 'dst/keep.txt': '' });
  assert.equal(runCommand(s, ['mv', 'a.txt', 'b.txt', 'dst']).code, 0);
  assert.equal(getNode(s.fs, '~/dst/a.txt').content, 'A\n');
  assert.equal(getNode(s.fs, '~/dst/b.txt').content, 'B\n');
  assert.equal(getNode(s.fs, '~/a.txt'), null);
  assert.match(runCommand(s, ['mv', 'dst/keep.txt', 'dst/a.txt', 'new.txt']).stderr, /不是目录/);
});

test('mv：部分失败继续；自嵌套 / 同文件 / 类型冲突被拒绝且不删源', () => {
  const s = session({ 'a.txt': 'A\n', 'b.txt': 'B\n', 'pkg/lib.js': '', 'dst/a.txt/.keep': '' });
  const partial = runCommand(s, ['mv', 'a.txt', 'nope.txt', 'dst']);
  assert.equal(partial.code, 1);
  assert.match(partial.stderr, /cannot stat 'nope.txt'/);
  assert.match(partial.stderr, /同名目录/);
  assert.equal(getNode(s.fs, '~/a.txt').content, 'A\n');
  assert.match(runCommand(s, ['mv', 'pkg', 'pkg']).stderr, /子目录/);
  assert.equal(getNode(s.fs, '~/pkg/lib.js').content, '');
  assert.match(runCommand(s, ['mv', 'b.txt', 'b.txt']).stderr, /相同/);
  assert.equal(getNode(s.fs, '~/b.txt').content, 'B\n');
});
