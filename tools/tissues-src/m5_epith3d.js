
/* ══════════════════════════════════════════════════════════════════════════
   9.5 · مجسّمات النسيج الظهاري (ملزمة ص26–36): كتلة نسيج على غشاء قاعدي
         وتحته نسيج ضام؛ كل نوع بشكل خلاياه ووظيفته المتحركة كما في الملزمة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { ellipsoid, superEll, tube, place, merge } = G3;
const CELL = '#e8b4b8', CELL2 = '#d98a92', CELLT = '#f2d0d2', NUC = '#7565c2';
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.25, rows: 6, cols: 10 });
const ball = ellipsoid({ r: 1, rows: 5, cols: 8 });
const dots = (list, r) => merge(list.map(p => place(ball, { at: p ? p : [0, -60, 0], s: p ? (p.s || r) : 0.0001 })));
const X = 3.0, Z = 1.1;
const C = { cell: { color: CELL, rim: 0.7, rimColor: '#fff0f0' }, cell2: { color: CELL2, rim: 0.7, rimColor: '#fff0f0' }, cellT: { color: CELLT, rim: 0.7, rimColor: '#fff0f0' },
  nuc: { color: NUC, rim: 0.5, rimColor: '#d8d0ff' } };
const fx = (o, part) => Object.assign({ part }, o);
const flow = (n, t, sp, f) => Array.from({ length: n }, (_, i) => { const p = (t * sp + i / n) % 1; return Object.assign(f(i, p), { s: 0.07 * Math.sin(p * Math.PI) + 0.001 }); });

/* الغشاء القاعدي + النسيج الضام تحته (بألياف) */
function base(B, o){
  o = o || {};
  const x0 = o.x0 === undefined ? -X : o.x0, x1 = o.x1 === undefined ? X : o.x1, cx = (x0 + x1) / 2, w = x1 - x0;
  B.add(place(box(w, 0.06, 2 * Z + 0.1, 0.2), { at: [cx, 0, 0] }), { part: 'basem', color: '#e9d29a', rim: 0.7, rimColor: '#fff3c8' });
  if (o.noCT) return;
  B.add(place(box(w, 0.8, 2 * Z + 0.1, 0.15), { at: [cx, -0.44, 0] }), { part: 'connBelow', color: '#5a3a4c', alpha: 0.6, rim: 0.6, rimColor: '#c9a0b4', pat: 1, patColor: '#8a6276', patK: 18, shell: { size: 4 } });
  B.add(merge([0, 1, 2].map(k => tube({ pts: Array.from({ length: 9 }, (_, i) => [x0 + 0.1 + i * (w - 0.2) / 8, -0.2 - k * 0.22 + Math.sin(i * 1.7 + k) * 0.05, Z + 0.06]), r: 0.018, sides: 4, caps: false }))),
    { part: 'connBelow', color: '#c9a0b4', rim: 0.5, rimColor: '#ffffff' });
}
function grid(nx, nz, fn, x0, x1){ x0 = x0 === undefined ? -X : x0; x1 = x1 === undefined ? X : x1; const out = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) out.push(fn(x0 + (i + 0.5) * (x1 - x0) / nx, -Z + (j + 0.5) * 2 * Z / nz, i, j)); return out.filter(Boolean); }
const common = (B, nucAt) => {
  B.label('basem', [X - 0.2, 0.03, Z], [0, 0, 1]);
  B.label('connBelow', [-X + 0.3, -0.6, Z], [0, -0.3, 1]);
  if (nucAt) B.label('eNuc', nucAt, [0, 0, 1]);
};
/* أهداب على قمم الخلايا تتحرك بموجة منتظمة */
function ciliaOn(B, tops, w, y){
  const cil = []; tops.forEach(([x, z]) => { for (let k = 0; k < 3; k++) cil.push([x - w * 0.25 + k * w * 0.25, y, z + (k % 2 ? 0.08 : -0.08)]); });
  const mesh = t => merge(cil.map(([x, yy, z]) => { const a = Math.sin(t * 5 - x * 1.2) * 0.5;
    return tube({ pts: [[x, yy, z], [x + Math.sin(a) * 0.12, yy + Math.cos(a) * 0.12, z], [x + Math.sin(a) * 0.26, yy + Math.cos(a * 1.2) * 0.22, z]], r: 0.012, sides: 4, caps: false }); }));
  const o = B.add(mesh(0), { part: 'cilia', color: '#fff3c8', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, y, 0] });
  return t => B.update(o, mesh(t * (focusOwner === 'cilia' ? 1.8 : 1)));
}
/* أجسام تصطدم بالسطح وترتد (الحماية) */
function bouncer(B, topY, x0, x1){
  const f = t => flow(10, t, 0.4, (i, p) => { const d = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
    return [x0 + 0.3 + ((i * 0.83) % (x1 - x0 - 0.6)) + (p > 0.5 ? (i % 3 - 1) * (p - 0.5) * 0.8 : 0), topY + 0.1 + d * 1.4, -Z * 0.6 + (i % 4) * 0.4]; });
  const o = B.add(dots(f(0), 0.07), { color: '#ff8a7a', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  return t => B.update(o, dots(f(t), 0.07));
}

/* ═════ 1) الحرشفي البسيط: الانتشار والترشيح ═════ */
function sqModel(B){
  base(B);
  const nx = 6, nz = 3, w = 2 * X / nx, d = 2 * Z / nz;
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.97, 0.16, d * 0.96, 0.35), { at: [x, 0.11, z] }))), fx(C.cell, 'cSquam'));
  B.add(merge(grid(nx, nz, (x, z) => place(ellipsoid({ r: [0.2, 0.05, 0.14], rows: 5, cols: 10 }), { at: [x, 0.2, z] }))), fx(C.nuc, 'eNuc'));
  const g = t => [flow(12, t, 0.22, (i, p) => [-2.5 + i * 0.45, 1.9 - p * 2.3, Math.sin(i) * 0.6]), flow(9, t, 0.2, (i, p) => [-2.3 + i * 0.55, -0.4 + p * 2.3, -0.3 + Math.cos(i) * 0.5])];
  const G = g(0), aO = B.add(dots(G[0], 0.07), { color: '#9fe9ff', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }),
    bO = B.add(dots(G[1], 0.07), { color: '#b8c2cc', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('cSquam', [X - 0.5, 0.18, Z * 0.7], [0, 1, 0.5]);
  common(B, [-X + w * 1.5, 0.22, -Z + d * 2.5]);
  B.caption([0, 2.3, 0], () => ['النسيج الظهاري الحرشفي البسيط', 'طبقة رقيقة: الانتشار والترشيح']);
  return { dist: 8.4, yaw: 0.35, pitch: 0.45, target: [0, 0.4, 0], live2d: true,
    anim(t){ const q = g(t); B.update(aO, dots(q[0], 0.07)); B.update(bO, dots(q[1], 0.07)); } };
}

/* ═════ 2) المكعبي البسيط: الإفراز والحماية والامتصاص ═════ */
function cubModel(B){
  base(B);
  const nx = 9, nz = 3, w = 2 * X / nx, d = 2 * Z / nz, H = 0.62;
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.96, H, d * 0.95, 0.3), { at: [x, H / 2 + 0.03, z] }))), fx(C.cell, 'cCube'));
  B.add(merge(grid(nx, nz, (x, z, i, j) => j === nz - 1 ? place(ellipsoid({ r: [0.13, 0.13, 0.03], rows: 8, cols: 10 }), { at: [x, H / 2 + 0.03, z + d * 0.48] }) : null)), fx(C.nuc, 'eNuc'));
  const m = t => [flow(9, t, 0.2, (i, p) => [-X + (i + 0.5) * w, 0.4 + p * 1.6, Z * 0.6]), flow(9, t, 0.18, (i, p) => [-X + (i + 0.9) * w, 2.0 - p * 1.4, -Z * 0.3])];
  const M = m(0), sO = B.add(dots(M[0], 0.07), { color: '#f7d774', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }),
    aO = B.add(dots(M[1], 0.07), { color: '#6fc3ff', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('cCube', [X - 0.35, H, Z * 0.7], [0, 1, 0.5]);
  common(B, [-X + w * 1.5, H / 2 + 0.03, -Z + d * 2.5 + d * 0.5]);
  B.caption([0, 2.3, 0], () => ['يبطن نبيبات الكلية والغدد اللعابية', 'الأصفر: إفراز · الأزرق: امتصاص']);
  return { dist: 8.4, yaw: 0.35, pitch: 0.42, target: [0, 0.5, 0], live2d: true,
    anim(t){ const q = m(t); B.update(sO, dots(q[0], 0.07)); B.update(aO, dots(q[1], 0.07)); } };
}

/* ═════ 3) العمودي البسيط (قد يكون مهدباً): الإفراز والامتصاص ═════ */
function colModel(B){
  base(B);
  const nx = 13, nz = 3, w = 2 * X / nx, d = 2 * Z / nz, H = 1.6;
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.94, H, d * 0.93, 0.3), { at: [x, H / 2 + 0.03, z] }))), fx(C.cell, 'cColumn'));
  B.add(merge(grid(nx, nz, (x, z, i, j) => j === nz - 1 ? place(ellipsoid({ r: [0.1, 0.18, 0.03], rows: 8, cols: 10 }), { at: [x, 0.38, z + d * 0.47] }) : null)), fx(C.nuc, 'eNuc'));
  const cil = ciliaOn(B, grid(nx, nz, (x, z) => [x, z]), w, H + 0.05);
  const m = t => [flow(13, t, 0.16, (i, p) => [-X + (i + 0.7) * w, 2.6 - p * 1.0, Z * 0.55]), flow(9, t, 0.18, (i, p) => [-X + (i + 0.4) * w * 1.4, H + 0.2 + p * 1.1, -Z * 0.3])];
  const M = m(0), aO = B.add(dots(M[0], 0.065), { color: '#6fc3ff', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }),
    sO = B.add(dots(M[1], 0.065), { color: '#f7d774', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('cColumn', [X - 0.25, H * 0.7, Z * 0.7], [0, 0.3, 1]);
  B.label('cilia', [X - 0.3, H + 0.2, -Z + d * 0.5], [0, 1, 0.5]);
  common(B, [-X + w * 1.5, 0.38, -Z + d * 2.5 + d * 0.5]);
  B.caption([0, 3.0, 0], () => ['يبطن الأمعاء وبعض الغدد', 'الأصفر: إفراز · الأزرق: امتصاص']);
  return { dist: 8.8, yaw: 0.35, pitch: 0.35, target: [0, 0.8, 0], live2d: true,
    anim(t){ cil(t); const q = m(t); B.update(aO, dots(q[0], 0.065)); B.update(sO, dots(q[1], 0.065)); } };
}

/* ═════ 4) العمودي (المطبق الكاذب): أنويته بمستويات مختلفة · الحماية والإفراز ═════ */
function pseModel(B){
  base(B);
  const nx = 14, nz = 3, w = 2 * X / nx, d = 2 * Z / nz, H = 1.8;
  const tall = (i, j) => (i + j) % 3 !== 1;
  const cells = [], nucs = [], tops = [];
  grid(nx, nz, (x, z, i, j) => {
    const h = tall(i, j) ? H : 0.55 + ((i * 7 + j) % 3) * 0.12;
    cells.push(place(box(w * 0.94, h, d * 0.93, 0.3), { at: [x, h / 2 + 0.03, z] }));
    if (j === nz - 1) nucs.push(place(ellipsoid({ r: [0.09, 0.14, 0.03], rows: 8, cols: 10 }), { at: [x, tall(i, j) ? 0.7 + ((i + j) % 2) * 0.45 : 0.28, z + d * 0.47] }));
    if (tall(i, j)) tops.push([x, z]);
  });
  B.add(merge(cells), fx(C.cell, 'cColumn'));
  B.add(merge(nucs), fx(C.nuc, 'eNuc'));
  const cil = ciliaOn(B, tops, w, H + 0.05);
  const f = t => flow(10, t, 0.08, (i, p) => [-X + 0.1 + p * (2 * X - 0.2), H + 0.4, -Z * 0.6 + (i % 3) * 0.6]);
  const mO = B.add(dots(f(0), 0.08), { color: '#cfe6b8', rim: 0.6, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('cilia', [tops[tops.length - 1][0], H + 0.2, tops[tops.length - 1][1]], [0, 1, 0.5]);
  B.label('cColumn', [X - 0.2, H * 0.7, Z * 0.7], [0, 0.3, 1]);
  common(B, [-X + w * 1.5, 1.15, -Z + d * 2.5 + d * 0.5]);
  B.caption([0, H + 1.1, 0], () => ['يبطن الرغامى والقنوات الكبيرة للغدد اللعابية', 'كل الخلايا على الغشاء القاعدي والأنوية بمستويات مختلفة']);
  return { dist: 8.6, yaw: 0.35, pitch: 0.38, target: [0, 0.9, 0], live2d: true,
    anim(t){ cil(t); B.update(mO, dots(f(t * (focusOwner === 'cilia' ? 1.8 : 1)), 0.08)); } };
}

/* ═════ النسيج المطبق: طبقات {h, n, part, c, shape, nuc} من الأسفل إلى الأعلى ═════ */
function layered(B, L, o){
  o = o || {};
  const x0 = o.x0 === undefined ? -X : o.x0, x1 = o.x1 === undefined ? X : o.x1, W = x1 - x0;
  base(B, { x0, x1, noCT: o.noCT });
  const byPart = {}; let y = 0.03;
  L.forEach((r, k) => {
    const nx = r.n, w = W / nx, nz = Math.max(2, Math.round(r.n * 2 * Z / W)), d = 2 * Z / nz, h = r.h;
    const cells = [], nucs = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++){
      const sh = k % 2 && i < nx - 1 ? w * 0.25 : 0, at = [x0 + (i + 0.5) * w + sh, y + h / 2, -Z + (j + 0.5) * d];
      if (r.shape === 'dome'){ cells.push(place(ellipsoid({ r: [w * 0.48, h * 0.95, d * 0.48], rows: 6, cols: 10 }), { at: [at[0], y, at[2]] })); }
      else cells.push(place(box(w * 0.95, h * 0.94, d * 0.95, r.shape === 'poly' ? 0.55 : 0.35), { at }));
      if (r.nuc && j === nz - 1){ const nr = [Math.min(0.12, w * 0.22), Math.min(0.12, h * 0.3), 0.025];
        const ny = r.shape === 'dome' ? y + h * 0.4 : at[1];
        if (r.nuc === 2 && (i % 2 === 0)) [-1, 1].forEach(s => nucs.push(place(ellipsoid({ r: nr, rows: 5, cols: 8 }), { at: [at[0] + s * w * 0.2, ny, at[2] + d * 0.48] })));
        else nucs.push(place(ellipsoid({ r: nr, rows: 5, cols: 8 }), { at: [at[0], ny, at[2] + d * (r.shape === 'dome' ? 0.45 : 0.48)] })); }
    }
    (byPart[r.part] = byPart[r.part] || { m: [], c: r.c }).m.push(merge(cells));
    if (nucs.length) (byPart.eNuc = byPart.eNuc || { m: [], c: C.nuc }).m.push(merge(nucs));
    r.y0 = y; r.y1 = y + h; y += h;
  });
  const objs = {}; Object.keys(byPart).forEach(p => { const m = merge(byPart[p].m); objs[p] = { o: B.add(m, fx(byPart[p].c, p)), m }; });
  return { topY: y, objs, x0, x1 };
}
const lyrLabels = (B, L, part, x, side) => { const r = L.find(q => q.part === part); if (r) B.label(part, [x, (r.y0 + r.y1) / 2, Z], side || [0, 0.2, 1]); };

/* ═════ 5) المطبق الحرشفي: الحماية ═════ */
function strModel(B, o){
  o = o || {};
  const L = [{ h: 0.36, n: 16, part: 'cBasal', c: C.cell2, nuc: 1 }, { h: 0.34, n: 9, part: 'cPoly', c: C.cell, shape: 'poly', nuc: 1 }, { h: 0.3, n: 8, part: 'cPoly', c: C.cell, shape: 'poly', nuc: 1 },
    { h: 0.12, n: 5, part: 'cSquam', c: C.cellT, nuc: 1 }, { h: 0.08, n: 4, part: 'cSquam', c: C.cellT }];
  if (o.cmp){ L.forEach(r => { r.part = 'tEpiStrat'; r.n = Math.max(2, Math.round(r.n * 0.45)); }); }
  const S = layered(B, L, o);
  const bn = bouncer(B, S.topY, S.x0, S.x1);
  if (!o.cmp){
    B.label('cSquam', [X - 0.3, S.topY, Z * 0.6], [0, 1, 0.5]);
    lyrLabels(B, L, 'cPoly', -X, [-1, 0.2, 0.6]); lyrLabels(B, L, 'cBasal', X, [1, 0, 0.6]);
    common(B, null);
    B.caption([0, S.topY + 1.1, 0], () => ['متقرن في بشرة الجلد · يبطن الفم والمريء', 'الأحمر: احتكاك يصطدم بالسطح ويرتد = الحماية']);
  }
  return { dist: 8.4, yaw: 0.35, pitch: 0.4, target: [0, 0.6, 0], live2d: true, anim: bn };
}

/* ═════ 6) المطبق المكعبي: الحماية والإفراز ═════ */
function scbModel(B){
  const L = [{ h: 0.5, n: 10, part: 'cCube', c: C.cell2, nuc: 1 }, { h: 0.5, n: 10, part: 'cCube', c: C.cell, nuc: 1 }];
  const S = layered(B, L);
  const bn = bouncer(B, S.topY, -X, X);
  const f = t => flow(8, t, 0.2, (i, p) => [-X + 0.4 + i * 0.7, S.topY + 0.1 + p * 1.3, -Z * 0.2]);
  const sO = B.add(dots(f(0), 0.07), { color: '#f7d774', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('cCube', [X - 0.3, S.topY * 0.75, Z], [0, 0.2, 1]);
  common(B, null);
  B.caption([0, S.topY + 1.1, 0], () => ['يبطن قنوات الغدد العرقية والنبيبات المنوية', 'الأحمر: الحماية · الأصفر: الإفراز']);
  return { dist: 8.4, yaw: 0.35, pitch: 0.4, target: [0, 0.5, 0], live2d: true, anim(t){ bn(t); B.update(sO, dots(f(t), 0.07)); } };
}

/* ═════ 7) المطبق العمودي: الحماية ═════ */
function sclModel(B){
  const L = [{ h: 0.45, n: 9, part: 'cPoly', c: C.cell2, shape: 'poly', nuc: 1 }, { h: 1.0, n: 9, part: 'cColumn', c: C.cell, nuc: 1 }];
  const S = layered(B, L);
  const bn = bouncer(B, S.topY, -X, X);
  lyrLabels(B, L, 'cColumn', X, [1, 0.2, 0.6]); lyrLabels(B, L, 'cPoly', -X, [-1, 0, 0.6]);
  common(B, [-X + 0.33, 0.8, Z]);
  B.caption([0, S.topY + 1.1, 0], () => ['يوجد في بطانة الإحليل', 'الأحمر: احتكاك يصطدم بالسطح ويرتد = الحماية']);
  return { dist: 8.4, yaw: 0.35, pitch: 0.4, target: [0, 0.6, 0], live2d: true, anim: bn };
}

/* ═════ 8) المتحول: الخلايا تغيّر شكلها (تمدد وانكماش) ═════ */
function traModel(B){
  const L = [{ h: 0.32, n: 14, part: 'cCube', c: C.cell2, nuc: 1 }, { h: 0.36, n: 9, part: 'cPoly', c: C.cell, shape: 'poly', nuc: 1 }, { h: 0.34, n: 8, part: 'cPoly', c: C.cell, shape: 'poly', nuc: 1 },
    { h: 0.55, n: 6, part: 'cDome', c: C.cellT, shape: 'dome', nuc: 2 }];
  const S = layered(B, L);
  const stretch = (m, sx, sy) => { const p = m.p.slice(); for (let k = 0; k < p.length; k += 3){ p[k] *= sx; p[k + 1] = 0.03 + (p[k + 1] - 0.03) * sy; } return { p, n: m.n, l: m.l, i: m.i }; };
  const lab = { cDome: [X - 0.4, L[3].y0 + 0.25, Z * 0.6], cPoly: [-X, (L[1].y0 + L[2].y1) / 2, Z], cCube: [X, 0.18, Z], eNuc: [-X + 0.25, L[3].y0 + 0.2, Z] };
  const lab0 = JSON.parse(JSON.stringify(lab));
  B.label('cDome', lab.cDome, [0, 1, 0.5]); B.label('cPoly', lab.cPoly, [-1, 0.2, 0.6]); B.label('cCube', lab.cCube, [1, 0, 0.6]); B.label('eNuc', lab.eNuc, [0, 0, 1]);
  common(B, null);
  let k = 0;
  B.caption([0, 2.0, 0], () => [k > 0.55 ? 'عند التمدد: الخلايا تتسطح من دون تمزق أو تلف' : k < 0.45 ? 'عند الانكماش: الخلايا ترجع لشكلها' : 'يبطن المثانة البولية والحالب وحوض الكلية', 'الحماية والتمدد وانكماش الأعضاء']);
  return { dist: 8.6, yaw: 0.35, pitch: 0.4, target: [0, 0.6, 0], live2d: true,
    anim(t){ k = 0.5 - 0.5 * Math.cos(t * 0.9 * (focusOwner ? 0.6 : 1)); const sx = 1 + 0.15 * k, sy = 1 - 0.45 * k;
      Object.keys(S.objs).forEach(p => B.update(S.objs[p].o, stretch(S.objs[p].m, sx, sy)));
      Object.keys(lab).forEach(p => { lab[p][0] = lab0[p][0] * sx; lab[p][1] = 0.03 + (lab0[p][1] - 0.03) * sy; }); } };
}

/* ═════ 9) بسيط × مطبق ═════ */
function cmpModel(B){
  const L0 = -3.2, L1 = -0.4, nx = 5, nz = 3, w = (L1 - L0) / nx, d = 2 * Z / nz;
  base(B, { x0: L0, x1: L1, noCT: true });
  B.add(merge(grid(nx, nz, (x, z) => place(box(w * 0.95, 0.55, d * 0.95, 0.3), { at: [x, 0.31, z] }), L0, L1)), fx(C.cell, 'tEpiSimple'));
  B.add(merge(grid(nx, nz, (x, z, i, j) => j === nz - 1 ? place(ellipsoid({ r: [0.12, 0.12, 0.03], rows: 6, cols: 8 }), { at: [x, 0.31, z + d * 0.48] }) : null, L0, L1)), fx(C.nuc, 'tEpiSimple'));
  const S = strModel(B, { x0: 0.4, x1: 3.2, noCT: true, cmp: true });
  B.label('tEpiSimple', [L0 + 0.3, 0.6, Z], [0, 0.3, 1]);
  B.label('tEpiStrat', [3.0, 0.9, Z], [0, 0.3, 1]);
  B.label('basem', [L1 - 0.2, 0.03, Z], [0, 0, 1]);
  B.caption([(L0 + L1) / 2, -0.6, Z], () => ['بسيط: صف واحد من الخلايا']);
  B.caption([1.8, -0.6, Z], () => ['مطبق: أكثر من صف من الخلايا']);
  return { dist: 9.2, yaw: 0.2, pitch: 0.38, target: [0, 0.4, 0], live2d: true, compactK: 1.2, anim: S.anim };
}

Object.assign(G3.models, { eth_esq: sqModel, eth_ecub: cubModel, eth_ecol: colModel, eth_epse: pseModel, eth_estr: B => strModel(B),
  eth_escb: scbModel, eth_escl: sclModel, eth_etra: traModel, eth_ecmp: cmpModel });
})();
