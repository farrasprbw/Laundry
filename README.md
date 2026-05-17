# 🧺 Laundry — Laundry Management System

Aplikasi manajemen laundry berbasis web dengan **dashboard admin** dan **REST API**, dibangun menggunakan arsitektur monorepo.

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Menjalankan Database](#-menjalankan-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Registrasi Admin Pertama](#-registrasi-admin-pertama)
- [Deploy ke Production](#-deploy-ke-production)
- [Struktur Proyek](#-struktur-proyek)
- [Script yang Tersedia](#-script-yang-tersedia)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Fitur

- 📊 **Dashboard** — Ringkasan statistik pendapatan, pesanan, dan pelanggan
- 📦 **Manajemen Pesanan** — CRUD pesanan dengan status tracking (PROCESS → FINISHED → TAKEN)
- 👥 **Manajemen Pelanggan** — Data pelanggan dengan integrasi WhatsApp
- 🏷️ **Kategori Layanan** — Kelola kategori laundry beserta harga dan estimasi waktu
- 💰 **Metode Pembayaran** — Kelola metode pembayaran (tunai, transfer, dll)
- 💸 **Pencatatan Pengeluaran** — Tracking pengeluaran operasional
- 📈 **Laporan** — Laporan pendapatan dengan export Excel
- 🧾 **Invoice Publik** — Halaman invoice yang bisa diakses pelanggan via link
- ⭐ **Rating** — Pelanggan bisa memberi rating melalui halaman invoice
- 🖨️ **Thermal Printing** — Cetak struk via printer Bluetooth (ESC/POS)
- 📱 **Notifikasi WhatsApp** — Kirim notifikasi status pesanan ke pelanggan
- ⏱️ **Auto-Finish** — Pesanan otomatis selesai berdasarkan estimasi waktu kategori
- 👤 **Manajemen User** — Kelola akun staff dengan role-based access
- 📱 **Responsive** — Tampilan optimal di desktop dan mobile

---

## 🛠 Tech Stack

| Layer        | Teknologi                                                        |
| ------------ | ---------------------------------------------------------------- |
| **Frontend** | React 19, Vite, TailwindCSS, React Router, TanStack React Query |
| **Backend**  | Express 5, TypeScript, Drizzle ORM, Better Auth, Zod             |
| **Database** | PostgreSQL 16 (via Docker)                                       |
| **Tooling**  | npm Workspaces, Concurrently, tsx                                |

---

## ✅ Prasyarat

Pastikan perangkat kamu sudah terinstall:

| Software       | Versi Minimum | Cek Versi              |
| -------------- | ------------- | ---------------------- |
| **Node.js**    | v20+          | `node -v`              |
| **npm**        | v9+           | `npm -v`               |
| **Docker**     | v20+          | `docker -v`            |
| **Git**        | v2+           | `git -v`               |

> 💡 **Tips:** Disarankan menggunakan [Node.js LTS](https://nodejs.org/) dan [Docker Desktop](https://www.docker.com/products/docker-desktop/) agar kompatibilitas terjamin.

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd laundry
```

### 2. Install Dependencies

Cukup jalankan satu kali di root project — npm workspaces akan otomatis menginstall dependensi semua `apps/`:

```bash
npm install
```

---

## ⚙ Konfigurasi Environment

### Backend (API)

Salin file `.env.example` ke `.env` di folder `apps/api`:

```bash
# Windows (CMD)
copy apps\api\.env.example apps\api\.env

# Windows (PowerShell)
Copy-Item apps/api/.env.example apps/api/.env

# Linux / macOS
cp apps/api/.env.example apps/api/.env
```

Kemudian buka `apps/api/.env` dan sesuaikan nilainya:

```env
# ── Database (harus sama dengan docker-compose.yml) ────────────
DB_USER=<db_user>
DB_PASSWORD=<db_password>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=<db_name>
DATABASE_URL=postgresql://<db_user>:<db_password>@localhost:5432/<db_name>

# ── Auth ───────────────────────────────────────────────────────
BETTER_AUTH_SECRET=<generate-random-secret>
BETTER_AUTH_URL=http://localhost:3001

# ── Server ─────────────────────────────────────────────────────
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

> 💡 **Generate secret key:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> ⚠️ **Penting:** Jangan commit file `.env` ke repository. File ini sudah termasuk di `.gitignore`.

---

## 🐳 Menjalankan Database

Aplikasi menggunakan **PostgreSQL** yang dijalankan via Docker.

### Start Database

```bash
npm run db:up
```

Perintah di atas akan menjalankan `docker compose up -d`, yang akan:
- Mengunduh image `postgres:16-alpine` (pertama kali saja)
- Membuat container `laundry-postgres` di port `5432`
- Data tersimpan di Docker volume `pgdata` (persisten)

### Verifikasi Database Berjalan

```bash
docker ps
```

Pastikan container `laundry-postgres` berstatus `Up` dan `healthy`.

### Push Schema ke Database

Setelah database berjalan, sinkronkan schema Drizzle:

```bash
npm run db:push
```

### Melihat Data di Database (Opsional)

Gunakan Drizzle Studio untuk melihat dan mengelola data:

```bash
npm run db:studio
```

Akses di browser: `https://local.drizzle.studio`

### Stop Database

```bash
npm run db:down
```

---

## 🚀 Menjalankan Aplikasi

### Development Mode (API + Dashboard bersamaan)

```bash
npm run dev
```

Ini akan menjalankan:
- 🔵 **API** di `http://localhost:3001`
- 🟣 **Dashboard** di `http://localhost:5173`

### Menjalankan Terpisah

```bash
# Jalankan API saja
npm run dev:api

# Jalankan Dashboard saja
npm run dev:dashboard
```

---

## 👤 Registrasi Admin Pertama

Saat pertama kali menggunakan aplikasi, kamu perlu membuat akun admin melalui API:

```bash
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<nama>",
    "username": "<username>",
    "email": "<email>",
    "password": "<password>",
    "role": "admin"
  }'
```

Atau menggunakan **PowerShell**:

```powershell
$body = '{"name":"<nama>","username":"<username>","email":"<email>","password":"<password>","role":"admin"}'
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/sign-up/email" -Method POST -ContentType "application/json" -Body $body
```

Setelah berhasil, buka `http://localhost:5173` dan login dengan username dan password yang sudah didaftarkan.

---

## 🌐 Deploy ke Production

Aplikasi ini bisa dideploy **gratis tanpa kartu kredit** menggunakan:

| Komponen | Platform | Biaya |
|----------|----------|-------|
| 🗄️ Database | [Neon](https://neon.tech) (PostgreSQL Serverless) | Gratis (0.5 GB) |
| 🖥️ API Backend | [Vercel](https://vercel.com) (Serverless Functions) | Gratis |
| 🌐 Dashboard Frontend | [Vercel](https://vercel.com) (Static Hosting) | Gratis |

### Arsitektur Production

```
Browser → Vercel Dashboard → (rewrite /api/*) → Vercel API (Serverless) → Neon PostgreSQL
```

> Dashboard memproxy semua request `/api/*` ke API melalui Vercel Rewrites, sehingga cookie session berfungsi tanpa masalah cross-site.

---

### Step 1: Setup Database — Neon

1. Buka [neon.tech](https://neon.tech) → **Sign Up** pakai GitHub/Google
2. Klik **"Create Project"**
   - **Project Name:** `laundry`
   - **Region:** `Asia Pacific (Singapore)`
3. Copy **Connection String** (pooled), formatnya:
   ```
   postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```

### Step 2: Push Schema ke Neon

Dari terminal lokal di folder `apps/api`:

```powershell
# Windows PowerShell
$env:DATABASE_URL = "<connection-string-dari-neon>"
npx drizzle-kit push
```

```bash
# Linux / macOS
DATABASE_URL="<connection-string-dari-neon>" npx drizzle-kit push
```

---

### Step 3: Deploy API — Vercel

1. Buka [vercel.com](https://vercel.com) → **Sign Up** pakai GitHub
2. **Add New Project** → Import repo dari GitHub
3. Konfigurasi:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | `Express` |
   | **Root Directory** | `apps/api` |
   | **Build Command** | `npm run build` |

4. Tambahkan **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Connection string dari Neon |
   | `BETTER_AUTH_SECRET` | Random secret (lihat cara generate di atas) |
   | `BETTER_AUTH_URL` | URL API setelah deploy |
   | `CORS_ORIGIN` | URL Dashboard setelah deploy |
   | `NODE_ENV` | `production` |

5. Klik **Deploy**
6. Verifikasi: buka `https://<url-api>/api/health` → harus muncul `{"status":"ok"}`

---

### Step 4: Deploy Dashboard — Vercel

1. **Add New Project** → Import repo yang sama
2. Konfigurasi:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `apps/dashboard` |

3. Tambahkan **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `/api` |
   | `VITE_AUTH_URL` | URL Dashboard itu sendiri |

4. Klik **Deploy**

> **Catatan:** File `apps/dashboard/vercel.json` sudah mengatur rewrite `/api/*` ke API dan SPA fallback untuk client-side routing.

---

### Step 5: Update Environment Variables

Setelah kedua project live, update env vars yang memerlukan URL final:

1. **Project API** → Settings → Environment Variables:
   - `BETTER_AUTH_URL` = URL API yang sebenarnya
   - `CORS_ORIGIN` = URL Dashboard yang sebenarnya

2. **Redeploy** kedua project agar perubahan berlaku

---

### Step 6: Buat User Admin

```bash
curl -X POST https://<url-api>/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<nama>",
    "username": "<username>",
    "email": "<email>",
    "password": "<password>",
    "role": "admin"
  }'
```

Atau **PowerShell**:

```powershell
$body = '{"name":"<nama>","username":"<username>","email":"<email>","password":"<password>","role":"admin"}'
Invoke-RestMethod -Uri "https://<url-api>/api/auth/sign-up/email" -Method POST -ContentType "application/json" -Body $body
```

---

### ⚠️ Limitasi Free Tier

| Platform | Limitasi |
|----------|----------|
| **Neon** | 0.5 GB storage, auto-pause setelah 5 menit idle (~300ms cold start) |
| **Vercel** | Hobby plan untuk personal/non-commercial use only |

---

## 📁 Struktur Proyek

```
laundry/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── src/
│   │   │   ├── auth/           # Konfigurasi Better Auth
│   │   │   ├── db/             # Schema & koneksi Drizzle ORM
│   │   │   ├── lib/            # Utility helpers
│   │   │   ├── routes/         # Express route handlers
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── env.ts          # Environment validation
│   │   │   └── index.ts        # Entry point server
│   │   ├── drizzle/            # Migration files
│   │   ├── .env.example        # Template environment variables
│   │   ├── drizzle.config.ts   # Drizzle Kit configuration
│   │   └── package.json
│   │
│   └── dashboard/              # Frontend React Dashboard
│       ├── src/
│       │   ├── components/     # UI Components (Sidebar, Modal, Tables)
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Auth client & utilities
│       │   ├── pages/          # Halaman aplikasi
│       │   │   ├── Dashboard   # Ringkasan & statistik
│       │   │   ├── Orders      # Manajemen pesanan
│       │   │   ├── Customers   # Manajemen pelanggan
│       │   │   ├── Categories  # Kategori layanan
│       │   │   ├── Expenses    # Pencatatan pengeluaran
│       │   │   ├── Reports     # Laporan & export
│       │   │   ├── Invoice     # Invoice publik & rating
│       │   │   └── ...         # Login, UserManagement, dll
│       │   ├── providers/      # Context providers (Auth, Query)
│       │   ├── services/       # API service layer (axios)
│       │   ├── types/          # TypeScript type definitions
│       │   ├── utils/          # Thermal printer & receipt builder
│       │   ├── App.tsx         # Main app & routing
│       │   └── main.tsx        # React entry point
│       ├── tailwind.config.js  # Tailwind configuration
│       ├── vite.config.ts      # Vite configuration
│       └── package.json
│
├── docker-compose.yml          # PostgreSQL container config
├── package.json                # Root monorepo config
└── .gitignore
```

---

## 📜 Script yang Tersedia

Semua script dijalankan dari **root project**:

| Script               | Deskripsi                                     |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Jalankan API + Dashboard secara bersamaan      |
| `npm run dev:api`    | Jalankan API saja                              |
| `npm run dev:dashboard` | Jalankan Dashboard saja                     |
| `npm run db:up`      | Start PostgreSQL container (Docker)            |
| `npm run db:down`    | Stop PostgreSQL container                      |
| `npm run db:push`    | Push Drizzle schema ke database                |
| `npm run db:generate`| Generate migration files dari perubahan schema |
| `npm run db:studio`  | Buka Drizzle Studio (GUI database)             |

---

## 🔧 Troubleshooting

### ❌ `npm install` gagal

```bash
# Hapus node_modules dan install ulang
rm -rf node_modules apps/*/node_modules
npm install
```

### ❌ Database tidak bisa connect

1. Pastikan Docker Desktop sudah berjalan
2. Cek container: `docker ps -a`
3. Restart container: `npm run db:down && npm run db:up`
4. Pastikan port `5432` tidak digunakan proses lain

### ❌ Halaman dashboard blank / error

1. Pastikan API sudah berjalan di `http://localhost:3001`
2. Cek console browser untuk error
3. Pastikan `CORS_ORIGIN` di `.env` sesuai dengan URL dashboard

### ❌ Login gagal / "User not found"

Pastikan sudah melakukan [registrasi admin](#-registrasi-admin-pertama) terlebih dahulu.

### ❌ Schema push gagal

```bash
# Pastikan database sudah berjalan
docker ps

# Re-push schema
npm run db:push
```

---

## 📄 Lisensi

Private — Hak cipta dilindungi.
