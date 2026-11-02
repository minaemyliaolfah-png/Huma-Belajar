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
  chapterThumbnails: {},
});
