
/* ══════════════════════════════════════════════════════════════════════════
   4.8 · النسيج العصبي — ملزمة ص80–85: العصبونة بأجزائها (جسم الخلية بنواته
         وحبيبات نسل، التشجرات، المحور والغلاف النخاعيني) ومسار الحوافز،
         أنواع الخلايا العصبية حسب عدد البروزات (رسم ص84)، والخلايا الدبقية
   ══════════════════════════════════════════════════════════════════════════ */
const NRV_VIEWS = [
  { id: 'nneuron', label: 'العصبونة' },
  { id: 'ntypes',  label: 'أنواع الخلايا العصبية' },
  { id: 'nglia',   label: 'الخلايا الدبقية' }
];
const NRV_SRC = { nneuron: 'ملزمة ص81–84', ntypes: 'ملزمة ص83–84', nglia: 'ملزمة ص80–83' };
const NRV_STAGES = [
  { n: 'التشجرات', d: 'التشجرات بروزات قصيرة من جسم الخلية توصل الإشارات أو الحوافز العصبية إلى جسم الخلية.',
    cam: { yaw: 0.35, pitch: 0.25, dist: 6.2, target: [-2.3, 0.3, 0] } },
  { n: 'جسم الخلية', d: 'جسم الخلية الجزء المتسع من الخلية: نواة ذات نوية واضحة، وسايتوبلازم فيه حبيبات نسل ولييفات عصبية.',
    cam: { yaw: 0.2, pitch: 0.2, dist: 5.4, target: [-1.6, 0, 0] } },
  { n: 'المحور', d: 'المحور بروز طويل ومفرد ينقل الحوافز العصبية بعيداً عن جسم الخلية، وقد يكون محاطاً بغلاف نخاعيني.',
    cam: { yaw: 0.1, pitch: 0.3, dist: 8.2, target: [0.8, 0, 0] } }
];
const NRV_PAL = { cell: '#9fb0ea', cellL: '#e6ecff', my: '#f0c0c8', myL: '#c87a8a', imp: '#7ff0ff', glia: '#9bc88a', nissl: '#2a3a8a' };

SCENES.nerv = {
  title: 'النسيج العصبي',
  get src(){ return NRV_SRC[SEL.nrv] || 'ملزمة ص80'; },
  tint: ['rgba(120,110,170,.26)', 'rgba(80,140,170,.16)'],
  model3d: () => 'nrv_' + SEL.nrv,
  build(){
    const v = NRV_VIEWS.some(x => x.id === SEL.nrv) ? SEL.nrv : 'nneuron';
    const s = ({ nneuron: nrvNeuron, ntypes: nrvTypes, nglia: nrvGlia })[v]();
    s.rebuildOnRadio = 'nrv';
    s.tools = NRV_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'nrv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.nrv_neuron = { title: 'خلية عصبية متعددة الأقطاب', build: () => nrvNeuron() };
SCENES.nrv_bi     = { title: 'خلية عصبية ثنائية القطب', build: () => nrvOne('bi') };
SCENES.nrv_pseudo = { title: 'خلية عصبية أحادية القطب كاذبة', build: () => nrvOne('pseudo') };

/* نقطة على مسار متعدد الأجزاء عند نسبة u */
function polyAt(P, u){
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++){ const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
  let s = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < L.length; i++){ if (s <= L[i]){ const k = L[i] ? s / L[i] : 0; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; } s -= L[i]; }
  return P[P.length - 1];
}
const nP = (x, y) => n2(x) + ',' + n2(y);
/* تفرعات (تشجر) عند نهاية: خط رئيسي ثم فرعان ثم فرعان أصغر */
function twigs(x, y, a, L, w){ let d = ''; const go = (x0, y0, ang, len, k) => { const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len; d += `M${nP(x0, y0)} L${nP(x1, y1)} `; if (k) [-0.5, 0.5].forEach(s => go(x1, y1, ang + s, len * 0.6, k - 1)); };
  go(x, y, a, L, 2); return `<path d="${d}" fill="none" stroke="${NRV_PAL.cell}" stroke-width="${w}" stroke-linecap="round"/>`; }
/* محور مع قطع الغلاف النخاعيني ونوى صغيرة عليها (كما في رسم الملزمة) */
function axonSeg(x0, x1, y, w, my, segW){
  let s = `<path d="M${nP(x0, y)} L${nP(x1, y)}" stroke="${NRV_PAL.cell}" stroke-width="${w}" stroke-linecap="round"/>`, m = '';
  if (my) for (let x = x0 + 8; x + segW <= x1 - 4; x += segW + 6) m += `<rect x="${n2(x)}" y="${n2(y - w * 1.6)}" width="${n2(segW)}" height="${n2(w * 3.2)}" rx="${n2(w * 1.4)}" fill="${NRV_PAL.my}" stroke="${NRV_PAL.myL}" stroke-width="1.2"/><circle cx="${n2(x + segW * 0.6)}" cy="${n2(y - w * 1.4)}" r="${n2(w * 0.55)}" fill="#3a4ab0"/>`;
  return { s, m };
}
/* رسم خلية عصبية أفقياً (التشجرات يساراً والمحور يميناً) حول (cx, cy) بمقياس k */
function neuronSVG(type, cx, cy, k, seed){
  const rr = rng(seed || 5), o = { dendr: '', soma: '', nuc: '', nissl: '', axon: '', myelin: '', anchors: {}, path: [] };
  const S = 40 * k, L = 330 * k, w = Math.max(3, 9 * k), segW = 46 * k;
  const nucleus = (x, y, r) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="url(#gNucl)"/><circle cx="${n2(x + r * 0.25)}" cy="${n2(y - r * 0.2)}" r="${n2(r * 0.32)}" fill="url(#gNucleolus)"/>`;
  if (type === 'multi'){
    const sb = blobPath(cx, cy, S * 1.2, S * 1.05, 0.14, 21 + (seed || 0), 18);
    o.soma = `<path d="${sb.d}" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="2"/>`;
    o.nuc = nucleus(cx - S * 0.1, cy, S * 0.42);
    for (let i = 0; i < 14; i++){ const a = rr() * 6.283, d = S * (0.55 + rr() * 0.35); o.nissl += `<ellipse cx="${n2(cx + Math.cos(a) * d)}" cy="${n2(cy + Math.sin(a) * d * 0.9)}" rx="${n2(S * 0.09)}" ry="${n2(S * 0.05)}" transform="rotate(${n2(a * 57)} ${n2(cx + Math.cos(a) * d)} ${n2(cy + Math.sin(a) * d * 0.9)})" fill="${NRV_PAL.nissl}"/>`; }
    [2.2, 2.7, 3.15, 3.6, 4.1, 1.6, 4.7].forEach((a, i) => { const x = cx + Math.cos(a) * S, y = cy + Math.sin(a) * S; o.dendr += twigs(x, y, a, S * (1.1 + (i % 2) * 0.3), w * 0.8); if (i === 2) o.anchors.dendr = [x + Math.cos(a) * S * 0.9, y + Math.sin(a) * S * 0.9]; });
    const ax = axonSeg(cx + S, cx + S + L, cy, w * 0.75, true, segW);
    o.axon = ax.s + twigs(cx + S + L, cy, 0, S * 0.7, w * 0.6); o.myelin = ax.m;
    o.anchors.soma = [cx - S * 0.6, cy + S * 0.75]; o.anchors.axon = [cx + S + L - 6, cy]; o.anchors.myelin = [cx + S + 8 + segW * 2.5 + 12, cy - w * 1.2]; o.anchors.nuc = [cx - S * 0.3, cy + S * 0.15];
    o.anchors.nissl = [cx + Math.cos(0.9) * S * 0.75, cy + Math.sin(0.9) * S * 0.7];
    o.path = [[cx + Math.cos(3.15) * S * 2.2, cy], [cx - S, cy], [cx, cy], [cx + S, cy], [cx + S + L, cy]];
  } else if (type === 'bi'){
    o.soma = `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(S * 1.15)}" ry="${n2(S * 0.7)}" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="2"/>`;
    o.nuc = nucleus(cx, cy, S * 0.36);
    const dl = `<path d="M${nP(cx - S * 1.1, cy)} L${nP(cx - S * 3.2, cy)}" stroke="${NRV_PAL.cell}" stroke-width="${n2(w * 0.8)}" stroke-linecap="round"/>`;
    o.dendr = dl + twigs(cx - S * 3.2, cy, Math.PI, S * 0.8, w * 0.6);
    const ax = axonSeg(cx + S * 1.1, cx + S + L, cy, w * 0.7, false, segW);
    o.axon = ax.s + twigs(cx + S + L, cy, 0, S * 0.8, w * 0.6);
    o.anchors.soma = [cx - S * 0.4, cy + S * 0.6]; o.anchors.dendr = [cx - S * 2.2, cy]; o.anchors.axon = [cx + S + L * 0.6, cy]; o.anchors.nuc = [cx, cy];
    o.path = [[cx - S * 3.6, cy], [cx, cy], [cx + S + L, cy]];
  } else if (type === 'pseudo'){
    const by = cy - S * 1.6;
    o.soma = `<circle cx="${n2(cx)}" cy="${n2(by)}" r="${n2(S * 0.85)}" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="2"/><path d="M${nP(cx, by + S * 0.8)} L${nP(cx, cy)}" stroke="${NRV_PAL.cell}" stroke-width="${n2(w * 0.8)}"/>`;
    o.nuc = nucleus(cx, by, S * 0.32);
    const dx = cx - S * 3.4, ax = axonSeg(cx, cx + S + L * 0.8, cy, w * 0.7, true, segW), dd = axonSeg(dx, cx, cy, w * 0.7, true, segW);
    o.dendr = dd.s + twigs(dx, cy, Math.PI, S * 0.8, w * 0.6);
    o.axon = ax.s + twigs(cx + S + L * 0.8, cy, 0, S * 0.7, w * 0.6); o.myelin = ax.m + dd.m;
    o.anchors.soma = [cx - S * 0.55, by]; o.anchors.dendr = [dx - S * 0.3, cy]; o.anchors.axon = [cx + S + L * 0.8 - 6, cy]; o.anchors.myelin = [cx + 8 + segW * 1.5 + 6, cy - w]; o.anchors.nuc = [cx, by];
    o.path = [[dx - S * 0.6, cy], [cx, cy], [cx, by], [cx, cy], [cx + S + L * 0.8, cy]];
  } else {
    o.soma = `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(S * 0.95)}" ry="${n2(S * 0.85)}" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="2"/>`;
    o.nuc = nucleus(cx, cy, S * 0.34);
    const ax = axonSeg(cx + S * 0.9, cx + S + L * 0.7, cy, w * 0.7, false, segW);
    o.axon = ax.s + twigs(cx + S + L * 0.7, cy, 0, S * 0.8, w * 0.6);
    o.anchors.soma = [cx - S * 0.5, cy + S * 0.5]; o.anchors.axon = [cx + S + L * 0.5, cy]; o.anchors.nuc = [cx, cy];
    o.path = [[cx, cy], [cx + S + L * 0.7, cy]];
  }
  return o;
}
/* إشارة تسري على المسار */
const impG = id => `<g id="${id}" opacity="0"><circle r="14" fill="${NRV_PAL.imp}" opacity=".35"/><circle r="6" fill="#e8ffff"/></g>`;
const nrvTools = () => [{ id: 'tbl:neuronParts', label: 'أجزاء العصبونة (ص81)' }, { id: 'tbl:dendAxon', label: 'التشجرات × المحور (ص82)' }];

/* ───────── 1) العصبونة: أجزاؤها ومسار الحوافز (المراحل) ───────── */
function nrvNeuron(){
  const N = neuronSVG('multi', 350, 300, 1, 1);
  const body = `
    ${part('dendr', N.dendr)}
    ${part('axon', N.axon)}
    ${part('myelin', N.myelin)}
    ${part('soma', N.soma)}
    ${part('nissl', N.nissl)}
    ${part('nNuc', N.nuc)}
    ${impG('imp')}
    <text class="cap" x="500" y="520" text-anchor="middle">العصبونة: جسم الخلية، والتشجرات، والمحور</text>
    <text class="cap sm" x="500" y="546" text-anchor="middle">التشجرات توصل الحوافز إلى جسم الخلية، والمحور ينقلها بعيداً عنه (وقد يكون محاطاً بغلاف نخاعيني)</text>`;
  const ctl = stageCtl(NRV_STAGES, { label: 'الجزء', dur: 3 * 6 });
  let litSt = -1;
  return {
    body, stages: NRV_STAGES, fnParts: ['dendr', 'soma', 'axon'],
    parts: [
      { id: 'dendr', anchor: N.anchors.dendr, label: [134, 180], side: 'L' },
      { id: 'soma', anchor: N.anchors.soma, label: [134, 400], side: 'L' },
      { id: 'nNuc', anchor: N.anchors.nuc, label: [134, 470], side: 'L' },
      { id: 'nissl', anchor: N.anchors.nissl, label: [866, 420], side: 'R' },
      { id: 'myelin', anchor: N.anchors.myelin, label: [866, 160], side: 'R' },
      { id: 'axon', anchor: N.anchors.axon, label: [866, 260], side: 'R' }
    ],
    tools: ctl.tools.concat(nrvTools(), [{ id: 'info:tNerve', label: 'عن النسيج العصبي' }]),
    init(){ litSt = -1; ctl.start(); },
    onSlider: v => ctl.onSlider(v),
    onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const st = STG.idx, k = STG.k, P = N.path;
      const p = st === 0 ? polyAt(P.slice(0, 3), k) : st === 1 ? polyAt(P.slice(2, 4), k) : polyAt(P.slice(3), k);
      const g = a.el('#imp'); if (g){ g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])}) scale(${n2(1 + 0.2 * Math.sin(t * 12))})`); g.setAttribute('opacity', '1'); }
      if (st !== litSt){ litSt = st; const lit = [['dendr'], ['soma', 'nNuc', 'nissl'], ['axon', 'myelin']][st];
        a.all('.part').forEach(e => e.style.filter = lit.indexOf(e.dataset.part) >= 0 ? 'drop-shadow(0 0 6px #7ff0ff)' : ''); }
    }
  };
}

/* ───────── رسم خلية واحدة من رسم الملزمة ص84 (للامتحان والرسم اليدوي) ───────── */
function nrvOne(type){
  const N = neuronSVG(type, type === 'pseudo' ? 470 : 400, 330, 1.05, 3);
  const name = type === 'bi' ? 'خلية عصبية ثنائية القطب: جسم مغزلي ذو بروزين' : 'خلية عصبية أحادية القطب كاذبة: لها قطب واحد يتفرع قرب جسم الخلية إلى محور وتشجرات';
  const body = `${part('dendr', N.dendr)}${part('axon', N.axon)}${N.myelin ? part('myelin', N.myelin) : ''}${part('soma', N.soma)}<g>${N.nuc}</g>${impG('imp1')}
    <text class="cap" x="500" y="540" text-anchor="middle">${name}</text>`;
  const parts = [
    { id: 'dendr', anchor: N.anchors.dendr, label: [134, 250], side: 'L' },
    { id: 'soma', anchor: N.anchors.soma, label: [134, 150], side: 'L' },
    { id: 'axon', anchor: N.anchors.axon, label: [866, 250], side: 'R' }
  ];
  if (N.myelin) parts.push({ id: 'myelin', anchor: N.anchors.myelin, label: [866, 150], side: 'R' });
  return {
    body, fnParts: ['dendr', 'axon'], parts, tools: nrvTools(),
    tick(dt, t, a){ const p = polyAt(N.path, (t * 0.25) % 1), g = a.el('#imp1'); if (g){ g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])})`); g.setAttribute('opacity', '1'); } }
  };
}

/* ───────── 2) أنواع الخلايا العصبية تبعاً لعدد البروزات (ص83–84) ───────── */
function nrvTypes(){
  const T = [['multi', 'nMulti', 330, 170, 'متعددة الأقطاب', 'جسم نجمي الشكل متعدد البروزات'], ['bi', 'nBi', 640, 170, 'ثنائية القطب', 'جسم مغزلي ذو بروزين'],
    ['pseudo', 'nPseudo', 330, 420, 'أحادية القطب كاذبة', 'قطب واحد يتفرع قرب الجسم إلى محور وتشجرات'], ['uni', 'nUni', 640, 420, 'أحادية القطب', 'جسم كروي أو بيضوي ذو بروز واحد']];
  const N = T.map(([ty, , x, y], i) => neuronSVG(ty, x - (ty === 'multi' ? 40 : ty === 'pseudo' ? 0 : -20), y, 0.48, 10 + i));
  const body = T.map(([, id, x, y, a, b], i) => part(id, N[i].dendr + N[i].axon + N[i].myelin + N[i].soma + N[i].nuc) +
      `<text class="cap" x="${x + 40}" y="${y + 74}" text-anchor="middle">${a}</text><text class="cap sm" x="${x + 40}" y="${y + 96}" text-anchor="middle">${b}</text>`).join('') +
    T.map((_, i) => impG('imt' + i)).join('');
  return {
    body, fnParts: ['nMulti', 'nBi', 'nPseudo', 'nUni'],
    parts: [
      { id: 'nMulti', anchor: N[0].anchors.soma, label: [134, 140], side: 'L' },
      { id: 'nPseudo', anchor: N[2].anchors.dendr, label: [134, 390], side: 'L' },
      { id: 'nBi', anchor: N[1].anchors.axon, label: [866, 140], side: 'R' },
      { id: 'nUni', anchor: N[3].anchors.axon, label: [866, 390], side: 'R' }
    ],
    tools: nrvTools(),
    tick(dt, t, a){ N.forEach((n, i) => { const p = polyAt(n.path, (t * 0.22 + i * 0.25) % 1), g = a.el('#imt' + i); if (g){ g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])}) scale(.7)`); g.setAttribute('opacity', '1'); } }); }
  };
}

/* ───────── 3) الخلايا الدبقية: الدعم والإسناد وابتلاع البكتريا والفتات الخلوي ───────── */
function nrvGlia(){
  const rr = rng(31), Ns = [[260, 230, 0.55, 7], [600, 360, 0.5, 8]].map(([x, y, k, s]) => neuronSVG('multi', x, y, k, s));
  const glia = [], G = [];
  for (let i = 0; i < 120 && G.length < 34; i++){ const x = 120 + rr() * 760, y = 100 + rr() * 400;
    if (Ns.some(n => n.path.some(p => Math.hypot(x - p[0], y - p[1]) < 46)) || G.some(g => Math.hypot(x - g[0], y - g[1]) < 40)) continue;
    G.push([x, y]); const r = 9 + rr() * 5;
    glia.push(`<path d="${blobD(x, y, 18, (a, j) => j % 3 === 0 ? r * 1.9 : r)}" fill="${NRV_PAL.glia}" stroke="#e6ffd8" stroke-width="1.1"/><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r * 0.45)}" fill="#3a5a8a"/>`); }
  const deb = Array.from({ length: 6 }, (_, i) => `<g class="db" data-i="${i}"><rect x="-6" y="-3" width="12" height="6" rx="3" fill="#c87a3a"/><circle cx="8" cy="5" r="3" fill="#8a6a4a"/></g>`).join('');
  const body = `
    ${part('tNerve', `<rect x="90" y="76" width="820" height="448" rx="26" fill="#2a2440" opacity=".55"/>`)}
    ${part('glia', glia.join(''))}
    ${part('neuron', Ns.map(n => n.dendr + n.axon + n.myelin + n.soma + n.nuc).join(''))}
    ${part('debris', deb)}
    ${conCap('الخلايا الدبقية (الدبق العصبي): القسم الأعظم من النسيج العصبي — خلية عصبية واحدة لكل 50 خلية دبقية، وتشغل أكثر من نصف حجم الدماغ', 'تقوم بالدعم والإسناد ومرافقة الخلايا العصبية وتبتلع البكتريا والفتات الخلوي، ولا تقوم بوظيفة عصبية', 560)}`;
  const tgt = G.slice(0, 6);
  return {
    body, fnParts: ['glia'],
    parts: [
      { id: 'neuron', anchor: Ns[1].anchors.soma, label: [866, 400], side: 'R' },
      { id: 'glia', anchor: [G[0][0] - 10, G[0][1]], label: [134, 200], side: 'L' },
      { id: 'debris', anchor: [tgt[1][0] + 40, tgt[1][1] - 30], label: [866, 160], side: 'R' },
      { id: 'tNerve', anchor: [104, 500], label: [134, 470], side: 'L' }
    ],
    tools: [{ id: 'info:tNerve', label: 'عن النسيج العصبي' }].concat(nrvTools()),
    tick(dt, t, a){
      /* البكتريا والفتات الخلوي تقترب من الخلية الدبقية فتبتلعها */
      a.all('.db').forEach(e => { const i = +e.dataset.i, g = tgt[i], p = (t * 0.18 + i / 6) % 1, d = 60 * (1 - p);
        e.setAttribute('transform', `translate(${n2(g[0] + 40 * (1 - p) + 0 * d)},${n2(g[1] - 30 * (1 - p))}) scale(${n2(p < 0.85 ? 1 : (1 - p) / 0.15)})`); });
    }
  };
}
