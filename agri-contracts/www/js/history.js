// السجل والبحث: اسم الزبون، رقم العقد، رقم الشاصي.

import * as db from './db.js';
import * as settingsStore from './settings.js';
import { docRow } from './doclist.js';
import { openDocument } from './docviewer.js';
import { h, toast } from './ui.js';
import { formatDocNumber, normalizeAr } from './util.js';

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

  /** الضغط على السطر يفتح المستند مكتوباً كاملاً كما يخرج من الطابعة. */
  async function view(d) {
    try {
      const s = await settingsStore.load();
      await openDocument(d.kind, d, s, {
        onDeleted: () => {
          const i = alldocs.indexOf(d);
          if (i >= 0) alldocs.splice(i, 1);
          paint();
        },
      });
    } catch (err) {
      toast(err && err.message ? err.message : 'تعذّر فتح المستند', 'error');
    }
  }

  function paint() {
    const q = normalizeAr(search.value.trim());
    const rows = alldocs
      .filter((d) => kindFilter === 'all' || d.kind === kindFilter)
      .filter((d) => !q || haystack(d).includes(q));

    countEl.textContent = rows.length ? `${rows.length} مستنداً` : 'لا نتائج';
    listBox.textContent = '';
    for (const d of rows) listBox.append(docRow(d, view));
  }

  search.addEventListener('input', paint);
  paint();

  root.textContent = '';
  root.append(
    h('div', { class: 'screen' },
      h('header', { class: 'screen__head' }, h('h1', { class: 'screen__title', text: 'السجل والبحث' })),
      h('section', { class: 'card' }, search, filters, countEl,
        h('p', { class: 'muted', text: 'اضغط على أي سطر ليفتح المستند كاملاً، ومنه الطباعة والمشاركة والتعديل والحذف.' })),
      h('section', { class: 'card' }, listBox),
    ),
  );
}
