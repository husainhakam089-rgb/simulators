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
function phageModel(B, map, stages){
  const SI = () => map ? map[Math.min(map.length - 1, STG.idx)] : STG.idx;
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
  const vis = (...ss) => () => ss.includes(SI());
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
  B.caption([0, -2.4, 0], () => [((stages || VIR_STAGES)[STG.idx] || {}).n || '']);
  return { dist: 8.2, yaw: 0.4, pitch: 0.22, target: [0.1, -0.1, 0], live2d: true,
    anim(t){ const s = SI(), k = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, STG.k)));
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

/* ═════════════ دورتا الفايروس مجسّمتين خطوةً خطوة ═════════════
   مثل الرسم المسطّح: كل مراحل الدورة مرقّمة حول حلقة وبينها أسهم تغلق الدورة، والمرحلة
   الحالية تكبر وتتوهج وسهمها الداخل يتلوّن؛ اسم الدورة في وسطها. */
const xf3 = (m, s, at, c) => { const p = new Array(m.p.length); for (let i = 0; i < m.p.length; i += 3){ p[i] = (m.p[i] - c[0]) * s + at[0]; p[i + 1] = (m.p[i + 1] - c[1]) * s + at[1]; p[i + 2] = (m.p[i + 2] - c[2]) * s + at[2]; } return { p, n: m.n, l: m.l, i: m.i }; };
const ellXY = (c, rx, ry, n, wob, seed) => ellipsePts([0, 0, 0], rx, ry, n, wob, seed).map(p => [c[0] + p[0], c[1] + p[2], c[2] + p[1]]);
const VC = { bac: '#f3cfa2', bacS: '#c98a4a', dna: '#d23a3a', ph: '#6cc85a', phL: '#c9f5c4', vd: '#ff6fb0' };
/* كل مرحلة: قائمة أجزاء [شبكة، خيارات] بإحداثيات محلية حول (0,0,0) */
function vMini(kind){
  const L = [], A = (mesh, o) => L.push([mesh, o]);
  const cell = (at, s, part, inner) => { A(rod(0.42 * s, 1.5 * s, at), { part, color: VC.bac, alpha: 0.42, rim: 1.2, rimColor: '#ffe2b8', shell: { size: 1.2 * s, inner, tau: 0.3 } });
    A(ring(ellXY(at, 0.52 * s, 0.2 * s, 12, 0.18, 4), 0.035 * s), { part: inner === 'vBac' ? 'vBDNA' : part, color: VC.dna, rim: 0.6, rimColor: '#ffc0c0' }); };
  const head = (at, s) => place(ellipsoid({ r: [0.17 * s, 0.21 * s, 0.17 * s], rows: 6, cols: 6 }), { at });
  const tail = (at, s) => merge([place(capsule({ r: 0.035 * s, len: 0.3 * s, rows: 3, cols: 8 }), { at: add(at, [0, 0.16 * s, 0]) })].concat([0, 1, 2, 3, 4, 5].map(i => { const a = i * 1.047;
    return tube({ pts: [add(at, [0, 0.01, 0]), add(at, [Math.cos(a) * 0.14 * s, -0.07 * s, Math.sin(a) * 0.14 * s]), add(at, [Math.cos(a) * 0.2 * s, -0.15 * s, Math.sin(a) * 0.2 * s])], r: 0.012 * s, sides: 4 }); })));
  const T = [0.3, 0.58, 0];
  if (kind === 'attach'){ cell([0, 0, 0], 1, 'vWall', 'vBac');
    A(head(add(T, [0, 0.52, 0]), 1), { part: 'vCoat', color: VC.ph, alpha: 0.5, rim: 1.2, rimColor: '#eaffd8', shell: { size: 0.4 } });
    A(tube({ pts: spline([[-0.06, 0.44, 0], [0.05, 0.5, 0.03], [-0.04, 0.57, -0.02], [0.05, 0.62, 0.02]].map(p => add(T, p)), 5, false), r: 0.02, sides: 5 }), { part: 'vNA', color: VC.vd, rim: 0.6, rimColor: '#ffd2e8' });
    A(tail(T, 1), { part: 'vAttach', color: '#4fb05a', rim: 0.6, rimColor: '#d8ffd0' }); }
  if (kind === 'pen'){ cell([0, 0, 0], 1, 'vPen', 'vPen'); A(phageMesh(T, 0.5, [0, 1, 0]), { part: 'vPen', color: VC.ph, rim: 0.8, rimColor: '#e8ffd8' });
    A(tube({ pts: spline([T, [0.15, 0.3, 0.05], [-0.05, 0.12, 0.1], [-0.3, 0.05, 0.06]], 5, false), r: 0.025, sides: 5 }), { part: 'vPen', color: VC.vd, rim: 0.7, rimColor: '#ffd2e8' }); }
  if (kind === 'synth'){ A(rod(0.42, 1.5, [0, 0, 0]), { part: 'vSynth', color: VC.bac, alpha: 0.42, rim: 1.2, rimColor: '#ffe2b8', shell: { size: 1.2 } });
    const R = srng(5); A(merge(Array.from({ length: 5 }, () => { const x = (R() - 0.5) * 1.2, y = (R() - 0.5) * 0.3; return tube({ pts: [[x, y, 0], [x + 0.14, y + 0.03, 0.05]], r: 0.025, sides: 4 }); })), { part: 'vSynth', color: VC.dna, alpha: 0.6, rim: 0.4 });
    A(merge(Array.from({ length: 9 }, (_, i) => { const p = [(R() - 0.5) * 1.3, (R() - 0.5) * 0.4, (R() - 0.5) * 0.3]; return i % 3 ? place(ellipsoid({ r: 0.07, rows: 4, cols: 6 }), { at: p }) : tube({ pts: spline([add(p, [-0.08, 0, 0]), add(p, [0, 0.05, 0.03]), add(p, [0.08, 0, 0])], 3, false), r: 0.018, sides: 4 }); })), { part: 'vSynth', color: VC.ph, rim: 0.7, rimColor: '#f0ffe0' }); }
  if (kind === 'mature'){ A(rod(0.42, 1.5, [0, 0, 0]), { part: 'vMature', color: VC.bac, alpha: 0.42, rim: 1.2, rimColor: '#ffe2b8', shell: { size: 1.2 } });
    A(merge([-0.5, -0.17, 0.17, 0.5].map((x, i) => phageMesh([x, -0.18, 0], 0.32, [i % 2 ? 0.2 : -0.2, 1, 0]))), { part: 'vMature', color: VC.ph, rim: 0.8, rimColor: '#e8ffd8' }); }
  if (kind === 'release'){ A(merge(Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.2832; return place(ellipsoid({ r: [0.2, 0.11, 0.04], rows: 4, cols: 6 }), { at: [Math.cos(a) * 0.7, Math.sin(a) * 0.38, 0], dir: [Math.sin(a), -Math.cos(a), 0.3] }); })),
      { part: 'vRelease', color: VC.bacS, alpha: 0.75, rim: 1.0, rimColor: '#ffe2b8' });
    A(merge(Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.2832 + 0.4, d = [Math.cos(a), Math.sin(a), 0.2]; return phageMesh(mul(d, 0.75), 0.36, d); })), { part: 'vRelease', color: VC.ph, rim: 0.8, rimColor: '#e8ffd8' }); }
  if (kind === 'integ'){ cell([0, 0, 0], 1, 'vInteg', 'vInteg');
    const rp = ellXY([0, 0, 0], 0.52, 0.2, 12, 0.18, 4); A(tube({ pts: spline([rp[0], rp[1], rp[2]], 4, false), r: 0.06, sides: 6 }), { part: 'vDNA', color: VC.vd, rim: 0.8, rimColor: '#ffd2e8' }); }
  if (kind === 'divide'){ [[-0.55, 0.1], [0.55, -0.1]].forEach(([x, y]) => { cell([x, y, 0], 0.62, 'vDaugh', 'vDaugh');
      const rp = ellXY([x, y, 0], 0.52 * 0.62, 0.2 * 0.62, 12, 0.18, 4); A(tube({ pts: spline([rp[0], rp[1], rp[2]], 4, false), r: 0.045, sides: 6 }), { part: 'vProph', color: VC.vd, rim: 0.8, rimColor: '#ffd2e8' }); }); }
  return L;
}
function virRingModel(lyso){ return function(B){
  const N = lyso ? [['attach', 90, 'مرحلة الاتصال'], ['pen', 12, 'مرحلة الاختراق'], ['integ', -62, 'مرحلة التكامل'], ['divide', -150, 'تكاثر البكتيريا']]
    : [['attach', 90, 'مرحلة الاتصال'], ['pen', 20, 'مرحلة الاختراق'], ['synth', -50, 'مرحلة التخليق أو البناء'], ['mature', -120, 'مرحلة الإنضاج'], ['release', 180, 'مرحلة التحرر']];
  const RX = 3.0, RY = 1.85, C = [0.2, 0.05, 0], S0 = 0.62, S1 = 0.82;
  const pos = a => [C[0] + Math.cos(a * Math.PI / 180) * RX, C[1] + Math.sin(a * Math.PI / 180) * RY, 0];
  const minis = N.map(([kind, a, nm], i) => { const at = pos(a), objs = vMini(kind).map(([m, o]) => ({ m, o: B.add(xf3(m, S0, at, [0, 0, 0]), Object.assign({ pop: false, center: at }, o)) })); return { kind, a, nm, at, objs, i }; });
  /* أسهم الدورة على محيط الحلقة */
  const arcPts = (a0, a1) => { const P = []; for (let j = 0; j <= 16; j++){ const a = a0 + (a1 - a0) * j / 16; P.push([C[0] + Math.cos(a * Math.PI / 180) * (RX - 0.05), C[1] + Math.sin(a * Math.PI / 180) * (RY - 0.05), -0.3]); } return P; };
  const arrow = P => { const e = P[P.length - 1], d = norm([e[0] - P[P.length - 3][0], e[1] - P[P.length - 3][1], 0]);
    return merge([tube({ pts: P.slice(0, -1), r: 0.05, sides: 6 }), place(ellipsoid({ r: [0.12, 0.24, 0.12], rows: 5, cols: 8, disp: q => 1 - 0.85 * Math.max(0, q[1]) }), { at: add(e, mul(d, -0.12)), dir: d })]); };
  const gap = 15, arrs = [];
  const links = lyso ? [[0, 1], [1, 2], [2, 3]] : N.map((_, i) => [i, (i + 1) % N.length]);
  links.forEach(([i, j]) => { let a0 = N[i][1], a1 = N[j][1]; if (a1 > a0) a1 -= 360; arrs.push({ to: j, o: B.add(arrow(arcPts(a0 - gap, a1 + gap)), { color: '#e8e0d0', rim: 0.5, pop: false }) }); });
  if (lyso){ const c = add(pos(N[3][1]), [0, -0.95, -0.3]), P = []; for (let j = 0; j <= 18; j++){ const a = -0.3 + j / 18 * 4.6; P.push([c[0] + Math.cos(a) * 0.42, c[1] + Math.sin(a) * 0.22, c[2]]); }
    arrs.push({ to: 3, o: B.add(arrow(P), { color: '#e8e0d0', rim: 0.5, pop: false }) }); }
  /* الأسماء: أجزاء مرحلة الاتصال، واسم كل مرحلة عند بطاقتها */
  const m0 = minis[0].at, lab = (part, local, n) => { const L = { at: add(m0, mul(local, S0)), local, n }; B.label(part, L.at, n); return L; };
  const labs = [lab('vWall', [-0.95, 0, 0], [-1, 0.2, 0.3]), lab('vBDNA', [-0.35, -0.12, 0.1], [-1, -0.5, 0.3]), lab('vCoat', [0.47, 1.1, 0], [1, 0.4, 0.2]), lab('vNA', [0.3, 1.12, 0.05], [0.4, 1, 0.3])];
  if (!lyso) labs.push(lab('vBac', [-0.6, -0.3, 0.2], [-1, -0.6, 0.3]));
  minis.slice(1).forEach(M => { const id = { pen: 'vPen', synth: 'vSynth', mature: 'vMature', release: 'vRelease', integ: 'vInteg', divide: 'vDaugh' }[M.kind]; B.label(id, add(M.at, [0.5 * S0, -0.35 * S0, 0.2]), [Math.cos(M.a * Math.PI / 180), Math.sin(M.a * Math.PI / 180) - 0.4, 0.3]); });
  if (lyso){ B.label('vDNA', add(minis[2].at, [0.25 * S0, 0.12 * S0, 0.1]), [1, -0.3, 0.3]); B.label('vProph', add(minis[3].at, [-0.5 * S0, 0.2 * S0, 0.1]), [-1, 0.3, 0.3]); }
  minis.forEach(M => B.caption(add(M.at, [0, -0.8, 0]), () => [(M.i + 1) + ' · ' + M.nm]));
  B.caption([C[0], C[1] + 0.25, 0], () => [lyso ? 'دورة التحلل والإنتاج' : 'دورة التحلل', 'الآن: ' + ((minis[STG.idx] || {}).nm || '')]);
  let last = -1; const hot = G3.hex('#ffb000'), cold = G3.hex('#e8e0d0');
  return { dist: 11.2, yaw: 0, pitch: 0.04, target: [C[0], C[1] + 0.15, 0], live2d: true,
    anim(t){ const s = Math.min(minis.length - 1, STG.idx);
      if (s !== last){ last = s;
        minis.forEach(M => { const sc = M.i === s ? S1 : S0; M.objs.forEach(R => { B.update(R.o, xf3(R.m, sc, M.at, [0, 0, 0])); R.o.alpha = R.o.shell ? R.o.alpha : (M.i <= s ? 1 : 0.7); }); });
        labs.forEach(L => { const sc = s === 0 ? S1 : S0, v = add(m0, mul(L.local, sc)); L.at[0] = v[0]; L.at[1] = v[1]; L.at[2] = v[2]; });
        arrs.forEach(A => { A.o.col = A.to === s ? hot : cold; }); }
      minis[s].objs.forEach(R => { R.o.glow = 0.45 + 0.4 * Math.sin(t * 4); });
    } };
}; }

/* ═════════════ الخلية المعطية × المستلمة (جدول ص23) — خطوة لكل صف ═════════════
   الخليتان ثابتتان جنباً إلى جنب؛ في كل خطوة يتوهج التركيب الخاص بالصف، وعلامة ✗ حمراء
   مكانه في الخلية المستلمة، ونص الصف تحت كل خلية. */
function donRecModel(B){
  const DX = -1.2, RX = 1.2, cap = x => place(capsule({ r: 0.62, len: 1.2, rows: 10, cols: 26 }), { at: [x, 0, 0] });
  const don = B.add(cap(DX), { part: 'cDonor', color: '#ffe680', alpha: 0.4, rim: 1.4, rimColor: '#9fe06a', shell: { size: 2 } });
  const rec = B.add(cap(RX), { part: 'cRecip', color: '#ffe680', alpha: 0.4, rim: 1.4, rimColor: '#9fe06a', shell: { size: 2 } });
  const fig8 = x => merge([ring(ellXY([x, 0.4, 0], 0.28, 0.2, 10), 0.04), ring(ellXY([x, -0.1, 0], 0.28, 0.2, 10), 0.04)]);
  const dCh = B.add(fig8(DX), { part: 'cChrom', color: '#e2403e', rim: 0.6, rimColor: '#ffffff' });
  const rCh = B.add(fig8(RX), { part: 'cRecip', color: '#3d7bf0', rim: 0.6, rimColor: '#ffffff' });
  const pl = B.add(ring(ellXY([DX, -0.7, 0.05], 0.17, 0.13, 10), 0.045), { part: 'cFert', color: '#d43fd0', rim: 0.8, rimColor: '#ffc8ff' });
  const pil = B.add(merge([-2, -1, 0, 1, 2].map(i => { const a = i * 0.3, d = [Math.sin(a), Math.cos(a), 0.1]; return tube({ pts: [add([DX, 1.15, 0], mul(d, 0.05)), add([DX, 1.15, 0], mul(d, 0.42))], r: 0.025, sides: 5 }); })), { part: 'cPilus', color: '#2a2a2a', rim: 0.5, rimColor: '#aaaaaa' });
  const X = c => merge([-1, 1].map(sg => place(capsule({ r: 0.035, len: 0.32, rows: 2, cols: 6 }), { at: c, rot: [0, 0, sg * Math.PI / 4] })));
  const xPl = B.add(X([RX, -0.7, 0.1]), { color: '#e2403e', rim: 0.6, rimColor: '#ffc0c0' }), xPi = B.add(X([RX, 1.45, 0]), { color: '#e2403e', rim: 0.6, rimColor: '#ffc0c0' });
  B.label('cDonor', [DX - 0.62, -0.3, 0], [-1, -0.2, 0.2]);
  B.label('cRecip', [RX + 0.62, -0.3, 0], [1, -0.2, 0.2]);
  B.label('cChrom', [DX - 0.28, 0.4, 0], [-1, 0.4, 0.3]);
  B.label('cFert', [DX + 0.17, -0.7, 0.05], [0.3, -1, 0.4]);
  B.label('cPilus', [DX, 1.5, 0], [-0.3, 1, 0]);
  const R = TABLES.mDonRec.rows, wrap2 = t => wrapName(t, 42);
  B.caption([DX, -1.6, 0], () => [STG.idx + 1 + ' · الخلية المعطية'].concat(wrap2(R[STG.idx] ? R[STG.idx][0] : '')));
  B.caption([RX, -1.6, 0], () => ['الخلية المستلمة'].concat(wrap2(R[STG.idx] ? R[STG.idx][1] : '')));
  const groups = [[don, rec], [pl, xPl], [pil, xPi], [dCh, rCh]];
  return { dist: 8.2, yaw: 0, pitch: 0.08, target: [0, -0.35, 0], live2d: true,
    anim(t){ const s = Math.min(3, STG.idx);
      xPl.hide = s !== 1; xPi.hide = s !== 2;
      groups[s].forEach(o => { o.glow = 0.5 + 0.45 * Math.sin(t * 4); }); } };
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

Object.assign(G3.models, { vir_cycle: phageModel, vir_lyt: virRingModel(false), vir_lys: virRingModel(true), prk_bfiss: fissModel, prk_bconj: conjModel, prk_bdr: donRecModel, prk_bplas: plasModel });
})();
