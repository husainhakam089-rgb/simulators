/* تجهيز مستند الطباعة وإرساله للطابعة.
   المستند يُبنى مكتفياً بذاته (خطوط وأنماط بداخله) حتى يطلع بنفس الشكل
   على أي طابعة أو عند تحويله إلى PDF. */
const Printing = (() => {
  const FONT_FILES = [
    ['Cairo', 400, 'assets/fonts/cairo-arabic.woff2'],
    ['Cairo', 400, 'assets/fonts/cairo-latin.woff2'],
    ['Amiri', 700, 'assets/fonts/amiri-arabic-700.woff2'],
  ];
  let fontCss = null;
  let printCss = null;

  const toBase64 = (buf) => {
    let bin = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  };

  async function assets() {
    if (!printCss) printCss = await (await fetch('css/print.css')).text();
    if (!fontCss) {
      const parts = [];
      for (const [family, weight, path] of FONT_FILES) {
        try {
          const b = await (await fetch(path)).arrayBuffer();
          parts.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};`
            + `src:url(data:font/woff2;base64,${toBase64(b)}) format('woff2');}`);
        } catch (_) { /* الخط غير موجود: يُستعمل خط النظام */ }
      }
      fontCss = parts.join('\n');
    }
    return { printCss, fontCss };
  }

  /* مستند HTML مكتفٍ بذاته جاهز للطباعة أو التحويل إلى PDF */
  async function buildDoc(inner, title = 'مستند') {
    const { printCss: css, fontCss: fonts } = await assets();
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${U.escapeHtml(title)}</title>
<style>${fonts}</style>
<style>${css}</style>
</head>
<body class="print-doc">
${inner}
</body>
</html>`;
  }

  const nativePlugin = () => window.Capacitor?.Plugins?.AlbarakaPrint || null;

  /* الطريقة الأولى: نظام الطباعة المدمج في أندرويد (الأساس المضمون) */
  async function printDoc(html, jobName = 'عقد') {
    const plugin = nativePlugin();
    if (plugin?.print) {
      await plugin.print({ html, jobName });
      return 'native';
    }
    return printViaIframe(html);
  }

  function printViaIframe(html) {
    return new Promise((resolve) => {
      const old = document.getElementById('print-frame');
      old?.remove();
      const frame = U.el('iframe', { id: 'print-frame', class: 'print-frame' });
      document.body.append(frame);
      frame.onload = () => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } catch (_) { /* متصفح لا يدعم الطباعة */ }
        resolve('iframe');
      };
      frame.srcdoc = html;
    });
  }

  /* تحويل المستند إلى PDF (يحتاج الإضافة الأصلية على أندرويد) */
  async function toPdf(html, fileName = 'contract.pdf', { base64 = false } = {}) {
    const plugin = nativePlugin();
    if (!plugin?.savePdf) return null;
    const res = await plugin.savePdf({ html, fileName, base64 });
    return res || null; // { path, uri, size, base64? }
  }

  /* الطريقة الثانية: إرسال مباشر للطابعة عبر IPP بدون أي نافذة */
  async function printDirect(html, { printerUrl, jobName = 'عقد', copies = 1 }) {
    if (!printerUrl) throw new Error('لم يُضبط عنوان الطابعة في الإعدادات');
    const pdf = await toPdf(html, `${jobName}.pdf`, { base64: true });
    if (!pdf?.base64) throw new Error('تعذّر تجهيز ملف PDF على هذا الجهاز');
    await IPP.printPdf({ printerUrl, base64: pdf.base64, jobName, copies });
    return 'ipp';
  }

  /* الطباعة حسب الإعداد المختار، مع الرجوع للطريقة المضمونة عند الفشل */
  async function send(html, { jobName = 'عقد', mode = 'system', printerUrl = '' } = {}) {
    if (mode === 'direct' && printerUrl) {
      try {
        await printDirect(html, { printerUrl, jobName });
        return { via: 'direct' };
      } catch (err) {
        UI.toast(`الطباعة المباشرة لم تنجح: ${err.message} — سيُفتح نظام الطباعة`, 'error');
      }
    }
    const via = await printDoc(html, jobName);
    return { via };
  }

  /* مشاركة نسخة PDF (واتساب مثلاً) */
  async function share(html, { fileName = 'contract.pdf', title = 'عقد', text = '' } = {}) {
    const pdf = await toPdf(html, fileName);
    if (!pdf) UI.toast('يُجهَّز الملف…');
    const shareApi = window.Capacitor?.Plugins?.Share;
    if (pdf?.uri && shareApi) {
      await shareApi.share({ title, text, url: pdf.uri, dialogTitle: 'مشاركة المستند' });
      return 'native';
    }
    /* على المتصفح: تنزيل الملف أو فتح نافذة الطباعة لحفظه PDF */
    if (pdf?.base64) {
      downloadBase64(pdf.base64, fileName);
      return 'download';
    }
    await printViaIframe(html);
    UI.toast('اختر «حفظ بصيغة PDF» من نافذة الطباعة ثم شاركه', 'info');
    return 'print-fallback';
  }

  function downloadBase64(base64, fileName) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = U.el('a', { href: url, download: fileName });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return { buildDoc, printDoc, toPdf, send, share, printViaIframe };
})();
