import React from 'react';
import { Typography } from 'antd';
import styles from '../Profile.module.css';

const { Title } = Typography;

const ProfileHeader = () => {
  return (
    <Title level={2} className={styles.title}>Profil</Title>
  );
};

export default ProfileHeader;
