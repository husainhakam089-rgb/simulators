
/* ══════════════════════════════════════════════════════════════════════════
   4.2 · النسيج الأساس — ملزمة ص10–14 وص23: موقعه في الساق (القشرة واللب
         والأشعة اللبية)، البرنكيمي، الكولنكيمي، السكلرنكيمي، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
const SIM_VIEWS = [
  { id: 'sloc', label: 'موقعه في الساق' },
  { id: 'par',  label: 'البرنكيمي' },
  { id: 'col',  label: 'الكولنكيمي' },
  { id: 'scl',  label: 'السكلرنكيمي' },
  { id: 'scmp', label: 'قارن' }
];
const SIM_PAL = { par: '#6fae6a', parV: '#bfe3ef', col: '#7fae78', colC: '#f2d9e6', scl: '#c9a46a', sclD: '#3a2a18' };

SCENES.simple = {
  title: 'النسيج الأساس',
  get src(){ return ({ sloc: 'ملزمة ص10 وص12 وص23', par: 'ملزمة ص10–13', col: 'ملزمة ص10–13', scl: 'ملزمة ص10 وص14', scmp: 'ملزمة ص10–11' })[SEL.simv] || 'ملزمة ص10'; },
  tint: ['rgba(110,150,80,.26)', 'rgba(170,130,70,.16)'],
  model3d: () => 'sim_' + SEL.simv,
  build(){
    const v = SEL.simv || 'sloc';
    const s = v === 'par' ? simPar() : v === 'col' ? simCol() : v === 'scl' ? simScl() : v === 'scmp' ? simCmp() : simLoc();
    s.rebuildOnRadio = 'simv';
    s.tools = SIM_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'simv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.sim_loc = { title: 'موقع النسيج الأساس في الساق', build: () => simLoc() };
SCENES.sim_par = { title: 'النسيج البرنكيمي', build: () => simPar() };
SCENES.sim_col = { title: 'النسيج الكولنكيمي', build: () => simCol() };
SCENES.sim_scl = { title: 'النسيج السكلرنكيمي', build: () => simScl() };

/* خلايا دائرية متراصّة على حلقة (لمقطع الساق) */
function ringCells(cx, cy, r0, r1, size, fill, stroke, rr, gap){
  const out = [];
  for (let r = r0 + size / 2; r < r1; r += size * 0.92){
    const n = Math.max(6, Math.round(2 * Math.PI * r / size));
    const off = rr() * 6.28;
    for (let i = 0; i < n; i++){
      const a = off + i / n * 6.283, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      out.push(`<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(size / 2 - (gap || 0.6))}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`);
    }
  }
  return out.join('');
}

/* ───────── 1) موقع النسيج الأساس: القشرة واللب والأشعة اللبية (ص10، ص12، ص23) ───────── */
function simLoc(){
  const rr = rng(44), CX = 500, CY = 300, R = 232;
  const NB = 8, bundles = [], caps = [];
  for (let i = 0; i < NB; i++){
    const a = i / NB * 6.283 - 1.57, c = Math.cos(a), s = Math.sin(a);
    const P = (rad, t) => [CX + c * rad - s * t, CY + s * rad + c * t];
    const xy = P(118, 0), ph = P(150, 0), fc = P(176, 0);
    bundles.push(`<g transform="rotate(${n2(a * 57.3 + 90)} ${n2(xy[0])} ${n2(xy[1])})">
        <ellipse cx="${n2(xy[0])}" cy="${n2(xy[1])}" rx="17" ry="22" fill="#b65a5a" stroke="#ffd2c8" stroke-width="1.2"/>
        <circle cx="${n2(xy[0] - 6)}" cy="${n2(xy[1] + 3)}" r="5" fill="#ffe6dc"/><circle cx="${n2(xy[0] + 6)}" cy="${n2(xy[1] + 6)}" r="4" fill="#ffe6dc"/></g>
      <g transform="rotate(${n2(a * 57.3 + 90)} ${n2(ph[0])} ${n2(ph[1])})"><ellipse cx="${n2(ph[0])}" cy="${n2(ph[1])}" rx="20" ry="13" fill="#a8d07a" stroke="#efffd8" stroke-width="1.2"/></g>`);
    caps.push(`<g transform="rotate(${n2(a * 57.3 + 90)} ${n2(fc[0])} ${n2(fc[1])})"><path d="M${n2(fc[0] - 24)},${n2(fc[1] + 4)} Q${n2(fc[0])},${n2(fc[1] - 20)} ${n2(fc[0] + 24)},${n2(fc[1] + 4)} Q${n2(fc[0])},${n2(fc[1] - 6)} ${n2(fc[0] - 24)},${n2(fc[1] + 4)}Z" fill="${SIM_PAL.scl}" stroke="#ffe7b8" stroke-width="1.4"/></g>`);
  }
  const body = `
    <circle cx="${CX}" cy="${CY}" r="${R + 6}" fill="#22351f"/>
    ${part('tCortex', `<circle cx="${CX}" cy="${CY}" r="${R - 4}" fill="#406b3d"/>
       <g>${ringCells(CX, CY, 186, R - 30, 18, '#78b46d', '#cfeec0', rr, 1.4)}</g>
       <circle cx="${CX}" cy="${CY}" r="${R - 8}" fill="none" stroke="#e7d2df" stroke-width="22" opacity=".55"/>
       <g>${ringCells(CX, CY, R - 30, R - 8, 11, '#8fbf86', '#ffe6f2', rr, 0.4)}</g>`)}
    ${part('tRays', `<circle cx="${CX}" cy="${CY}" r="186" fill="#4f7f48"/>
       <g>${ringCells(CX, CY, 100, 186, 16, '#8fc47c', '#dff7cf', rr, 1.2)}</g>`)}
    ${part('tPith', `<circle cx="${CX}" cy="${CY}" r="100" fill="#4f7f48"/>
       <g>${ringCells(CX, CY, 0, 100, 26, '#9fcf8c', '#e6ffd8', rr, 1.6)}</g>`)}
    ${part('vBundle', bundles.join('') + caps.join(''))}
    ${part('epidermis', `<circle cx="${CX}" cy="${CY}" r="${R - 3}" fill="none" stroke="#d9f2a8" stroke-width="7"/>
       <circle cx="${CX}" cy="${CY}" r="${R + 1}" fill="none" stroke="#f2ffd8" stroke-width="2"/>`)}
    <text class="cap sm" x="${CX}" y="${CY + R + 46}" text-anchor="middle">مقطع عرضي في ساق: النسيج الأساس يشكّل كتلاً نسيجية داخلية (القشرة واللب والأشعة اللبية)</text>`;
  const cyc = ['tCortex', 'tRays', 'tPith'];
  return {
    body, fnParts: ['tCortex', 'tRays', 'tPith'],
    parts: [
      { id: 'epidermis', anchor: [CX + (R - 2) * 0.8, CY - (R - 2) * 0.6], label: [866, 80], side: 'R' },
      { id: 'tCortex', anchor: [CX + 205 * 0.9, CY + 205 * 0.44], label: [866, 250], side: 'R' },
      { id: 'tRays', anchor: [CX + Math.cos(-1.57 + 6.283 * 2.5 / 8) * 140, CY + Math.sin(-1.57 + 6.283 * 2.5 / 8) * 140], label: [866, 420], side: 'R' },
      { id: 'tPith', anchor: [CX - 40, CY + 30], label: [134, 420], side: 'L' },
      { id: 'vBundle', anchor: [CX + Math.cos(-1.57 + 6.283 * 6 / 8) * 135, CY + Math.sin(-1.57 + 6.283 * 6 / 8) * 135], label: [134, 260], side: 'L' }
    ],
    tools: [{ id: 'info:tGround', label: 'عن النسيج الأساس' }, { id: 'tbl:plantTissues', label: 'أنسجة النبات (ص5)' }],
    tick(dt, t, a){
      /* إبراز كتل النسيج الأساس بالتناوب */
      const cur = focusOwner || cyc[Math.floor(t / 2.6) % 3];
      a.all('.part').forEach(p => { const on = p.dataset.part === cur;
        p.style.filter = on ? `drop-shadow(0 0 ${n2(5 + 4 * Math.sin(t * 4))}px #ffd166)` : ''; });
    }
  };
}

/* ───────── 2) النسيج البرنكيمي ───────── */
function simPar(){
  const rr = rng(12), cells = [];
  const C0 = [500, 300], D = 178;
  cells.push(C0);
  for (let i = 0; i < 6; i++){ const a = i / 6 * 6.283 + 0.52; cells.push([C0[0] + Math.cos(a) * D, C0[1] + Math.sin(a) * D * 0.9]); }
  const walls = [], cyto = [], vacs = [], nucs = [], chls = [], gaps = [];
  const shapes = cells.map((c, k) => blobPath(c[0], c[1], 92, 84, 0.06, 30 + k, 22));
  shapes.forEach((sh, k) => {
    const [cx, cy] = cells[k];
    walls.push(`<path d="${sh.d}" fill="none" stroke="#e6ffd8" stroke-width="3.2"/>`);
    cyto.push(`<path d="${sh.d}" fill="#5f9a5c"/>`);
    vacs.push(`<path d="${insetBlob(sh.pts, cx, cy, 0.72)}" fill="${SIM_PAL.parV}" opacity=".85"/>`);
    const na = 2.2 + k * 0.9, nx = cx + Math.cos(na) * 64, ny = cy + Math.sin(na) * 58;
    nucs.push(`<circle cx="${n2(nx)}" cy="${n2(ny)}" r="15" fill="url(#gNucl)" stroke="#d8d0ff" stroke-width="1.2"/>`);
    for (let j = 0; j < 7; j++) chls.push(`<ellipse class="chl" data-c="${k}" data-a="${n2(j / 7 * 6.283 + rr())}" cx="${cx}" cy="${cy}" rx="9" ry="5" fill="#2f8f3a" stroke="#b6f0a0" stroke-width="1"/>`);
  });
  /* المسافات البينية: فراغات مثلثية حيث تلتقي ثلاث خلايا */
  for (let i = 0; i < 6; i++){
    const a = i / 6 * 6.283 + 0.52 + 0.5236, gx = C0[0] + Math.cos(a) * D * 0.6, gy = C0[1] + Math.sin(a) * D * 0.55;
    gaps.push(`<path d="M${n2(gx)},${n2(gy - 13)} L${n2(gx + 12)},${n2(gy + 8)} L${n2(gx - 12)},${n2(gy + 8)}Z" fill="#0d1a14" stroke="#ffd98a" stroke-width="1.4"/>`);
  }
  const rays = [0, 1, 2, 3, 4].map(i => `<line class="ray" x1="${180 + i * 150}" y1="-10" x2="${150 + i * 150}" y2="70" stroke="#ffe9a0" stroke-width="3" stroke-linecap="round" opacity=".5"/>`).join('');
  const body = `<g>${rays}</g>
    <g>${cyto.join('')}</g>
    ${part('matVac', vacs.join(''))}
    ${part('nucleus', nucs.join(''))}
    ${part('parChl', `<g id="chls">${chls.join('')}</g>`)}
    ${part('interSp', gaps.join(''))}
    ${part('parWall', walls.join(''))}
    <text class="cap sm" x="500" y="610" text-anchor="middle">خلايا حية رقيقة الجدران، كروية أو مضلعة بسبب ضغط الخلايا المجاورة، فجواتها العصارية كبيرة وبينها مسافات بينية</text>`;
  const CH = cells.map(c => c);
  return {
    body, fnParts: ['parChl'],
    parts: [
      { id: 'parWall', anchor: shapes[1].pts[18], label: [866, 120], side: 'R' },
      { id: 'matVac', anchor: [C0[0] + 30, C0[1] - 10], label: [866, 300], side: 'R' },
      { id: 'interSp', anchor: [C0[0] + Math.cos(0.52 + 0.5236) * D * 0.6, C0[1] + Math.sin(0.52 + 0.5236) * D * 0.55], label: [866, 520], side: 'R' },
      { id: 'nucleus', anchor: [cells[3][0] + Math.cos(2.2 + 3 * 0.9) * 64, cells[3][1] + Math.sin(2.2 + 3 * 0.9) * 58], label: [134, 360], side: 'L' },
      { id: 'parChl', anchor: [cells[4][0] - 70, cells[4][1] + 10], label: [134, 200], side: 'L' }
    ],
    tools: [{ id: 'info:tParen', label: 'عن النسيج البرنكيمي' }, { id: 'tbl:simpleCmp', label: 'مقارنة أنواعه (ص10–11)' }],
    tick(dt, t, a){
      const slow = focusOwner === 'parChl' ? 1.8 : 1;
      a.all('#chls .chl').forEach(e => {
        const c = CH[+e.dataset.c], ang = +e.dataset.a + t * 0.45 * slow;
        const x = c[0] + Math.cos(ang) * 76, y = c[1] + Math.sin(ang) * 69;
        e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y));
        e.setAttribute('transform', `rotate(${n2(ang * 57.3 + 90)} ${n2(x)} ${n2(y)})`);
      });
      a.all('.ray').forEach((e, i) => e.setAttribute('opacity', n2(0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2 + i)))));
    }
  };
}

/* ───────── 3) النسيج الكولنكيمي (صورة الملزمة ص11): خلايا حية مدوّرة متطاولة،
   وجدرانها مغلظة بشكل غير منتظم فتظهر كتل داكنة حيث تلتقي الخلايا ───────── */
function simCol(){
  const X0 = 190, Y0 = 110, W = 430, H = 400, rr = rng(29), cells = [], nuc = [];
  /* شبكة متعرجة من خلايا بيضوية متقاربة؛ الخلفية الداكنة = الجدار المغلظ (يظهر سميكاً عند الزوايا) */
  const CW = 78, CH = 60;
  for (let j = -1; j * CH < H + CH; j++) for (let i = -1; i * CW < W + CW; i++){
    const x = X0 + i * CW + (j % 2 ? CW / 2 : 0) + (rr() - 0.5) * 12, y = Y0 + j * CH + (rr() - 0.5) * 10;
    const rx = CW / 2 - 1 + (rr() - 0.5) * 4, ry = CH / 2 + 1 + (rr() - 0.5) * 4, a = (rr() - 0.5) * 10;
    cells.push(`<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(rx)}" ry="${n2(ry)}" transform="rotate(${n2(a)} ${n2(x)} ${n2(y)})" fill="url(#gColCell)" stroke="#fff6e0" stroke-width="1"/>`);
    if (rr() < 0.55){ const q = rr() * 6.28; nuc.push(`<ellipse cx="${n2(x + Math.cos(q) * rx * 0.62)}" cy="${n2(y + Math.sin(q) * ry * 0.6)}" rx="7" ry="4" transform="rotate(${n2(q * 57)} ${n2(x + Math.cos(q) * rx * 0.62)} ${n2(y + Math.sin(q) * ry * 0.6)})" fill="#b8323a" opacity=".85"/>`); }
  }
  /* مقطع طولي: الخلايا متطاولة، والتغلظ عند زواياها (أشرطة داكنة على الحواف) */
  const LX = 690, LY = 130, LW = 44, LH = 116, longC = [];
  for (let i = 0; i < 4; i++) for (let j = -1; j < 3; j++){
    const x = LX + i * LW, y = LY + j * LH + (i % 2 ? LH / 2 : 0); if (y + LH < LY - 4 || y > LY + LH * 3) continue;
    longC.push(`<rect x="${x + 4}" y="${n2(y + 4)}" width="${LW - 8}" height="${LH - 8}" rx="14" fill="url(#gColCell)" stroke="#fff6e0" stroke-width=".8"/>`);
  }
  const body = `
    <defs><clipPath id="colClip"><rect x="${X0}" y="${Y0}" width="${W}" height="${H}" rx="22"/></clipPath>
      <clipPath id="colClipL"><rect x="${LX}" y="${LY}" width="${LW * 4}" height="${LH * 3}" rx="16"/></clipPath>
      <radialGradient id="gColCell" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fbf3dc"/><stop offset=".75" stop-color="#ecdcb0"/><stop offset="1" stop-color="#d9c48c"/></radialGradient></defs>
    <g clip-path="url(#colClip)">
      ${part('colCorner', `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" fill="#2e1a12"/>`)}
      ${part('colProto', cells.join('') + nuc.join(''))}
    </g>
    <rect x="${X0}" y="${Y0}" width="${W}" height="${H}" rx="22" fill="none" stroke="#f0e2c0" stroke-width="2"/>
    <g id="colBend">${part('tColl', `<g clip-path="url(#colClipL)"><rect x="${LX}" y="${LY}" width="${LW * 4}" height="${LH * 3}" fill="#2e1a12"/>${longC.join('')}</g>
      <rect x="${LX}" y="${LY}" width="${LW * 4}" height="${LH * 3}" rx="16" fill="none" stroke="#f0e2c0" stroke-width="2"/>`)}</g>
    <text class="cap sm" x="${X0 + W / 2}" y="${Y0 + H + 34}" text-anchor="middle">مقطع عرضي (كما في صورة الملزمة ص11)</text>
    <text class="cap sm" x="${LX + LW * 2}" y="${LY + LH * 3 + 34}" text-anchor="middle">مقطع طولي: خلايا متطاولة</text>
    <text class="cap" x="500" y="610" text-anchor="middle">النسيج الكولنكيمي: خلايا حية جدرانها مغلظة بشكل غير منتظم — الدعم والتقوية (إسناد مرن)</text>`;
  return {
    body, fnParts: ['tColl', 'colCorner'],
    parts: [
      { id: 'colCorner', anchor: [X0 + CW * 1.5, Y0 + CH * 0.5 + 4], label: [134, 200], side: 'L' },
      { id: 'colProto', anchor: [X0 + CW * 1.0, Y0 + CH * 4], label: [134, 400], side: 'L' },
      { id: 'tColl', anchor: [LX + LW * 4, LY + LH * 0.6], label: [866, 200], side: 'R' }
    ],
    tools: [{ id: 'info:tColl', label: 'عن النسيج الكولنكيمي' }, { id: 'tbl:simpleCmp', label: 'مقارنة أنواعه (ص10–11)' }],
    tick(dt, t, a){
      /* الإسناد المرن (ص13): المقطع الطولي ينحني ويرجع مثل ساق عشبية بالهواء */
      const k = Math.sin(t * 1.6) * (focusOwner === 'tColl' ? 9 : 6);
      const g = a.el('#colBend'); if (g) g.setAttribute('transform', `translate(${n2(LX + LW * 2)},${LY + LH * 3}) skewX(${n2(k)}) translate(${n2(-(LX + LW * 2))},${-(LY + LH * 3)})`);
    }
  };
}

/* ───────── 4) النسيج السكلرنكيمي: الألياف والخلايا الصخرية (الحجرية) — ص10 وص14 ───────── */
function simScl(){
  /* الألياف: مقطع طولي (خلايا مغزلية طويلة) */
  const FX = 230, FY = 160, fibers = [];
  for (let i = 0; i < 5; i++){
    const x = FX + i * 40, y0 = FY + (i % 2) * 30, y1 = y0 + 330;
    fibers.push(`<path d="M${x},${y0} Q${x + 22},${(y0 + y1) / 2} ${x},${y1} Q${x - 22},${(y0 + y1) / 2} ${x},${y0}Z" fill="${SIM_PAL.scl}" stroke="#ffe7b8" stroke-width="1.4"/>
      <path class="fLum" d="M${x},${y0 + 30} Q${x + 4},${(y0 + y1) / 2} ${x},${y1 - 30} Q${x - 4},${(y0 + y1) / 2} ${x},${y0 + 30}Z" fill="${SIM_PAL.sclD}"/>`);
  }
  /* الخلية الحجرية الكبيرة: جدار + طبقات + نقر + تجويف + بروتوبلاست */
  const SX = 650, SY = 300, SR = 130;
  const layers = [0, 1, 2, 3, 4, 5].map(i => `<circle class="sLay" data-i="${i}" cx="${SX}" cy="${SY}" r="${SR - 14 - i * 16}" fill="none" stroke="#e8c894" stroke-width="1.4" opacity=".75"/>`).join('');
  const pits = []; for (let i = 0; i < 10; i++){ const a = i / 10 * 6.283 + 0.2, a2 = a + 0.18;
    pits.push(`<path d="M${n2(SX + Math.cos(a) * 26)},${n2(SY + Math.sin(a) * 26)} L${n2(SX + Math.cos(a) * 80)},${n2(SY + Math.sin(a) * 80)} L${n2(SX + Math.cos(a2) * (SR - 6))},${n2(SY + Math.sin(a2) * (SR - 6))} M${n2(SX + Math.cos(a) * 80)},${n2(SY + Math.sin(a) * 80)} L${n2(SX + Math.cos(a - 0.2) * (SR - 6))},${n2(SY + Math.sin(a - 0.2) * (SR - 6))}" fill="none" stroke="${SIM_PAL.sclD}" stroke-width="3.2" stroke-linecap="round"/>`); }
  /* خلايا حجرية صغيرة مجاورة */
  const small = [[SX - 160, SY + 170, 52], [SX + 20, SY + 196, 46], [SX + 175, SY + 120, 50], [SX + 170, SY - 150, 44]].map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${SIM_PAL.scl}" stroke="#ffe7b8" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${r * 0.2}" fill="${SIM_PAL.sclD}"/>` +
    [0, 1, 2, 3, 4].map(i => { const a = i * 1.256; return `<line x1="${n2(x + Math.cos(a) * r * 0.2)}" y1="${n2(y + Math.sin(a) * r * 0.2)}" x2="${n2(x + Math.cos(a) * r * 0.92)}" y2="${n2(y + Math.sin(a) * r * 0.92)}" stroke="${SIM_PAL.sclD}" stroke-width="2.2"/>`; }).join('')).join('');
  const body = `
    ${part('sclFiber', fibers.join(''))}
    ${part('sclStone', small)}
    ${part('sclWall', `<circle cx="${SX}" cy="${SY}" r="${SR}" fill="${SIM_PAL.scl}" stroke="#ffe7b8" stroke-width="2.4"/>${layers}
       <g>${pits.join('')}</g><circle cx="${SX}" cy="${SY}" r="26" fill="${SIM_PAL.sclD}"/>`)}
    <text class="cap sm" x="${FX + 80}" y="${FY + 400}" text-anchor="middle">أ- ألياف: خلايا طويلة مدببة النهايات</text>
    <text class="cap sm" x="${SX}" y="${SY + SR + 36}" text-anchor="middle">ب- خلايا صخرية (حجرية): قصيرة، كما في ثمار الكمثرى</text>
    <text class="cap sm" x="500" y="640" text-anchor="middle">خلايا ميتة جدرانها مغلظة لاحتوائها على اللكنين (الخشبين) — وظيفتها الدعم والتقوية</text>`;
  return {
    body, fnParts: ['sclFiber', 'sclStone'],
    parts: [
      { id: 'sclFiber', anchor: [FX + 40, FY + 160], label: [134, 260], side: 'L' },
      { id: 'sclStone', anchor: [SX - 160, SY + 170], label: [134, 520], side: 'L' },
      { id: 'sclWall', anchor: [SX + SR * 0.7, SY - SR * 0.7], label: [866, 120], side: 'R' }
    ],
    tools: [{ id: 'info:tScler', label: 'عن النسيج السكلرنكيمي' }, { id: 'tbl:sclTypes', label: 'الألياف × الخلايا الصخرية (ص14)' }],
    tick(dt, t, a){
      /* الدعم والتقوية: النوعان يتوهجان بالتناوب */
      const cur = focusOwner || (Math.floor(t / 2.4) % 2 ? 'sclStone' : 'sclFiber');
      a.all('.part').forEach(p => { const on = p.dataset.part === cur;
        p.style.filter = on ? `drop-shadow(0 0 ${n2(4 + 4 * Math.sin(t * 4))}px #ffd166)` : ''; });
    }
  };
}

/* ───────── 5) قارن: الأنسجة البسيطة الثلاثة ───────── */
function simCmp(){
  const Y = 290, X = [230, 500, 770];
  const par = `<path d="${blobPath(X[0], Y, 105, 96, 0.05, 61, 22).d}" fill="#5f9a5c" stroke="#e6ffd8" stroke-width="3"/>
    <ellipse cx="${X[0] + 8}" cy="${Y + 4}" rx="74" ry="66" fill="${SIM_PAL.parV}" opacity=".85"/>
    <circle cx="${X[0] - 72}" cy="${Y - 28}" r="16" fill="url(#gNucl)"/>
    ${[0, 1, 2, 3, 4].map(i => { const a = i * 1.25; return `<ellipse cx="${n2(X[0] + Math.cos(a) * 86)}" cy="${n2(Y + Math.sin(a) * 78)}" rx="9" ry="5" fill="#2f8f3a" transform="rotate(${n2(a * 57.3 + 90)} ${n2(X[0] + Math.cos(a) * 86)} ${n2(Y + Math.sin(a) * 78)})"/>`; }).join('')}`;
  const hp = [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * 6.283; return [X[1] + Math.cos(a) * 100, Y + Math.sin(a) * 100]; });
  const col = `<path d="M${hp.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L')}Z" fill="${SIM_PAL.col}" stroke="${SIM_PAL.colC}" stroke-width="3"/>
    ${hp.map(p => `<circle class="dHi" cx="${n2(p[0])}" cy="${n2(p[1])}" r="17" fill="${SIM_PAL.colC}"/>`).join('')}
    <circle cx="${X[1]}" cy="${Y}" r="20" fill="url(#gNucl)"/>`;
  const scl = `<circle cx="${X[2]}" cy="${Y}" r="100" fill="${SIM_PAL.scl}" stroke="#ffe7b8" stroke-width="3"/>
    ${[0, 1, 2, 3].map(i => `<circle cx="${X[2]}" cy="${Y}" r="${86 - i * 15}" fill="none" stroke="#e8c894" stroke-width="1.3"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i * 0.9; return `<line x1="${n2(X[2] + Math.cos(a) * 22)}" y1="${n2(Y + Math.sin(a) * 22)}" x2="${n2(X[2] + Math.cos(a) * 94)}" y2="${n2(Y + Math.sin(a) * 94)}" stroke="${SIM_PAL.sclD}" stroke-width="3"/>`; }).join('')}
    <circle class="dHi" cx="${X[2]}" cy="${Y}" r="22" fill="${SIM_PAL.sclD}"/>`;
  const cap = (x, a, b) => `<text class="cap" x="${x}" y="${Y + 150}" text-anchor="middle">${a}</text><text class="cap sm" x="${x}" y="${Y + 178}" text-anchor="middle">${b}</text>`;
  const body = `${part('tParen', par)}${part('tColl', col)}${part('tScler', scl)}
    ${cap(X[0], 'البرنكيمي', 'حية · رقيقة الجدران · فجوات عصارية كبيرة')}
    ${cap(X[1], 'الكولنكيمي', 'حية · جدرانها مغلظة بشكل غير منتظم')}
    ${cap(X[2], 'السكلرنكيمي', 'ميتة · جدرانها مغلظة باللكنين (الخشبين)')}`;
  let opened = false;
  return {
    body, fnParts: ['tParen', 'tColl', 'tScler'],
    parts: [
      { id: 'tParen', anchor: [X[0] - 70, Y - 70], label: [134, 120], side: 'L' },
      { id: 'tColl', anchor: [X[1] + 40, Y - 87], label: [500, 100], side: 'C' },
      { id: 'tScler', anchor: [X[2] + 70, Y - 70], label: [866, 120], side: 'R' }
    ],
    tools: [{ id: 'tbl:simpleCmp', label: 'جدول الفروقات' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'simple' && SEL.simv === 'scmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.simpleCmp); }, 700); } },
    tick(dt, t, a){ a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(4 + 6 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 0.5)))}px #ffd166)`); }
  };
}
