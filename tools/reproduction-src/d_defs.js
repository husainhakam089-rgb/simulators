
/* ══════════════════════════════════════════════════════════════════════════
   2 · أدوات رسم عامة (SVG)
   ══════════════════════════════════════════════════════════════════════════ */

const SVGNS = 'http://www.w3.org/2000/svg';

/* مولّد أرقام شبه عشوائية ثابت — حتى يبقى شكل الخلية نفسه بكل تشغيل */
function rng(seed){ let s = seed >>> 0;
  return function(){ s = (s + 0x6D2B79F5) >>> 0; let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const n2 = v => Math.round(v * 10) / 10;

/* مسار مغلق ناعم يمر بكل النقاط (Catmull-Rom → Bezier) */
function smoothClosed(pts){
  const n = pts.length; let d = `M${n2(pts[0][0])},${n2(pts[0][1])}`;
  for (let i = 0; i < n; i++){
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n2(c1[0])},${n2(c1[1])} ${n2(c2[0])},${n2(c2[1])} ${n2(p2[0])},${n2(p2[1])}`;
  }
  return d + 'Z';
}
/* مسار مفتوح ناعم */
function smoothOpen(pts){
  if (pts.length < 3) return `M${pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L')}`;
  let d = `M${n2(pts[0][0])},${n2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1],
          p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n2(c1[0])},${n2(c1[1])} ${n2(c2[0])},${n2(c2[1])} ${n2(p2[0])},${n2(p2[1])}`;
  }
  return d;
}

/* حدود خلية غير منتظمة الشكل (واقعية) */
function blobPath(cx, cy, rx, ry, wob, seed, steps){
  const r = rng(seed), pts = [], k = steps || 22;
  for (let i = 0; i < k; i++){
    const a = i / k * Math.PI * 2, w = 1 + (r() - 0.5) * 2 * wob;
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  return { d: smoothClosed(pts), pts };
}
/* مسار مصغّر من نفس الشكل (للأغشية المزدوجة والجدران) */
function insetBlob(pts, cx, cy, k){
  return smoothClosed(pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]));
}

/* شريط متموّج للشبكة البلازمية الداخلية: يرجع المسار + مواقع الرايبوسومات + نقاط المسير */
function erRibbon(x0, y0, dx, dy, amp, cycles, steps){
  const pts = [], k = steps || 26, len = Math.hypot(dx, dy),
        ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  for (let i = 0; i <= k; i++){
    const t = i / k, s = Math.sin(t * Math.PI * 2 * cycles) * amp * Math.sin(Math.PI * t * 0.9 + 0.3);
    pts.push([x0 + ux * len * t + nx * s, y0 + uy * len * t + ny * s]);
  }
  const dots = [];
  for (let i = 1; i < k; i += 2){
    const p = pts[i], q = pts[i + 1] || pts[i - 1];
    const tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1;
    const px = -ty / tl, py = tx / tl, off = 7.5;
    dots.push([p[0] + px * off, p[1] + py * off]);
    if (i % 4 === 1) dots.push([p[0] - px * off, p[1] - py * off]);
  }
  return { d: smoothOpen(pts), dots, pts };
}

/* تعريفات مشتركة: تدرجات لونية، ظلال، توهّج، نسيج */
const DEFS = `
<defs>
  <radialGradient id="gCyto" cx="42%" cy="38%" r="72%">
    <stop offset="0%"  stop-color="#43695c" stop-opacity=".97"/>
    <stop offset="58%" stop-color="#2c4a41" stop-opacity=".95"/>
    <stop offset="100%" stop-color="#1b302b" stop-opacity=".95"/>
  </radialGradient>
  <linearGradient id="gMemb" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#ffe6b4"/>
    <stop offset="50%"  stop-color="#e0b169"/>
    <stop offset="100%" stop-color="#9c7a3c"/>
  </linearGradient>
  <radialGradient id="gNucl" cx="38%" cy="32%" r="78%">
    <stop offset="0%"  stop-color="#a99ce8"/>
    <stop offset="55%" stop-color="#7565c2"/>
    <stop offset="100%" stop-color="#453a80"/>
  </radialGradient>
  <radialGradient id="gNucleolus" cx="36%" cy="34%" r="70%">
    <stop offset="0%"  stop-color="#7c62c9"/>
    <stop offset="100%" stop-color="#3a2a70"/>
  </radialGradient>
  <radialGradient id="gMito" cx="34%" cy="28%" r="80%">
    <stop offset="0%"  stop-color="#f0a86f"/>
    <stop offset="55%" stop-color="#d4703c"/>
    <stop offset="100%" stop-color="#8f4522"/>
  </radialGradient>
  <linearGradient id="gGolgi" x1="0" y1="0" x2="1" y2="0.4">
    <stop offset="0%"  stop-color="#eda0c4"/>
    <stop offset="60%" stop-color="#c76093"/>
    <stop offset="100%" stop-color="#8d3a63"/>
  </linearGradient>
  <radialGradient id="gLyso" cx="35%" cy="30%" r="75%">
    <stop offset="0%"  stop-color="#c49ce8"/>
    <stop offset="100%" stop-color="#6f3ba0"/>
  </radialGradient>
  <linearGradient id="gRer" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"  stop-color="#8fb4d8"/>
    <stop offset="100%" stop-color="#4d6c94"/>
  </linearGradient>
  <linearGradient id="gSer" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"  stop-color="#9fcbb6"/>
    <stop offset="100%" stop-color="#55886f"/>
  </linearGradient>
  <radialGradient id="gChloro" cx="34%" cy="30%" r="76%">
    <stop offset="0%"  stop-color="#8ed473"/>
    <stop offset="55%" stop-color="#4c9c45"/>
    <stop offset="100%" stop-color="#245e2a"/>
  </radialGradient>
  <radialGradient id="gVac" cx="40%" cy="32%" r="75%">
    <stop offset="0%"  stop-color="#7fc0e0" stop-opacity=".55"/>
    <stop offset="70%" stop-color="#4a8cb4" stop-opacity=".42"/>
    <stop offset="100%" stop-color="#2f6383" stop-opacity=".5"/>
  </radialGradient>
  <linearGradient id="gWall" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"  stop-color="#d8bd80"/>
    <stop offset="45%" stop-color="#b09253"/>
    <stop offset="100%" stop-color="#7d663a"/>
  </linearGradient>
  <radialGradient id="gGran" cx="35%" cy="30%" r="72%">
    <stop offset="0%"  stop-color="#e3c98f"/>
    <stop offset="100%" stop-color="#8d7233"/>
  </radialGradient>
  <radialGradient id="gCentro" cx="35%" cy="30%" r="75%">
    <stop offset="0%"  stop-color="#c8d2dc"/>
    <stop offset="100%" stop-color="#5e6b78"/>
  </radialGradient>
  <radialGradient id="gLight" cx="50%" cy="0%" r="90%">
    <stop offset="0%"  stop-color="#fff3c4" stop-opacity=".55"/>
    <stop offset="100%" stop-color="#fff3c4" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gBact" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"  stop-color="#c9b06f"/>
    <stop offset="100%" stop-color="#8b7434"/>
  </linearGradient>
  <radialGradient id="gBactCyto" cx="40%" cy="32%" r="78%">
    <stop offset="0%"  stop-color="#5b6f52"/>
    <stop offset="100%" stop-color="#2a3627"/>
  </radialGradient>

  <radialGradient id="gAtp" cx="34%" cy="28%" r="78%">
    <stop offset="0%"  stop-color="#fff3cf"/>
    <stop offset="52%" stop-color="#ffd166"/>
    <stop offset="100%" stop-color="#c98f1e"/>
  </radialGradient>
  <radialGradient id="gAtpUsed" cx="34%" cy="28%" r="78%">
    <stop offset="0%"  stop-color="#cfc6b8"/>
    <stop offset="55%" stop-color="#8b8175"/>
    <stop offset="100%" stop-color="#4e473f"/>
  </radialGradient>
  <filter id="fGlow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".55"/>
  </filter>
  <filter id="fBlur6"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="fGrain">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="t"/>
    <feColorMatrix in="t" type="saturate" values="0" result="g"/>
    <feComposite in="g" in2="SourceGraphic" operator="in"/>
  </filter>
</defs>`;

/* أشكال عضيات جاهزة — التحويل (transform) دائماً على مجموعة خارجية،
   ومجموعة .part بلا transform حتى يعمل تكبيرها عند التحديد بـ CSS */
function part(id, inner, extra){
  return `<g class="part" data-part="${id}"${extra ? ' ' + extra : ''}>${inner}</g>`;
}
function wrap(tr, inner){ return `<g transform="${tr}">${inner}</g>`; }

/* مايتوكوندريا: غشاء مزدوج + أعراف (كرستي) */
function mitoShape(w, h){
  const rx = w / 2, ry = h / 2, cr = [];
  for (let i = -3; i <= 3; i++){
    const x = i * (w * 0.13);
    const yy = ry * 0.82 * Math.sqrt(Math.max(0, 1 - (x / (rx * 0.94)) ** 2));
    cr.push(`M${n2(x)},${n2(-yy)} C${n2(x + 9)},${n2(-yy * .45)} ${n2(x - 9)},${n2(yy * .45)} ${n2(x)},${n2(yy)}`);
  }
  return `
    <ellipse rx="${n2(rx)}" ry="${n2(ry)}" fill="url(#gMito)" stroke="#f6c79c" stroke-width="2.2" filter="url(#fSoft)"/>
    <ellipse rx="${n2(rx - 5)}" ry="${n2(ry - 5)}" fill="none" stroke="#ffdcb8" stroke-width="1.3" opacity=".75"/>
    <g stroke="#ffd9ac" stroke-width="2" fill="none" opacity=".85" stroke-linecap="round">${cr.join('')}</g>
    <ellipse class="mitoGlow" rx="${n2(rx + 3)}" ry="${n2(ry + 3)}" fill="none"
             stroke="#ffcf8a" stroke-width="3" opacity="0"/>`;
}
/* جهاز كولجي / الدكتيوسوم: أكياس مسطحة متراكبة */
function golgiShape(){
  const s = [];
  for (let i = 0; i < 5; i++){
    const w = 108 - i * 13, y = i * 15;
    s.push(`<path d="M${-w / 2},${y} C${-w / 3},${y - 13} ${w / 3},${y - 13} ${w / 2},${y}
             C${w / 3},${y + 7} ${-w / 3},${y + 7} ${-w / 2},${y} Z"
             fill="url(#gGolgi)" stroke="#f7c0da" stroke-width="1.6"/>`);
  }
  return `<g filter="url(#fSoft)">${s.join('')}</g>
    <circle cx="-64" cy="14" r="7" fill="url(#gGolgi)" stroke="#f7c0da" stroke-width="1.2" opacity=".9"/>
    <circle cx="66" cy="42" r="6" fill="url(#gGolgi)" stroke="#f7c0da" stroke-width="1.2" opacity=".9"/>
    <circle cx="-56" cy="58" r="5" fill="url(#gGolgi)" stroke="#f7c0da" stroke-width="1.2" opacity=".85"/>`;
}
/* جسيم حال: حويصلة بحبيبات إنزيمية */
function lysoShape(r){
  const rr = rng(Math.round(r * 97)), g = [];
  for (let i = 0; i < 9; i++){
    const a = rr() * 6.283, d = rr() * (r - 5);
    g.push(`<circle cx="${n2(Math.cos(a) * d)}" cy="${n2(Math.sin(a) * d)}" r="${n2(1.4 + rr() * 1.5)}" fill="#f0dcff" opacity=".8"/>`);
  }
  return `<circle r="${r}" fill="url(#gLyso)" stroke="#dcc0f5" stroke-width="2" filter="url(#fSoft)"/>${g.join('')}`;
}
/* بلاستيدة خضراء: غشاء مزدوج + غرانا (أكوام ثايلاكويد) + ستروما */
function chloroShape(w, h){
  const rx = w / 2, ry = h / 2, st = [];
  const spots = [[-26, -9], [-6, 9], [16, -11], [32, 8], [-16, -22], [4, -24], [-34, 12], [24, 22]];
  spots.forEach(([x, y]) => {
    const lines = [];
    for (let i = 0; i < 4; i++) lines.push(`<rect x="-8" y="${-5 + i * 3.1}" width="16" height="2.1" rx="1" fill="#1f6b2a" opacity=".9"/>`);
    st.push(`<g transform="translate(${x},${y})"><ellipse rx="9.5" ry="6.4" fill="#2f8035" opacity=".95"/>${lines.join('')}</g>`);
  });
  return `
    <ellipse rx="${n2(rx)}" ry="${n2(ry)}" fill="url(#gChloro)" stroke="#bdf0a6" stroke-width="2" filter="url(#fSoft)"/>
    <ellipse rx="${n2(rx - 4)}" ry="${n2(ry - 4)}" fill="none" stroke="#d8ffc8" stroke-width="1.1" opacity=".6"/>
    <g class="grana">${st.join('')}</g>
    <ellipse class="chloroGlow" rx="${n2(rx + 3)}" ry="${n2(ry + 3)}" fill="none" stroke="#eaffb0" stroke-width="3" opacity="0"/>`;
}
/* جسم مركزي: جسيمان مركزيان متعامدان + أنيبيبات */
function centroShape(){
  const tub = [];
  for (let i = 0; i < 9; i++){
    const a = i / 9 * 6.283;
    tub.push(`<line x1="${n2(Math.cos(a) * 15)}" y1="${n2(Math.sin(a) * 15)}"
      x2="${n2(Math.cos(a) * 27)}" y2="${n2(Math.sin(a) * 27)}" stroke="#aab6c2" stroke-width="1.2" opacity=".5"/>`);
  }
  return `<g opacity=".9">${tub.join('')}</g>
    <g transform="rotate(-18)"><rect x="-17" y="-6" width="34" height="12" rx="4" fill="url(#gCentro)" stroke="#dfe7ee" stroke-width="1.4"/>
      <line x1="-13" y1="0" x2="13" y2="0" stroke="#6b7783" stroke-width="1"/></g>
    <g transform="translate(6,12) rotate(74)"><rect x="-16" y="-5.5" width="32" height="11" rx="4" fill="url(#gCentro)" stroke="#dfe7ee" stroke-width="1.4"/>
      <line x1="-12" y1="0" x2="12" y2="0" stroke="#6b7783" stroke-width="1"/></g>`;
}
/* النواة: غلاف نووي مزدوج بثقوب + نوية + شبكة كروماتينية */
function nucleusShape(r, seed, showParts){
  const rr = rng(seed || 11), pores = [], chrom = [];
  for (let i = 0; i < 16; i++){
    const a = i / 16 * 6.283 + 0.12;
    pores.push(`<g transform="translate(${n2(Math.cos(a) * r)},${n2(Math.sin(a) * r)}) rotate(${n2(a * 57.3)})">
      <rect x="-2.6" y="-4.6" width="5.2" height="9.2" rx="2.2" fill="#2a2140" stroke="#cbbcf6" stroke-width="1.1"/></g>`);
  }
  for (let i = 0; i < 9; i++){
    const pts = [];
    let a = rr() * 6.283, d = 12 + rr() * (r * 0.62);
    for (let j = 0; j < 5; j++){
      a += (rr() - 0.5) * 2.2; d = Math.min(r * 0.78, Math.max(8, d + (rr() - 0.5) * 34));
      pts.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    chrom.push(`<path d="${smoothOpen(pts)}" fill="none" stroke="#3a2d6b" stroke-width="${n2(1.6 + rr() * 1.5)}"
      opacity=".85" stroke-linecap="round"/>`);
  }
  const body = `
    <circle r="${r}" fill="url(#gNucl)" stroke="#cbbcf6" stroke-width="2" filter="url(#fSoft)"/>
    <circle r="${n2(r - 5)}" fill="none" stroke="#e2d8ff" stroke-width="1.2" opacity=".55"/>`;
  if (!showParts) return body + `<g>${chrom.join('')}</g><g>${pores.join('')}</g>
    <circle cx="${n2(-r * 0.22)}" cy="${n2(r * 0.16)}" r="${n2(r * 0.3)}" fill="url(#gNucleolus)" stroke="#b6a3ef" stroke-width="1.4"/>`;
  /* داخل الخلايا: النوية وحدها جزء قابل للضغط، والباقي زخرفة لا تحجب النواة */
  return body
    + `<g pointer-events="none">${chrom.join('')}</g>`
    + `<g pointer-events="none">${pores.join('')}</g>`
    + part('nucleolus', `<circle cx="${n2(-r * 0.22)}" cy="${n2(r * 0.16)}" r="${n2(r * 0.3)}"
        fill="url(#gNucleolus)" stroke="#b6a3ef" stroke-width="1.6"/>`);
}
