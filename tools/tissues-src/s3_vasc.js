
/* ══════════════════════════════════════════════════════════════════════════
   4.4 · النسيج الوعائي — ملزمة ص15–17 وص23: نسيج الخشب (عناصره)، نسيج
         اللحاء برسم الملزمة نفسه (ص16–17)، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
const VAS_VIEWS = [
  { id: 'xyl',  label: 'نسيج الخشب' },
  { id: 'phl',  label: 'نسيج اللحاء' },
  { id: 'vcmp', label: 'قارن' }
];
const VAS_PAL = { water: '#6fc3ff', sugar: '#ffb347', xyl: '#c06a62', xylL: '#ffd2c8', phl: '#a8d07a', phlL: '#efffd8', fib: '#d9b06e', camb: '#ffd98a' };

SCENES.vasc = {
  title: 'النسيج الوعائي',
  get src(){ return ({ xyl: 'ملزمة ص15–17', phl: 'ملزمة ص15–17', vcmp: 'ملزمة ص15–17 وص23' })[SEL.vasv] || 'ملزمة ص15'; },
  tint: ['rgba(90,120,160,.26)', 'rgba(160,120,70,.16)'],
  model3d: () => 'vas_' + SEL.vasv,
  build(){
    const v = SEL.vasv === 'phl' || SEL.vasv === 'vcmp' ? SEL.vasv : 'xyl';
    const s = v === 'phl' ? vasPhl() : v === 'vcmp' ? vasCmp() : vasXyl();
    s.rebuildOnRadio = 'vasv';
    s.tools = VAS_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'vasv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.vas_xyl = { title: 'نسيج الخشب', build: () => vasXyl() };
SCENES.vas_phl = { title: 'نسيج اللحاء', build: () => vasPhl() };

/* خلية مغزلية (ليف أو قصيبة) بين (x,y0) و(x,y1) */
const spindleSvg = (x, y0, y1, w, fill, stroke, extra) => `<path d="M${n2(x)},${n2(y0)} Q${n2(x + w)},${n2((y0 + y1) / 2)} ${n2(x)},${n2(y1)} Q${n2(x - w)},${n2((y0 + y1) / 2)} ${n2(x)},${n2(y0)}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"${extra || ''}/>`;

/* ───────── 1) نسيج الخشب: الأوعية والقصيبات وبرنكيما الخشب والألياف (ص15–17) ───────── */
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
  /* أوعية الخشب: تتباين تبعاً لطريقة التغلظ فيها (وعاء بتغلظ حلقي ووعاء بتغلظ حلزوني) */
  const VX = 530, VW = 66, VX2 = 618, VW2 = 54;
  let vessel = `<rect x="${VX - VW / 2}" y="${Y0}" width="${VW}" height="${Y1 - Y0}" rx="10" fill="#f3d2c6" stroke="${VAS_PAL.xyl}" stroke-width="4"/>`;
  for (let y = Y0 + 14; y < Y1 - 6; y += 22) vessel += `<ellipse cx="${VX}" cy="${y}" rx="${VW / 2 - 4}" ry="5" fill="none" stroke="${VAS_PAL.xyl}" stroke-width="3" opacity=".8"/>`;
  vessel += `<rect x="${VX2 - VW2 / 2}" y="${Y0}" width="${VW2}" height="${Y1 - Y0}" rx="10" fill="#f3d2c6" stroke="${VAS_PAL.xyl}" stroke-width="4"/>`;
  let sp = `M${VX2 - VW2 / 2 + 4},${Y0 + 8}`;
  for (let y = Y0 + 8; y < Y1 - 14; y += 28) sp += ` L${VX2 + VW2 / 2 - 4},${y + 14} L${VX2 - VW2 / 2 + 4},${y + 28}`;
  vessel += `<path d="${sp}" fill="none" stroke="${VAS_PAL.xyl}" stroke-width="3" opacity=".8"/>`;
  /* البرنكيمة الخشبية: خلايا حية صغيرة */
  let xpar = ''; for (let k = 0; k < 6; k++){ const y = Y0 + 10 + k * 70; xpar += `<rect x="690" y="${y}" width="52" height="64" rx="10" fill="#b78a7a" stroke="#ffe6dc" stroke-width="1.6"/><circle cx="716" cy="${y + 32}" r="8" fill="url(#gNucl)"/>`; }
  /* جزيئات الماء */
  const drops = []; for (let i = 0; i < 12; i++) drops.push(`<circle class="wd" data-i="${i}" r="6" fill="${VAS_PAL.water}" stroke="#e8f7ff" stroke-width="1.4"/>`);
  const tdrops = []; for (let i = 0; i < 6; i++) tdrops.push(`<circle class="td" data-i="${i}" r="5" fill="${VAS_PAL.water}" stroke="#e8f7ff" stroke-width="1.2"/>`);
  const body = `
    ${part('xFiber', fiber)}
    ${part('xTrach', trach)}
    ${part('xVessel', vessel)}
    ${part('xPar', xpar)}
    <g id="drops">${drops.join('')}${tdrops.join('')}</g>
    <text class="cap sm" x="470" y="${Y1 + 50}" text-anchor="middle">نسيج الخشب (مقطع طولي): الأوعية والقصيبات خلايا ميتة فارغة تنقل الماء والمعادن</text>`;
  return {
    body, fnParts: ['xVessel', 'xTrach'],
    parts: [
      { id: 'xFiber', anchor: [250, 300], label: [134, 300], side: 'L' },
      { id: 'xTrach', anchor: [350 - 18, 220], label: [134, 160], side: 'L' },
      { id: 'xVessel', anchor: [VX2 + VW2 / 2, 200], label: [866, 150], side: 'R' },
      { id: 'xPar', anchor: [742, 400], label: [866, 400], side: 'R' }
    ],
    tools: [{ id: 'info:tXylem', label: 'عن نسيج الخشب' }, { id: 'tbl:vascCells', label: 'خلايا كل نسيج ووظائفها (ص17)' }],
    tick(dt, t, a){
      const f = focusOwner, sv = f && f !== 'xVessel' ? 0.2 : 1, st = f && f !== 'xTrach' ? 0.2 : 1;
      a.all('#drops .wd').forEach(e => { const i = +e.dataset.i, p = ((t * 0.16 * sv + i / 12) % 1);
        e.setAttribute('cx', n2((i % 2 ? VX2 : VX) + Math.sin(i * 2.1) * 12)); e.setAttribute('cy', n2(Y1 - 10 - p * (Y1 - Y0 - 20))); });
      /* في القصيبات: يصعد في الأولى ثم يعبر النقر إلى الثانية */
      a.all('#drops .td').forEach(e => { const i = +e.dataset.i, p = ((t * 0.12 * st + i / 6) % 1);
        const y = Y1 - 30 - p * (Y1 - Y0 - 60), x = y > 300 ? 400 : y > 260 ? 400 - (300 - y) / 40 * 50 : 350;
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); });
    }
  };
}

/* ───────── 2) نسيج اللحاء برسم الملزمة (ص16–17): أنبوب منخلي بجدار متموج، صفائح منخلية
   مائلة منقّطة، وخلايا مرافقة على الجانبين ───────── */
/* يعيد أجزاء الرسم كنصوص SVG حتى يستعملها الرسم والمقارنة */
function phloemSvg(cx, y0, y1, k){
  k = k || 1;
  const H = y1 - y0, half = 48 * k, amp = 13 * k, N = 2.5;
  const edge = s => { let d = ''; for (let i = 0; i <= 40; i++){ const u = i / 40, y = y0 + u * H, x = cx + s * (half - amp * Math.cos(u * N * 6.2832));
    d += (i ? ' L' : 'M') + n2(x) + ',' + n2(y); } return d; };
  const tube = `<path d="${edge(-1)} L${n2(cx + half - amp)},${n2(y1)} ${edge(1).slice(1).split(' L').reverse().join(' L')} Z" fill="#eef8e6" stroke="#6fbf3e" stroke-width="${n2(3 * k)}" stroke-linejoin="round"/>`;
  const plateAt = [0.06, 0.5, 0.94].map(u => y0 + u * H);
  const plates = plateAt.map((y, i) => { const w = half - amp * Math.cos((y - y0) / H * N * 6.2832);
    let dots = ''; for (let j = 0; j < 9; j++){ const t = (j + 0.5) / 9 - 0.5; dots += `<ellipse cx="${n2(cx + t * w * 1.6)}" cy="${n2(y + t * -w * 0.32 + (j % 2 ? 3 : -3) * k)}" rx="${n2(5 * k)}" ry="${n2(1.8 * k)}" fill="#1d2a18" transform="rotate(-14 ${n2(cx + t * w * 1.6)} ${n2(y)})"/>`; }
    return `<g><ellipse cx="${cx}" cy="${n2(y)}" rx="${n2(w * 0.98)}" ry="${n2(12 * k)}" fill="#f6fbf1" stroke="#6fbf3e" stroke-width="${n2(2.4 * k)}" transform="rotate(-14 ${cx} ${n2(y)})"/>${dots}</g>`; });
  const comp = [];
  [[-1, 0.04, 0.46], [-1, 0.52, 0.96], [1, 0.0, 0.42], [1, 0.48, 0.92]].forEach(([sd, a, b]) => {
    const ya = y0 + a * H, yb = y0 + b * H, ym = (ya + yb) / 2, x = cx + sd * (half + 22 * k);
    comp.push(`<path d="M${n2(cx + sd * (half - amp * 0.4))},${n2(ya)} C${n2(x + sd * 34 * k)},${n2(ya + 40 * k)} ${n2(x + sd * 34 * k)},${n2(yb - 40 * k)} ${n2(cx + sd * (half - amp * 0.4))},${n2(yb)} C${n2(x - sd * 6 * k)},${n2(yb - 30 * k)} ${n2(x - sd * 6 * k)},${n2(ya + 30 * k)} ${n2(cx + sd * (half - amp * 0.4))},${n2(ya)}Z" fill="#8fd14f" stroke="#5aa832" stroke-width="${n2(2 * k)}"/>
      <ellipse class="cn" cx="${n2(x + sd * 6 * k)}" cy="${n2(ym)}" rx="${n2(6 * k)}" ry="${n2(15 * k)}" fill="#1d1d1d"/>`); });
  return { tube, plates: plates.join(''), comp: comp.join(''), plateAt, half };
}
function vasPhl(){
  const CX = 470, Y0 = 80, Y1 = 560;
  const P = phloemSvg(CX, Y0, Y1);
  const sug = []; for (let i = 0; i < 10; i++) sug.push(`<rect class="sg" data-i="${i}" width="11" height="11" rx="2" fill="${VAS_PAL.sugar}" stroke="#fff1d6" stroke-width="1.2"/>`);
  const carb = []; for (let i = 0; i < 8; i++) carb.push(`<circle class="cb" data-i="${i}" r="5" fill="#ffe08a" stroke="#fff" stroke-width="1"/>`);
  const body = `
    ${part('pComp', P.comp)}
    ${part('pSieve', P.tube)}
    <g id="sugar">${sug.join('')}${carb.join('')}</g>
    ${part('pPlate', P.plates)}
    <text class="cap sm" x="${CX}" y="${Y1 + 44}" text-anchor="middle">نسيج اللحاء: الأنابيب المنخلية تنقل الجزيئات العضوية، والخلايا المرافقة تنقل الكاربوهيدرات من وإلى الأنابيب المنخلية</text>`;
  return {
    body, fnParts: ['pSieve', 'pComp', 'pPlate'],
    parts: [
      { id: 'pSieve', anchor: [CX + 30, Y0 + 70], label: [866, 120], side: 'R' },
      { id: 'pComp', anchor: [CX + P.half + 40, Y0 + 210], label: [866, 270], side: 'R' },
      { id: 'pPlate', anchor: [CX + 30, P.plateAt[2] - 6], label: [866, 520], side: 'R' }
    ],
    tools: [{ id: 'info:tPhloem', label: 'عن نسيج اللحاء' }, { id: 'tbl:vascCells', label: 'خلايا كل نسيج ووظائفها (ص17)' }],
    tick(dt, t, a){
      const f = focusOwner, sp = f && f !== 'pSieve' && f !== 'pPlate' ? 0.2 : 1;
      /* الجزيئات العضوية تمر داخل الأنبوب المنخلي عبر الصفائح المنخلية */
      a.all('#sugar .sg').forEach(e => { const i = +e.dataset.i, p = ((t * 0.08 * sp + i / 10) % 1), y = Y0 + 20 + p * (Y1 - Y0 - 40);
        e.setAttribute('x', n2(CX - 5 + Math.sin(p * 18 + i) * 18)); e.setAttribute('y', n2(y - 5)); });
      /* الخلايا المرافقة تنقل الكاربوهيدرات من وإلى الأنبوب المنخلي */
      const sc = f && f !== 'pComp' ? 0.2 : 1;
      a.all('#sugar .cb').forEach(e => { const i = +e.dataset.i, sd = i % 2 ? 1 : -1, p = (t * 0.25 * sc + i / 8) % 1, toTube = i % 4 < 2, q = toTube ? p : 1 - p;
        const y = Y0 + 60 + (i * 53) % (Y1 - Y0 - 120), x = CX + sd * (P.half + 34 - q * (P.half + 10));
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', n2(Math.sin(p * Math.PI))); });
      a.all('.cn').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(2 + 4 * (0.5 + 0.5 * Math.sin(t * 2.6 + i)))}px #c8bfff)`);
    }
  };
}

/* ───────── 3) قارن: نسيج الخشب × نسيج اللحاء ───────── */
function vasCmp(){
  const Y0 = 100, Y1 = 500, VX = 300, SX = 650, W = 76;
  let ves = `<rect x="${VX - W / 2}" y="${Y0}" width="${W}" height="${Y1 - Y0}" rx="10" fill="#f3d2c6" stroke="${VAS_PAL.xyl}" stroke-width="4"/>`;
  for (let y = Y0 + 12; y < Y1 - 6; y += 16) ves += `<path d="M${VX - W / 2 + 3},${y} Q${VX},${y + 7} ${VX + W / 2 - 3},${y}" fill="none" stroke="${VAS_PAL.xyl}" stroke-width="2.2" opacity=".55"/>`;
  const PH = phloemSvg(SX, Y0, Y1, 0.85), sv = PH.comp + PH.tube + PH.plates.replace(/<g>/g, '<g class="dHi">');
  const cap = (x, a, b) => `<text class="cap" x="${x}" y="${Y1 + 44}" text-anchor="middle">${a}</text><text class="cap sm" x="${x}" y="${Y1 + 72}" text-anchor="middle">${b}</text>`;
  const drops = []; for (let i = 0; i < 8; i++) drops.push(`<circle class="wd" data-i="${i}" r="6" fill="${VAS_PAL.water}"/>`);
  const sug = []; for (let i = 0; i < 8; i++) sug.push(`<rect class="sg" data-i="${i}" width="10" height="10" rx="2" fill="${VAS_PAL.sugar}"/>`);
  const body = `${part('tXylem', ves)}${part('tPhloem', sv)}<g>${drops.join('')}${sug.join('')}</g>
    ${cap(VX, 'نسيج الخشب (وعاء خشبي)', 'خلايا ميتة فارغة · نقل الماء والمعادن')}${cap(SX, 'نسيج اللحاء', 'نقل المواد الغذائية المذابة')}`;
  let opened = false;
  return {
    body, fnParts: ['tXylem', 'tPhloem'],
    parts: [
      { id: 'tXylem', anchor: [VX - W / 2, 200], label: [134, 200], side: 'L' },
      { id: 'tPhloem', anchor: [SX + PH.half + 40, 220], label: [866, 200], side: 'R' }
    ],
    tools: [{ id: 'tbl:xylPhl', label: 'جدول الفروقات' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'vasc' && SEL.vasv === 'vcmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.xylPhl); }, 700); } },
    tick(dt, t, a){
      a.all('.wd').forEach(e => { const i = +e.dataset.i, p = (t * 0.16 + i / 8) % 1; e.setAttribute('cx', n2(VX + Math.sin(i * 2.3) * 16)); e.setAttribute('cy', n2(Y1 - 10 - p * (Y1 - Y0 - 20))); });
      a.all('.sg').forEach(e => { const i = +e.dataset.i, dn = i % 2 === 0, p = (t * 0.11 + i / 8) % 1, y = dn ? Y0 + 10 + p * (Y1 - Y0 - 20) : Y1 - 10 - p * (Y1 - Y0 - 20);
        e.setAttribute('x', n2(SX - 5 + Math.sin(p * 18 + i) * 14)); e.setAttribute('y', n2(y - 5)); });
      a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(3 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4 + i)))}px #ffd166)`);
    }
  };
}
