
/* ══════════════════════════════════════════════════════════════════════════
   6 · المحرك: التبويبات، الأسماء، لوحة المعلومات، الحركة، أدوات التحكم
   ══════════════════════════════════════════════════════════════════════════ */

/* التبويبات من محتوى الفصل (CH.tabs) ثم الرسم اليدوي ووضع الامتحان */
const TABS = CH.tabs.concat([{ k: 'draw', t: 'الرسم اليدوي' }, { k: 'exam', t: 'وضع الامتحان' }]);
/* الاختيار الحالي لكل مجموعة أزرار تعيد بناء المشهد (عرض، مرحلة، مقارنة…) */
const SEL = Object.assign({}, CH.sel || {});

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const svgHost = $('#svgHost'), fx = $('#fx'), stage = $('#stage');
const REDUCE = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
/* موبايل/تابلت باللمس: نخفف الرسم (دقة أقل، مسطّح افتراضياً) حتى يبقى سلساً */
const PHONE = window.matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 820;
document.documentElement.classList.toggle('phone', PHONE);
window.__PHONE = PHONE;

let cur = null, curKey = null, playing = !REDUCE, speedMul = 1, tAcc = 0, routeTimer = 0;
let focusOwner = null, focusUntil = 0, selPart = null;
const toolState = {}, radioState = {};
let flows = [], stream = null, streamParts = [];

/* إطار العرض: يتوسّع على الشاشات الضيقة ليفسح مجالاً لأسماء الأجزاء */
let VB = { x: 0, y: 0, w: 1000, h: 700 };
function fitViewBox(){
  const w = stage.getBoundingClientRect().width;
  VB = w < 760 ? { x: -132, y: -10, w: 1264, h: 720 } : { x: 0, y: 0, w: 1000, h: 700 };
  const vb = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
  svgHost.setAttribute('viewBox', vb);
  const d = document.getElementById('dragSvgHost');
  if (d) d.setAttribute('viewBox', vb);
}

const api = {
  playing: playing, sliderVal: 0, dragSlider: false,
  el: s => svgHost.querySelector(s),
  all: s => Array.from(svgHost.querySelectorAll(s)),
  g(id, markup){
    if (!svgHost.querySelector('#' + id)){
      const t = document.createElementNS(SVGNS, 'g');
      t.innerHTML = markup;
      while (t.firstChild) svgHost.appendChild(t.firstChild);
    }
  },
  tool: id => !!toolState[id],
  setTool(id, v){ toolState[id] = !!v; syncTools(); },
  radio: g => radioState[g],
  setRadio(g, id){ radioState[g] = id; syncTools(); },
  setSlider(v){
    api.sliderVal = v;
    const s = $('#pslider');
    if (s && !api.dragSlider){ s.value = String(v); s.style.setProperty('--p', (v / 0.999 * 100) + '%'); }
  },
  setCap(t){ const e = $('#phaseCap'); if (e) e.textContent = t; },
  setPhase(ph, T){
    if (!ph) return;
    $('#phaseName').textContent = ph.n;
    $('#phaseDesc').textContent = ph.d;
    $('#phaseChrom').innerHTML = '<b>' + ph.chrom + '</b>' + (ph.time ? ' · المدة ' + ph.time : '');
    const sp = $('#phaseSrc');
    if (sp) sp.textContent = (cur && SCENES[curKey] && SCENES[curKey].src) ? SCENES[curKey].src : '';
  },
  flowEnabled(owner, on){ flows.forEach(f => { if (f.owner === owner) f.off = !on; }); },
  /* إخفاء مؤقت للأسماء (مثلاً أثناء تجربة الحركة) دون تغيير اختيار المستخدم */
  hideLabels(v){
    const l = svgHost.querySelector('#labelLayer');
    if (l) l.classList.toggle('off', !!v || !$('#lblTgl').checked);
  }
};

/* ───────────── طبقة الأسماء والتأشيرات ───────────── */
function wrapName(s, max){
  const w = s.split(' '), out = []; let line = '';
  w.forEach(x => {
    if ((line + ' ' + x).trim().length > max){ if (line) out.push(line); line = x; }
    else line = (line + ' ' + x).trim();
  });
  if (line) out.push(line);
  return out;
}
function nameOf(p){ return p.short || (INFO[p.id] ? INFO[p.id].name : p.id); }

function labelLayer(parts){
  const g = parts.map(p => {
    /* الموبايل: أسماء العمودين الجانبيين تلتف عند 15 حرفاً (3 أسطر كحد أقصى
       فلا تركب على الاسم المجاور ولا تتجاوز حافة الشاشة)، والأسماء الوسطى عند 13 */
    const nm = nameOf(p), lines = wrapName(nm, VB.x < 0 && p.side === 'C' ? 13 : 15);
    const anch = p.side === 'R' ? 'end' : p.side === 'L' ? 'start' : 'middle';
    const tx = p.side === 'R' ? p.label[0] + 8 : p.side === 'L' ? p.label[0] - 8 : p.label[0];
    const lh = VB.x < 0 ? 30 : 16;
    const y0 = p.label[1] - (lines.length - 1) * lh / 2;
    const tsp = lines.map((l, i) => `<tspan x="${n2(tx)}" dy="${i ? lh : 0}">${l}</tspan>`).join('');
    return `<g class="lblG" data-for="${p.id}">
      <line class="lead" x1="${n2(p.label[0])}" y1="${n2(p.label[1])}" x2="${n2(p.anchor[0])}" y2="${n2(p.anchor[1])}"/>
      <circle class="lblDot" cx="${n2(p.anchor[0])}" cy="${n2(p.anchor[1])}" r="3.4"/>
      <text class="lbl" x="${n2(tx)}" y="${n2(y0)}" text-anchor="${anch}">${tsp}</text>
    </g>`;
  }).join('');
  return `<g id="labelLayer">${g}</g>`;
}

/* ───────────── بناء المشهد ───────────── */
function loadScene(key){
  curKey = key;
  /* لا يبقى شيء من المشهد السابق: مؤقت «مسار البروتين»، التبطيء، وإخفاء جريان السايتوبلازم */
  clearTimeout(routeTimer); routeTimer = 0;
  focusOwner = null; focusUntil = 0;
  fx.style.opacity = '';
  svgHost.dataset.scene = key;
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.k === key));
  closeSheet(); clearInfo();
  const isExam = key === 'exam', isDraw = key === 'draw';
  $('#exam').classList.toggle('on', isExam);
  $('#drawM').classList.toggle('on', isDraw);
  $('#info').style.display = isExam || isDraw ? 'none' : '';
  /* في الامتحان والرسم اليدوي يبقى الشريط (نهاري/ملء الشاشة/الجداول) وتختفي أدوات الحركة فقط */
  document.body.classList.toggle('examMode', isExam || isDraw);
  $('#phaseBar').classList.remove('on');
  if (!isDraw) drStop();
  if (isDraw){ cur = null; if (window.__v3) window.__v3.sync(); flows = []; stream = null; $('#sceneName').textContent = 'الرسم اليدوي'; $('#sceneHint').textContent = ''; initDraw(); drStart(); return; }
  if (isExam){ cur = null; if (window.__v3) window.__v3.sync(); flows = []; stream = null; $('#sceneName').textContent = 'وضع الامتحان'; $('#sceneHint').textContent = ''; initExam(); return; }

  const def = SCENES[key];
  cur = def.build();
  cur.key = key;
  const ttl = cur.subTitle || def.title, srcTxt = cur.subSrc || def.src || '';
  $('#sceneName').innerHTML = ttl + (srcTxt ? ' <b>' + srcTxt + '</b>' : '');
  $('#sceneHint').textContent = cur.hint || def.hint || '';
  const tint = def.tint || ['rgba(70,120,104,.30)', 'rgba(60,90,130,.18)'];
  stage.style.setProperty('--tint1', tint[0]);
  stage.style.setProperty('--tint2', tint[1]);

  for (const k in toolState) delete toolState[k];
  (cur.tools || []).forEach(t => {
    if (t.toggle) toolState[t.id] = !!t.on;
    if (t.radio && t.on) radioState[t.radio] = t.id;
  });

  fitViewBox();
  svgHost.innerHTML = DEFS + cur.body + labelLayer(cur.parts || []) + '<g id="fxLayer"></g>';
  buildTools(cur.tools || []);
  addHitAreas(svgHost);
  bindParts();
  bindLabels();
  flows = cur.flows || [];
  flows.forEach(f => { f.items.forEach(i => i.el && i.el.remove()); f.items = []; f.off = false; });
  stream = cur.stream || null;
  initStream();
  if (cur.isDivision || cur.stages) $('#phaseBar').classList.add('on');
  $('#phaseBar').classList.toggle('stg', !!cur.stages);
  if (cur.init) cur.init(api);
  applyLabelToggle();
  if (window.__v3) window.__v3.sync();
}

/* مناطق ضغط سخية: الأجزاء ذات الخطوط الرفيعة أو النقاط الصغيرة
   يُضاف لها نسخة شفافة عريضة حتى يسهل الضغط عليها باللمس والماوس */
function addHitAreas(root){
  root.querySelectorAll('.part').forEach(g => {
    const add = [];
    g.querySelectorAll('path,line,polyline,circle,ellipse,rect').forEach(el => {
      if (el.dataset.hit) return;
      const fill = el.getAttribute('fill'), stroke = el.getAttribute('stroke');
      const sw = parseFloat(el.getAttribute('stroke-width') || '0');
      const noFill = !fill || fill === 'none';
      const small = (() => {
        if (el.tagName === 'circle') return parseFloat(el.getAttribute('r') || '999') < 30;
        if (el.tagName === 'ellipse') return Math.max(parseFloat(el.getAttribute('rx') || '999'),
                                                     parseFloat(el.getAttribute('ry') || '999')) < 34;
        if (el.tagName === 'rect') return Math.max(parseFloat(el.getAttribute('width') || '999'),
                                                  parseFloat(el.getAttribute('height') || '999')) < 60;
        return false;
      })();
      if (stroke && stroke !== 'none' && noFill && sw < 18){
        add.push([el, Math.min(18, Math.max(10, sw * 4)), small]);
      } else if (small && noFill){
        add.push([el, 12, true]);
      }
    });
    add.forEach(([el, w, small]) => {
      const c = el.cloneNode(false);
      c.setAttribute('stroke', 'rgba(0,0,0,0)');
      c.setAttribute('stroke-width', String(w));
      c.setAttribute('fill', small ? 'rgba(0,0,0,0)' : 'none');
      c.setAttribute('opacity', '1');
      c.removeAttribute('id');
      c.removeAttribute('filter');
      c.removeAttribute('class');
      c.removeAttribute('stroke-dasharray');
      c.dataset.hit = '1';
      el.parentNode.insertBefore(c, el);
    });
  });
}

function bindParts(){
  svgHost.querySelectorAll('.part').forEach(el => {
    el.addEventListener('click', ev => { ev.stopPropagation(); selectPart(el.dataset.part); });
    /* لوحة المفاتيح: Tab للتنقل بين الأجزاء، و Enter أو المسافة للاختيار */
    const d = INFO[el.dataset.part];
    if (!d) return;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', d.name);
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); selectPart(el.dataset.part); }
    });
  });
}
/* الضغط على فراغ الرسم يغلق اللوحة — مستمع واحد فقط طوال عمل البرنامج */
svgHost.addEventListener('click', () => clearInfo());

/* الضغط على اسم الجزء (أو نقطة تأشيره) = الضغط على الجزء نفسه بالضبط،
   فلا يُختار بالخطأ جزء آخر يقع تحت الاسم أو النقطة */
function sizeLabelHits(){
  svgHost.querySelectorAll('#labelLayer .lblG.clk').forEach(g => {
    const t = g.querySelector('text.lbl'), h = g.querySelector('rect.lblHit');
    if (!t || !h) return;
    let bb; try { bb = t.getBBox(); } catch (e) { return; }
    if (!bb.width) return;
    const pad = 7;
    h.setAttribute('x', n2(bb.x - pad)); h.setAttribute('y', n2(bb.y - pad));
    h.setAttribute('width', n2(bb.width + pad * 2)); h.setAttribute('height', n2(bb.height + pad * 2));
  });
}
/* أي اسم أقرب لمكان الضغط؟ (مناطق الضغط قد تتداخل حين تلتف الأسماء الطويلة
   على الموبايل، فنحكم بالنص الفعلي لا بالمنطقة المحيطة به) */
function labelAt(x, y){
  let best = null, bd = Infinity, bc = Infinity;
  svgHost.querySelectorAll('#labelLayer .lblG.clk').forEach(g => {
    const r = g.querySelector('text.lbl').getBoundingClientRect();
    if (!r.width) return;
    const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
    const d = Math.hypot(dx, dy), c = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2);
    if (d < bd - 0.5 || (Math.abs(d - bd) <= 0.5 && c < bc)){ best = g.dataset.for; bd = d; bc = c; }
  });
  return best;
}
function hoverPart(id, on){
  svgHost.querySelectorAll('.part').forEach(e => e.classList.toggle('hov', on && e.dataset.part === id));
}
/* تباعد تلقائي: إذا تلامس اسمان في نفس العمود الجانبي (يصير بالموبايل حين
   تلتف الأسماء الطويلة) يُزاح أحدهما قليلاً ويتبعه خط التأشير */
function relaxLabels(){
  const cols = { R: [], L: [] };
  svgHost.querySelectorAll('#labelLayer .lblG').forEach(g => {
    const t = g.querySelector('text.lbl'); if (!t) return;
    const anch = t.getAttribute('text-anchor');
    const side = anch === 'end' ? 'R' : anch === 'start' ? 'L' : null;
    if (!side) return;
    let bb; try { bb = t.getBBox(); } catch (e) { return; }
    if (!bb.height) return;
    cols[side].push({ g, t, line: g.querySelector('.lead'), y: bb.y, h: bb.height, dy: 0 });
  });
  const gap = VB.x < 0 ? 8 : 4, top = VB.y + 4, bottom = VB.y + VB.h - 4;
  Object.values(cols).forEach(c => {
    if (c.length < 2) return;
    c.sort((a, b) => a.y - b.y);
    for (let i = 1; i < c.length; i++){
      const prev = c[i - 1], cur = c[i];
      const need = (prev.y + prev.dy + prev.h + gap) - (cur.y + cur.dy);
      if (need > 0) cur.dy += need;
    }
    /* إذا نزل آخر اسم تحت حافة الرسم نرفع العمود كله بمقدار الزيادة */
    const last = c[c.length - 1], over = last.y + last.dy + last.h - bottom;
    if (over > 0){
      const room = (c[0].y + c[0].dy) - top;
      c.forEach(o => { o.dy -= Math.min(over, Math.max(0, room)); });
    }
    c.forEach(o => {
      if (Math.abs(o.dy) < 0.5) return;
      o.t.setAttribute('y', n2(parseFloat(o.t.getAttribute('y')) + o.dy));
      if (o.line) o.line.setAttribute('y1', n2(parseFloat(o.line.getAttribute('y1')) + o.dy));
    });
  });
}
function bindLabels(){
  relaxLabels();
  svgHost.querySelectorAll('#labelLayer .lblG').forEach(g => {
    const id = g.dataset.for;
    if (!INFO[id]) return;
    g.classList.add('clk');
    const hit = document.createElementNS(SVGNS, 'rect');
    hit.setAttribute('class', 'lblHit'); hit.setAttribute('rx', '7');
    g.insertBefore(hit, g.querySelector('text.lbl'));
    const dot = g.querySelector('.lblDot');
    if (dot){
      const dh = document.createElementNS(SVGNS, 'circle');
      dh.setAttribute('class', 'lblHit');
      dh.setAttribute('cx', dot.getAttribute('cx')); dh.setAttribute('cy', dot.getAttribute('cy'));
      dh.setAttribute('r', '9');
      g.appendChild(dh);
    }
    g.addEventListener('click', ev => {
      ev.stopPropagation();
      /* نقطة التأشير تخص اسمها؛ منطقة النص يحكمها أقرب نص فعلي */
      const onDot = ev.target.tagName === 'circle';
      const pid = onDot ? id : (labelAt(ev.clientX, ev.clientY) || id);
      hoverPart(pid, false); selectPart(pid);
    });
    g.addEventListener('mousemove', ev => {
      const pid = ev.target.tagName === 'circle' ? id : (labelAt(ev.clientX, ev.clientY) || id);
      hoverPart(pid, true);
    });
    g.addEventListener('mouseleave', () => hoverPart(id, false));
  });
  sizeLabelHits();
}
window.addEventListener('resize', () => requestAnimationFrame(sizeLabelHits));

/* ───────────── لوحة المعلومات ───────────── */
function selectPart(id){
  const d = INFO[id]; if (!d) return;
  selPart = id;
  svgHost.classList.add('dim');
  svgHost.querySelectorAll('.part').forEach(e => e.classList.toggle('sel', e.dataset.part === id));
  svgHost.querySelectorAll('#labelLayer .lblG').forEach(g => g.classList.toggle('sel', g.dataset.for === id));
  $('#infoName').textContent = d.name;
  $('#infoSrc').textContent = d.src ? 'المصدر: ' + d.src : '';
  $('#infoEmpty').hidden = true;
  const body = $('#infoBody'); body.hidden = false;
  $('#infoFoot').hidden = false;
  $('#info').classList.remove('closed');
  body.innerHTML = `
    <div class="fld"><h5>الموقع</h5><p>${d.loc}</p></div>
    <div class="fld"><h5>التركيب</h5><p>${d.struct}</p></div>
    <div class="fld"><h5>الوظيفة</h5><p>${d.fn}</p></div>
    <div class="fld note"><h5>ملاحظة مهمة للامتحان</h5><p>${d.note}</p></div>`;
  body.scrollTop = 0;
  const hasFn = flows.some(f => f.owner === id) || !!(cur && cur.fnParts && cur.fnParts.indexOf(id) >= 0);
  $('#seeFn').disabled = !hasFn;
  if (window.__v3) window.__v3.onSelect(id);
}
function clearInfo(){
  selPart = null;
  svgHost.classList.remove('dim');
  svgHost.querySelectorAll('.part').forEach(e => e.classList.remove('sel'));
  svgHost.querySelectorAll('#labelLayer .lblG').forEach(g => g.classList.remove('sel'));
  $('#infoName').textContent = 'لوحة المعلومات';
  $('#infoSrc').textContent = '';
  $('#infoEmpty').hidden = false;
  $('#infoBody').hidden = true;
  $('#infoFoot').hidden = true;
  /* اللوحة تُغلق حتى يُختار جزء؛ على الشاشات الكبيرة يبقى ظاهراً (CSS) */
  $('#info').classList.add('closed');
  if (window.__v3) window.__v3.onSelect(null);
}
$('#infoClose').addEventListener('click', () => clearInfo());
$('#seeFn').addEventListener('click', () => {
  if (!selPart) return;
  focusOwner = selPart; focusUntil = tAcc + 11;
  if (!playing) togglePlay(true);
  $('#sceneHint').textContent = 'إعادة وظيفة: ' + (INFO[selPart] ? INFO[selPart].name : '') + ' — بحركة أبطأ، وباقي العضيات خافتة.';
});

/* ───────────── أدوات المشهد ───────────── */
const TOOL_ICON = {
  protRoute: 'route', membTest: 'drop', light: 'sun', plant: 'leaf', showX: 'cross',
  animal: 'cell', mit: 'cell', mei: 'layers',
  diffusion: 'mol', osmosis: 'drop', solutions: 'flask', activeT: 'route',
  phago: 'cell', pino: 'drop', exo: 'route',
  glyco: 'flask', aerobic: 'mol', anaer: 'flask',
  o2: 'mol', co2: 'mol', alc: 'drop', h2o: 'drop', big: 'cell'
};
Object.assign(TOOL_ICON, CH.toolIcons || {});
const icon = n => n ? `<svg class="ic"><use href="#ic-${n}"/></svg>` : '';
function toolIcon(id){
  if (id.indexOf('tbl:') === 0) return 'table';
  if (id.indexOf('info:') === 0) return 'eye';
  return TOOL_ICON[id] || null;
}
function toolBtn(t, withIcon){
  return `<button class="stool" data-tool="${t.id}"${t.radio ? ` data-radio="${t.radio}"` : ''}` +
    `${t.toggle ? ' data-toggle="1"' : ''}>${withIcon ? icon(toolIcon(t.id)) : ''}<span>${t.label}</span></button>`;
}

function buildTools(tools){
  const host = $('#sceneTools');
  if (!tools || !tools.length){ host.innerHTML = ''; return; }
  /* عدّ عناصر كل مجموعة اختيار لتقرير إظهار الأيقونات */
  const gc = {};
  tools.forEach(t => { if (t.radio) gc[t.radio] = (gc[t.radio] || 0) + 1; });

  let html = '', openSeg = null;
  const closeSeg = () => { if (openSeg){ html += '</div>'; openSeg = null; } };
  tools.forEach(t => {
    if (t.slider){
      closeSeg();
      html += `<label class="sliderWrap"><span>${t.label || 'الطور'}</span>
        <input id="pslider" type="range" min="0" max="0.999" step="0.001" value="0" aria-label="${t.label || 'الأطوار'}"></label>`;
      return;
    }
    if (t.radio){
      if (openSeg !== t.radio){ closeSeg(); html += '<div class="segbar">'; openSeg = t.radio; }
      html += toolBtn(t, gc[t.radio] <= 5);
      return;
    }
    closeSeg();
    html += toolBtn(t, true);
  });
  closeSeg();
  host.innerHTML = '<div class="grp">' + html + '</div>';

  host.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => onTool(b.dataset.tool, b)));
  const sl = $('#pslider');
  if (sl){
    const paint = () => sl.style.setProperty('--p', (parseFloat(sl.value) / 0.999 * 100) + '%');
    const st = () => { api.dragSlider = true; };
    const mv = () => { api.sliderVal = parseFloat(sl.value); paint(); if (cur && cur.onSlider) cur.onSlider(api.sliderVal); };
    const en = () => { api.dragSlider = false; };
    sl.addEventListener('pointerdown', st);
    sl.addEventListener('input', () => { st(); mv(); });
    sl.addEventListener('pointerup', en);
    sl.addEventListener('pointercancel', en);
    sl.addEventListener('change', () => { mv(); en(); });
    paint();
  }
  syncTools();
}
function syncTools(){
  $$('#sceneTools [data-tool]').forEach(b => {
    const id = b.dataset.tool;
    if (b.dataset.radio) b.classList.toggle('on', radioState[b.dataset.radio] === id);
    else if (b.dataset.toggle) b.classList.toggle('on', !!toolState[id]);
  });
}
function onTool(id, btn){
  /* أدوات الحركة والتجارب مرسومة في المشهد المسطّح: نرجع إليه حتى يظهر أثرها */
  const keeps3d = id.indexOf('tbl:') === 0 || id.indexOf('info:') === 0 ||
    (cur && btn.dataset.radio && cur.rebuildOnRadio === btn.dataset.radio) || id === 'stPrev' || id === 'stNext' ||
    !!(window.__v3 && window.__v3.handles(id, btn.dataset.radio));
  if (!keeps3d && window.__v3 && window.__v3.active()) window.__v3.setOn(false);
  if (btn.dataset.radio){
    const grp = btn.dataset.radio;
    radioState[grp] = id;
    syncTools();
    if (cur && cur.rebuildOnRadio === grp){
      SEL[grp] = id;
      loadScene(curKey);
    }
    return;
  }
  if (id.indexOf('tbl:') === 0){ const t = TABLES[id.slice(4)]; if (t) openSheet(t); return; }
  if (id.indexOf('info:') === 0){ selectPart(id.slice(5)); return; }
  if (btn.dataset.toggle){ toolState[id] = !toolState[id]; syncTools(); }
  if (cur && cur.onTool) cur.onTool(id, api);
  if (id === 'protRoute'){
    highlightDiff(['nuc', 'ribo', 'rer', 'golgi', 'golgiVes', 'pm']);
    focusOwner = null; focusUntil = tAcc + 14;
    if (!playing) togglePlay(true);
    $('#sceneHint').textContent = 'الرايبوسومات تبني البروتين، والشبكة الخشنة تنقله داخل الخلية وبشكل خاص إلى جهاز كولجي، وكولجي يفرزه في حويصلات إلى خارج الخلية — ملزمة ص12 وص15.';
    clearTimeout(routeTimer);
    routeTimer = setTimeout(() => {
      routeTimer = 0;
      clearDiff();
      $('#sceneHint').textContent = (cur && cur.hint) || (SCENES[curKey] && SCENES[curKey].hint) || '';
    }, 14000);
  }
}
function highlightDiff(ids){
  svgHost.classList.add('dim');
  svgHost.querySelectorAll('.part').forEach(e => e.classList.toggle('sel', ids.includes(e.dataset.part)));
}
function clearDiff(){
  if (selPart) return;
  svgHost.classList.remove('dim');
  svgHost.querySelectorAll('.part').forEach(e => e.classList.remove('sel'));
}

/* ───────────── جدول المقارنة ───────────── */
/* فهرس كل جداول الملزمة — متاح من أي مشهد */
function openTableIndex(){
  $('#sheetTitle').textContent = 'جداول الملزمة — اضغط أي جدول لفتحه';
  const body = $('#sheetBody');
  body.innerHTML = '<div class="tblIdx">' + Object.keys(TABLES).map(k =>
    `<button class="btn ghost idxBtn" data-tbl="${k}">${TABLES[k].title}</button>`).join('') + '</div>';
  body.querySelectorAll('[data-tbl]').forEach(b =>
    b.addEventListener('click', () => openSheet(TABLES[b.dataset.tbl])));
  body.scrollTop = 0;
  $('#sheet').classList.add('on');
}

function openSheet(tb){
  $('#sheetTitle').textContent = tb.title;
  $('#sheetBody').innerHTML = `<table><thead><tr>${tb.head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${tb.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('#sheet').classList.add('on');
}
function closeSheet(){ $('#sheet').classList.remove('on'); }
$('#sheetClose').addEventListener('click', closeSheet);

/* ───────────── تيارات الجزيئات ───────────── */
function updateFlows(dt){
  const host = svgHost.querySelector('#fxLayer'); if (!host) return;
  flows.forEach(f => {
    const blocked = f.off || (focusOwner && f.owner && f.owner !== focusOwner);
    if (!blocked){
      f.acc += dt;
      if (f.acc >= f.every && f.items.length < f.max){
        f.acc = 0;
        const p = f.paths[Math.floor(Math.random() * f.paths.length)];
        const el = document.createElementNS(SVGNS, 'g');
        el.setAttribute('class', 'fxp');
        el.innerHTML = (f.halo ? `<circle r="${n2(f.r * 2.3)}" fill="${f.fill}" opacity=".22"/>` : '')
          + `<circle r="${n2(f.r)}" fill="${f.fill}"${f.ring ? ' stroke="#ffd9ee" stroke-width="1.6" fill-opacity=".45"' : ''}/>`;
        host.appendChild(el);
        f.items.push({ p, d: 0, el });
      }
    }
    for (let i = f.items.length - 1; i >= 0; i--){
      const it = f.items[i];
      if (!blocked) it.d += f.speed * dt;
      const pos = alongPath(it.p, it.d);
      it.el.setAttribute('transform', `translate(${n2(pos[0])},${n2(pos[1])})`);
      const rest = it.p.len - it.d;
      it.el.setAttribute('opacity', String(rest < 26 ? Math.max(0, rest / 26) : (it.d < 12 ? it.d / 12 : 1)));
      if (it.d >= it.p.len){ it.el.remove(); f.items.splice(i, 1); }
    }
  });
}

/* ───────────── جريان السايتوبلازم (Canvas) ───────────── */
const ctx = fx.getContext('2d');
const DPR_MAX = PHONE ? 1.5 : 2;
let dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1);
function fitCanvas(){
  const r = stage.getBoundingClientRect();
  dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1);
  fx.width = Math.max(1, Math.round(r.width * dpr));
  fx.height = Math.max(1, Math.round(r.height * dpr));
}
function initStream(){
  streamParts = [];
  if (!stream) return;
  const rr = rng(101), fMin = stream.fMin === undefined ? 0.12 : stream.fMin,
        fMax = stream.fMax === undefined ? 0.94 : stream.fMax;
  for (let i = 0; i < stream.count; i++){
    streamParts.push({
      a: rr() * 6.283, f: fMin + rr() * (fMax - fMin),
      w: (0.06 + rr() * 0.1) * (rr() < 0.5 ? -1 : 1),
      ph: rr() * 6.283, sz: 1.4 + rr() * 2.6, al: 0.16 + rr() * 0.3
    });
  }
}
function drawStream(dt, t){
  const r = stage.getBoundingClientRect();
  if (fx.width !== Math.round(r.width * dpr)) fitCanvas();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, fx.width, fx.height);
  if (!stream || !streamParts.length) return;
  const s = Math.min(r.width / VB.w, r.height / VB.h);
  ctx.setTransform(dpr * s, 0, 0, dpr * s,
    dpr * ((r.width - VB.w * s) / 2 - VB.x * s), dpr * ((r.height - VB.h * s) / 2 - VB.y * s));
  streamParts.forEach(p => {
    p.a += p.w * dt;
    const f = p.f + Math.sin(t * 0.7 + p.ph) * 0.03;
    const x = stream.cx + Math.cos(p.a) * stream.rx * f;
    const y = stream.cy + Math.sin(p.a) * stream.ry * f;
    const g = ctx.createRadialGradient(x, y, 0, x, y, p.sz * 3);
    g.addColorStop(0, `rgba(190,240,220,${p.al})`);
    g.addColorStop(1, 'rgba(190,240,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, p.sz * 3, 0, 6.283); ctx.fill();
  });
}

/* ───────────── الحلقة الرئيسية ───────────── */
let last = performance.now();
const welcomeEl = document.getElementById('welcome');
function frame(now){
  let dt = (now - last) / 1000; last = now;
  dt = Math.min(dt, 0.05);
  /* ورا واجهة البداية ما نرسم شي — توفير بطارية الموبايل */
  if (welcomeEl && !welcomeEl.classList.contains('off')){ requestAnimationFrame(frame); return; }
  /* بالعرض ثلاثي الأبعاد الرسم المسطّح مخفي فلا نحرّكه */
  if (document.body.classList.contains('v3') && !(window.__v3 && window.__v3.live())){ requestAnimationFrame(frame); return; }
  const slow = (focusOwner || tAcc < focusUntil) ? 0.45 : 1;
  if (tAcc >= focusUntil && focusOwner){ focusOwner = null; clearDiff(); }
  const eff = playing ? dt * speedMul * slow : 0;
  tAcc += eff;
  api.playing = playing;
  if (cur){
    updateFlows(eff);
    drawStream(eff, tAcc);
    if (cur.tick) cur.tick(eff, tAcc, api);
  }
  requestAnimationFrame(frame);
}

/* ───────────── أدوات التحكم العامة ───────────── */
function togglePlay(v){
  playing = v === undefined ? !playing : v;
  const t = $('#playTxt'), u = $('#playBtn').querySelector('use');
  if (t) t.textContent = playing ? 'إيقاف' : 'تشغيل';
  if (u) u.setAttribute('href', playing ? '#ic-pause' : '#ic-play');
  $('#playBtn').classList.toggle('primary', !playing);
}
$('#playBtn').addEventListener('click', () => togglePlay());
function paintSpd(){
  const e = $('#spd');
  e.style.setProperty('--p', ((parseFloat(e.value) - 0.2) / 2.3 * 100) + '%');
}
$('#spd').addEventListener('input', e => {
  speedMul = parseFloat(e.target.value);
  $('#spdOut').textContent = speedMul.toFixed(1) + '×';
  paintSpd();
});
paintSpd();
function applyLabelToggle(){
  const on = $('#lblTgl').checked;
  const l = svgHost.querySelector('#labelLayer');
  if (l) l.classList.toggle('off', !on);
  if (on) sizeLabelHits();
}
$('#lblTgl').addEventListener('change', applyLabelToggle);
/* على الموبايل بالمجسّم: الضغط على لوحة الطور يفتح/يطوي وصف الطور */
$('#phaseBar').addEventListener('click', () => $('#phaseBar').classList.toggle('open'));
/* أزرار المرحلة السابقة/التالية داخل لوحة المرحلة (ظاهرة دائماً حتى على الموبايل) */
['phPrev', 'phNext'].forEach(id => $('#' + id).addEventListener('click', e => {
  e.stopPropagation();
  if (cur && cur.onTool) cur.onTool(id === 'phPrev' ? 'stPrev' : 'stNext', api);
}));
$('#sceneHint').addEventListener('click', () => $('#sceneHint').classList.toggle('open'));
$('#glowTgl').addEventListener('change', e => svgHost.classList.toggle('flat', !e.target.checked));
$('#resetBtn').addEventListener('click', () => {
  if (curKey === 'exam') initExam();
  else { if (cur && cur.onReset) cur.onReset(); loadScene(curKey); }
});
window.addEventListener('resize', () => { fitCanvas(); fitViewBox(); });
