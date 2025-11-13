# Git Geçmişi Temizleme İşlemi

## ⚠️ ÖNEMLİ UYARI

Bu işlem git geçmişini yeniden yazacaktır. Eğer remote repository (GitHub, GitLab, vb.) kullanıyorsanız:

1. **Yedek alın**: Önce tüm değişikliklerinizi yedekleyin
2. **Force push gerekir**: Temizleme sonrası `git push --force` yapmanız gerekecek
3. **Takım çalışması**: Eğer başkalarıyla çalışıyorsanız, onları bilgilendirin

## Yapılacak İşlem

`backend/check_revisions.js` ve `backend/fix_revisions.js` dosyaları git geçmişinden tamamen silinecek.

Bu dosyalar hardcoded database şifreleri içerdiği için güvenlik riski oluşturuyor.

## Komutlar

```bash
# Dosyaları git geçmişinden sil
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/check_revisions.js backend/fix_revisions.js" --prune-empty --tag-name-filter cat -- --all

# Alternatif olarak (daha modern, eğer kuruluysa):
# git filter-repo --path backend/check_revisions.js --path backend/fix_revisions.js --invert-paths

# Geçici dosyaları temizle
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Remote'a force push (DİKKATLİ OLUN!)
# git push origin --force --all
# git push origin --force --tags
```

## Geri Alma

Eğer bir sorun olursa:
```bash
git reset --hard refs/original/refs/heads/main
```
