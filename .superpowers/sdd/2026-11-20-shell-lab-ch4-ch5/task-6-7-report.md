# Task 6 + Task 7 report — UI 接线与文档同步（合并执行，同一风险面：文案/数据一致性）

Status: DONE

## Task 6：UI 接线
- `src/components/TerminalPanel.vue` QUICK 增加两项：
  - `search: ['find','sort','uniq','cut','|','>','"*.log"','~']`
  - `challenge: ['ls','mkdir','touch','mv','chmod','grep','|','>','~']`
- `src/pages/index.astro:12` 文案改为动态：`{CHAPTERS.length} 章 {LEVELS.length} 关，从文件操作到日志统计。`
- 章节卡片网格按计划保持 `sm:grid-cols-3`（5 卡折行 3+2，不引入新类名）

## Task 7：文档同步
- `README.md` 4 处：五章 30 关、命令清单 22 个（+sort/uniq/cut/find）、levels 五章数据、[level] 30 关
- `src/pages/about.astro` supported 数组 18 → 22
- `../项目总览.md` shell-lab 行改为五章 30 关（仓库外，不需提交）

## 验证
- `npm run check` → 0 errors / 0 warnings / 0 hints（31 files）
- `npm run build` → 34 page(s) built（含 sitemap/robots）；dist 下 index.html 33 个 = 30 关卡 + 首页 + lessons + about，与计划口径一致
- `Select-String -Path README.md,src/pages/*.astro -Pattern '三章','18 关'` → 无输出（无残留）
- `node --test tests/` → 121 pass / 0 fail

## 待验证
- 任务评审（Task 6 + Task 7 合并评审）

## 遗留
- 无
