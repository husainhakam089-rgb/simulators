
/* ══════════════════════════════════════════════════════════════════════════
   9.6 · مجسّمات التلقيح والإخصاب والبذرة والثمرة (ملزمة ص68–88) — نفس أجزاء
         الرسوم المسطّحة وأسمائها؛ ذات المراحل تتبع الشريط (STG).
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, srng, mk, computeNormals } = G3;
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.8, rimColor: '#ffffff' }, extra || {});
const sm = k => k * k * (3 - 2 * k);
const ball = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
const blade = (base, a, rise, len, w, curl) => { const d = norm([Math.cos(a), rise, Math.sin(a)]);
  return place(ellipsoid({ r: [w, len, 0.035], rows: 8, cols: 14, disp: q => 1 + (curl || 0.25) * q[0] * q[0] }), { at: add(base, mul(d, len * 0.92)), dir: d }); };
const pollenGrain = (at, r) => merge([ball(r, at, 8)].concat(Array.from({ length: 12 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 12), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
  return tube({ pts: [add(at, mul(d, r * 0.9)), add(at, mul(d, r * 1.35))], r: q => r * 0.14 * (1 - q), sides: 4 }); })));
/* سطح دوران جزئي (من a0 إلى a1) لمقطع بعدة طبقات: prof = [[r, y], ...] */
function lathe(prof, a0, a1, cols){
  const m = mk(), C = cols || 32;
  prof.forEach(([r, y]) => { for (let j = 0; j <= C; j++){ const a = a0 + (a1 - a0) * j / C; m.p.push(r * Math.cos(a), y, r * Math.sin(a)); m.l.push(r * Math.cos(a), y, r * Math.sin(a)); m.n.push(0, 0, 0); } });
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < C; j++){ const a = i * (C + 1) + j, b = a + 1, c = a + C + 1, d = c + 1; m.i.push(a, c, b, b, c, d); }
  return computeNormals(m);
}
/* وجه القطع المسطّح لطبقة بين مقطعين (خارجي وداخلي بنفس عدد النقاط) عند الزاوية a — بوجهين */
function cutFace(pOut, pIn, a){
  const m = mk(), c = Math.cos(a), sn = Math.sin(a), P = ([r, y]) => [r * c, y, r * sn], N = pOut.length * 2;
  for (let side = 0; side < 2; side++) pOut.forEach((q, i) => { [P(q), P(pIn[i])].forEach(v => { m.p.push(v[0], v[1], v[2]); m.l.push(v[0], v[1], v[2]); m.n.push(0, 0, 0); }); });
  for (let i = 0; i < pOut.length - 1; i++){ const o = i * 2, x = o + 1, o2 = o + 2, x2 = o + 3;
    m.i.push(o, x, o2, x, x2, o2); m.i.push(N + o, N + o2, N + x, N + x, N + o2, N + x2); }
  return computeNormals(m);
}
/* طبقة مقطوعة: سطحها الخارجي (دوران من a0 إلى a1) ووجها القطع */
const layer = (pOut, pIn, a0, a1) => merge([lathe(pOut, a0, a1, 30), cutFace(pOut, pIn, a0), cutFace(pOut, pIn, a1)]);
/* مقطع بيضوي (نصف قطر rx وارتفاع ry) */
const ovalProf = (rx, ry, n) => Array.from({ length: (n || 18) + 1 }, (_, i) => { const t = Math.PI * i / (n || 18); return [Math.max(0.001, Math.sin(t) * rx), -Math.cos(t) * ry]; });

/* ═════════════ 1) التلقيح الذاتي والخلطي (ص68–69) ═════════════ */
function lily(B, at, tag){
  const PT = [0, 1, 2, 3, 4, 5].map(i => i * 1.047 + 0.3);
  B.add(tube({ pts: [add(at, [0, -2.0, 0]), add(at, [0.05, -1.0, 0]), at], r: 0.06, sides: 8 }), { color: '#4f9e3a', rim: 0.5 });
  B.add(merge(PT.map(a => blade(at, a, 0.55, 0.9, 0.3, 0.5))), { color: '#f58a3a', rim: 0.8, rimColor: '#ffd0a0' });
  const anth = PT.map(a => add(at, [Math.cos(a + 0.5) * 0.42, 1.0, Math.sin(a + 0.5) * 0.42]));
  B.add(merge(PT.map((a, i) => tube({ pts: spline([add(at, [0, 0.1, 0]), add(at, [Math.cos(a + 0.5) * 0.25, 0.6, Math.sin(a + 0.5) * 0.25]), anth[i]], 5, false), r: 0.018, sides: 5 }))), { color: '#e8e0a0', rim: 0.5 });
  B.add(merge(anth.map(p => place(ellipsoid({ r: [0.05, 0.1, 0.05], rows: 6, cols: 8 }), { at: add(p, [0, 0.06, 0]) }))), fx('sdAnther', '#a0502a', { rimColor: '#ffc090' }));
  B.add(tube({ pts: [add(at, [0, 0.1, 0]), add(at, [0.02, 1.2, 0])], r: 0.03, sides: 6 }), { color: '#c8e090', rim: 0.5 });
  B.add(merge([0, 1, 2].map(i => ball(0.06, add(at, [Math.cos(i * 2.1) * 0.06, 1.24, Math.sin(i * 2.1) * 0.06]), 6))), fx('sdStigma', '#9be27a'));
  return { anth: add(anth[0], [0, 0.06, 0]), stig: add(at, [0, 1.26, 0]) };
}
function polModel(B){
  const L1 = lily(B, [-2.2, -0.3, 0]), L2 = lily(B, [-0.4, -0.3, 0]);
  /* مسار التلقيح الخلطي (من متك زهرة إلى ميسم زهرة أخرى) والذاتي (في الزهرة نفسها) */
  const arc = (a, b, h) => Array.from({ length: 21 }, (_, i) => { const u = i / 20; return add(add(mul(a, 1 - u), mul(b, u)), [0, Math.sin(u * Math.PI) * h, 0.1]); });
  const CR = arc(L1.anth, L2.stig, 1.4), SE = arc(L2.anth, L2.stig, 0.45);
  B.add(merge(CR.filter((_, i) => i % 2 === 0).map(p => ball(0.025, p, 4))), fx('sdCross', '#ffe08a', { rim: 0.4 }));
  B.add(merge(SE.filter((_, i) => i % 2 === 0).map(p => ball(0.025, p, 4))), fx('sdSelf', '#a0e0ff', { rim: 0.4 }));
  /* نحلة تحمل حبة لقاح على المسار الخلطي */
  const bee = u => { const i = Math.min(19, Math.floor(u * 20)), f = u * 20 - i, p = add(mul(CR[i], 1 - f), mul(CR[i + 1], f));
    return { body: merge([place(ellipsoid({ r: [0.16, 0.1, 0.1], rows: 8, cols: 12 }), { at: add(p, [0, 0.12, 0]) }), ball(0.07, add(p, [0.16, 0.14, 0]), 6)]),
      wings: merge([-1, 1].map(sg => place(ellipsoid({ r: [0.1, 0.02, 0.06], rows: 4, cols: 8 }), { at: add(p, [0, 0.24, sg * 0.1]) }))), grain: pollenGrain(add(p, [-0.05, 0.0, 0.05]), 0.05) }; };
  const b0 = bee(0.3), beeO = B.add(b0.body, fx('sdBee', '#e8b020', { rimColor: '#fff0a0', pop: false, center: [-1.3, 1.0, 0] })), wingO = B.add(b0.wings, fx('sdBee', '#e8f4ff', { alpha: 0.7, pop: false, center: [-1.3, 1.0, 0] }));
  const grainO = B.add(b0.grain, fx('sdPGrain', '#ffc15e', { pop: false, center: [-1.3, 1.0, 0] }));
  /* شجرتان: ثمار التلقيح الذاتي (أقل وأصغر) والخلطي (أكثر وأكبر) */
  const tree = (x, n, r, seed) => { const R = srng(seed); return { trunk: tube({ pts: [[x, -2.3, 0], [x, -0.6, 0]], r: 0.1, sides: 8 }), crown: ball(0.75, [x, 0.1, 0], 14),
    fruit: merge(Array.from({ length: n }, (_, i) => { const a = R() * 6.28, b = R() * 2.6 + 0.25; return ball(r, [x + Math.cos(a) * Math.sin(b) * 0.74, 0.1 + Math.cos(b) * 0.74, Math.sin(a) * Math.sin(b) * 0.74], 8); })) }; };
  const T1 = tree(1.3, 5, 0.09, 3), T2 = tree(3.0, 12, 0.13, 5);
  B.add(merge([T1.trunk, T2.trunk]), { color: '#7a5030', rim: 0.4 });
  B.add(T1.crown, fx('sdTreeS', '#6cbc44', { rimColor: '#d8ffc0' })); B.add(T1.fruit, fx('sdTreeS', '#f08a3a'));
  B.add(T2.crown, fx('sdTreeC', '#5fae3a', { rimColor: '#d8ffc0' })); B.add(T2.fruit, fx('sdTreeC', '#f06a2a'));
  B.label('sdAnther', L1.anth, [-1, 0.4, 0]);
  B.label('sdStigma', L1.stig, [-1, 0.8, 0]);
  B.label('sdCross', CR[6], [-0.3, 1, 0]);
  B.label('sdSelf', SE[10], [0.3, 1, 0]);
  B.label('sdBee', [-1.3, 1.25, 0], [0, 1, 0.2]);
  B.label('sdPGrain', CR[12], [0.4, 1, 0.2]);
  B.label('sdTreeS', [1.3, -1.3, 0.1], [0, -1, 0.3]);
  B.label('sdTreeC', [3.0, -1.3, 0.1], [0, -1, 0.3]);
  B.caption([0.4, -2.6, 0], () => ['التلقيح: انتقال حبوب اللقاح من المتك إلى الميسم', 'ذاتي في الزهرة نفسها أو النبات نفسه · خلطي بين نباتين (ثمار أكثر عدداً وأكبر حجماً)']);
  return { dist: 10.5, yaw: 0.15, pitch: 0.15, target: [0.4, -0.3, 0], live2d: true,
    anim(t){ const b = bee((t * 0.12) % 1); B.update(beeO, b.body); B.update(wingO, b.wings); B.update(grainO, b.grain); } };
}

/* ═════════════ 2) تكوين أنبوب اللقاح (ص70–71) ═════════════ */
function tubeModel(B){
  /* مدقة: ميسم في الأعلى، قلم، مبيض شفاف وبداخله البويض ونقيره للأسفل */
  const TOP = [0, 2.0, 0], OV = [0, -0.9, 0];
  B.add(merge([0, 1, 2].map(i => place(ellipsoid({ r: [0.18, 0.12, 0.14], rows: 8, cols: 10 }), { at: add(TOP, [Math.cos(i * 2.1) * 0.14, 0.05, Math.sin(i * 2.1) * 0.14]) }))), fx('sdStigma', '#f0a0b8'));
  B.add(tube({ pts: [TOP, [0, -0.1, 0]], r: 0.16, sides: 12 }), fx('sdStyle', '#7fcf5f', { alpha: 0.4, shell: { size: 1.2 } }));
  B.add(place(ellipsoid({ r: [1.0, 1.0, 0.85], rows: 16, cols: 22 }), { at: OV }), fx('sdOvary', '#7fcf5f', { alpha: 0.3, shell: { size: 2.4 } }));
  B.add(place(ellipsoid({ r: [0.42, 0.58, 0.38], rows: 14, cols: 18 }), { at: OV }), fx('sdOvule', '#f6c48a', { alpha: 0.55, shell: { size: 1.0 } }));
  B.add(merge([place(ellipsoid({ r: [0.18, 0.3, 0.16], rows: 10, cols: 12 }), { at: add(OV, [0, 0.05, 0]) })]), { color: '#fff4dc', rim: 0.6 });
  B.add(tube({ pts: Array.from({ length: 13 }, (_, i) => add(OV, [Math.cos(i / 12 * 6.2832) * 0.09, -0.6, Math.sin(i / 12 * 6.2832) * 0.08])), r: 0.03, sides: 5 }), fx('sdMicro', '#5a3010'));
  /* حبة اللقاح تسقط على الميسم ثم ينمو أنبوبها داخل القلم ويدور حول المبيض إلى النقير */
  const path = [add(TOP, [0.05, 0.12, 0]), [0.03, 1.2, 0], [0, -0.05, 0], [0.55, -0.4, 0.2], [0.75, -1.2, 0.2], [0.3, -1.75, 0.1], add(OV, [0, -0.66, 0])];
  const P = spline(path, 6, false), tubeTo = u => tube({ pts: P.slice(0, Math.max(2, Math.round(u * (P.length - 1)) + 1)), r: 0.035, sides: 6 });
  const grainO = B.add(pollenGrain(add(TOP, [0.05, 0.6, 0]), 0.12), fx('sdPGrain', '#ffc15e', { pop: false, center: TOP }));
  const tubeO = B.add(tubeTo(1), fx('sdPTube', '#f0e0a0', { pop: false, center: [0, 0, 0] }));
  /* حبة لقاح نابتة مكبّرة على اليسار: خلية أنبوبية وخلية مولدة تنقسم إلى خليتين ذكريتين */
  const Z = [-2.3, 0.6, 0];
  B.add(merge([place(ellipsoid({ r: [0.55, 0.45, 0.45], rows: 14, cols: 18 }), { at: Z }), tube({ pts: [add(Z, [0.2, -0.38, 0]), add(Z, [0.35, -1.0, 0]), add(Z, [0.3, -1.6, 0])], r: 0.12, sides: 10 })]), fx('sdPGrainZ', '#6a5ad0', { alpha: 0.4, shell: { size: 1.4 } }));
  B.add(ball(0.13, add(Z, [-0.15, 0.1, 0.2]), 10), fx('sdTubeCell', '#c03050'));
  const genO = B.add(place(ellipsoid({ r: [0.12, 0.09, 0.09], rows: 8, cols: 10 }), { at: add(Z, [0.12, -0.05, 0.2]) }), fx('sdGenCell', '#f0e0a0', { pop: false, center: Z }));
  const males = k => merge([-1, 1].map(sg => place(ellipsoid({ r: [0.09, 0.07, 0.07], rows: 8, cols: 10 }), { at: add(Z, [0.12 + sg * 0.12 * k, -0.05 - k * 0.5, 0.2]) })));
  const maleO = B.add(males(1), fx('sdMale', '#f0e0a0', { pop: false, center: Z }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('sdPGrain', add(TOP, [0.15, 0.25, 0]), [1, 0.5, 0]);
  B.label('sdStigma', add(TOP, [0.2, 0.05, 0]), [1, 0.2, 0]);
  B.label('sdStyle', [0.16, 0.9, 0], [1, 0, 0]);
  B.label('sdPTube', [0.7, -0.9, 0.2], [1, 0, 0.2], vis(1, 2, 3));
  B.label('sdOvary', add(OV, [1.0, 0.2, 0]), [1, 0.2, 0]);
  B.label('sdOvule', add(OV, [-0.42, 0.1, 0]), [-1, 0.1, 0.3]);
  B.label('sdMicro', add(OV, [0.05, -0.66, 0.08]), [0.3, -1, 0.4]);
  B.label('sdPGrainZ', add(Z, [-0.55, 0, 0]), [-1, 0.2, 0]);
  B.label('sdTubeCell', add(Z, [-0.15, 0.2, 0.25]), [-1, 0.6, 0.4]);
  B.label('sdGenCell', add(Z, [0.15, -0.05, 0.25]), [1, 0.3, 0.4], vis(0, 1));
  B.label('sdMale', add(Z, [0.2, -0.5, 0.2]), [1, -0.3, 0.4], vis(2, 3));
  B.caption([0, -2.4, 0], () => [(TUBE_STAGES[STG.idx] || {}).n || '']);
  return { dist: 9.2, yaw: 0.2, pitch: 0.12, target: [-0.6, 0, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      if (s === 0) B.update(grainO, pollenGrain(add(TOP, [0.05, 0.6 - 0.45 * k, 0]), 0.12)); else B.update(grainO, pollenGrain(add(TOP, [0.05, 0.15, 0]), 0.12));
      tubeO.hide = s === 0; if (s >= 1) B.update(tubeO, tubeTo(s === 1 ? 0.15 + 0.4 * k : s === 2 ? 0.55 + 0.2 * k : 0.75 + 0.25 * k));
      genO.hide = s >= 2; maleO.hide = s < 2; if (s === 2) B.update(maleO, males(k)); else if (s === 3) B.update(maleO, males(1));
    } };
}

/* ═════════════ 3) الإخصاب المزدوج في الكيس الجنيني (ص74–75) ═════════════ */
function fertModel(B){
  /* البويض قائم والنقير للأسفل؛ داخل الكيس الجنيني: السمتية أعلى، القطبيتان بالوسط، البيضة والمساعدتان قرب النقير */
  B.add(merge([place(ellipsoid({ r: [1.3, 1.9, 1.0], rows: 18, cols: 24 }), {}), place(ellipsoid({ r: [1.15, 1.75, 0.88], rows: 18, cols: 24 }), {})]), fx('sdInteg', '#d0a060', { alpha: 0.25, shell: { size: 3.2 }, rimColor: '#ffe0b0' }));
  B.add(place(ellipsoid({ r: [0.98, 1.6, 0.76], rows: 16, cols: 22 }), {}), fx('sdNucel', '#e8d8a0', { alpha: 0.28, shell: { size: 2.4 } }));
  const SAC = [0, 0.1, 0];
  B.add(place(ellipsoid({ r: [0.6, 1.15, 0.5], rows: 16, cols: 20 }), { at: SAC }), fx('sdEmbSac', '#a8d8f0', { alpha: 0.4, shell: { size: 1.4 }, rimColor: '#e8fbff' }));
  B.add(tube({ pts: Array.from({ length: 13 }, (_, i) => [Math.cos(i / 12 * 6.2832) * 0.13, -1.86, Math.sin(i / 12 * 6.2832) * 0.11]), r: 0.04, sides: 5 }), fx('sdMicro', '#5a3010'));
  const antO = B.add(merge([-1, 0, 1].map(sg => ball(0.14, add(SAC, [sg * 0.22, 0.85 - Math.abs(sg) * 0.08, 0]), 10))), fx('sdAntip', '#e898a8', { rimColor: '#ffe0e8', pop: false }));
  const polar = k => merge([-1, 1].map(sg => ball(0.1, add(SAC, [sg * 0.1 * (1 - k), sg * 0.25 * (1 - k) + 0.1, 0.05]), 8)));
  const polO = B.add(polar(0), fx('sdPolar', '#d84050', { pop: false, center: SAC }));
  const synO = B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.12, 0.18, 0.11], rows: 8, cols: 10 }), { at: add(SAC, [sg * 0.25, -0.78, -0.05]) }))), fx('sdSyn', '#f0a0b0', { pop: false }));
  const eggO = B.add(ball(0.18, add(SAC, [0, -0.62, 0.12]), 12), fx('sdEgg', '#e86078', { pop: false }));
  /* أنبوب اللقاح يدخل من النقير ويفرغ خليتين ذكريتين والخلية الأنبوبية */
  const ptube = u => tube({ pts: [[0.05, -2.8, 0.1], [0.02, -2.2, 0.1], [0, -1.86, 0.08], add(SAC, [0.05, -1.1 + 0.25 * u, 0.1])], r: 0.05, sides: 8 });
  B.add(ptube(1), fx('sdPTube', '#f0e0a0'));
  const tcO = B.add(ball(0.08, add(SAC, [0.1, -1.0, 0.15]), 8), fx('sdTubeCell', '#c03050', { pop: false }));
  const maleAt = (k, sg) => sg < 0 ? add(add(SAC, [0, -0.95, 0.15]), mul([0, 0.38, -0.02], k)) : add(add(SAC, [0, -0.95, 0.15]), mul([0, 1.05, -0.1], k));
  const maleM = k => merge([-1, 1].map(sg => place(ellipsoid({ r: [0.07, 0.05, 0.05], rows: 6, cols: 8 }), { at: maleAt(k, sg) })));
  const maleO = B.add(maleM(0), fx('sdMale', '#f0e0a0', { rimColor: '#ffffff', pop: false, center: SAC }));
  const zyg = B.add(ball(0.22, add(SAC, [0, -0.6, 0.12]), 12), fx('sdZyg', '#b02050', { pop: false }));
  const endo = B.add(ball(0.16, add(SAC, [0, 0.1, 0.05]), 12), fx('sdEndoN', '#7a2a9a', { pop: false }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('sdInteg', [-1.25, 0.3, 0], [-1, 0.2, 0]);
  B.label('sdNucel', [-0.9, -0.6, 0.2], [-1, -0.3, 0.2]);
  B.label('sdEmbSac', add(SAC, [0.6, 0.1, 0]), [1, 0.1, 0.2]);
  B.label('sdMicro', [0.12, -1.86, 0.1], [0.4, -1, 0.3]);
  B.label('sdAntip', add(SAC, [0.25, 0.85, 0.1]), [1, 0.6, 0.2], vis(0, 1, 2));
  B.label('sdPolar', add(SAC, [0.1, 0.35, 0.1]), [1, 0.3, 0.3], vis(0, 1));
  B.label('sdSyn', add(SAC, [-0.3, -0.8, 0]), [-1, -0.3, 0.2], vis(0, 1));
  B.label('sdEgg', add(SAC, [0.15, -0.6, 0.2]), [1, -0.2, 0.4], vis(0, 1));
  B.label('sdPTube', [0.05, -2.4, 0.1], [1, -0.4, 0.2]);
  B.label('sdTubeCell', add(SAC, [0.15, -1.0, 0.2]), [1, -0.5, 0.4], vis(1, 2));
  B.label('sdMale', add(SAC, [-0.1, -0.7, 0.2]), [-1, -0.2, 0.4], vis(1, 2));
  B.label('sdZyg', add(SAC, [0.2, -0.6, 0.15]), [1, -0.2, 0.4], vis(3));
  B.label('sdEndoN', add(SAC, [0.15, 0.15, 0.1]), [1, 0.3, 0.4], vis(3));
  B.caption([0, -2.5, 0], () => [(FERT_STAGES[STG.idx] || {}).n || '']);
  return { dist: 8.6, yaw: 0.3, pitch: 0.1, target: [0, -0.3, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      tcO.hide = s === 0 || s === 3; maleO.hide = s === 0 || s === 3;
      if (s === 1) B.update(maleO, maleM(0.2 * k)); if (s === 2) B.update(maleO, maleM(0.2 + 0.8 * k));
      polO.hide = s === 3; if (s === 2) B.update(polO, polar(k)); else if (s < 2) B.update(polO, polar(0));
      eggO.hide = s === 3; zyg.hide = endo.hide = s !== 3; synO.hide = s === 3; antO.hide = s === 3;
    } };
}

/* ═════════════ 4) مراحل تكوين الجنين في بذرة ذوات الفلقتين (ص75–76) ═════════════ */
function embModel(B){
  B.add(place(ellipsoid({ r: [1.3, 1.85, 1.0], rows: 18, cols: 24 }), {}), fx('sdTesta', '#b8864a', { alpha: 0.3, shell: { size: 3.4 }, rimColor: '#ffe0b0' }));
  /* السويداء: نواة (3س) في البداية ثم نسيج يملأ البذرة ويُستهلك في النضج */
  const endN = B.add(ball(0.12, [0.1, 0.4, 0], 10), fx('sdEndoN', '#2a2a2a', { pop: false }));
  const endT = k => place(ellipsoid({ r: [1.15 * k, 1.65 * k, 0.88 * k], rows: 16, cols: 22 }), {});
  const endTO = B.add(endT(1), fx('sdEndoT', '#f4f0d0', { alpha: 0.35, shell: { size: 3.0 }, pop: false, center: [0, 0, 0] }));
  const BASE = [0, -1.55, 0];
  const zyg = B.add(ball(0.16, add(BASE, [0, 0.15, 0]), 10), fx('sdZyg', '#3a8a3a', { pop: false }));
  const susp = n => merge(Array.from({ length: 4 }, (_, i) => ball(0.08, add(BASE, [0, 0.1 + i * 0.15, 0]), 6)));
  const suspO = B.add(susp(4), fx('sdSusp', '#a8c070', { pop: false }));
  const pro = r => ball(r, add(BASE, [0, 0.7 + r, 0]), 12);
  const proO = B.add(pro(0.18), fx('sdProEmb', '#3a9a3a', { pop: false, center: BASE }));
  /* القلب: فصّان (فلقتان) يبدآن بالنمو؛ الطوربيد: محور طويل وفلقتان؛ الناضج: الفلقتان منطويتان */
  const cot = (h, fold) => merge([-1, 1].map(sg => { const base = add(BASE, [sg * 0.12, 0.9 + h * 0.5, 0]), dir = norm([sg * 0.35 + (fold ? -sg * 0.9 : 0), 1, 0]);
    return place(ellipsoid({ r: [0.15 + h * 0.08, 0.2 + h * 0.6, 0.12], rows: 10, cols: 12 }), { at: add(base, mul(dir, 0.2 + h * 0.5)), dir }); }));
  const cotO = B.add(cot(0.3, false), fx('sdCotyl', '#3fae3a', { pop: false, center: BASE }));
  const axisM = h => tube({ pts: [add(BASE, [0, 0.25, 0]), add(BASE, [0, 0.9 + h * 0.5, 0])], r: 0.12, sides: 10 });
  const axO = B.add(axisM(1), fx('sdAxis', '#5fbe44', { pop: false, center: BASE }));
  const radO = B.add(place(capsule({ r: 0.13, len: 0.4, rows: 4, cols: 10 }), { at: add(BASE, [0, 0.3, 0]) }), fx('sdRadicle', '#c8a050', { pop: false }));
  const hypO = B.add(tube({ pts: [add(BASE, [0, 0.6, 0]), add(BASE, [0, 1.2, 0])], r: 0.135, sides: 10 }), fx('sdHypo', '#7fd060', { pop: false }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('sdTesta', [1.3, 0.4, 0], [1, 0.2, 0]);
  B.label('sdEndoN', [0.15, 0.45, 0.1], [1, 0.4, 0.3], vis(0));
  B.label('sdEndoT', [-1.0, 0.6, 0.2], [-1, 0.4, 0.2], vis(1, 2, 3, 4));
  B.label('sdZyg', add(BASE, [0.15, 0.15, 0.1]), [1, -0.2, 0.3], vis(0));
  B.label('sdSusp', add(BASE, [-0.08, 0.3, 0]), [-1, -0.3, 0.2], vis(1, 2, 3));
  B.label('sdProEmb', add(BASE, [0.2, 0.95, 0.1]), [1, 0.2, 0.3], vis(1, 2, 3));
  B.label('sdCotyl', add(BASE, [0.4, 1.7, 0]), [1, 0.5, 0.2], vis(3, 4, 5));
  B.label('sdAxis', add(BASE, [0.12, 0.8, 0.1]), [1, 0, 0.3], vis(4, 5));
  B.label('sdRadicle', add(BASE, [-0.13, 0.3, 0]), [-1, -0.4, 0.2], vis(4, 5));
  B.label('sdHypo', add(BASE, [-0.14, 0.95, 0]), [-1, 0.2, 0.2], vis(5));
  B.caption([0, -2.3, 0], () => [(EMB_STAGES[STG.idx] || {}).n || '']);
  return { dist: 8.4, yaw: 0.3, pitch: 0.12, target: [0, -0.2, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      endN.hide = s !== 0; endTO.hide = s === 0 || s === 5; if (s === 4) B.update(endTO, endT(1 - 0.25 * k)); else if (s >= 1 && s <= 3) B.update(endTO, endT(1));
      zyg.hide = s !== 0; suspO.hide = !(s >= 1 && s <= 3);
      proO.hide = !(s >= 1 && s <= 3); if (s === 1) B.update(proO, pro(0.12 + 0.08 * k)); if (s === 2) B.update(proO, pro(0.2 + 0.15 * k)); if (s === 3) B.update(proO, pro(0.35));
      cotO.hide = s < 3; if (s === 3) B.update(cotO, cot(0.15 + 0.25 * k, false)); if (s === 4) B.update(cotO, cot(0.4 + 0.5 * k, false)); if (s === 5) B.update(cotO, cot(0.9, true));
      axO.hide = radO.hide = s < 4; hypO.hide = s !== 5;
    } };
}

/* ═════════════ 5) تركيب البذور (ص77–79): حبة ذات فلقة واحدة وبذرة ذات فلقتين مفتوحتان ═════════════ */
function seedsModel(B){
  /* حبة الذرة (ذات الفلقة الواحدة): مقطوع ربعها؛ طبقة محيطة ثم سويداء، والجنين (الورقة الجنينية والجذير) في جانبها */
  const M = [-1.6, 0, 0];
  const A0 = 0.6, A1 = 6.2832 - 0.6, PO = ovalProf(0.95, 1.4), PE = ovalProf(0.86, 1.31), AX = PE.map(([r, y]) => [0.001, y]);
  B.add(place(layer(PO, PE, A0, A1), { at: M }), fx('sdMPeri', '#e8b040', { rimColor: '#fff0b0' }));
  B.add(place(layer(PE, AX, A0, A1), { at: M }), fx('sdMEndo', '#f6eed0', { rimColor: '#ffffff' }));
  B.add(place(ellipsoid({ r: [0.22, 0.6, 0.3], rows: 10, cols: 12 }), { at: add(M, [0.55, -0.35, 0.45]) }), fx('sdMCot', '#e0d080'));
  B.add(place(ellipsoid({ r: [0.12, 0.42, 0.14], rows: 8, cols: 10 }), { at: add(M, [0.72, -0.4, 0.55]) }), fx('sdMEmb', '#a8d070'));
  B.add(place(capsule({ r: 0.08, len: 0.22, rows: 3, cols: 8 }), { at: add(M, [0.74, -0.95, 0.55]) }), fx('sdMRad', '#c8a050'));
  /* بذرة الفاصوليا (ذات الفلقتين) مفتوحة: الغلاف ثم فلقتان، وبينهما المحور الجنيني بالرويشة والجذير */
  const D = [1.6, 0, 0];
  B.add(place(ellipsoid({ r: [0.9, 1.3, 0.12], rows: 14, cols: 20, disp: q => 1 + 0.1 * q[0] }), { at: add(D, [-0.1, 0, -0.45]) }), fx('sdTesta', '#7a3a2a', { rimColor: '#e0a090' }));
  B.add(place(ellipsoid({ r: [0.82, 1.2, 0.3], rows: 14, cols: 20, disp: q => 1 + 0.1 * q[0] }), { at: add(D, [-0.1, 0, -0.18]) }), fx('sdDCot', '#f2e2c0', { rimColor: '#ffffff' }));
  B.add(tube({ pts: spline([add(D, [0.45, -0.75, 0.15]), add(D, [0.5, -0.2, 0.18]), add(D, [0.35, 0.3, 0.18])], 6, false), r: 0.08, sides: 8 }), fx('sdDEmb', '#f8f0d8'));
  B.add(place(capsule({ r: 0.08, len: 0.3, rows: 3, cols: 8 }), { at: add(D, [0.45, -0.95, 0.15]) }), fx('sdDRad', '#e8d8a0'));
  B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.05, 0.16, 0.1], rows: 6, cols: 8 }), { at: add(D, [0.35 + sg * 0.08, 0.45, 0.2]), dir: [sg * 0.6, 1, 0] }))), fx('sdDPlum', '#7ac850'));
  B.label('sdMPeri', add(M, [-0.9, 0.5, 0]), [-1, 0.3, 0]);
  B.label('sdMEndo', add(M, [0.2, 0.8, 0.55]), [-0.3, 1, 0.4]);
  B.label('sdMCot', add(M, [0.5, -0.1, 0.65]), [0.6, 0.4, 0.6]);
  B.label('sdMEmb', add(M, [0.78, -0.5, 0.65]), [1, -0.2, 0.4]);
  B.label('sdMRad', add(M, [0.74, -1.1, 0.6]), [0.4, -1, 0.3]);
  B.label('sdTesta', add(D, [-0.9, 0.6, -0.45]), [-1, 0.5, -0.3]);
  B.label('sdDCot', add(D, [-0.6, -0.6, 0.05]), [-1, -0.5, 0.3]);
  B.label('sdDEmb', add(D, [0.55, -0.2, 0.25]), [1, 0, 0.3]);
  B.label('sdDRad', add(D, [0.5, -1.1, 0.2]), [1, -0.6, 0.3]);
  B.label('sdDPlum', add(D, [0.4, 0.6, 0.25]), [1, 0.5, 0.3]);
  B.caption([0, -1.9, 0], () => ['حبة ذوات الفلقة الواحدة (الذرة) · بذرة ذوات الفلقتين (الفاصوليا) مفتوحة']);
  return { dist: 7.6, yaw: 0.45, pitch: 0.2, target: [0, -0.1, 0] };
}

/* ═════════════ 6) تركيب الثمرة (ص82–86): ثمرة لحمية مقطوع ربعها ═════════════ */
function fruitModel(B){
  const A0 = 0.7, A1 = 6.2832 - 0.7, EX = ovalProf(1.4, 1.5), ME = ovalProf(1.33, 1.43), EN = ovalProf(0.62, 0.78), SD = ovalProf(0.4, 0.55), AX = SD.map(([r, y]) => [0.001, y]);
  B.add(layer(EX, ME, A0, A1), fx('sdExo', '#e8702a', { rimColor: '#ffd0a0' }));
  B.add(layer(ME, EN, A0, A1), fx('sdMeso', '#ffcf70', { rimColor: '#fff0c0' }));
  B.add(layer(EN, SD, A0, A1), fx('sdEndo', '#9a6a3a', { rimColor: '#e0b080' }));
  B.add(layer(SD, AX, A0, A1), fx('sdFSeed', '#6aae4a', { rimColor: '#d8ffc0' }));
  B.add(tube({ pts: [[0, 1.45, 0], [0.05, 1.8, 0], [0.2, 2.0, 0]], r: 0.05, sides: 6 }), { color: '#6a4a2a', rim: 0.4 });
  B.label('sdExo', [-1.1, 0.8, -0.6], [-1, 0.4, -0.3]);
  B.label('sdMeso', [1.0, 0.2, 0.75], [1, 0.1, 0.6]);
  B.label('sdEndo', [0.45, -0.4, 0.3], [1, -0.4, 0.6]);
  B.label('sdFSeed', [0.15, 0.2, 0.2], [0.4, 1, 0.6]);
  B.caption([0, -1.9, 0], () => ['الثمرة: مبيض ناضج بعد الإخصاب — جدارها (الغلاف الثمري) ثلاث طبقات وداخلها البذرة']);
  return { dist: 6.8, yaw: 0.9, pitch: 0.25, target: [0, 0, 0] };
}

/* ═════════════ 7) أنواع الثمار وانتشارها (ص86–88) ═════════════ */
function typesModel(B){
  const X = [-2.4, 0, 2.4], Y1 = 1.0, Y2 = -1.4;
  /* بسيطة: ثمرة واحدة من مبيض واحد (مشمش) */
  B.add(merge([ball(0.6, [X[0], Y1, 0], 16), tube({ pts: [[X[0], Y1 + 0.55, 0], [X[0] + 0.1, Y1 + 0.85, 0]], r: 0.04, sides: 5 })]), fx('sdSimple', '#f6a33a', { rimColor: '#ffe0a0' }));
  /* متجمعة: ثمار صغيرة كثيرة من زهرة واحدة (التوت الأسود) */
  const R = srng(8);
  B.add(merge(Array.from({ length: 40 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 40), d = [Math.cos(a) * Math.sin(b) * 0.5, Math.cos(b) * 0.62, Math.sin(a) * Math.sin(b) * 0.5]; void R; return ball(0.13, add([X[1], Y1, 0], d), 6); })), fx('sdAggr', '#4a2a6a', { rimColor: '#c0a0ff' }));
  /* مركبة: من أزهار متجمعة (الأناناس) بحراشف وتاج أوراق */
  B.add(merge([place(ellipsoid({ r: [0.5, 0.75, 0.5], rows: 14, cols: 18 }), { at: [X[2], Y1 - 0.1, 0] })].concat(Array.from({ length: 36 }, (_, i) => { const a = i * 0.9, y = -0.6 + (i % 9) * 0.14 + Math.floor(i / 9) * 0.035, rr = 0.5 * Math.sqrt(Math.max(0.05, 1 - (y / 0.75) ** 2)); return place(ellipsoid({ r: 0.06, rows: 4, cols: 6 }), { at: [X[2] + Math.cos(a) * rr, Y1 - 0.1 + y, Math.sin(a) * rr] }); }))), fx('sdMulti', '#e8b030', { rimColor: '#fff0a0' }));
  B.add(merge(Array.from({ length: 8 }, (_, i) => { const a = i * 0.785, d = norm([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]); return place(ellipsoid({ r: [0.04, 0.35, 0.09], rows: 4, cols: 6 }), { at: add([X[2], Y1 + 0.7, 0], mul(d, 0.3)), dir: d }); })), fx('sdMulti', '#4fae3a'));
  /* بالرياح: بذرة بمظلة شعيرات (الهندباء) */
  const wind = t => { const c = [X[0] + Math.sin(t * 0.8) * 0.25, Y2 + 0.2 + Math.sin(t * 1.3) * 0.12, 0];
    return merge([tube({ pts: [add(c, [0, -0.6, 0]), add(c, [0, 0.1, 0])], r: 0.012, sides: 4 }), place(ellipsoid({ r: [0.04, 0.14, 0.04], rows: 4, cols: 6 }), { at: add(c, [0, -0.7, 0]) })]
      .concat(Array.from({ length: 16 }, (_, i) => { const a = i * 0.39, d = norm([Math.cos(a), 0.6, Math.sin(a)]); return tube({ pts: [add(c, [0, 0.1, 0]), add(add(c, [0, 0.1, 0]), mul(d, 0.45))], r: 0.006, sides: 3 }); }))); };
  const windO = B.add(wind(0), fx('sdWind', '#f0f0f0', { pop: false, center: [X[0], Y2, 0] }));
  /* بالماء: ثمرة جوز الهند تطفو */
  B.add(place(ellipsoid({ r: [0.95, 0.06, 0.6], rows: 6, cols: 24 }), { at: [X[1], Y2 - 0.35, 0] }), { color: '#3a7ad0', alpha: 0.7, rim: 0.6, rimColor: '#c0e0ff' });
  const coco = t => place(ellipsoid({ r: [0.42, 0.36, 0.38], rows: 12, cols: 16 }), { at: [X[1], Y2 - 0.2 + Math.sin(t * 2) * 0.05, 0] });
  const cocoO = B.add(coco(0), fx('sdWater', '#8a5a2a', { rimColor: '#e0b080', pop: false, center: [X[1], Y2, 0] }));
  /* بالحيوانات: ثمرة بخطاطيف عالقة بفرو */
  B.add(place(G3.superEll({ h: [0.8, 0.12, 0.45], e: 0.3, rows: 6, cols: 12 }), { at: [X[2], Y2 - 0.45, 0] }), { color: '#8a6a4a', rim: 0.4 });
  B.add(merge(Array.from({ length: 30 }, (_, i) => { const x = X[2] - 0.7 + (i % 10) * 0.15, z = -0.3 + Math.floor(i / 10) * 0.3; return tube({ pts: [[x, Y2 - 0.33, z], [x + 0.03, Y2 - 0.15, z]], r: 0.012, sides: 3 }); })), { color: '#a08060', rim: 0.3 });
  B.add(merge([0, 1].map(j => merge([ball(0.2, [X[2] - 0.25 + j * 0.5, Y2 - 0.05, 0], 10)].concat(Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 16), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)], c = [X[2] - 0.25 + j * 0.5, Y2 - 0.05, 0];
    return tube({ pts: [add(c, mul(d, 0.18)), add(c, mul(d, 0.34)), add(c, add(mul(d, 0.36), [0, -0.05, 0]))], r: 0.012, sides: 3 }); }))))), fx('sdAnimal', '#c8a040', { rimColor: '#fff0b0' }));
  B.label('sdSimple', [X[0], Y1 - 0.6, 0], [0, -1, 0.3]);
  B.label('sdAggr', [X[1], Y1 - 0.6, 0], [0, -1, 0.3]);
  B.label('sdMulti', [X[2], Y1 - 0.85, 0], [0, -1, 0.3]);
  B.label('sdWind', [X[0], Y2 - 0.55, 0], [0, -1, 0.3]);
  B.label('sdWater', [X[1], Y2 - 0.4, 0.4], [0, -1, 0.3]);
  B.label('sdAnimal', [X[2], Y2 - 0.25, 0.2], [0, -1, 0.3]);
  B.caption([0, -2.6, 0], () => ['أنواع الثمار: بسيطة · متجمعة · مركبة', 'انتشار الثمار والبذور: بالرياح · بالماء · بالحيوانات']);
  return { dist: 9.6, yaw: 0.1, pitch: 0.15, target: [0, -0.2, 0], live2d: true,
    anim(t){ B.update(windO, wind(t)); B.update(cocoO, coco(t)); } };
}

Object.assign(G3.models, { sdp_sdpPol: polModel, sdp_sdpTube: tubeModel, sdp_sdpFert: fertModel, sdp_sdpEmb: embModel, sds_sdsSeed: seedsModel, sds_sdsFruit: fruitModel, sds_sdsTypes: typesModel });
})();
