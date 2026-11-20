# Task 2 report — globToRegExp 上移 + find

Status: DONE

## 变更
- `src/lib/shell/vfs.mjs`：末尾新增导出 `globToRegExp(pattern)`（glob → 正则，* / ? 不跨 /），供 execute 与 find 共用
- `src/lib/shell/execute.mjs`：删除本地私有 `globToRegExp`，改从 vfs 导入；行为不变
- `src/lib/shell/commands.mjs`
  - 导入区加入 `globToRegExp`（字母序）
  - 新增 `find [path] [-name <glob>] [-type f|d]`：输出保留用户输入前缀（find . → ./x）、目录要求 r+x 才进入、起点无权限/不存在分别报错、无匹配输出空
  - 白名单 21 → 22（+find）
- `tests/commands.test.mjs`：新增 3 个用例（-name 递归与 ./ 前缀、-type d 与空匹配、路径不存在与起点无权限）

## 测试
命令：`node --test tests/`
结果：92 pass / 0 fail（实现前 19/3 fail，TDD 顺序已验证）

## 决策记录
- 引号内通配：execute 的 expandWord 对词内容做展开（tokenize 不保留 quoted 标志），`find . -name "*.log"` 在 cwd 无 .log 匹配时保留字面量、传给 find 正常；关卡 setup 已保证该条件（计划 Self-Review 已记录局限）。
- 遍历子目录时若子目录缺 r+x 直接跳过（不输出该目录本身），按计划口径简化。

## 遗留
- 无

## Fix round 1（评审后）

| Finding | 处理 | 说明 |
|---|---|---|
| Important #1：引号内通配被 execute 提前展开 | ADDRESSED | tokenize 新增 `commandQuoted: boolean[][]` 旁路返回（不动 commands 结构）；execute 对带引号词跳过 `expandWord`；`find . -name "*.log"` 在 cwd 有 .log 时不再报错 |
| Minor #2：`find /` 前缀退化为 `.` | ADDRESSED | `trimmed = rootRaw.replace(/\/+$/, '')`；`prefix = trimmed === '' ? '/' : trimmed`；`joinPath` 拼 '/' |
| Minor #3：-name 用绝对路径基名匹配起点 | ADDRESSED | `walk(root, baseOf(prefix) || prefix, prefix)`，起点名取输入词干 |

覆盖测试：`tests/tokenize.test.mjs`（commandQuoted 与 words 对齐）、`tests/execute.test.mjs`（引号不展开 + 无引号展开后报多余操作数）、`tests/commands.test.mjs`（find / 前缀、起点词干）。

命令：`node --test tests/` → **95 pass / 0 fail**