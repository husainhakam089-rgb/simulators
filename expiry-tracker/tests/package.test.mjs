// قراءة العلبة نفسها: اسم المنتج بالعربية + التاريخ، بلا باركود إطلاقاً.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? process.argv[2] ?? 'http://127.0.0.1:5173';
const log = [];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
page.on('pageerror', e => console.error('  [pageerror]', e.message));
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

const CATALOG = [
  { product_id: 'p1', barcode: '6281000012345', name: 'لبن ربيع كامل الدسم ١ لتر', category_name: 'ألبان وأجبان', default_shelf_life_days: 14 },
  { product_id: 'p2', barcode: '6281000067890', name: 'معجون طماطم الكاسر ٨٠٠ غم', category_name: 'معلبات', default_shelf_life_days: 730 },
  { product_id: 'p3', barcode: '6281000067906', name: 'معجون طماطم الكاسر ٤٠٠ غم', category_name: 'معلبات', default_shelf_life_days: 730 },
  { product_id: 'p4', barcode: '6281000022222', name: 'شاي الغزالين ناعم ٤٥٠ غم', category_name: 'شاي وقهوة', default_shelf_life_days: 730 },
  { product_id: 'p5', barcode: '6281000044444', name: 'Nescafe Gold 200 g', category_name: 'شاي وقهوة', default_shelf_life_days: 540 },
];

const cases = [
  // الوزن بأرقام لاتينية، وهو الشائع على البضاعة المستوردة
  { label: 'علبة عربية بلا باركود، الوزن بأرقام لاتينية',
    lines: ['معجون طماطم الكاسر', 'صافي الوزن 800 غم', 'EXP 18/09/2027'],
    expectId: 'p2', expectDate: '2027-09-18', expectConfident: true },
  { label: 'التمييز بين وزنين متشابهين',
    lines: ['معجون طماطم الكاسر', 'صافي الوزن 400 غم', 'EXP 01/06/2028'],
    expectId: 'p3', expectDate: '2028-06-01', expectConfident: true },
  // الأرقام العربية على العلبة تُقرأ رديئاً، فالوزن لا يميّز: الصح هنا ألا
  // يخمّن التطبيق بين توأمين، بل يعرضهما على العامل بلمسة واحدة
  { label: 'وزن بأرقام عربية: يعرض الخيارين ولا يخمّن',
    lines: ['معجون طماطم الكاسر', 'صافي الوزن ٨٠٠ غم', 'EXP 18/09/2027'],
    expectDate: '2027-09-18', expectConfident: false, expectCandidates: ['p2', 'p3'] },
  // "شاي" ثلاثة أحرف وتُقرأ خطأً كثيراً؛ الباقي يُقرأ صح. العقد هنا ليس
  // الاختيار التلقائي بل أن يكون الصنف الصحيح أول اقتراح — لمسة واحدة.
  { label: 'اسم قُرئ جزئياً: الصنف الصحيح أول اقتراح',
    lines: ['شاي الغزالين ناعم', 'صافي الوزن ٤٥٠ غم', 'EXP 12/2028'],
    expectTop: 'p4', expectDate: '2028-12-31', expectConfident: false },
  { label: 'علبة إنجليزية',
    lines: ['NESCAFE GOLD', 'INSTANT COFFEE 200 g', 'BEST BEFORE 03/2028'],
    expectId: 'p5', expectDate: '2028-03-31', expectConfident: true },
  { label: 'علبة ليست في القائمة لا تُطابَق',
    lines: ['SAMSUNG CHARGER 25W', 'USB TYPE-C'],
    expectId: null, expectDate: null, expectConfident: false },
];

for (const c of cases) {
  const out = await page.evaluate(async ({ lines, catalog }) => {
    const cv = document.createElement('canvas');
    cv.width = 1000; cv.height = 700;
    const g = cv.getContext('2d');
    g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, cv.width, cv.height);
    const grad = g.createLinearGradient(0, 0, cv.width, cv.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.18)'); grad.addColorStop(1, 'rgba(0,0,0,0.14)');
    g.fillStyle = grad; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#141414';
    g.textAlign = 'center';
    lines.forEach((t, i) => {
      g.font = `bold ${i === 0 ? 62 : 40}px "Noto Kufi Arabic", sans-serif`;
      g.fillText(t, cv.width / 2, 200 + i * 130);
    });
    // ضجيج بمولّد عشوائي مثبّت البذرة: أي سقوط لاحق يكون عطلاً حقيقياً لا حظاً
    let seed = 0x9e3779b9;
    const rnd = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const im = g.getImageData(0, 0, cv.width, cv.height);
    for (let i = 0; i < im.data.length; i += 4) {
      const n = (rnd() - 0.5) * 12;
      im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n;
    }
    g.putImageData(im, 0, 0);

    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.85));
    const mod = await import('/src/lib/ocr.ts');
    const t0 = performance.now();
    const res = await mod.readPackage(blob, catalog, { shelfLifeDays: null });
    return {
      ms: Math.round(performance.now() - t0),
      confident: res.match.confident,
      candidateIds: res.match.candidates.map((c) => c.item.product_id),
      bestId: res.match.best?.item.product_id ?? null,
      bestName: res.match.best?.item.name ?? null,
      score: res.match.best ? Number(res.match.best.score.toFixed(2)) : null,
      expiry: res.date.expiry,
      text: res.text.replace(/\s+/g, ' ').trim().slice(0, 60),
    };
  }, { lines: c.lines, catalog: CATALOG });

  const confOk = out.confident === c.expectConfident;
  const topOk = !c.expectTop || out.candidateIds[0] === c.expectTop;
  const idOk = c.expectId === undefined || c.expectId === null
    ? (c.expectId === null ? (out.bestId === null || !out.confident) : true)
    : out.bestId === c.expectId;
  const candOk = !c.expectCandidates
    || c.expectCandidates.every((id) => out.candidateIds.includes(id));
  const dateOk = out.expiry === c.expectDate;
  const ok = idOk && dateOk && confOk && candOk && topOk;
  log.push(ok);
  console.log(`${ok ? '✓' : '✗'} ${c.label}`);
  console.log(`    الصنف: ${out.bestName ?? 'لا شيء'} (ثقة ${out.confident ? 'حاسمة' : 'غير حاسمة'}، درجة ${out.score ?? '—'})`);
  console.log(`    التاريخ: ${out.expiry ?? 'لا شيء'}   [${out.ms}ms]`);
  if (!ok) {
    console.log(`    المتوقع: صنف ${c.expectId ?? '—'}، تاريخ ${c.expectDate ?? 'لا شيء'}، ثقة ${c.expectConfident ? 'حاسمة' : 'غير حاسمة'}`);
    console.log(`    المرشحون: ${out.candidateIds.join(',') || 'لا أحد'} | قرأ: "${out.text}"`);
  }
}

const passed = log.filter(Boolean).length;
console.log(`\nنجح ${passed} من ${cases.length}`);
await browser.close();
process.exit(passed === cases.length ? 0 : 1);
