/* التوجيه والإقلاع */
const App = (() => {
  const { el, $ } = U;

  const routes = [
    [/^#\/?$/, () => HomeScreen.render(view())],
    [/^#\/home/, () => HomeScreen.render(view())],
    [/^#\/contract\/new/, (m, params) => ContractScreen.render(view(), { preset: { machineType: params.get('type') || '' } })],
    [/^#\/contract\/([\w-]+)/, (m) => ContractScreen.render(view(), { id: m[1] })],
    [/^#\/receipt\/new/, (m, params) => ReceiptScreen.render(view(), { preset: { tool: params.get('tool') || '' } })],
    [/^#\/receipt\/([\w-]+)/, (m) => ReceiptScreen.render(view(), { id: m[1] })],
    [/^#\/history/, () => HistoryScreen.render(view())],
    [/^#\/settings/, () => SettingsScreen.render(view())],
  ];

  const view = () => $('#view');

  const TABS = [
    ['#/home', 'الرئيسية', '🏠'],
    ['#/contract/new', 'عقد', '📄'],
    ['#/receipt/new', 'وصل', '🧾'],
    ['#/history', 'السجل', '🔍'],
    ['#/settings', 'الإعدادات', '⚙️'],
  ];

  function drawTabs() {
    const bar = $('#tabbar');
    bar.innerHTML = '';
    const current = location.hash || '#/home';
    for (const [href, label, icon] of TABS) {
      const active = current.startsWith(href.split('/new')[0]) && !(href === '#/home' && current.length > 7);
      bar.append(el('a', { href, class: `tab${active ? ' active' : ''}` },
        el('span', { class: 'tab-icon', text: icon }), el('span', { text: label })));
    }
  }

  async function route() {
    const hash = location.hash || '#/home';
    const [path, query = ''] = hash.split('?');
    const params = new URLSearchParams(query);
    drawTabs();
    window.scrollTo({ top: 0 });
    for (const [re, handler] of routes) {
      const m = path.match(re);
      if (m) {
        try { await handler(m, params); } catch (err) {
          console.error(err);
          view().innerHTML = '';
          view().append(el('p', { class: 'muted', text: `خطأ: ${err.message}` }));
        }
        return;
      }
    }
    location.hash = '#/home';
  }

  async function start() {
    await DB.init();
    window.addEventListener('hashchange', route);
    /* زر الرجوع في أندرويد يرجع للرئيسية بدل إغلاق التطبيق */
    window.Capacitor?.Plugins?.App?.addListener?.('backButton', ({ canGoBack }) => {
      const overlay = document.querySelector('.preview-overlay, .overlay.show');
      if (overlay) { overlay.remove(); return; }
      if (location.hash && location.hash !== '#/home') location.hash = '#/home';
      else if (canGoBack) history.back();
      else window.Capacitor.Plugins.App.exitApp();
    });
    await route();
    document.body.classList.remove('loading');
  }

  return { start, route };
})();

document.addEventListener('DOMContentLoaded', () => App.start());
