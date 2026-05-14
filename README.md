# 🧺 Laundry — Laundry Management System

Aplikasi manajemen laundry berbasis web dengan **dashboard admin** dan **REST API**, dibangun menggunakan arsitektur monorepo.

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Menjalankan Database](#-menjalankan-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Registrasi Admin Pertama](#-registrasi-admin-pertama)
- [Struktur Proyek](#-struktur-proyek)
- [Script yang Tersedia](#-script-yang-tersedia)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer       | Teknologi                                                       |
| ----------- | --------------------------------------------------------------- |
| **Frontend**| React 19, Vite, TailwindCSS, React Router, TanStack React Query |
| **Backend** | Express 5, TypeScript, Drizzle ORM, Better Auth, Zod            |
| **Database**| PostgreSQL 16 (via Docker)                                      |
| **Tooling** | npm Workspaces, Concurrently, tsx                                |

---

## ✅ Prasyarat

Pastikan perangkat kamu sudah terinstall:

| Software       | Versi Minimum | Cek Versi              |
| -------------- | ------------- | ---------------------- |
| **Node.js**    | v18+          | `node -v`              |
| **npm**        | v9+           | `npm -v`               |
| **Docker**     | v20+          | `docker -v`            |
| **Git**        | v2+           | `git -v`               |

> 💡 **Tips:** Disarankan menggunakan [Node.js LTS](https://nodejs.org/) dan [Docker Desktop](https://www.docker.com/products/docker-desktop/) agar kompatibilitas terjamin.

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/<username>/laundry.git
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

Kemudian buka `apps/api/.env` dan sesuaikan:

```env
# ── Database (harus sama dengan docker-compose.yml) ────────────
DB_USER=laundry
DB_PASSWORD=laundry123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=laundry
DATABASE_URL=postgresql://laundry:laundry123@localhost:5432/laundry

# ── Auth ───────────────────────────────────────────────────────
BETTER_AUTH_SECRET=ganti-dengan-secret-key-yang-kuat
BETTER_AUTH_URL=http://localhost:3001

# ── Server ─────────────────────────────────────────────────────
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

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
    "name": "Admin",
    "email": "admin@laundry.com",
    "password": "password123"
  }'
```

Atau menggunakan **PowerShell**:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/sign-up/email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Admin","email":"admin@laundry.com","password":"password123"}'
```

Setelah berhasil, buka `http://localhost:5173` dan login dengan:
- **Email:** `admin@laundry.com`
- **Password:** `password123`

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
│       │   ├── components/     # UI Components (Sidebar, Tables, dll)
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Auth client & utilities
│       │   ├── providers/      # Context providers (Auth, Query)
│       │   ├── services/       # API service layer (axios)
│       │   ├── types/          # TypeScript type definitions
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
