// DiscountStep - Step 4/3: Liste Bazında İndirimler
import React from 'react';
import { Card, InputNumber, Input, Button, Space, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DiscountStep = ({
  offerData,
  selectedItems,
  pricelists,
  discountData,
  setDiscountData,
  itemDiscounts,
  onNext,
  onPrev,
  onCancel
}) => {
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

  // Aktif ürünleri filtrele
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

  // Fiyat listesine göre grupla
  const groupActiveItemsByPricelist = () => {
    const activeItems = getActiveSelectedItems();
    const groups = activeItems.reduce((groups, item) => {
      const pricelistId = item.pricelist_id;
      if (!groups[pricelistId]) {
        const pricelist = pricelists.find(p => p.id === pricelistId);
        groups[pricelistId] = {
          pricelist: pricelist || { id: pricelistId, name: `Fiyat Listesi ${pricelistId}`, currency: 'EUR' },
          items: []
        };
      }
      groups[pricelistId].items.push(item);
      return groups;
    }, {});
    return Object.values(groups);
  };

  // İndirimli toplam hesapla
  const calculateDiscountedTotal = (pricelistId) => {
    const activeItems = getActiveSelectedItems();
    const items = activeItems.filter(item => item.pricelist_id === pricelistId);
    let total = 0;
    
    items.forEach(item => {
      let itemPrice = parseFloat(item.price) * item.quantity;
      
      // Önce ürün bazında indirim uygula
      const itemDiscount = itemDiscounts[item.id] || 0;
      if (itemDiscount > 0) {
        itemPrice = itemPrice * (1 - itemDiscount / 100);
      }
      
      total += itemPrice;
    });
    
    // Sonra liste bazında indirimleri uygula (sırasıyla)
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        total = total * (1 - discount.rate / 100);
      }
    });
    
    return total;
  };

  // İndirim ekle
  const addDiscount = (pricelistId) => {
    setDiscountData(prev => ({
      ...prev,
      [pricelistId]: [
        ...(prev[pricelistId] || []),
        { rate: 0, description: '' }
      ]
    }));
  };

  // İndirim güncelle
  const updateDiscount = (pricelistId, index, field, value) => {
    setDiscountData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].map((discount, i) => 
        i === index ? { ...discount, [field]: value } : discount
      )
    }));
  };

  // İndirim sil
  const removeDiscount = (pricelistId, index) => {
    setDiscountData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <strong>Teklif:</strong> {offerData.offer_no} | <strong>Müşteri:</strong> {offerData.customer || '-'}
      </div>

      <div style={{ marginBottom: 24 }}>
        <Title level={4}>İndirim Oranları</Title>
        <p>Her fiyat listesi için indirim oranları ekleyebilirsiniz. İndirimler sırasıyla uygulanır.</p>
      </div>

      {groupActiveItemsByPricelist().map((group) => {
        const pricelistId = group.pricelist.id;
        const originalTotal = group.items.reduce((sum, item) => {
          let itemPrice = parseFloat(item.price) * item.quantity;
          
          // Ürün bazında indirim varsa uygula
          const itemDiscount = itemDiscounts[item.id] || 0;
          if (itemDiscount > 0) {
            itemPrice = itemPrice * (1 - itemDiscount / 100);
          }
          
          return sum + itemPrice;
        }, 0);
        const discounts = discountData[pricelistId] || [];

        return (
          <Card key={pricelistId} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>{group.pricelist.name}</strong> ({group.pricelist.currency})
              <div style={{ fontSize: '14px', color: '#666' }}>
                Ürün sayısı: {group.items.length} | 
                Orijinal tutar: {formatCurrency(originalTotal, group.pricelist.currency)}
              </div>
            </div>

            {discounts.map((discount, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 8,
                padding: '8px 12px',
                backgroundColor: '#f9f9f9',
                borderRadius: 4
              }}>
                <span style={{ minWidth: '80px' }}>İndirim {index + 1}:</span>
                <InputNumber
                  placeholder="Oran"
                  min={0}
                  max={100}
                  value={discount.rate}
                  onChange={(value) => updateDiscount(pricelistId, index, 'rate', value || 0)}
                  style={{ width: 100, marginRight: 8 }}
                  addonAfter="%"
                />
                <Input
                  placeholder="Açıklama (opsiyonel)"
                  value={discount.description}
                  onChange={(e) => updateDiscount(pricelistId, index, 'description', e.target.value)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  type="text"
                  danger
                  onClick={() => removeDiscount(pricelistId, index)}
                  icon={<DeleteOutlined />}
                />
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <Button
                type="dashed"
                onClick={() => addDiscount(pricelistId)}
                icon={<PlusOutlined />}
                style={{ marginRight: 16 }}
              >
                İndirim Ekle
              </Button>
              
              {discounts.length > 0 && (
                <span style={{ 
                  fontWeight: 'bold',
                  color: '#1890ff' 
                }}>
                  İndirimli tutar: {formatCurrency(calculateDiscountedTotal(pricelistId), group.pricelist.currency)}
                </span>
              )}
            </div>
          </Card>
        );
      })}

      <div style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={onPrev}>Önceki Adım</Button>
          <Button onClick={onCancel}>İptal</Button>
          <Button 
            type="primary"
            onClick={onNext}
          >
            Sonraki Adım
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default DiscountStep;

