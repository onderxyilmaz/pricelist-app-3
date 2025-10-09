import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  UnorderedListOutlined, 
  AppstoreOutlined, 
  DollarOutlined, 
  TrophyOutlined 
} from '@ant-design/icons';
import styles from '../Dashboard.module.css';

const StatsCards = ({ stats, loading }) => {
  const getCurrencySymbol = (currency) => {
    const symbols = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'TRY': '₺', 'TL': '₺' };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  return (
    <Row gutter={[16, 16]} className={styles.statsSection}>
      <Col xs={24} sm={12} lg={6}>
        <Card className={styles.statsCard}>
          <Statistic
            title="Toplam Fiyat Listesi"
            value={stats?.totalPricelists || 0}
            prefix={<UnorderedListOutlined />}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className={styles.statsCard}>
          <Statistic
            title="Toplam Ürün"
            value={stats?.totalItems || 0}
            prefix={<AppstoreOutlined />}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className={styles.statsCard}>
          <Statistic
            title="Toplam Stok Değeri"
            value={stats?.totalValue || 0}
            precision={2}
            prefix="€"
            suffix="EUR"
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className={styles.statsCard}>
          <Statistic
            title="En Pahalı Ürün"
            value={stats?.mostExpensive?.price || 0}
            precision={2}
            prefix={<TrophyOutlined />}
            suffix={getCurrencySymbol(stats?.mostExpensive?.currency)}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;