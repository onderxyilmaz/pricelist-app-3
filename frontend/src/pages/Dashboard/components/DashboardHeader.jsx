import React from 'react';
import { Typography } from 'antd';
import styles from '../Dashboard.module.css';

const { Title } = Typography;

const DashboardHeader = () => {
  return (
    <Title level={2} className={styles.title}>
      Dashboard
    </Title>
  );
};

export default DashboardHeader;