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

/* ═════════════ راشح البلعم البكتيري ملتصق بخلية بكتيرية (ص17) ═════════════ */
function phage(B, at, s, part, o){
  o = o || {};
  const P = p => add(mul(p, s), at);
  /* الرأس: غطاء بروتيني سداسي (مجسم بستة أضلاع) وداخله الحامض النووي */
  B.add(place(ellipsoid({ r: [0.34, 0.42, 0.34], rows: 6, cols: 6 }), { s, at: P([0, 1.0, 0]) }), { part: o.coat || part, color: '#7fd07a', alpha: 0.45, rim: 1.2, rimColor: '#eaffd8', shell: { size: 0.5 * s } });
  B.add(tube({ pts: spline([[-0.12, 0.85, 0], [0.1, 0.95, 0.06], [-0.08, 1.08, -0.05], [0.1, 1.2, 0.04]].map(P), 6, false), r: 0.035 * s, sides: 6 }), { part: o.na || part, color: '#ff6fb0', rim: 0.6, rimColor: '#ffd2e8' });
  /* الذنب والألياف */
  B.add(merge([place(capsule({ r: 0.07, len: 0.6, rows: 3, cols: 10 }), { s, at: P([0, 0.32, 0]) }),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i * 1.047; return tube({ pts: [P([0, 0.02, 0]), P([Math.cos(a) * 0.28, -0.12, Math.sin(a) * 0.28]), P([Math.cos(a) * 0.4, -0.28, Math.sin(a) * 0.4])], r: 0.02 * s, sides: 5 }); })]),
    { part: part, color: '#4fb05a', rim: 0.6, rimColor: '#d8ffd0' });
}
function phageModel(B){
  /* الخلية البكتيرية وجدارها وحلقة DNA */
  B.add(rod(0.62, 2.4), { part: 'vWall', color: '#c98a4a', alpha: 0.3, rim: 1.3, rimColor: '#ffe2b8', shell: { size: 3.2, inner: 'vBac', tau: 0.3 } });
  B.add(ring(ellipsePts([0, 0, 0], 0.9, 0.38, 12, 0.18, 4), 0.045), { part: 'vBDNA', color: '#d23a3a', rim: 0.6, rimColor: '#ffc0c0' });
  /* فيروس ملتصق على الجدار، وآخران يقتربان */
  phage(B, [0.55, 0.6, 0], 1.0, 'vAttach', { coat: 'vCoat', na: 'vNA' });
  phage(B, [-0.6, 1.5, 0.4], 0.75, 'vAttach');
  phage(B, [1.6, 1.3, -0.5], 0.7, 'vAttach');
  /* DNA الفيروس يدخل الخلية عبر الثقب (مرحلة الاختراق) */
  const inj = t => { const k = (t * 0.35) % 1, pts = []; for (let i = 0; i <= 10; i++){ const u = i / 10 * k; pts.push([0.55 - u * 0.5 + Math.sin(u * 14) * 0.05, 0.6 - u * 0.75, Math.cos(u * 11) * 0.06]); }
    return tube({ pts: pts.length > 1 ? pts : [[0.55, 0.6, 0], [0.55, 0.59, 0]], r: 0.03, sides: 5 }); };
  const injO = B.add(inj(0.5), { part: 'vPen', color: '#ff6fb0', rim: 0.7, rimColor: '#ffd2e8', pop: false, center: [0.4, 0.3, 0] });
  B.label('vBac', [-0.9, -0.35, 0.3], [0, -1, 0.4]);
  B.label('vWall', [-1.6, 0.2, 0.3], [-1, 0.3, 0]);
  B.label('vBDNA', [-0.8, 0, -0.2], [-0.5, -1, 0]);
  B.label('vCoat', [0.85, 1.05, 0], [1, 0.3, 0]);
  B.label('vNA', [0.55, 1.6, 0], [0.3, 1, 0]);
  B.caption([0, -1.25, 0], () => ['راشح البلعم البكتيري يهاجم بكتريا القولون', 'ألياف الذنب تلتصق بالجدار ثم يدخل DNA الفيروس']);
  return { dist: 7.6, yaw: 0.4, pitch: 0.22, target: [0.1, 0.6, 0], live2d: true, anim(t){ B.update(injO, inj(t)); } };
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
  const cellA = B.add(H[0], { part: 'fExpand', color: '#ffe680', alpha: 0.42, rim: 1.4, rimColor: '#9fe06a', pop: false, center: [0, 0, 0] });
  const cellB = B.add(H[1], { part: 'fExpand', color: '#ffe680', alpha: 0.42, rim: 1.4, rimColor: '#9fe06a', pop: false, center: [0, 0, 0] });
  const chA = B.add(chrom(S0, -1, 3), { part: 'fChrom', color: '#2a2a2a', rim: 0.5, rimColor: '#888', pop: false, center: [0, 0, 0] });
  const chB = B.add(chrom(S0, 1, 4), { part: 'fDup', color: '#3a3a3a', rim: 0.5, rimColor: '#888', pop: false, center: [0, 0, 0] });
  const att = B.add(place(capsule({ r: 0.03, len: 0.32, rows: 2, cols: 6 }), { at: [0, 0.32, 0] }), { part: 'fAttach', color: '#d24', rim: 0.6, rimColor: '#fbb', pop: false });
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

/* شكل (3-5): المجسّم المسطّح نفسه يكفي — نستعمل مجسم الاقتران */
Object.assign(G3.models, { vir_cycle: phageModel, prk_bfiss: fissModel, prk_bconj: conjModel });
})();
