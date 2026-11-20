# dsh-purge-unsafe 设计说明与改动清单

## 与上游的关系

| 项 | 值 |
|---|---|
| 上游仓库 | [CallMeGuLab/dsh-purge-safe](https://github.com/CallMeGuLab/dsh-purge-safe)（Apache-2.0） |
| fork 基点 | 提交 `cc881fb`（「1、皮肤适配 2、已知bug修复」），上游 4 个提交全部保留 |
| 上游历史 | `d27941b` 初版上传 → `c82ace3` 导入 v2 源 → `d96c5f2` rc3 + superagent → `cc881fb` 皮肤适配与 bug 修复 |
| 归属 | `NOTICE` 原样保留，`LICENSE` 不动；再分发与 fork 必须保留该文件并注明来源仓库 |
| 本 fork 版本 | `0.1.0` |

## 三条设计原则

1. **没有激活词**：`apply()` 执行时就注册提示词段，用户不用先发一句话。原来的「先发关键字才生效」被砍掉——漏发一次就等于插件没装，排查时只能怀疑模型。
2. **没有注入开关**：段常驻，面板只改内容。「开/关注入」这个开关是状态漂移源：钩子没挂上、按钮却显示已开启，看起来一切正常。
3. **版本差异全部交给 `lib/unsafe/compat.js`**：缺哪个能力就降级哪一项，探测与注册都不抛异常，不挡宿主启动。

## 改动清单

| 文件 | 改了什么 | 为什么 |
|---|---|---|
| `lib/unsafe/compat.js`（新增） | `probeHost()` 探测 `systemPrompt.section` / `context` / `webServer` / `ctx.inject` / `tools` / `commands` 并把每项归成 `modern` / `legacy` / `none`；`registerSection` / `registerContext` / `registerWeb` / `onHostReady` 按策略试注册 | rc1/rc2 没有 `context`、没有 `ctx.inject`、`webServer.register` 只收 `{path, handler}`；rc3 换成 `{kind:'prefix',…}`；rc4/rc5 改成位置参数。不抽这一层，每个能力都要写两套分支 |
| `lib/unsafe/index.js`（新增） | 插件入口：`inject: ['systemPrompt']`，`apply()` 里探测 → 建 store → 注册提示词段（`order 4310`，`text` 用函数）→ 注册 `/dsh-purge-unsafe` HTTP 路由 → 返回统一清理函数 | 入口只做接线，具体行为在 compat / panel / rules 三个文件里，改一处不牵动另一处 |
| `lib/unsafe/panel.js`（新增） | 服务端渲染单文件 HTML：三个页签「资产 / 规则 / 状态」，默认打开资产；一个 `<style>`、一个 `<script>`、`esc()` 转义 | 面板 HTML 由服务端出，前端不维护状态，不会出现「说明一套、实现另一套」；单文件便于整页 diff 与字节数断言 |
| `lib/unsafe/rules.js`（新增） | `DEFAULT_RULES`（四块：交付形态 / 具体性 / 不降级 / 范围与出口）+ `MODEL_PRESETS`（`generic` / `qwen` / `glm` / `deepseek`）+ `rulesFor()` 按模型名子串匹配 | 规则是明文常量，改文本即生效；模型族差异点收敛到四个预设，不再靠一堆散落的注入片段 |
| `test/smoke.mjs`（新增） | 假宿主跑一遍 `apply()`，再打全部 HTTP 路由；另覆盖旧版宿主形态与 `parseAssets()` | 端到端证明「apply 之后确实注册了段和路由」，而不是只做单元断言 |
| `test/compat-matrix.mjs`（新增） | 5 个假 `ctx` 模拟 rc1–rc5，逐项断言策略取值与降级路径；含 `null ctx` 不抛断言 | 兼容层是整个 fork 最脆的地方，必须有可复跑的矩阵 |
| `test/panel.test.mjs`（新增） | 断言三个页签、按钮文案、接口调用、字符集与配色、`<script>`/`<style>` 各一个、体积区间、版本号转义 | 面板是纯字符串，没有测试就等于没有回归保护 |
| `test/rules.test.mjs`（新增） | 断言四块结构、字数、`rulesFor()` 对 `qwen` / `glm` / `deepseek` 的匹配与回落 | 规则文本是要拼进系统提示词的，字数与结构漂移会直接影响注入结果 |
| `client.js`（改写） | 从 23610 行的 dock 工作台改成 2133 字节：只注册侧边栏图标 `PU`（slot `sidebar.panellist`，order 6）与 `main` 视图（key `purge-unsafe`），主视图内嵌 `iframe src="/dsh-purge-unsafe"` | 前端只剩两个注册动作，没有状态机、没有构建产物；面板逻辑全在服务端 |
| `package.json` | `name` → `dsh-purge-unsafe`，`version` → `0.1.0`，`bin` 键改名，`dshTargets` 扩到 rc1–rc5 六项，新增 `test` 脚本 | 发布身份与上游区分开；`dshTargets` 要与兼容层实际覆盖范围一致 |
| `presets/unsafe-*.md`（新增） | 四套模型预设落成独立文件（`generic` / `qwen` / `glm` / `deepseek`） | 预设要能从文件读、能进包、能单独 diff，而不是埋在某个 JS 字符串里 |
| `.gitignore` | 补 `*.tgz`、`node_modules/`、`.dsh-*`、`*.log` | `npm pack` 出的包、调试符号链接、宿主状态文件与日志都不该进仓库 |
| `README.md` / `docs/unsafe.md` / `docs/COMPAT.md` / `CHANGELOG.md` | 新写或重写 | 对外发布要有可复制的安装、接口、自测与 fork 流程 |

## 五个关键改动，逐条说明

### 1. 去掉激活词

上游流程是「装好 → 发一句触发词 → 才注入」。触发点靠文本匹配，用户漏发、或者会话是子代理起的，段就不在。现在 `apply()` 里直接 `registerSection()`，宿主一启动段就在，`/dsh-purge-unsafe/status` 的 `promptRegistered` 直接反映结果。

### 2. 去掉注入按钮

面板上没有「注入 / 关闭注入」按钮。段常驻，用户能改的只有**内容**：写规则、切模型预设、恢复默认。于是状态只有一种——要么段注册成功，要么 `warnings` 里写着为什么没注册成。

### 3. 资产批量导入

原来一条一条加。现在一次粘贴整块文本：

- 换行、逗号、分号、空格都算分隔符；
- `http(s)://…` 只留 `host[:port]`；
- `#` 开头的行当注释；
- 按大小写不敏感去重，新增数与重复数分开返回；
- 自动归类 `host` / `host:port` / `ip` / `cidr`。

接口回显 `{ ok, added, duplicate, total }`，重复导入同一批时 `added=0`、`duplicate=N`，可以直接当幂等判据。

### 4. 三页面板

`资产` / `规则` / `状态` 三页，默认 `资产`：

| 页签 | 内容 | 动作 |
|---|---|---|
| 资产 | 资产表格、数量统计、批量粘贴框 | 批量导入、从文件导入、清空 |
| 规则 | 当前规则全文、模型预设选择 | 保存、恢复默认 |
| 状态 | 版本、宿主版本、段是否注册、规则字数、资产数、数据目录、降级 warning | 只读 |

服务端一次渲染出整页，前端只负责切页签和 fetch。`renderPanel()` 无参调用也能出完整页面。

### 5. 兼容层

见 [COMPAT.md](./COMPAT.md)。核心是 `probeHost()` 把「宿主有什么」和「注册怎么写」分开：能力位为 true 但签名不同就是 `legacy`，能力位为 false 就是 `none`，版本识别不到按最新策略执行并留一条 warning。所有导出函数在 `ctx` 为 `null` 时返回 `undefined`，不抛。

## 数据流

```
apply(ctx, config)
  ├─ probeHost(ctx)                     → 能力位 + strategy + warnings
  ├─ createStore(config.dshHome)        → <DSH_HOME>/dsh-purge-unsafe/
  ├─ registerSection({text})            → text() 是函数，读 store 每次重新取
  └─ registerWeb({path:'/dsh-purge-unsafe', handler})
        ├─ GET  /            面板 HTML
        ├─ GET  /assets       资产列表
        ├─ POST /assets       批量导入 { text }
        ├─ POST /assets/clear 清空
        ├─ GET  /rules        规则全文 + 是否自定义 + 当前模型
        ├─ POST /rules        写规则 { text }
        ├─ POST /rules/reset  恢复默认
        ├─ GET  /models       模型预设列表
        ├─ POST /models       切模型 { model }
        └─ GET  /status       状态 + strategy + warnings
```

规则段文本是**函数**不是字符串：`POST /rules` 写盘后，下一次宿主组装提示词就取到新内容，不用重启。

## 回滚方式

撤销单个文件的改动（历史都在，4 个上游提交完整保留）：

```powershell
cd E:\newpurge\dsh-purge-unsafe-fork
git log --oneline -- lib/unsafe/index.js
git revert <该提交 sha>          # 反向提交，历史不变
```

只想丢工作区、回到上游 `cc881fb` 那一刻：

```powershell
git switch -c back-to-upstream cc881fb
```

`git switch` 不动已有分支，回退分支单独放着，随时能切回来。要连未提交改动一起丢才用 `git reset --hard cc881fb`——工作区里那些未跟踪的脚本会一起没。

拉上游后续更新（先把远端角色理顺）：

```powershell
git remote add upstream https://github.com/CallMeGuLab/dsh-purge-safe.git
git fetch upstream
git log --oneline upstream/main   # 看看上游是否有新提交
```

插件层面的卸载走宿主的插件命令，不是 `git`：

```powershell
dsh plugin --profile web remove dsh-purge-unsafe
```

## 尚未接线的部分

- `lib/index.js` 仍是上游那份单体入口（`export const name = "dsh-purge-safe"`，122KB）。新入口在 `lib/unsafe/index.js`，要让宿主用上它，得把 `package.json` 的 `main` 指过去，或在 `lib/index.js` 里转出。这一处不在本次文档改动范围内，改之前 `test/smoke.mjs` 只覆盖 `lib/unsafe` 这一层。
- `lib/redteam/**` 的演练台模块仍在包内，新面板没有接它；`package.json` 的 `exports` 还保留着 `./redteam*` 子路径。
