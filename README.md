# Bot Absen Shollu

Bot otomatis absen sholat untuk Shollu Partner Center dengan web dashboard.

## Fitur

- Auto absen pada waktu Subuh (terjadwal)
- Multi QR code — absen untuk kamu dan teman-teman
- Web dashboard — pengaturan lewat browser
- Activity log — pantau keberhasilan absen
- Manual trigger — test absen langsung dari dashboard
- Delay otomatis antar QR code

## Deploy ke VPS (Debian/Ubuntu)

### 1. Upload project ke VPS

Dari PC kamu, upload folder ini ke VPS:

```bash
scp -r . user@ip-vps:/home/user/bot-absen-shollu
```

Atau clone dari git.

### 2. Jalankan setup otomatis

```bash
cd /home/user/bot-absen-shollu
chmod +x setup.sh
./setup.sh
```

Script ini otomatis menginstall:

- Node.js 20 LTS
- Build tools (untuk SQLite)
- PM2 (process manager)
- npm packages
- Konfigurasi Nginx reverse proxy

### 3. Jalankan bot

```bash
pm2 start ecosystem.config.js
pm2 save
```

### 4. Buka dashboard

Buka `http://ip-vps-kamu` di browser, lalu:

1. **Isi pengaturan** — username, password Shollu, waktu Subuh
2. **Tambahkan QR codes** — QR code kamu dan teman-teman
3. **Aktifkan bot** — toggle ON
4. Bot akan otomatis absen setiap hari pada waktu yang ditentukan!

## Perintah Berguna

```bash
pm2 logs bot-absen       # Lihat log realtime
pm2 restart bot-absen    # Restart bot
pm2 stop bot-absen       # Stop bot
pm2 status               # Cek status
```

### 5. Flow Kerja bot

sequenceDiagram
participant S as Scheduler
participant A as Auth
participant API as Shollu API
participant DB as Database

    S->>A: Login (jika token expired)
    A->>API: POST /auth/partners-login
    API-->>A: JWT Token

    loop Setiap QR Code yang aktif
        S->>API: POST /api/v1/absent-qr
        API-->>S: Response (success/error)
        S->>DB: Log hasil
        Note over S: Delay 3 detik
    end

## Catatan

- Portal Shollu dibuka **30 menit sebelum** s/d **1 jam setelah** waktu sholat
- Bot mengirim absen **5 menit setelah** waktu yang diatur (safety margin)
- Jika waktu Subuh bergeser signifikan, update di dashboard
