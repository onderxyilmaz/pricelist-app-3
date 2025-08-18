import React, { useEffect } from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const CreatePricelist = () => {
  useEffect(() => {
    document.title = 'Price List App v3 - Create Pricelist';
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

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