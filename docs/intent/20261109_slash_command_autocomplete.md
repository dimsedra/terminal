---
title: "Intent: Slash Command Auto-complete with Recommendations and Smart Shadow Prediction"
type: intent
last_updated: 2026-11-09
---

# Intent: Slash Command Auto-complete with Recommendations and Smart Shadow Prediction

## Goal

Menyediakan pengalaman pengetikan perintah garis miring (slash command) yang cepat, intuitif, dan responsif di seluruh ukuran layar (semua viewport, baik desktop maupun mobile).

Saat pengetik mulai mengetik garis miring (`/`), antarmuka secara seketika:
1. Memunculkan menu kartu rekomendasi perintah yang melayang (floating UI recommendation chips/popover) tepat di atas kolom input di semua viewport (desktop maupun mobile).
2. Menampilkan teks bayangan prediksi cerdas (shadow smart prediction / inline ghost text) di dalam kolom input.

Fitur rekomendasi dan penuntasan teks otomatis (auto-complete) ini bekerja bertingkat: tidak hanya berhenti di kata pertama perintah, melainkan berlanjut hingga ke argumen atau sub-perintah lanjutannya jika perintah tersebut memiliki opsi turunan (seperti pemilihan nama tema pada `/themes`, contohnya `/themes default`, `/themes neon`, dll).

Untuk interaksi:
- **Universal di Semua Viewport**: Kartu/chip rekomendasi yang melayang aktif di desktop dan mobile sebagai panduan visual (discovery tool) sekaligus target klik tetikus atau ketukan jari (tap) untuk menyelesaikan teks secara instan.
- **Power-user Shortcut (Desktop / Keyboard Fisik)**: Pengetik keyboard fisik dapat langsung menuntaskan prediksi teks bayangan tanpa mengangkat tangan dari keyboard menggunakan tombol `Shift`.
- **Fungsi Murni Tombol Spasi (`Space`)**: Tombol spasi tetap berfungsi sebagai pemisah spasi nyata, sehingga pengetik dapat memberi jeda alami antara nama perintah dan argumennya (seperti jeda antara `/themes` dan `neon`) tanpa bentrok dengan aksi auto-complete.

## Rationale

Saat ini pengguna harus mengingat nama perintah dan argumennya secara manual atau membuka menu bantuan `/help` dan `/themes`.

Keberadaan antarmuka melayang (floating UI recommendation popover) memiliki justifikasi peran yang kuat di semua perangkat:
1. **Di Desktop**: Berfungsi sebagai kanvas eksplorasi visual (discoverability). Pengguna desktop langsung melihat pilihan perintah dan tema beserta deskripsinya tanpa perlu menebak-nebak sintaks, dan dapat memilihnya dengan klik mouse atau menggunakan tombol `Shift` untuk pengetikan cepat.
2. **Di Mobile / Layar Sentuh**: Berfungsi ganda sebagai panduan visual sekaligus pemicu utama penuntasan teks (touch auto-complete trigger) yang ergonomis, mengingat keyboard virtual ponsel tidak memiliki tombol Shift fisik.
3. **Pemisahan dari Spasi**: Memisahkan aksi auto-complete dari tombol `Space` menjaga fungsi esensial spasi sebagai pemisah sintaks antar-argumen teks.

## Boundaries: What We Want vs What We Do NOT Want

### What We Want
- **Daftar Rekomendasi Bertingkat (Contextual Recommendations Popover / Floating UI di Semua Viewport)**:
  - Aktif dan terlihat di seluruh viewport (desktop, tablet, maupun ponsel).
  - **Tingkat 1 (Perintah Utama)**: Muncul tepat di atas kolom input segera setelah karakter pertama yang diketik adalah tanda garis miring (`/`), menyajikan seluruh perintah yang cocok (`/chat`, `/themes`, `/projects`, dll) beserta deskripsinya.
  - **Tingkat 2 (Argumen Perintah)**: Jika perintah memiliki argumen lanjutan (seperti `/themes`), begitu perintah utama terisi dan diberi spasi (`/themes `), popover rekomendasi otomatis beralih menyajikan daftar pilihan tema yang valid (`default`, `neon`, `autumn`, `karsts`, dll).
  - **Interaktivitas Klik & Sentuh**: Setiap kartu/chip rekomendasi dapat diklik (desktop) atau disentuh/tap (mobile) untuk langsung memasukkan perintah atau argumen terpilih ke dalam kolom input.
- **Teks Bayangan Prediksi Cerdas (Inline Ghost Text / Shadow Prediction)**:
  - Teks bayangan dengan warna abu-abu redup (`#71717A` / zinc-500) muncul persis menyambung huruf yang sedang diketik pengetik di dalam kolom input.
  - Memanfaatkan tipografi Ioskeley Mono yang memiliki lebar karakter seragam (monospace font), sehingga posisi horizontal karakter bayangan selalu presisi dan selaras dengan teks masukan di semua resolusi layar.
  - Prediksi teks bayangan mendukung kelanjutan argumen: misalnya saat mengetik `/themes d`, muncul bayangan `efault` sehingga terbaca utuh `/themes default`. Begitu pula `/themes n` membayangi menjadi `/themes neon`.
- **Dua Cara Melengkapi Perintah (Flexible Completion Triggers)**:
  - **Tombol `Shift`**: Pada keyboard fisik desktop, menekan tombol `Shift` langsung melengkapi teks input sesuai prediksi teks bayangan yang sedang aktif.
  - **Klik / Tap Kartu Melayang**: Berlaku di desktop maupun mobile, pengguna bisa mengklik atau mengetuk kartu rekomendasi untuk melengkapi teks.
  - **Spasi Murni**: Tombol `Space` tidak pernah membajak (override) teks menjadi auto-complete, melainkan tetap menjadi karakter spasi biasa untuk memisahkan perintah dan parameter.
- **Cakupan Universal & Bertahap**:
  - Bekerja untuk seluruh perintah yang terdaftar di antarmuka (`/chat`, `/projects`, `/skills`, `/about`, `/contact`, `/themes`, `/help`, `/exit`, dan perintah masa depan).
  - Bekerja konsisten di semua fase antarmuka: tampilan beranda awal (Fase 1) dan saat sesi percakapan AI sedang berlangsung (Fase 2).

### What We Do NOT Want
- **Bukan Hanya untuk Mobile**: Antarmuka kartu melayang tidak boleh disembunyikan di desktop; ia harus hadir di semua viewport sebagai pemandu visual dan opsi interaksi klik.
- **Tanpa Pembajakan Tombol Spasi**: Tombol `Space` dilarang digunakan untuk menuntaskan auto-complete, demi menjaga fungsi spasi sebagai pemisah argumen teks yang sah.
- **Tanpa Mengubah Logika Eksekusi Terminal**: Fitur ini murni memperkaya interaksi pengetikan (input experience); alur eksekusi perintah terminal, parsing tema di balik layar, pemrosesan API, dan streaming jawaban AI tidak diubah.
- **Tanpa Hardcode Kaku**: Struktur pencocokan argumen harus dirancang modular agar perintah masa depan yang memiliki argumen dapat mengadopsi pola bertingkat ini dengan mudah.
- **Tanpa Pergeseran Visual (No Misalignment)**: Teks bayangan tidak boleh meleset posisi horizontalnya atau bertumpuk canggung dengan huruf asli yang sedang diketik.
- **Tanpa Jeda Waktu (Zero Latency Matching)**: Pencocokan perintah dan pemunculan ghost text dilakukan seketika di tingkat lokal (client-side) tanpa debounce berlebih atau latensi jaringan.
- **Tanpa Melanggar Palet Monokrom**: Elemen visual rekomendasi dan bayangan tetap patuh pada identitas desain Carbon Black (`#161616`, `#1C1C1C`, `#27272A`, dan aksen abu-abu netral).
