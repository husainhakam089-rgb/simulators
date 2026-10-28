
/* ══════════════════════════════════════════════════════════════════════════
   9.7 · مجسّمات النسيج العضلي: ألياف هيكلية مخططة تتقلص بالزر، خلايا ملساء
         بموجة تقلص، ألياف قلبية متفرعة تنبض، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, ellipsoid, capsule, tube, place, merge, srng, computeNormals, mk } = G3;
const SKEL = '#c9505a', BAND = '#7a2430', NUC = '#7565c2';
function lathe(prof, cols){
  const m = mk(), R = prof.length, C = cols || 20;
  for (let i = 0; i < R; i++){ const [r, y] = prof[i]; for (let j = 0; j < C; j++){ const a = j / C * 6.2832, p = [r * Math.cos(a), y, r * Math.sin(a)]; m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0); } }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C; j++){ const a = i * C + j, b = i * C + (j + 1) % C, c = a + C, d = b + C; m.i.push(a, b, c, b, d, c); }
  return computeNormals(m);
}
const spindle = (R, H) => { const p = []; for (let i = 0; i <= 18; i++){ const u = i / 18; p.push([Math.max(0.001, R * Math.sin(Math.PI * u)), -H / 2 + H * u]); } return lathe(p, 16); };
const toX = [0, 0, Math.PI / 2];   /* تدوير المحور y إلى المحور x (التخطط يبقى على طول الليف) */

/* ═════ 1) الهيكلي ═════ */
function skelModel(B){
  const L = 4.6, X0 = -2.4, rnd = srng(4);
  const F = [[0.9, 0.3], [0.2, -0.35], [-0.5, 0.25], [-0.2, 0.85], [0.55, -0.9]];
  const fibs = F.map(([y, z]) => place(capsule({ r: 0.3, len: L, rows: 6, cols: 20 }), { rot: toX, at: [X0 + L / 2 + 0.3, y, z] }));
  B.add(fibs[0], { part: 'mFiber', color: SKEL, rim: 0.6, rimColor: '#ffc8c8', pat: 1, patColor: BAND, patK: 26 });
  B.add(merge(fibs.slice(1)), { part: 'tSkel', color: SKEL, rim: 0.6, rimColor: '#ffc8c8', pat: 1, patColor: BAND, patK: 26 });
  /* نوى كثيرة على أطراف (محيط) كل ليف */
  const nuc = [];
  F.forEach(([y, z], k) => { for (let i = 0; i < 7; i++){ const a = rnd() * 6.28; nuc.push(place(ellipsoid({ r: [0.16, 0.05, 0.07], rows: 5, cols: 10 }), { at: [X0 + 0.7 + i * 0.6 + rnd() * 0.2, y + Math.cos(a) * 0.29, z + Math.sin(a) * 0.29], rot: [a, 0, 0] })); } });
  B.add(merge(nuc), { part: 'mNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  /* عظم عند الطرف الثابت */
  B.add(place(capsule({ r: 0.35, len: 2.6, rows: 6, cols: 16 }), { at: [X0, 0, 0], rot: [Math.PI / 2, 0, 0] }), { color: '#e9dcc0', rim: 0.5, rimColor: '#fff6e0', pop: false, fixed: true });
  /* شريط تأشير على التخطط */
  B.add(place(capsule({ r: 0.305, len: 0.06, rows: 3, cols: 20 }), { rot: toX, at: [X0 + 3.2, F[3][0], F[3][1]] }), { part: 'mStri', color: BAND, rim: 0.6, rimColor: '#ffb0b8' });
  B.label('mFiber', [X0 + L, F[0][0] + 0.25, F[0][1]], [0.5, 1, 0.3]);
  B.label('tSkel', [X0 + L - 0.2, F[2][0], F[2][1] + 0.3], [0.5, 0, 1]);
  B.label('mStri', [X0 + 3.2, F[3][0], F[3][1] + 0.3], [0, 0.4, 1]);
  B.label('mNuc', [X0 + 1.3, F[1][0] + 0.29, F[1][1]], [0, 1, 0.3]);
  B.caption([0, -1.4, 1], () => ['', MUS.k > 0.05 ? 'الليف يقصر ويثخن عند التقلص' : 'اضغط «تقلّص»: العضلة الهيكلية إرادية']);
  return {
    dist: 8.2, yaw: 0.35, pitch: 0.3, live2d: true, tools: ['contract'],
    xf: () => { const k = MUS.k, sx = 1 - 0.18 * k, sy = 1 + 0.12 * k; return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sy, 0, X0 * (1 - sx), 0, 0, 1]; }
  };
}

/* ═════ 2) الأملس ═════ */
function smoothModel(B){
  const C = [];
  for (let r = 0; r < 5; r++) for (let i = -1; i < 4; i++) for (const z of [-0.35, 0.35]){
    const x = -2.6 + i * 1.6 + (r % 2 ? 0.8 : 0), y = -1.2 + r * 0.55;
    if (x < -3 || x > 3) continue; C.push([x, y, z + (r % 2 ? 0.18 : 0)]); }
  const cellsAt = t => C.map(([x, y, z], i) => { const w = Math.max(0, Math.sin(t * 1.1 - x * 1.2)), sx = 1 - 0.22 * w, sy = 1 + 0.3 * w;
    return { m: place(spindle(0.26, 1.9), { rot: toX, at: [x, y, z], s: [sy, sx, sy] }), n: place(ellipsoid({ r: [0.22, 0.06, 0.07], rows: 5, cols: 10 }), { at: [x, y, z + 0.2 * sy], s: [sx, 1, 1] }), i }; });
  const A = cellsAt(0);
  const one = B.add(A[0].m, { part: 'mFiber', color: '#d97c84', alpha: 0.85, rim: 0.7, rimColor: '#ffd8dc', center: C[0] });
  const rest = B.add(merge(A.slice(1).map(o => o.m)), { part: 'tSmooth', color: '#d97c84', alpha: 0.85, rim: 0.7, rimColor: '#ffd8dc', center: [0, 0, 0] });
  const nuc = B.add(merge(A.map(o => o.n)), { part: 'mNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff', pop: false, center: [0, 0, 0] });
  B.label('mFiber', add(C[0], [-0.6, 0, 0.2]), [0, 0, 1]);
  B.label('mNuc', add(C[6], [0, 0, 0.25]), [0, 0, 1]);
  B.label('tSmooth', [2.4, 0.9, 0.5], [0, 0, 1]);
  B.caption([0, -1.9, 0.8], () => ['', 'لاإرادية: موجة تقلص بطيئة متتابعة']);
  let last = -1;
  return {
    dist: 8, yaw: 0.25, pitch: 0.25, live2d: true,
    anim(t){ if (t - last < 0.033) return; last = t; const sp = focusOwner === 'tSmooth' ? 1.6 : 1, S = cellsAt(t * sp);
      B.update(one, S[0].m); B.update(rest, merge(S.slice(1).map(o => o.m))); B.update(nuc, merge(S.map(o => o.n))); }
  };
}

/* ═════ 3) القلبي ═════ */
function cardModel(B){
  /* تُبنى الألياف عمودية (حتى يمتد التخطط على طولها) ثم تُدار أفقياً */
  const L = 5.0, Ys = [-1.2, 0, 1.2], R = 0.27;
  const fib = Ys.map(z => tube({ pts: [[z, -L / 2, 0], [z, L / 2, 0]], r: R, sides: 16 }));
  const br = [[-1.2, -0.6, 0, 0.4], [0, 0.9, 1.2, 1.7], [1.2, -1.4, 0, -0.8], [0, -1.8, -1.2, -1.2]].map(([z0, y0, z1, y1]) => tube({ pts: [[z0, y0, 0], [z1, y1, 0]], r: R * 0.85, sides: 14 }));
  B.add(place(merge(fib.concat(br)), { rot: toX }), { part: 'tCard', color: '#b8434f', rim: 0.6, rimColor: '#ffc8c8', pat: 1, patColor: BAND, patK: 28 });
  const discs = [], nuc = [];
  Ys.forEach((z, k) => { [-1.3 + k * 0.3, 0.2 + k * 0.2, 1.6 - k * 0.2].forEach(y => discs.push(place(lathe([[0.001, -0.035], [R * 1.04, -0.035], [R * 1.04, 0.035], [0.001, 0.035]], 18), { at: [z, y, 0] })));
    [-1.9, -0.6, 0.9, 2.1].forEach(y => nuc.push(place(ellipsoid({ r: [0.07, 0.15, 0.05], rows: 6, cols: 10 }), { at: [z, y + k * 0.15, R * 0.98] }))); });
  B.add(place(merge(discs), { rot: toX }), { part: 'icDisc', color: '#3a0f18', rim: 0.6, rimColor: '#ff8090' });
  B.add(place(merge(nuc), { rot: toX }), { part: 'mNuc', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  const rot = p => [-p[1], p[0], p[2]];
  B.label('tCard', rot([1.2, 2.3, 0.25]), [0, 0, 1]);
  B.label('icDisc', rot([0, 0.2, R]), [0, 0, 1]);
  B.label('mNuc', rot([-1.2, -1.9, R]), [0, 0, 1]);
  B.caption([0, -2.0, 0.8], () => ['', 'لاإرادية: تنبض بانتظام وباستمرار']);
  return {
    dist: 8.2, yaw: 0.25, pitch: 0.3, live2d: true,
    xf: () => { const s = 1 - 0.05 * MUS.k, y = 1 + 0.04 * MUS.k; return [s, 0, 0, 0, 0, y, 0, 0, 0, 0, y, 0, 0, 0, 0, 1]; }
  };
}

/* ═════ 4) قارن ═════ */
function cmpModel(B){
  const X = [-3.0, 0, 3.0];
  B.add(merge([0.25, -0.35].map(y => place(capsule({ r: 0.26, len: 2.0, rows: 6, cols: 18 }), { rot: toX, at: [X[0], y, 0] }))), { part: 'tSkel', color: SKEL, rim: 0.6, rimColor: '#ffc8c8', pat: 1, patColor: BAND, patK: 26 });
  B.add(merge([-0.6, 0, 0.6].map((x, i) => place(ellipsoid({ r: [0.14, 0.045, 0.06], rows: 5, cols: 8 }), { at: [X[0] + x, i % 2 ? 0.5 : -0.1, 0.12] }))), { part: 'tSkel', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  B.add(place(spindle(0.32, 2.4), { rot: toX, at: [X[1], 0, 0] }), { part: 'tSmooth', color: '#d97c84', alpha: 0.85, rim: 0.7, rimColor: '#ffd8dc' });
  B.add(place(ellipsoid({ r: [0.24, 0.07, 0.08], rows: 6, cols: 10 }), { at: [X[1], 0, 0.22] }), { part: 'tSmooth', color: NUC, rim: 0.5, rimColor: '#d8d0ff' });
  B.add(place(merge([tube({ pts: [[0, -1.1, 0], [0, 1.1, 0]], r: 0.28, sides: 14 }), tube({ pts: [[0, 0.1, 0], [0.8, 0.7, 0]], r: 0.24, sides: 12 })]), { rot: toX, at: [X[2], 0, 0] }), { part: 'tCard', color: '#b8434f', rim: 0.6, rimColor: '#ffc8c8', pat: 1, patColor: BAND, patK: 28 });
  const disc = B.add(place(lathe([[0.001, -0.04], [0.3, -0.04], [0.3, 0.04], [0.001, 0.04]], 18), { rot: toX, at: [X[2] + 0.35, 0, 0] }), { part: 'tCard', color: '#3a0f18', rim: 0.8, rimColor: '#ffd166' });
  B.label('tSkel', [X[0], 0.55, 0.2], [0, 1, 0.4]);
  B.label('tSmooth', [X[1], 0.35, 0.2], [0, 1, 0.4]);
  B.label('tCard', [X[2] - 0.6, -0.8, 0.2], [0, 1, 0.4]);
  B.caption([X[0], -1.1, 0.5], () => ['الهيكلي', 'مخطط · متعدد النوى · إرادي']);
  B.caption([X[1], -1.1, 0.5], () => ['الأملس', 'غير مخطط · نواة وسطية · لاإرادي']);
  B.caption([X[2], -1.1, 0.5], () => ['القلبي', 'مخطط · متفرع · أقراص بينية']);
  return { dist: 9.4, yaw: 0.1, pitch: 0.3, live2d: true, compactK: 1.25, anim(t){ disc.rim = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.4)); } };
}

Object.assign(G3.models, { mus_mskel: skelModel, mus_msmooth: smoothModel, mus_mcard: cardModel, mus_mcmp: cmpModel });
})();
