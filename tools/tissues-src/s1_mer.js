
/* ══════════════════════════════════════════════════════════════════════════
   4.1 · الأنسجة المرستيمية: مواقعها في النبات، قمة الجذر (المراحل)،
         الخلية المرستيمية، والمقارنة مع الخلية البالغة
   ══════════════════════════════════════════════════════════════════════════ */
const MER_VIEWS = [
  { id: 'loc',  label: 'مواقع المرستيمات' },
  { id: 'root', label: 'قمة الجذر' },
  { id: 'cell', label: 'الخلية المرستيمية' },
  { id: 'cmp',  label: 'قارن' }
];
const MER_STAGES = [
  { n: 'الانقسام', d: 'خلايا المرستيم القمي (منطقة الانقسام) تنقسم انقساماً خيطياً مستمراً، والخلايا الجديدة تُدفع إلى الخلف، والقلنسوة تحمي القمة.',
    cam: { yaw: 0.25, pitch: 0.12, dist: 5.2, target: [0, -1.55, 0] } },
  { n: 'الاستطالة', d: 'الخلايا الجديدة تستطيل بامتصاص الماء وتكبر فجواتها، فتدفع قمة الجذر إلى الأمام داخل التربة.',
    cam: { yaw: 0.45, pitch: 0.1, dist: 5.6, target: [0, -0.15, 0] } },
  { n: 'النضج (التمايز)', d: 'الخلايا تتمايز إلى أنسجة مستديمة (البشرة والقشرة والأنسجة الوعائية)، وتظهر الشعيرات الجذرية على البشرة.',
    cam: { yaw: 0.7, pitch: 0.18, dist: 6.2, target: [0, 1.45, 0] } }
];
const MER_ZONES = { cap: [508, 560], div: [400, 508], elong: [250, 400], mat: [44, 250] };

/* خلية مرسومة كمستطيل مدوّر بنواة؛ k: نسبة الاستطالة */
function merCellSvg(x, y, w, h, o){
  o = o || {};
  const r = Math.min(w, h) * 0.22;
  const nr = o.nr === undefined ? Math.min(w, h) * 0.3 : o.nr;
  return `<g class="${o.cls || ''}"${o.attr || ''}>
    <rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(r)}" fill="${o.fill || '#5d8f63'}" stroke="${o.stroke || '#cfe8c8'}" stroke-width="${o.sw || 1.6}"/>
    ${o.vac ? `<rect x="${n2(x + w * 0.16)}" y="${n2(y + h * 0.12)}" width="${n2(w * 0.68)}" height="${n2(h * 0.76)}" rx="${n2(r * 0.8)}" fill="#a9d8e8" opacity="${o.vac}"/>` : ''}
    ${nr ? `<circle cx="${n2(o.nx === undefined ? x + w / 2 : o.nx)}" cy="${n2(o.ny === undefined ? y + h / 2 : o.ny)}" r="${n2(nr)}" fill="url(#gNucl)" opacity=".95"/>` : ''}
  </g>`;
}

SCENES.mer = {
  title: 'الأنسجة المرستيمية',
  get src(){ return SRC_WAIT; },
  tint: ['rgba(90,150,80,.28)', 'rgba(150,130,60,.16)'],
  model3d: () => 'mer_' + SEL.merv,
  build(){
    const v = SEL.merv || 'loc';
    const s = v === 'root' ? merRoot() : v === 'cell' ? merCell(false) : v === 'cmp' ? merCell(true) : merLoc();
    s.rebuildOnRadio = 'merv';
    s.tools = MER_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'merv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
/* نسخ مستقلة لكل رسم (للامتحان والرسم اليدوي) */
SCENES.mer_loc  = { title: 'مواقع المرستيمات', build: () => merLoc() };
SCENES.mer_root = { title: 'قمة الجذر', build: () => merRoot() };
SCENES.mer_cell = { title: 'الخلية المرستيمية', build: () => merCell(false) };

/* ───────── 1) مواقع المرستيمات في النبات ───────── */
function merLoc(){
  const rr = rng(31);
  /* نبات ذو فلقتين */
  const SX = 470, GY = 470, TOP = 118;
  const leaf = (x, y, ang, L, W) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(ang)})">
      <path d="M0,0 C${n2(L * 0.3)},${n2(-W)} ${n2(L * 0.8)},${n2(-W * 0.8)} ${n2(L)},0 C${n2(L * 0.8)},${n2(W * 0.8)} ${n2(L * 0.3)},${n2(W)} 0,0Z" fill="url(#gLeafM)" stroke="#bfe6a8" stroke-width="1.3"/>
      <path d="M2,0 L${n2(L * 0.92)},0" stroke="#d9f2c6" stroke-width="1.1" opacity=".7"/></g>`;
  const nodes = [392, 304, 214];
  let leaves = '', axil = '';
  nodes.forEach((y, i) => {
    const s = i % 2 ? 1 : -1;
    leaves += leaf(SX + s * 6, y, s > 0 ? -28 : 208, 118 - i * 18, 26 - i * 3) + leaf(SX - s * 6, y + 6, s > 0 ? 196 : -16, 96 - i * 14, 22 - i * 3);
    axil += `<path d="M${n2(SX + s * 9)},${n2(y - 2)} q${n2(s * 9)},-12 ${n2(s * 3)},-22 q${n2(-s * 7)},8 ${n2(-s * 3)},22z" fill="#9fd57e" stroke="#e9ffd8" stroke-width="1"/>`;
  });
  /* الجذور */
  const roots = [], tips = [];
  const rootPath = (pts, w) => roots.push(`<path d="${smoothOpen(pts)}" fill="none" stroke="#d8c39a" stroke-width="${w}" stroke-linecap="round"/>`);
  rootPath([[SX, GY], [SX + 3, 525], [SX - 2, 575], [SX + 1, 612]], 10); tips.push([SX + 1, 612, 90]);
  [[-1, 498, 70], [1, 516, 64], [-1, 545, 52], [1, 568, 44]].forEach(([s, y, L]) => {
    const e = [SX + s * L, y + 34];
    rootPath([[SX, y], [SX + s * L * 0.5, y + 10], e], 4.5); tips.push([e[0], e[1], s > 0 ? 40 : 140]);
  });
  const tipG = tips.map(([x, y, a]) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(a - 90)})">
      <ellipse class="mGlow" cx="0" cy="-2" rx="9" ry="11" fill="#ffd166" opacity=".5" filter="url(#fSoft)"/>
      <path d="M-5,-8 Q0,8 5,-8Z" fill="#c9a77a" stroke="#fff1cf" stroke-width="1"/></g>`).join('');
  /* البرعم الطرفي */
  const bud = `<g transform="translate(${SX},${TOP})">
      <ellipse class="mGlow" cx="0" cy="2" rx="20" ry="22" fill="#ffd166" opacity=".55" filter="url(#fSoft)"/>
      <path d="M0,-24 C12,-12 13,6 0,16 C-13,6 -12,-12 0,-24Z" fill="#a7dd84" stroke="#efffe0" stroke-width="1.4"/>
      <path d="M0,-24 C-16,-10 -14,8 -2,16" fill="none" stroke="#5f9a4a" stroke-width="1.6"/>
      <path d="M0,-24 C16,-10 14,8 2,16" fill="none" stroke="#5f9a4a" stroke-width="1.6"/></g>`;
  /* نبات عشبي (ذو فلقة واحدة): سلاميات وعقد */
  const GX = 214, gNodes = [404, 326, 248, 176], GTOP = 120;
  let grass = `<path d="M${GX - 7},${GY} L${GX - 6},${GTOP} L${GX + 6},${GTOP} L${GX + 7},${GY}Z" fill="url(#gStemG)" stroke="#d6efb8" stroke-width="1.3"/>`;
  let bands = '';
  gNodes.forEach((y, i) => {
    grass += `<rect x="${GX - 9}" y="${y - 4}" width="18" height="8" rx="3" fill="#7da55a" stroke="#e8f8d0" stroke-width="1"/>`;
    const s = i % 2 ? 1 : -1;
    grass += `<path d="M${GX + s * 6},${y - 2} C${GX + s * 40},${y - 70} ${GX + s * 70},${y - 120} ${GX + s * 96},${y - 130} C${GX + s * 62},${y - 104} ${GX + s * 34},${y - 60} ${GX + s * 8},${y + 8}Z" fill="url(#gLeafM)" stroke="#d6efb8" stroke-width="1"/>`;
    bands += `<rect class="mGlow" x="${GX - 11}" y="${y - 22}" width="22" height="16" rx="5" fill="#ffd166" opacity=".55" filter="url(#fSoft)"/>
      <rect x="${GX - 7}" y="${y - 19}" width="14" height="10" rx="3" fill="#f2c45a" opacity=".9"/>`;
  });
  /* مقطع عرضي في ساق خشبية (مكبّر) */
  const CX = 712, CY = 262, R = 104;
  const xyRays = []; for (let i = 0; i < 28; i++){ const a = i / 28 * 6.283; xyRays.push(`<line x1="${n2(CX + Math.cos(a) * 30)}" y1="${n2(CY + Math.sin(a) * 30)}" x2="${n2(CX + Math.cos(a) * 58)}" y2="${n2(CY + Math.sin(a) * 58)}" stroke="#8a6a3a" stroke-width="1" opacity=".55"/>`); }
  const inset = `
    <path d="M${SX + 9},344 L${CX - R * 0.8},${CY - R * 0.62} M${SX + 9},360 L${CX - R * 0.8},${CY + R * 0.62}" stroke="#e9d9b0" stroke-width="1.2" stroke-dasharray="4 5" opacity=".7"/>
    <rect x="${SX - 11}" y="340" width="22" height="24" rx="4" fill="none" stroke="#e9d9b0" stroke-width="1.4" stroke-dasharray="4 3"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="#6b4a2c" stroke="#e0c08a" stroke-width="2"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 9}" fill="#5e8d4f"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 30}" fill="#9fc46d"/>
    <circle cx="${CX}" cy="${CY}" r="58" fill="#d8b878"/>
    ${xyRays.join('')}
    <circle cx="${CX}" cy="${CY}" r="30" fill="#b9d6a0"/>
    <text class="cap sm" x="${CX}" y="${CY + R + 28}" text-anchor="middle">مقطع عرضي في ساق خشبية (مكبّر)</text>`;
  const corkRing = `<circle class="mGlow" cx="${CX}" cy="${CY}" r="${R - 6}" fill="none" stroke="#ffb35c" stroke-width="9" opacity=".45" filter="url(#fSoft)"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 6}" fill="none" stroke="#ffbf6e" stroke-width="3.2" stroke-dasharray="7 4"/>`;
  const vascRing = `<circle class="mGlow" cx="${CX}" cy="${CY}" r="62" fill="none" stroke="#ffd166" stroke-width="10" opacity=".5" filter="url(#fSoft)"/>
    <circle cx="${CX}" cy="${CY}" r="62" fill="none" stroke="#ffd98a" stroke-width="3.6"/>`;
  /* أسهم اتجاه النمو */
  /* السهم يتحرك باتجاهه (الحركة على مجموعة داخلية حتى لا تُلغى إزاحته) */
  const arrow = (x, y, ang, cls) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(ang)})"><g class="gArr ${cls || ''}">
      <path d="M0,10 L0,-10 M-6,-3 L0,-10 L6,-3" fill="none" stroke="#ffe08a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
  const arrows = arrow(SX, TOP - 44, 0, 'up') + arrow(SX + 1, 642, 180, 'dn') +
    gNodes.map(y => arrow(GX + 26, y - 14, 0, 'up')).join('') +
    [0, 1, 2, 3].map(i => { const a = i * 1.5708 + 0.785; return arrow(CX + Math.cos(a) * (R + 16), CY + Math.sin(a) * (R + 16), a * 57.3 + 90, 'out'); }).join('');

  const soilDots = []; for (let i = 0; i < 70; i++) soilDots.push(`<circle cx="${n2(60 + rr() * 880)}" cy="${n2(GY + 10 + rr() * 220)}" r="${n2(1 + rr() * 2.4)}" fill="#8a6a44" opacity="${n2(0.25 + rr() * 0.35)}"/>`);
  const body = `
    <defs>
      <linearGradient id="gLeafM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fc46a"/><stop offset="1" stop-color="#3f7f3d"/></linearGradient>
      <linearGradient id="gStemG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ccb6c"/><stop offset=".5" stop-color="#c3e48e"/><stop offset="1" stop-color="#7fae55"/></linearGradient>
      <linearGradient id="gStemD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f9a4c"/><stop offset=".5" stop-color="#9fcf72"/><stop offset="1" stop-color="#5d8a40"/></linearGradient>
      <linearGradient id="gSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3523" stop-opacity=".9"/><stop offset="1" stop-color="#2a1d13" stop-opacity=".6"/></linearGradient>
    </defs>
    <rect x="-140" y="${GY}" width="1280" height="260" fill="url(#gSoil)"/>
    <line x1="-140" y1="${GY}" x2="1140" y2="${GY}" stroke="#a88a5c" stroke-width="2"/>
    <g>${soilDots.join('')}</g>
    <g>${roots.join('')}</g>
    ${part('apicalRoot', tipG)}
    ${grass}
    ${part('intercal', bands)}
    <path d="M${SX - 8},${GY} C${SX - 6},380 ${SX - 5},230 ${SX - 4},${TOP + 10} L${SX + 4},${TOP + 10} C${SX + 5},230 ${SX + 6},380 ${SX + 8},${GY}Z" fill="url(#gStemD)" stroke="#d6efb8" stroke-width="1.3"/>
    ${leaves}
    ${part('apicalShoot', bud + `<g class="mGlowAx">${axil}</g>`)}
    ${inset}
    ${part('corkCamb', corkRing)}
    ${part('vascCamb', vascRing)}
    <g id="growArr">${arrows}</g>
    <text class="cap sm" x="${GX}" y="${GY + 34}" text-anchor="middle">نبات عشبي (فلقة واحدة)</text>
    <text class="cap sm" x="${SX + 120}" y="${GY + 34}" text-anchor="middle">نبات ذو فلقتين</text>`;
  return {
    body,
    fnParts: ['apicalShoot', 'apicalRoot', 'vascCamb', 'corkCamb', 'intercal'],
    parts: [
      { id: 'apicalShoot', anchor: [SX, TOP - 6], label: [866, 92], side: 'R' },
      { id: 'corkCamb', anchor: [CX + (R - 6) * 0.71, CY - (R - 6) * 0.71], label: [866, 170], side: 'R' },
      { id: 'vascCamb', anchor: [CX + 62, CY + 6], label: [866, 300], side: 'R' },
      { id: 'apicalRoot', anchor: [SX + 1, 612], label: [866, 590], side: 'R' },
      { id: 'intercal', anchor: [GX - 8, 248 - 14], label: [134, 230], side: 'L' }
    ],
    tools: [{ id: 'tbl:merTypes', label: 'أنواع المرستيمات' }, { id: 'tbl:merOrigin', label: 'منشأ الأنسجة' }],
    tick(dt, t, a){
      const f = focusOwner;
      a.all('.part').forEach(p => {
        const on = !f || p.dataset.part === f;
        p.querySelectorAll('.mGlow').forEach(e => e.setAttribute('opacity', on ? n2(0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.6))) : '0.12'));
      });
      const b = Math.sin(t * 3) * 4;
      a.all('#growArr .gArr').forEach(e => e.setAttribute('transform', `translate(0,${n2(-Math.abs(b))})`));
    }
  };
}

/* ───────── 2) مقطع طولي في قمة الجذر (مع المراحل) ───────── */
function merRoot(){
  const X0 = 412, X1 = 588, W = X1 - X0, Z = MER_ZONES, rr = rng(5);
  const cells = { div: [], elong: [], mat: [], cap: [] };
  /* أعمدة الخلايا: بشرة أولية (طرفان)، مرستيم أساسي، كامبيوم أولي (الوسط) */
  const cols = 9, cw = W / cols;
  const colKind = c => c === 0 || c === cols - 1 ? 'pd' : c >= 3 && c <= 5 ? 'pc' : 'gm';
  const FILL = { pd: '#7fb36a', gm: '#5d8f63', pc: '#8a7fc2' };
  /* منطقة الانقسام: خلايا صغيرة مربعة */
  for (let y = Z.div[0]; y < Z.div[1] - 2; y += cw){
    for (let c = 0; c < cols; c++){
      const k = colKind(c), h = Math.min(cw, Z.div[1] - y);
      cells.div.push(merCellSvg(X0 + c * cw + 1, y + 1, cw - 2, h - 2, { fill: FILL[k], nr: cw * 0.3, cls: 'dc dc' + k, attr: ` data-i="${cells.div.length}"` }));
    }
  }
  /* منطقة الاستطالة: الخلايا تطول تدريجياً */
  let y = Z.elong[1], hh = cw * 1.25;
  const elongRows = [];
  while (y - hh > Z.elong[0]){
    const row = [];
    for (let c = 0; c < cols; c++){
      const k = colKind(c);
      row.push(merCellSvg(X0 + c * cw + 1, y - hh + 1, cw - 2, hh - 2, { fill: FILL[k], nr: cw * 0.24, vac: Math.min(0.6, (Z.elong[1] - y) / 260 + 0.1), ny: y - hh * 0.3 }));
    }
    elongRows.push(`<g class="eRow">${row.join('')}</g>`);
    y -= hh; hh *= 1.16;
  }
  /* منطقة النضج: بشرة، قشرة، أسطوانة وعائية فيها خشب */
  const mat = [];
  for (let yy = Z.mat[0]; yy < Z.mat[1] - 20; yy += 42){
    for (let c = 0; c < cols; c++){
      const k = colKind(c);
      mat.push(merCellSvg(X0 + c * cw + 1, yy + 1, cw - 2, Math.min(40, Z.mat[1] - yy - 2), { fill: k === 'pc' ? '#7f75b5' : k === 'pd' ? '#86b870' : '#557f58', nr: k === 'pc' ? 0 : cw * 0.18, vac: k === 'pc' ? 0 : 0.55, nx: X0 + c * cw + cw * 0.28, ny: yy + 10 }));
    }
  }
  const xylem = [0, 1].map(i => { const x = X0 + (3.7 + i * 1.6) * cw; let d = `M${n2(x)},${Z.mat[0] + 4}`;
    for (let yy = Z.mat[0] + 4; yy < Z.mat[1] - 4; yy += 8) d += ` Q${n2(x + (((yy / 8) | 0) % 2 ? 6 : -6))},${n2(yy + 4)} ${n2(x)},${n2(yy + 8)}`;
    return `<path class="xyl" d="${d}" fill="none" stroke="#e8d79a" stroke-width="2.2"/>`; }).join('');
  /* الشعيرات الجذرية */
  const hairs = [];
  for (let yy = Z.mat[0] + 14; yy < Z.mat[1] - 10; yy += 22){
    const L = 36 + (Z.mat[1] - yy) * 0.4 + rr() * 14;
    [[X0, -1], [X1, 1]].forEach(([x, s]) => hairs.push(`<path class="hair" data-l="${n2(L)}" d="M${x},${n2(yy)} q${n2(s * L * 0.5)},${n2(-6 + rr() * 12)} ${n2(s * L)},${n2(-4 + rr() * 8)}" fill="none" stroke="#e6f2c6" stroke-width="2.4" stroke-linecap="round"/>`));
  }
  /* القلنسوة: كشتبان من الخلايا */
  const capCells = [];
  for (let r = 0; r < 4; r++){
    const n = 7 - r, yy = Z.cap[0] + r * 16;
    const half = (W / 2 + 10) * Math.sqrt(1 - Math.pow((r + 0.5) / 4.6, 2));
    for (let i = 0; i < n; i++){
      const x = 500 - half + (2 * half) * (i + 0.5) / n;
      capCells.push(`<ellipse cx="${n2(x)}" cy="${n2(yy + 8)}" rx="${n2(half / n + 2)}" ry="9" fill="#c9a77a" stroke="#fff1cf" stroke-width="1.2"/>`);
    }
  }
  const capOuter = `<path d="M${X0 - 12},${Z.cap[0] - 4} Q${X0 - 12},${Z.cap[1] + 18} 500,${Z.cap[1] + 8} Q${X1 + 12},${Z.cap[1] + 18} ${X1 + 12},${Z.cap[0] - 4}" fill="none" stroke="#fff1cf" stroke-width="2.2" opacity=".85"/>`;
  const slough = [0, 1, 2].map(i => `<ellipse class="slough" data-i="${i}" cx="500" cy="${Z.cap[1] + 14}" rx="9" ry="6" fill="#c9a77a" stroke="#fff1cf" stroke-width="1" opacity="0"/>`).join('');
  /* تظليل المنطقة الحالية */
  const zoneHi = ['div', 'elong', 'mat'].map((z, i) => `<rect class="zHi" data-z="${i}" x="${X0 - 26}" y="${Z[z][0]}" width="${W + 52}" height="${Z[z][1] - Z[z][0]}" rx="14" fill="#ffd166" opacity="0"/>`).join('');
  const brace = (y0, y1) => `<path d="M${X1 + 30},${y0 + 3} q8,0 8,8 L${X1 + 38},${(y0 + y1) / 2 - 6} q0,6 6,6 q-6,0 -6,6 L${X1 + 38},${y1 - 11} q0,8 -8,8" fill="none" stroke="#e9d9b0" stroke-width="1.6" opacity=".75"/>`;
  const body = `
    <g id="zoneHi">${zoneHi}</g>
    <g id="hairs">${hairs.join('')}</g>
    ${part('zoneMat', `<g>${mat.join('')}</g>${xylem}`)}
    ${part('zoneElong', `<g id="eRows">${elongRows.join('')}</g>`)}
    ${part('zoneDiv', `<g id="dCells">${cells.div.join('')}</g>`)}
    ${part('rootCap', capCells.join('') + capOuter)}
    ${slough}
    ${part('rootHair', `<rect x="${X0 - 70}" y="${Z.mat[0] + 30}" width="58" height="200" fill="rgba(0,0,0,0)"/><rect x="${X1 + 12}" y="${Z.mat[0] + 30}" width="58" height="200" fill="rgba(0,0,0,0)"/>`)}
    ${part('protoderm', `<rect x="${X0}" y="${Z.div[0]}" width="${cw}" height="${Z.div[1] - Z.div[0]}" fill="rgba(0,0,0,0)" stroke="#bff0a0" stroke-width="2" stroke-dasharray="5 4" rx="6"/>`)}
    ${part('groundMer', `<rect x="${X0 + cw}" y="${Z.div[0]}" width="${cw * 2}" height="${Z.div[1] - Z.div[0]}" fill="rgba(0,0,0,0)" stroke="#9fd0a2" stroke-width="2" stroke-dasharray="5 4" rx="6"/>`)}
    ${part('procamb', `<rect x="${X0 + cw * 3}" y="${Z.div[0]}" width="${cw * 3}" height="${Z.div[1] - Z.div[0]}" fill="rgba(0,0,0,0)" stroke="#c8bfff" stroke-width="2" stroke-dasharray="5 4" rx="6"/>`)}
    ${brace(Z.mat[0], Z.mat[1])}${brace(Z.elong[0], Z.elong[1])}${brace(Z.div[0], Z.div[1])}
    <g id="newCell" opacity="0"><path d="M${X1 + 64},${Z.div[0] + 60} L${X1 + 64},${Z.elong[1] - 50}" stroke="#ffe08a" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${X1 + 58},${Z.elong[1] - 42} L${X1 + 64},${Z.elong[1] - 52} L${X1 + 70},${Z.elong[1] - 42}" fill="none" stroke="#ffe08a" stroke-width="2.6" stroke-linecap="round"/></g>
    <text class="cap sm" x="500" y="${Z.cap[1] + 58}" text-anchor="middle">مقطع طولي في قمة الجذر</text>`;
  const ctl = stageCtl(MER_STAGES, { label: 'المرحلة' });
  let flashT = 0, flashI = -1;
  return {
    body, stages: MER_STAGES,
    fnParts: ['rootCap', 'zoneDiv', 'zoneElong', 'zoneMat', 'rootHair'],
    parts: [
      { id: 'rootHair', anchor: [X1 + 44, Z.mat[0] + 50], label: [866, 66], side: 'R' },
      { id: 'zoneMat', anchor: [X1 + 44, (Z.mat[0] + Z.mat[1]) / 2], label: [866, 150], side: 'R' },
      { id: 'zoneElong', anchor: [X1 + 44, (Z.elong[0] + Z.elong[1]) / 2], label: [866, 325], side: 'R' },
      { id: 'zoneDiv', anchor: [X1 + 44, (Z.div[0] + Z.div[1]) / 2], label: [866, 450], side: 'R' },
      { id: 'rootCap', anchor: [X1 - 6, Z.cap[1] - 10], label: [866, 560], side: 'R' },
      { id: 'protoderm', anchor: [X0 + cw / 2, Z.div[0] + 26], label: [134, 400], side: 'L' },
      { id: 'groundMer', anchor: [X0 + cw * 2, Z.div[0] + 54], label: [134, 465], side: 'L' },
      { id: 'procamb', anchor: [X0 + cw * 4.5, Z.div[1] - 24], label: [134, 530], side: 'L' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:rootZones', label: 'مناطق قمة الجذر' }, { id: 'tbl:merOrigin', label: 'منشأ الأنسجة' }]),
    init(){ ctl.start(); },
    onSlider: v => ctl.onSlider(v),
    onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const st = STG.idx, k = STG.k;
      a.all('.zHi').forEach(e => e.setAttribute('opacity', +e.dataset.z === st ? n2(0.08 + 0.06 * Math.sin(t * 3)) : '0'));
      /* المرحلة 1: خلايا تنقسم (تومض ويظهر جدار جديد) */
      const dcs = a.all('#dCells .dc');
      flashT -= dt;
      if (st === 0 && flashT <= 0 && dcs.length){
        if (flashI >= 0 && dcs[flashI]) dcs[flashI].classList.remove('flash');
        flashI = Math.floor(Math.random() * dcs.length); flashT = 0.45;
        dcs[flashI].classList.add('flash');
      }
      if (st !== 0 && flashI >= 0 && dcs[flashI]){ dcs[flashI].classList.remove('flash'); flashI = -1; }
      const nc = a.el('#newCell'); if (nc) nc.setAttribute('opacity', st === 0 ? n2(0.45 + 0.45 * Math.sin(t * 4)) : '0');
      /* المرحلة 2: صفوف الاستطالة تتنفس طولياً */
      const sY = st === 1 ? 1 + 0.06 * Math.sin(t * 2.4) : 1;
      const er = a.el('#eRows'); if (er) er.setAttribute('transform', `translate(0,${n2(MER_ZONES.elong[1] * (1 - sY))}) scale(1,${n2(sY)})`);
      /* المرحلة 3: الشعيرات تنمو */
      const hk = st === 2 ? Math.min(1, k * 1.6) : st === 1 ? 0.15 : 0.35;
      a.all('#hairs .hair').forEach(h => { const L = +h.dataset.l; h.style.strokeDasharray = `${n2(L * 1.1)} 400`; h.style.strokeDashoffset = n2(L * 1.1 * (1 - hk)); });
      /* القلنسوة: خلايا خارجية تتآكل وتسقط */
      a.all('.slough').forEach(e => { const p = ((t * 0.35 + +e.dataset.i / 3) % 1);
        e.setAttribute('opacity', n2(Math.sin(p * Math.PI) * 0.8)); e.setAttribute('cy', n2(MER_ZONES.cap[1] + 8 + p * 40)); e.setAttribute('cx', n2(500 + (+e.dataset.i - 1) * 36 * p)); });
    }
  };
}

/* ───────── 3) الخلية المرستيمية، والمقارنة مع الخلية البالغة ───────── */
function merCell(cmp){
  const rr = rng(17);
  const cytoDots = (x, y, w, h, n) => { const o = []; for (let i = 0; i < n; i++) o.push(`<circle cx="${n2(x + rr() * w)}" cy="${n2(y + rr() * h)}" r="${n2(1.2 + rr() * 1.8)}" fill="#d9f0d0" opacity="${n2(0.25 + rr() * 0.35)}"/>`); return o.join(''); };
  /* خلية مرستيمية: (cx, cy) المركز، s الحجم */
  const merFig = (cx, cy, s, lbl, nbK) => {
    const x = cx - s / 2, y = cy - s / 2, nr = s * 0.25;
    let nb = '';
    /* خلايا مجاورة متراصّة بلا مسافات بينية */
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++){
      if (!i && !j) continue;
      if (nbK === 2 && i > 0) continue;   /* المقارنة: لا تتداخل مع الخلية البالغة */
      nb += `<rect x="${n2(x + i * s + 2)}" y="${n2(y + j * s + 2)}" width="${n2(s - 4)}" height="${n2(s - 4)}" rx="${n2(s * 0.12)}" fill="#3f6b48" stroke="#9fd0a2" stroke-width="1.2" opacity=".42"/>
        <circle cx="${n2(cx + i * s)}" cy="${n2(cy + j * s)}" r="${n2(nr * 0.95)}" fill="#6a5bb0" opacity=".35"/>`;
    }
    const vacs = [[0.24, 0.22], [0.78, 0.3], [0.7, 0.8], [0.22, 0.74]].map(([u, v]) => `<circle cx="${n2(x + u * s)}" cy="${n2(y + v * s)}" r="${n2(s * 0.035)}" fill="#bfe6f3" stroke="#eaf8ff" stroke-width="1"/>`).join('');
    return `
      <g opacity=".95">${nb}</g>
      ${part('merCyto', `<rect x="${n2(x + 3)}" y="${n2(y + 3)}" width="${n2(s - 6)}" height="${n2(s - 6)}" rx="${n2(s * 0.12)}" fill="url(#gMerCyto)"/>${cytoDots(x + 8, y + 8, s - 16, s - 16, Math.round(s / 3))}`)}
      ${part('merVac', `<g class="dHi">${vacs}</g>`)}
      ${part('merNuc', `<g id="merNucG${lbl}"><circle class="nA" cx="${cx}" cy="${cy}" r="${n2(nr)}" fill="url(#gNucl)" stroke="#d8d0ff" stroke-width="1.6"/>
        <circle class="nB" cx="${cx}" cy="${cy}" r="${n2(nr)}" fill="url(#gNucl)" stroke="#d8d0ff" stroke-width="1.6" opacity="0"/>
        <circle class="nu" cx="${n2(cx + nr * 0.25)}" cy="${n2(cy - nr * 0.2)}" r="${n2(nr * 0.3)}" fill="url(#gNucleolus)"/></g>`)}
      <line class="newWall" x1="${n2(x + 6)}" y1="${cy}" x2="${n2(x + s - 6)}" y2="${cy}" stroke="#d6f5c4" stroke-width="3" opacity="0"/>
      ${part('merWall', `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(s)}" height="${n2(s)}" rx="${n2(s * 0.12)}" fill="none" stroke="#d6f5c4" stroke-width="3"/>`)}`;
  };
  const defs = `<defs><radialGradient id="gMerCyto" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#5f9a62"/><stop offset="1" stop-color="#355f3c"/></radialGradient>
    <radialGradient id="gVacM" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d9f3fb" stop-opacity=".9"/><stop offset="1" stop-color="#8cc7dc" stop-opacity=".75"/></radialGradient></defs>`;
  if (!cmp){
    const body = defs + merFig(500, 300, 260, 'a', 1) +
      `<text class="cap sm" x="500" y="510" text-anchor="middle">خلية مرستيمية: صغيرة، رقيقة الجدار، كثيفة السايتوبلازم، كبيرة النواة، بلا مسافات بينية</text>`;
    let cyc = 0;
    return {
      body, fnParts: ['merNuc', 'merWall'],
      parts: [
        { id: 'merWall', anchor: [630, 200], label: [866, 140], side: 'R' },
        { id: 'merNuc', anchor: [565, 300], label: [866, 300], side: 'R' },
        { id: 'merCyto', anchor: [400, 390], label: [134, 430], side: 'L' },
        { id: 'merVac', anchor: [n2(370 + 0.24 * 260), n2(170 + 0.22 * 260)], label: [134, 190], side: 'L' }
      ],
      tools: [{ id: 'tbl:merVsMat', label: 'مقارنة مع الخلية البالغة' }],
      tick(dt, t, a){ cyc = (t % 9) / 9; merDivide(a, 'a', 500, 300, 65, cyc); }
    };
  }
  /* المقارنة: يسار مرستيمية، يمين بالغة ذات فجوة كبيرة ومسافات بينية */
  const MX = 300, MY = 300, MS = 170, BX = 690, BY = 300, BW = 280, BH = 330;
  const bx = BX - BW / 2, by = BY - BH / 2;
  let nb = '', gaps = '';
  [[1, 0], [0, -1], [0, 1]].forEach(([i, j]) => {
    nb += `<rect x="${n2(bx + i * (BW + 14) + 2)}" y="${n2(by + j * (BH + 14) + 2)}" width="${BW - 4}" height="${BH - 4}" rx="34" fill="#3f6b48" stroke="#9fd0a2" stroke-width="1.2" opacity=".32"/>`;
  });
  [[bx - 7, by - 7], [bx + BW + 7, by - 7], [bx - 7, by + BH + 7], [bx + BW + 7, by + BH + 7]].forEach(([x, y]) =>
    gaps += `<path class="dHi" d="M${n2(x - 13)},${n2(y)} L${n2(x)},${n2(y - 13)} L${n2(x + 13)},${n2(y)} L${n2(x)},${n2(y + 13)}Z" fill="#0d1a14" stroke="#ffd98a" stroke-width="1.6"/>`);
  const body = defs + merFig(MX, MY, MS, 'b', 2) + `
    <g opacity=".9">${nb}</g>
    ${part('interSp', gaps)}
    <rect x="${bx + 3}" y="${by + 3}" width="${BW - 6}" height="${BH - 6}" rx="34" fill="#4d7f52"/>
    ${part('matVac', `<rect class="dHi" x="${bx + 22}" y="${by + 22}" width="${BW - 44}" height="${BH - 44}" rx="28" fill="url(#gVacM)" stroke="#eaf8ff" stroke-width="1.6"/>`)}
    <circle cx="${bx + 38}" cy="${by + 70}" r="22" fill="url(#gNucl)" stroke="#d8d0ff" stroke-width="1.4"/>
    <rect x="${bx}" y="${by}" width="${BW}" height="${BH}" rx="34" fill="none" stroke="#d6f5c4" stroke-width="3"/>
    <text class="cap sm" x="${MX}" y="${by + BH + 44}" text-anchor="middle">الخلية المرستيمية</text>
    <text class="cap sm" x="${BX}" y="${by + BH + 44}" text-anchor="middle">الخلية البالغة (المستديمة)</text>`;
  let opened = false;
  return {
    body, fnParts: ['merNuc', 'matVac'],
    parts: [
      { id: 'merWall', anchor: [MX - MS / 2, MY - 40], label: [134, 150], side: 'L' },
      { id: 'merNuc', anchor: [MX - MS * 0.25, MY], label: [134, 260], side: 'L' },
      { id: 'merCyto', anchor: [MX - MS * 0.3, MY + MS * 0.32], label: [134, 400], side: 'L' },
      { id: 'merVac', anchor: [MX - MS / 2 + 0.22 * MS, MY - MS / 2 + 0.74 * MS], label: [134, 520], side: 'L' },
      { id: 'matVac', anchor: [BX + BW / 2 - 40, BY - 40], label: [866, 260], side: 'R' },
      { id: 'interSp', anchor: [bx + BW + 7, by + BH + 7], label: [866, 560], side: 'R' }
    ],
    tools: [{ id: 'tbl:merVsMat', label: 'جدول الفروقات' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'mer' && SEL.merv === 'cmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.merVsMat); }, 700); } },
    tick(dt, t, a){
      /* تلوين الفروقات: الفجوات والمسافات البينية تومض بالتناوب */
      a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(4 + 6 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 0.6)))}px #ffd166)`);
      merDivide(a, 'b', MX, MY, MS * 0.25, (t % 9) / 9);
    }
  };
}
/* حركة الانقسام في الخلية المرستيمية: النواة تستطيل وتنقسم ثم يظهر جدار جديد */
function merDivide(a, tag, cx, cy, nr, c){
  const g = a.el('#merNucG' + tag); if (!g) return;
  const A = g.querySelector('.nA'), B = g.querySelector('.nB'), nu = g.querySelector('.nu');
  const w = g.parentNode.parentNode.querySelector('.newWall');
  const sp = c < 0.45 ? 0 : c < 0.75 ? (c - 0.45) / 0.3 : c < 0.92 ? 1 : 1 - (c - 0.92) / 0.08;
  const off = nr * 0.75 * sp, rr = nr * (1 - 0.3 * sp);
  A.setAttribute('cy', n2(cy - off)); A.setAttribute('r', n2(rr));
  B.setAttribute('cy', n2(cy + off)); B.setAttribute('r', n2(rr)); B.setAttribute('opacity', sp > 0.02 ? '1' : '0');
  nu.setAttribute('opacity', n2(1 - Math.min(1, sp * 2)));
  if (w) w.setAttribute('opacity', c > 0.72 && c < 0.96 ? n2(Math.min(1, (c - 0.72) / 0.08)) : '0');
}
