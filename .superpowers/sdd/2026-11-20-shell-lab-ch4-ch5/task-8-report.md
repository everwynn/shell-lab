# Task 8 报告：全量回归 + 浏览器端到端验收 + 交付

日期：2026-11-21
任务来源：`docs/superpowers/plans/2026-11-20-shell-lab-ch4-ch5.md` Task 8（brief：`task-8-brief.md`）

## Step 1: 全量测试

```
node --test tests/
# tests 121 / pass 121 / fail 0
```

构成核对：84 存量 + Task 1 的 5 + Task 2 的 6 + Task 3 的 2 + 两章各 12 = 121，与计划一致。

## Step 2: 类型检查与构建

```
npm run check   # 0 errors / 0 warnings
npm run build   # 34 页（dist/**/index.html 共 33 个 + sitemap/robots 等）
```

`dist/index.html` 计数 33（首页 + lessons + about + 30 关），与计划一致。

## Step 3: 浏览器端到端验收

preview 实际端口：4321/4322 被占用，落到 **4323**（`http://localhost:4323/shell-lab/`）。逐项结果：

| # | 检查项 | 结果 |
|---|---|---|
| 1 | 首页文案「5 章 30 关」+ 5 张章节卡（查找与统计 / 挑战工坊） | ✅ 文案与描述均正确；清空 localStorage 后为 0/6 |
| 2 | search-1 通关（`find . -name "*.log"`） | ✅ 目标打勾、出现「下一关」；localStorage 含 `search-1` |
| 3 | search-6 通关（五段管道 + `cat report.txt`） | ✅ `3 10.0.0.3` / `2 10.0.0.1` 两条目标全勾 |
| 4 | challenge-2 通关（mkdir -p + mv 通配多源 ×2） | ✅ 9/9 目标全勾（4 exists + 4 absent + keep.md）；pic1/pic2 移入 images 且源被删除 |
| 5 | challenge-6 通关（6 条 demo 逐条输入） | ✅ 4/4 目标全勾；引号内 `<h1>` 未触发重定向 |
| 6 | 首页进度回显 | ✅ search `2/6`、challenge `2/6`；「继续」指向首个未通关关卡（本次为 files-1，属预期 fallback） |
| 7 | 375px 移动端 | ✅ viewport 375×812×2 mobile+touch：`scrollWidth == innerWidth == 375`（无横向滚动）；快捷条含 `find`/`sort`/`uniq`/`cut`；点击插入实测有效（find → `find`，再点 sort 追加为 `findsort`，按光标位置插入为既有行为） |
| 8 | console 与网络 | ✅ console 0 条（含最近 3 次导航保留消息）；`/shell-lab/favicon.svg` 200 `image/svg+xml` |

进度快照：`shell-lab:progress:v1 = ["search-1","search-6","challenge-2","challenge-6"]`。

### 验收过程记录（方法学）

- 合成 DOM 事件（dispatchEvent input + keydown Enter）在 Vue 岛上存在水合竞态：首次进入关卡后立即合成输入会丢事件（未水合）；等待 ~1500ms 后可行。
- challenge-2/challenge-6 改用 chrome-devtools 真实 `fill` + `press_key`，稳定通过。结论：验收应以真实输入为准。

## Step 4: sitemap 与 robots

```
node -e "...dist/sitemap.xml..."
# 33
```

robots.txt 仍指向 `https://everwynn.github.io/shell-lab/sitemap.xml` ✅。

## Step 5: 停止 preview 与交付

- preview（PID 44824，端口 4323）已停止，`localhost:4323` 返回 ECONNREFUSED ✅。
- 门户（everwynn.github.io）无需改动：shell-lab 条目描述不含章节数字。

## 偏离与处置

1. **brief 第 4 项「6 条目标」已过期**：Task 5 修复轮曾为 challenge-2 追加 3 条 file-absent（防止 cp 代替 mv 蒙混），实际为 9 条。计划 Task 8 第 4 项已同步为「9 条目标（4 exists + 4 absent + keep.md）」。
2. **brief 第 6 项「指向下一关」**：本应用取「首个未通关关卡」，跨关验收时为 files-1。计划已补充说明，属预期行为而非缺陷。
3. preview 端口为 4323（计划允许以实际输出为准）。

## 结论

Task 8 全部检查项通过，无代码改动。交付动作：用户自行 `git push`，GitHub Actions 自动 test → check → build → deploy；线上复查首页「5 章 30 关」即可。
