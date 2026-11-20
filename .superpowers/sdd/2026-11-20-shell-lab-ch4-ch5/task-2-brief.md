### Task 2: globToRegExp 上移 + find 命令

**Files:**
- Modify: `src/lib/shell/vfs.mjs`（新增导出 `globToRegExp`）
- Modify: `src/lib/shell/execute.mjs`（删除本地 `globToRegExp`，改从 vfs 导入）
- Modify: `src/lib/shell/commands.mjs`（新增 `find`，导入 `globToRegExp`）
- Test: `tests/commands.test.mjs`

**Interfaces:**
- Consumes: 现有 `resolvePath` / `getNode` / `hasPerm` / `dirNames`。
- Produces: `find [path] [-name <glob>] [-type f|d]`；输出保留用户输入的路径前缀（`find .` → `./x`）；遍历目录要求 r+x，无权限分支跳过；起点无权限报 `Permission denied`。`globToRegExp(pattern)` 从 `vfs.mjs` 导出（execute.mjs 同步改导入，行为不变）。

- [ ] **Step 1: 写失败测试**

在 `tests/commands.test.mjs` 末尾追加：

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/commands.test.mjs`
Expected: FAIL（3 个 find 用例：`find: 本练习场暂不支持该命令`）

- [ ] **Step 3: 上移 globToRegExp 并实现 find**

`vfs.mjs` 末尾追加：

```js
/** glob 模式（* / ?）转正则；供 execute 的通配符展开与 find -name 共用。 */
export function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}
```

`execute.mjs`：删除本地 `function globToRegExp(...)` 定义，并把导入行改为：

```js
import { dirNames, getNode, globToRegExp, hasPerm, resolvePath, writeFile } from './vfs.mjs';
```

`commands.mjs`：导入行加入 `globToRegExp`（保持字母序），在 `cut` 之后插入：

```js
function find(state, args) {
  let rootRaw = '.';
  let namePattern = null;
  let typeFilter = null;
  const operands = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-name') {
      namePattern = args[index + 1];
      if (namePattern === undefined) return fail('find: -name 需要一个模式');
      index += 1;
    } else if (arg === '-type') {
      typeFilter = args[index + 1];
      if (typeFilter !== 'f' && typeFilter !== 'd') return fail("find: -type 只支持 'f' 或 'd'");
      index += 1;
    } else if (arg.startsWith('-')) return fail(`find: 暂不支持该选项 '${arg}'`);
    else operands.push(arg);
  }
  if (operands.length > 1) return fail('find: 只支持一个起始路径');
  if (operands.length === 1) rootRaw = operands[0];
  const rootAbs = resolve(state, rootRaw);
  const root = getNode(state.fs, rootAbs);
  if (!root) return fail(`find: '${rootRaw}': No such file or directory`);
  if (root.type === 'dir' && !(hasPerm(root, state.user, 'r') && hasPerm(root, state.user, 'x'))) {
    return fail(`find: '${rootRaw}': Permission denied`);
  }
  const matcher = namePattern === null ? null : globToRegExp(namePattern);
  const prefix = rootRaw.replace(/\/+$/, '') || '.';
  const lines = [];
  const matched = (node, name) => {
    if (matcher && !matcher.test(name)) return false;
    if (typeFilter && node.type !== (typeFilter === 'f' ? 'file' : 'dir')) return false;
    return true;
  };
  const walk = (node, name, path) => {
    if (matched(node, name)) lines.push(path);
    if (node.type !== 'dir') return;
    for (const childName of dirNames(node)) {
      const child = node.children[childName];
      if (child.type === 'dir' && !(hasPerm(child, state.user, 'r') && hasPerm(child, state.user, 'x'))) continue;
      walk(child, childName, `${path}/${childName}`);
    }
  };
  walk(root, baseOf(rootAbs), prefix);
  return ok(lines.length ? `${lines.join('\n')}\n` : '');
}
```

更新白名单，把 find 加入：

```js
export const COMMANDS = { pwd, ls, cd, mkdir, touch, rm, cp, mv, cat, echo, grep, head, tail, wc, sort, uniq, cut, find, chmod, chown, clear, help };
```

- [ ] **Step 4: 全量测试**

Run: `npm test`
Expected: 全部通过（execute 的 9 个测试不受 globToRegExp 迁移影响）

- [ ] **Step 5: 输出提交命令（用户执行）**

```powershell
git add src/lib/shell/vfs.mjs src/lib/shell/execute.mjs src/lib/shell/commands.mjs tests/commands.test.mjs
git commit -m "feat: 新增 find 命令，glob 工具上移到 vfs"
```

---
