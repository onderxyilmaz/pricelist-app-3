# Docker ile Production Çalıştırma (Karadağ Elektronik)

Uygulama **backend + frontend + PostgreSQL** tek compose ile production olarak çalıştırılabilir.

## Gereksinimler

- Docker ve Docker Compose
- (İsteğe bağlı) Domain veya sunucu IP’si

## Hızlı Başlangıç

```bash
# 1. Proje kökünde .env oluştur
cp .env.example .env

# 2. .env içinde mutlaka değiştirin:
#    - DB_PASSWORD: güçlü bir şifre
#    - JWT_SECRET: en az 32 karakter rastgele string
#    (Firma domain kullanıyorsanız CORS_ORIGIN ve FRONTEND_URL’i güncelleyin)

# 3. Build ve çalıştır
docker compose up -d --build

# 4. Uygulama:
#    - Tarayıcı: http://localhost (veya sunucu IP / domain)
#    - Backend API (opsiyonel): http://localhost:3001
```

## Servisler

| Servis    | Port (varsayılan) | Açıklama                          |
|-----------|-------------------|-----------------------------------|
| Frontend  | 80                | Nginx, SPA + /api ve /uploads proxy |
| Backend   | 3001              | Fastify API                       |
| PostgreSQL| 55432             | Veritabanı (host üzerinden erişim) |

**Not:** Kullanıcılar sadece **80** portuna bağlanır. Nginx, `/api` ve `/uploads` isteklerini backend’e yönlendirir; ayrıca backend portunu dışarı açmak zorunlu değildir.

## Ortam Değişkenleri (.env)

| Değişken           | Açıklama |
|--------------------|----------|
| `DB_PASSWORD`      | PostgreSQL şifresi (mutlaka değiştirin) |
| `JWT_SECRET`       | JWT imzası için en az 32 karakter (mutlaka değiştirin) |
| `CORS_ORIGIN`      | İzin verilen origin’ler (virgülle ayrılmış). Firma adresi: `https://pricelist.sirketadi.com` |
| `FRONTEND_URL`     | Frontend adresi (e-posta linkleri vb. için). Firma: `https://pricelist.sirketadi.com` |
| `VITE_API_BASE_URL` | Production’da **boş** bırakın (Nginx proxy kullanılır). Sadece ayrı test için `http://localhost:3001` kullanın. |

## Kalıcı Veri

- **PostgreSQL:** `postgres_data` volume (veritabanı kalıcı).
- **Backend uploads:** `backend_uploads` volume (avatar ve firma logoları kalıcı).

Container silinse bile bu volume’lar durur; `docker compose down` ile volume’lar silinmez.

## İlk Kurulum Sonrası

- Uygulama ilk açıldığında **kayıt** sayfası gelir; ilk kayıt olan kullanıcı **Super Admin** olur.
- Veritabanı şeması `setup_database.sql` ile container ilk ayağa kalktığında otomatik uygulanır.

## Yararlı Komutlar

```bash
# Logları izle
docker compose logs -f

# Sadece backend log
docker compose logs -f backend

# Yeniden build (kod değişikliği sonrası)
docker compose up -d --build

# Durdur
docker compose down

# Volume’lar dahil tamamen silmek (dikkat: veritabanı ve uploads gider)
docker compose down -v
```

## Güvenlik Özeti

1. **DB_PASSWORD** ve **JWT_SECRET** production’da mutlaka güçlü ve benzersiz olsun.
2. Mümkünse **HTTPS** kullanın (ters proxy: Nginx/Traefik sunucuda, compose’daki frontend portu 80 veya 443’e bağlanabilir).
3. Production’da **CORS_ORIGIN** ve **FRONTEND_URL**’i gerçek domain ile sınırlayın.
4. İsterseniz sadece 80’i açıp 3001’i dışarıya kapatın (Nginx zaten proxy yapıyor).

Bu ayarlarla uygulama firmada (Karadağ Elektronik) Docker üzerinde production olarak çalıştırılmaya hazırdır.
