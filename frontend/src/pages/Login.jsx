import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../utils/api';
import NotificationService from '../utils/notification';

const { Title, Link } = Typography;

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Price List App v3 - Login';
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      console.log('Login response:', response.data);
      if (response.data.success) {
        NotificationService.loginSuccess(`${response.data.user.first_name} ${response.data.user.last_name}`);
        onLogin(response.data.user);
      } else {
        console.log('Login failed:', response.data.message);
        NotificationService.loginError(response.data.message);
      }
    } catch (error) {
      console.log('Login error:', error);
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
    <div className="auth-container">
      <Card className="auth-card">
        <Title level={2} className="auth-title">Giriş Yap</Title>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="E-mail"
            name="email"
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
            />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="password"
            rules={[
              { required: true, message: 'Şifre gereklidir!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Şifreniz"
              size="large"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-link">
          <Space>
            <span>Hesabınız yok mu?</span>
            <Link onClick={onSwitchToRegister}>Kayıt Ol</Link>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;
