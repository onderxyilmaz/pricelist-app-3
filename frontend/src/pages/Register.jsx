import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../utils/api';
import NotificationService from '../utils/notification';

const { Title, Link } = Typography;

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Price List App v3 - Register';
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

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
    <div className="auth-container">
      <Card className="auth-card">
        <Title level={2} className="auth-title">Kayıt Ol</Title>
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ad"
                name="firstName"
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
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Soyad"
                name="lastName"
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
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="E-mail"
            name="email"
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
            />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="password"
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
            />
          </Form.Item>

          <Form.Item
            label="Şifre Tekrar"
            name="confirmPassword"
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
              Kayıt Ol
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-link">
          <Space>
            <span>Zaten hesabınız var mı?</span>
            <Link onClick={onSwitchToLogin}>Giriş Yap</Link>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Register;
