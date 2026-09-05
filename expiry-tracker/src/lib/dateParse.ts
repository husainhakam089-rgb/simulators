/**
 * قراءة التواريخ من نص خام (ناتج OCR) والتمييز بين تاريخ الإنتاج وتاريخ الانتهاء.
 *
 * منطق خالص بلا متصفح ولا شبكة — مُختبَر في tests/dateparse.test.mjs
 */

export type DateKind = "expiry" | "production" | "unknown";

export interface DateCandidate {
  iso: string;        // YYYY-MM-DD
  raw: string;        // النص كما ظهر في الصورة
  kind: DateKind;     // ما دلّت عليه الكلمة المفتاحية إن وُجدت
  dayKnown: boolean;  // false إذا كان التاريخ شهر/سنة فقط
  /** حشو أصفار غير متسق: علامة على رقم ضاع في القراءة */
  padSuspect?: boolean;
  line: string;
}

export interface ReadResult {
  expiry: string | null;
  production: string | null;
  confidence: "high" | "low";
  reason: string;              // لماذا اختير هذا التاريخ — يظهر للمدير عند المراجعة
  candidates: DateCandidate[];
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, JUNE: 6, JULY: 7,
  AUGUST: 8, SEPTEMBER: 9, SEPT: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
};

// كلمات الانتهاء والإنتاج — إنجليزية (أغلب الكراتين المستوردة) وعربية
const EXPIRY_WORDS = [
  "EXPIRY", "EXPIRE", "EXPIRES", "EXPIRATION", "EXP",
  "BEST BEFORE", "BESTBEFORE", "BEST BY", "USE BY", "USEBY", "USE BEFORE",
  "SELL BY", "BBE", "BBD", "VALID UNTIL", "VALID TO",
  "الانتهاء", "انتهاء", "الصلاحية", "صلاحية", "صالح لغاية", "صالح حتى", "ينتهي",
];
const PRODUCTION_WORDS = [
  "MANUFACTURE", "MANUFACTURED", "MANUFACTURING", "PRODUCTION", "PRODUCED",
  "PACKED", "PACKING", "PACKAGED", "MFG", "MFD", "PRD", "PROD", "PKD",
  "الإنتاج", "الانتاج", "إنتاج", "انتاج", "التعبئة", "تعبئة", "الصنع",
];

/** الأرقام العربية والفارسية ← لاتينية */
export function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
          .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

/**
 * إصلاح خلط الأرقام بالحروف داخل ما يشبه التاريخ فقط.
 *
 * الطباعة النقطية على الكراتين تجعل المحرك يقرأ 8 حرفَ B و 0 حرفَ O و 1 حرفَ l.
 * نصلح هذا الخلط، لكن **داخل المقاطع التي تشبه تاريخاً أصلاً** (أرقام وفواصل)
 * لا في كل النص، وإلا حوّلنا كلمات سليمة إلى أرقام مخترعة. وكل تاريخ نتج عن
 * إصلاك يُحفظ بثقة منخفضة ويظهر للعامل قبل التأكيد.
 */
const DIGIT_FIXES: Record<string, string> = {
  B: "8", O: "0", D: "0", Q: "0", I: "1", L: "1", "|": "1",
  S: "5", Z: "2", T: "7", G: "6", A: "4", E: "8",
};

// الفاصلة بين أجزاء التاريخ تُقرأ هي الأخرى خطأً على الطباعة النقطية
const SEPARATORS = ",;:'`%!¡\\|*";

export function repairDateDigits(line: string): string {
  const sep = `[\\/.\\-${SEPARATORS}]`;
  const part = "[0-9A-Z|]{1,4}";
  const re = new RegExp(`${part}(?:${sep}${part}){1,2}`, "g");
  return line.replace(re, (token) => {
    const digits = (token.match(/[0-9]/g) ?? []).length;
    const letters = (token.match(/[A-Z]/g) ?? []).length;
    // لا نلمس مقطعاً أغلبه حروف — قد يكون اسماً أو رمزاً لا تاريخاً
    if (digits < 2 || letters > digits) return token;
    return token
      .replace(/[A-Z|]/g, (ch) => DIGIT_FIXES[ch] ?? ch)
      .replace(new RegExp(`[${SEPARATORS}]`, "g"), "/");
  });
}

/**
 * إصلاح ببنية التاريخ: حين يقرأ المحرك «18/89/2027» نعرف أن الشهر ٨٩ مستحيل.
 *
 * نجرّب **بدلاً واحداً فقط** من أزواج الخلط المعروفة (٠↔٨ و ١↔٧ …) ونقبل
 * النتيجة فقط إذا أعطى بدلٌ واحد لا غيره تاريخاً صحيحاً داخل المدى. القيد هنا
 * هو بنية التاريخ نفسها، لا التخمين: يوم ١–٣١، شهر ١–١٢، وسنة معقولة. وإن
 * صلح أكثر من بدل تركنا المقطع كما هو بدل أن نخترع.
 */
const CONFUSABLE: Record<string, string[]> = {
  "0": ["8", "6", "9"], "8": ["0", "6", "3", "9"], "6": ["0", "8", "5"],
  "9": ["0", "8", "4"], "1": ["7", "4"], "7": ["1", "2"],
  "5": ["6", "8", "3"], "3": ["8", "9"], "2": ["7", "1"], "4": ["9", "1"],
};

function partsAreValidDate(a: number, b: number, c: number, today: Date): boolean {
  const y = fullYear(c);
  return y >= today.getFullYear() - 3 && y <= today.getFullYear() + 12
    && b >= 1 && b <= 12 && a >= 1 && a <= lastDayOfMonth(y, b);
}

export function repairDateByStructure(line: string, today: Date): string {
  return line.replace(/(?<!\d)(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?!\d)/g, (token, d, m, y) => {
    if (partsAreValidDate(Number(d), Number(m), Number(y), today)) return token;

    const parts = [d, m, y];
    const fixes: string[] = [];
    for (let pi = 0; pi < 3; pi++) {
      for (let ci = 0; ci < parts[pi].length; ci++) {
        for (const alt of CONFUSABLE[parts[pi][ci]] ?? []) {
          const swapped = [...parts];
          swapped[pi] = parts[pi].slice(0, ci) + alt + parts[pi].slice(ci + 1);
          const [A, B, C] = swapped.map(Number);
          if (partsAreValidDate(A, B, C, today)) {
            const candidate = swapped.join("/");
            if (!fixes.includes(candidate)) fixes.push(candidate);
          }
        }
      }
    }
    // بدلٌ واحد فقط يُقبل — تعدد الاحتمالات يعني تخميناً، فنترك المقطع
    return fixes.length === 1 ? fixes[0] : token;
  });
}

/** تنظيف مخرجات OCR: توحيد الفواصل وإزالة الضجيج */
export function normalizeLine(s: string): string {
  return normalizeDigits(s)
    .toUpperCase()
    .replace(/[|]/g, "1")
    .replace(/[‐-―]/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function lastDayOfMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function validDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= lastDayOfMonth(y, m);
}

function fullYear(y: number): number {
  if (y >= 1000) return y;
  return y < 70 ? 2000 + y : 1900 + y;
}

function kindOfLine(line: string, dateIndex: number): DateKind {
  // الكلمة المفتاحية تسبق التاريخ عادةً — نفحص ما قبله أولاً ثم السطر كله
  const before = line.slice(0, dateIndex);
  const hasExp = EXPIRY_WORDS.some((w) => before.includes(w));
  const hasPrd = PRODUCTION_WORDS.some((w) => before.includes(w));
  if (hasExp && !hasPrd) return "expiry";
  if (hasPrd && !hasExp) return "production";
  if (hasExp && hasPrd) {
    // كلاهما قبل التاريخ: الأقرب يفوز
    const iExp = Math.max(...EXPIRY_WORDS.map((w) => before.lastIndexOf(w)));
    const iPrd = Math.max(...PRODUCTION_WORDS.map((w) => before.lastIndexOf(w)));
    return iExp > iPrd ? "expiry" : "production";
  }
  const after = line.slice(dateIndex);
  if (EXPIRY_WORDS.some((w) => after.includes(w))) return "expiry";
  if (PRODUCTION_WORDS.some((w) => after.includes(w))) return "production";
  return "unknown";
}

/** كل التواريخ المعقولة في سطر واحد */
function datesInLine(line: string, today: Date): DateCandidate[] {
  const out: DateCandidate[] = [];
  // الأنماط تُجرَّب من الأخص إلى الأعم، وأي تطابق يتداخل مع تطابق سابق يُهمَل
  // حتى لا يُقرأ "18 SEP 2027" مرتين: مرة كتاريخ كامل ومرة كشهر وسنة.
  const taken: [number, number][] = [];
  const minYear = today.getFullYear() - 3;
  const maxYear = today.getFullYear() + 12;

  const push = (
    y: number, m: number, d: number, raw: string, at: number, dayKnown: boolean,
    padSuspect = false,
  ) => {
    if (y < minYear || y > maxYear) return;
    if (!validDate(y, m, d)) return;
    const end = at + raw.length;
    if (taken.some(([s, e]) => at < e && end > s)) return;
    taken.push([at, end]);
    out.push({ iso: iso(y, m, d), raw, kind: kindOfLine(line, at), dayKnown, padSuspect, line });
  };

  // ٢٠٢٦-٠٩-١٨ (سنة أولاً)
  for (const m of line.matchAll(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/g)) {
    push(Number(m[1]), Number(m[2]), Number(m[3]), m[0], m.index!, true);
  }

  // ١٨/٠٩/٢٠٢٦ أو ١٨.٠٩.٢٦ — العرف العراقي يوم/شهر/سنة
  for (const m of line.matchAll(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/g)) {
    let d = Number(m[1]), mo = Number(m[2]);
    const y = fullYear(Number(m[3]));
    // إن كان الأول أكبر من ١٢ فهو اليوم قطعاً؛ وإن كان الثاني أكبر من ١٢ فالترتيب أمريكي
    if (d <= 12 && mo > 12) { const t = d; d = mo; mo = t; }
    // الطباعة الصناعية تحشو بالأصفار: «18/09/2027». فإن جاء جزء بخانة واحدة
    // بينما جاره بخانتين، فالأرجح أن رقماً ضاع في القراءة — نقبله بثقة منخفضة
    // بدل أن نعطي تاريخاً خاطئاً معقولاً.
    const padSuspect = m[1].length !== m[2].length && m[3].length === 4;
    push(y, mo, d, m[0], m.index!, true, padSuspect);
  }

  // ١٨ SEP ٢٠٢٦
  for (const m of line.matchAll(/(\d{1,2})\s?[-\/ ]?\s?([A-Z]{3,9})\s?[-\/ ]?\s?(\d{2,4})/g)) {
    const mo = MONTHS[m[2]];
    if (mo) push(fullYear(Number(m[3])), mo, Number(m[1]), m[0], m.index!, true);
  }

  // SEP ٢٠٢٦ — شهر وسنة فقط ← آخر يوم في الشهر
  for (const m of line.matchAll(/\b([A-Z]{3,9})\s?[-\/ ]?\s?(\d{2,4})\b/g)) {
    const mo = MONTHS[m[1]];
    if (!mo) continue;
    const y = fullYear(Number(m[2]));
    push(y, mo, lastDayOfMonth(y, mo), m[0], m.index!, false);
  }

  // ٠٩/٢٠٢٦ — شهر/سنة ← آخر يوم في الشهر
  for (const m of line.matchAll(/(?<![\d\/.\-])(\d{1,2})[\/.\-](\d{4})(?![\d\/.\-])/g)) {
    const mo = Number(m[1]);
    const y = Number(m[2]);
    if (mo >= 1 && mo <= 12) push(y, mo, lastDayOfMonth(y, mo), m[0], m.index!, false);
  }

  // ٠٩/٢٦ — شهر/سنة بسنتين. صيغة شائعة على البضاعة لكنها تشبه أرقام التشغيلة،
  // فبلا كلمة مفتاحية لا نقبلها إلا إذا كان الناتج في المستقبل وضمن خمس سنوات:
  // رقم تشغيلة عشوائي نادراً ما يقع في هذه النافذة الضيقة.
  const todayISOLocal = iso(today.getFullYear(), today.getMonth() + 1, today.getDate());
  for (const m of line.matchAll(/(?<![\d\/.\-])(\d{1,2})[\/.\-](\d{2})(?![\d\/.\-])/g)) {
    const mo = Number(m[1]);
    const y = fullYear(Number(m[2]));
    if (mo < 1 || mo > 12) continue;
    if (kindOfLine(line, m.index!) === "unknown") {
      const candidate = iso(y, mo, lastDayOfMonth(y, mo));
      if (candidate <= todayISOLocal) continue;
      if (y > today.getFullYear() + 5) continue;
    }
    push(y, mo, lastDayOfMonth(y, mo), m[0], m.index!, false);
  }

  // ١٨٠٩٢٦ / ١٨٠٩٢٠٢٦ — مضغوطة، وهي خطرة (تشبه رقم التشغيلة) فنشترط كلمة مفتاحية
  for (const m of line.matchAll(/(?<!\d)(\d{6}|\d{8})(?!\d)/g)) {
    if (kindOfLine(line, m.index!) === "unknown") continue;
    const s = m[1];
    const d = Number(s.slice(0, 2));
    const mo = Number(s.slice(2, 4));
    const y = fullYear(Number(s.slice(4)));
    push(y, mo, d, m[0], m.index!, true);
  }

  return out;
}

export interface ReadOptions {
  today?: Date;
  /** العمر الافتراضي لمجموعة الصنف — يُستعمل لاشتقاق الانتهاء من تاريخ الإنتاج */
  shelfLifeDays?: number | null;
  /** ثقة محرك القراءة نفسه ٠–١٠٠ */
  ocrConfidence?: number;
}

/**
 * يقرأ نصاً كاملاً ويقرر تاريخ الانتهاء.
 *
 * الترتيب:
 *  ١. كلمة مفتاحية صريحة (EXP / صلاحية) ← أعلى ثقة.
 *  ٢. تاريخان بلا كلمات ← الأبعد انتهاء والأقرب إنتاج.
 *  ٣. تاريخ واحد في المستقبل ← انتهاء.
 *  ٤. تاريخ واحد في الماضي ← إنتاج إن كان + العمر الافتراضي يقع في المستقبل، وإلا فهو
 *     صنف منتهٍ فعلاً. الحالتان ثقتهما منخفضة ويراجعهما المدير.
 */
export function readDatesFromText(text: string, opts: ReadOptions = {}): ReadResult {
  const today = opts.today ?? new Date();
  const todayISO = iso(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const lines = normalizeDigits(text).split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const candidates: DateCandidate[] = [];
  for (const line of lines) candidates.push(...datesInLine(line, today));

  // إن لم يظهر شيء، نجرّب الإصلاح: خلط الحروف بالأرقام أولاً، ثم بنية التاريخ
  let repaired = false;
  if (candidates.length === 0) {
    for (const line of lines) {
      const fixed = repairDateByStructure(repairDateDigits(line), today);
      if (fixed !== line) {
        const found = datesInLine(fixed, today);
        if (found.length > 0) { candidates.push(...found); repaired = true; }
      }
    }
  }

  const none: ReadResult = {
    expiry: null, production: null, confidence: "low",
    reason: "لم يُقرأ أي تاريخ من الصورة", candidates,
  };
  if (candidates.length === 0) return none;

  const lowOcr = (opts.ocrConfidence ?? 100) < 55;
  const suspect = (iso: string | null) =>
    !!iso && candidates.some((c) => c.iso === iso && c.padSuspect);

  const marked = <T extends ReadResult>(r: T): T => {
    if (repaired) {
      return { ...r, confidence: "low" as const, reason: `${r.reason} — أُصلح خلط أرقام بحروف` };
    }
    if (suspect(r.expiry)) {
      return { ...r, confidence: "low" as const, reason: `${r.reason} — تأكد من الشهر، قد يكون رقم ناقص` };
    }
    return lowOcr ? { ...r, confidence: "low" as const, reason: `${r.reason} (قراءة غير واضحة)` } : r;
  };

  const expiries = candidates.filter((c) => c.kind === "expiry");
  const productions = candidates.filter((c) => c.kind === "production");

  // ١ — كلمة مفتاحية صريحة
  if (expiries.length > 0) {
    const pick = expiries.reduce((a, b) => (a.iso >= b.iso ? a : b));
    return marked({
      expiry: pick.iso,
      production: productions.length ? productions.reduce((a, b) => (a.iso <= b.iso ? a : b)).iso : null,
      confidence: "high",
      reason: `قُرئ من الصورة بكلمة صريحة: ${pick.raw}`,
      candidates,
    });
  }

  // إنتاج صريح فقط ← نشتق الانتهاء من عمر المجموعة
  if (productions.length > 0 && opts.shelfLifeDays) {
    const prod = productions.reduce((a, b) => (a.iso <= b.iso ? a : b));
    const d = new Date(prod.iso + "T00:00:00");
    d.setDate(d.getDate() + opts.shelfLifeDays);
    return marked({
      expiry: iso(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      production: prod.iso,
      confidence: "low",
      reason: `قُرئ تاريخ الإنتاج (${prod.raw}) وأُضيف عمر المجموعة`,
      candidates,
    });
  }

  const unknown = candidates.filter((c) => c.kind === "unknown");
  const uniq = [...new Map(unknown.map((c) => [c.iso, c])).values()].sort((a, b) => a.iso.localeCompare(b.iso));

  // ٢ — تاريخان بلا كلمات: الأبعد انتهاء
  if (uniq.length >= 2) {
    const first = uniq[0], last = uniq[uniq.length - 1];
    if (last.iso > todayISO) {
      return marked({
        expiry: last.iso,
        production: first.iso <= todayISO ? first.iso : null,
        confidence: "high",
        reason: `تاريخان على الكارتون — الأبعد هو الانتهاء (${last.raw})`,
        candidates,
      });
    }
  }

  // ٣ — تاريخ واحد في المستقبل
  const future = uniq.filter((c) => c.iso > todayISO);
  if (future.length > 0) {
    const pick = future[future.length - 1];
    return marked({
      expiry: pick.iso, production: null, confidence: "high",
      reason: `تاريخ واحد في المستقبل (${pick.raw})`, candidates,
    });
  }

  // ٤ — تاريخ واحد في الماضي
  if (uniq.length > 0) {
    const pick = uniq[uniq.length - 1];
    if (opts.shelfLifeDays) {
      const d = new Date(pick.iso + "T00:00:00");
      d.setDate(d.getDate() + opts.shelfLifeDays);
      const derived = iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (derived > todayISO) {
        return {
          expiry: derived, production: pick.iso, confidence: "low",
          reason: `التاريخ المقروء (${pick.raw}) في الماضي — عُومل كتاريخ إنتاج`,
          candidates,
        };
      }
    }
    return {
      expiry: pick.iso, production: null, confidence: "low",
      reason: `التاريخ المقروء (${pick.raw}) في الماضي — قد يكون الصنف منتهياً`,
      candidates,
    };
  }

  return none;
}
