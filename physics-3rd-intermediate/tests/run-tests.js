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
  /* أصل عادي بدل file:// لأن jsdom يمنع localStorage على الأصل المعتم،
     ومسار file:// الحقيقي يختبره tests/browser-shots.js في Chromium. */
  url: 'http://localhost/physics/index.html'
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

/* «لا شيء يُرسم خارج الإطار»: الإطار الخارجي للكانفاس يجب أن يبقى بلون الخلفية
   وحده. أي نص أو سهم يزحف إلى الحافة يغيّر لون هذه البكسلات فيُكشف هنا. */
function checkFrame(where){
  try{
    const c = $('#simCanvas');
    const cx = c.getContext('2d');
    const W = c.width, H = c.height, M = 3;
    const d = cx.getImageData(0,0,W,H).data;
    const at = (x,y)=> (y*W + x)*4;
    const bg = [d[at(2,2)], d[at(2,2)+1], d[at(2,2)+2]];
    const off = [];
    const test = (x,y)=>{
      const i = at(x,y);
      if(Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]) > 24)
        off.push(x+','+y);
    };
    for(let x=0;x<W;x++){ for(let m=0;m<M;m++){ test(x,m); test(x,H-1-m); } }
    for(let y=0;y<H;y++){ for(let m=0;m<M;m++){ test(m,y); test(W-1-m,y); } }
    if(off.length) fail(where, 'رسم يلامس حافة الكانفاس عند ' + off.slice(0,4).join(' / ') +
                               ' (' + off.length + ' بكسل)');
  }catch(e){ fail('frame '+where, e); }
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
  const EXPERIMENTS = window.EXPERIMENTS || window.eval('EXPERIMENTS');
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

      /* بنية النشاط كما في الكتاب: غرض، أدوات، خطوات، جدول نتائج، استنتاج، سؤال */
      const meta = CHAPTERS && EXPERIMENTS ? EXPERIMENTS[id] : null;
      ['purpose','conclusion','question'].forEach(k=>{
        if(!meta || !meta[k] || String(meta[k]).trim().length < 20)
          fail('tab'+id, 'حقل «'+k+'» ناقص أو قصير جدًا');
      });
      if(!meta || !Array.isArray(meta.cols) || meta.cols.length < 3)
        fail('tab'+id, 'أعمدة جدول النتائج ناقصة');
      const readFn = window['t'+id+'Reading'];
      if(typeof readFn !== 'function'){
        fail('tab'+id, 'لا توجد دالة قراءة t'+id+'Reading');
      } else {
        let row = null;
        try { row = readFn(); } catch(e){ fail('tab'+id+' قراءة', e); }
        if(row){
          if(row.length !== meta.cols.length)
            fail('tab'+id, 'القراءة فيها '+row.length+' قيمة والأعمدة '+meta.cols.length);
          row.forEach((v,i)=>{
            const s = String(v);
            if(s === '' || s === 'NaN' || s === 'undefined')
              fail('tab'+id, 'قيمة غير صالحة «'+s+'» في العمود '+(meta.cols[i]||i));
          });
        }
      }

      /* تسجيل قراءتين ثم مسح الجدول */
      const recBtn = doc.getElementById('recordBtn');
      click(recBtn); click(recBtn);
      const bodyRows = $$('#recordTable tbody tr').length;
      if(bodyRows !== 2) fail('tab'+id, 'جدول النتائج فيه '+bodyRows+' صفًا بعد تسجيل قراءتين');
      const headCells = $$('#recordTable thead th').length;
      if(headCells !== meta.cols.length + 1)
        fail('tab'+id, 'رؤوس الجدول '+headCells+' والأعمدة المتوقعة '+(meta.cols.length+1));
      click(doc.getElementById('clearRecBtn'));
      if($$('#recordTable tbody tr').length !== 0) fail('tab'+id, 'زر مسح الجدول لم يعمل');

      /* الاستنتاج مخفي حتى يضغط الطالب */
      if(!doc.getElementById('conclusionText').hidden)
        fail('tab'+id, 'الاستنتاج ظاهر قبل الضغط عليه');
      click(doc.getElementById('revealBtn'));
      if(doc.getElementById('conclusionText').hidden)
        fail('tab'+id, 'زر إظهار الاستنتاج لم يعمل');

      /* قيمة كل منزلق عند الفتح يجب أن تطابق قيمة الحالة التي يتحكم بها،
         وإلا عرض الرسم قيمة والمنزلق قيمة أخرى حتى أول لمسة. */
      panel.querySelectorAll('input[type=range][data-target]').forEach(r=>{
        const path = r.dataset.target.split('.');
        let obj = window[path[0]];
        for(let i=1;i<path.length && obj!=null;i++) obj = obj[path[i]];
        if(typeof obj !== 'number'){ fail('tab'+id, 'لا حالة للمنزلق '+r.dataset.target); return; }
        if(Math.abs(Number(r.value) - obj) > 1e-6)
          fail('tab'+id, 'المنزلق '+r.dataset.target+' يبدأ بـ '+r.value+' والحالة '+obj);
        if(obj < Number(r.min) - 1e-6 || obj > Number(r.max) + 1e-6)
          fail('tab'+id, 'قيمة الحالة '+obj+' خارج مدى المنزلق '+r.dataset.target);
      });

      draw('tab'+id+' افتراضي');
      checkFrame('tab'+id+' افتراضي');
      savePng('t'+id+'-default');

      /* كل زر يُضغط مرتين (تشغيل وإرجاع)، مع لقطة بعد الضغطة الأولى */
      const buttons = Array.from(panel.querySelectorAll('button'));
      buttons.forEach((b, bi)=>{
        const label = (b.textContent||'').trim().slice(0,24);
        try{
          click(b); draw('tab'+id+' زر '+label);
          checkFrame('tab'+id+' زر '+label);
          savePng('t'+id+'-btn'+bi);
          click(b); draw('tab'+id+' زر '+label+' (إرجاع)');
        }catch(e){ fail('tab'+id+' زر '+label, e); }
      });

      /* كل منزلق إلى أربع قيم: الأدنى، ٣٧٪، المنتصف، الأقصى */
      const ranges = Array.from(panel.querySelectorAll('input[type=range]'));
      ranges.forEach((r, ri)=>{
        if(r.disabled) return;
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
        checkFrame('tab'+id+' '+r.dataset.target+' أقصى');
        savePng('t'+id+'-max'+ri);
        /* أعِد المنزلق إلى قيمته الأصلية حتى لا تتلوث اللقطات اللاحقة */
        r.value = r.getAttribute('value');
        r.dispatchEvent(new window.Event('input', {bubbles:true}));
      });
      draw('tab'+id+' بعد المنزلقات');

      /* «كل الأرقام محسوبة من القانون وقت التشغيل»: تحريك كل منزلق يجب أن
         يغيّر قراءة النشاط فعلًا — وإلا فالقيمة مكتوبة يدويًا أو غير مرتبطة. */
      if(typeof readFn === 'function'){
        ranges.forEach(r=>{
          if(r.disabled) return;          // منزلق معطَّل عمدًا في هذه الحالة
          const before = JSON.stringify(readFn());
          const mn = Number(r.min), mx = Number(r.max);
          const orig = r.value;
          r.value = String(Math.abs(Number(orig)-mx) > Math.abs(Number(orig)-mn) ? mx : mn);
          r.dispatchEvent(new window.Event('input', {bubbles:true}));
          const after = JSON.stringify(readFn());
          r.value = orig;
          r.dispatchEvent(new window.Event('input', {bubbles:true}));
          if(before === after)
            fail('tab'+id, 'تحريك '+r.dataset.target+' لم يغيّر أي رقم في قراءة النشاط');
        });
      }
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

  /* --- 2ب. اسم الأستاذ يُكتب من الشاشة ويُحفظ --- */
  const slots = ()=> $$('[data-teacher-name]').map(e=>e.textContent);
  if(slots().length < 3) fail('teacher', 'أماكن عرض اسم الأستاذ أقل من ثلاثة');
  const modal = $('#teacherModal');
  if(!modal.hidden) fail('teacher', 'النافذة ظاهرة قبل الضغط');
  click($('#teacherBtn'));
  if(modal.hidden) fail('teacher', 'زر الهيدر لم يفتح النافذة');
  /* الإلغاء لا يغيّر شيئًا */
  const before = slots().join('|');
  $('#teacherInput').value = 'اسم ملغى';
  click($('#teacherCancel'));
  if(!modal.hidden) fail('teacher', 'زر الإلغاء لم يغلق النافذة');
  if(slots().join('|') !== before) fail('teacher', 'الإلغاء غيّر الاسم');
  /* الحفظ يغيّر كل الأماكن */
  click($('#welcomeTeacherBtn'));
  if(modal.hidden) fail('teacher', 'زر شاشة الترحيب لم يفتح النافذة');
  const NAME = 'الأستاذ حسين حكم';
  $('#teacherInput').value = NAME;
  click($('#teacherSave'));
  if(!modal.hidden) fail('teacher', 'النافذة لم تُغلق بعد الحفظ');
  slots().forEach((t,i)=>{ if(t !== NAME) fail('teacher', 'المكان '+(i+1)+' يعرض «'+t+'» بدل الاسم'); });
  /* اسم فارغ يُرفض */
  click($('#teacherBtn'));
  $('#teacherInput').value = '   ';
  click($('#teacherSave'));
  if(modal.hidden) fail('teacher', 'قَبِل اسمًا فارغًا وأغلق النافذة');
  if($('#teacherNote').textContent.trim() === '') fail('teacher', 'لا رسالة عند الاسم الفارغ');
  click($('#teacherCancel'));
  /* وحُفظ في المتصفح ليعود عند إعادة الفتح */
  let stored = null;
  try { stored = window.localStorage.getItem('physics3m.teacherName'); } catch(e){}
  if(stored !== NAME) fail('teacher', 'الاسم لم يُحفظ في المتصفح (القيمة: '+stored+')');

  /* --- 3. المظهر الليلي: الافتراضي نهاري، فالضغطة تنقل إلى الليلي --- */
  if (doc.documentElement.getAttribute('data-theme') !== 'light')
    fail('theme', 'المظهر الافتراضي ليس النهاري');
  click($('#themeToggleBtn'));
  if (doc.documentElement.getAttribute('data-theme') !== 'dark')
    fail('theme', 'الضغطة لم تنقل إلى المظهر الليلي');
  chapterNums.forEach(num=>{
    click(cards[chapterNums.indexOf(num)]);
    CHAPTERS[num].tabs.forEach(id=>{
      click($$('.tab-btn').find(b=> Number(b.dataset.tab)===id));
      draw('dark t'+id);
      checkFrame('dark t'+id);
      savePng('t'+id+'-dark');
    });
    click($('#backBtn'));
  });
  click($('#themeToggleBtn'));   // رجوع إلى النهاري

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
