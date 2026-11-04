
/* ══════════════════════════════════════════════════════════════════════════
   9.5 · مجسّمات الزهرة — تركيب الزهرة، المدقة والسداة والبرعم، المتك وتكوين
         حبوب اللقاح، البويض وتكوين الكيس الجنيني (ملزمة ص53–67) بنفس أجزاء
         الرسوم المسطّحة. «دورة الحياة» مخطط دائري فيبقى مسطّحاً.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.8, rimColor: '#ffffff' }, extra || {});
const sm = k => k * k * (3 - 2 * k);
const ball = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
const C = FLC;
/* بتلة/سبلة: لوح بيضوي رقيق مقعّر يخرج من القاعدة باتجاه الزاوية a */
const blade = (base, a, rise, len, w, curl) => { const d = norm([Math.cos(a), rise, Math.sin(a)]);
  return place(ellipsoid({ r: [w, len, 0.035], rows: 8, cols: 14, disp: q => 1 + (curl || 0.25) * q[0] * q[0] }), { at: add(base, mul(d, len * 0.92)), dir: d }); };
/* حبة لقاح: كرة بنتوءات */
const pollenGrain = (at, r) => merge([ball(r, at, 8)].concat(Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 14), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)];
  return tube({ pts: [add(at, mul(d, r * 0.9)), add(at, mul(d, r * 1.35))], r: q => r * 0.14 * (1 - q), sides: 4 }); })));

/* ═════════════ 1) تركيب الزهرة (ص53–56): مقطوع منها الجزء الأمامي ليظهر داخلها ═════════════ */
function structModel(B){
  const R = [0, -0.9, 0];
  B.add(tube({ pts: [[0, -2.6, 0], [0.05, -1.8, 0], R], r: 0.11, sides: 10 }), { color: '#4f9e3a', rim: 0.5, rimColor: '#c8ffb0' });
  B.add(place(ellipsoid({ r: [0.42, 0.2, 0.42], rows: 10, cols: 16 }), { at: R }), fx('flReceptacle', '#5fae3a', { rimColor: '#d8ffc0' }));
  /* الكأس والتويج: خمس سبلات وخمس بتلات، تُحذف الأمامية (مقطع) */
  const front = a => Math.sin(a) > 0.75;
  const SA = [0, 1, 2, 3, 4].map(i => Math.PI / 2 + i * 1.2566 + 0.63), PA = [0, 1, 2, 3, 4].map(i => Math.PI / 2 + i * 1.2566);
  B.add(merge(SA.filter(a => !front(a)).map(a => blade(add(R, [0, 0.05, 0]), a, -0.15, 0.55, 0.22, 0.2))), fx('flCalyx', C.sep, { rimColor: C.sepL }));
  B.add(merge(PA.filter(a => !front(a)).map(a => blade(add(R, [0, 0.12, 0]), a, 0.75, 1.15, 0.55, 0.45))), fx('flCorolla', C.pet, { rimColor: C.petL, alpha: 0.85, shell: { size: 3 } }));
  /* الأسدية: خيوط ومتوك حول المدقة؛ سداة واحدة كاملة (خيط + متك) مميزة */
  const ST = Array.from({ length: 8 }, (_, i) => Math.PI / 2 + i * 0.785 + 0.39).filter(a => !front(a) || Math.cos(a) > 0.3);
  const fil = a => tube({ pts: spline([add(R, [Math.cos(a) * 0.18, 0.15, Math.sin(a) * 0.18]), add(R, [Math.cos(a) * 0.38, 0.8, Math.sin(a) * 0.38]), add(R, [Math.cos(a) * 0.5, 1.35, Math.sin(a) * 0.5])], 5, false), r: 0.022, sides: 5 });
  const anth = a => place(ellipsoid({ r: [0.07, 0.14, 0.07], rows: 8, cols: 10 }), { at: add(R, [Math.cos(a) * 0.52, 1.48, Math.sin(a) * 0.52]) });
  const one = ST[ST.length - 1], rest = ST.slice(0, -1);
  B.add(merge(rest.map(fil)), fx('flFilament', C.fil, { rimColor: '#ffffe0' }));
  B.add(merge(rest.map(anth)), fx('flAnther', C.anth, { rimColor: '#fff0b0' }));
  B.add(merge([fil(one), anth(one)]), fx('flStamen', '#e8d060', { rimColor: '#ffffd0' }));
  /* المدقة: مبيض (شفاف ليظهر البويض)، قلم، ميسم */
  const OV = add(R, [0, 0.55, 0]);
  B.add(place(capsule({ r: 0.45, len: 1.7, rows: 6, cols: 14 }), { at: add(R, [0, 1.25, 0]) }), fx('flPistil', C.pisL, { alpha: 0.2, shell: { size: 1.2 }, rimColor: '#e8ffd8' }));
  B.add(place(ellipsoid({ r: [0.38, 0.5, 0.38], rows: 14, cols: 18 }), { at: OV }), fx('flOvary', C.pisD, { alpha: 0.45, shell: { size: 0.8 }, rimColor: C.pisL }));
  B.add(merge([[0.1, 0.12], [-0.1, 0.12], [0.1, -0.12], [-0.1, -0.12], [0, 0]].map(([dy, dx], i) => ball(0.055, add(OV, [dx, dy * 1.6, 0.08 * (i % 2 ? 1 : -1)]), 8))), fx('flOvule', C.ovl, { rimColor: '#ffffff' }));
  B.add(tube({ pts: [add(OV, [0, 0.4, 0]), add(OV, [0, 1.3, 0])], r: 0.05, sides: 8 }), fx('flStyle', C.pis, { rimColor: C.pisL }));
  B.add(merge([0, 1, 2].map(i => { const a = i * 2.094; return place(ellipsoid({ r: [0.09, 0.14, 0.07], rows: 6, cols: 10 }), { at: add(OV, [Math.cos(a) * 0.1, 1.38, Math.sin(a) * 0.1]), dir: [Math.cos(a), 1, Math.sin(a)] }); })), fx('flStigma', '#9be27a', { rimColor: '#e8ffd8' }));
  B.label('flStigma', add(OV, [0.1, 1.45, 0]), [1, 0.7, 0]);
  B.label('flStyle', add(OV, [-0.05, 0.95, 0]), [-1, 0.3, 0]);
  B.label('flOvary', add(OV, [0.3, 0, 0]), [1, -0.1, 0.3]);
  B.label('flOvule', add(OV, [-0.1, -0.15, 0.1]), [-1, -0.2, 0.4]);
  B.label('flPistil', add(R, [0.2, 1.8, 0]), [1, 0.3, 0.2]);
  B.label('flAnther', add(R, [Math.cos(rest[0]) * 0.52, 1.5, Math.sin(rest[0]) * 0.52]), [-1, 0.5, -0.3]);
  B.label('flFilament', add(R, [Math.cos(rest[1]) * 0.4, 0.8, Math.sin(rest[1]) * 0.4]), [-1, 0.2, -0.3]);
  B.label('flStamen', add(R, [Math.cos(one) * 0.5, 1.4, Math.sin(one) * 0.5]), [1, 0.4, 0.4]);
  B.label('flCorolla', add(R, [Math.cos(PA[2]) * 1.2, 1.3, Math.sin(PA[2]) * 1.2]), [-1, 0.6, -0.2]);
  B.label('flCalyx', add(R, [Math.cos(SA[3]) * 0.75, -0.05, Math.sin(SA[3]) * 0.75]), [1, -0.6, 0]);
  B.label('flReceptacle', add(R, [0.4, -0.05, 0.1]), [1, -0.3, 0.2]);
  B.caption([0, -2.8, 0], () => ['زهرة كاملة مقطوع جزؤها الأمامي', 'الأجزاء الأساسية: الأسدية والمدقة · غير الأساسية: الكأس والتويج']);
  return { dist: 8.2, yaw: 0.25, pitch: 0.3, target: [0, -0.1, 0] };
}

/* ═════════════ 2) المدقة والسداة والبرعم الزهري (ص53–57) ═════════════ */
function partsModel(B){
  /* المدقة كبيرة على اليسار: مبيض شفاف وبداخله البويضات معلقة بالحبل السري */
  const P = [-1.7, -1.4, 0], OV = add(P, [0, 0.75, 0]);
  B.add(place(capsule({ r: 0.55, len: 3.0, rows: 6, cols: 16 }), { at: add(P, [0, 1.6, 0]) }), fx('flPistil', C.pisL, { alpha: 0.18, shell: { size: 3 } }));
  B.add(place(ellipsoid({ r: [0.5, 0.75, 0.42], rows: 16, cols: 20 }), { at: OV }), fx('flOvary', C.pisD, { alpha: 0.4, shell: { size: 1.6 }, rimColor: C.pisL }));
  const OVL = [[0.18, 0.35], [-0.18, 0.35], [0.18, 0], [-0.18, 0], [0.18, -0.35], [-0.18, -0.35]];
  B.add(merge(OVL.map(([x, y]) => ball(0.11, add(OV, [x * 1.4, y, 0.05]), 10))), fx('flOvule', C.ovl));
  B.add(merge(OVL.map(([x, y]) => tube({ pts: [add(OV, [0, y, 0.05]), add(OV, [x * 1.4, y, 0.05])], r: 0.025, sides: 5 }))), fx('flFunicle', '#c8f0a0'));
  B.add(tube({ pts: [add(OV, [0, 0.7, 0]), add(OV, [0.02, 2.2, 0])], r: 0.09, sides: 10 }), fx('flStyle', C.pis));
  B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.16, 0.24, 0.12], rows: 8, cols: 12 }), { at: add(OV, [sg * 0.13, 2.38, 0]), dir: [sg * 0.8, 1, 0] }))), fx('flStigma', '#9be27a'));
  /* السداة في الوسط: خيط ومتك */
  const S = [0.1, -1.4, 0];
  B.add(place(capsule({ r: 0.35, len: 3.1, rows: 6, cols: 16 }), { at: add(S, [0, 1.65, 0]) }), fx('flStamen', '#f0e0a0', { alpha: 0.16, shell: { size: 3 } }));
  B.add(tube({ pts: spline([S, add(S, [0.12, 1.2, 0]), add(S, [0, 2.4, 0])], 6, false), r: 0.06, sides: 8 }), fx('flFilament', '#f0a640'));
  B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.13, 0.42, 0.13], rows: 10, cols: 12 }), { at: add(S, [sg * 0.12, 2.75, 0]) }))), fx('flAnther', C.anth, { rimColor: '#fff0b0' }));
  /* حبوب اللقاح على اليمين في الأعلى */
  const PG = [1.9, 1.0, 0];
  B.add(merge([[0, 0], [0.45, -0.35], [-0.3, -0.5]].map(([x, y]) => pollenGrain(add(PG, [x, y, 0]), 0.2))), fx('flPollenGrains', C.pollen, { rimColor: '#fff0c0' }));
  /* فرع خضري وبرعم زهري على اليمين في الأسفل */
  const SH = [1.9, -1.6, 0];
  B.add(merge([tube({ pts: [SH, add(SH, [0, 1.3, 0])], r: 0.05, sides: 8 })].concat([[0.3, 0.35], [-0.3, 0.6], [0.3, 0.85]].map(([dx, y]) => blade(add(SH, [0, y, 0]), dx > 0 ? 0 : Math.PI, 0.3, 0.28, 0.1, 0.15)))),
    fx('flShoot', '#5fae3a'));
  const BU = add(SH, [0.9, 0.4, 0.2]);
  B.add(tube({ pts: [add(SH, [0, 0.2, 0]), add(BU, [-0.05, -0.25, 0])], r: 0.04, sides: 6 }), fx('flShoot', '#5fae3a'));
  B.add(place(ellipsoid({ r: [0.16, 0.3, 0.16], rows: 10, cols: 14 }), { at: add(BU, [0, 0.12, 0]) }), fx('flFlowerBud', '#f59ab0', { rimColor: '#ffe0e8' }));
  B.add(merge([0, 1, 2, 3, 4].map(i => blade(add(BU, [0, -0.12, 0]), i * 1.2566, 1.6, 0.17, 0.08, 0.3))), fx('flCalyx', C.sep));
  B.label('flStigma', add(OV, [0.15, 2.45, 0]), [1, 0.6, 0]);
  B.label('flStyle', add(OV, [-0.09, 1.5, 0]), [-1, 0.2, 0]);
  B.label('flOvary', add(OV, [-0.5, 0.1, 0]), [-1, 0, 0.2]);
  B.label('flOvule', add(OV, [-0.25, -0.35, 0.1]), [-1, -0.3, 0.3]);
  B.label('flFunicle', add(OV, [0.12, 0, 0.1]), [1, 0.2, 0.4]);
  B.label('flPistil', add(P, [0.5, 0.05, 0]), [-0.5, -1, 0.2]);
  B.label('flAnther', add(S, [0.25, 2.9, 0]), [1, 0.6, 0]);
  B.label('flFilament', add(S, [0.1, 1.2, 0]), [1, 0.1, 0.2]);
  B.label('flStamen', add(S, [-0.35, 0.3, 0]), [-1, -0.4, 0.2]);
  B.label('flPollenGrains', add(PG, [0.2, 0.15, 0]), [1, 0.5, 0]);
  B.label('flShoot', add(SH, [-0.05, 0.4, 0]), [-1, 0, 0.2]);
  B.label('flFlowerBud', add(BU, [0.15, 0.3, 0]), [1, 0.5, 0.2]);
  B.label('flCalyx', add(BU, [0.15, -0.1, 0.1]), [1, -0.4, 0.3]);
  B.caption([0, -2.1, 0], () => ['المدقة (الجزء الأنثوي) · السداة (الجزء الذكري) · البرعم الزهري على فرع خضري']);
  return { dist: 9.6, yaw: 0.2, pitch: 0.15, target: [0, 0.1, 0] };
}

/* ═════════════ 3) المتك وتكوين حبوب اللقاح (ص59–61) — يتبع المرحلة ═════════════ */
function pollenModel(B){
  /* سداة صغيرة على اليسار، ومقطع عرضي في المتك بالوسط: أربعة فصوص (أكياس لقاح) حول نسيج رابط */
  const MS = [-2.6, -0.6, 0];
  B.add(tube({ pts: [MS, add(MS, [0.05, 1.3, 0])], r: 0.04, sides: 6 }), fx('flFilament', '#f0a640'));
  B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.09, 0.3, 0.09], rows: 8, cols: 10 }), { at: add(MS, [sg * 0.08 + 0.05, 1.6, 0]) }))), fx('flAnther', C.anth));
  const AC = [-0.4, 0, 0], H = 0.9, LB = [[-0.55, 0.32], [-0.55, -0.32], [0.55, 0.32], [0.55, -0.32]];
  const cyl = (c, r, h) => place(capsule({ r, len: h, rows: 4, cols: 16 }), { at: c });
  B.add(merge(LB.map(([x, z]) => cyl(add(AC, [x, 0, z]), 0.4, H))), fx('flLobe', '#7cc95a', { alpha: 0.35, shell: { size: 1.2 }, rimColor: '#d8ffc0' }));
  B.add(place(capsule({ r: 0.32, len: H, rows: 4, cols: 16 }), { at: AC }), fx('flConnective', '#6aae4a', { rimColor: '#d8ffc0' }));
  B.add(place(capsule({ r: 0.1, len: H + 0.05, rows: 4, cols: 12 }), { at: add(AC, [0, 0, 0.3]) }), fx('flVascular', '#2f6aa0', { rimColor: '#c0e0ff' }));
  const sacs = B.add(merge(LB.map(([x, z]) => cyl(add(AC, [x * 1.05, 0, z * 1.05]), 0.26, H - 0.1))), fx('flPollenSac', '#e8a040', { alpha: 0.6, shell: { size: 0.6 }, rimColor: '#ffe0a0', pop: false, center: AC }));
  const sacCells = B.add(merge(LB.flatMap(([x, z], j) => Array.from({ length: 6 }, (_, i) => ball(0.07, add(AC, [x * 1.05 + Math.cos(i) * 0.12, (i / 5 - 0.5) * 0.6, z * 1.05 + Math.sin(i) * 0.12]), 6)))), fx('flPollenSac', '#d05a2a', { pop: false, center: AC }));
  const slit = B.add(merge([-1, 1].map(sg => tube({ pts: [add(AC, [sg * 0.62, -H / 2, 0]), add(AC, [sg * 0.62, H / 2, 0])], r: 0.04, sides: 5 }))), fx('flSlit', '#3a2a10', { pop: false, center: AC }));
  const release = k => merge(Array.from({ length: 12 }, (_, i) => { const sg = i % 2 ? 1 : -1; return pollenGrain(add(AC, [sg * (0.7 + k * 0.9), (i / 11 - 0.5) * 1.2 + k * 0.4, Math.sin(i) * 0.4 * k]), 0.07); }));
  const relO = B.add(release(0), fx('flPollenGrains', C.pollen, { pop: false, center: AC }));
  /* تكوين حبة اللقاح، خلية مكبّرة على اليمين */
  const D = [2.2, 0.1, 0];
  const mother = B.add(ball(0.42, D, 14), fx('flMicroMother', '#e0362c', { alpha: 0.75, rimColor: '#ffc0b0', pop: false, center: D }));
  const motherN = B.add(ball(0.16, D, 10), fx('flMicroMother', '#7a1010', { pop: false, center: D }));
  const tet = sp => merge([[0.6, 0.45, 0.4], [-0.6, 0.45, -0.4], [0.5, -0.5, -0.55], [-0.5, -0.5, 0.55]].map(d => ball(0.21, add(D, mul(norm(d), 0.22 + sp)), 10)));
  const tetO = B.add(tet(0), fx('flMicrospores', '#f2a050', { rimColor: '#ffe0b0', pop: false, center: D }));
  const pol = B.add(pollenGrain(D, 0.45), fx('flPollenWall', '#f0b040', { alpha: 0.5, shell: { size: 1.0 }, rimColor: '#fff0c0', pop: false, center: D }));
  const polIn = B.add(ball(0.36, D, 14), fx('flPollen', '#ffe0a0', { alpha: 0.6, shell: { size: 0.7 }, pop: false, center: D }));
  const gen = B.add(place(ellipsoid({ r: [0.12, 0.08, 0.08], rows: 8, cols: 10 }), { at: add(D, [0.1, 0.1, 0.12]) }), fx('flGenCell', '#4a8a3a', { pop: false, center: D }));
  const tubeN = B.add(ball(0.11, add(D, [-0.12, -0.08, 0.1]), 10), fx('flTubeCell', '#7a3ab0', { pop: false, center: D }));
  const pores = B.add(merge([[1, 0, 0], [-0.5, 0, 0.87], [-0.5, 0, -0.87]].map(d => place(ellipsoid({ r: [0.04, 0.1, 0.1], rows: 6, cols: 8 }), { at: add(D, mul(d, 0.46)), dir: d }))), fx('flGermPore', '#8a5010', { pop: false, center: D }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('flAnther', add(MS, [0.15, 1.75, 0]), [1, 0.6, 0]);
  B.label('flFilament', add(MS, [0.05, 0.6, 0]), [-1, 0, 0]);
  B.label('flLobe', add(AC, [-0.95, 0.3, 0.32]), [-1, 0.4, 0.2]);
  B.label('flPollenSac', add(AC, [-0.6, 0.48, -0.32]), [-0.4, 1, -0.2], vis(0, 1, 2, 3));
  B.label('flConnective', add(AC, [0.2, 0.45, -0.2]), [0.3, 1, -0.4]);
  B.label('flVascular', add(AC, [0, 0.48, 0.32]), [0.2, 1, 0.6]);
  B.label('flSlit', add(AC, [0.65, 0, 0]), [1, -0.2, 0.3], vis(4));
  B.label('flPollenGrains', add(AC, [1.4, 0.4, 0]), [1, 0.5, 0.2], vis(4));
  B.label('flMicroMother', add(D, [0.42, 0.1, 0]), [1, 0.3, 0], vis(0, 1));
  B.label('flMicrospores', add(D, [0.4, 0.2, 0.3]), [1, 0.3, 0.3], vis(1, 2));
  B.label('flPollen', add(D, [0, 0.36, 0]), [0, 1, 0.2], vis(3, 4));
  B.label('flPollenWall', add(D, [0.45, -0.2, 0]), [1, -0.3, 0], vis(3, 4));
  B.label('flGenCell', add(D, [0.15, 0.12, 0.18]), [1, 0.4, 0.5], vis(3, 4));
  B.label('flTubeCell', add(D, [-0.15, -0.1, 0.18]), [-1, -0.3, 0.5], vis(3, 4));
  B.label('flGermPore', add(D, [0.48, 0, 0]), [1, 0, 0.2], vis(3, 4));
  B.caption([0, -1.6, 0], () => [(FL_POLLEN_STAGES[STG.idx] || {}).n || '']);
  return { dist: 8.8, yaw: 0.25, pitch: 0.45, target: [0, 0, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      mother.hide = motherN.hide = !(s === 0 || (s === 1 && k < 0.4));
      tetO.hide = !((s === 1 && k >= 0.4) || s === 2); if (!tetO.hide) B.update(tetO, tet(s === 2 ? 0.25 * k : 0));
      [pol, polIn, gen, tubeN, pores].forEach(o => o.hide = s < 3);
      sacCells.hide = s === 4; slit.hide = relO.hide = s !== 4; if (s === 4) B.update(relO, release(k));
    } };
}

/* ═════════════ 4) البويض وتكوين الكيس الجنيني (ص64–67) — يتبع المرحلة ═════════════ */
function ovuleModel(B){
  /* البويض قائم: النقير (فتحة الأغلفة) في الأعلى والحبل السري في الأسفل، داخل جدار المبيض */
  const O = [0, 0, 0];
  B.add(place(ellipsoid({ r: [2.3, 2.6, 1.4], rows: 18, cols: 26 }), { at: [0, -0.2, 0] }), fx('flOvaryWall', C.wall, { alpha: 0.16, shell: { size: 6 }, rimColor: C.wallL }));
  B.add(place(ellipsoid({ r: [1.5, 0.35, 1.0], rows: 8, cols: 18 }), { at: [0, -2.35, 0] }), fx('flCarpel', '#e86a68', { rimColor: C.wallL }));
  B.add(tube({ pts: [[0, -2.1, 0], [0.05, -1.75, 0], [0, -1.45, 0]], r: 0.16, sides: 10 }), fx('flFunicle', '#8ac8a0', { rimColor: '#d8fff0' }));
  /* غلافان للبويض (خارجي وداخلي) ثم الجويزاء (حافظة الأبواغ الكبيرة) */
  const integ = B.add(merge([place(ellipsoid({ r: [0.95, 1.4, 0.8], rows: 16, cols: 22 }), { at: O }), place(ellipsoid({ r: [0.82, 1.27, 0.68], rows: 16, cols: 22 }), { at: O })]), fx('flInteg', C.integ, { alpha: 0.28, shell: { size: 2.6 }, rimColor: '#e0f4ff' }));
  /* النقير: حلقة الفتحة في قمة الأغلفة */
  B.add(tube({ pts: Array.from({ length: 17 }, (_, i) => [Math.cos(i / 16 * 6.2832) * 0.17, 1.36, Math.sin(i / 16 * 6.2832) * 0.14]), r: 0.05, sides: 6 }), fx('flMicropyle', '#2a4a5a', { rimColor: '#a0d0e8' }));
  const nuc = B.add(place(ellipsoid({ r: [0.68, 1.12, 0.56], rows: 16, cols: 20 }), { at: O }), fx('flNucellus', C.nuc, { alpha: 0.3, shell: { size: 1.8 }, rimColor: '#f0ffd0' }));
  const spor = B.add(place(ellipsoid({ r: [0.5, 0.75, 0.42], rows: 14, cols: 18 }), { at: [0, 0.15, 0] }), fx('flMegaSporangium', '#e8f0b0', { alpha: 0.3, shell: { size: 1.2 }, pop: false }));
  /* الخلية الأم (2س) ← أربعة أبواغ كبيرة (س) في صف ← البوغ الفعال (الثلاثة السفلى تضمحل) */
  const mother = B.add(ball(0.28, [0, 0.15, 0], 12), fx('flMegaMother', C.mother, { rimColor: '#ffc0b0', pop: false }));
  const four = sp => merge([0, 1, 2, 3].map(i => ball(0.15, [0, 0.15 + (1.5 - i) * (0.2 + sp), 0], 10)));
  const fourO = B.add(four(0), fx('flMegaspores', C.mega, { rimColor: C.megaL, pop: false, center: [0, 0.15, 0] }));
  const func = k => ball(0.17 + k * 0.25, [0, -0.35 + k * 0.1, 0], 12);
  const funcO = B.add(func(0), fx('flFuncMega', C.mega, { rimColor: C.megaL, pop: false, center: [0, -0.3, 0] }));
  const degen = B.add(merge([0, 1, 2].map(i => ball(0.11, [0, 0.12 + i * 0.3, 0], 8))), fx('flMegaspores', '#c8a070', { alpha: 0.4, pop: false }));
  /* الكيس الجنيني ونواه: انقسامات 2 ← 4 ← 8، ثم البيضة والمساعدتان عند النقير، والسمتية في الطرف المقابل، والقطبيتان بالوسط */
  const SAC = [0, 0.05, 0];
  const sac = B.add(place(ellipsoid({ r: [0.42, 0.9, 0.36], rows: 14, cols: 18 }), { at: SAC }), fx('flEmbSac', C.sac, { alpha: 0.45, shell: { size: 1.0 }, rimColor: '#fffbe8', pop: false }));
  const nucs = n => merge(Array.from({ length: 8 }, (_, i) => { const top = i < n / 2, j = top ? i : i - n / 2, m = Math.max(1, n / 2);
    return ball(i < n ? 0.08 : 0.0001, add(SAC, [((j - (m - 1) / 2) * 0.13), top ? 0.55 : -0.55, (j % 2) * 0.06]), 6); }));
  const nucO = B.add(nucs(2), fx('flEmbSac', '#6a4a8a', { pop: false, center: SAC }));
  const egg = B.add(ball(0.16, add(SAC, [0, 0.52, 0.05]), 12), fx('flEgg', C.egg, { rimColor: '#ffe0e8', pop: false }));
  const syn = B.add(merge([-1, 1].map(sg => place(ellipsoid({ r: [0.1, 0.16, 0.1], rows: 8, cols: 10 }), { at: add(SAC, [sg * 0.2, 0.72, -0.05]) }))), fx('flSynergid', C.syn, { rimColor: '#fff0d0', pop: false }));
  const ant = B.add(merge([-1, 0, 1].map(sg => ball(0.12, add(SAC, [sg * 0.2, -0.7 + Math.abs(sg) * 0.06, 0]), 10))), fx('flAntipodal', C.ant, { rimColor: '#ffffff', pop: false }));
  const polar = k => merge([-1, 1].map(sg => ball(0.09, add(SAC, [sg * 0.12 * (1 - k * 0.5), sg * 0.35 * (1 - k), 0.05]), 8)));
  const polO = B.add(polar(0), fx('flPolar', C.pol, { rimColor: '#c0e0ff', pop: false, center: SAC }));
  const mature = B.add(place(ellipsoid({ r: [1.1, 1.55, 0.92], rows: 16, cols: 22 }), { at: O }), fx('flOvuleM', '#f6e8c0', { alpha: 0.12, shell: { size: 3.2 }, rimColor: '#fff8e0', pop: false }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('flOvaryWall', [2.2, 0.3, 0], [1, 0.2, 0], vis(7));
  B.label('flCarpel', [1.2, -2.35, 0.3], [1, -0.3, 0.3], vis(0, 1, 2, 3, 4, 5, 6));
  B.label('flFunicle', [0.12, -1.75, 0.1], [1, -0.4, 0.4]);
  B.label('flInteg', [0.92, 0.3, 0], [1, 0.3, 0]);
  B.label('flNucellus', [0.6, -0.6, 0.2], [1, -0.4, 0.2]);
  B.label('flMicropyle', [0.12, 1.5, 0], [0.4, 1, 0]);
  B.label('flMegaSporangium', [-0.5, 0.4, 0], [-1, 0.4, 0], vis(0));
  B.label('flMegaMother', [-0.25, 0.15, 0.1], [-1, 0, 0.3], vis(1));
  B.label('flMegaspores', [-0.15, 0.45, 0.1], [-1, 0.3, 0.3], vis(1, 2));
  B.label('flFuncMega', [0.3, -0.35, 0.1], [1, -0.2, 0.3], vis(2));
  B.label('flEmbSac', [-0.42, -0.2, 0.1], [-1, -0.3, 0.3], vis(3, 4, 5, 6));
  B.label('flEgg', add(SAC, [0.1, 0.5, 0.2]), [1, 0.4, 0.4], vis(4, 5, 6));
  B.label('flSynergid', add(SAC, [-0.25, 0.75, 0]), [-1, 0.5, 0.2], vis(4, 5, 6));
  B.label('flAntipodal', add(SAC, [-0.25, -0.7, 0]), [-1, -0.5, 0.2], vis(5, 6));
  B.label('flPolar', add(SAC, [0.12, 0, 0.12]), [1, 0, 0.4], vis(6));
  B.label('flOvuleM', [-1.05, -0.6, 0], [-1, -0.2, 0], vis(7));
  B.caption([0, -2.9, 0], () => [(FL_OVULE_STAGES[STG.idx] || {}).n || '']);
  return { dist: 8.8, yaw: 0.3, pitch: 0.12, target: [0, -0.3, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      spor.hide = s !== 0; mother.hide = !(s === 1 && k < 0.45); fourO.hide = !(s === 1 && k >= 0.45); if (!fourO.hide) B.update(fourO, four((k - 0.45) * 0.15));
      funcO.hide = degen.hide = s !== 2; if (s === 2) B.update(funcO, func(k));
      sac.hide = s < 3; nucO.hide = s !== 3; if (s === 3) B.update(nucO, nucs(k < 0.33 ? 2 : k < 0.66 ? 4 : 8));
      egg.hide = syn.hide = s < 4; ant.hide = s < 5; polO.hide = s < 6; if (s === 6) B.update(polO, polar(k)); else if (s === 7) B.update(polO, polar(1));
      mature.hide = s !== 7; void integ; void nuc;
    } };
}

Object.assign(G3.models, { fl_flVStruct: structModel, fl_flVParts: partsModel, fl_flVPollen: pollenModel, fl_flVOvule: ovuleModel });
})();
