
/* ══════════════════════════════════════════════════════════════════════════
   9.3 · مجسّمات الطليعيات والفطريات — نفس أجزاء الرسوم المسطّحة وأسمائها
         (ملزمة ص26–39). كل مجسّم كائن واحد يتغير مع المرحلة (STG) بدل
         تسلسل الدورة المرسوم، والأجزاء التي تخص مرحلة تظهر في مرحلتها.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.8, rimColor: '#ffffff' }, extra || {});
const sm = k => k * k * (3 - 2 * k);
const ball = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
/* سوط متموج يبدأ من base باتجاه dir */
function flagellum(base, dir, len, ph, r){
  const d = norm(dir), up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const sd = norm([d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]), pts = [];
  for (let i = 0; i <= 14; i++){ const u = i / 14; pts.push(add(add(base, mul(d, u * len)), mul(sd, Math.sin(u * 7 + ph) * 0.08 * len * u))); }
  return tube({ pts, r: u => (r || 0.025) * (1 - u * 0.5), sides: 5 });
}
/* كلاميدوموناس: جسم بيضوي، بلاستيدة كوبية، نواة، سوطان من القمة (s حجم، rot اتجاه القمة) */
function chlamy(at, s, up, ph){
  const u = norm(up || [0, 1, 0]), P = v => add(at, mul(v, s));
  const top = P(mul(u, 0.68));
  return {
    body: place(ellipsoid({ r: [0.55 * s, 0.7 * s, 0.55 * s], rows: 12, cols: 16 }), { at, dir: u }),
    chl: place(ellipsoid({ r: [0.5 * s, 0.42 * s, 0.5 * s], rows: 10, cols: 14 }), { at: P(mul(u, -0.22)), dir: u }),
    nuc: ball(0.17 * s, P(mul(u, 0.12)), 8),
    flag: merge([-1, 1].map(sg => { const side = norm(add(u, [sg * 0.9, 0, sg * 0.25])); return flagellum(top, side, 1.2 * s, ph + sg, 0.03 * s); }))
  };
}
/* أربعة مواقع بشكل رباعي الأوجه */
const TETRA = [[0.6, 0.45, 0.4], [-0.6, 0.45, -0.4], [0.5, -0.5, -0.55], [-0.5, -0.5, 0.55]].map(norm);
/* جدار ممزق: قوسان من جهتين يتباعدان */
const tornWall = (rx, ry, gap) => merge([-1, 1].map(sg => { const pts = []; for (let i = 0; i <= 16; i++){ const a = -1.25 + i / 16 * 2.5; pts.push([sg * (Math.cos(a) * rx + gap), Math.sin(a) * ry, 0]); }
  return tube({ pts, r: 0.06, sides: 6 }); }));

/* ═════════════ 1) التكاثر اللاجنسي في الكلاميدوموناس (ص26) ═════════════ */
function chAModel(B){
  const wall = B.add(ellipsoid({ r: [0.95, 1.15, 0.95], rows: 16, cols: 22 }), fx('prWall', '#d8f0a0', { alpha: 0.24, rim: 1.4, rimColor: '#f4ffd8', shell: { size: 2.4 } }));
  const c = chlamy([0, -0.05, 0], 1, [0, 1, 0], 0);
  const pB = B.add(c.body, fx('prChlamy', '#a8dc6a', { alpha: 0.5, shell: { size: 1.6 } }));
  const pC = B.add(c.chl, fx('prCupChl', '#3fa83a', { rimColor: '#c8ffb0' }));
  const pN = B.add(c.nuc, fx('prChlamy', '#9b6ad0', { rimColor: '#e8d8ff' }));
  const pF = B.add(c.flag, fx('prFlag', '#d8f0b0', { pop: false }));
  const zo = (i, k, out) => { const d = TETRA[i], m = chlamy(mul(d, 0.42 + out * 1.6), 0.36 * (0.5 + 0.5 * k), d, i);
    return { b: merge([m.body, m.chl, m.flag]), n: m.nuc }; };
  const Z = TETRA.map((_, i) => { const m = zo(i, 1, 0);
    return { b: B.add(m.b, fx('prZoosp', '#7cc95a', { pop: false, center: [0, 0, 0] })), n: B.add(m.n, fx('prZoosp', '#9b6ad0', { pop: false, center: [0, 0, 0] })) }; });
  const torn = B.add(tornWall(0.95, 1.15, 0), fx('prSpRel', '#cfe890', { rim: 1.2, pop: false, center: [0, 0, 0] }));
  const daughter = (i, t) => { const a = i / 4 * 6.2832 + t * 0.25, r = 2.0, m = chlamy([Math.cos(a) * r, Math.sin(t + i) * 0.15, Math.sin(a) * r], 0.62, [Math.cos(a + 1.57) * 0.3, 1, Math.sin(a + 1.57) * 0.3], t * 6 + i);
    return { b: merge([m.body, m.chl, m.flag]), n: m.nuc }; };
  const D = [0, 1, 2, 3].map(i => { const m = daughter(i, 0);
    return { b: B.add(m.b, fx('prChDaugh', '#8fd462', { pop: false, center: [0, 0, 0] })), n: B.add(m.n, fx('prChDaugh', '#9b6ad0', { pop: false, center: [0, 0, 0] })) }; });
  B.label('prChlamy', [0.55, -0.35, 0.3], [1, -0.4, 0.2], () => STG.idx === 0);
  B.label('prCupChl', [-0.45, -0.45, 0.2], [-1, -0.4, 0.3], () => STG.idx === 0);
  B.label('prFlag', [0.9, 1.5, 0], [1, 0.6, 0], () => STG.idx === 0);
  B.label('prWall', [-0.95, 0.4, 0], [-1, 0.3, 0], () => STG.idx < 2);
  B.label('prZoosp', [0.4, 0.3, 0.4], [1, 0.3, 0.4], () => STG.idx === 1 || STG.idx === 2);
  B.label('prSpRel', [-1.0, -0.6, 0], [-1, -0.3, 0], () => STG.idx === 2);
  B.label('prChDaugh', [2.0, 0, 0], [1, 0.2, 0], () => STG.idx === 3);
  B.caption([0, -1.9, 0], () => [(PR_CHA_ST[STG.idx] || {}).n || '']);
  return { dist: 7.4, yaw: 0.3, pitch: 0.25, target: [0, 0, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      [pB, pC, pN].forEach(o => o.hide = s !== 0); pF.hide = s !== 0;
      if (s === 0) B.update(pF, chlamy([0, -0.05, 0], 1, [0, 1, 0], t * 6).flag);
      wall.hide = s >= 2; torn.hide = s !== 2; if (s === 2) B.update(torn, tornWall(0.95, 1.15, k * 0.5));
      Z.forEach((z, i) => { const on = s === 1 || s === 2; z.b.hide = z.n.hide = !on; if (!on) return;
        const m = zo(i, s === 1 ? k : 1, s === 2 ? k : 0); B.update(z.b, m.b); B.update(z.n, m.n); });
      D.forEach((d, i) => { d.b.hide = d.n.hide = s !== 3; if (s !== 3) return; const m = daughter(i, t); B.update(d.b, m.b); B.update(d.n, m.n); });
    } };
}

/* ═════════════ 2) التكاثر الجنسي في الكلاميدوموناس (ص27–29) ═════════════ */
function chSModel(B){
  const wall = B.add(ellipsoid({ r: [0.95, 1.15, 0.95], rows: 16, cols: 22 }), fx('prChlamy', '#d8f0a0', { alpha: 0.24, rim: 1.4, rimColor: '#f4ffd8', shell: { size: 2.4 } }));
  const c = chlamy([0, -0.05, 0], 1, [0, 1, 0], 0);
  const par = [B.add(c.body, fx('prChlamy', '#a8dc6a', { alpha: 0.5, shell: { size: 1.6 } })), B.add(c.chl, fx('prChlamy', '#3fa83a')), B.add(c.nuc, fx('prChlamy', '#9b6ad0')), B.add(c.flag, fx('prChlamy', '#d8f0b0'))];
  /* ثمانية أمشاج متشابهة صغيرة */
  const G8 = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.2832, e = (i % 2 ? 0.35 : -0.35); return norm([Math.cos(a), e, Math.sin(a)]); });
  const gam = (i, out, t) => { const d = G8[i], m = chlamy(mul(d, 0.5 + out * 1.7), 0.26, d, t * 6 + i); return merge([m.body, m.chl, m.nuc, m.flag]); };
  const GI = G8.map((_, i) => B.add(gam(i, 0, 0), fx('prIsogam', '#7cc95a', { pop: false, center: [0, 0, 0] })));
  const GR = G8.map((_, i) => B.add(gam(i, 1, 0), fx('prGamRel', '#7cc95a', { pop: false, center: [0, 0, 0] })));
  const torn = B.add(tornWall(0.95, 1.15, 0.3), fx('prGamRel', '#cfe890', { rim: 1.2, pop: false, center: [0, 0, 0] }));
  /* اتحاد مشيجين ← زيجة رباعية الأسواط ← بوغ زيجي */
  const pair = (k, t) => merge([-1, 1].map(sg => { const m = chlamy([sg * (1.0 - k * 0.72), 0, 0], 0.5, [sg * 0.3, 1, 0], t * 6 + sg); return merge([m.body, m.chl, m.nuc, m.flag]); }));
  const fuse = B.add(pair(0, 0), fx('prGamFuse', '#8fd462', { pop: false, center: [0, 0, 0] }));
  const zyg = B.add(merge([ellipsoid({ r: [0.62, 0.72, 0.6], rows: 12, cols: 16 })].concat([-1.1, -0.4, 0.4, 1.1].map((a, i) => flagellum([0, 0.66, 0], [Math.sin(a) * 0.9, 1, Math.cos(a) * 0.4], 1.0, i, 0.03)))),
    fx('prZyg', '#7cc95a', { pop: false, center: [0, 0, 0] }));
  const zygN = B.add(ball(0.24, [0, 0.05, 0.3], 10), fx('prZyg', '#7a3ab0', { pop: false }));
  /* البوغ الزيجي: جدار سميك ذو نتوءات */
  const spore = B.add(merge([ellipsoid({ r: 0.85, rows: 14, cols: 20 })].concat(Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 26), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
    return tube({ pts: [mul(d, 0.82), mul(d, 1.02)], r: u => 0.06 * (1 - u), sides: 5 }); }))), fx('prZygosp', '#8a6a2a', { rimColor: '#ffd890', alpha: 0.45, shell: { size: 2.2 } }));
  /* انقسام اختزالي داخل البوغ الزيجي ← أربعة أفراد تتحرر */
  const four = (out, k, t) => merge(TETRA.map((d, i) => { const m = chlamy(mul(d, 0.38 + out * 1.7), 0.3 * (0.6 + 0.4 * k), d, t * 6 + i); return merge([m.body, m.chl, m.nuc, m.flag]); }));
  const meio = B.add(four(0, 1, 0), fx('prMeioCh', '#7cc95a', { pop: false, center: [0, 0, 0] }));
  const rel = B.add(four(1, 1, 0), fx('prZsRel', '#8fd462', { pop: false, center: [0, 0, 0] }));
  const vis = s => () => STG.idx === s;
  B.label('prChlamy', [0.95, 0.2, 0], [1, 0.2, 0], vis(0));
  B.label('prIsogam', [0.5, 0.2, 0.45], [1, 0.2, 0.5], vis(1));
  B.label('prGamRel', [-1.2, -0.2, 0], [-1, -0.2, 0], vis(2));
  B.label('prGamFuse', [0, 0.3, 0.3], [0, 1, 0.3], vis(3));
  B.label('prZyg', [0.6, -0.2, 0.2], [1, -0.2, 0.2], vis(4));
  B.label('prZygosp', [0.85, -0.3, 0.2], [1, -0.3, 0.2], vis(5));
  B.label('prMeioCh', [0.4, 0.3, 0.3], [1, 0.3, 0.3], vis(6));
  B.label('prZsRel', [1.6, 0.4, 0], [1, 0.3, 0], vis(7));
  B.caption([0, -2.0, 0], () => [(PR_CHS_ST[STG.idx] || {}).n || '']);
  return { dist: 7.6, yaw: 0.3, pitch: 0.25, target: [0, 0, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      par.forEach(o => o.hide = s !== 0); wall.hide = s > 1;
      GI.forEach((o, i) => { o.hide = s !== 1; if (s === 1) B.update(o, gam(i, 0, t)); });
      GR.forEach((o, i) => { o.hide = s !== 2; if (s === 2) B.update(o, gam(i, k * 0.7, t)); }); torn.hide = s !== 2;
      fuse.hide = s !== 3; if (s === 3) B.update(fuse, pair(k, t));
      zyg.hide = zygN.hide = s !== 4; spore.hide = s !== 5 && s !== 6;
      meio.hide = s !== 6; if (s === 6) B.update(meio, four(0, k, t));
      rel.hide = s !== 7; if (s === 7) B.update(rel, four(k, 1, t));
    } };
}

/* ═════════════ البراميسيوم: جسم يشبه النعل، أخدود فمي، أهداب ═════════════ */
const paraBody = (at, s, L) => place(ellipsoid({ r: [0.42 * s, (L || 1.2) * s, 0.3 * s], rows: 14, cols: 18,
  disp: d => 1 + 0.12 * Math.sin(d[1] * 3.2) * (d[0] > 0 ? 1 : 0) - 0.08 * Math.max(0, -d[1]) }), { at });
const paraCilia = (at, s, L, t) => merge(Array.from({ length: 34 }, (_, i) => { const a = i * 2.39996, b = Math.acos(1 - 2 * (i + 0.5) / 34), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
  const p = add(at, [d[0] * 0.42 * s, d[1] * (L || 1.2) * s, d[2] * 0.3 * s]), o = norm([d[0], d[1] * 0.4, d[2]]); return tube({ pts: [p, add(p, mul(norm(add(o, [0, Math.sin(t * 8 + i) * 0.5, 0])), 0.12 * s))], r: 0.008 * s, sides: 3 }); }));
const groove = (at, s) => tube({ pts: spline([[0.34, 0.25, 0.12], [0.2, 0.0, 0.26], [0.3, -0.25, 0.18]].map(p => add(at, mul(p, s))), 6, false), r: 0.05 * s, sides: 6 });
const macN = (at, s, Ly) => place(ellipsoid({ r: [0.17 * s, (Ly || 0.36) * s, 0.15 * s], rows: 10, cols: 12, disp: d => 1 + 0.15 * d[0] }), { at });

/* ═════════════ 3) الانقسام الثنائي المستعرض في البراميسيوم (ص30–31) ═════════════ */
function pfModel(B){
  /* محور الطول هو y؛ الانقسام مستعرض: الجسم ينشطر إلى علوي وسفلي */
  const half = (sg, cut, sep) => place(ellipsoid({ r: [0.42, 1.2 * (1 - cut * 0.5), 0.3], rows: 14, cols: 18 }), { at: [0, sg * (cut * 0.6 + sep * 0.9), 0] });
  const bodyO = B.add(paraBody([0, 0, 0], 1), { part: 'prPara', color: '#a8d8ea', alpha: 0.45, rim: 1.3, rimColor: '#e8fbff', shell: { size: 2.4 } });
  const halves = [-1, 1].map(sg => B.add(half(sg, 0, 0), { part: 'prConstr', color: '#a8d8ea', alpha: 0.45, rim: 1.3, rimColor: '#e8fbff', shell: { size: 1.5 }, pop: false, center: [0, 0, 0] }));
  const cil = B.add(paraCilia([0, 0, 0], 1, 1.2, 0), { color: '#d8f4ff', rim: 0.3, pop: false });
  const gr = B.add(groove([0, 0, 0], 1), fx('prOralBud', '#3b7b97', { rimColor: '#bfe8ff' }));
  const bud = B.add(groove([0, -1.1, 0], 0.7), fx('prOralBud', '#3b7b97', { rimColor: '#bfe8ff', pop: false, center: [0, -0.8, 0] }));
  const mac = B.add(macN([-0.05, 0, 0.05], 1), fx('prMacN', '#6a3a1a', { rimColor: '#e8c0a0', pop: false, center: [0, 0, 0] }));
  const macB = B.add(macN([-0.05, 0, 0.05], 1), fx('prFisB', '#6a3a1a', { rimColor: '#e8c0a0', pop: false, center: [0, 0, 0] }));
  const mac2 = k => merge([-1, 1].map(sg => macN([-0.05, sg * (0.2 + 0.45 * k), 0.05], 1, 0.3)));
  const macS = B.add(mac2(0), fx('prMacN', '#6a3a1a', { rimColor: '#e8c0a0', pop: false, center: [0, 0, 0] }));
  const mic = [0, 1].map(i => B.add(ball(0.08, [0.18, 0.35, 0.12], 8), fx('prMicN', '#2a1a10', { rimColor: '#c8b0a0', pop: false, center: [0, 0, 0] })));
  const cv = [0, 1, 2, 3].map(i => B.add(ball(0.11, [0, 0, 0], 8), fx('prCVac', '#e8fbff', { alpha: 0.85, rimColor: '#ffffff', pop: false, center: [0, 0, 0] })));
  const daughters = [-1, 1].map(sg => B.add(merge([paraBody([0, 0, 0], 0.62)]), { part: 'prDaughterP', color: '#a8d8ea', alpha: 0.5, rim: 1.3, rimColor: '#e8fbff', shell: { size: 1.4 }, pop: false, center: [0, 0, 0] }));
  const dNuc = [-1, 1].map(sg => B.add(macN([0, 0, 0], 0.62), fx('prDaughterP', '#6a3a1a', { pop: false, center: [0, 0, 0] })));
  const sepO = B.add(place(ellipsoid({ r: [0.5, 0.025, 0.38], rows: 6, cols: 18 }), { at: [0, 0, 0] }), fx('prFisSep', '#e8fbff', { alpha: 0.75, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }));
  B.label('prMacN', [-0.2, 0.1, 0.1], [-1, 0.2, 0.3], () => STG.idx === 0);
  B.label('prMicN', [0.2, 0.35, 0.12], [1, 0.5, 0.3], () => STG.idx === 0);
  B.label('prOralBud', [0.25, -1.1, 0.15], [1, -0.3, 0.3], () => STG.idx === 1);
  B.label('prFisB', [-0.2, -0.3, 0.1], [-1, -0.2, 0.3], () => STG.idx === 1);
  B.label('prPara', [-0.42, 0.5, 0], [-1, 0.3, 0], () => STG.idx < 2);
  B.label('prConstr', [0.42, 0, 0], [1, 0, 0.2], () => STG.idx === 2);
  B.label('prCVac', [0.2, 0.9, 0.2], [1, 0.4, 0.3], () => STG.idx === 2);
  B.label('prFisSep', [0.5, 0, 0], [1, 0, 0.3], () => STG.idx === 3);
  B.label('prDaughterP', [0.3, 1.4, 0], [1, 0.4, 0], () => STG.idx === 3);
  B.caption([0, -2.3, 0], () => [(PR_PF_ST[STG.idx] || {}).n || '']);
  return { dist: 7.2, yaw: 0.6, pitch: 0.2, target: [0, 0, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      bodyO.hide = s >= 2; halves.forEach((o, i) => { o.hide = s !== 2; if (s === 2) B.update(o, half(i ? 1 : -1, k, 0)); });
      cil.hide = s === 3; if (s < 3) B.update(cil, paraCilia([0, 0, 0], 1, 1.2, t));
      gr.hide = s === 3; bud.hide = s !== 1 && s !== 2;
      mac.hide = s !== 0; macB.hide = s !== 1; macS.hide = s !== 2; if (s === 2) B.update(macS, mac2(k));
      if (s === 1) B.update(macB, macN([-0.05, 0, 0.05], 1, 0.36 + 0.4 * k));
      mic.forEach((o, i) => { o.hide = s === 3; const sp = s === 0 ? k : 1, sg = i ? 1 : -1; B.update(o, ball(0.08, [0.18, 0.35 * (s >= 2 ? 1 : 0) * sg + sg * sp * 0.25 + (s >= 2 ? sg * k * 0.4 : 0), 0.12], 8)); });
      cv.forEach((o, i) => { const on = s === 2; o.hide = !on; if (on) B.update(o, ball(0.11 * (i < 2 ? 1 : k), [0, (i % 2 ? 1 : -1) * (i < 2 ? 0.95 : 0.3 + 0.3 * k), -0.05], 8)); });
      sepO.hide = s !== 3;
      daughters.forEach((o, i) => { const on = s === 3, sg = i ? 1 : -1; o.hide = dNuc[i].hide = !on; if (!on) return;
        const y = sg * (0.8 + k * 0.7); B.update(o, paraBody([0, y, 0], 0.62)); B.update(dNuc[i], macN([-0.03, y, 0.03], 0.62)); });
    } };
}

/* ═════════════ 4–5) الاقتران والإخصاب الذاتي في البراميسيوم (ص32–35) — خطوات مجسّمة ═════════════
   مثل الرسم المسطّح: كل الخطوات ظاهرة ومرقّمة في صفوف (من اليمين لليسار)، والخطوة الحالية
   تكبر وتتوهج والخطوات القادمة باهتة. */
const pxf = (m, s, at) => { const p = new Array(m.p.length); for (let i = 0; i < m.p.length; i += 3){ p[i] = m.p[i] * s + at[0]; p[i + 1] = m.p[i + 1] * s + at[1]; p[i + 2] = m.p[i + 2] * s + at[2]; } return { p, n: m.n, l: m.l, i: m.i }; };
function paraStep(i, self){
  const X = 0.5, L = [], A = (m, o) => L.push([m, o]), cAt = (sg, sep) => [sg * (X + (sep || 0)), 0, 0];
  const COL = sg => sg < 0 ? '#f7941d' : '#7a5ad6', COLD = sg => sg < 0 ? '#a85a00' : '#3a2580';
  const iFus = self ? 3 : 4, iSep = self ? 4 : 5, iEight = self ? 5 : 6;
  if (i === iEight){ A(merge(Array.from({ length: 8 }, (_, j) => paraBody([(j - 3.5) * 0.62, (j % 2) * 0.12, 0], 0.36))), { part: 'prEight', color: self ? '#cfe0f4' : '#bfe6f6', alpha: 0.6, rim: 1.2, rimColor: '#e8fbff', shell: { size: 1 } });
    const nucs = js => merge(js.map(j => macN([(j - 3.5) * 0.62 - 0.02, (j % 2) * 0.12 + 0.1, 0.03], 0.36)));
    if (self){ A(nucs([0, 1, 2, 3]), fx('prEight', '#7a5ad6')); A(nucs([4, 5, 6, 7]), fx('prEight', '#f7941d')); }
    else A(nucs([0, 1, 2, 3, 4, 5, 6, 7]), fx('prEight', '#28b8f0'));
    return L; }
  const sep = i === iSep ? 0.55 : 0;
  [-1, 1].forEach(sg => A(paraBody(cAt(sg, sep), 1), { part: i === iSep ? 'prSep' : 'prPara', color: sg < 0 ? '#c8e6f2' : '#b8d8f0', alpha: 0.42, rim: 1.3, rimColor: '#e8fbff', shell: { size: 2.4 } }));
  if (i < iSep) A(place(capsule({ r: 0.16, len: 0.5, rows: 3, cols: 12 }), { rot: [0, 0, Math.PI / 2], at: [0, 0.15, 0] }), fx('prProtoBr', '#e6f8ff', { alpha: 0.7, rimColor: '#8fd0e8' }));
  if (i < iSep) [-1, 1].forEach(sg => A(macN(add(cAt(sg), [sg * 0.05, 0.45, 0.05]), 0.9 * (i >= 2 ? 0.55 : 1)), fx('prMacN', COL(sg), { rimColor: '#ffffff' })));
  if (i === 0) [-1, 1].forEach(sg => A(ball(0.09, add(cAt(sg), [0, -0.25, 0.15]), 8), fx('prMicN', COLD(sg), { rimColor: '#ffffff' })));
  if (i === 1) [-1, 1].forEach(sg => A(merge([[0, -0.15], [0.12, -0.35], [-0.12, -0.45], [0, -0.62]].map(([dx, dy]) => ball(0.075, add(cAt(sg), [dx, dy, 0.15]), 8))), fx('prMeioMic', COL(sg))));
  if (i === 2) [-1, 1].forEach(sg => {
    A(merge([[0.12, -0.55], [-0.12, -0.7], [0.02, -0.85]].map(([dx, dy]) => ball(0.06, add(cAt(sg), [dx, dy, 0.12]), 6))), fx('prDegen', COL(sg), { alpha: 0.35 }));
    A(tube({ pts: [add(cAt(sg), [0, -0.05, 0.15]), add(cAt(sg), [0, -0.35, 0.15])], r: 0.025, sides: 5 }), fx('prUneq', '#e8e0c0'));
    A(ball(0.12, add(cAt(sg), [0, -0.05, 0.15]), 10), fx('prFemN', COL(sg)));
    A(ball(0.07, add(cAt(sg), [0, -0.35, 0.15]), 8), fx('prMaleN', COL(sg))); });
  if (i === 3 && !self){ [-1, 1].forEach(sg => A(ball(0.12, add(cAt(sg), [0, -0.05, 0.15]), 10), fx('prFemN', COL(sg))));
    A(merge([ball(0.07, [-0.12, -0.32, 0.18], 8), ball(0.07, [0.12, -0.42, 0.18], 8),
      tube({ pts: [[-0.55, -0.3, 0.2], [0.35, -0.3, 0.2]], r: 0.018, sides: 4 }), tube({ pts: [[0.55, -0.45, 0.2], [-0.35, -0.45, 0.2]], r: 0.018, sides: 4 })]), fx('prExch', '#1d3b55', { rimColor: '#9fd0ff' })); }
  if (i === iFus) [-1, 1].forEach(sg => A(ball(0.18, add(cAt(sg), [0, -0.1, 0.15]), 12), fx(self ? 'prFusHom' : 'prFusHet', self ? COL(sg) : '#28b8f0')));
  if (i === iSep) [-1, 1].forEach(sg => A(ball(0.18, add(cAt(sg, sep), [0, -0.1, 0.15]), 12), fx('prSep', self ? COL(sg) : '#28b8f0')));
  return L;
}
function conjModelP(self){
  return function(B){
    const ST = self ? PR_SELF_ST : PR_CONJ_ST, n = ST.length, S0 = 0.62, S1 = 0.74;
    /* مواقع الخطوات: صف علوي 1–3 من اليمين، صف ثانٍ، ثم صف البنويات */
    const P = [[3.5, 1.9], [0.6, 1.9], [-2.3, 1.9], [3.5, -0.5]].concat(self ? [[0.6, -0.5]] : [[0.6, -0.5], [-2.3, -0.5]]).concat([[0.6, -2.55]]).map(([x, y]) => [x, y, 0]);
    const steps = ST.map((_, i) => ({ i, at: P[i], objs: paraStep(i, self).map(([m, o]) => ({ m, o: B.add(pxf(m, S0, P[i]), Object.assign({ pop: false, center: P[i] }, o)) })) }));
    /* أسهم بين الخطوات */
    const arrow = (a, b) => { const d = norm([b[0] - a[0], b[1] - a[1], 0]), e = add(b, mul(d, -0.15));
      return merge([tube({ pts: [a, e], r: 0.04, sides: 6 }), place(ellipsoid({ r: [0.1, 0.2, 0.1], rows: 5, cols: 8, disp: q => 1 - 0.85 * Math.max(0, q[1]) }), { at: e, dir: d })]); };
    const arrs = [];
    for (let i = 0; i < n - 1; i++){ const a = P[i], b = P[i + 1]; let p0, p1;
      if (i === n - 2){ p0 = add(a, [0, -0.95, -0.2]); p1 = add(b, [0, 0.55, -0.2]); }
      else if (a[1] === b[1]){ p0 = add(a, [-1.15, 0, -0.2]); p1 = add(b, [1.15, 0, -0.2]); }
      else { p0 = add(a, [0.3, -0.95, -0.2]); p1 = add(b, [-0.3, 0.95, -0.2]); }
      arrs.push({ to: i + 1, o: B.add(arrow(p0, p1), { color: '#9fc4ff', rim: 0.5, pop: false }) }); }
    /* الأسماء عند خطواتها */
    const at = (i, x, y, z) => add(P[i], [x * S0, y * S0, (z || 0) * S0]);
    B.label('prMacN', at(0, 0.6, 0.45, 0.1), [1, 0.5, 0.2]);
    B.label('prMicN', at(0, 0.5, -0.25, 0.2), [1, -0.3, 0.3]);
    B.label('prProtoBr', at(0, 0, 0.3, 0.12), [0, 1, 0.3]);
    B.label('prMeioMic', at(1, 0.5, -0.4, 0.2), [0.3, -1, 0.3]);
    B.label('prUneq', at(2, 0.5, -0.2, 0.2), [0.4, 1, 0.3]);
    B.label('prMaleN', at(2, 0.5, -0.35, 0.2), [0.3, -1, 0.3]);
    B.label('prFemN', at(2, -0.5, -0.05, 0.25), [-1, 0.2, 0.3]);
    B.label('prDegen', at(2, -0.62, -0.7, 0.15), [-1, -0.4, 0.3]);
    if (!self){ B.label('prExch', at(3, 0, -0.3, 0.2), [1, -0.3, 0.3]); B.label('prFusHet', at(4, 0.5, -0.1, 0.3), [0.3, -1, 0.3]); }
    else { B.label('prFusHom', at(3, 0.5, -0.1, 0.3), [1, -0.3, 0.3]); }
    B.label('prSep', at(self ? 4 : 5, 1.1, 0, 0.1), [0.4, -1, 0.2]);
    B.label('prEight', at(n - 1, -2.2, 0, 0.1), [-1, 0, 0.2]);
    steps.forEach(S => B.caption(add(S.at, [0, S.i === n - 1 ? 0.55 : 1.0, 0]), () => [String(S.i + 1)]));
    if (self) B.caption([-2.3, -0.4, 0], () => ['لا يحدث تبادل', 'للأنوية الذكرية']);
    B.caption([0.6, -3.25, 0], () => [(ST[STG.idx] || {}).n || '']);
    let last = -1; const hot = G3.hex('#ffd98a'), cold = G3.hex('#9fc4ff');
    return { dist: 13.2, yaw: 0, pitch: 0.05, target: [0.5, -0.45, 0], live2d: true,
      anim(t){ const s = Math.min(n - 1, STG.idx);
        if (s !== last){ last = s;
          steps.forEach(S => { const sc = S.i === s ? S1 : S0; S.objs.forEach(R => { B.update(R.o, pxf(R.m, sc, S.at)); if (!R.o.shell && R.o.base === undefined) R.o.base = R.o.alpha; if (!R.o.shell) R.o.alpha = S.i <= s ? R.o.base : R.o.base * 0.5; }); });
          arrs.forEach(A => { A.o.col = A.to === s ? hot : cold; }); }
        steps[s].objs.forEach(R => { R.o.glow = 0.45 + 0.4 * Math.sin(t * 4); });
      } };
  };
}

/* ═════════════ 6) الانقسام الثنائي الطولي في اليوغلينا (ص36) ═════════════ */
const euBody = (at, s, w) => place(ellipsoid({ r: [0.36 * s * (w || 1), 1.0 * s, 0.3 * s], rows: 14, cols: 16, disp: d => 1 - 0.35 * Math.max(0, -d[1]) * Math.max(0, -d[1]) }), { at });
function euModel(B){
  const one = (at, s, ph) => ({ chl: merge(Array.from({ length: 9 }, (_, i) => { const a = i * 2.4; return place(ellipsoid({ r: [0.07 * s, 0.14 * s, 0.05 * s], rows: 5, cols: 8 }), { at: add(at, [Math.cos(a) * 0.2 * s, (0.5 - i / 9) * 1.2 * s, Math.sin(a) * 0.15 * s]) }); })),
    eye: ball(0.06 * s, add(at, [0.12 * s, 0.78 * s, 0.18 * s]), 6), flag: flagellum(add(at, [0, 0.98 * s, 0]), [0.25, 1, 0.1], 1.5 * s, ph, 0.03 * s) });
  const body = B.add(euBody([0, 0, 0], 1), fx('prECyto', '#9be27a', { alpha: 0.5, rimColor: '#e8ffd8', shell: { size: 2.0 }, pop: false, center: [0, 0, 0] }));
  const o0 = one([0, 0, 0], 1, 0);
  const chl = B.add(o0.chl, fx('prECyto', '#2f8f3a', { pop: false, center: [0, 0, 0] }));
  const eye = B.add(o0.eye, fx('prECyto', '#e83a3a', { pop: false }));
  const flag = B.add(o0.flag, fx('prEFlag', '#d8f0b0', { pop: false, center: [0, 1, 0] }));
  const flag2 = B.add(flagellum([0.08, 0.98, 0], [-0.35, 1, 0], 1.0, 1, 0.026), fx('prEFlag2', '#f0e090', { pop: false, center: [0, 1, 0] }));
  const nuc = B.add(ball(0.17, [0, -0.1, 0.12], 10), fx('prENuc', '#9b3fd0', { rimColor: '#e8d0ff', pop: false, center: [0, 0, 0] }));
  const nuc2 = B.add(merge([ball(0.14, [-0.12, -0.1, 0.12], 10), ball(0.14, [0.12, -0.1, 0.12], 10)]), fx('prEMit', '#9b3fd0', { rimColor: '#e8d0ff', pop: false, center: [0, 0, 0] }));
  /* انقسام السايتوبلازم طولياً من الأمام إلى الخلف */
  const split = k => merge([-1, 1].map(sg => euBody([sg * 0.22 * (0.4 + k), 0, 0], 1, 0.65)));
  const longO = B.add(split(0), fx('prELong', '#9be27a', { alpha: 0.5, rimColor: '#e8ffd8', shell: { size: 2.0 }, pop: false, center: [0, 0, 0] }));
  const kids = (k, t) => merge([-1, 1].map(sg => { const at = [sg * (0.6 + k * 0.6), Math.sin(t * 2 + sg) * 0.08, 0], o = one(at, 0.8, t * 6 + sg); return merge([euBody(at, 0.8), o.flag]); }));
  const kidsO = B.add(kids(0, 0), fx('prEDaught', '#8fd462', { alpha: 0.6, rimColor: '#e8ffd8', shell: { size: 1.6 }, pop: false, center: [0, 0, 0] }));
  const cyst = B.add(merge([ellipsoid({ r: 0.42, rows: 12, cols: 16 })].map(m => place(m, { at: [1.7, -1.0, 0] }))), fx('prECyst', '#c8e8a0', { alpha: 0.6, rimColor: '#ffffff', shell: { size: 1.0 } }));
  B.add(place(ellipsoid({ r: 0.24, rows: 10, cols: 12 }), { at: [1.7, -1.0, 0] }), fx('prECyst', '#5fae4a'));
  B.label('prEFlag', [0.45, 2.0, 0.1], [1, 0.6, 0], () => STG.idx === 0);
  B.label('prENuc', [0.17, -0.1, 0.2], [1, -0.1, 0.4], () => STG.idx === 0);
  B.label('prECyto', [-0.35, 0.3, 0.1], [-1, 0.2, 0.2], () => STG.idx === 0);
  B.label('prECyst', [2.1, -1.0, 0], [1, -0.3, 0]);
  B.label('prEFlag2', [-0.3, 1.8, 0], [-1, 0.6, 0], () => STG.idx === 1);
  B.label('prEMit', [-0.2, -0.1, 0.2], [-1, -0.2, 0.4], () => STG.idx === 1);
  B.label('prELong', [0.5, 0.2, 0], [1, 0.2, 0.2], () => STG.idx === 2);
  B.label('prEDaught', [1.2, 0.6, 0], [1, 0.4, 0], () => STG.idx === 3);
  B.caption([0, -1.8, 0], () => [(PR_EU_ST[STG.idx] || {}).n || '']);
  return { dist: 7.2, yaw: 0.2, pitch: 0.15, target: [0.3, 0.1, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      body.hide = chl.hide = eye.hide = s >= 2; flag.hide = s >= 2;
      if (s < 2) B.update(flag, one([0, 0, 0], 1, t * 6).flag);
      flag2.hide = s !== 1; if (s === 1) B.update(flag2, flagellum([0.08, 0.98, 0], [-0.35, 1, 0], 0.4 + 0.6 * k, t * 6 + 1, 0.026));
      nuc.hide = s !== 0; nuc2.hide = s !== 1;
      longO.hide = s !== 2; if (s === 2) B.update(longO, split(k));
      kidsO.hide = s !== 3; if (s === 3) B.update(kidsO, kids(k, t));
    } };
}

/* ═════════════ 7) دورة حياة عفن الخبز الأسود (ص37–39) ═════════════ */
function rhizoModel(B){
  /* قطعة الخبز وعليها الهايفات: سلالة (+) يساراً و(−) يميناً، وحوافظ بوغية على حوامل */
  B.add(place(G3.superEll({ h: [2.8, 0.25, 1.4], e: 0.3, rows: 6, cols: 14 }), { at: [0, -1.3, 0] }), fx('prBread', '#c99a5a', { rim: 0.5, rimColor: '#ffe0b0', pat: 2, patColor: '#a87a3a', patK: 6 }));
  const R = srng(37), hy = (x0, x1, seed) => { const r = srng(seed), out = []; for (let i = 0; i < 9; i++){ const a = [x0 + r() * (x1 - x0), -1.02, -1.0 + r() * 2.0], b = add(a, [(r() - 0.5) * 0.9, 0.02, (r() - 0.5) * 0.9]);
    out.push(tube({ pts: spline([a, add(mul(add(a, b), 0.5), [0, 0.08, 0]), b], 4, false), r: 0.025, sides: 5 })); } return merge(out); };
  B.add(hy(-2.6, -0.9, 3), fx('prPlusN', '#e8e8e0', { rimColor: '#ffffff' }));
  B.add(hy(0.9, 2.6, 5), fx('prMinusN', '#d8d8f0', { rimColor: '#ffffff' }));
  B.add(hy(-0.9, 0.9, 7), fx('prHyphae', '#f0eee0', { rimColor: '#ffffff' }));
  const heads = [[-2.1, 0.1], [-1.5, -0.4], [1.6, 0.2], [2.2, -0.3]].map(([x, z]) => ({ x, z }));
  B.add(merge(heads.map(h => tube({ pts: [[h.x, -1.02, h.z], [h.x + 0.05, -0.1, h.z]], r: 0.03, sides: 6 }))), fx('prSpHeads', '#e8e4d0'));
  B.add(merge(heads.map(h => ball(0.17, [h.x + 0.05, -0.02, h.z], 10))), fx('prSpHeads', '#2a2a2a', { rimColor: '#a0a0a0' }));
  /* وسط القطعة: اقتراب هايفتين من سلالتين ← اندماج ← خلية الأمشاج ← زايكوت ← جدار سميك ← حافظة */
  const C = [0, -0.35, 0];
  const tips = k => merge([-1, 1].map(sg => tube({ pts: spline([[sg * 1.0, -1.0, 0], [sg * 0.6, -0.5, 0], [sg * (0.12 + 0.18 * (1 - k)), -0.38, 0]], 6, false), r: 0.06, sides: 7 })));
  const tipO = B.add(tips(0), fx('prHypFuse', '#f4f0e0', { pop: false, center: C }));
  const plasmo = B.add(merge([place(ellipsoid({ r: [0.32, 0.2, 0.2], rows: 10, cols: 14 }), { at: C })]), fx('prPlasmo', '#f4e8c8', { alpha: 0.8, pop: false, center: C }));
  const gam = B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.2, 0.22, 0.2], rows: 10, cols: 12 }), { at: add(C, [sg * 0.21, 0, 0]) }))), fx('prGamCell', '#e8d0a0', { alpha: 0.7, pop: false, center: C }));
  const gamN = B.add(merge(Array.from({ length: 12 }, (_, i) => ball(0.035, add(C, [(i % 2 ? 1 : -1) * (0.12 + R() * 0.15), (R() - 0.5) * 0.25, (R() - 0.5) * 0.2]), 5))), fx('prGamCell', '#4a2a6a', { pop: false, center: C }));
  const zygO = B.add(ball(0.46, C, 14), fx('prZygF', '#d8b070', { alpha: 0.45, shell: { size: 0.9 }, pop: false, center: C }));
  const kary = B.add(merge(Array.from({ length: 6 }, (_, i) => ball(0.075, add(C, [Math.cos(i) * 0.22, Math.sin(i * 1.7) * 0.18, 0.1]), 6))), fx('prKaryo', '#6a2a8a', { pop: false, center: C }));
  const thick = B.add(place(ellipsoid({ r: 0.5, rows: 14, cols: 18 }), { at: C }), fx('prThickW', '#3a3020', { alpha: 0.5, shell: { size: 1.0 }, rimColor: '#e0c890', pop: false, center: C }));
  const warts = B.add(merge(Array.from({ length: 30 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 30), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
    return place(ellipsoid({ r: 0.07, rows: 4, cols: 6 }), { at: add(C, mul(d, 0.52)) }); })), fx('prThickW', '#2a2a2a', { rimColor: '#b0a080', pop: false, center: C }));
  const meio = B.add(merge(TETRA.map(d => ball(0.1, add(C, mul(d, 0.2)), 8))), fx('prMeioF', '#c8a0f0', { pop: false, center: C }));
  const phore = B.add(tube({ pts: [add(C, [0, 0.4, 0]), add(C, [0, 1.6, 0])], r: 0.05, sides: 8 }), fx('prSporangioph', '#e8e4d0', { pop: false, center: C }));
  const spg = B.add(ball(0.32, add(C, [0, 1.85, 0]), 14), fx('prSporang', '#3a3a3a', { rimColor: '#c0c0c0', pop: false, center: C }));
  const spores = k => merge(Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 14), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
    return ball(0.045, add(add(C, [0, 1.85, 0]), mul(d, 0.36 + k * 1.1)), 5); }));
  const spO = B.add(spores(0), fx('prSporesF', '#5a5a5a', { rimColor: '#e0e0e0', pop: false, center: C }));
  const vis = s => () => STG.idx === s;
  B.label('prBread', [2.4, -1.4, 1.1], [1, -0.4, 0.4]);
  B.label('prPlusN', [-2.4, -1.0, 0.6], [-1, 0.2, 0.3]);
  B.label('prMinusN', [2.4, -1.0, 0.6], [1, 0.2, 0.3]);
  B.label('prHyphae', [0.6, -1.0, 0.8], [0.3, -0.3, 1]);
  B.label('prSpHeads', [-2.05, -0.02, 0.1], [-1, 0.5, 0.1]);
  B.label('prHypFuse', add(C, [0.25, -0.05, 0]), [1, 0.3, 0.3], vis(1));
  B.label('prPlasmo', add(C, [0.3, 0.05, 0]), [1, 0.3, 0.3], vis(2));
  B.label('prGamCell', add(C, [0.4, 0, 0]), [1, 0.3, 0.3], vis(3));
  B.label('prZygF', add(C, [0.3, 0.15, 0]), [1, 0.4, 0.3], vis(4));
  B.label('prKaryo', add(C, [-0.15, 0, 0.15]), [-1, 0.3, 0.3], vis(4));
  B.label('prThickW', add(C, [0.42, 0.1, 0]), [1, 0.3, 0.3], vis(5));
  B.label('prMeioF', add(C, [-0.1, 0.1, 0.15]), [-1, 0.4, 0.3], vis(5));
  B.label('prSporangioph', add(C, [0.05, 1.1, 0]), [1, 0.2, 0.2], vis(6));
  B.label('prSporang', add(C, [0.3, 1.95, 0]), [1, 0.5, 0.2], vis(6));
  B.label('prSporesF', add(C, [-0.6, 2.0, 0]), [-1, 0.5, 0.2], vis(6));
  B.caption([0, -1.95, 0], () => [(PR_FUN_ST[STG.idx] || {}).n || '']);
  return { dist: 8.6, yaw: 0.25, pitch: 0.35, target: [0, -0.2, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      tipO.hide = s > 2; if (s <= 1) B.update(tipO, tips(s === 0 ? 0 : k));
      plasmo.hide = s !== 2; gam.hide = gamN.hide = s !== 3;
      zygO.hide = s !== 4; kary.hide = s !== 4; thick.hide = warts.hide = s !== 5; meio.hide = s !== 5;
      phore.hide = spg.hide = spO.hide = s !== 6; if (s === 6) B.update(spO, spores(k));
    } };
}

Object.assign(G3.models, { pr_prChA: chAModel, pr_prChS: chSModel, pr_prPF: pfModel, pr_prPC: conjModelP(false), pr_prPS: conjModelP(true), pr_prEu: euModel, fun_rhizo: rhizoModel });
})();
