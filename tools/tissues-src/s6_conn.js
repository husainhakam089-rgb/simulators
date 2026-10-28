
/* ══════════════════════════════════════════════════════════════════════════
   4.6 · النسيج الضام (الرابط): الضام الأصيل (المتانة والمرونة)، الغضروف
         بأنواعه، العظم (جهاز هافرس)، الدم، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
const CON_VIEWS = [
  { id: 'cloose', label: 'الضام الأصيل' },
  { id: 'ccart',  label: 'الغضروف' },
  { id: 'cbone',  label: 'العظم' },
  { id: 'cblood', label: 'الدم' },
  { id: 'ccmp',   label: 'قارن' }
];
const CON_PAL = { mat: '#d9cde6', matD: '#b9a8cc', col: '#e58aa0', ela: '#4a3a6a', fib: '#c9a0b4', cart: '#cfe3ef', cartL: '#eef7fb', bone: '#e9dcc0', boneL: '#fff6e0', rbc: '#d9433b', wbc: '#efe6f6', plt: '#c08bd0', plasma: '#f6e3a6' };

SCENES.conn = {
  title: 'النسيج الضام (الرابط)',
  get src(){ return SRC_WAIT; },
  tint: ['rgba(150,110,170,.24)', 'rgba(170,90,80,.16)'],
  model3d: () => 'con_' + SEL.conv,
  build(){
    const v = SEL.conv || 'cloose';
    const s = v === 'ccart' ? conCart() : v === 'cbone' ? conBone() : v === 'cblood' ? conBlood() : v === 'ccmp' ? conCmp() : conLoose();
    s.rebuildOnRadio = 'conv';
    s.tools = CON_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'conv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.con_loose = { title: 'النسيج الضام الأصيل', build: () => conLoose() };
SCENES.con_cart  = { title: 'الغضروف', build: () => conCart() };
SCENES.con_bone  = { title: 'العظم (جهاز هافرس)', build: () => conBone() };
SCENES.con_blood = { title: 'الدم', build: () => conBlood() };

/* موجة بين نقطتين (ليف) */
function waveD(x0, y0, x1, y1, amp, n, ph){
  let d = `M${n2(x0)},${n2(y0)}`; const N = 40;
  for (let i = 1; i <= N; i++){ const u = i / N, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * n * Math.PI * 2 + (ph || 0)) * amp; d += ` L${n2(x)},${n2(y)}`; }
  return d;
}

/* ───────── 1) الضام الأصيل ───────── */
function conLoose(){
  const rr = rng(66), X0 = 180, X1 = 820, Y0 = 100, Y1 = 520;
  const col = [], ela = [], fib = [];
  const C = [[200, 160, 800, 230], [190, 330, 810, 280], [210, 460, 790, 400], [260, 120, 520, 500], [600, 110, 760, 510]];
  C.forEach(([a, b, c, d], i) => col.push(`<path class="cf" data-i="${i}" data-c="${[a, b, c, d].join(',')}" d="${waveD(a, b, c, d, 14, 4, i)}" fill="none" stroke="${CON_PAL.col}" stroke-width="11" stroke-linecap="round" opacity=".9"/>`));
  for (let i = 0; i < 9; i++){ const x = X0 + 30 + rr() * (X1 - X0 - 60), y = Y0 + 30 + rr() * (Y1 - Y0 - 60), a = rr() * 3.14, L = 90 + rr() * 90;
    const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
    ela.push(`<path class="ef" data-c="${n2(x)},${n2(y)},${n2(x2)},${n2(y2)}" d="${waveD(x, y, x2, y2, 6, 3, i)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="2.6"/>`);
    ela.push(`<line x1="${n2((x + x2) / 2)}" y1="${n2((y + y2) / 2)}" x2="${n2((x + x2) / 2 + Math.cos(a + 1) * 40)}" y2="${n2((y + y2) / 2 + Math.sin(a + 1) * 40)}" stroke="${CON_PAL.ela}" stroke-width="2"/>`); }
  for (let i = 0; i < 7; i++){ const x = X0 + 70 + rr() * (X1 - X0 - 140), y = Y0 + 60 + rr() * (Y1 - Y0 - 120), a = rr() * 180;
    fib.push(`<g transform="rotate(${n2(a)} ${n2(x)} ${n2(y)})"><path d="M${n2(x - 46)},${n2(y)} Q${n2(x)},${n2(y - 18)} ${n2(x + 46)},${n2(y)} Q${n2(x)},${n2(y + 18)} ${n2(x - 46)},${n2(y)}Z" fill="${CON_PAL.fib}" stroke="#fff" stroke-width="1.2"/><ellipse cx="${n2(x)}" cy="${n2(y)}" rx="13" ry="7" fill="url(#gNucl)"/></g>`); }
  const body = `<g id="looseG">
    ${part('matrixC', `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="20" fill="${CON_PAL.mat}" opacity=".9"/>`)}
    ${part('colFib', col.join(''))}
    ${part('elaFib', ela.join(''))}
    ${part('fibro', fib.join(''))}</g>
    <g id="pull" opacity="0"><path d="M150,310 L100,310 M112,298 L100,310 L112,322 M850,310 L900,310 M888,298 L900,310 L888,322" fill="none" stroke="#ffe08a" stroke-width="3" stroke-linecap="round"/></g>
    <text class="cap sm" x="500" y="${Y1 + 44}" text-anchor="middle">النسيج الضام الأصيل — يُشدّ فتقاومه الألياف الكولاجينية، ويرجع لشكله بفضل الألياف المرنة</text>`;
  return {
    body, fnParts: ['elaFib', 'colFib'],
    parts: [
      { id: 'colFib', anchor: [790, 400], label: [866, 420], side: 'R' },
      { id: 'elaFib', anchor: [X1 - 20, 180], label: [866, 160], side: 'R' },
      { id: 'fibro', anchor: [X0 + 120, 300], label: [134, 260], side: 'L' },
      { id: 'matrixC', anchor: [X0 + 20, Y1 - 30], label: [134, 470], side: 'L' }
    ],
    tools: [{ id: 'info:tLoose', label: 'عن الضام الأصيل' }, { id: 'tbl:connTypes', label: 'أنواع النسيج الضام' }],
    tick(dt, t, a){
      const k = Math.max(0, Math.sin(t * 1.2)), sx = 1 + 0.12 * k;
      const g = a.el('#looseG'); if (g) g.setAttribute('transform', `translate(500,310) scale(${n2(sx)},${n2(1 - 0.04 * k)}) translate(-500,-310)`);
      const p = a.el('#pull'); if (p) p.setAttribute('opacity', n2(k));
      /* الألياف تستقيم عند الشد وتتموج عند الرجوع */
      a.all('.cf').forEach(e => { const [x0, y0, x1, y1] = e.dataset.c.split(',').map(Number); e.setAttribute('d', waveD(x0, y0, x1, y1, 14 * (1 - 0.8 * k), 4, +e.dataset.i)); });
      a.all('.ef').forEach((e, i) => { const [x0, y0, x1, y1] = e.dataset.c.split(',').map(Number); e.setAttribute('d', waveD(x0, y0, x1, y1, 6 * (1 - 0.9 * k), 3, i)); });
    }
  };
}

/* ───────── 2) الغضروف بأنواعه الثلاثة ───────── */
function conCart(){
  const rr = rng(8), P = [[230, 300, 'cartHy', 'الزجاجي'], [500, 300, 'cartEl', 'المرن'], [770, 300, 'cartFi', 'الليفي']], R = 118;
  const mats = {}, cells = [], lacs = [];
  P.forEach(([cx, cy, id, name], k) => {
    let inner = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${CON_PAL.cart}" stroke="${CON_PAL.cartL}" stroke-width="3"/>`;
    if (id === 'cartEl') for (let i = 0; i < 14; i++){ const a = rr() * 6.28, d = rr() * R * 0.85; inner += `<path d="${waveD(cx + Math.cos(a) * d - 40, cy + Math.sin(a) * d, cx + Math.cos(a) * d + 40, cy + Math.sin(a) * d + (rr() - 0.5) * 40, 4, 2, i)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="2.2"/>`; }
    if (id === 'cartFi') for (let i = -4; i <= 4; i++){ const y = cy + i * 24; const hw = Math.sqrt(Math.max(0, R * R - (i * 24) * (i * 24))) - 6; inner += `<path d="${waveD(cx - hw, y, cx + hw, y, 3, 3, i)}" fill="none" stroke="${CON_PAL.col}" stroke-width="5" opacity=".75"/>`; }
    mats[id] = inner;
    /* فجوات فيها خلايا (منفردة أو مجاميع) */
    const n = id === 'cartFi' ? 7 : 8;
    for (let i = 0; i < n; i++){
      const a = i / n * 6.283 + k, d = (i % 2 ? 0.55 : 0.3) * R, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * (id === 'cartFi' ? 0.6 : 1);
      const two = id !== 'cartFi' && i % 3 === 0;
      lacs.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${two ? 20 : 13}" ry="12" fill="#a9c9dc" stroke="#6f93aa" stroke-width="1.6"/>`);
      (two ? [-7, 7] : [0]).forEach(o => cells.push(`<circle cx="${n2(x + o)}" cy="${n2(y)}" r="7.5" fill="#8a7fd6" stroke="#e6e0ff" stroke-width="1"/>`));
    }
  });
  const body = `<g id="cartG">
    ${P.map(([, , id]) => part(id, mats[id])).join('')}
    ${part('lacuna', lacs.join(''))}
    ${part('chondro', cells.join(''))}</g>
    ${P.map(([cx, cy, , name]) => `<text class="cap" x="${cx}" y="${cy + R + 36}" text-anchor="middle">${name}</text>`).join('')}
    <text class="cap sm" x="500" y="${300 + R + 66}" text-anchor="middle">الغضروف: خلايا غضروفية في فجوات داخل مادة صلبة مرنة — يُضغط ويرجع</text>`;
  return {
    body, fnParts: ['cartHy', 'cartEl', 'cartFi'],
    parts: [
      { id: 'cartHy', anchor: [230 - R * 0.7, 300 - R * 0.7], label: [134, 140], side: 'L' },
      { id: 'cartEl', anchor: [500, 300 - R], label: [500, 110], side: 'C' },
      { id: 'cartFi', anchor: [770 + R * 0.7, 300 - R * 0.7], label: [866, 140], side: 'R' },
      { id: 'chondro', anchor: [770 + 0.55 * R * Math.cos(1 / 7 * 6.283 + 2), 300 + 0.55 * R * Math.sin(1 / 7 * 6.283 + 2) * 0.6], label: [866, 470], side: 'R' },
      { id: 'lacuna', anchor: [230 + 0.3 * R, 300], label: [134, 470], side: 'L' }
    ],
    tools: [{ id: 'tbl:cartTypes', label: 'أنواع الغضروف' }, { id: 'tbl:cartBone', label: 'الغضروف × العظم' }],
    tick(dt, t, a){ const k = Math.max(0, Math.sin(t * 1.5)) * 0.1; const g = a.el('#cartG'); if (g) g.setAttribute('transform', `translate(0,300) scale(${n2(1 + k * 0.5)},${n2(1 - k)}) translate(0,-300)`); }
  };
}

/* ───────── 3) العظم: جهاز هافرس (مقطع عرضي) ───────── */
function conBone(){
  const CX = 500, CY = 300, R = 210, rings = [], lacs = [], cells = [], cans = [];
  for (let r = 44; r < R; r += 26) rings.push(`<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="#c9b48a" stroke-width="2"/>`);
  for (let r = 57; r < R - 6; r += 26){
    const n = Math.round(2 * Math.PI * r / 70);
    for (let i = 0; i < n; i++){ const a = i / n * 6.283 + r * 0.03, x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r, deg = a * 57.3 + 90;
      lacs.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="13" ry="6" transform="rotate(${n2(deg)} ${n2(x)} ${n2(y)})" fill="#6a4a2c"/>`);
      cells.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="9" ry="3.6" transform="rotate(${n2(deg)} ${n2(x)} ${n2(y)})" fill="#b07a54"/>`);
      cans.push(`<line x1="${n2(CX + Math.cos(a) * (r - 13))}" y1="${n2(CY + Math.sin(a) * (r - 13))}" x2="${n2(CX + Math.cos(a) * (r + 13))}" y2="${n2(CY + Math.sin(a) * (r + 13))}" stroke="#6a4a2c" stroke-width="1.2"/>`,
        `<line x1="${n2(x)}" y1="${n2(y)}" x2="${n2(x + Math.cos(a + 1.57) * 16)}" y2="${n2(y + Math.sin(a + 1.57) * 16)}" stroke="#6a4a2c" stroke-width="1"/>`); }
  }
  const nut = []; for (let i = 0; i < 12; i++) nut.push(`<circle class="nut" data-i="${i}" r="3.6" fill="#ff8a7a" opacity="0"/>`);
  const body = `
    <circle cx="${CX}" cy="${CY}" r="${R + 30}" fill="${CON_PAL.bone}" opacity=".35"/>
    ${part('lamella', `<circle cx="${CX}" cy="${CY}" r="${R}" fill="${CON_PAL.bone}" stroke="${CON_PAL.boneL}" stroke-width="3"/>${rings.join('')}`)}
    ${part('canalic', cans.join(''))}
    ${part('lacuna', lacs.join(''))}
    ${part('osteo', cells.join(''))}
    ${part('havers', `<circle cx="${CX}" cy="${CY}" r="32" fill="#3a1a1a" stroke="#fff3e0" stroke-width="2"/><circle id="hv" cx="${CX - 8}" cy="${CY}" r="10" fill="#c0392b"/><circle cx="${CX + 10}" cy="${CY + 6}" r="6" fill="#e9d29a"/>`)}
    <g>${nut.join('')}</g>
    <text class="cap sm" x="${CX}" y="${CY + R + 60}" text-anchor="middle">جهاز هافرس (مقطع عرضي في العظم) — الغذاء ينتقل من قناة هافرس إلى الخلايا عبر القنيوات</text>`;
  return {
    body, fnParts: ['havers', 'canalic'],
    parts: [
      { id: 'havers', anchor: [CX, CY - 30], label: [866, 120], side: 'R' },
      { id: 'lamella', anchor: [CX + R * 0.96, CY + 20], label: [866, 300], side: 'R' },
      { id: 'osteo', anchor: [CX + 57, CY], label: [866, 470], side: 'R' },
      { id: 'lacuna', anchor: [CX - 83 * 0.71, CY - 83 * 0.71], label: [134, 200], side: 'L' },
      { id: 'canalic', anchor: [CX - 109, CY + 14], label: [134, 400], side: 'L' }
    ],
    tools: [{ id: 'info:tBone', label: 'عن العظم' }, { id: 'tbl:cartBone', label: 'الغضروف × العظم' }],
    tick(dt, t, a){
      const hv = a.el('#hv'); if (hv) hv.setAttribute('r', n2(9 + 2 * Math.sin(t * 5)));
      a.all('.nut').forEach(e => { const i = +e.dataset.i, p = (t * 0.25 + i / 12) % 1, ang = i / 12 * 6.283;
        e.setAttribute('cx', n2(CX + Math.cos(ang) * (34 + p * 150))); e.setAttribute('cy', n2(CY + Math.sin(ang) * (34 + p * 150))); e.setAttribute('opacity', n2(Math.sin(p * Math.PI))); });
    }
  };
}

/* ───────── 4) الدم ───────── */
function conBlood(){
  const Y0 = 150, Y1 = 450, rr = rng(4), rbcs = [], wbcs = [], plts = [];
  /* مواقع ثابتة أولية (للامتحان والرسم اليدوي)، والحركة تحرّكها */
  for (let i = 0; i < 22; i++){ const y = n2(Y0 + 30 + rr() * (Y1 - Y0 - 60)); rbcs.push(`<g class="rb" data-i="${i}" data-y="${y}" data-s="${n2(0.8 + rr() * 0.5)}" transform="translate(${60 + (i * 40) % 880},${y})"><ellipse rx="20" ry="20" fill="${CON_PAL.rbc}" stroke="#ff9a8a" stroke-width="1.5"/><ellipse rx="9" ry="9" fill="#a8241e" opacity=".6"/></g>`); }
  for (let i = 0; i < 3; i++) wbcs.push(`<g class="wb" data-i="${i}" data-y="${n2(Y0 + 60 + i * 90)}" transform="translate(${60 + (i * 290 + 100) % 880},${n2(Y0 + 60 + i * 90)})"><circle r="30" fill="${CON_PAL.wbc}" stroke="#fff" stroke-width="1.5"/>
    <path d="M-12,-8 q6,-10 12,0 q6,10 12,0 q4,10 -4,14 q-10,4 -16,-2 q-8,-6 -4,-12z" fill="#7565c2"/></g>`);
  for (let i = 0; i < 12; i++){ const y = n2(Y0 + 20 + rr() * (Y1 - Y0 - 40)); plts.push(`<ellipse class="pl" data-i="${i}" data-y="${y}" cx="${60 + (i * 73) % 880}" cy="${y}" rx="6" ry="3.5" fill="${CON_PAL.plt}"/>`); }
  const body = `
    <rect x="60" y="${Y0 - 22}" width="880" height="22" fill="#b0503f"/><rect x="60" y="${Y1}" width="880" height="22" fill="#b0503f"/>
    ${part('plasma', `<rect x="60" y="${Y0}" width="880" height="${Y1 - Y0}" fill="${CON_PAL.plasma}" opacity=".45"/>`)}
    ${part('rbc', rbcs.join(''))}
    ${part('wbc', wbcs.join(''))}
    ${part('platelet', plts.join(''))}
    <text class="cap sm" x="500" y="${Y1 + 70}" text-anchor="middle">الدم نسيج ضام سائل: البلازما وكريات الدم الحمر والبيض والصفيحات تجري داخل وعاء دموي</text>`;
  const pos = (x0, sp, t) => 60 + ((x0 + t * sp) % 880 + 880) % 880;
  return {
    body, fnParts: ['rbc', 'wbc', 'platelet'],
    parts: [
      { id: 'plasma', anchor: [900, Y0 + 20], label: [866, 90], side: 'R' },
      { id: 'rbc', anchor: [60 + 20 * 40 % 880, Y1 - 40], label: [866, 520], side: 'R' },
      { id: 'wbc', anchor: [160, Y0 + 60], label: [134, 100], side: 'L' },
      { id: 'platelet', anchor: [60 + 73 * 2, Y0 + 100], label: [134, 520], side: 'L' }
    ],
    tools: [{ id: 'info:tBlood', label: 'عن الدم' }, { id: 'tbl:bloodCells', label: 'مكونات الدم' }],
    _lay: true,
    tick(dt, t, a){
      const f = focusOwner, sp = id => (f && f !== id ? 0.2 : 1);
      a.all('.rb').forEach(e => { const i = +e.dataset.i, x = pos(i * 40, 90 * sp('rbc'), t), s = +e.dataset.s, tilt = Math.cos(t * 2 + i);
        e.setAttribute('transform', `translate(${n2(x)},${e.dataset.y}) scale(${n2(s * (0.45 + 0.55 * Math.abs(tilt)))},${n2(s)})`); });
      a.all('.wb').forEach(e => { const i = +e.dataset.i, x = pos(i * 290 + 100, 45 * sp('wbc'), t); e.setAttribute('transform', `translate(${n2(x)},${e.dataset.y}) rotate(${n2(t * 40 + i * 60)})`); });
      a.all('.pl').forEach(e => { const i = +e.dataset.i, x = pos(i * 73, 110 * sp('platelet'), t); e.setAttribute('cx', n2(x)); e.setAttribute('cy', e.dataset.y); });
    }
  };
}

/* ───────── 5) قارن: أنواع النسيج الضام ───────── */
function conCmp(){
  const P = [[170, 'tLoose', 'الضام الأصيل', 'خلايا ليفية وألياف'], [390, 'tCart', 'الغضروف', 'مادة صلبة مرنة، بلا أوعية'], [610, 'tBone', 'العظم', 'مادة صلبة، قنوات هافرس'], [830, 'tBlood', 'الدم', 'مادة سائلة (البلازما)']], CY = 280, R = 92;
  const draw = {
    tLoose: x => `<circle cx="${x}" cy="${CY}" r="${R}" fill="${CON_PAL.mat}"/><path d="${waveD(x - 80, CY - 30, x + 80, CY + 10, 9, 3, 0)}" fill="none" stroke="${CON_PAL.col}" stroke-width="8"/><path d="${waveD(x - 70, CY + 40, x + 60, CY - 50, 5, 3, 1)}" fill="none" stroke="${CON_PAL.ela}" stroke-width="2.4"/><g transform="rotate(25 ${x} ${CY + 30})"><path d="M${x - 30},${CY + 30} Q${x},${CY + 18} ${x + 30},${CY + 30} Q${x},${CY + 42} ${x - 30},${CY + 30}Z" fill="${CON_PAL.fib}"/></g>`,
    tCart: x => `<circle cx="${x}" cy="${CY}" r="${R}" fill="${CON_PAL.cart}"/>` + [[-35, -25], [30, -30], [-20, 35], [35, 30]].map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${CY + dy}" rx="16" ry="11" fill="#a9c9dc"/><circle cx="${x + dx}" cy="${CY + dy}" r="7" fill="#8a7fd6"/>`).join(''),
    tBone: x => `<circle cx="${x}" cy="${CY}" r="${R}" fill="${CON_PAL.bone}"/>` + [30, 52, 74].map(r => `<circle cx="${x}" cy="${CY}" r="${r}" fill="none" stroke="#c9b48a" stroke-width="2"/>`).join('') + `<circle cx="${x}" cy="${CY}" r="16" fill="#3a1a1a"/><circle cx="${x}" cy="${CY}" r="6" fill="#c0392b"/>` + [0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${n2(x + Math.cos(i) * 41)}" cy="${n2(CY + Math.sin(i) * 41)}" rx="7" ry="3.5" fill="#6a4a2c"/>`).join(''),
    tBlood: x => `<circle cx="${x}" cy="${CY}" r="${R}" fill="${CON_PAL.plasma}" opacity=".6"/>` + [[-35, -20], [10, -45], [30, 10], [-20, 40], [45, 45]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${CY + dy}" r="15" fill="${CON_PAL.rbc}"/>`).join('') + `<circle cx="${x - 40}" cy="${CY + 25}" r="20" fill="${CON_PAL.wbc}"/><circle cx="${x - 40}" cy="${CY + 25}" r="8" fill="#7565c2"/>`
  };
  const body = P.map(([x, id, a, b]) => part(id, `<g class="dHi">${draw[id](x)}</g>`) + `<text class="cap" x="${x}" y="${CY + R + 36}" text-anchor="middle">${a}</text><text class="cap sm" x="${x}" y="${CY + R + 62}" text-anchor="middle">${b}</text>`).join('') +
    `<text class="cap sm" x="500" y="${CY + R + 110}" text-anchor="middle">طبيعة المادة بين الخلوية هي التي تميّز أنواع النسيج الضام</text>`;
  let opened = false;
  return {
    body, fnParts: [],
    parts: [
      { id: 'tLoose', anchor: [170, CY - R], label: [134, 110], side: 'L' },
      { id: 'tCart', anchor: [390, CY - R], label: [390, 120], side: 'C' },
      { id: 'tBone', anchor: [610, CY - R], label: [610, 120], side: 'C' },
      { id: 'tBlood', anchor: [830, CY - R], label: [866, 110], side: 'R' }
    ],
    tools: [{ id: 'tbl:connTypes', label: 'جدول الفروقات' }, { id: 'tbl:cartBone', label: 'الغضروف × العظم' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'conn' && SEL.conv === 'ccmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.connTypes); }, 700); } },
    tick(dt, t, a){ a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(3 + 5 * (0.5 + 0.5 * Math.sin(t * 2.2 + i)))}px #ffd166)`); }
  };
}
