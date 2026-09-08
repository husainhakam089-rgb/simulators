/* =========================================================================
   بروتوكول الاختبار (القسم ٧ من الخطة)
   أ. اختبار وظيفي آلي بـ jsdom: تنقّل بين الفصول والتجارب، ضغط كل زر مرتين،
      تحريك كل منزلق إلى أربع قيم، فحص السايدبار وقيم المنزلقات، تبديل المظهر.
   ب. فحص بصري: تصيير كل تجربة إلى PNG بأبعاد 900×480 (الحالة الافتراضية
      + حالة لكل زر تبديل) لفحصها بالعين.

   التشغيل:  node tests/run-tests.js [outDir]
   ========================================================================= */
const fs   = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT    = path.resolve(__dirname, '..');
const HTML    = path.join(ROOT, 'index.html');
const OUT_DIR = process.argv[2] || path.join(ROOT, 'tests', 'shots');

const errors = [];
const note   = (m)=> console.log('   ' + m);

function fail(where, e){
  errors.push(where + ' :: ' + (e && e.stack ? e.stack.split('\n')[0] : e));
}

const vc = new VirtualConsole();
vc.on('jsdomError', e => fail('jsdomError', e));
vc.on('error',      (...a) => fail('console.error', a.join(' ')));

const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'file://' + HTML
});
const { window } = dom;
const doc = window.document;
window.addEventListener('error', e => fail('window.onerror', e.error || e.message));

const $  = (s)=> doc.querySelector(s);
const $$ = (s)=> Array.from(doc.querySelectorAll(s));
const click = (el)=>{ el.dispatchEvent(new window.MouseEvent('click', {bubbles:true})); };

/* يستدعي رسم إطار واحد ويلتقط أي استثناء داخل كود التجربة نفسه */
function draw(where){
  try { window.redrawOnce(); }
  catch(e){ fail('draw ' + where, e); }
}

function savePng(name){
  try{
    const url = $('#simCanvas').toDataURL('image/png');
    fs.writeFileSync(path.join(OUT_DIR, name + '.png'),
                     Buffer.from(url.split(',')[1], 'base64'));
  }catch(e){ fail('png ' + name, e); }
}

function run(){
  fs.mkdirSync(OUT_DIR, { recursive: true });

  /* --- 0. شاشة الترحيب --- */
  if (doc.body.classList.contains('started')) fail('welcome', 'التطبيق بدأ قبل الضغط على «ابدأ»');
  click($('#startBtn'));
  if (!doc.body.classList.contains('started')) fail('welcome', 'زر «ابدأ» لم يعمل');
  if (doc.body.classList.contains('in-chapter'))
    fail('welcome', 'بعد «ابدأ» ظهرت التجارب بدل شاشة اختيار الفصل');

  /* --- 1. شاشة اختيار الفصل --- */
  const cards = $$('.chapter-card');
  const CHAPTERS = window.CHAPTERS || window.eval('CHAPTERS');
  const chapterNums = Object.keys(CHAPTERS).map(Number);
  if (cards.length !== chapterNums.length)
    fail('chapters', 'عدد البطاقات ' + cards.length + ' لا يساوي عدد الفصول ' + chapterNums.length);

  chapterNums.forEach(num=>{
    const ch = CHAPTERS[num];
    console.log('\n■ الفصل ' + num + ' — ' + ch.title);

    /* الدخول من البطاقة نفسها (لا باستدعاء الدالة) */
    click(cards[chapterNums.indexOf(num)]);
    if (!doc.body.classList.contains('in-chapter')) fail('ch'+num, 'البطاقة لم تدخل الفصل');
    const tabBtns = $$('.tab-btn');
    if (tabBtns.length !== ch.tabs.length)
      fail('ch'+num, 'عدد التبويبات ' + tabBtns.length + ' لا يساوي ' + ch.tabs.length);
    if (!tabBtns[0] || !tabBtns[0].classList.contains('active'))
      fail('ch'+num, 'أول تبويب لم يُفتح تلقائيًّا');
    if ($('#chapterBadge').textContent.trim() === '')
      fail('ch'+num, 'اسم الفصل لا يظهر في الهيدر');

    ch.tabs.forEach(id=>{
      const btn = $$('.tab-btn').find(b=> Number(b.dataset.tab)===id);
      if(!btn){ fail('tab'+id, 'لا يوجد زر تبويب'); return; }
      click(btn);
      note('▸ تجربة ' + id + ' — ' + $('#mainTitle').textContent);

      /* السايدبار امتلأ */
      if ($$('#toolsList li').length < 3) fail('tab'+id, 'أدوات النشاط أقل من ٣');
      if ($$('#stepsList li').length < 4) fail('tab'+id, 'خطوات النشاط أقل من ٤');
      if (!$('#mainTitle').textContent.trim() || !$('#mainSubtitle').textContent.trim())
        fail('tab'+id, 'عنوان التجربة أو وصفها فارغ');

      const panel = $('.control-panel[data-tab="'+id+'"]');
      if(!panel){ fail('tab'+id, 'لا توجد لوحة تحكم'); return; }
      if(!panel.classList.contains('active')) fail('tab'+id, 'لوحة التحكم لم تُفعَّل');

      draw('tab'+id+' افتراضي');
      savePng('t'+id+'-default');

      /* كل زر يُضغط مرتين (تشغيل وإرجاع)، مع لقطة بعد الضغطة الأولى */
      const buttons = Array.from(panel.querySelectorAll('button'));
      buttons.forEach((b, bi)=>{
        const label = (b.textContent||'').trim().slice(0,24);
        try{
          click(b); draw('tab'+id+' زر '+label);
          savePng('t'+id+'-btn'+bi);
          click(b); draw('tab'+id+' زر '+label+' (إرجاع)');
        }catch(e){ fail('tab'+id+' زر '+label, e); }
      });

      /* كل منزلق إلى أربع قيم: الأدنى، ٣٧٪، المنتصف، الأقصى */
      const ranges = Array.from(panel.querySelectorAll('input[type=range]'));
      ranges.forEach((r, ri)=>{
        const mn = Number(r.min), mx = Number(r.max), st = Number(r.step)||1;
        const snap = v => String(mn + Math.round((v-mn)/st)*st);
        [mn, mn+(mx-mn)*0.37, (mn+mx)/2, mx].forEach(v=>{
          r.value = snap(v);
          r.dispatchEvent(new window.Event('input', {bubbles:true}));
          draw('tab'+id+' منزلق '+r.dataset.target+'='+r.value);
          const lab = doc.getElementById(r.dataset.label);
          const txt = lab ? lab.textContent.trim() : '';
          if (!txt || txt === 'NaN' || txt === 'undefined')
            fail('tab'+id, 'قيمة المنزلق المعروضة غير صالحة: «'+txt+'» لـ '+r.dataset.target);
        });
        /* لقطة عند الحد الأقصى: هنا تظهر الأسهم الطويلة والنصوص الخارجة عن الإطار */
        r.value = String(mx);
        r.dispatchEvent(new window.Event('input', {bubbles:true}));
        draw('tab'+id+' منزلق أقصى');
        savePng('t'+id+'-max'+ri);
        /* أعِد المنزلق إلى قيمته الأصلية حتى لا تتلوث اللقطات اللاحقة */
        r.value = r.getAttribute('value');
        r.dispatchEvent(new window.Event('input', {bubbles:true}));
      });
      draw('tab'+id+' بعد المنزلقات');
    });

    /* الرجوع إلى شاشة الفصول */
    click($('#backBtn'));
    if (doc.body.classList.contains('in-chapter')) fail('ch'+num, 'زر الرجوع لم يعمل');
  });

  /* --- 2. حفظ الحالة بعد الرجوع --- */
  click(cards[0]);
  const firstTab = CHAPTERS[chapterNums[0]].tabs[0];
  const stBefore = JSON.stringify(window['t'+firstTab+'State']);
  click($('#backBtn'));
  click(cards[0]);
  if (JSON.stringify(window['t'+firstTab+'State']) !== stBefore)
    fail('state', 'حالة التجربة تغيّرت بعد الرجوع والعودة');

  /* --- 3. المظهر الفاتح: أعِد رسم كل التجارب --- */
  click($('#themeToggleBtn'));
  if (doc.documentElement.getAttribute('data-theme') !== 'light')
    fail('theme', 'تبديل المظهر الفاتح لم يعمل');
  chapterNums.forEach(num=>{
    click(cards[chapterNums.indexOf(num)]);
    CHAPTERS[num].tabs.forEach(id=>{
      click($$('.tab-btn').find(b=> Number(b.dataset.tab)===id));
      draw('light t'+id);
      savePng('t'+id+'-light');
    });
    click($('#backBtn'));
  });
  click($('#themeToggleBtn'));   // رجوع إلى الداكن

  /* --- 4. حلقة الرسم لا تعمل خارج شاشة التجارب --- */
  if (window.eval('rafId') !== null)
    fail('loop', 'حلقة الرسم ما زالت تعمل في شاشة اختيار الفصل');
  if (window.eval('activeTab') !== null)
    fail('loop', 'ما زالت هناك تجربة نشطة في شاشة اختيار الفصل');
}

try { run(); } catch(e){ fail('runner', e); }

setTimeout(()=>{
  console.log('\n──────────────────────────────');
  console.log('اللقطات في: ' + OUT_DIR);
  if (errors.length === 0){
    console.log('✅ اختبار jsdom: صفر أخطاء');
    process.exit(0);
  }
  console.log('❌ عدد الأخطاء: ' + errors.length);
  errors.forEach(e=> console.log('   • ' + e));
  process.exit(1);
}, 400);
