// السجل والبحث: اسم الزبون، رقم العقد، رقم الشاصي.

import * as db from './db.js';
import * as settingsStore from './settings.js';
import { buildHtml } from './docactions.js';
import { printDocument } from './print.js';
import { go } from './router.js';
import { ask, h, toast } from './ui.js';
import { formatDate, formatDocNumber, formatMoney, normalizeAr } from './util.js';

function haystack(d) {
  return normalizeAr([
    d.number, formatDocNumber(d.number),
    d.kind === 'receipt' ? d.buyerName : '',
    d.kind === 'receipt' ? d.tool : '',
    d.buyer?.name, d.seller?.name,
    d.buyer?.mobile, d.seller?.mobile, d.mobile,
    d.chassis, d.engineNo, d.plate, d.brand, d.machineType,
  ].filter(Boolean).join(' '));
}

export async function render(root) {
  const [contracts, receipts] = await Promise.all([db.all('contracts'), db.all('receipts')]);
  const alldocs = [...contracts, ...receipts].sort((a, b) => b.createdAt - a.createdAt);

  let kindFilter = 'all';
  const search = h('input', { class: 'input', type: 'search', placeholder: 'اسم الزبون، رقم العقد، رقم الشاصي…' });
  const listBox = h('div', { class: 'list' });
  const countEl = h('p', { class: 'muted' });

  const filters = h('div', { class: 'chips' },
    [['all', 'الكل'], ['contract', 'العقود'], ['receipt', 'الوصولات']].map(([k, label]) =>
      h('button', {
        type: 'button', class: `chip ${k === 'all' ? 'is-on' : ''}`, dataset: { k },
        onclick: (e) => {
          kindFilter = k;
          filters.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === e.currentTarget));
          paint();
        },
      }, label)),
  );

  async function reprint(d) {
    const s = await settingsStore.load();
    const html = await buildHtml(d.kind, d, s, d.copies && d.copies.length ? d.copies : ['shop']);
    await printDocument(html, { jobName: `${d.kind === 'receipt' ? 'وصل' : 'عقد'} ${formatDocNumber(d.number)}`, settings: s });
  }

  async function removeDoc(d) {
    const yes = await ask(`حذف ${d.kind === 'receipt' ? 'الوصل' : 'العقد'} رقم ${formatDocNumber(d.number)}؟ لا يمكن التراجع.`, { yes: 'احذف', no: 'تراجع' });
    if (!yes) return;
    await db.remove(d.kind === 'receipt' ? 'receipts' : 'contracts', d.id);
    const i = alldocs.indexOf(d);
    if (i >= 0) alldocs.splice(i, 1);
    toast('حُذف', 'ok');
    paint();
  }

  function paint() {
    const q = normalizeAr(search.value.trim());
    const rows = alldocs
      .filter((d) => kindFilter === 'all' || d.kind === kindFilter)
      .filter((d) => !q || haystack(d).includes(q));

    countEl.textContent = rows.length ? `${rows.length} مستنداً` : 'لا نتائج';
    listBox.textContent = '';
    for (const d of rows) {
      listBox.append(
        h('div', { class: 'list__row list__row--static' },
          h('span', { class: `list__no ${d.kind === 'receipt' ? 'is-receipt' : ''}`, text: formatDocNumber(d.number) }),
          h('span', { class: 'list__main' },
            h('b', { text: d.kind === 'receipt' ? d.buyerName : `${d.buyer?.name || '—'} ← ${d.seller?.name || '—'}` }),
            h('small', { text: d.kind === 'receipt' ? d.tool : `${d.machineType || ''} ${d.brand || ''} ${d.model || ''} — شاصي ${d.chassis || '—'}` }),
          ),
          h('span', { class: 'list__side' },
            h('b', { text: `${formatMoney(d.amount)} د.ع` }),
            h('small', { text: formatDate(d.date) }),
          ),
          h('span', { class: 'list__ops' },
            h('button', { type: 'button', class: 'btn btn--sm', onclick: () => reprint(d) }, '🖨'),
            h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => go(d.kind === 'receipt' ? 'receipt' : 'contract', { id: d.id }) }, '✎'),
            h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => removeDoc(d) }, '🗑'),
          ),
        ),
      );
    }
  }

  search.addEventListener('input', paint);
  paint();

  root.textContent = '';
  root.append(
    h('div', { class: 'screen' },
      h('header', { class: 'screen__head' }, h('h1', { class: 'screen__title', text: 'السجل والبحث' })),
      h('section', { class: 'card' }, search, filters, countEl),
      h('section', { class: 'card' }, listBox),
    ),
  );
}
