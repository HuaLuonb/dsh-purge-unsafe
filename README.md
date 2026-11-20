# dsh-purge-unsafe

DSH 插件。把提示词规则常驻注入系统提示词，并在侧边栏提供一个面板管理规则与资产。

fork 自 [CallMeGuLab/dsh-purge-safe](https://github.com/CallMeGuLab/dsh-purge-safe)（基点 `cc881fb`），保留上游提交记录与 `NOTICE`。

## 和上游的区别

| | 上游 | 这里 |
|---|---|---|
| 开始使用 | 需要先发激活词 | 无激活词，插件加载即注册 |
| 提示词开关 | 面板上有注入按钮 | 常驻，改规则保存即生效 |
| 资产 | 逐条添加 | 批量粘贴或选文件，自动去重分类 |
| 面板 | 侧栏工作台 | 侧边栏 `PU` → 五页签面板 |
| 宿主版本 | 面向 `0.2.2-rc.3` | `lib/unsafe/compat.js` 适配 `0.2.0-rc.1` ~ `0.2.2-rc.5` |

## 安装

```powershell
npm pack
dsh plugin --profile desktop add .\dsh-purge-unsafe-0.1.0.tgz
```

装完完整退出宿主再打开。调试时用符号链接，改代码只需重启：

```powershell
$p = Join-Path $env:DSH_HOME 'profiles\desktop'
New-Item -ItemType SymbolicLink -Path "$p\node_modules\dsh-purge-unsafe" -Target <仓库路径>
```

并在该 profile 的 `package.json` 里加 `dependencies["dsh-purge-unsafe"]` 与 `dsh.profile.bundles` 一项。

## 面板

侧边栏 `PU` 图标，或直接开 `http://127.0.0.1:<端口>/dsh-purge-unsafe`。

- 概览：版本、提示词字数、资产数、宿主版本、注册策略
- 资产：批量导入、筛选、类型过滤、删除、导出 JSON / CSV
- 规则：编辑、保存、恢复默认、预览当前注入文本
- 模型：`generic` / `qwen` / `glm` / `deepseek` 四套预设
- 诊断：宿主版本与能力探测结果、数据目录、告警

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/dsh-purge-unsafe` | 面板（服务端渲染备用页） |
| GET/POST | `/dsh-purge-unsafe/assets` | 读取 / 批量导入 `{text}` |
| POST | `/dsh-purge-unsafe/assets/clear` | 清空 |
| POST | `/dsh-purge-unsafe/assets/delete` | `{value}` 删一条 |
| GET | `/dsh-purge-unsafe/export?format=json\|csv` | 导出 |
| GET/POST | `/dsh-purge-unsafe/rules` | 读取 / 保存规则 |
| POST | `/dsh-purge-unsafe/rules/reset` | 恢复默认 |
| GET/POST | `/dsh-purge-unsafe/models` | 读取 / 应用模型预设 |
| GET | `/dsh-purge-unsafe/status` | 版本、字数、资产数、策略、告警 |

## 数据

`<DSH_HOME>/dsh-purge-unsafe/`：`assets.json`、`state.json`。写入走临时文件 + rename。

## 测试

```powershell
node test/smoke.mjs
node test/compat-matrix.mjs
node test/client.test.mjs
node test/panel.test.mjs
node test/rules.test.mjs
```

## 许可

Apache-2.0，版权声明见 `LICENSE` 与 `NOTICE`。
