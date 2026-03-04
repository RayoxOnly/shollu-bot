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

> ⚠️ **Akses via Reverse Proxy (nginx/VPS):** Jika Anda menjalankan `bun run dev` di VPS dan mengaksesnya melalui nginx, Anda harus mengatur `ALLOWED_DEV_ORIGINS` di `.env.local` agar browser dapat memuat resource `/_next/*`. Contoh:
> ```env
> ALLOWED_DEV_ORIGINS=http://203.0.113.10
> ```
> Untuk deployment permanen di VPS, lebih disarankan menggunakan `bun run build && bun run start` (mode production) yang tidak memiliki keterbatasan ini.

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
# Jika tidak diatur pada mode development, semua endpoint dapat diakses (cocok untuk penggunaan lokal).
# Jika tidak diatur pada mode production (NODE_ENV=production), semua endpoint DITOLAK.
# Jika diatur, sertakan header: Authorization: Bearer <token>
ADMIN_TOKEN=ganti_dengan_token_rahasia_anda

# Origins yang diizinkan mengakses resource /_next/* pada mode development.
# Diperlukan jika menjalankan "bun run dev" di belakang reverse proxy (mis. nginx di VPS)
# sehingga browser mengakses dari IP/domain berbeda dari localhost.
# Isi dengan daftar origin yang dipisah koma (format: protokol://host[:port]).
# Contoh: ALLOWED_DEV_ORIGINS=http://203.0.113.10,https://myapp.example.com
ALLOWED_DEV_ORIGINS=http://203.0.113.10
```

> ⚠️ **Catatan ADMIN_TOKEN:** Dashboard web bawaan **tidak** otomatis mengirim header
> `Authorization: Bearer <token>` pada permintaan fetch() ke API internal.
> Jika Anda mengatur `ADMIN_TOKEN`, fitur dashboard (pengaturan, QR code, log,
> ekspor/impor, dll) akan gagal kecuali ada mekanisme auth tambahan
> (mis. reverse proxy yang menyuntikkan header, atau cookie/session auth).
>
> **Catatan Production:** Pada `NODE_ENV=production`, jika `ADMIN_TOKEN` tidak diatur,
> semua endpoint API akan ditolak sebagai langkah pengamanan default.
> Pastikan `ADMIN_TOKEN` diatur saat deployment ke production.
>
> **Rekomendasi:** Biarkan kosong untuk penggunaan lokal dengan dashboard bawaan.
> Atur hanya jika klien eksternal (skrip, reverse proxy) yang akan menambahkan header.

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
