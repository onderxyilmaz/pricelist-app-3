/**
 * Fiyat listesi / teklif ürünlerini bölüm (section_l1 / section_l2) alanlarına göre gruplar. Sıra korunur.
 * selectedLanguage: 'tr' | 'en'
 */
export function getSectionDisplay(item, selectedLanguage) {
  const l1 =
    selectedLanguage === 'tr'
      ? (item.section_l1_tr || item.section_l1_en || '')
      : (item.section_l1_en || item.section_l1_tr || '');
  const l2 =
    selectedLanguage === 'tr'
      ? (item.section_l2_tr || item.section_l2_en || '')
      : (item.section_l2_en || item.section_l2_tr || '');
  return { l1, l2 };
}

export function buildSectionKey(item, selectedLanguage) {
  const { l1, l2 } = getSectionDisplay(item, selectedLanguage);
  return `${l1}\n${l2}`;
}

/**
 * @returns {{ l1: string, l2: string, items: any[] }[]}
 */
export function groupItemsBySectionInOrder(items, selectedLanguage) {
  const keyOrder = [];
  const byKey = new Map();
  for (const item of items) {
    const k = buildSectionKey(item, selectedLanguage);
    if (!byKey.has(k)) {
      const { l1, l2 } = getSectionDisplay(item, selectedLanguage);
      byKey.set(k, { l1, l2, items: [] });
      keyOrder.push(k);
    }
    byKey.get(k).items.push(item);
  }
  return keyOrder.map((k) => byKey.get(k));
}
