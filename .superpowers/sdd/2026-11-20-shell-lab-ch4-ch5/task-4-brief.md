### Task 4: 第 4 章 search 六关 + 章节汇入

**Files:**
- Create: `src/lib/shell/levels/search.mjs`
- Modify: `src/lib/shell/levels/index.mjs`（CHAPTERS 加 search，LEVELS 追加）
- Test: `tests/levels.test.mjs`（18 → 24、nextLevel 边界）

**Interfaces:**
- Consumes: 关卡结构 `{ id, chapter, title, brief, setup, goals, hints, demo }`；断言 `output-contains` / `file-exists` / `file-contains` / `file-lines`。
- Produces: 6 个 `search-*` 关卡；`CHAPTERS` 第 4 项 `{ id: 'search', title: '查找与统计', ... }`。demo 必须能通过三重校验的「金样例」步骤。

- [ ] **Step 1: 写章节数据**

创建 `src/lib/shell/levels/search.mjs`：

```js
export default [
  {
    id: 'search-1',
    chapter: 'search',
    title: '按名字找文件',
    brief: 'project 里散落着几个日志文件，用 find 把当前目录下所有 .log 文件找出来。',
    setup: { cwd: '/home/me', files: { 'project/src/app.log': 'INFO\n', 'project/docs/guide.md': '# 指南\n', 'project/logs/2026/app.log': 'WARN\n', 'project/notes.txt': 'n\n', 'scratch/tmp.log': 'X\n' } },
    goals: [{ kind: 'output-contains', pattern: '2026/app.log' }],
    hints: ['find 从指定目录向下递归，-name 按名字过滤', 'find . -name "*.log"'],
    demo: ['find . -name "*.log"'],
  },
  {
    id: 'search-2',
    chapter: 'search',
    title: '只找目录',
    brief: '用 find 列出当前目录下的所有目录（文件不算）。',
    setup: { cwd: '/home/me', files: { 'project/src/components/.keep': '', 'project/src/lib/.keep': '', 'project/docs/.keep': '', 'project/dist/.keep': '', 'project/README.md': '# p\n' } },
    goals: [{ kind: 'output-contains', pattern: 'src/components' }],
    hints: ['-type d 只看目录，-type f 只看文件', 'find . -type d'],
    demo: ['find . -type d'],
  },
  {
    id: 'search-3',
    chapter: 'search',
    title: '排一排',
    brief: 'names.txt 是乱序的，把排好序的内容写进 sorted.txt。',
    setup: { cwd: '/home/me', files: { 'names.txt': 'pear\napple\norange\nbanana\n' } },
    goals: [
      { kind: 'file-exists', path: '~/sorted.txt' },
      { kind: 'file-lines', path: '~/sorted.txt', count: 4 },
      { kind: 'file-contains', path: '~/sorted.txt', pattern: 'apple\nbanana' },
    ],
    hints: ['sort 按行排序，> 把输出写进文件', 'sort names.txt > sorted.txt'],
    demo: ['sort names.txt > sorted.txt', 'cat sorted.txt'],
  },
  {
    id: 'search-4',
    chapter: 'search',
    title: '去重计数',
    brief: 'errors.log 里同样的报错出现了多次，统计每种报错出现的次数（例如输出里应出现 3 Timeout）。',
    setup: { cwd: '/home/me', files: { 'errors.log': 'Timeout\nDisk full\nTimeout\nPermission denied\nTimeout\nDisk full\n' } },
    goals: [{ kind: 'output-contains', pattern: '3 Timeout' }],
    hints: ['uniq 只合并相邻的重复行，先 sort 让相同的行挨在一起', 'sort errors.log | uniq -c'],
    demo: ['sort errors.log | uniq -c'],
  },
  {
    id: 'search-5',
    chapter: 'search',
    title: '取出某一列',
    brief: 'access.log 每行是「IP 日期 状态」，只把 IP 那一列打印出来。',
    setup: { cwd: '/home/me', files: { 'access.log': '10.0.0.1 2026-11-20 ERROR\n10.0.0.2 2026-11-20 INFO\n10.0.0.1 2026-11-20 WARN\n' } },
    goals: [{ kind: 'output-contains', pattern: '10.0.0.1\n10.0.0.2' }],
    hints: ['cut 用 -d 指定分隔符、-f 指定第几列（从 1 开始），空格分隔符要加引号', "cut -d' ' -f1 access.log"],
    demo: ["cut -d' ' -f1 access.log"],
  },
  {
    id: 'search-6',
    chapter: 'search',
    title: '挑战：访问报表',
    brief: '从 access.log 统计每个 IP 的 ERROR 次数，按次数从多到少写入 report.txt（应出现 3 10.0.0.3）。',
    setup: { cwd: '/home/me', files: { 'access.log': '10.0.0.3 2026-11-20 ERROR\n10.0.0.1 2026-11-20 ERROR\n10.0.0.3 2026-11-20 ERROR\n10.0.0.1 2026-11-20 INFO\n10.0.0.3 2026-11-20 ERROR\n10.0.0.2 2026-11-20 ERROR\n10.0.0.1 2026-11-20 ERROR\n' } },
    goals: [
      { kind: 'file-exists', path: '~/report.txt' },
      { kind: 'file-contains', path: '~/report.txt', pattern: '3 10.0.0.3' },
    ],
    hints: ['按顺序组合：grep ERROR → cut 取 IP → sort → uniq -c → sort -rn', "grep ERROR access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn > report.txt"],
    demo: ["grep ERROR access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn > report.txt", 'cat report.txt'],
  },
];
```

- [ ] **Step 2: 汇入 index.mjs**

`src/lib/shell/levels/index.mjs` 改为：

```js
import filesLevels from './files.mjs';
import textLevels from './text.mjs';
import permsLevels from './perms.mjs';
import searchLevels from './search.mjs';

export const CHAPTERS = [
  { id: 'files', title: '文件与目录', description: 'pwd、ls、cd、mkdir、cp、mv、rm 与通配符' },
  { id: 'text', title: '文本与管道', description: 'cat、echo、grep、head、tail、wc 与 | > >>' },
  { id: 'perms', title: '权限与用户', description: 'chmod、chown 与 644/755/775 这些数字' },
  { id: 'search', title: '查找与统计', description: 'find、sort、uniq、cut 与日志分析' },
];

export const LEVELS = [...filesLevels, ...textLevels, ...permsLevels, ...searchLevels];
```

（`chapterLevels` / `getLevel` / `nextLevel` / `prevLevel` 保持不变。）

- [ ] **Step 3: 更新 levels 测试**

`tests/levels.test.mjs`：

```js
test('结构：24 关、id 唯一、每章 6 关、两级提示', () => {
  assert.equal(LEVELS.length, 24);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, 24);
```

并把工具函数测试改为：

```js
test('工具函数：getLevel / nextLevel / prevLevel', () => {
  assert.equal(getLevel('files-1').chapter, 'files');
  assert.equal(getLevel('nope'), null);
  assert.equal(nextLevel('files-1').id, 'files-2');
  assert.equal(prevLevel('files-1'), null);
  assert.equal(nextLevel('perms-6').id, 'search-1');
  assert.equal(nextLevel('search-6'), null);
});
```

- [ ] **Step 4: 运行测试**

Run: `npm test`
Expected: 全部通过（新增 12 个关卡用例：search-1..6 各 2 个）

- [ ] **Step 5: 输出提交命令（用户执行）**

```powershell
git add src/lib/shell/levels/search.mjs src/lib/shell/levels/index.mjs tests/levels.test.mjs
git commit -m "feat: 新增第 4 章查找与统计 6 关"
```

---
