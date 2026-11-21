### Task 7: 文档同步（README / about / 项目总览）

**Files:**
- Modify: `README.md`（功能表、支持命令、目录结构共 4 处）
- Modify: `src/pages/about.astro:4`（supported 数组）
- Modify: `../项目总览.md:11`（workspace 根，shell-lab 仓库之外）

**Interfaces:**
- Consumes: 最终命令白名单（22 个：18 存量 + sort/uniq/cut/find）：`pwd ls cd mkdir touch rm cp mv cat echo grep head tail wc sort uniq cut find chmod chown clear help`。
- Produces: 站内外文档与实现一致，无「三章 18 关」残留。

- [ ] **Step 1: 更新 README 四处**

第 9 行原文：

```text
| 三章 18 关 | 文件与目录 / 文本与管道 / 权限与用户，每章 6 关（末关为挑战） |
```

替换为：

```text
| 五章 30 关 | 文件与目录 / 文本与管道 / 权限与用户 / 查找与统计 / 挑战工坊，每章 6 关（末关为挑战） |
```

第 15 行原文：

```text
支持命令：`pwd ls cd mkdir touch rm cp mv cat echo grep head tail wc chmod chown clear help`
```

替换为：

```text
支持命令：`pwd ls cd mkdir touch rm cp mv cat echo grep head tail wc sort uniq cut find chmod chown clear help`
```

第 34 行原文：

```text
src/lib/shell/    vfs / tokenize / commands / execute / assertions + levels 三章数据
```

替换为：

```text
src/lib/shell/    vfs / tokenize / commands / execute / assertions + levels 五章数据
```

第 36 行原文：

```text
src/pages/        首页 / lessons 总览 / [level] 18 关 / about / sitemap / robots
```

替换为：

```text
src/pages/        首页 / lessons 总览 / [level] 30 关 / about / sitemap / robots
```

- [ ] **Step 2: 更新 about 支持清单**

`src/pages/about.astro` 第 4 行原文：

```js
const supported = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'cat', 'echo', 'grep', 'head', 'tail', 'wc', 'chmod', 'chown', 'clear', 'help'];
```

替换为：

```js
const supported = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'cat', 'echo', 'grep', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'find', 'chmod', 'chown', 'clear', 'help'];
```

- [ ] **Step 3: 更新项目总览**

`../项目总览.md` 第 11 行原文：

```text
| [shell-lab](shell-lab/) | 浏览器里的 Linux 命令练习场：三章 18 关练文件、文本与权限，纯前端模拟终端，进度存 localStorage。 |
```

替换为：

```text
| [shell-lab](shell-lab/) | 浏览器里的 Linux 命令练习场：五章 30 关练文件、文本、权限与日志统计，纯前端模拟终端，进度存 localStorage。 |
```

- [ ] **Step 4: 验证无残留**

Run: `npm run check`
Expected: `0 errors`

```powershell
cd shell-lab; Select-String -Path README.md,src/pages/*.astro -Pattern '三章','18 关' -SimpleMatch
```

Expected: 无输出（无残留）。

- [ ] **Step 5: 输出提交命令（用户执行；项目总览在仓库外不需提交）**

```powershell
git add README.md src/pages/about.astro
git commit -m "docs: 同步五章 30 关与新命令清单"
```

---
