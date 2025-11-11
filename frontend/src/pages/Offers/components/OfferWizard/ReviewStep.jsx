// ReviewStep - Step 7/6: Önizleme ve Kaydet
import React from 'react';
import { Table, Button, Space, Typography, Collapse } from 'antd';

const { Title } = Typography;

const ReviewStep = ({
  offerData,
  selectedItems,
  pricelists,
  discountData,
  profitData,
  itemDiscounts,
  itemNotes,
  manualPrices,
  selectedLanguage,
  onSave,
  onPrev,
  onCancel,
  loading
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

  // Tarih formatla
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR');
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

  // Final fiyat hesapla
  const calculateItemFinalPrice = (item, pricelistId) => {
    const manualPrice = manualPrices[item.id];
    
    // Manuel fiyat aktif ise
    if (manualPrice && manualPrice.enabled && manualPrice.price > 0) {
      return manualPrice.price;
    }
    
    // Hesaplanan fiyat
    let salesPrice = parseFloat(item.price);
    
    // Ürün bazında indirim
    const itemDiscount = itemDiscounts[item.id] || 0;
    if (itemDiscount > 0) {
      salesPrice = salesPrice * (1 - itemDiscount / 100);
    }
    
    // Liste bazında indirimler
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        salesPrice = salesPrice * (1 - discount.rate / 100);
      }
    });

    // Kar oranları
    const profits = profitData[pricelistId] || [];
    profits.forEach(profit => {
      if (profit.rate > 0) {
        salesPrice = salesPrice * (1 + profit.rate / 100);
      }
    });
    
    return salesPrice;
  };

  return (
    <div>
      {/* Başlık */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '2px solid #f0f0f0'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Teklif No: {offerData.offer_no}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Rev. No: 0
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: 4 }}>
            Tarih: {formatDate(new Date())}
          </div>
        </div>
      </div>

      {/* Müşteri */}
      {offerData.customer && (
        <div style={{ marginBottom: 24 }}>
          <strong>Müşteri:</strong> {offerData.customer}
        </div>
      )}

      {/* Ürünler - Fiyat Listelerine Göre */}
      <Collapse 
        defaultActiveKey={groupActiveItemsByPricelist().map((g, i) => i.toString())}
        items={groupActiveItemsByPricelist().map((group, index) => {
          const groupTotal = group.items.reduce((total, item) => {
            return total + (calculateItemFinalPrice(item, group.pricelist.id) * item.quantity);
          }, 0);

          return {
            key: index.toString(),
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>
                  <strong>{group.pricelist.name}</strong> ({group.pricelist.currency})
                </span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  {formatCurrency(groupTotal, group.pricelist.currency)}
                </span>
              </div>
            ),
            children: (
              <Table 
                dataSource={group.items.map(item => ({
                  ...item,
                  note: itemNotes[item.id] || ''
                }))}
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  {
                    title: 'Product Code',
                    dataIndex: 'product_id',
                    key: 'product_id',
                    width: 120,
                  },
                  {
                    title: 'Name',
      key: 'name',
                    ellipsis: true,
                    render: (_, record) => {
                      const displayName = selectedLanguage === 'tr' 
                        ? (record.name_tr || record.name_en || record.name || '-')
                        : (record.name_en || record.name_tr || record.name || '-');
                      return displayName;
                    },
                  },
                  {
                    title: 'Description',
                    key: 'description',
                    ellipsis: true,
                    render: (_, record) => {
                      const displayDescription = selectedLanguage === 'tr' 
                        ? (record.description_tr || record.description_en || record.description || '-')
                        : (record.description_en || record.description_tr || record.description || '-');
                      return displayDescription;
                    }
                  },
                  {
                    title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
                    width: 80,
      align: 'center',
    },
    {
      title: 'Unit Price',
      key: 'unit_price',
      width: 120,
      align: 'right',
                    render: (_, record) => {
                      const finalPrice = calculateItemFinalPrice(record, group.pricelist.id);
                      const isManual = manualPrices[record.id] && manualPrices[record.id].enabled;
                      return <span style={{ color: isManual ? '#fa8c16' : 'inherit' }}>
                        {formatCurrency(finalPrice, group.pricelist.currency)}
                        {isManual && <span style={{ fontSize: '10px', marginLeft: 4 }}>(M)</span>}
                      </span>;
                    }
                  },
                  {
                    title: 'Total Price',
                    key: 'total_price',
                    width: 150,
      align: 'right',
                    render: (_, record) => {
                      const finalPrice = calculateItemFinalPrice(record, group.pricelist.id) * record.quantity;
                      const isManual = manualPrices[record.id] && manualPrices[record.id].enabled;
                      return <span style={{ 
                        color: isManual ? '#fa8c16' : '#52c41a', 
                        fontWeight: 'bold' 
                      }}>
                        {formatCurrency(finalPrice, group.pricelist.currency)}
                      </span>;
                    }
                  },
                  {
                    title: 'Note',
                    dataIndex: 'note',
                    key: 'note',
                    ellipsis: true,
                    width: 150,
                    render: (note) => note || '-'
                  }
                ]}
              />
            )
          };
        })}
      />

      {/* Genel Toplam */}
      <div style={{ 
        marginTop: 24, 
        padding: '16px',
        backgroundColor: '#f0f5ff',
        borderRadius: 8,
        border: '2px solid #1890ff'
      }}>
        <Title level={4} style={{ marginBottom: 16 }}>Genel Toplam</Title>
        {groupActiveItemsByPricelist().map((group) => {
          const groupTotal = group.items.reduce((total, item) => {
            return total + (calculateItemFinalPrice(item, group.pricelist.id) * item.quantity);
          }, 0);

  return (
            <div key={group.pricelist.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: '16px'
            }}>
              <span><strong>{group.pricelist.name}:</strong></span>
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
            onClick={onSave}
            loading={loading}
            size="large"
          >
            Teklifi Kaydet
          </Button>
        </Space>
          </div>
    </div>
  );
};

export default ReviewStep;
