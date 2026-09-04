// ينسخ ملفات محرك القراءة من node_modules إلى public/ocr ليُخدَّم من نفس الموقع.
// نستضيفها بأنفسنا لا من CDN، لأن التطبيق يجب أن يعمل داخل مخزن بلا إنترنت.
import { copyFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "ocr");
mkdirSync(out, { recursive: true });

// نأخذ نسخ LSTM الثلاث فقط (لا نحتاج المحرك القديم): المتصفح يختار واحدة منها
// حسب دعمه لـ SIMD، فلا يُنزَّل إلا ملف واحد على الجهاز.
const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "eng.traineddata.gz"],
];

let total = 0;
for (const [from, to] of files) {
  const src = join(root, from);
  if (!existsSync(src)) {
    console.error(`ناقص: ${from} — شغّل npm install أولاً`);
    process.exit(1);
  }
  copyFileSync(src, join(out, to));
  total += statSync(src).size;
}
console.log(`نُسخت ${files.length} ملفات قراءة (${(total / 1048576).toFixed(1)} م.ب) إلى public/ocr`);
