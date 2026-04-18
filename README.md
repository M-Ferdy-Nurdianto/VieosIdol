# VIEOS Project

VIEOS adalah platform manajemen sistem order polaroid/cheki untuk event (terinspirasi dari ekosistem JKT48).

## 🚀 Fitur Utama
- **Sistem Order Online**: Form pemesanan yang responsif dengan upload bukti transfer.
- **Manajemen Event**: Admin dapat mengatur event aktif, deadline PO, dan daftar member yang tersedia.
- **Export Data**: Dashboard admin mendukung ekspor data ke format Excel dan PDF.
- **Keamanan**: Dilengkapi dengan security headers (Helmet), Rate Limiting, dan autentikasi via Supabase.

## 🛠️ Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database & Storage**: Supabase (PostgreSQL & Storage Buckets).
- **Security**: Helmet, Express Rate Limit, CORS protection.

## 📂 Struktur Folder
- `/client`: Source code frontend (React + Vite).
- `/server`: Source code backend (Express API).
- `/db`: Kumpulan script migrasi SQL untuk Supabase.

## ⚙️ Persiapan (Prerequisites)
1. Node.js versi 18 ke atas.
2. Akun Supabase (untuk database dan storage).
3. File `.env` di folder `server` dengan isi:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   FRONTEND_URL=your_deployed_frontend_url
   ```

## 💻 Cara Menjalankan Lokal
1. Clone repositori ini.
2. Setup Backend:
   ```bash
   cd server
   npm install
   npm start
   ```
3. Setup Frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 🌐 Deployment (Vercel)
Proyek ini sudah dikonfigurasi untuk dideploy ke Vercel sebagai monorepo.
1. Hubungkan repositori GitHub ke Vercel.
2. Tambahkan **Environment Variables** (sama seperti di `.env`) di dashboard Vercel.
3. Klik Deploy.

## 🛡️ Keamanan & Produksi
- **CORS**: Sudah dibatasi untuk mencegah akses ilegal dari domain lain.
- **Rate Limit**: Pembatasan request untuk mencegah spam pada endpoint pemesanan.
- **Secrets**: Pastikan `.env` tidak pernah dipush ke GitHub.

---
*Dibuat dengan ❤️ untuk komunitas.*

© 2026 VIEOS IDOL. All rights reserved.
