import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../Customers.module.css';

const { Title } = Typography;

const CustomerHeader = ({ onCreateClick }) => {
  return (
    <div className={styles.header}>
      <Title level={2} className={styles.title}>Müşteriler</Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onCreateClick}
        className={styles.newButton}
      >
        Yeni Müşteri
      </Button>
    </div>
  );
};

export default CustomerHeader;