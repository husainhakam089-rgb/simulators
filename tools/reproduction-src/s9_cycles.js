/* ══════════════════════════════════════════════════════════════════════════
   9 · مخططات دائرية (مثل دورة كريبس في الفصل الأول) لكل موضوع بخطوات:
       الخطوات حول دائرة بأسهم ودوائر مرقّمة، والخطوة الحالية تتوهج وشرحها في
       الوسط. زر «مخطط …» يضاف لتبويب كل موضوع وتبقى الشاشة الأصلية كما هي.
       الأجزاء: كل دائرة جزء بمعلوماته من الملزمة.
   ══════════════════════════════════════════════════════════════════════════ */
const CYC = {
  ispermD:   { src: 'ملزمة ص6–10', tab: 'intro', label: 'مخطط النطف ↻', title: 'تكوين النطف', st: () => SPERM_STAGES, ids: ['gTestis', 'semTubX', 'spGonium', 'spPrim', 'spSec', 'spTid', 'spermM'], col: '#b07ad8' },
  ieggD:     { src: 'ملزمة ص7–11', tab: 'intro', label: 'مخطط البيوض ↻', title: 'تكوين البيوض', st: () => EGG_STAGES, ids: ['ovary', 'ooGonium', 'ooPrim', 'ooSec', 'graaf', 'ootid', 'ovumM'], col: '#e98a8a' },
  bconjD:    { src: 'ملزمة ص19–22', tab: 'prok', label: 'مخطط الاقتران ↻', title: 'الاقتران وإعادة الخلط في البكتيريا', st: () => CONJ_STAGES, ids: ['cDonor', 'cBridge', 'cFert', 'cChrom', 'cRecomb'], col: '#8fdc6a' },
  prPCD:     { src: 'ملزمة ص32–35', tab: 'protist', label: 'مخطط الاقتران ↻', title: 'الاقتران في البراميسيوم', st: () => PR_CONJ_ST, ids: ['prProtoBr', 'prMeioMic', 'prUneq', 'prExch', 'prFusHet', 'prSep', 'prEight'], col: '#5fb6d8' },
  prPSD:     { src: 'ملزمة ص33–35', tab: 'protist', label: 'مخطط الإخصاب الذاتي ↻', title: 'الإخصاب الذاتي في البراميسيوم', st: () => PR_SELF_ST, ids: ['prProtoBr', 'prMeioMic', 'prUneq', 'prFusHom', 'prSep', 'prEight'], col: '#7aa8e8' },
  plvMossD:  { src: 'ملزمة ص45–47', tab: 'plants1', label: 'مخطط الحزاز ↻', title: 'دورة حياة البوليتراكم', st: () => PL_MOSS_ST, ids: ['plMMature', 'plMSperm', 'plMZyg', 'plMSeta', 'plMSpores', 'plMProto'], col: '#62c94a', loop: true },
  plvFernD:  { src: 'ملزمة ص48–50', tab: 'plants1', label: 'مخطط السرخس ↻', title: 'دورة حياة السرخس', st: () => PL_FERN_ST, ids: ['plFern', 'plFSpores', 'plProth', 'plFSperm', 'plFYoung'], col: '#4fae4a', loop: true },
  flVPollenD:{ src: 'ملزمة ص59–61', tab: 'flower', label: 'مخطط حبة اللقاح ↻', title: 'تكوين حبة اللقاح', st: () => FL_POLLEN_STAGES, ids: ['flAnther', 'flMicroMother', 'flMicrospores', 'flMicrospores', 'flPollen', 'flSlit'], col: '#f2b33a' },
  sdsFTD:    { src: 'ملزمة ص82 وص86', tab: 'sdSeedFruit', label: 'مخطط الثمار ↻', title: 'تكوّن أنواع الثمار', st: () => SD_FT_ST, ids: ['sdFlw1', 'sdSimple', 'sdFlwN', 'sdAggr', 'sdFlwM', 'sdMulti'], col: '#f59a50' },
  cyvHermD:  { src: 'ملزمة ص125', tab: 'cycle', label: 'مخطط الخنثي ↻', title: 'التكاثر الخنثي', st: () => HU_HERM_ST, ids: ['huHerm', 'huHydra', 'huSpEx', 'huTimeMat', 'huTapeworm'], col: '#e08a86' }
};
const CYC_TABS = { intro: [INT_VIEWS, 'intv'], prok: [PRK_VIEWS, 'prkv'], protist: [PR_VIEWS, 'prv'], plants1: [PL_VIEWS, 'plv'], flower: [FL_VIEWS, 'flv'], sdSeedFruit: [SD_VIEWS_S, 'sdsv'], cycle: [CY_VIEWS, 'cyv'] };
/* اسم مختصر للخطوة: بعد «N ·» */
const cycShort = s => s.n.replace(/^\s*\d+\s*·\s*/, '');
/* رسم صغير لكل خطوة داخل دائرتها (بإحداثيات محلية حول 0,0 بحدود ±48×±32 تقريباً).
   الرسوم المأخوذة من الشاشات تُنزع منها الأجزاء القابلة للضغط حتى يبقى الضغط للدائرة نفسها */
const cycPlain = s => s.replace(/ class="part" data-part="[^"]*"/g, '').replace(/ class="(swim|vpulse|vbit|vesc|flSep|flTubeN|flGenN|flEsc|plSw|plDust|prBob|tubRing|ovF|szSt)"/g, '');
const cycG = (k, inner, dx, dy) => `<g transform="translate(${dx || 0},${dy || 0}) scale(${k})">${inner}</g>`;
const ciCell = (x, y, r, c, n) => gCell(x, y, r, c || '#b07ad8', n || '#4a2a7a');
const ciArrow = (x0, y0, x1, y1, c) => gArrow(x0, y0, x1, y1, c || '#ffd98a');
const ciCaps = (x, y, w, h, fill, st) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${fill || '#ffe680'}" stroke="${st || '#8fdc6a'}" stroke-width="2.4"/>`;
const ciPara = (x, y, s, mir) => cycPlain(prParaV(x, y, s, mir, true));
const ciPair = (s) => ciPara(-9 * s / 0.32, 0, s, false) + ciPara(9 * s / 0.32, 0, s, true);
const ciDot = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#fff" stroke-width=".8"/>`;
const ciLeafy = (x, yb, h, s, seed) => plLeafy(x, yb, h, s, seed, 0);
let CI_G = 200;
const CYC_ICON = {
  ispermD: [
    () => cycG(0.2, cycPlain(testisSvg())),
    () => cycG(0.25, cycPlain(tubuleSvg())),
    () => ciCell(0, 0, 15),
    () => ciCell(0, 0, 22),
    () => ciCell(-15, 0, 13) + ciCell(15, 0, 13),
    () => [-27, -9, 9, 27].map(x => ciCell(x, 0, 8)).join(''),
    () => cycPlain([-24, -8, 8, 24].map((x, i) => spermSvg(x, -18, 0.48, Math.PI / 2, '', i)).join(''))
  ],
  ieggD: [
    () => cycG(0.17, cycPlain(ovarySvg()), -6, 2),
    () => ciCell(0, 0, 14, '#8f7ad8', '#2e2266'),
    () => cycPlain(follicleSvg(0, 0, 26, 11, 0)),
    () => ciCell(8, 0, 20, '#8f7ad8', '#2e2266') + ciCell(-24, 10, 8, GAM.polar, '#2e2266'),
    () => cycPlain(follicleSvg(-6, 0, 28, 8, 0.62)) + ciArrow(18, -6, 40, -22) + ciCell(44, -26, 6, '#8f7ad8', '#2e2266'),
    () => ciCell(14, 0, 18, '#a98ae8', '#2e2266') + [-30, -18, -6].map(x => ciCell(x, 14, 6, GAM.polar, '#2e2266')).join(''),
    () => `<circle cx="0" cy="0" r="26" fill="none" stroke="#ffe08a" stroke-width="3"/>` + ciCell(0, 0, 19, '#a98ae8', '#2e2266')
  ],
  bconjD: [
    () => ciCaps(-22, 0, 34, 52) + ciCaps(26, 0, 34, 52) + `<path d="M-30,-26 l-3,-8 M-22,-27 l0,-9 M-14,-26 l3,-8" stroke="#2a2a2a" stroke-width="2.4"/>` + ciDot(-22, 14, 4, MIC.plas),
    () => ciCaps(-20, 0, 34, 52) + ciCaps(20, 0, 34, 52) + `<rect x="-4" y="-5" width="8" height="10" fill="#ffe680" stroke="#8fdc6a" stroke-width="2"/>`,
    () => ciCaps(-20, 0, 34, 52) + ciCaps(20, 0, 34, 52) + `<ellipse cx="-20" cy="-6" rx="9" ry="8" fill="none" stroke="${MIC.donor}" stroke-width="2.4"/>` + ciDot(-20, 2, 3.5, MIC.plas) + ciArrow(-20, 16, -20, 6, MIC.plas),
    () => ciCaps(-20, 0, 34, 52) + ciCaps(20, 0, 34, 52) + `<rect x="-4" y="-5" width="8" height="10" fill="#ffe680"/>` + ciDot(0, 0, 3.5, MIC.plas) + ciArrow(-14, 0, 12, 0, MIC.plas),
    () => ciCaps(-20, 0, 34, 52) + ciCaps(20, 0, 34, 52) + `<ellipse cx="20" cy="-6" rx="9" ry="8" fill="none" stroke="${MIC.recip}" stroke-width="2.4"/><path d="M13,4 q7,6 14,0" stroke="${MIC.plas}" stroke-width="3" fill="none"/>`
  ],
  prPCD: [
    () => ciPair(0.32) + `<rect x="-3" y="-12" width="6" height="22" fill="#e6f8ff" stroke="#8fd0e8"/>`,
    () => ciPair(0.32) + [-1, 1].map(sg => [0, 1, 2, 3].map(j => ciDot(sg * 9 + (j % 2) * 4 * sg, 4 + j * 5, 1.8, sg < 0 ? PR_CA[0] : PR_CB2[0])).join('')).join(''),
    () => ciPair(0.32) + [-1, 1].map(sg => ciDot(sg * 9, 2, 3, sg < 0 ? PR_CA[0] : PR_CB2[0]) + ciDot(sg * 6, 10, 2, sg < 0 ? PR_CA[0] : PR_CB2[0])).join(''),
    () => ciPair(0.32) + ciArrow(-12, -2, 10, -2, '#1d3b55') + ciArrow(12, 8, -10, 8, '#1d3b55'),
    () => ciPair(0.32) + [-1, 1].map(sg => ciDot(sg * 10, 4, 4.5, PR_CF[0])).join(''),
    () => ciPara(-22, 0, 0.32, false) + ciPara(22, 0, 0.32, true) + ciDot(-22, 4, 4, PR_CF[0]) + ciDot(22, 4, 4, PR_CF[0]),
    () => [-36, -24, -12, 0, 12, 24, 36].concat([48]).map((x, i) => ciPara(x - 6, (i % 2) * 6 - 3, 0.16, i % 2)).join('')
  ],
  prPSD: [
    () => ciPair(0.32) + `<rect x="-3" y="-12" width="6" height="22" fill="#e6f8ff" stroke="#8fd0e8"/>`,
    () => ciPair(0.32) + [-1, 1].map(sg => [0, 1, 2, 3].map(j => ciDot(sg * 9 + (j % 2) * 4 * sg, 4 + j * 5, 1.8, sg < 0 ? PR_CA[0] : PR_CB2[0])).join('')).join(''),
    () => ciPair(0.32) + [-1, 1].map(sg => ciDot(sg * 9, 2, 3, sg < 0 ? PR_CA[0] : PR_CB2[0]) + ciDot(sg * 6, 10, 2, sg < 0 ? PR_CA[0] : PR_CB2[0])).join(''),
    () => ciPair(0.32) + [-1, 1].map(sg => ciDot(sg * 10, 4, 4.5, sg < 0 ? PR_CA[0] : PR_CB2[0])).join(''),
    () => ciPara(-22, 0, 0.32, false) + ciPara(22, 0, 0.32, true) + ciDot(-22, 4, 4, PR_CA[0]) + ciDot(22, 4, 4, PR_CB2[0]),
    () => [-36, -24, -12, 0, 12, 24, 36, 48].map((x, i) => ciPara(x - 6, (i % 2) * 6 - 3, 0.16, i % 2)).join('')
  ],
  plvMossD: [
    () => cycG(0.5, ciLeafy(-22, 60, 90, 0.7, 31) + ciLeafy(22, 60, 90, 0.7, 7) + cycG(0.5, plCup(-44, -60, '#5fc04a', PL.leafL)) + cycG(0.5, plCup(44, -60, '#efc35a', '#ffe7a8'))),
    () => `<path d="M-30,10 Q0,-26 30,10" fill="none" stroke="${PL.water}" stroke-width="2.4" stroke-dasharray="4 3"/>` + [-18, -6, 6, 18].map((x, i) => ciDot(x, -6 - Math.abs(x) * -0.4 - 8, 2.6, '#3a7ad8')).join(''),
    () => plFlask(0, 6, 1.6, '#3f9a3e', PL.leafL) + plBall(0, 8, 7, 'plGDi', 1.2),
    () => cycG(0.42, ciLeafy(0, 70, 80, 0.7, 5)) + `<path d="M0,-4 Q-4,-24 4,-34" stroke="#a782d8" stroke-width="2.4" fill="none"/><ellipse cx="7" cy="-36" rx="9" ry="4.5" fill="url(#plGDi)" stroke="${PL.diL}"/>`,
    () => `<ellipse cx="-8" cy="-10" rx="12" ry="6" fill="url(#plGDi)" stroke="${PL.diL}" transform="rotate(-25 -8 -10)"/>` + [[8, -18], [18, -8], [14, 6], [26, -2], [4, 4], [24, 14]].map(([x, y]) => ciDot(x, y, 2.6, '#d8b040')).join(''),
    () => cycG(0.9, plProto(0, 6, 0.8, 5))
  ],
  plvFernD: [
    () => cycG(0.42, plFrond([0, 70], [-20, 10], [-6, -60], 1, 4, true).leaf + plFrond([4, 70], [40, 10], [34, -50], 0.9, 6, true).leaf),
    () => cycG(0.42, plFrond([-30, 70], [-40, 10], [-30, -60], 1, 4, true).leaf) + [[6, -14], [16, -6], [12, 6], [24, -2], [22, 12], [32, 4]].map(([x, y]) => ciDot(x, y, 2.4, '#c89040')).join(''),
    () => `<path d="${plHeart(0, 4, 0.42)}" fill="url(#plGLeaf)" stroke="${PL.leafL}" stroke-width="1.5"/>`,
    () => `<path d="${plHeart(0, 4, 0.42)}" fill="url(#plGLeaf)" stroke="${PL.leafL}" stroke-width="1.5"/>` + plFlask(-6, -2, 0.8, '#3f9a3e', PL.leafL) + [[10, 8], [16, 2], [20, -6]].map(([x, y]) => ciDot(x, y, 2.2, '#3a7ad8')).join(''),
    () => `<path d="${plHeart(0, 14, 0.36)}" fill="url(#plGLeaf)" stroke="${PL.leafL}" stroke-width="1.5"/>` + cycG(0.3, plFrond([0, 40], [-10, -20], [-4, -90], 1, 9, false).leaf)
  ],
  flVPollenD: [
    () => `<path d="M0,-6 C20,-30 52,-22 48,0 C52,22 20,30 0,6 C-20,30 -52,22 -48,0 C-52,-22 -20,-30 0,-6Z" fill="#6fb85e" stroke="#d4f5c0" stroke-width="1.6"/>` + [[-26, -10], [-26, 10], [26, -10], [26, 10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="#2f6b3a" stroke="#b8e8a8"/>` + ciDot(x - 3, y, 2, '#d64a3a') + ciDot(x + 3, y - 2, 2, '#d64a3a')).join('') + `<circle cx="0" cy="0" r="7" fill="#3d7f9e" stroke="#cfe8f5"/>`,
    () => `<ellipse cx="0" cy="0" rx="40" ry="30" fill="#2f6b3a" stroke="#b8e8a8" stroke-width="2"/>` + [[-18, -8], [0, -12], [18, -8], [-10, 10], [10, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${FLC.mother}" stroke="#ffc0b0"/><circle cx="${x}" cy="${y}" r="3" fill="#6a1a1a"/>`).join(''),
    () => [[-8, -8], [8, -8], [-8, 8], [8, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${FLC.mega}" stroke="${FLC.megaL}"/><circle cx="${x}" cy="${y}" r="2.4" fill="#5a2a0a"/>`).join(''),
    () => [[-20, -14], [20, -14], [-20, 14], [20, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${FLC.mega}" stroke="${FLC.megaL}"/><circle cx="${x}" cy="${y}" r="2.4" fill="#5a2a0a"/>`).join(''),
    () => `<circle cx="0" cy="0" r="22" fill="${FLC.pollen}" stroke="#c9801a" stroke-width="3"/><line x1="-14" y1="4" x2="-2" y2="4" stroke="#d0302a" stroke-width="3.5" stroke-linecap="round"/><circle cx="8" cy="-6" r="4.5" fill="#e3237a"/>`,
    () => `<ellipse cx="-20" cy="6" rx="22" ry="15" fill="#6fb85e" stroke="#d4f5c0"/><ellipse cx="20" cy="6" rx="22" ry="15" fill="#6fb85e" stroke="#d4f5c0"/><ellipse cx="-20" cy="7" rx="15" ry="9" fill="#1f4a2a"/><ellipse cx="20" cy="7" rx="15" ry="9" fill="#1f4a2a"/>` +
      [[-40, -10], [-34, -20], [-46, -22], [40, -10], [34, -20], [46, -22]].map(([x, y]) => ciDot(x, y, 2.6, '#ffd35a')).join('')
  ],
  sdsFTD: [
    () => `<path d="M0,30 L0,10" stroke="#4f9a3a" stroke-width="3"/>` + [-0.6, -2.5].map(a => `<ellipse cx="${n2(Math.cos(a) * 16)}" cy="${n2(8 + Math.sin(a) * 16)}" rx="14" ry="6" transform="rotate(${n2(a * 57.3)} ${n2(Math.cos(a) * 16)} ${n2(8 + Math.sin(a) * 16)})" fill="#f59ab0"/>`).join('') + `<ellipse cx="0" cy="2" rx="7" ry="9" fill="#9ae07a" stroke="#e6ffcc"/><line x1="0" y1="-7" x2="0" y2="-22" stroke="#7fcf5f" stroke-width="2.4"/><circle cx="0" cy="-24" r="3.5" fill="#c8f0a0"/>`,
    () => `<circle cx="0" cy="4" r="24" fill="#f5a742" stroke="#ffd59a" stroke-width="2"/><path d="M0,-20 q4,-8 12,-10" stroke="#6a4a2a" stroke-width="2.4" fill="none"/>`,
    () => `<path d="M0,30 L0,14" stroke="#4f9a3a" stroke-width="3"/><path d="M-22,14 Q0,-16 22,14Z" fill="#9bd26b" stroke="#e0ffc0"/>` + [[-12, 6], [-4, -2], [4, -2], [12, 6], [0, 8], [-8, 10], [8, 10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4" fill="#5fbf45" stroke="#e6ffcc" stroke-width=".8"/>`).join(''),
    () => Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, rr = Math.sqrt(i / 14) * 20; return `<circle cx="${n2(Math.cos(a) * rr * 0.9)}" cy="${n2(4 + Math.sin(a) * rr)}" r="6" fill="#3a1d4a" stroke="#6a3a80"/>`; }).join(''),
    () => `<line x1="0" y1="30" x2="0" y2="-28" stroke="#4f9a3a" stroke-width="3"/>` + [[-12, -20], [12, -12], [-12, -2], [12, 6], [-12, 14], [0, -28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#c07ad8" stroke="#f0d0ff"/><circle cx="${x}" cy="${y}" r="2" fill="#ffd166"/>`).join(''),
    () => `<ellipse cx="0" cy="8" rx="18" ry="24" fill="#e6a93a" stroke="#ffd28a" stroke-width="2"/><path d="M-12,-6 L12,22 M12,-6 L-12,22 M-16,8 L16,8" stroke="#a8701a" stroke-width="1.2"/>` + [-12, -4, 4, 12].map(d => `<path d="M0,-14 Q${d * 0.6},-24 ${d},-32" stroke="#4f9a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('')
  ],
  cyvHermD: [
    () => cycG(1, hmEarthworm(Array.from({ length: 5 }, (_, i) => [-44 + i * 22, 4 + Math.sin(i) * 3]), 9, { gid: CI_G++ })) + ciDot(10, 2, 3, '#7fb2ff') + ciDot(16, 4, 3, '#7fb2ff') + ciDot(2, 3, 3.2, '#ff9ec7'),
    () => cycG(0.42, hmHydra(-70, -10, 1)) + cycG(0.4, hmCrab(0, 0, 1)) + cycG(0.4, hmFish(90, 0, 1)),
    () => cycG(1, hmEarthworm(Array.from({ length: 5 }, (_, i) => [-44 + i * 22, -8]), 7, { gid: CI_G++ }) + hmEarthworm(Array.from({ length: 5 }, (_, i) => [44 - i * 22, 10]), 7, { gid: CI_G++ })) + ciArrow(-4, -4, 4, 6, '#7fb2ff') + ciArrow(6, 6, -2, -4, '#7fb2ff'),
    () => `<rect x="-40" y="-14" width="40" height="10" rx="5" fill="#7fb2ff"/><rect x="2" y="2" width="40" height="10" rx="5" fill="#ff9ec7"/><line x1="-44" y1="18" x2="44" y2="18" stroke="#d8d0e8" stroke-width="2"/><path d="M44,18 l-6,-4 l0,8Z" fill="#d8d0e8"/>`,
    () => { const t = hmTapeworm(0, 0, 10, 3); return cycG(0.36, t.svg, -t.end * 0.18, 0); }
  ]
};

function cycView(v){
  const D = CYC[v], ST = D.st(), n = ST.length, C = [575, 352], R = 238, NR = 60;
  const ang = i => (-90 + i * 360 / n) * Math.PI / 180, P = i => [C[0] + Math.cos(ang(i)) * R, C[1] + Math.sin(ang(i)) * R];
  /* أسهم على محيط الدائرة بين العقد */
  const arc = (i, j) => { const a0 = ang(i) + NR / R * 1.15, a1 = (j > i ? ang(j) : ang(j) + 2 * Math.PI) - NR / R * 1.15, pts = [];
    for (let k = 0; k <= 20; k++){ const a = a0 + (a1 - a0) * k / 20; pts.push([C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R]); }
    const e = pts[20], p = pts[18], an = Math.atan2(e[1] - p[1], e[0] - p[0]), h = 12;
    return `<g class="cycArc" data-to="${j}"><path d="${pts.map((q, k) => (k ? 'L' : 'M') + n2(q[0]) + ',' + n2(q[1])).join(' ')}" fill="none" stroke="#e8e0d0" stroke-width="4" stroke-linecap="round" stroke-dasharray="12 7"/>
      <path d="M${n2(e[0])},${n2(e[1])} L${n2(e[0] - h * Math.cos(an - 0.45))},${n2(e[1] - h * Math.sin(an - 0.45))} L${n2(e[0] - h * Math.cos(an + 0.45))},${n2(e[1] - h * Math.sin(an + 0.45))}Z" fill="#e8e0d0"/></g>`; };
  let arcs = ''; for (let i = 0; i < n - 1; i++) arcs += arc(i, i + 1); if (D.loop) arcs += arc(n - 1, 0);
  /* العقد */
  const IC = CYC_ICON[v] || [];
  const nodes = ST.map((s, i) => { const [x, y] = P(i), L = wrapName(cycShort(s), 15).slice(0, 2), ic = IC[i] ? IC[i]() : '';
    return `<g class="cycNode" data-i="${i}" data-x="${n2(x)}" data-y="${n2(y)}"><circle class="cycRip" cx="${n2(x)}" cy="${n2(y)}" r="${NR}" fill="none" stroke="${D.col}" stroke-width="3" opacity="0" pointer-events="none"/>${part(D.ids[i], `<circle cx="${n2(x)}" cy="${n2(y)}" r="${NR}" fill="${D.col}" fill-opacity=".28" stroke="${D.col}" stroke-width="3"/>
      <g transform="translate(${n2(x)},${n2(y - 12)}) scale(.95)">${ic}</g>
      <text class="cap sm" x="${n2(x)}" y="${n2(y + 34)}" text-anchor="middle" font-size="11">${L.map((l, k) => `<tspan x="${n2(x)}" dy="${k ? 12 : 0}">${l}</tspan>`).join('')}</text>`)}
      <circle cx="${n2(x + NR * 0.72)}" cy="${n2(y - NR * 0.72)}" r="14" fill="#ffd98a" stroke="#5a4a3a" stroke-width="2"/><text x="${n2(x + NR * 0.72)}" y="${n2(y - NR * 0.72 + 5)}" text-anchor="middle" font-size="15" font-weight="800" fill="#2a1a10">${i + 1}</text></g>`; }).join('');
  const start = D.loop ? '' : (() => { const [x, y] = P(0), [x2, y2] = P(n - 1); return `<text class="cap sm" x="${n2(x)}" y="${n2(y - NR - 12)}" text-anchor="middle" fill="#9fe08a">البداية</text><text class="cap sm" x="${n2(x2)}" y="${n2(y2 - NR - 12)}" text-anchor="middle" fill="#ffb0a0">النهاية</text>`; })();
  const body = `${D.tab === 'plants1' ? plDefs() : ''}<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="40"/>${arcs}${nodes}${start}
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
    tools: [{ id: 'cycBack', label: '▶ عرض العملية' }].concat(ctl.tools),
    init(){ ctl.start(); cycKeep(); },
    onSlider: x => ctl.onSlider(x), onTool: id => { if (id === 'cycBack') cycSwitch(v.slice(0, -1)); else ctl.onTool(id); },
    tick(dt, t, a){
      ctl.tick(dt); const s = STG.idx, k = STG.k;
      a.all('.cycNode').forEach(g => { const i = +g.dataset.i, on = i === s, c = g.querySelector('[data-part] circle'), x = +g.dataset.x, y = +g.dataset.y;
        const sc = on ? 1 + 0.08 * Math.sin(t * 5) + 0.12 * Math.max(0, 1 - k * 4) : 1; g.setAttribute('transform', `translate(${x},${y}) scale(${n2(sc)}) translate(${-x},${-y})`);
        const rp = g.querySelector('.cycRip'); if (rp){ const q = (t * 0.8) % 1; rp.setAttribute('r', n2(NR + q * 26)); rp.setAttribute('opacity', on ? n2(0.8 * (1 - q)) : 0); }
        g.setAttribute('opacity', i <= s ? 1 : 0.62); c.setAttribute('fill-opacity', on ? '.6' : '.28'); c.setAttribute('stroke-width', on ? 5 : 3);
        c.style.filter = on ? `drop-shadow(0 0 ${n2(5 + 4 * Math.sin(t * 4))}px ${D.col})` : ''; });
      a.all('.cycArc').forEach(g => { const to = +g.dataset.to, on = to === s, done = D.loop ? true : to <= s; g.setAttribute('opacity', done || on ? 1 : 0.35);
        g.querySelectorAll('path').forEach(p => { if (p.getAttribute('fill') === 'none'){ p.setAttribute('stroke', on ? '#ffd98a' : '#e8e0d0'); p.setAttribute('stroke-dashoffset', n2(-(t * (on ? 60 : 25)) % 19)); } else p.setAttribute('fill', on ? '#ffd98a' : '#e8e0d0'); }); });
      if (s !== shown){ shown = s; const T = a.el('#cycT'), Dd = a.el('#cycD');
        if (T) T.innerHTML = wrapName(ST[s].n, 30).slice(0, 2).map((l, i) => `<tspan x="${C[0]}" dy="${i ? 16 : 0}">${l}</tspan>`).join(''); if (Dd) Dd.innerHTML = wrapName(ST[s].d, 34).slice(0, 6).map((l, i) => `<tspan x="${C[0]}" dy="${i ? 17 : 0}">${l}</tspan>`).join(''); }
      /* علامة تتحرك من العقدة السابقة إلى الحالية */
      const tk = a.el('#cycTok'); if (tk){ if (s === 0 && !D.loop){ tk.setAttribute('opacity', 0); } else { const i0 = (s - 1 + n) % n, a0 = ang(i0), a1 = s > i0 ? ang(s) : ang(s) + 2 * Math.PI, q = Math.min(1, k * 1.6), aa = a0 + (a1 - a0) * q;
        tk.setAttribute('opacity', q < 1 ? 1 : 0); tk.setAttribute('transform', `translate(${n2(C[0] + Math.cos(aa) * R)},${n2(C[1] + Math.sin(aa) * R)})`); } }
    }
  };
}
/* التبديل بين العملية ومخططها مع البقاء على الخطوة نفسها */
let CYC_T = null;
function cycSwitch(id){ CYC_T = STG.T; const b = document.querySelector(`#sceneTools [data-tool="${id}"]`); if (b) b.click(); }
function cycKeep(){ if (CYC_T === null) return; STG.T = CYC_T; CYC_T = null; if (api.setSlider) api.setSlider(STG.T); }
/* إضافة زر «مخطط …» بجانب زر عمليته في كل تبويب، وتغليف البناء والمجسّم */
Object.keys(CYC).forEach(v => { const D = CYC[v], [VIEWS] = CYC_TABS[D.tab]; if (VIEWS.some(x => x.id === v)) return; const bi = VIEWS.findIndex(x => x.id === v.slice(0, -1)); VIEWS.splice(bi < 0 ? VIEWS.length : bi + 1, 0, { id: v, label: D.label }); });
Object.keys(CYC_TABS).forEach(tab => {
  const sc = SCENES[tab], [VIEWS, radio] = CYC_TABS[tab], ob = sc.build, om = sc.model3d;
  const sd = Object.getOwnPropertyDescriptor(sc, 'src');
  Object.defineProperty(sc, 'src', { configurable: true, get(){ const v = SEL[radio]; return CYC[v] && CYC[v].tab === tab ? CYC[v].src : (sd.get ? sd.get.call(sc) : sd.value); } });
  sc.build = function(){ const v = SEL[radio]; if (!CYC[v] || CYC[v].tab !== tab){ const r = ob.call(this); if (CYC[v + 'D'] && CYC[v + 'D'].tab === tab){
      r.tools = (r.tools || []).slice(); const at = r.tools.findIndex(x => x.id === 'stPrev'); r.tools.splice(at < 0 ? r.tools.length : at, 0, { id: 'cycGo', label: '↻ عرض المخطط' });
      const ot = r.onTool, oi = r.init; r.onTool = id => { if (id === 'cycGo') cycSwitch(v + 'D'); else if (ot) ot(id); }; r.init = function(){ if (oi) oi.call(this); cycKeep(); }; }
    return r; }
    const s = cycView(v); s.rebuildOnRadio = radio; s.tools = VIEWS.map(x => ({ id: x.id, label: x.label, radio, on: x.id === v })).concat(s.tools || []); return s; };
  sc.model3d = () => { const v = SEL[radio]; return CYC[v] && CYC[v].tab === tab ? 'cyc_' + v : om(); };
});
Object.assign(CH.toolIcons, Object.fromEntries(Object.keys(CYC).map(v => [v, 'route'])), { cycGo: 'route', cycBack: 'play' });
