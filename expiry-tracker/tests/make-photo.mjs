// مولّد صور تشبه صورة موبايل حقيقية لكارتون: زاوية، اهتزاز، لمعان، ظل،
// والنص صغير نسبةً للإطار — عكس الصور المرسومة النظيفة التي كنا نختبر عليها.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

export async function renderPhotos(outDir, cases) {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  const out = [];
  for (const c of cases) {
    const png = await page.evaluate((c) => {
      let seed = 0x2545f491;
      const rnd = () => { seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

      const W = c.frameWidth, H = Math.round(W * 9 / 16);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');

      // خلفية المخزن
      g.fillStyle = '#3a3a38'; g.fillRect(0, 0, W, H);

      // الكارتون: مستطيل مائل يشغل جزءاً من الإطار
      g.save();
      g.translate(W / 2, H / 2);
      g.rotate((c.rotate ?? 0) * Math.PI / 180);
      g.transform(1, c.skewY ?? 0, c.skewX ?? 0, 1, 0, 0);   // ميل يقارب المنظور
      const bw = W * (c.boxWidth ?? 0.62), bh = bw * 0.66;
      g.fillStyle = '#c8a97c'; g.fillRect(-bw/2, -bh/2, bw, bh);

      // النص على الكارتون — حجمه نسبة من عرض الإطار كما بالصورة الحقيقية
      g.fillStyle = c.faint ? 'rgba(25,25,25,0.72)' : '#171717';
      g.textAlign = 'center';
      const lines = c.lines;
      const big = W * (c.titleScale ?? 0.045);
      const small = W * (c.textScale ?? 0.022);
      lines.forEach((t, i) => {
        const isDate = /EXP|MFG|\d{2}\/\d{2}/.test(t);
        const size = i === 0 && c.titleScale ? big
          : isDate && c.dateScale ? W * c.dateScale : small;
        const yy = -bh/2 + bh * 0.3 + i * small * 1.9;
        // تاريخ الصلاحية يُطبع على الكارتون بطابعة نقطية، لا بخط مصمت
        if (isDate && c.dotMatrix) {
          g.save();
          g.font = `bold ${size}px monospace`;
          const wpx = g.measureText(t).width;
          const off = document.createElement('canvas');
          off.width = Math.ceil(wpx) + 8; off.height = Math.ceil(size * 1.5);
          const og = off.getContext('2d');
          og.fillStyle = '#000'; og.font = `bold ${size}px monospace`;
          og.textAlign = 'center'; og.textBaseline = 'middle';
          og.fillText(t, off.width / 2, off.height / 2);
          const oi = og.getImageData(0, 0, off.width, off.height);
          const step = Math.max(2, Math.round(size / 7));   // تباعد النقاط
          const dotR = step * (c.dotDensity ?? 0.42);       // نصف قطر النقطة
          og.clearRect(0, 0, off.width, off.height);
          og.fillStyle = '#171717';
          for (let yy2 = 0; yy2 < off.height; yy2 += step) {
            for (let xx = 0; xx < off.width; xx += step) {
              if (oi.data[(yy2 * off.width + xx) * 4 + 3] > 120) {
                og.beginPath();
                og.arc(xx, yy2, dotR, 0, Math.PI * 2);
                og.fill();
              }
            }
          }
          g.drawImage(off, -off.width / 2, yy - off.height / 2);
          g.restore();
        } else {
          g.font = `bold ${size}px ${/[؀-ۿ]/.test(t) ? '"Noto Kufi Arabic", sans-serif' : 'monospace'}`;
          g.fillText(t, 0, yy);
        }
      });
      g.restore();

      // لمعان وظل
      const gl = g.createLinearGradient(0, 0, W, H);
      gl.addColorStop(0, 'rgba(255,255,255,0.22)');
      gl.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      gl.addColorStop(1, 'rgba(0,0,0,0.28)');
      g.fillStyle = gl; g.fillRect(0, 0, W, H);

      // اهتزاز خفيف
      if (c.blur) {
        const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
        const tg = tmp.getContext('2d');
        tg.filter = `blur(${c.blur}px)`;
        tg.drawImage(cv, 0, 0);
        g.clearRect(0, 0, W, H); g.drawImage(tmp, 0, 0);
      }

      // ضجيج حسّاس
      const im = g.getImageData(0, 0, W, H);
      for (let i = 0; i < im.data.length; i += 4) {
        const n = (rnd() - 0.5) * (c.noise ?? 18);
        im.data[i] += n; im.data[i+1] += n; im.data[i+2] += n;
      }
      g.putImageData(im, 0, 0);
      return cv.toDataURL('image/jpeg', c.quality ?? 0.75).split(',')[1];
    }, c);
    const file = `${outDir}/${c.name}.jpg`;
    writeFileSync(file, Buffer.from(png, 'base64'));
    out.push({ ...c, file });
  }
  await browser.close();
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const y = new Date().getFullYear() + 1;
  await renderPhotos(process.argv[2] ?? 'tests/.build/photos', [
    { name: 'قريب-واضح',  frameWidth: 1280, boxWidth: 0.78, titleScale: 0.05,  textScale: 0.03,
      lines: ['معجون طماطم الكاسر', 'صافي الوزن 800 غم', `EXP 18/09/${y}`] },
    { name: 'مسافة-عادية', frameWidth: 1280, boxWidth: 0.55, titleScale: 0.035, textScale: 0.018,
      rotate: -3, skewX: 0.05, blur: 0.5,
      lines: ['معجون طماطم الكاسر', 'صافي الوزن 800 غم', `EXP 18/09/${y}`] },
    { name: 'بعيد-ومائل',  frameWidth: 1280, boxWidth: 0.42, titleScale: 0.028, textScale: 0.013,
      rotate: -6, skewX: 0.09, skewY: 0.03, blur: 0.8, noise: 24,
      lines: ['معجون طماطم الكاسر', 'صافي الوزن 800 غم', `EXP 18/09/${y}`] },
  ]);
  console.log('رُسمت صور تشبه صور الموبايل');
}
