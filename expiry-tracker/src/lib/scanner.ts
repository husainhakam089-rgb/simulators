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
 * لقطة من الكاميرا بأعلى دقة متاحة.
 *
 * كانت تُصغَّر إلى ١٠٨٠ بكسل بجودة ٠٫٧، وهذا يمحو تفاصيل التاريخ المطبوع
 * صغيراً على الكارتون قبل أن تصل للقراءة أصلاً. نحتفظ الآن بدقة الحسّاس
 * كاملة حتى ٢٥٦٠ بكسل وبجودة عالية.
 */
export function captureFrame(video: HTMLVideoElement, maxWidth = 2560): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!video.videoWidth) return resolve(null);
    const maxW = maxWidth;
    const scale = Math.min(1, maxW / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
  });
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

      // نخزّن القيم الرمادية لمقارنة اللقطة القادمة
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
