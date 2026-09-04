// قراءة التاريخ من صورة الكارتون — تعمل داخل الموبايل نفسه، بلا إنترنت وبلا كلفة.
// المحرك (Tesseract) يُحمَّل عند أول استعمال ويبقى في الذاكرة، وملفاته مستضافة
// معنا في /ocr حتى تعمل داخل المخزن دون اتصال.

import { readDatesFromText, type ReadResult } from "./dateParse";

type Worker = {
  recognize: (img: unknown) => Promise<{ data: { text: string; confidence: number } }>;
  setParameters: (p: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

export type OcrStage = "idle" | "loading" | "reading" | "ready" | "unavailable";

const OCR_PATHS = {
  workerPath: "/ocr/worker.min.js",
  corePath: "/ocr/",
  langPath: "/ocr",
};

// وضع القراءة: التقسيم التلقائي (٣) أعطى أفضل نتيجة في الاختبار — يقرأ الصور
// الواضحة بدقة كاملة، والأهم أنه يرجع فارغاً عند الصور الصعبة بدل أن يخترع نصاً.
// جرّبنا أيضاً حصر المحارف بالأرقام؛ لم يحسّن شيئاً مع محرك LSTM فتُرك.
const PARAMS = {
  tessedit_pageseg_mode: "3",
  preserve_interword_spaces: "1",
};

let workerPromise: Promise<Worker | null> | null = null;

/** تُستدعى عند فتح شاشة العامل: تُحمّل المحرك مبكراً بينما يصوّر أول كارتون */
export function warmUpOcr(): Promise<Worker | null> {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, OCR_PATHS) as unknown as Worker;
      await worker.setParameters(PARAMS);
      return worker;
    } catch (e) {
      console.warn("تعذّر تحميل محرك قراءة التواريخ:", e);
      return null;
    }
  })();
  return workerPromise;
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

export async function disposeOcr() {
  const w = await workerPromise?.catch(() => null);
  await w?.terminate().catch(() => {});
  workerPromise = null;
}
