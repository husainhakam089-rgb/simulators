/* أدوات مساعدة عامة */
const U = (() => {
  const pad = (n, len = 2) => String(n).padStart(len, '0');

  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

  /* التاريخ يُخزَّن دائماً نصاً بصيغة ISO محلية: YYYY-MM-DDTHH:mm */
  const toLocalISO = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const parseLocalISO = (s) => {
    if (!s) return new Date();
    const [date, time = '00:00'] = s.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
  };

  const dayName = (s) => DAYS[parseLocalISO(s).getDay()];
  const monthName = (s) => MONTHS[parseLocalISO(s).getMonth()];

  const fmtDate = (s) => {
    const d = parseLocalISO(s);
    return `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
  };

  const fmtTime = (s) => {
    const d = parseLocalISO(s);
    let h = d.getHours();
    const period = h < 12 ? 'صباحاً' : 'مساءً';
    h = h % 12 || 12;
    return `${h}:${pad(d.getMinutes())} ${period}`;
  };

  /* الأرقام: تُعرض دائماً بالأرقام العربية الشرقية اختيارياً */
  const EAST = '٠١٢٣٤٥٦٧٨٩';
  const toEastern = (s) => String(s).replace(/[0-9]/g, (d) => EAST[+d]);
  const toWestern = (s) => String(s).replace(/[٠-٩]/g, (d) => String(EAST.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  const digits = (v) => toWestern(String(v ?? '')).replace(/[^\d]/g, '');

  /* المبالغ: 25000000 -> 25,000,000 */
  const fmtMoney = (n) => {
    const v = Number(digits(n) || 0);
    return v.toLocaleString('en-US');
  };

  const num = (v) => Number(digits(v) || 0);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* تطبيع النص العربي لغرض المقارنة والبحث فقط (لا يُخزَّن بهذا الشكل) */
  const normalizeAr = (s) => toWestern(String(s ?? ''))
    .replace(/[ً-ٰٟـ]/g, '')   // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  /* مسافة تحرير مبسّطة لاقتراح المتشابه */
  const similarity = (a, b) => {
    a = normalizeAr(a); b = normalizeAr(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.9;
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return 1 - dp[m][n] / Math.max(m, n);
  };

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return node;
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHtml = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* رقم العقد يُعرض دائماً بخمس خانات مثل الدفتر الورقي */
  const docNo = (n) => pad(Number(n) || 0, 5);

  const fileToDataUrl = (file, maxSide = 1400, quality = 0.82) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذّرت قراءة الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('صورة غير صالحة'));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.round(width * scale); height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  return {
    pad, DAYS, MONTHS, toLocalISO, parseLocalISO, dayName, monthName, fmtDate, fmtTime,
    toEastern, toWestern, digits, fmtMoney, num, uid, normalizeAr, similarity,
    el, $, $$, escapeHtml, docNo, fileToDataUrl,
  };
})();
