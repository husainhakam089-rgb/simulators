
/* ══════════════════════════════════════════════════════════════════════════
   9.8 · مجسّمات النسيج العصبي: عصبون كامل يسري فيه السيال بالمراحل، محور
         مغلف بالمايلين يقفز فيه السيال بين عقد رانفير، ونسيج من عصبونات وخلايا ساندة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;
const CELL = '#e3b86a', CELL_R = '#fff0c8', MY = '#eef2f7', NODE = '#ffd166', IMP = '#7ff0ff', NUC = '#7565c2', GLIA = '#9bc88a';
const toX = [0, 0, Math.PI / 2];
const blob = (r, seed, amt) => { const q = srng(seed), a = [q() * 6, q() * 6, q() * 6];
  return d => 1 + amt * (Math.sin(d[0] * 3 + a[0]) * Math.sin(d[1] * 2.6 + a[1]) + 0.6 * Math.sin(d[2] * 3.4 + a[2])); };
/* نقطة على مسار متعدد الأجزاء عند نسبة u */
const along = (P, u) => { const L = []; let tot = 0;
  for (let i = 1; i < P.length; i++){ const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]); L.push(d); tot += d; }
  let s = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < L.length; i++){ if (s <= L[i]){ const k = L[i] ? s / L[i] : 0; return [0, 1, 2].map(j => P[i][j] + (P[i + 1][j] - P[i][j]) * k); } s -= L[i]; }
  return P[P.length - 1]; };
/* زوائد شجيرية متفرعة تخرج من نقطة باتجاه معين */
function dendrites(at, dirs, seed, R){
  const q = srng(seed), out = [], tips = [];
  dirs.forEach(d => {
    const a = add(at, d.map(v => v * R * 0.8)), b = add(at, d.map((v, i) => v * R * 2.6 + (q() - 0.5) * 0.3 * (i === 2 ? 1 : 0)));
    out.push(tube({ pts: spline([a, add(a, d.map(v => v * R * 0.9)), b], 4), r: u => R * 0.22 * (1 - 0.55 * u), sides: 8 }));
    for (let k = 0; k < 2; k++){ const side = k ? 1 : -1, c = add(b, [d[0] * R * 1.2 - d[1] * side * R * 0.8, d[1] * R * 1.2 + d[0] * side * R * 0.8, (q() - 0.5) * R * 0.8]);
      out.push(tube({ pts: [b, c], r: u => R * 0.1 * (1 - 0.6 * u), sides: 6 })); if (k === 0) tips.push(c); }
  });
  return { m: merge(out), tips };
}

/* ═════ 1) العصبون ومسار السيال (المراحل) ═════ */
function neuronModel(B){
  const S = [-1.6, 0, 0], AX0 = -1.05, AX1 = 2.6, R = 0.55;
  B.add(place(ellipsoid({ r: [R, R * 0.9, R * 0.85], rows: 14, cols: 20, disp: blob(R, 3, 0.08) }), { at: S }), { part: 'soma', color: CELL, alpha: 0.6, rim: 0.7, rimColor: CELL_R, shell: { size: R, inner: 'nNuc' } });
  B.add(place(ellipsoid({ r: 0.22, rows: 10, cols: 14 }), { at: S }), { part: 'nNuc', color: NUC, rim: 0.6, rimColor: '#d8d0ff' });
  const D = dendrites(S, [[-1, 0.55, 0], [-1, -0.1, 0.35], [-0.75, -0.75, -0.2], [-0.2, 1, 0.15], [-0.15, -1, 0.1]].map(v => { const l = Math.hypot(...v); return v.map(x => x / l); }), 5, R);
  B.add(D.m, { part: 'dendr', color: CELL, rim: 0.6, rimColor: CELL_R });
  /* المحور + غمد المايلين بقطع منفصلة تفصل بينها عقد رانفير */
  B.add(tube({ pts: [[S[0] + R * 0.7, 0, 0], [AX1, 0, 0]], r: 0.09, sides: 12 }), { part: 'axon', color: CELL, rim: 0.6, rimColor: CELL_R });
  const segL = 0.62, gap = 0.12, my = [], nodes = [], NX = [];
  for (let x = AX0 + 0.05; x + segL <= AX1 - 0.15; x += segL + gap){
    my.push(place(capsule({ r: 0.2, len: segL - 0.36, rows: 5, cols: 16 }), { rot: toX, at: [x + segL / 2, 0, 0] }));
    NX.push(x + segL + gap / 2);
  }
  NX.pop();
  NX.forEach(x => nodes.push(place(tube({ pts: [[x - 0.04, 0, 0], [x + 0.04, 0, 0]], r: 0.11, sides: 12 }), {})));
  B.add(merge(my), { part: 'myelin', color: MY, alpha: 0.9, rim: 0.6, rimColor: '#9fb3c8' });
  const nodeO = B.add(merge(nodes), { part: 'ranvier', color: NODE, rim: 0.7, rimColor: '#fff3c0' });
  /* النهايات العصبية: تفرعات تنتهي بانتفاخات */
  const ends = [[3.35, 0.55, 0.15], [3.5, 0.1, -0.2], [3.45, -0.35, 0.25], [3.25, -0.7, -0.1]];
  B.add(merge(ends.map(e => tube({ pts: spline([[AX1 - 0.05, 0, 0], [AX1 + 0.35, e[1] * 0.5, e[2] * 0.5], e], 4), r: 0.05, sides: 6 }))
    .concat(ends.map(e => place(ellipsoid({ r: 0.11, rows: 7, cols: 10 }), { at: e })))), { part: 'axTerm', color: CELL, rim: 0.7, rimColor: CELL_R });
  const tip = D.tips[0], path0 = [tip, add(S, [-R * 2.6 * 0.86, R * 2.6 * 0.48, 0]), add(S, [-R * 0.8 * 0.86, R * 0.8 * 0.48, 0]), S];
  const hop = k => { const pts = [AX0].concat(NX, [AX1]), n = pts.length - 1, f = k * n, i = Math.min(n - 1, Math.floor(f)), r = f - i, e = r < 0.75 ? 0 : (r - 0.75) / 0.25;
    return [pts[i] + (pts[i + 1] - pts[i]) * e, 0, 0]; };
  const posAt = (st, k) => st === 0 ? along(path0, k) : st === 1 ? along([S, [AX0, 0, 0]], k) : st === 2 ? hop(k) : along([[AX1, 0, 0], [AX1 + 0.35, 0.05, 0], ends[1]], k);
  const imp = B.add(place(ellipsoid({ r: 0.13, rows: 7, cols: 10 }), { at: tip }), { color: IMP, rim: 1.2, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('dendr', D.tips[1], [0, 1, 0.3]);
  B.label('soma', add(S, [0, -R * 0.9, 0.2]), [0, -1, 0.4]);
  B.label('nNuc', add(S, [0, 0.1, 0.22]), [0, 0, 1]);
  B.label('axon', [AX1 - 0.1, 0.09, 0], [0, 1, 0.3]);
  B.label('myelin', [AX0 + 0.05 + segL * 2.5 + gap * 2, 0.2, 0], [0, 1, 0.2]);
  B.label('ranvier', [NX[1], -0.11, 0], [0, -1, 0.3]);
  B.label('axTerm', ends[0], [0.3, 1, 0.3]);
  B.caption([0.4, -1.5, 0.6], () => { const s = NRV_STAGES[STG.idx]; return s ? ['المرحلة ' + (STG.idx + 1) + ': ' + s.n] : []; });
  let last = -1;
  return {
    dist: 8.2, yaw: 0.1, pitch: 0.3, live2d: true, noSpin: true, maxDist: 14,
    camGoal: () => NRV_STAGES[STG.idx] && NRV_STAGES[STG.idx].cam,
    anim(t){
      nodeO.rim = STG.idx === 2 ? 0.7 + 0.8 * (0.5 + 0.5 * Math.sin(t * 6)) : 0.7;
      if (t - last < 0.03) return; last = t;
      B.update(imp, place(ellipsoid({ r: 0.13 * (1 + 0.2 * Math.sin(t * 12)), rows: 7, cols: 10 }), { at: posAt(STG.idx, STG.k) }));
    }
  };
}

/* ═════ 2) المحور وغمد المايلين (مقطع مكبّر، السيال يقفز) ═════ */
function axonModel(B){
  const X0 = -3.4, X1 = 3.4, segL = 1.5, gap = 0.36, NX = [], my = [], wraps = [];
  B.add(tube({ pts: [[X0 - 0.2, 0, 0], [X1 + 0.2, 0, 0]], r: 0.24, sides: 18 }), { part: 'axon', color: CELL, rim: 0.6, rimColor: CELL_R });
  for (let x = X0; x + segL <= X1 + 0.01; x += segL + gap){
    my.push(place(capsule({ r: 0.62, len: segL - 1.0, rows: 8, cols: 24 }), { rot: toX, at: [x + segL / 2, 0, 0] }));
    for (let k = 1; k < 6; k++) wraps.push(tube({ pts: Array.from({ length: 25 }, (_, j) => { const a = j / 24 * 6.2832; return [x + 0.2 + k * (segL - 0.4) / 6, Math.cos(a) * 0.625, Math.sin(a) * 0.625]; }), r: 0.012, sides: 4, closed: true }));
    if (x + segL + gap <= X1 + 0.01) NX.push(x + segL + gap / 2);
  }
  B.add(merge(my), { part: 'myelin', color: MY, alpha: 0.78, rim: 0.7, rimColor: '#9fb3c8', pat: 1, patColor: '#c8d6e6', patK: 30 });
  B.add(merge(wraps), { part: 'myelin', color: '#9fb3c8', pop: false });
  const nodeO = B.add(merge(NX.map(x => tube({ pts: [[x - gap / 2 + 0.03, 0, 0], [x + gap / 2 - 0.03, 0, 0]], r: 0.27, sides: 18 }))), { part: 'ranvier', color: NODE, rim: 0.7, rimColor: '#fff3c0' });
  const imp = B.add(place(ellipsoid({ r: 0.3, rows: 8, cols: 12 }), { at: [X0, 0, 0] }), { color: IMP, rim: 1.2, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('myelin', [X0 + segL / 2, 0.62, 0], [0, 1, 0.3]);
  B.label('ranvier', [NX[1], 0.27, 0], [0, 1, 0.3]);
  B.label('axon', [X1 + 0.1, 0.24, 0], [0.4, 1, 0.3]);
  B.caption([0, -1.3, 0.6], () => ['', 'السيال يقفز من عقدة رانفير إلى أخرى فينتقل بسرعة']);
  let last = -1;
  return {
    dist: 8.4, yaw: 0.35, pitch: 0.3, live2d: true,
    anim(t){
      const pts = [X0].concat(NX, [X1]), n = pts.length - 1, f = ((t * 0.5 * (focusOwner ? 0.6 : 1)) % 1) * n, i = Math.min(n - 1, Math.floor(f)), r = f - i, e = r < 0.7 ? 0 : (r - 0.7) / 0.3;
      nodeO.rim = 0.7 + 0.8 * (r < 0.7 ? 1 - r / 0.7 : 0);
      if (t - last < 0.03) return; last = t;
      B.update(imp, place(ellipsoid({ r: 0.3 * (1 + 0.25 * Math.sin(t * 14)), rows: 8, cols: 12 }), { at: [pts[i] + (pts[i + 1] - pts[i]) * e, 0, 0] }));
    }
  };
}

/* ═════ 3) النسيج العصبي: عصبونات متصلة وخلايا ساندة ═════ */
function tissueModel(B){
  const q = srng(17), N = [[-3.0, 0.9, 0], [-0.9, -0.8, 0.4], [1.2, 0.8, -0.3], [3.0, -0.6, 0.2]], body = [], paths = [];
  N.forEach((p, i) => {
    body.push(place(ellipsoid({ r: 0.36, rows: 10, cols: 14, disp: blob(0.36, 9 + i, 0.1) }), { at: p }));
    body.push(dendrites(p, [[-1, 0.4, 0], [-1, -0.4, 0.3], [-0.3, 1, -0.2], [-0.3, -1, 0.2]].map(v => { const l = Math.hypot(...v); return v.map(x => x / l); }), 20 + i, 0.32).m);
    if (i < N.length - 1){ const nx = N[i + 1], e = add(nx, [-0.75, (p[1] > nx[1] ? 0.25 : -0.25), 0]), mid = [(p[0] + e[0]) / 2, (p[1] + e[1]) / 2 + (i % 2 ? -0.5 : 0.5), (p[2] + e[2]) / 2];
      const P = spline([add(p, [0.3, 0, 0]), mid, e], 8); body.push(tube({ pts: P, r: 0.06, sides: 8 }));
      [-0.12, 0, 0.12].forEach(o => body.push(place(ellipsoid({ r: 0.08, rows: 6, cols: 8 }), { at: add(e, [0.06, o, o * 0.5]) })));
      paths.push(P.concat([add(nx, [-0.3, 0, 0])])); }
  });
  B.add(merge(body), { part: 'neuron', color: CELL, rim: 0.7, rimColor: CELL_R });
  B.add(merge(N.map(p => place(ellipsoid({ r: 0.13, rows: 8, cols: 10 }), { at: add(p, [0, 0, 0.26]) }))), { part: 'neuron', color: NUC, rim: 0.5, rimColor: '#d8d0ff', pop: false });
  const gl = [];
  for (let i = 0; i < 40 && gl.length < 18; i++){ const p = [-3.6 + q() * 7.2, -1.6 + q() * 3.2, -0.8 + q() * 1.6];
    if (N.some(n => Math.hypot(p[0] - n[0], p[1] - n[1]) < 0.9)) continue; gl.push(p); }
  B.add(merge(gl.map((p, i) => place(ellipsoid({ r: 0.11 + q() * 0.05, rows: 8, cols: 10, disp: blob(0.2, 40 + i, 0.12) }), { at: p }))), { part: 'glia', color: GLIA, rim: 0.6, rimColor: '#e6ffd8' });
  B.add(place(ellipsoid({ r: [4.3, 2.2, 1.3], rows: 14, cols: 24 }), {}), { part: 'tNerve', color: '#5a4e8a', alpha: 0.12, rim: 0.4, rimColor: '#b8a8ff', shell: { size: 4.3 }, pop: false });
  const imp = B.add(place(ellipsoid({ r: 0.12, rows: 6, cols: 8 }), { at: N[0] }), { color: IMP, rim: 1.2, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('neuron', add(N[2], [0, 0.36, 0]), [0, 1, 0.3]);
  B.label('glia', gl[0], [0, 1, 0.3]);
  B.label('tNerve', [-3.6, -1.6, 0.4], [0, -1, 0.3]);
  B.caption([0, -2.0, 0.6], () => ['', 'ينتقل السيال من نهايات عصبون إلى زوائد العصبون التالي']);
  let last = -1;
  return {
    dist: 9.4, yaw: 0.2, pitch: 0.3, live2d: true, compactK: 1.2,
    anim(t){ if (t - last < 0.03) return; last = t;
      const n = paths.length, f = (t * 0.25) % 1 * n, i = Math.floor(f);
      B.update(imp, place(ellipsoid({ r: 0.12, rows: 6, cols: 8 }), { at: along(paths[i], f - i) })); }
  };
}

Object.assign(G3.models, { nrv_nneuron: neuronModel, nrv_naxon: axonModel, nrv_ntissue: tissueModel });
})();
