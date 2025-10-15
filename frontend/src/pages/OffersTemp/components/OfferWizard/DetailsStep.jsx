// DetailsStep - Step 1: Teklif No, Müşteri ve Firma Bilgileri
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, AutoComplete, Space, Button } from 'antd';
import { offersService } from '../../services/offersService';
import NotificationService from '../../../../utils/notification';

const { Option } = Select;

const DetailsStep = ({ 
  form, 
  onSubmit, 
  onCancel, 
  editingOffer,
  companies,
  isTemplateMode
}) => {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Müşteri arama fonksiyonu
  const handleSearchCustomers = async (searchText) => {
    try {
      const options = await offersService.searchCustomers(searchText);
      setCustomerOptions(options);
    } catch (error) {
      console.error('Customer search error:', error);
      setCustomerOptions([]);
    }
  };

  // Form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Düzenleme modunda teklif no kontrolü yapma
      if (!editingOffer) {
        const isAvailable = await offersService.checkOfferNumber(values.offer_no);
        if (!isAvailable) {
          NotificationService.error('Hata', 'Bu teklif numarası zaten kullanılıyor. Lütfen farklı bir numara girin.');
          setLoading(false);
          return;
        }
      }
      
      onSubmit(values);
    } catch (error) {
      console.error('Form submit error:', error);
      NotificationService.error('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Autofocus - Teklif No alanı
  useEffect(() => {
    if (!editingOffer) {
      const tryFocus = (attempt = 0) => {
        const offerNoInput = document.querySelector('input[placeholder="Teklif numarasını girin"]');
        if (offerNoInput && offerNoInput.offsetParent !== null) {
          offerNoInput.focus();
          offerNoInput.select();
        } else if (attempt < 5) {
          setTimeout(() => tryFocus(attempt + 1), 100);
        }
      };
      setTimeout(() => tryFocus(), 50);
    }
  }, [editingOffer]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      <Form.Item
        name="offer_no"
        label="Teklif No"
        rules={[{ required: true, message: 'Teklif No gereklidir!' }]}
      >
        <Input 
          placeholder="Teklif numarasını girin" 
          autoComplete="off"
          disabled={editingOffer ? true : false}
        />
      </Form.Item>

      <Form.Item
        name="customer"
        label="Müşteri"
      >
        <AutoComplete
          options={customerOptions}
          onSearch={handleSearchCustomers}
          placeholder="Müşteri adını girin veya seçin"
          allowClear
          filterOption={false}
          autoComplete="off"
        />
      </Form.Item>

      <Form.Item
        name="company_id"
        label="Firma"
        rules={[{ required: true, message: 'Firma seçimi gereklidir!' }]}
      >
        <Select 
          placeholder="Teklifin hangi firmadan hazırlandığını seçin"
          allowClear
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {companies.map(company => (
            <Option key={company.id} value={company.id}>
              {company.company_name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>İptal</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isTemplateMode ? 'Sonraki Adım (Template Seçimi)' : 'Sonraki Adım'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default DetailsStep;