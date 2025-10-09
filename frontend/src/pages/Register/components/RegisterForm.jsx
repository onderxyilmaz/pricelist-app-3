import React, { useState } from 'react';
import { Form, Input, Button, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../../../utils/api';
import NotificationService from '../../../utils/notification';
import styles from '../Register.module.css';

const RegisterForm = ({ onRegister }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Form değerlerini izle
  const watchedValues = Form.useWatch([], form);
  const [isFormValid, setIsFormValid] = useState(false);

  // Form validasyonunu kontrol et
  React.useEffect(() => {
    const firstName = watchedValues?.firstName;
    const lastName = watchedValues?.lastName;
    const email = watchedValues?.email;
    const password = watchedValues?.password;
    const confirmPassword = watchedValues?.confirmPassword;
    
    // Tüm alanların geçerli olduğunu kontrol et
    const firstNameValid = firstName && firstName.trim().length >= 2;
    const lastNameValid = lastName && lastName.trim().length >= 2;
    const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password && password.length >= 6;
    const confirmPasswordValid = confirmPassword && password === confirmPassword;
    
    setIsFormValid(firstNameValid && lastNameValid && emailValid && passwordValid && confirmPasswordValid);
  }, [watchedValues]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // confirmPassword alanını çıkar, sadece backend'in beklediği alanları gönder
      const { confirmPassword, ...registerData } = values;
      
      const response = await authApi.register(registerData);
      if (response.data.success) {
        NotificationService.registerSuccess(response.data.user.first_name);
        onRegister(response.data.user);
      } else {
        NotificationService.registerError(response.data.message);
      }
    } catch (error) {
      console.error('Register error:', error);
      if (error.code === 'ERR_NETWORK') {
        NotificationService.connectionError();
      } else {
        NotificationService.registerError(error.response?.data?.message || 'Beklenmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      name="register"
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      className={styles.form}
    >
      <Row gutter={16} className={styles.nameRow}>
        <Col xs={24} sm={12} className={styles.nameCol}>
          <Form.Item
            label="Ad"
            name="firstName"
            className={styles.formItem}
            rules={[
              { required: true, message: 'Ad gereklidir!' },
              { min: 2, message: 'Ad en az 2 karakter olmalıdır!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Adınız"
              size="large"
              autoComplete="off"
              autoFocus
              className={styles.input}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} className={styles.nameCol}>
          <Form.Item
            label="Soyad"
            name="lastName"
            className={styles.formItem}
            rules={[
              { required: true, message: 'Soyad gereklidir!' },
              { min: 2, message: 'Soyad en az 2 karakter olmalıdır!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Soyadınız"
              size="large"
              autoComplete="off"
              className={styles.input}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="E-mail"
        name="email"
        className={styles.formItem}
        rules={[
          { required: true, message: 'E-mail adresi gereklidir!' },
          { type: 'email', message: 'Geçerli bir e-mail adresi girin!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined />} 
          placeholder="E-mail adresiniz"
          size="large"
          autoComplete="off"
          className={styles.input}
        />
      </Form.Item>

      <Form.Item
        label="Şifre"
        name="password"
        className={styles.formItem}
        rules={[
          { required: true, message: 'Şifre gereklidir!' },
          { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
        ]}
      >
        <Input.Password 
          prefix={<LockOutlined />} 
          placeholder="Şifreniz"
          size="large"
          autoComplete="off"
          className={styles.input}
        />
      </Form.Item>

      <Form.Item
        label="Şifre Tekrar"
        name="confirmPassword"
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
          prefix={<LockOutlined />} 
          placeholder="Şifrenizi tekrar girin"
          size="large"
          autoComplete="off"
          className={styles.input}
        />
      </Form.Item>

      <Form.Item className={styles.formItem}>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          disabled={!isFormValid || loading}
          size="large"
          block
          className={styles.registerButton}
        >
          Kayıt Ol
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;