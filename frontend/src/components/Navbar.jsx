import React from 'react';
import { Layout, Space, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:3001';

  // Avatar renk belirleme fonksiyonu
  const getAvatarStyle = () => {
    if (user?.role === 'super_admin') {
      return { backgroundColor: '#ff7a00' }; // Turuncu
    }
    return { backgroundColor: '#1890ff' }; // Mavi (varsayılan)
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
      onClick: () => navigate('/profile')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      onClick: onLogout
    }
  ];

  return (
    <Header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px',
      background: '#001529',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      <div 
        style={{ 
          color: '#fff', 
          fontSize: '20px', 
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => navigate('/')}
      >
        <UnorderedListOutlined style={{ fontSize: '24px' }} />
        Fiyat List App
      </div>
      
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer', color: '#fff' }}>
          <Avatar 
            icon={!user?.avatar_filename && <UserOutlined />}
            src={user?.avatar_filename ? `${API_BASE_URL}/uploads/avatars/${user.avatar_filename}` : null}
            style={!user?.avatar_filename ? getAvatarStyle() : {}}
          />
          <span>{`${user?.first_name} ${user?.last_name}`}</span>
        </Space>
      </Dropdown>
    </Header>
  );
};

export default Navbar;