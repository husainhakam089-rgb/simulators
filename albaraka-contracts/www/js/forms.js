/* لبنات بناء الشاشات: الحقول والأقسام وبيانات الطرفين */
const F = (() => {
  const { el } = U;

  const section = (title, ...children) =>
    el('section', { class: 'card' }, title ? el('h2', { class: 'card-title', text: title }) : null, ...children);

  const field = (label, control, hint) =>
    el('div', { class: 'field' },
      label ? el('label', { class: 'field-label', text: label }) : null,
      control,
      hint ? el('small', { class: 'field-hint', text: hint }) : null);

  function textInput({ value = '', placeholder = '', inputmode, ltr = false, onInput, multiline = false } = {}) {
    const node = multiline
      ? el('textarea', { class: 'input area', placeholder, rows: 3 })
      : el('input', { class: `input${ltr ? ' ltr' : ''}`, type: 'text', placeholder, inputmode: inputmode || null });
    node.value = value || '';
    node.addEventListener('input', () => onInput?.(node.value));
    return node;
  }

  /* حقل مبلغ: يعرض الرقم مفصولاً بالفواصل ويُرجع رقماً صافياً */
  function moneyInput({ value = 0, onInput, placeholder = '0' } = {}) {
    const node = el('input', { class: 'input money ltr', type: 'text', inputmode: 'numeric', placeholder });
    const show = (v) => { node.value = v ? U.fmtMoney(v) : ''; };
    show(value);
    node.addEventListener('input', () => {
      const raw = U.num(node.value);
      const pos = node.selectionStart;
      const before = node.value.length;
      show(raw);
      const after = node.value.length;
      node.setSelectionRange(Math.max(0, pos + (after - before)), Math.max(0, pos + (after - before)));
      onInput?.(raw);
    });
    return { node, set: (v) => show(v) };
  }

  /* زر يفتح العجلة الدوارة */
  function wheelButton({ text, onclick }) {
    const btn = el('button', { class: 'input picker', type: 'button', onclick });
    btn.textContent = text;
    return btn;
  }

  const chipsField = (label, type, value, onChange, opts = {}) => {
    const box = el('div');
    const api = UI.chips(box, { type, value, onChange, ...opts });
    const wrap = field(label, box);
    wrap.api = api;
    return wrap;
  };

  /* بيانات طرف (بائع أو مشتري): نوع الهوية يقرر أي الحقول تظهر */
  function partyBlock(title, person, onChange) {
    const idFields = el('div', { class: 'id-fields' });

    const drawIdFields = () => {
      idFields.innerHTML = '';
      if (person.idType === 'هوية أحوال قديمة') {
        idFields.append(el('div', { class: 'two-col' },
          field('السجل', textInput({
            value: person.recordNo, inputmode: 'numeric', ltr: true,
            onInput: (v) => { person.recordNo = v; onChange?.(person); },
          })),
          field('الصفحة', textInput({
            value: person.pageNo, inputmode: 'numeric', ltr: true,
            onInput: (v) => { person.pageNo = v; onChange?.(person); },
          }))));
      } else if (person.idType) {
        idFields.append(field('رقم البطاقة', textInput({
          value: person.idNumber, inputmode: 'numeric', ltr: true,
          onInput: (v) => { person.idNumber = v; onChange?.(person); },
        })));
      }
    };

    const nameInput = textInput({
      value: person.name, placeholder: 'الاسم الثلاثي',
      onInput: (v) => { person.name = v; onChange?.(person); },
    });
    const nameWrap = el('div', { class: 'suggest-wrap' }, nameInput);

    const idTypeBox = el('div');
    const officeBox = el('div');
    const addressInput = textInput({
      value: person.address, onInput: (v) => { person.address = v; onChange?.(person); },
    });
    const mobileInput = textInput({
      value: person.mobile, inputmode: 'tel', ltr: true, placeholder: '07xx xxx xxxx',
      onInput: (v) => { person.mobile = v; onChange?.(person); },
    });

    const idTypeApi = UI.chips(idTypeBox, {
      type: 'idType', value: person.idType, allowOther: false,
      onChange: (v) => { person.idType = v; drawIdFields(); onChange?.(person); },
    });
    const officeApi = UI.chips(officeBox, {
      type: 'office', value: person.office,
      onChange: (v) => { person.office = v; onChange?.(person); },
    });

    /* اقتراح زبون سابق: يملأ البيانات كلها بدل إعادة إدخالها */
    UI.customerSuggest(nameInput, (row) => {
      Object.assign(person, {
        name: row.name, idType: row.idType, idNumber: row.idNumber, recordNo: row.recordNo,
        pageNo: row.pageNo, office: row.office, address: row.address, mobile: row.mobile,
      });
      nameInput.value = person.name || '';
      addressInput.value = person.address || '';
      mobileInput.value = person.mobile || '';
      idTypeApi.value = person.idType || '';
      officeApi.value = person.office || '';
      drawIdFields();
      onChange?.(person);
      UI.toast('عُبّئت بيانات الزبون');
    });

    drawIdFields();

    return section(title,
      field('الاسم', nameWrap, 'اكتب حرفين ليظهر الزبون السابق'),
      field('نوع الهوية', idTypeBox),
      idFields,
      field('الدائرة', officeBox),
      field('العنوان', addressInput),
      field('الموبايل', mobileInput));
  }

  const actionsBar = (...buttons) => el('div', { class: 'actions-bar' }, ...buttons);

  const button = (label, { kind = 'ghost', onclick, id } = {}) =>
    el('button', { class: `btn ${kind}`, type: 'button', onclick, id }, label);

  return { section, field, textInput, moneyInput, wheelButton, chipsField, partyBlock, actionsBar, button };
})();
