// DetailsStep component
import React from 'react';
import { Form, Input, DatePicker, InputNumber, Card, Row, Col } from 'antd';

const { TextArea } = Input;

const DetailsStep = ({ formData, setFormData }) => {
  return (
    <Card title="Offer Details" style={{ margin: '0 20px' }}>
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Offer Title" required>
              <Input placeholder="Enter offer title" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Valid Until" required>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Discount (%)" >
              <InputNumber 
                min={0} 
                max={100} 
                style={{ width: '100%' }}
                placeholder="0"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tax Rate (%)">
              <InputNumber 
                min={0} 
                max={100} 
                style={{ width: '100%' }}
                placeholder="18"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Delivery Days">
              <InputNumber 
                min={1} 
                style={{ width: '100%' }}
                placeholder="7"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item label="Notes">
          <TextArea
            placeholder="Additional notes for this offer..."
            rows={4}
          />
        </Form.Item>
        
        <Form.Item label="Terms & Conditions">
          <TextArea
            placeholder="Terms and conditions..."
            rows={3}
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default DetailsStep;