/* ══════════════════════════════════════════════════════════════════════════
   9 · مخططات دائرية (مثل دورة كريبس في الفصل الأول) لكل موضوع بخطوات:
       الخطوات حول دائرة بأسهم ودوائر مرقّمة، والخطوة الحالية تتوهج وشرحها في
       الوسط. زر «مخطط …» يضاف لتبويب كل موضوع وتبقى الشاشة الأصلية كما هي.
       الأجزاء: كل دائرة جزء بمعلوماته من الملزمة.
   ══════════════════════════════════════════════════════════════════════════ */
const CYC = {
  ispermD:   { src: 'ملزمة ص6–10', tab: 'intro', label: 'مخطط تكوين النطف', title: 'تكوين النطف', st: () => SPERM_STAGES, ids: ['gTestis', 'semTubX', 'spGonium', 'spPrim', 'spSec', 'spTid', 'spermM'], col: '#b07ad8' },
  ieggD:     { src: 'ملزمة ص7–11', tab: 'intro', label: 'مخطط تكوين البيوض', title: 'تكوين البيوض', st: () => EGG_STAGES, ids: ['ovary', 'ooGonium', 'ooPrim', 'ooSec', 'graaf', 'ootid', 'ovumM'], col: '#e98a8a' },
  bconjD:    { src: 'ملزمة ص19–22', tab: 'prok', label: 'مخطط الاقتران', title: 'الاقتران وإعادة الخلط في البكتيريا', st: () => CONJ_STAGES, ids: ['cDonor', 'cBridge', 'cFert', 'cChrom', 'cRecomb'], col: '#8fdc6a' },
  prPCD:     { src: 'ملزمة ص32–35', tab: 'protist', label: 'مخطط الاقتران (البراميسيوم)', title: 'الاقتران في البراميسيوم', st: () => PR_CONJ_ST, ids: ['prProtoBr', 'prMeioMic', 'prUneq', 'prExch', 'prFusHet', 'prSep', 'prEight'], col: '#5fb6d8' },
  prPSD:     { src: 'ملزمة ص33–35', tab: 'protist', label: 'مخطط الإخصاب الذاتي', title: 'الإخصاب الذاتي في البراميسيوم', st: () => PR_SELF_ST, ids: ['prProtoBr', 'prMeioMic', 'prUneq', 'prFusHom', 'prSep', 'prEight'], col: '#7aa8e8' },
  plvMossD:  { src: 'ملزمة ص45–47', tab: 'plants1', label: 'مخطط دورة الحزاز', title: 'دورة حياة البوليتراكم', st: () => PL_MOSS_ST, ids: ['plMMature', 'plMSperm', 'plMZyg', 'plMSeta', 'plMSpores', 'plMProto'], col: '#62c94a', loop: true },
  plvFernD:  { src: 'ملزمة ص48–50', tab: 'plants1', label: 'مخطط دورة السرخس', title: 'دورة حياة السرخس', st: () => PL_FERN_ST, ids: ['plFern', 'plFSpores', 'plProth', 'plFSperm', 'plFYoung'], col: '#4fae4a', loop: true },
  flVPollenD:{ src: 'ملزمة ص59–61', tab: 'flower', label: 'مخطط تكوين حبة اللقاح', title: 'تكوين حبة اللقاح', st: () => FL_POLLEN_STAGES, ids: ['flAnther', 'flMicroMother', 'flMicrospores', 'flMicrospores', 'flPollen', 'flSlit'], col: '#f2b33a' },
  sdsFTD:    { src: 'ملزمة ص82 وص86', tab: 'sdSeedFruit', label: 'مخطط أنواع الثمار', title: 'تكوّن أنواع الثمار', st: () => SD_FT_ST, ids: ['sdFlw1', 'sdSimple', 'sdFlwN', 'sdAggr', 'sdFlwM', 'sdMulti'], col: '#f59a50' },
  cyvHermD:  { src: 'ملزمة ص125', tab: 'cycle', label: 'مخطط التكاثر الخنثي', title: 'التكاثر الخنثي', st: () => HU_HERM_ST, ids: ['huHerm', 'huHydra', 'huSpEx', 'huTimeMat', 'huTapeworm'], col: '#e08a86' }
};
const CYC_TABS = { intro: [INT_VIEWS, 'intv'], prok: [PRK_VIEWS, 'prkv'], protist: [PR_VIEWS, 'prv'], plants1: [PL_VIEWS, 'plv'], flower: [FL_VIEWS, 'flv'], sdSeedFruit: [SD_VIEWS_S, 'sdsv'], cycle: [CY_VIEWS, 'cyv'] };
/* اسم مختصر للخطوة: بعد «N ·» */
const cycShort = s => s.n.replace(/^\s*\d+\s*·\s*/, '');
function cycView(v){
  const D = CYC[v], ST = D.st(), n = ST.length, C = [575, 352], R = 232, NR = 50;
  const ang = i => (-90 + i * 360 / n) * Math.PI / 180, P = i => [C[0] + Math.cos(ang(i)) * R, C[1] + Math.sin(ang(i)) * R];
  /* أسهم على محيط الدائرة بين العقد */
  const arc = (i, j) => { const a0 = ang(i) + NR / R * 1.15, a1 = (j > i ? ang(j) : ang(j) + 2 * Math.PI) - NR / R * 1.15, pts = [];
    for (let k = 0; k <= 20; k++){ const a = a0 + (a1 - a0) * k / 20; pts.push([C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R]); }
    const e = pts[20], p = pts[18], an = Math.atan2(e[1] - p[1], e[0] - p[0]), h = 12;
    return `<g class="cycArc" data-to="${j}"><path d="${pts.map((q, k) => (k ? 'L' : 'M') + n2(q[0]) + ',' + n2(q[1])).join(' ')}" fill="none" stroke="#e8e0d0" stroke-width="4" stroke-linecap="round"/>
      <path d="M${n2(e[0])},${n2(e[1])} L${n2(e[0] - h * Math.cos(an - 0.45))},${n2(e[1] - h * Math.sin(an - 0.45))} L${n2(e[0] - h * Math.cos(an + 0.45))},${n2(e[1] - h * Math.sin(an + 0.45))}Z" fill="#e8e0d0"/></g>`; };
  let arcs = ''; for (let i = 0; i < n - 1; i++) arcs += arc(i, i + 1); if (D.loop) arcs += arc(n - 1, 0);
  /* العقد */
  const nodes = ST.map((s, i) => { const [x, y] = P(i), L = wrapName(cycShort(s), 13).slice(0, 3);
    return `<g class="cycNode" data-i="${i}">${part(D.ids[i], `<circle cx="${n2(x)}" cy="${n2(y)}" r="${NR}" fill="${D.col}" fill-opacity=".28" stroke="${D.col}" stroke-width="3"/>
      <text class="cap sm" x="${n2(x)}" y="${n2(y - (L.length - 1) * 7 + 4)}" text-anchor="middle">${L.map((l, k) => `<tspan x="${n2(x)}" dy="${k ? 14 : 0}">${l}</tspan>`).join('')}</text>`)}
      <circle cx="${n2(x + NR * 0.72)}" cy="${n2(y - NR * 0.72)}" r="14" fill="#ffd98a" stroke="#5a4a3a" stroke-width="2"/><text x="${n2(x + NR * 0.72)}" y="${n2(y - NR * 0.72 + 5)}" text-anchor="middle" font-size="15" font-weight="800" fill="#2a1a10">${i + 1}</text></g>`; }).join('');
  const start = D.loop ? '' : (() => { const [x, y] = P(0), [x2, y2] = P(n - 1); return `<text class="cap sm" x="${n2(x)}" y="${n2(y - NR - 12)}" text-anchor="middle" fill="#9fe08a">البداية</text><text class="cap sm" x="${n2(x2)}" y="${n2(y2 - NR - 12)}" text-anchor="middle" fill="#ffb0a0">النهاية</text>`; })();
  const body = `<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="40"/>${arcs}${nodes}${start}
    <g pointer-events="none"><text class="cap" x="${C[0]}" y="${C[1] - 92}" text-anchor="middle" fill="#ffd98a">${D.title}</text>
    <rect x="${C[0] - 128}" y="${C[1] - 72}" width="256" height="170" rx="14" fill="rgba(20,16,32,.82)" stroke="${D.col}" stroke-width="1.6"/>
    <text id="cycT" class="cap sm" x="${C[0]}" y="${C[1] - 50}" text-anchor="middle" fill="#ffd98a"></text>
    <text id="cycD" class="cap sm" x="${C[0]}" y="${C[1] - 12}" text-anchor="middle"></text>
    <g id="cycTok" opacity="0"><circle r="11" fill="#fff" opacity=".25"/><circle r="6" fill="#ffd98a" stroke="#fff" stroke-width="2"/></g></g>
    <text class="cap sm" x="500" y="668" text-anchor="middle">مخطط ${D.title}: الخطوات بالترتيب حول الدائرة — اضغط أي دائرة لتظهر معلوماتها</text>`;
  const ctl = stageCtl(ST, { dur: n * 5 });
  let shown = -1;
  return {
    body, stages: ST, parts: [],
    tools: ctl.tools,
    init(){ ctl.start(); },
    onSlider: x => ctl.onSlider(x), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt); const s = STG.idx, k = STG.k;
      a.all('.cycNode').forEach(g => { const i = +g.dataset.i, on = i === s, c = g.querySelector('circle');
        g.setAttribute('opacity', i <= s ? 1 : 0.45); c.setAttribute('fill-opacity', on ? '.6' : '.28'); c.setAttribute('stroke-width', on ? 5 : 3);
        c.style.filter = on ? `drop-shadow(0 0 ${n2(5 + 4 * Math.sin(t * 4))}px ${D.col})` : ''; });
      a.all('.cycArc').forEach(g => { const on = +g.dataset.to === s; g.querySelectorAll('path').forEach(p => { if (p.getAttribute('fill') === 'none') p.setAttribute('stroke', on ? '#ffd98a' : '#e8e0d0'); else p.setAttribute('fill', on ? '#ffd98a' : '#e8e0d0'); }); });
      if (s !== shown){ shown = s; const T = a.el('#cycT'), Dd = a.el('#cycD');
        if (T) T.innerHTML = wrapName(ST[s].n, 30).slice(0, 2).map((l, i) => `<tspan x="${C[0]}" dy="${i ? 16 : 0}">${l}</tspan>`).join(''); if (Dd) Dd.innerHTML = wrapName(ST[s].d, 34).slice(0, 6).map((l, i) => `<tspan x="${C[0]}" dy="${i ? 17 : 0}">${l}</tspan>`).join(''); }
      /* علامة تتحرك من العقدة السابقة إلى الحالية */
      const tk = a.el('#cycTok'); if (tk){ if (s === 0 && !D.loop){ tk.setAttribute('opacity', 0); } else { const i0 = (s - 1 + n) % n, a0 = ang(i0), a1 = s > i0 ? ang(s) : ang(s) + 2 * Math.PI, q = Math.min(1, k * 1.6), aa = a0 + (a1 - a0) * q;
        tk.setAttribute('opacity', q < 1 ? 1 : 0); tk.setAttribute('transform', `translate(${n2(C[0] + Math.cos(aa) * R)},${n2(C[1] + Math.sin(aa) * R)})`); } }
    }
  };
}
/* إضافة زر «مخطط …» لكل تبويب وتغليف بنائه ومجسّمه */
Object.keys(CYC).forEach(v => { const D = CYC[v], [VIEWS] = CYC_TABS[D.tab]; if (!VIEWS.some(x => x.id === v)) VIEWS.push({ id: v, label: D.label }); });
Object.keys(CYC_TABS).forEach(tab => {
  const sc = SCENES[tab], [VIEWS, radio] = CYC_TABS[tab], ob = sc.build, om = sc.model3d;
  const sd = Object.getOwnPropertyDescriptor(sc, 'src');
  Object.defineProperty(sc, 'src', { configurable: true, get(){ const v = SEL[radio]; return CYC[v] && CYC[v].tab === tab ? CYC[v].src : (sd.get ? sd.get.call(sc) : sd.value); } });
  sc.build = function(){ const v = SEL[radio]; if (!CYC[v] || CYC[v].tab !== tab) return ob.call(this);
    const s = cycView(v); s.rebuildOnRadio = radio; s.tools = VIEWS.map(x => ({ id: x.id, label: x.label, radio, on: x.id === v })).concat(s.tools || []); return s; };
  sc.model3d = () => { const v = SEL[radio]; return CYC[v] && CYC[v].tab === tab ? 'cyc_' + v : om(); };
});
Object.assign(CH.toolIcons, Object.fromEntries(Object.keys(CYC).map(v => [v, 'route'])));
