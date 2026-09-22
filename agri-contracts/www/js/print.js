// بناء قالب الطباعة (A4 للعقد، نصف A4 للوصل) وإرساله للطابعة أو مشاركته PDF.

import { escapeHtml, formatDate, formatMoney, formatTime, dayNameFromISO, formatDocNumber } from './util.js';
import { amountPhrase } from './tafqeet.js';
import { toast } from './ui.js';

export const COPY_LABELS = {
  buyer: 'نسخة المشتري',
  seller: 'نسخة البائع',
  shop: 'نسخة المعرض',
};

let cssCache = null;

async function fileToBase64(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * ملفات الخطوط تُضمَّن داخل المستند بصيغة base64.
 * السبب: مستند الطباعة يُحمَّل في صفحة منفصلة عن التطبيق، فلو بقيت الخطوط
 * روابط خارجية لخرج العقد بخط بديل أو بحروف مقطّعة.
 */
async function printCss() {
  if (cssCache) return cssCache;
  // نسخة الملف الواحد تحمل أنماط الطباعة والخطوط بداخلها، فلا حاجة لجلبها.
  if (typeof window !== 'undefined' && window.__INLINE_PRINT_CSS__) {
    cssCache = window.__INLINE_PRINT_CSS__;
    return cssCache;
  }
  const [fontsCss, main] = await Promise.all([
    fetch('assets/fonts/fonts.css').then((r) => r.text()),
    fetch('css/print.css').then((r) => r.text()),
  ]);
  const files = [...new Set([...fontsCss.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1]))];
  const encoded = await Promise.all(files.map((f) => fileToBase64(`assets/fonts/${f}`)));
  let inlined = fontsCss;
  files.forEach((f, i) => {
    inlined = inlined.split(`url(${f})`).join(`url(data:font/woff2;base64,${encoded[i]})`);
  });
  cssCache = `${inlined}\n${main}`;
  return cssCache;
}

/** عدد صفحات A4 في المستند — تحتاجه الطبقة الأصلية لتوليد PDF بعدد الصفحات الصحيح. */
export function countPages(html) {
  const m = html.match(/class="(?:page|sheet-a4)"/g);
  return m ? m.length : 1;
}

const dots = (v) => (v == null || v === '' ? '' : escapeHtml(v));

function img(src, cls, alt = '') {
  return src ? `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">` : '';
}

function headerBlock(s) {
  return `
    <div class="head">
      <div class="head__img">${img(s.headerImageRight, '', 'ترتكتر')}</div>
      <div class="head__center">
        ${s.logo ? img(s.logo, 'head__logo', 'الشعار') : `<div class="head__name">${escapeHtml(s.shopName)}</div>`}
        ${s.logo ? `<div class="head__name">${escapeHtml(s.shopName)}</div>` : ''}
        <div class="head__line"><b>الإدارة:</b> ${escapeHtml(s.manager)}</div>
        <div class="head__line"><b>العنوان:</b> ${escapeHtml(s.address)}</div>
        ${s.phones ? `<div class="head__line"><b>الموبايل:</b> ${escapeHtml(s.phones)}</div>` : ''}
      </div>
      <div class="head__img">${img(s.headerImageLeft, '', 'سيارة')}</div>
    </div>`;
}

function partyBlock(title, p) {
  const idLine = p.idType === 'هوية أحوال قديمة'
    ? `<div class="row">
         <div class="cell"><span class="lbl">السجل</span><span class="val">${dots(p.record)}</span></div>
         <div class="cell"><span class="lbl">الصفحة</span><span class="val">${dots(p.page)}</span></div>
       </div>`
    : `<div class="row">
         <div class="cell"><span class="lbl">رقم البطاقة</span><span class="val">${dots(p.idNumber)}</span></div>
       </div>`;
  return `
    <div class="section">
      <div class="section__title">${escapeHtml(title)}</div>
      <div class="row"><div class="cell"><span class="lbl">الاسم</span><span class="val">${dots(p.name)}</span></div></div>
      <div class="row"><div class="cell"><span class="lbl">نوع الهوية</span><span class="val">${dots(p.idType)}</span></div></div>
      ${idLine}
      <div class="row"><div class="cell"><span class="lbl">الدائرة</span><span class="val">${dots(p.office)}</span></div></div>
      <div class="row"><div class="cell"><span class="lbl">العنوان</span><span class="val">${dots(p.address)}</span></div></div>
      <div class="row"><div class="cell"><span class="lbl">الموبايل</span><span class="val">${dots(p.mobile)}</span></div></div>
    </div>`;
}

/** صفحة عقد كاملة (A4). */
export function renderContractPage(c, s, copyKey) {
  const day = c.day || dayNameFromISO(c.date);
  const remaining = Math.max(0, (Number(c.amount) || 0) - (Number(c.paid) || 0));
  const subject = s.subjectWord || 'الآلية';
  return `
  <div class="page">
    <div class="frame">
      <span class="frame__corner frame__corner--tr"></span>
      <span class="frame__corner frame__corner--tl"></span>
      <span class="frame__corner frame__corner--br"></span>
      <span class="frame__corner frame__corner--bl"></span>
      ${headerBlock(s)}

      <div class="strip">
        <div class="photo">${img(c.sellerPhoto, '', 'صورة البائع')}<span class="photo__cap">البائع</span></div>
        <div class="strip__mid">
          <div class="docno">العدد: <span>${escapeHtml(formatDocNumber(c.number))}</span></div>
          <div class="title">عقد بيع ${escapeHtml(subject)}</div>
          ${copyKey ? `<div class="copytag">${escapeHtml(COPY_LABELS[copyKey] || '')}</div>` : ''}
        </div>
        <div class="photo">${img(c.buyerPhoto, '', 'صورة المشتري')}<span class="photo__cap">المشتري</span></div>
      </div>

      <div class="body">
        <div class="row">
          <div class="cell"><span class="lbl">الساعة</span><span class="val">${dots(formatTime(c.time))}</span></div>
          <div class="cell"><span class="lbl">التاريخ</span><span class="val">${dots(formatDate(c.date))}</span></div>
          <div class="cell"><span class="lbl">اليوم</span><span class="val">${dots(day)}</span></div>
        </div>

        <div class="section">
          <div class="section__title">بيانات ${escapeHtml(subject)}</div>
          <div class="row">
            <div class="cell"><span class="lbl">النوع</span><span class="val">${dots(c.machineType)}</span></div>
            <div class="cell"><span class="lbl">الماركة</span><span class="val">${dots(c.brand)}</span></div>
            <div class="cell"><span class="lbl">الموديل</span><span class="val">${dots(c.model)}</span></div>
            <div class="cell"><span class="lbl">اللون</span><span class="val">${dots(c.color)}</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="lbl">رقم الشاصي</span><span class="val">${dots(c.chassis)}</span></div>
            <div class="cell"><span class="lbl">رقم المحرك</span><span class="val">${dots(c.engineNo)}</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="lbl">المرقمة</span><span class="val">${dots(c.plate)}</span></div>
            <div class="cell cell--sm"><span class="lbl">المحافظة</span><span class="val">${dots(c.governorate)}</span></div>
          </div>
          <div class="row">
            <div class="cell"><span class="lbl">السنوية بأسم</span><span class="val">${dots(c.annualName)}</span></div>
            <div class="cell"><span class="lbl">وعنوانه</span><span class="val">${dots(c.annualAddress)}</span></div>
          </div>
        </div>

        <div class="row">
          <div class="cell"><span class="lbl">بمبلغ قدره</span><span class="val val--free">${dots(c.amountWords || amountPhrase(c.amount))}</span></div>
          <div class="cell cell--sm"><span class="lbl">رقماً</span><span class="val">${dots(formatMoney(c.amount))}</span></div>
        </div>
        <div class="row">
          <div class="cell"><span class="lbl">وقد قبض منه</span><span class="val">${dots(formatMoney(c.paid))}</span></div>
          <div class="cell"><span class="lbl">والباقي</span><span class="val">${dots(formatMoney(remaining))}</span></div>
        </div>
        <div class="row">
          <div class="cell"><span class="lbl">ملاحظات</span><span class="val val--free val--wide">${dots(c.notes)}</span></div>
        </div>

        <div class="parties">
          ${partyBlock('بيانات البائع', c.seller || {})}
          ${partyBlock('بيانات المشتري', c.buyer || {})}
        </div>

        <div class="terms">
          <div class="terms__title">الشروط</div>
          <ol>${(s.conditions || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ol>
        </div>
      </div>

      <div class="signs">
        ${['البائع', 'الشاهد الأول', 'الشرعي', 'الشاهد الثاني', 'المشتري']
          .map((n) => `<div><div class="sign__name">${n}</div><div class="sign__line"></div></div>`)
          .join('')}
      </div>
    </div>
  </div>`;
}

/** نصف ورقة: وصل واحد. بلا رسومات — الوصل نصّي بحت بطلب صاحب المعرض. */
function receiptHalf(r, s, copyKey) {
  return `
  <div class="half">
    <div class="rframe">
      <div class="rhead">
        <div>
          <div class="rhead__name">${escapeHtml(s.shopName)}</div>
          <div class="rhead__line">الإدارة: ${escapeHtml(s.manager)} — ${escapeHtml(s.address)}</div>
        </div>
        <div style="text-align:center">
          <div class="docno">العدد: <span>${escapeHtml(formatDocNumber(r.number))}</span></div>
          ${copyKey ? `<div class="copytag">${escapeHtml(COPY_LABELS[copyKey] || '')}</div>` : ''}
        </div>
      </div>

      <div class="rtitle">وصل قبض</div>

      <div class="row">
        <div class="cell"><span class="lbl">التاريخ</span><span class="val">${dots(formatDate(r.date))}</span></div>
        <div class="cell"><span class="lbl">اليوم</span><span class="val">${dots(r.day || dayNameFromISO(r.date))}</span></div>
        <div class="cell cell--sm"><span class="lbl">الساعة</span><span class="val">${dots(formatTime(r.time))}</span></div>
      </div>
      <div class="row"><div class="cell"><span class="lbl">استلمنا من السيد</span><span class="val">${dots(r.buyerName)}</span></div></div>
      <div class="row">
        <div class="cell"><span class="lbl">نوع الأداة</span><span class="val">${dots(r.tool)}</span></div>
        <div class="cell cell--sm"><span class="lbl">العدد</span><span class="val">${dots(r.qty)}</span></div>
      </div>
      <div class="row"><div class="cell"><span class="lbl">مبلغاً قدره</span><span class="val val--free">${dots(r.amountWords || amountPhrase(r.amount))}</span></div></div>
      <div class="row">
        <div class="cell cell--sm"><span class="lbl">رقماً</span><span class="val">${dots(formatMoney(r.amount))}</span></div>
        <div class="cell"><span class="lbl">الموبايل</span><span class="val">${dots(r.mobile)}</span></div>
      </div>
      <div class="row"><div class="cell"><span class="lbl">ملاحظات</span><span class="val val--free">${dots(r.notes)}</span></div></div>

      <div class="rsigns">
        ${['المستلم', 'المعرض', 'الدافع'].map((n) => `<div><div class="sign__name">${n}</div><div class="sign__line"></div></div>`).join('')}
      </div>
    </div>
  </div>`;
}

/**
 * صفحات الوصل. مع خيار وصلين في الورقة الواحدة وخط قص بينهما.
 * @param {Array<{receipt: object, copy: string}>} entries
 */
export function renderReceiptSheets(entries, s) {
  const perPage = Number(s.receiptsPerPage) === 2 ? 2 : 1;
  const pages = [];
  for (let i = 0; i < entries.length; i += perPage) {
    const slice = entries.slice(i, i + perPage);
    const halves = slice.map((e) => receiptHalf(e.receipt, s, e.copy)).join('');
    const cut = perPage === 2 && slice.length === 2
      ? '<div class="cutline"><span>✂ خط القص</span></div>'
      : '';
    pages.push(`<div class="sheet-a4">${halves}${cut}</div>`);
  }
  return pages.join('');
}

/** مستند HTML كامل جاهز للتحويل إلى PDF. */
export async function buildDocument(innerHtml, { title = 'طباعة' } = {}) {
  const css = await printCss();
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>${innerHtml}</body>
</html>`;
}

/* ---------- الإرسال للطابعة ---------- */

let pluginRef;
function nativePlugin() {
  if (pluginRef !== undefined) return pluginRef;
  const cap = window.Capacitor;
  if (!cap || !isNative()) {
    pluginRef = null;
  } else if (cap.registerPlugin) {
    pluginRef = cap.registerPlugin('NativePrint');
  } else {
    pluginRef = (cap.Plugins && cap.Plugins.NativePrint) || null;
  }
  return pluginRef;
}

export function isNative() {
  return Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

/** الطريقة الاحتياطية في المتصفح/سطح المكتب: إطار مخفي ثم نافذة الطباعة. */
function printViaIframe(html) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0';
    document.body.append(frame);
    frame.onload = async () => {
      const win = frame.contentWindow;
      try {
        if (win.document.fonts && win.document.fonts.ready) await win.document.fonts.ready;
      } catch { /* الخطوط جاهزة أصلاً */ }
      // مهلة قصيرة لضمان تحميل الصور المضمّنة قبل الطباعة.
      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => { frame.remove(); resolve(); }, 1200);
      }, 350);
    };
    frame.srcdoc = html;
  });
}

/**
 * إرسال المستند للطباعة.
 * 1) الطباعة المباشرة عبر IPP إن كانت مفعّلة وعنوان الطابعة محفوظ.
 * 2) وإلا نظام الطباعة المدمج في أندرويد (Epson Print Enabler / Mopria).
 * 3) وفي المتصفح: نافذة طباعة المتصفح.
 */
export async function printDocument(html, { jobName = 'عقد', settings = {} } = {}) {
  const plugin = nativePlugin();
  if (!plugin) {
    await printViaIframe(html);
    return 'browser';
  }
  if (settings.printerMode === 'direct' && settings.printerAddress) {
    try {
      await plugin.printDirect({
        html,
        jobName,
        pageCount: countPages(html),
        host: settings.printerAddress,
        port: Number(settings.printerPort) || 631,
        queue: settings.printerQueue || 'ipp/print',
      });
      return 'direct';
    } catch (e) {
      toast('تعذّرت الطباعة المباشرة — سيُفتح نظام الطباعة', 'warn');
      void e;
    }
  }
  await plugin.printHtml({ html, jobName, pageCount: countPages(html) });
  return 'system';
}

/** مشاركة نسخة PDF (واتساب مثلاً). */
export async function shareDocument(html, { fileName = 'عقد.pdf', title = 'عقد' } = {}) {
  const plugin = nativePlugin();
  if (!plugin || !plugin.sharePdf) {
    toast('المشاركة كملف PDF متاحة داخل التطبيق على الهاتف فقط', 'warn');
    return false;
  }
  await plugin.sharePdf({ html, fileName, title, pageCount: countPages(html) });
  return true;
}
