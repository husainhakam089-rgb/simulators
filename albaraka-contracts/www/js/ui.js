/* عناصر الواجهة المشتركة: الكبسولات، العجلة الدوارة، الأوراق المنبثقة، الصور */
const UI = (() => {
  const { el, $, $$ } = U;

  /* ----- تنبيه سريع ----- */
  let toastTimer = null;
  function toast(message, kind = 'info') {
    let box = $('#toast');
    if (!box) { box = el('div', { id: 'toast' }); document.body.append(box); }
    box.className = `toast show ${kind}`;
    box.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('show'), 2600);
  }

  /* ----- ورقة منبثقة من الأسفل ----- */
  function sheet({ title, body, actions = [], onOpen }) {
    return new Promise((resolve) => {
      const close = (value) => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 180);
        document.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = (e) => { if (e.key === 'Escape') close(null); };

      const panel = el('div', { class: 'sheet' },
        el('div', { class: 'sheet-grip' }),
        title ? el('h3', { class: 'sheet-title', text: title }) : null,
        el('div', { class: 'sheet-body' }, body),
        actions.length
          ? el('div', { class: 'sheet-actions' },
            actions.map((a) => el('button', {
              class: `btn ${a.kind || 'ghost'}`,
              type: 'button',
              onclick: () => close(a.value === undefined ? true : a.value),
            }, a.label)))
          : null,
      );
      const overlay = el('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) close(null); } }, panel);
      document.body.append(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));
      document.addEventListener('keydown', onKey);
      onOpen?.(panel, close);
    });
  }

  const confirmBox = (message, { yes = 'نعم', no = 'لا', title = '' } = {}) =>
    sheet({
      title, body: el('p', { class: 'sheet-text', text: message }),
      actions: [{ label: no, value: false }, { label: yes, kind: 'primary', value: true }],
    }).then((v) => v === true);

  const alertBox = (message, title = '') =>
    sheet({ title, body: el('p', { class: 'sheet-text', text: message }), actions: [{ label: 'حسناً', kind: 'primary' }] });

  /* ----- الكبسولات ----- */
  /* القوائم تكبر مع الاستعمال: تُعرض الأكثر استعمالاً، والباقي خلف زر "المزيد" */
  const PENDING = [];               // قيم جديدة تُعرض على المستخدم بعد الحفظ
  const queuePending = (type, value) => {
    const key = U.normalizeAr(value);
    if (!key) return;
    if (!PENDING.some((p) => p.type === type && U.normalizeAr(p.value) === key)) PENDING.push({ type, value });
  };

  /* بعد حفظ العقد: يسأل مرة واحدة عن كل القيم الجديدة */
  async function flushPending() {
    if (!PENDING.length) return;
    const items = PENDING.splice(0, PENDING.length);
    const boxes = items.map((it) => {
      const cb = el('input', { type: 'checkbox', checked: true });
      cb.dataset.type = it.type; cb.dataset.value = it.value;
      return el('label', { class: 'check-row' }, cb,
        el('span', {}, `${it.value} — ${DB.LIST_TYPES[it.type] || it.type}`));
    });
    const ok = await sheet({
      title: 'تريد إضافتها للقائمة؟',
      body: el('div', {},
        el('p', { class: 'sheet-text', text: 'القيم التالية كُتبت يدوياً في هذا المستند. إضافتها تجعلها خياراً جاهزاً في المرات القادمة.' }),
        el('div', { class: 'check-list' }, boxes)),
      actions: [{ label: 'لا، تبقى هنا فقط', value: false }, { label: 'نعم، أضفها', kind: 'primary', value: true }],
      onOpen: (panel) => { panel.dataset.pending = '1'; },
    });
    if (!ok) return;
    for (const label of boxes) {
      const cb = label.querySelector('input');
      if (cb.checked) await DB.addListItem(cb.dataset.type, cb.dataset.value);
    }
    toast('أُضيفت للقائمة');
  }

  /* حقل كبسولات مرتبط بنوع قائمة */
  function chips(container, { type, value = '', onChange, allowOther = true, visible = 10, placeholder = 'اكتب القيمة' }) {
    const state = { value };
    container.classList.add('chips');

    async function render() {
      const rows = await DB.listItems(type);
      container.innerHTML = '';
      const isKnown = rows.some((r) => U.normalizeAr(r.value) === U.normalizeAr(state.value));
      const shown = rows.slice(0, visible);
      /* القيمة المكتوبة يدوياً تبقى ظاهرة ككبسولة مختارة */
      if (state.value && !shown.some((r) => U.normalizeAr(r.value) === U.normalizeAr(state.value))) {
        shown.unshift({ id: 'custom', value: state.value, custom: !isKnown });
      }
      for (const row of shown) {
        const active = U.normalizeAr(row.value) === U.normalizeAr(state.value);
        container.append(el('button', {
          type: 'button',
          class: `chip${active ? ' active' : ''}${row.custom ? ' custom' : ''}`,
          onclick: () => set(active ? '' : row.value),
        }, row.value));
      }
      if (rows.length > visible) {
        container.append(el('button', { type: 'button', class: 'chip more', onclick: () => openFull(rows) }, 'المزيد'));
      }
      if (allowOther) {
        container.append(el('button', { type: 'button', class: 'chip other', onclick: () => openOther(rows) }, 'أخرى'));
      }
    }

    function set(v, { custom = false } = {}) {
      state.value = v;
      if (custom && v) queuePending(type, v);
      render();
      onChange?.(v);
    }

    /* قائمة كاملة مع بحث عند كثرة الخيارات */
    async function openFull(rows) {
      const list = el('div', { class: 'pick-list' });
      const search = el('input', { class: 'input', type: 'search', placeholder: 'ابحث…', inputmode: 'search' });
      const draw = (q = '') => {
        const nq = U.normalizeAr(q);
        list.innerHTML = '';
        rows.filter((r) => !nq || U.normalizeAr(r.value).includes(nq)).forEach((r) => {
          list.append(el('button', {
            type: 'button', class: 'pick-item', onclick: () => { set(r.value); closeRef?.(null); },
          }, r.value));
        });
        if (!list.children.length) list.append(el('p', { class: 'muted', text: 'لا يوجد خيار مطابق' }));
      };
      let closeRef = null;
      search.addEventListener('input', () => draw(search.value));
      draw();
      await sheet({
        title: DB.LIST_TYPES[type] || 'اختيار',
        body: el('div', {}, search, list),
        actions: [{ label: 'إغلاق', value: null }],
        onOpen: (_panel, close) => { closeRef = close; },
      });
    }

    /* خيار "أخرى": كتابة حرة مع اقتراح المتشابه لمنع التكرار */
    async function openOther(rows) {
      const input = el('input', { class: 'input', type: 'text', placeholder, value: '' });
      const hints = el('div', { class: 'hints' });
      let closeRef = null;
      const draw = () => {
        const q = input.value.trim();
        hints.innerHTML = '';
        if (q.length < 2) return;
        const near = rows
          .map((r) => ({ r, s: U.similarity(r.value, q) }))
          .filter((x) => x.s >= 0.6)
          .sort((a, b) => b.s - a.s).slice(0, 4);
        if (!near.length) return;
        hints.append(el('p', { class: 'hints-title', text: 'موجود مسبقاً — اختر بدل الكتابة:' }));
        near.forEach(({ r }) => hints.append(el('button', {
          type: 'button', class: 'chip', onclick: () => { set(r.value); closeRef?.(null); },
        }, r.value)));
      };
      input.addEventListener('input', draw);
      const done = await sheet({
        title: `${DB.LIST_TYPES[type] || ''} — كتابة`,
        body: el('div', {}, input, hints),
        actions: [{ label: 'إلغاء', value: null }, { label: 'تثبيت', kind: 'primary', value: 'ok' }],
        onOpen: (_panel, close) => { closeRef = close; setTimeout(() => input.focus(), 60); },
      });
      if (done === 'ok' && input.value.trim()) set(input.value.trim(), { custom: true });
    }

    render();
    return {
      get value() { return state.value; },
      set value(v) { state.value = v || ''; render(); },
      refresh: render,
    };
  }

  /* ----- العجلة الدوارة ----- */
  /* تفتح على القيمة الأكثر احتمالاً، وتقبل الكتابة المباشرة أيضاً */
  const ITEM_H = 44;

  function wheelColumn(values, selected, onPick) {
    const col = el('div', { class: 'wheel-col' });
    const inner = el('div', { class: 'wheel-inner' });
    values.forEach((v) => inner.append(el('div', { class: 'wheel-item', text: v.label })));
    col.append(inner);
    let index = Math.max(0, values.findIndex((v) => String(v.value) === String(selected)));

    const mark = () => {
      Array.from(inner.children).forEach((c, i) => c.classList.toggle('sel', i === index));
    };
    const scrollTo = (i, smooth) => {
      col.scrollTo({ top: i * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
    };
    let t = null;
    col.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const i = Math.max(0, Math.min(values.length - 1, Math.round(col.scrollTop / ITEM_H)));
        if (i !== index) { index = i; mark(); onPick(values[i].value); }
        scrollTo(i, true);
      }, 90);
    });
    inner.addEventListener('click', (e) => {
      const item = e.target.closest('.wheel-item');
      if (!item) return;
      index = Array.from(inner.children).indexOf(item);
      mark(); onPick(values[index].value); scrollTo(index, true);
    });
    mark();
    requestAnimationFrame(() => scrollTo(index, false));
    return {
      node: col,
      setValue(v) {
        const i = values.findIndex((x) => String(x.value) === String(v));
        if (i >= 0 && i !== index) { index = i; mark(); scrollTo(i, true); }
      },
    };
  }

  const range = (from, to, fmt = (n) => U.pad(n)) =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ value: from + i, label: fmt(from + i) }));

  /* منتقي التاريخ والوقت — يفتح على اللحظة الحالية */
  async function pickDateTime(currentISO) {
    const d = U.parseLocalISO(currentISO || U.toLocalISO(new Date()));
    const sel = {
      y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
      h: d.getHours(), min: d.getMinutes(),
    };
    const thisYear = new Date().getFullYear();
    const cols = el('div', { class: 'wheel' });
    const typed = el('input', {
      class: 'input ltr', type: 'text', inputmode: 'numeric',
      placeholder: 'كتابة مباشرة: YYYY-MM-DD HH:mm',
    });
    const preview = el('div', { class: 'wheel-preview' });

    const refresh = () => {
      const maxDay = new Date(sel.y, sel.m, 0).getDate();
      if (sel.d > maxDay) sel.d = maxDay;
      const iso = `${sel.y}-${U.pad(sel.m)}-${U.pad(sel.d)}T${U.pad(sel.h)}:${U.pad(sel.min)}`;
      preview.textContent = `${U.dayName(iso)}  ${U.fmtDate(iso)}  —  ${U.fmtTime(iso)}`;
      typed.value = `${sel.y}-${U.pad(sel.m)}-${U.pad(sel.d)} ${U.pad(sel.h)}:${U.pad(sel.min)}`;
      return iso;
    };

    const colMin = wheelColumn(range(0, 59), sel.min, (v) => { sel.min = v; refresh(); });
    const colH = wheelColumn(range(0, 23), sel.h, (v) => { sel.h = v; refresh(); });
    const colD = wheelColumn(range(1, 31), sel.d, (v) => { sel.d = v; refresh(); });
    const colM = wheelColumn(U.MONTHS.map((name, i) => ({ value: i + 1, label: name })), sel.m, (v) => { sel.m = v; refresh(); });
    const colY = wheelColumn(range(thisYear - 5, thisYear + 1, String), sel.y, (v) => { sel.y = v; refresh(); });
    cols.append(colMin.node, colH.node, colD.node, colM.node, colY.node);

    typed.addEventListener('change', () => {
      const t = U.toWestern(typed.value).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})(?:\D+(\d{1,2})\D+(\d{1,2}))?/);
      if (!t) return;
      sel.y = +t[1]; sel.m = Math.min(12, +t[2]); sel.d = Math.min(31, +t[3]);
      if (t[4]) { sel.h = Math.min(23, +t[4]); sel.min = Math.min(59, +t[5]); }
      colY.setValue(sel.y); colM.setValue(sel.m); colD.setValue(sel.d);
      colH.setValue(sel.h); colMin.setValue(sel.min);
      refresh();
    });

    refresh();
    const ok = await sheet({
      title: 'الساعة والتاريخ',
      body: el('div', {},
        el('div', { class: 'wheel-head' }, el('span', { text: 'دقيقة' }), el('span', { text: 'ساعة' }),
          el('span', { text: 'يوم' }), el('span', { text: 'شهر' }), el('span', { text: 'سنة' })),
        cols, preview, typed),
      actions: [
        { label: 'الآن', value: 'now' },
        { label: 'إلغاء', value: null },
        { label: 'تثبيت', kind: 'primary', value: 'ok' },
      ],
    });
    if (ok === 'now') return U.toLocalISO(new Date());
    if (ok !== 'ok') return null;
    return refresh();
  }

  /* منتقي سنة الموديل — يفتح على سنة قريبة */
  async function pickYear(current) {
    const thisYear = new Date().getFullYear();
    let value = Number(U.digits(current)) || thisYear - 2;
    const typed = el('input', { class: 'input ltr', type: 'text', inputmode: 'numeric', value: String(value) });
    const col = wheelColumn(range(1960, thisYear + 1, String), value, (v) => { value = v; typed.value = String(v); });
    typed.addEventListener('change', () => {
      const v = Number(U.digits(typed.value));
      if (v >= 1960 && v <= thisYear + 1) { value = v; col.setValue(v); }
    });
    const ok = await sheet({
      title: 'سنة الموديل',
      body: el('div', {}, el('div', { class: 'wheel single' }, col.node), typed),
      actions: [{ label: 'إلغاء', value: null }, { label: 'تثبيت', kind: 'primary', value: 'ok' }],
    });
    return ok === 'ok' ? String(value) : null;
  }

  /* ----- اقتراح الزبائن السابقين ----- */
  function customerSuggest(input, onPick) {
    const box = el('div', { class: 'suggest' });
    input.parentElement.append(box);
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const rows = await DB.findCustomers(input.value);
        box.innerHTML = '';
        if (!rows.length) { box.classList.remove('show'); return; }
        rows.forEach((r) => box.append(el('button', {
          type: 'button', class: 'suggest-item',
          onclick: () => { onPick(r); box.classList.remove('show'); },
        }, el('strong', { text: r.name }),
          el('small', { text: [r.idNumber || r.recordNo, r.office, r.mobile].filter(Boolean).join(' · ') }))));
        box.classList.add('show');
      }, 180);
    });
    input.addEventListener('blur', () => setTimeout(() => box.classList.remove('show'), 180));
    return box;
  }

  /* ----- حقل صورة (كاميرا أو معرض) ----- */
  function photoField(container, { label, value = '', onChange }) {
    let data = value;
    const img = el('img', { class: 'photo-img', alt: label });
    const input = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hidden' });
    const box = el('button', { type: 'button', class: 'photo-box', onclick: () => pick() });
    const clear = el('button', {
      type: 'button', class: 'photo-clear', title: 'حذف الصورة',
      onclick: (e) => { e.stopPropagation(); data = ''; draw(); onChange?.(''); },
    }, '×');

    async function pick() {
      /* الكاميرا الأصلية عند توفّر Capacitor، وإلا ملف من الجهاز */
      const cam = window.Capacitor?.Plugins?.Camera;
      if (cam) {
        try {
          const photo = await cam.getPhoto({
            quality: 82, resultType: 'dataUrl', source: 'PROMPT',
            width: 1000, correctOrientation: true, promptLabelHeader: label,
            promptLabelPhoto: 'من المعرض', promptLabelPicture: 'التقاط صورة',
          });
          if (photo?.dataUrl) { data = photo.dataUrl; draw(); onChange?.(data); }
          return;
        } catch (e) { if (String(e?.message || '').includes('cancel')) return; }
      }
      input.click();
    }

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        data = await U.fileToDataUrl(file, 1000, 0.8);
        draw(); onChange?.(data);
      } catch (err) { toast(err.message, 'error'); }
      input.value = '';
    });

    function draw() {
      box.innerHTML = '';
      if (data) { img.src = data; box.append(img, clear); }
      else box.append(el('span', { class: 'photo-hint' }, el('span', { class: 'photo-icon', text: '📷' }), el('span', { text: label })));
    }

    container.append(box, input);
    draw();
    return { get value() { return data; }, set value(v) { data = v || ''; draw(); } };
  }

  return {
    toast, sheet, confirmBox, alertBox, chips, queuePending, flushPending,
    pickDateTime, pickYear, customerSuggest, photoField,
  };
})();
