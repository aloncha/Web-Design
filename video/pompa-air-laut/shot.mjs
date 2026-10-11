// node shot.mjs page.html out.png [clip x,y,w,h] [scale] [evalJS]
import { chromium } from "playwright-core";
import { resolve } from "node:path";
const [file, out, clip, scale = "1", js] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(scale) });
page.on("console", (m) => console.log("console:", m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto("file://" + resolve(file));
await page.waitForTimeout(400);
if (js) await page.evaluate(js);
await page.waitForTimeout(100);
const opts = { path: out };
if (clip && clip !== "-") { const [x, y, width, height] = clip.split(",").map(Number); opts.clip = { x, y, width, height }; }
if (out !== "/dev/null") await page.screenshot(opts);
await browser.close();
