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
  InputNumber as AntInputNumber
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import NotificationService from '../utils/notification';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;

// Para birimi simgesi helper
const getCurrencySymbol = (currency) => {
  const symbols = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'TRY': '₺',
    'TL': '₺'
  };
  return symbols[currency] || currency;
};

// Para birimi formatı helper
const formatCurrency = (amount, currency) => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${parseFloat(amount).toFixed(2)}`;
};

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  // Teklif numarası artık manuel girilecek
  const [companyOptions, setCompanyOptions] = useState([]);
  
  // Wizard states
  const [currentStep, setCurrentStep] = useState(0);
  const [offerData, setOfferData] = useState({}); // Adım 1 verisi
  const [selectedItems, setSelectedItems] = useState([]); // Adım 2 verisi
  const [itemNotes, setItemNotes] = useState({}); // {itemId: note}
  const [discountData, setDiscountData] = useState({}); // Adım 3 indirim verisi: {pricelistId: [{rate: number, description: string}]}
  const [profitData, setProfitData] = useState({}); // Adım 4 kar verisi: {pricelistId: [{rate: number, description: string}]}
  const [pricelists, setPricelists] = useState([]);
  const [productFilter, setProductFilter] = useState(''); // Ürün filtreleme
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);

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
        setFilteredOffers(response.data.offers);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Teklifler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
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

  const handleSearch = (value) => {
    const filtered = offers.filter(offer => 
      offer.offer_no.toLowerCase().includes(value.toLowerCase()) ||
      (offer.company && offer.company.toLowerCase().includes(value.toLowerCase())) ||
      (offer.created_by_name && offer.created_by_name.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredOffers(filtered);
  };

  const handleCreate = async () => {
  setEditingOffer(null);
  form.resetFields();
  setCurrentStep(0);
  setOfferData({});
  setSelectedItems([]);
  setProductFilter('');
  setCompanyOptions([]);
  setItemNotes({});
  setDiscountData({});
  setProfitData({});
  await fetchPricelistsWithItems();
  setModalVisible(true);
  };

  // Numara modu kaldırıldı

  // Adım 1: Teklif bilgileri
  const handleStep1Submit = (values) => {
    setOfferData(values);
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
        const originalItem = pricelists
          .flatMap(p => p.items)
          .find(pi => pi.id === itemId);
        if (!originalItem) return item;
        if (quantity > originalItem.stock) {
          NotificationService.warning(
            'Stok Uyarısı', 
            `"${originalItem.name}" ürünü için maksimum ${originalItem.stock} ${originalItem.unit} seçebilirsiniz. Mevcut stok: ${originalItem.stock}`
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
      item.name.toLowerCase().includes(filterLower) ||
      item.product_id.toLowerCase().includes(filterLower) ||
      (item.description && item.description.toLowerCase().includes(filterLower))
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

  // Ürün bazında net fiyat hesapla (o fiyat listesinin indirimlerini uygula) - Toplam fiyat
  const calculateItemNetPrice = (item, pricelistId) => {
    let netPrice = parseFloat(item.price);
    
    // O fiyat listesinin indirimlerini uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        netPrice = netPrice * (1 - discount.rate / 100);
      }
    });
    
    // Adet ile çarp
    return netPrice * item.quantity;
  };

  // Ürün bazında satış fiyatı hesapla (indirimler + kar oranları) - Toplam fiyat
  const calculateItemSalesPrice = (item, pricelistId) => {
    let salesPrice = parseFloat(item.price);
    
    // Önce indirimleri uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        salesPrice = salesPrice * (1 - discount.rate / 100);
      }
    });

    // Sonra kar oranlarını uygula
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
    let total = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    
    // Sadece indirimleri uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        total = total * (1 - discount.rate / 100);
      }
    });
    
    return total;
  };

  // Fiyat listesi toplamlarını hesapla (indirimler ve kar oranlarıyla birlikte)
  const calculatePricelistTotal = (pricelistId) => {
    const items = selectedItems.filter(item => item.pricelist_id === pricelistId);
    let total = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    
    // İndirimleri uygula
    const discounts = discountData[pricelistId] || [];
    discounts.forEach(discount => {
      if (discount.rate > 0) {
        total = total * (1 - discount.rate / 100);
      }
    });

    // Kar oranlarını uygula
    const profits = profitData[pricelistId] || [];
    profits.forEach(profit => {
      if (profit.rate > 0) {
        total = total * (1 + profit.rate / 100);
      }
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
    // Eğer düzenleme modundaysa direkt kapat
    if (editingOffer) {
      setModalVisible(false);
      return;
    }

    // Yeni teklif modunda veri girildiyse onay iste
    const hasData = selectedItems.length > 0 || 
                    Object.keys(discountData).length > 0 || 
                    Object.keys(profitData).length > 0 ||
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
    setDiscountData({});
    setProfitData({});
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

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    form.setFieldsValue({
      offer_no: offer.offer_no,
      company: offer.company,
      revision_no: offer.revision_no
    });
    setModalVisible(true);
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

  const columns = [
    {
      title: 'Teklif No',
      dataIndex: 'offer_no',
      key: 'offer_no',
      sorter: (a, b) => a.offer_no.localeCompare(b.offer_no, 'tr'),
    },
    {
      title: 'Rev. No',
      dataIndex: 'revision_no',
      key: 'revision_no',
      width: 100,
      sorter: (a, b) => a.revision_no - b.revision_no,
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
      dataIndex: 'revised_at',
      key: 'revised_at',
      width: 140,
      sorter: (a, b) => {
        if (!a.revised_at && !b.revised_at) return 0;
        if (!a.revised_at) return -1;
        if (!b.revised_at) return 1;
        return new Date(a.revised_at) - new Date(b.revised_at);
      },
      render: (date) => date ? new Date(date).toLocaleDateString('tr-TR') : '-',
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
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Düzenle"
          />
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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Teklifler</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Yeni Teklif
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="Teklif ara..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredOffers}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kayıt`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingOffer ? 'Teklif Düzenle' : 'Yeni Teklif'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={editingOffer ? 600 : 1200}
        afterOpenChange={(open) => {
          if (open && editingOffer) {
            // Sadece düzenleme modunda Teklif No alanına focus
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
        {editingOffer ? (
          // Düzenleme modu - eski form
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
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
                disabled
              />
            </Form.Item>

            <Form.Item
              name="revision_no"
              label="Rev. No"
              rules={[{ required: true, message: 'Rev. No gereklidir!' }]}
            >
              <InputNumber 
                placeholder="Revizyon numarasını girin" 
                autoComplete="off"
                style={{ width: '100%' }}
                min={0}
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
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setModalVisible(false)}>İptal</Button>
                <Button type="primary" htmlType="submit">Güncelle</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          // Yeni teklif modu - wizard
          <div>
            <Steps current={currentStep} style={{ marginBottom: 24 }}>
              <Step title="Teklif Bilgileri" description="Teklif No ve Firma" />
              <Step title="Ürün Seçimi" description="Fiyat listesi ve ürünler" />
              <Step title="İndirim Oranı" description="Liste bazında indirimler" />
              <Step title="Kar Oranı" description="Liste bazında kar marjları" />
              <Step title="Ön İzleme" description="Teklif özeti ve kontrol" />
            </Steps>

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

            {currentStep === 1 && (
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
                        const selectedItem = selectedItems.find(selected => selected.id === item.id);
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
                              <div><strong>{item.name}</strong> ({item.product_id})</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {item.description} | {item.price} {pricelist.currency} | 
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
                                  onChange={(value) => handleQuantityChange(item.id, value)}
                                  disabled={item.stock <= 0}
                                  style={{ width: 80 }}
                                />
                                <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                                  {selectedItem.total_price} {pricelist.currency}
                                </span>
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
                          {item.name} x {item.quantity} = {item.total_price} {item.currency}
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
                      onClick={() => setCurrentStep(2)}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {currentStep === 2 && (
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
                      onClick={() => setCurrentStep(3)}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {currentStep === 3 && (
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
                      onClick={() => setCurrentStep(4)}
                    >
                      Sonraki Adım
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}

            {currentStep === 4 && (
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
                            dataIndex: 'name',
                            key: 'name',
                            ellipsis: true,
                          },
                          {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description',
                            ellipsis: true,
                            render: (text) => text || '-'
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
                            render: (price) => formatCurrency(price, group.pricelist.currency)
                          },
                          {
                            title: 'Sales Price',
                            key: 'sales_price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => {
                              const salesPrice = calculateItemSalesPrice(record, group.pricelist.id);
                              return <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                {formatCurrency(salesPrice, group.pricelist.currency)}
                              </span>;
                            }
                          },
                          {
                            title: <span style={{ color: '#bfbfbf' }}>Net Price</span>,
                            key: 'net_price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => {
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
                              const note = record.note;
                              return note && note.trim() !== ''
                                ? <span style={{ color: '#faad14' }}>{note}</span>
                                : <span style={{ color: '#bfbfbf' }}>
                                    {formatCurrency(total, group.pricelist.currency)}
                                  </span>;
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
                      onClick={() => {
                        // TODO: Teklifi kaydet ve sonraki adıma geç
                        console.log('Offer Data:', offerData);
                        console.log('Selected Items:', selectedItems);
                      }}
                    >
                      Teklifi Oluştur
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            )}
          </div>
        )}
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
    </div>
  );
};

export default Offers;
