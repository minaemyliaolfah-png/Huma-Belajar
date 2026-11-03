// Tempel URL deployment Web App Apps Script yang berakhiran /exec.
// Kamus/karya kosong = memakai apiUrl. Klasemen game memakai URL tersendiri.
// Panduan klasemen: 04-APPSCRIPT-KLASEMEN-GAME/MULAI-DI-SINI.txt
window.HUMA_CONFIG = Object.freeze({
  apiUrl: "https://script.google.com/macros/s/AKfycbwsKsP91-jUngvvqCiS7M4CadpWWn5REOUhipXFyz8fBUYOOUwQ_p_y2TH3WmIfD1Z0/exec",
  dictionaryApiUrl: "", // URL paket Apps Script menu Kamus. Kosong = ikut backend utama.
  worksApiUrl: "", // URL paket Apps Script Karya Siswa. Kosong = ikut backend utama.
  gamesApiUrl: "https://script.google.com/macros/s/AKfycbwi_rFYuZ2ohjrZBs0v13my6eOvot3h45Z4OcRfsrvHhMQrVPoFevjZM3HCJljUhZ8K/exec", // Database khusus klasemen game.
  schoolName: "Ruang belajar Bahasa Indonesia",
  // Otomatis: assets/bab/<ID_Bab>.jpg, sesuai ID_Bab di Spreadsheet.
  // Untuk nama/format lain, isi pemetaan, misalnya "B1": "assets/bab/surat-resmi.png".
  chapterThumbnails: {
    "1": "assets/bab/bab-1.png",
    "2": "assets/bab/bab-2.png",
    "3": "assets/bab/bab-3.png",
    "4": "assets/bab/bab-4.png",
    "5": "assets/bab/bab-5.png",
  },
  // Sampul kelas XII yang sudah disiapkan. Pemetaan ID di atas tetap diutamakan.
  chapterArtwork: [
    { kelas: "XII", topik: ["surat resmi", "mengomunikasikan informasi penting"], src: "assets/bab/bab-1.png" },
    { kelas: "XII", topik: ["prosedur", "produktivitas"], src: "assets/bab/bab-2.png" },
    { kelas: "XII", topik: ["novel", "sekolah aman dan nyaman"], src: "assets/bab/bab-3.png" },
    { kelas: "XII", topik: ["eksplanasi", "kecerdasan artifisial"], src: "assets/bab/bab-4.png" },
    { kelas: "XII", topik: ["esai", "kearifan lokal"], src: "assets/bab/bab-5.png" },
  ],
});
