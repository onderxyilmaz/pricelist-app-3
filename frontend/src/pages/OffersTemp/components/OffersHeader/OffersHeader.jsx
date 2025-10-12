// OffersHeader component
import React from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from './OffersHeader.module.css';

const { Title } = Typography;

const OffersHeader = ({ 
  onCreateOffer, 
  onRefresh, 
  loading = false,
  totalCount = 0 
}) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerLeft}>
        <Title level={3} className={styles.title}>
          Offers
        </Title>
        <span className={styles.subtitle}>
          {totalCount} offers found
        </span>
      </div>
      
      <div className={styles.headerRight}>
        <Space size="small">
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            className={styles.refreshButton}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateOffer}
            className={styles.createButton}
          >
            Create Offer
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default OffersHeader;