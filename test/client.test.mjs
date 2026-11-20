import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'client.js'), 'utf8');

let loadCalls = 0;
let entry = null;

const hooks = [];
let hookIndex = 0;

const React = {
  createElement(type, props, ...children) {
    return { type, props: props || {}, children };
  },
  useState(initial) {
    const index = hookIndex;
    hookIndex += 1;
    if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
    const set = (next) => {
      hooks[index] = typeof next === 'function' ? next(hooks[index]) : next;
    };
    return [hooks[index], set];
  },
  useEffect() {},
  useRef(value) {
    return { current: value };
  },
  useCallback(fn) {
    return fn;
  },
  useMemo(fn) {
    return fn();
  },
};

const fakeWindow = {
  __ModuleLoader__: {
    load(config) {
      loadCalls += 1;
      entry = config;
    },
  },
};

const fakeRequire = (name) => {
  if (name === 'react') return React;
  throw new Error('unexpected require: ' + name);
};

new Function('window', 'require', 'document', 'navigator', source)(
  fakeWindow,
  fakeRequire,
  undefined,
  undefined,
);

function flatten(node, out) {
  const sink = out || [];
  if (node === null || node === undefined || node === false || node === true) return sink;
  if (typeof node === 'string' || typeof node === 'number') {
    sink.push(String(node));
    return sink;
  }
  if (Array.isArray(node)) {
    for (const item of node) flatten(item, sink);
    return sink;
  }
  if (typeof node === 'function') {
    sink.push('<fn ' + (node.name || 'anon') + '>');
    return sink;
  }
  if (typeof node !== 'object') {
    sink.push(String(node));
    return sink;
  }
  sink.push(typeof node.type === 'function' ? '<' + (node.type.name || 'anon') + '>' : String(node.type));
  const props = node.props || {};
  for (const key of Object.keys(props)) {
    if (key === 'children') continue;
    if (typeof props[key] === 'string') sink.push(props[key]);
    if (Array.isArray(props[key])) {
      for (const item of props[key]) {
        if (item && typeof item === 'object') {
          if (typeof item.label === 'string') sink.push(item.label);
          if (typeof item.value === 'string') sink.push(item.value);
        }
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (const item of node.children) flatten(item, sink);
  } else if (node.children !== undefined) {
    flatten(node.children, sink);
  }
  return sink;
}

function walk(node, visit) {
  if (node === null || node === undefined || node === false || node === true) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (typeof node !== 'object') return;
  visit(node);
  if (Array.isArray(node.children)) {
    for (const item of node.children) walk(item, visit);
  } else if (node.children !== undefined) {
    walk(node.children, visit);
  }
}

function expandOnce(node) {
  if (!node || typeof node !== 'object' || typeof node.type !== 'function') return node;
  const savedHooks = hooks.slice();
  const savedIndex = hookIndex;
  hooks.length = 0;
  hookIndex = 0;
  const out = node.type(node.props);
  hooks.length = 0;
  for (const item of savedHooks) hooks.push(item);
  hookIndex = savedIndex;
  return out;
}

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log('PASS ' + name);
  } catch (error) {
    checks.push({ name, ok: false, error });
    console.log('FAIL ' + name + ' :: ' + (error && error.message ? error.message : String(error)));
  }
}

let plugin = null;
const registered = [];
const ctx = {
  slots: {
    inject(name, cb) {
      assert.equal(typeof name, 'string');
      assert.equal(typeof cb, 'function');
      cb();
    },
    register(spec, render) {
      registered.push({ spec, render });
      return () => {};
    },
  },
};

check('load 被调用一次且 id 正确', () => {
  assert.equal(loadCalls, 1);
  assert.equal(entry && entry.id, 'dsh-purge-unsafe');
  assert.equal(typeof entry.factory, 'function');
});

check('factory 返回 inject 与 apply', () => {
  plugin = entry.factory(fakeRequire);
  assert.deepEqual(plugin.inject, ['slots']);
  assert.equal(typeof plugin.apply, 'function');
});

check('apply 注册 sidebar.panellist 与 main', () => {
  plugin.apply(ctx);
  const specs = registered.map((item) => item.spec);
  const names = specs.map((spec) => spec && spec.name);
  assert.ok(names.includes('sidebar.panellist'), '缺少 sidebar.panellist：' + names.join(','));
  assert.ok(names.includes('main'), '缺少 main：' + names.join(','));
  assert.ok(registered.every((item) => typeof item.render === 'function'));
  const sidebarSpec = specs.find((spec) => spec.name === 'sidebar.panellist');
  assert.equal(sidebarSpec.id, 'purge-unsafe');
  assert.equal(sidebarSpec.order, 6);
  assert.equal(typeof sidebarSpec.label, 'function');
  assert.equal(sidebarSpec.label(), 'purge-unsafe');
});

check('sidebar 图标用 props.size 且激活态换色', () => {
  const sidebar = registered.find((item) => item.spec.name === 'sidebar.panellist');
  const idle = sidebar.render({ size: 20, active: false });
  const active = sidebar.render({ size: 20, active: true });
  const idleNode = idle.type(idle.props);
  const activeNode = active.type(active.props);
  assert.equal(idleNode.props.style.width, 20);
  assert.equal(idleNode.props.style.height, 20);
  assert.notEqual(activeNode.props.style.background, idleNode.props.style.background);
  const noSize = sidebar.render({});
  const fallback = noSize.type(noSize.props);
  assert.equal(fallback.props.style.width, 28);
  assert.equal(fallback.props.style.height, 28);
});

const mainReg = registered.find((item) => item.spec.name === 'main');

function renderPanel(tab) {
  const mainElement = mainReg.render({});
  hookIndex = 0;
  if (tab !== undefined) hooks[0] = tab;
  const tree = mainElement.type(mainElement.props);
  return tree;
}

check('main 组件可渲染', () => {
  const tree = renderPanel('overview');
  assert.ok(tree && typeof tree === 'object');
  assert.equal(tree.type, 'div');
});

check('五个页签文案齐全', () => {
  const text = flatten(renderPanel('overview')).join(' ');
  for (const label of ['概览', '资产', '规则', '模型', '诊断']) {
    assert.ok(text.includes(label), '缺少页签：' + label);
  }
});

check('所有页签合计不含 你好 与 激活，注入 只出现一次', () => {
  const tabs = ['overview', 'assets', 'rules', 'models', 'diagnostics'];
  let hits = 0;
  const labels = [];
  for (const tab of tabs) {
    const tree = renderPanel(tab);
    const joined = flatten(tree).join('\n');
    assert.ok(!joined.includes('你好'), tab + ' 页出现 你好');
    assert.ok(!joined.includes('激活'), tab + ' 页出现 激活');
    hits += joined.split('注入').length - 1;
    walk(tree, (node) => {
      const name = typeof node.type === 'function' ? node.type.name : node.type;
      if (name !== 'Button' && name !== 'Tab' && name !== 'Chip' && name !== 'Link') return;
      const children = Array.isArray(node.children) ? node.children : [node.children];
      const label = children.filter((item) => typeof item === 'string').join('');
      if (label) labels.push(label);
    });
  }
  assert.equal(hits, 1, '注入 出现 ' + hits + ' 次');
  assert.ok(labels.includes('预览注入文本'), '缺少预览按钮文案');
  for (const banned of ['注入', '激活', '你好']) {
    assert.ok(!labels.includes(banned), '存在独立按钮文案 ' + banned);
  }
});

check('概览页：标识区、四张指标卡、两个快捷按钮、状态行', () => {
  const tree = renderPanel('overview');
  const text = flatten(tree).join(' ');
  assert.ok(text.includes('dsh-purge-unsafe'), '缺少名称');
  assert.ok(text.includes('v0.1.0'), '缺少版本徽标');
  assert.ok(text.includes('HuaLuonb/dsh-purge-unsafe'), '缺少仓库地址');
  assert.ok(text.includes('https://github.com/HuaLuonb/dsh-purge-unsafe'), '缺少仓库链接');
  assert.ok(text.includes('提示词常驻 · 资产批量 · rc1–rc5'), '缺少副标题');
  for (const label of ['提示词字数', '资产数', '宿主版本', '注册策略']) {
    assert.ok(text.includes(label), '缺少指标标签：' + label);
  }
  for (const label of ['去导资产', '复制当前规则', 'GitHub']) {
    assert.ok(text.includes(label), '缺少按钮文案：' + label);
  }
  assert.ok(text.includes('注册：'), '缺少注册状态');
  assert.ok(text.includes('告警：'), '缺少告警数');
  assert.ok(text.includes('数据目录：'), '缺少数据目录行');
});

check('资产页：导入、清空、筛选、类型下拉、导出、表格列、空状态', () => {
  const text = flatten(renderPanel('assets')).join(' ');
  for (const label of ['批量导入', '从文件导入', '清空', '复制全部', '导出 JSON', '导出 CSV']) {
    assert.ok(text.includes(label), '缺少按钮：' + label);
  }
  for (const label of ['筛选：类型或值', '全部类型', '类型', '值', '加入时间', '操作']) {
    assert.ok(text.includes(label), '缺少元素：' + label);
  }
  assert.ok(text.includes('还没有资产，粘贴一行一个的域名或 IP 即可'), '空状态文案不对');
  assert.ok(text.includes('一行一个：域名 / IP / CIDR / host:port'), '缺少多行框占位提示');
});

check('规则页：保存、恢复默认、预览、字数与自定义状态', () => {
  const text = flatten(renderPanel('rules')).join(' ');
  for (const label of ['保存', '恢复默认', '预览注入文本']) {
    assert.ok(text.includes(label), '缺少按钮：' + label);
  }
  assert.ok(text.includes('字数 '), '缺少字数显示');
  assert.ok(text.includes('默认') || text.includes('已自定义'), '缺少自定义状态');
});

check('模型页：预设下拉、应用按钮、当前模型与规则字数', () => {
  const text = flatten(renderPanel('models')).join(' ');
  for (const label of ['generic', 'qwen', 'glm', 'deepseek', '应用']) {
    assert.ok(text.includes(label), '缺少模型元素：' + label);
  }
  assert.ok(text.includes('当前模型：'), '缺少当前模型行');
  assert.ok(text.includes('规则字数'), '缺少规则字数');
});

check('诊断页：键值表、告警、重新探测、挂载点说明', () => {
  const tree = renderPanel('diagnostics');
  const text = flatten(tree).join(' ');
  for (const label of ['版本', '宿主', '注册策略', '提示词注册', '提示词字数', '资产数量', '数据目录']) {
    assert.ok(text.includes(label), '缺少键值行：' + label);
  }
  assert.ok(text.includes('重新探测'), '缺少重新探测按钮');
  assert.ok(text.includes('告警 0 条') || text.includes('告警 '), '缺少告警区');
  assert.ok(text.includes('挂载点：sidebar.panellist + main'), '缺少挂载点说明');
});

check('每个交互按钮都带 disabled 与 hover/focus 处理', () => {
  const tree = renderPanel('assets');
  let count = 0;
  walk(tree, (node) => {
    const name = typeof node.type === 'function' ? node.type.name : node.type;
    if (name !== 'Button' && name !== 'Tab' && name !== 'Chip') return;
    const out = expandOnce(node);
    count += 1;
    assert.equal(out.type, 'button');
    assert.equal(typeof out.props.onMouseEnter, 'function', '缺少 hover 处理');
    assert.equal(typeof out.props.onMouseLeave, 'function', '缺少 hover 复位');
    assert.equal(typeof out.props.onFocus, 'function', '缺少 focus 处理');
    assert.equal(typeof out.props.onBlur, 'function', '缺少 blur 复位');
    assert.ok('disabled' in out.props, '缺少 disabled 属性');
    assert.equal(out.props.style.height, 28, '按钮高度不是 28px');
    assert.equal(out.props.style.borderRadius, 6, '按钮圆角不是 6px');
  });
  assert.ok(count > 0, '没有找到交互按钮');
});

check('样式只用宿主变量与指定字号', () => {
  const serialized = JSON.stringify(renderPanel('overview'));
  assert.ok(serialized.includes('--dsw-alias-bg-layer-1'), '缺少背景变量');
  assert.ok(serialized.includes('--dsw-alias-label-primary'), '缺少文字变量');
  assert.ok(serialized.includes('--dsw-alias-border-1'), '缺少边框变量');
  assert.ok(serialized.includes('--dsw-alias-brand'), '缺少品牌色变量');
  assert.ok(serialized.includes('520'), '缺少 520 最小高度');
  assert.ok(serialized.includes('ui-monospace, SFMono-Regular, Consolas, monospace'), '缺少等宽字体');
  for (const token of ['F11 = 11', 'F13 = 13', 'F15 = 15', 'F22 = 22', 'BTN_HEIGHT = 28', 'BTN_RADIUS = 6']) {
    assert.ok(source.includes(token), '缺少尺寸常量 ' + token);
  }
  assert.ok(!/font-size:\s*1[0-9]px/.test(serialized), '出现硬编码字号');
  const fontSizes = new Set();
  walk(renderPanel('rules'), (node) => {
    const size = node.props && node.props.style && node.props.style.fontSize;
    if (typeof size === 'number') fontSizes.add(size);
  });
  for (const size of fontSizes) {
    assert.ok([11, 13, 15, 22].includes(size), '出现非规范字号 ' + size);
  }
  assert.ok(serialized.includes('"lineHeight":1.5'), '缺少 1.5 行高');
});

const failed = checks.filter((item) => !item.ok).length;
console.log('');
console.log('总计 ' + checks.length + ' 项，失败 ' + failed + ' 项');
process.exitCode = failed === 0 ? 0 : 1;
