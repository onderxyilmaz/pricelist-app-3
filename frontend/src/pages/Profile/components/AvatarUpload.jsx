import React from 'react';
import { Avatar, Button, Dropdown } from 'antd';
import { UserOutlined, CameraOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../../config/env';
import styles from '../Profile.module.css';

const AvatarUpload = ({
  user,
  profileData,
  onFileChange,
  onAvatarRemove,
  fileInputRef
}) => {
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
      onAvatarRemove();
    }
  };

  const getAvatarMenuItems = () => {
    if (user?.avatar_filename) {
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
          src={user?.avatar_filename ? `${API_BASE_URL}/uploads/avatars/${user.avatar_filename}` : null}
          icon={!user?.avatar_filename && <UserOutlined />}
          className={`${styles.avatar} ${!user?.avatar_filename ? getAvatarStyle() : ''}`}
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
        onChange={onFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
