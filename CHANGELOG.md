# 更新记录

格式：`## 版本` 下按「新增 / 改动 / 移除 / 文档」分块。版本号跟 `package.json` 走。

## 0.1.0
- 面板改为原生 React（五页签：概览 / 资产 / 规则 / 模型 / 诊断），配色走宿主变量
- 补 `POST /assets/delete`、`GET /export?format=json|csv`
- README 写入 fork 地址与徽标

首个 fork 发布版。基线上游 `dsh-purge-safe`（CallMeGuLab）最后一个提交 `cc881fb`，保留完整 4 个提交历史与 `NOTICE` 归属。

### 新增

- **兼容层 `lib/unsafe/compat.js`**：`probeHost()` 探测 `systemPrompt.section`、`webServer`、`ctx.inject` 三项能力；`registerSection()` / `registerWeb()` 按能力选原生注册、前缀兜底或跳过。全程 try/catch，探测与注册都不抛异常，不阻断宿主启动。覆盖 DSH `0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`、`0.2.2-rc.3`、`0.2.2-rc.4`、`0.2.2-rc.5`。
- **资产批量导入**：面板粘贴文本块一次导入，支持换行 / 逗号 / 分号 / 空格分隔，`http(s)://` 只留 `host[:port]`，`#` 开头当注释，重复项按大小写不敏感去重并单独计数。资产自动归类为 `host` / `host:port` / `ip` / `cidr`。
- **模型预设**：`generic` / `qwen` / `glm` / `deepseek` 四套默认规则文本，按模型名子串匹配（`qwen-max`、`glm-4`、`deepseek-chat` 都能命中），匹配不到回落 `generic`。
- **默认规则文本**：四块固定结构（交付形态 / 具体性 / 不降级 / 范围与出口），只写可判定的行为约束，不写人格声明。
- **自测脚本**：`test/smoke.mjs`（假宿主跑 `apply()` 再打全部路由）、`test/compat-matrix.mjs`（rc1–rc5 能力矩阵）、`test/panel.test.mjs`（面板页结构）、`test/rules.test.mjs`（规则文本与预设匹配）。

### 改动

- **面板重做**：原来侧栏 dock 的多页签工作台改成一个侧边栏图标 `PU`（`sidebar.panellist` slot，order 6），主视图内嵌服务端渲染的 `/dsh-purge-unsafe` 页面。面板 HTML 全部由服务端出，前端不再维护状态，杜绝「文字说明一套、实现另一套」。
- **前端瘦身**：`client.js` 只做两件事——注册侧边栏图标、注册 main 视图，不含构建产物与状态机。
- **面板接口**：面板页、资产读写、清空、规则读写、重置、状态共 8 条 HTTP 路由，全部挂在 `/dsh-purge-unsafe` 前缀下。
- **数据落点**：`<DSH_HOME>/dsh-purge-unsafe/assets.json` 与 `<DSH_HOME>/dsh-purge-unsafe/state.json`，原子写（临时文件 + rename）。
- **包身份**：`package.json` 的 `name` 改为 `dsh-purge-unsafe`，`version` 改为 `0.1.0`，`dshTargets` 扩到 rc1–rc5 六项，新增 `test` 脚本。

### 移除

- **去掉激活词**：`apply` 时直接注册提示词段，用户不需要先发一句话触发。没有「先发一句触发词才生效」这类前置。
- **去掉注入按钮**：面板不再有「注入 / 关闭注入」开关，段常驻，面板只改内容。
- **去掉激活词检测与提示词原文解密装载路径**：规则文本改为明文常量 + 用户覆盖，改文本即生效。
- **去掉 dock 多页签工作台**：Clean / Drill 两页签与相关状态机不再出现在面板主路径上（`lib/redteam` 的模块仍在包内，未接进新面板）。

### 文档

- `README.md` 重写为中文，补定位、与上游差异表、三种安装方式、面板入口、HTTP 接口表、数据位置、自测命令、fork 与推送流程。
- 新增 `docs/unsafe.md`（设计说明与改动清单）、`docs/COMPAT.md`（rc1–rc5 兼容矩阵与判据）、`CHANGELOG.md`。
- `.gitignore` 补 `*.tgz`、`node_modules/`、`.dsh-*`、`*.log`。
