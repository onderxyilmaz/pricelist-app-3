import React from 'react';
import { Typography, Space } from 'antd';
import styles from '../Register.module.css';

const { Link } = Typography;

const RegisterFooter = ({ onSwitchToLogin }) => {
  return (
    <div className={styles.authLink}>
      <Space>
        <span>Zaten hesabınız var mı?</span>
        <Link onClick={onSwitchToLogin}>Giriş Yap</Link>
      </Space>
    </div>
  );
};

export default RegisterFooter;