import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import styles from '../Dashboard.module.css';

const { Compact } = Space;

const RecentOffers = ({ stats, loading }) => {
  const [tableLanguage, setTableLanguage] = useState('en');

  // Debug: Check if data is coming
  React.useEffect(() => {
    console.log('RecentOffers - stats:', stats);
    console.log('RecentOffers - recentOffers:', stats?.recentOffers);
  }, [stats]);

  const recentOffersColumns = [
    {
      title: tableLanguage === 'tr' ? 'Teklif No' : 'Offer No',
      dataIndex: 'offer_no',
      key: 'offer_no',
      width: '20%',
    },
    {
      title: tableLanguage === 'tr' ? 'Müşteri' : 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: '25%',
      ellipsis: true,
    },
    {
      title: tableLanguage === 'tr' ? 'Firma' : 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      width: '20%',
      ellipsis: true,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: tableLanguage === 'tr' ? 'Durum' : 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => {
        const statusConfig = {
          draft: { 
            color: 'default', 
            text: tableLanguage === 'tr' ? 'Taslak' : 'Draft' 
          },
          sent: { 
            color: 'processing', 
            text: tableLanguage === 'tr' ? 'Gönderildi' : 'Sent' 
          },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: tableLanguage === 'tr' ? 'Tarih' : 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
    }
  ];

  return (
    <Row gutter={[16, 16]} className={styles.recentOffersSection}>
      <Col span={24}>
        <Card 
          title={
            <span>
              <FileTextOutlined style={{ marginRight: 8 }} />
              {tableLanguage === 'tr' ? 'Son Oluşturulan Teklifler' : 'Recently Created Offers'}
            </span>
          }
          className={styles.recentOffersCard}
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
            columns={recentOffersColumns}
            dataSource={stats?.recentOffers || []}
            rowKey={(record) => `offer-${record.id}-${record.created_at}`}
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

export default RecentOffers;

