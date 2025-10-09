import React from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import styles from '../Customers.module.css';

const CustomerModal = ({
  visible,
  onCancel,
  onSubmit,
  editingCustomer,
  form
}) => {
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      className={styles.modal}
      title={editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            const firstInput = document.querySelector('input[placeholder="Müşteri adını girin"]');
            if (firstInput) {
              firstInput.focus();
              firstInput.select();
            }
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
            label="Müşteri Adı"
            rules={[{ required: true, message: 'Müşteri adı gereklidir!' }]}
            className={styles.formItem}
          >
            <Input 
              className={styles.input}
              placeholder="Müşteri adını girin" 
              autoComplete="off"
              autoFocus
            />
          </Form.Item>

          <Form.Item className={styles.formActions}>
            <div className={styles.formActionsContainer}>
              <Button onClick={handleCancel}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCustomer ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default CustomerModal;
