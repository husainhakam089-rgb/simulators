/* شاشة الوصل الصغير — نفس منطق العقد بحقول أقل */
const ReceiptScreen = (() => {
  const { el } = U;

  function blank(settings, preset = {}) {
    return {
      id: U.uid(),
      no: null,
      kind: 'receipt',
      datetime: U.toLocalISO(new Date()),
      createdAt: Date.now(),
      buyerName: '', mobile: '',
      tool: preset.tool || '', qty: '1',
      amount: 0, paid: 0, remaining: 0, amountWords: '',
      notes: '',
      twoPerPage: true,
      copies: [...(settings.copiesReceipt || ['buyer', 'shop'])],
    };
  }

  async function render(root, { id, preset } = {}) {
    const settings = await DB.settings();
    const existing = id ? await DB.getReceipt(id) : null;
    const r = existing ? JSON.parse(JSON.stringify(existing)) : blank(settings, preset);
    if (!r.no) r.no = await DB.nextNumber('receipt');

    root.innerHTML = '';
    root.append(el('div', { class: 'screen-head' },
      el('h1', { text: existing ? 'تعديل وصل' : 'وصل جديد' }),
      el('span', { class: 'doc-badge', text: `رقم ${U.docNo(r.no)}` })));

    const dateBtn = F.wheelButton({
      text: '', onclick: async () => {
        const v = await UI.pickDateTime(r.datetime);
        if (v) { r.datetime = v; drawDate(); }
      },
    });
    const dayOut = el('div', { class: 'readonly' });
    const drawDate = () => {
      dateBtn.textContent = `${U.fmtDate(r.datetime)} — ${U.fmtTime(r.datetime)}`;
      dayOut.textContent = U.dayName(r.datetime);
    };
    drawDate();

    const nameInput = F.textInput({ value: r.buyerName, placeholder: 'اسم المشتري', onInput: (v) => { r.buyerName = v; } });
    const nameWrap = el('div', { class: 'suggest-wrap' }, nameInput);
    const mobileInput = F.textInput({ value: r.mobile, ltr: true, inputmode: 'tel', onInput: (v) => { r.mobile = v; } });
    UI.customerSuggest(nameInput, (row) => {
      r.buyerName = row.name; r.mobile = row.mobile || '';
      nameInput.value = r.buyerName; mobileInput.value = r.mobile;
      UI.toast('عُبّئت بيانات الزبون');
    });

    root.append(F.section('الأساسيات',
      F.field('الساعة والتاريخ', dateBtn),
      F.field('اليوم', dayOut),
      F.field('اسم المشتري', nameWrap, 'اكتب حرفين ليظهر الزبون السابق'),
      F.field('الموبايل', mobileInput),
      F.chipsField('نوع الأداة', 'tool', r.tool, (v) => { r.tool = v; }),
      F.field('العدد', F.textInput({ value: r.qty, ltr: true, inputmode: 'numeric', onInput: (v) => { r.qty = v; } }))));

    const wordsOut = el('div', { class: 'readonly words' });
    const remainOut = el('div', { class: 'readonly' });
    const amount = F.moneyInput({ value: r.amount, onInput: (v) => { r.amount = v; recalc(); } });
    const paid = F.moneyInput({ value: r.paid, onInput: (v) => { r.paid = v; recalc(); } });
    const recalc = () => {
      r.remaining = Math.max(0, U.num(r.amount) - U.num(r.paid));
      r.amountWords = NumWords.amount(r.amount, settings.currency);
      wordsOut.textContent = r.amountWords || '—';
      remainOut.textContent = `${U.fmtMoney(r.remaining)}  ${settings.currency}`;
    };
    recalc();

    root.append(F.section('المبالغ',
      F.field('المبلغ', amount.node),
      F.field('المبلغ كتابةً', wordsOut),
      F.field('وقد قبض منه', paid.node),
      F.field('والباقي', remainOut)));

    root.append(F.section('الملاحظات',
      F.field('', F.textInput({ value: r.notes, multiline: true, onInput: (v) => { r.notes = v; } }))));

    const copiesBox = el('div', { class: 'chips' });
    const drawCopies = () => {
      copiesBox.innerHTML = '';
      for (const [key, label] of Object.entries(Templates.COPY_LABELS)) {
        const on = r.copies.includes(key);
        copiesBox.append(el('button', {
          type: 'button', class: `chip${on ? ' active' : ''}`,
          onclick: () => { r.copies = on ? r.copies.filter((k) => k !== key) : [...r.copies, key]; drawCopies(); },
        }, label));
      }
    };
    drawCopies();

    const twoBox = el('label', { class: 'check-row' });
    const twoCb = el('input', { type: 'checkbox', checked: r.twoPerPage });
    twoCb.addEventListener('change', () => { r.twoPerPage = twoCb.checked; });
    twoBox.append(twoCb, el('span', { text: 'وصلان في الورقة الواحدة مع خط قص (توفير الورق)' }));

    root.append(F.section('النسخ والطباعة', copiesBox, twoBox));

    const persist = async () => {
      if (!r.buyerName.trim() || !r.tool || !U.num(r.amount)) {
        await UI.alertBox('الاسم ونوع الأداة والمبلغ حقول أساسية', 'تحقّق قبل الحفظ');
        return false;
      }
      r.day = U.dayName(r.datetime);
      r.updatedAt = Date.now();
      await DB.saveReceipt(r);
      await DB.commitNumber('receipt', r.no);
      await DB.saveCustomer({ name: r.buyerName, mobile: r.mobile });
      await DB.bumpListItem('tool', r.tool);
      await UI.flushPending();
      return true;
    };

    root.append(F.actionsBar(
      F.button('حفظ', { kind: 'primary', onclick: async () => { if (await persist()) { UI.toast('حُفظ الوصل'); location.hash = '#/history'; } } }),
      F.button('حفظ وطباعة', { kind: 'accent', onclick: async () => { if (await persist()) await Output.printReceipt(r.id, { twoPerPage: r.twoPerPage }); } }),
      F.button('معاينة', { onclick: async () => { if (await persist()) await Output.previewReceipt(r.id, { twoPerPage: r.twoPerPage }); } }),
    ));
  }

  return { render, blank };
})();
