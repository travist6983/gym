// The member: a profile silhouette built from parametric limb shapes.
// Units: 300 = standing height, feet on y = 0, facing +x.
// Direction angles: 0 = pointing down (+y), +90 = forward (+x), 180 = up.

export const NS = 'http://www.w3.org/2000/svg';
const R = Math.PI / 180;
const dir = (deg) => [Math.sin(deg * R), Math.cos(deg * R)];
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const D = { thigh: 78, shin: 74, ankle: 7, foot: 27, torso: 96, sh: 86, neck: 13, head: 17, upper: 57, fore: 50 };
const PELVIS_H = D.thigh + D.shin + D.ankle;

const BASE = {
  tx: 0, ty: 0, lock: 1,
  torso: 2, head: 0,
  sN: 4, eN: 8, sF: -4, eF: 8, wN: 0, wF: 0,
  hN: 2, kN: 3, aN: 0, hF: -2, kF: 3, aF: 0,
};

export function pose(o) { return Object.assign({}, BASE, o); }
export function blend(a, b, t) {
  if (t <= 0) return a; if (t >= 1) return b;
  const o = {};
  for (const k in a) o[k] = lerp(a[k], b[k], t);
  return o;
}

// ---------- Key poses ----------
export const P = {
  stand: pose({}),
  idle: pose({ torso: 1, sN: 2, eN: 12, sF: -6, eF: 12 }),
  fob: pose({ torso: 4, sN: 40, eN: 30, wN: 0, sF: -8, eF: 14, head: 14 }),
  reach: pose({ torso: 6, sN: 112, eN: 8, sF: -10, eF: 16, head: -8 }),
  // seated: pelvis lowered onto a seat; tx/ty tuned per prop
  sit: pose({ lock: 0, ty: 70, torso: 0, hN: 88, kN: 86, hF: 84, kF: 82, aN: -4, aF: -4, sN: 18, eN: 70, sF: 14, eF: 70 }),
  pullUp: pose({ lock: 0, ty: 70, torso: -10, head: -6, hN: 90, kN: 92, hF: 86, kF: 88, sN: 166, eN: 18, sF: 160, eF: 18 }),
  pullDown: pose({ lock: 0, ty: 70, torso: -16, head: -4, hN: 90, kN: 92, hF: 86, kF: 88, sN: 52, eN: 128, sF: 48, eF: 124 }),
  pressIn: pose({ lock: 0, ty: 70, torso: -6, hN: 84, kN: 80, hF: 80, kF: 76, sN: -55, eN: 148, sF: -58, eF: 150 }),
  pressOut: pose({ lock: 0, ty: 70, torso: -6, hN: 84, kN: 80, hF: 80, kF: 76, sN: 86, eN: 6, sF: 82, eF: 8 }),
  ohpDown: pose({ torso: -2, head: -4, sN: 100, eN: 82, sF: 96, eF: 84, hN: 2, kN: 6, hF: -2, kF: 6 }),
  ohpUp: pose({ torso: -2, head: -6, sN: 176, eN: 6, sF: 172, eF: 8, hN: 2, kN: 3, hF: -2, kF: 3 }),
  phone: pose({ lock: 0, ty: 70, torso: 10, head: 22, hN: 86, kN: 84, hF: 82, kF: 80, sN: 42, eN: 104, sF: 26, eF: 96, wN: 12 }),
  sauna: pose({ lock: 0, ty: 70, torso: -12, head: -10, hN: 82, kN: 74, hF: 78, kF: 70, sN: -6, eN: 38, sF: -10, eF: 34 }),
  plunge: pose({ torso: 6, head: 10, sN: 26, eN: 140, sF: 22, eF: 136, hN: 4, kN: 8, hF: -2, kF: 8 }),
  squatTop: pose({ torso: 4, sN: 84, eN: 8, sF: 80, eF: 10, hN: 2, kN: 4, hF: -2, kF: 4 }),
  squatLow: pose({ torso: 34, head: -14, sN: 120, eN: 4, sF: 116, eF: 6, hN: 104, kN: 120, aN: -16, hF: 98, kF: 116, aF: -18 }),
  dlLow: pose({ torso: 66, head: -46, sN: 66, eN: 0, sF: 62, eF: 0, hN: 72, kN: 64, aN: 8, hF: 68, kF: 62, aF: 6 }),
  dlTop: pose({ torso: -3, head: 0, sN: -3, eN: 0, sF: -7, eF: 0, hN: 2, kN: 2, hF: -2, kF: 2 }),
  locker: pose({ torso: 4, sN: 64, eN: 34, sF: -8, eF: 18, head: 4 }),
  towel: pose({ torso: 2, head: -6, sN: 150, eN: 130, sF: 140, eF: 136 }),
  stretch: pose({ torso: -3, head: -10, sN: 174, eN: 4, sF: 170, eF: 6 }),
  wipe: pose({ torso: 2, head: -4, sN: 128, eN: 112, wN: 20, sF: -6, eF: 18 }),
  flex: pose({ torso: -2, head: -18, sN: 92, eN: 100, wN: 30, sF: 84, eF: 104, hN: 6, kN: 4, hF: -8, kF: 4 }),
};

// procedural gaits (phase in cycles; amp scales the motion)
export function walk(ph, amp = 1) {
  const a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const sw = (x) => Math.max(0, x);
  return pose({
    torso: 4 * amp, head: 2,
    hN: 24 * s * amp, kN: (6 + 44 * Math.pow(sw(c), 1.4)) * amp,
    hF: -24 * s * amp, kF: (6 + 44 * Math.pow(sw(-c), 1.4)) * amp,
    aN: -6 * s * amp, aF: 6 * s * amp,
    sN: -22 * s * amp, eN: (14 + 12 * sw(-s)) * amp, sF: 22 * s * amp, eF: (14 + 12 * sw(s)) * amp,
  });
}
export function run(ph, amp = 1) {
  const a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const sw = (x) => Math.max(0, x);
  return pose({
    torso: 11 * amp, head: -4,
    hN: 38 * s * amp, kN: (18 + 92 * Math.pow(sw(c), 1.2)) * amp,
    hF: -38 * s * amp, kF: (18 + 92 * Math.pow(sw(-c), 1.2)) * amp,
    aN: -10 * s, aF: 10 * s,
    sN: -40 * s * amp, eN: 86, sF: 40 * s * amp, eF: 86,
  });
}
export const wave = (c) => 0.5 - 0.5 * Math.cos(c * Math.PI * 2);

// ---------- Shapes ----------
function limbD(len, a, b, fF, fB, m) {
  // local: from (0,0) to (0,len); +x = front side
  const ma = Math.max(a, b);
  return `M${a},0 Q${(ma + fF).toFixed(2)},${(len * m).toFixed(2)} ${b},${len} A${b},${b} 0 0 1 ${-b},${len} Q${(-(ma + fB)).toFixed(2)},${(len * m).toFixed(2)} ${-a},0 A${a},${a} 0 0 1 ${a},0Z`;
}
function torsoD(k) {
  // local: pelvis (0,0), neck (0,-D.torso); +x = front (chest), -x = back
  const c = 16 + 9 * k, l = 11 + 4 * k, w = 10 - 1 * k;
  return `M7,${-D.torso} C10,-93 ${12 + 2 * k},-90 ${c - 1},-80 C${c + 2},-72 ${c},-62 ${w + 3},-52 C${w},-40 ${w + 1},-20 12,0 L-14,3 C-15,-10 -11,-26 -9,-38 C${-l + 1},-52 ${-l},-70 ${-l + 1},-84 C${-9 - 1.5 * k},-92 -8,-95 -5,${-D.torso}Z`;
}
const footD = 'M-6,-6 L18,-5 C26,-4 32,0 32,3 C32,5 30,6 27,6 L-6,6 C-9,5 -9,-5 -6,-6Z';
const headD = 'M-2,-18 C8,-19 15,-13 16,-5 L19,1 C20,2 19,3 17,3.5 L16.5,7 C16,8 15,8.5 14,9 L13.5,12 C13,15 10,16.5 6,16.5 L-1,16 C-11,15 -18,9 -18,-1 C-18,-11 -11,-18 -2,-18Z';

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

export function figureDefs(defs, rimDx = -2.6, rimDy = 1.6) {
  defs.insertAdjacentHTML('beforeend', `
    <filter id="rim" x="-25%" y="-15%" width="150%" height="130%" color-interpolation-filters="sRGB">
      <feOffset in="SourceAlpha" dx="${rimDx}" dy="${rimDy}" result="off"/>
      <feComposite in="SourceAlpha" in2="off" operator="out" result="edge"/>
      <feGaussianBlur in="edge" stdDeviation="0.7" result="edgeB"/>
      <feFlood flood-color="#E82226" result="red"/>
      <feComposite in="red" in2="edgeB" operator="in" result="rim"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="halo"/>
      <feComposite in="red" in2="halo" operator="in" result="glow"/>
      <feComponentTransfer in="glow" result="glowA"><feFuncA type="linear" slope="0.38"/></feComponentTransfer>
      <feOffset in="SourceAlpha" dx="${-rimDx * 0.8}" dy="${rimDy * 0.6}" result="off2"/>
      <feComposite in="SourceAlpha" in2="off2" operator="out" result="edge2"/>
      <feGaussianBlur in="edge2" stdDeviation="0.9" result="edge2B"/>
      <feFlood flood-color="#C6C6C6" flood-opacity=".55" result="cool"/>
      <feComposite in="cool" in2="edge2B" operator="in" result="key"/>
      <feMerge><feMergeNode in="glowA"/><feMergeNode in="SourceGraphic"/><feMergeNode in="key"/><feMergeNode in="rim"/><feMergeNode in="rim"/></feMerge>
    </filter>`);
}

// ---------- Figure ----------
export class Figure {
  constructor(parent, { filter = true } = {}) {
    this.root = el('g', { class: 'fig' }, parent);
    this.body = el('g', { class: 'fig-body', filter: filter ? 'url(#rim)' : '' }, this.root);
    const far = '#202023', near = '#0c0c0d';
    const B = this.body;
    this.p = {};
    const mk = (name, fill) => (this.p[name] = el('path', { fill }, B));
    // draw order: far side first
    mk('upperF', far); mk('foreF', far); mk('handF', far);
    mk('thighF', far); mk('shinF', far); mk('footF', far);
    mk('glute', near); mk('torso', near);
    this.tee = el('path', { fill: '#141416', class: 'fig-tee', opacity: 0 }, B);
    this.teeMark = el('image', { href: 'assets/brand/favicon-64.png', width: 15, height: 15, opacity: 0 }, B);
    mk('neck', near); mk('head', near);
    mk('thighN', near); mk('shinN', near); mk('footN', near);
    mk('delt', near); mk('upperN', near); mk('sleeve', '#141416'); mk('foreN', near); mk('handN', near);
    this.p.sleeve.setAttribute('opacity', 0);
    this.p.head.setAttribute('d', headD);
    this.p.footN.setAttribute('d', footD); this.p.footF.setAttribute('d', footD);
    this.k = -1; this.teeOn = -1;
    this.J = {};
    this.setStrength(0);
  }

  setStrength(k) {
    k = clamp(k);
    if (Math.abs(k - this.k) < 0.004) return;
    this.k = k;
    const p = this.p;
    const up = limbD(D.upper, 9.5 + 3 * k, 6.8 + 1 * k, 3 + 8 * k, 3 + 5.5 * k, 0.46);
    const fo = limbD(D.fore, 7.2 + 1.6 * k, 4.8, 2 + 3 * k, 2 + 2.4 * k, 0.28);
    const th = limbD(D.thigh, 14.5 + 3.5 * k, 8.8 + 1.2 * k, 5 + 6 * k, 4 + 3 * k, 0.42);
    const sh = limbD(D.shin, 8.4 + 0.8 * k, 4.8, 1.4, 4 + 4 * k, 0.3);
    p.upperN.setAttribute('d', up); p.upperF.setAttribute('d', up);
    p.foreN.setAttribute('d', fo); p.foreF.setAttribute('d', fo);
    p.thighN.setAttribute('d', th); p.thighF.setAttribute('d', th);
    p.shinN.setAttribute('d', sh); p.shinF.setAttribute('d', sh);
    p.torso.setAttribute('d', torsoD(k));
    p.glute.setAttribute('d', `M-4,-4 m-${12 + 3 * k},0 a${12 + 3 * k},${12 + 1.5 * k} 0 1 0 ${2 * (12 + 3 * k)},0 a${12 + 3 * k},${12 + 1.5 * k} 0 1 0 ${-2 * (12 + 3 * k)},0`);
    const r = 10.5 + 5.5 * k;
    p.delt.setAttribute('d', `M0,${-r} a${r},${r} 0 1 0 0.01,0Z`);
    p.neck.setAttribute('d', `M${-5 - 2.5 * k},0 L${5 + 1.2 * k},0 L4.5,${-D.neck - 6} L-4.5,${-D.neck - 6}Z`);
    const hr = 5.2 + 0.8 * k;
    p.handN.setAttribute('d', `M0,${-hr} a${hr},${hr} 0 1 0 0.01,0Z`);
    p.handF.setAttribute('d', `M0,${-hr} a${hr},${hr} 0 1 0 0.01,0Z`);
    // tee: torso hull slightly larger, plus a short sleeve over the near upper arm
    this.tee.setAttribute('d', torsoD(Math.min(1, k + 0.06)));
    p.sleeve.setAttribute('d', limbD(D.upper * 0.5, 11 + 3.4 * k, 9.6 + 2.6 * k, 3 + 7 * k, 3 + 5 * k, 0.6));
  }

  setTee(on) {
    on = on ? 1 : 0;
    if (on === this.teeOn) return;
    this.teeOn = on;
    this.tee.setAttribute('opacity', on); this.teeMark.setAttribute('opacity', on);
    this.p.sleeve.setAttribute('opacity', on);
  }

  // Solve joint positions in figure units (anchor at 0,0 = feet on floor)
  solve(q) {
    const J = this.J;
    const pel = [q.tx, -(PELVIS_H - q.ty)];
    const thN = q.hN, shN = q.hN - q.kN, ftN = shN + 90 - q.aN;
    const thF = q.hF, shF = q.hF - q.kF, ftF = shF + 90 - q.aF;
    const kneeN = add(pel, mul(dir(thN), D.thigh)), kneeF = add(pel, mul(dir(thF), D.thigh));
    const ankN = add(kneeN, mul(dir(shN), D.shin + D.ankle)), ankF = add(kneeF, mul(dir(shF), D.shin + D.ankle));
    if (q.lock > 0) {
      // ground lock: drop the lowest foot onto y = 0 (weighted so lock/unlock poses blend smoothly)
      const toeN = add(ankN, mul(dir(ftN), D.foot * 0.85)), toeF = add(ankF, mul(dir(ftF), D.foot * 0.85));
      const low = Math.max(ankN[1], ankF[1], toeN[1] - 1, toeF[1] - 1) + 5;
      const dy = -low * Math.min(1, q.lock);
      for (const v of [pel, kneeN, kneeF, ankN, ankF]) v[1] += dy;
    }
    const tA = 180 - q.torso;
    const neck = add(pel, mul(dir(tA), D.torso));
    const shoulder = add(pel, mul(dir(tA), D.sh));
    const hA = tA - q.head;
    const headC = add(neck, mul(dir(hA), D.neck + 12));
    const uN = -q.torso + q.sN, fN = uN + q.eN;
    const uF = -q.torso + q.sF, fF = uF + q.eF;
    const elbN = add(shoulder, mul(dir(uN), D.upper)), elbF = add(shoulder, mul(dir(uF), D.upper));
    const wriN = add(elbN, mul(dir(fN), D.fore)), wriF = add(elbF, mul(dir(fF), D.fore));
    const handN = add(wriN, mul(dir(fN + q.wN), 4)), handF = add(wriF, mul(dir(fF + q.wF), 4));
    Object.assign(J, { pel, kneeN, kneeF, ankN, ankF, neck, shoulder, headC, elbN, elbF, wriN, wriF, handN, handF,
      a: { thN, shN, ftN, thF, shF, ftF, tA, hA, uN, fN, uF, fF } });
    return J;
  }

  // q = pose; x,y = anchor (world); s = scale; fx = facing (1 right, -1 left, between = mid-turn)
  render(q, x, y, s, fx = 1) {
    const J = this.solve(q), a = J.a, p = this.p;
    const T = (n, pt, ang) => n.setAttribute('transform', `translate(${pt[0].toFixed(2)} ${pt[1].toFixed(2)}) rotate(${(-ang).toFixed(2)})`);
    T(p.thighN, J.pel, a.thN); T(p.thighF, J.pel, a.thF);
    T(p.shinN, J.kneeN, a.shN); T(p.shinF, J.kneeF, a.shF);
    T(p.footN, J.ankN, a.ftN - 90); T(p.footF, J.ankF, a.ftF - 90);
    const tor = `translate(${J.pel[0].toFixed(2)} ${J.pel[1].toFixed(2)}) rotate(${q.torso.toFixed(2)})`;
    p.torso.setAttribute('transform', tor); p.glute.setAttribute('transform', tor); this.tee.setAttribute('transform', tor);
    // tee mark sits on the chest
    const chest = add(J.pel, mul(dir(a.tA), 66));
    const fwd = dir(a.tA - 90);
    this.teeMark.setAttribute('transform', `translate(${(chest[0] + fwd[0] * (4 + 6 * this.k) - 7.5).toFixed(2)} ${(chest[1] + fwd[1] * 6 - 7.5).toFixed(2)})`);
    T(p.neck, J.neck, a.hA - 180);
    p.head.setAttribute('transform', `translate(${J.headC[0].toFixed(2)} ${J.headC[1].toFixed(2)}) rotate(${(q.torso + q.head * 0.7).toFixed(2)})`);
    p.delt.setAttribute('transform', `translate(${J.shoulder[0].toFixed(2)} ${(J.shoulder[1] + 2).toFixed(2)})`);
    T(p.upperN, J.shoulder, a.uN); T(p.upperF, J.shoulder, a.uF); T(p.sleeve, J.shoulder, a.uN);
    T(p.foreN, J.elbN, a.fN); T(p.foreF, J.elbF, a.fF);
    p.handN.setAttribute('transform', `translate(${J.handN[0].toFixed(2)} ${J.handN[1].toFixed(2)})`);
    p.handF.setAttribute('transform', `translate(${J.handF[0].toFixed(2)} ${J.handF[1].toFixed(2)})`);
    this.root.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(fx * s).toFixed(4)} ${s.toFixed(4)})`);
    this.x = x; this.y = y; this.s = s; this.fx = fx;
    return J;
  }

  // figure-unit point -> world
  world(pt) {
    return [this.x + this.fx * pt[0] * this.s, this.y + pt[1] * this.s];
  }
}

function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function mul(v, k) { return [v[0] * k, v[1] * k]; }
