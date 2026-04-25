#!/usr/bin/env bash
# Sadece public.users verisini kaynak veritabanından hedefe kopyalar (Docker / uzak sunucu).
# Gereksinim: pg_dump ve psql (postgresql-client) kurulu; hedefde tablo zaten mevcut (setup_database.sql / init).
#
# --- Örnek 1: Eski yedek canlı bir host'ta, yeni hedef Docker (sunucuda) ---
#   export SOURCE_URI="postgresql://KULLANICI:SIFRE@eski-sunucu:5432/eski_db_adi"
#   export TARGET_URI="postgresql://postgres:DOCKER_SIFRE@127.0.0.1:55432/pricelist_app_3"
#   CLEAR_TARGET_USERS=1 ./scripts/copy_users_to_target_db.sh
#
# Docker içinden (host'ta 55432 map ise):
#   export TARGET_URI="postgresql://postgres:${DB_PASSWORD}@host.docker.internal:55432/${DB_NAME}"
#   (Linux'ta gerekirse 127.0.0.1:55432 kullanın.)
#
# --- Örnek 2: Yedek sadece .dump (özel) dosyası ise, önce geçici DB'ye açıp ---
#   createdb -h ... restore_test && pg_restore -d restore_test yedek.dump
#   export SOURCE_URI="postgresql://.../restore_test"
#   export TARGET_URI="postgresql://.../pricelist_app_3"
#   CLEAR_TARGET_USERS=1 ./scripts/copy_users_to_target_db.sh
#   dropdb ... restore_test
#
# Düz .sql tüm yedek: önce ayrı bir veritabanına restore, sonra yukarıdaki gibi SOURCE_URI ile bu script.
#
# CLEAR_TARGET_USERS=1: refresh_tokens + users bosaltilir. TRUNCATE ... CASCADE KULLANILMAZ; pricelists/offers
# satiri varsa ve created_by duser id ise TRUNCATE basarisiz olur; o zaman o FK'lari NULL yapin veya
# o tablolarin satirlarini once temizleyin.

set -euo pipefail

SOURCE_URI=${SOURCE_URI:?Ortam SOURCE_URI tanimi gerekir}
TARGET_URI=${TARGET_URI:?Ortam TARGET_URI tanimi gerekir}
DUMP=$(mktemp)
trap 'rm -f "$DUMP"' EXIT

echo "Kaynak: users verisi cekiliyor..."
pg_dump "$SOURCE_URI" -t public.users --data-only --no-owner --no-privileges -f "$DUMP"

if [[ "${CLEAR_TARGET_USERS:-0}" == "1" ]]; then
  echo "Hedef: refresh_tokens + users temizleniyor..."
  psql "$TARGET_URI" -v ON_ERROR_STOP=1 -c "DELETE FROM public.refresh_tokens; TRUNCATE public.users RESTART IDENTITY;"
fi

echo "Hedef: veri yukleniyor..."
psql "$TARGET_URI" -v ON_ERROR_STOP=1 -f "$DUMP"

echo "Hedef: users_id_seq sira degeri guncelleniyor..."
psql "$TARGET_URI" -v ON_ERROR_STOP=1 -c \
  "SELECT setval(
    pg_get_serial_sequence('public.users', 'id'),
    COALESCE((SELECT MAX(id) FROM public.users), 1),
    true
  );"

echo "Tamam. Kullanici sayisi:"
psql "$TARGET_URI" -t -c "SELECT COUNT(*) FROM public.users;"
