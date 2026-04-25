/**
 * 2. seviye bölüm metni: fiyat listesi rengi ile uyumlu, hafif gri-mavi miks
 * (1. seviye doğrudan pricelist.color kullanır)
 */
export function getSectionL2TextColor(baseHex) {
  if (!baseHex || typeof baseHex !== 'string') {
    return '#64748b';
  }
  let hex = baseHex.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length !== 6) {
    return '#64748b';
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const t = 0.52;
  const mx = 55;
  const my = 65;
  const mz = 80;
  const R = Math.round(r * t + mx * (1 - t));
  const G = Math.round(g * t + my * (1 - t));
  const B = Math.round(b * t + mz * (1 - t));
  return `rgb(${R},${G},${B})`;
}
