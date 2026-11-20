# SDD ledger — plan: shell-lab/docs/superpowers/plans/2026-11-20-shell-lab-ch4-ch5.md

Spec: shell-lab/docs/superpowers/specs/2026-11-20-shell-lab-ch4-ch5-design.md（已读，作为裁决依据）

## Rulings（环境与流程）

- Ruling: 不创建 git worktree，直接在 shell-lab 工作树实现 — 用户硬约束「助手不执行任何 git 命令」（含只读），且此前 12 个 Task 均由用户在 main 手动提交 — 若需回滚由用户 git revert。
- Ruling: implementer 角色由主会话承担 — 当前环境 Agent 仅有 Browser/CodeReview/ComputerUse，无通用编码 subagent — 质量闸门保留：每 Task 后派 CodeReview subagent（current_session 模式）。
- Ruling: 任务评审不生成 git diff 包（review-package 脚本依赖 git），改由 CodeReview subagent 自行审查本会话变更 — 若 reviewer 需要对照，以其可见改动为准。
- Ruling: 每 Task 结束输出用户提交命令并等待（提交属外部副作用停止类）— 节奏与既有工作流一致。
- Ruling: 用户二次确认「git 提交/拉取/推送」等一律由用户本人执行，助手不操作 git（含只读命令尽量不用）— 后续派给 subagent 的提示词同步加入此约束。

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
