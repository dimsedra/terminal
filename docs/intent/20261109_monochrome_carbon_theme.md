---
title: "Intent: Carbon Black & Monochrome Theme with Ioskeley Mono & 2D Living ASCII"
type: intent
last_updated: 2026-11-09
---

# Intent: Carbon Black & Monochrome Theme with Ioskeley Mono & 2D Living ASCII

## Goal

Memperbarui tema visual antarmuka terminal portfolio menjadi lebih tenang, disiplin, dan monokromatik. Menjadikan Carbon Black sebagai warna dasar antarmuka, mengadopsi font Ioskeley Mono untuk estetika tipografi monospace yang kompak, menggantikan seluruh aksen hijau dengan palet abu-abu netral, menyajikan grid kontribusi GitHub dalam gradasi monokrom bertingkat dari gelap ke putih, dan mengganti animasi 3D ASCII voxel menjadi 2D Typographical ASCII Character "EDS" yang hidup (*live shimmering glyphs*) dengan efek *smooth orange trail* interaktif di hero homepage dan varian ringkas non-hover di sidebar.

## Rationale

Warna pitch dark lama (`#050505` / `#0A0A0A`) dan aksen hijau (`#9AE6B4` serta palet hijau GitHub) terasa kurang cocok dengan preferensi Eds yang lebih menyukai tampilan netral, minimalis, dan tenang. Animasi 3D voxel yang berputar juga diganti dengan tipografi 2D ASCII berdensitas tinggi yang lebih autentik ala terminal retro/workstation. Dengan transisi ke Carbon Black (`#161616`), teks putih, dan aksen abu-abu, hierarki informasi menjadi lebih menyatu. Efek *smooth orange trail* pada 2D ASCII memberikan sentuhan taktil interaktif yang organik tanpa mengorbankan estetika monokrom secara keseluruhan.

## Boundaries: What We Want vs What We Do NOT Want

### What We Want
- **Background Carbon Black**: Background terminal dan root viewport beralih ke shade Carbon Black (`#161616`) dengan surface panel selaras (`#1C1C1C`).
- **Ioskeley Mono Typography**: Font terminal beralih ke Ioskeley Mono (web font woff2) sebagai font monospace utama pada seluruh elemen CLI.
- **Aksen Netral (Abu-Abu)**: Seluruh elemen interaktif yang sebelumnya hijau (prompt symbol `❯`, kursor kedip, hover/active chip perintah, link kontak) beralih ke spektrum abu-abu netral (`#A1A1AA` hingga `#E4E4E7`).
- **Teks Utama Tetap Putih**: Judul, nama, dan teks output primer tetap putih (`#FFFFFF`) untuk menjaga ketajaman dan kenyamanan membaca.
- **Grid Kontribusi GitHub Monokrom**: Level kontribusi kalender GitHub beralih dari hijau ke gradasi bertingkat dari gelap ke putih:
  - `NONE`: `·` abu-abu zinc (`#52525B`)
  - `FIRST_QUARTILE`: `░` abu-abu terang (`#71717A`)
  - `SECOND_QUARTILE`: `▒` abu-abu medium (`#A1A1AA`)
  - `THIRD_QUARTILE`: `▓` abu-abu cerah (`#D4D4D8`)
  - `FOURTH_QUARTILE`: `█` putih penuh (`#FFFFFF`)
- **2D Living Typographical ASCII Emblem (`EDS`)**:
  - Menggantikan animasi 3D voxel dengan karakter tipografi 2D ASCII padat bertuliskan "EDS" berbasis kombinasi glif arsir (`%`, `@`, `#`, `|`, `/`, `\`, `+`, `*`, dll.).
  - **Living Matrix Shimmer**: Karakter memiliki kedip/mutasi mikro halus saat idle sehingga tidak pernah terlihat sebagai gambar mati.
  - **Homepage Hero (Full Interactive)**:
    - Kursor mouse yang melintas di atas ASCII memicu *smooth orange trail* (`#FF6B00` / `#F97316`) langsung pada kisi karakter yang dilalui, memicu mutasi karakter seketika, dan memudar halus kembali ke palet dasar.
    - Saat idle tanpa gerakan mouse, sapuan trail oranye otomatis melintas sesekali.
  - **Sidebar (Compact & Live Non-Hover)**:
    - Ukuran disesuaikan secara proporsional dan lebih ringkas agar rapi di dalam panel sidebar.
    - Tetap mempertahankan efek *live shimmering glyphs*, namun tanpa interaktivitas kursor hover trail.

### What We Do NOT Want
- **Tanpa Warna Hijau**: Tidak boleh ada sisa warna hijau sama sekali di antarmuka terminal, baik pada prompt, chips, status, maupun grid kontribusi.
- **Tanpa Penurunan Keterbacaan**: Kontras antara teks putih/abu-abu dengan background Carbon Black harus tetap tajam dan nyaman di mata (memenuhi standar kontras baca).
- **Tanpa Canvas Grafis Biasa untuk Trail**: Efek trail oranye bukan garis brush gambar bitmap yang menutupi teks, melainkan iluminasi dan mutasi langsung pada glif kisi ASCII itu sendiri.
- **Tanpa Perubahan Logic / Breaking Changes**: Perubahan dibatasi pada visual, styling, aset font, dan komponen tampilan tanpa mengubah alur eksekusi perintah terminal maupun integrasi AI.
