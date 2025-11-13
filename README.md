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

# 2. Database kurulumu
# PostgreSQL kullanıcısı belirtmek için -U parametresi kullanın
createdb -U postgres pricelist_app_3
psql -U postgres -d pricelist_app_3 -f setup_database.sql

# 3. Migration'ları çalıştırın (refresh_tokens tablosu için)
psql -U postgres -d pricelist_app_3 -f backend/migrations/create_refresh_tokens_table.sql

# 4. Backend kurulumu ve çalıştırma
cd backend
npm install
npm run dev

# 5. Frontend kurulumu ve çalıştırma (yeni terminal)
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
DB_NAME=pricelist_app_3
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/pricelist_app_3

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Önemli:** Production ortamında `JWT_SECRET` için güçlü ve rastgele bir değer kullanın!

**Not:** `.env.example` dosyasını kopyalayarak başlayabilirsiniz:
```bash
cd backend
cp .env.example .env
# Sonra .env dosyasını düzenleyin
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
- ✅ Access Token + Refresh Token mekanizması
  - Access Token: 30 dakika geçerlilik
  - Refresh Token: 30 gün geçerlilik
  - Otomatik token yenileme
  - Token rotation (her refresh'te yeni token)
  - Güvenli token saklama (bcrypt hash)

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

### Authentication
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi (Access Token + Refresh Token döner)
- `POST /api/auth/refresh` - Access token yenileme (Refresh Token ile)
- `POST /api/auth/logout` - Kullanıcı çıkışı (Refresh Token'ı siler)
- `GET /api/auth/check-users` - Kullanıcı var mı kontrolü
- `GET /api/auth/user/:id` - Kullanıcı bilgilerini getir
- `PUT /api/auth/user/:id` - Kullanıcı bilgilerini güncelle
- `POST /api/auth/upload-avatar/:id` - Avatar yükle
- `DELETE /api/auth/avatar/:id` - Avatar sil

**Authentication Mekanizması:**
- Login/Register sonrası hem `accessToken` hem de `refreshToken` döner
- Access Token kısa süreli (30 dakika), API isteklerinde kullanılır
- Refresh Token uzun süreli (30 gün), access token yenilemek için kullanılır
- Access token expire olduğunda frontend otomatik olarak refresh token ile yeni access token alır
- Her refresh işleminde yeni refresh token da döner (token rotation)
- Refresh token'lar veritabanında bcrypt ile hash'lenerek saklanır

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

## Güvenlik Özellikleri

### 🔐 Authentication & Authorization
- **JWT Token Sistemi:** Access Token + Refresh Token mekanizması
- **Token Süreleri:**
  - Access Token: 30 dakika (kısa süreli, güvenlik için)
  - Refresh Token: 30 gün (uzun süreli, kullanıcı deneyimi için)
- **Token Rotation:** Her refresh işleminde yeni refresh token oluşturulur (güvenlik)
- **Güvenli Saklama:** Refresh token'lar bcrypt ile hash'lenerek veritabanında saklanır
- **Otomatik Yenileme:** Access token expire olduğunda frontend otomatik olarak yeniler
- **Otomatik Temizlik:** Süresi dolmuş refresh token'lar otomatik olarak temizlenir
- **HTTPS Zorunluluğu:** Production ortamında HTTPS kullanılmalıdır

### 🛡️ Diğer Güvenlik Özellikleri
- Şifreler bcrypt ile hash'lenir (salt rounds: 12)
- SQL injection koruması
- CORS yapılandırması
- Rate limiting (100 istek/dakika)

## Yeni Özellikler (v3.0)

### 🔐 Access Token + Refresh Token Sistemi (v3.1)
**Güvenlik İyileştirmeleri:**
- Tek token yerine Access Token + Refresh Token mekanizması
- Access token kısa süreli (30 dk), refresh token uzun süreli (30 gün)
- Otomatik token yenileme ile kesintisiz kullanıcı deneyimi
- Token rotation ile gelişmiş güvenlik
- Refresh token'lar veritabanında güvenli şekilde saklanır

**Kullanım:**
- Login/Register sonrası iki token alınır ve localStorage'a kaydedilir
- Access token expire olduğunda frontend otomatik olarak refresh token ile yeniler
- Logout işleminde refresh token backend'den silinir

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
dropdb -U postgres pricelist_app_3
createdb -U postgres pricelist_app_3
psql -U postgres -d pricelist_app_3 -f setup_database.sql

# Migration'ları çalıştır
psql -U postgres -d pricelist_app_3 -f backend/migrations/create_refresh_tokens_table.sql

# Backup al
pg_dump -U postgres pricelist_app_3 > backup.sql

# Backup'tan geri yükle
psql -U postgres -d pricelist_app_3 -f backup.sql
```

### Migration'lar
```bash
# Refresh tokens tablosunu oluştur (yeni kurulumlar için)
psql -U postgres -d pricelist_app_3 -f backend/migrations/create_refresh_tokens_table.sql

# Diğer migration'lar
psql -U postgres -d pricelist_app_3 -f backend/migrations/add_logo_to_companies.sql
```

## Migration Rehberi (v3.0 → v3.1)

Eğer mevcut bir kurulumunuz varsa ve Access Token + Refresh Token sistemine geçmek istiyorsanız:

1. **Migration'ı çalıştırın:**
   ```bash
   psql -U postgres -d pricelist_app_3 -f backend/migrations/create_refresh_tokens_table.sql
   ```

2. **Backend ve Frontend'i güncelleyin:**
   - Backend ve frontend kodlarını en son versiyona güncelleyin
   - `.env` dosyasına `JWT_SECRET` ekleyin

3. **Kullanıcılar:**
   - Mevcut kullanıcılar bir sonraki login'lerinde yeni token sistemini kullanacak
   - Frontend otomatik olarak eski `token` formatını temizler

## Production Deployment

### Güvenlik Kontrol Listesi
- [ ] `JWT_SECRET` için güçlü, rastgele bir değer kullanın
- [ ] HTTPS kullanın (refresh token'lar hassas veri)
- [ ] CORS ayarlarını production domain'ine göre yapılandırın
- [ ] Rate limiting ayarlarını production trafiğine göre optimize edin
- [ ] Database backup'larını düzenli olarak alın
- [ ] Environment variables'ları güvenli şekilde saklayın (secrets management)

### Environment Variables (Production)
```env
NODE_ENV=production
JWT_SECRET=<güçlü-rastgele-değer>
DATABASE_URL=<production-database-url>
CORS_ORIGIN=https://yourdomain.com
```

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.