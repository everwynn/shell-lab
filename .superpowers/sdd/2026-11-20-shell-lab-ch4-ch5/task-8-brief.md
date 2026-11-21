### Task 8: 全量回归 + 浏览器端到端验收 + 交付

**Files:** 无代码改动。任一步失败时回到对应 Task 修复后重跑本 Task。

**Interfaces:**
- Consumes: Task 1-7 的全部产物。
- Produces: 验收报告（测试数、页面数、sitemap URL 数、逐关通关记录、console 状态）+ 用户部署指令。

- [ ] **Step 1: 全量测试**

Run: `npm test`
Expected: 121 个用例全部通过（84 存量 + Task 1 的 5 + Task 2 的 6 + Task 3 的 2 + 两章各 12）。

- [ ] **Step 2: 类型检查与构建**

Run: `npm run check; npm run build`
Expected: `0 errors`；34 个 HTML 页。

- [ ] **Step 3: 启动 preview 并用浏览器验收**

Run: `npm run preview`（默认 4321；被占用则 `npm run preview -- --port 4331`，以实际输出为准）

用 chrome-devtools 技能（`new_page` 打开 `http://localhost:4321/shell-lab/`）逐项核对：

1. **首页**：文案「5 章 30 关」；5 张章节卡（新增「查找与统计」「挑战工坊」，描述分别为「find、sort、uniq、cut 与日志分析」「只用已学命令的综合实战」）；每卡初始进度 `0 / 6`。
2. **search-1 通关**：打开 `/shell-lab/lessons/search-1/`，输入 `find . -name "*.log"` 回车，任务打勾、出现「下一关」；localStorage 进度含 `search-1`。
3. **search-6 通关**：输入 `grep ERROR access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn > report.txt` 回车，再 `cat report.txt`，两条目标打勾。
4. **challenge-2 通关**：依次输入 `mkdir -p mess/images mess/docs`、`mv mess/*.jpg mess/images/`、`mv mess/*.txt mess/docs/`，6 条目标全勾（重点验证 mv 通配多源）。
5. **challenge-6 通关**：按 demo 6 条命令逐条输入（含 `echo '<h1>hi</h1>' > site/index.html` 引号内 `>` 不触发重定向），4 条目标全勾。
6. **首页进度回显**：返回首页，5 张卡进度分别为 `0/6`、`0/6`、`0/6`、`2/6`（search-1、search-6 已过）、`2/6`（challenge-2、challenge-6 已过）；「继续」链接指向下一关。
7. **375px 移动端**：`emulate` viewport `375x812x2,mobile,touch`，打开 search-1，快捷条含 `find` / `sort` / `uniq` / `cut` 按钮且可点击插入；无横向滚动条。
8. **console 与网络**：`list_console_messages` 0 条；`/shell-lab/favicon.svg` 200。

- [ ] **Step 4: 校验 sitemap 与 robots**

```powershell
cd shell-lab; node -e "const s=require('fs').readFileSync('dist/sitemap.xml','utf8');console.log((s.match(/<url>/g)||[]).length)"
```

Expected: `33`（首页 + lessons + about + 30 关）。robots.txt 仍指向 sitemap。

- [ ] **Step 5: 停止 preview 并输出交付说明（用户执行部署）**

停掉 preview 进程。门户（everwynn.github.io）无需改动：shell-lab 条目描述不含章节数字，站点注册与排序不受影响。

```powershell
cd shell-lab; git push
```

push 后 GitHub Actions (`deploy.yml`) 自动 test → check → build → deploy；线上复查 https://everwynn.github.io/shell-lab/ 首页显示「5 章 30 关」即可交付。

---
