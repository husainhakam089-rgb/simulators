
/* ══════════════════════════════════════════════════════════════════════════
   9.2 · المجسمات — نفس أجزاء الرسوم المسطّحة وأسمائها (ملزمة ص5، ص8، ص10، ص18، ص20، ص31)
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, sub, mul, norm, cross, dot, rot3, ap3, ellipsoid, superEll, capsule, tube, place, merge, spline, srng, mk } = G3;

/* ── قطع مشتركة ── */
/* خيط مموّج بين نقطتين (شبكة، كروماتين) */
function wavy(a, b, amp, waves, seed, per){
  const r = srng(seed), d = sub(b, a), L = G3.vlen(d), t = norm(d);
  const n1 = norm(cross(t, Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), n2 = cross(t, n1);
  const pts = [], K = Math.max(6, Math.round(waves * 5));
  const ph1 = r() * 6.28, ph2 = r() * 6.28;
  for (let i = 0; i <= K; i++){
    const u = i / K, env = Math.sin(Math.PI * u) * 0.85 + 0.15;
    const w1 = Math.sin(u * waves * Math.PI * 2 + ph1) * amp * env, w2 = Math.cos(u * waves * Math.PI * 1.3 + ph2) * amp * 0.55 * env;
    pts.push(add(add(add(a, mul(d, u)), mul(n1, w1)), mul(n2, w2)));
  }
  return spline(pts, per || 4, false);
}
/* حبيبات صغيرة على سطح أنبوب (رايبوسومات على الشبكة الخشنة) */
function studs(path, rTube, every, seed, rDot){
  const r = srng(seed), out = [];
  for (let i = 1; i < path.length - 1; i += every){
    const t = norm(sub(path[i + 1], path[i - 1]));
    const n1 = norm(cross(t, Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), n2 = cross(t, n1);
    for (let k = 0; k < 2; k++){
      const a = r() * 6.283, d = add(mul(n1, Math.cos(a)), mul(n2, Math.sin(a)));
      out.push(place(ellipsoid({ r: rDot || 0.035, rows: 4, cols: 6 }), { at: add(path[i], mul(d, rTube + (rDot || 0.035) * 0.6)) }));
    }
  }
  return merge(out);
}
/* كومة صهاريج كولجي: أقراص مسطّحة منحنية */
function golgiStack(at, rot, n, w, d, gap){
  const R = rot3(rot[0], rot[1], rot[2]), list = [];
  for (let i = 0; i < n; i++){
    const f = 1 - Math.abs(i - (n - 1) / 2) * 0.12;
    const disc = ellipsoid({ r: [w * f, 0.045, d * f], rows: 8, cols: 26, warp: p => [p[0], p[1] + p[0] * p[0] * 0.55, p[2]] });
    list.push(place(disc, { R, at: add(at, ap3(R, [0, (i - (n - 1) / 2) * gap, 0])) }));
  }
  return merge(list);
}
/* مايتوكوندريا صغيرة داخل الخلية (خطوط الأعراف على السطح) */
const mitoSmall = (at, dir, len, r) => place(capsule({ r: r || 0.21, len: len || 0.55, rows: 6, cols: 18 }), { at, dir });
const MITO = { color: '#e07a3a', rimColor: '#ffc38a', rim: 0.55, pat: 1, patColor: '#9a4418', patK: 62 };
/* جسيمات مركزية: أسطوانتان متعامدتان */
function centrioles(at){
  const c1 = tube({ pts: [add(at, [-0.17, 0, 0]), add(at, [0.17, 0, 0])], r: 0.065, sides: 9 });
  const c2 = tube({ pts: [add(at, [0.02, -0.17, 0.12]), add(at, [0.02, 0.17, 0.12])], r: 0.065, sides: 9 });
  return merge([c1, c2]);
}
/* مجموعة كرات صغيرة في مجسّم واحد بعدد ثابت (المخفية تُصغَّر لصفر بعيداً) — للجزيئات المتحركة في التجارب */
const dotsMesh = (list, rows) => merge(list.map(p => place(ellipsoid({ r: 1, rows: rows || 6, cols: (rows || 6) + 2 }), { at: p ? p : [0, -60, 0], s: p ? p.s : 0.0001 })));
const withS = (p, s) => { const q = p.slice(); q.s = s; return q; };
const cp3 = (d, s) => { d[0] = s[0]; d[1] = s[1]; d[2] = s[2]; };
/* تشويه خفيف لغشاء الخلية الحيوانية حتى لا تكون كرة ملساء */
const blobDisp = (seed, amt) => { const r = srng(seed), a = [r() * 6, r() * 6, r() * 6];
  return d => 1 + amt * (Math.sin(d[0] * 3.1 + a[0]) * Math.sin(d[1] * 2.7 + a[1]) + 0.6 * Math.sin(d[2] * 3.7 + a[2] + d[0] * 2)); };

/* ═════════════ الخلية الحيوانية (ص8) ═════════════ */
function animalModel(B, O){
  O = O || {}; const S = O.s || 1, T = O.at || [0, 0, 0];
  const P = (p) => add(mul(p, S), T);            // موضع ضمن الخلية
  const pl = (m) => place(m, { s: S, at: T });   // مجسم مبني في إحداثيات الخلية
  const RX = 2.75, RY = 2.15, RZ = 1.95;
  const cellDisp = blobDisp(21, 0.045);
  /* الغشاء البلازمي والسايتوبلازم: قشرة شفافة؛ وسطها سايتوبلازم وحافتها غشاء */
  B.add(pl(ellipsoid({ r: [RX, RY, RZ], rows: 30, cols: 48, disp: cellDisp })),
    { part: 'pm', color: '#3f7a66', alpha: 0.2, rim: 1.25, rimColor: '#f3d28a', shell: { size: 2.8 * S, inner: 'cyto', tau: 0.3 }, pat: 3, patK: 5 });
  /* النواة والنوية */
  const NUC = [-0.62, 0.52, -0.05], NR = 0.88;
  B.add(pl(place(ellipsoid({ r: NR, rows: 20, cols: 30 }), { at: NUC })),
    { part: 'nuc', color: '#7f6fe0', alpha: 0.5, rim: 1.1, rimColor: '#dcd2ff', shell: { size: 0.9 * S } });
  const pores = [], pr = srng(5);
  for (let i = 0; i < 22; i++){
    const u = pr() * 2 - 1, a = pr() * 6.283, d = [Math.sqrt(1 - u * u) * Math.cos(a), u, Math.sqrt(1 - u * u) * Math.sin(a)];
    pores.push(place(ellipsoid({ r: [0.07, 0.03, 0.07], rows: 5, cols: 8 }), { at: add(NUC, mul(d, NR)), dir: d }));
  }
  const chrom = [];
  for (let i = 0; i < 5; i++){
    const a = add(NUC, [(pr() - .5) * 1.1, (pr() - .5) * 1.1, (pr() - .5) * 1.1]), b = add(NUC, [(pr() - .5) * 1.1, (pr() - .5) * 1.1, (pr() - .5) * 1.1]);
    chrom.push(tube({ pts: wavy(a, b, 0.14, 2.5, 40 + i), r: 0.025, sides: 5 }));
  }
  B.add(pl(merge(pores.concat(chrom))), { part: 'nuc', color: '#3b2f86', rim: 0.4, rimColor: '#b9a8ff', center: P(NUC) });
  B.add(pl(place(ellipsoid({ r: 0.3, rows: 12, cols: 16, disp: blobDisp(8, 0.06) }), { at: add(NUC, [-0.12, -0.08, 0.18]) })),
    { part: 'nucleolus', color: '#4b3a9e', rim: 0.7, rimColor: '#c8b8ff', pat: 3, patK: 14 });
  /* الشبكة البلازمية الداخلية الخشنة وعليها الرايبوسومات */
  const rerPaths = [
    wavy([0.25, 0.05, 0.55], [1.55, 0.35, 0.2], 0.22, 2.6, 11, 5),
    wavy([0.1, -0.35, 0.3], [1.35, -0.1, -0.2], 0.2, 2.4, 12, 5),
    wavy([-0.1, -0.1, -0.7], [1.2, 0.2, -0.95], 0.2, 2.2, 13, 5)
  ];
  B.add(pl(merge(rerPaths.map(p => tube({ pts: p, r: 0.1, sides: 10 })))), { part: 'rer', color: '#5f86c6', rim: 0.6, rimColor: '#dcecfb' });
  B.add(pl(merge(rerPaths.map((p, i) => studs(p, 0.1, 2, 70 + i, 0.036)))), { part: 'ribo', color: '#22304a', rim: 0.9, rimColor: '#accbe8', pop: false });
  /* الشبكة الملساء */
  const serPaths = [wavy([-1.9, -0.2, 0.4], [-1.1, -1.25, 0.2], 0.2, 2.2, 21, 5), wavy([-1.95, 0.35, -0.5], [-1.2, -0.9, -0.8], 0.18, 2, 22, 5)];
  B.add(pl(merge(serPaths.map(p => tube({ pts: p, r: 0.09, sides: 9 })))), { part: 'ser', color: '#6fae95', rim: 0.6, rimColor: '#d6f0e2' });
  /* جهاز كولجي وحويصلاته */
  const GOL = [1.2, -0.7, 0.35];
  B.add(pl(golgiStack(GOL, [0.25, 0.4, -0.35], 5, 0.62, 0.36, 0.13)), { part: 'golgi', color: '#e58bb6', rim: 0.7, rimColor: '#ffd1e6' });
  const ves = [[1.85, -0.45, 0.55, 0.11], [1.95, -0.85, 0.2, 0.09], [1.6, -1.25, 0.5, 0.1], [0.62, -0.5, 0.75, 0.08], [2.05, -0.2, 0.05, 0.08]];
  B.add(pl(merge(ves.map(v => place(ellipsoid({ r: v[3], rows: 8, cols: 12 }), { at: [v[0], v[1], v[2]] })))),
    { part: 'golgiVes', color: '#f3b3d2', rim: 0.9, rimColor: '#ffe3f0' });
  /* المايتوكوندريا */
  B.add(pl(merge([mitoSmall([-1.25, -1.15, 0.55], [1, 0.3, 0.2]), mitoSmall([1.1, 1.2, -0.35], [0.8, -0.5, 0.3]), mitoSmall([0.15, -1.45, -0.6], [1, 0.1, -0.4])])),
    Object.assign({ part: 'mito' }, MITO));
  /* الجسيمات الحالة */
  B.add(pl(merge([place(ellipsoid({ r: 0.2, rows: 10, cols: 14 }), { at: [1.8, 0.55, 0.3] }), place(ellipsoid({ r: 0.17, rows: 10, cols: 14 }), { at: [-0.3, -1.05, 1.15] })])),
    { part: 'lyso', color: '#9b6fd6', rim: 0.9, rimColor: '#e4d2ff', pat: 2, patColor: '#f3e9ff', patK: 22 });
  /* الجسيمات المركزية والنبيبات الدقيقة */
  const CEN = [0.45, 1.3, 0.35];
  B.add(pl(centrioles(CEN)), { part: 'centro', color: '#b9c6d6', rim: 0.8, rimColor: '#ffffff', pat: 1, patColor: '#6f7d8e', patK: 60 });
  const tubes = [], tr = srng(33); let tubeAt = null, tubeBest = -1e9;
  for (let i = 0; i < 12; i++){
    const u = tr() * 2 - 1, a = tr() * 6.283, d = [Math.sqrt(1 - u * u) * Math.cos(a), u * 0.8, Math.sqrt(1 - u * u) * Math.sin(a)];
    const end = [d[0] * RX * 0.92, d[1] * RY * 0.92, d[2] * RZ * 0.92];
    const mid = add(mul(add(CEN, end), 0.5), [(tr() - .5) * 0.5, (tr() - .5) * 0.5, (tr() - .5) * 0.5]);
    const path = spline([CEN, mid, end], 5, false);
    tubes.push(tube({ pts: path, r: 0.0085, sides: 5 }));
    /* نقطة التأشير: منتصف أقرب نبيب للأمام */
    const p = path[Math.floor(path.length * 0.62)];
    if (p[2] + p[1] * 0.3 > tubeBest){ tubeBest = p[2] + p[1] * 0.3; tubeAt = p; }
  }
  B.add(pl(merge(tubes)), { part: 'microtub', color: '#aebdcc', rim: 0.35, rimColor: '#ffffff', pop: false });

  if (!O.noLabels){
    B.label('pm', P([RX * 0.62, RY * 0.72, RZ * 0.3]), [0.6, 0.7, 0.3]);
    B.label('cyto', P([0.55, 0.35, 1.72]), [0.1, 0.1, 1]);
    B.label('nuc', P(add(NUC, [0.2, 0.62, 0.55])), [0.2, 0.7, 0.6]);
    B.label('nucleolus', P(add(NUC, [-0.12, -0.08, 0.18])), [0, 0, 1]);
    B.label('rer', P(rerPaths[0][14]), [0, 0.3, 1]);
    B.label('ribo', P(rerPaths[1][10]), [0, 0, 1]);
    B.label('ser', P(serPaths[0][10]), [-0.5, 0, 1]);
    B.label('golgi', P(GOL), [0.4, 0, 1]);
    B.label('golgiVes', P([1.85, -0.45, 0.55]), [0.6, 0, 1]);
    B.label('mito', P([1.1, 1.2, -0.35]), [0.5, 0.6, 0]);
    B.label('lyso', P([1.8, 0.55, 0.3]), [1, 0.2, 0.3]);
    B.label('centro', P(CEN), [0, 1, 0.4]);
    B.label('microtub', P(tubeAt), [0, 0.5, 0.8]);
  }
  if (O.noLabels) return { dist: 8.3, yaw: 0.35, pitch: 0.28 };

  /* ── تجربة «مسار البروتين» (ص12، ص15): حبة بروتين تمشي من النواة إلى الرايبوسوم
     فالشبكة الخشنة فكولجي فالحويصلة فخارج الخلية، والجزء الذي تمر به يضيء ── */
  const routeKeys = [NUC, add(NUC, mul(norm(sub(rerPaths[0][0], NUC)), NR)), rerPaths[0][0]]
    .concat(rerPaths[0].filter((q, i) => i % 4 === 0 && i > 0), [rerPaths[0][rerPaths[0].length - 1], add(GOL, [0.2, 0.25, 0.1]), GOL, [1.85, -0.45, 0.55], [RX * 0.93, -0.5, 0.75], [RX * 1.25, -0.6, 0.95]]);
  const routePts = spline(routeKeys, 4, false);
  const nR = routePts.length, iRer = 2 * 4, iGol = (routeKeys.length - 5) * 4, iVes = (routeKeys.length - 3) * 4, iOut = (routeKeys.length - 2) * 4;
  const bead = B.add(ellipsoid({ r: 0.1, rows: 10, cols: 14 }), { part: null, color: '#ffcf4a', rim: 2.2, rimColor: '#ffffff', pop: false, center: [0, 0, 0], fixed: false });
  bead.hide = true;
  const STEPS = [
    [0, 'nuc', 'النواة'], [iRer - 3, 'ribo', 'الرايبوسومات تبني البروتين'], [iRer + 2, 'rer', 'الشبكة الخشنة تنقله داخل الخلية'],
    [iGol - 2, 'golgi', 'إلى جهاز كولجي'], [iVes - 1, 'golgiVes', 'كولجي يفرزه في حويصلات'], [iOut - 2, 'pm', 'إلى خارج الخلية']];
  let rT0 = -1, rStep = null;
  const beadAt = [0, 0, 0];
  B.caption('bottom', () => rStep ? ['مسار البروتين', rStep[2]] : (api.tool('membTest') ? ['النفوذية الاختيارية', 'الجزيئات الصغيرة تعبر الغشاء والكبيرة ترتد'] : []));

  /* ── تجربة «النفوذية الاختيارية» (ص38): الصغيرة تعبر والكبيرة ترتد ── */
  B.reg('permeability');
  const NM = 9, mols = [];
  const molS = B.add(dotsMesh(new Array(NM).fill(null)), { part: 'permeability', color: '#9fe9d0', rim: 1.0, rimColor: '#e6fff6', pop: false, center: [0, 0, 0] });
  const molB = B.add(dotsMesh(new Array(NM).fill(null)), { part: 'permeability', color: '#d4483c', alpha: 0.75, rim: 1.0, rimColor: '#f0a49a', pop: false, center: [0, 0, 0] });
  const onSurf = (d, f) => [d[0] * RX * f, d[1] * RY * f, d[2] * RZ * f];
  let lastT = 0;
  return {
    dist: 8.3, yaw: 0.35, pitch: 0.28,
    tools: ['protRoute', 'membTest'],
    anim(t){
      const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      /* مسار البروتين: يبدأ مع زر المشهد ويتوقف بانتهاء مؤقته (14 ثانية) */
      if (routeTimer){
        if (rT0 < 0) rT0 = t;
        const u = Math.min(1, (t - rT0) / 12), f = u * (nR - 1), i = Math.min(nR - 2, Math.floor(f)), w = f - i;
        const q = add(routePts[i], mul(sub(routePts[i + 1], routePts[i]), w));
        cp3(beadAt, q);
        B.update(bead, place(ellipsoid({ r: 1, rows: 10, cols: 14 }), { at: q, s: 0.15 * (1 + 0.2 * Math.sin(t * 9)) }));
        bead.hide = u >= 1 && (t - rT0) > 13;
        rStep = STEPS.filter(st => f >= st[0]).pop();
        B.objs().forEach(o => { if (['nuc', 'ribo', 'rer', 'golgi', 'golgiVes', 'pm'].indexOf(o.part) >= 0) o.hovT = o.part === rStep[1] ? 1 : 0.3; });
      } else if (rT0 >= 0){
        rT0 = -1; rStep = null; bead.hide = true;
        B.objs().forEach(o => { o.hovT = 0; });
      }
      /* النفوذية الاختيارية */
      const on = api.tool('membTest');
      if (on && mols.length < NM && Math.random() < dt * 2.6){
        let d; do { d = norm([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 1.6 - 0.3]); } while (d[2] < 0.05);
        mols.push({ big: Math.random() < 0.42, d, f: 1.42, dir: -1 });
      }
      if (!on) mols.length = 0;
      for (let i = mols.length - 1; i >= 0; i--){
        const m = mols[i];
        m.f += m.dir * dt * 0.22;
        if (m.dir < 0 && m.f <= 1.0 && m.big) m.dir = 1;
        if ((!m.big && m.f < 0.42) || (m.big && m.f > 1.6)) mols.splice(i, 1);
      }
      const slotS = new Array(NM).fill(null), slotB = new Array(NM).fill(null);
      mols.forEach((m, i) => {
        const fade = m.big ? 1 : Math.min(1, (m.f - 0.42) / 0.2);
        if (m.big) slotB[i] = withS(onSurf(m.d, m.f), 0.16); else slotS[i] = withS(onSurf(m.d, m.f), 0.065 * fade);
      });
      B.update(molS, dotsMesh(slotS)); B.update(molB, dotsMesh(slotB));
    }
  };
}

/* ═════════════ الخلية النباتية (ص8) ═════════════ */
function plantModel(B, O){
  O = O || {}; const S = O.s || 1, T = O.at || [0, 0, 0];
  const P = (p) => add(mul(p, S), T), pl = (m) => place(m, { s: S, at: T });
  const HX = 2.85, HY = 2.05, HZ = 1.55;
  /* الجدار الخلوي والغشاء البلازمي */
  B.add(pl(superEll({ h: [HX, HY, HZ], e: 0.28 })), { part: 'wall', color: '#b9cf5c', alpha: 0.26, rim: 1.1, rimColor: '#f1e7a0', shell: { size: 3.0 * S } });
  B.add(pl(superEll({ h: [HX - 0.17, HY - 0.17, HZ - 0.14], e: 0.28 })),
    { part: 'pm', color: '#4f8f64', alpha: 0.16, rim: 1.2, rimColor: '#ffe6b4', shell: { size: 2.8 * S, inner: 'cyto', tau: 0.3 }, pat: 3, patK: 5 });
  /* الفجوة المركزية الكبيرة */
  B.add(pl(place(superEll({ h: [1.55, 1.12, 0.95], e: 0.62, rows: 20, cols: 32 }), { at: [0.35, -0.05, 0] })),
    { part: 'vacuole', color: '#7fb8d8', alpha: 0.3, rim: 1.1, rimColor: '#d6f0fb', shell: { size: 1.6 * S } });
  /* النواة والنوية */
  const NUC = [-2.0, 0.95, 0.15];
  B.add(pl(place(ellipsoid({ r: 0.58, rows: 16, cols: 24 }), { at: NUC })), { part: 'nuc', color: '#7f6fe0', alpha: 0.5, rim: 1.1, rimColor: '#dcd2ff', shell: { size: 0.6 * S } });
  B.add(pl(place(ellipsoid({ r: 0.2, rows: 10, cols: 14 }), { at: add(NUC, [-0.05, -0.05, 0.12]) })), { part: 'nucleolus', color: '#4b3a9e', rim: 0.7, rimColor: '#c8b8ff', pat: 3, patK: 14 });
  /* البلاستيدات الخضراء */
  const CH = [[-1.2, 1.55, 0.6, 0.3], [1.65, 1.5, -0.5, -0.4], [2.3, -0.9, 0.55, 1.2], [-0.8, -1.6, -0.7, 0.2], [0.6, 1.6, 0.85, 0.6]];
  const chloroObj = B.add(pl(merge(CH.map(c => place(ellipsoid({ r: [0.44, 0.2, 0.27], rows: 12, cols: 20 }), { at: [c[0], c[1], c[2]], rot: [0.3, c[3], 0.15] })))),
    { part: 'chloro', color: '#4f9a45', rim: 0.7, rimColor: '#d6f2b0', pat: 2, patColor: '#1d5a22', patK: 11 });
  /* حبيبات النشأ */
  B.add(pl(merge([[-0.5, -1.72, 0.5], [2.35, 0.25, -0.6], [-2.25, -0.55, -0.6]].map(a => place(ellipsoid({ r: [0.14, 0.1, 0.11], rows: 8, cols: 12 }), { at: a })))),
    { part: 'starch', color: '#f0e8d0', rim: 0.8, rimColor: '#ffffff' });
  /* المايتوكوندريا */
  B.add(pl(merge([mitoSmall([-2.25, -1.2, 0.45], [1, 0.4, 0], 0.42, 0.17), mitoSmall([2.35, 1.05, 0.35], [0.4, 1, 0.2], 0.42, 0.17)])), Object.assign({ part: 'mito' }, MITO));
  /* الشبكة الخشنة والملساء */
  const rer = wavy([-1.65, 0.05, 0.75], [-0.9, -0.95, 0.9], 0.16, 2.2, 31, 5);
  B.add(pl(tube({ pts: rer, r: 0.085, sides: 9 })), { part: 'rer', color: '#5f86c6', rim: 0.6, rimColor: '#dcecfb' });
  B.add(pl(studs(rer, 0.085, 2, 91, 0.032)), { part: 'rer', color: '#22304a', rim: 0.9, rimColor: '#accbe8', pop: false });
  const ser = wavy([1.95, 1.25, 0.85], [2.35, 0.1, 0.95], 0.14, 2, 32, 5);
  B.add(pl(tube({ pts: ser, r: 0.08, sides: 9 })), { part: 'ser', color: '#6fae95', rim: 0.6, rimColor: '#d6f0e2' });
  /* جهاز كولجي وحويصلاته */
  const GOL = [-1.25, -0.95, -0.75];
  B.add(pl(golgiStack(GOL, [0.3, -0.5, 0.2], 4, 0.42, 0.26, 0.11)), { part: 'golgi', color: '#e58bb6', rim: 0.7, rimColor: '#ffd1e6' });
  B.add(pl(merge([[-0.7, -1.2, -0.55], [-0.85, -0.6, -0.9], [-1.7, -1.4, -0.5]].map(a => place(ellipsoid({ r: 0.08, rows: 8, cols: 12 }), { at: a })))),
    { part: 'golgiVes', color: '#f3b3d2', rim: 0.9, rimColor: '#ffe3f0' });
  /* رايبوسومات حرة في السايتوبلازم (كما في رسم الخلية النباتية) */
  const rb = [], rbAt = [], r = srng(55);
  [[-1.85, 1.75, -0.4], [-2.35, 0.15, 0.6]].forEach(c => { for (let i = 0; i < 9; i++){
    const at = add(c, [(r() - .5) * 0.5, (r() - .5) * 0.35, (r() - .5) * 0.4]);
    rb.push(place(ellipsoid({ r: 0.035, rows: 4, cols: 6 }), { at })); rbAt.push(at); } });
  B.add(pl(merge(rb)), { part: 'ribo', color: '#22304a', rim: 0.9, rimColor: '#accbe8', pop: false });

  if (!O.noLabels){
    B.label('wall', P([HX * 0.95, HY * 0.55, HZ * 0.2]), [1, 0.3, 0.2]);
    B.label('pm', P([HX * 0.6, HY * 0.9, HZ * 0.55]), [0.3, 1, 0.4]);
    B.label('cyto', P([-0.9, 0.35, 1.25]), [0, 0, 1]);
    B.label('vacuole', P([0.35, -0.05, 0.95]), [0, 0, 1]);
    B.label('nuc', P(add(NUC, [0.1, 0.4, 0.4])), [0.2, 0.7, 0.6]);
    B.label('nucleolus', P(add(NUC, [-0.05, -0.05, 0.12])), [0, 0, 1]);
    B.label('chloro', P([0.6, 1.6, 0.85]), [0.2, 0.6, 0.7]);
    B.label('starch', P([-0.5, -1.72, 0.5]), [0, -0.6, 0.7]);
    B.label('mito', P([-2.25, -1.2, 0.45]), [-0.6, -0.3, 0.6]);
    B.label('rer', P(rer[12]), [0, 0, 1]);
    B.label('ser', P(ser[8]), [0.5, 0, 1]);
    B.label('golgi', P(GOL), [0, -0.3, -1]);
    B.label('golgiVes', P([-0.7, -1.2, -0.55]), [0, -0.5, -0.8]);
    B.label('ribo', P(rbAt.slice(9).sort((a, b) => b[2] - a[2])[0]), [-0.3, 0.2, 1]);
  }
  if (O.noLabels) return { dist: 7.6, yaw: 0.45, pitch: 0.3 };
  /* ── «أدخل الضوء»: حزم ضوء تسقط على الخلية والبلاستيدات الخضراء تتوهج ── */
  const LD = norm([0.75, -1, -0.35]), rays = [];
  for (let i = 0; i < 7; i++){
    const end = [-2.4 + i * 0.85, HY * 0.55 + (i % 2) * 0.25, 0.3 + (i % 3 - 1) * 0.45];
    rays.push(tube({ pts: [sub(end, mul(LD, 3.4)), end], r: (i % 2 ? 0.09 : 0.13), sides: 12 }));
  }
  const rayObj = B.add(merge(rays), { part: null, color: '#ffe680', alpha: 0.4, rim: 1.6, rimColor: '#fffbe6', pop: false });
  const chlCol = G3.hex('#4f9a45');
  return {
    dist: 7.6, yaw: 0.45, pitch: 0.3,
    tools: ['light'],
    anim(t){
      const lit = api.tool('light');
      rayObj.hide = !lit;
      rayObj.alpha = 0.3 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3));
      const g = lit ? 0.5 + 0.5 * Math.sin(t * 1.8) : 0;
      chloroObj.rim = 0.7 + g * 1.1;
      chloroObj.col = chlCol.map(v => Math.min(1, v * (1 + g * 0.35)));
    }
  };
}

/* ═════════════ الخلية بدائية النواة (ص5) — مع سوط يدور ═════════════ */
function proModel(B){
  const L = 2.5, R = 0.95;
  const along = m => place(m, { R: rot3(0, 0, -Math.PI / 2) });   // الكبسولة أفقية على x
  B.add(along(capsule({ r: R + 0.17, len: L, rows: 10, cols: 30 })), { part: 'capsule', color: '#e2cd96', alpha: 0.14, rim: 1.0, rimColor: '#f3e6b8', shell: { size: 2.4 } });
  B.add(along(capsule({ r: R + 0.06, len: L, rows: 10, cols: 30 })), { part: 'bwall', color: '#cdb46a', alpha: 0.26, rim: 1.1, rimColor: '#f0e0ac', shell: { size: 2.3 } });
  B.add(along(capsule({ r: R - 0.03, len: L, rows: 10, cols: 30 })),
    { part: 'bpm', color: '#5f8f68', alpha: 0.2, rim: 1.2, rimColor: '#ffe6b4', shell: { size: 2.2, inner: 'cyto', tau: 0.3 }, pat: 3, patK: 5 });
  /* المنطقة النووية: خيط DNA ملتف */
  const r = srng(91), ring = [];
  for (let i = 0; i < 14; i++){ const a = i / 14 * 6.283; ring.push([Math.cos(a) * (0.55 + r() * 0.35) - 0.2, Math.sin(a * 2) * 0.35 + (r() - .5) * 0.3, Math.sin(a) * (0.35 + r() * 0.2)]); }
  B.add(tube({ pts: spline(ring, 6, true), r: 0.04, sides: 7, closed: true }), { part: 'nucleoid', color: '#b89cff', rim: 0.8, rimColor: '#efe4ff', center: [-0.2, 0, 0] });
  /* رايبوسومات */
  const rb = [], rbAt = [];
  for (let i = 0; i < 70; i++){
    const x = (r() - .5) * (L + 1.1), a = r() * 6.283, rr = Math.sqrt(r()) * (R - 0.2);
    if (Math.abs(x + 0.2) < 0.8 && rr < 0.45) continue;
    const at = [x, Math.cos(a) * rr, Math.sin(a) * rr];
    rb.push(place(ellipsoid({ r: 0.045, rows: 4, cols: 6 }), { at })); rbAt.push(at);
  }
  B.add(merge(rb), { part: 'ribo', color: '#22304a', rim: 0.9, rimColor: '#accbe8', pop: false });
  /* نقطة على سطح الكبسولة واتجاهها */
  const surf = (x, a, off) => { const cx = Math.max(-L / 2, Math.min(L / 2, x)), d = x === cx ? [0, Math.cos(a), Math.sin(a)] : norm([x - cx, Math.cos(a) * 0.7, Math.sin(a) * 0.7]);
    return [add([cx, 0, 0], mul(d, R + 0.17 + (off || 0))), d]; };
  /* الأهداب/الشعيرات القصيرة */
  const hairs = [];
  for (let i = 0; i < 170; i++){
    const [p, d] = surf((r() - .5) * (L + 1.6), r() * 6.283);
    hairs.push(tube({ pts: [p, add(p, mul(d, 0.2 + r() * 0.1))], r: 0.012, sides: 4, caps: false }));
  }
  /* شعرة ظاهرة أسفل الأمام (بعيدة عن الأهلاب) ليؤشّر عليها الاسم */
  const [hp, hd] = surf(0.3, -Math.PI / 2 + 0.2);
  const hairTip = add(hp, mul(hd, 0.27));
  hairs.push(tube({ pts: [hp, hairTip], r: 0.016, sides: 5, caps: false }));
  B.add(merge(hairs), { part: 'cilia', color: '#e6d6a4', rim: 0.5, rimColor: '#ffffff', pop: false });
  /* الأهلاب الجنسية */
  const pili = [[0.4, 1.2], [-1.0, 2.1], [1.3, -0.8]].map(([x, a]) => { const [p, d] = surf(x, a); const e = add(p, mul(d, 0.95));
    return merge([tube({ pts: [p, e], r: 0.028, sides: 6 }), place(ellipsoid({ r: 0.06, rows: 6, cols: 8 }), { at: e })]); });
  B.add(merge(pili), { part: 'pilus', color: '#f0dcae', rim: 0.6, rimColor: '#ffffff' });
  /* السوط: لولب يدور من أحد القطبين */
  const base = [L / 2 + R + 0.12, 0, 0];
  const flagLbl = [0, 0, 0];   // نقطة تأشير الاسم تتبع السوط وهو يدور
  const flag = ph => { const pts = [];
    for (let i = 0; i <= 60; i++){ const t = i / 60, amp = 0.05 + 0.24 * t;
      pts.push([base[0] + t * 2.6, Math.cos(t * 13 - ph) * amp, Math.sin(t * 13 - ph) * amp]); }
    flagLbl[0] = pts[37][0]; flagLbl[1] = pts[37][1]; flagLbl[2] = pts[37][2];
    return tube({ pts, r: 0.035, sides: 6 }); };
  const fl = B.add(flag(0), { part: 'flagel', color: '#d8c68e', rim: 0.7, rimColor: '#fff3cf', center: [base[0] + 1.3, 0, 0], pop: false });

  B.label('cyto', [0.9, -0.35, 0.55], [0, 0, 1]);
  B.label('nucleoid', ring[3], [0, 0.5, 1]);
  B.label('bpm', [0.2, R - 0.03, 0.2], [0, 1, 0.2]);
  B.label('bwall', [-0.6, 0.2, R + 0.06], [0, 0.2, 1]);
  B.label('capsule', [0.9, -(R + 0.17), 0.2], [0, -1, 0.2]);
  B.label('pilus', add(surf(0.4, 1.2)[0], mul(surf(0.4, 1.2)[1], 0.95)), surf(0.4, 1.2)[1]);
  B.label('cilia', add(hp, mul(hd, 0.2)), hd);
  B.label('flagel', flagLbl, [0, 0.2, 1]);
  /* رايبوسوم قريب من الأمام ليؤشّر عليه الاسم */
  const front = rbAt.slice().sort((a, b) => (b[2] - Math.abs(b[0] - 1.2) * 0.3) - (a[2] - Math.abs(a[0] - 1.2) * 0.3))[0];
  B.label('ribo', front, [0, 0, 1]);
  /* ── «تجربة الحركة»: السوط يدفع الخلية (جري) ثم تغيّر اتجاهها (تقلّب) ── */
  const med = [], mr = srng(64);
  for (let i = 0; i < 46; i++) med.push(withS([-4.5 + mr() * 10, (mr() - .5) * 5, (mr() - .5) * 4], 0.025 + mr() * 0.035));
  const medium = B.add(dotsMesh(med), { part: null, color: '#bfe6f5', alpha: 0.45, rim: 0.6, rimColor: '#ffffff', pop: false, fixed: true });
  medium.hide = true;
  let ph = 0, last = 0, swimT = 0, px = 0, rot = 0, tumbling = false;
  B.caption([1.1, 2.15, 0], () => api.tool('swim') ? ['تجربة الحركة: اللواحق أعضاء الحركة', 'السوط يدفع الخلية للأمام والأهداب تضرب بموجة متتابعة'] : []);
  B.caption([1.1, -2.2, 0], () => api.tool('swim') ? ['', tumbling ? '↻ تقلّب: تغيّر الخلية اتجاهها' : '← جري: الجسيم الحركي يدير السوط'] : []);
  return {
    dist: 8.8, yaw: 0.45, pitch: 0.35, target: [1.1, 0, 0], maxDist: 20,
    tools: ['swim'],
    hideLabels: () => api.tool('swim'),
    xf: () => {
      if (!px && !rot) return null;
      const c = Math.cos(rot), s = Math.sin(rot), w = swimT ? Math.sin(swimT * 2.1) * 0.12 : 0;
      return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, px + 1.1 - c * 1.1, w, s * 1.1, 1];   // دوران حول مركز العرض
    },
    anim(t){
      const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
      const swim = api.tool('swim');
      ph += dt * (swim ? 12 : 7);
      B.update(fl, flag(ph));
      medium.hide = !swim;
      let tx = 0, tr = 0; tumbling = false;
      if (swim){
        swimT += dt;
        const RUN = 5.6, TUM = 1.9, u = swimT % (RUN * 2 + TUM * 2);
        if (u < RUN){ tx = 1.3 - (u / RUN) * 2.6; tr = 0; }
        else if (u < RUN + TUM){ tx = -1.3; tr = ((u - RUN) / TUM) * Math.PI; tumbling = true; }
        else if (u < RUN * 2 + TUM){ tx = -1.3 + ((u - RUN - TUM) / RUN) * 2.6; tr = Math.PI; }
        else { tx = 1.3; tr = Math.PI + ((u - RUN * 2 - TUM) / TUM) * Math.PI; tumbling = true; }
        if (tr > Math.PI * 1.999) tr = 0;
      } else if (swimT){
        swimT = 0; rot = ((rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); if (rot > Math.PI) rot -= 2 * Math.PI;
      }
      const L = Math.min(1, dt * 3.4);
      if (swim && tr === 0 && rot > Math.PI * 1.5) rot -= 2 * Math.PI;
      px += (tx - px) * L; rot += (tr - rot) * L;
      if (!swim && Math.abs(px) < 1e-3 && Math.abs(rot) < 1e-3){ px = 0; rot = 0; }
    }
  };
}

/* ═════════════ المقارنة: الخليتان جنباً إلى جنب ═════════════ */
function bothModel(B){
  animalModel(B, { s: 0.78, at: [-2.55, 0, 0], noLabels: true });
  plantModel(B, { s: 0.78, at: [2.55, 0, 0], noLabels: true });
  B.caption([-2.55, 2.05, 0], () => ['الخلية الحيوانية']);
  B.caption([2.55, 2.05, 0], () => ['الخلية النباتية']);
  return { dist: 11.5, yaw: 0, pitch: 0.25, maxDist: 22, compactK: 1.2 };
}

Object.assign(G3.models, { animal: animalModel, plant: plantModel, pro: proModel, both: bothModel });
G3.parts = { wavy, studs, golgiStack, mitoSmall, MITO, centrioles, blobDisp, dotsMesh, withS, cp3, animalModel, plantModel };
})();
