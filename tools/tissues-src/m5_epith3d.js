
/* ══════════════════════════════════════════════════════════════════════════
   9.5 · مجسّمات النسيج الظهاري: كتلة نسيج على غشاء قاعدي وتحته نسيج ضام
         بوعاء شعري؛ كل نوع بشكل خلاياه ووظيفته المتحركة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, ellipsoid, superEll, tube, place, merge, srng } = G3;
const CELL = '#e8b4b8', CELL2 = '#d98a92', CELLT = '#f2d0d2', NUC = '#7565c2';
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.25, rows: 6, cols: 10 });
const ball = ellipsoid({ r: 1, rows: 5, cols: 8 });
const cube = superEll({ h: [1, 1, 1], e: 0.4, rows: 4, cols: 6 });
const dots = (list, r, mesh) => merge(list.map(p => place(mesh || ball, { at: p ? p : [0, -60, 0], s: p ? (p.s || r) : 0.0001 })));
const X = 3.0, Z = 1.1;

/* الغشاء القاعدي + النسيج الضام تحته بوعاء شعري وكريات دم تجري */
function base(B, o){
  o = o || {};
  const x0 = o.x0 === undefined ? -X : o.x0, x1 = o.x1 === undefined ? X : o.x1, cx = (x0 + x1) / 2, w = x1 - x0;
  B.add(place(box(w, 0.06, 2 * Z + 0.1, 0.2), { at: [cx, 0, 0] }), { part: 'basem', color: '#e9d29a', rim: 0.7, rimColor: '#fff3c8' });
  if (o.noCT) return null;
  B.add(place(box(w, 0.95, 2 * Z + 0.1, 0.15), { at: [cx, -0.52, 0] }), { part: 'connBelow', color: '#4a3442', alpha: 0.55, rim: 0.6, rimColor: '#c9a0b4', pat: 1, patColor: '#7a5a6a', patK: 18, shell: { size: 4 } });
  B.add(tube({ pts: [[x0 + 0.15, -0.55, 0.2], [x1 - 0.15, -0.55, 0.2]], r: 0.16, sides: 14 }), { part: 'connBelow', color: '#c0392b', alpha: 0.6, rim: 0.8, rimColor: '#ffb3a8', shell: { size: 0.6 } });
  const rbc = t => Array.from({ length: 8 }, (_, i) => [x0 + 0.3 + (((i / 8) + t * 0.12) % 1) * (w - 0.6), -0.55, 0.2]);
  const r = B.add(dots(rbc(0), 0.08), { color: '#ff7a6a', rim: 0.6, rimColor: '#ffd0c8', pop: false, center: [0, 0, 0] });
  return t => B.update(r, dots(rbc(t), 0.08));
}
/* شبكة خلايا على الغشاء القاعدي */
function grid(nx, nz, fn){ const out = []; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) out.push(fn(-X + (i + 0.5) * 2 * X / nx, -Z + (j + 0.5) * 2 * Z / nz, i, j)); return out; }
const labelsCommon = (B, nucAt) => {
  B.label('basem', [X - 0.2, 0.03, Z], [0, 0, 1]);
  B.label('connBelow', [-X + 0.3, -0.7, Z], [0, -0.3, 1]);
  if (nucAt) B.label('eNuc', nucAt, [0, 0, 1]);
};

/* ═════ 1) الحرشفي البسيط ═════ */
function sqModel(B){
  const rb = base(B);
  const nx = 6, nz = 3, w = 2 * X / nx, d = 2 * Z / nz;
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.97, 0.16, d * 0.96, 0.35), { at: [x, 0.11, z] }))), { part: 'tSqS', color: CELL, rim: 0.7, rimColor: '#fff0f0' });
  B.add(merge(grid(nx, nz, (x, z) => place(ellipsoid({ r: [0.2, 0.05, 0.14], rows: 5, cols: 10 }), { at: [x, 0.2, z] }))), { part: 'eNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  const gas = t => { const a = [], b = [];
    for (let i = 0; i < 12; i++){ const p = (t * 0.22 + i / 12) % 1; a.push(Object.assign([-2.5 + i * 0.45, 1.9 - p * 2.45, Math.sin(i) * 0.6], { s: 0.07 * Math.sin(p * Math.PI) + 0.001 })); }
    for (let i = 0; i < 9; i++){ const p = (t * 0.2 + i / 9) % 1; b.push(Object.assign([-2.3 + i * 0.55, -0.55 + p * 2.45, -0.3 + Math.cos(i) * 0.5], { s: 0.07 * Math.sin(p * Math.PI) + 0.001 })); }
    return [a, b]; };
  const G = gas(0);
  const oO = B.add(dots(G[0], 0.07), { color: '#9fe9ff', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  const cO = B.add(dots(G[1], 0.07), { color: '#b8c2cc', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('tSqS', [X - 0.5, 0.18, Z * 0.7], [0, 1, 0.5]);
  labelsCommon(B, [-X + w * 1.5, 0.22, -Z + d * 2.5]);
  B.caption([0, 2.3, 0], () => ['هواء الحويصلة الهوائية', 'O₂ ينتشر للدم · CO₂ ينتشر للهواء']);
  return { dist: 8.4, yaw: 0.35, pitch: 0.45, target: [0, 0.4, 0], live2d: true,
    anim(t){ const g = gas(t); B.update(oO, dots(g[0], 0.07)); B.update(cO, dots(g[1], 0.07)); if (rb) rb(t); } };
}

/* ═════ 2) المكعبي البسيط ═════ */
function cubModel(B){
  const rb = base(B), nx = 9, nz = 3, w = 2 * X / nx, d = 2 * Z / nz, H = 0.62;
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.96, H, d * 0.95, 0.3), { at: [x, H / 2 + 0.03, z] }))), { part: 'tCubS', color: CELL, rim: 0.7, rimColor: '#fff0f0' });
  /* النوى تظهر على الوجه الأمامي للصف الأمامي (كمقطع) */
  B.add(merge(grid(nx, nz, (x, z, i, j) => j === nz - 1 ? place(ellipsoid({ r: [0.13, 0.13, 0.03], rows: 8, cols: 10 }), { at: [x, H / 2 + 0.03, z + d * 0.48] }) : null).filter(Boolean)), { part: 'eNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  const mv = t => { const a = [], b = [];
    for (let i = 0; i < 9; i++){ const p = (t * 0.2 + i / 9) % 1; a.push(Object.assign([-X + (i + 0.5) * w, 0.4 + p * 1.6, Z * 0.6], { s: 0.07 * Math.sin(p * Math.PI) + 0.001 })); }
    for (let i = 0; i < 9; i++){ const p = (t * 0.18 + i / 9) % 1; b.push(Object.assign([-X + (i + 0.9) * w, 2.0 - p * 2.55, -Z * 0.3], { s: 0.06 * Math.sin(p * Math.PI) + 0.001 })); }
    return [a, b]; };
  const M = mv(0);
  const sO = B.add(dots(M[0], 0.07), { color: '#f7d774', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  const aO = B.add(dots(M[1], 0.06), { color: '#9fe9ff', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('tCubS', [X - 0.35, H, Z * 0.7], [0, 1, 0.5]);
  labelsCommon(B, [-X + w * 1.5, H / 2 + 0.03, -Z + d * 2.5 + d * 0.5]);
  B.caption([0, 2.3, 0], () => ['تجويف نبيب الكلية', 'الأصفر: إفراز · الأزرق: امتصاص']);
  return { dist: 8.4, yaw: 0.35, pitch: 0.42, target: [0, 0.5, 0], live2d: true,
    anim(t){ const m = mv(t); B.update(sO, dots(m[0], 0.07)); B.update(aO, dots(m[1], 0.06)); if (rb) rb(t); } };
}

/* ═════ 3) العمودي البسيط ═════ */
function colModel(B){
  const rb = base(B), nx = 13, nz = 3, w = 2 * X / nx, d = 2 * Z / nz, H = 1.6;
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.94, H, d * 0.93, 0.3), { at: [x, H / 2 + 0.03, z] }))), { part: 'tColS', color: CELL, rim: 0.7, rimColor: '#fff0f0' });
  B.add(merge(grid(nx, nz, (x, z, i, j) => j === nz - 1 ? place(ellipsoid({ r: [0.1, 0.18, 0.03], rows: 8, cols: 10 }), { at: [x, 0.38, z + d * 0.47] }) : null).filter(Boolean)), { part: 'eNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  const fd = t => Array.from({ length: 13 }, (_, i) => { const p = (t * 0.16 + i / 13) % 1; return Object.assign([-X + (i + 0.7) * w, 2.6 - p * 3.15, Z * 0.55], { s: 0.065 * Math.sin(p * Math.PI) + 0.001 }); });
  const fO = B.add(dots(fd(0), 0.065, cube), { color: '#ffb347', rim: 0.8, rimColor: '#fff1d6', pop: false, center: [0, 0, 0] });
  B.label('tColS', [X - 0.25, H * 0.8, Z * 0.7], [0, 0.3, 1]);
  labelsCommon(B, [-X + w * 1.5, 0.38, -Z + d * 2.5 + d * 0.5]);
  B.caption([0, 2.9, 0], () => ['تجويف الأمعاء', 'امتصاص الغذاء المهضوم']);
  return { dist: 8.8, yaw: 0.35, pitch: 0.35, target: [0, 0.8, 0], live2d: true,
    anim(t){ B.update(fO, dots(fd(t), 0.065, cube)); if (rb) rb(t); } };
}

/* ═════ 4) العمودي المطبق الكاذب المهدب ═════ */
function pseModel(B){
  const rb = base(B), nx = 14, nz = 3, w = 2 * X / nx, d = 2 * Z / nz, H = 1.8;
  const tall = (i, j) => (i + j) % 3 !== 1;
  const cells = [], nucs = [], tops = [];
  grid(nx, nz, (x, z, i, j) => {
    const h = tall(i, j) ? H : 0.85 + ((i * 7 + j) % 3) * 0.15;
    cells.push(place(box(w * 0.94, h, d * 0.93, 0.3), { at: [x, h / 2 + 0.03, z] }));
    if (j === nz - 1) nucs.push(place(ellipsoid({ r: [0.09, 0.16, 0.03], rows: 8, cols: 10 }), { at: [x, tall(i, j) ? 0.55 + ((i + j) % 2) * 0.45 : 0.32, z + d * 0.47] }));
    if (tall(i, j)) tops.push([x, H + 0.05, z]);
  });
  B.add(merge(cells), { part: 'tPse', color: CELL, rim: 0.7, rimColor: '#fff0f0' });
  B.add(merge(nucs), { part: 'eNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  /* الأهداب: تتحرك بموجة منتظمة */
  const cil = [];
  tops.forEach(([x, y, z]) => { for (let k = 0; k < 4; k++) cil.push([x - w * 0.3 + k * w * 0.2, y, z + (k % 2 ? 0.08 : -0.08)]); });
  const ciliaMesh = t => merge(cil.map(([x, y, z]) => { const a = Math.sin(t * 5 - x * 1.2) * 0.5;
    return tube({ pts: [[x, y, z], [x + Math.sin(a) * 0.12, y + Math.cos(a) * 0.12, z], [x + Math.sin(a) * 0.26, y + Math.cos(a * 1.2) * 0.22, z]], r: 0.012, sides: 4, caps: false }); }));
  const cO = B.add(ciliaMesh(0), { part: 'cilia', color: '#fff3c8', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, H, 0] });
  B.add(place(box(2 * X, 0.28, 2 * Z, 0.2), { at: [0, H + 0.42, 0] }), { color: '#cfe6b8', alpha: 0.18, rim: 0.5, rimColor: '#efffd8', shell: { size: 5 }, pop: false });
  const dust = t => Array.from({ length: 10 }, (_, i) => { const p = (t * 0.08 + i / 10) % 1; return Object.assign([-X + 0.1 + p * (2 * X - 0.2), H + 0.42, -Z * 0.6 + (i % 3) * 0.6], { s: 0.08 * Math.sin(p * Math.PI) + 0.001 }); });
  const dO = B.add(dots(dust(0), 0.08), { color: '#8a7a6a', rim: 0.5, rimColor: '#d8c8b8', pop: false, center: [0, 0, 0] });
  B.label('cilia', [tops[tops.length - 1][0], H + 0.2, tops[tops.length - 1][2]], [0, 1, 0.5]);
  B.label('tPse', [X - 0.2, H * 0.7, Z * 0.7], [0, 0.3, 1]);
  labelsCommon(B, [-X + w * 1.5, 1.0, -Z + d * 2.5 + d * 0.5]);
  B.caption([0, H + 1.0, 0], () => ['تجويف القصبة الهوائية', 'الأهداب تدفع المخاط والغبار']);
  return { dist: 8.6, yaw: 0.35, pitch: 0.38, target: [0, 0.9, 0], live2d: true,
    anim(t){ const sp = focusOwner === 'cilia' ? 1.8 : 1; B.update(cO, ciliaMesh(t * sp)); B.update(dO, dots(dust(t * sp), 0.08)); if (rb) rb(t); } };
}

/* ═════ 5) الحرشفي المطبق ═════ */
function strModel(B, o){
  o = o || {};
  const x0 = o.x0 === undefined ? -X : o.x0, x1 = o.x1 === undefined ? X : o.x1, W = x1 - x0;
  const rb = base(B, { x0, x1, noCT: o.noCT });
  const LAY = [[0.4, 0.34], [0.55, 0.28], [0.62, 0.24], [0.8, 0.18], [1.05, 0.11], [1.3, 0.08]];
  const cells = [], basal = [], nucs = []; let y = 0.03;
  LAY.forEach(([cw, h], r) => {
    const nx = Math.max(2, Math.round(W / cw)), w = W / nx, nz = Math.max(2, Math.round(2 * Z / cw)), d = 2 * Z / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++){
      const at = [x0 + (i + 0.5) * w + (r % 2 ? w * 0.25 : 0) * (i < nx - 1 ? 1 : 0), y + h / 2, -Z + (j + 0.5) * d];
      (r === 0 ? basal : cells).push(place(box(w * 0.95, h * 0.94, d * 0.95, 0.35), { at }));
      if (r < 5 && j === nz - 1) nucs.push(place(ellipsoid({ r: [Math.min(0.1, w * 0.18) + r * 0.02, Math.max(0.03, h * 0.28), 0.025], rows: 5, cols: 8 }), { at: [at[0], at[1], at[2] + d * 0.48] }));
    }
    y += h;
  });
  const bO = B.add(merge(basal), { part: 'tSqStr', color: CELL2, rim: 0.7, rimColor: '#fff0f0' });
  B.add(merge(cells), { part: 'tSqStr', color: CELL, rim: 0.6, rimColor: '#fff0f0' });
  B.add(merge(nucs), { part: 'eNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  const topY = y;
  /* خلايا سطحية تتساقط، وخلية قاعدية تنقسم */
  const fl = t => [0, 1, 2].map(i => { const p = (t * 0.18 + i / 3) % 1; return place(box(1.1, 0.07, 0.8, 0.4), { at: [x0 + W * (0.2 + i * 0.3) + p * 0.3, topY + 0.05 + p * 1.2, -0.3 + i * 0.3], rot: [0, 0, -p * 0.4], s: 1 - p * 0.3 }); });
  const fO = B.add(merge(fl(0)), { color: CELLT, alpha: 0.85, rim: 0.6, rimColor: '#fff0f0', pop: false, center: [0, 0, 0] });
  const flash = B.add(place(box(0.42, 0.35, 0.42, 0.35), { at: [0, -60, 0] }), { color: '#ffd98a', alpha: 0.8, rim: 1.2, rimColor: '#fff6d0', pop: false, center: [0, 0, 0] });
  if (!o.noLabels){
    B.label('tSqStr', [x1 - 0.3, topY * 0.7, Z * 0.95], [0, 0.3, 1]);
    labelsCommon(B, [x0 + 0.3, 0.2, Z]);
    B.caption([0, topY + 1.6, 0], () => ['السطح (معرّض للاحتكاك)', 'القاعدية تنقسم · السطحية تتسطح وتتساقط']);
  }
  let ft = 0, last = 0;
  const anim = t => { const dt = Math.max(0, t - last); last = t; ft -= dt;
    B.update(fO, merge(fl(t)));
    if (ft <= 0){ ft = 0.6; const i = Math.floor(Math.random() * 12), j = Math.floor(Math.random() * 4);
      B.update(flash, place(box(0.42, 0.35, 0.42, 0.35), { at: [x0 + 0.2 + (i % Math.round(W / 0.4)) * 0.4, 0.2, -Z + 0.27 + j * 0.55] })); }
    flash.alpha = 0.5 + 0.3 * Math.sin(t * 9); if (rb) rb(t); };
  void bO;
  return { dist: 8.4, yaw: 0.35, pitch: 0.4, target: [0, 0.6, 0], live2d: true, anim };
}

/* ═════ 6) قارن: البسيط × المطبق ═════ */
function cmpModel(B){
  /* بسيط (مكعبي) يسار */
  const L0 = -3.2, L1 = -0.4, nx = 5, nz = 3, w = (L1 - L0) / nx, d = 2 * Z / nz;
  base(B, { x0: L0, x1: L1, noCT: true });
  const cells = [], nuc = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++){ const x = L0 + (i + 0.5) * w, z = -Z + (j + 0.5) * d;
    cells.push(place(box(w * 0.95, 0.55, d * 0.95, 0.3), { at: [x, 0.31, z] })); if (j === nz - 1) nuc.push(place(ellipsoid({ r: [0.12, 0.12, 0.03], rows: 6, cols: 8 }), { at: [x, 0.31, z + d * 0.48] })); }
  B.add(merge(cells), { part: 'tCubS', color: CELL, rim: 0.7, rimColor: '#fff0f0' });
  B.add(merge(nuc), { part: 'tCubS', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  /* مطبق (حرشفي) يمين */
  const S = strModel(B, { x0: 0.4, x1: 3.2, noCT: true, noLabels: true });
  B.label('tCubS', [L0 + 0.3, 0.6, Z], [0, 0.3, 1]);
  B.label('tSqStr', [3.0, 1.0, Z], [0, 0.3, 1]);
  B.label('basem', [L1 - 0.2, 0.03, Z], [0, 0, 1]);
  B.caption([(L0 + L1) / 2, -0.6, Z], () => ['بسيط: طبقة واحدة', 'كل خلاياه على الغشاء القاعدي']);
  B.caption([1.8, -0.6, Z], () => ['مطبق: عدة طبقات', 'القاعدية فقط على الغشاء القاعدي']);
  return { dist: 9.2, yaw: 0.2, pitch: 0.38, target: [0, 0.4, 0], live2d: true, compactK: 1.2, anim: S.anim };
}

Object.assign(G3.models, { eth_esq: sqModel, eth_ecub: cubModel, eth_ecol: colModel, eth_epse: pseModel, eth_estr: B => strModel(B), eth_ecmp: cmpModel });
})();
