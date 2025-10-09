import React from 'react';
import { Typography } from 'antd';
import styles from '../Register.module.css';

const { Title } = Typography;

const RegisterHeader = () => {
  return (
    <Title level={2} className={styles.title}>
      Kayıt Ol
    </Title>
  );
};

export default RegisterHeader;