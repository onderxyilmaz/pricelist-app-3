import React from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import styles from '../Companies.module.css';

const CompanyModal = ({
  visible,
  onCancel,
  onSubmit,
  editingCompany,
  form
}) => {
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      className={styles.modal}
      title={editingCompany ? 'Firma Düzenle' : 'Yeni Firma'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            const firstInput = document.querySelector('input[placeholder="Firma adını girin"]');
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
            label="Firma Adı"
            rules={[{ required: true, message: 'Firma adı gereklidir!' }]}
            className={styles.formItem}
          >
            <Input 
              className={styles.input}
              placeholder="Firma adını girin" 
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
                {editingCompany ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default CompanyModal;