// ProductsStep component
import React from 'react';
import { Card, Button, Table, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const ProductsStep = ({ formData, setFormData }) => {
  const columns = [
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
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price) => `₺${price}`,
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_, record) => `₺${(record.quantity * record.unit_price).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record, index) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(index)}
        />
      ),
    },
  ];

  const removeProduct = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  return (
    <Card title="Select Products" style={{ margin: '0 20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Product
        </Button>
        
        <Table
          columns={columns}
          dataSource={formData.products}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No products added yet' }}
        />
      </Space>
    </Card>
  );
};

export default ProductsStep;