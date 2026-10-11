// node frames.mjs t1,t2,... prefix  -> contact shots at given times
import { chromium } from "playwright-core";
import { resolve } from "node:path";
const [times, prefix = "shots/f"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("console", (m) => console.log("console:", m.text()));
await page.goto("file://" + resolve("video.html"));
await page.waitForTimeout(500);
for (const t of times.split(",").map(Number)) {
  await page.evaluate((t) => seek(t), t);
  await page.screenshot({ path: `${prefix}${String(t).replace(".", "_")}.png` });
}
await browser.close();
