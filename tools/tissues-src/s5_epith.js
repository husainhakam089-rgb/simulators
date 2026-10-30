
/* ══════════════════════════════════════════════════════════════════════════
   4.5 · النسيج الظهاري (الطلائي) — ملزمة ص26–41: البسيط بأنواعه الأربعة
         (الحرشفي، المكعبي، العمودي، العمودي المطبق الكاذب) والمطبق بأنواعه
         الأربعة (الحرشفي، المكعبي، العمودي، المتحول)، برسوم الملزمة وخطواتها
   ══════════════════════════════════════════════════════════════════════════ */
const ETH_VIEWS = [
  { id: 'esq',  label: 'حرشفي بسيط' },
  { id: 'ecub', label: 'مكعبي بسيط' },
  { id: 'ecol', label: 'عمودي بسيط' },
  { id: 'epse', label: 'عمودي مطبق كاذب' },
  { id: 'estr', label: 'حرشفي مطبق' },
  { id: 'escb', label: 'مكعبي مطبق' },
  { id: 'escl', label: 'عمودي مطبق' },
  { id: 'etra', label: 'متحول' },
  { id: 'ecmp', label: 'بسيط × مطبق' }
];
const ETH_SRC = { esq: 'ملزمة ص28–29', ecub: 'ملزمة ص28–29', ecol: 'ملزمة ص30–31', epse: 'ملزمة ص30–31 وص35', estr: 'ملزمة ص32–33',
  escb: 'ملزمة ص32–33', escl: 'ملزمة ص34–35', etra: 'ملزمة ص34 وص36', ecmp: 'ملزمة ص26–27' };
const ETH_PAL = { cell: '#e8b4b8', cell2: '#d98a92', cell3: '#f2d0d2', line: '#fff0f0', ct: '#5a3a4c', fib: '#c9a0b4', bm: '#e9d29a', nuc: 'url(#gNucl)',
  o2: '#9fe9ff', co2: '#b8c2cc', sec: '#f7d774', abs: '#6fc3ff', mucus: '#cfe6b8', hit: '#ff8a7a' };

SCENES.epith = {
  title: 'النسيج الظهاري (الطلائي)',
  get src(){ return ETH_SRC[SEL.ethv] || 'ملزمة ص26'; },
  tint: ['rgba(170,90,100,.24)', 'rgba(110,90,150,.16)'],
  model3d: () => 'eth_' + SEL.ethv,
  build(){
    const v = ETH_VIEWS.some(x => x.id === SEL.ethv) ? SEL.ethv : 'esq';
    const s = ({ esq: ethSq, ecub: ethCub, ecol: ethCol, epse: ethPse, estr: ethStr, escb: ethScb, escl: ethScl, etra: ethTra, ecmp: ethCmp })[v]();
    s.rebuildOnRadio = 'ethv';
    s.tools = ETH_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'ethv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.eth_sq  = { title: 'النسيج الظهاري الحرشفي البسيط', build: () => ethSq() };
SCENES.eth_cub = { title: 'النسيج الظهاري المكعبي البسيط', build: () => ethCub() };
SCENES.eth_col = { title: 'النسيج الظهاري العمودي البسيط', build: () => ethCol() };
SCENES.eth_pse = { title: 'النسيج الظهاري العمودي (المطبق الكاذب)', build: () => ethPse() };
SCENES.eth_str = { title: 'النسيج الظهاري المطبق الحرشفي', build: () => ethStr() };
SCENES.eth_scb = { title: 'النسيج الظهاري المطبق المكعبي', build: () => ethScb() };
SCENES.eth_scl = { title: 'النسيج الظهاري المطبق العمودي', build: () => ethScl() };
SCENES.eth_tra = { title: 'النسيج الظهاري المتحول', build: () => ethTra() };

/* ───────── أدوات رسم مشتركة (منظر مجسّم مائل مثل رسوم الملزمة) ───────── */
const ep = (x, y) => n2(x) + ',' + n2(y);
const poly = (pts, fill, stroke, sw, extra) => `<path d="M${pts.map(p => ep(p[0], p[1])).join(' L')}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw || 1.6}"${extra || ''}/>`;
/* نسيج ضام: شريط بألياف متموجة وخلايا مغزلية (وجه أمامي، ووجه جانبي إن وُجد عمق) */
function ethCT(x0, y0, w, h, dx, dy, seed){
  const rr = rng(seed || 7); let s = `<rect x="${n2(x0)}" y="${n2(y0)}" width="${n2(w)}" height="${n2(h)}" fill="${ETH_PAL.ct}" stroke="${ETH_PAL.fib}" stroke-width="1.4"/>`;
  for (let i = 0; i < 4; i++){ const y = y0 + h * (i + 0.6) / 4.4; let d = `M${ep(x0 + 4, y)}`; for (let x = x0 + 4; x < x0 + w - 4; x += 22) d += ` Q${ep(x + 11, y + (i % 2 ? 5 : -5))} ${ep(x + 22, y)}`; s += `<path d="${d}" fill="none" stroke="${ETH_PAL.fib}" stroke-width="1.1" opacity=".75"/>`; }
  for (let i = 0; i < Math.max(2, Math.round(w / 110)); i++){ const x = x0 + 30 + rr() * (w - 60), y = y0 + h * (0.3 + rr() * 0.4);
    s += `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="16" ry="4" fill="#8a6276" transform="rotate(${n2((rr() - 0.5) * 20)} ${n2(x)} ${n2(y)})"/><circle cx="${n2(x)}" cy="${n2(y)}" r="2.6" fill="#2a1a24"/>`; }
  if (dx) s += poly([[x0 + w, y0], [x0 + w + dx, y0 + dy], [x0 + w + dx, y0 + h + dy], [x0 + w, y0 + h]], '#4a2f3e', ETH_PAL.fib, 1.4) +
    [0.3, 0.6].map(k => `<path d="M${ep(x0 + w, y0 + h * k)} L${ep(x0 + w + dx, y0 + h * k + dy)}" stroke="${ETH_PAL.fib}" stroke-width="1" opacity=".7"/>`).join('');
  return s;
}
const ethBM = (x0, y, w, h, dx, dy) => `<rect x="${n2(x0)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" fill="${ETH_PAL.bm}" stroke="#fff3c8" stroke-width="1"/>` +
  (dx ? poly([[x0 + w, y], [x0 + w + dx, y + dy], [x0 + w + dx, y + h + dy], [x0 + w, y + h]], '#c9b07a', '#fff3c8', 1) : '');
/* خلايا مضلعة على الوجه العلوي المائل: شبكة متعرجة تُسقط على متوازي الأضلاع */
function topCells(x0, x1, y, dx, dy, nu, nv, seed, fill, jit){
  const rr = rng(seed), P = [];
  for (let j = 0; j <= nv; j++){ P.push([]); for (let i = 0; i <= nu; i++){
    const edge = i === 0 || i === nu || j === 0 || j === nv, u = i / nu + (edge ? 0 : (rr() - 0.5) * (jit || 0.5) / nu), v = j / nv + (edge ? 0 : (rr() - 0.5) * (jit || 0.5) / nv);
    P[j].push([x0 + u * (x1 - x0) + v * dx, y + v * dy]); } }
  const cells = [], cent = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const q = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]];
    cells.push(poly(q, fill, ETH_PAL.line, 1.5)); cent.push([(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4]); }
  return { svg: cells.join(''), cent };
}
const blockOutline = (x0, x1, yt, yb, dx, dy, cls) => `<g class="${cls}">${poly([[x0, yt], [x1, yt], [x1 + dx, yt + dy], [x0 + dx, yt + dy]], 'none', '#f6e7ea', 2.2)}
  ${poly([[x0, yt], [x1, yt], [x1, yb], [x0, yb]], 'none', '#f6e7ea', 2.2)}${poly([[x1, yt], [x1 + dx, yt + dy], [x1 + dx, yb + dy], [x1, yb]], 'none', '#f6e7ea', 2.2)}</g>`;
const ethCap = (t, sub) => `<text class="cap" x="500" y="596" text-anchor="middle">${t}</text><text class="cap sm" x="500" y="622" text-anchor="middle">${sub}</text>`;
const ethDots = (cls, n, fill, r) => { let o = ''; for (let i = 0; i < n; i++) o += `<circle class="${cls}" data-i="${i}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1" opacity="0"/>`; return o; };
/* تحريك جسيمات على مسار: f(i, p) يعيد [x, y] */
const ethMove = (a, cls, n, t, sp, f, on) => a.all('.' + cls).forEach(e => { const i = +e.dataset.i, p = (t * sp + i / n) % 1, q = f(i, p);
  e.setAttribute('cx', n2(q[0])); e.setAttribute('cy', n2(q[1])); e.setAttribute('opacity', on === false ? '0' : n2(Math.sin(p * Math.PI) * 0.95)); });
/* جسيمات تصطدم بالسطح وترتد (الحماية) */
const ethBounce = (a, n, t, x0, x1, ySurf, h) => ethMove(a, 'hit', n, t, 0.45, (i, p) => { const d = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
  return [x0 + ((i * 89) % (x1 - x0)) + (p > 0.5 ? (i % 3 - 1) * (p - 0.5) * 50 : 0), ySurf - 6 - d * h]; });
const ethInfo = id => ({ id: 'info:' + id, label: 'عن هذا النسيج' });

/* ───────── 1) الظهاري الحرشفي البسيط (ص28–29): خمس خطوات رسم ───────── */
function ethSq(){
  const X0 = 230, X1 = 680, DX = 150, DY = -210, YT = 410, CH = 16, BH = 8, KH = 54;
  const T = topCells(X0, X1, YT, DX, DY, 4, 3, 11, ETH_PAL.cell, 0.7);
  const front = []; for (let i = 0; i < 4; i++) front.push(`<rect x="${n2(X0 + i * (X1 - X0) / 4 + 1)}" y="${YT}" width="${n2((X1 - X0) / 4 - 2)}" height="${CH}" rx="3" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.line}" stroke-width="1.3"/>`);
  const side = poly([[X1, YT], [X1 + DX, YT + DY], [X1 + DX, YT + CH + DY], [X1, YT + CH]], ETH_PAL.cell2, ETH_PAL.line, 1.3);
  const nucs = T.cent.filter((c, k) => k % 2 === 0).map(c => `<ellipse cx="${n2(c[0])}" cy="${n2(c[1])}" rx="15" ry="8" fill="#9a3a8f" stroke="#f3c9ee" stroke-width="1"/>`);
  const body = `
    ${part('connBelow', ethCT(X0, YT + CH + BH, X1 - X0, KH, DX, DY, 3))}
    ${part('basem', ethBM(X0, YT + CH, X1 - X0, BH, DX, DY))}
    ${part('cSquam', T.svg + front.join('') + side)}
    ${part('eNuc', nucs.join(''))}
    ${blockOutline(X0, X1, YT, YT + CH + BH + KH, DX, DY, 'st1')}
    <g>${ethDots('dfA', 10, ETH_PAL.o2, 6)}${ethDots('dfB', 8, ETH_PAL.co2, 6)}</g>
    ${ethCap('النسيج الظهاري الحرشفي البسيط', 'طبقة مفردة من الخلايا المسطحة التي تبدو مضلعة — الانتشار والترشيح')}`;
  return {
    body, fnParts: ['cSquam'],
    parts: [
      { id: 'cSquam', anchor: T.cent[5], label: [866, 150], side: 'R' },
      { id: 'eNuc', anchor: T.cent[8], label: [866, 250], side: 'R' },
      { id: 'basem', anchor: [X1 + DX * 0.5, YT + CH + BH / 2 + DY * 0.5], label: [866, 360], side: 'R' },
      { id: 'connBelow', anchor: [X1 - 40, YT + CH + BH + KH * 0.6], label: [866, 470], side: 'R' }
    ],
    tools: [ethInfo('tSqS'), { id: 'tbl:epiSimple', label: 'أنواع البسيط (ص28 وص30)' }],
    tick(dt, t, a){
      /* الانتشار والترشيح عبر الطبقة الرقيقة */
      ethMove(a, 'dfA', 10, t, 0.22, (i, p) => [X0 + 60 + i * 50 + DX * 0.4, YT - 160 + p * 250]);
      ethMove(a, 'dfB', 8, t, 0.2, (i, p) => [X0 + 80 + i * 55 + DX * 0.3, YT + 90 - p * 250]);
    }
  };
}

/* ───────── 2) الظهاري المكعبي البسيط (ص28–29): يبطن نبيبات الكلية ───────── */
function ethCub(){
  const CX = 500, CY = 120, R1 = 150, R2 = 222, RB = 230, RK = 290, A0 = 0.26, A1 = Math.PI - 0.26, N = 9;
  const P = (r, a) => [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  const arcBand = (ra, rb, a0, a1) => { const o = [], i0 = [], k = 24; for (let i = 0; i <= k; i++){ const a = a0 + (a1 - a0) * i / k; o.push(P(rb, a)); i0.push(P(ra, a)); } return o.concat(i0.reverse()); };
  const cells = [], nucs = [];
  for (let i = 0; i < N; i++){ const a = A0 + (A1 - A0) * i / N, b = A0 + (A1 - A0) * (i + 1) / N;
    cells.push(poly(arcBand(R1, R2, a, b), ETH_PAL.cell, ETH_PAL.line, 1.6));
    const m = P((R1 + R2) / 2, (a + b) / 2); nucs.push(`<circle cx="${n2(m[0])}" cy="${n2(m[1])}" r="10" fill="${ETH_PAL.nuc}" stroke="#d8d0ff" stroke-width="1"/><circle cx="${n2(m[0])}" cy="${n2(m[1])}" r="3" fill="#2a1f50"/>`); }
  const base = `<g class="st1"><rect x="230" y="${CY + RK + 8}" width="540" height="22" fill="#3d2a36" stroke="${ETH_PAL.fib}" stroke-width="1.6"/></g>`;
  const body = `
    ${base}
    ${part('connBelow', poly(arcBand(RB, RK, A0 - 0.06, A1 + 0.06), ETH_PAL.ct, ETH_PAL.fib, 1.4) +
      [0, 1, 2].map(k => { let d = ''; for (let i = 0; i <= 24; i++){ const q = P(RB + 14 + k * 16 + Math.sin(i * 1.3) * 3, A0 + (A1 - A0) * i / 24); d += (i ? ' L' : 'M') + ep(q[0], q[1]); } return `<path d="${d}" fill="none" stroke="${ETH_PAL.fib}" stroke-width="1.1" opacity=".75"/>`; }).join(''))}
    ${part('basem', poly(arcBand(R2, RB, A0 - 0.06, A1 + 0.06), ETH_PAL.bm, '#fff3c8', 1))}
    ${part('cCube', cells.join(''))}
    ${part('eNuc', nucs.join(''))}
    <g>${ethDots('sec', 9, ETH_PAL.sec, 6)}${ethDots('abs', 9, ETH_PAL.abs, 6)}</g>
    ${ethCap('النسيج الظهاري المكعبي البسيط', 'طبقة مفردة من خلايا مكعبة تبدو مربعة في مقطعها — الإفراز والحماية والامتصاص')}`;
  const mid = (i, r) => P(r, A0 + (A1 - A0) * (i + 0.5) / N);
  return {
    body, fnParts: ['cCube'],
    parts: [
      { id: 'cCube', anchor: mid(1, R2 - 12), label: [866, 200], side: 'R' },
      { id: 'eNuc', anchor: mid(2, (R1 + R2) / 2), label: [866, 290], side: 'R' },
      { id: 'basem', anchor: P((R2 + RB) / 2, 0.55), label: [866, 380], side: 'R' },
      { id: 'connBelow', anchor: P(RK - 20, 0.75), label: [866, 470], side: 'R' }
    ],
    tools: [ethInfo('tCubS'), { id: 'tbl:epiSimple', label: 'أنواع البسيط (ص28 وص30)' }],
    tick(dt, t, a){
      /* الإفراز: من الخلايا إلى التجويف · الامتصاص: من التجويف إلى الخلايا */
      ethMove(a, 'sec', 9, t, 0.25, (i, p) => { const q = mid(i, (R1 + R2) / 2), c = [CX, CY + 20]; return [q[0] + (c[0] - q[0]) * p * 0.8, q[1] + (c[1] - q[1]) * p * 0.8]; });
      ethMove(a, 'abs', 9, t, 0.22, (i, p) => { const q = mid(8 - i, (R1 + R2) / 2), c = [CX + 30, CY]; return [c[0] + (q[0] - c[0]) * p, c[1] + (q[1] - c[1]) * p]; });
    }
  };
}

/* ───────── 3) الظهاري العمودي البسيط (ص30–31): ثلاث خطوات ───────── */
function ethCol(){
  const X0 = 300, N = 9, W = 46, YT = 190, YB = 455, BH = 9, KH = 58;
  const cells = [], nucs = [], cil = [];
  for (let i = 0; i < N; i++){ const x = X0 + i * W;
    cells.push(`<path d="M${ep(x + 2, YB)} L${ep(x + 2, YT + W / 2)} Q${ep(x + 2, YT)} ${ep(x + W / 2, YT)} Q${ep(x + W - 2, YT)} ${ep(x + W - 2, YT + W / 2)} L${ep(x + W - 2, YB)}Z" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.line}" stroke-width="1.6"/>`);
    nucs.push(`<ellipse cx="${x + W / 2}" cy="${YB - 26}" rx="10" ry="13" fill="${ETH_PAL.nuc}" stroke="#d8d0ff" stroke-width="1"/><circle cx="${x + W / 2}" cy="${YB - 26}" r="3" fill="#2a1f50"/>`);
    for (let k = 0; k < 4; k++) cil.push(`<line class="cl" data-x="${x + 9 + k * 9}" x1="${x + 9 + k * 9}" y1="${YT + 3}" x2="${x + 9 + k * 9}" y2="${YT - 22}" stroke="#f6e7ea" stroke-width="2.2" stroke-linecap="round"/>`); }
  const X1 = X0 + N * W;
  const body = `
    ${part('connBelow', ethCT(X0, YB + BH, X1 - X0, KH, 0, 0, 5))}
    ${part('cColumn', cells.join(''))}
    ${part('basem', `<rect x="${X0}" y="${YB}" width="${X1 - X0}" height="${BH}" fill="#2b1f26" stroke="${ETH_PAL.bm}" stroke-width="1.4"/>`)}
    ${part('eNuc', nucs.join(''))}
    ${part('cilia', cil.join(''))}
    <g>${ethDots('abs', 9, ETH_PAL.abs, 6)}${ethDots('sec', 7, ETH_PAL.sec, 6)}</g>
    ${ethCap('النسيج الظهاري العمودي البسيط', 'طبقة مفردة من خلايا بشكل أعمدة طويلة، نواتها بيضوية قرب القاعدة، وقد تكون مزودة بأهداب')}`;
  return {
    body, fnParts: ['cColumn', 'cilia'],
    parts: [
      { id: 'cilia', anchor: [X1 - W / 2, YT - 18], label: [866, 140], side: 'R' },
      { id: 'cColumn', anchor: [X1 - W / 2, YT + 90], label: [866, 230], side: 'R' },
      { id: 'eNuc', anchor: [X1 - W / 2 + 6, YB - 26], label: [866, 330], side: 'R' },
      { id: 'basem', anchor: [X1 - 10, YB + 4], label: [866, 410], side: 'R' },
      { id: 'connBelow', anchor: [X1 - 30, YB + BH + KH * 0.6], label: [866, 490], side: 'R' }
    ],
    tools: [ethInfo('tColS'), { id: 'tbl:epiSimple', label: 'أنواع البسيط (ص28 وص30)' }],
    tick(dt, t, a){
      a.all('.cl').forEach((e, i) => { const x = +e.dataset.x; e.setAttribute('x2', n2(x + Math.sin(t * 6 + x * 0.08) * 8)); });
      /* الإفراز والامتصاص */
      ethMove(a, 'abs', 9, t, 0.22, (i, p) => [X0 + W / 2 + i * W, YT - 90 + p * 200]);
      ethMove(a, 'sec', 7, t, 0.2, (i, p) => [X0 + W + i * W, YT + 80 - p * 180]);
    }
  };
}

/* ───────── 4) الظهاري العمودي (المطبق الكاذب) (ص30–31): ثلاث خطوات ───────── */
function ethPse(){
  const X0 = 290, N = 12, W = 36, YT = 190, YB = 455, BH = 7, KH = 56;
  const tall = [], basal = [], nucs = [], cil = [];
  for (let i = 0; i < N; i++){ const x = X0 + i * W;
    tall.push(`<path d="M${ep(x + 2, YB)} L${ep(x + 2, YT + W / 2)} Q${ep(x + 2, YT)} ${ep(x + W / 2, YT)} Q${ep(x + W - 2, YT)} ${ep(x + W - 2, YT + W / 2)} L${ep(x + W - 2, YB)}Z" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.line}" stroke-width="1.5"/>`);
    const ny = [YB - 90, YB - 140, YB - 70, YB - 115][i % 4];
    nucs.push(`<ellipse cx="${x + W / 2}" cy="${ny}" rx="8" ry="11" fill="${ETH_PAL.nuc}" stroke="#d8d0ff" stroke-width="1"/>`);
    basal.push(`<path d="M${ep(x + 3, YB)} Q${ep(x + 3, YB - 30)} ${ep(x + W / 2, YB - 30)} Q${ep(x + W - 3, YB - 30)} ${ep(x + W - 3, YB)}Z" fill="${ETH_PAL.cell2}" stroke="${ETH_PAL.line}" stroke-width="1.4"/><circle cx="${x + W / 2}" cy="${YB - 12}" r="6" fill="#4b3d93"/>`);
    for (let k = 0; k < 3; k++) cil.push(`<line class="cl" data-x="${x + 9 + k * 9}" x1="${x + 9 + k * 9}" y1="${YT + 3}" x2="${x + 9 + k * 9}" y2="${YT - 22}" stroke="#f6e7ea" stroke-width="2" stroke-linecap="round"/>`); }
  const X1 = X0 + N * W;
  const body = `
    ${part('connBelow', ethCT(X0, YB + BH, X1 - X0, KH, 0, 0, 9))}
    ${part('basem', `<rect x="${X0}" y="${YB}" width="${X1 - X0}" height="${BH}" fill="${ETH_PAL.bm}" stroke="#fff3c8" stroke-width="1"/>`)}
    ${part('cColumn', tall.join('') + `<g class="basal">${basal.join('')}</g>`)}
    ${part('eNuc', nucs.join(''))}
    ${part('cilia', cil.join(''))}
    <g>${ethDots('muc', 12, ETH_PAL.mucus, 6)}</g>
    ${ethCap('النسيج الظهاري العمودي (المطبق الكاذب)', 'طبقة مفردة فيها أكثر من نوع من الخلايا كلها على الغشاء القاعدي، وأنويتها بمستويات مختلفة')}`;
  return {
    body, fnParts: ['cilia', 'cColumn'],
    parts: [
      { id: 'cilia', anchor: [X1 - W / 2, YT - 18], label: [866, 140], side: 'R' },
      { id: 'cColumn', anchor: [X1 - W / 2, YT + 70], label: [866, 230], side: 'R' },
      { id: 'eNuc', anchor: [X0 + W * 10.5, YB - 70], label: [866, 330], side: 'R' },
      { id: 'basem', anchor: [X1 - 10, YB + 3], label: [866, 410], side: 'R' },
      { id: 'connBelow', anchor: [X1 - 30, YB + BH + KH * 0.6], label: [866, 490], side: 'R' }
    ],
    tools: [ethInfo('tPse'), { id: 'tbl:epiSimple', label: 'أنواع البسيط (ص28 وص30)' }],
    tick(dt, t, a){
      a.all('.cl').forEach(e => { const x = +e.dataset.x; e.setAttribute('x2', n2(x + Math.sin(t * 6 - x * 0.06) * 9)); });
      /* الحماية والإفراز: الأهداب تدفع الإفرازات على السطح */
      ethMove(a, 'muc', 12, t, 0.12, (i, p) => [X0 + p * (X1 - X0), YT - 34 - (i % 3) * 10]);
    }
  };
}

/* ───────── 5) الظهاري المطبق الحرشفي (ص32–33): ثلاث خطوات ───────── */
function ethStr(){
  const X0 = 230, X1 = 640, DX = 180, DY = -140, YT = 250, YE = 430, BH = 8, KH = 52;
  const T = topCells(X0, X1, YT, DX, DY, 6, 4, 21, ETH_PAL.cell3, 0.8);
  const rows = []; const W = X1 - X0;
  /* الطبقة السطحية: خلايا مسطحة حرشفية (3 صفوف رقيقة) */
  [[YT, 16, 3], [YT + 16, 18, 4], [YT + 34, 20, 5]].forEach(([y, h, n]) => { for (let i = 0; i < n; i++) rows.push(`<rect x="${n2(X0 + i * W / n + 1)}" y="${y}" width="${n2(W / n - 2)}" height="${h - 2}" rx="${h / 2.5}" fill="${ETH_PAL.cell3}" stroke="${ETH_PAL.line}" stroke-width="1.2"/>`); });
  /* الطبقة الوسطى: خلايا متعددة السطوح */
  const mid = []; [[YT + 54, 52, 7, 0], [YT + 106, 52, 8, 1]].forEach(([y, h, n, o]) => { for (let i = 0; i < n; i++){ const w = W / n, x = X0 + i * w + (o ? -w / 2 : 0);
    const xa = Math.max(X0, x), xb = Math.min(X1, x + w); if (xb - xa < 14) continue;
    mid.push(poly([[xa + 2, y + h * 0.25], [(xa + xb) / 2, y + 1], [xb - 2, y + h * 0.25], [xb - 2, y + h * 0.75], [(xa + xb) / 2, y + h - 1], [xa + 2, y + h * 0.75]], ETH_PAL.cell, ETH_PAL.line, 1.2) +
      `<circle cx="${n2((xa + xb) / 2)}" cy="${n2(y + h / 2)}" r="5" fill="#4b3d93"/>`); } });
  /* الطبقة القاعدية: خلايا مكعبة أو عمودية على الغشاء القاعدي */
  const bas = []; for (let i = 0; i < 16; i++){ const w = W / 16; bas.push(`<rect x="${n2(X0 + i * w + 1)}" y="${YT + 158}" width="${n2(w - 2)}" height="${YE - YT - 158 - 1}" rx="2" fill="${ETH_PAL.cell2}" stroke="${ETH_PAL.line}" stroke-width="1.1"/><circle cx="${n2(X0 + i * w + w / 2)}" cy="${YT + 158 + (YE - YT - 158) / 2}" r="3.5" fill="#2a1f50"/>`); }
  const side = [[YT, YT + 54, '#dcb0b5'], [YT + 54, YT + 158, '#c98d95'], [YT + 158, YE, '#b06470']].map(([a, b, c]) => poly([[X1, a], [X1 + DX, a + DY], [X1 + DX, b + DY], [X1, b]], c, ETH_PAL.line, 1.2)).join('');
  const body = `
    ${part('connBelow', ethCT(X0, YE + BH, W, KH, DX, DY, 13))}
    ${part('basem', ethBM(X0, YE, W, BH, DX, DY))}
    ${part('cBasal', bas.join(''))}
    ${part('cPoly', mid.join('') + side)}
    ${part('cSquam', T.svg + rows.join(''))}
    ${blockOutline(X0, X1, YT, YE + BH + KH, DX, DY, 'st1')}
    <g>${ethDots('hit', 12, ETH_PAL.hit, 6)}</g>
    ${ethCap('النسيج الظهاري المطبق الحرشفي', 'أكثر من صف من الخلايا: سطحية مسطحة حرشفية، وسطى متعددة السطوح، وقاعدية عمودية أو مكعبة — الحماية')}`;
  return {
    body, fnParts: ['cSquam'],
    parts: [
      { id: 'cSquam', anchor: T.cent[14], label: [866, 140], side: 'R' },
      { id: 'cPoly', anchor: [X0 + 40, YT + 110], label: [134, 330], side: 'L' },
      { id: 'cBasal', anchor: [X1 + DX * 0.5, YT + 175 + DY * 0.5], label: [866, 300], side: 'R' },
      { id: 'basem', anchor: [X1 + DX * 0.6, YE + BH / 2 + DY * 0.6], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [X1 - 50, YE + BH + KH * 0.6], label: [866, 500], side: 'R' }
    ],
    tools: [ethInfo('tSqStr'), { id: 'tbl:epiStrat', label: 'أنواع المطبق (ص32 وص34)' }],
    tick(dt, t, a){ ethBounce(a, 12, t, X0 + 60, X1 + 80, YT - 30, 120); }
  };
}

/* ───────── 6) الظهاري المطبق المكعبي (ص32–33): ثلاث خطوات ───────── */
function ethScb(){
  const X0 = 250, X1 = 650, DX = 170, DY = -140, YT = 300, RH = 50, BH = 8, KH = 54, W = X1 - X0, YE = YT + RH * 2;
  /* الوجه العلوي: نهايات خلايا مكعبة بشكل قباب متراصة */
  const domes = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++){ const v = (j + 0.75) / 4, u = (i + 0.5 + (j % 2 ? 0.5 : 0)) / 7.6;
    const x = X0 + u * W + v * DX, y = YT + v * DY; domes.push(`<path d="M${ep(x - 24, y + 10)} Q${ep(x - 24, y - 26)} ${ep(x, y - 26)} Q${ep(x + 24, y - 26)} ${ep(x + 24, y + 10)}" fill="${ETH_PAL.cell3}" stroke="#a8667a" stroke-width="1.5"/>`); }
  const top = poly([[X0, YT], [X1, YT], [X1 + DX, YT + DY], [X0 + DX, YT + DY]], ETH_PAL.cell, ETH_PAL.line, 1.4);
  const cubes = []; [0, 1].forEach(r => { for (let i = 0; i < 8; i++){ const w = W / 8, x = X0 + i * w + (r ? w / 2 : 0); const xa = Math.max(X0, x), xb = Math.min(X1, x + w); if (xb - xa < 10) continue;
    cubes.push(`<rect x="${n2(xa + 1.5)}" y="${YT + r * RH + 1.5}" width="${n2(xb - xa - 3)}" height="${RH - 3}" rx="3" fill="${r ? ETH_PAL.cell2 : ETH_PAL.cell}" stroke="${ETH_PAL.line}" stroke-width="1.3"/><circle cx="${n2((xa + xb) / 2)}" cy="${YT + r * RH + RH / 2}" r="6" fill="${ETH_PAL.nuc}"/>`); } });
  const side = [0, 1].map(r => { let s = poly([[X1, YT + r * RH], [X1 + DX, YT + r * RH + DY], [X1 + DX, YT + (r + 1) * RH + DY], [X1, YT + (r + 1) * RH]], r ? ETH_PAL.cell2 : ETH_PAL.cell, ETH_PAL.line, 1.2);
    for (let k = 1; k < 4; k++){ const f = k / 4; s += `<path d="M${ep(X1 + DX * f, YT + r * RH + DY * f)} L${ep(X1 + DX * f, YT + (r + 1) * RH + DY * f)}" stroke="${ETH_PAL.line}" stroke-width="1.1"/>`; } return s; }).join('');
  const body = `
    <g class="st2">${poly([[X0, YT], [X1, YT], [X1, YE + BH + KH], [X0, YE + BH + KH]], 'none', '#f6e7ea', 2.2)}${poly([[X1, YT], [X1 + DX, YT + DY], [X1 + DX, YE + BH + KH + DY], [X1, YE + BH + KH]], 'none', '#f6e7ea', 2.2)}</g>
    ${part('connBelow', ethCT(X0, YE + BH, W, KH, DX, DY, 17))}
    ${part('basem', ethBM(X0, YE, W, BH, DX, DY))}
    ${part('cCube', top + domes.join('') + cubes.join('') + side)}
    <g class="st1">${poly([[X0, YT], [X1, YT], [X1 + DX, YT + DY], [X0 + DX, YT + DY]], 'none', '#f6e7ea', 2.2)}</g>
    <g>${ethDots('hit', 10, ETH_PAL.hit, 6)}${ethDots('sec', 8, ETH_PAL.sec, 6)}</g>
    ${ethCap('النسيج الظهاري المطبق المكعبي', 'خلايا الطبقة السطحية مكعبة الشكل — يبطن قنوات الغدد العرقية والنبيبات المنوية — الحماية والإفراز')}`;
  return {
    body, fnParts: ['cCube'],
    parts: [
      { id: 'cCube', anchor: [X1 + DX * 0.5, YT + RH * 0.5 + DY * 0.5], label: [866, 250], side: 'R' },
      { id: 'basem', anchor: [X1 + DX * 0.5, YE + BH / 2 + DY * 0.5], label: [866, 360], side: 'R' },
      { id: 'connBelow', anchor: [X1 - 40, YE + BH + KH * 0.6], label: [866, 460], side: 'R' }
    ],
    tools: [ethInfo('tCubStr'), { id: 'tbl:epiStrat', label: 'أنواع المطبق (ص32 وص34)' }],
    tick(dt, t, a){
      ethBounce(a, 10, t, X0 + 80, X1 + 100, YT - 40, 110);
      ethMove(a, 'sec', 8, t, 0.2, (i, p) => [X0 + 120 + i * 45 + DX * 0.4, YT + DY * 0.5 - p * 110]);
    }
  };
}

/* ───────── 7) الظهاري المطبق العمودي (ص34–35): ثلاث خطوات ───────── */
function ethScl(){
  const X0 = 330, X1 = 640, DX = 46, DY = -46, YT = 220, R1 = 112, R2 = 100, BH = 8, KH = 56, N = 5, W = (X1 - X0) / N, YE = YT + R1 + R2;
  const topZig = []; for (let i = 0; i < N; i++){ const x = X0 + i * W; topZig.push(poly([[x, YT], [x + W * 0.5, YT + DY * 0.15], [x + W, YT], [x + W + DX, YT + DY], [x + W * 0.5 + DX, YT + DY * 0.85], [x + DX, YT + DY]], ETH_PAL.cell3, '#a8667a', 1.3)); }
  const colC = [], polC = [], nucs = [];
  for (let i = 0; i < N; i++){ const x = X0 + i * W;
    colC.push(`<rect x="${n2(x + 3)}" y="${YT + 3}" width="${n2(W - 6)}" height="${R1 - 6}" rx="8" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.line}" stroke-width="1.5"/>`);
    polC.push(`<rect x="${n2(x + 3)}" y="${YT + R1 + 3}" width="${n2(W - 6)}" height="${R2 - 6}" rx="8" fill="${ETH_PAL.cell2}" stroke="${ETH_PAL.line}" stroke-width="1.5"/>`);
    nucs.push(`<circle cx="${n2(x + W / 2)}" cy="${YT + R1 / 2}" r="11" fill="#2a1f50"/><circle cx="${n2(x + W / 2)}" cy="${YT + R1 + R2 / 2}" r="10" fill="#2a1f50"/>`); }
  const side = poly([[X1, YT], [X1 + DX, YT + DY], [X1 + DX, YE + DY], [X1, YE]], ETH_PAL.cell2, ETH_PAL.line, 1.2);
  const body = `
    <g class="st1">${poly([[X0, YT], [X1, YT], [X1 + DX, YT + DY], [X0 + DX, YT + DY]], 'none', '#f6e7ea', 2.2)}<path d="M${ep(X0, YT)} L${ep(X0, YE + BH + KH)} M${ep(X1, YT)} L${ep(X1, YE + BH + KH)}" stroke="#f6e7ea" stroke-width="2.2"/></g>
    <g class="st2"><path d="M${ep(X0, YE + BH + KH)} L${ep(X1, YE + BH + KH)} L${ep(X1 + DX, YE + BH + KH + DY)} L${ep(X1 + DX, YT + DY)} M${ep(X0, YT + R1)} L${ep(X1, YT + R1)} L${ep(X1 + DX, YT + R1 + DY)}" fill="none" stroke="#f6e7ea" stroke-width="2.2"/></g>
    ${part('connBelow', ethCT(X0, YE + BH, X1 - X0, KH, DX, DY, 19))}
    ${part('basem', ethBM(X0, YE, X1 - X0, BH, DX, DY))}
    ${part('cPoly', polC.join(''))}
    ${part('cColumn', topZig.join('') + colC.join('') + side)}
    ${part('eNuc', nucs.join(''))}
    <g>${ethDots('hit', 10, ETH_PAL.hit, 6)}</g>
    ${ethCap('النسيج الظهاري المطبق العمودي', 'خلايا الطبقة السطحية عمودية الشكل، والوسطى والقاعدية متعددة السطوح أصغر منها — يوجد في بطانة الإحليل — الحماية')}`;
  return {
    body, fnParts: ['cColumn'],
    parts: [
      { id: 'cColumn', anchor: [X0 + W * 0.5, YT + 30], label: [134, 220], side: 'L' },
      { id: 'cPoly', anchor: [X0 + W * 0.5, YT + R1 + 30], label: [134, 330], side: 'L' },
      { id: 'eNuc', anchor: [X0 + W * 4.5, YT + R1 / 2], label: [866, 250], side: 'R' },
      { id: 'basem', anchor: [X1 + DX * 0.5, YE + BH / 2 + DY * 0.5], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [X0 + 40, YE + BH + KH * 0.6], label: [134, 480], side: 'L' }
    ],
    tools: [ethInfo('tColStr'), { id: 'tbl:epiStrat', label: 'أنواع المطبق (ص32 وص34)' }],
    tick(dt, t, a){ ethBounce(a, 10, t, X0 + 20, X1 + 30, YT - 30, 100); }
  };
}

/* ───────── 8) الظهاري المتحول (ص34 وص36): يتمدد وينكمش (بلا رسم في الملزمة) ───────── */
function ethTra(){
  const X0 = 250, X1 = 750, YB = 460, BH = 8, KH = 56, W = X1 - X0;
  const cub = [], pol = [], dom = [], nucs = [];
  for (let i = 0; i < 14; i++){ const w = W / 14, x = X0 + i * w; cub.push(`<rect x="${n2(x + 1.5)}" y="${YB - 34}" width="${n2(w - 3)}" height="31" rx="3" fill="${ETH_PAL.cell2}" stroke="${ETH_PAL.line}" stroke-width="1.2"/><circle cx="${n2(x + w / 2)}" cy="${YB - 18}" r="4" fill="#2a1f50"/>`); }
  [[YB - 70, 9, 0], [YB - 106, 8, 1]].forEach(([y, n, o]) => { for (let i = 0; i < n; i++){ const w = W / n, x = X0 + i * w + (o ? w / 2 : 0) - (o ? w / 2 : 0);
    pol.push(poly([[x + 3, y + 9], [x + w / 2, y + 1], [x + w - 3, y + 9], [x + w - 3, y + 27], [x + w / 2, y + 35], [x + 3, y + 27]], ETH_PAL.cell, ETH_PAL.line, 1.2) + `<circle cx="${n2(x + w / 2)}" cy="${y + 18}" r="5" fill="#4b3d93"/>`); } });
  for (let i = 0; i < 6; i++){ const w = W / 6, x = X0 + i * w, y = YB - 108;
    dom.push(`<path d="M${ep(x + 3, y)} Q${ep(x + 3, y - 62)} ${ep(x + w / 2, y - 62)} Q${ep(x + w - 3, y - 62)} ${ep(x + w - 3, y)}Z" fill="${ETH_PAL.cell3}" stroke="${ETH_PAL.line}" stroke-width="1.5"/>`);
    nucs.push(i % 2 ? `<circle cx="${n2(x + w / 2)}" cy="${y - 26}" r="9" fill="${ETH_PAL.nuc}"/>` : `<circle cx="${n2(x + w / 2 - 14)}" cy="${y - 24}" r="8" fill="${ETH_PAL.nuc}"/><circle cx="${n2(x + w / 2 + 14)}" cy="${y - 24}" r="8" fill="${ETH_PAL.nuc}"/>`); }
  const body = `
    ${part('connBelow', ethCT(X0, YB + BH, W, KH, 0, 0, 23))}
    ${part('basem', `<rect x="${X0}" y="${YB}" width="${W}" height="${BH}" fill="${ETH_PAL.bm}" stroke="#fff3c8" stroke-width="1"/>`)}
    <g id="traG">${part('cCube', cub.join(''))}${part('cPoly', pol.join(''))}${part('cDome', dom.join(''))}${part('eNuc', nucs.join(''))}</g>
    <text class="cap sm" id="traCap" x="500" y="150" text-anchor="middle"></text>
    ${ethCap('النسيج الظهاري المتحول', 'لجميع خلاياه القابلية على تغيير شكلها — يبطن المثانة البولية والحالب وحوض الكلية — الحماية والتمدد وانكماش الأعضاء')}`;
  return {
    body, fnParts: ['cDome', 'cCube', 'cPoly'],
    parts: [
      { id: 'cDome', anchor: [X1 - 40, YB - 140], label: [866, 220], side: 'R' },
      { id: 'eNuc', anchor: [X0 + W / 12 - 14, YB - 132], label: [134, 220], side: 'L' },
      { id: 'cPoly', anchor: [X1 - 30, YB - 70], label: [866, 330], side: 'R' },
      { id: 'cCube', anchor: [X0 + 20, YB - 18], label: [134, 400], side: 'L' },
      { id: 'basem', anchor: [X1 - 20, YB + 4], label: [866, 430], side: 'R' },
      { id: 'connBelow', anchor: [X0 + 40, YB + BH + KH * 0.6], label: [134, 500], side: 'L' }
    ],
    tools: [ethInfo('tTrans'), { id: 'tbl:epiStrat', label: 'أنواع المطبق (ص32 وص34)' }],
    tick(dt, t, a){
      /* التمدد (امتلاء المثانة): الخلايا تتسطح وتتمدد، ثم تنكمش وترجع */
      const k = 0.5 - 0.5 * Math.cos(t * 0.9 * (focusOwner ? 0.6 : 1)), sx = 1 + 0.22 * k, sy = 1 - 0.42 * k;
      const g = a.el('#traG'); if (g) g.setAttribute('transform', `translate(500,${YB}) scale(${n2(sx)},${n2(sy)}) translate(-500,${-YB})`);
      const c = a.el('#traCap'); if (c) c.textContent = k > 0.55 ? 'عند التمدد: الخلايا تتسطح من دون تمزق أو تلف' : k < 0.45 ? 'عند الانكماش: الخلايا ترجع لشكلها' : '';
    }
  };
}

/* ───────── 9) البسيط × المطبق (ص27 وص32) ───────── */
function ethCmp(){
  const BY = 430, L0 = 120, L1 = 470, R0 = 530, R1 = 880;
  const simp = [], sn = []; for (let x = L0; x < L1 - 2; x += 58){ simp.push(`<rect x="${x + 2}" y="${BY - 58}" width="54" height="55" rx="6" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.line}" stroke-width="1.5"/>`); sn.push(`<circle cx="${x + 29}" cy="${BY - 30}" r="9" fill="${ETH_PAL.nuc}"/>`); }
  const strat = []; let y = BY - 3;
  [[52, 32], [80, 28], [100, 24], [140, 15], [170, 11]].forEach(([w, h], r) => { y -= h; const off = r % 2 ? w / 2 : 0;
    for (let x = R0 - off; x < R1; x += w){ const xa = Math.max(R0, x), xb = Math.min(R1, x + w); if (xb - xa < 10) continue;
      strat.push(`<rect x="${n2(xa + 1.5)}" y="${n2(y + 1)}" width="${n2(xb - xa - 3)}" height="${h - 2}" rx="${Math.min(8, h / 2.5)}" fill="${r === 0 ? ETH_PAL.cell2 : r < 3 ? ETH_PAL.cell : ETH_PAL.cell3}" stroke="${ETH_PAL.line}" stroke-width="1.2"/>`); } });
  const bm = (a, b) => `<rect class="dHi" x="${a}" y="${BY - 3}" width="${b - a}" height="8" rx="4" fill="${ETH_PAL.bm}"/>`;
  const ct = (a, b) => `<rect x="${a}" y="${BY + 6}" width="${b - a}" height="70" rx="10" fill="${ETH_PAL.ct}"/>`;
  const body = `${ct(L0, L1)}${ct(R0, R1)}
    ${part('basem', bm(L0, L1) + bm(R0, R1))}
    ${part('tEpiSimple', simp.join('') + sn.join(''))}
    ${part('tEpiStrat', strat.join(''))}
    <text class="cap" x="${(L0 + L1) / 2}" y="${BY + 112}" text-anchor="middle">بسيط: صف واحد من الخلايا</text>
    <text class="cap sm" x="${(L0 + L1) / 2}" y="${BY + 138}" text-anchor="middle">أربعة أنواع تبعاً لشكل خلاياه</text>
    <text class="cap" x="${(R0 + R1) / 2}" y="${BY + 112}" text-anchor="middle">مطبق: أكثر من صف من الخلايا</text>
    <text class="cap sm" x="${(R0 + R1) / 2}" y="${BY + 138}" text-anchor="middle">أربعة أنواع تبعاً لشكل خلايا الطبقة السطحية</text>`;
  let opened = false;
  return {
    body, fnParts: ['basem'],
    parts: [
      { id: 'tEpiSimple', anchor: [L0 + 30, BY - 50], label: [134, 250], side: 'L' },
      { id: 'tEpiStrat', anchor: [R1 - 40, y + 8], label: [866, 250], side: 'R' },
      { id: 'basem', anchor: [L1 - 20, BY], label: [500, 560], side: 'C' }
    ],
    tools: [{ id: 'tbl:epiSimple', label: 'أنواع البسيط (ص28 وص30)' }, { id: 'tbl:epiStrat', label: 'أنواع المطبق (ص32 وص34)' }, { id: 'info:tEpith', label: 'صفات النسيج الظهاري' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'epith' && SEL.ethv === 'ecmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.epiSimple); }, 700); } },
    tick(dt, t, a){ a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(3 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4 + i)))}px #ffd166)`); }
  };
}
