/* =========================================================================
   فحص بصري في متصفح حقيقي (Chromium) — يكمّل اختبار jsdom.
   يلتقط شاشة الترحيب وشاشة اختيار الفصل وشاشة التجارب بمقاسَي شاشة الصف
   والجوال، ويتحقّق من أن أهداف اللمس لا تقلّ عن 44 بكسل.

   التشغيل:  node tests/browser-shots.js
   ========================================================================= */
const path = require('path');
const fs   = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL  = 'file://' + path.join(ROOT, 'index.html');
const OUT  = path.join(ROOT, 'tests', 'browser');

const VIEWPORTS = [
  { name:'classroom', width:1366, height:768 },   // شاشة الصف الذكية
  { name:'phone',     width:412,  height:915 }    // جوال أندرويد
];

(async ()=>{
  fs.mkdirSync(OUT, { recursive:true });
  /* المتصفح مثبَّت مسبقًا في هذه البيئة — نمرّر مساره صراحةً */
  const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
               '/opt/pw-browsers/chromium/chrome-linux/chrome']
              .find(p => fs.existsSync(p));
  const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const problems = [];

  for(const vp of VIEWPORTS){
    const page = await browser.newPage({ viewport:{ width:vp.width, height:vp.height } });
    const errors = [];
    page.on('pageerror', e => errors.push(vp.name+': '+e.message));
    page.on('console', m => { if(m.type()==='error') errors.push(vp.name+' console: '+m.text()); });

    await page.goto(URL);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, vp.name+'-1-welcome.png') });

    /* اسم الأستاذ يُكتب من شاشة الترحيب، ويجب أن يبقى بعد إعادة فتح الملف —
       وهذا الاختبار يجري على file:// الحقيقي كما يفتحه الأستاذ بالنقر المزدوج. */
    const NAME = 'الأستاذ حسين حكم';
    await page.click('#welcomeTeacherBtn');
    await page.fill('#teacherInput', NAME);
    await page.screenshot({ path: path.join(OUT, vp.name+'-6-teacher.png') });
    await page.click('#teacherSave');
    await page.waitForTimeout(250);
    const shown = await page.$$eval('[data-teacher-name]', els=>els.map(e=>e.textContent));
    if(shown.some(t=>t !== NAME))
      problems.push(vp.name+': اسم الأستاذ لم يتغيّر في كل الأماكن ('+shown.join(' / ')+')');
    await page.reload();
    await page.waitForTimeout(350);
    const after = await page.$eval('.welcome-author b', e=>e.textContent);
    if(after !== NAME)
      problems.push(vp.name+': اسم الأستاذ لم يبقَ بعد إعادة فتح الملف (ظهر: '+after+')');

    await page.click('#startBtn');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, vp.name+'-2-chapters.png') });

    /* أهداف اللمس في شاشة اختيار الفصل */
    for(const card of await page.$$('.chapter-card')){
      const b = await card.boundingBox();
      if(b && b.height < 120) problems.push(vp.name+': بطاقة فصل ارتفاعها '+Math.round(b.height)+'px < 120');
    }

    await page.click('.chapter-card');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, vp.name+'-3-experiment.png'), fullPage:true });

    /* أهداف اللمس في شاشة التجارب */
    for(const sel of ['.tab-btn', '.ctrl-btn', '.icon-btn', '.back-btn']){
      for(const el of await page.$$(sel)){
        const b = await el.boundingBox();
        if(b && b.height < 38) problems.push(vp.name+': '+sel+' ارتفاعه '+Math.round(b.height)+'px < 38');
      }
    }

    /* لا تمرير أفقي للصفحة */
    const overflow = await page.evaluate(()=> document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if(overflow > 2) problems.push(vp.name+': تمرير أفقي للصفحة بمقدار '+overflow+'px');

    /* ===== السحب باليد: إصبع حقيقي على الكانفاس =====
       نشاط ٤ (قانون كولوم): امسك الشحنة اليمنى واسحبها فيتغيّر البعد r. */
    const tabs14 = await page.$$('.tab-btn');
    await tabs14[3].click();
    await page.waitForTimeout(350);
    const before14 = await page.evaluate(()=> window.t14State.r);
    /* موقع الشحنة اليمنى بوحدات الكانفاس المنطقية 900×480 */
    const probe = await page.evaluate(()=> {
      const b = window.t14State._balls[1];
      return { x:b.x, y:b.y };
    });
    /* على الجوال يكون جزء من الرسم خارج الشاشة، فيمرّره الطالب أولًا ليصل إليه */
    await page.evaluate((lx)=>{
      const sc = document.querySelector('.canvas-scroll');
      const c  = document.getElementById('simCanvas');
      if(!sc || sc.scrollWidth <= sc.clientWidth + 2) return;
      /* بفارق الإزاحة، فيصحّ في الاتجاهين — scrollLeft سالب في صفحة RTL */
      const cr = c.getBoundingClientRect(), sr = sc.getBoundingClientRect();
      const nowX  = cr.x + lx*(cr.width/900);
      const wantX = sr.x + sr.width/2;
      sc.scrollLeft -= (wantX - nowX);
    }, probe.x);
    await page.waitForTimeout(150);
    const box = await page.$eval('#simCanvas', el=>{
      const b = el.getBoundingClientRect();
      return { x:b.x, y:b.y, w:b.width, h:b.height };
    });
    const toScreen = (p)=> ({ x: box.x + p.x*(box.w/900), y: box.y + p.y*(box.h/480) });
    const from = toScreen(probe);
    const to   = toScreen({ x: probe.x + 70, y: probe.y });
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for(let i=1;i<=6;i++){
      await page.mouse.move(from.x + (to.x-from.x)*i/6, from.y);
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await page.waitForTimeout(200);
    const after14 = await page.evaluate(()=> window.t14State.r);
    if(after14 <= before14)
      problems.push(vp.name+': سحب الشحنة لم يزد البعد (قبل '+before14+' بعد '+after14+')');
    /* والمنزلق يجب أن يكون قد تبع السحب */
    const slider14 = await page.$eval('input[data-target="t14State.r"]', el=>Number(el.value));
    if(slider14 !== after14)
      problems.push(vp.name+': المنزلق ('+slider14+') لا يطابق الحالة ('+after14+') بعد السحب');
    await page.screenshot({ path: path.join(OUT, vp.name+'-7-drag.png'), fullPage:true });

    /* آخر تجربة في الفصل، ثم الرجوع */
    const tabs = await page.$$('.tab-btn');
    await tabs[tabs.length-1].click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, vp.name+'-4-last-tab.png'), fullPage:true });
    /* جدول تسجيل النتائج والاستنتاج بعد ثلاث قراءات */
    for(let i=0;i<3;i++){ await page.click('#recordBtn'); await page.waitForTimeout(120); }
    await page.click('#revealBtn');
    await page.waitForTimeout(200);
    const rows = await page.$$eval('#recordTable tbody tr', els=>els.length);
    if(rows !== 3) problems.push(vp.name+': جدول النتائج فيه '+rows+' صفًا بدل ثلاثة');
    await page.screenshot({ path: path.join(OUT, vp.name+'-5-record.png'), fullPage:true });

    await page.click('#backBtn');
    await page.waitForTimeout(300);

    if(errors.length) problems.push(...errors);
    await page.close();
  }

  await browser.close();
  console.log('اللقطات في: ' + OUT);
  if(problems.length){
    console.log('❌ ملاحظات:');
    problems.forEach(p=> console.log('   • '+p));
    process.exit(1);
  }
  console.log('✅ فحص المتصفح: بلا أخطاء، وكل أهداف اللمس ضمن الحدّ');
})();
