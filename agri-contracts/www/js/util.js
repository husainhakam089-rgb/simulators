// أدوات عامة: تطبيع النص العربي، التشابه، التواريخ، الأرقام.

export const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** تطبيع النص العربي لغرض المقارنة فقط (لا يُحفظ بهذا الشكل). */
export function normalizeAr(s) {
  return String(s || '')
    .replace(/[ً-ٰٟـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** درجة تشابه بين 0 و1 بعد التطبيع. */
export function similarity(a, b) {
  const x = normalizeAr(a);
  const y = normalizeAr(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (y.includes(x) || x.includes(y)) return 0.9;
  if (y.startsWith(x) || x.startsWith(y)) return 0.88;
  const d = levenshtein(x, y);
  return 1 - d / Math.max(x.length, y.length);
}

/** ترتيب قائمة نصوص حسب قربها من المدخل، مع حد أدنى للتشابه. */
export function rankSimilar(query, items, { key = null, min = 0.45, limit = 6 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];
  return items
    .map((it) => ({ it, score: similarity(q, key ? it[key] : it) }))
    .filter((r) => r.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.it);
}

export const pad = (n, w = 2) => String(n).padStart(w, '0');

/** رقم العقد بصيغة الدفتر: خمس خانات. */
export const formatDocNumber = (n) => pad(n, 5);

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTime(d = new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** اسم اليوم من تاريخ ISO. */
export function dayNameFromISO(iso) {
  const d = parseISO(iso);
  return d ? AR_DAYS[d.getDay()] : '';
}

export function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** عرض التاريخ كما في الدفتر: يوم / شهر / سنة. */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? `${m[3]} / ${m[2]} / ${m[1]}` : '';
}

/** الوقت بصيغة 12 ساعة مع ص/م. */
export function formatTime(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  if (!m) return '';
  let h = Number(m[1]);
  const suffix = h < 12 ? 'صباحاً' : 'مساءً';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

export function digitsOnly(s) {
  return String(s || '').replace(/[^\d]/g, '');
}

/** تنسيق المبلغ بفواصل الآلاف. */
export function formatMoney(n) {
  const v = Number(digitsOnly(n) || 0);
  return v.toLocaleString('en-US');
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** قراءة ملف صورة كـ data URL مع تصغيره للحفاظ على حجم قاعدة البيانات. */
export function fileToDataURL(file, maxSide = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذّر قراءة الملف'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذّر فتح الصورة'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const isPng = /png$/i.test(file.type || '');
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
