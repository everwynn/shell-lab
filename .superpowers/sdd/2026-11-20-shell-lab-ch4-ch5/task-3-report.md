# Task 3 report — mv 多源移动

Status: DONE

## 变更
- `src/lib/shell/commands.mjs`：重写 `mv`
  - 支持 `mv 源... 目标`：多源时目标必须是目录，否则报 `mv: 目标 X 不是目录`
  - 单源主流行为与旧实现一致（改名 / 移入目录 / 三类错误文案）；差异：`mv x x`、`mv 源 目录内同名目录` 现在报错保源（旧实现会删源），`mv 文件 目标目录`（目标下同名项是目录）改为报错而非静默丢数据
  - 多源逐个处理，失败项聚合进 stderr、其余继续移动（与 cat/ls 的错误聚合风格一致）
  - 选项一律拒绝（`mv: 暂不支持该选项`）
- `tests/commands.test.mjs`：新增 1 个用例（多源移入目录 + 多源目标非目录报错）

## 测试
命令：`node --test tests/`
结果：97 pass / 0 fail（首轮实现前 23/1 fail，守卫用例补写后 24/1 fail，TDD 顺序均已验证）

## Fix round 1（响应任务评审）

| # | 级别 | 发现 | 处理 |
|---|------|------|------|
| 1 | Important | task-3-brief.md 缺失，评审依据降级为计划 | FIXED：从计划 Task 3 提取 brief（98 行），并回写计划使 brief 与最终实现一致 |
| 2 | Minor | `mv * images` 自嵌套静默成功产生 images/images | FIXED：加入「目录不能移入自身子目录」守卫 + 测试断言 |
| 3 | Minor | copyNode 失败（目标同名项是目录）时先删源导致数据丢失 | FIXED：改为「先 copy 后 remove」，并在 copy 前拦截同名项类型冲突 |
| 4 | Minor | 部分失败/守卫分支无测试 | FIXED：新增用例覆盖部分失败继续、自嵌套、同文件、类型冲突不删源 |

- 附带修复：`mv b.txt b.txt`（源与目标相同）旧实现会删除源，现报「与目标相同」并保留。
- 计划同步：Task 3 Step 1/3/4/5 已按最终实现更新，Task 8 与 Self-Review 测试计数 120 → 121。
- 修复后：`node --test tests/` → 97 pass / 0 fail。

## 决策记录
- 多源语义依赖 execute 的通配展开（`mv mess/*.jpg mess/images/` 展开为多个源 + 目录目标），关卡 challenge-2 依赖此行为。
- 多源时 dest 类型在循环前一次性判定（移动过程不改变其类型），避免循环内重复判断。

## 遗留
- 无
