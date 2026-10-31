
/* ══════════════════════════════════════════════════════════════════════════
   9.2 · مجسّمات الأنسجة البسيطة: مقطع ساق عشبية، البرنكيمي (جريان
         البلاستيدات)، الكولنكيمي (ينحني بمرونة)، السكلرنكيمي (مراحل التلجنن)،
         والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, sub, mul, norm, rot3, ellipsoid, superEll, capsule, tube, place, merge, spline, srng, computeNormals, mk } = G3;
const { blobDisp } = G3.parts;
const GOLD = '#ffd166';

/* سطح دوراني حول y من مقطع [نصف قطر، ارتفاع] (بين زاويتين اختيارياً) */
function lathe(prof, cols, a0, a1){
  const m = mk(), R = prof.length, C = cols || 32, full = a0 === undefined;
  const A0 = full ? 0 : a0, A1 = full ? 6.2832 : a1, CC = full ? C : C + 1;
  for (let i = 0; i < R; i++){
    const [r, y] = prof[i];
    for (let j = 0; j < CC; j++){
      const a = A0 + (A1 - A0) * j / C, p = [r * Math.cos(a), y, r * Math.sin(a)];
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0);
    }
  }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C; j++){
    const a = i * CC + j, b = i * CC + (full ? (j + 1) % C : j + 1), c = a + CC, d = b + CC;
    m.i.push(a, b, c, b, d, c);
  }
  return computeNormals(m);
}
/* قشرة سميكة مقطوع منها إسفين (حتى يظهر سمك الجدار والتجويف) */
function shellCut(outer, inner, a0, a1, C){
  C = C || 28;
  const o = lathe(outer, C, a0, a1), inn = lathe(inner, C, a0, a1);
  for (let k = 0; k < inn.i.length; k += 3){ const t = inn.i[k]; inn.i[k] = inn.i[k + 1]; inn.i[k + 1] = t; }
  for (let k = 0; k < inn.n.length; k++) inn.n[k] = -inn.n[k];
  const face = (a, flip) => { const m = mk(), N = outer.length;
    for (let i = 0; i < N; i++){ [outer[i], inner[i]].forEach(([r, y]) => { m.p.push(r * Math.cos(a), y, r * Math.sin(a)); m.l.push(r * Math.cos(a), y, r * Math.sin(a)); m.n.push(0, 0, 0); }); }
    for (let i = 0; i < N - 1; i++){ const o0 = 2 * i, i0 = o0 + 1, o1 = o0 + 2, i1 = o0 + 3;
      if (flip) m.i.push(o0, i0, o1, i0, i1, o1); else m.i.push(o0, o1, i0, i0, o1, i1); }
    return computeNormals(m); };
  return merge([o, inn, face(a0, true), face(a1, false)]);
}
const sphereProf = (r, n, k) => { const out = []; for (let i = 0; i <= n; i++){ const ph = -Math.PI / 2 + Math.PI * i / n; out.push([Math.max(0.0005, r * Math.cos(ph)), r * Math.sin(ph) * (k || 1)]); } return out; };
const spindleProf = (R, H, n) => { const out = []; for (let i = 0; i <= n; i++){ const u = i / n; out.push([Math.max(0.0005, R * Math.sin(Math.PI * u)), -H / 2 + H * u]); } return out; };
/* موشور سداسي (خلية كولنكيمية) */
const hexPrism = (r, h) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], 6);
/* الإسفين المقطوع يواجه الكاميرا (+z) */
const CUT0 = Math.PI / 2 + 0.75, CUT1 = Math.PI / 2 - 0.75 + 2 * Math.PI;

/* ═════════════ 1) مقطع ساق عشبية: أين تقع الأنسجة البسيطة ═════════════ */
function stemModel(B){
  const H = 1.5, R = 2.2;
  const cyl = (r0, r1, h, col, o) => B.add(lathe([[r0, -h / 2], [r1, -h / 2], [r1, h / 2], [r0, h / 2], [r0, -h / 2]], 56), Object.assign({ color: col, rim: 0.4, rimColor: '#ffffff' }, o));
  const epi = cyl(R - 0.06, R, H, '#bfe08a', { part: 'epidermis', rim: 0.7, rimColor: '#f2ffd8' });
  const coll = cyl(R - 0.3, R - 0.06, H - 0.02, '#cfe0c4', { part: 'tCortex', pat: 2, patColor: '#8fbf86', patK: 22, rimColor: '#ffe6f2' });
  const cort = cyl(1.66, R - 0.3, H - 0.04, '#78b46d', { part: 'tCortex', pat: 2, patColor: '#3f6b3a', patK: 12, rimColor: '#cfeec0' });
  const pith = B.add(lathe([[0.001, -H / 2 + 0.03], [0.98, -H / 2 + 0.03], [0.98, H / 2 - 0.03], [0.001, H / 2 - 0.03]], 48),
    { part: 'tPith', color: '#9fcf8c', pat: 2, patColor: '#5f8f52', patK: 9, rim: 0.4, rimColor: '#e6ffd8' });
  const rays = B.add(lathe([[0.98, -H / 2 + 0.03], [1.66, -H / 2 + 0.03], [1.66, H / 2 - 0.03], [0.98, H / 2 - 0.03], [0.98, -H / 2 + 0.03]], 56),
    { part: 'tRays', color: '#8fc47c', pat: 2, patColor: '#4f7f48', patK: 14, rim: 0.4, rimColor: '#dff7cf' });
  /* حزم وعائية: خشب للداخل ولحاء للخارج وغطاء ألياف */
  const NB = 8, xy = [], ph = [], fc = [];
  for (let i = 0; i < NB; i++){
    const a = i / NB * 6.283, d = [Math.cos(a), 0, Math.sin(a)], R3 = rot3(0, -a, 0);
    xy.push(place(superEll({ h: [0.17, H / 2 + 0.01, 0.13], e: 0.5, rows: 6, cols: 14 }), { R: R3, at: mul(d, 1.12) }));
    ph.push(place(superEll({ h: [0.12, H / 2 + 0.015, 0.17], e: 0.5, rows: 6, cols: 14 }), { R: R3, at: mul(d, 1.38) }));
    fc.push(place(superEll({ h: [0.07, H / 2 + 0.02, 0.2], e: 0.45, rows: 6, cols: 14, }), { R: R3, at: mul(d, 1.57) }));
  }
  B.add(merge(xy.concat(ph, fc)), { part: 'vBundle', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8', pat: 3, patK: 10 });
  B.label('epidermis', [R * 0.7, H / 2, R * 0.7], [0.5, 0.5, 0.7]);
  B.label('tCortex', [0, H / 2, R - 0.35], [0, 1, 0.6]);
  B.label('tRays', [1.3 * Math.cos(0.4), H / 2 - 0.02, 1.3 * Math.sin(0.4)], [0, 1, 0.4]);
  B.label('tPith', [-0.35, H / 2 - 0.02, 0.4], [0, 1, 0.5]);
  B.label('vBundle', [1.12 * Math.cos(3.93), H / 2 + 0.01, 1.12 * Math.sin(3.93)], [0, 1, 0.2]);
  B.caption([0, -H / 2 - 0.45, R], () => ['', 'النسيج الأساس: القشرة واللب والأشعة اللبية']);
  const cyc = [[coll, cort], [rays], [pith]], ids = ['tCortex', 'tRays', 'tPith'];
  return {
    dist: 9.6, yaw: 0.2, pitch: 0.75, live2d: true,
    anim(t){
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      const on = f ? ids.indexOf(f) : Math.floor(t / 2.6) % 3;
      cyc.forEach((g, i) => g.forEach(o => { o.rim = i === on ? 0.6 + 1.1 * (0.5 + 0.5 * Math.sin(t * 4)) : 0.4; o.rimC = G3.hex(i === on ? GOLD : '#ffffff'); }));
    }
  };
}

/* ═════════════ 2) النسيج البرنكيمي: خلايا حية رقيقة الجدار بفجوات كبيرة ═════════════ */
function parModel(B){
  const rnd = srng(21), cells = [[0, 0, 0]];
  for (let i = 0; i < 6; i++){ const a = i / 6 * 6.283; cells.push([Math.cos(a) * 1.72, Math.sin(a) * 1.55, (i % 2 ? -0.35 : 0.35)]); }
  const walls = [], vacs = [], nucs = [], cyts = [], gaps = [];
  cells.forEach((c, k) => {
    const sh = ellipsoid({ r: [0.9, 0.82, 0.85], rows: 14, cols: 22, disp: blobDisp(40 + k, 0.06) });
    walls.push(place(sh, { at: c }));
    cyts.push(place(sh, { at: c, s: 0.96 }));
    vacs.push(place(ellipsoid({ r: [0.64, 0.58, 0.6], rows: 12, cols: 18, disp: blobDisp(60 + k, 0.05) }), { at: add(c, [0.05, 0.02, 0]) }));
    const na = 2.2 + k * 0.9; nucs.push(place(ellipsoid({ r: 0.17, rows: 10, cols: 14 }), { at: add(c, [Math.cos(na) * 0.66, Math.sin(na) * 0.6, 0.25]) }));
  });
  for (let i = 0; i < 6; i++){ const a = i / 6 * 6.283 + 0.5236; gaps.push(place(ellipsoid({ r: [0.13, 0.13, 0.5], rows: 4, cols: 4 }), { at: [Math.cos(a) * 1.0, Math.sin(a) * 0.9, 0] })); }
  B.add(merge(cyts), { color: '#5f9a5c', alpha: 0.35, rim: 0.5, rimColor: '#cfeec0', shell: { size: 1.4 }, pop: false });
  B.add(merge(walls), { part: 'parWall', color: '#e6ffd8', alpha: 0.12, rim: 1.2, rimColor: '#f0ffe8', shell: { size: 1.5, inner: 'matVac' } });
  B.add(merge(vacs), { part: 'matVac', color: '#bfe3ef', alpha: 0.5, rim: 0.9, rimColor: '#ffffff', shell: { size: 1.1 } });
  B.add(merge(nucs), { part: 'nucleus', color: '#7565c2', rim: 0.6, rimColor: '#d8d0ff', pat: 2, patColor: '#4b3d93', patK: 9 });
  const gapO = B.add(merge(gaps), { part: 'interSp', color: '#14261d', rim: 1.1, rimColor: GOLD });
  /* البلاستيدات الخضراء تدور حول الفجوة مع جريان السايتوبلازم */
  const chl = []; cells.forEach((c, k) => { for (let j = 0; j < 8; j++) chl.push({ c, a: j / 8 * 6.283 + rnd(), z: (rnd() - 0.5) * 0.9 }); });
  const chlMesh = t => merge(chl.map(p => { const a = p.a + t * 0.45; return place(ellipsoid({ r: [0.11, 0.06, 0.07], rows: 5, cols: 8 }),
    { at: add(p.c, [Math.cos(a) * 0.74, Math.sin(a) * 0.67, p.z * 0.6]), rot: [0, 0, a + 1.57] }); }));
  const chlO = B.add(chlMesh(0), { part: 'parChl', color: '#2f9a3e', rim: 0.7, rimColor: '#b6f0a0', pop: false, center: [0, 0, 0] });
  B.label('parWall', add(cells[1], [0.6, 0.55, 0.45]), [1, 0.5, 0.5]);
  B.label('matVac', [0.15, 0.1, 0.55], [0, 0, 1]);
  B.label('nucleus', add(cells[0], [Math.cos(2.2) * 0.66, Math.sin(2.2) * 0.6, 0.4]), [0, 0, 1]);
  B.label('parChl', add(cells[4], [-0.74, 0, 0.3]), [0, 0, 1]);
  B.label('interSp', [Math.cos(0.5236) * 1.0, Math.sin(0.5236) * 0.9, 0.5], [0, 0, 1]);
  let lastT = -1;
  return {
    dist: 8.2, yaw: 0.35, pitch: 0.3, live2d: true,
    anim(t){
      if (t - lastT > 0.03){ lastT = t; B.update(chlO, chlMesh(t * (focusOwner === 'parChl' ? 1.8 : 1))); }
      gapO.rim = 0.8 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.4));
    }
  };
}

/* ═════════════ 3) النسيج الكولنكيمي: خلايا مستطيلة متغلظة الزوايا تنحني بمرونة ═════════════ */
function colModel(B){
  const r = 0.42, h = 3.0, cells = [[0, 0]];
  for (let i = 0; i < 6; i++){ const a = i / 6 * 6.283 + Math.PI / 6; cells.push([Math.cos(a) * r * 1.74, Math.sin(a) * r * 1.74]); }
  const walls = [], prot = [], corners = [], nucs = [];
  cells.forEach(([x, z], k) => {
    walls.push(place(hexPrism(r, h), { at: [x, 0, z] }));
    prot.push(place(capsule({ r: r * 0.86, len: h - r * 1.8, rows: 6, cols: 20 }), { at: [x, 0, z] }));
    for (let j = 0; j < 6; j++){ const a = j / 6 * 6.283; corners.push(place(capsule({ r: 0.075 + (j * 7 + k) % 3 * 0.02, len: h - 0.14, rows: 3, cols: 8 }), { at: [x + Math.cos(a) * r * 0.97, 0, z + Math.sin(a) * r * 0.97] })); }
    /* نواة صغيرة على جانب الخلية (لا فجوة عصارية كبيرة) */
    nucs.push(place(ellipsoid({ r: [0.1, 0.16, 0.06], rows: 8, cols: 12 }), { at: [x + r * 0.5, (k % 3 - 1) * 0.6, z + r * 0.62] }));
  });
  B.add(merge(prot), { part: 'colProto', color: '#efe0b8', rim: 0.45, rimColor: '#fff6e0' });
  B.add(merge(walls), { part: 'tColl', color: '#5a3a28', alpha: 0.1, rim: 0.6, rimColor: '#c8a070', shell: { size: 1.6 } });
  const corO = B.add(merge(corners), { part: 'colCorner', color: '#3a2216', rim: 0.5, rimColor: '#a07850' });
  B.add(merge(nucs), { part: 'colProto', color: '#b8323a', rim: 0.5, rimColor: '#ffc0c0' });
  B.label('colCorner', [r * 0.97 + cells[1][0], h * 0.3, cells[1][1]], [1, 0, 0.4]);
  B.label('colProto', [cells[0][0], 0.6, cells[0][1] + r * 0.9], [0, 0, 1]);
  B.label('tColl', [cells[4][0] - r, h * 0.38, cells[4][1]], [-1, 0, 0.4]);
  B.caption([0, -h / 2 - 0.35, 0.8], () => ['', 'تنحني ولا تنكسر: دعامة مع مرونة']);
  let sh = 0;
  return {
    dist: 8.2, yaw: 0.5, pitch: 0.28, live2d: true,
    /* انحناء مرن: قصّ أفقي يزداد مع الارتفاع (مثل ساق عشبية في الهواء) */
    xf: () => [1, 0, 0, 0, sh, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    anim(t){ sh = Math.sin(t * 1.6) * (focusOwner === 'tColl' ? 0.32 : 0.2); corO.rim = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2.2)); }
  };
}

/* ═════════════ 4) النسيج السكلرنكيمي: ألياف + خلية حجرية، ومراحل التلجنن ═════════════ */
function sclModel(B){
  /* الألياف: خلايا مغزلية طويلة، المقطوعة منها يظهر جدارها الثخين وتجويفها الضيق */
  const FX = -1.7, fibers = [];
  [[-0.32, 0.2], [0.3, 0.0], [0, -0.35], [-0.6, -0.25], [0.6, -0.4]].forEach(([dx, dz], i) => {
    const Hf = 3.4 - (i % 2) * 0.4;
    fibers.push(place(i === 1 ? shellCut(spindleProf(0.22, Hf, 24), spindleProf(0.05, Hf - 0.3, 24), CUT0, CUT1, 18) : lathe(spindleProf(0.22, Hf, 24), 16), { at: [FX + dx, (i % 2) * 0.2, dz] }));
  });
  const fibO = B.add(merge(fibers), { part: 'sclFiber', color: '#c9a46a', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#9c7a46', patK: 40 });
  /* الخلية الحجرية الكبيرة (مقطوعة) */
  const SX = 1.2, R = 1.25;
  const wallMesh = rin => shellCut(sphereProf(R, 24), sphereProf(rin, 24), CUT0, CUT1, 30);
  const wall = B.add(place(wallMesh(0.3), { at: [SX, 0, 0] }), { part: 'sclWall', color: '#c9a46a', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#a8834e', patK: 26, center: [SX, 0, 0] });
  B.add(place(ellipsoid({ r: 1, rows: 14, cols: 20 }), { at: [SX, 0, 0], s: 0.28 }), { color: '#2a1d12', rim: 0.3, rimColor: '#7a5a34', center: [SX, 0, 0], pop: false });
  /* قنوات على وجهي القطع (جزء من الجدار) */
  const pitMesh = rin => merge([CUT0, CUT1].map(a => {
    const out = []; for (let i = 0; i < 7; i++){ const ph = -1.3 + i * 0.43, d = [Math.cos(ph) * Math.cos(a), Math.sin(ph), Math.cos(ph) * Math.sin(a)];
      out.push(tube({ pts: [add([SX, 0, 0], mul(d, rin)), add([SX, 0, 0], mul(d, R))], r: 0.035, sides: 5 })); }
    return merge(out); }));
  B.add(pitMesh(0.3), { color: '#3a2a18', rim: 0.5, rimColor: '#8a6a3a', pop: false, center: [SX, 0, 0] });
  /* خلايا صخرية صغيرة مجاورة */
  const small = [[SX + 1.4, -1.0, -0.6, 0.45], [SX - 0.6, -1.45, -0.4, 0.4], [SX + 1.3, 1.1, -0.5, 0.42]].map(([x, y, z, r]) => place(ellipsoid({ r, rows: 10, cols: 14, disp: blobDisp(x * 10 | 0, 0.08) }), { at: [x, y, z] }));
  const stoneO = B.add(merge(small), { part: 'sclStone', color: '#c9a46a', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#a8834e', patK: 30 });
  B.label('sclFiber', [FX + 0.3, 0.9, 0.2], [0, 0, 1]);
  B.label('sclWall', [SX + R * 0.7, R * 0.6, 0.1], [0.7, 0.6, 0.3]);
  B.label('sclStone', [SX + 1.4, -1.0, -0.15], [0.5, -0.3, 1]);
  B.caption([FX, -1.95, 0.6], () => ['', 'أ- ألياف']);
  B.caption([SX, -R - 0.45, 0.6], () => ['', 'ب- خلايا صخرية (حجرية)']);
  return {
    dist: 8.4, yaw: 0.45, pitch: 0.22, target: [0.4, 0, 0], live2d: true, maxDist: 16,
    anim(t){
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null, on = f || (Math.floor(t / 2.4) % 2 ? 'sclStone' : 'sclFiber');
      fibO.rim = on === 'sclFiber' ? 0.6 + 1 * (0.5 + 0.5 * Math.sin(t * 4)) : 0.6;
      stoneO.rim = on === 'sclStone' ? 0.6 + 1 * (0.5 + 0.5 * Math.sin(t * 4)) : 0.6;
    }
  };
}

/* ═════════════ 5) قارن: البرنكيمي × الكولنكيمي × السكلرنكيمي ═════════════ */
function cmpModel(B){
  const X = [-2.4, 0, 2.4];
  /* برنكيمي */
  const sh = ellipsoid({ r: [0.85, 0.8, 0.8], rows: 14, cols: 22, disp: blobDisp(81, 0.06) });
  B.add(place(sh, { at: [X[0], 0, 0] }), { part: 'tParen', color: '#e6ffd8', alpha: 0.14, rim: 1.2, rimColor: '#f0ffe8', shell: { size: 1.2 } });
  B.add(place(ellipsoid({ r: [0.6, 0.56, 0.55], rows: 12, cols: 18 }), { at: [X[0], 0, 0] }), { part: 'tParen', color: '#bfe3ef', alpha: 0.5, rim: 0.9, rimColor: '#ffffff', shell: { size: 1 } });
  B.add(place(ellipsoid({ r: 0.16, rows: 10, cols: 14 }), { at: [X[0] - 0.6, 0.35, 0.3] }), { part: 'tParen', color: '#7565c2', rim: 0.6, rimColor: '#d8d0ff' });
  B.add(merge([0, 1, 2, 3, 4].map(i => { const a = i * 1.25; return place(ellipsoid({ r: [0.1, 0.055, 0.06], rows: 5, cols: 8 }), { at: [X[0] + Math.cos(a) * 0.7, Math.sin(a) * 0.66, 0.2], rot: [0, 0, a + 1.57] }); })),
    { part: 'tParen', color: '#2f9a3e', rim: 0.6, rimColor: '#b6f0a0' });
  /* كولنكيمي */
  B.add(place(hexPrism(0.7, 1.9), { at: [X[1], 0, 0] }), { part: 'tColl', color: '#7fae78', alpha: 0.35, rim: 0.9, rimColor: '#ffe6f2', shell: { size: 1.3 } });
  const cor = B.add(merge([0, 1, 2, 3, 4, 5].map(j => { const a = j / 6 * 6.283; return place(capsule({ r: 0.11, len: 1.7, rows: 3, cols: 8 }), { at: [X[1] + Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68] }); })),
    { part: 'tColl', color: '#f2d9e6', rim: 0.8, rimColor: '#ffffff' });
  B.add(place(ellipsoid({ r: [0.16, 0.24, 0.16], rows: 8, cols: 12 }), { at: [X[1], 0, 0] }), { part: 'tColl', color: '#7565c2', rim: 0.6, rimColor: '#d8d0ff' });
  /* سكلرنكيمي (ميت: جدار ثخين وتجويف فارغ ونقر) */
  B.add(place(shellCut(sphereProf(0.85, 22), sphereProf(0.24, 22), CUT0, CUT1, 26), { at: [X[2], 0, 0] }), { part: 'tScler', color: '#c9a46a', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#a8834e', patK: 30 });
  const lum = B.add(place(ellipsoid({ r: 0.23, rows: 10, cols: 14 }), { at: [X[2], 0, 0] }), { part: 'tScler', color: '#2a1d12', rim: 0.6, rimColor: GOLD });
  B.label('tParen', [X[0], 0.82, 0.2], [0, 1, 0.3]);
  B.label('tColl', [X[1], 0.95, 0.68], [0, 1, 0.3]);
  B.label('tScler', [X[2] + 0.6, 0.6, 0.1], [0.5, 1, 0.3]);
  B.caption([X[0], -1.25, 0.5], () => ['البرنكيمي', 'حية · رقيقة الجدران']);
  B.caption([X[1], -1.4, 0.5], () => ['الكولنكيمي', 'حية · مغلظة بشكل غير منتظم']);
  B.caption([X[2], -1.25, 0.5], () => ['السكلرنكيمي', 'ميتة · مغلظة باللكنين']);
  return {
    dist: 10.2, yaw: 0.15, pitch: 0.25, live2d: true, maxDist: 18, compactK: 1.25,
    anim(t){ cor.rim = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.4)); lum.rim = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.4 + 1.5)); }
  };
}

Object.assign(G3.models, { sim_sloc: stemModel, sim_par: parModel, sim_col: colModel, sim_scl: sclModel, sim_scmp: cmpModel });
})();
