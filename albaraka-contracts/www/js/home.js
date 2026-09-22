/* الشاشة الأولى: اختيار نوع المادة يقرر تلقائياً عقد أم وصل */
const HomeScreen = (() => {
  const { el } = U;

  async function render(root) {
    const s = await DB.settings();
    root.innerHTML = '';
    root.append(el('div', { class: 'hero' },
      s.images?.logo ? el('img', { class: 'hero-logo', src: s.images.logo, alt: '' }) : null,
      el('h1', { text: s.shopName }),
      el('p', { class: 'muted', text: `الإدارة: ${s.manager} — ${s.address}` })));

    const machines = await DB.listItems('machineType');
    const tools = await DB.listItems('tool');

    const machineBox = el('div', { class: 'chips big' });
    machines.slice(0, 8).forEach((m) => machineBox.append(el('button', {
      type: 'button', class: 'chip',
      onclick: () => { location.hash = `#/contract/new?type=${encodeURIComponent(m.value)}`; },
    }, m.value)));

    const toolBox = el('div', { class: 'chips big' });
    tools.slice(0, 10).forEach((t) => toolBox.append(el('button', {
      type: 'button', class: 'chip',
      onclick: () => { location.hash = `#/receipt/new?tool=${encodeURIComponent(t.value)}`; },
    }, t.value)));

    root.append(F.section('ماذا تبيع؟',
      el('p', { class: 'muted', text: 'الآلية الكاملة تفتح عقد A4، والأداة تفتح وصلاً صغيراً.' }),
      F.field('آلية', machineBox),
      F.field('أداة أو ملحق', toolBox),
      F.actionsBar(
        F.button('عقد فارغ', { kind: 'primary', onclick: () => { location.hash = '#/contract/new'; } }),
        F.button('وصل فارغ', { kind: 'accent', onclick: () => { location.hash = '#/receipt/new'; } }))));

    const [contracts, receipts] = await Promise.all([DB.allContracts(), DB.allReceipts()]);
    const recent = [...contracts.map((c) => ({ ...c, kind: 'contract' })), ...receipts.map((r) => ({ ...r, kind: 'receipt' }))]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

    const stats = el('div', { class: 'stats' },
      el('div', { class: 'stat' }, el('b', { text: String(contracts.length) }), el('span', { text: 'عقد' })),
      el('div', { class: 'stat' }, el('b', { text: String(receipts.length) }), el('span', { text: 'وصل' })),
      el('div', { class: 'stat' }, el('b', { text: U.docNo((Number(s.contractLast) || 0) + 1) }), el('span', { text: 'العقد القادم' })));

    const list = el('div', { class: 'doc-list' });
    if (!recent.length) list.append(el('p', { class: 'muted', text: 'لا يوجد مستند بعد' }));
    recent.forEach((d) => list.append(el('button', {
      class: 'doc-row', type: 'button',
      onclick: () => { location.hash = d.kind === 'contract' ? `#/contract/${d.id}` : `#/receipt/${d.id}`; },
    },
      el('span', { class: 'doc-kind', text: d.kind === 'contract' ? 'عقد' : 'وصل' }),
      el('strong', { text: U.docNo(d.no) }),
      el('span', { class: 'grow', text: d.buyer?.name || d.buyerName || '' }),
      el('span', { class: 'doc-date', text: U.fmtDate(d.datetime) }))));

    root.append(F.section('آخر المستندات', stats, list));
  }

  return { render };
})();
