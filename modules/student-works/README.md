# Galeri Karya Siswa

Route `#karya`, tetap dalam SPA. `core.js` menangani URL, YouTube, dan filter; `works.js` menangani galeri dan pengelolaan; `works.css` khusus tampilannya.

Backend: `apps-script/03-KARYA-SISWA/` dan panduan `apps-script/MULAI-DI-SINI.md`. `worksApiUrl` dipakai jika terisi, jika kosong menggunakan `apiUrl` terpadu, jika keduanya kosong menggunakan penyimpanan contoh lokal. Token login backend terpisah tersimpan per menu dalam sessionStorage. Hanya Admin dapat mengelola; publik hanya membaca Terbit.

Data gambar/video berupa tautan (atau assets/karya/ dalam repository). Belum tersedia upload biner ke Drive. Editor mendukung Draft/Terbit/Arsip, deskripsi, sampul, pencarian dan filter jenis.
