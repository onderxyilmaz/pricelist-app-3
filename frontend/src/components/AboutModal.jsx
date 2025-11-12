import React from 'react';
import { Modal, Typography, Space, Divider } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  BankOutlined,
  ImportOutlined,
  RocketOutlined,
  MailOutlined
} from '@ant-design/icons';
import { TypeAnimation } from 'react-type-animation';
import './AboutModal.css';

const { Title, Paragraph, Text } = Typography;

const AboutModal = ({ visible, onClose }) => {
  const features = [
    {
      icon: <ShoppingCartOutlined />,
      title: 'Fiyat Listeleri',
      description: 'Ürün fiyatlarınızı organize edin ve yönetin'
    },
    {
      icon: <FileTextOutlined />,
      title: 'Teklif Oluşturma',
      description: 'Profesyonel teklifler hazırlayın ve müşterilerinize sunun'
    },
    {
      icon: <UserOutlined />,
      title: 'Müşteri Yönetimi',
      description: 'Müşteri bilgilerinizi merkezi bir yerde tutun'
    },
    {
      icon: <BankOutlined />,
      title: 'Firma Yönetimi',
      description: 'Firma bilgilerinizi kolayca yönetin'
    },
    {
      icon: <ImportOutlined />,
      title: 'Excel Entegrasyonu',
      description: 'Excel dosyalarınızı kolayca içe aktarın'
    },
    {
      icon: <RocketOutlined />,
      title: 'Hızlı ve Güvenli',
      description: 'Modern teknolojilerle geliştirilmiş güvenli platform'
    }
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      className="about-modal"
      centered
    >
      <div className="about-modal-content">
        {/* Header with Animation */}
        <div className="about-header">
          <div className="about-icon-wrapper">
            <img 
              src="/pricelist-logo.png" 
              alt="Pricelist App Logo" 
              className="about-icon"
            />
          </div>
          <Title level={2} className="about-title">
            <TypeAnimation
              sequence={[
                'Price List App v3',
                2000,
                'Fiyat Listesi Uygulaması',
                2000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              cursor={true}
            />
          </Title>
        </div>

        <Divider />

        {/* Description */}
        <Paragraph className="about-description">
          <Text strong>Price List App v3</Text>, işletmenizin fiyat listelerini, 
          tekliflerini ve müşteri bilgilerini tek bir platformda yönetmenizi sağlayan 
          modern ve kullanıcı dostu bir uygulamadır.
        </Paragraph>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <Text strong className="feature-title">{feature.title}</Text>
                <Text type="secondary" className="feature-description">
                  {feature.description}
                </Text>
              </div>
            </div>
          ))}
        </div>

        <Divider />

        {/* Footer */}
        <div className="about-footer">
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <Text type="secondary">Developed by</Text>
            <Text strong style={{ fontSize: '16px' }}>Önder Yılmaz</Text>
            <a 
              href="mailto:onderxyilmaz@gmail.com"
              className="about-email-link"
            >
              <MailOutlined /> onderxyilmaz@gmail.com
            </a>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;

