// ReviewStep - Step 7/6: Önizleme ve Kaydet
import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Typography, Collapse, Switch, Tooltip } from 'antd';
import { groupItemsBySectionInOrder } from '../../../../utils/offerSectionGroups';
import SectionHeadingLabel from '../../../../components/SectionHeadingLabel';

const { Title, Text } = Typography;

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

  // Tarih formatla
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR');
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

  const getReviewTableColumns = (pricelistId, currency) => [
    {
      title: 'Product Code',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 120
    },
    {
      title: 'Name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => {
        const displayName =
          selectedLanguage === 'tr'
            ? record.name_tr || record.name_en || record.name || '-'
            : record.name_en || record.name_tr || record.name || '-';
        return displayName;
      }
    },
    {
      title: 'Description',
      key: 'description',
      ellipsis: true,
      render: (_, record) => {
        const displayDescription =
          selectedLanguage === 'tr'
            ? record.description_tr || record.description_en || record.description || '-'
            : record.description_en || record.description_tr || record.description || '-';
        return displayDescription;
      }
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center'
    },
    {
      title: 'Unit Price',
      key: 'unit_price',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const finalPrice = calculateItemFinalPrice(record, pricelistId);
        const isManual = manualPrices[record.id] && manualPrices[record.id].enabled;
        return (
          <span style={{ color: isManual ? '#fa8c16' : 'inherit' }}>
            {formatCurrency(finalPrice, currency)}
            {isManual && <span style={{ fontSize: '10px', marginLeft: 4 }}>(M)</span>}
          </span>
        );
      }
    },
    {
      title: 'Total Price',
      key: 'total_price',
      width: 150,
      align: 'right',
      render: (_, record) => {
        const finalPrice = calculateItemFinalPrice(record, pricelistId) * record.quantity;
        const isManual = manualPrices[record.id] && manualPrices[record.id].enabled;
        return (
          <span style={{ color: isManual ? '#fa8c16' : '#52c41a', fontWeight: 'bold' }}>
            {formatCurrency(finalPrice, currency)}
          </span>
        );
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
  ];

  const pricelistGroups = groupActiveItemsByPricelist;

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

      {/* Ürünler - Fiyat Listelerine Göre */}
      <Collapse
        defaultActiveKey={pricelistGroups.map((g, i) => i.toString())}
        items={pricelistGroups.map((group, index) => {
          const plId = group.pricelist.id;
          const plColor = group.pricelist.color || '#1890ff';
          const groupTotal = group.items.reduce((total, item) => {
            return total + (calculateItemFinalPrice(item, plId) * item.quantity);
          }, 0);

          const withNotes = (rows) =>
            rows.map((item) => ({
              ...item,
              note: itemNotes[item.id] || ''
            }));

          const children = (
            <div>
              {hasSections && groupBySections
                ? groupItemsBySectionInOrder(group.items, selectedLanguage).map((sg, sgi) => (
                    <div key={sgi} style={{ marginBottom: sg.l1 || sg.l2 ? 16 : 0 }}>
                      {(sg.l1 || sg.l2) && (
                        <div style={{ marginBottom: 8 }}>
                          <SectionHeadingLabel l1={sg.l1} l2={sg.l2} pricelistColor={plColor} />
                        </div>
                      )}
                      <Table
                        dataSource={withNotes(sg.items)}
                        pagination={false}
                        rowKey="id"
                        size="small"
                        columns={getReviewTableColumns(plId, group.pricelist.currency)}
                      />
                    </div>
                  ))
                : (
                    <Table
                      dataSource={withNotes(group.items)}
                      pagination={false}
                      rowKey="id"
                      size="small"
                      columns={getReviewTableColumns(plId, group.pricelist.currency)}
                    />
                  )}
            </div>
          );

          return {
            key: index.toString(),
            label: (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  paddingRight: 8,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
                </span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  {formatCurrency(groupTotal, group.pricelist.currency)}
                </span>
              </div>
            ),
            children
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
        {pricelistGroups.map((group) => {
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
                fontSize: '16px',
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
