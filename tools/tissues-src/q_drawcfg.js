
/* ══════════════════════════════════════════════════════════════════════════
   8 · وضع الرسم اليدوي — رسوم الفصل الثاني (نفس محرك الفصل الأول)
   ══════════════════════════════════════════════════════════════════════════ */
/* ترتيب الرسم: الإطار والأجزاء الكبيرة أولاً ثم التفاصيل */
const DRAW_ORDER = {
  mer_loc:  ['apicalShoot', 'apicalRoot', 'intercal', 'corkCamb', 'vascCamb'],
  mer_root: ['rootCap', 'zoneDiv', 'protoderm', 'groundMer', 'procamb', 'zoneElong', 'zoneMat', 'rootHair'],
  mer_cell: ['merWall', 'merCyto', 'merNuc', 'merVac'],
  sim_loc:  ['epidermis', 'tColl', 'tParen', 'vBundle', 'tScler'],
  sim_par:  ['parWall', 'matVac', 'nucleus', 'parChl', 'interSp'],
  sim_col:  ['epidermis', 'colProto', 'colCorner', 'tColl'],
  sim_scl:  ['sclFiber', 'sclWall', 'sclLumen', 'sclPit', 'sclStone']
};
/* كيف يُرسم كل جزء (وصف الشكل فقط؛ الموقع من الرسم نفسه) */
const DRAW_SHAPE = {
  apicalShoot: 'برعماً صغيراً (شكل قطرة) في قمة الساق', apicalRoot: 'طرفاً مدبباً في قمة كل جذر',
  intercal: 'شريطاً قصيراً فوق كل عقدة في الساق العشبية', corkCamb: 'حلقة خارجية متقطعة تحت سطح المقطع',
  vascCamb: 'حلقة داخلية بين الخشب واللحاء',
  rootCap: 'قوساً (كشتباناً) من الخلايا يغطي القمة', zoneDiv: 'خلايا صغيرة مربعة متراصّة بنوى كبيرة',
  protoderm: 'الصف الخارجي من الخلايا', groundMer: 'الخلايا بين الصف الخارجي والوسط', procamb: 'عموداً من الخلايا في الوسط',
  zoneElong: 'خلايا أطول من السابقة وفيها فجوات', zoneMat: 'خلايا كبيرة متمايزة وفي وسطها أوعية',
  rootHair: 'خطوطاً رفيعة طويلة تخرج من سطح الجذر',
  merWall: 'مربعاً بزوايا مدوّرة بخط رفيع', merCyto: 'نقاطاً كثيفة تملأ الخلية', merNuc: 'دائرة كبيرة في الوسط وداخلها دائرة صغيرة',
  merVac: 'دوائر صغيرة جداً',
  epidermis: 'صفاً خارجياً من خلايا متراصّة', tColl: 'حلقة من خلايا صغيرة تحت البشرة', tParen: 'خلايا دائرية كبيرة في القشرة والوسط (اللب)',
  vBundle: 'حزماً بيضوية مرتبة بشكل حلقة', tScler: 'غطاءً هلالياً فوق كل حزمة',
  parWall: 'أشكالاً دائرية متجاورة بخط رفيع', matVac: 'شكلاً كبيراً فاتحاً يملأ وسط كل خلية', nucleus: 'دائرة صغيرة على جانب الخلية',
  parChl: 'أشكالاً بيضوية صغيرة حول الفجوة', interSp: 'مثلثات صغيرة حيث تلتقي الخلايا',
  colProto: 'خلايا سداسية متجاورة', colCorner: 'دوائر سميكة عند زوايا الخلايا',
  sclFiber: 'خلايا مغزلية طويلة مدببة الطرفين', sclWall: 'دائرة كبيرة بجدار سميك', sclLumen: 'دائرة صغيرة في الوسط',
  sclPit: 'خطوطاً متفرعة من الوسط إلى الجدار', sclStone: 'خلايا دائرية صغيرة سميكة الجدار'
};
const drApi = host => ({ playing: true, dragSlider: false, sliderVal: 0,
  el: q => host.querySelector(q), all: q => Array.from(host.querySelectorAll(q)),
  tool: () => false, setTool(){}, radio: () => null, setRadio(){}, setSlider(){}, setCap(){}, setPhase(){}, flowEnabled(){}, hideLabels(){}, g(){} });
const DR_GROUPS = [
  { g: 'mer', t: 'الأنسجة المرستيمية', items: CH.exam.filter(d => d.k.indexOf('mer_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k],
      base: d.k === 'mer_loc' ? ['النبات', 'نباتاً بساق وأوراق وجذور تحت خط التربة، ونباتاً عشبياً بعقد، ودائرة لمقطع الساق'] : null })) },
  { g: 'sim', t: 'الأنسجة البسيطة', items: CH.exam.filter(d => d.k.indexOf('sim_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) }
];
