# 更新记录

## 0.1.0

首个版本，基于上游 `dsh-purge-safe` 的 `cc881fb`。

新增：

- `lib/unsafe/compat.js`：探测 `systemPrompt.section` / `context` / `webServer` / `ctx.inject`，按 `modern` / `legacy` / `none` 注册，覆盖 DSH `0.2.0-rc.1` ~ `0.2.2-rc.5`
- `lib/unsafe/rules.js`：默认规则（交付形态 / 具体性 / 不降级 / 范围与出口）与 `generic` / `qwen` / `glm` / `deepseek` 预设
- 资产批量导入：多分隔符、`#` 注释、URL 归一化、去重与类型归类
- `GET /export?format=json|csv`、`POST /assets/delete`
- 五套测试：`client` / `smoke` / `compat-matrix` / `panel` / `rules`

改动：

- 面板改为 React 五页签：概览 / 资产 / 规则 / 模型 / 诊断，配色走宿主 `--dsw-alias-*`
- 入口指向 `lib/unsafe/index.js`，`cordis.patch.yml` 使用 `purge-unsafe` 命名空间

移除：

- 激活词：`apply()` 即注册提示词段
- 注入按钮：段常驻，面板只改内容
