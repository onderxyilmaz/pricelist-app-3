# Başlık
Write-Host "`n=========== The Copy Tool by UnderSpeed v2.0 ===========" -ForegroundColor Cyan

# Kaynak dizin = script'in bulunduğu dizin
$kaynak = $PSScriptRoot
$kaynakUstKlasor = Split-Path $kaynak -Parent
$kaynakDizinAdi = Split-Path $kaynak -Leaf

# Dinamik tarih + saat (örnek: 03_08_25_22_42)
$tarihSaat = Get-Date -Format "dd_MM_yy_HH_mm"

# Hedef klasör adı oluştur
$klasorAdi = "$kaynakDizinAdi" + "_$tarihSaat"
$hedef = Join-Path $kaynakUstKlasor $klasorAdi

# Aynı isim varsa -1, -2, ... ekle
$sayi = 1
$orijinalHedef = $hedef
while (Test-Path $hedef) {
    $hedef = "${orijinalHedef}-$sayi"
    $sayi++
}

# Kullanıcıya seçim sun
Write-Host "`n🗂️  Önerilen hedef klasör:`n$hedef`n" -ForegroundColor Yellow
$onay = Read-Host "Devam etmek için: 'e'=önerilen, 'u'=elle gir, 'h'=iptal"

if ($onay -eq "e") {
    # önerilen $hedef kullanılacak
}
elseif ($onay -eq "u") {
    do {
        $hedef = Read-Host "Lütfen hedef klasör yolunu tam olarak gir (örnek: D:\yedekler\proje_backup)"
        if (Test-Path $hedef) {
            $dolu = (Get-ChildItem -Path $hedef -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
            if ($dolu) {
                Write-Host "❗ Bu klasör zaten var ve dolu. Farklı bir klasör gir." -ForegroundColor Red
                $hedef = $null
            }
        }
    } while (-not $hedef)
}
elseif ($onay -eq "h") {
    Write-Host "`n❌ İşlem iptal edildi." -ForegroundColor DarkYellow
    exit
}
else {
    Write-Host "`n⚠️ Geçersiz giriş yapıldı, işlem yapılmadı." -ForegroundColor DarkRed
    exit
}

# Kopyalama başlıyor
Write-Host "`n🚀 Kopyalama işlemi başladı..." -ForegroundColor Green

$dosyalar = Get-ChildItem -Path $kaynak -Recurse -Force -File |
    Where-Object { $_.FullName -notmatch '\\node_modules(\\|$)' }

$toplam = $dosyalar.Count
$sayac = 0

foreach ($dosya in $dosyalar) {
    $hedefYol = $dosya.FullName -replace [regex]::Escape($kaynak), $hedef
    $hedefKlasor = Split-Path $hedefYol -Parent

    if (-not (Test-Path $hedefKlasor)) {
        New-Item -ItemType Directory -Path $hedefKlasor -Force | Out-Null
    }

    if (-not (Test-Path $hedefYol)) {
        Copy-Item -Path $dosya.FullName -Destination $hedefYol -Force
    }

    $sayac++
    $yuzde = [math]::Round(($sayac / $toplam) * 100)
    Write-Progress -Activity "Kopyalanıyor..." -Status "$yuzde% tamamlandı" -PercentComplete $yuzde
}

Write-Host "`n✅ Kopyalama tamamlandı: $hedef" -ForegroundColor Green
Write-Host "`n📦 The Copy Tool by UnderSpeed başarıyla çalıştı." -ForegroundColor Cyan
