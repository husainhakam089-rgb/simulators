
/* ══════════════════════════════════════════════════════════════════════════
   8 · وضع الرسم اليدوي — رسوم الفصل الثالث التي تطلب الملزمة رسمها
   ══════════════════════════════════════════════════════════════════════════ */
const DRAW_SHAPE = Object.assign({}, CH.drawShape);
const drApi = host => ({ playing: true, dragSlider: false, sliderVal: 0,
  el: q => host.querySelector(q), all: q => Array.from(host.querySelectorAll(q)),
  tool: () => false, setTool(){}, radio: () => null, setRadio(){}, setSlider(){}, setCap(){}, setPhase(){}, flowEnabled(){}, hideLabels(){}, g(){} });
/* CH.draw: {g, t, k, order?, steps?} — تُجمع حسب المجموعة بترتيب إضافتها */
const DR_GROUPS = [];
CH.draw.forEach(d => {
  let G = DR_GROUPS.find(x => x.g === d.g);
  if (!G){ G = { g: d.g, t: d.gt, items: [] }; DR_GROUPS.push(G); }
  G.items.push({ k: d.k, t: d.t, scene: () => SCENES[d.k].build(true), order: d.order, steps: d.steps, prep: d.prep });
});
