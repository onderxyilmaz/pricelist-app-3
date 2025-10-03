# Fiyat List App

Modern bir fiyat listesi yönetim uygulaması. Dashboard, Excel import, kullanıcı yönetimi ve gelişmiş filtreleme özellikleri ile tam kapsamlı fiyat listesi çözümü.

## Teknoloji Stack

### Backend
- **Node.js** - JavaScript runtime
- **Fastify** v4.24.3 - Hızlı ve hafif web framework
- **PostgreSQL** - İlişkisel veritabanı
- **@fastify/postgres** v5.2.2 - PostgreSQL bağlantısı ve sorgu işlemleri
- **@fastify/cors** v8.5.0 - Cross-Origin Resource Sharing desteği
- **@fastify/multipart** v8.0.0 - Dosya upload desteği
- **@fastify/static** v6.12.0 - Statik dosya servisi
- **bcryptjs** v3.0.2 - Şifre hashleme
- **dotenv** v16.3.1 - Ortam değişkenleri yönetimi
- **fs-extra** v11.2.0 - Dosya sistemi işlemleri
- **pg** v8.11.3 - PostgreSQL driver
- **path** v0.12.7 - Dosya yolu işlemleri

**Geliştirme Araçları:**
- **nodemon** v3.0.2 - Otomatik sunucu yeniden başlatma

### Frontend
- **React** v19.1.1 - Modern UI framework
- **Vite** v7.1.2 - Hızlı build tool ve dev server
- **Ant Design** v5.27.0 - Profesyonel UI komponenti kütüphanesi
- **@ant-design/icons** v6.0.0 - Ant Design ikon seti
- **React Router DOM** v7.8.1 - Single Page Application routing
- **Axios** v1.11.0 - HTTP client ve API istekleri
- **ExcelJS** v4.4.0 - Excel dosyası oluşturma ve okuma
- **XLSX** v0.18.5 - Excel dosyası parsing

**Geliştirme Araçları:**
- **ESLint** v9.33.0 - Kod kalitesi ve syntax kontrolü
- **@vitejs/plugin-react** v5.0.0 - React entegrasyonu
- **@types/react** v19.1.10 - React TypeScript tipleri
- **eslint-plugin-react-hooks** v5.2.0 - React Hooks linting
- **eslint-plugin-react-refresh** v0.4.20 - Hot reload desteği

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
- ✅ Müşteri otomatik tamamlama ve yönetimi
- ✅ Ürün seçimi ile stok kontrolü
- ✅ Fiyat listelerine göre gruplu teklif önizleme
- ✅ Para birimi simgeleri ile modern görünüm

### 🏢 Müşteri Yönetimi
- ✅ Müşteri ekleme, düzenleme, silme
- ✅ Tekliflerde otomatik müşteri senkronizasyonu
- ✅ Müşteri kullanım sayısı takibi
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

### Müşteriler
- `GET /api/customers` - Tüm müşterileri getir (teklif sayısı ile)
- `POST /api/customers` - Yeni müşteri oluştur
- `PUT /api/customers/:id` - Müşteri güncelle
- `DELETE /api/customers/:id` - Müşteri sil
- `GET /api/customers/search` - Müşteri arama (autocomplete)

## Yeni Özellikler (v3.0)

### 🎉 Teklif Sistemi
**Akıllı Numaralandırma:**
- Otomatik YYYY-NNNN formatında teklif numarası (örn: 2025-0001)
- Yıl değiştiğinde otomatik sıfırlanma
- Silinen tekliflerin numaralarını tekrar kullanabilme

**Çok Adımlı Teklif Oluşturma:**
1. **Adım 1:** Teklif No ve Müşteri bilgileri
2. **Adım 2:** Fiyat listelerinden ürün seçimi (stok kontrolü ile)
3. **Adım 3:** Detaylı teklif önizleme ve onaylama

**Gelişmiş Özellikler:**
- Müşteri otomatik tamamlama (typeahead)
- Stok miktarını aşan girişlerde uyarı
- Para birimi simgeleri (€, $, £, ₺)
- Fiyat listelerine göre gruplu gösterim

### 🏢 Müşteri Yönetimi
- Müşteri CRUD işlemleri
- Tekliflerde kullanım sayısı gösterimi
- Müşteri güncellemelerinin tekliflere otomatik yansıması
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