
/* ══════════════════════════════════════════════════════════════════════════
   4.4 · البشرة والثغور: سطح البشرة السفلى بثغورها، مقطع في البشرة
         (الكيوتكل والشعيرات)، وحركة الثغر بمراحلها
   ══════════════════════════════════════════════════════════════════════════ */
const EPI_VIEWS = [
  { id: 'eleaf', label: 'سطح البشرة' },
  { id: 'esec',  label: 'مقطع في البشرة' },
  { id: 'estom', label: 'فتح الثغر وغلقه' }
];
const STOMA_STAGES = [
  { n: 'الثغر مغلق', d: 'الخليتان الحارستان رخوتان ومستقيمتان، فتتلامسان والثغر مغلق.',
    cam: { yaw: 0.1, pitch: 1.0, dist: 6.4, target: [0, 0, 0] } },
  { n: 'دخول الماء', d: 'يدخل الماء إلى الخليتين الحارستين فتنتفخان وتنحنيان (جدارهما المحيط بالفتحة سميك والخارجي رقيق)، فيبدأ الثغر بالانفتاح.',
    cam: { yaw: 0.35, pitch: 0.8, dist: 5.8, target: [0, 0, 0] } },
  { n: 'الثغر مفتوح', d: 'عبر الثغر المفتوح يدخل ثنائي أوكسيد الكاربون ويخرج الأوكسجين وبخار الماء.',
    cam: { yaw: 0.0, pitch: 0.55, dist: 6.8, target: [0, -0.2, 0] } },
  { n: 'فقدان الماء', d: 'تفقد الخليتان الحارستان الماء فترتخيان وتستقيمان، فينغلق الثغر.',
    cam: { yaw: -0.3, pitch: 0.9, dist: 6.2, target: [0, 0, 0] } }
];
const EPI_PAL = { cell: '#cfe7c0', line: '#6f9a5c', guard: '#5aa85a', guardL: '#e6ffd8', pore: '#13221a', cut: '#f2d675', co2: '#b8c2cc', o2: '#9fe9ff', h2o: '#6fc3ff' };

SCENES.epid = {
  title: 'البشرة والثغور',
  get src(){ return SRC_WAIT; },
  tint: ['rgba(100,160,90,.26)', 'rgba(90,140,170,.16)'],
  model3d: () => 'epi_' + SEL.epiv,
  build(){
    const v = SEL.epiv || 'eleaf';
    const s = v === 'esec' ? epiSec() : v === 'estom' ? epiStom() : epiLeaf();
    s.rebuildOnRadio = 'epiv';
    s.tools = EPI_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'epiv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.epi_leaf = { title: 'سطح البشرة السفلى للورقة', build: () => epiLeaf() };
SCENES.epi_sec  = { title: 'مقطع في البشرة', build: () => epiSec() };
SCENES.epi_stom = { title: 'الثغر والخليتان الحارستان', build: () => epiStom() };

/* خلية حارسة كلوية: s = -1 يسار، 1 يمين؛ o = مقدار فتح الثغر (0..1) */
function guardPath(cx, cy, s, L, o, W){
  const a = 1.5 + 0.34 * W * o, N = 16, inn = [], out = [];
  for (let i = 0; i <= N; i++){
    const u = i / N, sn = Math.sin(Math.PI * u), y = cy - L * Math.cos(Math.PI * u);
    inn.push([cx + s * a * sn, y]);
    out.push([cx + s * (a * sn + W * Math.pow(sn, 0.65) * (1 - 0.12 * o) + 2), y]);
  }
  const pts = inn.concat(out.reverse());
  return 'M' + pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L') + 'Z';
}
const porePath = (cx, cy, L, o, W) => { const a = 1.5 + 0.34 * W * o; return `M${n2(cx)},${n2(cy - L * 0.92)} Q${n2(cx + a * 1.9)},${n2(cy)} ${n2(cx)},${n2(cy + L * 0.92)} Q${n2(cx - a * 1.9)},${n2(cy)} ${n2(cx)},${n2(cy - L * 0.92)}Z`; };
/* ثغر كامل: الخليتان والفتحة (العناصر تُحدَّث بالحركة عبر data) */
function stomaSvg(id, cx, cy, L, W, o){
  const chl = []; [-1, 1].forEach(s => { for (let k = 0; k < 4; k++){ const u = 0.2 + k * 0.2, y = cy - L * Math.cos(Math.PI * u);
    chl.push(`<ellipse class="gc" data-s="${s}" data-u="${u}" cx="${n2(cx + s * (W * 0.55 + 4))}" cy="${n2(y)}" rx="${n2(W * 0.13)}" ry="${n2(W * 0.08)}" fill="#2f8f3a"/>`); } });
  return { pore: `<path class="pore" data-id="${id}" d="${porePath(cx, cy, L, o, W)}" fill="${EPI_PAL.pore}"/>`,
    guard: `<g class="stomaG" data-id="${id}" data-cx="${cx}" data-cy="${cy}" data-l="${L}" data-w="${W}">
      <path class="gL" d="${guardPath(cx, cy, -1, L, o, W)}" fill="${EPI_PAL.guard}" stroke="${EPI_PAL.guardL}" stroke-width="1.6"/>
      <path class="gR" d="${guardPath(cx, cy, 1, L, o, W)}" fill="${EPI_PAL.guard}" stroke="${EPI_PAL.guardL}" stroke-width="1.6"/>
      ${chl.join('')}</g>` };
}
function setStoma(g, pore, o){
  const cx = +g.dataset.cx, cy = +g.dataset.cy, L = +g.dataset.l, W = +g.dataset.w;
  g.querySelector('.gL').setAttribute('d', guardPath(cx, cy, -1, L, o, W));
  g.querySelector('.gR').setAttribute('d', guardPath(cx, cy, 1, L, o, W));
  if (pore) pore.setAttribute('d', porePath(cx, cy, L, o, W));
  const a = 1.5 + 0.34 * W * o;
  g.querySelectorAll('.gc').forEach(e => { const s = +e.dataset.s, u = +e.dataset.u, sn = Math.sin(Math.PI * u);
    e.setAttribute('cx', n2(cx + s * (a * sn + W * Math.pow(sn, 0.65) * 0.5 + 2))); });
}
/* خلايا بشرة متعرّجة الحدود (منظر سطحي) */
function wavyCells(x0, y0, x1, y1, cw, ch, seed){
  const rr = rng(seed), lines = [];
  for (let y = y0 + ch; y < y1; y += ch){
    let d = `M${x0},${n2(y)}`; for (let x = x0; x <= x1; x += 10) d += ` L${x},${n2(y + Math.sin(x * 0.11 + y) * 5)}`;
    lines.push(d);
  }
  let row = 0;
  for (let y = y0; y < y1; y += ch, row++){
    for (let x = x0 + (row % 2 ? cw / 2 : 0) + cw; x < x1; x += cw){
      let d = `M${n2(x)},${n2(y)}`; for (let yy = y; yy <= Math.min(y1, y + ch); yy += 8) d += ` L${n2(x + Math.sin(yy * 0.16 + x) * 6 + (rr() - 0.5) * 2)},${n2(yy)}`;
      lines.push(d);
    }
  }
  return lines.map(d => `<path d="${d}" fill="none" stroke="${EPI_PAL.line}" stroke-width="2.2"/>`).join('');
}
/* جزيئات غازات تدخل وتخرج من الثغور المفتوحة */
function gasDots(n){ const o = []; for (let i = 0; i < n; i++){ const k = i % 3;
  o.push(`<circle class="gas" data-i="${i}" data-k="${k}" r="${k === 0 ? 6 : 5}" fill="${k === 0 ? EPI_PAL.co2 : k === 1 ? EPI_PAL.o2 : EPI_PAL.h2o}" stroke="#fff" stroke-width="1" opacity="0"/>`); } return o.join(''); }
const GAS_LEGEND = (x, y) => `<g class="gasLeg" font-size="13" fill="#e6f1ea">
  <circle cx="${x}" cy="${y}" r="6" fill="${EPI_PAL.co2}"/><text x="${x - 12}" y="${y + 5}" text-anchor="start">CO₂ يدخل</text>
  <circle cx="${x}" cy="${y + 24}" r="5" fill="${EPI_PAL.o2}"/><text x="${x - 12}" y="${y + 29}" text-anchor="start">O₂ يخرج</text>
  <circle cx="${x}" cy="${y + 48}" r="5" fill="${EPI_PAL.h2o}"/><text x="${x - 12}" y="${y + 53}" text-anchor="start">بخار الماء يخرج</text></g>`;

/* ───────── 1) سطح البشرة السفلى للورقة ───────── */
function epiLeaf(){
  const X0 = 170, Y0 = 70, X1 = 830, Y1 = 540;
  const ST = [[300, 170], [520, 140], [700, 230], [400, 360], [620, 420], [260, 470]];
  const pores = [], guards = [];
  ST.forEach(([x, y], i) => { const s = stomaSvg('s' + i, x, y, 34, 20, 0.6); pores.push(s.pore); guards.push(s.guard); });
  const body = `
    ${part('epidermis', `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="18" fill="${EPI_PAL.cell}"/>${wavyCells(X0, Y0, X1, Y1, 110, 90, 4)}
      <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="18" fill="none" stroke="#9fc48a" stroke-width="3"/>`)}
    ${part('stoma', pores.join(''))}
    ${part('guard', guards.join(''))}
    <g id="gasL">${gasDots(36)}</g>
    ${GAS_LEGEND(125, 470)}
    <text class="cap sm" x="500" y="${Y1 + 40}" text-anchor="middle">سطح البشرة السفلى للورقة (منظر مكبّر) — الثغور تنفتح وتنغلق</text>`;
  return {
    body, fnParts: ['stoma', 'guard'],
    parts: [
      { id: 'epidermis', anchor: [780, 110], label: [866, 90], side: 'R' },
      { id: 'guard', anchor: [700 + 22, 230], label: [866, 240], side: 'R' },
      { id: 'stoma', anchor: [300, 170], label: [134, 170], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiParts', label: 'تراكيب البشرة' }],
    tick(dt, t, a){
      const o = 0.5 + 0.5 * Math.sin(t * 0.8);
      const gs = a.all('.stomaG'), ps = a.all('.pore');
      gs.forEach((g, i) => setStoma(g, ps[i], Math.max(0, Math.min(1, o + Math.sin(i * 1.7) * 0.15))));
      a.all('#gasL .gas').forEach(e => { const i = +e.dataset.i, k = +e.dataset.k, [x, y] = ST[i % ST.length], p = (t * 0.35 + i / 36 * 3) % 1;
        const inward = k === 0, d = inward ? 60 * (1 - p) : 60 * p, ang = i * 2.4;
        e.setAttribute('cx', n2(x + Math.cos(ang) * d)); e.setAttribute('cy', n2(y + Math.sin(ang) * d));
        e.setAttribute('opacity', n2(o > 0.3 ? Math.sin(p * Math.PI) * 0.9 : 0)); });
    }
  };
}

/* ───────── 2) مقطع في البشرة السفلى للورقة ───────── */
function epiSec(){
  const Y = 360, H = 70, X0 = 140, X1 = 860, rr = rng(9);
  /* خلايا تحت البشرة (أعلى) */
  const mes = []; for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++){ const x = X0 + 40 + i * 82 + (j % 2) * 30, y = 150 + j * 90 + (rr() - 0.5) * 10;
    if (Math.abs(x - 500) < 70 && j === 1) continue;
    mes.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="36" ry="38" fill="#5f9a5c" stroke="#d6f5c4" stroke-width="1.4"/>` +
      [0, 1, 2, 3].map(k => `<ellipse cx="${n2(x + Math.cos(k * 1.6) * 24)}" cy="${n2(y + Math.sin(k * 1.6) * 24)}" rx="6" ry="4" fill="#2f8f3a"/>`).join('')); }
  /* خلايا البشرة: صف واحد متراص، والثغر في الوسط */
  const ep = []; for (let x = X0; x < X1; x += 72){ if (x > 430 && x < 560) continue;
    ep.push(`<rect x="${x + 1}" y="${Y}" width="70" height="${H}" rx="8" fill="${EPI_PAL.cell}" stroke="${EPI_PAL.line}" stroke-width="2"/><circle cx="${x + 36}" cy="${Y + 40}" r="7" fill="url(#gNucl)"/>`); }
  const guards = [-1, 1].map(s => `<ellipse class="gsec" data-s="${s}" cx="${500 + s * 36}" cy="${Y + 28}" rx="30" ry="26" fill="${EPI_PAL.guard}" stroke="${EPI_PAL.guardL}" stroke-width="1.6"/>
    <ellipse cx="${500 + s * 40}" cy="${Y + 20}" rx="6" ry="4" fill="#2f8f3a"/><ellipse cx="${500 + s * 30}" cy="${Y + 38}" rx="6" ry="4" fill="#2f8f3a"/>`).join('');
  /* الكيوتكل: طبقة شمعية أسفل البشرة (السطح الخارجي) */
  const cut = `<path d="M${X0},${Y + H} L430,${Y + H} Q470,${Y + H + 4} 474,${Y + 54} M526,${Y + 54} Q530,${Y + H + 4} 570,${Y + H} L${X1},${Y + H}" fill="none" stroke="${EPI_PAL.cut}" stroke-width="9" stroke-linecap="round"/>`;
  /* الشعيرات: زوائد متعددة الخلايا من خلايا البشرة */
  const hairs = [[220, -1], [690, 1], [790, -1]].map(([x, s]) => `<g class="hair" data-x="${x}"><path d="M${x},${Y + H + 4} q${s * 6},40 ${s * 2},80 q${s * -4},30 ${s * 10},60" fill="none" stroke="#e8f2d8" stroke-width="12" stroke-linecap="round"/>
    <line x1="${x - 7}" y1="${Y + H + 52}" x2="${x + 7}" y2="${Y + H + 52}" stroke="${EPI_PAL.line}" stroke-width="2"/><line x1="${x + s * 2 - 7}" y1="${Y + H + 110}" x2="${x + s * 2 + 7}" y2="${Y + H + 110}" stroke="${EPI_PAL.line}" stroke-width="2"/></g>`).join('');
  const body = `
    ${part('mesoph', mes.join(''))}
    <path d="M440,${Y - 4} Q500,${Y - 90} 560,${Y - 4}Z" fill="#0f1d16" opacity=".7"/>
    ${part('epidermis', ep.join(''))}
    ${part('stoma', `<rect x="488" y="${Y}" width="24" height="${H}" fill="${EPI_PAL.pore}"/>`)}
    ${part('guard', guards)}
    ${part('cuticle', cut)}
    ${part('trich', hairs)}
    <g id="gasS">${gasDots(15)}</g>
    ${GAS_LEGEND(125, 90)}
    <text class="cap sm" x="500" y="40" text-anchor="middle">داخل الورقة</text>
    <text class="cap sm" x="500" y="${Y + H + 190}" text-anchor="middle">خارج الورقة — مقطع في البشرة السفلى</text>`;
  return {
    body, fnParts: ['stoma', 'guard', 'trich'],
    parts: [
      { id: 'mesoph', anchor: [X0 + 40 + 82 * 7, 150], label: [866, 150], side: 'R' },
      { id: 'epidermis', anchor: [X1 - 30, Y + 35], label: [866, 330], side: 'R' },
      { id: 'cuticle', anchor: [X1 - 60, Y + H + 2], label: [866, 450], side: 'R' },
      { id: 'trich', anchor: [790, Y + H + 100], label: [866, 560], side: 'R' },
      { id: 'guard', anchor: [500 - 50, Y + 28], label: [134, 320], side: 'L' },
      { id: 'stoma', anchor: [500, Y + H - 8], label: [134, 470], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiParts', label: 'تراكيب البشرة' }],
    tick(dt, t, a){
      a.all('#gasS .gas').forEach(e => { const i = +e.dataset.i, k = +e.dataset.k, p = (t * 0.3 + i / 15 * 2) % 1;
        const out = k !== 0, y = out ? Y - 30 + p * 200 : Y + 170 - p * 200, x = 500 + Math.sin(i * 1.9 + p * 3) * (Math.abs(y - Y - 35) > 50 ? 40 : 6);
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', n2(Math.sin(p * Math.PI) * 0.9)); });
      a.all('.hair').forEach((e, i) => e.setAttribute('transform', `rotate(${n2(Math.sin(t * 1.4 + i) * 4)} ${e.dataset.x} ${Y + H})`));
    }
  };
}

/* ───────── 3) فتح الثغر وغلقه (المراحل) ───────── */
function epiStom(){
  const CX = 500, CY = 300, L = 150, W = 92;
  const s = stomaSvg('big', CX, CY, L, W, 0);
  const nuc = [-1, 1].map(k => `<circle class="gn" data-s="${k}" cx="${CX + k * 60}" cy="${CY}" r="12" fill="url(#gNucl)"/>`).join('');
  const thick = [-1, 1].map(k => `<path class="gThick" data-s="${k}" d="" fill="none" stroke="#f3ffe8" stroke-width="6" stroke-linecap="round"/>`).join('');
  const cells = `<rect x="200" y="80" width="600" height="440" rx="26" fill="${EPI_PAL.cell}"/>${wavyCells(200, 80, 800, 520, 150, 110, 12)}
    <rect x="200" y="80" width="600" height="440" rx="26" fill="none" stroke="#9fc48a" stroke-width="3"/>`;
  const waters = []; for (let i = 0; i < 10; i++) waters.push(`<circle class="wtr" data-i="${i}" r="7" fill="${EPI_PAL.h2o}" stroke="#e8f7ff" stroke-width="1.2" opacity="0"/>`);
  const body = `
    ${part('epidermis', cells)}
    <ellipse cx="${CX}" cy="${CY}" rx="${W * 1.4}" ry="${L * 1.12}" fill="${EPI_PAL.cell}"/>
    ${part('stoma', s.pore)}
    ${part('guard', s.guard + nuc + thick)}
    <g id="wtrs">${waters.join('')}</g>
    <g id="gasT">${gasDots(18)}</g>
    ${GAS_LEGEND(125, 440)}
    <text class="cap sm" x="${CX}" y="560" text-anchor="middle">ثغر وخليتان حارستان (منظر سطحي مكبّر)</text>`;
  const ctl = stageCtl(STOMA_STAGES, { label: 'المرحلة', dur: 4 * 6 });
  const openAt = () => { const st = STG.idx, k = STG.k; return st === 0 ? 0 : st === 1 ? k : st === 2 ? 1 : 1 - k; };
  return {
    body, stages: STOMA_STAGES, fnParts: ['stoma', 'guard'],
    parts: [
      { id: 'epidermis', anchor: [760, 120], label: [866, 110], side: 'R' },
      { id: 'guard', anchor: [CX + W * 0.9, CY - 40], label: [866, 280], side: 'R' },
      { id: 'stoma', anchor: [CX, CY - L * 0.5], label: [134, 200], side: 'L' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:stomaState', label: 'الثغر: مفتوح × مغلق' }]),
    init(){ ctl.start(); },
    onSlider: v => ctl.onSlider(v),
    onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const st = STG.idx, k = STG.k, o = openAt();
      const g = a.el('.stomaG'), pore = a.el('.pore'); if (g) setStoma(g, pore, o);
      const ap = 1.5 + 0.34 * W * o;
      a.all('.gn').forEach(e => e.setAttribute('cx', n2(CX + +e.dataset.s * (ap + W * 0.5 + 2))));
      /* الجدار السميك المحيط بالفتحة */
      a.all('.gThick').forEach(e => { const sd = +e.dataset.s; let d = '';
        for (let i = 0; i <= 12; i++){ const u = 0.08 + i / 12 * 0.84, y = CY - L * Math.cos(Math.PI * u); d += (i ? ' L' : 'M') + n2(CX + sd * (ap * Math.sin(Math.PI * u) + 4)) + ',' + n2(y); }
        e.setAttribute('d', d); });
      /* الماء يدخل الخليتين (المرحلة 2) أو يخرج منهما (المرحلة 4) */
      a.all('#wtrs .wtr').forEach(e => { const i = +e.dataset.i, sd = i % 2 ? 1 : -1, p = (t * 0.5 + i / 10) % 1;
        const show = st === 1 || st === 3, inward = st === 1, f = inward ? p : 1 - p;
        const x = CX + sd * (W * 2.2 - f * (W * 1.4)), y = CY + Math.sin(i * 1.3) * L * 0.6;
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', show ? n2(Math.sin(p * Math.PI) * 0.95) : '0'); });
      /* تبادل الغازات عبر الفتحة (المرحلة 3) */
      a.all('#gasT .gas').forEach(e => { const i = +e.dataset.i, kk = +e.dataset.k, p = (t * 0.35 + i / 18 * 3) % 1;
        const inward = kk === 0, d = inward ? 160 * (1 - p) : 160 * p, ang = i * 2.1;
        e.setAttribute('cx', n2(CX + Math.cos(ang) * d * 0.6)); e.setAttribute('cy', n2(CY + Math.sin(ang) * d));
        e.setAttribute('opacity', n2(st === 2 ? Math.sin(p * Math.PI) * 0.9 : 0)); });
      void k;
    }
  };
}
