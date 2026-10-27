// شريط النسخ والطباعة والمشاركة — مشترك بين العقد والوصل.

import { h, toast } from './ui.js';
import { buildHtml } from './docbuild.js';
import { openDocument } from './docviewer.js';
import { COPY_LABELS, printDocument, shareDocument } from './print.js';
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

/**
 * أزرار الطباعة والمشاركة والمعاينة.
 * @param {'contract'|'receipt'} kind
 * @param {() => object} getDoc  المستند الحالي (بعد الحفظ)
 * @param {() => object} getSettings
 * @param {() => string[]} getCopies
 */
export function printActions(kind, getDoc, getSettings, getCopies) {
  const label = kind === 'receipt' ? 'الوصل' : 'العقد';

  // بلا هذا الالتقاط يضيع أي فشل في الطباعة أو المشاركة بصمت: الوعد
  // مرفوض ولا أحد ينتظره، ومستمع window.error لا يلتقط الوعود المرفوضة.
  const withHtml = async (fn) => {
    const doc = getDoc();
    if (!doc) {
      toast(`احفظ ${label} أولاً`, 'warn');
      return;
    }
    try {
      const html = await buildHtml(kind, doc, getSettings(), getCopies());
      await fn(html, doc);
    } catch (err) {
      toast(err && err.message ? err.message : 'تعذّرت العملية', 'error');
    }
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

  // المعاينة داخل التطبيق نفسه: window.open في تطبيق الهاتف كان يستبدل
  // صفحة التطبيق بالعقد غير مصغَّر، بلا زر رجوع ولا طريقة للخروج.
  const previewBtn = h('button', {
    type: 'button', class: 'btn btn--ghost',
    onclick: async () => {
      const doc = getDoc();
      if (!doc) {
        toast(`احفظ ${label} أولاً`, 'warn');
        return;
      }
      try {
        await openDocument(kind, { ...doc, copies: getCopies() }, getSettings(), { preview: true });
      } catch (err) {
        toast(err && err.message ? err.message : 'تعذّرت المعاينة', 'error');
      }
    },
  }, '👁 معاينة');

  return h('div', { class: 'actions' }, printBtn, shareBtn, previewBtn);
}
