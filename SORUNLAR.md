# Sorunlar ve Çözüm Önerileri

Bu dosya, projede tespit edilen sorunları ve çözüm önerilerini içermektedir.

---

## 🔴 Rate Limit Hatası (429 Too Many Requests)

### Sorun Tanımı

Backend'de rate limit aşıldığında frontend'de hata oluşuyor ve kullanıcıya anlamlı bir mesaj gösterilmiyor.

**Hata Mesajı:**
```
Rate limit exceeded. You have made 100 requests in 15 minutes. Please try again later.
```

**Status Code:** `429 Too Many Requests`

---

### Backend Rate Limit Ayarları

**Dosya:** `backend/server.js` (Satır 32-52)

```javascript
fastify.register(require('@fastify/rate-limit'), {
  global: true,
  max: 100,              // Maksimum 100 istek
  timeWindow: '15 minutes', // 15 dakika içinde
  cache: 10000,          // Cache up to 10,000 different client IPs
  // allowList: ['127.0.0.1'], // Remove for testing - in production, add trusted IPs here
  redis: null,           // Can be configured with Redis for distributed systems
  skipOnError: true,     // Skip rate limiting if there's an error
  keyGenerator: (request) => {
    // Use IP address as key
    return request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
  },
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. You have made ${context.max} requests in ${context.after}. Please try again later.`
    };
  }
});
```

**Mevcut Limit:**
- **100 istek** / **15 dakika** / **IP adresi başına**

---

### Sorunun Nedenleri

#### 1. Frontend'de 429 Hatası İçin Özel İşlem Yok

**Dosya:** `frontend/src/utils/api.js`

- ✅ 401 (Unauthorized) için özel işlem var (token refresh)
- ✅ 403 (Forbidden) için özel işlem var
- ✅ 404 (Not Found) için özel işlem var
- ❌ **429 (Too Many Requests) için özel işlem YOK**

**Mevcut Durum:**
- 429 hatası yakalanıyor ama kullanıcıya anlamlı bir mesaj gösterilmiyor
- Hata Sentry'ye gönderiliyor ve `Promise.reject` ile fırlatılıyor
- Kullanıcı sadece genel hata mesajları görüyor (örn: "Dashboard verileri yüklenemedi")

#### 2. Token Refresh Mekanizması

**Dosya:** `frontend/src/utils/api.js` (Satır 77-155)

- 401 hatası geldiğinde otomatik token refresh deneniyor
- Refresh başarısız olursa tekrar login deneniyor
- Bu döngü istek sayısını artırabilir

#### 3. Development Ortamında Yoğun Test

- 15 dakikada 100+ istek yapılmış
- Sayfa yenilemeleri, form gönderimleri, otomatik refresh'ler
- Development sırasında sürekli test yapılması

#### 4. IP Bazlı Takip

- `127.0.0.1` (localhost) için `allowList` yorum satırında
- Development'ta localhost allowList'e eklenmemiş
- Her localhost isteği rate limit'e dahil ediliyor

---

### Çözüm Önerileri

#### ✅ Öncelik 1: Frontend'de 429 Hatası İçin Özel İşlem Ekle

**Dosya:** `frontend/src/utils/api.js`

```javascript
// Handle 429 Too Many Requests (Rate Limit)
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'] || 15; // Default 15 minutes
  const message = error.response.data?.message || 'Çok fazla istek yapıldı. Lütfen bir süre sonra tekrar deneyin.';
  
  NotificationService.error(
    'Rate Limit Aşıldı',
    `${message} (${retryAfter} dakika sonra tekrar deneyebilirsiniz)`
  );
  
  logger.warn('Rate limit exceeded:', {
    endpoint: error.config?.url,
    retryAfter
  });
  
  return Promise.reject(error);
}
```

**Faydaları:**
- Kullanıcıya anlamlı hata mesajı gösterilir
- Ne zaman tekrar deneyebileceği bilgisi verilir
- Gereksiz retry'lar önlenir

---

#### ✅ Öncelik 2: Development Ortamı İçin AllowList Ekle

**Dosya:** `backend/server.js`

```javascript
fastify.register(require('@fastify/rate-limit'), {
  global: true,
  max: 100,
  timeWindow: '15 minutes',
  cache: 10000,
  allowList: process.env.NODE_ENV === 'development' 
    ? ['127.0.0.1', '::1', 'localhost'] 
    : [], // Production'da boş bırak
  // ... diğer ayarlar
});
```

**Alternatif:** Environment variable ile kontrol

```javascript
allowList: process.env.ALLOWED_IPS 
  ? process.env.ALLOWED_IPS.split(',') 
  : [],
```

**`.env` dosyasına ekle:**
```
ALLOWED_IPS=127.0.0.1,::1,localhost
```

**Faydaları:**
- Development'ta rate limit sorunu yaşanmaz
- Production'da güvenlik korunur
- Esnek yapılandırma

---

#### ✅ Öncelik 3: Development İçin Rate Limit Değerlerini Artır

**Dosya:** `backend/server.js`

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

fastify.register(require('@fastify/rate-limit'), {
  global: true,
  max: isDevelopment ? 1000 : 100,  // Development: 1000, Production: 100
  timeWindow: isDevelopment ? '1 minute' : '15 minutes', // Development: 1 dk, Production: 15 dk
  // ... diğer ayarlar
});
```

**Faydaları:**
- Development'ta daha rahat test yapılabilir
- Production'da güvenlik korunur

---

#### ✅ Öncelik 4: Token Refresh Mekanizmasını Optimize Et

**Dosya:** `frontend/src/utils/api.js`

**Mevcut Sorun:**
- Her 401 hatasında token refresh deneniyor
- Refresh başarısız olursa tekrar login deneniyor
- Bu döngü istek sayısını artırabilir

**Öneri:**
- Token refresh'i sadece belirli durumlarda yap
- Refresh başarısız olursa hemen login sayfasına yönlendir
- Gereksiz retry'ları önle

---

#### ✅ Öncelik 5: Retry Mekanizması Ekle (429 için)

**Dosya:** `frontend/src/utils/api.js`

```javascript
// Handle 429 Too Many Requests (Rate Limit)
if (error.response?.status === 429) {
  const retryAfter = parseInt(error.response.headers['retry-after']) || 15 * 60; // seconds
  
  // Retry after specified time
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(api(originalRequest));
    }, retryAfter * 1000);
  });
}
```

**Not:** Bu yaklaşım kullanıcı deneyimini bozabilir, bu yüzden dikkatli kullanılmalı.

---

### Test Senaryoları

1. **Rate Limit Testi:**
   - 15 dakikada 100+ istek yap
   - 429 hatasının geldiğini doğrula
   - Frontend'de anlamlı mesaj gösterildiğini kontrol et

2. **Development AllowList Testi:**
   - Development modunda localhost'tan istek yap
   - Rate limit'in uygulanmadığını doğrula

3. **Token Refresh Testi:**
   - Token süresi dolduğunda refresh mekanizmasını test et
   - Gereksiz istek yapılmadığını kontrol et

---

### İlgili Dosyalar

- `backend/server.js` - Rate limit yapılandırması
- `frontend/src/utils/api.js` - API interceptor'ları ve hata yönetimi
- `.env` - Environment variables (allowList için)

---

### Notlar

- Rate limiting production'da önemli bir güvenlik özelliğidir
- Development'ta rahat test için ayarlar gevşetilebilir
- Frontend'de kullanıcıya anlamlı mesajlar gösterilmeli
- Rate limit aşıldığında kullanıcı bilgilendirilmeli

---

**Son Güncelleme:** Rate limit hatası analizi tamamlandı
**Durum:** 🔴 Çözüm bekliyor

