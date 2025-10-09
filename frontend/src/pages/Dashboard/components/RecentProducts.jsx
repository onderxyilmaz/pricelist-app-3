import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space } from 'antd';
import styles from '../Dashboard.module.css';

const RecentProducts = ({ stats, loading }) => {
  const [tableLanguage, setTableLanguage] = useState('en');

  const getCurrencySymbol = (currency) => {
    const symbols = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'TRY': '₺', 'TL': '₺' };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  const recentProductsColumns = [
    {
      title: 'Ürün Adı',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text, record) => {
        // Dil seçimine göre ürün adını göster
        const productName = tableLanguage === 'tr' 
          ? (record.name_tr || record.name || record.name_en || 'Ad bulunamadı')
          : (record.name_en || record.name || record.name_tr || 'Name not found');
        
        return productName;
      },
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        `${getCurrencySymbol(record.currency)} ${parseFloat(price).toFixed(2)}`
      ),
    },
    {
      title: 'Fiyat Listesi',
      dataIndex: 'pricelist_name',
      key: 'pricelist_name',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Tarih',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
    }
  ];

  return (
    <Row gutter={[16, 16]} className={styles.recentProductsSection}>
      <Col span={24}>
        <Card 
          title="Son Eklenen Ürünler"
          className={styles.recentProductsCard}
          extra={
            <Space>
              <Button.Group size="small" className={styles.languageToggle}>
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
              </Button.Group>
            </Space>
          }
        >
          <Table
            columns={recentProductsColumns}
            dataSource={stats?.recentItems || []}
            rowKey={(record, index) => index}
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