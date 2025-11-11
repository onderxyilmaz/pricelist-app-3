// OfferWizard component
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Space } from 'antd';
import DetailsStep from './DetailsStep';
import TemplateStep from './TemplateStep';
import ProductsStep from './ProductsStep';
import DiscountStep from './DiscountStep';
import ProfitStep from './ProfitStep';
import ManualPriceStep from './ManualPriceStep';
import ReviewStep from './ReviewStep';
import styles from './OfferWizard.module.css';

const OfferWizard = ({
  visible = false,
  onCancel,
  editingOffer = null,
  companies = [],
  isTemplateMode = false,
  wizardState,
  pricelists = [],
  onSave
}) => {
  const [form] = Form.useForm();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [saveLoading, setSaveLoading] = useState(false);
  
  const { 
    currentStep, 
    updateOfferData, 
    nextStep, 
    prevStep,
    offerData,
    selectedTemplate,
    setSelectedTemplate,
    templateFilter,
    setTemplateFilter,
    selectedItems,
    setSelectedItems,
    itemNotes,
    setItemNotes,
    itemDiscounts,
    setItemDiscounts,
    discountData,
    setDiscountData,
    profitData,
    setProfitData,
    manualPrices,
    setManualPrices
  } = wizardState;

  // Modal açıldığında form'u temizle veya doldur
  useEffect(() => {
    if (visible) {
      if (offerData && Object.keys(offerData).length > 0) {
        // Düzenleme veya revizyon modundaysa form'u doldur
        form.setFieldsValue({
          offer_no: offerData.offer_no,
          customer: offerData.customer,
          company_id: offerData.company_id
        });
      } else {
        // Yeni teklif modundaysa form'u temizle
        form.resetFields();
      }
    }
  }, [visible, offerData, form]);

  // Step 1 submit handler
  const handleStep1Submit = (values) => {
    // offerData'yı güncelle ve bir sonraki adıma geç
    updateOfferData(values);
    nextStep();
  };

  // Modal cancel handler
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Save handler
  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await onSave({
        offerData,
        selectedItems,
        itemNotes,
        itemDiscounts,
        discountData,
        profitData,
        manualPrices
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Custom step navigation component
  const renderStepsNavigation = () => {
    return (
      <div style={{ 
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e9ecef'
      }}>
        {/* Step 1 - Teklif Bilgileri */}
        <div style={{
          flex: 1,
          padding: '12px 16px',
          backgroundColor: currentStep === 0 ? '#1890ff' : currentStep > 0 ? '#52c41a' : '#f8f9fa',
          color: currentStep >= 0 ? '#fff' : '#666',
          position: 'relative',
          clipPath: currentStep === 0 || (!isTemplateMode && currentStep > 0) || (isTemplateMode && currentStep > 0) 
            ? 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)' 
            : 'none'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Step 1</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Teklif No ve Müşteri</div>
        </div>

        {/* Step 2 - Template Seçimi (sadece template mode'da) */}
        {isTemplateMode && (
          <div style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: currentStep === 1 ? '#1890ff' : currentStep > 1 ? '#52c41a' : '#f8f9fa',
            color: currentStep >= 1 ? '#fff' : '#666',
            position: 'relative',
            marginLeft: '-20px',
            clipPath: currentStep === 1 || currentStep > 1 
              ? 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)' 
              : 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Step 2</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Hazır template seç</div>
          </div>
        )}

        {/* Step 3/2 - Ürün Seçimi */}
        <div style={{
          flex: 1,
          padding: '12px 16px',
          backgroundColor: currentStep === (isTemplateMode ? 2 : 1) ? '#1890ff' : currentStep > (isTemplateMode ? 2 : 1) ? '#52c41a' : '#f8f9fa',
          color: currentStep >= (isTemplateMode ? 2 : 1) ? '#fff' : '#666',
          position: 'relative',
          marginLeft: '-20px',
          clipPath: currentStep === (isTemplateMode ? 2 : 1) || currentStep > (isTemplateMode ? 2 : 1)
            ? 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)' 
            : 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Step {isTemplateMode ? 3 : 2}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Fiyat listesi ve ürünler</div>
        </div>

        {/* Step 4/3 - İndirim Oranı */}
        <div style={{
          flex: 1,
          padding: '12px 16px',
          backgroundColor: currentStep === (isTemplateMode ? 3 : 2) ? '#1890ff' : currentStep > (isTemplateMode ? 3 : 2) ? '#52c41a' : '#f8f9fa',
          color: currentStep >= (isTemplateMode ? 3 : 2) ? '#fff' : '#666',
          position: 'relative',
          marginLeft: '-20px',
          clipPath: currentStep === (isTemplateMode ? 3 : 2) || currentStep > (isTemplateMode ? 3 : 2)
            ? 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)' 
            : 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Step {isTemplateMode ? 4 : 3}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Liste bazında indirimler</div>
        </div>

        {/* Step 5/4 - Kar Oranı */}
        <div style={{
          flex: 1,
          padding: '12px 16px',
          backgroundColor: currentStep === (isTemplateMode ? 4 : 3) ? '#1890ff' : currentStep > (isTemplateMode ? 4 : 3) ? '#52c41a' : '#f8f9fa',
          color: currentStep >= (isTemplateMode ? 4 : 3) ? '#fff' : '#666',
          position: 'relative',
          marginLeft: '-20px',
          clipPath: currentStep === (isTemplateMode ? 4 : 3) || currentStep > (isTemplateMode ? 4 : 3)
            ? 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)' 
            : 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Step {isTemplateMode ? 5 : 4}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Liste bazında kar marjları</div>
        </div>

        {/* Step 6/5 - Manuel Fiyat */}
        <div style={{
          flex: 1,
          padding: '12px 16px',
          backgroundColor: currentStep === (isTemplateMode ? 5 : 4) ? '#1890ff' : currentStep > (isTemplateMode ? 5 : 4) ? '#52c41a' : '#f8f9fa',
          color: currentStep >= (isTemplateMode ? 5 : 4) ? '#fff' : '#666',
          position: 'relative',
          marginLeft: '-20px',
          clipPath: currentStep === (isTemplateMode ? 5 : 4) || currentStep > (isTemplateMode ? 5 : 4)
            ? 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)' 
            : 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Step {isTemplateMode ? 6 : 5}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Ürün bazında fiyat düzenleme</div>
        </div>

        {/* Step 7/6 - Ön İzleme */}
        <div style={{
          flex: 1,
          padding: '12px 16px',
          backgroundColor: currentStep === (isTemplateMode ? 6 : 5) ? '#1890ff' : currentStep > (isTemplateMode ? 6 : 5) ? '#52c41a' : '#f8f9fa',
          color: currentStep >= (isTemplateMode ? 6 : 5) ? '#fff' : '#666',
          position: 'relative',
          marginLeft: '-20px',
          clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Step {isTemplateMode ? 7 : 6}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Teklif özeti ve kontrol</div>
        </div>
      </div>
    );
  };

  // Dil seçicisini göster mi?
  const showLanguageSelector = () => {
    const productSelectionStep = isTemplateMode ? 2 : 1;
    const manualPriceStep = isTemplateMode ? 5 : 4;
    const previewStep = isTemplateMode ? 6 : 5;
    return currentStep === productSelectionStep || currentStep === manualPriceStep || currentStep === previewStep;
  };

  // Render current step
  const renderCurrentStep = () => {
    // Step 1: Teklif No ve Müşteri (her zaman step 0)
    if (currentStep === 0) {
      return (
        <DetailsStep
          form={form}
          onSubmit={handleStep1Submit}
          onCancel={handleCancel}
          editingOffer={editingOffer}
          companies={companies}
          isTemplateMode={isTemplateMode}
        />
      );
    }

    // Step 2: Template Seçimi (template mode'da, step 1)
    if (isTemplateMode && currentStep === 1) {
      return (
        <TemplateStep
          offerData={offerData}
          onNext={nextStep}
          onPrev={prevStep}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          templateFilter={templateFilter}
          setTemplateFilter={setTemplateFilter}
          pricelists={pricelists}
          setSelectedItems={setSelectedItems}
        />
      );
    }

    // Step 3/2: Ürün Seçimi
    const productSelectionStep = isTemplateMode ? 2 : 1;
    if (currentStep === productSelectionStep) {
      return (
        <ProductsStep
          offerData={offerData}
          pricelists={pricelists}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          itemNotes={itemNotes}
          setItemNotes={setItemNotes}
          itemDiscounts={itemDiscounts}
          setItemDiscounts={setItemDiscounts}
          selectedLanguage={selectedLanguage}
          onNext={nextStep}
          onPrev={prevStep}
          onCancel={handleCancel}
        />
      );
    }

    // Step 4/3: Liste Bazında İndirimler
    const discountStep = isTemplateMode ? 3 : 2;
    if (currentStep === discountStep) {
      return (
        <DiscountStep
          offerData={offerData}
          selectedItems={selectedItems}
          pricelists={pricelists}
          discountData={discountData}
          setDiscountData={setDiscountData}
          itemDiscounts={itemDiscounts}
          onNext={nextStep}
          onPrev={prevStep}
          onCancel={handleCancel}
        />
      );
    }

    // Step 5/4: Liste Bazında Kar Oranları
    const profitStep = isTemplateMode ? 4 : 3;
    if (currentStep === profitStep) {
      return (
        <ProfitStep
          offerData={offerData}
          selectedItems={selectedItems}
          pricelists={pricelists}
          discountData={discountData}
          profitData={profitData}
          setProfitData={setProfitData}
          itemDiscounts={itemDiscounts}
          onNext={nextStep}
          onPrev={prevStep}
          onCancel={handleCancel}
        />
      );
    }

    // Step 6/5: Ürün Bazında Manuel Fiyat
    const manualPriceStep = isTemplateMode ? 5 : 4;
    if (currentStep === manualPriceStep) {
      return (
        <ManualPriceStep
          offerData={offerData}
          selectedItems={selectedItems}
          pricelists={pricelists}
          discountData={discountData}
          profitData={profitData}
          itemDiscounts={itemDiscounts}
          manualPrices={manualPrices}
          setManualPrices={setManualPrices}
          selectedLanguage={selectedLanguage}
          onNext={nextStep}
          onPrev={prevStep}
          onCancel={handleCancel}
        />
      );
    }

    // Step 7/6: Önizleme ve Kaydet
    const reviewStep = isTemplateMode ? 6 : 5;
    if (currentStep === reviewStep) {
      return (
        <ReviewStep
          offerData={offerData}
          selectedItems={selectedItems}
          pricelists={pricelists}
          discountData={discountData}
          profitData={profitData}
          itemDiscounts={itemDiscounts}
          itemNotes={itemNotes}
          manualPrices={manualPrices}
          selectedLanguage={selectedLanguage}
          onSave={handleSave}
          onPrev={prevStep}
          onCancel={handleCancel}
          loading={saveLoading}
        />
      );
    }

    return <div>Geçersiz adım</div>;
  };

  return (
    <Modal
      title={editingOffer ? 'Teklif Düzenle' : 'Yeni Teklif Oluştur'}
      open={visible}
      onCancel={handleCancel}
      width={1200}
      className={styles.wizardModal}
      footer={null}
      destroyOnHidden
      afterOpenChange={(open) => {
        if (open && !editingOffer && currentStep === 0) {
          setTimeout(() => {
            const firstInput = document.querySelector('input[placeholder="Teklif numarasını girin"]');
            if (firstInput) {
              firstInput.focus();
              firstInput.select();
            }
          }, 100);
        }
      }}
    >
      <div className={styles.wizardContainer}>
        {renderStepsNavigation()}
        
        {/* Language Selection */}
        {showLanguageSelector() && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <Space.Compact>
              <Button
                type={selectedLanguage === 'en' ? 'primary' : 'default'}
                onClick={() => setSelectedLanguage('en')}
                size="small"
                style={{ 
                  backgroundColor: selectedLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                  color: selectedLanguage === 'en' ? 'white' : '#000'
                }}
              >
                EN
              </Button>
              <Button 
                type={selectedLanguage === 'tr' ? 'primary' : 'default'}
                onClick={() => setSelectedLanguage('tr')}
                size="small"
                style={{ 
                  backgroundColor: selectedLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                  color: selectedLanguage === 'tr' ? 'white' : '#000'
                }}
              >
                TR
              </Button>
            </Space.Compact>
          </div>
        )}
        
        <div className={styles.stepsContent}>
          {renderCurrentStep()}
        </div>
      </div>
    </Modal>
  );
};

export default OfferWizard;