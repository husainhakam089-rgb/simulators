/* ══════════════════════════════════════════════════════════════════════════
   4.2 · الفايروسات والبدائيات — ملزمة ص15–25: دورتا تكاثر راشح البلعم
         البكتيري (ص17)، الانشطار الثنائي في البكتيريا (ص19)، والاقتران
         وإعادة الخلط (ص20–21، شكل 3-5)
   ══════════════════════════════════════════════════════════════════════════ */
const MIC = { bac: '#f3cfa2', bacS: '#9a6634', dna: '#d23a3a', phage: '#4fb05a', phageL: '#c9f5c4', vdna: '#ff6fb0',
  cell: '#ffe680', cellS: '#8fdc6a', chrom: '#2a2a2a', donor: '#e2403e', recip: '#3d7bf0', plas: '#d43fd0' };

/* بكتيريا عصوية (كبسولة) وفيها حلقة DNA */
const bactSvg = (cx, cy, w, h, ang, dnaExtra) => `<g transform="rotate(${ang || 0} ${n2(cx)} ${n2(cy)})">
  <rect x="${n2(cx - w / 2)}" y="${n2(cy - h / 2)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(h / 2)}" fill="${MIC.bac}" stroke="${MIC.bacS}" stroke-width="3"/>
  <ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(w * 0.24)}" ry="${n2(h * 0.24)}" fill="none" stroke="${MIC.dna}" stroke-width="3"/>${dnaExtra || ''}</g>`;
/* راشح البلعم: رأس سداسي (غطاء بروتيني + حامض نووي) وذنب وألياف */
const phageSvg = (x, y, s, ang, cls) => { const H = []; for (let i = 0; i < 6; i++){ const a = Math.PI / 6 + i * Math.PI / 3; H.push(n2(x + Math.cos(a) * 9 * s) + ',' + n2(y + Math.sin(a) * 9 * s)); }
  return `<g class="${cls || ''}" transform="rotate(${n2(ang || 0)} ${n2(x)} ${n2(y)})"><polygon points="${H.join(' ')}" fill="${MIC.phageL}" stroke="${MIC.phage}" stroke-width="${n2(2 * s)}"/>
    <path d="M${n2(x - 3 * s)},${n2(y - 2 * s)} q${n2(3 * s)},${n2(-4 * s)} ${n2(6 * s)},${n2(2 * s)}" fill="none" stroke="${MIC.vdna}" stroke-width="${n2(1.4 * s)}"/>
    <line x1="${n2(x)}" y1="${n2(y + 8 * s)}" x2="${n2(x)}" y2="${n2(y + 24 * s)}" stroke="${MIC.phage}" stroke-width="${n2(3 * s)}"/>
    <path d="M${n2(x)},${n2(y + 24 * s)} l${n2(-7 * s)},${n2(6 * s)} M${n2(x)},${n2(y + 24 * s)} l${n2(7 * s)},${n2(6 * s)}" stroke="${MIC.phage}" stroke-width="${n2(1.6 * s)}" fill="none"/></g>`; };

/* ═════════════ الفايروسات ═════════════
   ثلاثة عروض: دورة التحلل وحدها، ودورة التحلل والإنتاج وحدها — كل منهما مرسومة دورةً
   مغلقة باسمها ومراحلها حول حلقة، والمرحلة الحالية مكبّرة في وسط الدورة — ثم الدورتان معاً. */
const VIR_VIEWS = [
  { id: 'vLyt', label: 'دورة التحلل' },
  { id: 'vLys', label: 'دورة التحلل والإنتاج' },
  { id: 'vBoth', label: 'الدورتان معاً' }
];
SCENES.virus = {
  title: 'التكاثر في الفايروسات (الرواشح)',
  src: 'ملزمة ص15–18',
  tint: ['rgba(80,160,100,.24)', 'rgba(200,140,80,.16)'],
  model3d: () => ({ vLyt: 'vir_lyt', vLys: 'vir_lys' })[SEL.virv] || 'vir_cycle',
  build(){
    const v = VIR_VIEWS.some(x => x.id === SEL.virv) ? SEL.virv : 'vLyt';
    const s = v === 'vBoth' ? virCycle() : virRing(v === 'vLys');
    s.rebuildOnRadio = 'virv';
    s.tools = VIR_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'virv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.vir_cycle = { title: 'تكاثر راشح البلعم البكتيري (دورة التحلل ودورة التحلل والإنتاج)', build: () => virCycle(true) };

const VIR_STAGES = [
  { n: '1 · مرحلة الاتصال', d: 'يقترب الفيروس من الخلية البكتيرية وعندما يصبح بتماس معها تلتصق ألياف ذنب الفيروس بمواقع خاصة على جدار الخلية المضيفة (البكتريا).' },
  { n: '2 · مرحلة الاختراق', d: 'يفرز ذنب الفيروس إنزيماً له القدرة على إضعاف الروابط الكيميائية في جدار البكتريا عند منطقة الالتصاق فيتكون ثقب يدخل من خلاله DNA الفيروس إلى داخل المضيف.' },
  { n: '3 · مرحلة التخليق أو البناء', d: 'يبدأ DNA الفيروس باستنساخ mRNA الفيروس اللازم لبناء إنزيمات تحليل DNA وmRNA البكتريا، فتصبح الآلية البكتيرية لتكوين البروتين وإنتاج الطاقة تحت سيطرة DNA الفيروس لتكوين حامض نووي وبروتينات جديدة للفيروس.' },
  { n: '4 · مرحلة الإنضاج', d: 'تنتظم جزيئات البروتين لتكوّن أغطية بروتينية حول جزيئات الحامض النووي للفيروس، ويتكون (100–200) فيروس جديد.' },
  { n: '5 · مرحلة التحرر', d: 'تقود الفيروسات المتكونة إلى تحلل الخلية البكتيرية المضيفة وتتحرر لتصيب بكتريا أخرى، وتستغرق العملية كاملة 25 دقيقة.' },
  { n: '6 · مرحلة التكامل (دورة التحلل والإنتاج)', d: 'يندمج DNA الفيروس مع DNA البكتيريا بدون تحطيم DNA البكتيريا ويسمى عندها البلعم الأولي، ويتضاعف DNA الفيروس مع تكاثر البكتيريا (خليتان بنويتان).' }
];
const LYT_STAGES = VIR_STAGES.slice(0, 5).map((s, i) => i === 4 ? { n: s.n, d: s.d + ' ثم تبدأ الدورة من جديد مع كل بكتريا تصيبها الفيروسات الجديدة.' } : s);
const LYS_STAGES = [
  VIR_STAGES[0], VIR_STAGES[1],
  { n: '3 · مرحلة التكامل', d: 'يندمج DNA الفيروس مع DNA البكتيريا بدون أن يحصل تحطيم لـDNA البكتيريا، ويسمى DNA الفيروس عندها بالبلعم الأولي.' },
  { n: '4 · تكاثر البكتيريا ومعها البلعم الأولي', d: 'يتضاعف DNA الفيروس (البلعم الأولي) مع تكاثر البكتيريا، فتحتوي كل من الخليتين البنويتين عليه، ويتكرر ذلك مع كل انقسام.' }
];

/* رسوم المراحل: كل دالة ترسم مرحلة حول (x,y) بمقياس k؛ big = نسخة الوسط بلا أجزاء قابلة للضغط */
const vLobe = (x, y, k) => `<path d="M${n2(x + 16 * k)},${n2(y - 4 * k)} q${n2(14 * k)},${n2(-12 * k)} ${n2(22 * k)},0 q${n2(-8 * k)},${n2(14 * k)} ${n2(-22 * k)},${n2(4 * k)}" fill="none" stroke="${MIC.vdna}" stroke-width="${n2(3.2 * k)}"/>`;
const VDRAW = {
  attach: (x, y, k) => bactSvg(x - 10 * k, y + 8 * k, 124 * k, 44 * k) + `<g class="vApp">${phageSvg(x + 40 * k, y - 34 * k, 1.45 * k, -35)}</g>`,
  pen: (x, y, k) => bactSvg(x - 10 * k, y + 8 * k, 124 * k, 44 * k) + phageSvg(x + 40 * k, y - 34 * k, 1.1 * k, -35) +
    `<path class="vInj" d="M${n2(x + 30 * k)},${n2(y - 12 * k)} q${n2(-10 * k)},${n2(8 * k)} ${n2(-20 * k)},${n2(2 * k)} q${n2(-10 * k)},${n2(-6 * k)} ${n2(-18 * k)},${n2(6 * k)}" fill="none" stroke="${MIC.vdna}" stroke-width="${n2(2.8 * k)}" stroke-dasharray="${n2(60 * k)}"/>`,
  synth: (x, y, k) => { let b = `<rect x="${n2(x - 70 * k)}" y="${n2(y - 25 * k)}" width="${n2(140 * k)}" height="${n2(50 * k)}" rx="${n2(25 * k)}" fill="${MIC.bac}" stroke="${MIC.bacS}" stroke-width="3"/>`;
    [[-30, -6], [-8, 10], [18, -8], [36, 8]].forEach(([dx, dy]) => { b += `<path d="M${n2(x + dx * k)},${n2(y + dy * k)} q${n2(5 * k)},${n2(-5 * k)} ${n2(10 * k)},0" fill="none" stroke="${MIC.dna}" stroke-width="${n2(2.4 * k)}" opacity=".7"/>`; });
    const r = rng(7); for (let i = 0; i < 8; i++){ const px = x + (-50 + r() * 100) * k, py = y + (-14 + r() * 28) * k;
      b += i % 2 ? `<g class="vbit" data-i="${i}"><polygon points="${[0, 1, 2, 3, 4, 5].map(j => n2(px + Math.cos(j * 1.047) * 5 * k) + ',' + n2(py + Math.sin(j * 1.047) * 5 * k)).join(' ')}" fill="${MIC.phageL}" stroke="${MIC.phage}" stroke-width="1.4"/></g>`
        : `<g class="vbit" data-i="${i}"><path d="M${n2(px - 6 * k)},${n2(py)} q${n2(3 * k)},${n2(-5 * k)} ${n2(6 * k)},0 q${n2(3 * k)},${n2(5 * k)} ${n2(6 * k)},0" fill="none" stroke="${MIC.vdna}" stroke-width="2"/></g>`; }
    return b; },
  mature: (x, y, k) => `<rect x="${n2(x - 70 * k)}" y="${n2(y - 25 * k)}" width="${n2(140 * k)}" height="${n2(50 * k)}" rx="${n2(25 * k)}" fill="${MIC.bac}" stroke="${MIC.bacS}" stroke-width="3"/>` +
    [-44, -16, 12, 40].map((d, i) => phageSvg(x + d * k, y - 12 * k, 0.55 * k, i % 2 ? 20 : -20, 'vpulse')).join(''),
  release: (x, y, k) => `<path d="M${n2(x - 60 * k)},${n2(y - 22 * k)} L${n2(x + 50 * k)},${n2(y - 22 * k)} A${n2(22 * k)},${n2(22 * k)} 0 0 1 ${n2(x + 50 * k)},${n2(y + 22 * k)} L${n2(x - 60 * k)},${n2(y + 22 * k)} L${n2(x - 48 * k)},${n2(y + 10 * k)} L${n2(x - 62 * k)},${n2(y)} L${n2(x - 48 * k)},${n2(y - 10 * k)}Z" fill="${MIC.bac}" stroke="${MIC.bacS}" stroke-width="3"/>` +
    Array.from({ length: 6 }, (_, i) => `<g class="vesc" data-i="${i}" data-x="${n2(x - 64 * k)}" data-y="${n2(y)}" data-k="${k}">${phageSvg(0, 0, 0.55 * k, 0)}</g>`).join(''),
  integ: (x, y, k) => bactSvg(x - 10 * k, y, 132 * k, 46 * k) + `<g class="vGlow">${vLobe(x - 10 * k, y, k)}</g>`,
  divide: (x, y, k) => bactSvg(x - 44 * k, y - 12 * k, 104 * k, 38 * k, -10) + bactSvg(x + 50 * k, y + 14 * k, 104 * k, 38 * k, -10) +
    `<g transform="rotate(-10 ${n2(x - 44 * k)} ${n2(y - 12 * k)})" class="vGlow">${vLobe(x - 44 * k, y - 12 * k, 0.8 * k)}</g><g transform="rotate(-10 ${n2(x + 50 * k)} ${n2(y + 14 * k)})" class="vGlow">${vLobe(x + 50 * k, y + 14 * k, 0.8 * k)}</g>`
};
function virRing(lyso){
  const CX = 570, CY = 388, RX = 300, RY = 205, CW = 176, CH_ = 108;
  const nodes = lyso
    ? [{ a: -90, d: 'attach', id: 'vAttach', nm: 'مرحلة الاتصال' }, { a: -12, d: 'pen', id: 'vPen', nm: 'مرحلة الاختراق' },
       { a: 62, d: 'integ', id: 'vInteg', nm: 'مرحلة التكامل' }, { a: 150, d: 'divide', id: 'vDaugh', nm: 'تكاثر البكتيريا' }]
    : [{ a: -90, d: 'attach', id: 'vAttach', nm: 'مرحلة الاتصال' }, { a: -20, d: 'pen', id: 'vPen', nm: 'مرحلة الاختراق' }, { a: 50, d: 'synth', id: 'vSynth', nm: 'مرحلة التخليق أو البناء' },
       { a: 120, d: 'mature', id: 'vMature', nm: 'مرحلة الإنضاج' }, { a: 180, d: 'release', id: 'vRelease', nm: 'مرحلة التحرر' }];
  nodes.forEach(N => { N.x = CX + Math.cos(N.a * Math.PI / 180) * RX; N.y = CY + Math.sin(N.a * Math.PI / 180) * RY; });
  const STAGES = lyso ? LYS_STAGES : LYT_STAGES;
  /* أسهم الحلقة: قوس على محيط الدورة من بطاقة إلى التالية */
  const arcArrow = (a0, a1, col, w, cls) => { const P = []; for (let i = 0; i <= 24; i++){ const a = (a0 + (a1 - a0) * i / 24) * Math.PI / 180; P.push([CX + Math.cos(a) * (RX - 4), CY + Math.sin(a) * (RY - 4)]); }
    const e = P[P.length - 1], p = P[P.length - 3], an = Math.atan2(e[1] - p[1], e[0] - p[0]), h = 13;
    return `<g class="${cls || ''}"><path d="${P.map((q, i) => (i ? 'L' : 'M') + n2(q[0]) + ',' + n2(q[1])).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>
      <path d="M${n2(e[0])},${n2(e[1])} L${n2(e[0] - h * Math.cos(an - 0.45))},${n2(e[1] - h * Math.sin(an - 0.45))} L${n2(e[0] - h * Math.cos(an + 0.45))},${n2(e[1] - h * Math.sin(an + 0.45))}Z" fill="${col}"/></g>`; };
  const gapA = d => 180 * (CW * 0.62) / (Math.PI * RX) * (1 + 0.5 * Math.abs(Math.sin(d * Math.PI / 180)));
  let ring = '';
  const links = lyso ? [[0, 1], [1, 2], [2, 3]] : nodes.map((_, i) => [i, (i + 1) % nodes.length]);
  links.forEach(([i, j], li) => { let a0 = nodes[i].a, a1 = nodes[j].a; if (a1 < a0) a1 += 360;
    ring += `<g class="vArc" data-i="${li}">${arcArrow(a0 + gapA(a0), a1 - gapA(a1), '#e8e0d0', 4)}</g>`; });
  if (lyso){
    /* حلقة التضاعف: من «تكاثر البكتيريا» تعود الخلايا البنوية فتنقسم مجدداً ومعها البلعم الأولي */
    const N = nodes[3], lx = N.x, ly = N.y + CH_ / 2 + 6;
    ring += `<g class="vArc" data-i="3"><path d="M${n2(lx + 40)},${n2(ly)} C${n2(lx + 90)},${n2(ly + 70)} ${n2(lx - 90)},${n2(ly + 70)} ${n2(lx - 40)},${n2(ly + 4)}" fill="none" stroke="#e8e0d0" stroke-width="4"/>
      <path d="M${n2(lx - 40)},${n2(ly + 4)} l-2,15 l13,-8Z" fill="#e8e0d0"/></g>
      <text class="cap sm" x="${n2(lx)}" y="${n2(ly + 74)}" text-anchor="middle" fill="#ffd98a">يتكرر مع كل انقسام</text>`;
  } else {
    const N = nodes[4];
    ring += `<text class="cap sm" x="${n2(N.x)}" y="${n2(N.y + CH_ / 2 + 22)}" text-anchor="middle" fill="#ffd98a">تصيب بكتريا أخرى ↻</text>`;
  }
  const card = (N, i) => { const x = N.x - CW / 2, y = N.y - CH_ / 2;
    return `<g class="vCard" data-i="${i}">${part(N.id, `<rect x="${n2(x)}" y="${n2(y)}" width="${CW}" height="${CH_}" rx="8" fill="rgba(255,255,255,.95)" stroke="#5a4a3a" stroke-width="2"/>
      <rect x="${n2(x)}" y="${n2(y)}" width="${CW}" height="24" rx="8" fill="#f6dfc0" stroke="#5a4a3a" stroke-width="2"/>
      <text x="${n2(N.x)}" y="${n2(y + 17)}" text-anchor="middle" font-size="13" font-weight="700" fill="#2a1a10">${N.nm}</text>`)}
      <circle cx="${n2(x + CW - 2)}" cy="${n2(y + 2)}" r="13" fill="#ffd98a" stroke="#5a4a3a" stroke-width="2"/><text x="${n2(x + CW - 2)}" y="${n2(y + 8)}" text-anchor="middle" font-size="15" font-weight="800" fill="#2a1a10">${i + 1}</text>
      <g class="vMini">${VDRAW[N.d](N.x, N.y + 12, 0.78)}</g></g>`; };
  /* أجزاء الخلية والفيروس قابلة للضغط في بطاقة الاتصال */
  const N0 = nodes[0], k0 = 0.78, bx = N0.x - 10 * k0, by = N0.y + 12 + 8 * k0;
  const hit = part('vBac', `<rect x="${n2(bx - 40)}" y="${n2(by - 6)}" width="30" height="16" fill="rgba(0,0,0,0)"/>`) +
    part('vWall', `<rect x="${n2(bx + 40)}" y="${n2(by - 10)}" width="10" height="20" fill="rgba(0,0,0,0)"/>`) +
    part('vBDNA', `<ellipse cx="${n2(bx)}" cy="${n2(by)}" rx="${n2(30 * k0)}" ry="${n2(10 * k0)}" fill="rgba(0,0,0,0)"/>`) +
    part('vCoat', `<circle cx="${n2(N0.x + 40 * k0)}" cy="${n2(N0.y + 12 - 34 * k0)}" r="11" fill="rgba(0,0,0,0)"/>`) +
    part('vNA', `<circle cx="${n2(N0.x + 40 * k0 + 1)}" cy="${n2(N0.y + 12 - 35 * k0)}" r="3.5" fill="rgba(0,0,0,0)"/>`);
  const title = lyso ? 'دورة التحلل والإنتاج' : 'دورة التحلل';
  const body = `${ring}${nodes.map(card).join('')}${hit}
    ${part(lyso ? 'vLyso' : 'vLytic', `<text class="cap" x="${CX}" y="${CY - 92}" text-anchor="middle" font-size="26" fill="#ffd98a">${title}</text>`)}
    <text id="vNow" class="cap sm" x="${CX}" y="${CY - 62}" text-anchor="middle"></text>
    <g id="vBig"></g>
    <text class="cap sm" x="500" y="672" text-anchor="middle">${lyso ? 'دورة التحلل والإنتاج: يندمج DNA الفيروس مع DNA البكتيريا (البلعم الأولي) ولا تتحلل البكتيريا' : 'دورة التحلل: (100–200) فيروس جديد خلال 25 دقيقة وتتحلل الخلية البكتيرية'}</text>`;
  const ctl = stageCtl(STAGES, { dur: lyso ? 26 : 32 });
  const kx = N0.x + 40 * k0, ky = N0.y + 12 - 34 * k0;
  const parts = lyso ? [
    { id: 'vBac', anchor: [bx - 26, by + 2], label: [390, 128], side: 'C' },
    { id: 'vWall', anchor: [bx + 46, by], label: [380, 178], side: 'C' },
    { id: 'vNA', anchor: [kx, ky - 1], label: [770, 108], side: 'C' },
    { id: 'vCoat', anchor: [kx + 9.5, ky - 5.5], label: [780, 150], side: 'C' },
    { id: 'vDNA', anchor: [nodes[2].x - 4, nodes[2].y + 10], label: [866, 640], side: 'R' },
    { id: 'vProph', anchor: [nodes[3].x - 18, nodes[3].y - 2], label: [134, 640], side: 'L' }
  ] : [
    { id: 'vBac', anchor: [bx - 26, by + 2], label: [390, 128], side: 'C' },
    { id: 'vWall', anchor: [bx + 46, by], label: [380, 178], side: 'C' },
    { id: 'vBDNA', anchor: [bx - 14, by + 6], label: [400, 228], side: 'C' },
    { id: 'vNA', anchor: [kx, ky - 1], label: [770, 108], side: 'C' },
    { id: 'vCoat', anchor: [kx + 9.5, ky - 5.5], label: [700, 136], side: 'C' }
  ];
  let shown = -1;
  return {
    body, stages: STAGES, fnParts: nodes.map(N => N.id), parts,
    tools: ctl.tools.concat([{ id: 'info:' + (lyso ? 'vLyso' : 'vLytic'), label: 'عن ' + title }, { id: 'tbl:mLytLyso', label: 'التحلل × التحلل والإنتاج' }, { id: 'info:vVirus', label: 'عن الرواشح' }]),
    init(){ ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const s = STG.idx, k = STG.k;
      a.all('.vCard').forEach(g => { const on = +g.dataset.i === s, r = g.querySelector('rect'); r.setAttribute('stroke', on ? '#ffb000' : '#5a4a3a'); r.setAttribute('stroke-width', on ? 5 : 2);
        g.setAttribute('opacity', on || +g.dataset.i < s ? 1 : 0.6); });
      a.all('.vArc').forEach(g => { const i = +g.dataset.i, on = lyso ? (i === s - 1 || (i === 3 && s === 3)) : i === (s + nodes.length - 1) % nodes.length;
        g.querySelectorAll('path').forEach(p => { if (p.getAttribute('fill') === 'none') p.setAttribute('stroke', on ? '#ffb000' : '#e8e0d0'); else p.setAttribute('fill', on ? '#ffb000' : '#e8e0d0'); }); });
      if (s !== shown){ shown = s; const N = nodes[s], big = a.el('#vBig'), now = a.el('#vNow');
        if (big) big.innerHTML = VDRAW[N.d](CX + 10, CY + 22, 1.35); if (now) now.textContent = 'الآن: ' + N.nm; }
      /* حركة المراحل في النسخة الكبيرة */
      const big = a.el('#vBig');
      if (big){
        const ap = big.querySelector('.vApp'); if (ap){ const p = Math.min(1, k * 1.6); ap.setAttribute('transform', `translate(${n2((1 - p) * 60)},${n2(-(1 - p) * 46)})`); }
        const inj = big.querySelector('.vInj'); if (inj) inj.setAttribute('stroke-dashoffset', n2(93 - 93 * Math.min(1, k * 1.3)));
        big.querySelectorAll('.vbit').forEach(e => { const i = +e.dataset.i; e.setAttribute('transform', `translate(${n2(Math.sin(t * 2 + i) * 6)},${n2(Math.cos(t * 1.7 + i) * 4)})`); });
        big.querySelectorAll('.vpulse').forEach((e, i) => e.style.opacity = n2(0.6 + 0.4 * Math.sin(t * 3 + i)));
        big.querySelectorAll('.vesc').forEach(e => { const i = +e.dataset.i, p = (t * 0.35 + i / 6) % 1, an = 2.3 + i * 0.32, x = +e.dataset.x, y = +e.dataset.y, kk = +e.dataset.k;
          e.setAttribute('transform', `translate(${n2(x + Math.cos(an) * p * 55 * kk)},${n2(y + Math.sin(an) * p * 50 * kk)}) rotate(${n2(an * 57 + 90)})`); e.setAttribute('opacity', n2(1 - p * 0.6)); });
        big.querySelectorAll('.vGlow').forEach(e => e.style.filter = `drop-shadow(0 0 ${n2(3 + 4 * Math.sin(t * 4))}px #ff6fb0)`);
      }
      a.all('.vMini .vesc').forEach(e => { const i = +e.dataset.i, p = (t * 0.3 + i / 6) % 1, an = 2.3 + i * 0.32, x = +e.dataset.x, y = +e.dataset.y, kk = +e.dataset.k;
        e.setAttribute('transform', `translate(${n2(x + Math.cos(an) * p * 50 * kk)},${n2(y + Math.sin(an) * p * 34 * kk)}) rotate(${n2(an * 57 + 90)})`); e.setAttribute('opacity', n2(1 - p * 0.6)); });
      a.all('.vMini .vInj').forEach(e => e.setAttribute('stroke-dashoffset', 0));
    }
  };
}

function virCycle(still){
  const BW = 196, BH = 112;
  const B = { 1: [400, 52], 2: [500, 214], 3: [440, 382], 4: [196, 478], 5: [92, 304], 6: [740, 206] };
  const NM = { 1: 'مرحلة الاتصال', 2: 'مرحلة الاختراق', 3: 'مرحلة التخليق أو البناء الحيوي', 4: 'مرحلة الإنضاج', 5: 'مرحلة التحرر', 6: 'مرحلة التكامل' };
  const IDS = { 1: 'vAttach', 2: 'vPen', 3: 'vSynth', 4: 'vMature', 5: 'vRelease', 6: 'vInteg' };
  const ctr = k => [B[k][0] + BW / 2, B[k][1] + 24 + (BH - 24) / 2];
  const frame = k => `<g class="vbox" data-b="${k}"><rect x="${B[k][0]}" y="${B[k][1]}" width="${BW}" height="${BH}" rx="6" fill="rgba(255,255,255,.95)" stroke="#5a4a3a" stroke-width="2"/>
    <rect x="${B[k][0]}" y="${B[k][1]}" width="${BW}" height="24" rx="6" fill="#f6dfc0" stroke="#5a4a3a" stroke-width="2"/>
    <text x="${B[k][0] + BW / 2}" y="${B[k][1] + 17}" text-anchor="middle" font-size="13" font-weight="700" fill="#2a1a10">${NM[k]}</text>
    <text x="${B[k][0] + BW + 10}" y="${B[k][1] + 4}" font-size="18" font-weight="800" fill="#ffd98a">${k}</text></g>`;
  const [c1x, c1y] = ctr(1), [c2x, c2y] = ctr(2), [c3x, c3y] = ctr(3), [c4x, c4y] = ctr(4), [c5x, c5y] = ctr(5), [c6x, c6y] = ctr(6);
  /* 1) الاتصال: أجزاء الخلية والفيروس قابلة للضغط منفصلة */
  const box1 = part('vAttach', frame(1)) +
    part('vBac', `<rect x="${c1x - 62}" y="${c1y - 22}" width="124" height="44" rx="22" fill="${MIC.bac}"/>`) +
    part('vWall', `<rect x="${c1x - 62}" y="${c1y - 22}" width="124" height="44" rx="22" fill="none" stroke="${MIC.bacS}" stroke-width="3.2"/>`) +
    part('vBDNA', `<ellipse cx="${c1x - 8}" cy="${c1y}" rx="26" ry="10" fill="none" stroke="${MIC.dna}" stroke-width="3"/>`) +
    `<g id="ph1">${phageSvg(c1x + 70, c1y - 40, 1.2, -40)}</g>` +
    part('vCoat', `<g id="ph1c"><circle cx="${c1x + 70}" cy="${c1y - 40}" r="12" fill="none" stroke="rgba(0,0,0,0)" stroke-width="2"/></g>`) +
    part('vNA', `<g id="ph1n"><circle cx="${c1x + 70}" cy="${c1y - 40}" r="5" fill="rgba(0,0,0,0)"/></g>`);
  /* 2) الاختراق */
  const box2 = part('vPen', frame(2) + bactSvg(c2x - 10, c2y, 124, 44) + phageSvg(c2x + 66, c2y - 30, 1.1, -60) +
    `<path id="injDNA" d="M${c2x + 46},${c2y - 12} q-10,8 -20,2 q-10,-6 -18,4" fill="none" stroke="${MIC.vdna}" stroke-width="2.6"/>`);
  /* 3) التخليق: أجزاء فيروسية منفصلة غير مجمّعة */
  let bits = ''; const r3 = rng(7);
  for (let i = 0; i < 7; i++){ const x = c3x - 44 + r3() * 88, y = c3y - 12 + r3() * 24;
    bits += i % 2 ? `<g class="vbit" data-i="${i}" data-x="${n2(x)}" data-y="${n2(y)}"><polygon points="${[0, 1, 2, 3, 4, 5].map(j => n2(x + Math.cos(j * 1.047) * 5) + ',' + n2(y + Math.sin(j * 1.047) * 5)).join(' ')}" fill="${MIC.phageL}" stroke="${MIC.phage}" stroke-width="1.4"/></g>`
      : `<g class="vbit" data-i="${i}" data-x="${n2(x)}" data-y="${n2(y)}"><path d="M${n2(x - 6)},${n2(y)} q3,-5 6,0 q3,5 6,0" fill="none" stroke="${MIC.vdna}" stroke-width="2"/></g>`; }
  const box3 = part('vSynth', frame(3) + bactSvg(c3x, c3y, 140, 50, 0, '') + bits);
  /* 4) الإنضاج: فيروسات مكتملة داخل الخلية */
  const box4 = part('vMature', frame(4) + bactSvg(c4x, c4y, 140, 50) + [-40, -12, 16, 44].map((d, i) => phageSvg(c4x + d, c4y - 12, 0.55, (i % 2 ? 20 : -20), 'vpulse')).join(''));
  /* 5) التحرر: الخلية تتحلل وتنطلق الفيروسات */
  const esc = []; for (let i = 0; i < 7; i++) esc.push(`<g class="vesc" data-i="${i}">${phageSvg(0, 0, 0.6, 0)}</g>`);
  const box5 = part('vRelease', frame(5) + `<g transform="translate(${c5x + 10},${c5y + 6})"><path d="M-60,-22 L50,-22 A22,22 0 0 1 50,22 L-60,22 L-48,10 L-62,0 L-48,-10Z" fill="${MIC.bac}" stroke="${MIC.bacS}" stroke-width="3"/></g>` + `<g id="escG">${esc.join('')}</g>`);
  /* 6) التكامل: DNA الفيروس مندمج مع DNA البكتيريا */
  const lobe = (x, y) => `<path d="M${n2(x + 16)},${n2(y - 4)} q14,-12 22,0 q-8,14 -22,4" fill="none" stroke="${MIC.vdna}" stroke-width="3.2"/>`;
  const box6 = part('vInteg', frame(6) + bactSvg(c6x - 10, c6y, 132, 46)) + part('vDNA', `<g id="vLobe">${lobe(c6x - 10, c6y)}</g>`);
  const D1 = [770, 420], D2 = [900, 400];
  const daughters = part('vDaugh', bactSvg(D1[0], D1[1], 116, 42, -12) + bactSvg(D2[0], D2[1], 116, 42, -40)) +
    part('vProph', `<g transform="rotate(-12 ${D1[0]} ${D1[1]})">${lobe(D1[0], D1[1])}</g><g transform="rotate(-40 ${D2[0]} ${D2[1]})">${lobe(D2[0], D2[1])}</g>`);
  /* أسهم الدورتين */
  const arc = (x0, y0, x1, y1, bend, cls) => { const mx = (x0 + x1) / 2 + bend[0], my = (y0 + y1) / 2 + bend[1], a = Math.atan2(y1 - my, x1 - mx), h = 11;
    return `<g class="${cls || ''}"><path d="M${x0},${y0} Q${n2(mx)},${n2(my)} ${x1},${y1}" fill="none" stroke="#e8e0d0" stroke-width="3.4"/>
      <path d="M${x1},${y1} L${n2(x1 - h * Math.cos(a - 0.45))},${n2(y1 - h * Math.sin(a - 0.45))} L${n2(x1 - h * Math.cos(a + 0.45))},${n2(y1 - h * Math.sin(a + 0.45))}Z" fill="#e8e0d0"/></g>`; };
  const arrows = arc(600, 100, 640, 212, [40, -20]) + arc(600, 336, 590, 380, [20, 0]) + arc(440, 440, 396, 510, [-10, -10]) +
    arc(250, 478, 220, 420, [-20, 0]) + arc(150, 302, 396, 104, [-60, -60]) +
    arc(698, 270, 738, 270, [0, -14]) + arc(840, 320, 850, 375, [30, 0]) + arc(760, 460, 640, 460, [0, 50]);
  const body = `${arrows}${box1}${box2}${box3}${box4}${box5}${box6}${daughters}
    <text class="cap" x="330" y="352" text-anchor="middle" fill="#ffd98a">دورة التحلل</text>
    <text class="cap" x="840" y="182" text-anchor="middle" fill="#ffd98a">دورة التحلل والإنتاج</text>
    <text class="cap sm" x="560" y="640" text-anchor="middle">تتكاثر الفايروسات من خلال دورتين متداخلتين هما دورة التحلل ودورة التحلل والإنتاج (وزاري)</text>`;
  const ctl = stageCtl(VIR_STAGES, { dur: 36 });
  const boxOf = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
  return {
    body, stages: VIR_STAGES, fnParts: ['vAttach', 'vPen', 'vSynth', 'vMature', 'vRelease', 'vInteg'],
    parts: [
      { id: 'vBac', anchor: [c1x - 48, c1y + 14], label: [330, 120], side: 'C' },
      { id: 'vWall', anchor: [c1x - 62, c1y - 6], label: [330, 160], side: 'C' },
      { id: 'vBDNA', anchor: [c1x - 22, c1y + 8], label: [340, 200], side: 'C' },
      { id: 'vNA', anchor: [c1x + 70, c1y - 40], label: [700, 60], side: 'C' },
      { id: 'vCoat', anchor: [c1x + 79, c1y - 46], label: [720, 100], side: 'C' },
      { id: 'vDNA', anchor: [c6x + 22, c6y - 6], label: [866, 340], side: 'R' },
      { id: 'vProph', anchor: [D1[0] + 20, D1[1] - 12], label: [680, 520], side: 'C' },
      { id: 'vDaugh', anchor: [D2[0], D2[1] + 24], label: [866, 520], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'info:vLytic', label: 'دورة التحلل' }, { id: 'info:vLyso', label: 'دورة التحلل والإنتاج' }, { id: 'info:vVirus', label: 'عن الرواشح' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const cur = boxOf[STG.idx], k = STG.k;
      a.all('.vbox').forEach(g => { const on = +g.dataset.b === cur; g.querySelector('rect').setAttribute('stroke', on ? '#ffb000' : '#5a4a3a'); g.querySelector('rect').setAttribute('stroke-width', on ? 5 : 2); });
      /* 1: الفيروس يقترب ويلتصق */
      const p1 = cur === 1 ? Math.min(1, k * 1.6) : 1, ph = a.el('#ph1');
      if (ph) ph.setAttribute('transform', `translate(${n2((1 - p1) * 40)},${n2(-(1 - p1) * 30)})`);
      ['#ph1c', '#ph1n'].forEach(s => { const e = a.el(s); if (e) e.setAttribute('transform', `translate(${n2((1 - p1) * 40)},${n2(-(1 - p1) * 30)})`); });
      /* 2: DNA الفيروس يدخل */
      const inj = a.el('#injDNA'); if (inj){ const p = cur === 2 ? k : 1; inj.setAttribute('stroke-dasharray', '60'); inj.setAttribute('stroke-dashoffset', n2(60 - 60 * p)); }
      /* 3: الأجزاء تتحرك داخل الخلية */
      a.all('.vbit').forEach(e => { const i = +e.dataset.i; e.setAttribute('transform', `translate(${n2(Math.sin(t * 2 + i) * 4)},${n2(Math.cos(t * 1.7 + i) * 3)})`); });
      a.all('.vpulse').forEach((e, i) => e.style.opacity = n2(0.6 + 0.4 * Math.sin(t * 3 + i)));
      /* 5: الفيروسات تنطلق من الخلية المتحللة */
      a.all('.vesc').forEach(e => { const i = +e.dataset.i, p = (t * 0.35 + i / 7) % 1, an = 2.2 + i * 0.32;
        e.setAttribute('transform', `translate(${n2(c5x - 30 + Math.cos(an) * p * 70)},${n2(c5y + 6 + Math.sin(an) * p * 50)}) rotate(${n2(an * 57 + 90)})`); e.setAttribute('opacity', n2(1 - p * 0.6)); });
      const lb = a.el('#vLobe'); if (lb) lb.style.filter = cur === 6 ? `drop-shadow(0 0 ${n2(3 + 4 * Math.sin(t * 4))}px #ff6fb0)` : '';
    }
  };
}

/* ═════════════ البدائيات ═════════════ */
const PRK_VIEWS = [
  { id: 'bfiss', label: 'لاجنسي: الانشطار الثنائي' },
  { id: 'bdr',   label: 'جنسي: الخلية المعطية والمستلمة' },
  { id: 'bconj', label: 'جنسي: الاقتران وإعادة الخلط' },
  { id: 'bplas', label: 'جنسي: انتقال عامل الخصوبة (شكل 3-5)' }
];
SCENES.prok = {
  title: 'التكاثر في البدائيات (البكتيريا)',
  get src(){ return ({ bfiss: 'ملزمة ص19', bdr: 'ملزمة ص21–23', bconj: 'ملزمة ص19–22', bplas: 'ملزمة ص21–23' })[SEL.prkv] || 'ملزمة ص19'; },
  tint: ['rgba(140,200,90,.22)', 'rgba(220,200,80,.14)'],
  model3d: () => 'prk_' + SEL.prkv,
  build(){
    const v = PRK_VIEWS.some(x => x.id === SEL.prkv) ? SEL.prkv : 'bfiss';
    const s = v === 'bconj' ? prkConj() : v === 'bplas' ? prkPlas() : v === 'bdr' ? prkDonRec() : prkFiss();
    s.rebuildOnRadio = 'prkv';
    s.tools = PRK_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'prkv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.prk_fiss = { title: 'الانشطار الثنائي في البكتيريا', build: () => prkFiss(true) };
SCENES.prk_conj = { title: 'الاقتران وإعادة الخلط في البكتيريا', build: () => prkConj(true) };
SCENES.prk_dr = { title: 'الخلية المعطية والخلية المستلمة في بكتيريا القولون', build: () => prkDonRec(true) };
SCENES.prk_plas = { title: 'الاقتران البكتيري في بكتيريا القولون (شكل 3-5)', build: () => prkPlas(true) };

/* كروموسوم بكتيري: خيط متشابك */
function tangle(cx, cy, s, seed){ const r = rng(seed), P = [];
  for (let i = 0; i < 9; i++){ const a = i / 9 * 6.283 * 2.2; P.push([cx + Math.cos(a) * (10 + r() * 9) * s, cy + Math.sin(a * 1.3) * (6 + r() * 5) * s]); }
  return `<path d="${smoothClosed(P)}" fill="none" stroke="${MIC.chrom}" stroke-width="${n2(2.2 * s)}" stroke-linejoin="round"/>`; }
/* خلية بكتيرية بخصر: L الطول، H العرض، w عمق التخصر */
function waistCell(cx, cy, L, H, w){
  const x0 = cx - L / 2, x1 = cx + L / 2, r = H / 2, y0 = cy - r, y1 = cy + r;
  return `M${n2(x0 + r)},${n2(y0)} Q${n2(cx)},${n2(y0 + w * 2)} ${n2(x1 - r)},${n2(y0)} A${n2(r)},${n2(r)} 0 0 1 ${n2(x1 - r)},${n2(y1)} Q${n2(cx)},${n2(y1 - w * 2)} ${n2(x0 + r)},${n2(y1)} A${n2(r)},${n2(r)} 0 0 1 ${n2(x0 + r)},${n2(y0)}Z`;
}
const cellPath = (d, extra) => `<path d="${d}" fill="${MIC.cell}" stroke="${MIC.cellS}" stroke-width="7" ${extra || ''}/>`;
/* الحالة المرسومة للخلية الكبيرة عند مرحلة st وتقدم k */
function fissState(cx, cy, st, k){
  const H = 92; let L = 220, w = 0, sep = 0, dup = 0, split = 0, att = st === 0 ? 1 : 0;
  if (st >= 1) L = 220 + 60 * (st === 1 ? k : 1);
  if (st >= 2){ dup = st === 2 ? k : 1; w = st === 2 ? 8 * k : 8; }
  if (st >= 3){ sep = st === 3 ? k : 1; w = st === 3 ? 8 + 30 * k : 38; L = 280 + 40 * (st === 3 ? k : 1); }
  if (st >= 4) split = k;
  let s = '';
  if (st < 4){
    s += cellPath(waistCell(cx, cy, L, H, w));
    const d = 60 * sep + 14 * dup;
    s += `<g transform="translate(${n2(-d)},0)">${tangle(cx, cy, 1.5, 3)}</g>`;
    if (dup > 0) s += `<g opacity="${n2(dup)}" transform="translate(${n2(d)},0)">${tangle(cx, cy, 1.5, 4)}</g>`;
    if (att) s += `<line x1="${cx}" y1="${cy - 10}" x2="${cx}" y2="${cy - H / 2 + 3}" stroke="#d24" stroke-width="2.4"/><circle cx="${cx}" cy="${cy - H / 2 + 4}" r="4" fill="#d24"/>`;
  } else {
    const off = 90 + 30 * split;
    [-1, 1].forEach(sg => { s += cellPath(waistCell(cx + sg * off, cy, 170, H, 0)) + tangle(cx + sg * off, cy, 1.5, sg > 0 ? 4 : 3); });
  }
  return s;
}
const FISS_STAGES = [
  { n: '1 · اتصال الكروموسوم بالغشاء', d: 'يحصل اتصال للكروموسوم البكتيري في مواقع معينة من غشاء الخلية بما يؤشر أن الخلية مهيأة للانقسام.' },
  { n: '2 · توسع الخلية', d: 'تتهيأ الخلية للانشطار الثنائي وذلك بتوسع جدار الخلية وغشائها وبالتالي بأكملها.' },
  { n: '3 · تضاعف DNA وبدء التخصر', d: 'ينتج تضاعف DNA الخلية كروموسومين متماثلين في نفس الوقت، ثم يبدأ جدار وغشاء الخلية بالتخصر.' },
  { n: '4 · انسحاب الكروموسومين', d: 'ينسحب الكروموسومان في اتجاهين كنتيجة لاستطالة الخلية ويتوزع السايتوبلازم في نفس الوقت ويزداد تخصر الخلية.' },
  { n: '5 · انقسام الخلية', d: 'تنقسم الخلية لتنتج خليتين متماثلتين.' }
];
function prkFiss(still){
  /* عمود رسم الملزمة (ص19) على اليمين */
  const X = 610, Y = [92, 196, 300, 404, 516], s = 0.74;
  const mini = (st, k) => `<g transform="translate(${X},${Y[st]}) scale(${s}) translate(${-X},${-Y[st]})">${fissState(X, Y[st], st, k)}</g>`;
  const rows = `
    ${part('fAttach', `<g data-st="0">${mini(0, 0)}</g>`)}
    ${part('fChrom', `<circle cx="${X - 4}" cy="${Y[0] + 2}" r="14" fill="rgba(0,0,0,0)"/>`)}
    ${part('fExpand', `<g data-st="1">${mini(1, 1)}</g>`)}
    ${part('fDup', `<g data-st="2">${mini(2, 1)}</g>`)}
    ${part('fPull', `<g data-st="3">${mini(3, 1)}</g>`)}
    ${part('fDivide', `<g data-st="4">${mini(4, 0.4)}</g>`)}
    <g font-size="12" fill="#e8e0d0" text-anchor="middle"><text x="${X}" y="${Y[2] + 44}">تبدأ بالتخصر</text><text x="${X}" y="${Y[3] + 44}">يزداد التخصر</text></g>`;
  const big = `<g id="bigCell"></g>`;
  const body = `${rows}
    <rect x="70" y="300" width="400" height="290" rx="16" fill="rgba(255,230,128,.05)" stroke="rgba(255,230,128,.25)" stroke-dasharray="6 6"/>
    <text class="cap sm" x="270" y="326" text-anchor="middle">الخلية مكبّرة — تتبع المرحلة الحالية</text>
    ${big}
    <text class="cap sm" x="500" y="640" text-anchor="middle">تتكاثر البكتيريا لا جنسياً بطريقة الانشطار الثنائي — نتيجة للاستطالة والتخصر ينسحب كل كروموسوم إلى قطب من أقطاب الخلية</text>`;
  const ctl = stageCtl(FISS_STAGES, { dur: 26 });
  return {
    body, stages: FISS_STAGES, fnParts: ['fAttach', 'fDup', 'fDivide'],
    parts: [
      { id: 'fChrom', anchor: [X - 6, Y[0] + 4], label: [430, 80], side: 'C' },
      { id: 'fAttach', anchor: [X, Y[0] - 24], label: [866, Y[0] - 10], side: 'R' },
      { id: 'fExpand', anchor: [X + 100, Y[1] - 20], label: [866, Y[1]], side: 'R' },
      { id: 'fDup', anchor: [X + 20, Y[2]], label: [866, Y[2]], side: 'R' },
      { id: 'fPull', anchor: [X + 50, Y[3]], label: [866, Y[3]], side: 'R' },
      { id: 'fDivide', anchor: [X + 140, Y[4]], label: [866, Y[4]], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'info:fBinary', label: 'عن الانشطار الثنائي' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt); stageShow(a, STG.idx, STG.k);
      const g = a.el('#bigCell'); if (g) g.innerHTML = `<g transform="translate(270,460) scale(0.85) translate(-270,-460)">${fissState(270, 460, STG.idx, STG.k)}</g>`;
    }
  };
}

/* التكاثر الجنسي في البكتيريا: الخلية المعطية × الخلية المستلمة — جدول ص23 خطوة بخطوة.
   كل خطوة تبرز صفاً من المقارنة والتركيب الذي يخصه في الخليتين. */
const DONREC_STAGES = [
  { n: '1 · ذكرية وأنثوية', d: 'يتم التكاثر الجنسي (الاقتران) في بكتيريا القولون بين خليتين: الخلية المعطية وتمثل خلية ذكرية، والخلية المستلمة وتمثل خلية أنثوية.' },
  { n: '2 · عامل الخصوبة', d: 'الخلية المعطية تحتوي على عامل الخصوبة (قطعة دائرية صغيرة من الـDNA في السايتوبلازم)، والخلية المستلمة لا تحتوي على عامل الخصوبة.' },
  { n: '3 · أهلاب الاقتران (الأهلاب الجنسية)', d: 'الخلية المعطية تحتوي على زوائد تعرف بأهلاب الاقتران (الأهلاب الجنسية)، والخلية المستلمة لا تحتوي على أهلاب جنسية.' },
  { n: '4 · تعطي وتستلم', d: 'المعطية تعطي جزءاً من مادتها الوراثية ولا يبقى نقصان فيها لأنه يتمم نفسه بالتضاعف، والمستلمة تستلم جزءاً من كروموسوم الخلية المعطية ولا يزيد حجم كروموسومها لأن القطعة المستلمة تحل محل جزء مساوٍ لها.' }
];
function prkDonRec(still){
  const DX = 330, RX = 700, CY = 262, W = 170, H = 250;
  const capsV = cx => `<rect x="${cx - W / 2}" y="${CY - H / 2}" width="${W}" height="${H}" rx="${W / 2}" fill="${MIC.cell}" stroke="${MIC.cellS}" stroke-width="7"/>`;
  const fig8 = (cx, col) => `<ellipse cx="${cx}" cy="${CY - 40}" rx="36" ry="30" fill="none" stroke="${col}" stroke-width="5"/><ellipse cx="${cx}" cy="${CY + 18}" rx="36" ry="30" fill="none" stroke="${col}" stroke-width="5"/>`;
  let hairs = ''; for (let i = -3; i <= 3; i++){ const a = -Math.PI / 2 + i * 0.32, x0 = DX + Math.cos(a) * (W / 2 - 4), y0 = CY - H / 2 + W / 2 + Math.sin(a) * (W / 2 - 4);
    hairs += `<path d="M${n2(x0)},${n2(y0)} l${n2(Math.cos(a) * 30)},${n2(Math.sin(a) * 30)}" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>`; }
  const cross = (x, y) => `<g opacity=".9"><circle cx="${x}" cy="${y}" r="15" fill="rgba(226,64,62,.15)" stroke="#e2403e" stroke-width="2.4" stroke-dasharray="4 3"/><path d="M${x - 7},${y - 7} l14,14 M${x + 7},${y - 7} l-14,14" stroke="#e2403e" stroke-width="3" stroke-linecap="round"/></g>`;
  const cells = `
    <g data-hl="0">${part('cDonor', capsV(DX))}</g>
    <g data-hl="0">${part('cRecip', capsV(RX))}</g>
    <g data-hl="3">${part('cPilus', hairs)}</g>
    <g data-hl="3">${cross(RX, CY - H / 2 - 18)}</g>
    <g data-hl="4">${part('cChrom', fig8(DX, MIC.donor))}<g>${fig8(RX, MIC.recip)}</g></g>
    <g data-hl="2">${part('cFert', `<circle cx="${DX}" cy="${CY + 84}" r="18" fill="none" stroke="${MIC.plas}" stroke-width="5"/>`)}</g>
    <g data-hl="2">${cross(RX, CY + 84)}</g>
    <text class="cap" x="${DX}" y="${CY + H / 2 + 34}" text-anchor="middle" fill="#ffd98a">الخلية المعطية (ذكرية) ♂</text>
    <text class="cap" x="${RX}" y="${CY + H / 2 + 34}" text-anchor="middle" fill="#ffd98a">الخلية المستلمة (أنثوية) ♀</text>`;
  const R = TABLES.mDonRec.rows, wrapL = t => wrapName(t, 44);
  let rows = '', y = 446;
  R.forEach((r, i) => { const L = wrapL(r[0]), M = wrapL(r[1]), h = Math.max(L.length, M.length) * 18 + 14;
    rows += `<g class="drRow" data-r="${i + 1}"><rect x="160" y="${y}" width="710" height="${h}" rx="8" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.15)"/>
      <text class="cap sm" x="${DX}" y="${y + 22}" text-anchor="middle">${L.map((l, j) => `<tspan x="${DX}" dy="${j ? 18 : 0}">${l}</tspan>`).join('')}</text>
      <text class="cap sm" x="${RX}" y="${y + 22}" text-anchor="middle">${M.map((l, j) => `<tspan x="${RX}" dy="${j ? 18 : 0}">${l}</tspan>`).join('')}</text>
      <circle cx="160" cy="${y + h / 2}" r="12" fill="#ffd98a"/><text x="160" y="${y + h / 2 + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="#2a1a10">${i + 1}</text></g>`;
    y += h + 8; });
  const body = `${cells}<line x1="515" y1="${CY - H / 2}" x2="515" y2="${CY + H / 2 + 40}" stroke="rgba(255,255,255,.2)" stroke-dasharray="6 6"/>${rows}`;
  const ctl = stageCtl(DONREC_STAGES, { dur: 28 });
  return {
    body, stages: DONREC_STAGES, fnParts: ['cDonor', 'cRecip'],
    parts: [
      { id: 'cDonor', anchor: [DX - W / 2 + 3, CY + 60], label: [134, 380], side: 'L' },
      { id: 'cChrom', anchor: [DX - 36, CY - 40], label: [134, 300], side: 'L' },
      { id: 'cFert', anchor: [DX + 18, CY + 84], label: [470, 360], side: 'C' },
      { id: 'cPilus', anchor: [DX + 20, CY - H / 2 - 22], label: [480, 120], side: 'C' },
      { id: 'cRecip', anchor: [RX + W / 2 - 3, CY + 40], label: [866, 300], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:mDonRec', label: 'المعطية × المستلمة (ص23)' }, { id: 'info:cRecomb', label: 'إعادة الخلط' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      const s = still ? -1 : STG.idx + 1;
      a.all('.drRow').forEach(g => { const on = +g.dataset.r === s, r = g.querySelector('rect');
        r.setAttribute('fill', on ? 'rgba(255,217,138,.18)' : 'rgba(255,255,255,.06)'); r.setAttribute('stroke', on ? '#ffd98a' : 'rgba(255,255,255,.15)');
        g.setAttribute('opacity', s < 0 || on || +g.dataset.r < s ? 1 : 0.45); });
      a.all('[data-hl]').forEach(g => { const h = +g.dataset.hl, on = h === s || (s === 1 && h === 0);
        g.style.filter = on ? `drop-shadow(0 0 ${n2(4 + 4 * Math.sin(t * 4))}px #ffe08a)` : ''; });
    }
  };
}

/* الاقتران وإعادة الخلط — رسم ص20 والخطوات ص21 */
const CONJ_STAGES = [
  { n: '1 · الخلية المعطية والمستلمة', d: 'يتم الاقتران بين خليتين: المعطية (الذكرية) التي تحتوي على عامل الخصوبة وأهلاب الاقتران (الأهلاب الجنسية)، والمستلمة (الأنثوية) التي لا تحتوي على عامل الخصوبة أو أهلاب الاقتران.' },
  { n: '2 · جسر الاقتران', d: 'عند ملامسة هلب الاقتران سطح الخلية المستلمة يتكون جسر اقتران يعمل على تواصل بروتوبلازم الخليتين البكتيريتين.' },
  { n: '3 · انغراز عامل الخصوبة', d: 'ينغرز عامل الخصوبة في كروموسوم الخلية المعطية ويصبح جزءاً منه.' },
  { n: '4 · انكسار الشريط وانتقاله', d: 'ينكسر أحد شريطي DNA كروموسوم الخلية المعطية في موقع معين ويبدأ بالحركة وانتقال جزء من كروموسوم الخلية المعطية إلى الخلية المستلمة عبر جسر الاقتران، ويتمم شريط الخلية المعطية نفسه.' },
  { n: '5 · إعادة الخلط', d: 'القطعة المنتقلة لا تزيد حجم كروموسوم الخلية المستلمة لأنها تحل محل جزء مساوٍ لها، فتظهر سلالة جديدة ثالثة تختلف وظيفياً (إعادة الخلط).' }
];
function prkConj(still){
  const DX = 400, RX0 = 660, CY = 420, W = 150, H = 250;
  const capsV = (cx, fill) => `<rect x="${cx - W / 2}" y="${CY - H / 2}" width="${W}" height="${H}" rx="${W / 2}" fill="${fill}" stroke="${MIC.cellS}" stroke-width="7"/>`;
  const fig8 = (cx, col, cls) => `<g class="${cls || ''}"><ellipse cx="${cx}" cy="${CY - 52}" rx="34" ry="30" fill="none" stroke="${col}" stroke-width="4.5"/><ellipse cx="${cx}" cy="${CY + 6}" rx="34" ry="30" fill="none" stroke="${col}" stroke-width="4.5"/></g>`;
  const body = `
    ${part('cDonor', capsV(DX, MIC.cell) + `<g stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"><path d="M${DX - 40},${CY - 118} l-6,-18 M${DX - 20},${CY - 124} l-2,-20 M${DX},${CY - 125} l0,-20 M${DX + 20},${CY - 124} l2,-20 M${DX + 40},${CY - 118} l6,-18"/></g>`)}
    <g id="recip">${part('cRecip', capsV(RX0, MIC.cell) + `<circle cx="${RX0}" cy="${CY - 140}" r="16" fill="#2a2a2a"/><path d="M${RX0 - 22},${CY - 150} l14,10 -14,10Z M${RX0 + 22},${CY - 150} l-14,10 14,10Z" fill="#ff7ab8"/>`)}</g>
    ${part('cChrom', fig8(DX, MIC.donor))}
    <g id="rChrom">${fig8(RX0, MIC.recip)}<path id="rSeg" d="M${RX0 - 30},${CY + 22} Q${RX0},${CY + 42} ${RX0 + 30},${CY + 22}" fill="none" stroke="${MIC.plas}" stroke-width="5" opacity="0"/></g>
    ${part('cFert', `<circle id="plasmid" cx="${DX}" cy="${CY + 84}" r="16" fill="none" stroke="${MIC.plas}" stroke-width="5"/>`)}
    <path id="dSeg" d="M${DX - 30},${CY + 22} Q${DX},${CY + 42} ${DX + 30},${CY + 22}" fill="none" stroke="${MIC.plas}" stroke-width="5" opacity="0"/>
    ${part('cPilus', `<path id="pilus" d="M${DX + W / 2 - 4},${CY - 30} L${DX + W / 2 + 40},${CY - 30}" stroke="#2a2a2a" stroke-width="4" stroke-linecap="round"/>`)}
    ${part('cBridge', `<rect id="bridge" x="${DX + W / 2 - 6}" y="${CY - 14}" width="${RX0 - W / 2 - (DX + W / 2) + 12}" height="28" rx="6" fill="${MIC.cell}" stroke="${MIC.cellS}" stroke-width="4"/>`)}
    <circle id="moving" r="7" fill="${MIC.plas}" opacity="0"/>
    <text class="cap sm" x="${DX}" y="${CY + 160}" text-anchor="middle">خلية معطية (ذكرية)</text>
    <text id="recipTxt" class="cap sm" x="${RX0}" y="${CY + 160}" text-anchor="middle">خلية مستلمة (أنثوية)</text>
    <text class="cap sm" x="530" y="640" text-anchor="middle">إعادة الخلط: اتحاد جيني بين سلالتين مختلفتين من بكتيريا القولون يُظهر سلالة جديدة ثالثة</text>`;
  const ctl = stageCtl(CONJ_STAGES, { dur: 30 });
  return {
    body, stages: CONJ_STAGES, fnParts: ['cBridge', 'cFert'],
    parts: [
      { id: 'cDonor', anchor: [DX - W / 2 + 4, CY + 60], label: [134, 560], side: 'L' },
      { id: 'cChrom', anchor: [DX - 34, CY - 52], label: [134, 395], side: 'L' },
      { id: 'cFert', anchor: [DX - 16, CY + 84], label: [134, 470], side: 'L' },
      { id: 'cPilus', anchor: [DX + 20, CY - 136], label: [520, 236], side: 'C' },
      { id: 'cBridge', anchor: [530, CY + 14], label: [540, 560], side: 'C' },
      { id: 'cRecip', anchor: [RX0 + W / 2 - 4, CY + 40], label: [866, 470], side: 'R' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:mDonRec', label: 'المعطية × المستلمة (ص23)' }, { id: 'info:cRecomb', label: 'إعادة الخلط' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const st = STG.idx, k = STG.k;
      const gap = st === 0 ? 60 * (1 - k) : 0;
      const rc = a.el('#recip'), rch = a.el('#rChrom'), rt = a.el('#recipTxt');
      [rc, rch].forEach(e => e && e.setAttribute('transform', `translate(${n2(gap)},0)`)); if (rt) rt.setAttribute('x', n2(RX0 + gap));
      const br = a.el('#bridge'); if (br){ const full = RX0 - W / 2 - (DX + W / 2) + 12; br.setAttribute('width', n2(st === 0 ? 0 : st === 1 ? full * k : full)); }
      const pl = a.el('#plasmid'); if (pl){ const p = st < 2 ? 0 : st === 2 ? k : 1; pl.setAttribute('cy', n2(CY + 84 - p * 56)); pl.setAttribute('r', n2(16 - 6 * p)); pl.setAttribute('opacity', n2(st >= 3 ? 0 : 1)); }
      const ds = a.el('#dSeg'); if (ds) ds.setAttribute('opacity', st >= 2 && !(st === 2 && k < 0.8) ? 1 : 0);
      const mv = a.el('#moving'); if (mv){ if (st === 3){ mv.setAttribute('opacity', 1); mv.setAttribute('cx', n2(DX + (RX0 - DX) * k)); mv.setAttribute('cy', n2(CY + 30 - Math.sin(k * Math.PI) * 30)); } else mv.setAttribute('opacity', 0); }
      const rs = a.el('#rSeg'); if (rs) rs.setAttribute('opacity', st >= 4 ? n2(Math.min(1, k * 3)) : 0);
      const pi = a.el('#pilus'); if (pi) pi.setAttribute('opacity', st === 0 ? 1 : 0.35);
    }
  };
}

/* شكل (3-5): انتقال عامل الخصوبة (البلازميد) من الخلية المعطية إلى المستلمة */
const PLAS_STAGES = [
  { n: 'قبل الاقتران', d: 'الخلية المعطية تحتوي على عامل الخصوبة (قطعة دائرية صغيرة من DNA) وأهلاب الاقتران، والمستلمة لا تحتوي عليه.' },
  { n: '1 · جسر الاقتران', d: 'يتكون جسر الاقتران بين الخليتين ويبدأ عامل الخصوبة بالانفتاح.' },
  { n: '2 · بدء الانتقال', d: 'ينتقل شريط من عامل الخصوبة عبر جسر الاقتران إلى الخلية المستلمة.' },
  { n: '3 · استمرار الانتقال', d: 'يستمر دخول الشريط إلى الخلية المستلمة.' },
  { n: '4 · كلتا الخليتين حاوية على عامل الخصوبة', d: 'ينتقل البلازميد من الخلية المعطية إلى المستلمة التي لا تحتوي على بلازميد عبر جسر الاقتران، وبذلك تصبح كلتا الخليتين حاوية على عامل الخصوبة.' }
];
function prkPlas(still){
  const X = [120, 310, 500, 690, 880], CY = 400, w = 40, h = 130;
  const cell = (cx) => `<rect x="${cx - w / 2}" y="${CY - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="#4a3f9a" stroke="#9fb6ff" stroke-width="3"/>
    <path d="M${cx - 10},${CY - 46} q10,-14 20,0 q-10,12 -20,0 q4,22 10,30 q6,-8 10,-30" fill="none" stroke="#d8c8ff" stroke-width="2.2"/>`;
  const ring = (cx, cy, r, open) => open ? `<path d="M${cx + r},${cy} A${r},${r} 0 1 1 ${n2(cx + r * Math.cos(5.4))},${n2(cy + r * Math.sin(5.4))}" fill="none" stroke="#ff8a3a" stroke-width="4" stroke-dasharray="3 2"/>` :
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ff8a3a" stroke-width="4" stroke-dasharray="3 2"/>`;
  let pairs = '';
  X.forEach((x, i) => {
    const d = x - 34, r = x + 34;
    let g = cell(d) + cell(r);
    if (i > 0) g = `<rect x="${d + 14}" y="${CY - 8}" width="${r - d - 28}" height="16" fill="#4a3f9a" stroke="#9fb6ff" stroke-width="2"/>` + g;
    g += ring(d, CY + 30, 11, i >= 1 && i <= 3);
    if (i === 0) g += `<line x1="${d + w / 2}" y1="${CY - 20}" x2="${d + w / 2 + 12}" y2="${CY - 24}" stroke="#9fb6ff" stroke-width="3"/>`;
    if (i === 2) g += `<path d="M${d + 8},${CY + 22} Q${x},${CY + 4} ${r - 4},${CY + 10}" fill="none" stroke="#ff8a3a" stroke-width="3"/>`;
    if (i === 3) g += `<path d="M${d + 8},${CY + 22} Q${x},${CY + 4} ${r + 4},${CY + 22} q8,12 -4,18" fill="none" stroke="#ff8a3a" stroke-width="3"/>`;
    if (i === 4) g += ring(r, CY + 30, 11, false);
    pairs += `<g data-st="${i}">${g}${i ? `<text x="${x}" y="${CY + 100}" text-anchor="middle" font-size="18" font-weight="800" fill="#ffd98a">${i}</text>` : ''}</g>`;
    if (i < 4) pairs += gArrow(x + 62, CY, X[i + 1] - 62, CY, '#e8e0d0');
  });
  const body = `
    ${part('pDonor', `<rect x="${X[0] - 34 - w / 2}" y="${CY - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="rgba(0,0,0,0)"/>`)}
    ${part('pRecip', `<rect x="${X[0] + 34 - w / 2}" y="${CY - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="rgba(0,0,0,0)"/>`)}
    ${pairs}
    ${part('pBridge', `<rect x="${X[1] - 20}" y="${CY - 8}" width="40" height="16" fill="rgba(0,0,0,0)" stroke="rgba(0,0,0,0)"/>`)}
    ${part('pFert', `<circle cx="${X[0] - 34}" cy="${CY + 30}" r="13" fill="rgba(0,0,0,0)"/>`)}
    ${part('pChrom', `<circle cx="${X[0] + 34}" cy="${CY - 46}" r="12" fill="rgba(0,0,0,0)"/>`)}
    <text class="cap sm" x="500" y="640" text-anchor="middle">شكل (3-5): الاقتران البكتيري في بكتيريا القولون — كلتا الخليتين تصبح حاوية على عامل الخصوبة</text>`;
  const ctl = stageCtl(PLAS_STAGES, { dur: 22 });
  return {
    body, stages: PLAS_STAGES, fnParts: ['pFert', 'pBridge'],
    parts: [
      { id: 'pDonor', anchor: [X[0] - 34, CY - h / 2], label: [86, 290], side: 'C' },
      { id: 'pRecip', anchor: [X[0] + 34, CY - h / 2], label: [200, 300], side: 'C' },
      { id: 'pBridge', anchor: [X[1], CY - 8], label: [X[1], 290], side: 'C' },
      { id: 'pFert', anchor: [X[0] - 34, CY + 42], label: [90, 540], side: 'C' },
      { id: 'pChrom', anchor: [X[0] + 34, CY - 40], label: [230, 560], side: 'C' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:mDonRec', label: 'المعطية × المستلمة (ص23)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){ ctl.tick(dt); stageShow(a, STG.idx, STG.k); }
  };
}

