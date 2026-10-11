// Builds video.html: the isometric world plus a deterministic timeline
// (window.seek(t)) that the renderer steps frame by frame.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import * as W from "./world.mjs";
import { ISO_CSS } from "./kit/iso-kit.mjs";
import { SCENES } from "./script.mjs";

const r1 = (p) => p.map((v) => Math.round(v * 10) / 10);
const at = (p) => r1(W.at(p));
const scr = (pts) => pts.map(r1);

// ---- timeline ---------------------------------------------------------------
const durs = existsSync("audio/durations.json") ? JSON.parse(readFileSync("audio/durations.json", "utf8")) : SCENES.map((s) => ({ dur: s.min }));
const LEAD = 0.35; // voice starts this long after the scene starts
let t0 = 0;
const scenes = SCENES.map((s, i) => {
  const dur = Math.max(s.min, durs[i].dur + LEAD + 0.3);
  const out = { id: s.id, title: s.title, sub: s.sub, start: Math.round(t0 * 100) / 100, dur: Math.round(dur * 100) / 100, voice: Math.round((t0 + LEAD) * 100) / 100 };
  t0 += dur;
  return out;
});
const TOTAL = Math.round((t0 + 0.6) * 100) / 100;
writeFileSync("audio/timeline.json", JSON.stringify({ scenes, total: TOTAL }, null, 1));

// ---- water paths (screen coords in the base 1920x1080 world) -----------------
const AXZ = W.AX.z;
const paths = {
  sea: W.routeScreen("sea"),
  strainer: W.resampleScreen([[36, 22, 36], [30, 8, 36], [30, 0, 44], [W.STRAINER[0] + 20, 0, AXZ]]),
  suction: W.routeScreen("suction"),
  pump: W.resampleScreen([[W.X.eye, 0, AXZ], [W.X.voluteC, 0, AXZ], [W.X.voluteC, 18, AXZ + 20], [W.X.voluteC, 18, AXZ + 40]]),
  discharge: W.routeScreen("discharge"),
  coolerSw: W.resampleScreen([[W.NOZ.swIn[0], -110, 92], [30, -110, 92], [30, -110, 22], [W.NOZ.swOut[0], -110, 22]]),
  overboard: W.routeScreen("overboard"),
  fwHot: W.routeScreen("fwHot"),
  coolerFw: W.resampleScreen([[W.NOZ.fwIn[0], -156, 22], [30, -156, 22], [30, -156, 92], [W.NOZ.fwOut[0], -156, 92]]),
  fwCold: W.routeScreen("fwCold"),
  engine: W.resampleScreen([[W.ENGINE.x + 84, W.ENGINE.y + W.ENGINE.d, 92], [W.ENGINE.x + 84, -250, 92], [W.ENGINE.x + 150, -250, 60], [W.ENGINE.x + 44, -250, 22], [W.ENGINE.x + 44, W.ENGINE.y + W.ENGINE.d, 22]]),
  cable: W.routeScreen("cable", 2),
};
for (const key of Object.keys(paths)) paths[key] = scr(paths[key]);

// ---- anchors -------------------------------------------------------------
const A = {
  grating: at([38, 108, -40]),
  seaFar: at([38, 170, -40]),
  strainer: at([30, 0, 70]),
  suction: at([95, 0, 54]),
  volute: at([W.X.voluteC, 0, AXZ]),
  eye: at([W.X.eye, 0, AXZ]),
  bearing: at([W.BEARINGS[0], 0, AXZ]),
  bearing2: at([W.BEARINGS[1], 0, AXZ]),
  frame: at([212, 0, AXZ + 18]),
  shaft: at([245, 0, AXZ]),
  coupling: at([260, 0, AXZ + 13]),
  motor: at([316, 0, AXZ + 31]),
  motorSide: at([330, 30, AXZ]),
  dischargeTop: at([W.X.voluteC, 18, 120]),
  cooler: at([20, -90, 118]),
  coolerHead: at([94, -133, 60]),
  swIn: at(W.NOZ.swIn),
  swOut: at(W.NOZ.swOut),
  engine: at([W.ENGINE.x + 150, W.ENGINE.y + W.ENGINE.d, 120]),
  outlet: at([110, 108, 4]),
  overValve: at([112, 25, 50]),
  sensor: at([W.SENSOR[0], 0, W.SENSOR[2] + 20]),
  sensorTip: at([W.SENSOR[0], 0, AXZ + 6]),
  plc: at([W.CAB.x + W.CAB.w / 2, W.CAB.y + W.CAB.d, 140]),
  screen: at([(W.SCREEN.x0 + W.SCREEN.x1) / 2, W.SCREEN.y, (W.SCREEN.z0 + W.SCREEN.z1) / 2]),
  hull: at([20, 108, 30]),
  pumpMid: at([260, 0, AXZ]),
  world: [960, 470],
};
// sea body for particles: points in the sea volume (screen) drifting to the grating
const seaParticles = [];
for (let i = 0; i < 46; i++) {
  const rnd = (n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  const from = [-20 + rnd(1) * 120, 120 + rnd(2) * 64, -70 + rnd(3) * 80];
  const to = [6 + rnd(4) * 64, 108, -60 + rnd(5) * 40];
  seaParticles.push({ a: at(from), b: at(to), ph: rnd(6) });
}
const outParticles = [];
for (let i = 0; i < 34; i++) {
  const rnd = (n) => { const x = Math.sin(i * 91.7 + n * 211.3) * 23421.631; return x - Math.floor(x); };
  const from = [110, 110, 4];
  const to = [100 + rnd(1) * 70 - 20, 135 + rnd(2) * 50, -20 + rnd(3) * 40];
  outParticles.push({ a: at(from), b: at(to), ph: rnd(4) });
}

const DATA = { scenes, total: TOTAL, paths, A, seaParticles, outParticles, rotFrames: W.ROT_FRAMES, volute: W.voluteFill() };

// ---- fonts ---------------------------------------------------------------
const fontDir = "node_modules/@fontsource/poppins/files/";
let fonts = "";
for (const w of [300, 400, 500, 600, 700]) for (const style of ["normal", "italic"]) {
  const b64 = readFileSync(`${fontDir}poppins-latin-${w}-${style}.woff2`).toString("base64");
  fonts += `@font-face{font-family:"Poppins";font-style:${style};font-weight:${w};src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
}

const sea = W.seaSvg();
const world = `<svg id="world" viewBox="0 0 ${W.W} ${W.H}" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FCDEB" stop-opacity=".42"/><stop offset="1" stop-color="#29A9DC" stop-opacity=".28"/></linearGradient>
  <radialGradient id="dropGrad"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#7FCDEB"/><stop offset="1" stop-color="#29A9DC"/></radialGradient>
</defs>
<g id="worldArt">${W.worldSvg()}</g>
<g id="sea"><path class="sea-front" d="${sea.front}"/><path class="sea-side" d="${sea.side}"/><path class="sea-top" d="${sea.top}"/><path id="waves" class="waves" d=""/></g>
<g id="flows"></g>
<g id="particles"></g>
</svg>`;

const css = readFileSync("video.css", "utf8");
const runtime = readFileSync("runtime.js", "utf8");
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Pompa air laut</title>
<style>${fonts}${ISO_CSS}${css}</style></head>
<body class="iso" data-theme="light">
<div id="frame">
  <div id="bg"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div></div>
  <div id="stage">${world}</div>
  <svg id="overlay" width="1920" height="1080" viewBox="0 0 1920 1080"></svg>
  <div id="labels"></div>
  <div id="panels"></div>
  <header id="head"><div class="lt" id="lt"></div><h1 id="title"></h1></header>
  <div id="section"><span id="stepNo"></span><div id="steps"></div></div>
  <div id="subtitle"><p id="subText"></p></div>
  <div id="brand">SISTEM PENDINGIN AIR LAUT · MESIN INDUK</div>
</div>
<script>const DATA = ${JSON.stringify(DATA)};
${runtime}</script></body></html>`;
writeFileSync("video.html", html);
console.log("video.html", (html.length / 1e6).toFixed(2), "MB; total", TOTAL, "s");
for (const s of scenes) console.log(s.id.padEnd(10), s.start.toFixed(2), s.dur.toFixed(2));
