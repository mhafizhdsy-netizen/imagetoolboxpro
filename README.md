# Aninemax - Platform Streaming Anime & Pembaca Manga

Aninemax adalah platform modern yang dikembangkan menggunakan Next.js 14, menyediakan pengalaman streaming anime dan membaca manga yang imersif dan terintegrasi penuh dengan Jikan API v4 dan Consumet API. Proyek ini dibangun dengan fokus pada performa, desain modern, dan pengalaman pengguna yang optimal.

## 🌟 Fitur Utama (Key Features)

-   **Streaming Anime**: Tonton episode anime terbaru dengan pilihan multi-server dari provider GogoAnime.
-   **Pembaca Manga**: Pengalaman membaca manga yang fleksibel dengan mode *Long Strip* (gulir vertikal) dan *Page by Page* (geser horizontal).
-   **Pencarian & Filter Komprehensif**: Cari anime dan manga dengan filter berdasarkan genre, tipe, status, rating, dan skor.
-   **Daftar Tonton & Baca**: Simpan anime dan manga favorit Anda dalam *Watchlist* dan *Reading List*.
-   **Pelacakan Progres**: Lanjutkan menonton atau membaca dari progres terakhir Anda dengan fitur *Continue Watching/Reading* yang disimpan secara lokal.
-   **Desain Modern & Responsif**: Tampilan *Dark Mode* dengan elemen *glassmorphism*, dirancang dengan pendekatan *Mobile-First*.
-   **Kustomisasi Player & Reader**: Kontrol penuh pada video player (kecepatan, server, dll.) dan manga reader (kecerahan, navigasi chapter).
-   **SEO-Optimized**: Implementasi *Dynamic Metadata* dan *JSON-LD Structured Data* untuk visibilitas mesin pencari yang lebih baik.
-   **Performa Tinggi**: Menggunakan Next.js App Router dengan Server Components untuk fetching data yang efisien dan Skeleton Loading untuk UI yang mulus.

## 🛠️ Stack Teknologi (Tech Stack)

-   **Framework**: **Next.js 14+** (App Router)
-   **Bahasa**: **TypeScript**
-   **Styling**: **Tailwind CSS** (dengan **shadcn/ui** untuk komponen)
-   **State Management**: **Zustand**
-   **Data Fetching & Caching**: **SWR** atau **React Query**
-   **API Utama**:
    -   **Jikan API v4**: Untuk metadata anime dan manga.
    -   **Consumet API**: Untuk data streaming dan episode (Provider: GogoAnime).
-   **Video Player**: **Plyr.js** atau **Video.js**

## 📦 Struktur Proyek (Project Structure)

Struktur file dan folder proyek ini mengikuti praktik terbaik untuk skalabilitas dan pemeliharaan.

```
aninemo/
├── app/
│   ├── (routes)/
│   │   ├── anime/
│   │   ├── manga/
│   │   ├── watch/
│   │   └── read/
│   ├── api/          # Untuk API Proxy (Jikan & Consumet)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/           # Komponen shadcn/ui
│   ├── anime/        # Komponen terkait Anime (Kartu, List Episode, Player)
│   ├── manga/        # Komponen terkait Manga (Kartu, Reader, List Chapter)
│   └── layout/       # Header, Footer, Sidebar Navigasi
├── lib/
│   ├── api/
│   │   ├── jikan.ts        # API Wrapper untuk Jikan (mengelola rate limit)
│   │   └── consumet.ts     # API Wrapper untuk Consumet
│   ├── utils/              # Fungsi helper (LocalStorage, formatters, dll.)
│   └── hooks/              # Custom Hooks (useAnime, useWatchlist, dll.)
└── ... (file konfigurasi lainnya seperti next.config.js, tsconfig.json)
```

## 🚀 Panduan Memulai (Getting Started)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek ini di lingkungan lokal Anda.

### 1. Prasyarat (Prerequisites)

-   Node.js (versi 18.x atau lebih tinggi)
-   npm, yarn, atau pnpm

### 2. Kloning Repositori

```bash
git clone https://github.com/your-username/aninemo.git
cd aninemo
```

### 3. Instalasi Dependensi

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 4. Konfigurasi Environment

Buat file `.env.local` di root proyek dan tambahkan variabel yang diperlukan. API Consumet dapat di-host sendiri atau menggunakan instance publik.

```.env.local
# Contoh URL untuk API Consumet yang di-host sendiri
CONSUMET_API_URL=http://localhost:3000

# Variabel Next.js lainnya jika diperlukan
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Menjalankan Server Development

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## 🌐 Integrasi API

-   **Jikan API Wrapper (`/lib/api/jikan.ts`)**: Semua permintaan ke Jikan API harus melalui wrapper ini untuk mengelola *rate limiting* (3 permintaan/detik) dan menangani error secara terpusat.
-   **Consumet API Wrapper (`/lib/api/consumet.ts`)**: Wrapper ini mengelola permintaan untuk data streaming, episode, dan server, serta menangani potensi masalah CORS jika menggunakan instance publik.
