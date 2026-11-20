import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { probeHost, registerSection, registerWeb } from './compat.js';
import { renderPanel } from './panel.js';
import { DEFAULT_RULES, MODEL_PRESETS, rulesFor } from './rules.js';

export const name = 'dsh-purge-unsafe';
export const inject = ['systemPrompt'];
export const order = 4310;

const BASE = '/dsh-purge-unsafe';
const VERSION = '0.1.0';
const ENTRY_ORDER = 4310;

function rootDir(dshHome) {
  const root = dshHome || process.env.DSH_HOME || join(homedir(), '.dsh');
  const dir = join(root, 'dsh-purge-unsafe');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  const tmp = `${file}.${randomUUID().slice(0, 8)}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tmp, file);
}

export function parseAssets(text) {
  const out = [];
  const seen = new Set();
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    for (const piece of line.split(/[,;\s]+/)) {
      let value = piece.trim();
      if (!value) continue;
      const scheme = /^https?:\/\/([^/\s?#]+)/i.exec(value);
      if (scheme) value = scheme[1];
      value = value.replace(/\/+$/, '');
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        value,
        kind: /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(value)
          ? (value.includes('/') ? 'cidr' : 'ip')
          : (/:\d+$/.test(value) ? 'host:port' : 'host'),
        addedAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  if (typeof res.setHeader === 'function') {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
  }
  res.statusCode = status;
  res.end(body);
}

function sendHtml(res, html) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
  }
  res.statusCode = 200;
  res.end(html);
}

async function readBody(req) {
  if (req && typeof req.json === 'function') return req.json();
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function createStore(dshHome) {
  const dir = rootDir(dshHome);
  const assetsFile = join(dir, 'assets.json');
  const stateFile = join(dir, 'state.json');
  return {
    dir,
    assets: () => readJson(assetsFile, []),
    saveAssets: (list) => writeJson(assetsFile, list),
    state: () => readJson(stateFile, { rules: '', model: '', updatedAt: null }),
    saveState: (state) => writeJson(stateFile, state),
  };
}

export function apply(ctx, config) {
  const initial = probeHost(ctx);
  const store = createStore(config?.dshHome);
  const liveProbe = () => probeHost(ctx);
  const flags = { section: false, web: false };
  const allWarnings = () => {
    const raw = [...new Set([...(initial.warnings ?? []), ...(liveProbe().warnings ?? [])])];
    return raw.filter((w) => {
      if (flags.section && /systemPrompt|section|提示词段/.test(w)) return false;
      if (flags.web && /webServer|面板/.test(w)) return false;
      return true;
    });
  };

  const model = () => String(store.state().model || '');
  const rulesText = () => {
    const custom = store.state().rules;
    if (typeof custom === 'string' && custom.trim()) return custom;
    return rulesFor(model());
  };
  const text = () => rulesText();

  const sectionDispose = registerSection(ctx, { name: 'dsh-purge-unsafe:rules', order: ENTRY_ORDER, text });
  const sectionOk = Boolean(sectionDispose) || liveProbe().hasSection;
  flags.section = sectionOk;

  const handler = (req, res) => {
    void (async () => {
      const method = String(req?.method || 'GET').toUpperCase();
      const url = String(req?.url || '');
      const path = url.split('?')[0] || '';
      try {
        if (path === BASE || path === `${BASE}/`) {
          return sendHtml(res, renderPanel({
            version: VERSION,
            status: {
              version: VERSION,
              promptRegistered: Boolean(sectionDispose) || liveProbe().hasSection,
              promptChars: text().length,
              assets: store.assets().length,
              dataDir: store.dir,
              host: liveProbe().version,
              warnings: allWarnings(),
            },
          }));
        }
        if (path === `${BASE}/assets` && method === 'GET') {
          return sendJson(res, 200, { ok: true, assets: store.assets() });
        }
        if (path === `${BASE}/assets` && method === 'POST') {
          const body = await readBody(req);
          const incoming = parseAssets(body.text);
          const existing = store.assets();
          const seen = new Set(existing.map((a) => String(a.value).toLowerCase()));
          const added = [];
          let duplicate = 0;
          for (const item of incoming) {
            if (seen.has(item.value.toLowerCase())) { duplicate += 1; continue; }
            seen.add(item.value.toLowerCase());
            added.push(item);
          }
          const merged = [...added, ...existing];
          store.saveAssets(merged);
          return sendJson(res, 200, { ok: true, added: added.length, duplicate, total: merged.length });
        }
        if (path === `${BASE}/assets/delete` && method === 'POST') {
          const body = await readBody(req);
          const target = String(body.value ?? '').toLowerCase();
          const kept = store.assets().filter((a) => String(a.value).toLowerCase() !== target);
          store.saveAssets(kept);
          return sendJson(res, 200, { ok: true, total: kept.length, removed: target ? 1 : 0 });
        }
        if (path === `${BASE}/export` && method === 'GET') {
          const format = (new URLSearchParams(url.split('?')[1] || '')).get('format') || 'json';
          const list = store.assets();
          if (format === 'csv') {
            const rows = ['kind,value,addedAt', ...list.map((a) => [a.kind, a.value, a.addedAt].join(','))];
            if (typeof res.setHeader === 'function') res.setHeader('content-type', 'text/csv; charset=utf-8');
            res.statusCode = 200;
            return res.end(rows.join('\n'));
          }
          if (typeof res.setHeader === 'function') res.setHeader('content-type', 'application/json; charset=utf-8');
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true, count: list.length, assets: list }, null, 2));
        }
        if (path === `${BASE}/assets/clear` && method === 'POST') {
          store.saveAssets([]);
          return sendJson(res, 200, { ok: true, total: 0 });
        }
        if (path === `${BASE}/rules` && method === 'GET') {
          const state = store.state();
          return sendJson(res, 200, { ok: true, rules: text(), custom: Boolean(state.rules && state.rules.trim()), model: model() });
        }
        if (path === `${BASE}/rules` && method === 'POST') {
          const body = await readBody(req);
          const rules = String(body.text ?? '');
          store.saveState({ ...store.state(), rules, updatedAt: new Date().toISOString() });
          return sendJson(res, 200, { ok: true, chars: rules.length });
        }
        if (path === `${BASE}/rules/reset` && method === 'POST') {
          store.saveState({ ...store.state(), rules: '', updatedAt: new Date().toISOString() });
          return sendJson(res, 200, { ok: true, chars: text().length, defaultChars: DEFAULT_RULES.length });
        }
        if (path === `${BASE}/models` && method === 'GET') {
          return sendJson(res, 200, { ok: true, model: model(), presets: Object.keys(MODEL_PRESETS), current: text().length });
        }
        if (path === `${BASE}/models` && method === 'POST') {
          const body = await readBody(req);
          const next = String(body.model ?? '');
          store.saveState({ ...store.state(), model: next, updatedAt: new Date().toISOString() });
          return sendJson(res, 200, { ok: true, model: next, chars: text().length });
        }
        if (path === `${BASE}/status` && method === 'GET') {
          return sendJson(res, 200, {
            ok: true,
            version: VERSION,
            promptRegistered: Boolean(sectionDispose) || liveProbe().hasSection,
            promptChars: text().length,
            assets: store.assets().length,
            dataDir: store.dir,
            host: liveProbe().version,
            strategy: liveProbe().strategy,
            warnings: allWarnings(),
          });
        }
        return sendJson(res, 404, { ok: false, error: `unknown route: ${method} ${path}` });
      } catch (error) {
        return sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    })();
  };

  const webDispose = registerWeb(ctx, { path: BASE, handler });
  const webOk = Boolean(webDispose) || liveProbe().hasWebServer;
  flags.web = webOk;

  return () => {
    try { sectionDispose?.(); } catch { /* ignore */ }
    try { webDispose?.(); } catch { /* ignore */ }
  };
}

export default { name, inject, apply };
