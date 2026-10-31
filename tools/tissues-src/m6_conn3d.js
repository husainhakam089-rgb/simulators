
/* ══════════════════════════════════════════════════════════════════════════
   9.6 · مجسّمات النسيج الضام (ملزمة ص42–72): الخلايا والألياف، الشحمي،
         الشبكي، المخاطاني، الكثيف، الغضروف، العظم المصمت والإسفنجي، الدم، واللمف
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

const flow3 = (n, t, sp, f, r) => Array.from({ length: n }, (_, i) => { const p = (t * sp + i / n) % 1; return Object.assign(f(i, p), { s: (r || 1) * Math.sin(p * Math.PI) + 0.0001 }); });
const MAT = { color: '#d9cde6', alpha: 0.16, rim: 0.8, rimColor: '#f0e8ff', shell: { size: 6 } };
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.7, rimColor: '#ffffff' }, extra || {});
const blob = (r, k, seed) => ellipsoid({ r, rows: 10, cols: 14, disp: d => 1 + k * Math.sin(d[0] * 5 + seed) * Math.cos(d[2] * 4 + seed) });
/* شبكة ليفية متشابكة بين نقاط عشوائية (الألياف الشبكية) */
function netMesh(P, r){ const out = []; P.forEach((p, i) => P.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])]).filter(z => z[0] > i).sort((a, b) => a[1] - b[1]).slice(0, 2)
  .forEach(([j]) => out.push(tube({ pts: [p, P[j]], r, sides: 5 })))); return merge(out); }
/* خلية نجمية: جسم صغير وبروزات */
const star = (at, n, L, r, rnd) => merge([place(ellipsoid({ r: r * 1.8, rows: 6, cols: 8 }), { at })].concat(Array.from({ length: n }, () => { const a = rnd() * 6.28, b = (rnd() - 0.5) * 2;
  return tube({ pts: [at, add(at, [Math.cos(a) * L, b * L * 0.5, Math.sin(a) * L])], r: r * 0.7, sides: 4 }); })));

/* ═════════════ 1) الخلايا والألياف والقالب (النسيج الضام الهللي) ═════════════ */
function partsModel(B){
  const rnd = srng(12), W = 2.8, H = 1.5, D = 1.0;
  B.add(place(box(2 * W, 2 * H, 2 * D, 0.2), { at: [0, 0, 0] }), Object.assign({ part: 'matrixC' }, MAT));
  /* الألياف البيض حزم لا تتفرع، الصفر مفردة تتفرع، الشبكية شبكة */
  const col = []; [-0.5, 0.45].forEach((y, k) => [-0.06, 0, 0.06].forEach((o, j) => col.push(fiber([-W + 0.1, y + o, -0.2 + k * 0.3 + o], [W - 0.1, y - 0.1 + o, 0.1 + o], 0.12, 3, 0.03, k + j))));
  B.add(merge(col), fx('colFib', '#f1d9de'));
  const ela = []; for (let i = 0; i < 4; i++){ const a = [-W + 0.4 + i * 1.4, 1.1 - (i % 2) * 0.3, -0.5 + i * 0.25], b = add(a, [1.1, -0.25, 0.3]), m = mul(add(a, b), 0.5);
    ela.push(fiber(a, b, 0.05, 2, 0.02, i), fiber(m, add(m, [0.3, 0.35, -0.1]), 0.02, 1, 0.016, i)); }
  B.add(merge(ela), fx('elaFib', '#e8c23a'));
  const NP = Array.from({ length: 9 }, () => [-W + 0.3 + rnd() * 1.6, -H + 0.25 + rnd() * 0.9, -0.6 + rnd() * 1.2]);
  B.add(netMesh(NP, 0.012), fx('retFib', '#4a3a6a', { rimColor: '#b8a8e8' }));
  const C = { fibro: [-1.7, 0.95, 0.3], macro: [1.7, 0.9, 0.2], plasmaC: [0.4, -1.0, 0.4], mast: [0.9, 0.1, 0.1], retC: [-1.5, -0.9, 0.2], pigC: [2.1, -0.9, 0.2], fatC: [-0.1, 0.9, -0.2], mesC: [-2.3, 0.0, 0.4] };
  /* الأرومة الليفية: مغزلية ببروزات طويلة */
  B.add(merge([place(ellipsoid({ r: [0.36, 0.09, 0.12], rows: 8, cols: 12 }), { at: C.fibro, rot: [0, 0, -0.2] })].concat([[-1, 0.3], [-1, -0.3], [1, 0.25], [1, -0.35]].map(([s, d]) =>
    tube({ pts: [add(C.fibro, [s * 0.3, 0, 0]), add(C.fibro, [s * 0.65, d, 0.1])], r: 0.025, sides: 5 })))), fx('fibro', '#c9a0b4'));
  /* البلعم الكبير: أميبي كبير */
  const macroO = B.add(place(blob([0.42, 0.34, 0.36], 0.18, 1), { at: C.macro }), fx('macro', '#e7c9a8', { alpha: 0.85 }));
  /* الخلية البلازمية: بيضوية صغيرة ونواة لامركزية */
  B.add(place(ellipsoid({ r: [0.28, 0.22, 0.22], rows: 10, cols: 12 }), { at: C.plasmaC }), fx('plasmaC', '#c7d6f0', { alpha: 0.8 }));
  /* البدينة: كروية كبيرة بسايتوبلازم حبيبي */
  B.add(place(ellipsoid({ r: 0.38, rows: 12, cols: 14 }), { at: C.mast }), fx('mast', '#e3c0e8', { alpha: 0.6 }));
  B.add(merge(Array.from({ length: 40 }, () => { const a = rnd() * 6.28, b = rnd() * 3.14, d = 0.1 + rnd() * 0.22; return place(ball, { at: add(C.mast, [Math.cos(a) * Math.sin(b) * d, Math.cos(b) * d, Math.sin(a) * Math.sin(b) * d]), s: 0.028 }); })), fx('mast', '#8a3a9a'));
  B.add(place(ellipsoid({ r: [0.24, 0.26, 0.24], rows: 6, cols: 8 }), { at: C.retC }), fx('retC', '#bfa9e0'));
  B.add(star(C.retC, 6, 0.42, 0.04, rnd), fx('retC', '#bfa9e0'));
  B.add(star(C.pigC, 7, 0.4, 0.05, rnd), fx('pigC', '#6b4a2a', { rimColor: '#c8a070' }));
  /* الخلية الدهنية: قطرة دهنية كبيرة داخل حلقة سايتوبلازم نحيفة ونواة جانبية مسطحة */
  B.add(place(ellipsoid({ r: 0.4, rows: 12, cols: 16 }), { at: C.fatC }), fx('fatC', '#e9b8c4', { alpha: 0.35, shell: { size: 0.5 } }));
  B.add(place(ellipsoid({ r: 0.34, rows: 12, cols: 16 }), { at: C.fatC }), fx('fatC', '#f3e3a0'));
  B.add(place(ellipsoid({ r: [0.14, 0.04, 0.12], rows: 6, cols: 8 }), { at: add(C.fatC, [0, 0.37, 0]) }), fx('fatC', '#6f5fc0'));
  B.add(star(C.mesC, 6, 0.32, 0.05, rnd), fx('mesC', '#9fd3c7'));
  /* النوى */
  B.add(merge([place(ellipsoid({ r: [0.11, 0.05, 0.06], rows: 6, cols: 8 }), { at: C.fibro }), place(ball, { at: add(C.macro, [0.15, 0.12, 0.2]), s: 0.12 }), place(ball, { at: add(C.plasmaC, [-0.1, 0, 0.12]), s: 0.11 }),
    place(ball, { at: add(C.mast, [0.1, 0.05, 0.25]), s: 0.09 }), place(ball, { at: C.mesC, s: 0.1 }), place(ball, { at: C.retC, s: 0.09 })]), { color: '#6f5fc0', rim: 0.5, rimColor: '#d8d0ff' });
  /* البلعم يلتهم جزيئات غريبة، البدينة تحرر حبيبات، البلازمية تكوّن أجساماً مضادة */
  const mv = t => [flow3(6, t, 0.2, (i, p) => add(C.macro, [Math.cos(i) * (1 - p) * 1.2, Math.sin(i * 2) * (1 - p) * 0.6, Math.sin(i) * (1 - p) * 0.5]), 0.05),
    flow3(8, t, 0.25, (i, p) => add(C.mast, [Math.cos(i * 0.8) * (0.4 + p * 0.7), Math.sin(i * 0.8) * (0.4 + p * 0.7), 0.2]), 0.035),
    flow3(5, t, 0.22, (i, p) => add(C.plasmaC, [Math.cos(-2.4 + i * 0.5) * (0.3 + p * 0.8), -Math.sin(-2.4 + i * 0.5) * (0.3 + p * 0.6), 0.25]), 0.04)];
  const M0 = mv(0), eO = B.add(dots(M0[0], 0.05), { color: '#5a4a3a', rim: 0.5, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }),
    hO = B.add(dots(M0[1], 0.035), { color: '#b04ac0', rim: 0.6, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }),
    aO = B.add(dots(M0[2], 0.04), { color: '#3a5ab0', rim: 0.6, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  void macroO;
  [['fibro', [-0.6, 0.3, 0]], ['macro', [0.42, 0, 0]], ['plasmaC', [0.28, 0, 0]], ['mast', [0.38, 0, 0]], ['retC', [-0.25, 0, 0]], ['pigC', [0.3, 0, 0]], ['fatC', [0, 0.4, 0]], ['mesC', [-0.3, 0, 0]]]
    .forEach(([id, o]) => B.label(id, add(C[id], o), [0, 0.3, 1]));
  B.label('colFib', [W - 0.4, 0.37, 0.12], [0, 0, 1]);
  B.label('elaFib', [-W + 0.4, 1.1, -0.5], [0, 1, 0.5]);
  B.label('retFib', NP[0], [0, 0, 1]);
  B.label('matrixC', [W - 0.2, -H + 0.2, D], [0, 0, 1]);
  B.caption([0, -H - 0.4, D], () => ['', 'النسيج الضام الهللي: جميع أنواع الألياف وأغلب الخلايا في المادة بين الخلوية (القالب)']);
  return { dist: 8.6, yaw: 0.25, pitch: 0.25, live2d: true,
    anim(t){ const m = mv(t); B.update(eO, dots(m[0], 0.05)); B.update(hO, dots(m[1], 0.035)); B.update(aO, dots(m[2], 0.04)); } };
}

/* ═════════════ 2) الشحمي: خلايا دهنية تخزن الدهون ثم تستهلكها لتوليد الطاقة ═════════════ */
function adipModel(B){
  const rnd = srng(17), P = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 2; k++) P.push([-2.5 + i * 0.95 + (j % 2) * 0.45 + (rnd() - 0.5) * 0.1, -1.2 + j * 0.82, -0.45 + k * 0.9 + (rnd() - 0.5) * 0.1]);
  B.add(place(box(6.2, 3.6, 2.2, 0.2), { at: [0, 0, 0] }), Object.assign({ part: 'tAdip' }, MAT));
  B.add(merge(P.map(p => place(ellipsoid({ r: 0.47, rows: 10, cols: 14 }), { at: p }))), fx('fatC', '#e9b8c4', { alpha: 0.3, shell: { size: 0.6 } }));
  const drop = k => merge(P.map(p => place(ellipsoid({ r: 0.41 * (0.72 + 0.28 * k), rows: 10, cols: 14 }), { at: p })));
  const dO = B.add(drop(1), fx('fatC', '#f3e3a0'));
  B.add(merge(P.map((p, i) => { const a = i * 2.3; return place(ellipsoid({ r: [0.15, 0.04, 0.12], rows: 6, cols: 8 }), { at: add(p, [Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0]), rot: [0, 0, a + 1.57] }); })), fx('fatC', '#6f5fc0'));
  const en = t => flow3(10, t, 0.4, (i, p) => add(P[(i * 7) % P.length], [Math.cos(i) * p * 0.5, p * 0.8, 0.5]));
  const eO = B.add(dots(en(0), 0.05), { color: '#ffd166', rim: 0.8, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  const pf = P[P.length - 1]; B.label('fatC', add(pf, [0.4, 0, 0.3]), [1, 0, 0.6]);
  B.label('tAdip', [-3.1, 1.6, 1.1], [0, 1, 0.5]);
  let k = 1, lastK = -1;
  B.caption([0, -2.3, 1.1], () => [k > 0.6 ? 'خزن الدهون: القطرة الدهنية تكبر' : k < 0.4 ? 'توليد الطاقة: القطرة الدهنية تصغر' : '', 'تحت الجلد وفي مواقع خزن الدهون وأيضها']);
  return { dist: 9, yaw: 0.25, pitch: 0.35, live2d: true,
    anim(t){ k = 0.5 + 0.5 * Math.sin(t * 0.7); if (Math.abs(k - lastK) > 0.04){ lastK = k; B.update(dO, drop(k)); }
      B.update(eO, merge(en(t).map(p => place(ball, { at: p, s: 0.05 * p.s * (1 - k) + 0.0001 })))); } };
}

/* ═════════════ 3) الشبكي: خلايا شبكية وألياف شبكية في مادة سائلة ═════════════ */
function retModel(B){
  const rnd = srng(41), P = Array.from({ length: 44 }, () => [-2.6 + rnd() * 5.2, -1.4 + rnd() * 2.8, -0.9 + rnd() * 1.8]);
  B.add(place(box(5.8, 3.4, 2.2, 0.2), { at: [0, 0, 0] }), Object.assign({ part: 'tRet' }, MAT, { color: '#e6dcf2' }));
  B.add(netMesh(P, 0.018), fx('retFib', '#4a3a6a', { rimColor: '#b8a8e8' }));
  const cells = P.filter((p, i) => i % 3 === 0);
  B.add(merge(cells.map(p => star(p, 5, 0.3, 0.05, rnd))), fx('retC', '#bfa9e0'));
  B.add(merge(cells.map(p => place(ball, { at: p, s: 0.09 }))), fx('retC', '#6f5fc0'));
  const fl = t => flow3(16, t, 0.12, (i, p) => [-2.8 + p * 5.6, -1.2 + (i % 5) * 0.6 + Math.sin(p * 9 + i) * 0.12, -0.6 + (i % 3) * 0.6]);
  const fO = B.add(dots(fl(0), 0.05), { color: '#7fb6e6', rim: 0.6, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('retC', add(cells[1], [0.1, 0.1, 0]), [0, 0.3, 1]);
  B.label('retFib', P[2], [0, 0.3, 1]);
  B.label('tRet', [-2.9, 1.7, 1.1], [0, 1, 0.5]);
  B.caption([0, -2.1, 1.1], () => ['', 'الأعضاء اللمفية ونقي العظم والكبد — أهميته الإسناد']);
  return { dist: 8.6, yaw: 0.25, pitch: 0.3, live2d: true, anim(t){ B.update(fO, merge(fl(t).map(p => place(ball, { at: p, s: 0.05 * p.s + 0.0001 })))); } };
}

/* ═════════════ 4) المخاطاني: قطعة من الحبل السري ═════════════ */
function mucModel(B){
  const rnd = srng(57), R = 1.9, L = 1.2;
  const cyl = (r, l) => lathe([[0.001, -l / 2], [r, -l / 2], [r, l / 2], [0.001, l / 2]], 40);
  B.add(place(cyl(R, L), { rot: [Math.PI / 2, 0, 0] }), { part: 'tMucous', color: '#f6e2e0', alpha: 0.3, rim: 0.9, rimColor: '#ffffff', shell: { size: 4 } });
  const A = [[0.6, 0.6, 0.48], [-0.85, 0, 0.4]];
  const art = []; A.forEach(([x, y, r]) => art.push(place(lathe([[r * 0.6, -L / 2 - 0.05], [r, -L / 2 - 0.05], [r, L / 2 + 0.05], [r * 0.6, L / 2 + 0.05], [r * 0.6, -L / 2 - 0.05]], 28), { at: [x, y, 0], rot: [Math.PI / 2, 0, 0] })));
  art.push(place(lathe([[0.5, -L / 2 - 0.05], [0.66, -L / 2 - 0.05], [0.66, L / 2 + 0.05], [0.5, L / 2 + 0.05], [0.5, -L / 2 - 0.05]], 28), { at: [0.4, -0.9, 0], rot: [Math.PI / 2, 0, 0], s: [1.4, 1, 0.5] }));
  B.add(merge(art), fx('artery', '#e8a0a0', { rimColor: '#ffd0d0' }));
  const ok = (x, y) => Math.hypot(x, y) < R - 0.12 && A.every(([ax, ay, r]) => Math.hypot(x - ax, y - ay) > r + 0.1) && Math.hypot((x - 0.4) / 1.0, (y + 0.9) / 0.4) > 1.15;
  const st = []; for (let i = 0; i < 300 && st.length < 40; i++){ const x = (rnd() - 0.5) * 2 * R, y = (rnd() - 0.5) * 2 * R; if (ok(x, y)) st.push(star([x, y, (rnd() - 0.5) * L * 0.8], 4, 0.14, 0.025, rnd)); }
  B.add(merge(st), fx('fibro', '#b0303a', { rimColor: '#ffb0b0' }));
  const bl = t => flow3(10, t, 0.4, (i, p) => { const a = A[i % 2]; return [a[0] + Math.cos(i) * 0.15, a[1] + Math.sin(i) * 0.15, -L / 2 + p * L]; });
  const bO = B.add(dots(bl(0), 0.06), { color: '#c0392b', rim: 0.6, rimColor: '#ffd0c8', pop: false, center: [0, 0, 0] });
  B.label('artery', [A[0][0] + 0.3, A[0][1] + 0.3, L / 2 + 0.05], [0, 0.5, 1]);
  B.label('tMucous', [R * 0.8, -R * 0.4, L / 2], [1, 0, 0.6]);
  B.label('fibro', [-R * 0.55, -R * 0.55, L / 2], [-1, -0.3, 0.6]);
  B.caption([0, -R - 0.4, 0.6], () => ['', 'الحبل السري — أرومات ليفية نجمية في مادة جيلاتينية مخاطية تسنده']);
  return { dist: 7.6, yaw: 0.35, pitch: 0.3, live2d: true, anim(t){ B.update(bO, merge(bl(t).map(p => place(ball, { at: p, s: 0.06 * p.s + 0.0001 })))); } };
}

/* ═════════════ 5) الكثيف: الأبيض المنتظم وغير المنتظم، والأصفر (يُسحب) ═════════════ */
function denseModel(B){
  const rnd = srng(77), X = [-2.5, 0, 2.5], W = 1.05, H = 1.1, D = 0.7;
  const ids = ['tDenseReg', 'tDenseIrr', 'tDenseYel'];
  X.forEach((x, i) => B.add(place(box(2 * W, 2 * H, 2 * D, 0.2), { at: [x, 0, 0] }), Object.assign({ part: ids[i] }, MAT, { shell: { size: 2 + i * 0.01 } })));
  const reg = k => merge(Array.from({ length: 7 }, (_, i) => [-0.05, 0.05].map(o => fiber([X[0] - W * (1 + 0.02 * k) + 0.05, -H + 0.2 + i * 0.3 + o, -0.2 + o * 4], [X[0] + W * (1 + 0.02 * k) - 0.05, -H + 0.2 + i * 0.3 + o, -0.2 + o * 4], 0.06 * (1 - 0.5 * k), 3, 0.025, i))).flat());
  const irr = merge(Array.from({ length: 14 }, (_, i) => { const c = [X[1] + (rnd() - 0.5) * 1.4, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.0], a = rnd() * 3.14, b = rnd() * 3.14, L = 0.55;
    const d = [Math.cos(a) * Math.sin(b) * L, Math.cos(b) * L, Math.sin(a) * Math.sin(b) * L * 0.6]; return fiber(sub(c, d), add(c, d), 0.04, 2, 0.028, i); }));
  const yel = k => { const s = 1 + 0.16 * k; return merge(Array.from({ length: 8 }, (_, i) => { const y = -H + 0.2 + i * 0.27, a = [X[2] - W * s + 0.05, y, -0.1 + (i % 3) * 0.1], b = [X[2] + W * s - 0.05, y, -0.1 + (i % 3) * 0.1], m = mul(add(a, b), 0.5);
    return merge([fiber(a, b, 0.06 * (1 - 0.95 * k), 2, 0.02, i), tube({ pts: [m, add(m, [0.25 * s, 0.25, 0])], r: 0.015, sides: 4 })]); })); };
  const rO = B.add(reg(0), fx('tDenseReg', '#f1d9de'));
  B.add(irr, fx('tDenseIrr', '#f1d9de'));
  const yO = B.add(yel(0), fx('tDenseYel', '#e8c23a'));
  B.add(merge(Array.from({ length: 6 }, (_, i) => place(ellipsoid({ r: [0.12, 0.035, 0.05], rows: 5, cols: 8 }), { at: [X[0] - 0.6 + (i % 3) * 0.6, -H + 0.35 + Math.floor(i / 3) * 0.9, 0] }))), fx('tDenseReg', '#6f5fc0'));
  B.label('tDenseReg', [X[0], H, D], [0, 1, 0.4]); B.label('tDenseIrr', [X[1], H, D], [0, 1, 0.4]); B.label('tDenseYel', [X[2], H, D], [0, 1, 0.4]);
  B.caption([X[0], -H - 0.3, D], () => ['أبيض منتظم', 'الأوتار']); B.caption([X[1], -H - 0.3, D], () => ['أبيض غير منتظم', 'أدمة الجلد']); B.caption([X[2], -H - 0.3, D], () => ['أصفر (مرن)', 'الرابط القفوي']);
  let lastK = -1;
  return { dist: 9.4, yaw: 0.1, pitch: 0.3, live2d: true, compactK: 1.2,
    anim(t){ const k = Math.max(0, Math.sin(t * 1.1)); if (Math.abs(k - lastK) > 0.04){ lastK = k; B.update(rO, reg(k)); B.update(yO, yel(k)); } } };
}

/* ═════════════ 8) الإسفنجي: حواجز عظمية متفرعة بينها نقي العظم ═════════════ */
function sponModel(B){
  const rnd = srng(91), P = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 2; k++) P.push([-2.4 + i * 1.2 + (rnd() - 0.5) * 0.5, -1.3 + j * 0.85 + (rnd() - 0.5) * 0.4, -0.6 + k * 1.2 + (rnd() - 0.5) * 0.3]);
  const bars = [], os = [], osAt = [];
  P.forEach((p, i) => P.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])]).filter(z => z[0] > i && z[1] < 1.5).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => {
    bars.push(tube({ pts: [p, add(mul(add(p, P[j]), 0.5), [(rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2, 0]), P[j]], r: 0.08 + rnd() * 0.06, sides: 8 }));
    const at = add(mul(add(p, P[j]), 0.5), [0, 0.11, 0.08]); osAt.push(at); os.push(place(ellipsoid({ r: [0.07, 0.045, 0.045], rows: 5, cols: 8 }), { at })); }));
  B.add(place(box(5.8, 3.4, 2.2, 0.2), { at: [0, 0, 0] }), { part: 'marrow', color: '#7a2a2a', alpha: 0.22, rim: 0.7, rimColor: '#ffb0a0', shell: { size: 6 } });
  B.add(merge(bars), fx('trabec', '#e9dcc0', { rimColor: '#fff6e0' }));
  B.add(merge(os), fx('osteo', '#2f8f86', { rimColor: '#c8fff4' }));
  B.label('trabec', P[10], [0, 0.4, 1]); B.label('osteo', osAt.filter(q => q[2] > 0).sort((u, v) => v[2] - u[2])[3], [0, 0.4, 1]); B.label('marrow', [-2.8, -1.6, 1.1], [0, -0.3, 1]);
  B.caption([0, -2.1, 1.1], () => ['', 'حواجز غير منتظمة تتفرع وتلتقي — لا أجهزة هافرس ولا قنوات هافرس وفولكمان']);
  return { dist: 8.6, yaw: 0.3, pitch: 0.3, live2d: true };
}

/* ═════════════ 10) البلازما واللمف: سائل يتجمع من الأنسجة ويرجع إلى مجرى الدم ═════════════ */
function lymModel(B){
  const L = 3.0;
  B.add(place(box(6.2, 2.6, 2.2, 0.2), { at: [0, -0.3, 0] }), Object.assign({}, MAT, { pop: false }));
  B.add(tube({ pts: [[-L, 0.8, 0], [L, 0.8, 0]], r: 0.36, sides: 24 }), { part: 'plasma', color: '#f6e3a6', alpha: 0.4, rim: 0.9, rimColor: '#ffb3a8', shell: { size: 2 } });
  const lp = [[-L, -1.1, 0.2], [-1, -1.15, 0.2], [1, -1.0, 0.2], [2.4, -0.4, 0.1], [2.8, 0.45, 0]];
  B.add(tube({ pts: spline(lp, 6), r: 0.24, sides: 20 }), { part: 'lymph', color: '#dff3e6', alpha: 0.45, rim: 0.9, rimColor: '#5aa070', shell: { size: 1.5 } });
  B.add(merge([[-1.8, -1.12, 0.2], [0, -1.12, 0.2], [1.6, -0.85, 0.2]].map(at => merge([place(ellipsoid({ r: 0.13, rows: 8, cols: 10 }), { at }), place(ball, { at: add(at, [0, 0, 0.04]), s: 0.095 })]))), fx('lympho', '#5a4ab0', { rimColor: '#d6eef9' }));
  const rbcM = ellipsoid({ r: [0.16, 0.05, 0.16], rows: 8, cols: 12 });
  const rb = t => merge(Array.from({ length: 9 }, (_, i) => place(rbcM, { at: [-L + ((i * 0.7 + t * 0.6) % (2 * L)), 0.8 + Math.sin(i) * 0.15, Math.cos(i) * 0.15], rot: [t + i, i, 0] })));
  const rO = B.add(rb(0), { color: '#d9433b', rim: 0.6, rimColor: '#ff9a8a', pop: false, center: [0, 0, 0] });
  const SP = spline(lp, 6);
  const lq = t => flow3(12, t, 0.12, (i, p) => { const x0 = -2.4 + i * 0.4; if (p < 0.4) return [x0, 0.5 - p / 0.4 * 1.5, 0.3]; const q = Math.min(SP.length - 1, Math.floor((p - 0.4) / 0.6 * (SP.length - 1))); return SP[q].slice(); });
  const lO = B.add(dots(lq(0), 0.05), { color: '#7fc79a', rim: 0.6, rimColor: '#ffffff', pop: false, center: [0, 0, 0] });
  B.label('plasma', [-L + 0.3, 1.1, 0.3], [0, 1, 0.5]); B.label('lymph', [-L + 0.3, -1.1, 0.4], [0, -0.3, 1]); B.label('lympho', [1.6, -0.85, 0.35], [0, -0.5, 1]);
  B.caption([0, -2.0, 1.1], () => ['', 'سائل يخرج إلى الأنسجة، يتجمع في الوعاء اللمفاوي، ويرجع إلى مجرى الدم']);
  return { dist: 8.6, yaw: 0.2, pitch: 0.25, live2d: true, anim(t){ B.update(rO, rb(t)); B.update(lO, merge(lq(t).map(p => place(ball, { at: p, s: 0.05 * p.s + 0.0001 })))); } };
}

/* ═════════════ 6) الغضروف: الشفاف، الليفي الأبيض، المطاط (يُضغط فيقاوم) ═════════════ */
function cartModel(B){
  const rnd = srng(7), X = [-2.4, 0, 2.4], R = 1.0, H = 0.7;
  const disc = (r, h) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], 36);
  const ids = ['cartHy', 'cartFi', 'cartEl'], cols = ['#cfe3ef', '#d8e3ea', '#cfe3ef'];
  X.forEach((x, k) => B.add(place(disc(R, H), { at: [x, 0, 0] }), { part: ids[k], color: cols[k], alpha: 0.32, rim: 0.9, rimColor: '#eef7fb', shell: { size: 2 + k * 0.01 } }));
  /* حزم ألياف بيض (الوسط: الليفي الأبيض) وألياف صفر مرنة (اليمين: المطاط) */
  const el = []; for (let i = 0; i < 14; i++){ const a = rnd() * 6.28, d = rnd() * 0.8, p = [X[2] + Math.cos(a) * d, (rnd() - 0.5) * 0.5, Math.sin(a) * d], q = add(p, [(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.7]); el.push(fiber(p, q, 0.04, 2, 0.015, i)); }
  B.add(merge(el), { part: 'cartEl', color: '#e8c23a', rim: 0.6, rimColor: '#fff3c8' });
  const fi = []; for (let i = -3; i <= 3; i++) for (const y of [-0.15, 0.15]){ const z = i * 0.24, hw = Math.sqrt(Math.max(0, R * R - z * z)) - 0.08; fi.push(fiber([X[1] - hw, y, z], [X[1] + hw, y, z], 0.03, 3, 0.03, i)); }
  B.add(merge(fi), { part: 'cartFi', color: '#f1d9de', rim: 0.6, rimColor: '#ffffff' });
  /* فجوات وفيها خلايا غضروفية */
  const lac = [], cel = [];
  X.forEach((x, k) => { for (let i = 0; i < 8; i++){ const a = i / 8 * 6.283 + k, d = (i % 2 ? 0.6 : 0.3), at = [x + Math.cos(a) * d, (rnd() - 0.5) * 0.3, Math.sin(a) * d * (k === 1 ? 0.6 : 1)];
    const two = k !== 1 && i % 3 === 0;
    lac.push(place(ellipsoid({ r: [two ? 0.17 : 0.11, 0.1, 0.1], rows: 8, cols: 12 }), { at }));
    (two ? [-0.06, 0.06] : [0]).forEach(o => cel.push(place(ellipsoid({ r: 0.065, rows: 6, cols: 8 }), { at: add(at, [o, 0, 0]) }))); } });
  B.add(merge(lac), { part: 'cCaps', color: '#a9c9dc', alpha: 0.55, rim: 0.8, rimColor: '#ffffff', shell: { size: 0.3, inner: 'chondro' } });
  B.add(merge(cel), { part: 'chondro', color: '#8a7fd6', rim: 0.6, rimColor: '#e6e0ff' });
  B.label('cartHy', [X[0] - R * 0.7, H / 2, R * 0.6], [0, 1, 0.5]);
  B.label('cartFi', [X[1], H / 2, R * 0.9], [0, 1, 0.5]);
  B.label('cartEl', [X[2] + R * 0.7, H / 2, R * 0.6], [0, 1, 0.5]);
  B.label('chondro', [X[2] + 0.6 * Math.cos(1 / 8 * 6.283 + 2), 0, 0.6 * Math.sin(1 / 8 * 6.283 + 2)], [0, 1, 0.3]);
  B.label('cCaps', [X[0] + 0.3, 0.05, 0], [0, 1, 0.3]);
  B.caption([X[0], -H / 2 - 0.3, R], () => ['الشفاف (الزجاجي)', 'الرغامى']);
  B.caption([X[1], -H / 2 - 0.3, R], () => ['الليفي الأبيض', 'الأقراص بين الفقرات']);
  B.caption([X[2], -H / 2 - 0.3, R], () => ['المطاط (الأصفر)', 'صيوان الأذن']);
  let k = 0;
  return {
    dist: 8.4, yaw: 0.1, pitch: 0.7, live2d: true, compactK: 1.2,
    xf: () => [1 + 0.05 * k, 0, 0, 0, 0, 1 - 0.12 * k, 0, 0, 0, 0, 1 + 0.05 * k, 0, 0, 0, 0, 1],
    anim(t){ k = Math.max(0, Math.sin(t * 1.5)); }
  };
}

/* ═════════════ 7) العظم المصمت: جهاز هافرس مقطوع، وخلفه الصفائح المحيطية والسمحاق ═════════════ */
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
  B.add(tube({ pts: [[-0.08, -H / 2, 0], [-0.08, H / 2, 0]], r: 0.1, sides: 12 }), { part: 'bVessel', color: '#d33333', rim: 0.7, rimColor: '#ffb3a8' });
  B.add(tube({ pts: [[0.12, -H / 2, 0.06], [0.12, H / 2, 0.06]], r: 0.07, sides: 10 }), { part: 'bVessel', color: '#3a6ad0', rim: 0.6, rimColor: '#c8d8ff' });
  /* الصفائح المحيطية (توازي سطح العظم) والسمحاق خلف جهاز هافرس */
  const arcR = [2.3, 2.52, 2.74];
  B.add(merge(arcR.map(r => lathe([[r, -H / 2], [r + 0.2, -H / 2], [r + 0.2, H / 2], [r, H / 2], [r, -H / 2]], 30, Math.PI + 0.35, 2 * Math.PI - 0.35))), { part: 'circLam', color: '#e3d2ae', rim: 0.6, rimColor: '#fff6e0' });
  B.add(lathe([[2.96, -H / 2], [3.1, -H / 2], [3.1, H / 2], [2.96, H / 2], [2.96, -H / 2]], 30, Math.PI + 0.35, 2 * Math.PI - 0.35), { part: 'periost', color: '#c9875a', rim: 0.6, rimColor: '#ffd0a8' });
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
  B.add(merge(lacs), { color: '#6a4a2c', rim: 0.4, rimColor: '#c9a070' });
  B.add(merge(cells), { part: 'osteo', color: '#b07a54', rim: 0.6, rimColor: '#ffe0c0' });
  B.add(merge(cans), { color: '#5a3a1c', rim: 0.4, rimColor: '#c9a070' });
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
  B.label('bVessel', [-0.08, -H / 2, 0], [0, -1, 0.4]);
  B.label('circLam', [0, H / 2, -arcR[1] - 0.1], [0, 1, -0.3]);
  B.label('periost', [Math.cos(Math.PI + 0.6) * 3.03, H / 2, Math.sin(Math.PI + 0.6) * 3.03], [-0.5, 1, -0.3]);
  B.caption([0, -H / 2 - 0.4, R], () => ['', 'صفائح عظمية متحدة المركز حول قناة هافرس (جهاز هافرس) — الأوعية الدموية في القناة']);
  return {
    dist: 9.6, yaw: 0.15, pitch: 0.55, live2d: true,
    anim(t){ B.update(fO, dots(flow(t), 0.05)); B.update(nO, dots(nut(t), 0.04)); }
  };
}

/* ═════════════ 9) الدم: خلايا الدم (رسم الملزمة ص69) تجري في وعاء دموي ═════════════ */
function bloodModel(B){
  const L = 3.4, R = 1.0, rnd = srng(3);
  const vessel = lathe([[R, -L], [R, L]], 40);
  B.add(place(vessel, { rot: [0, 0, Math.PI / 2] }), { color: '#b0503f', alpha: 0.22, rim: 1.0, rimColor: '#ffb3a8', shell: { size: 5 }, pop: false });
  B.add(place(lathe([[R * 0.97, -L], [R * 0.97, L]], 40), { rot: [0, 0, Math.PI / 2] }), { part: 'plasma', color: '#f6e3a6', alpha: 0.12, rim: 0.4, rimColor: '#fff6d0', shell: { size: 4.5 } });
  /* كرية حمراء: قرص مقعر الوجهين */
  const rbcM = ellipsoid({ r: [0.24, 0.08, 0.24], rows: 10, cols: 18, warp: p => { const d = Math.hypot(p[0], p[2]) / 0.24; return [p[0], p[1] * (0.35 + 0.65 * d * d), p[2]]; } });
  const RB = Array.from({ length: 26 }, () => ({ x: rnd() * 2 * L, y: (rnd() - 0.5) * 1.3, z: (rnd() - 0.5) * 1.3, r: [rnd() * 3, rnd() * 3, rnd() * 3], s: 0.85 + rnd() * 0.3 }));
  /* البيض: العدلة، الحمضة، القعدة (حبيبية) واللمفية، الوحيدة (لاحبيبية) */
  const WT = [{ id: 'neut', c: '#ead7ef', n: '#6a3a9a', r: 0.3, g: '#c79ad0' }, { id: 'eosin', c: '#f6d0cc', n: '#7a3a8a', r: 0.3, g: '#e0503a' }, { id: 'baso', c: '#d2e6f6', n: '#3a6ab0', r: 0.29, g: '#203a80' },
    { id: 'lympho', c: '#d6eef9', n: '#5a4ab0', r: 0.26 }, { id: 'mono', c: '#d8eef8', n: '#9a5ab0', r: 0.34 }];
  const WB = WT.map((w, i) => Object.assign({ x: i * 1.36, y: [0.35, -0.35, 0.1, -0.2, 0.3][i], z: [0.2, -0.3, -0.45, 0.4, -0.1][i] }, w));
  const PL = Array.from({ length: 14 }, () => ({ x: rnd() * 2 * L, y: (rnd() - 0.5) * 1.4, z: (rnd() - 0.5) * 1.4 }));
  const X = (x0, sp, t) => -L + (((x0 + t * sp) % (2 * L)) + 2 * L) % (2 * L);
  const ok = (y, z) => Math.hypot(y, z) < R * 0.85;
  const rbM = t => merge(RB.filter(c => ok(c.y, c.z)).map(c => place(rbcM, { at: [X(c.x, 0.8, t), c.y, c.z], rot: [c.r[0] + t, c.r[1], c.r[2]], s: c.s })));
  const nucOf = (w, at) => w.id === 'lympho' ? [place(ellipsoid({ r: 0.19, rows: 8, cols: 10 }), { at })] :
    w.id === 'mono' ? [place(ellipsoid({ r: [0.2, 0.12, 0.14], rows: 8, cols: 10, disp: d => 1 + 0.3 * Math.max(0, d[0]) }), { at: add(at, [0.04, 0, 0.12]) })] :
    w.id === 'eosin' ? [-1, 1].map(s => place(ellipsoid({ r: 0.1, rows: 6, cols: 8 }), { at: add(at, [s * 0.1, 0, 0.14]) })) :
    w.id === 'baso' ? [place(ellipsoid({ r: [0.16, 0.08, 0.08], rows: 6, cols: 8 }), { at: add(at, [0, 0, 0.14]), rot: [0, 0, 0.8] })] :
    [-0.12, -0.04, 0.05, 0.12].map((o, k) => place(ellipsoid({ r: 0.07, rows: 5, cols: 6 }), { at: add(at, [o, (k % 2 ? 0.06 : -0.04), 0.13]) }));
  const granOf = (w, at) => { if (!w.g) return []; const rr = srng(w.id.length * 7); return Array.from({ length: 16 }, () => { const a = rr() * 6.28, b = rr() * 3.14, d = w.r * 0.8;
    return place(ellipsoid({ r: w.id === 'neut' ? 0.018 : 0.03, rows: 4, cols: 5 }), { at: add(at, [Math.cos(a) * Math.sin(b) * d, Math.cos(b) * d, Math.sin(a) * Math.sin(b) * d]) }); }); };
  const wAt = (c, t) => [X(c.x, 0.4, t), c.y + Math.sin(t * 0.8 + c.x) * 0.05, c.z];
  const wBody = (c, at, t) => place(ellipsoid({ r: c.r, rows: 12, cols: 16, disp: d => 1 + 0.05 * Math.sin(d[0] * 7 + d[1] * 5 + t) }), { at });
  const wbO = WB.map(c => { const at = wAt(c, 0);
    return { c, b: B.add(wBody(c, at, 0), { part: c.id, color: c.c, alpha: 0.75, rim: 0.9, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }),
      n: B.add(merge(nucOf(c, at)), { part: c.id, color: c.n, rim: 0.5, rimColor: '#e0d8ff', pop: false, center: [0, 0, 0] }),
      g: c.g ? B.add(merge(granOf(c, at)), { part: c.id, color: c.g, rim: 0.4, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }) : null }; });
  const plM = t => merge(PL.filter(c => ok(c.y, c.z)).map(c => place(ellipsoid({ r: [0.07, 0.035, 0.05], rows: 5, cols: 8 }), { at: [X(c.x, 0.95, t), c.y, c.z] })));
  const rO = B.add(rbM(0), { part: 'rbc', color: '#d9433b', rim: 0.7, rimColor: '#ff9a8a', pop: false, center: [0, 0, 0] });
  /* خلايا الدم الحمر في الجمل: بيضوية محدبة الوجهين (تحت الوعاء للمقارنة) */
  B.add(merge([[-0.5, 0.06], [0.1, -0.04], [0.65, 0.05]].map(([x, z]) => place(ellipsoid({ r: [0.3, 0.1, 0.18], rows: 10, cols: 14 }), { at: [x, -R - 0.55, 0.4 + z], rot: [0.2, 0.3, 0] }))), { part: 'rbcCamel', color: '#d9433b', rim: 0.7, rimColor: '#ff9a8a' });
  const pO = B.add(plM(0), { part: 'platelet', color: '#c08bd0', rim: 0.7, rimColor: '#f0d8ff', pop: false, center: [0, 0, 0] });
  const lbl = { rbc: [0, 0, 0], pl: [0, 0, 0] }, wl = {}; WB.forEach(c => { wl[c.id] = [0, 0, 0]; B.label(c.id, wl[c.id], [0, 1, 0.6]); });
  B.label('plasma', [L - 0.4, R * 0.7, R * 0.7], [0, 0.5, 1]);
  B.label('rbc', lbl.rbc, [0, 0, 1]);
  B.label('rbcCamel', [0.95, -R - 0.55, 0.45], [1, 0, 0.5]);
  B.label('platelet', lbl.pl, [0, 0, 1]);
  B.caption([0, -R - 0.95, 0.6], () => ['', 'تحت الوعاء: خلايا الدم الحمر في الجمل بيضوية محدبة الوجهين خالية من النواة']);
  const cp = (d, s) => { d[0] = s[0]; d[1] = s[1]; d[2] = s[2]; };
  return {
    dist: 9, yaw: 0.25, pitch: 0.25, target: [0, -0.3, 0], live2d: true, noSpin: true,
    anim(t){
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null, sp = id => (f && f !== id ? 0.2 : 1);
      const tr = t * sp('rbc'), tp = t * sp('platelet');
      B.update(rO, rbM(tr)); B.update(pO, plM(tp));
      wbO.forEach(o => { const tw = t * sp(o.c.id), at = wAt(o.c, tw); B.update(o.b, wBody(o.c, at, t));
        B.update(o.n, merge(nucOf(o.c, at))); if (o.g) B.update(o.g, merge(granOf(o.c, at))); cp(wl[o.c.id], [at[0], at[1] + o.c.r, at[2]]); });
      /* الأسماء تتبع أقرب جسم للوسط */
      const near = (arr, sp2, tt) => arr.filter(c => ok(c.y, c.z)).map(c => [X(c.x, sp2, tt), c.y, c.z]).sort((a, b) => Math.abs(a[0] - 0.5) - Math.abs(b[0] - 0.5))[0];
      cp(lbl.rbc, near(RB, 0.8, tr)); cp(lbl.pl, near(PL, 0.95, tp));
    }
  };
}

Object.assign(G3.models, { con_cparts: partsModel, con_cadip: adipModel, con_cret: retModel, con_cmuc: mucModel, con_cdense: denseModel,
  con_ccart: cartModel, con_cbone: boneModel, con_cspon: sponModel, con_cblood: bloodModel, con_clym: lymModel });
})();
