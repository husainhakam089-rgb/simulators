// تجربة كاملة كما يستعملها صاحب المعرض، على نسخة الملف الواحد: node tests/flow.mjs
// عقد جديد من النموذج ← حفظ ← فتحه من السجل، ثم وصل جديد بنفس الطريقة.

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'عقود-البركة.html');
let failures = 0;
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures++; };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const card = (title) => page.locator('.card', { has: page.locator('.card__title', { hasText: title }) });
const field = (scope, label) => scope.locator('.field', { has: page.locator('.field__label', { hasText: label }) }).first();
const fill = (scope, label, value) => field(scope, label).locator('input, textarea').first().fill(value);
const pickChip = (scope, label, text) => field(scope, label).locator('.chip', { hasText: text }).first().click();
const nav = (label) => page.locator('.nav__btn', { hasText: label }).click();

async function openFromHistory(name) {
  await nav('السجل');
  await page.waitForTimeout(500);
  await page.locator(`text=${name}`).first().click();
  await page.waitForSelector('.docview');
  await page.waitForTimeout(800);
  return page.frames()[1].evaluate(() => document.body.innerText);
}

try {
  await page.goto(`file://${file}`);
  await page.waitForSelector('.nav__btn');

  /* ----- عقد جديد ----- */
  await nav('عقد');
  await page.waitForSelector('text=عقد بيع جديد');
  const m = card('بيانات الآلية');
  await pickChip(m, 'نوع الآلية', 'حاصدة');
  await pickChip(m, 'الماركة', 'نيوهولاند');
  await fill(m, 'رقم الشاصي', 'NH-55120');
  await fill(m, 'الحجم', '90 حصان');
  await fill(m, 'المرقمة', '30418');
  const money = card('المبالغ');
  await fill(money, 'المبلغ (رقماً)', '41000000');
  await fill(money, 'وقد قبض منه', '40000000');
  await fill(card('البائع'), 'الاسم', 'كريم عادل منصور');
  await fill(card('المشتري'), 'الاسم', 'زياد طارق سلمان');
  await fill(card('الشهود'), 'الشاهد الأول', 'نزار حميد');
  await page.locator('button', { hasText: 'حفظ العقد' }).click();
  await page.waitForTimeout(800);
  check(await page.locator('button', { hasText: 'حفظ التعديلات' }).count() === 1, 'العقد انحفظ من النموذج');

  let text = await openFromHistory('زياد طارق سلمان');
  check(text.includes('كريم عادل منصور') && text.includes('زياد طارق سلمان'), 'اسم البائع والمشتري في العقد');
  check(text.includes('NH-55120') && text.includes('٩٠ حصان') && text.includes('نيوهولاند'), 'الشاصي والحجم والماركة');
  check(text.includes('واحد وأربعون مليون') && !text.includes('مبلغ قدره مبلغ'), 'المبلغ كتابةً بلا تكرار');
  check(text.includes('١,٠٠٠,٠٠٠') && text.includes('نزار حميد'), 'الباقي واسم الشاهد');
  check(!text.includes('رقم المحرك'), 'لا رقم محرك');
  await page.click('.docview__x');
  await page.waitForTimeout(300);
  check(!(await page.$('.docview')), 'الخروج من العارض');

  /* ----- وصل جديد ----- */
  await nav('وصل');
  await page.waitForSelector('text=حفظ الوصل');
  const tool = page.locator('.field', { has: page.locator('.field__label', { hasText: 'نوع الأداة' }) }).locator('.chip').first();
  const toolName = (await tool.textContent()).trim();
  await tool.click();
  await fill(page, 'اسم المشتري', 'رامي سعيد');
  await fill(page, 'المبلغ (رقماً)', '850000');
  await page.locator('button', { hasText: 'حفظ الوصل' }).click();
  await page.waitForTimeout(800);
  check(await page.locator('button', { hasText: 'حفظ التعديلات' }).count() === 1, 'الوصل انحفظ من النموذج');

  text = await openFromHistory('رامي سعيد');
  check(text.includes('رامي سعيد') && text.includes(toolName), 'اسم الزبون والأداة في الوصل');
  check(text.includes('ثمانمائة وخمسون ألف') && !text.includes('قدره مبلغ قدره'), 'مبلغ الوصل كتابةً بلا تكرار');
  await page.goBack();
  await page.waitForTimeout(300);
  check(!(await page.$('.docview')), 'زر الرجوع يغلق العارض');
} finally {
  check(errors.length === 0, `بلا أخطاء JavaScript ${errors.join(' | ')}`);
  await browser.close();
}
console.log(failures ? `\n${failures} فشل` : '\nكل الاختبارات ناجحة');
process.exit(failures ? 1 : 0);
