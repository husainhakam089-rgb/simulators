/* السجل والبحث: كل العقود والوصولات، وإعادة طباعة أي مستند قديم */
const HistoryScreen = (() => {
  const { el } = U;

  const matches = (doc, q) => {
    if (!q) return true;
    const hay = [
      U.docNo(doc.no), String(doc.no),
      doc.buyer?.name, doc.seller?.name, doc.buyerName,
      doc.machine?.chassis, doc.machine?.plate, doc.machine?.engine,
      doc.machine?.brand, doc.machine?.type, doc.tool,
      doc.buyer?.mobile, doc.seller?.mobile, doc.mobile,
    ].filter(Boolean).map((v) => U.normalizeAr(v)).join(' ');
    return hay.includes(U.normalizeAr(q));
  };

  async function render(root) {
    root.innerHTML = '';
    root.append(el('div', { class: 'screen-head' }, el('h1', { text: 'السجل' })));

    const search = el('input', { class: 'input', type: 'search', placeholder: 'اسم الزبون، رقم العقد، رقم الشاصي…' });
    const filterBox = el('div', { class: 'chips' });
    const list = el('div', { class: 'doc-list' });
    root.append(F.section('', F.field('بحث', search), filterBox), list);

    let filter = 'all';
    const filters = { all: 'الكل', contract: 'العقود', receipt: 'الوصولات' };
    const drawFilters = () => {
      filterBox.innerHTML = '';
      for (const [key, label] of Object.entries(filters)) {
        filterBox.append(el('button', {
          type: 'button', class: `chip${filter === key ? ' active' : ''}`,
          onclick: () => { filter = key; drawFilters(); draw(); },
        }, label));
      }
    };

    const [contracts, receipts] = await Promise.all([DB.allContracts(), DB.allReceipts()]);
    const all = [
      ...contracts.map((c) => ({ ...c, kind: 'contract' })),
      ...receipts.map((r) => ({ ...r, kind: 'receipt' })),
    ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    function card(doc) {
      const isContract = doc.kind === 'contract';
      const title = isContract
        ? `${doc.machine?.type || 'آلية'} ${doc.machine?.brand || ''} — ${doc.buyer?.name || ''}`
        : `${doc.tool || 'أداة'} — ${doc.buyerName || ''}`;
      return el('article', { class: `doc-card ${doc.kind}` },
        el('div', { class: 'doc-card-head' },
          el('span', { class: 'doc-kind', text: isContract ? 'عقد' : 'وصل' }),
          el('strong', { class: 'doc-num', text: U.docNo(doc.no) }),
          el('span', { class: 'doc-date', text: U.fmtDate(doc.datetime) })),
        el('p', { class: 'doc-title', text: title.trim() }),
        el('p', { class: 'doc-sum', text: `${U.fmtMoney(doc.amount)} — باقي ${U.fmtMoney(doc.remaining)}` }),
        el('div', { class: 'doc-card-actions' },
          F.button('فتح', {
            onclick: () => { location.hash = isContract ? `#/contract/${doc.id}` : `#/receipt/${doc.id}`; },
          }),
          F.button('طباعة', {
            kind: 'primary',
            onclick: () => (isContract ? Output.printContract(doc.id) : Output.printReceipt(doc.id, { twoPerPage: doc.twoPerPage !== false })),
          }),
          F.button('مشاركة', {
            kind: 'accent',
            onclick: () => (isContract ? Output.shareContract(doc.id) : Output.shareReceipt(doc.id, { twoPerPage: doc.twoPerPage !== false })),
          }),
          F.button('حذف', {
            onclick: async () => {
              if (!await UI.confirmBox(`حذف ${isContract ? 'العقد' : 'الوصل'} رقم ${U.docNo(doc.no)}؟`, { title: 'تأكيد الحذف' })) return;
              await (isContract ? DB.deleteContract(doc.id) : DB.deleteReceipt(doc.id));
              UI.toast('حُذف المستند');
              render(root);
            },
          })));
    }

    function draw() {
      const q = search.value.trim();
      const rows = all.filter((d) => (filter === 'all' || d.kind === filter) && matches(d, q));
      list.innerHTML = '';
      if (!rows.length) { list.append(el('p', { class: 'muted', text: 'لا يوجد مستند مطابق' })); return; }
      rows.slice(0, 200).forEach((d) => list.append(card(d)));
    }

    search.addEventListener('input', draw);
    drawFilters();
    draw();
  }

  return { render };
})();
