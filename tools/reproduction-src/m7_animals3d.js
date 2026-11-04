
/* ══════════════════════════════════════════════════════════════════════════
   9.7 · مجسّمات التكاثر في الحشرات والضفدع (ملزمة ص93–104) — الأجهزة
         التناسلية والتزاوج والإخصاب ودورة حياة الضفدع، بنفس أجزاء الرسوم.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, srng } = G3;
const fx = (part, color, extra) => Object.assign({ part, color, rim: 0.8, rimColor: '#ffffff' }, extra || {});
const sm = k => k * k * (3 - 2 * k);
const ball = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
const MX = p => [-p[0], p[1], p[2]];
const pipe = (pts, r, sides) => tube({ pts: spline(pts, 6, false), r, sides: sides || 8 });
/* أنبوب ملتوٍ (قناة ملفوفة) بين نقطتين */
const coil = (a, b, turns, amp, r) => { const pts = []; for (let i = 0; i <= turns * 10; i++){ const u = i / (turns * 10); pts.push(add(add(mul(a, 1 - u), mul(b, u)), [Math.sin(u * turns * 6.2832) * amp, 0, Math.cos(u * turns * 6.2832) * amp])); } return tube({ pts, r, sides: 6 }); };

/* ═════════════ 1) الجهاز التناسلي الذكري في الحشرات (ص94) ═════════════ */
function iMaleModel(B){
  const T = [0.75, 1.5, 0];
  const both = f => merge([f(1), f(-1)]);
  B.add(both(sg => place(ellipsoid({ r: [0.32, 0.45, 0.28], rows: 14, cols: 18 }), { at: [sg * T[0], T[1], 0] })), fx('anTestis', '#b8a8f0', { alpha: 0.5, shell: { size: 0.9 }, rimColor: '#ece6ff' }));
  B.add(both(sg => merge([-0.16, -0.05, 0.06, 0.17].map(dx => pipe([[sg * (T[0] + dx), T[1] + 0.32, 0.05], [sg * (T[0] + dx * 1.2), T[1], 0.12], [sg * (T[0] + dx * 0.4), T[1] - 0.32, 0.05]], 0.03, 5)))), fx('anSemTub', '#6a4ad0'));
  const VD = sg => [[sg * T[0], T[1] - 0.4, 0], [sg * 0.85, 0.5, 0], [sg * 0.55, -0.2, 0], [sg * 0.25, -0.9, 0]];
  B.add(both(sg => pipe(VD(sg), 0.04)), fx('anVasDef', '#3a7ad8', { rimColor: '#c0e0ff' }));
  B.add(both(sg => pipe([[sg * 0.82, 0.25, 0.05], [sg * 0.68, -0.1, 0.05], [sg * 0.52, -0.45, 0.05]], 0.12)), fx('anSemVes', '#8fe0c8', { rimColor: '#e0fff4' }));
  B.add(both(sg => pipe([[sg * 0.22, 2.0, 0.15], [sg * 0.25, 0.8, 0.15], [sg * 0.15, -0.9, 0.1]], 0.09)), fx('anIAccM', '#4a9ae8', { rimColor: '#d0e8ff' }));
  B.add(pipe([[0, -0.95, 0], [0, -1.6, 0]], 0.08), fx('anEjac', '#3a7ad8'));
  B.add(place(capsule({ r: 0.1, len: 0.3, rows: 4, cols: 10 }), { at: [0, -1.82, 0] }), fx('anPenis', '#2a5ab0'));
  B.add(tube({ pts: Array.from({ length: 13 }, (_, i) => [Math.cos(i / 12 * 6.2832) * 0.12, -2.05, Math.sin(i / 12 * 6.2832) * 0.12]), r: 0.03, sides: 5 }), fx('anGenOp', '#e8e8f0'));
  B.label('anTestis', [T[0] + 0.3, T[1] + 0.2, 0], [1, 0.4, 0]);
  B.label('anSemTub', [-T[0], T[1] + 0.3, 0.15], [-1, 0.5, 0.3]);
  B.label('anVasDef', [0.85, 0.5, 0], [1, 0.1, 0]);
  B.label('anSemVes', [0.7, -0.1, 0.15], [1, -0.2, 0.3]);
  B.label('anIAccM', [-0.25, 0.8, 0.2], [-1, 0, 0.3]);
  B.label('anEjac', [0, -1.3, 0.08], [1, -0.2, 0.3]);
  B.label('anPenis', [0, -1.85, 0.1], [1, -0.3, 0.3]);
  B.label('anGenOp', [-0.12, -2.05, 0], [-1, -0.4, 0.2]);
  B.caption([0, -2.5, 0], () => ['الجهاز التناسلي الذكري في الحشرات: خصيتان من نبيبات منوية، وعاءان ناقلان وحويصلتان منويتان', 'وغدتان مساعدتان تصبان في قناة القذف التي تنتهي بالقضيب']);
  return { dist: 8.6, yaw: 0.25, pitch: 0.15, target: [0, -0.1, 0] };
}

/* ═════════════ 2) الجهاز التناسلي الأنثوي في الحشرات (ص94) ═════════════ */
function iFemaleModel(B){
  const O = [1.0, 1.2, 0];
  const both = f => merge([f(1), f(-1)]);
  /* المبيض: حزمة فريعات بيض (أنابيب فيها بيوض تكبر للأسفل) تلتقي في خيط علوي */
  B.add(both(sg => place(ellipsoid({ r: [0.55, 0.85, 0.4], rows: 14, cols: 18 }), { at: [sg * O[0], O[1], 0] })), fx('anIOvary', '#f6c060', { alpha: 0.25, shell: { size: 1.6 }, rimColor: '#fff0c0' }));
  const ovl = sg => merge(Array.from({ length: 5 }, (_, i) => { const x = sg * (O[0] + (i - 2) * 0.17), top = [sg * O[0], 2.6, 0], bot = [x, 0.5, 0];
    return merge([tube({ pts: [top, [x, 1.9, 0], bot], r: 0.035, sides: 5 })].concat([0, 1, 2, 3].map(j => ball(0.05 + j * 0.022, [x, 1.75 - j * 0.33, 0.02], 6)))); }));
  B.add(both(ovl), fx('anOvariole', '#f6a83a', { rimColor: '#ffe0b0' }));
  B.add(both(sg => pipe([[sg * O[0], 0.4, 0], [sg * 0.6, -0.1, 0], [sg * 0.15, -0.4, 0]], 0.09)), fx('anLatOvi', '#f0a040'));
  B.add(pipe([[0, -0.4, 0], [0, -1.0, 0]], 0.11), fx('anMedOvi', '#e89030'));
  B.add(place(G3.superEll({ h: [0.5, 0.35, 0.3], e: 0.3, rows: 6, cols: 12 }), { at: [0, -1.4, 0] }), fx('anVagina', '#f2b84a', { rimColor: '#fff0c0' }));
  B.add(merge([pipe([[0.15, -1.1, 0.2], [0.5, -0.7, 0.3], [0.7, -0.5, 0.3]], 0.03), ball(0.15, [0.75, -0.45, 0.3], 10)]), fx('anSpth', '#f08060', { rimColor: '#ffd0c0' }));
  B.add(merge([pipe([[0.8, -0.38, 0.3], [1.05, -0.1, 0.3], [1.15, 0.2, 0.3]], 0.04), ball(0.08, [1.18, 0.25, 0.3], 8)]), fx('anSpthGl', '#e86080'));
  B.add(both(sg => pipe([[sg * 0.4, -1.4, -0.15], [sg * 0.95, -1.2, -0.15], [sg * 1.25, -0.6, -0.15], [sg * 1.2, -0.2, -0.15]], 0.07)), fx('anIAccF', '#f0a040'));
  B.label('anIOvary', [-O[0] - 0.5, O[1], 0], [-1, 0.2, 0]);
  B.label('anOvariole', [O[0] + 0.35, 1.6, 0.05], [1, 0.4, 0.2]);
  B.label('anLatOvi', [-0.6, -0.1, 0.05], [-1, -0.2, 0.2]);
  B.label('anMedOvi', [0.08, -0.7, 0.08], [-1, -0.1, 0.4]);
  B.label('anVagina', [-0.5, -1.45, 0], [-1, -0.4, 0.2]);
  B.label('anSpth', [0.85, -0.45, 0.35], [1, -0.1, 0.3]);
  B.label('anSpthGl', [1.2, 0.25, 0.3], [1, 0.3, 0.3]);
  B.label('anIAccF', [1.25, -0.6, -0.15], [1, -0.4, -0.2]);
  B.caption([0, -2.1, 0], () => ['الجهاز التناسلي الأنثوي في الحشرات: مبيضان من فريعات بيض، قناتا بيض جانبيتان وقناة بيض رئيسة', 'تفتح في المهبل، ومستودع منوي بغدته، وغدتان مساعدتان']);
  return { dist: 8.4, yaw: 0.2, pitch: 0.15, target: [0, 0.3, 0] };
}

/* حشرة: رأس وصدر وبطن مقسّم وستة أرجل وأجنحة وقرنا استشعار (dir اتجاه الرأس على المحور x) */
function insect(at, s, dir, abdCol, wing){
  const d = dir || 1, P = v => add(at, mul([v[0] * d, v[1], v[2]], s)), out = [], legs = [];
  out.push(ball(0.16 * s, P([0.62, 0.05, 0]), 10), place(ellipsoid({ r: [0.24 * s, 0.17 * s, 0.17 * s], rows: 10, cols: 12 }), { at: P([0.32, 0, 0]) }));
  const abd = merge([0, 1, 2, 3, 4].map(i => place(ellipsoid({ r: [0.14 * s, 0.17 * s * (1 - i * 0.08), 0.16 * s * (1 - i * 0.08)], rows: 8, cols: 12 }), { at: P([0 - i * 0.2, -0.02, 0]) })));
  [-1, 1].forEach(sz => [0.42, 0.32, 0.22].forEach(x => legs.push(tube({ pts: [P([x, -0.05, sz * 0.12]), P([x + 0.1 * (x - 0.32) * 4, 0.1, sz * 0.45]), P([x + 0.15 * (x - 0.32) * 4, -0.35, sz * 0.6])], r: 0.018 * s, sides: 4 }))));
  [-1, 1].forEach(sz => legs.push(tube({ pts: [P([0.72, 0.12, sz * 0.06]), P([0.95, 0.4, sz * 0.2]), P([1.1, 0.45, sz * 0.35])], r: 0.012 * s, sides: 4 })));
  const wings = wing === false ? null : merge([-1, 1].map(sz => place(ellipsoid({ r: [0.5 * s, 0.02 * s, 0.16 * s], rows: 4, cols: 10 }), { at: P([-0.15, 0.2, sz * 0.22]), dir: [d, 0.1, sz * 0.4] })));
  return { body: merge(out), abd, legs: merge(legs), wings };
}

/* ═════════════ 3) الإخصاب والتكاثر في الحشرات (ص96–97) — كل مرحلة بمشهدها ═════════════
   1 الجماع (ذكر وأنثى متلاصقان، الأنثى أكبر) · 2 النطف بكيس النطف في المهبل والمستودع المنوي يتسلمها
   3 بيضة تنزل من قناة البيض الرئيسة إلى المهبل والمستودع يطلق النطف فتخصبها
   4 حشرة بيوضة (أنثى الصرصر) تحمل كيس البيض · 5 حشرة بيوضة ولودة: البيوض تفقس داخلها وتخرج الصغار */
function iFertModel(B){
  /* المشهد 1: الجماع */
  /* الجماع: الذكر والأنثى متقابلان بنهايتي بطنيهما */
  const F = insect([-1.45, 0.05, 0], 1.7, -1, '#e8803a'), M = insect([1.15, 0.08, 0], 1.25, 1, '#8a5ad8');
  const mate = [B.add(merge([F.body, F.abd, F.legs]), fx('anMating', '#e8803a', { pop: false })), B.add(F.wings, fx('anMating', '#e8f4ff', { alpha: 0.5, pop: false })),
    B.add(merge([M.body, M.abd, M.legs]), fx('anMating', '#8a5ad8', { pop: false })), B.add(M.wings, fx('anMating', '#e8f4ff', { alpha: 0.5, pop: false }))];
  /* المشهدان 2 و3: الجهاز الأنثوي مكبّراً — قناة بيض رئيسة تفتح في المهبل، ومستودع منوي على جداره الظهري */
  const V = [0, -0.5, 0], SP = [1.0, 0.25, 0.2];
  const organ = [B.add(pipe([[0, 1.6, 0], [0, -0.05, 0]], 0.16), fx('anMedOvi', '#e89030', { pop: false })),
    B.add(place(G3.superEll({ h: [0.75, 0.5, 0.45], e: 0.3, rows: 6, cols: 14 }), { at: V }), fx('anVagina', '#f2b84a', { alpha: 0.45, shell: { size: 1.2 }, pop: false })),
    B.add(merge([pipe([[0.35, -0.2, 0.2], [0.75, 0.05, 0.22], SP], 0.05)]), fx('anSpth', '#f08060', { pop: false })),
    B.add(ball(0.26, SP, 12), fx('anSpth', '#f08060', { alpha: 0.6, shell: { size: 0.5 }, pop: false }))];
  const sac = B.add(place(ellipsoid({ r: [0.36, 0.2, 0.22], rows: 10, cols: 14 }), { at: add(V, [-0.15, -0.1, 0.05]) }), fx('anSpermSac', '#f4f4f8', { alpha: 0.7, pop: false }));
  /* النطف: في المشهد 2 من كيس النطف إلى المستودع، وفي المشهد 3 من المستودع إلى البيضة في المهبل */
  const flow = (a, b, t) => merge(Array.from({ length: 12 }, (_, i) => { const u = (t + i / 12) % 1; return ball(0.045, add(add(mul(a, 1 - u), mul(b, u)), [Math.sin(i * 2.3) * 0.08, Math.cos(i * 1.7) * 0.05, Math.sin(i) * 0.06]), 5); }));
  const spIn = B.add(flow(add(V, [-0.15, -0.1, 0.1]), SP, 0), fx('anSpermSac', '#ffffff', { pop: false, center: V }));
  const EGG_END = add(V, [0, 0.05, 0.05]);
  const spOut = B.add(flow(SP, EGG_END, 0), fx('anIFert', '#ffffff', { pop: false, center: V }));
  const egg = k => place(ellipsoid({ r: [0.18, 0.28, 0.18], rows: 10, cols: 12 }), { at: [0, 1.5 - k * 1.95, 0.02] });
  const eggO = B.add(egg(0), fx('anIFert', '#f6e0a0', { rimColor: '#fffbe0', pop: false, center: V }));
  /* المشهد 4: حشرة بيوضة (أنثى الصرصر) تحمل كيس البيض عند نهاية بطنها */
  const O1 = insect([0.4, 0, 0], 1.7, 1, '#7a5030', false);
  const ovip = [B.add(merge([O1.body, O1.abd, O1.legs]), fx('anOvipar', '#7a5030', { pop: false }))];
  const eggSac = B.add(merge([place(ellipsoid({ r: [0.42, 0.22, 0.2], rows: 10, cols: 14 }), { at: [-1.2, -0.05, 0] })].concat([0, 1, 2, 3, 4, 5].map(i => place(ellipsoid({ r: [0.05, 0.09, 0.05], rows: 5, cols: 6 }), { at: [-1.5 + i * 0.12, -0.02, 0.18] })))), fx('anEggSac', '#c8a060', { pop: false }));
  /* المشهد 5: بيوضة ولودة — البيوض المخصبة تبقى داخل القناة المبيضية المشتركة وتفقس، ثم تخرج الصغار */
  const O2 = insect([0.4, 0, 0], 1.7, 1, '#5a7a8a', false);
  const vivi = [B.add(merge([O2.body, O2.legs]), fx('anVivipar', '#5a7a8a', { pop: false })), B.add(O2.abd, fx('anVivipar', '#8aaaba', { alpha: 0.4, shell: { size: 1.0 }, pop: false }))];
  const young = k => merge([0, 1, 2, 3].map(i => { const inside = [0.25 - i * 0.22, -0.03, (i % 2 ? 0.06 : -0.06)], out = [-1.0 - i * 0.35, -0.25 - (i % 2) * 0.12, (i % 2 ? 0.25 : -0.2)], f = Math.max(0, Math.min(1, k * 1.6 - i * 0.2)), p = add(mul(inside, 1 - f), mul(out, f));
    return place(ellipsoid({ r: [0.14, 0.07, 0.07], rows: 6, cols: 8 }), { at: p }); }));
  const youngO = B.add(young(0), fx('anVivipar', '#f0e0c0', { pop: false, center: [0, 0, 0] }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('anMating', [0.0, 0.2, 0.1], [0, 1, 0.3], vis(0));
  B.label('anMedOvi', [0.16, 1.0, 0.1], [1, 0.2, 0.3], vis(1, 2));
  B.label('anVagina', [-0.75, -0.6, 0], [-1, -0.2, 0.2], vis(1, 2));
  B.label('anSpth', add(SP, [0.26, 0.05, 0]), [1, 0.3, 0.3], vis(1, 2));
  B.label('anSpermSac', add(V, [-0.45, -0.15, 0.15]), [-1, -0.4, 0.4], vis(1));
  B.label('anIFert', EGG_END, [-0.5, 0.6, 0.6], vis(2));
  B.label('anOvipar', [0.6, 0.3, 0], [0.3, 1, 0.2], vis(3));
  B.label('anEggSac', [-1.4, -0.2, 0.1], [-1, -0.6, 0.3], vis(3));
  B.label('anVivipar', [0.6, 0.3, 0], [0.3, 1, 0.2], vis(4));
  B.caption([0, -1.6, 0], () => [(AN_IFERT_ST[STG.idx] || {}).n || '']);
  return { dist: 6.4, yaw: 0.25, pitch: 0.3, target: [0, 0, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      mate.forEach(o => o.hide = s !== 0);
      organ.forEach(o => o.hide = s !== 1 && s !== 2);
      sac.hide = spIn.hide = s !== 1; if (s === 1) B.update(spIn, flow(add(V, [-0.15, -0.1, 0.1]), SP, t * 0.35));
      eggO.hide = s !== 2; spOut.hide = !(s === 2 && k > 0.55); if (s === 2){ B.update(eggO, egg(k)); B.update(spOut, flow(SP, EGG_END, t * 0.4)); }
      ovip.forEach(o => o.hide = s !== 3); eggSac.hide = s !== 3;
      vivi.forEach(o => o.hide = s !== 4); youngO.hide = s !== 4; if (s === 4) B.update(youngO, young(k));
    } };
}

/* ═════════════ 4) الجهاز التناسلي الذكري في الضفدع (ص99) ═════════════ */
function fMaleModel(B){
  const both = f => merge([f(1), f(-1)]);
  const fat = sg => merge(Array.from({ length: 6 }, (_, i) => { const a = -0.6 + i * 0.24; return tube({ pts: [[sg * 0.85, 1.4, 0], [sg * (0.85 + Math.sin(a) * 0.35), 1.75 + Math.cos(a) * 0.15, 0.05]], r: q => 0.06 * (1 - q * 0.5), sides: 6 }); }));
  B.add(both(fat), fx('anFatBody', '#f6d040', { rimColor: '#fff4b0' }));
  B.add(both(sg => place(ellipsoid({ r: [0.2, 0.42, 0.16], rows: 12, cols: 14 }), { at: [sg * 0.95, 0.95, 0.05] })), fx('anFTestis', '#f6e070', { rimColor: '#fffbd0' }));
  B.add(both(sg => place(ellipsoid({ r: [0.18, 0.4, 0.015], rows: 6, cols: 10 }), { at: [sg * 1.2, 0.95, 0.0] })), fx('anMesorch', '#f0e8e0', { alpha: 0.55 }));
  B.add(both(sg => merge([0.8, 0.95, 1.1].map(y => pipe([[sg * 0.78, y, 0.05], [sg * 0.62, y - 0.05, 0.08], [sg * 0.48, y - 0.1, 0.1]], 0.018, 4)))), fx('anEffDuct', '#f0f0f0'));
  B.add(both(sg => place(ellipsoid({ r: [0.2, 0.8, 0.16], rows: 14, cols: 14 }), { at: [sg * 0.38, 0.35, 0.05] })), fx('anKidney', '#9a2a2a', { rimColor: '#ffb0a0' }));
  B.add(both(sg => pipe([[sg * 0.25, -0.35, 0.12], [sg * 0.3, -0.9, 0.1], [sg * 0.12, -1.35, 0.05]], 0.05)), fx('anUroDuct', '#f0a0a8'));
  B.add(both(sg => ball(0.12, [sg * 0.3, -0.85, 0.12], 10)), fx('anFSemVes', '#f6b8c0'));
  B.add(place(ellipsoid({ r: [0.75, 0.18, 0.3], rows: 10, cols: 16 }), { at: [0, -1.55, 0], rot: [0, 0, 0.12] }), fx('anCloaca', '#f0943a', { rimColor: '#ffd0a0' }));
  B.label('anFatBody', [0.95, 1.85, 0.05], [1, 0.6, 0]);
  B.label('anFTestis', [-0.95, 0.9, 0.2], [-1, 0, 0.3]);
  B.label('anMesorch', [-1.35, 1.2, 0], [-1, 0.4, 0]);
  B.label('anEffDuct', [0.62, 1.0, 0.1], [1, 0.3, 0.3]);
  B.label('anKidney', [0.55, 0.2, 0.1], [1, 0, 0.3]);
  B.label('anUroDuct', [0.3, -0.5, 0.15], [1, -0.2, 0.3]);
  B.label('anFSemVes', [-0.3, -0.85, 0.2], [-1, -0.2, 0.3]);
  B.label('anCloaca', [0.75, -1.55, 0], [1, -0.4, 0.2]);
  B.caption([0, -2.1, 0], () => ['الجهاز التناسلي الذكري في الضفدع: خصيتان معلقتان بمسراق الخصية، وقنيات صادرة إلى الكليتين', 'والقناتان البولية التناسلية بحويصلة منوية تصبان في المجمع']);
  return { dist: 7.8, yaw: 0.2, pitch: 0.15, target: [0, 0.1, 0] };
}

/* ═════════════ 5) الجهاز التناسلي الأنثوي في الضفدع (ص99) ═════════════ */
function fFemaleModel(B){
  const both = f => merge([f(1), f(-1)]);
  B.add(both(sg => merge(Array.from({ length: 5 }, (_, i) => tube({ pts: [[sg * 0.7, 1.35, 0], [sg * (0.6 + i * 0.07), 1.7, 0.05]], r: q => 0.05 * (1 - q * 0.5), sides: 6 })))), fx('anFatBody', '#f6d040'));
  const R = srng(4);
  B.add(merge([1, -1].map(sg => merge([place(ellipsoid({ r: [0.42, 0.62, 0.3], rows: 14, cols: 18, disp: d => 1 + 0.08 * Math.sin(d[0] * 9) * Math.cos(d[1] * 7) }), { at: [sg * 0.85, 0.75, 0.05] })]
    .concat(Array.from({ length: 14 }, () => ball(0.07, [sg * 0.85 + (R() - 0.5) * 0.6, 0.75 + (R() - 0.5) * 1.0, 0.3], 6)))))), fx('anFOvary', '#8a3ab0', { rimColor: '#e8c0ff' }));
  B.add(both(sg => place(ellipsoid({ r: [0.16, 0.5, 0.015], rows: 6, cols: 10 }), { at: [sg * 1.28, 0.8, 0] })), fx('anMesovar', '#f0e8e0', { alpha: 0.55 }));
  B.add(both(sg => place(ellipsoid({ r: [0.16, 0.7, 0.13], rows: 12, cols: 12 }), { at: [sg * 0.3, 0.3, 0.1] })), fx('anKidney', '#9a2a2a'));
  B.add(both(sg => pipe([[sg * 0.22, -0.4, 0.15], [sg * 0.15, -1.0, 0.1], [sg * 0.08, -1.35, 0.05]], 0.03)), fx('anUreter', '#f0e0a0'));
  /* قناة البيض الملتوية من الفتحة المهدبة في الأعلى إلى كيس البيض */
  B.add(both(sg => coil([sg * 1.55, 1.9, -0.1], [sg * 1.5, -0.6, -0.1], 6, 0.12, 0.06)), fx('anFOviduct', '#f4a0b0', { rimColor: '#ffe0e8' }));
  B.add(both(sg => merge([place(ellipsoid({ r: [0.14, 0.1, 0.14], rows: 8, cols: 12 }), { at: [sg * 1.45, 2.05, -0.1] })].concat(Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.2832; return tube({ pts: [[sg * 1.45 + Math.cos(a) * 0.12, 2.12, -0.1 + Math.sin(a) * 0.12], [sg * 1.45 + Math.cos(a) * 0.2, 2.25, -0.1 + Math.sin(a) * 0.2]], r: 0.012, sides: 3 }); })))), fx('anFunnel', '#f6c0d0'));
  B.add(both(sg => place(ellipsoid({ r: [0.2, 0.3, 0.18], rows: 10, cols: 12 }), { at: [sg * 1.25, -0.95, -0.05] })), fx('anFEggSac', '#f08aa0'));
  B.add(place(ellipsoid({ r: [0.85, 0.18, 0.3], rows: 10, cols: 16 }), { at: [0, -1.5, 0] }), fx('anCloaca', '#f0943a'));
  B.label('anFunnel', [-1.45, 2.25, -0.1], [-1, 0.6, 0]);
  B.label('anFOviduct', [1.62, 1.2, -0.1], [1, 0.2, 0]);
  B.label('anFatBody', [0.75, 1.75, 0.05], [1, 0.6, 0.2]);
  B.label('anFOvary', [-0.85, 0.7, 0.35], [-1, 0, 0.3]);
  B.label('anMesovar', [-1.32, 0.5, 0], [-1, -0.2, 0]);
  B.label('anKidney', [0.42, 0.3, 0.2], [1, 0, 0.3]);
  B.label('anUreter', [0.18, -0.8, 0.15], [1, -0.2, 0.3]);
  B.label('anFEggSac', [1.4, -1.0, -0.05], [1, -0.3, 0]);
  B.label('anCloaca', [-0.8, -1.5, 0], [-1, -0.4, 0.2]);
  B.caption([0, -2.1, 0], () => ['الجهاز التناسلي الأنثوي في الضفدع: مبيضان معلقان بمسراق المبيض، وقناتا بيض ملتويتان', 'تبدآن بفتحة مهدبة وتنتهيان بكيس البيض قبل المجمع']);
  return { dist: 8.2, yaw: 0.2, pitch: 0.12, target: [0, 0.3, 0] };
}

/* ضفدع: جسم ورأس وعينان وأطراف؛ legs: 0 بلا أطراف (دعموص) — s حجم، tail طول الذنب */
function frog(at, s, o){
  o = o || {}; const P = v => add(at, mul(v, s)), body = [], limbs = [];
  body.push(place(ellipsoid({ r: [0.6 * s, 0.36 * s, 0.48 * s], rows: 14, cols: 18 }), { at: P([0, 0, 0]) }), place(ellipsoid({ r: [0.32 * s, 0.24 * s, 0.34 * s], rows: 10, cols: 14 }), { at: P([0.55, 0.08, 0]) }));
  [-1, 1].forEach(sz => body.push(ball(0.09 * s, P([0.68, 0.28, sz * 0.18]), 8)));
  const hind = o.hind === undefined ? 1 : o.hind, fore = o.fore === undefined ? 1 : o.fore;
  [-1, 1].forEach(sz => { if (hind > 0.01) limbs.push(tube({ pts: [P([-0.45, -0.1, sz * 0.3]), P([-0.25 - 0.2 * hind, -0.15, sz * (0.3 + 0.45 * hind)]), P([-0.7 - 0.2 * hind, -0.3, sz * (0.3 + 0.5 * hind)]), P([-0.4 - 0.6 * hind, -0.35, sz * (0.3 + 0.7 * hind)])], r: 0.07 * s * Math.max(0.3, hind), sides: 6 }));
    if (fore > 0.01) limbs.push(tube({ pts: [P([0.35, -0.15, sz * 0.3]), P([0.45, -0.3, sz * (0.3 + 0.2 * fore)]), P([0.55, -0.36, sz * (0.3 + 0.3 * fore)])], r: 0.045 * s * Math.max(0.3, fore), sides: 5 })); });
  return { body: merge(body), limbs: limbs.length ? merge(limbs) : null };
}
/* دعموص: رأس-جسم بيضوي وذنب مسطح يتموج */
const tadpole = (at, s, tail, ph) => { const P = v => add(at, mul(v, s)), pts = [];
  for (let i = 0; i <= 12; i++){ const u = i / 12; pts.push(P([-0.35 - u * 1.2 * tail, 0, Math.sin(u * 5 + ph) * 0.12 * u])); }
  return merge([place(ellipsoid({ r: [0.42 * s, 0.3 * s, 0.32 * s], rows: 12, cols: 16 }), { at: at }), tube({ pts, r: u => 0.12 * s * (1 - u * 0.85), sides: 6 })]); };

/* ═════════════ 6) التزاوج والإخصاب الخارجي في الضفدع (ص100–102) — يتبع المرحلة ═════════════ */
function fMateModel(B){
  B.add(place(ellipsoid({ r: [3.0, 0.05, 1.8], rows: 6, cols: 30 }), { at: [0, -0.1, 0] }), { color: '#3a8ac8', alpha: 0.35, rim: 0.6, rimColor: '#c0e8ff', shell: { size: 6 } });
  /* الأنثى أسفل والذكر فوقها يحتضنها بأطرافه الأمامية (العناق) */
  const Fm = frog([0, -0.25, 0], 1.1, {}), Ml = frog([0.08, 0.15, 0], 0.85, {});
  B.add(merge([Fm.body, Fm.limbs]), fx('anAmplex', '#a8784a', { rimColor: '#ffe0b0' }));
  B.add(merge([Ml.body, Ml.limbs]), fx('anAmplex', '#5fae3a', { rimColor: '#d8ffc0' }));
  B.add(merge([-1, 1].map(sz => place(ellipsoid({ r: [0.07, 0.05, 0.05], rows: 6, cols: 8 }), { at: [0.55, -0.1, sz * 0.45] }))), fx('anNupPad', '#3a3a3a', { rimColor: '#a0a0a0' }));
  /* البيوض في الماء (كتلة جيلاتينية) والنطف تسبح نحوها */
  const EC = [-1.4, -0.45, 0.6];
  const eggs = k => merge(Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, r = 0.12 + (i % 4) * 0.08; return ball(0.08, add(EC, [Math.cos(a) * r * (0.4 + k), -0.05 - k * 0.15, Math.sin(a) * r * (0.4 + k)]), 8); }));
  const eggsO = B.add(eggs(0), fx('anFEggs', '#2a2a2a', { rimColor: '#c0c0c0', pop: false, center: EC }));
  const jelly = B.add(merge(Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, r = 0.12 + (i % 4) * 0.08; return ball(0.15, add(EC, [Math.cos(a) * r * 1.4, -0.2, Math.sin(a) * r * 1.4]), 8); })), fx('anAlbumen', '#e8f4ff', { alpha: 0.4, shell: { size: 0.8 }, pop: false, center: EC }));
  const sperm = t => merge(Array.from({ length: 10 }, (_, i) => { const u = (t * 0.3 + i / 10) % 1; return ball(0.03, add([-0.6, -0.3, 0.3], [-0.8 * u + Math.sin(i * 3) * 0.1, -0.15 * u, 0.3 * u + Math.cos(i * 2) * 0.1]), 5); }));
  const spermO = B.add(sperm(0), fx('anFSperm', '#f0f0f0', { pop: false, center: EC }));
  const fertO = B.add(merge([0, 1, 2].map(i => place(ellipsoid({ r: 0.09, rows: 8, cols: 10 }), { at: add(EC, [0.6 + i * 0.25, 0.05, -0.3]) }))), fx('anExtFert', '#f6f6f6', { alpha: 0.85, pop: false }));
  const zyg = B.add(merge([ball(0.18, add(EC, [0.6, -0.05, 0.5]), 12)]), fx('anFZyg', '#3a2a2a', { pop: false }));
  const zygJ = B.add(ball(0.32, add(EC, [0.6, -0.05, 0.5]), 14), fx('anAlbumen', '#e8f4ff', { alpha: 0.35, shell: { size: 0.6 }, pop: false }));
  const vis = (...ss) => () => ss.includes(STG.idx);
  B.label('anAmplex', [0.1, 0.45, 0.3], [0.3, 1, 0.3]);
  B.label('anNupPad', [0.55, -0.1, 0.48], [1, -0.2, 0.5]);
  B.label('anFEggs', add(EC, [-0.3, -0.1, 0]), [-1, -0.2, 0.2], vis(1, 2));
  B.label('anFSperm', [-1.0, -0.4, 0.45], [-0.5, 0.6, 0.4], vis(1, 2));
  B.label('anExtFert', add(EC, [0.85, 0.15, -0.3]), [1, 0.4, -0.2], vis(2));
  B.label('anAlbumen', add(EC, [0.6, 0.2, 0.75]), [1, 0.4, 0.5], vis(2));
  B.label('anFZyg', add(EC, [0.6, -0.05, 0.62]), [0.5, -0.5, 0.6], vis(2));
  B.caption([0, -1.4, 0], () => [(AN_MATE_ST[STG.idx] || {}).n || '']);
  return { dist: 7.8, yaw: 0.6, pitch: 0.4, target: [-0.4, -0.2, 0.2], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      eggsO.hide = jelly.hide = s === 0; if (s === 1) B.update(eggsO, eggs(k));
      spermO.hide = s === 0; if (s >= 1) B.update(spermO, sperm(t));
      fertO.hide = zyg.hide = zygJ.hide = s !== 2;
    } };
}

/* ═════════════ 7) دورة حياة الضفدع (ص101) — كائن واحد يتحول مع المرحلة ═════════════ */
function fCycleModel(B){
  const C = [0, 0, 0];
  B.add(place(ellipsoid({ r: [2.6, 0.04, 1.6], rows: 6, cols: 30 }), { at: [0, -0.7, 0] }), { color: '#3a8ac8', alpha: 0.3, rim: 0.6, rimColor: '#c0e8ff', shell: { size: 6 } });
  const zyg = B.add(merge([ball(0.3, C, 14)]), fx('anFZyg', '#2a2a2a', { rimColor: '#c0c0c0' }));
  const jelly = B.add(ball(0.55, C, 16), fx('anFZyg', '#e8f4ff', { alpha: 0.3, shell: { size: 1.1 } }));
  const cleav = n => merge(Array.from({ length: 8 }, (_, i) => { const on = i < n, a = i * 0.785, b = i < 4 ? 0.35 : -0.35, r = n <= 2 ? 0.18 : 0.2;
    return ball(on ? (n === 2 ? 0.22 : n === 4 ? 0.18 : 0.14) : 0.0001, [Math.cos(a) * (n === 2 ? 0.12 : r), n === 8 ? b * 0.5 : 0, Math.sin(a) * (n === 2 ? 0.0 : r)], 10); }));
  const clO = B.add(cleav(2), fx('anCleav', '#3a3030', { rimColor: '#d0d0d0', pop: false, center: C }));
  const tadO = B.add(tadpole(C, 1, 1, 0), fx('anTadpole', '#4a3a2a', { rimColor: '#c0a080', pop: false, center: C }));
  const legs = (h, f) => { const fr = frog([0.15, 0, 0], 0.75, { hind: h, fore: f }); return fr.limbs; };
  const hindO = B.add(legs(0.5, 0), fx('anHindL', '#5a6a3a', { pop: false, center: C }));
  const foreO = B.add(legs(1, 0.6), fx('anForeL', '#5a7a3a', { pop: false, center: C }));
  const yF = frog([0.15, 0.05, 0], 0.8, { hind: 1, fore: 1 }), yT = tube({ pts: [[-0.3, 0.02, 0], [-0.55, 0.0, 0], [-0.75, -0.02, 0]], r: u => 0.08 * (1 - u), sides: 6 });
  const young = B.add(merge([yF.body, yF.limbs, yT]), fx('anYoungF', '#5fa83a', { pop: false, center: C }));
  const aF = frog([0, 0.1, 0], 1.25, {}), adult = B.add(merge([aF.body, aF.limbs]), fx('anAdultF', '#4f9e3a', { rimColor: '#d8ffc0', pop: false, center: C }));
  const vis = s => () => STG.idx === s;
  B.label('anFZyg', [0.3, 0.2, 0], [1, 0.4, 0.2], vis(0));
  B.label('anCleav', [0.25, 0.2, 0.1], [1, 0.4, 0.2], vis(1));
  B.label('anTadpole', [0.35, 0.2, 0], [1, 0.4, 0.2], vis(2));
  B.label('anHindL', [-0.3, -0.1, 0.45], [0, -0.5, 1], vis(3));
  B.label('anForeL', [0.55, -0.25, 0.4], [1, -0.4, 0.6], vis(4));
  B.label('anYoungF', [0.6, 0.25, 0], [1, 0.4, 0.2], vis(5));
  B.label('anAdultF', [0.7, 0.4, 0], [1, 0.4, 0.2], vis(6));
  B.caption([0, -1.4, 0], () => [(AN_CYC_ST[STG.idx] || {}).n || '']);
  return { dist: 6.6, yaw: 0.5, pitch: 0.35, target: [0, 0, 0], live2d: true,
    anim(t){ const s = STG.idx, k = sm(STG.k);
      zyg.hide = jelly.hide = s !== 0;
      clO.hide = s !== 1; if (s === 1) B.update(clO, cleav(k < 0.33 ? 2 : k < 0.66 ? 4 : 8));
      tadO.hide = !(s >= 2 && s <= 4); if (!tadO.hide) B.update(tadO, tadpole(C, 1, s === 4 ? 1 - 0.6 * k : 1, t * 6));
      hindO.hide = s !== 3 && s !== 4; if (s === 3) B.update(hindO, legs(0.2 + 0.8 * k, 0)); if (s === 4) B.update(hindO, legs(1, 0));
      foreO.hide = s !== 4; if (s === 4) B.update(foreO, legs(1, 0.2 + 0.8 * k));
      young.hide = s !== 5; adult.hide = s !== 6;
    } };
}

Object.assign(G3.models, { ani_anIvM: iMaleModel, ani_anIvF: iFemaleModel, ani_anIvX: iFertModel, anf_anFvM: fMaleModel, anf_anFvF: fFemaleModel, anf_anFvX: fMateModel, anf_anFvC: fCycleModel });
})();
