import assert from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply, parseAssets } from '../lib/unsafe/index.js';

function makeHost(mode) {
  const routes = new Map();
  const sections = [];
  const webServer = {
    register: (spec) => {
      if (mode === 'legacy' && (spec.kind !== undefined || typeof spec.path !== 'string')) {
        throw new Error('legacy register 不接受 kind');
      }
      routes.set(spec.path, spec.handler);
      return () => routes.delete(spec.path);
    },
  };
  const ctx = {
    host: { version: mode === 'legacy' ? '0.2.0-rc.1' : '0.2.2-rc.3' },
    systemPrompt: {
      section: (args) => { sections.push(args); return () => {}; },
    },
  };
  if (mode === 'legacy') {
    ctx.webServer = webServer;
  } else {
    ctx.inject = (deps, fn) => { fn({ webServer }); };
  }
  return { ctx, routes, sections };
}

async function call(handler, url, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      async *[Symbol.asyncIterator]() {
        if (body !== undefined) yield Buffer.from(JSON.stringify(body));
      },
    };
    const res = {
      statusCode: 0,
      headers: {},
      body: '',
      setHeader(k, v) { this.headers[k] = v; },
      end(chunk) { this.body = chunk ?? ''; resolve({ status: this.statusCode, body: this.body, headers: this.headers }); },
    };
    try { handler(req, res); } catch (error) { reject(error); }
  });
}

function json(res) { return JSON.parse(res.body); }

const home = mkdtempSync(join(tmpdir(), 'pu-smoke-'));

const modern = makeHost('modern');
const dispose = apply(modern.ctx, { dshHome: home });
assert.equal(modern.sections.length, 1, '必须注册一个提示词段');
assert.equal(modern.sections[0].order, 4310);
assert.equal(typeof modern.sections[0].text, 'function', '段文本要用函数，规则才能即时生效');
assert.ok(modern.routes.has('/dsh-purge-unsafe'), '必须注册面板路由');
console.log('现代宿主: 段已注册 name=' + modern.sections[0].name + ' 字数=' + modern.sections[0].text().length);

const handler = modern.routes.get('/dsh-purge-unsafe');

const page = await call(handler, '/dsh-purge-unsafe');
assert.equal(page.status, 200);
assert.match(page.headers['content-type'], /text\/html/);
assert.ok(page.body.length > 3000, '面板 HTML 不能是空壳');
console.log('面板页: ok ' + page.body.length + ' 字符');

const first = json(await call(handler, '/dsh-purge-unsafe/assets', 'POST', {
  text: 'example.com, 10.0.0.5:8080\nhttps://demo.test/login\n10.0.0.0/24\nexample.com\n# 注释',
}));
assert.equal(first.added, 4);
assert.equal(first.duplicate, 0);
console.log('批量导入: ok added=' + first.added + ' total=' + first.total);

const dup = json(await call(handler, '/dsh-purge-unsafe/assets', 'POST', { text: 'example.com\n10.0.0.0/24' }));
assert.equal(dup.added, 0);
assert.equal(dup.duplicate, 2);
console.log('重复导入: ok duplicate=' + dup.duplicate);

const list = json(await call(handler, '/dsh-purge-unsafe/assets'));
assert.equal(list.assets.length, 4);
assert.deepEqual(
  [...new Set(list.assets.map((a) => a.kind))].sort(),
  ['cidr', 'host', 'host:port'].sort(),
);
assert.ok(list.assets.some((a) => a.value === 'demo.test'), 'URL 只保留 host');
console.log('资产分类: ok ' + list.assets.map((a) => a.kind).join(','));

const before = modern.sections[0].text().length;
const saved = json(await call(handler, '/dsh-purge-unsafe/rules', 'POST', { text: '自定义规则' }));
assert.equal(saved.chars, 5);
assert.equal(modern.sections[0].text(), '自定义规则', '保存后段文本立刻变');
console.log('规则即时生效: ok ' + before + ' → 5');

const models = json(await call(handler, '/dsh-purge-unsafe/models'));
assert.ok(Array.isArray(models.presets) && models.presets.length >= 2, '要有模型预设');
const picked = json(await call(handler, '/dsh-purge-unsafe/models', 'POST', { model: 'qwen-max' }));
assert.equal(picked.model, 'qwen-max');
console.log('模型预设: ok ' + models.presets.join('/'));

const reset = json(await call(handler, '/dsh-purge-unsafe/rules/reset', 'POST', {}));
assert.ok(reset.chars > 200, '恢复默认后应有实质文本');
console.log('恢复默认: ok chars=' + reset.chars);

const status = json(await call(handler, '/dsh-purge-unsafe/status'));
assert.equal(status.ok, true);
assert.equal(status.assets, 4);
assert.equal(status.promptRegistered, true);
assert.ok(status.promptChars > 200);
assert.ok(status.strategy, '状态里要带注册策略');
console.log('状态: ok ' + JSON.stringify({ version: status.version, host: status.host, assets: status.assets, strategy: status.strategy }));

const missing = await call(handler, '/dsh-purge-unsafe/nope');
assert.equal(missing.status, 404);
const cleared = json(await call(handler, '/dsh-purge-unsafe/assets/clear', 'POST', {}));
assert.equal(cleared.total, 0);
console.log('404 + 清空: ok');

dispose?.();

const legacy = makeHost('legacy');
apply(legacy.ctx, { dshHome: home });
assert.ok(legacy.routes.has('/dsh-purge-unsafe'), '旧版宿主也要能注册面板路由');
const legacyPage = await call(legacy.routes.get('/dsh-purge-unsafe'), '/dsh-purge-unsafe');
assert.equal(legacyPage.status, 200);
console.log('旧版宿主(rc1 形态): 面板 ok ' + legacyPage.body.length + ' 字符');

assert.deepEqual(parseAssets('# 空\n\n').length, 0);
assert.equal(parseAssets('a.com b.com,c.com').length, 3, '逗号与空格都要能分');
assert.equal(parseAssets('http://x.test:8080/path?q=1')[0].value, 'x.test:8080', '带端口与查询串的 URL 只留 host:port');
console.log('解析器: ok');

rmSync(home, { recursive: true, force: true });
console.log('\n全部通过');
