/* ══════════════════════════════════════════════════════════════════════════
   4.5 · التكاثر في النباتات الزهرية — الزهرة — ملزمة ص53–67:
         تركيب الزهرة (ص56)، السداة والمدقة، دورة الحياة (7 مراحل ص58)،
         المرحلة 1 المتك وحبوب اللقاح (ص59–61)، المرحلة 2 البويض والكيس الجنيني (ص64–67)
   ══════════════════════════════════════════════════════════════════════════ */
const FL_VIEWS = [
  { id: 'flVStruct', label: 'تركيب الزهرة' },
  { id: 'flVParts',  label: 'السداة والمدقة' },
  { id: 'flVCycle',  label: 'دورة الحياة' },
  { id: 'flVPollen', label: 'المتك وحبوب اللقاح' },
  { id: 'flVOvule',  label: 'البويض والكيس الجنيني' }
];
const FLC = { pet: '#f59ab0', petB: '#ec7f9b', petL: '#ffd3de', vein: '#fbc3d1', sep: '#4fae4a', sepL: '#a6e48f',
  fil: '#d6e77a', anth: '#f7c531', anthD: '#b8840e', pis: '#7fcf5f', pisD: '#4a9a3c', pisL: '#c9f0a8', ovl: '#fff6dc',
  wall: '#ee7a78', wallL: '#ffc2bc', integ: '#9fcbe0', integD: '#6f9fb8', nuc: '#cdeb93', sac: '#fbf6dc',
  mega: '#f6a23c', megaL: '#ffe0b0', mother: '#e0362c', egg: '#f2b3c0', eggN: '#7a1530', syn: '#ffcf8f', synN: '#a5521a',
  pol: '#3d8be0', ant: '#c4c7d4', antN: '#4a4c5a', arr: '#d9784a', pollen: '#ffc15e', gold: '#ffe08a' };

SCENES.flower = {
  title: 'الزهرة',
  get src(){ return ({ flVStruct: 'ملزمة ص53–56', flVParts: 'ملزمة ص53–57', flVCycle: 'ملزمة ص58', flVPollen: 'ملزمة ص59–61', flVOvule: 'ملزمة ص64–67' })[SEL.flv] || 'ملزمة ص53'; },
  tint: ['rgba(220,110,150,.24)', 'rgba(110,170,90,.16)'],
  build(){
    const v = FL_VIEWS.some(x => x.id === SEL.flv) ? SEL.flv : 'flVStruct';
    const s = v === 'flVParts' ? flParts() : v === 'flVCycle' ? flCycle() : v === 'flVPollen' ? flPollen() : v === 'flVOvule' ? flOvule() : flStruct();
    s.rebuildOnRadio = 'flv';
    s.tools = FL_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'flv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.fl_flower = { title: 'تركيب الزهرة (مقطع طولي)', build: st => flStruct(st) };
SCENES.fl_parts  = { title: 'المدقة والسداة والبرعم الزهري', build: st => flParts(st) };
SCENES.fl_cycle  = { title: 'مراحل دورة حياة النبات الزهري', build: st => flCycle(st) };
SCENES.fl_pollen = { title: 'تركيب المتك وتكوين حبوب اللقاح', build: st => flPollen(st) };
SCENES.fl_ovule  = { title: 'نمو البويض وتكوين الكيس الجنيني', build: st => flOvule(st) };

/* أدوات مساعدة خاصة بالقسم */
const flSm = (k) => k * k * (3 - 2 * k);
const flCl = v => Math.max(0, Math.min(1, v));
/* بتلة: من القاعدة (bx,by) باتجاه ang بطول L وعرض W */
const flPetal = (bx, by, ang, L, W) => { const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = [[0, -7], [0.3, -0.3], [0.62, -0.5], [0.9, -0.42], [1, -0.14], [1, 0.14], [0.9, 0.42], [0.62, 0.5], [0.3, 0.3], [0, 7]]
    .map(([u, v], i) => { const U = u * L, V = (i === 0 || i === 9) ? v : v * W; return [bx + ca * U - sa * V, by + sa * U + ca * V]; });
  return smoothClosed(P); };
const flVein = (bx, by, ang, L, off) => { const ca = Math.cos(ang), sa = Math.sin(ang), p = (u, v) => [bx + ca * u - sa * v, by + sa * u + ca * v];
  const a = p(L * 0.08, 0), b = p(L * 0.5, off * 0.8), c = p(L * 0.86, off);
  return `M${n2(a[0])},${n2(a[1])} Q${n2(b[0])},${n2(b[1])} ${n2(c[0])},${n2(c[1])}`; };
/* قوس إهليلجي مع فجوة (لأغلفة البويض وفتحة النقير) — gapAt: زاوية منتصف الفجوة */
const flArc = (cx, cy, rx, ry, gap, gapAt) => { const g = gap * Math.PI / 180, c = (gapAt === undefined ? -90 : gapAt) * Math.PI / 180;
  const a0 = c + g, a1 = c + 2 * Math.PI - g;
  return `M${n2(cx + rx * Math.cos(a0))},${n2(cy + ry * Math.sin(a0))} A${rx},${ry} 0 1 1 ${n2(cx + rx * Math.cos(a1))},${n2(cy + ry * Math.sin(a1))}`; };
const flArrow = (x0, y0, x1, y1, st) => `<g data-st="${st}">${gArrow(x0, y0, x1, y1, FLC.arr)}</g>`;

/* ───────── 1) تركيب الزهرة — مقطع طولي (ص56 الشكل العلوي) ───────── */
function flStruct(still){
  const BX = 500, BY = 452;
  const PET = [[-165, 215, 150, FLC.petB], [-15, 215, 150, FLC.petB], [-128, 245, 160, FLC.pet], [-52, 245, 160, FLC.pet], [-90, 250, 165, '#f8adc0']];
  let petals = `<defs><radialGradient id="flGPet" cx="50%" cy="85%" r="85%"><stop offset="0%" stop-color="#ffe3ea"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`;
  PET.forEach(([deg, L, W, col]) => { const a = deg * Math.PI / 180;
    petals += `<path d="${flPetal(BX, BY, a, L, W)}" fill="${col}" stroke="${FLC.petL}" stroke-width="2"/>`;
    petals += `<g fill="none" stroke="${FLC.vein}" stroke-width="1.6" opacity=".75" stroke-linecap="round">${[-0.22, 0, 0.22].map(o => `<path d="${flVein(BX, BY, a, L, o * W)}"/>`).join('')}</g>`; });
  /* الأسدية: خيوط ومتوك */
  const A = [[420, 272], [442, 238], [466, 214], [580, 272], [558, 238], [534, 214]];
  const B = [[478, 456], [484, 456], [490, 456], [522, 456], [516, 456], [510, 456]];
  let fils = '', anths = '';
  A.forEach(([ax, ay], i) => { const [bx, by] = B[i], s = ax < BX ? -1 : 1;
    fils += `<path d="${smoothOpen([[bx, by], [bx + (ax - bx) * 0.12, 400], [(ax + bx) / 2 + s * 8, (ay + 400) / 2], [ax, ay + 9]])}" fill="none" stroke="${FLC.fil}" stroke-width="3.6" stroke-linecap="round"/>`;
    const rot = (ax - BX) / 5;
    anths += `<g transform="rotate(${n2(rot)} ${ax} ${ay})"><ellipse cx="${ax}" cy="${ay}" rx="7.5" ry="12" fill="${FLC.anth}" stroke="${FLC.anthD}" stroke-width="1.6"/>` +
      `<line x1="${ax}" y1="${ay - 10}" x2="${ax}" y2="${ay + 10}" stroke="${FLC.anthD}" stroke-width="1.4"/></g>`; });
  /* المدقة: المبيض (مقطوع) + القلم + الميسم */
  const ovules = [[490, 392], [510, 410], [490, 428]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="500" y2="${y}" stroke="#6fbf55" stroke-width="2.4"/>` +
    `<circle cx="${x}" cy="${y}" r="6.5" fill="${FLC.ovl}" stroke="#d7c27a" stroke-width="1.6"/>`).join('');
  const ovary = `<ellipse cx="500" cy="410" rx="31" ry="45" fill="${FLC.pisD}" stroke="#b6f09a" stroke-width="2.2"/>` +
    `<ellipse cx="500" cy="410" rx="21" ry="33" fill="${FLC.pisL}"/><line x1="500" y1="380" x2="500" y2="440" stroke="#6fbf55" stroke-width="3"/>`;
  const style = `<path d="M495,368 L494,200 Q500,193 506,200 L505,368Z" fill="${FLC.pis}" stroke="#c8f5b0" stroke-width="1.6"/>`;
  const stigma = `<path d="${smoothClosed([[485, 194], [479, 181], [487, 171], [496, 177], [500, 166], [504, 177], [513, 171], [521, 181], [515, 194], [500, 199]])}" fill="#9be27a" stroke="#e8ffd8" stroke-width="2"/>` +
    [[490, 182], [500, 174], [510, 182], [500, 188]].map(([x, y]) => `<circle class="flSticky" cx="${x}" cy="${y}" r="2.2" fill="#ffffff" opacity=".7"/>`).join('');
  const recept = `<path d="M452,472 Q500,512 548,472 Q532,450 500,450 Q468,450 452,472Z" fill="#62b24f" stroke="#b6eba0" stroke-width="2"/>`;
  const pedicel = `<path d="M489,612 C491,560 487,520 486,494 L514,494 C513,520 509,560 511,612Z" fill="#479a43" stroke="#9fdc8a" stroke-width="1.6"/>`;
  const sepL = [[470, 476], [440, 478], [404, 462], [386, 436], [416, 448], [450, 458], [474, 464]];
  const sepals = `<path d="${smoothClosed(sepL)}" fill="${FLC.sep}" stroke="${FLC.sepL}" stroke-width="2"/>` +
    `<path d="${smoothClosed(sepL.map(([x, y]) => [1000 - x, y]))}" fill="${FLC.sep}" stroke="${FLC.sepL}" stroke-width="2"/>`;
  let pd = '';
  if (!still) A.forEach(([ax, ay], i) => { for (let j = 0; j < 2; j++) pd += `<circle class="flPd" data-x="${ax}" data-y="${ay}" data-i="${i * 2 + j}" cx="${ax}" cy="${ay}" r="2.6" fill="#ffe27a" opacity="0"/>`; });
  const body = `
    <g opacity=".9"><ellipse cx="500" cy="300" rx="300" ry="230" fill="url(#gLight)" opacity=".25"/></g>
    ${part('flCorolla', petals)}
    ${part('flStamen', part('flFilament', fils) + part('flAnther', anths))}
    ${pedicel}
    ${part('flPistil', part('flOvary', ovary + part('flOvule', ovules)) + part('flStyle', style) + part('flStigma', stigma))}
    ${part('flReceptacle', recept)}
    ${part('flCalyx', sepals)}
    <g>${pd}</g>
    <text class="cap sm" x="500" y="645" text-anchor="middle">مقطع طولي في زهرة كاملة — الأجزاء الأساسية: الأسدية والمدقة · غير الأساسية: الكأس والتويج (ص53–56)</text>`;
  const ESS = ['flStamen', 'flAnther', 'flFilament', 'flPistil', 'flStigma', 'flStyle', 'flOvary', 'flOvule'], NON = ['flCorolla', 'flCalyx'];
  return {
    body, fnParts: ['flStigma', 'flAnther'],
    parts: [
      { id: 'flStigma', anchor: [516, 182], label: [866, 150], side: 'R' },
      { id: 'flAnther', anchor: [565, 238], label: [866, 212], side: 'R' },
      { id: 'flStamen', anchor: [586, 272], label: [866, 272], side: 'R' },
      { id: 'flFilament', anchor: [551, 345], label: [866, 335], side: 'R' },
      { id: 'flPistil', anchor: [529, 398], label: [866, 400], side: 'R' },
      { id: 'flReceptacle', anchor: [540, 478], label: [866, 480], side: 'R' },
      { id: 'flCorolla', anchor: [330, 300], label: [134, 200], side: 'L' },
      { id: 'flStyle', anchor: [500, 245], label: [134, 285], side: 'L' },
      { id: 'flOvary', anchor: [470, 410], label: [134, 370], side: 'L' },
      { id: 'flOvule', anchor: [484, 428], label: [134, 435], side: 'L' },
      { id: 'flCalyx', anchor: [408, 455], label: [134, 510], side: 'L' }
    ],
    tools: [{ id: 'info:flFlower', label: 'ما الزهرة؟' }, { id: 'flEss', label: 'الأجزاء الأساسية', toggle: true }, { id: 'flNon', label: 'غير الأساسية', toggle: true },
      { id: 'tbl:flTerms', label: 'مصطلحات زهرية (ص58)' }, { id: 'tbl:flMonoDi', label: 'فلقة × فلقتين (ص57)' }],
    init(){ if (typeof clearDiff === 'function') clearDiff(); },
    onTool(id, a){
      if (id !== 'flEss' && id !== 'flNon') return;
      const other = id === 'flEss' ? 'flNon' : 'flEss';
      if (a.tool(id)){ a.setTool(other, false); highlightDiff(id === 'flEss' ? ESS : NON); }
      else clearDiff();
    },
    tick(dt, t, a){
      a.all('.flPd').forEach(c => { const i = +c.dataset.i, p = (t * 0.22 + i * 0.137) % 1, x0 = +c.dataset.x, y0 = +c.dataset.y, s = x0 < BX ? -1 : 1;
        c.setAttribute('cx', n2(x0 + s * p * 40 + Math.sin(t * 2 + i) * 4)); c.setAttribute('cy', n2(y0 + 8 + p * 150));
        c.setAttribute('opacity', n2(Math.sin(p * Math.PI) * 0.9)); });
      a.all('.flSticky').forEach((c, i) => c.setAttribute('opacity', n2(0.45 + 0.4 * Math.sin(t * 3 + i * 1.7))));
    }
  };
}

/* ───────── 2) المدقة والسداة وحبوب اللقاح والبرعم (ص55–56) ───────── */
function flParts(still){
  /* المدقة (ص56 أسفل اليسار) */
  const ovPts = [[257, 282], [222, 330], [204, 390], [212, 450], [240, 490], [270, 500], [300, 490], [328, 450], [336, 390], [318, 330], [283, 282]];
  const stigma = `<path d="${smoothClosed([[246, 98], [238, 84], [248, 72], [262, 78], [270, 88], [278, 78], [292, 72], [302, 84], [294, 98], [270, 104]])}" fill="#9be27a" stroke="#e8ffd8" stroke-width="2"/>` +
    [[252, 84], [270, 92], [288, 84]].map(([x, y]) => `<circle class="flSticky" cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity=".7"/>`).join('');
  const style = `<path d="M261,101 L258,284 L282,284 L279,101Z" fill="${FLC.pis}" stroke="#c8f5b0" stroke-width="1.8"/>`;
  const ovary = `<path d="${smoothClosed(ovPts)}" fill="${FLC.pis}" stroke="#c8f5b0" stroke-width="2.2"/>` +
    `<path d="${smoothClosed([[270, 312], [238, 345], [228, 395], [238, 445], [270, 470], [302, 445], [312, 395], [302, 345]])}" fill="${FLC.pisD}"/>` +
    `<line x1="270" y1="322" x2="270" y2="462" stroke="#8fdc70" stroke-width="4"/>`;
  const OV = [[247, 350], [293, 350], [245, 395], [295, 395], [247, 440], [293, 440]];
  const funi = OV.map(([x, y]) => `<line x1="${x < 270 ? x + 9 : x - 9}" y1="${y}" x2="270" y2="${y}" stroke="#b8f09a" stroke-width="3.4"/>`).join('');
  const ovl = OV.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#f6fff0" stroke="#d4f0c4" stroke-width="1.6"/>`).join('');
  /* السداة (ص56 أسفل الوسط) */
  const anther = `<g transform="rotate(12 486 110)"><ellipse cx="486" cy="110" rx="15" ry="31" fill="${FLC.anth}" stroke="${FLC.anthD}" stroke-width="2"/>` +
    `<path d="M486,82 Q480,110 486,138" fill="none" stroke="${FLC.anthD}" stroke-width="1.8"/></g>`;
  const filament = `<path d="${smoothOpen([[482, 140], [490, 200], [478, 260], [470, 320], [482, 380], [494, 440], [488, 470]])}" fill="none" stroke="#f39c32" stroke-width="6" stroke-linecap="round"/>`;
  const brk = `<path d="M444,96 L432,96 L432,468 L444,468" fill="none" stroke="${FLC.gold}" stroke-width="2.4"/>`;
  /* متك مشطور تظهر فيه حبوب اللقاح (ص56 أسفل اليمين) */
  const up = `<path d="${smoothClosed([[682, 198], [686, 160], [702, 132], [722, 124], [742, 132], [758, 160], [762, 198]])}" fill="#ffd84a" stroke="#c9a10e" stroke-width="2"/>`;
  const lo = `<path d="${smoothClosed([[684, 226], [760, 226], [756, 262], [742, 292], [722, 302], [702, 292], [688, 262]])}" fill="#f7cc2c" stroke="#c9a10e" stroke-width="2"/>`;
  const ribs = [700, 722, 744].map(x => `<path d="M${x},${n2(132 + Math.abs(x - 722) * 0.6)} Q${x + (x - 722) * 0.2},165 ${x},196" fill="none" stroke="#e0b21a" stroke-width="1.4"/>` +
    `<path d="M${x},228 Q${x + (x - 722) * 0.2},260 ${x},${n2(296 - Math.abs(x - 722) * 0.5)}" fill="none" stroke="#e0b21a" stroke-width="1.4"/>`).join('');
  const grains = [[700, 212], [714, 209], [729, 213], [744, 210]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="5" fill="#8e1d2a" stroke="#ffb0a0" stroke-width="1.2"/>`).join('');
  const stalk = `<path d="M722,302 Q724,336 720,368" fill="none" stroke="#8fd45f" stroke-width="5" stroke-linecap="round"/>`;
  /* البرعم: فرع خضري (استطالة السلاميات) × زهرة (عدم استطالة السلاميات) — ص53 وص56 */
  const leafR = `<path d="M0,0 Q18,-18 42,-13 Q22,3 0,0Z" fill="#5cbf4a" stroke="#b8f0a0" stroke-width="1.4"/>`;
  const leafL = `<path d="M0,0 Q-18,-18 -42,-13 Q-22,3 0,0Z" fill="#5cbf4a" stroke="#b8f0a0" stroke-width="1.4"/>`;
  const SX = 620, SB = 580, SH = 165, NF = [0.33, 0.66, 1];
  const nodes = NF.map((f, i) => `<g class="flNode" data-f="${f}" transform="translate(${SX},${n2(SB - SH * f)})">${i < 2 ? (i % 2 ? leafL + `<g transform="scale(.8)">${leafR}</g>` : leafR + `<g transform="scale(.8)">${leafL}</g>`) :
    `<ellipse cx="0" cy="-8" rx="7" ry="12" fill="#2f7f33" stroke="#9fe08a" stroke-width="1.4"/>${`<g transform="scale(.55)">${leafL}${leafR}</g>`}`}</g>`).join('');
  const shoot = `<line id="flStem" x1="${SX}" y1="${SB}" x2="${SX}" y2="${SB - SH}" stroke="#4fa64a" stroke-width="5" stroke-linecap="round"/>${nodes}`;
  const FX = 760, FB = 580;
  const bud = `<line x1="0" y1="40" x2="0" y2="0" stroke="#4fa64a" stroke-width="5" stroke-linecap="round"/><path d="${smoothClosed([[0, -66], [14, -52], [19, -28], [14, -6], [0, 2], [-14, -6], [-19, -28], [-14, -52]])}" fill="#f7b3c6" stroke="#ffe0ea" stroke-width="1.8"/>` +
    `<path d="M0,-62 Q6,-34 0,-2" fill="none" stroke="#e98aa5" stroke-width="1.4"/>`;
  const sep = `<path d="M-3,0 Q-24,-14 -22,-42 Q-8,-22 -2,-6Z" fill="${FLC.sep}" stroke="${FLC.sepL}" stroke-width="1.4"/><path d="M3,0 Q24,-14 22,-42 Q8,-22 2,-6Z" fill="${FLC.sep}" stroke="${FLC.sepL}" stroke-width="1.4"/>`;
  const body = `
    ${part('flPistil', part('flStigma', stigma) + part('flStyle', style) + part('flOvary', ovary) + part('flFunicle', funi) + part('flOvule', ovl))}
    ${part('flStamen', brk + part('flAnther', anther) + part('flFilament', filament))}
    <g>${up}${lo}${ribs}${stalk}</g>${part('flPollenGrains', grains)}
    <line x1="560" y1="388" x2="820" y2="388" stroke="rgba(255,255,255,.12)" stroke-dasharray="5 6"/>
    ${part('flShoot', shoot)}
    <g id="flFbG" transform="translate(${FX},${FB - 40})">${part('flFlowerBud', bud)}${part('flCalyx', sep)}</g>
    <text class="cap sm" x="${SX}" y="602" text-anchor="middle">استطالة السلاميات</text>
    <text class="cap sm" x="${FX}" y="602" text-anchor="middle">عدم استطالة السلاميات</text>
    <text class="cap sm" x="500" y="655" text-anchor="middle">المدقة (الجزء الأنثوي) · السداة (الجزء الذكري) · تنشأ الأزهار من البراعم أسوة بالفروع الخضرية (ص53–56)</text>`;
  return {
    body, fnParts: ['flStigma', 'flAnther', 'flShoot'],
    parts: [
      { id: 'flStigma', anchor: [246, 88], label: [134, 88], side: 'L' },
      { id: 'flStyle', anchor: [259, 190], label: [134, 190], side: 'L' },
      { id: 'flFunicle', anchor: [262, 350], label: [134, 300], side: 'L' },
      { id: 'flOvary', anchor: [206, 400], label: [134, 380], side: 'L' },
      { id: 'flOvule', anchor: [236, 440], label: [134, 460], side: 'L' },
      { id: 'flPistil', anchor: [222, 480], label: [134, 540], side: 'L' },
      { id: 'flAnther', anchor: [498, 100], label: [575, 66], side: 'C' },
      { id: 'flStamen', anchor: [432, 300], label: [386, 300], side: 'C' },
      { id: 'flFilament', anchor: [474, 330], label: [575, 330], side: 'C' },
      { id: 'flPollenGrains', anchor: [750, 210], label: [866, 205], side: 'R' },
      { id: 'flShoot', anchor: [652, 514], label: [866, 450], side: 'R' },
      { id: 'flFlowerBud', anchor: [777, 492], label: [866, 510], side: 'R' },
      { id: 'flCalyx', anchor: [773, 524], label: [866, 570], side: 'R' }
    ],
    tools: [{ id: 'info:flFlower', label: 'منشأ الزهرة' }, { id: 'tbl:flSepPet', label: 'الكأسية × التويجية' }, { id: 'tbl:flOrigin', label: 'المنشأ والوظيفة (ص66)' }],
    tick(dt, t, a){
      const p = (t / 9) % 1, g = still ? 1 : 0.08 + 0.92 * flSm(flCl(p / 0.7));
      const st = a.el('#flStem'); if (st) st.setAttribute('y2', n2(SB - SH * g));
      a.all('.flNode').forEach(e => { const f = +e.dataset.f, s = flCl(g * 1.5 - f * 0.5);
        e.setAttribute('transform', `translate(${SX},${n2(SB - SH * f * g)}) scale(${n2(Math.max(0.05, s))})`); });
      const fb = a.el('#flFbG'); if (fb) fb.setAttribute('transform', `translate(${FX},${n2(FB - 40 * (0.6 + 0.4 * g))}) scale(${n2(0.45 + 0.55 * g)})`);
      a.all('.flSticky').forEach((c, i) => c.setAttribute('opacity', n2(0.45 + 0.4 * Math.sin(t * 3 + i * 1.7))));
    }
  };
}

/* ───────── 3) مراحل دورة حياة النبات الزهري (ص58) ───────── */
const FL_CYCLE = [
  { n: '1 · المتك وتكوين حبوب اللقاح', d: 'تحتوي أكياس اللقاح في المتك على الخلايا الأم للأبواغ الصغيرة (2س) التي تنقسم اختزالياً فتتكون أبواغ صغيرة (س) تتحول إلى حبوب لقاح (ص59) — في هذا التبويب.' },
  { n: '2 · المبيض وتكوين البويضات', d: 'يبدأ البويض بالجويزاء، وتنقسم الخلية الأم للأبواغ الكبيرة (2س) اختزالياً ويبقى بوغ فعال واحد يكوّن الكيس الجنيني الناضج (ص64) — في هذا التبويب.' },
  { n: '3 · التلقيح', d: 'عملية انتقال حبوب اللقاح من المتك إلى الميسم للنوع نفسه، وهو على نوعين: تلقيح ذاتي وتلقيح خلطي (ص68).' },
  { n: '4 · تكوين أنبوب اللقاح', d: 'تنمو حبة اللقاح بعد سقوطها على الميسم مكوّنة أنبوب اللقاح الذي يخترق الميسم والقلم حتى يصل المبيض (ص70).' },
  { n: '5 · الإخصاب وتكوين الجنين', d: 'تحصل عملية الإخصاب المزدوج داخل الكيس الجنيني ثم تنقسم البيضة المخصبة لتكوين الجنين (ص74–76).' },
  { n: '6 · تكوين البذرة', d: 'ينمو البويض المخصب ليصبح بذرة (ص77).' },
  { n: '7 · تكوين الثمرة', d: 'ينمو المبيض بعد الإخصاب ليكوّن الثمرة (ص82).' }
];
function flCycle(still){
  const CX = 560, CY = 330, R = 205, n = 7;
  const ang = i => (-90 + i * 360 / n) * Math.PI / 180, pos = i => [CX + R * Math.cos(ang(i)), CY + R * Math.sin(ang(i))];
  const ic = [
    `<line x1="0" y1="10" x2="0" y2="30" stroke="${FLC.fil}" stroke-width="3"/><ellipse cx="-6" cy="-4" rx="7" ry="16" fill="${FLC.anth}" stroke="${FLC.anthD}" stroke-width="1.4"/><ellipse cx="6" cy="-4" rx="7" ry="16" fill="${FLC.anth}" stroke="${FLC.anthD}" stroke-width="1.4"/>` +
      [[-20, -20], [18, -22], [22, -6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffe27a"/>`).join(''),
    `<rect x="-4" y="-30" width="8" height="22" rx="3" fill="${FLC.pis}"/><ellipse cx="0" cy="8" rx="18" ry="20" fill="${FLC.pis}" stroke="#c8f5b0" stroke-width="1.6"/><ellipse cx="0" cy="8" rx="9" ry="12" fill="${FLC.nuc}" stroke="${FLC.integD}" stroke-width="2"/>`,
    `<path d="M2,30 L2,6 M-8,6 Q2,-4 12,6" fill="none" stroke="#9be27a" stroke-width="5" stroke-linecap="round"/><path d="M-24,-22 Q-14,-26 -4,-8" fill="none" stroke="${FLC.gold}" stroke-width="1.6" stroke-dasharray="3 4"/>` +
      [[-24, -22], [-16, -24], [-8, -16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${FLC.pollen}"/>`).join(''),
    `<circle cx="-8" cy="-18" r="10" fill="${FLC.pollen}" stroke="#fff0c0" stroke-width="1.4"/><path d="M-4,-9 Q4,4 -2,14 Q-6,24 6,30" fill="none" stroke="${FLC.gold}" stroke-width="3" stroke-linecap="round"/>`,
    `<ellipse cx="0" cy="0" rx="16" ry="26" fill="${FLC.sac}" stroke="#e9d79a" stroke-width="1.6"/><circle cx="0" cy="-12" r="7" fill="${FLC.eggN}"/><circle cx="0" cy="8" r="6" fill="#f08a3a"/><path d="M0,-40 L0,-20" stroke="${FLC.gold}" stroke-width="3"/>`,
    `<ellipse cx="0" cy="2" rx="22" ry="14" fill="#a8743a" stroke="#f0c890" stroke-width="1.6"/><path d="M-6,-4 Q0,2 -4,8" fill="none" stroke="#5a3a1a" stroke-width="2"/>`,
    `<circle cx="0" cy="6" r="19" fill="#e2453c" stroke="#ffb3a8" stroke-width="1.6"/><path d="M0,-12 L2,-26" stroke="#5b8a3a" stroke-width="3"/><path d="M2,-22 Q14,-30 20,-20 Q10,-16 2,-22Z" fill="#5cbf4a"/><circle cx="-7" cy="0" r="4" fill="#fff" opacity=".4"/>`
  ];
  let ring = '', nodes = '';
  for (let i = 0; i < n; i++){
    const a0 = ang(i) + 0.24, a1 = ang(i + 1) - 0.24, P = [];
    for (let k = 0; k <= 10; k++){ const a = a0 + (a1 - a0) * k / 10; P.push([CX + R * Math.cos(a), CY + R * Math.sin(a)]); }
    const q = P[9], e = P[10];
    ring += `<g data-st="${(i + 1) % n}"><path d="${smoothOpen(P.slice(0, 10))}" fill="none" stroke="${FLC.arr}" stroke-width="2.6" stroke-linecap="round"/>${gArrow(q[0], q[1], e[0], e[1], FLC.arr)}</g>`;
    const [x, y] = pos(i), mine = i < 2;
    nodes += part('flSt' + (i + 1), `<g data-st="${i}"><circle cx="${n2(x)}" cy="${n2(y)}" r="40" fill="rgba(255,255,255,.07)" stroke="${mine ? FLC.gold : 'rgba(255,255,255,.45)'}" stroke-width="${mine ? 3 : 2}"/>` +
      `<g transform="translate(${n2(x)},${n2(y)})">${ic[i]}</g>` +
      `<circle cx="${n2(x + 28)}" cy="${n2(y - 28)}" r="11" fill="${mine ? '#d9784a' : '#5a6478'}"/><text class="cap sm" x="${n2(x + 28)}" y="${n2(y - 24)}" text-anchor="middle" fill="#fff">${i + 1}</text></g>`);
  }
  const flowerIc = [0, 1, 2, 3, 4].map(k => { const a = (-90 + k * 72) * Math.PI / 180; return `<ellipse cx="${n2(CX + Math.cos(a) * 20)}" cy="${n2(CY - 24 + Math.sin(a) * 20)}" rx="13" ry="9" transform="rotate(${k * 72 - 90} ${n2(CX + Math.cos(a) * 20)} ${n2(CY - 24 + Math.sin(a) * 20)})" fill="${FLC.pet}" stroke="${FLC.petL}" stroke-width="1.2"/>`; }).join('');
  const body = `
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="30"/>
    ${ring}${nodes}
    <g>${flowerIc}<circle cx="${CX}" cy="${CY - 24}" r="9" fill="${FLC.anth}"/></g>
    <text class="cap" x="${CX}" y="${CY + 22}" text-anchor="middle">دورة حياة النبات الزهري</text>
    <text class="cap sm" x="${CX}" y="${CY + 44}" text-anchor="middle">7 مراحل (ص58)</text>
    <circle id="flCycDot" cx="${CX}" cy="${CY - R}" r="9" fill="#fff3cf" stroke="#ffd166" stroke-width="3" opacity="0"/>
    <text class="cap sm" x="500" y="645" text-anchor="middle">المرحلتان 1 و2 (بإطار ذهبي) في هذا التبويب · المراحل 3–7 في تبويب التلقيح والإخصاب والبذرة والثمرة</text>`;
  const ctl = stageCtl(FL_CYCLE, { dur: 35 });
  const LB = [[866, 105, 'R', 0, -40], [866, 200, 'R', 40, 0], [866, 376, 'R', 40, 0], [866, 555, 'R', 34, 20], [134, 555, 'L', -34, 20], [134, 390, 'L', -40, 0], [134, 300, 'L', -38, 10]];
  return {
    body, stages: FL_CYCLE,
    parts: LB.map(([lx, ly, side, dx, dy], i) => { const [x, y] = pos(i); return { id: 'flSt' + (i + 1), anchor: [n2(x + dx), n2(y + dy)], label: [lx, ly], side }; }),
    tools: ctl.tools.concat([{ id: 'tbl:flCycle', label: 'مراحل دورة الحياة (ص58)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k);
      const d = a.el('#flCycDot'); if (d && !still){ const aa = ang(STG.T * n); d.setAttribute('opacity', 1); d.setAttribute('cx', n2(CX + R * Math.cos(aa))); d.setAttribute('cy', n2(CY + R * Math.sin(aa))); }
    }
  };
}

/* ───────── 4) المرحلة الأولى: المتك وتكوين حبوب اللقاح (ص59–61) ───────── */
const FL_POLLEN_STAGES = [
  { n: '1 · تركيب المتك', d: 'يتألف المتك من فصين متطاولين يربط بينهما نسيج حشوي يمتد من قاعدة المتك حتى قمته ويحيط بحزمة وعائية (خشب ولحاء)، وكل فص يتألف من ردهتين كل منهما كيس اللقاح (حافظة الأبواغ الصغيرة) تحتوي في البداية على الخلايا الأم للأبواغ الصغيرة (2س).' },
  { n: '2 · انقسام اختزالي ← أربعة أبواغ صغيرة (س)', d: 'تمر الخلية الأم للأبواغ الصغيرة (2س) بعملية انقسام اختزالي فتتكون أربعة أبواغ صغيرة (س).' },
  { n: '3 · انفصال الأبواغ الصغيرة', d: 'تنفصل الأبواغ الصغيرة الأربعة بعضها عن بعض وتتخذ شكلاً مميزاً حسب نوع النبات.' },
  { n: '4 · حبة اللقاح: خلية أنبوبية + خلية مولدة (س)', d: 'تنقسم نواة البوغ الصغير انقساماً اعتيادياً وتحاط كل من النواتين بالسايتوبلازم مكوّنة خلية أنبوبية وخلية مولدة (س)، ويطلق عليها حبة اللقاح، وتمثل الطور المشيجي الذكري غير الناضج.' },
  { n: '5 · نضج المتك وانتشار حبوب اللقاح', d: 'عند نضج المتك تنحل خلايا النسيج الرابط بين ردهتي الفص الواحد فتصبح ردهة واحدة مفتوحة للخارج بشق طولي، وتنتشر حبوب اللقاح بالمئات. حبة اللقاح محاطة بجدار سميك ذي أشواك أو أهداب أو خشن، فيه مناطق رقيقة تدعى ثقوب الإنبات.' }
];
function flPollen(still){
  const X = 720;
  /* السداة الكاملة (ص61) */
  const antherW = `<ellipse cx="452" cy="104" rx="13" ry="42" fill="#d98a2b" stroke="#ffd08a" stroke-width="2"/><ellipse cx="472" cy="104" rx="13" ry="42" fill="#c97a22" stroke="#ffd08a" stroke-width="2"/>` +
    `<line x1="462" y1="66" x2="462" y2="142" stroke="#8a4f12" stroke-width="2"/>`;
  const filW = `<path d="M462,146 Q468,196 458,250" fill="none" stroke="#e8e070" stroke-width="6" stroke-linecap="round"/>`;
  const cut = `<line x1="428" y1="104" x2="500" y2="104" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 4" opacity=".7"/>` +
    `<path d="M500,112 Q540,170 520,272" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-dasharray="6 5"/><path d="M520,280 l-7,-12 l13,1z" fill="rgba(255,255,255,.7)"/>`;
  /* مقطع عرضي في متك فتي: فصان، كل فص ردهتان (أكياس اللقاح) */
  const outline = smoothClosed([[430, 338], [460, 304], [505, 290], [545, 305], [556, 335], [540, 365], [556, 400], [545, 432], [505, 450], [460, 436], [430, 402],
    [400, 436], [355, 450], [315, 432], [304, 400], [320, 365], [304, 335], [315, 305], [355, 290], [400, 304]]);
  const rr = rng(57);
  let epi = ''; for (let i = 0; i < 26; i++){ const a = i / 26 * 6.283; epi += `<circle cx="${n2(430 + Math.cos(a) * 112 * (1 + (rr() - 0.5) * 0.05))}" cy="${n2(370 + Math.sin(a) * 66)}" r="4.5" fill="none" stroke="#b6e6a2" stroke-width="1" opacity=".5"/>`; }
  const SAC = [[355, 328], [355, 412], [505, 328], [505, 412]];
  const sacs = SAC.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="31" ry="24" fill="#2f6b3a" stroke="#b8e8a8" stroke-width="2"/>` +
    [[-12, -6], [4, -9], [16, 2], [-4, 7], [-16, 6], [10, 12]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="5.5" fill="#d64a3a" stroke="#ffb0a0" stroke-width=".8"/>`).join('')).join('');
  const conn = `<ellipse cx="430" cy="370" rx="36" ry="30" fill="#9ad486" stroke="#d8f5c8" stroke-width="1.4"/>`;
  const vasc = `<circle cx="430" cy="370" r="11" fill="#3d7f9e" stroke="#cfe8f5" stroke-width="1.6"/><circle cx="427" cy="367" r="3" fill="#cfe8f5"/><circle cx="434" cy="373" r="2.4" fill="#cfe8f5"/>`;
  /* متك ناضج: ردهة واحدة في كل فص، مفتوحة بشق طولي */
  const mOut = `<ellipse cx="362" cy="562" rx="64" ry="42" fill="#6fb85e" stroke="#d4f5c0" stroke-width="2.2"/><ellipse cx="498" cy="562" rx="64" ry="42" fill="#6fb85e" stroke="#d4f5c0" stroke-width="2.2"/>` +
    `<ellipse cx="430" cy="562" rx="24" ry="26" fill="#9ad486" stroke="#d8f5c8" stroke-width="1.4"/><circle cx="430" cy="562" r="8" fill="#3d7f9e"/>` +
    `<ellipse cx="364" cy="566" rx="46" ry="28" fill="#1f4a2a"/><ellipse cx="496" cy="566" rx="46" ry="28" fill="#1f4a2a"/>`;
  const slit = `<path d="M318,536 L330,546 L322,530" fill="#10251a" stroke="#ffe08a" stroke-width="2"/><path d="M542,536 L530,546 L538,530" fill="#10251a" stroke="#ffe08a" stroke-width="2"/>`;
  const rp = rng(91); let pin = '';
  [364, 496].forEach(cx => { for (let i = 0; i < 12; i++) pin += `<circle cx="${n2(cx - 36 + rp() * 72)}" cy="${n2(552 + rp() * 28)}" r="3.6" fill="#ffd35a" stroke="#a5781a" stroke-width=".6"/>`; });
  let esc = ''; for (let i = 0; i < 10; i++){ const L = i % 2, p = (i * 0.1) % 1;
    esc += `<circle class="flEsc" data-i="${i}" data-l="${L}" cx="${n2(L ? 538 + p * 50 : 322 - p * 50)}" cy="${n2(530 - p * 60)}" r="3.6" fill="#ffd35a" stroke="#a5781a" stroke-width=".6" opacity="${still ? 0.8 : 0}"/>`; }
  /* مخطط تكوين حبة اللقاح (ص61 للاطلاع) */
  const mother = `<circle cx="${X}" cy="95" r="28" fill="${FLC.mother}" stroke="#ffc0b0" stroke-width="2"/><circle cx="${X}" cy="95" r="10" fill="#6a1a1a"/>`;
  const spore = (x, y) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="13" fill="${FLC.mega}" stroke="${FLC.megaL}" stroke-width="1.6"/><circle cx="${n2(x)}" cy="${n2(y)}" r="3.6" fill="#5a2a0a"/>`;
  const tetra = [[-13, -13], [13, -13], [-13, 13], [13, 13]].map(([dx, dy]) => spore(X + dx, 190 + dy)).join('');
  const sepS = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => `<g class="flSep" data-sx="${sx}" data-sy="${sy}" transform="translate(${n2(sx * 30)},${n2(sy * 22)})">${spore(X, 300)}</g>`).join('');
  const grain = `<circle cx="${X}" cy="420" r="36" fill="${FLC.pollen}" stroke="#ffe7b0" stroke-width="2.4"/>`;
  const tube = `<line class="flTubeN" x1="${X - 28}" y1="426" x2="${X - 6}" y2="426" stroke="#d0302a" stroke-width="5" stroke-linecap="round"/>`;
  const gen = `<circle class="flGenN" cx="${X + 16}" cy="410" r="7.5" fill="#e3237a" stroke="#ffc0dc" stroke-width="1.4"/>`;
  let spikes = ''; for (let i = 0; i < 24; i++){ const a = i / 24 * 6.283; if (i % 8 === 2) continue;
    spikes += `<path d="M${n2(X + Math.cos(a - 0.08) * 40)},${n2(560 + Math.sin(a - 0.08) * 40)} L${n2(X + Math.cos(a) * 49)},${n2(560 + Math.sin(a) * 49)} L${n2(X + Math.cos(a + 0.08) * 40)},${n2(560 + Math.sin(a + 0.08) * 40)}" fill="#e09a2a" stroke="#ffd890" stroke-width=".8"/>`; }
  const wall = `${spikes}<circle cx="${X}" cy="560" r="40" fill="#f5b84a" stroke="#c9801a" stroke-width="5"/><circle cx="${X}" cy="560" r="33" fill="${FLC.pollen}"/>` +
    `<line x1="${X - 22}" y1="566" x2="${X - 2}" y2="566" stroke="#d0302a" stroke-width="4.5" stroke-linecap="round"/><circle cx="${X + 14}" cy="550" r="6.5" fill="#e3237a"/>`;
  const pores = [2, 10, 18].map(i => { const a = i / 24 * 6.283; return `<ellipse cx="${n2(X + Math.cos(a) * 40)}" cy="${n2(560 + Math.sin(a) * 40)}" rx="5" ry="3" transform="rotate(${n2(a * 57.3 + 90)} ${n2(X + Math.cos(a) * 40)} ${n2(560 + Math.sin(a) * 40)})" fill="#fff3cf" stroke="#c9801a" stroke-width="1"/>`; }).join('');
  const cap = (x, y, t, st) => `<g data-st="${st}"><text class="cap sm" x="${x}" y="${y}" text-anchor="middle">${t}</text></g>`;
  const body = `
    <g data-st="0">${part('flAnther', antherW)}${part('flFilament', filW)}${cut}</g>
    <g data-st="0">${part('flLobe', `<path d="${outline}" fill="#6fb85e" stroke="#d4f5c0" stroke-width="2.4"/>${epi}`)}
      ${part('flPollenSac', sacs)}${part('flConnective', conn)}${part('flVascular', vasc)}</g>
    ${flArrow(430, 456, 430, 512, 4)}${cap(500, 486, 'عند النضوج', 4)}
    <g data-st="4">${mOut}${part('flSlit', slit)}${part('flPollenGrains', pin + `<g>${esc}</g>`)}</g>
    ${part('flMicroMother', `<g data-st="0">${mother}</g>`)}
    ${flArrow(X, 126, X, 162, 1)}${cap(640, 148, 'انقسام اختزالي', 1)}
    ${part('flMicrospores', `<g data-st="1">${tetra}</g>`)}
    ${flArrow(X, 220, X, 262, 2)}${cap(640, 245, 'انفصال الأبواغ', 2)}
    <g data-st="2">${sepS}</g>
    ${flArrow(X, 334, X, 376, 3)}${cap(632, 358, 'انقسام اعتيادي للنواة', 3)}
    <g data-st="3">${part('flPollen', grain)}${part('flTubeCell', tube)}${part('flGenCell', gen)}</g>
    ${flArrow(X, 462, X, 500, 4)}${cap(640, 484, 'الانتشار', 4)}
    <g data-st="4">${part('flPollenWall', wall)}${part('flGermPore', pores)}</g>
    <text class="cap sm" x="500" y="645" text-anchor="middle">تركيب المتك في نبات زهري (ص59) ومراحل تكوين حبة اللقاح (ص61): خلية أم (2س) ← 4 أبواغ صغيرة (س) ← حبة لقاح (س)</text>`;
  const ctl = stageCtl(FL_POLLEN_STAGES, { dur: 30 });
  return {
    body, stages: FL_POLLEN_STAGES, fnParts: ['flMicroMother', 'flSlit', 'flGermPore'],
    parts: [
      { id: 'flAnther', anchor: [486, 86], label: [575, 62], side: 'C' },
      { id: 'flFilament', anchor: [464, 210], label: [568, 214], side: 'C' },
      { id: 'flLobe', anchor: [306, 340], label: [134, 290], side: 'L' },
      { id: 'flPollenSac', anchor: [326, 414], label: [134, 345], side: 'L' },
      { id: 'flConnective', anchor: [404, 388], label: [134, 400], side: 'L' },
      { id: 'flVascular', anchor: [424, 378], label: [134, 455], side: 'L' },
      { id: 'flSlit', anchor: [320, 534], label: [134, 520], side: 'L' },
      { id: 'flPollenGrains', anchor: [340, 568], label: [134, 585], side: 'L' },
      { id: 'flMicroMother', anchor: [X + 28, 95], label: [866, 95], side: 'R' },
      { id: 'flMicrospores', anchor: [X + 26, 190], label: [866, 190], side: 'R' },
      { id: 'flGenCell', anchor: [X + 23, 408], label: [866, 392], side: 'R' },
      { id: 'flTubeCell', anchor: [X - 10, 428], label: [866, 448], side: 'R' },
      { id: 'flPollen', anchor: [X + 26, 446], label: [866, 498], side: 'R' },
      { id: 'flPollenWall', anchor: [X + 46, 548], label: [866, 545], side: 'R' },
      { id: 'flGermPore', anchor: [X + 29, 588], label: [866, 600], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:flOrigin', label: 'المنشأ والمجموعة الكروموسومية (ص66)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      const idx = still ? 9 : STG.idx, k = still ? 1 : STG.k;
      stageShow(a, idx, k);
      /* انفصال الأبواغ الأربعة تدريجياً */
      const s = idx > 2 ? 1 : idx < 2 ? 0 : flSm(flCl(k * 1.4));
      a.all('.flSep').forEach(g => g.setAttribute('transform', `translate(${n2(+g.dataset.sx * (13 + 17 * s))},${n2(+g.dataset.sy * (13 + 9 * s))})`));
      /* انقسام نواة البوغ الصغير: النواتان تتباعدان */
      const m = idx > 3 ? 1 : idx < 3 ? 0 : flSm(flCl(k * 1.6));
      const tb = a.el('.flTubeN'), gn = a.el('.flGenN');
      if (tb){ tb.setAttribute('x1', n2(X - 6 - 22 * m)); tb.setAttribute('x2', n2(X + 6 - 12 * m)); }
      if (gn){ gn.setAttribute('cx', n2(X + 16 * m)); gn.setAttribute('cy', n2(418 - 8 * m)); }
      /* حبوب اللقاح تنتشر من الشق الطولي */
      if (!still) a.all('.flEsc').forEach(c => { const i = +c.dataset.i, L = +c.dataset.l, p = (t * 0.3 + i * 0.1) % 1;
        c.setAttribute('cx', n2(L ? 538 + p * 60 : 322 - p * 60)); c.setAttribute('cy', n2(532 - p * 70 + Math.sin(p * 9 + i) * 5));
        c.setAttribute('opacity', idx >= 4 ? n2(Math.sin(p * Math.PI)) : 0); });
    }
  };
}

/* ───────── 5) المرحلة الثانية: المبيض وتكوين البويضات (ص64–67) ───────── */
const FL_OVULE_STAGES = [
  { n: '1 · الجويزاء وأغلفة البويض', d: 'يبدأ نمو البويض بشكل نتوء صغير يعرف بالجويزاء يتصل بجدار المبيض عن طريق الحبل السري، ويحاط بغلاف أو غلافين من خلايا حشوية (أغلفة البويض) تحيط به إحاطة تامة باستثناء القمة حيث تترك فتحة صغيرة جداً هي فتحة النقير.' },
  { n: '2 · الخلية الأم للأبواغ الكبيرة (2س) ← 4 أبواغ كبيرة (س)', d: 'تتولد داخل الجويزاء خلية تعرف بالخلية الأم للأبواغ الكبيرة (2س) تمر بانقسام اختزالي لتكوّن أربعة أبواغ كبيرة (س) مرتبة في صف واحد.' },
  { n: '3 · البوغ الكبير الفعال (الكيس الجنيني)', d: 'تضمحل ثلاثة أبواغ كبيرة ويبقى الرابع بوغاً فعالاً كبيراً يمثل الطور المشيجي الأنثوي غير الناضج (الكيس الجنيني)، ويزداد حجمه حتى يحتل الجزء الأكبر من البويض.' },
  { n: '4 · ثلاثة انقسامات اعتيادية ← 8 نوى', d: 'تعاني نواة الكيس الجنيني ثلاثة انقسامات اعتيادية متتالية ينتج عنها ثمان نوى: ثلاث في الطرف النقيري، وثلاث في الطرف المقابل، واثنتان في المركز.' },
  { n: '5 · خلية البيضة والخليتان المساعدتان', d: 'تحاط نوى الطرف النقيري الثلاث بأغشية خلوية: الوسطى خلية البيضة، والجانبيتان خليتان مساعدتان.' },
  { n: '6 · الخلايا السمتية الثلاث', d: 'نوى الطرف المقابل للطرف النقيري تحاط هي الأخرى بأغشية خلوية وتكوّن ثلاث خلايا سمتية (س).' },
  { n: '7 · النواتان القطبيتان — كيس جنيني ناضج', d: 'تكون النواتان المركزيتان نواتين قطبيتين، وعندها يمثل الكيس الجنيني الطور المشيجي الأنثوي الناضج.' },
  { n: '8 · البويض الناضج', d: 'يصبح البويض الناضج مكوناً من: كيس جنيني ناضج، الجويزاء، أغلفة البويض، الحبل السري. ويكون منحنياً إلى الأسفل بحيث يكون النقير مجاوراً للحبل السري.' }
];
/* جدار المبيض (قارورة) — إحداثيات محلية حول (0,0) */
const flOvWall = () => `<path d="M-14,-165 L-14,-130 C-60,-110 -115,-70 -112,0 C-110,80 -70,150 0,158 C70,150 110,80 112,0 C115,-70 60,-110 14,-130 L14,-165" fill="none" stroke="${FLC.wall}" stroke-width="16" stroke-linecap="round"/>` +
  `<path d="M-14,-165 L-14,-130 C-60,-110 -115,-70 -112,0 C-110,80 -70,150 0,158 C70,150 110,80 112,0 C115,-70 60,-110 14,-130 L14,-165" fill="none" stroke="${FLC.wallL}" stroke-width="2" opacity=".6"/>`;
const flBump = () => `<ellipse cx="0" cy="146" rx="18" ry="10" fill="#f5a3b0"/>`;
/* البويض: جويزاء + غلافان مع فتحة نقير (gapAt -90 للأعلى، 90 للأسفل عند الانقلاب) */
const flNucel = (inv) => `<ellipse cx="0" cy="10" rx="54" ry="88" fill="${FLC.nuc}" stroke="#a9d46a" stroke-width="1.4"/>`;
const flIntegs = (inv) => `<path d="${flArc(0, 10, 70, 104, 13, inv ? 90 : -90)}" fill="none" stroke="${FLC.integD}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="${flArc(0, 10, 60, 95, 15, inv ? 90 : -90)}" fill="none" stroke="${FLC.integ}" stroke-width="7" stroke-linecap="round"/>`;
const flFuniShort = () => `<path d="M-7,112 L-8,142 L8,142 L7,112Z" fill="#f08aa0"/>`;
function flOvule(still){
  const S = 0.42, MY = 140, MX = [745, 620, 495, 370];
  const mini = (i, inner) => `<g transform="translate(${MX[i]},${MY}) scale(${S})">${inner}</g>`;
  const mp = (i, lx, ly) => [n2(MX[i] + lx * S), n2(MY + ly * S)];
  const shell = flNucel() + flIntegs() + flFuniShort();
  const sp = (x, y, r, cls) => `<g class="${cls || ''}"><circle cx="${x}" cy="${y}" r="${r}" fill="${FLC.mega}" stroke="${FLC.megaL}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${n2(r * 0.34)}" fill="#5a2a0a"/></g>`;
  /* اللوحات الصغيرة 1–4 (ص67) */
  const P1 = mini(0, `<g data-st="0">${part('flCarpel', flOvWall())}${flBump()}${part('flMegaSporangium', `<circle cx="0" cy="116" r="28" fill="#8ee04a" stroke="#d6ffb0" stroke-width="3"/>`)}</g>`);
  const P2 = mini(1, `<g data-st="0">${flOvWall()}${flBump()}${shell}</g>` + part('flMegaMother', `<g data-st="1"><circle cx="0" cy="20" r="14" fill="${FLC.mother}" stroke="#ffc0b0" stroke-width="2.4"/><circle cx="0" cy="20" r="5" fill="#4a0a0a"/></g>`));
  const P3 = mini(2, `<g data-st="1">${flOvWall()}${flBump()}${shell}${part('flMegaspores', sp(0, -30, 11, 'flDeg') + sp(0, -6, 11, 'flDeg') + sp(0, 18, 11, 'flDeg') + sp(0, 42, 11))}</g>`);
  const P4 = mini(3, `<g data-st="2">${flOvWall()}${flBump()}${shell}${part('flFuncMega', `<circle cx="0" cy="12" r="42" fill="${FLC.mega}" stroke="${FLC.megaL}" stroke-width="3"/><circle cx="0" cy="12" r="12" fill="#8a3a10"/>`)}</g>`);
  /* اللوحة 5: الكيس الجنيني الناضج (البويض قائم) */
  const C5 = [420, 455], C6 = [690, 455];
  const NUC = [ // [نهائي x,y] ، اللون
    [0, -24, FLC.eggN, 6.5], [-15, -38, FLC.synN, 5], [15, -38, FLC.synN, 5], [-8, 8, FLC.pol, 6], [-15, 52, FLC.antN, 5], [0, 58, FLC.antN, 5], [15, 52, FLC.antN, 5], [8, 8, FLC.pol, 6]];
  const nuc = i => `<circle class="flNu" data-i="${i}" data-st="3" cx="${NUC[i][0]}" cy="${NUC[i][1]}" r="${NUC[i][3]}" fill="${NUC[i][2]}" stroke="#fff" stroke-width="1"/>`;
  const cell = (x, y, r, f, st) => `<circle data-st="${st}" cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="#fff4e8" stroke-width="1.4"/>`;
  const sacE = `<ellipse cx="0" cy="10" rx="36" ry="70" fill="${FLC.sac}" stroke="#e9d79a" stroke-width="2"/><ellipse data-st="6" cx="0" cy="10" rx="40" ry="74" fill="none" stroke="${FLC.gold}" stroke-width="2.4" stroke-dasharray="5 4"/>`;
  const inner5 = `<g data-st="3">${flOvWall()}${flBump()}${flNucel()}${flFuniShort()}</g>` +
    `<g data-st="3">${part('flMicropyle', flIntegs() + `<path d="M0,-118 L0,-100" stroke="${FLC.gold}" stroke-width="3"/><path d="M-5,-104 L0,-96 L5,-104" fill="none" stroke="${FLC.gold}" stroke-width="2.4"/>`)}</g>` +
    `<g data-st="3">${part('flEmbSac', sacE)}</g>` +
    part('flSynergid', cell(-15, -38, 11, FLC.syn, 4) + cell(15, -38, 11, FLC.syn, 4) + nuc(1) + nuc(2)) +
    part('flEgg', cell(0, -24, 14, FLC.egg, 4) + nuc(0)) +
    part('flPolar', `<ellipse data-st="6" cx="0" cy="8" rx="20" ry="11" fill="none" stroke="#9fd0ff" stroke-width="2"/>` + nuc(3) + nuc(7)) +
    part('flAntipodal', cell(-15, 52, 10, FLC.ant, 5) + cell(0, 58, 10, FLC.ant, 5) + cell(15, 52, 10, FLC.ant, 5) + nuc(4) + nuc(5) + nuc(6));
  const P5 = `<g transform="translate(${C5[0]},${C5[1]})">${inner5}</g>`;
  /* اللوحة 6: البويض الناضج المنحني (النقير مجاور للحبل السري) */
  const fy = y => 20 - y;
  const inner6 = `${part('flOvaryWall', flOvWall())}${flBump()}` +
    part('flOvuleM', part('flNucellus', flNucel(true)) + part('flInteg', flIntegs(true)) +
      `<ellipse cx="0" cy="10" rx="36" ry="70" fill="${FLC.sac}" stroke="#e9d79a" stroke-width="2"/>` +
      [[-15, -38, 11, FLC.syn], [15, -38, 11, FLC.syn], [0, -24, 14, FLC.egg], [-15, 52, 10, FLC.ant], [0, 58, 10, FLC.ant], [15, 52, 10, FLC.ant]].map(([x, y, r, f]) => `<circle cx="${x}" cy="${fy(y)}" r="${r}" fill="${f}" stroke="#fff4e8" stroke-width="1.4"/>`).join('') +
      NUC.map(([x, y, c, r]) => `<circle cx="${x}" cy="${fy(y)}" r="${r}" fill="${c}" stroke="#fff" stroke-width="1"/>`).join('')) +
    part('flFunicle', `<path d="M-6,142 C-80,136 -92,60 -88,-10 C-86,-80 -50,-114 0,-96" fill="none" stroke="#f08aa0" stroke-width="12" stroke-linecap="round"/>`);
  const P6 = `<g data-st="7"><g transform="translate(${C6[0]},${C6[1]})">${inner6}</g></g>`;
  const body = `
    ${P1}${flArrow(690, MY, 674, MY, 0)}${P2}${flArrow(565, MY, 549, MY, 1)}${P3}${flArrow(440, MY, 424, MY, 2)}${P4}
    ${flArrow(372, 212, 404, 282, 3)}${P5}${flArrow(546, 455, 566, 455, 7)}${P6}
    <text class="cap sm" x="500" y="645" text-anchor="middle">نمو البويض وتكوين الكيس الجنيني (ص64–67): خلية أم (2س) ← 4 أبواغ كبيرة (س) ← بوغ فعال ← 8 نوى ← كيس جنيني ناضج</text>`;
  const ctl = stageCtl(FL_OVULE_STAGES, { dur: 44 });
  const ab = (c, lx, ly) => [n2(c[0] + lx), n2(c[1] + ly)];
  /* مواقع النوى عبر الانقسامات الاعتيادية الثلاثة */
  const G1 = [[0, -26], [0, 46]], G2 = [[-10, -30], [10, -22], [-10, 42], [10, 50]];
  const lerp = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
  return {
    body, stages: FL_OVULE_STAGES, fnParts: ['flFuncMega', 'flPolar', 'flMicropyle'],
    parts: [
      { id: 'flCarpel', anchor: mp(0, 112, -10), label: [866, 105], side: 'R' },
      { id: 'flMegaSporangium', anchor: mp(0, 0, 144), label: [745, 240], side: 'C', short: 'حافظة الأبواغ الكبيرة' },
      { id: 'flMegaMother', anchor: mp(1, 0, 34), label: [620, 240], side: 'C', short: 'الخلية الأم (2س)' },
      { id: 'flMegaspores', anchor: mp(2, 0, 53), label: [495, 240], side: 'C', short: 'أبواغ كبيرة (س)' },
      { id: 'flFuncMega', anchor: mp(3, 0, 54), label: [370, 240], side: 'C', short: 'البوغ الفعال' },
      { id: 'flMicropyle', anchor: ab(C5, -4, -100), label: [134, 300], side: 'L' },
      { id: 'flSynergid', anchor: ab(C5, -24, -40), label: [134, 355], side: 'L' },
      { id: 'flEgg', anchor: ab(C5, -10, -20), label: [134, 410], side: 'L' },
      { id: 'flPolar', anchor: ab(C5, -14, 8), label: [134, 460], side: 'L' },
      { id: 'flAntipodal', anchor: ab(C5, -24, 54), label: [134, 510], side: 'L' },
      { id: 'flEmbSac', anchor: ab(C5, -35, 28), label: [134, 565], side: 'L' },
      { id: 'flFunicle', anchor: ab(C6, -88, -10), label: [866, 290], side: 'R' },
      { id: 'flOvaryWall', anchor: ab(C6, 110, -40), label: [866, 345], side: 'R' },
      { id: 'flInteg', anchor: ab(C6, 66, -20), label: [866, 400], side: 'R' },
      { id: 'flNucellus', anchor: ab(C6, 46, 40), label: [866, 460], side: 'R' },
      { id: 'flOvuleM', anchor: ab(C6, 40, 96), label: [866, 545], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'info:flNucellus', label: 'الجويزاء (وزاري)' }, { id: 'tbl:flOrigin', label: 'المنشأ والمجموعة الكروموسومية (ص66)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      const idx = still ? 9 : STG.idx, k = still ? 1 : STG.k;
      stageShow(a, idx, k);
      /* اضمحلال ثلاثة أبواغ كبيرة */
      a.all('.flDeg').forEach(g => g.setAttribute('opacity', idx >= 2 ? '0.25' : '1'));
      /* النوى: 1 ← 2 ← 4 ← 8 */
      a.all('.flNu').forEach(c => { const i = +c.dataset.i, F = [NUC[i][0], NUC[i][1]];
        let p;
        if (idx > 3) p = F;
        else if (idx < 3) p = [0, 10];
        else { const u1 = flSm(flCl((k - 0.04) / 0.26)), u2 = flSm(flCl((k - 0.36) / 0.26)), u3 = flSm(flCl((k - 0.68) / 0.26));
          p = u3 > 0 ? lerp(G2[i >> 1], F, u3) : u2 > 0 ? lerp(G1[i >> 2], G2[i >> 1], u2) : lerp([0, 10], G1[i >> 2], u1); }
        c.setAttribute('cx', n2(p[0])); c.setAttribute('cy', n2(p[1])); });
    }
  };
}

