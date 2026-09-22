// مكوّنات الواجهة: كبسولات، عجلة دوارة، اقتراح، أوراق منزلقة، تنبيهات.

import { escapeHtml, fileToDataURL, pad, rankSimilar } from './util.js';

/** بنّاء عناصر مختصر. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

let toastTimer = null;
export function toast(message, kind = 'info') {
  let box = qs('#toast');
  if (!box) {
    box = h('div', { id: 'toast', class: 'toast' });
    document.body.append(box);
  }
  box.className = `toast toast--${kind} is-on`;
  box.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('is-on'), 2800);
}

/* ---------- ورقة منزلقة (Sheet) ---------- */

export function sheet({ title, body, actions = [], onClose } = {}) {
  const panel = h('div', { class: 'sheet__panel', role: 'dialog', 'aria-modal': 'true' });
  const overlay = h('div', { class: 'sheet' }, panel);

  const close = (result) => {
    overlay.classList.remove('is-on');
    setTimeout(() => overlay.remove(), 180);
    if (onClose) onClose(result);
  };

  panel.append(
    h('div', { class: 'sheet__head' },
      h('h3', { class: 'sheet__title', text: title || '' }),
      h('button', { class: 'sheet__x', type: 'button', 'aria-label': 'إغلاق', onclick: () => close(null) }, '×'),
    ),
  );
  const content = h('div', { class: 'sheet__body' });
  if (body) content.append(body);
  panel.append(content);

  if (actions.length) {
    panel.append(
      h('div', { class: 'sheet__actions' },
        actions.map((a) =>
          h('button', {
            type: 'button',
            class: `btn ${a.kind ? `btn--${a.kind}` : ''}`,
            onclick: () => a.onClick(close),
          }, a.label),
        ),
      ),
    );
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close(null);
  });
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-on'));
  return { close, content, panel };
}

/** سؤال نعم/لا. */
export function ask(message, { yes = 'نعم', no = 'لا', title = 'تأكيد' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const s = sheet({
      title,
      body: h('p', { class: 'ask__msg', text: message }),
      actions: [
        { label: no, kind: 'ghost', onClick: (close) => { answered = true; close(); resolve(false); } },
        { label: yes, kind: 'primary', onClick: (close) => { answered = true; close(); resolve(true); } },
      ],
      onClose: () => { if (!answered) resolve(false); },
    });
    void s;
  });
}

/** اختيار متعدد بمربعات — يُستعمل لسؤال «تريد إضافته للقائمة؟». */
export function askMulti(message, options, { title = 'إضافة للقوائم', yes = 'أضف المحدّد', no = 'لا، هذه المرة فقط' } = {}) {
  return new Promise((resolve) => {
    const boxes = options.map((o) =>
      h('label', { class: 'checkrow' },
        h('input', { type: 'checkbox', checked: true, dataset: { value: o.value, list: o.list } }),
        h('span', {}, `${o.label}: `, h('b', { text: o.value })),
      ),
    );
    let answered = false;
    sheet({
      title,
      body: h('div', {}, h('p', { class: 'ask__msg', text: message }), ...boxes),
      actions: [
        { label: no, kind: 'ghost', onClick: (close) => { answered = true; close(); resolve([]); } },
        {
          label: yes,
          kind: 'primary',
          onClick: (close) => {
            answered = true;
            const picked = boxes
              .filter((b) => b.querySelector('input').checked)
              .map((b) => {
                const i = b.querySelector('input');
                return { list: i.dataset.list, value: i.dataset.value };
              });
            close();
            resolve(picked);
          },
        },
      ],
      onClose: () => { if (!answered) resolve([]); },
    });
  });
}

/* ---------- حقل الكبسولات ---------- */

const MAX_CHIPS = 9; // فوق هذا العدد تُعرض الأكثر استعمالاً وزر «المزيد»

/**
 * حقل اختيار بالكبسولات مع «أخرى» وبحث عند كثرة الخيارات.
 * @returns {{el: HTMLElement, get: () => string, set: (v: string) => void, isCustom: () => boolean}}
 */
export function chipField({
  label,
  options = [],
  value = '',
  allowOther = true,
  otherLabel = 'أخرى',
  suggest = null, // (query) => Promise<string[]>
  onChange = null,
  required = false,
}) {
  let current = value || '';
  let custom = Boolean(current) && !options.some((o) => o === current);

  const chipWrap = h('div', { class: 'chips' });
  const field = h('div', { class: 'field' },
    h('label', { class: 'field__label' }, label, required ? h('span', { class: 'req', text: ' *' }) : null),
    chipWrap,
  );

  function setValue(v, isCustom = false) {
    current = v;
    custom = isCustom;
    render();
    if (onChange) onChange(current, custom);
  }

  function openMore() {
    const search = h('input', { class: 'input', type: 'search', placeholder: 'ابحث…', inputmode: 'search' });
    const list = h('div', { class: 'picklist' });
    const s = sheet({ title: label, body: h('div', {}, search, list) });
    const paint = (q) => {
      list.textContent = '';
      const filtered = q ? rankSimilar(q, options, { min: 0.3, limit: 50 }) : options;
      const shown = filtered.length ? filtered : options;
      for (const o of shown) {
        list.append(h('button', {
          type: 'button',
          class: `picklist__item ${o === current ? 'is-on' : ''}`,
          onclick: () => { s.close(); setValue(o, false); },
        }, o));
      }
      if (!shown.length) list.append(h('p', { class: 'muted', text: 'لا يوجد' }));
    };
    search.addEventListener('input', () => paint(search.value));
    paint('');
    setTimeout(() => search.focus(), 80);
  }

  function openOther() {
    const input = h('input', { class: 'input', type: 'text', value: custom ? current : '', placeholder: `اكتب ${label}` });
    const hint = h('div', { class: 'suggest' });
    const s = sheet({
      title: `${label} — إدخال حر`,
      body: h('div', {}, input, hint),
      actions: [
        {
          label: 'تأكيد',
          kind: 'primary',
          onClick: (close) => {
            const v = input.value.trim();
            if (!v) return;
            close();
            setValue(v, !options.some((o) => o === v));
          },
        },
      ],
    });
    const paintHints = async () => {
      const q = input.value.trim();
      hint.textContent = '';
      if (!q) return;
      const matches = suggest ? await suggest(q) : rankSimilar(q, options, { limit: 5 });
      const fresh = matches.filter((m) => m !== q);
      if (!fresh.length) return;
      hint.append(h('div', { class: 'suggest__title', text: 'موجود مسبقاً — اختر بدل الكتابة:' }));
      for (const m of fresh) {
        hint.append(h('button', {
          type: 'button',
          class: 'chip chip--suggest',
          onclick: () => { s.close(); setValue(m, false); },
        }, m));
      }
    };
    input.addEventListener('input', paintHints);
    paintHints();
    setTimeout(() => input.focus(), 80);
  }

  function render() {
    chipWrap.textContent = '';
    const many = options.length > MAX_CHIPS;
    const shown = many ? options.slice(0, MAX_CHIPS - 1) : options;
    const inShown = shown.includes(current);

    for (const o of shown) {
      chipWrap.append(h('button', {
        type: 'button',
        class: `chip ${o === current ? 'is-on' : ''}`,
        onclick: () => setValue(o, false),
      }, o));
    }
    // القيمة المختارة من «المزيد» تبقى ظاهرة ولو لم تكن ضمن الأكثر استعمالاً.
    if (current && !inShown && !custom) {
      chipWrap.append(h('button', { type: 'button', class: 'chip is-on', onclick: () => setValue('', false) }, current));
    }
    if (many) {
      chipWrap.append(h('button', { type: 'button', class: 'chip chip--more', onclick: openMore }, 'المزيد…'));
    }
    if (custom && current) {
      chipWrap.append(h('button', { type: 'button', class: 'chip is-on chip--custom', onclick: openOther }, current));
    }
    if (allowOther) {
      chipWrap.append(h('button', { type: 'button', class: 'chip chip--other', onclick: openOther }, otherLabel));
    }
  }

  render();
  return {
    el: field,
    get: () => current,
    set: (v) => setValue(v, Boolean(v) && !options.includes(v)),
    isCustom: () => custom && Boolean(current),
    refresh: (newOptions) => { options = newOptions; render(); },
  };
}

/* ---------- العجلة الدوارة ---------- */

const ITEM_H = 40;

function wheelColumn(values, initialIndex, onPick) {
  const list = h('div', { class: 'wheel__list' },
    values.map((v, i) => h('div', { class: 'wheel__item', dataset: { i } }, v)),
  );
  const col = h('div', { class: 'wheel__col' }, list);

  const mark = (idx) => {
    list.querySelectorAll('.wheel__item').forEach((el, i) => el.classList.toggle('is-on', i === idx));
  };

  let raf = null;
  col.addEventListener('scroll', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const idx = Math.max(0, Math.min(values.length - 1, Math.round(col.scrollTop / ITEM_H)));
      mark(idx);
      onPick(idx);
    });
  });

  const goto = (idx, smooth = false) => {
    col.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
    mark(idx);
  };
  // الانتقال للقيمة الافتتاحية بعد دخول العنصر في الصفحة.
  requestAnimationFrame(() => goto(initialIndex));
  return { el: col, goto, mark };
}

/**
 * حقل عجلة: تاريخ / وقت / سنة. يفتح على القيمة الأكثر احتمالاً ويقبل الكتابة.
 */
export function wheelField({ label, kind = 'date', value, onChange, hint }) {
  let current = value;
  const display = h('button', { type: 'button', class: 'wheelbtn', onclick: open });
  const hintEl = hint ? h('div', { class: 'field__hint', text: hint }) : null;
  const field = h('div', { class: 'field' },
    h('label', { class: 'field__label', text: label }),
    display,
    hintEl,
  );

  const now = new Date();
  const YEAR_MIN = 1970;
  const YEAR_MAX = now.getFullYear() + 1;

  function paint() {
    display.textContent = formatFor(kind, current);
  }

  function set(v) {
    current = v;
    paint();
    if (onChange) onChange(current);
  }

  function open() {
    const cols = h('div', { class: 'wheel' });
    const manual = h('input', { class: 'input wheel__manual', type: 'text', value: current, placeholder: 'أو اكتب مباشرة' });
    let draft = current;

    if (kind === 'year') {
      const years = [];
      for (let y = YEAR_MAX; y >= YEAR_MIN; y--) years.push(String(y));
      const start = Math.max(0, years.indexOf(String(current || now.getFullYear())));
      const c = wheelColumn(years, start, (i) => { draft = years[i]; manual.value = draft; });
      cols.append(c.el);
    } else if (kind === 'time') {
      const hours = Array.from({ length: 24 }, (_, i) => pad(i));
      const mins = Array.from({ length: 60 }, (_, i) => pad(i));
      const [hh, mm] = String(current || '00:00').split(':');
      let H = hours.indexOf(pad(Number(hh) || 0));
      let M = mins.indexOf(pad(Number(mm) || 0));
      const sync = () => { draft = `${hours[H]}:${mins[M]}`; manual.value = draft; };
      // ترتيب الأعمدة في RTL: الساعة ثم الدقيقة.
      const ch = wheelColumn(hours, H, (i) => { H = i; sync(); });
      const cm = wheelColumn(mins, M, (i) => { M = i; sync(); });
      cols.append(ch.el, h('div', { class: 'wheel__sep', text: ':' }), cm.el);
    } else {
      const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(current || '') || [];
      const years = [];
      for (let y = YEAR_MAX; y >= 1990; y--) years.push(String(y));
      const months = Array.from({ length: 12 }, (_, i) => pad(i + 1));
      const days = Array.from({ length: 31 }, (_, i) => pad(i + 1));
      let Y = Math.max(0, years.indexOf(d[1] || String(now.getFullYear())));
      let M = Math.max(0, months.indexOf(d[2] || pad(now.getMonth() + 1)));
      let D = Math.max(0, days.indexOf(d[3] || pad(now.getDate())));
      const sync = () => {
        // ضبط اليوم إن تجاوز عدد أيام الشهر.
        const dim = new Date(Number(years[Y]), Number(months[M]), 0).getDate();
        if (Number(days[D]) > dim) D = dim - 1;
        draft = `${years[Y]}-${months[M]}-${days[D]}`;
        manual.value = draft;
      };
      const cd = wheelColumn(days, D, (i) => { D = i; sync(); });
      const cm = wheelColumn(months, M, (i) => { M = i; sync(); });
      const cy = wheelColumn(years, Y, (i) => { Y = i; sync(); });
      cols.append(cd.el, cm.el, cy.el);
    }

    manual.addEventListener('change', () => { draft = manual.value.trim(); });

    sheet({
      title: label,
      body: h('div', { class: 'wheelbox' },
        h('div', { class: 'wheel__frame' }, cols),
        manual,
      ),
      actions: [
        { label: 'تأكيد', kind: 'primary', onClick: (close) => { close(); set(draft); } },
      ],
    });
  }

  paint();
  return { el: field, get: () => current, set, display };
}

function formatFor(kind, v) {
  if (!v) return '—';
  if (kind === 'date') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? `${m[3]} / ${m[2]} / ${m[1]}` : v;
  }
  return v;
}

/* ---------- حقل نصي مع اقتراح ---------- */

export function textField({ label, value = '', placeholder = '', type = 'text', inputmode, required = false, suggest = null, onPick = null, onInput = null, hint = null }) {
  const input = h('input', { class: 'input', type, value, placeholder, inputmode });
  const box = h('div', { class: 'suggest' });
  const hintEl = hint ? h('div', { class: 'field__hint', text: hint }) : null;
  const field = h('div', { class: 'field' },
    h('label', { class: 'field__label' }, label, required ? h('span', { class: 'req', text: ' *' }) : null),
    input,
    box,
    hintEl,
  );

  let timer = null;
  input.addEventListener('input', () => {
    if (onInput) onInput(input.value);
    if (!suggest) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      box.textContent = '';
      if (q.length < 2) return;
      const results = await suggest(q);
      for (const r of results) {
        box.append(h('button', {
          type: 'button',
          class: 'chip chip--suggest',
          onclick: () => {
            box.textContent = '';
            if (onPick) onPick(r);
            else input.value = typeof r === 'string' ? r : r.label;
          },
        }, typeof r === 'string' ? r : r.label));
      }
    }, 160);
  });

  return {
    el: field,
    input,
    get: () => input.value.trim(),
    set: (v) => { input.value = v == null ? '' : v; box.textContent = ''; },
    clearSuggest: () => { box.textContent = ''; },
  };
}

export function textArea({ label, value = '', placeholder = '', rows = 3 }) {
  const ta = h('textarea', { class: 'input input--area', rows, placeholder }, value);
  const field = h('div', { class: 'field' },
    h('label', { class: 'field__label', text: label }),
    ta,
  );
  return { el: field, get: () => ta.value.trim(), set: (v) => { ta.value = v || ''; } };
}

/* ---------- صورة (كاميرا أو معرض) ---------- */

export function photoField({ label, value = null, onChange = null }) {
  let data = value;
  const preview = h('div', { class: 'photo__preview' });
  const input = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hidden' });
  const pick = h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => input.click() }, '📷 التقاط / اختيار');
  const clear = h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => set(null) }, 'مسح');

  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    try {
      set(await fileToDataURL(f, 900, 0.8));
    } catch (err) {
      toast(err.message || 'تعذّر قراءة الصورة', 'error');
    }
    input.value = '';
  });

  function set(v) {
    data = v;
    preview.innerHTML = data
      ? `<img src="${escapeHtml(data)}" alt="">`
      : '<span class="photo__empty">لا توجد صورة</span>';
    clear.style.display = data ? '' : 'none';
    if (onChange) onChange(data);
  }

  const field = h('div', { class: 'field photo' },
    h('label', { class: 'field__label', text: label }),
    preview,
    h('div', { class: 'photo__btns' }, pick, clear, input),
  );
  set(data);
  return { el: field, get: () => data, set };
}
