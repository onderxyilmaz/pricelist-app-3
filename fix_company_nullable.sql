-- offers tablosundaki company kolonunu nullable yap
ALTER TABLE offers ALTER COLUMN company DROP NOT NULL;

\echo 'Company column is now nullable in offers table!';
