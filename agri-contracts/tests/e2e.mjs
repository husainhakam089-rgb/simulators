// اختبار شامل في متصفح حقيقي: node tests/e2e.mjs
// يشغّل خادماً محلياً لمجلد www ويقود التطبيق كما يقوده المستخدم.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5179;
let failures = 0;
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures++; };

const httpServer = (() => { try { return require.resolve('http-server/bin/http-server'); } catch { return '/opt/node22/lib/node_modules/http-server/bin/http-server'; } })();
const server = spawn(process.execPath, [httpServer, join(root, 'www'), '-p', String(PORT), '-s', '-c-1']);
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const popups = [];
page.on('popup', (p) => popups.push(p));

try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.nav__btn');

  // عقد محفوظ مسبقاً بحجم ورقم محرك قديم
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    await db.put('contracts', {
      id: 'c_test', kind: 'contract', number: 7, date: '2026-10-27', time: '10:30', day: 'الثلاثاء',
      machineType: 'ساحبة', brand: 'نيوهولاند', model: '2022', color: 'أزرق', chassis: 'AB123',
      size: '75 حصان', engineNo: 'ENG-OLD-999', plate: '1234', governorate: 'نينوى',
      amount: 25000000, paid: 20000000, amountWords: 'خمسة وعشرون مليون دينار', notes: '',
      seller: { name: 'أحمد علي' }, buyer: { name: 'محمد حسن' }, copies: ['buyer', 'shop'],
      createdAt: Date.now(), updatedAt: Date.now(),
    });
  });

  // --- محتوى العقد المطبوع
  const html = await page.evaluate(async () => {
    const { buildHtml } = await import('/js/docbuild.js');
    const s = (await import('/js/settings.js')).current();
    const db = await import('/js/db.js');
    return buildHtml('contract', await db.get('contracts', 'c_test'), s, ['shop']);
  });
  check(html.includes('>الحجم<'), 'خانة «الحجم» في العقد');
  check(html.includes('٧٥ حصان'), 'قيمة الحجم مطبوعة بأرقام عربية');
  check(!html.includes('رقم المحرك') && !html.includes('ENG-OLD-999'), 'رقم المحرك لم يعد يُطبع');
  check(!/class="stamp/.test(html), 'لا ختم بدون صورة ختم');

  const withStamp = await page.evaluate(async () => {
    const { buildHtml } = await import('/js/docbuild.js');
    const s = { ...(await import('/js/settings.js')).current(), stampImage: 'data:image/png;base64,iVBORw0KGgo=' };
    const db = await import('/js/db.js');
    return buildHtml('contract', await db.get('contracts', 'c_test'), s, ['shop']);
  });
  check(/<img class="stamp stamp--photo"/.test(withStamp), 'صورة الختم الحقيقي تُطبع إن رُفعت');

  // --- شاشة تحرير العقد
  await page.evaluate(async () => (await import('/js/router.js')).go('contract', { id: 'c_test' }));
  await page.waitForSelector('text=الحجم');
  const labels = await page.$$eval('.field__label', (els) => els.map((e) => e.textContent));
  check(labels.some((l) => l.includes('الحجم')), 'حقل الحجم في النموذج');
  check(!labels.some((l) => l.includes('رقم المحرك')), 'لا حقل لرقم المحرك');

  // --- المعاينة داخل التطبيق
  const before = await page.evaluate(() => location.hash);
  await page.click('button:has-text("معاينة")');
  await page.waitForSelector('.docview');
  check(popups.length === 0, 'المعاينة لا تفتح نافذة جديدة');
  const x = await page.$('.docview__x');
  check(x && (await x.textContent()).includes('خروج'), 'زر «خروج» ظاهر في المعاينة');
  check(!(await page.$('.docview button:has-text("حذف")')), 'لا زر حذف في المعاينة');
  const box = await page.evaluate(() => {
    const st = document.querySelector('.docview__stage').getBoundingClientRect();
    return { w: st.width, vw: innerWidth };
  });
  check(box.w <= box.vw, `العقد كاملاً بعرض الشاشة (${Math.round(box.w)} ≤ ${box.vw})`);
  await page.waitForTimeout(500);
  const frameText = await page.frames()[1]?.evaluate(() => document.body.innerText).catch(() => '');
  check(frameText.includes('الحجم') && frameText.includes('نيوهولاند'), 'العقد ظاهر داخل المعاينة');

  await page.click('.docview__x');
  await page.waitForTimeout(300);
  check(!(await page.$('.docview')), 'زر الخروج يغلق المعاينة');
  check((await page.evaluate(() => location.hash)) === before && !!(await page.$('text=الحجم')), 'يبقى على شاشة العقد بعد الخروج');

  // زر الرجوع (كزر الهاتف) يغلق المعاينة ولا يغادر الشاشة
  await page.click('button:has-text("معاينة")');
  await page.waitForSelector('.docview');
  await page.goBack();
  await page.waitForTimeout(300);
  check(!(await page.$('.docview')), 'زر الرجوع يغلق المعاينة');
  check(!!(await page.$('text=الحجم')), 'زر الرجوع لا يغادر شاشة العقد');

  // --- السجل: فتح، تعديل، حذف
  await page.evaluate(async () => (await import('/js/router.js')).go('history'));
  await page.waitForTimeout(400);
  const row = await page.$('text=محمد حسن');
  check(!!row, 'العقد في السجل');
  await row.click();
  await page.waitForSelector('.docview');
  check(!!(await page.$('.docview button:has-text("تعديل")')), 'زر التعديل في عارض السجل');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(!(await page.$('.docview')), 'Escape يغلق العارض');

  await (await page.$('text=محمد حسن')).click();
  await page.waitForSelector('.docview');
  await page.click('.docview button:has-text("تعديل")');
  await page.waitForTimeout(500);
  check(!(await page.$('.docview')) && !!(await page.$('text=الحجم')), 'تعديل يفتح شاشة العقد');
  await page.goBack();
  await page.waitForTimeout(500);
  check(!(await page.$('.docview')) && (await page.evaluate(() => location.hash)) === '#history', 'الرجوع من التعديل يعود للسجل');

  await (await page.$('text=محمد حسن')).click();
  await page.waitForSelector('.docview');
  await page.click('.docview button:has-text("حذف")');
  await page.click('.sheet button:has-text("احذف")');
  await page.waitForTimeout(600);
  const gone = await page.evaluate(async () => !(await (await import('/js/db.js')).get('contracts', 'c_test')));
  check(gone && !(await page.$('.docview')), 'الحذف يحذف ويغلق العارض');
  check(!(await page.$('text=محمد حسن')), 'السجل يتحدّث بعد الحذف');

  // --- الإعدادات: لا خانات للختم المرسوم ولا لرقم المحرك
  await page.evaluate(async () => (await import('/js/router.js')).go('settings'));
  await page.waitForTimeout(400);
  const st = await page.evaluate(() => document.body.innerText);
  check(st.includes('صورة ختم المعرض') && !st.includes('رقم المحرك'), 'الإعدادات محدّثة');
} finally {
  check(errors.length === 0, `بلا أخطاء JavaScript ${errors.join(' | ')}`);
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} فشل` : '\nكل الاختبارات ناجحة');
process.exit(failures ? 1 : 0);
