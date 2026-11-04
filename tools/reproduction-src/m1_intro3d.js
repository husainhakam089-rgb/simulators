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

/* ═════════════ 2) تكوين النطف: أرومات النطف تتحول إلى أربع نطف ناضجة ═════════════ */
function spermModel(B){
  const X = [-1.5, -0.5, 0.5, 1.5];
  X.forEach((x, i) => B.add(place(ellipsoid({ r: 0.26, rows: 10, cols: 14 }), { at: [x, 1.15, 0] }), { part: 'spTid', color: '#b07ad8', rim: 0.9, rimColor: '#f1dcff' }));
  X.forEach(x => B.add(place(ellipsoid({ r: 0.11, rows: 8, cols: 10 }), { at: [x - 0.03, 1.17, 0.18] }), { part: 'spTid', color: '#4a2a7a', rim: 0.5, rimColor: '#c9a0e8' }));
  const recs = X.map((x, i) => { const m = spermMesh([x, 0.3, 0], [0, 1, 0], 1.3, i);
    return { h: B.add(m.head, { part: 'spermM', color: '#e8ecff', rim: 0.9, rimColor: '#9fb6ff', pop: false, center: [0, 0, 0] }),
             b: B.add(m.body, { part: 'spermM', color: '#9fb6ff', rim: 0.7, rimColor: '#ffffff', pop: false, center: [0, 0, 0] }), x, i }; });
  B.add(merge([-1.9, 1.9].map(x => place(capsule({ r: 0.012, len: 0.01, rows: 2, cols: 4 }), { at: [x, 0.75, 0] }))), { part: 'spermio', color: '#e8e0f0', rim: 0.3 });
  B.add(tube({ pts: [[-2.1, 0.75, 0], [2.1, 0.75, 0]], r: 0.015, sides: 5 }), { part: 'spermio', color: '#e8e0f0', rim: 0.4, rimColor: '#ffffff' });
  B.label('spTid', [1.75, 1.15, 0], [1, 0.4, 0]);
  B.label('spermio', [2.1, 0.75, 0], [1, 0, 0]);
  B.label('spermM', [1.55, 0.25, 0.1], [1, -0.2, 0]);
  B.caption([0, -1.6, 0], () => ['أرومات النطف (س) تعاني عملية التحول النطفي', 'فتتكون أربع نطف ناضجة أحادية المجموعة الكروموسومية (س)']);
  return { dist: 9.2, yaw: 0.25, pitch: 0.15, target: [0, 0.45, 0], live2d: true,
    anim(t){ recs.forEach(R => { const m = spermMesh([R.x, 0.3 + Math.sin(t * 2 + R.i) * 0.03, 0], [Math.sin(t * 1.3 + R.i) * 0.08, 1, 0], 1.3, t * 8 + R.i); B.update(R.h, m.head); B.update(R.b, m.body); }); } };
}

/* ═════════════ 3) المبيض: حويصلات تنمو، حويصلة كراف تحرر البيضة، الجسم الأصفر ═════════════ */
function eggModel(B){
  B.add(ellipsoid({ r: [1.5, 1.9, 1.0], rows: 24, cols: 36 }), { part: 'ovary', color: '#e98a8a', alpha: 0.32, rim: 1.2, rimColor: '#ffe0d8', shell: { size: 3.6 }, pat: 2, patColor: '#c96a6a', patK: 5 });
  const F = [[-1.0, 1.1, 0.5, 0.14], [-1.25, 0.4, 0.45, 0.2], [-1.2, -0.4, 0.4, 0.27]];
  F.forEach(([x, y, z, r]) => { B.add(place(ellipsoid({ r: r + 0.08, rows: 10, cols: 14 }), { at: [x, y, z] }), { part: 'ooPrim', color: '#f6c3b0', rim: 0.8, rimColor: '#ffffff' });
    B.add(place(ellipsoid({ r: r * 0.5, rows: 8, cols: 10 }), { at: [x + 0.04, y, z + r * 0.6] }), { part: 'ooPrim', color: '#2a2a6a', rim: 0.6, rimColor: '#c9b8ff' }); });
  B.add(place(ellipsoid({ r: 0.5, rows: 14, cols: 20 }), { at: [-0.75, -1.3, 0.55] }), { part: 'graaf', color: '#f6c3b0', alpha: 0.6, rim: 1.1, rimColor: '#ffffff', shell: { size: 1.1 } });
  B.add(place(ellipsoid({ r: 0.32, rows: 10, cols: 14 }), { at: [-0.7, -1.3, 0.62] }), { part: 'graaf', color: '#cfe7ff', alpha: 0.7, rim: 0.8, rimColor: '#ffffff' });
  B.add(place(ellipsoid({ r: [0.42, 0.36, 0.3], rows: 10, cols: 14 }), { at: [0.65, -1.05, 0.4] }), { part: 'corpusL', color: '#f2c14e', rim: 0.9, rimColor: '#fff3c8' });
  const eggO = B.add(place(ellipsoid({ r: 0.13, rows: 8, cols: 10 }), { at: [-1.1, -1.7, 0.8] }), { part: 'ooSec', color: '#8f7ad8', rim: 0.9, rimColor: '#e8e0ff', pop: false, center: [-1.1, -1.7, 0.8] });
  /* قناة البيض: أنبوب يلتف فوق المبيض وينتهي بقمع مهدب */
  const duct = spline([[1.6, 2.6, 0], [0.4, 2.7, 0.2], [-1.0, 2.3, 0.5], [-1.9, 1.2, 0.7], [-2.0, 0.1, 0.8]], 8, false);
  B.add(tube({ pts: duct, r: u => 0.12 + u * 0.14, sides: 12 }), { part: 'oviduct', color: '#d9505a', rim: 0.9, rimColor: '#ffc0c0' });
  B.add(merge([0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * 6.2832; return tube({ pts: [[-2.0, 0.1, 0.8], [-2.0 + Math.cos(a) * 0.3, -0.25, 0.8 + Math.sin(a) * 0.3], [-2.0 + Math.cos(a) * 0.45, -0.5, 0.8 + Math.sin(a) * 0.45]], r: 0.04, sides: 5 }); })),
    { part: 'oviduct', color: '#e8707a', rim: 0.8, rimColor: '#ffd0d0' });
  B.label('ovary', [1.3, 0.6, 0.4], [1, 0.2, 0.2]);
  B.label('oviduct', [0.4, 2.7, 0.2], [0.2, 1, 0]);
  B.label('graaf', [-0.75, -1.75, 0.6], [-0.4, -1, 0.3]);
  B.label('corpusL', [0.95, -1.15, 0.45], [1, -0.4, 0.2]);
  B.label('ooPrim', [-1.35, 0.4, 0.5], [-1, 0.1, 0.2]);
  B.label('ooSec', [-1.1, -1.7, 0.8], [-1, -0.6, 0.3]);
  B.caption([0, -2.5, 0], () => ['المبيض: حويصلات مبيضية تنمو، وحويصلة كراف تحرر الخلية البيضية الثانوية', 'ثم يتكون الجسم الأصفر']);
  return { dist: 9.4, yaw: 0.5, pitch: 0.18, target: [-0.2, 0.2, 0], live2d: true,
    anim(t){ const p = (t * 0.15) % 1; B.update(eggO, place(ellipsoid({ r: 0.13, rows: 8, cols: 10 }), { at: [-1.1 - p * 0.8, -1.7 + p * 1.6, 0.8] })); } };
}

Object.assign(G3.models, { int_itypes: typesModel, int_isperm: spermModel, int_iegg: eggModel });
G3.spermMesh = spermMesh;
})();

