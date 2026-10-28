const drItem = k => { for (const G of DR_GROUPS) for (const it of G.items) if (it.k === k) return it; return DR_GROUPS[0].items[0]; };
const drGroupOf = k => DR_GROUPS.find(G => G.items.some(it => it.k === k)) || DR_GROUPS[0];

const drSvg = $('#drSvg'), drPad = $('#drPad');
let drKey = DR_GROUPS[0].items[0].k, drSteps = [], drIdx = 0, drT = 0, drPlay = true, drSpeed = 0.6, drRun = false, drLast = 0;
let drDesc = '', drNames = true, drColor = false, drPractice = false, drGuide = true;
const SHAPE_SEL = 'path,circle,ellipse,rect,line,polygon,polyline';
const PENCIL = '#2d2a26', NOW_INK = '#a8432b';

function initDraw(){
  $('#drPick').innerHTML = '<div id="drCats" class="segbar">' + DR_GROUPS.map(G =>
    `<button class="stool" data-dg="${G.g}">${G.t}</button>`).join('') + '</div><div id="drItems"></div>';
  $('#drCats').querySelectorAll('[data-dg]').forEach(b => b.addEventListener('click', () => {
    const G = DR_GROUPS.find(x => x.g === b.dataset.dg); drItemsRow(G); drLoad(G.items[0].k); }));
  drItemsRow(drGroupOf(drKey));
  drLoad(drKey);
}
function drItemsRow(G){
  $('#drCats').querySelectorAll('[data-dg]').forEach(b => b.classList.toggle('on', b.dataset.dg === G.g));
  $('#drItems').innerHTML = G.items.map(d =>
    `<button class="stool" data-dk="${d.k}"><svg class="ic"><use href="#ic-${G.g === 'c' ? 'cell' : G.g === 't' ? 'mol' : G.g === 'met' ? 'flask' : 'layers'}"/></svg><span>${d.t}</span></button>`).join('');
  $('#drItems').querySelectorAll('[data-dk]').forEach(b => b.addEventListener('click', () => drLoad(b.dataset.dk)));
}

/* ── تحويل رسم المشهد إلى خطوط قلم وخطوات ── */
function drLoad(k){
  const it = drItem(k); k = it.k; drKey = k;
  if (!$('#drItems').querySelector(`[data-dk="${k}"]`)) drItemsRow(drGroupOf(k));
  $('#drItems').querySelectorAll('[data-dk]').forEach(b => b.classList.toggle('on', b.dataset.dk === k));
  const ob = $('#drItems').querySelector('.on'); if (ob && ob.scrollIntoView) ob.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const s = it.scene();
  drSvg.setAttribute('viewBox', '0 0 1000 700');
  drSvg.innerHTML = DEFS + `
    <defs>
      <pattern id="drPaper" width="40" height="34" patternUnits="userSpaceOnUse">
        <rect width="40" height="34" fill="#f8f3e6"/><path d="M0 33.5H40" stroke="#cfdcec" stroke-width="1"/>
      </pattern>
      <marker id="drArr" viewBox="0 0 12 12" refX="10.5" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1.5,1.5 L11,6 L1.5,10.5" fill="none" stroke="#2d2a26" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker>
      <filter id="drPencil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4"/>
        <feDisplacementMap in="SourceGraphic" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#drPaper)"/>
    <g id="drSrc" style="visibility:hidden">${s.body}</g>
    <g id="drLines" filter="url(#drPencil)"></g>
    <g id="drLbls"></g>
    <g id="drPen" style="display:none"><g transform="rotate(35)">
      <path d="M0,0 L-5.5,-15 L5.5,-15 Z" fill="#f2c98a" stroke="#5b4630" stroke-width="1"/>
      <path d="M0,0 L-2,-5.5 L2,-5.5 Z" fill="#2d2a26"/>
      <rect x="-5.5" y="-66" width="11" height="51" fill="#e8b23a" stroke="#5b4630" stroke-width="1"/>
      <rect x="-5.5" y="-76" width="11" height="10" rx="2" fill="#e7a1a1" stroke="#5b4630" stroke-width="1"/>
    </g></g>`;
  const src = drSvg.querySelector('#drSrc'), lines = drSvg.querySelector('#drLines'), lbls = drSvg.querySelector('#drLbls');
  if (it.prep){ try { it.prep(s, drApi(src)); } catch (e) { console.warn('draw prep', e); } }
  const rootInv = lines.getCTM().inverse();

  /* هل العنصر مرئي فعلاً في الرسم الأصلي؟ (نتجاهل مناطق الضغط الشفافة والطبقات المخفية) */
  const hidden = el => {
    for (let e = el; e && e !== src; e = e.parentNode){
      if (e.getAttribute && (e.getAttribute('opacity') === '0' || e.style.opacity === '0' || e.getAttribute('display') === 'none')) return true;
    }
    const cs = getComputedStyle(el);
    const noFill = cs.fill === 'none' || /rgba\(.*,\s*0\)$/.test(cs.fill) || cs.fill === 'transparent';
    const noStroke = cs.stroke === 'none' || cs.strokeWidth === '0px';
    return noFill && noStroke;
  };
  const byPart = {};
  const stepOf = el => {
    if (it.steps){ const st = it.steps.find(x => el.closest(x.sel)); return st ? st.id : null; }
    const pg = el.closest('[data-part]');
    return pg ? pg.dataset.part : (it.base ? '_base' : null);
  };
  src.querySelectorAll(SHAPE_SEL + ',text').forEach(el => {
    if (el.closest('defs,clipPath,mask,pattern,symbol,marker') || hidden(el)) return;
    const id = stepOf(el);
    if (!id) return;
    const M = rootInv.multiply(el.getCTM()), sc = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c));
    const tag = el.tagName.toLowerCase();
    /* الكتابة داخل الرسم (أسماء المواد في المخططات، «ماء»…): تُكتب بقلم الرصاص؛ الجمل الشارحة الطويلة لا */
    if (tag === 'text'){
      const txt = (el.textContent || '').trim();
      if (!txt || /\bcap\b/.test(el.getAttribute('class') || '') || txt.length > 40) return;
      const cs = getComputedStyle(el), c = el.cloneNode(true);
      ['id', 'class', 'style', 'fill', 'opacity', 'filter', 'transform', 'clip-path'].forEach(a => c.removeAttribute(a));
      c.querySelectorAll('*').forEach(x => { x.removeAttribute('fill'); x.removeAttribute('class'); x.removeAttribute('opacity'); });
      c.setAttribute('transform', `matrix(${M.a},${M.b},${M.c},${M.d},${M.e},${M.f})`);
      c.setAttribute('class', 'drT'); c.setAttribute('opacity', '0');
      c.setAttribute('font-size', cs.fontSize); c.setAttribute('font-weight', cs.fontWeight === '400' ? '600' : cs.fontWeight);
      c.setAttribute('direction', cs.direction);
      lines.appendChild(c);
      (byPart[id] = byPart[id] || []).push({ el: c, text: true, len: 0, M, local: 0 });
      return;
    }
    if (tag === 'rect' && el.width.baseVal.value * sc > 600) return;
    const r = tag === 'circle' ? el.r.baseVal.value : tag === 'ellipse' ? Math.max(el.rx.baseVal.value, el.ry.baseVal.value) : 99;
    const dot = r * sc <= 4.6;
    const c = el.cloneNode(false);
    ['id', 'class', 'style', 'fill', 'stroke', 'stroke-width', 'filter', 'opacity', 'mask', 'clip-path', 'stroke-dasharray', 'transform',
     'marker-start', 'marker-end', 'marker-mid', 'fill-opacity', 'stroke-opacity', 'data-part', 'tabindex', 'role'].forEach(a => c.removeAttribute(a));
    c.setAttribute('transform', `matrix(${M.a},${M.b},${M.c},${M.d},${M.e},${M.f})`);
    c.setAttribute('class', dot ? 'drD' : 'drS');
    const arrow = !!el.getAttribute('marker-end');
    if (!dot){ c.setAttribute('pathLength', '1'); c.setAttribute('stroke-dasharray', '1.002 2'); c.setAttribute('stroke-dashoffset', '1'); c.style.visibility = 'hidden'; }
    else c.setAttribute('opacity', '0');
    lines.appendChild(c);
    let len = 0;
    try { len = dot ? 0 : c.getTotalLength() * sc; } catch (e) {}
    (byPart[id] = byPart[id] || []).push({ el: c, dot, arrow, len, M, local: dot ? 0 : (c.getTotalLength ? c.getTotalLength() : 0) });
  });

  /* حدود الرسم لتقدير موقع كل جزء (أعلى/وسط/أسفل · يمين/يسار) */
  const bbAll = src.getBBox();
  const order = (it.order || (it.steps ? it.steps.map(x => x.id) : [])).slice();
  (s.parts || []).forEach(p => { if (order.indexOf(p.id) < 0) order.push(p.id); });
  if (byPart._base && order.indexOf('_base') < 0) order.unshift('_base');
  const partDef = {}; (s.parts || []).forEach(p => { partDef[p.id] = p; });
  const stepName = id => id === '_base' ? (it.base ? it.base[0] : 'الرسم') : (it.steps && (it.steps.find(x => x.id === id) || {}).name) || (INFO[id] ? INFO[id].name : (partDef[id] ? nameOf(partDef[id]) : id));

  drSteps = order.filter(id => byPart[id] || partDef[id]).map(id => {
    const els = byPart[id] || [];
    const p = partDef[id];
    const name = stepName(id);
    /* زمن الرسم من طول الخطوط، والنقاط تظهر تباعاً */
    let tot = 0;
    els.forEach(e => { tot += e.text ? 70 : e.dot ? 9 : Math.max(12, e.len); });
    const scale = tot > 2600 ? 2600 / tot : 1;
    let t = 0;
    els.forEach(e => { const d = e.text ? 0.45 : (e.dot ? 9 : Math.max(12, e.len)) * scale / 420; e.t0 = t; e.t1 = t + d; t += d; });
    const drawT = t;
    /* الموقع داخل الرسم */
    let loc = '';
    if (els.length){
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      els.forEach(e => { try { const b = e.el.getBBox(), m = e.M;
        [[b.x, b.y], [b.x + b.width, b.y + b.height]].forEach(([x, y]) => { const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f;
          x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }); } catch (er) {} });
      const big = (x1 - x0) > bbAll.width * 0.6 && (y1 - y0) > bbAll.height * 0.5;
      if (!big && x1 > x0){
        const fx = ((x0 + x1) / 2 - bbAll.x) / bbAll.width, fy = ((y0 + y1) / 2 - bbAll.y) / bbAll.height;
        const v = fy < 0.36 ? 'في الأعلى' : fy > 0.64 ? 'في الأسفل' : 'في الوسط';
        const h = fx < 0.36 ? ' يسار الرسم' : fx > 0.64 ? ' يمين الرسم' : '';
        loc = ' ' + v + h;
      }
    }
    const shape = id === '_base' && it.base ? it.base[1] : (DRAW_SHAPE[id] || 'الجزء');
    const noShape = !els.length;
    /* أسماء تلقائية للرسوم التي ليس لها أسماء جاهزة (أطوار الانقسام): خط من الجزء إلى عمود جانبي */
    let pp = p;
    if (!pp && it.autoLabel && els.length && id !== '_spindle' && id !== '_xover'){
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, ax = 0, ay = 0, n = 0;
      els.forEach(e => { try { const b = e.el.getBBox(), m = e.M; const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        const X = m.a * cx + m.c * cy + m.e, Y = m.b * cx + m.d * cy + m.f; ax += X; ay += Y; n++;
        [[b.x, b.y], [b.x + b.width, b.y + b.height]].forEach(([x, y]) => { const XX = m.a * x + m.c * y + m.e, YY = m.b * x + m.d * y + m.f;
          x0 = Math.min(x0, XX); x1 = Math.max(x1, XX); y0 = Math.min(y0, YY); y1 = Math.max(y1, YY); }); } catch (er) {} });
      if (n){
        ax /= n; ay /= n;
        if (id === 'pm'){ ax = x1; ay = (y0 + y1) / 2 - (y1 - y0) * 0.25; }
        const left = ax < bbAll.x + bbAll.width / 2 && id !== 'pm';
        pp = { id, anchor: [ax, ay], label: [left ? bbAll.x - 40 : bbAll.x + bbAll.width + 40, ay], side: left ? 'L' : 'R', short: name };
      }
    }
    const txt = noShape ? shape + (pp ? '، فقط أشّر عليه واكتب اسمه.' : '.')
                        : 'ارسم ' + shape + loc + (pp ? '، ثم أشّر عليه بخط واكتب: «' + name + '».' : '.');
    return { id, name, els, p: pp, drawT, txt, lbl: null };
  });

  /* أسماء الأجزاء بخطوط تأشير (بقلم أزرق كما في ورقة الامتحان) — أكبر على الموبايل حتى تُقرأ */
  const stW = Math.max(200, $('#drStage').getBoundingClientRect().width || 800);
  const fs = Math.max(17, Math.min(27, 9.5 * 1000 / stW)), lh = fs * 1.2, small = fs > 20;
  drSvg.style.setProperty('--drFs', fs.toFixed(1) + 'px');
  /* تباعد الأسماء في كل عمود حتى لا يركب اسم على اسم (الأسطر تكثر على الموبايل) */
  const LY = {};
  ['L', 'R'].forEach(side => {
    const col = drSteps.filter(st => st.p && st.p.side === side).map(st => ({ st, n: wrapName(st.name, small ? 11 : 16).length, y: st.p.label[1] }))
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < col.length; i++){
      const need = col[i - 1].y + (col[i - 1].n + col[i].n) * lh / 2 + fs * 0.45;
      if (col[i].y < need) col[i].y = need;
    }
    col.forEach(o => { LY[o.st.id] = o.y; });
  });
  drSteps.forEach(st => {
    const p0 = st.p; if (!p0) return;
    const p = Object.assign({}, p0, { label: [p0.label[0], LY[st.id] !== undefined ? LY[st.id] : p0.label[1]] });
    const lines2 = wrapName(st.name, p.side === 'C' ? 26 : small ? 11 : 16);
    const anch = p.side === 'R' ? 'start' : p.side === 'L' ? 'end' : 'middle';
    const tx = p.side === 'R' ? p.label[0] + 8 : p.side === 'L' ? p.label[0] - 8 : p.label[0];
    const ty = p.label[1] + fs * 0.35 - (lines2.length - 1) * lh / 2;
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'drL');
    const cid = 'drClip' + st.id.replace(/[^a-zA-Z0-9]/g, '');
    g.innerHTML = `<line pathLength="1" stroke-dasharray="1.002 2" stroke-dashoffset="1" x1="${n2(p.anchor[0])}" y1="${n2(p.anchor[1])}" x2="${n2(p.label[0])}" y2="${n2(p.label[1])}"/>
      <circle cx="${n2(p.anchor[0])}" cy="${n2(p.anchor[1])}" r="3.2"/>
      <clipPath id="${cid}"><rect x="0" y="0" width="0" height="0"/></clipPath>
      <text direction="ltr" text-anchor="${anch}" x="${n2(tx)}" y="${n2(ty)}" clip-path="url(#${cid})">${lines2.map((l, i) => `<tspan x="${n2(tx)}" dy="${i ? n2(lh) : 0}">${l}</tspan>`).join('')}</text>`;
    lbls.appendChild(g);
    const tb = g.querySelector('text').getBBox();
    st.lbl = { g, line: g.querySelector('line'), dot: g.querySelector('circle'), text: g.querySelector('text'), clip: g.querySelector('clipPath rect'), tb, p };
  });
  drSteps.forEach(st => { st.lblT = st.lbl ? 1.1 : 0; st.total = st.drawT + st.lblT + 0.7; });

  /* إطار العرض: الرسم مع أسمائه بهامش */
  const bb = drSvg.querySelector('#drLines').getBBox(), lb = lbls.getBBox();
  const X0 = Math.min(bb.x, lb.width ? lb.x : bb.x) - 30, Y0 = Math.min(bb.y, lb.height ? lb.y : bb.y) - 30;
  const X1 = Math.max(bb.x + bb.width, lb.width ? lb.x + lb.width : 0) + 30, Y1 = Math.max(bb.y + bb.height, lb.height ? lb.y + lb.height : 0) + 30;
  drSvg.setAttribute('viewBox', `${n2(X0)} ${n2(Y0)} ${n2(X1 - X0)} ${n2(Y1 - Y0)}`);
  drSvg.querySelector('#drPen').setAttribute('data-s', String(Math.max(0.7, (X1 - X0) / 1000)));
  drSteps.forEach(st => { if (st.lbl) st.lbl.g.style.display = 'none'; });   // تُقاس الأسماء أولاً ثم تُخفى حتى يحين دورها

  $('#drDots').innerHTML = drSteps.map((st, i) => `<button data-i="${i}" title="${st.name}">${i + 1}</button>`).join('');
  $('#drDots').querySelectorAll('button').forEach(b => b.addEventListener('click', () => drGo(+b.dataset.i, true)));
  drSvg.querySelector('#drSrc').style.visibility = drColor ? 'visible' : 'hidden';
  drSvg.querySelector('#drSrc').style.opacity = '0.45';
  drDesc = it.desc ? it.desc + (it.chrom ? ' — ' + it.chrom + '.' : '') : '';
  drApplyNames();
  drPadClear();
  drGo(0, false);
  drSetPlay(true);
}

/* حالة كل خطوة: المنتهية مرسومة كاملة، والقادمة مخفية، والحالية حسب الزمن */
function drStepState(st, t, now){
  st.els.forEach(e => {
    const f = t >= e.t1 ? 1 : t <= e.t0 ? 0 : (t - e.t0) / Math.max(1e-3, e.t1 - e.t0);
    if (e.dot || e.text) e.el.setAttribute('opacity', e.text ? String(f) : f > 0 ? '1' : '0');
    else {
      if (e.arrow){ if (f >= 1) e.el.setAttribute('marker-end', 'url(#drArr)'); else e.el.removeAttribute('marker-end'); }
      e.el.setAttribute('stroke-dashoffset', String(1 - f));
      e.el.style.visibility = f > 0 ? '' : 'hidden';   // بلا نقطة عند بداية خط لم يُرسم بعد
    }
    e.el.classList.toggle('drNow', !!now);
  });
  const L = st.lbl; if (!L) return;
  const u = t - st.drawT;
  L.g.style.display = u > 0 ? '' : 'none';
  if (u <= 0) return;
  const a = Math.min(1, u / 0.35), w = Math.min(1, Math.max(0, (u - 0.35) / 0.75));
  L.line.setAttribute('stroke-dashoffset', String(1 - a));
  L.dot.setAttribute('opacity', a > 0.05 ? '1' : '0');
  /* الكتابة من اليمين إلى اليسار كما يُكتب العربي */
  const tb = L.tb, ww = tb.width + 8;
  L.clip.setAttribute('x', n2(tb.x + tb.width + 4 - ww * w)); L.clip.setAttribute('y', n2(tb.y - 4));
  L.clip.setAttribute('width', n2(ww * w)); L.clip.setAttribute('height', n2(tb.height + 8));
}
function drGo(i, user){
  drIdx = Math.max(0, Math.min(drSteps.length - 1, i)); drT = 0;
  drSteps.forEach((st, j) => drStepState(st, j < drIdx ? 1e9 : j > drIdx ? -1 : 0, j === drIdx));
  drUI();
  if (user && !drPlay){ drT = drSteps[drIdx].total - 0.7; drStepState(drSteps[drIdx], drT, true); drPen(null); }
}
function drUI(){
  const st = drSteps[drIdx]; if (!st) return;
  $('#drStepNo').textContent = `الخطوة ${drIdx + 1} من ${drSteps.length}`;
  $('#drStepName').textContent = st.name;
  $('#drStepTxt').textContent = st.txt;
  $('#drDots').querySelectorAll('button').forEach((b, j) => { b.classList.toggle('on', j === drIdx); b.classList.toggle('done', j < drIdx); });
}
function drPen(pt){
  const pen = drSvg.querySelector('#drPen'); if (!pen) return;
  if (!pt){ pen.style.display = 'none'; return; }
  pen.style.display = '';
  pen.setAttribute('transform', `translate(${n2(pt[0])},${n2(pt[1])}) scale(${pen.getAttribute('data-s') || 1})`);
}
/* نقطة رأس القلم الآن (على الخط الذي يُرسم أو على الاسم الذي يُكتب) */
function drPenAt(st, t){
  if (t < st.drawT){
    const e = st.els.find(x => t >= x.t0 && t < x.t1); if (!e) return null;
    const m = e.M;
    if (e.text){ const b = e.el.getBBox(), w = (t - e.t0) / Math.max(1e-3, e.t1 - e.t0), x = b.x + b.width * (1 - w), y = b.y + b.height * 0.8; return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; }
    if (e.dot){ const b = e.el.getBBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2; return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; }
    try { const q = e.el.getPointAtLength(e.local * (t - e.t0) / Math.max(1e-3, e.t1 - e.t0)); return [m.a * q.x + m.c * q.y + m.e, m.b * q.x + m.d * q.y + m.f]; } catch (er) { return null; }
  }
  const L = st.lbl; if (!L) return null;
  const u = t - st.drawT;
  if (u < 0.35){ const p = L.p, k = u / 0.35; return [p.anchor[0] + (p.label[0] - p.anchor[0]) * k, p.anchor[1] + (p.label[1] - p.anchor[1]) * k]; }
  if (u < 1.1){ const w = (u - 0.35) / 0.75, tb = L.tb; return [tb.x + tb.width - tb.width * w, tb.y + tb.height * 0.75]; }
  return null;
}
function drLoop(now){
  if (!drRun) return;
  const dt = Math.min(0.05, (now - (drLast || now)) / 1000); drLast = now;
  const st = drSteps[drIdx];
  if (st && drPlay){
    drT += dt * drSpeed;
    drStepState(st, drT, true);
    drPen(drPenAt(st, drT));
    if (drT >= st.total){
      if (drIdx < drSteps.length - 1){ drStepState(st, 1e9, false); drIdx++; drT = 0; drUI(); }
      else { drStepState(st, 1e9, false); drPen(null); drSetPlay(false); drFinished(); }
    }
  }
  requestAnimationFrame(drLoop);
}
function drFinished(){
  $('#drStepNo').textContent = 'اكتمل الرسم';
  $('#drStepName').textContent = drItem(drKey).t;
  $('#drStepTxt').textContent = (drDesc ? drDesc + ' ' : '') + 'جرّب الآن أن ترسمه بنفسك: اضغط «ارسم بنفسك» وارسم بإصبعك أو بالماوس فوق الدليل، ثم أخفِ الدليل وارسمه من الذاكرة.';
  $('#drDots').querySelectorAll('button').forEach(b => { b.classList.remove('on'); b.classList.add('done'); });
}
function drSetPlay(v){
  drPlay = v;
  $('#drPlay').innerHTML = v ? '<svg class="ic"><use href="#ic-pause"/></svg><span>إيقاف</span>' : '<svg class="ic"><use href="#ic-play"/></svg><span>تشغيل</span>';
  if (v && drIdx === drSteps.length - 1 && drT >= drSteps[drIdx].total) drGo(0, false);
}
function drStart(){ if (!drRun){ drRun = true; drLast = 0; requestAnimationFrame(drLoop); } }
function drStop(){ drRun = false; }
function drApplyNames(){ drSvg.querySelector('#drLbls').style.visibility = drNames ? '' : 'hidden'; }

$('#drPlay').addEventListener('click', () => drSetPlay(!drPlay));
$('#drPrev').addEventListener('click', () => { const back = drT < 0.6 ? 1 : 0; drGo(drIdx - back, true); });
$('#drNext').addEventListener('click', () => {
  if (drIdx >= drSteps.length - 1){ drStepState(drSteps[drIdx], 1e9, false); drPen(null); drSetPlay(false); drFinished(); return; }
  drStepState(drSteps[drIdx], 1e9, false); drGo(drIdx + 1, true);
});
$('#drRestart').addEventListener('click', () => { drGo(0, false); drSetPlay(true); });
$('#drSpeed').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
  drSpeed = +b.dataset.v; $('#drSpeed').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
}));
$('#drNamesBtn').addEventListener('click', () => { drNames = !drNames; $('#drNamesBtn').classList.toggle('on', drNames); drApplyNames(); });
$('#drColorBtn').addEventListener('click', () => {
  drColor = !drColor; $('#drColorBtn').classList.toggle('on', drColor);
  const s = drSvg.querySelector('#drSrc'); if (s) s.style.visibility = drColor ? 'visible' : 'hidden';
});

/* ── «ارسم بنفسك»: لوح شفاف فوق الرسم يرسم عليه الطالب بإصبعه أو بالماوس ── */
let padStrokes = [], padCur = null;
function padSize(){
  const r = $('#drStage').getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  drPad.width = Math.max(1, Math.round(r.width * d)); drPad.height = Math.max(1, Math.round(r.height * d));
  padDraw();
}
function padDraw(){
  const c = drPad.getContext('2d'), d = drPad.width / Math.max(1, drPad.getBoundingClientRect().width);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, drPad.width, drPad.height);
  c.setTransform(d, 0, 0, d, 0, 0);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1d3f8f'; c.lineWidth = 2.6;
  padStrokes.forEach(s => { if (s.length < 2){ if (s.length){ c.beginPath(); c.arc(s[0][0], s[0][1], 1.4, 0, 6.3); c.fillStyle = '#1d3f8f'; c.fill(); } return; }
    c.beginPath(); c.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) c.lineTo(s[i][0], s[i][1]); c.stroke(); });
}
function drPadClear(){ padStrokes = []; padCur = null; if (drPad.width) padDraw(); }
drPad.addEventListener('pointerdown', e => {
  e.preventDefault(); try { drPad.setPointerCapture(e.pointerId); } catch (_){}
  const r = drPad.getBoundingClientRect(); padCur = [[e.clientX - r.left, e.clientY - r.top]]; padStrokes.push(padCur); padDraw();
});
drPad.addEventListener('pointermove', e => {
  if (!padCur) return;
  const r = drPad.getBoundingClientRect(); padCur.push([e.clientX - r.left, e.clientY - r.top]); padDraw();
});
['pointerup', 'pointercancel'].forEach(t => drPad.addEventListener(t, () => { padCur = null; }));
function drSetPractice(v){
  drPractice = v;
  $('#drawM').classList.toggle('practice', v);
  $('#drPracBtn').classList.toggle('on', v);
  if (v){ padSize(); drSetGuide(true); }
  else drSvg.style.opacity = '';
}
function drSetGuide(v){
  drGuide = v;
  $('#drGuideBtn').innerHTML = `<svg class="ic"><use href="#ic-eye"/></svg><span>${v ? 'أخفِ الدليل' : 'أظهر الدليل'}</span>`;
  drSvg.style.opacity = drPractice ? (v ? '0.35' : '0') : '';
}
$('#drPracBtn').addEventListener('click', () => drSetPractice(!drPractice));
$('#drGuideBtn').addEventListener('click', () => drSetGuide(!drGuide));
$('#drClearBtn').addEventListener('click', drPadClear);
window.addEventListener('resize', () => { if (drPractice) padSize(); });
$('#welDraw').addEventListener('click', () => { loadScene('draw'); showWelcome(false); });
