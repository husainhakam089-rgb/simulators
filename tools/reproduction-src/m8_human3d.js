
/* ══════════════════════════════════════════════════════════════════════════
   9.8 · مجسّمات التكاثر في الإنسان، أحداث الدورة المبيضية، والتكاثر الخنثي
         (ملزمة ص105–129) بنفس أجزاء الرسوم المسطّحة. «الدورة المبيضية والرحمية»
         (منحنيات الهرمونات) و«التكاثر العذري» مخططان فيبقيان مسطّحين.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.8, rimColor: '#ffffff' }, extra || {});
const sm = k => k * k * (3 - 2 * k);
const ball = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
const pipe = (pts, r, sides) => tube({ pts: spline(pts, 6, false), r, sides: sides || 8 });
const both = f => merge([f(1), f(-1)]);
const SKIN = '#f2b8a8', PINK = '#e8909a', DUCT = '#f0a0a8';

/* ═════════════ 1) الجهاز التناسلي الذكري (ص105–106) ═════════════ */
function maleModel(B){
  const BL = [0, 1.25, -0.1];
  B.add(place(ellipsoid({ r: [0.75, 0.62, 0.6], rows: 16, cols: 20 }), { at: BL }), fx('huBladder', '#f4b0a8', { alpha: 0.75, rimColor: '#ffe0d8' }));
  B.add(both(sg => pipe([[sg * 1.25, 2.6, -0.3], [sg * 1.0, 2.1, -0.25], [sg * 0.55, 1.6, -0.2]], 0.07)), fx('huUreter', '#f0c060', { rimColor: '#fff0b0' }));
  B.add(place(ellipsoid({ r: [0.42, 0.32, 0.38], rows: 12, cols: 16 }), { at: [0, 0.38, 0] }), fx('huProst', '#c04a6a', { rimColor: '#ffc0d0' }));
  B.add(both(sg => place(ellipsoid({ r: [0.14, 0.38, 0.12], rows: 10, cols: 12 }), { at: [sg * 0.55, 0.85, -0.35], rot: [0, 0, sg * 0.45] })), fx('huSemVes', '#e87890'));
  B.add(both(sg => pipe([[sg * 0.42, 0.62, -0.3], [sg * 0.18, 0.45, -0.05], [sg * 0.03, 0.25, 0.05]], 0.035)), fx('huEjac', '#d84a70'));
  B.add(both(sg => ball(0.09, [sg * 0.2, -0.12, 0.05], 8)), fx('huCowper', '#f6e070'));
  B.add(pipe([[0, 0.7, 0], [0, 0.0, 0.05], [0, -0.9, 0.1], [0, -1.9, 0.15]], 0.07), fx('huUreth', '#f6f0a0', { rimColor: '#ffffff' }));
  B.add(place(capsule({ r: 0.32, len: 1.2, rows: 6, cols: 18 }), { at: [0, -1.25, 0.12] }), fx('huPenis', '#e8a090', { alpha: 0.55, shell: { size: 1.5 }, rimColor: '#ffe0d8' }));
  B.add(both(sg => place(ellipsoid({ r: [0.36, 0.5, 0.36], rows: 14, cols: 18 }), { at: [sg * 1.25, -1.9, 0] })), fx('huTestis', '#f2b48a', { rimColor: '#ffe0c0' }));
  B.add(both(sg => pipe([[sg * 1.55, -1.5, 0.05], [sg * 1.62, -1.9, 0.1], [sg * 1.5, -2.35, 0.05]], 0.1)), fx('huEpid', '#d86a7a'));
  B.add(both(sg => pipe([[sg * 1.5, -2.35, 0], [sg * 1.75, -1.0, 0], [sg * 1.6, 0.8, -0.1], [sg * 1.05, 1.95, -0.3], [sg * 0.45, 1.6, -0.5], [sg * 0.5, 0.95, -0.4]], 0.04)), fx('huVas', '#f08aa0', { rimColor: '#ffe0e8' }));
  B.label('huBladder', [-0.7, 1.4, 0], [-1, 0.3, 0.2]);
  B.label('huUreter', [1.1, 2.3, -0.25], [1, 0.5, 0]);
  B.label('huVas', [1.72, 0.0, 0], [1, 0, 0]);
  B.label('huSemVes', [0.65, 1.1, -0.35], [1, 0.4, -0.2]);
  B.label('huEjac', [0.15, 0.45, 0.1], [1, 0.1, 0.4]);
  B.label('huProst', [-0.42, 0.38, 0.1], [-1, 0.1, 0.3]);
  B.label('huCowper', [-0.25, -0.12, 0.1], [-1, -0.2, 0.3]);
  B.label('huUreth', [0.08, -0.5, 0.1], [1, -0.1, 0.4]);
  B.label('huPenis', [0.32, -1.5, 0.15], [1, -0.3, 0.3]);
  B.label('huTestis', [-1.6, -2.0, 0], [-1, -0.3, 0.2]);
  B.label('huEpid', [1.62, -1.9, 0.12], [1, -0.4, 0.2]);
  B.caption([0, -2.85, 0], () => ['الجهاز التناسلي الذكري: الخصيتان والبربخ والقناتان الناقلتان والحويصلتان المنويتان', 'والقناتان القاذفتان والبروستات وغدتا كوبر والإحليل والقضيب']);
  return { dist: 9.4, yaw: 0.35, pitch: 0.12, target: [0, -0.2, 0] };
}

/* ═════════════ 2) نطفة الإنسان الناضجة (ص107) ═════════════ */
function spermModel(B){
  const H = [0, 1.6, 0];
  B.add(place(ellipsoid({ r: [0.62, 0.9, 0.38], rows: 18, cols: 22 }), { at: H }), fx('huHead', '#f6c8d8', { alpha: 0.35, shell: { size: 1.6 }, rimColor: '#ffe8f0' }));
  B.add(place(ellipsoid({ r: [0.5, 0.68, 0.3], rows: 16, cols: 20 }), { at: add(H, [0, -0.1, 0]) }), fx('huNuc', '#9a7ae0', { rimColor: '#e8e0ff' }));
  B.add(place(ellipsoid({ r: [0.56, 0.32, 0.34], rows: 12, cols: 18 }), { at: add(H, [0, 0.62, 0]) }), fx('huAcro', '#f6d070', { alpha: 0.75, rimColor: '#fff4c0' }));
  B.add(place(ellipsoid({ r: [0.6, 0.18, 0.36], rows: 10, cols: 18 }), { at: add(H, [0, 0.82, 0]) }), fx('huCap', '#f0a0c0', { alpha: 0.6, shell: { size: 0.6 } }));
  B.add(place(capsule({ r: 0.14, len: 0.22, rows: 4, cols: 12 }), { at: add(H, [0, -1.02, 0]) }), fx('huNeck', '#c8b0e0'));
  const MID = [0, -0.2, 0];
  B.add(place(capsule({ r: 0.2, len: 1.0, rows: 6, cols: 16 }), { at: MID }), fx('huMid', '#e8b860', { alpha: 0.55, shell: { size: 0.8 } }));
  B.add(merge([-0.1, -0.035, 0.035, 0.1].map(x => tube({ pts: [add(MID, [x, 0.6, 0.12]), add(MID, [x, -0.6, 0.12])], r: 0.02, sides: 4 }))), fx('huTubules', '#8a5a1a'));
  B.add(tube({ pts: Array.from({ length: 60 }, (_, i) => { const u = i / 59, a = u * 6.2832 * 9; return add(MID, [Math.cos(a) * 0.17, 0.55 - u * 1.1, Math.sin(a) * 0.17]); }), r: 0.03, sides: 5 }), { color: '#c08030', rim: 0.5 });
  const tail = t => tube({ pts: Array.from({ length: 24 }, (_, i) => { const u = i / 23; return [Math.sin(u * 8 - t * 6) * 0.25 * u, -0.85 - u * 3.2, Math.cos(u * 6 - t * 5) * 0.08 * u]; }), r: u => 0.07 * (1 - u * 0.75), sides: 6 });
  const tailO = B.add(tail(0), fx('huTail', '#f0b8c8', { pop: false, center: [0, -2.4, 0] }));
  B.label('huCap', add(H, [0.3, 0.9, 0.2]), [1, 0.6, 0.2]);
  B.label('huAcro', add(H, [0.45, 0.62, 0.15]), [1, 0.3, 0.3]);
  B.label('huNuc', add(H, [0.4, -0.1, 0.2]), [1, 0, 0.3]);
  B.label('huHead', add(H, [-0.6, 0.1, 0]), [-1, 0.2, 0]);
  B.label('huNeck', add(H, [0.12, -1.02, 0.08]), [1, -0.1, 0.3]);
  B.label('huTubules', add(MID, [0.1, 0.2, 0.13]), [1, 0.1, 0.4]);
  B.label('huMid', add(MID, [-0.2, 0, 0]), [-1, 0, 0.2]);
  B.label('huTail', [0, -2.6, 0], [-1, -0.2, 0.2]);
  B.caption([0, -4.4, 0], () => ['النطفة الناضجة: الرأس (القبعة والجسيم الطرفي والنواة) والعنق', 'والقطعة الوسطية (نبيبات طولية تلتف حولها المايتوكوندريا) والذيل']);
  return { dist: 10.5, yaw: 0.4, pitch: 0.1, target: [0, -0.5, 0], live2d: true, anim(t){ B.update(tailO, tail(t)); } };
}

/* ═════════════ الجهاز الأنثوي (مشترك بين التركيب والإخصاب) ═════════════ */
const uterusM = s => place(ellipsoid({ r: [0.95 * s, 1.15 * s, 0.6 * s], rows: 18, cols: 22, disp: d => 1 - 0.32 * Math.max(0, -d[1]) }), { at: [0, 0.5 + (s - 1) * 0.6, 0] });
const tubePts = sg => [[sg * 0.8, 1.2, 0], [sg * 1.4, 1.65, 0.05], [sg * 2.0, 1.55, 0.05], [sg * 2.35, 1.0, 0.1]];
function femaleBase(B, o){
  o = o || {};
  const ut = B.add(uterusM(1), fx('huUterus', PINK, { alpha: 0.45, shell: { size: 3 }, rimColor: '#ffd8e0', pop: !o.dyn, center: o.dyn ? [0, 0.5, 0] : undefined }));
  B.add(place(capsule({ r: 0.3, len: 0.5, rows: 4, cols: 16 }), { at: [0, -0.75, 0] }), fx('huCervix', '#d87888'));
  B.add(place(capsule({ r: 0.36, len: 1.1, rows: 4, cols: 16 }), { at: [0, -1.75, 0] }), fx('huVagina', '#e89aa8', { alpha: 0.55, shell: { size: 1.4 } }));
  B.add(both(sg => pipe(tubePts(sg), 0.09)), fx('huFallop', DUCT, { rimColor: '#ffe0e8' }));
  B.add(both(sg => merge(Array.from({ length: 9 }, (_, i) => { const a = -1.2 + i * 0.3, b = [sg * 2.35, 1.0, 0.1]; return tube({ pts: [b, add(b, [sg * Math.cos(a) * 0.12 + sg * 0.15, -0.15 - Math.abs(Math.sin(a)) * 0.15, Math.sin(a) * 0.25])], r: 0.03, sides: 4 }); }))), fx('huFimb', '#f0b0b8'));
  B.add(both(sg => place(ellipsoid({ r: [0.42, 0.28, 0.25], rows: 12, cols: 16 }), { at: [sg * 1.75, 0.55, 0.05] })), fx('huOvary', '#f6e8d8', { rimColor: '#ffffff' }));
  return ut;
}

/* ═════════════ 3) الجهاز التناسلي الأنثوي (ص109–111) ═════════════ */
function femaleModel(B){
  femaleBase(B);
  B.add(merge([ball(0.17, [1.95, 0.62, 0.15], 12)]), fx('huGraaf', '#fff4c8', { rimColor: '#ffffff' }));
  B.label('huUterus', [0.9, 0.8, 0], [1, 0.3, 0.1]);
  B.label('huCervix', [-0.3, -0.75, 0], [-1, -0.1, 0.2]);
  B.label('huVagina', [0.36, -1.9, 0], [1, -0.3, 0.2]);
  B.label('huFallop', [1.4, 1.7, 0.05], [0.6, 1, 0]);
  B.label('huFimb', [-2.5, 0.85, 0.15], [-1, -0.2, 0.2]);
  B.label('huOvary', [-1.75, 0.3, 0.1], [-1, -0.5, 0.3]);
  B.label('huGraaf', [2.1, 0.7, 0.2], [1, 0.1, 0.3]);
  B.caption([0, -2.8, 0], () => ['الجهاز التناسلي الأنثوي: مبيضان، أنبوبا فالوب بفتحتين قمعيتين مهدبتين', 'والرحم وعنقه والمهبل']);
  return { dist: 8.6, yaw: 0.15, pitch: 0.15, target: [0, -0.1, 0] };
}

/* ═════════════ 4) الإخصاب والحمل والولادة والرضاعة (ص112–115) — يتبع المرحلة ═════════════ */
function fertModel(B){
  const ut = femaleBase(B, { dyn: true });
  /* الإخصاب في الثلث العلوي لقناة البيض: بيضة تحيط بها نطف */
  const FS = [-1.85, 1.55, 0.05];
  const site = B.add(merge([ball(0.15, FS, 10)].concat(Array.from({ length: 7 }, (_, i) => { const a = i * 0.9; return tube({ pts: [add(FS, [Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.05]), add(FS, [Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0.05])], r: 0.012, sides: 3 }); }))), fx('huFertSite', '#f6e0a0', { pop: false }));
  /* الزايكوت ينحدر في قناة البيض إلى جدار الرحم */
  const tp = spline(tubePts(-1).slice().reverse(), 6, false), zygAt = u => { const i = Math.min(tp.length - 2, Math.floor(u * (tp.length - 1))), f = u * (tp.length - 1) - i; return add(mul(tp[i], 1 - f), mul(tp[i + 1], f)); };
  const zyg = B.add(ball(0.1, zygAt(0), 10), fx('huZygote', '#f0a040', { pop: false, center: [-1.2, 1.3, 0] }));
  /* الكيس الجنيني (السائل السلوي) والجنين، ثم المشيمة */
  const fetus = s => merge([ball(0.22 * s, [0.05, 0.75 * s + 0.1, 0.05], 10), place(ellipsoid({ r: [0.3 * s, 0.38 * s, 0.26 * s], rows: 10, cols: 12 }), { at: [0, 0.3 * s + 0.1, 0.05] }),
    tube({ pts: [[0.1 * s, 0.25 * s + 0.1, 0.2 * s], [0.25 * s, 0.05 * s + 0.1, 0.25 * s], [0.15 * s, -0.1 * s + 0.1, 0.15 * s]], r: 0.06 * s, sides: 5 })]);
  const amn = s => ball(0.62 * s, [0, 0.45 * s + 0.1, 0], 16);
  const emb = B.add(fetus(0.5), fx('huEmbryo', '#f2b8a8', { pop: false, center: [0, 0.5, 0] }));
  const amO = B.add(amn(0.5), fx('huAmnion', '#c8e8ff', { alpha: 0.35, shell: { size: 1.4 }, pop: false, center: [0, 0.5, 0] }));
  const plac = s => place(ellipsoid({ r: [0.4 * s, 0.1 * s, 0.35 * s], rows: 10, cols: 14 }), { at: [0.1, 0.45 + 1.0 * s, -0.1] });
  const plO = B.add(plac(1), fx('huPlacenta', '#a02a3a', { pop: false, center: [0, 1.2, 0] }));
  const cl = B.add(ball(0.16, [-1.62, 0.62, 0.22], 10), fx('huCL', '#f6d040', { pop: false }));
  /* الرضاعة: الغدد اللبنية (فصوص وقنوات) */
  const MG = [-3.3, -1.2, 0];
  const mam = B.add(merge([place(ellipsoid({ r: [0.75, 0.7, 0.4], rows: 14, cols: 18 }), { at: MG })]), fx('huMammary', '#f2c0b0', { alpha: 0.4, shell: { size: 1.4 }, pop: false }));
  const lobes = B.add(merge(Array.from({ length: 9 }, (_, i) => { const a = i / 9 * 6.2832, p = add(MG, [Math.cos(a) * 0.42, Math.sin(a) * 0.4, 0.05]); return merge([ball(0.1, p, 6), tube({ pts: [p, add(MG, [0.0, 0, 0.38])], r: 0.02, sides: 4 })]); })), fx('huMammary', '#e88aa0', { pop: false }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('huFertSite', add(FS, [0, 0.2, 0]), [-0.6, 1, 0], vis(0));
  B.label('huZygote', [-1.3, 1.6, 0.1], [-0.4, 1, 0.2], vis(1));
  B.label('huAmnion', [0.5, 0.6, 0.1], [1, 0.2, 0.3], vis(2, 3, 4));
  B.label('huEmbryo', [0.15, 0.3, 0.2], [1, -0.2, 0.4], vis(2, 3, 4, 5));
  B.label('huCL', [-1.62, 0.75, 0.3], [-1, 0.4, 0.4], vis(3));
  B.label('huPlacenta', [0.4, 1.5, -0.1], [1, 0.6, 0], vis(3, 4));
  B.label('huUterus', [1.0, 0.3, 0], [1, 0, 0.2]);
  B.label('huCervix', [-0.3, -0.75, 0], [-1, -0.1, 0.2]);
  B.label('huVagina', [0.36, -1.9, 0], [1, -0.3, 0.2]);
  B.label('huMammary', add(MG, [-0.7, 0.2, 0]), [-1, 0.2, 0.2], vis(6));
  B.caption([0, -2.8, 0], () => [(HU_FERT_STAGES[STG.idx] || {}).n || '']);
  return { dist: 10, yaw: 0.15, pitch: 0.12, target: [-0.6, 0, 0], live2d: true,
    anim(){ const s = STG.idx, k = sm(STG.k);
      site.hide = s !== 0; zyg.hide = s !== 1; if (s === 1) B.update(zyg, ball(0.1, zygAt(k * 0.95), 10));
      const us = s <= 1 ? 1 : s === 2 ? 1.05 : s === 3 ? 1.1 + 0.15 * k : s === 4 ? 1.25 + 0.15 * k : s === 5 ? 1.4 - 0.4 * k : 1; B.update(ut, uterusM(us));
      const fs = s === 2 ? 0.45 + 0.1 * k : s === 3 ? 0.6 + 0.15 * k : s === 4 ? 0.8 + 0.3 * k : 1.1;
      emb.hide = !(s >= 2 && s <= 5); amO.hide = !(s >= 2 && s <= 4);
      if (s >= 2 && s <= 4){ B.update(emb, fetus(fs)); B.update(amO, amn(fs)); }
      if (s === 5) B.update(emb, place(fetus(1.1), { at: [0, -1.9 * k, 0] }));
      plO.hide = !(s === 3 || s === 4); if (s === 3 || s === 4) B.update(plO, plac(fs));
      cl.hide = s !== 3; mam.hide = lobes.hide = s !== 6;
    } };
}

/* ═════════════ 5) أحداث الدورة المبيضية — شكل (3-41) (ص119) ═════════════ */
function ovcModel(B){
  B.add(place(ellipsoid({ r: [2.6, 1.6, 1.0], rows: 20, cols: 30 }), {}), fx('huOvary', '#f2d8b0', { alpha: 0.3, shell: { size: 6 }, rimColor: '#fff4e0' }));
  /* حويصلات بأحجام متزايدة حول المبيض (بعكس عقارب الساعة كما في الشكل) */
  const at = a => [Math.cos(a) * 1.9, Math.sin(a) * 1.05, 0.35];
  B.add(merge([0, 1].map(i => ball(0.1, add(at(2.6), [i * 0.2, 0.05, 0]), 8))), fx('huPrimord', '#f6e8c8'));
  B.add(ball(0.18, at(1.95), 10), fx('huPrimF', '#f6d8b0'));
  B.add(ball(0.3, at(1.3), 12), fx('huSecF', '#f4c8a0', { alpha: 0.7 }));
  B.add(ball(0.5, at(0.35), 16), fx('huMatF', '#cfe7ff', { alpha: 0.45, shell: { size: 1.2 } }));
  B.add(ball(0.17, add(at(0.35), [-0.12, -0.12, 0.25]), 12), fx('ooSec', '#f0a040'));
  B.add(ball(0.06, add(at(0.35), [0.1, -0.24, 0.32]), 8), fx('polar1', '#f6e070'));
  const ov = k => ball(0.14, add(at(-0.55), [0.5 * k, -0.4 * k, 0.4 + 0.4 * k]), 10);
  const ovO = B.add(ov(0), fx('huOvul', '#f0a040', { pop: false, center: at(-0.5) }));
  B.add(place(ellipsoid({ r: 0.42, rows: 12, cols: 16, disp: d => 1 + 0.18 * Math.sin(d[0] * 8) * Math.sin(d[1] * 8) }), { at: at(-1.6) }), fx('huCL', '#f6c840', { rimColor: '#fff0b0' }));
  B.add(place(ellipsoid({ r: 0.28, rows: 10, cols: 14, disp: d => 1 + 0.2 * Math.sin(d[0] * 6) * Math.sin(d[2] * 6) }), { at: at(-2.6) }), fx('huCA', '#f4f4f0'));
  B.label('huPrimord', at(2.6), [-0.6, 1, 0.3]);
  B.label('huPrimF', at(1.95), [-0.2, 1, 0.3]);
  B.label('huSecF', at(1.3), [0.3, 1, 0.3]);
  B.label('huMatF', add(at(0.35), [0.4, 0.2, 0]), [1, 0.4, 0.2]);
  B.label('ooSec', add(at(0.35), [-0.12, -0.12, 0.42]), [1, -0.2, 0.6]);
  B.label('polar1', add(at(0.35), [0.1, -0.24, 0.38]), [1, -0.6, 0.4]);
  B.label('huOvul', add(at(-0.55), [0.3, -0.25, 0.6]), [1, -0.5, 0.4]);
  B.label('huCL', add(at(-1.6), [0, -0.4, 0.2]), [0.2, -1, 0.3]);
  B.label('huCA', add(at(-2.6), [-0.28, 0, 0]), [-1, -0.3, 0.2]);
  B.label('huOvary', [-2.5, 0.4, 0.2], [-1, 0.3, 0.2]);
  B.caption([0, -2.0, 0], () => ['أحداث الدورة المبيضية: حوصلة بدائية ← أولية ← ثانوية ← ناضجة (حويصلة كراف) ← الإباضة', 'ثم الجسم الأصفر، وعند عدم حصول حمل يتحول إلى الجسم الأبيض']);
  return { dist: 8.2, yaw: 0.1, pitch: 0.2, target: [0, -0.1, 0], live2d: true, anim(t){ B.update(ovO, ov((t * 0.3) % 1)); } };
}

/* ═════════════ 6) التكاثر الخنثي (ص125) ═════════════ */
const worm = (P, r, seg) => merge([tube({ pts: P, r: u => r * (1 - 0.35 * Math.abs(u - 0.4)), sides: 10 })].concat(seg ? P.filter((_, i) => i % 2 === 0).map(p => place(ellipsoid({ r: [r * 1.05, r * 1.05, 0.02], rows: 4, cols: 12 }), { at: p })) : []));
function hermModel(B){
  /* دودتا أرض متقابلتان رأساً لذيل تتبادلان الخلايا التناسلية */
  const W1 = Array.from({ length: 21 }, (_, i) => [-2.2 + i * 0.22, 1.2 + Math.sin(i * 0.4) * 0.08, 0.18]);
  const W2 = Array.from({ length: 21 }, (_, i) => [2.2 - i * 0.22, 1.2 + Math.sin(i * 0.4 + 1) * 0.08, -0.18]);
  B.add(merge([worm(W1, 0.16), worm(W2, 0.16)]), fx('huEarthworm', '#d88a8a', { rimColor: '#ffd8d8' }));
  B.add(merge([place(capsule({ r: 0.2, len: 0.45, rows: 4, cols: 14 }), { rot: [0, 0, Math.PI / 2], at: [-1.0, 1.2, 0.18] }), place(capsule({ r: 0.2, len: 0.45, rows: 4, cols: 14 }), { rot: [0, 0, Math.PI / 2], at: [1.0, 1.2, -0.18] })]), fx('huEarthworm', '#b8606a'));
  const ex = t => merge(Array.from({ length: 10 }, (_, i) => { const u = (t * 0.4 + i / 10) % 1, sg = i % 2 ? 1 : -1; return ball(0.06, [sg * (0.7 - 1.4 * u), 1.2, sg * (0.18 - 0.36 * u)], 6); }));
  const exO = B.add(ex(0), fx('huSpEx', '#ffffff', { pop: false, center: [0, 1.2, 0] }));
  /* مادة مخاطية تربط الدودتين أثناء التبادل */
  B.add(place(capsule({ r: 0.32, len: 1.4, rows: 4, cols: 16 }), { rot: [0, 0, Math.PI / 2], at: [0, 1.2, 0] }), fx('huSpEx', '#e8f4ff', { alpha: 0.3, shell: { size: 1.2 } }));
  /* النضج في أوقات متباينة: منطقة الخصى تنضج قبل منطقة المبايض في الدودة نفسها */
  const W3 = Array.from({ length: 21 }, (_, i) => [-2.0 + i * 0.2, 0, 0]);
  B.add(worm(W3, 0.14), { color: '#e0a0a0', rim: 0.5 });
  const zone = x => place(capsule({ r: 0.17, len: 0.3, rows: 4, cols: 14 }), { rot: [0, 0, Math.PI / 2], at: [x, 0, 0] });
  const tm = B.add(merge([zone(-0.6), zone(0.5)]), fx('huTimeMat', '#7aa0f0', { pop: false }));
  /* الدودة الشريطية: قطع تحمل كل منها أعضاء ذكرية وأنثوية */
  const TP = [-2.4, -1.3, 0];
  B.add(merge([ball(0.12, TP, 8)].concat(Array.from({ length: 14 }, (_, i) => place(G3.superEll({ h: [0.1 + i * 0.008, 0.06, 0.12 + i * 0.012], e: 0.3, rows: 4, cols: 10 }), { at: add(TP, [0.25 + i * (0.24 + i * 0.008), Math.sin(i * 0.5) * 0.05, 0]) })))), fx('huTapeworm', '#f2ead0', { rimColor: '#ffffff' }));
  B.label('huEarthworm', [-1.6, 1.35, 0.2], [-0.5, 1, 0.2]);
  B.label('huSpEx', [0, 1.25, 0.1], [0, 1, 0.4]);
  B.label('huTimeMat', [0.5, 0.15, 0], [0.5, 1, 0.3]);
  B.label('huTapeworm', [1.0, -1.25, 0.1], [0.5, -1, 0.3]);
  B.caption([0, -2.0, 0], () => ['التكاثر الخنثي: أعضاء ذكرية وأنثوية في الفرد نفسه', 'دودة الأرض تتبادل النطف ولا تخصب نفسها (تنضج أعضاؤها في أوقات متباينة) · الدودة الشريطية تخصب نفسها']);
  return { dist: 8.6, yaw: 0.2, pitch: 0.3, target: [0, 0, 0], live2d: true,
    anim(t){ B.update(exO, ex(t)); const ph = (t * 0.25) % 1; tm.col = ph < 0.5 ? [0.48, 0.63, 0.94] : [0.94, 0.55, 0.7]; } };
}

/* ═════════════ 7) الدورة المبيضية والرحمية (ص117–121) — ثلاث محطات تتحرك مع اليوم ═════════════
   يسار: المبيض وحوصلة واحدة تتطور · وسط: أعمدة الهرمونات الأربعة · يمين: جدار الرحم (بطانته تتغير) */
function mensModel(B){
  const day = () => { const s = HU_MENS_STAGES[STG.idx] || HU_MENS_STAGES[0]; return s.a + Math.min(0.999, STG.k) * (s.b - s.a + 1); };
  /* المبيض والحوصلة */
  const OV = [-2.6, -0.45, 0];
  B.add(place(ellipsoid({ r: [0.95, 1.2, 0.7], rows: 16, cols: 22 }), { at: OV }), fx('huOvary', '#f2d8b0', { alpha: 0.28, shell: { size: 3 }, rimColor: '#fff4e0' }));
  const F = add(OV, [0.15, 0.1, 0.35]);
  const prim = B.add(merge([ball(0.1, F, 8), ball(0.05, add(F, [0, 0, 0.09]), 6)]), fx('huPrimord', '#f6e8c8', { pop: false }));
  const primF = B.add(merge([ball(0.18, add(F, [-0.25, 0.35, 0]), 10), ball(0.08, add(F, [-0.25, 0.35, 0.14]), 8)]), fx('huPrimF', '#f6d8b0', { pop: false }));
  const secF = B.add(ball(0.3, add(F, [0.15, -0.15, 0]), 12), fx('huSecF', '#f4c8a0', { alpha: 0.65, pop: false }));
  const matF = B.add(ball(0.52, F, 16), fx('huMatF', '#cfe7ff', { alpha: 0.45, shell: { size: 1.2 }, pop: false }));
  const matE = B.add(ball(0.17, add(F, [-0.15, -0.12, 0.3]), 12), fx('huMatF', '#f0a040', { pop: false }));
  const egg = k => ball(0.16, add(F, [0.3 + k * 1.0, 0.25 + k * 0.6, 0.5 + k * 0.4]), 12);
  const ovO = B.add(egg(0), fx('huOvul', '#f0a040', { pop: false, center: F }));
  const cl = B.add(place(ellipsoid({ r: 0.5, rows: 12, cols: 16, disp: d => 1 + 0.16 * Math.sin(d[0] * 8) * Math.sin(d[1] * 8) }), { at: F }), fx('huCL', '#f6c840', { pop: false }));
  const ca = B.add(place(ellipsoid({ r: 0.26, rows: 10, cols: 14, disp: d => 1 + 0.2 * Math.sin(d[0] * 6) * Math.sin(d[2] * 6) }), { at: F }), fx('huCA', '#f4f4f0', { pop: false }));
  /* أعمدة الهرمونات: الارتفاع = مستوى الهرمون في اليوم */
  const HB = [['huFSH', 'fsh', '#5a8ae8', -0.75, [-1, 0.5, 0.3]], ['huLH', 'lh', '#e8607a', -0.25, [-0.5, -1, 0.5]], ['huEstro', 'est', '#e8a0e0', 0.25, [0.5, -1, 0.5]], ['huProg', 'prog', '#f0c040', 0.75, [1, 0.5, 0.3]]];
  const bar = (x, v) => place(G3.superEll({ h: [0.18, Math.max(0.02, v * 1.3), 0.18], e: 0.3, rows: 6, cols: 10 }), { at: [x, -1.1 + Math.max(0.02, v * 1.3), 0] });
  const bars = HB.map(([id, key, col, x, nd]) => ({ id, key, x, nd, o: B.add(bar(x, 0.5), fx(id, col, { pop: false, center: [x, -0.5, 0] })) }));
  B.add(place(G3.superEll({ h: [1.15, 0.03, 0.35], e: 0.3, rows: 4, cols: 10 }), { at: [0, -1.12, 0] }), { color: '#5a4a5a', rim: 0.3 });
  /* جدار الرحم: طبقة عضلية ثابتة وفوقها البطانة؛ سمكها من منحنى الملزمة */
  const UX = 2.6;
  B.add(place(G3.superEll({ h: [0.9, 0.2, 0.6], e: 0.25, rows: 6, cols: 12 }), { at: [UX, -1.0, 0] }), { color: '#b04050', rim: 0.4, rimColor: '#ffb0b8' });
  const th = d => huCurve(HU_TH, d) / 84 * 0.5;
  const lining = (d, w) => place(G3.superEll({ h: [0.88, Math.max(0.03, th(d) * 0.9), 0.58], e: 0.35, rows: 6, cols: 12, disp: q => 1 + w * 0.08 * Math.sin(q[0] * 9) }), { at: [UX, -0.8 + Math.max(0.03, th(d) * 0.9), 0] });
  const men = B.add(lining(3, 1), fx('huMenses', '#c0303a', { pop: false, center: [UX, -0.6, 0] }));
  const pro = B.add(lining(10, 0), fx('huProlif', '#f08aa0', { pop: false, center: [UX, -0.4, 0] }));
  const sec = B.add(lining(22, 0.5), fx('huSecret', '#e86a8a', { pop: false, center: [UX, -0.2, 0] }));
  const glands = d => merge(Array.from({ length: 6 }, (_, i) => { const x = UX - 0.65 + i * 0.26, h = th(d) * 1.6; return tube({ pts: Array.from({ length: 9 }, (_, j) => [x + Math.sin(j * 1.6) * 0.05, -0.75 + j / 8 * h, 0.5]), r: 0.025, sides: 4 }); }));
  const glO = B.add(glands(22), fx('huSecret', '#ffd0dc', { pop: false, center: [UX, -0.3, 0] }));
  const drops = t => merge(Array.from({ length: 8 }, (_, i) => { const u = (t * 0.5 + i / 8) % 1; return ball(0.05, [UX - 0.6 + i * 0.17, -0.85 - u * 0.9, 0.55], 6); }));
  const drO = B.add(drops(0), fx('huMenses', '#d0202a', { pop: false, center: [UX, -1.2, 0] }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('huOvary', add(OV, [-0.95, 0.4, 0]), [-1, 0.3, 0]);
  B.label('huPrimord', add(F, [0, 0.12, 0.05]), [-0.4, 1, 0.3], vis(0));
  B.label('huPrimF', add(F, [-0.25, 0.52, 0]), [-0.4, 1, 0.3], vis(1));
  B.label('huSecF', add(F, [0.42, -0.15, 0]), [1, -0.3, 0.3], vis(1));
  B.label('huMatF', add(F, [0, 0.52, 0]), [0, 1, 0.3], vis(2));
  B.label('huOvul', add(F, [0.5, 0.4, 0.6]), [0.3, 1, 0.5], vis(3));
  B.label('huCL', add(F, [0, 0.5, 0]), [0, 1, 0.3], vis(4));
  B.label('huCA', add(F, [0, 0.27, 0]), [0, 1, 0.3], vis(5));
  bars.forEach(b => B.label(b.id, [b.x, -1.05, 0.2], b.nd));
  B.label('huMenses', [UX + 0.88, -0.75, 0], [1, -0.2, 0], vis(0));
  B.label('huProlif', [UX + 0.88, -0.6, 0], [1, 0, 0], vis(1, 2, 3));
  B.label('huSecret', [UX + 0.88, -0.4, 0], [1, 0.2, 0], vis(4, 5));
  B.caption([0, 1.5, 0], () => ['اليوم ' + Math.floor(day()) + ' من 28 — ' + ((HU_MENS_STAGES[STG.idx] || {}).n || '').replace(/^\d+ · /, '')]);
  B.caption([0, -1.75, 0], () => ['المبيض (الحوصلة)   ·   الهرمونات: FSH · LH · الإستروجين · البروجسترون   ·   بطانة الرحم']);
  return { dist: 9.0, yaw: 0, pitch: 0.12, target: [0, 0.1, 0], live2d: true, noSpin: true,
    anim(t){ const s = STG.idx, k = STG.k, d = day();
      prim.hide = s !== 0; primF.hide = secF.hide = s !== 1; matF.hide = matE.hide = s !== 2;
      ovO.hide = s !== 3; if (s === 3) B.update(ovO, egg(k)); cl.hide = s !== 4; ca.hide = s !== 5;
      bars.forEach(b => B.update(b.o, bar(b.x, huCurve(HU_H[b.key], d))));
      men.hide = drO.hide = d >= 6; pro.hide = !(d >= 6 && d < 15); sec.hide = glO.hide = d < 15;
      if (d < 6){ B.update(men, lining(d, 1)); B.update(drO, drops(t)); }
      else if (d < 15) B.update(pro, lining(d, 0)); else { B.update(sec, lining(d, 0.5)); B.update(glO, glands(d)); }
    } };
}

Object.assign(G3.models, { cy_cyvMens: mensModel, hu_huvMale: maleModel, hu_huvSperm: spermModel, hu_huvFemale: femaleModel, hu_huvFert: fertModel, cy_cyvOv: ovcModel, cy_cyvHerm: hermModel });
})();
