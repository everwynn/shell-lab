# SDD ledger — plan: shell-lab/docs/superpowers/plans/2026-11-20-shell-lab-ch4-ch5.md

Spec: shell-lab/docs/superpowers/specs/2026-11-20-shell-lab-ch4-ch5-design.md（已读，作为裁决依据）

## Rulings（环境与流程）

- Ruling: 不创建 git worktree，直接在 shell-lab 工作树实现 — 用户硬约束「助手不执行任何 git 命令」（含只读），且此前 12 个 Task 均由用户在 main 手动提交 — 若需回滚由用户 git revert。
- Ruling: implementer 角色由主会话承担 — 当前环境 Agent 仅有 Browser/CodeReview/ComputerUse，无通用编码 subagent — 质量闸门保留：每 Task 后派 CodeReview subagent（current_session 模式）。
- Ruling: 任务评审不生成 git diff 包（review-package 脚本依赖 git），改由 CodeReview subagent 自行审查本会话变更 — 若 reviewer 需要对照，以其可见改动为准。
- Ruling: 每 Task 结束输出用户提交命令并等待（提交属外部副作用停止类）— 节奏与既有工作流一致。
- Ruling: 用户二次确认「git 提交/拉取/推送」等一律由用户本人执行，助手不操作 git（含只读命令尽量不用）— 后续派给 subagent 的提示词同步加入此约束。
- Ruling（更新节奏）: 用户指令「不用频繁询问了，直接继续按计划开始」— Task 3 提交后，Task 4-8 连续执行，不再逐任务停顿等提交；每个 Task 完成后在回复中给出一条可提交命令，用户可自行选择时机提交 — 代价：多个 Task 的改动可能被用户合并提交，不影响质量闸门（每 Task 仍派 CodeReview）。

## Pre-flight 扫描

| 任务对 | 共享文件/接口 | 检查结果 |
|---|---|---|
| T1×T2×T3 | commands.mjs、commands.test.mjs | 顺序执行；T2 白名单行含 T1 新增 3 命令（21 个）；T3 重写 mv 使用既有 helper（parentOf/baseOf/copyNode/removeNode）均存在 |
| T2×T4 | find 行为 ↔ search-1/2 demo | `-name "*.log"` 引号内通配仍会被 execute 展开；search-1 setup 保证 ~ 下无 .log → 字面量到达 find，金样例稳定。已记录为已知局限 |
| T3×T5 | mv 多源 ↔ challenge-2 | 错误消息「不是目录」在 T3 实现、T5 依赖；顺序一致 |
| T4×T5 | levels/index.mjs、levels.test.mjs | T5 正文基于 T4 之后状态（「再加」）；T4 的 24 关测试为过渡态，T5 改 30 关 |
| T4×T6、T5×T6 | chapter id ↔ QUICK key | 'search'/'challenge' 在关卡 chapter、CHAPTERS、QUICK 三处一致 |
| T6×T7 | README 命令清单 ↔ 白名单 | T1 后 21 命令（18+sort/uniq/cut），T2 后 22（+find）；T7 文档按最终 22 个同步（计划已修正） |
| T7×T8 | 文档数字 ↔ 验收 | 30 关 / 34 页 / 33 URL / 117 测试相互一致 |
| 各 Task 自洽 | 测试 ↔ 实现 ↔ 现有源码 | T1 测试期望与实现一致（sort 空输出空、uniq -c 单空格、cut 必填）；T2 前缀 ./ 与遍历顺序核对通过；T4/T5 十二关金样例对照「lastOutput=最后一条 demo」规则逐关核对通过；T7 引用的 README 行号/原文与实际文件一致 |

## Progress

### Task 1: sort / uniq / cut
- 实现：commands.mjs 新增 readText/linesOf/sort/uniq/cut，白名单 18→21；测试 +5（TDD：先 14/5 fail，后 19/0 pass）
- 评审：Spec ✅ / Quality approved（CodeReview subagent，current_session）
- Task 1: minor (deferred): sort 多文件拼接时前文件缺尾换行会与后文件首行粘连（当前关卡/夹具不触发）
- Task 1: minor (deferred): sort 多文件遇缺失文件即中止，未按 cat/ls 的「聚合 errors + 保留可用输出」风格
- Task 1: minor (deferred): sort 字典序用 localeCompare，与 vfs.dirNames 码点序不一致（建议改 a<b 比较，两处口径统一）
- Task 1: minor (fixed): 报告/计划中的白名单计数错误已修正（18→21，最终 22）

### Task 2: globToRegExp + find
- 实现：vfs 导出 globToRegExp；execute 改导入；commands 新增 find（白名单 21→22）；测试 +3（TDD：19/3 fail → 92/0 pass）
- 评审：Spec ✅ / Quality approved，但含 1 Important（引号内通配被提前展开）+ 2 Minor（find / 前缀、起点词干）
- Ruling: 采纳 Important #1 在本 Task 修复（原计划列为「另开任务」）— 理由：search 章核心教法依赖引号语义，spec 亦写「加引号更稳」，且修复面可控（tokenize 旁路字段，零破坏既有 deepEqual 断言）— 若判断有误，成本仅是 tokenize 返回值多一个字段，可无痛移除
- Task 2: fix round 1/5 (3 addressed, 0 open — 引号展开 / find 前缀 / 起点词干；tokenize/execute/commands 共 +3 测试，95 pass)
- Task 2: 复审 clean（scoped re-review：3 ADDRESSED，无新问题；95/0）
- Task 2: complete（待用户提交；计划已同步：Task 2 Files/测试/实现/提交命令、Self-Review 局限段、Task 6 QUICK 改 "*.log"、Task 8 总数 120）
- Task 2: 用户已提交（"提交好了"），进入 Task 3。

### Task 3: mv 多源
- 实现：mv 重写为 `mv 源... 目标`，多源非目录报 `mv: 目标 X 不是目录`；错误聚合、部分失败继续。
- TDD：首轮 23/1 fail → 96/96；守卫用例后 24/1 fail → 97/97。
- 任务评审（CodeReview current_session）：Spec ✅ / Quality approved；1 Important（brief 缺失）+ 3 Minor（自嵌套、copy 失败静默删源、分支缺测试）。
- Ruling: 4 条 findings 全部当场修复 — 同一函数同一风险面，修复总计约 10 行代码 + 1 个测试用例；不修则「mv * 目录」「文件撞目录」会在 ch5 challenge-2 的真实学员操作中丢数据/产生意外嵌套 — 若判断有误，成本仅为多一个守卫与断言，易回退。
- Task 3: fix round 1/5（4 条全部 ADDRESSED；附带修复 `mv x x` 删源问题；97 pass）
- Task 3: 复审 clean（scoped re-review：4 ADDRESSED，无新问题；97/0；PASS 可提交）
- Task 3: minor (deferred): copyNode 无返回值，目录递归内部同名类型冲突仍可能静默丢数据（既有限制，修复需改 copyNode 返回值，ch5 关卡不触发）
- 计划同步：Task 3 Step 1/3/4/5、Task 8 与 Self-Review 计数 121。
- Task 3: complete（待用户提交）

### Task 4: search 六关
- 实现：新增 levels/search.mjs（6 关）、index.mjs 加第 4 章、levels.test.mjs 改 24 关断言。
- 测试：109/109（+12）。
- 任务评审：Spec ✅ / Quality needs-fix；1 Important（search-6 降序未断言）+ 2 Minor（弱判定、首页栅格）。
- Ruling: Important 采纳当场修（goal 改两行断言，评审已实测错误变体 FAIL）；Minor #2 deferred（需 output-absent 断言类型）；Minor #3 转入 Task 6（栅格 sm:grid-cols-2 lg:grid-cols-4）。
- Task 4: fix round 1/5（109 pass）；待 scoped re-review。
- Task 4: 复审 clean（scoped re-review：Important ADDRESSED，两种错误变体 FAIL 实测；Minor #2 DEFERRED-OK、#3 TRANSFERRED-OK）；另收 2 条文案建议。
- Task 4: fix round 2（文案级）：search-6 brief 改为「前两行依次是 3 10.0.0.3 和 2 10.0.0.1」；report/ledger 栅格措辞与计划对齐（保持 sm:grid-cols-3）；计划同步。
- Task 4: complete（待用户提交）

### Task 5: challenge 六关
- 实现：新增 levels/challenge.mjs（6 关）、index.mjs 加第 5 章、levels.test.mjs 改 30 关断言。
- 前置核对：file-absent / mode-is 断言、setup {content,mode}、mkdir -p / touch / chmod 多参数均已支持。
- 测试：121/121（+12）。
- 待：任务评审 → 用户可自行提交（累计变更：Task 4 + Task 5 的 levels 文件与测试）。
- 任务评审：Spec ✅ / Quality needs-fix；2 Important（challenge-5 顺序未断言、challenge-2 仅 1/4 源配 file-absent）+ 2 Minor（首页文案→T6、challenge-6 内容同源局限→接受）。
- Ruling: 2 条 Important 当场修（均为断言加严，计划同步）；Minor #4 接受为已知边界（现有断言类型无非「内容同源」校验）。
- Task 5: fix round 1/5（121 pass）；待 scoped re-review。
- Task 5: fix round 1 复审：Important #2 ADDRESSED；Important #1 NOT ADDRESSED（种子巧合：降序=字典序，漏 sort -rn 仍过）；Minor #3 DEFERRED-OK、#4 ACCEPTED-OK。
- Task 5: fix round 2/5：challenge-5 改种子（net×2 / db×1，goal `2 ERROR net\n1 ERROR db`），四种变体中仅正确管道能过；计划同步；121/121。
- 待：scoped re-review（r2）。
- Task 5: 复审 r2 PASS：Important #1 ADDRESSED（4 种变体仅正确管道过）；121/121；report 旧种子措辞已修。
- Task 5: complete（待用户提交）

### Task 6 + Task 7: UI 接线与文档同步（合并执行，同属文案一致性风险面）
- QUICK 加 search/challenge；首页文案动态化（{CHAPTERS.length} 章 {LEVELS.length} 关）；栅格保持 3 列（计划口径）。
- README 4 处、about supported 22 个、项目总览一行。
- 验证：check 0 errors；build 34 页；index.html 33 个；无「三章/18 关」残留；121 测试全绿。
- 合并评审（CodeReview current_session）：Spec ✅ / Quality approved；1 Minor（README 第 3 行 tagline 仍旧口径）——已采纳，改为「分关卡练文件、文本、权限与日志统计」。
- Task 6+7: complete（待用户提交）

### Task 8: 全量回归 + 浏览器端到端验收 + 交付
- 无代码改动；产物为 task-8-report.md。
- 回归：121/121；check 0 errors；build 34 页（dist index.html 33）；sitemap 33 URL；robots 指向 sitemap。
- 浏览器验收 8/8 通过（preview 4323）：首页 5 章 30 关 + 5 卡；search-1 / search-6 / challenge-2（9 条目标）/ challenge-6 全通关；首页回显 search 2/6、challenge 2/6；375px 无横向滚动、快捷条 find/sort/uniq/cut 可插入；console 0 条；favicon 200。
- 方法学：合成事件在 Vue 岛有水合竞态，challenge-2/6 改用真实 fill + press_key 后稳定通过。
- Ruling: Task 8 不派评审 — 仅为验证与文档，无代码改动；验收报告即质量记录 — 若判断有误，成本仅是多一次评审调用的时间。
- brief 偏差 2 处已同步计划：challenge-2 目标数 6→9；「继续」为「首个未通关关卡」。
- preview 已停（端口 4323 ECONNREFUSED）。
- Task 8: complete。交付：用户自行 git push，Actions 自动部署；线上复查首页「5 章 30 关」。
- Ruling: 不再派最终全量复审 — Task 4/5/6+7 均经「评审 + 定向复审」双轮，Task 8 端到端验收覆盖了同一批文件；用户已就审查耗时提出疑问 — 若判断有误，成本为遗漏一处跨任务一致性问题（文档/计数已在 T6+7 评审中专项核对）。
