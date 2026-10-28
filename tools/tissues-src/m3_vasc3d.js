
/* ══════════════════════════════════════════════════════════════════════════
   9.3 · مجسّمات الأنسجة المعقدة: الحزمة الوعائية (الماء يصعد في الخشب
         والغذاء بالاتجاهين في اللحاء)، عناصر الخشب، عناصر اللحاء، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, ellipsoid, superEll, capsule, tube, place, merge, srng, computeNormals, mk } = G3;
const GOLD = '#ffd166', WATER = '#6fc3ff', SUGAR = '#ffb347';

function lathe(prof, cols){
  const m = mk(), R = prof.length, C = cols || 24;
  for (let i = 0; i < R; i++){ const [r, y] = prof[i];
    for (let j = 0; j < C; j++){ const a = j / C * 6.2832, p = [r * Math.cos(a), y, r * Math.sin(a)]; m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0); } }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C; j++){ const a = i * C + j, b = i * C + (j + 1) % C, c = a + C, d = b + C; m.i.push(a, b, c, b, d, c); }
  return computeNormals(m);
}
const cylinder = (r, h, cols) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], cols || 20);
const spindle = (R, H, n) => { const p = []; for (let i = 0; i <= (n || 20); i++){ const u = i / (n || 20); p.push([Math.max(0.001, R * Math.sin(Math.PI * u)), -H / 2 + H * u]); } return lathe(p, 14); };
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.3, rows: 6, cols: 10 });
/* جزيئات متحركة في مجسّم واحد (تُعاد بناءً كل إطار) */
const dots = (list, r, mesh) => merge(list.map(p => place(mesh || ellipsoid({ r: 1, rows: 5, cols: 8 }), { at: p, s: r })));
const cube = box(2, 2, 2, 0.4);

/* أنبوب مقسّم إلى خلايا: حافات عند الجدران الفاصلة */
function stackedTube(at, r, h, n, o){
  const parts = [place(lathe([[r, -h / 2], [r, h / 2]], 22), { at })];
  for (let k = 1; k < n; k++) parts.push(place(lathe([[r * (o && o.open ? 0.78 : 0.001), -0.02], [r * 1.03, -0.02], [r * 1.03, 0.02], [r * (o && o.open ? 0.78 : 0.001), 0.02]], 22), { at: add(at, [0, -h / 2 + h * k / n, 0]) }));
  return parts;
}

/* ═════════════ 1) الحزمة الوعائية ═════════════ */
function bunModel(B){
  const H = 3.4, rnd = srng(3);
  /* الخارج (الألياف) يسار، الداخل (الخشب) يمين */
  const fib = []; for (let i = 0; i < 7; i++) fib.push(place(cylinder(0.11, H, 12), { at: [-2.05 + (i % 2) * 0.17, 0, -0.75 + i * 0.25] }));
  B.add(merge(fib), { part: 'pFiber', color: '#d9b06e', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#9c7a46', patK: 30 });
  /* اللحاء: أنابيب غربالية (بصفائح) + خلايا مرافقة */
  const SV = [[-1.35, -0.5], [-1.4, 0.2], [-1.25, 0.85], [-1.05, -1.05]], sieve = [], plates = [], comp = [], cnuc = [];
  SV.forEach(([x, z]) => {
    sieve.push(place(cylinder(0.17, H, 18), { at: [x, 0, z] }));
    for (let k = 1; k < 4; k++) plates.push(place(cylinder(0.172, 0.04, 18), { at: [x, -H / 2 + H * k / 4, z] }));
    comp.push(place(cylinder(0.06, H, 10), { at: [x + 0.2, 0, z + 0.12] }));
    for (let k = 0; k < 4; k++) cnuc.push(place(ellipsoid({ r: [0.05, 0.1, 0.05], rows: 5, cols: 8 }), { at: [x + 0.2, -H / 2 + H * (k + 0.5) / 4, z + 0.12] }));
  });
  B.add(merge(sieve), { part: 'pSieve', color: '#a8d07a', alpha: 0.4, rim: 0.9, rimColor: '#efffd8', shell: { size: 1 } });
  B.add(merge(plates), { part: 'pSieve', color: '#e9f7c8', rim: 0.6, rimColor: '#ffffff', pat: 2, patColor: '#2f4a22', patK: 40 });
  B.add(merge(comp), { part: 'pComp', color: '#4f7f3a', rim: 0.7, rimColor: '#efffd8' });
  B.add(merge(cnuc), { part: 'pComp', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  B.add(place(box(0.95, H + 0.02, 2.5, 0.25), { at: [-1.25, 0, 0] }), { part: 'tPhloem', color: '#6f9a52', alpha: 0.14, rim: 0.7, rimColor: '#efffd8', shell: { size: 3 } });
  /* الكامبيوم الوعائي */
  B.add(place(box(0.14, H, 2.6, 0.3), { at: [-0.55, 0, 0] }), { part: 'vascCamb', color: '#ffd98a', rim: 0.8, rimColor: GOLD, pat: 1, patColor: '#c8a050', patK: 22 });
  /* الخشب: أوعية واسعة + برنكيمة */
  const VE = [[0.05, -0.6, 0.28], [0.2, 0.35, 0.3], [0.85, -0.2, 0.26], [0.9, 0.75, 0.22], [1.45, 0.2, 0.2], [0.55, -1.05, 0.18]];
  const ves = [], rims = [], xpar = [];
  VE.forEach(([x, z, r]) => { ves.push(place(cylinder(r, H, 20), { at: [x, 0, z] }));
    for (let k = 1; k < 4; k++) rims.push(place(lathe([[r * 0.8, -0.03], [r * 1.04, -0.03], [r * 1.04, 0.03], [r * 0.8, 0.03]], 20), { at: [x, -H / 2 + H * k / 4, z] })); });
  for (let i = 0; i < 14; i++){ const x = -0.25 + rnd() * 1.9, z = -1.1 + rnd() * 2.2; if (VE.some(([vx, vz, r]) => Math.hypot(x - vx, z - vz) < r + 0.12)) continue;
    for (let k = 0; k < 3; k++) xpar.push(place(cube, { at: [x, -H / 2 + 0.55 + k * 1.1, z], s: [0.08, 0.5, 0.08] })); }
  B.add(merge(ves), { part: 'xVessel', color: '#f3d2c6', alpha: 0.35, rim: 1, rimColor: '#ffd2c8', shell: { size: 1.05 } });
  B.add(merge(rims), { part: 'xVessel', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8' });
  B.add(merge(xpar), { part: 'tXylem', color: '#b78a7a', rim: 0.5, rimColor: '#ffe6dc' });
  B.add(place(box(2.0, H + 0.02, 2.6, 0.25), { at: [0.65, 0, 0] }), { part: 'tXylem', color: '#7a3d3d', alpha: 0.12, rim: 0.7, rimColor: '#ffd2c8', shell: { size: 4 } });
  /* الماء يصعد في الأوعية، والغذاء بالاتجاهين في الأنابيب الغربالية */
  const W = []; VE.forEach(([x, z], i) => { for (let k = 0; k < 4; k++) W.push({ x, z, ph: k / 4 + i * 0.13 }); });
  const S = []; SV.forEach(([x, z], i) => { for (let k = 0; k < 3; k++) S.push({ x, z, ph: k / 3 + i * 0.21, dn: (i + k) % 2 === 0 }); });
  const wPos = t => W.map(w => [w.x, -H / 2 + 0.1 + ((t * 0.22 + w.ph) % 1) * (H - 0.2), w.z]);
  const sPos = t => S.map(s => { const p = (t * 0.16 + s.ph) % 1; return [s.x, s.dn ? H / 2 - 0.1 - p * (H - 0.2) : -H / 2 + 0.1 + p * (H - 0.2), s.z]; });
  const wO = B.add(dots(wPos(0), 0.07), { color: WATER, rim: 0.9, rimColor: '#e8f7ff', pop: false, center: [0, 0, 0] });
  const sO = B.add(dots(sPos(0), 0.065, cube), { color: SUGAR, rim: 0.9, rimColor: '#fff1d6', pop: false, center: [0, 0, 0] });
  B.label('pFiber', [-2.05, H / 2, 0.75], [0, 1, 0.3]);
  B.label('pSieve', [-1.25, H / 2, 0.85], [0, 1, 0.3]);
  B.label('pComp', [-1.15, H / 2, -0.38], [0, 1, 0.3]);
  B.label('tPhloem', [-1.25, -0.6, 1.25], [0, 0, 1]);
  B.label('vascCamb', [-0.55, H / 2, 1.0], [0, 1, 0.3]);
  B.label('xVessel', [0.9, H / 2, 0.75], [0, 1, 0.3]);
  B.label('tXylem', [1.2, -0.6, 1.3], [0, 0, 1]);
  B.caption([-1.25, -H / 2 - 0.35, 1.3], () => ['اللحاء', 'غذاء ⇅']);
  B.caption([0.65, -H / 2 - 0.35, 1.3], () => ['الخشب', 'ماء وأملاح ↑']);
  return {
    dist: 9.4, yaw: 0.06, pitch: 0.48, target: [-0.3, 0, 0], live2d: true,
    anim(t){ const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      B.update(wO, dots(wPos(t * (f && f !== 'xVessel' && f !== 'tXylem' ? 0.2 : 1)), 0.07));
      B.update(sO, dots(sPos(t * (f && f !== 'pSieve' && f !== 'tPhloem' ? 0.2 : 1)), 0.065, cube)); }
  };
}

/* ═════════════ 2) عناصر الخشب ═════════════ */
function xylModel(B){
  const H = 3.6;
  B.add(place(spindle(0.12, H - 0.2), { at: [-2.1, 0, 0] }), { part: 'xFiber', color: '#d9b06e', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#9c7a46', patK: 30 });
  /* قصيبتان متداخلتان + نقر */
  const T = [[-1.25, 0.35], [-0.8, -0.6]], pits = [];
  T.forEach(([x, y]) => { for (let k = 0; k < 9; k++){ const yy = y - 1.0 + k * 0.24; pits.push(place(ellipsoid({ r: [0.03, 0.055, 0.03], rows: 4, cols: 6 }), { at: [x + 0.19 * Math.sin(Math.PI * (yy - y + 1.4) / 2.8), yy, 0.12] })); } });
  B.add(merge(T.map(([x, y]) => place(spindle(0.24, 2.8), { at: [x, y, 0] }))), { part: 'xTrach', color: '#e9b8a8', alpha: 0.5, rim: 1, rimColor: '#ffd2c8', shell: { size: 1 } });
  B.add(merge(pits), { part: 'xTrach', color: '#7a3d3d', rim: 0.4, rimColor: '#ffd2c8' });
  /* الوعاء الخشبي: أنبوب متصل، تبقى حافات الجدران الفاصلة، وتغلظ حلزوني على الجدار */
  const VX = 0.45, R = 0.42;
  const helix = []; for (let a = 0; a < 6.283 * 14; a += 0.25) helix.push([VX + Math.cos(a) * R * 0.97, -H / 2 + 0.05 + (a / (6.283 * 14)) * (H - 0.1), Math.sin(a) * R * 0.97]);
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [VX, 0, 0] }), { part: 'xVessel', color: '#f3d2c6', alpha: 0.3, rim: 1.1, rimColor: '#ffd2c8', shell: { size: 1.2 } });
  B.add(merge([tube({ pts: helix, r: 0.022, sides: 5 })].concat([1, 2, 3].map(k => place(lathe([[R * 0.78, -0.035], [R * 1.03, -0.035], [R * 1.03, 0.035], [R * 0.78, 0.035]], 24), { at: [VX, -H / 2 + H * k / 4, 0] })))),
    { part: 'xVessel', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8' });
  /* البرنكيمة الخشبية */
  const par = [], pn = []; for (let k = 0; k < 5; k++){ par.push(place(box(0.42, 0.62, 0.42), { at: [1.55, -H / 2 + 0.38 + k * 0.7, 0] })); pn.push(place(ellipsoid({ r: 0.09, rows: 6, cols: 8 }), { at: [1.55, -H / 2 + 0.38 + k * 0.7, 0.2] })); }
  B.add(merge(par), { part: 'xPar', color: '#b78a7a', alpha: 0.75, rim: 0.7, rimColor: '#ffe6dc' });
  B.add(merge(pn), { part: 'xPar', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  /* الماء: يصعد في الوعاء، ويعبر النقر من قصيبة إلى أخرى */
  const NW = 14, NT = 6;
  const wPos = (t, tt) => {
    const out = [];
    for (let i = 0; i < NW; i++){ const p = (t * 0.2 + i / NW) % 1; out.push([VX + Math.sin(i * 2.1) * 0.22, -H / 2 + 0.1 + p * (H - 0.2), Math.cos(i * 1.7) * 0.2]); }
    for (let i = 0; i < NT; i++){ const p = (tt * 0.14 + i / NT) % 1, y = -1.9 + p * 3.6; const x = y < -0.2 ? -0.8 : y < 0.2 ? -0.8 - (y + 0.2) / 0.4 * 0.45 : -1.25; out.push([x, y, 0]); }
    return out; };
  const wO = B.add(dots(wPos(0, 0), 0.075), { color: WATER, rim: 0.9, rimColor: '#e8f7ff', pop: false, center: [0, 0, 0] });
  const arr = merge([tube({ pts: [[VX + 0.75, -1.2, 0], [VX + 0.75, 1.2, 0]], r: 0.03, sides: 8 }), place(lathe([[0.09, 0], [0.001, 0.26]], 12), { at: [VX + 0.75, 1.2, 0] })]);
  B.add(arr, { color: WATER, rim: 0.9, rimColor: '#e8f7ff', pop: false });
  B.label('xFiber', [-2.1, 0.6, 0.1], [0, 0, 1]);
  B.label('xTrach', [-1.25, 1.2, 0.18], [0, 0, 1]);
  B.label('xVessel', [VX + R, 1.1, 0.1], [1, 0, 0.5]);
  B.label('xPar', [1.76, -0.6, 0.15], [1, 0, 0.6]);
  B.caption([0, -H / 2 - 0.35, 0.6], () => ['', 'الماء والأملاح تصعد للأعلى باتجاه واحد']);
  return {
    dist: 9, yaw: 0.25, pitch: 0.15, live2d: true,
    anim(t){ const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      B.update(wO, dots(wPos(t * (f && f !== 'xVessel' ? 0.2 : 1), t * (f && f !== 'xTrach' ? 0.2 : 1)), 0.075)); }
  };
}

/* ═════════════ 3) عناصر اللحاء ═════════════ */
function phlModel(B){
  const H = 3.6, SX = -0.2, R = 0.4, N = 3;
  B.add(place(spindle(0.12, H - 0.2), { at: [-2.0, 0, 0] }), { part: 'pFiber', color: '#d9b06e', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#9c7a46', patK: 30 });
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [SX, 0, 0] }), { part: 'pSieve', color: '#a8d07a', alpha: 0.32, rim: 1, rimColor: '#efffd8', shell: { size: 1.2 } });
  const plates = []; for (let k = 1; k < N; k++) plates.push(place(cylinder(R * 0.98, 0.05, 26), { at: [SX, -H / 2 + H * k / N, 0] }));
  const plO = B.add(merge(plates), { part: 'pPlate', color: '#e9f7c8', rim: 0.8, rimColor: '#ffffff', pat: 2, patColor: '#2f4a22', patK: 34 });
  const comp = [], cn = [];
  for (let k = 0; k < N; k++){ const y = -H / 2 + H * (k + 0.5) / N;
    comp.push(place(capsule({ r: 0.1, len: H / N - 0.3, rows: 4, cols: 10 }), { at: [SX + R + 0.13, y, 0.12] }));
    cn.push(place(ellipsoid({ r: [0.07, 0.14, 0.07], rows: 6, cols: 8 }), { at: [SX + R + 0.13, y, 0.2] })); }
  B.add(merge(comp), { part: 'pComp', color: '#4f7f3a', alpha: 0.8, rim: 0.8, rimColor: '#efffd8' });
  const cnO = B.add(merge(cn), { part: 'pComp', color: '#7565c2', rim: 0.6, rimColor: '#d8d0ff' });
  const par = [], pn = []; for (let k = 0; k < 5; k++){ par.push(place(box(0.44, 0.62, 0.44), { at: [1.4, -H / 2 + 0.38 + k * 0.7, 0] })); pn.push(place(ellipsoid({ r: 0.09, rows: 6, cols: 8 }), { at: [1.4, -H / 2 + 0.38 + k * 0.7, 0.21] })); }
  B.add(merge(par), { part: 'pPar', color: '#86b06a', alpha: 0.75, rim: 0.7, rimColor: '#efffd8' });
  B.add(merge(pn), { part: 'pPar', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  /* الغذاء المصنّع بالاتجاهين عبر الصفائح الغربالية */
  const NS = 12;
  const sPos = t => { const out = []; for (let i = 0; i < NS; i++){ const dn = i % 2 === 0, p = (t * 0.13 + i / NS) % 1;
    out.push([SX + (dn ? -0.17 : 0.17), dn ? H / 2 - 0.1 - p * (H - 0.2) : -H / 2 + 0.1 + p * (H - 0.2), Math.sin(i) * 0.15]); } return out; };
  const sO = B.add(dots(sPos(0), 0.07, cube), { color: SUGAR, rim: 0.9, rimColor: '#fff1d6', pop: false, center: [0, 0, 0] });
  B.label('pFiber', [-2.0, 0.6, 0.1], [0, 0, 1]);
  B.label('pPlate', [SX - R * 0.7, -H / 2 + H / N, R * 0.7], [-0.5, 0.4, 1]);
  B.label('pSieve', [SX - R, -1.0, 0.05], [-1, 0, 0.4]);
  B.label('pComp', [SX + R + 0.23, 1.2, 0.12], [1, 0, 0.6]);
  B.label('pPar', [1.62, -0.6, 0.15], [1, 0, 0.6]);
  B.caption([0, -H / 2 - 0.35, 0.6], () => ['', 'الغذاء المصنّع ينتقل بالاتجاهين عبر الصفائح الغربالية']);
  return {
    dist: 8.8, yaw: 0.3, pitch: 0.18, live2d: true,
    anim(t){ const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      B.update(sO, dots(sPos(t * (f && f !== 'pSieve' && f !== 'pPlate' ? 0.2 : 1)), 0.07, cube));
      cnO.rim = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.6)); plO.rim = f === 'pPlate' ? 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.8; }
  };
}

/* ═════════════ 4) قارن: الوعاء الخشبي × الأنبوب الغربالي ═════════════ */
function cmpModel(B){
  const H = 3.4, VX = -1.3, SX = 1.2, R = 0.42;
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [VX, 0, 0] }), { part: 'tXylem', color: '#f3d2c6', alpha: 0.3, rim: 1.1, rimColor: '#ffd2c8', shell: { size: 1.2 } });
  const helix = []; for (let a = 0; a < 6.283 * 13; a += 0.25) helix.push([VX + Math.cos(a) * R * 0.97, -H / 2 + 0.05 + (a / (6.283 * 13)) * (H - 0.1), Math.sin(a) * R * 0.97]);
  B.add(tube({ pts: helix, r: 0.022, sides: 5 }), { part: 'tXylem', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8' });
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [SX, 0, 0] }), { part: 'tPhloem', color: '#a8d07a', alpha: 0.32, rim: 1, rimColor: '#efffd8', shell: { size: 1.2 } });
  const pl = B.add(merge([1, 2].map(k => place(cylinder(R * 0.98, 0.05, 26), { at: [SX, -H / 2 + H * k / 3, 0] }))), { part: 'tPhloem', color: '#e9f7c8', rim: 0.8, rimColor: GOLD, pat: 2, patColor: '#2f4a22', patK: 34 });
  B.add(merge([0, 1, 2].map(k => place(capsule({ r: 0.1, len: H / 3 - 0.3, rows: 4, cols: 10 }), { at: [SX + R + 0.13, -H / 2 + H * (k + 0.5) / 3, 0.12] }))), { part: 'tPhloem', color: '#4f7f3a', alpha: 0.8, rim: 0.8, rimColor: '#efffd8' });
  const W = 10, S = 10;
  const pos = t => ({ w: Array.from({ length: W }, (_, i) => [VX + Math.sin(i * 2.1) * 0.2, -H / 2 + 0.1 + ((t * 0.2 + i / W) % 1) * (H - 0.2), Math.cos(i) * 0.15]),
    s: Array.from({ length: S }, (_, i) => { const dn = i % 2 === 0, p = (t * 0.13 + i / S) % 1; return [SX + (dn ? -0.17 : 0.17), dn ? H / 2 - 0.1 - p * (H - 0.2) : -H / 2 + 0.1 + p * (H - 0.2), 0]; }) });
  const P0 = pos(0);
  const wO = B.add(dots(P0.w, 0.075), { color: WATER, rim: 0.9, rimColor: '#e8f7ff', pop: false, center: [0, 0, 0] });
  const sO = B.add(dots(P0.s, 0.07, cube), { color: SUGAR, rim: 0.9, rimColor: '#fff1d6', pop: false, center: [0, 0, 0] });
  B.label('tXylem', [VX - R, 1.0, 0.05], [-1, 0, 0.4]);
  B.label('tPhloem', [SX + R + 0.23, 1.0, 0.12], [1, 0, 0.6]);
  B.caption([VX, -H / 2 - 0.35, 0.5], () => ['الخشب (وعاء خشبي)', 'ميت · ماء وأملاح ↑']);
  B.caption([SX, -H / 2 - 0.35, 0.5], () => ['اللحاء (أنبوب غربالي)', 'حي بلا نواة · غذاء ⇅']);
  return {
    dist: 8.6, yaw: 0.2, pitch: 0.18, live2d: true,
    anim(t){ const P = pos(t); B.update(wO, dots(P.w, 0.075)); B.update(sO, dots(P.s, 0.07, cube)); pl.rim = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.4)); }
  };
}

Object.assign(G3.models, { vas_vbun: bunModel, vas_xyl: xylModel, vas_phl: phlModel, vas_vcmp: cmpModel });
})();
