import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHAPTERS,
  LEVELS,
  chapterLevels,
  getLevel,
  nextLevel,
  prevLevel,
} from '../src/lib/shell/levels/index.mjs';
import { HOME, createFsFromSetup } from '../src/lib/shell/vfs.mjs';
import { runLine } from '../src/lib/shell/execute.mjs';
import { evaluate, validateGoal } from '../src/lib/shell/assertions.mjs';

test('结构：18 关、id 唯一、每章 6 关、两级提示', () => {
  assert.equal(LEVELS.length, 18);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, 18);
  for (const chapter of CHAPTERS) assert.equal(chapterLevels(chapter.id).length, 6);
  for (const level of LEVELS) {
    assert.ok(CHAPTERS.some((chapter) => chapter.id === level.chapter), `${level.id} 章节非法`);
    assert.ok(level.title && level.brief, `${level.id} 缺标题或说明`);
    assert.equal(level.hints.length, 2, `${level.id} 提示应为两级`);
    assert.ok(level.demo.length > 0, `${level.id} 缺演示`);
  }
});

test('结构：goal 类型与参数合法', () => {
  for (const level of LEVELS) {
    assert.ok(level.goals.length > 0, `${level.id} 缺目标`);
    for (const goal of level.goals) assert.equal(validateGoal(goal), null, `${level.id} 非法断言`);
  }
});

test('工具函数：getLevel / nextLevel / prevLevel', () => {
  assert.equal(getLevel('files-1').chapter, 'files');
  assert.equal(getLevel('nope'), null);
  assert.equal(nextLevel('files-1').id, 'files-2');
  assert.equal(prevLevel('files-1'), null);
  assert.equal(nextLevel('perms-6'), null);
});

for (const level of LEVELS) {
  test(`初始不通过：${level.id}`, () => {
    const fs = createFsFromSetup(level.setup);
    const cwd = level.setup?.cwd ?? HOME;
    assert.equal(evaluate(fs, cwd, level.goals).allPassed, false);
  });

  test(`演示金样例通过：${level.id}`, () => {
    const fs = createFsFromSetup(level.setup);
    let cwd = level.setup?.cwd ?? HOME;
    let lastOutput = '';
    for (const line of level.demo) {
      const result = runLine({ fs, cwd, user: 'me', line });
      cwd = result.cwd;
      lastOutput = result.stdout;
    }
    assert.equal(evaluate(fs, cwd, level.goals, { lastOutput }).allPassed, true);
  });
}
