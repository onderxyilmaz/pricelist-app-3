import React, { useEffect } from 'react';
import { Card } from 'antd';
import RegisterHeader from './components/RegisterHeader';
import RegisterForm from './components/RegisterForm';
import RegisterFooter from './components/RegisterFooter';
import styles from './Register.module.css';

const Register = ({ onRegister, onSwitchToLogin }) => {
  useEffect(() => {
    document.title = 'Price List App v3 - Register';
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  return (
    <div className={styles.container}>
      <Card className={styles.authCard}>
        <RegisterHeader />
        <RegisterForm onRegister={onRegister} />
        <RegisterFooter onSwitchToLogin={onSwitchToLogin} />
      </Card>
    </div>
  );
};

export default Register;