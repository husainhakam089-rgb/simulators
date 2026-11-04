/* ══════════════════════════════════════════════════════════════════════════
   4.3 · التكاثر في الطليعيات — ملزمة ص26–36: الكلاميدوموناس (اللاجنسي
         والجنسي)، البراميسيوم (الانقسام الثنائي المستعرض، الاقتران، الإخصاب
         الذاتي)، اليوغلينا (الانقسام الثنائي الطولي)
       + التكاثر في الفطريات — عفن الخبز الأسود (ص37–39)
   ══════════════════════════════════════════════════════════════════════════ */
const PR_VIEWS = [
  { id: 'prChA', label: 'الكلاميدوموناس: لاجنسي' },
  { id: 'prChS', label: 'الكلاميدوموناس: جنسي' },
  { id: 'prPF',  label: 'البراميسيوم: انقسام ثنائي' },
  { id: 'prPC',  label: 'البراميسيوم: الاقتران' },
  { id: 'prPS',  label: 'البراميسيوم: الإخصاب الذاتي' },
  { id: 'prEu',  label: 'اليوغلينا' }
];
const PR_SUB = {
  prChA: ['التكاثر اللاجنسي في الكلاميدوموناس', 'ملزمة ص26'],
  prChS: ['التكاثر الجنسي في الكلاميدوموناس', 'ملزمة ص27–29'],
  prPF:  ['الانقسام الثنائي المستعرض في البراميسيوم', 'ملزمة ص30–31'],
  prPC:  ['الاقتران في البراميسيوم', 'ملزمة ص32–35'],
  prPS:  ['الإخصاب الذاتي في البراميسيوم', 'ملزمة ص33–35'],
  prEu:  ['الانقسام الثنائي الطولي في اليوغلينا', 'ملزمة ص36']
};
const PR_FN = {
  prChA: () => prChAsex(), prChS: () => prChSex(), prPF: () => prParaFis(),
  prPC: () => prConj(false), prPS: () => prConj(true), prEu: () => prEugl()
};
SCENES.protist = {
  title: 'التكاثر في الطليعيات',
  get src(){ return (PR_SUB[SEL.prv] || PR_SUB.prChA)[1]; },
  tint: ['rgba(90,160,90,.24)', 'rgba(70,120,170,.16)'],
  build(){
    const v = PR_VIEWS.some(x => x.id === SEL.prv) ? SEL.prv : 'prChA';
    const s = PR_FN[v]();
    s.rebuildOnRadio = 'prv';
    s.subTitle = PR_SUB[v][0]; s.subSrc = PR_SUB[v][1];
    s.tools = PR_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'prv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.fungi = {
  title: 'التكاثر في عفن الخبز الأسود (الفطريات)', src: 'ملزمة ص37–39',
  tint: ['rgba(170,140,80,.24)', 'rgba(90,110,170,.14)'],
  build: () => prRhizo()
};
SCENES.pr_chAsex = { title: 'التكاثر اللاجنسي في الكلاميدوموناس', build: st => prChAsex(st) };
SCENES.pr_chSex  = { title: 'التكاثر الجنسي في الكلاميدوموناس', build: st => prChSex(st) };
SCENES.pr_paraFis = { title: 'الانقسام الثنائي في البراميسيوم', build: st => prParaFis(st) };
SCENES.pr_conj   = { title: 'الاقتران في البراميسيوم', build: st => prConj(false, st) };
SCENES.pr_self   = { title: 'الإخصاب الذاتي في البراميسيوم', build: st => prConj(true, st) };
SCENES.pr_eugl   = { title: 'الانقسام الثنائي الطولي في اليوغلينا', build: st => prEugl(st) };
SCENES.pr_rhizo  = { title: 'دورة حياة عفن الخبز الأسود', build: st => prRhizo(st) };

/* ───────── أدوات مشتركة ───────── */
/* سوط متموج: القاعدة ثابتة والسعة تزداد نحو الطرف (ph = طور الحركة) */
function prWave(x0, y0, ang, len, amp, ph, cyc){
  let d = ''; const n = 18, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let i = 0; i <= n; i++){ const u = i / n, L = len * u, w = Math.sin(u * cyc * 6.283 - ph) * amp * u;
    d += (i ? ' L' : 'M') + n2(x0 + ca * L - sa * w) + ',' + n2(y0 + sa * L + ca * w); }
  return d;
}
const prFlag = (x0, y0, ang, len, amp, cyc, i, col, w) => `<path class="prFl" data-w="${x0} ${y0} ${ang.toFixed(3)} ${len} ${amp} ${cyc} ${n2(i)}" d="${prWave(x0, y0, ang, len, amp, 0, cyc)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
/* نقاط موزعة داخل قطع ناقص دون تراكب (لأبواغ وأمشاج داخل الجدار) */
function prPts(n, rx, ry, seed, md){ const r = rng(seed), out = []; let tries = 0;
  while (out.length < n && tries++ < 3000){ const a = r() * 6.283, d = Math.sqrt(r()); const p = [Math.cos(a) * d * rx, Math.sin(a) * d * ry];
    if (out.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > md)) out.push(p); }
  return out; }
/* جدار قطع ناقص، وإن أُعطيت زاوية يكون ممزقاً من تلك الجهة */
function prWallD(rx, ry, tear){ const pts = [], N = 32;
  for (let j = 0; j < N; j++){ const a = j / N * 6.283; let f = 1;
    if (tear !== undefined && tear !== null){ const da = Math.abs(Math.atan2(Math.sin(a - tear), Math.cos(a - tear))); if (da < 0.55) f = 0.6 + (j % 2) * 0.18; }
    pts.push([Math.cos(a) * rx * f, Math.sin(a) * ry * f]); }
  return smoothClosed(pts); }
/* تقدم الحركة داخل المرحلة st (0 قبلها، 1 بعدها) */
const prK = (st, still) => { if (still) return 1; if (STG.idx > st) return 1; if (STG.idx < st) return 0; const k = Math.min(1, STG.k * 1.35); return k * k * (3 - 2 * k); };
/* المحرّك العام لحركات القسم: الأسواط، الأهداب، الانتقال/الدوران/التكبير المرتبط بالمرحلة */
function prAnim(a, t, still){
  a.all('.prFl').forEach(p => { const w = p.dataset.w.split(' ').map(Number);
    p.setAttribute('d', prWave(w[0], w[1], w[2], w[3], w[4], t * 6 + w[6], w[5])); });
  a.all('.prCil').forEach(p => p.setAttribute('stroke-dashoffset', n2((t * 10) % 10.8)));
  a.all('[data-ks]').forEach(g => { const d = g.dataset, k = prK(+d.ks, still), q = 1 - k;
    if (d.sw1) g.setAttribute('stroke-width', n2(+d.sw0 + (+d.sw1 - +d.sw0) * k));
    if (d.fade) g.setAttribute('opacity', n2(k));
    let tr = '';
    if (d.dx || d.dy) tr += `translate(${n2(q * (+d.dx || 0))},${n2(q * (+d.dy || 0))}) `;
    if (d.rot) tr += `rotate(${n2(q * +d.rot)} ${d.px} ${d.py}) `;
    if (d.s0){ const s = +d.s0 + (1 - +d.s0) * k; tr += `translate(${d.px},${d.py}) scale(${s.toFixed(3)}) translate(${-d.px},${-d.py})`; }
    if (tr) g.setAttribute('transform', tr); });
  a.all('[data-only]').forEach(g => g.setAttribute('opacity', !still && STG.idx === +g.dataset.only ? 1 : 0));
  a.all('[data-hide]').forEach(g => g.setAttribute('opacity', !still && STG.idx === +g.dataset.hide ? 0 : 1));
  a.all('.prBob').forEach((g, i) => g.setAttribute('transform', `translate(${n2(Math.sin(t * 1.6 + i) * 3)},${n2(Math.cos(t * 1.3 + i * 2) * 2.4)})`));
}
const prAr = (x0, y0, x1, y1, st, col) => `<g data-st="${st}">${gArrow(x0, y0, x1, y1, col || '#7fb2ff')}</g>`;
/* سهم منحنٍ */
const prCurve = (x0, y0, cx, cy, x1, y1, col, st) => { const a = Math.atan2(y1 - cy, x1 - cx), h = 10;
  return `<g data-st="${st}"><path d="M${x0},${y0} Q${cx},${cy} ${n2(x1 - Math.cos(a) * 3)},${n2(y1 - Math.sin(a) * 3)}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M${x1},${y1} L${n2(x1 - h * Math.cos(a - 0.45))},${n2(y1 - h * Math.sin(a - 0.45))} L${n2(x1 - h * Math.cos(a + 0.45))},${n2(y1 - h * Math.sin(a + 0.45))}Z" fill="${col}"/></g>`; };
const prBuild = (stages, still, dur) => { const ctl = stageCtl(stages, { dur: dur || stages.length * 6 });
  return { ctl, o: { stages,
    init(){ if (!still) ctl.start(); }, onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){ if (!still) ctl.tick(dt); stageShow(a, still ? 99 : STG.idx, still ? 1 : STG.k); prAnim(a, t, still); } } }; };

/* ───────── الكلاميدوموناس: خلية كمثرية، سوطان، بلاستيدة كوبية، جدار سميك (ص26) ───────── */
const PR_CB = [[0, -44], [13, -41], [25, -30], [33, -12], [35, 6], [31, 24], [21, 37], [0, 44], [-21, 37], [-31, 24], [-35, 6], [-33, -12], [-25, -30], [-13, -41]];
const PR_CUP = smoothOpen([[-30, -16], [-33, 4], [-29, 22], [-19, 34], [0, 40], [19, 34], [29, 22], [33, 4], [30, -16]]) + ' L' +
  smoothOpen([[22, -14], [22, 4], [14, 18], [0, 23], [-14, 18], [-22, 4], [-22, -14]]).slice(1) + 'Z';
function prChl(x, y, s, o){
  o = o || {};
  const P = !!o.parts, i = o.i || 0, nf = o.flags === undefined ? 2 : o.flags;
  const A = nf === 4 ? [-0.8, -0.3, 0.3, 0.8] : nf === 2 ? [-0.38, 0.38] : [];
  const fl = A.map((d, j) => prFlag(d < 0 ? -3 : 3, -42, -Math.PI / 2 + d, 52, 5, 1.1, i + j * 1.7, '#5aa83e', 2.4)).join('');
  const wall = `<path d="${smoothClosed(PR_CB.map(p => [p[0] * 1.1, p[1] * 1.08]))}" fill="none" stroke="#e6ffd2" stroke-width="3.4"/>`;
  const body = `<path d="${smoothClosed(PR_CB)}" fill="#fff3a0" stroke="#5f9e45" stroke-width="1.8"/>`;
  const cup = `<path d="${PR_CUP}" fill="#8fd25e" stroke="#4c8f36" stroke-width="1.3"/>`;
  const nuc = `<ellipse cx="0" cy="-8" rx="8.5" ry="10" fill="#b98be6" stroke="#6b3fa0" stroke-width="1.4"/>`;
  const inner = (P ? part('prFlag', fl) : fl) + body + (P ? part('prCupChl', cup) : cup) + nuc + (P ? part('prWall', wall) : wall);
  return `<g transform="translate(${n2(x)},${n2(y)}) rotate(${o.rot || 0}) scale(${s})">${inner}</g>`;
}
/* بوغ سابح / مشيج صغير: جسم أخضر بيضوي ونقطة وردية وسوطان */
function prMini(x, y, rot, i, s, col){
  return `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(rot)}) scale(${s || 1})">` +
    prFlag(-1.5, -6.5, -Math.PI / 2 - 0.55, 12, 1.8, 1, i, '#2f6b2a', 1.3) + prFlag(1.5, -6.5, -Math.PI / 2 + 0.55, 12, 1.8, 1, i + 1.3, '#2f6b2a', 1.3) +
    `<ellipse rx="5.5" ry="7.5" fill="${col || '#9ad66a'}" stroke="#3f7f2c" stroke-width="1.1"/><circle cx="0" cy="1.5" r="2" fill="#f08aa8"/></g>`;
}
/* جدار الخلية الأم بداخله أبواغ/أمشاج */
function prSac(x, y, rx, ry, n, seed, s, o){
  o = o || {};
  const sp = prPts(n, rx * 0.68, ry * 0.7, seed, 13 * s).map((p, j) => `<g class="prBob">${prMini(x + p[0], y + p[1], (j * 67) % 360, j * 0.7, s)}</g>`).join('');
  return `<g transform="translate(${n2(x)},${n2(y)})"><path d="${prWallD(rx, ry, o.tear)}" fill="${o.fill || '#fff6b8'}" stroke="${o.stroke || '#d6eaa0'}" stroke-width="${o.sw || 4}"/></g>` + sp;
}

const PR_CHA_ST = [
  { n: '1 · الخلية الخضرية (س)', d: 'الكلاميدوموناس طحلب أخضر وحيد الخلية يعيش في البرك والمستنقعات والبحيرات؛ تمتلك خليته الخضرية سوطين ومحاطة بجدار سيليلوزي سميك وبلاستيدة خضراء واحدة كوبية الشكل، وهي أحادية المجموعة الكروموسومية (س).' },
  { n: '2 · تكوّن الأبواغ المتحركة (س)', d: 'تتكون (2–8) أو ربما (16) من الأبواغ المتحركة السابحة (س) بعمليات انقسام تتم داخل الخلية ضمن الجدار السيليلوزي للخلية الأصلية.' },
  { n: '3 · تمزق الجدار وتحرر الأبواغ', d: 'تنطلق الأبواغ حرة بعد تمزق الجدار الخلوي الأصلي للخلية الأم.' },
  { n: '4 · خلايا خضرية مستقلة (س)', d: 'تنمو الأبواغ إلى خلايا خضرية مستقلة سابحة في الماء، أحادية المجموعة الكروموسومية لأنها تنشأ من نمو أبواغ (س).' }
];
/* ───────── 1) التكاثر اللاجنسي في الكلاميدوموناس — الأبواغ المتحركة (ص26) ───────── */
function prChAsex(still){
  const S0 = [720, 380], S1 = [500, 388], S2 = [285, 395];
  const veg = part('prChlamy', `<g data-st="0">${prChl(S0[0], S0[1], 1.7, { parts: true })}</g>`);
  const sac = part('prZoosp', `<g data-st="1">${prSac(S1[0], S1[1], 56, 64, 8, 7, 1.25)}</g>`);
  /* جدار ممزق من اليسار: بعض الأبواغ داخله وثلاثة تسبح للخارج */
  const inside = prPts(4, 26, 34, 12, 16).map((p, j) => `<g class="prBob">${prMini(S2[0] + 10 + p[0], S2[1] + p[1], j * 80, j, 1.2)}</g>`).join('');
  const esc = [[-92, -34, -60, 0], [-104, 14, -70, 6], [-80, 52, -50, 8]].map(([fx, fy, sx, sy], j) =>
    `<g data-ks="2" data-dx="${-fx + sx}" data-dy="${-fy + sy}">${prMini(S2[0] + fx, S2[1] + fy, -60 - j * 10, j + 3, 1.25)}</g>`).join('');
  const torn = part('prSpRel', `<g data-st="2"><g transform="translate(${S2[0]},${S2[1]})"><path d="${prWallD(56, 62, Math.PI)}" fill="#fff6b8" stroke="#d6eaa0" stroke-width="4"/></g>${inside}${esc}</g>`);
  const kids = part('prChDaugh', `<g data-st="3">${[[430, 572, 0], [540, 556, 2], [650, 580, 4]].map(([x, y, i]) => `<g class="prBob">${prChl(x, y, 0.7, { i })}</g>`).join('')}</g>`);
  const body = `
    ${prAr(645, 388, 566, 388, 1)}${prAr(436, 390, 352, 392, 2)}${prAr(318, 468, 392, 528, 3)}${prAr(694, 560, 716, 470, 3)}
    ${veg}${sac}${torn}${kids}
    <text class="cap sm" x="500" y="640" text-anchor="middle">التكاثر اللاجنسي في الكلاميدوموناس بطريقة الأبواغ المتحركة (السابحة) — ملزمة ص26</text>`;
  const B = prBuild(PR_CHA_ST, still, 24);
  return Object.assign(B.o, {
    body, fnParts: ['prSpRel'],
    parts: [
      { id: 'prFlag', anchor: [742, 262], label: [866, 225], side: 'R' },
      { id: 'prWall', anchor: [782, 356], label: [866, 318], side: 'R' },
      { id: 'prCupChl', anchor: [764, 418], label: [866, 410], side: 'R' },
      { id: 'prChlamy', anchor: [736, 446], label: [866, 492], side: 'R' },
      { id: 'prZoosp', anchor: [500, 400], label: [500, 482], side: 'C' },
      { id: 'prSpRel', anchor: [232, 395], label: [134, 440], side: 'L' },
      { id: 'prChDaugh', anchor: [406, 572], label: [134, 575], side: 'L' }
    ],
    tools: B.ctl.tools.concat([{ id: 'info:prChlamy', label: 'عن الكلاميدوموناس' }, { id: 'tbl:prChCmp', label: 'اللاجنسي × الجنسي (ص29)' }, { id: 'tbl:prChChrom', label: 'المجموعة الكروموسومية (ص30)' }])
  });
}

const PR_CHS_ST = [
  { n: '1 · ظروف غير مناسبة', d: 'يتكاثر الكلاميدوموناس جنسياً بطريقة الأمشاج المتشابهة عندما تكون الظروف المعيشية غير مناسبة (الخلية الخضرية أحادية المجموعة الكروموسومية س).' },
  { n: '2 · الأمشاج المتشابهة (س)', d: 'ينقسم الكلاميدوموناس (س) عدة انقسامات اعتيادية متتالية ليتكون (16–32) فرداً داخل جدار الخلية الأصلي، مشابهة للأم ولكنها أصغر حجماً وتدعى بالأمشاج المتشابهة.' },
  { n: '3 · تمزق الجدار وتحرر الأمشاج', d: 'يتمزق الجدار الخلوي للخلية الأم وتتحرر الأمشاج المتشابهة إلى الماء.' },
  { n: '4 · اتحاد الأمشاج', d: 'تتحد الأمشاج مع أمشاج أخرى ناتجة بنفس الطريقة من خلية كلاميدوموناس من سلالة أخرى.' },
  { n: '5 · تكون الزيجة (2س) رباعية الأسواط', d: 'يتكون نتيجة اتحاد الأمشاج الزيجة (الزايكوت) (2س) وتكون رباعية الأسواط تسبح لفترة من الوقت في الماء.' },
  { n: '6 · البوغ الزيجي (2س)', d: 'تفقد الزيجة أسواطها وتحاط بجدار سيليلوزي سميك لكي تستطيع مقاومة الظروف غير المناسبة، وعندها تسمى بالبوغ الزيجي.' },
  { n: '7 · ظروف ملائمة: انقسام اختزالي', d: 'يستعيد البوغ الزيجي (2س) نشاطه عند ملاءمة الظروف البيئية ويعاني انقساماً اختزالياً لتكوين 4 أفراد (س).' },
  { n: '8 · تحرر الأفراد الأربعة (س)', d: 'ينشق الجدار المحيط فتتحرر الأفراد الأربعة المشابهة للخلية الأم فتنمو وتسلك سلوك الكائن البالغ في فعالياته الحيوية، وهي أحادية المجموعة الكروموسومية (س).' }
];
/* ───────── 2) التكاثر الجنسي في الكلاميدوموناس — الأمشاج المتشابهة (ص27–28) ───────── */
function prChSex(still){
  const RA = 150, RB = 300, XV = 800, XG = 680, XT = 565;
  const veg = part('prChlamy', `<g data-st="0">${prChl(XV, RA, 0.85, { i: 0 })}${prChl(XV, RB, 0.85, { i: 2 })}</g>`);
  const gam = part('prIsogam', `<g data-st="1">${[RA, RB].map((y, r) => prSac(XG, y, 40, 44, 14, 21 + r, 0.62)).join('')}</g>`);
  const torn = part('prGamRel', `<g data-st="2">${[RA, RB].map((y, r) =>
    `<g transform="translate(${XT},${y})"><path d="${prWallD(40, 44, Math.PI * (r ? 0.85 : 1.15))}" fill="#fff6b8" stroke="#d6eaa0" stroke-width="4"/></g>` +
    prPts(7, 22, 26, 31 + r, 11).map((p, j) => `<g class="prBob">${prMini(XT + 8 + p[0], y + p[1], j * 70, j, 0.62)}</g>`).join('') +
    [[-62, r ? 10 : -10], [-56, r ? -14 : 16], [-74, r ? 30 : -30]].map(([fx, fy], j) =>
      `<g data-ks="2" data-dx="${-fx - 34}" data-dy="${-fy}">${prMini(XT + fx, y + fy, -70 + j * 15, j + 4, 0.62)}</g>`).join('')).join('')}</g>`);
  const fuse = part('prGamFuse', `<g data-st="3"><g data-ks="3" data-dy="-24">${prChl(450, 192, 0.62, { rot: 180, i: 3 })}</g><g data-ks="3" data-dy="24">${prChl(450, 258, 0.62, { i: 4 })}</g></g>`);
  const zyg = part('prZyg', `<g data-st="4"><g class="prBob">${prChl(345, 258, 0.85, { flags: 4, rot: 58, i: 5 })}</g></g>`);
  const ZS = [330, 525], ZM = [535, 525], ZR = [740, 525];
  const zCell = (x, y) => `<circle cx="${x}" cy="${y}" r="27" fill="#8fd25e" stroke="#4c8f36" stroke-width="1.6"/><circle cx="${x - 7}" cy="${y - 6}" r="12" fill="#fff3a0" opacity=".85"/><ellipse cx="${x - 6}" cy="${y - 5}" rx="7" ry="8" fill="#b98be6" stroke="#6b3fa0" stroke-width="1.2"/>`;
  const zsp = part('prZygosp', `<g data-st="5"><ellipse cx="${ZS[0]}" cy="${ZS[1]}" rx="56" ry="44" fill="#d6f1fb" stroke="#8cc4dc" stroke-width="7" data-ks="5" data-sw0="1.5" data-sw1="7"/>${zCell(ZS[0], ZS[1])}</g>`);
  const meio = part('prMeioCh', `<g data-st="6"><ellipse cx="${ZM[0]}" cy="${ZM[1]}" rx="56" ry="44" fill="#d6f1fb" stroke="#8cc4dc" stroke-width="7"/>` +
    [[-18, -14], [18, -12], [-16, 16], [20, 16]].map(([dx, dy], j) => `<g data-ks="6" data-dx="${-dx}" data-dy="${-dy}">${prMini(ZM[0] + dx, ZM[1] + dy, j * 90 + 20, j, 1.35)}</g>`).join('') + `</g>`);
  const rel = part('prZsRel', `<g data-st="7"><g transform="translate(${ZR[0]},${ZR[1]})"><path d="${prWallD(56, 44, -0.4)}" fill="#d6f1fb" stroke="#8cc4dc" stroke-width="7"/></g>` +
    prMini(ZR[0] - 18, ZR[1] + 10, 200, 1, 1.35) +
    [[30, -38], [52, -14], [16, -60]].map(([fx, fy], j) => `<g data-ks="7" data-dx="${-fx + 6}" data-dy="${-fy + 4}">${prMini(ZR[0] + fx, ZR[1] + fy, 40 + j * 12, j + 2, 1.35)}</g>`).join('') + `</g>`);
  /* أيقونتا الظروف البيئية */
  const cloud = `<g transform="translate(250,398)"><circle cx="18" cy="-14" r="11" fill="#ffd166"/><circle cx="-12" cy="0" r="13" fill="#9fc6e6"/><circle cx="4" cy="-8" r="15" fill="#b9d8f0"/><circle cx="20" cy="2" r="11" fill="#9fc6e6"/><rect x="-20" y="0" width="46" height="12" rx="6" fill="#b9d8f0"/>` +
    [[-8, 22], [6, 26], [20, 22]].map(([x, y]) => `<path d="M${x},${y} q-3,6 0,8 q3,-2 0,-8Z" fill="#5aa6e6"/>`).join('') + `</g>`;
  const sun = `<g transform="translate(535,410)"><circle r="13" fill="#ffd166" stroke="#ffb020" stroke-width="2"/>${Array.from({ length: 8 }, (_, j) => { const a = j * Math.PI / 4;
    return `<line x1="${n2(Math.cos(a) * 18)}" y1="${n2(Math.sin(a) * 18)}" x2="${n2(Math.cos(a) * 25)}" y2="${n2(Math.sin(a) * 25)}" stroke="#ffd166" stroke-width="2.6" stroke-linecap="round"/>`; }).join('')}</g>`;
  const body = `
    ${prAr(766, RA, 724, RA, 1)}${prAr(766, RB, 724, RB, 1)}${prAr(636, RA, 610, RA, 2)}${prAr(636, RB, 610, RB, 2)}
    ${prAr(522, RA + 26, 480, 196, 3)}${prAr(522, RB - 26, 480, 252, 3)}${prAr(418, 232, 392, 244, 4)}
    ${prAr(330, 300, 330, 470, 5)}${prAr(392, ZS[1], 476, ZM[1], 6)}${prAr(596, ZM[1], 680, ZR[1], 7)}${prAr(776, 470, 798, 346, 7)}
    <g data-st="5">${cloud}<text class="cap sm" x="250" y="452" text-anchor="middle">ظروف بيئية غير ملائمة</text></g>
    <g data-st="6">${sun}<text class="cap sm" x="535" y="462" text-anchor="middle">ظروف بيئية ملائمة</text></g>
    ${veg}${gam}${torn}${fuse}${zyg}${zsp}${meio}${rel}
    <text class="cap sm" x="500" y="645" text-anchor="middle">التكاثر الجنسي في الكلاميدوموناس بطريقة الأمشاج المتشابهة — ملزمة ص27–28</text>`;
  const B = prBuild(PR_CHS_ST, still, 40);
  return Object.assign(B.o, {
    body, fnParts: ['prGamRel', 'prGamFuse', 'prMeioCh', 'prZsRel'],
    parts: [
      { id: 'prChlamy', anchor: [826, 162], label: [866, 205], side: 'R' },
      { id: 'prIsogam', anchor: [680, 318], label: [680, 372], side: 'C' },
      { id: 'prGamRel', anchor: [565, 108], label: [565, 66], side: 'C' },
      { id: 'prGamFuse', anchor: [450, 225], label: [450, 322], side: 'C' },
      { id: 'prZyg', anchor: [318, 266], label: [134, 300], side: 'L' },
      { id: 'prZygosp', anchor: [274, 525], label: [134, 525], side: 'L' },
      { id: 'prMeioCh', short: 'تكون أربعة أبواغ', anchor: [535, 569], label: [535, 600], side: 'C' },
      { id: 'prZsRel', anchor: [795, 530], label: [866, 540], side: 'R' }
    ],
    tools: B.ctl.tools.concat([{ id: 'info:prZygosp', label: 'عن البوغ الزيجي' }, { id: 'tbl:prChCmp', label: 'اللاجنسي × الجنسي (ص29)' }, { id: 'tbl:prChChrom', label: 'المجموعة الكروموسومية (ص30)' }])
  });
}

/* ───────── البراميسيوم بشكل النعل (أفقي، رسم ص31) ───────── */
const PR_SLIP = [[-1, 0.05], [-0.93, -0.5], [-0.72, -0.84], [-0.38, -0.97], [0, -0.9], [0.38, -0.8], [0.72, -0.56], [0.97, -0.16], [0.96, 0.12], [0.72, 0.46], [0.36, 0.76], [0, 0.9], [-0.4, 0.96], [-0.76, 0.8], [-0.95, 0.46]];
function prParaH(L, W, o){
  o = o || {}; const hx = L / 2, hy = W / 2;
  const pts = PR_SLIP.map(([u, v]) => [u * hx, v * hy]);
  const cil = o.still ? '' : `<path class="prCil" d="${smoothClosed(pts.map(p => [p[0] * 1.05, p[1] * 1.13]))}" fill="none" stroke="#efdcb4" stroke-width="2.2" stroke-dasharray="1.2 4.2" stroke-linecap="round" opacity=".8"/>`;
  const groove = `<path d="M${n2(-0.24 * hx)},${n2(-0.9 * hy)} Q${n2(-0.02 * hx)},${n2(-0.22 * hy)} ${n2(0.28 * hx)},${n2(-0.78 * hy)} Q${n2(0.02 * hx)},${n2(-0.6 * hy)} ${n2(-0.24 * hx)},${n2(-0.9 * hy)}Z" fill="#8c6a44" opacity=".85"/>`;
  const food = [[-0.3, 0.45], [0.15, 0.52], [0.42, 0.24], [-0.55, 0.3], [0.62, -0.3]].map(([u, v]) => `<circle cx="${n2(u * hx)}" cy="${n2(v * hy)}" r="${n2(W * 0.06)}" fill="#c4a06c"/>`).join('');
  const vac = o.noVac ? '' : [[-0.66, -0.12], [0.66, -0.05]].map(([u, v]) => `<circle cx="${n2(u * hx)}" cy="${n2(v * hy)}" r="${n2(W * 0.085)}" fill="#f4ead2" stroke="#a8875c" stroke-width="1.2"/>`).join('');
  return cil + `<path d="${smoothClosed(pts)}" fill="#dcc08f" stroke="#6b4a2a" stroke-width="2.4"/>` + groove + food + vac;
}
const prMac = (x, y, rx, ry, rot) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''} fill="#5e3d22" stroke="#3a2412" stroke-width="1.4"/>`;
const prMic = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 4.4}" fill="#24150b"/>`;
const PR_PF_ST = [
  { n: '1 · انقسام النواة الصغيرة', d: 'يبدأ بانقسام النواة الصغيرة انقساماً اعتيادياً إلى نواتين تتجه كل منهما إلى طرف متضاد من أطراف الحيوان.' },
  { n: '2 · استطالة النواة الكبيرة وبرعم الفم الخلوي', d: 'وفي نفس الوقت تستطيل النواة الكبيرة ويظهر برعم الفم الخلوي.' },
  { n: '3 · انقسام النواة الكبيرة والتخصر', d: 'تنقسم النواة الكبيرة انقساماً مباشراً إلى نواتين تتجهان إلى طرفي البراميسيوم، ويتكون أخدود فمي جديد وتظهر فجوتان متقلصتان جديدتان، ويحصل تخصر في البراميسيوم ليقود إلى الانقسام.' },
  { n: '4 · براميسيومان بنويان', d: 'ينقسم البراميسيوم إلى براميسيومين بنويين (جديدين). تسمى هذه الطريقة الانقسام الثنائي المستعرض.' }
];
/* ───────── 3) الانقسام الثنائي المستعرض في البراميسيوم (ص31) ───────── */
function prParaFis(still){
  const X = 530, Y = [92, 205, 320, 448, 568], st = !!still;
  const AR = '#9fb0c8', AR2 = '#c0583a';
  const row0 = part('prPara', `<g data-st="0">${wrap(`translate(${X},${Y[0]})`, prParaH(210, 64, { still: st }))}</g>`) +
    part('prMacN', `<g data-st="0">${prMac(X + 18, Y[0] + 8, 22, 11, -8)}</g>`) +
    part('prMicN', `<g data-st="0"><g data-hide="0">${prMic(X - 14, Y[0] - 2)}</g></g>`) +
    `<g data-only="0" opacity="0"><g data-ks="0" data-dx="${X - 14 - (X - 48)}" data-dy="-12">${prMic(X - 48, Y[0] + 10)}</g><g data-ks="0" data-dx="${X - 14 - (X + 52)}" data-dy="-12">${prMic(X + 52, Y[0] + 10)}</g></g>`;
  const row1 = part('prFisB', `<g data-st="1">${gArrow(X, Y[0] + 36, X, Y[1] - 36, AR)}${wrap(`translate(${X},${Y[1]})`, prParaH(210, 64, { still: st }))}` +
    `<g data-ks="1" data-s0="0.65" data-px="${X + 8}" data-py="${Y[1] + 8}">${prMac(X + 8, Y[1] + 8, 34, 10, -4)}</g>${prMic(X - 48, Y[1] + 12)}${prMic(X + 56, Y[1] + 12)}` +
    part('prOralBud', `<g data-ks="1" data-s0="0.2" data-px="${X - 4}" data-py="${Y[1] - 27}"><path d="M${X - 16},${Y[1] - 28} Q${X - 4},${Y[1] - 10} ${X + 8},${Y[1] - 28}" fill="#9c7a50" stroke="#4a2f18" stroke-width="2"/><circle cx="${X - 4}" cy="${Y[1] - 22}" r="3.4" fill="#f4ead2"/></g>`) + `</g>`);
  const half = (cx, sg) => `<g data-ks="2" data-dx="${sg * 6}">${wrap(`translate(${cx},${Y[2]})`, prParaH(118, 62, { still: st, noVac: true }))}${prMac(cx + 6, Y[2] + 8, 15, 9, -6)}${prMic(cx - 14, Y[2] - 2, 3.8)}</g>`;
  const row2 = part('prConstr', `<g data-st="2">${gArrow(X, Y[1] + 36, X, Y[2] - 36, AR)}${half(X - 56, 1)}${half(X + 56, -1)}</g>`) +
    part('prCVac', `<g data-st="2">${[[X - 98, Y[2] - 4], [X + 98, Y[2]]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#f4ead2" stroke="#a8875c" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#f4ead2" stroke-width="1" stroke-dasharray="2 2"/>`).join('')}</g>`);
  const kid = (cx, cy, rot, L, W, sg, ks) => `<g${ks ? ` data-ks="${ks}" data-dx="${sg * -38}" data-dy="-36"` : ' class="prBob"'}>${wrap(`translate(${cx},${cy}) rotate(${rot})`, prParaH(L, W, { still: st }) + prMac(8, 6, L * 0.08, W * 0.17) + prMic(-14, -2, 3.6))}</g>`;
  const row3 = part('prFisSep', `<g data-st="3">${gArrow(X - 22, Y[2] + 36, X - 66, Y[3] - 40, AR2)}${gArrow(X + 22, Y[2] + 36, X + 66, Y[3] - 40, AR2)}${kid(440, Y[3], -8, 150, 54, -1, 3)}${kid(625, Y[3], 8, 150, 54, 1, 3)}</g>`);
  const row4 = part('prDaughterP', `<g data-st="3">${gArrow(440, Y[3] + 30, 425, Y[4] - 34, AR)}${gArrow(625, Y[3] + 30, 645, Y[4] - 34, AR)}${kid(415, Y[4], 0, 190, 62)}${kid(650, Y[4], 0, 190, 62)}</g>`);
  const body = `${row0}${row1}${row2}${row3}${row4}
    <text class="cap sm" x="500" y="645" text-anchor="middle">الانقسام أو الانشطار الثنائي (المستعرض) في البراميسيوم — ملزمة ص31</text>`;
  const B = prBuild(PR_PF_ST, still, 26);
  return Object.assign(B.o, {
    body, fnParts: ['prFisB', 'prConstr', 'prFisSep'],
    parts: [
      { id: 'prMicN', anchor: [X - 14, Y[0] - 2], label: [866, 56], side: 'R' },
      { id: 'prMacN', anchor: [X + 38, Y[0] + 6], label: [866, 108], side: 'R' },
      { id: 'prOralBud', anchor: [X - 4, Y[1] - 24], label: [866, 166], side: 'R' },
      { id: 'prFisB', anchor: [X + 40, Y[1] + 7], label: [866, 222], side: 'R' },
      { id: 'prConstr', anchor: [X, Y[2] - 26], label: [866, 280], side: 'R' },
      { id: 'prCVac', anchor: [X + 98, Y[2]], label: [866, 336], side: 'R' },
      { id: 'prFisSep', anchor: [698, Y[3] + 4], label: [866, 440], side: 'R' },
      { id: 'prDaughterP', anchor: [744, Y[4]], label: [866, 568], side: 'R' }
    ],
    tools: B.ctl.tools.concat([{ id: 'info:prPara', label: 'عن البراميسيوم' }, { id: 'tbl:prParaOrig', label: 'المنشأ والمجموعة (ص35)' }, { id: 'tbl:prAsexAll', label: 'طرق التكاثر (مراجعة ص37)' }])
  });
}

/* ───────── البراميسيوم عمودياً (رسوم الاقتران ص34): الخلية اليسرى، والجهة الداخلية +x ───────── */
const PR_PV = [[-4, -84], [12, -80], [24, -64], [27, -40], [20, -20], [14, -6], [20, 12], [27, 40], [22, 66], [8, 84], [-6, 86], [-20, 72], [-28, 40], [-30, 0], [-29, -40], [-22, -68]];
function prParaV(cx, cy, s, mir, still){
  return `<g transform="translate(${n2(cx)},${n2(cy)}) scale(${mir ? -s : s},${s})">` +
    (still ? '' : `<path class="prCil" d="${smoothClosed(PR_PV.map(p => [p[0] * 1.1, p[1] * 1.05]))}" fill="none" stroke="#c9ecf8" stroke-width="2" stroke-dasharray="1.2 4" stroke-linecap="round" opacity=".7"/>`) +
    `<path d="${smoothClosed(PR_PV)}" fill="#a8d8ea" stroke="#3b7b97" stroke-width="2"/>` +
    `<path d="M21,-24 Q4,-4 20,16" fill="none" stroke="#3b7b97" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M-14,-62 q-6,10 -2,22 M-18,30 q4,10 -2,22 M-4,56 q6,6 2,14" fill="none" stroke="#7fb9d1" stroke-width="1.4" opacity=".75"/></g>`;
}
const PR_CA = ['#f7941d', '#a85a00'], PR_CB2 = ['#7a5ad6', '#3a2580'], PR_CF = ['#28b8f0', '#0b6f99'];
const prPos = (cx, cy, sg, lx, ly, off) => [cx + sg * ((off || 25) - lx), cy + ly];
const prDot = (p, r, c, op) => `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${r}" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.2"${op ? ` opacity="${op}"` : ''}/>`;
const prMacV = (p, c, op) => `<ellipse cx="${n2(p[0])}" cy="${n2(p[1])}" rx="9" ry="18" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.6"${op ? ` opacity="${op}"` : ''}/>`;
const PR_CONJ_ST = [
  { n: '1 · التقابل والجسر البروتوبلازمي', d: 'يتقابل فردان من النوع نفسه ولكن من سلالتين مختلفتين ويكون تماسهما من جهة الأخدود الفمي، ويبقيان ملتصقين وقتاً قصيراً، وعندها يتكون جسر بروتوبلازمي وقتي بينهما لغرض عبور أو تبادل مواد كروموسومية.' },
  { n: '2 · انقسام اختزالي للنواة الصغيرة', d: 'النواة الصغيرة في الحيوانين تنقسم اختزالياً لينتج عنها أربع نوى كل منها (س) نصف العدد الكامل من الكروموسومات.' },
  { n: '3 · تنحل ثلاث + انقسام غير متساوٍ', d: 'تنحل وتختفي ثلاث منها بينما تبقى الرابعة تعاني انقساماً اعتيادياً غير متساوٍ ليتكون منها نواتان أوليتان (س): نواة أولية ذكرية ونواة أولية أنثوية.' },
  { n: '4 · تبادل الأنوية الذكرية', d: 'تتبادل الأنوية الذكرية في الحيوانين المقترنين.' },
  { n: '5 · النواة المندمجة (2س) المتباينة', d: 'تتحد الأنوية الذكرية مع الأنوية الأنثوية لتتكون النواة المندمجة (المتباينة العوامل الوراثية) التي تحوي العدد الكامل من الكروموسومات (2س).' },
  { n: '6 · ينفصل الفردان المقترنان', d: 'ينفصل الفردان المقترنان.' },
  { n: '7 · ثمانية براميسيومات بنوية', d: 'ينقسم كل منهما انقسامين اعتياديين ليتكون من كل منهما أربع براميسيومات بنوية، فيكون الناتج 8 براميسيومات بنوية.' }
];
const PR_SELF_ST = [
  PR_CONJ_ST[0], PR_CONJ_ST[1], PR_CONJ_ST[2],
  { n: '4 · النواة المندمجة (2س) المتماثلة', d: 'لا يحصل تبادل للأنوية؛ النواتان الصغيرتان الأوليتان (الذكرية والأنثوية) وكلاهما (س) في البراميسيوم نفسه تتحدان لتكوّنا معاً نواة مندمجة متماثلة العوامل الوراثية (2س).' },
  PR_CONJ_ST[5],
  { n: '6 · ثمانية براميسيومات بنوية', d: 'ينقسم كل منهما انقسامين ليتكون من كل واحد أربع براميسيومات بنوية تحمل عوامله الوراثية نفسها.' }
];
/* ───────── 4) الاقتران (self=false) والإخصاب الذاتي (self=true) في البراميسيوم (ص32–34) ───────── */
function prConj(self, still){
  const X = [780, 600, 420], Y1 = 170, Y2 = 395, YD = 580, st = !!still;
  const pair = (cx, cy, off) => prParaV(cx - (off || 25), cy, 1, false, st) + prParaV(cx + (off || 25), cy, 1, true, st);
  const col = sg => sg < 0 ? PR_CA : PR_CB2;
  const both = f => [-1, 1].map(f).join('');
  /* المرحلة 1: التقابل + الجسر البروتوبلازمي */
  const [c0, c1, c2] = X;
  const s0 = part('prPara', `<g data-st="0">${pair(c0, Y1)}</g>`) +
    part('prProtoBr', `<g data-st="0"><path d="M${c0 - 5},${Y1 - 44} Q${c0},${Y1 - 4} ${c0 - 5},${Y1 + 48} L${c0 + 5},${Y1 + 48} Q${c0},${Y1 - 4} ${c0 + 5},${Y1 - 44}Z" fill="#e6f8ff" stroke="#8fd0e8" stroke-width="1.2"/>` +
      [-30, -14, 2, 18, 34].map(y => `<line x1="${c0 - 4}" y1="${Y1 + y}" x2="${c0 + 4}" y2="${Y1 + y}" stroke="#8fd0e8" stroke-width="1.2"/>`).join('') + `</g>`) +
    part('prMacN', `<g data-st="0">${both(sg => prMacV(prPos(c0, Y1, sg, -9, -34), col(sg)))}</g>`) +
    part('prMicN', `<g data-st="0">${both(sg => prDot(prPos(c0, Y1, sg, 6, 22), 4.2, col(sg)))}</g>`);
  /* المرحلة 2: انقسام اختزالي للنواة الصغيرة → 4 نوى (س) */
  const s1 = part('prMeioMic', `<g data-st="1">${pair(c1, Y1)}${both(sg => prMacV(prPos(c1, Y1, sg, -9, -34), col(sg)) +
    [[2, 14], [12, 26], [-4, 30], [6, 42]].map(([lx, ly], j) => `<g data-ks="1" data-dx="${n2(-sg * (6 - lx) * 0.9)}" data-dy="${22 - ly}">${prDot(prPos(c1, Y1, sg, lx, ly), 3.2, col(sg))}</g>`).join(''))}</g>`);
  /* المرحلة 3: تنحل ثلاث، وانقسام غير متساوٍ للرابعة → ذكرية (صغيرة) + أنثوية */
  const s2 = part('prUneq', `<g data-st="2">${pair(c2, Y1)}${both(sg => prMacV(prPos(c2, Y1, sg, -9, -34), col(sg)))}` +
    part('prDegen', both(sg => [[-6, 40], [2, 54], [-12, 60]].map(([lx, ly]) => prDot(prPos(c2, Y1, sg, lx, ly), 3.2, col(sg), 0.35)).join(''))) +
    part('prFemN', both(sg => prDot(prPos(c2, Y1, sg, 4, 18), 4.8, col(sg)))) +
    part('prMaleN', both(sg => `<g data-ks="2" data-dx="${-sg * 6}" data-dy="6">${prDot(prPos(c2, Y1, sg, 14, 8), 3, col(sg))}</g>`)) + `</g>`);
  const curve = prCurve(c2 + 30, Y1 + 90, 560, 332, c0 - 8, Y2 - 88, '#7fb2ff', 3);
  let row2 = '', row3 = '', note = '';
  const kid = (x, c, mir) => `<g class="prBob">${prParaV(x, YD, 0.4, mir, st)}<ellipse cx="${x + (mir ? 3 : -3)}" cy="${YD - 12}" rx="3.8" ry="7.4" fill="${c[0]}" stroke="${c[1]}" stroke-width="1"/><circle cx="${x + (mir ? -3 : 3)}" cy="${YD + 9}" r="2.2" fill="${c[0]}"/></g>`;
  const kidsX = [345, 407, 469, 531, 610, 672, 734, 796];
  if (!self){
    /* تبادل الأنوية الذكرية: الذكرية تعبر إلى الفرد الآخر */
    row2 += part('prExch', `<g data-st="3">${pair(c0, Y2)}${both(sg => prMacV(prPos(c0, Y2, sg, -9, -34), col(sg), 0.3) + prDot(prPos(c0, Y2, sg, 4, 26), 4.8, col(sg)))}` +
      `<g data-ks="3" data-dx="-24" data-dy="0">${prDot([c0 + 13, Y2 + 6], 3.2, PR_CA)}</g><g data-ks="3" data-dx="24" data-dy="0">${prDot([c0 - 13, Y2 + 34], 3.2, PR_CB2)}</g>` +
      `${gArrow(c0 - 30, Y2 + 2, c0 + 26, Y2 + 2, '#1d3b55')}${gArrow(c0 + 30, Y2 + 40, c0 - 26, Y2 + 40, '#1d3b55')}</g>`);
    row2 += prAr(718, Y2, 662, Y2, 4) + part('prFusHet', `<g data-st="4">${pair(c1, Y2)}${both(sg => `<g data-ks="4" data-s0="0.4" data-px="${prPos(c1, Y2, sg, 0, 10)[0]}" data-py="${Y2 + 10}">${prDot(prPos(c1, Y2, sg, 0, 10), 9, PR_CF)}</g>`)}</g>`);
    row2 += prAr(538, Y2, 503, Y2, 5) + part('prSep', `<g data-st="5"><g data-ks="5" data-dx="23">${prParaV(c2 - 48, Y2, 1, false, st)}${prDot(prPos(c2, Y2, -1, 0, 10, 48), 9, PR_CF)}</g>` +
      `<g data-ks="5" data-dx="-23">${prParaV(c2 + 48, Y2, 1, true, st)}${prDot(prPos(c2, Y2, 1, 0, 10, 48), 9, PR_CF)}</g></g>`);
    row3 = part('prEight', `<g data-st="6">${gArrow(c2 - 48, Y2 + 90, 438, YD - 42, '#7fb2ff')}${gArrow(c2 + 48, Y2 + 90, 640, YD - 42, '#7fb2ff')}${kidsX.map((x, j) => kid(x, PR_CF, j % 2)).join('')}</g>`);
  } else {
    /* الإخصاب الذاتي: النواتان الأوليتان في الفرد نفسه تتحدان (لا تبادل) */
    row2 += part('prFusHom', `<g data-st="3">${pair(c0, Y2)}${both(sg => prMacV(prPos(c0, Y2, sg, -9, -34), col(sg), 0.25) +
      `<g data-ks="3" data-dx="${n2(-sg * 10)}" data-dy="-10">${prDot(prPos(c0, Y2, sg, 0, 10), 3.2, col(sg))}</g><g data-ks="3" data-dx="${n2(sg * 6)}" data-dy="10">${prDot(prPos(c0, Y2, sg, 0, 10), 4.8, col(sg))}</g>` +
      `<g data-ks="3" data-fade="1">${prDot(prPos(c0, Y2, sg, 0, 10), 9, col(sg))}</g>`)}</g>`);
    row2 += prAr(718, Y2, 686, Y2, 4) + part('prSep', `<g data-st="4"><g data-ks="4" data-dx="23">${prParaV(c1 - 48, Y2, 1, false, st)}${prDot(prPos(c1, Y2, -1, 0, 10, 48), 9, PR_CA)}</g>` +
      `<g data-ks="4" data-dx="-23">${prParaV(c1 + 48, Y2, 1, true, st)}${prDot(prPos(c1, Y2, 1, 0, 10, 48), 9, PR_CB2)}</g></g>`);
    note = `<g data-st="3"><rect x="${c2 - 82}" y="${Y2 - 44}" width="164" height="88" rx="14" fill="rgba(255,120,120,.10)" stroke="rgba(255,150,150,.55)" stroke-dasharray="6 5"/>
      <text class="cap sm" x="${c2}" y="${Y2 - 8}" text-anchor="middle">لا يحدث تبادل</text><text class="cap sm" x="${c2}" y="${Y2 + 18}" text-anchor="middle">للأنوية الذكرية</text></g>`;
    row3 = part('prEight', `<g data-st="5">${gArrow(c1 - 48, Y2 + 90, 440, YD - 42, '#7fb2ff')}${gArrow(c1 + 48, Y2 + 90, 700, YD - 42, '#7fb2ff')}${kidsX.map((x, j) => kid(x, j < 4 ? PR_CA : PR_CB2, j % 2)).join('')}</g>`);
  }
  const body = `
    ${prAr(718, Y1, 662, Y1, 1)}${prAr(538, Y1, 482, Y1, 2)}${curve}
    ${s0}${s1}${s2}${row2}${note}${row3}
    <text class="cap sm" x="560" y="645" text-anchor="middle">${self ? 'الإخصاب الذاتي في البراميسيوم: نواة مندمجة متماثلة العوامل الوراثية — ملزمة ص33–34' : 'الاقتران في البراميسيوم: نواة مندمجة متباينة العوامل الوراثية — ملزمة ص32–34'}</text>`;
  const B = prBuild(self ? PR_SELF_ST : PR_CONJ_ST, still, self ? 34 : 40);
  const parts = [
    { id: 'prMacN', anchor: prPos(c0, Y1, 1, -9, -48), label: [866, 100], side: 'R' },
    { id: 'prMicN', anchor: prPos(c0, Y1, 1, 6, 22), label: [866, 205], side: 'R' },
    { id: 'prProtoBr', anchor: [c0, Y1 - 40], label: [c0 - 70, 58], side: 'C' },
    { id: 'prMeioMic', anchor: prPos(c1, Y1, 1, 6, 42), label: [c1, 280], side: 'C' },
    { id: 'prUneq', anchor: [c2 - 10, Y1 + 80], label: [c2 - 50, 282], side: 'C' },
    { id: 'prDegen', anchor: prPos(c2, Y1, -1, -6, 40), label: [134, 262], side: 'L' },
    { id: 'prMaleN', anchor: prPos(c2, Y1, -1, 14, 8), label: [134, 306], side: 'L' },
    { id: 'prFemN', anchor: prPos(c2, Y1, -1, 4, 18), label: [134, 350], side: 'L' }
  ];
  if (!self) parts.push(
    { id: 'prExch', anchor: [c0 + 18, Y2 + 2], label: [866, 395], side: 'R' },
    { id: 'prFusHet', anchor: prPos(c1, Y2, 1, 0, 10), label: [c1 + 14, 505], side: 'C' },
    { id: 'prSep', anchor: [c2 + 48, Y2 + 70], label: [c2 - 12, 505], side: 'C' },
    { id: 'prEight', anchor: [333, YD], label: [134, YD], side: 'L' });
  else parts.push(
    { id: 'prFusHom', anchor: prPos(c0, Y2, 1, 0, 10), label: [866, 395], side: 'R' },
    { id: 'prSep', anchor: [c1 + 48, Y2 + 70], label: [c1, 505], side: 'C' },
    { id: 'prEight', anchor: [333, YD], label: [134, YD], side: 'L' });
  return Object.assign(B.o, {
    body, fnParts: ['prProtoBr', 'prMeioMic', 'prUneq', self ? 'prFusHom' : 'prExch'], parts,
    tools: B.ctl.tools.concat([{ id: 'tbl:prConjSelf', label: 'الاقتران × الإخصاب الذاتي (ص34)' }, { id: 'tbl:prParaOrig', label: 'المنشأ والمجموعة (ص35)' }, { id: 'tbl:prBridges', label: 'الجسر البروتوبلازمي × جسر الاقتران' }])
  });
}

/* ───────── اليوغلينا: مغزلية خضراء، سوط واحد، نواة بنفسجية (رسم ص36) ───────── */
const PR_EU = [[0, -84], [8, -91], [16, -88], [27, -70], [32, -40], [33, -5], [28, 30], [20, 62], [10, 88], [2, 104], [-6, 96], [-16, 70], [-26, 36], [-32, 0], [-31, -40], [-25, -70], [-16, -88], [-8, -91]];
const PR_HEART = [[0, -46], [-12, -70], [-32, -74], [-50, -54], [-56, -18], [-48, 22], [-30, 56], [-10, 80], [0, 88], [10, 80], [30, 56], [48, 22], [56, -18], [50, -54], [32, -74], [12, -70]];
const prChloros = (sx, sy, seed, skip) => prPts(15, 23, 74, seed, 13).filter(([x, y]) => !skip(x * sx, y * sy)).map(([x, y], j) =>
  `<ellipse cx="${n2(x * sx)}" cy="${n2(y * sy)}" rx="5.2" ry="3" transform="rotate(${(j * 53) % 180} ${n2(x * sx)} ${n2(y * sy)})" fill="#5ea83c" opacity=".85"/>`).join('');
const PR_EBODY = (d) => `<path d="${d}" fill="#9ad35f" stroke="#3e7d2a" stroke-width="2.2"/>`;
const prEuNuc = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#a05fc8" stroke="#5a2f7a" stroke-width="1.6"/><ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.3}" rx="${rx * 0.35}" ry="${ry * 0.3}" fill="#c99ae6" opacity=".7"/>`;
/* خلية يوغلينا كاملة (إحداثيات محلية، الطرف الأمامي للأعلى) */
function prEuCell(i, P){
  const cyto = PR_EBODY(smoothClosed(PR_EU)) + prChloros(1, 1, 41 + i, (x, y) => Math.abs(x) < 15 && Math.abs(y - 10) < 20) +
    `<circle cx="0" cy="-74" r="5" fill="#e9ffe0" stroke="#7fb06a" stroke-width="1"/><circle cx="9" cy="-68" r="3" fill="#ff6a4a"/>`;
  const flag = prFlag(0, -84, -Math.PI / 2 - 0.12, 125, 8, 1.3, i, '#2f6b22', 2.6);
  return (P ? part('prECyto', cyto) + part('prENuc', prEuNuc(0, 10, 11, 14)) + part('prEFlag', flag) : cyto + prEuNuc(0, 10, 11, 14) + flag);
}
const PR_EU_ST = [
  { n: '1 · اليوغلينا حرة السباحة', d: 'اليوغلينا كائن من الطليعيات السوطية (ذات أسواط) تتواجد في البرك ومجاري المياه العذبة التي تتوفر فيها النباتات، وتوجد في حالتين: حرة السباحة، ومتكيسة عندما تكون الظروف غير ملائمة. تتكاثر لا جنسياً بالانقسام الثنائي الطولي في الطورين.' },
  { n: '2 · انقسام النواة وسوط إضافي', d: 'تنقسم النواة انقساماً خيطياً اعتيادياً ويتكون سوط إضافي.' },
  { n: '3 · انقسام السايتوبلازم طولياً', d: 'ينقسم السايتوبلازم طولياً وبشكل تدريجي (يبدأ من الطرف الأمامي).' },
  { n: '4 · فردان جديدان', d: 'يستمر الانقسام لحين انفصال القسمين بالكامل ليتكون فردان جديدان. ملاحظة: التكاثر الجنسي في اليوغلينا غير مكتشف.' }
];
/* ───────── 5) الانقسام الثنائي الطولي في اليوغلينا (ص36) ───────── */
function prEugl(still){
  const C0 = [775, 440], C1 = [610, 445], C2 = [440, 450], C3 = [245, 448];
  const cell0 = `<g data-st="0">${wrap(`translate(${C0[0]},${C0[1]})`, prEuCell(0, true))}</g>`;
  const wide = smoothClosed(PR_EU.map(([x, y]) => [x * 1.25, y * 0.82]));
  const cell1 = part('prEMit', `<g data-st="1">${wrap(`translate(${C1[0]},${C1[1]})`, PR_EBODY(wide) + prChloros(1.25, 0.82, 51, (x, y) => Math.abs(x) < 26 && Math.abs(y - 6) < 16) +
    `<g data-ks="1" data-s0="0.55" data-px="0" data-py="6">${prEuNuc(0, 6, 21, 11)}</g>` + prFlag(-4, -70, -Math.PI / 2 - 0.32, 110, 8, 1.3, 2, '#2f6b22', 2.6) +
    part('prEFlag2', `<g data-ks="1" data-s0="0.1" data-px="5" data-py="-70">${prFlag(5, -70, -Math.PI / 2 + 0.3, 110, 8, 1.3, 3.4, '#2f6b22', 2.6)}</g>`))}</g>`);
  const cell2 = part('prELong', `<g data-st="2">${wrap(`translate(${C2[0]},${C2[1]})`, PR_EBODY(smoothClosed(PR_HEART)) + prChloros(1.7, 0.95, 61, (x, y) => Math.abs(x) < 34 && Math.abs(y - 4) < 16) +
    `<g data-ks="2" data-s0="0.7" data-px="0" data-py="4">${prEuNuc(-17, 4, 12, 10)}${prEuNuc(17, 4, 12, 10)}<rect x="-8" y="0" width="16" height="7" fill="#a05fc8"/></g>` +
    prFlag(-22, -71, -Math.PI / 2 - 0.25, 105, 8, 1.3, 4, '#2f6b22', 2.6) + prFlag(22, -71, -Math.PI / 2 + 0.25, 105, 8, 1.3, 5.3, '#2f6b22', 2.6))}</g>`);
  const piv = C3[1] + 91.5;
  const half = (sg, i) => `<g data-ks="3" data-rot="${-sg * 25}" data-px="${C3[0]}" data-py="${piv}"><g transform="translate(${C3[0]},${C3[1]}) rotate(${sg * 25} 0 91.5) scale(.88)">${prEuCell(i, false)}</g></g>`;
  const cell3 = part('prEDaught', `<g data-st="3">${half(-1, 6)}${half(1, 7.5)}</g>`);
  const cyst = part('prECyst', `<g transform="translate(790,604)"><circle r="27" fill="#d9efb8" stroke="#7aa95a" stroke-width="5"/><circle r="18" fill="#9ad35f" stroke="#3e7d2a" stroke-width="1.6"/>${prEuNuc(0, 2, 6, 7)}<ellipse cx="-9" cy="-9" rx="3.6" ry="2.2" fill="#5ea83c"/><ellipse cx="10" cy="-6" rx="3.6" ry="2.2" fill="#5ea83c"/><ellipse cx="-6" cy="11" rx="3.6" ry="2.2" fill="#5ea83c"/></g>`);
  const body = `
    ${prAr(735, 445, 672, 445, 1, '#e8e0c0')}${prAr(560, 445, 503, 445, 2, '#e8e0c0')}${prAr(382, 445, 330, 445, 3, '#e8e0c0')}
    ${cell0}${cell1}${cell2}${cell3}${cyst}
    <text class="cap sm" x="470" y="645" text-anchor="middle">الانقسام (الانشطار) الثنائي الطولي في اليوغلينا — ملزمة ص36</text>`;
  const B = prBuild(PR_EU_ST, still, 24);
  return Object.assign(B.o, {
    body, fnParts: ['prEMit', 'prELong'],
    parts: [
      { id: 'prEFlag', anchor: [768, 300], label: [866, 252], side: 'R' },
      { id: 'prENuc', anchor: [786, 450], label: [866, 432], side: 'R' },
      { id: 'prECyto', anchor: [794, 500], label: [866, 500], side: 'R' },
      { id: 'prEFlag2', anchor: [626, 318], label: [610, 250], side: 'C' },
      { id: 'prEMit', anchor: [610, 520], label: [615, 576], side: 'C' },
      { id: 'prELong', anchor: [440, 535], label: [432, 616], side: 'C' },
      { id: 'prEDaught', anchor: [245, 540], label: [228, 590], side: 'C' },
      { id: 'prECyst', anchor: [817, 604], label: [866, 590], side: 'R' }
    ],
    tools: B.ctl.tools.concat([{ id: 'info:prEug', label: 'عن اليوغلينا' }, { id: 'tbl:prAsexAll', label: 'طرق التكاثر (مراجعة ص37)' }])
  });
}

/* ───────── عفن الخبز الأسود: خيوط فطرية، اندماج، زايكوت، حافظة بوغية (رسم ص39) ───────── */
const prTube = (d, w) => `<path d="${d}" fill="none" stroke="#a88d55" stroke-width="${(w || 9) + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f3e6c0" stroke-width="${w || 9}" stroke-linecap="round"/>`;
const prGran = (r, seed, fill, stroke) => { const g = rng(seed); let s = `<circle r="${r}" fill="${fill}" stroke="${stroke || '#8f8f2a'}" stroke-width="1.6"/>`;
  for (let j = 0; j < Math.round(r * 1.4); j++){ const a = g() * 6.283, d = Math.sqrt(g()) * (r - 3); s += `<circle cx="${n2(Math.cos(a) * d)}" cy="${n2(Math.sin(a) * d)}" r="${n2(1 + g() * 1.4)}" fill="#8a8a1e" opacity=".7"/>`; }
  return s; };
const PR_RED = ['#e8434a', '#8a1a1e'], PR_BLUE = ['#3c6df0', '#16307a'], PR_PURP = ['#9b3fd0', '#4c1670'];
/* وحدة التقاء هايفتين (إحداثيات محلية) — state: touch | plasmo | gam | zyg | wall | germ */
function prJunc(state, ks, sub){
  const L = prTube('M-74,-40 Q-46,-20 -14,-3') + prTube('M-48,-22 Q-64,-4 -78,8', 7);
  const R = prTube('M74,40 Q46,20 14,3') + prTube('M48,22 Q64,4 78,-8', 7);
  const dot = (x, y, c, r) => `<circle cx="${x}" cy="${y}" r="${r || 4}" fill="${c[0]}" stroke="${c[1]}" stroke-width="1"/>`;
  if (state === 'touch') return `<g data-ks="${ks}" data-dx="-12" data-dy="-7">${L}${dot(-22, -7, PR_RED)}</g><g data-ks="${ks}" data-dx="12" data-dy="7">${R}${dot(22, 7, PR_BLUE)}</g>`;
  let c = '';
  if (state === 'plasmo') c = `<g data-ks="${ks}" data-s0="0.4" data-px="0" data-py="0"><ellipse rx="20" ry="15" fill="#f3e6c0" stroke="#a88d55" stroke-width="2"/><rect x="-4" y="-13" width="8" height="26" fill="#d8dc5a" opacity=".85"/>${dot(-8, -2, PR_RED)}${dot(8, 3, PR_BLUE)}</g>`;
  if (state === 'gam') c = `<g data-ks="${ks}" data-s0="0.6" data-px="0" data-py="0">${prGran(22, 5, '#e3e27a', '#a88d55')}${dot(-6, -3, PR_RED, 4.4)}${dot(6, 3, PR_BLUE, 4.4)}</g>`;
  if (state === 'zyg') c = prGran(25, 9, '#d6d84a') + `<g data-ks="${ks}" data-dx="-7">${dot(-1, 0, PR_RED)}</g><g data-ks="${ks}" data-dx="7">${dot(1, 0, PR_BLUE)}</g>` + (sub || '');
  if (state === 'wall' || state === 'germ') c = prGran(25, 13, '#d6d84a') + `<circle r="27" fill="none" stroke="#5f5a22" stroke-width="6" stroke-dasharray="5 2.4"${state === 'wall' ? ` data-ks="${ks}" data-sw0="1" data-sw1="6"` : ''}/>` + dot(0, 0, PR_PURP, 5);
  return L + R + c + (state === 'germ' ? (sub || '') : '');
}
const PR_FUN_ST = [
  { n: '1 · الخيوط الفطرية (س)', d: 'ينمو عفن الخبز الأسود على قطعة خبز رطب على شكل خيوط فطرية (هايفات) أحادية المجموعة الكروموسومية (س): بعضها تحوي نوى موجبة وأخرى تحوي نوى سالبة، وتحمل حوافظ الأبواغ.' },
  { n: '2 · اندماج الهايفات', d: 'يحصل تماس واندماج بين الخيوط الفطرية أو (الهايفات) التي تحتوي نوى مختلفة: موجبة وأخرى سالبة.' },
  { n: '3 · اندماج سايتوبلازمي', d: 'يتبع اندماجَ الهايفات اندماجٌ سايتوبلازمي (دون اندماج الأنوية).' },
  { n: '4 · خلية الأمشاج (س)', d: 'تتكون خلية الأمشاج المحتوية على النوى السالبة والموجبة في نهاية كل هايفة. تبقى أحادية المجموعة الكروموسومية لأنه حدث اندماج سايتوبلازمي فقط ولم يحدث اندماج للأنوية.' },
  { n: '5 · اندماج نووي ← الزايكوت (2س)', d: 'يحصل اندماج نووي (اندماج النواتين)، وتندمج الخلايا المشيجية وزوج الأنوية ثم تلتحم لتكوّن الزيجة (الزايكوت).' },
  { n: '6 · جدار سميك + انقسام اختزالي', d: 'يتكون جدار سميك حول الزايكوت (2س)، وتحصل عملية انقسام اختزالي.' },
  { n: '7 · الحافظة البوغية والأبواغ (س)', d: 'ينمو حامل الكيس أو الحافظة البوغية وتنشق هذه الحافظة لتتحرر الأبواغ التي تكون (س) لأنها ناتجة من الانقسام الاختزالي، وعندما تتساقط على مادة غذائية (قطعة خبز رطب) تبدأ دورته اللاجنسية وتتكرر العملية.' }
];
/* ───────── 6) دورة حياة عفن الخبز الأسود (ص38–39) ───────── */
function prRhizo(still){
  const S = 0.85, M = (x, y, inner) => `<g transform="translate(${x},${y}) scale(${S})">${inner}</g>`;
  const P1 = [770, 362], P2 = [795, 236], P3 = [720, 112], P4 = [560, 80], P5 = [400, 138], P6 = [470, 388];
  const loc = (P, x, y) => [n2(P[0] + x * S), n2(P[1] + y * S)];
  /* الخبز والغزل الفطري */
  const br = rng(77); let crumbs = '';
  for (let j = 0; j < 70; j++) crumbs += `<circle cx="${n2(306 + br() * 532)}" cy="${n2(512 + br() * 66)}" r="${n2(1 + br() * 1.8)}" fill="${j % 3 ? '#c9ad6a' : '#f6ecc6'}"/>`;
  const bread = part('prBread', `<path d="M300,506 L846,506 L846,584 Q573,596 300,584 Z" fill="#ead9a2" stroke="#c9b277" stroke-width="2"/>${crumbs}`);
  const rhiz = (x) => `<path d="M${x},507 l-6,22 m6,-22 l4,26 m-4,-26 l12,16 m-12,-16 l-14,12" fill="none" stroke="#a88d55" stroke-width="1.6" stroke-linecap="round"/>`;
  const stalk = (x0, x1, y1, head) => `<path d="M${x0},505 Q${(x0 + x1) / 2 + 6},${(505 + y1) / 2} ${x1},${y1 + 9}" fill="none" stroke="#a88d55" stroke-width="2.6"/>` + (head ? `<circle cx="${x1}" cy="${y1}" r="9.5" fill="#9a9a9a" stroke="#5a5a5a" stroke-width="1.6"/>` : '');
  const heads = xs => xs.map(([x1, y1]) => `<circle cx="${x1}" cy="${y1}" r="9.5" fill="#9a9a9a" stroke="#5a5a5a" stroke-width="1.6"/><circle cx="${x1 - 3}" cy="${y1 - 3}" r="3" fill="#cfcfcf"/>`).join('');
  const L_ST = [[338, 334, 447], [360, 366, 434], [384, 398, 450]], R_ST = [[690, 678, 452], [712, 706, 438], [734, 736, 455]];
  const plus = part('prPlusN', `<g data-st="0">${prTube('M300,503 Q360,494 420,500 Q455,504 486,502', 6)}${rhiz(345)}${rhiz(380)}${L_ST.map(([a, b, c]) => stalk(a, b, c, true)).join('')}` +
    [318, 352, 404, 440, 474].map(x => `<circle cx="${x}" cy="${x % 2 ? 501 : 500}" r="2.8" fill="${PR_RED[0]}"/>`).join('') + `</g>`);
  const minus = part('prMinusN', `<g data-st="0">${prTube('M652,502 Q690,496 730,500 Q790,506 846,500', 6)}${rhiz(700)}${rhiz(735)}${R_ST.map(([a, b, c]) => stalk(a, b, c, false)).join('')}` +
    [664, 704, 756, 796, 830].map(x => `<circle cx="${x}" cy="501" r="2.8" fill="${PR_BLUE[0]}"/>`).join('') + `</g>`);
  const hyph = part('prHyphae', `<g data-st="0">${prTube('M486,502 Q530,500 566,503', 6)}${prTube('M576,503 Q614,500 652,502', 6)}<circle cx="571" cy="503" r="15" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="4 3"/><circle cx="526" cy="501" r="2.8" fill="${PR_RED[0]}"/><circle cx="616" cy="501" r="2.8" fill="${PR_BLUE[0]}"/></g>`);
  const spH = part('prSpHeads', `<g data-st="0">${heads(R_ST.map(([, b, c]) => [b, c]))}</g>`);
  /* مراحل الدورة */
  const m1 = part('prHypFuse', `<g data-st="1">${M(P1[0], P1[1], prJunc('touch', 1))}</g>`);
  const m2 = part('prPlasmo', `<g data-st="2">${M(P2[0], P2[1], prJunc('plasmo', 2))}</g>`);
  const m3 = part('prGamCell', `<g data-st="3">${M(P3[0], P3[1], prJunc('gam', 3))}</g>`);
  const m4 = part('prZygF', `<g data-st="4">${M(P4[0], P4[1], prJunc('zyg', 4, part('prKaryo', `<g data-ks="4" data-fade="1"><circle r="6" fill="${PR_PURP[0]}" stroke="${PR_PURP[1]}" stroke-width="1.2"/></g>`)))}</g>`);
  const m5 = part('prThickW', `<g data-st="5">${M(P5[0], P5[1], prJunc('wall', 5))}</g>`);
  /* الإنبات: حامل الكيس والحافظة البوغية (إحداثيات محلية للوحدة) */
  const sg = rng(19); let spores = '';
  for (let j = 0; j < 26; j++){ const a = 1.9 + sg() * 1.9, d = 24 + sg() * 44; spores += `<circle cx="${n2(-96 + Math.cos(a) * d)}" cy="${n2(-104 + Math.sin(a) * d * 0.8)}" r="${n2(1.6 + sg() * 1.2)}" fill="#8a5a2e"/>`; }
  const germ = `<g data-ks="6" data-s0="0.15" data-px="0" data-py="-26">` + part('prSporangioph', `<path d="M0,-26 Q-30,-56 -84,-92" fill="none" stroke="#6b5b3a" stroke-width="4.4" stroke-linecap="round"/>`) +
    part('prSporang', `<circle cx="-96" cy="-104" r="18" fill="#8d8d8d" stroke="#4a4a4a" stroke-width="2"/><path d="M-106,-96 Q-96,-112 -86,-96" fill="#b5b5b5"/>`) + `</g>` + part('prSporesF', `<g data-ks="6" data-fade="1">${spores}</g>`);
  const m6 = `<g data-st="6">${M(P6[0], P6[1], prJunc('germ', 6, germ))}</g>`;
  /* أبواغ تتساقط على الخبز (حركة فقط) */
  let fall = '';
  for (let j = 0; j < 12; j++) fall += `<circle class="prFall" data-j="${j}" cx="0" cy="0" r="2.4" fill="#8a5a2e"/>`;
  const meio = part('prMeioF', `<g data-st="6">${prCurve(P5[0] + 44, P5[1] + 26, 500, 220, P6[0] + 12, P6[1] - 34, '#8a96ff', 6).replace(/^<g data-st="6">/, '<g>')}</g>`);
  const AC = '#8a96ff';
  const body = `
    ${bread}${plus}${minus}${hyph}${spH}
    ${prAr(588, 492, 732, 396, 1, AC)}${prAr(790, 326, 796, 280, 2, AC)}${prAr(786, 200, 760, 152, 3, AC)}${prAr(662, 94, 626, 86, 4, AC)}${prAr(496, 84, 458, 110, 5, AC)}
    ${prAr(372, 340, 342, 488, 6, '#b58a5a')}
    ${m1}${m2}${m3}${m4}${m5}${meio}${m6}
    <g id="prFallG" data-only="6" opacity="0">${fall}</g>
    <text class="cap sm" x="575" y="645" text-anchor="middle">دورة حياة عفن الخبز الأسود (الفطريات اللاقحية) — ملزمة ص38–39</text>`;
  const B = prBuild(PR_FUN_ST, still, 40);
  const tick0 = B.o.tick;
  return Object.assign(B.o, {
    body, fnParts: ['prHypFuse', 'prPlasmo', 'prKaryo', 'prMeioF'],
    parts: [
      { id: 'prBread', anchor: [318, 560], label: [134, 612], side: 'L' },
      { id: 'prPlusN', anchor: [312, 502], label: [134, 540], side: 'L' },
      { id: 'prHyphae', anchor: [540, 506], label: [560, 616], side: 'C' },
      { id: 'prMinusN', anchor: [832, 503], label: [866, 560], side: 'R' },
      { id: 'prSpHeads', anchor: [745, 452], label: [866, 470], side: 'R' },
      { id: 'prHypFuse', anchor: loc(P1, 40, 20), label: [866, 380], side: 'R' },
      { id: 'prPlasmo', anchor: loc(P2, 20, 8), label: [866, 248], side: 'R' },
      { id: 'prGamCell', anchor: loc(P3, 20, 10), label: [866, 112], side: 'R' },
      { id: 'prZygF', anchor: loc(P4, 0, -25), label: [P4[0], 26], side: 'C' },
      { id: 'prKaryo', anchor: loc(P4, 0, 6), label: [P4[0], 166], side: 'C' },
      { id: 'prThickW', anchor: loc(P5, 0, -29), label: [P5[0], 70], side: 'C' },
      { id: 'prMeioF', anchor: [484, 245], label: [580, 262], side: 'C' },
      { id: 'prSporang', anchor: loc(P6, -114, -104), label: [134, 300], side: 'L' },
      { id: 'prSporangioph', anchor: loc(P6, -40, -62), label: [134, 350], side: 'L' },
      { id: 'prSporesF', anchor: loc(P6, -130, -78), label: [134, 410], side: 'L' }
    ],
    tools: B.ctl.tools.concat([{ id: 'info:prFungi', label: 'عن الفطريات' }, { id: 'info:prRhizo', label: 'عن عفن الخبز الأسود' }, { id: 'tbl:prFungChrom', label: 'المجموعة الكروموسومية (ص38)' }, { id: 'tbl:prFungPlant', label: 'الفطريات × النباتات (ص37)' }]),
    tick(dt, t, a){
      tick0(dt, t, a);
      /* الأبواغ تخرج من الحافظة البوغية وتسقط على الخبز */
      const sx = P6[0] - 96 * S, sy = P6[1] - 104 * S;
      a.all('.prFall').forEach(c => { const j = +c.dataset.j, p = (t * 0.22 + j / 12) % 1;
        const x = sx - 20 - p * (40 + (j % 4) * 14) + Math.sin(t * 2 + j) * 4, y = sy + p * (505 - sy) * (0.7 + 0.3 * p);
        c.setAttribute('cx', n2(x)); c.setAttribute('cy', n2(Math.min(503, y))); c.setAttribute('opacity', n2(Math.min(1, (1 - p) * 4))); });
    }
  });
}

