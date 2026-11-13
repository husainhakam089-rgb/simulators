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

/* ───────── 2) تكوين النطف في الثدييات — شكل (3-1) ص8 ─────────
   خطوة بخطوة: مقطع في الخصية يُظهر النبيبات المنوية الملتوية، ثم مقطع عرضي في نبيب
   منوي واحد بطبقات خلاياه، ثم نرجع للمخطط ونمر بالمراحل الخمس واحدة بعد الأخرى.
   التخطيط الافتراضي (الامتحان والرسم) هو «النظرة العامة»: الخصية والنبيب مصغّران يساراً
   والمخطط يميناً؛ في الخطوتين الأوليين يكبر الرسم المعني إلى وسط المشهد. */
const SPERM_STAGES = [
  { n: '1 · الخصية (مقطع)', d: 'تتكون النطف في الخصية المؤلفة من أعداد كبيرة من نبيبات منوية ملتوية.' },
  { n: '2 · مقطع عرضي في نبيب منوي', d: 'تبطن النبيبات المنوية خلايا جرثومية أولية تنقسم انقسامات غير مباشرة متعددة ومتعاقبة، ومنها تبدأ مراحل تكوين النطف حتى النطف الناضجة.' },
  { n: '3 · سليفات النطف (2س)', d: 'تنقسم الخلايا الجرثومية الأولية المبطنة للنبيبات المنوية انقسامات غير مباشرة متعددة ومتعاقبة لتنتج سليفات النطف (2س) التي تنقسم اعتيادياً لتضاعف أعدادها.' },
  { n: '4 · الخلايا النطفية الأولية (2س)', d: 'تمر سليفات النطف بمرحلة نمو بعد توقف انقساماتها ويكبر حجمها وتسمى الخلايا النطفية الأولية (2س).' },
  { n: '5 · الخلايا النطفية الثانوية (س)', d: 'تمر الخلية النطفية الأولية بالانقسام الاختزالي الأول لتنتج خليتين متساويتين بالحجم تسمى كل منهما الخلية النطفية الثانوية (س).' },
  { n: '6 · أرومات النطف (س)', d: 'تمر الخلية النطفية الثانوية بالانقسام الاختزالي الثاني لتكوّن أربع خلايا متساوية بالحجم تدعى أرومات النطف (س).' },
  { n: '7 · أربع نطف ناضجة (س)', d: 'تعاني أرومات النطف تغييرات في شكلها وتركيبها (عملية التحول النطفي) مؤدية إلى تكوين أربع نطف ناضجة، كل منها أحادية المجموعة الكروموسومية (س).' }
];
/* أسماء ثابتة تتبع الخطوة: تُنقل خطوطها ونقاطها لمواقعها في كل خطوة، وما ليس للخطوة يُخفى */
function gamRelabel(a, L){
  const lh = VB.x < 0 ? 30 : 16;
  a.all('#labelLayer .lblG').forEach(g => {
    const p = L[g.dataset.for];
    if (!p){ g.style.display = 'none'; return; }
    g.style.display = '';
    const [ax, ay, lx, ly, side] = p, ln = g.querySelector('.lead'), dot = g.querySelector('.lblDot'), tx = g.querySelector('.lbl');
    ln.setAttribute('x1', n2(lx)); ln.setAttribute('y1', n2(ly)); ln.setAttribute('x2', n2(ax)); ln.setAttribute('y2', n2(ay));
    dot.setAttribute('cx', n2(ax)); dot.setAttribute('cy', n2(ay));
    const X = side === 'R' ? lx + 8 : side === 'L' ? lx - 8 : lx, ts = tx.querySelectorAll('tspan');
    tx.setAttribute('text-anchor', side === 'R' ? 'end' : side === 'L' ? 'start' : 'middle');
    tx.setAttribute('x', n2(X)); tx.setAttribute('y', n2(ly - (ts.length - 1) * lh / 2));
    ts.forEach(t => t.setAttribute('x', n2(X)));
  });
}
const gamSm = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const gamLerp = (A, B, k) => A.map((v, i) => v + (B[i] - v) * k);
const gamTr = p => `translate(${n2(p[0])},${n2(p[1])}) scale(${n2(p[2])})`;

/* مقطع في الخصية: غلاف، حواجز تقسمها إلى فصوص، وفي كل فص نبيب منوي ملتوٍ */
function testisSvg(){
  const RX = 130, RY = 165, M = [70, -105];
  let s = `<ellipse cx="0" cy="0" rx="${RX + 9}" ry="${RY + 9}" fill="#f7e4d6" stroke="#fff6ee" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="${RX}" ry="${RY}" fill="#f0c4ae"/>`;
  const A = [-1.75, -2.45, -3.05, 2.65, 2.05, 1.45, 0.85, 0.2];
  let sep = '';
  A.forEach(a => { const ex = Math.cos(a) * RX, ey = Math.sin(a) * RY; sep += `<path d="M${M[0]},${M[1]} Q${n2((M[0] + ex) / 2 + 10)},${n2((M[1] + ey) / 2)} ${n2(ex)},${n2(ey)}" fill="none" stroke="#fff3ea" stroke-width="3.2"/>`; });
  /* النبيبات: خط متعرّج داخل كل فص (بين حاجزين) */
  let tubs = '';
  for (let i = 0; i < A.length - 1; i++){
    let a0 = A[i], a1 = A[i + 1]; if (a1 > a0 && i === 2) a1 -= 6.2832;
    const am = (a0 + a1) / 2, pts = [];
    for (let j = 0; j <= 26; j++){ const u = j / 26, rr = 0.25 + u * 0.68, aa = am + Math.sin(u * 23) * Math.abs(a1 - a0) * 0.3 * (0.4 + u * 0.6);
      pts.push([M[0] * (1 - rr) + Math.cos(aa) * RX * rr, M[1] * (1 - rr) + Math.sin(aa) * RY * rr]); }
    tubs += `<path d="${pts.map((p, j) => (j ? 'L' : 'M') + n2(p[0]) + ',' + n2(p[1])).join(' ')}" fill="none" stroke="#b9764e" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${pts.map((p, j) => (j ? 'L' : 'M') + n2(p[0]) + ',' + n2(p[1])).join(' ')}" fill="none" stroke="#e7a77c" stroke-width="2" stroke-linejoin="round"/>`;
  }
  s = part('gTestis', s + sep + `<circle cx="${M[0]}" cy="${M[1]}" r="12" fill="#f7e4d6" stroke="#fff6ee" stroke-width="2"/>`) +
    part('semTub', tubs + `<g id="tMag"><circle cx="-62" cy="70" r="24" fill="rgba(255,224,138,.12)" stroke="#ffe08a" stroke-width="3.5"/></g>`);
  return s;
}
/* مقطع عرضي في نبيب منوي: الجدار، ثم حلقات الخلايا من الخارج إلى التجويف — كل حلقة
   تحمل رقم خطوتها (data-hl) فتتوهج عند الوصول إليها */
const TUB_R = 125;
const TUB_RINGS = [
  { id: 'gGerm',    r: 108, n: 30, cr: 6,  fill: '#a8a0c0', nuc: '#4a4466', hl: 2, flat: true },
  { id: 'spGonium', r: 92,  n: 22, cr: 8.5, fill: '#b07ad8', nuc: '#4a2a7a', hl: 2, a0: -0.87 },
  { id: 'spPrim',   r: 73,  n: 15, cr: 11, fill: '#b07ad8', nuc: '#4a2a7a', hl: 3, a0: -0.44 },
  { id: 'spSec',    r: 55,  n: 14, cr: 8,  fill: '#c08ae0', nuc: '#4a2a7a', hl: 4, a0: 0 },
  { id: 'spTid',    r: 42,  n: 18, cr: 5.5, fill: '#cfa0ec', nuc: '#4a2a7a', hl: 5, a0: 0.44 }
];
function tubuleSvg(){
  let s = part('semTubX', `<circle cx="0" cy="0" r="${TUB_R + 6}" fill="#f3d6c0" stroke="#fff3ea" stroke-width="4"/><circle cx="0" cy="0" r="${TUB_R - 6}" fill="#fbeee4"/>`) +
    `<circle cx="0" cy="0" r="30" fill="#efe2f4" stroke="#e2cfe8" stroke-width="1.5"/>`;
  TUB_RINGS.forEach(R => {
    let g = '';
    for (let i = 0; i < R.n; i++){ const a = (R.a0 || 0) + i * 6.2832 / R.n, x = Math.cos(a) * R.r, y = Math.sin(a) * R.r;
      g += R.flat ? `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${R.cr * 1.6}" ry="${R.cr * 0.75}" transform="rotate(${n2(a * 57.3 + 90)} ${n2(x)} ${n2(y)})" fill="${R.fill}" stroke="#fff" stroke-width="1"/>`
        : gCell(x, y, R.cr, R.fill, R.nuc); }
    s += `<g class="tubRing" data-hl="${R.hl}">${part(R.id, g)}</g>`;
  });
  /* نطف ناضجة: رؤوسها نحو الجدار وذيولها في التجويف */
  let sp = '';
  for (let i = 0; i < 12; i++){ const a = 0.87 + i * 6.2832 / 12, x = Math.cos(a) * 33, y = Math.sin(a) * 33;
    sp += spermSvg(n2(x), n2(y), 0.42, a + Math.PI, 'swim', 30 + i); }
  s += `<g class="tubRing" data-hl="6">${part('spermM', sp)}</g>`;
  s += `<g id="tWedge" opacity="0" pointer-events="none"><path d="M0,0 L${n2(Math.cos(-0.3) * (TUB_R + 10))},${n2(Math.sin(-0.3) * (TUB_R + 10))} A${TUB_R + 10},${TUB_R + 10} 0 0 1 ${n2(Math.cos(0.3) * (TUB_R + 10))},${n2(Math.sin(0.3) * (TUB_R + 10))}Z" fill="rgba(255,224,138,.1)" stroke="#ffe08a" stroke-width="3" stroke-dasharray="8 5"/></g>`;
  return s;
}
/* مواقع الرسمين: النظرة العامة / مكبّر في الوسط */
const SP_T_SMALL = [300, 335, 0.6], SP_T_BIG = [500, 365, 1.55];
const SP_S_SMALL = [300, 560, 0.55], SP_S_BIG = [500, 370, 2.0];
const ringPt = (pos, r, a) => [pos[0] + Math.cos(a) * r * pos[2], pos[1] + Math.sin(a) * r * pos[2]];

function intSperm(still){
  const X = 640, Y = [104, 196, 296, 396, 520];
  const c = GAM.cell, n = GAM.nuc;
  let flowA = '';
  const ar = (x0, y0, x1, y1, st) => `<g data-st="${st}">${gArrow(x0, y0, x1, y1, GAM.arr)}</g>`;
  flowA += ar(X, Y[0] + 22, X, Y[1] - 28, 3);
  [-1, 1].forEach(s => { flowA += ar(X + s * 8, Y[1] + 28, X + s * 50, Y[2] - 24, 4); });
  [-75, -25, 25, 75].forEach((dx, i) => { const px = X + (i < 2 ? -50 : 50); flowA += ar(px + (i % 2 ? 6 : -6), Y[2] + 22, X + dx, Y[3] - 18, 5); });
  [-75, -25, 25, 75].forEach(dx => { flowA += ar(X + dx, Y[3] + 18, X + dx, Y[4] - 34, 6); });
  const cells = `
    ${part('spGonium', `<g data-st="2">${gCell(X, Y[0], 20, c, n)}</g>`)}
    ${part('spPrim', `<g data-st="3">${gCell(X, Y[1], 27, c, n)}</g>`)}
    ${part('spSec', `<g data-st="4">${gCell(X - 50, Y[2], 21, c, n)}${gCell(X + 50, Y[2], 21, c, n)}</g>`)}
    ${part('spTid', `<g data-st="5">${[-75, -25, 25, 75].map(dx => gCell(X + dx, Y[3], 15, c, n)).join('')}</g>`)}
    ${part('spermM', `<g data-st="6">${[-75, -25, 25, 75].map((dx, i) => spermSvg(X + dx, Y[4] - 24, 0.95, Math.PI / 2, 'swim', i)).join('')}</g>`)}`;
  const brk = (x, y0, y1, id, st) => part(id, `<g data-st="${st}"><path d="M${x},${y0} L${x + 12},${y0} L${x + 12},${y1} L${x},${y1}" fill="none" stroke="#ffe08a" stroke-width="2.4"/></g>`);
  const brackets = brk(X + 104, Y[1] - 6, Y[2] + 14, 'meio1', 4) + brk(X + 104, Y[2] + 22, Y[3] + 14, 'meio2', 5) +
    part('spermio', `<g data-st="6"><line x1="${X - 110}" y1="${Y[3] + 34}" x2="${X + 116}" y2="${Y[3] + 34}" stroke="#e8e0f0" stroke-width="2.2" stroke-dasharray="9 6"/></g>`);
  /* خطوط التكبير: من النبيب في الخصية إلى المقطع العرضي، ومن الجزء المؤشر من الجدار إلى المخطط */
  const mag = ringPt(SP_T_SMALL, 1, 0), mT = [SP_T_SMALL[0] - 62 * SP_T_SMALL[2], SP_T_SMALL[1] + 70 * SP_T_SMALL[2]];
  const zoomLines = `<g id="spZoom">
    <path d="M${n2(mT[0] - 14)},${n2(mT[1] + 6)} L${n2(SP_S_SMALL[0] - 66)},${n2(SP_S_SMALL[1] - 30)} M${n2(mT[0] + 14)},${n2(mT[1] + 6)} L${n2(SP_S_SMALL[0] + 66)},${n2(SP_S_SMALL[1] - 30)}" stroke="#ffe08a" stroke-width="1.6" stroke-dasharray="5 5" fill="none" opacity=".75"/>
    <path d="M${n2(SP_S_SMALL[0] + 70)},${n2(SP_S_SMALL[1] - 20)} Q${X - 160},${Y[0] + 120} ${X - 32},${Y[0]}" stroke="#ffe08a" stroke-width="1.6" stroke-dasharray="5 5" fill="none" opacity=".75"/></g>`;
  void mag;
  const body = `
    ${zoomLines}
    <g id="spFlow">${flowA}${cells}${brackets}</g>
    <g id="spTub" transform="${gamTr(SP_S_SMALL)}">${tubuleSvg()}</g>
    <g id="spTes" transform="${gamTr(SP_T_SMALL)}">${testisSvg()}</g>
    <text id="spCap" class="cap sm" x="500" y="668" text-anchor="middle">شكل (3-1): تكوين النطف في الثدييات — من سليفة نطفة واحدة (2س) تنتج أربع نطف ناضجة (س)</text>`;
  const ctl = stageCtl(SPERM_STAGES, { dur: 38 });
  /* مواقع الأسماء في النظرة العامة (وهي أيضاً مواقع الامتحان) */
  const T = SP_T_SMALL, S = SP_S_SMALL;
  const tAt = (x, y, p) => [p[0] + x * p[2], p[1] + y * p[2]];
  const ov = {
    gTestis: [...tAt(-130, -20, T), 134, 350, 'L'],
    semTub: [...tAt(-62, 70, T), 134, 420, 'L'],
    semTubX: [...ringPt(S, TUB_R + 4, 2.6), 134, 495, 'L'],
    gGerm: [...ringPt(S, 108, 3.4), 134, 560, 'L'],
    spGonium: [X + 20, Y[0], 866, Y[0], 'R'],
    spPrim: [X + 27, Y[1], 866, Y[1] - 18, 'R'],
    meio1: [X + 116, Y[1] + 40, 866, Y[1] + 40, 'R'],
    spSec: [X + 71, Y[2], 866, Y[2] + 30, 'R'],
    meio2: [X + 116, Y[3] - 30, 866, Y[3] - 22, 'R'],
    spTid: [X + 90, Y[3], 866, Y[3] + 26, 'R'],
    spermio: [X + 116, Y[3] + 34, 866, Y[3] + 72, 'R'],
    spermM: [X + 84, Y[4] + 10, 866, Y[4] + 50, 'R']
  };
  /* الخطوة 1: الخصية مكبّرة */
  const TB = SP_T_BIG, SB = SP_S_BIG;
  const big0 = { gTestis: [...tAt(-139, 40, TB), 134, 420, 'L'], semTub: [...tAt(-62, 70, TB), 866, 540, 'R'] };
  /* الخطوة 2: النبيب مكبّراً — كل اسم يشير إلى خلية من حلقته */
  const big1 = {
    semTubX: [...ringPt(SB, TUB_R + 3, 2.5), 134, 520, 'L'],
    gGerm: [...ringPt(SB, 108, 3.3), 134, 420, 'L'],
    spGonium: [...ringPt(SB, 92, -0.87), 866, 170, 'R'],
    spPrim: [...ringPt(SB, 73, -0.44), 866, 260, 'R'],
    spSec: [...ringPt(SB, 55, 0), 866, 360, 'R'],
    spTid: [...ringPt(SB, 42, 0.44), 866, 460, 'R'],
    spermM: [...ringPt(SB, 33, 0.87), 866, 560, 'R']
  };
  const parts = Object.keys(ov).map(id => ({ id, anchor: [ov[id][0], ov[id][1]], label: [ov[id][2], ov[id][3]], side: ov[id][4] }));
  let lastL = null;
  return {
    body, stages: SPERM_STAGES, fnParts: ['meio1', 'meio2', 'spermio'], parts,
    tools: ctl.tools.concat([{ id: 'tbl:gamOrigin', label: 'المنشأ والمجموعة الكروموسومية (ص9)' }, { id: 'tbl:spermEgg', label: 'النطف × البيوض' }]),
    init(){ if (!still) ctl.start(); else { STG.T = 0.999; } },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      const s = still ? 9 : STG.idx, k = still ? 1 : STG.k, e = gamSm(k / 0.3);
      /* الانتقال: الخصية تكبر (1)، ثم تصغر ويكبر النبيب (2)، ثم يصغر النبيب ويظهر المخطط (3+) */
      const tP = s === 0 ? TB : s === 1 ? gamLerp(TB, T, e) : T;
      const sP = s === 0 ? SB : s === 1 ? gamLerp(T.slice(0, 2).concat([0.15]), SB, e) : s === 2 ? gamLerp(SB, S, e) : S;
      const tes = a.el('#spTes'), tub = a.el('#spTub'), fl = a.el('#spFlow'), zm = a.el('#spZoom');
      if (tes){ tes.style.pointerEvents = s === 1 ? 'none' : ''; tes.setAttribute('transform', gamTr(tP)); tes.setAttribute('opacity', s === 1 ? n2(1 - e) : s === 2 ? n2(e) : 1); }
      if (tub){ tub.style.pointerEvents = s === 0 ? 'none' : ''; tub.setAttribute('transform', gamTr(sP)); tub.setAttribute('opacity', s === 0 ? 0 : s === 1 ? n2(e) : 1); }
      if (fl){ fl.setAttribute('opacity', s < 2 ? 0 : s === 2 ? n2(e) : 1); fl.style.pointerEvents = s < 2 ? 'none' : ''; }
      if (zm) zm.setAttribute('opacity', s < 2 ? 0 : s === 2 ? n2(e) : 1);
      const mg = a.el('#tMag'); if (mg) mg.setAttribute('opacity', s === 0 ? n2(0.55 + 0.45 * Math.sin(t * 4)) : 1);
      const wd = a.el('#tWedge'); if (wd) wd.setAttribute('opacity', s === 1 ? n2(Math.max(0, (k - 0.5) * 2) * (0.6 + 0.4 * Math.sin(t * 4))) : 0);
      /* حلقات النبيب: في خطوة 2 كلها واضحة، وبعدها تتوهج حلقة الخطوة الحالية */
      a.all('.tubRing').forEach(g => { const h = +g.dataset.hl; g.setAttribute('opacity', s <= 1 || s > 6 ? 1 : h === s ? 1 : h < s ? 0.75 : 0.3);
        g.style.filter = s >= 2 && s <= 6 && h === s ? `drop-shadow(0 0 ${n2(3 + 3 * Math.sin(t * 4))}px #ffe08a)` : ''; });
      stageShow(a, s, k);
      const L = s === 0 ? big0 : s === 1 ? (e > 0.6 ? big1 : {}) : s === 2 && e < 0.6 ? {} : ov, key = s === 0 ? 'b0' : s === 1 ? (e > 0.6 ? 'b1' : 'x') : s === 2 && e < 0.6 ? 'x' : 'ov';
      if (key !== lastL || !a.el('#labelLayer').dataset.gam){ gamRelabel(a, L); lastL = key; a.el('#labelLayer').dataset.gam = 1; }
      wiggle(a, t);
    }
  };
}

/* ───────── 3) تكوين البيوض في الثدييات — شكل (3-2) ص8 ─────────
   خطوة بخطوة: مقطع في المبيض أولاً (حويصلات بأحجام متتالية، حويصلة كراف، قناة البيض،
   الجسم الأصفر)، ثم يصغر المبيض يساراً ونمر بالمراحل واحدة بعد الأخرى؛ مع كل مرحلة
   تتوهج في المبيض الحويصلة التي تمثلها. */
const EGG_STAGES = [
  { n: '1 · المبيض (مقطع)', d: 'تتكون البيوض في المبايض التي بداخلها خلايا جرثومية. في المقطع حويصلات مبيضية بأحجام متتالية، وحويصلة كراف، والجسم الأصفر، وقناة البيض بقمعها المهدب.' },
  { n: '2 · سليفات البيوض (2س)', d: 'تمر الخلايا الجرثومية داخل المبايض بانقسامات غير مباشرة (اعتيادية) تنتج سليفات البيوض (2س)، وتعاني انقسامات اعتيادية متعاقبة لتنتج سليفات بيوض إضافية.' },
  { n: '3 · الخلايا البيضية الأولية (2س)', d: 'يبدأ قسم من السليفات بالنمو فيكبر حجمها وتدعى الخلايا البيضية الأولية (2س)، وتكون محاطة بخلايا صغيرة تدعى الخلايا الحوصلية، وتشكل معها الحويصلة المبيضية.' },
  { n: '4 · خلية بيضية ثانوية (س) + جسم قطبي أول (س)', d: 'تمر الخلية البيضية الأولية بالانقسام الاختزالي الأول فينتج خليتان غير متساويتين بالحجم بسبب الانقسام السايتوبلازمي غير المتساوي: الكبيرة الخلية البيضية الثانوية والصغيرة الجسم القطبي الأول.' },
  { n: '5 · التحرر من حويصلة كراف', d: 'تتحرر الخلية البيضية الثانوية من حويصلة كراف (حويصلة مبيضية ناضجة كبيرة) إلى خارج المبيض، وتستقبلها قناة البيض بقمعها المهدب.' },
  { n: '6 · أرومة البيضة (س) + أجسام قطبية ثانية (س)', d: 'تمر الخلية البيضية الثانوية بالانقسام الاختزالي الثاني: الكبيرة أرومة البيضة والصغيرة الجسم القطبي الثاني، وقد ينقسم الجسم القطبي الأول فيكوّن جسمين قطبيين آخرين.' },
  { n: '7 · النتيجة النهائية', d: 'خلية بيضية ناضجة (أرومة البيضة تنمو إلى بيضة ناضجة) + 3 أجسام قطبية تنحل فيما بعد. ويتكون الجسم الأصفر في المبيض بعد تحرر البيضة من حويصلة كراف.' }
];
/* حويصلة: طبقة خلايا حوصلية، تجويف سائل (للحويصلات الكبيرة)، وخلية بيضية في وسطها */
const follicleSvg = (x, y, R, oR, antrum, oc) => {
  let s = `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(R)}" fill="#f6c3b0" stroke="#fff4ec" stroke-width="1.6"/>`;
  const n = Math.max(8, Math.round(R * 0.9));
  for (let i = 0; i < n; i++){ const a = i * 6.2832 / n; s += `<circle cx="${n2(x + Math.cos(a) * R * 0.86)}" cy="${n2(y + Math.sin(a) * R * 0.86)}" r="${n2(Math.max(1.6, R * 0.09))}" fill="#e9a58e"/>`; }
  if (antrum) s += `<circle cx="${n2(x + R * 0.12)}" cy="${n2(y - R * 0.08)}" r="${n2(R * antrum)}" fill="#cfe7ff" opacity=".9"/>`;
  return s + gCell(x - (antrum ? R * 0.32 : 0), y + (antrum ? R * 0.3 : 0), oR, oc || '#8f7ad8', '#2e2266');
};
const OV_RX = 150, OV_RY = 118;
/* الحويصلات بالترتيب حول المبيض: data-hl رقم المرحلة التي تمثلها */
const OV_F = {
  germ: [-128, 20], prim: [-104, -62], sec: [-30, -92], graaf: [70, -70], rel: [118, 20], cl: [40, 78]
};
function ovarySvg(){
  const F = OV_F;
  let s = part('ovary', `<ellipse cx="0" cy="0" rx="${OV_RX + 8}" ry="${OV_RY + 8}" fill="#f2b3a8" stroke="#fff0ea" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="${OV_RX - 6}" ry="${OV_RY - 6}" fill="#e98a8a"/>
    <ellipse cx="0" cy="0" rx="${OV_RX * 0.42}" ry="${OV_RY * 0.36}" fill="#d97474" opacity=".7"/>`);
  /* خلايا جرثومية على حافة المبيض */
  let germ = ''; for (let i = 0; i < 9; i++){ const a = 2.55 + i * 0.13; germ += `<circle cx="${n2(Math.cos(a) * (OV_RX - 3))}" cy="${n2(Math.sin(a) * (OV_RY - 3))}" r="4.2" fill="#b9a6ec" stroke="#fff" stroke-width=".8"/>`; }
  s += `<g class="ovF" data-hl="1">${part('oGerm', germ + [[-118, 6], [-122, 36], [-110, 22]].map(([x, y]) => gCell(x, y, 6, '#8f7ad8', '#2e2266')).join(''))}</g>`;
  s += `<g class="ovF" data-hl="2">${part('ooPrim', follicleSvg(F.prim[0], F.prim[1], 17, 8, 0))}</g>`;
  s += `<g class="ovF" data-hl="3">${part('ooFol', follicleSvg(F.sec[0], F.sec[1], 26, 9, 0.45))}</g>`;
  s += `<g class="ovF" data-hl="4">${part('graaf', follicleSvg(F.graaf[0], F.graaf[1], 40, 10, 0.62))}</g>`;
  /* حويصلة متمزقة عند الحافة تتحرر منها الخلية البيضية الثانوية */
  s += `<g class="ovF" data-hl="4"><path d="M${F.rel[0] - 22},${F.rel[1] - 26} A30,30 0 1 0 ${F.rel[0] + 26},${F.rel[1] + 12}" fill="#f6c3b0" stroke="#fff4ec" stroke-width="2"/></g>`;
  s += `<g class="ovF" data-hl="6">${part('corpusL', `<path d="${smoothClosed([[F.cl[0] - 26, F.cl[1] - 6], [F.cl[0] - 8, F.cl[1] - 24], [F.cl[0] + 20, F.cl[1] - 20], [F.cl[0] + 28, F.cl[1] + 4], [F.cl[0] + 10, F.cl[1] + 24], [F.cl[0] - 18, F.cl[1] + 20]])}" fill="${GAM.yellow}" stroke="#fff3c8" stroke-width="2"/>
    <path d="M${F.cl[0] - 12},${F.cl[1]} q12,-10 24,0 M${F.cl[0] - 8},${F.cl[1] + 9} q8,-6 16,0" stroke="#d9a02e" stroke-width="2" fill="none"/>`)}</g>`;
  /* قناة البيض وقمعها المهدب عند الحافة اليمنى */
  let fim = `<path d="M232,-150 Q200,-120 196,-70 Q194,-36 176,-12" fill="none" stroke="#d9505a" stroke-width="22" stroke-linecap="round"/>`;
  for (let i = 0; i < 8; i++){ const a = 1.7 + i * 0.28; fim += `<path d="M176,-12 q${n2(Math.cos(a) * 22)},${n2(Math.sin(a) * 26)} ${n2(Math.cos(a) * 34)},${n2(Math.sin(a) * 40)}" fill="none" stroke="#e8707a" stroke-width="5" stroke-linecap="round"/>`; }
  s = part('oviduct', fim) + s;
  /* الخلية البيضية الثانوية المتحررة (تتحرك في المرحلة 5 نحو القمع) */
  s += `<g id="ovRel" class="ovF" data-hl="4">${part('ooSec', `<circle cx="0" cy="0" r="17" fill="none" stroke="#f6c3b0" stroke-width="4" stroke-dasharray="3 3"/>` + gCell(0, 0, 11, '#8f7ad8', '#2e2266'))}</g>`;
  return s;
}
const OV_SMALL = [290, 420, 0.8], OV_BIG = [480, 385, 1.85];
const ovAt = (p, x, y) => [p[0] + x * p[2], p[1] + y * p[2]];
const ovRelPos = k => [OV_F.rel[0] + 10 + k * 50, OV_F.rel[1] - 6 - k * 22];

function intEgg(still){
  const X = 650, Y = [100, 196, 316, 470];
  const c = '#8f7ad8', n = '#2e2266';
  const ar = (x0, y0, x1, y1, st) => `<g data-st="${st}">${gArrow(x0, y0, x1, y1, GAM.arr)}</g>`;
  let flow = ar(X, Y[0] + 20, X, Y[1] - 30, 2) + ar(X - 12, Y[1] + 28, X - 78, Y[2] - 16, 3) + ar(X + 10, Y[1] + 30, X + 34, Y[2] - 30, 3) +
    ar(X - 92, Y[2] + 14, X - 140, Y[3] - 14, 5) + ar(X - 80, Y[2] + 14, X - 90, Y[3] - 14, 5) + ar(X + 30, Y[2] + 30, X - 34, Y[3] - 14, 5) + ar(X + 44, Y[2] + 32, X + 54, Y[3] - 26, 5);
  const cells = `
    ${part('ooGonium', `<g data-st="1">${gCell(X, Y[0], 18, c, n)}</g>`)}
    ${part('ooPrim', `<g data-st="2"><circle cx="${X}" cy="${Y[1]}" r="38" fill="none" stroke="#f2c97a" stroke-width="6" stroke-dasharray="3 5"/>${gCell(X, Y[1], 28, c, n)}</g>`)}
    ${part('polar1', `<g data-st="3">${gCell(X - 86, Y[2], 12, GAM.polar, n)}</g>`)}
    ${part('ooSec', `<g data-st="3">${gCell(X + 42, Y[2], 30, c, n)}</g>`)}
    ${part('polar2', `<g data-st="5">${gCell(X - 146, Y[3], 11, GAM.polar, n)}${gCell(X - 92, Y[3], 11, GAM.polar, n)}${gCell(X - 38, Y[3], 11, GAM.polar, n)}</g>`)}
    ${part('ootid', `<g data-st="5">${gCell(X + 58, Y[3], 32, '#a98ae8', n)}</g>`)}
    ${part('ovumM', `<g data-st="6"><circle cx="${X + 58}" cy="${Y[3]}" r="44" fill="none" stroke="#ffe08a" stroke-width="3"/></g>`)}
    <g data-st="6"><text class="cap sm" x="${X - 92}" y="${Y[3] + 40}" text-anchor="middle">(تنحل فيما بعد)</text></g>`;
  const brk = (x, y0, y1, id, st) => part(id, `<g data-st="${st}"><path d="M${x},${y0} L${x + 12},${y0} L${x + 12},${y1} L${x},${y1}" fill="none" stroke="#ffe08a" stroke-width="2.4"/></g>`);
  const brackets = brk(X + 110, Y[1] + 6, Y[2] + 14, 'oMeio1', 3) + brk(X + 110, Y[2] + 36, Y[3] + 14, 'oMeio2', 5);
  const body = `
    <g id="egFlow">${flow}${cells}${brackets}</g>
    <g id="egOv" transform="${gamTr(OV_SMALL)}">${ovarySvg()}</g>
    <text class="cap sm" x="560" y="668" text-anchor="middle">شكل (3-2): تكوين البيوض في الثدييات — بيضة واحدة ناضجة + 3 أجسام قطبية تنحل فيما بعد</text>`;
  const ctl = stageCtl(EGG_STAGES, { dur: 38 });
  const S = OV_SMALL, B = OV_BIG, F = OV_F;
  const ov = {
    ooGonium: [X + 18, Y[0], 866, Y[0], 'R'],
    ooPrim: [X + 38, Y[1], 866, Y[1] - 26, 'R'],
    oMeio1: [X + 122, Y[1] + 60, 866, Y[1] + 40, 'R'],
    ooSec: [X + 72, Y[2], 866, Y[2] + 8, 'R'],
    oMeio2: [X + 122, Y[3] - 40, 866, Y[3] - 70, 'R'],
    ootid: [X + 90, Y[3], 866, Y[3] + 30, 'R'],
    ovumM: [X + 98, Y[3] + 20, 866, Y[3] + 80, 'R'],
    polar1: [X - 86, Y[2] - 12, X - 120, Y[2] - 50, 'C'],
    polar2: [X - 92, Y[3] + 11, X - 92, Y[3] + 86, 'C'],
    ovary: [...ovAt(S, -OV_RX - 6, -10), 134, 330, 'L'],
    oGerm: [...ovAt(S, -122, 36), 134, 405, 'L'],
    ooFol: [...ovAt(S, F.sec[0] - 20, F.sec[1] - 14), 134, 255, 'L'],
    graaf: [...ovAt(S, F.graaf[0], F.graaf[1] - 40), 330, 248, 'C'],
    corpusL: [...ovAt(S, F.cl[0], F.cl[1] + 22), 134, 560, 'L'],
    oviduct: [...ovAt(S, 210, -110), 460, 236, 'C']
  };
  /* الخطوة 1: المبيض مكبّراً */
  const big0 = {
    ovary: [...ovAt(B, -OV_RX - 6, -10), 134, 330, 'L'],
    oGerm: [...ovAt(B, -122, 36), 134, 430, 'L'],
    ooPrim: [...ovAt(B, F.prim[0], F.prim[1] - 17), 330, 118, 'C'],
    ooFol: [...ovAt(B, F.sec[0], F.sec[1] - 26), 520, 112, 'C'],
    graaf: [...ovAt(B, F.graaf[0] + 30, F.graaf[1] - 26), 866, 250, 'R'],
    oviduct: [...ovAt(B, 210, -120), 866, 140, 'R'],
    ooSec: [...ovAt(B, ...ovRelPos(0.5)), 866, 400, 'R'],
    corpusL: [...ovAt(B, F.cl[0] + 26, F.cl[1] + 6), 866, 560, 'R']
  };
  const parts = Object.keys(ov).map(id => ({ id, anchor: [ov[id][0], ov[id][1]], label: [ov[id][2], ov[id][3]], side: ov[id][4] }));
  let lastL = null;
  return {
    body, stages: EGG_STAGES, fnParts: ['oMeio1', 'oMeio2', 'polar1'], parts,
    tools: ctl.tools.concat([{ id: 'tbl:gamOrigin', label: 'المنشأ والمجموعة الكروموسومية (ص9)' }, { id: 'tbl:spermEgg', label: 'النطف × البيوض' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      const s = still ? 9 : STG.idx, k = still ? 1 : STG.k, e = gamSm(k / 0.3);
      const oP = s === 0 ? B : s === 1 ? gamLerp(B, S, e) : S;
      const og = a.el('#egOv'), fl = a.el('#egFlow');
      if (og) og.setAttribute('transform', gamTr(oP));
      if (fl){ fl.setAttribute('opacity', s === 0 ? 0 : s === 1 ? n2(e) : 1); fl.style.pointerEvents = s === 0 ? 'none' : ''; }
      /* الحويصلة المقابلة للمرحلة تتوهج، والخلية البيضية الثانوية تتحرك نحو القمع في المرحلة 5 */
      a.all('.ovF').forEach(g => { const h = +g.dataset.hl; g.setAttribute('opacity', s === 0 || s > 6 ? 1 : h === s ? 1 : 0.55);
        g.style.filter = s >= 1 && s <= 6 && h === s ? `drop-shadow(0 0 ${n2(3 + 3 * Math.sin(t * 4))}px #ffe08a)` : ''; });
      const rel = a.el('#ovRel'); if (rel){ const p = s === 4 ? gamSm(k) : s > 4 ? 1 : 0.5, q = ovRelPos(s === 0 ? 0.5 : p); rel.setAttribute('transform', `translate(${n2(q[0])},${n2(q[1])})`); }
      stageShow(a, s, k);
      const key = s === 0 ? 'b0' : s === 1 && e < 0.6 ? 'x' : 'ov';
      if (key !== lastL || !a.el('#labelLayer').dataset.gam){ gamRelabel(a, key === 'b0' ? big0 : key === 'x' ? {} : ov); lastL = key; a.el('#labelLayer').dataset.gam = 1; }
    }
  };
}
