
/* ══════════════════════════════════════════════════════════════════════════
   9.3 · مجسّمات نسيج البشرة (ملزمة ص14 وص23): سطح البشرة بأزواج الخلايا
         الحارسة، مقطع في البشرة، ووظائف البشرة الثلاث بمراحلها
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, ellipsoid, superEll, tube, place, merge, srng, computeNormals, mk } = G3;
const { blobDisp } = G3.parts;
const CO2 = '#b8c2cc', O2 = '#9fe9ff', H2O = '#6fc3ff';
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.3, rows: 6, cols: 10 });
const ball = ellipsoid({ r: 1, rows: 5, cols: 8 });
const dots = (list, r) => merge(list.map(p => place(ball, { at: p ? p : [0, -60, 0], s: p ? (p.s || r) : 0.0001 })));

/* خلية حارسة كلوية: أنبوب على قوس حول الفتحة؛ السطح في المستوى xz، o = مقدار الفتح */
function guardMesh(c, s, L, o, W){
  const a = 0.02 + 0.3 * W * o, pts = [], N = 18;
  for (let i = 0; i <= N; i++){ const u = 0.04 + i / N * 0.92, sn = Math.sin(Math.PI * u);
    pts.push([c[0] + s * (a * sn + W * 0.5 * Math.pow(sn, 0.6)), c[1], c[2] - L * Math.cos(Math.PI * u)]); }
  return tube({ pts, r: u => W * 0.5 * (0.55 + 0.45 * Math.sin(Math.PI * u)) * (1 + 0.12 * o), sides: 12 });
}
const poreMesh = (c, L, o, W) => { const a = 0.02 + 0.3 * W * o; return place(ellipsoid({ r: [Math.max(0.01, a * 1.6), 0.03, L * 0.82], rows: 6, cols: 16 }), { at: c }); };
function stomaObjs(B, c, L, W, o, withLabel){
  const gl = B.add(guardMesh(c, -1, L, o, W), { part: 'guard', color: '#5aa85a', rim: 0.8, rimColor: '#e6ffd8', pat: 2, patColor: '#2f8f3a', patK: 16, center: c });
  const gr = B.add(guardMesh(c, 1, L, o, W), { part: 'guard', color: '#5aa85a', rim: 0.8, rimColor: '#e6ffd8', pat: 2, patColor: '#2f8f3a', patK: 16, center: c });
  const pr = B.add(poreMesh(c, L, o, W), { color: '#13221a', rim: 0.4, rimColor: '#4f7f3a', center: c, pop: false });
  return { set(o2){ B.update(gl, guardMesh(c, -1, L, o2, W)); B.update(gr, guardMesh(c, 1, L, o2, W)); B.update(pr, poreMesh(c, L, o2, W)); }, gl, gr, pr };
}
/* بلاطة بشرة بخلايا متعرّجة (منظر سطحي) */
function epiSlab(B, X, Z, y, seed){
  const rnd = srng(seed), cells = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++){
    const x = -X + (i + 0.5) * (2 * X / 6) + (j % 2 ? 0.25 : 0), z = -Z + (j + 0.5) * (2 * Z / 4);
    if (Math.abs(x) > X - 0.1) continue;
    cells.push(place(ellipsoid({ r: [X / 6 * 1.12, 0.09, Z / 4 * 1.12], rows: 6, cols: 20, disp: blobDisp(seed + i * 7 + j, 0.09) }), { at: [x, y, z] }));
  }
  /* الخلايا متراصّة بلا مسافات بينية: طبقة متصلة تحتها */
  cells.push(place(box(2 * X, 0.12, 2 * Z, 0.12), { at: [0, y - 0.03, 0] }));
  return B.add(merge(cells), { part: 'epidermis', color: '#cfe7c0', rim: 0.6, rimColor: '#f4ffe8', pat: 3, patK: 6 });
}

/* ═════════════ 1) سطح البشرة السفلى للورقة ═════════════ */
function leafModel(B){
  const X = 2.8, Z = 1.9;
  epiSlab(B, X, Z, 0, 11);
  B.add(place(box(2 * X + 0.1, 0.03, 2 * Z + 0.1, 0.15), { at: [0, 0.1, 0] }), { color: '#f2d675', alpha: 0.14, rim: 0.5, rimColor: '#fff3c8', shell: { size: 6 }, pop: false });
  const ST = [[-1.7, -0.9], [-0.2, -1.1], [1.6, -0.4], [-1.0, 0.6], [0.7, 0.9], [2.1, 1.1]];
  const stomata = ST.map(([x, z]) => stomaObjs(B, [x, 0.12, z], 0.32, 0.17, 0.6));
  /* الغازات: CO₂ يدخل، O₂ وبخار الماء يخرجان */
  const N = 36;
  const gas = (t, o) => { const out = [], col = [[], [], []];
    for (let i = 0; i < N; i++){ const k = i % 3, [x, z] = ST[i % ST.length], p = (t * 0.35 + i / N * 3) % 1, inward = k === 0, d = inward ? 1 - p : p, ang = i * 2.4;
      col[k].push(o > 0.3 ? Object.assign([x + Math.cos(ang) * d * 0.5, 0.15 + d * 0.9, z + Math.sin(ang) * d * 0.5], { s: 0.055 * Math.sin(p * Math.PI) + 0.001 }) : null); }
    return col; };
  const G0 = gas(0, 1);
  const gO = [CO2, O2, H2O].map((c, k) => B.add(dots(G0[k], 0.055), { color: c, rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }));
  B.label('epidermis', [X - 0.6, 0.1, -Z + 0.4], [0, 1, 0]);
  B.label('guard', [ST[2][0] + 0.2, 0.2, ST[2][1]], [0, 1, 0]);
  B.caption([0, 0.1, Z + 0.45], () => ['', 'أزواج الخلايا الحارسة تسيطر على تبادل الغازات']);
  let lastO = -1;
  return {
    dist: 8.2, yaw: 0.1, pitch: 0.95, live2d: true, noSpin: true,
    anim(t){
      const o = 0.5 + 0.5 * Math.sin(t * 0.8);
      if (Math.abs(o - lastO) > 0.02){ lastO = o; stomata.forEach((s, i) => s.set(Math.max(0, Math.min(1, o + Math.sin(i * 1.7) * 0.15)))); }
      const G = gas(t, o); gO.forEach((obj, k) => B.update(obj, dots(G[k], 0.055)));
    }
  };
}

/* ═════════════ 2) مقطع في البشرة السفلى للورقة ═════════════ */
function secModel(B){
  /* الداخل للأعلى، والخارج (الكيوتكل والشعيرات) للأسفل */
  const rnd = srng(5), D = 1.2, ep = [], en = [], mes = [], chl = [];
  for (let i = -5; i <= 5; i++){ if (Math.abs(i) < 1) continue;
    const x = i * 0.42; ep.push(place(box(0.4, 0.42, D * 2), { at: [x, 0, 0] })); en.push(place(ellipsoid({ r: 0.06, rows: 5, cols: 8 }), { at: [x, 0, D] })); }
  for (let i = -4; i <= 4; i++) for (let j = 0; j < 2; j++) for (const z of [-0.65, 0, 0.65]){ const x = i * 0.5 + j * 0.2, y = 0.75 + j * 0.62;
    if (Math.abs(x) < 0.5 && j === 0) continue;
    mes.push(place(ellipsoid({ r: [0.24, 0.26, 0.26], rows: 8, cols: 12, disp: blobDisp(i * 3 + j, 0.06) }), { at: [x, y, z] }));
    if (z > 0) for (let k = 0; k < 4; k++) chl.push(place(ellipsoid({ r: [0.05, 0.03, 0.04], rows: 4, cols: 6 }), { at: [x + Math.cos(k * 1.6) * 0.16, y + Math.sin(k * 1.6) * 0.17, z + 0.22] })); }
  B.add(merge(mes), { color: '#5f9a5c', alpha: 0.5, rim: 0.4, rimColor: '#d6f5c4', pop: false });
  B.add(merge(chl), { color: '#2f8f3a', alpha: 0.6, rim: 0.4, rimColor: '#b6f0a0', pop: false });
  B.add(merge(ep), { part: 'epidermis', color: '#cfe7c0', rim: 0.6, rimColor: '#f4ffe8' });
  B.add(merge(en), { part: 'epidermis', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  /* الخليتان الحارستان في المقطع والفتحة بينهما */
  B.add(merge([-1, 1].map(s => place(ellipsoid({ r: [0.17, 0.17, D], rows: 8, cols: 14 }), { at: [s * 0.2, 0.06, 0] }))), { part: 'guard', color: '#5aa85a', rim: 0.8, rimColor: '#e6ffd8', pat: 2, patColor: '#2f8f3a', patK: 16 });
  B.add(place(box(0.1, 0.44, D * 2, 0.4), { at: [0, 0, 0] }), { color: '#13221a', rim: 0.3, rimColor: '#4f7f3a', pop: false });
  /* بخار الماء والأوكسجين يخرجان، CO₂ يدخل عبر الثغر */
  const N = 15;
  const gas = t => { const col = [[], [], []];
    for (let i = 0; i < N; i++){ const k = i % 3, p = (t * 0.3 + i / N * 2) % 1, out = k !== 0, y = out ? 0.6 - p * 2.0 : -1.4 + p * 2.0;
      col[k].push(Object.assign([Math.sin(i * 1.9 + p * 3) * (Math.abs(y) > 0.4 ? 0.4 : 0.03), y, Math.cos(i) * 0.4], { s: 0.06 * Math.sin(p * Math.PI) + 0.001 })); }
    return col; };
  const G0 = gas(0);
  const gO = [CO2, O2, H2O].map((c, k) => B.add(dots(G0[k], 0.06), { color: c, rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }));
  B.label('epidermis', [-1.68, 0.1, D], [0, 0, 1]);
  B.label('guard', [-0.24, 0.12, D * 0.95], [0, 0, 1]);
  B.caption([0, 2.1, 0.8], () => ['', 'داخل الورقة']);
  B.caption([0, -1.75, 0.8], () => ['', 'خارج الورقة']);
  return {
    dist: 7.6, yaw: 0.3, pitch: 0.2, target: [0, 0.1, 0], live2d: true, maxDist: 14,
    anim(t){ const G = gas(t); gO.forEach((o, k) => B.update(o, dots(G[k], 0.06))); }
  };
}

/* ═════════════ 3) وظائف البشرة الثلاث (مراحل) ═════════════ */
function fnModel(B){
  /* أعلى: بشرة ساق/ورقة بزوج خلايا حارسة · أسفل: بشرة جذر فوق التربة */
  const TY = 1.2, RY = -1.0, D = 1.0, ep = [], en = [];
  [TY, RY].forEach(y => { for (let i = -5; i <= 5; i++){ if (y === TY && Math.abs(i) < 1) continue;
    const x = i * 0.46; ep.push(place(box(0.44, 0.4, D * 2), { at: [x, y, 0] })); en.push(place(ellipsoid({ r: 0.06, rows: 5, cols: 8 }), { at: [x, y, D] })); } });
  const epO = B.add(merge(ep), { part: 'epidermis', color: '#cfe7c0', rim: 0.6, rimColor: '#f4ffe8' });
  B.add(merge(en), { part: 'epidermis', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  const gO2 = B.add(merge([-1, 1].map(s => place(ellipsoid({ r: [0.17, 0.17, D], rows: 8, cols: 14 }), { at: [s * 0.2, TY + 0.04, 0] }))), { part: 'guard', color: '#5aa85a', rim: 0.8, rimColor: '#e6ffd8', pat: 2, patColor: '#2f8f3a', patK: 16 });
  B.add(place(box(0.1, 0.42, D * 2, 0.4), { at: [0, TY, 0] }), { color: '#13221a', rim: 0.3, rimColor: '#4f7f3a', pop: false });
  /* داخل الساق/الورقة (أسفل البشرة العليا) وداخل الجذر (أعلى بشرة الجذر) والتربة */
  B.add(merge([-2, -1, 0, 1, 2].map(i => place(ellipsoid({ r: [0.3, 0.26, 0.5], rows: 6, cols: 10 }), { at: [i * 0.7, TY - 0.55, 0] }))), { color: '#5f9a5c', alpha: 0.35, rim: 0.3, rimColor: '#d6f5c4', pop: false });
  B.add(place(box(5.4, 0.9, D * 2 + 0.3, 0.15), { at: [0, RY - 0.7, 0] }), { color: '#4a3523', alpha: 0.55, rim: 0.3, rimColor: '#a88a5c', shell: { size: 5 }, pop: false });
  /* جسيمات كل مرحلة */
  const N = 16, mkDots = col => B.add(dots(new Array(N).fill(null), 0.06), { color: col, rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  const thr = mkDots('#ff8a7a'), co2 = mkDots(CO2), o2 = mkDots(O2), wtr = mkDots(H2O), slt = mkDots('#f4f1e6');
  B.label('epidermis', [2.3, TY + 0.1, D], [0, 0, 1]);
  B.label('guard', [-0.24, TY + 0.14, D * 0.95], [0, 0, 1]);
  B.caption([0, TY + 1.05, 0.6], () => ['', 'بشرة الساق والأوراق']);
  B.caption([0, RY - 1.45, 0.9], () => ['', 'بشرة الجذر (التربة أسفلها)']);
  return {
    dist: 8.6, yaw: 0.15, pitch: 0.35, target: [0, 0.1, 0], live2d: true, noSpin: true, maxDist: 15,
    camGoal: () => EPI_FN_STAGES[STG.idx] && EPI_FN_STAGES[STG.idx].cam,
    anim(t){
      const st = STG.idx, seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));
      B.update(thr, dots(seq(N, i => { if (st !== 0) return null; const top = i % 2 === 0, p = (t * 0.45 + i / N) % 1, d = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
        return Object.assign([-2.2 + (i * 0.61) % 4.4, top ? TY + 0.25 + d * 0.9 : RY - 0.25 - d * 0.9, (i % 3 - 1) * 0.5], { s: 0.07 }); }), 0.07));
      const gas = k => seq(N, i => { if (st !== 1 || i % 2 !== k) return null; const p = (t * 0.32 + i / N) % 1, y = k === 0 ? TY + 1.1 - p * 2.0 : TY - 0.9 + p * 2.0;
        return Object.assign([Math.sin(i * 1.9 + p * 3) * (Math.abs(y - TY) > 0.35 ? 0.5 : 0.03), y, Math.cos(i) * 0.4], { s: 0.06 * Math.sin(p * Math.PI) + 0.001 }); });
      B.update(co2, dots(gas(0), 0.06)); B.update(o2, dots(gas(1), 0.06));
      const up = (n, sp, sz) => seq(N, i => { if (st !== 2 || i >= n) return null; const p = (t * sp + i / n) % 1;
        return Object.assign([-2.2 + (i * 0.73) % 4.4, RY - 1.1 + p * 1.15, (i % 3 - 1) * 0.5], { s: sz * Math.sin(p * Math.PI) + 0.001 }); });
      B.update(wtr, dots(up(16, 0.3, 0.07), 0.07)); B.update(slt, dots(up(8, 0.24, 0.05), 0.05));
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null, lit = f || (st === 1 ? 'guard' : 'epidermis'), pulse = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3));
      epO.rim = lit === 'epidermis' ? pulse : 0.6; gO2.rim = lit === 'guard' ? pulse : 0.8;
    }
  };
}

Object.assign(G3.models, { epi_eleaf: leafModel, epi_esec: secModel, epi_efn: fnModel });
})();
