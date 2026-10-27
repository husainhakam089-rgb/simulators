// بناء HTML العقد والوصل — منفصل عن الأزرار والعارض حتى يستورده الاثنان بلا حلقة.

import { buildDocument, renderContractPage, renderReceiptSheets } from './print.js';
import { formatDocNumber } from './util.js';

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
