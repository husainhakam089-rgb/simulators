
/* ══════════════════════════════════════════════════════════════════════════
   9.1 · مجسّمات الأنسجة المرستيمية: مواقعها في النبات، قمة الجذر بمراحلها،
         الخلية المرستيمية، والمقارنة مع الخلية البالغة
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, sub, mul, norm, rot3, ellipsoid, superEll, capsule, tube, place, merge, spline, srng, computeNormals, mk } = G3;
const { blobDisp } = G3.parts;

/* سطح دوراني حول y من مقطع [نصف قطر، ارتفاع] */
function lathe(prof, cols){
  const m = mk(), R = prof.length, C = cols || 32;
  for (let i = 0; i < R; i++){
    const [r, y] = prof[i];
    for (let j = 0; j < C; j++){
      const a = j / C * 6.2832, p = [r * Math.cos(a), y, r * Math.sin(a)];
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0);
    }
  }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C; j++){
    const a = i * C + j, b = i * C + (j + 1) % C, c = a + C, d = b + C;
    m.i.push(a, b, c, b, d, c);
  }
  return computeNormals(m);
}
/* حلقة (أسطوانة مجوّفة قصيرة) */
const ring = (r0, r1, h, cols) => lathe([[r0, -h / 2], [r1, -h / 2], [r1, h / 2], [r0, h / 2], [r0, -h / 2]], cols || 40);
const disc = (r, h, cols) => lathe([[0.001, -h / 2], [r, -h / 2], [r, h / 2], [0.001, h / 2]], cols || 40);
/* خلية: صندوق بزوايا مدوّرة */
const box = (w, h, d, e) => superEll({ h: [w / 2, h / 2, d / 2], e: e || 0.22, rows: 6, cols: 8 });
/* سهم صغير: عمود + رأس مخروطي، يشير إلى +y */
const arrowMesh = L => merge([place(capsule({ r: 0.022, len: L * 0.7, rows: 3, cols: 8 }), { at: [0, -L * 0.15, 0] }),
  lathe([[0.065, L * 0.18], [0.001, L * 0.5]], 10)]);
const GOLD = '#ffd166';
/* نبض توهّج الأجزاء المرستيمية (بالحافة لأن التوهّج محجوز لاختيار الجزء) */
const pulse = (objs, t, base, amp) => objs.forEach(o => { o.rim = base + amp * (0.5 + 0.5 * Math.sin(t * 2.6)); });

/* ═════════════ 1) مواقع المرستيمات في النبات ═════════════ */
function locModel(B){
  const GY = -0.35;
  /* التربة: لوح شفاف حتى تظهر الجذور */
  B.add(place(superEll({ h: [3.4, 1.0, 1.4], e: 0.12, rows: 10, cols: 24 }), { at: [0.0, GY - 1.0, 0] }),
    { color: '#7a5634', alpha: 0.14, rim: 0.25, rimColor: '#c8a774', pat: 2, patColor: '#3a2716', patK: 6, shell: { size: 9 }, pop: false });
  B.add(place(superEll({ h: [3.4, 0.012, 1.4], e: 0.12, rows: 4, cols: 24 }), { at: [0.0, GY, 0] }),
    { color: '#a88a5c', alpha: 0.35, rim: 0.3, rimColor: '#e8d2a4', shell: { size: 9.1 }, pop: false });
  /* نبات ذو فلقتين */
  const SX = 0.15, TOP = 2.55;
  const stemPts = spline([[SX, GY, 0], [SX + 0.03, 0.6, 0.02], [SX - 0.02, 1.6, -0.02], [SX, TOP, 0]], 6, false);
  B.add(tube({ pts: stemPts, r: u => 0.075 - u * 0.03, sides: 12 }), { color: '#7fb55a', rim: 0.5, rimColor: '#e3ffd0', pat: 1, patColor: '#5b8f3e', patK: 30, pop: false });
  const leafM = (L, W) => ellipsoid({ r: [L / 2, 0.018, W / 2], rows: 8, cols: 18, warp: p => [p[0], p[1] + p[0] * p[0] * 0.18 - Math.abs(p[2]) * 0.2, p[2]] });
  const leaves = [], axBuds = [];
  [[0.55, 0.0, 0.62], [1.25, 1.57, 0.52], [1.9, 0.0, 0.42]].forEach(([y, a, L]) => {
    [0, Math.PI].forEach(s => {
      const ang = a + s, dir = [Math.cos(ang), 0, Math.sin(ang)];
      leaves.push(place(leafM(L, L * 0.42), { R: rot3(1.05, -ang, 0.3), at: add([SX, y + 0.08, 0], mul(dir, L / 2 + 0.05)) }));
      axBuds.push(place(ellipsoid({ r: [0.035, 0.06, 0.035], rows: 6, cols: 10 }), { at: add([SX, y + 0.07, 0], mul(dir, 0.09)) }));
    });
  });
  B.add(merge(leaves), { color: '#5fae4f', rim: 0.55, rimColor: '#dcffc8', pat: 3, patK: 9, pop: false });
  const bud = B.add(merge([place(ellipsoid({ r: [0.1, 0.17, 0.1], rows: 10, cols: 16 }), { at: [SX, TOP + 0.1, 0] })].concat(axBuds)),
    { part: 'apicalShoot', color: '#b5e38c', rim: 0.8, rimColor: GOLD });
  /* الجذور وقممها */
  const roots = [], tips = [];
  const rootTo = (pts, r) => { const sp = spline(pts, 5, false); roots.push(tube({ pts: sp, r: u => r * (1 - u * 0.6), sides: 8 }));
    const e = sp[sp.length - 1], d = norm(sub(e, sp[sp.length - 2])); tips.push(place(ellipsoid({ r: [r * 0.7, r * 1.6, r * 0.7], rows: 6, cols: 10 }), { at: add(e, mul(d, r * 0.6)), dir: d })); };
  rootTo([[SX, GY, 0], [SX + 0.05, -0.9, 0], [SX - 0.04, -1.5, 0.02], [SX, -2.05, 0]], 0.07);
  [[-0.6, 0.3, 0.6], [-0.85, -0.5, 0.55], [-1.2, 0.2, -0.6], [-1.45, -0.4, -0.45]].forEach(([y, dx, dz]) =>
    rootTo([[SX, y, 0], [SX + dx * 0.5, y - 0.12, dz * 0.5], [SX + dx, y - 0.35, dz]], 0.035));
  B.add(merge(roots), { color: '#d9c39b', rim: 0.45, rimColor: '#fff3d8', pop: false });
  const tipO = B.add(merge(tips), { part: 'apicalRoot', color: '#e6c48a', rim: 0.8, rimColor: GOLD });

  /* نبات عشبي (فلقة واحدة): سلاميات وعقد وفوق كل عقدة مرستيم بيني */
  const GX = -1.75, gNodes = [0.25, 0.9, 1.5, 2.05], GTOP = 2.45;
  B.add(tube({ pts: [[GX, GY, 0], [GX, GTOP, 0]], r: 0.055, sides: 12 }), { color: '#a9cf73', rim: 0.5, rimColor: '#f1ffd8', pat: 1, patColor: '#86ad55', patK: 50, pop: false });
  B.add(merge(gNodes.map(y => place(ellipsoid({ r: [0.075, 0.035, 0.075], rows: 6, cols: 14 }), { at: [GX, y, 0] }))), { color: '#7da55a', rim: 0.5, rimColor: '#e8f8d0', pop: false });
  const blades = gNodes.map((y, i) => { const s = i % 2 ? 1 : -1, a = i * 1.9;
    const pts = [[GX, y, 0], [GX + s * 0.25 * Math.cos(a), y + 0.45, 0.25 * Math.sin(a)], [GX + s * 0.55 * Math.cos(a), y + 0.7, 0.55 * Math.sin(a)]];
    return tube({ pts: spline(pts, 5, false), r: u => 0.03 * (1 - u * 0.85), sides: 5 }); });
  B.add(merge(blades), { color: '#6db65a', rim: 0.5, rimColor: '#dcffc8', pop: false });
  const inter = B.add(merge(gNodes.map(y => place(lathe([[0.062, 0], [0.068, 0.04], [0.068, 0.13], [0.062, 0.17]], 18), { at: [GX, y + 0.03, 0] }))),
    { part: 'intercal', color: '#f2c45a', rim: 0.8, rimColor: GOLD });

  /* مقطع عرضي مكبّر في ساق خشبية: الحلقات من الخارج للداخل */
  const CX = [1.75, 1.35, 0.1], R = 0.78, rotX = Math.PI / 2;
  const P = m => place(m, { R: rot3(rotX, 0, 0), at: CX });
  B.add(P(ring(R - 0.04, R, 0.16, 48)), { color: '#6b4a2c', rim: 0.5, rimColor: '#e0c08a', pop: false });
  const cork = B.add(P(ring(R - 0.1, R - 0.045, 0.2, 48)), { part: 'corkCamb', color: '#ffb35c', rim: 0.8, rimColor: GOLD });
  B.add(P(ring(0.52, R - 0.1, 0.15, 48)), { color: '#5e8d4f', rim: 0.4, rimColor: '#cfeec0', pat: 3, patK: 14, pop: false });
  B.add(P(ring(0.47, 0.52, 0.15, 48)), { color: '#9fc46d', rim: 0.4, rimColor: '#e6ffd0', pop: false });
  const vasc = B.add(P(ring(0.42, 0.47, 0.21, 48)), { part: 'vascCamb', color: '#ffd98a', rim: 0.8, rimColor: GOLD });
  B.add(P(ring(0.2, 0.42, 0.15, 48)), { color: '#d8b878', rim: 0.35, rimColor: '#fff0c8', pat: 1, patColor: '#8a6a3a', patK: 40, pop: false });
  B.add(P(disc(0.2, 0.15, 32)), { color: '#b9d6a0', rim: 0.35, rimColor: '#ffffff', pop: false });
  /* خط التكبير من الساق إلى المقطع */
  B.add(tube({ pts: [[SX + 0.08, 1.35, 0], add(CX, [-R * 0.9, 0, 0])], r: 0.008, sides: 4 }), { color: '#e9d9b0', alpha: 0.5, rim: 0.3, pop: false });

  /* أسهم اتجاه النمو */
  const AR = arrowMesh(0.42);
  const arrows = [
    { at: [SX, TOP + 0.55, 0], dir: [0, 1, 0] }, { at: [SX, -2.45, 0], dir: [0, -1, 0] }
  ].concat(gNodes.map(y => ({ at: [GX + 0.22, y + 0.12, 0], dir: [0, 1, 0], s: 0.6 })))
   .concat([0, 1, 2, 3].map(i => { const a = i * 1.5708 + 0.785, d = [Math.cos(a), Math.sin(a), 0]; return { at: add(CX, mul(d, R + 0.28)), dir: d, s: 0.7 }; }));
  const arrO = B.add(merge(arrows.map(a => place(AR, { dir: a.dir, at: a.at, s: a.s || 1 }))), { color: '#ffe08a', rim: 0.9, rimColor: '#fff5cc', pop: false, center: [0, 0, 0] });

  B.label('apicalShoot', [SX, TOP + 0.2, 0], [0, 1, 0.3]);
  B.label('apicalRoot', [SX, -2.12, 0], [0, -1, 0.3]);
  B.label('intercal', [GX, 1.62, 0.07], [0, 0, 1]);
  B.label('corkCamb', add(CX, [R * 0.66, R * 0.66, 0.1]), [0, 0, 1]);
  B.label('vascCamb', add(CX, [-0.45, -0.05, 0.1]), [0, 0, 1]);
  /* على الشاشة الضيقة تتزاحم العناوين؛ يكفي عنوان المقطع */
  B.caption([GX, GY - 0.25, 0.9], () => window.innerWidth < 600 ? [] : ['', 'نبات عشبي (فلقة واحدة)']);
  B.caption([SX, GY - 0.25, 1.1], () => window.innerWidth < 600 ? [] : ['', 'نبات ذو فلقتين']);
  B.caption(add(CX, [0, -R - 0.25, 0]), () => ['', 'مقطع عرضي في ساق خشبية (مكبّر)']);
  const mers = [bud, tipO, inter, cork, vasc];
  return {
    dist: 9.2, yaw: 0.25, pitch: 0.12, target: [0.05, 0.3, 0], live2d: true,
    anim(t){
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null;
      mers.forEach(o => { o.rim = !f || o.part === f ? 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(t * 2.6)) : 0.3; });
      const b = Math.abs(Math.sin(t * 3)) * 0.12;
      B.update(arrO, merge(arrows.map(a => place(AR, { dir: a.dir, at: add(a.at, mul(a.dir, b)), s: a.s || 1 }))));
    }
  };
}

/* ═════════════ 2) المرستيمي الجانبي: الكمبيوم الوعائي والفليني والتثخن ═════════════ */
/* قطعة من ساق: حلقات متحدة المركز تكبر مع المراحل (نفس أنصاف أقطار المسطّح ÷ 100) */
function secModel(B){
  /* كل حلقة قرص مصمت، والأقراص الداخلية أعلى قليلاً حتى يظهر سطح كل حلقة من الأعلى */
  const H = 0.8, U = v => v / 100, EPS = 0.03, top = lv => (H + lv * EPS) / 2;
  /* مقطع الدوران معكوس الاتجاه حتى تتجه الأوجه للخارج (فيُرى السطح العلوي والجدار القريب) */
  const discO = (r, h) => lathe([[0.001, h / 2], [r, h / 2], [r, -h / 2], [0.001, -h / 2]], 56);
  const ringO = (a, b, h) => lathe([[a, -h / 2], [a, h / 2], [b, h / 2], [b, -h / 2], [a, -h / 2]], 56);
  const dsk = (r, lv) => discO(U(r), H + lv * EPS);
  const r0 = merSecRings(0, 0);
  const peO = B.add(dsk(r0.re, 0), { part: 'periEpi', color: '#8a5a34', rim: 0.6, rimColor: '#e8c49a' });
  const kcO = B.add(dsk(r0.rk + 5, 1), { part: 'corkCamb', color: '#ffb35c', rim: 1, rimColor: '#ffe2b8' });
  const cxO = B.add(dsk(r0.rk - 5, 2), { color: '#6e9c58', rim: 0.4, rimColor: '#d6f2c0', pop: false });
  const phO = B.add(dsk(r0.rp, 3), { part: 'secPhl', color: '#a7c46a', rim: 0.5, rimColor: '#eaffd0' });
  const vcO = B.add(dsk(r0.rc + 6, 4), { part: 'vascCamb', color: GOLD, rim: 1, rimColor: '#fff3c4' });
  const xylO = B.add(dsk(r0.rx - 4, 5), { part: 'secXyl', color: '#d8b878', rim: 0.5, rimColor: '#fff0c8' });
  const gr = B.add(discO(0.01, 0.01), { color: '#8a6a3a', rim: 0.2, rimColor: '#c9a86a', pop: false, center: [0, 0, 0] });
  B.add(dsk(r0.pith, 7), { color: '#c9dcae', rim: 0.5, rimColor: '#f4fbe8', pop: false });
  const L = { secXyl: [0, 0, 0], vascCamb: [0, 0, 0], secPhl: [0, 0, 0], corkCamb: [0, 0, 0], periEpi: [0, 0, 0] };
  const ANG = { secXyl: 200, vascCamb: 300, secPhl: 330, corkCamb: 5, periEpi: 35 }, LV = { secXyl: 5, vascCamb: 4, secPhl: 3, corkCamb: 1, periEpi: 0 };
  const put = (id, rad) => { const q = ANG[id] * Math.PI / 180, d = L[id]; d[0] = Math.cos(q) * U(rad); d[1] = top(LV[id]) + 0.01; d[2] = Math.sin(q) * U(rad); };
  let lastKey = '';
  const update = () => {
    const { g, pe } = merSecGrowth(), r = merSecRings(g, pe), key = g.toFixed(3) + pe.toFixed(3);
    if (key === lastKey) return; lastKey = key;
    B.update(peO, dsk(Math.max(r.re, r.rk + 5.5), 0)); B.update(kcO, dsk(r.rk + 5, 1)); B.update(cxO, dsk(r.rk - 5, 2));
    B.update(phO, dsk(r.rp, 3)); B.update(vcO, dsk(r.rc + 6, 4)); B.update(xylO, dsk(r.rx - 4, 5));
    const rings = []; for (let q = 50; q < r.rx - 8; q += 14) rings.push(place(ringO(U(q) - 0.006, U(q) + 0.006, 0.01), { at: [0, top(6), 0] }));
    gr.hide = !rings.length; if (rings.length) B.update(gr, merge(rings));
    put('secXyl', (r.pith + r.rx) / 2); put('vascCamb', r.rc - 0.5); put('secPhl', (r.rc + 5 + r.rp) / 2); put('corkCamb', r.rk); put('periEpi', (r.rk + 4 + r.re) / 2);
    peO.thin = peO.hide = r.re - r.rk - 4 < 3;
  };
  update();
  Object.keys(L).forEach(id => B.label(id, L[id], [0, 1, 0], id === 'periEpi' ? () => !peO.thin : undefined));
  return {
    dist: 7.2, yaw: 0.15, pitch: 0.8, live2d: true, noSpin: true, minDist: 3,
    camGoal: () => MER_SEC_STAGES[STG.idx] && MER_SEC_STAGES[STG.idx].cam,
    anim(t){
      update();
      const f = typeof focusOwner !== 'undefined' ? focusOwner : null, st = STG.idx;
      vcO.rim = (!f || f === 'vascCamb') && (st === 1 || st === 3) ? 0.7 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.6;
      kcO.rim = (!f || f === 'corkCamb') && st >= 2 ? 0.7 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.6;
    }
  };
}

Object.assign(G3.models, { mer_loc: locModel, mer_sec: secModel });
})();
