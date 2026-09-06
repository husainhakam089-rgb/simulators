// قراءة التاريخ من صورة الكارتون — تعمل داخل الموبايل نفسه، بلا إنترنت وبلا كلفة.
// المحرك (Tesseract) يُحمَّل عند أول استعمال ويبقى في الذاكرة، وملفاته مستضافة
// معنا في /ocr حتى تعمل داخل المخزن دون اتصال.

import { readDatesFromText, type ReadResult } from "./dateParse";
import { matchProduct, type CatalogItemLite, type MatchResult } from "./productMatch";
import { blobToCanvas, cloneCanvas, crop, grayscale, mergeDotMatrix, upscale } from "./imageOps";
import { readTextInCloud } from "./cloudOcr";

type Worker = {
  recognize: (img: unknown) => Promise<{ data: { text: string; confidence: number } }>;
  setParameters: (p: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

export type OcrStage = "idle" | "loading" | "reading" | "ready" | "unavailable";

/**
 * المسارات تُحسب من عنوان الصفحة لا من جذر النطاق، فيعمل التطبيق حين يُنشر
 * داخل مجلد فرعي. و`corePath` يشير إلى ملف بعينه لا إلى مجلد: هكذا يتوقف
 * الاختيار التلقائي بين نسخ المحرك ونشحن نسخة واحدة بدل ثلاث.
 */
function ocrUrl(file: string): string {
  return new URL(`ocr/${file}`, document.baseURI).href;
}

const OCR_PATHS = {
  workerPath: ocrUrl("worker.min.js"),
  corePath: ocrUrl("tesseract-core-simd-lstm.wasm.js"),
  langPath: ocrUrl("").replace(/\/$/, ""),
};

// وضع القراءة: التقسيم التلقائي (٣) أعطى أفضل نتيجة في الاختبار — يقرأ الصور
// الواضحة بدقة كاملة، والأهم أنه يرجع فارغاً عند الصور الصعبة بدل أن يخترع نصاً.
// جرّبنا أيضاً حصر المحارف بالأرقام؛ لم يحسّن شيئاً مع محرك LSTM فتُرك.
const PARAMS = {
  tessedit_pageseg_mode: "3",
  preserve_interword_spaces: "1",
};

// محركان: الإنجليزي وحده للتواريخ (سريع، وهو المسار الاعتيادي)،
// والعربي+الإنجليزي لقراءة اسم المنتج من العلبة (أبطأ، ويُحمَّل عند الحاجة فقط).
const workers: Record<"date" | "package", Promise<Worker | null> | null> = {
  date: null,
  package: null,
};

function loadWorker(langs: string, label: string): Promise<Worker | null> {
  return (async () => {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(langs, 1, OCR_PATHS) as unknown as Worker;
      await worker.setParameters(PARAMS);
      return worker;
    } catch (e) {
      console.warn(`تعذّر تحميل ${label}:`, e);
      return null;
    }
  })();
}

/** تُستدعى عند فتح شاشة العامل: تُحمّل المحرك مبكراً بينما يصوّر أول كارتون */
export function warmUpOcr(): Promise<Worker | null> {
  workers.date ??= loadWorker("eng", "محرك قراءة التواريخ");
  return workers.date;
}

/** محرك قراءة العلبة — عربي وإنجليزي معاً، يُحمَّل عند أول استعمال */
export function warmUpPackageOcr(): Promise<Worker | null> {
  workers.package ??= loadWorker("ara+eng", "محرك قراءة العلبة");
  return workers.package;
}

export async function ocrAvailable(): Promise<boolean> {
  return (await warmUpOcr()) !== null;
}

/**
 * تجهيز الصورة الأساسية: تدرّج رمادي بلا تكبير ولا شدّ تباين.
 *
 * ملاحظة مقيسة: شدّ التباين يضخّم ضجيج الحسّاس حتى يغرق النص، وتكبير النص
 * العربي الكبير يشوّهه. لذلك المعالجة هنا خفيفة، والمحاولات الأثقل تأتي
 * بالترتيب أدناه وفقط عند الحاجة.
 */
export async function prepare(blob: Blob, maxWidth = 2000): Promise<HTMLCanvasElement | null> {
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return null;
  const canvas = blobToCanvas(bitmap, maxWidth);
  bitmap.close?.();
  return grayscale(canvas);
}

/**
 * محاولات قراءة التاريخ، من الأرخص إلى الأثقل. نتوقف عند أول تاريخ معقول.
 *
 * لماذا هذا الترتيب: تاريخ الصلاحية على الكارتون مطبوع بطابعة نقطية وحجمه
 * جزء صغير من الصورة. القراءة المباشرة تفشل لأن الحرف نقاط منفصلة، ولأن
 * ارتفاع الحرف أقل مما يحتاجه المحرك. فنكبّر، ثم نلحم النقاط ببنترة، ثم
 * نضيّق على وسط الصورة حيث يوجّه العامل الكاميرا.
 */
interface DateAttempt {
  name: string;
  psm?: string;                      // وضع التقسيم: ٧ لسطر واحد
  make: () => HTMLCanvasElement;
}

function dateAttempts(base: HTMLCanvasElement): DateAttempt[] {
  const center = { x: 0.06, y: 0.18, w: 0.88, h: 0.64 };

  // التكبير يتكيّف مع حجم الصورة لا ثابتاً: قد تصل صورة كاملة بعرض ٢٥٦٠ بكسل،
  // وقد يصل قصٌّ ضيّق من داخل إطار التوجيه بعرض ٢٠٠. الهدف واحد: أن يصل ارتفاع
  // الحرف إلى ما يحتاجه المحرك. عرض هدف ~١٦٠٠ بكسل قياساً على ما نجح.
  const TARGET = 1600;
  const factorFor = (c: HTMLCanvasElement) =>
    Math.max(1, Math.min(6, Math.round((TARGET / c.width) * 2) / 2));

  // نصف قطر اللحم يتناسب مع التكبير: تباعد النقاط يكبر بنفس النسبة، فنصف قطر
  // ثابت لا يلحم شيئاً بعد التكبير. النسبة ٢× معايَرة بصرياً على طباعة نقطية.
  const scaled = (c: HTMLCanvasElement) => upscale(c, factorFor(c));
  const welded = (c: HTMLCanvasElement) => {
    const f = factorFor(c);
    return mergeDotMatrix(upscale(c, f), Math.max(1, Math.round(f * 2)));
  };

  const middle = crop(base, center);
  // قائمة قصيرة عمداً وبميزانية وقت: العامل ينتظر، وكل محاولة نصف ثانية.
  return [
    { name: "خام", make: () => base },
    { name: "مكبّرة", make: () => scaled(cloneCanvas(base)) },
    { name: "لحم النقاط", make: () => welded(cloneCanvas(base)) },
    { name: "وسط الصورة مكبّراً", make: () => scaled(cloneCanvas(middle)) },
    { name: "وسط الصورة لحماً", make: () => welded(cloneCanvas(middle)) },
    // سطر واحد: أفضل ما أعطى مع التواريخ المطبوعة نقطياً
    { name: "سطر واحد لحماً", psm: "7", make: () => welded(cloneCanvas(middle)) },
  ];
}

/** سقف زمني لمحاولات قراءة التاريخ — بعده نكتفي ونترك التاريخ المحسوب */
const DATE_BUDGET_MS = 2500;

export interface ReadOptions {
  shelfLifeDays?: number | null;
  today?: Date;
  budgetMs?: number;
}

/**
 * يقرأ صورة الكارتون ويرجع تاريخ الانتهاء إن وُجد.
 * لا يرمي استثناءً أبداً — الفشل يعني ببساطة أننا نبقى على التاريخ المحسوب.
 */
export async function readDateFromImage(
  blob: Blob,
  opts: ReadOptions = {},
): Promise<ReadResult & { available: boolean; attempt?: string }> {
  const empty = {
    expiry: null, production: null, confidence: "low" as const,
    reason: "قراءة التاريخ غير متاحة", candidates: [], available: false,
  };

  const worker = await warmUpOcr();
  if (!worker) return empty;

  const base = await prepare(blob);
  if (!base) return { ...empty, reason: "تعذّر تجهيز الصورة", available: true };

  let fallback: (ReadResult & { available: boolean; attempt?: string }) | null = null;
  const deadline = Date.now() + (opts.budgetMs ?? DATE_BUDGET_MS);
  try {
    for (const attempt of dateAttempts(base)) {
      const canvas = attempt.make();
      if (attempt.psm) await worker.setParameters({ ...PARAMS, tessedit_pageseg_mode: attempt.psm });
      const { data } = await worker.recognize(canvas);
      if (attempt.psm) await worker.setParameters(PARAMS);
      const result = readDatesFromText(data.text, { ...opts, ocrConfidence: data.confidence });
      if (result.expiry) return { ...result, available: true, attempt: attempt.name };
      fallback ??= { ...result, available: true, attempt: attempt.name };
      // لا نُبقي العامل ينتظر: نكتفي بما جرّبناه ونترك له التاريخ المحسوب
      if (Date.now() > deadline) break;
    }
    return fallback ?? { ...empty, available: true };
  } catch (e) {
    console.warn("فشلت قراءة التاريخ:", e);
    return { ...empty, reason: "فشلت قراءة الصورة", available: true };
  }
}

/** لا تكبير لصور العلب — التكبير يفسد قراءة العربية */
const PACKAGE_MIN_WIDTH = 900;

export interface PackageReading {
  available: boolean;
  text: string;
  date: ReadResult;
  match: MatchResult;
}

/**
 * يقرأ العلبة كاملة: اسم المنتج وتاريخ الانتهاء من نفس الصورة.
 *
 * تُستعمل حين لا يوجد باركود، أو حين يكون الباركود غير معروف — يطابق النص
 * المقروء مع أصناف المحل بدل أن يترك الوجبة «صنفاً مجهولاً».
 */
export async function readPackage(
  blob: Blob,
  catalog: CatalogItemLite[],
  opts: ReadOptions = {},
): Promise<PackageReading> {
  const empty: PackageReading = {
    available: false, text: "",
    date: { expiry: null, production: null, confidence: "low", reason: "قراءة العلبة غير متاحة", candidates: [] },
    match: { best: null, candidates: [], confident: false },
  };

  const worker = await warmUpPackageOcr();
  if (!worker) return empty;

  // اسم المنتج كبير على العلبة ويُقرأ من الصورة كما هي — والتكبير يشوّه العربية
  const base = await prepare(blob, PACKAGE_MIN_WIDTH);
  if (!base) return { ...empty, available: true };

  try {
    const { data } = await worker.recognize(base);
    const match = matchProduct(data.text, catalog);
    let date = readDatesFromText(data.text, { ...opts, ocrConfidence: data.confidence });

    // التاريخ أصغر وأصعب من الاسم: إن لم يظهر في القراءة الأولى نجرّب
    // محاولات التكبير ولحم الطباعة النقطية بالمحرك الإنجليزي، وهو أدق للأرقام.
    if (!date.expiry) {
      const dateRead = await readDateFromImage(blob, opts);
      if (dateRead.expiry) date = dateRead;
    }

    return { available: true, text: data.text, date, match };
  } catch (e) {
    console.warn("فشلت قراءة العلبة:", e);
    return { ...empty, available: true };
  }
}

export async function disposeOcr() {
  for (const key of ["date", "package"] as const) {
    const w = await workers[key]?.catch(() => null);
    await w?.terminate().catch(() => {});
    workers[key] = null;
  }
}

// ===================== القراءة السحابية أولاً، ومحرك الجهاز احتياطاً =====================
//
// محرك الجهاز أعمى تقريباً أمام الطباعة النقطية: قسناه على صور واقعية فأعطى
// نحو ثلث التواريخ، وأعطى مرةً تاريخاً معقولاً وخاطئاً. الخدمة السحابية تقرأ
// هذه الطباعة، فصارت هي المسار الأول. ويبقى محرك الجهاز يعمل بلا اتصال، أو
// حين لا يكون مفتاح الخدمة مضبوطاً، أو حين تتعطل.

/**
 * ثقة النص القادم من السحابة. القراءة نظيفة فلا نخفّض ثقة التحليل بسببها،
 * لكن قواعد التحليل نفسها تبقى كما هي: تاريخ يحتاج ترميم أرقام يظل «غير واثق».
 */
const CLOUD_CONFIDENCE = 92;

export type ReadVia = "cloud" | "device" | "none";

export interface SmartDate extends ReadResult {
  available: boolean;
  via: ReadVia;
}

/** الصور بالترتيب الذي نجرّبه: داخل إطار التوجيه أولاً — النص فيه أكبر نسبةً */
function order(roi: Blob | null, photo: Blob | null): Blob[] {
  return [roi, photo].filter((b): b is Blob => !!b);
}

function tagged(r: ReadResult, via: ReadVia): SmartDate {
  const label = via === "cloud" ? "قراءة سحابية" : "قراءة داخل الجهاز";
  return { ...r, available: true, via, reason: r.reason ? `${r.reason} — ${label}` : label };
}

/**
 * يقرأ تاريخ الانتهاء: سحابياً إن أمكن، وإلا بمحرك الجهاز.
 * لا يرمي استثناءً — الفشل يعني أننا نبقى على التاريخ المحسوب.
 */
export async function readDateSmart(
  photo: Blob | null,
  roi: Blob | null,
  opts: ReadOptions = {},
): Promise<SmartDate> {
  let best: SmartDate | null = null;

  for (const img of order(roi, photo)) {
    const res = await readTextInCloud(img);
    if (!res.ok) break;   // الخدمة غير متاحة الآن: لا معنى لمحاولة صورة ثانية
    const parsed = readDatesFromText(res.text, { ...opts, ocrConfidence: CLOUD_CONFIDENCE });
    if (parsed.expiry) return tagged(parsed, "cloud");
    best ??= tagged(parsed, "cloud");
  }

  for (const img of order(roi, photo)) {
    const parsed = await readDateFromImage(img, opts);
    if (!parsed.available) continue;
    if (parsed.expiry) return tagged(parsed, "device");
    best ??= tagged(parsed, "device");
  }

  return best ?? {
    expiry: null, production: null, confidence: "low",
    reason: "قراءة التاريخ غير متاحة", candidates: [], available: false, via: "none",
  };
}

export interface LabelReading extends PackageReading {
  via: ReadVia;
}

/**
 * يقرأ العلبة كاملة — الاسم والتاريخ — سحابياً إن أمكن.
 *
 * الاسم يُقرأ من الإطار كاملاً لأنه كبير على العلبة، والتاريخ قد يحتاج القصّ
 * الضيّق. ولذلك قد يُنادى المزوّد مرتين على نفس الكارتون، وفقط عند الحاجة.
 */
export async function readLabelSmart(
  photo: Blob,
  roi: Blob | null,
  items: CatalogItemLite[],
  opts: ReadOptions = {},
): Promise<LabelReading> {
  const cloud = await readTextInCloud(photo);

  if (cloud.ok) {
    const match = matchProduct(cloud.text, items);
    let date = tagged(
      readDatesFromText(cloud.text, { ...opts, ocrConfidence: CLOUD_CONFIDENCE }),
      "cloud",
    );
    if (!date.expiry) {
      const closer = await readDateSmart(null, roi, opts);
      if (closer.expiry) date = closer;
    }
    return { available: true, text: cloud.text, date, match, via: "cloud" };
  }

  const local = await readPackage(photo, items, opts);
  if (!local.date.expiry) {
    const closer = await readDateSmart(photo, roi, opts);
    if (closer.expiry) return { ...local, date: closer, via: "device" };
  }
  return { ...local, via: local.available ? "device" : "none" };
}
