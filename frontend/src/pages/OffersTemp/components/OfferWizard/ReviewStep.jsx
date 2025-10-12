// ReviewStep component
import React from 'react';
import { Card, Descriptions, Table, Divider, Typography } from 'antd';

const { Title, Text } = Typography;

const ReviewStep = ({ formData }) => {
  const productColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      align: 'right',
      render: (price) => `₺${price}`,
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (_, record) => `₺${(record.quantity * record.unit_price).toFixed(2)}`,
    },
  ];

  const calculateTotals = () => {
    const subtotal = formData.products.reduce((sum, product) => 
      sum + (product.quantity * product.unit_price), 0
    );
    const discount = subtotal * 0.1; // Example 10% discount
    const tax = (subtotal - discount) * 0.18; // 18% tax
    const total = subtotal - discount + tax;
    
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div style={{ margin: '0 20px' }}>
      <Card title="Review Offer" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Customer">
            {formData.customer || 'Not selected'}
          </Descriptions.Item>
          <Descriptions.Item label="Offer Title">
            Offer Title
          </Descriptions.Item>
          <Descriptions.Item label="Valid Until">
            Date
          </Descriptions.Item>
          <Descriptions.Item label="Delivery Days">
            7 days
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Products" style={{ marginBottom: 16 }}>
        <Table
          columns={productColumns}
          dataSource={formData.products}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No products added' }}
        />
        
        <Divider />
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: 8 }}>
            <Text>Subtotal: ₺{totals.subtotal.toFixed(2)}</Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text>Discount: -₺{totals.discount.toFixed(2)}</Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text>Tax: ₺{totals.tax.toFixed(2)}</Text>
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Total: ₺{totals.total.toFixed(2)}
            </Title>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReviewStep;