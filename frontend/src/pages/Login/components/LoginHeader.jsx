import React from 'react';
import { Typography } from 'antd';
import styles from '../Login.module.css';

const { Title } = Typography;

const LoginHeader = () => {
  return (
    <div className={styles.header}>
      <img 
        src="/pricelist-logo.png" 
        alt="Pricelist App Logo" 
        className={styles.logo}
      />
      <Title level={2} className={styles.title}>
        Giriş Yap
      </Title>
    </div>
  );
};

export default LoginHeader;