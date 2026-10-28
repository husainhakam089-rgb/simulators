
/* ══════════════════════════════════════════════════════════════════════════
   3 · نظام الجزيئات المتحركة
   ══════════════════════════════════════════════════════════════════════════ */

function prepPath(pts){
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
function alongPath(p, d){
  const { pts, cum } = p;
  if (d <= 0) return pts[0];
  for (let i = 1; i < cum.length; i++){
    if (d <= cum[i]){
      const t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
              pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }
  }
  return pts[pts.length - 1];
}
function flow(o){
  return {
    paths: o.paths.map(prepPath), speed: o.speed || 55, every: o.every || 1.3,
    max: o.max || 5, r: o.r || 3.2, fill: o.fill || '#ffffff', halo: o.halo !== false,
    ring: !!o.ring, owner: o.owner || null, acc: (o.every || 1.3) * 0.4, items: []
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · المشاهد — الأسماء والتأشيرات كما في رسوم الملزمة
   ══════════════════════════════════════════════════════════════════════════ */

const SCENES = {};
