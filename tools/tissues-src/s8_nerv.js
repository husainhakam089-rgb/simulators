
/* ══════════════════════════════════════════════════════════════════════════
   4.8 · النسيج العصبي: العصبون ومسار السيال العصبي بمراحله، المحور وغمد
         المايلين وعقد رانفير (السيال يقفز)، والنسيج العصبي بعصبوناته وخلاياه الساندة
   ══════════════════════════════════════════════════════════════════════════ */
const NRV_VIEWS = [
  { id: 'nneuron', label: 'العصبون' },
  { id: 'naxon',   label: 'المحور وغمد المايلين' },
  { id: 'ntissue', label: 'النسيج العصبي' }
];
const NRV_STAGES = [
  { n: 'استقبال السيال', d: 'تستقبل الزوائد الشجيرية السيال العصبي وتنقله نحو جسم الخلية.',
    cam: { yaw: 0.35, pitch: 0.25, dist: 6.2, target: [-2.3, 0.3, 0] } },
  { n: 'جسم الخلية', d: 'يصل السيال إلى جسم الخلية (مركز فعاليات العصبون وفيه النواة)، ومنه إلى بداية المحور.',
    cam: { yaw: 0.2, pitch: 0.2, dist: 5.4, target: [-1.6, 0, 0] } },
  { n: 'الانتقال على المحور', d: 'ينتقل السيال على المحور بعيداً عن جسم الخلية، ويقفز من عقدة رانفير إلى أخرى فيكون سريعاً.',
    cam: { yaw: 0.1, pitch: 0.3, dist: 8.2, target: [0.6, 0, 0] } },
  { n: 'النهايات العصبية', d: 'يصل السيال إلى النهايات العصبية فتنقله إلى خلية أخرى (عصبون أو عضلة أو غدة).',
    cam: { yaw: -0.25, pitch: 0.25, dist: 5.8, target: [3.0, 0, 0] } }
];
const NRV_PAL = { cell: '#e3b86a', cellL: '#fff0c8', my: '#eef2f7', myL: '#9fb3c8', imp: '#7ff0ff', glia: '#9bc88a' };

SCENES.nerv = {
  title: 'النسيج العصبي',
  get src(){ return SRC_WAIT; },
  tint: ['rgba(120,110,170,.26)', 'rgba(80,140,170,.16)'],
  model3d: () => 'nrv_' + SEL.nrv,
  build(){
    const v = SEL.nrv || 'nneuron';
    const s = v === 'naxon' ? nrvAxon() : v === 'ntissue' ? nrvTissue() : nrvNeuron();
    s.rebuildOnRadio = 'nrv';
    s.tools = NRV_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'nrv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.nrv_neuron = { title: 'العصبون (الخلية العصبية)', build: () => nrvNeuron() };
SCENES.nrv_axon   = { title: 'المحور وغمد المايلين', build: () => nrvAxon() };
SCENES.nrv_tissue = { title: 'النسيج العصبي', build: () => nrvTissue() };

/* نقطة على مسار متعدد الأجزاء عند نسبة u */
function polyAt(P, u){
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++){ const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
  let s = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < L.length; i++){ if (s <= L[i]){ const k = L[i] ? s / L[i] : 0; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; } s -= L[i]; }
  return P[P.length - 1];
}

/* ───────── 1) العصبون ومسار السيال (المراحل) ───────── */
function nrvNeuron(){
  const SX = 260, SY = 300, AX0 = 318, AX1 = 760, NODES = [];
  const soma = blobPath(SX, SY, 58, 52, 0.12, 21, 18);
  /* الزوائد الشجيرية: أفرع رئيسية وفرعية */
  const D = [[-1.0, -0.6], [-1.0, 0.1], [-0.8, 0.8], [-0.2, -1.0], [-0.1, 1.0]], dpaths = [];
  let tip = null;
  D.forEach(([dx, dy], i) => {
    const a = [SX + dx * 50, SY + dy * 45], b = [SX + dx * 120, SY + dy * 120], c1 = [b[0] + dx * 40 - dy * 30, b[1] + dy * 40 + dx * 30], c2 = [b[0] + dx * 40 + dy * 30, b[1] + dy * 40 - dx * 30];
    dpaths.push(`<path d="M${n2(a[0])},${n2(a[1])} Q${n2((a[0] + b[0]) / 2 + 10)},${n2((a[1] + b[1]) / 2)} ${n2(b[0])},${n2(b[1])} M${n2(b[0])},${n2(b[1])} L${n2(c1[0])},${n2(c1[1])} M${n2(b[0])},${n2(b[1])} L${n2(c2[0])},${n2(c2[1])}" fill="none" stroke="${NRV_PAL.cell}" stroke-width="${i === 1 ? 9 : 7}" stroke-linecap="round"/>`);
    if (i === 1) tip = [c1, b, a];
  });
  /* المحور وغمد المايلين وعقد رانفير */
  const segW = 58, gap = 14, myel = [], nodes = [];
  for (let x = AX0 + 22; x + segW < AX1 - 10; x += segW + gap){
    myel.push(`<rect x="${x}" y="${SY - 20}" width="${segW}" height="40" rx="18" fill="${NRV_PAL.my}" stroke="${NRV_PAL.myL}" stroke-width="1.6"/>`);
    NODES.push(x + segW + gap / 2);
    nodes.push(`<rect x="${x + segW + 1}" y="${SY - 9}" width="${gap - 2}" height="18" fill="#ffe08a" opacity=".55"/>`);
  }
  NODES.pop(); nodes.pop();
  const ends = [[820, 240], [835, 285], [835, 325], [815, 370]];
  const term = ends.map(([x, y]) => `<path d="M${AX1},${SY} Q${AX1 + 30},${(SY + y) / 2} ${x},${y}" fill="none" stroke="${NRV_PAL.cell}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="9" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="1.4"/>`).join('');
  const path = [tip[0], tip[1], tip[2], [SX, SY], [AX0, SY], [AX1, SY], [AX1 + 30, (SY + 285) / 2], [835, 285]];
  const body = `
    ${part('dendr', dpaths.join(''))}
    ${part('soma', `<path d="${soma.d}" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="2"/>`)}
    ${part('nNuc', `<circle cx="${SX}" cy="${SY}" r="20" fill="url(#gNucl)"/><circle cx="${SX + 5}" cy="${SY - 4}" r="6" fill="url(#gNucleolus)"/>`)}
    ${part('axon', `<path d="M${AX0 - 4},${SY} L${AX1},${SY}" stroke="${NRV_PAL.cell}" stroke-width="10" stroke-linecap="round"/>`)}
    ${part('myelin', myel.join(''))}
    ${part('ranvier', nodes.join(''))}
    ${part('axTerm', term)}
    <g id="imp" opacity="0"><circle r="16" fill="${NRV_PAL.imp}" opacity=".35"/><circle r="7" fill="#e8ffff"/></g>
    <text class="cap sm" x="500" y="520" text-anchor="middle">العصبون: يسير السيال العصبي من الزوائد الشجيرية ← جسم الخلية ← المحور ← النهايات العصبية</text>`;
  const ctl = stageCtl(NRV_STAGES, { label: 'المرحلة', dur: 4 * 6 });
  let litSt = -1;
  const hopAt = k => { /* على المحور: يقفز من عقدة إلى أخرى */
    const pts = [AX0].concat(NODES, [AX1]), n = pts.length - 1, f = k * n, i = Math.min(n - 1, Math.floor(f)), r = f - i;
    const e = r < 0.75 ? 0 : (r - 0.75) / 0.25; return [pts[i] + (pts[i + 1] - pts[i]) * e, SY]; };
  return {
    body, stages: NRV_STAGES, fnParts: ['dendr', 'soma', 'axon', 'myelin', 'ranvier', 'axTerm'],
    parts: [
      { id: 'dendr', anchor: tip[1], label: [134, 400], side: 'L' },
      { id: 'soma', anchor: [SX - 30, SY + 40], label: [134, 470], side: 'L' },
      { id: 'nNuc', anchor: [SX - 10, SY + 10], label: [134, 540], side: 'L' },
      { id: 'myelin', anchor: [AX0 + 22 + segW / 2 + (segW + gap) * 2, SY - 20], label: [866, 120], side: 'R' },
      { id: 'ranvier', anchor: [NODES[3], SY - 9], label: [866, 200], side: 'R' },
      { id: 'axon', anchor: [AX0 + 8, SY + 4], label: [866, 470], side: 'R' },
      { id: 'axTerm', anchor: [835, 325], label: [866, 400], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:neuronParts', label: 'أجزاء العصبون' }, { id: 'tbl:dendAxon', label: 'الزوائد × المحور' }]),
    init(){ litSt = -1; ctl.start(); },
    onSlider: v => ctl.onSlider(v),
    onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const st = STG.idx, k = STG.k;
      const p = st === 0 ? polyAt(path.slice(0, 4), k) : st === 1 ? polyAt([[SX, SY], [AX0, SY]], k) : st === 2 ? hopAt(k) : polyAt(path.slice(5), k);
      const g = a.el('#imp'); if (g){ g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])}) scale(${n2(1 + 0.2 * Math.sin(t * 12))})`); g.setAttribute('opacity', '1'); }
      if (st !== litSt){ litSt = st; const lit = ['dendr', 'soma', 'axon', 'axTerm'][st];
        a.all('.part').forEach(e => e.style.filter = e.dataset.part === lit || (st === 2 && e.dataset.part === 'ranvier') ? 'drop-shadow(0 0 6px #7ff0ff)' : ''); }
    }
  };
}

/* ───────── 2) المحور وغمد المايلين: السيال يقفز من عقدة إلى أخرى ───────── */
function nrvAxon(){
  const Y = 300, X0 = 120, X1 = 880, segW = 150, gap = 34, my = [], nodes = [], NODES = [];
  for (let x = X0 + 10; x + segW <= X1 - 10; x += segW + gap){
    let wraps = ''; for (let k = 1; k < 6; k++) wraps += `<path d="M${x + 12 + k * 22},${Y - 62} q-14,62 0,124" fill="none" stroke="${NRV_PAL.myL}" stroke-width="1.6" opacity=".7"/>`;
    my.push(`<rect x="${x}" y="${Y - 64}" width="${segW}" height="128" rx="56" fill="${NRV_PAL.my}" stroke="${NRV_PAL.myL}" stroke-width="2"/>${wraps}`);
    if (x + segW + gap <= X1){ NODES.push(x + segW + gap / 2); nodes.push(`<rect x="${x + segW + 2}" y="${Y - 26}" width="${gap - 4}" height="52" rx="6" fill="#ffe08a" opacity=".45"/>`); }
  }
  const body = `
    ${part('axon', `<rect x="${X0 - 20}" y="${Y - 22}" width="${X1 - X0 + 40}" height="44" rx="22" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="2"/>`)}
    ${part('myelin', my.join(''))}
    ${part('ranvier', nodes.join(''))}
    <g id="impA"><circle r="26" fill="${NRV_PAL.imp}" opacity=".3"/><circle r="11" fill="#e8ffff"/></g>
    <path d="M${X0},${Y + 120} L${X1},${Y + 120} M${X1 - 14},${Y + 110} L${X1},${Y + 120} L${X1 - 14},${Y + 130}" fill="none" stroke="${NRV_PAL.imp}" stroke-width="2.6" opacity=".7"/>
    <text class="cap sm" x="500" y="${Y + 160}" text-anchor="middle">السيال العصبي يقفز من عقدة رانفير إلى أخرى، فينتقل بسرعة على المحور المغلف بالمايلين</text>`;
  return {
    body, fnParts: ['myelin', 'ranvier'],
    parts: [
      { id: 'myelin', anchor: [X0 + 10 + segW / 2, Y - 64], label: [134, 150], side: 'L' },
      { id: 'axon', anchor: [X0 - 10, Y + 10], label: [134, 400], side: 'L' },
      { id: 'ranvier', anchor: [NODES[1], Y - 26], label: [866, 150], side: 'R' }
    ],
    tools: [{ id: 'tbl:neuronParts', label: 'أجزاء العصبون' }],
    tick(dt, t, a){
      const pts = [X0].concat(NODES, [X1]), n = pts.length - 1, f = ((t * 0.5 * (focusOwner ? 0.6 : 1)) % 1) * n, i = Math.min(n - 1, Math.floor(f)), r = f - i, e = r < 0.7 ? 0 : (r - 0.7) / 0.3;
      const g = a.el('#impA'); if (g) g.setAttribute('transform', `translate(${n2(pts[i] + (pts[i + 1] - pts[i]) * e)},${Y}) scale(${n2(1 + 0.25 * Math.sin(t * 14))})`);
    }
  };
}

/* ───────── 3) النسيج العصبي: عصبونات متصلة وخلايا ساندة ───────── */
function nrvTissue(){
  const rr = rng(31);
  /* سلسلة عصبونات: نهايات كل واحد قرب زوائد التالي */
  const N = [[200, 200, 0.35], [430, 360, -0.3], [650, 210, 0.4], [830, 410, 0]], neur = [], paths = [];
  N.forEach(([x, y, ang], i) => {
    const soma = blobPath(x, y, 34, 30, 0.14, 40 + i, 14);
    let den = ''; for (let k = 0; k < 5; k++){ const a = Math.PI + (k - 2) * 0.55 + ang, L = 55 + rr() * 25; den += `<path d="M${n2(x + Math.cos(a) * 28)},${n2(y + Math.sin(a) * 26)} L${n2(x + Math.cos(a) * L)},${n2(y + Math.sin(a) * L)} l${n2(Math.cos(a + 0.5) * 22)},${n2(Math.sin(a + 0.5) * 22)}" fill="none" stroke="${NRV_PAL.cell}" stroke-width="5" stroke-linecap="round"/>`; }
    let ax = '';
    if (i < N.length - 1){ const [nx, ny] = N[i + 1], ex = nx - 70, ey = ny + (y < ny ? -20 : 20);
      ax = `<path d="M${x + 30},${y} Q${(x + ex) / 2},${(y + ey) / 2 + (i % 2 ? 40 : -40)} ${ex},${ey}" fill="none" stroke="${NRV_PAL.cell}" stroke-width="5"/>` + [-12, 0, 12].map(o => `<circle cx="${ex + 6}" cy="${ey + o}" r="6" fill="${NRV_PAL.cell}"/>`).join('');
      paths.push([[x + 30, y], [(x + ex) / 2, (y + ey) / 2 + (i % 2 ? 30 : -30)], [ex, ey], [nx - 28, ny]]); }
    neur.push(den + ax + `<path d="${soma.d}" fill="${NRV_PAL.cell}" stroke="${NRV_PAL.cellL}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="12" fill="url(#gNucl)"/>`);
  });
  const glia = []; for (let i = 0; i < 22; i++){ const x = 120 + rr() * 760, y = 110 + rr() * 380; if (N.some(([nx, ny]) => Math.hypot(x - nx, y - ny) < 80)) continue;
    glia.push(`<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(9 + rr() * 6)}" fill="${NRV_PAL.glia}" stroke="#e6ffd8" stroke-width="1.2"/><circle cx="${n2(x)}" cy="${n2(y)}" r="4" fill="#5a4ea0"/>`); }
  const body = `
    ${part('tNerve', `<rect x="90" y="80" width="820" height="440" rx="26" fill="#2a2440" opacity=".55"/>`)}
    ${part('glia', glia.join(''))}
    ${part('neuron', neur.join(''))}
    <g id="impT"><circle r="12" fill="${NRV_PAL.imp}" opacity=".35"/><circle r="5" fill="#e8ffff"/></g>
    <text class="cap sm" x="500" y="560" text-anchor="middle">النسيج العصبي: عصبونات ينتقل السيال من نهايات كل منها إلى زوائد العصبون التالي، وبينها خلايا ساندة</text>`;
  return {
    body, fnParts: ['neuron'],
    parts: [
      { id: 'neuron', anchor: [650 + 20, 210 - 20], label: [866, 140], side: 'R' },
      { id: 'glia', anchor: [0, 0], label: [134, 300], side: 'L' },
      { id: 'tNerve', anchor: [110, 500], label: [134, 480], side: 'L' }
    ].map(p => { if (p.id === 'glia'){ const m = /cx="([\d.]+)" cy="([\d.]+)"/.exec(glia[0] || ''); p.anchor = m ? [+m[1], +m[2]] : [150, 150]; } return p; }),
    tools: [{ id: 'tbl:neuronParts', label: 'أجزاء العصبون' }],
    tick(dt, t, a){
      const n = paths.length, f = (t * 0.25) % 1 * n, i = Math.floor(f), p = polyAt(paths[i], f - i);
      const g = a.el('#impT'); if (g) g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])})`);
    }
  };
}
