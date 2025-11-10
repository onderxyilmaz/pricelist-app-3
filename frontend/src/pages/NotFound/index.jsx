import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styles from './NotFound.module.css';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Price List App v3 - Page Not Found';
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>
          <span className={styles.four}>4</span>
          <span className={styles.zero}>0</span>
          <span className={styles.four}>4</span>
        </div>

        <Result
          status="404"
          title={<span className={styles.title}>Oops! Page Not Found</span>}
          subTitle={
            <span className={styles.subtitle}>
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </span>
          }
          extra={[
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              className={styles.homeButton}
              key="home"
            >
              Go to Dashboard
            </Button>,
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              className={styles.backButton}
              key="back"
            >
              Go Back
            </Button>,
          ]}
        />

        <div className={styles.illustration}>
          <div className={styles.astronaut}>
            <div className={styles.head}>
              <div className={styles.helmet}></div>
              <div className={styles.face}></div>
            </div>
            <div className={styles.body}></div>
            <div className={styles.arm}></div>
            <div className={styles.arm}></div>
            <div className={styles.leg}></div>
            <div className={styles.leg}></div>
          </div>
          <div className={styles.floatingElements}>
            <div className={styles.star}></div>
            <div className={styles.star}></div>
            <div className={styles.star}></div>
            <div className={styles.planet}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
