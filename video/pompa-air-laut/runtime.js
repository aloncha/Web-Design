// Deterministic timeline: everything on screen is a function of t (seconds).
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (u, a, b) => clamp((u - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const fmt = (n, d = 0) => { const [i, f] = Math.abs(n).toFixed(d).split("."); return (n < 0 ? "-" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (f ? "," + f : ""); };

// ---- icons ---------------------------------------------------------------
const ICON = {
  drop: '<path d="M12 3.5c3.2 4.2 5.5 7.4 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.8 2.3-6 5.5-10.2z" class="acc"/><path d="M9.6 14.6a2.6 2.6 0 0 0 2.4 2.2"/>',
  pipe: '<path d="M3 9h11a4 4 0 0 1 4 4v8"/><path d="M3 15h11a-2 2 0 0 0 0 0"/><path d="M3 15h9.5a1.5 1.5 0 0 1 1.5 1.5V21"/><path d="M3 7.5v9M16.5 21h6" class="acc"/>',
  motor: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M6 7v10M9 7v10M12 7v10"/><path d="M15 12h6" class="acc"/><rect x="6" y="4.5" width="5" height="2.5" rx=".6"/>',
  shaft: '<path d="M2.5 12h19" class="acc"/><rect x="6" y="9.5" width="3" height="5" rx=".8"/><rect x="15" y="9.5" width="3" height="5" rx=".8"/><path d="M10.5 6.5a5 5 0 0 1 3 0M13.5 6.5l-.8-1.4M13.5 6.5l-1.5.5"/>',
  impeller: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2" class="acc"/><path d="M12 9.8c1-2.6 3.4-4 6-3.6M14.1 12.6c2.6 1 4 3.4 3.6 6M11.4 14.1c-1 2.6-3.4 4-6 3.6M9.9 11.4c-2.6-1-4-3.4-3.6-6"/>',
  spiral: '<path d="M12 12m-2 0a2 2 0 1 0 4 0a4 4 0 1 0-8 0a6.5 6.5 0 1 0 13 0M19 12V3.5h3" class="acc"/><path d="M5.5 12a6.5 6.5 0 0 0 1.1 3.6"/>',
  bearing: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="5.6" r="1.6" class="acc"/><circle cx="18.4" cy="12" r="1.6" class="acc"/><circle cx="12" cy="18.4" r="1.6" class="acc"/><circle cx="5.6" cy="12" r="1.6" class="acc"/>',
  hx: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 6v12M12 6v12M16 6v12"/><path d="M6 9.5q2-1.5 4 0t4 0 4 0" class="acc"/>',
  wave: '<path d="M2.5 14q2.4-2.6 4.8 0t4.8 0 4.8 0 4.8 0" class="acc"/><path d="M2.5 19q2.4-2.6 4.8 0t4.8 0 4.8 0 4.8 0"/><path d="M12 3v7M9 7l3 3 3-3"/>',
  sensor: '<rect x="9" y="10" width="6" height="10" rx="1.5"/><path d="M12 10V7"/><path d="M8 5.5a5.5 5.5 0 0 1 8 0M5.6 3.4a9 9 0 0 1 12.8 0" class="acc"/>',
  screen: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M9 20h6M12 16.5V20"/><path d="M6 12.5l3-3 2.5 2 3.5-4 3 2.5" class="acc"/>',
  plc: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><rect x="8" y="6" width="8" height="5" rx=".8" class="acc"/><path d="M8 14.5h8M8 17.5h5"/>',
  engine: '<path d="M4 18V11h3V8h10v3h3v7z"/><path d="M8 8V5.5h8V8M7 14h10"/><path d="M12 11v6" class="acc"/>',
  hull: '<path d="M2.5 9h19l-3 9H5.5z"/><path d="M6 13.5h3" class="acc"/><path d="M2.5 20.5q2.4-1.8 4.8 0t4.8 0 4.8 0 4.8 0" class="acc"/>',
  heat: '<path d="M8 20c-2-2.5-2-4.5 0-7s2-4.5 0-7M12.5 20c-2-2.5-2-4.5 0-7s2-4.5 0-7M17 20c-2-2.5-2-4.5 0-7s2-4.5 0-7" class="acc"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24">${ICON[name] || ""}</svg>`;

// ---- scenes ---------------------------------------------------------------
const SC = {};
DATA.scenes.forEach((s, i) => (SC[s.id] = { ...s, i, end: s.start + s.dur }));
const ORDER = DATA.scenes.map((s) => s.id);
const STEP_ICONS = ["hull", "pipe", "motor", "bearing", "shaft", "impeller", "spiral", "hx", "wave", "screen"];
const LT = ["Dari laut ke kapal", "Pipa isap", "Pompa sentrifugal", "Zoom ke dalam", "Penggerak", "Jantung pompa", "Rumah spiral", "Penukar panas", "Pembuangan", "Pemantauan", "Penutup"];

const A = DATA.A;
const mid = (p, q, f = 0.5) => [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
const V = {
  full: { c: [960, 452], w: 1700 },
  hull: { c: [A.grating[0] + 120, A.grating[1] - 70], w: 980 },
  suction: { c: mid(A.strainer, A.volute, 0.55), w: 860 },
  pump: { c: [mid(A.volute, A.motor, 0.5)[0] + 10, mid(A.volute, A.motor, 0.5)[1] + 34], w: 660 },
  bearingZoom: { c: A.bearing, w: 360 },
  voluteZoom: { c: A.volute, w: 360 },
  discharge: { c: mid(A.volute, A.swIn, 0.5), w: 1000 },
  cooler: { c: mid(A.coolerHead, A.engine, 0.35), w: 1100 },
  overboard: { c: mid(A.swOut, A.outlet, 0.5), w: 1100 },
  sensor: { c: A.sensor, w: 460 },
  plc: { c: mid(A.sensor, A.plc, 0.55), w: 1060 },
};
const blendView = (a, b, x) => ({ c: [lerp(a.c[0], b.c[0], x), lerp(a.c[1], b.c[1], x)], w: Math.exp(lerp(Math.log(a.w), Math.log(b.w), x)) });
const drift = (v, u, d, k = 0.04) => ({ c: v.c, w: v.w * (1 + k * (1 - u / d)) });
// zoom toward a point keeping it fixed on screen during the move (true zoom)
function zoomTo(a, b, x) {
  const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), x));
  // centre follows so that b.c is approached proportionally to the zoom progress
  const g = Math.abs(a.w - b.w) < 1e-6 ? x : (a.w - w) / (a.w - b.w);
  return { c: [lerp(a.c[0], b.c[0], g), lerp(a.c[1], b.c[1], g)], w };
}
const CAM = {
  hull: (u, d) => zoomTo({ c: V.hull.c, w: 1500 }, V.hull, ease(seg(u, 0, 2.6))),
  suction: (u, d) => drift(V.suction, u, d),
  pump: (u, d) => drift(V.pump, u, d),
  bearing: (u, d) => zoomTo(V.pump, V.bearingZoom, ease(seg(u, 0.1, 1.6))),
  drive: (u, d) => zoomTo(V.bearingZoom, V.pump, ease(seg(u, 0, 1.4))),
  impeller: (u, d) => zoomTo(V.pump, V.voluteZoom, ease(seg(u, 0.1, 1.5))),
  volute: (u, d) => zoomTo(V.voluteZoom, V.discharge, ease(seg(u, d - 2.3, d + 0.2))),
  cooler: (u, d) => blendView(V.discharge, V.cooler, ease(seg(u, 0, 1.6))),
  overboard: (u, d) => blendView(V.cooler, V.overboard, ease(seg(u, 0, 1.6))),
  monitor: (u, d) => (u < 3 ? blendView(V.overboard, V.sensor, ease(seg(u, 0, 1.5))) : blendView(V.sensor, V.plc, ease(seg(u, 3, 4.8)))),
  summary: (u, d) => blendView(V.plc, V.full, ease(seg(u, 0, 2.2))),
};
const FOCUS_Y = 600; // screen y where the camera centre lands (below the header)
let VB = { x: 0, y: 0, w: 1920, h: 1080 };
function setCamera(v) {
  const w = v.w, h = (w * 1080) / 1920;
  VB = { x: v.c[0] - w / 2, y: v.c[1] - h * (FOCUS_Y / 1080), w, h };
  $("world").setAttribute("viewBox", `${VB.x.toFixed(2)} ${VB.y.toFixed(2)} ${VB.w.toFixed(2)} ${VB.h.toFixed(2)}`);
}
const toScreen = (p) => [((p[0] - VB.x) / VB.w) * 1920, ((p[1] - VB.y) / VB.h) * 1080];

// ---- water ---------------------------------------------------------------
const flows = $("flows");
const FLOW = {};
const lenOf = (pts) => { const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return acc; };
function cutPath(pts, acc, f) {
  const L = acc[acc.length - 1] * f;
  if (f <= 0) return "";
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (acc[i] <= L) out.push(pts[i]);
    else { const k = (L - acc[i - 1]) / (acc[i] - acc[i - 1]); out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; }
  }
  return "M" + out.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
}
function pointAt(pts, acc, s) {
  const L = clamp(s, 0, acc[acc.length - 1]);
  for (let i = 1; i < pts.length; i++) if (acc[i] >= L) { const k = (L - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]); return { p: [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)], a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) }; }
  const n = pts.length - 1; return { p: pts[n], a: Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]) };
}
function makeFlow(key, kind, { width = 5.6, chevrons = [], dash = 16 } = {}) {
  const pts = DATA.paths[key];
  const acc = lenOf(pts);
  const g = el("g", { class: kind }, flows);
  const edge = el("path", { class: "w-edge", "stroke-width": width + 2.4 }, g);
  const core = el("path", { class: "w-core", "stroke-width": width }, g);
  const dashP = el("path", { class: "w-dash", "stroke-width": width * 0.32, "stroke-dasharray": `${dash * 0.22} ${dash}` }, g);
  const ch = chevrons.map((f) => {
    const c = el("path", { class: "chev", d: "M-4.2 -4.2 L1.6 0 L-4.2 4.2 L-2.4 0 Z", "stroke-width": 1.1 }, g);
    return { f, c };
  });
  FLOW[key] = { pts, acc, g, edge, core, dashP, ch, kind, last: -1 };
}
function setFlow(key, f, t, speed = 22) {
  const F = FLOW[key];
  f = clamp(f);
  if (f <= 0) { F.g.style.display = "none"; return; }
  F.g.style.display = "";
  if (Math.abs(F.last - f) > 1e-4) {
    const d = cutPath(F.pts, F.acc, f);
    F.edge.setAttribute("d", d); F.core.setAttribute("d", d); F.dashP.setAttribute("d", d);
    F.last = f;
  }
  F.dashP.setAttribute("stroke-dashoffset", (-t * speed).toFixed(2));
  const L = F.acc[F.acc.length - 1];
  for (const c of F.ch) {
    const s = c.f * L;
    const shown = clamp((f * L - s) / 18);
    if (shown <= 0) { c.c.style.display = "none"; continue; }
    const { p, a } = pointAt(F.pts, F.acc, s);
    const sc = (0.4 + 0.6 * smooth(shown)) * (1 + 0.25 * Math.max(0, 1 - Math.abs(shown - 0.5) * 2));
    c.c.style.display = "";
    c.c.setAttribute("transform", `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)}) scale(${sc.toFixed(3)})`);
    c.c.setAttribute("opacity", smooth(shown).toFixed(3));
  }
}
makeFlow("sea", "sw", { chevrons: [0.25, 0.55, 0.85] });
makeFlow("strainer", "sw", { chevrons: [] });
makeFlow("suction", "sw", { chevrons: [0.3, 0.75] });
makeFlow("pump", "sw", { chevrons: [0.8] });
makeFlow("discharge", "sw", { chevrons: [0.2, 0.45, 0.7, 0.92] });
makeFlow("coolerSw", "sw", { chevrons: [0.5] });
makeFlow("overboard", "sw", { chevrons: [0.15, 0.45, 0.75] });
makeFlow("fwHot", "fw", { chevrons: [0.35, 0.8] });
makeFlow("coolerFw", "fw", { chevrons: [0.5] });
makeFlow("fwCold", "fw", { chevrons: [0.3, 0.75] });
makeFlow("engine", "fw", { chevrons: [0.5] });
makeFlow("cable", "sig", { width: 2.2, chevrons: [], dash: 30 });
// priming: volute fill rising
const primeClip = el("clipPath", { id: "primeClip" }, $("world").querySelector("defs"));
const primeRect = el("rect", { x: 0, y: 0, width: 4000, height: 0 }, primeClip);
const prime = el("path", { d: DATA.volute, fill: "#29A9DC", "fill-opacity": 0.55, stroke: "#29A9DC", "stroke-width": 1.2, "clip-path": "url(#primeClip)" }, flows);
const primeBox = (() => { const n = DATA.volute.match(/-?\d+(\.\d+)?/g).map(Number); const ys = n.filter((_, i) => i % 2); return [Math.min(...ys), Math.max(...ys)]; })();
// shaft torque line
const axisLine = el("path", { d: `M${A.eye[0]} ${A.eye[1]}L${A.motorSide[0] + 30} ${A.motorSide[1] - 12}`, stroke: "#29A9DC", "stroke-width": 3, "stroke-linecap": "round", fill: "none", "stroke-dasharray": "6 10", opacity: 0 }, flows);

// ---- particles -----------------------------------------------------------
const pg = $("particles");
const seaDots = DATA.seaParticles.map(() => el("circle", { r: 2.4, class: "pdot" }, pg));
const outDots = DATA.outParticles.map(() => el("circle", { r: 2.6, class: "pdot warm" }, pg));
const sigDots = [0, 1, 2, 3].map(() => el("circle", { r: 3.2, fill: "#29A9DC", stroke: "#fff", "stroke-width": 1.2 }, pg));

// ---- world parts ---------------------------------------------------------
const partEls = {};
document.querySelectorAll("#worldArt [data-part]").forEach((g) => (partEls[g.dataset.part] ||= []).push(g));
let hlNow = "";
function highlight(list) {
  const key = list.join(",");
  if (key === hlNow) return;
  hlNow = key;
  for (const [name, gs] of Object.entries(partEls)) for (const g of gs) g.classList.toggle("hlp", list.includes(name));
}
const rots = [...document.querySelectorAll("#worldArt .rot")];
let rotNow = 0;
function setRot(i) { if (i === rotNow) return; rots.forEach((r) => (r.style.display = Number(r.dataset.i) === i ? "" : "none")); rotNow = i; }
const hmi = document.querySelector("#worldArt .hmi");
const lamps = [...document.querySelectorAll("#worldArt .lamp")];

// ---- callouts -------------------------------------------------------------
const labels = $("labels");
const overlay = $("overlay");
const CALL = {};
function callout(id, { text, sub = "", ic = "", at, dx, dy, from, to, worldPt = true }) {
  const div = document.createElement("div");
  div.className = "callout";
  div.innerHTML = (ic ? `<span class="ic">${icon(ic)}</span>` : "") + `<span>${text}${sub ? `<small>${sub}</small>` : ""}</span>`;
  labels.appendChild(div);
  const lead = el("path", { class: "lead" }, overlay);
  const ring = el("circle", { class: "anchor", r: 8 }, overlay);
  const core = el("circle", { class: "anchor-core", r: 3.4 }, overlay);
  CALL[id] = { div, lead, ring, core, at, dx, dy, from, to, worldPt };
}
function drawCallout(id, t) {
  const c = CALL[id];
  const vis = Math.min(seg(t, c.from, c.from + 0.45), 1 - seg(t, c.to - 0.35, c.to));
  if (vis <= 0) { c.div.style.display = "none"; c.lead.style.display = c.ring.style.display = c.core.style.display = "none"; return; }
  const p = c.worldPt ? toScreen(c.at) : c.at;
  const e = smooth(vis);
  const box = [p[0] + c.dx, p[1] + c.dy];
  c.div.style.display = "flex";
  c.div.style.left = box[0] + "px";
  c.div.style.top = box[1] + "px";
  const left = c.dx < 0;
  c.div.style.transform = `translate(${left ? "-100%" : "0"}, -50%) scale(${(0.9 + 0.1 * e).toFixed(3)})`;
  c.div.style.transformOrigin = left ? "right center" : "left center";
  c.div.style.opacity = e.toFixed(3);
  // leader from the anchor to the pill edge, drawn as it appears
  const end = [lerp(p[0], box[0], e), lerp(p[1], box[1], e)];
  c.lead.style.display = c.ring.style.display = c.core.style.display = "";
  c.lead.setAttribute("d", `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${end[0].toFixed(1)} ${end[1].toFixed(1)}`);
  c.lead.setAttribute("opacity", e.toFixed(3));
  for (const r of [c.ring, c.core]) { r.setAttribute("cx", p[0].toFixed(1)); r.setAttribute("cy", p[1].toFixed(1)); r.setAttribute("opacity", e.toFixed(3)); }
}
const s = (id) => SC[id].start;
const e_ = (id) => SC[id].end;
callout("seachest", { text: "<i>Sea chest</i>", sub: "lubang air laut di lambung", ic: "hull", at: A.grating, dx: -330, dy: -40, from: s("hull") + 1.4, to: e_("hull") + 0.3 });
callout("saringan", { text: "Saringan", sub: "menahan kotoran", ic: "drop", at: A.strainer, dx: 190, dy: 30, from: s("hull") + 2.6, to: e_("suction") - 0.4 });
callout("isap", { text: "Pipa isap", ic: "pipe", at: A.suction, dx: 60, dy: 170, from: s("suction") + 0.8, to: e_("suction") });
callout("prime", { text: "Pompa terisi penuh", sub: "", ic: "drop", at: A.volute, dx: -120, dy: -200, from: s("suction") + 2.6, to: e_("suction") + 0.2 });
callout("motor", { text: "Motor listrik", ic: "motor", at: A.motor, dx: 90, dy: -190, from: s("pump") + 0.5, to: e_("pump") });
callout("poros", { text: "Poros", ic: "shaft", at: A.shaft, dx: 120, dy: 190, from: s("pump") + 1.3, to: e_("pump") });
callout("volute", { text: "Rumah spiral", sub: "<i>volute</i>", ic: "spiral", at: A.volute, dx: -150, dy: 170, from: s("pump") + 2.1, to: e_("pump") });
callout("bearingAt", { text: "Rumah <i>bearing</i>", ic: "bearing", at: A.frame, dx: -60, dy: -210, from: s("pump") + 3.0, to: s("bearing") + 1.2 });
callout("d1", { text: "Motor", ic: "motor", at: A.motor, dx: 80, dy: -170, from: s("drive") + 0.9, to: e_("drive") + 0.2 });
callout("d2", { text: "Poros", ic: "shaft", at: A.shaft, dx: 100, dy: 170, from: s("drive") + 1.5, to: e_("drive") + 0.2 });
callout("d3", { text: "<i>Impeller</i>", ic: "impeller", at: A.volute, dx: -140, dy: 170, from: s("drive") + 2.1, to: e_("drive") + 0.2 });
callout("cooler", { text: "<i>Central cooler</i>", sub: "penukar panas", ic: "hx", at: A.cooler, dx: -140, dy: -120, from: s("cooler") + 1.2, to: e_("cooler") - 0.2 });
callout("engine", { text: "Mesin induk", sub: "sumber panas", ic: "engine", at: A.engine, dx: 120, dy: -120, from: s("cooler") + 2.0, to: e_("cooler") - 0.2 });
callout("outlet", { text: "Kembali ke laut", sub: "± 42 °C", ic: "wave", at: A.outlet, dx: 140, dy: 120, from: s("overboard") + 1.8, to: e_("overboard") + 0.2 });
callout("sensor", { text: "Sensor RPM", sub: "membaca putaran poros", ic: "sensor", at: A.sensor, dx: -120, dy: -170, from: s("monitor") + 1.2, to: e_("monitor") - 0.3 });
callout("plc", { text: "PLC", sub: "komputer kendali", ic: "plc", at: A.plc, dx: 110, dy: -140, from: s("monitor") + 4.4, to: e_("monitor") - 0.3 });

// ---- header / steps / subtitle ------------------------------------------------
const stepsBox = $("steps");
const stepEls = STEP_ICONS.map((n) => { const d = document.createElement("div"); d.className = "step"; d.innerHTML = icon(n); stepsBox.appendChild(d); return d; });
let sceneNow = -1;
function setScene(i, u, d) {
  const sc = DATA.scenes[i];
  if (i !== sceneNow) {
    sceneNow = i;
    $("title").innerHTML = sc.title;
    $("lt").textContent = i < 10 ? `Langkah ${i + 1} · ${LT[i]}` : LT[i];
    $("stepNo").textContent = i < 10 ? `${String(i + 1).padStart(2, "0")} / 10` : "Ringkasan";
    $("subText").innerHTML = sc.sub;
    stepEls.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("done", k < i); });
  }
  const a = Math.min(seg(u, 0, 0.35), 1 - seg(u, d - 0.25, d));
  $("head").style.opacity = (0.15 + 0.85 * smooth(a)).toFixed(3);
  $("head").style.transform = `translateY(${((1 - smooth(seg(u, 0, 0.35))) * 10).toFixed(1)}px)`;
  const sa = Math.min(seg(u, 0.15, 0.5), 1 - seg(u, d - 0.22, d - 0.02));
  $("subtitle").style.opacity = smooth(sa).toFixed(3);
  $("subtitle").style.transform = `translateX(-50%) translateY(${((1 - smooth(seg(u, 0.15, 0.5))) * 14).toFixed(1)}px)`;
}

// ---- panels ---------------------------------------------------------------
const panels = $("panels");
function panel(id, { x, y, w, h }) {
  const div = document.createElement("div");
  div.className = "glass panel";
  Object.assign(div.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px", display: "none" });
  panels.appendChild(div);
  return { div, x, y, w, h };
}
// open from an anchor point (zoom transition): scale + blur
function showPanel(P, vis, origin) {
  if (vis <= 0.001) { P.div.style.display = "none"; return; }
  const e = ease(vis);
  P.div.style.display = "block";
  const ox = origin[0] - P.x, oy = origin[1] - P.y;
  P.div.style.transformOrigin = `${ox}px ${oy}px`;
  P.div.style.transform = `scale(${lerp(0.04, 1, e).toFixed(4)})`;
  P.div.style.opacity = clamp(e * 1.6).toFixed(3);
  P.div.style.filter = e < 0.999 ? `blur(${((1 - e) * 10).toFixed(2)}px)` : "none";
}

// Bearing cross-section ---------------------------------------------------------
const PB = panel("bearing", { x: 300, y: 262, w: 1320, h: 600 });
PB.div.innerHTML = `<svg width="1320" height="600" viewBox="0 0 1320 600" id="bsvg"></svg>`;
const bsvg = PB.div.querySelector("svg");
const BC = [300, 300];
const BR = { house: 262, outO: 232, outI: 196, pitch: 160, ball: 33, inO: 126, inI: 92, cage: 12 };
el("defs", {}, bsvg).innerHTML = `<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#F4FBFE"/><path d="M0 0V10" stroke="#A9C0CA" stroke-width="1.4"/></pattern>
<radialGradient id="ballG" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#D6F0FA"/><stop offset="1" stop-color="#8FC9E2"/></radialGradient>
<radialGradient id="shaftG" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#C9DEE8"/></radialGradient>`;
const ringPath = (r0, r1) => `M${BC[0] + r1} ${BC[1]}A${r1} ${r1} 0 1 0 ${BC[0] - r1} ${BC[1]}A${r1} ${r1} 0 1 0 ${BC[0] + r1} ${BC[1]}ZM${BC[0] + r0} ${BC[1]}A${r0} ${r0} 0 1 1 ${BC[0] - r0} ${BC[1]}A${r0} ${r0} 0 1 1 ${BC[0] + r0} ${BC[1]}Z`;
el("path", { d: ringPath(BR.outO, BR.house), fill: "url(#hatch)", stroke: "#2C4A5A", "stroke-width": 2, "fill-rule": "evenodd" }, bsvg);
el("path", { d: ringPath(BR.outI, BR.outO), fill: "#EAF4F8", stroke: "#2C4A5A", "stroke-width": 2.4, "fill-rule": "evenodd" }, bsvg);
// race grooves
el("circle", { cx: BC[0], cy: BC[1], r: BR.outI + 3, fill: "none", stroke: "#A9C0CA", "stroke-width": 1.4 }, bsvg);
const cageG = el("g", {}, bsvg);
el("path", { d: ringPath(BR.pitch - BR.cage, BR.pitch + BR.cage), fill: "#F6D978", "fill-opacity": 0.0, stroke: "none", "fill-rule": "evenodd" }, cageG);
const cageRing = el("path", { d: ringPath(BR.pitch - BR.cage, BR.pitch + BR.cage), fill: "#FFFFFF", stroke: "#6B8794", "stroke-width": 1.6, "fill-rule": "evenodd" }, cageG);
const NB = 9;
const cagePockets = [];
for (let i = 0; i < NB; i++) cagePockets.push(el("circle", { r: BR.ball + 5, fill: "#FFFFFF", stroke: "#6B8794", "stroke-width": 1.6 }, cageG));
const balls = [];
for (let i = 0; i < NB; i++) {
  const g = el("g", {}, bsvg);
  el("circle", { r: BR.ball, fill: "url(#ballG)", stroke: "#2C4A5A", "stroke-width": 2 }, g);
  const mark = el("path", { d: `M${-BR.ball * 0.55} 0A${BR.ball * 0.55} ${BR.ball * 0.55} 0 0 1 ${BR.ball * 0.55} 0`, fill: "none", stroke: "#29A9DC", "stroke-width": 2.4, "stroke-linecap": "round" }, g);
  balls.push({ g, mark });
}
const innerG = el("g", {}, bsvg);
el("path", { d: ringPath(BR.inI, BR.inO), fill: "#EAF4F8", stroke: "#2C4A5A", "stroke-width": 2.4, "fill-rule": "evenodd" }, innerG);
el("circle", { cx: BC[0], cy: BC[1], r: BR.inO - 3, fill: "none", stroke: "#A9C0CA", "stroke-width": 1.4 }, innerG);
el("circle", { cx: BC[0], cy: BC[1], r: BR.inI, fill: "url(#shaftG)", stroke: "#2C4A5A", "stroke-width": 2.4 }, innerG);
el("rect", { x: BC[0] - 12, y: BC[1] - BR.inI - 2, width: 24, height: 22, rx: 3, fill: "#0B4F6C" }, innerG);
for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; el("path", { d: `M${BC[0] + Math.cos(a) * (BR.inO - 10)} ${BC[1] + Math.sin(a) * (BR.inO - 10)}L${BC[0] + Math.cos(a) * (BR.inO - 3)} ${BC[1] + Math.sin(a) * (BR.inO - 3)}`, stroke: "#7F9AA6", "stroke-width": 1.6 }, innerG); }
el("circle", { cx: BC[0], cy: BC[1], r: 5, fill: "#2C4A5A" }, innerG);
// rotation arrow around the shaft
const rotArrow = el("path", { d: `M${BC[0] + 58} ${BC[1] - 18}A60 60 0 0 1 ${BC[0] + 20} ${BC[1] + 56}`, fill: "none", stroke: "#29A9DC", "stroke-width": 4, "stroke-linecap": "round" }, bsvg);
el("path", { d: `M${BC[0] + 20} ${BC[1] + 56}l14 -2l-8 12z`, fill: "#29A9DC" }, bsvg);
// labels (right column)
const BL = [
  { key: "in", text: "Cincin dalam", sub: "menempel pada poros", r: BR.inO - 14, a: -0.45, y: 90 },
  { key: "out", text: "Cincin luar", sub: "menempel pada rumah bearing", r: BR.outO - 12, a: -0.62, y: 190 },
  { key: "ball", text: "Elemen gelinding", sub: "bola di antara kedua cincin", r: BR.pitch, a: 0, y: 290 },
  { key: "cage", text: "Sangkar", sub: "penjaga jarak antar bola", r: BR.pitch, a: 0, y: 390 },
];
const blabel = BL.map((L) => {
  const g = el("g", {}, bsvg);
  const lead = el("path", { class: "lead", "stroke-width": 2 }, g);
  const dot = el("circle", { r: 6, fill: "#fff", stroke: "#29A9DC", "stroke-width": 3 }, g);
  const tx = el("text", { x: 640, y: L.y, class: "tag", "font-size": 30 }, g);
  tx.textContent = L.text;
  const ts = el("text", { x: 640, y: L.y + 30, class: "tag2", "font-size": 22 }, g);
  ts.textContent = L.sub;
  return { ...L, g, lead, dot };
});
// position strip: where the bearing sits
const strip = el("g", { transform: "translate(640 446)" }, bsvg);
strip.innerHTML = `
<rect x="0" y="0" width="640" height="140" rx="18" fill="#F4FBFE" stroke="#D6F0FA"/>
<text x="22" y="34" class="tag" font-size="20" fill="#0B4F6C">Letak: di poros, di belakang <tspan font-style="italic">impeller</tspan></text>
<path d="M84 80H560" stroke="#2C4A5A" stroke-width="5" stroke-linecap="round"/>
<path d="M14 80h30" stroke="#29A9DC" stroke-width="5" stroke-linecap="round"/><path d="M38 71l11 9-11 9" fill="none" stroke="#29A9DC" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
<rect x="58" y="56" width="52" height="48" rx="14" fill="#fff" stroke="#2C4A5A" stroke-width="2"/>
<path d="M84 61v38M68 66l32 28M68 94l32-28" stroke="#7F9AA6" stroke-width="2"/>
<rect x="148" y="62" width="160" height="36" rx="8" fill="#fff" stroke="#2C4A5A" stroke-width="2"/>
<rect x="164" y="64" width="22" height="32" rx="4" fill="#29A9DC"/><rect x="270" y="64" width="22" height="32" rx="4" fill="#29A9DC"/>
<rect x="334" y="66" width="26" height="28" rx="5" fill="#fff" stroke="#2C4A5A" stroke-width="2"/>
<rect x="384" y="52" width="176" height="56" rx="16" fill="#fff" stroke="#2C4A5A" stroke-width="2"/>
<text x="24" y="128" class="tag2" font-size="16">air masuk</text>
<text x="96" y="128" class="tag2" font-size="16" font-style="italic">impeller</text>
<text x="228" y="128" text-anchor="middle" class="tag" font-size="16" fill="#29A9DC" font-style="italic">bearing</text>
<text x="347" y="128" text-anchor="middle" class="tag2" font-size="16">kopling</text>
<text x="472" y="128" text-anchor="middle" class="tag2" font-size="16">motor</text>`;
const bTitle = el("text", { x: 640, y: 44, class: "tag", "font-size": 22, fill: "#6B8794" }, bsvg);
bTitle.textContent = "POTONGAN MELINTANG POROS DAN BEARING";
bTitle.setAttribute("letter-spacing", "2");
bTitle.setAttribute("fill", "#6B8794");
const friction = el("g", { transform: "translate(40 548)" }, bsvg);
friction.innerHTML = `<text x="0" y="0" class="tag2" font-size="20">Gesekan</text><rect x="96" y="-14" width="160" height="14" rx="7" fill="#F4FBFE" stroke="#D6F0FA"/><rect x="96" y="-14" width="26" height="14" rx="7" fill="#29A9DC"/><text x="270" y="0" class="tag2" font-size="20">kecil</text>`;

function drawBearing(t, u) {
  const omega = 2 * Math.PI * 0.14; // shaft, visual speed
  const th = omega * Math.max(0, u - 0.6);
  const ratio = 0.5 * (1 - (2 * BR.ball) / (2 * BR.pitch) * 1); // cage speed factor (cos α = 1)
  const tc = th * ratio;
  innerG.setAttribute("transform", `rotate(${((th * 180) / Math.PI).toFixed(2)} ${BC[0]} ${BC[1]})`);
  const base = -0.35;
  cagePockets.forEach((c, i) => { const a = base + tc + (i / NB) * Math.PI * 2; c.setAttribute("cx", (BC[0] + Math.cos(a) * BR.pitch).toFixed(2)); c.setAttribute("cy", (BC[1] + Math.sin(a) * BR.pitch).toFixed(2)); });
  // spin of each ball relative to the cage (rolling on the inner race)
  const spin = -(th - tc) * (BR.inO / BR.ball);
  balls.forEach((b, i) => {
    const a = base + tc + (i / NB) * Math.PI * 2;
    b.g.setAttribute("transform", `translate(${(BC[0] + Math.cos(a) * BR.pitch).toFixed(2)} ${(BC[1] + Math.sin(a) * BR.pitch).toFixed(2)}) rotate(${(((spin + a) * 180) / Math.PI).toFixed(2)})`);
  });
  // labels one by one
  const cageMid = base + tc + Math.PI / NB; // a cage bridge between ball 0 and 1
  blabel.forEach((L, i) => {
    const vis = smooth(seg(u, 1.9 + i * 0.9, 2.4 + i * 0.9));
    L.g.setAttribute("opacity", vis.toFixed(3));
    let a = L.a, r = L.r;
    if (L.key === "ball") { a = base + tc; r = BR.pitch; }
    if (L.key === "cage") { a = cageMid; r = BR.pitch + BR.cage * 0.2; }
    const p = [BC[0] + Math.cos(a) * r, BC[1] + Math.sin(a) * r];
    const q = [lerp(p[0], 628, vis), lerp(p[1], L.y - 10, vis)];
    L.lead.setAttribute("d", `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`);
    L.dot.setAttribute("cx", p[0].toFixed(1)); L.dot.setAttribute("cy", p[1].toFixed(1));
  });
  strip.setAttribute("opacity", smooth(seg(u, 5.6, 6.2)).toFixed(3));
  friction.setAttribute("opacity", smooth(seg(u, 6.0, 6.6)).toFixed(3));
}

// Impeller and volute section -------------------------------------------------
const PI_ = panel("impeller", { x: 230, y: 262, w: 1460, h: 600 });
PI_.div.innerHTML = `<svg width="1460" height="600" viewBox="0 0 1460 600"></svg>`;
const isvg = PI_.div.querySelector("svg");
const IC = [420, 330];
const IR = { tip: 140, eye: 50, hub: 22 };
const TONGUE = Math.PI; // spiral starts at the left and turns clockwise
const vR = (phi) => 168 + 46 * (phi / (2 * Math.PI)); // passage centre radius
const vW = (phi) => 14 + 40 * (phi / (2 * Math.PI)); // half width
el("defs", {}, isvg).innerHTML = `<radialGradient id="pressG" cx=".5" cy=".5" r=".5"><stop offset=".2" stop-color="#EAF7FD"/><stop offset="1" stop-color="#8FD0EC"/></radialGradient>
<linearGradient id="noz" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8FD0EC"/><stop offset="1" stop-color="#5BBFE6"/></linearGradient>
<pattern id="hatch2" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#F4FBFE"/><path d="M0 0V10" stroke="#A9C0CA" stroke-width="1.4"/></pattern>`;
// casing outline (outer wall) and passage
const ptA = (r, phi) => [IC[0] + Math.cos(TONGUE + phi) * r, IC[1] + Math.sin(TONGUE + phi) * r];
function spiralBand(rf, steps = 120) { const out = []; for (let i = 0; i <= steps; i++) { const ph = (i / steps) * Math.PI * 2; out.push(ptA(rf(ph), ph)); } return out; }
const outerWall = spiralBand((ph) => vR(ph) + vW(ph) + 16);
const passOuter = spiralBand((ph) => vR(ph) + vW(ph));
const passInner = spiralBand((ph) => Math.max(IR.tip + 8, vR(ph) - vW(ph)));
const P2 = (pts) => pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
// nozzle at the end of the spiral going up from the left side
const endR = vR(2 * Math.PI), endW = vW(2 * Math.PI);
const nozX0 = IC[0] - endR - endW, nozX1 = IC[0] - endR + endW;
const nozTop = 40;
el("path", { d: `M${P2(outerWall)}L${nozX0 - 16} ${IC[1]}L${nozX0 - 16} ${nozTop}L${nozX1 + 16} ${nozTop}L${nozX1 + 16} ${IC[1] - 150}Z`, fill: "url(#hatch2)", stroke: "#2C4A5A", "stroke-width": 2.4, "stroke-linejoin": "round" }, isvg);
const passage = el("path", { d: `M${P2(passOuter)}L${nozX0} ${IC[1]}L${nozX0} ${nozTop + 2}L${nozX1} ${nozTop + 2}L${nozX1} ${IC[1]}L${P2(passInner.slice().reverse())}Z`, fill: "#D6F0FA", stroke: "#2C4A5A", "stroke-width": 2, "stroke-linejoin": "round" }, isvg);
const pressureFill = el("path", { d: passage.getAttribute("d"), fill: "url(#noz)", opacity: 0 }, isvg);
// discharge flange marks
el("path", { d: `M${nozX0 - 26} ${nozTop}H${nozX1 + 26}`, stroke: "#2C4A5A", "stroke-width": 6, "stroke-linecap": "round" }, isvg);
// impeller chamber
el("circle", { cx: IC[0], cy: IC[1], r: IR.tip + 8, fill: "#EAF7FD", stroke: "#A9C0CA", "stroke-width": 1.4 }, isvg);
const impG = el("g", {}, isvg);
el("circle", { cx: IC[0], cy: IC[1], r: IR.tip, fill: "#FFFFFF", stroke: "#2C4A5A", "stroke-width": 2.4 }, impG);
const NV = 6;
for (let i = 0; i < NV; i++) {
  const a0 = (i / NV) * Math.PI * 2;
  const pts = [];
  for (let k = 0; k <= 16; k++) { const r = lerp(IR.eye, IR.tip - 4, k / 16); const a = a0 - 0.9 * ((r - IR.eye) / (IR.tip - IR.eye)); pts.push([IC[0] + Math.cos(a) * r, IC[1] + Math.sin(a) * r]); }
  el("path", { d: "M" + P2(pts), fill: "none", stroke: "#0B4F6C", "stroke-width": 7, "stroke-linecap": "round" }, impG);
}
el("circle", { cx: IC[0], cy: IC[1], r: IR.eye, fill: "#D6F0FA", stroke: "#2C4A5A", "stroke-width": 2 }, impG);
el("circle", { cx: IC[0], cy: IC[1], r: IR.hub, fill: "#FFFFFF", stroke: "#2C4A5A", "stroke-width": 2 }, impG);
el("path", { d: `M${IC[0] - 8} ${IC[1] - IR.hub}h16v8h-16z`, fill: "#0B4F6C" }, impG);
// "flow toward viewer" eye symbol
const eyeSym = el("g", {}, isvg);
el("circle", { cx: IC[0], cy: IC[1], r: 9, fill: "#29A9DC" }, eyeSym);
el("circle", { cx: IC[0], cy: IC[1], r: 15, fill: "none", stroke: "#29A9DC", "stroke-width": 2.5 }, eyeSym);
// rotation arrow
el("path", { d: `M${IC[0] + 112} ${IC[1] - 112}A158 158 0 0 1 ${IC[0] + 150} ${IC[1] + 50}`, fill: "none", stroke: "#29A9DC", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.9 }, isvg);
el("path", { d: `M${IC[0] + 150} ${IC[1] + 50}l-10 -14l16 -1z`, fill: "#29A9DC" }, isvg);
const ipart = el("g", {}, isvg);
const NP = 70;
const iDots = [];
for (let i = 0; i < NP; i++) iDots.push(el("circle", { r: 5, fill: "#29A9DC", stroke: "#fff", "stroke-width": 1.4 }, ipart));
// info column
const info = el("g", { transform: "translate(860 70)" }, isvg);
info.innerHTML = `
<text x="0" y="0" class="tag" font-size="22" fill="#6B8794" letter-spacing="2">POTONGAN DEPAN POMPA</text>
<g id="iStep1" transform="translate(0 60)">
  <circle cx="18" cy="-8" r="14" fill="#29A9DC"/><text x="18" y="-1" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="18" fill="#fff">1</text>
  <text x="46" y="0" class="tag" font-size="28">Air ditarik masuk di tengah</text></g>
<g id="iStep2" transform="translate(0 116)">
  <circle cx="18" cy="-8" r="14" fill="#29A9DC"/><text x="18" y="-1" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="18" fill="#fff">2</text>
  <text x="46" y="0" class="tag" font-size="28">Dilempar ke luar, seperti kipas</text></g>
<g id="iStep3" transform="translate(0 172)">
  <circle cx="18" cy="-8" r="14" fill="#29A9DC"/><text x="18" y="-1" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="18" fill="#fff">3</text>
  <text x="46" y="0" class="tag" font-size="28">Masuk spiral, lalu ke pipa buang</text></g>
<g id="iBars" transform="translate(0 240)">
  <text x="0" y="0" class="tag2" font-size="22">Kecepatan air</text>
  <rect x="0" y="16" width="380" height="18" rx="9" fill="#F4FBFE" stroke="#D6F0FA"/><rect id="barV" x="0" y="16" width="40" height="18" rx="9" fill="#29A9DC"/>
  <text id="valV" x="560" y="32" text-anchor="end" class="num" font-size="30">2 m/s</text>
  <text x="0" y="88" class="tag2" font-size="22">Tekanan air</text>
  <rect x="0" y="104" width="380" height="18" rx="9" fill="#F4FBFE" stroke="#D6F0FA"/><rect id="barP" x="0" y="104" width="40" height="18" rx="9" fill="#0B4F6C"/>
  <text id="valP" x="560" y="120" text-anchor="end" class="num" font-size="30" fill="#0B4F6C">0,2 bar</text>
</g>`;
const iStep = [1, 2, 3].map((n) => isvg.querySelector("#iStep" + n));
const barV = isvg.querySelector("#barV"), barP = isvg.querySelector("#barP"), valV = isvg.querySelector("#valV"), valP = isvg.querySelector("#valP");
const nozLabel = el("g", {}, isvg);
nozLabel.innerHTML = `<text x="${nozX1 + 40}" y="${nozTop + 30}" class="tag" font-size="24">ke pipa buang</text><path d="M${(nozX0 + nozX1) / 2} ${nozTop + 70}v-52" stroke="#29A9DC" stroke-width="5" stroke-linecap="round"/><path d="M${(nozX0 + nozX1) / 2 - 10} ${nozTop + 30}l10 -14l10 14z" fill="#29A9DC"/>`;
const eyeLabel = el("g", {}, isvg);
eyeLabel.innerHTML = `<path d="M${IC[0] + 14} ${IC[1] + 12}L${IC[0] + 236} ${IC[1] + 214}" class="lead" stroke-width="2"/><circle cx="${IC[0] + 14}" cy="${IC[1] + 12}" r="5" fill="#fff" stroke="#29A9DC" stroke-width="3"/><text x="${IC[0] + 244}" y="${IC[1] + 230}" class="tag" font-size="24">air masuk di tengah</text>`;

function impellerParticle(i, t) {
  // phase 0..1 through: eye -> vane tip -> spiral -> nozzle
  const rnd = (n) => { const x = Math.sin(i * 77.7 + n * 13.1) * 9137.13; return x - Math.floor(x); };
  const period = 3.2;
  const ph = (t / period + rnd(1)) % 1;
  const omega = 2 * Math.PI * 0.35;
  const startA = rnd(2) * Math.PI * 2;
  if (ph < 0.32) {
    const k = ph / 0.32;
    const r = lerp(IR.eye * 0.6, IR.tip, k * k);
    const a = startA + omega * t - 0.9 * k + 0.0;
    return { p: [IC[0] + Math.cos(a) * r, IC[1] + Math.sin(a) * r], v: 0.2 + 0.8 * k, stage: 1 };
  }
  // release angle relative to the tongue (clockwise = increasing angle)
  const rel = ((startA + omega * (t - (ph - 0.32) * period) - 0.9 - TONGUE) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI);
  if (ph < 0.86) {
    const k = (ph - 0.32) / 0.54;
    const phi = lerp(rel, 2 * Math.PI, k);
    const off = (rnd(3) - 0.5) * 1.2 * vW(phi);
    return { p: ptA(vR(phi) + off * (1 - k * 0.3), phi), v: 1 - 0.35 * k, stage: 2 };
  }
  const k = (ph - 0.86) / 0.14;
  const x = lerp(nozX0 + 10, nozX1 - 10, rnd(4));
  return { p: [x, lerp(IC[1], nozTop + 6, k)], v: 0.6, stage: 3 };
}
function drawImpeller(t, uI, inVolute) {
  const omega = 2 * Math.PI * 0.35;
  impG.setAttribute("transform", `rotate(${(((omega * t) * 180) / Math.PI) % 360} ${IC[0]} ${IC[1]})`);
  const showFrom = 0.9;
  iDots.forEach((d, i) => {
    const q = impellerParticle(i, t);
    const vis = smooth(seg(uI, showFrom + (i % 10) * 0.08, showFrom + 0.5 + (i % 10) * 0.08));
    const emph = inVolute ? (q.stage >= 2 ? 1 : 0.35) : (q.stage === 1 ? 1 : 0.55);
    d.setAttribute("cx", q.p[0].toFixed(1)); d.setAttribute("cy", q.p[1].toFixed(1));
    d.setAttribute("r", (3.2 + 2.6 * q.v).toFixed(2));
    d.setAttribute("opacity", (vis * emph).toFixed(3));
  });
  const a1 = smooth(seg(uI, 1.4, 1.9)), a2 = smooth(seg(uI, 3.6, 4.1));
  const a3 = inVolute ? 1 : 0;
  iStep[0].setAttribute("opacity", (0.25 + 0.75 * a1 * (inVolute ? 0.45 : 1)).toFixed(3));
  iStep[1].setAttribute("opacity", (0.25 + 0.75 * a2 * (inVolute ? 0.45 : 1)).toFixed(3));
  iStep[2].setAttribute("opacity", (0.25 + 0.75 * a3).toFixed(3));
  const g = inVolute ? 1 : smooth(seg(uI, 3.8, 7.5));
  const vel = lerp(2, 18, g), pres = lerp(0.2, 2.5, inVolute ? 1 : g * 0.8);
  barV.setAttribute("width", (lerp(30, 380, g)).toFixed(1));
  barP.setAttribute("width", (lerp(30, 380, inVolute ? 1 : g * 0.8)).toFixed(1));
  valV.textContent = (inVolute ? "± " : "") + fmt(vel) + " m/s";
  valP.textContent = fmt(pres, 1) + " bar";
  eyeLabel.setAttribute("opacity", (smooth(seg(uI, 1.4, 1.9)) * (inVolute ? 0.0 : 1)).toFixed(3));
  pressureFill.setAttribute("opacity", (inVolute ? 0.55 : 0.55 * smooth(seg(uI, 4.5, 7))).toFixed(3));
  nozLabel.setAttribute("opacity", (inVolute ? 1 : 0).toFixed(3));
}

// Cooler inset -----------------------------------------------------------------
const PC = panel("cooler", { x: 1130, y: 300, w: 700, h: 520 });
PC.div.innerHTML = `<svg width="700" height="520" viewBox="0 0 700 520"></svg>`;
const csvg = PC.div.querySelector("svg");
(() => {
  let h = `<text x="36" y="52" class="tag" font-size="20" fill="#6B8794" letter-spacing="2">DI DALAM PENUKAR PANAS</text>`;
  const x0 = 120, y0 = 110, ch = 300, n = 8, cw = 44, gap = 10;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cw + gap);
    const sw = i % 2 === 0;
    h += `<rect x="${x}" y="${y0}" width="${cw}" height="${ch}" rx="10" fill="${sw ? "#BFE6F6" : "#FBEFC4"}" stroke="${sw ? "#29A9DC" : "#D9B44A"}" stroke-width="2"/>`;
    h += `<g class="cflow" data-dir="${sw ? 1 : -1}" data-x="${x + cw / 2}" data-kind="${sw ? "sw" : "fw"}"></g>`;
    if (!sw && i < n - 1) for (let k = 0; k < 3; k++) {
      const yy = y0 + 70 + k * 80;
      h += `<path class="heat" d="M${x + cw - 6} ${yy}q8 -8 14 0t14 0" fill="none" stroke="#E0A93A" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  h += `<text x="${x0 - 12}" y="${y0 - 18}" class="tag" font-size="22" fill="#0B4F6C">Air laut masuk 32 °C</text>`;
  h += `<text x="${x0 - 12}" y="${y0 + ch + 40}" class="tag" font-size="22" fill="#0B4F6C">Air laut keluar 42 °C</text>`;
  h += `<text x="${x0 + 8 * (cw + gap) + 4}" y="${y0 + ch - 10}" class="tag2" font-size="20" text-anchor="start">air tawar</text><text x="${x0 + 8 * (cw + gap) + 4}" y="${y0 + ch + 14}" class="tag" font-size="22" fill="#B8902A">masuk 45 °C</text>`;
  h += `<text x="${x0 + 8 * (cw + gap) + 4}" y="${y0 + 14}" class="tag2" font-size="20">air tawar</text><text x="${x0 + 8 * (cw + gap) + 4}" y="${y0 + 40}" class="tag" font-size="22" fill="#B8902A">keluar 36 °C</text>`;
  h += `<g transform="translate(36 480)"><circle cx="8" cy="-7" r="8" fill="#29A9DC"/><text x="24" y="0" class="tag2" font-size="20">air laut</text><circle cx="140" cy="-7" r="8" fill="#F6D978" stroke="#D9B44A" stroke-width="2"/><text x="156" y="0" class="tag2" font-size="20">air tawar</text><path d="M290 -7q8 -8 14 0t14 0" fill="none" stroke="#E0A93A" stroke-width="3" stroke-linecap="round"/><text x="328" y="0" class="tag2" font-size="20">panas berpindah</text></g>`;
  csvg.innerHTML = h;
})();
const cflows = [...csvg.querySelectorAll(".cflow")].map((g) => {
  const dots = [];
  for (let k = 0; k < 6; k++) dots.push(el("path", { d: "M-7 -5L0 5L7 -5", fill: "none", stroke: g.dataset.kind === "sw" ? "#29A9DC" : "#C99A2E", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, g));
  return { g, dots, dir: Number(g.dataset.dir), x: Number(g.dataset.x) };
});
const heats = [...csvg.querySelectorAll(".heat")];
function drawCooler(t, u) {
  cflows.forEach((c, j) => c.dots.forEach((d, k) => {
    const ph = ((t * 0.45 + k / 6 + j * 0.07) % 1);
    const y = c.dir > 0 ? lerp(120, 400, ph) : lerp(400, 120, ph);
    const a = Math.sin(ph * Math.PI);
    d.setAttribute("transform", `translate(${c.x} ${y.toFixed(1)}) rotate(${c.dir > 0 ? 0 : 180})`);
    d.setAttribute("opacity", a.toFixed(3));
  }));
  heats.forEach((h, k) => h.setAttribute("opacity", (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 4 - k * 0.7))).toFixed(3)));
}

// HMI ----------------------------------------------------------------------------
const PH = panel("hmi", { x: 300, y: 262, w: 1320, h: 600 });
PH.div.innerHTML = `<svg width="1320" height="600" viewBox="0 0 1320 600"></svg>`;
const hsvg = PH.div.querySelector("svg");
hsvg.innerHTML = `
<text x="44" y="60" class="tag" font-size="20" fill="#6B8794" letter-spacing="2">LAYAR MONITORING · POMPA AIR LAUT</text>
<g transform="translate(44 92)">
  <rect width="250" height="54" rx="27" fill="#F4FBFE" stroke="#D6F0FA"/>
  <g transform="translate(16 13)"><svg width="28" height="28" viewBox="0 0 24 24" class="ic">${ICON.sensor}</svg></g>
  <text x="54" y="35" class="tag" font-size="22">Sensor RPM</text>
  <path d="M262 27h80" stroke="#D6F0FA" stroke-width="4" stroke-linecap="round"/><circle id="pulse1" cx="262" cy="27" r="7" fill="#29A9DC"/>
  <rect x="354" width="190" height="54" rx="27" fill="#F4FBFE" stroke="#D6F0FA"/>
  <g transform="translate(370 13)"><svg width="28" height="28" viewBox="0 0 24 24" class="ic">${ICON.plc}</svg></g>
  <text x="408" y="35" class="tag" font-size="22">PLC</text>
  <path d="M556 27h80" stroke="#D6F0FA" stroke-width="4" stroke-linecap="round"/><circle id="pulse2" cx="556" cy="27" r="7" fill="#29A9DC"/>
  <rect x="648" width="190" height="54" rx="27" fill="#F4FBFE" stroke="#D6F0FA"/>
  <g transform="translate(664 13)"><svg width="28" height="28" viewBox="0 0 24 24" class="ic">${ICON.screen}</svg></g>
  <text x="702" y="35" class="tag" font-size="22">Layar</text>
</g>
<g transform="translate(300 400)">
  <path id="gTrack" d="" fill="none" stroke="#D6F0FA" stroke-width="26" stroke-linecap="round"/>
  <path id="gArc" d="" fill="none" stroke="#29A9DC" stroke-width="26" stroke-linecap="round"/>
  <g id="gTicks"></g>
  <text x="0" y="-12" text-anchor="middle" id="rpmNum" class="num" font-size="96">0</text>
  <text x="0" y="34" text-anchor="middle" class="tag2" font-size="26">rpm · putaran poros</text>
  <text x="-205" y="78" text-anchor="middle" class="tag2" font-size="18">0</text><text x="205" y="78" text-anchor="middle" class="tag2" font-size="18">2.000</text>
</g>
<g transform="translate(620 190)" id="tiles"></g>
<g transform="translate(620 470)">
  <text x="0" y="0" class="tag2" font-size="20">Tren putaran (rpm)</text>
  <rect x="0" y="14" width="640" height="88" rx="14" fill="#F4FBFE" stroke="#D6F0FA"/>
  <path id="spark" d="" fill="none" stroke="#29A9DC" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
</g>`;
const gArc = hsvg.querySelector("#gArc"), gTrack = hsvg.querySelector("#gTrack"), rpmNum = hsvg.querySelector("#rpmNum"), spark = hsvg.querySelector("#spark");
const arcD = (f) => { const a0 = Math.PI * 0.82, a1 = Math.PI * 2.18; const a = lerp(a0, a1, f); const R = 200; const p0 = [Math.cos(a0) * R, Math.sin(a0) * R], p1 = [Math.cos(a) * R, Math.sin(a) * R]; return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}A${R} ${R} 0 ${a - a0 > Math.PI ? 1 : 0} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`; };
gTrack.setAttribute("d", arcD(1));
const TILES = [
  { k: "Tekanan pipa buang", v: (g) => fmt(lerp(0, 2.5, g), 1) + " bar" },
  { k: "Air laut masuk", v: () => "32 °C" },
  { k: "Air laut keluar", v: () => "42 °C" },
];
const tilesG = hsvg.querySelector("#tiles");
const tileVals = TILES.map((T, i) => {
  const g = el("g", { transform: `translate(${i * 216} 0)` }, tilesG);
  el("rect", { width: 200, height: 220, rx: 22, fill: "#F4FBFE", stroke: "#D6F0FA" }, g);
  const k = el("text", { x: 20, y: 44, class: "tag2", "font-size": 19 }, g); k.textContent = T.k;
  const v = el("text", { x: 20, y: 120, class: "num", "font-size": 44, fill: "#0B4F6C" }, g);
  const st = el("text", { x: 20, y: 186, class: "tag2", "font-size": 18 }, g); st.textContent = "normal";
  el("circle", { cx: 176, cy: 180, r: 7, fill: "#29A9DC" }, g);
  return v;
});
const pulse1 = hsvg.querySelector("#pulse1"), pulse2 = hsvg.querySelector("#pulse2");
const RPM = 1780;
function drawHMI(t, u) {
  const g = smooth(seg(u, 0.4, 2.2));
  const rpm = RPM * g + Math.sin(t * 3.1) * 4 * g;
  gArc.setAttribute("d", arcD(Math.max(0.002, rpm / 2000)));
  rpmNum.textContent = fmt(rpm);
  tileVals.forEach((v, i) => (v.textContent = TILES[i].v(g)));
  const pts = [];
  for (let i = 0; i <= 60; i++) { const x = (i / 60) * 620 + 10; const tt = t - (60 - i) * 0.05; const gg = smooth(seg(tt - (t - u), 0.4, 2.2)); const r = RPM * gg + Math.sin(tt * 3.1) * 4 * gg; pts.push([x, 14 + 80 - (r / 2000) * 70]); }
  spark.setAttribute("d", "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L"));
  const k1 = (t * 0.9) % 1, k2 = (t * 0.9 + 0.5) % 1;
  pulse1.setAttribute("cx", (262 + 80 * k1).toFixed(1)); pulse1.setAttribute("opacity", Math.sin(k1 * Math.PI).toFixed(3));
  pulse2.setAttribute("cx", (556 + 80 * k2).toFixed(1)); pulse2.setAttribute("opacity", Math.sin(k2 * Math.PI).toFixed(3));
}

// Summary card ---------------------------------------------------------------------
const PS = panel("summary", { x: 360, y: 300, w: 1200, h: 420 });
PS.div.innerHTML = `<svg width="1200" height="420" viewBox="0 0 1200 420">
<text x="600" y="74" text-anchor="middle" class="tag" font-size="22" fill="#6B8794" letter-spacing="2">RINGKASAN</text>
${[["drop", "Air laut masuk", "lewat sea chest"], ["hx", "Menyerap panas", "di central cooler"], ["wave", "Kembali ke laut", "membawa panas"]].map(([ic, a, b], i) => `
<g class="sumStep" transform="translate(${130 + i * 360} 120)">
  <rect width="260" height="230" rx="26" fill="#F4FBFE" stroke="#D6F0FA"/>
  <circle cx="130" cy="70" r="44" fill="#fff" stroke="#D6F0FA"/>
  <g transform="translate(100 40)" class="ic"><svg width="60" height="60" viewBox="0 0 24 24">${ICON[ic]}</svg></g>
  <text x="130" y="158" text-anchor="middle" class="tag" font-size="26">${a}</text>
  <text x="130" y="192" text-anchor="middle" class="tag2" font-size="20" font-style="${i ? "italic" : "normal"}">${b}</text>
</g>${i < 2 ? `<path class="sumArrow" d="M${130 + i * 360 + 276} 235h68m-14 -12l14 12l-14 12" fill="none" stroke="#29A9DC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`).join("")}
</svg>`;
const sumSteps = [...PS.div.querySelectorAll(".sumStep")], sumArrows = [...PS.div.querySelectorAll(".sumArrow")];
PS.div.querySelectorAll(".ic").forEach((g) => g.setAttribute("style", ""));

// ---- sea waves ---------------------------------------------------------------
const waves = $("waves");
const seaTop = document.querySelector(".sea-top").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
function drawWaves(t) {
  // front edge of the sea top: from point 3 to point 2 (x0,y+d) -> (x0+w,y+d)
  const a = [seaTop[6], seaTop[7]], b = [seaTop[4], seaTop[5]];
  const n = 60, pts = [];
  for (let i = 0; i <= n; i++) { const k = i / n; pts.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(k * 26 + t * 2.2) * 1.6]); }
  const pts2 = [];
  for (let i = 0; i <= n; i++) { const k = i / n; pts2.push([lerp(a[0], b[0], k) + 30, lerp(a[1], b[1], k) - 22 + Math.sin(k * 22 - t * 1.8) * 1.3]); }
  waves.setAttribute("d", "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "M" + pts2.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L"));
}

// ---- master seek ---------------------------------------------------------------
function sceneAt(t) { for (let i = DATA.scenes.length - 1; i >= 0; i--) if (t >= DATA.scenes[i].start) return i; return 0; }
function camAt(t) {
  const i = sceneAt(t);
  const sc = DATA.scenes[i];
  return CAM[sc.id](t - sc.start, sc.dur);
}
window.seek = function (t) {
  const i = sceneAt(t);
  const sc = DATA.scenes[i];
  const u = t - sc.start, d = sc.dur;
  setCamera(camAt(t));
  setScene(i, u, d);

  // water fill schedule (global)
  const F = (id, a, b) => seg(t, s(id) + a, s(id) + b);
  setFlow("sea", F("hull", 1.0, 4.4), t);
  setFlow("strainer", F("suction", -0.6, 0.6), t);
  setFlow("suction", F("suction", 0.4, 2.6), t);
  const primeF = F("suction", 2.4, 4.6);
  const py = lerp(primeBox[1], primeBox[0], smooth(primeF));
  primeRect.setAttribute("y", py.toFixed(1)); primeRect.setAttribute("height", (primeBox[1] - py + 2).toFixed(1));
  prime.style.display = primeF > 0 ? "" : "none";
  prime.setAttribute("opacity", (1 - 0.75 * seg(t, s("pump"), s("pump") + 1.2)).toFixed(3));
  setFlow("pump", F("volute", 0, 1.2), t);
  setFlow("discharge", F("volute", d * 0 + SC.volute.dur - 2.2, SC.volute.dur + 1.2), t);
  setFlow("coolerSw", F("cooler", 1.0, 2.6), t);
  setFlow("engine", F("cooler", 1.6, 3.0), t);
  setFlow("fwHot", F("cooler", 2.4, 3.8), t);
  setFlow("coolerFw", F("cooler", 3.4, 4.6), t);
  setFlow("fwCold", F("cooler", 4.2, 5.6), t);
  setFlow("overboard", F("overboard", 0.3, 2.6), t);
  setFlow("cable", F("monitor", 1.6, 3.4), t, 60);

  // shaft rotation once primed
  const running = t > s("suction") + 4.6;
  const spin = running ? Math.min(1, (t - s("suction") - 4.6) / 1.5) : 0;
  const phaseRev = running ? 0.55 * (t - s("suction") - 4.6) - 0.55 * 0.75 * (1 - spin) : 0;
  setRot(((Math.floor(phaseRev * 6 * DATA.rotFrames) % DATA.rotFrames) + DATA.rotFrames) % DATA.rotFrames);
  axisLine.setAttribute("opacity", (smooth(seg(u, 0.4, 0.9)) * (sc.id === "drive" ? 1 : 0)).toFixed(3));
  axisLine.setAttribute("stroke-dashoffset", (t * 40).toFixed(1));

  // highlights
  const HL = {
    hull: ["hull"], suction: ["strainer"], pump: ["motor", "shaft", "volute", "frame"], bearing: ["frame"], drive: ["motor", "shaft", "volute"],
    impeller: ["volute"], volute: ["volute"], cooler: ["cooler", "engine"], overboard: ["hull"], monitor: ["sensor", "plc", "cable"], summary: [],
  };
  highlight(HL[sc.id] || []);

  // particles in the sea (inflow) and at the outlet (warm outflow)
  const seaVis = Math.max(1 - seg(t, s("pump"), s("pump") + 1), seg(t, s("overboard"), s("overboard") + 1)) * seg(t, 0.4, 1.6);
  DATA.seaParticles.forEach((q, k) => {
    const ph = (t / 3.2 + q.ph) % 1;
    const p = [lerp(q.a[0], q.b[0], ph), lerp(q.a[1], q.b[1], ph)];
    seaDots[k].setAttribute("cx", p[0].toFixed(1)); seaDots[k].setAttribute("cy", p[1].toFixed(1));
    seaDots[k].setAttribute("opacity", (seaVis * Math.sin(ph * Math.PI) * 0.9).toFixed(3));
  });
  const outVis = seg(t, s("overboard") + 2.2, s("overboard") + 3.0);
  DATA.outParticles.forEach((q, k) => {
    const ph = (t / 2.6 + q.ph) % 1;
    const p = [lerp(q.a[0], q.b[0], ph), lerp(q.a[1], q.b[1], ph)];
    outDots[k].setAttribute("cx", p[0].toFixed(1)); outDots[k].setAttribute("cy", p[1].toFixed(1));
    outDots[k].setAttribute("opacity", (outVis * Math.sin(ph * Math.PI) * 0.9).toFixed(3));
  });
  // signal pulses along the cable
  const cab = FLOW.cable;
  const sigVis = seg(t, s("monitor") + 3.2, s("monitor") + 3.6) * (1 - seg(t, s("summary"), s("summary") + 0.5));
  sigDots.forEach((dot, k) => {
    const ph = (t * 0.55 + k / 4) % 1;
    const { p } = pointAt(cab.pts, cab.acc, ph * cab.acc[cab.acc.length - 1]);
    dot.setAttribute("cx", p[0].toFixed(1)); dot.setAttribute("cy", p[1].toFixed(1));
    dot.setAttribute("opacity", (sigVis * Math.sin(ph * Math.PI)).toFixed(3));
  });
  const hmiOn = seg(t, s("monitor") + 3.6, s("monitor") + 4.0);
  hmi.style.fill = hmiOn > 0 ? `rgb(${Math.round(lerp(11, 41, hmiOn))},${Math.round(lerp(79, 169, hmiOn))},${Math.round(lerp(108, 220, hmiOn))})` : "";
  lamps.forEach((l, k) => l.setAttribute("opacity", (hmiOn > 0 ? 0.4 + 0.6 * (Math.sin(t * 5 + k) > 0 ? 1 : 0.2) : 1).toFixed(2)));
  drawWaves(t);

  // callouts
  for (const id of Object.keys(CALL)) drawCallout(id, t);
  // prime callout shows a % fill
  CALL.prime.div.querySelector("span:last-child").innerHTML = `Pompa terisi air <b style="color:#29A9DC">${Math.round(smooth(primeF) * 100)}%</b>`;

  // panels
  const bVis = Math.min(seg(t, s("bearing") + 1.15, s("bearing") + 2.0), 1 - seg(t, e_("bearing") - 1.25, e_("bearing") - 0.35));
  showPanel(PB, bVis, toScreen(A.bearing));
  if (bVis > 0) drawBearing(t, t - s("bearing"));
  const iVis = Math.min(seg(t, s("impeller") + 1.05, s("impeller") + 1.9), 1 - seg(t, e_("volute") - 2.6, e_("volute") - 1.9));
  showPanel(PI_, iVis, toScreen(A.volute));
  if (iVis > 0) drawImpeller(t, t - s("impeller"), t >= s("volute"));
  const cVis = Math.min(seg(t, s("cooler") + 4.0, s("cooler") + 4.8), 1 - seg(t, e_("cooler") - 0.6, e_("cooler")));
  showPanel(PC, cVis, toScreen(A.coolerHead));
  if (cVis > 0) drawCooler(t, t - s("cooler"));
  const hVis = Math.min(seg(t, s("monitor") + 5.0, s("monitor") + 5.8), 1 - seg(t, e_("monitor") - 0.35, e_("monitor")));
  showPanel(PH, hVis, toScreen(A.screen));
  if (hVis > 0) drawHMI(t, t - s("monitor") - 5.0);
  const sVis = seg(t, s("summary") + 1.6, s("summary") + 2.4);
  showPanel(PS, sVis, [960, 540]);
  sumSteps.forEach((g, k) => g.setAttribute("opacity", smooth(seg(t, s("summary") + 2.2 + k * 0.5, s("summary") + 2.7 + k * 0.5)).toFixed(3)));
  sumArrows.forEach((g, k) => g.setAttribute("opacity", smooth(seg(t, s("summary") + 2.5 + k * 0.5, s("summary") + 2.9 + k * 0.5)).toFixed(3)));
  $("brand").style.opacity = (0.9 * smooth(seg(t, 0.3, 1.2))).toFixed(3);
  // whole-frame fade in/out
  $("frame").style.opacity = Math.min(seg(t, 0, 0.5), 1 - seg(t, DATA.total - 0.6, DATA.total)).toFixed(3);
};
window.TOTAL = DATA.total;
const q = new URLSearchParams(location.search);
if (q.has("t")) seek(Number(q.get("t")));
else if (q.has("play")) { const t0 = performance.now(); const loop = () => { seek(((performance.now() - t0) / 1000) % DATA.total); requestAnimationFrame(loop); }; loop(); }
else seek(2);
