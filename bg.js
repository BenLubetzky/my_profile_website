/* =========================================================
   Tech particle background.
   One canvas behind the page. Elements with data-shape tell
   the particles what to assemble into while they sit in the
   middle of the viewport: a CPU chip, a circuit board, a
   database stack, a server rack, a network globe, code.
   ?still draws every shape already settled.
   ========================================================= */
(() => {
  const canvas = document.getElementById("bg");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]still\b/.test(location.search);

  let W = 0, H = 0, DPR = 1, small = false;
  const N = innerWidth < 760 ? 1000 : 2000;
  const DUST = innerWidth < 760 ? 50 : 110;

  // ---------- Colours & sprites ----------
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function sprite(rgb, r = 32, core = 0.22) {
    const c = document.createElement("canvas");
    c.width = c.height = r * 2;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(core * 0.5, `rgba(${rgb},1)`);
    gr.addColorStop(core, `rgba(${rgb},.5)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, r * 2, r * 2);
    return c;
  }
  const DEEP = [40, 78, 190], BLUE = [79, 140, 255], SKY = [150, 200, 255];
  const TINTS = [];
  for (let i = 0; i < 6; i++) TINTS.push(sprite((i < 3 ? mix(DEEP, BLUE, i / 2.5) : mix(BLUE, SKY, (i - 3) / 2)).join(",")));
  TINTS.push(sprite("52,70,128"));     // 6 dim
  TINTS.push(sprite("120,215,255"));   // 7 cyan highlight
  TINTS.push(sprite("215,232,255"));   // 8 near white
  const DIM = 6, CYAN = 7, WHITE = 8;
  const SPARK = sprite("170,210,255", 48, 0.15);
  const DUSTS = sprite("120,150,230", 16, 0.3);

  // ---------- Helpers ----------
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const tint = () => (Math.random() * 6) | 0;
  const line = (out, a, b, n, k, j = 0.006) => {
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      out.push([a[0] + (b[0] - a[0]) * t + gauss() * j, a[1] + (b[1] - a[1]) * t + gauss() * j, a[2] + (b[2] - a[2]) * t + gauss() * j, typeof k === "function" ? k() : k]);
    }
  };
  const finish = (out) => { while (out.length < N) out.push(out[(Math.random() * out.length) | 0].slice()); return out.slice(0, N); };

  // ---------- Shapes ----------
  function chip() {
    const out = [];
    const P = 0.6, D = 0.32, PIN0 = P, PIN1 = P + 0.13, pins = 11;
    // package outline + faint surface
    const corners = [[-P, -P], [P, -P], [P, P], [-P, P]];
    for (let s = 0; s < 4; s++) line(out, [...corners[s], 0], [...corners[(s + 1) % 4], 0], N * 0.025, 4);
    for (let i = 0; i < N * 0.1; i++) out.push([rand(-P, P), rand(-P, P), 0.005, DIM]);
    // raised die: dense grid + bright edge
    const g = 14;
    for (let i = 0; i < N * 0.17; i++) {
      const x = -D + (Math.round(rand(0, g)) / g) * 2 * D, y = -D + (Math.round(rand(0, g)) / g) * 2 * D;
      out.push([x + gauss() * 0.004, y + gauss() * 0.004, -0.07, Math.random() < 0.25 ? CYAN : 3 + ((Math.random() * 3) | 0)]);
    }
    const dc = [[-D, -D], [D, -D], [D, D], [-D, D]];
    for (let s = 0; s < 4; s++) line(out, [...dc[s], -0.07], [...dc[(s + 1) % 4], -0.07], N * 0.02, WHITE, 0.003);
    for (let s = 0; s < 4; s++) line(out, [...dc[s], -0.07], [...dc[s], 0], N * 0.004, 4, 0.003);
    // pins and traces leaving each side
    for (let side = 0; side < 4; side++) {
      for (let p = 0; p < pins; p++) {
        const u = -P * 0.82 + (p / (pins - 1)) * P * 1.64;
        const rot = (along, out_) => (side === 0 ? [along, -out_] : side === 1 ? [out_, along] : side === 2 ? [-along, out_] : [-out_, -along]);
        const a = rot(u, PIN0), b = rot(u, PIN1);
        line(out, [a[0], a[1], 0], [b[0], b[1], 0], N * 0.0035, 5, 0.004);
        // trace: straight out, a 45° jog away from the centre line, then straight again
        const L1 = rand(0.05, 0.22), L2 = rand(0.06, 0.24), L3 = rand(0.08, 0.32), dir = Math.abs(u) < 0.02 ? 0 : Math.sign(u);
        const p1 = rot(u, PIN1 + L1);
        const p2 = rot(u + dir * L2 * 0.7, PIN1 + L1 + L2 * 0.7);
        const p3 = rot(u + dir * L2 * 0.7, PIN1 + L1 + L2 * 0.7 + L3);
        line(out, [b[0], b[1], 0], [p1[0], p1[1], 0], N * 0.0025, 1, 0.003);
        line(out, [p1[0], p1[1], 0], [p2[0], p2[1], 0], N * 0.0025, 1, 0.003);
        line(out, [p2[0], p2[1], 0], [p3[0], p3[1], 0], N * 0.003, 0, 0.003);
        for (let v = 0; v < 6; v++) out.push([p3[0] + gauss() * 0.012, p3[1] + gauss() * 0.012, 0, CYAN]);
      }
    }
    return finish(out);
  }

  function circuit() {
    // a flat board of right-angle traces with vias; lies like a floor
    const out = [];
    const step = 0.12;
    const snap = (v) => Math.round(v / step) * step;
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071]];
    let guard = 0;
    while (out.length < N * 0.92 && guard++ < 400) {
      let x = snap(rand(-2.1, 2.1)), y = snap(rand(-1.1, 1.1));
      let d = dirs[(Math.random() * 4) | 0];
      const segs = 2 + ((Math.random() * 4) | 0);
      const k = Math.random() < 0.3 ? 4 : Math.random() < 0.5 ? 1 : 0;
      for (let s = 0; s < segs; s++) {
        const len = step * (2 + ((Math.random() * 7) | 0));
        const nx = x + d[0] * len, ny = y + d[1] * len;
        line(out, [x, y, 0], [nx, ny, 0], Math.ceil(len * 70), k, 0.003);
        x = nx; y = ny;
        d = Math.random() < 0.5 ? dirs[(Math.random() * 6) | 0] : d;
      }
      for (let v = 0; v < 10; v++) out.push([x + gauss() * 0.02, y + gauss() * 0.02, 0, CYAN]);
    }
    return finish(out);
  }

  function dbstack() {
    const out = [];
    const R = 0.8, h = 0.32, gap = 0.12;
    for (let d = 0; d < 3; d++) {
      const top = -0.7 + d * (h + gap), bot = top + h;
      for (let i = 0; i < N * 0.09; i++) { const a = rand(Math.PI * 2); out.push([Math.cos(a) * R, top, Math.sin(a) * R, d === 0 ? CYAN : 4]); }
      for (let i = 0; i < N * 0.07; i++) { const a = rand(Math.PI * 2); out.push([Math.cos(a) * R, bot, Math.sin(a) * R, 2]); }
      for (let i = 0; i < N * 0.07; i++) { const a = rand(Math.PI * 2); out.push([Math.cos(a) * R, rand(top, bot), Math.sin(a) * R, DIM]); }
      if (d === 0) for (let i = 0; i < N * 0.06; i++) { const a = rand(Math.PI * 2), r = R * Math.sqrt(Math.random()); out.push([Math.cos(a) * r, top, Math.sin(a) * r, 1]); }
    }
    return finish(out);
  }

  function server() {
    const out = [];
    const w = 0.6, d = 0.38, units = 7, H0 = -1, H1 = 1;
    const box = [[-w, -d], [w, -d], [w, d], [-w, d]];
    for (const yy of [H0, H1]) for (let s = 0; s < 4; s++) line(out, [box[s][0], yy, box[s][1]], [box[(s + 1) % 4][0], yy, box[(s + 1) % 4][1]], N * 0.012, 4);
    for (const c of box) line(out, [c[0], H0, c[1]], [c[0], H1, c[1]], N * 0.018, 3);
    for (let u = 0; u < units; u++) {
      const y0 = H0 + 0.06 + (u / units) * (H1 - H0 - 0.06);
      const y1 = y0 + (H1 - H0) / units - 0.06;
      line(out, [-w + 0.04, y0, -d], [w - 0.04, y0, -d], N * 0.012, 2, 0.003);
      line(out, [-w + 0.04, y1, -d], [w - 0.04, y1, -d], N * 0.008, DIM, 0.003);
      for (let v = 0; v < 5; v++) line(out, [-w + 0.12, y0 + 0.06 + v * 0.035, -d], [0.05, y0 + 0.06 + v * 0.035, -d], N * 0.004, DIM, 0.002);
      for (let l = 0; l < 3; l++) for (let i = 0; i < 10; i++) out.push([0.25 + l * 0.1 + gauss() * 0.01, (y0 + y1) / 2 + gauss() * 0.01, -d - 0.01, l === 0 ? CYAN : l === 1 ? WHITE : 5]);
    }
    return finish(out);
  }

  function globe() {
    const out = [];
    const R = 0.95;
    for (let m = 0; m < 10; m++) {
      const lon = (m / 10) * Math.PI;
      for (let i = 0; i < N * 0.03; i++) { const t = rand(Math.PI * 2); out.push([Math.cos(t) * Math.cos(lon) * R, Math.sin(t) * R, Math.cos(t) * Math.sin(lon) * R, 1]); }
    }
    for (let p = 1; p < 7; p++) {
      const lat = -Math.PI / 2 + (p / 7) * Math.PI, r = Math.cos(lat) * R, y = Math.sin(lat) * R;
      for (let i = 0; i < N * 0.025; i++) { const t = rand(Math.PI * 2); out.push([Math.cos(t) * r, y, Math.sin(t) * r, 0]); }
    }
    const nodes = Array.from({ length: 14 }, () => { const u = rand(-0.9, 0.9), t = rand(Math.PI * 2), s = Math.sqrt(1 - u * u); return [Math.cos(t) * s * R, u * R, Math.sin(t) * s * R]; });
    for (const n of nodes) for (let i = 0; i < 20; i++) out.push([n[0] + gauss() * 0.02, n[1] + gauss() * 0.02, n[2] + gauss() * 0.02, WHITE]);
    for (let a = 0; a < 16; a++) {
      const A = nodes[(Math.random() * nodes.length) | 0], B = nodes[(Math.random() * nodes.length) | 0];
      for (let i = 0; i < N * 0.008; i++) {
        const t = Math.random(), lift = 1 + 0.35 * Math.sin(Math.PI * t);
        const x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t, z = A[2] + (B[2] - A[2]) * t;
        const l = Math.hypot(x, y, z) || 1;
        out.push([(x / l) * R * lift, (y / l) * R * lift, (z / l) * R * lift, CYAN]);
      }
    }
    return finish(out);
  }

  function brackets() {
    const out = [];
    const strokes = [
      [[-0.55, -0.6], [-1.1, 0]], [[-1.1, 0], [-0.55, 0.6]],
      [[0.22, -0.75], [-0.22, 0.75]],
      [[0.55, -0.6], [1.1, 0]], [[1.1, 0], [0.55, 0.6]],
    ];
    for (const [a, b] of strokes) for (const zz of [-0.06, 0.06]) line(out, [a[0], a[1], zz], [b[0], b[1], zz], N * 0.07, () => (Math.random() < 0.2 ? CYAN : 2 + ((Math.random() * 4) | 0)), 0.02);
    for (let i = 0; i < N * 0.1; i++) { const u = rand(-1, 1), t = rand(Math.PI * 2), s = Math.sqrt(1 - u * u), r = rand(1.4, 1.9); out.push([Math.cos(t) * s * r, u * r * 0.7, Math.sin(t) * s * r, DIM]); }
    return finish(out);
  }

  const SHAPES = {
    chip: { make: chip, tilt: 0.82, sway: 0.4 },
    circuit: { make: circuit, tilt: 1.15, sway: 0.12 },
    stack: { make: dbstack, tilt: 0.38, spin: true },
    server: { make: server, tilt: 0.2, sway: 0.55 },
    globe: { make: globe, tilt: 0.25, spin: true },
    code: { make: brackets, tilt: 0.1, sway: 0.4 },
  };
  const cache = {};
  function getShape(name) {
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
    P.push({
      x: gauss() * 3, y: gauss() * 3, z: gauss() * 3,
      tx: 0, ty: 0, tz: 0, vx: 0, vy: 0, vz: 0, kk: 0,
      e: rand(0.03, 0.075), a: rand(0.5, 1), s: rand(0.8, 1.4),
      spark: Math.random() < 0.03, ph: rand(Math.PI * 2),
    });
  }
  const dust = Array.from({ length: DUST }, () => ({ x: Math.random(), y: Math.random(), v: rand(0.00002, 0.0001), a: rand(0.1, 0.35), s: rand(0.6, 1.5), ph: rand(6.28) }));

  // ---------- Layout ----------
  const view = { cx: 0, cy: 0, S: 0, tcx: 0, tcy: 0, tS: 1, alpha: 1, talpha: 1 };
  let current = null, currentEl = null;
  function layoutFor(el) {
    const pos = (el && el.dataset.shapePos) || "right";
    if (pos === "hidden") { view.talpha = 0; return; }
    if (small) {
      view.tcx = W * 0.5; view.tcy = pos === "center" ? H * 0.55 : H * 0.4;
      view.tS = Math.min(W * 0.34, H * 0.24); view.talpha = 0.45;
    } else if (pos === "center") {
      view.tcx = W * 0.5; view.tcy = H * 0.62; view.tS = W * 0.3; view.talpha = 0.5;
    } else {
      view.tcx = W * 0.74; view.tcy = H * 0.52; view.tS = Math.min(W * 0.18, H * 0.34); view.talpha = 1;
    }
  }

  function resize() {
    W = innerWidth; H = innerHeight; small = W < 900;
    DPR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    layoutFor(currentEl);
    if (!view.S) { view.cx = view.tcx; view.cy = view.tcy; view.S = view.tS; view.alpha = view.talpha; }
    if (reduce) draw(0);
  }

  let rot = 0, rotX = 0, t = 0;
  function setShape(name, el) {
    if (!SHAPES[name]) name = "chip";
    if (name === current && el === currentEl) return;
    const prev = current;
    current = name; currentEl = el;
    const pts = getShape(name);
    for (let i = 0; i < N; i++) {
      const p = P[i], q = pts[i];
      p.tx = q[0]; p.ty = q[1]; p.tz = q[2]; p.kk = q[3];
      if (prev && !reduce) { p.vx += gauss() * 0.04; p.vy += gauss() * 0.04; p.vz += gauss() * 0.04; }
    }
    if (SHAPES[prev] && SHAPES[prev].spin && !SHAPES[name].spin) rot = Math.atan2(Math.sin(rot), Math.cos(rot));
    layoutFor(el);
    if (reduce) {
      for (const p of P) { p.x = p.tx; p.y = p.ty; p.z = p.tz; }
      view.cx = view.tcx; view.cy = view.tcy; view.S = view.tS; view.alpha = view.talpha;
      rotX = SHAPES[name].tilt || 0; rot = SHAPES[name].spin ? 0.5 : 0.25;
      draw(0);
    }
  }

  // ---------- Pointer ----------
  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener("pointermove", (e) => { mx = (e.clientX / W) * 2 - 1; my = (e.clientY / H) * 2 - 1; }, { passive: true });

  // ---------- Render ----------
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    for (const d of dust) {
      if (!reduce) { d.y -= d.v * dt; if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); } }
      ctx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin(t * 0.8 + d.ph));
      const s = d.s * 3;
      ctx.drawImage(DUSTS, d.x * W - s / 2, d.y * H - s / 2, s, s);
    }

    const shape = SHAPES[current] || SHAPES.chip;
    const cy = Math.cos(rot), sy = Math.sin(rot), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const S = view.S, F = 3.4;

    for (let i = 0; i < N; i++) {
      const p = P[i];
      if (!reduce) {
        p.vx *= 0.9; p.vy *= 0.9; p.vz *= 0.9;
        p.x += (p.tx - p.x) * p.e + p.vx;
        p.y += (p.ty - p.y) * p.e + p.vy;
        p.z += (p.tz - p.z) * p.e + p.vz;
      }
      const b = Math.sin(t * 1.1 + p.ph) * 0.004;
      const x = p.x + b, y = p.y + b, z = p.z;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const persp = F / (F + z2);
      const X = view.cx + x1 * S * persp, Y = view.cy + y1 * S * persp;
      if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
      const depth = Math.max(0.15, Math.min(1, 0.65 - z2 * 0.3));
      const alpha = p.a * depth * view.alpha;
      if (p.spark) {
        const tw = Math.max(0, Math.sin(t * 1.6 + p.ph * 3));
        const s = 11 * p.s * persp * (0.6 + tw * 0.6);
        ctx.globalAlpha = Math.min(1, alpha * (0.2 + tw * tw));
        ctx.drawImage(SPARK, X - s / 2, Y - s / 2, s, s);
      } else {
        const s = 5.5 * p.s * persp;
        ctx.globalAlpha = Math.min(1, alpha * (p.kk === DIM ? 0.8 : 1.05));
        ctx.drawImage(TINTS[p.kk], X - s / 2, Y - s / 2, s, s);
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
    const shape = SHAPES[current] || SHAPES.chip;
    if (shape.spin) rot += dt * 0.00014 + smx * 0.0004;
    else rot += ((Math.sin(t * 0.25) * (shape.sway || 0.3) + smx * 0.2) - rot) * 0.03;
    rotX += (((shape.tilt || 0) + smy * 0.1) - rotX) * 0.03;
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
