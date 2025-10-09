# Fiyat Listesi ve Teklif Yönetim Uygulaması

Gelişmiş Excel içe/dışa aktarma özellikleri ve çok dilli desteğe sahip fiyat listeleri, teklifler, müşteriler ve ürünleri yönetmek için kapsamlı bir full-stack uygulama.

## 🌟 Ana Özellikler

### 📊 Gelişmiş Teklif Yönetimi
- **6 Adımlı Sihirbaz Sistemi**: Sezgisel adım adım teklif oluşturma süreci
- **Net Fiyat ve Liste Fiyatı Kolonları**: Renk kodlu ayrım ile net fiyatlandırma yapısı
- **Ürün Satış İndirimi**: Stratejik indirim konumlandırma ve hesaplama
- **Teklif Şablonları**: Hızlı teklif oluşturma için önceden yapılandırılmış şablonlar
- **Çoklu Müşteri Desteği**: Farklı müşteriler arasında teklif yönetimi
- **Gerçek Zamanlı Hesaplamalar**: İndirim uygulamaları ile otomatik fiyat hesaplamaları

### 📈 Kapsamlı Fiyat Listesi Yönetimi
- **Dinamik Fiyat Listesi Oluşturma**: Özelleştirilebilir parametrelerle esnek fiyat listesi üretimi
- **Çok Dilli Ürün Adları**: Türkçe ve İngilizce ürün adı desteği
- **Excel İçe/Dışa Aktarma**: Başlık esnekliği ile gelişmiş Excel işleme
- **Toplu İşlemler**: Verimli toplu ürün yönetimi
- **Fiyat Geçmişi Takibi**: Zaman içindeki fiyat değişikliklerini izleme

### 🏢 Müşteri ve Kullanıcı Yönetimi
- **Müşteri Profilleri**: Eksiksiz müşteri bilgi yönetimi
- **Kullanıcı Rol Sistemi**: Admin ve kullanıcı rol ayrımı
- **Avatar Yönetimi**: Kullanıcı profil resmi yükleme ve yönetimi
- **Kimlik Doğrulama Sistemi**: Oturum yönetimi ile güvenli giriş/çıkış

### 📋 Şablon Sistemi
- **Teklif Şablonları**: Yeniden kullanılabilir teklif konfigürasyonları
- **Şablon Kategorileri**: Organize şablon yönetimi
- **Hızlı Şablon Uygulama**: Tek tıkla şablon dağıtımı
- **Şablon Özelleştirme**: Esnek şablon modifikasyonu

### 🌐 Çok Dilli Destek
- **Türkçe/İngilizce Arayüz**: Tamamen çift dilli destek
- **Dil Bilinçli Excel İçe Aktarma**: Akıllı dil algılama ve işleme
- **İkili Ürün Adları**: Hem Türkçe hem İngilizce adlara sahip ürünler
- **Yerelleştirilmiş Bildirimler**: Dile özel kullanıcı geri bildirimleri

### 📁 Gelişmiş Excel Özellikleri
- **Esnek Başlık Eşleme**: Otomatik başlık algılama ve eşleme
- **Zorunlu Dil Seçimi**: Tutarlılık için zorunlu dil seçimi
- **Hata İşleme**: Kapsamlı hata algılama ve raporlama
- **İlerleme Takibi**: Gerçek zamanlı içe aktarma ilerleme göstergesi
- **Veri Doğrulama**: İçe aktarmadan önce kapsamlı veri doğrulama

## 🛠️ Teknoloji Stack

### Frontend
- **React** v19.1.1 - Modern hooks ve özelliklerle en son React sürümü
- **Ant Design** v5.27.0 - Profesyonel UI komponent kütüphanesi
- **Vite** v7.1.2 - Hızlı build aracı ve geliştirme sunucusu
- **React Router DOM** v7.8.1 - Single Page Application yönlendirme
- **Axios** v1.11.0 - HTTP client ve API istekleri
- **ExcelJS** v4.4.0 - Excel dosyası oluşturma ve okuma
- **XLSX** v0.18.5 - Excel dosyası ayrıştırma

**Geliştirme Araçları:**
- **ESLint** v9.33.0 - Kod kalitesi ve syntax kontrolü
- **@vitejs/plugin-react** v5.0.0 - React entegrasyonu

### Backend
- **Fastify** v4.24.3 - Yüksek performanslı web framework
- **Node.js** - JavaScript runtime ortamı
- **PostgreSQL** - Güçlü ilişkisel veritabanı sistemi
- **@fastify/postgres** v5.2.2 - PostgreSQL bağlantısı ve sorgu işlemleri
- **@fastify/cors** v8.5.0 - Cross-Origin Resource Sharing desteği
- **@fastify/multipart** v8.0.0 - Dosya upload desteği
- **@fastify/static** v6.12.0 - Statik dosya servisi
- **bcryptjs** v3.0.2 - Şifre hashleme
- **dotenv** v16.3.1 - Ortam değişkenleri yönetimi
- **fs-extra** v11.2.0 - Dosya sistemi işlemleri

**Geliştirme Araçları:**
- **nodemon** v3.0.2 - Otomatik sunucu yeniden başlatma

### Veritabanı Şeması
- **8 Ana Tablo**: Kapsamlı veri yapısı
  - `users`: Kullanıcı yönetimi ve kimlik doğrulama
  - `customers`: Müşteri bilgileri ve ilişkileri
  - `pricelists`: Fiyat listesi konfigürasyonları ve metadata
  - `pricelist_items`: Çift dil desteği ile bireysel ürün girişleri
  - `offers`: Teklif yönetimi ve takibi
  - `offer_items`: Detaylı teklif satır öğeleri
  - `offer_templates`: Yeniden kullanılabilir teklif şablonları
  - `offer_template_items`: Şablon öğe konfigürasyonları

## 🚀 Hızlı Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üstü)
- PostgreSQL (v12 veya üstü)
- npm veya yarn paket yöneticisi

### Kurulum Adımları

```bash
# 1. Repository'yi klonlayın
git clone https://github.com/onderxyilmaz/pricelist-app-3.git
cd pricelist-app-3

# 2. Veritabanı kurulumu
createdb -U postgres pricelist-app-3
psql -U postgres -d pricelist-app-3 -f setup_database.sql

# 3. Backend kurulumu ve çalıştırma
cd backend
npm install
npm run dev

# 4. Frontend kurulumu ve çalıştırma (yeni terminal)
cd ../frontend
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
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 🎯 İlk Kullanıcı
Uygulama ilk çalıştırıldığında:
- Veritabanı boş tablolarla kurulur (hiç kullanıcı olmaz)
- Frontend açıldığında otomatik olarak **Register sayfası** gösterilir
- İlk kaydolan kullanıcı otomatik olarak **Super Admin** rolü alır
- Sonraki açılışlarda **Login sayfası** gösterilir

### 📍 Sunucu Adresleri
- **Frontend:** http://localhost:5173 (Vite dev server)
- **Backend API:** http://localhost:3000

## 🐳 Docker ile Production Deployment

### Hızlı Docker Compose Kurulumu

```bash
# 1. Environment dosyasını kopyala ve düzenle
cp .env.example .env

# 2. Güvenlik değişkenlerini güncelleyin
# .env dosyasında DB_PASSWORD ve JWT_SECRET değerlerini değiştirin

# 3. Docker Compose ile çalıştır
docker-compose up -d

# 4. Database schema'yı yükle (ilk kurulumda)
docker-compose exec postgres psql -U postgres -d pricelist-app-3 -f /docker-entrypoint-initdb.d/setup_database.sql

# 5. Uygulama http://localhost:3000 adresinde hazır!
```

### Manuel Docker Build

```bash
# 1. Docker image build et
docker build -t pricelist-app-v3 .

# 2. PostgreSQL container çalıştır
docker run -d \
  --name pricelist-postgres \
  -e POSTGRES_DB=pricelist-app-3 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=admin123 \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# 3. Database schema yükle
docker exec -i pricelist-postgres psql -U postgres -d pricelist-app-3 < setup_database.sql

# 4. Uygulama container çalıştır
docker run -d \
  --name pricelist-app \
  --link pricelist-postgres:postgres \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=admin123 \
  -p 3000:3000 \
  pricelist-app-v3
```

### Environment Variables
`.env` dosyasında düzenlenmesi gerekenler:
```env
# Güvenlik için değiştirin!
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# İsteğe bağlı
PORT=3000
NODE_ENV=production
```

### Health Check
Uygulama durumunu kontrol etmek için:
```bash
# Docker container durumu
docker ps

# Health check
curl http://localhost:3000/health

# Logs
docker logs pricelist-app
docker logs pricelist-postgres
```

## 📁 Proje Yapısı

```
pricelist-app-3/
├── backend/                    # Fastify backend uygulaması
│   ├── .env                   # Ortam değişkenleri
│   ├── .env.example          # Ortam değişkenleri şablonu
│   ├── server.js             # Ana sunucu konfigürasyonu
│   ├── src/routes/           # API route tanımları
│   │   ├── adminRoutes.js    # Admin özel endpoint'leri
│   │   ├── authRoutes.js     # Kimlik doğrulama endpoint'leri
│   │   ├── offerRoutes.js    # Teklif yönetimi endpoint'leri
│   │   ├── pricelistRoutes.js # Fiyat listesi endpoint'leri
│   │   └── customerRoutes.js  # Müşteri yönetimi endpoint'leri
│   └── uploads/avatars/      # Kullanıcı avatar depolama
├── frontend/                  # React frontend uygulaması
│   ├── src/
│   │   ├── components/       # Yeniden kullanılabilir UI bileşenleri
│   │   │   ├── Navbar.jsx    # Navigasyon bileşeni
│   │   │   ├── Sidebar.jsx   # Kenar çubuğu navigasyonu
│   │   │   └── LogoutHandler.jsx # Çıkış fonksiyonalitesi
│   │   ├── pages/            # Ana uygulama sayfaları
│   │   │   ├── Dashboard.jsx        # Ana dashboard
│   │   │   ├── Offers.jsx           # Teklif sihirbaz sistemi
│   │   │   ├── OfferTemplates.jsx   # Şablon yönetimi
│   │   │   ├── Pricelist/           # Fiyat listesi yönetimi
│   │   │   ├── Customers/           # Müşteri yönetimi
│   │   │   ├── AllProducts/         # Tüm ürünler sayfası
│   │   │   ├── Profile/             # Profil yönetimi
│   │   │   ├── ImportExcel.jsx      # Excel içe aktarma arayüzü
│   │   │   ├── UserManagement.jsx   # Kullanıcı yönetimi
│   │   │   ├── Login.jsx            # Giriş sayfası
│   │   │   └── Register.jsx         # Kayıt sayfası
│   │   └── utils/            # Yardımcı fonksiyonlar
│   │       ├── api.js        # API iletişim katmanı
│   │       └── notification.js # Bildirim sistemi
└── setup_database.sql        # Veritabanı kurulum scripti
```
## ✨ Özellikler

### 📊 Dashboard
- ✅ İstatistik kartları (toplam liste, ürün, değer)
- ✅ Son eklenen ürünler tablosu
- ✅ Hızlı işlem butonları

### 📋 Fiyat Listesi Yönetimi
- ✅ Fiyat listesi oluşturma, düzenleme, silme
- ✅ Renk kodları ile kategorilendirme
- ✅ Farklı para birimleri desteği (EUR, USD, TRY, vb.)
- ✅ Çok dilli ürün adları (Türkçe/İngilizce)

### 🛍️ Ürün Yönetimi
- ✅ Ürün ekleme, düzenleme, silme
- ✅ Product ID, stok takibi
- ✅ Birim seçenekleri (adet, kg, m, vb.)
- ✅ Toplu ürün işlemleri
- ✅ İkili dil desteği (TR/EN)

### 📊 Tüm Ürünler Sayfası
- ✅ Tüm ürünleri tek sayfada görüntüleme
- ✅ Gelişmiş filtreleme (çoklu fiyat listesi seçimi)
- ✅ Excel export (kolon seçimi ile)
- ✅ Pagination ve sıralama
- ✅ Dil değiştirme (TR/EN)

### 📁 Excel İçe/Dışa Aktarma
- ✅ Excel dosyasından ürün import
- ✅ Otomatik duplikasyon kontrolü
- ✅ Kolon eşleştirme ve başlık algılama
- ✅ Zorunlu dil seçimi
- ✅ İlerleme takibi ve hata raporlama
- ✅ Toplu import işlemleri

### 👥 Kullanıcı Yönetimi
- ✅ Kullanıcı rolleri (Super Admin, Admin, User)
- ✅ Profil yönetimi ve avatar upload
- ✅ Güvenli authentication
- ✅ Kullanıcı oluşturma, düzenleme, silme

### 📋 Teklif Yönetimi
- ✅ **6 Adımlı Teklif Sihirbazı**:
  1. Müşteri Seçimi
  2. Şablon Seçimi (İsteğe bağlı)
  3. Ürün Konfigürasyonu
  4. Fiyatlandırma Ayarları
  5. İndirim Uygulamaları
  6. İnceleme ve Onaylama
- ✅ Akıllı teklif numaralandırma (YYYY-NNNN formatı)
- ✅ Yıllık sıfırlama ve boş numara tekrar kullanımı
- ✅ Net Fiyat ve Liste Fiyatı kolonları
- ✅ Ürün Satış İndirimi sistemi
- ✅ Gerçek zamanlı fiyat hesaplamaları

### 📋 Teklif Şablonları
- ✅ Yeniden kullanılabilir teklif konfigürasyonları
- ✅ Hızlı şablon uygulama
- ✅ Şablon kategorilendirme
- ✅ Özel şablon oluşturma

### 🏢 Müşteri Yönetimi
- ✅ Müşteri ekleme, düzenleme, silme
- ✅ Tekliflerde otomatik müşteri senkronizasyonu
- ✅ Müşteri kullanım sayısı takibi
- ✅ Güvenli silme (tekliflerdeki referansları temizleme)
- ✅ Müşteri arama (autocomplete/typeahead)

### 🎨 Arayüz ve Kullanıcı Deneyimi
- ✅ Modern Ant Design komponentleri
- ✅ Responsive tasarım
- ✅ Türkçe arayüz
- ✅ Dark theme header
- ✅ Multi-step wizard'lar
- ✅ Gelişmiş form validasyonları
- ✅ Toast bildirimler
- ✅ Loading states ve progress göstergeleri

## 🔧 API Endpoints

### Kimlik Doğrulama
- `GET /api/auth/check-users` - Kullanıcı varlığı kontrolü
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/user/:id` - Kullanıcı bilgileri
- `PUT /api/auth/user/:id` - Kullanıcı güncelleme
- `POST /api/auth/upload-avatar/:id` - Avatar yükleme
- `DELETE /api/auth/avatar/:id` - Avatar silme

### Fiyat Listeleri
- `GET /api/pricelists` - Tüm fiyat listelerini getir
- `GET /api/pricelists/:id` - Belirli fiyat listesini getir
- `POST /api/pricelists` - Yeni fiyat listesi oluştur
- `PUT /api/pricelists/:id` - Fiyat listesi güncelle
- `DELETE /api/pricelists/:id` - Fiyat listesi sil
- `GET /api/pricelists-with-items` - Tüm fiyat listeleri ve ürünleri

### Ürünler
- `POST /api/pricelists/:id/items` - Ürün ekle
- `PUT /api/items/:id` - Ürün güncelle
- `DELETE /api/items/:id` - Ürün sil

### Teklifler
- `GET /api/offers` - Tüm teklifleri getir
- `POST /api/offers` - Yeni teklif oluştur
- `PUT /api/offers/:id` - Teklif güncelle
- `DELETE /api/offers/:id` - Teklif sil
- `GET /api/offers/next-number` - Sonraki teklif numarasını getir
- `GET /api/offers/available-numbers` - Boş teklif numaralarını getir
- `POST /api/offers/:id/items` - Teklif ürünlerini kaydet
- `GET /api/offers/:id/items` - Teklif ürünlerini getir

### Teklif Şablonları
- `GET /api/offer-templates` - Tüm şablonları getir
- `POST /api/offer-templates` - Yeni şablon oluştur
- `PUT /api/offer-templates/:id` - Şablon güncelle
- `DELETE /api/offer-templates/:id` - Şablon sil

### Müşteriler
- `GET /api/customers` - Tüm müşterileri getir (teklif sayısı ile)
- `POST /api/customers` - Yeni müşteri oluştur
- `PUT /api/customers/:id` - Müşteri güncelle
- `DELETE /api/customers/:id` - Müşteri sil
- `GET /api/customers/search` - Müşteri arama (autocomplete)

### Admin
- `GET /api/admin/users` - Tüm kullanıcıları getir (admin only)
- `POST /api/admin/users` - Yeni kullanıcı oluştur (admin only)
- `PUT /api/admin/users/:id` - Kullanıcı güncelle (admin only)
- `DELETE /api/admin/users/:id` - Kullanıcı sil (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Dashboard istatistikleri

## 💡 Kullanım Kılavuzu

### �️ Teklif Oluşturma (6 Adımlı Sihirbaz)
1. **Müşteri Seçimi**: Hedef müşteriyi dropdown'dan seç
2. **Şablon Seçimi**: Önceden yapılandırılmış şablon seç (isteğe bağlı)
3. **Ürün Konfigürasyonu**: Fiyatlandırma ile ürün ekle
4. **Fiyat Ayarları**: Net Fiyat ve Liste Fiyatı kolonlarını yapılandır
5. **İndirim Uygulama**: Ürün Satış İndirimi yüzdelerini belirle
6. **İnceleme ve Gönderme**: Son inceleme ve teklif oluşturma

### 📊 Excel İçe Aktarma Süreci
1. **Dil Seçimi**: Türkçe veya İngilizce seç (zorunlu)
2. **Dosya Yükleme**: Ürün verili Excel dosyasını seç
3. **Başlık Eşleme**: Otomatik başlık algılama ve eşleme
4. **Veri Doğrulama**: Sistem içe aktarılan veriyi doğrular
5. **İçe Aktarma Tamamlama**: Ürünler fiyat listesine eklenir

### 📋 Şablon Yönetimi
1. **Şablon Oluştur**: Yeniden kullanılabilir teklif konfigürasyonları tanımla
2. **Ürün Ataması**: Şablona ürün ekle
3. **Varsayılan Değerler**: Varsayılan fiyatlandırma ve indirimleri yapılandır
4. **Tekliflerde Uygula**: Teklif oluşturma sihirbazında şablonları kullan

### 🏢 Müşteri Yönetimi
1. **Müşteri Ekle**: Yeni müşteri bilgilerini gir
2. **Otomatik Tamamlama**: Teklif oluştururken müşteri arama
3. **Güncelleme Senkronizasyonu**: Müşteri değişiklikleri otomatik olarak tekliflere yansır
4. **Güvenli Silme**: Müşteri silindiğinde teklif referansları temizlenir

## 🔍 Sorun Giderme

### Veritabanı Sorunları
- **Bağlantı Problemleri**: PostgreSQL servisinin çalıştığını doğrula
- **Şema Hataları**: Tüm SQL scriptlerinin doğru sırada çalıştırıldığından emin ol
- **İzin Sorunları**: Veritabanı kullanıcı izinlerini kontrol et

### Frontend Sorunları
- **Build Hataları**: node_modules'ü temizle ve bağımlılıkları tekrar yükle
- **API Bağlantısı**: Backend sunucusunun 3000 portunda çalıştığını doğrula
- **Route Sorunları**: Vite konfigürasyonu ve proxy ayarlarını kontrol et

### İçe/Dışa Aktarma Problemleri
- **Excel Formatı**: Excel dosyasının uygun başlıklara sahip olduğundan emin ol
- **Dil Seçimi**: İçe aktarımlar için dil seçimi zorunludur
- **Dosya Boyutu**: Büyük dosyalar timeout ayarlamaları gerektirebilir

### Kimlik Doğrulama Sorunları
- **Giriş Problemleri**: Veritabanı kullanıcı kayıtlarını kontrol et
- **Oturum Zaman Aşımı**: Oturum yönetimi konfigürasyonunu doğrula
- **Çıkış Yönlendirme**: Çıkıştan sonra uygun URL yönlendirmesini sağla

## 🔒 Güvenlik Özellikleri

- **Kullanıcı Kimlik Doğrulama**: Güvenli giriş/çıkış sistemi
- **Rol Tabanlı Erişim**: Admin ve kullanıcı rol ayrımı
- **Dosya Yükleme Güvenliği**: Doğrulama ile avatar yükleme
- **SQL Injection Koruması**: Parametreli sorgular
- **CORS Konfigürasyonu**: Uygun cross-origin istek işleme

## 📈 Performans Optimizasyonları

- **Lazy Loading**: İsteğe bağlı component yükleme
- **Veritabanı İndeksleme**: Optimize edilmiş veritabanı sorguları
- **Dosya Sıkıştırma**: Sıkıştırılmış statik varlıklar
- **Önbelleğe Alma**: İstemci ve sunucu tarafı önbelleğe alma
- **Bundle Optimizasyonu**: Minimize edilmiş JavaScript paketleri

## 🚀 Gelecek Geliştirmeler

- **Mobil Responsive Tasarım**: Gelişmiş mobil deneyim
- **Gelişmiş Raporlama**: Kapsamlı analitik dashboard
- **API Dokümantasyonu**: İnteraktif API dokümantasyonu
- **Birim Testleri**: Kapsamlı test paketi
- **Performans İzleme**: Uygulama performans takibi
- **Çoklu Kiracı Desteği**: Birden fazla organizasyon desteği
- **PDF Export**: Teklifler ve fiyat listeleri için PDF çıktı
- **Email Entegrasyonu**: Teklifleri email ile gönderme
- **Gelişmiş Filtreleme**: Daha detaylı arama ve filtreleme seçenekleri
- **Audit Log**: Kullanıcı işlemlerinin takibi

## 🛠️ Geliştirme

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
npm run lint   # ESLint kontrolü
```

### Veritabanı Yönetimi
```bash
# Database'i sıfırla
dropdb -U postgres pricelist-app-3
createdb -U postgres pricelist-app-3
psql -U postgres -d pricelist-app-3 -f setup_database.sql

# Backup al
pg_dump -U postgres pricelist-app-3 > backup.sql

# Backup'tan geri yükle
psql -U postgres -d pricelist-app-3 -f backup.sql
```

### Debug Modları
```bash
# Backend debug mod
DEBUG=* npm run dev

# Frontend verbose build
npm run build -- --verbose
```

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Harika özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

### Katkı Kuralları
- Kod kalitesi için ESLint kurallarına uyun
- Commit mesajlarını açıklayıcı yazın
- Yeni özellikler için dokümantasyon ekleyin
- Breaking change'ler için önceden bilgilendirin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE.md](LICENSE.md) dosyasına bakın.

## 👨‍💻 Geliştirici

**Önder Yılmaz**
- GitHub: [@onderxyilmaz](https://github.com/onderxyilmaz)

---

*Bu README, Fiyat Listesi ve Teklif Yönetim Uygulaması için kapsamlı dokümantasyon sağlar. Spesifik implementasyon detayları için kaynak koda ve satır içi yorumlara başvurun.*