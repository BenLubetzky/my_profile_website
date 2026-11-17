/* =========================================================
   Night-forest particle background.
   One canvas behind the page. Every element with data-shape
   tells the particles what to grow into while it sits in the
   middle of the viewport. Bright warm points are fireflies.
   ========================================================= */
(() => {
  const canvas = document.getElementById("bg");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  // ?still draws every shape already settled (also used for screenshots)
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]still\b/.test(location.search);

  let W = 0, H = 0, DPR = 1, small = false;
  const N = innerWidth < 760 ? 1000 : 2000;
  const DUST = innerWidth < 760 ? 60 : 130;

  // ---------- Colours & sprites ----------
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function sprite(rgb, r = 32, core = 0.22) {
    const c = document.createElement("canvas");
    c.width = c.height = r * 2;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "rgba(255,255,240,1)");
    gr.addColorStop(core * 0.5, `rgba(${rgb},1)`);
    gr.addColorStop(core, `rgba(${rgb},.5)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, r * 2, r * 2);
    return c;
  }
  const MOSS = [52, 116, 76], LEAF = [118, 204, 124], MINT = [184, 240, 196];
  const TINTS = [];
  for (let i = 0; i < 6; i++) TINTS.push(sprite((i < 3 ? mix(MOSS, LEAF, i / 2.5) : mix(LEAF, MINT, (i - 3) / 2)).join(",")));
  TINTS.push(sprite("176,146,100"));   // 6 bark
  TINTS.push(sprite("206,226,128"));   // 7 young leaf
  TINTS.push(sprite("214,240,226"));   // 8 moonlight
  const BARK = 6, YOUNG = 7, PALE = 8;
  const FIREFLY = sprite("255,222,116", 48, 0.15);
  const FIREFLY_GREEN = sprite("206,255,140", 48, 0.15);
  const POLLEN = sprite("190,230,170", 16, 0.3);

  // ---------- Helpers ----------
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const pickTint = () => (Math.random() * 6) | 0;
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // Fit points into a box of given height, centred on 0
  function fit(pts, height = 2.2, cy = 0) {
    let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
    const s = height / (y1 - y0 || 1), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    for (const p of pts) { p[0] = (p[0] - mx) * s; p[1] = (p[1] - my) * s + cy; p[2] *= s; }
    return pts;
  }
  function fill(out, make) { while (out.length < N) out.push(make()); return out.slice(0, N); }
  function groundDisc(out, count, y, r, tint = 0) {
    for (let i = 0; i < count; i++) {
      const a = rand(Math.PI * 2), d = r * Math.sqrt(Math.random());
      out.push([Math.cos(a) * d, y + gauss() * 0.02, Math.sin(a) * d * 0.6, Math.random() < 0.7 ? tint : pickTint()]);
    }
  }

  // Branching structure shared by tree and roots
  function branches(levels, down, spread = [0.35, 0.75]) {
    const segs = [], tips = [];
    function grow(p, dir, len, depth, thick) {
      const end = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
      segs.push([p, end, thick, len]);
      if (depth === 0) { tips.push(end); return; }
      const n = depth > levels - 2 ? 2 : 3;
      const yaw0 = rand(Math.PI * 2);
      for (let k = 0; k < n; k++) {
        const yaw = yaw0 + (k / n) * Math.PI * 2 + gauss() * 0.4;
        let perp = norm(cross(dir, [Math.cos(yaw), 0.15, Math.sin(yaw)]));
        const a = rand(spread[0], spread[1]);
        const nd = norm([dir[0] * Math.cos(a) + perp[0] * Math.sin(a), dir[1] * Math.cos(a) + perp[1] * Math.sin(a), dir[2] * Math.cos(a) + perp[2] * Math.sin(a)]);
        if (!down) nd[1] = Math.min(nd[1], -0.15);
        grow(end, nd, len * rand(0.66, 0.8), depth - 1, thick * 0.68);
      }
    }
    grow([0, 0, 0], down ? [0, 1, 0] : [0, -1, 0], 0.62, levels, 1);
    return { segs, tips };
  }
  function alongSegments(out, segs, count, tint) {
    const total = segs.reduce((s, g) => s + g[3] * (0.4 + g[2]), 0);
    for (let i = 0; i < count; i++) {
      let r = Math.random() * total, g = segs[0];
      for (const s of segs) { r -= s[3] * (0.4 + s[2]); if (r <= 0) { g = s; break; } }
      const t = Math.random(), th = 0.012 + g[2] * 0.06;
      out.push([g[0][0] + (g[1][0] - g[0][0]) * t + gauss() * th, g[0][1] + (g[1][1] - g[0][1]) * t + gauss() * th, g[0][2] + (g[1][2] - g[0][2]) * t + gauss() * th, tint]);
    }
  }

  // ---------- Shapes (normalised, roughly -1.2..1.2) ----------
  function tree() {
    const out = [];
    // trunk with a slight lean, flaring at the base
    for (let i = 0; i < N * 0.13; i++) {
      const t = Math.random(), w = 0.07 + 0.08 * Math.pow(1 - t, 3);
      const a = rand(Math.PI * 2);
      out.push([Math.sin(t * 1.6) * 0.06 + Math.cos(a) * w, 1.0 - t * 1.05, Math.sin(a) * w, BARK]);
    }
    // main limbs reaching into the crown
    const limbs = [[-0.55, -0.45, 0.2], [0.6, -0.5, -0.15], [-0.15, -0.75, -0.35], [0.25, -0.7, 0.4], [0.05, -0.85, 0]];
    for (let i = 0; i < N * 0.09; i++) {
      const L = limbs[i % limbs.length], t = Math.random();
      out.push([0.04 + L[0] * t + gauss() * 0.02, -0.02 + (L[1] + 0.02) * t + gauss() * 0.02, L[2] * t + gauss() * 0.02, BARK]);
    }
    // lumpy crown: overlapping leaf clouds, mostly on their surfaces
    const blobs = [[0, -0.62, 0, 0.5], [-0.5, -0.42, 0.1, 0.38], [0.52, -0.45, -0.05, 0.4], [-0.22, -0.95, -0.1, 0.36], [0.28, -0.92, 0.12, 0.34],
                   [-0.75, -0.2, -0.05, 0.26], [0.8, -0.22, 0.1, 0.27], [0, -0.3, 0.35, 0.33], [0.05, -0.35, -0.38, 0.32]];
    const crown = Math.floor(N * 0.64);
    for (let i = 0; i < crown; i++) {
      const b = blobs[(Math.random() * blobs.length) | 0];
      const u = rand(-1, 1), th = rand(Math.PI * 2), s = Math.sqrt(1 - u * u);
      const r = b[3] * (Math.random() < 0.7 ? 0.9 + Math.random() * 0.12 : Math.cbrt(Math.random()));
      const y = b[1] + u * r * 0.85;
      const lit = (-u + 1) / 2;                 // top of each cloud catches more light
      out.push([b[0] + Math.cos(th) * s * r, y, b[2] + Math.sin(th) * s * r, lit > 0.75 ? (Math.random() < 0.4 ? YOUNG : 5) : lit > 0.4 ? 3 + ((Math.random() * 2) | 0) : (Math.random() * 3) | 0]);
    }
    // grass at the base
    groundDisc(out, N - out.length, 1.0, 1.3, 0);
    return fit(out, 2.2, 0.05);
  }

  function sprout() {
    const out = [];
    // stem: gentle curve
    for (let i = 0; i < N * 0.22; i++) {
      const t = Math.random();
      out.push([Math.sin(t * 2.2) * 0.12 + gauss() * 0.012, 0.9 - t * 1.25, gauss() * 0.012, 3]);
    }
    // two leaves
    const leafAt = (sx, ang) => {
      for (let i = 0; i < N * 0.26; i++) {
        const u = Math.random(), w = 0.22 * Math.sin(Math.PI * u), v = rand(-1, 1) * w;
        const lx = u * 0.75, ly = v;
        const x = lx * Math.cos(ang) - ly * Math.sin(ang), y = lx * Math.sin(ang) + ly * Math.cos(ang);
        out.push([0.2 + sx * x, -0.32 + y, (u * u) * 0.15 * sx + gauss() * 0.01, Math.random() < 0.3 ? YOUNG : 3 + ((Math.random() * 3) | 0)]);
      }
    };
    leafAt(1, -0.55);
    leafAt(-1, 0.55);
    groundDisc(out, N - out.length, 0.92, 1.25, 0);
    return fit(out, 1.9, 0.1);
  }

  function roots() {
    const { segs, tips } = branches(6, true, [0.45, 0.95]);
    const out = [];
    alongSegments(out, segs, Math.floor(N * 0.66), BARK);
    for (let i = 0; i < N * 0.12; i++) {
      const tp = tips[(Math.random() * tips.length) | 0];
      out.push([tp[0] + gauss() * 0.04, tp[1] + gauss() * 0.04, tp[2] + gauss() * 0.04, PALE]);
    }
    // ground line on top, with a small sapling above it
    groundDisc(out, Math.floor(N * 0.14), -0.02, 1.4, 0);
    return fill(fit(out, 2.2, 0.15), () => [gauss() * 0.06, -0.1 - Math.random() * 0.3, gauss() * 0.06, 4]);
  }

  function forest() {
    const trees = [[-1.25, 0.2, 1.0], [-0.7, -0.35, 1.45], [-0.15, 0.25, 1.15], [0.35, -0.2, 1.7], [0.9, 0.3, 1.2], [1.35, -0.3, 1.4], [-1.6, -0.3, 0.8], [1.75, 0.1, 0.85]];
    const out = [];
    const per = Math.floor((N * 0.84) / trees.length);
    for (const [tx, tz, h] of trees) {
      for (let i = 0; i < per; i++) {
        if (i < per * 0.06) { out.push([tx + gauss() * 0.015, 0.9 - Math.random() * 0.18, tz, BARK]); continue; }
        const u = Math.random();                     // 0 base .. 1 tip
        const tier = (u * 5) % 1;
        const r = (1 - u) * 0.34 * h * (0.7 + 0.3 * (1 - tier));
        const a = rand(Math.PI * 2), d = Math.random() < 0.75 ? r : r * Math.random();
        out.push([tx + Math.cos(a) * d, 0.72 - u * h * 1.05, tz + Math.sin(a) * d, Math.random() < 0.1 ? YOUNG : pickTint()]);
      }
    }
    groundDisc(out, N - out.length, 0.9, 2.1, 0);
    return fit(out, 2.0, 0.05);
  }

  function rings() {
    const out = [];
    const count = 12;
    const wob = Array.from({ length: count }, () => [rand(6.28), rand(0.02, 0.05)]);
    const outer = Math.floor(N * 0.18);
    for (let i = 0; i < outer; i++) {
      const a = rand(Math.PI * 2), r = 1.08 + Math.random() * 0.1;
      out.push([Math.cos(a) * r, Math.sin(a) * r * 0.98, gauss() * 0.03, BARK]);
    }
    while (out.length < N * 0.94) {
      const k = 1 + ((Math.random() * count) | 0);
      const a = rand(Math.PI * 2), base = (k / count) * 1.02;
      const r = base * (1 + wob[k - 1][1] * Math.sin(3 * a + wob[k - 1][0])) + gauss() * 0.006;
      out.push([Math.cos(a) * r, Math.sin(a) * r * 0.98, gauss() * 0.02, k % 3 === 0 ? YOUNG : k < 4 ? 1 : pickTint()]);
    }
    // a crack from the centre
    while (out.length < N) { const t = Math.random() * 0.95; out.push([t * 0.55 + gauss() * 0.01, -t * 0.82 + gauss() * 0.01, 0, PALE]); }
    return out;
  }

  function hills() {
    // x and z hold grid coordinates; y is animated every frame
    const out = [];
    const cols = Math.ceil(Math.sqrt(N * 2.6)), rows = Math.ceil(N / cols);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols && out.length < N; c++) {
      out.push([(c / (cols - 1)) * 2 - 1 + gauss() * 0.004, 0, (r / (rows - 1)) * 2 - 1 + gauss() * 0.01]);
    }
    return out;
  }

  function leaf() {
    const out = [];
    const W0 = 0.52;
    const half = (y) => W0 * Math.pow(Math.sin(Math.PI * (y + 1) / 2), 0.85);
    const add = (x, y, tint) => out.push([x, y, 0.28 * x * x - 0.06 + gauss() * 0.008, tint]);
    for (let i = 0; i < N * 0.3; i++) { const y = rand(-1, 1), s = Math.random() < 0.5 ? -1 : 1; add(s * half(y) + gauss() * 0.008, y, pickTint()); }
    for (let i = 0; i < N * 0.12; i++) add(gauss() * 0.008, rand(-0.95, 1.4), YOUNG);
    for (let i = 0; i < N * 0.26; i++) {
      const v = (Math.random() * 7) | 0, s = Math.random() < 0.5 ? -1 : 1, y0 = -0.75 + v * 0.26, t = Math.random();
      const y = y0 - t * 0.3, x = s * half(y0) * t * 0.92;
      add(x + gauss() * 0.006, y, 4);
    }
    while (out.length < N) { const y = rand(-1, 1), w = half(y); add(rand(-w, w), y, Math.random() < 0.5 ? 1 : 2); }
    const ang = -0.55;
    for (const p of out) { const x = p[0], y = p[1]; p[0] = x * Math.cos(ang) - y * Math.sin(ang); p[1] = x * Math.sin(ang) + y * Math.cos(ang); }
    return fit(out, 2.2, 0);
  }

  function moon() {
    const out = [];
    const L = norm([-0.8, -0.35, -0.5]);
    const mc = [0.35, -0.42, 0], R = 0.62;
    while (out.length < N * 0.55) {
      const u = rand(-1, 1), th = rand(Math.PI * 2), s = Math.sqrt(1 - u * u);
      const n = [Math.cos(th) * s, u, Math.sin(th) * s];
      const lit = n[0] * L[0] + n[1] * L[1] + n[2] * L[2];
      if (Math.random() > 0.15 + 0.85 * Math.max(0, lit)) continue;
      out.push([mc[0] + n[0] * R, mc[1] + n[1] * R, mc[2] + n[2] * R, lit > 0.3 ? PALE : 5]);
    }
    // mountain ridge below
    const ridge = (x) => 0.55 - 0.42 * Math.abs(Math.sin(x * 1.3 + 0.6)) - 0.18 * Math.abs(Math.sin(x * 3.1 + 1.7)) - 0.06 * Math.sin(x * 9);
    while (out.length < N) {
      const x = rand(-2, 2), top = ridge(x), edge = Math.random() < 0.45;
      const y = edge ? top + gauss() * 0.01 : top + Math.random() * (1.0 - top);
      out.push([x, y, gauss() * 0.15, edge ? 2 : 0]);
    }
    return out;
  }

  const SHAPES = {
    tree: { make: tree, spin: true },
    sprout: { make: sprout, spin: true },
    roots: { make: roots, spin: true },
    forest: { make: forest, spin: false, sway: 0.5 },
    rings: { make: rings, spin: false, sway: 0.4 },
    hills: { make: hills, spin: false, wave: true },
    leaf: { make: leaf, spin: false, sway: 0.45 },
    moon: { make: moon, spin: false, sway: 0.2 },
  };
  const cache = {};
  function getShape(name) {
    if (!SHAPES[name]) name = "tree";
    if (!cache[name]) {
      const pts = SHAPES[name].make();
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      cache[name] = pts;
    }
    return cache[name];
  }

  // ---------- Particles ----------
  const P = [];
  for (let i = 0; i < N; i++) {
    const fly = i < 10 || Math.random() < 0.03;
    P.push({
      x: gauss() * 3, y: gauss() * 3, z: gauss() * 3,
      tx: 0, ty: 0, tz: 0, vx: 0, vy: 0, vz: 0,
      e: rand(0.025, 0.07),
      k: pickTint(), kk: 0,
      a: rand(0.45, 1),
      s: rand(0.8, 1.5),
      fly, green: fly && Math.random() < 0.3,
      ph: rand(Math.PI * 2),
      sx: 0, sy: 0,
    });
  }
  const dust = Array.from({ length: DUST }, () => ({ x: Math.random(), y: Math.random(), v: rand(0.00003, 0.00012), dx: rand(-0.00004, 0.00004), a: rand(0.12, 0.4), s: rand(0.6, 1.6), ph: rand(6.28) }));

  // Project fireflies (home hero only)
  const projects = (window.SITE && window.SITE.PROJECTS) || [];
  const useSparks = document.body.dataset.sparks === "1" && projects.length > 0;
  const tip = useSparks ? document.createElement("div") : null;
  if (tip) { tip.className = "spark-tip"; tip.setAttribute("aria-hidden", "true"); document.body.appendChild(tip); }
  const HERO_SHAPE = "tree";

  // ---------- Layout ----------
  const view = { cx: 0, cy: 0, S: 0, tcx: 0, tcy: 0, tS: 1, alpha: 1, talpha: 1 };
  let current = null, currentEl = null;
  function layoutFor(el) {
    const pos = (el && el.dataset.shapePos) || "right";
    const wide = current === "hills" || current === "forest" || current === "moon";
    if (small) {
      view.tcx = W * 0.5;
      view.tcy = pos === "center" ? H * 0.55 : H * 0.42;
      view.tS = Math.min(W * (wide ? 0.3 : 0.36), H * 0.26);
      view.talpha = 0.5;
    } else if (pos === "mid") {
      view.tcx = W * 0.47; view.tcy = H * 0.5; view.tS = Math.min(W * 0.16, H * 0.3); view.talpha = 0.9;
    } else if (pos === "center" || current === "hills") {
      view.tcx = W * 0.5; view.tcy = H * 0.58; view.tS = W * 0.46; view.talpha = 0.85;
    } else {
      view.tcx = W * (wide ? 0.68 : 0.71); view.tcy = H * 0.5;
      view.tS = Math.min(W * (wide ? 0.16 : 0.2), H * (wide ? 0.3 : 0.34)); view.talpha = 1;
    }
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    small = W < 900;
    DPR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    layoutFor(currentEl);
    if (!view.S) { view.cx = view.tcx; view.cy = view.tcy; view.S = view.tS; view.alpha = view.talpha; }
    if (reduce) draw(0);
  }

  let rot = 0, rotX = 0, t = 0;
  function setShape(name, el) {
    if (name === current && el === currentEl) return;
    const prev = current;
    current = SHAPES[name] ? name : "tree"; currentEl = el;
    const pts = getShape(current);
    for (let i = 0; i < N; i++) {
      const p = P[i], q = pts[i];
      p.tx = q[0]; p.ty = q[1]; p.tz = q[2]; p.kk = q[3] === undefined ? p.k : q[3];
      if (prev && !reduce) { p.vx += gauss() * 0.04; p.vy += gauss() * 0.04; p.vz += gauss() * 0.04; }
    }
    if (SHAPES[prev] && SHAPES[prev].spin && !SHAPES[current].spin) rot = Math.atan2(Math.sin(rot), Math.cos(rot));
    layoutFor(el);
    if (reduce) {
      for (const p of P) { p.x = p.tx; p.y = p.ty; p.z = p.tz; }
      view.cx = view.tcx; view.cy = view.tcy; view.S = view.tS; view.alpha = view.talpha;
      draw(0);
    }
  }

  // ---------- Pointer ----------
  let mx = 0, my = 0, smx = 0, smy = 0, px = -1e4, py = -1e4, hovered = -1;
  addEventListener("pointermove", (e) => {
    px = e.clientX; py = e.clientY;
    mx = (e.clientX / W) * 2 - 1; my = (e.clientY / H) * 2 - 1;
    if (useSparks) checkHover(e.target);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { px = py = -1e4; hide(); });

  function checkHover(target) {
    if (current !== HERO_SHAPE || small || (target && target.closest && target.closest("a,button,input,textarea,.site-header,.stats"))) return hide();
    let best = -1, bd = 24 * 24;
    for (let i = 0; i < projects.length && i < 10; i++) {
      const dx = P[i].sx - px, dy = P[i].sy - py, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) return hide();
    const lang = document.documentElement.lang.startsWith("pt") ? "pt" : "en";
    if (best !== hovered) {
      hovered = best;
      const pr = projects[best];
      tip.innerHTML = '<div class="t"></div><div class="c"></div>';
      tip.firstChild.textContent = (lang === "pt" && pr.namePt) || pr.name;
      tip.lastChild.textContent = (pr.cat[lang] || pr.cat.en) + "  ·  " + (lang === "pt" ? "clica para abrir" : "click to open");
    }
    tip.style.left = P[best].sx + "px"; tip.style.top = P[best].sy + "px";
    tip.classList.add("show");
    document.body.style.cursor = "pointer";
  }
  function hide() {
    if (hovered === -1) return;
    hovered = -1; if (tip) tip.classList.remove("show");
    document.body.style.cursor = "";
  }
  if (useSparks) {
    addEventListener("click", (e) => {
      if (hovered < 0 || (e.target.closest && e.target.closest("a,button,input,textarea"))) return;
      const pr = projects[hovered];
      location.href = (window.SITE.base || "") + pr.url;
    });
  }

  // ---------- Render ----------
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // drifting pollen
    for (const d of dust) {
      if (!reduce) { d.y -= d.v * dt; d.x += d.dx * dt; if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); } if (d.x < -0.02) d.x = 1.02; if (d.x > 1.02) d.x = -0.02; }
      const tw = 0.6 + 0.4 * Math.sin(t * 0.8 + d.ph);
      ctx.globalAlpha = d.a * tw * 0.7;
      const s = d.s * 3;
      ctx.drawImage(POLLEN, d.x * W - s / 2, d.y * H - s / 2, s, s);
    }

    const shape = SHAPES[current] || SHAPES.tree;
    const cy = Math.cos(rot), sy = Math.sin(rot), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const S = view.S, F = 3.4;
    const isWave = !!shape.wave;
    const heroFlies = useSparks && current === HERO_SHAPE;

    for (let i = 0; i < N; i++) {
      const p = P[i];
      if (!reduce) {
        let ty = p.ty;
        if (isWave) ty = 0.16 * Math.sin(p.tx * 3.1 + t * 0.6) + 0.1 * Math.cos(p.tz * 4.2 + t * 0.45) + 0.05 * Math.sin((p.tx + p.tz) * 6 + t * 0.9);
        p.vx *= 0.9; p.vy *= 0.9; p.vz *= 0.9;
        p.x += (p.tx - p.x) * p.e + p.vx;
        p.y += (ty - p.y) * p.e + p.vy;
        p.z += (p.tz - p.z) * p.e + p.vz;
      }
      let x = p.x, y = p.y, z = p.z;
      if (p.fly) {
        // fireflies wander around their spot
        const r = heroFlies && i < projects.length ? 0.06 : 0.14;
        x += Math.sin(t * 0.55 + p.ph) * r; y += Math.cos(t * 0.7 + p.ph * 2) * r * 0.8; z += Math.sin(t * 0.4 + p.ph * 3) * r;
      } else if (!isWave) {
        const b = Math.sin(t * 1.1 + p.ph) * 0.005;
        x += b + Math.sin(t * 0.8 + p.ty * 2) * 0.006 * (1 - p.ty); y += b;
      }
      let x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      let y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      if (isWave) { x1 = x; y1 = y + z * 0.3; z2 = z * 0.9; }
      const persp = F / (F + z2);
      const X = view.cx + x1 * S * persp, Y = view.cy + y1 * S * persp;
      p.sx = X; p.sy = Y;
      if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
      const depth = Math.max(0.15, Math.min(1, 0.62 - z2 * 0.32));
      const alpha = p.a * depth * view.alpha;
      if (p.fly) {
        const blink = Math.max(0, Math.sin(t * 1.3 + p.ph * 3));
        const proj = heroFlies && i < projects.length;
        const tw = proj ? 0.65 + 0.35 * blink : blink * blink;
        let s = (proj ? 17 : 12) * p.s * persp * (0.7 + tw * 0.5);
        if (proj && i === hovered) s *= 1.8;
        ctx.globalAlpha = Math.min(1, (proj ? 0.95 : alpha) * (0.25 + tw * 0.9));
        ctx.drawImage(p.green && !proj ? FIREFLY_GREEN : FIREFLY, X - s / 2, Y - s / 2, s, s);
      } else {
        const s = 6 * p.s * persp;
        ctx.globalAlpha = Math.min(1, alpha * (p.kk === BARK ? 1.25 : 1.1));
        const k = isWave ? Math.min(5, Math.max(0, Math.round((p.tz + 1) * 2.5))) : p.kk;
        ctx.drawImage(TINTS[k], X - s / 2, Y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  let last = performance.now(), running = false;
  function frame(now) {
    const dt = Math.min(64, now - last); last = now;
    t += dt / 1000;
    smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04;
    const shape = SHAPES[current] || SHAPES.tree;
    if (shape.spin) rot += dt * 0.00012 + smx * 0.0005;
    else rot += ((Math.sin(t * 0.3) * (shape.sway || 0.3) + smx * 0.25) - rot) * 0.03;
    rotX += ((shape.wave ? 0 : smy * 0.12 + (shape.spin ? 0.12 : 0)) - rotX) * 0.03;
    view.cx += (view.tcx - view.cx) * 0.05; view.cy += (view.tcy - view.cy) * 0.05;
    view.S += (view.tS - view.S) * 0.05; view.alpha += (view.talpha - view.alpha) * 0.05;
    draw(dt);
    if (running) requestAnimationFrame(frame);
  }
  function start() { if (reduce || running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // ---------- Section tracking ----------
  function pickSection() {
    const els = [...document.querySelectorAll("[data-shape]")];
    if (!els.length) return;
    const mid = H * 0.5;
    let pick = els[0];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid * 0.35) pick = el;
    }
    setShape(pick.dataset.shape, pick);
  }
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; pickSection(); });
  }, { passive: true });
  addEventListener("resize", () => { resize(); pickSection(); });

  resize(); pickSection(); start();
})();
