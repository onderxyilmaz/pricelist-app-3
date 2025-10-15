// useWizard hook - Wizard state management
import { useState } from 'react';

export const useWizard = (initialStep = 0) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [offerData, setOfferData] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [itemDiscounts, setItemDiscounts] = useState({});
  const [discountData, setDiscountData] = useState({});
  const [profitData, setProfitData] = useState({});
  const [manualPrices, setManualPrices] = useState({});
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFilter, setTemplateFilter] = useState('');

  // Step navigation
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const goToStep = (step) => setCurrentStep(step);

  // Reset wizard
  const resetWizard = () => {
    setCurrentStep(initialStep);
    setOfferData({});
    setSelectedItems([]);
    setItemNotes({});
    setItemDiscounts({});
    setDiscountData({});
    setProfitData({});
    setManualPrices({});
    setIsTemplateMode(false);
    setSelectedTemplate(null);
    setTemplateFilter('');
  };

  // Update offer data
  const updateOfferData = (data) => {
    setOfferData(prev => ({ ...prev, ...data }));
  };

  return {
    // State
    currentStep,
    offerData,
    selectedItems,
    itemNotes,
    itemDiscounts,
    discountData,
    profitData,
    manualPrices,
    isTemplateMode,
    selectedTemplate,
    templateFilter,
    
    // Setters
    setCurrentStep,
    setOfferData,
    setSelectedItems,
    setItemNotes,
    setItemDiscounts,
    setDiscountData,
    setProfitData,
    setManualPrices,
    setIsTemplateMode,
    setSelectedTemplate,
    setTemplateFilter,
    
    // Actions
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    updateOfferData
  };
};