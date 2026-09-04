// المساران معاً بلا قرار من العامل:
//  - أمامه باركود  → يُمسح ولا تُقرأ العلبة إطلاقاً
//  - بلا باركود    → يقرأ العلبة تلقائياً، بلا ضغط أي زر
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173';
const [WITH_BARCODE, NO_BARCODE, OUT] = process.argv.slice(2);
const REF = 'uvjjnxemvamwzcturyfq';
const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = `${b({ alg: 'HS256', typ: 'JWT' })}.${b({ sub: 'worker-1', role: 'authenticated', exp })}.sig`;
const session = { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r',
  user: { id: 'worker-1', aud: 'authenticated', role: 'authenticated', email: 'x@expiry.local' } };

const CATALOG = [
  { product_id: 'p1', barcode: '6281000012345', name: 'لبن ربيع كامل الدسم ١ لتر', category_name: 'ألبان وأجبان', default_shelf_life_days: 14, alert_before_days: 3, is_perishable: true },
  { product_id: 'p2', barcode: '6281000067890', name: 'معجون طماطم الكاسر ٨٠٠ غم', category_name: 'معلبات', default_shelf_life_days: 730, alert_before_days: 60, is_perishable: true },
  { product_id: 'p3', barcode: '6281000067906', name: 'معجون طماطم الكاسر ٤٠٠ غم', category_name: 'معلبات', default_shelf_life_days: 730, alert_before_days: 60, is_perishable: true },
];

async function run(video, label) {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
           `--use-file-for-fake-video-capture=${video}`],
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['camera'], locale: 'ar-IQ' });
  await ctx.addInitScript(([ref, s]) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(s)), [REF, session]);
  const page = await ctx.newPage();
  await page.route(`**/${REF}.supabase.co/**`, (route) => {
    const u = route.request().url();
    const body = u.includes('/rest/v1/users')
      ? { id: 'worker-1', store_id: 'store-1', name: 'كرار', phone: '0771', role: 'worker', stores: { name: 'سوبرماركت التجربة' } }
      : u.includes('worker_catalog') ? CATALOG : [];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto(BASE + '/#/scan', { waitUntil: 'networkidle' });

  // لا نضغط أي زر إطلاقاً — ننتظر التطبيق يقرر بنفسه
  const t0 = Date.now();
  await page.waitForSelector('.sheet .panel', { timeout: 45000 });
  await page.waitForFunction(
    () => { const t = document.querySelector('.sheet .panel')?.textContent || ''; return t && !t.includes('جارٍ قراءة'); },
    { timeout: 60000 },
  );
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const txt = (await page.textContent('.sheet .panel')).replace(/\s+/g, ' ').trim();
  if (OUT) await page.screenshot({ path: `${OUT}/shot-auto-${label}.png` });
  await browser.close();
  return { txt, secs };
}

let pass = 0;
const a = await run(WITH_BARCODE, 'barcode');
const aOk = a.txt.includes('تعرّف بالباركود') && a.txt.includes('لبن ربيع');
console.log(`${aOk ? '✓' : '✗'} أمامه باركود → مُسح بالباركود بلا لمسة (${a.secs} ث)`);
console.log(`    ${a.txt.slice(0, 90)}`);
if (aOk) pass++;

const c = await run(NO_BARCODE, 'package');
const cOk = c.txt.includes('تعرّف من اسم العلبة') && c.txt.includes('معجون طماطم');
console.log(`${cOk ? '✓' : '✗'} بلا باركود → قرأ العلبة تلقائياً بلا لمسة (${c.secs} ث)`);
console.log(`    ${c.txt.slice(0, 90)}`);
if (cOk) pass++;

console.log(`\nنجح ${pass} من 2`);
process.exit(pass === 2 ? 0 : 1);
