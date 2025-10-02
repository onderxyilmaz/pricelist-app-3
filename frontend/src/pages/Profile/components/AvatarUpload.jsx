import React, { useRef } from 'react';
import { Avatar, Button, Dropdown } from 'antd';
import { UserOutlined, CameraOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import styles from '../Profile.module.css';

const API_BASE_URL = 'http://localhost:3001';

const AvatarUpload = ({
  user,
  avatarFilename,
  pendingAvatarPreview,
  onFileSelect,
  onAvatarAction
}) => {
  const fileInputRef = useRef(null);

  // Avatar renk belirleme fonksiyonu
  const getAvatarStyle = () => {
    if (user?.role === 'super_admin') {
      return styles.avatarSuperAdmin;
    }
    return styles.avatarDefault;
  };

  const handleAvatarAction = (action) => {
    if (action === 'upload' || action === 'change') {
      fileInputRef.current?.click();
    } else if (action === 'remove') {
      onAvatarAction('remove');
    }
  };

  const getAvatarMenuItems = () => {
    if (avatarFilename || pendingAvatarPreview) {
      return [
        {
          key: 'change',
          icon: <EditOutlined className={styles.avatarMenuIcon} />,
          label: 'Değiştir',
          onClick: () => handleAvatarAction('change')
        },
        {
          key: 'remove',
          icon: <DeleteOutlined className={styles.avatarMenuIcon} />,
          label: 'Fotoğrafı Kaldır',
          onClick: () => handleAvatarAction('remove')
        }
      ];
    } else {
      return [
        {
          key: 'upload',
          icon: <CameraOutlined className={styles.avatarMenuIcon} />,
          label: 'Fotoğraf Yükle',
          onClick: () => handleAvatarAction('upload')
        }
      ];
    }
  };

  return (
    <div className={styles.avatarSection}>
      <div className={styles.avatarContainer}>
        <Avatar
          size={120}
          src={pendingAvatarPreview || (avatarFilename ? `${API_BASE_URL}/uploads/avatars/${avatarFilename}` : null)}
          icon={(!pendingAvatarPreview && !avatarFilename) && <UserOutlined />}
          className={`${styles.avatar} ${(!pendingAvatarPreview && !avatarFilename) ? getAvatarStyle() : ''}`}
        />
        
        <Dropdown
          menu={{ items: getAvatarMenuItems() }}
          placement="topLeft"
          trigger={['click']}
          className={styles.avatarDropdown}
        >
          <Button
            type="primary"
            shape="circle"
            icon={<CameraOutlined />}
            className={styles.avatarUploadButton}
          />
        </Dropdown>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenFileInput}
        onChange={onFileSelect}
      />
    </div>
  );
};

export default AvatarUpload;