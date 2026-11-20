const ESC_MAP = { 38: "&amp;", 60: "&lt;", 62: "&gt;", 34: "&quot;", 39: "&#39;" };

function esc(value) {
  const s = value === null || value === undefined ? "" : String(value);
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const hit = ESC_MAP[s.charCodeAt(i)];
    out += hit === undefined ? s.charAt(i) : hit;
  }
  return out;
}

function initialStatusRows(status, version) {
  if (!status) {
    return '<tr><th>状态</th><td class="mono">读取中…</td></tr>';
  }
  const rows = [
    ["版本", status.version === undefined ? version : status.version],
    ["提示词是否注册", status.promptRegistered ? "已注册" : "未注册"],
    ["提示词字数", status.promptChars],
    ["资产数量", status.assets],
    ["数据目录", status.dataDir],
    ["宿主版本", status.host],
  ];
  return rows
    .map((row) => `<tr><th>${esc(row[0])}</th><td class="mono">${esc(row[1])}</td></tr>`)
    .join("");
}

const CSS = `
:root{
  color-scheme:dark;
  --bg:#0e1116;
  --panel:#141a23;
  --panel2:#1a212c;
  --line:#25303e;
  --line2:#33404f;
  --fg:#dde3ec;
  --fg2:#9aa6b6;
  --fg3:#6b7787;
  --accent:#4b8ef8;
  --good:#3fcf8e;
  --bad:#ff6b6b;
}
html,body{margin:0;padding:0}
body{
  background:var(--bg);
  color:var(--fg);
  font-family:"Microsoft YaHei","PingFang SC",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:12.5px;
  line-height:1.5;
}
.wrap{max-width:980px;margin:0 auto;padding:16px 18px 32px}
.top{display:flex;align-items:baseline;gap:10px;margin:0 0 12px}
.top h1{font-size:13px;font-weight:600;margin:0;letter-spacing:.04em}
.ver{font-size:11.5px;color:var(--fg3)}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 0 14px}
.tab{
  appearance:none;-webkit-appearance:none;font:inherit;font-size:12.5px;line-height:1.5;
  color:var(--fg2);background:transparent;border:1px solid transparent;border-bottom:0;
  padding:6px 15px;border-radius:8px 8px 0 0;cursor:pointer;
  transition:background .12s ease,color .12s ease,opacity .12s ease;
}
.tab:hover{background:var(--panel);color:var(--fg)}
.tab.on{background:var(--panel);border-color:var(--line);color:var(--fg);position:relative;top:1px}
.tab:disabled{opacity:.45;cursor:not-allowed}
.pane{display:none}
.pane.on{display:block}
.field{margin:0 0 10px}
textarea{
  width:100%;display:block;resize:vertical;outline:none;
  font-family:ui-monospace,SFMono-Regular,Consolas,"Courier New",monospace;
  font-size:12.5px;line-height:1.5;color:var(--fg);background:var(--panel);
  border:1px solid var(--line);border-radius:10px;padding:9px 11px;
  transition:border-color .12s ease;
}
textarea:focus{border-color:var(--accent)}
textarea::placeholder{color:var(--fg3)}
#asset-text{min-height:130px}
#rules-text{min-height:300px}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px}
button.btn{
  appearance:none;-webkit-appearance:none;font:inherit;font-size:12.5px;line-height:1.5;
  color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:8px;
  padding:5px 13px;cursor:pointer;
  transition:background .12s ease,border-color .12s ease,color .12s ease,opacity .12s ease;
}
button.btn:hover{background:#222c3a;border-color:var(--line2)}
button.btn:active{background:#283342}
button.btn:disabled{opacity:.45;cursor:not-allowed;background:var(--panel);color:var(--fg2)}
button.btn.primary{background:#243c66;border-color:#31527f;color:#e8f0ff}
button.btn.primary:hover{background:#2c4979;border-color:#3d66a2}
button.btn.primary:disabled{background:#1b2637;border-color:#24344c;color:var(--fg2)}
button.btn.danger:hover{background:#3a2226;border-color:#6b3238;color:#ffd8dc}
input.f{
  font:inherit;font-size:12.5px;line-height:1.5;color:var(--fg);background:var(--panel);
  border:1px solid var(--line);border-radius:8px;padding:5px 10px;min-width:210px;
  outline:none;transition:border-color .12s ease;
}
input.f:focus{border-color:var(--accent)}
input.f::placeholder{color:var(--fg3)}
.note{font-size:12px;color:var(--fg2)}
.note.good{color:var(--good)}
.note.bad{color:var(--bad)}
.count{margin-left:auto;font-size:11.5px;color:var(--fg3)}
.count b{font-weight:600;color:var(--fg2)}
.hint{margin:8px 0 0;font-size:11.5px;color:var(--fg3)}
.tbl{max-height:320px;overflow:auto;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
.tbl table{width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.5}
.tbl thead th{
  position:sticky;top:0;z-index:1;text-align:left;font-weight:600;color:var(--fg2);
  background:#18202b;padding:6px 11px;border-bottom:1px solid var(--line);white-space:nowrap;
}
.tbl tbody td{padding:5px 11px;border-bottom:1px solid #1c2531;vertical-align:top;word-break:break-all}
.tbl tbody tr:last-child td{border-bottom:0}
.tbl tbody tr:hover td{background:#18202b}
.tbl td.mono{font-family:ui-monospace,SFMono-Regular,Consolas,"Courier New",monospace}
.tbl td.empty{color:var(--fg3);text-align:center;padding:20px 11px}
table.kv{width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.5}
table.kv th{
  width:150px;text-align:left;font-weight:500;color:var(--fg2);
  padding:6px 11px;border-bottom:1px solid #1c2531;white-space:nowrap;
}
table.kv td{padding:6px 11px;border-bottom:1px solid #1c2531;word-break:break-all}
table.kv tr:last-child th,table.kv tr:last-child td{border-bottom:0}
table.kv tr:hover th,table.kv tr:hover td{background:#18202b}
`;

const CLIENT_JS = `
(function () {
  "use strict";
  var state = { assets: [], filter: "", rulesLoaded: false, busy: false };

  function el(id) { return document.getElementById(id); }

  function esc(value) {
    var s = (value === null || value === undefined) ? "" : String(value);
    var out = "";
    for (var i = 0; i < s.length; i += 1) {
      var c = s.charCodeAt(i);
      if (c === 38) { out += "&amp;"; }
      else if (c === 60) { out += "&lt;"; }
      else if (c === 62) { out += "&gt;"; }
      else if (c === 34) { out += "&quot;"; }
      else if (c === 39) { out += "&#39;"; }
      else { out += s.charAt(i); }
    }
    return out;
  }

  function note(node, text, tone) {
    if (!node) { return; }
    node.textContent = text || "";
    node.className = tone ? "note " + tone : "note";
  }

  function setBusy(on) {
    state.busy = on;
    var btns = document.querySelectorAll("button.btn");
    for (var i = 0; i < btns.length; i += 1) { btns[i].disabled = on; }
  }

  function readJson(res) {
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    return res.json();
  }

  function fail(node, label, err) {
    var msg = (err && err.message) ? err.message : String(err);
    note(node, label + "：" + msg, "bad");
  }

  function renderAssets() {
    var body = el("asset-rows");
    if (!body) { return; }
    var f = state.filter.trim().toLowerCase();
    var shown = state.assets.filter(function (a) {
      if (!f) { return true; }
      var kind = String(a.kind || "").toLowerCase();
      var value = String(a.value || "").toLowerCase();
      return kind.indexOf(f) >= 0 || value.indexOf(f) >= 0;
    });
    if (!shown.length) {
      var tip = state.assets.length ? "没有匹配的资产" : "还没有资产，粘贴后点「批量导入」";
      body.innerHTML = "<tr><td colspan='3' class='empty'>" + tip + "</td></tr>";
    } else {
      var html = "";
      for (var i = 0; i < shown.length; i += 1) {
        var a = shown[i];
        html += "<tr><td>" + esc(a.kind) + "</td><td class='mono'>" + esc(a.value) +
          "</td><td class='mono'>" + esc(a.addedAt) + "</td></tr>";
      }
      body.innerHTML = html;
    }
    el("asset-total").textContent = String(state.assets.length);
    el("asset-shown").textContent = String(shown.length);
  }

  function loadAssets() {
    return fetch(\`/dsh-purge-unsafe/assets\`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(readJson)
      .then(function (data) {
        state.assets = Array.isArray(data && data.assets) ? data.assets : [];
        renderAssets();
      })
      .catch(function (err) { fail(el("asset-note"), "读取资产失败", err); });
  }

  function importText(text) {
    if (state.busy) { return; }
    var t = String(text || "").trim();
    if (!t) { note(el("asset-note"), "文本框是空的", "bad"); return; }
    setBusy(true);
    note(el("asset-note"), "导入中…", "");
    fetch(\`/dsh-purge-unsafe/assets\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ text: t })
    })
      .then(readJson)
      .then(function (data) {
        var added = Number(data && data.added ? data.added : 0);
        var dup = Number(data && data.duplicate ? data.duplicate : 0);
        var total = Number(data && data.total ? data.total : 0);
        note(el("asset-note"), "新增 " + added + "，重复 " + dup + "，共 " + total, "good");
        return loadAssets();
      })
      .catch(function (err) { fail(el("asset-note"), "导入失败", err); })
      .then(function () { setBusy(false); });
  }

  function clearAssets() {
    if (state.busy) { return; }
    if (!window.confirm("清空全部资产？")) { return; }
    setBusy(true);
    fetch(\`/dsh-purge-unsafe/assets/clear\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}"
    })
      .then(readJson)
      .then(function () {
        state.assets = [];
        renderAssets();
        note(el("asset-note"), "已清空", "good");
      })
      .catch(function (err) { fail(el("asset-note"), "清空失败", err); })
      .then(function () { setBusy(false); });
  }

  function ruleChars() {
    var box = el("rules-text");
    var n = box ? box.value.length : 0;
    el("rules-chars").textContent = String(n);
    return n;
  }

  function loadRules() {
    return fetch(\`/dsh-purge-unsafe/rules\`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(readJson)
      .then(function (data) {
        el("rules-text").value = String((data && data.rules) || "");
        state.rulesLoaded = true;
        ruleChars();
        note(el("rules-note"), "已载入当前规则", "");
      })
      .catch(function (err) { fail(el("rules-note"), "读取规则失败", err); });
  }

  function saveRules() {
    if (state.busy) { return; }
    setBusy(true);
    var text = el("rules-text").value;
    fetch(\`/dsh-purge-unsafe/rules\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ rules: text, text: text })
    })
      .then(readJson)
      .then(function (data) {
        var chars = (data && typeof data.chars === "number") ? data.chars : text.length;
        el("rules-chars").textContent = String(chars);
        note(el("rules-note"), "已保存，共 " + chars + " 字", "good");
      })
      .catch(function (err) { fail(el("rules-note"), "保存失败", err); })
      .then(function () { setBusy(false); });
  }

  function resetRules() {
    if (state.busy) { return; }
    setBusy(true);
    fetch(\`/dsh-purge-unsafe/rules/reset\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}"
    })
      .then(readJson)
      .then(function () { return loadRules(); })
      .then(function () { note(el("rules-note"), "已恢复默认规则", "good"); })
      .catch(function (err) { fail(el("rules-note"), "恢复失败", err); })
      .then(function () { setBusy(false); });
  }

  function loadStatus() {
    return fetch(\`/dsh-purge-unsafe/status\`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(readJson)
      .then(function (data) {
        var s = data || {};
        var rows = [
          ["版本", s.version],
          ["提示词是否注册", s.promptRegistered ? "已注册" : "未注册"],
          ["提示词字数", s.promptChars],
          ["资产数量", s.assets],
          ["数据目录", s.dataDir],
          ["宿主版本", s.host]
        ];
        var html = "";
        for (var i = 0; i < rows.length; i += 1) {
          html += "<tr><th>" + esc(rows[i][0]) + "</th><td class='mono'>" + esc(rows[i][1]) + "</td></tr>";
        }
        el("status-rows").innerHTML = html;
        note(el("status-note"), "已刷新", "");
      })
      .catch(function (err) { fail(el("status-note"), "读取状态失败", err); });
  }

  var TABS = document.querySelectorAll(".tab");

  function showTab(name) {
    for (var i = 0; i < TABS.length; i += 1) {
      TABS[i].classList.toggle("on", TABS[i].getAttribute("data-tab") === name);
    }
    var panes = document.querySelectorAll(".pane");
    for (var j = 0; j < panes.length; j += 1) {
      panes[j].classList.toggle("on", panes[j].getAttribute("data-pane") === name);
    }
    if (name === "rules" && !state.rulesLoaded) { loadRules(); }
    if (name === "status") { loadStatus(); }
  }

  for (var t = 0; t < TABS.length; t += 1) {
    (function (btn) {
      btn.addEventListener("click", function () { showTab(btn.getAttribute("data-tab")); });
    })(TABS[t]);
  }

  el("asset-import").addEventListener("click", function () { importText(el("asset-text").value); });
  el("asset-clear").addEventListener("click", clearAssets);
  el("asset-file-btn").addEventListener("click", function () { el("asset-file").click(); });
  el("asset-filter").addEventListener("input", function (ev) {
    state.filter = (ev.target && ev.target.value) || "";
    renderAssets();
  });

  el("asset-file").addEventListener("change", function (ev) {
    var picked = ev.target.files && ev.target.files[0];
    if (!picked) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      var text = String(reader.result || "");
      el("asset-text").value = text;
      importText(text);
    };
    reader.onerror = function () { note(el("asset-note"), "读文件失败", "bad"); };
    reader.readAsText(picked);
    ev.target.value = "";
  });

  el("rules-save").addEventListener("click", saveRules);
  el("rules-reset").addEventListener("click", resetRules);
  el("rules-text").addEventListener("input", ruleChars);

  showTab("assets");
  loadAssets();
})();
`;

export function renderPanel(input) {
  const opts = input && typeof input === "object" ? input : {};
  const version = opts.version === undefined || opts.version === null ? "" : String(opts.version);
  const status = opts.status && typeof opts.status === "object" ? opts.status : null;
  const head = version ? `<span class="ver">v${esc(version)}</span>` : "";
  const rows = initialStatusRows(status, version);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>破甲面板</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <h1>破甲面板</h1>
    ${head}
  </div>
  <div class="tabs" role="tablist">
    <button class="tab on" type="button" data-tab="assets" role="tab">资产</button>
    <button class="tab" type="button" data-tab="rules" role="tab">规则</button>
    <button class="tab" type="button" data-tab="status" role="tab">状态</button>
  </div>

  <section class="pane on" data-pane="assets" role="tabpanel">
    <div class="field">
      <textarea id="asset-text" spellcheck="false" placeholder="一行一个：域名 / IP / CIDR / host:port&#10;也支持逗号或空格分隔、整段粘贴；# 开头是注释"></textarea>
    </div>
    <div class="row">
      <button class="btn primary" type="button" id="asset-import">批量导入</button>
      <button class="btn" type="button" id="asset-file-btn">从文件导入</button>
      <button class="btn danger" type="button" id="asset-clear">清空</button>
      <input type="file" id="asset-file" accept=".txt,.csv,.list,.lst,text/plain" hidden>
      <span class="note" id="asset-note"></span>
    </div>
    <div class="row">
      <input class="f" id="asset-filter" type="text" placeholder="筛选：类型或值" spellcheck="false">
      <span class="count">显示 <b id="asset-shown">0</b> / 共 <b id="asset-total">0</b></span>
    </div>
    <div class="tbl">
      <table>
        <thead>
          <tr><th>类型</th><th>值</th><th>时间</th></tr>
        </thead>
        <tbody id="asset-rows">
          <tr><td colspan="3" class="empty">读取中…</td></tr>
        </tbody>
      </table>
    </div>
    <p class="hint">整段粘贴即可，逗号、空格、换行都当分隔符；重复项自动跳过。</p>
  </section>

  <section class="pane" data-pane="rules" role="tabpanel">
    <div class="field">
      <textarea id="rules-text" spellcheck="false" placeholder="提示词规则正文"></textarea>
    </div>
    <div class="row">
      <button class="btn primary" type="button" id="rules-save">保存</button>
      <button class="btn" type="button" id="rules-reset">恢复默认</button>
      <span class="note" id="rules-note"></span>
      <span class="count">字数 <b id="rules-chars">0</b></span>
    </div>
    <p class="hint">保存即写入规则文件，下一次会话按新规则生效。</p>
  </section>

  <section class="pane" data-pane="status" role="tabpanel">
    <div class="tbl">
      <table class="kv">
        <tbody id="status-rows">${rows}</tbody>
      </table>
    </div>
    <div class="row" style="margin-top:10px">
      <span class="note" id="status-note"></span>
    </div>
  </section>
</div>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}

export default renderPanel;
