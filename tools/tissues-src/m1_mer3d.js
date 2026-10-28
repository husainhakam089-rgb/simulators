
/* ══════════════════════════════════════════════════════════════════════════
   9.1 · مجسّمات الأنسجة المرستيمية: مواقعها في النبات، قمة الجذر بمراحلها،
         الخلية المرستيمية، والمقارنة مع الخلية البالغة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, sub, mul, norm, rot3, ellipsoid, superEll, capsule, tube, place, merge, spline, srng, computeNormals, mk } = G3;
const { blobDisp } = G3.parts;

/* سطح دوراني حول y من مقطع [نصف قطر، ارتفاع] */
function lathe(prof, cols){
  const m = mk(), R = prof.length, C = cols || 32;
  for (let i = 0; i < R; i++){
    const [r, y] = prof[i];
    for (let j = 0; j < C; j++){
      const a = j / C * 6.2832, p = [r * Math.cos(a), y, r * Math.sin(a)];
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0);
    }
  }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C; j++){
    const a = i * C + j, b = i * C + (j + 1) % C, c = a + C, d = b + C;
    m.i.push(a, b, c, b, d, c);
  }
  return computeNormals(m);
}
/* حلقة (أسطوانة مجوّفة قصيرة) */
const ring = (r0, r1, h, cols) => lathe([[r0, -h / 2], [r1, -h / 2], [r1, h / 2], [r0, h / 2], [r0, -h / 2]], cols || 40);
const disc = (r, h, cols) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], cols || 40);
/* خلية: صندوق بزوايا مدوّرة */
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.22, rows: 6, cols: 8 });
/* سهم صغير: عمود + رأس مخروطي، يشير إلى +y */
const arrowMesh = L => merge([place(capsule({ r: 0.022, len: L * 0.7, rows: 3, cols: 8 }), { at: [0, -L * 0.15, 0] }),
  lathe([[0.065, L * 0.18], [0.001, L * 0.5]], 10)]);
const GOLD = '#ffd166';
/* نبض توهّج الأجزاء المرستيمية (بالحافة لأن التوهّج محجوز لاختيار الجزء) */
const pulse = (objs, t, base, amp) => objs.forEach(o => { o.rim = base + amp * (0.5 + 0.5 * Math.sin(t * 2.6)); });

/* ═════════════ 1) مواقع المرستيمات في النبات ═════════════ */
function locModel(B){
  const GY = -0.35;
  /* التربة: لوح شفاف حتى تظهر الجذور */
  B.add(place(superEll({ h: [3.4, 1.0, 1.4], e: 0.12, rows: 10, cols: 24 }), { at: [0.0, GY - 1.0, 0] }),
    { color: '#7a5634', alpha: 0.14, rim: 0.25, rimColor: '#c8a774', pat: 2, patColor: '#3a2716', patK: 6, shell: { size: 9 }, pop: false });
  B.add(place(superEll({ h: [3.4, 0.012, 1.4], e: 0.12, rows: 4, cols: 24 }), { at: [0.0, GY, 0] }),
    { color: '#a88a5c', alpha: 0.35, rim: 0.3, rimColor: '#e8d2a4', shell: { size: 9.1 }, pop: false });
  /* نبات ذو فلقتين */
  const SX = 0.15, TOP = 2.55;
  const stemPts = spline([[SX, GY, 0], [SX + 0.03, 0.6, 0.02], [SX - 0.02, 1.6, -0.02], [SX, TOP, 0]], 6, false);
  B.add(tube({ pts: stemPts, r: u => 0.075 - u * 0.03, sides: 12 }), { color: '#7fb55a', rim: 0.5, rimColor: '#e3ffd0', pat: 1, patColor: '#5b8f3e', patK: 30, pop: false });
  const leafM = (L, W) => ellipsoid({ r: [L / 2, 0.018, W / 2], rows: 8, cols: 18, warp: p => [p[0], p[1] + p[0] * p[0] * 0.18 - Math.abs(p[2]) * 0.2, p[2]] });
  const leaves = [], axBuds = [];
  [[0.55, 0.0, 0.62], [1.25, 1.57, 0.52], [1.9, 0.0, 0.42]].forEach(([y, a, L]) => {
    [0, Math.PI].forEach(s => {
      const ang = a + s, dir = [Math.cos(ang), 0, Math.sin(ang)];
      leaves.push(place(leafM(L, L * 0.42), { R: rot3(1.05, -ang, 0.3), at: add([SX, y + 0.08, 0], mul(dir, L / 2 + 0.05)) }));
      axBuds.push(place(ellipsoid({ r: [0.035, 0.06, 0.035], rows: 6, cols: 10 }), { at: add([SX, y + 0.07, 0], mul(dir, 0.09)) }));
    });
  });
  B.add(merge(leaves), { color: '#5fae4f', rim: 0.55, rimColor: '#dcffc8', pat: 3, patK: 9, pop: false });
  const bud = B.add(merge([place(ellipsoid({ r: [0.1, 0.17, 0.1], rows: 10, cols: 16 }), { at: [SX, TOP + 0.1, 0] })].concat(axBuds)),
    { part: 'apicalShoot', color: '#b5e38c', rim: 0.8, rimColor: GOLD });
  /* الجذور وقممها */
  const roots = [], tips = [];
  const rootTo = (pts, r) => { const sp = spline(pts, 5, false); roots.push(tube({ pts: sp, r: u => r * (1 - u * 0.6), sides: 8 }));
    const e = sp[sp.length - 1], d = norm(sub(e, sp[sp.length - 2])); tips.push(place(ellipsoid({ r: [r * 0.7, r * 1.6, r * 0.7], rows: 6, cols: 10 }), { at: add(e, mul(d, r * 0.6)), dir: d })); };
  rootTo([[SX, GY, 0], [SX + 0.05, -0.9, 0], [SX - 0.04, -1.5, 0.02], [SX, -2.05, 0]], 0.07);
  [[-0.6, 0.3, 0.6], [-0.85, -0.5, 0.55], [-1.2, 0.2, -0.6], [-1.45, -0.4, -0.45]].forEach(([y, dx, dz]) =>
    rootTo([[SX, y, 0], [SX + dx * 0.5, y - 0.12, dz * 0.5], [SX + dx, y - 0.35, dz]], 0.035));
  B.add(merge(roots), { color: '#d9c39b', rim: 0.45, rimColor: '#fff3d8', pop: false });
  const tipO = B.add(merge(tips), { part: 'apicalRoot', color: '#e6c48a', rim: 0.8, rimColor: GOLD });

  /* نبات عشبي (فلقة واحدة): سلاميات وعقد وفوق كل عقدة مرستيم بيني */
  const GX = -1.75, gNodes = [0.25, 0.9, 1.5, 2.05], GTOP = 2.45;
  B.add(tube({ pts: [[GX, GY, 0], [GX, GTOP, 0]], r: 0.055, sides: 12 }), { color: '#a9cf73', rim: 0.5, rimColor: '#f1ffd8', pat: 1, patColor: '#86ad55', patK: 50, pop: false });
  B.add(merge(gNodes.map(y => place(ellipsoid({ r: [0.075, 0.035, 0.075], rows: 6, cols: 14 }), { at: [GX, y, 0] }))), { color: '#7da55a', rim: 0.5, rimColor: '#e8f8d0', pop: false });
  const blades = gNodes.map((y, i) => { const s = i % 2 ? 1 : -1, a = i * 1.9;
    const pts = [[GX, y, 0], [GX + s * 0.25 * Math.cos(a), y + 0.45, 0.25 * Math.sin(a)], [GX + s * 0.55 * Math.cos(a), y + 0.7, 0.55 * Math.sin(a)]];
    return tube({ pts: spline(pts, 5, false), r: u => 0.03 * (1 - u * 0.85), sides: 5 }); });
  B.add(merge(blades), { color: '#6db65a', rim: 0.5, rimColor: '#dcffc8', pop: false });
  const inter = B.add(merge(gNodes.map(y => place(lathe([[0.062, 0], [0.068, 0.04], [0.068, 0.13], [0.062, 0.17]], 18), { at: [GX, y + 0.03, 0] }))),
    { part: 'intercal', color: '#f2c45a', rim: 0.8, rimColor: GOLD });

  /* مقطع عرضي مكبّر في ساق خشبية: الحلقات من الخارج للداخل */
  const CX = [1.75, 1.35, 0.1], R = 0.78, rotX = Math.PI / 2;
  const P = m => place(m, { R: rot3(rotX, 0, 0), at: CX });
  B.add(P(ring(R - 0.04, R, 0.16, 48)), { color: '#6b4a2c', rim: 0.5, rimColor: '#e0c08a', pop: false });
  const cork = B.add(P(ring(R - 0.1, R - 0.045, 0.2, 48)), { part: 'corkCamb', color: '#ffb35c', rim: 0.8, rimColor: GOLD });
  B.add(P(ring(0.52, R - 0.1, 0.15, 48)), { color: '#5e8d4f', rim: 0.4, rimColor: '#cfeec0', pat: 3, patK: 14, pop: false });
  B.add(P(ring(0.47, 0.52, 0.15, 48)), { color: '#9fc46d', rim: 0.4, rimColor: '#e6ffd0', pop: false });
  const vasc = B.add(P(ring(0.42, 0.47, 0.21, 48)), { part: 'vascCamb', color: '#ffd98a', rim: 0.8, rimColor: GOLD });
  B.add(P(ring(0.2, 0.42, 0.15, 48)), { color: '#d8b878', rim: 0.35, rimColor: '#fff0c8', pat: 1, patColor: '#8a6a3a', patK: 40, pop: false });
  B.add(P(disc(0.2, 0.15, 32)), { color: '#b9d6a0', rim: 0.35, rimColor: '#ffffff', pop: false });
  /* خط التكبير من الساق إلى المقطع */
  B.add(tube({ pts: [[SX + 0.08, 1.35, 0], add(CX, [-R * 0.9, 0, 0])], r: 0.008, sides: 4 }), { color: '#e9d9b0', alpha: 0.5, rim: 0.3, pop: false });

  /* أسهم اتجاه النمو */
  const AR = arrowMesh(0.42);
  const arrows = [
    { at: [SX, TOP + 0.55, 0], dir: [0, 1, 0] }, { at: [SX, -2.45, 0], dir: [0, -1, 0] }
  ].concat(gNodes.map(y => ({ at: [GX + 0.22, y + 0.12, 0], dir: [0, 1, 0], s: 0.6 })))
   .concat([0, 1, 2, 3].map(i => { const a = i * 1.5708 + 0.785, d = [Math.cos(a), Math.sin(a), 0]; return { at: add(CX, mul(d, R + 0.28)), dir: d, s: 0.7 }; }));
  const arrO = B.add(merge(arrows.map(a => place(AR, { dir: a.dir, at: a.at, s: a.s || 1 }))), { color: '#ffe08a', rim: 0.9, rimColor: '#fff5cc', pop: false, center: [0, 0, 0] });

  B.label('apicalShoot', [SX, TOP + 0.2, 0], [0, 1, 0.3]);
  B.label('apicalRoot', [SX, -2.12, 0], [0, -1, 0.3]);
  B.label('intercal', [GX, 1.62, 0.07], [0, 0, 1]);
  B.label('corkCamb', add(CX, [R * 0.66, R * 0.66, 0.1]), [0, 0, 1]);
  B.label('vascCamb', add(CX, [-0.45, -0.05, 0.1]), [0, 0, 1]);
  /* على الشاشة الضيقة تتزاحم العناوين؛ يكفي عنوان المقطع */
  B.caption([GX, GY - 0.25, 0.9], () => window.innerWidth < 600 ? [] : ['', 'نبات عشبي (فلقة واحدة)']);
  B.caption([SX, GY - 0.25, 1.1], () => window.innerWidth < 600 ? [] : ['', 'نبات ذو فلقتين']);
  B.caption(add(CX, [0, -R - 0.25, 0]), () => ['', 'مقطع عرضي في ساق خشبية (مكبّر)']);
  const mers = [bud, tipO, inter, cork, vasc];
  return {
    dist: 9.2, yaw: 0.25, pitch: 0.12, target: [0.05, 0.3, 0], live2d: true,
    anim(t){
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      mers.forEach(o => { o.rim = !f || o.part === f ? 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.6)) : 0.3; });
      const b = Math.abs(Math.sin(t * 3)) * 0.12;
      B.update(arrO, merge(arrows.map(a => place(AR, { dir: a.dir, at: add(a.at, mul(a.dir, b)), s: a.s || 1 }))));
    }
  };
}

/* ═════════════ 2) قمة الجذر: مقطع طولي ومراحل النمو ═════════════ */
/* المناطق على محور y (القمة للأسفل) */
const RZ = { cap: [-2.45, -2.0], div: [-2.0, -1.05], elong: [-1.05, 0.45], mat: [0.45, 2.55] };
const RR = 0.46, COLS = 7, CW = 2 * RR / COLS, SLAB = 0.26;
const colKind = c => c === 0 || c === COLS - 1 ? 'pd' : c >= 2 && c <= 4 ? 'pc' : 'gm';
function rootModel(B){
  const rnd = srng(9);
  const cellsOf = (y0, y1, rowH, fn) => { const out = []; for (let y = y0; y < y1 - 0.02; y += rowH(y)){ const h = Math.min(rowH(y), y1 - y);
      for (let c = 0; c < COLS; c++) out.push(fn(-RR + (c + 0.5) * CW, y + h / 2, h, c)); } return out; };
  /* منطقة الانقسام: خلايا صغيرة، الأعمدة حسب المرستيمات الأولية */
  const div = { pd: [], gm: [], pc: [], nuc: [], list: [] };
  cellsOf(RZ.div[0], RZ.div[1], () => CW, (x, y, h, c) => {
    const k = colKind(c);
    div[k].push(place(box(CW * 0.92, h * 0.92, SLAB), { at: [x, y, 0] }));
    div.nuc.push(place(ellipsoid({ r: CW * 0.26, rows: 5, cols: 8 }), { at: [x, y, SLAB * 0.32] }));
    div.list.push([x, y, h]);
  });
  const pdO = B.add(merge(div.pd), { part: 'protoderm', color: '#86c06a', rim: 0.6, rimColor: '#e6ffd0' });
  const gmO = B.add(merge(div.gm), { part: 'groundMer', color: '#5f9a64', rim: 0.6, rimColor: '#d6f5c4' });
  const pcO = B.add(merge(div.pc), { part: 'procamb', color: '#8c80c8', rim: 0.6, rimColor: '#e6e0ff' });
  B.add(merge(div.nuc), { color: '#6a5bb0', rim: 0.5, rimColor: '#d8d0ff', pop: false });
  /* غلاف منطقة الانقسام (شفاف) — يُلتقط من الجوانب أو من اسمه */
  B.add(place(lathe([[RR + 0.03, RZ.div[0]], [RR + 0.03, RZ.div[1]]], 36), { at: [0, 0, 0] }), { part: 'zoneDiv', color: '#ffd166', alpha: 0.12, rim: 0.9, rimColor: '#ffe7a8', shell: { size: 1.1 } });

  /* منطقة الاستطالة: الخلايا تطول (تُعاد بناءً مع الاستطالة) */
  const elongCells = k => { const out = [], nuc = []; let y = RZ.elong[0], h = CW * 1.15;
    while (y < RZ.elong[1] - 0.04){ const hh = Math.min(h, RZ.elong[1] - y), sh = hh * k, cy = RZ.elong[0] + (y - RZ.elong[0]) * k + sh / 2;
      for (let c = 0; c < COLS; c++){ const x = -RR + (c + 0.5) * CW;
        out.push(place(box(CW * 0.92, sh * 0.94, SLAB), { at: [x, cy, 0] }));
        nuc.push(place(ellipsoid({ r: CW * 0.2, rows: 5, cols: 8 }), { at: [x, cy + sh * 0.28, SLAB * 0.32] })); }
      y += hh; h *= 1.2; }
    return { cells: merge(out), nuc: merge(nuc) }; };
  const E0 = elongCells(1);
  const elO = B.add(E0.cells, { part: 'zoneElong', color: '#5d9a73', rim: 0.55, rimColor: '#d6f5e0', pat: 2, patColor: '#a9d8e8', patK: 9 });
  const elN = B.add(E0.nuc, { color: '#6a5bb0', rim: 0.5, rimColor: '#d8d0ff', pop: false, center: [0, 0, 0] });

  /* منطقة النضج: خلايا كبيرة متمايزة، ووسطها أوعية الخشب */
  const mat = [], matV = [];
  cellsOf(RZ.mat[0], RZ.mat[1], () => 0.3, (x, y, h, c) => {
    const k = colKind(c);
    if (k === 'pc'){ matV.push(place(box(CW * 0.92, h * 0.96, SLAB * 0.9, 0.5), { at: [x, y, 0] })); return; }
    mat.push(place(box(CW * 0.92, h * 0.92, SLAB), { at: [x, y, 0] }));
  });
  B.add(merge(mat), { part: 'zoneMat', color: '#4f8a58', rim: 0.5, rimColor: '#cfeec0', pat: 3, patK: 10 });
  const xyl = [-1, 1].map(s => { const pts = []; for (let y = RZ.mat[0]; y <= RZ.mat[1]; y += 0.05) pts.push([s * CW * 0.6 + Math.sin(y * 40) * 0.025, y, SLAB * 0.5]); return tube({ pts, r: 0.012, sides: 5 }); });
  B.add(merge(matV.concat(xyl)), { part: 'zoneMat', color: '#9a8fd0', rim: 0.6, rimColor: '#efeaff' });

  /* السطح الخارجي للجذر (شفاف) يعطي الشكل المجسّم خلف المقطع */
  const prof = [[0.001, RZ.cap[0]]]; for (let i = 1; i <= 8; i++){ const a = i / 8 * Math.PI / 2; prof.push([RR * Math.sin(a), RZ.cap[0] + (RZ.cap[1] - RZ.cap[0]) * (1 - Math.cos(a))]); }
  prof.push([RR, RZ.mat[1]]);
  B.add(lathe(prof, 36), { color: '#cfe8c0', alpha: 0.1, rim: 0.7, rimColor: '#f4ffe8', shell: { size: 2 }, pop: false });

  /* القلنسوة: كشتبان من الخلايا + خلايا تتآكل وتسقط */
  const cap = [];
  for (let r = 0; r < 4; r++){ const yy = RZ.cap[1] - 0.06 - r * 0.11, half = RR * Math.sqrt(1 - Math.pow((r + 0.3) / 4.3, 2)), n = 7 - r;
    for (let i = 0; i < n; i++) cap.push(place(ellipsoid({ r: [half / n + 0.02, 0.055, SLAB / 2], rows: 5, cols: 10 }), { at: [-half + 2 * half * (i + 0.5) / n, yy, 0] })); }
  B.add(merge(cap), { part: 'rootCap', color: '#c9a77a', rim: 0.6, rimColor: '#fff1cf' });
  const sl = B.add(merge([0, 1, 2].map(() => place(ellipsoid({ r: [0.06, 0.04, 0.06], rows: 5, cols: 8 }), { at: [0, -60, 0] }))), { part: 'rootCap', color: '#c9a77a', rim: 0.6, rimColor: '#fff1cf', pop: false, center: [0, 0, 0] });

  /* الشعيرات الجذرية حول الجذر في منطقة النضج */
  const hairs = []; for (let y = RZ.mat[0] + 0.12; y < RZ.mat[1] - 0.1; y += 0.13){
    for (let k = 0; k < 7; k++){ const a = k / 7 * 6.283 + y * 3.1, d = [Math.cos(a), 0, Math.sin(a)];
      if (d[2] > 0.35) continue;  /* لا تغطي المقطع من الأمام */
      hairs.push({ a: add([0, y, 0], mul(d, RR)), d, L: 0.35 + (RZ.mat[1] - y) * 0.22 + rnd() * 0.15, w: (rnd() - 0.5) * 0.2 }); } }
  const hairMesh = f => merge(hairs.map(h => { const L = Math.max(0.02, h.L * f); return tube({ pts: [h.a, add(add(h.a, mul(h.d, L * 0.5)), [0, h.w * L, 0]), add(add(h.a, mul(h.d, L)), [0, h.w * L * 1.4, 0])], r: 0.011, sides: 4, caps: false }); }));
  const hairO = B.add(hairMesh(0.35), { part: 'rootHair', color: '#eef6d4', rim: 0.7, rimColor: '#ffffff', pop: false, center: [0, 1.4, 0] });

  /* خلية تنقسم الآن (المرحلة الأولى) + جدار جديد */
  const flash = B.add(place(box(CW, CW, SLAB * 1.06), { at: [0, -60, 0] }), { color: '#ffd98a', alpha: 0.75, rim: 1.2, rimColor: '#fff6d0', pop: false, center: [0, 0, 0] });
  /* سهم: الخلايا الجديدة تُدفع للخلف */
  const AR = arrowMesh(0.5);
  const push = B.add(place(AR, { at: [RR + 0.35, RZ.div[1] - 0.2, 0] }), { color: '#ffe08a', rim: 0.9, rimColor: '#fff5cc', pop: false, center: [0, 0, 0] });

  B.label('rootHair', add(hairs[2].a, mul(hairs[2].d, 0.3)), [0, 0, 1]);
  B.label('zoneMat', [-RR + CW * 1.5, 1.6, SLAB / 2], [0, 0, 1]);
  B.label('zoneElong', [-RR + CW * 1.5, -0.3, SLAB / 2], [0, 0, 1]);
  B.label('zoneDiv', [RR + 0.03, -1.5, 0.05], [1, 0, 0.4]);
  B.label('protoderm', [-RR + CW * 0.5, -1.25, SLAB / 2], [0, 0, 1]);
  B.label('groundMer', [-RR + CW * 1.5, -1.7, SLAB / 2], [0, 0, 1]);
  B.label('procamb', [0, -1.45, SLAB / 2], [0, 0, 1]);
  B.label('rootCap', [0.15, RZ.cap[0] + 0.15, SLAB / 2], [0, -0.4, 1]);
  B.caption([0, RZ.cap[0] - 0.35, 0], () => { const s = MER_STAGES[STG.idx]; return s ? ['المرحلة ' + (STG.idx + 1) + ': ' + s.n] : []; });

  let lastF = -1, lastH = -1, fi = -1, fT = 0, lastT = 0;
  return {
    dist: 7.2, yaw: 0.35, pitch: 0.15, target: [0, 0, 0], live2d: true, noSpin: true, maxDist: 14,
    camGoal: () => MER_STAGES[STG.idx] && MER_STAGES[STG.idx].cam,
    anim(t){
      const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      const st = STG.idx, k = STG.k, f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      /* المرحلة 1: خلية تومض وتنقسم في منطقة الانقسام */
      fT -= dt;
      if (st === 0 && fT <= 0){ fi = Math.floor(rnd() * div.list.length); fT = 0.5; const [x, y, h] = div.list[fi];
        B.update(flash, place(merge([box(CW * 0.94, h * 0.94, SLAB * 1.08), place(box(CW * 0.9, 0.012, SLAB * 1.1, 0.5), { at: [0, 0, 0] })]), { at: [x, y, 0] })); }
      if (st !== 0 && fi >= 0){ fi = -1; B.update(flash, place(box(CW, CW, SLAB), { at: [0, -60, 0] })); }
      flash.alpha = 0.45 + 0.35 * Math.sin(t * 9);
      push.hide = st !== 0;
      if (!push.hide) B.update(push, place(AR, { at: [RR + 0.35, RZ.div[1] - 0.25 + (t * 0.5 % 1) * 0.5, 0] }));
      /* المرحلة 2: الاستطالة */
      const ek = st === 1 ? 1 + 0.07 * Math.sin(t * 2.4) : 1;
      if (Math.abs(ek - lastF) > 0.004){ lastF = ek; const E = elongCells(ek); B.update(elO, E.cells); B.update(elN, E.nuc); }
      /* المرحلة 3: الشعيرات تنمو */
      const hk = st === 2 ? Math.min(1, 0.25 + k * 1.4) : st === 1 ? 0.25 : 0.4;
      if (Math.abs(hk - lastH) > 0.01){ lastH = hk; B.update(hairO, hairMesh(hk)); }
      /* القلنسوة: خلايا خارجية تتآكل وتسقط */
      B.update(sl, merge([0, 1, 2].map(i => { const p = (t * 0.3 + i / 3) % 1; return place(ellipsoid({ r: [0.06, 0.04, 0.06], rows: 5, cols: 8 }), { at: [(i - 1) * 0.25 * p, RZ.cap[0] - 0.02 - p * 0.45, 0.05], s: Math.sin(p * Math.PI) + 0.001 }); })));
      [pdO, gmO, pcO].forEach(o => { o.rim = st === 0 && (!f || f === o.part) ? 0.6 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.6; });
    }
  };
}

/* ═════════════ 3) الخلية المرستيمية (تنقسم) ═════════════ */
function merCellFig(B, at, s, opt){
  opt = opt || {};
  const P = (m, o) => place(m, Object.assign({}, o, { at: add(at, mul(o.at || [0, 0, 0], s)), s: (o.s || 1) * s }));
  B.add(P(box(2, 2, 2, 0.28), {}), { part: 'merWall', color: '#d6f5c4', alpha: 0.2, rim: 1.2, rimColor: '#efffe6', shell: { size: 1.6 * s, inner: 'merCyto' } });
  B.add(P(box(1.9, 1.9, 1.9, 0.28), {}), { part: 'merCyto', color: '#4f8f58', alpha: 0.42, rim: 0.6, rimColor: '#cfeec0', pat: 2, patColor: '#bfe8b0', patK: 14, shell: { size: 1.5 * s } });
  const vac = B.add(merge([[-0.62, 0.55, 0.4], [0.6, 0.62, -0.35], [0.55, -0.6, 0.5], [-0.58, -0.55, -0.45]].map(p => P(ellipsoid({ r: 0.09, rows: 8, cols: 12 }), { at: p }))),
    { part: 'merVac', color: '#bfe6f3', rim: 0.9, rimColor: '#ffffff' });
  const nr = 0.52;
  const nucA = B.add(P(ellipsoid({ r: nr, rows: 16, cols: 24, disp: blobDisp(3, 0.03) }), {}), { part: 'merNuc', color: '#7565c2', rim: 0.7, rimColor: '#d8d0ff', pat: 2, patColor: '#4b3d93', patK: 7, center: at });
  const nucB = B.add(P(ellipsoid({ r: nr, rows: 16, cols: 24, disp: blobDisp(4, 0.03) }), { at: [0, -60, 0] }), { part: 'merNuc', color: '#7565c2', rim: 0.7, rimColor: '#d8d0ff', pat: 2, patColor: '#4b3d93', patK: 7, center: at });
  const nuo = B.add(P(ellipsoid({ r: 0.16, rows: 10, cols: 14 }), { at: [0.15, 0.12, 0.3] }), { part: 'merNuc', color: '#3a2a70', rim: 0.4, rimColor: '#b8a8ff', pop: false });
  const wall = B.add(P(box(1.92, 0.03, 1.92, 0.4), { at: [0, -60, 0] }), { color: '#d6f5c4', alpha: 0.7, rim: 1, rimColor: '#ffffff', pop: false, center: at });
  /* خلايا مجاورة متراصّة (بلا مسافات بينية) */
  if (opt.neighbours){
    const nb = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++){ if (!i && !j) continue; if (opt.noRight && i > 0) continue;
      nb.push(P(box(1.98, 1.98, 1.98, 0.28), { at: [i * 2.02, j * 2.02, 0] })); }
    B.add(merge(nb), { color: '#3f6b48', alpha: 0.13, rim: 0.7, rimColor: '#9fd0a2', shell: { size: 4 * s }, pop: false });
  }
  B.label('merWall', add(at, mul([0.95, 0.75, 0.95], s)), [1, 0.4, 0.6]);
  B.label('merNuc', add(at, mul([0.3, 0.35, nr * 0.85], s)), [0.3, 0.3, 1]);
  B.label('merCyto', add(at, mul([-0.7, -0.15, 0.9], s)), [0, 0, 1]);
  B.label('merVac', add(at, mul([-0.62, 0.55, 0.49], s)), [0, 0.3, 1]);
  /* حركة الانقسام: النواة تستطيل وتنقسم ثم يظهر جدار جديد في الوسط */
  return {
    vac,
    divide(c){
      const sp = c < 0.45 ? 0 : c < 0.75 ? (c - 0.45) / 0.3 : c < 0.92 ? 1 : 1 - (c - 0.92) / 0.08;
      const off = nr * 0.85 * sp, k = 1 - 0.3 * sp;
      B.update(nucA, P(ellipsoid({ r: nr, rows: 16, cols: 24, disp: blobDisp(3, 0.03) }), { at: [0, off, 0], s: k }));
      B.update(nucB, P(ellipsoid({ r: nr, rows: 16, cols: 24, disp: blobDisp(4, 0.03) }), { at: sp > 0.02 ? [0, -off, 0] : [0, -60, 0], s: k }));
      nuo.hide = sp > 0.3;
      B.update(wall, P(box(1.92, 0.03, 1.92, 0.4), { at: c > 0.72 && c < 0.96 ? [0, 0, 0] : [0, -60, 0] }));
    }
  };
}
function cellModel(B){
  const M = merCellFig(B, [0, 0, 0], 1, { neighbours: true });
  B.caption([0, -1.45, 1.1], () => ['', 'خلية مرستيمية: تنقسم باستمرار']);
  return { dist: 7.4, yaw: 0.55, pitch: 0.35, live2d: true, anim(t){ M.divide((t % 9) / 9); } };
}

/* ═════════════ 4) قارن: المرستيمية × البالغة ═════════════ */
function cmpModel(B){
  const MX = -1.75, M = merCellFig(B, [MX, 0, 0], 0.62, { neighbours: true, noRight: true });
  const BX = 1.45, bw = 1.25, bh = 1.6, bd = 1.1;
  B.add(place(box(bw * 2, bh * 2, bd * 2, 0.3), { at: [BX, 0, 0] }), { color: '#d6f5c4', alpha: 0.18, rim: 1.1, rimColor: '#efffe6', shell: { size: 3, inner: 'matVac' } });
  const vacO = B.add(place(box(bw * 1.7, bh * 1.75, bd * 1.6, 0.3), { at: [BX, 0, 0] }), { part: 'matVac', color: '#9fd3e6', alpha: 0.55, rim: 1, rimColor: '#ffffff', shell: { size: 2.6 } });
  B.add(place(ellipsoid({ r: 0.2, rows: 12, cols: 18 }), { at: [BX - bw * 0.82, bh * 0.55, bd * 0.75] }), { color: '#7565c2', rim: 0.6, rimColor: '#d8d0ff', pop: false });
  /* مسافات بينية عند زوايا الخلايا المتجاورة */
  const gaps = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => gaps.push(place(ellipsoid({ r: [0.09, 0.09, bd * 0.9], rows: 4, cols: 4 }), { at: [BX + i * (bw + 0.05), j * (bh + 0.05), 0] })));
  const gapO = B.add(merge(gaps), { part: 'interSp', color: '#14261d', rim: 1.2, rimColor: GOLD, center: [BX, 0, 0] });
  const nb = [[1, 0], [0, 1], [0, -1]].map(([i, j]) => place(box(bw * 2, bh * 2, bd * 2, 0.3), { at: [BX + i * (bw * 2 + 0.1), j * (bh * 2 + 0.1), 0] }));
  B.add(merge(nb), { color: '#3f6b48', alpha: 0.1, rim: 0.6, rimColor: '#9fd0a2', shell: { size: 6 }, pop: false });
  B.label('matVac', [BX + 0.3, 0.4, bd * 0.8], [0, 0, 1]);
  B.label('interSp', [BX + bw + 0.05, -bh - 0.05, bd * 0.9], [0.4, -0.4, 1]);
  B.caption([MX, -1.05, 0.8], () => ['الخلية المرستيمية']);
  B.caption([BX, -bh - 0.45, 0.9], () => ['الخلية البالغة (المستديمة)']);
  const diffs = [M.vac, vacO, gapO];
  return {
    dist: 9.4, yaw: 0.2, pitch: 0.2, target: [-0.1, 0, 0], live2d: true, maxDist: 18,
    anim(t){
      M.divide((t % 9) / 9);
      diffs.forEach((o, i) => { o.rim = 0.8 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 0.8)); });
    }
  };
}

Object.assign(G3.models, { mer_loc: locModel, mer_root: rootModel, mer_cell: cellModel, mer_cmp: cmpModel });
})();
