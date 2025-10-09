import React, { useEffect } from 'react';
import { Card } from 'antd';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import LoginFooter from './components/LoginFooter';
import styles from './Login.module.css';

const Login = ({ onLogin, onSwitchToRegister }) => {
  useEffect(() => {
    document.title = 'Price List App v3 - Login';
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  return (
    <div className={styles.container}>
      <Card className={styles.authCard}>
        <LoginHeader />
        <LoginForm onLogin={onLogin} />
        <LoginFooter onSwitchToRegister={onSwitchToRegister} />
      </Card>
    </div>
  );
};

export default Login;