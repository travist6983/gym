// Equipment drawn in figure units (300 = member height), floor at y = 0, member faces +x.
// Every builder returns { back, front, q } where q(sel) finds parts.
import { NS } from './figure.js';

export function propDefs(defs) {
  defs.insertAdjacentHTML('beforeend', `
    <linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2434A"/><stop offset=".45" stop-color="#E82226"/><stop offset="1" stop-color="#9A1217"/></linearGradient>
    <linearGradient id="gRedV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F04048"/><stop offset=".5" stop-color="#E82226"/><stop offset="1" stop-color="#8E1015"/></linearGradient>
    <linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3c"/><stop offset="1" stop-color="#161616"/></linearGradient>
    <linearGradient id="gChrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F7F7"/><stop offset=".45" stop-color="#919191"/><stop offset=".55" stop-color="#6b6b6b"/><stop offset="1" stop-color="#E2E2E2"/></linearGradient>
    <linearGradient id="gPad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a2c"/><stop offset=".25" stop-color="#121213"/><stop offset="1" stop-color="#050505"/></linearGradient>
    <radialGradient id="gPlate" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3a3a3c"/><stop offset="1" stop-color="#0a0a0a"/></radialGradient>
    <radialGradient id="gHeat" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="#E82226" stop-opacity=".75"/><stop offset=".6" stop-color="#E82226" stop-opacity=".22"/><stop offset="1" stop-color="#E82226" stop-opacity="0"/></radialGradient>
    <radialGradient id="gSteam" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F7F7F7" stop-opacity=".5"/><stop offset="1" stop-color="#F7F7F7" stop-opacity="0"/></radialGradient>
    <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2E2E2" stop-opacity=".55"/><stop offset="1" stop-color="#919191" stop-opacity=".15"/></linearGradient>
    <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F7F7" stop-opacity=".10"/><stop offset=".5" stop-color="#F7F7F7" stop-opacity=".03"/><stop offset="1" stop-color="#F7F7F7" stop-opacity=".08"/></linearGradient>
  `);
}

function g(cls) { const n = document.createElementNS(NS, 'g'); if (cls) n.setAttribute('class', cls); return n; }
function mk(backHTML, frontHTML = '') {
  const back = g('pb'), front = g('pf');
  back.innerHTML = backHTML; front.innerHTML = frontHTML;
  return { back, front, q: (s) => back.querySelector(s) || front.querySelector(s) };
}

// ---- reusable bits ----
export const plateSVG = (r = 38, cls = '') => `
  <g class="${cls}">
    <circle r="${r}" fill="url(#gPlate)" stroke="#000" stroke-width="1.5"/>
    <circle r="${r - 5}" fill="none" stroke="#E82226" stroke-width="3.2"/>
    <circle r="${r * 0.42}" fill="#161616" stroke="#303030" stroke-width="1.2"/>
    <circle r="${r * 0.13}" fill="url(#gChrome)"/>
    <path d="M${-r * 0.7},${-r * 0.35} A${r * 0.78},${r * 0.78} 0 0 1 ${-r * 0.2},${-r * 0.74}" fill="none" stroke="#F7F7F7" stroke-opacity=".18" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
export const dumbbellSVG = (cls = '') => `
  <g class="${cls}">
    <rect x="-4" y="-17" width="8" height="34" rx="2" fill="url(#gChrome)"/>
    <rect x="-13" y="-25" width="26" height="14" rx="4" fill="#161616" stroke="#303030"/>
    <rect x="-13" y="11" width="26" height="14" rx="4" fill="#161616" stroke="#303030"/>
    <rect x="-13" y="-20" width="26" height="3" fill="#E82226"/>
    <rect x="-13" y="17" width="26" height="3" fill="#E82226"/>
  </g>`;

// ---- Hero: glass door + fob reader ----
export function door() {
  return mk(`
    <g clip-path="url(#doorClip)">
      <g class="d-slide">
        <rect x="-62" y="-356" width="124" height="356" fill="url(#gGlass)" stroke="#303030" stroke-width="2"/>
        <path d="M-46,-336 L-12,-336 L-58,-60 L-58,-210Z" fill="#F7F7F7" opacity=".05"/>
        <rect x="-50" y="-196" width="7" height="70" rx="3.5" fill="url(#gChrome)"/>
      </g>
    </g>
    <rect x="-74" y="-370" width="13" height="370" fill="url(#gSteel)"/>
    <rect x="61" y="-370" width="13" height="370" fill="url(#gSteel)"/>
    <rect x="-74" y="-388" width="148" height="22" fill="url(#gSteel)"/>
    <rect x="-46" y="-384" width="92" height="13" fill="#050505"/>
    <text x="0" y="-374" text-anchor="middle" font-family="Fjalla One, sans-serif" font-size="10" letter-spacing="2.5" fill="#E2E2E2">HARDWORX</text>
    <rect x="-112" y="-176" width="8" height="176" fill="url(#gSteel)"/>
    <rect x="-120" y="-4" width="24" height="4" fill="#303030"/>
    <g class="d-fob" transform="translate(-108 -184)">
      <rect x="-10" y="-17" width="20" height="34" rx="4" fill="#161616" stroke="#303030"/>
      <circle class="d-led" cx="0" cy="-7" r="4" fill="#E82226"/>
      <circle class="d-ledglow" cx="0" cy="-7" r="13" fill="#E82226" opacity=".25"/>
      <path d="M-4.5,4 a5.5,5.5 0 0 1 9,0 M-7,9 a9,9 0 0 1 14,0" fill="none" stroke="#919191" stroke-width="1.3"/>
    </g>`);
}

// ---- Treadmill (faces +x, console at front) ----
export function treadmill() {
  return mk(`
    <path d="M-96,-6 L96,-6 L104,-22 L-90,-22Z" fill="url(#gSteel)"/>
    <rect x="-92" y="-24" width="190" height="6" rx="3" fill="#050505"/>
    <line class="tm-belt" x1="-90" y1="-21" x2="96" y2="-21" stroke="#3a3a3c" stroke-width="2.5" stroke-dasharray="10 9"/>
    <circle cx="-88" cy="-14" r="8" fill="#161616" stroke="#303030"/><circle cx="98" cy="-14" r="8" fill="#161616" stroke="#303030"/>
    <path d="M86,-22 L112,-150 L124,-150 L100,-22Z" fill="url(#gRed)"/>
    <path d="M34,-104 L118,-112" stroke="url(#gChrome)" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(118 -158) rotate(-14)">
      <rect x="-26" y="-14" width="52" height="28" rx="5" fill="#161616" stroke="#303030" stroke-width="1.5"/>
      <rect x="-19" y="-8" width="38" height="13" rx="2" fill="#050505"/>
      <text class="tm-read" x="0" y="2.5" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-weight="700" font-size="9" fill="#E82226">0.0</text>
    </g>`);
}

// ---- Lat pulldown (pin-stack); seat at x=0 ----
export function pulldown() {
  let plates = '';
  for (let i = 0; i < 12; i++) plates += `<rect x="112" y="${-24 - i * 9}" width="40" height="8" rx="1.5" fill="${i < 7 ? '#161616' : '#1f1f21'}" stroke="#050505"/>`;
  let top = '';
  for (let i = 0; i < 5; i++) top += `<rect x="112" y="${-24 - (12 + i) * 9}" width="40" height="8" rx="1.5" fill="#1f1f21" stroke="#050505"/>`;
  return mk(`
    <rect x="-64" y="-10" width="232" height="10" rx="3" fill="url(#gRedV)"/>
    <rect x="96" y="-322" width="16" height="314" fill="url(#gRed)"/>
    <rect x="152" y="-322" width="16" height="314" fill="url(#gRed)"/>
    <rect x="118" y="-300" width="3" height="282" fill="url(#gChrome)"/><rect x="143" y="-300" width="3" height="282" fill="url(#gChrome)"/>
    ${plates}
    <g class="pd-top">${top}<rect x="129" y="-212" width="6" height="190" fill="url(#gChrome)"/></g>
    <rect x="-34" y="-334" width="210" height="16" rx="4" fill="url(#gRed)"/>
    <circle cx="-14" cy="-318" r="10" fill="#161616" stroke="url(#gChrome)" stroke-width="3"/>
    <circle cx="132" cy="-318" r="10" fill="#161616" stroke="url(#gChrome)" stroke-width="3"/>
    <path class="pd-cable" d="" fill="none" stroke="#C6C6C6" stroke-width="1.6"/>
    <path class="pd-cable2" d="" fill="none" stroke="#C6C6C6" stroke-width="1.6"/>
    <rect x="-8" y="-72" width="14" height="64" fill="url(#gRed)"/>
    <rect x="-34" y="-84" width="70" height="14" rx="6" fill="url(#gPad)"/>
    <rect x="56" y="-140" width="12" height="132" fill="url(#gRed)"/>`,
  `
    <g class="pd-bar"><rect x="-56" y="-3" width="112" height="6" rx="3" fill="url(#gChrome)"/><rect x="-62" y="-5" width="16" height="10" rx="4" fill="#161616"/><rect x="46" y="-5" width="16" height="10" rx="4" fill="#161616"/><line x1="0" y1="0" x2="0" y2="-10" stroke="#C6C6C6" stroke-width="1.6"/></g>
    <g transform="translate(62 -134)"><rect x="-14" y="-10" width="28" height="20" rx="10" fill="url(#gPad)"/></g>`);
}

// ---- Plate-loaded chest press; seat at x=0 ----
export function chestPress() {
  return mk(`
    <rect x="-92" y="-10" width="210" height="10" rx="3" fill="url(#gRedV)"/>
    <path d="M-70,-10 L-58,-292 L-44,-292 L-52,-10Z" fill="url(#gRed)"/>
    <rect x="-66" y="-304" width="44" height="16" rx="5" fill="url(#gRed)"/>
    <rect x="-6" y="-72" width="14" height="62" fill="url(#gRed)"/>
    <rect x="-38" y="-84" width="74" height="14" rx="6" fill="url(#gPad)"/>
    <path d="M-48,-90 L-34,-90 L-40,-246 L-56,-246Z" fill="url(#gRed)"/>
    <rect x="-46" y="-244" width="18" height="152" rx="7" fill="url(#gPad)" transform="rotate(4 -37 -168)"/>
    <g class="cp-armF"><path class="cp-lever" d="" fill="none" stroke="#9A1217" stroke-width="12" stroke-linecap="round"/><g class="cp-plF">${plateSVG(34)}</g></g>`,
  `
    <g class="cp-armN"><path class="cp-lever" d="" fill="none" stroke="url(#gRed)" stroke-width="13" stroke-linecap="round"/><rect class="cp-grip" x="-5" y="-16" width="10" height="32" rx="5" fill="#161616"/><g class="cp-plN">${plateSVG(38)}</g></g>
    <circle cx="-51" cy="-292" r="9" fill="#161616" stroke="url(#gChrome)" stroke-width="3"/>`);
}

// ---- Dumbbell rack ----
export function dbRack() {
  let tier = (y, n, skip) => { let s = ''; for (let i = 0; i < n; i++) { if (i === skip) continue; const x = -66 + i * 26; s += `<g transform="translate(${x} ${y}) rotate(90)">${dumbbellSVG()}</g>`; } return s; };
  return mk(`
    <path d="M-86,0 L-74,-118 L-62,-118 L-72,0Z M86,0 L74,-118 L62,-118 L72,0Z" fill="url(#gRed)"/>
    <rect x="-84" y="-66" width="168" height="8" rx="3" fill="url(#gRedV)"/>
    <rect x="-80" y="-118" width="160" height="8" rx="3" fill="url(#gRedV)"/>
    ${tier(-82, 6, -1)}
    <g class="db-row">${tier(-134, 6, 2)}</g>
    <g class="db-pair" transform="translate(-14 -134) rotate(90)">${dumbbellSVG()}</g>`,
  `<g class="db-N">${dumbbellSVG()}</g>`);
}

// ---- Flat bench ----
export function bench() {
  return mk(`
    <rect x="-60" y="-84" width="122" height="14" rx="6" fill="url(#gPad)"/>
    <rect x="-46" y="-72" width="10" height="64" fill="url(#gRed)"/><rect x="38" y="-72" width="10" height="64" fill="url(#gRed)"/>
    <rect x="-62" y="-10" width="36" height="10" rx="3" fill="url(#gRedV)"/><rect x="28" y="-10" width="36" height="10" rx="3" fill="url(#gRedV)"/>`,
  `<g class="ph"><rect x="-6" y="-11" width="12" height="22" rx="2.5" fill="#161616" stroke="#919191" stroke-width="1"/><rect class="ph-scr" x="-4.5" y="-8.5" width="9" height="16" rx="1" fill="#E82226" opacity=".9"/></g>`);
}

// ---- Infrared sauna cabin (member sits at x=0) ----
export function sauna() {
  let slats = ''; for (let i = 0; i < 9; i++) slats += `<rect x="${-118 + i * 26}" y="-300" width="24" height="300" fill="${i % 2 ? '#141415' : '#18181a'}"/>`;
  return mk(`
    <rect x="-122" y="-306" width="244" height="306" fill="#0b0b0c" stroke="#303030" stroke-width="2"/>
    ${slats}
    <ellipse class="sa-heat" cx="0" cy="-150" rx="150" ry="170" fill="url(#gHeat)" opacity="0"/>
    <g class="sa-panels"><rect x="-106" y="-250" width="18" height="150" rx="3" fill="#E82226" opacity=".25"/><rect x="88" y="-250" width="18" height="150" rx="3" fill="#E82226" opacity=".25"/></g>
    <rect x="-112" y="-86" width="224" height="14" rx="3" fill="#1f1f21" stroke="#303030"/>
    <rect x="-112" y="-72" width="224" height="72" fill="#121213"/>`,
  `
    <rect x="-122" y="-306" width="244" height="306" fill="url(#gGlass)" stroke="#3a3a3c" stroke-width="5"/>
    <rect x="-126" y="-322" width="252" height="18" rx="3" fill="#1b1b1b"/>
    <text x="0" y="-309" text-anchor="middle" font-family="Fjalla One, sans-serif" font-size="10" letter-spacing="3" fill="#E82226" class="sa-sign" opacity=".5">INFRARED</text>
    <rect x="96" y="-180" width="6" height="60" rx="3" fill="url(#gChrome)"/>`);
}

// ---- Cold plunge tub ----
export function plunge() {
  let frost = '';
  const rnd = mulberry(7);
  for (let i = 0; i < 26; i++) { const x = -84 + rnd() * 168, y = -78 + rnd() * 70, r = 3 + rnd() * 6; frost += `<path d="M${x - r},${y} L${x + r},${y} M${x},${y - r} L${x},${y + r} M${x - r * .7},${y - r * .7} L${x + r * .7},${y + r * .7} M${x - r * .7},${y + r * .7} L${x + r * .7},${y - r * .7}" stroke="#F7F7F7" stroke-width="1" stroke-linecap="round"/>`; }
  let steam = '';
  for (let i = 0; i < 7; i++) steam += `<ellipse class="st" data-i="${i}" cx="${-60 + i * 20}" cy="-96" rx="22" ry="15" fill="url(#gSteam)" opacity="0"/>`;
  return mk(`
    <ellipse cx="0" cy="-86" rx="96" ry="12" fill="#050505" stroke="url(#gChrome)" stroke-width="3"/>
    <ellipse class="pl-water" cx="0" cy="-80" rx="88" ry="8" fill="url(#gWater)"/>`,
  `
    <path d="M-96,-86 L-90,-6 Q-90,0 -84,0 L84,0 Q90,0 90,-6 L96,-86 A96,12 0 0 1 -96,-86Z" fill="url(#gSteel)" stroke="#5a5a5c" stroke-width="1.5"/>
    <path d="M-92,-74 L92,-74" stroke="#E2E2E2" stroke-opacity=".25" stroke-width="2"/>
    <g class="pl-frost" opacity="0">${frost}</g>
    <g class="pl-steam">${steam}</g>
    <path d="M-92,-86 A92,10 0 0 0 92,-86" fill="none" stroke="url(#gWater)" stroke-width="3"/>`);
}

// ---- Merch rack ----
export function merchRack() {
  const tee = (x, cls = '') => `<g class="${cls}" transform="translate(${x} -176)"><path d="M0,-6 L0,-12 M-6,-14 Q0,-20 6,-14" stroke="#C6C6C6" stroke-width="1.4" fill="none"/><path d="M-10,-4 L-22,0 L-28,16 L-19,19 L-16,12 L-15,52 L15,52 L16,12 L19,19 L28,16 L22,0 L10,-4 Q0,4 -10,-4Z" fill="#141416" stroke="#303030" stroke-width="1.2"/><circle cx="0" cy="14" r="5" fill="#E82226"/></g>`;
  return mk(`
    <rect x="-96" y="-196" width="192" height="6" rx="3" fill="url(#gChrome)"/>
    <path d="M-90,0 L-90,-196 M90,0 L90,-196" stroke="url(#gChrome)" stroke-width="5"/>
    <path d="M-110,0 L-70,0 M70,0 L110,0" stroke="#3a3a3c" stroke-width="6" stroke-linecap="round"/>
    ${tee(-62)}${tee(-28)}${tee(40)}${tee(72)}
    <g class="mr-tee">${tee(6)}</g>`);
}

// ---- Squat rack ----
export function squatRack() {
  return mk(`
    <rect x="-100" y="-10" width="200" height="10" rx="3" fill="url(#gRedV)"/>
    <rect x="-86" y="-312" width="16" height="304" fill="url(#gRed)"/>
    <rect x="70" y="-312" width="16" height="304" fill="url(#gRed)"/>
    <rect x="-92" y="-324" width="184" height="14" rx="3" fill="url(#gRed)"/>
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="-78" cy="${-40 - i * 18}" r="1.8" fill="#050505"/><circle cx="78" cy="${-40 - i * 18}" r="1.8" fill="#050505"/>`).join('')}
    <g transform="translate(-78 -218)">${plateSVG(30)}</g>
    <rect x="-108" y="-220" width="216" height="5" rx="2.5" fill="url(#gChrome)"/>`);
}

// ---- Deadlift barbell (seen end-on: plates are discs at the hands) ----
export function barbell() {
  return mk(`<g class="bb-F">${plateSVG(37)}</g>`, `<g class="bb-N">${plateSVG(39)}<rect x="-3" y="-3" width="6" height="6" fill="url(#gChrome)"/></g>`);
}

// ---- Lockers + shower ----
export function lockers() {
  let ls = '';
  for (let i = 0; i < 4; i++) {
    const x = -132 + i * 66;
    ls += `<g transform="translate(${x} 0)"><rect x="0" y="-270" width="62" height="270" fill="url(#gSteel)" stroke="#050505"/>${i === 2 ? '' : `<g>${vents()}<rect x="48" y="-150" width="5" height="22" rx="2" fill="url(#gChrome)"/></g>`}</g>`;
  }
  return mk(`
    ${ls}
    <rect x="0" y="-266" width="58" height="262" fill="#050505"/>
    <g class="lk-door" transform="translate(0 0)"><rect x="0" y="-270" width="62" height="270" fill="url(#gSteel)" stroke="#050505"/>${vents()}<rect x="48" y="-150" width="5" height="22" rx="2" fill="url(#gChrome)"/></g>
    <g transform="translate(250 0)">
      <rect x="-70" y="-300" width="140" height="300" fill="#0e0e0f" stroke="#1f1f21"/>
      <path d="M40,-300 L40,-250 Q40,-236 26,-236 L6,-236" fill="none" stroke="url(#gChrome)" stroke-width="5"/>
      <path d="M-8,-244 L10,-244 L14,-228 L-12,-228Z" fill="url(#gChrome)"/>
      <g class="sh-drops">${Array.from({ length: 9 }, (_, i) => `<line class="dr" data-i="${i}" x1="${-10 + i * 3}" y1="-224" x2="${-14 + i * 3.6}" y2="-200" stroke="#E2E2E2" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>`).join('')}</g>
      <g class="sh-steam">${Array.from({ length: 6 }, (_, i) => `<ellipse class="st" data-i="${i}" cx="${-30 + i * 12}" cy="-150" rx="34" ry="24" fill="url(#gSteam)" opacity="0"/>`).join('')}</g>
    </g>`);
}
function vents() { let v = ''; for (let j = 0; j < 4; j++) v += `<rect x="12" y="${-250 + j * 7}" width="38" height="3" rx="1.5" fill="#050505"/>`; return v; }

export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
