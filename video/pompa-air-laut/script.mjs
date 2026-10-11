// Narration and scene plan. `say` is what the voice reads (loanwords spelt
// for the Indonesian voice); `sub` is the on-screen subtitle (foreign terms in <i>).
export const SCENES = [
  {
    id: "hull", min: 5, title: "Air laut masuk",
    sub: "Air laut masuk lewat <i>sea chest</i>, lubang di lambung kapal yang dilindungi saringan.",
    say: "Air laut masuk lewat si cest, lubang di lambung kapal yang dilindungi saringan.",
  },
  {
    id: "suction", min: 5, title: "Pipa isap",
    sub: "Lewat pipa isap, air mengalir ke pompa. Pompa harus terisi penuh air dulu, baru bisa bekerja.",
    say: "Lewat pipa isap, air mengalir ke pompa. Pompa harus terisi penuh air dulu, baru bisa bekerja.",
  },
  {
    id: "pump", min: 5, title: "Pompa dari luar",
    sub: "Motor listrik di satu sisi, rumah spiral (<i>volute</i>) di sisi lain, dan poros di antaranya.",
    say: "Motor listrik di satu sisi, rumah spiral atau volut di sisi lain, dan poros di antaranya.",
  },
  {
    id: "bearing", min: 9, title: "Di dalam <i>bearing</i>",
    sub: "<i>Bearing</i>, penopang poros di belakang <i>impeller</i>, bekerja seperti jalur bola: poros berputar halus, gesekannya kecil.",
    say: "Bering, penopang poros di belakang impeler, bekerja seperti jalur bola. Poros berputar halus, gesekannya kecil.",
  },
  {
    id: "drive", min: 3, title: "Penggerak",
    sub: "Motor memutar poros, poros memutar <i>impeller</i>.",
    say: "Motor memutar poros, poros memutar impeler.",
  },
  {
    id: "impeller", min: 10, title: "<i>Impeller</i>",
    sub: "<i>Impeller</i> (roda bersudu) seperti kipas: air ditarik di tengah, dilempar ke luar oleh gaya sentrifugal. Tekanan dan kecepatan naik.",
    say: "Impeler, roda bersudu, bekerja seperti kipas. Air ditarik masuk di tengah, lalu dilempar keluar oleh gaya sentrifugal. Tekanan dan kecepatannya naik.",
  },
  {
    id: "volute", min: 5, title: "<i>Volute</i> dan pipa buang",
    sub: "Air masuk ke rumah spiral yang makin lebar, lalu keluar lewat pipa buang.",
    say: "Air masuk ke rumah spiral yang makin lebar, lalu keluar lewat pipa buang.",
  },
  {
    id: "cooler", min: 10, title: "<i>Central cooler</i>",
    sub: "Penukar panas ini mirip radiator: air laut menyerap panas dari air tawar pendingin, yang tadi mengambil panas dari mesin induk.",
    say: "Sentral kuler adalah penukar panas, mirip radiator. Air laut menyerap panas dari air tawar pendingin, yang tadi mengambil panas dari mesin induk.",
  },
  {
    id: "overboard", min: 5, title: "Kembali ke laut",
    sub: "Air laut yang sudah hangat dibuang kembali ke laut.",
    say: "Air laut yang sudah hangat dibuang kembali ke laut.",
  },
  {
    id: "monitor", min: 10, title: "Sensor dan monitoring",
    sub: "Sensor RPM membaca kecepatan putar poros. Datanya dikirim ke PLC, komputer kendali, lalu tampil di layar monitoring.",
    say: "Sensor er pe em membaca kecepatan putar poros. Datanya dikirim ke pe el se, komputer kendali, lalu tampil di layar monitoring.",
  },
  {
    id: "summary", min: 5, title: "Ringkasan",
    sub: "Air laut tidak menjadi bagian mesin. Ia hanya membawa panas dari sistem pendingin ke laut.",
    say: "Jadi, air laut tidak menjadi bagian mesin. Ia hanya membawa panas dari sistem pendingin ke laut.",
  },
];
