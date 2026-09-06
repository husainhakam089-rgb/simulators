// محرك قراءة ثانٍ داخل الجهاز: PaddleOCR فوق ONNX Runtime.
//
// لماذا محرك ثانٍ ونحن عندنا Tesseract؟ لأن كلاً منهما يفشل في ما ينجح فيه
// الآخر. Tesseract لا يجد سطر التاريخ وسط الكارتون أصلاً — يقرأ الصفحة كلها
// فيضيع خط صغير مطبوع نقطياً. و Paddle يجده دائماً (شبكة كشف مدرّبة على صور
// حقيقية لا على مستندات ممسوحة) لكنه يخلط أرقام الطباعة النقطية: ‏1B بدل 18
// و 2827 بدل 2027.
//
// فالتقسيم: Paddle يجد السطر ويقرأه، ثم نقصّ السطر نفسه من الصورة الأصلية
// بدقتها الكاملة ونعطيه لـ Tesseract. واتفاق محركين مستقلين على نفس التاريخ
// هو الدليل الذي نثق به — وهذا كل الفرق بين «تاريخ» و«تاريخ مضبوط».
//
// مجاني بالكامل، ويعمل داخل الجهاز بلا إنترنت وبلا مفتاح وبلا كلفة لكل صورة.

export interface DetectedLine {
  text: string;
  box: number[][] | null;
}

type Engine = { detect: (url: string) => Promise<DetectedLine[]> };

let engine: Promise<Engine | null> | null = null;

function assetUrl(file: string): string {
  return new URL(`paddle/${file}`, document.baseURI).href;
}

/**
 * مسار ملفات ONNX Runtime. في البناء تُخدَّم من `public` كما هي، أما خادم
 * التطوير فيرفض تحويل ملفات `public` إلى وحدات، فنأخذها من `node_modules`.
 */
function ortPath(): string {
  return import.meta.env.DEV
    ? "/node_modules/onnxruntime-web/dist/"
    : assetUrl("ort/");
}

function load(): Promise<Engine | null> {
  return (async () => {
    try {
      const [{ default: Ocr }, ort] = await Promise.all([
        import("@gutenye/ocr-browser"),
        import("onnxruntime-web"),
      ]);
      ort.env.wasm.wasmPaths = ortPath();
      // خيط واحد: التعدّد يحتاج SharedArrayBuffer وترويسات COOP/COEP، وهي
      // تعطّل النشر على الاستضافات البسيطة. الفرق في السرعة لا يستحق ذلك.
      ort.env.wasm.numThreads = 1;

      const ocr = await Ocr.create({
        models: {
          detectionPath: assetUrl("ch_PP-OCRv4_det_infer.onnx"),
          recognitionPath: assetUrl("ch_PP-OCRv4_rec_infer.onnx"),
          dictionaryPath: assetUrl("ppocr_keys_v1.txt"),
        },
      });
      return ocr as unknown as Engine;
    } catch (e) {
      console.warn("تعذّر تحميل محرك القراءة الثاني:", e);
      return null;
    }
  })();
}

/** يبدأ التحميل بلا انتظار — يُستدعى عند فتح شاشة العامل */
export function warmUpPaddle(): Promise<Engine | null> {
  engine ??= load();
  return engine;
}

/** يقرأ الصورة ويرجع السطور مع مواضعها، أو null إن لم يتوفّر المحرك */
export async function detectLines(blob: Blob): Promise<DetectedLine[] | null> {
  const ocr = await warmUpPaddle();
  if (!ocr) return null;
  const url = URL.createObjectURL(blob);
  try {
    return await ocr.detect(url);
  } catch (e) {
    console.warn("فشلت قراءة المحرك الثاني:", e);
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** مستطيل السطر نسبةً إلى أبعاد الصورة، مع هامش يحيط بالحروف */
export function lineRect(
  box: number[][],
  width: number,
  height: number,
  padY = 0.25,
): { x: number; y: number; w: number; h: number } | null {
  if (!box?.length) return null;
  const xs = box.map((p) => p[0]);
  const ys = box.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  if (w <= 0 || h <= 0) return null;
  return {
    x: Math.max(0, (Math.min(...xs) - w * 0.05) / width),
    y: Math.max(0, (Math.min(...ys) - h * padY) / height),
    w: Math.min(1, (w * 1.1) / width),
    h: Math.min(1, (h * (1 + 2 * padY)) / height),
  };
}
