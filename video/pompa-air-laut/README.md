# Pompa air laut pendingin mesin induk — video penjelasan

Video ±80 detik (1920×1080, 30 fps, MP4) tentang alur air laut: *sea chest* → saringan → pipa isap → pompa (motor, poros, *bearing*, *impeller*, *volute*) → *central cooler* → kembali ke laut, plus sensor RPM → PLC → layar.

- `world.mjs` — gambar isometrik ruang mesin (kit skill `anatomy`).
- `script.mjs` — narasi per adegan (teks subtitle dan teks ucapan).
- `runtime.js`, `video.css` — linimasa deterministik `seek(t)`: kamera, aliran air, panel kaca, label.
- `voice.mjs` — narasi Bahasa Indonesia (espeak-ng + suara MBROLA `id1`).
- `build-video.mjs` → `video.html`; `render.mjs` → `pompa-air-laut.mp4`.

Membangun ulang (butuh `espeak-ng mbrola mbrola-id1 ffmpeg`, `npm i @fontsource/poppins playwright-core`):

```sh
node voice.mjs && node build-video.mjs && node render.mjs
```

Buka `video.html?play` di browser untuk pratinjau langsung, atau `video.html?t=25` untuk satu momen.
