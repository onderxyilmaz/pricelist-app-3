import React from 'react';
import { Typography, Space } from 'antd';
import styles from '../Login.module.css';

const { Link } = Typography;

const LoginFooter = ({ onSwitchToRegister }) => {
  return (
    <div className={styles.authLink}>
      <Space>
        <span>Hesabınız yok mu?</span>
        <Link onClick={onSwitchToRegister}>Kayıt Ol</Link>
      </Space>
    </div>
  );
};

export default LoginFooter;