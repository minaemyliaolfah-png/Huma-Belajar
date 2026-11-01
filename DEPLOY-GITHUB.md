# Unggah Huma Belajar ke GitHub Pages — database terpadu

URL Apps Script dari Anda sudah dipasang pada `config.js` sebagai `apiUrl`. `dictionaryApiUrl` dan `worksApiUrl` sengaja kosong agar Materi, Kamus, dan Karya Siswa memakai satu backend / Spreadsheet dan akun yang sama. TKA tetap memakai koneksi ujian sebelumnya di `modules/tka/config.js`.

## 1. Selesaikan akses Apps Script

Saat diperiksa pada 1 November 2026 tanpa login Google, URL yang diberikan masih menampilkan halaman masuk Google; permintaan baca Materi, Kamus, dan Karya Siswa ditolak HTTP 401. Belum bisa dipastikan apakah seluruh fungsi backend tersedia sampai aksesnya diperbaiki. Pemeriksaan ini tidak mengubah baris Spreadsheet.

1. Buka proyek Apps Script terpadu → **Deploy / Terapkan → Manage deployments / Kelola deployment**.
2. Pilih Web App yang URL-nya Anda kirim → **Edit** (ikon pensil).
3. Pastikan **Execute as / Jalankan sebagai: Me / Saya** dan **Who has access / Siapa yang memiliki akses: Anyone / Siapa saja**, bukan hanya pengguna yang sudah login Google. Nama pilihan bisa mengikuti bahasa akun.
4. Pilih versi baru bila kode backend baru saja diperbarui, kemudian Deploy. Mengedit deployment yang sama mempertahankan URL.
5. Buka URL `/exec` di jendela privat tanpa login. Untuk backend Huma ini seharusnya tampil JSON berisi `status: success` dan pesan API aktif, bukan formulir login Google.

Jika opsi Anyone tidak tersedia karena aturan akun sekolah, gunakan akun / pengaturan Workspace yang diizinkan administrator. Jangan membuat Spreadsheet menjadi publik; yang diatur adalah akses Web App. Pengelolaan data dalam aplikasi tetap memerlukan akun guru.

Pastikan seluruh file paket `apps-script/00-TERPADU` sudah dimasukkan ke proyek yang sama: `Code.gs`, `Dictionary.gs`, `KamusSeed.gs`, dan `StudentWorks.gs`. Jalankan `setup`. Untuk mengisi kosakata awal ke tab Kamus, jalankan `importKamusPDF` sekali; impor ulang tidak menimpa entri yang sudah diubah.

## 2. Unggah frontend

1. Ekstrak **Huma-Belajar-GitHub-Pages.zip** ke sebuah folder di komputer. Jangan mengunggah ZIP-nya sebagai satu file.
2. Buat / buka repository GitHub tujuan.
3. Unggah **seluruh isi hasil ekstrak**. Pastikan `index.html` dan `config.js` berada langsung di halaman utama repository, bukan di dalam satu folder pembungkus tambahan. Sertakan folder `modules`, `assets`, dan berkas `.nojekyll`.
4. Buka **Settings → Pages**. Pilih **Source: Deploy from a branch**, lalu **Branch: main**, **Folder: / (root)**, kemudian **Save**. Jika branch repository memakai nama lain, pilih branch tempat file tadi diunggah.
5. Tunggu proses penerbitan selesai. Buka alamat yang ditampilkan GitHub pada halaman Pages.

Tidak memerlukan npm install atau build. Paket GitHub Pages berisi berkas situs; paket lengkap `Huma-Belajar-v4.zip` juga menyertakan sumber Apps Script, alat pengembangan, dan tes untuk disimpan sebagai cadangan proyek.

## 3. Periksa situs setelah terbit

- Beranda/Materi harus membaca isi Spreadsheet Anda; database kosong akan menampilkan keadaan kosong, bukan materi contoh.
- Masuk dengan akun Admin yang dibuat oleh setup untuk menambahkan bab/subbab atau mengelola Karya Siswa.
- Kamus memakai akun yang sama; kontributor dapat mendaftar pada menu Kamus dan usulan tetap menunggu kurasi.
- Coba satu penyimpanan dari akun Anda lalu periksa baris di Spreadsheet. Pengujian penyimpanan live belum dilakukan dari sini karena akses Web App masih terbatas.
- Bila Anda membuat deployment baru dengan URL berbeda, ganti `apiUrl` pada `config.js` dan unggah kembali berkas tersebut. Jika hanya mengedit deployment yang sama, URL biasanya tetap.

Panduan resmi:
- Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- GitHub Pages dari branch: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
