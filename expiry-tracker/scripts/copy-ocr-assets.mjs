// ينسخ ملفات محرك القراءة من node_modules إلى public/ocr ليُخدَّم من نفس الموقع.
// نستضيفها بأنفسنا لا من CDN، لأن التطبيق يجب أن يعمل داخل مخزن بلا إنترنت.
import { copyFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "ocr");
mkdirSync(out, { recursive: true });

// نسخة واحدة من المحرك فقط.
//
// tesseract.js يختار تلقائياً بين ثلاث نسخ (relaxedsimd / simd / بلا simd) حسب
// المعالج، فكنا نشحن الثلاث بينما الجهاز ينزّل واحدة — ٢٫٨ م.ب هدراً في كل نسخة
// يوزّعها صاحب المحل. نثبّت نسخة SIMD ونمرّر مسار الملف نفسه لا المجلد، فيتوقف
// الاختيار التلقائي. SIMD مدعوم منذ Chrome 91 و Safari 16.4، أي كل موبايل عملي.
// الأجهزة الأقدم لا تُحمّل القراءة أصلاً، ويبقى التطبيق كاملاً بدونها.
const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "eng.traineddata.gz"],
  // العربية تُحمَّل فقط عند تصوير علبة بلا باركود، لا في المسار الاعتيادي
  ["node_modules/@tesseract.js-data/ara/4.0.0_best_int/ara.traineddata.gz", "ara.traineddata.gz"],
];

// المحرك الثاني: PaddleOCR فوق ONNX Runtime.
//
// لا يُنزَّل إلا عند الحاجة — حين يعجز المحرك الأول عن تاريخ موثوق — لأن حجمه
// كبير. ومن ONNX نأخذ نسخة المعالج وحدها: النسخة الافتراضية تجرّ ملف WebGPU
// بحجم ٢٧ م.ب لا نستعمله.
const paddleOut = join(root, "public", "paddle");
const ortOut = join(paddleOut, "ort");
mkdirSync(ortOut, { recursive: true });

const paddleFiles = [
  ["node_modules/@gutenye/ocr-models/assets/ch_PP-OCRv4_det_infer.onnx", "ch_PP-OCRv4_det_infer.onnx"],
  ["node_modules/@gutenye/ocr-models/assets/ch_PP-OCRv4_rec_infer.onnx", "ch_PP-OCRv4_rec_infer.onnx"],
  ["node_modules/@gutenye/ocr-models/assets/ppocr_keys_v1.txt", "ppocr_keys_v1.txt"],
];
const ortFiles = [
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.mjs"],
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.wasm"],
];

function copyAll(list, dir) {
  let bytes = 0;
  for (const [from, to] of list) {
    const src = join(root, from);
    if (!existsSync(src)) {
      console.error(`ناقص: ${from} — شغّل npm install أولاً`);
      process.exit(1);
    }
    copyFileSync(src, join(dir, to));
    bytes += statSync(src).size;
  }
  return bytes;
}

const mb = (b) => (b / 1048576).toFixed(1);
const tess = copyAll(files, out);
const paddle = copyAll(paddleFiles, paddleOut) + copyAll(ortFiles, ortOut);
console.log(`نُسخت ${files.length} ملفات المحرك الأول (${mb(tess)} م.ب) إلى public/ocr`);
console.log(`و${paddleFiles.length + ortFiles.length} ملفات المحرك الثاني (${mb(paddle)} م.ب) إلى public/paddle`);
