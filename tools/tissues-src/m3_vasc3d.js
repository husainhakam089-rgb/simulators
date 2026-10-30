
/* ══════════════════════════════════════════════════════════════════════════
   9.4 · مجسّمات النسيج الوعائي (ملزمة ص15–17): عناصر الخشب، نسيج اللحاء
         برسم الملزمة (أنبوب منخلي وصفائح منخلية وخلايا مرافقة)، والمقارنة
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

/* ═════════════ 1) نسيج الخشب ═════════════ */
function xylModel(B){
  const H = 3.6;
  B.add(place(spindle(0.12, H - 0.2), { at: [-2.1, 0, 0] }), { part: 'xFiber', color: '#d9b06e', rim: 0.6, rimColor: '#ffe7b8', pat: 1, patColor: '#9c7a46', patK: 30 });
  /* قصيبتان متداخلتان + نقر */
  const T = [[-1.25, 0.35], [-0.8, -0.6]], pits = [];
  T.forEach(([x, y]) => { for (let k = 0; k < 9; k++){ const yy = y - 1.0 + k * 0.24; pits.push(place(ellipsoid({ r: [0.03, 0.055, 0.03], rows: 4, cols: 6 }), { at: [x + 0.19 * Math.sin(Math.PI * (yy - y + 1.4) / 2.8), yy, 0.12] })); } });
  B.add(merge(T.map(([x, y]) => place(spindle(0.24, 2.8), { at: [x, y, 0] }))), { part: 'xTrach', color: '#e9b8a8', alpha: 0.5, rim: 1, rimColor: '#ffd2c8', shell: { size: 1 } });
  B.add(merge(pits), { part: 'xTrach', color: '#7a3d3d', rim: 0.4, rimColor: '#ffd2c8' });
  /* الوعاء الخشبي: أنبوب متصل، تبقى حافات الجدران الفاصلة، وتغلظ حلزوني على الجدار */
  const VX = 0.15, R = 0.36, VX2 = 0.95;
  const helix = []; for (let a = 0; a < 6.283 * 14; a += 0.25) helix.push([VX + Math.cos(a) * R * 0.97, -H / 2 + 0.05 + (a / (6.283 * 14)) * (H - 0.1), Math.sin(a) * R * 0.97]);
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [VX, 0, 0] }), { part: 'xVessel', color: '#f3d2c6', alpha: 0.3, rim: 1.1, rimColor: '#ffd2c8', shell: { size: 1.2 } });
  B.add(merge([tube({ pts: helix, r: 0.022, sides: 5 })].concat([1, 2, 3].map(k => place(lathe([[R * 0.78, -0.035], [R * 1.03, -0.035], [R * 1.03, 0.035], [R * 0.78, 0.035]], 24), { at: [VX, -H / 2 + H * k / 4, 0] })))),
    { part: 'xVessel', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8' });
  /* وعاء ثانٍ بطريقة تغلظ أخرى (حلقات) — تتباين الأوعية تبعاً لطريقة التغلظ فيها */
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [VX2, 0, 0] }), { part: 'xVessel', color: '#f3d2c6', alpha: 0.3, rim: 1.1, rimColor: '#ffd2c8', shell: { size: 1.2 } });
  const rings = []; for (let y = -H / 2 + 0.12; y < H / 2 - 0.05; y += 0.22) rings.push(place(lathe([[R * 0.86, -0.025], [R * 1.0, -0.025], [R * 1.0, 0.025], [R * 0.86, 0.025]], 24), { at: [VX2, y, 0] }));
  B.add(merge(rings), { part: 'xVessel', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8' });
  /* البرنكيمة الخشبية */
  const par = [], pn = []; for (let k = 0; k < 5; k++){ par.push(place(box(0.42, 0.62, 0.42), { at: [1.85, -H / 2 + 0.38 + k * 0.7, 0] })); pn.push(place(ellipsoid({ r: 0.09, rows: 6, cols: 8 }), { at: [1.85, -H / 2 + 0.38 + k * 0.7, 0.2] })); }
  B.add(merge(par), { part: 'xPar', color: '#b78a7a', alpha: 0.75, rim: 0.7, rimColor: '#ffe6dc' });
  B.add(merge(pn), { part: 'xPar', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  /* الماء: يصعد في الوعاء، ويعبر النقر من قصيبة إلى أخرى */
  const NW = 14, NT = 6;
  const wPos = (t, tt) => {
    const out = [];
    for (let i = 0; i < NW; i++){ const p = (t * 0.2 + i / NW) % 1; out.push([(i % 2 ? VX2 : VX) + Math.sin(i * 2.1) * 0.16, -H / 2 + 0.1 + p * (H - 0.2), Math.cos(i * 1.7) * 0.16]); }
    for (let i = 0; i < NT; i++){ const p = (tt * 0.14 + i / NT) % 1, y = -1.9 + p * 3.6; const x = y < -0.2 ? -0.8 : y < 0.2 ? -0.8 - (y + 0.2) / 0.4 * 0.45 : -1.25; out.push([x, y, 0]); }
    return out; };
  const wO = B.add(dots(wPos(0, 0), 0.075), { color: WATER, rim: 0.9, rimColor: '#e8f7ff', pop: false, center: [0, 0, 0] });
  B.label('xFiber', [-2.1, 0.6, 0.1], [0, 0, 1]);
  B.label('xTrach', [-1.25, 1.2, 0.18], [0, 0, 1]);
  B.label('xVessel', [VX2 + R, 1.1, 0.1], [1, 0, 0.5]);
  B.label('xPar', [2.06, -0.6, 0.15], [1, 0, 0.6]);
  B.caption([0, -H / 2 - 0.35, 0.6], () => ['', 'الأوعية والقصيبات تنقل الماء والمعادن']);
  return {
    dist: 9, yaw: 0.25, pitch: 0.15, live2d: true,
    anim(t){ const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      B.update(wO, dots(wPos(t * (f && f !== 'xVessel' ? 0.2 : 1), t * (f && f !== 'xTrach' ? 0.2 : 1)), 0.075)); }
  };
}

/* هندسة نسيج اللحاء كما في رسم الملزمة: أنبوب منخلي متموج، صفائح منخلية مائلة، خلايا مرافقة بنوى */
function phloemParts(B, at, k, ids){
  const H = 4.2 * k, R = 0.5 * k, AMP = 0.13 * k, NW = 2.5;
  const rad = y => R - AMP * Math.cos(((y + H / 2) / H) * NW * 6.2832);
  const prof = []; for (let i = 0; i <= 40; i++){ const y = -H / 2 + H * i / 40; prof.push([rad(y), y]); }
  B.add(place(lathe(prof, 30), { at }), { part: ids.tube, color: '#d9f0c6', alpha: 0.32, rim: 1, rimColor: '#9fe06a', shell: { size: 1.4 * k } });
  const PY = [0.06, 0.5, 0.94].map(u => -H / 2 + u * H);
  const plO = B.add(merge(PY.map(y => place(cylinder(rad(y) * 0.98, 0.05 * k, 28), { at: add(at, [0, y, 0]), rot: [0, 0, 0.25] }))),
    { part: ids.plate, color: '#f6fbf1', rim: 0.8, rimColor: '#9fe06a', pat: 2, patColor: '#1d2a18', patK: 30 });
  const C = [[-1, -0.52, 1.9], [-1, 0.55, 1.9], [1, -0.95, 1.8], [1, 0.95, 1.8]], comp = [], cn = [];
  C.forEach(([sd, y, h]) => { const x = sd * (R + 0.2 * k);
    comp.push(place(ellipsoid({ r: [0.2 * k, h * k / 2, 0.24 * k], rows: 10, cols: 14 }), { at: add(at, [x, y * k, 0]) }));
    cn.push(place(ellipsoid({ r: [0.07 * k, 0.2 * k, 0.07 * k], rows: 6, cols: 8 }), { at: add(at, [x + sd * 0.04 * k, y * k, 0.2 * k]) })); });
  B.add(merge(comp), { part: ids.comp, color: '#8fd14f', alpha: 0.85, rim: 0.8, rimColor: '#e6ffd0' });
  const cnO = B.add(merge(cn), { part: ids.comp, color: '#1d1d1d', rim: 0.6, rimColor: '#c8bfff' });
  return { H, R, rad, PY, plO, cnO };
}

/* ═════════════ 2) نسيج اللحاء برسم الملزمة (ص16–17) ═════════════ */
function phlModel(B){
  const { H, R, rad, PY, plO, cnO } = phloemParts(B, [0, 0, 0], 1, { tube: 'pSieve', plate: 'pPlate', comp: 'pComp' });
  /* الجزيئات العضوية داخل الأنبوب، والكاربوهيدرات من وإلى الخلايا المرافقة */
  const NS = 10, NC = 8;
  const sPos = t => { const out = []; for (let i = 0; i < NS; i++){ const p = (t * 0.08 + i / NS) % 1, y = -H / 2 + 0.2 + p * (H - 0.4);
    out.push([Math.sin(p * 18 + i) * 0.18, y, Math.cos(i) * 0.12]); } return out; };
  const cPos = t => { const out = []; for (let i = 0; i < NC; i++){ const sd = i % 2 ? 1 : -1, p = (t * 0.25 + i / NC) % 1, q = i % 4 < 2 ? p : 1 - p, y = -1.4 + (i * 0.41) % 2.8;
    out.push([sd * (R + 0.2 - q * (R + 0.1)), y, 0.05]); } return out; };
  const sO = B.add(dots(sPos(0), 0.07, cube), { color: SUGAR, rim: 0.9, rimColor: '#fff1d6', pop: false, center: [0, 0, 0] });
  const cO = B.add(dots(cPos(0), 0.06), { color: '#ffe08a', rim: 0.9, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('pSieve', [rad(1.2), 1.2, 0.1], [1, 0, 0.5]);
  B.label('pComp', [-(R + 0.38), 0.55, 0.1], [-1, 0, 0.5]);
  B.label('pPlate', [rad(PY[2]) * 0.6, PY[2], 0.3], [0.3, -0.4, 1]);
  B.caption([0, -H / 2 - 0.35, 0.6], () => ['', 'نسيج اللحاء: أنبوب منخلي · خلية مرافقة · صفيحة منخلية']);
  return {
    dist: 8.4, yaw: 0.3, pitch: 0.12, live2d: true, noSpin: true,
    anim(t){ const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      B.update(sO, dots(sPos(t * (f && f !== 'pSieve' && f !== 'pPlate' ? 0.2 : 1)), 0.07, cube));
      B.update(cO, dots(cPos(t * (f && f !== 'pComp' ? 0.2 : 1)), 0.06));
      cnO.rim = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.6)); plO.rim = f === 'pPlate' ? 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.8; }
  };
}

/* ═════════════ 3) قارن: نسيج الخشب × نسيج اللحاء ═════════════ */
function cmpModel(B){
  const H = 3.4, VX = -1.3, SX = 1.2, R = 0.42;
  B.add(place(lathe([[R, -H / 2], [R, H / 2]], 26), { at: [VX, 0, 0] }), { part: 'tXylem', color: '#f3d2c6', alpha: 0.3, rim: 1.1, rimColor: '#ffd2c8', shell: { size: 1.2 } });
  const helix = []; for (let a = 0; a < 6.283 * 13; a += 0.25) helix.push([VX + Math.cos(a) * R * 0.97, -H / 2 + 0.05 + (a / (6.283 * 13)) * (H - 0.1), Math.sin(a) * R * 0.97]);
  B.add(tube({ pts: helix, r: 0.022, sides: 5 }), { part: 'tXylem', color: '#c06a62', rim: 0.6, rimColor: '#ffd2c8' });
  const pl = phloemParts(B, [SX, 0, 0], 0.8, { tube: 'tPhloem', plate: 'tPhloem', comp: 'tPhloem' }).plO;
  const W = 10, S = 10;
  const pos = t => ({ w: Array.from({ length: W }, (_, i) => [VX + Math.sin(i * 2.1) * 0.2, -H / 2 + 0.1 + ((t * 0.2 + i / W) % 1) * (H - 0.2), Math.cos(i) * 0.15]),
    s: Array.from({ length: S }, (_, i) => { const p = (t * 0.08 + i / S) % 1; return [SX + Math.sin(p * 18 + i) * 0.14, -H / 2 + 0.1 + p * (H - 0.2), 0]; }) });
  const P0 = pos(0);
  const wO = B.add(dots(P0.w, 0.075), { color: WATER, rim: 0.9, rimColor: '#e8f7ff', pop: false, center: [0, 0, 0] });
  const sO = B.add(dots(P0.s, 0.07, cube), { color: SUGAR, rim: 0.9, rimColor: '#fff1d6', pop: false, center: [0, 0, 0] });
  B.label('tXylem', [VX - R, 1.0, 0.05], [-1, 0, 0.4]);
  B.label('tPhloem', [SX + 0.62, 0.76, 0.1], [1, 0, 0.6]);
  B.caption([VX, -H / 2 - 0.35, 0.5], () => ['نسيج الخشب (وعاء)', 'خلايا ميتة · نقل الماء والمعادن']);
  B.caption([SX, -H / 2 - 0.35, 0.5], () => ['نسيج اللحاء (أنبوب منخلي)', 'نقل المواد الغذائية المذابة']);
  return {
    dist: 8.6, yaw: 0.2, pitch: 0.18, live2d: true,
    anim(t){ const P = pos(t); B.update(wO, dots(P.w, 0.075)); B.update(sO, dots(P.s, 0.07, cube)); pl.rim = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.4)); }
  };
}

Object.assign(G3.models, { vas_xyl: xylModel, vas_phl: phlModel, vas_vcmp: cmpModel });
})();
