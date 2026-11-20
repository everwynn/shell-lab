import test from 'node:test';
import assert from 'node:assert/strict';

import { PROGRESS_KEY, clearProgress, loadProgress, markDone, saveProgress } from '../src/lib/progress.mjs';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

test('空存储返回空数组', () => {
  assert.deepEqual(loadProgress(fakeStorage()), []);
  assert.deepEqual(loadProgress(null), []);
});

test('markDone 幂等且保留完成顺序', () => {
  const storage = fakeStorage();
  markDone(storage, 'files-1');
  markDone(storage, 'files-2');
  markDone(storage, 'files-1');
  assert.deepEqual(loadProgress(storage), ['files-1', 'files-2']);
});

test('坏 JSON 与非数组内容降级为空', () => {
  assert.deepEqual(loadProgress(fakeStorage({ [PROGRESS_KEY]: '{oops' })), []);
  assert.deepEqual(loadProgress(fakeStorage({ [PROGRESS_KEY]: '"x"' })), []);
});

test('saveProgress 去重，clearProgress 清空', () => {
  const storage = fakeStorage();
  saveProgress(storage, ['a', 'a', 'b']);
  assert.deepEqual(loadProgress(storage), ['a', 'b']);
  clearProgress(storage);
  assert.deepEqual(loadProgress(storage), []);
});
