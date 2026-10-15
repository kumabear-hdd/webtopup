# Kumagemu — Power Up. Play More.

Platform e-commerce top-up game Indonesia modern dengan arsitektur server-side yang aman, kalkulasi harga terverifikasi di backend, abstraksi supplier multi-provider (Mock & Digiflazz), payment gateway terintegrasi (Mock & Midtrans), serta dashboard manajemen admin lengkap.

---

## 1. Arsitektur & Daftar Endpoint Backend

Aplikasi Kumagemu menggunakan arsitektur hybrid full-stack (React 19 + Tailwind CSS v4 + Express Node.js). Semua transaksi keuangan, pemeriksaan akun game, dan komunikasi supplier dilakukan secara eksklusif dari backend server demi menjaga kerahasiaan kredensial API dan mencegah manipulasi harga dari browser.

### Daftar Endpoint API Backend:

| Endpoint | Method | Deskripsi & Keamanan |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check, status runtime, dan verifikasi konfigurasi mode provider (tanpa membocorkan API key). |
| `/api/games` | `GET` | Katalog game aktif beserta skema input field dinamis (User ID, Zone ID, Server). |
| `/api/games/:slug` | `GET` | Detail konfigurasi game dan daftar SKU produk yang tersedia. |
| `/api/products` | `GET` | Daftar nominal produk resmi dengan harga jual retail (modal supplier disembunyikan dari publik). |
| `/api/check-account` | `POST` | Validasi in-game nickname via API inquiry supplier resmi / mock server-side. |
| `/api/orders` | `POST` | Pembuatan pesanan dengan **validasi harga mutlak di server** via Zod. Menghasilkan kode referensi publik unik (`KG-YYYYMMDD-XXXX`). |
| `/api/orders/:ref` | `GET` | Pelacakan status transaksi oleh pembeli secara aman tanpa login. |
| `/api/orders/:ref/simulate-pay` | `POST` | Endpoint simulasi pembayaran sandbox untuk verifikasi alur pemenuhan pesanan tanpa uang sungguhan. |
| `/api/webhook/midtrans` | `POST` | Webhook notifikasi pembayaran dengan **verifikasi signature SHA-512** dan proteksi **idempotensi** (mencegah pemrosesan ganda). |
| `/api/webhook/digiflazz` | `POST` | Webhook penerima callback status transaksi dari supplier Digiflazz. |
| `/api/admin/orders/:id/retry` | `POST` | Eksekusi retry manual pemenuhan supplier oleh administrator berwenang. |
| `/api/admin/orders/:id/refund` | `POST` | Penanganan refund pesanan bermasalah dengan pencatatan audit log otomatis. |
| `/api/admin/catalog/sync` | `POST` | Sinkronisasi harga modal dan status ketersediaan SKU supplier. |

---

## 2. Keamanan & Kerahasiaan Kredensial

1. **Server-Side Only Execution**: Seluruh panggilan ke API Digiflazz (`api.digiflazz.com`) dan Midtrans diproses melalui modul backend Node.js (`src/server/apiRouter.ts`). Browser klien **tidak pernah** memiliki akses ke `DIGIFLAZZ_API_KEY` maupun `MIDTRANS_SERVER_KEY`.
2. **Zero Secrets in Code/Logs**: Kredensial dibaca murni melalui environment variables. Respon JSON API ke klien secara otomatis memfilter kolom sensitif seperti `baseCost`, `supplierSku`, dan API secret hash.
3. **Idempotensi Transaksi**: Webhook pembayaran memeriksa status pesanan terlebih dahulu. Jika pesanan telah berstatus `PAID`, sistem tidak akan meneruskan pesanan ganda ke supplier.
4. **Verifikasi Signature**:
   - Midtrans: `SHA512(order_id + status_code + gross_amount + ServerKey)`
   - Digiflazz: `MD5(username + apiKey + ref_id)`

---

## 3. Konfigurasi Environment Variables & Mode Development Gratis

Kumagemu dirancang agar **dapat langsung dijalankan dalam mode development / preview gratis tanpa API key Digiflazz maupun Midtrans**.

Secara default, jika variabel API key dibiarkan kosong atau tidak ada, sistem akan otomatis berjalan dalam **Mock Mode**:
- `SUPPLIER_MODE="mock"`: Seluruh pengecekan nickname akun game dan fulfillment serial number berjalan secara instan di backend tanpa menghubungi Digiflazz.
- `PAYMENT_GATEWAY_MODE="mock"`: Simulasi pembayaran QRIS dan Virtual Account berjalan langsung di antarmuka invoice tanpa meminta Midtrans Server Key.

### Contoh File `.env` untuk Mode Development Gratis (Tanpa API Key Provider):
```bash
# Server Runtime
PORT=3000
NODE_ENV=development

# Admin Security Passcode (Default demo: kuma2026)
ADMIN_PASSCODE="kuma2026"

# Provider Integrations (Biarkan "mock" untuk pengujian gratis)
SUPPLIER_MODE="mock"
PAYMENT_GATEWAY_MODE="mock"
```

### Konfigurasi untuk Mode Produksi (Opsional - Jika Sudah Memiliki Akun Resmi):
```bash
# Supplier Resmi Digiflazz (Hanya dibaca backend Node.js, tidak pernah ke browser)
SUPPLIER_MODE="digiflazz"
DIGIFLAZZ_USERNAME="username_terdaftar_digiflazz"
DIGIFLAZZ_API_KEY="api_key_resmi_digiflazz"
DIGIFLAZZ_WEBHOOK_SECRET="secret_webhook_anda"

# Payment Gateway Resmi Midtrans (Hanya dibaca backend Node.js)
PAYMENT_GATEWAY_MODE="midtrans"
MIDTRANS_SERVER_KEY="Mid-server-xxxxxxxxxxxx"
MIDTRANS_CLIENT_KEY="Mid-client-xxxxxxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"
```


---

## 4. Panduan Menjalankan & Menguji Aplikasi

### Mode Pengembangan (Development)
```bash
# Menjalankan Vite dev server dengan Express API router
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000`.

### Menjalankan Automated Tests
Kumagemu dilengkapi dengan suite pengujian otomatis untuk memverifikasi:
- Validasi format nomor telepon Indonesia & schema Zod
- Kalkulasi harga IDR (subtotal + biaya admin flat/persen)
- Verifikasi player ID / in-game nickname
- Pembuatan QRIS payload & virtual account
- Alur state machine pemenuhan supplier

Pengujian dapat dijalankan langsung melalui **Admin Console > Tab Automated Tests > Jalankan Pengujian**.

---

## 5. Panduan Beralih Mode (Mock vs Live)

Secara default, Kumagemu berjalan dalam **Mock Mode** sehingga seluruh fitur (katalog, checkout, validasi akun, simulasi pembayaran QRIS/VA, dan pembuatan serial number) dapat diuji tanpa saldo nyata atau risiko finansial.

### Cara Mengaktifkan Mode Live:
1. Daftarkan akun di [Digiflazz](https://digiflazz.com) dan dapatkan `DIGIFLAZZ_USERNAME` serta `DIGIFLAZZ_API_KEY`.
2. Daftarkan akun merchant di [Midtrans](https://midtrans.com) dan dapatkan `Server Key` serta `Client Key`.
3. Pasang IP statis server Anda pada whitelist Digiflazz Merchant Dashboard.
4. Ubah environment variable pada server:
   ```env
   SUPPLIER_MODE="digiflazz"
   PAYMENT_GATEWAY_MODE="midtrans"
   ```
5. Atau beralih langsung melalui **Admin Console > Tab Integrasi Provider** dengan mengklik radio button provider yang diinginkan.

### Cara Kembali ke Mock Mode (Instant Fallback):
Jika saldo supplier habis, terjadi gangguan jaringan publisher, atau dalam masa maintenance:
1. Buka **Panel Admin Kumagemu** (`Passcode: kuma2026`).
2. Masuk ke tab **Integrasi Provider**.
3. Pilih **Mock Supplier (Sandbox/Demo)** dan **Mock Payment Provider**.
4. Sistem seketika kembali ke mode simulasi aman tanpa memutus pengalaman berbelanja pengguna.

---

## 6. Kompatibilitas Deployment Google Cloud Run

Kumagemu 100% kompatibel dengan arsitektur serverless **Google Cloud Run** dari AI Studio:

1. **Port Binding**: Menggunakan `process.env.PORT || 3000` dan mengikat host ke `0.0.0.0`.
2. **Build & Start Pipeline**:
   ```bash
   npm run build
   npm start
   ```
   Perintah `npm start` menjalankan `server.ts` via TSX yang langsung menyajikan berkas statis `dist/` untuk antarmuka web, serta menangani seluruh rute `/api/*` secara terpadu.
3. **Stateless Scale-to-Zero**: Mendukung scale-to-zero untuk efisiensi biaya gratis (free-tier Cloud Run menyediakan 2 juta request/bulan gratis).
4. **Database Persistensi**: Telah disediakan skema database Supabase PostgreSQL lengkap dengan Row Level Security (RLS) di `supabase/migrations/20261014_init_kumabear.sql`.

---

© 2026 Kumagemu. Power Up. Play More.
