
/* ══════════════════════════════════════════════════════════════════════════
   8 · وضع الرسم اليدوي — رسوم الفصل الثاني (نفس محرك الفصل الأول)
   ══════════════════════════════════════════════════════════════════════════ */
/* ترتيب الرسم: الإطار والأجزاء الكبيرة أولاً ثم التفاصيل */
const DRAW_ORDER = {
  mer_loc:  ['apicalShoot', 'apicalRoot', 'intercal', 'corkCamb', 'vascCamb'],
  sim_loc:  ['epidermis', 'tColl', 'tParen', 'vBundle', 'tScler'],
  sim_par:  ['parWall', 'matVac', 'nucleus', 'parChl', 'interSp'],
  sim_col:  ['epidermis', 'colProto', 'colCorner', 'tColl'],
  sim_scl:  ['sclFiber', 'sclWall', 'sclLumen', 'sclPit', 'sclStone'],
  vas_bun:  ['pFiber', 'tPhloem', 'pSieve', 'pComp', 'vascCamb', 'tXylem', 'xVessel'],
  vas_xyl:  ['xVessel', 'xTrach', 'xFiber', 'xPar'],
  vas_phl:  ['pSieve', 'pPlate', 'pComp', 'pFiber', 'pPar'],
  epi_leaf: ['epidermis', 'guard', 'stoma'],
  epi_sec:  ['mesoph', 'epidermis', 'guard', 'stoma', 'cuticle', 'trich'],
  epi_stom: ['epidermis', 'guard', 'stoma'],
  eth_sq:   ['connBelow', 'basem', 'tSqS', 'eNuc'],
  eth_cub:  ['connBelow', 'basem', 'tCubS', 'eNuc'],
  eth_col:  ['connBelow', 'basem', 'tColS', 'eNuc'],
  eth_pse:  ['connBelow', 'basem', 'tPse', 'eNuc', 'cilia'],
  eth_str:  ['connBelow', 'basem', 'tSqStr', 'eNuc'],
  con_loose: ['matrixC', 'colFib', 'elaFib', 'fibro'],
  con_cart:  ['cartHy', 'cartEl', 'cartFi', 'lacuna', 'chondro'],
  con_bone:  ['lamella', 'havers', 'lacuna', 'osteo', 'canalic'],
  con_blood: ['plasma', 'rbc', 'wbc', 'platelet'],
  mus_skel:   ['mFiber', 'tSkel', 'mStri', 'mNuc'],
  mus_smooth: ['mFiber', 'tSmooth', 'mNuc'],
  mus_card:   ['tCard', 'mStri', 'icDisc', 'mNuc'],
  nrv_neuron: ['soma', 'nNuc', 'dendr', 'axon', 'myelin', 'ranvier', 'axTerm'],
  nrv_axon:   ['axon', 'myelin', 'ranvier'],
  nrv_tissue: ['tNerve', 'neuron', 'glia']
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
  sclPit: 'خطوطاً متفرعة من الوسط إلى الجدار', sclStone: 'خلايا دائرية صغيرة سميكة الجدار',
  pFiber: 'هلالاً من خلايا صغيرة سميكة الجدار في الأعلى (أو خلية مغزلية طويلة)', tPhloem: 'منطقة تحت الألياف',
  pSieve: 'خلايا كبيرة في اللحاء (أو عموداً من خلايا طويلة متتالية)', pComp: 'خلايا صغيرة ضيقة ملاصقة لها وفيها نواة',
  tXylem: 'منطقة كبيرة في الأسفل', xVessel: 'دوائر كبيرة سميكة الجدار (أو أنبوباً طويلاً عريضاً بلا جدران فاصلة)',
  xTrach: 'خليتين مغزليتين متداخلتين فيهما نقر', xFiber: 'خلية مغزلية رفيعة طويلة', xPar: 'خلايا مستطيلة صغيرة بنوى',
  pPlate: 'خطاً مثقباً بين خلايا الأنبوب الغربالي', pPar: 'خلايا مستطيلة صغيرة بنوى',
  guard: 'خليتين كلويتين متقابلتين', stoma: 'فتحة بين الخليتين الحارستين', cuticle: 'طبقة سميكة على السطح الخارجي للبشرة',
  trich: 'زوائد طويلة تخرج من خلايا البشرة', mesoph: 'خلايا دائرية بداخلها بلاستيدات',
  connBelow: 'مستطيلاً في الأسفل فيه وعاء دموي', basem: 'خطاً سميكاً فوقه', tSqS: 'صفاً واحداً من خلايا مسطحة رقيقة',
  tCubS: 'صفاً واحداً من مربعات متساوية', tColS: 'صفاً واحداً من مستطيلات طويلة', eNuc: 'نواة في كل خلية بشكل يناسبها',
  tPse: 'خلايا مختلفة الأطوال كلها تلامس الخط القاعدي', cilia: 'شعيرات قصيرة على سطح الخلايا الطويلة',
  tSqStr: 'عدة صفوف: القاعدية مربعة والسطحية مسطحة',
  matrixC: 'مستطيلاً كبيراً (المادة بين الخلوية)', colFib: 'أشرطة سميكة متموجة', elaFib: 'خطوطاً رفيعة متفرعة',
  fibro: 'خلايا مغزلية بنوى', cartHy: 'دائرة بمادة متجانسة', cartEl: 'دائرة فيها خطوط رفيعة متشابكة', cartFi: 'دائرة فيها حزم ألياف متوازية',
  lacuna: 'تجاويف بيضوية صغيرة', chondro: 'خلية أو خليتين داخل كل تجويف', lamella: 'دوائر متحدة المركز',
  havers: 'دائرة صغيرة في المركز فيها وعاء دموي', osteo: 'خلايا صغيرة بين الدوائر', canalic: 'خطوطاً دقيقة متشعبة من التجاويف',
  plasma: 'وعاءً بسائل فاتح', rbc: 'أقراصاً حمراء مقعرة الوسط', wbc: 'خلايا أكبر بنواة مفصصة', platelet: 'أجساماً صغيرة جداً',
  mFiber: 'ليفاً طويلاً واحداً', tSkel: 'أليافاً أسطوانية طويلة متوازية', mStri: 'خطوطاً عرضية متعاقبة على الألياف',
  mNuc: 'نوى بيضوية صغيرة', tSmooth: 'خلايا مغزلية متداخلة', tCard: 'أليافاً متفرعة متصلة', icDisc: 'خطوطاً عرضية سميكة متعرجة',
  soma: 'جسماً كبيراً غير منتظم', nNuc: 'نواة مستديرة في وسط جسم الخلية', dendr: 'زوائد قصيرة متفرعة حول جسم الخلية',
  axon: 'خطاً طويلاً واحداً يخرج من جسم الخلية', myelin: 'قطعاً بيضوية تغلف المحور', ranvier: 'فراغات ضيقة بين قطع الغمد',
  axTerm: 'تفرعات في نهاية المحور تنتهي بانتفاخات', neuron: 'عصبونات متصلة: نهايات كل واحد قرب زوائد التالي',
  glia: 'خلايا صغيرة مستديرة بين العصبونات', tNerve: 'إطاراً يحيط بالنسيج'
};
const drApi = host => ({ playing: true, dragSlider: false, sliderVal: 0,
  el: q => host.querySelector(q), all: q => Array.from(host.querySelectorAll(q)),
  tool: () => false, setTool(){}, radio: () => null, setRadio(){}, setSlider(){}, setCap(){}, setPhase(){}, flowEnabled(){}, hideLabels(){}, g(){} });
const DR_GROUPS = [
  /* النسيج المرستيمي: لا يوجد له رسم في الملزمة، فلا يدخل الرسم اليدوي */
  { g: 'sim', t: 'النسيج الأساس', items: CH.exam.filter(d => d.k.indexOf('sim_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) },
  { g: 'epi', t: 'نسيج البشرة', items: CH.exam.filter(d => d.k.indexOf('epi_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) },
  { g: 'vas', t: 'النسيج الوعائي', items: CH.exam.filter(d => d.k.indexOf('vas_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) },
  { g: 'eth', t: 'النسيج الظهاري', items: CH.exam.filter(d => d.k.indexOf('eth_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) },
  { g: 'con', t: 'النسيج الضام', items: CH.exam.filter(d => d.k.indexOf('con_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) },
  { g: 'mus', t: 'النسيج العضلي', items: CH.exam.filter(d => d.k.indexOf('mus_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) },
  { g: 'nrv', t: 'النسيج العصبي', items: CH.exam.filter(d => d.k.indexOf('nrv_') === 0).map(d => ({
      k: d.k, t: d.t, scene: () => SCENES[d.k].build(), order: DRAW_ORDER[d.k] })) }
];
