import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import NotificationService from '../../../utils/notification';

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

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Error in modal submit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingCompany ? 'Firma Düzenle' : 'Yeni Firma'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnClose
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
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        autoComplete="off"
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
            autoComplete="off"
            autoFocus
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={handleCancel}>
              İptal
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingCompany ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompanyModal;