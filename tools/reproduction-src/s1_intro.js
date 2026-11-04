/* ══════════════════════════════════════════════════════════════════════════
   4.1 · التكاثر وأنواعه — ملزمة ص2–14: الجنسي واللاجنسي، تكوين النطف
         (شكل 3-1) وتكوين البيوض (شكل 3-2) في الثدييات
   ══════════════════════════════════════════════════════════════════════════ */
const INT_VIEWS = [
  { id: 'itypes', label: 'الجنسي واللاجنسي' },
  { id: 'isperm', label: 'تكوين النطف' },
  { id: 'iegg',   label: 'تكوين البيوض' }
];
const GAM = { cell: '#b07ad8', cellL: '#f1dcff', nuc: '#4a2a7a', sperm: '#9fb6ff', egg: '#f2a7b8', eggL: '#ffe3ea', polar: '#c9a0e8',
  arr: '#d9784a', tub: '#c9a27a', ovary: '#e98a8a', ovaryL: '#ffd0c8', yellow: '#f2c14e' };

SCENES.intro = {
  title: 'التكاثر وأنواعه',
  get src(){ return ({ itypes: 'ملزمة ص2–5', isperm: 'ملزمة ص6–10', iegg: 'ملزمة ص7–11' })[SEL.intv] || 'ملزمة ص2'; },
  tint: ['rgba(170,90,140,.26)', 'rgba(90,110,170,.16)'],
  model3d: () => 'int_' + SEL.intv,
  build(){
    const v = INT_VIEWS.some(x => x.id === SEL.intv) ? SEL.intv : 'itypes';
    const s = v === 'isperm' ? intSperm() : v === 'iegg' ? intEgg() : intTypes();
    s.rebuildOnRadio = 'intv';
    s.tools = INT_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'intv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.int_types = { title: 'التكاثر الجنسي واللاجنسي', build: () => intTypes() };
SCENES.int_sperm = { title: 'مراحل تكوين النطف في الثدييات', build: () => intSperm() };
SCENES.int_egg   = { title: 'مراحل تكوين البيوض في الثدييات', build: () => intEgg() };

/* خلية مستديرة بنواة (للمخططات) */
const gCell = (x, y, r, fill, nuc, extra) => `<g${extra || ''}><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="${fill}" stroke="#fff4ff" stroke-width="2"/>` +
  `<circle cx="${n2(x - r * 0.12)}" cy="${n2(y - r * 0.1)}" r="${n2(r * 0.42)}" fill="${nuc}"/>` +
  `<circle cx="${n2(x - r * 0.25)}" cy="${n2(y - r * 0.3)}" r="${n2(r * 0.14)}" fill="#fff" opacity=".35"/></g>`;
/* سهم بين نقطتين */
const gArrow = (x0, y0, x1, y1, col, cls) => { const a = Math.atan2(y1 - y0, x1 - x0), h = 9;
  return `<g class="${cls || ''}"><line x1="${n2(x0)}" y1="${n2(y0)}" x2="${n2(x1 - Math.cos(a) * 3)}" y2="${n2(y1 - Math.sin(a) * 3)}" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M${n2(x1)},${n2(y1)} L${n2(x1 - h * Math.cos(a - 0.45))},${n2(y1 - h * Math.sin(a - 0.45))} L${n2(x1 - h * Math.cos(a + 0.45))},${n2(y1 - h * Math.sin(a + 0.45))}Z" fill="${col}"/></g>`; };
/* نطفة: رأس بيضوي + قطعة وسطية + ذيل متموج (ph = طور التموج) */
const spermD = (x, y, k, ang, ph) => { let d = ''; for (let i = 0; i <= 16; i++){ const u = i / 16, L = 70 * k * u, w = Math.sin(u * 9 + (ph || 0)) * 6 * k * u;
    d += (i ? ' L' : 'M') + n2(x + Math.cos(ang) * (14 * k + L) - Math.sin(ang) * w) + ',' + n2(y + Math.sin(ang) * (14 * k + L) + Math.cos(ang) * w); } return d; };
const spermSvg = (x, y, k, ang, cls, i) => `<g class="${cls || ''}" data-i="${i || 0}" data-x="${x}" data-y="${y}" data-k="${k}" data-a="${ang}">
  <path class="tail" d="${spermD(x, y, k, ang, 0)}" fill="none" stroke="${GAM.sperm}" stroke-width="${n2(2.4 * k)}" stroke-linecap="round"/>
  <line x1="${n2(x + Math.cos(ang) * 6 * k)}" y1="${n2(y + Math.sin(ang) * 6 * k)}" x2="${n2(x + Math.cos(ang) * 16 * k)}" y2="${n2(y + Math.sin(ang) * 16 * k)}" stroke="#6f86e8" stroke-width="${n2(5 * k)}" stroke-linecap="round"/>
  <ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(9 * k)}" ry="${n2(6 * k)}" transform="rotate(${n2(ang * 57.3)} ${n2(x)} ${n2(y)})" fill="#e8ecff" stroke="#6f5ad0" stroke-width="${n2(1.6 * k)}"/></g>`;
const wiggle = (a, t) => a.all('g.swim').forEach(g => { const x = +g.dataset.x, y = +g.dataset.y, k = +g.dataset.k, an = +g.dataset.a, i = +g.dataset.i;
  const tl = g.querySelector('.tail'); if (tl) tl.setAttribute('d', spermD(x, y, k, an, t * 9 + i)); });
/* شريحة مرحلة: الخلايا ذات data-st تظهر عند بلوغ مرحلتها */
const stageShow = (a, cur, k) => a.all('[data-st]').forEach(e => { const s = +e.dataset.st;
  e.setAttribute('opacity', s < cur ? 1 : s === cur ? n2(Math.min(1, 0.25 + k * 3)) : 0.12);
  e.classList.toggle('stNow', s === cur); });

/* ───────── 1) الجنسي واللاجنسي (ص3–4) ───────── */
function intTypes(){
  /* نجم البحر: خمسة أذرع، يُرسم بنقاط أطراف مع ذراع منفصلة (تجدد) */
  const star = (cx, cy, r, miss, rot) => { const P = []; for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5 + (rot || 0), rr = i % 2 ? r * 0.42 : r;
      const cut = miss !== undefined && i === miss * 2; P.push([cx + Math.cos(a) * (cut ? r * 0.5 : rr), cy + Math.sin(a) * (cut ? r * 0.5 : rr)]); }
    return `<path d="${smoothClosed(P)}" fill="#f0846a" stroke="#ffd7c8" stroke-width="2.4"/>` +
      P.filter((p, i) => i % 2 === 0).map(p => `<circle cx="${n2((p[0] + cx * 2) / 3)}" cy="${n2((p[1] + cy * 2) / 3)}" r="3" fill="#ffe2d6"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${n2(r * 0.16)}" fill="#ffb59f"/>`; };
  const arm = (cx, cy, r, ang) => { const L = r, w = r * 0.28, ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, py = ca;
    return `<path d="M${n2(cx - px * w)},${n2(cy - py * w)} Q${n2(cx + ca * L * 0.6 - px * w * 0.7)},${n2(cy + sa * L * 0.6 - py * w * 0.7)} ${n2(cx + ca * L)},${n2(cy + sa * L)} Q${n2(cx + ca * L * 0.6 + px * w * 0.7)},${n2(cy + sa * L * 0.6 + py * w * 0.7)} ${n2(cx + px * w)},${n2(cy + py * w)}Z" fill="#f0846a" stroke="#ffd7c8" stroke-width="2.4"/>`; };
  const A = '#7fb2ff';
  const asex = `
    <g id="aS0">${star(230, 150, 62)}</g>
    ${gArrow(230, 222, 230, 262, A)}
    <g id="aS1">${star(230, 330, 58, 4)}<g id="aArm">${arm(196, 312, 58, -2.6)}</g></g>
    <g id="aS2">${gArrow(190, 400, 135, 440, A)}${gArrow(270, 400, 325, 440, A)}
      <g id="aLeft">${arm(110, 520, 60, -2.4)}<g id="aGrowL" opacity="0">${star(118, 500, 56, undefined, 0.6)}</g></g>
      <g id="aRight">${star(345, 505, 56, 4)}<g id="aGrowR" opacity="0">${star(345, 505, 56)}</g></g></g>
    <text class="cap sm" x="230" y="608" text-anchor="middle">تحوّل أجزاء من الكائن الحي إلى أحياء شبيهة به</text>`;
  const boy = (x, y, c) => `<circle cx="${x}" cy="${y}" r="16" fill="${c}"/><path d="M${x - 20},${y + 66} L${x - 16},${y + 22} Q${x},${y + 14} ${x + 16},${y + 22} L${x + 20},${y + 66}Z" fill="${c}"/>`;
  const egg = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r + 8}" fill="none" stroke="#9fd8ff" stroke-width="5" opacity=".7"/><circle cx="${x}" cy="${y}" r="${r}" fill="${GAM.egg}" stroke="#fff" stroke-width="2"/><circle cx="${x - 6}" cy="${y - 4}" r="${r * 0.3}" fill="#c0304a"/>`;
  const sex = `
    <g>${boy(560, 110, '#8cc8ff')}</g><text class="cap sm" x="560" y="200" text-anchor="middle">ذكر</text>
    <g>${boy(560, 410, '#ff9ec7')}</g><text class="cap sm" x="560" y="500" text-anchor="middle">أنثى</text>
    ${part('sperm', spermSvg(640, 150, 1.2, 0.0, 'swim', 1))}
    ${part('ovum', egg(660, 440, 30))}
    ${gArrow(735, 175, 790, 255, '#ffd166')}${gArrow(700, 405, 780, 330, '#ffd166')}
    ${part('zygote', `<g id="zyg"><circle cx="820" cy="295" r="40" fill="#e65a7a" stroke="#ffe0ea" stroke-width="3"/><circle cx="815" cy="290" r="14" fill="#7a1a3a"/><g id="zygDiv" opacity="0"><line x1="820" y1="258" x2="820" y2="332" stroke="#ffe0ea" stroke-width="3"/></g></g>`)}
    ${gArrow(820, 345, 820, 410, '#ffd166')}
    <g><ellipse cx="820" cy="470" rx="34" ry="48" fill="#ffe9c8" stroke="#e7b77a" stroke-width="2"/><circle cx="820" cy="440" r="18" fill="#ffd2b0"/><circle cx="814" cy="438" r="2" fill="#5a3a2a"/><circle cx="826" cy="438" r="2" fill="#5a3a2a"/></g>
    <text class="cap sm" x="820" y="545" text-anchor="middle">طفل</text>
    <text class="cap sm" x="700" y="608" text-anchor="middle">اتحاد نواتي النطفة والبيضة واختلاط المادة الوراثية</text>`;
  const body = `
    <rect x="40" y="40" width="390" height="590" rx="18" fill="rgba(240,132,106,.07)" stroke="rgba(240,132,106,.35)" stroke-dasharray="6 6"/>
    <rect x="470" y="40" width="490" height="590" rx="18" fill="rgba(140,200,255,.06)" stroke="rgba(140,200,255,.35)" stroke-dasharray="6 6"/>
    ${part('tAsex', `<text class="cap" x="235" y="78" text-anchor="middle">تكاثر لا جنسي</text>`)}
    ${part('tSex', `<text class="cap" x="715" y="78" text-anchor="middle">تكاثر جنسي</text>`)}
    ${asex}${sex}`;
  return {
    body, fnParts: ['tAsex', 'zygote'],
    parts: [
      { id: 'sperm', anchor: [640, 150], label: [690, 112], side: 'C' },
      { id: 'ovum', anchor: [688, 440], label: [700, 520], side: 'C' },
      { id: 'zygote', anchor: [858, 285], label: [866, 220], side: 'R' }
    ],
    tools: [{ id: 'info:tAsex', label: 'عن التكاثر اللاجنسي' }, { id: 'info:tSex', label: 'عن التكاثر الجنسي' }, { id: 'tbl:sexAsex', label: 'الجنسي × اللاجنسي (ص4)' }],
    tick(dt, t, a){
      /* التجدد: الذراع المنفصلة والجزء الكبير يكمل كل منهما نفسه نجماً كاملاً */
      const p = (t * 0.12) % 1, g = Math.max(0, Math.min(1, (p - 0.45) / 0.35));
      const gl = a.el('#aGrowL'), gr = a.el('#aGrowR'), ar = a.el('#aArm');
      if (gl) gl.setAttribute('opacity', n2(g)); if (gr) gr.setAttribute('opacity', n2(g));
      if (ar) ar.setAttribute('transform', `translate(${n2(-Math.min(1, p * 3) * 10)},${n2(-Math.min(1, p * 3) * 6)})`);
      const zd = a.el('#zygDiv'); if (zd) zd.setAttribute('opacity', n2(0.5 + 0.5 * Math.sin(t * 2)));
      wiggle(a, t);
    }
  };
}

/* ───────── 2) تكوين النطف في الثدييات — شكل (3-1) ص8 ───────── */
const SPERM_STAGES = [
  { n: '1 · سليفات النطف (2س)', d: 'تتكون النطف في الخصية المؤلفة من أعداد كبيرة من نبيبات منوية ملتوية تبطنها خلايا جرثومية أولية تنقسم انقسامات غير مباشرة متعددة ومتعاقبة لتنتج سليفات النطف (2س) التي تنقسم اعتيادياً لتضاعف أعدادها.' },
  { n: '2 · الخلايا النطفية الأولية (2س)', d: 'تمر سليفات النطف بمرحلة نمو بعد توقف انقساماتها ويكبر حجمها وتسمى الخلايا النطفية الأولية (2س).' },
  { n: '3 · الخلايا النطفية الثانوية (س)', d: 'تمر الخلية النطفية الأولية بالانقسام الاختزالي الأول لتنتج خليتين متساويتين بالحجم تسمى كل منهما الخلية النطفية الثانوية (س).' },
  { n: '4 · أرومات النطف (س)', d: 'تمر الخلية النطفية الثانوية بالانقسام الاختزالي الثاني لتكوّن أربع خلايا متساوية بالحجم تدعى أرومات النطف (س).' },
  { n: '5 · أربع نطف ناضجة (س)', d: 'تعاني أرومات النطف تغييرات في شكلها وتركيبها (عملية التحول النطفي) مؤدية إلى تكوين أربع نطف ناضجة، كل منها أحادية المجموعة الكروموسومية (س).' }
];
function intSperm(still){
  const X = 610, Y = [104, 196, 296, 396, 520];
  const c = GAM.cell, n = GAM.nuc;
  let flowA = '';
  const ar = (x0, y0, x1, y1, st) => `<g data-st="${st}">${gArrow(x0, y0, x1, y1, GAM.arr)}</g>`;
  flowA += ar(X, Y[0] + 22, X, Y[1] - 28, 1);
  [-1, 1].forEach(s => { flowA += ar(X + s * 8, Y[1] + 28, X + s * 50, Y[2] - 24, 2); });
  [-75, -25, 25, 75].forEach((dx, i) => { const px = X + (i < 2 ? -50 : 50); flowA += ar(px + (dx < px - X ? -6 : 6) * 0 + (i % 2 ? 6 : -6), Y[2] + 22, X + dx, Y[3] - 18, 3); });
  [-75, -25, 25, 75].forEach(dx => { flowA += ar(X + dx, Y[3] + 18, X + dx, Y[4] - 34, 4); });
  const cells = `
    ${part('spGonium', `<g data-st="0">${gCell(X, Y[0], 20, c, n)}</g>`)}
    ${part('spPrim', `<g data-st="1">${gCell(X, Y[1], 27, c, n)}</g>`)}
    ${part('spSec', `<g data-st="2">${gCell(X - 50, Y[2], 21, c, n)}${gCell(X + 50, Y[2], 21, c, n)}</g>`)}
    ${part('spTid', `<g data-st="3">${[-75, -25, 25, 75].map(dx => gCell(X + dx, Y[3], 15, c, n)).join('')}</g>`)}
    ${part('spermM', `<g data-st="4">${[-75, -25, 25, 75].map((dx, i) => spermSvg(X + dx, Y[4] - 24, 0.95, Math.PI / 2, 'swim', i)).join('')}</g>`)}`;
  const brk = (x, y0, y1, id, st) => part(id, `<g data-st="${st}"><path d="M${x},${y0} L${x + 12},${y0} L${x + 12},${y1} L${x},${y1}" fill="none" stroke="#ffe08a" stroke-width="2.4"/></g>`);
  const brackets = brk(X + 104, Y[1] - 6, Y[2] + 14, 'meio1', 2) + brk(X + 104, Y[2] + 22, Y[3] + 14, 'meio2', 3) +
    part('spermio', `<g data-st="4"><line x1="${X - 110}" y1="${Y[3] + 34}" x2="${X + 116}" y2="${Y[3] + 34}" stroke="#e8e0f0" stroke-width="2.2" stroke-dasharray="9 6"/></g>`);
  /* مقطع في جدار النبيب المنوي (يسار الشكل) */
  const T0 = 200, rr = rng(31);
  let tub = `<path d="M70,90 Q${T0},70 330,92 L326,128 Q${T0},112 74,124Z" fill="${GAM.tub}" stroke="#ffe2c4" stroke-width="2"/>`;
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++){
    const x = 92 + row * 22 + i * 44 + rr() * 6, y = 152 + row * 46;
    tub += `<g data-st="${row === 0 ? 0 : row === 1 ? 1 : 2}">${gCell(x, y, 17 - row * 2, '#8e8ea8', '#3a3a52')}</g>`;
  }
  tub += `<path d="M190,140 Q214,190 206,260 Q200,300 186,262 Q170,200 190,140Z" fill="#e2a3b6" stroke="#ffd8e4" stroke-width="2"/><circle cx="195" cy="190" r="8" fill="#8a3a5a"/>`;
  let fan = '';
  for (let i = 0; i < 7; i++){ const x = 130 + i * 22; fan += spermSvg(x, 300 + Math.abs(i - 3) * 6, 0.7, Math.PI / 2 + (i - 3) * 0.12, 'swim', i + 5); }
  const free = [[110, 420], [180, 470], [140, 520], [60, 470]].map(([x, y], i) => spermSvg(x, y, 0.75, 1.9 - i * 0.1, 'swim', i + 12)).join('');
  const body = `
    <g transform="translate(20,250)">${part('semTub', tub)}<g data-st="3">${fan}</g></g><g data-st="4" transform="translate(250,40)">${free}</g>
    ${flowA}${cells}${brackets}
    <text class="cap sm" x="500" y="640" text-anchor="middle">شكل (3-1): تكوين النطف في الثدييات — من سليفة نطفة واحدة (2س) تنتج أربع نطف ناضجة (س)</text>`;
  const ctl = stageCtl(SPERM_STAGES, { dur: 26 });
  return {
    body, stages: SPERM_STAGES, fnParts: ['meio1', 'meio2', 'spermio'],
    parts: [
      { id: 'semTub', anchor: [110, 355], label: [134, 300], side: 'L' },
      { id: 'spGonium', anchor: [X + 20, Y[0]], label: [866, Y[0]], side: 'R' },
      { id: 'spPrim', anchor: [X + 27, Y[1]], label: [866, Y[1] - 18], side: 'R' },
      { id: 'meio1', anchor: [X + 116, Y[1] + 40], label: [866, Y[1] + 40], side: 'R' },
      { id: 'spSec', anchor: [X + 71, Y[2]], label: [866, Y[2] + 30], side: 'R' },
      { id: 'meio2', anchor: [X + 116, Y[3] - 30], label: [866, Y[3] - 22], side: 'R' },
      { id: 'spTid', anchor: [X + 90, Y[3]], label: [866, Y[3] + 26], side: 'R' },
      { id: 'spermio', anchor: [X + 116, Y[3] + 34], label: [866, Y[3] + 72], side: 'R' },
      { id: 'spermM', anchor: [X + 84, Y[4] + 10], label: [866, Y[4] + 50], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:gamOrigin', label: 'المنشأ والمجموعة الكروموسومية (ص9)' }, { id: 'tbl:spermEgg', label: 'النطف × البيوض' }]),
    init(){ if (!still) ctl.start(); else { STG.T = 0.999; } },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){ if (!still) ctl.tick(dt); stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k); wiggle(a, t); }
  };
}

/* ───────── 3) تكوين البيوض في الثدييات — شكل (3-2) ص8 ───────── */
const EGG_STAGES = [
  { n: '1 · سليفات البيوض (2س)', d: 'تتكون البيوض في المبايض التي بداخلها خلايا جرثومية تمر بانقسامات غير مباشرة (اعتيادية) تنتج سليفات البيوض (2س)، وتعاني انقسامات اعتيادية متعاقبة لتنتج سليفات بيوض إضافية.' },
  { n: '2 · الخلايا البيضية الأولية (2س)', d: 'يبدأ قسم من السليفات بالنمو فيكبر حجمها وتدعى الخلايا البيضية الأولية (2س)، وتكون محاطة بخلايا صغيرة تدعى الخلايا الحوصلية، وتشكل معها الحويصلة المبيضية.' },
  { n: '3 · خلية بيضية ثانوية (س) + جسم قطبي أول (س)', d: 'تمر الخلية البيضية الأولية بالانقسام الاختزالي الأول فينتج خليتان غير متساويتين بالحجم بسبب الانقسام السايتوبلازمي غير المتساوي: الكبيرة الخلية البيضية الثانوية والصغيرة الجسم القطبي الأول.' },
  { n: '4 · أرومة البيضة (س) + أجسام قطبية ثانية (س)', d: 'تمر الخلية البيضية الثانوية بالانقسام الاختزالي الثاني: الكبيرة أرومة البيضة والصغيرة الجسم القطبي الثاني، وقد ينقسم الجسم القطبي الأول فيكوّن جسمين قطبيين آخرين.' },
  { n: '5 · النتيجة النهائية', d: 'خلية بيضية ناضجة (أرومة البيضة تنمو إلى بيضة ناضجة) + 3 أجسام قطبية تنحل فيما بعد.' }
];
function intEgg(still){
  const X = 650, Y = [100, 196, 316, 470];
  const c = '#8f7ad8', n = '#2e2266';
  const ar = (x0, y0, x1, y1, st) => `<g data-st="${st}">${gArrow(x0, y0, x1, y1, GAM.arr)}</g>`;
  let flow = ar(X, Y[0] + 20, X, Y[1] - 30, 1) + ar(X - 12, Y[1] + 28, X - 78, Y[2] - 16, 2) + ar(X + 10, Y[1] + 30, X + 34, Y[2] - 30, 2) +
    ar(X - 92, Y[2] + 14, X - 140, Y[3] - 14, 3) + ar(X - 80, Y[2] + 14, X - 90, Y[3] - 14, 3) + ar(X + 30, Y[2] + 30, X - 34, Y[3] - 14, 3) + ar(X + 44, Y[2] + 32, X + 54, Y[3] - 26, 3);
  const cells = `
    ${part('ooGonium', `<g data-st="0">${gCell(X, Y[0], 18, c, n)}</g>`)}
    ${part('ooPrim', `<g data-st="1"><circle cx="${X}" cy="${Y[1]}" r="38" fill="none" stroke="#f2c97a" stroke-width="6" stroke-dasharray="3 5"/>${gCell(X, Y[1], 28, c, n)}</g>`)}
    ${part('polar1', `<g data-st="2">${gCell(X - 86, Y[2], 12, GAM.polar, n)}</g>`)}
    ${part('ooSec', `<g data-st="2">${gCell(X + 42, Y[2], 30, c, n)}</g>`)}
    ${part('polar2', `<g data-st="3">${gCell(X - 146, Y[3], 11, GAM.polar, n)}${gCell(X - 92, Y[3], 11, GAM.polar, n)}${gCell(X - 38, Y[3], 11, GAM.polar, n)}</g>`)}
    ${part('ootid', `<g data-st="3">${gCell(X + 58, Y[3], 32, '#a98ae8', n)}</g>`)}
    ${part('ovumM', `<g data-st="4"><circle cx="${X + 58}" cy="${Y[3]}" r="44" fill="none" stroke="#ffe08a" stroke-width="3"/></g>`)}
    <g data-st="4" id="pbFade"><text class="cap sm" x="${X - 92}" y="${Y[3] + 40}" text-anchor="middle">(تنحل فيما بعد)</text></g>`;
  const brk = (x, y0, y1, id, st) => part(id, `<g data-st="${st}"><path d="M${x},${y0} L${x + 12},${y0} L${x + 12},${y1} L${x},${y1}" fill="none" stroke="#ffe08a" stroke-width="2.4"/></g>`);
  const brackets = brk(X + 110, Y[1] + 6, Y[2] + 14, 'oMeio1', 2) + brk(X + 110, Y[2] + 36, Y[3] + 14, 'oMeio2', 3);
  /* المبيض وقناة البيض وحويصلة كراف والجسم الأصفر (مصغّر يسار المشهد) */
  const OX = 250, OY = 440, S = 0.8, sp = (dx, dy) => [n2(OX + dx * S), n2(OY + dy * S)];
  let ov = `<ellipse cx="${OX}" cy="${OY}" rx="150" ry="190" fill="${GAM.ovary}" stroke="#ffe0d8" stroke-width="10" opacity=".95"/><ellipse cx="${OX}" cy="${OY}" rx="138" ry="178" fill="none" stroke="#c9b9a8" stroke-width="4" stroke-dasharray="2 6"/>`;
  const F = [[-120, -100, 9], [-138, -40, 12], [-134, 30, 16], [-112, 96, 20]];
  F.forEach(([dx, dy, r], i) => { ov += `<g data-st="${Math.min(2, i)}"><circle cx="${OX + dx}" cy="${OY + dy}" r="${r + 6}" fill="#f6c3b0" stroke="#fff" stroke-width="1.4"/><circle cx="${OX + dx}" cy="${OY + dy}" r="${r * 0.55}" fill="#2a2a6a"/></g>`; });
  const graaf = `<g data-st="3"><circle cx="${OX - 88}" cy="${OY + 150}" r="40" fill="#f6c3b0" stroke="#fff" stroke-width="2"/><circle cx="${OX - 82}" cy="${OY + 150}" r="26" fill="#cfe7ff" opacity=".8"/><circle cx="${OX - 100}" cy="${OY + 160}" r="10" fill="#2a2a6a"/></g>`;
  const released = `<g data-st="3" id="relEgg">${gCell(OX - 170, OY + 200, 12, c, n)}</g>`;
  const cl = `<g data-st="4"><path d="${smoothClosed([[OX + 30, OY + 120], [OX + 60, OY + 108], [OX + 76, OY + 136], [OX + 62, OY + 168], [OX + 30, OY + 166], [OX + 18, OY + 140]])}" fill="${GAM.yellow}" stroke="#fff3c8" stroke-width="2"/>
    <path d="${smoothClosed([[OX + 90, OY + 40], [OX + 112, OY + 30], [OX + 124, OY + 54], [OX + 108, OY + 76], [OX + 86, OY + 66]])}" fill="${GAM.yellow}" stroke="#fff3c8" stroke-width="2" opacity=".8"/></g>`;
  let fimb = `<path d="M${OX + 40},${OY - 190} Q${OX - 40},${OY - 250} ${OX - 150},${OY - 210} Q${OX - 200},${OY - 186} ${OX - 190},${OY - 140}" fill="none" stroke="#d9505a" stroke-width="22" stroke-linecap="round"/>`;
  for (let i = 0; i < 9; i++){ const a = 1.2 + i * 0.22; fimb += `<path d="M${OX - 190},${OY - 140} q${n2(Math.cos(a) * -30)},${n2(Math.sin(a) * 34)} ${n2(Math.cos(a) * -40 + 6)},${n2(Math.sin(a) * 52)}" fill="none" stroke="#e8707a" stroke-width="5" stroke-linecap="round"/>`; }
  const body = `
    <g transform="translate(${OX},${OY}) scale(${S}) translate(${-OX},${-OY})">
    ${part('oviduct', fimb)}
    ${part('ovary', ov + `<text class="cap" x="${OX + 30}" y="${OY - 20}" text-anchor="middle" fill="#7a2030">مبيض</text>`)}
    ${part('graaf', graaf)}
    ${part('corpusL', cl)}
    ${released}</g>
    ${flow}${cells}${brackets}
    <text class="cap sm" x="640" y="640" text-anchor="middle">شكل (3-2): تكوين البيوض في الثدييات — بيضة واحدة ناضجة + 3 أجسام قطبية تنحل فيما بعد</text>`;
  const ctl = stageCtl(EGG_STAGES, { dur: 26 });
  return {
    body, stages: EGG_STAGES, fnParts: ['oMeio1', 'oMeio2', 'polar1'],
    parts: [
      { id: 'ooGonium', anchor: [X + 18, Y[0]], label: [866, Y[0]], side: 'R' },
      { id: 'ooPrim', anchor: [X + 38, Y[1]], label: [866, Y[1] - 26], side: 'R' },
      { id: 'oMeio1', anchor: [X + 122, Y[1] + 60], label: [866, Y[1] + 40], side: 'R' },
      { id: 'ooSec', anchor: [X + 72, Y[2]], label: [866, Y[2] + 8], side: 'R' },
      { id: 'oMeio2', anchor: [X + 122, Y[3] - 40], label: [866, Y[3] - 70], side: 'R' },
      { id: 'ootid', anchor: [X + 90, Y[3]], label: [866, Y[3] + 30], side: 'R' },
      { id: 'polar1', anchor: [X - 86, Y[2] - 12], label: [X - 120, Y[2] - 50], side: 'C' },
      { id: 'polar2', anchor: [X - 92, Y[3] + 11], label: [X - 92, Y[3] + 86], side: 'C' },
      { id: 'oviduct', anchor: sp(-60, -228), label: [134, 300], side: 'L' },
      { id: 'ovary', anchor: sp(-150, -40), label: [134, 380], side: 'L' },
      { id: 'graaf', anchor: sp(-128, 150), label: [134, 520], side: 'L' },
      { id: 'corpusL', anchor: sp(40, 150), label: [330, 640], side: 'C' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:gamOrigin', label: 'المنشأ والمجموعة الكروموسومية (ص9)' }, { id: 'tbl:spermEgg', label: 'النطف × البيوض' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt); stageShow(a, still ? 9 : STG.idx, still ? 1 : STG.k);
      /* البيضة المتحررة من حويصلة كراف تتجه نحو قناة البيض */
      const e = a.el('#relEgg'); if (e){ const p = (t * 0.15) % 1; e.setAttribute('transform', `translate(${n2(-p * 30)},${n2(-p * 60)})`); }
    }
  };
}

