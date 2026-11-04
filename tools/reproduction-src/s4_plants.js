/* ══════════════════════════════════════════════════════════════════════════
   4.4 · التكاثر في النباتات — ملزمة ص42–52: طرق التكاثر، تعاقب الأجيال
         (شكل 3-11)، دورة حياة البوليتراكم (ص47)، دورة حياة السرخس (ص48)
   الترميز اللوني: بنفسجي = 2س (الطور البوغي) · برتقالي = س (الطور المشيجي)
   ══════════════════════════════════════════════════════════════════════════ */
const PL_VIEWS = [
  { id: 'plvWays', label: 'التكاثر في النباتات' },
  { id: 'plvAlt',  label: 'تعاقب الأجيال' },
  { id: 'plvMoss', label: 'دورة حياة الحزاز' },
  { id: 'plvFern', label: 'دورة حياة السرخس' }
];
const PL = { di: '#b48cff', diL: '#e6d8ff', diD: '#6a44c4', ha: '#ffb547', haL: '#ffe6b0', haD: '#b8650f', zy: '#7f8cff',
  leaf: '#62c94a', leafL: '#c8f5ad', leafD: '#2f7d2b', soil: '#8d5a35', arr: '#ff7a52', water: '#8fd6ff', brown: '#9a6a44' };

SCENES.plants1 = {
  title: 'الحزازيات والسرخسيات',
  get src(){ return ({ plvWays: 'ملزمة ص42–45', plvAlt: 'ملزمة ص42–45', plvMoss: 'ملزمة ص45–47', plvFern: 'ملزمة ص48–50' })[SEL.plv] || 'ملزمة ص42'; },
  tint: ['rgba(90,150,80,.24)', 'rgba(130,100,190,.16)'],
  /* المخطّطان (الطرق وتعاقب الأجيال) بلا مجسّم */
  model3d: () => 'pl_' + (PL_VIEWS.some(x => x.id === SEL.plv) ? SEL.plv : 'plvAlt'),
  build(){
    const v = PL_VIEWS.some(x => x.id === SEL.plv) ? SEL.plv : 'plvAlt';
    const s = v === 'plvWays' ? plWays() : v === 'plvMoss' ? plMoss() : v === 'plvFern' ? plFern() : plAlt();
    s.rebuildOnRadio = 'plv';
    s.tools = PL_VIEWS.map(x => ({ id: x.id, label: x.label, radio: 'plv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.pl_ways = { title: 'طرق التكاثر في النباتات', build: () => plWays() };
SCENES.pl_alt  = { title: 'شكل (3-11) تعاقب الأجيال في تكاثر النبات', build: still => plAlt(still) };
SCENES.pl_moss = { title: 'دورة حياة البوليتراكم (الحزازيات)', build: still => plMoss(still) };
SCENES.pl_fern = { title: 'دورة حياة السرخس (البوليبوديوم)', build: still => plFern(still) };

/* ───────── أدوات مشتركة ───────── */
const plDefs = () => `<defs>
  <radialGradient id="plGDi" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#f3ecff"/><stop offset="45%" stop-color="#b48cff"/><stop offset="100%" stop-color="#5a36b0"/></radialGradient>
  <radialGradient id="plGHa" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#fff4d6"/><stop offset="45%" stop-color="#ffb547"/><stop offset="100%" stop-color="#a95a0c"/></radialGradient>
  <radialGradient id="plGZy" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#eef0ff"/><stop offset="45%" stop-color="#8b8fff"/><stop offset="100%" stop-color="#3b3aa8"/></radialGradient>
  <radialGradient id="plGLeaf" cx="40%" cy="30%" r="80%"><stop offset="0%" stop-color="#cfffb8"/><stop offset="55%" stop-color="#5fc04a"/><stop offset="100%" stop-color="#28702a"/></radialGradient>
  <linearGradient id="plGSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b9824f"/><stop offset="100%" stop-color="#5e381c"/></linearGradient>
</defs>`;
const plBall = (x, y, r, g, sw) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="url(#${g})" stroke="rgba(255,255,255,.6)" stroke-width="${sw || 1.2}"/>`;
/* عنقود كرات (جسم متعدد الخلايا كما في شكل 3-11) */
function plCluster(cx, cy, R, r, g, seed){
  const rr = rng(seed), pts = []; let row = 0;
  for (let y = -R; y <= R + 0.1; y += r * 1.45, row++)
    for (let x = -R; x <= R + 0.1; x += r * 1.6){
      const xx = x + (row % 2 ? r * 0.8 : 0);
      if ((xx * xx) / (R * R) + (y * y) / (R * R * 0.72) <= 1) pts.push([cx + xx + (rr() - 0.5) * 3, cy + y * 0.85 + (rr() - 0.5) * 3]);
    }
  pts.sort((a, b) => a[1] - b[1]);
  return pts.map(p => plBall(p[0], p[1], r, g)).join('');
}
/* كتابة قصيرة داخل الرسم (تُرسم بالقلم في وضع الرسم اليدوي) */
const plTxt = (x, y, s, col, size) => `<text x="${n2(x)}" y="${n2(y)}" text-anchor="middle" font-size="${size || 14}" font-weight="700" fill="${col}">${s}</text>`;
/* شارة المجموعة الكروموسومية: بنفسجية 2س / برتقالية س */
const plChip = (x, y, di) => `<g><rect x="${n2(x - 15)}" y="${n2(y - 10)}" width="30" height="19" rx="9.5" fill="${di ? PL.diD : PL.haD}" stroke="${di ? PL.diL : PL.haL}" stroke-width="1.2"/>` +
  `<text x="${n2(x)}" y="${n2(y + 4.6)}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">${di ? '2س' : 'س'}</text></g>`;
/* رأس سهم عند (x,y) قادم من (fx,fy) */
const plHead = (x, y, fx, fy, col, h) => { h = h || 11; let dx = x - fx, dy = y - fy; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const bx = x - dx * h, by = y - dy * h, nx = -dy * h * 0.48, ny = dx * h * 0.48;
  return `<path d="M${n2(x)},${n2(y)} L${n2(bx + nx)},${n2(by + ny)} L${n2(bx - nx)},${n2(by - ny)}Z" fill="${col}"/>`; };
/* سهم منحنٍ (منحنى تربيعي) */
const plCurve = (x0, y0, cx, cy, x1, y1, col, w, dash) => { let dx = x1 - cx, dy = y1 - cy; const L = Math.hypot(dx, dy) || 1;
  const ex = x1 - dx / L * 6, ey = y1 - dy / L * 6;
  return `<path d="M${n2(x0)},${n2(y0)} Q${n2(cx)},${n2(cy)} ${n2(ex)},${n2(ey)}" fill="none" stroke="${col}" stroke-width="${w || 3}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` + plHead(x1, y1, cx, cy, col); };
/* سهم على قوس دائري (الزاوية من الأعلى باتجاه عقارب الساعة) */
const plArc = (cx, cy, r, t1, t2, col) => { const P = t => { const a = (t - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const p1 = P(t1), pe = P(t2 - 2.2), p2 = P(t2), pb = P(t2 - 6);
  return `<path d="M${n2(p1[0])},${n2(p1[1])} A${r},${r} 0 0 1 ${n2(pe[0])},${n2(pe[1])}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>` + plHead(p2[0], p2[1], pb[0], pb[1], col, 13); };
/* سهم على قوس بيضوي */
const plEll = (cx, cy, rx, ry, t1, t2, col) => { const P = t => { const a = t * Math.PI / 180; return [cx + rx * Math.sin(a), cy - ry * Math.cos(a)]; };
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(P(t1 + (t2 - 3 - t1) * i / 10));
  const p2 = P(t2), pb = P(t2 - 6);
  return `<path d="${smoothOpen(pts)}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>` + plHead(p2[0], p2[1], pb[0], pb[1], col, 13); };
/* ورقة رمحية من (x0,y0) باتجاه ang بطول L */
const plLeaf = (x0, y0, ang, L, w, fill, stroke) => { const c = Math.cos(ang), s = Math.sin(ang), tx = x0 + c * L, ty = y0 + s * L,
    mx = x0 + c * L * 0.45, my = y0 + s * L * 0.45, px = -s * w, py = c * w;
  return `<path d="M${n2(x0)},${n2(y0)} Q${n2(mx + px)},${n2(my + py)} ${n2(tx)},${n2(ty)} Q${n2(mx - px)},${n2(my - py)} ${n2(x0)},${n2(y0)}Z" fill="${fill}" stroke="${stroke}" stroke-width=".8"/>`; };
/* نقطة على منحنى تربيعي ومماسه */
const plQ = (p0, c, p1, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
const plQd = (p0, c, p1, t) => [2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1])];
/* مفتاح الألوان */
const plLegend = () => `<g><rect x="22" y="582" width="210" height="54" rx="10" fill="rgba(0,0,0,.28)" stroke="rgba(255,255,255,.16)"/>
  <circle cx="212" cy="600" r="7.5" fill="url(#plGDi)"/><text class="cap sm" x="114" y="605" text-anchor="middle">2س · الطور البوغي</text>
  <circle cx="212" cy="622" r="7.5" fill="url(#plGHa)"/><text class="cap sm" x="114" y="627" text-anchor="middle">س · الطور المشيجي</text></g>`;
/* إظهار المراحل: الحالية تتوهج، السابقة كاملة، اللاحقة باهتة (الدورة تعود) */
const plStg = (a, cur, k, still) => a.all('[data-st]').forEach(e => { const s = +e.dataset.st;
  e.setAttribute('opacity', still ? 1 : s === cur ? n2(Math.min(1, 0.3 + k * 4)) : s < cur ? 1 : 0.22);
  e.classList.toggle('stNow', !still && s === cur); });
const plExam = still => !still && document.body.classList.contains('examMode');

/* ───────── 1) التكاثر في النباتات — ص42–45 ───────── */
function plWays(){
  const box = (x, y, w, h, title, lines, col, sub) => {
    const L = lines || [], top = y - h / 2;
    const ty = L.length ? top + 26 : y + (sub ? -2 : 6);
    return `<rect x="${n2(x - w / 2)}" y="${n2(top)}" width="${w}" height="${h}" rx="12" fill="${col}" fill-opacity=".18" stroke="${col}" stroke-width="2"/>` +
      `<text x="${x}" y="${n2(ty)}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff4dc">${title}</text>` +
      (sub ? `<text x="${x}" y="${n2(ty + 20)}" text-anchor="middle" font-size="12.5" fill="#e4dccd">${sub}</text>` : '') +
      L.map((l, i) => `<text x="${x}" y="${n2(top + 54 + i * 23)}" text-anchor="middle" font-size="13.5" fill="#dfe9d6">${l}</text>`).join(''); };
  const ln = d => `<path d="${d}" fill="none" stroke="#c9d3c0" stroke-width="2.2" opacity=".75"/>`;
  /* نبتة صغيرة وطحلب أخضر في الوسط */
  const sprout = `<g><path d="M500,190 Q498,150 502,112" stroke="${PL.leafD}" stroke-width="4" fill="none"/>
    ${plLeaf(501, 150, -2.6, 42, 12, 'url(#plGLeaf)', PL.leafL)}${plLeaf(502, 132, -0.5, 40, 11, 'url(#plGLeaf)', PL.leafL)}${plLeaf(502, 114, -1.75, 26, 8, 'url(#plGLeaf)', PL.leafL)}
    <ellipse cx="500" cy="194" rx="46" ry="11" fill="url(#plGSoil)"/></g>`;
  const body = plDefs() + `
    ${part('plAlgae', box(210, 140, 340, 166, 'أوجه الشبه مع الطحالب الخضر', ['1. الكلوروفيل والصبغات الإضافية', '2. خزن الكاربوهيدرات الزائدة بشكل نشا', '3. جدران خلوية تحوي السليلوز', 'انحدرت النباتات الأرضية منها قبل 500 مليون سنة'], '#4fb6a0'))}
    ${part('plKingdom', box(790, 140, 320, 166, 'عالم النباتات — مميزاته', ['1. حقيقية النواة', '2. متعددة الخلايا', '3. ذاتية التغذية لاحتوائها على الكلوروفيل'], '#6fcf4f'))}
    ${sprout}${gArrow(452, 150, 392, 150, '#9fd8c8')}${gArrow(548, 150, 622, 150, '#9fd8c8')}
    ${ln('M500,308 L500,336 M270,336 L730,336 M270,336 L270,357 M730,336 L730,350')}
    ${ln('M270,403 L270,420 M150,420 L350,420 M150,420 L150,447 M350,420 L350,447 M350,493 L350,512 M290,512 L410,512 M290,512 L290,538 M410,512 L410,538')}
    ${ln('M730,410 L730,428 M540,428 L860,428 M540,428 L540,452 M700,428 L700,452 M860,428 L860,452')}
    ${part('plWays', box(500, 285, 280, 46, 'طرق التكاثر في النباتات', null, '#ffd166'))}
    ${part('plAltGen', box(730, 380, 320, 60, 'ظاهرة تعاقب الأجيال', null, PL.di, 'طور لا جنسي (2س) وطور جنسي (س)'))}
    ${part('plAsexP', box(270, 380, 220, 46, 'تكاثر لا جنسي', null, '#7fb2ff'))}
    ${part('plVeg', box(350, 470, 170, 46, 'تكاثر خضري', null, '#7fb2ff') + box(410, 560, 110, 40, 'طبيعي', null, '#7fb2ff') + box(290, 560, 110, 40, 'اصطناعي', null, '#7fb2ff'))}
    ${part('plTissue', box(150, 470, 180, 46, 'الزراعة النسيجية', null, '#7fb2ff'))}
    ${part('plMossG', box(860, 480, 150, 56, 'الحزازيات', null, PL.leaf, 'البوليتراكم'))}
    ${part('plFernG', box(700, 480, 150, 56, 'السرخسيات', null, PL.leaf, 'البوليبوديوم'))}
    ${part('plFlowerG', box(540, 480, 150, 56, 'النباتات الزهرية', null, '#f28fb8', 'مغطاة البذور'))}
    ${part('plTrend', `<path d="M935,560 L500,546 L500,566 Z" fill="${PL.di}" opacity=".85"/><path d="M935,574 L935,598 L500,588 Z" fill="${PL.ha}" opacity=".85"/>
      <text x="718" y="543" text-anchor="middle" font-size="12.5" fill="${PL.diL}">الطور البوغي يزداد حجمه ←</text>
      <text x="718" y="614" text-anchor="middle" font-size="12.5" fill="${PL.haL}">الطور المشيجي يختزل حجمه ←</text>`)}
    <text class="cap sm" x="500" y="650" text-anchor="middle">طرق التكاثر في النباتات (ص42) — وسنتناول ثلاثة أمثلة: الحزازيات، السرخسيات، النباتات الزهرية (ص45)</text>`;
  return {
    body, parts: [], fnParts: ['plWays', 'plAltGen', 'plTrend'],
    tools: [{ id: 'info:plAltGen', label: 'ما تعاقب الأجيال؟' }, { id: 'info:plTrend', label: 'لماذا يختزل الطور المشيجي؟' }, { id: 'tbl:plAltTbl', label: 'البوغي × المشيجي (ص43)' }],
    hint: 'اضغط أي مربع لتظهر معلوماته من الملزمة.'
  };
}

/* ───────── 2) تعاقب الأجيال — شكل (3-11) ص43 ───────── */
const PL_ALT_ST = [
  { n: '1 · الطور البوغي (2س)', d: 'طور لا جنسي خلاياه ذات عدد كروموسومي كامل (2س) وتنتج فيه الأبواغ. ينشأ من الزيجة ويبدأ بعد الإخصاب.' },
  { n: '2 · الحافظة البوغية (2س)', d: 'يكوّن الطور البوغي الحافظات البوغية (2س)، وفيها يحدث الانقسام الاختزالي.' },
  { n: '3 · الانقسام الاختزالي', d: 'داخل الحافظة البوغية يحدث الانقسام الاختزالي فتنتج الأبواغ (س)؛ لذلك تحوي الأبواغ نصف عدد الكروموسومات. هنا ينتهي الطور البوغي.' },
  { n: '4 · البوغ (س)', d: 'البوغ خلية تكاثرية لاجنسية (س)؛ ينمو وينقسم انقساماً اعتيادياً (خيطياً) فيبدأ الطور المشيجي.' },
  { n: '5 · الطور المشيجي (س)', d: 'طور جنسي خلاياه تحوي نصف العدد الكامل من الكروموسومات (س) وتنتج فيه الأمشاج. ينشأ من الأبواغ.' },
  { n: '6 · الأمشاج (س)', d: 'تتكون الأمشاج الذكرية والأنثوية (س) بالانقسام الخيطي في الطور المشيجي، وهي خلايا تكاثرية جنسية.' },
  { n: '7 · الإخصاب', d: 'تتحد الأمشاج الذكرية والأنثوية بعملية الإخصاب فتتكون الزيجة؛ ينتهي الطور المشيجي ويعود العدد الكامل (2س).' },
  { n: '8 · الزيجة (2س)', d: 'تنقسم الزيجة انقسامات اعتيادية (خيطية) فينشأ منها طور بوغي جديد (2س) وتعود الدورة.' }
];
function plAlt(still){
  const C = [560, 340], R = 200, hide = plExam(still);
  const pos = th => { const a = (th - 90) * Math.PI / 180; return [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)]; };
  const P = [0, 45, 90, 135, 180, 225, 270, 315].map(pos);
  const ARR = PL.arr, MIT = '#e9e4f5';
  const arr = (i, col) => `<g data-st="${(i + 1) % 8}">${plArc(C[0], C[1], R, i * 45 + 15, (i + 1) * 45 - 15, col)}</g>`;
  /* رمز الانقسام الخيطي على القوس: خلية تنشطر إلى خليتين */
  const mGlyph = th => { const p = pos(th); return `<g><circle cx="${n2(p[0] - 5)}" cy="${n2(p[1])}" r="6.5" fill="#2b2440" stroke="${MIT}" stroke-width="1.8"/><circle cx="${n2(p[0] + 5)}" cy="${n2(p[1])}" r="6.5" fill="#2b2440" stroke="${MIT}" stroke-width="1.8"/></g>`; };
  const mTxt = th => { const a = (th - 90) * Math.PI / 180; return plTxt(C[0] + (R + 32) * Math.cos(a), C[1] + (R + 32) * Math.sin(a) + 5, 'انقسام خيطي', MIT, 13); };
  const bg = `<path d="M${C[0] - R},${C[1]} A${R},${R} 0 0 1 ${C[0] + R},${C[1]} Z" fill="${PL.di}" opacity=".09"/>
    <path d="M${C[0] - R},${C[1]} A${R},${R} 0 0 0 ${C[0] + R},${C[1]} Z" fill="${PL.ha}" opacity=".09"/>
    <line x1="${C[0] - R + 42}" y1="${C[1]}" x2="${C[0] + R - 42}" y2="${C[1]}" stroke="#d8cfe6" stroke-width="2" stroke-dasharray="7 5"/>
    <text class="cap sm" x="${C[0]}" y="${C[1] - 14}" text-anchor="middle" fill="${PL.diL}">عدد كروموسومات كامل 2س</text>
    <text class="cap sm" x="${C[0]}" y="${C[1] + 26}" text-anchor="middle" fill="${PL.haL}">نصف العدد الكامل للكروموسومات س</text>`;
  const sp = P[1];
  const items = `
    ${part('plSporo', `<g data-st="0">${plCluster(P[0][0], P[0][1], 34, 9.5, 'plGDi', 7)}${plTxt(P[0][0] + 52, P[0][1] + 5, '2س', PL.diL)}</g>`)}
    ${part('plSporang', `<g data-st="1">${arr(0, ARR)}<path d="M${n2(sp[0] - 4)},${n2(sp[1] + 30)} Q${n2(sp[0] - 2)},${n2(sp[1] + 18)} ${n2(sp[0])},${n2(sp[1] + 12)}" stroke="${PL.diD}" stroke-width="4" fill="none"/>
      <ellipse cx="${n2(sp[0])}" cy="${n2(sp[1] - 4)}" rx="17" ry="21" fill="url(#plGDi)" stroke="${PL.diL}" stroke-width="2"/>
      ${[[-6, -12], [5, -10], [-7, 0], [6, 2], [0, -4], [-2, 9], [7, 11]].map(([dx, dy]) => `<circle cx="${n2(sp[0] + dx)}" cy="${n2(sp[1] - 4 + dy)}" r="3.2" fill="#e9dcff" stroke="${PL.diD}" stroke-width=".8"/>`).join('')}
      ${plTxt(sp[0] - 44, sp[1] - 2, '2س', PL.diL)}</g>`)}
    ${part('plMeio', `<g data-st="2">${arr(1, ARR)}<rect x="${P[2][0] - 40}" y="${P[2][1] - 19}" width="80" height="38" rx="8" fill="#1d1830" stroke="#ffe08a" stroke-width="2.2"/>
      ${plBall(P[2][0] - 22, P[2][1], 9, 'plGDi')}${plHead(P[2][0] + 4, P[2][1], P[2][0] - 10, P[2][1], '#ffe08a', 9)}
      ${[[-5, -5], [5, -5], [-5, 5], [5, 5]].map(([dx, dy]) => plBall(P[2][0] + 20 + dx, P[2][1] + dy, 4.2, 'plGHa', 0.8)).join('')}</g>`)}
    ${part('plSpore', `<g data-st="3">${arr(2, ARR)}${plBall(P[3][0], P[3][1], 12, 'plGHa', 1.6)}${plTxt(P[3][0] + 30, P[3][1] + 5, 'س', PL.haL)}</g>`)}
    ${part('plMito', `<g data-st="4">${arr(3, MIT)}${mGlyph(157.5)}</g><g data-st="5">${arr(4, MIT)}${mGlyph(202.5)}</g><g data-st="7">${arr(7, MIT)}${mGlyph(337.5)}</g>
      ${hide ? '' : `<g data-st="4">${mTxt(157.5)}</g><g data-st="5">${mTxt(202.5)}</g>`}`)}
    ${part('plGameto', `<g data-st="4">${plCluster(P[4][0], P[4][1], 34, 9.5, 'plGHa', 11)}${plTxt(P[4][0], P[4][1] - 46, 'س', PL.haL)}</g>`)}
    ${part('plGametes', `<g data-st="5">${plBall(P[5][0] - 13, P[5][1] + 6, 11, 'plGHa', 1.4)}${plBall(P[5][0] + 13, P[5][1] - 6, 11, 'plGHa', 1.4)}
      ${plTxt(P[5][0] - 16, P[5][1] + 36, 'س', PL.haL, 13)}${plTxt(P[5][0] + 30, P[5][1] + 18, 'س', PL.haL, 13)}</g>`)}
    ${part('plFert', `<g data-st="6">${arr(5, ARR)}<rect x="${P[6][0] - 40}" y="${P[6][1] - 19}" width="80" height="38" rx="8" fill="#1d1830" stroke="#ffe08a" stroke-width="2.2"/>
      ${plBall(P[6][0] - 24, P[6][1] - 7, 5.5, 'plGHa', 0.8)}${plBall(P[6][0] - 24, P[6][1] + 8, 5.5, 'plGHa', 0.8)}${plHead(P[6][0] + 6, P[6][1], P[6][0] - 10, P[6][1], '#ffe08a', 9)}
      ${plBall(P[6][0] + 22, P[6][1], 9, 'plGZy')}</g>`)}
    ${part('plZyg', `<g data-st="7">${arr(6, '#e9e4f5')}${plBall(P[7][0], P[7][1], 15, 'plGZy', 1.8)}${plTxt(P[7][0] - 2, P[7][1] - 24, '2س', PL.diL)}</g>`)}`;
  const tok = still ? '' : `<g id="plTok" opacity="0" pointer-events="none"><circle r="13" fill="#fff" opacity=".25"/><circle id="plTokC" r="7" fill="${PL.di}" stroke="#fff" stroke-width="2"/></g>`;
  const body = plDefs() + `${bg}${items}${tok}${plLegend()}
    <text class="cap sm" x="560" y="650" text-anchor="middle">شكل (3-11): تعاقب الأجيال في تكاثر النبات — طور بوغي لا جنسي (2س) يتعاقب مع طور مشيجي جنسي (س)</text>`;
  const ctl = stageCtl(PL_ALT_ST, { dur: 32 });
  const mp = pos(337.5);
  return {
    body, stages: PL_ALT_ST, fnParts: ['plMeio', 'plFert', 'plMito'],
    parts: [
      { id: 'plSporo', anchor: [P[0][0] + 14, P[0][1] - 30], label: [650, 66], side: 'C', short: 'الطور البوغي 2س' },
      { id: 'plSporang', anchor: [sp[0] + 17, sp[1] - 6], label: [866, sp[1] - 6], side: 'R', short: 'حافظة بوغية 2س' },
      { id: 'plMeio', anchor: [P[2][0] + 40, P[2][1]], label: [866, P[2][1]], side: 'R' },
      { id: 'plSpore', anchor: [P[3][0] + 12, P[3][1]], label: [866, P[3][1]], side: 'R', short: 'بوغ س' },
      { id: 'plGameto', anchor: [P[4][0], P[4][1] + 30], label: [P[4][0], 610], side: 'C', short: 'الطور المشيجي س' },
      { id: 'plGametes', anchor: [P[5][0] - 22, P[5][1] + 10], label: [134, P[5][1] + 10], side: 'L', short: 'أمشاج س' },
      { id: 'plFert', anchor: [P[6][0] - 40, P[6][1]], label: [134, P[6][1]], side: 'L' },
      { id: 'plZyg', anchor: [P[7][0] - 10, P[7][1] - 10], label: [360, 128], side: 'C', short: 'زيجة 2س' },
      { id: 'plMito', anchor: [mp[0] - 6, mp[1] - 6], label: [450, 66], side: 'C' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:plAltTbl', label: 'البوغي × المشيجي (ص43)' }, { id: 'tbl:plOriginTbl', label: 'المنشأ والمجموعة الكروموسومية' }, { id: 'info:plAltGen', label: 'عن تعاقب الأجيال' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      plStg(a, STG.idx, STG.k, still);
      const g = a.el('#plTok'); if (!g) return;
      const th = (STG.idx + Math.min(1, STG.k * 1.15)) * 45, p = pos(th);
      g.setAttribute('opacity', 1); g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1])})`);
      const c = a.el('#plTokC'); if (c) c.setAttribute('fill', p[1] > C[1] + 0.5 ? PL.ha : th % 360 > 300 ? PL.zy : PL.di);
    }
  };
}

/* ───────── 3) دورة حياة البوليتراكم — ص45–47 ───────── */
const PL_MOSS_ST = [
  { n: '1 · الطور المشيجي الناضج (س)', d: 'في الطور المشيجي الناضج للبوليتراكم يحمل الساق الورقي إما أنثريديا (حافظة مشيجية ذكرية) أو أركيكونيا (حافظة مشيجية أنثوية)، وكلاهما يحمل أمشاجاً.' },
  { n: '2 · أمشاج ذكرية سابحة', d: 'تخرج الأمشاج الذكرية من الأنثريديوم سابحة في الماء لتصل إلى الأركيكونيوم، ويحصل الإخصاب باندماج النوى الذكرية مع الأنثوية.' },
  { n: '3 · الزيجة (2س)', d: 'بعد الإخصاب تتكون الزيجة (الزايكوت)، ويتكون الطور البوغي داخل الحافظة المشيجية الأنثوية (الأركيكونيوم).' },
  { n: '4 · الطور البوغي (2س)', d: 'يكتمل الطور البوغي وله حامل وحافظة عليا هي حافظة الأبواغ، وفيها يحصل الانقسام الاختزالي فتنتج الأبواغ (س).' },
  { n: '5 · تحرر الأبواغ (س)', d: 'تتحرر الأبواغ بعد أن يُفتح غطاء الحافظة بفعل الرياح، ثم تنتشر مع تيار الرياح.' },
  { n: '6 · خيوط أولية (س)', d: 'تنبت الأبواغ إلى خيوط أولية ذكرية أو أنثوية، وهي أول مرحلة من مراحل الطور المشيجي، ثم تتحول إلى نباتات مشيجية.' }
];
/* نبات حزاز ورقي (طور مشيجي): ساق + أوراق رمحية + أشباه جذور */
function plLeafy(x, yb, h, s, seed, lean){
  const r = rng(seed), top = [x + (lean || 0), yb - h], c = [x + (lean || 0) * 0.2 + (r() - 0.5) * 6, yb - h * 0.5], b = [x, yb];
  let lv = '', rz = '';
  const n = Math.max(5, Math.round(h / 8));
  for (let i = 0; i < n; i++){
    const t = 0.06 + 0.92 * i / (n - 1), p = plQ(b, c, top, t);
    const L = (11 + 12 * Math.sin(Math.PI * Math.min(1, 0.25 + t))) * s;
    [-1, 1].forEach(sd => { const ang = -Math.PI / 2 + sd * (0.95 - t * 0.45 + r() * 0.2);
      lv += plLeaf(p[0], p[1], ang, L, 2.6 * s, i % 3 ? PL.leaf : '#7bd85c', PL.leafL); });
  }
  for (let i = 0; i < 5; i++){ const a = Math.PI / 2 + (i - 2) * 0.35;
    rz += `<path d="M${n2(x)},${n2(yb)} q${n2(Math.cos(a) * 8 * s + (r() - 0.5) * 6)},${n2(9 * s)} ${n2(Math.cos(a) * 16 * s)},${n2(Math.sin(a) * 17 * s)}" fill="none" stroke="#c9a57a" stroke-width="1.3"/>`; }
  return `${rz}<path d="M${n2(b[0])},${n2(b[1])} Q${n2(c[0])},${n2(c[1])} ${n2(top[0])},${n2(top[1])}" fill="none" stroke="${PL.leafD}" stroke-width="${n2(3 * s)}"/>${lv}`;
}
/* خيط أولي متفرع */
function plProto(x, y, s, seed){
  const r = rng(seed), main = [];
  for (let i = 0; i <= 6; i++) main.push([x - 42 * s + i * 14 * s, y + Math.sin(i * 1.3) * 4 * s + (r() - 0.5) * 3]);
  let br = '', dots = '';
  [1, 2, 4, 5].forEach((k, j) => { const p = main[k], up = j % 2 ? -1 : 1, L = (16 + r() * 10) * s;
    const q = [p[0] + (r() - 0.3) * 14 * s, p[1] - up * L];
    br += `<path d="M${n2(p[0])},${n2(p[1])} Q${n2(p[0] + 6 * s)},${n2(p[1] - up * L * 0.5)} ${n2(q[0])},${n2(q[1])}" fill="none" stroke="#86dd62" stroke-width="${n2(2.4 * s)}" stroke-linecap="round"/>`;
    dots += `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="${n2(3.4 * s)}" fill="${PL.leafD}" stroke="${PL.leafL}" stroke-width=".8"/>`; });
  main.forEach((p, i) => { if (i % 2) dots += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${n2(2.2 * s)}" fill="#2a6a28"/>`; });
  return `<path d="${smoothOpen(main)}" fill="none" stroke="#86dd62" stroke-width="${n2(2.8 * s)}" stroke-linecap="round"/>${br}${dots}`;
}
/* كأس قمي مكبّر (رأس الأنثريديا / الأركيكونيا) */
function plCup(x, y, col, colL){
  let s = ''; for (let i = 0; i < 9; i++){ const a = -Math.PI + 0.25 + i * (Math.PI - 0.5) / 8; s += plLeaf(x, y, a, 46 - Math.abs(i - 4) * 3, 7, col, colL); }
  return s + `<path d="M${x - 8},${y + 2} Q${x},${y + 26} ${x + 8},${y + 2}" fill="${col}" stroke="${colL}" stroke-width="1"/>`;
}
/* أركيكونيوم: قارورة ذات عنق وبطن */
const plFlask = (x, y, s, fill, stroke) => `<path d="M${n2(x - 2 * s)},${n2(y - 27 * s)} L${n2(x - 2.6 * s)},${n2(y - 9 * s)} C${n2(x - 8.5 * s)},${n2(y - 8 * s)} ${n2(x - 8.5 * s)},${n2(y + 10 * s)} ${n2(x)},${n2(y + 11 * s)} C${n2(x + 8.5 * s)},${n2(y + 10 * s)} ${n2(x + 8.5 * s)},${n2(y - 8 * s)} ${n2(x + 2.6 * s)},${n2(y - 9 * s)} L${n2(x + 2 * s)},${n2(y - 27 * s)}Z" fill="${fill}" stroke="${stroke}" stroke-width="${n2(Math.max(1, 0.7 * s))}"/>`;
function plMoss(still){
  const A = PL.arr;
  /* النبات الأيسر: طور مشيجي أنثوي يحمل الطور البوغي (حامل + حافظة) */
  const LX = 340, LB = 585, LT = 385;
  const seta = `<path d="M${LX},${LT + 4} Q${LX - 14},${LT - 100} ${LX + 12},${LT - 196}" fill="none" stroke="#a782d8" stroke-width="4.2" stroke-linecap="round"/>`;
  const caps = `<g transform="rotate(-28 ${LX + 24} ${LT - 207})">
      <ellipse cx="${LX + 24}" cy="${LT - 207}" rx="25" ry="11.5" fill="url(#plGDi)" stroke="${PL.diL}" stroke-width="1.8"/>
      <path d="M${LX + 2},${LT - 210} Q${LX + 14},${LT - 226} ${LX + 30},${LT - 219}" fill="none" stroke="#e2c79a" stroke-width="3"/>
      <g id="plMLid"><path d="M${LX + 48},${LT - 214} Q${LX + 58},${LT - 207} ${LX + 48},${LT - 200} Z" fill="#c9a3ff" stroke="${PL.diL}" stroke-width="1.4"/></g></g>`;
  /* الأبواغ: غبار يتطاير + أبواغ مكبرة */
  let dust = ''; for (let i = 0; i < 16; i++) dust += `<circle class="plDust" data-i="${i}" cx="${400 + i * 7}" cy="${160 - i * 1.5}" r="2.6" fill="#3f8a3a" stroke="#c8f5ad" stroke-width=".6"/>`;
  const bigSp = [[536, 140], [566, 182], [604, 146]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="7" fill="#2f6a2c" stroke="${PL.leafL}" stroke-width="1.4"/>`).join('');
  /* أمشاج ذكرية سابحة على قوس من الأنثريديا إلى الأركيكونيا */
  const S0 = [588, 384], SC = [522, 292], S1 = [462, 384];
  let sperms = ''; for (let i = 0; i < 6; i++){ const q = plQ(S0, SC, S1, i / 6); sperms += `<g class="plSw" data-i="${i}" transform="translate(${n2(q[0])},${n2(q[1])})"><circle r="3.4" fill="#e3f4ff" stroke="#4a8fd0" stroke-width="1"/></g>`; }
  const swimArc = `<path d="M${S0[0]},${S0[1]} Q${SC[0]},${SC[1]} ${S1[0] + 5},${S1[1] - 6}" fill="none" stroke="${PL.water}" stroke-width="9" opacity=".35" stroke-linecap="round"/>` + plHead(S1[0], S1[1], SC[0], SC[1], PL.water, 16);
  const body = plDefs() + `
    ${part('plMLeaf', `<g class="plSway" data-cx="${LX}" data-cy="${LB}">${plLeafy(LX, LB, LB - LT, 1, 3, -4)}</g>`)}
    ${part('plMSeta', `<g data-st="3">${seta}</g>`)}
    ${part('plMCaps', `<g data-st="3">${caps}${plChip(LX - 22, LT - 236, true)}</g>`)}
    ${part('plMSpores', `<g data-st="4" id="plMDust">${dust}</g><g data-st="4">${bigSp}${plChip(566, 112, false)}</g>`)}
    <g data-st="5">${gArrow(618, 160, 640, 182, A)}</g>
    ${part('plMProto', `<g data-st="5">${plProto(722, 168, 1, 5)}${plProto(652, 236, 0.9, 9)}
      ${plTxt(784, 196, 'ذكرية', PL.leafL, 12.5)}${plTxt(612, 270, 'أنثوية', PL.leafL, 12.5)}${plChip(726, 128, false)}</g>`)}
    <g data-st="5">${gArrow(770, 205, 782, 250, A)}
      <g>${plLeafy(752, 330, 52, 0.55, 21, 2)}${plLeafy(800, 330, 60, 0.6, 22, -2)}</g>${gArrow(822, 332, 826, 372, A)}</g>
    ${part('plMMature', `<g data-st="0"><g class="plSway" data-cx="700" data-cy="590">${plLeafy(700, 590, 186, 0.95, 31, 3)}
        ${[-2.6, -2.2, -1.85, -1.57, -1.3, -0.95, -0.55].map(a => plLeaf(703, 404, a, 17, 4, '#f2b33d', '#ffe3a0')).join('')}</g>
      <g class="plSway" data-cx="790" data-cy="590">${plLeafy(790, 590, 200, 0.95, 37, -3)}
        ${[-2.2, -1.9, -1.57, -1.25, -0.95].map(a => plLeaf(787, 392, a, 13, 3.4, '#4fae3e', PL.leafL)).join('')}</g>${plChip(830, 520, false)}</g>`)}
    <g data-st="0"><line x1="690" y1="402" x2="628" y2="402" stroke="#d6d6d6" stroke-width="1.3" opacity=".7"/></g>
    ${part('plMAnth', `<g data-st="0">${plCup(590, 420, '#efc35a', '#ffe7a8')}
      ${[[-16, -10, -0.35], [-6, -16, -0.12], [6, -16, 0.12], [16, -10, 0.35]].map(([dx, dy, r]) => `<ellipse cx="${590 + dx}" cy="${420 + dy}" rx="4.8" ry="13" transform="rotate(${n2(r * 57.3)} ${590 + dx} ${420 + dy})" fill="#ff9b3d" stroke="#ffd59a" stroke-width="1"/>`).join('')}</g>`)}
    ${part('plMArch', `<g data-st="0">${plCup(455, 420, '#5fc04a', PL.leafL)}
      ${[[-14, 0], [0, -6], [14, 0]].map(([dx, dy]) => plFlask(455 + dx, 412 + dy, 0.75, '#2f8a3a', PL.leafL) + `<circle cx="${455 + dx}" cy="${414 + dy}" r="2.4" fill="${PL.ha}"/>`).join('')}</g>`)}
    ${part('plMSperm', `<g data-st="1">${swimArc}${sperms}</g>`)}
    <g data-st="2">${plCurve(668, 600, 600, 618, 528, 590, A)}</g>
    ${part('plMZyg', `<g data-st="2">${plFlask(480, 562, 2.9, '#3f9a3e', PL.leafL)}${plBall(480, 566, 12, 'plGDi', 1.6)}${plChip(522, 548, true)}</g>`)}
    <g data-st="3">${plCurve(446, 586, 410, 600, 374, 566, A)}</g>
    ${plLegend()}
    <text class="cap sm" x="560" y="652" text-anchor="middle">دورة حياة البوليتراكم (الحزازيات): الطور المشيجي أخضر ورقي، والطور البوغي حامل وحافظة فوقه</text>`;
  const ctl = stageCtl(PL_MOSS_ST, { dur: 30 });
  return {
    body, stages: PL_MOSS_ST, fnParts: ['plMSperm', 'plMCaps'],
    parts: [
      { id: 'plMCaps', anchor: [LX + 30, LT - 214], label: [440, 84], side: 'C' },
      { id: 'plMSpores', anchor: [536, 132], label: [560, 72], side: 'C' },
      { id: 'plMProto', anchor: [752, 162], label: [866, 150], side: 'R' },
      { id: 'plMMature', anchor: [812, 470], label: [866, 470], side: 'R' },
      { id: 'plMAnth', anchor: [600, 432], label: [604, 470], side: 'C' },
      { id: 'plMArch', anchor: [446, 432], label: [440, 470], side: 'C' },
      { id: 'plMSperm', anchor: [522, 338], label: [522, 282], side: 'C' },
      { id: 'plMZyg', anchor: [480, 598], label: [480, 624], side: 'C' },
      { id: 'plMSeta', anchor: [LX - 6, 290], label: [134, 290], side: 'L' },
      { id: 'plMLeaf', anchor: [LX - 16, 470], label: [134, 470], side: 'L' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:plMossTbl', label: 'التركيب والمنشأ (ص46)' }, { id: 'tbl:plArchAnth', label: 'الأركيكونيا × الأنثريديا (ص47)' }, { id: 'info:plMossG', label: 'عن الحزازيات' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      plStg(a, STG.idx, STG.k, still);
      a.all('.plSway').forEach(g => g.setAttribute('transform', `rotate(${n2(Math.sin(t * 0.9 + +g.dataset.cx) * 0.9)} ${g.dataset.cx} ${g.dataset.cy})`));
      /* غطاء الحافظة يُفتح في مرحلة تحرر الأبواغ */
      const lid = a.el('#plMLid'), op = still ? 0 : STG.idx === 4 ? Math.min(1, STG.k * 3) : STG.idx === 5 ? 1 - Math.min(1, STG.k * 2) : 0;
      if (lid) lid.setAttribute('transform', `rotate(${n2(-op * 55)} ${LX + 48} ${LT - 214})`);
      a.all('.plDust').forEach(c => { const i = +c.dataset.i, u = (t * 0.16 + i / 16) % 1;
        c.setAttribute('cx', n2(392 + u * 130)); c.setAttribute('cy', n2(170 - u * 26 + Math.sin(u * 9 + i) * 6)); });
      a.all('.plSw').forEach(g => { const u = (t * 0.2 + +g.dataset.i / 6) % 1, p = plQ(S0, SC, S1, u);
        g.setAttribute('transform', `translate(${n2(p[0])},${n2(p[1] + Math.sin(t * 7 + u * 20) * 3)})`); });
    }
  };
}

/* ───────── 4) دورة حياة السرخس — ص48–50 ───────── */
const PL_FERN_ST = [
  { n: '1 · الطور البوغي السائد (2س)', d: 'الطور البوغي هو السائد في السرخسيات، والحافظة البوغية تتخذ موقعاً على السطح السفلي للأوراق.' },
  { n: '2 · الأبواغ (س)', d: 'تتكون الأبواغ داخل الحافظة البوغية وتكون (س) لأنها ناتجة من انقسام اختزالي، وتتحرر عندما تنفتح الحافظة البوغية.' },
  { n: '3 · الثالوس الأولي (س)', d: 'تنمو الأبواغ إلى طور مشيجي ممثلاً بالثالوس الأولي: تركيب قلبي أخضر يحمل أركيكونيوم وأنثريديوم، وينمو في طرفه المدبب أشباه الجذور.' },
  { n: '4 · الإخصاب', d: 'يحصل الإخصاب بوجود الرطوبة؛ حيث تسبح النطف في الماء لتصل إلى البيضة ضمن الأركيكونيوم.' },
  { n: '5 · الطور البوغي مرئي (2س)', d: 'يتكون الزايكوت داخل الأركيكونيوم، وتظهر أول ورقة فوق الثالوس الأولي ويتكون الجذر تحته، وبذلك يصبح الطور البوغي مرئياً.' }
];
/* سعفة سرخس: محور + وريقات، وترجع مواقع الحوافظ البوغية (على السطح السفلي) */
function plFrond(b, c, tip, s, seed, sori){
  const r = rng(seed); let lv = '', so = ''; const pts = [];
  for (let i = 0; i < 13; i++){
    const t = 0.1 + 0.86 * i / 12, p = plQ(b, c, tip, t), d = plQd(b, c, tip, t), ta = Math.atan2(d[1], d[0]);
    const L = (34 - 24 * t) * s;
    [-1, 1].forEach(sd => { const ang = ta + sd * 1.15; lv += plLeaf(p[0], p[1], ang, L, L * 0.26, i % 2 ? '#5cc046' : '#6fd257', PL.leafL);
      if (sori && i % 2 === 0 && i < 11){ const q = [p[0] + Math.cos(ang) * L * 0.55, p[1] + Math.sin(ang) * L * 0.55];
        pts.push(q); so += `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="${n2(2.6 * s)}" fill="#c9782e" stroke="#ffd3a0" stroke-width=".7"/>`; } });
    if (r() < 0) break;
  }
  return { leaf: `<path d="M${n2(b[0])},${n2(b[1])} Q${n2(c[0])},${n2(c[1])} ${n2(tip[0])},${n2(tip[1])}" fill="none" stroke="#3e8a2e" stroke-width="${n2(3 * s)}"/>${lv}`, sori: so, pts };
}
/* شكل قلبي (الثالوس الأولي) */
const plHeart = (x, y, k) => smoothClosed([[0, -34], [23, -54], [60, -46], [77, -15], [57, 25], [23, 55], [7, 62], [-17, 40], [-57, 12], [-73, -20], [-57, -48], [-23, -52]].map(([dx, dy]) => [x + dx * k, y + dy * k]));
function plFern(still){
  const A = PL.arr, E = [560, 375, 245, 195];
  const f1 = plFrond([296, 512], [236, 400], [276, 268], 1, 4, true), f2 = plFrond([306, 512], [372, 420], [368, 286], 0.95, 6, true),
        f3 = plFrond([312, 514], [404, 512], [418, 410], 0.75, 8, false);
  const soilM = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#plGSoil)" stroke="#d6a676" stroke-width="1.2"/>`;
  const roots = [[-30, 0.4], [-12, 0.2], [8, -0.1], [26, -0.35]].map(([dx, k]) => `<path d="M${300 + dx},${532} q${n2(k * 20)},${14} ${n2(k * 34)},${30}" fill="none" stroke="#e0c08f" stroke-width="1.6"/>`).join('');
  const fern = `<g class="plSway" data-cx="304" data-cy="515">${f3.leaf}${f2.leaf}${f1.leaf}</g>${soilM(300, 522, 66, 18)}${roots}`;
  const sori = f1.sori + f2.sori;
  const soAnc = f1.pts[Math.min(3, f1.pts.length - 1)];
  /* الأبواغ تتطاير */
  let spores = ''; for (let i = 0; i < 14; i++) spores += `<circle class="plFSp" data-i="${i}" cx="${390 + i * 6}" cy="${270 - i * 5}" r="2.8" fill="${PL.ha}" stroke="#fff1cf" stroke-width=".6"/>`;
  /* الثالوس الأولي (مكبّر من الأسفل) */
  const HX = 705, HY = 262;
  const arch = [[-12, -22], [0, -18], [12, -22]].map(([dx, dy]) => `<ellipse cx="${HX + dx}" cy="${HY + dy}" rx="3.2" ry="5" fill="#1f5f22" stroke="#a6e38c" stroke-width=".8"/>`).join('');
  const anth = [[-14, 24], [0, 30], [13, 22], [24, 12]].map(([dx, dy]) => `<circle cx="${HX + dx}" cy="${HY + dy}" r="4" fill="#ffd166" stroke="#fff3c8" stroke-width=".8"/>`).join('');
  let rh = ''; for (let i = 0; i < 9; i++){ const x0 = HX - 4 + i * 4, y0 = HY + 44 + Math.abs(i - 4) * -1.5;
    rh += `<path d="M${x0},${n2(y0)} q${n2((i - 4) * 2)},${14} ${n2((i - 4) * 4 + 3)},${30 + (i % 3) * 5}" fill="none" stroke="#f1e2c3" stroke-width="1.3"/>`; }
  /* الدوائر المكبّرة: أنثريديوم ونطف وأركيكونيوم وبيضة */
  const AN = [795, 372], AR = [745, 482];
  const anthC = `<circle cx="${AN[0]}" cy="${AN[1]}" r="31" fill="#152a1a" stroke="#f2f2f2" stroke-width="2"/>
    <circle cx="${AN[0]}" cy="${AN[1]}" r="18" fill="#7fd05e" stroke="${PL.leafL}" stroke-width="1.6"/>
    ${[[-7, -6], [5, -8], [-8, 5], [6, 5], [0, -1], [-1, 10]].map(([dx, dy]) => `<circle cx="${AN[0] + dx}" cy="${AN[1] + dy}" r="3.6" fill="#ffd166" stroke="#7a5a10" stroke-width=".7"/>`).join('')}`;
  const W0 = [800, 404], WC = [804, 440], W1 = [752, 448];
  let sw = ''; for (let i = 0; i < 6; i++){ const q = plQ(W0, WC, W1, i / 6); sw += `<g class="plFSw" data-i="${i}" transform="translate(${n2(q[0])},${n2(q[1])})"><circle r="3.2" fill="#e3f4ff" stroke="#4a8fd0" stroke-width="1"/></g>`; }
  const archC = `<circle cx="${AR[0]}" cy="${AR[1]}" r="42" fill="#152a1a" stroke="#f2f2f2" stroke-width="2"/>${plFlask(AR[0], AR[1] + 10, 1.55, '#3f9a3e', PL.leafL)}`;
  const egg = plBall(AR[0], AR[1] + 12, 7.5, 'plGHa', 1.2);
  /* نبتة صغيرة: أول ورقة فوق الثالوس والجذر تحته */
  const YX = 432, YY = 550;
  const young = `${soilM(YX, YY + 10, 42, 11)}<path d="${plHeart(YX - 2, YY - 2, 0.32)}" fill="url(#plGLeaf)" stroke="${PL.leafL}" stroke-width="1"/>
    <path d="M${YX + 2},${YY + 2} Q${YX + 6},${YY - 18} ${YX + 4},${YY - 34}" fill="none" stroke="#3e8a2e" stroke-width="3"/>
    <path d="M${YX + 4},${YY - 34} q-16,-6 -12,-20 q10,-6 14,4 q6,-12 16,-4 q2,14 -18,20Z" fill="#6fd257" stroke="${PL.leafL}" stroke-width="1"/>
    <path d="M${YX + 2},${YY + 4} q-4,12 2,24 M${YX + 2},${YY + 12} q8,6 10,14" fill="none" stroke="#f1e2c3" stroke-width="1.6"/>`;
  const VX = 492, VB = 462;
  const vf = [[-30, -48], [2, -66], [30, -46]].map(([dx, dy], i) => plFrond([VX, VB - 4], [VX + dx * 0.25, VB - 30], [VX + dx, VB + dy], 0.42, 40 + i, false).leaf).join('');
  const vis = `${soilM(VX, VB + 4, 30, 8)}<path d="${plHeart(VX - 18, VB + 1, 0.2)}" fill="#7a9a4a" stroke="#c8d8a0" stroke-width=".8" opacity=".85"/>${vf}`;
  const body = plDefs() + `
    <ellipse cx="${E[0]}" cy="${E[1]}" rx="${E[2]}" ry="${E[3]}" fill="none" stroke="#f5d78e" stroke-width="16" opacity=".12"/>
    ${part('plFern', `<g data-st="0">${fern}${plChip(372, 548, true)}</g>`)}
    ${part('plFSori', `<g data-st="0" class="plSway" data-cx="304" data-cy="515">${sori}</g>`)}
    ${part('plFSpores', `<g data-st="1">${spores}${plChip(470, 232, false)}</g>`)}
    <g data-st="2">${plEll(...E, 330, 348, A)}</g>
    ${part('plFGerm', `<g data-st="2">${soilM(560, 196, 40, 11)}${plBall(551, 184, 5.5, 'plGHa', 1)}<path d="M556,186 q8,-3 14,-12 q6,4 2,10 q-6,6 -16,2Z" fill="#7bd85c" stroke="${PL.leafL}" stroke-width="1"/><path d="M553,190 q-2,6 2,10" stroke="#f1e2c3" stroke-width="1.2" fill="none"/></g>`)}
    <g data-st="2">${plEll(...E, 14, 36, A)}</g>
    ${part('plProth', `<g data-st="2"><path d="${plHeart(HX, HY, 1)}" fill="url(#plGLeaf)" stroke="${PL.leafL}" stroke-width="2"/>${arch}${anth}${plChip(HX - 54, HY - 46, false)}</g>`)}
    ${part('plRhiz', `<g data-st="2">${rh}</g>`)}
    <g data-st="3"><line x1="${HX + 14}" y1="${HY + 24}" x2="${AN[0] - 20}" y2="${AN[1] - 24}" stroke="#f2f2f2" stroke-width="1.3" stroke-dasharray="5 4" opacity=".75"/>
      <line x1="${HX - 4}" y1="${HY - 20}" x2="${AR[0] - 30}" y2="${AR[1] - 30}" stroke="#f2f2f2" stroke-width="1.3" stroke-dasharray="5 4" opacity=".55"/></g>
    ${part('plFAnth', `<g data-st="3">${anthC}</g>`)}
    ${part('plFArch', `<g data-st="3">${archC}</g>`)}
    ${part('plFEgg', `<g data-st="3">${egg}</g>`)}
    ${part('plFSperm', `<g data-st="3">${sw}</g>`)}
    <g data-st="4">${plEll(...E, 142, 168, A)}</g>
    ${part('plFZyg', `<g data-st="4">${plFlask(584, 556, 2.6, '#3f9a3e', PL.leafL)}${plBall(584, 559, 11, 'plGDi', 1.6)}${plChip(624, 540, true)}</g>`)}
    <g data-st="4">${plEll(...E, 196, 214, A)}</g>
    ${part('plFYoung', `<g data-st="4">${young}${plChip(YX + 34, YY - 38, true)}</g>`)}
    <g data-st="4">${gArrow(450, 522, 474, 482, A)}</g>
    ${part('plFVis', `<g data-st="4">${vis}</g>`)}
    <g data-st="0">${gArrow(452, 418, 424, 404, A)}</g>
    ${plLegend()}
    <text class="cap sm" x="560" y="652" text-anchor="middle">دورة حياة السرخس (البوليبوديوم) — للاطلاع: الطور البوغي هو السائد، والطور المشيجي هو الثالوس الأولي</text>`;
  const ctl = stageCtl(PL_FERN_ST, { dur: 28 });
  return {
    body, stages: PL_FERN_ST, fnParts: ['plFSori', 'plProth', 'plFSperm'],
    parts: [
      { id: 'plFern', anchor: [262, 330], label: [134, 330], side: 'L' },
      { id: 'plFSori', anchor: [soAnc[0], soAnc[1]], label: [134, 410], side: 'L' },
      { id: 'plFSpores', anchor: [430, 230], label: [418, 150], side: 'C' },
      { id: 'plFGerm', anchor: [560, 174], label: [562, 104], side: 'C' },
      { id: 'plProth', anchor: [HX + 68, HY - 30], label: [866, HY - 46], side: 'R' },
      { id: 'plRhiz', anchor: [HX + 14, HY + 76], label: [866, HY + 50], side: 'R' },
      { id: 'plFAnth', anchor: [AN[0] + 18, AN[1] - 8], label: [866, AN[1] - 4], side: 'R' },
      { id: 'plFSperm', anchor: [WC[0] - 2, WC[1] - 8], label: [866, 418], side: 'R' },
      { id: 'plFArch', anchor: [AR[0] + 4, AR[1] - 22], label: [866, 466], side: 'R' },
      { id: 'plFEgg', anchor: [AR[0] + 7, AR[1] + 14], label: [866, 520], side: 'R' },
      { id: 'plFZyg', anchor: [584, 588], label: [600, 624], side: 'C' },
      { id: 'plFYoung', anchor: [YX - 4, YY + 20], label: [420, 624], side: 'C' },
      { id: 'plFVis', anchor: [VX + 8, VB - 50], label: [548, 330], side: 'C' }
    ],
    tools: ctl.tools.concat([{ id: 'tbl:plFernTbl', label: 'التركيب والمنشأ (ص50)' }, { id: 'tbl:plFernPh', label: 'البوغي × المشيجي للسرخس' }, { id: 'tbl:plWhoTbl', label: 'من المسؤول عن…؟ (ص52)' }, { id: 'info:plProth', label: 'الثالوس الأولي (ص49)' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (!still) ctl.tick(dt);
      plStg(a, STG.idx, STG.k, still);
      a.all('.plSway').forEach(g => g.setAttribute('transform', `rotate(${n2(Math.sin(t * 0.8) * 0.8)} ${g.dataset.cx} ${g.dataset.cy})`));
      a.all('.plFSp').forEach(c => { const i = +c.dataset.i, u = (t * 0.14 + i / 14) % 1;
        c.setAttribute('cx', n2(372 + u * 128 + Math.sin(u * 8 + i) * 5)); c.setAttribute('cy', n2(284 - u * 92 + Math.cos(u * 7 + i) * 5)); });
      a.all('.plFSw').forEach(g => { const u = (t * 0.25 + +g.dataset.i / 6) % 1, p = plQ(W0, WC, W1, u);
        g.setAttribute('transform', `translate(${n2(p[0] + Math.sin(t * 8 + u * 18) * 2.5)},${n2(p[1])})`); });
    }
  };
}

