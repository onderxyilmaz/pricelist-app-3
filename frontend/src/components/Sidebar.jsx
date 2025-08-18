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
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
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
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;