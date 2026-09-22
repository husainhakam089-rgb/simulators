// عارض المستند: يفتح العقد أو الوصل مكتوباً كاملاً كما يخرج من الطابعة.

import { buildHtml, buildViewHtml } from './docactions.js';
import { countPages, printDocument, shareDocument } from './print.js';
import { go } from './router.js';
import { h, toast } from './ui.js';
import { formatDocNumber } from './util.js';

const PAGE_W = 794; // عرض A4 بوحدات CSS
const PAGE_H = 1123;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

/**
 * فتح مستند محفوظ في عارض ملء الشاشة.
 * @param {'contract'|'receipt'} kind
 * @param {object} doc المستند المحفوظ
 * @param {object} settings
 */
export async function openDocument(kind, doc, settings) {
  const label = kind === 'receipt' ? 'وصل' : 'عقد';
  const html = await buildViewHtml(kind, doc, settings);
  const pages = countPages(html);

  const frame = h('iframe', {
    class: 'docview__frame',
    title: `${label} ${formatDocNumber(doc.number)}`,
    loading: 'eager',
  });
  const stage = h('div', { class: 'docview__stage' }, frame);
  const scroll = h('div', { class: 'docview__scroll' }, stage);

  let zoom = 1;
  let fitZoom = 1;

  function applyZoom() {
    frame.style.width = `${PAGE_W}px`;
    frame.style.height = `${PAGE_H * pages}px`;
    frame.style.transform = `scale(${zoom})`;
    stage.style.width = `${PAGE_W * zoom}px`;
    stage.style.height = `${PAGE_H * pages * zoom}px`;
  }

  function fit() {
    const available = scroll.clientWidth - 16;
    fitZoom = Math.max(MIN_ZOOM, Math.min(1, available / PAGE_W));
    zoom = fitZoom;
    applyZoom();
  }

  const zoomBy = (factor) => {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    applyZoom();
  };

  const overlay = h('div', { class: 'docview' });
  const close = () => {
    window.removeEventListener('resize', fit);
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  const act = async (fn) => {
    try {
      await fn();
    } catch (err) {
      toast(err.message || 'تعذّر تنفيذ العملية', 'error');
    }
  };

  const copies = doc.copies && doc.copies.length ? doc.copies : ['shop'];

  overlay.append(
    h('header', { class: 'docview__bar' },
      h('button', { type: 'button', class: 'docview__x', 'aria-label': 'إغلاق', onclick: close }, '✕'),
      h('div', { class: 'docview__title' },
        h('b', { text: `${label} رقم ${formatDocNumber(doc.number)}` }),
        h('small', { text: kind === 'receipt' ? doc.buyerName || '' : `${doc.buyer?.name || ''} ← ${doc.seller?.name || ''}` }),
      ),
      h('div', { class: 'docview__zoom' },
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => zoomBy(0.8), 'aria-label': 'تصغير' }, '−'),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: fit }, 'ملء العرض'),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => zoomBy(1.25), 'aria-label': 'تكبير' }, '+'),
      ),
    ),
    scroll,
    h('footer', { class: 'docview__actions' },
      h('button', {
        type: 'button', class: 'btn btn--primary',
        onclick: () => act(async () => {
          const out = await buildHtml(kind, doc, settings, copies);
          const via = await printDocument(out, { jobName: `${label} ${formatDocNumber(doc.number)}`, settings });
          if (via === 'direct') toast('أُرسل للطابعة مباشرة', 'ok');
        }),
      }, '🖨 طباعة'),
      h('button', {
        type: 'button', class: 'btn',
        onclick: () => act(async () => {
          const out = await buildHtml(kind, doc, settings, copies);
          const ok = await shareDocument(out, {
            fileName: `${label}-${formatDocNumber(doc.number)}.pdf`,
            title: `${label} ${formatDocNumber(doc.number)}`,
          });
          if (ok) toast('جاهز للمشاركة', 'ok');
        }),
      }, '📤 مشاركة'),
      h('button', {
        type: 'button', class: 'btn btn--ghost',
        onclick: () => { close(); go(kind === 'receipt' ? 'receipt' : 'contract', { id: doc.id }); },
      }, '✎ تعديل'),
    ),
  );

  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', fit);
  frame.srcdoc = html;
  requestAnimationFrame(fit);
  return { close };
}
