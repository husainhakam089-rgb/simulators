/* شاشة العقد الكامل — نفس ترتيب الورقة الأصلية */
const ContractScreen = (() => {
  const { el } = U;

  const emptyPerson = () => ({ name: '', idType: '', idNumber: '', recordNo: '', pageNo: '', office: '', address: '', mobile: '' });

  function blank(settings, preset = {}) {
    return {
      id: U.uid(),
      no: null,
      kind: 'contract',
      datetime: U.toLocalISO(new Date()),
      createdAt: Date.now(),
      machine: { type: preset.machineType || '', brand: '', model: '', color: '', chassis: '', engine: '', plate: '', plateProvince: 'نينوى' },
      annual: { name: '', address: '' },
      amount: 0, paid: 0, remaining: 0, amountWords: '',
      notes: '',
      seller: emptyPerson(),
      buyer: emptyPerson(),
      photos: { buyer: '', seller: '' },
      copies: [...(settings.copiesContract || ['seller', 'buyer', 'shop'])],
    };
  }

  async function render(root, { id, preset } = {}) {
    const settings = await DB.settings();
    const existing = id ? await DB.getContract(id) : null;
    const c = existing ? JSON.parse(JSON.stringify(existing)) : blank(settings, preset);
    if (!c.no) c.no = await DB.nextNumber('contract');

    root.innerHTML = '';
    root.append(el('div', { class: 'screen-head' },
      el('h1', { text: existing ? 'تعديل عقد' : 'عقد بيع جديد' }),
      el('span', { class: 'doc-badge', text: `رقم ${U.docNo(c.no)}` })));

    /* --- الصور والتاريخ --- */
    const photoRow = el('div', { class: 'photo-row' });
    const buyerBox = el('div', { class: 'photo-wrap' });
    const sellerBox = el('div', { class: 'photo-wrap' });
    photoRow.append(buyerBox, sellerBox);
    const buyerPhoto = UI.photoField(buyerBox, { label: 'صورة المشتري', value: c.photos.buyer, onChange: (v) => { c.photos.buyer = v; } });
    const sellerPhoto = UI.photoField(sellerBox, { label: 'صورة البائع', value: c.photos.seller, onChange: (v) => { c.photos.seller = v; } });

    const dateBtn = F.wheelButton({
      text: '', onclick: async () => {
        const v = await UI.pickDateTime(c.datetime);
        if (v) { c.datetime = v; drawDate(); }
      },
    });
    const dayOut = el('div', { class: 'readonly' });
    const drawDate = () => {
      dateBtn.textContent = `${U.fmtDate(c.datetime)} — ${U.fmtTime(c.datetime)}`;
      dayOut.textContent = U.dayName(c.datetime);
    };
    drawDate();

    root.append(F.section('الصور والتاريخ',
      photoRow,
      F.field('الساعة والتاريخ', dateBtn),
      F.field('اليوم', dayOut, 'يُحسب تلقائياً من التاريخ')));

    /* --- بيانات الآلية --- */
    const modelBtn = F.wheelButton({
      text: c.machine.model || 'اختر السنة', onclick: async () => {
        const v = await UI.pickYear(c.machine.model);
        if (v) { c.machine.model = v; modelBtn.textContent = v; }
      },
    });
    const provinceBox = el('div');
    UI.chips(provinceBox, { type: 'province', value: c.machine.plateProvince, onChange: (v) => { c.machine.plateProvince = v; } });

    root.append(F.section('بيانات الآلية',
      F.chipsField('نوع الآلية', 'machineType', c.machine.type, (v) => { c.machine.type = v; }),
      F.chipsField('الماركة', 'brand', c.machine.brand, (v) => { c.machine.brand = v; }),
      F.field('الموديل', modelBtn),
      F.chipsField('اللون', 'color', c.machine.color, (v) => { c.machine.color = v; }),
      F.field('رقم الشاصي', F.textInput({ value: c.machine.chassis, ltr: true, onInput: (v) => { c.machine.chassis = v; } })),
      F.field('رقم المحرك', F.textInput({ value: c.machine.engine, ltr: true, onInput: (v) => { c.machine.engine = v; } }), 'اختياري'),
      F.field('المرقمة', F.textInput({ value: c.machine.plate, ltr: true, onInput: (v) => { c.machine.plate = v; } })),
      F.field('محافظة المرقمة', provinceBox)));

    /* --- السنوية --- */
    const annualName = F.textInput({ value: c.annual.name, onInput: (v) => { c.annual.name = v; } });
    const annualAddress = F.textInput({ value: c.annual.address, onInput: (v) => { c.annual.address = v; } });
    root.append(F.section('السنوية',
      F.field('السنوية بأسم', annualName),
      F.field('عنوانه', annualAddress),
      F.button('نفس البائع', {
        onclick: () => {
          c.annual.name = c.seller.name || '';
          c.annual.address = c.seller.address || '';
          annualName.value = c.annual.name;
          annualAddress.value = c.annual.address;
          UI.toast('نُقلت بيانات البائع');
        },
      })));

    /* --- المبالغ --- */
    const wordsOut = el('div', { class: 'readonly words' });
    const remainOut = el('div', { class: 'readonly' });
    const paid = F.moneyInput({ value: c.paid, onInput: (v) => { c.paid = v; recalc(); } });
    const amount = F.moneyInput({ value: c.amount, onInput: (v) => { c.amount = v; recalc(); } });
    const recalc = () => {
      c.remaining = Math.max(0, U.num(c.amount) - U.num(c.paid));
      c.amountWords = NumWords.amount(c.amount, settings.currency);
      wordsOut.textContent = c.amountWords || '—';
      remainOut.textContent = `${U.fmtMoney(c.remaining)}  ${settings.currency}`;
    };
    recalc();

    root.append(F.section('المبالغ',
      F.field('المبلغ', amount.node),
      F.field('المبلغ كتابةً', wordsOut, 'يُحوَّل تلقائياً'),
      F.field('وقد قبض منه', paid.node),
      F.field('والباقي', remainOut, 'يُحسب تلقائياً')));

    /* --- الملاحظات --- */
    root.append(F.section('الملاحظات',
      F.field('', F.textInput({ value: c.notes, multiline: true, placeholder: 'ملاحظات إضافية…', onInput: (v) => { c.notes = v; } }))));

    /* --- الطرفان --- */
    root.append(F.partyBlock('بيانات البائع', c.seller));
    root.append(F.partyBlock('بيانات المشتري', c.buyer));

    /* --- النسخ --- */
    const copiesBox = el('div', { class: 'chips' });
    const drawCopies = () => {
      copiesBox.innerHTML = '';
      for (const [key, label] of Object.entries(Templates.COPY_LABELS)) {
        const on = c.copies.includes(key);
        copiesBox.append(el('button', {
          type: 'button', class: `chip${on ? ' active' : ''}`,
          onclick: () => {
            c.copies = on ? c.copies.filter((k) => k !== key) : [...c.copies, key];
            drawCopies();
          },
        }, label));
      }
    };
    drawCopies();
    root.append(F.section('النسخ المطلوبة', copiesBox));

    /* --- الأزرار --- */
    const validate = () => {
      const problems = [];
      if (!c.machine.type) problems.push('نوع الآلية');
      if (!c.buyer.name.trim()) problems.push('اسم المشتري');
      if (!c.seller.name.trim()) problems.push('اسم البائع');
      if (!U.num(c.amount)) problems.push('المبلغ');
      return problems;
    };

    const persist = async () => {
      const problems = validate();
      if (problems.length) {
        await UI.alertBox(`الحقول التالية ناقصة: ${problems.join('، ')}`, 'تحقّق قبل الحفظ');
        return false;
      }
      c.photos.buyer = buyerPhoto.value;
      c.photos.seller = sellerPhoto.value;
      c.day = U.dayName(c.datetime);
      c.updatedAt = Date.now();
      await DB.saveContract(c);
      await DB.commitNumber('contract', c.no);
      await DB.saveCustomer(c.seller);
      await DB.saveCustomer(c.buyer);
      for (const [type, value] of [
        ['machineType', c.machine.type], ['brand', c.machine.brand], ['color', c.machine.color],
        ['province', c.machine.plateProvince],
        ['office', c.seller.office], ['office', c.buyer.office],
        ['idType', c.seller.idType], ['idType', c.buyer.idType],
      ]) await DB.bumpListItem(type, value);
      await UI.flushPending();
      return true;
    };

    root.append(F.actionsBar(
      F.button('حفظ', { kind: 'primary', onclick: async () => { if (await persist()) { UI.toast('حُفظ العقد'); location.hash = '#/history'; } } }),
      F.button('حفظ وطباعة', { kind: 'accent', onclick: async () => { if (await persist()) await Output.printContract(c.id); } }),
      F.button('معاينة', { onclick: async () => { if (await persist()) await Output.previewContract(c.id); } }),
    ));
  }

  return { render, blank };
})();
