# Kamus Dayak Ngaju partisipatif

Menu Kamus menyediakan dashboard jumlah entri, pencarian berhalaman, padanan tiga bahasa, profil kontributor, usulan, serta meja kurasi.

## Data awal

Sumber pengguna: **Kamus Dwibahasa Dayak Ngaju–Indonesia**, pengantar September 2013. PDF berisi 181 halaman. Bagian kamus diambil dari halaman PDF 26–179 (halaman buku 1–154).

Setelah penyaringan, tersedia **2.323 entri/subentri** dan **2.284 bentuk kata unik**. Semua hasil diberi label **Perlu verifikasi**. Ini hasil OCR, belum transkripsi yang seluruhnya diperiksa manual. Simbol pelafalan, ejaan, pemenggalan, dan contoh masih dapat salah terbaca. Kutipan, nomor halaman, dan tautan PDF disertakan untuk pemeriksaan.

Arti Inggris untuk **seluruh 2.323 entri** sudah dilengkapi melalui bantuan terjemahan Indonesia–Inggris. Ini tambahan pada aplikasi, tetap berstatus perlu tinjauan dan tidak otomatis dianggap telah disahkan kurator. Nomor entri dicocokkan saat pengambilan hasil agar arti tidak bergeser ke kata lain. Sebanyak 281 blok rujukan atau hasil yang tidak dapat dipisahkan cukup jelas tersimpan di `laporan-ekstraksi.json` untuk peninjauan manual.

## Tampilan partisipasi contoh

Mode contoh menyediakan **56 profil contoh**, **144 contoh entri ditinjau**, dan **8 contoh usulan menunggu**. Profil dan aktivitas tersebut diberi penanda data contoh. Mode live tidak menambahkan profil atau keputusan fiktif: jumlahnya dihitung dari pengguna dan keputusan server. Pendaftaran/usulan yang Anda buat saat mencoba aplikasi tetap dipertahankan.

Penyebutan PDF dan panel ekstraksi dihilangkan dari tampilan utama. Tampilan mengajak pengguna berkontribusi. Rujukan dan lisensi dipertahankan dalam bagian **Rujukan & lisensi** yang dapat dibuka; catatan per entri tersedia bagi kurator. Publikasi rujukan tersedia terbuka di [repositori kementerian](https://repositori.kemendikdasmen.go.id/2897/), berlisensi CC BY-NC 4.0. Berkas sumber lokal telah diverifikasi identik dengan publikasi tersebut melalui SHA-256.

## Kontributor dan kurator

1. **Kontributor** menampilkan nama, bio publik, dan jumlah usulan diterima.
2. **Kontribusi +** mengaktifkan profil dari akun yang sudah ada. Pengunjung baru dapat membuat akun Kontributor dengan username dan password; akun tersebut tidak berwenang mengelola kelas.
3. Isi kata Ngaju, arti Indonesia, Inggris bila diketahui, kategori, dan alasan/sumber. Untuk entri yang sudah ada, gunakan **Usulkan koreksi** pada kartunya.
4. Usulan berstatus **Menunggu** dan tidak langsung mengganti arti.
5. Akun **Admin** atau **Kurator** membuka tab **Kurasi**, membandingkan arti, memeriksa sumber, lalu menerima atau menolak. Penolakan wajib diberi catatan.
6. Tambahan diterbitkan dengan ID baru. Koreksi mempertahankan ID dan sumber. Riwayat sebelum/sesudah dicatat pada backend.
7. **Usulan saya** menampilkan keputusan dan catatan. Persetujuan ditahan jika arti telah berubah sejak usulan diajukan, agar koreksi baru tidak tertimpa.

Di mode contoh, profil, usulan, dan keputusan tersimpan pada browser perangkat. Tombol **Coba sebagai kurator** hanya ada pada mode contoh. Data contoh tidak otomatis dipindahkan ke server ketika URL backend diisi.

## Terjemahkan

Pilih bahasa asal Ngaju, Indonesia, atau Inggris. Pencarian memakai padanan tepat dari entri; pencarian balik juga mengenali arti yang dipisah koma/titik koma. Kata yang sama dengan makna berbeda dapat menghasilkan beberapa padanan.

Ini pencarian **kata/ungkapan dalam kamus**, bukan penerjemahan bebas kalimat Ngaju. Bila arti belum ada, hasil menyatakan belum ditemukan dan menyediakan jalur kontribusi.

Pada backend live, pengguna yang sudah masuk dapat meminta bantuan Inggris melalui `LanguageApp.translate`, sesuai [dokumentasi Google](https://developers.google.com/apps-script/reference/language/language-app). Hasil dilabeli **Terjemahan mesin · Belum ditinjau** dan tidak disimpan sebagai arti resmi secara otomatis. Hasil dapat diajukan kepada kurator. Terjemahan bertolak dari arti Indonesia; kesalahan OCR dapat ikut memengaruhi hasilnya. Batas awal 20 permintaan baru per akun sebelum menunggu sekitar 10 menit, dengan cache. Kuota Google tetap berlaku. Mode contoh belum menyediakan terjemahan mesin.

## Pasang Apps Script dan Spreadsheet

Tambahkan tiga file ke proyek Apps Script materi:

- `apps-script/Code.gs`: API dan skema sheet terbaru.
- `apps-script/Dictionary.gs`: kontributor, usulan, kurasi, impor, dan bantuan Inggris.
- `apps-script/KamusSeed.gs`: data awal PDF.

Cadangkan Spreadsheet lama. Jalankan **`setup()`**, lalu **`importKamusPDF()`** melalui editor. Impor menambahkan ID sumber yang belum ada; dijalankan ulang tidak menimpa arti yang sudah dikoreksi. Perbarui deployment Web App dan isi URL `/exec` di `config.js` utama.

Guru `Admin` otomatis dapat mengurasi. Untuk akun kurator khusus, buat akun melalui Panel Guru, lalu ubah `Role` akun tersebut menjadi `Kurator` pada sheet `Users`. Kurator dapat meninjau kamus, tetapi tidak berwenang mengelola materi kelas.

| Sheet           | Kegunaan                                                   |
| --------------- | ---------------------------------------------------------- |
| `Kamus`         | Entri yang ditampilkan, sumber, halaman, status verifikasi |
| `Kontributor`   | Profil publik yang terkait ID akun                         |
| `Usulan_Kamus`  | Tambahan/koreksi, alasan, status, keputusan, snapshot awal |
| `Riwayat_Kamus` | Arti sebelum/sesudah persetujuan                           |

Kolom `Kamus`:

```text
ID_Kata | Dayak | Indonesia | Inggris | Kategori | Sumber | Halaman_PDF | Status_Verifikasi | ID_Kontributor | Terakhir_Update | ID_Usulan_Terakhir | Status_Inggris | Asal_Inggris
```

`setup()` memperluas skema lima/sebelas kolom menjadi tiga belas kolom tanpa menghapus isinya. `kamus-impor.csv` sudah memuat arti Inggris. Jalankan kembali `importKamusPDF()` setelah memasang seed terbaru untuk melengkapi arti Inggris yang masih kosong pada baris dengan kata/arti Indonesia yang cocok. Arti yang sudah diisi, makna yang sudah dikoreksi, dan koreksi disetujui tetap dipertahankan.

Password dibuat melalui aplikasi/Apps Script supaya tersimpan sebagai hash. Nama tampilan dan bio ditujukan untuk publik. Daftar username, password, dan usulan pengguna lain tidak dikirim ke pengunjung biasa.

## File yang dapat diperbaiki terpisah

- `core.js`: penggabungan sumber/koreksi, pencarian, padanan, dashboard.
- `dictionary.js`: alur pengguna dan kurator.
- `dictionary.css`: tampilan.
- `demo.js`: profil dan aktivitas partisipasi contoh, khusus mode contoh.
- `corpus.js` / `corpus.json`: entri awal, kutipan, halaman sumber.
- `kamus-impor.csv`: data dalam format tabel.
- `scripts/import-kamus-pdf.py`: proses ekstraksi yang dapat diulang.
- `scripts/apply-kamus-english.cjs`: menerapkan hasil Inggris berdasarkan ID, memperbarui corpus/CSV/seed.

Saat menerbitkan, ikutkan seluruh folder `modules/dictionary/` dan `assets/kamus-ngaju-indonesia.pdf`. Tampilan dan sumber dapat dicoba lokal; penyimpanan bersama, pendaftaran akun live, keputusan server, serta bantuan Inggris memerlukan deployment backend terbaru.

## Backend Kamus mandiri

Paket siap dipasang kini tersedia dalam `apps-script/02-KAMUS`. Isi `dictionaryApiUrl` di `config.js` untuk database/account khusus kamus; login melalui tombol Masuk kamus di halaman Kamus. Jika URL khusus kosong, kamus tetap memakai `apiUrl` terpadu. Petunjuk langkah demi langkah ada di `apps-script/MULAI-DI-SINI.md`.
