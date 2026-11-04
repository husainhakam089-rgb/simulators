
/* ══════════════════════════════════════════════════════════════════════════
   9.4 · مجسّمات الحزازيات والسرخسيات — دورتا حياة البوليتراكم والسرخس
         (ملزمة ص45–50) بنفس أجزاء الرسوم المسطّحة. «طرق التكاثر» و«تعاقب
         الأجيال» مخططان، فيبقيان مسطّحين.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, tube, place, merge, spline, srng, mk, computeNormals } = G3;
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.8, rimColor: '#ffffff' }, extra || {});
const sm = k => k * k * (3 - 2 * k);
const ball = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
/* أرض رطبة: قرص مسطح */
const ground = (r, y) => place(ellipsoid({ r: [r, 0.08, r * 0.7], rows: 8, cols: 28 }), { at: [0, y, 0] });
/* مضلّع مسطح مبثوق (لوح رقيق) في المستوى xz عند الارتفاع y */
function slab(poly, y, th){
  const m = mk(), push = v => { m.p.push(v[0], v[1], v[2]); m.l.push(v[0], v[1], v[2]); return m.p.length / 3 - 1; };
  const cen = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
  const ct = push([cen[0], y + th / 2, cen[1]]), cb = push([cen[0], y - th / 2, cen[1]]);
  const T = poly.map(p => push([p[0], y + th / 2, p[1]])), Bo = poly.map(p => push([p[0], y - th / 2, p[1]]));
  poly.forEach((p, i) => { const j = (i + 1) % poly.length; m.i.push(ct, T[j], T[i], cb, Bo[i], Bo[j], T[i], T[j], Bo[i], T[j], Bo[j], Bo[i]); });
  return computeNormals(m);
}

/* ═════════════ دورة حياة البوليتراكم (ص45–47) ═════════════ */
/* ساق ورقي: ساق رفيعة وأوراق صغيرة حلزونية */
function leafy(base, h, seed, lean){
  const r = srng(seed), top = add(base, [lean || 0, h, 0]), out = [tube({ pts: [base, add(base, [(lean || 0) * 0.4, h * 0.5, 0]), top], r: 0.035, sides: 6 })];
  for (let i = 0; i < 26; i++){ const u = 0.08 + 0.9 * i / 26, a = i * 2.4, at = add(base, [(lean || 0) * u, h * u, 0]), d = norm([Math.cos(a), 0.9, Math.sin(a)]);
    out.push(place(ellipsoid({ r: [0.025, 0.16 * (1.1 - u * 0.4), 0.06], rows: 4, cols: 6 }), { at: add(at, mul(d, 0.1)), dir: d })); void r; }
  return { m: merge(out), top };
}
/* كأس قمة الساق (أنثريديا أو أركيكونا) */
const cup = (at, col) => merge(Array.from({ length: 9 }, (_, i) => { const a = i / 9 * 6.2832, d = norm([Math.cos(a), 1.1, Math.sin(a)]); return place(ellipsoid({ r: [0.04, 0.16, 0.08], rows: 4, cols: 6 }), { at: add(at, mul(d, 0.12)), dir: d }); }));
function mossModel(B){
  B.add(ground(2.6, -1.15), { color: '#5a4a2a', rim: 0.3, rimColor: '#a08a5a' });
  const M = leafy([0.7, -1.1, 0], 1.6, 3, 0.1), F = leafy([-0.6, -1.1, 0.1], 1.7, 5, -0.05);
  const L2 = leafy([1.3, -1.1, -0.4], 1.3, 7, 0.08), L3 = leafy([-1.3, -1.1, -0.3], 1.4, 9, -0.1);
  B.add(merge([M.m, F.m]), fx('plMLeaf', '#5fae3a', { rimColor: '#d8ffc0' }));
  B.add(merge([L2.m, L3.m]), fx('plMMature', '#6cbc44', { rimColor: '#d8ffc0' }));
  B.add(cup(M.top, 0), fx('plMAnth', '#f0a03a', { rimColor: '#ffe0b0' }));
  B.add(cup(F.top, 0), fx('plMArch', '#7ad04a', { rimColor: '#e8ffd0' }));
  /* أمشاج ذكرية سابحة من الأنثريديا إلى الأركيكونا في قطرة ماء */
  const swim = k => merge(Array.from({ length: 7 }, (_, i) => { const u = (k + i / 7) % 1, p = add(add(mul(M.top, 1 - u), mul(F.top, u)), [0, Math.sin(u * Math.PI) * 0.7 + Math.sin(i * 3) * 0.05, Math.cos(i * 2) * 0.12]);
    return ball(0.045, p, 6); }));
  const spO = B.add(swim(0), fx('plMSperm', '#3a7ad8', { rimColor: '#c0e0ff', pop: false, center: [0, 0.5, 0] }));
  const zyg = B.add(ball(0.11, add(F.top, [0, 0.06, 0]), 10), fx('plMZyg', '#c03a3a', { rimColor: '#ffc0c0', pop: false, center: F.top }));
  /* الطور البوغي: حامل (ساق رفيع) وعليه علبة الأبواغ، فوق النبات الأنثوي */
  const seta = h => tube({ pts: [F.top, add(F.top, [0.05, h * 0.5, 0]), add(F.top, [0.1, h, 0])], r: 0.025, sides: 6 });
  const caps = h => place(ellipsoid({ r: [0.09, 0.2, 0.09], rows: 10, cols: 12 }), { at: add(F.top, [0.13, h + 0.15, 0]), dir: [0.3, 1, 0] });
  const setaO = B.add(seta(1.1), fx('plMSeta', '#c8a050', { rimColor: '#ffe8b0', pop: false, center: F.top }));
  const capsO = B.add(caps(1.1), fx('plMCaps', '#a8743a', { rimColor: '#ffd8a0', pop: false, center: F.top }));
  const capTop = add(F.top, [0.18, 1.45, 0]);
  const spores = k => merge(Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, d = norm([Math.cos(a), 0.6 + (i % 3) * 0.3, Math.sin(a)]); return ball(0.035, add(capTop, add(mul(d, 0.15 + k * 1.3), [k * 0.6, -k * k * 0.9, 0])), 5); }));
  const sporeO = B.add(spores(0), fx('plMSpores', '#d8b040', { rimColor: '#fff0c0', pop: false, center: capTop }));
  /* الخيوط الأولية: خيوط خضراء متفرعة على الأرض وعليها براعم */
  const proto = k => { const r = srng(11), out = []; let p = [1.6, -1.06, 0.6];
    for (let i = 0; i < 7; i++){ const q = add(p, [-(0.12 + r() * 0.1) * (0.3 + k), 0.01, (r() - 0.5) * 0.16]); out.push(tube({ pts: [p, q], r: 0.022, sides: 5 }));
      if (i % 2) out.push(tube({ pts: [q, add(q, [(r() - 0.5) * 0.15, 0.01, 0.12])], r: 0.016, sides: 4 }), ball(0.035 + 0.04 * k, add(q, [0, 0.04, 0]), 6)); p = q; }
    return merge(out); };
  const protoO = B.add(proto(0), fx('plMProto', '#7ad04a', { rimColor: '#e8ffd0', pop: false, center: [1.2, -1.05, 0.6] }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('plMLeaf', add(F.top, [-0.15, -0.9, 0]), [-1, 0, 0.2]);
  B.label('plMMature', add(L2.top, [0.1, -0.4, 0]), [1, 0.1, 0.2]);
  B.label('plMAnth', add(M.top, [0.1, 0.12, 0]), [1, 0.5, 0.2]);
  B.label('plMArch', add(F.top, [-0.12, 0.12, 0]), [-1, 0.5, 0.2], vis(0, 1));
  B.label('plMSperm', mul(add(M.top, F.top), 0.5), [0, 1, 0.3], vis(1));
  B.label('plMZyg', add(F.top, [0, 0.12, 0.1]), [-1, 0.6, 0.3], vis(2));
  B.label('plMSeta', add(F.top, [0.05, 0.6, 0]), [-1, 0.2, 0.2], vis(3, 4));
  B.label('plMCaps', add(F.top, [0.13, 1.3, 0]), [1, 0.5, 0.2], vis(3, 4));
  B.label('plMSpores', add(capTop, [0.6, 0.1, 0]), [1, 0.5, 0.2], vis(4));
  B.label('plMProto', [1.2, -1.0, 0.6], [1, 0.3, 0.4], vis(5));
  B.caption([0, -1.7, 0], () => [(PL_MOSS_ST[STG.idx] || {}).n || '']);
  return { dist: 7.6, yaw: 0.35, pitch: 0.25, target: [0, 0, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      spO.hide = s !== 1; if (s === 1) B.update(spO, swim(t * 0.35));
      zyg.hide = s !== 2;
      const h = s === 3 ? 0.5 + 0.6 * k : 1.1; setaO.hide = capsO.hide = !(s === 3 || s === 4);
      if (s === 3){ B.update(setaO, seta(h)); B.update(capsO, caps(h)); }
      sporeO.hide = s !== 4; if (s === 4) B.update(sporeO, spores(k));
      protoO.hide = s !== 5; if (s === 5) B.update(protoO, proto(k));
    } };
}

/* ═════════════ دورة حياة السرخس (ص48–50) ═════════════ */
/* سعفة: محور مقوس وعليه وريقات على الجانبين؛ sori بثرات بنية تحت الوريقات */
function frond(base, dir, len, seed, sori){
  const d = norm(dir), axis = [], out = [], so = [];
  for (let i = 0; i <= 10; i++){ const u = i / 10; axis.push(add(base, [d[0] * len * u, len * u * 0.9 - len * u * u * 0.45, d[2] * len * u])); }
  out.push(tube({ pts: axis, r: u => 0.035 * (1 - u * 0.7), sides: 6 }));
  for (let i = 1; i < 10; i++){ const p = axis[i], q = axis[i + 1], tng = norm(add(q, mul(p, -1))), side = norm([-tng[2], 0, tng[0]]), w = 0.3 * (1 - i / 11);
    [-1, 1].forEach(sg => { const sd = mul(side, sg); out.push(place(ellipsoid({ r: [0.02, w, 0.06], rows: 4, cols: 8 }), { at: add(p, mul(sd, w * 0.9)), dir: sd }));
      if (sori && i % 2) so.push(ball(0.035, add(add(p, mul(sd, w * 0.9)), [0, -0.04, 0]), 5)); }); }
  return { m: merge(out), so: so.length ? merge(so) : null, tip: axis[10] };
}
/* الثالوس الأولي: قلب أخضر رقيق مسطح */
const heart = (c, s) => Array.from({ length: 28 }, (_, i) => { const a = i / 28 * 6.2832, x = 16 * Math.pow(Math.sin(a), 3), z = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
  return [c[0] + x / 17 * s, c[2] + z / 17 * s]; });
function fernModel(B){
  B.add(ground(3.0, -1.2), { color: '#4a3a22', rim: 0.3, rimColor: '#a08a5a' });
  /* الطور البوغي السائد: نبات سرخس بسعفات وحافظات بوغية تحت السعفات */
  const FB = [-1.4, -1.12, -0.2], fr = [[1, 0.2], [0.3, 1], [-1, 0.4], [-0.4, -1], [0.8, -0.7]].map(([x, z], i) => frond(FB, [x, 0, z], 1.6 + (i % 2) * 0.3, i, i === 0 || i === 4));
  B.add(merge(fr.map(f => f.m)), fx('plFern', '#4fa83a', { rimColor: '#d8ffc0' }));
  B.add(merge(fr.filter(f => f.so).map(f => f.so)), fx('plFSori', '#8a5a2a', { rimColor: '#ffd8a0' }));
  B.add(tube({ pts: [add(FB, [-0.5, -0.05, 0]), add(FB, [0.5, -0.05, 0.1])], r: 0.07, sides: 8 }), fx('plFern', '#6a4a2a'));
  /* الأبواغ تنتشر من البثرات، ثم بوغ ينبت على الأرض */
  const SO = fr[0].tip, spores = k => merge(Array.from({ length: 14 }, (_, i) => ball(0.035, add(SO, [0.3 + k * 1.6 + Math.sin(i) * 0.25, 0.2 + Math.sin(k * 3 + i) * 0.3 - k * 0.6, Math.cos(i * 1.7) * 0.4]), 5)));
  const spO = B.add(spores(0), fx('plFSpores', '#c89040', { rimColor: '#fff0c0', pop: false, center: SO }));
  const PC = [1.2, -1.1, 0.2];
  const germ = B.add(merge([ball(0.07, add(PC, [-0.5, 0.02, 0.5]), 8), tube({ pts: [add(PC, [-0.5, 0.02, 0.5]), add(PC, [-0.32, 0.04, 0.45]), add(PC, [-0.2, 0.05, 0.5])], r: 0.025, sides: 5 })]), fx('plFGerm', '#7ad04a', { pop: false, center: PC }));
  /* الثالوس الأولي وعليه الأنثريديا (بعيداً عن الحز) والأركيكونا (قرب الحز) وأشباه الجذور تحته */
  const prothO = B.add(slab(heart(PC, 0.85), PC[1] + 0.06, 0.04), fx('plProth', '#8fd462', { rimColor: '#e8ffd0', pop: false, center: PC }));
  const rhiz = B.add(merge(Array.from({ length: 10 }, (_, i) => { const p = add(PC, [Math.sin(i) * 0.25, 0.02, 0.35 + Math.cos(i * 1.3) * 0.15]); return tube({ pts: [p, add(p, [(i % 3 - 1) * 0.08, -0.22, 0.05])], r: 0.012, sides: 4 }); })),
    fx('plRhiz', '#e8e0c0', { pop: false, center: PC }));
  const anth = B.add(merge([[0.18, 0.45], [-0.2, 0.42], [0.05, 0.6], [0.3, 0.3]].map(([x, z]) => ball(0.055, add(PC, [x, 0.12, z]), 8))), fx('plFAnth', '#f0a03a', { pop: false, center: PC }));
  const arch = B.add(merge([[-0.1, -0.35], [0.1, -0.35], [0, -0.25]].map(([x, z]) => place(ellipsoid({ r: [0.05, 0.12, 0.05], rows: 6, cols: 8 }), { at: add(PC, [x, 0.17, z]) }))), fx('plFArch', '#5fae3a', { alpha: 0.45, shell: { size: 0.3 }, pop: false, center: PC }));
  const egg = B.add(ball(0.06, add(PC, [0, 0.16, -0.25]), 8), fx('plFEgg', '#f0d0e0', { pop: false, center: PC }));
  const sperm = k => merge(Array.from({ length: 6 }, (_, i) => { const u = (k + i / 6) % 1, a = add(PC, [0.15, 0.16, 0.45]), b = add(PC, [0, 0.2, -0.25]); return ball(0.035, add(add(mul(a, 1 - u), mul(b, u)), [Math.sin(i * 2 + u * 9) * 0.06, 0.04, 0]), 5); }));
  const spermO = B.add(sperm(0), fx('plFSperm', '#3a7ad8', { rimColor: '#c0e0ff', pop: false, center: PC }));
  const zyg = B.add(ball(0.08, add(PC, [0, 0.14, -0.25]), 10), fx('plFZyg', '#c03a3a', { pop: false, center: PC }));
  /* الطور البوغي الفتي ينمو من الثالوس، ثم يصبح مرئياً بسعفات صغيرة */
  const young = k => { const b = add(PC, [0, 0.1, -0.25]); return merge([tube({ pts: [b, add(b, [0, 0.15 + 0.3 * k, 0])], r: 0.025, sides: 5 }), place(ellipsoid({ r: [0.03, 0.12 + 0.12 * k, 0.08], rows: 4, cols: 8 }), { at: add(b, [0.08, 0.3 + 0.3 * k, 0]), dir: [1, 0.6, 0] })]); };
  const youngO = B.add(young(0), fx('plFYoung', '#4fa83a', { pop: false, center: PC }));
  const visO = B.add(merge([0, 1, 2].map(i => frond(add(PC, [0.9, 0.0, 0.6]), [Math.cos(i * 2.1), 0, Math.sin(i * 2.1)], 0.7, i + 9, false).m)), fx('plFVis', '#5fbe44', { pop: false, center: PC }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('plFern', add(FB, [-0.6, 1.0, 0]), [-1, 0.4, 0.2]);
  B.label('plFSori', add(SO, [0, -0.05, 0]), [0.3, -1, 0.4]);
  B.label('plFSpores', add(SO, [1.0, 0.2, 0]), [0.4, 1, 0.3], vis(1));
  B.label('plFGerm', add(PC, [-0.5, 0.06, 0.5]), [-0.5, 1, 0.5], vis(1));
  B.label('plProth', add(PC, [0.75, 0.08, 0]), [1, 0.3, 0.2], vis(2, 3));
  B.label('plRhiz', add(PC, [0.2, -0.15, 0.45]), [1, -0.5, 0.4], vis(2, 3));
  B.label('plFAnth', add(PC, [0.3, 0.15, 0.3]), [1, 0.5, 0.4], vis(2, 3));
  B.label('plFArch', add(PC, [-0.1, 0.25, -0.35]), [-1, 0.6, -0.2], vis(2, 3));
  B.label('plFEgg', add(PC, [0.05, 0.12, -0.25]), [0.4, 0.8, -0.5], vis(3));
  B.label('plFSperm', add(PC, [0.1, 0.2, 0.1]), [1, 0.6, 0.2], vis(3));
  B.label('plFZyg', add(PC, [0.05, 0.16, -0.25]), [0.4, 0.8, -0.5], vis(4));
  B.label('plFYoung', add(PC, [0.08, 0.5, -0.25]), [-0.5, 1, 0], vis(4));
  B.label('plFVis', add(PC, [1.3, 0.3, 0.6]), [1, 0.5, 0.3], vis(4));
  B.caption([0, -1.75, 0], () => [(PL_FERN_ST[STG.idx] || {}).n || '']);
  return { dist: 8.4, yaw: 0.3, pitch: 0.4, target: [0, -0.4, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      spO.hide = germ.hide = s !== 1; if (s === 1) B.update(spO, spores(k));
      [prothO, rhiz, anth, arch].forEach(o => o.hide = s < 2);
      egg.hide = s !== 3; spermO.hide = s !== 3; if (s === 3) B.update(spermO, sperm(t * 0.4));
      zyg.hide = youngO.hide = visO.hide = s !== 4; if (s === 4) B.update(youngO, young(k));
    } };
}

Object.assign(G3.models, { pl_plvMoss: mossModel, pl_plvFern: fernModel });
})();
