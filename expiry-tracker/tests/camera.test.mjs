// اختبار المسار الكامل من الكاميرا: كارتون حقيقي أمام العدسة ← مسح الباركود ←
// التعرف على المنتج ← قراءة تاريخ الانتهاء من الصورة ← شاشة التأكيد.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173';
const VIDEO = process.argv[2];
const OUT = process.argv[3] ?? '.';
const REF = 'uvjjnxemvamwzcturyfq';

const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = `${b({ alg: 'HS256', typ: 'JWT' })}.${b({ sub: 'worker-1', role: 'authenticated', exp })}.sig`;
const session = {
  access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r',
  user: { id: 'worker-1', aud: 'authenticated', role: 'authenticated', email: 'x@expiry.local' },
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: [
    '--no-sandbox',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    `--use-file-for-fake-video-capture=${VIDEO}`,
  ],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  permissions: ['camera'], locale: 'ar-IQ',
});
await ctx.addInitScript(([ref, s]) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(s)), [REF, session]);

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.route(`**/${REF}.supabase.co/**`, (route) => {
  const u = route.request().url();
  const body = u.includes('/rest/v1/users')
    ? { id: 'worker-1', store_id: 'store-1', name: 'كرار', phone: '0771', role: 'worker', stores: { name: 'سوبرماركت التجربة' } }
    : u.includes('worker_catalog')
      ? [{ barcode: '6281000012345', name: 'لبن ربيع ١ لتر', category_name: 'ألبان وأجبان', default_shelf_life_days: 14, alert_before_days: 3, is_perishable: true }]
      : [];
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});

await page.goto(BASE + '/#/scan', { waitUntil: 'networkidle' });

// ننتظر أن تمسك الكاميرا الباركود وحدها — بلا أي لمسة
await page.waitForSelector('.sheet .panel', { timeout: 30000 });
const scanned = await page.textContent('.sheet .panel');
const okProduct = scanned.includes('لبن ربيع');
console.log(`${okProduct ? '✓' : '✗'} الكاميرا مسحت الباركود وتعرّفت على المنتج بلا لمسة واحدة`);

// ثم ننتظر أن تنتهي القراءة وتُحدَّث شاشة التأكيد
await page.waitForFunction(
  () => !document.querySelector('.sheet .panel')?.textContent?.includes('جارٍ قراءة'),
  { timeout: 40000 },
);
const after = await page.textContent('.sheet .panel');
const year = new Date().getFullYear() + 1;
const expected = new Intl.DateTimeFormat('ar-IQ', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'gregory' })
  .format(new Date(year, 11, 25));
const okRead = after.includes('قُرئ من صورة الكارتون');
const okDate = after.includes(expected);
console.log(`${okRead ? '✓' : '✗'} قرأ التاريخ من صورة الكارتون`);
console.log(`${okDate ? '✓' : '✗'} التاريخ المقروء صحيح (${expected})`);
await page.screenshot({ path: OUT + '/shot-worker-ocr.png' });

console.log(errs.length === 0 ? '✓ لا أخطاء JS' : '✗ أخطاء: ' + errs.join(' | '));
await browser.close();
process.exit(okProduct && okRead && okDate && errs.length === 0 ? 0 : 1);
