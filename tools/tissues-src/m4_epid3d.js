
/* ══════════════════════════════════════════════════════════════════════════
   9.4 · مجسّمات البشرة والثغور: سطح البشرة بثغور تنفتح وتنغلق وتبادل
         الغازات، مقطع في البشرة (الكيوتكل والشعيرات)، وثغر مكبّر بمراحل حركته
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
  const pr = B.add(poreMesh(c, L, o, W), { part: 'stoma', color: '#13221a', rim: 0.4, rimColor: '#4f7f3a', center: c });
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
  B.label('stoma', [ST[0][0], 0.14, ST[0][1]], [0, 1, 0]);
  B.caption([0, 0.1, Z + 0.45], () => ['', 'CO₂ يدخل · O₂ وبخار الماء يخرجان من الثغور المفتوحة']);
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
  B.add(merge(mes), { part: 'mesoph', color: '#5f9a5c', alpha: 0.85, rim: 0.6, rimColor: '#d6f5c4' });
  B.add(merge(chl), { part: 'mesoph', color: '#2f8f3a', rim: 0.5, rimColor: '#b6f0a0' });
  B.add(merge(ep), { part: 'epidermis', color: '#cfe7c0', rim: 0.6, rimColor: '#f4ffe8' });
  B.add(merge(en), { part: 'epidermis', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  /* الخليتان الحارستان في المقطع والفتحة بينهما */
  B.add(merge([-1, 1].map(s => place(ellipsoid({ r: [0.17, 0.17, D], rows: 8, cols: 14 }), { at: [s * 0.2, 0.06, 0] }))), { part: 'guard', color: '#5aa85a', rim: 0.8, rimColor: '#e6ffd8', pat: 2, patColor: '#2f8f3a', patK: 16 });
  B.add(place(box(0.1, 0.44, D * 2, 0.4), { at: [0, 0, 0] }), { part: 'stoma', color: '#13221a', rim: 0.3, rimColor: '#4f7f3a' });
  /* الكيوتكل أسفل البشرة */
  const cut = B.add(merge([-1, 1].map(s => place(box(1.95, 0.07, D * 2 + 0.02, 0.2), { at: [s * 1.38, -0.25, 0] }))), { part: 'cuticle', color: '#f2d675', rim: 0.7, rimColor: '#fff3c8' });
  /* الشعيرات */
  const H = [[-1.65, -1], [1.25, 1], [1.95, -1]];
  const hairMesh = t => merge(H.map(([x, s], i) => { const w = Math.sin(t * 1.4 + i) * 0.12;
    return tube({ pts: [[x, -0.28, 0.3], [x + s * 0.05 + w * 0.3, -0.7, 0.3], [x + s * 0.02 + w * 0.7, -1.05, 0.3], [x + s * 0.12 + w, -1.35, 0.3]], r: u => 0.07 * (1 - u * 0.5), sides: 8 }); }));
  const hairO = B.add(hairMesh(0), { part: 'trich', color: '#e8f2d8', rim: 0.7, rimColor: '#ffffff', pop: false, center: [0, -0.8, 0] });
  /* بخار الماء والأوكسجين يخرجان، CO₂ يدخل عبر الثغر */
  const N = 15;
  const gas = t => { const col = [[], [], []];
    for (let i = 0; i < N; i++){ const k = i % 3, p = (t * 0.3 + i / N * 2) % 1, out = k !== 0, y = out ? 0.6 - p * 2.0 : -1.4 + p * 2.0;
      col[k].push(Object.assign([Math.sin(i * 1.9 + p * 3) * (Math.abs(y) > 0.4 ? 0.4 : 0.03), y, Math.cos(i) * 0.4], { s: 0.06 * Math.sin(p * Math.PI) + 0.001 })); }
    return col; };
  const G0 = gas(0);
  const gO = [CO2, O2, H2O].map((c, k) => B.add(dots(G0[k], 0.06), { color: c, rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }));
  B.label('mesoph', [1.5, 1.4, D * 0.9], [0, 0, 1]);
  B.label('epidermis', [-1.68, 0.1, D], [0, 0, 1]);
  B.label('cuticle', [-1.0, -0.29, D], [0, -0.4, 1]);
  B.label('trich', [1.95, -1.0, 0.35], [0, 0, 1]);
  B.label('guard', [-0.24, 0.12, D * 0.95], [0, 0, 1]);
  B.label('stoma', [0, -0.15, D], [0, 0, 1]);
  B.caption([0, 2.1, 0.8], () => ['', 'داخل الورقة']);
  B.caption([0, -1.75, 0.8], () => ['', 'خارج الورقة']);
  return {
    dist: 7.6, yaw: 0.3, pitch: 0.2, target: [0, 0.1, 0], live2d: true, maxDist: 14,
    anim(t){ B.update(hairO, hairMesh(t)); const G = gas(t); gO.forEach((o, k) => B.update(o, dots(G[k], 0.06))); cut.rim = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2)); }
  };
}

/* ═════════════ 3) ثغر مكبّر بمراحل فتحه وغلقه ═════════════ */
function stomModel(B){
  const C = [0, 0.18, 0], L = 1.15, W = 0.62;
  epiSlab(B, 2.8, 1.9, 0, 23);
  const S = stomaObjs(B, C, L, W, 0);
  const nuc = B.add(dots([[-0.3, 0.2, 0], [0.3, 0.2, 0]], 0.09), { part: 'guard', color: '#7565c2', rim: 0.6, rimColor: '#d8d0ff', center: C });
  /* الماء يدخل الخليتين أو يخرج منهما */
  const NW = 12, rnd = srng(2);
  const W0 = Array.from({ length: NW }, (_, i) => ({ s: i % 2 ? 1 : -1, z: (rnd() - 0.5) * L * 1.4, ph: i / NW }));
  const wtr = (t, mode) => W0.map(w => { if (!mode) return null; const p = (t * 0.5 + w.ph) % 1, f = mode > 0 ? p : 1 - p;
    return Object.assign([w.s * (1.9 - f * 1.4), 0.32, w.z], { s: 0.07 * Math.sin(p * Math.PI) + 0.001 }); });
  const wO = B.add(dots(wtr(0, 0), 0.07), { color: H2O, rim: 0.9, rimColor: '#e8f7ff', pop: false, center: [0, 0, 0] });
  const NG = 18;
  const gas = (t, on) => { const col = [[], [], []];
    for (let i = 0; i < NG; i++){ const k = i % 3, p = (t * 0.35 + i / NG * 3) % 1, inward = k === 0, d = inward ? 1 - p : p, ang = i * 2.1;
      col[k].push(on ? Object.assign([Math.cos(ang) * d * 0.25, 0.25 + d * 1.4, Math.sin(ang) * d * 0.5], { s: 0.07 * Math.sin(p * Math.PI) + 0.001 }) : null); }
    return col; };
  const gO = [CO2, O2, H2O].map((c, k) => B.add(dots(gas(0, false)[k], 0.07), { color: c, rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }));
  B.label('epidermis', [2.0, 0.1, -1.3], [0, 1, 0]);
  B.label('guard', [W * 0.9, 0.5, -0.3], [0, 1, 0.2]);
  B.label('stoma', [0, 0.2, 0.55], [0, 1, 0.3]);
  B.caption([0, 0.2, 2.3], () => { const s = STOMA_STAGES[STG.idx]; return s ? ['المرحلة ' + (STG.idx + 1) + ': ' + s.n] : []; });
  let lastO = -1;
  return {
    dist: 6.4, yaw: 0.1, pitch: 1.0, live2d: true, noSpin: true, minDist: 3,
    camGoal: () => STOMA_STAGES[STG.idx] && STOMA_STAGES[STG.idx].cam,
    anim(t){
      const st = STG.idx, k = STG.k, o = st === 0 ? 0 : st === 1 ? k : st === 2 ? 1 : 1 - k;
      if (Math.abs(o - lastO) > 0.01){ lastO = o; S.set(o); const a = 0.02 + 0.3 * W * o;
        B.update(nuc, dots([[-(a + W * 0.5), 0.2 + W * 0.3, 0], [a + W * 0.5, 0.2 + W * 0.3, 0]], 0.09)); }
      B.update(wO, dots(wtr(t, st === 1 ? 1 : st === 3 ? -1 : 0), 0.07));
      const G = gas(t, st === 2); gO.forEach((obj, i) => B.update(obj, dots(G[i], 0.07)));
    }
  };
}

Object.assign(G3.models, { epi_eleaf: leafModel, epi_esec: secModel, epi_estom: stomModel });
})();
