# rc1–rc5 兼容矩阵与判据

能力探测全部集中在 `lib/unsafe/compat.js`。`probeHost()` 只读探测，`registerSection()` / `registerContext()` / `registerWeb()` / `onHostReady()` 只试注册；每一步都包在 try/catch 里，失败只往 `warnings` 里塞一条中文说明，**永不抛异常**，不阻断宿主启动。

## probeHost(ctx) 返回字段

| 字段 | 类型 | 含义 |
|---|---|---|
| `version` | string | `ctx.host.version` → `ctx.app.version` → `process.env.DSH_VERSION` → `'unknown'` |
| `versionSource` | string | 版本号取自哪一处：`'ctx.host.version'` / `'ctx.app.version'` / `'process.env.DSH_VERSION'` / `'none'` |
| `rc` | number \| null | 从 `/0\.2\.(\d+)(?:-rc\.(\d+))?/` 里取到的序号，取不到为 `null` |
| `hasSection` | boolean | 宿主是否有 `systemPrompt.section` |
| `hasContext` | boolean | 宿主是否有 `context` 注册面 |
| `hasWebServer` | boolean | 宿主是否能看见 `webServer` |
| `hasInject` | boolean | 宿主是否提供 `ctx.inject(deps, fn)` |
| `hasTools` | boolean | 是否有 `tools` 注册面（rc5 起） |
| `hasCommands` | boolean | 是否有命令注册面（rc5 起） |
| `strategy` | object | `{ sectionApi, contextApi, webServerApi }`，每项取值 `'modern'` / `'legacy'` / `'none'` |
| `warnings` | string[] | 降级说明，同一 `ctx` 共用同一数组，后续降级继续往里追加 |

## 兼容矩阵

| DSH 版本 | section | context | webServer | 注册策略 | 降级行为 |
|---|---|---|---|---|---|
| `0.2.0-rc.1` | ✓ 可用，`legacy` | 无 → 降级为 section | ✓ 直挂 `ctx.webServer`，`register({path, handler})` | section=`legacy` context=`none` web=`legacy` | `text` 是函数时先求值成字符串再注册，注册不返回 disposer；`registerContext` 改注成 section（name 追加 `#context`、order +1）；`ctx.inject` 不存在时不排队，直接从 `ctx.webServer` 取 |
| `0.2.0-rc.2` | ✓ 可用，`legacy` | 无 → 降级为 section | ✓ 直挂 `ctx.webServer`，`register({path, handler})` | section=`legacy` context=`none` web=`legacy` | 同 rc1 |
| `0.2.2-rc.3` | ✓ 可用，`modern` | ✓ 原生可用 | ✓ `register({kind:'prefix', path, handler})`，走 `ctx.inject` | section=`modern` context=`modern` web=`modern` | 注册成功但不返回 disposer，卸载时靠宿主回收；`registerWeb` 按 `kind:'prefix'` 那一种签名注册 |
| `0.2.2-rc.4` | ✓ 可用，`modern`，返回 dispose | ✓ 可用，返回 dispose | ✓ `register(path, handler)` 位置参数 | section=`modern` context=`modern` web=`modern` | 无降级；dispose 由 `apply()` 返回的清理函数统一调用 |
| `0.2.2-rc.5` | ✓ 可用，`modern`，返回 dispose | ✓ 可用，返回 dispose | ✓ `register(path, handler)` 位置参数，返回 `{ close() }` | section=`modern` context=`modern` web=`modern` | 无降级；额外提供 `tools` / `commands` 注册面，`hasTools` / `hasCommands` 为 true |
| 版本识别不到 / `ctx` 为 null | 探测结果 `false` | 探测结果 `false` | 探测结果 `false` | 按 `modern`（最新 rc5 策略）执行 | 全部注册函数返回 `undefined`，`warnings` 追加「识别不到宿主版本…按最新 rc5 策略执行」；`ctx` 为 null 时所有导出函数都不抛 |

`package.json` 的 `dshTargets` 还列了 `0.2.1-rc.1`。这一档不在矩阵脚本的 5 个假 `ctx` 里，能力探测按 `modern` 同档处理。

## 注册策略三种取值的含义

| 策略值 | 判定条件 | 注册动作 |
|---|---|---|
| `modern` | 能力位为 true，且宿主版本落在 rc3 及以上 | 直接用宿主原生 API 注册 |
| `legacy` | 能力位为 true，但宿主只接受旧签名（rc1/rc2） | 按旧签名降级：`text` 求值成字符串、`{path, handler}`、位置参数依次试 |
| `none` | 能力位为 false | 该能力整体跳过，写一条中文 warning，其余能力照常 |

`strategy` 是「能力位 + 版本档」算出来的预期策略；真正注册时还是按签名逐个试，不靠版本号硬编码：

| 注册函数 | 尝试顺序 | 全失败时 |
|---|---|---|
| `registerSection` | `{name, order, text}`（text 可为函数）→ 同结构但 `text` 求值成字符串 → `section(name, text)` 位置参数 | 返回 `undefined`，`warnings` 写明哪一步失败 |
| `registerContext` | `systemPrompt.context({name, order, text})` → 无 `context` 面或调用失败时改注成 section，`name` 追加 `#context`、`order + 1` | 返回 `undefined` |
| `registerWeb` | `{kind:'prefix', path, handler}` → `{path, handler}` → `(path, handler)`；`webServer` 暂不可见但有 `ctx.inject` 时先排队，注入后补注册 | 返回 `undefined`，路由不挂 |
| `onHostReady` | 有 `ctx.inject` 走 `inject(deps, host => fn(host))`，返回 Promise 时失败回落直连；没有就同步 `fn(ctx)` | 只记 warning，不影响其它注册 |

dispose 统一归一化：宿主返回函数就用函数，返回 `{close}` / `{dispose}` / `{unregister}` / `{off}` 就取第一个可用方法，调 dispose 时抛异常也只吞掉，不传染宿主。


## 判据

```powershell
cd E:\newpurge\dsh-purge-unsafe-fork
node test/compat-matrix.mjs
```

成功判据：

- 退出码 `0`
- 末行输出 `compat-matrix: all green`
- 统计行 `断言合计: 151，通过 151，失败 0`
- 矩阵表打印 5 行，`策略` 列与上表一致

失败判据：退出码 `1`，逐条打印 `! 断言 …`（含期待值 / 实际值）。

```powershell
node test/smoke.mjs
```

成功判据：末行 `全部通过`，退出码 `0`；其中 `状态:` 行的 `strategy` 字段要与实际宿主形态吻合（现代宿主 `sectionApi=modern`，旧版宿主 `web=legacy`）。旧版宿主那一行打印 `旧版宿主(rc1 形态): 面板 ok …`。

真机上按版本各验一次：

```powershell
# 起宿主（端口按实际）
dsh web --port 3080 --no-open
curl.exe -s http://127.0.0.1:3080/dsh-purge-unsafe/status
```

成功判据：HTTP 200，JSON 里 `"promptRegistered": true`、`"strategy"` 三项与上表该版本一致、`"host"` 是宿主版本号。`warnings` 为空数组说明没有走降级；有降级时每条 `warnings` 都要能对应上表「降级行为」列。

## 验证边界

矩阵里的 5 个 rc 是 `test/compat-matrix.mjs` 用假 `ctx` 模拟出来的形态（够不够得着 API、`register` 收什么签名、失败时抛不抛），**没有逐一在真实 rc1–rc5 宿主二进制上跑过**。真机装完后按上面 `status` 那条命令回读一次 `strategy`，才把该版本记为已验证。
