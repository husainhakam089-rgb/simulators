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

/** لقطة إثبات من الكاميرا */
export function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!video.videoWidth) return resolve(null);
    const maxW = 1080;
    const scale = Math.min(1, maxW / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7);
  });
}
