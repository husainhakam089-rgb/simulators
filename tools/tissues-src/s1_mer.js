/* ══════════════════════════════════════════════════════════════════════════
   4.1 · النسيج المرستيمي (الإنشائي) — ملزمة ص3–7 وص22: أنواعه حسب الموقع
         (القمي، البيني، الجانبي)، والنمو الثانوي بالمرستيمي الجانبي (مراحل)
   ══════════════════════════════════════════════════════════════════════════ */
const MER_VIEWS = [
  { id: 'loc', label: 'أنواع النسيج المرستيمي' },
  { id: 'sec', label: 'المرستيمي الجانبي (التثخن)' }
];
const MER_SEC_STAGES = [
  { n: 'النسيج المرستيمي الجانبي', d: 'يقع في أجزاء النبات البعيدة عن القمم النامية، أي على الجانب بموازاة السطح الخارجي للنبات، وهو على نوعين: الكمبيوم الوعائي والكمبيوم الفليني.',
    cam: { yaw: 0.15, pitch: 0.8, dist: 6.4, target: [0, 0, 0] } },
  { n: 'الكمبيوم الوعائي', d: 'يكوّن نسيجي الخشب واللحاء الثانويين.',
    cam: { yaw: 0.3, pitch: 0.8, dist: 7.0, target: [0.3, 0, 0] } },
  { n: 'الكمبيوم الفليني', d: 'يكوّن نسيج البشرة المحيطة.',
    cam: { yaw: 0.45, pitch: 0.75, dist: 7.6, target: [0.6, 0, 0] } },
  { n: 'النمو الثانوي (التثخن)', d: 'النسيج المرستيمي الجانبي مسؤول عن النمو الثانوي والتثخن في النبات.',
    cam: { yaw: 0.2, pitch: 0.8, dist: 9.0, target: [0, 0, 0] } }
];
/* مقدار التثخن عند كل نقطة من المراحل: g للكمبيوم الوعائي، pe للبشرة المحيطة */
function merSecGrowth(){
  const st = STG.idx, k = STG.k;
  const g = st === 0 ? 0 : st === 1 ? 0.65 * k : st === 2 ? 0.65 + 0.1 * k : 0.75 + 0.25 * k;
  const pe = st < 2 ? 0 : st === 2 ? k : 1;
  return { g, pe };
}
/* أنصاف أقطار الحلقات بدلالة التثخن (يشترك بها المسطّح والمجسّم) */
function merSecRings(g, pe){
  const pith = 34, rx = 66 + 64 * g, rc = rx + 5, rp = rc + 5 + 17 + 12 * g, rk = rp + 28 + 4 * g, re = rk + 4 + 18 * pe;
  return { pith, rx, rc, rp, rk, re, R: re + 3 };
}

SCENES.mer = {
  title: 'النسيج المرستيمي (الإنشائي)',
  get src(){ return SEL.merv === 'sec' ? 'ملزمة ص6 وص22' : 'ملزمة ص3–7'; },
  tint: ['rgba(90,150,80,.28)', 'rgba(150,130,60,.16)'],
  model3d: () => 'mer_' + SEL.merv,
  build(){
    const v = SEL.merv === 'sec' ? 'sec' : 'loc';
    const s = v === 'sec' ? merSec() : merLoc();
    s.rebuildOnRadio = 'merv';
    s.tools = MER_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'merv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
/* نسخ مستقلة لكل رسم (للامتحان) */
SCENES.mer_loc = { title: 'أنواع النسيج المرستيمي ومواقعها', build: () => merLoc() };
SCENES.mer_sec = { title: 'النسيج المرستيمي الجانبي (التثخن)', build: () => merSec(true) };

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
    tools: [{ id: 'tbl:merTypes', label: 'أنواعه حسب الموقع (ص6)' }, { id: 'tbl:plantTissues', label: 'أنسجة النبات (ص5)' }],
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


/* ───────── 2) المرستيمي الجانبي: الكمبيوم الوعائي والفليني والتثخن (مراحل) ───────── */
function merSec(still){
  /* المقطع مكبّر (S) حتى تظهر الحلقات وخلاياها بوضوح؛ أنصاف الأقطار من merSecRings */
  const CX = 430, CY = 352, S = 1.25, r0 = still ? merSecRings(1, 1) : merSecRings(0, 0);
  const sc = p => [CX + (p[0] - CX) * S, CY + (p[1] - CY) * S];
  const ring = (cls, rad, fill, extra) => `<circle class="${cls}" cx="${CX}" cy="${CY}" r="${n2(rad)}" fill="${fill}"${extra || ''}/>`;
  const circ = (rad, st) => `<circle cx="${CX}" cy="${CY}" r="${n2(rad)}" fill="none" ${st}/>`;
  /* خلايا كل نسيج: حلقات رفيعة + جدران قصيرة (خطوط متقطعة) = شبكة خلايا */
  const cells = (a, b, step, col, wall) => { let h = ''; for (let q = a + step; q < b - 1; q += step) h += circ(q, `stroke="${col}" stroke-width=".7" opacity=".8"`);
    for (let q = a + step / 2; q < b; q += step) h += circ(q, `stroke="${col}" stroke-width="${n2(step * 0.9)}" stroke-dasharray=".8 ${wall}" opacity=".7"`); return h; };
  const tex = r => {
    let h = cells(0, r.pith, 11, '#7f9a62', 9) +                    /* اللب: خلايا كبيرة */
      cells(r.pith, r.rx, 7, '#7a5a2a', 5.5) +                         /* الخشب الثانوي */
      cells(r.rc + 4.5, r.rp, 5, '#4f7030', 4) +                       /* اللحاء الثانوي: خلايا أصغر */
      cells(r.rp, r.rk - 3.5, 9, '#3f6a32', 8);                        /* القشرة */
    if (r.re - r.rk - 3.5 > 2) h += cells(r.rk + 3.5, r.re, 4, '#4a2a10', 7);   /* البشرة المحيطة: خلايا فلين */
    /* أوعية الخشب: دوائر أكبر بجدار سميك */
    for (let q = r.pith + 10; q < r.rx - 5; q += 16){ const n = Math.max(4, Math.round(q / 12)); for (let i = 0; i < n; i++){ const t = i / n * 6.283 + q * 0.37;
      h += `<circle cx="${n2(CX + Math.cos(t) * q)}" cy="${n2(CY + Math.sin(t) * q)}" r="4.2" fill="#f6e7c2" stroke="#6a4a1c" stroke-width="1.3"/>`; } }
    /* حدود الأنسجة */
    [r.pith, r.rx, r.rp, r.re].forEach(q => { h += circ(q, 'stroke="#2a1a08" stroke-width="1.2" opacity=".85"'); });
    return h;
  };
  /* حلقة كمبيوم: صف من خلايا مسطحة بلون صريح وحافتين داكنتين */
  const camb = (cls, rad, col, w) => ring(cls, rad, 'none', ` stroke="${col}" stroke-width="${w}"`) +
    ring(cls, rad, 'none', ` stroke="#3a2006" stroke-width="${w}" stroke-dasharray="1 4.2"`) +
    ring(cls + 'i', rad - w / 2, 'none', ' stroke="#2a1404" stroke-width="1.4"') + ring(cls + 'o', rad + w / 2, 'none', ' stroke="#2a1404" stroke-width="1.4"');
  const body = `<g transform="translate(${CX},${CY}) scale(${S}) translate(${-CX},${-CY})">
    ${part('periEpi', ring('rPe', r0.re, '#8a5a34'))}
    ${ring('rCx', r0.rk, '#79a862')}
    ${part('secPhl', ring('rP', r0.rp, '#b4d07a'))}
    ${part('secXyl', ring('rX', r0.rx, '#dcc08a'))}
    <circle cx="${CX}" cy="${CY}" r="${r0.pith}" fill="#d2e4b8"/>
    <g id="secTex" pointer-events="none">${tex(r0)}</g>
    ${part('corkCamb', camb('rK', r0.rk, '#e07a32', 7))}
    ${part('vascCamb', camb('rC', r0.rc, '#ffc23a', 9))}
    <g id="secArr"></g></g>
    <text class="cap sm" id="secCap" x="${CX}" y="664" text-anchor="middle">${still ? 'مقطع عرضي في ساق بعد التثخن' : ''}</text>`;
  const ctl = stageCtl(MER_SEC_STAGES, { label: 'المرحلة', dur: 4 * 6 });
  const ANG = { secXyl: 150, vascCamb: -75, secPhl: -22, corkCamb: 8, periEpi: 36 };
  const mid = (id, r) => { const a = ANG[id] * Math.PI / 180;
    const rad = id === 'secXyl' ? (r.pith + r.rx) / 2 : id === 'vascCamb' ? r.rc : id === 'secPhl' ? r.rc + 4.5 + (r.rp - r.rc - 4.5) * 0.62 : id === 'corkCamb' ? r.rk : (r.rk + 4 + r.re) / 2;
    return sc([CX + Math.cos(a) * rad, CY + Math.sin(a) * rad]); };
  const R1 = merSecRings(1, 1);
  const arrow = (x, y, ang) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(ang)})"><path d="M0,7 L0,-7 M-4,-2 L0,-7 L4,-2" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  let last = '';
  const apply = (a, g, pe, t, st) => {
    const r = merSecRings(g, pe);
    const set = (q, rad) => a.all(q).forEach(e => e.setAttribute('r', n2(rad)));
    set('.rPe', r.re); set('.rCx', r.rk); set('.rK', r.rk); set('.rKi', r.rk - 3.5); set('.rKo', r.rk + 3.5); set('.rP', r.rp);
    set('.rC', r.rc); set('.rCi', r.rc - 4.5); set('.rCo', r.rc + 4.5); set('.rX', r.rx);
    const key = Math.round(r.rx) + ':' + Math.round(r.re);
    if (key !== last){ last = key; const tx = a.el('#secTex'); if (tx) tx.innerHTML = tex(r); }
    /* أسهم: الكمبيوم الوعائي يكوّن للداخل (خشب) والخارج (لحاء)، والفليني للخارج (بشرة محيطة) */
    const ar = a.el('#secArr');
    if (ar){
      const b = still ? 0 : Math.abs(Math.sin(t * 3)) * 4; let h = '';
      if (st === 1 || st === 3) [-110, 70].forEach(d => { const q = d * Math.PI / 180; h += arrow(CX + Math.cos(q) * (r.rc - 14 - b), CY + Math.sin(q) * (r.rc - 14 - b), d - 90) + arrow(CX + Math.cos(q) * (r.rc + 14 + b), CY + Math.sin(q) * (r.rc + 14 + b), d + 90); });
      if (st === 2 || st === 3) [150, -170].forEach(d => { const q = d * Math.PI / 180; h += arrow(CX + Math.cos(q) * (r.rk + 10 + b), CY + Math.sin(q) * (r.rk + 10 + b), d + 90); });
      ar.innerHTML = h;
    }
    /* البشرة المحيطة لا تظهر (ولا اسمها) قبل أن يكوّنها الكمبيوم الفليني؛ خطوط الأسماء تتبع الحلقات */
    const pg = a.el('.lblG[data-for="periEpi"]'); if (pg) pg.style.display = r.re - r.rk - 4 < 3 ? 'none' : '';
    Object.keys(ANG).forEach(id => { const [x, y] = mid(id, r), L = a.el(`.lblG[data-for="${id}"]`); if (!L) return;
      const ln = L.querySelector('.lead'), dt = L.querySelector('.lblDot'); if (ln){ ln.setAttribute('x2', n2(x)); ln.setAttribute('y2', n2(y)); } if (dt){ dt.setAttribute('cx', n2(x)); dt.setAttribute('cy', n2(y)); } });
    const cap = a.el('#secCap'); if (cap) cap.textContent = st === 0 ? 'مقطع عرضي في ساق: المرستيمي الجانبي بموازاة السطح الخارجي' : st === 1 ? 'الكمبيوم الوعائي يكوّن الخشب الثانوي (للداخل) واللحاء الثانوي (للخارج)' : st === 2 ? 'الكمبيوم الفليني يكوّن البشرة المحيطة (للخارج)' : 'يزداد سمك الساق (النمو الثانوي والتثخن)';
  };
  const parts = [
    { id: 'secXyl', anchor: mid('secXyl', R1), label: [134, 500], side: 'L' },
    { id: 'vascCamb', anchor: mid('vascCamb', R1), label: [866, 110], side: 'R' },
    { id: 'secPhl', anchor: mid('secPhl', R1), label: [866, 230], side: 'R' },
    { id: 'corkCamb', anchor: mid('corkCamb', R1), label: [866, 350], side: 'R' },
    { id: 'periEpi', anchor: mid('periEpi', R1), label: [866, 470], side: 'R' }
  ];
  if (still) return { body, parts, fnParts: [] };
  return {
    body, stages: MER_SEC_STAGES, parts,
    fnParts: ['vascCamb', 'corkCamb'],
    tools: ctl.tools.concat([{ id: 'tbl:merTypes', label: 'أنواعه حسب الموقع (ص6)' }]),
    init(){ last = ''; ctl.start(); },
    onSlider: v => ctl.onSlider(v),
    onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const { g, pe } = merSecGrowth();
      apply(a, g, pe, t, STG.idx);
    }
  };
}
