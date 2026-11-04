
/* ══════════════════════════════════════════════════════════════════════════
   5 · المراحل: شريط + السابقة/التالية + تشغيل/إيقاف، واسم المرحلة ووصفها
       يتحدثان تلقائياً. المجسّم يقرأ نفس الحالة (STG) فيتحرك مع الرسم المسطّح،
       والكاميرا تنتقل لزاوية كل مرحلة (cam).
   ══════════════════════════════════════════════════════════════════════════ */
const STG = { T: 0, n: 1, idx: 0, k: 0 };
function stageCtl(stages, o){
  o = o || {};
  const dur = o.dur || stages.length * 7;
  let shown = -1;
  const sync = () => {
    STG.n = stages.length;
    STG.idx = Math.min(stages.length - 1, Math.floor(STG.T * stages.length));
    STG.k = STG.T * stages.length - STG.idx;
    if (STG.idx !== shown){
      shown = STG.idx;
      const s = stages[STG.idx];
      api.setPhase({ n: s.n, d: s.d, chrom: 'المرحلة ' + (STG.idx + 1) + ' من ' + stages.length });
      if (o.onStage) o.onStage(STG.idx);
    }
  };
  const jump = i => { const n = stages.length; STG.T = (((i % n) + n) % n + 0.02) / n; api.setSlider(STG.T); sync(); };
  return {
    stages,
    tools: [{ id: 'stPrev', label: 'السابقة' }, { id: 'slider', slider: true, label: o.label || 'المرحلة' }, { id: 'stNext', label: 'التالية' }],
    start(){ STG.T = 0; shown = -1; api.setSlider(0); sync(); },
    tick(dt){
      if (!api.dragSlider){ STG.T += dt / dur; if (STG.T >= 0.999) STG.T = 0; api.setSlider(STG.T); }
      sync();
    },
    onSlider(v){ STG.T = v; sync(); },
    onTool(id){ if (id === 'stPrev') jump(STG.idx - 1); else if (id === 'stNext') jump(STG.idx + 1); },
    cam: () => stages[STG.idx].cam || null
  };
}
