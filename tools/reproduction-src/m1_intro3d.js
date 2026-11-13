/* ══════════════════════════════════════════════════════════════════════════
   9.1 · مجسّمات التكاثر والأمشاج — البيضة والنطف والإخصاب، النطف الناضجة،
         والمبيض بحويصلاته (ملزمة ص4 وص6–8)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;

/* نطفة: رأس بيضوي + قطعة وسطية + ذيل متموج على اتجاه dir، ph طور التموج */
function spermMesh(at, dir, s, ph){
  const d = norm(dir), up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const side = norm([d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]);
  const P = (u, w) => add(add(at, mul(d, -u * s)), mul(side, w * s));
  const head = place(ellipsoid({ r: [0.11, 0.17, 0.08], rows: 8, cols: 12 }), { s, dir: d, at: P(-0.02, 0) });
  const mid = place(capsule({ r: 0.035, len: 0.16, rows: 3, cols: 8 }), { s, dir: d, at: P(0.24, 0) });
  const pts = []; for (let i = 0; i <= 18; i++){ const u = i / 18; pts.push(P(0.32 + u * 1.0, Math.sin(u * 9 + ph) * 0.09 * u)); }
  const tail = tube({ pts, r: u => 0.022 * (1 - u * 0.6) * s, sides: 6 });
  return { head, body: merge([mid, tail]) };
}

/* ═════════════ 1) الإخصاب: نطف تسبح نحو البيضة ثم تتكون الزيجة ═════════════ */
function typesModel(B){
  const EGG = [0.2, 0, 0];
  B.add(place(ellipsoid({ r: 1.25, rows: 22, cols: 34 }), { at: EGG }), { part: 'ovum', color: '#f2a7b8', alpha: 0.35, rim: 1.3, rimColor: '#9fd8ff', shell: { size: 2.6 } });
  B.add(place(ellipsoid({ r: 0.38, rows: 14, cols: 20 }), { at: add(EGG, [-0.2, 0.15, 0.1]) }), { part: 'zygote', color: '#c0304a', rim: 0.8, rimColor: '#ffd0da' });
  const R = srng(9), sp = [];
  for (let i = 0; i < 6; i++){ const a = i / 6 * 6.2832 + 0.3, e = (R() - 0.5) * 1.2; sp.push({ a, e, r0: 3.0 + R() * 0.8, ph: R() * 6 }); }
  const pos = (o, t) => { const p = (t * 0.12 + o.a / 6.2832) % 1, r = o.r0 - p * (o.r0 - 1.32);
    const at = add(EGG, [Math.cos(o.a) * r, o.e * (r / o.r0), Math.sin(o.a) * r]); return { at, dir: norm([-(at[0] - EGG[0]), -(at[1] - EGG[1]), -(at[2] - EGG[2])]) }; };
  const recs = sp.map((o, i) => { const q = pos(o, 0), m = spermMesh(q.at, q.dir, 1, o.ph);
    return { h: B.add(m.head, { part: 'sperm', color: '#e8ecff', rim: 0.9, rimColor: '#9fb6ff', pop: false, center: EGG }),
             b: B.add(m.body, { part: 'sperm', color: '#9fb6ff', rim: 0.7, rimColor: '#ffffff', pop: false, center: EGG }), o }; });
  B.label('ovum', add(EGG, [0.9, -0.85, 0.2]), [1, -0.6, 0.2]);
  B.label('zygote', add(EGG, [-0.2, 0.5, 0.1]), [0, 1, 0.3]);
  B.label('sperm', add(EGG, [2.4, 0.4, 0.6]), [1, 0.3, 0.2]);
  B.caption([0.2, -1.9, 0], () => ['تكاثر جنسي: اتحاد نواتي النطفة والبيضة', 'واختلاط المادة الوراثية وتكوين أول خلية جنينية']);
  return { dist: 9, yaw: 0.3, pitch: 0.3, target: [0.2, 0, 0],
    anim(t){ recs.forEach(R => { const q = pos(R.o, t), m = spermMesh(q.at, q.dir, 1, R.o.ph + t * 8); B.update(R.h, m.head); B.update(R.b, m.body); }); } };
}

/* ── أدوات مشتركة للمجسّمين المرحليين (الخصية/المبيض): نسخة شبكية تُنقل وتُكبّر حسب المرحلة ── */
const xform = (m, s, at) => { const p = new Array(m.p.length); for (let i = 0; i < m.p.length; i += 3){ p[i] = m.p[i] * s + at[0]; p[i + 1] = m.p[i + 1] * s + at[1]; p[i + 2] = m.p[i + 2] * s + at[2]; }
  return { p, n: m.n, l: m.l, i: m.i }; };
/* نصف قشرة خلفية (z ≤ 0) لمجسّم بيضوي، ووجه قطع مسطّح أمامي يُرسم عليه المحتوى */
const halfShell = (rx, ry, rz) => { const m = G3.mk(), R = 14, C = 28;
  for (let i = 0; i <= R; i++){ const th = Math.PI * i / R; for (let j = 0; j <= C; j++){ const ph = Math.PI + Math.PI * j / C;
    const x = rx * Math.sin(th) * Math.cos(ph), y = -ry * Math.cos(th), z = rz * Math.sin(th) * Math.sin(ph); m.p.push(x, y, z); m.l.push(x, y, z); m.n.push(0, 0, 0); } }
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++){ const a = i * (C + 1) + j, b = a + 1, c = a + C + 1, d = c + 1; m.i.push(a, b, c, b, d, c); }
  return G3.computeNormals(m); };
const faceDisc = (rx, ry) => G3.place(G3.ellipsoid({ r: [rx, ry, 0.02], rows: 6, cols: 40 }), { at: [0, 0, 0] });
/* سجلّ: كائن واحد بموقعين (مكبّر في الوسط / مصغّر جانباً) — يُحدَّث عند تغيّر المرحلة فقط */
function staged(B){
  const recs = [];
  return {
    add(mesh, o, grp){ const r = B.add(mesh, Object.assign({ pop: false, center: [0, 0, 0] }, o)); recs.push({ r, mesh, grp }); return r; },
    place(grp, s, at){ recs.forEach(R => { if (R.grp === grp) B.update(R.r, xform(R.mesh, s, at)); }); },
    each(fn){ recs.forEach(fn); }
  };
}

/* ═════════════ 2) تكوين النطف — مرحلي: الخصية ← مقطع النبيب المنوي ← المراحل الخمس ═════════════ */
function spermModel(B){
  const { add, mul, ellipsoid, tube, place, merge, srng } = G3;
  const SG = staged(B), ball = (r, at, n) => place(ellipsoid({ r, rows: n || 8, cols: (n || 8) + 4 }), { at });
  /* 1) الخصية: نصف خلفي + وجه قطع، حواجز وفصوص ونبيبات ملتوية */
  const RX = 1.3, RY = 1.65, M = [0.7, -1.05];
  SG.add(halfShell(RX + 0.06, RY + 0.06, 0.9), { part: 'gTestis', color: '#f7e4d6', rim: 1.0, rimColor: '#ffffff' }, 'T');
  SG.add(faceDisc(RX, RY), { part: 'gTestis', color: '#f0c4ae', rim: 0.5, rimColor: '#ffe8dc' }, 'T');
  const A = [-1.75, -2.45, -3.05, 2.65, 2.05, 1.45, 0.85, 0.2];
  SG.add(merge(A.map(a => tube({ pts: [[M[0], -M[1] * 1, 0.03], [(M[0] + Math.cos(a) * RX) / 2 + 0.1, -(M[1] + Math.sin(a) * RY) / 2, 0.03], [Math.cos(a) * RX * 0.98, -Math.sin(a) * RY * 0.98, 0.03]], r: 0.022, sides: 4 }))),
    { part: 'gTestis', color: '#fff3ea', rim: 0.4 }, 'T');
  const tubs = [];
  for (let i = 0; i < A.length - 1; i++){ let a0 = A[i], a1 = A[i + 1]; if (i === 2) a1 -= 6.2832; const am = (a0 + a1) / 2, pts = [];
    for (let j = 0; j <= 30; j++){ const u = j / 30, rr = 0.25 + u * 0.68, aa = am + Math.sin(u * 23) * Math.abs(a1 - a0) * 0.3 * (0.4 + u * 0.6);
      pts.push([M[0] * (1 - rr) + Math.cos(aa) * RX * rr, -(M[1] * (1 - rr) + Math.sin(aa) * RY * rr), 0.06]); }
    tubs.push(tube({ pts, r: 0.04, sides: 5 })); }
  SG.add(merge(tubs), { part: 'semTub', color: '#b9764e', rim: 0.7, rimColor: '#ffd2b0' }, 'T');
  const magPts = Array.from({ length: 25 }, (_, i) => [-0.62 + Math.cos(i / 24 * 6.2832) * 0.24, -0.7 + Math.sin(i / 24 * 6.2832) * 0.24, 0.1]);
  SG.add(tube({ pts: magPts, r: 0.025, sides: 5 }), { color: '#ffe08a', rim: 0.6 }, 'T');
  /* 2) مقطع عرضي في نبيب منوي: أسطوانة قصيرة ووجهها الأمامي بحلقات الخلايا */
  const TR = 1.25, rings = [
    { id: 'gGerm', r: 1.08, n: 30, cr: 0.06, col: '#a8a0c0', flat: true, hl: 2 },
    { id: 'spGonium', r: 0.92, n: 22, cr: 0.085, col: '#b07ad8', hl: 2, a0: -0.87 },
    { id: 'spPrim', r: 0.73, n: 15, cr: 0.11, col: '#a565d6', hl: 3, a0: -0.44 },
    { id: 'spSec', r: 0.55, n: 14, cr: 0.08, col: '#c08ae0', hl: 4, a0: 0 },
    { id: 'spTid', r: 0.42, n: 18, cr: 0.055, col: '#cfa0ec', hl: 5, a0: 0.44 }];
  SG.add(tube({ pts: [[0, 0, -0.9], [0, 0, 0]], r: TR + 0.06, sides: 40 }), { part: 'semTubX', color: '#f3d6c0', rim: 1.0, rimColor: '#fff3ea' }, 'S');
  SG.add(faceDisc(TR, TR), { part: 'semTubX', color: '#fbeee4', rim: 0.4, rimColor: '#ffffff' }, 'S');
  const ringObj = {};
  rings.forEach(R => { const ms = [];
    for (let i = 0; i < R.n; i++){ const a = (R.a0 || 0) + i * 6.2832 / R.n, at = [Math.cos(a) * R.r, -Math.sin(a) * R.r, 0.05];
      ms.push(R.flat ? place(ellipsoid({ r: [R.cr * 1.6, R.cr * 0.7, R.cr * 0.6], rows: 5, cols: 8 }), { at, rot: [0, 0, -a + Math.PI / 2] }) : ball(R.cr, at, 6)); }
    ringObj[R.id] = SG.add(merge(ms), { part: R.id, color: R.col, rim: 0.8, rimColor: '#ffffff' }, 'S'); ringObj[R.id].hl = R.hl; });
  const spH = [], spT = [];
  for (let i = 0; i < 12; i++){ const a = 0.87 + i * 6.2832 / 12, at = [Math.cos(a) * 0.33, -Math.sin(a) * 0.33, 0.07], m = G3.spermMesh(at, [-Math.cos(a), Math.sin(a), 0], 0.28, i); spH.push(m.head); spT.push(m.body); }
  ringObj.spermM = SG.add(merge(spH.concat(spT)), { part: 'spermM', color: '#e8ecff', rim: 0.9, rimColor: '#9fb6ff' }, 'S'); ringObj.spermM.hl = 6;
  /* 3) مخطط المراحل: خلايا تظهر مرحلة بعد مرحلة */
  const LX = 1.45, Y = [2.15, 1.35, 0.5, -0.32, -1.3], lin = [];
  const cell = (r, at, st, part) => { const o = B.add(merge([ball(r, at, 10), ball(r * 0.42, add(at, [-r * 0.12, r * 0.1, r * 0.62]), 8)]), { part, color: '#b07ad8', rim: 0.9, rimColor: '#f1dcff', pop: false, center: at }); o.st = st; lin.push(o); return o; };
  cell(0.2, [LX, Y[0], 0], 2, 'spGonium');
  cell(0.27, [LX, Y[1], 0], 3, 'spPrim');
  [-0.5, 0.5].forEach(dx => cell(0.21, [LX + dx, Y[2], 0], 4, 'spSec'));
  [-0.75, -0.25, 0.25, 0.75].forEach(dx => cell(0.15, [LX + dx, Y[3], 0], 5, 'spTid'));
  const arr = (p0, p1, st) => { const o = B.add(tube({ pts: [p0, p1], r: 0.02, sides: 5 }), { color: '#d9784a', rim: 0.4, pop: false }); o.st = st; lin.push(o); };
  arr([LX, Y[0] - 0.22, 0], [LX, Y[1] - (-0.3), 0], 3);
  [-0.5, 0.5].forEach(dx => arr([LX + dx * 0.15, Y[1] - 0.27, 0], [LX + dx * 0.9, Y[2] + 0.22, 0], 4));
  [-0.75, -0.25, 0.25, 0.75].forEach(dx => arr([LX + (dx < 0 ? -0.5 : 0.5), Y[2] - 0.21, 0], [LX + dx, Y[3] + 0.16, 0], 5));
  const spRecs = [-0.75, -0.25, 0.25, 0.75].map((dx, i) => { const m = G3.spermMesh([LX + dx, Y[4] + 0.35, 0], [0, 1, 0], 0.95, i);
    const h = B.add(m.head, { part: 'spermM', color: '#e8ecff', rim: 0.9, rimColor: '#9fb6ff', pop: false, center: [LX, Y[4], 0] }), b = B.add(m.body, { part: 'spermM', color: '#9fb6ff', rim: 0.7, rimColor: '#ffffff', pop: false, center: [LX, Y[4], 0] });
    h.st = b.st = 6; lin.push(h, b); return { h, b, x: LX + dx, i }; });
  const io = B.add(tube({ pts: [[LX - 1.0, Y[3] - 0.32, 0], [LX + 1.0, Y[3] - 0.32, 0]], r: 0.012, sides: 4 }), { part: 'spermio', color: '#e8e0f0', rim: 0.4, pop: false }); io.st = 6; lin.push(io);
  const m1 = B.add(tube({ pts: [[LX + 1.0, Y[1], 0], [LX + 1.1, Y[1], 0], [LX + 1.1, Y[2], 0], [LX + 1.0, Y[2], 0]], r: 0.02, sides: 4 }), { part: 'meio1', color: '#ffe08a', rim: 0.5, pop: false }); m1.st = 4; lin.push(m1);
  const m2 = B.add(tube({ pts: [[LX + 1.0, Y[2] - 0.1, 0], [LX + 1.1, Y[2] - 0.1, 0], [LX + 1.1, Y[3], 0], [LX + 1.0, Y[3], 0]], r: 0.02, sides: 4 }), { part: 'meio2', color: '#ffe08a', rim: 0.5, pop: false }); m2.st = 5; lin.push(m2);
  /* الأسماء حسب المرحلة */
  const at = (s, ...ss) => () => ss.includes(STG.idx) && (s === undefined || true);
  const big = { T: [1, [0, 0, 0]], S: [1, [0, 0, 0]] }, small = { S: [0.62, [-1.9, 0.1, 0]] };
  const P = (grp, x, y, z) => { const p = STG.idx === 0 || STG.idx === 1 ? big[grp] : small[grp]; return [x * p[0] + p[1][0], y * p[0] + p[1][1], (z || 0) * p[0] + p[1][2]]; };
  void P;
  B.label('gTestis', [-RX, 0.2, 0.05], [-1, 0.2, 0.3], at(0, 0));
  B.label('semTub', [-0.62, -0.7, 0.1], [-0.6, -1, 0.4], at(0, 0));
  B.label('semTubX', [-TR * 0.95, -0.4, 0.05], [-1, -0.3, 0.3], at(0, 1));
  B.label('gGerm', [-1.02, 0.35, 0.06], [-1, 0.4, 0.3], at(0, 1));
  [['spGonium', 0.92, -0.87], ['spPrim', 0.73, -0.44], ['spSec', 0.55, 0], ['spTid', 0.42, 0.44], ['spermM', 0.33, 0.87]].forEach(([id, r, a]) =>
    B.label(id, [Math.cos(a) * r, -Math.sin(a) * r, 0.08], [1, -Math.sin(a) * 0.8, 0.3], at(0, 1)));
  B.label('spGonium', [LX + 0.2, Y[0], 0], [1, 0.2, 0.2], at(0, 2, 3, 4, 5, 6));
  B.label('spPrim', [LX + 0.27, Y[1], 0], [1, 0.1, 0.2], at(0, 3, 4, 5, 6));
  B.label('meio1', [LX + 1.1, (Y[1] + Y[2]) / 2, 0], [1, 0, 0.2], at(0, 4, 5, 6));
  B.label('spSec', [LX + 0.71, Y[2], 0], [1, 0, 0.2], at(0, 4, 5, 6));
  B.label('meio2', [LX + 1.1, (Y[2] + Y[3]) / 2, 0], [1, 0, 0.2], at(0, 5, 6));
  B.label('spTid', [LX + 0.9, Y[3], 0], [1, -0.1, 0.2], at(0, 5, 6));
  B.label('spermio', [LX - 1.0, Y[3] - 0.32, 0], [-1, -0.2, 0.2], at(0, 6));
  B.label('spermM', [LX + 0.75, Y[4], 0], [1, -0.3, 0.2], at(0, 6));
  B.caption([0, -2.45, 0], () => [(SPERM_STAGES[STG.idx] || {}).n || '']);
  let last = -1;
  return { dist: 9.0, yaw: 0.1, pitch: 0.1, target: [0.1, 0.05, 0], live2d: true,
    anim(t){ const s = STG.idx;
      if (s !== last){ last = s;
        SG.place('T', 1, [0, 0, 0]); SG.place('S', s === 1 ? 1 : 0.55, s === 1 ? [0, 0, 0] : [-2.0, -1.25, 0]);
        SG.each(R => { R.r.hide = R.grp === 'T' ? s !== 0 : s === 0; });
        Object.values(ringObj).forEach(o => { o.alpha = s <= 1 ? 1 : o.hl === s ? 1 : o.hl < s ? 0.85 : 0.35; });
        lin.forEach(o => { o.hide = s < 2 || o.st > s; }); }
      Object.values(ringObj).forEach(o => { o.glow = s >= 2 && o.hl === s ? 0.5 + 0.5 * Math.sin(t * 4) : o.glow; });
      if (s === 6) spRecs.forEach(R => { const m = G3.spermMesh([R.x, Y[4] + 0.35 + Math.sin(t * 2 + R.i) * 0.03, 0], [Math.sin(t * 1.3 + R.i) * 0.08, 1, 0], 0.95, t * 8 + R.i); B.update(R.h, m.head); B.update(R.b, m.body); });
    } };
}

/* ═════════════ 3) تكوين البيوض — مرحلي: مقطع المبيض ← المراحل، والحويصلة المقابلة تتوهج ═════════════ */
function eggModel(B){
  const { add, ellipsoid, tube, place, merge, spline, capsule } = G3;
  const SG = staged(B), ball = (r, at, n) => place(ellipsoid({ r, rows: n || 8, cols: (n || 8) + 4 }), { at });
  const RX = 1.5, RY = 1.18, Fp = { germ: [-1.28, -0.2], prim: [-1.04, 0.62], sec: [-0.3, 0.92], graaf: [0.7, 0.7], rel: [1.18, -0.2], cl: [0.4, -0.78] };
  SG.add(halfShell(RX + 0.08, RY + 0.08, 0.9), { part: 'ovary', color: '#f2b3a8', rim: 1.0, rimColor: '#fff0ea' }, 'O');
  SG.add(faceDisc(RX, RY), { part: 'ovary', color: '#e98a8a', rim: 0.4, rimColor: '#ffd8d0' }, 'O');
  const fol = (c, R, oR, antrum) => { const at = [c[0], c[1], 0.05], ms = [place(ellipsoid({ r: [R, R, R * 0.35], rows: 8, cols: 16 }), { at })];
    const oo = [ball(oR, add(at, [antrum ? -R * 0.32 : 0, antrum ? -R * 0.3 : 0, R * 0.3]), 8)], an = antrum ? [place(ellipsoid({ r: [R * antrum, R * antrum, R * 0.3], rows: 8, cols: 14 }), { at: add(at, [R * 0.12, R * 0.08, R * 0.12]) })] : [];
    return { wall: merge(ms), oo: merge(oo), an: an.length ? merge(an) : null }; };
  const hlObjs = [];
  const addFol = (key, c, R, oR, antrum, part, hl) => { const f = fol(c, R, oR, antrum);
    const w = SG.add(f.wall, { part, color: '#f6c3b0', rim: 0.8, rimColor: '#ffffff' }, 'O'); w.hl = hl; hlObjs.push(w);
    if (f.an){ const a = SG.add(f.an, { part, color: '#cfe7ff', rim: 0.6, rimColor: '#ffffff' }, 'O'); a.hl = hl; hlObjs.push(a); }
    const o = SG.add(f.oo, { part, color: '#8f7ad8', rim: 0.8, rimColor: '#e8e0ff' }, 'O'); o.hl = hl; hlObjs.push(o); };
  const germ = merge(Array.from({ length: 9 }, (_, i) => { const a = 2.55 + i * 0.13; return ball(0.045, [Math.cos(a) * (RX - 0.04), -Math.sin(a) * (RY - 0.04), 0.05], 5); })
    .concat([[-1.18, -0.06], [-1.22, -0.36], [-1.1, -0.22]].map(([x, y]) => ball(0.06, [x, y, 0.06], 6))));
  const g = SG.add(germ, { part: 'oGerm', color: '#b9a6ec', rim: 0.7, rimColor: '#ffffff' }, 'O'); g.hl = 1; hlObjs.push(g);
  addFol('prim', Fp.prim, 0.17, 0.08, 0, 'ooPrim', 2);
  addFol('sec', Fp.sec, 0.26, 0.09, 0.45, 'ooFol', 3);
  addFol('graaf', Fp.graaf, 0.4, 0.1, 0.62, 'graaf', 4);
  const cl = SG.add(place(ellipsoid({ r: [0.28, 0.24, 0.12], rows: 8, cols: 14 }), { at: [Fp.cl[0], Fp.cl[1], 0.06] }), { part: 'corpusL', color: '#f2c14e', rim: 0.9, rimColor: '#fff3c8' }, 'O'); cl.hl = 6; hlObjs.push(cl);
  const duct = spline([[2.3, 1.5, 0], [2.0, 1.2, 0.05], [1.96, 0.7, 0.1], [1.76, 0.12, 0.15]], 6, false);
  SG.add(tube({ pts: duct, r: u => 0.1 + u * 0.06, sides: 10 }), { part: 'oviduct', color: '#d9505a', rim: 0.9, rimColor: '#ffc0c0' }, 'O');
  SG.add(merge(Array.from({ length: 8 }, (_, i) => { const a = 1.7 + i * 0.28; return tube({ pts: [[1.76, 0.12, 0.15], [1.76 + Math.cos(a) * 0.22, 0.12 - Math.sin(a) * 0.26, 0.15], [1.76 + Math.cos(a) * 0.34, 0.12 - Math.sin(a) * 0.4, 0.15]], r: 0.03, sides: 4 }); })),
    { part: 'oviduct', color: '#e8707a', rim: 0.8, rimColor: '#ffd0d0' }, 'O');
  const relMesh = ball(0.11, [0, 0, 0.12], 8);
  const relO = B.add(relMesh, { part: 'ooSec', color: '#8f7ad8', rim: 0.9, rimColor: '#e8e0ff', pop: false, center: [0, 0, 0] }); relO.hl = 4; hlObjs.push(relO);
  /* مخطط المراحل يميناً */
  const LX = 1.3, Y = [2.15, 1.25, 0.1, -1.2], lin = [];
  const cell = (r, at, st, part, col) => { const o = B.add(merge([ball(r, at, 10), ball(r * 0.42, add(at, [-r * 0.12, r * 0.1, r * 0.62]), 8)]), { part, color: col || '#8f7ad8', rim: 0.9, rimColor: '#e8e0ff', pop: false, center: at }); o.st = st; lin.push(o); return o; };
  cell(0.18, [LX, Y[0], 0], 1, 'ooGonium');
  cell(0.28, [LX, Y[1], 0], 2, 'ooPrim');
  const fc = B.add(tube({ pts: Array.from({ length: 25 }, (_, i) => [LX + Math.cos(i / 24 * 6.2832) * 0.38, Y[1] + Math.sin(i / 24 * 6.2832) * 0.38, 0]), r: 0.03, sides: 5 }), { part: 'ooPrim', color: '#f2c97a', rim: 0.5, pop: false }); fc.st = 2; lin.push(fc);
  cell(0.12, [LX - 0.86, Y[2], 0], 3, 'polar1', '#c9a0e8');
  cell(0.3, [LX + 0.42, Y[2], 0], 3, 'ooSec');
  [-1.46, -0.92, -0.38].forEach(dx => cell(0.11, [LX + dx, Y[3], 0], 5, 'polar2', '#c9a0e8'));
  cell(0.32, [LX + 0.58, Y[3], 0], 5, 'ootid', '#a98ae8');
  const ring = B.add(tube({ pts: Array.from({ length: 33 }, (_, i) => [LX + 0.58 + Math.cos(i / 32 * 6.2832) * 0.44, Y[3] + Math.sin(i / 32 * 6.2832) * 0.44, 0]), r: 0.025, sides: 5 }), { part: 'ovumM', color: '#ffe08a', rim: 0.6, pop: false }); ring.st = 6; lin.push(ring);
  const arr = (p0, p1, st) => { const o = B.add(tube({ pts: [p0, p1], r: 0.02, sides: 5 }), { color: '#d9784a', rim: 0.4, pop: false }); o.st = st; lin.push(o); };
  arr([LX, Y[0] - 0.2, 0], [LX, Y[1] + 0.4, 0], 2);
  arr([LX - 0.15, Y[1] - 0.36, 0], [LX - 0.78, Y[2] + 0.14, 0], 3); arr([LX + 0.12, Y[1] - 0.38, 0], [LX + 0.36, Y[2] + 0.3, 0], 3);
  [-1.46, -0.92].forEach(dx => arr([LX - 0.86, Y[2] - 0.13, 0], [LX + dx, Y[3] + 0.12, 0], 5));
  arr([LX + 0.3, Y[2] - 0.28, 0], [LX - 0.38, Y[3] + 0.12, 0], 5); arr([LX + 0.46, Y[2] - 0.3, 0], [LX + 0.56, Y[3] + 0.33, 0], 5);
  const mm1 = B.add(tube({ pts: [[LX + 1.0, Y[1], 0], [LX + 1.1, Y[1], 0], [LX + 1.1, Y[2], 0], [LX + 1.0, Y[2], 0]], r: 0.02, sides: 4 }), { part: 'oMeio1', color: '#ffe08a', rim: 0.5, pop: false }); mm1.st = 3; lin.push(mm1);
  const mm2 = B.add(tube({ pts: [[LX + 1.0, Y[2] - 0.2, 0], [LX + 1.1, Y[2] - 0.2, 0], [LX + 1.1, Y[3], 0], [LX + 1.0, Y[3], 0]], r: 0.02, sides: 4 }), { part: 'oMeio2', color: '#ffe08a', rim: 0.5, pop: false }); mm2.st = 5; lin.push(mm2);
  /* الموقعان: مكبّر (المرحلة 1) / مصغّر يساراً */
  const SMALL = [0.6, [-2.1, -0.9, 0]], BIG = [1.15, [-0.15, 0, 0]];
  const pos = () => STG.idx === 0 ? BIG : SMALL;
  const W = (x, y, z) => { const p = pos(); return [x * p[0] + p[1][0], y * p[0] + p[1][1], (z || 0) * p[0] + p[1][2]]; };
  const vis = (...ss) => () => ss.includes(STG.idx);
  /* أسماء المبيض بموقعيه: نسختان من كل اسم، واحدة لكل موقع */
  const ovL = [['ovary', -RX, 0.1, [-1, 0.2, 0.3]], ['oGerm', -1.2, -0.2, [-1, -0.4, 0.3]], ['ooPrim', Fp.prim[0], Fp.prim[1] + 0.17, [-0.6, 1, 0.3]], ['ooFol', Fp.sec[0], Fp.sec[1] + 0.26, [0, 1, 0.3]],
    ['graaf', Fp.graaf[0] + 0.3, Fp.graaf[1] + 0.25, [0.6, 1, 0.3]], ['oviduct', 2.1, 1.3, [1, 0.6, 0.2]], ['corpusL', Fp.cl[0] + 0.25, Fp.cl[1] - 0.15, [0.5, -1, 0.3]]];
  ovL.forEach(([id, x, y, n]) => { B.label(id, [x * BIG[0] + BIG[1][0], y * BIG[0], 0.1], n, vis(0)); });
  B.label('ooSec', [(Fp.rel[0] + 0.25) * BIG[0] + BIG[1][0], (Fp.rel[1] + 0.1) * BIG[0], 0.15], [1, -0.4, 0.3], vis(0));
  [['ovary', -RX, 0.1, [-1, 0.2, 0.3]], ['graaf', Fp.graaf[0], Fp.graaf[1] + 0.4, [-0.2, 1, 0.3]], ['corpusL', Fp.cl[0], Fp.cl[1] - 0.24, [-0.3, -1, 0.3]], ['oviduct', 2.2, 1.4, [0.2, 1, 0.2]]].forEach(([id, x, y, n]) =>
    B.label(id, [x * SMALL[0] + SMALL[1][0], y * SMALL[0] + SMALL[1][1], 0.1], n, vis(1, 2, 3, 4, 5, 6)));
  B.label('ooGonium', [LX + 0.18, Y[0], 0], [1, 0.2, 0.2], vis(1, 2, 3, 4, 5, 6));
  B.label('ooPrim', [LX + 0.38, Y[1], 0], [1, 0.1, 0.2], vis(2, 3, 4, 5, 6));
  B.label('oMeio1', [LX + 1.1, (Y[1] + Y[2]) / 2, 0], [1, 0, 0.2], vis(3, 4, 5, 6));
  B.label('ooSec', [LX + 0.72, Y[2], 0], [1, 0, 0.2], vis(3, 4, 5, 6));
  B.label('polar1', [LX - 0.86, Y[2] + 0.12, 0], [-0.3, 1, 0.2], vis(3, 4, 5, 6));
  B.label('oMeio2', [LX + 1.1, (Y[2] + Y[3]) / 2 - 0.1, 0], [1, 0, 0.2], vis(5, 6));
  B.label('polar2', [LX - 0.92, Y[3] - 0.11, 0], [0, -1, 0.2], vis(5, 6));
  B.label('ootid', [LX + 0.9, Y[3], 0], [1, -0.2, 0.2], vis(5));
  B.label('ovumM', [LX + 1.02, Y[3], 0], [1, -0.2, 0.2], vis(6));
  B.caption([0, -2.45, 0], () => [(EGG_STAGES[STG.idx] || {}).n || '']);
  let last = -1;
  return { dist: 9.2, yaw: 0.1, pitch: 0.1, target: [0, 0.15, 0], live2d: true,
    anim(t){ const s = STG.idx, p = pos();
      if (s !== last){ last = s; SG.place('O', p[0], p[1]);
        hlObjs.forEach(o => { o.alpha = s === 0 ? 1 : o.hl === s ? 1 : 0.55; });
        lin.forEach(o => { o.hide = s === 0 || o.st > s; }); }
      hlObjs.forEach(o => { if (s >= 1 && o.hl === s) o.glow = 0.5 + 0.5 * Math.sin(t * 4); });
      /* الخلية البيضية الثانوية: داخل حويصلة كراف، وتتحرر نحو القمع في المرحلة 5 */
      const k = s === 4 ? Math.min(1, STG.k * 1.3) : s > 4 ? 1 : s === 0 ? 0.5 : 0, c = [Fp.rel[0] + 0.1 + k * 0.5, Fp.rel[1] + 0.06 + k * 0.22, 0];
      B.update(relO, xform(relMesh, p[0], W(c[0], c[1], c[2])));
      relO.hide = s >= 1 && s < 3; void capsule;
    } };
}

Object.assign(G3.models, { int_itypes: typesModel, int_isperm: spermModel, int_iegg: eggModel });
G3.spermMesh = spermMesh;
})();

