// Isometric engine-room world: sea chest, strainer, pump set, central cooler,
// main engine, PLC cabinet. Units are centimetres; x and y on the floor, z up.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { tubePieces, tubeSvg } from "./kit/tube.mjs";

export const W = 1920;
export const H = 1080;

// ---- layout -------------------------------------------------------------
export const AX = { y: 0, z: 46 }; // pump shaft axis
export const X = { eye: 140, voluteC: 170, frame0: 186, frame1: 238, cpl0: 252, cpl1: 268, motor0: 270, motor1: 362, fan1: 382 };
export const VOL = { r0: 26, r1: 36, half: 11 };
export const BEARINGS = [196, 228];
export const SENSOR = [245, 0, AX.z + 6];
export const STRAINER = [30, 0];
export const COOLER = { x0: -40, x1: 94, y0: -178, y1: -88 };
export const NOZ = {
  swIn: [94, -110, 92],
  swOut: [94, -110, 22],
  fwIn: [94, -156, 22],
  fwOut: [94, -156, 92],
};
export const ENGINE = { x: 196, y: -360, w: 300, d: 172, r: 6 };
export const CAB = { x: 440, y: -110, w: 52, d: 56, r: 2 };
export const HULL = { x: -90, y: 96, w: 250, d: 12, r: 1 };
export const SEA = { x: -90, y: 108, w: 250, d: 80, r: 0 };

const corners = [
  ...k.boxCorners({ x: -95, y: -370, w: 600, d: 560, r: 0 }, -80, 0),
  [ENGINE.x + ENGINE.w, ENGINE.y, 250],
  [-60, -200, 160],
  [460, 30, 190],
];
export const P = k.fitProjection(corners, W, H, { pad: 70, azimuth: 45 });
export const at = (p) => k.iso(p, P);
const VIEW = G.viewOf(P);
const depth = (p) => G.dot3(p, VIEW);

const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);

// ---- item list (painter's order by depth) ------------------------------
const items = [];
function put(p, svg, { part = "", bias = 0 } = {}) {
  items.push({ key: depth(p) + bias, svg, part });
}
const halo = (plan, z, h) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;

// frames
const FX = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const FY = (o) => G.frameOf(o, [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const FZ = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);

// ---- routes (also used for the water overlay) ---------------------------
export const ROUTES = {};
function route(name, pts, r, { bend = 14, flanges = [true, true], gaps = [], tone = "hi", part = "", maxLength = 18, bias = 0 } = {}) {
  const f = G.fillet(pts, bend, 7, { P, tube: r });
  const total = G.pathLength(f);
  ROUTES[name] = { pts: f, r, total };
  const flangeAt = [];
  if (flanges[0]) flangeAt.push(1.6);
  if (flanges[1]) flangeAt.push(total - 1.6);
  const fg = flangeAt.map((s) => [s - 1.6, s + 1.6]);
  const pieces = tubePieces(f, r, P, { maxLength, gaps: [...fg, ...gaps].sort((a, b) => a[0] - b[0]) });
  for (const piece of pieces) put(piece.mid, tubeSvg(piece, { tone }), { part, bias });
  for (const s of flangeAt) {
    const c = G.pointAlong(f, s);
    const t = G.tangentAlong(f, s);
    const F = G.frameAlong(c, t);
    put(c, S(G.disc(-1.6, 1.6, r + 4.5, F, P), { tone }) + D(G.dotsOf(F, 1.6, r + 2.6, 8, P, { fade: [0.04, 0.42] }), { size: 0.55 }), { part, bias: bias + 0.5 });
  }
  return f;
}
function flangeOn(name, s, { r = null, w = 3.2, tone = "hi", part = "" } = {}) {
  const R = ROUTES[name];
  const c = G.pointAlong(R.pts, s);
  const F = G.frameAlong(c, G.tangentAlong(R.pts, s));
  put(c, S(G.disc(-w / 2, w / 2, (r ?? R.r) + 4.5, F, P), { tone }) + D(G.dotsOf(F, w / 2, (r ?? R.r) + 2.6, 8, P, { fade: [0.04, 0.42] }), { size: 0.55 }), { part, bias: 0.6 });
}

// handwheel valve body sitting on a straight horizontal leg
function gateValve(c, axis, up = 26, part = "") {
  const F = G.frameAlong(c, axis);
  const body = G.solidOf([[-9, 9], [-7, 13, 1], [0, 15, 1], [7, 13, 1], [9, 9]], F, P);
  put(c, S(body, { tone: "hi" }), { part, bias: 1 });
  const bonnet = FZ([c[0], c[1], c[2] + 12]);
  put([c[0], c[1], c[2] + 14], S(G.disc(0, 4, 8, bonnet, P), { tone: "hi" }) + S(G.disc(4, up - 4, 2.2, bonnet, P), { tone: "hi" }), { part, bias: 1.2 });
  const wheel = FZ([c[0], c[1], c[2] + up]);
  const rim = G.ringBand(0, 2.2, 9.5, 12, wheel, P);
  put([c[0], c[1], c[2] + up + 1], S(rim, { tone: "hi" }) + L(G.spokesOf(wheel, 2.2, 2.4, 9.5, 3, P), { tone: "mid" }) + S(G.disc(0, 3, 2.6, wheel, P), { tone: "hi" }), { part, bias: 1.4 });
}

function gauge(c, part = "") {
  // stem + round dial facing +y
  const stem = FZ([c[0], c[1], c[2]]);
  put([c[0], c[1], c[2] + 6], S(G.disc(0, 10, 1.6, stem, P), { tone: "hi" }), { part, bias: 1.5 });
  const face = FY([c[0], c[1] - 3, c[2] + 18]);
  put([c[0], c[1] + 2, c[2] + 18], S(G.disc(0, 5, 8, face, P), { tone: "hi" }) + L(G.circleOf(face, 5, 6.6, P), { tone: "lo" }) + L(k.segment([c[0], c[1] + 2.05, c[2] + 18], [c[0] + 3.6, c[1] + 2.05, c[2] + 22], P), { tone: "lit", free: "end" }), { part, bias: 1.6 });
}

// ---- floor --------------------------------------------------------------
{
  const FL = { x: -90, y: -380, w: 600, d: 476, r: 4 };
  put([0, -2000, -100], S(k.slabOf(FL, -8, 8, P, 4, 0.8), { tone: "mid" }), { bias: 0 });
  let grid = "";
  for (let x = -60; x < 510; x += 40) grid += k.lineOnTop([x, FL.y + 4], [x, FL.y + FL.d - 4], 0, P);
  for (let y = -360; y < 96; y += 40) grid += k.lineOnTop([FL.x + 4, y], [FL.x + FL.w - 4, y], 0, P);
  put([0, -1999, -100], L(grid, { tone: "faint" }));
}

// ---- hull section, sea chest, sea ---------------------------------------
{
  const top = 34;
  put([HULL.x + HULL.w / 2, HULL.y + 6, -20], S(k.slabOf(HULL, -80, top + 80, P, 2, 0.6), { tone: "hi" }), { part: "hull", bias: 400 });
  // section hatching on the cut top
  let hatch = "";
  for (let x = HULL.x + 4; x < HULL.x + HULL.w - 4; x += 6) hatch += k.lineOnTop([x, HULL.y + 1], [Math.min(x + 9, HULL.x + HULL.w - 1), HULL.y + HULL.d - 1], top, P);
  // sea chest grating on the outer face (y = 108)
  const g = { x0: 0, x1: 76, z0: -64, z1: -16 };
  const fy = HULL.y + HULL.d;
  const recess = [[g.x0, fy, g.z0], [g.x1, fy, g.z0], [g.x1, fy, g.z1], [g.x0, fy, g.z1]].map(at);
  let bars = "";
  for (let x = g.x0 + 5; x < g.x1; x += 6) bars += k.segment([x, fy + 0.1, g.z0], [x, fy + 0.1, g.z1], P);
  const outlet = FY([110, fy, 4]);
  put([HULL.x + HULL.w / 2, fy + 1, -20],
    L(hatch, { tone: "lo" }) +
    `<path class="hull-recess" d="M${recess.map((p) => p.join(" ")).join("L")}Z"/>` +
    L(bars, { tone: "mid" }) +
    `<path class="iso-line" data-tone="hi" d="M${recess.map((p) => p.join(" ")).join("L")}Z"/>` +
    D([[g.x0 - 3, g.z0 - 3], [g.x1 + 3, g.z0 - 3], [g.x0 - 3, g.z1 + 3], [g.x1 + 3, g.z1 + 3]].map(([x, z]) => at([x, fy, z])), { size: 0.7 }) +
    S(G.ringBand(0, 3, 9, 15, outlet, P), { tone: "hi" }) + `<path class="hull-hole" d="${G.circleOf(outlet, 3, 9, P)}"/>` +
    L(k.segment([HULL.x, fy, 20], [HULL.x + HULL.w, fy, 20], P), { tone: "faint" }),
    { part: "hull", bias: 401 });
}

// ---- strainer -----------------------------------------------------------
{
  const [sx, sy] = STRAINER;
  const F = FZ([sx, sy, 0]);
  put([sx, sy, 2], halo({ x: sx - 22, y: sy - 22, w: 44, d: 44, r: 22 }, 0, 2));
  for (const [dx, dy] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) put([sx + dx, sy + dy, 4], S(k.cylinder(sx + dx, sy + dy, 2.4, 0, 12, P, 16), { tone: "mid" }), { part: "strainer" });
  put([sx, sy, 30], S(G.solidOf([[10, 16], [14, 20, 1], [60, 20, 1], [62, 19]], F, P), { tone: "hi", inner: L(G.arcOf(F, 36, 20, P), { tone: "faint" }) }), { part: "strainer", bias: 2 });
  put([sx, sy, 64], S(G.disc(62, 66, 25, F, P), { tone: "hi" }) + D(G.dotsOf(F, 66, 22.5, 12, P, { all: true }), { size: 0.6 }), { part: "strainer", bias: 3 });
  put([sx, sy, 70], S(G.solidOf([[66, 21], [70, 18, 1], [74, 10, 1], [75, 4]], F, P), { tone: "hi" }), { part: "strainer", bias: 4 });
  put([sx, sy, 82], S(G.disc(75, 84, 2.2, F, P), { tone: "hi" }) + S(k.slabOf({ x: sx - 12, y: sy - 1.6, w: 24, d: 3.2, r: 1.4 }, 84, 3, P, 2), { tone: "hi" }), { part: "strainer", bias: 5 });
  // small engraved tag
  put([sx, sy + 20, 40], k.faceTextSvg(k.sideMatrix([sx - 9, sy + 20.3], 44, P, "left"), "STRAINER", { size: 3, tone: "lo" }), { part: "strainer", bias: 6 });
}

// ---- pipes: sea chest -> strainer -> pump -----------------------------
const R = 7;
route("sea", [[36, 84, -40], [36, 84, 36], [36, 21, 36]], R, { flanges: [false, true], gaps: [[86, 104]], bend: 16 });
gateValve(G.pointAlong(ROUTES.sea.pts, 95), [0, -1, 0], 30);
route("suction", [[STRAINER[0] + 20, 0, AX.z], [X.eye - 1, 0, AX.z]], R, { gaps: [[34, 46]] });
{
  // butterfly valve between wafer flanges + compound gauge
  const c = [X.eye - 1 - 89 + 40, 0, AX.z];
  const F = FX(c);
  put(c, S(G.disc(-6, 6, R + 6, F, P), { tone: "hi" }) + D(G.dotsOf(F, 6, R + 3.5, 8, P, { fade: [0.04, 0.42] }), { size: 0.55 }), { bias: 1 });
  put([c[0], c[1], c[2] + 18], S(G.disc(R + 4, R + 14, 2, FZ(c), P), { tone: "hi" }) + S(k.slabOf({ x: c[0] - 2, y: c[1] - 9, w: 4, d: 18, r: 1.5 }, c[2] + R + 14, 2.4, P, 2), { tone: "hi" }), { bias: 1.5 });
  gauge([X.eye - 20, 0, AX.z + R]);
}

// ---- pump set -------------------------------------------------------------
const AXF = FX([0, AX.y, AX.z]);
export const ROT_FRAMES = 12;
{
  // skid
  const skid = { x: 128, y: -40, w: 262, d: 80, r: 3 };
  put([200, 0, 1], halo(skid, 0, 8), { bias: -600 });
  put([skid.x + skid.w / 2, 0, 2], S(k.slabOf(skid, 0, 9, P, 3, 0.8), { tone: "mid" }) + L(k.sideSeam(skid, 4.5, P, 3), { tone: "faint" }) + D(k.corners(skid, 8).map(([x, y]) => at([x, y, 9])), { size: 0.7 }), { bias: -500 });

  // volute: spiral prism around the x axis
  const VF = G.frameOf([X.voluteC, 0, AX.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const spiral = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const r = VOL.r0 + (VOL.r1 - VOL.r0) * (i / 64);
    spiral.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  put([X.voluteC, 0, AX.z], S(G.prismOf(VF, spiral, -VOL.half, VOL.half, P), { tone: "hi", inner: L(G.arcOf(VF, 0, VOL.r1 - 0.4, P, { least: 0.1 }), { tone: "faint" }) }), { part: "volute", bias: 6 });
  put([X.voluteC + VOL.half, 0, AX.z], D(G.dotsOf(VF, VOL.half, VOL.r0 - 3, 12, P, { all: true }), { size: 0.6 }), { part: "volute", bias: 7 });
  // casing feet
  put([X.voluteC, 0, 10], S(k.slabOf({ x: X.voluteC - 9, y: -22, w: 18, d: 44, r: 1.5 }, 9, 8, P, 2, 0.4), { tone: "mid" }), { part: "volute", bias: -10 });
  // suction cone and nozzle (axial, into the eye)
  put([X.eye + 8, 0, AX.z], S(G.solidOf([[X.eye - X.voluteC, R + 4.5], [X.eye - X.voluteC + 3, R + 4.5], [X.eye - X.voluteC + 3, R + 1], [-VOL.half - 2, 14, 1], [-VOL.half, 16]], VF, P, { rims: "first" }), { tone: "hi" }), { part: "volute", bias: 3 });
  // discharge nozzle (tangential, vertical)
  const DN = FZ([X.voluteC, 18, AX.z + 20]);
  put([X.voluteC, 18, AX.z + 30], S(G.solidOf([[0, 13], [8, 11, 1], [18, R + 1, 1], [20, R]], DN, P), { tone: "hi" }), { part: "volute", bias: 8 });
  // bearing frame (housing) with fins
  const BF = FX([0, 0, AX.z]);
  const frameProfile = [[X.frame0, 27], [X.frame0 + 4, 27], [X.frame0 + 6, 20, 1], [X.frame0 + 14, 17, 1], [X.frame1 - 4, 17], [X.frame1, 15]];
  const fins = G.ribsOf(BF, X.frame0 + 18, X.frame1 - 8, 17, 18, P, { fade: [0.05, 0.45] });
  put([212, 0, AX.z], S(G.solidOf(frameProfile, BF, P), { tone: "hi", inner: L(BEARINGS.map((x) => G.arcOf(BF, x, 17, P)).join(""), { tone: "lo" }) }) + k.fadedSvg(fins, { tone: "faint" }), { part: "frame", bias: 2 });
  put([212, 0, 12], S(k.slabOf({ x: 200, y: -16, w: 30, d: 32, r: 2 }, 9, AX.z - 17 - 9 + 2, P, 3, 0.4), { tone: "mid" }), { part: "frame", bias: -20 });
  put([212, 0, 18], D([[202, -12], [202, 12], [228, -12], [228, 12]].map(([x, y]) => at([x, y, 9])), { size: 0.7 }), { part: "frame", bias: -19 });
  // oil sight glass and breather on the bearing housing
  put([212, 17, AX.z], S(G.disc(0, 2.5, 3, FY([212, 16, AX.z - 4]), P), { tone: "hi" }) + L(G.circleOf(FY([212, 16, AX.z - 4]), 2.5, 1.6, P), { tone: "lo" }), { part: "frame", bias: 3 });
  put([222, 0, AX.z + 18], S(G.disc(0, 6, 2.4, FZ([222, 0, AX.z + 16]), P), { tone: "hi" }) + S(G.disc(6, 8, 3.4, FZ([222, 0, AX.z + 16]), P), { tone: "hi" }), { part: "frame", bias: 3 });
  // shaft (exposed between frame and coupling) – rotating key line frames
  put([245, 0, AX.z], S(G.disc(X.frame1, X.cpl0, 5, AXF, P), { tone: "hi" }), { part: "shaft", bias: 4 });
  // coupling halves + spacer
  put([X.cpl0 + 4, 0, AX.z], S(G.disc(X.cpl0, X.cpl0 + 6, 13, AXF, P, { bevel: 0.6 }), { tone: "hi" }), { part: "shaft", bias: 5 });
  put([X.cpl1 - 4, 0, AX.z], S(G.disc(X.cpl0 + 7, X.cpl1, 13, AXF, P), { tone: "hi" }), { part: "shaft", bias: 5.5 });
  // rotating texture: bolt dots on the coupling rim + key mark on the shaft
  let rot = "";
  for (let i = 0; i < ROT_FRAMES; i++) {
    const ph = (i / ROT_FRAMES) * ((Math.PI * 2) / 6);
    const dots = G.dotsOf(AXF, X.cpl0 + 3, 13, 6, P, { phase: ph, fade: [0.02, 0.4] });
    const ribs = G.ribsOf(AXF, X.cpl0 + 7.6, X.cpl1 - 0.6, 13, 12, P, { phase: ph, fade: [0.05, 0.5] });
    const key = G.ribsOf(AXF, X.frame1 + 1, X.cpl0 - 1, 5, 1, P, { phase: ph * 6, fade: [0.0, 0.3] });
    rot += `<g class="rot" data-i="${i}"${i ? ' style="display:none"' : ""}>${D(dots, { size: 0.9, tone: "hi" })}${k.fadedSvg(ribs, { tone: "lo" })}${k.fadedSvg(key, { tone: "lit" })}</g>`;
  }
  put([X.cpl1, 0, AX.z], rot, { part: "shaft", bias: 6 });
  // motor
  const MF = FX([0, 0, AX.z]);
  const MR = 30;
  put([316, 0, AX.z], S(G.solidOf([[X.motor0, 24], [X.motor0 + 4, MR - 2, 1], [X.motor0 + 8, MR], [X.motor1 - 8, MR], [X.motor1 - 4, MR - 2, 1], [X.motor1, 24]], MF, P), { tone: "hi", inner: L(G.arcOf(MF, X.motor0 + 8, MR, P) + G.arcOf(MF, X.motor1 - 8, MR, P), { tone: "faint" }) }) + k.fadedSvg(G.ribsOf(MF, X.motor0 + 10, X.motor1 - 10, MR, 40, P, { fade: [0.04, 0.45] }), { tone: "lo" }), { part: "motor", bias: 3 });
  // fan cover with grille rings
  put([X.motor1 + 10, 0, AX.z], S(G.solidOf([[X.motor1, 26], [X.fan1 - 4, 26, 1], [X.fan1, 20, 1], [X.fan1 + 1, 10]], MF, P), { tone: "hi" }) + L([X.motor1 + 4, X.motor1 + 8, X.motor1 + 12].map((s) => G.arcOf(MF, s, 26, P)).join(""), { tone: "faint" }), { part: "motor", bias: 3.5 });
  // feet
  for (const x of [X.motor0 + 14, X.motor1 - 22]) put([x, 0, 12], S(k.slabOf({ x, y: -26, w: 12, d: 52, r: 1.5 }, 9, 12, P, 2, 0.4), { tone: "mid" }) + D([at([x + 6, -22, 21]), at([x + 6, 22, 21])], { size: 0.7 }), { part: "motor", bias: -30 });
  // terminal box + gland
  const tb = { x: 300, y: -12, w: 26, d: 24, r: 2 };
  put([313, 0, AX.z + MR + 6], S(k.slabOf(tb, AX.z + MR - 4, 14, P, 3, 0.6), { tone: "hi", inner: L(k.sideSeam(tb, AX.z + MR + 6, P, 3), { tone: "faint" }) }) + D(k.corners(tb, 3).map(([x, y]) => at([x, y, AX.z + MR + 10])), { size: 0.6 }), { part: "motor", bias: 6 });
  // nameplate on +y side
  put([300, MR, AX.z], S(k.slabOf({ x: 290, y: MR - 1, w: 22, d: 1.6, r: 0.4 }, AX.z - 6, 14, P, 2), { tone: "hi" }) + L([3, 6, 9].map((dz) => k.segment([292, MR + 0.7, AX.z - 6 + dz], [308, MR + 0.7, AX.z - 6 + dz], P)).join(""), { tone: "lo", free: true }), { part: "motor", bias: 10 });
  // lifting eye
  put([330, 0, AX.z + MR + 4], S(G.ringBand(-1, 1, 2.2, 4.4, G.frameOf([330, 0, AX.z + MR + 5], [0, 1, 0], [1, 0, 0], [0, 0, 1]), P), { tone: "hi" }), { part: "motor", bias: 5 });
}

// ---- RPM sensor on a bracket over the shaft ------------------------------
{
  const [x, y, z] = SENSOR;
  const F = FZ([x, y, z]);
  put([x, y + 10, z + 26], S(k.slabOf({ x: x - 3, y: 10, w: 6, d: 4, r: 0.8 }, 9, z + 30 - 9, P, 2, 0.3), { tone: "mid" }), { part: "sensor", bias: 10 });
  put([x, y + 6, z + 30], S(k.slabOf({ x: x - 3, y: -2, w: 6, d: 14, r: 0.8 }, z + 26, 4, P, 2, 0.3), { tone: "mid" }), { part: "sensor", bias: 11 });
  put([x, y, z + 16], S(G.solidOf([[2, 3], [4, 3.6], [24, 3.6], [26, 2.6]], F, P), { tone: "hi", inner: L(G.arcOf(F, 18, 3.6, P), { tone: "faint" }) }) + S(G.disc(17, 20, 5.4, F, P), { tone: "hi" }), { part: "sensor", bias: 12 });
}

// ---- discharge, overboard and fresh-water lines --------------------------
route("discharge", [[X.voluteC, 18, AX.z + 40], [X.voluteC, 18, 156], [X.voluteC, NOZ.swIn[1], 156], [126, NOZ.swIn[1], 156], [126, NOZ.swIn[1], NOZ.swIn[2]], [NOZ.swIn[0] + 1, NOZ.swIn[1], NOZ.swIn[2]]], R, { gaps: [[44, 62]], bend: 16 });
{
  const s = 53;
  const c = G.pointAlong(ROUTES.discharge.pts, s);
  const F = FZ(c);
  // non-return + gate valve body on the riser
  put(c, S(G.solidOf([[-9, 9], [-7, 13, 1], [0, 15, 1], [7, 13, 1], [9, 9]], F, P), { tone: "hi" }), { bias: 3 });
  const stem = G.frameOf(c, [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  put([c[0], c[1] + 20, c[2]], S(G.disc(12, 24, 2.2, stem, P), { tone: "hi" }) + S(G.ringBand(24, 26, 9, 11.5, stem, P), { tone: "hi" }) + L(G.spokesOf(stem, 26, 2.4, 9, 3, P), { tone: "mid" }), { bias: 4 });
  gauge([X.voluteC - 9, 18, 94]);
}
route("overboard", [[NOZ.swOut[0] + 1, NOZ.swOut[1], NOZ.swOut[2]], [112, NOZ.swOut[1], NOZ.swOut[2]], [112, 100, NOZ.swOut[2]]], R, { gaps: [[126, 144]], flanges: [true, false], bend: 14, bias: 0 });
gateValve(G.pointAlong(ROUTES.overboard.pts, 135), [0, 1, 0], 30);
route("fwHot", [[ENGINE.x + 44, ENGINE.y + ENGINE.d + 1, 22], [ENGINE.x + 44, NOZ.fwIn[1], 22], [NOZ.fwIn[0] + 1, NOZ.fwIn[1], 22]], R, { tone: "hi", bend: 14 });
route("fwCold", [[NOZ.fwOut[0] + 1, NOZ.fwOut[1], NOZ.fwOut[2]], [ENGINE.x + 84, NOZ.fwOut[1], NOZ.fwOut[2]], [ENGINE.x + 84, ENGINE.y + ENGINE.d + 1, NOZ.fwOut[2]]], R, { tone: "hi", bend: 14 });
// FW circulating pump hint: small motor on the cold line support
// ---- central cooler (plate heat exchanger) -------------------------------
{
  const C = COOLER;
  put([C.x0, -133, 2], halo({ x: C.x0 - 6, y: C.y0, w: C.x1 - C.x0 + 6, d: C.y1 - C.y0, r: 4 }, 0, 4));
  // rear support column
  put([C.x0 - 6, -133, 60], S(k.slabOf({ x: C.x0 - 10, y: C.y0 + 6, w: 10, d: C.y1 - C.y0 - 12, r: 1 }, 0, 128, P, 2, 0.5), { tone: "mid" }), { part: "cooler", bias: 0 });
  // carrying bar and guide bar
  put([30, -133, 124], S(k.slabOf({ x: C.x0 - 10, y: -137, w: C.x1 - C.x0 + 10, d: 8, r: 1 }, 118, 8, P, 2, 0.5), { tone: "mid" }), { part: "cooler", bias: 60 });
  put([30, -133, 6], S(k.slabOf({ x: C.x0 - 10, y: -137, w: C.x1 - C.x0 + 10, d: 8, r: 1 }, 0, 8, P, 2, 0.5), { tone: "mid" }), { part: "cooler", bias: -60 });
  // pressure plate
  put([C.x0 + 6, -133, 60], S(k.slabOf({ x: C.x0, y: C.y0, w: 10, d: C.y1 - C.y0, r: 2 }, 8, 112, P, 2, 0.6), { tone: "hi" }), { part: "cooler", bias: 1 });
  // plate pack: many thin plates
  const pack = { x: C.x0 + 10, y: C.y0 + 4, w: C.x1 - 14 - C.x0 - 10, d: C.y1 - C.y0 - 8, r: 1 };
  let plates = "";
  for (let x = pack.x + 1.6; x < pack.x + pack.w - 0.5; x += 2.2) {
    plates += k.segment([x, pack.y + pack.d, 12], [x, pack.y + pack.d, 114], P) + k.lineOnTop([x, pack.y], [x, pack.y + pack.d], 114, P);
  }
  put([pack.x + pack.w / 2, -133, 60], S(k.slabOf(pack, 12, 102, P, 1, 0), { tone: "hi", inner: L(plates, { tone: "faint" }) }), { part: "cooler", bias: 2 });
  // fixed head plate with nozzles
  const head = { x: C.x1 - 14, y: C.y0, w: 14, d: C.y1 - C.y0, r: 2 };
  put([C.x1 - 7, -133, 60], S(k.slabOf(head, 0, 124, P, 2, 0.8), { tone: "hi", inner: L(k.sideSeam(head, 112, P, 2), { tone: "faint" }) }), { part: "cooler", bias: 3 });
  // tightening bolts along x at the four corners with nuts
  for (const [y, z] of [[C.y0 - 3, 20], [C.y0 - 3, 104], [C.y1 + 3, 20], [C.y1 + 3, 104]]) {
    const F = FX([0, y, z]);
    put([30, y, z], S(G.disc(C.x0 - 6, C.x1 + 6, 2, F, P), { tone: "hi" }) + S(G.disc(C.x1, C.x1 + 4, 3.6, F, P), { tone: "hi" }) + S(G.disc(C.x0 - 4, C.x0, 3.6, F, P), { tone: "hi" }), { part: "cooler", bias: y > -133 ? 20 : -20 });
  }
  // nozzles: short stubs on +x face
  for (const n of Object.values(NOZ)) {
    const F = FX(n);
    put([n[0] + 3, n[1], n[2]], S(G.disc(-1, 2, R + 5, F, P), { tone: "hi" }) + D(G.dotsOf(F, 2, R + 3, 8, P, { all: true }), { size: 0.55 }), { part: "cooler", bias: 4 });
  }
  // name tag on head
  put([C.x1, -100, 116], k.faceTextSvg(k.sideMatrix([C.x1 + 0.2, -160], 118, P, "right"), "CENTRAL COOLER", { size: 3.4, tone: "lo" }), { part: "cooler", bias: 6 });
}

// ---- main engine (stylised) ----------------------------------------------
{
  const E = ENGINE;
  put([E.x + E.w / 2, E.y, 2], halo(E, 0, 6));
  const out = [];
  const crank = { x: E.x, y: E.y + 16, w: E.w, d: E.d - 16, r: 4 };
  out.push(S(k.slabOf(E, 0, 30, P, 4, 1.2), { tone: "mid" }));
  out.push(S(k.slabOf(crank, 30, 70, P, 4, 1), { tone: "hi", inner: L(k.sideSeam(crank, 60, P, 4), { tone: "faint" }) }));
  let doors = "";
  for (let i = 0; i < 6; i++) {
    const x0 = E.x + 22 + i * 46;
    const fy = crank.y + crank.d + 0.2;
    const pts = [[x0, fy, 40], [x0 + 30, fy, 40], [x0 + 30, fy, 88], [x0, fy, 88]].map(at);
    doors += `M${pts.map((p) => p.join(" ")).join("L")}Z`;
  }
  out.push(L(doors, { tone: "lo" }));
  out.push(D([0, 1, 2, 3, 4, 5].flatMap((i) => [[E.x + 22 + i * 46 + 4, 44], [E.x + 22 + i * 46 + 26, 44], [E.x + 22 + i * 46 + 4, 84], [E.x + 22 + i * 46 + 26, 84]]).map(([x, z]) => at([x, crank.y + crank.d + 0.2, z])), { size: 0.6 }));
  const block = { x: E.x + 8, y: E.y + 26, w: E.w - 16, d: E.d - 36, r: 4 };
  out.push(S(k.slabOf(block, 100, 70, P, 4, 1), { tone: "hi", inner: L(k.sideSeam(block, 150, P, 4), { tone: "faint" }) }));
  const EX = FX([0, E.y + 18, 192]);
  out.push(S(G.disc(E.x + 6, E.x + E.w - 6, 11, EX, P), { tone: "mid" }));
  for (let i = 0; i < 6; i++) {
    const hx = E.x + 16 + i * 46;
    const hd = { x: hx, y: E.y + 34, w: 40, d: E.d - 56, r: 3 };
    out.push(S(k.slabOf(hd, 170, 18, P, 3, 0.6), { tone: "hi" }) + S(k.slabOf(k.insetPlan(hd, 6), 188, 10, P, 4, 0.6), { tone: "hi" }) + D(k.corners(k.insetPlan(hd, 9), 0).map(([x, y]) => at([x, y, 198])), { size: 0.6 }));
  }
  out.push(k.faceTextSvg(k.sideMatrix([E.x + E.w - 90, E.y + E.d + 0.2], 16, P, "left"), "MAIN ENGINE", { size: 6, tone: "lo" }));
  put([E.x + E.w / 2, E.y + E.d / 2, 40], out.join(""), { part: "engine", bias: -100 });
}

// ---- PLC cabinet with HMI ------------------------------------------------
export const SCREEN = { x0: CAB.x + 8, x1: CAB.x + CAB.w - 8, z0: 104, z1: 132, y: CAB.y + CAB.d + 0.3 };
{
  put([CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 2], halo(CAB, 0, 4));
  put([CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 70], S(k.slabOf({ x: CAB.x - 2, y: CAB.y - 2, w: CAB.w + 4, d: CAB.d + 4, r: 2 }, 0, 8, P, 2, 0.5), { tone: "mid" }) + S(k.slabOf(CAB, 8, 142, P, 2, 0.8), { tone: "hi", inner: L(k.sideSeam(CAB, 96, P, 2), { tone: "faint" }) }), { part: "plc", bias: 0 });
  const fy = SCREEN.y;
  const sc = [[SCREEN.x0, fy, SCREEN.z0], [SCREEN.x1, fy, SCREEN.z0], [SCREEN.x1, fy, SCREEN.z1], [SCREEN.x0, fy, SCREEN.z1]].map(at);
  const vents = [0, 1, 2, 3, 4].map((i) => k.segment([CAB.x + 14, fy, 24 + i * 4], [CAB.x + CAB.w - 14, fy, 24 + i * 4], P)).join("");
  const lamps = [0, 1, 2].map((i) => at([CAB.x + 14 + i * 12, fy, 86]));
  put([CAB.x + CAB.w / 2, fy, 100],
    `<path class="hmi" data-part="screen" d="M${sc.map((p) => p.join(" ")).join("L")}Z"/>` + L(`M${sc.map((p) => p.join(" ")).join("L")}Z`, { tone: "hi" }) +
    L(vents, { tone: "lo" }) +
    lamps.map((p, i) => `<circle class="lamp" data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="2.6"/>`).join("") +
    L(k.segment([CAB.x + CAB.w - 6, fy, 50], [CAB.x + CAB.w - 6, fy, 70], P), { tone: "hi" }) +
    k.faceTextSvg(k.sideMatrix([CAB.x + 8, fy], 142 - 10, P, "left"), "PLC", { size: 4, tone: "lo" }),
    { part: "plc", bias: 2 });
  // terminal rail cable from sensor
}
route("cable", [[SENSOR[0], 0, SENSOR[2] + 26 + 4 + 1], [SENSOR[0], 0, 176], [CAB.x + CAB.w / 2, 0, 176], [CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 176], [CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 150]], 1.4, { flanges: [false, false], bend: 10, tone: "mid", part: "cable", maxLength: 40 });

// ---- sea (translucent, in front of the hull) --------------------------------
export const SEA_TOP = 20;

export function worldSvg() {
  items.sort((a, b) => a.key - b.key);
  return items.map((it) => (it.part ? `<g data-part="${it.part}">${it.svg}</g>` : it.svg)).join("\n");
}

export function seaSvg() {
  const s = SEA;
  const base = [[s.x, s.y + s.d, -80], [s.x + s.w, s.y + s.d, -80], [s.x + s.w, s.y + s.d, SEA_TOP], [s.x, s.y + s.d, SEA_TOP]].map(at);
  const side = [[s.x + s.w, s.y, -80], [s.x + s.w, s.y + s.d, -80], [s.x + s.w, s.y + s.d, SEA_TOP], [s.x + s.w, s.y, SEA_TOP]].map(at);
  const top = [[s.x, s.y, SEA_TOP], [s.x + s.w, s.y, SEA_TOP], [s.x + s.w, s.y + s.d, SEA_TOP], [s.x, s.y + s.d, SEA_TOP]].map(at);
  const poly = (pts) => `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}Z`;
  return { front: poly(base), side: poly(side), top: poly(top) };
}

// Screen-space polyline for a route (for flow overlays)
export function routeScreen(name, spacing = 3) {
  const pts = G.resample(ROUTES[name].pts, spacing).map(at);
  return pts;
}
export const pointAlongRoute = (name, s) => G.pointAlong(ROUTES[name].pts, s);

// volute outline (hull) for the priming overlay
export function voluteFill() {
  const VF = G.frameOf([X.voluteC, 0, AX.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const spiral = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const r = VOL.r0 + (VOL.r1 - VOL.r0) * (i / 64);
    spiral.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return G.prismOf(VF, spiral, -VOL.half, VOL.half, P).fill;
}
export const resampleScreen = (pts3, spacing = 3) => G.resample(G.fillet(pts3, 10, 7), spacing).map(at);
