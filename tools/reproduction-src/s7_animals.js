/* ══════════════════════════════════════════════════════════════════════════
   4.7 · التكاثر في الحشرات والضفدع — ملزمة ص93–104: الجهاز التناسلي الذكري
         والأنثوي في الحشرات (ص94)، الإخصاب والبيوضة/الولودة (ص96–97)،
         الجهاز التكاثري في الضفدع (ص98–99)، التزاوج والإخصاب ودورة الحياة (ص100–101)
   ══════════════════════════════════════════════════════════════════════════ */
const AN_IVIEWS = [
  { id: 'anIvM', label: 'الجهاز الذكري' },
  { id: 'anIvF', label: 'الجهاز الأنثوي' },
  { id: 'anIvX', label: 'الإخصاب' }
];
const AN_FVIEWS = [
  { id: 'anFvM', label: 'الجهاز الذكري' },
  { id: 'anFvF', label: 'الجهاز الأنثوي' },
  { id: 'anFvX', label: 'التزاوج والإخصاب' },
  { id: 'anFvC', label: 'دورة الحياة' }
];

SCENES.anInsect = {
  title: 'التكاثر في الحشرات',
  get src(){ return ({ anIvM: 'ملزمة ص94', anIvF: 'ملزمة ص94', anIvX: 'ملزمة ص96–97' })[SEL.anIv] || 'ملزمة ص93'; },
  tint: ['rgba(80,140,220,.22)', 'rgba(230,160,60,.16)'],
  build(){
    const v = AN_IVIEWS.some(x => x.id === SEL.anIv) ? SEL.anIv : 'anIvM';
    const s = v === 'anIvF' ? anIFemale() : v === 'anIvX' ? anIFert() : anIMale();
    s.rebuildOnRadio = 'anIv';
    s.tools = AN_IVIEWS.map(x => ({ id: x.id, label: x.label, radio: 'anIv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.anFrog = {
  title: 'التكاثر في الضفدع',
  get src(){ return ({ anFvM: 'ملزمة ص98–99', anFvF: 'ملزمة ص98–100', anFvX: 'ملزمة ص100–102', anFvC: 'ملزمة ص100–101' })[SEL.anFv] || 'ملزمة ص97'; },
  tint: ['rgba(70,160,110,.24)', 'rgba(60,110,170,.16)'],
  build(){
    const v = AN_FVIEWS.some(x => x.id === SEL.anFv) ? SEL.anFv : 'anFvM';
    const s = v === 'anFvF' ? anFFemale() : v === 'anFvX' ? anFMate() : v === 'anFvC' ? anFCycle() : anFMale();
    s.rebuildOnRadio = 'anFv';
    s.tools = AN_FVIEWS.map(x => ({ id: x.id, label: x.label, radio: 'anFv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.an_imale   = { title: 'الجهاز التناسلي الذكري في الحشرات', src: 'ملزمة ص94', build: st => anIMale(st) };
SCENES.an_ifemale = { title: 'الجهاز التناسلي الأنثوي في الحشرات', src: 'ملزمة ص94', build: st => anIFemale(st) };
SCENES.an_ifert   = { title: 'الإخصاب والتكاثر في الحشرات', src: 'ملزمة ص96–97', build: st => anIFert(st) };
SCENES.an_fmale   = { title: 'الجهاز التناسلي الذكري في الضفادع', src: 'ملزمة ص99', build: st => anFMale(st) };
SCENES.an_ffemale = { title: 'الجهاز التناسلي الأنثوي في الضفادع', src: 'ملزمة ص99', build: st => anFFemale(st) };
SCENES.an_fmate   = { title: 'التزاوج والإخصاب في الضفدع', src: 'ملزمة ص100–102', build: st => anFMate(st) };
SCENES.an_fcycle  = { title: 'دورة حياة الضفدع', src: 'ملزمة ص101', build: st => anFCycle(st) };

/* ───────── أدوات مشتركة ───────── */
/* أنبوب: الرفيع خط واحد (حافة + حشوة)، والسميك (w ≥ 9) شكل مغلق بجدارين ونهايتين مدورتين
   حتى يُرسم في الرسم اليدوي بخطين متوازيين كما في رسم الملزمة */
const anTube = (pts, w, fill, edge) => {
  if (w < 9){ const d = smoothOpen(pts);
    return `<path d="${d}" fill="none" stroke="${edge}" stroke-width="${n2(w + 4)}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${n2(w)}" stroke-linecap="round" stroke-linejoin="round"/>`; }
  const S = anSample(pts, 6), h = w / 2 + 1, Lp = [], Rp = [];
  S.forEach((p, i) => { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    Lp.push([p[0] - dy / l * h, p[1] + dx / l * h]); Rp.push([p[0] + dy / l * h, p[1] - dx / l * h]); });
  const f = p => n2(p[0]) + ',' + n2(p[1]);
  const d = `M${f(Lp[0])} L${Lp.slice(1).map(f).join(' L')} A${n2(h)},${n2(h)} 0 0 0 ${f(Rp[Rp.length - 1])} L${Rp.slice(0, -1).reverse().map(f).join(' L')} A${n2(h)},${n2(h)} 0 0 0 ${f(Lp[0])}Z`;
  return `<path d="${d}" fill="${fill}" stroke="${edge}" stroke-width="2.2" stroke-linejoin="round"/>`;
};
const anMir = pts => pts.map(p => [1000 - p[0], p[1]]);
/* نقاط كثيفة على منحنى smoothOpen نفسه (لحركة النطف والبيوض) */
function anSample(pts, per){
  per = per || 8; const out = [];
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < per; k++){ const u = k / per, v = 1 - u;
      out.push([v * v * v * p1[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p2[0],
                v * v * v * p1[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p2[1]]); }
  }
  out.push(pts[pts.length - 1]); return out;
}
/* سلسلة مسارات متتابعة ← مسار واحد جاهز للحركة */
const anPath = (...segs) => prepPath(segs.reduce((a, s) => a.concat(anSample(s)), []));
/* نقاط متحركة (خارج الأجزاء، مخفية حتى تبدأ الحركة) */
const anDots = (cls, n, r, fill, stroke) => Array.from({ length: n }, (_, i) =>
  `<circle class="${cls}" data-i="${i}" cx="-40" cy="-40" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1.2"` : ''} opacity="0"/>`).join('');
function anRun(a, cls, paths, t, speed, gap, op){
  const els = a.all('.' + cls), per = Math.max(1, Math.ceil(els.length / paths.length));
  els.forEach((e, i) => {
    const p = paths[i % paths.length], j = Math.floor(i / paths.length), L = p.len + gap;
    const d = (t * speed + j * L / per) % L;
    if (d > p.len){ e.setAttribute('opacity', 0); return; }
    const q = alongPath(p, d);
    if (e.tagName === 'g') e.setAttribute('transform', `translate(${n2(q[0])},${n2(q[1])})`);
    else { e.setAttribute('cx', n2(q[0])); e.setAttribute('cy', n2(q[1])); }
    e.setAttribute('opacity', op || 0.95);
    e.dataset.u = n2(d / p.len * 100) / 100;
  });
}
const anCap = (txt, y) => `<text class="cap sm" x="500" y="${y || 650}" text-anchor="middle">${txt}</text>`;

/* ───────── 1) الجهاز التناسلي الذكري في الحشرات — ص94 ───────── */
const AN_IM = {
  vas: [[410, 205], [392, 228], [356, 246], [344, 272], [366, 296], [342, 322], [352, 350]],
  ves: [[352, 352], [380, 395], [415, 435], [448, 468]],
  duct: [[448, 468], [478, 498], [498, 520]],
  gland: [[466, 140], [462, 220], [468, 320], [478, 420], [496, 518]],
  ejac: [[500, 518], [500, 575]], pen: [[500, 575], [500, 610]]
};
function anIMale(still){
  const M = AN_IM, blue = '#5aa6f2', blueD = '#1d5fb0';
  const testis = (cx, cy, rot) => `<g transform="translate(${cx},${cy}) rotate(${rot})"><ellipse rx="40" ry="62" fill="#d7c9ff" stroke="#7d5bd6" stroke-width="3"/></g>`;
  const tubules = (cx, cy, rot) => { let s = ''; for (let k = -3; k <= 3; k++){ const x = k * 9, h = 54 * Math.sqrt(1 - (x / 40) ** 2);
      s += `<path d="M${x},${n2(-h)} Q${x + 13},0 ${x},${n2(h)}" fill="none" stroke="#3d7be0" stroke-width="2.2" stroke-linecap="round"/>`; }
    return `<g transform="translate(${cx},${cy}) rotate(${rot})">${s}</g>`; };
  const body = `
    ${part('anTestis', testis(395, 150, -18) + testis(605, 150, 18))}
    ${part('anSemTub', tubules(395, 150, -18) + tubules(605, 150, 18))}
    ${part('anIAccM', anTube(M.gland, 20, '#3d9cf0', blueD) + anTube(anMir(M.gland), 20, '#3d9cf0', blueD))}
    <path id="anGlow" d="${smoothOpen(M.gland)} ${smoothOpen(anMir(M.gland))}" fill="none" stroke="#c8f4ff" stroke-width="9" stroke-linecap="round" opacity="0"/>
    ${part('anVasDef', anTube(M.vas, 5, blue, blueD) + anTube(anMir(M.vas), 5, blue, blueD) + anTube(M.duct, 5, blue, blueD) + anTube(anMir(M.duct), 5, blue, blueD))}
    ${part('anSemVes', anTube(M.ves, 24, '#a8e6d6', '#3a8f80') + anTube(anMir(M.ves), 24, '#a8e6d6', '#3a8f80'))}
    ${part('anEjac', anTube(M.ejac, 9, blue, blueD))}
    ${part('anPenis', anTube(M.pen, 14, '#2f86e0', '#123f80'))}
    ${part('anGenOp', `<circle cx="500" cy="615" r="6" fill="#0d2a55" stroke="#e8f2ff" stroke-width="2"/>`)}
    <g id="anFlowM">${still ? '' : anDots('anSpM', 16, 3.2, '#f4f8ff', '#3d7be0') + anDots('anSecM', 8, 3.6, '#c8f4ff')}</g>
    ${anCap('الجهاز التناسلي الذكري في الحشرات — ملزمة ص94 (ارسم مع التأشير — وزاري)')}`;
  const pL = anPath([[395, 150], [410, 205]], M.vas, M.ves, M.duct, M.ejac, M.pen, [[500, 610], [500, 640]]);
  const pR = anPath([[605, 150], [590, 205]], anMir(M.vas), anMir(M.ves), anMir(M.duct), M.ejac, M.pen, [[500, 610], [500, 640]]);
  const gL = anPath(M.gland, M.ejac), gR = anPath(anMir(M.gland), M.ejac);
  return {
    body, fnParts: ['anIAccM', 'anVasDef'],
    parts: [
      { id: 'anTestis', anchor: [649, 143], label: [866, 110], side: 'R' },
      { id: 'anVasDef', anchor: [656, 272], label: [866, 265], side: 'R' },
      { id: 'anSemVes', anchor: [585, 435], label: [866, 400], side: 'R' },
      { id: 'anEjac', anchor: [505, 545], label: [866, 520], side: 'R' },
      { id: 'anPenis', anchor: [508, 597], label: [866, 585], side: 'R' },
      { id: 'anSemTub', anchor: [392, 150], label: [134, 150], side: 'L' },
      { id: 'anIAccM', anchor: [464, 300], label: [134, 330], side: 'L' },
      { id: 'anGenOp', anchor: [494, 616], label: [134, 600], side: 'L' }
    ],
    tools: [{ id: 'info:anInsects', label: 'عن التكاثر في الحشرات' }, { id: 'tbl:anMF', label: 'الذكري × الأنثوي (ص94)' },
      { id: 'tbl:anOrigin', label: 'التركيب والمنشأ (ص97)' }, { id: 'tbl:anLocFn', label: 'الموقع والوظيفة (ص97)' }],
    tick(dt, t, a){
      anRun(a, 'anSpM', [pL, pR], t, 60, 120);
      anRun(a, 'anSecM', [gL, gR], t, 40, 160, 0.8);
      const g = a.el('#anGlow'); if (g) g.setAttribute('opacity', n2(0.12 + 0.12 * Math.sin(t * 2.2)));
    }
  };
}

/* ───────── 2) الجهاز التناسلي الأنثوي في الحشرات — ص94 ───────── */
const AN_IF = {
  lat: [[372, 350], [392, 385], [430, 410], [476, 424], [500, 430]],
  med: [[500, 430], [500, 478]],
  acc: [[440, 560], [400, 568], [352, 548], [318, 505], [312, 460]],
  spD: [[548, 508], [570, 482], [588, 464]],
  gl: [[620, 434], [640, 405], [652, 382]]
};
function anIFemale(still){
  const F = AN_IF, gold = '#f5b84a', goldD = '#a8661a';
  const OV = s => { /* أربعة فروع مبيض لكل جانب (s = ±1 للمرآة) */
    let sheath = '', beads = '', fil = '', eggs = '';
    for (let i = 0; i < 4; i++){
      const bx0 = 318 + i * 36, tx0 = 372 + i * 14, bx = s > 0 ? bx0 : 1000 - bx0, tx = s > 0 ? tx0 : 1000 - tx0, by = 294, ty = 118;
      const L = [], R = [];
      for (let k = 0; k <= 8; k++){ const u = k / 8, x = tx + (bx - tx) * u, y = ty + (by - ty) * u, w = 3 + u * 12; L.push([x - w, y]); R.unshift([x + w, y]); }
      sheath += `<path d="M${L.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L')} L${R.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L')}Z" fill="#f7c766" stroke="${goldD}" stroke-width="1.6" stroke-linejoin="round"/>`;
      for (let k = 0; k < 7; k++){ const u = 0.06 + k * 0.14, x = tx + (bx - tx) * u, y = ty + (by - ty) * u;
        beads += `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(3 + u * 9)}" fill="#ffe1a0" stroke="#c48a2a" stroke-width="1.2"/>`; }
      const fx = s > 0 ? 448 : 552;
      fil += `<path d="M${tx},${ty} Q${n2((tx + fx) / 2 + (s > 0 ? -6 : 6))},${n2((ty + 40) / 2 + 10)} ${fx},40" fill="none" stroke="#e6a640" stroke-width="2"/>`;
      eggs += `<ellipse cx="${bx}" cy="${by + 22}" rx="16" ry="23" fill="${gold}" stroke="${goldD}" stroke-width="2"/><ellipse cx="${bx - 4}" cy="${by + 14}" rx="5" ry="7" fill="#fff3d0" opacity=".6"/>`;
    }
    return { sheath, beads, fil, eggs };
  };
  const A = OV(1), B = OV(-1);
  const calyx = s => { const c = s > 0 ? 372 : 628; return `<path d="M${s > 0 ? 302 : 698},336 Q${c},368 ${s > 0 ? 442 : 558},336 L${c + 12},356 L${c - 12},356Z" fill="#f2a43a" stroke="${goldD}" stroke-width="1.8"/>`; };
  const env = s => `<ellipse cx="${s > 0 ? 372 : 628}" cy="300" rx="92" ry="60" fill="rgba(255,200,110,.10)" stroke="rgba(255,210,140,.55)" stroke-width="2" stroke-dasharray="6 5"/>`;
  const body = `
    ${part('anIOvary', env(1) + env(-1) + calyx(1) + calyx(-1) + A.eggs + B.eggs)}
    ${part('anOvariole', A.fil + B.fil + A.sheath + B.sheath + A.beads + B.beads)}
    ${part('anLatOvi', anTube(F.lat, 12, '#f2a43a', goldD) + anTube(anMir(F.lat), 12, '#f2a43a', goldD))}
    ${part('anIAccF', anTube(F.acc, 13, '#f0a040', goldD) + anTube(anMir(F.acc), 13, '#f0a040', goldD))}
    ${part('anVagina', `<path d="M440,500 L560,500 Q580,500 578,522 L572,590 Q570,604 556,604 L444,604 Q430,604 428,590 L422,522 Q420,500 440,500Z" fill="${gold}" stroke="${goldD}" stroke-width="2.4"/>
      <path d="M452,520 Q500,532 548,520" fill="none" stroke="#fff0c8" stroke-width="2" opacity=".6"/>`)}
    ${part('anMedOvi', anTube(F.med, 18, '#f2a43a', goldD) + `<ellipse cx="500" cy="488" rx="24" ry="18" fill="#f6b453" stroke="${goldD}" stroke-width="2.2"/>`)}
    ${part('anSpth', anTube(F.spD, 5, '#ff9c7a', '#a84a2a') + `<circle cx="605" cy="450" r="22" fill="#ffa98a" stroke="#c0603a" stroke-width="2.4"/><circle cx="598" cy="443" r="7" fill="#ffd8c8" opacity=".6"/>`)}
    ${part('anSpthGl', anTube(F.gl, 6, '#ffb08a', '#a84a2a') + `<circle cx="655" cy="375" r="7" fill="#ffc4a4" stroke="#a84a2a" stroke-width="2"/>`)}
    <g id="anFlowF">${still ? '' : Array.from({ length: 6 }, (_, i) => `<g class="anEgI" data-i="${i}" opacity="0"><ellipse rx="6" ry="8" fill="#fff4cc" stroke="#b07a1a" stroke-width="1.4"/></g>`).join('') + anDots('anSpF', 6, 2.8, '#eaf2ff', '#3d7be0')}</g>
    ${anCap('الجهاز التناسلي الأنثوي في الحشرات — ملزمة ص94 (ارسم مع التأشير — وزاري)')}`;
  const eL = anPath([[386, 140], [372, 300], [372, 350]], F.lat, F.med, [[500, 478], [500, 550]]);
  const eR = anPath([[614, 140], [628, 300], [628, 350]], anMir(F.lat), F.med, [[500, 478], [500, 550]]);
  const sp = anPath([[605, 450], [588, 464]], F.spD.slice().reverse(), [[548, 508], [515, 545]]);
  return {
    body, fnParts: ['anSpth', 'anMedOvi'],
    parts: [
      { id: 'anOvariole', anchor: [655, 218], label: [866, 150], side: 'R' },
      { id: 'anSpthGl', anchor: [650, 386], label: [866, 340], side: 'R' },
      { id: 'anSpth', anchor: [627, 452], label: [866, 430], side: 'R' },
      { id: 'anIAccF', anchor: [683, 512], label: [866, 510], side: 'R' },
      { id: 'anVagina', anchor: [572, 585], label: [866, 590], side: 'R' },
      { id: 'anIOvary', anchor: [302, 318], label: [134, 290], side: 'L' },
      { id: 'anLatOvi', anchor: [418, 405], label: [134, 390], side: 'L' },
      { id: 'anMedOvi', anchor: [489, 458], label: [134, 470], side: 'L' }
    ],
    tools: [{ id: 'info:anInsects', label: 'عن التكاثر في الحشرات' }, { id: 'tbl:anMF', label: 'الذكري × الأنثوي (ص94)' },
      { id: 'tbl:anOrigin', label: 'التركيب والمنشأ (ص97)' }, { id: 'tbl:anLocFn', label: 'الموقع والوظيفة (ص97)' }],
    tick(dt, t, a){ anRun(a, 'anEgI', [eL, eR], t, 34, 90); anRun(a, 'anSpF', [sp], t, 30, 70, 0.9); }
  };
}

/* حشرة (منظر علوي) — الرأس للأعلى قبل التدوير */
const anBug = (x, y, s, ang, col, colD) => {
  let legs = '';
  [-10, 0, 10].forEach((dy, i) => [-1, 1].forEach(sd => {
    legs += `<path d="M${sd * 8},${dy} L${sd * 26},${dy - 10 + i * 6} L${sd * 34},${dy + 6 + i * 10}" fill="none" stroke="${colD}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`; }));
  let seg = ''; for (let k = 0; k < 5; k++) seg += `<path d="M-14,${24 + k * 10} Q0,${28 + k * 10} 14,${24 + k * 10}" fill="none" stroke="${colD}" stroke-width="1.4" opacity=".7"/>`;
  return `<g transform="translate(${x},${y}) rotate(${ang}) scale(${s})">${legs}
    <path d="M-4,-28 Q-14,-50 -24,-58 M4,-28 Q14,-50 24,-58" fill="none" stroke="${colD}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="0" cy="42" rx="17" ry="34" fill="${col}" stroke="${colD}" stroke-width="2"/>${seg}
    <ellipse cx="0" cy="0" rx="13" ry="14" fill="${col}" stroke="${colD}" stroke-width="2"/>
    <circle cx="0" cy="-22" r="10" fill="${col}" stroke="${colD}" stroke-width="2"/>
    <circle cx="-5" cy="-25" r="2.6" fill="#1a1a1a"/><circle cx="5" cy="-25" r="2.6" fill="#1a1a1a"/>
    <path d="M-2,4 Q-26,30 -10,64 Q-4,40 -2,4Z M2,4 Q26,30 10,64 Q4,40 2,4Z" fill="#dff0ff" opacity=".35" stroke="#e8f4ff" stroke-width="1"/></g>`;
};

/* ───────── 3) الإخصاب والتكاثر في الحشرات — ص96–97 ───────── */
const AN_IFERT_ST = [
  { n: '1 · الجماع', d: 'تلتقي حشرتان بالغتان من نفس النوع إحداهما ذكر والأخرى أنثى ويحصل الجماع (الإناث في معظم الحشرات أكبر حجماً من الذكور).' },
  { n: '2 · طرح النطف في المهبل', d: 'يطرح الذكر النطف في مهبل الأنثى محاطة بكيس النطف الذي تكوّنه إفرازات الغدتين المساعدتين، ويتسلم المستودع المنوي النطف أثناء الجماع وتحفظها إفرازات غدة المستودع المنوي.' },
  { n: '3 · الإخصاب', d: 'تطرح الأنثى بيوضها الناضجة في المهبل أيضاً (عن طريق قناة البيض الرئيسية)، ويطلق المستودع المنوي النطف فتخصب النطف البيوض.' },
  { n: '4 · الحشرات البيوضة', d: 'تضع بيوضها المخصبة في أماكن ملائمة لنموها: في حفر تحفرها بآلة وضع البيض، أو تلصقها على أوراق النباتات، أو في حفر في سويق نباتات معينة. وفي أنثى الصرصر تكوّن الغدد المساعدة كيس البيض.' },
  { n: '5 · الحشرات البيوضة الولودة', d: 'تحتفظ بالبيوض المخصبة داخل القناة المبيضية المشتركة حتى ينمو الجنين ويتكامل وتفقس البيوض إلى حوريات أو يرقات، ثم تطرح الصغار إلى الخارج بدل البيوض.' }
];
function anIFert(still){
  const goldD = '#a8661a';
  const mating = `<g data-st="0">${anBug(610, 150, 1.2, -90, '#c98a4a', '#6a3e1a')}${anBug(792, 150, 0.95, 90, '#8a6ad0', '#3e2a7a')}</g>`;
  /* مقطع مبسّط: قناة البيض الرئيسية + المهبل + المستودع المنوي */
  const tract = `<g data-st="1">${anTube([[500, 262], [500, 334]], 16, '#f2a43a', goldD)}</g>`;
  const vag = `<g data-st="1"><ellipse cx="500" cy="382" rx="92" ry="48" fill="#f5b84a" stroke="${goldD}" stroke-width="2.4"/><ellipse cx="500" cy="382" rx="76" ry="34" fill="#ffd98a" opacity=".45"/></g>`;
  const spth = `<g data-st="1">${anTube([[562, 348], [596, 318], [612, 306]], 6, '#ff9c7a', '#a84a2a')}<circle cx="626" cy="296" r="22" fill="#ffa98a" stroke="#c0603a" stroke-width="2.4"/>${anTube([[642, 282], [664, 258]], 5, '#ffb08a', '#a84a2a')}</g>`;
  let sacSp = ''; for (let i = 0; i < 6; i++) sacSp += `<circle cx="${n2(-14 + (i % 3) * 14)}" cy="${n2(-5 + Math.floor(i / 3) * 10)}" r="3" fill="#eaf2ff" stroke="#3d7be0" stroke-width="1"/>`;
  const sac = `<g data-st="1"><g id="anSacMv"><g transform="translate(560,400)"><ellipse rx="30" ry="18" fill="rgba(200,240,255,.55)" stroke="#9fd8ff" stroke-width="2.4"/>${sacSp}</g></g></g>`;
  let fe = ''; [[455, 378], [490, 392], [526, 374]].forEach(([x, y]) => { fe += `<ellipse cx="${x}" cy="${y}" rx="11" ry="15" fill="#fff4cc" stroke="#b07a1a" stroke-width="1.6"/><circle class="anFz" cx="${x}" cy="${y}" r="18" fill="none" stroke="#ffe08a" stroke-width="2.4" opacity=".9"/>`; });
  const fert = `<g data-st="2">${fe}</g>`;
  /* لوحة البيوضة: ورقة ببيوض ملصقة + بطن صرصر يحمل كيس البيض */
  let lfEggs = ''; for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) lfEggs += `<ellipse cx="${206 + c * 16 + r * 8}" cy="${540 + r * 13 - c * 4}" rx="6" ry="5" fill="#fff6d8" stroke="#b08a40" stroke-width="1.1"/>`;
  const leaf = `<g data-st="3"><path d="M160,566 Q220,500 330,520 Q262,590 160,566Z" fill="#5fb85a" stroke="#2e7a32" stroke-width="2"/><path d="M166,562 Q240,540 322,522" fill="none" stroke="#2e7a32" stroke-width="1.6"/>${lfEggs}</g>`;
  const ooth = `<g data-st="3"><ellipse cx="398" cy="520" rx="44" ry="22" transform="rotate(25 398 520)" fill="#8a5a30" stroke="#4a2a10" stroke-width="2"/>
    <path d="M420,548 q8,10 16,14" fill="none" stroke="#4a2a10" stroke-width="2"/>
    <g transform="rotate(25 442 572)"><rect x="420" y="560" width="44" height="22" rx="10" fill="#b0682a" stroke="#4a2a10" stroke-width="2"/>
    <path d="M426,560 L426,582 M434,560 L434,582 M442,560 L442,582 M450,560 L450,582 M458,560 L458,582" stroke="#6a3a14" stroke-width="1.3"/></g></g>`;
  /* لوحة الولودة: بطن أنثى فيه صغار تنمو داخل القناة المبيضية المشتركة، وصغار تخرج */
  let ny = ''; [[610, 540], [645, 548], [680, 536]].forEach(([x, y]) => { ny += `<g transform="translate(${x},${y})"><ellipse rx="11" ry="7" fill="#b9e6a0" stroke="#3e7a2a" stroke-width="1.4"/><circle cx="10" cy="0" r="4" fill="#9fd080"/></g>`; });
  const out = [0, 1].map(i => `<g class="anNy" data-i="${i}"><g transform="translate(${760 + i * 40},${566 + i * 18})"><ellipse rx="12" ry="7" fill="#b9e6a0" stroke="#3e7a2a" stroke-width="1.4"/><circle cx="11" cy="0" r="4.5" fill="#9fd080"/>
    <path d="M-4,6 l-4,7 M4,6 l4,7 M-4,-6 l-4,-7 M4,-6 l4,-7" stroke="#3e7a2a" stroke-width="1.4"/></g></g>`).join('');
  const viv = `<g data-st="4"><ellipse cx="640" cy="542" rx="96" ry="46" fill="#7fb060" stroke="#2e5a20" stroke-width="2.4"/><circle cx="530" cy="534" r="20" fill="#7fb060" stroke="#2e5a20" stroke-width="2.2"/>
    ${anTube([[575, 542], [645, 545], [722, 548]], 22, '#f7d080', '#a8661a')}${ny}<g id="anNyOut">${out}</g></g>`;
  const body = `
    <rect x="150" y="470" width="330" height="140" rx="14" fill="rgba(120,200,110,.06)" stroke="rgba(150,220,130,.4)" stroke-dasharray="6 6"/>
    <rect x="510" y="470" width="340" height="140" rx="14" fill="rgba(140,200,255,.06)" stroke="rgba(140,200,255,.4)" stroke-dasharray="6 6"/>
    <text class="cap sm" x="315" y="490" text-anchor="middle">حشرات بيوضة</text><text class="cap sm" x="680" y="490" text-anchor="middle">حشرات بيوضة ولودة</text>
    <text class="cap sm" x="610" y="232" text-anchor="middle">أنثى (أكبر حجماً)</text><text class="cap sm" x="792" y="232" text-anchor="middle">ذكر</text>
    <text class="cap sm" x="360" y="262" text-anchor="middle">مقطع مبسّط في الجهاز الأنثوي</text>
    ${part('anMating', mating)}
    ${part('anMedOvi', tract)}
    ${part('anVagina', vag)}
    ${part('anSpth', spth)}
    ${part('anSpermSac', sac)}
    ${part('anIFert', fert)}
    ${part('anOvipar', leaf)}
    ${part('anEggSac', ooth)}
    ${part('anVivipar', viv)}
    <g id="anFlowX">${still ? '' : anDots('anSpX', 6, 2.8, '#eaf2ff', '#3d7be0') + Array.from({ length: 3 }, (_, i) => `<g class="anEgX" data-i="${i}" opacity="0"><ellipse rx="8" ry="11" fill="#fff4cc" stroke="#b07a1a" stroke-width="1.4"/></g>`).join('')}</g>
    ${anCap('الإخصاب والتكاثر في الحشرات — ملزمة ص96–97', 645)}`;
  const toSp = anPath([[560, 400], [580, 360], [612, 306]]), fromSp = anPath([[612, 306], [580, 340], [540, 372], [500, 384]]);
  const eggDown = anPath([[500, 250], [500, 334], [492, 380]]);
  const ctl = stageCtl(AN_IFERT_ST, { dur: 30 });
  return {
    body, stages: AN_IFERT_ST, fnParts: ['anIFert', 'anSpermSac'],
    parts: [
      { id: 'anMating', anchor: [706, 150], label: [866, 95], side: 'R' },
      { id: 'anSpth', anchor: [646, 300], label: [866, 290], side: 'R' },
      { id: 'anSpermSac', anchor: [588, 404], label: [866, 400], side: 'R' },
      { id: 'anVivipar', anchor: [730, 526], label: [866, 525], side: 'R' },
      { id: 'anMedOvi', anchor: [508, 282], label: [866, 200], side: 'R' },
      { id: 'anIFert', anchor: [455, 392], label: [330, 448], side: 'C' },
      { id: 'anVagina', anchor: [410, 385], label: [134, 400], side: 'L' },
      { id: 'anOvipar', anchor: [200, 548], label: [134, 530], side: 'L' },
      { id: 'anEggSac', anchor: [430, 576], label: [134, 595], side: 'L' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:anOviViv', label: 'البيوضة × الولودة (ص97)' }, { id: 'tbl:anOrigin', label: 'التركيب والمنشأ (ص97)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k);
      if (still) return;
      const idx = STG.idx, k = STG.k;
      /* كيس النطف يدخل المهبل في المرحلة 2 */
      const mv = a.el('#anSacMv'); if (mv){ const p = idx < 1 ? 0 : idx > 1 ? 1 : Math.min(1, k * 2.2); mv.setAttribute('transform', `translate(${n2((1 - p) * 120)},${n2((1 - p) * 60)})`); }
      a.all('.anSpX').forEach((e, i) => {
        if (idx !== 1 && idx !== 2){ e.setAttribute('opacity', 0); return; }
        const P = idx === 1 ? toSp : fromSp, u = ((idx === 1 ? Math.max(0, k * 2.2 - 0.8) : k * 1.6) * 1.2 + i * 0.14) % 1.1;
        if (u > 1 || (idx === 1 && k < 0.36)){ e.setAttribute('opacity', 0); return; }
        const q = alongPath(P, u * P.len); e.setAttribute('cx', n2(q[0])); e.setAttribute('cy', n2(q[1])); e.setAttribute('opacity', 0.95); });
      a.all('.anEgX').forEach((e, i) => {
        if (idx !== 2){ e.setAttribute('opacity', 0); return; }
        const u = Math.min(1, k * 1.8 - i * 0.2); if (u <= 0){ e.setAttribute('opacity', 0); return; }
        const q = alongPath(eggDown, u * eggDown.len); e.setAttribute('transform', `translate(${n2(q[0] + (i - 1) * 30 * u)},${n2(q[1])})`); e.setAttribute('opacity', u >= 1 ? 0 : 0.95); });
      a.all('.anFz').forEach(e => e.setAttribute('opacity', idx === 2 ? n2(Math.max(0, k * 2 - 0.9) * (0.6 + 0.4 * Math.sin(t * 5))) : 0.9));
      a.all('.anNy').forEach((e, i) => { const p = ((t * 0.25) + i * 0.5) % 1; e.setAttribute('transform', `translate(${n2(p * 40)},${n2(p * 12)})`); e.setAttribute('opacity', n2(1 - Math.max(0, p - 0.8) * 5)); });
    }
  };
}

/* ───────── 4) الجهاز التناسلي الذكري في الضفادع — ص99 ───────── */
const anKidneyD = (cx, cy, flip) => { const f = flip ? -1 : 1, P = [[-30, -110], [20, -112], [38, -60], [34, 30], [22, 100], [-8, 115], [-34, 80], [-38, -10], [-36, -80]];
  return smoothClosed(P.map(([x, y]) => [cx + f * x, cy + y])); };
const anTuft = (x, y, s, id) => { let p = '';
  for (let j = 0; j < 8; j++){ const a = -2.7 + j * 0.2, L = (46 + (j % 3) * 10) * s, bx = x + (j - 3.5) * 3;
    p += `<path d="M${n2(bx)},${y} Q${n2(bx + Math.cos(a) * L * 0.5 + 6)},${n2(y + Math.sin(a) * L * 0.55)} ${n2(bx + Math.cos(a) * L)},${n2(y + Math.sin(a) * L)}" fill="none" stroke="#ffd21f" stroke-width="6" stroke-linecap="round"/>`; }
  return `<g id="${id}">${p}</g>`; };
const AN_FM = { ug: [[440, 410], [424, 440], [428, 480], [452, 512]] };
function anFMale(still){
  const K = '#8e2a2a', KE = '#e89090';
  const kid = cx => `<path d="${anKidneyD(cx, 300, cx > 500)}" fill="${K}" stroke="${KE}" stroke-width="2.4"/>` +
    `<path d="${smoothOpen([[cx, 206], [cx - 8, 250], [cx + 6, 300], [cx - 6, 350], [cx + 2, 398]])}" fill="none" stroke="#ffd34d" stroke-width="3"/>` +
    [240, 280, 320, 360].map(y => `<path d="M${cx - 26},${y} Q${cx},${y + 6} ${cx + 26},${y}" fill="none" stroke="#c05a5a" stroke-width="1.5"/>`).join('');
  const tes = cx => `<ellipse cx="${cx}" cy="215" rx="28" ry="54" fill="#ffe27a" stroke="#c9a228" stroke-width="2.4"/>` +
    [-30, -12, 6, 24].map(dy => `<path d="M${cx - 18},${215 + dy} Q${cx},${221 + dy} ${cx + 18},${215 + dy}" fill="none" stroke="#e0b830" stroke-width="1.4"/>`).join('');
  let mes = ''; for (let y = 178; y <= 254; y += 8){ mes += `<line x1="329" y1="${y}" x2="314" y2="${y + 4}" stroke="#d9d0b0" stroke-width="1.6"/><line x1="671" y1="${y}" x2="686" y2="${y + 4}" stroke="#d9d0b0" stroke-width="1.6"/>`; }
  mes += `<path d="M329,174 Q318,215 329,258 M671,174 Q682,215 671,258" fill="none" stroke="#d9d0b0" stroke-width="2"/>`;
  let eff = ''; for (let j = 0; j < 5; j++){ const y = 190 + j * 12;
    eff += `<path d="M381,${y} Q396,${y - 3} 410,${y + 4}" fill="none" stroke="#fff0b0" stroke-width="2"/><path d="M619,${y} Q604,${y - 3} 590,${y + 4}" fill="none" stroke="#fff0b0" stroke-width="2"/>`; }
  const body = `
    <path d="M330,612 Q300,600 318,580 Q330,566 352,578 Q372,560 384,584 Q392,610 360,616Z" fill="#3a8ad8" stroke="#a8d8ff" stroke-width="2"/>
    ${part('anCloaca', `<ellipse cx="500" cy="548" rx="175" ry="36" transform="rotate(-10 500 548)" fill="#e08a3a" stroke="#ffd0a0" stroke-width="2.4"/><ellipse cx="470" cy="540" rx="120" ry="12" transform="rotate(-10 500 548)" fill="#f4b070" opacity=".5"/>`)}
    ${part('anKidney', kid(445) + kid(555))}
    ${part('anUroDuct', anTube(AN_FM.ug, 7, '#f39bb0', '#b0506a') + anTube(anMir(AN_FM.ug), 7, '#f39bb0', '#b0506a'))}
    ${part('anFSemVes', `<ellipse cx="425" cy="458" rx="12" ry="22" fill="#f6b3c4" stroke="#b0506a" stroke-width="2.2"/>`)}
    ${part('anEffDuct', eff)}
    ${part('anMesorch', mes)}
    ${part('anFTestis', tes(355) + tes(645))}
    ${part('anFatBody', anTuft(355, 164, 1, 'anFbL') + anTuft(645, 164, 1, 'anFbR'))}
    <g id="anFlowFM">${still ? '' : anDots('anSpFM', 14, 3, '#f4f8ff', '#3d7be0')}</g>
    <text class="cap sm" x="500" y="96" text-anchor="middle">للاطلاع</text>
    ${anCap('الجهاز التناسلي الذكري في الضفادع — ملزمة ص98–99')}`;
  const pth = s => { const m = p => s > 0 ? p : anMir(p);
    return anPath(m([[355, 215], [381, 205], [410, 210], [445, 215]]), m([[445, 215], [450, 280], [440, 350], [442, 408]]), m(AN_FM.ug), m([[452, 512], [480, 545]])); };
  const pL = pth(1), pR = pth(-1);
  return {
    body, fnParts: ['anEffDuct', 'anFatBody'],
    parts: [
      { id: 'anFatBody', anchor: [668, 122], label: [866, 100], side: 'R' },
      { id: 'anEffDuct', anchor: [604, 206], label: [866, 190], side: 'R' },
      { id: 'anKidney', anchor: [592, 320], label: [866, 300], side: 'R' },
      { id: 'anUroDuct', anchor: [574, 455], label: [866, 430], side: 'R' },
      { id: 'anCloaca', anchor: [640, 528], label: [866, 560], side: 'R' },
      { id: 'anMesorch', anchor: [318, 195], label: [134, 170], side: 'L' },
      { id: 'anFTestis', anchor: [340, 248], label: [134, 250], side: 'L' },
      { id: 'anFSemVes', anchor: [414, 460], label: [134, 450], side: 'L' }
    ],
    tools: [{ id: 'info:anFrog', label: 'عن التكاثر في الضفدع' }, { id: 'tbl:anFrogMF', label: 'مكونات الذكري × الأنثوي (ص98)' }, { id: 'tbl:anTO', label: 'الخصية × المبيض (ص102)' }],
    tick(dt, t, a){
      anRun(a, 'anSpFM', [pL, pR], t, 45, 120);
      const l = a.el('#anFbL'), r = a.el('#anFbR'), w = Math.sin(t * 1.6) * 3;
      if (l) l.setAttribute('transform', `rotate(${n2(w)} 355 164)`); if (r) r.setAttribute('transform', `rotate(${n2(-w)} 645 164)`);
    }
  };
}

/* ───────── 5) الجهاز التناسلي الأنثوي في الضفادع — ص99 ───────── */
function anFCoil(s){ /* قناة البيض الملتوية: من الفتحة المهدبة إلى كيس البيض (s=±1 للمرآة) */
  const P = [[470, 104], [430, 80], [360, 70], [300, 88], [266, 126]];
  for (let y = 136; y <= 462; y += 8.5) P.push([262 + 20 * Math.sin((y - 136) / 34 * Math.PI * 2), y]);
  P.push([278, 478]);
  return s > 0 ? P : anMir(P);
}
const AN_FF = { sac: [[278, 478], [312, 512], [362, 538], [430, 558]], ureL: [[420, 395], [452, 470], [476, 568]], ureR: [[590, 402], [566, 470], [536, 568]] };
function anFFemale(still){
  const rr = rng(77);
  const lobes = []; for (let i = 0; i < 18; i++){ const a = i / 18 * Math.PI * 2, w = 1 + (i % 2 ? 0.09 : -0.04) + (rr() - 0.5) * 0.08; lobes.push([390 + Math.cos(a) * 70 * w, 290 + Math.sin(a) * 108 * w]); }
  let grapes = ''; for (let i = 0; i < 46; i++){ const a = rr() * 6.283, d = Math.sqrt(rr()); const x = 390 + Math.cos(a) * 58 * d, y = 290 + Math.sin(a) * 94 * d, r = 5 + rr() * 3;
    grapes += `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="#b06ad8" stroke="#5a2a7a" stroke-width="1"/><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r * 0.35)}" fill="#2a1a3a"/>`; }
  let mes = `<path d="M324,226 Q312,290 326,354" fill="none" stroke="#d9d0b0" stroke-width="2"/>`;
  for (let y = 230; y <= 350; y += 9) mes += `<line x1="322" y1="${y}" x2="306" y2="${y + 4}" stroke="#d9d0b0" stroke-width="1.6"/>`;
  const funnel = s => { const x = s > 0 ? 470 : 530, d = s > 0 ? 1 : -1;
    let c = `<path d="M${x - d * 4},${104} L${x + d * 14},${84} Q${x + d * 24},${100} ${x + d * 16},${118}Z" fill="#f8a8bc" stroke="#c0607a" stroke-width="2"/>`;
    for (let k = 0; k < 5; k++) c += `<line x1="${n2(x + d * (14 + k * 0.6))}" y1="${n2(86 + k * 7)}" x2="${n2(x + d * (22 + k * 0.6))}" y2="${n2(84 + k * 7)}" stroke="#ffd0dc" stroke-width="1.6"/>`;
    return c; };
  const body = `
    <path d="M590,622 Q562,612 578,592 Q590,578 612,590 Q632,574 644,598 Q650,624 620,628Z" fill="#3a8ad8" stroke="#a8d8ff" stroke-width="2"/>
    ${part('anUreter', anTube(AN_FF.ureL, 4, '#e8d0a0', '#9a7a40') + anTube(AN_FF.ureR, 4, '#e8d0a0', '#9a7a40'))}
    ${part('anCloaca', `<ellipse cx="505" cy="585" rx="80" ry="28" transform="rotate(-6 505 585)" fill="#f08a2a" stroke="#ffd0a0" stroke-width="2.4"/>`)}
    ${part('anFOviduct', anTube(anFCoil(1), 8, '#f7a8bc', '#c0607a') + anTube(anFCoil(-1), 8, '#f7a8bc', '#c0607a'))}
    ${part('anFEggSac', anTube(AN_FF.sac, 24, '#f9bccb', '#c0607a') + anTube(anMir(AN_FF.sac), 24, '#f9bccb', '#c0607a'))}
    ${part('anFunnel', funnel(1) + funnel(-1))}
    ${part('anKidney', `<path d="${anKidneyD(595, 298, true)}" fill="#8e2a2a" stroke="#e89090" stroke-width="2.4"/><path d="${smoothOpen([[595, 205], [588, 260], [600, 310], [590, 360], [594, 398]])}" fill="none" stroke="#ff9a3a" stroke-width="3"/>`)}
    ${part('anMesovar', mes)}
    ${part('anFOvary', `<path d="${smoothClosed(lobes)}" fill="#7a3aa0" stroke="#d6a6f0" stroke-width="2.4"/>${grapes}`)}
    ${part('anFatBody', anTuft(392, 186, 0.9, 'anFbL') + anTuft(598, 190, 0.8, 'anFbR'))}
    <g id="anFlowFF">${still ? '' : Array.from({ length: 10 }, (_, i) => `<g class="anEgF" data-i="${i}" opacity="0"><circle class="h" r="3" fill="#e6f4ff" opacity=".55"/><circle r="3.6" fill="#2a1a3a"/></g>`).join('')}</g>
    <text class="cap sm" x="500" y="40" text-anchor="middle">للاطلاع</text>
    ${anCap('الجهاز التناسلي الأنثوي في الضفادع — ملزمة ص98–100')}`;
  const ovL = [[400, 230], [440, 160], [468, 110]], ovR = [[410, 240], [500, 160], [532, 110]];
  const pL = anPath(ovL, anFCoil(1), AN_FF.sac), pR = anPath(ovR, anFCoil(-1), anMir(AN_FF.sac));
  const startL = anPath(ovL).len, startR = anPath(ovR).len;
  return {
    body, fnParts: ['anFOviduct', 'anFatBody'],
    parts: [
      { id: 'anFOviduct', anchor: [757, 170], label: [866, 150], side: 'R' },
      { id: 'anFatBody', anchor: [612, 160], label: [866, 225], side: 'R' },
      { id: 'anKidney', anchor: [628, 300], label: [866, 300], side: 'R' },
      { id: 'anUreter', anchor: [567, 462], label: [866, 420], side: 'R' },
      { id: 'anFEggSac', anchor: [683, 512], label: [866, 510], side: 'R' },
      { id: 'anFunnel', anchor: [466, 100], label: [134, 90], side: 'L' },
      { id: 'anFOvary', anchor: [352, 250], label: [134, 240], side: 'L' },
      { id: 'anMesovar', anchor: [308, 322], label: [134, 330], side: 'L' },
      { id: 'anCloaca', anchor: [440, 592], label: [134, 590], side: 'L' }
    ],
    tools: [{ id: 'info:anFrog', label: 'عن التكاثر في الضفدع' }, { id: 'tbl:anFrogMF', label: 'مكونات الذكري × الأنثوي (ص98)' }, { id: 'tbl:anTO', label: 'الخصية × المبيض (ص102)' }],
    tick(dt, t, a){
      anRun(a, 'anEgF', [pL, pR], t, 32, 60);
      /* الغطاء الالبوميني يكبر حول البيضة أثناء مرورها في قناة البيض */
      a.all('.anEgF').forEach((e, i) => { const P = i % 2 ? pR : pL, s0 = (i % 2 ? startR : startL) / P.len, u = +(e.dataset.u || 0);
        const h = e.querySelector('.h'); if (h) h.setAttribute('r', n2(3.6 + Math.max(0, Math.min(1, (u - s0) / (1 - s0))) * 6)); });
      const l = a.el('#anFbL'), r = a.el('#anFbR'), w = Math.sin(t * 1.6) * 3;
      if (l) l.setAttribute('transform', `rotate(${n2(w)} 392 186)`); if (r) r.setAttribute('transform', `rotate(${n2(-w)} 598 190)`);
    }
  };
}

/* ضفدع جالس (منظر جانبي، الرأس لليمين) */
const anFrogSvg = (x, y, s, col, colD, flip, spots) => {
  const f = flip ? -1 : 1, sp = spots ? [[-20, -6], [-2, -14], [14, -4], [-30, 6]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="5" ry="3.5" fill="${colD}" opacity=".55"/>`).join('') : '';
  return `<g transform="translate(${x},${y}) scale(${n2(f * s)},${s})">
    <ellipse cx="-30" cy="10" rx="27" ry="14" transform="rotate(-18 -30 10)" fill="${col}" stroke="${colD}" stroke-width="2"/>
    <path d="${smoothClosed([[-50, 14], [-40, -12], [-10, -24], [24, -22], [48, -10], [58, 4], [44, 18], [10, 24], [-30, 24]])}" fill="${col}" stroke="${colD}" stroke-width="2.2"/>
    <ellipse cx="6" cy="14" rx="30" ry="8" fill="#f4f0c8" opacity=".45"/>${sp}
    <path d="M-14,24 L8,32 L30,33" fill="none" stroke="${colD}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24,12 L28,32 L40,35" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24,12 L28,32 L40,35" fill="none" stroke="${colD}" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="32" cy="-22" r="8.5" fill="#f2c94c" stroke="${colD}" stroke-width="2"/><circle cx="33" cy="-22" r="3.6" fill="#141414"/>
    <path d="M58,4 Q42,6 30,2" fill="none" stroke="${colD}" stroke-width="1.6"/></g>`;
};
/* ذنب الدعموص (يتموج) */
const anTailD = (x, y, s, len, ph) => { const U = [], D = [];
  for (let i = 0; i <= 14; i++){ const u = i / 14, xx = x - (14 + len * u) * s, w = (7 - 5.5 * u) * s, off = Math.sin(u * 5 + ph) * 5 * s * u;
    U.push([xx, y + off - w]); D.unshift([xx, y + off + w]); }
  return 'M' + U.concat(D).map(p => n2(p[0]) + ',' + n2(p[1])).join(' L') + 'Z'; };
const anTad = (x, y, s, o) => {
  const len = 58 * (o.tail === undefined ? 1 : o.tail);
  const gill = o.gills ? [-0.6, 0, 0.6].map(a => `<path d="M${n2(x + 4 * s)},${n2(y)} q${n2(Math.cos(a - 1.6) * 9 * s)},${n2(Math.sin(a - 1.6) * 9 * s)} ${n2(Math.cos(a - 1.6) * 15 * s)},${n2(Math.sin(a - 1.6) * 15 * s + 8 * s)}" fill="none" stroke="#ff8fb0" stroke-width="${n2(2.4 * s)}" stroke-linecap="round"/>`).join('') : '';
  const hind = o.hind ? `<path d="M${n2(x - 10 * s)},${n2(y + 8 * s)} L${n2(x - 4 * s)},${n2(y + 20 * s)} L${n2(x - 16 * s)},${n2(y + 26 * s)}" fill="none" stroke="#5a6a3a" stroke-width="${n2(4 * s)}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
  const fore = o.fore ? `<path d="M${n2(x + 10 * s)},${n2(y + 8 * s)} L${n2(x + 14 * s)},${n2(y + 20 * s)} L${n2(x + 20 * s)},${n2(y + 22 * s)}" fill="none" stroke="#5a6a3a" stroke-width="${n2(3.4 * s)}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
  return `${hind}${fore}<path class="anTl" data-x="${x}" data-y="${y}" data-s="${s}" data-l="${len}" d="${anTailD(x, y, s, len, 0)}" fill="#7a7a5a" stroke="#3a3a2a" stroke-width="1.4"/>
    <ellipse cx="${x}" cy="${y}" rx="${n2(22 * s)}" ry="${n2(14 * s)}" fill="#6a6a48" stroke="#2e2e20" stroke-width="2"/>${gill}
    <circle cx="${n2(x + 12 * s)}" cy="${n2(y - 5 * s)}" r="${n2(3.4 * s)}" fill="#f2d24c" stroke="#1a1a1a" stroke-width="1"/>`;
};
const anTailTick = (a, t) => a.all('.anTl').forEach((e, i) => e.setAttribute('d', anTailD(+e.dataset.x, +e.dataset.y, +e.dataset.s, +e.dataset.l, t * 7 + i)));

/* ───────── 6) التزاوج والإخصاب في الضفدع — ص100–102 والإنفوغرافيك ص101 ───────── */
const AN_MATE_ST = [
  { n: '1 · التجمع والتزاوج', d: 'تتجمع الضفادع البالغة في فصل التكاثر (فصل الربيع) في البرك ذات المياه الضحلة، ويحتضن الذكر الأنثى بواسطة أطرافه الأمامية، ويكون الإصبع الأول في الذكر منتفخاً مكوناً الوسادة التناسلية.' },
  { n: '2 · طرح البيوض والنطف', d: 'يضغط الذكر على جسم الأنثى ثم تبدأ بإطلاق بيوضها في الماء، وفي نفس الوقت يبدأ الذكر بطرح نطفه فوق البيوض.' },
  { n: '3 · الإخصاب الخارجي', d: 'على الرغم من إحاطة البيضة بعدة نطف لكن نطفة واحدة تنجح في إخصاب البيضة، ويكون الإخصاب خارج جسم الأنثى (الإخصاب الخارجي)، فتتكون البيضة المخصبة التي تمثل بداية تكوين الفرد الجديد.' }
];
function anFMate(still){
  const rr = rng(9);
  let reeds = ''; [[170, 300], [196, 290], [826, 296], [846, 306]].forEach(([x, y], i) => { reeds += `<path d="M${x},${y + 40} Q${x + (i % 2 ? 8 : -8)},${y - 40} ${x + (i % 2 ? 14 : -10)},${y - 110}" fill="none" stroke="#4f9a4a" stroke-width="4" stroke-linecap="round"/>`; });
  const pond = `<rect x="150" y="300" width="700" height="318" rx="18" fill="rgba(70,150,200,.20)" stroke="rgba(140,200,240,.35)"/>
    <path d="M150,300 ${Array.from({ length: 15 }, (_, i) => `Q${165 + i * 47},${i % 2 ? 294 : 306} ${197 + i * 47},300`).join(' ')}" fill="none" stroke="#a8dcff" stroke-width="2" opacity=".7"/>${reeds}`;
  const frogs = `<g data-st="0">${anFrogSvg(540, 292, 1.45, '#b48a4a', '#5a3a1a', false, true)}${anFrogSvg(512, 238, 1.1, '#5fb04a', '#24561a', false, true)}
    <path d="M548,246 Q590,256 596,286" fill="none" stroke="#5fb04a" stroke-width="9" stroke-linecap="round"/><path d="M548,246 Q590,256 596,286" fill="none" stroke="#24561a" stroke-width="1.4"/></g>`;
  const pad = `<g data-st="0"><ellipse cx="598" cy="290" rx="7" ry="5" fill="#3a2a1a" stroke="#ffd166" stroke-width="1.6"/>
    <line x1="604" y1="286" x2="712" y2="182" stroke="#ffd166" stroke-width="1.6" stroke-dasharray="4 4"/>
    <circle cx="760" cy="150" r="60" fill="#22303a" stroke="#ffd166" stroke-width="2.4"/>
    <path d="M722,176 Q740,140 770,128 Q790,120 800,108 M770,128 Q796,132 808,124 M760,150 Q786,160 800,158" fill="none" stroke="#5fb04a" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="764" cy="134" rx="13" ry="10" fill="#3a2a1a" stroke="#c9a070" stroke-width="2"/><text class="cap sm" x="760" y="232" text-anchor="middle">انتفاخ الإصبع الأول في الذكر</text></g>`;
  let eg = ''; for (let i = 0; i < 26; i++){ const a = rr() * 6.283, d = Math.sqrt(rr()); const x = 400 + Math.cos(a) * 62 * d, y = 488 + Math.sin(a) * 44 * d;
    eg += `<circle cx="${n2(x)}" cy="${n2(y)}" r="11" fill="rgba(230,245,255,.55)" stroke="#cfe8ff" stroke-width="1"/><circle cx="${n2(x)}" cy="${n2(y)}" r="4" fill="#1a1a22"/>`; }
  const eggs = `<g data-st="1">${eg}</g>`;
  const cloud = `<g data-st="1" id="anCloud"><path d="M478,318 Q500,350 476,380 Q456,410 470,436 Q490,462 452,470 Q420,452 436,420 Q450,396 440,368 Q432,336 478,318Z" fill="#f4f8ff" opacity=".55"/>
    <path d="M474,326 Q486,360 462,392 Q448,420 462,448" fill="none" stroke="#ffffff" stroke-width="3" opacity=".6"/></g>`;
  let sps = ''; for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283 + 0.3, R = 84; sps += spermSvg(n2(700 + Math.cos(a) * R), n2(480 + Math.sin(a) * R), 0.62, a, 'swim', i); }
  const zoomBg = `<g data-st="2"><circle cx="700" cy="480" r="104" fill="#1c2c3c" stroke="#9fd8ff" stroke-width="2.4"/><line x1="462" y1="470" x2="596" y2="478" stroke="#9fd8ff" stroke-width="1.6" stroke-dasharray="5 5"/></g>`;
  const jelly = `<g data-st="2"><circle cx="700" cy="480" r="58" fill="rgba(220,240,255,.18)" stroke="#d8f0ff" stroke-width="3"/></g>`;
  const zyg = `<g data-st="2"><circle cx="700" cy="480" r="42" fill="#e8d49a" stroke="#fff3c8" stroke-width="2"/><path d="M658,476 A42,42 0 0 1 742,476 Q700,462 658,476Z" fill="#3a2e28"/>
    <circle id="anFMem" cx="700" cy="480" r="46" fill="none" stroke="#ffe08a" stroke-width="3" opacity="0"/></g>`;
  const winner = `<g id="anWin">${spermSvg(800, 560, 0.62, 3.9, 'swim', 11)}</g>`;
  const body = `${pond}
    <text class="cap sm" x="430" y="356" text-anchor="middle">أنثى</text><text class="cap sm" x="470" y="196" text-anchor="middle">ذكر</text>
    ${part('anAmplex', frogs)}
    ${part('anNupPad', pad)}
    ${part('anFEggs', eggs)}
    ${part('anFSperm', cloud)}
    ${zoomBg}
    ${part('anAlbumen', jelly)}
    ${part('anFZyg', zyg)}
    ${part('anExtFert', `<g data-st="2">${sps}${winner}</g>`)}
    ${anCap('التزاوج والإخصاب الخارجي في الضفدع — ملزمة ص100–102 (الإنفوغرافيك ص101)', 645)}`;
  const ctl = stageCtl(AN_MATE_ST, { dur: 24 });
  return {
    body, stages: AN_MATE_ST, fnParts: ['anExtFert', 'anNupPad'],
    parts: [
      { id: 'anNupPad', anchor: [776, 132], label: [866, 110], side: 'R' },
      { id: 'anAmplex', anchor: [612, 288], label: [866, 270], side: 'R' },
      { id: 'anAlbumen', anchor: [747, 446], label: [866, 400], side: 'R' },
      { id: 'anFZyg', anchor: [740, 490], label: [866, 480], side: 'R' },
      { id: 'anExtFert', anchor: [776, 540], label: [866, 580], side: 'R' },
      { id: 'anFSperm', anchor: [450, 400], label: [134, 405], side: 'L' },
      { id: 'anFEggs', anchor: [345, 488], label: [134, 480], side: 'L' }
    ],
    tools: ctl.tools.concat([{ id: 'info:anFrog', label: 'عن التكاثر في الضفدع' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k);
      wiggle(a, t);
      if (still) return;
      const cl = a.el('#anCloud'); if (cl) cl.setAttribute('transform', `translate(0,${n2(Math.sin(t * 1.5) * 4)})`);
      /* النطفة الفائزة تتجه نحو البيضة وتخترقها ثم يظهر غشاء الإخصاب */
      const w = a.el('#anWin'), m = a.el('#anFMem');
      const p = STG.idx < 2 ? 0 : Math.min(1, STG.k * 1.7);
      if (w) w.setAttribute('transform', `translate(${n2(-p * 66)},${n2(-p * 56)})`);
      if (m) m.setAttribute('opacity', STG.idx === 2 && p >= 1 ? n2(0.5 + 0.5 * Math.sin(t * 4)) : 0);
    }
  };
}

/* ───────── 7) دورة حياة الضفدع — الإنفوغرافيك ص101 ───────── */
const AN_CYC_ST = [
  { n: '1 · بيضة مخصبة', d: 'بعد الإخصاب الخارجي تتكون البيضة المخصبة التي تمثل بداية تكوين الفرد الجديد، وهي محاطة بالغطاء الالبوميني.' },
  { n: '2 · التفلج', d: 'تمر البيضة المخصبة بمرحلة التفلج: مرحلة الخليتين ← مرحلة الأربع خلايا ← مرحلة التفلج (عدة خلايا).' },
  { n: '3 · دعموص حديث الفقس', d: 'يتكون دعموص الضفدع الذي يكون مذنباً، وهو حديث الفقس يتنفس بالخياشم.' },
  { n: '4 · ظهور الأطراف الخلفية', d: 'مع تقدم النمو وحصول عملية التحول الشكليائي تظهر الأطراف الخلفية.' },
  { n: '5 · الأطراف الأمامية وقصر الذنب', d: 'تظهر الأطراف الأمامية ويقصر الذنب، ويفقد الدعموص الخياشم التي تحل محلها الرئات.' },
  { n: '6 · ضفدع صغير (ذنب قصير)', d: 'يفقد الدعموص الذنب والخياشم، وتحل الرئات محلها لإنجاز فعل التنفس في البالغات.' },
  { n: '7 · ضفدع بالغ', d: 'يكتمل النمو ويتكون ضفدع بالغ قادر على التكاثر؛ يتجمع في الربيع في البرك الضحلة للتزاوج فتبدأ الدورة من جديد.' }
];
const AN_CYC = { cx: 560, cy: 360, rx: 235, ry: 215 };
const anCycPt = i => { const a = (-90 + i * 360 / 7) * Math.PI / 180; return [AN_CYC.cx + Math.cos(a) * AN_CYC.rx, AN_CYC.cy + Math.sin(a) * AN_CYC.ry]; };
function anFCycle(still){
  const P = Array.from({ length: 7 }, (_, i) => anCycPt(i).map(n2));
  let arrows = '';
  for (let i = 0; i < 7; i++){
    const a0 = -90 + i * 360 / 7 + 17, a1 = -90 + (i + 1) * 360 / 7 - 17, pts = [];
    for (let k = 0; k <= 10; k++){ const a = (a0 + (a1 - a0) * k / 10) * Math.PI / 180; pts.push([AN_CYC.cx + Math.cos(a) * (AN_CYC.rx - 6), AN_CYC.cy + Math.sin(a) * (AN_CYC.ry - 6)]); }
    const e = pts[10], b = pts[9];
    arrows += `<g data-st="${(i + 1) % 7}"><path d="${smoothOpen(pts)}" fill="none" stroke="#5fd0c0" stroke-width="3" stroke-linecap="round" opacity=".8"/>${gArrow(b[0], b[1], e[0], e[1], '#5fd0c0')}</g>`;
  }
  const egg = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${n2(r * 1.6)}" fill="rgba(220,240,255,.2)" stroke="#d8f0ff" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r}" fill="#e8d49a" stroke="#fff3c8" stroke-width="1.6"/>` +
    `<path d="M${n2(x - r)},${y} A${r},${r} 0 0 1 ${n2(x + r)},${y} Q${x},${n2(y - r * 0.35)} ${n2(x - r)},${y}Z" fill="#3a2e28"/>`;
  const [x1, y1] = P[1];
  const emb = (x, y, kind) => { let c = `<circle cx="${x}" cy="${y}" r="20" fill="rgba(220,240,255,.2)" stroke="#d8f0ff" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="13" fill="#b8a070" stroke="#5a4a2a" stroke-width="1.6"/>`;
    if (kind === 2) c += `<line x1="${x}" y1="${y - 13}" x2="${x}" y2="${y + 13}" stroke="#5a4a2a" stroke-width="1.6"/>`;
    if (kind === 4) c += `<line x1="${x}" y1="${y - 13}" x2="${x}" y2="${y + 13}" stroke="#5a4a2a" stroke-width="1.6"/><line x1="${x - 13}" y1="${y}" x2="${x + 13}" y2="${y}" stroke="#5a4a2a" stroke-width="1.6"/>`;
    if (kind === 8) [[-6, -6], [6, -6], [-6, 6], [6, 6], [0, 0], [-10, 0], [10, 0], [0, -10], [0, 10]].forEach(([dx, dy]) => { c += `<circle cx="${x + dx}" cy="${y + dy}" r="4.6" fill="#c8b080" stroke="#5a4a2a" stroke-width="1"/>`; });
    return c; };
  const cleav = emb(x1 - 46, y1, 2) + gArrow(x1 - 25, y1, x1 - 20, y1, '#5fd0c0') + emb(x1, y1, 4) + gArrow(x1 + 21, y1, x1 + 26, y1, '#5fd0c0') + emb(x1 + 46, y1, 8) +
    `<text class="cap sm" x="${x1}" y="${y1 + 40}" text-anchor="middle">خليتان ← أربع ← عدة خلايا</text>`;
  const pad = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="62" ry="16" fill="#3f8a3a" stroke="#9fd890" stroke-width="2"/><path d="M${x},${y} L${x + 50},${y - 8}" stroke="#9fd890" stroke-width="2"/>`;
  const node = (i, id, inner) => part(id, `<g data-st="${i}">${inner}</g>`);
  const body = `
    <text class="cap" x="${AN_CYC.cx}" y="${AN_CYC.cy - 6}" text-anchor="middle">دورة حياة الضفدع</text>
    <text class="cap sm" x="${AN_CYC.cx}" y="${AN_CYC.cy + 18}" text-anchor="middle">تزاوج ← إخصاب خارجي ← بيضة مخصبة ← دعموص ← ضفدع بالغ</text>
    ${arrows}
    ${node(0, 'anFZyg', egg(P[0][0], P[0][1], 18))}
    ${node(1, 'anCleav', cleav)}
    ${node(2, 'anTadpole', anTad(P[2][0] + 12, P[2][1], 1.15, { gills: true }))}
    ${node(3, 'anHindL', anTad(P[3][0] + 22, P[3][1], 1.1, { hind: true }))}
    ${node(4, 'anForeL', anTad(P[4][0] + 16, P[4][1], 1.05, { hind: true, fore: true, tail: 0.55 }))}
    ${node(5, 'anYoungF', anFrogSvg(P[5][0], P[5][1], 0.72, '#7ab84a', '#2e5a1a', false, true) + `<path d="M${n2(P[5][0] - 44)},${n2(P[5][1] + 8)} q-14,4 -22,-2" fill="none" stroke="#5a7a3a" stroke-width="5" stroke-linecap="round"/>`)}
    ${node(6, 'anAdultF', pad(P[6][0], P[6][1] + 34) + anFrogSvg(P[6][0], P[6][1], 1.0, '#5fb04a', '#24561a', false, true))}
    <circle id="anCycDot" cx="-40" cy="-40" r="7" fill="#ffd166" stroke="#fff" stroke-width="2" opacity="0"/>
    ${anCap('دورة حياة الضفدع: بيضة مخصبة ← التفلج ← دعموص ← التحول الشكليائي ← ضفدع بالغ — ملزمة ص100–101', 650)}`;
  const ctl = stageCtl(AN_CYC_ST, { dur: 35 });
  return {
    body, stages: AN_CYC_ST, fnParts: ['anTadpole', 'anForeL'],
    parts: [
      { id: 'anFZyg', anchor: [P[0][0] + 22, P[0][1] - 14], label: [866, 110], side: 'R' },
      { id: 'anCleav', anchor: [P[1][0] + 66, P[1][1]], label: [866, 220], side: 'R' },
      { id: 'anTadpole', anchor: [P[2][0] + 38, P[2][1] + 4], label: [866, 400], side: 'R' },
      { id: 'anHindL', anchor: [P[3][0] + 40, P[3][1] + 12], label: [866, 570], side: 'R' },
      { id: 'anForeL', anchor: [P[4][0] - 40, P[4][1]], label: [134, 570], side: 'L' },
      { id: 'anYoungF', anchor: [P[5][0] - 34, P[5][1] - 4], label: [134, 420], side: 'L' },
      { id: 'anAdultF', anchor: [P[6][0], P[6][1] - 30], label: [P[6][0], 150], side: 'C' }
    ],
    tools: ctl.tools.concat([{ id: 'info:anMetam', label: 'التحول الشكليائي' }, { id: 'info:anFrog', label: 'عن التكاثر في الضفدع' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k);
      anTailTick(a, t);
      if (still) return;
      const d = a.el('#anCycDot'); if (d){ const ang = (-90 + STG.T * 360) * Math.PI / 180;
        d.setAttribute('cx', n2(AN_CYC.cx + Math.cos(ang) * (AN_CYC.rx - 6))); d.setAttribute('cy', n2(AN_CYC.cy + Math.sin(ang) * (AN_CYC.ry - 6))); d.setAttribute('opacity', 0.95); }
    }
  };
}

