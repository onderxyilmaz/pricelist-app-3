import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notification';

const CompanyModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  editingCompany, 
  form 
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingCompany) {
        // Editing existing company
        form.setFieldsValue({
          company_name: editingCompany.company_name
        });
      } else {
        // Adding new company
        form.resetFields();
      }
    }
  }, [visible, editingCompany, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
    } catch (error) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      console.error('Error in modal submit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingCompany ? 'Firma Düzenle' : 'Yeni Firma'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={editingCompany ? 'Güncelle' : 'Ekle'}
      cancelText="İptal"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label="Firma Adı"
          name="company_name"
          rules={[
            { required: true, message: 'Firma adı gereklidir' },
            { min: 2, message: 'Firma adı en az 2 karakter olmalıdır' },
            { max: 255, message: 'Firma adı en fazla 255 karakter olabilir' }
          ]}
        >
          <Input 
            placeholder="Firma adını girin"
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompanyModal;