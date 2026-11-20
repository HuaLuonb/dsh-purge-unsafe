window.__ModuleLoader__.load({
  id: 'dsh-purge-unsafe',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const useState = typeof React.useState === 'function' ? React.useState : function (value) { return [value, function () {}]; };
    const useEffect = typeof React.useEffect === 'function' ? React.useEffect : function () {};
    const useRef = typeof React.useRef === 'function' ? React.useRef : function (value) { return { current: value }; };
    const useCallback = typeof React.useCallback === 'function' ? React.useCallback : function (fn) { return fn; };

    const BASE = '/dsh-purge-unsafe';
    const VERSION = '0.1.0';
    const REPO = 'https://github.com/HuaLuonb/dsh-purge-unsafe';
    const SANS = 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif';
    const MONO = 'ui-monospace, SFMono-Regular, Consolas, monospace';
    const F11 = 11;
    const F13 = 13;
    const F15 = 15;
    const F22 = 22;
    const LINE_HEIGHT = 1.5;
    const BTN_HEIGHT = 28;
    const BTN_RADIUS = 6;

    const C = {
      bg1: 'var(--dsw-alias-bg-layer-1, #15181e)',
      bg2: 'var(--dsw-alias-bg-layer-2, #1c2029)',
      fg1: 'var(--dsw-alias-label-primary, #e6eaf2)',
      fg2: 'var(--dsw-alias-label-secondary, #98a2b3)',
      line: 'var(--dsw-alias-border-1, #2a2f3a)',
      brand: 'var(--dsw-alias-brand, #2563eb)',
      brandSoft: 'var(--dsw-alias-brand-soft, rgba(37, 99, 235, 0.28))',
      onBrand: 'var(--dsw-alias-brand-foreground, #ffffff)',
      danger: 'var(--dsw-alias-danger, #e5484d)',
      ok: 'var(--dsw-alias-success, #2fbf71)',
    };

    const TABS = [
      { id: 'overview', label: '概览' },
      { id: 'assets', label: '资产' },
      { id: 'rules', label: '规则' },
      { id: 'models', label: '模型' },
      { id: 'diagnostics', label: '诊断' },
    ];

    const rootStyle = {
      width: '100%',
      minHeight: 520,
      boxSizing: 'border-box',
      padding: '16px 18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: C.bg1,
      color: C.fg1,
      fontFamily: SANS,
      fontSize: F13,
      lineHeight: LINE_HEIGHT,
    };

    const headerRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 40,
    };

    const markStyle = {
      width: 36,
      height: 36,
      flex: '0 0 auto',
      display: 'grid',
      placeItems: 'center',
      borderRadius: 10,
      background: C.brand,
      color: C.onBrand,
      fontSize: F13,
      fontWeight: 700,
      letterSpacing: '-0.5px',
      lineHeight: LINE_HEIGHT,
    };

    const titleStyle = {
      fontSize: F15,
      fontWeight: 600,
      lineHeight: LINE_HEIGHT,
      color: C.fg1,
      whiteSpace: 'nowrap',
    };

    const badgeStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      height: 18,
      padding: '0 6px',
      borderRadius: BTN_RADIUS,
      border: '1px solid ' + C.line,
      background: C.bg2,
      color: C.fg2,
      fontFamily: MONO,
      fontSize: F11,
      lineHeight: LINE_HEIGHT,
    };

    const subStyle = {
      fontSize: F11,
      lineHeight: LINE_HEIGHT,
      color: C.fg2,
    };

    const tabBarStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      paddingBottom: 8,
      borderBottom: '1px solid ' + C.line,
      flexWrap: 'wrap',
    };

    const paneStyle = {
      minHeight: 520,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxSizing: 'border-box',
    };

    const rowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    };

    const cardStyle = {
      minWidth: 0,
      padding: '12px 14px',
      borderRadius: 8,
      border: '1px solid ' + C.line,
      background: C.bg2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    };

    const cardValueStyle = {
      fontSize: F22,
      fontWeight: 700,
      lineHeight: LINE_HEIGHT,
      color: C.fg1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };

    const cardLabelStyle = {
      fontSize: F11,
      lineHeight: LINE_HEIGHT,
      color: C.fg2,
    };

    const tableWrapStyle = {
      maxHeight: 320,
      overflow: 'auto',
      border: '1px solid ' + C.line,
      borderRadius: 8,
      background: C.bg2,
    };

    const thStyle = {
      position: 'sticky',
      top: 0,
      zIndex: 1,
      textAlign: 'left',
      fontWeight: 600,
      fontSize: F11,
      lineHeight: LINE_HEIGHT,
      color: C.fg2,
      background: C.bg1,
      padding: '6px 10px',
      borderBottom: '1px solid ' + C.line,
      whiteSpace: 'nowrap',
    };

    const tdStyle = {
      padding: '5px 10px',
      borderBottom: '1px solid ' + C.line,
      fontSize: F13,
      lineHeight: LINE_HEIGHT,
      color: C.fg1,
      verticalAlign: 'top',
      wordBreak: 'break-all',
    };

    const monoCellStyle = Object.assign({}, tdStyle, { fontFamily: MONO, fontSize: F11 });

    const emptyCellStyle = Object.assign({}, tdStyle, {
      textAlign: 'center',
      color: C.fg2,
      padding: '20px 10px',
    });

    const preStyle = {
      margin: 0,
      padding: '10px 12px',
      maxHeight: 240,
      overflow: 'auto',
      fontFamily: MONO,
      fontSize: F11,
      lineHeight: LINE_HEIGHT,
      color: C.fg1,
      background: C.bg2,
      border: '1px solid ' + C.line,
      borderRadius: 8,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    };

    const hintStyle = {
      fontSize: F11,
      lineHeight: LINE_HEIGHT,
      color: C.fg2,
    };

    function num(value) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function msg(error) {
      if (error === null || error === undefined) return '未知错误';
      return error && error.message ? String(error.message) : String(error);
    }

    function toneColor(tone) {
      if (tone === 'bad') return C.danger;
      if (tone === 'good') return C.ok;
      return C.fg2;
    }

    function request(path, options) {
      const init = Object.assign({ headers: { Accept: 'application/json' } }, options || {});
      if (init.body !== undefined && typeof init.body !== 'string') {
        init.headers = Object.assign({ 'Content-Type': 'application/json' }, init.headers);
        init.body = JSON.stringify(init.body);
      }
      return fetch(BASE + path, init).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
    }

    function downloadFile(name, text, type) {
      if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return;
      if (typeof URL.createObjectURL !== 'function') return;
      const url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (error) { }
      }, 2000);
    }

    function useHoverState() {
      const hover = useState(false);
      const focus = useState(false);
      return {
        hover: hover[0],
        focus: focus[0],
        handlers: {
          onMouseEnter: function () { hover[1](true); },
          onMouseLeave: function () { hover[1](false); },
          onFocus: function () { focus[1](true); },
          onBlur: function () { focus[1](false); },
        },
      };
    }

    function Link(props) {
      const state = useHoverState();
      const active = state.hover || state.focus;
      const style = {
        display: 'inline-flex',
        alignItems: 'center',
        height: BTN_HEIGHT,
        padding: '0 10px',
        borderRadius: BTN_RADIUS,
        border: '1px solid ' + (active ? C.brand : C.line),
        background: active ? C.bg2 : 'transparent',
        color: active ? C.brand : C.fg2,
        fontFamily: SANS,
        fontSize: F11,
        lineHeight: LINE_HEIGHT,
        textDecoration: 'none',
        outline: 'none',
        cursor: 'pointer',
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'background .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease',
      };
      return h('a', Object.assign({
        href: props.href,
        target: '_blank',
        rel: 'noreferrer noopener',
        title: props.title,
        style: style,
      }, state.handlers), props.children);
    }

    function Chip(props) {
      const state = useHoverState();
      const disabled = Boolean(props.disabled);
      const style = {
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        height: 22,
        padding: '0 8px',
        borderRadius: BTN_RADIUS,
        border: '1px solid ' + (state.focus ? C.brand : state.hover && !disabled ? C.brand : C.line),
        background: state.hover && !disabled ? C.bg2 : 'transparent',
        color: disabled ? C.fg2 : state.hover ? C.fg1 : C.fg2,
        fontFamily: MONO,
        fontSize: F11,
        lineHeight: LINE_HEIGHT,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'background .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease',
      };
      return h('button', Object.assign({
        type: 'button',
        title: props.title,
        disabled: disabled,
        style: style,
        onClick: props.onClick,
      }, state.handlers), props.children);
    }

    function Button(props) {
      const state = useHoverState();
      const variant = props.variant || 'default';
      const disabled = Boolean(props.disabled);
      const primary = variant === 'primary';
      const danger = variant === 'danger';
      const hot = (state.hover || state.focus) && !disabled;
      let background = primary ? C.brand : C.bg2;
      if (!disabled && state.hover) background = primary ? C.brand : danger ? C.bg1 : C.bg1;
      const style = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: BTN_HEIGHT,
        padding: '0 12px',
        gap: 6,
        borderRadius: BTN_RADIUS,
        border: '1px solid ' + (hot ? (danger ? C.danger : primary ? C.brand : C.brand) : C.line),
        background: background,
        color: disabled ? C.fg2 : primary ? C.onBrand : danger && hot ? C.danger : C.fg1,
        fontFamily: SANS,
        fontSize: F13,
        lineHeight: LINE_HEIGHT,
        fontWeight: primary ? 600 : 400,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'background .12s ease, border-color .12s ease, color .12s ease, opacity .12s ease, box-shadow .12s ease',
      };
      return h('button', Object.assign({
        type: 'button',
        title: props.title,
        disabled: disabled,
        style: style,
        onClick: props.onClick,
      }, state.handlers), props.children);
    }

    function Tab(props) {
      const state = useHoverState();
      const on = Boolean(props.active);
      const hot = state.hover && !on;
      const style = {
        display: 'inline-flex',
        alignItems: 'center',
        height: BTN_HEIGHT,
        padding: '0 12px',
        borderRadius: BTN_RADIUS,
        borderTop: '1px solid ' + (on ? C.line : 'transparent'),
        borderLeft: '1px solid ' + (on ? C.line : 'transparent'),
        borderRight: '1px solid ' + (on ? C.line : 'transparent'),
        borderBottom: '2px solid ' + (on ? C.brand : hot ? C.line : 'transparent'),
        background: on ? C.bg2 : hot ? C.bg2 : 'transparent',
        color: on ? C.fg1 : hot ? C.fg1 : C.fg2,
        fontFamily: SANS,
        fontSize: F13,
        fontWeight: on ? 600 : 400,
        lineHeight: LINE_HEIGHT,
        outline: 'none',
        cursor: 'pointer',
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'background .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease',
      };
      return h('button', Object.assign({
        type: 'button',
        role: 'tab',
        'aria-selected': on,
        disabled: Boolean(props.disabled),
        style: style,
        onClick: props.onClick,
      }, state.handlers), props.children);
    }

    function TextInput(props) {
      const state = useHoverState();
      const style = {
        height: BTN_HEIGHT,
        width: props.width === undefined ? 240 : props.width,
        boxSizing: 'border-box',
        padding: '0 10px',
        borderRadius: BTN_RADIUS,
        border: '1px solid ' + (state.focus ? C.brand : state.hover ? C.brand : C.line),
        background: C.bg2,
        color: C.fg1,
        fontFamily: MONO,
        fontSize: F11,
        lineHeight: LINE_HEIGHT,
        outline: 'none',
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? 'not-allowed' : 'text',
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'border-color .12s ease, box-shadow .12s ease',
      };
      return h('input', Object.assign({
        type: 'text',
        value: props.value === undefined ? '' : props.value,
        placeholder: props.placeholder,
        disabled: Boolean(props.disabled),
        spellCheck: false,
        style: style,
        onChange: function (event) {
          if (typeof props.onChange === 'function') props.onChange(event && event.target ? String(event.target.value) : '');
        },
      }, state.handlers));
    }

    function TextArea(props) {
      const state = useHoverState();
      const style = {
        width: '100%',
        minHeight: props.minHeight === undefined ? 140 : props.minHeight,
        boxSizing: 'border-box',
        padding: '8px 11px',
        resize: 'vertical',
        borderRadius: 8,
        border: '1px solid ' + (state.focus ? C.brand : state.hover ? C.brand : C.line),
        background: C.bg2,
        color: C.fg1,
        fontFamily: MONO,
        fontSize: F13,
        lineHeight: LINE_HEIGHT,
        outline: 'none',
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? 'not-allowed' : 'text',
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'border-color .12s ease, box-shadow .12s ease',
      };
      return h('textarea', Object.assign({
        value: props.value === undefined ? '' : props.value,
        placeholder: props.placeholder,
        disabled: Boolean(props.disabled),
        spellCheck: false,
        style: style,
        onChange: function (event) {
          if (typeof props.onChange === 'function') props.onChange(event && event.target ? String(event.target.value) : '');
        },
      }, state.handlers));
    }

    function Select(props) {
      const state = useHoverState();
      const style = {
        height: BTN_HEIGHT,
        width: props.width === undefined ? 200 : props.width,
        boxSizing: 'border-box',
        padding: '0 8px',
        borderRadius: BTN_RADIUS,
        border: '1px solid ' + (state.focus ? C.brand : state.hover ? C.brand : C.line),
        background: C.bg2,
        color: C.fg1,
        fontFamily: SANS,
        fontSize: F13,
        lineHeight: LINE_HEIGHT,
        outline: 'none',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        boxShadow: state.focus ? '0 0 0 2px ' + C.brandSoft : 'none',
        transition: 'border-color .12s ease, box-shadow .12s ease',
      };
      const options = Array.isArray(props.options) ? props.options : [];
      return h('select', Object.assign({
        value: props.value === undefined ? '' : props.value,
        disabled: Boolean(props.disabled),
        style: style,
        onChange: function (event) {
          if (typeof props.onChange === 'function') props.onChange(event && event.target ? String(event.target.value) : '');
        },
      }, state.handlers), options.map(function (item) {
        return h('option', { key: 'opt-' + String(item.value), value: item.value }, item.label);
      }));
    }

    function strategyText(status) {
      if (!status || !status.strategy) return '未取到';
      const s = status.strategy;
      return 'section=' + String(s.sectionApi || 'none') +
        ' · context=' + String(s.contextApi || 'none') +
        ' · web=' + String(s.webServerApi || 'none');
    }

    function Panel() {
      const [tab, setTab] = useState('overview');
      const [busy, setBusy] = useState('');
      const [status, setStatus] = useState(null);
      const [statusError, setStatusError] = useState('');
      const [overviewNote, setOverviewNote] = useState({ text: '', tone: '' });
      const [assets, setAssets] = useState([]);
      const [assetText, setAssetText] = useState('');
      const [assetNote, setAssetNote] = useState({ text: '', tone: '' });
      const [filter, setFilter] = useState('');
      const [kind, setKind] = useState('');
      const [rules, setRules] = useState('');
      const [ruleChars, setRuleChars] = useState(0);
      const [rulesCustom, setRulesCustom] = useState(false);
      const [rulesModel, setRulesModel] = useState('');
      const [rulesNote, setRulesNote] = useState({ text: '', tone: '' });
      const [preview, setPreview] = useState('');
      const [models, setModels] = useState({ model: '', presets: [], current: 0 });
      const [pick, setPick] = useState('');
      const [modelsNote, setModelsNote] = useState({ text: '', tone: '' });
      const fileRef = useRef(null);

      const loadStatus = useCallback(function () {
        return request('/status')
          .then(function (data) {
            setStatus(data || null);
            setStatusError('');
          })
          .catch(function (error) {
            setStatusError(msg(error));
          });
      }, []);

      const loadAssets = useCallback(function () {
        return request('/assets')
          .then(function (data) {
            setAssets(data && Array.isArray(data.assets) ? data.assets : []);
          })
          .catch(function (error) {
            setAssetNote({ text: '读取资产失败：' + msg(error), tone: 'bad' });
          });
      }, []);

      const loadRules = useCallback(function () {
        return request('/rules')
          .then(function (data) {
            const text = String(data && data.rules ? data.rules : '');
            setRules(text);
            setRuleChars(text.length);
            setRulesCustom(Boolean(data && data.custom));
            setRulesModel(String(data && data.model ? data.model : ''));
          })
          .catch(function (error) {
            setRulesNote({ text: '读取规则失败：' + msg(error), tone: 'bad' });
          });
      }, []);

      const loadModels = useCallback(function () {
        return request('/models')
          .then(function (data) {
            const presets = data && Array.isArray(data.presets) ? data.presets : [];
            setModels({
              model: String(data && data.model ? data.model : ''),
              presets: presets,
              current: num(data && data.current),
            });
            setPick(String(data && data.model ? data.model : presets.length ? presets[0] : 'generic'));
          })
          .catch(function (error) {
            setModelsNote({ text: '读取模型失败：' + msg(error), tone: 'bad' });
          });
      }, []);

      useEffect(function () {
        loadStatus();
        loadAssets();
        loadRules();
        loadModels();
      }, []);

      const copyText = function (text, done) {
        const value = text === null || text === undefined ? '' : String(text);
        if (!value) {
          if (typeof done === 'function') done('没有可复制的内容', 'bad');
          return;
        }
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(value).then(function () {
              if (typeof done === 'function') done('已复制 ' + value.length + ' 字', 'good');
            }, function () {
              if (typeof done === 'function') done('复制失败：浏览器拒绝写入剪贴板', 'bad');
            });
            return;
          }
        } catch (error) {
        }
        if (typeof done === 'function') done('当前环境没有剪贴板接口', 'bad');
      };

      const importAssets = function (text) {
        const value = String(text === null || text === undefined ? '' : text).trim();
        if (!value) {
          setAssetNote({ text: '文本框是空的，先粘贴几行域名或 IP', tone: 'bad' });
          return;
        }
        setBusy('import');
        setAssetNote({ text: '导入中…', tone: '' });
        request('/assets', { method: 'POST', body: { text: value } })
          .then(function (data) {
            setAssetNote({
              text: '新增 ' + num(data && data.added) + ' / 重复 ' + num(data && data.duplicate) + ' / 共 ' + num(data && data.total),
              tone: 'good',
            });
            setAssetText('');
            return loadAssets();
          })
          .catch(function (error) {
            setAssetNote({ text: '导入失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const clearAssets = function () {
        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm('清空全部资产？')) return;
        setBusy('clear');
        request('/assets/clear', { method: 'POST', body: {} })
          .then(function () {
            setAssets([]);
            setAssetNote({ text: '已清空', tone: 'good' });
            return loadStatus();
          })
          .catch(function (error) {
            setAssetNote({ text: '清空失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const deleteAsset = function (value) {
        setBusy('delete');
        request('/assets/delete', { method: 'POST', body: { value: value } })
          .then(function (data) {
            setAssetNote({ text: '已删除 ' + String(value) + '，剩余 ' + num(data && data.total), tone: 'good' });
            return loadAssets();
          })
          .catch(function (error) {
            setAssetNote({ text: '删除失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const onPickFile = function (event) {
        const input = event && event.target ? event.target : null;
        const picked = input && input.files && input.files[0] ? input.files[0] : null;
        if (!picked) return;
        const reader = new FileReader();
        reader.onload = function () {
          const text = String(reader.result || '');
          setAssetText(text);
          importAssets(text);
        };
        reader.onerror = function () {
          setAssetNote({ text: '读文件失败', tone: 'bad' });
        };
        reader.readAsText(picked);
        if (input) input.value = '';
      };

      const exportAssets = function (format) {
        setBusy('export');
        fetch(BASE + '/export?format=' + format + '&t=' + Date.now(), { headers: { Accept: '*/*' }, cache: 'no-store' })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
          })
          .then(function (text) {
            downloadFile('dsh-purge-unsafe-assets.' + format, text, format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8');
            setAssetNote({ text: '已导出 ' + format.toUpperCase() + '，' + text.length + ' 字节', tone: 'good' });
          })
          .catch(function (error) {
            setAssetNote({ text: '导出失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const saveRules = function () {
        const text = String(rules);
        setBusy('rules');
        setRulesNote({ text: '保存中…', tone: '' });
        request('/rules', { method: 'POST', body: { text: text } })
          .then(function (data) {
            const chars = data && typeof data.chars === 'number' ? data.chars : text.length;
            setRuleChars(chars);
            setRulesCustom(text.trim().length > 0);
            setStatus(function (prev) {
              if (!prev) return prev;
              return Object.assign({}, prev, { promptChars: chars });
            });
            setRulesNote({ text: '已保存，共 ' + chars + ' 字', tone: 'good' });
          })
          .catch(function (error) {
            setRulesNote({ text: '保存失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const resetRules = function () {
        setBusy('reset');
        request('/rules/reset', { method: 'POST', body: {} })
          .then(function () {
            return loadRules();
          })
          .then(function () {
            setPreview('');
            setRulesNote({ text: '已恢复默认规则', tone: 'good' });
            return loadStatus();
          })
          .catch(function (error) {
            setRulesNote({ text: '恢复失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const previewRules = function () {
        setBusy('preview');
        request('/rules')
          .then(function (data) {
            const text = String(data && data.rules ? data.rules : '');
            setPreview(text);
            setRuleChars(text.length);
            setRulesCustom(Boolean(data && data.custom));
            setRulesNote({ text: '已取到当前生效的 ' + text.length + ' 字', tone: 'good' });
          })
          .catch(function (error) {
            setRulesNote({ text: '预览失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const applyModel = function () {
        if (!pick) return;
        setBusy('model');
        setModelsNote({ text: '应用中…', tone: '' });
        request('/models', { method: 'POST', body: { model: pick } })
          .then(function (data) {
            const applied = String(data && data.model ? data.model : pick);
            const chars = num(data && data.chars);
            setModels({ model: applied, presets: models.presets, current: chars });
            setModelsNote({ text: '已应用 ' + applied + '，规则 ' + chars + ' 字', tone: 'good' });
            return loadRules();
          })
          .then(function () {
            return loadStatus();
          })
          .catch(function (error) {
            setModelsNote({ text: '应用失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const copyRules = function () {
        if (rules) {
          copyText(rules, function (text, tone) { setOverviewNote({ text: text, tone: tone }); });
          return;
        }
        setBusy('rules');
        request('/rules')
          .then(function (data) {
            const text = String(data && data.rules ? data.rules : '');
            setRules(text);
            setRuleChars(text.length);
            setRulesCustom(Boolean(data && data.custom));
            setRulesModel(String(data && data.model ? data.model : ''));
            copyText(text, function (note, tone) { setOverviewNote({ text: note, tone: tone }); });
          })
          .catch(function (error) {
            setOverviewNote({ text: '读取规则失败：' + msg(error), tone: 'bad' });
          })
          .then(function () {
            setBusy('');
          });
      };

      const copyAllAssets = function () {
        const text = assets.map(function (item) { return String(item && item.value ? item.value : ''); }).filter(Boolean).join('\n');
        copyText(text, function (note, tone) { setAssetNote({ text: note, tone: tone }); });
      };

      const copyDataDir = function () {
        const dir = status && status.dataDir ? String(status.dataDir) : '';
        copyText(dir, function (note, tone) { setOverviewNote({ text: note, tone: tone }); });
      };

      const refreshStatus = function () {
        setBusy('status');
        request('/status')
          .then(function (data) {
            setStatus(data || null);
            setStatusError('');
            return loadAssets();
          })
          .then(function () {
            setOverviewNote({ text: '已重新探测宿主', tone: 'good' });
          })
          .catch(function (error) {
            setStatusError(msg(error));
          })
          .then(function () {
            setBusy('');
          });
      };

      const locked = busy !== '';
      const warnings = status && Array.isArray(status.warnings) ? status.warnings : [];
      const registered = Boolean(status && status.promptRegistered);
      const promptChars = status && status.promptChars !== undefined ? num(status.promptChars) : ruleChars;
      const hostVersion = status && status.host ? String(status.host) : '未取到';
      const dataDir = status && status.dataDir ? String(status.dataDir) : '';
      const strategies = strategyText(status);

      const kinds = [];
      for (let i = 0; i < assets.length; i += 1) {
        const itemKind = String(assets[i] && assets[i].kind ? assets[i].kind : 'other');
        if (kinds.indexOf(itemKind) < 0) kinds.push(itemKind);
      }
      const kindOptions = [{ value: '', label: '全部类型' }].concat(kinds.map(function (item) {
        return { value: item, label: item };
      }));
      const needle = filter.trim().toLowerCase();
      const shownAssets = assets.filter(function (item) {
        const itemKind = String(item && item.kind ? item.kind : '');
        const itemValue = String(item && item.value ? item.value : '');
        if (kind && itemKind !== kind) return false;
        if (!needle) return true;
        return itemKind.toLowerCase().indexOf(needle) >= 0 || itemValue.toLowerCase().indexOf(needle) >= 0;
      });

      const noteStyle = function (tone) {
        return { fontSize: F11, lineHeight: LINE_HEIGHT, color: toneColor(tone) };
      };

      const metric = function (key, label, value) {
        return h('div', { key: key, style: cardStyle }, [
          h('div', { key: 'v', style: cardValueStyle }, String(value)),
          h('div', { key: 'l', style: cardLabelStyle }, label),
        ]);
      };

      const headerBlock = h('div', { key: 'header', style: headerRowStyle }, [
        h('div', { key: 'mark', style: markStyle }, 'PU'),
        h('div', { key: 'meta', style: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } }, [
          h('div', { key: 'name-row', style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }, [
            h('span', { key: 'name', style: titleStyle }, 'dsh-purge-unsafe'),
            h('span', { key: 'ver', style: badgeStyle }, 'v' + VERSION),
          ]),
          h('span', { key: 'sub', style: subStyle }, '提示词常驻 · 资产批量 · rc1–rc5'),
        ]),
        h('div', { key: 'repo', style: { marginLeft: 'auto' } },
          h(Link, { href: REPO, title: REPO }, 'GitHub')),
      ]);

      const tabBarBlock = h('div', { key: 'tabs', style: tabBarStyle, role: 'tablist' },
        TABS.map(function (item) {
          return h(Tab, {
            key: 'tab-' + item.id,
            active: tab === item.id,
            onClick: function () { setTab(item.id); },
          }, item.label);
        }));

      const overviewStatusRow = h('div', {
        key: 'ov-status',
        style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: F11, lineHeight: LINE_HEIGHT, color: C.fg2 },
      }, [
        h('span', { key: 'reg' }, '注册：' + (registered ? '已注册' : '未注册')),
        h('span', { key: 'warn' }, '告警：' + warnings.length + ' 条'),
        h('span', { key: 'dir-label' }, '数据目录：'),
        h(Chip, { key: 'dir', onClick: copyDataDir, title: '点击复制数据目录' }, dataDir || '（未取到）'),
        overviewNote.text ? h('span', { key: 'note', style: noteStyle(overviewNote.tone) }, overviewNote.text) : null,
        statusError ? h('span', { key: 'err', style: noteStyle('bad') }, '状态读取失败：' + statusError) : null,
      ]);

      const overviewPane = h('div', { key: 'pane-overview', style: paneStyle }, [
        h('div', {
          key: 'metrics',
          style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 },
        }, [
          metric('m1', '提示词字数', promptChars),
          metric('m2', '资产数', assets.length),
          metric('m3', '宿主版本', hostVersion),
          metric('m4', '注册策略', registered ? '已注册' : '未注册'),
        ]),
        h('div', { key: 'actions', style: rowStyle }, [
          h(Button, { key: 'go', variant: 'primary', onClick: function () { setTab('assets'); } }, '去导资产'),
          h(Button, { key: 'copy', onClick: copyRules, disabled: locked || !rules }, '复制当前规则'),
        ]),
        overviewStatusRow,
      ]);

      const assetRows = shownAssets.length
        ? shownAssets.map(function (item, index) {
          const value = String(item && item.value ? item.value : '');
          return h('tr', { key: 'row-' + index + '-' + value }, [
            h('td', { key: 'k', style: tdStyle }, String(item && item.kind ? item.kind : 'other')),
            h('td', { key: 'v', style: monoCellStyle }, value),
            h('td', { key: 't', style: monoCellStyle }, String(item && item.addedAt ? item.addedAt : '—')),
            h('td', { key: 'a', style: { padding: '5px 10px', borderBottom: '1px solid ' + C.line } },
              h(Button, { variant: 'danger', onClick: function () { deleteAsset(value); }, disabled: locked }, '删除')),
          ]);
        })
        : h('tr', { key: 'empty' },
          h('td', {
            colSpan: 4,
            style: emptyCellStyle,
          }, assets.length ? '当前筛选条件下没有匹配的资产，换个关键字或类型再试' : '还没有资产，粘贴一行一个的域名或 IP 即可'));

      const assetsPane = h('div', { key: 'pane-assets', style: paneStyle }, [
        h(TextArea, {
          key: 'asset-text',
          value: assetText,
          minHeight: 120,
          placeholder: '一行一个：域名 / IP / CIDR / host:port；逗号或空格分隔同样支持，# 开头是注释',
          onChange: setAssetText,
        }),
        h('div', { key: 'asset-actions', style: rowStyle }, [
          h(Button, { key: 'import', variant: 'primary', onClick: function () { importAssets(assetText); }, disabled: locked }, '批量导入'),
          h(Button, {
            key: 'file',
            onClick: function () {
              if (fileRef.current && typeof fileRef.current.click === 'function') fileRef.current.click();
            },
            disabled: locked,
          }, '从文件导入'),
          h(Button, { key: 'clear', variant: 'danger', onClick: clearAssets, disabled: locked || !assets.length }, '清空'),
          h('input', {
            key: 'file-input',
            ref: fileRef,
            type: 'file',
            accept: '.txt,.csv,.list,.lst,text/plain',
            style: { display: 'none' },
            onChange: onPickFile,
          }),
          h('span', { key: 'asset-note', style: noteStyle(assetNote.tone) }, assetNote.text),
        ]),
        h('div', { key: 'asset-filter-row', style: rowStyle }, [
          h(TextInput, {
            key: 'filter',
            value: filter,
            width: 220,
            placeholder: '筛选：类型或值',
            onChange: setFilter,
          }),
          h(Select, {
            key: 'kind',
            value: kind,
            width: 160,
            options: kindOptions,
            onChange: setKind,
          }),
          h('span', { key: 'shown', style: { marginLeft: 'auto', fontSize: F11, color: C.fg2, lineHeight: LINE_HEIGHT } },
            '显示 ' + shownAssets.length + ' / 共 ' + assets.length),
        ]),
        h('div', { key: 'asset-table', style: tableWrapStyle },
          h('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: F13, lineHeight: LINE_HEIGHT } }, [
            h('thead', { key: 'head' },
              h('tr', {}, [
                h('th', { key: 'c1', style: thStyle }, '类型'),
                h('th', { key: 'c2', style: thStyle }, '值'),
                h('th', { key: 'c3', style: thStyle }, '加入时间'),
                h('th', { key: 'c4', style: thStyle }, '操作'),
              ])),
            h('tbody', { key: 'body' }, assetRows),
          ])),
        h('div', { key: 'asset-export', style: rowStyle }, [
          h(Button, { key: 'copy-all', onClick: copyAllAssets, disabled: !assets.length }, '复制全部'),
          h(Button, { key: 'json', onClick: function () { exportAssets('json'); }, disabled: locked || !assets.length }, '导出 JSON'),
          h(Button, { key: 'csv', onClick: function () { exportAssets('csv'); }, disabled: locked || !assets.length }, '导出 CSV'),
          h('span', { key: 'hint', style: Object.assign({}, hintStyle, { marginLeft: 'auto' }) },
            '导出走 GET /export?format=json|csv'),
        ]),
      ]);

      const rulesPane = h('div', { key: 'pane-rules', style: paneStyle }, [
        h(TextArea, {
          key: 'rules-text',
          value: rules,
          minHeight: 320,
          placeholder: '规则正文：首行给产物、每节一条命令加一行判据、占位符写具体值',
          onChange: function (text) {
            setRules(text);
            setRuleChars(text.length);
          },
        }),
        h('div', { key: 'rules-actions', style: rowStyle }, [
          h(Button, { key: 'save', variant: 'primary', onClick: saveRules, disabled: locked }, '保存'),
          h(Button, { key: 'reset', onClick: resetRules, disabled: locked }, '恢复默认'),
          h(Button, { key: 'preview', onClick: previewRules, disabled: locked }, '预览注入文本'),
          h('span', { key: 'rules-note', style: noteStyle(rulesNote.tone) }, rulesNote.text),
          h('span', { key: 'rules-count', style: { marginLeft: 'auto', fontSize: F11, color: C.fg2, lineHeight: LINE_HEIGHT } },
            '字数 ' + ruleChars + ' · ' + (rulesCustom ? '已自定义' : '默认') + (rulesModel ? ' · 模型 ' + rulesModel : '')),
        ]),
        preview
          ? h('div', { key: 'preview-box', style: { display: 'flex', flexDirection: 'column', gap: 6 } }, [
            h('span', { key: 'preview-label', style: hintStyle }, '当前生效文本（GET /rules）'),
            h('pre', { key: 'preview-pre', style: preStyle }, preview),
          ])
          : h('span', { key: 'preview-hint', style: hintStyle }, '点上面的预览按钮，把当前生效的规则整段拉下来查看'),
      ]);

      const presetOptions = models.presets.length
        ? models.presets.map(function (item) { return { value: String(item), label: String(item) }; })
        : [{ value: 'generic', label: 'generic' }, { value: 'qwen', label: 'qwen' }, { value: 'glm', label: 'glm' }, { value: 'deepseek', label: 'deepseek' }];

      const modelsPane = h('div', { key: 'pane-models', style: paneStyle }, [
        h('div', { key: 'model-row', style: rowStyle }, [
          h(Select, {
            key: 'model-select',
            value: pick,
            width: 220,
            options: presetOptions,
            disabled: locked,
            onChange: setPick,
          }),
          h(Button, { key: 'apply', variant: 'primary', onClick: applyModel, disabled: locked || !pick }, '应用'),
          h('span', { key: 'model-note', style: noteStyle(modelsNote.tone) }, modelsNote.text),
        ]),
        h('div', { key: 'model-info', style: { display: 'flex', flexDirection: 'column', gap: 6 } }, [
          h('span', { key: 'current', style: hintStyle },
            '当前模型：' + (models.model || '（未设置，按 generic 生效）') + ' · 规则字数 ' + models.current),
          h('span', { key: 'presets', style: hintStyle },
            '预设：' + (models.presets.length ? models.presets.join(' / ') : 'generic / qwen / glm / deepseek')),
          h('span', { key: 'model-hint', style: hintStyle }, '选一个预设后点「应用」，规则随即切换为该模型的默认文本'),
        ]),
      ]);

      const diagRows = [
        ['版本', status && status.version ? String(status.version) : '未取到'],
        ['宿主', hostVersion],
        ['注册策略', strategies],
        ['提示词注册', registered ? '已注册' : '未注册'],
        ['提示词字数', String(promptChars)],
        ['资产数量', String(assets.length)],
        ['数据目录', dataDir || '未取到'],
      ];

      const diagnosticsPane = h('div', { key: 'pane-diagnostics', style: paneStyle }, [
        h('div', { key: 'kv', style: tableWrapStyle },
          h('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: F13, lineHeight: LINE_HEIGHT } },
            h('tbody', {}, diagRows.map(function (row, index) {
              return h('tr', { key: 'kv-' + index }, [
                h('th', {
                  key: 'k',
                  style: Object.assign({}, tdStyle, {
                    width: 150,
                    textAlign: 'left',
                    fontWeight: 500,
                    color: C.fg2,
                    fontSize: F11,
                    whiteSpace: 'nowrap',
                  }),
                }, row[0]),
                h('td', { key: 'v', style: monoCellStyle }, row[1]),
              ]);
            })))),
        h('div', { key: 'warnings', style: { display: 'flex', flexDirection: 'column', gap: 6 } }, [
          h('span', { key: 'warn-label', style: noteStyle(warnings.length ? 'bad' : 'good') },
            warnings.length ? '告警 ' + warnings.length + ' 条' : '告警 0 条'),
          warnings.length
            ? h('div', { key: 'warn-list', style: tableWrapStyle },
              h('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: F11, lineHeight: LINE_HEIGHT } },
                h('tbody', {}, warnings.map(function (item, index) {
                  return h('tr', { key: 'w-' + index }, [
                    h('td', {
                      key: 'i',
                      style: Object.assign({}, monoCellStyle, { width: 40, color: C.fg2 }),
                    }, String(index + 1)),
                    h('td', { key: 't', style: Object.assign({}, monoCellStyle, { fontFamily: SANS, fontSize: F13 }) }, String(item)),
                  ]);
                }))))
            : h('span', { key: 'warn-none', style: hintStyle }, '没有告警，宿主接口都在'),
        ]),
        h('div', { key: 'diag-actions', style: rowStyle }, [
          h(Button, { key: 'refresh', variant: 'primary', onClick: refreshStatus, disabled: locked }, '重新探测'),
          statusError ? h('span', { key: 'diag-err', style: noteStyle('bad') }, '探测失败：' + statusError) : null,
          overviewNote.text ? h('span', { key: 'diag-note', style: noteStyle(overviewNote.tone) }, overviewNote.text) : null,
        ]),
        h('span', { key: 'mount', style: hintStyle }, '挂载点：sidebar.panellist + main'),
      ]);

      const paneFor = function () {
        if (tab === 'assets') return assetsPane;
        if (tab === 'rules') return rulesPane;
        if (tab === 'models') return modelsPane;
        if (tab === 'diagnostics') return diagnosticsPane;
        return overviewPane;
      };

      const contentBlock = h('div', {
        key: 'content',
        role: 'tabpanel',
        style: { minHeight: 520, display: 'flex', flexDirection: 'column' },
      }, paneFor());

      return h('div', { style: rootStyle }, [headerBlock, tabBarBlock, contentBlock]);
    }

    const Icon = function (props) {
      const active = Boolean(props && props.active);
      const size = (props && props.size) || 28;
      return h('div', {
        title: 'purge-unsafe',
        style: {
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          fontSize: F11,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          lineHeight: LINE_HEIGHT,
          background: active ? C.brand : 'transparent',
          color: active ? C.onBrand : C.fg2,
          border: '1px solid ' + (active ? C.brand : 'transparent'),
          transition: 'background .12s ease, color .12s ease, border-color .12s ease',
        },
      }, 'PU');
    };

    return {
      inject: ['slots'],
      apply(ctx) {
        try {
          ctx.slots.inject('sidebar.panellist', function () {
            return ctx.slots.register(
              { name: 'sidebar.panellist', id: 'purge-unsafe', order: 6, label: function () { return 'purge-unsafe'; } },
              function (props) { return h(Icon, props); },
            );
          });
          ctx.slots.inject('main', function () {
            return ctx.slots.register({ name: 'main', key: 'purge-unsafe' }, function () { return h(Panel, {}); });
          });
        } catch (error) {
          console.warn('[purge-unsafe] 面板注册失败：', error && error.message ? error.message : error);
        }
      },
    };
  },
});
