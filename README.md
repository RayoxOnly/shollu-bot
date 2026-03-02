# Shollu Bot

Otomatisasi absensi sholat wajib via dashboard Next.js, menggunakan API [Shollu](https://shollu.com).

## Fitur

- Dashboard monitoring jadwal sholat & status absensi hari ini
- Penjadwalan absen otomatis (node-cron) untuk 5 waktu sholat
- Manajemen QR code karyawan
- Riwayat log absensi & analitik streak
- Ekspor / impor data backup
- Dukungan dark mode (Material UI v7)

## Persyaratan

- **[Bun](https://bun.sh) ≥ 1.x** – runtime JavaScript yang digunakan (database menggunakan `bun:sqlite`).
- Akun Shollu (username & password untuk login ke portal Shollu).

## Cara Menjalankan

```bash
# Install dependensi
bun install

# Jalankan server development
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser, lalu selesaikan pengaturan awal (username, password, QR code karyawan).

### Production (contoh dengan PM2)

```bash
bun run build
pm2 start "bun run start" --name shollu-bot
```

> ⚠️ **Penting:** Scheduler node-cron hanya berjalan pada proses Node.js/Bun yang hidup terus-menerus. Jangan deploy ke platform _serverless_ (Vercel, Netlify Functions, dll) karena scheduler tidak akan berjalan dengan andal.

## Variabel Lingkungan (Opsional)

Buat file `.env.local` di direktori root:

```env
# Kunci API Shollu (default sudah tersedia, ganti hanya jika diperlukan)
SHOLLU_API_KEY=shollusemakindidepan

# Token admin untuk melindungi endpoint API sensitif dari akses publik.
# Jika tidak diatur, semua endpoint dapat diakses (cocok untuk penggunaan lokal).
# Jika diatur, sertakan header: Authorization: Bearer <token>
ADMIN_TOKEN=ganti_dengan_token_rahasia_anda
```

## Struktur Direktori

```
app/          – Halaman & API routes Next.js (App Router)
components/   – Komponen UI React
lib/          – Logika inti (db, scheduler, auth, dll.)
data/         – Database SQLite (dibuat otomatis)
_legacy_app/  – Aplikasi bot Node/Express lama (arsip)
```

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Material UI v7](https://mui.com)
- [Bun](https://bun.sh) + `bun:sqlite`
- [node-cron](https://github.com/node-cron/node-cron)
