/**
 * مطابقة اسم المنتج المقروء من العلبة مع قائمة أصناف المحل.
 *
 * الفكرة: القراءة العربية من علبة مطبوعة ليست دقيقة، لكننا لا نحتاج دقة —
 * نحتاج فقط ترجيح صنف من قائمة معروفة ومغلقة. مطابقة تقريبية على مقاطع
 * ثلاثية الحروف تتحمّل أخطاء القراءة، والنص الزائد على العلبة لا يضرّ.
 *
 * منطق خالص بلا متصفح — مُختبَر في tests/productmatch.test.mjs
 */

export interface CatalogItemLite {
  barcode: string;
  name: string;
  category_name?: string | null;
  default_shelf_life_days?: number | null;
}

export interface ProductMatch {
  item: CatalogItemLite;
  score: number;          // ٠..١
  matchedTokens: string[];
}

export interface MatchResult {
  best: ProductMatch | null;
  candidates: ProductMatch[];   // مرتبة تنازلياً، بضعة اقتراحات للعامل
  confident: boolean;           // هل نختار تلقائياً أم نعرض الخيارات؟
}

/** كلمات لا تميّز صنفاً عن آخر، وتظهر على كل علبة */
const NOISE = new Set([
  "net", "wt", "weight", "gross", "made", "in", "product", "of", "the", "for",
  "keep", "store", "cool", "dry", "place", "best", "before", "exp", "mfg", "prod",
  "lot", "batch", "ingredients", "halal", "new", "quality",
  "صافي", "الوزن", "وزن", "صنع", "في", "منتج", "المنتج", "من", "على", "مع",
  "يحفظ", "بارد", "جاف", "مكان", "المكونات", "حلال", "جديد", "انتاج", "الانتاج",
  "انتهاء", "الانتهاء", "صلاحية", "الصلاحية", "تاريخ", "شركة", "مصنع",
  "غم", "غرام", "جم", "كغم", "كيلو", "مل", "لتر", "عبوة", "علبة", "كيس", "قطعة",
  "g", "gm", "kg", "ml", "lt", "ltr", "l", "oz", "pcs", "pc",
]);

/** توحيد الرسم العربي وإزالة ما لا يفيد المطابقة */
export function normalizeText(input: string): string {
  return (input || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[ً-ْٰـ]/g, "")   // تشكيل وتطويل
    .replace(/[أإآٱٲٳ]/g, "ا")
    .replace(/[ىی]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/گ/g, "ك")
    .replace(/[پ]/g, "ب")
    .replace(/[چ]/g, "ج")
    .replace(/[ڤ]/g, "ف")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((t) => t.length >= 2 && !NOISE.has(t) && !/^\d+$/.test(t));
}

/**
 * الأرقام على العلبة (الوزن والحجم) هي ما يميّز صنفاً عن توأمه:
 * «معجون طماطم ٨٠٠ غم» مقابل «٤٠٠ غم». نستخرجها منفصلة ونستعملها مرجّحاً.
 */
export function numbersIn(input: string): string[] {
  const out = normalizeText(input).match(/\d+/g) ?? [];
  return [...new Set(out)];
}

/** مقاطع ثلاثية داخل كل كلمة — تتحمّل حرفاً مقروءاً خطأً */
function trigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (const word of normalizeText(text).split(" ")) {
    if (word.length === 0) continue;
    const padded = ` ${word} `;
    if (padded.length < 3) continue;
    for (let i = 0; i <= padded.length - 3; i++) out.add(padded.slice(i, i + 3));
  }
  return out;
}

function containment(needle: Set<string>, haystack: Set<string>): number {
  if (needle.size === 0) return 0;
  let hit = 0;
  for (const g of needle) if (haystack.has(g)) hit++;
  return hit / needle.size;
}

// عتبتان مختلفتان عمداً:
//  - العرض سخيّ (٠٫٣٥): اقتراح خاطئ يكلّف لمسة، واقتراح ناقص يكلّف صنفاً مجهولاً.
//  - الاختيار التلقائي صارم (٠٫٦٥ + فارق واضح عن التالي): صنف خاطئ يعني
//    عمراً افتراضياً خاطئاً وتاريخاً خاطئاً على بضاعة حقيقية.
const MIN_SCORE = 0.35;
const CONFIDENT_SCORE = 0.65;
const CONFIDENT_MARGIN = 0.12;

/**
 * يرتّب أصناف المحل حسب قربها من النص المقروء من العلبة.
 * `ocrText` هو كل ما قرأه المحرك من الصورة، بسطوره وضجيجه.
 */
export function matchProduct(ocrText: string, catalog: CatalogItemLite[]): MatchResult {
  const empty: MatchResult = { best: null, candidates: [], confident: false };
  const textNorm = normalizeText(ocrText);
  if (textNorm.length < 3 || catalog.length === 0) return empty;

  const textGrams = trigrams(ocrText);
  const textTokens = new Set(tokenize(ocrText));
  const textNums = numbersIn(ocrText);

  const scored: ProductMatch[] = [];
  for (const item of catalog) {
    const nameTokens = tokenize(item.name);
    if (nameTokens.length === 0) continue;

    // اسم من كلمة واحدة قصيرة يطابق كل شيء — نتجاهله
    const nameLength = nameTokens.join("").length;
    if (nameLength < 4) continue;

    const nameGrams = trigrams(nameTokens.join(" "));
    const gramScore = containment(nameGrams, textGrams);

    const matchedTokens = nameTokens.filter(
      (t) => textTokens.has(t) || (t.length >= 4 && textNorm.includes(t)),
    );
    const tokenScore = matchedTokens.length / nameTokens.length;

    // الأرقام تُرجّح بين المتشابهين، لكن وزنها خفيف حتى لا يُسقِط مطابقةً
    // صحيحة إذا لم يُقرأ الوزن من الصورة
    const nameNums = numbersIn(item.name);
    const numScore = nameNums.length === 0
      ? 0
      : nameNums.filter((n) => textNums.includes(n)).length / nameNums.length;

    const score = 0.55 * gramScore + 0.30 * tokenScore + 0.15 * numScore;
    if (score >= MIN_SCORE) scored.push({ item, score, matchedTokens });
  }

  if (scored.length === 0) return empty;
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  const confident =
    best.score >= CONFIDENT_SCORE &&
    (!second || best.score - second.score >= CONFIDENT_MARGIN);

  return { best, candidates: scored.slice(0, 5), confident };
}
