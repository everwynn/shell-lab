### Task 6: UI 接线（移动端快捷条 + 首页文案）

**Files:**
- Modify: `src/components/TerminalPanel.vue:18-22`（QUICK 加 search / challenge 两项）
- Modify: `src/pages/index.astro:12`（「三章」硬编码改为动态）

**Interfaces:**
- Consumes: `LevelRunner.vue:64` 已把 `level.chapter` 传给 `TerminalPanel` 的 `chapter` prop；`index.astro` frontmatter 已导入 `CHAPTERS` / `LEVELS`。
- Produces: 新章关卡页在 <sm 宽度下显示对应快捷条；首页文案显示「5 章 30 关」。快捷条容器是 `flex flex-wrap`（`TerminalPanel.vue:113`），8-9 个按钮在 375px 下自动换行，无需改样式。

- [ ] **Step 1: 更新 QUICK 预设**

把 `TerminalPanel.vue` 中的 QUICK 整块替换为：

```js
const QUICK = {
  files: ['ls', 'cd', 'pwd', 'mkdir', 'cp', 'mv', 'rm', '|', '>', '~'],
  text: ['cat', 'grep', 'wc', 'head', 'tail', '|', '>', '>>', '~'],
  perms: ['ls -l', 'chmod', 'chown', '600', '644', '700', '755', '775', '~'],
  search: ['find', 'sort', 'uniq', 'cut', '|', '>', '"*.log"', '~'],
  challenge: ['ls', 'mkdir', 'touch', 'mv', 'chmod', 'grep', '|', '>', '~'],
};
```

- [ ] **Step 2: 首页文案动态化**

`src/pages/index.astro` 第 12 行原文：

```text
    浏览器里的 Linux 命令练习场：真敲命令、真看输出、真判对错。三章 {LEVELS.length} 关，从文件操作到权限。
```

替换为：

```text
    浏览器里的 Linux 命令练习场：真敲命令、真看输出、真判对错。{CHAPTERS.length} 章 {LEVELS.length} 关，从文件操作到日志统计。
```

（章节卡片网格 `sm:grid-cols-3` 不改：5 张卡自动折行为 3+2，网格等高、视觉整齐。）

- [ ] **Step 3: 类型检查与构建**

Run: `npm run check; npm run build`
Expected: `0 errors`；构建产物比上版多 12 个关卡页（22 → 34 个 HTML 页）。核对命令：

```powershell
(Get-ChildItem dist -Recurse -Filter index.html).Count
```

- [ ] **Step 4: 输出提交命令（用户执行）**

```powershell
git add src/components/TerminalPanel.vue src/pages/index.astro
git commit -m "feat: 新章节接入移动端快捷条与首页文案"
```

---
