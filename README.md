# Pricelist App 3

Modern bir fiyat listesi yönetim uygulaması.

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

## Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üstü)
- PostgreSQL
- npm veya yarn

### Veritabanı Kurulumu
1. PostgreSQL'de `pricelist-app-3` isimli veritabanı oluşturun
2. `backend/database_schema.sql` dosyasını çalıştırın

### Backend Kurulumu
```bash
cd backend
npm install
npm run dev
```

### Frontend Kurulumu
```bash
cd frontend
npm install
npm start
```

## Özellikler
- ✅ Fiyat listesi oluşturma, düzenleme, silme
- ✅ Ürün ekleme, düzenleme, silme
- ✅ Farklı para birimleri desteği
- ✅ Responsive tasarım
- ✅ Türkçe arayüz

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

## Geliştirme
- Backend: http://localhost:3001
- Frontend: http://localhost:3000