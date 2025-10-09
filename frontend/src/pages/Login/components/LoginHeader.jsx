import React from 'react';
import { Typography } from 'antd';
import styles from '../Login.module.css';

const { Title } = Typography;

const LoginHeader = () => {
  return (
    <Title level={2} className={styles.title}>
      Giriş Yap
    </Title>
  );
};

export default LoginHeader;