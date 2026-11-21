# Task 4 report — 第 4 章 search 六关

Status: DONE

## 变更
- 新增 `src/lib/shell/levels/search.mjs`：6 关（find -name / find -type d / sort 重定向 / sort|uniq -c / cut 取列 / 日志报表挑战）
- 修改 `src/lib/shell/levels/index.mjs`：CHAPTERS 第 4 项 `search`（查找与统计），LEVELS 汇入 searchLevels
- 修改 `tests/levels.test.mjs`：24 关断言、`nextLevel('perms-6') → search-1`、`nextLevel('search-6') → null`

## 测试
- `node --test tests/` → 109 pass / 0 fail（+12：6 关 × 初始不通过/金样例通过）
- `npx astro check`（评审方执行）→ 0 errors / 0 warnings

## 金样例核对（逐关，按「lastOutput = 最后一条 demo」规则）
- search-1 `find . -name "*.log"` → 输出含 `2026/app.log` ✓（引号内通配不展开，依赖 Task 2 修复）
- search-2 `find . -type d` → 输出含 `src/components` ✓
- search-3 `sort names.txt > sorted.txt` + `cat` → 文件 4 行、含 `apple\nbanana` ✓
- search-4 `sort errors.log | uniq -c` → 输出含 `3 Timeout` ✓
- search-5 `cut -d' ' -f1` → 输出含 `10.0.0.1\n10.0.0.2` ✓（tokenize 将 `-d' '` 切为 `-d `，cut 按 `-d` 前缀解析）
- search-6 五段管道 → report.txt 降序 3/2/1 ✓

## Fix round 1（响应任务评审：Quality needs-fix）
| # | 级别 | 发现 | 处理 |
|---|------|------|------|
| 1 | Important | search-6「按次数从多到少」未被断言：去掉 `sort -rn` 或换成 `sort -n` 仍能过关 | FIXED：goal 升级为 `'3 10.0.0.3\n2 10.0.0.1'`（相邻两行），仅 `sort -rn` 正确解通过；计划 Task 4 同步 |
| 2 | Minor | search-1/2 的 output-contains 无法区分「过滤」与「全量 find .」 | DEFERRED：需新增 output-absent 断言类型，超出本计划；与既有 text-4 弱判定同级 |
| 3 | Minor | 首页「三章」文案与 3 列栅格在 4 章后失配 | 转入 Task 6：文案动态化（{CHAPTERS.length} 章 {LEVELS.length} 关）；栅格经计划评估后保持 sm:grid-cols-3（5 卡折行 3+2，不引入新类名） |

- 评审临时探测文件（.tmp-review-probe*.mjs）已删除。
- 修复后：`node --test tests/` → 109 pass / 0 fail。

## Fix round 2（响应 scoped re-review 的 1 条文案 Suggestion）
- search-6 brief 由「（应出现 3 10.0.0.3）」改为「（前两行依次是 3 10.0.0.3 和 2 10.0.0.1）」，与两行断言一致；计划文档同步。

