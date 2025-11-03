// OffersHeader - Sayfa başlığı ve Yeni Teklif butonu
import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const OffersHeader = ({ onCreateOffer, loading }) => {
  return (
    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Title level={2} style={{ margin: 0 }}>
        Teklifler
      </Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onCreateOffer}
        loading={loading}
      >
        Yeni Teklif
      </Button>
    </div>
  );
};

export default OffersHeader;
