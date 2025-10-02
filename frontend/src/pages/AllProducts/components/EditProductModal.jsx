import React from 'react';
import { Modal, Form, Input, Button, Row, Col, Select, InputNumber, Space } from 'antd';
import styles from '../AllProducts.module.css';

const { Option } = Select;

const EditProductModal = ({
  visible,
  onCancel,
  onSubmit,
  editingProduct,
  form,
  nameLanguage,
  onNameLanguageChange,
  descriptionLanguage,
  onDescriptionLanguageChange
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

        <Form.Item label="Ürün Adı">
          <div className={styles.formLanguageToggle}>
            <Button.Group className={styles.formLanguageButtonGroup}>
              <Button 
                type={nameLanguage === 'en' ? 'primary' : 'default'}
                onClick={() => onNameLanguageChange('en')}
                className={`${styles.languageButton} ${
                  nameLanguage === 'en' ? styles.languageButtonEn : styles.languageButtonEnDefault
                }`}
              >
                EN
              </Button>
              <Button 
                type={nameLanguage === 'tr' ? 'primary' : 'default'}
                onClick={() => onNameLanguageChange('tr')}
                className={`${styles.languageButton} ${
                  nameLanguage === 'tr' ? styles.languageButtonTr : styles.languageButtonTrDefault
                }`}
              >
                TR
              </Button>
            </Button.Group>
          </div>
          
          <Form.Item
            name="name_tr"
            className={nameLanguage === 'tr' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input 
              placeholder="Türkçe ürün adı" 
              autoComplete="off"
            />
          </Form.Item>
          
          <Form.Item
            name="name_en"
            className={nameLanguage === 'en' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input 
              placeholder="İngilizce ürün adı" 
              autoComplete="off"
            />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Açıklama">
          <div className={styles.formLanguageToggle}>
            <Button.Group className={styles.formLanguageButtonGroup}>
              <Button 
                type={descriptionLanguage === 'en' ? 'primary' : 'default'}
                onClick={() => onDescriptionLanguageChange('en')}
                className={`${styles.languageButton} ${
                  descriptionLanguage === 'en' ? styles.languageButtonEn : styles.languageButtonEnDefault
                }`}
              >
                EN
              </Button>
              <Button 
                type={descriptionLanguage === 'tr' ? 'primary' : 'default'}
                onClick={() => onDescriptionLanguageChange('tr')}
                className={`${styles.languageButton} ${
                  descriptionLanguage === 'tr' ? styles.languageButtonTr : styles.languageButtonTrDefault
                }`}
              >
                TR
              </Button>
            </Button.Group>
          </div>
          
          <Form.Item
            name="description_tr"
            className={descriptionLanguage === 'tr' ? styles.visibleFormItem : styles.hiddenFormItem}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Türkçe açıklama (opsiyonel)" 
              autoComplete="off"
            />
          </Form.Item>
          
          <Form.Item
            name="description_en"
            className={descriptionLanguage === 'en' ? styles.visibleFormItem : styles.hiddenFormItem}
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