# Shollu Bot

Otomatisasi absensi sholat wajib via dashboard Next.js, menggunakan API [Shollu](https://shollu.com).

## Fitur

- Dashboard monitoring jadwal sholat & status absensi hari ini
- Penjadwalan absen otomatis (node-cron) untuk 5 waktu sholat
- Manajemen QR code karyawan
- Riwayat log absensi & analitik streak
- Ekspor / impor data backup
- Dukungan dark mode (Material UI v7)

---

## Cara Menjalankan di Lokal (Komputer Pribadi)

Cocok untuk mencoba / pengembangan. Tidak perlu nginx atau PM2.

**Persyaratan:**
- [Bun](https://bun.sh) versi 1.x ke atas
- Akun Shollu (username & password)

```bash
# 1. Clone repo
git clone https://github.com/RayoxOnly/shollu-bot.git
cd shollu-bot

# 2. Install dependensi
bun install

# 3. Jalankan server development
bun run dev
```

Buka <http://localhost:3000> di browser, lalu selesaikan pengaturan awal (username, password, QR code karyawan).

---

## Deployment di VPS (Ubuntu/Debian) — Panduan Lengkap

Panduan ini menggunakan **PM2** (process manager) agar aplikasi tetap berjalan setelah VPS di-reboot, dan **nginx** sebagai reverse proxy agar bisa diakses lewat port 80 (HTTP).

### Langkah 1 — Masuk ke VPS

```bash
ssh root@IP_VPS_ANDA
# Contoh: ssh root@172.31.17.131
```

> **Keamanan:** Disarankan untuk tidak menggunakan user `root` secara langsung. Buat user biasa dengan hak sudo:
> ```bash
> adduser admin
> usermod -aG sudo admin
> # Lanjutkan sesi dengan: ssh admin@IP_VPS_ANDA
> ```

### Langkah 2 — Install Bun

```bash
curl -fsSL https://bun.sh/install | bash

# Muat ulang PATH agar perintah "bun" langsung tersedia
source ~/.bashrc
# atau jika menggunakan zsh:
# source ~/.zshrc

# Verifikasi instalasi
bun --version
```

### Langkah 3 — Install PM2 (process manager)

PM2 menjalankan aplikasi sebagai background service dan otomatis merestart jika crash atau VPS reboot.

```bash
# Install PM2 secara global menggunakan bun
bun install -g pm2

# Verifikasi instalasi
pm2 --version
```

> Jika perintah `pm2` tidak ditemukan setelah instalasi, coba tutup dan buka kembali sesi SSH, atau jalankan `source ~/.bashrc`.

### Langkah 4 — Install nginx

```bash
apt update
apt install -y nginx

# Pastikan nginx berjalan
systemctl status nginx
```

### Langkah 5 — Clone dan Siapkan Repo

```bash
# Clone ke direktori pilihan Anda, misal /home/admin
cd /home/admin
git clone https://github.com/RayoxOnly/shollu-bot.git
cd shollu-bot

# Install dependensi project
bun install
```

### Langkah 6 — Buat File Konfigurasi `.env.local`

File ini **opsional**. Buat jika Anda ingin mengubah konfigurasi default.

```bash
nano .env.local
```

Untuk penggunaan pribadi di VPS, file ini bisa **dikosongkan** atau tidak dibuat sama sekali — tidak ada yang wajib diisi. Namun jika Anda ingin mengamankan API dari akses luar, Anda bisa mengisi `ADMIN_TOKEN` (lihat tabel variabel lingkungan di bawah).

### ⚠️ VPS RAM Rendah (1 CPU / 1 GB) — Baca Ini Sebelum Build!

`next build` membutuhkan **≥ 1 GB RAM bebas**. Pada VPS gratis AWS (t2.micro / t3.micro) dengan 1 GB RAM, build sering membuat VPS hang atau tidak responsif karena kehabisan memori.

Ada **tiga cara** untuk mengatasinya — pilih salah satu:

---

#### Cara A (Disarankan) — Tambahkan Swap Space di VPS

Swap adalah memori virtual di disk. Dengan 1 GB swap, VPS Anda punya total ~2 GB memori virtual sehingga build bisa selesai meski lebih lambat. Lakukan ini **sekali** sebelum pertama kali build:

```bash
# Buat file swap 1 GB
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Aktifkan otomatis saat reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verifikasi
free -h
```

Setelah swap aktif, jalankan:

```bash
bun run build:vps
```

> `build:vps` membatasi heap Node.js ke 700 MB melalui `NODE_OPTIONS`, sehingga setiap worker hanya memakai sebagian dari RAM yang tersedia — lebih aman daripada `bun run build` biasa yang tidak ada batas heap-nya.

---

#### Cara B — Build di Komputer Lokal, Upload ke VPS

Jika swap tidak membantu atau VPS masih hang, lakukan build di komputer/laptop Anda sendiri (yang punya RAM lebih besar), lalu kirim hasilnya ke VPS.

**Di komputer lokal:**

```bash
# Masuk ke folder project
cd shollu-bot

# Build (di komputer lokal, bukan VPS)
bun run build

# Kirim folder hasil build ke VPS (ganti IP_VPS dan PATH_DI_VPS)
scp -r .next admin@IP_VPS_ANDA:/home/admin/shollu-bot/.next
```

**Di VPS** (setelah upload selesai):

```bash
# Tidak perlu build di VPS — langsung jalankan
pm2 start "bun run start" --name shollu-bot
```

---

#### Cara C — Gunakan `bun run build:vps` Tanpa Swap (Terakhir Dicoba)

Jika tidak bisa menambah swap dan tidak ada komputer lokal, coba jalankan:

```bash
# Hentikan semua proses berat terlebih dahulu
pm2 stop all 2>/dev/null; sudo systemctl stop nginx

# Jalankan build dengan RAM terbatas
bun run build:vps

# Setelah build selesai, hidupkan kembali
sudo systemctl start nginx
```

> Ini membebaskan ~100–200 MB RAM dengan menghentikan nginx dan PM2 sementara, lalu build berjalan dengan heap yang dibatasi. Build tetap akan berjalan lambat (15–30 menit) tapi tidak hang.

---

### Langkah 7 — Build Aplikasi untuk Production

```bash
bun run build:vps
```

Gunakan `build:vps` (bukan `bun run build`) agar build tidak kehabisan RAM. Proses ini akan berjalan lebih lambat dari biasanya di VPS dengan 1 CPU — ini normal. Tunggu hingga muncul pesan sukses.

### Langkah 8 — Jalankan dengan PM2

```bash
# Jalankan aplikasi dan beri nama "shollu-bot"
pm2 start "bun run start" --name shollu-bot

# Cek status apakah aplikasi berjalan
pm2 status

# Lihat log real-time
pm2 logs shollu-bot
```

Jika status menunjukkan `online` dan tidak ada error di log, aplikasi sudah berjalan di port 3000.

```bash
# Daftarkan PM2 agar otomatis start saat VPS reboot
pm2 startup
# Jalankan perintah yang ditampilkan oleh PM2 (biasanya: sudo env PATH=... pm2 startup ...)
pm2 save
```

### Langkah 9 — Konfigurasi nginx sebagai Reverse Proxy

Buat file konfigurasi nginx untuk shollu-bot:

```bash
nano /etc/nginx/sites-available/shollu-bot
```

Isi dengan konfigurasi berikut. **Ganti `IP_ATAU_DOMAIN_ANDA`** dengan IP publik VPS atau nama domain Anda:

```nginx
server {
    listen 80;
    server_name IP_ATAU_DOMAIN_ANDA;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Simpan file (`Ctrl+X`, `Y`, `Enter`), lalu aktifkan konfigurasi:

> ⚠️ **Jangan lupa ganti `IP_ATAU_DOMAIN_ANDA`** di baris `server_name` dengan IP publik atau domain Anda yang sesungguhnya, sebelum menyimpan file.

```bash
# Aktifkan konfigurasi
ln -s /etc/nginx/sites-available/shollu-bot /etc/nginx/sites-enabled/

# Hapus konfigurasi default nginx (opsional, untuk menghindari konflik)
rm -f /etc/nginx/sites-enabled/default

# Test konfigurasi nginx — pastikan tidak ada error
nginx -t

# Reload nginx
systemctl reload nginx
```

### Langkah 10 — Buka Firewall (jika menggunakan UFW)

```bash
# Izinkan port HTTP (80)
ufw allow 80/tcp

# Izinkan port SSH agar tidak terkunci (jika belum)
ufw allow 22/tcp

# Aktifkan firewall
ufw enable

# Cek status
ufw status
```

### Langkah 11 — Akses Dashboard

Buka browser dan akses:

```
http://IP_VPS_ANDA
```

Anda akan diarahkan ke halaman pengaturan awal. Masukkan username, password Shollu, dan QR code karyawan.

---

## Perintah PM2 yang Sering Digunakan

```bash
pm2 status               # Lihat status semua aplikasi
pm2 logs shollu-bot      # Lihat log real-time
pm2 restart shollu-bot   # Restart aplikasi (misal setelah update)
pm2 stop shollu-bot      # Hentikan aplikasi
pm2 delete shollu-bot    # Hapus dari PM2
```

## Update Aplikasi ke Versi Terbaru

```bash
cd /home/admin/shollu-bot   # Sesuaikan dengan direktori Anda

git pull                     # Ambil perubahan terbaru
bun install                  # Update dependensi jika ada yang baru
bun run build:vps            # Build ulang (hemat RAM)
pm2 restart shollu-bot       # Restart aplikasi
```

---

## Troubleshooting

**Aplikasi tidak bisa diakses (504 Gateway Timeout atau loading terus):**
- Pastikan aplikasi PM2 berstatus `online`: `pm2 status`
- Pastikan aplikasi berjalan di port 3000: `ss -tlnp | grep 3000`
- Periksa log aplikasi: `pm2 logs shollu-bot`
- Periksa log nginx: `tail -n 50 /var/log/nginx/error.log`

**Dashboard tidak bisa memuat data (semua API error):**
- Jika `ADMIN_TOKEN` diisi di `.env.local`, dashboard bawaan tidak bisa mengaksesnya secara otomatis. Kosongkan `ADMIN_TOKEN` lalu restart: `pm2 restart shollu-bot`

**PM2 tidak bisa ditemukan setelah `bun install -g pm2`:**
- Jalankan `source ~/.bashrc` atau buka sesi SSH baru.
- Atau gunakan path lengkap: `~/.bun/bin/pm2`

**Build hang / VPS tidak responsif saat `bun run build:vps`:**
- Tambahkan swap space (lihat bagian "⚠️ VPS RAM Rendah" di atas) — ini solusi paling andal.
- Atau lakukan build di komputer lokal dan upload folder `.next` ke VPS dengan `scp` (lihat Cara B).

**Error saat `bun run build` atau `bun run build:vps` (modul native):**
- Pastikan `build-essential` sudah terinstall: `apt install -y build-essential python3`

---

## Variabel Lingkungan (`.env.local`)

| Variabel | Wajib di Production | Keterangan |
|---|---|---|
| `ADMIN_TOKEN` | ❌ Opsional | Jika diisi, setiap request ke API harus menyertakan header `Authorization: Bearer <token>`. Kosongkan untuk penggunaan dashboard bawaan. ⚠️ Tanpa token, API dapat diakses oleh siapa saja yang bisa menjangkau server — pastikan akses dibatasi via firewall atau VPN. |
| `SHOLLU_API_KEY` | ❌ | Kunci API Shollu. Default `shollusemakindidepan` sudah tersedia. |
| `ALLOWED_DEV_ORIGINS` | ❌ | Hanya untuk mode `dev`. Tidak diperlukan di production. |

> ⚠️ **Penting:** Scheduler absensi otomatis hanya berjalan pada proses yang hidup terus-menerus (PM2, systemd, dll). Jangan deploy ke platform _serverless_ (Vercel, Netlify Functions, dll).

---

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
- [Bun](https://bun.sh) + `better-sqlite3`
- [node-cron](https://github.com/node-cron/node-cron)
- [PM2](https://pm2.keymetrics.io) (process manager)
- [nginx](https://nginx.org) (reverse proxy)
