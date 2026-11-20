import assert from "node:assert";
import { renderPanel } from "../lib/unsafe/panel.js";

function count(hay, needle) {
  return hay.split(needle).length - 1;
}

const html = renderPanel({
  version: "0.1.0",
  status: {
    version: "0.1.0",
    promptRegistered: true,
    promptChars: 1234,
    assets: 7,
    dataDir: "C:\\Users\\test\\.dsh\\dsh-purge-unsafe",
    host: "0.2.2-rc.5",
  },
});

assert.ok(typeof html === "string", "renderPanel() 必须返回字符串");

assert.ok(html.includes('data-tab="assets"'), "缺少资产页签");
assert.ok(html.includes('data-tab="rules"'), "缺少规则页签");
assert.ok(html.includes('data-tab="status"'), "缺少状态页签");
assert.ok(html.includes(">资产<"), "缺少「资产」文案");
assert.ok(html.includes(">规则<"), "缺少「规则」文案");
assert.ok(html.includes(">状态<"), "缺少「状态」文案");
assert.ok(html.includes('class="tab on" type="button" data-tab="assets"'), "默认页签不是资产");
assert.ok(html.includes('class="pane on" data-pane="assets"'), "默认面板不是资产");

for (const label of ["批量导入", "从文件导入", "清空", "保存", "恢复默认"]) {
  assert.ok(html.includes(`>${label}<`), `缺少按钮：${label}`);
}

for (const banned of ["你好", "激活", "注入", "activate"]) {
  assert.ok(!html.includes(banned), `页面出现了禁止字样：${banned}`);
}

assert.ok(html.includes("fetch(`/dsh-purge-unsafe/assets`"), "缺少资产读取接口调用");
assert.ok(html.includes("fetch(`/dsh-purge-unsafe/assets/clear`"), "缺少清空接口调用");
assert.ok(html.includes("fetch(`/dsh-purge-unsafe/rules/reset`"), "缺少恢复默认接口调用");
assert.ok(html.includes("fetch(`/dsh-purge-unsafe/rules`"), "缺少规则接口调用");
assert.ok(html.includes("fetch(`/dsh-purge-unsafe/status`"), "缺少状态接口调用");
assert.ok(html.includes("function esc("), "缺少 esc() 转义函数");

assert.ok(html.includes('<meta charset="utf-8">'), "缺少 <meta charset=\"utf-8\">");
assert.ok(html.includes("color-scheme:dark"), "缺少 color-scheme:dark");

const bytes = Buffer.byteLength(html, "utf8");
assert.ok(bytes >= 8 * 1024, `HTML 太小：${bytes} 字节`);
assert.ok(bytes <= 60 * 1024, `HTML 太大：${bytes} 字节`);
assert.strictEqual(count(html, "<script"), 1, "<script> 数量必须为 1");
assert.strictEqual(count(html, "</script>"), 1, "</script> 数量必须为 1");
assert.strictEqual(count(html, "<style"), 1, "<style> 数量必须为 1");
assert.strictEqual(count(html, "</style>"), 1, "</style> 数量必须为 1");

const bare = renderPanel();
assert.ok(typeof bare === "string" && bare.length > 8 * 1024, "renderPanel() 无参调用输出不完整");
assert.ok(bare.includes('data-tab="assets"') && bare.includes("color-scheme:dark"), "无参调用缺页签或配色");

const evil = renderPanel({ version: "<img src=x>", status: null });
assert.ok(!evil.includes("<img src=x>"), "版本号未转义");

console.log(`panel.test.mjs ok — ${bytes} 字节，页签 3 个，script 1 个，style 1 个`);
