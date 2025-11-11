// ProductsStep - Step 3/2: Ürün Seçimi
import React, { useState } from 'react';
import { Collapse, Checkbox, Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { InputNumber as AntInputNumber } from 'antd';

const { Compact } = Space;

const ProductsStep = ({
  offerData,
  pricelists,
  selectedItems,
  setSelectedItems,
  itemNotes,
  setItemNotes,
  itemDiscounts,
  setItemDiscounts,
  selectedLanguage,
  onNext,
  onPrev,
  onCancel
}) => {
  const [productFilter, setProductFilter] = useState('');

  // Ürün filtreleme fonksiyonu
  const filterItems = (items) => {
    if (!productFilter.trim()) return items;
    
    const filterLower = productFilter.toLowerCase();
    return items.filter(item => {
      const nameTr = (item.name_tr || '').toLowerCase();
      const nameEn = (item.name_en || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const productId = (item.product_id || '').toLowerCase();
      const descriptionTr = (item.description_tr || '').toLowerCase();
      const descriptionEn = (item.description_en || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      
      return nameTr.includes(filterLower) || 
             nameEn.includes(filterLower) ||
             name.includes(filterLower) ||
             productId.includes(filterLower) ||
             descriptionTr.includes(filterLower) ||
             descriptionEn.includes(filterLower) ||
             description.includes(filterLower);
    });
  };

  // Ürün seçimi/kaldırma
  const handleItemSelection = (item, checked) => {
    if (checked) {
      const initialQty = item.stock <= 0 ? 0 : 1;
      setSelectedItems(prev => [...prev, { 
        ...item, 
        quantity: initialQty, 
        total_price: (item.price * initialQty).toFixed(2) 
      }]);
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    }
  };

  // Miktar değişikliği
  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = quantity || 0;
        return {
          ...item,
          quantity: newQuantity,
          total_price: (item.price * newQuantity).toFixed(2)
        };
      }
      return item;
    }));
  };

  // Aktif ürünleri getir (silinmemiş olanlar)
  const getActiveSelectedItems = () => {
    return selectedItems.filter(item => {
      return pricelists.some(pricelist => 
        pricelist.items && pricelist.items.some(pricelistItem => 
          pricelistItem.product_id === item.product_id && 
          pricelist.id === item.pricelist_id
        )
      );
    });
  };

  // Para birimi formatla
  const formatCurrency = (amount, currency = 'TRY') => {
    const currencySymbols = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      TRY: '₺'
    };
    
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
    
    return `${formatted} ${currencySymbols[currency] || currency}`;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <strong>Teklif:</strong> {offerData.offer_no} | <strong>Müşteri:</strong> {offerData.customer || '-'}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Compact style={{ width: '100%' }}>
          <Input
            placeholder="Ürün ara... (ürün adı, ID veya açıklama)"
            allowClear
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            onPressEnter={() => setProductFilter(productFilter)}
            prefix={<SearchOutlined />}
            onClear={() => setProductFilter('')}
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={() => setProductFilter(productFilter)}
          >
            Ara
          </Button>
        </Compact>
      </div>

      {/* Filtreleme sonucu kontrolü */}
      {productFilter.trim() && pricelists.every(pricelist => filterItems(pricelist.items || []).length === 0) && (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: '#999',
          backgroundColor: '#f9f9f9',
          borderRadius: 6,
          marginBottom: 16 
        }}>
          <SearchOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>"{productFilter}" için ürün bulunamadı</div>
          <div style={{ fontSize: '12px', marginTop: 4 }}>Farklı bir arama terimi deneyin</div>
        </div>
      )}

      <Collapse
        items={pricelists
          .map(pricelist => {
            const filteredItems = filterItems(pricelist.items || []);
            if (filteredItems.length === 0 && productFilter.trim()) {
              return null;
            }
            return {
              key: pricelist.id,
              label: `${pricelist.name} (${pricelist.currency}) - ${filteredItems.length}/${(pricelist.items || []).length} ürün${productFilter.trim() ? ' (filtrelenmiş)' : ''}`,
              children: (
                <>
                  {filteredItems.map(item => {
                    const selectedItem = selectedItems.find(selected => 
                      selected.id === item.id || 
                      (selected.product_id === item.product_id && selected.pricelist_id === pricelist.id)
                    );
                    const isSelected = !!selectedItem;
                    return (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleItemSelection({...item, pricelist_id: pricelist.id, currency: pricelist.currency}, e.target.checked)}
                        />
                        <div style={{ flex: 1, marginLeft: 12 }}>
                          <div><strong>{selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)}</strong> ({item.product_id})</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {(selectedLanguage === 'tr' ? (item.description_tr || item.description_en || item.description) : (item.description_en || item.description_tr || item.description)) || 'Açıklama yok'} | {item.price} {pricelist.currency} | 
                            <span style={{ 
                              color: item.stock <= 0 ? '#ff4d4f' : item.stock < 10 ? '#ff4d4f' : item.stock < 50 ? '#faad14' : '#52c41a',
                              fontWeight: 'bold',
                              marginLeft: 4
                            }}>
                              Stok: {item.stock} {item.unit}
                            </span>
                            {item.stock <= 0 && <span style={{ color: '#ff4d4f' }}> (Stok Yok!)</span>}
                            {item.stock > 0 && item.stock < 10 && <span style={{ color: '#ff4d4f' }}> (Düşük Stok!)</span>}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: 8 }}>Adet:</span>
                            <AntInputNumber
                              min={0}
                              max={item.stock <= 0 ? 0 : item.stock}
                              value={selectedItem.quantity}
                              onChange={(value) => handleQuantityChange(selectedItem.id, value)}
                              disabled={item.stock <= 0}
                              style={{ width: 80 }}
                            />
                            <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                              {selectedItem.total_price} {pricelist.currency}
                            </span>
                            {/* İndirim alanı */}
                            <Compact style={{ marginLeft: 8 }}>
                              <Input
                                placeholder="Ürün İndirimi %"
                                value={itemDiscounts[item.id] || ''}
                                onChange={e => {
                                  const value = e.target.value;
                                  if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                                    setItemDiscounts({ ...itemDiscounts, [item.id]: value });
                                  }
                                }}
                                style={{ width: 100 }}
                              />
                              <span style={{ 
                                padding: '4px 11px', 
                                border: '1px solid #d9d9d9',
                                borderLeft: 'none',
                                backgroundColor: '#fafafa',
                                borderRadius: '0 6px 6px 0',
                                display: 'inline-block',
                                fontSize: '14px'
                              }}>%</span>
                            </Compact>
                            {/* İndirimli fiyat gösterimi */}
                            {itemDiscounts[item.id] && parseFloat(itemDiscounts[item.id]) > 0 && (
                              <span style={{ 
                                marginLeft: 8, 
                                fontWeight: 'bold',
                                color: '#52c41a'
                              }}>
                                İndirimli: {formatCurrency(
                                  (parseFloat(selectedItem.total_price) * (1 - parseFloat(itemDiscounts[item.id]) / 100)),
                                  pricelist.currency
                                )}
                              </span>
                            )}
                            {/* Açıklama alanı */}
                            <Input
                              placeholder="Açıklama (opsiyonel)"
                              value={itemNotes[item.id] || ''}
                              onChange={e => setItemNotes({ ...itemNotes, [item.id]: e.target.value })}
                              style={{ width: 180, marginLeft: 8 }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )
            };
          })
          .filter(Boolean)
        }
      />

      <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
        {(() => {
          const activeItems = getActiveSelectedItems();
          return (
            <>
              <strong>Seçilen Ürünler: {activeItems.length}</strong>
              {activeItems.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {activeItems.map(item => (
                    <div key={item.id} style={{ fontSize: '12px' }}>
                      {selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)} x {item.quantity} = {item.total_price} {item.currency}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      <div style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={onPrev}>Önceki Adım</Button>
          <Button onClick={onCancel}>İptal</Button>
          <Button 
            type="primary" 
            disabled={getActiveSelectedItems().length === 0}
            onClick={onNext}
          >
            Sonraki Adım
          </Button>
      </Space>
      </div>
    </div>
  );
};

export default ProductsStep;
