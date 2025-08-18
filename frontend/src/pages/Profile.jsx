import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Typography, Avatar, Button, Input, Space, Upload, Dropdown } from 'antd';
import { UserOutlined, CameraOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { authApi } from '../utils/api';
import NotificationService from '../utils/notification';

const { Title } = Typography;
const API_BASE_URL = 'http://localhost:3001';

const Profile = ({ user, onUserUpdate }) => {
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    avatarFilename: user?.avatar_filename || null,
    password: '',
    confirmPassword: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Avatar renk belirleme fonksiyonu
  const getAvatarStyle = () => {
    if (user?.role === 'super_admin') {
      return { backgroundColor: '#ff7a00' }; // Turuncu
    }
    return { backgroundColor: '#1890ff' }; // Mavi (varsayılan)
  };

  useEffect(() => {
    document.title = 'Price List App v3 - Profile';
    console.log('User data in Profile:', user);
    setProfileData({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      avatarFilename: user?.avatar_filename || null,
      password: '',
      confirmPassword: ''
    });
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Sadece resim dosyalarını kabul et
      if (!file.type.startsWith('image/')) {
        NotificationService.error('Geçersiz Dosya', 'Lütfen sadece resim dosyası seçin');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPendingAvatarFile(file);
        setPendingAvatarPreview(e.target.result);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarAction = (action) => {
    if (action === 'upload') {
      fileInputRef.current?.click();
    } else if (action === 'remove') {
      setPendingAvatarFile(null);
      setPendingAvatarPreview(null);
      setProfileData(prev => ({
        ...prev,
        avatarFilename: null
      }));
      setHasChanges(true);
    } else if (action === 'change') {
      fileInputRef.current?.click();
    }
  };

  const getAvatarMenuItems = () => {
    if (profileData.avatarFilename || pendingAvatarFile) {
      return [
        {
          key: 'change',
          icon: <EditOutlined />,
          label: 'Değiştir',
          onClick: () => handleAvatarAction('change')
        },
        {
          key: 'remove',
          icon: <DeleteOutlined />,
          label: 'Fotoğrafı Kaldır',
          onClick: () => handleAvatarAction('remove')
        }
      ];
    } else {
      return [
        {
          key: 'upload',
          icon: <CameraOutlined />,
          label: 'Fotoğraf Yükle',
          onClick: () => handleAvatarAction('upload')
        }
      ];
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Şifre doğrulaması
      if (profileData.password || profileData.confirmPassword) {
        if (profileData.password !== profileData.confirmPassword) {
          NotificationService.error('Şifre Hatası', 'Şifreler eşleşmiyor!');
          setLoading(false);
          return;
        }
        
        if (profileData.password.length < 6) {
          NotificationService.error('Şifre Hatası', 'Şifre en az 6 karakter olmalıdır!');
          setLoading(false);
          return;
        }
      }
      
      let avatarFilename = profileData.avatarFilename;
      
      // Avatar yükleme işlemi
      if (pendingAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', pendingAvatarFile);
        
        const uploadResponse = await authApi.uploadAvatar(user.id, formData);
        if (uploadResponse.data.success) {
          avatarFilename = uploadResponse.data.filename;
        } else {
          throw new Error(uploadResponse.data.message);
        }
      }
      
      // Avatar silme işlemi
      if (profileData.avatarFilename === null && user.avatar_filename) {
        await authApi.deleteAvatar(user.id);
        avatarFilename = null;
      }
      
      // Profil güncelleme
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        avatarFilename: avatarFilename
      };
      
      // Şifre varsa ekle
      if (profileData.password) {
        updateData.password = profileData.password;
      }
      
      const updateResponse = await authApi.updateUser(user.id, updateData);
      
      if (updateResponse.data.success) {
        // Update user data in parent component
        if (onUserUpdate) {
          onUserUpdate(updateResponse.data.user);
        }
        
        // Reset pending states
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
        // Şifre alanlarını temizle
        setProfileData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        setHasChanges(false);
        NotificationService.success('Profil Güncellendi', 'Profil bilgileri başarıyla güncellendi');
      } else {
        throw new Error(updateResponse.data.message);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      NotificationService.error('Güncelleme Hatası', 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Profil</Title>
      
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={pendingAvatarPreview || (profileData.avatarFilename ? `${API_BASE_URL}/uploads/avatars/${profileData.avatarFilename}` : null)}
                  icon={(!pendingAvatarPreview && !profileData.avatarFilename) && <UserOutlined />}
                  style={{ 
                    border: '4px solid #f0f0f0',
                    ...(!pendingAvatarPreview && !profileData.avatarFilename ? getAvatarStyle() : {})
                  }}
                />
                
                <Dropdown
                  menu={{ items: getAvatarMenuItems() }}
                  placement="topLeft"
                  trigger={['click']}
                >
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      border: '3px solid white'
                    }}
                  />
                </Dropdown>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Ad
                </label>
                <Input
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Adınız"
                  size="large"
                  autoComplete="off"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Soyad
                </label>
                <Input
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Soyadınız"
                  size="large"
                  autoComplete="off"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Şifre
                </label>
                <Input.Password
                  value={profileData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Yeni şifre (boş bırakırsanız mevcut şifre korunur)"
                  size="large"
                  autoComplete="off"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Şifre Tekrar
                </label>
                <Input.Password
                  value={profileData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Yeni şifre tekrarı"
                  size="large"
                  autoComplete="off"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  E-mail
                </label>
                <Input
                  value={profileData.email}
                  disabled
                  size="large"
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>

              <Button
                type="primary"
                size="large"
                block
                disabled={!hasChanges}
                loading={loading}
                onClick={handleSave}
              >
                Değişiklikleri Kaydet
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
