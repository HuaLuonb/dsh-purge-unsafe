# dsh-purge-unsafe

[![repo](https://img.shields.io/badge/GitHub-HuaLuonb/dsh-purge-unsafe-181717?logo=github)](https://github.com/HuaLuonb/dsh-purge-unsafe)
[![version](https://img.shields.io/badge/version-0.1.0-2563eb)](https://github.com/HuaLuonb/dsh-purge-unsafe/releases)
[![license](https://img.shields.io/badge/license-Apache--2.0-3a7d44)](LICENSE)
[![dsh](https://img.shields.io/badge/DSH-0.2.0--rc.1%20~%200.2.2--rc.5-8b5cf6)](#兼容)

- 仓库：<https://github.com/HuaLuonb/dsh-purge-unsafe>
- 上游：<https://github.com/CallMeGuLab/dsh-purge-safe>（fork 基点 `cc881fb`，4 个提交与 `NOTICE` 全保留）
- 提问题：<https://github.com/HuaLuonb/dsh-purge-unsafe/issues>
- 对比上游改动：<https://github.com/HuaLuonb/dsh-purge-unsafe/compare/cc881fb...main>

装完即生效，不需要激活词，也没有「打开注入」的开关；提示词规则常驻，面板只管内容。

## 与上游的差异

| 差异点 | 上游 dsh-purge-safe | 本 fork dsh-purge-unsafe |
|---|---|---|
| 激活词 | 先发一句触发词，命中后才注册提示词段 | 无激活词，`apply()` 执行即注册，宿主一启动段就在 |
| 提示词生效方式 | 面板上的「注入 / 关闭注入」按钮控制 | 注入常驻，没有开关；面板只改规则内容，保存即生效 |
| 资产导入 | 一条一条添加 | 批量粘贴导入：换行 / 逗号 / 分号 / 空格分隔，`#` 注释，自动去重并归类 `host` / `host:port` / `ip` / `cidr` |
| 面板形态 | 侧栏 dock 多页签工作台（Clean / Drill） | 侧边栏 `PU` 图标 + 原生 React 面板：概览 / 资产 / 规则 / 模型 / 诊断，配色走宿主 `--dsw-alias-*` 变量 |
| 版本适配 | 只对 `0.2.2-rc.3` 打补丁 | `lib/unsafe/compat.js` 兼容层覆盖 `0.2.0-rc.1` → `0.2.2-rc.5`，缺能力就降级，不抛异常 |

## 安装

三种方式选一种。装完都要**完整退出宿主再重开**，`apply()` 只在启动时跑一次。

### 1. `npm pack` 后 `dsh plugin add`

```powershell
cd E:\newpurge\dsh-purge-unsafe-fork
npm pack
# 产物：dsh-purge-unsafe-0.1.0.tgz
dsh plugin --profile web add .\dsh-purge-unsafe-0.1.0.tgz
```

桌面端把 `--profile web` 换成 `--profile desktop`。也可以直接 add 目录：`dsh plugin --profile web add E:\newpurge\dsh-purge-unsafe-fork`。

验证：`<DSH_HOME>/profiles/web/package.json` 的 `dependencies` 里出现 `dsh-purge-unsafe`，`dsh.profile.bundles` 里也有一行，且 `node_modules/dsh-purge-unsafe/package.json` 存在。

### 2. 符号链接调试（改代码立刻生效）

```powershell
$profile = Join-Path $env:DSH_HOME 'profiles\web'      # 桌面端改 profiles\desktop
New-Item -ItemType Directory -Force -Path "$profile\node_modules" | Out-Null
New-Item -ItemType SymbolicLink -Path "$profile\node_modules\dsh-purge-unsafe" `
  -Target 'E:\newpurge\dsh-purge-unsafe-fork'
```

再在该 profile 的 `package.json` 里补两处：`dependencies` 加 `"dsh-purge-unsafe": "*"`，`dsh.profile.bundles` 加 `"dsh-purge-unsafe"`。改完 JS 重启宿主即可，不用重新打包。

### 3. 直接放 `local-plugins`

```powershell
$dst = Join-Path $env:DSH_HOME 'local-plugins\dsh-purge-unsafe'
New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
Copy-Item -Recurse -Force 'E:\newpurge\dsh-purge-unsafe-fork' $dst
```

profile 的 `package.json`：

```json
"dependencies": { "dsh-purge-unsafe": "file:../../local-plugins/dsh-purge-unsafe" },
"dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-purge-unsafe"] } }
```

```powershell
cd (Join-Path $env:DSH_HOME 'profiles\web')
pnpm install
```

## 面板入口

两个入口等价：

- **侧边栏图标 `PU`**（slot `sidebar.panellist`，order 6）→ 主视图内嵌面板，key `purge-unsafe`
- **直接开页面**：`http://127.0.0.1:<端口>/dsh-purge-unsafe`。`dsh web` 默认 `3080`；桌面端端口看环境变量 `DSH_WEB_URL`（形如 `http://127.0.0.1:56838`）

三个页签，默认打开「资产」：

| 页签 | 内容 | 动作 |
|---|---|---|
| 资产 | 资产表格、数量、剪贴板/文本框 | 批量导入、从文件导入、清空 |
| 规则 | 当前规则全文、模型预设 | 保存、恢复默认 |
| 状态 | 版本、宿主版本、段是否注册、规则字数、资产数、数据目录、降级 warning | 只读 |

## HTTP 接口

全部挂在 `/dsh-purge-unsafe` 前缀下，只监听本机。

| 方法 | 路径 | 入参 | 回显 |
|---|---|---|---|
| GET | `/dsh-purge-unsafe` | — | 面板 HTML（`text/html`，含三个页签） |
| GET | `/dsh-purge-unsafe/assets` | — | `{ ok, assets: [{ value, kind, addedAt }] }` |
| POST | `/dsh-purge-unsafe/assets` | `{ "text": "example.com\n10.0.0.0/24" }` | `{ ok, added, duplicate, total }` |
| POST | `/dsh-purge-unsafe/assets/clear` | `{}` | `{ ok, total: 0 }` |
| GET | `/dsh-purge-unsafe/rules` | — | `{ ok, rules, custom, model }` |
| POST | `/dsh-purge-unsafe/rules` | `{ "text": "规则全文" }`（也接受 `rules` 字段） | `{ ok, chars }` |
| POST | `/dsh-purge-unsafe/rules/reset` | `{}` | `{ ok, chars, defaultChars }` |
| GET | `/dsh-purge-unsafe/status` | — | `{ ok, version, promptRegistered, promptChars, assets, dataDir, host, strategy, warnings }` |

另有两条给模型预设用：`GET /dsh-purge-unsafe/models` 回 `{ ok, model, presets, current }`，`POST /dsh-purge-unsafe/models` 收 `{ "model": "qwen-max" }`。

未匹配路径返回 `404 { ok:false, error }`；处理函数内部出错返回 `500 { ok:false, error }`。

```powershell
# 冒烟：读状态
curl.exe -s http://127.0.0.1:3080/dsh-purge-unsafe/status
# 判据：HTTP 200，promptRegistered=true，assets 与面板上一致

# 批量导入
curl.exe -s -X POST http://127.0.0.1:3080/dsh-purge-unsafe/assets -H 'content-type: application/json' -d '{"text":"example.com,10.0.0.5:8080\n10.0.0.0/24"}'
# 判据：added=3；同一批再发一次得到 added=0、duplicate=3
```

## 数据位置

全部落在 `<DSH_HOME>/dsh-purge-unsafe/`，`<DSH_HOME>` 未设时回落 `~/.dsh`（本机为 `C:\Users\Admin\.dsh`）。

| 文件 | 内容 | 写入时机 |
|---|---|---|
| `assets.json` | 资产数组 `[{ value, kind, addedAt }]`，`kind` ∈ `host` / `host:port` / `ip` / `cidr` | 批量导入、清空 |
| `state.json` | `{ rules, model, updatedAt }`；`rules` 为空表示用默认规则，`model` 为空表示 `generic` | 保存规则、恢复默认、切模型 |

两份文件都走「临时文件 + `rename`」原子写，不会写出半截 JSON。手动删除目录等于恢复初始状态。

## 自测

```powershell
cd E:\newpurge\dsh-purge-unsafe-fork
node test/smoke.mjs          # 假宿主跑 apply()，再打全部 HTTP 路由
node test/compat-matrix.mjs  # rc1–rc5 能力矩阵与降级路径
node test/panel.test.mjs     # 面板页结构、页签、体积、转义
node test/rules.test.mjs     # 默认规则文本与模型预设匹配
```

判据：

| 命令 | 成功回显 | 退出码 |
|---|---|---|
| `node test/smoke.mjs` | 末行 `全部通过` | 0 |
| `node test/compat-matrix.mjs` | 末行 `compat-matrix: all green`，统计行 `断言合计: 151，通过 151，失败 0` | 0 |
| `node test/panel.test.mjs` | `panel.test.mjs ok — … 页签 3 个，script 1 个，style 1 个` | 0 |
| `node test/rules.test.mjs` | 末行 `rules.test.mjs ok` | 0 |

一次跑完：`npm test`（等价于前两条）。

## Fork 与推送流程

本机现状：`gh 2.92.0` 已安装，但 token 已失效——`gh auth status` 会报 `The token in default is invalid.`，所以**推送前必须先重新登录**。当前 `git remote -v` 的 `origin` 还指向上游 `CallMeGuLab/dsh-purge-safe`，推送前先把远端角色理顺。

```powershell
cd E:\newpurge\dsh-purge-unsafe-fork
gh auth login -h github.com
gh repo create dsh-purge-unsafe --public --source=. --remote=origin --push
# 若已存在远端：git remote add origin git@github.com:<你的账号>/dsh-purge-unsafe.git; git push -u origin main
# 想显示为 GitHub 上的 fork：先在网页点 Fork，再 git remote add upstream https://github.com/CallMeGuLab/dsh-purge-safe.git
```

`origin` 已被上游占用时，先改名再建新远端：

```powershell
git remote rename origin upstream
gh repo create dsh-purge-unsafe --public --source=. --remote=origin --push
git remote -v   # origin → 你的账号/dsh-purge-unsafe，upstream → CallMeGuLab/dsh-purge-safe
```

发布前核对三件事：

```powershell
git log --oneline | Measure-Object -Line   # 上游 4 个提交 + 本次改动，历史不断
git log --oneline cc881fb -1               # 基点仍在
notepad NOTICE                             # 上游归属原样保留
```

- **保留上游历史**：不从零 `git init`、不 squash。上游的 `d27941b` / `c82ace3` / `d96c5f2` / `cc881fb` 四个提交都要在 `git log` 里看得到，这样 GitHub 上能直接对比 diff，也方便以后 `git merge upstream/main`。
- **保留 NOTICE 归属**：`NOTICE` 与 `LICENSE` 一个字不动。Apache-2.0 的再分发要求是保留版权声明与 NOTICE，fork 改名不豁免这一条。
- **包名与仓库名一致**：`package.json` 的 `name` 是 `dsh-purge-unsafe`，GitHub 仓库同名，`dsh plugin add` 装的也是这个名字，三处不要错位。

## 目录结构

```
lib/unsafe/      入口 index.js、兼容层 compat.js、面板 panel.js、规则 rules.js
test/            smoke / compat-matrix / panel.test / rules.test
client.js        侧边栏图标 PU + 主视图 iframe，仅此二事
bin/             CLI
presets/unsafe-*.md   四套模型预设
docs/            unsafe.md（设计说明）、COMPAT.md（兼容矩阵）
```

## 许可与归属

Apache-2.0，见 [LICENSE](./LICENSE)。`NOTICE` 里的上游声明必须随再分发保留，fork 需要注明来源为 [dsh-purge-safe / CallMeGuLab](https://github.com/CallMeGuLab/dsh-purge-safe)。
