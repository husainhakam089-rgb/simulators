// اختيار أوضح لقطة، وتحويل إطار التوجيه إلى إحداثيات داخل صورة الكاميرا.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

const r = await page.evaluate(async () => {
  const sc = await import('/src/lib/scanner.ts');
  const out = {};

  // فيديو مزيّف: عنصر <video> لا يعمل هنا، فنستعمل canvas بنفس الواجهة
  const make = (w, h, blurPx) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0,0,w,h);
    g.filter = blurPx ? `blur(${blurPx}px)` : 'none';
    g.fillStyle = '#000'; g.font = 'bold 60px monospace'; g.textAlign = 'center';
    g.fillText('EXP 18/09/2027', w/2, h/2);
    // نلبسه واجهة عنصر الفيديو التي تحتاجها الدوال
    Object.defineProperty(c, 'videoWidth', { value: w });
    Object.defineProperty(c, 'videoHeight', { value: h });
    Object.defineProperty(c, 'readyState', { value: 4 });
    return c;
  };

  const sharp = make(1280, 720, 0);
  const blurry = make(1280, 720, 6);
  out.sharpScore = Math.round(sc.sharpness(sharp));
  out.blurryScore = Math.round(sc.sharpness(blurry));

  // تحويل إطار التوجيه: نضع الفيديو ٣٩٠×٨٤٤ على المشهد والمصدر ١٢٨٠×٧٢٠
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;inset:0;';
  const v = make(1280, 720, 0);
  v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
  holder.appendChild(v);
  document.body.appendChild(holder);
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;left:8%;right:8%;top:26%;height:26%;';
  holder.appendChild(box);
  const roi = sc.screenRectToRoi(v, box.getBoundingClientRect());
  out.roi = roi && {
    x: +roi.x.toFixed(3), y: +roi.y.toFixed(3), w: +roi.w.toFixed(3), h: +roi.h.toFixed(3),
  };
  document.body.removeChild(holder);
  return out;
});

let pass = 0;
const sharper = r.sharpScore > r.blurryScore * 3;
console.log(`${sharper ? '✓' : '✗'} الحدّة تميّز الصورة الواضحة عن المهزوزة (${r.sharpScore} مقابل ${r.blurryScore})`);
if (sharper) pass++;

const roi = r.roi;
const inRange = roi && roi.x >= 0 && roi.y >= 0 && roi.w > 0 && roi.h > 0
  && roi.x + roi.w <= 1.001 && roi.y + roi.h <= 1.001;
console.log(`${inRange ? '✓' : '✗'} إطار التوجيه يقع داخل الصورة: ${JSON.stringify(roi)}`);
if (inRange) pass++;

// object-fit: cover على شاشة طويلة يقصّ العرض، فالإطار يشغل عرضاً أكبر نسبةً
const widthMakesSense = roi && roi.w > 0.2 && roi.w < 0.95;
console.log(`${widthMakesSense ? '✓' : '✗'} عرض الإطار معقول بعد حساب القصّ (${roi?.w})`);
if (widthMakesSense) pass++;

console.log(`\nنجح ${pass} من 3`);
await browser.close();
process.exit(pass === 3 ? 0 : 1);
