
/* ══════════════════════════════════════════════════════════════════════════
   9.6 · مجسّمات النسيج الضام: الضام الأصيل يُشدّ ويرجع، الغضروف بأنواعه
         يُضغط ويرجع، جهاز هافرس مقطوع، الدم يجري في وعاء، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, sub, mul, norm, ellipsoid, superEll, tube, place, merge, spline, srng, computeNormals, mk } = G3;
const ball = ellipsoid({ r: 1, rows: 6, cols: 10 });
const dots = (list, r, mesh) => merge(list.map(p => place(mesh || ball, { at: p ? p : [0, -60, 0], s: p ? (p.s || r) : 0.0001 })));
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.25, rows: 6, cols: 12 });
function lathe(prof, cols, a0, a1){
  const m = mk(), R = prof.length, C = cols || 32, full = a0 === undefined, A0 = full ? 0 : a0, A1 = full ? 6.2832 : a1, CC = full ? C : C + 1;
  for (let i = 0; i < R; i++){ const [r, y] = prof[i]; for (let j = 0; j < CC; j++){ const a = A0 + (A1 - A0) * j / C, p = [r * Math.cos(a), y, r * Math.sin(a)]; m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0); } }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C; j++){ const a = i * CC + j, b = i * CC + (full ? (j + 1) % C : j + 1), c = a + CC, d = b + CC; m.i.push(a, b, c, b, d, c); }
  return computeNormals(m);
}
/* ليف متموّج بين نقطتين، amp يقل عند الشد */
function fiber(a, b, amp, n, r, ph){
  const d = sub(b, a), L = Math.hypot(d[0], d[1], d[2]), t = norm(d), up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const nx = norm([t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]);
  const pts = []; for (let i = 0; i <= 24; i++){ const u = i / 24; pts.push(add(add(a, mul(d, u)), mul(nx, Math.sin(u * n * Math.PI * 2 + (ph || 0)) * amp))); }
  return tube({ pts, r, sides: 6 });
}

/* ═════════════ 1) الضام الأصيل: يُشدّ فتستقيم الألياف ثم يرجع ═════════════ */
function looseModel(B){
  const rnd = srng(12), W = 2.6, H = 1.4, D = 1.0;
  B.add(place(box(2 * W, 2 * H, 2 * D, 0.2), { at: [0, 0, 0] }), { part: 'matrixC', color: '#d9cde6', alpha: 0.18, rim: 0.8, rimColor: '#f0e8ff', shell: { size: 6 } });
  const C = Array.from({ length: 6 }, (_, i) => ({ a: [-W + 0.1, -H + 0.3 + i * 0.45, -D + 0.2 + rnd() * 1.6], b: [W - 0.1, -H + 0.2 + rnd() * 2.4, -D + 0.2 + rnd() * 1.6], ph: i }));
  const E = Array.from({ length: 9 }, (_, i) => { const a = [-W + 0.3 + rnd() * (2 * W - 0.6), -H + 0.3 + rnd() * (2 * H - 0.6), -D + 0.2 + rnd() * 1.6], ang = rnd() * 6.28, L = 0.9 + rnd() * 0.9;
    return { a, b: add(a, [Math.cos(ang) * L, Math.sin(ang) * L * 0.6, (rnd() - 0.5) * 0.6]), ph: i }; });
  const colMesh = k => merge(C.map(f => fiber(f.a, f.b, 0.16 * (1 - 0.85 * k), 3, 0.075, f.ph)));
  const elaMesh = k => merge(E.map(f => fiber(f.a, f.b, 0.07 * (1 - 0.9 * k), 2.5, 0.022, f.ph)));
  const colO = B.add(colMesh(0), { part: 'colFib', color: '#e58aa0', rim: 0.7, rimColor: '#ffd8e2', center: [0, 0, 0] });
  const elaO = B.add(elaMesh(0), { part: 'elaFib', color: '#4a3a6a', rim: 0.7, rimColor: '#b8a8e8', center: [0, 0, 0] });
  const fb = [], fn = [];
  for (let i = 0; i < 7; i++){ const at = [-W + 0.6 + rnd() * (2 * W - 1.2), -H + 0.4 + rnd() * (2 * H - 0.8), -D + 0.3 + rnd() * 1.4], rot = [rnd() * 3, rnd() * 3, rnd() * 3];
    fb.push(place(ellipsoid({ r: [0.32, 0.09, 0.12], rows: 8, cols: 12 }), { at, rot })); fn.push(place(ellipsoid({ r: [0.09, 0.05, 0.06], rows: 6, cols: 8 }), { at, rot })); }
  B.add(merge(fb), { part: 'fibro', color: '#c9a0b4', alpha: 0.85, rim: 0.7, rimColor: '#ffffff' });
  B.add(merge(fn), { part: 'fibro', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff' });
  B.label('colFib', add(C[4].a, mul(sub(C[4].b, C[4].a), 0.85)), [0, 0, 1]);
  B.label('elaFib', E[0].a, [0, 0, 1]);
  B.label('fibro', [-W + 0.6, H - 0.4, D], [0, 0, 1]);
  B.label('matrixC', [W - 0.2, -H + 0.2, D], [0, 0, 1]);
  B.caption([0, -H - 0.4, D], () => ['', 'يُشدّ فتقاومه الكولاجينية، ويرجع بفضل المرنة']);
  let k = 0, lastK = -1;
  return {
    dist: 8, yaw: 0.3, pitch: 0.25, live2d: true,
    xf: () => [1 + 0.12 * k, 0, 0, 0, 0, 1 - 0.04 * k, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    anim(t){ k = Math.max(0, Math.sin(t * 1.2)); if (Math.abs(k - lastK) > 0.03){ lastK = k; B.update(colO, colMesh(k)); B.update(elaO, elaMesh(k)); } }
  };
}

/* ═════════════ 2) الغضروف: الزجاجي، المرن، الليفي ═════════════ */
function cartModel(B){
  const rnd = srng(7), X = [-2.4, 0, 2.4], R = 1.0, H = 0.7;
  const disc = (r, h) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], 36);
  const ids = ['cartHy', 'cartEl', 'cartFi'], cols = ['#cfe3ef', '#cfe3ef', '#d8e3ea'];
  X.forEach((x, k) => B.add(place(disc(R, H), { at: [x, 0, 0] }), { part: ids[k], color: cols[k], alpha: 0.32, rim: 0.9, rimColor: '#eef7fb', shell: { size: 2 + k * 0.01 } }));
  /* ألياف مرنة (الوسط) وحزم كولاجينية (اليمين) */
  const el = []; for (let i = 0; i < 14; i++){ const a = rnd() * 6.28, d = rnd() * 0.8, p = [X[1] + Math.cos(a) * d, (rnd() - 0.5) * 0.5, Math.sin(a) * d], q = add(p, [(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.7]); el.push(fiber(p, q, 0.04, 2, 0.015, i)); }
  B.add(merge(el), { part: 'cartEl', color: '#4a3a6a', rim: 0.6, rimColor: '#b8a8e8' });
  const fi = []; for (let i = -3; i <= 3; i++) for (const y of [-0.15, 0.15]){ const z = i * 0.24, hw = Math.sqrt(Math.max(0, R * R - z * z)) - 0.08; fi.push(fiber([X[2] - hw, y, z], [X[2] + hw, y, z], 0.03, 3, 0.03, i)); }
  B.add(merge(fi), { part: 'cartFi', color: '#e58aa0', rim: 0.6, rimColor: '#ffd8e2' });
  /* فجوات وفيها خلايا غضروفية */
  const lac = [], cel = [];
  X.forEach((x, k) => { for (let i = 0; i < 8; i++){ const a = i / 8 * 6.283 + k, d = (i % 2 ? 0.6 : 0.3), at = [x + Math.cos(a) * d, (rnd() - 0.5) * 0.3, Math.sin(a) * d * (k === 2 ? 0.6 : 1)];
    const two = k !== 2 && i % 3 === 0;
    lac.push(place(ellipsoid({ r: [two ? 0.17 : 0.11, 0.1, 0.1], rows: 8, cols: 12 }), { at }));
    (two ? [-0.06, 0.06] : [0]).forEach(o => cel.push(place(ellipsoid({ r: 0.065, rows: 6, cols: 8 }), { at: add(at, [o, 0, 0]) }))); } });
  B.add(merge(lac), { part: 'lacuna', color: '#a9c9dc', alpha: 0.55, rim: 0.8, rimColor: '#ffffff', shell: { size: 0.3, inner: 'chondro' } });
  B.add(merge(cel), { part: 'chondro', color: '#8a7fd6', rim: 0.6, rimColor: '#e6e0ff' });
  B.label('cartHy', [X[0] - R * 0.7, H / 2, R * 0.6], [0, 1, 0.5]);
  B.label('cartEl', [X[1], H / 2, R * 0.9], [0, 1, 0.5]);
  B.label('cartFi', [X[2] + R * 0.7, H / 2, R * 0.6], [0, 1, 0.5]);
  B.label('chondro', [X[2] + 0.6 * Math.cos(1 / 8 * 6.283 + 2), 0, 0.6 * Math.sin(1 / 8 * 6.283 + 2) * 0.6], [0, 1, 0.3]);
  B.label('lacuna', [X[0] + 0.3, 0.05, 0], [0, 1, 0.3]);
  B.caption([X[0], -H / 2 - 0.3, R], () => ['الزجاجي']);
  B.caption([X[1], -H / 2 - 0.3, R], () => ['المرن']);
  B.caption([X[2], -H / 2 - 0.3, R], () => ['الليفي']);
  let k = 0;
  return {
    dist: 8.4, yaw: 0.1, pitch: 0.7, live2d: true, compactK: 1.2,
    xf: () => [1 + 0.05 * k, 0, 0, 0, 0, 1 - 0.12 * k, 0, 0, 0, 0, 1 + 0.05 * k, 0, 0, 0, 0, 1],
    anim(t){ k = Math.max(0, Math.sin(t * 1.5)); }
  };
}

/* ═════════════ 3) العظم: جهاز هافرس (أسطوانة مقطوعة) ═════════════ */
function boneModel(B){
  const H = 3.0, R0 = 0.28, R = 1.9, A0 = Math.PI / 2 + 0.6, A1 = Math.PI / 2 - 0.6 + 2 * Math.PI;
  /* الصفائح العظمية: حلقات متحدة المركز مقطوع منها إسفين */
  const lam = [];
  /* وجه القطع لكل حلقة (مستطيل بالوجهين) حتى تبدو الصفائح مصمتة */
  const cap = (ra, rb, a) => { const m = mk(), c = Math.cos(a), s = Math.sin(a);
    /* وجهان بنقاط منفصلة (لكل وجه اتجاهه) حتى يُضاء من الجهتين */
    for (let k = 0; k < 2; k++) [[ra, -H / 2], [rb, -H / 2], [rb, H / 2], [ra, H / 2]].forEach(([r, y]) => { m.p.push(c * r, y, s * r); m.l.push(c * r, y, s * r); m.n.push(0, 0, 0); });
    m.i.push(0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6); return computeNormals(m); };
  for (let r = R0 + 0.12; r < R; r += 0.26){
    const ring = (ra, rb) => lathe([[ra, -H / 2], [rb, -H / 2], [rb, H / 2], [ra, H / 2], [ra, -H / 2]], 40, A0, A1);
    lam.push(ring(r, r + 0.245), cap(r, r + 0.245, A0), cap(r, r + 0.245, A1));
  }
  B.add(merge(lam), { part: 'lamella', color: '#e9dcc0', rim: 0.6, rimColor: '#fff6e0', pat: 3, patK: 8 });
  /* قناة هافرس والوعاء الدموي فيها */
  B.add(lathe([[R0, -H / 2], [R0, H / 2]], 24), { part: 'havers', color: '#3a1a1a', alpha: 0.5, rim: 0.8, rimColor: '#fff3e0', shell: { size: 0.6, inner: 'havers' } });
  B.add(tube({ pts: [[-0.08, -H / 2, 0], [-0.08, H / 2, 0]], r: 0.11, sides: 12 }), { part: 'havers', color: '#c0392b', rim: 0.7, rimColor: '#ffb3a8' });
  B.add(tube({ pts: [[0.12, -H / 2, 0.06], [0.12, H / 2, 0.06]], r: 0.05, sides: 8 }), { part: 'havers', color: '#e9d29a', rim: 0.6, rimColor: '#fff3c8' });
  /* فجوات وخلايا عظمية بين الصفائح + قنيوات، على وجهي القطع */
  const lacs = [], cells = [], cans = [];
  [A0, A1].forEach(a => { const c = Math.cos(a), s = Math.sin(a);
    /* إزاحة قليلة خارج وجه القطع (باتجاه الإسفين المقطوع) حتى تُرى */
    const off = a === A0 ? [s * 0.03, 0, -c * 0.03] : [-s * 0.03, 0, c * 0.03];
    for (let r = R0 + 0.37; r < R - 0.05; r += 0.26) for (const y of [-0.9, 0, 0.9]){
      const at = add([c * r, y + (r * 3 % 0.5), s * r], off);
      lacs.push(place(ellipsoid({ r: [0.05, 0.11, 0.05], rows: 6, cols: 8 }), { at }));
      cells.push(place(ellipsoid({ r: [0.035, 0.08, 0.035], rows: 5, cols: 6 }), { at: add(at, [c * 0.01, 0, s * 0.01]) }));
      cans.push(tube({ pts: [[c * (r - 0.17), at[1], s * (r - 0.17)], [c * (r + 0.17), at[1] + 0.03, s * (r + 0.17)]], r: 0.009, sides: 4 }));
    } });
  B.add(merge(lacs), { part: 'lacuna', color: '#6a4a2c', rim: 0.4, rimColor: '#c9a070' });
  B.add(merge(cells), { part: 'osteo', color: '#b07a54', rim: 0.6, rimColor: '#ffe0c0' });
  B.add(merge(cans), { part: 'canalic', color: '#5a3a1c', rim: 0.4, rimColor: '#c9a070' });
  /* الدم يجري في القناة، والغذاء يخرج عبر القنيوات */
  const flow = t => Array.from({ length: 10 }, (_, i) => { const p = (t * 0.3 + i / 10) % 1; return Object.assign([-0.08, -H / 2 + p * H, 0], { s: 0.05 }); });
  const nut = t => Array.from({ length: 10 }, (_, i) => { const p = (t * 0.25 + i / 10) % 1, a = i % 2 ? A0 : A1, r = R0 + 0.1 + p * (R - R0), y = -0.9 + (i % 3) * 0.9;
    return Object.assign([Math.cos(a) * r, y + 0.04, Math.sin(a) * r], { s: 0.04 * Math.sin(p * Math.PI) + 0.001 }); });
  const fO = B.add(dots(flow(0), 0.05), { color: '#ff7a6a', rim: 0.6, rimColor: '#ffd0c8', pop: false, center: [0, 0, 0] });
  const nO = B.add(dots(nut(0), 0.04), { color: '#ffb0a0', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  const c1 = Math.cos(A1), s1 = Math.sin(A1);
  B.label('havers', [0, H / 2, 0], [0, 1, 0]);
  B.label('lamella', [Math.cos(A0) * (R - 0.1), H / 2, Math.sin(A0) * (R - 0.1)], [0, 1, 0.3]);
  B.label('osteo', [c1 * (R0 + 0.37), 0.02, s1 * (R0 + 0.37)], [c1 * 0.2 + 0.5, 0, s1 * 0.2 + 0.8]);
  B.label('lacuna', [c1 * (R0 + 0.89), 0.9 + ((R0 + 0.89) * 3 % 0.5), s1 * (R0 + 0.89)], [0.5, 0, 0.8]);
  B.label('canalic', [c1 * (R0 + 1.15), -0.9 + ((R0 + 0.89) * 3 % 0.5), s1 * (R0 + 1.15)], [0.5, 0, 0.8]);
  B.caption([0, -H / 2 - 0.4, R], () => ['', 'جهاز هافرس: الغذاء من قناة هافرس إلى الخلايا عبر القنيوات']);
  return {
    dist: 8.4, yaw: 0.15, pitch: 0.55, live2d: true,
    anim(t){ B.update(fO, dots(flow(t), 0.05)); B.update(nO, dots(nut(t), 0.04)); }
  };
}

/* ═════════════ 4) الدم يجري في وعاء دموي ═════════════ */
function bloodModel(B){
  const L = 3.4, R = 1.0, rnd = srng(3);
  const vessel = lathe([[R, -L], [R, L]], 40);
  B.add(place(vessel, { rot: [0, 0, Math.PI / 2] }), { color: '#b0503f', alpha: 0.22, rim: 1.0, rimColor: '#ffb3a8', shell: { size: 5 }, pop: false });
  B.add(place(lathe([[R * 0.97, -L], [R * 0.97, L]], 40), { rot: [0, 0, Math.PI / 2] }), { part: 'plasma', color: '#f6e3a6', alpha: 0.12, rim: 0.4, rimColor: '#fff6d0', shell: { size: 4.5 } });
  /* كرية حمراء: قرص مقعر الوجهين */
  const rbcM = ellipsoid({ r: [0.24, 0.08, 0.24], rows: 10, cols: 18, warp: p => { const d = Math.hypot(p[0], p[2]) / 0.24; return [p[0], p[1] * (0.35 + 0.65 * d * d), p[2]]; } });
  const RB = Array.from({ length: 26 }, () => ({ x: rnd() * 2 * L, y: (rnd() - 0.5) * 1.3, z: (rnd() - 0.5) * 1.3, r: [rnd() * 3, rnd() * 3, rnd() * 3], s: 0.85 + rnd() * 0.3 }));
  const WB = Array.from({ length: 3 }, (_, i) => ({ x: i * 2.2, y: (i - 1) * 0.45, z: (rnd() - 0.5) * 0.8 }));
  const PL = Array.from({ length: 14 }, () => ({ x: rnd() * 2 * L, y: (rnd() - 0.5) * 1.4, z: (rnd() - 0.5) * 1.4 }));
  const X = (x0, sp, t) => -L + (((x0 + t * sp) % (2 * L)) + 2 * L) % (2 * L);
  const ok = (y, z) => Math.hypot(y, z) < R * 0.85;
  const rbM = t => merge(RB.filter(c => ok(c.y, c.z)).map(c => place(rbcM, { at: [X(c.x, 0.8, t), c.y, c.z], rot: [c.r[0] + t, c.r[1], c.r[2]], s: c.s })));
  const wbM = t => merge(WB.map(c => place(ellipsoid({ r: 0.32, rows: 12, cols: 16, disp: d => 1 + 0.05 * Math.sin(d[0] * 7 + d[1] * 5) }), { at: [X(c.x, 0.4, t), c.y, c.z] })));
  const wnM = t => merge(WB.map(c => place(ellipsoid({ r: [0.16, 0.11, 0.12], rows: 8, cols: 10, disp: d => 1 + 0.25 * Math.sin(d[0] * 6) }), { at: [X(c.x, 0.4, t) + 0.05, c.y, c.z + 0.1] })));
  const plM = t => merge(PL.filter(c => ok(c.y, c.z)).map(c => place(ellipsoid({ r: [0.07, 0.035, 0.05], rows: 5, cols: 8 }), { at: [X(c.x, 0.95, t), c.y, c.z] })));
  const rO = B.add(rbM(0), { part: 'rbc', color: '#d9433b', rim: 0.7, rimColor: '#ff9a8a', pop: false, center: [0, 0, 0] });
  const wO = B.add(wbM(0), { part: 'wbc', color: '#efe6f6', alpha: 0.8, rim: 0.9, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  const nO = B.add(wnM(0), { part: 'wbc', color: '#7565c2', rim: 0.5, rimColor: '#d8d0ff', pop: false, center: [0, 0, 0] });
  const pO = B.add(plM(0), { part: 'platelet', color: '#c08bd0', rim: 0.7, rimColor: '#f0d8ff', pop: false, center: [0, 0, 0] });
  const lbl = { rbc: [0, 0, 0], wbc: [0, 0, 0], pl: [0, 0, 0] };
  B.label('plasma', [L - 0.4, R * 0.7, R * 0.7], [0, 0.5, 1]);
  B.label('rbc', lbl.rbc, [0, 0, 1]);
  B.label('wbc', lbl.wbc, [0, 0, 1]);
  B.label('platelet', lbl.pl, [0, 0, 1]);
  B.caption([0, -R - 0.35, 0.6], () => ['', 'البلازما وكريات الدم الحمر والبيض والصفيحات تجري في الوعاء']);
  const cp = (d, s) => { d[0] = s[0]; d[1] = s[1]; d[2] = s[2]; };
  return {
    dist: 8.2, yaw: 0.25, pitch: 0.25, live2d: true, noSpin: true,
    anim(t){
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null, sp = id => (f && f !== id ? 0.2 : 1);
      const tr = t * sp('rbc'), tw = t * sp('wbc'), tp = t * sp('platelet');
      B.update(rO, rbM(tr)); B.update(wO, wbM(tw)); B.update(nO, wnM(tw)); B.update(pO, plM(tp));
      /* الأسماء تتبع أقرب جسم للوسط */
      const near = (arr, sp2, tt) => arr.filter(c => ok(c.y, c.z)).map(c => [X(c.x, sp2, tt), c.y, c.z]).sort((a, b) => Math.abs(a[0] - 0.5) - Math.abs(b[0] - 0.5))[0];
      cp(lbl.rbc, near(RB, 0.8, tr)); cp(lbl.wbc, near(WB, 0.4, tw)); cp(lbl.pl, near(PL, 0.95, tp));
    }
  };
}

/* ═════════════ 5) قارن: أنواع النسيج الضام ═════════════ */
function cmpModel(B){
  const rnd = srng(5), X = [-3.3, -1.1, 1.1, 3.3], R = 0.9, H = 0.6;
  const disc = (r, h) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], 32);
  /* الضام الأصيل */
  B.add(place(disc(R, H), { at: [X[0], 0, 0] }), { part: 'tLoose', color: '#d9cde6', alpha: 0.3, rim: 0.9, rimColor: '#f0e8ff', shell: { size: 2 } });
  B.add(merge([0, 1, 2].map(i => fiber([X[0] - 0.7, (i - 1) * 0.15, -0.4 + i * 0.4], [X[0] + 0.7, (1 - i) * 0.1, 0.3 - i * 0.2], 0.08, 2, 0.05, i))), { part: 'tLoose', color: '#e58aa0', rim: 0.6, rimColor: '#ffd8e2' });
  /* الغضروف */
  B.add(place(disc(R, H), { at: [X[1], 0, 0] }), { part: 'tCart', color: '#cfe3ef', alpha: 0.35, rim: 0.9, rimColor: '#eef7fb', shell: { size: 2.01 } });
  B.add(merge([0, 1, 2, 3, 4].map(i => { const a = i * 1.25; return place(ellipsoid({ r: 0.09, rows: 6, cols: 8 }), { at: [X[1] + Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5] }); })), { part: 'tCart', color: '#8a7fd6', rim: 0.6, rimColor: '#e6e0ff' });
  /* العظم */
  B.add(merge([0.3, 0.55, 0.8].map(r => place(lathe([[r - 0.1, -H / 2], [r + 0.1, -H / 2], [r + 0.1, H / 2], [r - 0.1, H / 2], [r - 0.1, -H / 2]], 32), { at: [X[2], 0, 0] }))), { part: 'tBone', color: '#e9dcc0', rim: 0.6, rimColor: '#fff6e0' });
  B.add(place(lathe([[0.001, -H / 2], [0.12, -H / 2], [0.12, H / 2], [0.001, H / 2]], 16), { at: [X[2], 0, 0] }), { part: 'tBone', color: '#c0392b', rim: 0.6, rimColor: '#ffb3a8' });
  /* الدم */
  B.add(place(disc(R, H), { at: [X[3], 0, 0] }), { part: 'tBlood', color: '#f6e3a6', alpha: 0.3, rim: 0.9, rimColor: '#fff6d0', shell: { size: 2.02 } });
  B.add(merge(Array.from({ length: 7 }, () => place(ellipsoid({ r: [0.16, 0.06, 0.16], rows: 8, cols: 12 }), { at: [X[3] + (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 1.2], rot: [rnd(), rnd(), rnd()] }))), { part: 'tBlood', color: '#d9433b', rim: 0.6, rimColor: '#ff9a8a' });
  const names = [['الضام الأصيل', 'خلايا ليفية وألياف'], ['الغضروف', 'صلب مرن، بلا أوعية'], ['العظم', 'صلب، قنوات هافرس'], ['الدم', 'مادة سائلة (البلازما)']];
  ['tLoose', 'tCart', 'tBone', 'tBlood'].forEach((id, i) => { B.label(id, [X[i], H / 2, R * 0.8], [0, 1, 0.4]); B.caption([X[i], -H / 2 - 0.3, R], () => names[i]); });
  return { dist: 10, yaw: 0.05, pitch: 0.65, live2d: true, maxDist: 18, compactK: 1.3 };
}

Object.assign(G3.models, { con_cloose: looseModel, con_ccart: cartModel, con_cbone: boneModel, con_cblood: bloodModel, con_ccmp: cmpModel });
})();
