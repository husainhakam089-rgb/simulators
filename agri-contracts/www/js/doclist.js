// سطر المستند في القوائم: ما يكفي للتعرّف عليه فقط، لا تفاصيله كلها.

import { h } from './ui.js';
import { formatDate, formatDocNumber } from './util.js';

/**
 * @param {object} doc عقد أو وصل محفوظ
 * @param {(doc: object) => void} onOpen
 */
export function docRow(doc, onOpen) {
  const isReceipt = doc.kind === 'receipt';
  const who = (isReceipt ? doc.buyerName : doc.buyer && doc.buyer.name) || '—';
  const what = isReceipt
    ? doc.tool || 'وصل'
    : [doc.machineType, doc.brand].filter(Boolean).join(' — ') || 'عقد';

  const open = () => onOpen(doc);
  return h('div', {
    class: `docrow ${isReceipt ? 'docrow--receipt' : ''}`,
    role: 'button',
    tabindex: '0',
    onclick: open,
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    },
  },
    h('div', { class: 'docrow__line' },
      h('b', { class: 'docrow__who', text: who }),
      h('span', { class: 'docrow__no', text: formatDocNumber(doc.number) }),
    ),
    h('div', { class: 'docrow__line docrow__line--sub' },
      h('span', { class: 'docrow__what', text: what }),
      h('span', { class: 'docrow__date', text: formatDate(doc.date) }),
    ),
  );
}
