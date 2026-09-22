/* المعاينة والطباعة والمشاركة */
const Output = (() => {
  const { el } = U;

  const copiesOf = (doc, fallback) => (doc.copies?.length ? doc.copies : fallback);

  async function contractDoc(c) {
    const s = await DB.settings();
    const copies = copiesOf(c, s.copiesContract);
    const pages = (copies.length ? copies : [null]).map((k) => Templates.contractPage(c, s, k));
    return Printing.buildDoc(pages.join('\n'), `عقد ${U.docNo(c.no)}`);
  }

  /* الوصولات: وصل واحد في نصف ورقة، أو وصلان في الورقة مع خط قص */
  async function receiptDoc(r, { twoPerPage = true } = {}) {
    const s = await DB.settings();
    const copies = copiesOf(r, s.copiesReceipt);
    const slips = (copies.length ? copies : [null]).map((k) => Templates.receiptSlip(r, s, k));
    const pages = [];
    if (twoPerPage) {
      for (let i = 0; i < slips.length; i += 2) pages.push(Templates.receiptPage([slips[i], slips[i + 1]]));
    } else {
      for (const slip of slips) pages.push(Templates.receiptPage([slip, null]));
    }
    return Printing.buildDoc(pages.join('\n'), `وصل ${U.docNo(r.no)}`);
  }

  /* نافذة معاينة بالحجم الحقيقي مع أزرار الطباعة والمشاركة */
  async function preview(html, { jobName, fileName }) {
    const frame = el('iframe', { class: 'preview-frame' });
    frame.srcdoc = html;
    const overlay = el('div', { class: 'preview-overlay show' },
      el('div', { class: 'preview-bar' },
        el('strong', { text: jobName }),
        el('div', { class: 'preview-actions' },
          F.button('طباعة', { kind: 'primary', onclick: () => sendToPrinter(html, jobName) }),
          F.button('مشاركة', { kind: 'accent', onclick: () => Printing.share(html, { fileName, title: jobName }) }),
          F.button('إغلاق', { onclick: () => overlay.remove() }))),
      el('div', { class: 'preview-scroll' }, frame));
    document.body.append(overlay);
  }

  async function sendToPrinter(html, jobName) {
    const s = await DB.settings();
    UI.toast('يُرسل إلى الطابعة…');
    const res = await Printing.send(html, { jobName, mode: s.printerMode, printerUrl: s.printerUrl });
    if (res.via === 'direct') UI.toast('أُرسل للطابعة مباشرة');
  }

  const previewContract = async (id) => {
    const c = await DB.getContract(id);
    await preview(await contractDoc(c), { jobName: `عقد ${U.docNo(c.no)}`, fileName: `contract-${U.docNo(c.no)}.pdf` });
  };

  const printContract = async (id) => {
    const c = await DB.getContract(id);
    await sendToPrinter(await contractDoc(c), `عقد ${U.docNo(c.no)}`);
  };

  const shareContract = async (id) => {
    const c = await DB.getContract(id);
    await Printing.share(await contractDoc(c), {
      fileName: `contract-${U.docNo(c.no)}.pdf`,
      title: `عقد ${U.docNo(c.no)}`,
      text: `عقد بيع رقم ${U.docNo(c.no)} — ${(await DB.settings()).shopName}`,
    });
  };

  const previewReceipt = async (id, opts) => {
    const r = await DB.getReceipt(id);
    await preview(await receiptDoc(r, opts), { jobName: `وصل ${U.docNo(r.no)}`, fileName: `receipt-${U.docNo(r.no)}.pdf` });
  };

  const printReceipt = async (id, opts) => {
    const r = await DB.getReceipt(id);
    await sendToPrinter(await receiptDoc(r, opts), `وصل ${U.docNo(r.no)}`);
  };

  const shareReceipt = async (id, opts) => {
    const r = await DB.getReceipt(id);
    await Printing.share(await receiptDoc(r, opts), {
      fileName: `receipt-${U.docNo(r.no)}.pdf`, title: `وصل ${U.docNo(r.no)}`,
    });
  };

  return {
    contractDoc, receiptDoc, preview, sendToPrinter,
    previewContract, printContract, shareContract,
    previewReceipt, printReceipt, shareReceipt,
  };
})();
