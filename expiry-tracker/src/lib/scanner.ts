// قراءة الباركود: نستعمل واجهة المتصفح الأصلية إن وُجدت، وإلا ZXing.
export type ScanHandler = (code: string) => void;

interface NativeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

export function createScanner(video: HTMLVideoElement, onScan: ScanHandler) {
  let stopped = false;
  let raf = 0;
  let native: NativeDetector | null = null;
  const canvas = document.createElement("canvas");

  async function start() {
    const Native = (window as unknown as { BarcodeDetector?: new (o: unknown) => NativeDetector })
      .BarcodeDetector;
    if (Native) {
      native = new Native({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"],
      });
      loop();
    } else {
      // ZXing تُحمَّل عند الحاجة فقط — لا نثقل شاشة العامل بها في كل مرة
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      if (stopped) return;
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF, BarcodeFormat.CODABAR,
      ]);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
      await reader.decodeFromVideoElement(video, (result) => {
        if (!stopped && result) onScan(result.getText());
      });
    }
  }

  async function loop() {
    if (stopped || !native) return;
    if (video.readyState >= 2 && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        try {
          const found = await native.detect(canvas);
          if (found.length > 0) onScan(found[0].rawValue);
        } catch { /* تجاهل إطاراً فاشلاً */ }
      }
    }
    raf = requestAnimationFrame(() => void loop());
  }

  void start();

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

/**
 * حدّة الصورة: تباين لابلاس. الأعلى يعني أوضح — نستعملها لاختيار أفضل لقطة
 * من عدة لقطات بدل الرهان على إطار واحد قد يصادف اهتزازاً أو لحظة عدم تركيز.
 */
export function sharpness(video: HTMLVideoElement, size = 160): number {
  if (!video.videoWidth) return 0;
  const h = Math.max(1, Math.round(size * video.videoHeight / video.videoWidth));
  const c = document.createElement("canvas");
  c.width = size; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, size, h);
  const d = ctx.getImageData(0, 0, size, h).data;

  const gray = new Float32Array(size * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    gray[j] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
  }
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - size] - gray[i + size];
      sum += lap; sumSq += lap * lap; n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/** مستطيل داخل الصورة بنِسَب ٠..١ */
export interface Roi { x: number; y: number; w: number; h: number }

/**
 * يحوّل مستطيلاً معروضاً على الشاشة إلى إحداثيات داخل صورة الكاميرا.
 *
 * الفيديو معروض بـ object-fit: cover، أي أنه مقصوص من الوسط. بدون هذا التحويل
 * يقع إطار التوجيه على مكان خاطئ من الصورة، فنقرأ غير ما وجّه العامل الكاميرا إليه.
 */
export function screenRectToRoi(video: HTMLVideoElement, rect: DOMRect): Roi | null {
  const box = video.getBoundingClientRect();
  if (!video.videoWidth || box.width === 0 || box.height === 0) return null;

  const scale = Math.max(box.width / video.videoWidth, box.height / video.videoHeight);
  const shownW = video.videoWidth * scale, shownH = video.videoHeight * scale;
  const offX = (shownW - box.width) / 2, offY = (shownH - box.height) / 2;

  const x = (rect.left - box.left + offX) / scale;
  const y = (rect.top - box.top + offY) / scale;
  const w = rect.width / scale, h = rect.height / scale;

  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));
  return {
    x: clamp(x, video.videoWidth) / video.videoWidth,
    y: clamp(y, video.videoHeight) / video.videoHeight,
    w: clamp(w, video.videoWidth - x) / video.videoWidth,
    h: clamp(h, video.videoHeight - y) / video.videoHeight,
  };
}

function drawToBlob(
  video: HTMLVideoElement, maxWidth: number, roi?: Roi | null,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const sx = roi ? Math.round(roi.x * video.videoWidth) : 0;
    const sy = roi ? Math.round(roi.y * video.videoHeight) : 0;
    const sw = roi ? Math.round(roi.w * video.videoWidth) : video.videoWidth;
    const sh = roi ? Math.round(roi.h * video.videoHeight) : video.videoHeight;
    if (sw < 8 || sh < 8) return resolve(null);

    const scale = Math.min(1, maxWidth / sw);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
  });
}

export interface Capture {
  /** الإطار كاملاً — صورة الإثبات التي يراها المدير */
  full: Blob | null;
  /** ما داخل إطار التوجيه فقط، بدقة كاملة — هنا يُقرأ التاريخ */
  roi: Blob | null;
  sharpness: number;
}

/**
 * يلتقط عدة إطارات ويختار أوضحها.
 *
 * صورة واحدة قد تصادف اهتزاز اليد أو لحظة إعادة تركيز العدسة، فيضيع الكارتون
 * كله. ثلاث لقطات على مدى نصف ثانية تكفي ليقع فيها إطار حادّ.
 */
export async function captureBest(
  video: HTMLVideoElement,
  opts: { roi?: Roi | null; frames?: number; gapMs?: number; maxWidth?: number } = {},
): Promise<Capture> {
  const frames = opts.frames ?? 3;
  const gap = opts.gapMs ?? 130;
  const maxWidth = opts.maxWidth ?? 2560;

  let best = -1;
  let bestFull: Blob | null = null;
  let bestRoi: Blob | null = null;

  for (let i = 0; i < frames; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, gap));
    const score = sharpness(video);
    if (score <= best) continue;
    const full = await drawToBlob(video, maxWidth, null);
    if (!full) continue;
    best = score;
    bestFull = full;
    bestRoi = opts.roi ? await drawToBlob(video, maxWidth, opts.roi) : null;
  }
  return { full: bestFull, roi: bestRoi, sharpness: Math.max(0, best) };
}

/** لقطة واحدة من الكاميرا — تبقى للتوافق مع ما يستدعيها */
export function captureFrame(video: HTMLVideoElement, maxWidth = 2560): Promise<Blob | null> {
  return drawToBlob(video, maxWidth, null);
}

/**
 * مراقب الإطار: يقيس الحركة والتفاصيل في صورة مصغّرة من الكاميرا.
 *
 * نستعمله للسقوط التلقائي على قراءة العلبة حين لا يوجد باركود: لا نصوّر إلا
 * والكاميرا ثابتة وأمامها شيء فعلاً، حتى لا تنفتح شاشة التأكيد والعامل يمشي
 * بالموبايل بيده.
 */
export function createFrameWatcher(video: HTMLVideoElement) {
  const W = 64, H = 48;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let previous: Uint8ClampedArray | null = null;

  return {
    /** يرجع الحركة (٠..٢٥٥) ومقدار التفاصيل (انحراف معياري) أو null إن لم تجهز الصورة */
    sample(): { motion: number; detail: number } | null {
      if (!ctx || video.readyState < 2 || !video.videoWidth) return null;
      ctx.drawImage(video, 0, 0, W, H);
      const now = ctx.getImageData(0, 0, W, H).data;

      let sum = 0, sumSq = 0, motion = 0;
      for (let i = 0; i < now.length; i += 4) {
        const g = (now[i] * 0.299 + now[i + 1] * 0.587 + now[i + 2] * 0.114);
        sum += g; sumSq += g * g;
        if (previous) motion += Math.abs(g - previous[i]);
      }
      const n = now.length / 4;
      const mean = sum / n;
      const detail = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
      const result = { motion: previous ? motion / n : 255, detail };

      const copy = new Uint8ClampedArray(now.length);
      for (let i = 0; i < now.length; i += 4) {
        copy[i] = now[i] * 0.299 + now[i + 1] * 0.587 + now[i + 2] * 0.114;
      }
      previous = copy;
      return result;
    },
    reset() { previous = null; },
  };
}
