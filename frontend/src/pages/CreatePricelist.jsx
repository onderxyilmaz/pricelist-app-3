import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const CreatePricelist = () => {
  return (
    <div>
      <Title level={2}>Yeni Fiyat Listesi</Title>
      <Card>
        <p>Yeni fiyat listesi formu burada olacak...</p>
      </Card>
    </div>
  );
};

export default CreatePricelist;