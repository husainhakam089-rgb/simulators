/* ══════════════════════════════════════════════════════════════════════════
   4.8 · التكاثر في الإنسان والدورة الحيضية — ملزمة ص105–129
         الجهاز الذكري (ص106)، النطفة (ص107)، الجهاز الأنثوي (ص111)، الإخصاب
         والحمل (ص112–113)، الدورة المبيضية والرحمية (ص117–121)، التكاثر العذري
         (ص122–124)، التكاثر الخنثي (ص125)
   ══════════════════════════════════════════════════════════════════════════ */
const HU_VIEWS = [
  { id: 'huvMale', label: 'الجهاز الذكري' },
  { id: 'huvSperm', label: 'تركيب النطفة' },
  { id: 'huvFemale', label: 'الجهاز الأنثوي' },
  { id: 'huvFert', label: 'الإخصاب والحمل' }
];
const CY_VIEWS = [
  { id: 'cyvMens', label: 'الدورة المبيضية والرحمية' },
  { id: 'cyvOv', label: 'أحداث الدورة المبيضية' },
  { id: 'cyvParth', label: 'التكاثر العذري' },
  { id: 'cyvHerm', label: 'التكاثر الخنثي' }
];
const HUC = { test: '#f2a48e', testS: '#ffd9cc', epi: '#d0606e', epiL: '#ee8c98', vas: '#ec8a96', vasD: '#b8505e', blad: '#f6b6b2', bladS: '#ffe0dc',
  ureter: '#f2a24a', semv: '#e57584', prost: '#8a2a44', pen: '#f0a3a0', ureth: '#5a1020', cowp: '#f8c4ca',
  wall: '#f5b5b8', wallS: '#ffdfe2', lin: '#d9606e', cav: '#8e1a30', tube: '#c0384c', tubeL: '#f6c0c6', ovary: '#f6f1e6', ovS: '#d6c6a8',
  egg: '#ffe08a', yellow: '#f2c14e', est: '#ff8fc0', prog: '#ffd166', fsh: '#7fb2ff', lh: '#c79bff' };

SCENES.human = {
  title: 'التكاثر في الإنسان',
  get src(){ return ({ huvMale: 'ملزمة ص105–106', huvSperm: 'ملزمة ص107', huvFemale: 'ملزمة ص109–111', huvFert: 'ملزمة ص112–113' })[SEL.huv] || 'ملزمة ص105'; },
  tint: ['rgba(190,90,110,.26)', 'rgba(90,110,170,.16)'],
  build(){
    const v = HU_VIEWS.some(x => x.id === SEL.huv) ? SEL.huv : 'huvMale';
    const s = v === 'huvSperm' ? huSperm() : v === 'huvFemale' ? huFemale() : v === 'huvFert' ? huFert() : huMale();
    s.rebuildOnRadio = 'huv';
    s.tools = HU_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'huv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.cycle = {
  title: 'الدورة الحيضية والتكاثر العذري والخنثي',
  get src(){ return ({ cyvMens: 'ملزمة ص117–121', cyvOv: 'ملزمة ص118–119', cyvParth: 'ملزمة ص122–124', cyvHerm: 'ملزمة ص125' })[SEL.cyv] || 'ملزمة ص117'; },
  tint: ['rgba(170,90,140,.24)', 'rgba(120,100,170,.16)'],
  build(){
    const v = CY_VIEWS.some(x => x.id === SEL.cyv) ? SEL.cyv : 'cyvMens';
    const s = v === 'cyvOv' ? huOvCycle() : v === 'cyvParth' ? huParth() : v === 'cyvHerm' ? huHerm() : huMens();
    s.rebuildOnRadio = 'cyv';
    s.tools = CY_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'cyv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.hu_male = { title: 'الجهاز التناسلي الذكري في الإنسان', build: s => huMale(s) };
SCENES.hu_sperm = { title: 'نطفة الإنسان الناضجة', build: s => huSperm(s) };
SCENES.hu_female = { title: 'الجهاز التناسلي الأنثوي في الإنسان', build: s => huFemale(s) };
SCENES.hu_fert = { title: 'الإخصاب والحمل في الإنسان', build: s => huFert(s) };
SCENES.hu_mens = { title: 'الدورة المبيضية والرحمية (1-28 يوم)', build: s => huMens(s) };
SCENES.hu_ovc = { title: 'أحداث الدورة المبيضية — شكل (3-41)', build: s => huOvCycle(s) };
SCENES.hu_parth = { title: 'التكاثر العذري', build: s => huParth(s) };
SCENES.hu_herm = { title: 'التكاثر الخنثي', build: s => huHerm(s) };

/* ───────── أدوات مشتركة ───────── */
const huTube = (P, col, w, extra) => `<path d="${smoothOpen(P)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra || ''}/>`;
const huMir = P => P.map(([x, y]) => [1000 - x, y]);
/* أجسام متحركة على مسار (نطف، إفرازات، هرمونات) */
function huMov(id, pts, n, mk){
  return { id, n, P: prepPath(pts), svg: `<g id="${id}" pointer-events="none">${Array.from({ length: n }, (_, i) => `<g>${mk(i)}</g>`).join('')}</g>` };
}
function huMovTick(a, m, t, sp, fn){
  const P = m.P;
  a.all('#' + m.id + ' > g').forEach((g, i) => {
    const d = ((t * sp + i * P.len / m.n) % P.len + P.len) % P.len;
    const p = alongPath(P, d), q = alongPath(P, Math.min(P.len, d + 3));
    const ang = (q[0] === p[0] && q[1] === p[1]) ? 0 : Math.atan2(q[1] - p[1], q[0] - p[0]) * 57.3;
    g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])}) rotate(${n2(ang)})`);
    g.setAttribute('opacity', n2(fn ? fn(p, d / P.len, i) : 1));
  });
}
/* نطفة صغيرة جداً متجهة نحو +x */
const huMiniSp = (c, k) => { k = k || 1; return `<ellipse rx="${n2(4 * k)}" ry="${n2(2.6 * k)}" fill="${c || '#fff'}"/><path d="M${n2(-4 * k)},0 q${n2(-4 * k)},${n2(-3 * k)} ${n2(-8 * k)},0 t${n2(-8 * k)},0" stroke="${c || '#fff'}" stroke-width="${n2(1.3 * k)}" fill="none"/>`; };
/* شكل مفصص (حويصلة منوية) */
function huLobe(cx, cy, rx, ry, rot, n, amp){
  const P = [];
  for (let i = 0; i < 40; i++){ const a = i / 40 * Math.PI * 2, r = 1 + amp * Math.cos(n * a), x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    P.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return smoothClosed(P);
}
const huClamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* قيمة منحنى من نقاط مفتاحية [يوم, قيمة] (استيفاء ناعم) */
function huCurve(K, d){
  if (d <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (d <= K[i][0]){ const u = (d - K[i - 1][0]) / (K[i][0] - K[i - 1][0]), s = u * u * (3 - 2 * u); return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * s; }
  return K[K.length - 1][1];
}

/* ───────── 1) الجهاز التناسلي الذكري — ملزمة ص106 ───────── */
function huMale(still){
  const epiL = [[318, 487], [290, 485], [266, 498], [252, 528], [250, 560], [258, 590]];
  const vasL = [[258, 592], [236, 577], [228, 520], [226, 420], [230, 300], [242, 190], [266, 112], [306, 86], [350, 100], [386, 152], [428, 222], [466, 258]];
  const epiR = huMir(epiL), vasR = huMir(vasL);
  const bladP = [[500, 100], [560, 106], [598, 138], [602, 190], [578, 234], [534, 254], [500, 258], [466, 254], [422, 234], [398, 190], [402, 138], [440, 106]];
  const testis = (x) => `<ellipse cx="${x}" cy="545" rx="48" ry="60" fill="${HUC.test}" stroke="${HUC.testS}" stroke-width="2.4"/>
    <path d="M${x - 20},${510} Q${x + 4},${545} ${x - 14},${590} M${x + 2},${500} Q${x + 24},${548} ${x + 6},${598} M${x + 22},${508} Q${x + 40},${545} ${x + 26},${585}" fill="none" stroke="#d98270" stroke-width="1.4" opacity=".75"/>`;
  const pen = `<path d="M470,342 L530,342 L548,382 L548,574 Q500,594 452,574 L452,382 Z" fill="${HUC.pen}" stroke="#ffd6d4" stroke-width="2.2"/>
    <path d="M462,392 L462,568 M472,388 L472,572 M528,388 L528,572 M538,392 L538,568" stroke="#d8787a" stroke-width="1.3" opacity=".8"/>`;
  const vesL = huLobe(440, 233, 48, 17, 0.62, 6, 0.15), vesR = huLobe(560, 233, 48, 17, -0.62, 6, 0.15);
  const mkSp = i => huMiniSp('#ffffff', 0.9);
  const spL = huMov('huSpL', [[300, 545], [305, 500]].concat(epiL, vasL.slice(1), [[488, 274], [500, 292], [500, 352], [500, 585]]), 7, mkSp);
  const spR = huMov('huSpR', [[700, 545], [695, 500]].concat(epiR, vasR.slice(1), [[512, 274], [500, 292], [500, 352], [500, 585]]), 7, mkSp);
  const dot = c => `<circle r="3" fill="${c}" stroke="#fff" stroke-width=".8"/>`;
  const secV = huMov('huSecV', [[440, 233], [470, 262], [500, 292], [500, 352], [500, 585]], 3, () => dot('#fff3a0'));
  const secP = huMov('huSecP', [[532, 300], [500, 322], [500, 352], [500, 585]], 3, () => dot('#bfe6ff'));
  const secC = huMov('huSecC', [[474, 360], [500, 366], [500, 585]], 2, () => dot('#bfffd0'));
  const body = `
    ${part('huUreter', `<path d="M392,36 Q400,95 432,128" fill="none" stroke="${HUC.ureter}" stroke-width="12" stroke-linecap="round"/><path d="M608,36 Q600,95 568,128" fill="none" stroke="${HUC.ureter}" stroke-width="12" stroke-linecap="round"/>`)}
    ${part('huVas', huTube(vasL, HUC.vasD, 10) + huTube(vasL, HUC.vas, 6) + huTube(vasR, HUC.vasD, 10) + huTube(vasR, HUC.vas, 6))}
    ${part('huBladder', `<path d="${smoothClosed(bladP)}" fill="${HUC.blad}" stroke="${HUC.bladS}" stroke-width="2.6"/>
      <path d="M446,140 Q500,122 554,140 M432,176 Q500,156 568,176 M446,212 Q500,196 554,212" fill="none" stroke="#e48c8c" stroke-width="1.6" opacity=".8"/>`)}
    ${part('huSemVes', `<path d="${vesL}" fill="${HUC.semv}" stroke="#ffd0d6" stroke-width="2"/><path d="${vesR}" fill="${HUC.semv}" stroke="#ffd0d6" stroke-width="2"/>`)}
    ${part('huProst', `<ellipse cx="500" cy="298" rx="54" ry="40" fill="${HUC.prost}" stroke="#e090a8" stroke-width="2.4"/><ellipse cx="486" cy="286" rx="18" ry="10" fill="#b0506a" opacity=".6"/>`)}
    ${part('huEjac', `<path d="M466,258 Q492,268 500,292 L500,354 M534,258 Q508,268 500,292" fill="none" stroke="#ffd6de" stroke-width="4.5" stroke-linecap="round"/>`)}
    ${part('huPenis', pen)}
    ${part('huUreth', `<path d="M500,354 L500,582" stroke="${HUC.ureth}" stroke-width="7" stroke-linecap="round"/>`)}
    ${part('huCowper', `<circle cx="474" cy="362" r="9" fill="${HUC.cowp}" stroke="#c0606e" stroke-width="1.8"/><circle cx="526" cy="362" r="9" fill="${HUC.cowp}" stroke="#c0606e" stroke-width="1.8"/>`)}
    ${part('huTestis', testis(300) + testis(700))}
    ${part('huEpid', huTube(epiL, HUC.epi, 15) + huTube(epiL, HUC.epiL, 9) + huTube(epiR, HUC.epi, 15) + huTube(epiR, HUC.epiL, 9))}
    ${still ? '' : spL.svg + spR.svg + secV.svg + secP.svg + secC.svg}
    <text class="cap sm" x="500" y="640" text-anchor="middle">الجهاز التناسلي الذكري في الإنسان (ص106): خصية ← بربخ ← قناة ناقلة ← قناة قاذفة ← الإحليل، وتضيف الغدد المساعدة السائل المنوي</text>`;
  return {
    body, fnParts: ['huTestis', 'huEpid', 'huVas', 'huSemVes', 'huProst', 'huCowper', 'huUreth'],
    parts: [
      { id: 'huUreter', anchor: [601, 71], label: [866, 62], side: 'R' },
      { id: 'huVas', anchor: [768, 260], label: [866, 140], side: 'R' },
      { id: 'huSemVes', anchor: [586, 230], label: [866, 220], side: 'R' },
      { id: 'huEjac', anchor: [502, 340], label: [866, 318], side: 'R' },
      { id: 'huUreth', anchor: [500, 450], label: [866, 420], side: 'R' },
      { id: 'huPenis', anchor: [548, 500], label: [866, 500], side: 'R' },
      { id: 'huBladder', anchor: [404, 160], label: [134, 140], side: 'L' },
      { id: 'huProst', anchor: [447, 300], label: [134, 290], side: 'L' },
      { id: 'huCowper', anchor: [466, 362], label: [134, 362], side: 'L' },
      { id: 'huEpid', anchor: [262, 500], label: [134, 455], side: 'L' },
      { id: 'huTestis', anchor: [300, 600], label: [134, 575], side: 'L' }
    ],
    tools: [{ id: 'info:huMaleSys', label: 'عن الجهاز الذكري' }, { id: 'info:huAccGl', label: 'الغدد المساعدة' }, { id: 'tbl:huMale', label: 'الأعضاء وعددها ووظيفتها (ص105-106)' }, { id: 'tbl:huWhoM', label: 'من المسؤول؟ (ص108-115)' }],
    tick(dt, t, a){
      if (still) return;
      const inBl = p => (p[0] > 404 && p[0] < 596 && p[1] > 100 && p[1] < 256) ? 0.22 : 1;
      huMovTick(a, spL, t, 46, (p, u) => inBl(p) * (u > 0.96 ? (1 - u) * 25 : 1));
      huMovTick(a, spR, t, 46, (p, u) => inBl(p) * (u > 0.96 ? (1 - u) * 25 : 1));
      huMovTick(a, secV, t, 34, (p, u) => u > 0.95 ? (1 - u) * 20 : 1);
      huMovTick(a, secP, t, 30, (p, u) => u > 0.95 ? (1 - u) * 20 : 1);
      huMovTick(a, secC, t, 28, (p, u) => u > 0.95 ? (1 - u) * 20 : 1);
    }
  };
}

/* ───────── 2) نطفة الإنسان الناضجة — ملزمة ص107 ───────── */
function huTailD(t, x0, y0, len){
  const N = 26, L = [], R = [];
  for (let i = 0; i <= N; i++){
    const u = i / N, y = y0 + u * len, w = Math.sin(u * 7.5 - t * 6) * 16 * Math.pow(u, 1.1);
    const dw = Math.cos(u * 7.5 - t * 6) * 16 * 7.5 / len * Math.pow(u, 1.1), hw = 4.2 * (1 - u) + 0.8;
    const nx = 1 / Math.sqrt(1 + dw * dw), ny = -dw * nx;
    L.push([x0 + w - nx * hw, y - ny * hw]); R.push([x0 + w + nx * hw, y + ny * hw]);
  }
  return smoothOpen(L) + ' L' + R.reverse().map(p => n2(p[0]) + ',' + n2(p[1])).join(' L') + 'Z';
}
function huSperm(still){
  const head = smoothClosed([[500, 72], [548, 90], [567, 140], [563, 200], [540, 245], [512, 266], [488, 266], [460, 245], [437, 200], [433, 140], [452, 90]]);
  let coil = ''; for (let y = 300; y <= 392; y += 9) coil += `<ellipse cx="500" cy="${y}" rx="19" ry="4.2" fill="none" stroke="${HUC.yellow}" stroke-width="2.6"/>`;
  /* إطار جانبي: عمل الجسيم الطرفي عند سطح البيضة */
  const inset = `<g pointer-events="none">
    <rect x="610" y="430" width="240" height="170" rx="14" fill="rgba(255,224,138,.06)" stroke="rgba(255,224,138,.35)" stroke-dasharray="6 6"/>
    <path d="M622,598 Q730,500 846,548 L846,598 Z" fill="#ffe9b0" opacity=".85"/>
    <path id="huMem1" d="M622,590 Q730,492 846,540" fill="none" stroke="#9fd8ff" stroke-width="5" opacity=".9"/>
    <path d="M622,576 Q730,478 846,526" fill="none" stroke="#bde6ff" stroke-width="3" stroke-dasharray="5 4" opacity=".8"/>
    <circle id="huHole" cx="715" cy="522" r="12" fill="#ffe9b0" opacity="0"/>
    <g id="huEnz">${[[-10, -6], [6, -12], [12, 2], [-4, 8], [0, -2]].map(([dx, dy]) => `<circle cx="${715 + dx}" cy="${514 + dy}" r="2.6" fill="${HUC.egg}"/>`).join('')}</g>
    <g id="huMiniSperm">${spermSvg(700, 500, 0.75, -2.2, 'swim', 3)}</g>
    <text class="cap sm" x="730" y="452" text-anchor="middle">الجسيم الطرفي يحلل أغشية البيضة</text></g>`;
  const body = `
    ${part('huTail', `<path id="huTailP" d="${huTailD(0, 500, 398, 222)}" fill="#f3b8c8" stroke="#c0607a" stroke-width="1.6"/>`)}
    ${part('huMid', `<rect x="483" y="292" width="34" height="108" rx="10" fill="#f6c6d2" stroke="#c0607a" stroke-width="2.2"/>`)}
    ${part('huTubules', `<path d="M494,296 L494,396 M500,296 L500,396 M506,296 L506,396" stroke="#b04a6a" stroke-width="1.6"/>${coil}`)}
    ${part('huNeck', `<rect x="489" y="262" width="22" height="32" rx="6" fill="#f6c6d2" stroke="#c0607a" stroke-width="2"/><ellipse cx="500" cy="279" rx="8" ry="6" fill="#fff1c8" stroke="#d9a64a" stroke-width="1.4"/>`)}
    ${part('huHead', `<path d="${head}" fill="#f2c2d8" stroke="#c0507a" stroke-width="3"/>`)}
    ${part('huNuc', `<ellipse cx="500" cy="188" rx="45" ry="58" fill="#c9a0e8" stroke="#7a4aa8" stroke-width="2.2"/><path d="M478,170 Q500,160 520,176 M482,204 Q502,214 522,198" fill="none" stroke="#8c5cc0" stroke-width="1.4" opacity=".7"/>`)}
    ${part('huCap', `<path d="M437,176 C432,118 460,74 500,72 C540,74 568,118 563,176 C550,136 530,104 500,101 C470,104 450,136 437,176 Z" fill="#fbd3e2" stroke="#c0507a" stroke-width="2"/>`)}
    ${part('huAcro', `<path d="M458,118 C470,82 530,82 542,118 C526,103 474,103 458,118 Z" fill="${HUC.egg}" stroke="#c9902a" stroke-width="1.6"/>`)}
    ${still ? '' : inset}
    <text class="cap sm" x="500" y="652" text-anchor="middle">نطفة الإنسان الناضجة (ص107): الرأس (النواة والقبعة الرأسية الحاوية على الجسيم الطرفي) + القطعة الوسطية + الذيل</text>`;
  return {
    body, fnParts: ['huAcro', 'huTubules', 'huTail'],
    parts: [
      { id: 'huCap', anchor: [552, 112], label: [866, 66], side: 'R' },
      { id: 'huAcro', anchor: [530, 100], label: [866, 112], side: 'R' },
      { id: 'huNuc', anchor: [545, 192], label: [866, 190], side: 'R' },
      { id: 'huNeck', anchor: [511, 279], label: [866, 275], side: 'R' },
      { id: 'huTubules', anchor: [519, 340], label: [866, 340], side: 'R' },
      { id: 'huHead', anchor: [435, 170], label: [134, 170], side: 'L' },
      { id: 'huMid', anchor: [483, 346], label: [134, 346], side: 'L' },
      { id: 'huTail', anchor: [497, 520], label: [134, 520], side: 'L' }
    ],
    tools: [{ id: 'info:huSpermH', label: 'عن النطفة الناضجة' }, { id: 'tbl:huWhoM', label: 'من المسؤول؟ (ص108-115)' }],
    tick(dt, t, a){
      if (still) return;
      const tp = a.el('#huTailP'); if (tp) tp.setAttribute('d', huTailD(t, 500, 398, 222));
      wiggle(a, t);
      /* النطفة الصغيرة تقترب، تطلق الإنزيمات، وتنفتح ثغرة في الغشاء */
      const p = (t * 0.18) % 1, ms = a.el('#huMiniSperm'), en = a.el('#huEnz'), ho = a.el('#huHole');
      const appr = Math.min(1, p / 0.4);
      if (ms) ms.setAttribute('transform', `translate(${n2(-40 * (1 - appr))},${n2(-30 * (1 - appr) + 6 * appr)})`);
      if (en) en.setAttribute('opacity', n2(p < 0.4 ? 0 : Math.min(1, (p - 0.4) * 5) * (1 - Math.max(0, p - 0.85) * 6)));
      if (ho) ho.setAttribute('opacity', n2(p < 0.55 ? 0 : Math.min(1, (p - 0.55) * 4) * (1 - Math.max(0, p - 0.9) * 10)));
    }
  };
}

/* ───────── 3) الجهاز الأنثوي (إحداثيات محلية: x حول مركز الرحم) ───────── */
const HU_TUBE_L = [[-80, 198], [-120, 160], [-170, 140], [-220, 150], [-250, 185], [-258, 232], [-250, 262]];
function huWallD(g){ g = g || 0;
  const H = [[0, 182 - 14 * g], [60, 186 - 8 * g], [92 + 10 * g, 205], [100 + 45 * g, 245 + 10 * g], [88 + 55 * g, 300 + 15 * g], [60 + 30 * g, 350 + 10 * g], [34, 392], [28, 412]];
  return smoothClosed(H.concat(H.slice(1).reverse().map(([x, y]) => [-x, y])).slice(0, -1)); }
function huCavD(g, k){ g = g || 0; k = k || 1;
  const H = [[0, 214 - 10 * g], [56, 212 - 4 * g], [68 + 22 * g, 224 + 6 * g], [32 + 70 * g, 292 + 10 * g], [9 + 40 * g, 350 + 8 * g], [0, 362 + 6 * g]];
  const P = H.concat(H.slice(1, -1).reverse().map(([x, y]) => [-x, y]));
  return smoothClosed(P.map(([x, y]) => [x * k, 290 + (y - 290) * k])); }
function huTubeSvg(P){
  const fr = P[P.length - 1], sd = Math.sign(fr[0]);
  let f = '';
  for (let i = 0; i < 7; i++){ const a = (sd < 0 ? 1.05 : 2.09) + (i - 3) * 0.2 * sd; f += `<path d="M${fr[0]},${fr[1]} l${n2(Math.cos(a) * 22)},${n2(Math.sin(a) * 22)}" stroke="${HUC.tube}" stroke-width="4" stroke-linecap="round"/>`; }
  return huTube(P, HUC.tube, 18) + huTube(P, HUC.tubeL, 5) + f;
}
function huOvarySvg(cx, cy){
  const r = rng(Math.round(cx * 7 + 300)); let s = `<path d="M${cx + Math.sign(-cx) * 40},${cy - 4} L${Math.sign(cx) * 92},${250}" stroke="#efe2cc" stroke-width="5" stroke-linecap="round"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="44" ry="31" fill="${HUC.ovary}" stroke="${HUC.ovS}" stroke-width="2"/>`;
  for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283, d = 18 + r() * 8; s += `<circle cx="${n2(cx + Math.cos(a) * d * 1.3)}" cy="${n2(cy + Math.sin(a) * d * 0.9)}" r="${n2(9 + r() * 5)}" fill="#fbf8f0" stroke="${HUC.ovS}" stroke-width="1.2"/>`; }
  return s;
}
/* يرسم الجهاز الأنثوي بإحداثيات محلية — o: g (حجم الحمل)، cl (جسم أصفر) */
function huFemBody(o){
  o = o || {};
  const TL = HU_TUBE_L, TRr = HU_TUBE_L.map(([x, y]) => [-x, y]);
  let rug = ''; for (let y = 446; y <= 580; y += 14) rug += `M${-44 - (y - 446) * 0.05},${y} Q0,${y + 7} ${44 + (y - 446) * 0.05},${y} `;
  const vag = `<path d="M-34,428 L34,428 L46,470 L52,592 L-52,592 L-46,470 Z" fill="#e6858f" stroke="#ffd0d6" stroke-width="2"/>
    <path d="${rug}" fill="none" stroke="#b84a5a" stroke-width="1.6"/><path id="huVagL" d="M0,428 L0,592" stroke="#8e1a30" stroke-width="7" stroke-linecap="round"/>`;
  const cerv = `<path d="M-32,392 L32,392 L35,430 L-35,430 Z" fill="#f0a0a8" stroke="#ffd0d6" stroke-width="2"/><path id="huCervC" d="M0,362 L-5,372 L5,382 L-5,392 L5,402 L-5,412 L5,422 L0,430" fill="none" stroke="${HUC.cav}" stroke-width="4"/>`;
  const uter = `<path id="huWall" d="${huWallD(o.g)}" fill="${HUC.wall}" stroke="${HUC.wallS}" stroke-width="2.6"/>
    <path id="huLin" d="${huCavD(o.g, 1.14)}" fill="${HUC.lin}"/><path id="huCav" d="${huCavD(o.g)}" fill="${HUC.cav}"/>`;
  return {
    tubes: huTubeSvg(TL) + huTubeSvg(TRr),
    ovaries: huOvarySvg(-190, 290) + huOvarySvg(190, 290),
    uterus: uter, cervix: cerv, vagina: vag
  };
}
function huFemale(still){
  const X = 500, F = (x, y) => [X + x, y], fb = huFemBody({});
  const graaf = `<circle cx="${X + 222}" cy="298" r="15" fill="#fff6d8" stroke="#e6c27a" stroke-width="2"/><circle cx="${X + 226}" cy="300" r="5" fill="${HUC.egg}" stroke="#c9902a" stroke-width="1"/>`;
  /* أهداب داخل القناة اليمنى + بيضة تتحرر من حويصلة كراف وتسير في القناة */
  const TR = HU_TUBE_L.map(([x, y]) => [X - x, y]).reverse();
  const TP = prepPath(TR);
  let cil = ''; for (let i = 1; i < 16; i++){ const d = i / 16 * TP.len, p = alongPath(TP, d), q = alongPath(TP, d + 2), a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    cil += `<line class="huCil" data-a="${n2(a)}" x1="${n2(p[0])}" y1="${n2(p[1])}" x2="${n2(p[0] - Math.sin(a) * 6)}" y2="${n2(p[1] + Math.cos(a) * 6)}" stroke="#fff" stroke-width="1.4" opacity=".7"/>`; }
  const eggPath = [[X + 226, 300], [X + 246, 276]].concat(TR).concat([[X + 40, 225], [X + 10, 250]]);
  const egg = huMov('huEggF', eggPath, 1, () => `<circle r="9" fill="none" stroke="#9fd8ff" stroke-width="2.5" opacity=".8"/><circle r="6.5" fill="${HUC.egg}" stroke="#fff" stroke-width="1"/>`);
  const body = `<g transform="translate(${X},0)">
    ${part('huFallop', fb.tubes)}
    ${part('huOvary', fb.ovaries)}
    ${part('huUterus', fb.uterus)}
    ${part('huCervix', fb.cervix)}
    ${part('huVagina', fb.vagina)}</g>
    ${part('huFimb', `<circle cx="${X - 250}" cy="262" r="14" fill="none" stroke="#ffd0d6" stroke-width="2" stroke-dasharray="3 3"/><circle cx="${X + 250}" cy="262" r="14" fill="none" stroke="#ffd0d6" stroke-width="2" stroke-dasharray="3 3"/>`)}
    ${part('huGraaf', graaf)}
    ${still ? '' : `<g pointer-events="none">${cil}</g>` + egg.svg}
    <text class="cap sm" x="500" y="640" text-anchor="middle">الجهاز التناسلي الأنثوي في الإنسان (ص111): تتحرر البيضة من حويصلة كراف فتستقبلها الفتحة القمعية وتدفعها أهداب قناة فالوب نحو الرحم</text>`;
  return {
    body, fnParts: ['huGraaf', 'huFallop', 'huFimb'],
    parts: [
      { id: 'huFallop', anchor: F(190, 146), label: [866, 120], side: 'R' },
      { id: 'huUterus', anchor: F(22, 270), label: [866, 250], side: 'R' },
      { id: 'huGraaf', anchor: F(237, 300), label: [866, 330], side: 'R' },
      { id: 'huVagina', anchor: F(50, 530), label: [866, 530], side: 'R' },
      { id: 'huFimb', anchor: F(-262, 270), label: [134, 220], side: 'L' },
      { id: 'huOvary', anchor: F(-222, 310), label: [134, 320], side: 'L' },
      { id: 'huCervix', anchor: F(-33, 412), label: [134, 412], side: 'L' }
    ],
    tools: [{ id: 'info:huFemSys', label: 'عن الجهاز الأنثوي' }, { id: 'tbl:huFemale', label: 'الأعضاء وعددها ووظيفتها (ص111)' }, { id: 'tbl:huWho', label: 'من المسؤول؟ (ص129)' }],
    tick(dt, t, a){
      if (still) return;
      a.all('.huCil').forEach((l, i) => { const x1 = +l.getAttribute('x1'), y1 = +l.getAttribute('y1'), an = +l.dataset.a + Math.sin(t * 8 - i * 0.7) * 0.6;
        l.setAttribute('x2', n2(x1 - Math.sin(an) * 6)); l.setAttribute('y2', n2(y1 + Math.cos(an) * 6)); });
      huMovTick(a, egg, t, 32, (p, u) => u < 0.03 ? u * 33 : u > 0.92 ? (1 - u) * 12 : 1);
    }
  };
}

/* ───────── 4) الإخصاب والحمل والولادة والرضاعة — ملزمة ص112–113 (7 مراحل) ───────── */
const HU_FERT_STAGES = [
  { n: '1 · الإخصاب في الثلث العلوي لقناة البيض', d: 'يحدث الإخصاب بعد دخول النطف إلى المهبل من خلال عملية الجماع عند أو قرب وقت التبويض، وتسبح النطف من المهبل باتجاه عنق الرحم ثم تدخل الرحم وتصعد إلى قناة البيض حيث يحصل الإخصاب فيها إذا تواجدت بيضة ناضجة حية في الثلث العلوي منها، وإذا انحدرت البيضة إلى أسفل القناة فإنها تفقد قدرتها على الإخصاب.' },
  { n: '2 · الزايكوت ينحدر ويُغرس في جدار الرحم', d: 'نطفة واحدة فقط تخصب البيضة لتتكون بيضة مخصبة (زايكوت) في قناة البيض، ثم تبدأ بالانحدار إلى الأسفل حتى تصل الرحم حيث يغرس الجنين في الجدار السميك المبطن للرحم.' },
  { n: '3 · الكيس الجنيني والسائل السلوي', d: 'تنمو الأغشية الجنينية لتكوين كيس يحيط بالجنين ويحوي السائل السلوي (السلي).' },
  { n: '4 · الحمل: الجسم الأصفر ثم المشيمة', d: 'عند نهاية غرس الجنين في جدار الرحم تبدأ مرحلة الحمل. ويستمر الجسم الأصفر بإفراز البروجسترون بعد اليوم (26) من الدورة الشهرية وحتى الشهر الخامس، وعندها تقوم المشيمة بالتعويض فتعمل كغدة صماء تعطي البروجسترون إلى جدار الرحم مباشرة بدلاً من إفرازه في مجرى الدم.' },
  { n: '5 · الجنين جاهز للولادة (9 أشهر)', d: 'يكون الجنين جاهزاً للولادة بعد حوالي (9) أشهر من ابتداء نموه.' },
  { n: '6 · الولادة', d: 'قبل الولادة تتوقف المشيمة عن إنتاج البروجسترون فيبدأ الرحم بالتقلص (أول إشارة للولادة)، يفتح عنق الرحم وينشق الكيس فينزل السائل إلى الخارج، ثم يبدأ الرحم تقلصات قوية متتالية تدفع الطفل خارج الرحم من خلال عنق الرحم ثم إلى الخارج عن طريق المهبل.' },
  { n: '7 · الرضاعة', d: 'يزداد حجم الثدي عند المرأة خلال فترة الحمل، وتفرز الغدد اللبنية اللبن استجابة لتأثير الهرمونات، واستمرار إفراز اللبن يعتمد على مدى استمرارية الطفل بالرضاعة.' }
];
function huFetus(s){
  return `<g transform="scale(${n2(s)})"><path d="M-22,-6 C-26,22 -6,40 16,34 C34,28 34,6 24,-6 C14,-14 -2,-16 -12,-12 Z" fill="#ffc9b0" stroke="#e08a6a" stroke-width="2"/>
    <circle cx="-8" cy="-26" r="20" fill="#ffd4bc" stroke="#e08a6a" stroke-width="2"/><circle cx="-16" cy="-28" r="2.4" fill="#6a3a2a"/>
    <path d="M14,6 C26,14 24,26 12,28 M-6,14 C-2,26 8,30 16,24" fill="none" stroke="#e08a6a" stroke-width="3" stroke-linecap="round"/></g>`;
}
function huFert(still){
  const X = 600, Y = 10, S = 0.92, F = (x, y) => [n2(X + x * S), n2(Y + y * S)];
  const fb = huFemBody({ g: 0 });
  const fertL = [-232, 160];
  /* مسار النطف: المهبل ← عنق الرحم ← الرحم ← قناة البيض اليسرى (محلي) */
  const spPath = [[0, 590], [0, 470], [0, 420], [0, 360], [-6, 300], [-40, 236], [-80, 198], [-120, 160], [-170, 140], [-214, 148], fertL];
  const zyPath = [fertL, [-220, 150], [-170, 140], [-120, 160], [-80, 198], [-46, 216], [-12, 228]];
  const spm = huMov('huFSp', spPath, 9, i => huMiniSp('#ffffff', 1.1));
  const ZP = prepPath(zyPath);
  const prog = huMov('huProgD', [[-190, 290], [-140, 270], [-92, 250], [-60, 260]], 4, () => `<circle r="4" fill="${HUC.prog}" stroke="#fff" stroke-width="1"/>`);
  const prog2 = huMov('huProgP', [[0, 206], [-30, 214], [-56, 226]], 3, () => `<circle r="4" fill="${HUC.prog}" stroke="#fff" stroke-width="1"/>`);
  let milk = ''; for (let i = 0; i < 5; i++) milk += `<circle class="huMilk" data-i="${i}" r="3.2" fill="#fff" opacity="0"/>`;
  const breast = `<path d="M160,420 L160,600" stroke="#e6a890" stroke-width="5"/>
    <path id="huBreast" d="M160,432 C230,430 300,470 302,512 C300,556 232,590 160,590 Z" fill="#ffd4bc" stroke="#e08a6a" stroke-width="2.4"/>
    <circle cx="304" cy="512" r="6" fill="#d97a6a"/>
    ${[[208, 470], [196, 520], [212, 562]].map(([x, y]) => `<g>${[0, 1, 2, 3, 4].map(k => `<circle cx="${x + Math.cos(k * 1.26) * 9}" cy="${y + Math.sin(k * 1.26) * 9}" r="6" fill="#ffeef0" stroke="#e08a9a" stroke-width="1.2"/>`).join('')}</g><path d="M${x + 10},${y} Q${(x + 300) / 2},${(y + 512) / 2 + (512 - y) * 0.1} 300,512" fill="none" stroke="#e08a9a" stroke-width="2"/>`).join('')}`;
  const body = `<g transform="translate(${X},${Y}) scale(${S})">
    ${part('huFallop', fb.tubes)}
    ${part('huOvary', fb.ovaries)}
    ${part('huCL', `<g data-st="3"><path d="${smoothClosed([[-204, 280], [-188, 270], [-172, 282], [-176, 300], [-196, 302]])}" fill="${HUC.yellow}" stroke="#fff3c8" stroke-width="2"/></g>`)}
    ${part('huUterus', fb.uterus)}
    ${part('huCervix', fb.cervix)}
    ${part('huVagina', fb.vagina)}
    ${part('huPlacenta', `<g id="huPlac" data-st="3"><path d="M-46,200 Q0,180 46,200 Q0,226 -46,200Z" fill="#b8344a" stroke="#ffb0c0" stroke-width="2"/></g>`)}
    <g id="huSacG">${part('huAmnion', `<circle id="huSac" cx="0" cy="240" r="12" fill="rgba(170,215,255,.55)" stroke="#d8eeff" stroke-width="2.4"/>`)}
      <path id="huCord" d="M0,210 Q14,230 0,250" fill="none" stroke="#f2a0b0" stroke-width="4" opacity="0"/>
      ${part('huEmbryo', `<g id="huFet" transform="translate(0,262) scale(0.6)">${huFetus(1)}</g>`)}</g>
    ${part('huFertSite', `<circle cx="${fertL[0]}" cy="${fertL[1]}" r="11" fill="none" stroke="${HUC.egg}" stroke-width="2.4" stroke-dasharray="4 3"/><g id="huEggT"><circle cx="${fertL[0]}" cy="${fertL[1]}" r="7" fill="${HUC.egg}" stroke="#fff" stroke-width="1.2"/></g>`)}
    ${part('huZygote', `<g id="huZyg" opacity="0"><circle r="8" fill="#ff9aa8" stroke="#fff" stroke-width="1.6"/><g id="huZ2" opacity="0"><line x1="0" y1="-8" x2="0" y2="8" stroke="#fff" stroke-width="1.4"/></g><g id="huZ4" opacity="0"><line x1="-8" y1="0" x2="8" y2="0" stroke="#fff" stroke-width="1.4"/></g></g>`)}
    ${still ? '' : spm.svg + prog.svg + prog2.svg}
    <g id="huFluid" opacity="0">${[0, 1, 2, 3, 4].map(i => `<circle class="huDrop" data-i="${i}" cx="0" cy="600" r="4" fill="#bfe2ff"/>`).join('')}</g>
    </g>
    ${part('huMammary', `<g id="huBrW" data-st="6">${breast}${milk}</g>`)}
    <text id="huMonth" class="cap" x="${X}" y="70" text-anchor="middle"></text>
    <text class="cap sm" x="560" y="645" text-anchor="middle">الإخصاب والحمل في الإنسان (ص112–113): إخصاب ← انغراس ← كيس جنيني ← حمل ← ولادة ← رضاعة</text>`;
  const ctl = stageCtl(HU_FERT_STAGES, { dur: 49 });
  /* حالة الرحم والجنين في كل لحظة */
  const st = () => {
    const i = still ? 4 : STG.idx, k = still ? 0.5 : STG.k;
    const g = [0, 0, 0.18, 0.35 + 0.4 * k, 1, 1 - 0.75 * Math.max(0, (k - 0.3) / 0.7), 0.1][i];
    const fs = [0, 0, 0.18 + 0.1 * k, 0.32 + 0.35 * k, 0.75 + 0.25 * k, 1, 0][i];
    return { i, k, g, fs };
  };
  return {
    body, stages: HU_FERT_STAGES, fnParts: ['huFertSite', 'huZygote', 'huPlacenta', 'huCL', 'huMammary'],
    parts: [
      { id: 'huPlacenta', anchor: F(30, 198), label: [866, 160], side: 'R' },
      { id: 'huAmnion', anchor: F(64, 270), label: [866, 228], side: 'R' },
      { id: 'huEmbryo', anchor: F(20, 290), label: [866, 290], side: 'R' },
      { id: 'huUterus', anchor: F(110, 330), label: [866, 350], side: 'R' },
      { id: 'huCervix', anchor: F(34, 412), label: [866, 410], side: 'R' },
      { id: 'huVagina', anchor: F(50, 520), label: [866, 500], side: 'R' },
      { id: 'huFertSite', anchor: F(-242, 152), label: [134, 270], side: 'L' },
      { id: 'huZygote', anchor: F(-120, 160), label: [134, 320], side: 'L' },
      { id: 'huCL', anchor: F(-200, 300), label: [134, 372], side: 'L' },
      { id: 'huMammary', anchor: [200, 470], label: [134, 470], side: 'L' }
    ],
    tools: ctl.tools.concat([{ id: 'info:huFertProc', label: 'عن الإخصاب والحمل' }, { id: 'tbl:huWho', label: 'من المسؤول؟ (ص129)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k);
      const { i, k, g, fs } = st();
      const set = (q, at, v) => { const e = a.el(q); if (e) e.setAttribute(at, v); };
      /* الرحم يكبر مع الحمل ويتقلص عند الولادة */
      const pulse = i === 5 ? Math.max(0, Math.sin(t * 5)) * 0.06 : 0;
      set('#huWall', 'd', huWallD(g - pulse)); set('#huLin', 'd', huCavD(g, 1.14 - (i >= 4 && i <= 5 ? 0.06 : 0))); set('#huCav', 'd', huCavD(g));
      set('#huWall', 'stroke', i === 5 ? '#ffd166' : HUC.wallS);
      /* 1: النطف والبيضة */
      huMovTick(a, spm, t, 60, (p, u, j) => i === 0 ? (u > 0.9 ? (1 - u) * 10 : 1) * (j % 3 === 2 && u > 0.5 ? 0.3 : 1) : 0);
      set('#huEggT', 'opacity', i === 0 ? (k > 0.78 ? n2(1 - (k - 0.78) * 4) : 1) : 0);
      /* 2: الزايكوت ينحدر وينقسم ثم يُغرس */
      const z = a.el('#huZyg');
      if (z){
        let zo = 0, zp = ZP.pts[0];
        if (i === 0 && k > 0.78){ zo = Math.min(1, (k - 0.78) * 6); }
        if (i === 1){ zo = 1; zp = alongPath(ZP, Math.min(1, k * 1.25) * ZP.len); }
        if (i === 2 && k < 0.2){ zo = 1 - k * 5; zp = ZP.pts[ZP.pts.length - 1]; }
        z.setAttribute('opacity', n2(zo)); z.setAttribute('transform', `translate(${n2(zp[0])},${n2(zp[1])})`);
        set('#huZ2', 'opacity', i === 1 && k > 0.25 ? 1 : 0); set('#huZ4', 'opacity', i === 1 && k > 0.5 ? 1 : 0);
      }
      /* 3–6: الكيس الجنيني والجنين */
      let cy = 232 + 60 * Math.max(0, Math.min(1, g)), rs = i < 2 ? 0 : i === 2 ? 8 + 22 * k : 14 + 66 * Math.min(1, g);
      let fy = cy, fsz = fs;
      if (i === 5){ const m = Math.max(0, (k - 0.3) / 0.7); rs = k < 0.3 ? 80 * (1 - k * 2) : 0; fy = 292 + m * 330; fsz = 1 - 0.45 * Math.min(1, m * 2); }
      if (i === 6){ rs = 0; fsz = 0; }
      set('#huSac', 'cy', n2(cy)); set('#huSac', 'r', n2(Math.max(0, rs))); set('#huSac', 'opacity', rs > 0 ? 1 : 0);
      set('#huFet', 'transform', `translate(0,${n2(fy)}) rotate(${i === 5 ? 180 : 0}) scale(${n2(Math.max(0.01, fsz))})`);
      set('#huFet', 'opacity', fsz > 0.02 && (i !== 5 || fy < 610) ? 1 : 0);
      set('#huCord', 'opacity', i >= 3 && i <= 4 ? 0.9 : 0);
      set('#huCord', 'd', `M0,206 Q18,${n2((206 + cy) / 2)} 0,${n2(cy - fs * 20)}`);
      /* 4: البروجسترون من الجسم الأصفر ثم من المشيمة */
      huMovTick(a, prog, t, 40, () => i === 3 && k < 0.5 ? 1 : 0);
      huMovTick(a, prog2, t, 30, () => (i === 3 && k >= 0.5) || i === 4 ? 1 : 0);
      set('#huPlac', 'opacity', i >= 3 && i <= 4 ? 1 : i === 5 ? n2(Math.max(0.12, 1 - k * 1.5)) : 0.12);
      /* 6: السائل يخرج من المهبل */
      a.all('.huDrop').forEach((d, j) => { const p = (t * 0.7 + j / 5) % 1; d.setAttribute('cy', n2(560 + p * 70)); d.setAttribute('cx', n2(Math.sin(j * 2.1) * 10)); });
      set('#huFluid', 'opacity', i === 5 && k > 0.15 && k < 0.6 ? 1 : 0);
      /* 7: الرضاعة — الثدي يكبر والغدد اللبنية تفرز */
      const bw = a.el('#huBrW'); if (bw){ const sc = 1 + (i >= 3 ? 0.1 : 0); bw.setAttribute('transform', `translate(160,510) scale(${sc}) translate(-160,-510)`); }
      a.all('.huMilk').forEach((m, j) => { const p = (t * 0.5 + j / 5) % 1, src = [[208, 470], [196, 520], [212, 562]][j % 3];
        m.setAttribute('cx', n2(src[0] + (300 - src[0]) * p)); m.setAttribute('cy', n2(src[1] + (512 - src[1]) * p)); m.setAttribute('opacity', i === 6 ? n2(Math.sin(p * Math.PI)) : 0); });
      const mo = a.el('#huMonth');
      if (mo) mo.textContent = still ? '' : i === 3 ? 'الشهر ' + (1 + Math.floor(k * 5)) + (k < 0.5 ? ' — البروجسترون من الجسم الأصفر' : ' — البروجسترون من المشيمة') : i === 4 ? 'الشهر 9' : '';
    }
  };
}

/* ───────── 5) الدورة المبيضية والرحمية عبر الأيام 1-28 — ملزمة ص117–121 ───────── */
const HU_MENS_STAGES = [
  { n: '1 · الأيام 1-5: الطور الحيضي + الحوصلة البدائية', a: 1, b: 5, d: 'الدورة الرحمية: يكون مستوى الهرمونات الجنسية واطئاً مما يؤدي إلى تمزق جدار الرحم والأوعية الدموية فيه ويخرج الدم عن طريق المهبل (الحيض). الدورة المبيضية: مرحلة تكون الحوصلة البدائية: تحتوي سليفة البيضة (2س) وتبدأ فيها عملية الانقسام الاختزالي الأول.' },
  { n: '2 · الأيام 6-9: الحوصلة الأولية والثانوية + طور النشوء', a: 6, b: 9, d: 'الحوصلة الأولية: تبدأ المنطقة الشفافة بالتكون حول البيضة. الحوصلة الثانوية: يظهر تجويف الحوصلة المليء بإفرازات من الخلايا الحوصلية وبعض مكونات بلازما الدم وبروتينات. ينتج الهرمون المحفز للحويصلات (FSH) ويزداد الإستروجين (المودق) من الحوصلة المبيضية فيعاد إصلاح جدار الرحم (طور النشوء أو التكاثر).' },
  { n: '3 · الأيام 10-13: الحوصلة الناضجة', a: 10, b: 13, d: 'تنضج الحوصلة وتكتمل عملية الانقسام الاختزالي الأول وتتكون خلية بيضية ثانوية وجسم قطبي أول. يزداد الإستروجين فيتثخن (يتسمك) جدار الرحم الداخلي ويصبح وعائياً غدياً.' },
  { n: '4 · اليوم 14: مرحلة الإباضة', a: 14, b: 14, d: 'تتمزق حوصلة البيضة وتتحرر الخلية البيضية الثانوية والجسم القطبي الأول. تحصل الإباضة عادة في اليوم (14) من دورة الـ(28) يوماً (وزاري 2/23).' },
  { n: '5 · الأيام 15-24: الجسم الأصفر + الطور الإفرازي', a: 15, b: 24, d: 'يتكون الجسم الأصفر من بقايا الحوصلة الممزقة ويفرز البروجسترون (بتأثير الهرمون المحفز للجسم الأصفر LH)، فتحدث زيادة مضاعفة في سمك الجدار الداخلي للرحم وزيادة الغدد الرحمية التي تنتج إفرازات مخاطية، ويصبح الرحم مهيأً لاستقبال الجنين (الطور الإفرازي).' },
  { n: '6 · الأيام 25-28: الجسم الأبيض (عند عدم حصول حمل)', a: 25, b: 28, d: 'في حالة عدم حصول الحمل يضمحل الجسم الأصفر ويتحول إلى كتلة صغيرة تدعى الجسم الأبيض، وينخفض مستوى الهرمونات الجنسية فيحصل تمزق في الجدار الداخلي للرحم وتبدأ دورة حيضية جديدة.' }
];
const HU_X = d => 310 + (d - 1) * 19.3;
const HU_H = {
  fsh: [[1, .35], [3, .45], [6, .42], [10, .3], [13, .55], [14, .6], [15.5, .28], [20, .14], [26, .2], [29, .35]],
  lh: [[1, .2], [10, .22], [12, .38], [13.3, .92], [14, 1], [15, .45], [17, .18], [29, .18]],
  est: [[1, .12], [5, .15], [9, .42], [12, .82], [13, .74], [14.5, .36], [16.5, .34], [21, .52], [25, .32], [29, .12]],
  prog: [[1, .05], [13.5, .06], [15.5, .16], [18, .55], [21, .76], [23, .7], [26, .28], [29, .05]]
};
const HU_TH = [[1, 34], [3, 20], [5.6, 8], [9, 22], [13, 40], [14.5, 44], [18, 62], [22, 80], [26, 84], [29, 72]];
function huMens(still){
  const yH = v => 420 - v * 125, X = HU_X;
  const curve = (K, d0, d1) => { const P = []; for (let d = d0; d <= d1 + 0.001; d += 0.5) P.push([X(d), yH(huCurve(K, d))]); return smoothOpen(P); };
  /* الحويصلات في شريط المبيض */
  const fol = (x, y, r, kind) => {
    if (kind === 'prim') return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6c3b0" stroke="#fff" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#c9a0e8" stroke="#7a4aa8"/>`;
    if (kind === 'pri') return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f2b8a4" stroke="#fff" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="#bfe4ff" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r * 0.42}" fill="#c9a0e8" stroke="#7a4aa8"/>`;
    if (kind === 'sec') return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f2b8a4" stroke="#fff" stroke-width="1.6"/><path d="M${x - r * 0.7},${y - r * 0.2} A${r * 0.75},${r * 0.75} 0 0 1 ${x + r * 0.7},${y - r * 0.2} Q${x},${y - r * 0.45} ${x - r * 0.7},${y - r * 0.2}Z" fill="#cfe7ff"/><circle cx="${x}" cy="${y + r * 0.3}" r="${r * 0.3}" fill="#c9a0e8" stroke="#7a4aa8"/>`;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f2b8a4" stroke="#fff" stroke-width="2"/><circle cx="${x}" cy="${y - 2}" r="${r * 0.78}" fill="#cfe7ff"/><circle cx="${x - r * 0.25}" cy="${y + r * 0.42}" r="${r * 0.3}" fill="#f2b8a4"/><circle cx="${x - r * 0.25}" cy="${y + r * 0.4}" r="${r * 0.2}" fill="#c9a0e8" stroke="#7a4aa8"/><circle cx="${x - r * 0.02}" cy="${y + r * 0.3}" r="3" fill="#e8d4ff"/>`;
  };
  const yA = 140;
  const clP = (x, y, r, c) => { const rr = rng(Math.round(x)); const P = []; for (let i = 0; i < 14; i++){ const a = i / 14 * 6.283; P.push([x + Math.cos(a) * r * (0.82 + rr() * 0.3), y + Math.sin(a) * r * (0.82 + rr() * 0.3)]); }
    return `<path d="${smoothClosed(P)}" fill="${c}" stroke="#fff" stroke-width="1.6"/><path d="M${x - r * 0.5},${y} q${r * 0.25},${-r * 0.4} ${r * 0.5},0 t${r * 0.5},0 M${x - r * 0.4},${y + r * 0.35} q${r * 0.2},${-r * 0.3} ${r * 0.4},0 t${r * 0.4},0" fill="none" stroke="rgba(150,90,20,.6)" stroke-width="1.4"/>`; };
  const strip = `<path d="M300,96 Q300,70 330,70 L828,70 Q856,70 856,96 L856,186 Q856,210 828,210 L330,210 Q300,210 300,186 Z" fill="#f5dccb" stroke="#e0b49a" stroke-width="2" opacity=".9"/>`;
  /* بطانة الرحم */
  const thY = d => 590 - huCurve(HU_TH, d);
  const lin = (d0, d1, col, rag) => { const P = []; for (let d = d0; d <= d1 + 0.001; d += 0.25){ const r = rag ? Math.sin(d * 9) * 4 : 0; P.push([X(d), thY(d) + r]); }
    return `<path d="${smoothOpen(P)} L${n2(X(d1))},590 L${n2(X(d0))},590 Z" fill="${col}" stroke="#ffd6dc" stroke-width="1.6"/>`; };
  let gl1 = '', gl2 = '';
  for (let d = 6.5; d < 15; d += 1.5){ const top = thY(d) + 6; gl1 += `<path d="M${n2(X(d))},588 L${n2(X(d))},${n2(top)}" stroke="#fff0f2" stroke-width="2" opacity=".8"/>`; }
  for (let d = 15.8; d < 29; d += 1.6){ const top = thY(d) + 8; let p = `M${n2(X(d))},588`; for (let y = 588, s = 1; y > top; y -= 7, s = -s) p += ` L${n2(X(d) + s * 4)},${n2(y - 7)}`; gl2 += `<path d="${p}" fill="none" stroke="#fff0f2" stroke-width="1.8" opacity=".85"/><path d="M${n2(X(d + 0.8))},588 Q${n2(X(d + 0.8) + 6)},${n2((588 + top) / 2)} ${n2(X(d + 0.8))},${n2(top + 4)}" fill="none" stroke="#b8243a" stroke-width="1.6"/>`; }
  let drops = ''; for (let i = 0; i < 6; i++) drops += `<path class="huBld" data-i="${i}" d="M0,-5 Q4,1 0,4 Q-4,1 0,-5Z" fill="#c8102e"/>`;
  const bandBg = `<rect x="${X(1)}" y="440" width="${n2(X(6) - X(1))}" height="152" fill="rgba(200,16,46,.10)"/><rect x="${X(6)}" y="440" width="${n2(X(14) - X(6))}" height="152" fill="rgba(255,143,192,.08)"/><rect x="${X(15)}" y="440" width="${n2(X(29) - X(15))}" height="152" fill="rgba(255,209,102,.08)"/>`;
  let ticks = ''; [1, 5, 6, 13, 14, 15, 28].forEach(d => { const x = X(d + 0.5); ticks += `<line x1="${n2(x)}" y1="600" x2="${n2(x)}" y2="606" stroke="#d8d0e8" stroke-width="1.4"/><text class="cap sm" x="${n2(x)}" y="619" text-anchor="middle">${d}</text>`; });
  const body = `
    <defs><clipPath id="huClipDay"><rect id="huClipR" x="300" y="270" width="${still ? 600 : 0}" height="160"/></clipPath></defs>
    ${strip}
    <text class="cap sm" x="852" y="88" text-anchor="start">الدورة المبيضية (المبيض)</text>
    ${part('huPrimord', `<g data-st="0">${fol(X(2.5), yA, 9, 'prim')}</g>`)}
    ${part('huPrimF', `<g data-st="1">${fol(X(5.5), yA, 14, 'pri')}</g>`)}
    ${part('huSecF', `<g data-st="1">${fol(X(9), yA, 22, 'sec')}</g>`)}
    ${part('huMatF', `<g data-st="2">${fol(X(12), yA, 33, 'mat')}</g>`)}
    ${part('huOvul', `<g data-st="3"><path d="${smoothClosed([[X(14.5) - 20, yA - 6], [X(14.5) - 6, yA - 24], [X(14.5) + 4, yA - 12], [X(14.5) + 18, yA - 18], [X(14.5) + 20, yA + 6], [X(14.5) + 4, yA + 22], [X(14.5) - 16, yA + 16]])}" fill="#d9505a" stroke="#ffd0d6" stroke-width="1.6"/>
      <g id="huOvEgg"><circle cx="${X(14.5)}" cy="${yA - 50}" r="9" fill="none" stroke="#9fd8ff" stroke-width="2.4"/><circle cx="${X(14.5)}" cy="${yA - 50}" r="6" fill="${HUC.egg}" stroke="#fff"/></g></g>`)}
    ${part('huCL', `<g data-st="4">${clP(X(20), yA, 32, HUC.yellow)}</g>`)}
    ${part('huCA', `<g data-st="5">${clP(X(27), yA, 17, '#f4f0ea')}</g>`)}
    <line x1="${X(14.5)}" y1="70" x2="${X(14.5)}" y2="598" stroke="#ffe08a" stroke-width="1.2" stroke-dasharray="4 5" opacity=".6"/>
    <rect x="300" y="268" width="556" height="160" rx="10" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.12)"/>
    <text class="cap sm" x="852" y="286" text-anchor="start">الهرمونات</text>
    <g opacity=".35">${['fsh', 'lh', 'est', 'prog'].map(k => `<path d="${curve(HU_H[k], 1, 29)}" fill="none" stroke="${HUC[k]}" stroke-width="2"${k === 'fsh' || k === 'lh' ? ' stroke-dasharray="6 4"' : ''}/>`).join('')}</g>
    <g clip-path="url(#huClipDay)">
      ${part('huFSH', `<path d="${curve(HU_H.fsh, 1, 29)}" fill="none" stroke="${HUC.fsh}" stroke-width="3" stroke-dasharray="7 4"/>`)}
      ${part('huLH', `<path d="${curve(HU_H.lh, 1, 29)}" fill="none" stroke="${HUC.lh}" stroke-width="3" stroke-dasharray="7 4"/>`)}
      ${part('huEstro', `<path d="${curve(HU_H.est, 1, 29)}" fill="none" stroke="${HUC.est}" stroke-width="4"/>`)}
      ${part('huProg', `<path d="${curve(HU_H.prog, 1, 29)}" fill="none" stroke="${HUC.prog}" stroke-width="4"/>`)}
    </g>
    ${bandBg}
    <text class="cap sm" x="852" y="452" text-anchor="start">الدورة الرحمية (جدار الرحم)</text>
    <text class="cap sm" x="${n2((X(1) + X(6)) / 2)}" y="470" text-anchor="middle">الحيضي</text>
    <text class="cap sm" x="${n2((X(6) + X(14)) / 2)}" y="470" text-anchor="middle">النشوء (التكاثر)</text>
    <text class="cap sm" x="${n2((X(15) + X(25)) / 2)}" y="470" text-anchor="middle">الإفرازي</text>
    <rect x="${X(1)}" y="590" width="${n2(X(29) - X(1))}" height="10" fill="#c96a74"/>
    ${part('huMenses', `<g data-st="0">${lin(1, 6, '#c8485e', true)}<g id="huBldG">${drops}</g></g>`)}
    ${part('huProlif', `<g data-st="1">${lin(6, 15, '#e07a8c')}${gl1}</g>`)}
    ${part('huSecret', `<g data-st="4">${lin(15, 29, '#ec95a4')}${gl2}</g>`)}
    <line x1="${X(1)}" y1="600" x2="${X(29)}" y2="600" stroke="#d8d0e8" stroke-width="1.6"/>${ticks}
    <g id="huCur" ${still ? 'opacity="0"' : ''}><line x1="0" y1="64" x2="0" y2="600" stroke="#fff" stroke-width="1.6" opacity=".75"/>
      ${['fsh', 'lh', 'est', 'prog'].map(k => `<circle class="huHd" data-k="${k}" cx="0" cy="400" r="5" fill="${HUC[k]}" stroke="#fff" stroke-width="1.4"/>`).join('')}
      <rect x="-30" y="624" width="60" height="18" rx="9" fill="#ffe08a"/><text id="huDayT" x="0" y="637" text-anchor="middle" font-size="12" font-weight="700" fill="#2a1a10" direction="rtl">اليوم 1</text></g>
    <text class="cap sm" x="500" y="662" text-anchor="middle">جدول ص121: المبيضية (الحوصلي 1-13 · التبويض 14 · الجسم الأصفر 14-28) — الرحمية (الحيضي 1-5 · النشوء 6-13 · الإفراز 15-28)</text>`;
  const ctl = stageCtl(HU_MENS_STAGES, { dur: 42, label: 'اليوم' });
  const dayNow = () => { const s = HU_MENS_STAGES[STG.idx]; return s.a + STG.k * (s.b - s.a + 1); };
  return {
    body, stages: HU_MENS_STAGES, fnParts: ['huOvul', 'huCL', 'huEstro', 'huProg', 'huMenses'],
    parts: [
      { id: 'huPrimord', anchor: [X(2.5), yA + 10], label: [X(2.5), 230], side: 'C', short: 'حوصلة بدائية' },
      { id: 'huPrimF', anchor: [X(5.5), yA + 15], label: [X(5.5), 250], side: 'C', short: 'حوصلة أولية' },
      { id: 'huSecF', anchor: [X(9), yA + 23], label: [X(9), 230], side: 'C', short: 'حوصلة ثانوية' },
      { id: 'huMatF', anchor: [X(12), yA + 34], label: [X(12), 250], side: 'C', short: 'حوصلة ناضجة' },
      { id: 'huOvul', anchor: [X(14.5) + 10, yA - 52], label: [X(14.5) + 60, 50], side: 'C', short: 'الإباضة' },
      { id: 'huCL', anchor: [X(20), yA + 30], label: [X(20), 230], side: 'C' },
      { id: 'huCA', anchor: [X(27), yA + 17], label: [X(27), 250], side: 'C' },
      { id: 'huFSH', anchor: [X(3), yH(huCurve(HU_H.fsh, 3))], label: [134, 300], side: 'L', short: 'FSH (محفز الحويصلات)' },
      { id: 'huLH', anchor: [X(14), yH(1)], label: [134, 334], side: 'L', short: 'LH (محفز الجسم الأصفر)' },
      { id: 'huEstro', anchor: [X(12), yH(huCurve(HU_H.est, 12))], label: [134, 368], side: 'L' },
      { id: 'huProg', anchor: [X(21), yH(huCurve(HU_H.prog, 21))], label: [134, 402], side: 'L' },
      { id: 'huMenses', anchor: [X(3), thY(3) + 6], label: [134, 500], side: 'L' },
      { id: 'huProlif', anchor: [X(10), thY(10) + 10], label: [134, 560], side: 'L' },
      { id: 'huSecret', anchor: [X(24), thY(24) + 10], label: [866, 520], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'info:huMenCyc', label: 'الدورة الحيضية' }, { id: 'tbl:huCycSum', label: 'جدول أحداث الدورة (ص121)' }, { id: 'tbl:huHorm', label: 'الهرمونات ومنشؤها' }, { id: 'tbl:huOvSt', label: 'مراحل الدورة المبيضية (ص118)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (still) return;
      ctl.tick(dt);
      stageShow(a, STG.idx, STG.k);
      const d = Math.min(28.98, dayNow()), x = X(d);
      const cu = a.el('#huCur'); if (cu) cu.setAttribute('transform', `translate(${n2(x)},0)`);
      const cr = a.el('#huClipR'); if (cr) cr.setAttribute('width', n2(x - 300));
      a.all('.huHd').forEach(c => c.setAttribute('cy', n2(yH(huCurve(HU_H[c.dataset.k], d)))));
      const dt2 = a.el('#huDayT'); if (dt2) dt2.textContent = 'اليوم ' + Math.floor(d);
      a.all('.huBld').forEach((b, i) => { const p = (t * 0.45 + i / 6) % 1, bx = X(1.3 + i * 0.75);
        b.setAttribute('transform', `translate(${n2(bx)},${n2(thY(1.3 + i * 0.75) - 2 + p * 40)})`); b.setAttribute('opacity', n2(STG.idx === 0 ? Math.sin(p * Math.PI) : 0)); });
      const oe = a.el('#huOvEgg'); if (oe){ const p = STG.idx === 3 ? STG.k : STG.idx > 3 ? 1 : 0; oe.setAttribute('transform', `translate(0,${n2(40 * (1 - p))})`); oe.setAttribute('opacity', n2(STG.idx >= 3 && STG.idx < 5 ? 1 : 0)); }
    }
  };
}

/* ───────── 6) أحداث الدورة المبيضية — شكل (3-41) ص119 (للرسم) ───────── */
function huOvCycle(still){
  const rr = rng(77); let stroma = '';
  for (let i = 0; i < 70; i++){ const a = rr() * 6.283, d = Math.sqrt(rr()); stroma += `<circle cx="${n2(500 + Math.cos(a) * d * 235)}" cy="${n2(355 + Math.sin(a) * d * 170)}" r="${n2(1.2 + rr() * 1.6)}" fill="#c99c78" opacity=".55"/>`; }
  const arr = (x0, y0, x1, y1) => gArrow(x0, y0, x1, y1, '#3a2a20');
  const cells = (x, y, r, n, c) => { let s = ''; for (let i = 0; i < n; i++){ const a = i / n * 6.283; s += `<circle cx="${n2(x + Math.cos(a) * r)}" cy="${n2(y + Math.sin(a) * r)}" r="3.4" fill="${c}" stroke="#c98a70" stroke-width=".8"/>`; } return s; };
  const fold = (x, y, r, c, sd) => { const q = rng(sd); const P = []; for (let i = 0; i < 16; i++){ const a = i / 16 * 6.283, k = i % 2 ? 0.8 : 1 + q() * 0.1; P.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]); }
    let w = ''; for (let j = -2; j <= 2; j++) w += `M${n2(x - r * 0.6)},${n2(y + j * r * 0.25)} q${n2(r * 0.15)},${n2(-r * 0.2)} ${n2(r * 0.3)},0 t${n2(r * 0.3)},0 t${n2(r * 0.3)},0 t${n2(r * 0.3)},0 `;
    return `<path d="${smoothClosed(P)}" fill="${c}" stroke="#b07a30" stroke-width="2"/><path d="${w}" fill="none" stroke="rgba(150,90,20,.65)" stroke-width="1.6"/>`; };
  const mat = `<circle cx="700" cy="320" r="58" fill="#f2b8a4" stroke="#fff" stroke-width="2.4"/><circle cx="702" cy="314" r="46" fill="#cfe7ff"/>
    <path d="M664,346 Q676,326 700,330 Q720,334 724,354 Q700,368 664,346Z" fill="#f2b8a4"/>`;
  const body = `
    ${part('huOvary', `<ellipse cx="500" cy="355" rx="250" ry="185" fill="#ecd0b4" stroke="#c49a78" stroke-width="3"/>${stroma}`)}
    ${part('huPrimord', `<circle cx="330" cy="262" r="11" fill="#f6c3b0" stroke="#c98a70" stroke-width="1.4"/><circle cx="330" cy="262" r="5" fill="#c9a0e8" stroke="#7a4aa8"/>`)}
    ${part('huPrimF', `${cells(412, 220, 17, 10, '#f6c3b0')}<circle cx="412" cy="220" r="12" fill="none" stroke="#bfe4ff" stroke-width="3"/><circle cx="412" cy="220" r="9" fill="#c9a0e8" stroke="#7a4aa8"/>`)}
    ${part('huSecF', `<circle cx="520" cy="212" r="29" fill="#f2b8a4" stroke="#fff" stroke-width="1.8"/><path d="M498,200 A24,24 0 0 1 542,200 Q520,190 498,200Z" fill="#cfe7ff"/><circle cx="520" cy="222" r="10" fill="#c9a0e8" stroke="#7a4aa8"/>`)}
    ${part('huMatF', mat)}
    ${part('ooSec', `<circle cx="694" cy="345" r="12" fill="none" stroke="#bfe4ff" stroke-width="3"/><circle cx="694" cy="345" r="9.5" fill="#c9a0e8" stroke="#7a4aa8" stroke-width="1.4"/>`)}
    ${part('polar1', `<circle cx="711" cy="336" r="4.5" fill="#e8d4ff" stroke="#7a4aa8" stroke-width="1.2"/>`)}
    ${part('huOvul', `<g id="huRel"><circle cx="800" cy="460" r="23" fill="none" stroke="#f2b8a4" stroke-width="5" stroke-dasharray="3 3"/><circle cx="800" cy="460" r="15" fill="none" stroke="#bfe4ff" stroke-width="3"/><circle cx="800" cy="460" r="12" fill="#c9a0e8" stroke="#7a4aa8" stroke-width="1.4"/></g>${arr(738, 370, 778, 432)}`)}
    ${part('huCL', fold(400, 440, 56, HUC.yellow, 5))}
    ${part('huCA', fold(305, 345, 24, '#f7f3ec', 9))}
    <g pointer-events="none">${arr(344, 254, 392, 230)}${arr(432, 214, 486, 208)}${arr(549, 222, 642, 284)}${arr(640, 430, 462, 446)}${arr(352, 410, 322, 370)}</g>
    ${still ? '' : '<circle id="huOvHi" cx="330" cy="262" r="20" fill="none" stroke="#ffe08a" stroke-width="3" opacity=".9" pointer-events="none"/>'}
    <text class="cap sm" x="500" y="610" text-anchor="middle">يضمحل الجسم الأصفر عند عدم حصول حمل عند المرأة ويتحول إلى كتلة صغيرة تدعى الجسم الأبيض</text>
    <text class="cap sm" x="500" y="640" text-anchor="middle">الشكل (3-41): أحداث الدورة المبيضية في أنثى الإنسان الناضجة جنسياً (ص119)</text>`;
  const SEQ = [[330, 262, 20], [412, 220, 26], [520, 212, 38], [700, 320, 68], [800, 460, 32], [400, 440, 66], [305, 345, 34]];
  return {
    body, fnParts: ['huMatF', 'huOvul', 'huCL'],
    parts: [
      { id: 'huPrimord', anchor: [319, 262], label: [134, 220], side: 'L', short: 'مرحلة الحوصلة البدائية' },
      { id: 'huCA', anchor: [281, 345], label: [134, 330], side: 'L' },
      { id: 'huCL', anchor: [345, 448], label: [134, 440], side: 'L' },
      { id: 'huOvary', anchor: [330, 490], label: [134, 540], side: 'L' },
      { id: 'huPrimF', anchor: [412, 202], label: [380, 120], side: 'C', short: 'مرحلة الحوصلة الأولية' },
      { id: 'huSecF', anchor: [530, 184], label: [866, 150], side: 'R', short: 'مرحلة الحوصلة الثانوية' },
      { id: 'huMatF', anchor: [740, 282], label: [866, 236], side: 'R', short: 'مرحلة الحوصلة الناضجة' },
      { id: 'polar1', anchor: [715, 334], label: [866, 310], side: 'R' },
      { id: 'ooSec', anchor: [703, 352], label: [866, 370], side: 'R' },
      { id: 'huOvul', anchor: [822, 466], label: [866, 470], side: 'R' }
    ],
    tools: [{ id: 'info:huOvCyc', label: 'الدورة المبيضية' }, { id: 'tbl:huOvSt', label: 'مراحل الدورة المبيضية (ص118)' }, { id: 'tbl:huCycSum', label: 'جدول أحداث الدورة (ص121)' }],
    tick(dt, t, a){
      if (still) return;
      const h = a.el('#huOvHi'); if (h){ const p = (t * 0.6) % SEQ.length, i = Math.floor(p), s = SEQ[i];
        h.setAttribute('cx', s[0]); h.setAttribute('cy', s[1]); h.setAttribute('r', n2(s[2] + Math.sin((p - i) * Math.PI) * 4)); h.setAttribute('opacity', n2(0.4 + 0.6 * Math.sin((p - i) * Math.PI))); }
      const r = a.el('#huRel'); if (r){ const p = (t * 0.25) % 1; r.setAttribute('transform', `translate(${n2(-40 * (1 - p))},${n2(-60 * (1 - p))})`); r.setAttribute('opacity', n2(Math.min(1, p * 4))); }
    }
  };
}

/* ───────── 7) التكاثر العذري — ملزمة ص122–124 ───────── */
function huBee(x, y, s, kind){
  const ab = kind === 'queen' ? 34 : kind === 'drone' ? 24 : 21, aby = kind === 'drone' ? 15 : 12;
  const eye = kind === 'drone' ? `<ellipse cx="${n2(x - 33 * s)}" cy="${n2(y - 4 * s)}" rx="${n2(7 * s)}" ry="${n2(9 * s)}" fill="#3a2a10"/>` : `<circle cx="${n2(x - 36 * s)}" cy="${n2(y - 3 * s)}" r="${n2(3 * s)}" fill="#1a1008"/>`;
  let st = ''; for (let i = 0; i < 3; i++){ const sx = x + (12 + i * ab * 0.5) * s; st += `<path d="M${n2(sx)},${n2(y - aby * s * 0.92)} Q${n2(sx + 3 * s)},${n2(y)} ${n2(sx)},${n2(y + aby * s * 0.92)}" stroke="#3a2a10" stroke-width="${n2(4 * s)}" fill="none"/>`; }
  return `<g>
    <ellipse cx="${n2(x - 6 * s)}" cy="${n2(y - 18 * s)}" rx="${n2(20 * s)}" ry="${n2(8 * s)}" transform="rotate(-18 ${n2(x - 6 * s)} ${n2(y - 18 * s)})" fill="rgba(220,240,255,.45)" stroke="#cfe6ff" stroke-width="1.2"/>
    <path d="M${n2(x - 14 * s)},${n2(y + 8 * s)} l${n2(-6 * s)},${n2(12 * s)} M${n2(x - 6 * s)},${n2(y + 9 * s)} l${n2(-2 * s)},${n2(13 * s)} M${n2(x + 2 * s)},${n2(y + 9 * s)} l${n2(4 * s)},${n2(12 * s)}" stroke="#3a2a10" stroke-width="${n2(1.8 * s)}" stroke-linecap="round"/>
    <ellipse cx="${n2(x + (ab + 4) * s)}" cy="${n2(y)}" rx="${n2(ab * s)}" ry="${n2(aby * s)}" fill="#f2c14e" stroke="#8a6a1e" stroke-width="1.4"/>${st}
    <ellipse cx="${n2(x - 6 * s)}" cy="${n2(y)}" rx="${n2(13 * s)}" ry="${n2(11 * s)}" fill="#c98f1e" stroke="#8a6a1e" stroke-width="1.4"/>
    <circle cx="${n2(x - 28 * s)}" cy="${n2(y)}" r="${n2(10 * s)}" fill="#6a4614" stroke="#8a6a1e" stroke-width="1.4"/>${eye}
    <path d="M${n2(x - 34 * s)},${n2(y - 8 * s)} q${n2(-6 * s)},${n2(-12 * s)} ${n2(-14 * s)},${n2(-12 * s)} M${n2(x - 30 * s)},${n2(y - 9 * s)} q${n2(-2 * s)},${n2(-14 * s)} ${n2(-8 * s)},${n2(-17 * s)}" fill="none" stroke="#3a2a10" stroke-width="${n2(1.6 * s)}"/>
    <ellipse cx="${n2(x - 2 * s)}" cy="${n2(y - 20 * s)}" rx="${n2(16 * s)}" ry="${n2(6 * s)}" transform="rotate(12 ${n2(x - 2 * s)} ${n2(y - 20 * s)})" fill="rgba(220,240,255,.55)" stroke="#cfe6ff" stroke-width="1.2"/></g>`;
}
function huLizardSvg(x, y, s){
  const P = [[x - 70 * s, y], [x - 40 * s, y - 9 * s], [x, y - 10 * s], [x + 40 * s, y - 7 * s], [x + 80 * s, y - 3 * s], [x + 130 * s, y + 2 * s], [x + 165 * s, y + 6 * s]];
  const Q = [[x + 165 * s, y + 7 * s], [x + 130 * s, y + 6 * s], [x + 80 * s, y + 7 * s], [x + 40 * s, y + 10 * s], [x, y + 11 * s], [x - 40 * s, y + 9 * s]];
  const leg = (lx, ly, dir, fl) => `<path d="M${n2(lx)},${n2(ly)} l${n2(dir * 6 * s)},${n2(fl * 14 * s)} l${n2(dir * 10 * s)},${n2(fl * 4 * s)}" fill="none" stroke="#7a9a5a" stroke-width="${n2(4 * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g>${leg(x - 34 * s, y - 6 * s, -1, -1)}${leg(x - 34 * s, y + 6 * s, -1, 1)}${leg(x + 34 * s, y - 6 * s, 1, -1)}${leg(x + 34 * s, y + 6 * s, 1, 1)}
    <path d="${smoothOpen(P)} L${Q.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L')} Q${n2(x - 70 * s)},${n2(y + 8 * s)} ${n2(x - 86 * s)},${n2(y)} Q${n2(x - 78 * s)},${n2(y - 7 * s)} ${n2(x - 70 * s)},${n2(y)}Z" fill="#a8c070" stroke="#5a7a3a" stroke-width="1.6"/>
    <path d="M${n2(x - 50 * s)},${n2(y - 3 * s)} L${n2(x + 110 * s)},${n2(y - 2 * s)} M${n2(x - 50 * s)},${n2(y + 3 * s)} L${n2(x + 100 * s)},${n2(y + 4 * s)}" stroke="#f2f0c8" stroke-width="${n2(1.6 * s)}" opacity=".85"/>
    <circle cx="${n2(x - 72 * s)}" cy="${n2(y - 3 * s)}" r="${n2(2 * s)}" fill="#1a1a10"/></g>`;
}
function huChromCell(x, y, r, pairs, fill, id){
  const C = ['#ff6b6b', '#4ecdc4', '#ffd166', '#a29bfe'];
  let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="2"/>`;
  const n = pairs.length; pairs.forEach((m, i) => { for (let j = 0; j < m; j++){ const cx = x - (n - 1) * 9 + i * 18 + (j - (m - 1) / 2) * 6; s += `<rect ${id ? `class="${id}"` : ''} x="${n2(cx - 2)}" y="${n2(y - 12 + (i % 2) * 4)}" width="4" height="${16 - (i % 2) * 4}" rx="2" fill="${C[i % 4]}"/>`; } });
  return s;
}
function huParth(still){
  const vlv = `<g id="huValve"><rect x="682" y="292" width="16" height="5" rx="2" fill="#d9784a"/></g>`;
  let sacD = ''; for (let i = 0; i < 9; i++) sacD += `<g transform="translate(${n2(678 + (i % 3) * 10)},${n2(248 + Math.floor(i / 3) * 9)}) rotate(${(i * 40) % 360})">${huMiniSp('#ffffff', 0.55)}</g>`;
  const spFlow = huMov('huSpV', [[690, 270], [690, 300], [690, 318], [640, 350], [604, 372]], 4, () => huMiniSp('#ffffff', 0.7));
  const eggMove = `<g id="huBeeEgg"><ellipse rx="9" ry="6" fill="#fff7e0" stroke="#e8c88a" stroke-width="1.4"/></g>`;
  const body = `
    <rect x="505" y="66" width="352" height="524" rx="18" fill="rgba(242,193,78,.06)" stroke="rgba(242,193,78,.35)" stroke-dasharray="6 6"/>
    <rect x="140" y="66" width="348" height="524" rx="18" fill="rgba(168,192,112,.06)" stroke="rgba(168,192,112,.35)" stroke-dasharray="6 6"/>
    ${part('huHoneybee', `<text class="cap" x="680" y="96" text-anchor="middle">نحل العسل (التكاثر العذري شائع)</text>`)}
    ${part('huWhiptail', `<text class="cap" x="314" y="96" text-anchor="middle">السحالي السوطية (النوع الوحيد)</text>`)}
    ${part('huQueen', huBee(668, 168, 1.35, 'queen'))}
    <text class="cap sm" x="668" y="214" text-anchor="middle">الملكة (2س) — تلقح مرة واحدة في حياتها</text>
    ${part('huSpSac', `<circle cx="690" cy="258" r="24" fill="rgba(191,228,255,.25)" stroke="#bfe4ff" stroke-width="2.4"/>${sacD}<path d="M690,282 L690,300" stroke="#bfe4ff" stroke-width="5"/>${vlv}`)}
    <path d="M600,318 L780,318" stroke="#e8c88a" stroke-width="7" stroke-linecap="round" opacity=".7"/>
    ${gArrow(640, 330, 606, 362, '#ffd166')}${gArrow(740, 330, 774, 362, '#ffd166')}
    <text id="huVTxt" class="cap sm" x="690" y="342" text-anchor="middle"></text>
    ${part('huFertEgg', `<ellipse cx="600" cy="384" rx="16" ry="11" fill="#fff7e0" stroke="#e8c88a" stroke-width="2"/><circle cx="600" cy="384" r="4" fill="#d9784a"/>`)}
    <text class="cap sm" x="636" y="389" text-anchor="middle">2س</text>
    ${part('huUnfert', `<ellipse cx="780" cy="384" rx="16" ry="11" fill="#fff7e0" stroke="#e8c88a" stroke-width="2"/><circle cx="780" cy="384" r="3" fill="#7fb2ff"/>`)}
    <text class="cap sm" x="744" y="389" text-anchor="middle">س</text>
    ${gArrow(600, 400, 600, 452, '#ffd166')}${gArrow(780, 400, 780, 452, '#ffd166')}
    ${part('huWorker', huBee(594, 484, 0.9, 'worker'))}
    ${part('huDrone', huBee(770, 484, 1.0, 'drone'))}
    <text class="cap sm" x="600" y="528" text-anchor="middle">إناث (2س)</text><text class="cap sm" x="780" y="528" text-anchor="middle">ذكور (س)</text>
    ${still ? '' : spFlow.svg + eggMove}
    ${part('huLizard', huLizardSvg(300, 150, 0.95))}
    <text class="cap sm" x="314" y="190" text-anchor="middle">جميع أفراد التجمع إناث (2س)</text>
    ${part('huLizOog', `<g id="huC1">${huChromCell(314, 250, 26, [2, 2], '#a98ae8')}</g>`)}
    ${gArrow(314, 280, 314, 308, '#ffd166')}
    ${part('huDoubling', `<g id="huC2">${huChromCell(314, 342, 30, [4, 4], '#8f7ad8', 'huDbl')}</g>`)}
    <text class="cap sm" x="404" y="330" text-anchor="middle">تضاعف قبل</text><text class="cap sm" x="404" y="347" text-anchor="middle">الانقسام الاختزالي</text>
    ${gArrow(314, 376, 314, 404, '#ffd166')}<text class="cap sm" x="390" y="395" text-anchor="middle">انقسام اختزالي</text>
    ${part('huLizEgg', `<g id="huC3">${huChromCell(314, 434, 26, [2, 2], '#fff0c8')}</g>`)}
    ${gArrow(314, 464, 314, 494, '#ffd166')}<text class="cap sm" x="396" y="484" text-anchor="middle">تنمو بدون إخصاب</text>
    <g>${huLizardSvg(300, 530, 0.62)}</g><text class="cap sm" x="314" y="566" text-anchor="middle">أنثى جديدة (2س)</text>
    <text class="cap sm" x="232" y="255" text-anchor="middle">2س</text><text class="cap sm" x="232" y="347" text-anchor="middle">4س</text><text class="cap sm" x="232" y="439" text-anchor="middle">2س</text>
    <text class="cap sm" x="500" y="614" text-anchor="middle">يحدث في: الدولابيات، بعض الديدان الخيطية، القشريات، الحشرات، الأسماك، البرمائيات، السحالي الصحراوية</text>
    <text class="cap sm" x="500" y="640" text-anchor="middle">التكاثر العذري (ص122): نوع من التكاثر ينمو فيه الجنين من بيضة غير مخصبة</text>`;
  return {
    body, fnParts: ['huSpSac', 'huDoubling'],
    parts: [
      { id: 'huQueen', anchor: [740, 160], label: [866, 140], side: 'R' },
      { id: 'huSpSac', anchor: [714, 258], label: [866, 258], side: 'R' },
      { id: 'huUnfert', anchor: [796, 384], label: [866, 384], side: 'R' },
      { id: 'huDrone', anchor: [818, 484], label: [866, 484], side: 'R' },
      { id: 'huFertEgg', anchor: [586, 392], label: [555, 430], side: 'C' },
      { id: 'huWorker', anchor: [560, 484], label: [555, 552], side: 'C' },
      { id: 'huLizard', anchor: [222, 150], label: [134, 150], side: 'L' },
      { id: 'huLizOog', anchor: [288, 250], label: [134, 250], side: 'L' },
      { id: 'huDoubling', anchor: [284, 342], label: [134, 342], side: 'L' },
      { id: 'huLizEgg', anchor: [288, 434], label: [134, 434], side: 'L' }
    ],
    tools: [{ id: 'info:huParth', label: 'تعريف التكاثر العذري' }, { id: 'tbl:huChrom', label: 'المجموعة الكروموسومية (ص124)' }],
    tick(dt, t, a){
      if (still) return;
      const ph = (t / 4) % 2, open = ph < 1, k = ph % 1;
      const v = a.el('#huValve'); if (v) v.setAttribute('transform', open ? 'translate(0,0) rotate(70 682 294)' : '');
      const vt = a.el('#huVTxt'); if (vt) vt.textContent = open ? 'الصمام مفتوح ← إخصاب' : 'الصمام مغلق ← بدون إخصاب';
      huMovTick(a, spFlow, t, 50, (p, u) => open && k < 0.75 ? 1 : 0);
      const e = a.el('#huBeeEgg'); if (e){ const tx = open ? 690 - k * 90 : 690 + k * 90, ty = 318 + k * 66; e.setAttribute('transform', `translate(${n2(tx)},${n2(ty)})`); e.setAttribute('opacity', n2(Math.min(1, (1 - k) * 4))); }
      a.all('.huDbl').forEach((r, i) => r.setAttribute('opacity', n2(i % 2 ? 0.55 + 0.45 * Math.sin(t * 2.5) : 1)));
      [1, 2, 3].forEach(i => { const g = a.el('#huC' + i); if (g) g.setAttribute('opacity', n2(Math.floor(t * 0.8) % 3 === i - 1 ? 1 : 0.7)); });
    }
  };
}

/* ───────── 8) التكاثر الخنثي — ملزمة ص125 ───────── */
function huWorm(P, head){
  const PP = prepPath(P); let seg = '';
  for (let d = 8; d < PP.len - 6; d += 12){ const p = alongPath(PP, d), q = alongPath(PP, d + 2), a = Math.atan2(q[1] - p[1], q[0] - p[0]), nx = -Math.sin(a) * 12, ny = Math.cos(a) * 12;
    seg += `M${n2(p[0] - nx)},${n2(p[1] - ny)} L${n2(p[0] + nx)},${n2(p[1] + ny)} `; }
  const c0 = alongPath(PP, head ? PP.len * 0.62 : PP.len * 0.38);
  return `${huTube(P, '#d98a8a', 28)}<path d="${seg}" stroke="#b86868" stroke-width="1.3"/>
    <ellipse cx="${n2(c0[0])}" cy="${n2(c0[1])}" rx="30" ry="16" fill="#c25a6a" opacity=".9"/>`;
}
function huHerm(still){
  const WA = [[230, 160], [330, 150], [430, 160], [530, 158], [640, 150], [770, 158]];
  const WB = [[770, 230], [670, 238], [570, 230], [470, 232], [360, 240], [230, 232]];
  const exA = huMov('huExA', [[560, 172], [540, 195], [520, 218]], 3, () => `<circle r="3.4" fill="#7fb2ff" stroke="#fff" stroke-width=".8"/>`);
  const exB = huMov('huExB', [[440, 218], [460, 195], [480, 172]], 3, () => `<circle r="3.4" fill="#ff9ec7" stroke="#fff" stroke-width=".8"/>`);
  let tape = `<circle cx="250" cy="508" r="12" fill="#f2ead8" stroke="#c9b48a" stroke-width="2"/><circle cx="244" cy="503" r="3" fill="#c9b48a"/><circle cx="252" cy="514" r="3" fill="#c9b48a"/><path d="M262,508 L290,508" stroke="#f2ead8" stroke-width="8"/>`;
  let x = 290; for (let i = 0; i < 12; i++){ const w = 14 + i * 3.2, h = 16 + i * 2.6; tape += `<rect x="${n2(x)}" y="${n2(508 - h / 2)}" width="${n2(w)}" height="${n2(h)}" rx="3" fill="#f2ead8" stroke="#c9b48a" stroke-width="1.6"/>`;
    if (i >= 7){ for (let j = 0; j < 4; j++) tape += `<circle cx="${n2(x + 6 + (j % 2) * (w - 12))}" cy="${n2(508 - h / 4 + Math.floor(j / 2) * h / 2)}" r="2.6" fill="#7fb2ff"/>`;
      tape += `<ellipse cx="${n2(x + w / 2)}" cy="508" rx="${n2(w * 0.22)}" ry="${n2(h * 0.16)}" fill="#ff9ec7"/>`; }
    x += w + 2; }
  const self = `<path d="M${n2(x - 40)},${n2(478)} q14,-22 28,0" fill="none" stroke="#ffd166" stroke-width="2.4"/><path d="M${n2(x - 12)},478 l-6,-6 m6,6 l-8,2" stroke="#ffd166" stroke-width="2.4" fill="none"/>`;
  const body = `
    ${part('huHerm', `<text class="cap" x="500" y="58" text-anchor="middle">التكاثر الخنثي: أعضاء ذكرية وأنثوية في نفس الفرد</text>`)}
    <text class="cap sm" x="500" y="104" text-anchor="middle">كيف تتحاشى الخناث الإخصاب الذاتي؟</text>
    ${part('huEarthworm', huWorm(WA, true) + huWorm(WB, false) + `<circle cx="776" cy="158" r="3" fill="#5a2a2a"/><circle cx="224" cy="232" r="3" fill="#5a2a2a"/>`)}
    ${part('huSpEx', `<path d="M560,174 L520,216 M440,216 L480,174" stroke="#ffe08a" stroke-width="2" stroke-dasharray="4 4"/>`)}
    ${still ? '' : exA.svg + exB.svg}
    <text class="cap sm" x="500" y="284" text-anchor="middle">1) تبادل الخلايا التناسلية: بيوض كل دودة أرض تخصب من قبل الفرد المقترن بها والعكس بالعكس</text>
    ${part('huTimeMat', `<line x1="260" y1="404" x2="742" y2="404" stroke="#d8d0e8" stroke-width="2"/><path d="M742,404 l-9,-5 l0,10Z" fill="#d8d0e8"/>
      <rect x="282" y="334" width="200" height="22" rx="8" fill="#7fb2ff" opacity=".85"/><rect x="520" y="366" width="200" height="22" rx="8" fill="#ff9ec7" opacity=".85"/>`)}
    <text class="cap sm" x="382" y="350" text-anchor="middle">نضج النطف</text><text class="cap sm" x="620" y="382" text-anchor="middle">نضج البيوض</text><text class="cap sm" x="756" y="420" text-anchor="middle">الزمن</text>
    <line id="huTm" x1="282" y1="326" x2="282" y2="404" stroke="#ffe08a" stroke-width="2"/>
    <text class="cap sm" x="500" y="434" text-anchor="middle">2) نمو ونضج البيوض (والنطف) في أوقات متباينة</text>
    ${part('huTapeworm', tape + self)}
    <text class="cap sm" x="500" y="568" text-anchor="middle">الدودة الشريطية خنثى قادرة على الإخصاب الذاتي (نطف ● وبيوض ● في نفس القطعة)</text>
    <text class="cap sm" x="500" y="608" text-anchor="middle">اللافقريات: بعض الهيدرات، الديدان المسطحة (الشريطية)، الحلقية (دودة الأرض)، القشريات — الفقريات: نادرة عدا الأسماك</text>
    <text class="cap sm" x="500" y="640" text-anchor="middle">الخناث (ص125): حيوانات تمتلك أعضاء تكاثرية ذكرية وأنثوية في نفس الفرد وتستطيع إنتاج النطف والبيوض</text>`;
  return {
    body, fnParts: ['huSpEx', 'huTimeMat'],
    parts: [
      { id: 'huEarthworm', anchor: [770, 160], label: [866, 160], side: 'R' },
      { id: 'huSpEx', anchor: [470, 196], label: [134, 196], side: 'L' },
      { id: 'huTimeMat', anchor: [722, 377], label: [866, 377], side: 'R' },
      { id: 'huTapeworm', anchor: [250, 520], label: [134, 510], side: 'L' }
    ],
    tools: [{ id: 'info:huHerm', label: 'تعريف الخناث' }],
    tick(dt, t, a){
      if (still) return;
      huMovTick(a, exA, t, 22); huMovTick(a, exB, t, 22);
      const p = (t * 0.12) % 1, xm = 282 + p * 440, tm = a.el('#huTm'); if (tm){ tm.setAttribute('x1', n2(xm)); tm.setAttribute('x2', n2(xm)); }
    }
  };
}
