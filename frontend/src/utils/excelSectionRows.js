/**
 * Fiyat listesi Excel'inde: N---Başlık / N-M---Alt başlık satırlarını tespit ve durum.
 * Örnek: 1---Yangın..., 1-1---Flexes..., 2---IQ8, 3-1---...
 */

export const SECTION_ROW_REGEX = /^(\d+(?:-\d+)*)---\s*(.+)$/;

export function tryParseSectionLine(cellValue) {
  if (cellValue === undefined || cellValue === null) return null;
  const s = String(cellValue).trim();
  if (!s) return null;
  const m = s.match(SECTION_ROW_REGEX);
  if (!m) return null;
  return { numPart: m[1], title: m[2].trim() };
}

export function createSectionState() {
  return {
    lastL1ByRoot: {},
    currentL1: null,
    currentL2: null
  };
}

/**
 * Bölüm satırı tespit edildikten sonra state'i günceller; ürün satırı için yok.
 */
export function applySectionToState(state, { numPart, title }) {
  const next = {
    lastL1ByRoot: { ...state.lastL1ByRoot },
    currentL1: state.currentL1,
    currentL2: state.currentL2
  };
  const segments = numPart.split('-');
  const root = segments[0];
  if (segments.length === 1) {
    next.lastL1ByRoot[root] = title;
    next.currentL1 = title;
    next.currentL2 = null;
  } else {
    next.currentL1 = next.lastL1ByRoot[root] || null;
    next.currentL2 = title;
  }
  return next;
}

/**
 * Veri satırı dosyada tamamen boş mu? (bölüm veya ürün işlenmeden önce)
 * Tüm hücreler boş, sadece boşluk veya yok sayılır.
 */
export function isRowCompletelyEmpty(row) {
  if (!row || !row.length) {
    return true;
  }
  for (let i = 0; i < row.length; i += 1) {
    const cell = row[i];
    if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
      return false;
    }
  }
  return true;
}

/**
 * Mevcut import diline göre section_* alanlarını doldurur.
 */
export function sectionStateToRowFields(state, language) {
  const empty4 = {
    section_l1_tr: '',
    section_l1_en: '',
    section_l2_tr: '',
    section_l2_en: ''
  };
  if (language === 'tr') {
    return {
      ...empty4,
      section_l1_tr: state.currentL1 || '',
      section_l2_tr: state.currentL2 || ''
    };
  }
  if (language === 'en') {
    return {
      ...empty4,
      section_l1_en: state.currentL1 || '',
      section_l2_en: state.currentL2 || ''
    };
  }
  return empty4;
}

/**
 * Satırda bölüm metni aranacak hücreler: ürün adı, ürün kodu, A sütunu.
 */
export function getCellsToScanForSection(row, columnMapping) {
  const cells = [];
  if (columnMapping.product_name !== undefined) {
    cells.push(row[columnMapping.product_name]);
  }
  if (columnMapping.product_id !== undefined) {
    cells.push(row[columnMapping.product_id]);
  }
  cells.push(row[0]);
  return cells;
}

/**
 * Bölüm satırı mı? (ilk eşleşen hücre)
 */
export function findSectionInRow(row, columnMapping) {
  for (const c of getCellsToScanForSection(row, columnMapping)) {
    const parsed = tryParseSectionLine(c);
    if (parsed) return parsed;
  }
  return null;
}
