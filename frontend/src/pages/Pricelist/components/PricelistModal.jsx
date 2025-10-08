import React from 'react';
import { Modal, Form, Input, Button, Space, Select, ColorPicker } from 'antd';
import styles from '../Pricelist.module.css';

const PricelistModal = ({
  visible,
  onCancel,
  onSubmit,
  editingPricelist,
  form
}) => {
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const currencyOptions = [
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'USD', label: 'USD - Amerikan Doları' },
    { value: 'TRY', label: 'TRY - Türk Lirası' },
    { value: 'GBP', label: 'GBP - İngiliz Sterlini' },
    { value: 'JPY', label: 'JPY - Japon Yeni' },
    { value: 'CHF', label: 'CHF - İsviçre Frangı' },
    { value: 'CAD', label: 'CAD - Kanada Doları' },
    { value: 'AUD', label: 'AUD - Avustralya Doları' },
    { value: 'SEK', label: 'SEK - İsveç Kronu' },
    { value: 'NOK', label: 'NOK - Norveç Kronu' },
    { value: 'DKK', label: 'DKK - Danimarka Kronu' },
    { value: 'PLN', label: 'PLN - Polonya Zlotisi' },
    { value: 'CZK', label: 'CZK - Çek Kronu' },
    { value: 'HUF', label: 'HUF - Macar Forinti' },
    { value: 'RUB', label: 'RUB - Rus Rublesi' },
    { value: 'CNY', label: 'CNY - Çin Yuanı' },
    { value: 'KRW', label: 'KRW - Güney Kore Wonu' },
    { value: 'INR', label: 'INR - Hindistan Rupisi' },
    { value: 'BRL', label: 'BRL - Brezilya Reali' },
    { value: 'MXN', label: 'MXN - Meksika Pesosu' },
    { value: 'ZAR', label: 'ZAR - Güney Afrika Randı' },
    { value: 'SAR', label: 'SAR - Suudi Arabistan Riyali' },
    { value: 'AED', label: 'AED - BAE Dirhemi' },
    { value: 'QAR', label: 'QAR - Katar Riyali' },
    { value: 'KWD', label: 'KWD - Kuveyt Dinarı' },
  ];

  return (
    <Modal
      className={styles.modal}
      title={editingPricelist ? 'Fiyat Listesi Düzenle' : 'Yeni Fiyat Listesi'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            const nameInput = document.querySelector('input[placeholder="Fiyat listesi adını girin"]');
            if (nameInput) nameInput.focus();
          }, 100);
        }
      }}
    >
      <div className={styles.modalContent}>
        <Form
        className={styles.form}
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Fiyat Listesi Adı"
            rules={[{ required: true, message: 'Fiyat listesi adı gereklidir!' }]}
            className={styles.formItem}
          >
            <Input 
              className={styles.input}
              placeholder="Fiyat listesi adını girin" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
            className={styles.formItem}
          >
            <Input.TextArea 
              className={styles.textarea}
              rows={3} 
              placeholder="Açıklama (opsiyonel)" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Para Birimi"
            rules={[{ required: true, message: 'Para birimi gereklidir!' }]}
            className={styles.formItem}
          >
            <Select 
              className={styles.currencySelect}
              placeholder="Para birimi seçin"
            >
              {currencyOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="color"
            label="Renk"
            rules={[{ required: true, message: 'Renk seçimi gereklidir!' }]}
            className={styles.formItem}
          >
            <ColorPicker 
              className={styles.colorPicker}
              showText 
              format="hex" 
              disabledAlpha 
            />
          </Form.Item>

          <Form.Item className={styles.formActions}>
            <div className={styles.formActionsContainer}>
              <Button onClick={handleCancel}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPricelist ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default PricelistModal;