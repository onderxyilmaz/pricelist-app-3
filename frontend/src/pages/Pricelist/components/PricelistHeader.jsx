import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../Pricelist.module.css';

const { Title } = Typography;

const PricelistHeader = ({ onCreateClick }) => {
  return (
    <div className={styles.header}>
      <Title level={2} className={styles.title}>Fiyat Listeleri</Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onCreateClick}
        className={styles.newButton}
      >
        Yeni Fiyat Listesi
      </Button>
    </div>
  );
};

export default PricelistHeader;
