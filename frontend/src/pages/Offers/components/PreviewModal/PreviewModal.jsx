// PreviewModal - Teklif Önizleme Modal Component
import React, { useState } from 'react';
import { Modal, Button, Space, Typography, Tag, Collapse, Table, Divider } from 'antd';
import { groupItemsBySectionInOrder } from '../../../../utils/offerSectionGroups';
import SectionHeadingLabel from '../../../../components/SectionHeadingLabel';

const { Title } = Typography;
const { Compact } = Space;

const PreviewModal = ({
  visible,
  onClose,
  offer,
  items
}) => {
  const [language, setLanguage] = useState('en');

  if (!offer) return null;

  // Ürünleri fiyat listesine göre grupla
  const groupedItems = items.reduce((groups, item) => {
    const pricelistId = item.pricelist_id;
    if (!groups[pricelistId]) {
      groups[pricelistId] = {
        items: [],
        pricelistName: item.pricelistName || `Fiyat Listesi ${pricelistId}`,
        pricelistColor: item.pricelistColor || '#1890ff'
      };
    }
    groups[pricelistId].items.push(item);
    return groups;
  }, {});

  const groupedEntries = Object.entries(groupedItems);

  return (
    <Modal
      title={`Teklif Önizlemesi: ${offer?.offer_no}`}
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Space key="preview-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <span style={{ fontWeight: 'bold', marginRight: 8 }}>Dil:</span>
            <Compact>
              <Button 
                type={language === 'en' ? 'primary' : 'default'}
                onClick={() => setLanguage('en')}
                style={{ 
                  backgroundColor: language === 'en' ? '#1890ff' : '#f0f0f0',
                  borderColor: language === 'en' ? '#1890ff' : '#d9d9d9',
                  color: language === 'en' ? 'white' : '#666'
                }}
              >
                EN
              </Button>
              <Button 
                type={language === 'tr' ? 'primary' : 'default'}
                onClick={() => setLanguage('tr')}
                style={{ 
                  backgroundColor: language === 'tr' ? '#52c41a' : '#f0f0f0',
                  borderColor: language === 'tr' ? '#52c41a' : '#d9d9d9',
                  color: language === 'tr' ? 'white' : '#666'
                }}
              >
                TR
              </Button>
            </Compact>
          </Space>
          <Button onClick={onClose}>Kapat</Button>
        </Space>
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
            {offer.offer_no}
          </Title>
          {offer.customer && (
            <p style={{ color: '#666', margin: 0, marginBottom: 8 }}>
              <strong>Müşteri:</strong> {offer.customer}
            </p>
          )}
          <p style={{ color: '#666', margin: 0, marginBottom: 16 }}>
            <strong>Durum:</strong>{' '}
            <Tag color={offer.status === 'sent' ? 'green' : 'blue'}>
              {offer.status === 'sent' ? 'Gönderildi' : 'Taslak'}
            </Tag>
            {offer.customer_response && (
              <>
                {' | '}
                <strong>Müşteri Yanıtı:</strong>{' '}
                <Tag color={offer.customer_response === 'accepted' ? 'green' : 'red'}>
                  {offer.customer_response === 'accepted' ? 'Kabul' : 'Red'}
                </Tag>
              </>
            )}
          </p>
        </div>
        
        {groupedEntries.length === 0 ? (
          <p>Bu teklifte ürün bulunmuyor.</p>
        ) : (
          <Collapse 
            defaultActiveKey={groupedEntries.map((_, index) => index.toString())}
            items={groupedEntries.map(([, group], index) => {
              const pricelistTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
              const currency = group.items.length > 0 ? group.items[0].currency : 'EUR';
              
              return {
                key: index.toString(),
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          width: 12, 
                          height: 12, 
                          backgroundColor: group.pricelistColor,
                          borderRadius: '50%', 
                          marginRight: 8 
                        }} 
                      />
                      {group.pricelistName}
                    </span>
                    <Tag color="blue" style={{ margin: 0 }}>
                      {group.items.length} ürün - {pricelistTotal.toFixed(2)} {currency}
                    </Tag>
                  </div>
                ),
                children: (
                  <div>
                    {groupItemsBySectionInOrder(group.items, language).map((sg, sgi) => (
                      <div key={sgi} style={{ marginBottom: sg.l1 || sg.l2 ? 12 : 0 }}>
                        {(sg.l1 || sg.l2) && (
                          <div style={{ fontSize: '13px', marginBottom: 8 }}>
                            <SectionHeadingLabel
                              l1={sg.l1}
                              l2={sg.l2}
                              pricelistColor={group.pricelistColor}
                            />
                          </div>
                        )}
                        <Table
                    columns={[
                      {
                        title: language === 'tr' ? 'Ürün Kodu' : 'Product Code',
                        dataIndex: 'product_id',
                        key: 'product_id',
                        width: 120,
                      },
                      {
                        title: language === 'tr' ? 'Ürün Adı' : 'Product Name',
                        key: 'product_name',
                        render: (_, record) => {
                          const productName = language === 'tr' ? 
                            (record.product_name_tr || record.product_name_en || record.product_name || '-') : 
                            (record.product_name_en || record.product_name_tr || record.product_name || '-');
                          
                          return productName;
                        },
                      },
                      {
                        title: language === 'tr' ? 'Açıklama' : 'Description',
                        key: 'description',
                        ellipsis: true,
                        render: (_, record) => {
                          const isDeleted = !record.pricelist_item_id;
                          
                          if (isDeleted) {
                            return record.description || '-';
                          }
                          
                          const originalDescription = language === 'tr' ? 
                            record.original_description_tr : 
                            record.original_description_en;
                          
                          return originalDescription || record.description || '-';
                        },
                      },
                      {
                        title: language === 'tr' ? 'Miktar' : 'Quantity',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 100,
                        align: 'center',
                        render: (quantity) => quantity || '-',
                      },
                      {
                        title: language === 'tr' ? 'Birim Fiyat' : 'Unit Price',
                        dataIndex: 'unit_price',
                        key: 'unit_price',
                        width: 120,
                        align: 'right',
                        render: (price, record) => price ? `${parseFloat(price).toFixed(2)} ${record.currency}` : '-',
                      },
                      {
                        title: language === 'tr' ? 'Toplam' : 'Total',
                        dataIndex: 'total_price',
                        key: 'total_price',
                        width: 120,
                        align: 'right',
                        render: (total, record) => total ? `${parseFloat(total).toFixed(2)} ${record.currency}` : '-',
                      },
                    ]}
                    dataSource={sg.items}
                    rowKey={(record) => `${record.pricelist_id}-${record.product_id}-${record.id || Math.random()}`}
                    pagination={false}
                    size="small"
                    bordered
                        />
                      </div>
                    ))}
                  </div>
                )
              };
            })}
          />
        )}
        
        <Divider />
        <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
          Genel Toplam: {items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0).toFixed(2)} {items.length > 0 ? items[0].currency : 'EUR'}
        </div>
      </div>
    </Modal>
  );
};

export default PreviewModal;
