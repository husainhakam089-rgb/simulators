// نقطة البداية: تهيئة القاعدة والقوائم، ثم تشغيل الموجّه وشريط التنقل.

import * as db from './db.js';
import * as lists from './lists.js';
import * as settingsStore from './settings.js';
import { current, go, mount, onNavigate, register, start } from './router.js';
import { h, toast } from './ui.js';

register('home', () => import('./home.js'));
register('contract', () => import('./contract.js'));
register('receipt', () => import('./receipt.js'));
register('history', () => import('./history.js'));
register('settings', () => import('./settings-screen.js'));

const NAV = [
  ['home', '🏠', 'الرئيسية'],
  ['contract', '📄', 'عقد'],
  ['receipt', '🧾', 'وصل'],
  ['history', '🔎', 'السجل'],
  ['settings', '⚙', 'الإعدادات'],
];

function buildNav() {
  const bar = document.getElementById('nav');
  bar.textContent = '';
  for (const [name, icon, label] of NAV) {
    bar.append(h('button', {
      type: 'button', class: 'nav__btn', dataset: { route: name },
      onclick: () => go(name),
    }, h('span', { class: 'nav__icon', text: icon }), h('span', { class: 'nav__label', text: label })));
  }
  onNavigate((name) => {
    bar.querySelectorAll('.nav__btn').forEach((b) => b.classList.toggle('is-on', b.dataset.route === name));
  });
}

async function boot() {
  try {
    await db.open();
    await lists.seed();
    await settingsStore.load();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="screen"><section class="card card--warn"><h2 class="card__title">تعذّر فتح قاعدة البيانات</h2><p>${e.message}</p></section></div>`;
    return;
  }

  mount(document.getElementById('app'));
  buildNav();
  start('home');

  document.getElementById('splash')?.remove();
  void current;
}

window.addEventListener('error', (e) => {
  if (e.message) toast(`خطأ: ${e.message}`, 'error');
});

boot();
