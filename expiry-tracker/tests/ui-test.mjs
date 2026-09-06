import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { renderPhotos } from './make-photo.mjs';

const REF = 'uvjjnxemvamwzcturyfq';
const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const OUT = process.argv[2] ?? './tests/screenshots';
const log = [];
const fail = (m) => { log.push('✗ ' + m); };
const pass = (m) => { log.push('✓ ' + m); };

function session(userId) {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${b({ alg: 'HS256', typ: 'JWT' })}.${b({ sub: userId, role: 'authenticated', exp })}.sig`;
  return {
    access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: exp,
    refresh_token: 'r', user: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'x@expiry.local' },
  };
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox'],
});

async function makePage(userId, handlers) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    permissions: ['camera'], locale: 'ar-IQ',
  });
  await ctx.addInitScript(([ref, s]) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(s));
  }, [REF, session(userId)]);

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route(`**/${REF}.supabase.co/**`, async (route) => {
    const url = route.request().url();
    for (const [match, body] of handlers) {
      if (url.includes(match)) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      }
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  return { page, errs, ctx };
}

// ---------------------------------------------------------------- المدير
{
  const { page, errs } = await makePage('admin-1', [
    ['/rest/v1/users', { id: 'admin-1', store_id: 'store-1', name: 'حسين', phone: '0770', role: 'admin', stores: { name: 'سوبرماركت التجربة' } }],
    ['/rest/v1/rpc/dashboard_summary', { expired: { count: 1, value: 18000 }, d7: { count: 2, value: 60000 }, d30: { count: 3, value: 69000 }, d90: { count: 4, value: 2400000 }, unknown: 1, low_conf: 1, today: '2026-09-04' }],
    ['/rest/v1/daily_digests', { title: '4 أصناف تحتاج انتباهك', body: 'قيمتها 518,000 دينار — افتح القائمة لاتخاذ القرار' }],
    ['/rest/v1/v_batch_risk', [
      { batch_id: 'b1', product_name: 'معجون طماطم ٨٠٠غم', barcode: '628', category_name: 'معلبات', quantity: 200, expiry_date: '2026-10-19', days_left: 45, alert_before_days: 60, value_at_risk: 440000, confidence: 'high', received_by_name: 'كرار', is_unknown: false, status: 'active', is_perishable: true },
      { batch_id: 'b2', product_name: 'لبن ربيع ١ لتر', barcode: '627', category_name: 'ألبان', quantity: 40, expiry_date: '2026-09-06', days_left: 2, alert_before_days: 3, value_at_risk: 60000, confidence: 'high', received_by_name: 'كرار', is_unknown: false, status: 'active', is_perishable: true },
      { batch_id: 'b3', product_name: 'صنف مجهول (9999999999999)', barcode: '999', category_name: null, quantity: 5, expiry_date: '2026-09-10', days_left: 6, alert_before_days: 30, value_at_risk: 0, confidence: 'low', received_by_name: 'كرار', is_unknown: true, status: 'active', is_perishable: true },
    ]],
  ]);

  await page.goto(BASE + '/#/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const body = await page.textContent('body');
  body.includes('سوبرماركت التجربة') ? pass('لوحة المدير: اسم المحل ظاهر') : fail('اسم المحل غير ظاهر');
  body.includes('٢٫٤ مليون') ? pass('المبالغ بالأرقام العربية والملايين') : fail('تنسيق المبلغ: ' + body.slice(0, 200));
  await page.screenshot({ path: OUT + '/shot-admin-dashboard.png' });

  await page.click('a[href="#/admin/alerts"]');
  await page.waitForTimeout(900);
  const alerts = await page.textContent('body');
  const iTomato = alerts.indexOf('معجون');
  const iMilk = alerts.indexOf('لبن ربيع');
  iTomato > 0 && iTomato < iMilk ? pass('القائمة مرتبة حسب المبلغ لا التاريخ') : fail('الترتيب خاطئ');
  alerts.includes('تنزيل سعر') && alerts.includes('إرجاع للمجهّز') && alerts.includes('إتلاف')
    ? pass('أزرار القرار موجودة على كل سطر') : fail('أزرار القرار ناقصة');
  alerts.includes('باقي يومان') ? pass('صياغة "باقي X يوم" عربية سليمة') : fail('صياغة الأيام');
  await page.screenshot({ path: OUT + '/shot-admin-alerts.png', fullPage: true });

  errs.length === 0 ? pass('لا أخطاء JS في شاشات المدير') : fail('أخطاء: ' + errs.join(' | '));
}

// ---------------------------------------------------------------- العامل
{
  const { page, errs, ctx } = await makePage('worker-1', [
    ['/rest/v1/users', { id: 'worker-1', store_id: 'store-1', name: 'كرار', phone: '0771', role: 'worker', stores: { name: 'سوبرماركت التجربة' } }],
    ['/rest/v1/rpc/worker_catalog', [{ barcode: '6281000012345', name: 'لبن ربيع ١ لتر', category_name: 'ألبان وأجبان', default_shelf_life_days: 14, alert_before_days: 3, is_perishable: true }]],
    ['/rest/v1/rpc/worker_lookup', [{ found: true, product_id: 'p1', product_name: 'لبن ربيع ١ لتر', category_name: 'ألبان وأجبان', is_perishable: true, default_shelf_life_days: 14, suggested_expiry: null, last_expiry: null }]],
    ['/rest/v1/rpc/current_store_id', 'store-1'],
    ['/rest/v1/rpc/record_batch', [{ batch_id: 'nb1', product_name: 'لبن ربيع ١ لتر', was_unknown: false }]],
  ]);

  await page.goto(BASE + '/#/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  page.url().endsWith('/scan') ? pass('العامل يُحوَّل للكاميرا مباشرة، لا لوحة') : fail('مسار العامل: ' + page.url());
  const scanBody = await page.textContent('body');
  /سعر|كلفة|دينار/.test(scanBody) ? fail('ظهرت أسعار في شاشة العامل!') : pass('لا أسعار إطلاقاً في شاشة العامل');
  await page.screenshot({ path: OUT + '/shot-worker-camera.png' });

  // الشاشة تلتقط تلقائياً حين تثبت الكاميرا، والكاميرا الوهمية ثابتة دائماً —
  // فقد تكون ورقة تأكيد فُتحت من تلقائها. نغلقها قبل أن نبدأ الإدخال اليدوي.
  const stray = page.locator('.sheet .panel button:has-text("إلغاء")');
  if (await stray.count()) { await stray.click(); await page.waitForTimeout(300); }

  // مسار الإدخال اليدوي → شاشة التأكيد
  await page.click('text=إدخال الباركود يدوياً');
  await page.waitForTimeout(300);
  for (const d of '6281000012345') {
    await page.click(`.keypad button:has-text("${Number(d).toLocaleString('ar-IQ')}")`);
  }
  await page.click('button:has-text("متابعة")');
  await page.waitForTimeout(1200);
  const sheet = await page.textContent('.sheet .panel');
  sheet.includes('لبن ربيع') ? pass('التعرف على المنتج من الباركود') : fail('لم يتعرف: ' + sheet.slice(0, 120));

  // القراءة تبدأ فوراً بالخلفية، والتاريخ المحسوب معروض ولا ينتظرها
  const dateBox = await page.textContent('.sheet .date-box');
  /[\d٠-٩]/.test(dateBox) ? pass('التاريخ المقترح معروض فوراً بلا انتظار القراءة') : fail('لا تاريخ معروض: ' + dateBox.slice(0, 80));
  sheet.includes('جارٍ قراءة التاريخ من الصورة') || sheet.includes('محسوب من عمر المجموعة')
    ? pass('محرك قراءة التاريخ موصول بشاشة العامل')
    : fail('حالة القراءة غير ظاهرة: ' + sheet.slice(0, 160));
  await page.screenshot({ path: OUT + '/shot-worker-confirm.png' });

  // زرّ التأكيد يعمل حتى والقراءة جارية — العامل لا ينتظر شيئاً
  const confirmEnabled = await page.locator('.sheet .panel > button.btn:has-text("تأكيد")').isEnabled();
  confirmEnabled ? pass('التأكيد متاح أثناء القراءة — لا انتظار') : fail('التأكيد معطّل أثناء القراءة');

  // تعديل التاريخ بلوحة الأرقام
  await page.click('button:has-text("تعديل التاريخ")');
  await page.waitForTimeout(300);
  const dp = await page.textContent('.sheet .panel');
  dp.includes('بعد ٦ أشهر') ? pass('اختصارات التاريخ الجاهزة') : fail('اختصارات التاريخ');
  const freeText = await page.locator('.sheet input[type="text"]').count();
  freeText === 0 ? pass('لا حقل نص حر للتاريخ') : fail('يوجد حقل نص حر للتاريخ');
  await page.screenshot({ path: OUT + '/shot-worker-datepicker.png' });
  await page.click('button:has-text("رجوع")');
  await page.waitForTimeout(300);

  // لقطة ثانية موجَّهة على التاريخ: على الكارتون الحقيقي التاريخ في جهة
  // والباركود في جهة أخرى، فقد لا يكون التاريخ في الصورة الأولى أصلاً
  const reshoot = page.locator('.sheet .panel button:has-text("صوّر التاريخ وحده")');
  if (await reshoot.count()) {
    pass('يعرض لقطة ثانية للتاريخ حين لم يُقرأ');
    await reshoot.click();
    await page.waitForTimeout(400);
    const aiming = await page.locator('.aim-footer').count();
    const sheetHidden = await page.locator('.sheet .panel').count();
    aiming === 1 && sheetHidden === 0
      ? pass('اللقطة الثانية تفتح التوجيه وتُخفي الورقة ليرى العامل الكاميرا')
      : fail(`التوجيه غير ظاهر (aim=${aiming} sheet=${sheetHidden})`);
    await page.screenshot({ path: OUT + '/shot-worker-aim-date.png' });
    await page.click('.aim-footer button:has-text("صوّر التاريخ")');
    await page.waitForTimeout(1200);
    const back = await page.locator('.sheet .panel').count();
    back === 1 ? pass('بعد اللقطة الثانية يعود إلى شاشة التأكيد') : fail('لم يعد إلى التأكيد');
  } else {
    fail('لا زرّ لتصوير التاريخ وحده رغم أن التاريخ لم يُقرأ');
  }

  // تأكيد → يجب أن يُحفظ محلياً فوراً
  await page.click('.sheet .panel > button.btn:has-text("تأكيد")');
  await page.waitForTimeout(900);
  const afterBody = await page.textContent('body');
  afterBody.includes('حُفظ') ? pass('الحفظ يعطي تأكيداً فورياً') : fail('لا تأكيد بعد الحفظ');
  const stored = await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('expiry-tracker');
    r.onsuccess = () => {
      const db = r.result;
      const q = db.transaction('queue').objectStore('queue').getAll();
      q.onsuccess = () => res(q.result.length);
      q.onerror = () => res(-1);
    };
    r.onerror = () => res(-1);
  }));
  log.push(`   (طابور IndexedDB بعد الحفظ: ${stored})`);
  await page.screenshot({ path: OUT + '/shot-worker-saved.png' });

  // -------------------------------------------- التسجيل مع انقطاع الإنترنت
  const queueLen = () => page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('expiry-tracker');
    r.onsuccess = () => {
      const q = r.result.transaction('queue').objectStore('queue').getAll();
      q.onsuccess = () => res(q.result.length);
      q.onerror = () => res(-1);
    };
    r.onerror = () => res(-1);
  }));

  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.waitForTimeout(300);

  await page.click('text=إدخال الباركود يدوياً');
  await page.waitForTimeout(300);
  for (const d of '6281000012345') {
    await page.click(`.keypad button:has-text("${Number(d).toLocaleString('ar-IQ')}")`);
  }
  await page.click('button:has-text("متابعة")');
  await page.waitForTimeout(1000);
  await page.waitForTimeout(1500);
  const offSheet = await page.textContent('.sheet .panel');
  offSheet.includes('لبن ربيع')
    ? pass('دون اتصال: التعرف على المنتج من الكتالوج المحلي')
    : fail('دون اتصال: لم يتعرف — ' + offSheet.slice(0, 120));
  await page.click('.sheet .panel > button.btn:has-text("تأكيد")');
  await page.waitForTimeout(800);
  const offlineQ = await queueLen();
  offlineQ >= 1 ? pass('دون اتصال: الوجبة محفوظة محلياً (' + offlineQ + ')') : fail('لم تُحفظ محلياً: ' + offlineQ);
  const pill = await page.textContent('body');
  pill.includes('دون اتصال') ? pass('مؤشر انقطاع الاتصال ظاهر للعامل') : fail('لا مؤشر انقطاع');
  await page.screenshot({ path: OUT + '/shot-worker-offline.png' });

  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForTimeout(2500);
  const afterSync = await queueLen();
  afterSync === 0 ? pass('عودة الاتصال: الطابور تزامن وفرغ') : fail('الطابور لم يفرغ: ' + afterSync);

  errs.length === 0 ? pass('لا أخطاء JS في شاشة العامل') : fail('أخطاء: ' + errs.join(' | '));
}

// ------------------------------------------- شاشة «جرّب القراءة» للمدير
{
  const { page, errs } = await makePage('admin-1', [
    ['/rest/v1/users', { id: 'admin-1', store_id: 'store-1', name: 'حسين', phone: '0770', role: 'admin', stores: { name: 'سوبرماركت التجربة' } }],
    ['/rest/v1/rpc/worker_catalog', [
      { barcode: '628', name: 'معجون طماطم الرافدين ٨٠٠غم', category_name: 'معلبات', default_shelf_life_days: 540, alert_before_days: 30, is_perishable: true },
      { barcode: '627', name: 'زيت دوار الشمس زير ١ لتر', category_name: 'زيوت', default_shelf_life_days: 365, alert_before_days: 30, is_perishable: true },
    ]],
    // نفس الردّ يخدم الفحص («هل المفتاح مضبوط؟») والقراءة نفسها
    ['/functions/v1/read-label', { ok: true, configured: true, text: 'معجون طماطم الرافدين ٨٠٠ غم\nEXP 18/09/2027\n' }],
    // القياس الحقيقي من وجبات صوّرها العمال فعلاً
    ['/rest/v1/rpc/reading_accuracy', [{ since: '2026-06-08', batches_total: 40, dates_read: 31,
      dates_kept: 27, dates_fixed: 4, dates_missed: 6, names_read: 12, names_kept: 11, names_fixed: 1 }]],
  ]);

  await page.goto(BASE + '/#/admin/check', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // كارتون حقيقي الشكل: هذا يشغّل مساري القراءة فعلاً في نسخة البناء نفسها
  const yr = new Date().getFullYear() + 1;
  const [shot] = await renderPhotos('tests/.build/photos-ui', [{
    name: 'carton', frameWidth: 1280, boxWidth: 0.6, titleScale: 0.035, textScale: 0.018,
    dateScale: 0.018, dotMatrix: true, dotDensity: 0.7, rotate: -2, blur: 0.4,
    lines: ['معجون طماطم الرافدين', 'صافي الوزن 800 غم', `EXP 18/09/${yr}`],
  }]);
  await page.setInputFiles('input[type=file]',
    { name: 'carton.jpg', mimeType: 'image/jpeg', buffer: readFileSync(shot.file) });
  // المحرك الثاني يُنزَّل ويُقلع عند أول استعمال: نمهله
  await page.waitForFunction(() => document.body.textContent.includes('داخل الجهاز'), null,
                             { timeout: 240000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const body = await page.textContent('body');
  body.includes('١٨‏/٠٩‏/٢٠٢٧') || body.includes('18/09/2027')
    ? pass('جرّب القراءة: عرض التاريخ الذي قرأه')
    : fail('جرّب القراءة: لا تاريخ — ' + body.slice(0, 200));
  body.includes('الرافدين')
    ? pass('جرّب القراءة: طابق الصنف من قائمة المحل')
    : fail('جرّب القراءة: لم يطابق الصنف');
  body.includes('سحابي') && body.includes('داخل الجهاز')
    ? pass('جرّب القراءة: يقارن المحركين جنباً إلى جنب')
    : fail('جرّب القراءة: لا مقارنة بين المحركين');
  body.includes('دقة القراءة على بضاعتك') && body.includes('٨٧٪')
    ? pass('جرّب القراءة: يعرض الدقة المقيسة على بضاعة المحل')
    : fail('جرّب القراءة: لا قياس حقيقي — ' + (body.match(/دقة القراءة[\s\S]{0,160}/) ?? [''])[0]);
  await page.screenshot({ path: OUT + '/shot-admin-check.png', fullPage: true });

  errs.length === 0 ? pass('لا أخطاء JS في شاشة جرّب القراءة') : fail('أخطاء: ' + errs.join(' | '));
}

await browser.close();
console.log(log.join('\n'));
