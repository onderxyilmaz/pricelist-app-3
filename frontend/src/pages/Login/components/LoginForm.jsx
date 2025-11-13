import React, { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../../../utils/api';
import NotificationService from '../../../utils/notification';
import logger from '../../../utils/logger';
import styles from '../Login.module.css';

const LoginForm = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Form değerlerini izle
  const watchedValues = Form.useWatch([], form);
  const [isFormValid, setIsFormValid] = useState(false);

  // Form validasyonunu kontrol et
  React.useEffect(() => {
    const email = watchedValues?.email;
    const password = watchedValues?.password;
    
    // E-mail geçerli mi ve şifre en az 6 karakter mi kontrol et
    const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password && password.length >= 6;
    
    setIsFormValid(emailValid && passwordValid);
  }, [watchedValues]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      // Log only success status and user info (token is automatically redacted)
      logger.info('Login successful:', { 
        success: response.data.success,
        userId: response.data.user?.id,
        userName: response.data.user ? `${response.data.user.first_name} ${response.data.user.last_name}` : null
      });
      
      if (response.data.success && response.data.user && response.data.accessToken && response.data.refreshToken) {
        // Store tokens in localStorage
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        NotificationService.loginSuccess(`${response.data.user.first_name} ${response.data.user.last_name}`);
        onLogin(response.data.user);
      } else {
        logger.warn('Login failed:', response.data.message);
        NotificationService.loginError(response.data.message);
      }
    } catch (error) {
      logger.error('Login error:', error);
      if (error.code === 'ERR_NETWORK') {
        NotificationService.connectionError();
      } else {
        NotificationService.loginError('Beklenmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      name="login"
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      className={styles.form}
    >
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
          prefix={<UserOutlined />} 
          placeholder="E-mail adresiniz"
          size="large"
          autoComplete="off"
          autoFocus
          className={styles.input}
        />
      </Form.Item>

      <Form.Item
        label="Şifre"
        name="password"
        className={styles.formItem}
        rules={[
          { required: true, message: 'Şifre gereklidir!' }
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

      <Form.Item className={styles.formItem}>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          disabled={!isFormValid || loading}
          size="large"
          block
          className={styles.loginButton}
        >
          Giriş Yap
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;