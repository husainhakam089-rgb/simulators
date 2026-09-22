/* تحويل المبلغ من رقم إلى حروف عربية (نظام المليون/المليار المستعمل في العراق) */
const NumWords = (() => {
  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
    'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUNDREDS = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة',
    'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  /* لكل مرتبة: المفرد، المثنى، الجمع */
  const SCALES = [
    ['', '', ''],
    ['ألف', 'ألفان', 'آلاف'],
    ['مليون', 'مليونان', 'ملايين'],
    ['مليار', 'ملياران', 'مليارات'],
    ['تريليون', 'تريليونان', 'تريليونات'],
  ];

  /* عدد من 1 إلى 999 */
  function under1000(n) {
    const parts = [];
    const h = Math.floor(n / 100);
    const rest = n % 100;
    if (h) parts.push(HUNDREDS[h]);
    if (rest) {
      if (rest < 10) parts.push(ONES[rest]);
      else if (rest < 20) parts.push(TEENS[rest - 10]);
      else {
        const u = rest % 10;
        const t = Math.floor(rest / 10);
        parts.push(u ? `${ONES[u]} و${TENS[t]}` : TENS[t]);
      }
    }
    return parts.join(' و');
  }

  /* مجموعة ثلاثية مع اسم مرتبتها */
  function groupWords(n, scaleIndex) {
    if (!n) return '';
    const [one, two, many] = SCALES[scaleIndex];
    if (scaleIndex === 0) return under1000(n);
    if (n === 1) return one;
    if (n === 2) return two;
    if (n <= 10) return `${under1000(n)} ${many}`;
    return `${under1000(n)} ${one}`;
  }

  /* الرقم إلى حروف بدون اسم العملة */
  function toWords(value) {
    let n = Math.floor(Math.abs(Number(value) || 0));
    if (n === 0) return 'صفر';
    const groups = [];
    while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
    if (groups.length > SCALES.length) return String(value);
    const parts = [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const w = groupWords(groups[i], i);
      if (w) parts.push(w);
    }
    return parts.join(' و');
  }

  /* صيغة المبلغ الكاملة كما تُكتب في العقد */
  function amount(value, currency = 'دينار عراقي') {
    const n = Math.floor(Math.abs(Number(value) || 0));
    if (!n) return '';
    const neg = Number(value) < 0 ? 'سالب ' : '';
    return `${neg}${toWords(n)} ${currency} لا غير`;
  }

  /* الصيغة المستعملة في متن العقد: "مبلغ قدره ..." */
  function phrase(value, currency = 'دينار عراقي') {
    const a = amount(value, currency);
    return a ? `مبلغ قدره ${a}` : '';
  }

  return { toWords, amount, phrase };
})();

if (typeof module !== 'undefined') module.exports = NumWords;
