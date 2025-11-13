# Docker Deployment Guide

Bu dosya, uygulamayı Docker ile production ortamında çalıştırmak için gereken bilgileri içerir.

## Hızlı Başlangıç

### 1. Environment Variables Ayarlama

`.env.example` dosyasını kopyalayın ve `.env` olarak kaydedin:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve özellikle şu değerleri değiştirin:
- `DB_PASSWORD`: Güçlü bir PostgreSQL şifresi
- `JWT_SECRET`: En az 32 karakterlik güçlü bir secret key
- `CORS_ORIGIN`: Frontend URL'iniz (örn: `https://yourdomain.com`)
- `FRONTEND_URL`: Frontend URL'iniz
- `VITE_API_BASE_URL`: Backend API URL'iniz

### 2. Docker Compose ile Çalıştırma

```bash
# Tüm servisleri build et ve çalıştır
docker-compose up -d --build

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down

# Servisleri durdur ve volume'ları sil (DİKKAT: Veritabanı verileri silinir!)
docker-compose down -v
```

### 3. Servis Durumunu Kontrol Etme

```bash
# Tüm servislerin durumunu kontrol et
docker-compose ps

# Belirli bir servisin loglarını görüntüle
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Health check durumunu kontrol et
docker-compose ps
```

## Servisler

### PostgreSQL Database
- **Port**: 5432 (varsayılan)
- **Container**: `pricelist-db`
- **Volume**: `postgres_data` (kalıcı veri saklama)
- **Initialization**: `setup_database.sql` otomatik çalıştırılır

### Backend API
- **Port**: 3001 (varsayılan)
- **Container**: `pricelist-backend`
- **Health Check**: `/health` endpoint
- **Uploads**: `backend/uploads` klasörü volume olarak mount edilir

### Frontend
- **Port**: 80 (varsayılan)
- **Container**: `pricelist-frontend`
- **Web Server**: Nginx
- **Build**: Production build (Vite)

## Port Yapılandırması

Varsayılan portlar:
- **Frontend**: 80
- **Backend**: 3001
- **PostgreSQL**: 5432

Portları değiştirmek için `.env` dosyasında:
```env
FRONTEND_PORT=8080
BACKEND_PORT=3001
DB_PORT=5432
```

## Veritabanı Yönetimi

### Backup Alma

```bash
# Veritabanı backup'ı al
docker-compose exec postgres pg_dump -U postgres pricelist_app_3 > backup.sql

# Veya volume'dan direkt backup
docker run --rm -v pricelist-app-3_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Backup'tan Geri Yükleme

```bash
# SQL dosyasından geri yükle
docker-compose exec -T postgres psql -U postgres pricelist_app_3 < backup.sql
```

### Veritabanını Sıfırlama

```bash
# Servisleri durdur ve volume'ları sil
docker-compose down -v

# Tekrar başlat (setup_database.sql otomatik çalışır)
docker-compose up -d
```

## Production Deployment

### 1. Güvenlik Kontrol Listesi

- [ ] `.env` dosyasında güçlü şifreler kullanın
- [ ] `JWT_SECRET` için en az 32 karakterlik rastgele bir değer kullanın
- [ ] `CORS_ORIGIN` ve `FRONTEND_URL` değerlerini production domain'inize göre ayarlayın
- [ ] HTTPS kullanın (reverse proxy ile Nginx/Traefik)
- [ ] Firewall kurallarını yapılandırın
- [ ] Düzenli backup alın

### 2. Reverse Proxy ile HTTPS

Nginx reverse proxy örneği:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Environment Variables (Production)

Production için `.env` dosyası örneği:

```env
# Database
DB_NAME=pricelist_app_3
DB_USER=postgres
DB_PASSWORD=very-strong-password-here
DB_PORT=5432

# Backend
BACKEND_PORT=3001
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-change-this
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Frontend
FRONTEND_PORT=80
VITE_API_BASE_URL=https://yourdomain.com

# Production
NODE_ENV=production
```

## Troubleshooting

### Backend başlamıyor

```bash
# Backend loglarını kontrol et
docker-compose logs backend

# Backend container'ına gir
docker-compose exec backend sh

# Health check'i manuel test et
curl http://localhost:3001/health
```

### Frontend build hatası

```bash
# Frontend build loglarını kontrol et
docker-compose logs frontend

# Frontend container'ını yeniden build et
docker-compose build --no-cache frontend
```

### Veritabanı bağlantı hatası

```bash
# PostgreSQL loglarını kontrol et
docker-compose logs postgres

# PostgreSQL container'ına gir
docker-compose exec postgres psql -U postgres -d pricelist_app_3

# Veritabanı durumunu kontrol et
docker-compose exec postgres pg_isready -U postgres
```

### Port çakışması

Eğer portlar kullanılıyorsa, `.env` dosyasında portları değiştirin:

```env
FRONTEND_PORT=8080
BACKEND_PORT=3002
DB_PORT=5433
```

## Güncelleme

### Uygulamayı Güncelleme

```bash
# En son kodu çek
git pull

# Servisleri durdur
docker-compose down

# Yeni image'ları build et
docker-compose build --no-cache

# Servisleri başlat
docker-compose up -d

# Logları kontrol et
docker-compose logs -f
```

### Sadece Kod Güncellemesi (Image'ları yeniden build etmeden)

```bash
# Servisleri restart et
docker-compose restart
```

## Monitoring

### Resource Kullanımı

```bash
# Container resource kullanımını görüntüle
docker stats

# Belirli container'ları izle
docker stats pricelist-backend pricelist-frontend pricelist-db
```

### Log Yönetimi

```bash
# Tüm logları görüntüle
docker-compose logs

# Son 100 satırı görüntüle
docker-compose logs --tail=100

# Belirli bir servisin loglarını filtrele
docker-compose logs backend | grep ERROR
```

## Cleanup

### Kullanılmayan Image'ları Temizleme

```bash
# Kullanılmayan image'ları sil
docker image prune -a

# Kullanılmayan volume'ları sil
docker volume prune
```

### Tam Temizlik (DİKKAT: Tüm veriler silinir!)

```bash
# Servisleri durdur ve volume'ları sil
docker-compose down -v

# Kullanılmayan tüm Docker kaynaklarını temizle
docker system prune -a --volumes
```

## Notlar

- **Volume'lar**: PostgreSQL verileri `postgres_data` volume'unda saklanır. Bu volume silinirse tüm veriler kaybolur!
- **Uploads**: Backend uploads klasörü host'ta `backend/uploads` olarak mount edilir
- **Health Checks**: Tüm servislerde health check mekanizması vardır
- **Network**: Tüm servisler `pricelist-network` adlı bridge network'ünde çalışır

