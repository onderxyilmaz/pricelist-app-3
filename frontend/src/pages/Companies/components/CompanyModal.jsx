import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, Dropdown } from 'antd';
import { CameraOutlined, DeleteOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons';
import NotificationService from '../../../utils/notification';
import { companyApi } from '../../../utils/api';
import { API_BASE_URL } from '../../../config/env';
import styles from '../Companies.module.css';

const CompanyModal = ({
  visible,
  onCancel,
  onSubmit,
  editingCompany,
  onComplete
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (editingCompany) {
        // Editing existing company
        form.setFieldsValue({
          company_name: editingCompany.company_name
        });
        // Set logo preview if exists
        if (editingCompany.logo_filename) {
          setLogoPreview(`${API_BASE_URL}/uploads/company_logos/${editingCompany.logo_filename}`);
        } else {
          setLogoPreview(null);
        }
        setLogoFile(null);
        setLogoRemoved(false);
      } else {
        // Adding new company
        form.resetFields();
        setLogoPreview(null);
        setLogoFile(null);
        setLogoRemoved(false);
      }
    } else {
      // Reset states when modal closes
      setLogoPreview(null);
      setLogoFile(null);
      setLogoRemoved(false);
    }
  }, [visible, editingCompany, form]);

  const handleCancel = () => {
    form.resetFields();
    setLogoPreview(null);
    setLogoFile(null);
    setLogoRemoved(false);
    onCancel();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya doğrulama
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      NotificationService.error('Hata', 'Sadece JPG ve PNG dosyaları yüklenebilir');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      NotificationService.error('Hata', 'Dosya boyutu 5MB\'dan büyük olamaz');
      return;
    }

    // Preview için dosyayı oku
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
      setLogoFile(file);
      setLogoRemoved(false); // New file selected, logo not removed
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setLogoRemoved(true); // Mark logo as removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoAction = (action) => {
    if (action === 'upload' || action === 'change') {
      fileInputRef.current?.click();
    } else if (action === 'remove') {
      handleLogoRemove();
    }
  };

  const getLogoMenuItems = () => {
    if (logoPreview || editingCompany?.logo_filename) {
      return [
        {
          key: 'change',
          icon: <EditOutlined />,
          label: 'Değiştir',
          onClick: () => handleLogoAction('change')
        },
        {
          key: 'remove',
          icon: <DeleteOutlined />,
          label: 'Logoyu Kaldır',
          onClick: () => handleLogoAction('remove')
        }
      ];
    } else {
      return [
        {
          key: 'upload',
          icon: <CameraOutlined />,
          label: 'Logo Yükle',
          onClick: () => handleLogoAction('upload')
        }
      ];
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // First, create or update company
      const companyData = await onSubmit(values);
      
      if (!companyData?.id) {
        return; // Company creation/update failed
      }
      
      // Handle logo operations
      if (logoFile) {
        // New logo file selected, upload it
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        try {
          const uploadResponse = await companyApi.uploadLogo(companyData.id, formData);
          if (uploadResponse.data.success) {
            NotificationService.success('Başarılı', editingCompany ? 'Firma ve logo güncellendi' : 'Firma oluşturuldu ve logo yüklendi');
          }
        } catch (error) {
          console.error('Error uploading logo:', error);
          NotificationService.error('Hata', 'Logo yüklenirken hata oluştu');
        }
      } else if (logoRemoved && editingCompany?.logo_filename) {
        // Logo was explicitly removed
        try {
          const deleteResponse = await companyApi.deleteLogo(companyData.id);
          if (deleteResponse.data.success) {
            NotificationService.success('Başarılı', 'Firma güncellendi ve logo silindi');
          }
        } catch (error) {
          console.error('Error deleting logo:', error);
          NotificationService.error('Hata', 'Logo silinirken hata oluştu');
        }
      } else {
        // No logo operations, just show success message
        NotificationService.success('Başarılı', editingCompany ? 'Firma güncellendi' : 'Firma oluşturuldu');
      }
      
      // Notify parent that all operations are complete
      if (onComplete) {
        onComplete();
      }
      
    } catch (error) {
      console.error('Error in modal submit:', error);
      // Error already handled in parent component
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
      destroyOnHidden
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

        <Form.Item label="Logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              {logoPreview ? (
                <div className={styles.modalCompanyLogo}>
                  <img
                    src={logoPreview}
                    alt="Company Logo Preview"
                  />
                </div>
              ) : (
                <div className={styles.modalCompanyLogoPlaceholder}>
                  <PictureOutlined />
                </div>
              )}
              <Dropdown
                menu={{ items: getLogoMenuItems() }}
                placement="topLeft"
                trigger={['click']}
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </Dropdown>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                JPG veya PNG formatında logo yükleyebilirsiniz
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Maksimum dosya boyutu: 5MB
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
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