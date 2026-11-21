### Task 3: mv 多源移动扩展

**Files:**
- Modify: `src/lib/shell/commands.mjs`（重写 `mv`）
- Test: `tests/commands.test.mjs`

**Interfaces:**
- Consumes: `resolve` / `getNode` / `hasPerm` / `removeNode` / `copyNode` / `parentOf` / `baseOf`。
- Produces: `mv 源... 目标`；多源时目标必须是目录（否则报 `mv: 目标 X 不是目录`）；单源行为与现在完全一致（改名或移入目录）。

- [ ] **Step 1: 写失败测试**

在 `tests/commands.test.mjs` 末尾追加：

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/commands.test.mjs`
Expected: FAIL（`mv: 需要两个参数`；旧版 mv 不支持多源，守卫用例同样失败）

- [ ] **Step 3: 重写 mv**

用以下实现整体替换原 `mv` 函数：

```js
function mv(state, args) {
  const operands = [];
  for (const arg of args) {
    if (arg.startsWith('-')) return fail(`mv: 暂不支持该选项 '${arg}'`);
    operands.push(arg);
  }
  if (operands.length < 2) return fail('mv: 需要至少两个参数：源 目标');
  const destRaw = operands.pop();
  const destAbs = resolve(state, destRaw);
  const destNode = getNode(state.fs, destAbs);
  if (operands.length > 1 && destNode?.type !== 'dir') return fail(`mv: 目标 ${destRaw} 不是目录`);
  const errors = [];
  for (const srcRaw of operands) {
    const srcAbs = resolve(state, srcRaw);
    const src = getNode(state.fs, srcAbs);
    if (!src) { errors.push(`mv: cannot stat '${srcRaw}': No such file or directory`); continue; }
    const targetAbs = destNode?.type === 'dir' ? `${destAbs}/${baseOf(srcAbs)}` : destAbs;
    const targetParent = getNode(state.fs, parentOf(targetAbs));
    if (!targetParent || targetParent.type !== 'dir') { errors.push(`mv: cannot move '${srcRaw}': No such file or directory`); continue; }
    const srcParent = getNode(state.fs, parentOf(srcAbs));
    if (!hasPerm(srcParent, state.user, 'w') || !hasPerm(targetParent, state.user, 'w')) { errors.push(`mv: cannot move '${srcRaw}': Permission denied`); continue; }
    if (targetAbs === srcAbs) { errors.push(`mv: '${srcRaw}' 与目标相同`); continue; }
    if (src.type === 'dir' && targetAbs.startsWith(`${srcAbs}/`)) { errors.push(`mv: cannot move '${srcRaw}' 到自身子目录 '${targetAbs}'`); continue; }
    // 目标位置已有同名项且类型不同（如文件撞目录）时报错，避免 copy 静默失败后源已被删
    const existingTarget = getNode(state.fs, targetAbs);
    if (existingTarget && existingTarget.type !== src.type) {
      errors.push(`mv: cannot move '${srcRaw}': 目标已存在同名${existingTarget.type === 'dir' ? '目录' : '文件'}`);
      continue;
    }
    copyNode(state.fs, src, targetAbs);
    removeNode(state.fs, srcAbs);
  }
  return { code: errors.length ? 1 : 0, stdout: '', stderr: errors.join('\n') };
}
```

- [ ] **Step 4: 全量测试**

Run: `npm test`
Expected: 97 个用例全部通过（原 mv 用例 + 2 个新用例）

- [ ] **Step 5: 输出提交命令（用户执行）**

```powershell
git add src/lib/shell/commands.mjs tests/commands.test.mjs
git commit -m "feat: mv 支持多源移入目录，拦截自嵌套与类型冲突"
```

---
