/* ═════════════ 9 · المخططات الدائرية مجسّمة: كرات مرقّمة حول حلقة بأسهم، والحالية تكبر وتتوهج ═════════════ */
(function(){
const { add, mul, norm, ellipsoid, tube, place, merge } = G3;
function cycModel(v){ return function(B){
  const D = CYC[v], ST = D.st(), n = ST.length, R = 2.5;
  const ang = i => Math.PI / 2 - i * 2 * Math.PI / n, P = i => [Math.cos(ang(i)) * R, Math.sin(ang(i)) * R, 0];
  const ball = (r, at) => place(ellipsoid({ r, rows: 14, cols: 18 }), { at });
  const nodes = ST.map((_, i) => ({ i, at: P(i), o: B.add(ball(0.42, P(i)), { part: D.ids[i], color: D.col, alpha: 1, rim: 1.0, rimColor: '#ffffff', pop: false, center: P(i) }) }));
  const arcPts = (i, j) => { const a0 = ang(i) - 0.22, a1 = (j > i ? ang(j) : ang(j) - 2 * Math.PI) + 0.22, pts = []; for (let k = 0; k <= 16; k++){ const a = a0 + (a1 - a0) * k / 16; pts.push([Math.cos(a) * R, Math.sin(a) * R, -0.1]); } return pts; };
  const arrow = pts => { const e = pts[pts.length - 1], d = norm([e[0] - pts[pts.length - 3][0], e[1] - pts[pts.length - 3][1], 0]);
    return merge([tube({ pts: pts.slice(0, -1), r: 0.045, sides: 6 }), place(ellipsoid({ r: [0.11, 0.22, 0.11], rows: 5, cols: 8, disp: q => 1 - 0.85 * Math.max(0, q[1]) }), { at: add(e, mul(d, -0.1)), dir: d })]); };
  const arrs = []; for (let i = 0; i < n - 1; i++) arrs.push({ to: i + 1, o: B.add(arrow(arcPts(i, i + 1)), { color: '#e8e0d0', rim: 0.5, pop: false }) });
  if (D.loop) arrs.push({ to: 0, o: B.add(arrow(arcPts(n - 1, 0)), { color: '#e8e0d0', rim: 0.5, pop: false }) });
  ST.forEach((s, i) => { const p = P(i), out = norm([p[0], p[1], 0]); B.caption(add(p, [out[0] * 0.2, -0.78, 0]), () => wrapName((STG.idx === i ? '◀ ' : '') + (i + 1) + ' · ' + cycShort(s) + (STG.idx === i ? ' ▶' : ''), 22).slice(0, 2)); });
  B.caption([0, 0.35, 0], () => [D.title]);
  B.caption([0, -0.1, 0], () => wrapName((ST[STG.idx] || {}).n || '', 28));
  let last = -1; const hot = G3.hex('#ffd98a'), cold = G3.hex('#e8e0d0');
  return { dist: 13.2, yaw: 0, pitch: 0.05, target: [0, -0.3, 0], live2d: true, noSpin: true,
    anim(t){ const s = STG.idx;
      if (s !== last){ last = s; nodes.forEach(N => { B.update(N.o, ball(N.i === s ? 0.58 : 0.42, N.at)); N.o.alpha = N.i <= s ? 1 : 0.45; }); arrs.forEach(A => { A.o.col = A.to === s ? hot : cold; }); }
      nodes[s].o.glow = 0.5 + 0.4 * Math.sin(t * 4); } };
}; }
Object.keys(CYC).forEach(v => { G3.models['cyc_' + v] = cycModel(v); });
})();
