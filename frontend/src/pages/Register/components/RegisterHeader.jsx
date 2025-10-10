import React from 'react';
import { Typography } from 'antd';
import styles from '../Register.module.css';

const { Title } = Typography;

const RegisterHeader = () => {
  return (
    <div className={styles.header}>
      <img 
        src="/pricelist-logo.png" 
        alt="Pricelist App Logo" 
        className={styles.logo}
      />
      <Title level={2} className={styles.title}>
        Kayıt Ol
      </Title>
    </div>
  );
};

export default RegisterHeader;