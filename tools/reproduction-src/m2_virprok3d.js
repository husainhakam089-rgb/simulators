/* ══════════════════════════════════════════════════════════════════════════
   9.2 · مجسّمات الفايروسات والبدائيات — نفس أجزاء الرسوم المسطّحة وأسمائها
         (ملزمة ص17، ص19، ص20–21). المراحل تُقرأ من STG فيتحرك المجسّم مع الشريط.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, rot3, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;

/* كبسولة أفقية (عصوية) على المحور x */
const rod = (r, len, at, rows, cols) => place(capsule({ r, len, rows: rows || 8, cols: cols || 24 }), { rot: [0, 0, Math.PI / 2], at: at || [0, 0, 0] });
/* حلقة على مسار مغلق */
const ring = (pts, r, sides) => tube({ pts: spline(pts, 8, true), r, sides: sides || 8, closed: true });
const ellipsePts = (c, rx, rz, n, wob, seed) => { const rr = srng(seed || 1), P = [];
  for (let i = 0; i < n; i++){ const a = i / n * 6.2832; P.push([c[0] + Math.cos(a) * rx * (1 + (rr() - 0.5) * (wob || 0)), c[1] + (rr() - 0.5) * (wob || 0) * 0.3, c[2] + Math.sin(a) * rz * (1 + (rr() - 0.5) * (wob || 0))]); } return P; };
/* كروموسوم بكتيري متشابك */
const tanglePts = (c, s, seed) => { const rr = srng(seed), P = [];
  for (let i = 0; i < 14; i++){ const a = i / 14 * 6.2832 * 2.3; P.push([c[0] + Math.cos(a) * (0.22 + rr() * 0.16) * s, c[1] + (rr() - 0.5) * 0.25 * s, c[2] + Math.sin(a * 1.3) * (0.16 + rr() * 0.1) * s]); } return P; };

/* مجسم فيروس مكتمل صغير كشبكة واحدة (للفيروسات الجديدة داخل الخلية وعند تحررها) */
function phageMesh(at, s, dir){
  const d = norm(dir || [0, 1, 0]), P = v => add(at, mul(v, s));
  const up = d, side = norm([up[1], -up[0], 0.0001]);
  const Q = (u, w) => add(add(at, mul(up, u * s)), mul(side, w * s));
  return merge([place(ellipsoid({ r: [0.34 * s, 0.42 * s, 0.34 * s], rows: 6, cols: 6 }), { at: Q(1.0, 0), dir: d }),
    place(capsule({ r: 0.07 * s, len: 0.6 * s, rows: 3, cols: 8 }), { at: Q(0.35, 0), dir: d })].concat([-1, 1].map(sg => tube({ pts: [Q(0.05, 0), Q(-0.15, sg * 0.35)], r: 0.02 * s, sides: 4 })))); }
/* ═════════════ دورة تكاثر راشح البلعم البكتيري (ص17–18) — تتبع المراحل الست ═════════════
   1 الاتصال · 2 الاختراق · 3 التخليق · 4 الإنضاج · 5 التحرر (دورة التحلل) · 6 التكامل (دورة التحلل والإنتاج) */
function phageModel(B){
  const R = srng(17), CELL = rod(0.62, 2.4);
  const wall = B.add(CELL, { part: 'vWall', color: '#c98a4a', alpha: 0.3, rim: 1.3, rimColor: '#ffe2b8', shell: { size: 3.2, inner: 'vBac', tau: 0.3 } });
  const ringPts = ellipsePts([0, 0, 0], 0.9, 0.38, 12, 0.18, 4);
  const bdna = B.add(ring(ringPts, 0.045), { part: 'vBDNA', color: '#d23a3a', rim: 0.6, rimColor: '#ffc0c0' });
  /* 1) الاتصال: فيروس ينزل حتى تلتصق ألياف ذنبه بالجدار */
  const AT = [0.55, 0.6, 0];
  const att = k => ({ at: add(AT, [0, 0.9 * (1 - k), 0]) });
  const coatO = B.add(place(ellipsoid({ r: [0.34, 0.42, 0.34], rows: 6, cols: 6 }), { at: add(AT, [0, 1.0, 0]) }), { part: 'vCoat', color: '#7fd07a', alpha: 0.45, rim: 1.2, rimColor: '#eaffd8', shell: { size: 0.5 }, pop: false, center: AT });
  const naM = (o, full) => tube({ pts: spline([[-0.12, 0.85, 0], [0.1, 0.95, 0.06], [-0.08, 1.08, -0.05], [0.1, 1.2, 0.04]].map(p => add(o, mul(p, full ? 1 : 0.35))), 6, false), r: 0.035, sides: 6 });
  const naO = B.add(naM(AT, true), { part: 'vNA', color: '#ff6fb0', rim: 0.6, rimColor: '#ffd2e8', pop: false, center: AT });
  const tailM = o => merge([place(capsule({ r: 0.07, len: 0.6, rows: 3, cols: 10 }), { at: add(o, [0, 0.32, 0]) }),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i * 1.047; return tube({ pts: [add(o, [0, 0.02, 0]), add(o, [Math.cos(a) * 0.28, -0.12, Math.sin(a) * 0.28]), add(o, [Math.cos(a) * 0.4, -0.28, Math.sin(a) * 0.4])], r: 0.02, sides: 5 }); })]);
  const tailO = B.add(tailM(AT), { part: 'vAttach', color: '#4fb05a', rim: 0.6, rimColor: '#d8ffd0', pop: false, center: AT });
  /* 2) الاختراق: DNA الفيروس يدخل الخلية عبر الثقب */
  const inj = u => { const pts = []; for (let i = 0; i <= 12; i++){ const v = i / 12 * Math.max(0.05, u); pts.push([0.55 - v * 0.6 + Math.sin(v * 14) * 0.05, 0.6 - v * 0.8, Math.cos(v * 11) * 0.06]); } return tube({ pts, r: 0.03, sides: 5 }); };
  const penO = B.add(inj(1), { part: 'vPen', color: '#ff6fb0', rim: 0.7, rimColor: '#ffd2e8', pop: false, center: [0.3, 0.2, 0] });
  /* 3) التخليق: DNA البكتريا يتحطم، وتُبنى نسخ من DNA الفيروس وأجزاء بروتينية (رؤوس وأذناب) */
  const frags = B.add(merge(ringPts.filter((_, i) => i % 3 === 0).map((p, i) => tube({ pts: [mul(p, 0.9), mul(ringPts[(i * 3 + 1) % 12], 0.9)], r: 0.035, sides: 4 }))), { part: 'vBDNA', color: '#d23a3a', alpha: 0.5, rim: 0.4, pop: false });
  const SP = Array.from({ length: 10 }, () => [(R() - 0.5) * 2.4, (R() - 0.5) * 0.7, (R() - 0.5) * 0.6]);
  const synth = k => merge(SP.map((p, i) => { const s = 0.2 + 0.8 * k; return i % 3 === 0 ? tube({ pts: spline([add(p, [-0.12 * s, 0, 0]), add(p, [0, 0.07 * s, 0.04]), add(p, [0.12 * s, 0, 0])], 4, false), r: 0.025, sides: 4 })
    : i % 3 === 1 ? place(ellipsoid({ r: 0.1 * s, rows: 4, cols: 6 }), { at: p }) : place(capsule({ r: 0.025, len: 0.18 * s, rows: 2, cols: 6 }), { at: p }); }));
  const synO = B.add(synth(1), { part: 'vSynth', color: '#8fdc6a', rim: 0.7, rimColor: '#f0ffe0', pop: false, center: [0, 0, 0] });
  /* 4) الإنضاج: تتجمع الأغطية حول DNA فتتكون فيروسات جديدة داخل الخلية */
  const NP = Array.from({ length: 8 }, (_, i) => [-1.1 + i * 0.31, (i % 2 ? 0.18 : -0.2), (i % 3 - 1) * 0.15]);
  const mature = (k, out) => merge(NP.map((p, i) => { const dir = norm([Math.cos(i * 0.8), 1, Math.sin(i * 0.8)]), o = add(p, mul(norm([p[0] * 0.5, p[1] + (i % 2 ? 0.4 : -0.4), p[2] + 0.3]), out * 2.2));
    return phageMesh(add(o, mul(dir, -0.15)), 0.42 * (0.4 + 0.6 * k), dir); }));
  const matO = B.add(mature(1, 0), { part: 'vMature', color: '#6cc85a', rim: 0.8, rimColor: '#e8ffd8', pop: false, center: [0, 0, 0] });
  /* 5) التحرر: تتحلل الخلية (قطع من الجدار تتطاير) وتخرج الفيروسات */
  const shards = k => merge(Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.2832, d = [Math.cos(a), Math.sin(a) * 0.5, Math.sin(a) * 0.5 + 0.1], c = add([Math.cos(a) * 1.0, Math.sin(a) * 0.55, 0], mul(d, k * 1.4));
    return place(ellipsoid({ r: [0.28, 0.16, 0.05], rows: 4, cols: 8 }), { at: c, dir: [d[1], -d[0], 0.3] }); }));
  const relWall = B.add(shards(0), { part: 'vRelease', color: '#c98a4a', alpha: 0.7, rim: 1.0, rimColor: '#ffe2b8', pop: false, center: [0, 0, 0] });
  const relO = B.add(mature(1, 0), { part: 'vRelease', color: '#6cc85a', rim: 0.8, rimColor: '#e8ffd8', pop: false, center: [0, 0, 0] });
  /* 6) التكامل: DNA الفيروس يندمج مع DNA البكتريا (بلعم أولي) ويتضاعف معه عند انقسام البكتيريا */
  const vdna = k => tube({ pts: spline([[1.1 - k * 0.5, 0.25, 0.25], [0.9 - k * 0.45, 0.32 - k * 0.1, 0.2], [0.75 - k * 0.4, 0.2 - k * 0.1, 0.18]], 4, false), r: 0.04, sides: 5 });
  const vdnaO = B.add(vdna(0), { part: 'vDNA', color: '#ff6fb0', rim: 0.7, rimColor: '#ffd2e8', pop: false, center: [0.6, 0.2, 0] });
  const prophSeg = c => tube({ pts: spline([0, 1, 2].map(i => add(ringPts[i], c)), 4, false), r: 0.065, sides: 6 });
  const prophO = B.add(prophSeg([0, 0, 0]), { part: 'vProph', color: '#ff6fb0', rim: 0.8, rimColor: '#ffd2e8', pop: false, center: [0.6, 0, 0] });
  const integO = B.add(rod(0.66, 2.5), { part: 'vInteg', color: '#e8b070', alpha: 0.22, rim: 1.2, rimColor: '#fff0d0', shell: { size: 3.6 }, pop: false });
  const DC = [[-1.0, -1.7, 0], [1.0, -1.7, 0]];
  const daughters = merge(DC.map(c => merge([place(capsule({ r: 0.32, len: 0.7, rows: 6, cols: 16 }), { rot: [0, 0, Math.PI / 2], at: c })])));
  const daO = B.add(daughters, { part: 'vDaugh', color: '#c98a4a', alpha: 0.4, rim: 1.2, rimColor: '#ffe2b8', shell: { size: 1.2 }, pop: false });
  const daD = B.add(merge(DC.map(c => merge([ring(ringPts.map(p => add(mul(p, 0.45), c)), 0.025), tube({ pts: spline([0, 1, 2].map(i => add(mul(ringPts[i], 0.45), c)), 4, false), r: 0.04, sides: 5 })]))),
    { part: 'vProph', color: '#ff6fb0', rim: 0.7, rimColor: '#ffd2e8', pop: false });
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('vBac', [-0.9, -0.35, 0.3], [0, -1, 0.4], vis(0, 1, 2, 3));
  B.label('vWall', [-1.6, 0.2, 0.3], [-1, 0.3, 0], vis(0, 1, 2, 3, 5));
  B.label('vBDNA', [-0.8, 0, -0.2], [-0.5, -1, 0], vis(0, 1, 2));
  B.label('vCoat', [0.85, 1.05, 0], [1, 0.3, 0], vis(0, 1));
  B.label('vNA', [0.55, 1.6, 0], [0.3, 1, 0], vis(0));
  B.label('vAttach', [0.95, 0.4, 0], [1, -0.2, 0.2], vis(0));
  B.label('vPen', [0.3, 0.1, 0.06], [1, -0.4, 0.4], vis(1));
  B.label('vSynth', [-0.4, 0.2, 0.2], [-0.3, 1, 0.3], vis(2));
  B.label('vMature', [0.5, 0.2, 0.2], [0.3, 1, 0.3], vis(3));
  B.label('vRelease', [1.4, 0.6, 0.2], [1, 0.5, 0.2], vis(4));
  B.label('vInteg', [-1.6, 0.2, 0.3], [-1, 0.3, 0], vis(5));
  B.label('vDNA', [1.0, 0.3, 0.25], [1, 0.5, 0.3], vis(5));
  B.label('vProph', add(ringPts[1], [0, 0.05, 0.05]), [0.4, 1, 0.3], vis(5));
  B.label('vDaugh', [1.35, -1.7, 0], [1, -0.3, 0], vis(5));
  B.caption([0, -2.4, 0], () => [(VIR_STAGES[STG.idx] || {}).n || '']);
  return { dist: 8.2, yaw: 0.4, pitch: 0.22, target: [0.1, -0.1, 0], live2d: true,
    anim(t){ const s = STG.idx, k = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, STG.k)));
      const a = s === 0 ? att(k).at : AT, full = s === 0;
      wall.hide = s === 4; bdna.hide = s >= 2 && s !== 5; frags.hide = s !== 2;
      coatO.hide = tailO.hide = s >= 4; naO.hide = s >= 2;
      B.update(coatO, place(ellipsoid({ r: [0.34, 0.42, 0.34], rows: 6, cols: 6 }), { at: add(a, [0, 1.0, 0]) }));
      B.update(naO, naM(a, s === 0 || (s === 1 && k < 0.5))); B.update(tailO, tailM(a)); void full;
      penO.hide = s !== 1 && s !== 2; if (s === 1) B.update(penO, inj(k)); else if (s === 2) B.update(penO, inj(1));
      synO.hide = s !== 2; if (s === 2) B.update(synO, synth(k));
      matO.hide = s !== 3; if (s === 3) B.update(matO, mature(k, 0));
      relWall.hide = relO.hide = s !== 4; if (s === 4){ B.update(relWall, shards(k)); B.update(relO, mature(1, k)); }
      vdnaO.hide = prophO.hide = integO.hide = daO.hide = daD.hide = s !== 5; if (s === 5) B.update(vdnaO, vdna(k));
    } };
}

/* ═════════════ الانشطار الثنائي في البكتيريا (ص19) — يتبع المرحلة ═════════════ */
function fissModel(B){
  const R = 0.5;
  /* الحالة من المراحل الخمس: الطول، المسافة بين الكروموسومين، تخصر وانفصال */
  const st = () => { const s = STG.idx, k = STG.k;
    let L = 1.6, dup = 0, sep = 0, cut = 0, split = 0;
    if (s >= 1) L = 1.6 + 0.6 * (s === 1 ? k : 1);
    if (s >= 2) dup = s === 2 ? k : 1;
    if (s >= 3){ sep = s === 3 ? k : 1; cut = sep; }
    if (s >= 4) split = k;
    return { L, dup, sep, cut, split, attach: s === 0 }; };
  /* نصفا الخلية: كبسولتان تتداخلان ثم تتباعدان (التخصر ثم الانقسام) */
  const halves = S => { const half = S.L / 2, off = S.cut * 0.55 + S.split * 0.5, len = Math.max(0.01, half + 0.2 - S.cut * 0.25);
    return [rod(R * (1 - S.cut * 0.04), len, [-(len / 2 + 0.02) + (S.cut ? -off * 0.6 : 0) - S.split * 0.3, 0, 0]),
            rod(R * (1 - S.cut * 0.04), len, [(len / 2 + 0.02) + (S.cut ? off * 0.6 : 0) + S.split * 0.3, 0, 0])]; };
  const chrom = (S, sg, seed) => { const x = sg * (S.dup * 0.18 + S.sep * 0.55 + S.split * 0.3);
    return tube({ pts: spline(tanglePts([x, 0, 0], 1, seed), 6, true), r: 0.03, sides: 5, closed: true }); };
  const S0 = st(), H = halves(S0);
  const cellA = B.add(H[0], { part: 'fExpand', color: '#ffe680', alpha: 0.42, shell: { size: 1.6 }, rim: 1.4, rimColor: '#9fe06a', pop: false, center: [0, 0, 0] });
  const cellB = B.add(H[1], { part: 'fExpand', color: '#ffe680', alpha: 0.42, shell: { size: 1.6 }, rim: 1.4, rimColor: '#9fe06a', pop: false, center: [0, 0, 0] });
  const chA = B.add(chrom(S0, -1, 3), { part: 'fChrom', color: '#2a2a2a', rim: 0.5, rimColor: '#888', pop: false, center: [0, 0, 0] });
  const chB = B.add(chrom(S0, 1, 4), { part: 'fDup', color: '#3a3a3a', rim: 0.5, rimColor: '#888', pop: false, center: [0, 0, 0] });
  const att = B.add(place(capsule({ r: 0.05, len: 0.4, rows: 2, cols: 6 }), { at: [0, 0.3, 0.1] }), { part: 'fAttach', color: '#d24', rim: 0.6, rimColor: '#fbb', pop: false });
  B.label('fChrom', [-0.2, 0.05, 0.1], [0, 1, 0.6]);
  B.label('fExpand', [1.0, -0.3, 0.3], [0.5, -1, 0.3]);
  B.caption([0, -1.1, 0], () => [PRK_FISS_CAP[STG.idx] || '']);
  return { dist: 5.6, yaw: 0.2, pitch: 0.45, target: [0, 0, 0], live2d: true,
    anim(){ const S = st(), Hh = halves(S); B.update(cellA, Hh[0]); B.update(cellB, Hh[1]);
      B.update(chA, chrom(S, -1, 3)); B.update(chB, chrom(S, 1, 4)); chB.hide = S.dup <= 0.02; att.hide = !S.attach; } };
}
const PRK_FISS_CAP = ['1 · اتصال الكروموسوم بمواقع من الغشاء', '2 · توسع الخلية', '3 · تضاعف DNA وبدء التخصر', '4 · انسحاب الكروموسومين وزيادة التخصر', '5 · تنقسم الخلية إلى خليتين متماثلتين'];

/* ═════════════ الاقتران في البكتيريا (ص20–21) — يتبع المرحلة ═════════════ */
function conjModel(B){
  const DX = -1.05, RX = 1.05;
  const cellD = place(capsule({ r: 0.55, len: 1.0, rows: 8, cols: 24 }), { at: [DX, 0, 0] });
  B.add(cellD, { part: 'cDonor', color: '#ffe680', alpha: 0.4, rim: 1.4, rimColor: '#9fe06a', shell: { size: 1.8 } });
  const recO = B.add(place(capsule({ r: 0.55, len: 1.0, rows: 8, cols: 24 }), { at: [RX, 0, 0] }), { part: 'cRecip', color: '#ffe680', alpha: 0.4, rim: 1.4, rimColor: '#9fe06a', pop: false, center: [RX, 0, 0] });
  const fig8 = (x, col, part) => B.add(merge([ring(ellipsePts([x, 0.35, 0], 0.26, 0.18, 10), 0.035), ring(ellipsePts([x, -0.15, 0], 0.26, 0.18, 10), 0.035)]),
    { part, color: col, rim: 0.6, rimColor: '#ffffff', pop: false, center: [x, 0, 0] });
  fig8(DX, '#e2403e', 'cChrom');
  const recCh = fig8(RX, '#3d7bf0', 'cRecip');
  /* أهلاب الاقتران على سطح الخلية المعطية */
  B.add(merge([0, 1, 2, 3, 4, 5].map(i => { const a = i * 1.05, d = [Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]; return tube({ pts: [[DX, 0.95, 0], add([DX, 0.95, 0], mul(norm(d), 0.35))], r: 0.02, sides: 5 }); })),
    { part: 'cPilus', color: '#3a3a3a', rim: 0.4, rimColor: '#aaa' });
  const bridge = w => place(capsule({ r: 0.16, len: Math.max(0.02, w), rows: 3, cols: 14 }), { rot: [0, 0, Math.PI / 2], at: [0, -0.1, 0] });
  const brO = B.add(bridge(1.0), { part: 'cBridge', color: '#ffe680', alpha: 0.55, rim: 1.2, rimColor: '#9fe06a', pop: false, center: [0, 0, 0] });
  const plas = (y, r) => ring(ellipsePts([DX, y, 0.05], r, r * 0.8, 10), 0.04);
  const plO = B.add(plas(-0.62, 0.16), { part: 'cFert', color: '#d43fd0', rim: 0.8, rimColor: '#ffc8ff', pop: false, center: [DX, -0.6, 0] });
  const seg = B.add(place(ellipsoid({ r: 0.08, rows: 6, cols: 8 }), { at: [0, 0, 0] }), { part: 'cChrom', color: '#d43fd0', rim: 0.8, rimColor: '#ffc8ff', pop: false, center: [0, 0, 0] });
  const rSeg = B.add(tube({ pts: spline([[RX - 0.2, -0.3, 0.12], [RX, -0.36, 0.14], [RX + 0.2, -0.3, 0.12]], 4, false), r: 0.05, sides: 6 }), { part: 'cRecip', color: '#d43fd0', rim: 0.8, rimColor: '#ffc8ff', pop: false });
  B.label('cDonor', [DX - 0.55, -0.4, 0], [-1, -0.2, 0]);
  B.label('cRecip', [RX + 0.55, -0.4, 0], [1, -0.2, 0]);
  B.label('cBridge', [0, -0.25, 0.12], [0, -1, 0.4]);
  B.label('cPilus', [DX, 1.2, 0], [0, 1, 0]);
  B.label('cFert', [DX + 0.16, -0.62, 0.1], [0.3, -1, 0.6]);
  B.label('cChrom', [DX - 0.26, 0.35, 0], [-1, 0.4, 0.3]);
  return { dist: 6.0, yaw: 0.15, pitch: 0.3, target: [0, 0.1, 0], live2d: true,
    anim(){
      const s = STG.idx, k = STG.k, gap = s === 0 ? 0.5 * (1 - k) : 0;
      B.update(recO, place(capsule({ r: 0.55, len: 1.0, rows: 8, cols: 24 }), { at: [RX + gap, 0, 0] }));
      B.update(recCh, merge([ring(ellipsePts([RX + gap, 0.35, 0], 0.26, 0.18, 10), 0.035), ring(ellipsePts([RX + gap, -0.15, 0], 0.26, 0.18, 10), 0.035)]));
      brO.hide = s === 0; B.update(brO, bridge(s === 1 ? 1.0 * k : 1.0));
      const p = s < 2 ? 0 : s === 2 ? k : 1; B.update(plO, plas(-0.62 + p * 0.45, 0.16 - p * 0.06)); plO.hide = s >= 3;
      seg.hide = s !== 3; if (s === 3) B.update(seg, place(ellipsoid({ r: 0.08, rows: 6, cols: 8 }), { at: [DX + (RX - DX) * k, -0.1, 0] }));
      rSeg.hide = s < 4;
    } };
}

/* ═════════════ انتقال عامل الخصوبة (البلازميد) — شكل (3-5) ص21 — يتبع المرحلة ═════════════
   0 قبل الاقتران · 1 جسر الاقتران وانفتاح البلازميد · 2 بدء انتقال شريط · 3 استمرار الانتقال · 4 كلتا الخليتين فيهما عامل الخصوبة */
function plasModel(B){
  const DX = -1.05, RX = 1.05, PY = -0.55;
  B.add(place(capsule({ r: 0.55, len: 1.0, rows: 8, cols: 24 }), { at: [DX, 0, 0] }), { part: 'pDonor', color: '#7a6ad8', alpha: 0.4, rim: 1.4, rimColor: '#c8c0ff', shell: { size: 1.8 } });
  const recO = B.add(place(capsule({ r: 0.55, len: 1.0, rows: 8, cols: 24 }), { at: [RX, 0, 0] }), { part: 'pRecip', color: '#9a8ae8', alpha: 0.4, rim: 1.4, rimColor: '#d8d0ff', pop: false, center: [RX, 0, 0] });
  /* كروموسوم البكتيريا في كل خلية */
  const chrom = x => ring(ellipsePts([x, 0.3, 0], 0.28, 0.2, 10, 0.2, 7), 0.035);
  B.add(chrom(DX), { part: 'pChrom', color: '#d8c8ff', rim: 0.6, rimColor: '#ffffff' });
  const chR = B.add(chrom(RX), { part: 'pChrom', color: '#d8c8ff', rim: 0.6, rimColor: '#ffffff', pop: false, center: [RX, 0, 0] });
  /* أهلاب الاقتران على الخلية المعطية */
  B.add(merge([0, 1, 2, 3, 4].map(i => { const a = i * 1.25, d = [Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35]; return tube({ pts: [[DX, 0.95, 0], add([DX, 0.95, 0], mul(norm(d), 0.35))], r: 0.02, sides: 5 }); })), { part: 'pDonor', color: '#3a3a5a', rim: 0.4, rimColor: '#aaa' });
  /* جسر الاقتران */
  const bridge = w => place(capsule({ r: 0.14, len: Math.max(0.02, w), rows: 3, cols: 14 }), { rot: [0, 0, Math.PI / 2], at: [0, PY, 0] });
  const brO = B.add(bridge(1), { part: 'pBridge', color: '#b8a8f0', alpha: 0.6, rim: 1.2, rimColor: '#e8e0ff', pop: false, center: [0, PY, 0] });
  /* عامل الخصوبة: حلقة في المعطية؛ تنفتح ويعبر شريط منها في الجسر ثم تكتمل حلقة في كل خلية */
  const fRing = (x, r) => ring(ellipsePts([x, PY, 0.05], r, r * 0.8, 10), 0.04);
  const fD = B.add(fRing(DX + 0.3, 0.17), { part: 'pFert', color: '#ff7a3a', rim: 0.8, rimColor: '#ffd0b0', pop: false, center: [DX, PY, 0] });
  const strand = u => tube({ pts: Array.from({ length: 12 }, (_, i) => { const v = i / 11; return [DX + 0.47 + v * (RX - DX - 0.4) * u, PY + Math.sin(v * 9) * 0.03, 0.05]; }), r: 0.03, sides: 5 });
  const stO = B.add(strand(0.1), { part: 'pFert', color: '#ff9a5a', rim: 0.8, rimColor: '#ffd0b0', pop: false, center: [0, PY, 0] });
  const fR = B.add(fRing(RX - 0.3, 0.17), { part: 'pFert', color: '#ff7a3a', rim: 0.8, rimColor: '#ffd0b0', pop: false, center: [RX, PY, 0] });
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('pDonor', [DX - 0.55, -0.2, 0], [-1, -0.2, 0]);
  B.label('pRecip', [RX + 0.55, -0.2, 0], [1, -0.2, 0]);
  B.label('pChrom', [DX - 0.28, 0.3, 0], [-1, 0.5, 0.3]);
  B.label('pBridge', [0, PY - 0.14, 0.1], [0, -1, 0.4], vis(1, 2, 3, 4));
  B.label('pFert', [DX + 0.3, PY - 0.17, 0.1], [-0.3, -1, 0.5]);
  B.caption([0, -1.7, 0], () => [(PLAS_STAGES[STG.idx] || {}).n || '']);
  return { dist: 6.2, yaw: 0.15, pitch: 0.3, target: [0, -0.1, 0], live2d: true,
    anim(){ const s = STG.idx, k = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, STG.k))), gap = s === 0 ? 0.4 * (1 - k) : 0;
      B.update(recO, place(capsule({ r: 0.55, len: 1.0, rows: 8, cols: 24 }), { at: [RX + gap, 0, 0] })); B.update(chR, chrom(RX + gap));
      brO.hide = s === 0; if (s === 1) B.update(brO, bridge(0.2 + 0.8 * k)); else if (s > 1) B.update(brO, bridge(1));
      B.update(fD, fRing(DX + 0.3, s === 1 ? 0.17 + 0.03 * k : 0.17));
      stO.hide = !(s === 2 || s === 3); if (s === 2) B.update(stO, strand(0.15 + 0.35 * k)); if (s === 3) B.update(stO, strand(0.5 + 0.5 * k));
      fR.hide = s !== 4; if (s === 4) B.update(fR, fRing(RX - 0.3, 0.08 + 0.09 * k));
    } };
}

Object.assign(G3.models, { vir_cycle: phageModel, prk_bfiss: fissModel, prk_bconj: conjModel, prk_bplas: plasModel });
})();
