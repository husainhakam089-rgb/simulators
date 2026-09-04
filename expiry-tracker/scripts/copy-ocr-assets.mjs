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
