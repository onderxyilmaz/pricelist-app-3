import React from 'react';
import { Modal, Form, Input, Button, Space, Select } from 'antd';
import styles from '../UserManagement.module.css';

const { Option } = Select;

const UserModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  editingUser, 
  form,
  currentUser 
}) => {
  const canEditUser = (user) => {
    return currentUser?.id !== user.id;
  };

  return (
    <Modal
      title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      className={styles.modal}
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            const firstInput = document.querySelector('input[placeholder="Adınızı girin"]');
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
        onFinish={onSubmit}
        autoComplete="off"
        className={styles.form}
      >
        <Form.Item
          name="first_name"
          label="Ad"
          className={styles.formItem}
          rules={[{ required: true, message: 'Ad gereklidir!' }]}
        >
          <Input 
            placeholder="Adınızı girin" 
            autoComplete="off"
            autoFocus
            className={styles.input}
          />
        </Form.Item>

        <Form.Item
          name="last_name"
          label="Soyad"
          className={styles.formItem}
          rules={[{ required: true, message: 'Soyad gereklidir!' }]}
        >
          <Input 
            placeholder="Soyadınızı girin" 
            autoComplete="off"
            className={styles.input}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="E-mail"
          className={styles.formItem}
          rules={[
            { required: true, message: 'E-mail gereklidir!' },
            { type: 'email', message: 'Geçerli bir e-mail adresi girin!' }
          ]}
        >
          <Input 
            placeholder="E-mail adresinizi girin" 
            autoComplete="off"
            disabled={editingUser !== null}
            className={styles.input}
          />
        </Form.Item>

        {!editingUser && (
          <>
            <Form.Item
              name="password"
              label="Şifre"
              className={styles.formItem}
              rules={[{ required: true, message: 'Şifre gereklidir!' }]}
            >
              <Input.Password 
                placeholder="Şifrenizi girin" 
                autoComplete="off"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Şifre Tekrar"
              className={styles.formItem}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Şifre tekrarı gereklidir!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                  },
                }),
              ]}
            >
              <Input.Password 
                placeholder="Şifrenizi tekrar girin" 
                autoComplete="off"
                className={styles.input}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="role"
          label="Rol"
          className={styles.formItem}
          rules={[{ required: true, message: 'Rol seçimi gereklidir!' }]}
          initialValue="user"
        >
          <Select 
            placeholder="Rol seçin"
            disabled={editingUser && !canEditUser(editingUser)}
            className={styles.select}
          >
            <Option value="user">Kullanıcı</Option>
            <Option value="super_admin">Süper Admin</Option>
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
              {editingUser ? 'Güncelle' : 'Oluştur'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserModal;