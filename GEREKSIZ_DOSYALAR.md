# Gereksiz Dosyalar Listesi

Bu dosya, projede tespit edilen gereksiz veya kullanılmayan dosyaları içermektedir.

## ✅ Silinen Dosyalar

Aşağıdaki dosyalar silinmiştir:

1. ✅ **`backend/check_revisions.js`** - Silindi (hardcoded database şifresi içeriyordu)
2. ✅ **`backend/fix_revisions.js`** - Silindi (hardcoded database şifresi içeriyordu)
3. ✅ **`backend/src/middleware/auth.js`** - Silindi (kullanılmıyordu, `authMiddleware.js` kullanılıyor)
4. ✅ **`backend/migrations/`** - Silindi (boş klasördü)
5. ✅ **`frontend/src/assets/react.svg`** - Silindi (kullanılmıyordu)

---

## 🔵 Kalan Dosyalar

### Root - Utility Script
**`the_copy_tool.ps1`**
   - Projeye özgü değil, genel utility script
   - Proje koduna dahil değil
   - ⚠️ **KALDI** (kullanıcı isteği üzerine)

### Frontend - Gereksiz Re-export Dosyaları
Bu dosyalar sadece re-export yapıyor, direkt import edilebilir:

7. **`frontend/src/pages/Offers/components/OffersHeader/index.js`**
   - Sadece `export { default } from './OffersHeader'` içeriyor
   - Direkt `./OffersHeader` import edilebilir
   - ⚠️ **İSTEĞE BAĞLI SİLİNEBİLİR** (ama mevcut import'ları güncellemek gerekir)

8. **`frontend/src/pages/Offers/components/OffersSearch/index.js`**
   - Sadece `export { default } from './OffersSearch'` içeriyor
   - ⚠️ **İSTEĞE BAĞLI SİLİNEBİLİR**

9. **`frontend/src/pages/Offers/components/OffersTable/index.js`**
   - Sadece `export { default } from './OffersTable'` içeriyor
   - ⚠️ **İSTEĞE BAĞLI SİLİNEBİLİR**

10. **`frontend/src/pages/Offers/components/PreviewModal/index.js`**
    - Sadece `export { default } from './PreviewModal'` içeriyor
    - ⚠️ **İSTEĞE BAĞLI SİLİNEBİLİR**

11. **`frontend/src/pages/Offers/components/OfferWizard/index.js`**
    - Sadece `export { default } from './OfferWizard'` içeriyor
    - ⚠️ **İSTEĞE BAĞLI SİLİNEBİLİR**

---

## 🟢 Test Dosyaları (İsteğe Bağlı)

Test dosyaları package.json'da tanımlı ama aktif kullanılmıyor gibi görünüyor. Eğer test yazmayı planlamıyorsanız:

### Backend Test Dosyaları
12. **`backend/src/tests/auth.test.js`**
13. **`backend/src/tests/pricelist.test.js`**
14. **`backend/src/tests/validation.test.js`**
15. **`backend/jest.config.js`**

### Frontend Test Dosyaları
16. **`frontend/src/pages/Login/Login.test.jsx`**
17. **`frontend/src/pages/Register/Register.test.jsx`**
18. **`frontend/src/test/setup.js`**

⚠️ **NOT**: Eğer gelecekte test yazmayı planlıyorsanız, bu dosyaları tutabilirsiniz.

---

## 🔵 İsimlendirme Tutarsızlığı (Düzeltilebilir)

19. **`frontend/src/pages/Offers/OffersTemp.module.css`**
    - Dosya adı "Temp" içeriyor ama aktif kullanılıyor
    - `index.jsx` içinde import ediliyor
    - ⚠️ **İSİM DEĞİŞTİRİLEBİLİR**: `Offers.module.css` olarak yeniden adlandırılabilir

---

## 📋 Özet

### ✅ Silinen Dosyalar:
- ✅ `backend/check_revisions.js` - Silindi
- ✅ `backend/fix_revisions.js` - Silindi
- ✅ `backend/src/middleware/auth.js` - Silindi
- ✅ `backend/migrations/` - Silindi (boş klasör)
- ✅ `frontend/src/assets/react.svg` - Silindi

### 🔵 Kalan Dosyalar:
- `the_copy_tool.ps1` - Kullanıcı isteği üzerine kaldı

### İsteğe Bağlı (Re-export dosyaları):
- `frontend/src/pages/Offers/components/*/index.js` (5 dosya)

### Test Dosyaları (İsteğe Bağlı):
- Backend test dosyaları (4 dosya)
- Frontend test dosyaları (3 dosya)

### İsimlendirme:
- `OffersTemp.module.css` → `Offers.module.css` olarak yeniden adlandırılabilir

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Hardcoded Credentials**: `check_revisions.js` ve `fix_revisions.js` dosyaları silindi. Eğer bu dosyalar git'e commit edildiyse, git geçmişinden de temizlenmesi önerilir (git history'den kaldırılmalı).

2. **Sentry**: `backend/src/utils/sentry.js` dosyası `server.js` içinde kullanılıyor, bu yüzden **SİLİNMEMELİ**.

3. **App.css**: `frontend/src/App.css` dosyası `App.jsx` içinde kullanılıyor, bu yüzden **SİLİNMEMELİ**.

4. **Re-export Dosyaları**: `index.js` dosyaları genellikle modül yapısını organize etmek için kullanılır. İsteğe bağlı olarak tutuldu, silmek isterseniz tüm import'ları güncellemek gerekir.

5. **Test Dosyaları**: Test dosyaları isteğe bağlı olarak tutuldu. Gelecekte test yazmayı planlıyorsanız bu dosyaları kullanabilirsiniz.

