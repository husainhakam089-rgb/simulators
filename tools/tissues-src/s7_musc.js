
/* ══════════════════════════════════════════════════════════════════════════
   4.7 · النسيج العضلي — ملزمة ص72–79: العضلات الملساء (الحشوية، موجة تقلص
         لاإرادية)، الهيكلية (الإرادية: تتقلص بزر «تقلّص»)، القلبية (تنبض)، والمقارنة
   ══════════════════════════════════════════════════════════════════════════ */
const MUS_VIEWS = [
  { id: 'msmooth', label: 'العضلات الملساء' },
  { id: 'mskel',   label: 'العضلات الهيكلية' },
  { id: 'mcard',   label: 'العضلات القلبية' },
  { id: 'mcmp',    label: 'قارن' }
];
const MUS_SRC = { msmooth: 'ملزمة ص73 وص75', mskel: 'ملزمة ص74–76', mcard: 'ملزمة ص74–77', mcmp: 'ملزمة ص75–77' };
const MUS_PAL = { skel: '#c9505a', skelL: '#ffc8c8', band: '#7a2430', smooth: '#d97c84', card: '#b8434f', disc: '#3a0f18' };
/* حالة التقلص المشتركة بين الرسم المسطّح والمجسّم: k من 0 (منبسط) إلى 1 (متقلص) */
const MUS = { k: 0, pulse: -9 };
const musPulse = t => { const d = t - MUS.pulse; return d < 0 || d > 1.8 ? 0 : d < 0.35 ? d / 0.35 : d < 1.0 ? 1 : 1 - (d - 1.0) / 0.8; };
const heartBeat = t => { const p = (t * 1.15) % 1; return p < 0.12 ? Math.sin(p / 0.12 * Math.PI) : p < 0.3 ? 0.55 * Math.sin((p - 0.12) / 0.18 * Math.PI) : 0; };

SCENES.musc = {
  title: 'النسيج العضلي',
  get src(){ return MUS_SRC[SEL.musv] || 'ملزمة ص72'; },
  tint: ['rgba(180,70,80,.24)', 'rgba(120,80,120,.16)'],
  model3d: () => 'mus_' + SEL.musv,
  build(){
    const v = MUS_VIEWS.some(x => x.id === SEL.musv) ? SEL.musv : 'msmooth';
    const s = v === 'msmooth' ? musSmooth() : v === 'mcard' ? musCard() : v === 'mcmp' ? musCmp() : musSkel();
    s.rebuildOnRadio = 'musv';
    s.tools = MUS_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'musv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.mus_smooth = { title: 'العضلات الملساء (الحشوية)', build: () => musSmooth() };
SCENES.mus_skel   = { title: 'العضلات الهيكلية (الإرادية)', build: () => musSkel() };
SCENES.mus_card   = { title: 'العضلات القلبية', build: () => musCard() };

/* ───────── 2) الهيكلية: ليف أسطواني طويل مخطط متعدد الأنوية محيطية الموقع (ص74–75) ───────── */
function musSkel(){
  const X0 = 200, X1 = 800, H = 62, rows = [150, 230, 310, 390], rr = rng(17);
  const fibers = [], stripes = [], nucs = [];
  rows.forEach((y, r) => {
    fibers.push(`<rect x="${X0}" y="${y}" width="${X1 - X0}" height="${H}" rx="28" fill="${MUS_PAL.skel}" stroke="${MUS_PAL.skelL}" stroke-width="1.6"/>`);
    for (let x = X0 + 18; x < X1 - 18; x += 18) stripes.push(`<rect x="${x}" y="${y + 6}" width="7" height="${H - 12}" fill="${MUS_PAL.band}" opacity=".55"/>`);
    for (let i = 0; i < 7; i++){ const x = X0 + 50 + i * 82 + rr() * 20, top = (i + r) % 2 === 0;
      nucs.push(`<ellipse cx="${n2(x)}" cy="${top ? y + 7 : y + H - 7}" rx="17" ry="5.5" fill="url(#gNucl)"/>`); }
  });
  const body = `
    <rect x="150" y="130" width="50" height="340" rx="14" fill="#e9dcc0" stroke="#fff6e0" stroke-width="2"/>
    <text class="cap sm" x="175" y="500" text-anchor="middle">عظم</text>
    <g id="skelG">
      ${part('mFiber', fibers[0])}
      ${part('tSkel', fibers.slice(1).join(''))}
      ${part('mStri', stripes.join(''))}
      ${part('mNuc', nucs.join(''))}
      ${part('mMemb', `<rect x="${X0 - 2}" y="${rows[0] - 2}" width="${X1 - X0 + 4}" height="${H + 4}" rx="30" fill="none" stroke="#fff3c8" stroke-width="2.4"/>`)}
    </g>
    <g id="pullArr" opacity="0"><path d="M860,300 L920,300 M872,288 L860,300 L872,312" fill="none" stroke="#ffe08a" stroke-width="3" stroke-linecap="round"/></g>
    <text class="cap" x="500" y="512" text-anchor="middle">العضلات الهيكلية: إرادية ترتبط مع العظام بواسطة أوتار، وعند تقلصها يتحرك جزء الجسم الموجودة فيه</text>
    <text id="skelHint" class="cap sm" x="500" y="538" text-anchor="middle">اضغط «تقلّص» — تقوم العضلة بعملها تحت سيطرة الفرد ولذلك تدعى بالإرادية</text>`;
  return {
    body, fnParts: ['tSkel', 'mStri'],
    parts: [
      /* المؤشرات قرب الطرف الثابت (عند العظم) حتى تبقى على الألياف أثناء التقلص */
      { id: 'mFiber', anchor: [X0 + 40, rows[0] + 10], label: [134, 120], side: 'L' },
      { id: 'mNuc', anchor: [X0 + 50, rows[1] + H - 7], label: [134, 280], side: 'L' },
      { id: 'tSkel', anchor: [X0 + 30, rows[3] + 40], label: [134, 440], side: 'L' },
      { id: 'mStri', anchor: [X0 + 18 * 6 + 3, rows[2] + 30], label: [866, 330], side: 'R' },
      { id: 'mMemb', anchor: [X0 + 260, rows[0] - 2], label: [866, 150], side: 'R' }
    ],
    tools: [{ id: 'contract', label: 'تقلّص' }, { id: 'info:tSkel', label: 'عن العضلات الهيكلية' }, { id: 'tbl:muscleCmp', label: 'مقارنة الأنواع (ص75)' }],
    onTool(id){ if (id === 'contract') MUS.pulse = tAcc; },
    tick(dt, t, a){
      if (focusOwner && t - MUS.pulse > 2.2) MUS.pulse = t;
      MUS.k = musPulse(t);
      const sx = 1 - 0.18 * MUS.k, sy = 1 + 0.12 * MUS.k;
      const g = a.el('#skelG'); if (g) g.setAttribute('transform', `translate(${X0},300) scale(${n2(sx)},${n2(sy)}) translate(${-X0},-300)`);
      const p = a.el('#pullArr'); if (p) p.setAttribute('opacity', n2(MUS.k));
    }
  };
}

/* ───────── 1) الملساء: ليف مغزلي مستدق النهايتين، نواة مفردة مركزية (ص73 وص75) ───────── */
function musSmooth(){
  const cells = [], CL = 230, CH = 46;
  let k = 0;
  for (let r = 0; r < 6; r++) for (let i = -1; i < 4; i++){
    const cx = 230 + i * 200 + (r % 2 ? 100 : 0), cy = 150 + r * 56;
    if (cx < 150 || cx > 850) continue;
    const sp = `M${cx - CL / 2},${cy} Q${cx},${cy - CH} ${cx + CL / 2},${cy} Q${cx},${cy + CH} ${cx - CL / 2},${cy}Z`;
    cells.push(`<g class="smc" data-x="${cx}" data-y="${cy}">${part(k ? 'tSmooth' : 'mFiber', `<path d="${sp}" fill="${MUS_PAL.smooth}" stroke="#ffd8dc" stroke-width="1.4"/>`)}
      ${k ? '' : part('mMemb', `<path d="${sp}" fill="none" stroke="#fff3c8" stroke-width="2.6"/>`)}${part('mNuc', `<ellipse cx="${cx}" cy="${cy}" rx="26" ry="7" fill="url(#gNucl)"/>`)}</g>`);
    k++;
  }
  const body = `
    <g id="smG">${cells.join('')}</g>
    <text class="cap" x="500" y="512" text-anchor="middle">العضلات الملساء (الحشوية): في جدران الأمعاء والمعدة والأوعية الدموية والأعضاء الداخلية المجوفة</text>
    <text class="cap sm" x="500" y="538" text-anchor="middle">ألياف مغزلية مستدقة النهايتين سميكة من الوسط، نواة مفردة مركزية — فعل الحركة لاإرادي</text>`;
  return {
    body, fnParts: ['tSmooth'],
    parts: [
      { id: 'mFiber', anchor: [230 - 40, 150], label: [134, 120], side: 'L' },
      { id: 'mMemb', anchor: [230 + 30, 150 - 19], label: [134, 220], side: 'L' },
      { id: 'mNuc', anchor: [430 - 26, 150 + 2 * 56], label: [134, 330], side: 'L' },
      { id: 'tSmooth', anchor: [790, 400], label: [866, 420], side: 'R' }
    ],
    tools: [{ id: 'info:tSmooth', label: 'عن العضلات الملساء' }, { id: 'tbl:muscleCmp', label: 'مقارنة الأنواع (ص75)' }],
    tick(dt, t, a){
      const sp = focusOwner === 'tSmooth' ? 1.6 : 1;
      a.all('.smc').forEach(e => { const x = +e.dataset.x, y = +e.dataset.y, w = Math.max(0, Math.sin(t * 1.1 * sp - x * 0.012)), sx = 1 - 0.22 * w, sy = 1 + 0.3 * w;
        e.setAttribute('transform', `translate(${x},${y}) scale(${n2(sx)},${n2(sy)}) translate(${-x},${-y})`); });
    }
  };
}

/* ───────── 3) القلبية: ليف أسطواني يتفرع ويلتقي، مخطط، نواة مفردة مركزية، أقراص بينية (ص74–76) ───────── */
function musCard(){
  const Y = [180, 300, 420], H = 52, X0 = 170, X1 = 830, fib = [], str = [], nuc = [], disc = [];
  Y.forEach((y, r) => {
    fib.push(`<rect x="${X0}" y="${y - H / 2}" width="${X1 - X0}" height="${H}" rx="22" fill="${MUS_PAL.card}" stroke="#ffc8c8" stroke-width="1.6"/>`);
    for (let x = X0 + 14; x < X1 - 14; x += 16) str.push(`<rect x="${x}" y="${y - H / 2 + 6}" width="6" height="${H - 12}" fill="${MUS_PAL.band}" opacity=".5"/>`);
    const D = [X0 + 140 + r * 40, X0 + 330 + r * 30, X0 + 520 + r * 20];
    D.forEach(x => disc.push(`<path d="M${x},${y - H / 2 + 2} l6,8 l-6,8 l6,8 l-6,8 l6,8 l-6,8" fill="none" stroke="${MUS_PAL.disc}" stroke-width="5"/>`));
    [X0 + 70, X0 + 240, X0 + 430, X0 + 610].forEach(x => nuc.push(`<ellipse cx="${x + r * 14}" cy="${y}" rx="15" ry="9" fill="url(#gNucl)"/>`));
  });
  /* تفرعات بين الألياف */
  const br = [[300, 180, 380, 300], [560, 300, 640, 420], [700, 180, 760, 300], [250, 300, 320, 420]].map(([x0, y0, x1, y1]) =>
    `<path d="M${x0 - 20},${y0 + 10} L${x1 - 20},${y1 - 10} L${x1 + 20},${y1 - 10} L${x0 + 20},${y0 + 10}Z" fill="${MUS_PAL.card}" stroke="#ffc8c8" stroke-width="1.4"/>`);
  const body = `<g id="cardG">
    ${part('tCard', br.join('') + fib.join(''))}
    ${part('mStri', str.join(''))}
    ${part('icDisc', disc.join(''))}
    ${part('mNuc', nuc.join(''))}
    ${part('mMemb', `<rect x="${X0 - 1.5}" y="${Y[2] - H / 2 - 1.5}" width="${X1 - X0 + 3}" height="${H + 3}" rx="23" fill="none" stroke="#fff3c8" stroke-width="1.6"/>`)}</g>
    <text class="cap" x="500" y="512" text-anchor="middle">العضلات القلبية: لاإرادية في جدران القلب — تقلصها يضخ الدم من القلب وتمددها يسمح بدخول الدم إليه</text>
    <text class="cap sm" x="500" y="538" text-anchor="middle">تجمع بين الصفات المظهرية والوظيفية لليف الأملس والهيكلي؛ أليافها ترتبط عند نهاياتها بالأقراص البينية</text>`;
  return {
    body, fnParts: ['tCard', 'icDisc'],
    parts: [
      { id: 'tCard', anchor: [X1 - 20, 180], label: [866, 150], side: 'R' },
      { id: 'icDisc', anchor: [X0 + 330 + 30 + 3, 300 - 6], label: [866, 300], side: 'R' },
      { id: 'mStri', anchor: [X0 + 14 + 16 * 36 + 3, 420 + 14], label: [866, 450], side: 'R' },
      { id: 'mNuc', anchor: [X0 + 70, 180], label: [134, 200], side: 'L' },
      { id: 'mMemb', anchor: [X0 + 40, Y[2] + H / 2], label: [134, 460], side: 'L' }
    ],
    tools: [{ id: 'info:tCard', label: 'عن العضلات القلبية' }, { id: 'tbl:muscleCmp', label: 'مقارنة الأنواع (ص75)' }, { id: 'tbl:muscleLike', label: 'أوجه الشبه (ص77)' }],
    tick(dt, t, a){ MUS.k = heartBeat(t); const s = 1 - 0.05 * MUS.k; const g = a.el('#cardG'); if (g) g.setAttribute('transform', `translate(500,300) scale(${n2(s)},${n2(1 + 0.04 * MUS.k)}) translate(-500,-300)`); }
  };
}

/* ───────── 4) قارن: الأنواع الثلاثة ───────── */
function musCmp(){
  /* بترتيب جدول الملزمة (من اليمين): الملساء، الهيكلية، القلبية */
  const Y = 290, X = [500, 780, 220];
  const sk = `<rect x="${X[0] - 120}" y="${Y - 34}" width="240" height="68" rx="30" fill="${MUS_PAL.skel}"/>` +
    Array.from({ length: 12 }, (_, i) => `<rect x="${X[0] - 104 + i * 18}" y="${Y - 28}" width="7" height="56" fill="${MUS_PAL.band}" opacity=".55"/>`).join('') +
    [-80, -10, 60].map((dx, i) => `<ellipse cx="${X[0] + dx}" cy="${i % 2 ? Y + 27 : Y - 27}" rx="15" ry="5" fill="url(#gNucl)"/>`).join('');
  const sm = `<path d="M${X[1] - 120},${Y} Q${X[1]},${Y - 50} ${X[1] + 120},${Y} Q${X[1]},${Y + 50} ${X[1] - 120},${Y}Z" fill="${MUS_PAL.smooth}"/><ellipse cx="${X[1]}" cy="${Y}" rx="24" ry="7" fill="url(#gNucl)"/>`;
  const cd = `<rect x="${X[2] - 120}" y="${Y - 30}" width="240" height="60" rx="24" fill="${MUS_PAL.card}"/><path d="M${X[2] - 40},${Y - 30} L${X[2] - 10},${Y - 90} L${X[2] + 20},${Y - 90} L${X[2] + 10},${Y - 30}Z" fill="${MUS_PAL.card}"/>` +
    Array.from({ length: 13 }, (_, i) => `<rect x="${X[2] - 108 + i * 17}" y="${Y - 25}" width="6" height="50" fill="${MUS_PAL.band}" opacity=".5"/>`).join('') +
    `<path class="dHi" d="M${X[2] + 40},${Y - 28} l6,9 l-6,9 l6,9 l-6,9 l6,9 l-6,9" fill="none" stroke="${MUS_PAL.disc}" stroke-width="5"/><ellipse cx="${X[2] - 50}" cy="${Y}" rx="14" ry="8" fill="url(#gNucl)"/>`;
  const cap = (x, a, b) => `<text class="cap" x="${x}" y="${Y + 100}" text-anchor="middle">${a}</text><text class="cap sm" x="${x}" y="${Y + 126}" text-anchor="middle">${b}</text>`;
  const body = part('tSkel', sk) + part('tSmooth', sm) + part('tCard', cd) +
    cap(X[1], 'الملساء (الحشوية)', 'مغزلي · غير مخطط · نواة مفردة مركزية · لاإرادي') + cap(X[0], 'الهيكلية (الإرادية)', 'أسطواني طويل · مخطط · أنوية متعددة محيطية · إرادي') + cap(X[2], 'القلبية', 'أسطواني متفرع · مخطط · نواة مركزية · لاإرادي');
  let opened = false;
  return {
    body, fnParts: [],
    parts: [
      { id: 'tSmooth', anchor: [X[1] + 100, Y - 16], label: [866, 140], side: 'R' },
      { id: 'tSkel', anchor: [X[0], Y - 34], label: [500, 140], side: 'C' },
      { id: 'tCard', anchor: [X[2] - 100, Y - 26], label: [134, 140], side: 'L' }
    ],
    tools: [{ id: 'tbl:muscleCmp', label: 'جدول الفروقات (ص75)' }, { id: 'tbl:muscleLike', label: 'أوجه الشبه (ص77)' }, { id: 'info:tMuscle', label: 'عن النسيج العضلي' }],
    init(){ if (!opened){ opened = true; setTimeout(() => { if (curKey === 'musc' && SEL.musv === 'mcmp' && !(window.__v3 && window.__v3.active())) openSheet(TABLES.muscleCmp); }, 700); } },
    tick(dt, t, a){ a.all('.dHi').forEach(e => e.style.filter = `drop-shadow(0 0 ${n2(3 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4)))}px #ffd166)`); }
  };
}
