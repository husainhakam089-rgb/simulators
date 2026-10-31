
/* ══════════════════════════════════════════════════════════════════════════
   4.6 · النسيج الضام (الرابط) — ملزمة ص42–72: الخلايا والألياف والقالب،
         الضام المفكك (الهللي، الشحمي، الشبكي، المخاطاني)، الكثيف، الغضروف،
         العظم المصمت (رسم الملزمة وخطواته) والإسفنجي، الدم، واللمف
   ══════════════════════════════════════════════════════════════════════════ */
const CON_VIEWS = [
  { id: 'cparts', label: 'الخلايا والألياف' },
  { id: 'cadip',  label: 'الشحمي' },
  { id: 'cret',   label: 'الشبكي' },
  { id: 'cmuc',   label: 'المخاطاني' },
  { id: 'cdense', label: 'الكثيف' },
  { id: 'ccart',  label: 'الغضروف' },
  { id: 'cbone',  label: 'العظم المصمت' },
  { id: 'cspon',  label: 'العظم الإسفنجي' },
  { id: 'cblood', label: 'الدم' },
  { id: 'clym',   label: 'البلازما واللمف' }
];
const CON_SRC = { cparts: 'ملزمة ص42–47 وص50', cadip: 'ملزمة ص45 وص49–50', cret: 'ملزمة ص47 وص49–50', cmuc: 'ملزمة ص49–50 وص57', cdense: 'ملزمة ص48 وص53',
  ccart: 'ملزمة ص54–56', cbone: 'ملزمة ص59–62', cspon: 'ملزمة ص59', cblood: 'ملزمة ص62–69', clym: 'ملزمة ص67–68' };
const CON_PAL = { mat: '#d9cde6', matD: '#b9a8cc', col: '#f1d9de', colS: '#e58aa0', ela: '#e8c23a', ret: '#4a3a6a', fib: '#c9a0b4', cart: '#cfe3ef', cartL: '#eef7fb',
  bone: '#e9dcc0', boneL: '#fff6e0', boneD: '#a88a5c', rbc: '#d9433b', wbc: '#efe6f6', plt: '#c08bd0', plasma: '#f6e3a6', fat: '#f3e3a0', nuc: '#6f5fc0' };

SCENES.conn = {
  title: 'النسيج الضام (الرابط)',
  get src(){ return CON_SRC[SEL.conv] || 'ملزمة ص42'; },
  tint: ['rgba(150,110,170,.24)', 'rgba(170,90,80,.16)'],
  model3d: () => 'con_' + SEL.conv,
  build(){
    const v = CON_VIEWS.some(x => x.id === SEL.conv) ? SEL.conv : 'cparts';
    const s = ({ cparts: conParts, cadip: conAdip, cret: conRet, cmuc: conMuc, cdense: conDense, ccart: conCart, cbone: conBone, cspon: conSpon, cblood: conBlood, clym: conLym })[v]();
    s.rebuildOnRadio = 'conv';
    s.tools = CON_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'conv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.con_adip  = { title: 'النسيج الضام الشحمي', build: () => conAdip() };
SCENES.con_ret   = { title: 'النسيج الضام الشبكي', build: () => conRet() };
SCENES.con_muc   = { title: 'النسيج الضام المخاطاني', build: () => conMuc() };
SCENES.con_bone  = { title: 'مقطع في العظم المصمت', build: () => conBone() };
SCENES.con_blood = { title: 'خلايا الدم', build: () => conBlood() };

/* موجة بين نقطتين (ليف) */
function waveD(x0, y0, x1, y1, amp, n, ph){
  let d = `M${n2(x0)},${n2(y0)}`; const N = 40;
  for (let i = 1; i <= N; i++){ const u = i / N, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * n * Math.PI * 2 + (ph || 0)) * amp; d += ` L${n2(x)},${n2(y)}`; }
  return d;
}
const conCap = (t, sub, y) => `<text class="cap" x="500" y="${y || 584}" text-anchor="middle">${t}</text>` + (sub ? `<text class="cap sm" x="500" y="${(y || 584) + 26}" text-anchor="middle">${sub}</text>` : '');
const cPt = (x, y) => n2(x) + ',' + n2(y);
/* شكل نجمي/أميبي حول مركز: r(a) يعيد نصف القطر */
function blobD(x, y, n, rf){ let d = ''; for (let i = 0; i <= n; i++){ const a = i / n * 6.2832, r = rf(a, i); d += (i ? ' L' : 'M') + cPt(x + Math.cos(a) * r, y + Math.sin(a) * r); } return d + 'Z'; }
/* خلايا النسيج الضام (ص43–45) */
const CELLS = {
  /* الأرومة الليفية: مغزلية ببروزات طويلة متفرعة ونواة بيضوية */
  fibro: (x, y, a, s) => { s = s || 1; const L = 58 * s;
    return `<g transform="rotate(${n2(a || 0)} ${n2(x)} ${n2(y)})"><path d="M${cPt(x - L, y - 6)} L${cPt(x - L - 26 * s, y - 20 * s)} M${cPt(x - L, y + 4)} L${cPt(x - L - 22 * s, y + 18 * s)} M${cPt(x + L, y)} L${cPt(x + L + 30 * s, y - 12 * s)} M${cPt(x + L - 8, y + 2)} L${cPt(x + L + 20 * s, y + 20 * s)}" stroke="${CON_PAL.fib}" stroke-width="${n2(3 * s)}" stroke-linecap="round" fill="none"/>
      <path d="M${cPt(x - L, y)} Q${cPt(x, y - 20 * s)} ${cPt(x + L, y)} Q${cPt(x, y + 20 * s)} ${cPt(x - L, y)}Z" fill="${CON_PAL.fib}" stroke="#fff" stroke-width="1.2"/>
      <ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(14 * s)}" ry="${n2(7 * s)}" fill="${CON_PAL.nuc}"/></g>`; },
  /* البلعم الكبير: أميبي كبير ببروزات قصيرة ونواة لامركزية */
  macro: (x, y) => `<path d="${blobD(x, y, 28, (a, i) => 40 + (i % 4 === 0 ? 12 : 0) + Math.sin(a * 3) * 5)}" fill="#e7c9a8" stroke="#fff" stroke-width="1.4"/>
    <ellipse cx="${n2(x + 16)}" cy="${n2(y - 12)}" rx="13" ry="10" fill="${CON_PAL.nuc}"/><circle cx="${n2(x - 12)}" cy="${n2(y + 10)}" r="6" fill="#b88a60" opacity=".8"/><circle cx="${n2(x - 2)}" cy="${n2(y + 20)}" r="4" fill="#b88a60" opacity=".8"/>`,
  /* الخلية البلازمية: صغيرة بيضوية، نواة لامركزية بمادة كروماتينية شعاعية (وجه الساعة) */
  plasmaC: (x, y) => { let s = `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="30" ry="24" fill="#c7d6f0" stroke="#fff" stroke-width="1.4"/><circle cx="${n2(x - 10)}" cy="${n2(y)}" r="13" fill="#f3efff" stroke="${CON_PAL.nuc}" stroke-width="2"/>`;
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.283; s += `<circle cx="${n2(x - 10 + Math.cos(a) * 8.5)}" cy="${n2(y + Math.sin(a) * 8.5)}" r="2.6" fill="${CON_PAL.nuc}"/>`; }
    return s + `<circle cx="${n2(x - 10)}" cy="${n2(y)}" r="2.6" fill="${CON_PAL.nuc}"/>`; },
  /* الخلية البدينة: كروية كبيرة بسايتوبلازم حبيبي ونواة صغيرة */
  mast: (x, y, seed) => { const rr = rng(seed || 3); let s = `<circle cx="${n2(x)}" cy="${n2(y)}" r="36" fill="#e3c0e8" stroke="#fff" stroke-width="1.4"/>`;
    for (let i = 0; i < 46; i++){ const a = rr() * 6.283, d = 6 + rr() * 26; s += `<circle cx="${n2(x + Math.cos(a) * d)}" cy="${n2(y + Math.sin(a) * d)}" r="2.4" fill="#8a3a9a"/>`; }
    return s + `<circle cx="${n2(x + 8)}" cy="${n2(y - 6)}" r="9" fill="${CON_PAL.nuc}" stroke="#fff" stroke-width="1"/>`; },
  /* الخلية الشبكية: نجمية ببروزات */
  retC: (x, y, s) => { s = s || 1; return `<path d="${blobD(x, y, 30, (a, i) => (i % 5 === 0 ? 34 : 14) * s)}" fill="#bfa9e0" stroke="#fff" stroke-width="1.2"/><ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(9 * s)}" ry="${n2(7 * s)}" fill="${CON_PAL.nuc}"/>`; },
  /* الخلية الصباغية: متفرعة مملوءة بحبيبات صبغية داكنة */
  pigC: (x, y) => { let s = `<path d="${blobD(x, y, 36, (a, i) => (i % 6 === 0 ? 38 : i % 3 === 0 ? 24 : 13))}" fill="#6b4a2a" stroke="#c8a070" stroke-width="1"/>`; const rr = rng(9);
    for (let i = 0; i < 20; i++){ const a = rr() * 6.283, d = rr() * 12; s += `<circle cx="${n2(x + Math.cos(a) * d)}" cy="${n2(y + Math.sin(a) * d)}" r="1.8" fill="#2a180a"/>`; } return s; },
  /* الخلية الدهنية: كروية، قطرة دهنية كبيرة، السايتوبلازم حلقة نحيفة، نواة مسطحة جانبية */
  fatC: (x, y, r, a) => { a = a === undefined ? -0.7 : a; const nx = x + Math.cos(a) * (r - 4), ny = y + Math.sin(a) * (r - 4);
    return `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="#e9b8c4" stroke="#fff" stroke-width="1.4"/><circle class="drop" cx="${n2(x)}" cy="${n2(y)}" r="${n2(r - 5)}" data-r="${n2(r - 5)}" fill="${CON_PAL.fat}"/>
      <ellipse cx="${n2(nx)}" cy="${n2(ny)}" rx="${n2(r * 0.3)}" ry="4" transform="rotate(${n2(a * 57.3 + 90)} ${n2(nx)} ${n2(ny)})" fill="${CON_PAL.nuc}"/>`; },
  /* الخلية الحشوية المتوسطة: غير متخصصة، ذات بروزات سايتوبلازمية ونواة بيضوية مركزية */
  mesC: (x, y) => `<path d="${blobD(x, y, 24, (a, i) => (i % 6 === 0 ? 32 : 15))}" fill="#9fd3c7" stroke="#fff" stroke-width="1.2"/><ellipse cx="${n2(x)}" cy="${n2(y)}" rx="10" ry="8" fill="${CON_PAL.nuc}"/>`
};
/* الألياف (ص47): البيض حزم لا تتفرع، الصفر مفردة تتفرع ولا تتشابك، الشبكية شبكة متشابكة */
const colBundle = (x0, y0, x1, y1, i, cls) => [-6, 0, 6].map(o => `<path class="${cls || ''}" data-c="${[x0, y0 + o, x1, y1 + o].join(',')}" data-i="${i}" d="${waveD(x0, y0 + o, x1, y1 + o, 9, 3, i)}" fill="none" stroke="${CON_PAL.col}" stroke-width="4" stroke-linecap="round"/>`).join('');
const elaSingle = (x0, y0, x1, y1, i) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; return `<path d="${waveD(x0, y0, x1, y1, 4, 2, i)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="2.2"/><path d="M${cPt(mx, my)} L${cPt(mx + 30, my - 34)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="1.8"/>`; };
function retNet(x0, y0, w, h, seed, n){ const rr = rng(seed), P = [], c = Math.ceil(Math.sqrt((n || 14) * w / h)), r = Math.ceil((n || 14) / c);
  for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) P.push([x0 + (i + 0.5 + (rr() - 0.5) * 0.7) * w / c, y0 + (j + 0.5 + (rr() - 0.5) * 0.7) * h / r]);
  let s = ''; P.forEach((p, i) => { P.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(z => z[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
    .forEach(([j]) => { if (j > i || (i + j) % 2) s += `<path d="M${cPt(p[0], p[1])} L${cPt(P[j][0], P[j][1])}" stroke="${CON_PAL.ret}" stroke-width="1.6" fill="none"/>`; }); });
  return { s, P }; }

/* ───────── 1) الخلايا والألياف والقالب (النسيج الضام الهللي) ───────── */
function conParts(){
  const X0 = 190, X1 = 810, Y0 = 84, Y1 = 520;
  const pos = { fibro: [300, 200], macro: [660, 190], plasmaC: [430, 420], mast: [560, 300], retC: [330, 450], pigC: [720, 440], fatC: [460, 160], mesC: [250, 330] };
  const net = retNet(230, 400, 200, 100, 31, 10);
  const body = `
    ${part('matrixC', `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="22" fill="${CON_PAL.mat}" opacity=".85"/>`)}
    ${part('colFib', colBundle(X0 + 20, 260, X1 - 20, 240, 0, 'cf') + colBundle(X0 + 20, 380, X1 - 20, 360, 1, 'cf'))}
    ${part('elaFib', elaSingle(520, 110, 780, 150, 0) + elaSingle(210, 120, 400, 100, 1) + elaSingle(600, 490, 790, 360, 2))}
    ${part('retFib', net.s)}
    ${part('fibro', CELLS.fibro(pos.fibro[0], pos.fibro[1], -12) + CELLS.fibro(620, 420, 20, 0.8))}
    ${part('macro', CELLS.macro(...pos.macro))}
    ${part('plasmaC', CELLS.plasmaC(...pos.plasmaC))}
    ${part('mast', CELLS.mast(...pos.mast))}
    ${part('retC', CELLS.retC(...pos.retC))}
    ${part('pigC', CELLS.pigC(...pos.pigC))}
    ${part('fatC', CELLS.fatC(pos.fatC[0], pos.fatC[1], 34))}
    ${part('mesC', CELLS.mesC(...pos.mesC))}
    <g>${Array.from({ length: 6 }, (_, i) => `<circle class="eat" data-i="${i}" r="4" fill="#5a4a3a" opacity="0"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<circle class="hst" data-i="${i}" r="2.6" fill="#b04ac0" opacity="0"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) => `<path class="ab" data-i="${i}" d="M0,6 L0,0 L-4,-5 M0,0 L4,-5" stroke="#3a5ab0" stroke-width="2" fill="none" opacity="0"/>`).join('')}</g>
    ${conCap('النسيج الضام الهللي (الخلالي): تتميز فيه جميع أنواع الألياف وأغلب خلايا النسيج الضام', 'البلعم يلتهم الجزيئات الغريبة · البدينة تحرر الهستامين والهيبارين · البلازمية تكوّن الأجسام المضادة')}`;
  return {
    body, fnParts: ['macro', 'mast', 'plasmaC'],
    parts: [
      { id: 'fibro', anchor: [pos.fibro[0] - 40, pos.fibro[1] + 6], label: [134, 120], side: 'L' },
      { id: 'mesC', anchor: [pos.mesC[0] - 14, pos.mesC[1]], label: [134, 200], side: 'L' },
      { id: 'colFib', anchor: [X0 + 40, 262], label: [134, 280], side: 'L' },
      { id: 'retC', anchor: [pos.retC[0] - 10, pos.retC[1] + 6], label: [134, 350], side: 'L' },
      { id: 'retFib', anchor: [net.P[0][0], net.P[0][1]], label: [134, 420], side: 'L' },
      { id: 'matrixC', anchor: [X0 + 18, Y1 - 24], label: [134, 500], side: 'L' },
      { id: 'fatC', anchor: [pos.fatC[0] + 20, pos.fatC[1] - 22], label: [866, 90], side: 'R' },
      { id: 'elaFib', anchor: [740, 140], label: [866, 150], side: 'R' },
      { id: 'macro', anchor: [pos.macro[0] + 38, pos.macro[1]], label: [866, 220], side: 'R' },
      { id: 'mast', anchor: [pos.mast[0] + 30, pos.mast[1] + 14], label: [866, 300], side: 'R' },
      { id: 'pigC', anchor: [pos.pigC[0] + 20, pos.pigC[1]], label: [866, 400], side: 'R' },
      { id: 'plasmaC', anchor: [pos.plasmaC[0] + 26, pos.plasmaC[1] + 8], label: [866, 480], side: 'R' }
    ],
    tools: [{ id: 'info:tConn', label: 'عن النسيج الضام' }, { id: 'tbl:connCells', label: 'خلايا النسيج الضام (ص43–45)' }, { id: 'tbl:fibTypes', label: 'الألياف (ص47)' }],
    tick(dt, t, a){
      const [mx, my] = pos.macro, [sx, sy] = pos.mast, [px, py] = pos.plasmaC;
      /* البلعم يلتهم الجزيئات الغريبة */
      a.all('.eat').forEach(e => { const i = +e.dataset.i, p = (t * 0.2 + i / 6) % 1, ang = i * 1.05, r = 120 * (1 - p) + 10;
        e.setAttribute('cx', n2(mx + Math.cos(ang) * r)); e.setAttribute('cy', n2(my + Math.sin(ang) * r * 0.7)); e.setAttribute('opacity', n2(p < 0.85 ? 0.9 : (1 - p) * 6)); });
      /* البدينة تحرر حبيباتها (الهستامين والهيبارين) */
      a.all('.hst').forEach(e => { const i = +e.dataset.i, p = (t * 0.25 + i / 8) % 1, ang = i * 0.8; e.setAttribute('cx', n2(sx + Math.cos(ang) * (36 + p * 70))); e.setAttribute('cy', n2(sy + Math.sin(ang) * (36 + p * 70))); e.setAttribute('opacity', n2(Math.sin(p * Math.PI))); });
      /* البلازمية تكوّن الأجسام المضادة */
      a.all('.ab').forEach(e => { const i = +e.dataset.i, p = (t * 0.22 + i / 5) % 1, ang = -2.4 + i * 0.5; e.setAttribute('transform', `translate(${n2(px + Math.cos(ang) * (30 + p * 90))},${n2(py + Math.sin(ang) * (30 + p * 90))}) rotate(${n2(ang * 57.3 + 90)})`); e.setAttribute('opacity', n2(Math.sin(p * Math.PI))); });
    }
  };
}

/* ───────── 2) النسيج الضام الشحمي (ص49–50): خلايا دهنية تخزن الدهون ───────── */
function conAdip(){
  const rr = rng(17), cells = [], X0 = 230, X1 = 770, Y0 = 90, Y1 = 500, ves = [];
  const P = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++){ const x = X0 + 45 + i * 92 + (j % 2 ? 46 : 0) + (rr() - 0.5) * 14, y = Y0 + 45 + j * 82 + (rr() - 0.5) * 12; if (x < X1 - 30) P.push([x, y]); }
  P.forEach(([x, y], k) => cells.push(CELLS.fatC(x, y, 42 + (k % 3) * 2, rr() * 6.28)));
  [[X0 + 20, Y0 + 170, X1 - 20, Y0 + 150], [X0 + 260, Y0 + 10, X0 + 300, Y1 - 10]].forEach(([a, b, c, d], i) => ves.push(`<path d="${waveD(a, b, c, d, 6, 2, i)}" fill="none" stroke="#c0392b" stroke-width="7" stroke-linecap="round" opacity=".7"/>`));
  const body = `
    <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="22" fill="#cdb6d6" opacity=".55"/>
    ${part('tAdip', `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="22" fill="none" stroke="#f0e2ff" stroke-width="2"/>`)}
    <g>${ves.join('')}</g>
    ${part('fatC', cells.join(''))}
    <g>${Array.from({ length: 10 }, (_, i) => `<circle class="en" data-i="${i}" r="4" fill="#ffd166" opacity="0"/>`).join('')}</g>
    <text class="cap sm" id="adCap" x="500" y="${Y0 - 20}" text-anchor="middle"></text>
    ${conCap('النسيج الضام الشحمي — تسود فيه الخلايا الدهنية', 'تحت الجلد وفي مواقع خزن الدهون وأيضها: خزن الدهون، توليد الطاقة، والحماية من فقدان حرارة الجسم')}`;
  const c0 = P[P.length - 1];
  return {
    body, fnParts: ['fatC'],
    parts: [
      { id: 'fatC', anchor: [c0[0] + 30, c0[1] - 10], label: [866, 300], side: 'R' },
      { id: 'tAdip', anchor: [X0, Y0 + 60], label: [134, 200], side: 'L' }
    ],
    tools: [{ id: 'info:tAdip', label: 'عن النسيج الشحمي' }, { id: 'tbl:looseTypes', label: 'أنواع الضام المفكك (ص50)' }],
    tick(dt, t, a){
      /* خزن الدهون ← ثم استهلاكها لتوليد الطاقة */
      const k = 0.5 + 0.5 * Math.sin(t * 0.7);
      a.all('.drop').forEach(e => e.setAttribute('r', n2(+e.dataset.r * (0.72 + 0.28 * k))));
      a.all('.en').forEach(e => { const i = +e.dataset.i, p = (t * 0.4 + i / 10) % 1, c = P[(i * 7) % P.length];
        e.setAttribute('cx', n2(c[0] + Math.cos(i) * p * 50)); e.setAttribute('cy', n2(c[1] - p * 60)); e.setAttribute('opacity', n2((1 - k) * Math.sin(p * Math.PI))); });
      const c = a.el('#adCap'); if (c) c.textContent = k > 0.6 ? 'خزن الدهون: القطرة الدهنية تكبر' : k < 0.4 ? 'توليد الطاقة: القطرة الدهنية تصغر' : '';
    }
  };
}

/* ───────── 3) النسيج الضام الشبكي (ص49–50): خلايا شبكية وألياف شبكية ومادة سائلة ───────── */
function conRet(){
  const X0 = 230, X1 = 770, Y0 = 90, Y1 = 500, rr = rng(23);
  const net = retNet(X0 + 20, Y0 + 20, X1 - X0 - 40, Y1 - Y0 - 40, 41, 30);
  const cells = net.P.filter((p, i) => i % 3 === 0).map(p => CELLS.retC(p[0], p[1], 1.2)).join('');
  const body = `
    ${part('tRet', `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="22" fill="#e6dcf2" opacity=".75"/>`)}
    ${part('retFib', net.s)}
    ${part('retC', cells)}
    <g>${Array.from({ length: 14 }, (_, i) => `<circle class="fl" data-i="${i}" data-y="${n2(Y0 + 30 + rr() * (Y1 - Y0 - 60))}" r="3.4" fill="#7fb6e6" opacity="0"/>`).join('')}</g>
    ${conCap('النسيج الضام الشبكي — نسيج ضام بدائي تسود فيه الخلايا الشبكية، ومادته بين الخلوية سائلة', 'يوجد في الأعضاء اللمفية ونقي العظم والكبد — أهميته الإسناد')}`;
  const c3 = net.P[3];
  return {
    body, fnParts: ['retC', 'retFib'],
    parts: [
      { id: 'retC', anchor: [c3[0] + 14, c3[1]], label: [866, 220], side: 'R' },
      { id: 'retFib', anchor: [net.P[1][0], net.P[1][1]], label: [866, 380], side: 'R' },
      { id: 'tRet', anchor: [X0 + 4, Y0 + 80], label: [134, 260], side: 'L' }
    ],
    tools: [{ id: 'info:tRet', label: 'عن النسيج الشبكي' }, { id: 'tbl:looseTypes', label: 'أنواع الضام المفكك (ص50)' }],
    tick(dt, t, a){ a.all('.fl').forEach(e => { const i = +e.dataset.i, p = (t * 0.12 + i / 14) % 1; e.setAttribute('cx', n2(X0 + 10 + p * (X1 - X0 - 20))); e.setAttribute('cy', n2(+e.dataset.y + Math.sin(p * 9 + i) * 10)); e.setAttribute('opacity', n2(0.8 * Math.sin(p * Math.PI))); }); }
  };
}

/* ───────── 4) النسيج الضام المخاطاني (ص49–50 وص57): مقطع في الحبل السري ───────── */
function conMuc(){
  const CX = 470, CY = 300, R = 230, rr = rng(57), fb = [];
  const inside = (x, y) => Math.hypot(x - CX, y - CY) < R - 14 && Math.hypot(x - 560, y - 210) > 62 && Math.hypot(x - 340, y - 300) > 52 && Math.hypot((x - 520) / 92, (y - 400) / 34) > 1.15;
  for (let i = 0; i < 400 && fb.length < 70; i++){ const x = CX - R + rr() * 2 * R, y = CY - R + rr() * 2 * R; if (!inside(x, y)) continue;
    const a = rr() * 6.28; fb.push(`<path d="M${cPt(x + Math.cos(a) * 9, y + Math.sin(a) * 9)} L${cPt(x + Math.cos(a + 2.1) * 9, y + Math.sin(a + 2.1) * 9)} L${cPt(x + Math.cos(a + 4.2) * 9, y + Math.sin(a + 4.2) * 9)}Z" fill="#b0303a"/><circle cx="${n2(x)}" cy="${n2(y)}" r="2.4" fill="#5a1018"/>`); }
  const art = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8a0a0" stroke="#b0303a" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="#fff4f0" stroke="#d05060" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${n2(x + Math.cos(i * 0.785) * r * 0.81)}" cy="${n2(y + Math.sin(i * 0.785) * r * 0.81)}" r="2.2" fill="#8a1020"/>`).join('')}`;
  const body = `
    ${part('tMucous', `<circle cx="${CX}" cy="${CY}" r="${R}" fill="#f6e2e0" stroke="#d8a0a0" stroke-width="3"/>`)}
    ${part('artery', art(560, 210, 56) + art(340, 300, 46) + `<ellipse cx="520" cy="400" rx="92" ry="34" fill="#e8a0a0" stroke="#b0303a" stroke-width="2"/><ellipse cx="520" cy="400" rx="70" ry="16" fill="#fff4f0" stroke="#d05060" stroke-width="2"/>`)}
    ${part('fibro', fb.join(''))}
    <g>${Array.from({ length: 8 }, (_, i) => `<circle class="bl" data-i="${i}" r="5" fill="#c0392b" opacity="0"/>`).join('')}</g>
    ${conCap('النسيج الضام المخاطاني — أرومات ليفية نجمية في مادة بين خلوية جيلاتينية مخاطية', 'يوجد في الحبل السري — أهميته الإسناد')}`;
  return {
    body, fnParts: ['tMucous'],
    parts: [
      { id: 'artery', anchor: [600, 180], label: [866, 150], side: 'R' },
      { id: 'tMucous', anchor: [CX + R * 0.75, CY + 40], label: [866, 300], side: 'R' },
      { id: 'fibro', anchor: [CX + R * 0.55, CY + 100], label: [866, 430], side: 'R' }
    ],
    tools: [{ id: 'info:tMuc', label: 'عن النسيج المخاطاني' }, { id: 'tbl:looseTypes', label: 'أنواع الضام المفكك (ص50)' }],
    tick(dt, t, a){
      /* الدم يمر في الشرايين داخل الحبل السري المسنود بالنسيج المخاطاني */
      a.all('.bl').forEach(e => { const i = +e.dataset.i, c = i % 2 ? [560, 210, 30] : [340, 300, 24], p = t * 1.4 + i * 0.8;
        e.setAttribute('cx', n2(c[0] + Math.cos(p) * c[2] * 0.6)); e.setAttribute('cy', n2(c[1] + Math.sin(p) * c[2] * 0.6)); e.setAttribute('opacity', '0.8'); });
    }
  };
}

/* ───────── 5) النسيج الضام الكثيف (ص53): الأبيض المنتظم وغير المنتظم، والأصفر ───────── */
function conDense(){
  const B = [[110, 'tDenseReg', 'أبيض منتظم', 'الأوتار'], [390, 'tDenseIrr', 'أبيض غير منتظم', 'أدمة الجلد'], [670, 'tDenseYel', 'أصفر (مرن)', 'الرابط القفوي في العنق']], W = 230, Y0 = 130, H = 300;
  const rr = rng(77), g = {};
  g.tDenseReg = Array.from({ length: 8 }, (_, i) => colBundle(B[0][0] + 8, Y0 + 24 + i * 36, B[0][0] + W - 8, Y0 + 24 + i * 36, i, 'rg')).join('') +
    Array.from({ length: 7 }, (_, i) => `<ellipse class="rg2" cx="${B[0][0] + 40 + (i % 3) * 70}" cy="${Y0 + 42 + i * 36}" rx="12" ry="4" fill="${CON_PAL.nuc}"/>`).join('');
  g.tDenseIrr = Array.from({ length: 12 }, (_, i) => { const x = B[1][0] + 30 + rr() * (W - 60), y = Y0 + 30 + rr() * (H - 60), a = rr() * 3.14, L = 70;
    return colBundle(x - Math.cos(a) * L, y - Math.sin(a) * L, x + Math.cos(a) * L, y + Math.sin(a) * L, i); }).join('');
  g.tDenseYel = Array.from({ length: 9 }, (_, i) => { const y = Y0 + 24 + i * 32, x0 = B[2][0] + 8, x1 = B[2][0] + W - 8;
    return `<path class="yl" data-c="${[x0, y, x1, y].join(',')}" data-i="${i}" d="${waveD(x0, y, x1, y, 6, 2, i)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="3"/>` +
      (i < 8 ? `<path d="M${cPt(x0 + 60 + (i % 3) * 50, y)} L${cPt(x0 + 90 + (i % 3) * 50, y + 32)}" stroke="${CON_PAL.ela}" stroke-width="2"/>` : ''); }).join('');
  const body = `<defs>${B.map(([x], i) => `<clipPath id="dzc${i}"><rect x="${x}" y="${Y0}" width="${W}" height="${H}" rx="14"/></clipPath>`).join('')}</defs>` + B.map(([x, id, a, b], i) => `<g class="dz" data-id="${id}" clip-path="url(#dzc${i})"><rect x="${x}" y="${Y0}" width="${W}" height="${H}" rx="14" fill="${CON_PAL.mat}" opacity=".55"/>${part(id, `<rect x="${x}" y="${Y0}" width="${W}" height="${H}" rx="14" fill="none" stroke="#f0e2ff" stroke-width="2"/>` + g[id])}</g>
    <text class="cap" x="${x + W / 2}" y="${Y0 + H + 34}" text-anchor="middle">${a}</text><text class="cap sm" x="${x + W / 2}" y="${Y0 + H + 58}" text-anchor="middle">${b}</text>`).join('') +
    `<g id="pullD" opacity="0"><path d="M95,280 L60,280 M72,268 L60,280 L72,292 M915,280 L950,280 M938,268 L950,280 L938,292" fill="none" stroke="#ffe08a" stroke-width="3" stroke-linecap="round"/></g>
    ${conCap('النسيج الضام الكثيف — يُقسم تبعاً لكثافة الألياف فيه', 'عند السحب: الألياف البيض تقاوم السحب، والصفر مرنة سهلة التمدد وترجع', 560)}`;
  return {
    body, fnParts: ['tDenseYel', 'tDenseReg'],
    parts: [
      { id: 'tDenseReg', anchor: [B[0][0] + 20, Y0 + 20], label: [134, 100], side: 'L' },
      { id: 'tDenseIrr', anchor: [B[1][0] + W / 2, Y0], label: [500, 96], side: 'C' },
      { id: 'tDenseYel', anchor: [B[2][0] + W - 20, Y0 + 20], label: [866, 100], side: 'R' }
    ],
    tools: [{ id: 'tbl:denseTypes', label: 'الضام الكثيف (ص53)' }, { id: 'tbl:fibTypes', label: 'الألياف (ص47)' }],
    tick(dt, t, a){
      const k = Math.max(0, Math.sin(t * 1.1)), p = a.el('#pullD'); if (p) p.setAttribute('opacity', n2(k));
      a.all('.dz').forEach(g => { const id = g.dataset.id, x = B.find(q => q[1] === id)[0] + W / 2, s = id === 'tDenseYel' ? 1 + 0.16 * k : 1 + 0.025 * k;
        g.setAttribute('transform', `translate(${x},0) scale(${n2(s)},1) translate(${-x},0)`); });
      a.all('.rg').forEach(e => { const [x0, y0, x1, y1] = e.dataset.c.split(',').map(Number); e.setAttribute('d', waveD(x0, y0, x1, y1, 9 * (1 - 0.5 * k), 3, +e.dataset.i)); });
      a.all('.yl').forEach(e => { const [x0, y0, x1, y1] = e.dataset.c.split(',').map(Number); e.setAttribute('d', waveD(x0, y0, x1, y1, 6 * (1 - 0.95 * k), 2, +e.dataset.i)); });
    }
  };
}

/* ───────── 6) الغضروف (ص54–55): الشفاف، الليفي الأبيض، المطاط ───────── */
function conCart(){
  const rr = rng(8), P = [[230, 280, 'cartHy', 'الغضروف الشفاف (الزجاجي)', 'الرغامى'], [500, 280, 'cartFi', 'الغضروف الليفي الأبيض', 'الأقراص بين الفقرات'], [770, 280, 'cartEl', 'الغضروف المطاط (الأصفر)', 'صيوان الأذن']], R = 118;
  const mats = {}, cells = [], caps = [];
  P.forEach(([cx, cy, id], k) => {
    let inner = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${CON_PAL.cart}" stroke="${CON_PAL.cartL}" stroke-width="3"/>`;
    if (id === 'cartEl') for (let i = 0; i < 16; i++){ const a = rr() * 6.28, d = rr() * R * 0.8; inner += `<path d="${waveD(cx + Math.cos(a) * d - 40, cy + Math.sin(a) * d, cx + Math.cos(a) * d + 40, cy + Math.sin(a) * d + (rr() - 0.5) * 40, 4, 2, i)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="2.4"/>`; }
    if (id === 'cartFi') for (let i = -4; i <= 4; i++){ const y = cy + i * 24; const hw = Math.sqrt(Math.max(0, R * R - (i * 24) * (i * 24))) - 6; inner += `<path d="${waveD(cx - hw, y, cx + hw, y, 3, 3, i)}" fill="none" stroke="${CON_PAL.colS}" stroke-width="5" opacity=".7"/>`; }
    mats[id] = inner;
    /* خلايا غضروفية داخل محافظ */
    const n = id === 'cartFi' ? 7 : 8;
    for (let i = 0; i < n; i++){
      const a = i / n * 6.283 + k, d = (i % 2 ? 0.55 : 0.3) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * (id === 'cartFi' ? 0.6 : 1);
      const two = id !== 'cartFi' && i % 3 === 0;
      caps.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${two ? 21 : 14}" ry="13" fill="#a9c9dc" stroke="#6f93aa" stroke-width="2"/>`);
      (two ? [-7, 7] : [0]).forEach(o => cells.push(`<circle cx="${n2(x + o)}" cy="${n2(y)}" r="7.5" fill="#8a7fd6" stroke="#e6e0ff" stroke-width="1"/>`));
    }
  });
  const body = `<g id="cartG">
    ${P.map(([, , id]) => part(id, mats[id])).join('')}
    ${part('cCaps', caps.join(''))}
    ${part('chondro', cells.join(''))}</g>
    ${P.map(([cx, cy, , name, where]) => `<text class="cap" x="${cx}" y="${cy + R + 34}" text-anchor="middle">${name}</text><text class="cap sm" x="${cx}" y="${cy + R + 58}" text-anchor="middle">${where}</text>`).join('')}
    ${conCap('الغضروف: مادته البينية صلدة فيها المخاطين الغضروفي وألياف بيض دقيقة، وخلاياه الغضروفية في محافظ', 'يُضغط فيقاوم الضغط والشد — والأنواع الثلاثة تبعاً لسيادة الألياف في مادته البينية', 520)}`;
  return {
    body, fnParts: ['cartHy', 'cartFi', 'cartEl'],
    parts: [
      { id: 'cartHy', anchor: [230 - R * 0.7, 280 - R * 0.7], label: [134, 120], side: 'L' },
      { id: 'cartFi', anchor: [500, 280 - R], label: [500, 104], side: 'C' },
      { id: 'cartEl', anchor: [770 + R * 0.7, 280 - R * 0.7], label: [866, 120], side: 'R' },
      { id: 'chondro', anchor: [770 + 0.55 * R * Math.cos(1 / 8 * 6.283 + 2), 280 + 0.55 * R * Math.sin(1 / 8 * 6.283 + 2)], label: [866, 440], side: 'R' },
      { id: 'cCaps', anchor: [230 + 0.3 * R + 12, 280], label: [134, 440], side: 'L' }
    ],
    tools: [{ id: 'info:tCart', label: 'عن الغضروف' }, { id: 'tbl:cartTypes', label: 'أنواع الغضروف (ص55)' }, { id: 'tbl:cartBone', label: 'الغضروف × العظم (ص61)' }],
    tick(dt, t, a){ const k = Math.max(0, Math.sin(t * 1.5)) * 0.08; const g = a.el('#cartG'); if (g) g.setAttribute('transform', `translate(0,280) scale(${n2(1 + k * 0.5)},${n2(1 - k)}) translate(0,-280)`); }
  };
}

/* ───────── 7) العظم المصمت (ص59–60): رسم الملزمة وخطواته الأربع ───────── */
function conBone(){
  /* ربع مقطع: ثلاثة جوانب مستقيمة والجانب الأيمن قوس (سطح العظم) */
  const X0 = 250, Y0 = 92, X1 = 600, Y1 = 512, OX = 250, OY = 302, OR = 420;
  const arcX = y => OX + Math.sqrt(Math.max(0, OR * OR - (y - OY) * (y - OY)));
  const edge = (r, n) => { let d = ''; for (let i = 0; i <= (n || 30); i++){ const y = Y0 + (Y1 - Y0) * i / (n || 30); d += (i ? ' L' : 'M') + cPt(OX + Math.sqrt(Math.max(0, r * r - (y - OY) * (y - OY))), y); } return d; };
  const outline = `M${cPt(X0, Y0)} L${cPt(arcX(Y0), Y0)} ${edge(OR).replace('M', 'L')} L${cPt(X0, Y1)}Z`;
  /* جهاز هافرس الرئيسي: حلقات بيضوية غير منتظمة قليلاً */
  const HC = [440, 300];
  const ring = (cx, cy, r, w) => { let d = ''; for (let i = 0; i <= 36; i++){ const a = i / 36 * 6.2832, rr = r * (1 + 0.06 * Math.sin(a * 2 + r * 0.05)) * (w || 1); d += (i ? ' L' : 'M') + cPt(cx + Math.cos(a) * rr * 0.92, cy + Math.sin(a) * rr * 1.08); } return d + 'Z'; };
  const rings = [22, 40, 58, 78, 98, 120].map(r => `<path class="b1" d="${ring(HC[0], HC[1], r)}" fill="none" stroke="#7a5a30" stroke-width="2"/>`).join('');
  const circ = [OR - 18, OR - 36, OR - 54].map(r => `<path class="b1" d="${edge(r)}" fill="none" stroke="#7a5a30" stroke-width="2"/>`).join('');
  /* أجهزة هافرس جزئية عند الحواف (الخطوة 2) */
  const partial = [[262, 150], [262, 480], [440, 500], [570, 110]].map(([x, y]) => [16, 32, 50, 68].map(r => `<path class="b2" d="${ring(x, y, r)}" fill="none" stroke="#7a5a30" stroke-width="1.8"/>`).join('') + `<circle class="b2" cx="${x}" cy="${y}" r="8" fill="#3a2010"/>`).join('');
  /* الخلايا العظمية على الحلقات (الخطوة 3) وخطوط دقيقة حولها (الخطوة 4) */
  const os = [], can = [];
  [31, 49, 68, 88, 109].forEach((r, k) => { const n = Math.round(r / 9); for (let i = 0; i < n; i++){ const a = i / n * 6.283 + k * 0.4, x = HC[0] + Math.cos(a) * r * 0.92, y = HC[1] + Math.sin(a) * r * 1.08, deg = a * 57.3 + 90;
    os.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="6.5" ry="3" transform="rotate(${n2(deg)} ${n2(x)} ${n2(y)})" fill="#2f8f86"/>`);
    for (let j = -2; j <= 2; j++){ const b = a + j * 0.05; can.push(`<path d="M${cPt(x, y)} L${cPt(x + Math.cos(b) * 9, y + Math.sin(b) * 9)} M${cPt(x, y)} L${cPt(x - Math.cos(b) * 9, y - Math.sin(b) * 9)}" stroke="#4a3418" stroke-width=".8"/>`); } } });
  [OR - 27, OR - 45].forEach(r => { for (let y = Y0 + 20; y < Y1; y += 34){ const x = OX + Math.sqrt(r * r - (y - OY) * (y - OY)); os.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="6" ry="3" transform="rotate(90 ${n2(x)} ${n2(y)})" fill="#2f8f86"/>`); } });
  /* سمحاق العظم: شريط رفيع على الحافة المقوّسة */
  const bp = r => Array.from({ length: 31 }, (_, i) => { const y = Y0 + (Y1 - Y0) * i / 30; return [OX + Math.sqrt(Math.max(0, r * r - (y - OY) * (y - OY))), y]; });
  const band = 'M' + bp(OR).concat(bp(OR + 16).reverse()).map(p => cPt(p[0], p[1])).join(' L') + 'Z';
  const body = `
    <defs><clipPath id="boneClip"><path d="${outline}"/></clipPath></defs>
    ${part('periost', `<path class="b1" d="${band}" fill="#c9875a" stroke="#7a4a20" stroke-width="2"/>`)}
    <path class="b1" d="${outline}" fill="${CON_PAL.bone}" stroke="#7a5a30" stroke-width="2.4"/>
    <g clip-path="url(#boneClip)">
      ${part('circLam', circ)}
      ${part('lamella', rings + partial)}
      <g class="b4">${can.join('')}</g>
      ${part('osteo', os.join(''))}
    </g>
    ${part('havers', `<path class="b1" d="${ring(HC[0], HC[1], 13)}" fill="#3a1a1a" stroke="#fff3e0" stroke-width="1.6"/>`)}
    ${part('bVessel', `<circle id="hvA" cx="${HC[0] - 4}" cy="${HC[1] - 3}" r="4.6" fill="#d33"/><circle cx="${HC[0] + 4}" cy="${HC[1] + 4}" r="3.6" fill="#3a6ad0"/>`)}
    <g>${Array.from({ length: 12 }, (_, i) => `<circle class="nut" data-i="${i}" r="3" fill="#ff8a7a" opacity="0"/>`).join('')}</g>
    ${conCap('مقطع في العظم المصمت — صفائح عظمية متحدة المركز حول قناة هافرس تكوّن جهاز هافرس', 'الأوعية الدموية في قناة هافرس، والغذاء يصل الخلايا العظمية في محافظها')}`;
  return {
    body, fnParts: ['havers', 'bVessel'],
    parts: [
      { id: 'osteo', anchor: [HC[0] - 88 * 0.92 * 0.7, HC[1] - 88 * 1.08 * 0.7], label: [134, 130], side: 'L' },
      { id: 'bVessel', anchor: [HC[0] - 5, HC[1] - 4], label: [134, 220], side: 'L' },
      { id: 'havers', anchor: [HC[0] - 12, HC[1] + 6], label: [134, 300], side: 'L' },
      { id: 'lamella', anchor: [HC[0] - 78 * 0.92, HC[1] + 40], label: [134, 420], side: 'L' },
      { id: 'periost', anchor: [arcX(200) + 8, 200], label: [866, 160], side: 'R' },
      { id: 'circLam', anchor: [arcX(300) - 36, 300], label: [866, 300], side: 'R' }
    ],
    tools: [{ id: 'info:tBone', label: 'عن العظم' }, { id: 'tbl:boneTypes', label: 'المصمت × الإسفنجي (ص59)' }, { id: 'tbl:cartBone', label: 'الغضروف × العظم (ص61)' }],
    tick(dt, t, a){
      const hv = a.el('#hvA'); if (hv) hv.setAttribute('r', n2(4.2 + 1.2 * Math.sin(t * 5)));
      a.all('.nut').forEach(e => { const i = +e.dataset.i, p = (t * 0.22 + i / 12) % 1, ang = i / 12 * 6.283;
        e.setAttribute('cx', n2(HC[0] + Math.cos(ang) * (14 + p * 100) * 0.92)); e.setAttribute('cy', n2(HC[1] + Math.sin(ang) * (14 + p * 100) * 1.08)); e.setAttribute('opacity', n2(Math.sin(p * Math.PI))); });
    }
  };
}

/* ───────── 8) العظم الإسفنجي (ص59): حواجز عظمية متفرعة بينها نقي العظم ───────── */
function conSpon(){
  const X0 = 210, X1 = 790, Y0 = 90, Y1 = 500, rr = rng(91), P = [];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) P.push([X0 + 30 + i * 88 + (rr() - 0.5) * 40, Y0 + 30 + j * 92 + (rr() - 0.5) * 36]);
  const bars = [], os = [];
  P.forEach((p, i) => { const nb = P.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(z => z[0] > i && z[1] < 130).slice(0, 2);
    nb.forEach(([j]) => { const q = P[j], w = 12 + rr() * 10; bars.push(`<path d="M${cPt(p[0], p[1])} Q${cPt((p[0] + q[0]) / 2 + (rr() - 0.5) * 30, (p[1] + q[1]) / 2 + (rr() - 0.5) * 30)} ${cPt(q[0], q[1])}" stroke="${CON_PAL.bone}" stroke-width="${n2(w)}" stroke-linecap="round" fill="none"/>`);
      const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; os.push(`<ellipse cx="${n2(m[0])}" cy="${n2(m[1])}" rx="5" ry="2.6" fill="#2f8f86"/>`); }); });
  const mar = []; for (let i = 0; i < 70; i++) mar.push(`<circle cx="${n2(X0 + 10 + rr() * (X1 - X0 - 20))}" cy="${n2(Y0 + 10 + rr() * (Y1 - Y0 - 20))}" r="${n2(2.5 + rr() * 2.5)}" fill="#c0504a" opacity=".55"/>`);
  const body = `
    ${part('marrow', `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="20" fill="#7a2a2a" opacity=".55"/>${mar.join('')}`)}
    ${part('trabec', `<g id="trG">${bars.join('')}</g>`)}
    ${part('osteo', os.join(''))}
    ${conCap('العظم الإسفنجي — صفائحه العظمية غير مرتبة بل حواجز (عوارض) غير منتظمة تتفرع وتلتقي', 'تحصر بينها فراغات يشغلها نقي (نخاع) العظم، ولا يحتوي على أجهزة هافرس وقنوات هافرس وفولكمان')}`;
  return {
    body, fnParts: ['trabec'],
    parts: [
      { id: 'trabec', anchor: [P[6][0], P[6][1]], label: [866, 140], side: 'R' },
      { id: 'osteo', anchor: [(P[13][0] + P[20][0]) / 2, (P[13][1] + P[20][1]) / 2], label: [866, 330], side: 'R' },
      { id: 'marrow', anchor: [X0 + 14, Y1 - 30], label: [134, 400], side: 'L' }
    ],
    tools: [{ id: 'info:tBone', label: 'عن العظم' }, { id: 'tbl:boneTypes', label: 'المصمت × الإسفنجي (ص59)' }],
    tick(dt, t, a){ const g = a.el('#trG'); if (g) g.style.filter = `drop-shadow(0 0 ${n2(2 + 3 * (0.5 + 0.5 * Math.sin(t * 1.6)))}px #fff3c8)`; }
  };
}

/* ───────── 9) الدم (ص62–69): خلايا الدم كما في رسم الملزمة ص69 ───────── */
const BC = {
  rbc: (x, y, s) => `<g transform="translate(${n2(x)},${n2(y)}) scale(${n2(s || 1)})"><ellipse rx="20" ry="20" fill="${CON_PAL.rbc}" stroke="#ff9a8a" stroke-width="1.5"/><ellipse rx="9" ry="9" fill="#a8241e" opacity=".55"/></g>`,
  wbcBody: (x, y, r, fill) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1.4"/>`,
  gran: (x, y, r, col, n, seed, sz) => { const rr = rng(seed); let s = ''; for (let i = 0; i < n; i++){ const a = rr() * 6.283, d = rr() * r * 0.82; s += `<circle cx="${n2(x + Math.cos(a) * d)}" cy="${n2(y + Math.sin(a) * d)}" r="${sz || 2}" fill="${col}"/>`; } return s; },
  /* العدلة: نواة متعددة الفصوص وحبيبات دقيقة */
  neut: (x, y) => BC.wbcBody(x, y, 28, '#ead7ef') + BC.gran(x, y, 28, '#c79ad0', 26, 5, 1.5) + [[-11, -4], [-2, -10], [8, -3], [4, 9]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="6.5" fill="#6a3a9a"/>`).join('') + `<path d="M${x - 11},${y - 4} L${x - 2},${y - 10} L${x + 8},${y - 3} L${x + 4},${y + 9}" stroke="#6a3a9a" stroke-width="2.5" fill="none"/>`,
  /* الحمضة: نواة بفصين وحبيبات حمراء */
  eosin: (x, y) => BC.wbcBody(x, y, 28, '#f6d0cc') + BC.gran(x, y, 28, '#e0503a', 30, 6, 2.6) + `<ellipse cx="${x - 9}" cy="${y - 2}" rx="8" ry="10" fill="#7a3a8a"/><ellipse cx="${x + 9}" cy="${y - 2}" rx="8" ry="10" fill="#7a3a8a"/>`,
  /* القعدة: حبيبات زرقاء داكنة ونواة على شكل S */
  baso: (x, y) => BC.wbcBody(x, y, 27, '#d2e6f6') + `<path d="M${x - 12},${y - 6} q8,-12 16,0 q8,12 -4,16" stroke="#3a6ab0" stroke-width="7" fill="none" stroke-linecap="round"/>` + BC.gran(x, y, 27, '#203a80', 22, 7, 2.8),
  /* اللمفية: نواة كروية كبيرة تشغل معظم الخلية */
  lympho: (x, y) => BC.wbcBody(x, y, 24, '#d6eef9') + `<circle cx="${x}" cy="${y}" r="17" fill="#5a4ab0"/>`,
  /* الوحيدة: أكبر، نواة كلوية */
  mono: (x, y) => BC.wbcBody(x, y, 32, '#d8eef8') + `<path d="M${x - 16},${y + 4} q2,-18 18,-16 q14,2 12,10 q-10,-4 -14,6 q-4,10 -16,0z" fill="#9a5ab0"/>`,
  plt: (x, y) => `<path d="${blobD(x, y, 14, (a, i) => (i % 3 ? 5 : 8))}" fill="${CON_PAL.plt}"/><circle cx="${x}" cy="${y}" r="2" fill="#7a3a9a"/>`,
  camel: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="13" fill="${CON_PAL.rbc}" stroke="#ff9a8a" stroke-width="1.5"/><ellipse cx="${x - 5}" cy="${y - 4}" rx="9" ry="4" fill="#ff8a7a" opacity=".6"/>`
};
function conBlood(){
  const X0 = 220, X1 = 780, WD = X1 - X0, Y0 = 110, Y1 = 400, rr = rng(4), rbcs = [], plts = [];
  for (let i = 0; i < 13; i++){ const y = n2(Y0 + 30 + rr() * (Y1 - Y0 - 60)); rbcs.push(`<g class="rb" data-i="${i}" data-y="${y}" data-s="${n2(0.85 + rr() * 0.3)}" transform="translate(${X0 + 10 + (i * 43) % WD},${y})">${BC.rbc(0, 0)}</g>`); }
  for (let i = 0; i < 7; i++){ const y = n2(Y0 + 20 + rr() * (Y1 - Y0 - 40)); plts.push(`<g class="pl" data-i="${i}" data-y="${y}" transform="translate(${X0 + 10 + (i * 83) % WD},${y})">${BC.plt(0, 0)}</g>`); }
  const W = [['neut', 300, 175], ['eosin', 370, 330], ['baso', 500, 200], ['lympho', 620, 330], ['mono', 690, 180]];
  const body = `
    <rect x="${X0}" y="${Y0 - 18}" width="${WD}" height="18" fill="#b0503f"/><rect x="${X0}" y="${Y1}" width="${WD}" height="18" fill="#b0503f"/>
    ${part('plasma', `<rect x="${X0}" y="${Y0}" width="${WD}" height="${Y1 - Y0}" fill="${CON_PAL.plasma}" opacity=".45"/>`)}
    ${part('rbc', rbcs.join(''))}
    ${part('platelet', plts.join(''))}
    ${W.map(([id, x, y], i) => part(id, `<g class="wb" data-i="${i}">${BC[id](x, y)}</g>`)).join('')}
    ${part('rbcCamel', `<rect x="400" y="${Y1 + 34}" width="200" height="66" rx="14" fill="#2a1f2a" stroke="#6a4a5a"/>${BC.camel(455, Y1 + 67)}${BC.camel(535, Y1 + 62)}`)}
    <text class="cap sm" x="500" y="${Y1 + 120}" text-anchor="middle">خلايا الدم الحمر في الجمل: بيضوية محدبة الوجهين خالية من النواة</text>
    ${conCap('الدم نسيج ضام متخصص: خلايا ومادة بينية (بلازما الدم) ومواد بروتينية تتحول إلى ألياف عند تخثر الدم', 'الحمر: قرص مقعر الوجهين عديم النواة · البيض: حبيبية (العدلة، الحمضة، القعدة) ولاحبيبية (اللمفية، الوحيدة) · الصفيحات', 566)}`;
  const pos = (x0, sp, t) => X0 + 10 + ((x0 + t * sp) % (WD - 20) + (WD - 20)) % (WD - 20);
  return {
    body, fnParts: ['rbc', 'platelet'],
    parts: [
      { id: 'neut', anchor: [300 - 28, 175], label: [134, 150], side: 'L' },
      { id: 'plasma', anchor: [X0 + 12, Y0 + 40], label: [134, 240], side: 'L' },
      { id: 'eosin', anchor: [370 - 28, 330], label: [134, 330], side: 'L' },
      { id: 'platelet', anchor: [X0 + 40, Y1 - 24], label: [134, 410], side: 'L' },
      { id: 'baso', anchor: [500, 200 - 27], label: [500, 72], side: 'C' },
      { id: 'mono', anchor: [690 + 32, 180], label: [866, 150], side: 'R' },
      { id: 'lympho', anchor: [620 + 24, 330], label: [866, 270], side: 'R' },
      { id: 'rbc', anchor: [X1 - 30, Y1 - 40], label: [866, 370], side: 'R' },
      { id: 'rbcCamel', anchor: [600, Y1 + 67], label: [866, 460], side: 'R' }
    ],
    tools: [{ id: 'info:tBlood', label: 'عن الدم' }, { id: 'tbl:rbcWbc', label: 'الحمر × البيض (ص66)' }, { id: 'tbl:wbcTypes', label: 'أنواع البيض (ص64–65)' }, { id: 'tbl:rbcCamel', label: 'الإنسان × الجمل (ص69)' }],
    tick(dt, t, a){
      const f = focusOwner, sp = id => (f && f !== id ? 0.2 : 1);
      a.all('.rb').forEach(e => { const i = +e.dataset.i, x = pos(i * 43, 60 * sp('rbc'), t), s = +e.dataset.s, tilt = Math.cos(t * 1.6 + i);
        e.setAttribute('transform', `translate(${n2(x)},${e.dataset.y}) scale(${n2(s * (0.4 + 0.6 * Math.abs(tilt)))},${n2(s)})`); });
      a.all('.pl').forEach(e => { const i = +e.dataset.i, x = pos(i * 83, 70 * sp('platelet'), t); e.setAttribute('transform', `translate(${n2(x)},${e.dataset.y})`); });
      /* خلايا الدم البيض لها القابلية على الحركة الأميبية */
      a.all('.wb').forEach(e => { const i = +e.dataset.i; e.setAttribute('transform', `translate(${n2(Math.sin(t * 0.8 + i) * 8)},${n2(Math.cos(t * 0.6 + i * 2) * 5)})`); });
    }
  };
}

/* ───────── 10) البلازما واللمف (ص67–68) ───────── */
function conLym(){
  const body = `
    <rect x="120" y="110" width="760" height="300" rx="24" fill="${CON_PAL.mat}" opacity=".45"/>
    ${part('plasma', `<path d="M120,150 L880,150 L880,206 L120,206Z" fill="${CON_PAL.plasma}" opacity=".7"/><path d="M120,150 L880,150 M120,206 L880,206" stroke="#b0503f" stroke-width="8"/>`)}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<g class="rbL" data-i="${i}">${BC.rbc(0, 178, 0.7)}</g>`).join('')}
    ${part('lymph', `<path d="M140,350 Q400,330 640,350 T880,250 L880,214 L860,214 Q760,290 640,320 Q400,300 140,318Z" fill="#dff3e6" stroke="#5aa070" stroke-width="3"/>`)}
    ${part('lympho', [[260, 336], [470, 326], [700, 316]].map(([x, y]) => BC.lympho(x, y).replace(/r="24"/, 'r="13"').replace(/r="17"/, 'r="9"')).join(''))}
    <g>${Array.from({ length: 12 }, (_, i) => `<circle class="lq" data-i="${i}" r="4" fill="#7fc79a" opacity="0"/>`).join('')}</g>
    <text class="cap sm" x="500" y="134" text-anchor="middle">مجرى الدم (البلازما: 90% ماء و10% مواد صلبة)</text>
    <text class="cap sm" x="430" y="394" text-anchor="middle">وعاء لمفاوي يجمع اللمف من الأنسجة ويرجعه إلى مجرى الدم</text>
    ${conCap('البلازما: سائل متجانس أصفر فاتح يمثل المادة البينية للدم — الخثرة فيها أسرع وأصلب', 'اللمف: سائل يتجمع من الأنسجة، يشبه البلازما لكن محتواه البروتيني أقل، والخثرة فيه أبطأ ولينة، وفيه خلايا لمفية', 500)}`;
  return {
    body, fnParts: ['lymph'],
    parts: [
      { id: 'plasma', anchor: [150, 178], label: [134, 180], side: 'L' },
      { id: 'lymph', anchor: [180, 336], label: [134, 330], side: 'L' },
      { id: 'lympho', anchor: [700 + 13, 316], label: [866, 400], side: 'R' }
    ],
    tools: [{ id: 'info:tBlood', label: 'عن الدم' }, { id: 'tbl:plasmaLymph', label: 'البلازما × اللمف (ص67)' }],
    tick(dt, t, a){
      a.all('.rbL').forEach(e => { const i = +e.dataset.i, x = 130 + ((i * 85 + t * 60) % 740); e.setAttribute('transform', `translate(${n2(x)},0)`); });
      /* سائل يخرج إلى الأنسجة ويتجمع في الوعاء اللمفاوي ثم يرجع إلى مجرى الدم */
      a.all('.lq').forEach(e => { const i = +e.dataset.i, p = (t * 0.12 + i / 12) % 1, x0 = 180 + i * 50;
        let x, y; if (p < 0.4){ x = x0; y = 210 + p / 0.4 * 110; } else { const q = (p - 0.4) / 0.6; x = x0 + q * (870 - x0); y = 330 - q * q * 110; }
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); e.setAttribute('opacity', n2(Math.sin(p * Math.PI) * 0.9)); });
    }
  };
}
