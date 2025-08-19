# Fiyat List App

Modern bir fiyat listesi yönetim uygulaması. Dashboard, Excel import, kullanıcı yönetimi ve gelişmiş filtreleme özellikleri ile tam kapsamlı fiyat listesi çözümü.

## Teknoloji Stack

### Backend
- **Node.js** - JavaScript runtime
- **Fastify** - Web framework
- **PostgreSQL** - Veritabanı
- **@fastify/postgres** - PostgreSQL bağlantısı
- **@fastify/cors** - CORS desteği

### Frontend
- **React** - UI framework
- **Ant Design** - UI komponenti kütüphanesi
- **React Router** - Sayfa yönlendirme
- **Axios** - HTTP client

## Hızlı Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üstü)
- PostgreSQL
- npm veya yarn

### Kurulum Adımları

```bash
# 1. Repository'yi klonlayın
git clone https://github.com/onderxyilmaz/pricelist-app-3.git
cd pricelist-app-3

# 2. Database kurulumu (TEK KOMUT!)
# PostgreSQL kullanıcısı belirtmek için -U parametresi kullanın
createdb -U postgres pricelist-app-3
psql -U postgres -d pricelist-app-3 -f setup_database.sql

# 3. Backend kurulumu ve çalıştırma
cd backend
npm install
npm run dev

# 4. Frontend kurulumu ve çalıştırma (yeni terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

Backend için `.env` dosyası oluşturun (`backend/.env`):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pricelist-app-3
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=3001

# Optional: JWT Secret (gelecek sürümler için)
# JWT_SECRET=your_jwt_secret_here
```

### İlk Kullanıcı
Uygulama ilk çalıştırıldığında:
- Veritabanı boş tablolarla kurulur (hiç kullanıcı olmaz)
- Frontend açıldığında otomatik olarak **Register sayfası** gösterilir
- İlk kaydolan kullanıcı otomatik olarak **Super Admin** rolü alır
- Sonraki açılışlarda **Login sayfası** gösterilir

## Özellikler

### 📊 Dashboard
- ✅ İstatistik kartları (toplam liste, ürün, değer)
- ✅ Son eklenen ürünler tablosu
- ✅ Hızlı işlem butonları

### 📋 Fiyat Listesi Yönetimi
- ✅ Fiyat listesi oluşturma, düzenleme, silme
- ✅ Renk kodları ile kategorilendirme
- ✅ Farklı para birimleri desteği (EUR, USD, TRY, vb.)

### 🛍️ Ürün Yönetimi
- ✅ Ürün ekleme, düzenleme, silme
- ✅ Product ID, stok takibi
- ✅ Birim seçenekleri (adet, kg, m, vb.)
- ✅ Toplu ürün işlemleri

### 📊 Tüm Ürünler Sayfası
- ✅ Tüm ürünleri tek sayfada görüntüleme
- ✅ Gelişmiş filtreleme (çoklu fiyat listesi seçimi)
- ✅ Excel export (kolon seçimi ile)
- ✅ Pagination ve sıralama

### 📁 Excel Import
- ✅ Excel dosyasından ürün import
- ✅ Otomatik duplikasyon kontrolü
- ✅ Kolon eşleştirme
- ✅ Toplu import işlemleri

### 👥 Kullanıcı Yönetimi
- ✅ Kullanıcı rolleri (Super Admin, Admin, User)
- ✅ Profil yönetimi ve avatar upload
- ✅ Güvenli authentication

### 📋 Teklif Yönetimi
- ✅ Akıllı teklif numaralandırma (YYYY-NNNN formatı)
- ✅ Yıllık sıfırlama ve boş numara tekrar kullanımı
- ✅ Çok adımlı teklif oluşturma wizard'ı
- ✅ Firma otomatik tamamlama ve yönetimi
- ✅ Ürün seçimi ile stok kontrolü
- ✅ Fiyat listelerine göre gruplu teklif önizleme
- ✅ Para birimi simgeleri ile modern görünüm

### 🏢 Firma Yönetimi
- ✅ Firma ekleme, düzenleme, silme
- ✅ Tekliflerde otomatik firma senkronizasyonu
- ✅ Firma kullanım sayısı takibi
- ✅ Güvenli silme (tekliflerdeki referansları temizleme)

### 🎨 Arayüz
- ✅ Modern Ant Design komponentleri
- ✅ Responsive tasarım
- ✅ Türkçe arayüz
- ✅ Dark theme header
- ✅ Multi-step wizard'lar
- ✅ Gelişmiş form validasyonları

## API Endpoints

### Fiyat Listeleri
- `GET /api/pricelists` - Tüm fiyat listelerini getir
- `GET /api/pricelists/:id` - Belirli fiyat listesini getir
- `POST /api/pricelists` - Yeni fiyat listesi oluştur
- `DELETE /api/pricelists/:id` - Fiyat listesini sil

### Ürünler
- `POST /api/pricelists/:id/items` - Ürün ekle
- `PUT /api/items/:id` - Ürün güncelle
- `DELETE /api/items/:id` - Ürün sil
- `GET /api/pricelists-with-items` - Tüm fiyat listeleri ve ürünleri getir

### Teklifler
- `GET /api/offers` - Tüm teklifleri getir
- `POST /api/offers` - Yeni teklif oluştur
- `PUT /api/offers/:id` - Teklif güncelle
- `DELETE /api/offers/:id` - Teklif sil
- `GET /api/offers/next-number` - Sonraki teklif numarasını getir
- `GET /api/offers/available-numbers` - Boş teklif numaralarını getir
- `POST /api/offers/:id/items` - Teklif ürünlerini kaydet
- `GET /api/offers/:id/items` - Teklif ürünlerini getir

### Firmalar
- `GET /api/companies` - Tüm firmaları getir (teklif sayısı ile)
- `POST /api/companies` - Yeni firma oluştur
- `PUT /api/companies/:id` - Firma güncelle
- `DELETE /api/companies/:id` - Firma sil
- `GET /api/companies/search` - Firma arama (autocomplete)

## Yeni Özellikler (v3.0)

### 🎉 Teklif Sistemi
**Akıllı Numaralandırma:**
- Otomatik YYYY-NNNN formatında teklif numarası (örn: 2025-0001)
- Yıl değiştiğinde otomatik sıfırlanma
- Silinen tekliflerin numaralarını tekrar kullanabilme

**Çok Adımlı Teklif Oluşturma:**
1. **Adım 1:** Teklif No ve Firma bilgileri
2. **Adım 2:** Fiyat listelerinden ürün seçimi (stok kontrolü ile)
3. **Adım 3:** Detaylı teklif önizleme ve onaylama

**Gelişmiş Özellikler:**
- Firma otomatik tamamlama (typeahead)
- Stok miktarını aşan girişlerde uyarı
- Para birimi simgeleri (€, $, £, ₺)
- Fiyat listelerine göre gruplu gösterim

### 🏢 Firma Yönetimi
- Firma CRUD işlemleri
- Tekliflerde kullanım sayısı gösterimi
- Firma güncellemelerinin tekliflere otomatik yansıması
- Güvenli silme (tekliflerdeki referansları temizleme)

## Geliştirme

### Sunucu Adresleri
- **Backend API:** http://localhost:3001
- **Frontend:** http://localhost:5173 (Vite dev server)

### Kullanışlı Komutlar

#### Backend
```bash
npm run dev    # Development server
npm start      # Production server
```

#### Frontend
```bash
npm run dev    # Development server (http://localhost:5173)
npm run build  # Production build
npm run preview # Preview production build
```

### Veritabanı Yönetimi
```bash
# Database'i sıfırla (PostgreSQL kullanıcısı belirtmek için -U parametresi kullanın)
dropdb -U postgres pricelist-app-3
createdb -U postgres pricelist-app-3
psql -U postgres -d pricelist-app-3 -f setup_database.sql

# Backup al
pg_dump -U postgres pricelist-app-3 > backup.sql

# Backup'tan geri yükle
psql -U postgres -d pricelist-app-3 -f backup.sql
```

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.