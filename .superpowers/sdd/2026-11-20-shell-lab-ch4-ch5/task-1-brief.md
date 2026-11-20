### Task 1: 行处理三命令 sort / uniq / cut

**Files:**
- Modify: `src/lib/shell/commands.mjs`（在 `wc` 之后、`applySymbolic` 之前插入三个命令与 `readText`/`linesOf` 辅助函数；更新 `COMMANDS` 白名单）
- Test: `tests/commands.test.mjs`

**Interfaces:**
- Consumes: `vfs.mjs` 的 `getNode` / `resolvePath` / `hasPerm`（commands.mjs 已导入）。
- Produces: `COMMANDS.sort/uniq/cut`，后续关卡与文档依赖其行为：
  - `sort [-r] [-n] [-rn] [file...]`：无文件读 `state.stdin`（空则输出空、code 0）
  - `uniq [-c] [file]`：只合并相邻重复；`-c` 输出 `count line`（单空格）
  - `cut -d<sep> -f<n> [file]`：`-d` 单字符必填、`-f` 1-based 必填；支持 `-d' '` 与 `-d ' '`、`-f1` 与 `-f 1`

- [ ] **Step 1: 写失败测试**

在 `tests/commands.test.mjs` 末尾追加（同时在文件顶部 import 区加 `runLine`）：

```js
import { runLine } from '../src/lib/shell/execute.mjs';
```

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/commands.test.mjs`
Expected: FAIL（`sort: 暂不支持` / 输出为空，4 个新用例失败）

- [ ] **Step 3: 实现三命令**

在 `commands.mjs` 的 `wc` 函数之后、`applySymbolic` 之前插入：

```js
function readText(state, raw, name) {
  const node = getNode(state.fs, resolve(state, raw));
  if (!node) return { error: fail(`${name}: ${raw}: No such file or directory`) };
  if (node.type !== 'file') return { error: fail(`${name}: ${raw}: Is a directory`) };
  if (!hasPerm(node, state.user, 'r')) return { error: fail(`${name}: ${raw}: Permission denied`) };
  return { text: node.content };
}

function linesOf(text) {
  const rows = text.split('\n');
  if (rows.at(-1) === '') rows.pop();
  return rows;
}

function sort(state, args) {
  let reverse = false;
  let numeric = false;
  const files = [];
  for (const arg of args) {
    if (arg === '-r') reverse = true;
    else if (arg === '-n') numeric = true;
    else if (arg === '-rn' || arg === '-nr') { reverse = true; numeric = true; }
    else if (arg.startsWith('-')) return fail(`sort: 暂不支持该选项 '${arg}'`);
    else files.push(arg);
  }
  let text = state.stdin ?? '';
  if (files.length) {
    text = '';
    for (const raw of files) {
      const read = readText(state, raw, 'sort');
      if (read.error) return read.error;
      text += read.text;
    }
  }
  const rows = linesOf(text);
  // sort -n 取行首数字前缀（"3 Timeout" 按 3 排），与真实 sort 的常见用法一致
  const num = (line) => {
    const match = /^\s*(-?\d+(?:\.\d+)?)/.exec(line);
    return match ? Number(match[1]) : 0;
  };
  rows.sort(numeric ? (a, b) => num(a) - num(b) : (a, b) => a.localeCompare(b));
  if (reverse) rows.reverse();
  return ok(rows.length ? `${rows.join('\n')}\n` : '');
}

function uniq(state, args) {
  let count = false;
  const files = [];
  for (const arg of args) {
    if (arg === '-c') count = true;
    else if (arg.startsWith('-')) return fail(`uniq: 暂不支持该选项 '${arg}'`);
    else files.push(arg);
  }
  if (files.length > 1) return fail('uniq: 一次只支持一个文件');
  let text = state.stdin ?? '';
  if (files.length) {
    const read = readText(state, files[0], 'uniq');
    if (read.error) return read.error;
    text = read.text;
  }
  const rows = linesOf(text);
  const out = [];
  let prev = null;
  let n = 0;
  for (const line of rows) {
    if (line === prev) { n += 1; continue; }
    if (prev !== null) out.push(count ? `${n} ${prev}` : prev);
    prev = line;
    n = 1;
  }
  if (prev !== null) out.push(count ? `${n} ${prev}` : prev);
  return ok(out.length ? `${out.join('\n')}\n` : '');
}

function cut(state, args) {
  let delim = null;
  let field = null;
  const files = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-d') { delim = args[index + 1] ?? ''; index += 1; }
    else if (arg.startsWith('-d')) delim = arg.slice(2);
    else if (arg === '-f') { field = Number(args[index + 1]); index += 1; }
    else if (arg.startsWith('-f')) field = Number(arg.slice(2));
    else if (arg.startsWith('-')) return fail(`cut: 暂不支持该选项 '${arg}'`);
    else files.push(arg);
  }
  if (!delim) return fail('cut: 缺少 -d 分隔符');
  if (delim.length !== 1) return fail('cut: -d 只支持单个字符');
  if (!Number.isInteger(field) || field < 1) return fail('cut: 缺少 -f 列号（从 1 开始）');
  if (files.length > 1) return fail('cut: 一次只支持一个文件');
  let text = state.stdin ?? '';
  if (files.length) {
    const read = readText(state, files[0], 'cut');
    if (read.error) return read.error;
    text = read.text;
  }
  const rows = linesOf(text);
  const out = rows.map((line) => line.split(delim)[field - 1] ?? '');
  return ok(out.length ? `${out.join('\n')}\n` : '');
}
```

更新白名单：

```js
export const COMMANDS = { pwd, ls, cd, mkdir, touch, rm, cp, mv, cat, echo, grep, head, tail, wc, sort, uniq, cut, chmod, chown, clear, help };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/commands.test.mjs`
Expected: 全部通过（19 个用例）

- [ ] **Step 5: 输出提交命令（用户执行）**

```powershell
git add src/lib/shell/commands.mjs tests/commands.test.mjs
git commit -m "feat: 新增 sort / uniq / cut 三个文本处理命令"
```

---
