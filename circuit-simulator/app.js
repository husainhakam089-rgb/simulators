(() => {
  'use strict';

  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  const state = {
    components: [],   // {id, type, x, y, closed(for switch), voltage, resistance, order}
    wires: [],        // {id, a:{comp,term}, b:{comp,term}}
    nextId: 1,
    scale: 1,
    selected: null,   // {kind:'comp'|'wire', id}
    switchOrder: 0,
  };

  const COMP_W = 140, COMP_H = 56;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const el = {
    stage: document.getElementById('stage'),
    viewport: document.getElementById('viewport'),
    world: document.getElementById('world'),
    wireLayer: document.getElementById('wireLayer'),
    wireContent: document.getElementById('wireContent'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    viewModeBtn: document.getElementById('viewModeBtn'),
    clearBtn: document.getElementById('clearBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    circuitStatus: document.getElementById('circuitStatus'),
  };

  function uid() { return 'c' + (state.nextId++); }

  // ---------------------------------------------------------------
  // Coordinate helpers
  // ---------------------------------------------------------------
  function clientToWorld(clientX, clientY) {
    const rect = el.viewport.getBoundingClientRect();
    const x = (clientX - rect.left + el.viewport.scrollLeft) / state.scale;
    const y = (clientY - rect.top + el.viewport.scrollTop) / state.scale;
    return { x, y };
  }

  function terminalPos(comp, term) {
    const x = term === 'a' ? comp.x : comp.x + COMP_W;
    const y = comp.y + COMP_H / 2;
    return { x, y };
  }

  function findComp(id) { return state.components.find(c => c.id === id); }

  // ---------------------------------------------------------------
  // Component icons (full-size, on-canvas)
  // ---------------------------------------------------------------
  function bodySVG(type) {
    switch (type) {
      case 'battery':
        return `<svg viewBox="0 0 140 56" preserveAspectRatio="none">
          <line x1="0" y1="28" x2="20" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <line x1="120" y1="28" x2="140" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <rect x="20" y="6" width="46" height="44" rx="4" fill="#eef3fa" stroke="#8a6d1a" stroke-width="2"/>
          <rect x="66" y="6" width="46" height="44" rx="4" fill="#2f6fd1" stroke="#8a6d1a" stroke-width="2"/>
          <rect x="112" y="17" width="8" height="22" fill="#2f6fd1"/>
          <text x="36" y="34" font-size="20" fill="#2f6fd1" text-anchor="middle" font-weight="700">+</text>
          <text x="90" y="33" font-size="20" fill="#fff" text-anchor="middle" font-weight="700">−</text>
        </svg>`;
      case 'ac':
        return `<svg viewBox="0 0 140 56" preserveAspectRatio="none">
          <line x1="0" y1="28" x2="34" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <line x1="106" y1="28" x2="140" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <circle cx="70" cy="28" r="26" fill="#fff" stroke="#2f6fd1" stroke-width="3"/>
          <path d="M54 28 Q62 12 70 28 T86 28" fill="none" stroke="#2f6fd1" stroke-width="3"/>
        </svg>`;
      case 'resistor':
        return `<svg viewBox="0 0 140 56" preserveAspectRatio="none">
          <line x1="0" y1="28" x2="30" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <line x1="110" y1="28" x2="140" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <rect x="30" y="12" width="80" height="32" rx="6" fill="#f1c56b" stroke="#8a6d1a" stroke-width="2"/>
          <polyline points="30,28 42,28 48,14 60,42 72,14 84,42 96,14 102,28 110,28" fill="none" stroke="#5c3d0a" stroke-width="3"/>
        </svg>`;
      case 'switch':
        return `<svg viewBox="0 0 140 56" preserveAspectRatio="none" class="switch-svg">
          <line x1="0" y1="28" x2="20" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <line x1="120" y1="28" x2="140" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <circle cx="120" cy="28" r="8" fill="none" stroke="#8a6d1a" stroke-width="2" stroke-dasharray="2 3"/>
          <line class="lever" x1="20" y1="28" x2="112" y2="28" stroke="#3a3a3a" stroke-width="6" stroke-linecap="round"/>
          <circle cx="20" cy="28" r="8" fill="#d8d8d8" stroke="#555" stroke-width="2"/>
          <circle cx="20" cy="28" r="3" fill="#555"/>
        </svg>`;
      case 'bulb':
        return `<svg viewBox="0 0 140 56" preserveAspectRatio="none">
          <line x1="0" y1="28" x2="46" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <line x1="94" y1="28" x2="140" y2="28" stroke="#8a6d1a" stroke-width="4"/>
          <circle class="glass" cx="70" cy="28" r="24" fill="#fff8dc" stroke="#8a6d1a" stroke-width="2"/>
          <path class="filament" d="M60 24 L65 33 L70 22 L75 33 L80 24" fill="none" stroke="#8a6d1a" stroke-width="2"/>
          <rect x="63" y="49" width="14" height="6" rx="1" fill="#777"/>
        </svg>`;
      default: return '';
    }
  }

  const labelFor = {
    battery: 'بطارية', ac: 'مصدر جهد متردد', resistor: 'مقاوم',
    switch: 'مفتاح كهربائي', bulb: 'مصباح كهربائي',
  };

  // ---------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------
  function render() {
    renderComponents();
    renderWires();
    evaluateCircuit();
  }

  function renderComponents() {
    el.world.innerHTML = '';
    for (const comp of state.components) {
      const div = document.createElement('div');
      div.className = 'comp';
      div.dataset.id = comp.id;
      div.style.left = comp.x + 'px';
      div.style.top = comp.y + 'px';
      if (state.selected && state.selected.kind === 'comp' && state.selected.id === comp.id) {
        div.classList.add('selected');
      }

      const body = document.createElement('div');
      body.className = 'comp-body';
      body.innerHTML = bodySVG(comp.type);
      div.appendChild(body);

      if (comp.type === 'switch') {
        const lever = body.querySelector('.lever');
        if (!comp.closed) {
          lever.setAttribute('x2', '95');
          lever.setAttribute('y2', '6');
        }
      }

      if (comp.type === 'bulb') {
        const rays = document.createElement('div');
        rays.className = 'bulb-rays';
        const rayCount = 18;
        for (let i = 0; i < rayCount; i++) {
          const ray = document.createElement('div');
          ray.className = 'ray';
          ray.style.transform = `rotate(${i * (360 / rayCount)}deg)`;
          rays.appendChild(ray);
        }
        div.appendChild(rays);
      }

      ['a', 'b'].forEach(term => {
        const t = document.createElement('div');
        t.className = 'terminal ' + term;
        t.dataset.comp = comp.id;
        t.dataset.term = term;
        div.appendChild(t);
      });

      const label = document.createElement('div');
      label.className = 'comp-label';
      label.textContent = labelFor[comp.type] || '';
      div.appendChild(label);

      el.world.appendChild(div);
    }
  }

  function wirePathD(p1, p2) {
    const midX = (p1.x + p2.x) / 2;
    return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
  }

  function junctionRing(x, y) {
    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', x);
    ring.setAttribute('cy', y);
    ring.setAttribute('r', 13);
    ring.setAttribute('class', 'junction-ring');
    return ring;
  }

  function renderWires() {
    el.wireContent.innerHTML = '';
    for (const w of state.wires) {
      const ca = findComp(w.a.comp), cb = findComp(w.b.comp);
      if (!ca || !cb) continue;
      const p1 = terminalPos(ca, w.a.term), p2 = terminalPos(cb, w.b.term);
      const d = wirePathD(p1, p2);
      const selected = state.selected && state.selected.kind === 'wire' && state.selected.id === w.id;

      const border = document.createElementNS(SVG_NS, 'path');
      border.setAttribute('d', d);
      border.setAttribute('class', 'wire-border');

      const fill = document.createElementNS(SVG_NS, 'path');
      fill.setAttribute('d', d);
      fill.setAttribute('class', 'wire-fill' + (selected ? ' selected' : ''));

      const sheen = document.createElementNS(SVG_NS, 'path');
      sheen.setAttribute('d', d);
      sheen.setAttribute('class', 'wire-sheen');
      sheen.id = 'wirepath-' + w.id;

      const hit = document.createElementNS(SVG_NS, 'path');
      hit.setAttribute('d', d);
      hit.setAttribute('class', 'wire-hit');
      hit.dataset.wireId = w.id;

      el.wireContent.appendChild(border);
      el.wireContent.appendChild(fill);
      el.wireContent.appendChild(sheen);
      el.wireContent.appendChild(junctionRing(p1.x, p1.y));
      el.wireContent.appendChild(junctionRing(p2.x, p2.y));
      el.wireContent.appendChild(hit);
      w._active = false; // set by evaluateCircuit
    }
  }

  // ---------------------------------------------------------------
  // Circuit evaluation (graph reachability, union-find-free BFS)
  // ---------------------------------------------------------------
  function nodeKey(comp, term) { return comp + '|' + term; }

  // Adjacency carries edge metadata (kind + id) so we can later reconstruct
  // a concrete directed path and know which way current flows on each wire.
  function buildGraph(excludeInternalId) {
    const adj = new Map();
    const addEdge = (n1, n2, kind, id) => {
      if (!adj.has(n1)) adj.set(n1, []);
      if (!adj.has(n2)) adj.set(n2, []);
      adj.get(n1).push({ to: n2, kind, id });
      adj.get(n2).push({ to: n1, kind, id });
    };
    for (const comp of state.components) {
      if (comp.id === excludeInternalId) continue;
      const conducts = comp.type === 'switch' ? !!comp.closed : true;
      if (conducts) addEdge(nodeKey(comp.id, 'a'), nodeKey(comp.id, 'b'), 'comp', comp.id);
    }
    for (const w of state.wires) {
      addEdge(nodeKey(w.a.comp, w.a.term), nodeKey(w.b.comp, w.b.term), 'wire', w.id);
    }
    return adj;
  }

  function bfsReachable(adj, start) {
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      for (const edge of (adj.get(cur) || [])) {
        if (!seen.has(edge.to)) { seen.add(edge.to); queue.push(edge.to); }
      }
    }
    return seen;
  }

  // Finds one concrete path of edges from `start` to `target` (both node keys),
  // used only to give the animated current dots a consistent flow direction.
  function bfsPathEdges(adj, start, target) {
    const prev = new Map();
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      if (cur === target) break;
      for (const edge of (adj.get(cur) || [])) {
        if (!seen.has(edge.to)) {
          seen.add(edge.to);
          prev.set(edge.to, { from: cur, kind: edge.kind, id: edge.id });
          queue.push(edge.to);
        }
      }
    }
    if (!seen.has(target)) return null;
    const path = [];
    let cur = target;
    while (cur !== start) {
      const p = prev.get(cur);
      path.push({ from: p.from, to: cur, kind: p.kind, id: p.id });
      cur = p.from;
    }
    path.reverse();
    return path;
  }

  function evaluateCircuit() {
    const sources = state.components.filter(c => c.type === 'battery' || c.type === 'ac');
    const litNodes = new Set();
    const wireDirection = new Map(); // wireId -> +1 (a->b) | -1 (b->a)
    let anyLoop = false;
    let resistiveLoad = 0;

    for (const src of sources) {
      const adj = buildGraph(src.id); // exclude the source's own internal short so we test the *external* path
      const startNode = nodeKey(src.id, 'a'), targetNode = nodeKey(src.id, 'b');
      const reach = bfsReachable(adj, startNode);
      if (reach.has(targetNode)) {
        anyLoop = true;
        for (const n of reach) litNodes.add(n);
        for (const c of state.components) {
          if (c.type === 'resistor' && reach.has(nodeKey(c.id, 'a'))) resistiveLoad++;
        }
        // Walk one concrete loop path to know which way current flows on each wire.
        const path = bfsPathEdges(adj, startNode, targetNode);
        if (path) {
          for (const edge of path) {
            if (edge.kind !== 'wire') continue;
            const w = state.wires.find(x => x.id === edge.id);
            if (!w) continue;
            const forward = edge.from === nodeKey(w.a.comp, w.a.term);
            wireDirection.set(w.id, forward ? 1 : -1);
          }
        }
      }
    }

    const brightness = anyLoop ? Math.max(0.35, 1 / (1 + resistiveLoad * 0.6)) : 0;

    // Light bulbs
    let litCount = 0;
    document.querySelectorAll('.comp').forEach(div => {
      const comp = findComp(div.dataset.id);
      if (!comp || comp.type !== 'bulb') return;
      const lit = litNodes.has(nodeKey(comp.id, 'a')) && litNodes.has(nodeKey(comp.id, 'b'));
      div.classList.toggle('lit', lit);
      if (lit) {
        litCount++;
        div.querySelectorAll('.ray').forEach(r => r.style.opacity = brightness);
        const glass = div.querySelector('.glass');
        if (glass) glass.setAttribute('fill', '#fff3a0');
      } else {
        const glass = div.querySelector('.glass');
        if (glass) glass.setAttribute('fill', '#fff8dc');
      }
    });

    // Mark active wires + animate flowing current dots
    for (const w of state.wires) {
      const active = litNodes.has(nodeKey(w.a.comp, w.a.term)) && litNodes.has(nodeKey(w.b.comp, w.b.term));
      w._active = active;
      const path = document.getElementById('wirepath-' + w.id);
      if (path && active) animateCurrent(path, w.id, wireDirection.get(w.id) === -1, brightness);
    }

    updateStatusText(sources, anyLoop, litCount);
  }

  // Draws a short train of dots flowing along the wire's path to make the
  // current visually "flow", oriented per wireDirection (reverse = b->a).
  function animateCurrent(pathEl, wireId, reverse, brightness) {
    if (document.getElementById('dots-' + wireId)) return;
    const DOT_COUNT = 4;
    const dur = Math.max(0.5, 1.6 / Math.max(brightness, 0.35)); // dimmer current flows slower
    const group = document.createElementNS(SVG_NS, 'g');
    group.id = 'dots-' + wireId;
    for (let i = 0; i < DOT_COUNT; i++) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', 4.5);
      dot.setAttribute('class', 'charge-dot');
      const anim = document.createElementNS(SVG_NS, 'animateMotion');
      anim.setAttribute('dur', dur + 's');
      anim.setAttribute('repeatCount', 'indefinite');
      anim.setAttribute('begin', -(dur / DOT_COUNT) * i + 's');
      if (reverse) {
        anim.setAttribute('keyPoints', '1;0');
        anim.setAttribute('keyTimes', '0;1');
        anim.setAttribute('calcMode', 'linear');
      }
      const mpath = document.createElementNS(SVG_NS, 'mpath');
      mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + pathEl.id);
      anim.appendChild(mpath);
      dot.appendChild(anim);
      group.appendChild(dot);
    }
    el.wireContent.appendChild(group);
  }

  function updateStatusText(sources, anyLoop, litCount) {
    const switches = state.components.filter(c => c.type === 'switch');
    let parts = [];
    if (switches.length === 1) {
      parts.push('المفتاح الكهربائي ' + (switches[0].closed ? 'مغلق' : 'مفتوح'));
    } else if (switches.length > 1) {
      switches.forEach((s, i) => parts.push(`مفتاح ${i + 1}: ${s.closed ? 'مغلق' : 'مفتوح'}`));
    }
    if (state.components.length === 0) {
      el.circuitStatus.textContent = 'اسحب مكونات من اللوحة الجانبية وابدأ بتوصيل دارة';
      return;
    }
    if (sources.length === 0) {
      el.circuitStatus.textContent = 'أضف مصدر جهد (بطارية أو جهد متردد) لإكمال الدارة';
      return;
    }
    if (anyLoop && litCount > 0) {
      parts.push('الدارة مكتملة والمصباح يضيء');
    } else if (anyLoop) {
      parts.push('الدارة مكتملة');
    } else {
      parts.push('الدارة غير مكتملة');
    }
    el.circuitStatus.textContent = parts.join('  —  ');
  }

  // ---------------------------------------------------------------
  // Drag & drop from palette
  // ---------------------------------------------------------------
  document.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  el.viewport.addEventListener('dragover', e => e.preventDefault());
  el.viewport.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    const pos = clientToWorld(e.clientX, e.clientY);
    const comp = {
      id: uid(), type,
      x: pos.x - COMP_W / 2, y: pos.y - COMP_H / 2,
      // A freshly dropped switch starts OPEN, like a real one — otherwise
      // the first click on it *breaks* an already-working loop instead of
      // completing it.
      closed: type !== 'switch',
    };
    state.components.push(comp);
    render();
  });

  // ---------------------------------------------------------------
  // Interaction on canvas: drag components, draw wires, select, toggle switch
  // ---------------------------------------------------------------
  let dragCtx = null;     // component drag
  let wireCtx = null;     // wire-in-progress
  let tempWireEl = null;

  el.world.addEventListener('mousedown', e => {
    const termEl = e.target.closest('.terminal');
    const compEl = e.target.closest('.comp');
    if (termEl) {
      e.stopPropagation();
      const startPos = terminalPos(findComp(termEl.dataset.comp), termEl.dataset.term);
      wireCtx = { fromComp: termEl.dataset.comp, fromTerm: termEl.dataset.term, startPos };
      tempWireEl = document.createElementNS(SVG_NS, 'path');
      tempWireEl.setAttribute('class', 'temp-wire');
      el.wireContent.appendChild(tempWireEl);
      return;
    }
    if (compEl) {
      const comp = findComp(compEl.dataset.id);
      const start = clientToWorld(e.clientX, e.clientY);
      dragCtx = {
        id: comp.id,
        offX: start.x - comp.x, offY: start.y - comp.y,
        moved: false, startClientX: e.clientX, startClientY: e.clientY,
      };
    }
  });

  document.addEventListener('mousemove', e => {
    if (wireCtx) {
      const p = clientToWorld(e.clientX, e.clientY);
      tempWireEl.setAttribute('d', wirePathD(wireCtx.startPos, p));
      return;
    }
    if (dragCtx) {
      const dx = Math.abs(e.clientX - dragCtx.startClientX);
      const dy = Math.abs(e.clientY - dragCtx.startClientY);
      if (dx > 3 || dy > 3) dragCtx.moved = true;
      const p = clientToWorld(e.clientX, e.clientY);
      const comp = findComp(dragCtx.id);
      comp.x = p.x - dragCtx.offX;
      comp.y = p.y - dragCtx.offY;
      render();
    }
  });

  document.addEventListener('mouseup', e => {
    if (wireCtx) {
      const targetTerm = document.elementFromPoint(e.clientX, e.clientY)?.closest('.terminal');
      if (targetTerm && !(targetTerm.dataset.comp === wireCtx.fromComp && targetTerm.dataset.term === wireCtx.fromTerm)) {
        state.wires.push({
          id: uid(),
          a: { comp: wireCtx.fromComp, term: wireCtx.fromTerm },
          b: { comp: targetTerm.dataset.comp, term: targetTerm.dataset.term },
        });
      }
      tempWireEl?.remove();
      tempWireEl = null;
      wireCtx = null;
      render();
      return;
    }
    if (dragCtx) {
      const comp = findComp(dragCtx.id);
      if (!dragCtx.moved && comp) {
        if (comp.type === 'switch') {
          comp.closed = !comp.closed;
        }
        select('comp', comp.id);
      }
      dragCtx = null;
      render();
    }
  });

  el.wireLayer.addEventListener('mousedown', e => {
    const hit = e.target.closest('.wire-hit');
    if (hit) select('wire', hit.dataset.wireId);
  });

  el.viewport.addEventListener('mousedown', e => {
    if (e.target === el.viewport || e.target === el.world) select(null);
  });

  function select(kind, id) {
    if (kind === null) { state.selected = null; }
    else if (state.selected && state.selected.kind === kind && state.selected.id === id) {
      state.selected = null; // toggle off
    } else {
      state.selected = { kind, id };
    }
    render();
  }

  // ---------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------
  el.deleteBtn.addEventListener('click', deleteSelected);
  document.addEventListener('keydown', e => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName !== 'SPAN') {
      deleteSelected();
    }
  });

  function deleteSelected() {
    if (!state.selected) return;
    if (state.selected.kind === 'comp') {
      const id = state.selected.id;
      state.components = state.components.filter(c => c.id !== id);
      state.wires = state.wires.filter(w => w.a.comp !== id && w.b.comp !== id);
    } else {
      state.wires = state.wires.filter(w => w.id !== state.selected.id);
    }
    state.selected = null;
    render();
  }

  el.clearBtn.addEventListener('click', () => {
    if (state.components.length === 0 && state.wires.length === 0) return;
    if (confirm('هل تريد مسح كل عناصر الدارة؟')) {
      state.components = [];
      state.wires = [];
      state.selected = null;
      render();
    }
  });

  el.viewModeBtn.addEventListener('click', () => el.stage.classList.toggle('grid'));

  el.sidebarToggle.addEventListener('click', () => {
    el.sidebar.classList.toggle('collapsed');
    el.sidebarToggle.textContent = el.sidebar.classList.contains('collapsed') ? '▼' : '▲';
  });

  function applyZoom() {
    el.world.style.transform = `scale(${state.scale})`;
    el.wireLayer.style.transform = `scale(${state.scale})`;
  }
  el.zoomInBtn.addEventListener('click', () => {
    state.scale = Math.min(2, +(state.scale + 0.15).toFixed(2));
    applyZoom();
  });
  el.zoomOutBtn.addEventListener('click', () => {
    state.scale = Math.max(0.5, +(state.scale - 0.15).toFixed(2));
    applyZoom();
  });

  // ---------------------------------------------------------------
  // Seed with two side-by-side rectangular loops, like the reference:
  // a bulb on top and a source/switch on the bottom, joined by two
  // straight vertical wires that form the loop's left/right sides.
  // ---------------------------------------------------------------
  function seedDemo() {
    const bulb1 = { id: uid(), type: 'bulb', x: 90, y: 90, closed: true };
    const battery = { id: uid(), type: 'battery', x: 90, y: 340, closed: true };
    const bulb2 = { id: uid(), type: 'bulb', x: 380, y: 90, closed: true };
    const ac1 = { id: uid(), type: 'ac', x: 380, y: 340, closed: true };
    state.components.push(bulb1, battery, bulb2, ac1);
    state.wires.push(
      { id: uid(), a: { comp: bulb1.id, term: 'a' }, b: { comp: battery.id, term: 'a' } },
      { id: uid(), a: { comp: bulb1.id, term: 'b' }, b: { comp: battery.id, term: 'b' } },
      { id: uid(), a: { comp: bulb2.id, term: 'a' }, b: { comp: ac1.id, term: 'a' } },
      { id: uid(), a: { comp: bulb2.id, term: 'b' }, b: { comp: ac1.id, term: 'b' } }
    );
    state.selected = { kind: 'comp', id: bulb2.id };
  }

  seedDemo();
  render();
})();
