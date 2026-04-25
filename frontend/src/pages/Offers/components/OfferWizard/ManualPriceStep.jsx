// ManualPriceStep - Step 6/5: Ürün Bazında Manuel Fiyat
import React, { useState, useMemo } from 'react';
import { Card, Checkbox, InputNumber, Button, Space, Typography, Switch, Tooltip } from 'antd';
import { groupItemsBySectionInOrder } from '../../../../utils/offerSectionGroups';
import SectionHeadingLabel from '../../../../components/SectionHeadingLabel';

const { Title, Text } = Typography;

const ManualPriceStep = ({
  offerData,
  selectedItems,
  pricelists,
  discountData,
  profitData,
  itemDiscounts,
  manualPrices,
  setManualPrices,
  selectedLanguage,
  onNext,
  onPrev,
  onCancel
}) => {
  const [groupBySections, setGroupBySections] = useState(true);

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

  const activeItems = useMemo(
    () =>
      selectedItems.filter((item) =>
        pricelists.some(
          (pricelist) =>
            pricelist.items &&
            pricelist.items.some(
              (pricelistItem) =>
                pricelistItem.product_id === item.product_id && pricelist.id === item.pricelist_id
            )
        )
      ),
    [selectedItems, pricelists]
  );

  const hasSections = useMemo(
    () =>
      activeItems.some(
        (i) =>
          i.section_l1_tr || i.section_l1_en || i.section_l2_tr || i.section_l2_en
      ),
    [activeItems]
  );

  // Fiyat listesine göre grupla
  const groupActiveItemsByPricelist = useMemo(() => {
    const groups = activeItems.reduce((acc, item) => {
      const pricelistId = item.pricelist_id;
      if (!acc[pricelistId]) {
        const pricelist = pricelists.find((p) => p.id === pricelistId);
        acc[pricelistId] = {
          pricelist: pricelist || { id: pricelistId, name: `Fiyat Listesi ${pricelistId}`, currency: 'EUR' },
          items: []
        };
      }
      acc[pricelistId].items.push(item);
      return acc;
    }, {});
    return Object.values(groups);
  }, [activeItems, pricelists]);

  // Ürün bazında satış fiyatı hesapla (toplam)
  const calculateItemSalesPrice = (item, pricelistId) => {
    let salesPrice = parseFloat(item.price);
    
    // Önce ürün bazında indirim uygula
    const itemDiscount = itemDiscounts[item.id] || 0;
    if (itemDiscount > 0) {
      salesPrice = salesPrice * (1 - itemDiscount / 100);
    }
    
    // Sonra liste indirimlerini uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        salesPrice = salesPrice * (1 - discount.rate / 100);
      }
    });

    // Son olarak kar oranlarını uygula
    const profits = profitData[pricelistId] || [];
    profits.forEach(profit => {
      if (profit.rate > 0) {
        salesPrice = salesPrice * (1 + profit.rate / 100);
      }
    });
    
    // Adet ile çarp
    return salesPrice * item.quantity;
  };

  // Final fiyat (manuel veya hesaplanan)
  const calculateItemFinalPrice = (item, pricelistId) => {
    const manualPrice = manualPrices[item.id];
    
    // Manuel fiyat aktif ve girilmişse onu kullan
    if (manualPrice && manualPrice.enabled && manualPrice.price > 0) {
      return manualPrice.price;
    }
    
    // Yoksa hesaplanmış satış fiyatını kullan (birim fiyat)
    return calculateItemSalesPrice(item, pricelistId) / item.quantity;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <strong>Teklif:</strong> {offerData.offer_no} | <strong>Müşteri:</strong> {offerData.customer || '-'}
      </div>

      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Manuel Fiyat Düzenleme</Title>
        <p>İsterseniz bazı ürünlerin fiyatlarını manuel olarak değiştirebilirsiniz. Manuel fiyat girildiğinde hesaplanan fiyat iptal olur.</p>
      </div>

      {hasSections && (
        <div style={{ marginBottom: 16 }}>
          <Tooltip title="Kapalıyken tüm ürünler tek listede; açıkken bölüm başlıklarına göre gruplanır.">
            <Space size="small" align="center">
              <Text strong>Bölüm başlıkları:</Text>
              <Switch
                checked={groupBySections}
                onChange={setGroupBySections}
                checkedChildren="Açık"
                unCheckedChildren="Kapalı"
              />
            </Space>
          </Tooltip>
        </div>
      )}

      {groupActiveItemsByPricelist.map((group) => {
        const pricelistId = group.pricelist.id;
        const plColor = group.pricelist.color || '#1890ff';

        const renderItemRow = (item) => {
          const calculatedPrice = calculateItemSalesPrice(item, pricelistId);
          const manualPrice = manualPrices[item.id] || { enabled: false, price: '' };

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 12,
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: 6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>
                  {selectedLanguage === 'tr'
                    ? item.name_tr || item.name_en || item.name
                    : item.name_en || item.name_tr || item.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {item.product_id} | Adet: {item.quantity}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                  {(selectedLanguage === 'tr'
                    ? item.description_tr || item.description_en || item.description
                    : item.description_en || item.description_tr || item.description) || 'Açıklama yok'}
                </div>
              </div>

              <div style={{ marginLeft: 16, textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Hesaplanan Fiyat:</div>
                <div style={{ fontWeight: 'bold' }}>
                  {formatCurrency(calculatedPrice, group.pricelist.currency)}
                </div>
              </div>

              <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={manualPrice.enabled}
                  onChange={(e) => {
                    setManualPrices({
                      ...manualPrices,
                      [item.id]: {
                        ...manualPrice,
                        enabled: e.target.checked,
                        price: e.target.checked ? calculatedPrice / item.quantity : '',
                      },
                    });
                  }}
                >
                  Manuel Fiyat
                </Checkbox>
              </div>

              {manualPrice.enabled && (
                <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 8 }}>Birim Fiyat:</span>
                  <InputNumber
                    value={manualPrice.price}
                    onChange={(value) => {
                      setManualPrices({
                        ...manualPrices,
                        [item.id]: {
                          ...manualPrice,
                          price: value || 0,
                        },
                      });
                    }}
                    style={{ width: 120 }}
                    step={0.01}
                    min={0}
                    placeholder="0.00"
                  />
                  <span style={{ marginLeft: 8, fontWeight: 'bold', color: '#52c41a' }}>
                    Toplam: {formatCurrency((manualPrice.price || 0) * item.quantity, group.pricelist.currency)}
                  </span>
                </div>
              )}
            </div>
          );
        };

        return (
          <Card key={pricelistId} style={{ marginBottom: 16 }}>
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: plColor,
                  flexShrink: 0,
                }}
              />
              <Text strong style={{ color: plColor, margin: 0 }}>
                {group.pricelist.name} ({group.pricelist.currency})
              </Text>
            </div>

            {hasSections && groupBySections
              ? groupItemsBySectionInOrder(group.items, selectedLanguage).map((sectionGroup, gi) => (
                  <div key={gi} style={{ marginBottom: 12 }}>
                    {(sectionGroup.l1 || sectionGroup.l2) && (
                      <div
                        style={{
                          fontSize: '13px',
                          padding: '6px 0 8px',
                          borderBottom: '1px solid #eee',
                          marginBottom: 8,
                        }}
                      >
                        <SectionHeadingLabel
                          l1={sectionGroup.l1}
                          l2={sectionGroup.l2}
                          pricelistColor={plColor}
                        />
                      </div>
                    )}
                    {sectionGroup.items.map((item) => renderItemRow(item))}
                  </div>
                ))
              : group.items.map((item) => renderItemRow(item))}
          </Card>
        );
      })}

      {/* Genel Toplam */}
      <div style={{ 
        marginTop: 24, 
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        border: '2px solid #d9d9d9'
      }}>
        {groupActiveItemsByPricelist.map((group) => {
          const groupTotal = group.items.reduce((total, item) => {
            return total + (calculateItemFinalPrice(item, group.pricelist.id) * item.quantity);
          }, 0);
          const plColor = group.pricelist.color || '#1890ff';

          return (
            <div
              key={group.pricelist.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: '14px',
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: plColor,
                    flexShrink: 0,
                  }}
                />
                <strong style={{ color: plColor }}>{group.pricelist.name}:</strong>
              </span>
              <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                {formatCurrency(groupTotal, group.pricelist.currency)}
              </span>
            </div>
          );
        })}
      </div>

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

export default ManualPriceStep;

