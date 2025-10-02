import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../Companies.module.css';

const { Title } = Typography;

const CompanyHeader = ({ onCreateClick }) => {
  return (
    <div className={styles.header}>
      <Title level={2} className={styles.title}>Firmalar</Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onCreateClick}
        className={styles.newButton}
      >
        Yeni Firma
      </Button>
    </div>
  );
};

export default CompanyHeader;