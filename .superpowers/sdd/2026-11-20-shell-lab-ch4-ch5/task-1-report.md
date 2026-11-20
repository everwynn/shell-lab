# Task 1 report — sort / uniq / cut

Status: DONE

## 变更
- `src/lib/shell/commands.mjs`
  - 新增 `readText(state, raw, name)`：读取文件文本，统一 No such file / Is a directory / Permission denied 三类错误
  - 新增 `linesOf(text)`：按行拆分并丢弃末尾空行（与 wc 的统计口径一致）
  - 新增 `sort`：支持 `-r` / `-n` / `-rn`（及 `-nr` 等价）；无文件读 `state.stdin`；`-n` 取行首数字前缀
  - 新增 `uniq`：只合并相邻重复；`-c` 输出 `count line`（单空格）
  - 新增 `cut`：`-d` 单字符必填、`-f` 1-based 必填；兼容 `-d' '` / `-d ' '` / `-f1` / `-f 1`
  - `COMMANDS` 白名单：18 → 21（+sort +uniq +cut；find 留待 Task 2 后达 22）
- `tests/commands.test.mjs`：新增 5 个用例 + `runLine` 导入

## 测试
命令：`node --test tests/commands.test.mjs`
结果：19 pass / 0 fail（实现前 14 pass / 5 fail，已按 TDD 顺序验证）

## 决策记录
- spec 原写「sort 无输入报错」，实现改为「空 stdin 输出空、code 0」：管道空输入不应误报，与真实 sort 一致（已在计划 Self-Review 记录）。
- 白名单本次未加 find（find 函数尚不存在），Task 2 一并加入。

## 遗留
- 无
