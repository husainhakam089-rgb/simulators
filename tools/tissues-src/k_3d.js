
/* ══════════════════════════════════════════════════════════════════════════
   9 · العرض ثلاثي الأبعاد — محرّك WebGL صغير مكتوب هنا (بلا مكتبات، بلا إنترنت)
   ══════════════════════════════════════════════════════════════════════════
   المجسمات بنفس أجزاء الرسوم وأسمائها؛ تُدار بالسحب، وتُقرّب بإصبعين أو بعجلة
   الماوس، والضغط على أي جزء أو اسمه يفتح معلوماته كما في الرسم المسطّح. */
const G3 = { models: {} };

(function(){
/* ── متجهات ومصفوفات ── */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/* دوران 3×3 (صفوف) من زوايا x ثم y ثم z */
function rot3(ax, ay, az){
  const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
  return [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
          sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
          -sy,     cy * sx,                cy * cx];
}
const ap3 = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
/* دوران يوجّه المحور y المحلي نحو d */
function alignY(d){
  const n = norm(d), c = n[1];
  if (c > 0.9999) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  if (c < -0.9999) return [1, 0, 0, 0, -1, 0, 0, 0, -1];
  const a = norm(cross([0, 1, 0], n)), s = Math.sqrt(1 - c * c), t = 1 - c, [x, y, z] = a;
  return [t * x * x + c, t * x * y - s * z, t * x * z + s * y,
          t * x * y + s * z, t * y * y + c, t * y * z - s * x,
          t * x * z - s * y, t * y * z + s * x, t * z * z + c];
}
function rotAxis(v, k, ang){
  const c = Math.cos(ang), s = Math.sin(ang);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
}
function persp(fov, asp, n, f){
  const t = 1 / Math.tan(fov / 2);
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0];
}
function m4mul(a, b){
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++){
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
  }
  return o;
}
function lookAt(eye, tgt, up){
  const z = norm(sub(eye, tgt)), x = norm(cross(up, z)), y = cross(z, x);
  return { m: [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1], x, y, z };
}
const popM = (c, k) => [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k), 1];
const hex = h => { const v = parseInt(h.slice(1), 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; };

/* ── بناء المجسمات ── (مواقع p، اتجاهات n، إحداثيات محلية l للنقوش) */
const mk = () => ({ p: [], n: [], l: [], i: [] });
function gridIdx(m, R, C, base){
  base = base || 0;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++){
    const a = base + i * C + j, b = base + i * C + (j + 1) % C, c = base + (i + 1) * C + j, d = base + (i + 1) * C + (j + 1) % C;
    m.i.push(a, c, b, b, c, d);
  }
}
function computeNormals(m){
  const n = new Array(m.p.length).fill(0), P = m.p;
  for (let k = 0; k < m.i.length; k += 3){
    const a = m.i[k] * 3, b = m.i[k + 1] * 3, c = m.i[k + 2] * 3;
    const f = cross([P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]]);
    for (const v of [a, b, c]){ n[v] += f[0]; n[v + 1] += f[1]; n[v + 2] += f[2]; }
  }
  for (let v = 0; v < n.length; v += 3){ const l = Math.hypot(n[v], n[v + 1], n[v + 2]) || 1; n[v] /= l; n[v + 1] /= l; n[v + 2] /= l; }
  m.n = n; return m;
}
/* إهليلج (كرة مشوّهة اختيارياً) */
function ellipsoid(o){
  const r = Array.isArray(o.r) ? o.r : [o.r, o.r, o.r], R = o.rows || 14, C = o.cols || 24, m = mk();
  for (let i = 0; i <= R; i++){
    const ph = -Math.PI / 2 + Math.PI * i / R, cp = Math.cos(ph), sp = Math.sin(ph);
    for (let j = 0; j < C; j++){
      const th = 2 * Math.PI * j / C, d = [cp * Math.cos(th), sp, cp * Math.sin(th)];
      const k = o.disp ? o.disp(d) : 1;
      let p = [d[0] * r[0] * k, d[1] * r[1] * k, d[2] * r[2] * k];
      if (o.warp) p = o.warp(p);
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]);
      const nn = norm([d[0] / r[0], d[1] / r[1], d[2] / r[2]]); m.n.push(nn[0], nn[1], nn[2]);
    }
  }
  gridIdx(m, R, C);
  if (o.disp || o.warp) computeNormals(m);
  return m;
}
/* شكل فائق (صندوق مدوّر الحواف أو بيضوي مسطّح) */
function superEll(o){
  const h = o.h, e = o.e || 0.3, R = o.rows || 28, C = o.cols || 44, m = mk();
  const sp = (w, x) => Math.sign(w) * Math.pow(Math.abs(w), x);
  for (let i = 0; i <= R; i++){
    const ph = -Math.PI / 2 + Math.PI * i / R, cp = Math.cos(ph), s = Math.sin(ph);
    for (let j = 0; j < C; j++){
      const th = 2 * Math.PI * j / C;
      const p = [h[0] * sp(cp, e) * sp(Math.cos(th), e), h[1] * sp(s, e), h[2] * sp(cp, e) * sp(Math.sin(th), e)];
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(0, 0, 0);
    }
  }
  gridIdx(m, R, C);
  return computeNormals(m);
}
/* كبسولة على المحور y */
function capsule(o){
  const H = o.rows || 8, C = o.cols || 22, m = mk(), h = o.len / 2, rows = [];
  for (let i = 0; i <= H; i++) rows.push([-Math.PI / 2 + (Math.PI / 2) * i / H, -h]);
  for (let i = 0; i <= H; i++) rows.push([(Math.PI / 2) * i / H, h]);
  rows.forEach(([ph, off]) => {
    const cp = Math.cos(ph), s = Math.sin(ph);
    for (let j = 0; j < C; j++){
      const th = 2 * Math.PI * j / C, d = [cp * Math.cos(th), s, cp * Math.sin(th)];
      const p = [d[0] * o.r, d[1] * o.r + off, d[2] * o.r];
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(d[0], d[1], d[2]);
    }
  });
  gridIdx(m, rows.length - 1, C);
  return m;
}
/* أنبوب على مسار (نبيبات، شبكة، سوط، خيوط كروماتين، حلقات الثقوب) */
function tube(o){
  const P = o.pts, N = P.length, S = o.sides || 8, m = mk(), closed = !!o.closed;
  const T = P.map((p, i) => closed ? norm(sub(P[(i + 1) % N], P[(i - 1 + N) % N]))
                                   : norm(sub(P[Math.min(N - 1, i + 1)], P[Math.max(0, i - 1)])));
  let nr = norm(cross(T[0], Math.abs(T[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const F = [];
  for (let i = 0; i < N; i++){
    if (i > 0){
      const b = cross(T[i - 1], T[i]), bl = vlen(b);
      if (bl > 1e-6) nr = rotAxis(nr, mul(b, 1 / bl), Math.acos(Math.max(-1, Math.min(1, dot(T[i - 1], T[i])))));
    }
    F.push([nr, cross(T[i], nr)]);
  }
  for (let i = 0; i < N; i++){
    const rr = typeof o.r === 'function' ? o.r(i / (N - 1)) : o.r, [n1, b1] = F[i];
    for (let j = 0; j < S; j++){
      const a = 2 * Math.PI * j / S, d = add(mul(n1, Math.cos(a)), mul(b1, Math.sin(a))), p = add(P[i], mul(d, rr));
      m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(d[0], d[1], d[2]);
    }
  }
  const rings = closed ? N : N - 1;
  for (let i = 0; i < rings; i++){
    const i2 = (i + 1) % N;
    for (let j = 0; j < S; j++){
      const a = i * S + j, b = i * S + (j + 1) % S, c = i2 * S + j, d = i2 * S + (j + 1) % S;
      m.i.push(a, b, c, b, d, c);
    }
  }
  if (!closed && o.caps !== false){
    [[0, -1], [N - 1, 1]].forEach(([ri, sg]) => {
      const nn = mul(T[ri], sg), base = m.p.length / 3, rr = typeof o.r === 'function' ? o.r(ri / (N - 1)) : o.r;
      m.p.push(...P[ri]); m.l.push(...P[ri]); m.n.push(...nn);
      const [n1, b1] = F[ri];
      for (let j = 0; j < S; j++){
        const a = 2 * Math.PI * j / S, d = add(mul(n1, Math.cos(a)), mul(b1, Math.sin(a))), p = add(P[ri], mul(d, rr));
        m.p.push(p[0], p[1], p[2]); m.l.push(p[0], p[1], p[2]); m.n.push(...nn);
      }
      for (let j = 0; j < S; j++){
        const a = base + 1 + j, b = base + 1 + (j + 1) % S;
        if (sg < 0) m.i.push(base, b, a); else m.i.push(base, a, b);
      }
    });
  }
  return m;
}
/* تحويل: تدوير R (أو rot أو dir) ثم تحجيم s ثم إزاحة at */
function place(m, o){
  const R = o.R || (o.dir ? alignY(o.dir) : o.rot ? rot3(o.rot[0], o.rot[1], o.rot[2]) : null);
  const s = o.s === undefined ? [1, 1, 1] : Array.isArray(o.s) ? o.s : [o.s, o.s, o.s], at = o.at || [0, 0, 0];
  const out = { p: [], n: [], l: m.l.slice(), i: m.i.slice() };
  for (let k = 0; k < m.p.length; k += 3){
    let p = [m.p[k] * s[0], m.p[k + 1] * s[1], m.p[k + 2] * s[2]];
    let n = [m.n[k] / s[0], m.n[k + 1] / s[1], m.n[k + 2] / s[2]];
    if (R){ p = ap3(R, p); n = ap3(R, n); }
    n = norm(n);
    out.p.push(p[0] + at[0], p[1] + at[1], p[2] + at[2]); out.n.push(n[0], n[1], n[2]);
  }
  return out;
}
function merge(list){
  const o = mk();
  list.forEach(m => {
    const base = o.p.length / 3;
    for (let k = 0; k < m.p.length; k++){ o.p.push(m.p[k]); o.n.push(m.n[k]); o.l.push(m.l[k]); }
    for (let k = 0; k < m.i.length; k++) o.i.push(m.i[k] + base);
  });
  return o;
}
/* منحنى ناعم يمر بنقاط (Catmull-Rom) */
function spline(pts, per, closed){
  const out = [], N = pts.length, segs = closed ? N : N - 1;
  const at = i => closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))];
  for (let i = 0; i < segs; i++){
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < per; k++){
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  if (!closed) out.push(pts[N - 1].slice());
  return out;
}
/* عشوائي ثابت حتى يبقى المجسم نفسه في كل مرة */
function srng(seed){ let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

Object.assign(G3, { add, sub, mul, dot, cross, vlen, norm, rot3, ap3, alignY, rotAxis, hex,
  mk, ellipsoid, superEll, capsule, tube, place, merge, spline, srng, computeNormals });

/* ══════════ المُصيِّر ══════════ */
const VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec3 aLoc;
uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel;
varying vec3 vN; varying vec3 vW; varying vec3 vL;
void main(){ vec4 w = uModel * vec4(aPos, 1.0); vW = w.xyz; vN = (uModel * vec4(aNrm, 0.0)).xyz; vL = aLoc; gl_Position = uProj * uView * w; }`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN; varying vec3 vW; varying vec3 vL;
uniform vec3 uEye; uniform vec3 uLight; uniform vec3 uColor; uniform float uAlpha;
uniform float uRim; uniform vec3 uRimColor; uniform int uPat; uniform vec3 uPatColor; uniform float uPatK;
uniform float uGlow; uniform float uHover; uniform float uDim; uniform float uDay;
uniform float uPick; uniform vec3 uPickColor; uniform vec3 uPickColor2; uniform float uPickFacing; uniform float uTau;
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(uEye - vW);
  if (!gl_FrontFacing) N = -N;
  float fac = max(dot(N, V), 0.0);
  if (uPick > 0.5){ gl_FragColor = vec4((uPickFacing > 0.5 && fac > uTau) ? uPickColor2 : uPickColor, 1.0); return; }
  vec3 base = uColor;
  if (uPat == 1){ float s = sin(vL.y * uPatK + noise(vL * 4.0) * 2.2); base = mix(base, uPatColor, smoothstep(0.35, 0.9, s)); }
  else if (uPat == 2){ float d = noise(vL * uPatK); base = mix(base, uPatColor, smoothstep(0.55, 0.72, d)); }
  else if (uPat == 3){ base *= 0.86 + 0.28 * noise(vL * uPatK); }
  float diff = max(dot(N, uLight), 0.0), hemi = 0.5 + 0.5 * N.y;
  vec3 H = normalize(uLight + V);
  float spec = pow(max(dot(N, H), 0.0), 36.0) * 0.32;
  float fres = pow(1.0 - fac, 2.4);
  vec3 col = base * (0.30 + 0.24 * hemi + 0.62 * diff) + vec3(spec) + uRimColor * fres * uRim;
  col += uGlow * (base * 0.35 + vec3(1.0, 0.82, 0.42) * (0.18 + fres * 0.95));
  col += uHover * (base * 0.22 + vec3(1.0, 0.85, 0.5) * fres * 0.6);
  float a = uAlpha;
  if (uAlpha < 0.99) a = clamp(uAlpha * (0.55 + 1.9 * fres) + uGlow * 0.18, 0.0, 1.0);
  vec3 grey = vec3(dot(col, vec3(0.3, 0.59, 0.11)));
  col = mix(col, mix(grey, vec3(uDay), 0.25), uDim * 0.55);
  a *= 1.0 - uDim * 0.62;
  gl_FragColor = vec4(col, a);
}`;

let gl = null, prog = null, U = {}, A = {}, ext32 = null, fbo = null, fboTex = null, fboDepth = null, fboW = 0, fboH = 0;
let canvas = null, svg = null, labG = null, supported = null;
let objs = [], labels = [], partIds = [], cfg = null, modelKey = null, caps = [];
/* تحريك المجسّم كله (مثل سباحة البكتريا): مصفوفة يعطيها النموذج كل إطار؛ الأجسام الثابتة (fixed) لا تتبعها */
let curXF = null;
const xfPt = p => curXF ? [curXF[0] * p[0] + curXF[4] * p[1] + curXF[8] * p[2] + curXF[12], curXF[1] * p[0] + curXF[5] * p[1] + curXF[9] * p[2] + curXF[13], curXF[2] * p[0] + curXF[6] * p[1] + curXF[10] * p[2] + curXF[14]] : p;
const xfDir = d => curXF ? norm([curXF[0] * d[0] + curXF[4] * d[1] + curXF[8] * d[2], curXF[1] * d[0] + curXF[5] * d[1] + curXF[9] * d[2], curXF[2] * d[0] + curXF[6] * d[1] + curXF[10] * d[2]]) : d;
let yaw = 0.6, pitch = 0.32, dist = 7, yawV = 0, pitchV = 0, lastUser = 0, animT = 0;
let selId = null, hovId = null, running = false, W = 0, H = 0, dpr = 1;
let viewM = null, projM = null, eye = [0, 0, 7], cam = null;

function initGL(){
  if (supported !== null) return supported;
  canvas = $('#gl3d'); svg = $('#lbl3d'); labG = $('#lbl3dG');
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false })
      || canvas.getContext('experimental-webgl');
  } catch (e) { gl = null; }
  if (!gl || FORCE_SW) return initSW();
  ext32 = gl.getExtension('OES_element_index_uint');
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('WebGL shader failed, using 2D fallback:', e.message); return initSW(); }
  gl.useProgram(prog);
  ['aPos', 'aNrm', 'aLoc'].forEach(n => { A[n] = gl.getAttribLocation(prog, n); });
  ['uProj', 'uView', 'uModel', 'uEye', 'uLight', 'uColor', 'uAlpha', 'uRim', 'uRimColor', 'uPat', 'uPatColor', 'uPatK',
   'uGlow', 'uHover', 'uDim', 'uDay', 'uPick', 'uPickColor', 'uPickColor2', 'uPickFacing', 'uTau']
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
  /* إذا فقد الموبايل سياق WebGL (ذاكرة الرسوميات) نكمل بالرسم البديل بدل شاشة فارغة */
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); initSW(); modelKey = null; if (on) loadModel(SCENE_MODEL()); }, { once: true });
  bindInput();
  supported = true;
  return true;
}
/* ══ بديل بلا WebGL: نفس المجسّمات تُرسم بـ Canvas 2D (مثلثات مرتّبة من البعيد للقريب) ══
   بعض المتصفحات وعارضات الملفات على الموبايل لا تدعم WebGL؛ هنا يبقى المجسّم يدور
   ويُضغط، بإضاءة أبسط قليلاً. */
const FORCE_SW = /[?&]sw\b/.test(location.search);
let SW = false, ctx2 = null, swT = null;
function initSW(){
  if (gl){ const n = canvas.cloneNode(false); canvas.parentNode.replaceChild(n, canvas); canvas = n; gl = null; }
  try { ctx2 = canvas.getContext('2d'); } catch (e) { ctx2 = null; }
  if (!ctx2){ supported = false; return false; }
  SW = true; supported = true;
  bindInput();
  return true;
}

function upload(m){
  if (SW) return { sw: true, p: Float32Array.from(m.p), n: Float32Array.from(m.n), l: Float32Array.from(m.l), i: Uint32Array.from(m.i), count: m.i.length };
  const nv = m.p.length / 3, data = new Float32Array(nv * 9);
  for (let v = 0; v < nv; v++){
    data.set([m.p[v * 3], m.p[v * 3 + 1], m.p[v * 3 + 2], m.n[v * 3], m.n[v * 3 + 1], m.n[v * 3 + 2], m.l[v * 3], m.l[v * 3 + 1], m.l[v * 3 + 2]], v * 9);
  }
  const big = nv > 65535 && ext32;
  const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? new Uint32Array(m.i) : new Uint16Array(m.i), gl.STATIC_DRAW);
  return { vbo, ibo, count: m.i.length, type: big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
}
function freeObjs(){
  objs.forEach(o => { if (!o.buf.sw && gl){ gl.deleteBuffer(o.buf.vbo); gl.deleteBuffer(o.buf.ibo); } });
  objs = [];
}
function centerOf(m){
  let x = 0, y = 0, z = 0; const n = m.p.length / 3;
  for (let k = 0; k < m.p.length; k += 3){ x += m.p[k]; y += m.p[k + 1]; z += m.p[k + 2]; }
  return [x / n, y / n, z / n];
}

/* باني النموذج الذي تستعمله دوال المجسمات */
function makeBuilder(){
  return {
    add(mesh, o){
      const rec = Object.assign({
        part: null, color: '#cccccc', alpha: 1, rim: 0.35, rimColor: '#ffffff', pat: 0, patColor: '#000000', patK: 6,
        shell: null, pop: true
      }, o);
      rec.buf = upload(mesh);
      rec.c = o.center || centerOf(mesh);
      rec.col = hex(rec.color); rec.rimC = hex(rec.rimColor); rec.patC = hex(rec.patColor);
      rec.k = 1; rec.glow = 0; rec.hov = 0;
      if (rec.part && partIds.indexOf(rec.part) < 0) partIds.push(rec.part);
      if (rec.shell && rec.shell.inner && partIds.indexOf(rec.shell.inner) < 0) partIds.push(rec.shell.inner);
      objs.push(rec);
      return rec;
    },
    /* لتحريك مجسم (مثل السوط): نعيد رفع بياناته */
    update(rec, mesh){
      if (rec.buf.sw){ rec.buf.p = Float32Array.from(mesh.p); rec.buf.n = Float32Array.from(mesh.n); rec.buf.l = Float32Array.from(mesh.l); return; }
      const nv = mesh.p.length / 3, data = new Float32Array(nv * 9);
      for (let v = 0; v < nv; v++) data.set([mesh.p[v * 3], mesh.p[v * 3 + 1], mesh.p[v * 3 + 2], mesh.n[v * 3], mesh.n[v * 3 + 1], mesh.n[v * 3 + 2], mesh.l[v * 3], mesh.l[v * 3 + 1], mesh.l[v * 3 + 2]], v * 9);
      gl.bindBuffer(gl.ARRAY_BUFFER, rec.buf.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    },
    /* vis: دالة اختيارية تُخفي الاسم عندما يختفي جزؤه (مثل الغلاف النووي أثناء الانقسام) */
    label(part, at, n, vis){ labels.push({ part, at, n: n ? norm(n) : null, vis }); },
    /* تسجيل جزء يظهر لاحقاً (أو يتبدّل اسمه أثناء الحركة) حتى يُلتقط بالضغط */
    reg(id){ if (id && partIds.indexOf(id) < 0) partIds.push(id); },
    objs: () => objs,
    /* عنوان أو سطر نصي ثابت فوق/تحت مجسّم (مثل اسم الطور تحت كل خلية في المقارنة) */
    caption(at, fn){ caps.push({ at, fn }); }
  };
}

function loadModel(key){
  if (modelKey === key && objs.length) return;
  freeObjs(); labels = []; caps = []; partIds = []; selId = null; hovId = null;
  const B = makeBuilder();
  cfg = G3.models[key](B) || {};
  modelKey = key;
  resetView();
  buildLabels(); buildCaps();
}
function resetView(){
  yaw = cfg.yaw === undefined ? 0.55 : cfg.yaw; pitch = cfg.pitch === undefined ? 0.3 : cfg.pitch;
  dist = cfg.dist || 7; yawV = pitchV = 0; lastUser = 0;
}

/* ── الرسم ── */
function resize(){
  const r = canvas.getBoundingClientRect();
  dpr = Math.min(SW ? 1.5 : window.__PHONE ? 1.35 : 2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  W = r.width; H = r.height;
  svg.setAttribute('viewBox', `0 0 ${Math.max(1, W)} ${Math.max(1, H)}`);
}
function camera(){
  const tg = cfg.target || [0, 0, 0];
  const dd = dist * fitK();
  eye = [tg[0] + dd * Math.cos(pitch) * Math.sin(yaw), tg[1] + dd * Math.sin(pitch), tg[2] + dd * Math.cos(pitch) * Math.cos(yaw)];
  cam = lookAt(eye, tg, [0, 1, 0]);
  viewM = cam.m;
  projM = persp(38 * Math.PI / 180, Math.max(0.2, W / Math.max(1, H)), 0.1, 100);
  curXF = cfg && cfg.xf ? cfg.xf() : null;
}
function setCommon(){
  gl.uniformMatrix4fv(U.uProj, false, projM);
  gl.uniformMatrix4fv(U.uView, false, viewM);
  gl.uniform3fv(U.uEye, eye);
  const lv = [-0.45, 0.75, 0.55];
  gl.uniform3fv(U.uLight, norm(add(add(mul(cam.x, lv[0]), mul(cam.y, lv[1])), mul(cam.z, lv[2]))));
  gl.uniform1f(U.uDay, document.documentElement.dataset.theme === 'day' ? 1 : 0);
}
function bindBuf(o){
  gl.bindBuffer(gl.ARRAY_BUFFER, o.buf.vbo);
  gl.enableVertexAttribArray(A.aPos); gl.vertexAttribPointer(A.aPos, 3, gl.FLOAT, false, 36, 0);
  if (A.aNrm >= 0){ gl.enableVertexAttribArray(A.aNrm); gl.vertexAttribPointer(A.aNrm, 3, gl.FLOAT, false, 36, 12); }
  if (A.aLoc >= 0){ gl.enableVertexAttribArray(A.aLoc); gl.vertexAttribPointer(A.aLoc, 3, gl.FLOAT, false, 36, 24); }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.buf.ibo);
}
function drawObj(o, pickCol, pickCol2){
  bindBuf(o);
  gl.uniformMatrix4fv(U.uModel, false, curXF && !o.fixed ? m4mul(curXF, popM(o.c, o.k)) : popM(o.c, o.k));
  if (pickCol){
    gl.uniform1f(U.uPick, 1);
    gl.uniform3fv(U.uPickColor, pickCol);
    gl.uniform3fv(U.uPickColor2, pickCol2 || pickCol);
    gl.uniform1f(U.uPickFacing, pickCol2 ? 1 : 0);
    gl.uniform1f(U.uTau, o.shell && o.shell.tau !== undefined ? o.shell.tau : 0.3);
  } else {
    gl.uniform1f(U.uPick, 0);
    gl.uniform3fv(U.uColor, o.col); gl.uniform1f(U.uAlpha, o.alpha);
    gl.uniform1f(U.uRim, o.rim); gl.uniform3fv(U.uRimColor, o.rimC);
    gl.uniform1i(U.uPat, o.pat); gl.uniform3fv(U.uPatColor, o.patC); gl.uniform1f(U.uPatK, o.patK);
    gl.uniform1f(U.uGlow, o.glow); gl.uniform1f(U.uHover, o.hov);
    const lit = o.part === selId || (o.shell && o.shell.inner === selId);
    gl.uniform1f(U.uDim, selId && !lit ? 1 : 0);
  }
  gl.drawElements(gl.TRIANGLES, o.buf.count, o.buf.type, 0);
}
function render(){
  if (SW) return renderSW();
  resize(); camera();
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(prog); setCommon();
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  /* الأجسام المعتمة */
  gl.disable(gl.BLEND); gl.depthMask(true); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
  objs.forEach(o => { if (!o.hide && !o.shell && o.alpha >= 0.99) drawObj(o); });
  /* الأغشية الشفافة: الوجوه الخلفية من الخارج للداخل، ثم الأمامية من الداخل للخارج */
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  const shells = objs.filter(o => !o.hide && (o.shell || o.alpha < 0.99));
  const sz = o => (o.shell && o.shell.size) || 1;
  gl.cullFace(gl.FRONT); shells.slice().sort((a, b) => sz(b) - sz(a)).forEach(o => drawObj(o));
  gl.cullFace(gl.BACK);  shells.slice().sort((a, b) => sz(a) - sz(b)).forEach(o => drawObj(o));
  gl.depthMask(true);
  placeLabels(); placeCaps();
}

/* ── اختيار الجزء تحت الإصبع (لون لكل جزء في إطار مخفي) ── */
const idCol = id => { const v = partIds.indexOf(id) + 1; return [(v & 255) / 255, ((v >> 8) & 255) / 255, 0.5]; };
const colId = (r, g) => { const v = r + (g << 8); return v > 0 ? partIds[v - 1] || null : null; };
function ensureFbo(){
  const w = canvas.width, h = canvas.height;
  if (fbo && fboW === w && fboH === h) return;
  if (!fbo){ fbo = gl.createFramebuffer(); fboTex = gl.createTexture(); fboDepth = gl.createRenderbuffer(); }
  gl.bindTexture(gl.TEXTURE_2D, fboTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindRenderbuffer(gl.RENDERBUFFER, fboDepth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fboDepth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  fboW = w; fboH = h;
}
function pickAt(cx, cy){
  if (!objs.length) return null;
  if (SW) return pickSW(cx, cy);
  resize(); camera(); ensureFbo();
  const px = Math.round(cx * dpr), py = Math.round(canvas.height - cy * dpr), Rr = Math.round(9 * dpr);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.SCISSOR_TEST);
  const x0 = Math.max(0, px - Rr), y0 = Math.max(0, py - Rr), w = Math.min(canvas.width - x0, Rr * 2 + 1), h = Math.min(canvas.height - y0, Rr * 2 + 1);
  gl.scissor(x0, y0, w, h);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(prog); setCommon();
  gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
  let found = null;
  /* 1) الأجزاء المعتمة: ما تحت الإصبع بالضبط يفوز */
  /* كل جزء ليس غشاءً يُعدّ صلباً عند الالتقاط حتى لو كان يظهر أو يختفي تدريجياً */
  objs.forEach(o => { if (!o.hide && !o.shell && o.alpha > 0.15 && o.part) drawObj(o, idCol(o.part)); });
  const buf = new Uint8Array(w * h * 4); gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  const ck = ((py - y0) * w + (px - x0)) * 4;
  if (ck >= 0 && ck < buf.length) found = colId(buf[ck], buf[ck + 1]);
  /* 2) ثم الأغشية تحت الإصبع، من الأصغر للأكبر (الداخل له الأولوية) */
  if (!found){
    const shells = objs.filter(o => !o.hide && o.shell && o.part).sort((a, b) => ((a.shell && a.shell.size) || 1) - ((b.shell && b.shell.size) || 1));
    const one = new Uint8Array(4);
    gl.scissor(px, py, 1, 1);
    for (const o of shells){
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawObj(o, idCol(o.part), o.shell && o.shell.inner ? idCol(o.shell.inner) : null);
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, one);
      const id = colId(one[0], one[1]);
      if (id){ found = id; break; }
    }
  }
  /* 3) الإصبع على فراغ: أقرب جزء صغير حوله (رايبوسوم، شعيرة، نبيب) */
  if (!found){
    let bd = 1e9;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++){
      const k = (yy * w + xx) * 4; if (!buf[k] && !buf[k + 1]) continue;
      const d = Math.hypot(x0 + xx - px, y0 + yy - py);
      if (d < bd && d <= Rr){ bd = d; found = colId(buf[k], buf[k + 1]); }
    }
  }
  gl.disable(gl.SCISSOR_TEST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return found;
}


/* ── الرسم البديل (Canvas 2D) ── */
function hash1(x, y, z){ x = (x * 0.3183099 + 0.1) % 1; y = (y * 0.3183099 + 0.1) % 1; z = (z * 0.3183099 + 0.1) % 1;
  if (x < 0) x += 1; if (y < 0) y += 1; if (z < 0) z += 1; x *= 17; y *= 17; z *= 17; const v = x * y * z * (x + y + z); return v - Math.floor(v); }
function noise3(x, y, z){
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z); let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hash1(ix + a, iy + b, iz + c), mx = (a, b, t) => a + (b - a) * t;
  return mx(mx(mx(h(0,0,0), h(1,0,0), fx), mx(h(0,1,0), h(1,1,0), fx), fy), mx(mx(h(0,0,1), h(1,0,1), fx), mx(h(0,1,1), h(1,1,1), fx), fy), fz);
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const colCache = new Map();
const rgbStr = (r, g, b) => { r = Math.max(0, Math.min(255, r * 255 | 0)); g = Math.max(0, Math.min(255, g * 255 | 0)); b = Math.max(0, Math.min(255, b * 255 | 0));
  const k = (r << 16) | (g << 8) | b; let s = colCache.get(k); if (!s){ s = `rgb(${r},${g},${b})`; colCache.set(k, s); } return s; };
function renderSW(){
  resize(); camera();
  const ctx = ctx2, cw = canvas.width, ch = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cw, ch);
  const P = m4mul(projM, viewM);
  const lv = [-0.45, 0.75, 0.55], Lt = norm(add(add(mul(cam.x, lv[0]), mul(cam.y, lv[1])), mul(cam.z, lv[2])));
  const Hv0 = Lt, day = document.documentElement.dataset.theme === 'day' ? 1 : 0;
  let total = 0; objs.forEach(o => { total += o.buf.count / 3; });
  if (!swT || swT.cap < total){ const c = Math.ceil(total * 1.2) + 16;
    swT = { cap: c, xy: new Float32Array(c * 6), z: new Float32Array(c), a: new Float32Array(c), fac: new Float32Array(c), o: new Int32Array(c), col: new Array(c), idx: new Uint32Array(c) }; }
  const T = swT; let nt = 0;
  objs.forEach((o, oi) => {
    if (o.hide) return;
    const XF = curXF && !o.fixed ? curXF : null;
    const b = o.buf, p = b.p, nn = b.n, lc = b.l, I = b.i, nv = p.length / 3, k = o.k, c = o.c;
    const sx = new Float32Array(nv), sy = new Float32Array(nv), sw = new Float32Array(nv), wx = new Float32Array(nv * 3);
    for (let v = 0; v < nv; v++){
      let x = c[0] + (p[v * 3] - c[0]) * k, y = c[1] + (p[v * 3 + 1] - c[1]) * k, z = c[2] + (p[v * 3 + 2] - c[2]) * k;
      if (XF){ const q = xfPt([x, y, z]); x = q[0]; y = q[1]; z = q[2]; }
      wx[v * 3] = x; wx[v * 3 + 1] = y; wx[v * 3 + 2] = z;
      const X = P[0] * x + P[4] * y + P[8] * z + P[12], Y = P[1] * x + P[5] * y + P[9] * z + P[13], Wc = P[3] * x + P[7] * y + P[11] * z + P[15];
      sw[v] = Wc; sx[v] = (X / Wc * 0.5 + 0.5) * cw; sy[v] = (1 - (Y / Wc * 0.5 + 0.5)) * ch;
    }
    const shell = !!o.shell || o.alpha < 0.99;
    const lit = o.part === selId || (o.shell && o.shell.inner === selId), dim = selId && !lit ? 1 : 0;
    const base0 = o.col, rimC = o.rimC, patC = o.patC;
    for (let t = 0; t < I.length; t += 3){
      const i0 = I[t], i1 = I[t + 1], i2 = I[t + 2];
      if (sw[i0] < 0.15 || sw[i1] < 0.15 || sw[i2] < 0.15) continue;
      const ax = sx[i0], ay = sy[i0], bx = sx[i1], by = sy[i1], qx = sx[i2], qy = sy[i2];
      if ((ax < 0 && bx < 0 && qx < 0) || (ax > cw && bx > cw && qx > cw) || (ay < 0 && by < 0 && qy < 0) || (ay > ch && by > ch && qy > ch)) continue;
      let Nx = nn[i0 * 3] + nn[i1 * 3] + nn[i2 * 3], Ny = nn[i0 * 3 + 1] + nn[i1 * 3 + 1] + nn[i2 * 3 + 1], Nz = nn[i0 * 3 + 2] + nn[i1 * 3 + 2] + nn[i2 * 3 + 2];
      if (XF){ const q = xfDir([Nx, Ny, Nz]); Nx = q[0]; Ny = q[1]; Nz = q[2]; }
      const nl = Math.hypot(Nx, Ny, Nz) || 1; Nx /= nl; Ny /= nl; Nz /= nl;
      const Cx = (wx[i0 * 3] + wx[i1 * 3] + wx[i2 * 3]) / 3, Cy = (wx[i0 * 3 + 1] + wx[i1 * 3 + 1] + wx[i2 * 3 + 1]) / 3, Cz = (wx[i0 * 3 + 2] + wx[i1 * 3 + 2] + wx[i2 * 3 + 2]) / 3;
      let Vx = eye[0] - Cx, Vy = eye[1] - Cy, Vz = eye[2] - Cz; const vl = Math.hypot(Vx, Vy, Vz) || 1; Vx /= vl; Vy /= vl; Vz /= vl;
      let fac = Nx * Vx + Ny * Vy + Nz * Vz;
      /* الوجه الخلفي حسب ترتيب رؤوس المثلث على الشاشة (مثل WebGL) */
      const area = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax);
      if (!shell && area > 0) continue;
      if (Math.abs(area) < 0.6) continue;   // مثلث أصغر من نقطة الشاشة
      if (fac < 0){ Nx = -Nx; Ny = -Ny; Nz = -Nz; fac = -fac; }
      /* اللون: نفس معادلة الإضاءة في WebGL */
      let br = base0[0], bg = base0[1], bb = base0[2];
      if (o.pat){
        const lx = (lc[i0 * 3] + lc[i1 * 3] + lc[i2 * 3]) / 3, ly = (lc[i0 * 3 + 1] + lc[i1 * 3 + 1] + lc[i2 * 3 + 1]) / 3, lz = (lc[i0 * 3 + 2] + lc[i1 * 3 + 2] + lc[i2 * 3 + 2]) / 3;
        let m = 0;
        if (o.pat === 1) m = smooth(0.35, 0.9, Math.sin(ly * o.patK + noise3(lx * 4, ly * 4, lz * 4) * 2.2));
        else if (o.pat === 2) m = smooth(0.55, 0.72, noise3(lx * o.patK, ly * o.patK, lz * o.patK));
        else if (o.pat === 3){ const f = 0.86 + 0.28 * noise3(lx * o.patK, ly * o.patK, lz * o.patK); br *= f; bg *= f; bb *= f; }
        if (m){ br += (patC[0] - br) * m; bg += (patC[1] - bg) * m; bb += (patC[2] - bb) * m; }
      }
      const diff = Math.max(0, Nx * Lt[0] + Ny * Lt[1] + Nz * Lt[2]), hemi = 0.5 + 0.5 * Ny;
      let Hx = Lt[0] + Vx, Hy = Lt[1] + Vy, Hz = Lt[2] + Vz; const hl = Math.hypot(Hx, Hy, Hz) || 1;
      const spec = Math.pow(Math.max(0, (Nx * Hx + Ny * Hy + Nz * Hz) / hl), 36) * 0.32, fres = Math.pow(1 - fac, 2.4);
      const li = 0.30 + 0.24 * hemi + 0.62 * diff;
      let r = br * li + spec + rimC[0] * fres * o.rim, g = bg * li + spec + rimC[1] * fres * o.rim, bl = bb * li + spec + rimC[2] * fres * o.rim;
      if (o.glow){ const q = 0.18 + fres * 0.95; r += o.glow * (br * 0.35 + q); g += o.glow * (bg * 0.35 + 0.82 * q); bl += o.glow * (bb * 0.35 + 0.42 * q); }
      if (o.hov){ const q = fres * 0.6; r += o.hov * (br * 0.22 + q); g += o.hov * (bg * 0.22 + 0.85 * q); bl += o.hov * (bb * 0.22 + 0.5 * q); }
      let a = o.alpha;
      if (o.alpha < 0.99) a = Math.max(0, Math.min(1, o.alpha * (0.55 + 1.9 * fres) + o.glow * 0.18));
      if (dim){ const gr = r * 0.3 + g * 0.59 + bl * 0.11, tg = gr + (day - gr) * 0.25;
        r += (tg - r) * 0.55; g += (tg - g) * 0.55; bl += (tg - bl) * 0.55; a *= 1 - 0.62; }
      const j = nt * 6; T.xy[j] = ax; T.xy[j + 1] = ay; T.xy[j + 2] = bx; T.xy[j + 3] = by; T.xy[j + 4] = qx; T.xy[j + 5] = qy;
      T.z[nt] = (sw[i0] + sw[i1] + sw[i2]) / 3; T.a[nt] = a; T.fac[nt] = fac; T.o[nt] = oi; T.col[nt] = rgbStr(r, g, bl);
      nt++;
    }
  });
  T.n = nt;
  const idx = T.idx.subarray(0, nt); for (let i = 0; i < nt; i++) idx[i] = i;
  idx.sort((x, y) => T.z[y] - T.z[x]);
  ctx.lineJoin = 'round'; ctx.lineWidth = 0.9;
  for (let q = 0; q < nt; q++){
    const i = idx[q], j = i * 6, a = T.a[i], solid = a >= 0.99;
    ctx.globalAlpha = solid ? 1 : a;
    ctx.beginPath(); ctx.moveTo(T.xy[j], T.xy[j + 1]); ctx.lineTo(T.xy[j + 2], T.xy[j + 3]); ctx.lineTo(T.xy[j + 4], T.xy[j + 5]); ctx.closePath();
    ctx.fillStyle = T.col[i]; ctx.fill();
    /* حدّ بنفس اللون يسدّ الشقوق الرفيعة بين المثلثات المعتمة */
    if (solid && objs[T.o[i]].alpha >= 0.99){ ctx.strokeStyle = T.col[i]; ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  placeLabels(); placeCaps();
}
/* الالتقاط في الرسم البديل: نفس ترتيب WebGL (المعتم تحت الإصبع، ثم الأغشية من الأصغر، ثم أقرب جزء صغير) */
function pickSW(cx, cy){
  renderSW();
  const T = swT, px = cx * dpr, py = cy * dpr, nt = T.n || 0;
  const inTri = j => { const ax = T.xy[j], ay = T.xy[j + 1], bx = T.xy[j + 2], by = T.xy[j + 3], qx = T.xy[j + 4], qy = T.xy[j + 5];
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by), d2 = (px - qx) * (by - qy) - (bx - qx) * (py - qy), d3 = (px - ax) * (qy - ay) - (qx - ax) * (py - ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  const isShell = o => !!o.shell;
  let best = -1, bz = 1e9; const shellHit = new Map();
  for (let i = 0; i < nt; i++){
    const o = objs[T.o[i]]; if (!o.part || (!isShell(o) && o.alpha <= 0.15) || !inTri(i * 6)) continue;
    if (!isShell(o)){ if (T.z[i] < bz){ bz = T.z[i]; best = i; } }
    else { const h = shellHit.get(o); if (!h || T.z[i] < T.z[h]) shellHit.set(o, i); }
  }
  if (best >= 0) return objs[T.o[best]].part;
  const shells = [...shellHit.keys()].sort((a, b) => ((a.shell && a.shell.size) || 1) - ((b.shell && b.shell.size) || 1));
  if (shells.length){ const o = shells[0], i = shellHit.get(o), tau = o.shell && o.shell.tau !== undefined ? o.shell.tau : 0.3;
    return o.shell && o.shell.inner && T.fac[i] > tau ? o.shell.inner : o.part; }
  const R = 9 * dpr; let bd = R, found = null;
  for (let i = 0; i < nt; i++){
    const o = objs[T.o[i]]; if (!o.part || isShell(o)) continue;
    const j = i * 6;
    for (let v = 0; v < 6; v += 2){ const d = Math.hypot(T.xy[j + v] - px, T.xy[j + v + 1] - py); if (d < bd){ bd = d; found = o.part; } }
  }
  return found;
}

/* ── العناوين تحت المجسّمات وفوقها ── */
function buildCaps(){
  let g = svg.querySelector('#cap3dG');
  if (!g){ g = document.createElementNS(SVGNS, 'g'); g.id = 'cap3dG'; svg.insertBefore(g, svg.firstChild); }
  g.innerHTML = '';
  caps.forEach(c => { c.el = document.createElementNS(SVGNS, 'text'); c.el.setAttribute('class', 'cap3d'); c.el.setAttribute('text-anchor', 'middle'); c.last = null; g.appendChild(c.el); });
}
function placeCaps(){
  if (!caps.length) return;
  const cmp = compact();
  /* عنوان مثبّت أسفل الرسم فوق شريط الأدوات ('bottom') بدل نقطة في المجسّم */
  let botY = H - 80;
  const tl = document.getElementById('sceneTools');
  if (tl && tl.offsetHeight){ const r = tl.getBoundingClientRect(), cr = canvas.getBoundingClientRect(); botY = r.top - cr.top - 10; }
  caps.forEach(c => {
    const lines = c.fn() || [], key = lines.join('|');
    const s = c.at === 'bottom' ? [W / 2, botY - Math.max(0, lines.length - 1) * (cmp ? 13 : 17)] : project(c.at);
    if (key !== c.last){
      c.el.innerHTML = lines.map((t, i) => `<tspan class="${i ? 'c2' : 'c1'}" dy="${i ? (cmp ? 13 : 17) : 0}">${t}</tspan>`).join('');
      c.last = key;
    }
    const x = s[0].toFixed(1);
    c.el.setAttribute('x', x); c.el.setAttribute('y', s[1].toFixed(1));
    c.el.querySelectorAll('tspan').forEach(t => t.setAttribute('x', x));
  });
}

/* ── الأسماء: عمودان جانبيان وخطوط تأشير تتبع الدوران ── */
let labState = {};
/* شاشة الموبايل الضيقة: أسماء أصغر على الحافتين، والمجسم يبتعد قليلاً ليبقى بين العمودين */
const compact = () => W > 0 && W < 600;
/* نبعد الكاميرا إذا ضاق العرض المتاح للمجسم (شاشة طولية أو عمودا الأسماء) حتى لا تغطي الأسماء المجسم */
const fitK = () => {
  if (!W || !H) return 1;
  const lab = labels.length && !svg.classList.contains('off') && !svg.classList.contains('tiny');
  const avail = W - (lab ? (compact() ? 160 : 300) : 0);
  let k = Math.max(1, Math.min(4, H / Math.max(120, avail)));
  /* مجسّمان جنباً إلى جنب مع عناوين: نبعد الكاميرا قليلاً على الموبايل حتى لا تنقطع العناوين */
  if (compact() && cfg && cfg.compactK) k = Math.max(k, cfg.compactK);
  return k;
};
function project(p){
  const v = m4mul(projM, m4mul(viewM, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1])).slice(12, 16);
  return [(v[0] / v[3] * 0.5 + 0.5) * W, (1 - (v[1] / v[3] * 0.5 + 0.5)) * H, v[3]];
}
function buildLabels(){
  labG.innerHTML = '';
  labState = {};
  const small = window.innerWidth < 700, cmp = compact(), dy = cmp ? 12 : 17;
  svg.classList.toggle('compact', cmp);
  labels.forEach(L => {
    const d = INFO[L.part]; if (!d) return;
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'lblG clk'); g.dataset.for = L.part;
    const lines = wrapName(d.name, cmp ? 11 : small ? 13 : 16);
    g.innerHTML = `<line class="lead"/><circle class="lblDot" r="3.4"/><rect class="lblHit" rx="7"/><circle class="lblHit dotHit" r="10"/>` +
      `<text class="lbl">${lines.map((l, i) => `<tspan x="0" dy="${i ? dy : 0}">${l}</tspan>`).join('')}</text>`;
    labG.appendChild(g);
    const t = g.querySelector('text');
    const bb = t.getBBox();
    labState[L.part] = { g, t, lines: lines.length, w: bb.width || 60, h: bb.height || 16, side: null };
    g.addEventListener('click', ev => { ev.stopPropagation(); selectPart(L.part); });
    g.addEventListener('mouseenter', () => setHover(L.part));
    g.addEventListener('mouseleave', () => setHover(null));
  });
  svg.classList.toggle('off', !$('#lblTgl').checked);
}
function placeLabels(){
  if (!labels.length || svg.classList.contains('off')) return;
  /* بعض التجارب تخفي الأسماء مؤقتاً (مثل سباحة البكتريا) كما في الرسم المسطّح */
  const hideNow = !!(cfg && cfg.hideLabels && cfg.hideLabels());
  if (svg.classList.contains('hidelab') !== hideNow) svg.classList.toggle('hidelab', hideNow);
  if (hideNow) return;
  const cmp = compact(), top = cmp ? 40 : 58, cx = W / 2;
  /* لا تنزل الأسماء تحت شريط أدوات المشهد */
  let bottom = H - (cmp ? 60 : 74);
  const tl = document.getElementById('sceneTools');
  if (tl && tl.offsetHeight){ const r = tl.getBoundingClientRect(), c = canvas.getBoundingClientRect(); bottom = Math.min(H - 16, r.top - c.top - 6); }
  /* مساحة ضيقة جداً (موبايل بالعرض خارج ملء الشاشة): نخفي الأسماء بدل أن تتراكب */
  const tiny = bottom - top < 130;
  svg.classList.toggle('tiny', tiny);
  if (tiny) return;
  if (cmp !== svg.classList.contains('compact')){ buildLabels(); }
  /* لوحة الطور (الانقسام) تشغل أعلى اليسار: عمود اليسار يبدأ تحتها، وإن لم يبقَ له مكان تذهب أسماؤه لليمين */
  let topL = top;
  const pb = document.getElementById('phaseBar');
  if (pb && pb.classList.contains('on') && pb.offsetHeight){
    const r = pb.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    if (r.left - c.left < W / 2) topL = Math.max(top, r.bottom - c.top + 8);
  }
  const noL = bottom - topL < 110, topA = top;
  const cols = { L: [], R: [] };
  labels.forEach(L => {
    const st = labState[L.part]; if (!st) return;
    const vis = !L.vis || L.vis();
    if (st.g.style.display !== (vis ? '' : 'none')) st.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    const s = project(xfPt(L.at));
    let side = s[0] < cx ? 'L' : 'R';
    if (st.side && Math.abs(s[0] - cx) < 40) side = st.side;
    if (noL) side = 'R';
    st.side = side;
    let face = 1;
    if (L.n){ face = dot(xfDir(L.n), norm(sub(eye, xfPt(L.at)))); }
    cols[side].push({ st, sx: s[0], sy: s[1], face });
  });
  /* موازنة العمودين: إن زاد أحدهما كثيراً ننقل أقرب أسمائه للوسط إلى العمود الآخر */
  const lineSum = c => c.reduce((a, o) => a + o.st.lines, 0);
  for (let guard = 0; guard < 12 && !noL; guard++){
    const big = lineSum(cols.L) > lineSum(cols.R) ? 'L' : 'R', sm = big === 'L' ? 'R' : 'L';
    if (!cols[big].length || lineSum(cols[big]) - lineSum(cols[sm]) <= 3) break;
    cols[big].sort((a, b) => Math.abs(a.sx - cx) - Math.abs(b.sx - cx));
    const o = cols[big].shift(); o.st.side = sm; cols[sm].push(o);
  }
  const lh = cmp ? 12 : 17;
  Object.keys(cols).forEach(side => {
    const c = cols[side]; if (!c.length) return;
    const top = side === 'L' ? topL : topA;
    c.sort((a, b) => a.sy - b.sy);
    /* كل اسم متمركز على y؛ نصف ارتفاعه حسب عدد أسطره، مع فراغ بين الأسماء */
    const room = bottom - top - c.reduce((a, o) => a + o.st.lines * lh, 0);
    const gap = Math.max(0, Math.min(5, room / (2 * c.length)));
    const half = o => o.st.lines * lh / 2 + gap;
    c.forEach(o => { o.y = Math.max(top + half(o), Math.min(bottom - half(o), o.sy)); });
    for (let i = 1; i < c.length; i++){ const need = c[i - 1].y + half(c[i - 1]) + half(c[i]) - c[i].y; if (need > 0) c[i].y += need; }
    const last = c[c.length - 1], over = last.y + half(last) - bottom;
    if (over > 0) c.forEach(o => { o.y -= over; });
    for (let i = c.length - 2; i >= 0; i--){ const need = c[i].y + half(c[i]) + half(c[i + 1]) - c[i + 1].y; if (need > 0) c[i].y -= need; }
    const maxW = Math.max(...c.map(o => o.st.w));
    const pad = cmp ? 10 : 22;
    const colX = side === 'L' ? Math.min(cx - 40, maxW + pad) : Math.max(cx + 40, W - maxW - pad);
    c.forEach(o => {
      const { g, t } = o.st, ty = o.y + 6 - (o.st.lines - 1) * lh / 2;
      const tx = side === 'L' ? colX - 8 : colX + 8;
      t.setAttribute('x', tx.toFixed(1)); t.setAttribute('y', ty.toFixed(1));
      t.setAttribute('text-anchor', side === 'L' ? 'start' : 'end');
      t.querySelectorAll('tspan').forEach(ts => ts.setAttribute('x', tx.toFixed(1)));
      const ln = g.querySelector('.lead');
      ln.setAttribute('x1', colX.toFixed(1)); ln.setAttribute('y1', o.y.toFixed(1));
      ln.setAttribute('x2', o.sx.toFixed(1)); ln.setAttribute('y2', o.sy.toFixed(1));
      const dt = g.querySelector('.lblDot'), dh = g.querySelector('.dotHit');
      dt.setAttribute('cx', o.sx.toFixed(1)); dt.setAttribute('cy', o.sy.toFixed(1));
      dh.setAttribute('cx', o.sx.toFixed(1)); dh.setAttribute('cy', o.sy.toFixed(1));
      const hr = g.querySelector('rect.lblHit'), w = o.st.w + 14, h = o.st.lines * lh + (cmp ? 8 : 12);
      hr.setAttribute('x', (side === 'L' ? tx - o.st.w - 7 : tx - 7).toFixed(1));
      hr.setAttribute('y', (ty - lh + 2).toFixed(1));
      hr.setAttribute('width', w.toFixed(1)); hr.setAttribute('height', h.toFixed(1));
      g.classList.toggle('back', o.face < -0.15);
    });
  });
}

/* ── الاختيار والإضاءة ── */
function setHover(id){
  hovId = id;
  objs.forEach(o => { o.hovT = (id && (o.part === id || (o.shell && o.shell.inner === id))) ? 1 : 0; });
  labG.querySelectorAll('.lblG').forEach(g => g.classList.toggle('hov', g.dataset.for === id));
}
function onSelect(id){
  selId = id && partIds.indexOf(id) >= 0 ? id : null;
  labG.querySelectorAll('.lblG').forEach(g => g.classList.toggle('sel', g.dataset.for === selId));
  svg.classList.toggle('dim', !!selId);
}
function stepAnim(dt){
  objs.forEach(o => {
    const lit = selId && (o.part === selId || (o.shell && o.shell.inner === selId));
    const kT = lit && o.pop && !o.shell ? 1.08 : 1;
    o.k += (kT - o.k) * Math.min(1, dt * 8);
    o.glow += ((lit ? 1 : 0) - o.glow) * Math.min(1, dt * 8);
    o.hov += ((o.hovT || 0) - o.hov) * Math.min(1, dt * 10);
  });
}

/* ── التحكم: سحب للتدوير، إصبعان أو العجلة للتقريب، ضغطتان للإرجاع ── */
const ptrs = new Map();
let pinch0 = 0, dist0 = 7, tapInfo = null, lastTap = 0, hoverAt = 0;
function bindInput(){
  canvas.addEventListener('pointerdown', e => {
    try { canvas.setPointerCapture(e.pointerId); } catch (_){}
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastUser = performance.now();
    if (ptrs.size === 1) tapInfo = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: 0 };
    if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = dist; tapInfo = null; }
    yawV = pitchV = 0;
  });
  canvas.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (!p){
      /* مرور الماوس: إضاءة خفيفة للجزء تحت المؤشر */
      if (e.pointerType === 'mouse' && performance.now() - hoverAt > 90){
        hoverAt = performance.now();
        const r = canvas.getBoundingClientRect(), id = pickAt(e.clientX - r.left, e.clientY - r.top);
        if (id !== hovId) setHover(id);
        canvas.style.cursor = id ? 'pointer' : 'grab';
      }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    lastUser = performance.now();
    if (ptrs.size === 1){
      if (tapInfo) tapInfo.moved += Math.abs(dx) + Math.abs(dy);
      yaw -= dx * 0.009; pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.008));
      yawV = -dx * 0.009; pitchV = dy * 0.008;
    } else if (ptrs.size === 2 && pinch0){
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      dist = Math.max(cfg.minDist || 2.2, Math.min(cfg.maxDist || 18, dist0 * pinch0 / Math.max(20, d)));
    }
  });
  const up = e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = 0;
    /* أوقات الحدث نفسه (لا وقت معالجته) حتى يعمل النقر المزدوج حتى لو تأخر الرسم */
    if (ptrs.size === 0 && tapInfo && tapInfo.moved < 8 && e.timeStamp - tapInfo.t < 450){
      const now = e.timeStamp;
      if (now - lastTap < 320){ resetView(); lastTap = 0; }
      else {
        const r = canvas.getBoundingClientRect(), id = pickAt(e.clientX - r.left, e.clientY - r.top);
        if (id) selectPart(id); else clearInfo();
        lastTap = now;
      }
      yawV = pitchV = 0;
    }
    if (ptrs.size === 0) tapInfo = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !ptrs.size) setHover(null); });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    lastUser = performance.now();
    dist = Math.max(cfg.minDist || 2.2, Math.min(cfg.maxDist || 18, dist * Math.exp(e.deltaY * 0.0013)));
  }, { passive: false });
}

/* ── الحلقة ── */
let lastF = 0, skipF = false;
function loop(now){
  if (!running) return;
  /* الموبايل: 30 إطاراً بالثانية تكفي للتدوير وتنصّف الحمل على المعالج */
  if (window.__PHONE && !ptrs.size){ skipF = !skipF; if (skipF){ requestAnimationFrame(loop); return; } }
  const dt = Math.min(0.05, (now - (lastF || now)) / 1000); lastF = now;
  const wel = document.getElementById('welcome');
  if (!(wel && !wel.classList.contains('off'))){
    const idle = now - lastUser > 2500 && !ptrs.size;
    if (!ptrs.size){
      yaw += yawV; pitch = Math.max(-1.3, Math.min(1.3, pitch + pitchV));
      yawV *= 0.92; pitchV *= 0.92;
    }
    /* «شوف الوظيفة»: الحركة أبطأ مثل المشهد المسطّح */
    const slow = (focusOwner || tAcc < focusUntil) ? 0.45 : 1;
    /* المراحل: الكاميرا تنتقل بنعومة لأحسن زاوية لكل مرحلة (ما دام الطالب لا يحرّكها) */
    const goal = cfg.camGoal && now - lastUser > 2500 ? cfg.camGoal() : null;
    if (goal){
      const k = Math.min(1, dt * 1.6);
      let dy = goal.yaw - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      yaw += dy * k; pitch += (goal.pitch - pitch) * k; dist += (goal.dist - dist) * k;
      if (goal.target){ const tg = cfg.target || [0, 0, 0]; cfg.target = tg.map((v, i) => v + (goal.target[i] - v) * k); }
    } else if (idle && playing && !REDUCE && !cfg.noSpin) yaw += dt * 0.16 * speedMul;
    if (playing) animT += dt * speedMul * slow;
    if (cfg.anim) cfg.anim(animT, dt);
    stepAnim(dt);
    render();
  }
  requestAnimationFrame(loop);
}

/* ══════════ الربط بالواجهة ══════════ */
/* المجسّم الخاص بالمشهد الحالي (model3d في تعريف المشهد) */
const SCENE_MODEL = () => { const d = SCENES[curKey]; return d && d.model3d ? d.model3d() : null; };
let on = false, hint2d = '';
/* المجسّم هو العرض الافتراضي لرسوم التراكيب؛ إذا اختار الطالب «مسطّح» يُحفظ اختياره */
/* على الموبايل يبدأ مسطّحاً (أخف وأسرع) إلا إذا اختار الطالب المجسّم بنفسه */
let want3d = !window.__PHONE;
try { const v = localStorage.getItem('cell3d_v2'); if (v) want3d = v !== 'flat'; } catch (e) {}
const saveWant = () => { try { localStorage.setItem('cell3d_v2', want3d ? '3d' : 'flat'); } catch (e) {} };
const NO_GL = 'جهازك أو متصفحك لا يدعم العرض الثلاثي الأبعاد (WebGL)، فالرسوم تظهر مسطّحة. جرّب متصفح Chrome محدّثاً.';
const HINT3D = 'مجسّم ثلاثي الأبعاد: اسحب بإصبعك أو بالماوس لتدويره، وقرّب وبعّد بإصبعين أو بعجلة الماوس، واضغط مرتين على المجسم لإرجاعه. اضغط أي جزء أو اسمه لتظهر معلوماته.';
function setOn(v){
  const key = SCENE_MODEL();
  if (v && (!key || !G3.models[key] || !initGL())) v = false;
  on = v;
  document.body.classList.toggle('v3', on);
  $('#v3Btn').classList.toggle('on', on);
  $('#v3Txt').textContent = on ? 'مسطّح' : 'ثلاثي الأبعاد';
  if (on){
    hint2d = $('#sceneHint').textContent;
    $('#sceneHint').textContent = HINT3D;
    loadModel(key);
    onSelect(selPart);
    if (!running){ running = true; lastF = 0; requestAnimationFrame(loop); }
  } else {
    running = false;
    if (hint2d) $('#sceneHint').textContent = (cur && cur.hint) || hint2d;
  }
}
function sync(){
  const key = SCENE_MODEL(), model = !!(key && G3.models[key]), has = model && supported !== false;
  const b = $('#v3Btn');
  b.disabled = !has;
  b.title = has ? 'عرض الرسم مجسّماً ثلاثي الأبعاد' : supported === false && model ? NO_GL : 'هذا المشهد مخطط أو حركة وليس له مجسّم';
  if (on){
    if (!has) setOn(false);
    else { modelKey = null; loadModel(key); $('#sceneHint').textContent = HINT3D; }
  } else if (has && want3d){
    hint2d = '';
    setOn(true);
    if (!on && supported === false){ b.disabled = true; b.title = NO_GL; $('#sceneHint').textContent = NO_GL; }
  }
}

window.__v3 = {
  sync, onSelect: id => { if (on) onSelect(id); },
  active: () => on,
  /* مشاهد الانقسام: يبقى المشهد المسطّح يحسب الزمن والطور والشريط، والمجسّم يرسم نفس الحالة */
  live: () => on && !!(cfg && cfg.live2d),
  /* أدوات التجارب التي يرسمها المجسّم نفسه (فلا نرجع للمسطّح عند الضغط عليها) */
  handles: (id, radio) => on && !!(cfg && cfg.tools && (cfg.tools.indexOf(id) >= 0 || (radio && cfg.tools.indexOf('radio:' + radio) >= 0))),
  reset: () => { if (on) resetView(); },
  pick: (x, y) => pickAt(x, y), proj: p => project(p), setOn,
  debug: () => ({ sw: SW, lw: Object.keys(labState).map(k => k + ":" + Math.round(labState[k].w) + "/" + labState[k].side), objs: objs.length, parts: partIds.slice(), labels: labels.map(l => l.part), key: modelKey, yaw, pitch, dist,
    screen: labels.filter(l => !l.vis || l.vis()).map(l => { const s = project(xfPt(l.at)); return { part: l.part, x: s[0], y: s[1] }; }) })
};
$('#v3Btn').addEventListener('click', () => {
  setOn(!on);
  want3d = on; saveWant();
  if (!on && supported === false){ $('#v3Btn').disabled = true; $('#sceneHint').textContent = NO_GL; }
});
$('#lblTgl').addEventListener('change', () => { if (svg) svg.classList.toggle('off', !$('#lblTgl').checked); });
})();
