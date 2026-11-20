# Shell Lab

浏览器里的 Linux 命令练习场：分关卡练文件、文本与权限，纯前端模拟终端。

## 功能

| 功能 | 说明 |
|---|---|
| 三章 18 关 | 文件与目录 / 文本与管道 / 权限与用户，每章 6 关（末关为挑战） |
| 真终端交互 | 命令行解析、管道、重定向、通配符、权限位真实生效 |
| 判定与反馈 | 每关 1–4 条状态断言，实时打勾；两级提示；演示回放（副本隔离） |
| 进度保存 | 完成记录存 localStorage，首页「继续上一关」 |
| 移动端 | 快捷符号/命令条；375px 宽可用 |

支持命令：`pwd ls cd mkdir touch rm cp mv cat echo grep head tail wc chmod chown clear help`

**明确不支持**：环境变量、`$()`、heredoc、`&&` / `||` / `;`、`2>`、`sudo`、软链接、脚本、Tab 路径补全。

## 本地运行

需要 Node ≥ 20.6（`node --test`）。

```powershell
npm install
npm test        # 引擎 + 关卡三重校验
npm run check
npm run build
npm run preview
```

## 目录结构

```
src/lib/shell/    vfs / tokenize / commands / execute / assertions + levels 三章数据
src/components/   LevelRunner（单岛）+ TerminalPanel / LevelTasks / DemoPlayer
src/pages/        首页 / lessons 总览 / [level] 18 关 / about / sitemap / robots
tests/            node --test 直测引擎与关卡内容
```

## 已知局限

- 模拟器与真机存在差异：无环境变量、无多命令串联、无真实用户切换；`mkdir` 默认自动建多级目录，比真机宽松
- `chown` 不检查 root 权限；`ls -l` 时间字段为固定占位
- 进度只在本机，换浏览器/清缓存后丢失

## 与 cs-lab 的关系

cs-lab 负责「看懂原理」（可视化演示），Shell Lab 负责「练熟操作」（真敲命令）。
