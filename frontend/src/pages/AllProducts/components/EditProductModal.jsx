import React from 'react';
import { Modal, Form, Input, Button, Row, Col, Select, InputNumber, Space } from 'antd';
import styles from '../AllProducts.module.css';

const { Option } = Select;
const { Compact } = Space;

const EditProductModal = ({
  visible,
  onCancel,
  onSubmit,
  editingProduct,
  form,
  formLanguage,
  onLanguageChange
}) => {
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      className={styles.editModal}
      title="Ürün Düzenle"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            const firstInput = document.querySelector('input[placeholder="Ürün ID"]');
            if (firstInput) {
              firstInput.focus();
              firstInput.select();
            }
          }, 100);
        }
      }}
    >
      <Form
        className={styles.editForm}
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="product_id"
          label="Product ID"
        >
          <Input 
            placeholder="Ürün ID" 
            autoComplete="off"
          />
        </Form.Item>

        {/* Tek dil seçimi - hem ürün adı hem açıklama için */}
        <Form.Item label="Dil Seçimi">
          <div className={styles.formLanguageToggle}>
            <Compact className={styles.formLanguageButtonGroup}>
              <Button 
                type={formLanguage === 'en' ? 'primary' : 'default'}
                onClick={() => onLanguageChange('en')}
                className={`${styles.languageButton} ${
                  formLanguage === 'en' ? styles.languageButtonEn : styles.languageButtonEnDefault
                }`}
              >
                EN
              </Button>
              <Button 
                type={formLanguage === 'tr' ? 'primary' : 'default'}
                onClick={() => onLanguageChange('tr')}
                className={`${styles.languageButton} ${
                  formLanguage === 'tr' ? styles.languageButtonTr : styles.languageButtonTrDefault
                }`}
              >
                TR
              </Button>
            </Compact>
          </div>
        </Form.Item>

        <Form.Item label="Ürün Adı">
          <Form.Item
            name="name_tr"
            className={formLanguage === 'tr' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input 
              placeholder="Türkçe ürün adı" 
              autoComplete="off"
            />
          </Form.Item>
          
          <Form.Item
            name="name_en"
            className={formLanguage === 'en' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input 
              placeholder="İngilizce ürün adı" 
              autoComplete="off"
            />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Açıklama">
          <Form.Item
            name="description_tr"
            className={formLanguage === 'tr' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Türkçe açıklama (opsiyonel)" 
              autoComplete="off"
            />
          </Form.Item>
          
          <Form.Item
            name="description_en"
            className={formLanguage === 'en' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="İngilizce açıklama (opsiyonel)" 
              autoComplete="off"
            />
          </Form.Item>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="price"
              label="Fiyat"
              rules={[{ required: true, message: 'Fiyat gereklidir!' }]}
            >
              <InputNumber 
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                step={0.01}
                precision={2}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                autoComplete="off"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="stock"
              label="Stok"
            >
              <InputNumber 
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
                step={1}
                autoComplete="off"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="unit"
          label="Birim"
        >
          <Select placeholder="Birim seçin">
            <Option value="adet">Adet</Option>
            <Option value="kg">Kilogram</Option>
            <Option value="m">Metre</Option>
            <Option value="m2">Metrekare</Option>
            <Option value="m3">Metreküp</Option>
            <Option value="lt">Litre</Option>
            <Option value="paket">Paket</Option>
            <Option value="kutu">Kutu</Option>
            <Option value="takım">Takım</Option>
            <Option value="çift">Çift</Option>
          </Select>
        </Form.Item>

        <Form.Item className={styles.formActions}>
          <Space>
            <Button onClick={handleCancel}>
              İptal
            </Button>
            <Button type="primary" htmlType="submit">
              Güncelle
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProductModal;
