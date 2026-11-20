import {
  probeHost,
  registerSection,
  registerContext,
  registerWeb,
  onHostReady,
} from '../lib/unsafe/compat.js';

let pass = 0;
let fail = 0;
const failures = [];

function ok(condition, label, detail) {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${label}`);
    return true;
  }
  fail += 1;
  failures.push(label + (detail === undefined ? '' : ` → ${detail}`));
  console.log(`  ✗ ${label}${detail === undefined ? '' : ` → ${detail}`}`);
  return false;
}

function eq(actual, expected, label) {
  const same = actual === expected;
  return ok(same, label, same ? undefined : `实际=${JSON.stringify(actual)} 期望=${JSON.stringify(expected)}`);
}

function deepEq(actual, expected, label) {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  return ok(same, label, same ? undefined : `实际=${JSON.stringify(actual)} 期望=${JSON.stringify(expected)}`);
}

const RC_VERSIONS = {
  1: '0.2.0-rc.1',
  2: '0.2.0-rc.2',
  3: '0.2.2-rc.3',
  4: '0.2.2-rc.4',
  5: '0.2.2-rc.5',
};

const EXPECT_STRATEGY = {
  1: { sectionApi: 'legacy', contextApi: 'none', webServerApi: 'legacy' },
  2: { sectionApi: 'legacy', contextApi: 'none', webServerApi: 'legacy' },
  3: { sectionApi: 'modern', contextApi: 'modern', webServerApi: 'modern' },
  4: { sectionApi: 'modern', contextApi: 'modern', webServerApi: 'modern' },
  5: { sectionApi: 'modern', contextApi: 'modern', webServerApi: 'modern' },
};

const EXPECT_WEB_SIGNATURE = {
  1: 'object-path-handler',
  2: 'object-path-handler',
  3: 'object-kind',
  4: 'positional',
  5: 'positional',
};

function describeSpec(spec) {
  if (!spec || typeof spec !== 'object') return spec;
  return {
    name: spec.name,
    order: spec.order,
    kind: spec.kind,
    path: spec.path,
    textKind: typeof spec.text,
    text: typeof spec.text === 'function' ? '(函数)' : spec.text,
    handlerIsFunction: typeof spec.handler === 'function',
  };
}

function makeWebServer(rc, sink) {
  const routes = [];
  const server = {
    routes,
    register(...args) {
      sink.push({ api: 'webServer.register', args: args.map((arg) => describeSpec(arg)) });
      if (rc <= 2) {
        const [spec, extra] = args;
        if (
          extra !== undefined
          || !spec || typeof spec !== 'object'
          || spec.kind !== undefined
          || typeof spec.path !== 'string'
          || typeof spec.handler !== 'function'
        ) {
          throw new Error('rc1/rc2: register 只接受 {path, handler}');
        }
        routes.push({ kind: 'prefix', path: spec.path, handler: spec.handler, signature: 'object-path-handler' });
        return undefined;
      }
      if (rc === 3) {
        const [spec, extra] = args;
        if (
          extra !== undefined
          || !spec || typeof spec !== 'object'
          || spec.kind !== 'prefix'
          || typeof spec.path !== 'string'
          || typeof spec.handler !== 'function'
        ) {
          throw new Error('rc3: register 需要 {kind:"prefix",path,handler}');
        }
        routes.push({ kind: spec.kind, path: spec.path, handler: spec.handler, signature: 'object-kind' });
        return () => { sink.push({ api: 'webServer.register.dispose' }); };
      }
      const [path, handler, extra] = args;
      if (extra !== undefined || typeof path !== 'string' || typeof handler !== 'function') {
        throw new Error(`rc${rc}: register 只接受 (path, handler)`);
      }
      routes.push({ kind: 'prefix', path, handler, signature: 'positional' });
      return rc === 5
        ? { close() { sink.push({ api: 'webServer.register.close' }); } }
        : undefined;
    },
  };
  return server;
}

function makeCtx(rc, options = {}) {
  const version = options.version || RC_VERSIONS[rc];
  const sink = [];
  const sections = [];
  const contexts = [];
  const webServer = makeWebServer(rc, sink);
  const systemPrompt = {
    section(spec) {
      sink.push({ api: 'systemPrompt.section', args: [describeSpec(spec)] });
      if (options.throwingSection) throw new Error('boom: 这个宿主的 section 坏了');
      if (!spec || typeof spec !== 'object' || typeof spec.name !== 'string' || spec.text === undefined) {
        throw new TypeError('section 需要 {name, text}');
      }
      if (rc <= 2 && typeof spec.text === 'function') {
        throw new TypeError('rc1/rc2: section 只收字符串 text');
      }
      const text = typeof spec.text === 'function' ? spec.text() : spec.text;
      sections.push({ name: spec.name, order: spec.order, text });
      if (rc >= 4) {
        return () => { sink.push({ api: 'systemPrompt.section.dispose', args: [spec.name] }); };
      }
      return undefined;
    },
  };

  if (rc >= 3) {
    systemPrompt.context = function context(spec) {
      sink.push({ api: 'systemPrompt.context', args: [describeSpec(spec)] });
      if (!spec || typeof spec !== 'object' || typeof spec.name !== 'string') {
        throw new TypeError('context 需要 {name, text}');
      }
      const text = typeof spec.text === 'function' ? spec.text() : spec.text;
      contexts.push({ name: spec.name, order: spec.order, text });
      if (rc >= 4) {
        return () => { sink.push({ api: 'systemPrompt.context.dispose' }); };
      }
      return undefined;
    };
  }

  const ctx = {
    host: { version },
    systemPrompt,
    webServer,
    sections,
    contexts,
    sink,
  };

  if (rc >= 3) {
    ctx.get = (name) => {
      if (name === 'webServer') return webServer;
      if (name === 'systemPrompt') return systemPrompt;
      if (name === 'tools') return ctx.tools;
      if (name === 'commands') return ctx.commands;
      return undefined;
    };
    ctx.inject = (deps, callback) => {
      sink.push({ api: 'ctx.inject', args: [deps] });
      const host = { webServer, systemPrompt, get: ctx.get, tools: ctx.tools, commands: ctx.commands };
      callback(host);
      return Promise.resolve(host);
    };
  }

  if (rc >= 4) {
    ctx.tools = {
      register(...args) {
        sink.push({ api: 'ctx.tools.register', args: args.map((arg) => describeSpec(arg)) });
        return undefined;
      },
    };
  }
  if (rc === 5) {
    ctx.commands = {
      register(...args) {
        sink.push({ api: 'ctx.commands.register', args: args.map((arg) => describeSpec(arg)) });
        return undefined;
      },
    };
  }

  return { ctx, sink, sections, contexts, webServer, version };
}

function makeHandler(hit) {
  return (req, res) => {
    hit.push({ method: req?.method, url: req?.url });
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, hit: hit.length }));
  };
}

function makeReqRes() {
  const res = {
    statusCode: 0,
    headers: null,
    body: '',
    ended: false,
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(body) {
      this.body = String(body ?? '');
      this.ended = true;
    },
  };
  return { req: { method: 'GET', url: '/dsh-purge-unsafe/status', headers: {} }, res };
}

function displayWidth(text) {
  let width = 0;
  for (const ch of String(text)) {
    const code = ch.codePointAt(0);
    const wide = code >= 0x1100 && (
      code <= 0x115f
      || code === 0x2329 || code === 0x232a
      || (code >= 0x2e80 && code <= 0xa4cf)
      || (code >= 0xac00 && code <= 0xd7a3)
      || (code >= 0xf900 && code <= 0xfaff)
      || (code >= 0xfe30 && code <= 0xfe6f)
      || (code >= 0xff00 && code <= 0xff60)
      || (code >= 0xffe0 && code <= 0xffe6)
    );
    width += wide ? 2 : 1;
  }
  return width;
}

function padCell(text, width) {
  const raw = String(text);
  return raw + ' '.repeat(Math.max(0, width - displayWidth(raw)));
}

function renderMatrix(rows) {
  const header = ['rc', 'section', 'context', 'web', '策略'];
  const table = [header, ...rows.map((row) => [row.rc, row.section, row.context, row.web, row.strategy])];
  const widths = header.map((_, column) => Math.max(...table.map((line) => displayWidth(line[column]))));
  const out = [];
  out.push(table[0].map((cell, index) => padCell(cell, widths[index])).join(' | '));
  out.push(widths.map((width) => '-'.repeat(width)).join('-+-'));
  for (let index = 1; index < table.length; index += 1) {
    out.push(table[index].map((cell, column) => padCell(cell, widths[column])).join(' | '));
  }
  return out.join('\n');
}

const rows = [];

for (const rc of [1, 2, 3, 4, 5]) {
  const version = RC_VERSIONS[rc];
  console.log(`\n[rc${rc}] ${version}`);
  const fake = makeCtx(rc);
  const { ctx } = fake;
  const probe = probeHost(ctx);

  eq(probe.version, version, `rc${rc}: 版本从 ctx.host.version 取到`);
  eq(probe.rc, rc, `rc${rc}: 识别出 rc 序号`);
  deepEq(probe.strategy, EXPECT_STRATEGY[rc], `rc${rc}: strategy 判定为 ${JSON.stringify(EXPECT_STRATEGY[rc])}`);
  eq(probe.hasSection, true, `rc${rc}: hasSection=true`);
  eq(probe.hasContext, rc >= 3, `rc${rc}: hasContext=${rc >= 3}`);
  eq(probe.hasInject, rc >= 3, `rc${rc}: hasInject=${rc >= 3}`);
  eq(probe.hasWebServer, true, `rc${rc}: hasWebServer=true`);
  ok(Array.isArray(probe.warnings), `rc${rc}: warnings 是数组`);

  const sectionText = `rc${rc} 的规则文本`;
  let sectionDispose;
  let sectionThrew = false;
  try {
    sectionDispose = registerSection(ctx, {
      name: `dsh-purge-unsafe:rc${rc}`,
      order: 4310,
      text: () => sectionText,
    });
  } catch (error) {
    sectionThrew = true;
    ok(false, `rc${rc}: registerSection 不允许抛异常`, String(error && error.message));
  }
  if (!sectionThrew) {
    eq(fake.sections.length, 1, `rc${rc}: section 注册了 1 段`);
    const registered = fake.sections[0] || {};
    eq(registered.name, `dsh-purge-unsafe:rc${rc}`, `rc${rc}: section 名字原样`);
    eq(registered.order, 4310, `rc${rc}: section order 原样`);
    eq(registered.text, sectionText, `rc${rc}: 函数 text 已求值为字符串`);
    if (rc >= 4) {
      eq(typeof sectionDispose, 'function', `rc${rc}: section 返回 dispose 函数`);
      if (typeof sectionDispose === 'function') {
        sectionDispose();
        ok(fake.sink.some((call) => call.api === 'systemPrompt.section.dispose'), `rc${rc}: dispose 被调用`);
      }
    } else {
      eq(sectionDispose, undefined, `rc${rc}: section 不返回 disposer（undefined）`);
    }
  }

  const contextDispose = registerContext(ctx, {
    name: `dsh-purge-unsafe:ctx-rc${rc}`,
    order: 4311,
    text: `rc${rc} 的上下文`,
  });
  if (rc >= 3) {
    eq(fake.contexts.length, 1, `rc${rc}: context 原生注册 1 段`);
    eq(fake.contexts[0] && fake.contexts[0].name, `dsh-purge-unsafe:ctx-rc${rc}`, `rc${rc}: context 名字原样`);
    eq(typeof contextDispose, rc >= 4 ? 'function' : 'undefined', `rc${rc}: context dispose 形态正确`);
  } else {
    const degraded = fake.sections.find((item) => item.name === `dsh-purge-unsafe:ctx-rc${rc}#context`);
    ok(Boolean(degraded), `rc${rc}: 没有 context，降级注册成 section`);
    eq(degraded ? degraded.order : null, 4312, `rc${rc}: 降级段 order+1`);
    eq(contextDispose, undefined, `rc${rc}: 降级路径返回 undefined`);
    ok(
      probe.warnings.some((warning) => warning.includes('context')),
      `rc${rc}: warnings 说明 context 缺失`,
    );
  }

  const hits = [];
  const handler = makeHandler(hits);
  let webDispose;
  let webThrew = false;
  try {
    webDispose = registerWeb(ctx, { path: '/dsh-purge-unsafe', handler });
  } catch (error) {
    webThrew = true;
    ok(false, `rc${rc}: registerWeb 不允许抛异常`, String(error && error.message));
  }
  let webStatus = 0;
  if (!webThrew) {
    eq(typeof webDispose, 'function', `rc${rc}: registerWeb 返回 dispose 函数`);
    eq(fake.webServer.routes.length, 1, `rc${rc}: 路由注册了 1 条`);
    const route = fake.webServer.routes[0] || {};
    eq(route.path, '/dsh-purge-unsafe', `rc${rc}: 路由 path 正确`);
    eq(route.signature, EXPECT_WEB_SIGNATURE[rc], `rc${rc}: 使用 ${EXPECT_WEB_SIGNATURE[rc]} 签名`);
    const { req, res } = makeReqRes();
    try {
      await route.handler(req, res);
      webStatus = res.statusCode;
      eq(res.statusCode, 200, `rc${rc}: handler 打一次返回 200`);
      eq(res.ended, true, `rc${rc}: handler 已写回响应`);
      ok(res.body.includes('"ok":true'), `rc${rc}: 响应体是 JSON ok`);
    } catch (error) {
      ok(false, `rc${rc}: handler 调用不抛`, String(error && error.message));
    }
    if (typeof webDispose === 'function') {
      let disposeThrew = false;
      try {
        webDispose();
      } catch {
        disposeThrew = true;
      }
      ok(!disposeThrew, `rc${rc}: webDispose 不抛`);
    }
    const attempts = fake.sink.filter((call) => call.api === 'webServer.register').length;
    const expectedAttempts = rc <= 2 ? 2 : (rc === 3 ? 1 : 3);
    eq(attempts, expectedAttempts, `rc${rc}: 降级链共尝试 ${expectedAttempts} 种签名`);
  }

  rows.push({
    rc: `rc${rc} (${version})`,
    section: sectionThrew
      ? '✗ 抛错'
      : `✓ ${probe.strategy.sectionApi}${rc <= 2 ? '(字符串降级)' : ''}${rc >= 4 ? '(dispose)' : ''}`,
    context: rc >= 3
      ? `✓ ${probe.strategy.contextApi}${rc >= 4 ? '(dispose)' : ''}`
      : '降级→section',
    web: webThrew
      ? '✗ 抛错'
      : `✓ ${EXPECT_WEB_SIGNATURE[rc]} → ${webStatus}`,
    strategy: `section=${probe.strategy.sectionApi} context=${probe.strategy.contextApi} web=${probe.strategy.webServerApi}`,
  });
}

console.log('\n[故障注入] section 抛错');
{
  const broken = makeCtx(4, { throwingSection: true });
  const probe = probeHost(broken.ctx);
  let threw = false;
  let dispose;
  try {
    dispose = registerSection(broken.ctx, { name: 'broken', order: 1, text: 'x' });
  } catch (error) {
    threw = true;
    ok(false, 'section 抛错时 registerSection 不外抛', String(error && error.message));
  }
  if (!threw) {
    eq(dispose, undefined, 'break: 注册失败返回 undefined');
    eq(broken.sections.length, 0, 'break: 没有段落被错误注册');
    ok(
      probe.warnings.some((warning) => warning.includes('section')),
      'break: warnings 里有一条 section 失败说明',
      JSON.stringify(probe.warnings),
    );
    ok(
      probe.warnings.some((warning) => warning.includes('registerSection 失败')),
      'break: warnings 明确指出 registerSection 失败',
    );
  }
}

console.log('\n[onHostReady] inject 两种写法');
{
  const legacy = makeCtx(1);
  let legacyHost = null;
  onHostReady(legacy.ctx, ['webServer'], (host) => { legacyHost = host; });
  ok(legacyHost === legacy.ctx, 'rc1: 没有 inject 时同步直连 ctx');
  ok(!legacy.sink.some((call) => call.api === 'ctx.inject'), 'rc1: 没有调用 ctx.inject');
}
{
  const modern = makeCtx(4);
  let modernHost = null;
  onHostReady(modern.ctx, ['webServer'], (host) => { modernHost = host; });
  ok(modernHost && modernHost.webServer === modern.webServer, 'rc4: 走 ctx.inject 拿到宿主');
  const injectCall = modern.sink.find((call) => call.api === 'ctx.inject');
  ok(Boolean(injectCall), 'rc4: 记录了 ctx.inject 调用');
  deepEq(injectCall ? injectCall.args : null, [['webServer']], 'rc4: deps 原样传给 ctx.inject');
}
{
  const cbError = makeCtx(1);
  let threw = false;
  try {
    onHostReady(cbError.ctx, ['webServer'], () => { throw new Error('callback boom'); });
  } catch {
    threw = true;
  }
  ok(!threw, '回调抛错时 onHostReady 不外抛');
}

console.log('\n[懒注入] webServer 只在 ctx.inject 之后可见');
{
  const lazy = makeCtx(3);
  delete lazy.ctx.webServer;
  delete lazy.ctx.get;
  const hits = [];
  const handler = makeHandler(hits);
  const dispose = registerWeb(lazy.ctx, { path: '/lazy', handler });
  eq(typeof dispose, 'function', 'lazy: 返回可调用的 dispose');
  eq(lazy.webServer.routes.length, 1, 'lazy: inject 之后路由注册成功');
  eq(lazy.webServer.routes[0] && lazy.webServer.routes[0].path, '/lazy', 'lazy: 路由 path 正确');
  let threw = false;
  try {
    dispose();
  } catch {
    threw = true;
  }
  ok(!threw, 'lazy: dispose 不抛');
}

console.log('\n[边界] 未知版本与空 ctx');
{
  const savedEnv = process.env.DSH_VERSION;
  delete process.env.DSH_VERSION;
  try {
    const unknown = makeCtx(3);
    delete unknown.ctx.host;
    delete unknown.ctx.app;
    const probe = probeHost(unknown.ctx);
    eq(probe.version, 'unknown', 'unknown: 版本取不到时是 unknown');
    eq(probe.strategy.sectionApi, 'modern', 'unknown: 按 modern 最新策略');
    ok(
      probe.warnings.some((warning) => warning.includes('识别不到宿主版本')),
      'unknown: warnings 说明按最新策略执行',
    );
  } finally {
    if (savedEnv !== undefined) process.env.DSH_VERSION = savedEnv;
  }
}
{
  let threw = false;
  try {
    const probe = probeHost(null);
    eq(probe.version, 'unknown', 'null ctx: probeHost 不崩');
    eq(registerSection(null, { name: 'n', order: 1, text: 't' }), undefined, 'null ctx: registerSection 返回 undefined');
    eq(registerContext(null, { name: 'n', order: 1, text: 't' }), undefined, 'null ctx: registerContext 返回 undefined');
    eq(registerWeb(null, { path: '/x', handler: () => {} }), undefined, 'null ctx: registerWeb 返回 undefined');
    onHostReady(null, ['webServer'], () => {});
  } catch (error) {
    threw = true;
    ok(false, 'null ctx: 所有导出函数都不抛', String(error && error.message));
  }
  ok(!threw, 'null ctx: 所有导出函数都不抛');
}

console.log('\n矩阵 / matrix');
console.log(renderMatrix(rows));

console.log(`\n断言合计: ${pass + fail}，通过 ${pass}，失败 ${fail}`);
if (fail > 0) {
  for (const item of failures) console.log(`  ! ${item}`);
  process.exitCode = 1;
} else {
  console.log('compat-matrix: all green');
}
