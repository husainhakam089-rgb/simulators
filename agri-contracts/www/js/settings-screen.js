// شاشة الإعدادات: بيانات المعرض، الصور، العدّاد، الطابعة، القوائم، نصوص العقد.

import * as db from './db.js';
import * as lists from './lists.js';
import * as settingsStore from './settings.js';
import * as customers from './customers.js';
import { ask, h, photoField, textArea, textField, toast } from './ui.js';
import { shareTextFile } from './print.js';
import { go } from './router.js';
import { digitsOnly, formatDocNumber, setDigitStyle } from './util.js';

export async function render(root) {
  const s = await settingsStore.load();

  /* ----- بيانات المعرض ----- */
  const shopName = textField({ label: 'اسم المعرض', value: s.shopName });
  const manager = textField({ label: 'الإدارة', value: s.manager });
  const address = textField({ label: 'العنوان', value: s.address });
  const phones = textField({ label: 'أرقام الموبايل (تظهر في الرأس)', value: s.phones, type: 'tel' });

  const logo = photoField({ label: 'الشعار (وسط الرأس)', value: s.logo });
  const imgRight = photoField({ label: 'صورة الرأس — اليمين (سيارة)', value: s.headerImageRight });
  const imgLeft = photoField({ label: 'صورة الرأس — اليسار (ترتكتر)', value: s.headerImageLeft });

  /* ----- العدّادات ----- */
  const contractNext = textField({
    label: 'رقم العقد القادم', value: String(s.contractNext), inputmode: 'numeric',
    hint: 'اكتب الرقم الذي يلي آخر رقم مستعمل في الدفتر الورقي.',
  });
  const receiptNext = textField({ label: 'رقم الوصل القادم', value: String(s.receiptNext), inputmode: 'numeric' });

  /* ----- الطابعة ----- */
  const printerMode = h('select', { class: 'input' },
    h('option', { value: 'system', selected: s.printerMode === 'system' }, 'نظام الطباعة في أندرويد (المضمون)'),
    h('option', { value: 'direct', selected: s.printerMode === 'direct' }, 'طباعة مباشرة عبر الشبكة (IPP)'),
  );
  const printerAddress = textField({
    label: 'عنوان الطابعة على الشبكة', value: s.printerAddress, placeholder: '192.168.1.50',
    hint: 'يظهر في تقرير حالة الشبكة المطبوع من الطابعة نفسها.',
  });
  const printerPort = textField({ label: 'المنفذ', value: String(s.printerPort), inputmode: 'numeric' });
  const printerQueue = textField({ label: 'مسار الطابور', value: s.printerQueue, placeholder: 'ipp/print' });

  /* ----- نصوص العقد ----- */
  const digitStyle = h('select', { class: 'input' },
    h('option', { value: 'arabic', selected: s.digitStyle !== 'latin' }, 'عربية ٠١٢٣٤٥٦٧٨٩'),
    h('option', { value: 'latin', selected: s.digitStyle === 'latin' }, 'إنجليزية 0123456789'),
  );
  const subjectWord = h('select', { class: 'input' },
    h('option', { value: 'الآلية', selected: s.subjectWord === 'الآلية' }, 'الآلية'),
    h('option', { value: 'السيارة', selected: s.subjectWord === 'السيارة' }, 'السيارة'),
  );
  const engineNoRequired = h('input', { type: 'checkbox', checked: s.engineNoRequired });
  const conditionsReviewed = h('input', { type: 'checkbox', checked: s.conditionsReviewed });
  const conditions = s.conditions.map((t, i) => textArea({ label: `الشرط ${i + 1}`, value: t, rows: 3 }));

  /* ----- الختم ----- */
  const stampEnabled = h('input', { type: 'checkbox', checked: s.stampEnabled !== false });
  const stampOnReceipt = h('input', { type: 'checkbox', checked: s.stampOnReceipt !== false });
  const stampImage = photoField({ label: 'صورة ختم حقيقي (اختياري)', value: s.stampImage });
  const stampName = textField({ label: 'السطر الأول', value: s.stampName || '' });
  const stampSubtitle = textField({ label: 'السطر الثاني', value: s.stampSubtitle || '' });
  const stampNote = textField({
    label: 'السطر الثالث', value: s.stampNote || '',
    hint: 'اتركه فارغاً ليأخذ اسم الإدارة تلقائياً.',
  });

  /* ----- القوائم ----- */
  const listsBox = h('div', {});
  async function paintLists() {
    listsBox.textContent = '';
    for (const [key, label] of Object.entries(lists.LIST_LABELS)) {
      const items = await lists.items(key);
      const chips = h('div', { class: 'chips' },
        items.map((it) =>
          h('span', { class: 'chip chip--static' },
            it.value,
            h('button', {
              type: 'button', class: 'chip__x', title: 'حذف',
              onclick: async () => {
                if (!(await ask(`حذف «${it.value}» من ${label}؟`, { yes: 'احذف', no: 'تراجع' }))) return;
                await lists.removeItem(key, it.value);
                paintLists();
              },
            }, '×'),
          )),
      );
      const add = h('input', { class: 'input input--inline', placeholder: `إضافة إلى ${label}` });
      const addBtn = h('button', {
        type: 'button', class: 'btn btn--sm',
        onclick: async () => {
          const v = add.value.trim();
          if (!v) return;
          const added = await lists.addItem(key, v);
          toast(added ? 'أُضيف' : 'موجود مسبقاً', added ? 'ok' : 'warn');
          add.value = '';
          paintLists();
        },
      }, 'إضافة');
      listsBox.append(
        h('div', { class: 'listgroup' },
          h('h3', { class: 'subhead', text: label }),
          chips,
          h('div', { class: 'row-actions' }, add, addBtn),
        ),
      );
    }
  }
  await paintLists();

  /* ----- النسخ الاحتياطي ----- */
  async function exportAll() {
    const payload = {
      app: 'albaraka-contracts',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: await settingsStore.load(),
      contracts: await db.all('contracts'),
      receipts: await db.all('receipts'),
      customers: await db.all('customers'),
      lists: await db.all('lists'),
    };
    const text = JSON.stringify(payload);
    const fileName = `نسخة-البركة-${new Date().toISOString().slice(0, 10)}.json`;

    // على الهاتف تُفتح قائمة المشاركة؛ رابط التنزيل لا يعمل داخل WebView.
    if (await shareTextFile(text, { fileName, title: 'نسخة احتياطية' })) {
      toast('اختر أين تحفظ النسخة', 'ok');
      return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: fileName });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('صُدِّرت النسخة', 'ok');
  }

  const importInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden' });
  importInput.addEventListener('change', async () => {
    const f = importInput.files && importInput.files[0];
    if (!f) return;
    importInput.value = '';
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'albaraka-contracts') throw new Error('الملف ليس نسخة من هذا التطبيق');
      if (!(await ask('الاستيراد يستبدل كل البيانات الحالية. متأكد؟', { yes: 'استورد', no: 'تراجع' }))) return;
      for (const store of ['contracts', 'receipts', 'customers', 'lists']) {
        await db.clear(store);
        for (const rec of data[store] || []) await db.put(store, rec);
      }
      if (data.settings) await settingsStore.save(data.settings);
      lists.invalidate();
      customers.invalidate();
      toast('اكتمل الاستيراد', 'ok');
      go('settings', {}, { replace: true });
    } catch (e) {
      toast(e.message || 'تعذّر الاستيراد', 'error');
    }
  });

  /* ----- الحفظ ----- */
  const saveBtn = h('button', {
    type: 'button', class: 'btn btn--primary btn--lg',
    onclick: async () => {
      await settingsStore.save({
        shopName: shopName.get(),
        manager: manager.get(),
        address: address.get(),
        phones: phones.get(),
        logo: logo.get(),
        headerImageRight: imgRight.get(),
        headerImageLeft: imgLeft.get(),
        contractNext: Number(digitsOnly(contractNext.get())) || 1,
        receiptNext: Number(digitsOnly(receiptNext.get())) || 1,
        printerMode: printerMode.value,
        printerAddress: printerAddress.get(),
        printerPort: Number(digitsOnly(printerPort.get())) || 631,
        printerQueue: printerQueue.get() || 'ipp/print',
        stampEnabled: stampEnabled.checked,
        stampOnReceipt: stampOnReceipt.checked,
        stampImage: stampImage.get(),
        stampName: stampName.get(),
        stampSubtitle: stampSubtitle.get(),
        stampNote: stampNote.get(),
        digitStyle: digitStyle.value,
        subjectWord: subjectWord.value,
        engineNoRequired: engineNoRequired.checked,
        conditionsReviewed: conditionsReviewed.checked,
        conditions: conditions.map((c) => c.get()).filter(Boolean),
      });
      setDigitStyle(digitStyle.value);
      toast('حُفظت الإعدادات', 'ok');
    },
  }, '💾 حفظ الإعدادات');

  root.textContent = '';
  root.append(
    h('div', { class: 'screen' },
      h('header', { class: 'screen__head' }, h('h1', { class: 'screen__title', text: 'الإعدادات' })),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'بيانات المعرض' }),
        shopName.el, manager.el, address.el, phones.el,
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'صور الرأس' }),
        h('p', { class: 'muted', text: 'رسومات الدفتر الأصلي مضمّنة في التطبيق وتُطبع تلقائياً. ارفع صورة هنا فقط إن أردت استبدال واحدة منها — والأوضح دائماً ملف جاهز من المطبعة.' }),
        logo.el,
        h('div', { class: 'grid grid--2' }, imgRight.el, imgLeft.el),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'العدّادات' }),
        h('div', { class: 'grid grid--2' }, contractNext.el, receiptNext.el),
        h('p', { class: 'muted', text: `العقد القادم سيُطبع بالرقم ${formatDocNumber(s.contractNext)}` }),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'الطابعة' }),
        h('div', { class: 'field' }, h('label', { class: 'field__label', text: 'طريقة الإرسال' }), printerMode),
        printerAddress.el,
        h('div', { class: 'grid grid--2' }, printerPort.el, printerQueue.el),
        h('p', { class: 'muted', text: 'الطريقة المضمونة تعتمد على Epson Print Enabler أو Mopria Print Service على الهاتف. الطباعة المباشرة تُجرَّب على الطابعة الفعلية قبل اعتمادها.' }),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'نصوص العقد' }),
        h('div', { class: 'field' },
          h('label', { class: 'field__label', text: 'شكل الأرقام في العقد والشاشات' }),
          digitStyle,
          h('div', { class: 'field__hint', text: 'أرقام الشاصي والمحرك تبقى كما تُكتب في الحالتين، لأنها أرقام مضروبة على الآلية نفسها.' }),
        ),
        h('div', { class: 'field' }, h('label', { class: 'field__label', text: 'الكلمة المستعملة في العقد' }), subjectWord),
        h('label', { class: 'checkrow' }, engineNoRequired, h('span', { text: 'رقم المحرك حقل إلزامي' })),
        h('h3', { class: 'subhead', text: 'الشروط المطبوعة أسفل العقد' }),
        h('p', { class: 'muted', text: 'منقولة حرفياً من الدفتر الورقي للمعرض. عدّلها هنا إن تغيّرت.' }),
        ...conditions.map((c) => c.el),
        h('label', { class: 'checkrow' }, conditionsReviewed, h('span', { text: 'اعتُمد نص الشروط من الدفتر الأصلي' })),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'الختم' }),
        h('p', { class: 'muted', text: 'يُطبع مع كل نسخة من العقد فوق توقيع الشرعي، فيخرج العقد جاهزاً بلا ختم يدوي.' }),
        h('label', { class: 'checkrow' }, stampEnabled, h('span', { text: 'طباعة الختم مع العقد' })),
        h('label', { class: 'checkrow' }, stampOnReceipt, h('span', { text: 'طباعة الختم مع الوصل أيضاً' })),
        h('h3', { class: 'subhead', text: 'الختم المرسوم' }),
        stampName.el, stampSubtitle.el, stampNote.el,
        h('h3', { class: 'subhead', text: 'أو ختم حقيقي' }),
        h('p', { class: 'muted', text: 'صوّر الختم على ورقة بيضاء بإضاءة جيدة. إن رفعت صورة فهي تحلّ محل المرسوم.' }),
        stampImage.el,
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'القوائم' }),
        h('p', { class: 'muted', text: 'تكبر تلقائياً مع الاستعمال — وهنا تُعدَّل يدوياً عند الحاجة.' }),
        listsBox,
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'النسخ الاحتياطي' }),
        h('p', { class: 'muted', text: 'الورق يحفظ العقد نفسه فقط؛ هذه النسخة تحفظ أيضاً العقود والزبائن والقوائم والعدّاد. صدّرها قبل أي حذف للتطبيق.' }),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn', onclick: exportAll }, '⬇ تصدير نسخة'),
          h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => importInput.click() }, '⬆ استيراد نسخة'),
          importInput,
        ),
      ),

      h('div', { class: 'savebar' }, saveBtn),
    ),
  );
}
