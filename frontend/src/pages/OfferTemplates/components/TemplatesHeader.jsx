import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../OfferTemplates.module.css';

const { Title } = Typography;

const TemplatesHeader = ({ onCreateTemplate }) => {
  return (
    <div className={styles.pageHeader}>
      <Title level={2} className={styles.pageTitle}>
        Teklif Templates
      </Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onCreateTemplate}
        className={styles.createButton}
      >
        Yeni Template
      </Button>
    </div>
  );
};

export default TemplatesHeader;