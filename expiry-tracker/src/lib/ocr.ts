// قراءة التاريخ من صورة الكارتون — تعمل داخل الموبايل نفسه، بلا إنترنت وبلا كلفة.
// المحرك (Tesseract) يُحمَّل عند أول استعمال ويبقى في الذاكرة، وملفاته مستضافة
// معنا في /ocr حتى تعمل داخل المخزن دون اتصال.

import { readDatesFromText, type ReadResult } from "./dateParse";
import { matchProduct, type CatalogItemLite, type MatchResult } from "./productMatch";

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
 * تجهيز الصورة: تدرّج رمادي، وتكبير الصور الصغيرة فقط.
 *
 * ملاحظة مهمة: جرّبنا شدّ التباين (contrast stretch) فأفسد القراءة تماماً —
 * صورة الكاميرا فيها ضجيج حسّاس، وشدّ التباين يضخّمه حتى يغرق النص فيه.
 * محرك Tesseract يقوم ببنترة الصورة (Otsu) بنفسه وهو أفضل من أي معالجة نضيفها.
 */
export async function prepare(blob: Blob, minWidth = 1400): Promise<HTMLCanvasElement | null> {
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.max(1, Math.min(2, minWidth / bitmap.width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
    px[i] = px[i + 1] = px[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export interface ReadOptions {
  shelfLifeDays?: number | null;
  today?: Date;
}

/**
 * يقرأ صورة الكارتون ويرجع تاريخ الانتهاء إن وُجد.
 * لا يرمي استثناءً أبداً — الفشل يعني ببساطة أننا نبقى على التاريخ المحسوب.
 */
export async function readDateFromImage(
  blob: Blob,
  opts: ReadOptions = {},
): Promise<ReadResult & { available: boolean }> {
  const empty = {
    expiry: null, production: null, confidence: "low" as const,
    reason: "قراءة التاريخ غير متاحة", candidates: [], available: false,
  };

  const worker = await warmUpOcr();
  if (!worker) return empty;

  const canvas = await prepare(blob);
  if (!canvas) return { ...empty, reason: "تعذّر تجهيز الصورة", available: true };

  try {
    const { data } = await worker.recognize(canvas);
    const result = readDatesFromText(data.text, { ...opts, ocrConfidence: data.confidence });
    return { ...result, available: true };
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

  // لا نكبّر الصورة هنا: قياساً على صور حقيقية، تكبير النص العربي الكبير
  // يشوّهه ويُسقط السطر أحياناً كاملاً. التاريخ وحده يستفيد من التكبير،
  // ولذلك يُقرأ بمسار منفصل.
  const canvas = await prepare(blob, PACKAGE_MIN_WIDTH);
  if (!canvas) return { ...empty, available: true };

  try {
    const { data } = await worker.recognize(canvas);
    const date = readDatesFromText(data.text, { ...opts, ocrConfidence: data.confidence });
    const match = matchProduct(data.text, catalog);
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
