import { SCENES } from "./script.mjs";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const out = [];
for (const [i, s] of SCENES.entries()) {
  const raw = `audio/raw${i}.wav`, wav = `audio/s${i}.wav`;
  execFileSync("espeak-ng", ["-v", "mb-id1", "-s", "172", "-p", "48", "-g", "2", "-w", raw, s.say], { stdio: ["ignore", "ignore", "ignore"] });
  // gentle cleanup: resample, slight EQ and loudness normalise
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-af", "highpass=f=70,lowpass=f=7000,equalizer=f=3000:t=q:w=1:g=2,aresample=48000,loudnorm=I=-17:TP=-1.5", "-ar", "48000", "-ac", "1", wav]);
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString());
  out.push({ id: s.id, dur });
  console.log(i, s.id, dur.toFixed(2), "min", s.min);
}
writeFileSync("audio/durations.json", JSON.stringify(out, null, 1));
