import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ProductOutlined, DollarOutlined, StockOutlined } from '@ant-design/icons';
import styles from '../PricelistDetail.module.css';

const PricelistStats = ({ pricelist, items }) => {
  const totalItems = items?.length || 0;
  const totalValue = items?.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.stock)), 0) || 0;
  const totalStock = items?.reduce((sum, item) => sum + parseInt(item.stock), 0) || 0;

  const getCurrencySymbol = (currency) => {
    const symbols = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'TRY': '₺', 'TL': '₺' };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  return (
    <Row gutter={[16, 16]} className={styles.statsRow}>
      <Col xs={24} sm={8}>
        <Card className={styles.statsCard}>
          <Statistic
            title="Toplam Ürün"
            value={totalItems}
            prefix={<ProductOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className={styles.statsCard}>
          <Statistic
            title="Toplam Stok"
            value={totalStock}
            prefix={<StockOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className={styles.statsCard}>
          <Statistic
            title="Toplam Değer"
            value={totalValue}
            precision={2}
            prefix={<DollarOutlined />}
            suffix={getCurrencySymbol(pricelist?.currency)}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default PricelistStats;