// ProfitStep - Step 5/4: Liste Bazında Kar Oranları
import React from 'react';
import { Card, InputNumber, Input, Button, Space, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ProfitStep = ({
  offerData,
  selectedItems,
  pricelists,
  discountData,
  profitData,
  setProfitData,
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

  // Kar uygulanmış toplam hesapla
  const calculateProfitTotal = (pricelistId) => {
    let total = calculateDiscountedTotal(pricelistId);
    
    // Liste bazında kar oranlarını uygula (sırasıyla)
    const profits = profitData[pricelistId] || [];
    profits.forEach(profit => {
      if (profit.rate > 0) {
        total = total * (1 + profit.rate / 100);
      }
    });
    
    return total;
  };

  // Kar ekle
  const addProfit = (pricelistId) => {
    setProfitData(prev => ({
      ...prev,
      [pricelistId]: [
        ...(prev[pricelistId] || []),
        { rate: 0, description: '' }
      ]
    }));
  };

  // Kar güncelle
  const updateProfit = (pricelistId, index, field, value) => {
    setProfitData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].map((profit, i) => 
        i === index ? { ...profit, [field]: value } : profit
      )
    }));
  };

  // Kar sil
  const removeProfit = (pricelistId, index) => {
    setProfitData(prev => ({
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
        <Title level={4}>Kar Oranları</Title>
        <p>Her fiyat listesi için kar oranları ekleyebilirsiniz. Kar oranları indirimli fiyat üzerinden sırasıyla uygulanır.</p>
      </div>

      {groupActiveItemsByPricelist().map((group) => {
        const pricelistId = group.pricelist.id;
        const discountedTotal = calculateDiscountedTotal(pricelistId);
        const profits = profitData[pricelistId] || [];

        return (
          <Card key={pricelistId} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>{group.pricelist.name}</strong> ({group.pricelist.currency})
              <div style={{ fontSize: '14px', color: '#666' }}>
                Ürün sayısı: {group.items.length} | 
                İndirimli tutar: {formatCurrency(discountedTotal, group.pricelist.currency)}
              </div>
            </div>

            {profits.map((profit, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 8,
                padding: '8px 12px',
                backgroundColor: '#f9f9f9',
                borderRadius: 4
              }}>
                <span style={{ minWidth: '80px' }}>Kar {index + 1}:</span>
                <InputNumber
                  placeholder="Oran"
                  min={0}
                  max={1000}
                  value={profit.rate}
                  onChange={(value) => updateProfit(pricelistId, index, 'rate', value || 0)}
                  style={{ width: 100, marginRight: 8 }}
                  addonAfter="%"
                />
                <Input
                  placeholder="Açıklama (opsiyonel)"
                  value={profit.description}
                  onChange={(e) => updateProfit(pricelistId, index, 'description', e.target.value)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  type="text"
                  danger
                  onClick={() => removeProfit(pricelistId, index)}
                  icon={<DeleteOutlined />}
                />
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <Button
                type="dashed"
                onClick={() => addProfit(pricelistId)}
                icon={<PlusOutlined />}
                style={{ marginRight: 16 }}
              >
                Kar Ekle
              </Button>
              
              {profits.length > 0 && (
                <span style={{ 
                  fontWeight: 'bold',
                  color: '#52c41a' 
                }}>
                  Kar eklenmiş tutar: {formatCurrency(calculateProfitTotal(pricelistId), group.pricelist.currency)}
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

export default ProfitStep;

