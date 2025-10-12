// CustomerStep component
import React from 'react';
import { Form, Select, Input, Card } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

const CustomerStep = ({ formData, setFormData }) => {
  const handleCustomerChange = (value) => {
    setFormData(prev => ({
      ...prev,
      customer: value
    }));
  };

  return (
    <Card title="Select Customer" style={{ margin: '0 20px' }}>
      <Form layout="vertical">
        <Form.Item 
          label="Customer" 
          required
          help="Select the customer for this offer"
        >
          <Select
            placeholder="Choose a customer"
            value={formData.customer}
            onChange={handleCustomerChange}
            showSearch
            filterOption={(input, option) =>
              option.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {/* TODO: Load customers from API */}
            <Option value="1">Customer 1</Option>
            <Option value="2">Customer 2</Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="Special Notes">
          <TextArea
            placeholder="Any special notes for this customer..."
            rows={4}
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CustomerStep;