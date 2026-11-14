/* ══════════════════════════════════════════════════════════════════════════
   9 · مخططات دائرية (مثل دورة كريبس في الفصل الأول) لكل موضوع بخطوات:
       الخطوات حول دائرة بأسهم ودوائر مرقّمة، والخطوة الحالية تتوهج وشرحها في
       الوسط. زر «مخطط …» يضاف لتبويب كل موضوع وتبقى الشاشة الأصلية كما هي.
       الأجزاء: كل دائرة جزء بمعلوماته من الملزمة.
   ══════════════════════════════════════════════════════════════════════════ */
/* كل مخطط: محطات بالترتيب؛ كل محطة = الشيء نفسه (تركيب أو خلية) باسمه ورسمه.
   [الاسم، خطوات العملية التي تقابلها، اسم العملية على السهم الداخل إليها، جزء السهم، جزء المحطة] */
const CYC = {
  ispermD:   { src: 'ملزمة ص6–10', tab: 'intro', label: 'مخطط النطف ↻', title: 'تكوين النطف', st: () => SPERM_STAGES, col: '#b07ad8', nodes: [
    ['النبيبات المنوية', [0, 1], '', '', 'semTubX'],
    ['سليفات النطف (2س)', 2, 'انقسامات غير مباشرة', '', 'spGonium'],
    ['الخلية النطفية الأولية (2س)', 3, 'نمو', '', 'spPrim'],
    ['الخلايا النطفية الثانوية (س)', 4, 'انقسام اختزالي أول', 'meio1', 'spSec'],
    ['أرومات النطف (س)', 5, 'انقسام اختزالي ثانٍ', 'meio2', 'spTid'],
    ['النطف الناضجة (س)', 6, 'التحول النطفي', 'spermio', 'spermM']] },
  ieggD:     { src: 'ملزمة ص7–11', tab: 'intro', label: 'مخطط البيوض ↻', title: 'تكوين البيوض', st: () => EGG_STAGES, col: '#e98a8a', nodes: [
    ['المبيض وخلاياه الجرثومية', 0, '', '', 'ovary'],
    ['سليفات البيوض (2س)', 1, 'انقسامات غير مباشرة', '', 'ooGonium'],
    ['الخلية البيضية الأولية (2س) في الحويصلة', 2, 'نمو', '', 'ooPrim'],
    ['الخلية البيضية الثانوية (س) + جسم قطبي أول', 3, 'انقسام اختزالي أول', 'oMeio1', 'ooSec'],
    ['حويصلة كراف: التحرر', 4, 'نضج الحويصلة', '', 'graaf'],
    ['أرومة البيضة (س) + أجسام قطبية', 5, 'انقسام اختزالي ثانٍ', 'oMeio2', 'ootid'],
    ['البيضة الناضجة (س)', 6, 'نمو أرومة البيضة', '', 'ovumM']] },
  bconjD:    { src: 'ملزمة ص19–22', tab: 'prok', label: 'مخطط الاقتران ↻', title: 'الاقتران وإعادة الخلط في البكتيريا', st: () => CONJ_STAGES, col: '#8fdc6a', nodes: [
    ['الخلية المعطية والمستلمة', 0, '', '', 'cDonor'],
    ['جسر الاقتران', 1, 'تلامس هلب الاقتران', '', 'cBridge'],
    ['عامل الخصوبة داخل الكروموسوم', 2, 'انغراز عامل الخصوبة', '', 'cFert'],
    ['انتقال جزء من الكروموسوم', 3, 'انكسار أحد الشريطين', '', 'cChrom'],
    ['سلالة جديدة (إعادة الخلط)', 4, 'تحل القطعة محل جزء مساوٍ', '', 'cRecomb']] },
  prPCD:     { src: 'ملزمة ص32–35', tab: 'protist', label: 'مخطط الاقتران ↻', title: 'الاقتران في البراميسيوم', st: () => PR_CONJ_ST, col: '#5fb6d8', nodes: [
    ['فردان مقترنان وجسر بروتوبلازمي', 0, '', '', 'prProtoBr'],
    ['أربع نوى صغيرة (س) في كل فرد', 1, 'انقسام اختزالي', '', 'prMeioMic'],
    ['نواتان أوليتان: ذكرية وأنثوية (س)', 2, 'تنحل ثلاث وانقسام غير متساوٍ', '', 'prUneq'],
    ['تبادل الأنوية الذكرية', 3, 'تبادل', '', 'prExch'],
    ['النواة المندمجة المتباينة (2س)', 4, 'اتحاد الأنوية', '', 'prFusHet'],
    ['فردان منفصلان', 5, 'انفصال', '', 'prSep'],
    ['8 براميسيومات بنوية', 6, 'انقسامان اعتياديان لكل فرد', '', 'prEight']] },
  prPSD:     { src: 'ملزمة ص33–35', tab: 'protist', label: 'مخطط الإخصاب الذاتي ↻', title: 'الإخصاب الذاتي في البراميسيوم', st: () => PR_SELF_ST, col: '#7aa8e8', nodes: [
    ['فردان مقترنان وجسر بروتوبلازمي', 0, '', '', 'prProtoBr'],
    ['أربع نوى صغيرة (س) في كل فرد', 1, 'انقسام اختزالي', '', 'prMeioMic'],
    ['نواتان أوليتان: ذكرية وأنثوية (س)', 2, 'تنحل ثلاث وانقسام غير متساوٍ', '', 'prUneq'],
    ['النواة المندمجة المتماثلة (2س)', 3, 'اتحاد في الفرد نفسه', '', 'prFusHom'],
    ['فردان منفصلان', 4, 'انفصال', '', 'prSep'],
    ['8 براميسيومات بنوية', 5, 'انقسامان اعتياديان لكل فرد', '', 'prEight']] },
  agAltD:    { src: 'ملزمة ص42–45', tab: 'altgen', label: 'مخطط تعاقب الأجيال ↻', title: 'تعاقب الأجيال', st: () => PL_ALT_ST, col: '#b48cff', loop: true, nodes: [
    ['الطور البوغي (2س)', 0, 'انقسام خيطي', 'plMito', 'plSporo'],
    ['الحافظة البوغية (2س)', 1, 'يكوّن الحافظات البوغية', '', 'plSporang'],
    ['الأبواغ (س)', [2, 3], 'انقسام اختزالي', 'plMeio', 'plSpore'],
    ['الطور المشيجي (س)', 4, 'انقسام خيطي', 'plMito', 'plGameto'],
    ['الأمشاج الذكرية والأنثوية (س)', 5, 'انقسام خيطي', 'plMito', 'plGametes'],
    ['الزيجة (2س)', [6, 7], 'إخصاب', 'plFert', 'plZyg']] },
  plvMossD:  { src: 'ملزمة ص45–47', tab: 'plants1', label: 'مخطط الحزاز ↻', title: 'دورة حياة البوليتراكم', st: () => PL_MOSS_ST, col: '#62c94a', loop: true, nodes: [
    ['النبات المشيجي (س): أنثريديا وأركيكونيا', 0, 'تتحول إلى نباتات مشيجية', 'plGameto', 'plMMature'],
    ['الأمشاج الذكرية السابحة', 1, 'تخرج في الماء', '', 'plMSperm'],
    ['الزيجة (2س)', 2, 'إخصاب', 'plFert', 'plMZyg'],
    ['الطور البوغي (2س): حامل وحافظة', 3, 'نمو داخل الأركيكونيوم', '', 'plMSeta'],
    ['الأبواغ (س)', 4, 'انقسام اختزالي وتحرر', 'plMeio', 'plMSpores'],
    ['الخيوط الأولية (س)', 5, 'إنبات الأبواغ', '', 'plMProto']] },
  plvFernD:  { src: 'ملزمة ص48–50', tab: 'plants1', label: 'مخطط السرخس ↻', title: 'دورة حياة السرخس', st: () => PL_FERN_ST, col: '#4fae4a', loop: true, nodes: [
    ['النبات البوغي السائد (2س)', 0, 'نمو الطور البوغي', '', 'plFern'],
    ['الأبواغ (س)', 1, 'انقسام اختزالي', 'plMeio', 'plFSpores'],
    ['الثالوس الأولي (س)', 2, 'إنبات الأبواغ', 'plFGerm', 'plProth'],
    ['النطف تسبح إلى البيضة', 3, 'بوجود الرطوبة', '', 'plFSperm'],
    ['الزايكوت والطور البوغي الفتي (2س)', 4, 'إخصاب', 'plFert', 'plFYoung']] },
  flVPollenD:{ src: 'ملزمة ص59–61', tab: 'flower', label: 'مخطط حبة اللقاح ↻', title: 'تكوين حبة اللقاح', st: () => FL_POLLEN_STAGES, col: '#f2b33a', nodes: [
    ['المتك (مقطع عرضي)', 0, '', '', 'flAnther'],
    ['الخلايا الأم للأبواغ الصغيرة (2س)', 1, 'في كيس اللقاح', '', 'flMicroMother'],
    ['أربعة أبواغ صغيرة (س)', 2, 'انقسام اختزالي', '', 'flMicrospores'],
    ['الأبواغ الصغيرة المنفصلة', 3, 'انفصال', '', 'flMicrospores'],
    ['حبة اللقاح: خلية أنبوبية + مولدة', 4, 'انقسام اعتيادي للنواة', '', 'flPollen'],
    ['المتك الناضج المتفتح', 5, 'نضج المتك', '', 'flSlit']] },
  sdsFTD:    { src: 'ملزمة ص82 وص86', tab: 'sdSeedFruit', label: 'مخطط الثمار ↻', title: 'تكوّن أنواع الثمار', st: () => SD_FT_ST, col: '#f59a50', nodes: [
    ['زهرة واحدة بكربلة واحدة', 0, '', '', 'sdFlw1'],
    ['ثمرة بسيطة (المشمش)', 1, 'ينمو المبيض', '', 'sdSimple'],
    ['زهرة واحدة بكربلات عديدة', 2, 'النوع الثاني', '', 'sdFlwN'],
    ['ثمرة متجمعة (التوت الأسود)', 3, 'تنمو كل كربلة', '', 'sdAggr'],
    ['أزهار عديدة متجمعة', 4, 'النوع الثالث', '', 'sdFlwM'],
    ['ثمرة مركبة (الأناناس)', 5, 'من كل زهرة ثمرة', '', 'sdMulti']] },
  cyvHermD:  { src: 'ملزمة ص125', tab: 'cycle', label: 'مخطط الخنثي ↻', title: 'التكاثر الخنثي', st: () => HU_HERM_ST, col: '#e08a86', nodes: [
    ['دودة الأرض الخنثى', 0, '', '', 'huHerm'],
    ['أمثلة: هايدرا وقشريات وأسماك', 1, 'أمثلة أخرى', '', 'huHydra'],
    ['تبادل الخلايا التناسلية', 2, 'تحاشي الإخصاب الذاتي (1)', '', 'huSpEx'],
    ['نضج البيوض والنطف بأوقات متباينة', 3, 'تحاشي الإخصاب الذاتي (2)', '', 'huTimeMat'],
    ['الدودة الشريطية: إخصاب ذاتي', 4, 'استثناء', '', 'huTapeworm']] }
};
/* محطات المخطط كمراحل: الاسم والشرح (شرح خطوات العملية المقابلة من الملزمة) */
Object.keys(CYC).forEach(v => { const D = CYC[v];
  D.N = D.nodes.map(([n, f, via, vid, id]) => ({ n, from: [].concat(f), via, vid, id }));
  D.ids = D.N.map(x => x.id);
  D.stages = () => { const ST = D.st(); return D.N.map((x, i) => ({ n: (i + 1) + ' · ' + x.n, d: x.from.map(j => ST[j].d).join(' ') })); }; });
/* تبويب تعاقب الأجيال ليس له أزرار شاشات: نضيف زر الشكل وزر مخططه */
const AG_VIEWS = [{ id: 'agAlt', label: 'تعاقب الأجيال (شكل 3-11)' }];
CH.sel.agv = 'agAlt';
(() => { const ob = SCENES.altgen.build; SCENES.altgen.build = function(){ const r = ob.call(this); r.rebuildOnRadio = 'agv';
  r.tools = AG_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'agv', on: x.id === SEL.agv })).concat(r.tools || []); return r; }; })();
const CYC_TABS = { altgen: [AG_VIEWS, 'agv'], intro: [INT_VIEWS, 'intv'], prok: [PRK_VIEWS, 'prkv'], protist: [PR_VIEWS, 'prv'], plants1: [PL_VIEWS, 'plv'], flower: [FL_VIEWS, 'flv'], sdSeedFruit: [SD_VIEWS_S, 'sdsv'], cycle: [CY_VIEWS, 'cyv'] };
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
/* كروموسوم صغير: عصا ملونة بقطعة مركزية */
const ciChr = (x, y, L, c, rot) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${rot || 0})"><line x1="0" y1="${n2(-L / 2)}" x2="0" y2="${n2(L / 2)}" stroke="${c}" stroke-width="${n2(Math.max(2, L * 0.32))}" stroke-linecap="round"/><circle r="${n2(Math.max(1, L * 0.16))}" fill="#fff" opacity=".8"/></g>`;
/* خلية بنواة وكروموسومات: 'd' = ثنائية (2س: زوجان، أحمر من الأب وأزرق من الأم) و'h' = أحادية (س: واحد من كل زوج) */
const OOC = '#8f7ad8';
const ciNC = (x, y, r, pl, fill) => { const nr = r * 0.56, L = nr * 0.78;
  const ch = pl === 'd' ? [[-0.5, -0.1, 1, '#e5484d', -12], [-0.17, 0.05, 1, '#4a7dff', 10], [0.2, -0.05, 0.6, '#e5484d', -6], [0.48, 0.08, 0.6, '#4a7dff', 14]]
    : [[-0.28, 0, 1, '#e5484d', -10], [0.3, 0.04, 0.6, '#4a7dff', 12]];
  return `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="${fill || GAM.cell}" stroke="#fff4ff" stroke-width="${n2(Math.max(1.2, r * 0.08))}"/>` +
    `<circle cx="${n2(x - r * 0.3)}" cy="${n2(y - r * 0.42)}" r="${n2(r * 0.16)}" fill="#fff" opacity=".35"/>` +
    `<circle cx="${n2(x)}" cy="${n2(y + r * 0.05)}" r="${n2(nr)}" fill="#f4ecff" stroke="#4a2a7a" stroke-width="${n2(Math.max(0.8, r * 0.05))}"/>` +
    ch.map(([dx, dy, k, c, rot]) => ciChr(x + dx * nr * 1.2, y + r * 0.05 + dy * nr, L * k, c, rot)).join(''); };
/* حويصلة: طبقة خلايا حوصلية حول خلية بيضية (antrum = تجويف سائل) */
const ciFol = (x, y, R, antrum) => { let s = `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(R)}" fill="#f6c3b0" stroke="#fff4ec" stroke-width="1.6"/>`;
  const n = Math.round(R * 0.6); for (let i = 0; i < n; i++){ const a = i * 6.2832 / n; s += `<circle cx="${n2(x + Math.cos(a) * R * 0.85)}" cy="${n2(y + Math.sin(a) * R * 0.85)}" r="${n2(R * 0.1)}" fill="#e9a58e"/>`; }
  if (antrum) s += `<circle cx="${n2(x + R * 0.1)}" cy="${n2(y - R * 0.1)}" r="${n2(R * antrum)}" fill="#cfe7ff" opacity=".9"/>`;
  return s; };
const ciCorona = (x, y, R) => Array.from({ length: 14 }, (_, i) => { const a = i * 6.2832 / 14; return `<circle cx="${n2(x + Math.cos(a) * R)}" cy="${n2(y + Math.sin(a) * R)}" r="${n2(Math.max(2, R * 0.13))}" fill="#f6c3b0" stroke="#e9a58e" stroke-width=".8"/>`; }).join('');
let CI_G = 200;
const CYC_ICON = {
  ispermD: [
    () => cycG(0.29, cycPlain(tubuleSvg())),
    () => `<path d="M-54,30 Q0,6 54,30 L54,40 Q0,16 -54,40Z" fill="#f3d6c0" stroke="#fff3ea" stroke-width="1.5"/>` + ciNC(-32, 4, 14, 'd') + ciNC(0, -4, 14, 'd') + ciNC(32, 4, 14, 'd'),
    () => ciNC(0, 0, 32, 'd'),
    () => ciNC(-25, 0, 22, 'h') + ciNC(25, 0, 22, 'h'),
    () => [-40, -13.5, 13.5, 40].map(x => ciNC(x, 0, 12.5, 'h', GAM.cellL)).join(''),
    () => cycPlain([-33, -11, 11, 33].map((x, i) => spermSvg(x, -22, 0.62, Math.PI / 2, '', i)).join(''))
  ],
  ieggD: [
    () => cycG(0.3, cycPlain(ovarySvg())),
    () => ciNC(-26, 8, 15, 'd', OOC) + ciNC(0, -10, 15, 'd', OOC) + ciNC(26, 8, 15, 'd', OOC),
    () => ciFol(0, 0, 38) + ciNC(0, 0, 20, 'd', OOC),
    () => ciNC(10, 0, 27, 'h', OOC) + ciNC(-33, 18, 9, 'h', GAM.polar),
    () => ciFol(14, 6, 36, 0.55) + ciArrow(-14, -8, -28, -18) + ciCorona(-38, -22, 11) + ciNC(-38, -22, 9, 'h', OOC),
    () => ciNC(12, 0, 25, 'h', '#a98ae8') + [[-34, -18], [-38, 4], [-30, 25]].map(([x, y]) => ciNC(x, y, 8, 'h', GAM.polar)).join(''),
    () => ciCorona(6, 0, 30) + `<circle cx="6" cy="0" r="27" fill="none" stroke="#ffe08a" stroke-width="3"/>` + ciNC(6, 0, 22, 'h', '#a98ae8') +
      [[-40, -16], [-44, 4], [-38, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${GAM.polar}" opacity=".45" stroke="#fff" stroke-dasharray="2 2"/>`).join('')
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
  agAltD: [
    () => plCluster(0, 0, 38, 10.5, 'plGDi', 7),
    () => `<path d="M-2,44 Q0,30 2,22" stroke="${PL.diD}" stroke-width="5" fill="none"/><ellipse cx="2" cy="-2" rx="26" ry="30" fill="url(#plGDi)" stroke="${PL.diL}" stroke-width="2.4"/>` + [[-9, -16], [8, -14], [-11, 0], [10, 2], [0, -6], [-3, 13], [11, 15]].map(([dx, dy]) => `<circle cx="${2 + dx}" cy="${-2 + dy}" r="4.6" fill="#ffe0a8" stroke="${PL.haD}" stroke-width="1"/>`).join(''),
    () => [[-15, -13], [15, -13], [-15, 15], [15, 15]].map(([x, y]) => ciNC(x, y, 14, 'h', PL.ha)).join(''),
    () => plCluster(0, 0, 38, 10.5, 'plGHa', 11),
    () => ciNC(16, 2, 21, 'h', PL.ha) + ciNC(-26, -8, 12, 'h', '#ffd27a') + `<path d="M-38,-8 q-8,6 -14,0" stroke="#ffd27a" stroke-width="2.4" fill="none"/>`,
    () => ciNC(0, 0, 30, 'd', PL.zy)
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
    () => `<ellipse cx="0" cy="0" rx="50" ry="36" fill="#2f6b3a" stroke="#b8e8a8" stroke-width="2.4"/>` + [[-24, -10], [0, -14], [24, -10], [-12, 14], [12, 14]].map(([x, y]) => ciNC(x, y, 11.5, 'd', FLC.mother)).join(''),
    () => `<circle cx="0" cy="0" r="34" fill="none" stroke="#ffe0b0" stroke-width="1.6" stroke-dasharray="4 3"/>` + [[-13, -13], [13, -13], [-13, 13], [13, 13]].map(([x, y]) => ciNC(x, y, 13, 'h', FLC.mega)).join(''),
    () => [[-28, -16], [28, -16], [-28, 16], [28, 16]].map(([x, y]) => ciNC(x, y, 13, 'h', FLC.mega)).join('') + ciArrow(-8, -6, -16, -12) + ciArrow(8, 6, 16, 12) + ciArrow(8, -6, 16, -12) + ciArrow(-8, 6, -16, 12),
    () => Array.from({ length: 18 }, (_, i) => { const a = i * 6.2832 / 18; return `<line x1="${n2(Math.cos(a) * 30)}" y1="${n2(Math.sin(a) * 30)}" x2="${n2(Math.cos(a) * 37)}" y2="${n2(Math.sin(a) * 37)}" stroke="#c9801a" stroke-width="2.4" stroke-linecap="round"/>`; }).join('') + `<circle cx="0" cy="0" r="31" fill="${FLC.pollen}" stroke="#c9801a" stroke-width="3.5"/><path d="M-20,8 Q-8,-2 4,8" stroke="#d0302a" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="12" cy="-8" rx="9" ry="6" fill="#e3237a" stroke="#fff" stroke-width="1"/>`,
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

const CYC_SC = { ispermD: 1.12, ieggD: 1.1, flVPollenD: 1.12, prPCD: 1.5, prPSD: 1.5 };
function cycView(v){
  const D = CYC[v], ST = D.stages(), n = ST.length, C = [578, 350], R = 250, NR = 74;
  const ang = i => (-90 + i * 360 / n) * Math.PI / 180, P = i => [C[0] + Math.cos(ang(i)) * R, C[1] + Math.sin(ang(i)) * R];
  /* أسهم على محيط الدائرة بين المحطات، وعلى كل سهم اسم العملية التي تنقل للمحطة التالية */
  const arc = (i, j) => { const a0 = ang(i) + NR / R * 1.12, a1 = (j > i ? ang(j) : ang(j) + 2 * Math.PI) - NR / R * 1.12, pts = [];
    for (let k = 0; k <= 20; k++){ const a = a0 + (a1 - a0) * k / 20; pts.push([C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R]); }
    const e = pts[20], p = pts[18], an = Math.atan2(e[1] - p[1], e[0] - p[0]), h = 13;
    const via = D.N[j].via, am = (a0 + a1) / 2, lx = C[0] + Math.cos(am) * (R - 40), ly = C[1] + Math.sin(am) * (R - 40);
    const L = via ? wrapName(via, 13).slice(0, 3) : [], w = Math.max(...L.map(l => l.length), 1) * 6.4 + 16, hh = L.length * 14 + 8;
    const lab = via ? (() => { const inner = `<rect x="${n2(lx - w / 2)}" y="${n2(ly - hh / 2)}" width="${n2(w)}" height="${hh}" rx="8" fill="rgba(24,18,36,.92)" stroke="#ffd98a" stroke-width="1.3"/>` +
      `<text x="${n2(lx)}" y="${n2(ly - hh / 2 + 15)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffd98a">${L.map((l, k) => `<tspan x="${n2(lx)}" dy="${k ? 14 : 0}">${l}</tspan>`).join('')}</text>`;
      return `<g class="cycVia" data-to="${j}">${D.N[j].vid ? part(D.N[j].vid, inner) : `<g pointer-events="none">${inner}</g>`}</g>`; })() : '';
    return `<g class="cycArc" data-to="${j}"><path d="${pts.map((q, k) => (k ? 'L' : 'M') + n2(q[0]) + ',' + n2(q[1])).join(' ')}" fill="none" stroke="#e8e0d0" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="12 7"/>
      <path d="M${n2(e[0])},${n2(e[1])} L${n2(e[0] - h * Math.cos(an - 0.45))},${n2(e[1] - h * Math.sin(an - 0.45))} L${n2(e[0] - h * Math.cos(an + 0.45))},${n2(e[1] - h * Math.sin(an + 0.45))}Z" fill="#e8e0d0"/></g>${lab}`; };
  let arcs = ''; for (let i = 0; i < n - 1; i++) arcs += arc(i, i + 1); if (D.loop) arcs += arc(n - 1, 0);
  /* المحطات: رسم الشيء كبيراً، واسمه تحته على شريط */
  const IC = CYC_ICON[v] || [], K = CYC_SC[v] || 1.3;
  const nodes = D.N.map((nd, i) => { const [x, y] = P(i), L = wrapName(nd.n, 18).slice(0, 3), ic = IC[i] ? IC[i]() : '';
    const ty = y + NR - 22 - (L.length - 1) * 11, bw = Math.max(...L.map(l => l.length)) * 6.6 + 18, bh = L.length * 14 + 8;
    return `<g class="cycNode" data-i="${i}" data-x="${n2(x)}" data-y="${n2(y)}"><circle class="cycRip" cx="${n2(x)}" cy="${n2(y)}" r="${NR}" fill="none" stroke="${D.col}" stroke-width="3" opacity="0" pointer-events="none"/>${part(nd.id, `<circle cx="${n2(x)}" cy="${n2(y)}" r="${NR}" fill="#1c1626" fill-opacity=".92" stroke="${D.col}" stroke-width="3"/>
      <circle class="cycTint" cx="${n2(x)}" cy="${n2(y)}" r="${NR - 3}" fill="${D.col}" fill-opacity=".14"/>
      <clipPath id="cycCl${i}"><circle cx="${n2(x)}" cy="${n2(y)}" r="${NR - 4}"/></clipPath><g clip-path="url(#cycCl${i})"><g transform="translate(${n2(x)},${n2(y - 18 - (L.length - 2) * 6)}) scale(${K})">${ic}</g></g>
      <rect x="${n2(x - bw / 2)}" y="${n2(ty - 14)}" width="${n2(bw)}" height="${bh}" rx="9" fill="rgba(16,12,24,.9)" stroke="${D.col}" stroke-width="1.4"/>
      <text x="${n2(x)}" y="${n2(ty)}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff6e6">${L.map((l, k) => `<tspan x="${n2(x)}" dy="${k ? 14 : 0}">${l}</tspan>`).join('')}</text>`)}
      <circle cx="${n2(x + NR * 0.72)}" cy="${n2(y - NR * 0.72)}" r="14" fill="#ffd98a" stroke="#5a4a3a" stroke-width="2"/><text x="${n2(x + NR * 0.72)}" y="${n2(y - NR * 0.72 + 5)}" text-anchor="middle" font-size="15" font-weight="800" fill="#2a1a10" pointer-events="none">${i + 1}</text></g>`; }).join('');
  const start = D.loop ? '' : (() => { const [x, y] = P(0), [x2, y2] = P(n - 1); return `<text class="cap sm" x="${n2(x - NR - 34)}" y="${n2(y + 4)}" text-anchor="middle" fill="#9fe08a">البداية ◀</text><text class="cap sm" x="${n2(x2)}" y="${n2(y2 - NR - 10)}" text-anchor="middle" fill="#ffb0a0">النهاية</text>`; })();
  const body = `${D.tab === 'plants1' || D.tab === 'altgen' ? plDefs() : ''}<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="44"/>${arcs}${nodes}${start}
    <g pointer-events="none"><text class="cap" x="${C[0]}" y="${C[1] - 92}" text-anchor="middle" fill="#ffd98a">${D.title}</text>
    <rect x="${C[0] - 122}" y="${C[1] - 72}" width="244" height="168" rx="14" fill="rgba(20,16,32,.86)" stroke="${D.col}" stroke-width="1.6"/>
    <text id="cycT" class="cap sm" x="${C[0]}" y="${C[1] - 50}" text-anchor="middle" fill="#ffd98a"></text>
    <text id="cycD" class="cap sm" x="${C[0]}" y="${C[1] - 12}" text-anchor="middle"></text>
    <g id="cycTok" opacity="0"><circle r="11" fill="#fff" opacity=".25"/><circle r="6" fill="#ffd98a" stroke="#fff" stroke-width="2"/></g></g>`;
  const ctl = stageCtl(ST, { dur: n * 5 });
  let shown = -1;
  return {
    body, stages: ST, parts: [],
    tools: [{ id: 'cycBack', label: '▶ عرض العملية' }].concat(ctl.tools),
    init(){ ctl.start(); cycKeep(); },
    onSlider: x => ctl.onSlider(x), onTool: id => { if (id === 'cycBack') cycSwitch(v.slice(0, -1), (D.N[STG.idx].from[0] + Math.min(STG.k, 0.98)) / D.st().length); else ctl.onTool(id); },
    tick(dt, t, a){
      ctl.tick(dt); const s = STG.idx, k = STG.k;
      a.all('.cycNode').forEach(g => { const i = +g.dataset.i, on = i === s, c = g.querySelector('[data-part] circle'), tn = g.querySelector('.cycTint'), x = +g.dataset.x, y = +g.dataset.y;
        const sc = on ? 1.04 + 0.04 * Math.sin(t * 5) + 0.1 * Math.max(0, 1 - k * 4) : 1; g.setAttribute('transform', `translate(${x},${y}) scale(${n2(sc)}) translate(${-x},${-y})`);
        const rp = g.querySelector('.cycRip'); if (rp){ const q = (t * 0.8) % 1; rp.setAttribute('r', n2(NR + q * 26)); rp.setAttribute('opacity', on ? n2(0.8 * (1 - q)) : 0); }
        g.setAttribute('opacity', i <= s || D.loop ? 1 : 0.55); if (tn) tn.setAttribute('fill-opacity', on ? '.34' : '.12'); c.setAttribute('stroke-width', on ? 5.5 : 3);
        c.style.filter = on ? `drop-shadow(0 0 ${n2(6 + 4 * Math.sin(t * 4))}px ${D.col})` : ''; });
      a.all('.cycArc').forEach(g => { const to = +g.dataset.to, on = to === s, done = D.loop ? true : to <= s; g.setAttribute('opacity', done || on ? 1 : 0.35);
        g.querySelectorAll('path').forEach(p => { if (p.getAttribute('fill') === 'none'){ p.setAttribute('stroke', on ? '#ffd98a' : '#e8e0d0'); p.setAttribute('stroke-dashoffset', n2(-(t * (on ? 60 : 25)) % 19)); } else p.setAttribute('fill', on ? '#ffd98a' : '#e8e0d0'); }); });
      a.all('.cycVia').forEach(g => { const on = +g.dataset.to === s, r = g.querySelector('rect'); g.setAttribute('opacity', D.loop || +g.dataset.to <= s ? 1 : 0.5); if (r){ r.setAttribute('fill', on ? 'rgba(90,64,20,.95)' : 'rgba(24,18,36,.92)'); r.setAttribute('stroke-width', on ? 2.4 : 1.3); } });
      if (s !== shown){ shown = s; const T = a.el('#cycT'), Dd = a.el('#cycD');
        if (T) T.innerHTML = wrapName(ST[s].n, 28).slice(0, 2).map((l, i) => `<tspan x="${C[0]}" dy="${i ? 16 : 0}">${l}</tspan>`).join(''); if (Dd) Dd.innerHTML = wrapName(ST[s].d, 32).slice(0, 6).map((l, i) => `<tspan x="${C[0]}" dy="${i ? 17 : 0}">${l}</tspan>`).join(''); }
      /* علامة تتحرك من المحطة السابقة إلى الحالية */
      const tk = a.el('#cycTok'); if (tk){ if (s === 0 && !D.loop){ tk.setAttribute('opacity', 0); } else { const i0 = (s - 1 + n) % n, a0 = ang(i0), a1 = s > i0 ? ang(s) : ang(s) + 2 * Math.PI, q = Math.min(1, k * 1.6), aa = a0 + (a1 - a0) * q;
        tk.setAttribute('opacity', q < 1 ? 1 : 0); tk.setAttribute('transform', `translate(${n2(C[0] + Math.cos(aa) * R)},${n2(C[1] + Math.sin(aa) * R)})`); } }
    }
  };
}
/* التبديل بين العملية ومخططها مع البقاء على الخطوة نفسها */
let CYC_T = null;
function cycSwitch(id, T){ CYC_T = T; const b = document.querySelector(`#sceneTools [data-tool="${id}"]`); if (b) b.click(); }
function cycKeep(){ if (CYC_T === null) return; STG.T = CYC_T; CYC_T = null; if (api.setSlider) api.setSlider(STG.T); }
/* إضافة زر «مخطط …» بجانب زر عمليته في كل تبويب، وتغليف البناء والمجسّم */
Object.keys(CYC).forEach(v => { const D = CYC[v], [VIEWS] = CYC_TABS[D.tab]; if (VIEWS.some(x => x.id === v)) return; const bi = VIEWS.findIndex(x => x.id === v.slice(0, -1)); VIEWS.splice(bi < 0 ? VIEWS.length : bi + 1, 0, { id: v, label: D.label }); });
Object.keys(CYC_TABS).forEach(tab => {
  const sc = SCENES[tab], [VIEWS, radio] = CYC_TABS[tab], ob = sc.build, om = sc.model3d;
  const sd = Object.getOwnPropertyDescriptor(sc, 'src');
  Object.defineProperty(sc, 'src', { configurable: true, get(){ const v = SEL[radio]; return CYC[v] && CYC[v].tab === tab ? CYC[v].src : (sd.get ? sd.get.call(sc) : sd.value); } });
  sc.build = function(){ const v = SEL[radio]; if (!CYC[v] || CYC[v].tab !== tab){ const r = ob.call(this); if (CYC[v + 'D'] && CYC[v + 'D'].tab === tab){
      r.tools = (r.tools || []).slice(); const at = r.tools.findIndex(x => x.id === 'stPrev'); r.tools.splice(at < 0 ? r.tools.length : at, 0, { id: 'cycGo', label: '↻ عرض المخطط' });
      const ot = r.onTool, oi = r.init; r.onTool = id => { if (id === 'cycGo'){ const DD = CYC[v + 'D'], ni = Math.max(0, DD.N.findIndex(x => x.from.includes(STG.idx))), fr = DD.N[ni].from; cycSwitch(v + 'D', (ni + Math.min(0.98, (fr.indexOf(STG.idx) + STG.k) / fr.length)) / DD.N.length); } else if (ot) ot(id); }; r.init = function(){ if (oi) oi.call(this); cycKeep(); }; }
    return r; }
    const s = cycView(v); s.rebuildOnRadio = radio; s.tools = VIEWS.map(x => ({ id: x.id, label: x.label, radio, on: x.id === v })).concat(s.tools || []); return s; };
  sc.model3d = () => { const v = SEL[radio]; return CYC[v] && CYC[v].tab === tab ? 'cyc_' + v : om(); };
});
Object.assign(CH.toolIcons, Object.fromEntries(Object.keys(CYC).map(v => [v, 'route'])), { cycGo: 'route', cycBack: 'play' });
