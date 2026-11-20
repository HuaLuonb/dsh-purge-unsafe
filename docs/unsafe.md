# 设计说明

fork 自 [dsh-purge-safe](https://github.com/CallMeGuLab/dsh-purge-safe)，基点 `cc881fb`。上游 4 个提交与 `NOTICE` 保留，许可仍为 Apache-2.0。

## 三个原则

1. **无激活词**：`apply()` 执行即注册提示词段（order 4310，`text` 是函数），不需要先发一句话。
2. **无注入开关**：段常驻，面板只改内容，保存即生效。
3. **版本差异集中在兼容层**：`lib/unsafe/compat.js` 探测能力并按策略注册，缺能力降级、不抛异常。

## 文件

| 文件 | 职责 |
|---|---|
| `lib/unsafe/index.js` | 入口：探测 → 建 store → 注册段 → 注册 `/dsh-purge-unsafe` 路由 → 返回清理函数 |
| `lib/unsafe/compat.js` | `probeHost()` 与 `registerSection` / `registerContext` / `registerWeb` / `onHostReady`，覆盖 rc1–rc5 的三种注册签名 |
| `lib/unsafe/panel.js` | 服务端渲染的备用页（直连 URL 用），单文件 HTML |
| `lib/unsafe/rules.js` | 默认规则与 `generic` / `qwen` / `glm` / `deepseek` 四套预设 |
| `client.js` | 侧边栏 `PU` 图标 + 主视图面板（React.createElement，五页签） |
| `test/*.mjs` | 五套测试：client / smoke / compat-matrix / panel / rules |

## 资产解析

一次粘贴整块文本，换行 / 逗号 / 分号 / 空格均为分隔符：

- `http(s)://…` 只保留 `host[:port]`
- `#` 开头为注释
- 大小写不敏感去重，返回 `{ ok, added, duplicate, total }`
- 归类 `host` / `host:port` / `ip` / `cidr`

重复导入同一批：`added=0`、`duplicate=N`，可直接当幂等判据。

## 数据流

```
插件加载 → apply() → compat.probeHost(ctx)
                     ├─ registerSection(name, order, () => rulesText())
                     └─ registerWeb(path, handler) → 面板与接口
面板/接口 → store(<DSH_HOME>/dsh-purge-unsafe) → assets.json / state.json
```

写入用临时文件 + rename，避免半截文件。

## 面板

五页签：概览、资产、规则、模型、诊断。前端不含状态机，数据全部走 `/dsh-purge-unsafe/*`；配色只用宿主 `--dsw-alias-*` 变量并带 fallback。

## 回滚

```powershell
git switch -c back-to-upstream cc881fb
```
