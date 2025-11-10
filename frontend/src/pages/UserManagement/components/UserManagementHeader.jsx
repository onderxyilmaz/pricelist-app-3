import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../UserManagement.module.css';

const { Title } = Typography;

const UserManagementHeader = ({ onCreateUser }) => {
  return (
    <div className={styles.header}>
      <Title level={2} className={styles.title}>
        Kullanıcı Yönetimi
      </Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={onCreateUser}
        className={styles.addButton}
      >
        Yeni Kullanıcı
      </Button>
    </div>
  );
};

export default UserManagementHeader;