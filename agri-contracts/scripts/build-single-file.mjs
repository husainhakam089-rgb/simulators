#!/usr/bin/env node
// يبني نسخة «ملف واحد»: كل شيء (الأنماط والخطوط والبرمجة) داخل index.html
// واحد يعمل بمجرّد فتحه بالمتصفح — أسهل للتعديل والنقل.

import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const fontsDir = join(www, 'assets/fonts');
const out = process.argv[2] || join(root, 'عقود-البركة.html');

/** استبدال روابط ملفات الخطوط بمحتواها مضمّناً بصيغة base64. */
function inlineFonts(css) {
  let result = css;
  for (const file of readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'))) {
    const b64 = readFileSync(join(fontsDir, file)).toString('base64');
    result = result.split(`url(${file})`).join(`url(data:font/woff2;base64,${b64})`);
  }
  return result;
}

const fontsCss = inlineFonts(readFileSync(join(fontsDir, 'fonts.css'), 'utf8'));
const appCss = readFileSync(join(www, 'css/app.css'), 'utf8');
const printCss = readFileSync(join(www, 'css/print.css'), 'utf8');

const bundled = await build({
  entryPoints: [join(www, 'js/app.js')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  charset: 'utf8',
  write: false,
  logLevel: 'warning',
});
const js = bundled.outputFiles[0].text;

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#0f5132">
<title>عقود البركة</title>
<!--
  ════════════════════════════════════════════════════════════════════
  عقود ووصولات الآلات الزراعية — معرض البركة
  ملف واحد مكتفٍ بذاته: يعمل بمجرّد فتحه بالمتصفح، بلا إنترنت وبلا تنصيب.

  أقسام الملف بالترتيب — ابحث عن السطر المكتوب بين نجمات للانتقال:
    1) الخطوط        — سطران طويلان (Cairo وAmiri) بصيغة base64.
                        اطوهما في المحرّر ولا تعدّلهما.
    2) أنماط الواجهة  — ألوان التطبيق ومقاساته.
    3) أنماط الطباعة  — قالب A4 للعقد ونصف A4 للوصل.
                        هنا يكون الضبط بعد أول طبعة تجريبية: المقاسات
                        في :root بأعلى القسم.
    4) برمجة التطبيق — الشاشات والقوائم والحفظ والطباعة.

  المصدر المفصول إلى ملفات في مجلد www/، وهذا الملف يُولَّد منه بـ:
      node scripts/build-single-file.mjs
  ════════════════════════════════════════════════════════════════════
-->

<!-- ***** 1) الخطوط ***** -->
<style id="fonts-css">
${fontsCss}
</style>

<!-- ***** 2) أنماط الواجهة ***** -->
<style>
${appCss}
</style>
</head>
<body>
  <header class="topbar">
    <div class="topbar__brand">معرض البركة</div>
    <div class="topbar__sub">عقود ووصولات الآلات الزراعية</div>
  </header>

  <main id="app" class="app"></main>

  <nav id="nav" class="nav" aria-label="التنقل"></nav>

  <div id="splash" class="splash"><span>جارٍ التحميل…</span></div>

<!-- ***** 3) أنماط الطباعة ***** -->
<script id="print-css" type="text/css-template">
${printCss.replace(/<\/script>/g, '<\\/script>')}
</script>
<script>
  // مستند الطباعة يُبنى كصفحة منفصلة، فتُحقن فيه هذه الأنماط مع الخطوط
  // نفسها المستعملة في الواجهة — بلا تكرارها في الملف.
  window.__INLINE_PRINT_CSS__ =
    document.getElementById('fonts-css').textContent + String.fromCharCode(10) +
    document.getElementById('print-css').textContent;
</script>

<!-- ***** 4) برمجة التطبيق ***** -->
<script>
${js}
</script>
</body>
</html>
`;

writeFileSync(out, html);
console.log(`بُني الملف الواحد: ${out}`);
console.log(`الحجم: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} ميغابايت`);
