
/* ══════════════════════════════════════════════════════════════════════════
   4.5 · النسيج الظهاري: الحرشفي البسيط، المكعبي البسيط، العمودي البسيط،
         العمودي المطبق الكاذب المهدب، الحرشفي المطبق، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
const ETH_VIEWS = [
  { id: 'esq',  label: 'حرشفي بسيط' },
  { id: 'ecub', label: 'مكعبي بسيط' },
  { id: 'ecol', label: 'عمودي بسيط' },
  { id: 'epse', label: 'مطبق كاذب مهدب' },
  { id: 'estr', label: 'حرشفي مطبق' },
  { id: 'ecmp', label: 'قارن' }
];
const ETH_PAL = { cell: '#e8b4b8', cellL: '#fff0f0', nuc: 'url(#gNucl)', bm: '#e9d29a', ct: '#4a3442', cap: '#c0392b', o2: '#9fe9ff', co2: '#b8c2cc', food: '#ffb347', sec: '#f7d774', mucus: '#cfe6b8', dust: '#8a7a6a' };
const ETH_X0 = 160, ETH_X1 = 840, ETH_BY = 400;

SCENES.epith = {
  title: 'النسيج الظهاري',
  get src(){ return SRC_WAIT; },
  tint: ['rgba(170,90,100,.24)', 'rgba(110,90,150,.16)'],
  model3d: () => 'eth_' + SEL.ethv,
  build(){
    const v = SEL.ethv || 'esq';
    const s = v === 'ecub' ? ethCub() : v === 'ecol' ? ethCol() : v === 'epse' ? ethPse() : v === 'estr' ? ethStr() : v === 'ecmp' ? ethCmp() : ethSq();
    s.rebuildOnRadio = 'ethv';
    s.tools = ETH_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'ethv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.eth_sq  = { title: 'الظهاري الحرشفي البسيط', build: () => ethSq() };
SCENES.eth_cub = { title: 'الظهاري المكعبي البسيط', build: () => ethCub() };
SCENES.eth_col = { title: 'الظهاري العمودي البسيط', build: () => ethCol() };
SCENES.eth_pse = { title: 'الظهاري العمودي المطبق الكاذب المهدب', build: () => ethPse() };
SCENES.eth_str = { title: 'الظهاري الحرشفي المطبق', build: () => ethStr() };

/* الغشاء القاعدي والنسيج الضام تحته (مع وعاء شعري) */
function ethBase(x0, x1, by){
  const fib = []; for (let i = 0; i < 9; i++){ const y = by + 24 + i * 11; fib.push(`<path d="M${x0 + 10},${y} Q${(x0 + x1) / 2},${y + (i % 2 ? 9 : -9)} ${x1 - 10},${y}" fill="none" stroke="#a07a90" stroke-width="1.3" opacity=".5"/>`); }
  return {
    ct: part('connBelow', `<rect x="${x0}" y="${by + 6}" width="${x1 - x0}" height="120" rx="10" fill="${ETH_PAL.ct}"/>${fib.join('')}
      <rect x="${x0 + 30}" y="${by + 70}" width="${x1 - x0 - 60}" height="26" rx="13" fill="${ETH_PAL.cap}" stroke="#ffb3a8" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<ellipse class="rbc" data-i="${i}" cx="${x0 + 60 + i * 100}" cy="${by + 83}" rx="9" ry="6" fill="#ff7a6a"/>`).join('')}`),
    bm: part('basem', `<rect x="${x0}" y="${by - 3}" width="${x1 - x0}" height="8" rx="4" fill="${ETH_PAL.bm}"/>`)
  };
}
const ethCap = (t, sub) => `<text class="cap" x="500" y="${ETH_BY + 168}" text-anchor="middle">${t}</text><text class="cap sm" x="500" y="${ETH_BY + 194}" text-anchor="middle">${sub}</text>`;
const ethLumen = t => `<text class="cap sm" x="500" y="70" text-anchor="middle">${t}</text>`;
/* جزيئات متحركة عمودياً عبر النسيج */
const ethDots = (cls, n, fill, r, shape) => { const o = []; for (let i = 0; i < n; i++) o.push(shape === 'sq' ? `<rect class="${cls}" data-i="${i}" width="${r * 2}" height="${r * 2}" rx="2" fill="${fill}" stroke="#fff" stroke-width="1" opacity="0"/>` : `<circle class="${cls}" data-i="${i}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1" opacity="0"/>`); return o.join(''); };
function moveDots(a, cls, n, t, y0, y1, speed, xs){
  a.all('.' + cls).forEach(e => { const i = +e.dataset.i, p = (t * speed + i / n) % 1, y = y0 + (y1 - y0) * p, x = xs(i, p);
    if (e.tagName === 'rect'){ e.setAttribute('x', n2(x - 5)); e.setAttribute('y', n2(y - 5)); } else { e.setAttribute('cx', n2(x)); e.setAttribute('cy', n2(y)); }
    e.setAttribute('opacity', n2(Math.sin(p * Math.PI) * 0.95)); });
}
const rbcTick = (a, t) => a.all('.rbc').forEach(e => { const i = +e.dataset.i; e.setAttribute('cx', n2(ETH_X0 + 50 + ((i * 100 + t * 60) % (ETH_X1 - ETH_X0 - 100)))); });

/* ───────── 1) الحرشفي البسيط (الحويصلات الهوائية) ───────── */
function ethSq(){
  const B = ethBase(ETH_X0, ETH_X1, ETH_BY), H = 24, W = 113, cells = [], nucs = [];
  for (let x = ETH_X0; x < ETH_X1 - 2; x += W){
    cells.push(`<path d="M${x + 2},${ETH_BY - 3} L${x + 2},${ETH_BY - H + 6} Q${x + W / 2},${ETH_BY - H - 6} ${x + W - 2},${ETH_BY - H + 6} L${x + W - 2},${ETH_BY - 3}Z" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.cellL}" stroke-width="1.6"/>`);
    nucs.push(`<ellipse cx="${x + W / 2}" cy="${ETH_BY - H / 2 - 2}" rx="20" ry="7" fill="${ETH_PAL.nuc}"/>`);
  }
  const body = `${ethLumen('هواء الحويصلة الهوائية')}
    ${B.ct}${B.bm}
    ${part('tSqS', cells.join(''))}${part('eNuc', nucs.join(''))}
    <g>${ethDots('o2d', 10, ETH_PAL.o2, 6)}${ethDots('co2d', 8, ETH_PAL.co2, 6)}</g>
    <g font-size="13" fill="#e6f1ea"><circle cx="125" cy="120" r="6" fill="${ETH_PAL.o2}"/><text x="113" y="125" text-anchor="start">O₂ ينتشر للدم</text>
      <circle cx="125" cy="146" r="6" fill="${ETH_PAL.co2}"/><text x="113" y="151" text-anchor="start">CO₂ ينتشر للهواء</text></g>
    ${ethCap('الظهاري الحرشفي البسيط', 'طبقة واحدة من خلايا مسطحة رقيقة — تبادل الغازات بالانتشار')}`;
  return {
    body, fnParts: ['tSqS'],
    parts: [
      { id: 'tSqS', anchor: [ETH_X1 - 60, ETH_BY - 14], label: [866, 300], side: 'R' },
      { id: 'eNuc', anchor: [ETH_X0 + W * 1.5, ETH_BY - 14], label: [134, 300], side: 'L' },
      { id: 'basem', anchor: [ETH_X1 - 30, ETH_BY], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [ETH_X0 + 30, ETH_BY + 83], label: [134, 480], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiTypes', label: 'أنواع النسيج الظهاري' }],
    tick(dt, t, a){
      moveDots(a, 'o2d', 10, t, 120, ETH_BY + 80, 0.22, i => 220 + i * 60);
      moveDots(a, 'co2d', 8, t, ETH_BY + 80, 120, 0.2, i => 250 + i * 70);
      rbcTick(a, t);
    }
  };
}

/* ───────── 2) المكعبي البسيط (نبيبات الكلية) ───────── */
function ethCub(){
  const B = ethBase(ETH_X0, ETH_X1, ETH_BY), S = 68, cells = [], nucs = [];
  for (let x = ETH_X0; x < ETH_X1 - 2; x += S){
    cells.push(`<rect x="${x + 2}" y="${ETH_BY - S}" width="${S - 4}" height="${S - 3}" rx="6" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.cellL}" stroke-width="1.6"/>`);
    nucs.push(`<circle cx="${x + S / 2}" cy="${ETH_BY - S / 2}" r="14" fill="${ETH_PAL.nuc}"/>`);
  }
  const body = `${ethLumen('تجويف نبيب الكلية')}
    ${B.ct}${B.bm}
    ${part('tCubS', cells.join(''))}${part('eNuc', nucs.join(''))}
    <g>${ethDots('secd', 8, ETH_PAL.sec, 6)}${ethDots('absd', 8, ETH_PAL.o2, 5)}</g>
    <g font-size="13" fill="#e6f1ea"><circle cx="125" cy="120" r="6" fill="${ETH_PAL.sec}"/><text x="113" y="125" text-anchor="start">إفراز</text>
      <circle cx="125" cy="146" r="5" fill="${ETH_PAL.o2}"/><text x="113" y="151" text-anchor="start">امتصاص</text></g>
    ${ethCap('الظهاري المكعبي البسيط', 'طبقة واحدة من خلايا مكعبة، نواتها كروية وسطية — الإفراز والامتصاص')}`;
  return {
    body, fnParts: ['tCubS'],
    parts: [
      { id: 'tCubS', anchor: [ETH_X1 - 40, ETH_BY - 50], label: [866, 270], side: 'R' },
      { id: 'eNuc', anchor: [ETH_X0 + S * 1.5, ETH_BY - S / 2], label: [134, 300], side: 'L' },
      { id: 'basem', anchor: [ETH_X1 - 30, ETH_BY], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [ETH_X0 + 30, ETH_BY + 83], label: [134, 480], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiTypes', label: 'أنواع النسيج الظهاري' }],
    tick(dt, t, a){
      moveDots(a, 'secd', 8, t, ETH_BY - S / 2, 110, 0.2, i => ETH_X0 + S * (i + 1.5));
      moveDots(a, 'absd', 8, t, 110, ETH_BY + 80, 0.18, i => ETH_X0 + S * (i + 1) + 20);
      rbcTick(a, t);
    }
  };
}

/* ───────── 3) العمودي البسيط (بطانة الأمعاء) ───────── */
function ethCol(){
  const B = ethBase(ETH_X0, ETH_X1, ETH_BY), W = 48, H = 170, cells = [], nucs = [];
  for (let x = ETH_X0; x < ETH_X1 - 2; x += W){
    cells.push(`<rect x="${x + 2}" y="${ETH_BY - H}" width="${W - 4}" height="${H - 3}" rx="8" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.cellL}" stroke-width="1.6"/>`);
    nucs.push(`<ellipse cx="${x + W / 2}" cy="${ETH_BY - 40}" rx="11" ry="19" fill="${ETH_PAL.nuc}"/>`);
  }
  const body = `${ethLumen('تجويف الأمعاء (غذاء مهضوم)')}
    ${B.ct}${B.bm}
    ${part('tColS', cells.join(''))}${part('eNuc', nucs.join(''))}
    <g>${ethDots('fd', 12, ETH_PAL.food, 5, 'sq')}</g>
    ${ethCap('الظهاري العمودي البسيط', 'طبقة واحدة من خلايا طويلة، نواتها قرب القاعدة — الإفراز والامتصاص')}`;
  return {
    body, fnParts: ['tColS'],
    parts: [
      { id: 'tColS', anchor: [ETH_X1 - 30, ETH_BY - 120], label: [866, 230], side: 'R' },
      { id: 'eNuc', anchor: [ETH_X0 + W * 1.5, ETH_BY - 40], label: [134, 330], side: 'L' },
      { id: 'basem', anchor: [ETH_X1 - 30, ETH_BY], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [ETH_X0 + 30, ETH_BY + 83], label: [134, 480], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiTypes', label: 'أنواع النسيج الظهاري' }],
    tick(dt, t, a){ moveDots(a, 'fd', 12, t, 120, ETH_BY + 80, 0.16, i => ETH_X0 + W * (i + 1) + 10); rbcTick(a, t); }
  };
}

/* ───────── 4) العمودي المطبق الكاذب المهدب (القصبة الهوائية) ───────── */
function ethPse(){
  const B = ethBase(ETH_X0, ETH_X1, ETH_BY), W = 44, cells = [], nucs = [], cil = [];
  let k = 0;
  for (let x = ETH_X0; x < ETH_X1 - 2; x += W, k++){
    const tall = k % 3 !== 1, H = tall ? 190 : 95 + (k % 2) * 20;
    /* الطويلة تصل السطح وعليها أهداب، والقصيرة لا تصل؛ كلها على الغشاء القاعدي */
    cells.push(`<path d="M${x + 2},${ETH_BY - 3} L${x + 2},${ETH_BY - H + 10} Q${x + W / 2},${ETH_BY - H - 6} ${x + W - 2},${ETH_BY - H + 10} L${x + W - 2},${ETH_BY - 3}Z" fill="${tall ? ETH_PAL.cell : '#d99aa0'}" stroke="${ETH_PAL.cellL}" stroke-width="1.6"/>`);
    nucs.push(`<ellipse cx="${x + W / 2}" cy="${ETH_BY - (tall ? 70 + (k % 2) * 40 : 40)}" rx="10" ry="16" fill="${ETH_PAL.nuc}"/>`);
    if (tall) for (let c = 0; c < 4; c++) cil.push(`<line class="cl" data-x="${x + 8 + c * 9}" x1="${x + 8 + c * 9}" y1="${ETH_BY - H - 2}" x2="${x + 8 + c * 9}" y2="${ETH_BY - H - 26}" stroke="#fff3c8" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  const body = `${ethLumen('تجويف القصبة الهوائية')}
    <rect x="${ETH_X0}" y="${ETH_BY - 250}" width="${ETH_X1 - ETH_X0}" height="38" rx="12" fill="${ETH_PAL.mucus}" opacity=".35"/>
    <text class="cap sm" x="${ETH_X1 - 12}" y="${ETH_BY - 258}" text-anchor="end">مخاط وغبار</text>
    ${B.ct}${B.bm}
    ${part('tPse', cells.join(''))}${part('eNuc', nucs.join(''))}
    ${part('cilia', `<g id="cils">${cil.join('')}</g>`)}
    <g>${ethDots('dust', 9, ETH_PAL.dust, 5)}</g>
    ${ethCap('الظهاري العمودي المطبق الكاذب المهدب', 'طبقة واحدة مختلفة الأطوال تبدو كأنها طبقات — الأهداب تدفع المخاط والغبار')}`;
  return {
    body, fnParts: ['cilia', 'tPse'],
    parts: [
      { id: 'cilia', anchor: [ETH_X1 - 34, ETH_BY - 205], label: [866, 140], side: 'R' },
      { id: 'tPse', anchor: [ETH_X1 - 30, ETH_BY - 140], label: [866, 260], side: 'R' },
      { id: 'eNuc', anchor: [ETH_X0 + W * 1.5, ETH_BY - 40], label: [134, 350], side: 'L' },
      { id: 'basem', anchor: [ETH_X1 - 30, ETH_BY], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [ETH_X0 + 30, ETH_BY + 83], label: [134, 480], side: 'L' }
    ],
    tools: [{ id: 'tbl:epiTypes', label: 'أنواع النسيج الظهاري' }],
    tick(dt, t, a){
      const sp = focusOwner === 'cilia' ? 1.8 : 1;
      a.all('#cils .cl').forEach(e => { const x = +e.dataset.x, ang = Math.sin(t * 5 * sp - x * 0.05) * 0.5;
        e.setAttribute('x2', n2(x + Math.sin(ang) * 24)); e.setAttribute('y2', n2(+e.getAttribute('y1') - Math.cos(ang) * 24)); });
      /* الغبار يتحرك مع المخاط بعيداً عن الرئتين */
      a.all('.dust').forEach(e => { const i = +e.dataset.i, p = (t * 0.08 * sp + i / 9) % 1;
        e.setAttribute('cx', n2(ETH_X0 + 10 + p * (ETH_X1 - ETH_X0 - 20))); e.setAttribute('cy', n2(ETH_BY - 232 + Math.sin(i * 2) * 10)); e.setAttribute('opacity', n2(Math.sin(p * Math.PI))); });
      rbcTick(a, t);
    }
  };
}

/* ───────── 5) الحرشفي المطبق (الجلد، الفم، المريء) ───────── */
function ethStr(){
  const B = ethBase(ETH_X0, ETH_X1, ETH_BY), rows = [], nucs = [];
  /* من القاعدة إلى السطح: مكعبة ← متعددة الأوجه ← مسطحة */
  const LAY = [[52, 34, 'basal'], [80, 30], [86, 28], [100, 24], [140, 15], [160, 12], [180, 10]];
  let y = ETH_BY - 3;
  LAY.forEach(([w, h, tag], r) => {
    y -= h;
    const off = r % 2 ? w / 2 : 0;
    for (let x = ETH_X0 - off; x < ETH_X1; x += w){
      const xa = Math.max(ETH_X0, x), xb = Math.min(ETH_X1, x + w);
      if (xb - xa < 10) continue;
      rows.push(`<rect class="${tag === 'basal' ? 'bas' : ''}" x="${n2(xa + 1.5)}" y="${n2(y + 1)}" width="${n2(xb - xa - 3)}" height="${h - 2}" rx="${Math.min(8, h / 2.5)}" fill="${r === 0 ? '#d98a92' : r < 4 ? ETH_PAL.cell : '#f2d0d2'}" stroke="${ETH_PAL.cellL}" stroke-width="1.3"/>`);
      if (xb - xa > 24) nucs.push(`<ellipse cx="${n2((xa + xb) / 2)}" cy="${n2(y + h / 2)}" rx="${n2(Math.min(9, w * 0.12) + (r > 3 ? 6 : 0))}" ry="${n2(Math.max(2.5, h * 0.3))}" fill="${ETH_PAL.nuc}" opacity="${r > 4 ? 0.55 : 0.95}"/>`);
    }
  });
  const topY = y;
  const flakes = [0, 1, 2].map(i => `<rect class="flake" data-i="${i}" width="120" height="9" rx="4" fill="#f2d0d2" stroke="${ETH_PAL.cellL}" stroke-width="1" opacity="0"/>`).join('');
  const body = `${ethLumen('السطح (معرّض للاحتكاك)')}
    ${B.ct}${B.bm}
    ${part('tSqStr', rows.join(''))}${part('eNuc', nucs.join(''))}
    ${flakes}
    ${ethCap('الظهاري الحرشفي المطبق', 'عدة طبقات — الخلايا القاعدية تنقسم، والسطحية تتسطح وتتساقط')}`;
  let fl = 0, fi = -1;
  return {
    body, fnParts: ['tSqStr'],
    parts: [
      { id: 'tSqStr', anchor: [ETH_X1 - 60, topY + 30], label: [866, 220], side: 'R' },
      { id: 'eNuc', anchor: [ETH_X0 + 50, ETH_BY - 20], label: [134, 360], side: 'L' },
      { id: 'basem', anchor: [ETH_X1 - 30, ETH_BY], label: [866, 400], side: 'R' },
      { id: 'connBelow', anchor: [ETH_X0 + 30, ETH_BY + 83], label: [134, 480], side: 'L' }
    ],
    tools: [{ id: 'info:basem', label: 'الغشاء القاعدي' }, { id: 'tbl:simpStrat', label: 'البسيط × المطبق' }],
    tick(dt, t, a){
      /* خلايا قاعدية تنقسم (تومض) */
      fl -= dt; const bs = a.all('.bas');
      if (fl <= 0 && bs.length){ if (fi >= 0 && bs[fi]) bs[fi].setAttribute('fill', '#d98a92'); fi = Math.floor(Math.random() * bs.length); bs[fi].setAttribute('fill', '#ffd98a'); fl = 0.6; }
      /* الخلايا السطحية تتساقط */
      a.all('.flake').forEach(e => { const i = +e.dataset.i, p = (t * 0.18 + i / 3) % 1;
        e.setAttribute('x', n2(ETH_X0 + 80 + i * 220 + p * 40)); e.setAttribute('y', n2(topY - 6 - p * 120));
        e.setAttribute('transform', `rotate(${n2(p * -14)} ${n2(ETH_X0 + 140 + i * 220)} ${n2(topY - p * 120)})`); e.setAttribute('opacity', n2((1 - p) * 0.9)); });
      rbcTick(a, t);
    }
  };
}

/* ───────── 6) قارن: البسيط × المطبق ───────── */
function ethCmp(){
  const BY = 430, L0 = 120, L1 = 470, R0 = 530, R1 = 880;
  const simp = [], sn = []; for (let x = L0; x < L1 - 2; x += 58){ simp.push(`<rect x="${x + 2}" y="${BY - 58}" width="54" height="55" rx="6" fill="${ETH_PAL.cell}" stroke="${ETH_PAL.cellL}" stroke-width="1.6"/>`); sn.push(`<circle cx="${x + 29}" cy="${BY - 30}" r="12" fill="${ETH_PAL.nuc}"/>`); }
  const strat = []; let y = BY - 3;
  [[52, 32], [80, 28], [100, 24], [140, 15], [170, 11]].forEach(([w, h], r) => { y -= h; const off = r % 2 ? w / 2 : 0;
    for (let x = R0 - off; x < R1; x += w){ const xa = Math.max(R0, x), xb = Math.min(R1, x + w); if (xb - xa < 10) continue;
      strat.push(`<rect x="${n2(xa + 1.5)}" y="${n2(y + 1)}" width="${n2(xb - xa - 3)}" height="${h - 2}" rx="${Math.min(8, h / 2.5)}" fill="${r === 0 ? '#d98a92' : r < 3 ? ETH_PAL.cell : '#f2d0d2'}" stroke="${ETH_PAL.cellL}" stroke-width="1.3"/>`); } });
  const bm = (a, b) => `<rect class="dHi" x="${a}" y="${BY - 3}" width="${b - a}" height="8" rx="4" fill="${ETH_PAL.bm}"/>`;
  const ct = (a, b) => `<rect x="${a}" y="${BY + 6}" width="${b - a}" height="70" rx="10" fill="${ETH_PAL.ct}"/>`;
  const body = `${ct(L0, L1)}${ct(R0, R1)}
    ${part('basem', bm(L0, L1) + bm(R0, R1))}
    ${part('tCubS', simp.join('') + sn.join(''))}
    ${part('tSqStr', strat.join(''))}
    <text class="cap" x="${(L0 + L1) / 2}" y="${BY + 112}" text-anchor="middle">بسيط: طبقة واحدة</text>
    <text class="cap sm" x="${(L0 + L1) / 2}" y="${BY + 138}" text-anchor="middle">كل خلاياه على الغشاء القاعدي</text>
    <text class="cap" x="${(R0 + R1) / 2}" y="${BY + 112}" text-anchor="middle">مطبق: عدة طبقات</text>
    <text class="cap sm" x="${(R0 + R1) / 2}" y="${BY + 138}" text-anchor="middle">الطبقة القاعدية فقط على الغشاء القاعدي</text>`;
  let opened = false;
  return {
    body, fnParts: ['basem'],
    parts: [
      { id: 'tCubS', anchor: [L0 + 30, BY - 50], label: [134, 250], side: 'L' },
      { id: 'tSqStr', anchor: [R1 - 40, y + 8], label: [866, 250], side: 'R' },
      { id: 'basem', anchor: [L1 - 20, BY], label: [500, 560], side: 'C' }
    ],
    tools: [{ id: 'tbl:simpStrat', label: 'جدول الفروقات' }, { id: 'tbl:epiTypes', label: 'أنواع النسيج الظهاري' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'epith' && SEL.ethv === 'ecmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.simpStrat); }, 700); } },
    tick(dt, t, a){ a.all('.dHi').forEach((e, i) => e.style.filter = `drop-shadow(0 0 ${n2(3 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4 + i)))}px #ffd166)`); }
  };
}
