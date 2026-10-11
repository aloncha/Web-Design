// Renders video.html frame by frame into an mp4 with the narration mixed in.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const FPS = 30;
const { scenes, total } = JSON.parse(readFileSync("audio/timeline.json", "utf8"));
const only = process.argv[2] ? Number(process.argv[2]) : total; // optional: seconds to render
const N = Math.round(Math.min(only, total) * FPS);
const inputs = ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-"];
const delays = scenes.map((s, i) => { inputs.push("-i", `audio/s${i}.wav`); return `[${i + 1}]adelay=${Math.round(s.voice * 1000)}|${Math.round(s.voice * 1000)}[a${i}]`; });
const mix = delays.join(";") + ";" + scenes.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${scenes.length}:normalize=0,apad,atrim=0:${(N / FPS).toFixed(3)}[aout]`;
const ff = spawn("ffmpeg", [...inputs, "-filter_complex", mix, "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", process.argv[3] || "pompa-air-laut.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto("file://" + resolve("video.html"));
await page.waitForTimeout(600);
const t0 = Date.now();
for (let f = 0; f < N; f++) {
  await page.evaluate((t) => seek(t), f / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 150 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log("done", ((Date.now() - t0) / 1000).toFixed(0), "s");
