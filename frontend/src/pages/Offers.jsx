import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm, 
  Tag,
  InputNumber,
  Radio,
  Select,
  Divider,
  AutoComplete,
  Steps,
  Collapse,
  Checkbox,
  InputNumber as AntInputNumber,
  DatePicker,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  BranchesOutlined,
  SendOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilterOutlined,
  ClearOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import NotificationService from '../utils/notification';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;
import dayjs from 'dayjs';

// Utility functions
const formatCurrency = (amount, currency = 'TRY') => {
  const currencySymbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    TRY: '₺'
  };
  
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
  
  return `${formatted} ${currencySymbols[currency] || currency}`;
};

const Offers = () => {
  // Ana state'ler
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  
  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    status: 'all', // all, draft, sent
    company: 'all',
    createdBy: 'all',
    offerNo: '',
    dateRange: null,
    customerResponse: 'all' // all, accepted, rejected, pending
  });
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  // Wizard states
  const [currentStep, setCurrentStep] = useState(0);
  const [offerData, setOfferData] = useState({}); // Adım 1 verisi
  const [selectedItems, setSelectedItems] = useState([]); // Adım 2 verisi
  const [itemNotes, setItemNotes] = useState({}); // {itemId: note}
  
  // Açıklama ürünü kontrolü (adet 0 ve açıklama var)
  const isDescriptionItem = (record) => {
    const note = itemNotes[record.id];
    return record.quantity === 0 && note && note.trim() !== '';
  };
  
  const [itemDiscounts, setItemDiscounts] = useState({}); // {itemId: discount_rate}
  const [discountData, setDiscountData] = useState({}); // Adım 3 indirim verisi: {pricelistId: [{rate: number, description: string}]}
  const [profitData, setProfitData] = useState({}); // Adım 4 kar verisi: {pricelistId: [{rate: number, description: string}]}
  const [manualPrices, setManualPrices] = useState({}); // Adım 5 manuel fiyat verisi: {itemId: {enabled: boolean, price: number}}

  // Diğer state'ler
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [pricelists, setPricelists] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  
  // Language selection state
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewLanguage, setPreviewLanguage] = useState('en');

  // Template mode states
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Step 1'de Teklif No alanına autofocus
  useEffect(() => {
    if (modalVisible && !editingOffer && currentStep === 0) {
      const tryFocus = (attempt = 0) => {
        const offerNoInput = document.querySelector('input[placeholder="Teklif numarasını girin"]');
        if (offerNoInput && offerNoInput.offsetParent !== null) {
          offerNoInput.focus();
          offerNoInput.select();
        } else if (attempt < 5) {
          setTimeout(() => tryFocus(attempt + 1), 100);
        }
      };
      setTimeout(() => tryFocus(), 50);
    }
  }, [modalVisible, editingOffer, currentStep]);

  useEffect(() => {
    document.title = 'Price List App v3 - Teklifler';
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchOffers();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/offers');
      if (response.data.success) {
        setOffers(response.data.offers);
        
        // Filtreleme seçenekleri için unique değerleri topla
        const companies = [...new Set(response.data.offers.map(o => o.company).filter(Boolean))].sort();
        const users = [...new Set(response.data.offers.map(o => o.created_by_name).filter(Boolean))].sort();
        
        setAvailableCompanies(companies);
        setAvailableUsers(users);
        
        // Filtreleri uygula
        applyFilters(response.data.offers);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Teklifler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleri uygula
  const applyFilters = (offerList = offers) => {
    let filtered = [...offerList];

    // Durum filtresi
    if (filters.status !== 'all') {
      filtered = filtered.filter(offer => (offer.status || 'draft') === filters.status);
    }

    // Firma filtresi
    if (filters.company !== 'all') {
      filtered = filtered.filter(offer => offer.company === filters.company);
    }

    // Hazırlayan filtresi
    if (filters.createdBy !== 'all') {
      filtered = filtered.filter(offer => offer.created_by_name === filters.createdBy);
    }

    // Teklif No filtresi
    if (filters.offerNo.trim()) {
      const searchTerm = filters.offerNo.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.offer_no.toLowerCase().includes(searchTerm)
      );
    }

    // Tarih aralığı filtresi
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter(offer => {
        const offerDate = dayjs(offer.created_at);
        return offerDate.isAfter(startDate.startOf('day')) && offerDate.isBefore(endDate.endOf('day'));
      });
    }

    // Müşteri yanıtı filtresi
    if (filters.customerResponse !== 'all') {
      if (filters.customerResponse === 'pending') {
        filtered = filtered.filter(offer => !offer.customer_response);
      } else {
        filtered = filtered.filter(offer => offer.customer_response === filters.customerResponse);
      }
    }

    setFilteredOffers(filtered);
  };

  // Filtre değiştiğinde
  useEffect(() => {
    applyFilters();
  }, [filters]);

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      status: 'all',
      company: 'all',
      createdBy: 'all',
      offerNo: '',
      dateRange: null,
      customerResponse: 'all'
    });
  };

  // Filtre değiştirme fonksiyonu
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const fetchNextNumber = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/offers/next-number');
      if (response.data.success) {
        setNextNumber(response.data.nextNumber);
        return response.data.nextNumber;
      }
    } catch (error) {
      console.error('Next number fetch error:', error);
    }
    return '';
  };

  const fetchAvailableNumbers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/offers/available-numbers');
      if (response.data.success) {
        setAvailableNumbers(response.data.availableNumbers);
        return response.data.availableNumbers;
      }
    } catch (error) {
      console.error('Available numbers fetch error:', error);
    }
    return [];
  };

  const searchCompanies = async (searchText) => {
    try {
      // Boş veya çok kısa arama metni varsa seçenekleri temizle
      if (!searchText || searchText.trim().length < 1) {
        setCompanyOptions([]);
        return;
      }

      const response = await axios.get('http://localhost:3001/api/companies/search', {
        params: { query: searchText.trim() }
      });
      if (response.data.success) {
        const options = response.data.companies.map(company => ({
          value: company,
          label: company
        }));
        setCompanyOptions(options);
      }
    } catch (error) {
      console.error('Company search error:', error);
      setCompanyOptions([]);
    }
  };

  const fetchPricelistsWithItems = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pricelists-with-items');
      if (response.data.success) {
        setPricelists(response.data.pricelists);
      }
    } catch (error) {
      console.error('Pricelists fetch error:', error);
      NotificationService.error('Hata', 'Fiyat listeleri yüklenirken hata oluştu');
    }
  };

  const handleCreate = async (templateMode = false) => {
  setEditingOffer(null);
  form.resetFields();
  setCurrentStep(0);
  setOfferData({});
  setSelectedItems([]);
  setProductFilter('');
  setCompanyOptions([]);
  setItemNotes({});
  setItemDiscounts({});
  setDiscountData({});
  setProfitData({});
  setManualPrices({});
  setIsTemplateMode(templateMode);
  setSelectedTemplate(null);
  
  if (templateMode) {
    // Template mode ise template'leri yükle
    await fetchTemplates();
  }
  
  await fetchPricelistsWithItems();
  setModalVisible(true);
  };

  // Teklifi kaydet
  const handleSaveOffer = async () => {
    try {
      let offerId;
      
      if (editingOffer) {
        // Düzenleme modu - teklifi güncelle
        const offerPayload = {
          offer_no: offerData.offer_no,
          company: offerData.company || null
        };

        const offerResponse = await axios.put(`http://localhost:3001/api/offers/${editingOffer.id}`, offerPayload);
        
        if (!offerResponse.data.success) {
          NotificationService.error('Hata', offerResponse.data.message || 'Teklif güncellenemedi');
          return;
        }

        offerId = editingOffer.id;
        
      } else {
        // Yeni teklif oluşturma modu (revizyon dahil)
        const offerPayload = {
          offer_no: offerData.offer_no,
          company: offerData.company || null,
          created_by: currentUser?.id,
          parent_offer_id: offerData.parent_offer_id || null,
          revision_no: offerData.revision_no || 0
        };

        console.log('Offer payload:', offerPayload); // Debug için

        const offerResponse = await axios.post('http://localhost:3001/api/offers', offerPayload);
        
        if (!offerResponse.data.success) {
          NotificationService.error('Hata', offerResponse.data.message || 'Teklif kaydedilemedi');
          return;
        }

        offerId = offerResponse.data.offer.id;
      }

      // Seçili ürünleri kaydet
      if (selectedItems.length > 0) {
        const items = selectedItems.map(item => ({
          pricelist_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          total_price: item.total_price,
          product_id: item.product_id,
          product_name_tr: item.name_tr,
          product_name_en: item.name_en,
          description: itemNotes[item.id] || item.description_tr || item.description_en || '',
          unit: item.unit,
          currency: item.currency || 'EUR',
          pricelist_id: item.pricelist_id
        }));

        const itemsResponse = await axios.post(`http://localhost:3001/api/offers/${offerId}/items`, { items });
        
        if (!itemsResponse.data.success) {
          NotificationService.error('Hata', 'Teklif kalemleri kaydedilemedi');
          return;
        }
      }

      NotificationService.success('Başarılı', editingOffer ? 'Teklif başarıyla güncellendi' : 'Teklif başarıyla oluşturuldu');
      setModalVisible(false);
      fetchOffers(); // Listeyi yenile
      
    } catch (error) {
      console.error('Save offer error:', error);
      NotificationService.error('Hata', 'Teklif kaydedilirken hata oluştu');
    }
  };

  // Numara modu kaldırıldı

  // Teklif No kontrolü
  const checkOfferNumber = async (offerNo) => {
    if (!offerNo || offerNo.trim() === '') return true;
    
    try {
      const response = await axios.get(`http://localhost:3001/api/offers`);
      if (response.data.success) {
        const existingOffer = response.data.offers.find(offer => 
          offer.offer_no === offerNo.trim()
        );
        return !existingOffer; // Yoksa true, varsa false
      }
    } catch (error) {
      console.error('Offer number check error:', error);
    }
    return true;
  };

  // Adım 1: Teklif bilgileri
  const handleStep1Submit = async (values) => {
    // Düzenleme modunda teklif no kontrolü yapma
    if (!editingOffer) {
      // Teklif no kontrolü (sadece yeni teklif için)
      const isOfferNoAvailable = await checkOfferNumber(values.offer_no);
      if (!isOfferNoAvailable) {
        NotificationService.error('Hata', 'Bu teklif numarası zaten kullanılıyor. Lütfen farklı bir numara girin.');
        return;
      }
    }
    
    // Mevcut offerData'daki revizyon bilgilerini koru
    setOfferData(prevData => ({
      ...prevData,
      ...values
    }));
    setCurrentStep(1);
  };

  // Adım 2'den geri dönme
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Ürün seçimi ve adet değişikliği
  const handleItemSelection = (item, checked) => {
    if (checked) {
      const initialQty = item.stock <= 0 ? 0 : 1;
      setSelectedItems(prev => [...prev, { ...item, quantity: initialQty, total_price: (item.price * initialQty).toFixed(2) }]);
      // Açıklama silinmesin, state korunacak
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
      // Açıklama silinmiyor
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity < 0) return;
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Önce direkt ID ile bul (normal ürünler için)
        let originalItem = pricelists
          .flatMap(p => p.items)
          .find(pi => pi.id === itemId);
        
        // Bulunamazsa product_id ve pricelist_id ile bul (template ürünleri için)
        if (!originalItem && item.product_id && item.pricelist_id) {
          const pricelist = pricelists.find(p => p.id === item.pricelist_id);
          if (pricelist) {
            originalItem = pricelist.items.find(pi => pi.product_id === item.product_id);
          }
        }
        
        if (!originalItem) {
          // Template ürünü için stock bilgisi yoksa mevcut item'dan al
          return {
            ...item,
            quantity,
            total_price: (item.price * quantity).toFixed(2)
          };
        }
        
        if (quantity > originalItem.stock) {
          const itemName = originalItem.name_tr || originalItem.name_en || originalItem.name || item.name_tr || item.name_en;
          NotificationService.warning(
            'Stok Uyarısı', 
            `"${itemName}" ürünü için maksimum ${originalItem.stock} ${originalItem.unit} seçebilirsiniz. Mevcut stok: ${originalItem.stock}`
          );
          return item;
        }
        return {
          ...item,
          quantity,
          total_price: (item.price * quantity).toFixed(2)
        };
      }
      return item;
    }));
  };

  // Ürün filtreleme fonksiyonu
  const filterItems = (items) => {
    if (!productFilter.trim()) return items;
    
    const filterLower = productFilter.toLowerCase();
    return items.filter(item => 
      (item.name_tr && item.name_tr.toLowerCase().includes(filterLower)) ||
      (item.name_en && item.name_en.toLowerCase().includes(filterLower)) ||
      (item.name && item.name.toLowerCase().includes(filterLower)) ||
      item.product_id.toLowerCase().includes(filterLower) ||
      (item.description_tr && item.description_tr.toLowerCase().includes(filterLower)) ||
      (item.description_en && item.description_en.toLowerCase().includes(filterLower))
    );
  };

  // Bugünün tarihini formatla
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Ürün bazında net fiyat hesapla (ürün indirimi + liste indirimleri) - Toplam fiyat
  const calculateItemNetPrice = (item, pricelistId) => {
    let netPrice = parseFloat(item.price);
    
    // Önce ürün bazında indirim uygula
    const itemDiscount = itemDiscounts[item.id] || 0;
    if (itemDiscount > 0) {
      netPrice = netPrice * (1 - itemDiscount / 100);
    }
    
    // Sonra o fiyat listesinin indirimlerini uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        netPrice = netPrice * (1 - discount.rate / 100);
      }
    });
    
    // Adet ile çarp
    return netPrice * item.quantity;
  };

  // Ürün bazında final fiyat hesapla (manuel fiyat varsa onu kullan, yoksa hesaplanmış fiyatı)
  const calculateItemFinalPrice = (item, pricelistId) => {
    const manualPrice = manualPrices[item.id];
    
    // Manuel fiyat aktif ve girilmişse onu kullan
    if (manualPrice && manualPrice.enabled && manualPrice.price > 0) {
      return manualPrice.price * item.quantity;
    }
    
    // Yoksa hesaplanmış satış fiyatını kullan
    return calculateItemSalesPrice(item, pricelistId);
  };

  // Ürün bazında satış fiyatı hesapla (ürün indirimi + liste indirimleri + kar oranları) - Toplam fiyat
  const calculateItemSalesPrice = (item, pricelistId) => {
    let salesPrice = parseFloat(item.price);
    
    // Önce ürün bazında indirim uygula
    const itemDiscount = itemDiscounts[item.id] || 0;
    if (itemDiscount > 0) {
      salesPrice = salesPrice * (1 - itemDiscount / 100);
    }
    
    // Sonra liste indirimlerini uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        salesPrice = salesPrice * (1 - discount.rate / 100);
      }
    });

    // Son olarak kar oranlarını uygula
    const profits = profitData[pricelistId] || [];
    profits.forEach(profit => {
      if (profit.rate > 0) {
        salesPrice = salesPrice * (1 + profit.rate / 100);
      }
    });
    
    // Adet ile çarp
    return salesPrice * item.quantity;
  };

  // Sadece indirimli tutarı hesapla (kar oranları olmadan)
  const calculateDiscountedTotal = (pricelistId) => {
    const items = selectedItems.filter(item => item.pricelist_id === pricelistId);
    let total = 0;
    
    items.forEach(item => {
      let itemPrice = parseFloat(item.price) * item.quantity;
      
      // Önce ürün bazında indirim uygula
      const itemDiscount = itemDiscounts[item.id] || 0;
      if (itemDiscount > 0) {
        itemPrice = itemPrice * (1 - itemDiscount / 100);
      }
      
      total += itemPrice;
    });
    
    // Sonra liste indirimlerini uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        total = total * (1 - discount.rate / 100);
      }
    });
    
    return total;
  };

  // Fiyat listesi toplamlarını hesapla (manuel fiyatlar dahil)
  const calculatePricelistTotal = (pricelistId) => {
    const items = selectedItems.filter(item => item.pricelist_id === pricelistId);
    let total = 0;
    
    items.forEach(item => {
      const finalPrice = calculateItemFinalPrice(item, pricelistId);
      total += finalPrice * item.quantity;
    });
    
    return total;
  };

  // İndirim yönetimi fonksiyonları
  const addDiscount = (pricelistId) => {
    setDiscountData(prev => ({
      ...prev,
      [pricelistId]: [
        ...(prev[pricelistId] || []),
        { rate: 0, description: '' }
      ]
    }));
  };

  const updateDiscount = (pricelistId, index, field, value) => {
    setDiscountData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].map((discount, i) => 
        i === index ? { ...discount, [field]: value } : discount
      )
    }));
  };

  const removeDiscount = (pricelistId, index) => {
    setDiscountData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].filter((_, i) => i !== index)
    }));
  };

  // Kar oranı yönetimi fonksiyonları
  const addProfit = (pricelistId) => {
    setProfitData(prev => ({
      ...prev,
      [pricelistId]: [
        ...(prev[pricelistId] || []),
        { rate: 0, description: '' }
      ]
    }));
  };

  const updateProfit = (pricelistId, index, field, value) => {
    setProfitData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].map((profit, i) => 
        i === index ? { ...profit, [field]: value } : profit
      )
    }));
  };

  const removeProfit = (pricelistId, index) => {
    setProfitData(prev => ({
      ...prev,
      [pricelistId]: prev[pricelistId].filter((_, i) => i !== index)
    }));
  };

  // Modal kapatma fonksiyonu
  const handleModalClose = () => {
    // Hem yeni teklif hem düzenleme modunda veri girildiyse onay iste
    const hasData = selectedItems.length > 0 || 
                    Object.keys(discountData).length > 0 || 
                    Object.keys(profitData).length > 0 ||
                    Object.keys(itemNotes).length > 0 ||
                    Object.keys(itemDiscounts).length > 0 ||
                    Object.keys(manualPrices).length > 0 ||
                    offerData.offer_no || 
                    offerData.company;

    if (hasData) {
      setCancelConfirmVisible(true);
    } else {
      setModalVisible(false);
    }
  };

  // Onaylandığında modal'ı kapat ve verileri temizle
  const handleConfirmCancel = () => {
    setModalVisible(false);
    setCancelConfirmVisible(false);
    setCurrentStep(0);
    setOfferData({});
    setSelectedItems([]);
    setProductFilter('');
    setItemNotes({});
    setItemDiscounts({});
    setDiscountData({});
    setProfitData({});
    setManualPrices({});
  };

  // Seçilen ürünleri fiyat listelerine göre grupla
  const groupItemsByPricelist = () => {
    const groups = {};
    selectedItems.forEach(item => {
      const pricelistId = item.pricelist_id;
      if (!groups[pricelistId]) {
        const pricelist = pricelists.find(p => p.id === pricelistId);
        groups[pricelistId] = {
          pricelist,
          items: []
        };
      }
      groups[pricelistId].items.push(item);
    });
    return Object.values(groups);
  };

  // Toplam fiyatı hesapla (indirimlerle birlikte)
  const calculateTotalPrice = () => {
    const groups = groupItemsByPricelist();
    let total = 0;
    
    groups.forEach(group => {
      const pricelistTotal = calculatePricelistTotal(group.pricelist.id);
      total += pricelistTotal;
    });
    
    return total.toFixed(2);
  };

  // Para birimlerine göre toplam hesapla (indirimlerle birlikte)
  const calculateTotalsByCurrency = () => {
    const totals = {};
    const groups = groupItemsByPricelist();
    
    groups.forEach(group => {
      const currency = group.pricelist.currency;
      const pricelistTotal = calculatePricelistTotal(group.pricelist.id);
      
      if (!totals[currency]) {
        totals[currency] = {
          total: 0,
          pricelists: []
        };
      }
      totals[currency].total += pricelistTotal;
      totals[currency].pricelists.push({
        name: group.pricelist.name,
        amount: pricelistTotal
      });
    });
    
    // Her para birimini 2 decimal ile formatla
    Object.keys(totals).forEach(currency => {
      totals[currency].total = totals[currency].total.toFixed(2);
    });
    
    return totals;
  };

  const handleEdit = async (offer) => {
    try {
      setEditingOffer(offer);
      
      // Teklif detaylarını yükle
      const response = await axios.get(`http://localhost:3001/api/offers/${offer.id}`);
      if (!response.data.success) {
        NotificationService.error('Hata', 'Teklif detayları yüklenemedi');
        return;
      }

      const offerData = response.data.offer;
      
      // Form verilerini doldur
      form.setFieldsValue({
        offer_no: offerData.offer_no,
        company: offerData.company || ''
      });

      // Wizard state'lerini doldur
      setOfferData({
        offer_no: offerData.offer_no,
        company: offerData.company || ''
      });

      // Ürün kalemleri varsa doldur
      if (offerData.items && offerData.items.length > 0) {
        // Önce fiyat listelerini yükle
        await fetchPricelistsWithItems();
        
        // Seçili ürünleri doldur - orijinal ürün açıklamasını al
        const mappedItems = offerData.items.map(item => {
          // Orijinal ürün bilgilerini fiyat listelerinden bul
          const originalItem = pricelists
            .flatMap(p => p.items)
            .find(pi => pi.id === item.pricelist_item_id);
          
          return {
            id: item.pricelist_item_id,
            product_id: item.product_id,
            name_tr: item.product_name_tr,
            name_en: item.product_name_en,
            description: originalItem ? (originalItem.description_tr || originalItem.description_en || '') : '', // Orijinal ürün açıklaması
            price: parseFloat(item.price),
            unit: item.unit,
            currency: item.currency,
            pricelist_id: item.pricelist_id,
            quantity: item.quantity,
            total_price: item.total_price
          };
        });
        setSelectedItems(mappedItems);

        // Ürün notlarını doldur - sadece kullanıcının girdiği özel açıklamaları
        const notes = {};
        offerData.items.forEach(item => {
          // Orijinal ürün açıklamasını al
          const originalItem = pricelists
            .flatMap(p => p.items)
            .find(pi => pi.id === item.pricelist_item_id);
          
          // Eğer teklif kalemindeki açıklama orijinal açıklamadan farklıysa, kullanıcının özel açıklaması
          if (item.description && originalItem && item.description !== (originalItem.description_tr || originalItem.description_en || '')) {
            notes[item.pricelist_item_id] = item.description;
          }
        });
        setItemNotes(notes);
      }

      setCurrentStep(0);
      setModalVisible(true);
      
    } catch (error) {
      console.error('Edit offer error:', error);
      NotificationService.error('Hata', 'Teklif düzenlenirken hata oluştu');
    }
  };

  // Revizyon oluştur
  const handleCreateRevision = async (offer) => {
    try {
      // Mevcut teklif verilerini yükle
      const response = await axios.get(`http://localhost:3001/api/offers/${offer.id}`);
      if (!response.data.success) {
        NotificationService.error('Hata', 'Teklif detayları yüklenemedi');
        return;
      }

      const sourceOffer = response.data.offer;
      
      // Ana teklifi bul (parent_offer_id null olan)
      const parentOfferId = sourceOffer.parent_offer_id || offer.id;
      
      // Ana teklifin tüm revizyonlarını getir ve en yüksek revizyon numarasını bul
      const allOffersResponse = await axios.get('http://localhost:3001/api/offers');
      if (!allOffersResponse.data.success) {
        NotificationService.error('Hata', 'Teklifler yüklenemedi');
        return;
      }
      
      const allOffers = allOffersResponse.data.offers;
      const relatedOffers = allOffers.filter(o => 
        o.id === parentOfferId || o.parent_offer_id === parentOfferId
      );
      
      const maxRevisionNo = Math.max(...relatedOffers.map(o => o.revision_no || 0));
      const newRevisionNo = maxRevisionNo + 1;
      
      // Ana teklifin offer_no'sunu bul
      const parentOffer = allOffers.find(o => o.id === parentOfferId);
      const baseOfferNo = parentOffer ? parentOffer.offer_no : sourceOffer.offer_no.split('-R')[0];
      
      // Form verilerini doldur (yeni teklif no ile)
      const newOfferNo = `${baseOfferNo}-R${newRevisionNo}`;
      
      form.setFieldsValue({
        offer_no: newOfferNo,
        company: sourceOffer.company || ''
      });

      console.log('Revizyon bilgileri:', {
        sourceOfferId: offer.id,
        parentOfferId,
        newRevisionNo,
        newOfferNo,
        offerData: {
          offer_no: newOfferNo,
          company: sourceOffer.company || '',
          parent_offer_id: parentOfferId,
          revision_no: newRevisionNo
        }
      }); // Debug için

      // Wizard state'lerini doldur
      setOfferData({
        offer_no: newOfferNo,
        company: sourceOffer.company || '',
        parent_offer_id: parentOfferId,
        revision_no: newRevisionNo
      });

      // Revizyon oluştururken 1. adımdan başla (Teklif Bilgileri)
      setCurrentStep(0);
      setEditingOffer(null);
      
      // Ürün kalemleri varsa doldur
      if (sourceOffer.items && sourceOffer.items.length > 0) {
        await fetchPricelistsWithItems();
        
        // Seçili ürünleri doldur - orijinal ürün açıklamasını al
        const mappedItems = sourceOffer.items.map(item => {
          // Orijinal ürün bilgilerini fiyat listelerinden bul
          const originalItem = pricelists
            .flatMap(p => p.items)
            .find(pi => pi.id === item.pricelist_item_id);
          
          return {
            id: item.pricelist_item_id,
            product_id: item.product_id,
            name_tr: item.product_name_tr,
            name_en: item.product_name_en,
            description: originalItem ? (originalItem.description_tr || originalItem.description_en || '') : '', // Orijinal ürün açıklaması
            price: parseFloat(item.price),
            unit: item.unit,
            currency: item.currency,
            pricelist_id: item.pricelist_id,
            quantity: item.quantity,
            total_price: item.total_price
          };
        });
        setSelectedItems(mappedItems);

        // Ürün notlarını doldur - sadece kullanıcının girdiği özel açıklamaları
        const notes = {};
        sourceOffer.items.forEach(item => {
          // Orijinal ürün açıklamasını al
          const originalItem = pricelists
            .flatMap(p => p.items)
            .find(pi => pi.id === item.pricelist_item_id);
          
          // Eğer teklif kalemindeki açıklama orijinal açıklamadan farklıysa, kullanıcının özel açıklaması
          if (item.description && originalItem && item.description !== (originalItem.description_tr || originalItem.description_en || '')) {
            notes[item.pricelist_item_id] = item.description;
          }
        });
        setItemNotes(notes);
      } else {
        await fetchPricelistsWithItems();
      }

      setModalVisible(true);
      
    } catch (error) {
      console.error('Create revision error:', error);
      NotificationService.error('Hata', 'Revizyon oluşturulurken hata oluştu');
    }
  };

  // Status değiştir (draft <-> sent)
  const handleToggleStatus = async (offer) => {
    try {
      const newStatus = offer.status === 'sent' ? 'draft' : 'sent';
      
      const response = await axios.put(`http://localhost:3001/api/offers/${offer.id}`, {
        offer_no: offer.offer_no,
        company: offer.company,
        status: newStatus
      });

      if (response.data.success) {
        NotificationService.success('Başarılı', 
          newStatus === 'sent' ? 'Teklif gönderildi olarak işaretlendi' : 'Teklif taslak olarak işaretlendi'
        );
        fetchOffers();
      } else {
        NotificationService.error('Hata', response.data.message || 'Status güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      NotificationService.error('Hata', 'Status değiştirilirken hata oluştu');
    }
  };

  // Müşteri yanıtını güncelle
  const handleCustomerResponse = async (offer, response) => {
    try {
      const updateResponse = await axios.put(`http://localhost:3001/api/offers/${offer.id}`, {
        offer_no: offer.offer_no,
        company: offer.company,
        customer_response: response
      });

      if (updateResponse.data.success) {
        const responseText = response === 'accepted' ? 'kabul edildi' : 
                           response === 'rejected' ? 'reddedildi' : 
                           'yanıt sıfırlandı';
        NotificationService.success('Başarılı', `Teklif ${responseText} olarak işaretlendi`);
        fetchOffers();
        
        // Popconfirm'ı kapat
        setTimeout(() => {
          document.body.click();
        }, 100);
      } else {
        NotificationService.error('Hata', updateResponse.data.message || 'Müşteri yanıtı güncellenemedi');
      }
    } catch (error) {
      console.error('Customer response error:', error);
      NotificationService.error('Hata', 'Müşteri yanıtı güncellenirken hata oluştu');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingOffer) {
        // Güncelleme
        const response = await axios.put(`http://localhost:3001/api/offers/${editingOffer.id}`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Teklif güncellendi');
          fetchOffers();
        } else {
          NotificationService.error('Hata', response.data.message || 'Güncelleme başarısız');
        }
      } else {
        // Yeni oluşturma - revizyon numarasını 0 olarak ayarla
        const createData = {
          ...values,
          revision_no: 0,
          created_by: currentUser?.id
        };
        const response = await axios.post('http://localhost:3001/api/offers', createData);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Teklif oluşturuldu');
          fetchOffers();
        } else {
          NotificationService.error('Hata', response.data.message || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || (editingOffer ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/offers/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Teklif silindi');
        fetchOffers();
      } else {
        NotificationService.error('Hata', response.data.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Silme işlemi başarısız';
      NotificationService.error('Hata', errorMessage);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/offer-templates');
      if (response.data.success) {
        setAvailableTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Template fetch error:', error);
      NotificationService.error('Hata', 'Template\'ler yüklenemedi');
    }
  };

  const handleTemplateSelect = async (template) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/offer-templates/${template.id}/items`);
      if (response.data.success) {
        setSelectedTemplate(template);
        setTemplateItems(response.data.items);
        // Her ürün için default miktar 1 yap
        const defaultQuantities = {};
        response.data.items.forEach(item => {
          defaultQuantities[item.id] = item.quantity || 1;
        });
        setTemplateQuantities(defaultQuantities);
      } else {
        NotificationService.error('Hata', 'Template ürünleri yüklenemedi');
      }
    } catch (error) {
      console.error('Template items fetch error:', error);
      NotificationService.error('Hata', 'Template ürünleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfferFromTemplate = () => {
    if (!selectedTemplate || templateItems.length === 0) {
      NotificationService.warning('Uyarı', 'Lütfen bir template seçin');
      return;
    }

    // Template'den seçilen ürünleri wizard'a aktar
    const wizardItems = templateItems.map(item => ({
      ...item,
      quantity: templateQuantities[item.id] || 1,
      total_price: (templateQuantities[item.id] || 1) * item.price,
      // Template'deki ID'yi kullan ama product_id ve pricelist_id bilgilerini de koru
      name_tr: item.name_tr,
      name_en: item.name_en,
      description_tr: item.description_tr,
      description_en: item.description_en,
      // Eşleşme için gerekli alanlar
      product_id: item.product_id,
      pricelist_id: item.pricelist_id
    }));

    // Wizard state'ini ayarla
    setSelectedItems(wizardItems);
    
    // Template modalını kapat ve wizard'ı aç
    setTemplateModalVisible(false);
    setModalVisible(true);
    setCurrentStep(isTemplateMode ? 2 : 1); // Template seçildi, ürün seçimi adımına geç
    
    NotificationService.success('Başarılı', `${selectedTemplate.name} template'i yüklendi`);
  };

  const handlePreview = async (offer) => {
    try {
      setLoading(true);
      
      // Teklif detayları ve fiyat listesi bilgilerini al
      const [offerResponse, pricelistsResponse] = await Promise.all([
        axios.get(`http://localhost:3001/api/offers/${offer.id}/details`),
        axios.get('http://localhost:3001/api/pricelists-with-items')
      ]);
      
      if (offerResponse.data.success && pricelistsResponse.data.success) {
        // Fiyat listesi bilgilerini map'e çevir
        const pricelistsMap = {};
        if (pricelistsResponse.data.pricelists && Array.isArray(pricelistsResponse.data.pricelists)) {
          pricelistsResponse.data.pricelists.forEach(pricelist => {
            pricelistsMap[pricelist.id] = {
              name: pricelist.name,
              color: pricelist.color || '#1890ff'
            };
          });
        }
        
        // API response'unda offer.items şeklinde gruplandırılmış veri geliyor
        const offerData = offerResponse.data.offer;
        const groupedItems = offerData?.items || {};
        
        // Gruplandırılmış verileri düz array'e çevir
        const allItems = [];
        Object.entries(groupedItems).forEach(([pricelistName, items]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              allItems.push({
                ...item,
                pricelistName: pricelistName,
                pricelistColor: pricelistsMap[item.pricelist_id]?.color || '#1890ff'
              });
            });
          }
        });
        
        const enrichedItems = allItems;
        
        setPreviewOffer(offer);
        setPreviewItems(enrichedItems);
        setPreviewModalVisible(true);
      } else {
        NotificationService.error('Hata', 'Teklif detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Preview error:', error);
      NotificationService.error('Hata', 'Teklif önizlemesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async (offer) => {
    try {
      // Teklif detaylarını fetch et
      const response = await axios.get(`http://localhost:3001/api/offers/${offer.id}/details`);
      
      console.log('Excel export response:', response.data); // Debug için
      
      if (!response.data.success) {
        NotificationService.error('Hata', response.data.message || 'Teklif detayları alınamadı');
        return;
      }

      const offerData = response.data.offer;
      const groupedItems = offerData.items;

      // Excel workbook oluştur
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Teklif');
      
      // A1:E3 boş satırlar
      worksheet.addRow(['', '', '', '', '']);
      worksheet.addRow(['', '', '', '', '']);
      worksheet.addRow(['', '', '', '', '']);
      
      // A4-E7 bilgi satırları
      worksheet.addRow(['Proje Adı:', offerData.offer_no || '', 'Rev No:', offerData.revision_no || 0, '']);
      worksheet.addRow(['Firma Adı:', offerData.company || '', 'Proje No:', '', '']);
      worksheet.addRow(['İlgili Kişi:', '', 'Tarih:', new Date(offerData.created_at).toLocaleDateString('tr-TR'), new Date(offerData.created_at).toLocaleDateString('tr-TR')]);
      worksheet.addRow(['Konu:', '', 'Hazırlayan:', offerData.created_by_name || '', '']);
      
      // Boş satır (8. satır)
      worksheet.addRow(['', '', '', '', '']);
      
      // Boş satır (9. satır)
      worksheet.addRow(['', '', '', '', '']);

      // Ana tablo başlıkları (10. satır)
      const headerRow = worksheet.addRow([
        'Product Code /\nÜrün kodu', 
        'Description / Açıklama', 
        'Qty /\nMiktar', 
        'Unit Price /\nBirim Fiyat', 
        'Total Price /\nToplam Fiyat', 
        'Net Price / Net\nFiyat', 
        'Net Total /\nNet Toplam', 
        'List Price / Liste\nFiyat', 
        '', 
        '', 
        ''
      ]);
      
      // 10. satır başlıklarını bold yap ve arkaplan rengini ayarla
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, name: 'Tahoma', size: 9 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
        };
        cell.alignment = { 
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true 
        };
      });
      
      // 10. satırın yüksekliğini ayarla (45px = 33.75 Excel point)
      headerRow.height = 33.75;
      
      worksheet.addRow([]);

      // Grup başına verileri ekle
      Object.entries(groupedItems).forEach(([groupName, items]) => {
        // Grup başlığı (B sütununa taşındı)
        const groupRow = worksheet.addRow(['', groupName, '', '', '', '', '', '', '', '', '']);
        
        // Grup başlığının formatını ayarla (B sütunu)
        const groupCell = groupRow.getCell(2); // B sütunu
        groupCell.font = { 
          bold: true, 
          name: 'Tahoma', 
          size: 12, 
          color: { argb: 'FF0070C0' } 
        };
        
        // Grup öğeleri
        items.forEach(item => {
          const productRow = worksheet.addRow([
            item.product_code || '',
            item.description || '',
            item.quantity || 1,
            parseFloat(item.unit_price || 0).toFixed(2),
            parseFloat(item.total_price || 0).toFixed(2),
            parseFloat(item.net_price || 0).toFixed(2),
            parseFloat(item.net_total || item.total_price || 0).toFixed(2),
            parseFloat(item.list_price || item.unit_price || 0).toFixed(2),
            0.00, // Placeholder for additional columns
            parseFloat(item.list_price || item.unit_price || 0).toFixed(2),
            ''
          ]);
          
          // Ürün satırlarına 9.5pt font boyutu uygula
          productRow.eachCell((cell) => {
            cell.font = { 
              name: 'Tahoma', 
              size: 9.5 
            };
            cell.alignment = { 
              vertical: 'middle'
            };
          });
        });
        
        // Grup toplamı
        const groupTotal = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
        const groupNetTotal = items.reduce((sum, item) => sum + parseFloat(item.net_total || item.total_price || 0), 0);
        
        worksheet.addRow([
          '', 
          `${groupName} Orjinal Toplamı:`, 
          groupTotal.toFixed(2) + ' €',
          '', '', '', '', '', '', '', ''
        ]);
        worksheet.addRow([
          '', 
          `${groupName} Final Toplamı:`, 
          groupNetTotal.toFixed(2) + ' €',
          '', '', '', '', '', '', '', ''
        ]);
        worksheet.addRow([]);
      });

      // Genel toplam - açıklama ürünlerini hariç tut
      const totalAmount = Object.values(groupedItems).flat()
        .filter(item => !isDescriptionItem(item))
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
      worksheet.addRow(['', 'TOTAL AMOUNT', '', '', '', '', '', '', '', '', totalAmount.toFixed(2) + ' €']);

      // Sütun genişliklerini ayarla
      worksheet.columns = [
        { width: 15.86 }, // A - Product Code (116px)
        { width: 71.43 }, // B - Description (505px)
        { width: 8.71 },  // C - Qty (66px)
        { width: 14.29 }, // D - Unit Price (105px)
        { width: 16.00 }, // E - Total Price (117px)
        { width: 12 }, // F - Net Price
        { width: 12 }, // G - Net Total
        { width: 12 }, // H - List Price
        { width: 8 },  // I - Extra column
        { width: 12 }, // J - List Price 2
        { width: 8 }   // K - Extra column
      ];

      // A4:K7 aralığını bold yapalım
      for (let row = 4; row <= 7; row++) {
        for (let col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']) {
          const cell = worksheet.getCell(`${col}${row}`);
          cell.font = { bold: true, name: 'Tahoma', size: 10.5 };
          
          // A sütununu sağa yasla
          if (col === 'A' && row >= 4 && row <= 7) {
            cell.alignment = { 
              vertical: 'middle',
              horizontal: 'right'
            };
          } else {
            cell.alignment = { 
              vertical: 'middle'
            };
          }
        }
      }

      // Hücreleri birleştir ve formatla
      worksheet.mergeCells('C4:D4'); // Rev No
      worksheet.mergeCells('C5:D5'); // Proje No
      worksheet.mergeCells('C6:D6'); // Tarih
      worksheet.mergeCells('C7:D7'); // Hazırlayan

      // Birleştirilen hücreleri sağa yasla
      for (let row = 4; row <= 7; row++) {
        const mergedCell = worksheet.getCell(`C${row}`);
        mergedCell.alignment = { 
          vertical: 'middle',
          horizontal: 'right'
        };
      }

      // A1:K3 aralığının font boyutunu ayarla
      for (let row = 1; row <= 3; row++) {
        for (let col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']) {
          const cell = worksheet.getCell(`${col}${row}`);
          cell.font = { name: 'Tahoma', size: 9 };
          cell.alignment = { 
            vertical: 'middle'
          };
        }
      }

      // Tüm worksheet'e varsayılan font ayarla
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          if (!cell.font || !cell.font.name) {
            cell.font = { 
              ...cell.font, 
              name: 'Tahoma', 
              size: cell.font?.size || 11 
            };
          }
          // Eğer hizalama ayarlanmamışsa dikey ortala
          if (!cell.alignment) {
            cell.alignment = { 
              vertical: 'middle'
            };
          }
        });
      });

      // Dosya adını oluştur
      const fileName = `Teklif_${offerData.offer_no || 'w'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Excel dosyasını indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      NotificationService.success('Başarılı', 'Excel dosyası indirildi');
      
    } catch (error) {
      console.error('Excel export error:', error);
      NotificationService.error('Hata', 'Excel dosyası oluşturulurken hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  // Ana teklifleri filtrele (parent_offer_id null olanlar)
  const parentOffers = filteredOffers.filter(offer => !offer.parent_offer_id);
  
  // Her ana teklifin revizyonlarını bul
  const getRevisions = (parentOfferId) => {
    return filteredOffers.filter(offer => offer.parent_offer_id === parentOfferId)
      .sort((a, b) => a.revision_no - b.revision_no);
  };

  const columns = [
    {
      title: 'Teklif No',
      dataIndex: 'offer_no',
      key: 'offer_no',
      sorter: (a, b) => a.offer_no.localeCompare(b.offer_no, 'tr'),
    },
    {
      title: 'Oluşturma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
    },
    {
      title: 'Revize',
      key: 'revision_count',
      width: 100,
      sorter: (a, b) => {
        const aCount = getRevisions(a.id).length;
        const bCount = getRevisions(b.id).length;
        return aCount - bCount;
      },
      render: (_, record) => {
        const revisionCount = getRevisions(record.id).length;
        return revisionCount > 0 ? revisionCount : '-';
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => (a.status || 'draft').localeCompare(b.status || 'draft', 'tr'),
      render: (status) => (
        <Tag color={status === 'sent' ? 'green' : 'blue'}>
          {status === 'sent' ? 'Gönderildi' : 'Taslak'}
        </Tag>
      ),
    },
    {
      title: 'Müşteri Yanıtı',
      dataIndex: 'customer_response',
      key: 'customer_response',
      width: 130,
      sorter: (a, b) => {
        const aResponse = a.customer_response || 'pending';
        const bResponse = b.customer_response || 'pending';
        return aResponse.localeCompare(bResponse, 'tr');
      },
      render: (response) => {
        if (!response) {
          return <Tag icon={<QuestionCircleOutlined />} color="default">Bekliyor</Tag>;
        }
        if (response === 'accepted') {
          return <Tag icon={<CheckOutlined />} color="success">Kabul</Tag>;
        }
        if (response === 'rejected') {
          return <Tag icon={<CloseOutlined />} color="error">Red</Tag>;
        }
        return <Tag color="default">{response}</Tag>;
      },
    },
    {
      title: 'Hazırlayan',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      sorter: (a, b) => (a.created_by_name || '').localeCompare(b.created_by_name || '', 'tr'),
      render: (name) => name || '-',
    },
    {
      title: 'Firma',
      dataIndex: 'company',
      key: 'company',
      sorter: (a, b) => (a.company || '').localeCompare(b.company || '', 'tr'),
      render: (company) => company || '-',
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 360,
      render: (_, record) => (
        <Space>
          {/* 1. Önizleme */}
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            title="Önizleme"
          />

          {/* 2. Düzenle */}
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Düzenle"
          />
          
          {/* 3. Revizyon Oluştur */}
          <Button
            type="default"
            size="small"
            icon={<BranchesOutlined />}
            onClick={() => handleCreateRevision(record)}
            title="Revizyon Oluştur"
          />
          
          {/* 4. Gönderildi İşaretle */}
          <Button
            type="default"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleToggleStatus(record)}
            title={record.status === 'sent' ? 'Taslak Yap' : 'Gönderildi İşaretle'}
            style={{ 
              color: record.status === 'sent' ? '#52c41a' : '#1890ff',
              borderColor: record.status === 'sent' ? '#52c41a' : '#1890ff'
            }}
          />
          
                            {/* 5. Müşteri Yanıtı */}
                            <Popconfirm
                              title={record.status === 'sent' ? "Müşteri yanıtını seçin:" : "Bu teklif henüz gönderilmemiş"}
                              description={
                                record.status === 'sent' ? (
                                  <div style={{ marginTop: 8 }}>
                                    <Button
                                      size="small"
                                      icon={<CheckOutlined />}
                                      onClick={() => handleCustomerResponse(record, 'accepted')}
                                      disabled={record.customer_response === 'accepted'}
                                      style={{ 
                                        marginRight: 8,
                                        color: record.customer_response === 'accepted' ? '#52c41a' : '#1890ff',
                                        borderColor: record.customer_response === 'accepted' ? '#52c41a' : '#1890ff',
                                        backgroundColor: record.customer_response === 'accepted' ? '#f6ffed' : 'transparent'
                                      }}
                                    >
                                      Kabul
                                    </Button>
                                    <Button
                                      size="small"
                                      icon={<CloseOutlined />}
                                      onClick={() => handleCustomerResponse(record, 'rejected')}
                                      disabled={record.customer_response === 'rejected'}
                                      style={{ 
                                        marginRight: 8,
                                        color: record.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                        borderColor: record.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                        backgroundColor: record.customer_response === 'rejected' ? '#fff2f0' : 'transparent'
                                      }}
                                    >
                                      Red
                                    </Button>
                                    {record.customer_response && (
                                      <Button
                                        size="small"
                                        icon={<QuestionCircleOutlined />}
                                        onClick={() => handleCustomerResponse(record, null)}
                                        style={{ 
                                          color: '#faad14',
                                          borderColor: '#faad14'
                                        }}
                                      >
                                        Sıfırla
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                                    Önce teklifin gönderildi olarak işaretlenmesi gerekiyor.
                                  </div>
                                )
                              }
                              showCancel={false}
                              showOk={false}
                              okButtonProps={{ style: { display: 'none' } }}
                              cancelButtonProps={{ style: { display: 'none' } }}
                              trigger="click"
                              disabled={record.status !== 'sent'}
                            >
                              <Button
                                size="small"
                                icon={
                                  record.customer_response === 'accepted' ? <CheckOutlined /> :
                                  record.customer_response === 'rejected' ? <CloseOutlined /> :
                                  <QuestionCircleOutlined />
                                }
                                title="Müşteri Yanıtı"
                                disabled={record.status !== 'sent'}
                                style={{ 
                                  color: record.status !== 'sent' ? '#d9d9d9' : 
                                         record.customer_response === 'accepted' ? '#52c41a' : 
                                         record.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                  borderColor: record.status !== 'sent' ? '#d9d9d9' : 
                                              record.customer_response === 'accepted' ? '#52c41a' : 
                                              record.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                  backgroundColor: record.status !== 'sent' ? '#fafafa' :
                                                  record.customer_response === 'accepted' ? '#f6ffed' : 
                                                  record.customer_response === 'rejected' ? '#fff2f0' : 'transparent',
                                  cursor: record.status !== 'sent' ? 'not-allowed' : 'pointer'
                                }}
                              />
                            </Popconfirm>          {/* 6. Excel'e Aktar */}
          <Button
            type="default"
            size="small"
            icon={<FileExcelOutlined />}
            onClick={() => handleExportToExcel(record)}
            title="Excel'e Aktar"
            style={{ 
              color: '#52c41a',
              borderColor: '#52c41a'
            }}
          />
          
          {/* 7. PDF'e Aktar */}
          <Button
            type="default"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => {
              // TODO: PDF export fonksiyonu eklenecek
              console.log('PDF export:', record);
            }}
            title="PDF'e Aktar"
            style={{ 
              color: '#ff4d4f',
              borderColor: '#ff4d4f'
            }}
          />
          
          {/* 8. Sil */}
          <Popconfirm
            title="Teklifi silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Sil"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>
        {`
          /* Revizyon tablosu için özel stiller */
          .ant-table-expanded-row > td {
            padding: 0 !important;
            background-color: #f8f9fa !important;
          }
          
          .ant-table-expanded-row .ant-table-thead > tr > th {
            background-color: #e9ecef !important;
            font-weight: 600 !important;
            color: #495057 !important;
            font-size: 13px !important;
          }
        `}
      </style>
      
      <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Teklifler</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => handleCreate(true)} // Direkt template mode'da aç
        >
          Yeni Teklif
        </Button>
      </div>

      <Card>
        {/* Filtreleme Alanı */}
        <div style={{ 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '16px',
            fontWeight: 'bold',
            color: '#495057'
          }}>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filtreler
          </div>
          
          <Row gutter={[16, 16]}>
            {/* İlk satır: Teklif No, Durum, Müşteri Yanıtı, Hazırlayan */}
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Teklif No</div>
              <Input
                value={filters.offerNo}
                onChange={(e) => handleFilterChange('offerNo', e.target.value)}
                placeholder="Teklif no ara..."
                allowClear
                prefix={<SearchOutlined />}
                autoFocus
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Durum</div>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                style={{ width: '100%' }}
                placeholder="Tüm Durumlar"
              >
                <Option value="all">Tüm Durumlar</Option>
                <Option value="draft">Taslak</Option>
                <Option value="sent">Gönderildi</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Müşteri Yanıtı</div>
              <Select
                value={filters.customerResponse}
                onChange={(value) => handleFilterChange('customerResponse', value)}
                style={{ width: '100%' }}
                placeholder="Tüm Yanıtlar"
              >
                <Option value="all">Tüm Yanıtlar</Option>
                <Option value="pending">Bekliyor</Option>
                <Option value="accepted">Kabul Edildi</Option>
                <Option value="rejected">Reddedildi</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Hazırlayan</div>
              <Select
                value={filters.createdBy}
                onChange={(value) => handleFilterChange('createdBy', value)}
                style={{ width: '100%' }}
                placeholder="Tüm Kullanıcılar"
                showSearch
                optionFilterProp="children"
              >
                <Option value="all">Tüm Kullanıcılar</Option>
                {availableUsers.map(user => (
                  <Option key={user} value={user}>{user}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* İkinci satır: Firma, Oluşturma Tarihi, Temizle butonu */}
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Firma</div>
              <Select
                value={filters.company}
                onChange={(value) => handleFilterChange('company', value)}
                style={{ width: '100%' }}
                placeholder="Tüm Firmalar"
                showSearch
                optionFilterProp="children"
              >
                <Option value="all">Tüm Firmalar</Option>
                {availableCompanies.map(company => (
                  <Option key={company} value={company}>{company}</Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Oluşturma Tarihi</div>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                style={{ width: '100%' }}
                placeholder={['Başlangıç', 'Bitiş']}
                format="DD/MM/YYYY"
              />
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>&nbsp;</div>
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                style={{ width: '100%' }}
              >
                Temizle
              </Button>
            </Col>
          </Row>
          
          {/* Aktif filtre sayısı gösterimi */}
          {(() => {
            const activeFilters = [
              filters.status !== 'all' ? 'Durum' : null,
              filters.company !== 'all' ? 'Firma' : null,
              filters.createdBy !== 'all' ? 'Hazırlayan' : null,
              filters.offerNo.trim() ? 'Teklif No' : null,
              filters.dateRange ? 'Tarih' : null
            ].filter(Boolean);
            
            return activeFilters.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#6c757d' 
              }}>
                <strong>{filteredOffers.length}</strong> teklif gösteriliyor 
                ({activeFilters.length} filtre aktif: {activeFilters.join(', ')})
              </div>
            );
          })()}
        </div>

        <Table
          columns={columns}
          dataSource={parentOffers}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: (event) => {
              // Eğer tıklanan element bir buton, input veya link ise satır tıklamasını engelle
              const target = event.target;
              const clickableElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
              const isClickableElement = clickableElements.includes(target.tagName) || 
                                       target.closest('button') || 
                                       target.closest('a') || 
                                       target.closest('.ant-btn') ||
                                       target.closest('.ant-popconfirm') ||
                                       target.closest('.ant-dropdown');
              
              // Eğer buton vs. tıklanmışsa Ant Design'ın kendi expand işlemini engelle
              if (isClickableElement) {
                event.stopPropagation();
              }
            },
            style: {
              cursor: getRevisions(record.id).length > 0 ? 'pointer' : 'default'
            }
          })}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kayıt`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          scroll={{ x: 800 }}
          expandable={{
            expandedRowRender: (record) => {
              const revisions = getRevisions(record.id);
              if (revisions.length === 0) {
                return <div style={{ padding: '16px', color: '#999' }}>Bu teklif için revizyon bulunmuyor</div>;
              }
              
              return (
                <div style={{ 
                  margin: '0 0 0 40px', 
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderLeft: '4px solid #1890ff',
                  borderRadius: '6px'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#1890ff',
                    fontSize: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    📋 Revizyonlar ({revisions.length})
                  </div>
                  <Table
                    columns={[
                      {
                        title: 'Revize No',
                        dataIndex: 'revision_no',
                        key: 'revision_no',
                        width: 100,
                        sorter: (a, b) => a.revision_no - b.revision_no,
                        render: (rev_no) => `R${rev_no}`
                      },
                      {
                        title: 'Teklif No',
                        dataIndex: 'offer_no',
                        key: 'offer_no',
                      },
                      {
                        title: 'Oluşturma Tarihi',
                        dataIndex: 'created_at',
                        key: 'created_at',
                        width: 140,
                        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
                        render: (date) => new Date(date).toLocaleDateString('tr-TR'),
                      },
                      {
                        title: 'Durum',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        sorter: (a, b) => (a.status || 'draft').localeCompare(b.status || 'draft', 'tr'),
                        render: (status) => (
                          <Tag color={status === 'sent' ? 'green' : 'blue'}>
                            {status === 'sent' ? 'Gönderildi' : 'Taslak'}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Müşteri Yanıtı',
                        dataIndex: 'customer_response',
                        key: 'customer_response',
                        width: 130,
                        sorter: (a, b) => {
                          const aResponse = a.customer_response || 'pending';
                          const bResponse = b.customer_response || 'pending';
                          return aResponse.localeCompare(bResponse, 'tr');
                        },
                        render: (response) => {
                          if (!response) {
                            return <Tag icon={<QuestionCircleOutlined />} color="default">Bekliyor</Tag>;
                          }
                          if (response === 'accepted') {
                            return <Tag icon={<CheckOutlined />} color="success">Kabul</Tag>;
                          }
                          if (response === 'rejected') {
                            return <Tag icon={<CloseOutlined />} color="error">Red</Tag>;
                          }
                          return <Tag color="default">{response}</Tag>;
                        },
                      },
                      {
                        title: 'Hazırlayan',
                        dataIndex: 'created_by_name',
                        key: 'created_by_name',
                        render: (name) => name || '-',
                      },
                      {
                        title: 'Firma',
                        dataIndex: 'company',
                        key: 'company',
                        render: (company) => company || '-',
                      },
                      {
                        title: 'İşlemler',
                        key: 'actions',
                        width: 320,
                        render: (_, revRecord) => (
                          <Space>
                            {/* 1. Düzenle */}
                            <Button
                              type="primary"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(revRecord)}
                              title="Düzenle"
                            />
                            
                            {/* 2. Revizyon Oluştur */}
                            <Button
                              type="default"
                              size="small"
                              icon={<BranchesOutlined />}
                              onClick={() => handleCreateRevision(revRecord)}
                              title="Revizyon Oluştur"
                            />
                            
                            {/* 3. Gönderildi İşaretle */}
                            <Button
                              type="default"
                              size="small"
                              icon={<SendOutlined />}
                              onClick={() => handleToggleStatus(revRecord)}
                              title={revRecord.status === 'sent' ? 'Taslak Yap' : 'Gönderildi İşaretle'}
                              style={{ 
                                color: revRecord.status === 'sent' ? '#52c41a' : '#1890ff',
                                borderColor: revRecord.status === 'sent' ? '#52c41a' : '#1890ff'
                              }}
                            />
                            
                            {/* 4. Müşteri Yanıtı */}
                            <Popconfirm
                              title={revRecord.status === 'sent' ? "Müşteri yanıtını seçin:" : "Bu teklif henüz gönderilmemiş"}
                              description={
                                revRecord.status === 'sent' ? (
                                  <div style={{ marginTop: 8 }}>
                                    <Button
                                      size="small"
                                      icon={<CheckOutlined />}
                                      onClick={() => handleCustomerResponse(revRecord, 'accepted')}
                                      disabled={revRecord.customer_response === 'accepted'}
                                      style={{ 
                                        marginRight: 8,
                                        color: revRecord.customer_response === 'accepted' ? '#52c41a' : '#1890ff',
                                        borderColor: revRecord.customer_response === 'accepted' ? '#52c41a' : '#1890ff',
                                        backgroundColor: revRecord.customer_response === 'accepted' ? '#f6ffed' : 'transparent'
                                      }}
                                    >
                                      Kabul
                                    </Button>
                                    <Button
                                      size="small"
                                      icon={<CloseOutlined />}
                                      onClick={() => handleCustomerResponse(revRecord, 'rejected')}
                                      disabled={revRecord.customer_response === 'rejected'}
                                      style={{ 
                                        marginRight: 8,
                                        color: revRecord.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                        borderColor: revRecord.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                        backgroundColor: revRecord.customer_response === 'rejected' ? '#fff2f0' : 'transparent'
                                      }}
                                    >
                                      Red
                                    </Button>
                                    {revRecord.customer_response && (
                                      <Button
                                        size="small"
                                        icon={<QuestionCircleOutlined />}
                                        onClick={() => handleCustomerResponse(revRecord, null)}
                                        style={{ 
                                          color: '#faad14',
                                          borderColor: '#faad14'
                                        }}
                                      >
                                        Sıfırla
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                                    Önce teklifin gönderildi olarak işaretlenmesi gerekiyor.
                                  </div>
                                )
                              }
                              showCancel={false}
                              showOk={false}
                              okButtonProps={{ style: { display: 'none' } }}
                              cancelButtonProps={{ style: { display: 'none' } }}
                              trigger="click"
                              disabled={revRecord.status !== 'sent'}
                            >
                              <Button
                                size="small"
                                icon={
                                  revRecord.customer_response === 'accepted' ? <CheckOutlined /> :
                                  revRecord.customer_response === 'rejected' ? <CloseOutlined /> :
                                  <QuestionCircleOutlined />
                                }
                                title="Müşteri Yanıtı"
                                disabled={revRecord.status !== 'sent'}
                                style={{ 
                                  color: revRecord.status !== 'sent' ? '#d9d9d9' : 
                                         revRecord.customer_response === 'accepted' ? '#52c41a' : 
                                         revRecord.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                  borderColor: revRecord.status !== 'sent' ? '#d9d9d9' : 
                                              revRecord.customer_response === 'accepted' ? '#52c41a' : 
                                              revRecord.customer_response === 'rejected' ? '#ff4d4f' : '#1890ff',
                                  backgroundColor: revRecord.status !== 'sent' ? '#fafafa' :
                                                  revRecord.customer_response === 'accepted' ? '#f6ffed' : 
                                                  revRecord.customer_response === 'rejected' ? '#fff2f0' : 'transparent',
                                  cursor: revRecord.status !== 'sent' ? 'not-allowed' : 'pointer'
                                }}
                              />
                            </Popconfirm>
                            
                            {/* 5. Excel'e Aktar */}
                            <Button
                              type="default"
                              size="small"
                              icon={<FileExcelOutlined />}
                              onClick={() => handleExportToExcel(revRecord)}
                              title="Excel'e Aktar"
                              style={{ 
                                color: '#52c41a',
                                borderColor: '#52c41a'
                              }}
                            />
                            
                            {/* 6. PDF'e Aktar */}
                            <Button
                              type="default"
                              size="small"
                              icon={<FilePdfOutlined />}
                              onClick={() => {
                                // TODO: PDF export fonksiyonu eklenecek
                                console.log('PDF export:', revRecord);
                              }}
                              title="PDF'e Aktar"
                              style={{ 
                                color: '#ff4d4f',
                                borderColor: '#ff4d4f'
                              }}
                            />
                            
                            {/* 7. Sil */}
                            <Popconfirm
                              title="Revizyonu silmek istediğinizden emin misiniz?"
                              onConfirm={() => handleDelete(revRecord.id)}
                              okText="Evet"
                              cancelText="Hayır"
                            >
                              <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                title="Sil"
                              />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                    dataSource={revisions}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    style={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px'
                    }}
                    bordered
                  />
                </div>
              );
            },
            expandedRowKeys: expandedRowKeys,
            onExpand: (expanded, record) => {
              setExpandedRowKeys(expanded 
                ? [...expandedRowKeys, record.id] 
                : expandedRowKeys.filter(key => key !== record.id)
              );
            },
            rowExpandable: (record) => {
              const revisions = getRevisions(record.id);
              return revisions.length > 0;
            },
            expandRowByClick: true,
          }}
        />
      </Card>

      <Modal
        title={editingOffer 
          ? `Teklif Düzenle: ${editingOffer.offer_no}` 
          : offerData.parent_offer_id 
            ? 'Revizyon Oluştur' 
            : 'Yeni Teklif'
        }
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={1200}
        afterOpenChange={(open) => {
          if (open && !editingOffer && currentStep === 0) {
            // Sadece yeni teklif modunda Teklif No alanına focus
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
        {/* Hem yeni teklif hem düzenleme modu - wizard */}
        <div>
          <Steps current={currentStep} style={{ marginBottom: 24 }}>
              <Step title="Teklif Bilgileri" description="Teklif No ve Firma" />
              {isTemplateMode && <Step title="Template Seçimi" description="Hazır template seç" />}
              <Step title="Ürün Seçimi" description="Fiyat listesi ve ürünler" />
              <Step title="İndirim Oranı" description="Liste bazında indirimler" />
              <Step title="Kar Oranı" description="Liste bazında kar marjları" />
              <Step title="Manuel Fiyat" description="Ürün bazında fiyat düzenleme" />
              <Step title="Ön İzleme" description="Teklif özeti ve kontrol" />
            </Steps>

            {/* Language Selection for Steps 2, 5 and 6 only */}
            {(() => {
              const productSelectionStep = isTemplateMode ? 2 : 1;
              const manualPriceStep = isTemplateMode ? 5 : 4;
              const previewStep = isTemplateMode ? 6 : 5;
              return (currentStep === productSelectionStep || currentStep === manualPriceStep || currentStep === previewStep);
            })() && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Button.Group>
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
                </Button.Group>
              </div>
            )}

            {currentStep === 0 && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleStep1Submit}
                autoComplete="off"
              >
                <Form.Item
                  name="offer_no"
                  label="Teklif No"
                  rules={[{ required: true, message: 'Teklif No gereklidir!' }]}
                >
                  <Input 
                    placeholder="Teklif numarasını girin" 
                    autoComplete="off"
                    autoFocus
                    disabled={editingOffer ? true : false}
                  />
                </Form.Item>

                <Form.Item
                  name="company"
                  label="Firma"
                >
                  <AutoComplete
                    options={companyOptions}
                    onSearch={searchCompanies}
                    placeholder="Firma adını girin veya seçin"
                    allowClear
                    filterOption={false}
                    autoComplete="off"
                    autoFocus={true}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setModalVisible(false)}>İptal</Button>
                    <Button type="primary" htmlType="submit">Sonraki Adım</Button>
                  </Space>
                </Form.Item>
              </Form>
            )}

            {/* Template Selection Step - Only in template mode */}
            {isTemplateMode && currentStep === 1 && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Teklif:</strong> {offerData.offer_no} | <strong>Firma:</strong> {offerData.company || '-'}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: '#666' }}>Bir template seçin:</p>
                </div>

                <Table
                  columns={[
                    {
                      title: 'Template Adı',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: 'Açıklama',
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true,
                    },
                    {
                      title: 'Ürün Sayısı',
                      dataIndex: 'item_count',
                      key: 'item_count',
                      width: 100,
                      align: 'center',
                      render: (count) => <Tag color="blue">{count} ürün</Tag>,
                    },
                    {
                      title: 'Oluşturan',
                      key: 'creator',
                      width: 120,
                      render: (_, record) => {
                        if (record.creator_first_name && record.creator_last_name) {
                          return `${record.creator_first_name} ${record.creator_last_name}`;
                        }
                        return '-';
                      },
                    },
                    {
                      title: 'Seç',
                      key: 'select',
                      width: 80,
                      render: (_, record) => (
                        <Button
                          type={selectedTemplate?.id === record.id ? 'primary' : 'default'}
                          size="small"
                          onClick={() => {
                            // Toggle seçimi: eğer zaten seçiliyse kaldır, değilse seç
                            if (selectedTemplate?.id === record.id) {
                              setSelectedTemplate(null);
                            } else {
                              setSelectedTemplate(record);
                            }
                          }}
                        >
                          {selectedTemplate?.id === record.id ? 'Seçildi' : 'Seç'}
                        </Button>
                      ),
                    },
                  ]}
                  dataSource={availableTemplates}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  size="small"
                />

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setCurrentStep(0)}>Önceki Adım</Button>
                    <Button 
                      type="primary"
                      loading={loading}
                      onClick={async () => {
                        if (selectedTemplate) {
                          // Template seçilmişse template items'ları yükle
                          try {
                            setLoading(true);
                            const response = await axios.get(`http://localhost:3001/api/offer-templates/${selectedTemplate.id}/items`);
                            if (response.data.success) {
                              // Template'den gelen ürünleri selectedItems'a ekle
                              const templateItems = response.data.items.map(item => ({
                                ...item,
                                quantity: item.quantity,
                                total_price: item.quantity * item.price,
                                // Template'deki ID'yi kullan ama product_id ve pricelist_id bilgilerini de koru
                                name_tr: item.name_tr,
                                name_en: item.name_en,
                                description_tr: item.description_tr,
                                description_en: item.description_en,
                                // Eşleşme için gerekli alanlar
                                product_id: item.product_id,
                                pricelist_id: item.pricelist_id
                              }));
                              setSelectedItems(templateItems);
                              setCurrentStep(2); // Ürün seçimi adımına geç
                            }
                          } catch (error) {
                            console.error('Template items error:', error);
                            NotificationService.error('Hata', 'Template ürünleri yüklenemedi');
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          // Template seçilmemişse direkt ürün seçimi adımına geç
                          setSelectedItems([]);
                          setCurrentStep(2);
                        }
                      }}
                    >
                      {selectedTemplate ? 'Template ile Sonraki Adım' : 'Sonraki Adım'}
                    </Button>
                  </Space>
                </div>
              </div>
            )}

            {(() => {
              const productSelectionStep = isTemplateMode ? 2 : 1;
              return currentStep === productSelectionStep;
            })() && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Teklif:</strong> {offerData.offer_no} | <strong>Firma:</strong> {offerData.company || '-'}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Search
                    placeholder="Ürün ara... (ürün adı, ID veya açıklama)"
                    allowClear
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    style={{ width: '100%' }}
                    prefix={<SearchOutlined />}
                  />
                </div>

                {/* Filtreleme sonucu kontrolü */}
                {productFilter.trim() && pricelists.every(pricelist => filterItems(pricelist.items).length === 0) && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 40, 
                    color: '#999',
                    backgroundColor: '#f9f9f9',
                    borderRadius: 6,
                    marginBottom: 16 
                  }}>
                    <SearchOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                    <div>"{productFilter}" için ürün bulunamadı</div>
                    <div style={{ fontSize: '12px', marginTop: 4 }}>Farklı bir arama terimi deneyin</div>
                  </div>
                )}

                <Collapse>
                  {pricelists.map(pricelist => {
                    const filteredItems = filterItems(pricelist.items);
                    if (filteredItems.length === 0 && productFilter.trim()) {
                      return null;
                    }
                    return (
                      <Panel 
                        header={`${pricelist.name} (${pricelist.currency}) - ${filteredItems.length}/${pricelist.items.length} ürün${productFilter.trim() ? ' (filtrelenmiş)' : ''}`} 
                        key={pricelist.id}
                      >
                        {filteredItems.map(item => {
                        const selectedItem = selectedItems.find(selected => 
                          selected.id === item.id || 
                          (selected.product_id === item.product_id && selected.pricelist_id === pricelist.id)
                        );
                        const isSelected = !!selectedItem;
                        return (
                          <div key={item.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '8px 0',
                            borderBottom: '1px solid #f0f0f0'
                          }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => handleItemSelection({...item, pricelist_id: pricelist.id, currency: pricelist.currency}, e.target.checked)}
                            />
                            <div style={{ flex: 1, marginLeft: 12 }}>
                              <div><strong>{selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)}</strong> ({item.product_id})</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {(selectedLanguage === 'tr' ? (item.description_tr || item.description_en || item.description) : (item.description_en || item.description_tr || item.description)) || 'Açıklama yok'} | {item.price} {pricelist.currency} | 
                                <span style={{ 
                                  color: item.stock <= 0 ? '#ff4d4f' : item.stock < 10 ? '#ff4d4f' : item.stock < 50 ? '#faad14' : '#52c41a',
                                  fontWeight: 'bold',
                                  marginLeft: 4
                                }}>
                                  Stok: {item.stock} {item.unit}
                                </span>
                                {item.stock <= 0 && <span style={{ color: '#ff4d4f' }}> (Stok Yok!)</span>}
                                {item.stock > 0 && item.stock < 10 && <span style={{ color: '#ff4d4f' }}> (Düşük Stok!)</span>}
                              </div>
                            </div>
                            {isSelected && (
                              <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 8 }}>Adet:</span>
                                <AntInputNumber
                                  min={0}
                                  max={item.stock <= 0 ? 0 : item.stock}
                                  value={selectedItem.quantity}
                                  onChange={(value) => handleQuantityChange(selectedItem.id, value)}
                                  disabled={item.stock <= 0}
                                  style={{ width: 80 }}
                                />
                                <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                                  {selectedItem.total_price} {pricelist.currency}
                                </span>
                                {/* İndirim alanı */}
                                <Input
                                  placeholder="Ürün İndirimi %"
                                  value={itemDiscounts[item.id] || ''}
                                  onChange={e => {
                                    const value = e.target.value;
                                    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                                      setItemDiscounts({ ...itemDiscounts, [item.id]: value });
                                    }
                                  }}
                                  style={{ width: 120, marginLeft: 8 }}
                                  addonAfter="%"
                                />
                                {/* İndirimli fiyat gösterimi */}
                                {itemDiscounts[item.id] && parseFloat(itemDiscounts[item.id]) > 0 && (
                                  <span style={{ 
                                    marginLeft: 8, 
                                    fontWeight: 'bold',
                                    color: '#52c41a'
                                  }}>
                                    İndirimli: {formatCurrency(
                                      (parseFloat(selectedItem.total_price) * (1 - parseFloat(itemDiscounts[item.id]) / 100)),
                                      pricelist.currency
                                    )}
                                  </span>
                                )}
                                {/* Açıklama alanı */}
                                <Input
                                  placeholder="Açıklama (opsiyonel)"
                                  value={itemNotes[item.id] || ''}
                                  onChange={e => setItemNotes({ ...itemNotes, [item.id]: e.target.value })}
                                  style={{ width: 180, marginLeft: 8 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                        })}
                      </Panel>
                    );
                  })}
                </Collapse>

                <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                  <strong>Seçilen Ürünler: {selectedItems.length}</strong>
                  {selectedItems.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {selectedItems.map(item => (
                        <div key={item.id} style={{ fontSize: '12px' }}>
                          {selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)} x {item.quantity} = {item.total_price} {item.currency}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    <Button onClick={handlePrevStep}>Önceki Adım</Button>
                    <Button onClick={handleModalClose}>İptal</Button>
                    <Button 
                      type="primary" 
                      disabled={selectedItems.length === 0}
                      onClick={() => {
                        const nextStep = isTemplateMode ? 3 : 2;
                        setCurrentStep(nextStep);
                      }}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {(() => {
              const discountStep = isTemplateMode ? 3 : 2;
              return currentStep === discountStep;
            })() && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Teklif:</strong> {offerData.offer_no} | <strong>Firma:</strong> {offerData.company || '-'}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>İndirim Oranları</Title>
                  <p>Her fiyat listesi için indirim oranları ekleyebilirsiniz. İndirimler sırasıyla uygulanır.</p>
                </div>

                {groupItemsByPricelist().map((group) => {
                  const pricelistId = group.pricelist.id;
                  const originalTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
                  const discounts = discountData[pricelistId] || [];

                  return (
                    <Card key={pricelistId} style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 16 }}>
                        <strong>{group.pricelist.name}</strong> ({group.pricelist.currency})
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Ürün sayısı: {group.items.length} | 
                          Orijinal tutar: {formatCurrency(originalTotal, group.pricelist.currency)}
                        </div>
                      </div>

                      {discounts.map((discount, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: 8,
                          padding: '8px 12px',
                          backgroundColor: '#f9f9f9',
                          borderRadius: 4
                        }}>
                          <span style={{ minWidth: '80px' }}>İndirim {index + 1}:</span>
                          <InputNumber
                            placeholder="Oran"
                            min={0}
                            max={100}
                            value={discount.rate}
                            onChange={(value) => updateDiscount(pricelistId, index, 'rate', value || 0)}
                            style={{ width: 100, marginRight: 8 }}
                            addonAfter="%"
                          />
                          <Input
                            placeholder="Açıklama (opsiyonel)"
                            value={discount.description}
                            onChange={(e) => updateDiscount(pricelistId, index, 'description', e.target.value)}
                            style={{ flex: 1, marginRight: 8 }}
                          />
                          <Button
                            type="text"
                            danger
                            onClick={() => removeDiscount(pricelistId, index)}
                            icon={<DeleteOutlined />}
                          />
                        </div>
                      ))}

                      <div style={{ marginTop: 12 }}>
                        <Button
                          type="dashed"
                          onClick={() => addDiscount(pricelistId)}
                          icon={<PlusOutlined />}
                          style={{ marginRight: 16 }}
                        >
                          İndirim Ekle
                        </Button>
                        
                        {discounts.length > 0 && (
                          <span style={{ 
                            fontWeight: 'bold',
                            color: '#1890ff' 
                          }}>
                            İndirimli tutar: {formatCurrency(calculateDiscountedTotal(pricelistId), group.pricelist.currency)}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    <Button onClick={handlePrevStep}>Önceki Adım</Button>
                    <Button onClick={handleModalClose}>İptal</Button>
                    <Button 
                      type="primary"
                      onClick={() => {
                        const nextStep = isTemplateMode ? 4 : 3;
                        setCurrentStep(nextStep);
                      }}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {(() => {
              const profitStep = isTemplateMode ? 4 : 3;
              return currentStep === profitStep;
            })() && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Teklif:</strong> {offerData.offer_no} | <strong>Firma:</strong> {offerData.company || '-'}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>Kar Oranları</Title>
                  <p>Her fiyat listesi için kar oranları ekleyebilirsiniz. Kar oranları indirimli fiyat üzerinden sırasıyla uygulanır.</p>
                </div>

                {groupItemsByPricelist().map((group) => {
                  const pricelistId = group.pricelist.id;
                  const originalTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
                  
                  // İndirimli tutar hesapla
                  const discounts = discountData[pricelistId] || [];
                  const discountedTotal = calculateDiscountedTotal(pricelistId);
                  
                  const profits = profitData[pricelistId] || [];

                  return (
                    <Card key={pricelistId} style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 16 }}>
                        <strong>{group.pricelist.name}</strong> ({group.pricelist.currency})
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Ürün sayısı: {group.items.length} | 
                          İndirimli tutar: {formatCurrency(discountedTotal, group.pricelist.currency)}
                        </div>
                      </div>

                      {profits.map((profit, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: 8,
                          padding: '8px 12px',
                          backgroundColor: '#f6ffed',
                          borderRadius: 4,
                          border: '1px solid #b7eb8f'
                        }}>
                          <span style={{ minWidth: '80px' }}>Kar {index + 1}:</span>
                          <InputNumber
                            placeholder="Oran"
                            min={0}
                            max={1000}
                            value={profit.rate}
                            onChange={(value) => updateProfit(pricelistId, index, 'rate', value || 0)}
                            style={{ width: 100, marginRight: 8 }}
                            addonAfter="%"
                          />
                          <Input
                            placeholder="Açıklama (opsiyonel)"
                            value={profit.description}
                            onChange={(e) => updateProfit(pricelistId, index, 'description', e.target.value)}
                            style={{ flex: 1, marginRight: 8 }}
                          />
                          <Button
                            type="text"
                            danger
                            onClick={() => removeProfit(pricelistId, index)}
                            icon={<DeleteOutlined />}
                          />
                        </div>
                      ))}

                      <div style={{ marginTop: 12 }}>
                        <Button
                          type="dashed"
                          onClick={() => addProfit(pricelistId)}
                          icon={<PlusOutlined />}
                          style={{ marginRight: 16 }}
                        >
                          Kar Oranı Ekle
                        </Button>
                        
                        {profits.length > 0 && (
                          <span style={{ 
                            fontWeight: 'bold',
                            color: '#52c41a' 
                          }}>
                            Final tutar: {formatCurrency(calculatePricelistTotal(pricelistId), group.pricelist.currency)}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    <Button onClick={handlePrevStep}>Önceki Adım</Button>
                    <Button onClick={handleModalClose}>İptal</Button>
                    <Button 
                      type="primary"
                      onClick={() => {
                        const nextStep = isTemplateMode ? 5 : 4;
                        setCurrentStep(nextStep);
                      }}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {(() => {
              const manualPriceStep = isTemplateMode ? 5 : 4;
              return currentStep === manualPriceStep;
            })() && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Teklif:</strong> {offerData.offer_no} | <strong>Firma:</strong> {offerData.company || '-'}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>Manuel Fiyat Düzenleme</Title>
                  <p>İsterseniz bazı ürünlerin fiyatlarını manuel olarak değiştirebilirsiniz. Manuel fiyat girildiğinde hesaplanan fiyat iptal olur.</p>
                </div>

                {groupItemsByPricelist().map((group) => {
                  const pricelistId = group.pricelist.id;

                  return (
                    <Card key={pricelistId} style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 16 }}>
                        <strong>{group.pricelist.name}</strong> ({group.pricelist.currency})
                      </div>

                      {group.items.map((item) => {
                        const calculatedPrice = calculateItemSalesPrice(item, pricelistId);
                        const manualPrice = manualPrices[item.id] || { enabled: false, price: '' };
                        
                        return (
                          <div key={item.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: 12,
                            padding: '12px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: 6
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold' }}>{selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {item.product_id} | Adet: {item.quantity}
                              </div>
                              <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                                {(selectedLanguage === 'tr' ? (item.description_tr || item.description_en || item.description) : (item.description_en || item.description_tr || item.description)) || 'Açıklama yok'}
                              </div>
                            </div>
                            
                            <div style={{ marginLeft: 16, textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: '#666' }}>Hesaplanan Fiyat:</div>
                              <div style={{ fontWeight: 'bold' }}>
                                {formatCurrency(calculatedPrice, group.pricelist.currency)}
                              </div>
                            </div>

                            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
                              <Checkbox
                                checked={manualPrice.enabled}
                                onChange={(e) => {
                                  setManualPrices({
                                    ...manualPrices,
                                    [item.id]: {
                                      ...manualPrice,
                                      enabled: e.target.checked,
                                      price: e.target.checked ? (calculatedPrice / item.quantity) : ''
                                    }
                                  });
                                }}
                              >
                                Manuel Fiyat
                              </Checkbox>
                            </div>

                            {manualPrice.enabled && (
                              <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 8 }}>Birim Fiyat:</span>
                                <InputNumber
                                  value={manualPrice.price}
                                  onChange={(value) => {
                                    setManualPrices({
                                      ...manualPrices,
                                      [item.id]: {
                                        ...manualPrice,
                                        price: value || 0
                                      }
                                    });
                                  }}
                                  style={{ width: 120 }}
                                  step={0.01}
                                  min={0}
                                  placeholder="0.00"
                                />
                                <span style={{ marginLeft: 8, fontWeight: 'bold', color: '#52c41a' }}>
                                  Toplam: {formatCurrency((manualPrice.price || 0) * item.quantity, group.pricelist.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Card>
                  );
                })}

                {/* Genel Toplam */}
                <div style={{ 
                  marginTop: 24, 
                  padding: '16px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: 8,
                  border: '2px solid #d9d9d9'
                }}>
                  {groupItemsByPricelist().map((group) => {
                    const groupTotal = group.items.reduce((total, item) => {
                      // Açıklama ürünlerini toplama dahil etme
                      if (isDescriptionItem(item)) {
                        return total;
                      }
                      return total + (calculateItemFinalPrice(item, group.pricelist.id) * item.quantity);
                    }, 0);

                    return (
                      <div key={group.pricelist.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 8,
                        fontSize: '14px'
                      }}>
                        <span><strong>{group.pricelist.name}:</strong></span>
                        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                          {formatCurrency(groupTotal, group.pricelist.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    <Button onClick={handlePrevStep}>Önceki Adım</Button>
                    <Button onClick={handleModalClose}>İptal</Button>
                    <Button 
                      type="primary"
                      onClick={() => {
                        const nextStep = isTemplateMode ? 6 : 5;
                        setCurrentStep(nextStep);
                      }}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {(() => {
              const previewStep = isTemplateMode ? 6 : 5;
              return currentStep === previewStep;
            })() && (
              <div>
                {/* Başlık Bölümü */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 24,
                  paddingBottom: 16,
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      Teklif No: {offerData.offer_no}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      Rev. No: 0
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: 4 }}>
                      Tarih: {formatDate(new Date())}
                    </div>
                  </div>
                </div>

                {/* Firma Bilgisi */}
                {offerData.company && (
                  <div style={{ marginBottom: 24 }}>
                    <strong>Firma:</strong> {offerData.company}
                  </div>
                )}

                {/* Fiyat Listelerine Göre Gruplu Ürünler */}
                {groupItemsByPricelist().map((group, index) => {
                  // Filtre: adet > 0 veya açıklama dolu ise göster
                  const filteredItems = group.items.filter(item => {
                    const note = itemNotes[item.id];
                    return item.quantity > 0 || (note && note.trim() !== '');
                  });
                  if (filteredItems.length === 0) return null;
                  return (
                    <div key={group.pricelist.id} style={{ marginBottom: 32 }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        marginBottom: 16,
                        color: '#1890ff'
                      }}>
                        {group.pricelist.name} ({group.pricelist.currency})
                      </h3>
                      <Table 
                        dataSource={filteredItems.map(item => ({
                          ...item,
                          note: itemNotes[item.id] || ''
                        }))}
                        pagination={false}
                        rowKey="id"
                        size="small"
                        style={{ marginBottom: 16 }}
                        columns={[
                          {
                            title: 'Product Code',
                            dataIndex: 'product_id',
                            key: 'product_id',
                            width: 120,
                          },
                          {
                            title: 'Name',
                            key: 'name',
                            ellipsis: true,
                            render: (_, record) => {
                              const displayName = selectedLanguage === 'tr' 
                                ? (record.name_tr || record.name_en || record.name || '-')
                                : (record.name_en || record.name_tr || record.name || '-');
                              
                              return displayName;
                            },
                          },
                          {
                            title: 'Description',
                            key: 'description',
                            ellipsis: true,
                            render: (_, record) => {
                              const displayDescription = selectedLanguage === 'tr' 
                                ? (record.description_tr || record.description_en || record.description || '-')
                                : (record.description_en || record.description_tr || record.description || '-');
                              
                              return displayDescription;
                            }
                          },
                          {
                            title: 'Qty',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            width: 100,
                            align: 'center',
                          },
                          {
                            title: 'Unit Price',
                            dataIndex: 'price',
                            key: 'price',
                            width: 120,
                            align: 'right',
                            render: (price, record) => {
                              // Açıklama ürünü ise sadece birim fiyatı göster
                              if (isDescriptionItem(record)) {
                                return <span style={{ color: '#722ed1' }}>
                                  {formatCurrency(record.price, group.pricelist.currency)}
                                </span>;
                              }
                              
                              const finalPrice = calculateItemFinalPrice(record, group.pricelist.id);
                              const unitPrice = finalPrice / record.quantity;
                              const isManual = manualPrices[record.id] && manualPrices[record.id].enabled;
                              return <span style={{ 
                                color: isManual ? '#fa8c16' : 'inherit'
                              }}>
                                {formatCurrency(unitPrice, group.pricelist.currency)}
                                {isManual && <span style={{ fontSize: '10px', marginLeft: 4 }}>(M)</span>}
                              </span>;
                            }
                          },
                          {
                            title: 'Sales Price',
                            key: 'sales_price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => {
                              // Açıklama ürünü ise açıklamayı göster
                              if (isDescriptionItem(record)) {
                                const note = itemNotes[record.id];
                                return <span style={{ 
                                  color: '#722ed1'
                                }}>
                                  {note}
                                </span>;
                              }
                              
                              const finalPrice = calculateItemFinalPrice(record, group.pricelist.id);
                              const isManual = manualPrices[record.id] && manualPrices[record.id].enabled;
                              return <span style={{ 
                                color: isManual ? '#fa8c16' : '#52c41a', 
                                fontWeight: 'bold' 
                              }}>
                                {formatCurrency(finalPrice, group.pricelist.currency)}
                                {isManual && <span style={{ fontSize: '10px', marginLeft: 4 }}>(Manuel)</span>}
                              </span>;
                            }
                          },
                          {
                            title: <span style={{ color: '#bfbfbf' }}>Net Price</span>,
                            key: 'net_price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => {
                              // Açıklama ürünü ise liste fiyatını göster
                              if (isDescriptionItem(record)) {
                                return <span style={{ 
                                  color: '#bfbfbf'
                                }}>
                                  {formatCurrency(record.price, group.pricelist.currency)}
                                </span>;
                              }
                              
                              const netPrice = calculateItemNetPrice(record, group.pricelist.id);
                              return <span style={{ color: '#bfbfbf' }}>
                                {formatCurrency(netPrice, group.pricelist.currency)}
                              </span>;
                            }
                          },
                          {
                            title: <span style={{ color: '#bfbfbf' }}>List Price</span>,
                            dataIndex: 'total_price',
                            key: 'total_price',
                            width: 150,
                            align: 'right',
                            render: (total, record) => {
                              // Açıklama ürünü ise liste fiyatını göster
                              if (isDescriptionItem(record)) {
                                return <span style={{ 
                                  color: '#bfbfbf'
                                }}>
                                  {formatCurrency(record.price, group.pricelist.currency)}
                                </span>;
                              }
                              
                              const note = record.note;
                              return note && note.trim() !== ''
                                ? <span style={{ color: '#faad14' }}>{note}</span>
                                : <span style={{ color: '#bfbfbf' }}>
                                    {formatCurrency(total, group.pricelist.currency)}
                                  </span>;
                            }
                          },
                          {
                            title: <span style={{ color: '#bfbfbf' }}>Product Sales Discount</span>,
                            key: 'product_sales_discount',
                            width: 140,
                            align: 'center',
                            render: (_, record) => {
                              const discount = itemDiscounts[record.id] || 0;
                              return discount > 0 
                                ? <span style={{ color: '#bfbfbf' }}>-{discount}%</span>
                                : <span style={{ color: '#bfbfbf' }}>-</span>;
                            }
                          }
                        ]}
                      />
                    </div>
                  );
                })}

                {/* Toplam Fiyat */}
                <div style={{ 
                  paddingTop: 16,
                  borderTop: '2px solid #f0f0f0',
                  marginTop: 24 
                }}>
                  {/* Fiyat listelerine göre ara toplamlar */}
                  <div style={{ 
                    textAlign: 'right', 
                    fontSize: '16px', 
                    marginBottom: 16 
                  }}>
                    {groupItemsByPricelist().map((group, index) => {
                      const pricelistId = group.pricelist.id;
                      const originalTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
                      
                      // İndirimli tutar hesapla
                      const discounts = discountData[pricelistId] || [];
                      const discountedTotal = calculateDiscountedTotal(pricelistId);

                      // Final tutar hesapla (kar oranlarıyla)
                      const finalTotal = calculatePricelistTotal(pricelistId);
                      const profits = profitData[pricelistId] || [];
                      
                      return (
                        <div key={group.pricelist.id} style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 4 }}>
                            <strong>{group.pricelist.name} Orijinal Toplamı:</strong> {formatCurrency(originalTotal, group.pricelist.currency)}
                          </div>
                          
                          {/* İndirimleri göster */}
                          {discounts.map((discount, discountIndex) => (
                            <div key={discountIndex} style={{ 
                              fontSize: '14px', 
                              color: '#ff4d4f',
                              marginLeft: 16,
                              marginBottom: 2
                            }}>
                              - {discount.description || `İndirim ${discountIndex + 1}`}: %{discount.rate}
                            </div>
                          ))}
                          
                          {discounts.length > 0 && (
                            <div style={{ 
                              marginLeft: 16,
                              fontSize: '14px',
                              color: '#1890ff',
                              marginBottom: 4
                            }}>
                              İndirimli Tutar: {formatCurrency(discountedTotal, group.pricelist.currency)}
                            </div>
                          )}

                          {/* Kar oranlarını göster */}
                          {profits.map((profit, profitIndex) => (
                            <div key={profitIndex} style={{ 
                              fontSize: '14px', 
                              color: '#52c41a',
                              marginLeft: 16,
                              marginBottom: 2
                            }}>
                              + {profit.description || `Kar ${profitIndex + 1}`}: %{profit.rate}
                            </div>
                          ))}
                          
                          <div style={{ 
                            marginLeft: 16,
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: profits.length > 0 ? '#52c41a' : (discounts.length > 0 ? '#52c41a' : '#000'),
                            marginBottom: 4
                          }}>
                            <strong>{group.pricelist.name} Final Toplamı:</strong> {formatCurrency(finalTotal, group.pricelist.currency)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Genel Toplam - Para Birimlerine Göre */}
                  <div style={{ 
                    textAlign: 'right', 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    paddingTop: 16,
                    borderTop: '1px solid #d9d9d9',
                    backgroundColor: '#f5f5f5',
                    padding: 16,
                    borderRadius: 6
                  }}>
                    <div style={{ marginBottom: 8, fontSize: '16px', color: '#666' }}>
                      TOTAL AMOUNT
                    </div>
                    {Object.entries(calculateTotalsByCurrency()).map(([currency, data]) => (
                      <div key={currency} style={{ 
                        marginBottom: 8,
                        color: '#1890ff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ fontSize: '16px', color: '#666' }}>
                          {data.pricelists.map(p => p.name).join(' + ')}:
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {formatCurrency(data.total, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    <Button onClick={handlePrevStep}>Önceki Adım</Button>
                    <Button onClick={handleModalClose}>İptal</Button>
                    <Button 
                      type="primary"
                      onClick={handleSaveOffer}
                    >
                      {editingOffer 
                        ? 'Teklifi Güncelle' 
                        : offerData.parent_offer_id 
                          ? 'Revizyonu Oluştur' 
                          : 'Teklifi Oluştur'
                      }
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}
          </div>
      </Modal>

      {/* İptal Onay Dialog'u */}
      <Modal
        title="Teklif İptal Edilecek!"
        open={cancelConfirmVisible}
        onOk={handleConfirmCancel}
        onCancel={() => setCancelConfirmVisible(false)}
        okText="Evet, İptal Et"
        cancelText="Hayır, Devam Et"
        okButtonProps={{ danger: true }}
      >
        <p>Bu teklif iptal edilecek ve girdiğiniz tüm veriler kaybolacak!</p>
        <p>Onaylıyor musunuz?</p>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={`Teklif Önizlemesi: ${previewOffer?.offer_no}`}
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={1200}
        footer={[
          <Space key="preview-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Space>
              <span style={{ fontWeight: 'bold', marginRight: 8 }}>Dil:</span>
              <Button.Group>
                <Button 
                  type={previewLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setPreviewLanguage('en')}
                  style={{ 
                    backgroundColor: previewLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                    borderColor: previewLanguage === 'en' ? '#1890ff' : '#d9d9d9',
                    color: previewLanguage === 'en' ? 'white' : '#666'
                  }}
                >
                  EN
                </Button>
                <Button 
                  type={previewLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setPreviewLanguage('tr')}
                  style={{ 
                    backgroundColor: previewLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                    borderColor: previewLanguage === 'tr' ? '#52c41a' : '#d9d9d9',
                    color: previewLanguage === 'tr' ? 'white' : '#666'
                  }}
                >
                  TR
                </Button>
              </Button.Group>
            </Space>
            <Button onClick={() => setPreviewModalVisible(false)}>Kapat</Button>
          </Space>
        ]}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {previewOffer && (
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                {previewOffer.offer_no}
              </Title>
              {previewOffer.company && (
                <p style={{ color: '#666', margin: 0, marginBottom: 8 }}>
                  <strong>Firma:</strong> {previewOffer.company}
                </p>
              )}
              <p style={{ color: '#666', margin: 0, marginBottom: 16 }}>
                <strong>Durum:</strong>{' '}
                <Tag color={previewOffer.status === 'sent' ? 'green' : 'blue'}>
                  {previewOffer.status === 'sent' ? 'Gönderildi' : 'Taslak'}
                </Tag>
                {previewOffer.customer_response && (
                  <>
                    {' | '}
                    <strong>Müşteri Yanıtı:</strong>{' '}
                    <Tag color={previewOffer.customer_response === 'accepted' ? 'green' : 'red'}>
                      {previewOffer.customer_response === 'accepted' ? 'Kabul' : 'Red'}
                    </Tag>
                  </>
                )}
              </p>
            </div>
          )}
          
          {(() => {
            // Ürünleri fiyat listesine göre grupla
            const groupedItems = previewItems.reduce((groups, item) => {
              const pricelistId = item.pricelist_id;
              if (!groups[pricelistId]) {
                groups[pricelistId] = {
                  items: [],
                  pricelistName: item.pricelistName || `Fiyat Listesi ${pricelistId}`,
                  pricelistColor: item.pricelistColor || '#1890ff'
                };
              }
              groups[pricelistId].items.push(item);
              return groups;
            }, {});

            const groupedEntries = Object.entries(groupedItems);
            if (groupedEntries.length === 0) {
              return <p>Bu teklifte ürün bulunmuyor.</p>;
            }

            return (
              <Collapse defaultActiveKey={groupedEntries.map((_, index) => index.toString())}>
                {groupedEntries.map(([pricelistId, group], index) => {
                  const pricelistTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
                  const currency = group.items.length > 0 ? group.items[0].currency : 'EUR';
                  
                  return (
                    <Panel 
                      key={index.toString()}
                      header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <div 
                              style={{ 
                                width: 12, 
                                height: 12, 
                                backgroundColor: group.pricelistColor,
                                borderRadius: '50%', 
                                marginRight: 8 
                              }} 
                            />
                            {group.pricelistName}
                          </span>
                          <Tag color="blue" style={{ margin: 0 }}>
                            {group.items.length} ürün - {pricelistTotal.toFixed(2)} {currency}
                          </Tag>
                        </div>
                      }
                    >
                      <Table
                        columns={[
                          {
                            title: 'Ürün Kodu',
                            dataIndex: 'product_id',
                            key: 'product_id',
                            width: 120,
                          },
                          {
                            title: 'Ürün Adı',
                            key: 'product_name',
                            render: (_, record) => {
                              return previewLanguage === 'tr' ? 
                                (record.product_name_tr || record.product_name_en || record.product_name || '-') : 
                                (record.product_name_en || record.product_name_tr || record.product_name || '-');
                            },
                          },
                          {
                            title: 'Açıklama',
                            dataIndex: 'description',
                            key: 'description',
                            ellipsis: true,
                            render: (description) => description || '-',
                          },
                          {
                            title: 'Miktar',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            width: 80,
                            align: 'center',
                          },
                          {
                            title: 'Birim Fiyat',
                            key: 'price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => `${record.price} ${record.currency}`,
                          },
                          {
                            title: 'Toplam',
                            key: 'total_price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => `${record.total_price} ${record.currency}`,
                          },
                        ]}
                        dataSource={group.items}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </Panel>
                  );
                })}
              </Collapse>
            );
          })()}
          
          {/* Genel Toplam */}
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            textAlign: 'right' 
          }}>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              Genel Toplam: {previewItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0).toFixed(2)} {previewItems.length > 0 ? previewItems[0].currency : 'EUR'}
            </Title>
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
};

export default Offers;
