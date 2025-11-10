import React from 'react';
import { Modal, Form, Input, Button, Space, InputNumber, Select } from 'antd';
import styles from '../PricelistDetail.module.css';

const { Option } = Select;

const ProductModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  editingItem, 
  form,
  formLanguage,
  onLanguageChange 
}) => {
  return (
    <Modal
      title={editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      className={styles.modal}
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            const productIdInput = document.querySelector('input[placeholder="Ürün ID"]');
            if (productIdInput) productIdInput.focus();
          }, 100);
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
        initialValues={{ unit: 'adet' }}
        className={styles.form}
      >
        <Form.Item
          name="product_id"
          label="Product ID"
          className={styles.formItem}
        >
          <Input 
            placeholder="Ürün ID" 
            autoComplete="off"
            className={styles.input}
          />
        </Form.Item>

        {/* Tek dil seçimi - hem ürün adı hem açıklama için */}
        <Form.Item
          label="Dil Seçimi"
          className={styles.formItem}
        >
          <Button.Group>
            <Button 
              type={formLanguage === 'en' ? 'primary' : 'default'}
              onClick={() => onLanguageChange('en')}
              className={`${styles.languageButton} ${
                formLanguage === 'en' 
                  ? styles.languageButtonActive 
                  : styles.languageButtonInactive
              }`}
            >
              EN
            </Button>
            <Button 
              type={formLanguage === 'tr' ? 'primary' : 'default'}
              onClick={() => onLanguageChange('tr')}
              className={`${styles.languageButton} ${
                formLanguage === 'tr' 
                  ? `${styles.languageButtonActive} ${styles.languageButtonTr}`
                  : styles.languageButtonInactive
              }`}
            >
              TR
            </Button>
          </Button.Group>
        </Form.Item>

        <Form.Item
          label="Ürün Adı"
          className={styles.formItem}
        >
          {/* Her iki dil için de form item'ları, sadece biri görünür */}
          <Form.Item
            name="name_tr"
            style={{ marginBottom: 0, display: formLanguage === 'tr' ? 'block' : 'none' }}
          >
            <Input 
              placeholder="Türkçe ürün adı" 
              autoComplete="off"
              className={styles.input}
            />
          </Form.Item>
          
          <Form.Item
            name="name_en"
            style={{ marginBottom: 0, display: formLanguage === 'en' ? 'block' : 'none' }}
          >
            <Input 
              placeholder="İngilizce ürün adı" 
              autoComplete="off"
              className={styles.input}
            />
          </Form.Item>
        </Form.Item>

        <Form.Item
          label="Açıklama"
          className={styles.formItem}
        >
          {/* Her iki dil için de form item'ları, sadece biri görünür */}
          <Form.Item
            name="description_tr"
            style={{ marginBottom: 0, display: formLanguage === 'tr' ? 'block' : 'none' }}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Türkçe açıklama (opsiyonel)" 
              autoComplete="off"
              className={styles.textarea}
            />
          </Form.Item>
          
          <Form.Item
            name="description_en"
            style={{ marginBottom: 0, display: formLanguage === 'en' ? 'block' : 'none' }}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="İngilizce açıklama (opsiyonel)" 
              autoComplete="off"
              className={styles.textarea}
            />
          </Form.Item>
        </Form.Item>

        <Form.Item
          name="price"
          label="Fiyat"
          className={styles.formItem}
          rules={[
            { required: true, message: 'Fiyat gereklidir!' },
            { type: 'number', min: 0, message: 'Fiyat 0\'dan büyük olmalıdır!' }
          ]}
        >
          <InputNumber
            placeholder="Ürün fiyatı"
            min={0}
            precision={2}
            step={0.01}
            className={styles.inputNumber}
          />
        </Form.Item>

        <Form.Item
          name="stock"
          label="Stok"
          className={styles.formItem}
          rules={[
            { required: true, message: 'Stok gereklidir!' },
            { type: 'number', min: 0, message: 'Stok 0\'dan büyük veya eşit olmalıdır!' }
          ]}
        >
          <InputNumber
            placeholder="Stok miktarı"
            min={0}
            precision={0}
            className={styles.inputNumber}
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Birim"
          className={styles.formItem}
          rules={[{ required: true, message: 'Birim gereklidir!' }]}
        >
          <Select 
            placeholder="Birim seçin"
            className={styles.select}
          >
            <Option value="adet">Adet</Option>
            <Option value="kg">Kilogram</Option>
            <Option value="lt">Litre</Option>
            <Option value="m">Metre</Option>
            <Option value="m2">Metrekare</Option>
            <Option value="m3">Metreküp</Option>
            <Option value="ton">Ton</Option>
            <Option value="paket">Paket</Option>
            <Option value="kutu">Kutu</Option>
            <Option value="çift">Çift</Option>
          </Select>
        </Form.Item>

        <Form.Item className={styles.formFooter}>
          <Space>
            <Button 
              onClick={onCancel}
              className={styles.cancelButton}
            >
              İptal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              className={styles.submitButton}
            >
              {editingItem ? 'Güncelle' : 'Ekle'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductModal;