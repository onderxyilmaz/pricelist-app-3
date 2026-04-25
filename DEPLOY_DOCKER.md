# Docker ile dağıtım ve registry’ye gönderme

Proje kökünde `docker-compose.yml` ile **PostgreSQL**, **backend (Fastify)** ve **frontend (Nginx + statik Vite build)** ayağa kalkar. Veritabanı ilk açılışta `setup_database.sql` ile kurulur.

## Gereksinimler

- Docker Engine 24+ ve Docker Compose V2 (`docker compose`)
- (Registry’ye push için) Docker Hub, GitHub Container Registry veya başka bir container registry hesabı

## 1. Ortam dosyası

```bash
cp env.docker.example .env
# .env içinde özellikle DB_PASSWORD, JWT_SECRET, CORS_ORIGIN, FRONTEND_URL düzenleyin
```

`CORS_ORIGIN` ve `FRONTEND_URL`, kullanıcıların tarayıcıdan gördüğü site adresiyle (ör. `https://fiyat.sirketiniz.com`) uyumlu olmalı.

## 2. Yerelde (veya CI’da) imaj üretmek

Proje **kök dizininde**:

```bash
docker compose build --no-cache
```

Sadece belirli servisler:

```bash
docker compose build backend frontend
```

## 3. Ubuntu (AMD64) için mimari notu

Geliştirme makinesi ARM (Apple Silicon) ise, sunucuya göndereceğiniz imajı **linux/amd64** olarak üretin:

```bash
docker buildx create --name multi --use 2>/dev/null || docker buildx use multi
docker buildx build --platform linux/amd64 -f backend/Dockerfile -t pricelist-app-3-backend:latest ./backend --load
docker buildx build --platform linux/amd64 -f frontend/Dockerfile -t pricelist-app-3-frontend:latest ./frontend --load
```

Veya tek seferde compose ile (Buildx, compose destekliyorsa):

```bash
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build
```

## 4. Registry’ye göndermek (Docker Hub örneği)

1. Giriş:

```bash
docker login
# veya: docker login docker.io
```

2. `.env` içine tam imaj adlarını yazın (kendi kullanıcı / organizasyon adınızla):

```env
BACKEND_IMAGE=docker.io/KULLANICI_ADI/pricelist-backend:v1.0.0
FRONTEND_IMAGE=docker.io/KULLANICI_ADI/pricelist-frontend:v1.0.0
```

3. Yeniden build (imaj adları .env’deki gibi etiketlenir) ve push:

```bash
docker compose build backend frontend
docker compose push backend frontend
```

> `postgres` resmi imajı zaten `docker.io` üzerinde; sadece kendi uygulama imajlarını push edersiniz.

**GitHub Container Registry (ghcr.io) örneği:**

```bash
echo $CR_PAT | docker login ghcr.io -u GITHUB_KULLANICI --password-stdin
```

```env
BACKEND_IMAGE=ghcr.io/ORGVEYA_KULLANICI/pricelist-backend:v1.0.0
FRONTEND_IMAGE=ghcr.io/ORGVEYA_KULLANICI/pricelist-frontend:v1.0.0
```

## 5. Sunucuda (Ubuntu) çalıştırmak

1. Repoyu klonlayın veya sadece `docker-compose.yml`, `setup_database.sql`, `.env` ve gerekirse `env.docker.example`’ı kopyalayın.
2. `.env` doldurulmuş olsun; registry kullanıyorsanız `BACKEND_IMAGE` / `FRONTEND_IMAGE` aynı etiketlerle ayarlı olsun.
3. İmajlar registry’deyse **pull** (push ettiğiniz etiketlerle):

```bash
docker compose pull backend frontend
```

4. Tüm yığın:

```bash
docker compose up -d
```

5. Loglar: `docker compose logs -f --tail=100`

6. Durdurma: `docker compose down` (volumes silmeden: veritabanı kalır)

**Sıfırdan DB hacmiyle birlikte temiz kurulum** (dikkat: tüm veri silinir):

```bash
docker compose down -v
docker compose up -d
```

## 6. API URL (frontend)

Docker içinde Nginx, `/api` ve `/uploads` isteklerini `backend:3001`e yönlendirir. `VITE_API_BASE_URL` genelde **boş bırakılır**; istemci aynı origin üzerinden `/api` kullanır. Özel ayrı API domaini kullanacaksanız frontend build’inde `VITE_API_BASE_URL` set edilmelidir (`docker-compose.yml` `args` bölümü).

## 7. Kullanışlı komutlar

| Amaç | Komut |
|------|--------|
| Yeniden build + ayağa kaldır | `docker compose up -d --build` |
| Sadece backend kodu değişti | `docker compose up -d --build backend` |
| İmaj boyutlarını görmek | `docker images \| grep pricelist` |
| Ağ testi (backend) | `curl -s http://localhost:3001/health` (port map varsa) |

## Özet: “Docker’a göndermek” için en kısa yol

```bash
cp env.docker.example .env
# .env: BACKEND_IMAGE, FRONTEND_IMAGE = docker.io/hesap/adi:etiket
docker login
docker compose build backend frontend
docker compose push backend frontend
```

Sunucuda: `.env` aynı imaj adları, sonra `docker compose pull && docker compose up -d`.
