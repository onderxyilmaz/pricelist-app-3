import React from 'react';
import { 
  Modal, 
  Typography, 
  Button, 
  Space, 
  Collapse, 
  Table, 
  Tag 
} from 'antd';
import styles from '../OfferTemplates.module.css';

const { Title } = Typography;
const { Compact } = Space;

const PreviewModal = ({ 
  visible,
  template,
  items,
  language,
  onLanguageChange,
  onClose
}) => {
  // Ürünleri fiyat listesine göre grupla
  const getGroupedItems = () => {
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

    return Object.entries(groupedItems);
  };

  const getTableColumns = () => [
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
          (record.name_tr || record.name_en || '-') : 
          (record.name_en || record.name_tr || '-');
        
        // Eğer original_item_id NULL ise ürün silinmiş demektir
        const isDeleted = !record.original_item_id;
        
        return (
          <span>
            {productName}
            {isDeleted && (
              <Tag color="orange" size="small" style={{ marginLeft: 8 }}>
                {language === 'tr' ? 'Silinmiş Ürün' : 'Deleted Product'}
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: language === 'tr' ? 'Açıklama' : 'Description',
      key: 'description',
      ellipsis: true,
      render: (_, record) => {
        const isDeleted = !record.original_item_id;
        
        // Eğer ürün silinmişse sadece snapshot description'ı kullan
        if (isDeleted) {
          return language === 'tr' ? 
            (record.description_tr || record.description_en || '-') : 
            (record.description_en || record.description_tr || '-');
        }
        
        // Ürün silinmemişse önce orijinal açıklamayı tercih et
        const originalDescription = language === 'tr' ? 
          record.original_description_tr : 
          record.original_description_en;
        
        const snapshotDescription = language === 'tr' ? 
          (record.description_tr || record.description_en) : 
          (record.description_en || record.description_tr);
        
        return originalDescription || snapshotDescription || '-';
      },
    },
    {
      title: language === 'tr' ? 'Miktar' : 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: language === 'tr' ? 'Birim Fiyat' : 'Unit Price',
      key: 'price',
      width: 120,
      align: 'right',
      render: (_, record) => `${record.price} ${record.currency}`,
    },
    {
      title: language === 'tr' ? 'Toplam' : 'Total',
      key: 'total_price',
      width: 120,
      align: 'right',
      render: (_, record) => `${record.total_price} ${record.currency}`,
    },
    {
      title: language === 'tr' ? 'Not' : 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note) => note || '-',
    },
  ];

  const groupedEntries = getGroupedItems();
  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
  const currency = items.length > 0 ? items[0].currency : 'EUR';

  return (
    <Modal
      title={`Template Önizlemesi: ${template?.name}`}
      open={visible}
      onCancel={onClose}
      width={1200}
      className={styles.previewModal}
      footer={[
        <Space 
          key="preview-actions" 
          className={styles.previewFooter}
        >
          <Space className={styles.previewLanguageControls}>
            <span className={styles.previewLanguageLabel}>Dil:</span>
            <Compact>
              <Button 
                type={language === 'en' ? 'primary' : 'default'}
                onClick={() => onLanguageChange('en')}
                className={`${styles.previewLanguageButton} ${
                  language === 'en' ? styles.previewLanguageButtonEn : ''
                }`}
              >
                EN
              </Button>
              <Button 
                type={language === 'tr' ? 'primary' : 'default'}
                onClick={() => onLanguageChange('tr')}
                className={`${styles.previewLanguageButton} ${
                  language === 'tr' ? styles.previewLanguageButtonTr : ''
                }`}
              >
                TR
              </Button>
            </Compact>
          </Space>
          <Button onClick={onClose}>Kapat</Button>
        </Space>
      ]}
    >
      <div className={styles.previewContent}>
        {template && (
          <div className={styles.previewHeader}>
            <Title level={4} className={styles.previewTitle}>
              {template.name}
            </Title>
            {template.description && (
              <p className={styles.previewDescription}>
                {template.description}
              </p>
            )}
          </div>
        )}
        
        {groupedEntries.length === 0 ? (
          <p>Bu template'de ürün bulunmuyor.</p>
        ) : (
          <Collapse 
            defaultActiveKey={groupedEntries.map((_, index) => index.toString())}
            className={styles.pricelistCollapse}
            items={groupedEntries.map(([pricelistId, group], index) => {
              const pricelistTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
              const groupCurrency = group.items.length > 0 ? group.items[0].currency : 'EUR';
              
              return {
                key: index.toString(),
                label: (
                  <div className={styles.pricelistHeader}>
                    <span className={styles.pricelistInfo}>
                      <div 
                        className={styles.pricelistColorDot}
                        style={{ backgroundColor: group.pricelistColor }}
                      />
                      {group.pricelistName}
                    </span>
                    <Tag color="blue" className={styles.pricelistStats}>
                      {group.items.length} ürün - {pricelistTotal.toFixed(2)} {groupCurrency}
                    </Tag>
                  </div>
                ),
                children: (
                  <Table
                    columns={getTableColumns()}
                    dataSource={group.items}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    className={styles.previewTable}
                  />
                )
              };
            })}
          />
        )}
        
        {/* Genel Toplam */}
        <div className={styles.previewTotal}>
          <Title level={4} className={styles.previewTotalTitle}>
            Genel Toplam: {totalAmount.toFixed(2)} {currency}
          </Title>
        </div>
      </div>
    </Modal>
  );
};

export default PreviewModal;
