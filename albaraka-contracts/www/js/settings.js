/* الإعدادات: بيانات المعرض، الصور، العدادات، الطابعة، القوائم، النسخ الاحتياطي */
const SettingsScreen = (() => {
  const { el } = U;

  async function render(root) {
    const s = await DB.settings();
    root.innerHTML = '';
    root.append(el('div', { class: 'screen-head' }, el('h1', { text: 'الإعدادات' })));

    const save = async (patch) => { Object.assign(s, patch); await DB.saveSettings(patch); };

    /* --- بيانات المعرض --- */
    root.append(F.section('بيانات المعرض',
      F.field('اسم المعرض', F.textInput({ value: s.shopName, onInput: (v) => save({ shopName: v }) })),
      F.field('الإدارة', F.textInput({ value: s.manager, onInput: (v) => save({ manager: v }) })),
      F.field('العنوان', F.textInput({ value: s.address, onInput: (v) => save({ address: v }) })),
      F.field('الهاتف', F.textInput({ value: s.phone, ltr: true, inputmode: 'tel', onInput: (v) => save({ phone: v }) }))));

    /* --- صور الرأس --- */
    const imgRow = el('div', { class: 'photo-row three' });
    const slots = [
      ['logo', 'الشعار'],
      ['headerRight', 'صورة الترتكتر (يمين)'],
      ['headerLeft', 'صورة السيارة (يسار)'],
    ];
    for (const [key, label] of slots) {
      const box = el('div', { class: 'photo-wrap' });
      UI.photoField(box, {
        label, value: s.images?.[key] || '',
        onChange: (v) => save({ images: { ...s.images, [key]: v } }),
      });
      imgRow.append(box);
    }
    root.append(F.section('صور رأس العقد', imgRow,
      el('p', { class: 'muted', text: 'الأفضل صور شفافة PNG من المطبعة التي طبعت الدفتر.' })));

    /* --- العدادات --- */
    root.append(F.section('أرقام المستندات',
      F.field('آخر رقم عقد مستعمل', F.textInput({
        value: String(s.contractLast), ltr: true, inputmode: 'numeric',
        onInput: (v) => save({ contractLast: U.num(v) }),
      }), 'العقد القادم يأخذ الرقم الذي بعده'),
      F.field('آخر رقم وصل مستعمل', F.textInput({
        value: String(s.receiptLast), ltr: true, inputmode: 'numeric',
        onInput: (v) => save({ receiptLast: U.num(v) }),
      }))));

    /* --- الطابعة --- */
    const modeBox = el('div', { class: 'chips' });
    const modes = { system: 'نظام أندرويد (مضمون)', direct: 'مباشرة للطابعة (IPP)' };
    const drawModes = () => {
      modeBox.innerHTML = '';
      for (const [key, label] of Object.entries(modes)) {
        modeBox.append(el('button', {
          type: 'button', class: `chip${s.printerMode === key ? ' active' : ''}`,
          onclick: async () => { await save({ printerMode: key }); drawModes(); },
        }, label));
      }
    };
    drawModes();

    root.append(F.section('الطابعة',
      F.field('طريقة الإرسال', modeBox),
      F.field('عنوان الطابعة على الشبكة', F.textInput({
        value: s.printerUrl, ltr: true, placeholder: 'ipp://192.168.1.50:631/ipp/print',
        onInput: (v) => save({ printerUrl: v.trim() }),
      }), 'يُقرأ من شاشة الطابعة: الإعدادات ← الشبكة ← عنوان IP'),
      F.button('فحص الاتصال', {
        onclick: async () => {
          if (!s.printerUrl) { UI.toast('اكتب عنوان الطابعة أولاً', 'error'); return; }
          UI.toast('يُفحص الاتصال…');
          const ok = await IPP.probe(s.printerUrl).catch(() => false);
          UI.toast(ok ? 'الطابعة ترد على الشبكة' : 'لا يوجد رد — تبقى طريقة نظام أندرويد', ok ? 'info' : 'error');
        },
      }),
      el('p', { class: 'muted', text: 'الطريقة الأولى تحتاج Epson Print Enabler أو Mopria Print Service على الهاتف.' })));

    /* --- النسخ الافتراضية --- */
    const copyBox = (key, current) => {
      const box = el('div', { class: 'chips' });
      const draw = () => {
        box.innerHTML = '';
        for (const [k, label] of Object.entries(Templates.COPY_LABELS)) {
          const on = current.includes(k);
          box.append(el('button', {
            type: 'button', class: `chip${on ? ' active' : ''}`,
            onclick: async () => {
              current = on ? current.filter((x) => x !== k) : [...current, k];
              await save({ [key]: current });
              draw();
            },
          }, label));
        }
      };
      draw();
      return box;
    };

    root.append(F.section('النسخ الافتراضية',
      F.field('العقد', copyBox('copiesContract', [...s.copiesContract])),
      F.field('الوصل', copyBox('copiesReceipt', [...s.copiesReceipt]))));

    /* --- شروط العقد --- */
    const termsBox = el('div');
    const drawTerms = () => {
      termsBox.innerHTML = '';
      s.terms.forEach((t, i) => {
        termsBox.append(el('div', { class: 'term-row' },
          F.textInput({ value: t, multiline: true, onInput: (v) => { s.terms[i] = v; save({ terms: s.terms }); } }),
          F.button('حذف', {
            onclick: async () => { s.terms.splice(i, 1); await save({ terms: s.terms }); drawTerms(); },
          })));
      });
      termsBox.append(F.button('إضافة شرط', {
        onclick: async () => { s.terms.push(''); await save({ terms: s.terms }); drawTerms(); },
      }));
    };
    drawTerms();
    root.append(F.section('شروط العقد المطبوعة', termsBox,
      el('p', { class: 'muted', text: 'هنا تُضبط صياغة «الآلية» أو «السيارة» كما يريدها المعرض.' })));

    /* --- القوائم --- */
    const listsBox = el('div');
    async function drawLists() {
      listsBox.innerHTML = '';
      for (const [type, label] of Object.entries(DB.LIST_TYPES)) {
        const rows = await DB.listItems(type);
        const chipsRow = el('div', { class: 'chips' });
        rows.forEach((row) => {
          chipsRow.append(el('span', { class: 'chip static' }, row.value,
            el('button', {
              type: 'button', class: 'chip-x', title: 'حذف',
              onclick: async () => {
                if (!await UI.confirmBox(`حذف «${row.value}» من ${label}؟`)) return;
                await DB.removeListItem(row.id);
                drawLists();
              },
            }, '×')));
        });
        chipsRow.append(el('button', {
          type: 'button', class: 'chip other',
          onclick: async () => {
            const input = F.textInput({ placeholder: `أضف إلى ${label}` });
            const ok = await UI.sheet({
              title: label, body: input,
              actions: [{ label: 'إلغاء', value: null }, { label: 'إضافة', kind: 'primary', value: 'ok' }],
              onOpen: () => setTimeout(() => input.focus(), 60),
            });
            if (ok === 'ok' && input.value.trim()) { await DB.addListItem(type, input.value.trim()); drawLists(); }
          },
        }, '+ إضافة'));
        listsBox.append(F.field(label, chipsRow));
      }
    }
    await drawLists();
    root.append(F.section('القوائم', listsBox));

    /* --- النسخ الاحتياطي --- */
    const fileInput = el('input', { type: 'file', accept: 'application/json', class: 'hidden' });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!await UI.confirmBox('استيراد النسخة يدمج بياناتها مع الموجود. متابعة؟', { title: 'استيراد' })) return;
        await DB.importAll(data);
        UI.toast('تم الاستيراد');
        render(root);
      } catch (err) { UI.toast(`تعذّر الاستيراد: ${err.message}`, 'error'); }
      fileInput.value = '';
    });

    root.append(F.section('نسخة احتياطية',
      F.actionsBar(
        F.button('تصدير نسخة', {
          kind: 'primary',
          onclick: async () => {
            const data = await DB.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const name = `albaraka-backup-${new Date().toISOString().slice(0, 10)}.json`;
            const a = el('a', { href: url, download: name });
            document.body.append(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            UI.toast('صُدّرت النسخة');
          },
        }),
        F.button('استيراد نسخة', { onclick: () => fileInput.click() })),
      fileInput,
      el('p', { class: 'muted', text: 'النسخة تحفظ العقود والزبائن والقوائم التي كبرت مع الوقت — وهي أشياء لا تحفظها الورقة.' })));
  }

  return { render };
})();
