
/* ══════════════════════════════════════════════════════════════════════════
   4.3 · نسيج البشرة — ملزمة ص14 وص17 وص23: سطح البشرة بأزواج الخلايا
         الحارسة، مقطع في البشرة، ووظائف البشرة الثلاث (مراحل)
   ══════════════════════════════════════════════════════════════════════════ */
const EPI_VIEWS = [
  { id: 'eleaf', label: 'سطح البشرة' },
  { id: 'esec',  label: 'مقطع في البشرة' },
  { id: 'efn',   label: 'وظائف البشرة' }
];
const EPI_FN_STAGES = [
  { n: 'الحماية', d: 'نسيج البشرة يغطي جسم النبات الأولي لجميع أجزاء النبات، ومن وظائفه حماية النبات.',
    cam: { yaw: 0.15, pitch: 0.35, dist: 8.6, target: [0, 0.1, 0] } },
  { n: 'السيطرة على تبادل الغازات', d: 'تسيطر البشرة على تبادل الغازات من خلال أزواج من الخلايا الحارسة في الساق والأوراق.',
    cam: { yaw: 0.3, pitch: 0.45, dist: 5.6, target: [0, 1.2, 0] } },
  { n: 'امتصاص الماء والأملاح المذابة', d: 'تمتص البشرة الماء والأملاح المذابة في الجذور.',
    cam: { yaw: 0.2, pitch: 0.3, dist: 5.8, target: [0, -1.1, 0] } }
];
const EPI_PAL = { cell: '#cfe7c0', line: '#6f9a5c', guard: '#5aa85a', guardL: '#e6ffd8', pore: '#13221a', cut: '#f2d675', co2: '#b8c2cc', o2: '#9fe9ff', h2o: '#6fc3ff' };

SCENES.epid = {
  title: 'نسيج البشرة',
  get src(){ return SEL.epiv === 'efn' ? 'ملزمة ص14 وص17 وص23' : 'ملزمة ص14 وص23'; },
  tint: ['rgba(100,160,90,.26)', 'rgba(90,140,170,.16)'],
  model3d: () => 'epi_' + SEL.epiv,
  build(){
    const v = SEL.epiv || 'eleaf';
    const s = v === 'esec' ? epiSec() : v === 'efn' ? epiFn() : epiLeaf();
    s.rebuildOnRadio = 'epiv';
    s.tools = EPI_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'epiv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.epi_leaf = { title: 'سطح البشرة وأزواج الخلايا الحارسة', build: () => epiLeaf() };
SCENES.epi_sec  = { title: 'مقطع في البشرة', build: () => epiSec() };
SCENES.epi_fn   = { title: 'وظائف البشرة', build: () => epiFn(true) };

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
    <g>${pores.join('')}</g>
    ${part('guard', guards.join(''))}
    <g id="gasL">${gasDots(36)}</g>
    ${GAS_LEGEND(125, 470)}
    <text class="cap sm" x="500" y="${Y1 + 40}" text-anchor="middle">سطح البشرة (منظر مكبّر): خلايا متراصة تنعدم بينها المسافات البينية، وأزواج الخلايا الحارسة تسيطر على تبادل الغازات</text>`;
  return {
    body, fnParts: ['guard'],
    parts: [
      { id: 'epidermis', anchor: [780, 110], label: [866, 90], side: 'R' },
      { id: 'guard', anchor: [700 + 22, 230], label: [866, 240], side: 'R' }
    ],
    tools: [{ id: 'tbl:epiParts', label: 'صفات البشرة ووظائفها (ص14)' }],
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
  const body = `
    <g opacity=".55">${mes.join('')}</g>
    <path d="M440,${Y - 4} Q500,${Y - 90} 560,${Y - 4}Z" fill="#0f1d16" opacity=".7"/>
    ${part('epidermis', ep.join(''))}
    <rect x="488" y="${Y}" width="24" height="${H}" fill="${EPI_PAL.pore}"/>
    ${part('guard', guards)}
    <g id="gasS">${gasDots(15)}</g>
    ${GAS_LEGEND(125, 90)}
    <text class="cap sm" x="500" y="40" text-anchor="middle">داخل الورقة</text>
    <text class="cap sm" x="500" y="${Y + H + 120}" text-anchor="middle">خارج الورقة — البشرة صف واحد من الخلايا المسطحة المتراصة تنعدم بينها المسافات البينية</text>`;
  return {
    body, fnParts: ['guard'],
    parts: [
      { id: 'epidermis', anchor: [X1 - 30, Y + 35], label: [866, 330], side: 'R' },
      { id: 'guard', anchor: [500 - 50, Y + 28], label: [134, 320], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiParts', label: 'صفات البشرة ووظائفها (ص14)' }],
    tick(dt, t, a){
      a.all('#gasS .gas').forEach(e => { const i = +e.dataset.i, k = +e.dataset.k, p = (t * 0.3 + i / 15 * 2) % 1;
        const out = k !== 0, y = out ? Y - 30 + p * 200 : Y + 170 - p * 200, x = 500 + Math.sin(i * 1.9 + p * 3) * (Math.abs(y - Y - 35) > 50 ? 40 : 6);
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', n2(Math.sin(p * Math.PI) * 0.9)); });
    }
  };
}

/* ───────── 3) وظائف البشرة الثلاث (مراحل) — ص14 وص17 وص23 ───────── */
function epiFn(still){
  /* أعلى: بشرة ساق أو ورقة بزوج من الخلايا الحارسة · أسفل: بشرة جذر في التربة */
  const X0 = 170, X1 = 830, TY = 196, RY = 452, CHh = 54;
  const row = (y, skip) => { const o = []; for (let x = X0; x < X1; x += 66){ if (skip && x > 440 && x < 560) continue;
    o.push(`<rect x="${x + 1}" y="${y}" width="64" height="${CHh}" rx="8" fill="${EPI_PAL.cell}" stroke="${EPI_PAL.line}" stroke-width="2"/><circle cx="${x + 33}" cy="${y + 28}" r="6" fill="url(#gNucl)"/>`); } return o.join(''); };
  const guards = [-1, 1].map(k => `<ellipse cx="${500 + k * 30}" cy="${TY + 24}" rx="26" ry="22" fill="${EPI_PAL.guard}" stroke="${EPI_PAL.guardL}" stroke-width="1.6"/>
    <ellipse cx="${500 + k * 34}" cy="${TY + 18}" rx="5" ry="3.5" fill="#2f8f3a"/><ellipse cx="${500 + k * 26}" cy="${TY + 32}" rx="5" ry="3.5" fill="#2f8f3a"/>`).join('');
  const inner = []; for (let i = 0; i < 10; i++) inner.push(`<ellipse cx="${X0 + 35 + i * 68}" cy="${TY + CHh + 40}" rx="30" ry="30" fill="#5f9a5c" opacity=".45"/>`);
  const rootIn = []; for (let i = 0; i < 10; i++) rootIn.push(`<ellipse cx="${X0 + 35 + i * 68}" cy="${RY - 34}" rx="30" ry="24" fill="#c9b48a" opacity=".35"/>`);
  const dots = (cls, n, r, fill) => { const o = []; for (let i = 0; i < n; i++) o.push(`<circle class="${cls}" data-i="${i}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1" opacity="0"/>`); return o.join(''); };
  const body = `
    <rect x="${X0 - 30}" y="80" width="${X1 - X0 + 60}" height="${TY - 80}" rx="14" fill="#1b2a35" opacity=".55"/>
    <text class="cap sm" x="${X0}" y="104" text-anchor="start">الهواء الخارجي</text>
    <g>${inner.join('')}</g>
    <rect x="${X0 - 30}" y="${RY + CHh}" width="${X1 - X0 + 60}" height="${640 - RY - CHh}" rx="14" fill="#4a3523" opacity=".85"/>
    <text class="cap sm" x="${X0}" y="${RY + CHh + 30}" text-anchor="start">التربة</text>
    <g>${rootIn.join('')}</g>
    ${part('epidermis', row(TY, true) + row(RY, false))}
    <rect x="490" y="${TY}" width="20" height="${CHh}" fill="${EPI_PAL.pore}"/>
    ${part('guard', guards)}
    <g id="fnDots">${dots('thr', 14, 7, '#ff8a7a')}${dots('gas', 15, 5.5, EPI_PAL.co2)}${dots('wtr', 16, 6, EPI_PAL.h2o)}${dots('slt', 8, 4, '#f4f1e6')}</g>
    <text class="cap" x="500" y="${TY + CHh + 92}" text-anchor="middle">بشرة الساق والأوراق</text>
    <text class="cap" x="500" y="${RY - 72}" text-anchor="middle">بشرة الجذر</text>
    ${GAS_LEGEND(125, 330)}`;
  const parts = [
    { id: 'epidermis', anchor: [X1 - 40, TY + 30], label: [866, 300], side: 'R' },
    { id: 'guard', anchor: [500 - 40, TY + 20], label: [134, 260], side: 'L' }
  ];
  if (still) return { body, parts, fnParts: [] };
  const ctl = stageCtl(EPI_FN_STAGES, { label: 'المرحلة', dur: 3 * 7 });
  return {
    body, stages: EPI_FN_STAGES, parts, fnParts: ['epidermis', 'guard'],
    tools: ctl.tools.concat([{ id: 'tbl:epiParts', label: 'صفات البشرة ووظائفها (ص14)' }]),
    init(){ ctl.start(); },
    onSlider: v => ctl.onSlider(v),
    onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const st = STG.idx;
      /* 1) الحماية: أجسام خارجية تصطدم بالبشرة وترتد */
      a.all('#fnDots .thr').forEach(e => { const i = +e.dataset.i, top = i % 2 === 0, p = (t * 0.45 + i / 14) % 1,
        x = X0 + 30 + ((i * 97) % (X1 - X0 - 60)), d = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2, y = top ? TY - 8 - d * 90 : RY + CHh + 8 + d * 90;
        e.setAttribute('cx', n2(x + (p > 0.5 ? (i % 3 - 1) * (p - 0.5) * 60 : 0))); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', st === 0 ? n2(0.85 * Math.sin(p * Math.PI) + 0.1) : '0'); });
      /* 2) تبادل الغازات عبر زوج الخلايا الحارسة */
      a.all('#fnDots .gas').forEach(e => { const i = +e.dataset.i, k = i % 3, p = (t * 0.32 + i / 15 * 2) % 1, inward = k === 0;
        const y = inward ? TY - 90 + p * 200 : TY + CHh + 90 - p * 200, x = 500 + Math.sin(i * 1.9 + p * 3) * (Math.abs(y - TY - CHh / 2) > 40 ? 50 : 4);
        e.setAttribute('fill', k === 0 ? EPI_PAL.co2 : k === 1 ? EPI_PAL.o2 : EPI_PAL.h2o);
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', st === 1 ? n2(Math.sin(p * Math.PI) * 0.95) : '0'); });
      /* 3) امتصاص الماء والأملاح المذابة في الجذر */
      const absorb = (cls, n, sp) => a.all('#fnDots .' + cls).forEach(e => { const i = +e.dataset.i, p = (t * sp + i / n) % 1, x = X0 + 30 + ((i * 131) % (X1 - X0 - 60));
        e.setAttribute('cx', n2(x + Math.sin(p * 6 + i) * 6)); e.setAttribute('cy', n2(RY + CHh + 120 - p * 150)); e.setAttribute('opacity', st === 2 ? n2(Math.sin(p * Math.PI) * 0.95) : '0'); });
      absorb('wtr', 16, 0.3); absorb('slt', 8, 0.24);
      const lit = st === 1 ? 'guard' : 'epidermis';
      a.all('.part').forEach(p => p.style.filter = (focusOwner ? p.dataset.part === focusOwner : p.dataset.part === lit) ? `drop-shadow(0 0 ${n2(4 + 3 * Math.sin(t * 4))}px #ffd166)` : '');
    }
  };
}
