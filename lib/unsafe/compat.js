const VERSION_RE = /0\.2\.(\d+)(?:-rc\.(\d+))?/;
const VERSION_RE_LOOSE = /0\.2\.(\d+)(?:-rc\.?(\d+))?/i;

const HOST_STATE = new WeakMap();

function hostState(ctx) {
  if (!ctx || (typeof ctx !== 'object' && typeof ctx !== 'function')) {
    return { warnings: [] };
  }
  let state = HOST_STATE.get(ctx);
  if (!state) {
    state = { warnings: [] };
    HOST_STATE.set(ctx, state);
  }
  return state;
}

function warn(ctx, message) {
  const state = hostState(ctx);
  const text = String(message || '').trim();
  if (!text) return;
  if (!state.warnings.includes(text)) state.warnings.push(text);
}

function errText(error) {
  if (error === null || error === undefined) return '未知错误';
  if (typeof error === 'string') return error;
  try {
    return String(error.message || error);
  } catch {
    return '未知错误';
  }
}

function read(target, key) {
  if (target === null || target === undefined) return undefined;
  try {
    return target[key];
  } catch {
    return undefined;
  }
}

function serviceOf(ctx, name) {
  const direct = read(ctx, name);
  if (direct && (typeof direct === 'object' || typeof direct === 'function')) return direct;
  const get = read(ctx, 'get');
  if (typeof get === 'function') {
    try {
      const viaGet = get.call(ctx, name);
      if (viaGet) return viaGet;
    } catch {

    }
  }
  return undefined;
}

function systemPromptOf(ctx) {
  const sp = serviceOf(ctx, 'systemPrompt');
  return sp && typeof sp === 'object' ? sp : undefined;
}

function webServerOf(ctx) {
  const ws = serviceOf(ctx, 'webServer');
  if (!ws) return undefined;
  return typeof read(ws, 'register') === 'function' ? ws : undefined;
}

function versionOf(ctx) {
  const hostVersion = read(read(ctx, 'host'), 'version');
  if (hostVersion !== undefined && hostVersion !== null && String(hostVersion).trim()) {
    return { version: String(hostVersion).trim(), source: 'ctx.host.version' };
  }
  const appVersion = read(read(ctx, 'app'), 'version');
  if (appVersion !== undefined && appVersion !== null && String(appVersion).trim()) {
    return { version: String(appVersion).trim(), source: 'ctx.app.version' };
  }
  const envVersion = typeof process !== 'undefined' && process.env ? process.env.DSH_VERSION : undefined;
  if (envVersion && String(envVersion).trim()) {
    return { version: String(envVersion).trim(), source: 'process.env.DSH_VERSION' };
  }
  return { version: 'unknown', source: 'none' };
}

function parseVersion(raw) {
  const text = String(raw ?? '');
  let match = VERSION_RE.exec(text);
  if (!match) match = VERSION_RE_LOOSE.exec(text);
  if (!match) return { known: false, rc: null, minor: null };
  const minor = Number(match[1]);
  const rc = match[2] === undefined ? null : Number(match[2]);
  return { known: true, rc, minor };
}

function isModern(parsed) {
  if (!parsed.known) return true;
  if (parsed.rc === null) return true;
  return parsed.rc >= 3;
}

function normalizeDispose(returned) {
  if (!returned) return undefined;
  if (typeof returned === 'function') {
    return () => {
      try {
        returned();
      } catch {

      }
    };
  }
  if (typeof returned === 'object') {
    for (const key of ['close', 'dispose', 'unregister', 'off']) {
      const fn = read(returned, key);
      if (typeof fn === 'function') {
        return () => {
          try {
            fn.call(returned);
          } catch {

          }
        };
      }
    }
  }
  return undefined;
}

function resolveText(text) {
  return typeof text === 'function' ? text() : text;
}

function normalizeSpec(spec) {
  if (!spec || typeof spec !== 'object') return undefined;
  const name = typeof spec.name === 'string' ? spec.name : '';
  if (!name) return undefined;
  const order = Number.isFinite(Number(spec.order)) ? Number(spec.order) : 0;
  return { name, order, text: spec.text, extra: spec.extra };
}

export function probeHost(ctx) {
  const state = hostState(ctx);
  const { version, source } = versionOf(ctx);
  const parsed = parseVersion(version);
  const modern = isModern(parsed);

  const sp = systemPromptOf(ctx);
  const ws = webServerOf(ctx);
  const hasSection = typeof read(sp, 'section') === 'function';
  const hasContext = typeof read(sp, 'context') === 'function';
  const hasWebServer = Boolean(ws);
  const hasInject = typeof read(ctx, 'inject') === 'function';
  const hasTools = typeof read(serviceOf(ctx, 'tools'), 'register') === 'function';
  const hasCommands = typeof read(serviceOf(ctx, 'commands'), 'register') === 'function';

  const strategy = {
    sectionApi: hasSection ? (modern ? 'modern' : 'legacy') : 'none',
    contextApi: hasContext ? (modern ? 'modern' : 'legacy') : 'none',
    webServerApi: hasWebServer ? (modern ? 'modern' : 'legacy') : 'none',
  };

  if (!parsed.known) {
    warn(ctx, `识别不到宿主版本（host.version / app.version / DSH_VERSION 都为空，取到 "${version}"），按最新 rc5 策略执行`);
  }
  if (!hasSection) {
    warn(ctx, '宿主没有 systemPrompt.section：提示词段无法注册，其余功能照常');
  }
  if (hasSection && !modern) {
    warn(ctx, '按 0.2.x-rc1/rc2 legacy 策略执行：section 只按字符串 text 注册，context 缺失时降级为 section');
  }
  if (!hasContext) {
    warn(ctx, '宿主没有 systemPrompt.context：上下文段会降级成 section（rc1/rc2 假设）');
  }
  if (!hasWebServer && hasInject) {
    warn(ctx, 'webServer 当前不可见：registerWeb 会等 ctx.inject 注入后再注册（rc3+ 懒注入）');
  }
  if (!hasWebServer) {
    warn(ctx, '宿主没有 webServer：HTTP 路由不可用，面板接口会缺，提示词与数据仍可用');
  }
  if (!hasInject) {
    warn(ctx, 'ctx.inject 不存在：懒注入不执行，服务直接从 ctx 上取（rc1/rc2 假设）');
  }

  return {
    version,
    versionSource: source,
    rc: parsed.known ? parsed.rc : null,
    hasSection,
    hasContext,
    hasWebServer,
    hasInject,
    hasTools,
    hasCommands,
    strategy,
    warnings: state.warnings,
  };
}

export function registerSection(ctx, spec) {
  try {
    const normalized = normalizeSpec(spec);
    if (!normalized) {
      warn(ctx, 'registerSection: 缺少 name，已跳过');
      return undefined;
    }
    const sp = systemPromptOf(ctx);
    const sectionFn = read(sp, 'section');
    if (typeof sectionFn !== 'function') {
      warn(ctx, 'registerSection: 宿主没有 systemPrompt.section，该段未注册');
      return undefined;
    }
    const base = { name: normalized.name, order: normalized.order, text: normalized.text };
    if (normalized.extra && typeof normalized.extra === 'object') Object.assign(base, normalized.extra);

    try {
      const returned = sectionFn.call(sp, base);
      return normalizeDispose(returned);
    } catch (error) {
      warn(ctx, `systemPrompt.section 不接受当前结构（${errText(error)}），继续按字符串降级`);
    }

    let legacyText;
    try {
      legacyText = resolveText(normalized.text);
    } catch (error) {
      warn(ctx, `提示词 text 函数执行失败（${errText(error)}），按空串注册`);
      legacyText = '';
    }
    try {
      const returned = sectionFn.call(sp, { name: normalized.name, order: normalized.order, text: String(legacyText ?? '') });
      warn(ctx, '已按 legacy 降级：section 收到的是字符串 text（rc1/rc2 假设）');
      return normalizeDispose(returned);
    } catch (error) {
      warn(ctx, `systemPrompt.section 字符串降级也失败（${errText(error)}）`);
    }

    try {
      const returned = sectionFn.call(sp, normalized.name, String(legacyText ?? ''));
      warn(ctx, '已按上一代降级：section(name, text) 位置参数（老实现假设）');
      return normalizeDispose(returned);
    } catch (error) {
      warn(ctx, `registerSection 失败，该段未注册：${errText(error)}`);
      return undefined;
    }
  } catch (error) {
    try {
      warn(ctx, `registerSection 异常，该段未注册：${errText(error)}`);
    } catch {
    }
    return undefined;
  }
}

export function registerContext(ctx, spec) {
  try {
    const normalized = normalizeSpec(spec);
    if (!normalized) {
      warn(ctx, 'registerContext: 缺少 name，已跳过');
      return undefined;
    }
    const sp = systemPromptOf(ctx);
    const contextFn = read(sp, 'context');
    if (typeof contextFn !== 'function') {
      warn(ctx, '宿主没有 systemPrompt.context，上下文段已降级为 section（rc1/rc2）');
      return registerSection(ctx, {
        name: `${normalized.name}#context`,
        order: normalized.order + 1,
        text: normalized.text,
      });
    }
    const base = { name: normalized.name, order: normalized.order, text: normalized.text };
    if (normalized.extra && typeof normalized.extra === 'object') Object.assign(base, normalized.extra);
    try {
      const returned = contextFn.call(sp, base);
      return normalizeDispose(returned);
    } catch (error) {
      warn(ctx, `systemPrompt.context 调用失败（${errText(error)}），上下文段降级为 section`);
      return registerSection(ctx, {
        name: `${normalized.name}#context`,
        order: normalized.order + 1,
        text: normalized.text,
      });
    }
  } catch (error) {
    try {
      warn(ctx, `registerContext 异常，该段未注册：${errText(error)}`);
    } catch {
    }
    return undefined;
  }
}

function registerOnServer(ctx, server, path, handler) {
  const registerFn = read(server, 'register');
  if (typeof registerFn !== 'function') {
    warn(ctx, 'webServer.register 不是函数，路由未注册');
    return undefined;
  }
  const attempts = [
    ['{kind:"prefix",path,handler}', () => registerFn.call(server, { kind: 'prefix', path, handler })],
    ['{path,handler}', () => registerFn.call(server, { path, handler })],
    ['(path,handler)', () => registerFn.call(server, path, handler)],
  ];
  let lastError = null;
  for (let index = 0; index < attempts.length; index += 1) {
    const [label, run] = attempts[index];
    try {
      const returned = run();
      if (index > 0) {
        warn(ctx, `webServer.register 已按第 ${index + 1} 种签名 ${label} 注册（宿主拒收前面的签名）`);
      }
      return normalizeDispose(returned) || (() => {});
    } catch (error) {
      lastError = error;
    }
  }
  warn(ctx, `webServer.register 三种签名都失败，路由 ${path} 未注册：${errText(lastError)}`);
  return undefined;
}

export function registerWeb(ctx, spec) {
  try {
    const path = spec && typeof spec.path === 'string' ? spec.path : '';
    const handler = spec && spec.handler;
    if (!path) {
      warn(ctx, 'registerWeb: 缺少 path，路由未注册');
      return undefined;
    }
    if (typeof handler !== 'function') {
      warn(ctx, `registerWeb: 路由 ${path} 的 handler 不是函数，未注册`);
      return undefined;
    }
    const server = webServerOf(ctx);
    if (server) return registerOnServer(ctx, server, path, handler);

    if (typeof read(ctx, 'inject') === 'function') {
      warn(ctx, `webServer 暂不可见，路由 ${path} 已排队等 ctx.inject 注入后注册`);
      const disposers = [];
      onHostReady(ctx, ['webServer'], (host) => {
        const lateServer = webServerOf(host) || webServerOf(ctx);
        if (!lateServer) {
          warn(ctx, `ctx.inject 完成后仍没有 webServer，路由 ${path} 未注册`);
          return;
        }
        const dispose = registerOnServer(ctx, lateServer, path, handler);
        if (dispose) disposers.push(dispose);
      });
      return () => {
        for (let index = disposers.length - 1; index >= 0; index -= 1) {
          try {
            disposers[index]();
          } catch {
          }
        }
        disposers.length = 0;
      };
    }

    warn(ctx, `宿主没有 webServer，路由 ${path} 未注册（该版本没有 HTTP 注册面）`);
    return undefined;
  } catch (error) {
    try {
      warn(ctx, `registerWeb 异常，路由未注册：${errText(error)}`);
    } catch {
    }
    return undefined;
  }
}

export function onHostReady(ctx, deps, fn) {
  try {
    if (typeof fn !== 'function') return;
    const list = Array.isArray(deps)
      ? deps.filter((item) => typeof item === 'string' && item)
      : (typeof deps === 'string' && deps ? [deps] : []);
    let settled = false;
    const run = (host) => {
      if (settled) return;
      settled = true;
      try {
        fn(host || ctx);
      } catch (error) {
        warn(ctx, `onHostReady 回调失败：${errText(error)}`);
      }
    };

    const injectFn = read(ctx, 'inject');
    if (typeof injectFn === 'function') {
      try {
        const returned = injectFn.call(ctx, list, (host) => run(host));
        if (returned && typeof returned.then === 'function') {
          returned.then(undefined, (error) => {
            warn(ctx, `ctx.inject 失败：${errText(error)}，改走直连 ctx`);
            run(ctx);
          });
        }
        return;
      } catch (error) {
        warn(ctx, `ctx.inject 调用失败：${errText(error)}，改走直连 ctx`);
      }
    }
    try {
      fn(ctx);
    } catch (error) {
      warn(ctx, `onHostReady 直连回调失败：${errText(error)}`);
    }
  } catch (error) {
    try {
      warn(ctx, `onHostReady 异常：${errText(error)}`);
    } catch {
    }
  }
}
