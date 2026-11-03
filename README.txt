SIAGA COMMAND CENTER
Tugas Minggu 9 — Sistem Informasi
Farrel Faiziaulhaq Azmi · 240605110176 · Kelas G
Program Studi Teknik Informatika, UIN Maulana Malik Ibrahim Malang

Repositori : https://github.com/farrelfaiziaulhaq/siaga-command-center
Demo       : https://farrelfaiziaulhaq.github.io/siaga-command-center/mockup/

============================================================
ISI FOLDER
============================================================
mockup/               Purwarupa high-fidelity (HTML, CSS, JavaScript)
  index.html          Layar utama dashboard
  assets/css/         Design system & layout
  assets/js/          Data simulasi + interaksi
  assets/img/         Basemap Kota Malang
  assets/fonts/       Manrope (lokal, offline)

screenshots/          Tangkapan layar 2x untuk laporan
  01-dashboard-utama.png
  02-detail-bangunan.png
  03-data-masuk.png
  04-laptop-1366.png
  05-user-flow.png
  06-anatomi.png

laporan/
  240605110176_Farrel Faiziaulhaq Azmi_Tugas Minggu 9 SI.pdf
                    Laporan perancangan 15 halaman
  Laporan Minggu 9.html     Sumber laporan (dapat diedit)
  diagrams/                 Sumber diagram alur & anatomi

README.md             Petunjuk repositori (GitHub)
README.txt            Berkas ini

============================================================
CARA MEMBUKA
============================================================
1. Buka folder mockup.
2. Klik dua kali index.html (Chrome atau Edge).
3. Tidak perlu instalasi, server, atau koneksi internet.
   Semua aset, termasuk font dan peta, tersimpan lokal.

Parameter URL yang berguna saat presentasi:
  ?static=1              Membekukan simulasi data langsung
  ?detail=B-182          Langsung membuka panel detail contoh
  ?static=1&detail=B-182 Kombinasi keduanya

Kontrol:
  Ctrl + K               Fokus ke kolom pencarian
  Esc                    Menutup panel detail
  Tombol "Langsung"      Menjeda / melanjutkan umpan data
  Chip Ringan/Sedang/Berat  Menyaring pin peta dan baris prioritas

============================================================
CATATAN DATA
============================================================
Seluruh angka, nama kelurahan, skor DSS, dan kejadian pada
purwarupa adalah simulasi untuk menguji perilaku antarmuka.
Tidak ada data pribadi atau dokumen BPBD yang digunakan.
Model GLCM-PCA, NNBP, dan WP/TOPSIS tidak dilatih ulang;
keluarannya direpresentasikan sesuai materi Minggu 9.

Basemap: Esri Dark Gray Canvas / OpenStreetMap
Atribusi tercantum di sudut peta.

Laporan disusun sebagai PDF A4, 14 halaman, dengan gambar
2x resolution. Sumber HTML disertakan agar teks dan tata
letak mudah diperbarui.
