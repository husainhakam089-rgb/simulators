// شاشة الوصل الصغير — نفس منطق العقد بحقول أقل، ويُطبع على نصف ورقة A4.

import * as db from './db.js';
import * as lists from './lists.js';
import * as settingsStore from './settings.js';
import * as customers from './customers.js';
import { amountPhrase } from './tafqeet.js';
import { copiesPicker, printActions } from './docactions.js';
import { askMulti, chipField, h, textArea, textField, toast, wheelField } from './ui.js';
import { dayNameFromISO, digitsOnly, formatDocNumber, formatMoney, formatMoneyInput, nowTime, todayISO } from './util.js';

export async function render(root, { id = null, tool = '' } = {}) {
  const s = await settingsStore.load();
  const existing = id ? await db.get('receipts', id) : null;
  let saved = existing || null;

  const tools = await lists.values('tools');
  const nextNumber = existing ? existing.number : await settingsStore.peekNumber('receipt');

  const numberBox = h('div', { class: 'docnum' },
    h('span', { class: 'docnum__lbl', text: 'رقم الوصل' }),
    h('b', { class: 'docnum__val', text: formatDocNumber(nextNumber) }),
    h('span', { class: 'docnum__hint', text: existing ? 'وصل محفوظ' : 'تلقائي' }),
  );

  const dayOut = h('b', { class: 'dayout' });
  const dateW = wheelField({
    label: 'التاريخ', kind: 'date', value: existing?.date || todayISO(),
    onChange: (v) => { dayOut.textContent = dayNameFromISO(v); },
  });
  const timeW = wheelField({ label: 'الساعة', kind: 'time', value: existing?.time || nowTime() });
  dayOut.textContent = dayNameFromISO(dateW.get());

  const toolField = chipField({
    label: 'نوع الأداة', options: tools, value: existing?.tool || tool || '',
    required: true, suggest: (q) => lists.similar('tools', q),
  });
  const qty = textField({ label: 'العدد', value: existing?.qty || '1', inputmode: 'numeric' });

  const buyerName = textField({
    label: 'اسم المشتري', value: existing?.buyerName || '', required: true,
    suggest: async (q) => (await customers.search(q)).map((c) => ({ label: `${c.name}${c.mobile ? ` — ${c.mobile}` : ''}`, rec: c })),
    onPick: (item) => { buyerName.set(item.rec.name); mobile.set(item.rec.mobile); },
    hint: 'اكتب أول حرفين — إن كان زبوناً سابقاً يظهر اسمه وموبايله.',
  });
  const mobile = textField({ label: 'الموبايل', value: existing?.mobile || '', type: 'tel', inputmode: 'tel' });

  const wordsOut = h('div', { class: 'words' });
  const amount = textField({
    label: 'المبلغ (رقماً)', value: existing?.amount ? formatMoney(existing.amount) : '',
    inputmode: 'numeric', required: true,
    onInput: () => { formatMoneyInput(amount.input); recalc(); },
  });
  function amountValue() { return Number(digitsOnly(amount.get())) || 0; }
  function recalc() {
    const a = amountValue();
    wordsOut.textContent = a ? amountPhrase(a) : '—';
  }

  const notes = textArea({ label: 'ملاحظات', value: existing?.notes || '', rows: 2 });

  const copies = copiesPicker(existing?.copies || s.defaultReceiptCopies);
  const actions = printActions('receipt', () => saved, () => settingsStore.current(), () => copies.get());

  const perPage = chipField({
    label: 'توزيع الورقة',
    options: ['وصل واحد في الورقة', 'وصلان في الورقة مع خط قص'],
    value: Number(s.receiptsPerPage) === 2 ? 'وصلان في الورقة مع خط قص' : 'وصل واحد في الورقة',
    allowOther: false,
    onChange: (v) => settingsStore.save({ receiptsPerPage: v.startsWith('وصلان') ? 2 : 1 }),
  });

  // كما في العقد: `saved` لا `existing`، كي لا يحرق الحفظ الثاني رقم وصل.
  function collect(number) {
    return {
      id: saved?.id || `r_${Date.now().toString(36)}`,
      kind: 'receipt',
      number,
      date: dateW.get(),
      time: timeW.get(),
      day: dayNameFromISO(dateW.get()),
      tool: toolField.get(),
      qty: qty.get(),
      buyerName: buyerName.get(),
      mobile: mobile.get(),
      amount: amountValue(),
      amountWords: amountPhrase(amountValue()),
      notes: notes.get(),
      copies: copies.get(),
      createdAt: saved?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }

  const saveBtn = h('button', {
    type: 'button', class: 'btn btn--primary btn--lg',
    onclick: async () => {
      const problems = [];
      if (!toolField.get()) problems.push('نوع الأداة');
      if (!buyerName.get()) problems.push('اسم المشتري');
      if (!amountValue()) problems.push('المبلغ');
      if (problems.length) {
        toast(`أكمل: ${problems.join('، ')}`, 'error');
        return;
      }
      const number = saved ? saved.number : await settingsStore.takeNumber('receipt');
      const rec = collect(number);
      await db.put('receipts', rec);
      saved = rec;
      numberBox.querySelector('.docnum__val').textContent = formatDocNumber(number);
      numberBox.querySelector('.docnum__hint').textContent = 'محفوظ';
      saveBtn.textContent = '💾 حفظ التعديلات';

      await Promise.all([
        lists.bump('tools', rec.tool),
        customers.upsert({ name: rec.buyerName, mobile: rec.mobile }),
      ]);

      toast(`حُفظ الوصل رقم ${formatDocNumber(number)}`, 'ok');

      if (toolField.isCustom()) {
        const picked = await askMulti(
          `«${toolField.get()}» غير موجود في قائمة الأدوات. تريد إضافته للقائمة؟`,
          [{ list: 'tools', label: 'الأدوات', value: toolField.get() }],
        );
        for (const p of picked) await lists.addItem(p.list, p.value);
      }
      actions.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }, existing ? '💾 حفظ التعديلات' : '💾 حفظ الوصل');

  recalc();

  root.textContent = '';
  root.append(
    h('div', { class: 'screen' },
      h('header', { class: 'screen__head' },
        h('h1', { class: 'screen__title', text: existing ? 'تعديل وصل' : 'وصل جديد' }),
        numberBox,
      ),
      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'المادة' }),
        toolField.el,
        h('div', { class: 'grid grid--2' }, qty.el, amount.el),
        h('div', { class: 'field' },
          h('label', { class: 'field__label', text: 'المبلغ كتابةً (تلقائي)' }),
          h('div', { class: 'readout' }, wordsOut),
        ),
      ),
      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'المشتري والتاريخ' }),
        h('div', { class: 'grid grid--2' }, buyerName.el, mobile.el),
        h('div', { class: 'grid grid--2' }, dateW.el, timeW.el),
        h('div', { class: 'field' }, h('label', { class: 'field__label', text: 'اليوم' }), h('div', { class: 'readout' }, dayOut)),
        notes.el,
      ),
      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'الطباعة' }),
        copies.el,
        perPage.el,
        actions,
      ),
      h('div', { class: 'savebar' }, saveBtn),
    ),
  );
}
