import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import { Figure, figureDefs, P, blend, walk, run as runGait, wave, lerp, clamp, NS } from './figure.js';
import * as PR from './props.js';
import { initUI, setCount, splitWords, hud } from './ui.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const RM = document.documentElement.classList.contains('rm');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const E = {
  io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  o: (t) => 1 - Math.pow(1 - t, 3),
  i: (t) => t * t,
  s: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
};
const seg = (t, a, b) => clamp((t - a) / (b - a));
const STRIDE = 128; // figure units per full gait cycle

function seq(t, phases) {
  let start = 0;
  for (let k = 0; k < phases.length; k++) {
    const [end, fn] = phases[k];
    if (t <= end || k === phases.length - 1) return fn(clamp((t - start) / Math.max(1e-6, end - start)));
    start = end;
  }
}

// ------------------------------------------------------------------ geometry
let G = {};
function geom() {
  const W = document.documentElement.clientWidth, H = window.innerHeight;
  const mob = W < 760;
  const FH = mob ? clamp(H * 0.2, 124, 176) : clamp(H * 0.29, 168, 318);
  const gap = mob ? clamp(H * 0.055, 28, 50) : clamp(H * 0.07, 38, 80);
  const Wc = Math.min(W, 1600), L = (W - Wc) / 2;
  return { W, H, mob, FH, s: FH / 300, gap, FY: H - gap, Wc, L, lane: mob ? 12 : 18,
    xin: L + Wc * (mob ? 0.1 : 0.05), xout: L + Wc * (mob ? 0.9 : 0.95), cx: L + Wc * 0.5,
    X: (f) => L + Wc * f };
}

// ------------------------------------------------------------------ world svg
const svg = $('#world');
const bdCam = $('#bdCam');
let defs, camG, laneBase, laneEdge, laneTrail, laneMask, rampMasks = [], backL, figL, frontL, fig;
const sections = $$('.ch');
let C = []; // chapter runtime records

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function setupSVG() {
  svg.innerHTML = '';
  defs = el('defs', {}, svg);
  figureDefs(defs, G.mob ? -2.2 : -2.8, G.mob ? 1.4 : 1.8);
  PR.propDefs(defs);
  defs.insertAdjacentHTML('beforeend', `
    <clipPath id="doorClip"><rect x="-62" y="-360" width="124" height="360"/></clipPath>
    <filter id="trailGlow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="logoClip"><circle class="lc" cx="0" cy="0" r="0"/></clipPath>`);
  camG = el('g', { id: 'cam' }, svg);
  // ramps only show while they're in use: floors are always unmasked, each ramp has its own fader
  const N = sections.length;
  laneMask = el('mask', { id: 'laneMask', maskUnits: 'userSpaceOnUse', x: -G.W * 4, y: -G.H, width: G.W * 14, height: G.H * (N + 2) }, defs);
  rampMasks = [];
  for (let i = 0; i < N; i++) {
    el('rect', { x: -G.W * 4, y: i * G.H + G.FY - 34, width: G.W * 14, height: 68, fill: '#fff' }, laneMask);
    if (i < N - 1) rampMasks.push(el('rect', { x: -G.W * 4, y: i * G.H + G.FY - 34, width: G.W * 14, height: G.H + 68, fill: '#fff', opacity: 0 }, laneMask));
  }
  const laneG = el('g', { class: 'lane', mask: 'url(#laneMask)' }, camG);
  laneBase = el('path', { class: 'lane-base', fill: 'none', stroke: '#121213', 'stroke-width': G.lane, 'stroke-linejoin': 'round' }, laneG);
  laneEdge = el('path', { class: 'lane-edge', fill: 'none', stroke: '#3a3a3c', 'stroke-width': 1.2, transform: `translate(0 ${-G.lane / 2})` }, laneG);
  laneTrail = el('path', { class: 'lane-trail', fill: 'none', stroke: '#E82226', 'stroke-width': G.mob ? 2 : 2.6, 'stroke-linecap': 'round', filter: G.mob ? '' : 'url(#trailGlow)' }, laneG);
  backL = el('g', { class: 'back' }, camG);
  figL = el('g', { class: 'figl' }, camG);
  frontL = el('g', { class: 'front' }, camG);
  fig = new Figure(figL, { filter: true });
}

// place a prop (figure units) at world x / floor y
let CUR = null;
function place(prop, x, y, layerBack = CUR.back, layerFront = CUR.front, s = G.s) {
  const tb = el('g', {}, layerBack), tf = el('g', {}, layerFront);
  tb.appendChild(prop.back); tf.appendChild(prop.front);
  const o = { prop, tb, tf, x, y, s, q: prop.q,
    move(nx, ny = o.y) { o.x = nx; o.y = ny; const t = `translate(${nx.toFixed(2)} ${ny.toFixed(2)}) scale(${o.s.toFixed(4)})`; tb.setAttribute('transform', t); tf.setAttribute('transform', t); },
    // world -> prop-local units
    local(pt) { return [(pt[0] - o.x) / o.s, (pt[1] - o.y) / o.s]; },
    show(v) { tb.style.display = tf.style.display = v ? '' : 'none'; } };
  o.move(x, y);
  return o;
}

// ------------------------------------------------------------------ lane path (one SVG path through the whole story)
let LANE = { segs: [], total: 0 };
function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
}
function buildLane() {
  const segs = [];
  let d = '', len = 0;
  const N = C.length;
  for (let i = 0; i < N; i++) {
    const c = C[i];
    const y = i * G.H + G.FY;
    const x0 = c.xin, x1 = c.xout;
    if (i === 0) d += `M${x0.toFixed(1)},${y.toFixed(1)}`;
    d += ` L${x1.toFixed(1)},${y.toFixed(1)}`;
    c.F = len;
    segs.push({ type: 'floor', i, x0, x1, y, L0: len, len: x1 - x0 });
    len += x1 - x0;
    if (i < N - 1) {
      const n = C[i + 1];
      const p0 = [x1, y], p3 = [n.xin, y + G.H];
      const dx = p0[0] - p3[0];
      const p1 = [p0[0] - dx * 0.42, y], p2 = [p3[0] + dx * 0.42, y + G.H];
      d += ` C${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} ${p3[0].toFixed(1)},${p3[1].toFixed(1)}`;
      // arc-length + y lookup (y is monotonic along the ramp)
      const M = 160, pts = [], lens = [0];
      let prev = p0, acc = 0;
      for (let k = 0; k <= M; k++) {
        const p = bez(p0, p1, p2, p3, k / M);
        if (k) { acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); lens.push(acc); }
        pts.push(p); prev = p;
      }
      segs.push({ type: 'ramp', i, pts, lens, L0: len, len: acc, y0: y, y1: y + G.H });
      len += acc;
    }
  }
  LANE = { segs, total: len, d };
  laneBase.setAttribute('d', d);
  laneEdge.setAttribute('d', d);
  laneTrail.setAttribute('d', d);
  laneTrail.style.strokeDasharray = `${len} ${len + 10}`;
  // GSAP's MotionPathPlugin measures the same path; the intro walk-in rides it.
  LANE.raw = MotionPathPlugin.cacheRawPathMeasurements(MotionPathPlugin.stringToRawPath(d));
}
// position on a ramp from story-y
function rampAtY(sg, y) {
  const pts = sg.pts;
  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m][1] < y) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi];
  const f = b[1] === a[1] ? 0 : clamp((y - a[1]) / (b[1] - a[1]));
  const x = lerp(a[0], b[0], f), l = lerp(sg.lens[lo], sg.lens[hi], f);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return { x, y, len: sg.L0 + l, ang };
}

// ------------------------------------------------------------------ backdrop panels (story space, under the world)
function panel(i, cls, html = '') {
  const d = document.createElement('div');
  d.className = 'bd-panel ' + cls;
  d.style.top = i * G.H + 'px';
  d.style.height = G.H + 'px';
  d.innerHTML = html;
  bdCam.appendChild(d);
  return d;
}
function hexCeiling(W, H, fobX) {
  // honeycomb of LED tubes across the hero ceiling (original drawing, echoes their real ceiling)
  const r = G.mob ? 26 : 38, hw = Math.sqrt(3) * r;
  const rows = Math.ceil((H * 0.5) / (1.5 * r)) + 1, cols = Math.ceil(W / hw) + 2;
  let cells = '';
  for (let rI = 0; rI < rows; rI++) for (let cI = -1; cI < cols; cI++) {
    const cx = cI * hw + (rI % 2 ? hw / 2 : 0), cy = rI * 1.5 * r + r * 0.4;
    if (rI > 1 && ((cI * 7 + rI * 3) % 5 === 0)) continue; // breaks in the grid, like the real fixture
    const k = r * 0.86;
    let p = '';
    for (let a = 0; a < 6; a++) { const t = (Math.PI / 3) * a + Math.PI / 6; p += (a ? 'L' : 'M') + (cx + k * Math.cos(t)).toFixed(1) + ',' + (cy + k * Math.sin(t)).toFixed(1); }
    const dist = Math.hypot(cx - fobX, cy - H * 0.2) / W;
    cells += `<path d="${p}Z" data-d="${dist.toFixed(3)}"/>`;
  }
  return `<svg class="hex" width="${W}" height="${H * 0.62}" viewBox="0 0 ${W} ${H * 0.62}" aria-hidden="true"><g class="hex-glow">${cells}</g><g class="hex-core">${cells}</g></svg>`;
}

// ------------------------------------------------------------------ chapters
// each: build(i) -> places props; fig(t) -> {x, pose, k, dy, fx, tee, op}; props(t); html(t); st(t) station; reps(t)
const heroPhoto = $('.hero-photo');
const INTRO = { dx: 0, done: false };

const CH = [
  // 0 · HERO: tap the fob, lights power up, walk through the door
  {
    k: [0, 0],
    build(c) {
      c.xin = -G.FH * 0.7;
      c.door = place(PR.door(), G.X(G.mob ? 0.62 : 0.7), c.fy);
      c.fobSpot = c.door.x - 192 * G.s;
      c.p = panel(c.i, 'bd-hero', `${hexCeiling(G.W, G.H, c.fobSpot)}<div class="bd-vign"></div>`);
      c.cells = $$('.hex-core path', c.p);
      c.glow = $$('.hex-glow path', c.p);
      c.cells.forEach((n, j) => { n._d = +n.dataset.d; });
      c.led = c.door.q('.d-led'); c.ledG = c.door.q('.d-ledglow'); c.slide = c.door.q('.d-slide');
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      if (INTRO.dx < -0.5 && t < 0.02) {
        const x = c.fobSpot + INTRO.dx;
        return { x, pose: walk(ph(x), clamp(-INTRO.dx / (G.FH * 0.6), 0.15, 1)) };
      }
      return seq(t, [
        [0.06, () => ({ x: c.fobSpot, pose: P.idle })],
        [0.18, (u) => ({ x: c.fobSpot, pose: blend(P.idle, P.fob, E.io(u)) })],
        [0.34, () => ({ x: c.fobSpot, pose: P.fob })],
        [0.42, (u) => ({ x: c.fobSpot, pose: blend(P.fob, P.stand, E.io(u)) })],
        [1, (u) => { const x = lerp(c.fobSpot, c.xout, E.i(u)); return { x, pose: walk(ph(x), clamp(u * 3)) }; }],
      ]);
    },
    props(t, c) {
      const on = seg(t, 0.16, 0.2);
      c.led.setAttribute('fill', on > 0.5 ? '#F7F7F7' : '#E82226');
      c.ledG.setAttribute('fill', on > 0.5 ? '#F7F7F7' : '#E82226');
      c.ledG.setAttribute('opacity', (0.22 + 0.5 * on).toFixed(2));
      const open = seg(t, 0.34, 0.5) - seg(t, 0.82, 0.96);
      c.slide.setAttribute('transform', `translate(${(E.io(clamp(open)) * 118).toFixed(1)} 0)`);
      // lights: cells switch on by distance from the reader, with a flicker
      const L = seg(t, 0.18, 0.46);
      const lit = L * 1.25;
      if (c._L !== L) {
        c._L = L;
        for (let j = 0; j < c.cells.length; j++) {
          const d = c.cells[j]._d;
          let v = clamp((lit - d) * 6);
          if (v > 0 && v < 1) v = v * (0.6 + 0.4 * Math.sin(j * 12.9 + L * 80) ** 2);
          const o = 0.07 + 0.93 * v;
          c.cells[j].style.opacity = o.toFixed(3);
          c.glow[j].style.opacity = (v * 0.85).toFixed(3);
        }
        c.p.style.setProperty('--lit', L.toFixed(3));
        c.sec.style.setProperty('--lit', L.toFixed(3));
      }
    },
    html(t) { $('#ch-hero').style.setProperty('--t', t.toFixed(3)); },
    st: () => 'Front Door', reps: () => 0,
  },

  // 1 · MISSION: walk onto an empty floor, warm up, 500-member cap counts
  {
    k: [0.02, 0.08],
    build(c) {
      c.p = panel(c.i, 'bd-mission', `<img src="assets/img/floor-racks.webp" alt="" loading="lazy" decoding="async">`);
      const sc = G.s * 0.62, y = c.fy - 14 * G.s;
      c.bgs = [];
      const pos = G.mob ? [0.32, 0.78] : [0.5, 0.66, 0.84];
      const mk = [PR.chestPress, PR.pulldown, PR.treadmill];
      pos.forEach((f, j) => { const o = place(mk[j](), G.X(f), y, c.bgBack, c.bgBack, sc); o.tb.classList.add('dim'); o.tf.classList.add('dim'); c.bgs.push(o); });
      c.words = splitWords($('#ch-mission .words'));
      c.counts = $$('#ch-mission .count');
      c.big = $('#ch-mission .bignum');
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const mid = G.X(G.mob ? 0.5 : 0.36);
      return seq(t, [
        [0.3, (u) => { const x = lerp(c.xin, mid, E.o(u)); return { x, pose: walk(ph(x), 1 - E.i(u)) }; }],
        [0.4, (u) => ({ x: mid, pose: blend(P.stand, P.stretch, E.io(u)) })],
        [0.56, (u) => { const q = Object.assign({}, P.stretch); q.torso = -3 - 5 * Math.sin(u * Math.PI * 2); q.sN = 174 - 8 * Math.sin(u * Math.PI * 2); q.sF = 170 + 8 * Math.sin(u * Math.PI * 2); return { x: mid, pose: q }; }],
        [0.64, (u) => ({ x: mid, pose: blend(P.stretch, P.stand, E.io(u)) })],
        [1, (u) => { const x = lerp(mid, c.xout, E.i(u)); return { x, pose: blend(walk(ph(x), clamp(u * 3)), runGait(ph(x) * 0.8, 0.8), seg(u, 0.4, 0.8)) }; }],
      ]);
    },
    props() {},
    html(t, c) {
      const n = c.words.length;
      const r = seg(t, 0.02, 0.55) * (n + 6);
      for (let j = 0; j < n; j++) c.words[j].style.opacity = (0.16 + 0.84 * clamp(r - j)).toFixed(2);
      const v = Math.round(500 * E.o(seg(t, 0.25, 0.7)));
      c.counts.forEach((n2) => setCount(n2, v));
      c.big.style.setProperty('--p', seg(t, 0.25, 0.7).toFixed(3));
    },
    st: (t) => (t < 0.32 ? 'Gym Floor' : t < 0.66 ? 'Warm-up' : 'Gym Floor'), reps: () => 0,
  },

  // 2 · FACILITIES: treadmill → pin-stack pulldown → plate-loaded press → free weights
  {
    k: [0.1, 0.4],
    build(c) {
      c.p = panel(c.i, 'bd-fac', `<img src="assets/img/floor-wide.webp" alt="" loading="lazy" decoding="async">`);
      const gapM = G.W * 0.78;
      c.SX = G.mob ? [0, 1, 2, 3].map((j) => G.W * 0.5 + j * gapM) : [0.17, 0.39, 0.62, 0.84].map(G.X);
      if (G.mob) c.xout = c.SX[3] + G.W * 0.4;
      c.tm = place(PR.treadmill(), c.SX[0], c.fy);
      c.pd = place(PR.pulldown(), c.SX[1] - 20 * G.s, c.fy);
      c.cp = place(PR.chestPress(), c.SX[2] - 20 * G.s, c.fy);
      c.rk = place(PR.dbRack(), c.SX[3] + 20 * G.s, c.fy);
      // second (far-hand) dumbbell lives behind the member
      c.dbF = el('g', { class: 'db-F' }, c.rk.tb); c.dbF.innerHTML = PR.dumbbellSVG();
      c.marks = $$('#ch-fac mark');
      c.mq = $('#ch-fac .mq-track');
    },
    seatX(c, j) { return (j === 1 ? c.pd.x : c.cp.x); },
    fig(t, c) {
      const s = G.s, ph = (x) => (c.F + x - c.xin) / (STRIDE * s);
      const tmX = c.SX[0] - 20 * s, pdX = c.pd.x, cpX = c.cp.x + 2 * s, rkX = c.SX[3] - 6 * s;
      const W2 = (x0, x1, u, a0 = 0, a1 = 0) => { const e = a0 && a1 ? u : a0 ? E.o(u) : a1 ? E.i(u) : E.s(u); const x = lerp(x0, x1, e); return { x, pose: walk(ph(x), Math.max(a0 * (1 - u), a1 * u, Math.sin(Math.PI * u) ** 0.6)) }; };
      const sitIn = (x, target, u) => ({ x, pose: blend(P.stand, target, E.io(u)) });
      return seq(t, [
        [0.05, (u) => W2(c.xin, tmX, u, 1, 0)],
        [0.065, (u) => ({ x: tmX, dy: -22 * E.io(u), pose: blend(P.stand, runGait(0, 0.4), u) })],
        [0.2, (u) => ({ x: tmX, dy: -22, pose: runGait(u * 9, lerp(0.5, 1, Math.sin(Math.PI * u) ** 0.4)), run: u })],
        [0.215, (u) => ({ x: tmX, dy: -22 * (1 - E.io(u)), pose: blend(runGait(9, 0.5), P.stand, u) })],
        [0.255, (u) => W2(tmX, pdX, u)],
        [0.28, (u) => sitIn(pdX, P.sit, u)],
        [0.295, (u) => ({ x: pdX, pose: blend(P.sit, P.pullUp, E.io(u)) })],
        [0.43, (u) => ({ x: pdX, pose: blend(P.pullUp, P.pullDown, wave(u * 4)), reps: u * 4 })],
        [0.455, (u) => ({ x: pdX, pose: blend(P.pullUp, P.stand, E.io(u)), reps: 4 })],
        [0.49, (u) => W2(pdX, cpX, u)],
        [0.515, (u) => ({ x: cpX, pose: blend(P.stand, P.pressIn, E.io(u)) })],
        [0.645, (u) => ({ x: cpX, pose: blend(P.pressIn, P.pressOut, wave(u * 4)), reps: u * 4 })],
        [0.67, (u) => ({ x: cpX, pose: blend(P.pressIn, P.stand, E.io(u)), reps: 4 })],
        [0.7, (u) => W2(cpX, rkX, u)],
        [0.72, (u) => ({ x: rkX, pose: blend(P.stand, P.reach, E.io(u)) })],
        [0.745, (u) => ({ x: rkX, pose: blend(P.reach, P.ohpDown, E.io(u)), db: 1 })],
        [0.875, (u) => ({ x: rkX, pose: blend(P.ohpDown, P.ohpUp, wave(u * 4)), db: 1, reps: u * 4 })],
        [0.9, (u) => ({ x: rkX, pose: blend(P.ohpDown, P.reach, E.io(u)), db: u < 0.85 ? 1 : 0, reps: 4 })],
        [0.92, (u) => ({ x: rkX, pose: blend(P.reach, P.stand, E.io(u)), reps: 4 })],
        [1, (u) => W2(rkX, c.xout, u, 0, 1)],
      ]);
    },
    props(t, c, st) {
      // treadmill belt + readout
      const runU = st && st.run != null ? st.run : (t > 0.2 ? 1 : 0);
      c.tm.q('.tm-belt').style.strokeDashoffset = (-runU * 900).toFixed(1);
      const secs = Math.round(runU * 720);
      c.tm.q('.tm-read').textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      const J = st && st.J;
      const inPd = t > 0.28 && t < 0.455, inCp = t > 0.5 && t < 0.67;
      // pulldown bar follows the near hand
      const pd = c.pd, barTop = [-14 + 22, -262];
      let bar = barTop;
      if (J && inPd) bar = pd.local(fig.world(J.handN));
      pd.q('.pd-bar').setAttribute('transform', `translate(${bar[0].toFixed(1)} ${bar[1].toFixed(1)})`);
      pd.q('.pd-cable').setAttribute('d', `M-14,-318 L${bar[0].toFixed(1)},${(bar[1] - 10).toFixed(1)}`);
      const lift = clamp((bar[1] - barTop[1]) * 0.9, 0, 120);
      pd.q('.pd-top').setAttribute('transform', `translate(0 ${(-lift).toFixed(1)})`);
      pd.q('.pd-cable2').setAttribute('d', `M132,-318 L132,${(-212 - lift).toFixed(1)}`);
      // chest press lever follows the near hand
      const cp = c.cp, piv = [-51, -292];
      let hN = [44, -150], hF = [40, -154];
      if (J && inCp) { hN = cp.local(fig.world(J.handN)); hF = cp.local(fig.world(J.handF)); }
      const lever = (h) => `M${piv[0]},${piv[1]} Q${(piv[0] + h[0]) / 2 + 30},${piv[1] - 18} ${h[0].toFixed(1)},${h[1].toFixed(1)}`;
      $$('.cp-lever', cp.tf)[0].setAttribute('d', lever(hN));
      $$('.cp-lever', cp.tb)[0].setAttribute('d', lever(hF));
      cp.q('.cp-grip').setAttribute('transform', `translate(${hN[0].toFixed(1)} ${hN[1].toFixed(1)})`);
      const pl = (h, dy) => `translate(${lerp(piv[0], h[0], 0.66).toFixed(1)} ${(lerp(piv[1], h[1], 0.66) - dy).toFixed(1)})`;
      cp.q('.cp-plN').setAttribute('transform', pl(hN, 26));
      cp.q('.cp-plF').setAttribute('transform', pl(hF, 30));
      // dumbbells
      const hold = st && st.db && J;
      c.rk.q('.db-pair').style.display = hold ? 'none' : '';
      const dN = c.rk.q('.db-N');
      dN.style.display = hold ? '' : 'none'; c.dbF.style.display = hold ? '' : 'none';
      if (hold) {
        const a = c.rk.local(fig.world(J.handN)), b = c.rk.local(fig.world(J.handF));
        dN.setAttribute('transform', `translate(${a[0].toFixed(1)} ${a[1].toFixed(1)}) rotate(90)`);
        c.dbF.setAttribute('transform', `translate(${b[0].toFixed(1)} ${b[1].toFixed(1)}) rotate(90)`);
      }
    },
    html(t, c) {
      const idx = t < 0.03 ? -1 : t < 0.235 ? 0 : t < 0.475 ? 1 : t < 0.69 ? 2 : t < 0.93 ? 3 : -1;
      c.marks.forEach((m) => m.classList.toggle('on', +m.dataset.i === idx));
      if (c.mq) c.mq.style.transform = `translate3d(${(-t * 50).toFixed(2)}%,0,0)`;
    },
    st: (t) => (t < 0.235 ? 'Cardio Machines' : t < 0.475 ? 'Pin-Stack' : t < 0.69 ? 'Plate Loaded' : 'Free Weights'),
  },

  // 3 · TRAINING: sit, open the HardWorx App, log the session
  {
    k: [0.42, 0.46],
    build(c) {
      c.p = panel(c.i, 'bd-train');
      c.bx = G.X(G.mob ? 0.62 : 0.62);
      c.bench = place(PR.bench(), c.bx, c.fy);
      c.phone = $('#ch-train .phone');
      c.log = $('#ch-train .ph-log');
      const rows = [['Cardio Machines', '12:00'], ['Pin-Stack', '4 reps'], ['Plate Loaded', '4 reps'], ['Free Weights', '4 reps']];
      c.log.innerHTML = rows.map(([a, b]) => `<li><span>${a}</span><b>${b}</b><i></i></li>`).join('');
      c.rows = $$('li', c.log);
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const sx = c.bx - 6 * G.s;
      return seq(t, [
        [0.16, (u) => { const x = lerp(c.xin, sx, E.o(u)); return { x, pose: walk(ph(x), 1 - E.i(u)) }; }],
        [0.22, (u) => ({ x: sx, pose: blend(P.stand, P.sit, E.io(u)) })],
        [0.3, (u) => ({ x: sx, pose: blend(P.sit, P.phone, E.io(u)), phone: u })],
        [0.84, () => ({ x: sx, pose: P.phone, phone: 1 })],
        [0.9, (u) => ({ x: sx, pose: blend(P.phone, P.stand, E.io(u)), phone: 1 - u })],
        [1, (u) => { const x = lerp(sx, c.xout, E.i(u)); return { x, pose: walk(ph(x), clamp(u * 3)) }; }],
      ]);
    },
    props(t, c, st) {
      const ph = c.bench.q('.ph');
      const on = st && st.phone > 0.4 && st.J;
      ph.style.display = on ? '' : 'none';
      if (on) {
        const h = c.bench.local(fig.world(st.J.handN));
        ph.setAttribute('transform', `translate(${(h[0] + 3).toFixed(1)} ${(h[1] - 6).toFixed(1)}) rotate(-24)`);
      }
    },
    html(t, c, st) {
      const v = seg(t, 0.26, 0.34) - seg(t, 0.86, 0.92);
      c.phone.style.setProperty('--v', clamp(v).toFixed(3));
      c.rows.forEach((r, j) => r.classList.toggle('on', t > 0.36 + j * 0.11));
      if (st && st.J && v > 0) {
        const h = fig.world(st.J.handN);
        c.phone.style.setProperty('--hx', (h[0] - C[3].camX) + 'px');
        c.phone.style.setProperty('--hy', (h[1] - CAM.y) + 'px');
      }
    },
    st: (t) => (t < 0.22 ? 'HardWorx App' : 'HardWorx App'), reps: () => 0,
  },

  // 4 · RECOVERY: infrared sauna, then cold plunge
  {
    k: [0.46, 0.5],
    build(c) {
      c.p = panel(c.i, 'bd-rec', `<div class="heat"></div>`);
      c.SX = G.mob ? [G.W * 0.5, G.W * 1.28] : [0.56, 0.83].map(G.X);
      if (G.mob) c.xout = c.SX[1] + G.W * 0.4;
      c.sa = place(PR.sauna(), c.SX[0], c.fy);
      c.pl = place(PR.plunge(), c.SX[1], c.fy);
      c.marks = $$('#ch-rec mark');
      c.steam = $$('.st', c.pl.tf);
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const a = c.SX[0] + 4 * G.s, b = c.SX[1] - 4 * G.s;
      const W2 = (x0, x1, u, a0 = 0, a1 = 0) => { const e = a0 ? E.o(u) : a1 ? E.i(u) : E.s(u); const x = lerp(x0, x1, e); return { x, pose: walk(ph(x), Math.max(a0 * (1 - u), a1 * u, Math.sin(Math.PI * u) ** 0.6)) }; };
      return seq(t, [
        [0.14, (u) => W2(c.xin, a, u, 1, 0)],
        [0.2, (u) => ({ x: a, pose: blend(P.stand, P.sauna, E.io(u)) })],
        [0.48, (u) => { const q = Object.assign({}, P.sauna); q.torso = P.sauna.torso - 2 * Math.sin(u * 12); return { x: a, pose: q }; }],
        [0.54, (u) => ({ x: a, pose: blend(P.sauna, P.stand, E.io(u)) })],
        [0.64, (u) => W2(a, b, u)],
        [0.7, (u) => ({ x: b, dy: 82 * E.io(u), pose: blend(P.stand, P.plunge, E.io(u)) })],
        [0.86, (u) => { const q = Object.assign({}, P.plunge); q.torso += 2 * Math.sin(u * 40); return { x: b, dy: 82, pose: q }; }],
        [0.91, (u) => ({ x: b, dy: 82 * (1 - E.io(u)), pose: blend(P.plunge, P.stand, E.io(u)) })],
        [1, (u) => W2(b, c.xout, u, 0, 1)],
      ]);
    },
    props(t, c, st) {
      const heat = seg(t, 0.16, 0.34) - seg(t, 0.52, 0.62);
      c.sa.q('.sa-heat').setAttribute('opacity', clamp(heat).toFixed(3));
      c.sa.q('.sa-panels').setAttribute('opacity', (1 + 2.6 * clamp(heat)).toFixed(2));
      c.sa.q('.sa-sign').setAttribute('opacity', (0.4 + 0.6 * clamp(heat)).toFixed(2));
      c.p.style.setProperty('--heat', clamp(heat).toFixed(3));
      const frost = seg(t, 0.68, 0.84);
      c.pl.q('.pl-frost').setAttribute('opacity', frost.toFixed(3));
      const now = performance.now() / 1000;
      const steamOn = seg(t, 0.66, 0.72) - seg(t, 0.9, 0.98);
      c.steam.forEach((n, j) => {
        const ph = (now * 0.35 + j / 7) % 1;
        n.setAttribute('transform', `translate(${(Math.sin(now + j) * 6).toFixed(1)} ${(-ph * 70).toFixed(1)}) scale(${(0.8 + ph * 0.8).toFixed(2)})`);
        n.setAttribute('opacity', (steamOn * Math.sin(Math.PI * ph) * 0.9).toFixed(3));
      });
    },
    html(t, c) {
      const idx = t < 0.06 ? -1 : t < 0.5 ? 0 : t < 0.62 ? 1 : 2;
      c.marks.forEach((m) => m.classList.toggle('on', +m.dataset.i === idx));
    },
    st: (t) => (t < 0.5 ? 'Infrared Saunas' : t < 0.62 ? 'Two Tanning Salons' : 'Cold Plunge'), reps: () => 0,
  },

  // 5 · UPDATES: grab the merch tee, squat at the new legs section
  {
    k: [0.5, 0.62],
    build(c) {
      c.p = panel(c.i, 'bd-up');
      c.SX = G.mob ? [G.W * 0.5, G.W * 1.28] : [0.5, 0.78].map(G.X);
      if (G.mob) c.xout = c.SX[1] + G.W * 0.4;
      c.mr = place(PR.merchRack(), c.SX[0] + 26 * G.s, c.fy);
      c.sr = place(PR.squatRack(), c.SX[1], c.fy);
      c.cards = $$('#ch-up .ucard');
      c.track = $('#ch-up .cards3');
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const a = c.SX[0] - 28 * G.s, b = c.SX[1] - 4 * G.s;
      const W2 = (x0, x1, u, a0 = 0, a1 = 0) => { const e = a0 ? E.o(u) : a1 ? E.i(u) : E.s(u); const x = lerp(x0, x1, e); return { x, pose: walk(ph(x), Math.max(a0 * (1 - u), a1 * u, Math.sin(Math.PI * u) ** 0.6)) }; };
      return seq(t, [
        [0.16, (u) => W2(c.xin, a, u, 1, 0)],
        [0.22, (u) => ({ x: a, pose: blend(P.stand, P.reach, E.io(u)) })],
        [0.3, (u) => ({ x: a, pose: blend(P.reach, P.stand, E.io(u)), tee: 1, flash: 1 - u })],
        [0.44, (u) => ({ ...W2(a, b, u), tee: 1 })],
        [0.48, (u) => ({ x: b, pose: blend(P.stand, P.squatTop, E.io(u)), tee: 1 })],
        [0.8, (u) => ({ x: b, pose: blend(P.squatTop, P.squatLow, wave(u * 3)), tee: 1, reps: u * 3 })],
        [0.84, (u) => ({ x: b, pose: blend(P.squatTop, P.stand, E.io(u)), tee: 1, reps: 3 })],
        [1, (u) => ({ ...W2(b, c.xout, u, 0, 1), tee: 1 })],
      ]);
    },
    props(t, c, st) {
      c.mr.q('.mr-tee').style.display = t > 0.22 ? 'none' : '';
    },
    html(t, c) {
      const idx = t < 0.32 ? 0 : t < 0.86 ? 1 : 2;
      c.cards.forEach((n, j) => { n.classList.toggle('on', j === idx); n.style.setProperty('--in', seg(t, 0.02 + j * 0.06, 0.16 + j * 0.06).toFixed(3)); });
      if (G.mob && c.track) c.track.style.setProperty('--x', lerp(0, 2, seg(t, 0.2, 0.9)).toFixed(3));
    },
    st: (t) => (t < 0.32 ? 'Merch' : t < 0.86 ? 'Just for Legs' : 'Family-Friendly'),
  },

  // 6 · REVIEWS: walk past the wall of 5-star reviews
  {
    k: [0.62, 0.68],
    build(c) {
      c.p = panel(c.i, 'bd-rev', `<img src="assets/img/h-sign.webp" alt="" loading="lazy" decoding="async">`);
      c.cards = $$('#ch-rev .rcard');
      c.track = $('#ch-rev .reviews');
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const mid = G.X(0.5);
      return seq(t, [
        [0.42, (u) => { const x = lerp(c.xin, mid, u); return { x, pose: walk(ph(x), 1 - 0.85 * seg(u, 0.85, 1)) }; }],
        [0.5, (u) => ({ x: mid, pose: blend(P.stand, P.wipe, E.io(u)) })],
        [0.58, (u) => { const q = Object.assign({}, P.wipe); q.eN += 14 * Math.sin(u * Math.PI * 4); q.head = -4 + 6 * Math.sin(u * Math.PI * 2); return { x: mid, pose: q }; }],
        [0.64, (u) => ({ x: mid, pose: blend(P.wipe, P.stand, E.io(u)) })],
        [1, (u) => { const x = lerp(mid, c.xout, E.i(u) * 0.6 + u * 0.4); return { x, pose: walk(ph(x), clamp(u * 3)) }; }],
      ]);
    },
    props() {},
    html(t, c) {
      c.cards.forEach((n, j) => {
        const f = seg(t, 0.08 + j * 0.22, 0.26 + j * 0.22);
        n.style.setProperty('--f', f.toFixed(3));
        n.style.setProperty('--in', seg(t, 0 + j * 0.05, 0.14 + j * 0.05).toFixed(3));
      });
      if (G.mob && c.track) c.track.style.setProperty('--x', lerp(0, 2, seg(t, 0.12, 0.88)).toFixed(3));
    },
    st: () => 'Reviews', reps: () => 0,
  },

  // 7 · MEMBERSHIPS (light sheet): deadlift while prices count up
  {
    k: [0.7, 0.82],
    light: true,
    build(c) {
      c.p = panel(c.i, 'bd-mem');
      c.bx = G.X(G.mob ? 0.56 : 0.5);
      c.bb = place(PR.barbell(), c.bx, c.fy);
      const J = fig.solve(P.dlLow);
      c.grip = J.handN; // hand position (figure units) at the bottom of the lift
      c.plans = $$('#ch-mem .plan');
      c.track = $('#ch-mem .plans');
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const sx = c.bx - c.grip[0] * G.s;
      return seq(t, [
        [0.16, (u) => { const x = lerp(c.xin, sx, E.o(u)); return { x, pose: walk(ph(x), 1 - E.i(u)) }; }],
        [0.22, (u) => ({ x: sx, pose: blend(P.stand, P.dlLow, E.io(u)) })],
        [0.84, (u) => ({ x: sx, pose: blend(P.dlLow, P.dlTop, wave(u * 3)), bar: 1, reps: u * 3 })],
        [0.9, (u) => ({ x: sx, pose: blend(P.dlLow, P.stand, E.io(u)) })],
        [1, (u) => { const x = lerp(sx, c.xout, E.i(u)); return { x, pose: walk(ph(x), clamp(u * 3)) }; }],
      ]);
    },
    props(t, c, st) {
      const rest = [0, c.grip[1]];
      let n = rest, f = [rest[0] - 5, rest[1] - 4];
      if (st && st.bar && st.J) { n = c.bb.local(fig.world(st.J.handN)); f = c.bb.local(fig.world(st.J.handF)); }
      c.bb.q('.bb-N').setAttribute('transform', `translate(${n[0].toFixed(1)} ${n[1].toFixed(1)})`);
      c.bb.q('.bb-F').setAttribute('transform', `translate(${(f[0] - 5).toFixed(1)} ${(f[1] - 4).toFixed(1)})`);
    },
    html(t, c) {
      c.plans.forEach((n, j) => n.style.setProperty('--in', seg(t, 0.02 + j * 0.05, 0.16 + j * 0.05).toFixed(3)));
      if (G.mob) c.track.style.setProperty('--x', lerp(0, 2, seg(t, 0.25, 0.85)).toFixed(3));
    },
    st: () => 'Memberships',
  },

  // 8 · FAQ: lockers + shower; 6 restrooms, 3 showers counted
  {
    k: [0.84, 0.88],
    build(c) {
      c.p = panel(c.i, 'bd-faq');
      c.lx = G.mob ? G.W * 0.42 : G.X(0.6);
      c.lk = place(PR.lockers(), c.lx, c.fy);
      c.door = c.lk.q('.lk-door');
      c.steam = $$('.sh-steam .st', c.lk.tb);
      c.drops = $$('.sh-drops .dr', c.lk.tb);
      if (G.mob) c.xout = c.lx + 250 * G.s + G.W * 0.45;
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const a = c.lx - 30 * G.s, b = c.lx + 250 * G.s;
      const W2 = (x0, x1, u, a0 = 0, a1 = 0) => { const e = a0 ? E.o(u) : a1 ? E.i(u) : E.s(u); const x = lerp(x0, x1, e); return { x, pose: walk(ph(x), Math.max(a0 * (1 - u), a1 * u, Math.sin(Math.PI * u) ** 0.6)) }; };
      return seq(t, [
        [0.18, (u) => W2(c.xin, a, u, 1, 0)],
        [0.26, (u) => ({ x: a, pose: blend(P.stand, P.locker, E.io(u)), open: u })],
        [0.36, (u) => ({ x: a, pose: blend(P.locker, P.stand, E.io(u)), open: 1 })],
        [0.48, (u) => W2(a, b, u)],
        [0.54, (u) => ({ x: b, pose: blend(P.stand, P.towel, E.io(u)) })],
        [0.78, (u) => { const q = Object.assign({}, P.towel); q.eN += 10 * Math.sin(u * 30); q.eF += 10 * Math.cos(u * 30); return { x: b, pose: q }; }],
        [0.84, (u) => ({ x: b, pose: blend(P.towel, P.stand, E.io(u)) })],
        [1, (u) => W2(b, c.xout, u, 0, 1)],
      ]);
    },
    props(t, c, st) {
      const o = st && st.open != null ? st.open : (t > 0.26 ? 1 - seg(t, 0.4, 0.46) : 0);
      c.door.setAttribute('transform', `scale(${(1 - 1.22 * E.io(clamp(o))).toFixed(3)} 1)`);
      const on = seg(t, 0.46, 0.52) - seg(t, 0.84, 0.92);
      const now = performance.now() / 1000;
      c.drops.forEach((d, j) => { const ph = (now * 2.2 + j * 0.37) % 1; d.setAttribute('transform', `translate(0 ${(ph * 150).toFixed(1)})`); d.setAttribute('opacity', (on * (1 - ph)).toFixed(2)); });
      c.steam.forEach((n, j) => { const ph = (now * 0.25 + j / 6) % 1; n.setAttribute('transform', `translate(${(Math.sin(now * 0.7 + j) * 10).toFixed(1)} ${(-ph * 120).toFixed(1)}) scale(${(0.8 + ph).toFixed(2)})`); n.setAttribute('opacity', (on * Math.sin(Math.PI * ph) * 0.8).toFixed(3)); });
    },
    html() {},
    st: (t) => (t < 0.4 ? 'Lockers' : 'Showers'), reps: () => 0,
  },

  // 9 · FINALE: the flex that becomes the HardWorx H
  {
    k: [0.9, 1],
    build(c) {
      c.p = panel(c.i, 'bd-fin');
      c.xout = c.cx = G.X(0.5);
      const size = G.FH * (G.mob ? 1.35 : 1.25);
      c.logo = el('g', { class: 'fin-logo' }, c.front);
      c.logoClip = defs.querySelector('#logoClip .lc');
      const badge = el('g', { 'clip-path': 'url(#logoClip)' }, c.logo);
      el('circle', { r: size * 0.5, fill: '#FFFFFF' }, badge);
      c.img = el('image', { href: 'assets/brand/logo-h-circle-420.webp', width: size * 0.9, height: size * 0.9, x: -size * 0.45, y: -size * 0.45 }, badge);
      c.size = size;
      c.flash = el('circle', { r: size * 0.56, fill: 'none', stroke: '#E82226', 'stroke-width': 6, opacity: 0 }, c.logo);
      c.logo.setAttribute('transform', `translate(${c.cx} ${c.fy - G.FH * 0.56})`);
    },
    fig(t, c) {
      const ph = (x) => (c.F + x - c.xin) / (STRIDE * G.s);
      const fx = c.cx - 22 * G.s;
      return seq(t, [
        [0.3, (u) => { const x = lerp(c.xin, fx, E.o(u)); return { x, pose: walk(ph(x), 1 - E.i(u)) }; }],
        [0.46, (u) => ({ x: fx, pose: blend(P.stand, P.flex, E.io(u)) })],
        [0.56, (u) => { const q = Object.assign({}, P.flex); q.eN += 6 * Math.sin(u * Math.PI * 2); return { x: fx, pose: q }; }],
        [1, (u) => ({ x: fx, pose: P.flex, op: 1 - seg(u, 0.05, 0.45) })],
      ]);
    },
    props(t, c) {
      const r = E.io(seg(t, 0.56, 0.82));
      c.logoClip.setAttribute('r', (r * c.size * 0.52).toFixed(1));
      const fl = seg(t, 0.54, 0.6) - seg(t, 0.6, 0.78);
      c.flash.setAttribute('opacity', (clamp(fl) * 0.55).toFixed(3));
      c.logo.style.opacity = r > 0 ? 1 : 0;
      c.p.style.setProperty('--r', r.toFixed(3));
    },
    html() {},
    st: (t) => (t < 0.5 ? 'HardWorx' : 'Strength · Courage · Freedom'), reps: () => 0,
  },
];

// ------------------------------------------------------------------ layout
const CAM = { y: 0, x: 0 };
let built = false, stillsBuilt = false;
function layout() {
  G = geom();
  document.documentElement.style.setProperty('--H', G.H + 'px');
  document.documentElement.style.setProperty('--gap', G.gap + 'px');
  document.documentElement.style.setProperty('--fh', G.FH + 'px');
  // sticky chapter lengths
  sections.forEach((sec) => { sec.style.height = (G.H * (+sec.dataset.len / 100)) + 'px'; });
  bdCam.innerHTML = '';
  setupSVG();
  C = CH.map((def, i) => {
    const sec = sections[i];
    const back = el('g', { class: 'chb', 'data-ch': i }, backL), front = el('g', { class: 'chf', 'data-ch': i }, frontL);
    return { def, i, sec, T: 0, D: 0, fy: i * G.H + G.FY, xin: G.xin, xout: G.xout, camX: 0, panMax: 0,
      back, front, bgBack: el('g', { class: 'bgrow' }, back) };
  });
  C.forEach((c) => {
    CUR = c; c.def.build(c);
    if (G.mob && c.SX && c.SX.length > 1) c.panMax = Math.max(0, c.SX[c.SX.length - 1] - G.W * 0.5);
    if (G.mob && c.lx != null) c.panMax = Math.max(0, c.lx + 250 * G.s - G.W * 0.5);
  });
  CUR = null;
  measure();
  buildLane();
  // long copy scrolls inside its pinned stage instead of colliding with the floor band
  C.forEach((c) => {
    c.copy = c.sec.querySelector('.copy');
    if (!c.copy) return;
    c.copy.style.setProperty('--ty', 0);
    const top = c.copy.offsetTop, h = c.copy.offsetHeight;
    const limit = G.FY - (G.mob ? G.FH + 18 : G.FH * 0.55);
    c.over = c.i === 0 ? 0 : Math.max(0, top + h - limit);
  });
  built = true;
  ScrollTrigger.refresh();
  frame(true);
}
function measure() {
  C.forEach((c) => { c.T = c.sec.getBoundingClientRect().top + window.scrollY; c.L = c.sec.offsetHeight; c.D = c.L - G.H; });
  // contact + footer flow after the last chapter
}

// ------------------------------------------------------------------ frame
let lastS = -1, lastFrameT = 0;
function chapterAt(s) {
  // returns { i, t, mode: 'pin' | 'ramp' | 'after', u }
  let pinned = 0;
  for (let i = 0; i < C.length; i++) {
    const c = C[i];
    if (s < c.T) break;
    if (s <= c.T + c.D) { pinned += s - c.T; return { i, t: clamp((s - c.T) / Math.max(1, c.D)), mode: 'pin', pinned }; }
    pinned += c.D;
    if (i < C.length - 1 && s < C[i + 1].T) return { i, u: clamp((s - c.T - c.D) / G.H), mode: 'ramp', pinned };
  }
  return { i: C.length - 1, t: 1, mode: 'after', pinned };
}

function frame(force) {
  if (!built) return;
  const s = window.scrollY;
  const now = performance.now();
  const ambient = now - lastFrameT > 33; // keep idle loops (steam, water) alive
  if (!force && s === lastS && !INTRO.active && !ambient) return;
  lastS = s; lastFrameT = now;
  const at = chapterAt(s);
  CAM.y = s - at.pinned;

  let st, fx = 1, y, x, k, len, tee = false, op = 1, flash = 0;
  const c = C[at.i];
  if (at.mode === 'pin' || at.mode === 'after') {
    const t = at.mode === 'after' ? 1 : at.t;
    st = c.def.fig(t, c) || {};
    x = st.x; y = c.fy + (st.dy || 0) * G.s;
    k = lerp(c.def.k[0], c.def.k[1], t);
    len = c.F + clamp(x - c.xin, 0, c.xout - c.xin);
    tee = at.i > 5 || (at.i === 5 && !!st.tee);
    op = st.op != null ? st.op : (at.i === C.length - 1 && at.mode === 'after' ? 0 : 1);
    flash = st.flash || 0;
    if (G.mob && c.panMax) c.camX = clamp(x - G.W * 0.5, 0, c.panMax);
    CAM.x = G.mob ? c.camX : 0;
  } else {
    // ramp between chapter i and i+1: the member stays on screen, the lane slides under them
    const sg = LANE.segs.find((q) => q.type === 'ramp' && q.i === at.i);
    const r = rampAtY(sg, CAM.y + G.FY);
    x = r.x; y = r.y; len = r.len;
    const u = at.u;
    const turnA = seg(u, 0, 0.07), turnB = seg(u, 0.93, 1);
    fx = turnB > 0 ? lerp(-1, 1, E.io(turnB)) : lerp(1, -1, E.io(turnA));
    const q = walk(len / (STRIDE * G.s), 1);
    q.torso -= 6 * Math.sin(Math.PI * u);
    st = { pose: q };
    k = lerp(c.def.k[1], C[at.i + 1].def.k[0], u);
    tee = at.i >= 5;
    // horizontal camera eases from chapter i's pan to chapter i+1's (mobile)
    CAM.x = G.mob ? Math.max(0, x - lerp(G.W * 0.9, G.W * 0.1, u)) : 0;
  }
  if (Math.abs(fx) < 0.08) fx = fx < 0 ? -0.08 : 0.08;

  // figure
  fig.setStrength(k);
  fig.setTee(tee);
  const J = fig.render(st.pose, x, y, G.s, fx);
  fig.root.style.opacity = op;
  fig.body.style.filter = flash > 0 ? `brightness(${1 + flash * 1.5})` : '';
  st.J = J; st.x = x;

  // camera
  camG.setAttribute('transform', `translate(${(-CAM.x).toFixed(2)} ${(-CAM.y).toFixed(2)})`);
  bdCam.style.transform = `translate3d(${(-CAM.x * 0.15).toFixed(1)}px, ${(-CAM.y).toFixed(1)}px, 0)`;
  laneTrail.style.strokeDashoffset = (LANE.total - len).toFixed(1);
  for (let j = 0; j < rampMasks.length; j++) {
    let v = 0;
    if (at.mode === 'ramp') v = j === at.i ? 1 : 0;
    else if (at.mode === 'pin') v = j === at.i ? seg(at.t, 0.86, 1) : j === at.i - 1 ? 1 - seg(at.t, 0, 0.2) : 0;
    if (rampMasks[j]._v !== v) { rampMasks[j]._v = v; rampMasks[j].setAttribute('opacity', v.toFixed(3)); }
  }

  // chapter props + html: active chapter, plus neighbours in their rest states
  for (let j = 0; j < C.length; j++) {
    const cj = C[j];
    const near = Math.abs(j - at.i) <= 1;
    if (cj.visible !== near) { cj.visible = near; cj.back.style.display = cj.front.style.display = near ? '' : 'none'; }
    if (!near) continue;
    let tj;
    if (j === at.i) tj = at.mode === 'ramp' ? 1 : (at.mode === 'after' ? 1 : at.t);
    else tj = j < at.i ? 1 : 0;
    cj.def.props(tj, cj, j === at.i && at.mode === 'pin' ? st : null);
    cj.def.html(tj, cj, j === at.i ? st : null);
  }

  if (at.mode === 'pin' && c.copy && c.over) c.copy.style.setProperty('--ty', (c.over * E.io(seg(at.t, 0.1, 0.9))).toFixed(1));

  // HUD
  const lastEnd = C[C.length - 1].T + C[C.length - 1].D;
  const prog = clamp(s / lastEnd);
  const station = at.mode === 'ramp' ? 'On the move' : c.def.st(at.mode === 'after' ? 1 : at.t);
  const reps = st.reps != null ? Math.floor(st.reps + 0.001) : 0;
  hud(prog, station, reps, c.def.light && at.mode === 'pin', s > lastEnd + G.H * 0.3);
}

// ------------------------------------------------------------------ reduced motion stills
function buildStills() {
  if (stillsBuilt) return; stillsBuilt = true;
  const stills = [
    { w: 520, items: [[PR.door, 340, { slide: 104 }]], x: 170, pose: P.fob },
    { w: 520, items: [[PR.chestPress, 340, {}]], x: 150, pose: P.towel, k: 0.08 },
    { w: 980, items: [[PR.treadmill, 110, {}], [PR.pulldown, 330, {}], [PR.chestPress, 580, {}], [PR.dbRack, 830, {}]], x: 816, pose: P.ohpUp, k: 0.4, db: true },
    { w: 460, items: [[PR.bench, 230, {}]], x: 224, pose: P.phone, k: 0.45 },
    { w: 640, items: [[PR.sauna, 170, { heat: 1 }], [PR.plunge, 480, { frost: 1 }]], x: 166, pose: P.sauna, k: 0.48 },
    { w: 640, items: [[PR.merchRack, 170, {}], [PR.squatRack, 460, {}]], x: 456, pose: P.squatLow, k: 0.6, tee: true },
    { w: 360, items: [], x: 170, pose: P.towel, k: 0.66, tee: true },
    { w: 420, items: [[PR.barbell, 0, {}]], x: 180, pose: P.dlTop, k: 0.8, tee: true, bar: true },
    { w: 620, items: [[PR.lockers, 220, { open: 1 }]], x: 170, pose: P.locker, k: 0.86, tee: true },
    { w: 360, items: [], x: 160, pose: P.flex, k: 1, tee: true },
  ];
  $$('.still').forEach((host) => {
    const d = stills[+host.dataset.still];
    if (!d) return;
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute("viewBox", `0 -410 ${d.w} 430`);
    s.setAttribute('aria-hidden', 'true');
    const df = el('defs', {}, s); figureDefs(df); PR.propDefs(df);
    df.insertAdjacentHTML('beforeend', '<clipPath id="doorClip"><rect x="-62" y="-360" width="124" height="360"/></clipPath>');
    el('rect', { x: 0, y: -2, width: d.w, height: 14, fill: '#121213' }, s);
    el('line', { x1: 0, y1: -2, x2: d.w, y2: -2, stroke: '#E82226', 'stroke-width': 2 }, s);
    const back = el('g', {}, s), figG = el('g', {}, s), front = el('g', {}, s);
    const f = new Figure(figG, { filter: true });
    f.setStrength(d.k || 0); f.setTee(!!d.tee);
    const J = f.render(d.pose, d.x, 0, 1, 1);
    for (const [fn, px, o] of d.items) {
      const pr = fn();
      const gb = el('g', { transform: `translate(${px} 0)` }, back), gf = el('g', { transform: `translate(${px} 0)` }, front);
      gb.appendChild(pr.back); gf.appendChild(pr.front);
      if (o.slide) pr.q('.d-slide').setAttribute('transform', `translate(${o.slide} 0)`);
      if (o.heat) pr.q('.sa-heat').setAttribute('opacity', 1);
      if (o.frost) pr.q('.pl-frost').setAttribute('opacity', 1);
      if (o.open) pr.q('.lk-door').setAttribute('transform', 'scale(-0.22 1)');
      const dbp = pr.q('.db-N'); if (dbp) dbp.style.display = 'none';
      const ph = pr.q('.ph'); if (ph) ph.setAttribute('transform', `translate(${J.handN[0] - px + 3} ${J.handN[1] - 6}) rotate(-24)`);
      if (d.bar) { pr.q('.bb-N').setAttribute('transform', `translate(${J.handN[0]} ${J.handN[1]})`); pr.q('.bb-F').setAttribute('transform', `translate(${J.handF[0] - 5} ${J.handF[1] - 4})`); }
      const lev = pr.q('.cp-lever');
      if (lev) { $$('.cp-lever', pr.front)[0].setAttribute('d', 'M-51,-292 Q20,-310 44,-150'); $$('.cp-lever', pr.back)[0].setAttribute('d', 'M-51,-292 Q16,-312 40,-154'); pr.q('.cp-plN').setAttribute('transform', 'translate(12 -222)'); pr.q('.cp-plF').setAttribute('transform', 'translate(9 -228)'); pr.q('.cp-grip').setAttribute('transform', 'translate(44 -150)'); }
      const bar = pr.q('.pd-bar'); if (bar) { bar.setAttribute('transform', 'translate(8 -262)'); pr.q('.pd-cable').setAttribute('d', 'M-14,-318 L8,-272'); pr.q('.pd-cable2').setAttribute('d', 'M132,-318 L132,-212'); }
    }
    if (d.db) { front.insertAdjacentHTML('beforeend', `<g transform="translate(${J.handN[0]} ${J.handN[1]}) rotate(90)">${PR.dumbbellSVG()}</g>`); }
    if (+host.dataset.still === 9) el('image', { href: 'assets/brand/logo-h-circle-420.webp', x: 190, y: -330, width: 160, height: 160 }, s);
    host.appendChild(s);
  });
}

// ------------------------------------------------------------------ boot
function boot() {
  initUI();
  if (RM) { buildStills(); $$('.count').forEach((n) => { if (n.dataset.word) n.textContent = n.dataset.word; }); return; }

  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
  const DEBUG = /[?&]debug=1/.test(location.search);
  if (DEBUG) window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); frame(); });
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: 0, duration: 1.6 }); }
  });

  layout();
  if (DEBUG) window.__go = (i, t = 0, r = null) => { const c = C[i]; const y = r == null ? c.T + c.D * t : c.T + c.D + G.H * r; lenis.scrollTo(y, { immediate: true, force: true }); INTRO.dx = 0; frame(true); };

  // chapter activity + header state via ScrollTrigger
  sections.forEach((sec) => ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', toggleClass: { targets: sec, className: 'is-active' } }));
  ScrollTrigger.create({ start: 80, end: 'max', onToggle: (self) => document.documentElement.classList.toggle('scrolled', self.isActive) });
  ScrollTrigger.batch('.contact .ct-grid > *, .foot > *', { start: 'top 88%', onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' }) });
  gsap.set('.contact .ct-grid > *, .foot > *', { opacity: 0, y: 24 });

  // intro: the member walks in along the lane (MotionPathPlugin drives the proxy along the same path)
  if (window.scrollY < 10) {
    const c0 = C[0];
    const dist = c0.fobSpot - c0.xin;
    INTRO.dx = -dist; INTRO.active = true;
    gsap.to(INTRO, { dx: 0, duration: 2.6, delay: 0.35, ease: 'power2.out', onComplete: () => { INTRO.active = false; frame(true); } });
  }

  let rw = G.W, rh = G.H, to;
  window.addEventListener('resize', () => {
    clearTimeout(to);
    to = setTimeout(() => {
      const W = document.documentElement.clientWidth, H = window.innerHeight;
      const touch = matchMedia('(pointer: coarse)').matches;
      if (W === rw && (touch ? Math.abs(H - rh) < 140 : H === rh)) return;
      rw = W; rh = H;
      // keep the reader at the same point in the story across a relayout
      const at = chapterAt(window.scrollY);
      const past = at.mode === 'after' ? window.scrollY - (C[C.length - 1].T + C[C.length - 1].D) : 0;
      layout();
      const c = C[at.i];
      const y = at.mode === 'pin' ? c.T + c.D * at.t : at.mode === 'ramp' ? c.T + c.D + G.H * at.u : c.T + c.D + past;
      lenis.scrollTo(y, { immediate: true, force: true });
      frame(true);
    }, 180);
  });
  document.fonts && document.fonts.ready.then(() => { measure(); frame(true); });
}
boot();
