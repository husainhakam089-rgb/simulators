// شاشة العقد الكامل — بترتيب حقول الورقة الأصلية.

import * as db from './db.js';
import * as lists from './lists.js';
import * as settingsStore from './settings.js';
import * as customers from './customers.js';
import { amountPhrase } from './tafqeet.js';
import { copiesPicker, printActions } from './docactions.js';
import { partyBlock } from './party.js';
import {
  askMulti, chipField, h, photoField, textArea, textField, toast, wheelField,
} from './ui.js';
import {
  dayNameFromISO, digitsOnly, formatDocNumber, formatMoney, formatMoneyInput, nowTime, todayISO,
} from './util.js';

export async function render(root, { id = null, type = '' } = {}) {
  const s = await settingsStore.load();
  const existing = id ? await db.get('contracts', id) : null;
  let saved = existing || null;

  const [machineTypes, brands, colors, governorates] = await Promise.all([
    lists.values('machineTypes'),
    lists.values('brands'),
    lists.values('colors'),
    lists.values('governorates'),
  ]);

  const nextNumber = existing ? existing.number : await settingsStore.peekNumber('contract');

  /* ----- الرأس: الرقم والصور ----- */
  const numberBox = h('div', { class: 'docnum' },
    h('span', { class: 'docnum__lbl', text: 'رقم العقد' }),
    h('b', { class: 'docnum__val', text: formatDocNumber(nextNumber) }),
    h('span', { class: 'docnum__hint', text: existing ? 'عقد محفوظ' : 'تلقائي — يكمل من آخر رقم في الدفتر' }),
  );

  const buyerPhoto = photoField({ label: 'صورة المشتري', value: existing?.buyerPhoto || null });
  const sellerPhoto = photoField({ label: 'صورة البائع', value: existing?.sellerPhoto || null });

  /* ----- التاريخ ----- */
  const dayOut = h('b', { class: 'dayout' });
  const dateW = wheelField({
    label: 'التاريخ',
    kind: 'date',
    value: existing?.date || todayISO(),
    onChange: (v) => { dayOut.textContent = dayNameFromISO(v); },
  });
  const timeW = wheelField({ label: 'الساعة', kind: 'time', value: existing?.time || nowTime() });
  dayOut.textContent = dayNameFromISO(dateW.get());

  /* ----- بيانات الآلية ----- */
  const machineType = chipField({
    label: 'نوع الآلية', options: machineTypes, value: existing?.machineType || type || machineTypes[0] || '',
    required: true, suggest: (q) => lists.similar('machineTypes', q),
  });
  const brand = chipField({
    label: 'الماركة', options: brands, value: existing?.brand || '',
    required: true, suggest: (q) => lists.similar('brands', q),
  });
  const model = wheelField({
    label: 'الموديل (سنة الصنع)', kind: 'year',
    value: existing?.model || String(new Date().getFullYear() - 2),
  });
  const color = chipField({
    label: 'اللون', options: colors, value: existing?.color || '',
    suggest: (q) => lists.similar('colors', q),
  });
  const chassis = textField({ label: 'رقم الشاصي', value: existing?.chassis || '', required: true });
  const engineNo = textField({
    label: 'رقم المحرك', value: existing?.engineNo || '',
    required: Boolean(s.engineNoRequired),
    hint: s.engineNoRequired ? null : 'اختياري — يُضبط من الإعدادات',
  });
  const plate = textField({ label: 'المرقمة (رقم اللوحة)', value: existing?.plate || '', inputmode: 'numeric' });
  const governorate = chipField({
    label: 'المحافظة', options: governorates, value: existing?.governorate || governorates[0] || '',
    suggest: (q) => lists.similar('governorates', q),
  });

  /* ----- السنوية ----- */
  const annualName = textField({ label: 'السنوية بأسم', value: existing?.annualName || '' });
  const annualAddress = textField({ label: 'عنوانه', value: existing?.annualAddress || '' });
  const sameAsSeller = h('button', {
    type: 'button', class: 'btn btn--ghost btn--sm',
    onclick: () => {
      const p = seller.get();
      if (!p.name) { toast('اكتب اسم البائع أولاً', 'warn'); return; }
      annualName.set(p.name);
      annualAddress.set(p.address);
      toast('نُقلت بيانات البائع', 'ok');
    },
  }, '↩ نفس البائع');

  /* ----- المبالغ ----- */
  const wordsOut = h('div', { class: 'words' });
  const remainOut = h('b', { class: 'remain' });

  const amount = textField({
    label: 'المبلغ (رقماً)', value: existing?.amount ? formatMoney(existing.amount) : '',
    inputmode: 'numeric', required: true,
    onInput: () => { formatMoneyInput(amount.input); recalc(); },
  });
  const paid = textField({
    label: 'وقد قبض منه', value: existing?.paid ? formatMoney(existing.paid) : '',
    inputmode: 'numeric',
    onInput: () => { formatMoneyInput(paid.input); recalc(); },
  });

  function amountValue() { return Number(digitsOnly(amount.get())) || 0; }
  function paidValue() { return Number(digitsOnly(paid.get())) || 0; }

  function recalc() {
    const a = amountValue();
    const p = Math.min(paidValue(), a);
    wordsOut.textContent = a ? amountPhrase(a) : '—';
    remainOut.textContent = `${formatMoney(a - p)} دينار`;
  }

  const notes = textArea({ label: 'الملاحظات', value: existing?.notes || '' });

  /* ----- الأطراف ----- */
  const seller = await partyBlock('بيانات البائع', existing?.seller || {});
  const buyer = await partyBlock('بيانات المشتري', existing?.buyer || {});

  /* ----- النسخ والطباعة ----- */
  const copies = copiesPicker(existing?.copies || s.defaultContractCopies);
  const actions = printActions('contract', () => saved, () => settingsStore.current(), () => copies.get());

  /* ----- الحفظ ----- */
  // ملاحظة: يُبنى على `saved` لا على `existing`، فالحفظ الثاني يحدّث العقد
  // نفسه بدل أن يحجز رقماً جديداً ويكتب سجلاً مكرّراً.
  function collect(number) {
    return {
      id: saved?.id || `c_${Date.now().toString(36)}`,
      kind: 'contract',
      number,
      date: dateW.get(),
      time: timeW.get(),
      day: dayNameFromISO(dateW.get()),
      machineType: machineType.get(),
      brand: brand.get(),
      model: model.get(),
      color: color.get(),
      chassis: chassis.get(),
      engineNo: engineNo.get(),
      plate: plate.get(),
      governorate: governorate.get(),
      annualName: annualName.get(),
      annualAddress: annualAddress.get(),
      amount: amountValue(),
      paid: Math.min(paidValue(), amountValue()),
      amountWords: amountPhrase(amountValue()),
      notes: notes.get(),
      seller: seller.get(),
      buyer: buyer.get(),
      sellerPhoto: sellerPhoto.get(),
      buyerPhoto: buyerPhoto.get(),
      copies: copies.get(),
      createdAt: saved?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }

  function validate() {
    const problems = [];
    if (!machineType.get()) problems.push('نوع الآلية');
    if (!brand.get()) problems.push('الماركة');
    if (!chassis.get()) problems.push('رقم الشاصي');
    if (s.engineNoRequired && !engineNo.get()) problems.push('رقم المحرك');
    if (!amountValue()) problems.push('المبلغ');
    if (!seller.get().name) problems.push('اسم البائع');
    if (!buyer.get().name) problems.push('اسم المشتري');
    return problems;
  }

  async function offerListAdditions() {
    const pending = [
      machineType.isCustom() ? { list: 'machineTypes', label: 'نوع الآلية', value: machineType.get() } : null,
      brand.isCustom() ? { list: 'brands', label: 'الماركة', value: brand.get() } : null,
      color.isCustom() ? { list: 'colors', label: 'اللون', value: color.get() } : null,
      governorate.isCustom() ? { list: 'governorates', label: 'المحافظة', value: governorate.get() } : null,
      ...seller.customValues(),
      ...buyer.customValues(),
    ].filter(Boolean);
    if (!pending.length) return;
    const picked = await askMulti(
      pending.length === 1
        ? `«${pending[0].value}» غير موجود في قائمة ${pending[0].label}. تريد إضافته للقائمة؟`
        : 'هذه القيم غير موجودة في القوائم. تريد إضافتها ليسهل اختيارها لاحقاً؟',
      pending,
    );
    for (const p of picked) await lists.addItem(p.list, p.value);
    if (picked.length) toast('أُضيفت للقوائم', 'ok');
  }

  const saveBtn = h('button', {
    type: 'button', class: 'btn btn--primary btn--lg',
    onclick: async () => {
      const problems = validate();
      if (problems.length) {
        toast(`أكمل: ${problems.join('، ')}`, 'error');
        return;
      }
      const number = saved ? saved.number : await settingsStore.takeNumber('contract');
      const rec = collect(number);
      await db.put('contracts', rec);
      saved = rec;
      numberBox.querySelector('.docnum__val').textContent = formatDocNumber(number);
      numberBox.querySelector('.docnum__hint').textContent = 'محفوظ';
      saveBtn.textContent = '💾 حفظ التعديلات';

      // تغذية القوائم ودفتر الزبائن بما استُعمل فعلاً.
      await Promise.all([
        lists.bump('machineTypes', rec.machineType),
        lists.bump('brands', rec.brand),
        lists.bump('colors', rec.color),
        lists.bump('governorates', rec.governorate),
        lists.bump('offices', rec.seller.office),
        lists.bump('offices', rec.buyer.office),
        customers.upsert(rec.seller),
        customers.upsert(rec.buyer),
      ]);

      toast(`حُفظ العقد رقم ${formatDocNumber(number)}`, 'ok');
      await offerListAdditions();
      actions.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }, existing ? '💾 حفظ التعديلات' : '💾 حفظ العقد');

  recalc();

  root.textContent = '';
  root.append(
    h('div', { class: 'screen' },
      h('header', { class: 'screen__head' },
        h('h1', { class: 'screen__title', text: existing ? 'تعديل عقد' : 'عقد بيع جديد' }),
        numberBox,
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'الصور والتاريخ' }),
        h('div', { class: 'grid grid--2' }, buyerPhoto.el, sellerPhoto.el),
        h('div', { class: 'grid grid--2' }, dateW.el, timeW.el),
        h('div', { class: 'field' }, h('label', { class: 'field__label', text: 'اليوم' }), h('div', { class: 'readout' }, dayOut)),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'بيانات الآلية' }),
        machineType.el, brand.el,
        h('div', { class: 'grid grid--2' }, model.el, color.el),
        h('div', { class: 'grid grid--2' }, chassis.el, engineNo.el),
        h('div', { class: 'grid grid--2' }, plate.el, governorate.el),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'السنوية' }),
        h('div', { class: 'row-actions' }, sameAsSeller),
        h('div', { class: 'grid grid--2' }, annualName.el, annualAddress.el),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'المبالغ' }),
        h('div', { class: 'grid grid--2' }, amount.el, paid.el),
        h('div', { class: 'field' },
          h('label', { class: 'field__label', text: 'المبلغ كتابةً (تلقائي)' }),
          h('div', { class: 'readout' }, wordsOut),
        ),
        h('div', { class: 'field' },
          h('label', { class: 'field__label', text: 'والباقي (تلقائي)' }),
          h('div', { class: 'readout' }, remainOut),
        ),
        notes.el,
      ),

      seller.el,
      buyer.el,

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'الطباعة' }),
        copies.el,
        actions,
      ),

      h('div', { class: 'savebar' }, saveBtn),
    ),
  );
}
