/* ═════════════ 9 · المخططات الدائرية مجسّمة: في كل محطة مجسّم صغير لخطوتها (مثل مجسّم العملية)،
   داخل فقاعة شفافة، حول حلقة بأسهم؛ المحطة الحالية تكبر وتتوهج ═════════════ */
(function(){
const { add, mul, norm, ellipsoid, capsule, tube, place, merge, spline, superEll } = G3;
const B3 = (r, at, n) => place(ellipsoid({ r, rows: n || 10, cols: (n || 10) + 4 }), { at });
const E3 = (r, at, dir) => place(ellipsoid({ r, rows: 10, cols: 14 }), dir ? { at, dir } : { at });
const T3 = (pts, r) => tube({ pts, r, sides: 6 });
const cellM = (at, r, c, nc, pl) => { const nat = add(at, [0, 0, r * 0.62]), out = [[B3(r, at, 12), c, { alpha: pl ? 0.55 : 0.85 }], [B3(r * 0.5, pl ? nat : add(at, [-r * 0.12, r * 0.1, r * 0.55]), 8), pl ? '#f4ecff' : (nc || '#3a1f6a'), pl ? { alpha: 0.5 } : undefined]];
  if (!pl) return out;
  /* كروموسومات: 2س = زوجان (أحمر وأزرق)، س = واحد من كل زوج */
  const ch = pl === 'd' ? [[-0.5, 1, '#e5484d'], [-0.17, 1, '#4a7dff'], [0.2, 0.6, '#e5484d'], [0.48, 0.6, '#4a7dff']] : [[-0.28, 1, '#e5484d'], [0.3, 0.6, '#4a7dff']];
  ch.forEach(([dx, k, col]) => out.push([place(capsule({ r: r * 0.07, len: r * 0.42 * k, rows: 3, cols: 8 }), { at: add(nat, [dx * r * 0.6, 0, r * 0.12]) }), col]));
  return out.map(o => o[2] === undefined ? [o[0], o[1]] : o); };
const sperm3 = (at, s) => [[E3([0.06 * s, 0.09 * s, 0.05 * s], at), '#e8ecff'], [T3(Array.from({ length: 8 }, (_, i) => add(at, [Math.sin(i) * 0.03 * s, -0.08 * s - i * 0.06 * s, 0])), 0.012 * s), '#9fb6ff']];
const rod3 = (at, r, len, c) => [[place(capsule({ r, len, rows: 6, cols: 16 }), { rot: [0, 0, Math.PI / 2], at }), c || '#ffe680', { alpha: 0.75 }]];
const para3 = (at, s, c) => [[place(ellipsoid({ r: [0.13 * s, 0.38 * s, 0.1 * s], rows: 10, cols: 12 }), { at }), c || '#a8d8ea', { alpha: 0.6 }]];
const ring3 = (c, rx, ry, r) => T3(Array.from({ length: 21 }, (_, i) => [c[0] + Math.cos(i / 20 * 6.2832) * rx, c[1] + Math.sin(i / 20 * 6.2832) * ry, c[2]]), r);
const leafy3 = (at, h) => [[T3([at, add(at, [0, h, 0])], 0.02), '#2f7d2b']].concat([[merge(Array.from({ length: 10 }, (_, i) => { const y = 0.1 + i * h / 11, a = i * 2.4; const d = norm([Math.cos(a), 0.6, Math.sin(a)]); return place(ellipsoid({ r: [0.015, 0.09, 0.03], rows: 4, cols: 6 }), { at: add(at, add([0, y, 0], mul(d, 0.07))), dir: d }); })), '#62c94a']]);
const frond3 = (at, h) => [[T3([at, add(at, [0.05, h, 0])], 0.02), '#2f7d2b'], [merge(Array.from({ length: 12 }, (_, i) => { const y = 0.1 + i * h / 13, sg = i % 2 ? 1 : -1, L = 0.18 * (1 - i / 14); return place(ellipsoid({ r: [L, 0.03, 0.02], rows: 4, cols: 6 }), { at: add(at, [sg * L, y, 0]) }); })), '#4fae4a']];
const heart3 = (at, k) => [[merge([E3([0.22 * k, 0.03, 0.18 * k], add(at, [-0.12 * k, 0, 0])), E3([0.22 * k, 0.03, 0.18 * k], add(at, [0.12 * k, 0, 0])), E3([0.16 * k, 0.03, 0.2 * k], add(at, [0, 0, 0.12 * k]))]), '#8fd462']];
const flask3 = (at) => [[merge([B3(0.08, at, 8), T3([add(at, [0, 0.06, 0]), add(at, [0, 0.24, 0])], 0.025)]), '#3f9a3e']];
const pollen3 = (at, r) => [[merge([B3(r, at, 10)].concat(Array.from({ length: 12 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 12), d = [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)]; return T3([add(at, mul(d, r * 0.9)), add(at, mul(d, r * 1.3))], r * 0.1); }))), '#ffc15e']];
const petals3 = (at, n, L, c) => [[merge(Array.from({ length: n }, (_, i) => { const a = i / n * 6.2832, d = norm([Math.cos(a), 0.3, Math.sin(a)]); return place(ellipsoid({ r: [0.05, L, 0.015], rows: 5, cols: 8 }), { at: add(at, mul(d, L * 0.9)), dir: d }); })), c]];
const worm3 = (y, x0, x1, r, z) => { const P = Array.from({ length: 9 }, (_, i) => [x0 + (x1 - x0) * i / 8, y + Math.sin(i * 0.8) * 0.03, z || 0]);
  const SP = spline(P, 3, false), i0 = Math.round(SP.length * 0.62), i1 = Math.round(SP.length * 0.74);
  return [[tube({ pts: SP, r: u => r * (u < 0.1 ? 0.4 + 6 * u : u > 0.9 ? 1 - 7 * (u - 0.9) : 1), sides: 10 }), '#e08a86'], [tube({ pts: SP.slice(i0, i1), r: r * 1.15, sides: 10 }), '#c45a6a']]; };
const tape3 = (at, n, s) => { const out = [[B3(0.06 * s, at, 8), '#f6efdf']]; let x = at[0] + 0.08 * s; for (let i = 0; i < n; i++){ const w = (0.03 + i * 0.006) * s; x += w; out.push([place(superEll({ h: [w, (0.025 + i * 0.006) * s, 0.012 * s], e: 0.3, rows: 3, cols: 8 }), { at: [x, at[1], at[2]] }), i >= n - 3 ? '#f2d8e8' : '#f6efdf']); x += w + 0.004; } return out; };

const ICON3 = {
  agAltD: [
    () => [[merge(Array.from({ length: 9 }, (_, i) => { const a = i * 2.4, rr = Math.sqrt(i / 9) * 0.26; return B3(0.09, [Math.cos(a) * rr, Math.sin(a) * rr, 0], 8); })), '#b48cff']],
    () => [[T3([[0, -0.42, 0], [0, -0.2, 0]], 0.03), '#6a44c4'], [E3([0.2, 0.25, 0.16], [0, 0.04, 0]), '#b48cff', { alpha: 0.6 }], [merge([[-0.07, 0.12], [0.07, 0.1], [-0.08, 0], [0.08, -0.02], [0, 0.04], [-0.02, -0.1], [0.08, -0.12]].map(([x, y]) => B3(0.04, [x, y + 0.04, 0.08], 6))), '#ffe0a8']],
    () => [[-0.15, 0.13], [0.15, 0.13], [-0.15, -0.15], [0.15, -0.15]].flatMap(([x, y]) => cellM([x, y, 0], 0.13, '#ffb547', 0, 'h')),
    () => [[merge(Array.from({ length: 9 }, (_, i) => { const a = i * 2.4, rr = Math.sqrt(i / 9) * 0.26; return B3(0.09, [Math.cos(a) * rr, Math.sin(a) * rr, 0], 8); })), '#ffb547']],
    () => cellM([0.14, 0, 0], 0.2, '#ffb547', 0, 'h').concat(cellM([-0.24, 0.06, 0], 0.11, '#ffd27a', 0, 'h')),
    () => cellM([0, 0, 0], 0.28, '#7f8cff', 0, 'd')
  ],
  ispermD: [
    () => [[place(capsule({ r: 0.36, len: 0.1, rows: 4, cols: 20 }), { rot: [Math.PI / 2, 0, 0], at: [0, 0, 0] }), '#f3d6c0', { alpha: 0.9 }], [merge(Array.from({ length: 16 }, (_, i) => B3(0.04, [Math.cos(i / 16 * 6.28) * 0.28, Math.sin(i / 16 * 6.28) * 0.28, 0.1], 6)).concat(Array.from({ length: 10 }, (_, i) => B3(0.035, [Math.cos(i / 10 * 6.28) * 0.17, Math.sin(i / 10 * 6.28) * 0.17, 0.1], 6)))), '#b07ad8'], [merge(Array.from({ length: 8 }, (_, i) => B3(0.02, [Math.cos(i / 8 * 6.28) * 0.07, Math.sin(i / 8 * 6.28) * 0.07, 0.12], 5))), '#e8ecff']],
    () => [[T3(Array.from({ length: 9 }, (_, i) => [-0.4 + i * 0.1, -0.2 + Math.abs(i - 4) * 0.025, -0.05]), 0.05), '#f3d6c0']].concat([-0.24, 0, 0.24].flatMap((x, i) => cellM([x, i === 1 ? 0.03 : -0.02, 0], 0.11, '#b07ad8', 0, 'd'))),
    () => cellM([0, 0, 0], 0.27, '#a565d6', 0, 'd'),
    () => cellM([-0.19, 0, 0], 0.17, '#c08ae0', 0, 'h').concat(cellM([0.19, 0, 0], 0.17, '#c08ae0', 0, 'h')),
    () => [-0.3, -0.1, 0.1, 0.3].flatMap(x => cellM([x, 0, 0], 0.095, '#cfa0ec', 0, 'h')),
    () => [-0.27, -0.09, 0.09, 0.27].flatMap(x => sperm3([x, 0.18, 0], 1.3))
  ],
  ieggD: [
    () => [[E3([0.4, 0.3, 0.2], [0, 0, 0]), '#e98a8a', { alpha: 0.85 }], [merge([B3(0.07, [-0.2, 0.1, 0.18]), B3(0.1, [0, 0.14, 0.18]), B3(0.13, [0.2, 0.05, 0.18])]), '#f6c3b0'], [E3([0.09, 0.07, 0.05], [0.05, -0.16, 0.18]), '#f2c14e']],
    () => [[-0.22, -0.06], [0, 0.1], [0.22, -0.06]].flatMap(([x, y]) => cellM([x, y, 0], 0.12, '#8f7ad8', 0, 'd')),
    () => [[B3(0.3, [0, 0, -0.05], 12), '#f6c3b0', { alpha: 0.45 }]].concat(cellM([0, 0, 0.05], 0.16, '#8f7ad8', 0, 'd')),
    () => cellM([0.08, 0, 0], 0.22, '#8f7ad8', 0, 'h').concat(cellM([-0.27, 0.1, 0], 0.075, '#c9a0e8', 0, 'h')),
    () => [[B3(0.3, [-0.08, 0, 0], 12), '#f6c3b0', { alpha: 0.5 }], [B3(0.18, [-0.04, 0.05, 0.05], 10), '#cfe7ff', { alpha: 0.7 }]].concat(cellM([0.32, 0.18, 0], 0.08, '#8f7ad8', 0, 'h')),
    () => cellM([0.12, 0, 0], 0.2, '#a98ae8', 0, 'h').concat([-0.32, -0.2, -0.08].flatMap(x => cellM([x, -0.16, 0], 0.06, '#c9a0e8', 0, 'h'))),
    () => [[ring3([0.05, 0, 0.02], 0.25, 0.25, 0.018), '#ffe08a']].concat(cellM([0.05, 0, 0], 0.2, '#a98ae8', 0, 'h'), [[merge([[-0.3, 0.14], [-0.34, -0.02], [-0.28, -0.17]].map(([x, y]) => B3(0.05, [x, y, 0], 6))), '#c9a0e8', { alpha: 0.35 }]])
  ],

  bconjD: [
    () => rod3([-0.22, 0, 0], 0.12, 0.2).concat(rod3([0.24, 0, 0], 0.12, 0.2), [[B3(0.04, [-0.22, -0.05, 0.1]), '#d43fd0']], [[merge([-0.05, 0, 0.05].map(d => T3([[-0.22 + d, 0.12, 0], [-0.22 + d * 2, 0.24, 0]], 0.01))), '#2a2a2a']]),
    () => rod3([-0.2, 0, 0], 0.12, 0.2).concat(rod3([0.2, 0, 0], 0.12, 0.2), [[place(capsule({ r: 0.05, len: 0.06, rows: 3, cols: 10 }), { rot: [0, 0, Math.PI / 2], at: [0, 0, 0] }), '#ffe680']]),
    () => rod3([-0.2, 0, 0], 0.12, 0.2).concat(rod3([0.2, 0, 0], 0.12, 0.2), [[ring3([-0.2, 0.03, 0.1], 0.07, 0.05, 0.012), '#e2403e'], [B3(0.035, [-0.2, -0.03, 0.12]), '#d43fd0']]),
    () => rod3([-0.2, 0, 0], 0.12, 0.2).concat(rod3([0.2, 0, 0], 0.12, 0.2), [[B3(0.04, [0, 0, 0.05]), '#d43fd0']]),
    () => rod3([-0.2, 0, 0], 0.12, 0.2).concat(rod3([0.2, 0, 0], 0.12, 0.2), [[ring3([0.2, 0.03, 0.1], 0.07, 0.05, 0.012), '#3d7bf0'], [T3([[0.15, -0.04, 0.12], [0.2, -0.06, 0.12], [0.25, -0.04, 0.12]], 0.018), '#d43fd0']])
  ],
  prPCD: [
    () => para3([-0.12, 0, 0], 1).concat(para3([0.12, 0, 0], 1), [[place(capsule({ r: 0.04, len: 0.08, rows: 3, cols: 8 }), { rot: [0, 0, Math.PI / 2], at: [0, 0.05, 0] }), '#e6f8ff']]),
    () => para3([-0.12, 0, 0], 1).concat(para3([0.12, 0, 0], 1), [[merge([0, 1, 2, 3].flatMap(j => [B3(0.025, [-0.12, -0.05 - j * 0.06, 0.1], 5), B3(0.025, [0.12, -0.05 - j * 0.06, 0.1], 5)])), '#f7941d']]),
    () => para3([-0.12, 0, 0], 1).concat(para3([0.12, 0, 0], 1), [[merge([B3(0.04, [-0.12, 0, 0.1]), B3(0.04, [0.12, 0, 0.1])]), '#f7941d'], [merge([B3(0.025, [-0.12, -0.1, 0.1]), B3(0.025, [0.12, -0.1, 0.1])]), '#7a5ad6']]),
    () => para3([-0.12, 0, 0], 1).concat(para3([0.12, 0, 0], 1), [[merge([B3(0.03, [-0.03, -0.05, 0.12]), B3(0.03, [0.03, -0.12, 0.12])]), '#1d3b55']]),
    () => para3([-0.12, 0, 0], 1).concat(para3([0.12, 0, 0], 1), [[merge([B3(0.06, [-0.12, -0.03, 0.1]), B3(0.06, [0.12, -0.03, 0.1])]), '#28b8f0']]),
    () => para3([-0.24, 0, 0], 1).concat(para3([0.24, 0, 0], 1), [[merge([B3(0.06, [-0.24, -0.03, 0.1]), B3(0.06, [0.24, -0.03, 0.1])]), '#28b8f0']]),
    () => [-0.33, -0.19, -0.05, 0.09, 0.23, 0.37].flatMap((x, i) => para3([x - 0.02, (i % 2) * 0.12 - 0.06, 0], 0.4))
  ],
  plvMossD: [
    () => leafy3([-0.15, -0.35, 0], 0.6).concat(leafy3([0.15, -0.35, 0], 0.6), [[merge([E3([0.07, 0.04, 0.07], [-0.15, 0.27, 0]), E3([0.07, 0.04, 0.07], [0.15, 0.27, 0])]), '#efc35a']]),
    () => [[T3(spline([[-0.3, -0.1, 0], [0, 0.2, 0.05], [0.3, -0.1, 0]], 5, false), 0.012), '#8fd6ff', { alpha: 0.6 }], [merge([-0.18, -0.06, 0.06, 0.18].map(x => B3(0.03, [x, 0.08 - Math.abs(x) * 0.5, 0.05], 6))), '#3a7ad8']],
    () => flask3([0, -0.15, 0]).concat([[B3(0.06, [0, -0.15, 0.04], 8), '#9a6ae0']]),
    () => leafy3([0, -0.4, 0], 0.4).concat([[T3([[0, 0, 0], [0.03, 0.25, 0]], 0.012), '#c8a050'], [E3([0.05, 0.1, 0.05], [0.06, 0.33, 0], [0.3, 1, 0]), '#a8743a']]),
    () => [[E3([0.06, 0.12, 0.06], [-0.12, 0.05, 0], [0.4, 1, 0]), '#a8743a'], [merge([[0.05, 0.12], [0.15, 0.02], [0.12, -0.12], [0.25, 0.08], [0.22, -0.05], [0.3, -0.15]].map(([x, y]) => B3(0.028, [x, y, 0.05], 6))), '#d8b040']],
    () => [[merge(Array.from({ length: 6 }, (_, i) => T3([[-0.3 + i * 0.1, -0.05 + Math.sin(i) * 0.03, 0], [-0.2 + i * 0.1, -0.05 + Math.sin(i + 1) * 0.03, 0]], 0.015)).concat([1, 3, 5].map(i => T3([[-0.25 + i * 0.1, -0.05, 0], [-0.23 + i * 0.1, 0.12, 0]], 0.012)))), '#86dd62']]
  ],
  plvFernD: [
    () => frond3([-0.1, -0.4, 0], 0.75).concat(frond3([0.12, -0.4, 0.05], 0.6)),
    () => frond3([-0.2, -0.4, 0], 0.7).concat([[merge([[0.05, 0.1], [0.15, 0.02], [0.12, -0.1], [0.25, 0.06], [0.22, -0.06]].map(([x, y]) => B3(0.026, [x, y, 0.05], 6))), '#c89040']]),
    () => heart3([0, 0, 0], 1).concat([[merge(Array.from({ length: 6 }, (_, i) => T3([[-0.06 + i * 0.025, -0.02, 0.18], [-0.07 + i * 0.03, -0.12, 0.22]], 0.006))), '#e8e0c0']]),
    () => heart3([0, 0, 0], 1).concat([[merge([0, 1, 2].map(i => E3([0.025, 0.05, 0.025], [-0.05 + i * 0.05, 0.05, -0.1]))), '#3f8a3e'], [merge([[0.12, 0.08, 0.1], [0.08, 0.08, 0.02], [0.03, 0.08, -0.05]].map(p => B3(0.02, p, 5))), '#3a7ad8']]),
    () => heart3([0, -0.1, 0], 0.9).concat(frond3([0, -0.08, -0.08], 0.35))
  ],
  flVPollenD: [
    () => [[merge([E3([0.22, 0.14, 0.12], [-0.17, 0, 0]), E3([0.22, 0.14, 0.12], [0.17, 0, 0])]), '#6fb85e', { alpha: 0.75 }], [merge([[-0.24, 0.05], [-0.24, -0.05], [0.24, 0.05], [0.24, -0.05]].map(([x, y]) => E3([0.06, 0.04, 0.05], [x, y, 0.08]))), '#2f6b3a'], [B3(0.05, [0, 0, 0.06]), '#3d7f9e']],
    () => [[E3([0.36, 0.26, 0.12], [0, 0, 0]), '#2f6b3a', { alpha: 0.8 }]].concat([[-0.15, 0.06], [0, 0.1], [0.15, 0.06], [-0.08, -0.1], [0.08, -0.1]].flatMap(([x, y]) => cellM([x, y, 0.1], 0.07, '#e0362c', '#6a1a1a'))),
    () => [[merge([[0.6, 0.45, 0.4], [-0.6, 0.45, -0.4], [0.5, -0.5, -0.55], [-0.5, -0.5, 0.55]].map(d => B3(0.1, mul(norm(d), 0.1), 8))), '#f2a050']],
    () => [[merge([[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b]) => B3(0.09, [a * 0.18, b * 0.14, 0], 8))), '#f2a050']],
    () => pollen3([0, 0, 0], 0.2).concat([[B3(0.05, [-0.06, -0.03, 0.17]), '#d0302a'], [E3([0.05, 0.03, 0.03], [0.06, 0.05, 0.17]), '#e3237a']]),
    () => [[merge([E3([0.2, 0.12, 0.1], [-0.15, -0.08, 0]), E3([0.2, 0.12, 0.1], [0.15, -0.08, 0])]), '#6fb85e', { alpha: 0.8 }]].concat([[-0.32, 0.12], [-0.26, 0.24], [0.3, 0.14], [0.22, 0.26], [0, 0.2]].flatMap(([x, y]) => pollen3([x, y, 0], 0.04)))
  ],
  sdsFTD: [
    () => [[T3([[0, -0.4, 0], [0, -0.05, 0]], 0.02), '#4f9a3a']].concat(petals3([0, -0.05, 0], 5, 0.16, '#f59ab0'), [[merge([E3([0.06, 0.08, 0.06], [0, 0.03, 0]), T3([[0, 0.1, 0], [0, 0.26, 0]], 0.012), B3(0.025, [0, 0.27, 0])]), '#9ae07a']]),
    () => [[B3(0.26, [0, -0.02, 0], 14), '#f6a33a']],
    () => [[T3([[0, -0.4, 0], [0, -0.05, 0]], 0.02), '#4f9a3a']].concat(petals3([0, -0.05, 0], 5, 0.16, '#f7f0f6'), [[E3([0.12, 0.09, 0.12], [0, 0, 0]), '#9bd26b'], [merge(Array.from({ length: 10 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - (i + 0.5) / 10); return B3(0.025, [Math.cos(a) * Math.sin(b) * 0.12, 0.02 + Math.cos(b) * 0.09, Math.sin(a) * Math.sin(b) * 0.12], 5); })), '#5fbf45']]),
    () => [[merge(Array.from({ length: 30 }, (_, i) => { const a = i * 2.4, b = Math.acos(1 - 2 * (i + 0.5) / 30); return B3(0.06, [Math.cos(a) * Math.sin(b) * 0.2, Math.cos(b) * 0.26, Math.sin(a) * Math.sin(b) * 0.2], 6); })), '#3a1d4a']],
    () => [[T3([[0, -0.4, 0], [0, 0.35, 0]], 0.025), '#4f9a3a']].concat(Array.from({ length: 7 }, (_, i) => petals3([Math.cos(i * 2.2) * 0.1, -0.25 + i * 0.09, Math.sin(i * 2.2) * 0.1], 5, 0.05, '#c07ad8')).flat()),
    () => [[E3([0.2, 0.3, 0.2], [0, -0.05, 0]), '#e6a93a'], [merge(Array.from({ length: 6 }, (_, i) => { const a = i * 1.05, d = norm([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]); return place(ellipsoid({ r: [0.02, 0.14, 0.04], rows: 4, cols: 6 }), { at: add([0, 0.3, 0], mul(d, 0.12)), dir: d }); })), '#4f9a3a']]
  ],
  cyvHermD: [
    () => worm3(0, -0.4, 0.4, 0.06).concat([[merge([0.12, 0.18, 0.24].map(x => B3(0.025, [x, 0.02, 0.06], 6))), '#7fb2ff'], [merge([0.0, 0.05].map(x => B3(0.03, [x, 0.02, 0.06], 6))), '#ff9ec7']]),
    () => [[merge([place(capsule({ r: 0.04, len: 0.18, rows: 3, cols: 8 }), { at: [-0.3, 0, 0] })].concat([-1, 0, 1].map(k => T3([[-0.3 + k * 0.02, 0.14, 0], [-0.3 + k * 0.1, 0.24, 0]], 0.01)))), '#a8dc8e'], [E3([0.1, 0.05, 0.08], [0, 0, 0]), '#f08a5a'], [E3([0.12, 0.05, 0.04], [0.3, 0, 0]), '#7fc8e8']],
    () => worm3(0.08, -0.4, 0.4, 0.05, 0.03).concat(worm3(-0.08, 0.4, -0.4, 0.05, -0.03), [[merge([B3(0.025, [-0.05, 0.02, 0.08]), B3(0.025, [0.05, -0.02, 0.08])]), '#7fb2ff']]),
    () => [[place(capsule({ r: 0.04, len: 0.25, rows: 3, cols: 10 }), { rot: [0, 0, Math.PI / 2], at: [-0.15, 0.08, 0] }), '#7fb2ff'], [place(capsule({ r: 0.04, len: 0.25, rows: 3, cols: 10 }), { rot: [0, 0, Math.PI / 2], at: [0.15, -0.06, 0] }), '#ff9ec7'], [T3([[-0.4, -0.2, 0], [0.4, -0.2, 0]], 0.012), '#d8d0e8']],
    () => tape3([-0.42, 0, 0], 10, 1.4)
  ]
};
ICON3.prPSD = [ICON3.prPCD[0], ICON3.prPCD[1], ICON3.prPCD[2],
  () => para3([-0.12, 0, 0], 1).concat(para3([0.12, 0, 0], 1), [[B3(0.06, [-0.12, -0.03, 0.1]), '#f7941d'], [B3(0.06, [0.12, -0.03, 0.1]), '#7a5ad6']]),
  () => para3([-0.24, 0, 0], 1).concat(para3([0.24, 0, 0], 1), [[B3(0.06, [-0.24, -0.03, 0.1]), '#f7941d'], [B3(0.06, [0.24, -0.03, 0.1]), '#7a5ad6']]),
  ICON3.prPCD[6]];
function cycModel(v){ return function(B){
  const D = CYC[v], ST = D.stages(), n = ST.length, R = 2.6;
  const ang = i => Math.PI / 2 - i * 2 * Math.PI / n, P = i => [Math.cos(ang(i)) * R, Math.sin(ang(i)) * R, 0];
  const xf = (m, s, at) => { const p = new Array(m.p.length); for (let k = 0; k < m.p.length; k += 3){ p[k] = m.p[k] * s + at[0]; p[k + 1] = m.p[k + 1] * s + at[1]; p[k + 2] = m.p[k + 2] * s + at[2]; } return { p, n: m.n, l: m.l, i: m.i }; };
  const IC = ICON3[v] || [];
  const S0 = 1.3, S1 = 1.65;
  const nodes = ST.map((_, i) => { const at = P(i), bub = B3(0.48, [0, 0, 0], 16);
    const objs = [{ m: bub, o: B.add(xf(bub, S0, at), { part: D.N[i].id, color: D.col, alpha: 0.16, rim: 1.2, rimColor: '#ffffff', shell: { size: 1.3 }, pop: false, center: at }) }];
    (IC[i] ? IC[i]() : [[B3(0.2, [0, 0, 0]), D.col]]).forEach(([m, c, o]) => objs.push({ m, o: B.add(xf(m, S0, at), Object.assign({ part: D.N[i].id, color: c, rim: 0.8, rimColor: '#ffffff', pop: false, center: at }, o || {})) }));
    return { i, at, objs }; });
  const arcPts = (i, j) => { const a0 = ang(i) - 0.3, a1 = (j > i ? ang(j) : ang(j) - 2 * Math.PI) + 0.3, pts = []; for (let k = 0; k <= 16; k++){ const a = a0 + (a1 - a0) * k / 16; pts.push([Math.cos(a) * R, Math.sin(a) * R, -0.3]); } return pts; };
  const arrow = pts => { const e = pts[pts.length - 1], d = norm([e[0] - pts[pts.length - 3][0], e[1] - pts[pts.length - 3][1], 0]);
    return merge([tube({ pts: pts.slice(0, -1), r: 0.045, sides: 6 }), place(ellipsoid({ r: [0.11, 0.22, 0.11], rows: 5, cols: 8, disp: q => 1 - 0.85 * Math.max(0, q[1]) }), { at: add(e, mul(d, -0.1)), dir: d })]); };
  const arrs = []; for (let i = 0; i < n - 1; i++) arrs.push({ to: i + 1, o: B.add(arrow(arcPts(i, i + 1)), { color: '#e8e0d0', rim: 0.5, pop: false }) });
  if (D.loop) arrs.push({ to: 0, o: B.add(arrow(arcPts(n - 1, 0)), { color: '#e8e0d0', rim: 0.5, pop: false }) });
  D.N.forEach((nd, i) => { const p = P(i); B.caption(add(p, [0, -0.8, 0]), () => wrapName((STG.idx === i ? '◀ ' : '') + (i + 1) + ' · ' + nd.n + (STG.idx === i ? ' ▶' : ''), 20).slice(0, 2));
    /* اسم العملية على السهم الداخل للمحطة */
    if (nd.via && (i > 0 || D.loop)){ const am = (ang(i) + (i > 0 ? ang(i - 1) : ang(n - 1) - 2 * Math.PI)) / 2; B.caption([Math.cos(am) * (R + 0.72), Math.sin(am) * (R + 0.72), 0.2], () => ['➜ ' + nd.via]); } });
  B.caption([0, 0.35, 0], () => [D.title]);
  B.caption([0, -0.1, 0], () => wrapName((ST[STG.idx] || {}).n || '', 28));
  let last = -1; const hot = G3.hex('#ffd98a'), cold = G3.hex('#e8e0d0');
  return { dist: 15, yaw: 0, pitch: 0.06, target: [0, -0.35, 0], live2d: true,
    anim(t){ const s = STG.idx;
      if (s !== last){ last = s; nodes.forEach(N => N.objs.forEach(R2 => { B.update(R2.o, xf(R2.m, N.i === s ? S1 : S0, N.at)); if (!R2.o.shell){ if (R2.o.base === undefined) R2.o.base = R2.o.alpha; R2.o.alpha = N.i <= s ? R2.o.base : R2.o.base * 0.7; } }));
        arrs.forEach(A => { A.o.col = A.to === s ? hot : cold; }); }
      nodes[s].objs.forEach(R2 => { R2.o.glow = 0.45 + 0.4 * Math.sin(t * 4); }); } };
}; }
Object.keys(CYC).forEach(v => { G3.models['cyc_' + v] = cycModel(v); });
})();
