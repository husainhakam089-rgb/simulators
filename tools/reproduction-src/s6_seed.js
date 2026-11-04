/* ══════════════════════════════════════════════════════════════════════════
   4.6 · دورة حياة النبات الزهري (المراحل 3–7) — ملزمة ص68–92:
         التلقيح، أنبوب اللقاح، الإخصاب المزدوج، تكوين الجنين،
         تركيب البذرة (شكل 3-19)، تركيب الثمرة، أنواع الثمار وانتشارها
   ══════════════════════════════════════════════════════════════════════════ */
const SD_VIEWS_P = [
  { id: 'sdpPol',  label: 'التلقيح' },
  { id: 'sdpTube', label: 'أنبوب اللقاح' },
  { id: 'sdpFert', label: 'الإخصاب المزدوج' },
  { id: 'sdpEmb',  label: 'تكوين الجنين' }
];
const SD_VIEWS_S = [
  { id: 'sdsSeed',  label: 'تركيب البذرة' },
  { id: 'sdsFruit', label: 'تركيب الثمرة' },
  { id: 'sdsTypes', label: 'أنواع الثمار والانتشار' }
];

SCENES.sdPollin = {
  title: 'التلقيح والإخصاب',
  get src(){ return ({ sdpPol: 'ملزمة ص68–69', sdpTube: 'ملزمة ص70–71', sdpFert: 'ملزمة ص74–75', sdpEmb: 'ملزمة ص75–76' })[SEL.sdpv] || 'ملزمة ص68'; },
  tint: ['rgba(120,170,80,.24)', 'rgba(200,120,60,.14)'],
  build(){
    const v = SD_VIEWS_P.some(x => x.id === SEL.sdpv) ? SEL.sdpv : 'sdpPol';
    const s = v === 'sdpTube' ? sdTube() : v === 'sdpFert' ? sdFert() : v === 'sdpEmb' ? sdEmb() : sdPol();
    s.rebuildOnRadio = 'sdpv';
    s.tools = SD_VIEWS_P.map(x => ({ id: x.id, label: x.label, radio: 'sdpv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
SCENES.sdSeedFruit = {
  title: 'البذرة والثمرة',
  get src(){ return ({ sdsSeed: 'ملزمة ص77–79', sdsFruit: 'ملزمة ص82–86', sdsTypes: 'ملزمة ص86–88' })[SEL.sdsv] || 'ملزمة ص77'; },
  tint: ['rgba(210,140,70,.24)', 'rgba(110,160,90,.15)'],
  build(){
    const v = SD_VIEWS_S.some(x => x.id === SEL.sdsv) ? SEL.sdsv : 'sdsSeed';
    const s = v === 'sdsFruit' ? sdFruit() : v === 'sdsTypes' ? sdTypes() : sdSeeds();
    s.rebuildOnRadio = 'sdsv';
    s.tools = SD_VIEWS_S.map(x => ({ id: x.id, label: x.label, radio: 'sdsv', on: x.id === v })).concat(s.tools || []);
    return s;
  }
};
/* رسوم مستقلة (وضع الامتحان والرسم اليدوي) */
SCENES.sd_pol    = { title: 'التلقيح الذاتي والخلطي', build: () => sdPol(true) };
SCENES.sd_tube   = { title: 'تكوين أنبوب اللقاح', build: () => sdTube(true) };
SCENES.sd_fert   = { title: 'الإخصاب المزدوج في الكيس الجنيني', build: () => sdFert(true) };
SCENES.sd_torp   = { title: 'مرحلة الطوربيد', build: () => sdEmbBig(4) };
SCENES.sd_mature = { title: 'مرحلة الجنين الناضج', build: () => sdEmbBig(5) };
SCENES.sd_seeds  = { title: 'تركيب البذور (شكل 3-19)', build: () => sdSeeds(true) };
SCENES.sd_seedM  = { title: 'تركيب بذرة ذوات الفلقة الواحدة', build: () => sdSeedOne('m') };
SCENES.sd_seedD  = { title: 'تركيب بذرة ذوات الفلقتين', build: () => sdSeedOne('d') };
SCENES.sd_fruit  = { title: 'تركيب الثمرة', build: () => sdFruit(true) };
SCENES.sd_types  = { title: 'أنواع الثمار وانتشارها', build: () => sdTypes(true) };

/* ───────── أدوات مشتركة ───────── */
const sdCl = v => Math.max(0, Math.min(1, v));
const sdEase = v => { v = sdCl(v); return v * v * (3 - 2 * v); };
const sdLerp = (a, b, t) => a + (b - a) * t;
const sdQ = (p0, c, p1, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
/* منحنى Catmull-Rom كثيف النقاط (للرسم ولتتبع الحركة على نفس المسار) */
function sdCR(P, per){
  const out = [];
  for (let i = 0; i < P.length - 1; i++){
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < per; j++){
      const t = j / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
const sdPoly = pts => 'M' + pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L');
const sdCellN = (x, y, r, fill, nf, nr, st) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="${fill}" stroke="${st || '#ffffff'}" stroke-width="1.6"/>` +
  `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r * (nr || 0.42))}" fill="${nf}"/>`;
/* إظهار/إخفاء الأسماء حسب المرحلة، ونقل نقطة التأشير إن تغير مكان الجزء */
function sdLabels(a, map){
  a.all('#labelLayer .lblG').forEach(g => {
    const v = map[g.dataset.for];
    if (v === undefined) return;
    const on = !!v;
    if (g.__sdOn !== on){ g.__sdOn = on; g.style.opacity = on ? '' : '0'; g.style.pointerEvents = on ? '' : 'none'; }
    if (Array.isArray(v)){
      const key = n2(v[0]) + ',' + n2(v[1]);
      if (g.__sdAt !== key){
        g.__sdAt = key;
        const l = g.querySelector('.lead'); if (l){ l.setAttribute('x2', n2(v[0])); l.setAttribute('y2', n2(v[1])); }
        g.querySelectorAll('circle').forEach(c => { c.setAttribute('cx', n2(v[0])); c.setAttribute('cy', n2(v[1])); });
      }
    }
  });
}
const sdOp = (a, sel, v) => { const e = a.el(sel); if (e) e.setAttribute('opacity', n2(v)); };
const sdTr = (a, sel, tr) => { const e = a.el(sel); if (e) e.setAttribute('transform', tr); };
const sdHead = (x, y, ang, col) => { const h = 10;
  return `<path d="M${n2(x)},${n2(y)} L${n2(x - h * Math.cos(ang - 0.45))},${n2(y - h * Math.sin(ang - 0.45))} L${n2(x - h * Math.cos(ang + 0.45))},${n2(y - h * Math.sin(ang + 0.45))}Z" fill="${col}"/>`; };
const sdPollenDot = (x, y, r, cls) => `<g class="${cls || ''}"><circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r + 2.5)}" fill="#ffe680" opacity=".35"/>` +
  `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="#ffd23f" stroke="#c98a10" stroke-width="1.4"/></g>`;

/* ═════════ 1) التلقيح الذاتي والخلطي — ملزمة ص68–69 ═════════ */
const sdPetal = (cx, cy, deg, L, W, seed) => {
  const a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
  const P = (s, w) => [cx + ux * s + px * w, cy + uy * s + py * w + Math.pow(s / L, 2) * 38];
  const pts = [P(0, -W * 0.35), P(L * 0.4, -W), P(L * 0.82, -W * 0.62), P(L, 0), P(L * 0.82, W * 0.62), P(L * 0.4, W), P(0, W * 0.35)];
  const r = rng(seed); let sp = '';
  for (let i = 0; i < 6; i++){ const q = P(L * (0.3 + r() * 0.5), (r() - 0.5) * W * 1.1); sp += `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="${n2(2 + r() * 1.6)}" fill="#7a2a12" opacity=".8"/>`; }
  return `<path d="${smoothClosed(pts)}" fill="#ef7a3a" stroke="#ffc79e" stroke-width="2"/>` +
    `<path d="${smoothOpen([P(4, 0), P(L * 0.5, 0), P(L * 0.9, 0)])}" fill="none" stroke="#c9541f" stroke-width="1.6" opacity=".7"/>${sp}`;
};
const SD_STAM = [-80, -50, -20, 22, 52, 82];
const sdAntherTop = (cx, cy, dx) => [cx + dx, cy - 205 + Math.abs(dx) * 0.45];
/* زهرة زنبق (كما في رسم الملزمة): بتلات منحنية للخلف، ستة أسدية طويلة، قلم وميسم */
function sdLily(cx, cy, seed, wrapAnth, wrapStig){
  const back = [205, -25].map((d, i) => sdPetal(cx, cy, d, 105, 26, seed + i)).join('');
  const front = [150, 105, 75, 30].map((d, i) => sdPetal(cx, cy, d, 108, 27, seed + 9 + i)).join('');
  const stem = `<path d="M${cx},${cy + 5} Q${cx - 8},${cy + 90} ${cx - 2},660" fill="none" stroke="#4f9a3a" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="${smoothClosed([[cx - 4, 600], [cx - 50, 575], [cx - 70, 585], [cx - 40, 605]])}" fill="#5fae45" stroke="#2f6f25" stroke-width="1.5"/>`;
  let fil = '', anth = '';
  SD_STAM.forEach(dx => { const [x, y] = sdAntherTop(cx, cy, dx);
    fil += `<path d="M${n2(cx + dx * 0.1)},${cy - 14} Q${n2(cx + dx * 0.5)},${cy - 120} ${n2(x)},${n2(y + 14)}" fill="none" stroke="#e8d9b0" stroke-width="3"/>`;
    anth += `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="5.5" ry="16" transform="rotate(${n2(dx * 0.15)} ${n2(x)} ${n2(y)})" fill="#7a3b1c" stroke="#c98a5a" stroke-width="1.4"/>`; });
  const style = `<path d="M${cx},${cy - 14} Q${cx + 2},${cy - 130} ${cx + 3},${cy - 236}" fill="none" stroke="#d6e8a8" stroke-width="6" stroke-linecap="round"/>`;
  const stig = `<circle cx="${cx + 3}" cy="${cy - 242}" r="9" fill="#9bd36a" stroke="#e8ffd0" stroke-width="1.6"/>` +
    [-7, 0, 7].map(o => `<circle cx="${cx + 3 + o}" cy="${cy - 250 + Math.abs(o) * 0.5}" r="4.5" fill="#b7e486"/>`).join('');
  return stem + back + fil + style + (wrapStig ? wrapStig(stig) : stig) + (wrapAnth ? wrapAnth(anth) : anth) +
    `<circle cx="${cx}" cy="${cy}" r="12" fill="#5a9a3a"/>` + front;
}
const sdTree = (cx, n, rf, seed) => {
  const r = rng(seed), crown = blobPath(cx, 300, 88, 80, 0.08, seed, 18).d;
  let fr = '';
  for (let i = 0; i < n; i++){ const a = r() * 6.283, d = 12 + r() * 54;
    fr += `<circle cx="${n2(cx + Math.cos(a) * d)}" cy="${n2(300 + Math.sin(a) * d * 0.88)}" r="${n2(rf)}" fill="#ff9a1f" stroke="#ffd59a" stroke-width="1.4"/>`; }
  return `<path d="M${cx - 13},520 L${cx - 8},360 L${cx + 8},360 L${cx + 13},520Z" fill="#8a5a32" stroke="#5a3a1e" stroke-width="2"/>` +
    `<path d="M${cx},400 L${cx - 30},370 M${cx},420 L${cx + 26},380" stroke="#8a5a32" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="${crown}" fill="#6fbf3a" stroke="#a8e07a" stroke-width="2.4"/>` +
    `<path d="${blobPath(cx - 20, 280, 40, 34, 0.1, seed + 3, 12).d}" fill="#86d24c" opacity=".7"/>` + fr +
    `<ellipse cx="${cx}" cy="522" rx="52" ry="7" fill="#4f8a35" opacity=".7"/>`;
};
function sdPol(still){
  const LX = 300, RX = 520, CY = 470;
  const P0 = sdAntherTop(RX, CY, -50), C0 = [390, -20], P1 = [LX + 3, CY - 242 + 4];
  const Q0 = sdAntherTop(RX, CY, 82), D0 = [625, 180], Q1 = [RX + 3 + 6, CY - 242 + 4];
  const arc = (p0, c, p1, col) => `<path d="M${n2(p0[0])},${n2(p0[1])} Q${c[0]},${c[1]} ${n2(p1[0])},${n2(p1[1])}" fill="none" stroke="${col}" stroke-width="2.6" stroke-dasharray="8 6" stroke-linecap="round"/>` +
    sdHead(p1[0], p1[1], Math.atan2(p1[1] - c[1], p1[0] - c[0]), col);
  const mid = sdQ(P0, C0, P1, 0.5);
  const bee = `<g id="sdBeeW"><ellipse cx="402" cy="192" rx="10" ry="15" transform="rotate(-25 402 192)" fill="#e8f6ff" opacity=".8" stroke="#9fc8e8"/>` +
    `<ellipse cx="416" cy="190" rx="10" ry="15" transform="rotate(25 416 190)" fill="#e8f6ff" opacity=".8" stroke="#9fc8e8"/></g>` +
    `<ellipse cx="410" cy="207" rx="19" ry="11" fill="#ffc83a" stroke="#5a3a00" stroke-width="1.6"/>` +
    `<path d="M404,197 L404,217 M412,196 L412,218 M420,198 L420,216" stroke="#2a1a00" stroke-width="3.4"/>` +
    `<circle cx="389" cy="205" r="7.5" fill="#2a1a00"/><path d="M386,199 Q380,190 376,192 M390,198 Q388,188 384,186" fill="none" stroke="#2a1a00" stroke-width="1.4"/>` +
    `<path d="M429,207 L436,209 L429,211Z" fill="#2a1a00"/>` + sdPollenDot(398, 220, 2.6) + sdPollenDot(418, 221, 2.4);
  const body = `
    ${sdLily(LX, CY, 11, an => part('sdAnther', an), sg => part('sdStigma', sg))}
    ${sdLily(RX, CY, 31)}
    ${part('sdCross', arc(P0, C0, P1, '#ffe08a'))}
    ${part('sdSelf', arc(Q0, D0, Q1, '#9fe0ff'))}
    ${part('sdPGrain', sdPollenDot(mid[0], mid[1], 7))}
    ${still ? '' : sdPollenDot(0, 0, 5, 'sdFlyX') + sdPollenDot(0, 0, 5, 'sdFlyS')}
    <text class="cap sm" x="${n2(mid[0])}" y="${n2(mid[1] - 22)}" text-anchor="middle" fill="#ffe08a">تلقيح خلطي</text>
    <text class="cap sm" x="660" y="205" text-anchor="middle" fill="#9fe0ff">تلقيح ذاتي</text>
    <g id="sdBeeB">${part('sdBee', bee)}</g>
    ${part('sdTreeS', sdTree(680, 6, 7, 41))}
    ${part('sdTreeC', sdTree(880, 11, 11, 57))}
    <line x1="600" y1="140" x2="600" y2="560" stroke="rgba(255,255,255,.18)" stroke-dasharray="4 8"/>
    <text class="cap sm" x="500" y="645" text-anchor="middle">التلقيح: انتقال حبوب اللقاح من المتك إلى الميسم للنوع نفسه — والتلقيح الخلطي يعطي ثماراً أكبر حجماً وأكثر عدداً وأسرع نمواً</text>`;
  return {
    body, fnParts: ['sdBee', 'sdCross'],
    parts: [
      { id: 'sdPGrain', anchor: [mid[0], mid[1] - 8], label: [440, 45], side: 'C' },
      { id: 'sdCross', anchor: sdQ(P0, C0, P1, 0.78), label: [134, 100], side: 'L' },
      { id: 'sdBee', anchor: [389, 205], label: [134, 170], side: 'L' },
      { id: 'sdStigma', anchor: [LX - 6, CY - 242], label: [134, 235], side: 'L' },
      { id: 'sdAnther', anchor: sdAntherTop(LX, CY, -80).map((v, i) => v + (i ? 8 : -5)), label: [134, 320], side: 'L' },
      { id: 'sdSelf', anchor: sdQ(Q0, D0, Q1, 0.35), label: [820, 140], side: 'C' },
      { id: 'sdTreeS', anchor: [680, 505], label: [680, 595], side: 'C' },
      { id: 'sdTreeC', anchor: [880, 505], label: [880, 595], side: 'C' }
    ],
    tools: [{ id: 'info:sdPollination', label: 'ما هو التلقيح؟' }, { id: 'info:sdAgents', label: 'وسائل نقل حبوب اللقاح' }, { id: 'tbl:sdPolTbl', label: 'الذاتي × الخلطي (ص68)' }],
    tick(dt, t, a){
      const px = (t * 0.22) % 1, ps = (t * 0.3 + 0.4) % 1;
      const x = sdQ(P0, C0, P1, sdEase(px)), s = sdQ(Q0, D0, Q1, sdEase(ps));
      sdTr(a, '.sdFlyX', `translate(${n2(x[0])},${n2(x[1])})`); sdOp(a, '.sdFlyX', Math.min(1, Math.sin(px * Math.PI) * 3));
      sdTr(a, '.sdFlyS', `translate(${n2(s[0])},${n2(s[1])})`); sdOp(a, '.sdFlyS', Math.min(1, Math.sin(ps * Math.PI) * 3));
      sdTr(a, '#sdBeeB', `translate(${n2(Math.sin(t * 0.9) * 8)},${n2(Math.sin(t * 2.6) * 6)})`);
      sdTr(a, '#sdBeeW', `translate(0,${n2(192 * (1 - (0.6 + 0.4 * Math.abs(Math.sin(t * 22)))))}) scale(1,${n2(0.6 + 0.4 * Math.abs(Math.sin(t * 22)))})`);
    }
  };
}

/* ═════════ 2) تكوين أنبوب اللقاح — ملزمة ص70–71 ═════════ */
const TUBE_STAGES = [
  { n: '1 · سقوط حبة اللقاح على الميسم', d: 'تنتقل حبة اللقاح بالتلقيح من المتك إلى ميسم زهرة من النوع نفسه، وتحتوي حبة اللقاح الناضجة على خلية أنبوبية وخلية مولدة (س).' },
  { n: '2 · نمو أنبوب اللقاح', d: 'تنمو حبة اللقاح بعد سقوطها على الميسم وتكوّن أنبوباً ذا قطر ضيق يعرف بأنبوب اللقاح ينمو من أحد ثقوب الإنبات، وعادة تنتج حبة اللقاح أنبوباً لقاحياً واحداً ينمو ويخترق الميسم والقلم.' },
  { n: '3 · انقسام الخلية المولدة', d: 'أثناء نمو أنبوب اللقاح تخضع الخلية المولدة (س) فيه إلى انقسام اعتيادي واحد لتنتج خليتين ذكريتين (س)، وبذلك يحتوي أنبوب اللقاح على خلية أنبوبية وخليتين ذكريتين.' },
  { n: '4 · وصول الأنبوب إلى البويض', d: 'يستمر الأنبوب بالنمو حتى يصل المبيض الذي يحوي البويضات ويخترق النقير. يمثل أنبوب اللقاح الآن الطور المشيجي الذكري الناضج الذي يكون مهيأً لعملية الإخصاب.' }
];
function sdTube(still){
  const PX = 640;
  const ctrl = [[PX - 6, 72], [PX - 2, 112], [PX, 200], [PX, 300], [PX - 30, 345], [PX - 95, 390], [PX - 110, 455], [PX - 88, 540], [PX - 45, 568], [PX - 14, 560], [PX - 10, 545], [PX - 10, 520]];
  const TP = sdCR(ctrl, 8), TPp = prepPath(TP);
  const ZT = sdCR([[262, 538], [242, 576], [204, 600], [158, 602], [122, 588]], 8);
  const stig = `<path d="${smoothClosed([[PX - 58, 60], [PX - 32, 46], [PX - 8, 68], [PX + 8, 68], [PX + 32, 46], [PX + 58, 60], [PX + 36, 92], [PX + 20, 108], [PX - 20, 108], [PX - 36, 92]])}" fill="#7cc35a" stroke="#3f7f2d" stroke-width="3"/>` +
    `<path d="M${PX - 40},62 Q${PX - 20},70 ${PX - 10},80 M${PX + 40},62 Q${PX + 20},70 ${PX + 10},80" fill="none" stroke="#bdf09a" stroke-width="2" opacity=".7"/>`;
  const style = `<path d="M${PX - 20},104 L${PX - 18},322 Q${PX - 40},330 ${PX - 60},322 L${PX + 60},322 Q${PX + 40},330 ${PX + 18},322 L${PX + 20},104Z" fill="#7cc35a" stroke="#3f7f2d" stroke-width="3"/>` +
    `<line x1="${PX}" y1="104" x2="${PX}" y2="330" stroke="#b9e39a" stroke-width="10" opacity=".55"/>`;
  const ovary = `<ellipse cx="${PX}" cy="465" rx="155" ry="150" fill="#7cc35a" stroke="#3f7f2d" stroke-width="4"/>` +
    `<ellipse cx="${PX}" cy="465" rx="128" ry="122" fill="#d5edb6" stroke="#5f9f45" stroke-width="2"/>`;
  const OVX = PX - 10, OVY = 455;
  const ovule = `<path d="M${OVX + 62},440 Q${PX + 100},420 ${PX + 127},405" fill="none" stroke="#e8b884" stroke-width="14" stroke-linecap="round"/>` +
    `<ellipse cx="${OVX}" cy="${OVY}" rx="70" ry="88" fill="#f6b673" stroke="#d9894a" stroke-width="3"/>` +
    `<ellipse cx="${OVX}" cy="${OVY - 4}" rx="58" ry="76" fill="#ffd9a8" stroke="#e6a060" stroke-width="2"/>` +
    `<ellipse cx="${OVX}" cy="${OVY - 3}" rx="36" ry="58" fill="#fff4e0" stroke="#c98a4a" stroke-width="2"/>` +
    [-14, 0, 14].map(o => `<circle cx="${OVX + o}" cy="${OVY - 44 + Math.abs(o) * 0.2}" r="6" fill="#9a9aa6" stroke="#fff"/>`).join('') +
    `<circle cx="${OVX - 7}" cy="${OVY - 4}" r="5" fill="#e0303a"/><circle cx="${OVX + 7}" cy="${OVY - 4}" r="5" fill="#e0303a"/>` +
    `<circle cx="${OVX - 15}" cy="${OVY + 36}" r="7" fill="#f6c3d0" stroke="#fff"/><circle cx="${OVX + 15}" cy="${OVY + 36}" r="7" fill="#f6c3d0" stroke="#fff"/><circle cx="${OVX}" cy="${OVY + 40}" r="9" fill="#f08aa8" stroke="#fff"/>`;
  const micro = `<path d="M${OVX - 8},${OVY + 74} L${OVX + 8},${OVY + 74} L${OVX + 6},${OVY + 90} L${OVX - 6},${OVY + 90}Z" fill="#3a2414"/>`;
  const tube = `<path id="sdTubeP" d="${sdPoly(TP)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${still ? 0 : 1}" fill="none" stroke="#fff6dc" stroke-width="5" stroke-linecap="round"/>`;
  const end = TP[TP.length - 1];
  const tip = `<g id="sdTip" transform="translate(${n2(end[0])},${n2(end[1])})"${still ? '' : ' opacity="0"'}><ellipse cx="0" cy="-4" rx="6" ry="3" fill="#d8202a"/>` +
    `<g id="sdTipG"><circle cx="0" cy="5" r="3.6" fill="#ffe14d" stroke="#8a6a00" stroke-width=".8"/></g>` +
    `<g id="sdTipM"${still ? '' : ' opacity="0"'}><circle cx="-4" cy="6" r="3.2" fill="#ffe14d" stroke="#8a6a00" stroke-width=".8"/><circle cx="4" cy="6" r="3.2" fill="#ffe14d" stroke="#8a6a00" stroke-width=".8"/></g></g>`;
  const grain = `<circle cx="${PX - 6}" cy="64" r="10" fill="#f39ac0" stroke="#b3477a" stroke-width="2"/>` + [0, 1, 2, 3, 4, 5].map(i => {
    const a = i * 1.047; return `<circle cx="${n2(PX - 6 + Math.cos(a) * 10)}" cy="${n2(64 + Math.sin(a) * 10)}" r="1.6" fill="#b3477a"/>`; }).join('');
  /* حبة لقاح نابتة مكبّرة (الشكل الأيسر في ص70) */
  const zoom = `<circle cx="300" cy="465" r="128" fill="rgba(30,30,70,.35)" stroke="#9fb6ff" stroke-width="2" stroke-dasharray="6 6"/>
    <line x1="${PX - 14}" y1="72" x2="392" y2="374" stroke="#9fb6ff" stroke-width="1.4" stroke-dasharray="4 6" opacity=".7"/>
    <text class="cap sm" x="300" y="318" text-anchor="middle" fill="#cfd8ff">حبة لقاح نابتة (مكبّرة)</text>`;
  const zGrain = `<path id="sdZTube" d="${sdPoly(ZT)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${still ? 0 : 1}" fill="none" stroke="#e8d6a0" stroke-width="24" stroke-linecap="round"/>` +
    `<ellipse cx="300" cy="465" rx="78" ry="92" fill="#6a5acd" stroke="#2b2a7a" stroke-width="5"/>` +
    `<ellipse cx="288" cy="440" rx="58" ry="66" fill="#7d6fe0" opacity=".45"/>`;
  const body = `
    ${part('sdOvary', ovary)}
    ${part('sdOvule', ovule)}
    ${part('sdMicro', micro)}
    ${part('sdStyle', style)}
    ${part('sdStigma', stig)}
    ${part('sdPTube', tube)}
    ${tip}
    <g id="sdGrainG">${part('sdPGrain', grain)}</g>
    ${zoom}
    ${part('sdPGrainZ', zGrain)}
    ${part('sdTubeCell', `<ellipse cx="300" cy="425" rx="42" ry="22" fill="#b3122a" stroke="#ffb0b8" stroke-width="2"/>`)}
    ${still ? '' : part('sdGenCell', `<g id="sdGenG"><circle cx="300" cy="500" r="22" fill="#f3e3b0" stroke="#c9a85a" stroke-width="2"/><circle cx="300" cy="500" r="8" fill="#c9a85a"/></g>`)}
    ${part('sdMale', `<g id="sdMaleG"${still ? '' : ' opacity="0"'}><g id="sdMa"><circle cx="278" cy="500" r="17" fill="#f3e3b0" stroke="#c9a85a" stroke-width="2"/><circle cx="278" cy="500" r="6" fill="#c9a85a"/></g>` +
      `<g id="sdMb"><circle cx="322" cy="500" r="17" fill="#f3e3b0" stroke="#c9a85a" stroke-width="2"/><circle cx="322" cy="500" r="6" fill="#c9a85a"/></g></g>`)}
    <text class="cap sm" x="560" y="650" text-anchor="middle">تكوين أنبوب اللقاح: ينمو ويخترق الميسم والقلم حتى يصل المبيض ويدخل البويض عن طريق النقير</text>`;
  const ctl = stageCtl(TUBE_STAGES, { dur: 22 });
  const parts = [
    { id: 'sdPGrain', anchor: [PX + 3, 57], label: [866, 40], side: 'R' },
    { id: 'sdStigma', anchor: [PX + 52, 66], label: [866, 100], side: 'R' },
    { id: 'sdStyle', anchor: [PX + 20, 210], label: [866, 205], side: 'R' },
    { id: 'sdPTube', anchor: [PX + 1, 280], label: [866, 285], side: 'R' },
    { id: 'sdOvary', anchor: [786, 420], label: [866, 385], side: 'R' },
    { id: 'sdOvule', anchor: [OVX + 69, 470], label: [866, 470], side: 'R' },
    { id: 'sdMicro', anchor: [OVX + 6, OVY + 84], label: [866, 560], side: 'R' },
    { id: 'sdTubeCell', anchor: [259, 428], label: [134, 385], side: 'L' },
    { id: 'sdMale', anchor: [262, 506], label: [134, 515], side: 'L' },
    { id: 'sdPGrainZ', anchor: [226, 520], label: [134, 600], side: 'L' }
  ];
  if (!still) parts.splice(8, 0, { id: 'sdGenCell', anchor: [279, 494], label: [134, 450], side: 'L' });
  return {
    body, parts, stages: still ? undefined : TUBE_STAGES, fnParts: ['sdPTube'],
    tools: still ? [] : ctl.tools.concat([{ id: 'info:sdPTube', label: 'عرّف أنبوب اللقاح' }, { id: 'tbl:sdOrigin', label: 'المنشأ والمجموعة الكروموسومية' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (still) return;
      ctl.tick(dt);
      const i = STG.idx, k = STG.k;
      sdTr(a, '#sdGrainG', i === 0 ? `translate(0,${n2(-(1 - sdEase(k * 1.6)) * 70)})` : '');
      const prog = i === 0 ? 0 : i === 1 ? 0.42 * k : i === 2 ? 0.42 + 0.36 * k : 0.78 + 0.22 * sdEase(k * 1.4);
      const tp = a.el('#sdTubeP'); if (tp) tp.setAttribute('stroke-dashoffset', n2(1 - prog));
      const zp = a.el('#sdZTube'); if (zp) zp.setAttribute('stroke-dashoffset', n2(1 - (i === 0 ? sdEase(k) * 0.5 : 1)));
      const p = alongPath(TPp, prog * TPp.len);
      sdTr(a, '#sdTip', `translate(${n2(p[0])},${n2(p[1])})`); sdOp(a, '#sdTip', prog > 0.02 ? 1 : 0);
      const div = i < 2 ? 0 : i === 2 ? sdEase((k - 0.15) * 1.6) : 1;
      sdOp(a, '#sdGenG', 1 - div); sdOp(a, '#sdMaleG', div);
      sdTr(a, '#sdMa', `translate(${n2((1 - div) * 22)},0)`); sdTr(a, '#sdMb', `translate(${n2(-(1 - div) * 22)},0)`);
      sdOp(a, '#sdTipG', 1 - div); sdOp(a, '#sdTipM', div);
      sdLabels(a, { sdGenCell: div < 0.5, sdMale: div >= 0.5, sdPTube: prog > 0.05 });
    }
  };
}

/* ═════════ 3) الإخصاب المزدوج — ملزمة ص74 (الأشكال الأربعة) ═════════ */
const FERT_STAGES = [
  { n: '1 · أنبوب اللقاح يصل إلى البويض', d: 'عند وصول أنبوب اللقاح إلى البويض فإنه يخترق النقير ويدخل الجويزاء ثم إلى الكيس الجنيني (خلايا سمتية، نواتان قطبيتان، خليتان مساعدتان، خلية البيضة).' },
  { n: '2 · تفريغ محتويات أنبوب اللقاح', d: 'يفرغ أنبوب اللقاح محتوياته في الكيس الجنيني: الخلية الأنبوبية والخليتين الذكريتين.' },
  { n: '3 · الإخصاب المزدوج', d: 'تتحد إحدى الخليتين الذكريتين مع خلية البيضة مكونة بيضة مخصبة أو زيجة (2س)، وتتجه الخلية الذكرية الثانية نحو النواتين القطبيتين وتتحد معهما مكونة نواة السويداء ثلاثية المجموعة الكروموسومية (3س).' },
  { n: '4 · ما بعد الإخصاب المزدوج', d: 'تنحل الخلايا السمتية الثلاث والخليتان المساعدتان والخلية الأنبوبية، وتبدأ البيضة المخصبة بالانقسام الاعتيادي لتكوين الجنين، وتنقسم نواة السويداء (3س) لتكوين نسيج السويداء الخازن للغذاء.' }
];
function sdArcEll(cx, cy, rx, ry, gap){
  const pts = [];
  for (let d = 90 + gap; d <= 450 - gap + 0.01; d += 6){ const a = d * Math.PI / 180; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return smoothOpen(pts);
}
function sdFert(still){
  const CX = 560, CY = 330, SY = 320;
  const ANT = [[515, 178], [560, 170], [605, 178]], POL = [[538, 318], [582, 318]], MF = [[480, 292], [480, 340]];
  const SYN = [[510, 452], [610, 452]], EGG = [560, 465], ENDO = [560, 318], BAR = [560, 220];
  const TP = sdCR([[612, 698], [588, 650], [566, 612], [560, 580], [559, 545], [558, 510]], 8), TPp = prepPath(TP), TIP = TP[TP.length - 1];
  const cl = (cx, cy, n, R, r, fill, st, seed) => { const g = rng(seed); let s = '';
    for (let i = 0; i < n; i++){ const a = g() * 6.283, d = Math.sqrt(g()) * R; s += `<circle cx="${n2(cx + Math.cos(a) * d)}" cy="${n2(cy + Math.sin(a) * d)}" r="${r}" fill="${fill}" stroke="${st}" stroke-width="1"/>`; }
    return s; };
  const integ = `<path d="${sdArcEll(CX, CY, 200, 262, 6)}" fill="none" stroke="#c98c4a" stroke-width="18" stroke-linecap="round"/>` +
    `<path d="${sdArcEll(CX, CY, 178, 240, 6)}" fill="none" stroke="#e0ae6a" stroke-width="14" stroke-linecap="round"/>`;
  const nucel = `<ellipse cx="${CX}" cy="${CY}" rx="166" ry="228" fill="#f3dcb0"/>` + cl(CX - 130, CY + 40, 14, 22, 3, '#e8c890', '#d9b070', 3) + cl(CX + 130, CY - 40, 14, 22, 3, '#e8c890', '#d9b070', 4);
  const micro = `<path d="M549,555 L571,555 L567,596 L553,596Z" fill="#2a2018"/>`;
  const sac = `<ellipse cx="${CX}" cy="${SY}" rx="118" ry="188" fill="#a8d8e6" stroke="#3d9a4a" stroke-width="6"/>`;
  const tube = `<path id="sdFTube" d="${sdPoly(TP)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${still ? 0 : 1}" fill="none" stroke="#fff6dc" stroke-width="7" stroke-linecap="round"/>`;
  const ant = ANT.map(([x, y]) => sdCellN(x, y, 20, '#9a9aa6', '#d23a3a', 0.4)).join('');
  const syn = SYN.map(([x, y]) => sdCellN(x, y, 23, '#f6c3d0', '#d23a3a', 0.36)).join('');
  const cell0 = (r, fill, st) => `<circle cx="0" cy="0" r="${r}" fill="${fill}" stroke="${st || '#fff'}" stroke-width="1.8"/>`;
  const endoN = `<g id="sdEN"${still ? '' : ' opacity="0"'}><circle cx="${ENDO[0]}" cy="${ENDO[1]}" r="19" fill="#ff8a2a" stroke="#fff" stroke-width="2"/><circle cx="${ENDO[0]}" cy="${ENDO[1]}" r="7" fill="#1a1a1a"/></g>` +
    (still ? '' : `<g id="sdENc" opacity="0">${cl(ENDO[0], ENDO[1] - 10, 22, 48, 9, '#ff8a2a', '#b04a00', 21)}</g>`);
  const zyg = `<g id="sdZY"${still ? '' : ' opacity="0"'}><circle cx="${EGG[0]}" cy="${EGG[1]}" r="24" fill="#d8ecff" stroke="#2f8fd8" stroke-width="8"/><circle cx="${EGG[0]}" cy="${EGG[1]}" r="8" fill="#1f5f9a"/></g>` +
    (still ? '' : `<g id="sdZYc" opacity="0">${cl(EGG[0], EGG[1] - 4, 16, 26, 8, '#2f6fb8', '#0f2f5a', 22)}</g>`);
  const body = `
    ${part('sdInteg', integ)}
    ${part('sdNucel', nucel)}
    ${part('sdMicro', micro)}
    ${part('sdEmbSac', sac)}
    ${part('sdPTube', tube)}
    ${part('sdAntip', `<g id="sdANT">${ant}</g>`)}
    ${part('sdSyn', `<g id="sdSYN">${syn}</g>`)}
    ${still ? '' : part('sdEgg', `<g id="sdEGG">${sdCellN(EGG[0], EGG[1], 28, '#f08aa8', '#c0203a', 0.38)}</g>`)}
    ${still ? '' : part('sdPolar', POL.map((p, i) => `<g id="sdP${i}" transform="translate(${p[0]},${p[1]})">${cell0(13, '#e0303a')}</g>`).join(''))}
    ${part('sdEndoN', endoN)}
    ${part('sdZyg', zyg)}
    ${part('sdTubeCell', `<g id="sdTC" transform="translate(${BAR[0]},${BAR[1]})"${still ? '' : ' opacity="0"'}><rect x="-38" y="-6" width="76" height="12" rx="3" fill="#d8202a" stroke="#ffb0b8" stroke-width="1.5"/></g>`)}
    ${still ? '' : part('sdMale', MF.map((p, i) => `<g id="sdM${i}" transform="translate(${p[0]},${p[1]})" opacity="0">${cell0(11, '#ffe14d', '#8a6a00')}</g>`).join(''))}
    <g id="sdDeg" opacity="0"><text class="cap sm" x="${CX}" y="146" text-anchor="middle" fill="#ffd0d0">تنحل</text><text class="cap sm" x="${CX}" y="505" text-anchor="middle" fill="#ffd0d0">تنحل الخليتان المساعدتان</text></g>
    <text class="cap sm" x="300" y="655" text-anchor="middle">${still ? 'حصول الإخصاب المزدوج: زيجة (2س) + نواة السويداء (3س)' : 'الإخصاب المزدوج — أحد سمات النباتات الزهرية'}</text>`;
  const ctl = stageCtl(FERT_STAGES, { dur: 26 });
  const parts = [
    { id: 'sdAntip', anchor: [625, 180], label: [866, 150], side: 'R' },
    { id: 'sdTubeCell', anchor: [598, 220], label: [866, 215], side: 'R' },
    { id: 'sdPolar', anchor: [595, 318], label: [866, 280], side: 'R' },
    { id: 'sdEndoN', anchor: [579, 322], label: [866, 335], side: 'R' },
    { id: 'sdEmbSac', anchor: [671, 380], label: [866, 382], side: 'R' },
    { id: 'sdSyn', anchor: [633, 452], label: [866, 425], side: 'R' },
    { id: 'sdEgg', anchor: [588, 472], label: [866, 472], side: 'R' },
    { id: 'sdZyg', anchor: [584, 482], label: [866, 525], side: 'R' },
    { id: 'sdPTube', anchor: [590, 652], label: [866, 630], side: 'R' },
    { id: 'sdMale', anchor: [469, 292], label: [134, 292], side: 'L' },
    { id: 'sdInteg', anchor: [366, 380], label: [134, 380], side: 'L' },
    { id: 'sdNucel', anchor: [455, 470], label: [134, 460], side: 'L' },
    { id: 'sdMicro', anchor: [553, 580], label: [134, 545], side: 'L' }
  ].filter(p => !still || ['sdPolar', 'sdEgg', 'sdMale'].indexOf(p.id) < 0);
  const mv = (a, sel, p) => sdTr(a, sel, `translate(${n2(p[0])},${n2(p[1])})`);
  const L = (x, y, t) => [sdLerp(x[0], y[0], t), sdLerp(x[1], y[1], t)];
  return {
    body, parts, stages: still ? undefined : FERT_STAGES, fnParts: ['sdEndoN', 'sdZyg'],
    tools: still ? [] : ctl.tools.concat([{ id: 'info:sdDblFert', label: 'عرّف الإخصاب المزدوج' }, { id: 'tbl:sdOrigin', label: 'المنشأ والمجموعة الكروموسومية' }]),
    init(){ if (!still) ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      if (still) return;
      ctl.tick(dt);
      const i = STG.idx, k = STG.k;
      const prog = i === 0 ? sdEase(k * 1.15) : 1;
      const ft = a.el('#sdFTube'); if (ft) ft.setAttribute('stroke-dashoffset', n2(1 - prog));
      const tipP = alongPath(TPp, prog * TPp.len);
      /* الخلية الأنبوبية والخليتان الذكريتان */
      if (i === 0){
        sdOp(a, '#sdTC', prog > 0.05 ? 1 : 0); sdTr(a, '#sdTC', `translate(${n2(tipP[0])},${n2(tipP[1] - 6)}) scale(.18,.6)`);
        [0, 1].forEach(j => { sdOp(a, '#sdM' + j, prog > 0.05 ? 1 : 0); mv(a, '#sdM' + j, [tipP[0] + (j ? 5 : -5), tipP[1] + 4]); });
      } else if (i === 1){
        const e = sdEase(k * 1.3);
        sdOp(a, '#sdTC', 1); const b = L(TIP, BAR, e);
        sdTr(a, '#sdTC', `translate(${n2(b[0])},${n2(b[1])}) scale(${n2(sdLerp(0.18, 1, e))},${n2(sdLerp(0.6, 1, e))})`);
        [0, 1].forEach(j => { sdOp(a, '#sdM' + j, 1); mv(a, '#sdM' + j, L([TIP[0] + (j ? 5 : -5), TIP[1]], MF[j], e)); });
      } else {
        sdOp(a, '#sdTC', i === 3 ? 1 - 0.8 * k : 1); sdTr(a, '#sdTC', `translate(${BAR[0]},${BAR[1]})`);
        const m = i === 2 ? sdEase(k * 2) : 1, fuse = i === 2 ? sdCl((k - 0.48) * 3) : 1;
        mv(a, '#sdM0', L(MF[1], EGG, m)); mv(a, '#sdM1', L(MF[0], ENDO, m));
        sdOp(a, '#sdM0', 1 - fuse); sdOp(a, '#sdM1', 1 - fuse);
        mv(a, '#sdP0', L(POL[0], [ENDO[0] - 6, ENDO[1]], m)); mv(a, '#sdP1', L(POL[1], [ENDO[0] + 6, ENDO[1]], m));
      }
      if (i < 2){ mv(a, '#sdP0', POL[0]); mv(a, '#sdP1', POL[1]); }
      const fuse = i < 2 ? 0 : i === 2 ? sdCl((k - 0.48) * 3) : 1;
      sdOp(a, '#sdP0', 1 - fuse); sdOp(a, '#sdP1', 1 - fuse); sdOp(a, '#sdEGG', 1 - fuse);
      const grow = i === 3 ? sdEase(k * 1.4) : 0;
      sdOp(a, '#sdEN', fuse * (1 - grow)); sdOp(a, '#sdENc', grow);
      sdOp(a, '#sdZY', fuse * (1 - grow)); sdOp(a, '#sdZYc', grow);
      const deg = i === 3 ? 1 - 0.8 * sdEase(k * 1.6) : 1;
      sdOp(a, '#sdANT', deg); sdOp(a, '#sdSYN', deg); sdOp(a, '#sdDeg', i === 3 ? sdEase(k * 2) : 0);
      sdOp(a, '#sdFTube', i === 3 ? 1 - 0.5 * k : 1);
      const pre = i < 2 || (i === 2 && k < 0.5);
      sdLabels(a, { sdTubeCell: i >= 1 && i < 3, sdMale: (i === 1) || (i === 2 && k < 0.5), sdPolar: pre, sdEgg: pre,
        sdEndoN: !pre, sdZyg: !pre, sdAntip: i < 3, sdSyn: i < 3 });
    }
  };
}

/* ═════════ 4) مراحل تكوين الجنين في ذوات الفلقتين — ملزمة ص75–76 ═════════ */
const EMB_STAGES = [
  { n: '1 · مرحلة تكوين الزيجة', d: 'يحصل في هذه المرحلة إخصاب مزدوج ينتج عنه تكوين الزيجة (2س) ونواة السويداء (3س).' },
  { n: '2 · مرحلة الجنين الأولي', d: 'يكون الجنين الأولي متعدد الخلايا، وجزؤه القاعدي يكون معطلاً وظيفياً معلقاً في هذه المرحلة، وتنقسم نواة السويداء لتكوين نسيج السويداء.' },
  { n: '3 · مرحلة التكور (الكرة)', d: 'يظهر الجنين في هذه المرحلة بشكل كرة صغيرة.' },
  { n: '4 · مرحلة القلب', d: 'يظهر فيها الجنين بشكل القلب وتظهر الفلقتان.' },
  { n: '5 · مرحلة الطوربيد', d: 'هي المرحلة التي يبدو فيها الجنين أسطواني الشكل بشكل الطوربيد وتتكون الفلقتان بشكل واضح (انطواء الفلقتين).' },
  { n: '6 · مرحلة الجنين الناضج', d: 'ينضج فيها الجنين ويأخذ بالنمو والتمايز إلى جنين حقيقي مكون من محور جنيني يتكون من الرويشة والجذير والسويق الفلقي الذي يحمل فلقتين (أو فلقة واحدة في ذوات الفلقة الواحدة).' }
];
/* يرسم المرحلة i داخل بذرة مركزها (ox,oy) بمقياس s؛ P تغلف الأجزاء (أو تتركها كما هي للمصغرات) */
function sdEmbDraw(i, ox, oy, s, P){
  P = P || ((id, x) => x);
  const X = (x, y) => [ox + x * s, oy + y * s], XS = pts => pts.map(p => X(p[0], p[1]));
  const C = (x, y, r, f, st, w) => { const q = X(x, y); return `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="${n2(r * s)}" fill="${f}"${st ? ` stroke="${st}" stroke-width="${n2((w || 1.2) * s)}"` : ''}/>`; };
  const SC = (pts, f, st, w) => `<path d="${smoothClosed(XS(pts))}" fill="${f}" stroke="${st || 'none'}" stroke-width="${n2((w || 1.6) * s)}"/>`;
  const SO = (pts, st, w) => `<path d="${smoothOpen(XS(pts))}" fill="none" stroke="${st}" stroke-width="${n2(w * s)}" stroke-linecap="round"/>`;
  const fillIn = ['#eef6dc', '#eef6dc', '#d8ecb6', '#d8ecb6', '#eef6dc', '#d6ecb4'][i];
  const o = X(0, 0);
  let out = P('sdTesta', `<ellipse cx="${n2(o[0])}" cy="${n2(o[1])}" rx="${n2(150 * s)}" ry="${n2(200 * s)}" fill="${fillIn}" stroke="#b8925a" stroke-width="${n2(12 * s)}"/>`);
  const EC = '#2f7d32', ECs = '#a6e07a', CELL = '#c4e48e', CELLs = '#86b24e';
  const cells = (mode, ex, seed) => { const g = rng(seed); let c = '';
    if (mode === 'ring'){ for (let d = 0; d < 360; d += 14){ const a = d * Math.PI / 180; c += C(Math.cos(a) * 124, Math.sin(a) * 174, 12, CELL, CELLs); } return c; }
    for (let y = -176; y <= 176; y += 22) for (let x = -130; x <= 130; x += 24){
      const xx = x + ((y / 22) % 2 ? 12 : 0) + (g() - 0.5) * 4, yy = y + (g() - 0.5) * 4;
      if ((xx / 134) ** 2 + (yy / 184) ** 2 > 1 || ex(xx, yy)) continue; c += C(xx, yy, 10, CELL, CELLs); }
    return c; };
  const susp = (y0) => SO([[0, y0], [0, 120], [0, 172]], '#1a1a1a', 7) + C(0, 182, 12, '#1a1a1a');
  if (i === 0){
    out += P('sdEndoN', C(0, -40, 9, '#111', '#fff', 1.4)) + P('sdZyg', `<ellipse cx="${n2(o[0])}" cy="${n2(oy + 150 * s)}" rx="${n2(16 * s)}" ry="${n2(18 * s)}" fill="${EC}" stroke="${ECs}" stroke-width="${n2(1.5 * s)}"/>`);
  } else if (i === 1){
    out += P('sdEndoT', cells('ring', null, 1)) +
      P('sdProEmb', C(0, 70, 26, EC, ECs, 1.6) + SO([[-24, 70], [24, 70]], ECs, 1.4) + SO([[0, 46], [0, 94]], ECs, 1.4)) + P('sdSusp', susp(96));
  } else if (i === 2){
    out += P('sdEndoT', cells('fill', (x, y) => Math.hypot(x, y - 30) < 62 || (Math.abs(x) < 18 && y > 60), 2)) +
      P('sdProEmb', C(0, 30, 48, EC, ECs, 1.8) + SO([[-46, 20], [0, 26], [46, 20]], ECs, 1.3) + SO([[-30, 60], [0, 30], [30, 60]], ECs, 1.3) + SO([[0, -16], [0, 76]], ECs, 1.3)) + P('sdSusp', susp(78));
  } else if (i === 3){
    const lobe = cx => SC([[cx - 30, 18], [cx - 32, -20], [cx - 12, -46], [cx + 12, -40], [cx + 28, -12], [cx + 20, 18]], EC, ECs, 1.6);
    out += P('sdEndoT', cells('fill', (x, y) => Math.hypot(x, y - 25) < 74 || (Math.abs(x) < 18 && y > 60), 3)) +
      P('sdCotyl', lobe(-28) + lobe(28)) +
      P('sdProEmb', SC([[-46, 14], [-40, 66], [-16, 92], [16, 92], [40, 66], [46, 14], [0, 26]], EC, ECs, 1.6)) + P('sdSusp', susp(92));
  } else if (i === 4){
    let ec = ''; const g = rng(9); for (let j = 0; j < 14; j++){ const y = -150 + j * 23, xx = -95 + (g() - 0.5) * 30 - Math.abs(y) * 0.05; ec += C(xx, y, 9, '#b5d97c', CELLs); }
    out += P('sdEndoT', SC([[-30, -185], [-100, -150], [-135, -60], [-138, 40], [-110, 130], [-50, 180], [-40, 120], [-52, 20], [-50, -80], [-38, -150]], CELL, CELLs, 1.4) + ec) +
      P('sdAxis', SC([[-18, 176], [18, 176], [24, 100], [26, 0], [24, -90], [0, -118], [-24, -90], [-26, 0], [-24, 100]], EC, ECs)) +
      P('sdRadicle', SC([[-18, 176], [18, 176], [22, 136], [-22, 136]], '#5aa84a', ECs)) +
      P('sdCotyl', SC([[-20, -100], [-8, -150], [40, -172], [90, -150], [112, -95], [100, -40], [82, -36], [84, -90], [62, -128], [25, -134], [10, -104]], '#3c8f3a', ECs) +
        SO([[0, -122], [40, -155], [86, -130], [98, -66]], ECs, 2)) + C(0, 186, 6, '#1a1a1a');
  } else {
    out += P('sdCotyl', SC([[-50, -150], [0, -178], [70, -165], [112, -110], [118, 0], [105, 110], [70, 170], [40, 160], [70, 100], [82, 0], [76, -95], [40, -135], [-5, -140], [-36, -132]], '#2f8a35', ECs) +
        SO([[-20, -158], [40, -158], [96, -104], [100, 0], [86, 108], [56, 164]], ECs, 2)) +
      P('sdAxis', SC([[-78, 172], [-40, 176], [-34, 110], [-38, 20], [-40, -80], [-30, -130], [-62, -150], [-84, -100], [-86, 0], [-84, 100]], EC, ECs)) +
      P('sdHypo', SC([[-84, -40], [-40, -40], [-40, -100], [-32, -128], [-62, -148], [-83, -104]], '#47a043', ECs)) +
      P('sdRadicle', SC([[-80, 172], [-40, 176], [-36, 132], [-82, 130]], '#6cb84f', ECs));
  }
  return out;
}
/* نقاط التأشير المحلية لكل مرحلة (تُحوّل حسب مكان البذرة) */
const SD_EMB_ANCH = [
  { sdTesta: [138, -80], sdEndoN: [9, -40], sdZyg: [-16, 150] },
  { sdTesta: [138, -80], sdEndoT: [110, -86], sdProEmb: [26, 62], sdSusp: [-6, 140] },
  { sdTesta: [138, -80], sdEndoT: [100, -110], sdProEmb: [46, 18], sdSusp: [-6, 140] },
  { sdTesta: [138, -80], sdEndoT: [100, -120], sdProEmb: [44, 60], sdCotyl: [52, -30], sdSusp: [-6, 150] },
  { sdTesta: [138, -80], sdEndoT: [-110, 20], sdAxis: [24, 40], sdCotyl: [108, -80], sdRadicle: [-20, 160] },
  { sdTesta: [138, -80], sdAxis: [-38, 50], sdHypo: [-80, -90], sdCotyl: [116, 0], sdRadicle: [-80, 155] }
];
const SD_EMB_IDS = ['sdTesta', 'sdEndoN', 'sdEndoT', 'sdZyg', 'sdProEmb', 'sdSusp', 'sdCotyl', 'sdAxis', 'sdHypo', 'sdRadicle'];
function sdEmb(){
  const OX = 600, OY = 290, TX = i => 210 + i * 116, TY = 585;
  const big = EMB_STAGES.map((_, i) => `<g id="sdE${i}" opacity="${i ? 0 : 1}">${sdEmbDraw(i, OX, OY, 1, part)}</g>`).join('');
  const thumbs = EMB_STAGES.map((_, i) => `<g>${sdEmbDraw(i, TX(i), TY, 0.2)}<text class="cap sm" x="${TX(i)}" y="${TY + 58}" text-anchor="middle">${i + 1}</text></g>`).join('');
  const LBL = { sdTesta: [866, 100], sdEndoN: [866, 160], sdEndoT: [866, 220], sdCotyl: [866, 280], sdHypo: [866, 340], sdAxis: [866, 400], sdProEmb: [866, 460],
    sdSusp: [134, 360], sdZyg: [134, 420], sdRadicle: [134, 480] };
  const g = (id, i) => { const p = SD_EMB_ANCH[i][id]; return p ? [OX + p[0], OY + p[1]] : false; };
  const first = id => { for (let i = 0; i < 6; i++) if (SD_EMB_ANCH[i][id]) return g(id, i); return [OX, OY]; };
  const body = `${big}
    <g id="sdThSel"><rect x="${TX(0) - 42}" y="${TY - 50}" width="84" height="100" rx="12" fill="rgba(255,209,102,.12)" stroke="#ffd166" stroke-width="2.4"/></g>
    ${thumbs}
    <text class="cap sm" x="500" y="680" text-anchor="middle">مراحل تكوين الجنين في بذرة نبات من ذوات الفلقتين (ص76)</text>`;
  const ctl = stageCtl(EMB_STAGES, { dur: 36 });
  return {
    body, stages: EMB_STAGES, fnParts: ['sdCotyl', 'sdEndoT'],
    parts: SD_EMB_IDS.map(id => ({ id, anchor: first(id), label: LBL[id], side: LBL[id][0] > 500 ? 'R' : 'L' })),
    tools: ctl.tools.concat([{ id: 'info:sdAxis', label: 'مكونات المحور الجنيني' }, { id: 'tbl:sdEmbTbl', label: 'مراحل تكوين الجنين' }]),
    init(){ ctl.start(); },
    onSlider: v => ctl.onSlider(v), onTool: id => ctl.onTool(id),
    tick(dt, t, a){
      ctl.tick(dt);
      const i = STG.idx, k = STG.k;
      for (let j = 0; j < 6; j++){ const e = a.el('#sdE' + j); if (!e) continue;
        e.setAttribute('opacity', j === i ? n2(sdCl(0.25 + k * 6)) : 0); e.style.pointerEvents = j === i ? '' : 'none'; }
      sdTr(a, '#sdThSel', `translate(${n2(TX(i) - TX(0))},0)`);
      const m = {}; SD_EMB_IDS.forEach(id => { m[id] = g(id, i); });
      sdLabels(a, m);
    }
  };
}
/* رسم مستقل كبير لمرحلة الطوربيد أو الجنين الناضج (يطلب رسمهما في الامتحان) */
function sdEmbBig(i){
  const OX = 500, OY = 330, S = 1.35, A = SD_EMB_ANCH[i];
  const at = id => [OX + A[id][0] * S, OY + A[id][1] * S];
  const parts = i === 4 ? [
    { id: 'sdCotyl', short: 'انطواء الفلقتان', anchor: at('sdCotyl'), label: [866, 150], side: 'R' },
    { id: 'sdAxis', anchor: at('sdAxis'), label: [866, 330], side: 'R' },
    { id: 'sdRadicle', anchor: at('sdRadicle'), label: [866, 540], side: 'R' },
    { id: 'sdEndoT', short: 'سويداء', anchor: at('sdEndoT'), label: [134, 330], side: 'L' },
    { id: 'sdTesta', anchor: [OX - 150 * S * 0.75, OY + 200 * S * 0.66], label: [134, 560], side: 'L' }
  ] : [
    { id: 'sdHypo', short: 'سويق', anchor: at('sdHypo'), label: [134, 160], side: 'L' },
    { id: 'sdAxis', anchor: at('sdAxis'), label: [134, 340], side: 'L' },
    { id: 'sdRadicle', anchor: at('sdRadicle'), label: [134, 540], side: 'L' },
    { id: 'sdCotyl', short: 'فلقتان', anchor: at('sdCotyl'), label: [866, 330], side: 'R' },
    { id: 'sdTesta', anchor: [OX + 150 * S * 0.75, OY - 200 * S * 0.66], label: [866, 120], side: 'R' }
  ];
  return {
    body: sdEmbDraw(i, OX, OY, S, part) + `<text class="cap sm" x="500" y="660" text-anchor="middle">${i === 4 ? 'مرحلة الطوربيد: يبدو الجنين أسطوانياً وتتكون الفلقتان بشكل واضح' : 'مرحلة الجنين الناضج: محور جنيني (رويشة + جذير + سويق فلقي) يحمل فلقتين'}</text>`,
    parts, tools: []
  };
}

/* ═════════ 5) تركيب البذور — شكل (3-19) ص77 ═════════ */
const SD_MONO = [[-20, -200], [60, -185], [105, -120], [110, -20], [85, 90], [45, 170], [5, 205], [-40, 185], [-85, 110], [-108, 0], [-100, -110], [-70, -180]];
const SD_KID = [[-10, -200], [70, -182], [108, -115], [96, -45], [74, 0], [96, 55], [110, 125], [72, 188], [-10, 205], [-88, 160], [-116, 60], [-116, -60], [-88, -160]];
function sdMonocot(ox, oy, s, side, P){
  P = P || part;
  const X = (x, y) => [ox + x * s, oy + y * s], XS = pts => pts.map(p => X(p[0], p[1]));
  const sc = (pts, f) => pts.map(p => [p[0] * f, p[1] * f]);
  const emb = [[52, -20], [86, 10], [94, 80], [70, 150], [35, 182], [8, 172], [22, 110], [30, 30]];
  const bx = side === 'L' ? -128 : 128, bd = side === 'L' ? 10 : -10;
  const br = XS([[bx + bd, -30], [bx, -30], [bx, 196], [bx + bd, 196]]);
  const svg =
    P('sdMPeri', `<path d="${smoothClosed(XS(SD_MONO))}" fill="#e9a53a" stroke="#b8741a" stroke-width="${n2(2 * s)}"/>`) +
    P('sdMEndo', `<path d="${smoothClosed(XS(sc(SD_MONO, 0.9)))}" fill="#f1e4c2" stroke="#d9c08a" stroke-width="${n2(1.2 * s)}"/>` +
      [[-40, -100], [-10, -60], [-60, 20], [20, -130], [-30, 90]].map(p => { const q = X(p[0], p[1]); return `<circle cx="${n2(q[0])}" cy="${n2(q[1])}" r="${n2(3 * s)}" fill="#e2d0a0"/>`; }).join('')) +
    P('sdMCot', `<path d="${smoothClosed(XS(emb))}" fill="#b5dc78" stroke="#6f9a3a" stroke-width="${n2(2 * s)}"/>` +
      [[[28, 160], [44, 90], [62, 20]], [[40, 168], [60, 100], [78, 30]], [[52, 160], [72, 100], [86, 60]]].map(l => `<path d="${smoothOpen(XS(l))}" fill="none" stroke="#6f9a3a" stroke-width="${n2(1.6 * s)}"/>`).join('')) +
    P('sdMRad', `<path d="${smoothClosed(XS([[16, 150], [36, 146], [40, 178], [26, 194], [12, 180]]))}" fill="#7fb04a" stroke="#4f7a2a" stroke-width="${n2(1.4 * s)}"/>`) +
    P('sdMEmb', `<path d="M${n2(br[0][0])},${n2(br[0][1])} L${n2(br[1][0])},${n2(br[1][1])} L${n2(br[2][0])},${n2(br[2][1])} L${n2(br[3][0])},${n2(br[3][1])}" fill="none" stroke="#e8ffd0" stroke-width="${n2(2.4 * s)}"/>`);
  const LX = side === 'L' ? 134 : 866;
  const parts = [
    { id: 'sdMPeri', anchor: X(-99, -105), label: [LX, oy - 150 * s], side },
    { id: 'sdMEndo', anchor: X(-40, -40), label: [LX, oy - 75 * s], side },
    { id: 'sdMCot', anchor: X(side === 'L' ? 58 : 88, 40), label: [LX, oy + 10 * s], side },
    { id: 'sdMEmb', anchor: X(bx, 83), label: [LX, oy + 90 * s], side },
    { id: 'sdMRad', anchor: X(side === 'L' ? 22 : 38, 186), label: [LX, oy + 170 * s], side }
  ];
  return { svg, parts };
}
function sdDicot(ox, oy, s, side, P){
  P = P || part;
  const X = (x, y) => [ox + x * s, oy + y * s], XS = pts => pts.map(p => X(p[0], p[1]));
  const sc = (pts, f) => pts.map(p => [p[0] * f - 4, p[1] * f]);
  const leaf = (x0, y0, x1, y1, w) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), px = -dy / L * w, py = dx / L * w;
    return `<path d="${smoothClosed(XS([[x0, y0], [mx + px, my + py], [x1, y1], [mx - px, my - py]]))}" fill="#7cc04a" stroke="#3f7f2d" stroke-width="${n2(1.4 * s)}"/>`; };
  const bx = side === 'R' ? 136 : -136, bd = side === 'R' ? -10 : 10;
  const br = XS([[bx + bd, -160], [bx, -160], [bx, 170], [bx + bd, 170]]);
  const svg =
    P('sdTesta', `<path d="${smoothClosed(XS(SD_KID))}" fill="#8a4524" stroke="#5a2a14" stroke-width="${n2(3 * s)}"/>`) +
    P('sdDCot', `<path d="${smoothClosed(XS(sc(SD_KID, 0.9)))}" fill="#f0ddb0" stroke="#d4b27a" stroke-width="${n2(1.6 * s)}"/>` +
      `<path d="${smoothOpen(XS([[-60, -120], [-80, 0], [-50, 130]]))}" fill="none" stroke="#e2c894" stroke-width="${n2(2 * s)}"/>`) +
    P('sdDRad', `<path d="${smoothClosed(XS([[44, -8], [62, -14], [74, 30], [68, 72], [54, 74], [48, 30]]))}" fill="#f7ecd0" stroke="#b8945a" stroke-width="${n2(1.6 * s)}"/>`) +
    `<g id="sdPlumSw">${P('sdDPlum', `<path d="${smoothOpen(XS([[50, -6], [40, -30], [28, -50]]))}" fill="none" stroke="#5f9f3a" stroke-width="${n2(3 * s)}"/>` +
      leaf(30, -46, 2, -92, 10) + leaf(32, -46, 46, -96, 9))}</g>` +
    P('sdDEmb', `<path d="M${n2(br[0][0])},${n2(br[0][1])} L${n2(br[1][0])},${n2(br[1][1])} L${n2(br[2][0])},${n2(br[2][1])} L${n2(br[3][0])},${n2(br[3][1])}" fill="none" stroke="#e8ffd0" stroke-width="${n2(2.4 * s)}"/>`);
  const LX = side === 'R' ? 866 : 134;
  const parts = [
    { id: 'sdTesta', short: 'غطاء البذرة', anchor: X(side === 'R' ? 74 : -86, side === 'R' ? -180 : -160), label: [LX, oy - 170 * s], side },
    { id: 'sdDPlum', anchor: X(24, -78), label: [LX, oy - 95 * s], side },
    { id: 'sdDEmb', anchor: X(bx, 5), label: [LX, oy - 10 * s], side },
    { id: 'sdDRad', anchor: X(70, 45), label: [LX, oy + 60 * s], side },
    { id: 'sdDCot', anchor: X(-30, 110), label: [LX, oy + 140 * s], side }
  ];
  return { svg, parts };
}
function sdSeeds(still){
  const m = sdMonocot(290, 320, 1, 'L'), d = sdDicot(705, 320, 1, 'R');
  const body = `${m.svg}${d.svg}
    <text class="cap sm" x="290" y="575" text-anchor="middle">(أ) ذوات الفلقة الواحدة — الحنطة</text>
    <text class="cap sm" x="705" y="575" text-anchor="middle">(ب) ذوات الفلقتين — الباقلاء</text>
    <text class="cap sm" x="500" y="645" text-anchor="middle">شكل (3-19): تركيب البذور (أ) ذوات الفلقة الواحدة (ب) ذوات الفلقتين</text>`;
  return {
    body, parts: m.parts.concat(d.parts), fnParts: ['sdMEndo', 'sdDCot'],
    tools: still ? [] : [{ id: 'info:sdSeed', label: 'عرّف البذرة' }, { id: 'info:sdTesta', label: 'عرّف القصرة' }, { id: 'tbl:sdSeedTbl', label: 'مكونات البذور (ص77)' }, { id: 'tbl:sdOrigin', label: 'المنشأ والمجموعة الكروموسومية' }],
    tick(dt, t, a){ sdTr(a, '#sdPlumSw', `rotate(${n2(Math.sin(t * 1.4) * 3)} ${n2(705 + 50)} ${n2(320 - 6)})`); }
  };
}
function sdSeedOne(w){
  const r = w === 'm' ? sdMonocot(500, 320, 1.3, 'L') : sdDicot(480, 320, 1.3, 'R');
  return { body: r.svg + `<text class="cap sm" x="500" y="660" text-anchor="middle">${w === 'm' ? 'تركيب بذرة من ذوات الفلقة الواحدة (الحنطة)' : 'تركيب بذرة من ذوات الفلقتين (الباقلاء)'}</text>`, parts: r.parts, tools: [] };
}

/* ═════════ 6) تركيب الثمرة — ملزمة ص86 (وزاري: ارسم مع التأشير) ═════════ */
function sdFruitPath(ox, oy, f, s){
  const X = (x, y) => n2(ox + x * f * s) + ',' + n2(oy + y * f * s);
  return `M${X(-270, 0)} C${X(-250, -150)} ${X(10, -190)} ${X(140, -130)} C${X(220, -95)} ${X(280, -20)} ${X(282, 0)} C${X(280, 20)} ${X(220, 95)} ${X(140, 130)} C${X(10, 190)} ${X(-250, 150)} ${X(-270, 0)}Z`;
}
function sdFruitDraw(ox, oy, s){
  const X = (x, y) => [ox + x * s, oy + y * s];
  const g = rng(17); let rad = '', spk = '';
  for (let d = 0; d < 360; d += 10){ const a = d * Math.PI / 180, c = Math.cos(a), si = Math.sin(a);
    const p = X(c * 276 * 0.63, si * 160 * 0.63), q = X(c * 276 * 0.9, si * 160 * 0.9);
    rad += `<line x1="${n2(p[0])}" y1="${n2(p[1])}" x2="${n2(q[0])}" y2="${n2(q[1])}" stroke="#e8a878" stroke-width="${n2(1.2 * s)}" opacity=".8"/>`; }
  for (let j = 0; j < 90; j++){ const a = g() * 6.283, rr = 0.5 + g() * 0.085, p = X(Math.cos(a) * 276 * rr, Math.sin(a) * 160 * rr);
    spk += `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${n2((1.2 + g() * 1.6) * s)}" fill="${g() < 0.5 ? '#6a4424' : '#d9b07a'}"/>`; }
  const st = X(-300, 0), sk = X(-268, 0), sd = X(-102, 0);
  return part('sdExo', `<rect x="${n2(st[0])}" y="${n2(st[1] - 7 * s)}" width="${n2(sk[0] - st[0])}" height="${n2(14 * s)}" rx="${n2(4 * s)}" fill="#7a5a32"/>` +
      `<path d="${sdFruitPath(ox, oy, 1, s)}" fill="#e88a4a" stroke="#ffc08a" stroke-width="${n2(2 * s)}"/>`) +
    part('sdMeso', `<path d="${sdFruitPath(ox, oy, 0.95, s)}" fill="#fbd2a8"/>` + rad) +
    part('sdEndo', `<path d="${sdFruitPath(ox, oy, 0.6, s)}" fill="#a8784a" stroke="#7a5230" stroke-width="${n2(1.4 * s)}"/>` + spk +
      `<path d="${sdFruitPath(ox, oy, 0.48, s)}" fill="#f4e6c8" stroke="#c9a26a" stroke-width="${n2(1.2 * s)}"/>`) +
    part('sdFSeed', `<line x1="${n2(sk[0])}" y1="${n2(sk[1])}" x2="${n2(sd[0])}" y2="${n2(sd[1])}" stroke="#f4e6c8" stroke-width="${n2(3 * s)}"/>` +
      `<path d="${sdFruitPath(ox, oy, 0.37, s)}" fill="#3faa48" stroke="#1f6a28" stroke-width="${n2(2 * s)}"/>` +
      `<path d="${sdFruitPath(ox, oy, 0.25, s)}" fill="none" stroke="#7fd08a" stroke-width="${n2(1.2 * s)}" opacity=".6"/>`);
}
function sdFruit(still){
  const OX = 510, OY = 320;
  const body = `<g id="sdFruitG">${sdFruitDraw(OX, OY, 1)}
      <g id="sdOvTint" opacity="0" pointer-events="none"><path d="${sdFruitPath(OX, OY, 1, 1)}" fill="#7cc35a" opacity=".85"/><path d="${sdFruitPath(OX, OY, 0.37, 1)}" fill="#ffcf9a" stroke="#d9894a" stroke-width="3"/></g></g>
    <g id="sdGrowTxt" opacity="0"><text class="cap" x="510" y="560" text-anchor="middle" fill="#ffd166">جدار المبيض ← الثمرة بطبقاتها الثلاث · البويض ← البذرة</text></g>
    <text class="cap sm" x="500" y="645" text-anchor="middle">تركيب الثمرة: الثمرة مبيض ناضج مع محتوياته وأغلفته وتتكون بداخله البذور</text>`;
  let grown = false;
  return {
    body, fnParts: ['sdMeso', 'sdEndo'],
    parts: [
      { id: 'sdExo', anchor: [660, 196], label: [866, 170], side: 'R' },
      { id: 'sdMeso', anchor: [700, 280], label: [866, 270], side: 'R' },
      { id: 'sdEndo', anchor: [662, 340], label: [866, 370], side: 'R' },
      { id: 'sdFSeed', anchor: [430, 320], label: [134, 320], side: 'L' }
    ],
    tools: still ? [] : [{ id: 'sdGrow', label: 'من المبيض إلى ثمرة', toggle: true }, { id: 'info:sdFruitI', label: 'عرّف الثمرة' }, { id: 'info:sdFalse', label: 'الثمار الكاذبة' },
      { id: 'info:sdPollenRole', label: 'دور حبوب اللقاح' }, { id: 'tbl:sdFruitOrg', label: 'منشأ الثمار (ص82)' }, { id: 'tbl:sdFruitChg', label: 'تغيرات النضج (ص83)' }, { id: 'info:sdParthe', label: 'الإثمار العذري' }, { id: 'tbl:sdParth', label: 'العذري الطبيعي × الاصطناعي (ص85)' }],
    tick(dt, t, a){
      if (still) return;
      const on = a.tool('sdGrow');
      if (on){
        const p = (t * 0.16) % 1, q = sdEase(p / 0.7), sc = 0.3 + 0.7 * q;
        sdTr(a, '#sdFruitG', `translate(${OX},${OY}) scale(${n2(sc * 100) / 100}) translate(${-OX},${-OY})`);
        sdOp(a, '#sdOvTint', 1 - q); sdOp(a, '#sdGrowTxt', 1);
        if (!grown){ grown = true; a.hideLabels(true); }
      } else if (grown){
        grown = false; sdTr(a, '#sdFruitG', ''); sdOp(a, '#sdOvTint', 0); sdOp(a, '#sdGrowTxt', 0); a.hideLabels(false);
      }
    }
  };
}

/* ═════════ 7) أنواع الثمار وانتشار الثمار والبذور — ملزمة ص86–88 ═════════ */
function sdTypes(still){
  const card = (x, y, t) => `<rect x="${x - 120}" y="${y - 122}" width="240" height="230" rx="16" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.18)"/>` +
    `<text class="cap sm" x="${x}" y="${y - 98}" text-anchor="middle" fill="#ffe2b0">${t}</text>`;
  const T1 = 200, T2 = 465;
  /* ثمرة بسيطة: مشمش */
  const apricot = `<path d="M230,${T1 - 52} Q240,${T1 - 75} 262,${T1 - 80}" fill="none" stroke="#6a4a2a" stroke-width="4"/>` +
    `<path d="${smoothClosed([[262, T1 - 80], [292, T1 - 92], [300, T1 - 74], [270, T1 - 70]])}" fill="#5fae45" stroke="#2f6f25"/>` +
    `<circle cx="230" cy="${T1 + 4}" r="58" fill="#f5a742" stroke="#ffd59a" stroke-width="2"/><path d="M226,${T1 - 52} Q206,${T1 + 4} 226,${T1 + 60}" fill="none" stroke="#d9802a" stroke-width="3"/>` +
    `<ellipse cx="250" cy="${T1 - 16}" rx="16" ry="10" fill="#ffd28a" opacity=".6"/>`;
  /* ثمرة متجمعة: التوت الأسود */
  const g = rng(5); let dr = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4 + (r % 2); c++){ const x = 500 - (3 + (r % 2)) * 11 + c * 22 + (g() - 0.5) * 3, y = T1 - 30 + r * 19;
    if ((x - 500) ** 2 / 2500 + (y - T1 - 8) ** 2 / 2900 > 1) continue;
    dr += `<circle cx="${n2(x)}" cy="${n2(y)}" r="11.5" fill="#3a1d4a" stroke="#6a3a80" stroke-width="1.4"/><circle cx="${n2(x - 3.5)}" cy="${n2(y - 3.5)}" r="3" fill="#a080c0" opacity=".7"/>`; }
  const berry = `<path d="M500,${T1 - 58} L500,${T1 - 82}" stroke="#4f8a35" stroke-width="4"/>` +
    [-40, -14, 14, 40].map(d => `<path d="${smoothClosed([[500, T1 - 52], [500 + d, T1 - 64], [500 + d * 1.3, T1 - 48]])}" fill="#5fae45" stroke="#2f6f25"/>`).join('') + dr;
  /* ثمرة مركبة: الأناناس */
  let pine = `<ellipse cx="770" cy="${T1 + 18}" rx="50" ry="66" fill="#e6a93a" stroke="#ffd28a" stroke-width="2"/>`;
  for (let k = -5; k <= 5; k++){ pine += `<line x1="${770 + k * 18 - 60}" y1="${T1 - 50}" x2="${770 + k * 18 + 60}" y2="${T1 + 90}" stroke="#a8701a" stroke-width="1.6"/>` +
    `<line x1="${770 + k * 18 + 60}" y1="${T1 - 50}" x2="${770 + k * 18 - 60}" y2="${T1 + 90}" stroke="#a8701a" stroke-width="1.6"/>`; }
  pine = `<clipPath id="sdPineC"><ellipse cx="770" cy="${T1 + 18}" rx="50" ry="66"/></clipPath>` + `<ellipse cx="770" cy="${T1 + 18}" rx="50" ry="66" fill="#e6a93a"/><g clip-path="url(#sdPineC)">${pine}</g>` +
    `<ellipse cx="770" cy="${T1 + 18}" rx="50" ry="66" fill="none" stroke="#ffd28a" stroke-width="2"/>` +
    [-34, -20, -8, 6, 20, 34].map((d, i) => `<path d="M770,${T1 - 44} Q${770 + d * 0.6},${T1 - 70} ${770 + d},${T1 - 92 + Math.abs(d) * 0.6}" fill="none" stroke="${i % 2 ? '#4f9a3a' : '#6fbf4a'}" stroke-width="6" stroke-linecap="round"/>`).join('');
  /* الرياح: بذرة بشعيرات على شكل مظلة */
  let hairs = ''; for (let k = -6; k <= 6; k++){ const a = -Math.PI / 2 + k * 0.2; hairs += `<line x1="0" y1="-30" x2="${n2(Math.cos(a) * 46)}" y2="${n2(-30 + Math.sin(a) * 34)}" stroke="#f4f4ff" stroke-width="1.3"/>`; }
  const wind = `<g id="sdWindS" transform="translate(230,${T2})">${hairs}<line x1="0" y1="-30" x2="0" y2="14" stroke="#d9c9a0" stroke-width="2"/><ellipse cx="0" cy="22" rx="5" ry="11" fill="#7a5a32"/></g>` +
    [0, 1, 2].map(i => `<path d="M${130 + i * 10},${T2 - 60 + i * 34} q30,-12 60,0 t60,0" fill="none" stroke="#9fd8ff" stroke-width="2" opacity=".5"/>`).join('');
  /* الماء: جوز الهند يطفو */
  const water = `<g id="sdCoco" transform="translate(500,${T2 + 6})"><ellipse cx="0" cy="0" rx="40" ry="34" fill="#8a5a2a" stroke="#c9945a" stroke-width="2"/>` +
    `<path d="M-30,-14 Q0,-30 30,-14 M-34,4 Q0,-12 34,4 M-28,20 Q0,6 28,20" fill="none" stroke="#6a4020" stroke-width="2"/></g>` +
    `<clipPath id="sdWaveC"><rect x="382" y="${T2 - 120}" width="236" height="226" rx="14"/></clipPath>` +
    `<g clip-path="url(#sdWaveC)"><path id="sdWave" d="M382,${T2 + 26} q15,-8 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 L682,${T2 + 104} L382,${T2 + 104}Z" fill="#2f7fb8" opacity=".75"/></g>`;
  /* الحيوانات: ثمار بأشواك تتعلق بالجلد */
  let fur = ''; for (let k = 0; k < 22; k++){ const x = 665 + k * 10; fur += `<path d="M${x},${T2 + 90} q${k % 2 ? 6 : -6},-26 ${k % 2 ? -2 : 2},-58" fill="none" stroke="#a0703a" stroke-width="3" stroke-linecap="round"/>`; }
  const burr = (x, y) => { let s = `<circle cx="${x}" cy="${y}" r="15" fill="#9a8a3a" stroke="#d9c870" stroke-width="1.4"/>`;
    for (let k = 0; k < 12; k++){ const a = k * 0.5236, x1 = x + Math.cos(a) * 15, y1 = y + Math.sin(a) * 15, x2 = x + Math.cos(a) * 25, y2 = y + Math.sin(a) * 25;
      s += `<path d="M${n2(x1)},${n2(y1)} L${n2(x2)},${n2(y2)} q${n2(Math.cos(a + 1.6) * 4)},${n2(Math.sin(a + 1.6) * 4)} ${n2(-Math.cos(a) * 4)},${n2(-Math.sin(a) * 4)}" fill="none" stroke="#d9c870" stroke-width="1.8"/>`; }
    return s; };
  const animal = `<rect x="655" y="${T2 + 20}" width="230" height="74" rx="10" fill="#6a4a2a"/>${fur}<g id="sdBurr">${burr(735, T2 + 2)}${burr(805, T2 + 14)}</g>`;
  const body = `
    ${card(230, T1, 'المشمش')}${card(500, T1, 'التوت الأسود')}${card(770, T1, 'الأناناس')}
    ${card(230, T2, 'بذور البردي')}${card(500, T2, 'ثمار جوز الهند')}${card(770, T2, 'أشواك وشعيرات')}
    ${part('sdSimple', apricot)}${part('sdAggr', berry)}${part('sdMulti', pine)}
    ${part('sdWind', wind)}${part('sdWater', water)}${part('sdAnimal', animal)}
    <text class="cap sm" x="500" y="660" text-anchor="middle">أنواع الثمار (ص86) وعوامل انتشار الثمار والبذور (ص88)</text>`;
  return {
    body,
    parts: [
      { id: 'sdSimple', anchor: [230, T1 + 62], label: [230, T1 + 128], side: 'C' },
      { id: 'sdAggr', anchor: [500, T1 + 58], label: [500, T1 + 128], side: 'C' },
      { id: 'sdMulti', anchor: [770, T1 + 84], label: [770, T1 + 128], side: 'C' },
      { id: 'sdWind', anchor: [230, T2 + 34], label: [230, T2 + 132], side: 'C' },
      { id: 'sdWater', anchor: [500, T2 + 50], label: [500, T2 + 132], side: 'C' },
      { id: 'sdAnimal', anchor: [770, T2 + 94], label: [770, T2 + 132], side: 'C' }
    ],
    tools: still ? [] : [{ id: 'tbl:sdFruitTypes', label: 'أنواع الثمار (ص86)' }, { id: 'tbl:sdDisp', label: 'انتشار الثمار والبذور (ص88)' }, { id: 'tbl:sdParth', label: 'الإثمار العذري (ص85)' }],
    tick(dt, t, a){
      if (still) return;
      const p = (t * 0.12) % 1;
      sdTr(a, '#sdWindS', `translate(${n2(170 + p * 120)},${n2(T2 + 40 - p * 70 + Math.sin(t * 2) * 8)}) rotate(${n2(Math.sin(t * 1.7) * 12)})`);
      sdTr(a, '#sdCoco', `translate(${n2(500 + Math.sin(t * 0.8) * 20)},${n2(T2 + 6 + Math.sin(t * 2.2) * 5)}) rotate(${n2(Math.sin(t * 1.3) * 8)})`);
      sdTr(a, '#sdWave', `translate(${n2(-((t * 20) % 60))},0)`);
      sdTr(a, '#sdBurr', `rotate(${n2(Math.sin(t * 1.6) * 3)} 770 ${T2 + 60})`);
    }
  };
}

