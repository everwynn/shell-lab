# Task 5 report — 第 5 章 challenge 六关

Status: DONE

## 变更
- 新增 `src/lib/shell/levels/challenge.mjs`：6 关综合实战
  1. 搭建项目骨架（mkdir -p / touch 多参数）
  2. 整理乱目录（mkdir + mv 通配多源 + file-absent 断言）
  3. 生成部署清单（ls | grep > 文件 + file-lines）
  4. 权限审计（chmod 数字模式多参数 + mode-is）
  5. 错误汇总（grep | sort | uniq -c | sort -rn > 文件）
  6. 全流程复原（mkdir/echo 重定向/touch/cp/chmod 串联）
- 修改 `src/lib/shell/levels/index.mjs`：CHAPTERS 第 5 项 `challenge`（挑战工坊），LEVELS 以 challenge 收尾
- 修改 `tests/levels.test.mjs`：30 关断言、`nextLevel('search-6') → challenge-1`、`nextLevel('challenge-6') → null`

## 测试
- `node --test tests/` → 121 pass / 0 fail（+12：6 关 × 初始不通过/金样例通过）
- 依赖复核：file-absent / mode-is 断言、setup 的 {content, mode} 对象、mkdir -p 多参数、touch 多参数、chmod 多参数均已在既有引擎中支持（逐一 grep 确认）

## 金样例核对（lastOutput = 最后一条 demo）
- challenge-1：4 个 file-exists ✓
- challenge-2：mv 通配多源依赖 Task 3 与 task 2 的引号修复无关（无引号）；file-absent `~/mess/pic1.jpg` 通过 ✓
- challenge-3：`ls release | grep app > release/deploy.txt` → 2 行（app.css/app.js）✓
- challenge-4：goals 全为 mode-is，chmod 700 两文件 + README 保持 644 ✓
- challenge-5：ERROR net×2 / ERROR db×1 → `2 ERROR net`、`1 ERROR db` ✓（fix round 2 换种子后复测）
- challenge-6：echo 单引号重定向、cp 模板、chmod 700 ✓

## 附带修复（Task 4 复审建议）
- search-6 brief 改为「前两行依次是 3 10.0.0.3 和 2 10.0.0.1」，与新两行断言一致（原括号提示已被断言证伪）。
- Task 4 report/ledger 的栅格措辞与计划对齐：保持 sm:grid-cols-3（5 卡折行 3+2）。

## Fix round 1（响应任务评审：Quality needs-fix）

| # | 级别 | 发现 | 处理 |
|---|------|------|------|
| 1 | Important | challenge-5「按次数从多到少」未断言：漏 `sort -rn` 或漏 `grep ERROR` 均能过关 | FIXED：改为 `file-lines 2` + 多行 file-contains；fix round 2 进一步改种子（net×2 > db×1，降序≠字典序），现四种变体中仅正确管道能过 |
| 1b | Important（复审 r2） | 种子巧合：次数降序与字典序同向，漏 `sort -rn` 仍能过 | FIXED：app.log 改为 `ERROR net / WARN cpu / ERROR db / ERROR net / WARN cpu`，goal 改 `'2 ERROR net\n1 ERROR db'`；实测漏 sort -rn / 漏 grep / 漏 uniq 前 sort 均 FAIL |
| 2 | Important | challenge-2 仅 pic1.jpg 配 file-absent，其余 3 个源文件用 cp 不删源也能过 | FIXED：补 pic2.jpg / note1.txt / note2.txt 三条 file-absent |
| 3 | Minor | 首页「三章」硬编码 | 已属 Task 6 范围（文案动态化） |
| 4 | Minor | challenge-6 用 echo 直写 config.txt 也能过（内容型断言局限） | 接受为已知边界，不改 |

- 计划 Task 5 Step 1 已同步两处 goal。
- 修复后：`node --test tests/` → 121 pass / 0 fail。

## 遗留
- 无（challenge-6 的内容同源校验为已知边界）
