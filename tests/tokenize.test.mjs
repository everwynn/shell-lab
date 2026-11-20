import test from 'node:test';
import assert from 'node:assert/strict';

import { tokenize } from '../src/lib/shell/tokenize.mjs';

test('空白切分与多空格', () => {
  assert.deepEqual(tokenize('ls  -l   ~').commands, [{ words: ['ls', '-l', '~'], redirect: null }]);
});

test('引号内整体成词，操作符不拆', () => {
  const { commands } = tokenize('echo "hello | world" \'a > b\'');
  assert.deepEqual(commands[0].words, ['echo', 'hello | world', 'a > b']);
});

test('管道切段', () => {
  assert.deepEqual(tokenize('grep ERROR a.log | wc -l').commands, [
    { words: ['grep', 'ERROR', 'a.log'], redirect: null },
    { words: ['wc', '-l'], redirect: null },
  ]);
});

test('重定向 > 与 >>', () => {
  assert.deepEqual(tokenize('ls > list.txt').commands, [
    { words: ['ls'], redirect: { type: '>', target: 'list.txt' } },
  ]);
  assert.deepEqual(tokenize('echo hi >> log.txt').commands, [
    { words: ['echo', 'hi'], redirect: { type: '>>', target: 'log.txt' } },
  ]);
});

test('重定向紧贴目标也能解析', () => {
  assert.deepEqual(tokenize('echo hi>out.txt').commands, [
    { words: ['echo', 'hi'], redirect: { type: '>', target: 'out.txt' } },
  ]);
});

test('空行返回空命令表', () => {
  assert.deepEqual(tokenize('   ').commands, []);
});

test('语法错误：未闭合引号 / 重定向无目标 / 空命令段', () => {
  assert.ok(tokenize('echo "abc').error);
  assert.ok(tokenize('ls >').error);
  assert.ok(tokenize('ls | ').error);
  assert.ok(tokenize('| wc').error);
  assert.ok(tokenize('ls > a > b').error);
});

test('引号标记：commandQuoted 与每段 words 对齐', () => {
  const { commands, commandQuoted } = tokenize('find . -name "*.log" | cat *.log');
  assert.deepEqual(commands[0].words, ['find', '.', '-name', '*.log']);
  assert.deepEqual(commandQuoted, [[false, false, false, true], [false, false]]);
});
