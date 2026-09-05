// اختبار قراءة التاريخ من صورة حقيقية داخل متصفح حقيقي.
// يرسم كراتين اصطناعية (خلفية، ضجيج، ميلان، طباعة باهتة) ويتحقق أن المحرك يقرأها.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? process.argv[2] ?? 'http://127.0.0.1:5173';
const results = [];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.error('  [console]', m.text()); });
await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });

// يرسم لوح كارتون فيه النص المطلوب، ثم يمرّره على خط القراءة كاملاً
const run = async (label, lines, opts = {}) => {
  const out = await page.evaluate(async ({ lines, opts }) => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 600;
    const g = c.getContext('2d');

    // كارتون كرتوني اللون مع تدرّج وضجيج خفيف
    g.fillStyle = '#c9a875'; g.fillRect(0, 0, c.width, c.height);
    const grad = g.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0.16)');
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
    // ضجيج بمولّد عشوائي مثبّت البذرة: أي سقوط لاحق يكون عطلاً حقيقياً لا حظاً
    let seed = 0x9e3779b9;
    const rnd = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const img = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rnd() - 0.5) * 26;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);

    g.save();
    g.translate(c.width / 2, c.height / 2);
    g.rotate(((opts.rotate ?? 0) * Math.PI) / 180);
    g.translate(-c.width / 2, -c.height / 2);
    g.fillStyle = opts.faint ? 'rgba(30,30,30,0.62)' : '#1a1a1a';
    g.font = `${opts.bold === false ? '' : 'bold '}${opts.size ?? 52}px monospace`;
    g.textAlign = 'center';
    lines.forEach((t, i) => g.fillText(t, c.width / 2, 220 + i * (opts.size ?? 52) * 1.5));
    g.restore();

    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8));
    const mod = await import('/src/lib/ocr.ts');
    const t0 = performance.now();
    const res = await mod.readDateFromImage(blob, {
      shelfLifeDays: opts.shelfLifeDays ?? null,
      today: new Date(),
    });
    return { ...res, ms: Math.round(performance.now() - t0) };
  }, { lines, opts });
  results.push({ label, ...out });
  return out;
};

const today = new Date();
const y = today.getFullYear();

const cases = [
  { label: 'EXP بصيغة يوم/شهر/سنة', lines: ['NET 400 G', `EXP 18/09/${y + 1}`], expect: `${y + 1}-09-18` },
  { label: 'BEST BEFORE شهر/سنة',   lines: [`BEST BEFORE 03/${y + 2}`],        expect: `${y + 2}-03-31` },
  { label: 'إنتاج وانتهاء معاً',     lines: [`MFG 01/06/${y}`, `EXP 01/06/${y + 2}`], expect: `${y + 2}-06-01`, expectProd: `${y}-06-01` },
  { label: 'شهر إنجليزي',           lines: [`EXP 18 SEP ${y + 1}`],            expect: `${y + 1}-09-18` },
  { label: 'تاريخان بلا كلمات',      lines: [`10/03/${y}`, `10/03/${y + 2}`],   expect: `${y + 2}-03-10` },
  // كانت هذه الحالة خارج القدرة وترجع فارغة. محاولات التكبير ولحم الطباعة
  // النقطية صارت تقرأها — تحسّن حقيقي، فالتوقع تغيّر معه.
  { label: 'طباعة باهتة ومائلة', lines: [`EXP 25/12/${y + 1}`], expect: `${y + 1}-12-25`, opts: { faint: true, rotate: -4 } },
  { label: 'خط صغير',               lines: ['LOT 4521A', `EXP ${y + 1}-11-30`], expect: `${y + 1}-11-30`, opts: { size: 34 } },
  // الصيغة القصيرة بلا أي كلمة — الحالة التي طُلب فتحها
  { label: 'صيغة قصيرة ٠٩/٢٧ بلا كلمة',  lines: ['NET 250 G', `09/${String(y + 1).slice(2)}`], expect: `${y + 1}-09-30` },
  { label: 'صيغة قصيرة في الماضي تُرفض', lines: ['NET 250 G', `12/${String(y - 1).slice(2)}`], expect: null },
];

for (const c of cases) {
  const r = await run(c.label, c.lines, c.opts ?? {});
  const ok = r.expiry === c.expect && (!c.expectProd || r.production === c.expectProd);
  console.log(`${ok ? '✓' : '✗'} ${c.label} — قرأ ${r.expiry ?? 'لا شيء'}` +
    (c.expectProd ? ` / إنتاج ${r.production ?? 'لا شيء'}` : '') +
    ` (${r.ms}ms، ثقة ${r.confidence})` + (ok ? '' : ` — المتوقع ${c.expect}`));
}

const passed = results.filter((r, i) => r.expiry === cases[i].expect).length;
console.log(`\nنجح ${passed} من ${cases.length}`);
await browser.close();
process.exit(passed === cases.length ? 0 : 1);
