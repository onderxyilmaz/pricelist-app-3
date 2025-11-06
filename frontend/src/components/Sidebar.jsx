import React from 'react';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SettingOutlined,
  ImportOutlined,
  ProfileOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  FormOutlined,
  BankOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/')
    },
    {
      key: '/pricelists',
      icon: <UnorderedListOutlined />,
      label: 'Fiyat Listeleri',
      onClick: () => navigate('/pricelists')
    },
    {
      key: '/all-products',
      icon: <AppstoreOutlined />,
      label: 'Tüm Ürünler',
      onClick: () => navigate('/all-products')
    },
    {
      key: '/offers',
      icon: <FileTextOutlined />,
      label: 'Teklifler',
      onClick: () => navigate('/offers')
    },
    {
      key: '/offer-templates',
      icon: <FormOutlined />,
      label: 'Teklif Templates',
      onClick: () => navigate('/offer-templates')
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Müşteriler',
      onClick: () => navigate('/customers')
    },
    {
      key: '/companies',
      icon: <BankOutlined />,
      label: 'Firmalar',
      onClick: () => navigate('/companies')
    },
    {
      key: '/import-excel',
      icon: <ImportOutlined />,
      label: 'Import Excel',
      onClick: () => navigate('/import-excel')
    },
    {
      type: 'divider'
    }
  ];

  // Super admin için ekstra menüler
  if (user?.role === 'super_admin') {
    menuItems.push(
      {
        key: '/admin',
        icon: <SettingOutlined />,
        label: 'Yönetim',
        children: [
          {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Kullanıcı Yönetimi',
            onClick: () => navigate('/admin/users')
          }
        ]
      },
      {
        type: 'divider'
      }
    );
  }

  // Profil menüsü (tüm kullanıcılar için)
  menuItems.push(
    {
      key: '/profile',
      icon: <ProfileOutlined />,
      label: 'Profil',
      onClick: () => navigate('/profile')
    }
  );

  return (
    <Sider
      width={250}
      theme="dark"
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ borderRight: 0 }}
        items={menuItems}
      />

      {/* Developer Credit Section */}
      <div className="sidebar-footer">
        <a
          href="mailto:onderxyilmaz@gmail.com"
          className="developer-credit"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="credit-icon">
            <CodeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          </div>
          <div className="credit-text">
            <div className="credit-label">Developed by</div>
            <div className="credit-name">
              <TypeAnimation
                sequence={[
                  'Önder Yılmaz',
                  3000,
                  'onderxyilmaz@gmail.com',
                  3000,
                ]}
                wrapper="span"
                speed={30}
                repeat={Infinity}
                cursor={true}
                style={{ display: 'inline-block' }}
              />
            </div>
          </div>
        </a>
      </div>
    </Sider>
  );
};

export default Sidebar;
