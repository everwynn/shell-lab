### Task 5: 第 5 章 challenge 六关 + 章节汇入

**Files:**
- Create: `src/lib/shell/levels/challenge.mjs`
- Modify: `src/lib/shell/levels/index.mjs`（CHAPTERS 加 challenge，LEVELS 追加）
- Test: `tests/levels.test.mjs`（24 → 30、nextLevel 边界）

**Interfaces:**
- Consumes: Task 1/2/3 的新命令与 mv 多源；`mkdir -p` 多参数、`touch` 多参数、`chmod` 多参数。
- Produces: 6 个 `challenge-*` 关卡；`CHAPTERS` 第 5 项 `{ id: 'challenge', title: '挑战工坊', ... }`；`LEVELS` 以 challenge 收尾。

- [ ] **Step 1: 写章节数据**

创建 `src/lib/shell/levels/challenge.mjs`：

```js
export default [
  {
    id: 'challenge-1',
    chapter: 'challenge',
    title: '搭建项目骨架',
    brief: '从空目录开始：建 web/src 与 web/assets 两个目录，放空的 web/src/app.js、web/src/style.css、web/assets/.keep 和 web/README.md。',
    setup: { cwd: '/home/me', files: {} },
    goals: [
      { kind: 'file-exists', path: '~/web/src/app.js' },
      { kind: 'file-exists', path: '~/web/src/style.css' },
      { kind: 'file-exists', path: '~/web/assets/.keep' },
      { kind: 'file-exists', path: '~/web/README.md' },
    ],
    hints: ['mkdir -p 一次建多级目录，touch 一次建多个空文件', 'mkdir -p web/src web/assets；touch web/src/app.js web/src/style.css web/assets/.keep web/README.md'],
    demo: ['mkdir -p web/src web/assets', 'touch web/src/app.js web/src/style.css web/assets/.keep web/README.md'],
  },
  {
    id: 'challenge-2',
    chapter: 'challenge',
    title: '整理乱目录',
    brief: '把 mess 里的 .jpg 全部移进 mess/images/，.txt 全部移进 mess/docs/，keep.md 留在原处。',
    setup: { cwd: '/home/me', files: { 'mess/pic1.jpg': '', 'mess/pic2.jpg': '', 'mess/note1.txt': 'a\n', 'mess/note2.txt': 'b\n', 'mess/keep.md': '# k\n' } },
    goals: [
      { kind: 'file-exists', path: '~/mess/images/pic1.jpg' },
      { kind: 'file-exists', path: '~/mess/images/pic2.jpg' },
      { kind: 'file-exists', path: '~/mess/docs/note1.txt' },
      { kind: 'file-exists', path: '~/mess/docs/note2.txt' },
      { kind: 'file-absent', path: '~/mess/pic1.jpg' },
      { kind: 'file-exists', path: '~/mess/keep.md' },
    ],
    hints: ['先建目标目录，再用通配符一次移动多个文件', 'mkdir -p mess/images mess/docs；mv mess/*.jpg mess/images/；mv mess/*.txt mess/docs/'],
    demo: ['mkdir -p mess/images mess/docs', 'mv mess/*.jpg mess/images/', 'mv mess/*.txt mess/docs/'],
  },
  {
    id: 'challenge-3',
    chapter: 'challenge',
    title: '生成部署清单',
    brief: 'release 里只挑出 app 开头的文件，生成 release/deploy.txt（每行一个，共 2 行）。',
    setup: { cwd: '/home/me', files: { 'release/app.js': '', 'release/app.css': '', 'release/config.local.json': '{}', 'release/README.md': 'r\n' } },
    goals: [
      { kind: 'file-exists', path: '~/release/deploy.txt' },
      { kind: 'file-contains', path: '~/release/deploy.txt', pattern: 'app.js' },
      { kind: 'file-contains', path: '~/release/deploy.txt', pattern: 'app.css' },
      { kind: 'file-lines', path: '~/release/deploy.txt', count: 2 },
    ],
    hints: ['ls 的输出可以接管道给 grep，再把结果重定向到文件', 'ls release | grep app > release/deploy.txt'],
    demo: ['ls release | grep app > release/deploy.txt', 'cat release/deploy.txt'],
  },
  {
    id: 'challenge-4',
    chapter: 'challenge',
    title: '权限审计',
    brief: 'scripts 下两个 .sh 权限过宽（777），收紧到只有自己能读写执行（700）；README.md 保持 644 不动。',
    setup: { cwd: '/home/me', files: { 'scripts/deploy.sh': { content: '#!/bin/sh\n', mode: 0o777 }, 'scripts/build.sh': { content: '#!/bin/sh\n', mode: 0o777 }, 'scripts/README.md': 'r\n' } },
    goals: [
      { kind: 'mode-is', path: '~/scripts/deploy.sh', mode: 0o700 },
      { kind: 'mode-is', path: '~/scripts/build.sh', mode: 0o700 },
      { kind: 'mode-is', path: '~/scripts/README.md', mode: 0o644 },
    ],
    hints: ['chmod 的数字模式：700 = 自己 rwx，其他人无权限', 'chmod 700 scripts/deploy.sh scripts/build.sh'],
    demo: ['ls -l scripts', 'chmod 700 scripts/deploy.sh scripts/build.sh', 'ls -l scripts'],
  },
  {
    id: 'challenge-5',
    chapter: 'challenge',
    title: '错误汇总',
    brief: '把 app.log 里的 ERROR 行按「次数 + 内容」汇总进 summary.txt，按次数从多到少。',
    setup: { cwd: '/home/me', files: { 'app.log': 'ERROR db\nWARN cpu\nERROR db\nERROR net\nWARN cpu\n' } },
    goals: [
      { kind: 'file-exists', path: '~/summary.txt' },
      { kind: 'file-contains', path: '~/summary.txt', pattern: '2 ERROR db' },
      { kind: 'file-contains', path: '~/summary.txt', pattern: '1 ERROR net' },
    ],
    hints: ['先 grep ERROR，再 sort | uniq -c 统计', "grep ERROR app.log | sort | uniq -c | sort -rn > summary.txt"],
    demo: ["grep ERROR app.log | sort | uniq -c | sort -rn > summary.txt", 'cat summary.txt'],
  },
  {
    id: 'challenge-6',
    chapter: 'challenge',
    title: '全流程复原',
    brief: '从 template/config.txt 出发搭出 site：site/index.html（内容一行 <h1>hi</h1>）、site/assets/.keep、site/config.txt（复制模板）、site/start.sh（权限 700）。',
    setup: { cwd: '/home/me', files: { 'template/config.txt': 'port=8080\n' } },
    goals: [
      { kind: 'file-contains', path: '~/site/index.html', pattern: '<h1>hi</h1>' },
      { kind: 'file-exists', path: '~/site/assets/.keep' },
      { kind: 'file-contains', path: '~/site/config.txt', pattern: 'port=8080' },
      { kind: 'mode-is', path: '~/site/start.sh', mode: 0o700 },
    ],
    hints: ['先建目录，再写文件、复制、改权限', "mkdir -p site/assets；echo '<h1>hi</h1>' > site/index.html；touch site/assets/.keep；cp template/config.txt site/config.txt；touch site/start.sh；chmod 700 site/start.sh"],
    demo: ['mkdir -p site/assets', "echo '<h1>hi</h1>' > site/index.html", 'touch site/assets/.keep', 'cp template/config.txt site/config.txt', 'touch site/start.sh', 'chmod 700 site/start.sh'],
  },
];
```

- [ ] **Step 2: 汇入 index.mjs**

`src/lib/shell/levels/index.mjs` 再加：

```js
import challengeLevels from './challenge.mjs';

export const CHAPTERS = [
  { id: 'files', title: '文件与目录', description: 'pwd、ls、cd、mkdir、cp、mv、rm 与通配符' },
  { id: 'text', title: '文本与管道', description: 'cat、echo、grep、head、tail、wc 与 | > >>' },
  { id: 'perms', title: '权限与用户', description: 'chmod、chown 与 644/755/775 这些数字' },
  { id: 'search', title: '查找与统计', description: 'find、sort、uniq、cut 与日志分析' },
  { id: 'challenge', title: '挑战工坊', description: '只用已学命令的综合实战' },
];

export const LEVELS = [...filesLevels, ...textLevels, ...permsLevels, ...searchLevels, ...challengeLevels];
```

- [ ] **Step 3: 更新 levels 测试**

```js
test('结构：30 关、id 唯一、每章 6 关、两级提示', () => {
  assert.equal(LEVELS.length, 30);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, 30);
```

工具函数测试改为：

```js
test('工具函数：getLevel / nextLevel / prevLevel', () => {
  assert.equal(getLevel('files-1').chapter, 'files');
  assert.equal(getLevel('nope'), null);
  assert.equal(nextLevel('files-1').id, 'files-2');
  assert.equal(prevLevel('files-1'), null);
  assert.equal(nextLevel('perms-6').id, 'search-1');
  assert.equal(nextLevel('search-6').id, 'challenge-1');
  assert.equal(nextLevel('challenge-6'), null);
});
```

- [ ] **Step 4: 全量测试**

Run: `npm test`
Expected: 全部通过（新增 12 个 challenge 关卡用例）

- [ ] **Step 5: 输出提交命令（用户执行）**

```powershell
git add src/lib/shell/levels/challenge.mjs src/lib/shell/levels/index.mjs tests/levels.test.mjs
git commit -m "feat: 新增第 5 章挑战工坊 6 关"
```

---
