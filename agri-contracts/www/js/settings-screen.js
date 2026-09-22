// شاشة الإعدادات: بيانات المعرض، الصور، العدّاد، الطابعة، القوائم، نصوص العقد.

import * as db from './db.js';
import * as lists from './lists.js';
import * as settingsStore from './settings.js';
import * as customers from './customers.js';
import { ask, h, photoField, textArea, textField, toast } from './ui.js';
import { go } from './router.js';
import { formatDocNumber } from './util.js';

export async function render(root) {
  const s = await settingsStore.load();

  /* ----- بيانات المعرض ----- */
  const shopName = textField({ label: 'اسم المعرض', value: s.shopName });
  const manager = textField({ label: 'الإدارة', value: s.manager });
  const address = textField({ label: 'العنوان', value: s.address });
  const phones = textField({ label: 'أرقام الموبايل (تظهر في الرأس)', value: s.phones, type: 'tel' });

  const logo = photoField({ label: 'الشعار', value: s.logo });
  const imgRight = photoField({ label: 'صورة الرأس — اليمين (ترتكتر)', value: s.headerImageRight });
  const imgLeft = photoField({ label: 'صورة الرأس — اليسار (سيارة)', value: s.headerImageLeft });

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
  const subjectWord = h('select', { class: 'input' },
    h('option', { value: 'الآلية', selected: s.subjectWord === 'الآلية' }, 'الآلية'),
    h('option', { value: 'السيارة', selected: s.subjectWord === 'السيارة' }, 'السيارة'),
  );
  const engineNoRequired = h('input', { type: 'checkbox', checked: s.engineNoRequired });
  const conditionsReviewed = h('input', { type: 'checkbox', checked: s.conditionsReviewed });
  const conditions = s.conditions.map((t, i) => textArea({ label: `الشرط ${i + 1}`, value: t, rows: 3 }));

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
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const a = h('a', {
      href: URL.createObjectURL(blob),
      download: `نسخة-البركة-${new Date().toISOString().slice(0, 10)}.json`,
    });
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
        contractNext: Number(contractNext.get().replace(/\D/g, '')) || 1,
        receiptNext: Number(receiptNext.get().replace(/\D/g, '')) || 1,
        printerMode: printerMode.value,
        printerAddress: printerAddress.get(),
        printerPort: Number(printerPort.get().replace(/\D/g, '')) || 631,
        printerQueue: printerQueue.get() || 'ipp/print',
        subjectWord: subjectWord.value,
        engineNoRequired: engineNoRequired.checked,
        conditionsReviewed: conditionsReviewed.checked,
        conditions: conditions.map((c) => c.get()).filter(Boolean),
      });
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
        h('p', { class: 'muted', text: 'الأفضل الحصول عليها من المطبعة كملفات جاهزة؛ وإلا تُقص من صورة نظيفة لعقد فارغ.' }),
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
        h('div', { class: 'field' }, h('label', { class: 'field__label', text: 'الكلمة المستعملة في العقد' }), subjectWord),
        h('label', { class: 'checkrow' }, engineNoRequired, h('span', { text: 'رقم المحرك حقل إلزامي' })),
        h('h3', { class: 'subhead', text: 'الشروط المطبوعة أسفل العقد' }),
        h('p', { class: 'muted', text: 'النص الحالي مسوّدة. انسخ الشروط حرفياً من الدفتر الورقي ثم علّم الاعتماد.' }),
        ...conditions.map((c) => c.el),
        h('label', { class: 'checkrow' }, conditionsReviewed, h('span', { text: 'اعتُمد نص الشروط من الدفتر الأصلي' })),
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'القوائم' }),
        h('p', { class: 'muted', text: 'تكبر تلقائياً مع الاستعمال — وهنا تُعدَّل يدوياً عند الحاجة.' }),
        listsBox,
      ),

      h('section', { class: 'card' },
        h('h2', { class: 'card__title', text: 'النسخ الاحتياطي' }),
        h('p', { class: 'muted', text: 'الورق يحفظ العقد نفسه فقط؛ هذه النسخة تحفظ أيضاً قائمة الزبائن والقوائم التي كبرت مع الوقت.' }),
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
