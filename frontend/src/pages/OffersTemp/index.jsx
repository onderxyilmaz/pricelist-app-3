// OffersTemp - Mevcut Teklifler sayfası görünümü
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Input, 
  Select, 
  AutoComplete, 
  Table, 
  Space, 
  Tag,
  DatePicker,
  message,
  Popconfirm,
  Modal,
  Collapse,
  Divider,
  Form
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import NotificationService from '../../utils/notification';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const OffersTemp = () => {
  // Ana state'ler - orijinal Offers.jsx'teki gibi
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  
  // Filtreleme state'leri
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]); // Revizyon expand için
  
  // Wizard states - orijinal Offers.jsx'teki gibi
  const [currentStep, setCurrentStep] = useState(0);
  const [offerData, setOfferData] = useState({}); // Adım 1 verisi
  const [selectedItems, setSelectedItems] = useState([]); // Adım 2 verisi
  const [itemNotes, setItemNotes] = useState({}); // {itemId: note}
  const [itemDiscounts, setItemDiscounts] = useState({}); // {itemId: discount_rate}
  const [discountData, setDiscountData] = useState({}); // Adım 3 indirim verisi
  const [profitData, setProfitData] = useState({}); // Adım 4 kar verisi
  const [manualPrices, setManualPrices] = useState({}); // Adım 5 manuel fiyat verisi
  
  // Diğer state'ler - orijinal Offers.jsx'teki gibi
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [pricelists, setPricelists] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Template mode states - orijinal Offers.jsx'teki gibi
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFilter, setTemplateFilter] = useState('');
  
  // Preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewLanguage, setPreviewLanguage] = useState('en');
  
  const [filters, setFilters] = useState({
    offerNo: '',
    status: 'all',
    customerResponse: 'all',
    createdBy: 'all',
    customer: 'all',
    dateRange: null
  });

  // Helper functions - orijinal Offers.jsx'teki gibi
  const isDescriptionItem = (record) => {
    const note = itemNotes[record.id];
    return record.quantity === 0 && note && note.trim() !== '';
  };

  // Excel export fonksiyonu - orijinal Offers.jsx'ten
  const handleExportToExcel = async (offer) => {
    try {
      // Teklif detaylarını fetch et
      const response = await axios.get(`http://localhost:3000/api/offers/${offer.id}/details`);
      
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
      worksheet.addRow(['Müşteri Adı:', offerData.customer || '', 'Proje No:', '', '']);
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
          // Silinmiş ürün kontrolü
          const isDeleted = !item.pricelist_item_id;
          let description = item.description || '';
          
          // Eğer ürün silinmişse açıklamaya not ekle
          if (isDeleted) {
            description = description ? `${description} [SİLİNMİŞ ÜRÜN]` : '[SİLİNMİŞ ÜRÜN]';
          }
          
          const productRow = worksheet.addRow([
            item.product_code || '',
            description,
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

  // Sayfa yüklendiğinde verileri çek - orijinal Offers.jsx'teki gibi
  useEffect(() => {
    document.title = 'Price List App v3 - Teklifler (Yeni)';
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchOffers();
  }, []);

  // Step 1'de Teklif No alanına autofocus - orijinal Offers.jsx'teki gibi
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

  // Template seçim adımında arama alanına autofocus - orijinal Offers.jsx'teki gibi
  useEffect(() => {
    if (modalVisible && isTemplateMode && currentStep === 1) {
      const tryFocus = (attempt = 0) => {
        const templateSearchInput = document.querySelector('input[placeholder="Template ara..."]');
        if (templateSearchInput && templateSearchInput.offsetParent !== null) {
          templateSearchInput.focus();
        } else if (attempt < 5) {
          setTimeout(() => tryFocus(attempt + 1), 100);
        }
      };
      setTimeout(() => tryFocus(), 100);
    }
  }, [modalVisible, isTemplateMode, currentStep]);

  // Filtreleme değişikliklerinde uygula
  useEffect(() => {
    applyFilters();
  }, [filters, offers]);

  // API'den teklifleri çek - orijinal fonksiyon
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/offers');
      if (response.data.success) {
        console.log('Fetched offers:', response.data.offers);
        setOffers(response.data.offers);
        
        // Filtreleme seçenekleri için unique değerleri topla
        const customers = [...new Set(response.data.offers.map(o => o.customer).filter(Boolean))].sort();
        const users = [...new Set(response.data.offers.map(o => o.created_by_name).filter(Boolean))].sort();
        
        setAvailableCustomers(customers);
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Teklifler yüklenirken hata:', error);
      message.error('Teklifler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Revizyon sistemi fonksiyonları - orijinal Offers.jsx'ten
  const getUniqueParentOffers = () => {
    return offers.filter(offer => offer.parent_offer_id === null);
  };

  const getRevisions = (parentOfferId) => {
    const revisions = offers.filter(offer => offer.parent_offer_id === parentOfferId);
    console.log(`Revisions for offer ${parentOfferId}:`, revisions);
    return revisions;
  };

  // Preview modal fonksiyonu
  const handlePreview = async (offer) => {
    try {
      setLoading(true);
      
      // Teklif detayları ve fiyat listesi bilgilerini al
      const [offerResponse, pricelistsResponse] = await Promise.all([
        axios.get(`http://localhost:3000/api/offers/${offer.id}/details`),
        axios.get('http://localhost:3000/api/pricelists-with-items')
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
        message.error('Teklif detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Preview error:', error);
      message.error('Teklif önizlemesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Status değiştir (draft <-> sent)
  const handleToggleStatus = async (offer) => {
    try {
      const newStatus = offer.status === 'sent' ? 'draft' : 'sent';
      
      const response = await axios.put(`http://localhost:3000/api/offers/${offer.id}`, {
        offer_no: offer.offer_no,
        customer: offer.customer,
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
      const updateResponse = await axios.put(`http://localhost:3000/api/offers/${offer.id}`, {
        offer_no: offer.offer_no,
        customer: offer.customer,
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

  // Teklif silme fonksiyonu
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/offers/${id}`);
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

  // Orijinal Offers.jsx'teki handleCreate fonksiyonu - birebir aynı
  const handleCreate = async (templateMode = false) => {
    setEditingOffer(null);
    form.resetFields();
    setCurrentStep(0);
    setOfferData({});
    setCustomerOptions([]);
    setSelectedItems([]);
    setProductFilter('');
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
    await fetchCompanies(); // Firmaları da yükle
    setModalVisible(true);
  };

  // Yardımcı API fonksiyonları - orijinal Offers.jsx'ten
  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/offer-templates');
      if (response.data.success) {
        setAvailableTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Templates fetch error:', error);
    }
  };

  const fetchPricelistsWithItems = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/pricelists-with-items');
      if (response.data.success) {
        setPricelists(response.data.pricelists || []);
      }
    } catch (error) {
      console.error('Pricelists fetch error:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/companies');
      if (response.data.success) {
        setAvailableCompanies(response.data.companies || []);
      }
    } catch (error) {
      console.error('Companies fetch error:', error);
    }
  };

  // OfferWizard fonksiyonları yerine orijinal modal fonksiyonları
  const handleNewOffer = () => handleCreate(true); // Template mode'da aç

  const handleEdit = async (offer) => {
    // Orijinal edit fonksiyonu logic'i buraya gelecek
    setEditingOffer(offer);
    setModalVisible(true);
    console.log('Editing offer:', offer);
  };

  const handleCreateRevision = async (offer) => {
    // Orijinal revizyon logic'i buraya gelecek
    console.log('Creating revision from offer:', offer);
  };

  // Step 1 Submit Handler - orijinal Offers.jsx'ten
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

  // Teklif no kontrolü fonksiyonu
  const checkOfferNumber = async (offerNo) => {
    try {
      const response = await api.get(`/api/offers/check-offer-number/${offerNo}`);
      return response.data.available;
    } catch (error) {
      console.error('Teklif no kontrol hatası:', error);
      return false;
    }
  };

  // Müşteri arama
  const searchCustomers = (value) => {
    if (value && value.length > 0) {
      const filtered = customers
        .filter(customer => 
          customer.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10)
        .map(customer => ({ value: customer }));
      setCustomerOptions(filtered);
    } else {
      setCustomerOptions([]);
    }
  };

  // Filtreleri uygula - parent offerlar üzerinde (orijinal Offers.jsx mantığı)
  const applyFilters = () => {
    const parentOffers = getUniqueParentOffers();
    console.log('Parent offers:', parentOffers);
    let filtered = [...parentOffers];

    // Durum filtresi
    if (filters.status !== 'all') {
      filtered = filtered.filter(offer => (offer.status || 'draft') === filters.status);
    }

    // Müşteri filtresi
    if (filters.customer !== 'all') {
      filtered = filtered.filter(offer => offer.customer === filters.customer);
    }

    // Hazırlayan filtresi
    if (filters.createdBy !== 'all') {
      filtered = filtered.filter(offer => offer.created_by_name === filters.createdBy);
    }

    // Teklif No filtresi - hem ana tekliflerde hem revizyonlarda ara (orijinal mantık)
    if (filters.offerNo.trim()) {
      const searchTerm = filters.offerNo.toLowerCase();
      
      // Arama terimiyle eşleşen tüm teklifleri bul (ana + revizyon)
      const matchingOffers = offers.filter(offer => 
        offer.offer_no.toLowerCase().includes(searchTerm)
      );
      
      // Eşleşen tekliflerin parent_offer_id'lerini topla
      const matchingParentIds = new Set();
      
      matchingOffers.forEach(offer => {
        if (offer.parent_offer_id) {
          // Bu bir revizyon, parent_id'sini ekle
          matchingParentIds.add(offer.parent_offer_id);
        } else {
          // Bu bir ana teklif, kendi id'sini ekle
          matchingParentIds.add(offer.id);
        }
      });
      
      // Ana teklifleri ve ilgili revizyonları filtrele
      filtered = filtered.filter(offer => {
        // Eğer bu teklif arama sonuçlarında varsa dahil et
        if (matchingOffers.some(m => m.id === offer.id)) {
          return true;
        }
        
        // Eğer bu ana teklifin revizyonlarından biri eşleşiyorsa ana teklifi de dahil et
        if (!offer.parent_offer_id && matchingParentIds.has(offer.id)) {
          return true;
        }
        
        return false;
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

    // Tarih aralığı filtresi
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter(offer => {
        const offerDate = dayjs(offer.created_at);
        return offerDate.isAfter(startDate.startOf('day')) && offerDate.isBefore(endDate.endOf('day'));
      });
    }

    setFilteredOffers(filtered);
  };

  // Expandable row render fonksiyonu - orijinal Offers.jsx'ten alındı
  const expandedRowRender = (record) => {
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
              title: 'Müşteri',
              dataIndex: 'customer',
              key: 'customer',
              render: (customer) => customer || '-',
            },
            {
              title: 'Firma',
              dataIndex: 'company_name',
              key: 'company_name',
              render: (company_name) => company_name || '-',
            },
            {
              title: 'İşlemler',
              key: 'actions',
              width: 320,
              render: (_, revRecord) => (
                <Space>
                  {/* 1. Önizleme */}
                  <Button
                    type="default"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(revRecord);
                    }}
                    title="Önizleme"
                  />

                  {/* 2. Düzenle */}
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(revRecord);
                    }}
                    title="Düzenle"
                  />
                  
                  {/* 3. Revizyon Oluştur */}
                  <Button
                    type="default"
                    size="small"
                    icon={<BranchesOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateRevision(revRecord);
                    }}
                    title="Revizyon Oluştur"
                  />
                  
                  {/* 4. Gönderildi İşaretle */}
                  <Button
                    type="default"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(revRecord);
                    }}
                    title={revRecord.status === 'sent' ? 'Taslak Yap' : 'Gönderildi İşaretle'}
                    style={{ 
                      color: revRecord.status === 'sent' ? '#52c41a' : '#1890ff',
                      borderColor: revRecord.status === 'sent' ? '#52c41a' : '#1890ff'
                    }}
                  />
                  
                  {/* 5. Müşteri Yanıtı */}
                  <Popconfirm
                    title={revRecord.status === 'sent' ? "Müşteri yanıtını seçin:" : "Bu teklif henüz gönderilmemiş"}
                    description={
                      revRecord.status === 'sent' ? (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomerResponse(revRecord, 'accepted');
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomerResponse(revRecord, 'rejected');
                            }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerResponse(revRecord, null);
                              }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
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
                  
                  {/* 6. Excel'e Aktar */}
                  <Button
                    type="default"
                    size="small"
                    icon={<FileExcelOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportToExcel(revRecord);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Export revision to PDF:', revRecord);
                    }}
                    title="PDF'e Aktar"
                    style={{ 
                      color: '#ff4d4f',
                      borderColor: '#ff4d4f'
                    }}
                  />
                  
                  {/* 8. Sil */}
                  <Popconfirm
                    title="Revizyonu silmek istediğinizden emin misiniz?"
                    onConfirm={() => {
                      handleDelete(revRecord.id);
                    }}
                    okText="Evet"
                    cancelText="Hayır"
                  >
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
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
          scroll={{ x: 1000 }}
          bordered
        />
      </div>
    );
  };

  // Orijinal kolonlar yapısı
  const columns = [
    {
      title: 'Teklif No',
      dataIndex: 'offer_no',
      key: 'offer_no',
      ellipsis: true,
      sorter: true,
    },
    {
      title: 'Oluşturma',
      dataIndex: 'created_at',
      key: 'created_at',
      ellipsis: true,
      sorter: true,
      render: (date) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleDateString('tr-TR');
        } catch (error) {
          return '-';
        }
      },
    },
    {
      title: 'Revizyonlar',
      key: 'revisions',
      align: 'center',
      ellipsis: true,
      render: (_, record) => {
        const revisions = getRevisions(record.id);
        return revisions.length > 0 ? (
          <Tag color="blue">{revisions.length} revizyon</Tag>
        ) : (
          <Tag color="default">Yok</Tag>
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      ellipsis: true,
      render: (status) => {
        const statusConfig = {
          draft: { color: 'blue', text: 'Taslak' },
          sent: { color: 'green', text: 'Gönderildi' }
        };
        const config = statusConfig[status] || { color: 'default', text: status || 'Taslak' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Müşteri Yanıtı',
      dataIndex: 'customer_response',
      key: 'customer_response',
      ellipsis: true,
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
      ellipsis: true,
    },
    {
      title: 'Müşteri',
      dataIndex: 'customer',
      key: 'customer',
      ellipsis: true,
    },
    {
      title: 'Firma',
      dataIndex: 'company_name',
      key: 'company_name',
      ellipsis: true,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {/* 1. Önizleme */}
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(record);
              console.log('Preview:', record);
            }}
            title="Önizleme"
          />

          {/* 2. Düzenle */}
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
            title="Düzenle"
          />
          
          {/* 3. Revizyon Oluştur */}
          <Button
            type="default"
            size="small"
            icon={<BranchesOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleCreateRevision(record);
            }}
            title="Revizyon Oluştur"
          />
          
          {/* 4. Gönderildi İşaretle */}
          <Button
            type="default"
            size="small"
            icon={<SendOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(record);
            }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerResponse(record, 'accepted');
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerResponse(record, 'rejected');
                    }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomerResponse(record, null);
                      }}
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
              onClick={(e) => {
                e.stopPropagation();
              }}
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
          </Popconfirm>
          
          {/* 6. Excel'e Aktar */}
          <Button
            type="default"
            size="small"
            icon={<FileExcelOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleExportToExcel(record);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              console.log('Export to PDF:', record);
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
            onConfirm={() => {
              handleDelete(record.id);
            }}
            okText="Evet"
            cancelText="Hayır"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Sil"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filtre değiştirme fonksiyonu - orijinal Offers.jsx'ten
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filtreleri temizle - orijinal Offers.jsx'ten
  const clearFilters = () => {
    setFilters({
      status: 'all',
      customer: 'all',
      createdBy: 'all',
      offerNo: '',
      dateRange: null,
      customerResponse: 'all'
    });
  };

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
          onClick={() => handleCreate(true)} // Direkt template mode'da aç - orijinal gibi
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
            {/* İkinci satır: Müşteri, Oluşturma Tarihi, Temizle butonu */}
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: '500' }}>Müşteri</div>
              <Select
                value={filters.customer}
                onChange={(value) => handleFilterChange('customer', value)}
                style={{ width: '100%' }}
                placeholder="Tüm Müşteriler"
                showSearch
                optionFilterProp="children"
              >
                <Option value="all">Tüm Müşteriler</Option>
                {availableCustomers.map(customer => (
                  <Option key={customer} value={customer}>{customer}</Option>
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
              filters.customer !== 'all' ? 'Müşteri' : null,
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
          dataSource={filteredOffers}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: (event) => {
              // Eğer tıklanan element bir buton, input veya link ise satır tıklamasını engelle
              const target = event.target;
              const clickableElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SVG', 'PATH'];
              const isClickableElement = clickableElements.includes(target.tagName) || 
                                       target.closest('button') || 
                                       target.closest('a') || 
                                       target.closest('.ant-btn') ||
                                       target.closest('.ant-popconfirm') ||
                                       target.closest('.ant-dropdown') ||
                                       target.closest('svg') ||
                                       target.closest('[role="img"]') ||
                                       target.closest('.anticon') ||
                                       target.closest('.ant-space') || // Action butonları genelde Space içinde
                                       target.classList.contains('anticon');
              
              // Eğer buton vs. tıklanmışsa expand işlemini engelle
              if (isClickableElement) {
                event.stopPropagation();
                return;
              }
              
              // Sadece ana teklif satırlarında expand çalışsın (revizyonlarda değil)
              if (record.parent_offer_id) {
                return;
              }
              
              // Ana teklif satırında ve revizyon varsa expand/collapse yap
              const revisions = getRevisions(record.id);
              if (revisions.length > 0) {
                const isExpanded = expandedRowKeys.includes(record.id);
                setExpandedRowKeys(prev => 
                  isExpanded 
                    ? prev.filter(key => key !== record.id)
                    : [...prev, record.id]
                );
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
            expandedRowRender,
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
            expandRowByClick: false,
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        title={`Teklif Önizlemesi: ${previewOffer?.offer_no}`}
        open={previewModalVisible}
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
              {previewOffer.customer && (
                <p style={{ color: '#666', margin: 0, marginBottom: 8 }}>
                  <strong>Müşteri:</strong> {previewOffer.customer}
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
                            title: previewLanguage === 'tr' ? 'Ürün Kodu' : 'Product Code',
                            dataIndex: 'product_id',
                            key: 'product_id',
                            width: 120,
                          },
                          {
                            title: previewLanguage === 'tr' ? 'Ürün Adı' : 'Product Name',
                            key: 'product_name',
                            render: (_, record) => {
                              const productName = previewLanguage === 'tr' ? 
                                (record.product_name_tr || record.product_name_en || record.product_name || '-') : 
                                (record.product_name_en || record.product_name_tr || record.product_name || '-');
                              
                              return productName;
                            },
                          },
                          {
                            title: previewLanguage === 'tr' ? 'Açıklama' : 'Description',
                            key: 'description',
                            ellipsis: true,
                            render: (_, record) => {
                              const isDeleted = !record.pricelist_item_id;
                              
                              // Eğer ürün silinmişse sadece snapshot description'ı kullan
                              if (isDeleted) {
                                return record.description || '-';
                              }
                              
                              // Ürün silinmemişse önce orijinal açıklamayı tercih et
                              const originalDescription = previewLanguage === 'tr' ? 
                                record.original_description_tr : 
                                record.original_description_en;
                              
                              return originalDescription || record.description || '-';
                            },
                          },
                          {
                            title: previewLanguage === 'tr' ? 'Miktar' : 'Quantity',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            width: 100,
                            align: 'center',
                            render: (quantity) => quantity || '-',
                          },
                          {
                            title: previewLanguage === 'tr' ? 'Birim Fiyat' : 'Unit Price',
                            dataIndex: 'unit_price',
                            key: 'unit_price',
                            width: 120,
                            align: 'right',
                            render: (price, record) => price ? `${parseFloat(price).toFixed(2)} ${record.currency}` : '-',
                          },
                          {
                            title: previewLanguage === 'tr' ? 'Toplam' : 'Total',
                            dataIndex: 'total_price',
                            key: 'total_price',
                            width: 120,
                            align: 'right',
                            render: (total, record) => total ? `${parseFloat(total).toFixed(2)} ${record.currency}` : '-',
                          },
                        ]}
                        dataSource={group.items}
                        rowKey={(record) => `${record.pricelist_id}-${record.product_id}-${record.id || Math.random()}`}
                        pagination={false}
                        size="small"
                        bordered
                      />
                    </Panel>
                  );
                })}
              </Collapse>
            );
          })()}
          
          <Divider />
          <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
            Genel Toplam: {previewItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0).toFixed(2)} {previewItems.length > 0 ? previewItems[0].currency : 'EUR'}
          </div>
        </div>
      </Modal>

      {/* Orijinal Modal - Tam wizard içeriği */}
      <Modal
        title={editingOffer 
          ? `Teklif Düzenle: ${editingOffer.offer_no}` 
          : offerData.parent_offer_id 
            ? 'Revizyon Oluştur' 
            : 'Yeni Teklif'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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
          {/* Custom Steps Navigation - Orijinal Offers.jsx'teki gibi */}
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

          {/* Language Selection for specific steps */}
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

          {/* Step Content */}
          <div>
            {/* Step 0 - Teklif Bilgileri ve Müşteri */}
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
                    disabled={editingOffer ? true : false}
                  />
                </Form.Item>

                <Form.Item
                  name="customer"
                  label="Müşteri"
                >
                  <AutoComplete
                    options={customerOptions}
                    onSearch={searchCustomers}
                    placeholder="Müşteri adını girin veya seçin"
                    allowClear
                    filterOption={false}
                    autoComplete="off"
                    autoFocus={true}
                  />
                </Form.Item>

                <Form.Item
                  name="company_id"
                  label="Firma"
                  rules={[{ required: true, message: 'Firma seçimi gereklidir!' }]}
                >
                  <Select 
                    placeholder="Teklifin hangi firmadan hazırlandığını seçin"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {availableCompanies.map(company => (
                      <Option key={company.id} value={company.id}>
                        {company.company_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => {
                      setModalVisible(false);
                      // Template state'lerini sıfırla
                      setSelectedTemplate(null);
                      setIsTemplateMode(false);
                      setTemplateFilter('');
                    }}>İptal</Button>
                    <Button type="primary" htmlType="submit">Sonraki Adım</Button>
                  </Space>
                </Form.Item>
              </Form>
            )}

            {/* Diğer step'ler placeholder - adım adım eklenecek */}
            {currentStep > 0 && (
              <div style={{ minHeight: '400px', padding: '20px', border: '1px dashed #ccc', textAlign: 'center' }}>
                <h3>Step {currentStep + 1} İçeriği</h3>
                <p>Template Mode: {isTemplateMode ? 'Aktif' : 'Pasif'}</p>
                <p>Bu step'in içeriği orijinal Offers.jsx'ten eklenecek</p>
                
                {/* Geçici navigation butonları */}
                <div style={{ marginTop: '40px' }}>
                  {currentStep > 0 && (
                    <Button style={{ marginRight: '10px' }} onClick={() => setCurrentStep(currentStep - 1)}>
                      Geri
                    </Button>
                  )}
                  <Button type="primary" onClick={() => {
                    const maxStep = isTemplateMode ? 6 : 5;
                    if (currentStep < maxStep) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      setModalVisible(false);
                    }
                  }}>
                    {currentStep === (isTemplateMode ? 6 : 5) ? 'Tamamla' : 'İleri'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
};

export default OffersTemp;