
/* ══════════════════════════════════════════════════════════════════════════
   4.3 · الأنسجة المعقدة: الحزمة الوعائية، عناصر الخشب (الماء يصعد)،
         عناصر اللحاء (الغذاء بالاتجاهين)، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
const VAS_VIEWS = [
  { id: 'vbun', label: 'الحزمة الوعائية' },
  { id: 'xyl',  label: 'الخشب' },
  { id: 'phl',  label: 'اللحاء' },
  { id: 'vcmp', label: 'قارن' }
];
const VAS_PAL = { water: '#6fc3ff', sugar: '#ffb347', xyl: '#c06a62', xylL: '#ffd2c8', phl: '#a8d07a', phlL: '#efffd8', fib: '#d9b06e', camb: '#ffd98a' };

SCENES.vasc = {
  title: 'الأنسجة المعقدة: الخشب واللحاء',
  get src(){ return SRC_WAIT; },
  tint: ['rgba(90,120,160,.26)', 'rgba(160,120,70,.16)'],
  model3d: () => 'vas_' + SEL.vasv,
  build(){
    const v = SEL.vasv || 'vbun';
    const s = v === 'xyl' ? vasXyl() : v === 'phl' ? vasPhl() : v === 'vcmp' ? vasCmp() : vasBun();
    s.rebuildOnRadio = 'vasv';
    s.tools = VAS_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'vasv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.vas_bun = { title: 'مقطع عرضي في حزمة وعائية', build: () => vasBun() };
SCENES.vas_xyl = { title: 'عناصر الخشب', build: () => vasXyl() };
SCENES.vas_phl = { title: 'عناصر اللحاء', build: () => vasPhl() };

/* خلية مغزلية (ليف أو قصيبة) بين (x,y0) و(x,y1) */
const spindleSvg = (x, y0, y1, w, fill, stroke, extra) => `<path d="M${n2(x)},${n2(y0)} Q${n2(x + w)},${n2((y0 + y1) / 2)} ${n2(x)},${n2(y1)} Q${n2(x - w)},${n2((y0 + y1) / 2)} ${n2(x)},${n2(y0)}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"${extra || ''}/>`;

/* ───────── 1) مقطع عرضي في حزمة وعائية ───────── */
function vasBun(){
  const CX = 470, rr = rng(70);
  /* الشكل العام: الألياف للخارج (أعلى) ثم اللحاء ثم الكامبيوم ثم الخشب (أسفل) */
  const cap = `<path d="M${CX - 150},175 Q${CX},40 ${CX + 150},175 Q${CX},120 ${CX - 150},175Z" fill="${VAS_PAL.fib}" stroke="#ffe7b8" stroke-width="2"/>`;
  const fibCells = []; for (let i = 0; i < 16; i++){ const t = (i + 0.5) / 16, x = CX - 130 + 260 * t, y = 150 - Math.sin(Math.PI * t) * 52;
    fibCells.push(`<circle cx="${n2(x)}" cy="${n2(y)}" r="8" fill="#e8c894" stroke="#7a5a34" stroke-width="3"/>`); }
  const phlReg = `<path d="M${CX - 165},182 Q${CX},128 ${CX + 165},182 L${CX + 175},300 L${CX - 175},300Z" fill="#6f9a52" stroke="${VAS_PAL.phlL}" stroke-width="1.6"/>`;
  const sieve = [], comp = [], ppar = [];
  for (let i = 0; i < 7; i++){
    const x = CX - 135 + i * 45 + (rr() - 0.5) * 8, y = 236 + (i % 2) * 22;
    sieve.push(`<circle class="sv" cx="${n2(x)}" cy="${n2(y)}" r="17" fill="${VAS_PAL.phl}" stroke="${VAS_PAL.phlL}" stroke-width="1.4"/>`);
    comp.push(`<circle cx="${n2(x + 16)}" cy="${n2(y + 15)}" r="6.5" fill="#4f7f3a" stroke="${VAS_PAL.phlL}" stroke-width="1"/><circle cx="${n2(x + 16)}" cy="${n2(y + 15)}" r="2.6" fill="#8a7fd6"/>`);
  }
  const camb = []; for (let i = 0; i < 18; i++) camb.push(`<rect x="${n2(CX - 180 + i * 20)}" y="302" width="18" height="12" rx="3" fill="${VAS_PAL.camb}" stroke="#fff3c8" stroke-width=".8"/>`);
  const xylReg = `<path d="M${CX - 182},318 L${CX + 182},318 Q${CX + 150},520 ${CX},560 Q${CX - 150},520 ${CX - 182},318Z" fill="#7a3d3d" stroke="${VAS_PAL.xylL}" stroke-width="1.6"/>`;
  const ves = [], xpar = [];
  [[CX - 95, 375, 30], [CX + 5, 385, 34], [CX + 100, 372, 28], [CX - 45, 460, 26], [CX + 55, 465, 25], [CX, 520, 18], [CX - 120, 440, 16], [CX + 125, 438, 16]].forEach(([x, y, r]) =>
    ves.push(`<circle class="wv" cx="${x}" cy="${y}" r="${r}" fill="#ffe6dc" stroke="${VAS_PAL.xyl}" stroke-width="5"/>`));
  for (let i = 0; i < 22; i++){ const a = rr() * 6.28, d = 30 + rr() * 140, x = CX + Math.cos(a) * d * 0.9, y = 430 + Math.sin(a) * d * 0.55;
    if (y < 330 || y > 545) continue; xpar.push(`<circle cx="${n2(x)}" cy="${n2(y)}" r="7" fill="#b78a7a" stroke="#ffe6dc" stroke-width="1"/>`); }
  const body = `
    ${part('tXylem', xylReg + `<g>${xpar.join('')}</g>`)}
    ${part('xVessel', ves.join(''))}
    ${part('vascCamb', camb.join(''))}
    ${part('tPhloem', phlReg)}
    ${part('pSieve', sieve.join(''))}
    ${part('pComp', comp.join(''))}
    ${part('pFiber', cap + fibCells.join(''))}
    <text class="cap sm" x="${CX}" y="610" text-anchor="middle">الخشب: الماء والأملاح ↑ للأعلى · اللحاء: الغذاء المصنّع ⇅ بالاتجاهين</text>`;
  return {
    body, fnParts: ['tXylem', 'xVessel', 'tPhloem', 'pSieve', 'pComp'],
    parts: [
      { id: 'pFiber', anchor: [CX + 80, 118], label: [866, 80], side: 'R' },
      { id: 'pComp', anchor: [CX - 135 + 3 * 45 + 16, 236 + 22 + 15], label: [866, 205], side: 'R' },
      { id: 'tPhloem', anchor: [CX + 160, 280], label: [866, 270], side: 'R' },
      { id: 'vascCamb', anchor: [CX + 170, 308], label: [866, 330], side: 'R' },
      { id: 'xVessel', anchor: [CX + 100, 372], label: [866, 420], side: 'R' },
      { id: 'tXylem', anchor: [CX + 120, 500], label: [866, 520], side: 'R' },
      { id: 'pSieve', anchor: [CX - 135, 236], label: [134, 230], side: 'L' }
    ],
    tools: [{ id: 'tbl:xylPhl', label: 'الخشب × اللحاء' }],
    tick(dt, t, a){
      /* نبض الماء في الأوعية والغذاء في الأنابيب الغربالية */
      a.all('.wv').forEach((e, i) => e.setAttribute('fill', `rgba(111,195,255,${n2(0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.7)))})`));
      a.all('.sv').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(2 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4 + i)))}px ${VAS_PAL.sugar})`);
    }
  };
}

/* ───────── 2) عناصر الخشب (مقطع طولي) والماء يصعد ───────── */
function vasXyl(){
  const Y0 = 90, Y1 = 520;
  const fiber = spindleSvg(250, Y0 + 20, Y1 - 10, 14, VAS_PAL.fib, '#ffe7b8') + `<line x1="250" y1="${Y0 + 70}" x2="250" y2="${Y1 - 60}" stroke="#7a5a34" stroke-width="2"/>`;
  /* قصيبتان متداخلتان، فيهما نقر */
  const TR = [[350, Y0, Y1 - 120], [400, Y0 + 120, Y1]];
  let trach = '';
  TR.forEach(([x, a, b]) => {
    trach += spindleSvg(x, a, b, 24, '#e9b8a8', VAS_PAL.xyl);
    for (let y = a + 40; y < b - 30; y += 26) trach += `<ellipse cx="${x - 9}" cy="${y}" rx="3" ry="5" fill="#7a3d3d"/><ellipse cx="${x + 9}" cy="${y + 13}" rx="3" ry="5" fill="#7a3d3d"/>`;
  });
  /* الوعاء الخشبي: خلايا متتالية زالت جدرانها الفاصلة (تبقى حافات) وجدار متغلظ */
  const VX = 560, VW = 74;
  let vessel = `<rect x="${VX - VW / 2}" y="${Y0}" width="${VW}" height="${Y1 - Y0}" rx="10" fill="#f3d2c6" stroke="${VAS_PAL.xyl}" stroke-width="4"/>`;
  for (let y = Y0 + 12; y < Y1 - 6; y += 16) vessel += `<path d="M${VX - VW / 2 + 3},${y} Q${VX},${y + 7} ${VX + VW / 2 - 3},${y}" fill="none" stroke="${VAS_PAL.xyl}" stroke-width="2.2" opacity=".55"/>`;
  for (let k = 1; k < 4; k++){ const y = Y0 + (Y1 - Y0) * k / 4;
    vessel += `<path d="M${VX - VW / 2},${y} l10,0 M${VX + VW / 2},${y} l-10,0" stroke="#7a3d3d" stroke-width="5" stroke-linecap="round"/>`; }
  /* البرنكيمة الخشبية: خلايا حية صغيرة */
  let xpar = ''; for (let k = 0; k < 6; k++){ const y = Y0 + 10 + k * 70; xpar += `<rect x="676" y="${y}" width="52" height="64" rx="10" fill="#b78a7a" stroke="#ffe6dc" stroke-width="1.6"/><circle cx="702" cy="${y + 32}" r="8" fill="url(#gNucl)"/>`; }
  /* جزيئات الماء */
  const drops = []; for (let i = 0; i < 12; i++) drops.push(`<circle class="wd" data-i="${i}" r="6" fill="${VAS_PAL.water}" stroke="#e8f7ff" stroke-width="1.4"/>`);
  const tdrops = []; for (let i = 0; i < 6; i++) tdrops.push(`<circle class="td" data-i="${i}" r="5" fill="${VAS_PAL.water}" stroke="#e8f7ff" stroke-width="1.2"/>`);
  const body = `
    ${part('xFiber', fiber)}
    ${part('xTrach', trach)}
    ${part('xVessel', vessel)}
    ${part('xPar', xpar)}
    <g id="drops">${drops.join('')}${tdrops.join('')}</g>
    <path d="M${VX + 70},${Y1 - 30} L${VX + 70},${Y0 + 40} M${VX + 62},${Y0 + 52} L${VX + 70},${Y0 + 40} L${VX + 78},${Y0 + 52}" fill="none" stroke="${VAS_PAL.water}" stroke-width="3" stroke-linecap="round"/>
    <text class="cap sm" x="470" y="${Y1 + 50}" text-anchor="middle">عناصر الخشب (مقطع طولي) — الماء والأملاح تصعد للأعلى باتجاه واحد</text>`;
  return {
    body, fnParts: ['xVessel', 'xTrach'],
    parts: [
      { id: 'xFiber', anchor: [250, 300], label: [134, 300], side: 'L' },
      { id: 'xTrach', anchor: [350 - 18, 220], label: [134, 160], side: 'L' },
      { id: 'xVessel', anchor: [VX + VW / 2, 200], label: [866, 150], side: 'R' },
      { id: 'xPar', anchor: [728, 400], label: [866, 400], side: 'R' }
    ],
    tools: [{ id: 'info:tXylem', label: 'عن الخشب' }, { id: 'tbl:xylPhl', label: 'الخشب × اللحاء' }],
    tick(dt, t, a){
      const f = focusOwner, sv = f && f !== 'xVessel' ? 0.2 : 1, st = f && f !== 'xTrach' ? 0.2 : 1;
      a.all('#drops .wd').forEach(e => { const i = +e.dataset.i, p = ((t * 0.16 * sv + i / 12) % 1);
        e.setAttribute('cx', n2(VX + Math.sin(i * 2.1) * 18)); e.setAttribute('cy', n2(Y1 - 10 - p * (Y1 - Y0 - 20))); });
      /* في القصيبات: يصعد في الأولى ثم يعبر النقر إلى الثانية */
      a.all('#drops .td').forEach(e => { const i = +e.dataset.i, p = ((t * 0.12 * st + i / 6) % 1);
        const y = Y1 - 30 - p * (Y1 - Y0 - 60), x = y > 300 ? 400 : y > 260 ? 400 - (300 - y) / 40 * 50 : 350;
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); });
    }
  };
}

/* ───────── 3) عناصر اللحاء (مقطع طولي) والغذاء بالاتجاهين ───────── */
function vasPhl(){
  const Y0 = 90, Y1 = 520, SX = 470, SW = 70, NC = 3, CH = (Y1 - Y0) / NC;
  const fiber = spindleSvg(240, Y0 + 20, Y1 - 10, 14, VAS_PAL.fib, '#ffe7b8') + `<line x1="240" y1="${Y0 + 70}" x2="240" y2="${Y1 - 60}" stroke="#7a5a34" stroke-width="2"/>`;
  let sieve = '', plates = '', comp = '';
  for (let k = 0; k < NC; k++){
    const y = Y0 + k * CH;
    sieve += `<rect x="${SX - SW / 2}" y="${n2(y + 3)}" width="${SW}" height="${n2(CH - 6)}" rx="10" fill="${VAS_PAL.phl}" stroke="${VAS_PAL.phlL}" stroke-width="2"/>
      <rect x="${SX - SW / 2 + 6}" y="${n2(y + 10)}" width="${SW - 12}" height="${n2(CH - 20)}" rx="8" fill="#d6efb8" opacity=".35"/>`;
    comp += `<rect x="${SX + SW / 2 + 4}" y="${n2(y + 8)}" width="24" height="${n2(CH - 16)}" rx="9" fill="#4f7f3a" stroke="${VAS_PAL.phlL}" stroke-width="1.4"/>
      <ellipse class="cn" cx="${SX + SW / 2 + 16}" cy="${n2(y + CH / 2)}" rx="7" ry="12" fill="url(#gNucl)"/>`;
    if (k > 0){
      plates += `<rect x="${SX - SW / 2 + 2}" y="${n2(y - 4)}" width="${SW - 4}" height="8" rx="3" fill="#e9f7c8" stroke="#6f9a52" stroke-width="1"/>`;
      for (let i = 0; i < 6; i++) plates += `<circle cx="${n2(SX - SW / 2 + 9 + i * 10.5)}" cy="${n2(y)}" r="2.4" fill="#2f4a22"/>`;
    }
  }
  let ppar = ''; for (let k = 0; k < 6; k++){ const y = Y0 + 10 + k * 70; ppar += `<rect x="640" y="${y}" width="56" height="64" rx="12" fill="#86b06a" stroke="${VAS_PAL.phlL}" stroke-width="1.6"/><circle cx="668" cy="${y + 32}" r="8" fill="url(#gNucl)"/>`; }
  const sug = []; for (let i = 0; i < 10; i++) sug.push(`<rect class="sg" data-i="${i}" width="11" height="11" rx="2" fill="${VAS_PAL.sugar}" stroke="#fff1d6" stroke-width="1.2"/>`);
  const body = `
    ${part('pFiber', fiber)}
    ${part('pSieve', sieve)}
    ${part('pComp', comp)}
    ${part('pPar', ppar)}
    <g id="sugar">${sug.join('')}</g>
    ${part('pPlate', plates)}
    <path d="M${SX - 70},${Y0 + 40} L${SX - 70},${Y1 - 40} M${SX - 78},${Y0 + 52} L${SX - 70},${Y0 + 40} L${SX - 62},${Y0 + 52} M${SX - 78},${Y1 - 52} L${SX - 70},${Y1 - 40} L${SX - 62},${Y1 - 52}" fill="none" stroke="${VAS_PAL.sugar}" stroke-width="3" stroke-linecap="round"/>
    <text class="cap sm" x="470" y="${Y1 + 50}" text-anchor="middle">عناصر اللحاء (مقطع طولي) — الغذاء المصنّع ينتقل بالاتجاهين عبر الصفائح الغربالية</text>`;
  return {
    body, fnParts: ['pSieve', 'pComp', 'pPlate'],
    parts: [
      { id: 'pFiber', anchor: [240, 300], label: [134, 300], side: 'L' },
      { id: 'pPlate', anchor: [SX - SW / 2 + 4, Y0 + CH], label: [134, 140], side: 'L' },
      { id: 'pSieve', anchor: [SX - SW / 2 + 6, Y0 + CH * 2.5], label: [134, 460], side: 'L' },
      { id: 'pComp', anchor: [SX + SW / 2 + 28, Y0 + CH * 0.5], label: [866, 150], side: 'R' },
      { id: 'pPar', anchor: [696, 400], label: [866, 400], side: 'R' }
    ],
    tools: [{ id: 'info:tPhloem', label: 'عن اللحاء' }, { id: 'tbl:xylPhl', label: 'الخشب × اللحاء' }],
    tick(dt, t, a){
      const f = focusOwner, sp = f && f !== 'pSieve' && f !== 'pPlate' ? 0.2 : 1;
      a.all('#sugar .sg').forEach(e => { const i = +e.dataset.i, dn = i % 2 === 0, p = ((t * 0.11 * sp + i / 10) % 1);
        const y = dn ? Y0 + 10 + p * (Y1 - Y0 - 20) : Y1 - 10 - p * (Y1 - Y0 - 20);
        e.setAttribute('x', n2(SX + (dn ? -18 : 8) - 5)); e.setAttribute('y', n2(y - 5)); });
      a.all('.cn').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(2 + 5 * (0.5 + 0.5 * Math.sin(t * 2.6 + i)))}px #c8bfff)`);
    }
  };
}

/* ───────── 4) قارن: الوعاء الخشبي × الأنبوب الغربالي ───────── */
function vasCmp(){
  const Y0 = 100, Y1 = 500, VX = 300, SX = 650, W = 76;
  let ves = `<rect x="${VX - W / 2}" y="${Y0}" width="${W}" height="${Y1 - Y0}" rx="10" fill="#f3d2c6" stroke="${VAS_PAL.xyl}" stroke-width="4"/>`;
  for (let y = Y0 + 12; y < Y1 - 6; y += 16) ves += `<path d="M${VX - W / 2 + 3},${y} Q${VX},${y + 7} ${VX + W / 2 - 3},${y}" fill="none" stroke="${VAS_PAL.xyl}" stroke-width="2.2" opacity=".55"/>`;
  let sv = '';
  for (let k = 0; k < 3; k++){ const y = Y0 + k * (Y1 - Y0) / 3;
    sv += `<rect x="${SX - W / 2}" y="${n2(y + 3)}" width="${W}" height="${n2((Y1 - Y0) / 3 - 6)}" rx="10" fill="${VAS_PAL.phl}" stroke="${VAS_PAL.phlL}" stroke-width="2"/>
      <rect x="${SX + W / 2 + 4}" y="${n2(y + 8)}" width="24" height="${n2((Y1 - Y0) / 3 - 16)}" rx="9" fill="#4f7f3a" stroke="${VAS_PAL.phlL}" stroke-width="1.4"/>
      <ellipse cx="${SX + W / 2 + 16}" cy="${n2(y + (Y1 - Y0) / 6)}" rx="7" ry="12" fill="url(#gNucl)"/>`;
    if (k) sv += `<rect class="dHi" x="${SX - W / 2 + 2}" y="${n2(y - 4)}" width="${W - 4}" height="8" rx="3" fill="#e9f7c8" stroke="#6f9a52" stroke-width="1"/>`;
  }
  const cap = (x, a, b) => `<text class="cap" x="${x}" y="${Y1 + 44}" text-anchor="middle">${a}</text><text class="cap sm" x="${x}" y="${Y1 + 72}" text-anchor="middle">${b}</text>`;
  const drops = []; for (let i = 0; i < 8; i++) drops.push(`<circle class="wd" data-i="${i}" r="6" fill="${VAS_PAL.water}"/>`);
  const sug = []; for (let i = 0; i < 8; i++) sug.push(`<rect class="sg" data-i="${i}" width="10" height="10" rx="2" fill="${VAS_PAL.sugar}"/>`);
  const body = `${part('tXylem', ves)}${part('tPhloem', sv)}<g>${drops.join('')}${sug.join('')}</g>
    ${cap(VX, 'الخشب (وعاء خشبي)', 'ميت · ماء وأملاح ↑ باتجاه واحد')}${cap(SX, 'اللحاء (أنبوب غربالي + خلية مرافقة)', 'حي بلا نواة · غذاء ⇅ بالاتجاهين')}`;
  let opened = false;
  return {
    body, fnParts: ['tXylem', 'tPhloem'],
    parts: [
      { id: 'tXylem', anchor: [VX - W / 2, 200], label: [134, 200], side: 'L' },
      { id: 'tPhloem', anchor: [SX + W / 2 + 28, 200], label: [866, 200], side: 'R' }
    ],
    tools: [{ id: 'tbl:xylPhl', label: 'جدول الفروقات' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'vasc' && SEL.vasv === 'vcmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.xylPhl); }, 700); } },
    tick(dt, t, a){
      a.all('.wd').forEach(e => { const i = +e.dataset.i, p = (t * 0.16 + i / 8) % 1; e.setAttribute('cx', n2(VX + Math.sin(i * 2.3) * 16)); e.setAttribute('cy', n2(Y1 - 10 - p * (Y1 - Y0 - 20))); });
      a.all('.sg').forEach(e => { const i = +e.dataset.i, dn = i % 2 === 0, p = (t * 0.11 + i / 8) % 1, y = dn ? Y0 + 10 + p * (Y1 - Y0 - 20) : Y1 - 10 - p * (Y1 - Y0 - 20);
        e.setAttribute('x', n2(SX + (dn ? -18 : 8) - 5)); e.setAttribute('y', n2(y - 5)); });
      a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(3 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4 + i)))}px #ffd166)`);
    }
  };
}
