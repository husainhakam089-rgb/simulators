
/* ══════════════════════════════════════════════════════════════════════════
   7 · وضع الامتحان: «أشّر الأجزاء» + «اختبر نفسك»
   ══════════════════════════════════════════════════════════════════════════ */

/* رسوم الملزمة القابلة للتأشير */
const EXAM_DIAGRAMS = CH.exam;
const dragHost = $('#dragSvgHost');
let exMode = 'label', exDiag = CH.exam[0].k;
let exParts = [], exDone = 0, exWrong = 0;

function shuffle(a){
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function initExam(){
  $('#pickRow').innerHTML = '<span>اختر الرسم:</span>' + EXAM_DIAGRAMS.map(d =>
    `<button class="stool" data-dg="${d.k}"><svg class="ic"><use href="#ic-cell"/></svg><span>${d.t}</span></button>`).join('')
    + '<button class="stool" id="reDraw"><svg class="ic"><use href="#ic-reset"/></svg><span>إعادة المحاولة</span></button>';
  $('#pickRow').querySelectorAll('[data-dg]').forEach(b =>
    b.addEventListener('click', () => loadDiagram(b.dataset.dg)));
  $('#reDraw').addEventListener('click', () => loadDiagram(exDiag));
  setExMode(exMode);
  loadDiagram(exDiag);
  buildQuiz();
}
function setExMode(m){
  exMode = m;
  $('#mLabel').classList.toggle('on', m === 'label');
  $('#mQuiz').classList.toggle('on', m === 'quiz');
  $('#dragWrap').style.display = m === 'label' ? '' : 'none';
  $('#quiz').classList.toggle('on', m === 'quiz');
  updateScore();
}
$('#mLabel').addEventListener('click', () => setExMode('label'));
$('#mQuiz').addEventListener('click', () => setExMode('quiz'));

function updateScore(){
  $('#score').innerHTML = exMode === 'label'
    ? `صحيح <b>${exDone}</b> / ${exParts.length} &nbsp;·&nbsp; أخطاء <b>${exWrong}</b>`
    : `الدرجة <b>${qScore}</b> / ${qList.length} &nbsp;·&nbsp; سؤال ${Math.min(qIdx + 1, qList.length)}`;
}

/* ── أشّر الأجزاء ── */
function loadDiagram(k){
  exDiag = k; exDone = 0; exWrong = 0;
  $('#pickRow').querySelectorAll('[data-dg]').forEach(b => b.classList.toggle('on', b.dataset.dg === k));
  $('#dragDone').classList.remove('on');

  const s = SCENES[k].build();
  exParts = (s.parts || []).filter(p => INFO[p.id]);
  const slots = exParts.map((p, i) => {
    /* عرض ثابت يتّسع داخل هامش الرسم، والاسم يُلفّ على سطرين عند الحاجة */
    const w = p.side === 'C' ? 190 : 126, h = 34;
    const x = p.side === 'R' ? p.label[0] + 8 : p.side === 'L' ? p.label[0] - 8 - w : p.label[0] - w / 2;
    const y = p.label[1] - h / 2 - 4;
    return `<g class="slotG" data-id="${p.id}" data-i="${i}">
      <line class="lead" x1="${n2(p.label[0])}" y1="${n2(p.label[1])}" x2="${n2(p.anchor[0])}" y2="${n2(p.anchor[1])}"/>
      <circle class="lblDot" cx="${n2(p.anchor[0])}" cy="${n2(p.anchor[1])}" r="3.4"/>
      <rect class="slot" x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${h}" rx="6"/>
      <text class="slotTxt" x="${n2(x + w / 2)}" y="${n2(y + h / 2 + 4)}" text-anchor="middle"></text>
    </g>`;
  }).join('');
  fitViewBox();
  dragHost.innerHTML = DEFS + s.body + `<g id="slotLayer">${slots}</g>`;

  $('#tray').innerHTML = shuffle(exParts).map(p =>
    `<button class="chip" data-id="${p.id}">${nameOf(p)}</button>`).join('');
  $('#tray').querySelectorAll('.chip').forEach(c => c.addEventListener('pointerdown', chipDown));
  updateScore();
}

let dragEl = null, dragSrc = null, dragId = null;
function chipDown(ev){
  const src = ev.currentTarget;
  if (src.classList.contains('done')) return;
  ev.preventDefault();
  dragSrc = src; dragId = src.dataset.id;
  dragEl = src.cloneNode(true);
  dragEl.classList.add('drag');
  document.body.appendChild(dragEl);
  moveDrag(ev);
  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}
function moveDrag(ev){
  if (!dragEl) return;
  dragEl.style.left = (ev.clientX - dragEl.offsetWidth / 2) + 'px';
  dragEl.style.top = (ev.clientY - dragEl.offsetHeight / 2) + 'px';
  const hit = slotAt(ev.clientX, ev.clientY);
  dragHost.querySelectorAll('.slot').forEach(s => s.classList.remove('hot'));
  if (hit && !hit.classList.contains('done')) hit.querySelector('.slot').classList.add('hot');
}
function slotAt(x, y){
  let best = null, bd = 1e9;
  dragHost.querySelectorAll('.slotG').forEach(g => {
    const r = g.querySelector('.slot').getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const inside = x > r.left - 22 && x < r.right + 22 && y > r.top - 22 && y < r.bottom + 22;
    const d = Math.hypot(x - cx, y - cy);
    if (inside && d < bd){ bd = d; best = g; }
  });
  return best;
}
function endDrag(ev){
  window.removeEventListener('pointermove', moveDrag);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointercancel', endDrag);
  dragHost.querySelectorAll('.slot').forEach(s => s.classList.remove('hot'));
  const hit = slotAt(ev.clientX, ev.clientY);
  if (dragEl){ dragEl.remove(); dragEl = null; }
  if (!hit || hit.classList.contains('done')){ wrongShake(); return; }
  if (hit.dataset.id === dragId){
    hit.classList.add('done');
    hit.querySelector('.slot').classList.add('done');
    fillSlotText(hit.querySelector('.slotTxt'), dragSrc.textContent);
    dragSrc.classList.add('done');
    exDone++;
    if (exDone === exParts.length){
      const pct = Math.round(exDone / (exDone + exWrong) * 100);
      $('#dragDone').innerHTML = `أحسنت — أكملت تأشير الرسم. صحيح ${exDone} من ${exParts.length}، والأخطاء ${exWrong}. دقتك ${pct}%.`;
      $('#dragDone').classList.add('on');
    }
  } else {
    exWrong++;
    wrongShake();
  }
  updateScore();
}
function fillSlotText(el, name){
  const lines = wrapName(name, 19), x = el.getAttribute('x');
  const y0 = parseFloat(el.getAttribute('y')) - (lines.length - 1) * 5.5;
  el.innerHTML = lines.map((l, i) => `<tspan x="${x}" dy="${i ? 11 : 0}">${l}</tspan>`).join('');
  el.setAttribute('y', String(y0));
}
function wrongShake(){
  if (!dragSrc) return;
  dragSrc.classList.add('wrong');
  setTimeout(() => dragSrc && dragSrc.classList.remove('wrong'), 340);
}

/* ── اختبر نفسك ── */
let qList = [], qIdx = 0, qScore = 0;
function buildQuiz(){
  qList = shuffle(QUIZ); qIdx = 0; qScore = 0;
  renderQ();
}
function renderQ(){
  if (qIdx >= qList.length){
    $('#qMeta').textContent = 'انتهى الاختبار';
    $('#qText').textContent = `درجتك النهائية: ${qScore} من ${qList.length}.`;
    $('#qOpts').innerHTML = '<button class="opt" id="qAgain"><b class="optKey">↻</b><span>أعد الاختبار بأسئلة مخلوطة</span></button>';
    $('#qAgain').addEventListener('click', buildQuiz);
    $('#qWhy').classList.remove('on');
    $('#qNext').classList.remove('on');
    updateScore();
    return;
  }
  const q = qList[qIdx];
  $('#qMeta').textContent = `سؤال ${qIdx + 1} من ${qList.length}`;
  $('#qText').textContent = q.q;
  const AR = ['أ', 'ب', 'ج', 'د'];
  $('#qOpts').innerHTML = q.o.map((o, i) =>
    `<button class="opt" data-i="${i}"><b class="optKey">${AR[i] || (i + 1)}</b><span>${o}</span></button>`).join('');
  $('#qOpts').querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => answer(parseInt(b.dataset.i, 10))));
  $('#qWhy').classList.remove('on');
  $('#qNext').classList.remove('on');
  updateScore();
}
function answer(i){
  const q = qList[qIdx];
  $$('#qOpts .opt').forEach((b, j) => {
    b.disabled = true;
    if (j === q.c) b.classList.add('good');
    else if (j === i) b.classList.add('bad');
  });
  if (i === q.c) qScore++;
  $('#qWhy').innerHTML = `<b>${i === q.c ? 'إجابة صحيحة.' : 'الإجابة الصحيحة: ' + q.o[q.c] + '.'}</b><br>${q.why}`;
  $('#qWhy').classList.add('on');
  $('#qNext').classList.add('on');
  updateScore();
}
$('#qNext').addEventListener('click', () => { qIdx++; renderQ(); });

/* ══════════════════════════════════════════════════════════════════════════
   8 · التشغيل
   ══════════════════════════════════════════════════════════════════════════ */
$('#tabs').innerHTML = TABS.map((t, i) =>
  `<button class="tab${i === 0 ? ' on' : ''}" data-k="${t.k}">${t.t}</button>`).join('');
$$('.tab').forEach(b => b.addEventListener('click', () => loadScene(b.dataset.k)));

fitCanvas();
togglePlay(!REDUCE);
loadScene(CH.tabs[0].k);
requestAnimationFrame(frame);

/* ── الواجهة الترحيبية ── */
const welBox = $('#welcome');
/* الخلفية المغبّشة من الصورة نفسها (بلا تكرار الصورة داخل الملف) */


/* تكبير الصورة: تُقصّ الزخارف على الحواف فقط، ويبقى «المهم» ظاهراً دائماً:
   الشعار والاسم والاقتباس وزرّ البداية والسطر الأخير (نِسَب من الصورة) */
const WEL = { w: 896, h: 1195, safe: { x0: .03, x1: .95, y0: .11, y1: .97 } };
function sizeWelcome(){
  const st = $('.welStage'); if (!st) return; /* الواجهة البسيطة لا تحتاج تحجيماً */
  const vw = window.innerWidth, vh = window.innerHeight, S = WEL.safe;
  const cover = Math.max(vw / WEL.w, vh / WEL.h);
  const k = Math.min(cover, vw / ((S.x1 - S.x0) * WEL.w), vh / ((S.y1 - S.y0) * WEL.h));
  const w = WEL.w * k, h = WEL.h * k;
  /* وسط المنطقة المهمة في وسط الشاشة، بلا فراغ إذا الصورة أعرض/أطول من الشاشة */
  const place = (view, size, c) => size <= view ? (view - size) / 2
    : Math.min(0, Math.max(view - size, view / 2 - c * size));
  st.style.width = w + 'px';
  st.style.height = h + 'px';
  st.style.left = place(vw, w, (S.x0 + S.x1) / 2) + 'px';
  st.style.top = place(vh, h, (S.y0 + S.y1) / 2) + 'px';
  st.style.transform = 'none';
}
sizeWelcome();
window.addEventListener('resize', sizeWelcome);
window.addEventListener('orientationchange', () => setTimeout(sizeWelcome, 250));

function showWelcome(v){
  welBox.classList.toggle('off', !v);
  if (v) sizeWelcome();
  else {
    fitCanvas(); fitViewBox();
    /* أول دخول بالموبايل وهو عمودي: تلميح مرة وحدة إن الرسم يكبر بالعرض */
    if (PHONE && !rotTipped && innerHeight > innerWidth){
      rotTipped = true; document.body.classList.add('rotTip');
      setTimeout(() => document.body.classList.remove('rotTip'), 5200);
    }
  }
}
let rotTipped = false;
$('#tblBtn').addEventListener('click', openTableIndex);
$('#welGo').addEventListener('click', () => showWelcome(false));
$('#welExam').addEventListener('click', () => { loadScene('exam'); showWelcome(false); });
$('#brandBtn').addEventListener('click', () => showWelcome(true));
$('#brandBtn').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); showWelcome(true); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !welBox.classList.contains('off')) showWelcome(false);
  else if (e.key === 'Escape' && selPart) clearInfo();
});

/* ── الوضع النهاري / الليلي (يُحفظ في المتصفح) ── */
function setTheme(day){
  document.documentElement.dataset.theme = day ? 'day' : 'night';
  $('#themeIcon').setAttribute('href', day ? '#ic-moon' : '#ic-sun');
  $('#themeTxt').textContent = day ? 'ليلي' : 'نهاري';
  try { localStorage.setItem('cellTheme', day ? 'day' : 'night'); } catch (e) {}
}
let savedTheme = null;
try { savedTheme = localStorage.getItem('cellTheme'); } catch (e) {}
setTheme(savedTheme === 'day');
$('#themeBtn').addEventListener('click', () =>
  setTheme(document.documentElement.dataset.theme !== 'day'));

/* ── ملء الشاشة: يُخفى الرأس والشريط ويكبر الرسم ── */
/* داخل تطبيق أندرويد (WebView) ملء الشاشة الحقيقي قد يُظهر شاشة فارغة: نكتفي بإخفاء الرأس والشريط */
const fsApi = /; wv\)/.test(navigator.userAgent) ? null
            : document.documentElement.requestFullscreen ? 'std'
            : document.documentElement.webkitRequestFullscreen ? 'webkit' : null;
const fsActive = () => document.fullscreenElement || document.webkitFullscreenElement;
function refit(){ requestAnimationFrame(() => { fitCanvas(); fitViewBox(); }); }
function setFs(on){
  document.body.classList.toggle('fs', on);
  document.body.classList.remove('fsTabs');
  /* في ملء الشاشة تختفي اللوحة الجانبية حتى يُختار جزء */
  $('#info').classList.toggle('closed', $('#infoBody').hidden);
  $('#fsIcon').setAttribute('href', on ? '#ic-shrink' : '#ic-expand');
  $('#fsTxt').textContent = on ? 'خروج' : 'ملء الشاشة';
  if (on && !fsActive()){
    const el = document.documentElement;
    try {
      const p = fsApi === 'std' ? el.requestFullscreen() : fsApi === 'webkit' ? el.webkitRequestFullscreen() : null;
      /* على الموبايل: يلف الشاشة بالعرض حتى يكبر الرسم (أندرويد يدعمها) */
      if (p && p.then) p.then(() => {
        if (window.innerWidth < 900 && screen.orientation && screen.orientation.lock)
          screen.orientation.lock('landscape').catch(() => {});
      }).catch(() => {});
    } catch (e) {}
  } else if (!on && fsActive()){
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    try {
      const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
  refit();
}
$('#fsBtn').addEventListener('click', () => setFs(!document.body.classList.contains('fs')));
$('#fsExit').addEventListener('click', () => setFs(false));
/* «المواضيع» بملء الشاشة: يفتح شريط التبويبات، واختيار تبويب يغلقه */
$('#fsTabsBtn').addEventListener('click', () => document.body.classList.toggle('fsTabs'));
$$('.tab').forEach(b => b.addEventListener('click', () => document.body.classList.remove('fsTabs')));
/* الخروج بزر المتصفح أو Esc يرجّع الواجهة كما كانت */
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev =>
  document.addEventListener(ev, () => {
    if (!fsActive() && document.body.classList.contains('fs')) setFs(false);
    else refit();
  }));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('fs') && !fsActive()) setFs(false);
});
</script>

<!--
════════════════════════════════════════════════════════════════════════════
  الفصل الثاني: الأنسجة — نسخة مراجعة (التبويب الأول)
  النصوص مؤقتاً من منهج السادس العلمي، وتُطابَق مع ملزمة الفصل الثاني
  حال وصولها (قائمة TODO في نهاية قسم المحتوى العلمي).
════════════════════════════════════════════════════════════════════════════
-->
</body>
</html>
