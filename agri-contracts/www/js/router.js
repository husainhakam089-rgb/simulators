// موجّه شاشات بسيط مع دعم زر الرجوع في الهاتف.

const routes = new Map();
let rootEl = null;
let currentName = null;
const listeners = new Set();

export function register(name, loader) {
  routes.set(name, loader);
}

export function mount(el) {
  rootEl = el;
}

export function onNavigate(fn) {
  listeners.add(fn);
}

export async function go(name, params = {}, { replace = false } = {}) {
  const loader = routes.get(name);
  if (!loader) return;
  currentName = name;
  const mod = await loader();
  rootEl.classList.add('is-loading');
  await mod.render(rootEl, params);
  rootEl.classList.remove('is-loading');
  rootEl.scrollTop = 0;
  window.scrollTo(0, 0);
  const state = { name, params };
  if (replace) history.replaceState(state, '', `#${name}`);
  else history.pushState(state, '', `#${name}`);
  listeners.forEach((fn) => fn(name, params));
}

export function current() {
  return currentName;
}

export function start(defaultRoute = 'home') {
  window.addEventListener('popstate', (e) => {
    const s = e.state;
    if (s && s.name) {
      const loader = routes.get(s.name);
      if (loader) {
        currentName = s.name;
        loader().then((mod) => mod.render(rootEl, s.params || {}));
        listeners.forEach((fn) => fn(s.name, s.params || {}));
        return;
      }
    }
    go(defaultRoute, {}, { replace: true });
  });
  const fromHash = location.hash.replace('#', '');
  go(routes.has(fromHash) ? fromHash : defaultRoute, {}, { replace: true });
}
