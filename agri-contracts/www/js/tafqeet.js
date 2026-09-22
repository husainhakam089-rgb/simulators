// تفقيط: تحويل المبلغ الرقمي إلى حروف عربية (دينار عراقي).

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

// لكل مرتبة: [مفرد, مثنى, جمع لِما بين 3 و10]
const SCALES = [
  null,
  ['ألف', 'ألفان', 'آلاف'],
  ['مليون', 'مليونان', 'ملايين'],
  ['مليار', 'ملياران', 'مليارات'],
  ['ترليون', 'ترليونان', 'ترليونات'],
];

/** تفقيط عدد من 1 إلى 999. */
function underThousand(n) {
  const parts = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  // «مئتان» تصير «مئتا» حين تُضاف إلى ما بعدها، وتبقى «مئتان» وحدها.
  if (h) parts.push(h === 2 && rest === 0 ? HUNDREDS[2] : h === 2 ? 'مئتا' : HUNDREDS[h]);
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

/** صياغة مجموعة ثلاثية مع اسم مرتبتها (ألف/مليون/مليار). */
function groupWords(n, scaleIndex) {
  if (!n) return '';
  if (scaleIndex === 0) return underThousand(n);
  const [one, two, plural] = SCALES[scaleIndex];
  if (n === 1) return one;
  if (n === 2) return two;
  // 3‑10 جمع قلة، وما فوقها يعود إلى المفرد: «خمسة وعشرون مليون دينار».
  if (n <= 10) return `${underThousand(n)} ${plural}`;
  return `${n === 200 ? 'مئتا' : underThousand(n)} ${one}`;
}

/** صيغة العملة تبعاً لآخر عدد منطوق. */
function currencyForm(amount, singular, dual, plural) {
  const r = amount % 1000;
  if (amount === 1) return singular;
  if (amount === 2) return dual;
  if (r >= 3 && r <= 10) return plural;
  return singular;
}

/**
 * تحويل رقم إلى حروف.
 * @param {number|string} value المبلغ
 * @param {{currency?: string[], prefix?: string, suffix?: string}} [opts]
 *        currency: [مفرد, مثنى, جمع]
 */
export function tafqeet(value, opts = {}) {
  const {
    currency = ['دينار عراقي', 'ديناران عراقيان', 'دنانير عراقية'],
    prefix = '',
    suffix = 'لا غير',
  } = opts;
  const amount = Math.floor(Math.abs(Number(String(value).replace(/[^\d.]/g, '')) || 0));
  if (!amount) return '';
  if (amount >= 1e15) return '';

  const groups = [];
  let n = amount;
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const w = groupWords(groups[i], i);
    if (w) words.push(w);
  }

  // «واحد» و«اثنان» لا تُنطقان مع العملة المفردة/المثناة.
  let body = words.join(' و');
  if (amount === 1 || amount === 2) body = '';

  const unit = currencyForm(amount, currency[0], currency[1], currency[2]);
  return [prefix, body, unit, suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/** الصيغة المستعملة في متن العقد. */
export function amountPhrase(value) {
  return tafqeet(value, { prefix: 'مبلغ قدره' });
}
