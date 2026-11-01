# Huma Arcade — Zona Game Bahasa Indonesia

Delapan permainan berada dalam menu **Zona Game** pada halaman Huma Belajar. Tidak memerlukan akun dan tidak mengirim hasil ke Apps Script. Rekor disimpan per browser, bukan per siswa. Saat berpindah menu, satu permainan aktif tetap tersimpan dalam memori. Refresh atau menutup halaman mengakhiri sesi aktif.

| Game               | Cara bermain dan skor                                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jejak Peribahasa   | Enam soal acak tentang makna peribahasa. Benar +10; pembahasan langsung dan ulasan akhir.                                                                                                                                                                |
| Selamatkan Lentera | Versi tebak huruf/hangman tanpa gambar orang digantung. Enam kesempatan salah. Skor menang = 40 + 10 × sisa kesempatan; kalah 0. Huruf yang sudah dipilih tidak dihitung lagi.                                                                           |
| Laboratorium Kata  | Lima anagram. Pilih keping huruf berurutan; klik jawaban untuk mengembalikan keping. Benar 20, dikurangi 5 per pemeriksaan salah pada kata tersebut, minimal 5.                                                                                          |
| Silang Sastra      | Satu papan TTS berisi empat petunjuk dengan tiga persilangan. Isian benar seluruhnya 100. Membuka jawaban mengakhiri permainan dengan 0 poin.                                                                                                            |
| Tangga Pengetahuan | Dua pemain bergantian di satu perangkat. Lempar dadu sekali tiap giliran; jawaban benar menggerakkan pion. Naik/turun sesuai petak tangga/ular. Mencapai atau melewati 36 menang. Maksimal 30 giliran, lalu posisi tertinggi menang atau seri jika sama. |
| Tarik Tambang Kata | Dua pemain bergantian. Benar memberi satu tarikan. Selisih 5 tarikan menang lebih cepat; jika tidak, bandingkan tarikan setelah 10 soal.                                                                                                                 |
| Armada Bahasa      | Delapan soal campuran untuk menghancurkan meteor. Benar +10, salah mengurangi satu dari tiga perisai. Selesai setelah delapan soal atau perisai habis.                                                                                                   |
| Detektif Kata Baku | Enam soal ejaan. Benar +10; setiap jawaban mendapatkan penjelasan.                                                                                                                                                                                       |

Skor dua pemain ditampilkan sebagai **poin bersama**; pemenang tetap ditentukan posisi pion atau jumlah tarikan masing-masing, bukan skor bersama. Tidak ada batas waktu, permainan daring antargawai, atau musik otomatis.

## Memperbaiki satu bagian

- `data.js`: 10 soal peribahasa, 20 soal bahasa (enam khusus kata baku), 12 istilah untuk tebak huruf/anagram, dan petunjuk/koordinat TTS.
- `core.js`: pengacakan, pemeriksaan tebak huruf, pembentukan kotak TTS, dan aturan ular tangga.
- `games.js`: katalog, interaksi, sesi permainan, hasil dan rekor.
- `games.css`: gaya visual khusus game, semuanya memakai awalan `ag-` agar tidak bentrok dengan aplikasi lain.

Setiap soal berbentuk `[topik, pertanyaan, [opsi A, opsi B, opsi C, opsi D], indeksJawaban, pembahasan]`. Indeks jawaban mulai dari 0. Jangan memasukkan HTML dalam bank soal. Untuk menambah atau mengubah TTS, sesuaikan `word`, `r`, `c`, dan `dir`; tes otomatis menolak persilangan yang tidak cocok dan kata tanpa petunjuk.

Konsep armada antariksa dan tarik tambang dikembangkan kembali sebagai permainan Bahasa Indonesia berdasarkan referensi folder pengguna. Tidak membutuhkan aset agribisnis atau isi soal Inggris dari referensi. Semua ilustrasi antarmuka game berbasis SVG/CSS lokal.

Jalankan `npm test` dari folder utama setelah mengubah aturan atau bank soal. Saat menerbitkan di GitHub Pages, ikutkan seluruh folder `modules/games/`.

## Ular tangga pengganti: Petualangan Kata

Kartu Ular Tangga kini membuka `#ular-tangga` dengan aplikasi dari `petualangan-kata/dist/index.html` yang diberikan guru. Salinan mandiri ada di `modules/games/petualangan-kata/index.html`: papan 100 petak, majas/peribahasa, solo lawan bot atau 2–6 pemain, serta pengelolaan soal lokal sesuai aplikasi asal. Iframe dipertahankan ketika berpindah menu. Integrasi menghentikan efek suara ketika game tersembunyi. Game tidak mengirim nilai ke Spreadsheet Huma. Font/icon/Tailwind mengikuti CDN aplikasi asal, sehingga perlu internet untuk tampilan lengkap. Rekor game Huma lama tidak dipindahkan ke game pengganti.
