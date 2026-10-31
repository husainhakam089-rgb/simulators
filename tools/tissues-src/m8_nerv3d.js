
/* ══════════════════════════════════════════════════════════════════════════
   9.8 · مجسّمات النسيج العصبي (ملزمة ص80–85): العصبونة بأجزائها والحوافز
         بالمراحل، أنواع الخلايا العصبية حسب عدد البروزات، والخلايا الدبقية
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;
const CELL = '#9fb0ea', CELL_R = '#e6ecff', MY = '#f0c0c8', NODE = '#c87a8a', IMP = '#7ff0ff', NUC = '#7565c2', GLIA = '#9bc88a';
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

/* ═════ 1) العصبونة: جسم الخلية (نواة ونوية وحبيبات نسل)، التشجرات، المحور والغلاف النخاعيني ═════ */
function neuronModel(B){
  const S = [-1.6, 0, 0], AX0 = -1.05, AX1 = 2.6, R = 0.55;
  B.add(place(ellipsoid({ r: [R, R * 0.9, R * 0.85], rows: 14, cols: 20, disp: blob(R, 3, 0.08) }), { at: S }), { part: 'soma', color: CELL, alpha: 0.6, rim: 0.7, rimColor: CELL_R, shell: { size: R, inner: 'nNuc' } });
  B.add(place(ellipsoid({ r: 0.22, rows: 10, cols: 14 }), { at: S }), { part: 'nNuc', color: NUC, rim: 0.6, rimColor: '#d8d0ff' });
  B.add(place(ellipsoid({ r: 0.07, rows: 6, cols: 8 }), { at: add(S, [0.07, 0.07, 0.17]) }), { part: 'nNuc', color: '#2a1f60', rim: 0.6, rimColor: '#ffffff' });
  /* حبيبات نسل في سايتوبلازم جسم الخلية */
  const nq = srng(11), NI = Array.from({ length: 14 }, () => { const a = nq() * 6.28, b = 0.5 + nq() * 2.1; return add(S, [Math.cos(a) * Math.sin(b) * R * 0.9, Math.cos(b) * R * 0.8, Math.abs(Math.sin(a) * Math.sin(b)) * R * 0.85 + 0.03]); });
  B.add(merge(NI.map(p => place(ellipsoid({ r: [0.06, 0.035, 0.03], rows: 5, cols: 6 }), { at: p, rot: [0, 0, p[0] * 3] }))), { part: 'nissl', color: '#2a3a8a', rim: 0.6, rimColor: '#c8d0ff' });
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
  const nodeO = B.add(merge(nodes), { color: NODE, rim: 0.7, rimColor: '#ffd8e0' });
  /* تفرعات نهاية المحور */
  const ends = [[3.35, 0.55, 0.15], [3.5, 0.1, -0.2], [3.45, -0.35, 0.25], [3.25, -0.7, -0.1]];
  B.add(merge(ends.map(e => tube({ pts: spline([[AX1 - 0.05, 0, 0], [AX1 + 0.35, e[1] * 0.5, e[2] * 0.5], e], 4), r: 0.05, sides: 6 }))
    ), { part: 'axon', color: CELL, rim: 0.7, rimColor: CELL_R });
  const tip = D.tips[0], path0 = [tip, add(S, [-R * 2.6 * 0.86, R * 2.6 * 0.48, 0]), add(S, [-R * 0.8 * 0.86, R * 0.8 * 0.48, 0]), S];
  const posAt = (st, k) => st === 0 ? along(path0, k) : st === 1 ? along([S, [AX0, 0, 0]], k) : along([[AX0, 0, 0], [AX1, 0, 0], [AX1 + 0.35, 0.05, 0], ends[1]], k);
  const imp = B.add(place(ellipsoid({ r: 0.13, rows: 7, cols: 10 }), { at: tip }), { color: IMP, rim: 1.2, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('dendr', D.tips[1], [0, 1, 0.3]);
  B.label('soma', add(S, [0, -R * 0.9, 0.2]), [0, -1, 0.4]);
  B.label('nNuc', add(S, [0, 0.1, 0.22]), [0, 0, 1]);
  B.label('axon', [AX1 - 0.1, 0.09, 0], [0, 1, 0.3]);
  B.label('myelin', [AX0 + 0.05 + segL * 2.5 + gap * 2, 0.2, 0], [0, 1, 0.2]);
  B.label('nissl', NI.sort((p, q) => q[2] - p[2])[0], [0.3, -1, 0.5]);
  B.caption([0.4, -1.5, 0.6], () => { const s = NRV_STAGES[STG.idx]; return s ? [s.n] : []; });
  let last = -1;
  return {
    dist: 8.2, yaw: 0.1, pitch: 0.3, live2d: true, noSpin: true, maxDist: 14,
    camGoal: () => NRV_STAGES[STG.idx] && NRV_STAGES[STG.idx].cam,
    anim(t){
      if (t - last < 0.03) return; last = t;
      B.update(imp, place(ellipsoid({ r: 0.13 * (1 + 0.2 * Math.sin(t * 12)), rows: 7, cols: 10 }), { at: posAt(STG.idx, STG.k) }));
    }
  };
}

/* عصبونة صغيرة: نوعها type، حول at، بمقياس k */
function miniNeuron(type, at, k, seed){
  const out = [], my = [], q = srng(seed), R0 = 0.32 * k, L = 2.0 * k, a = add(at, [R0, 0, 0]);
  const tw = (p, dir) => { const e = add(p, [dir * 0.35 * k, 0, 0]); out.push(tube({ pts: [p, e], r: 0.03 * k, sides: 5 }));
    [-1, 1].forEach(s => out.push(tube({ pts: [e, add(e, [dir * 0.22 * k, s * 0.2 * k, (q() - 0.5) * 0.1])], r: 0.02 * k, sides: 4 }))); };
  const myel = (x0, x1, y) => { for (let x = x0 + 0.06; x + 0.3 * k <= x1; x += 0.36 * k) my.push(place(capsule({ r: 0.07 * k, len: 0.14 * k, rows: 4, cols: 10 }), { rot: toX, at: [x + 0.15 * k, y, at[2]] })); };
  let soma;
  if (type === 'multi'){ soma = place(ellipsoid({ r: R0 * 1.15, rows: 10, cols: 14, disp: blob(R0, seed, 0.12) }), { at });
    out.push(dendrites(at, [[-1, 0.5, 0], [-1, -0.4, 0.3], [-0.3, 1, 0], [-0.3, -1, 0.1], [0.3, 1, -0.2]].map(v => { const l = Math.hypot(...v); return v.map(x => x / l); }), seed, R0).m);
    out.push(tube({ pts: [a, add(a, [L, 0, 0])], r: 0.045 * k, sides: 8 })); tw(add(a, [L, 0, 0]), 1); myel(a[0], a[0] + L, at[1]); }
  else if (type === 'bi'){ soma = place(ellipsoid({ r: [R0 * 1.3, R0 * 0.75, R0 * 0.75], rows: 10, cols: 14 }), { at });
    const d0 = add(at, [-R0 * 1.25, 0, 0]), d1 = add(at, [-R0 * 1.25 - 0.9 * k, 0, 0]); out.push(tube({ pts: [d0, d1], r: 0.04 * k, sides: 8 })); tw(d1, -1);
    const a0 = add(at, [R0 * 1.25, 0, 0]); out.push(tube({ pts: [a0, add(a0, [L, 0, 0])], r: 0.04 * k, sides: 8 })); tw(add(a0, [L, 0, 0]), 1); }
  else if (type === 'pseudo'){ const b = add(at, [0, 0.55 * k, 0]); soma = place(ellipsoid({ r: R0, rows: 10, cols: 14 }), { at: b });
    out.push(tube({ pts: [add(b, [0, -R0, 0]), at], r: 0.04 * k, sides: 8 }));
    const d1 = add(at, [-1.1 * k, 0, 0]), a1 = add(at, [L * 0.9, 0, 0]); out.push(tube({ pts: [d1, a1], r: 0.04 * k, sides: 8 })); tw(d1, -1); tw(a1, 1);
    myel(d1[0], at[0] - 0.05, at[1]); myel(at[0] + 0.05, a1[0], at[1]); }
  else { soma = place(ellipsoid({ r: [R0, R0 * 0.9, R0 * 0.9], rows: 10, cols: 14 }), { at });
    out.push(tube({ pts: [a, add(a, [L * 0.8, 0, 0])], r: 0.04 * k, sides: 8 })); tw(add(a, [L * 0.8, 0, 0]), 1); }
  return { body: merge(out.concat([soma])), my: my.length ? merge(my) : null, somaAt: type === 'pseudo' ? add(at, [0, 0.55 * k, 0]) : at };
}

/* ═════ 2) أنواع الخلايا العصبية تبعاً لعدد البروزات (ص83–84) ═════ */
function typesModel(B){
  const T = [['multi', 'nMulti', [-2.6, 0.9, 0], 'متعددة الأقطاب'], ['bi', 'nBi', [1.0, 0.9, 0], 'ثنائية القطب'], ['pseudo', 'nPseudo', [-1.6, -1.3, 0], 'أحادية القطب كاذبة'], ['uni', 'nUni', [1.0, -1.1, 0], 'أحادية القطب']];
  T.forEach(([ty, id, at, name], i) => { const n = miniNeuron(ty, at, 1, 30 + i);
    B.add(n.body, { part: id, color: CELL, rim: 0.7, rimColor: CELL_R });
    if (n.my) B.add(n.my, { part: id, color: MY, rim: 0.6, rimColor: NODE });
    B.add(place(ellipsoid({ r: 0.12, rows: 8, cols: 10 }), { at: add(n.somaAt, [0, 0, 0.25]) }), { part: id, color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
    B.label(id, add(n.somaAt, [0, 0.33, 0]), [0, 1, 0.4]);
    B.caption(add(at, [0.6, -0.55, 0.3]), () => [name]); });
  return { dist: 9.4, yaw: 0.1, pitch: 0.2, live2d: true, compactK: 1.2 };
}

/* ═════ 3) الخلايا الدبقية: الدعم والإسناد وابتلاع البكتريا والفتات الخلوي ═════ */
function gliaModel(B){
  const q = srng(17), N = [[-1.9, 0.6, 0], [1.0, -0.7, 0.2]];
  N.forEach((p, i) => { const n = miniNeuron('multi', p, 1, 50 + i); B.add(n.body, { part: 'neuron', color: CELL, rim: 0.7, rimColor: CELL_R }); if (n.my) B.add(n.my, { part: 'neuron', color: MY, rim: 0.6, rimColor: NODE });
    B.add(place(ellipsoid({ r: 0.13, rows: 8, cols: 10 }), { at: add(p, [0, 0, 0.3]) }), { part: 'neuron', color: NUC, rim: 0.5, rimColor: '#d8d0ff', pop: false }); });
  const gl = [];
  for (let i = 0; i < 200 && gl.length < 34; i++){ const p = [-3.8 + q() * 7.6, -1.8 + q() * 3.6, -0.9 + q() * 1.8];
    if (N.some(n => Math.abs(p[1] - n[1]) < 0.45 && p[0] > n[0] - 1.2 && p[0] < n[0] + 2.6) || gl.some(g => Math.hypot(p[0] - g[0], p[1] - g[1], p[2] - g[2]) < 0.45)) continue; gl.push(p); }
  const gm = gl.map((p, i) => merge([place(ellipsoid({ r: 0.12 + q() * 0.04, rows: 8, cols: 10, disp: blob(0.2, 40 + i, 0.12) }), { at: p })].concat([0, 1, 2].map(k => { const a = q() * 6.28; return tube({ pts: [p, add(p, [Math.cos(a) * 0.3, Math.sin(a) * 0.3, (q() - 0.5) * 0.2])], r: 0.025, sides: 4 }); }))));
  B.add(merge(gm), { part: 'glia', color: GLIA, rim: 0.6, rimColor: '#e6ffd8' });
  B.add(place(ellipsoid({ r: [4.3, 2.3, 1.3], rows: 14, cols: 24 }), {}), { part: 'tNerve', color: '#5a4e8a', alpha: 0.12, rim: 0.4, rimColor: '#b8a8ff', shell: { size: 4.3 }, pop: false });
  const tg = gl.filter(p => p[2] > 0).slice(0, 5);
  const db = t => merge(tg.map((g, i) => { const p = (t * 0.18 + i / 5) % 1; return place(ellipsoid({ r: [0.09, 0.05, 0.05], rows: 5, cols: 8 }), { at: add(g, [0.6 * (1 - p), 0.45 * (1 - p), 0.1]), s: p < 0.85 ? 1 : Math.max(0.01, (1 - p) / 0.15) }); }));
  const dO = B.add(db(0), { part: 'debris', color: '#c87a3a', rim: 0.6, rimColor: '#ffd8a8', pop: false, center: [0, 0, 0] });
  const dl = add(tg[0], [0.6, 0.45, 0.1]);
  B.label('neuron', add(N[1], [0, 0.4, 0]), [0, 1, 0.3]);
  B.label('glia', gl[0], [0, 1, 0.3]);
  B.label('debris', dl, [0.4, 1, 0.3]);
  B.label('tNerve', [-3.6, -1.7, 0.4], [0, -1, 0.3]);
  B.caption([0, -2.1, 0.6], () => ['', 'خلية عصبية واحدة لكل 50 خلية دبقية — الدعم والإسناد وابتلاع البكتريا والفتات الخلوي']);
  return { dist: 9.6, yaw: 0.2, pitch: 0.3, live2d: true, compactK: 1.2,
    anim(t){ B.update(dO, db(t)); const p = (t * 0.18) % 1; dl[0] = tg[0][0] + 0.6 * (1 - p); dl[1] = tg[0][1] + 0.45 * (1 - p); } };
}

Object.assign(G3.models, { nrv_nneuron: neuronModel, nrv_ntypes: typesModel, nrv_nglia: gliaModel });
})();
