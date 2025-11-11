import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space } from 'antd';
import styles from '../Dashboard.module.css';

const { Compact } = Space;

const RecentProducts = ({ stats, loading }) => {
  const [tableLanguage, setTableLanguage] = useState('en');

  const getCurrencySymbol = (currency) => {
    const symbols = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'TRY': '₺', 'TL': '₺' };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  const recentProductsColumns = [
    {
      title: tableLanguage === 'tr' ? 'Ürün Adı' : 'Product Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: '25%',
      render: (text, record) => {
        // Dil seçimine göre ürün adını göster
        const productName = tableLanguage === 'tr' 
          ? (record.name_tr || record.name || record.name_en || 'Ad bulunamadı')
          : (record.name_en || record.name || record.name_tr || 'Name not found');
        
        return productName;
      },
    },
    {
      title: tableLanguage === 'tr' ? 'Açıklama' : 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: '30%',
      render: (text, record) => {
        // Dil seçimine göre ürün açıklamasını göster
        const description = tableLanguage === 'tr' 
          ? (record.description_tr || record.description || record.description_en || 'Açıklama bulunamadı')
          : (record.description_en || record.description || record.description_tr || 'Description not found');
        
        return description;
      },
    },
    {
      title: tableLanguage === 'tr' ? 'Fiyat' : 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '15%',
      render: (price, record) => (
        `${getCurrencySymbol(record.currency)} ${parseFloat(price).toFixed(2)}`
      ),
    },
    {
      title: tableLanguage === 'tr' ? 'Fiyat Listesi' : 'Price List',
      dataIndex: 'pricelist_name',
      key: 'pricelist_name',
      width: '20%',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: tableLanguage === 'tr' ? 'Tarih' : 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '10%',
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
    }
  ];

  return (
    <Row gutter={[16, 16]} className={styles.recentProductsSection}>
      <Col span={24}>
        <Card 
          title={tableLanguage === 'tr' ? 'Son Eklenen Ürünler' : 'Recently Added Products'}
          className={styles.recentProductsCard}
          extra={
            <Compact size="small" className={styles.languageToggle}>
              <Button
                type={tableLanguage === 'en' ? 'primary' : 'default'}
                onClick={() => setTableLanguage('en')}
                className={`${styles.languageButton} ${
                  tableLanguage === 'en' 
                    ? styles.languageButtonActive 
                    : styles.languageButtonInactive
                }`}
              >
                EN
              </Button>
              <Button
                type={tableLanguage === 'tr' ? 'primary' : 'default'}
                onClick={() => setTableLanguage('tr')}
                className={`${styles.languageButton} ${
                  tableLanguage === 'tr' 
                    ? `${styles.languageButtonActive} ${styles.languageButtonTr}`
                    : styles.languageButtonInactive
                }`}
              >
                TR
              </Button>
            </Compact>
          }
        >
          <Table
            columns={recentProductsColumns}
            dataSource={stats?.recentItems || []}
            rowKey={(record) => `${record.name_tr || record.name_en || record.name || ''}-${record.created_at || ''}-${record.price || ''}`}
            loading={loading}
            pagination={false}
            size="small"
            className={styles.table}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default RecentProducts;