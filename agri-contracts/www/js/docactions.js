// شريط النسخ والطباعة والمشاركة — مشترك بين العقد والوصل.

import { h, toast } from './ui.js';
import { COPY_LABELS, buildDocument, printDocument, renderContractPage, renderReceiptSheets, shareDocument } from './print.js';
import { formatDocNumber } from './util.js';

const ORDER = ['buyer', 'seller', 'shop'];

/** كبسولات اختيار النسخ (وليس رقماً). */
export function copiesPicker(selected = []) {
  let value = ORDER.filter((k) => selected.includes(k));
  const wrap = h('div', { class: 'chips' });

  function render() {
    wrap.textContent = '';
    for (const k of ORDER) {
      wrap.append(h('button', {
        type: 'button',
        class: `chip ${value.includes(k) ? 'is-on' : ''}`,
        onclick: () => {
          value = value.includes(k) ? value.filter((x) => x !== k) : [...value, k];
          render();
        },
      }, COPY_LABELS[k].replace('نسخة ', '')));
    }
  }
  render();

  return {
    el: h('div', { class: 'field' },
      h('label', { class: 'field__label', text: 'النسخ المطلوبة' }),
      wrap,
      h('div', { class: 'field__hint', text: 'كل نسخة يُطبع فوقها اسم صاحبها، وتخرج كلها بضغطة واحدة.' }),
    ),
    get: () => ORDER.filter((k) => value.includes(k)),
  };
}

async function contractHtml(contract, settings, copies) {
  const pages = (copies.length ? copies : [null]).map((k) => renderContractPage(contract, settings, k)).join('');
  return buildDocument(pages, { title: `عقد ${formatDocNumber(contract.number)}` });
}

async function receiptHtml(receipt, settings, copies) {
  const entries = (copies.length ? copies : [null]).map((copy) => ({ receipt, copy }));
  return buildDocument(renderReceiptSheets(entries, settings), { title: `وصل ${formatDocNumber(receipt.number)}` });
}

export async function buildHtml(kind, doc, settings, copies) {
  return kind === 'receipt' ? receiptHtml(doc, settings, copies) : contractHtml(doc, settings, copies);
}

/** نسخة واحدة بلا ختم «نسخة …» — للعرض على الشاشة لا للطباعة. */
export async function buildViewHtml(kind, doc, settings) {
  return buildHtml(kind, doc, settings, [null]);
}

/**
 * أزرار الطباعة والمشاركة والمعاينة.
 * @param {'contract'|'receipt'} kind
 * @param {() => object} getDoc  المستند الحالي (بعد الحفظ)
 * @param {() => object} getSettings
 * @param {() => string[]} getCopies
 */
export function printActions(kind, getDoc, getSettings, getCopies) {
  const label = kind === 'receipt' ? 'الوصل' : 'العقد';

  const withHtml = async (fn) => {
    const doc = getDoc();
    if (!doc) {
      toast(`احفظ ${label} أولاً`, 'warn');
      return;
    }
    const html = await buildHtml(kind, doc, getSettings(), getCopies());
    await fn(html, doc);
  };

  const printBtn = h('button', {
    type: 'button', class: 'btn btn--primary',
    onclick: () => withHtml(async (html, doc) => {
      const via = await printDocument(html, {
        jobName: `${label} ${formatDocNumber(doc.number)}`,
        settings: getSettings(),
      });
      if (via === 'direct') toast('أُرسل للطابعة مباشرة', 'ok');
    }),
  }, '🖨 طباعة');

  const shareBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => withHtml(async (html, doc) => {
      const ok = await shareDocument(html, {
        fileName: `${label}-${formatDocNumber(doc.number)}.pdf`,
        title: `${label} ${formatDocNumber(doc.number)}`,
      });
      if (ok) toast('جاهز للمشاركة', 'ok');
    }),
  }, '📤 مشاركة PDF');

  const previewBtn = h('button', {
    type: 'button', class: 'btn btn--ghost',
    onclick: () => withHtml(async (html) => {
      const win = window.open('', '_blank');
      if (!win) {
        toast('تعذّر فتح المعاينة', 'error');
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    }),
  }, '👁 معاينة');

  return h('div', { class: 'actions' }, printBtn, shareBtn, previewBtn);
}
