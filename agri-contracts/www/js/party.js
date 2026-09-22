// كتلة بيانات طرف (بائع/مشتري): الهوية تقرّر أي الحقول تظهر.

import { chipField, h, textField } from './ui.js';
import * as lists from './lists.js';
import * as customers from './customers.js';

export async function partyBlock(title, initial = {}, { onNameChosen = null } = {}) {
  const offices = await lists.values('offices');

  const name = textField({
    label: 'الاسم',
    value: initial.name || '',
    required: true,
    suggest: async (q) => (await customers.search(q)).map((c) => ({ label: `${c.name}${c.mobile ? ` — ${c.mobile}` : ''}`, rec: c })),
    onPick: (item) => {
      fill(item.rec);
      if (onNameChosen) onNameChosen(item.rec);
    },
    hint: 'اكتب أول حرفين — إن كان زبوناً سابقاً تظهر بياناته كاملة.',
  });

  const idType = chipField({
    label: 'نوع الهوية',
    options: lists.ID_TYPES.map((t) => t.value),
    value: initial.idType || lists.ID_TYPES[0].value,
    allowOther: false,
    onChange: () => paintIdFields(),
  });

  const idNumber = textField({ label: 'رقم البطاقة', value: initial.idNumber || '', inputmode: 'numeric' });
  const record = textField({ label: 'السجل', value: initial.record || '', inputmode: 'numeric' });
  const page = textField({ label: 'الصفحة', value: initial.page || '', inputmode: 'numeric' });
  const idBox = h('div', { class: 'grid grid--2' });

  function paintIdFields() {
    idBox.textContent = '';
    if (idType.get() === 'هوية أحوال قديمة') idBox.append(record.el, page.el);
    else idBox.append(idNumber.el);
  }
  paintIdFields();

  const office = chipField({
    label: 'الدائرة',
    options: offices,
    value: initial.office || '',
    suggest: (q) => lists.similar('offices', q),
  });
  const address = textField({ label: 'العنوان', value: initial.address || '' });
  const mobile = textField({ label: 'الموبايل', value: initial.mobile || '', type: 'tel', inputmode: 'tel' });

  function fill(c) {
    name.set(c.name);
    if (c.idType) idType.set(c.idType);
    paintIdFields();
    idNumber.set(c.idNumber);
    record.set(c.record);
    page.set(c.page);
    if (c.office) office.set(c.office);
    address.set(c.address);
    mobile.set(c.mobile);
  }

  const el = h('section', { class: 'card' },
    h('h2', { class: 'card__title', text: title }),
    name.el,
    idType.el,
    idBox,
    office.el,
    h('div', { class: 'grid grid--2' }, address.el, mobile.el),
  );

  return {
    el,
    fill,
    get: () => ({
      name: name.get(),
      idType: idType.get(),
      idNumber: idType.get() === 'هوية أحوال قديمة' ? '' : idNumber.get(),
      record: idType.get() === 'هوية أحوال قديمة' ? record.get() : '',
      page: idType.get() === 'هوية أحوال قديمة' ? page.get() : '',
      office: office.get(),
      address: address.get(),
      mobile: mobile.get(),
    }),
    customValues: () => (office.isCustom() ? [{ list: 'offices', label: 'الدائرة', value: office.get() }] : []),
  };
}
