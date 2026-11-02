// Tempel URL deployment Web App Apps Script yang berakhiran /exec.
// URL khusus menu kosong = memakai apiUrl; semua kosong = mode contoh.
// Panduan: apps-script/MULAI-DI-SINI.md
window.HUMA_CONFIG = Object.freeze({
  apiUrl: "https://script.google.com/macros/s/AKfycbwsKsP91-jUngvvqCiS7M4CadpWWn5REOUhipXFyz8fBUYOOUwQ_p_y2TH3WmIfD1Z0/exec",
  dictionaryApiUrl: "", // URL paket Apps Script menu Kamus. Kosong = ikut backend utama.
  worksApiUrl: "", // URL paket Apps Script Karya Siswa. Kosong = ikut backend utama.
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
