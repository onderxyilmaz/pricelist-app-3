// OfferWizard component
import React, { useState } from 'react';
import { Modal, Steps, Button, Space } from 'antd';
import CustomerStep from './CustomerStep';
import ProductsStep from './ProductsStep';
import DetailsStep from './DetailsStep';
import ReviewStep from './ReviewStep';
import styles from './OfferWizard.module.css';

const { Step } = Steps;

const OfferWizard = ({
  visible = false,
  onCancel,
  onFinish,
  editingOffer = null,
  loading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    customer: null,
    products: [],
    details: {},
    totals: {}
  });

  const steps = [
    {
      title: 'Customer',
      content: <CustomerStep formData={formData} setFormData={setFormData} />
    },
    {
      title: 'Products',
      content: <ProductsStep formData={formData} setFormData={setFormData} />
    },
    {
      title: 'Details',
      content: <DetailsStep formData={formData} setFormData={setFormData} />
    },
    {
      title: 'Review',
      content: <ReviewStep formData={formData} />
    }
  ];

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    onFinish?.(formData);
  };

  const handleCancel = () => {
    setCurrentStep(0);
    setFormData({
      customer: null,
      products: [],
      details: {},
      totals: {}
    });
    onCancel?.();
  };

  return (
    <Modal
      title={editingOffer ? "Edit Offer" : "Create New Offer"}
      open={visible}
      onCancel={handleCancel}
      width={1000}
      className={styles.wizardModal}
      footer={null}
    >
      <div className={styles.wizardContainer}>
        <Steps current={currentStep} className={styles.wizardSteps}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <div className={styles.stepsContent}>
          {steps[currentStep].content}
        </div>
        
        <div className={styles.stepsAction}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={prev}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={handleFinish}
                loading={loading}
              >
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </Button>
            )}
            <Button onClick={handleCancel}>
              Cancel
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default OfferWizard;