import React from 'react';
import { Steps } from 'antd';
import { InboxOutlined, EyeOutlined, ImportOutlined } from '@ant-design/icons';
import styles from '../ImportExcel.module.css';

const { Step } = Steps;

const StepsNavigation = ({ currentStep, onStepChange }) => {
  return (
    <div className={styles.stepsNavigation}>
      <Steps 
        current={currentStep} 
        style={{ marginBottom: '24px' }}
        onChange={onStepChange}
      >
        <Step 
          title="Dosya Seç" 
          icon={<InboxOutlined />}
          className={styles.customStep}
        />
        <Step 
          title="Veri Seçimi" 
          icon={<EyeOutlined />}
          className={styles.customStep}
        />
        <Step 
          title="Import" 
          icon={<ImportOutlined />}
          className={styles.customStep}
        />
      </Steps>
    </div>
  );
};

export default StepsNavigation;