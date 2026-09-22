// الشاشة الأولى: نوع المادة يقرّر تلقائياً شاشة عقد أم شاشة وصل.

import * as db from './db.js';
import * as lists from './lists.js';
import * as settingsStore from './settings.js';
import { go } from './router.js';
import { h } from './ui.js';
import { formatDocNumber, formatDate, formatMoney } from './util.js';

export async function render(root) {
  const s = await settingsStore.load();
  const [machineTypes, tools, contracts, receipts] = await Promise.all([
    lists.values('machineTypes'),
    lists.values('tools'),
    db.all('contracts'),
    db.all('receipts'),
  ]);

  const recent = [...contracts, ...receipts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const machineChips = h('div', { class: 'chips chips--big' },
    machineTypes.map((t) =>
      h('button', { type: 'button', class: 'chip chip--lg', onclick: () => go('contract', { type: t }) }, t)),
  );

  const toolChips = h('div', { class: 'chips chips--big' },
    tools.slice(0, 10).map((t) =>
      h('button', { type: 'button', class: 'chip chip--lg', onclick: () => go('receipt', { tool: t }) }, t)),
  );

  root.textContent = '';
  root.append(
    h('div', { class: 'screen' },
      h('header', { class: 'hero' },
        h('h1', { class: 'hero__name', text: s.shopName }),
        h('p', { class: 'hero__sub', text: `${s.manager} — ${s.address}` }),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'ماذا تبيع الآن؟' }),
        h('p', { class: 'muted', text: 'اختر النوع، والتطبيق يفتح الشاشة المناسبة: عقد كامل أم وصل صغير.' }),
        h('h3', { class: 'subhead', text: 'آلية كاملة ← عقد على ورقة A4' }),
        machineChips,
        h('h3', { class: 'subhead', text: 'أداة أو ملحق ← وصل على نصف ورقة' }),
        toolChips,
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'فتح مباشر' }),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn--primary', onclick: () => go('contract') }, '📄 عقد جديد'),
          h('button', { type: 'button', class: 'btn', onclick: () => go('receipt') }, '🧾 وصل جديد'),
          h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => go('history') }, '🔎 السجل والبحث'),
        ),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'آخر ما حُفظ' }),
        recent.length
          ? h('div', { class: 'list' }, recent.map((d) =>
              h('button', {
                type: 'button', class: 'list__row',
                onclick: () => go(d.kind === 'receipt' ? 'receipt' : 'contract', { id: d.id }),
              },
                h('span', { class: 'list__no', text: formatDocNumber(d.number) }),
                h('span', { class: 'list__main' },
                  h('b', { text: d.kind === 'receipt' ? d.buyerName : (d.buyer?.name || '') }),
                  h('small', { text: d.kind === 'receipt' ? d.tool : `${d.machineType} ${d.brand}` }),
                ),
                h('span', { class: 'list__side' },
                  h('b', { text: `${formatMoney(d.amount)} د.ع` }),
                  h('small', { text: formatDate(d.date) }),
                ),
              )))
          : h('p', { class: 'muted', text: 'لا يوجد شيء محفوظ بعد.' }),
      ),

      s.conditionsReviewed ? null : h('section', { class: 'card card--warn' },
        h('h2', { class: 'card__title', text: 'تنبيه قبل الطباعة الرسمية' }),
        h('p', { text: 'نص الشروط الثلاثة الحالي مسوّدة مؤقتة. افتح الإعدادات وانسخ النص الحرفي من الدفتر الورقي، ثم علّم «اعتُمد النص».' }),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => go('settings') }, 'فتح الإعدادات'),
      ),
    ),
  );
}
