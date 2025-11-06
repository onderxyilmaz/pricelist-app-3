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
  Table, 
  Space, 
  Tag,
  DatePicker,
  message,
  Popconfirm,
  Modal,
  Collapse,
  Divider
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
import { API_BASE_URL } from '../../config/env';
import styles from './OffersTemp.module.css';
import NotificationService from '../../utils/notification';
import OfferWizard from './components/OfferWizard';
import OffersHeader from './components/OffersHeader';
import OffersSearch from './components/OffersSearch';
import PreviewModal from './components/PreviewModal';
import OffersTable from './components/OffersTable';
import { useWizard } from './hooks/useWizard';
import { offersService } from './services/offersService';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const OffersTemp = () => {
  // State tanımları - orijinal Offers.jsx'teki gibi
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]); // Revizyon expand için
  
  // Preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  
  // Wizard modal states
  const [wizardVisible, setWizardVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [pricelists, setPricelists] = useState([]);
  const wizardState = useWizard();
  
  const [filters, setFilters] = useState({
    offerNo: '',
    status: 'all',
    customerResponse: 'all',
    createdBy: 'all',
    customer: 'all',
    dateRange: null
  });

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    document.title = 'Price List App v3 - Offers';
    fetchOffers();
  }, []);

  // Filtreleme değişikliklerinde uygula
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, offers]);

  // API'den teklifleri çek - orijinal fonksiyon
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/offers`);
      if (response.data.success) {
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
    return revisions;
  };

  // Preview modal fonksiyonu
  const handlePreview = async (offer) => {
    try {
      setLoading(true);
      
      // Teklif detayları ve fiyat listesi bilgilerini al
      const [offerResponse, pricelistsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/offers/${offer.id}/details`),
        axios.get(`${API_BASE_URL}/api/pricelists-with-items`)
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
      
      const response = await axios.put(`${API_BASE_URL}/api/offers/${offer.id}`, {
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
      const updateResponse = await axios.put(`${API_BASE_URL}/api/offers/${offer.id}`, {
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
      const response = await axios.delete(`${API_BASE_URL}/api/offers/${id}`);
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

  // Excel'e Aktar fonksiyonu
  const handleExportToExcel = async (offer) => {
    try {
      // Teklif detaylarını fetch et
      const response = await axios.get(`${API_BASE_URL}/api/offers/${offer.id}/details`);

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

      // Helper function - Açıklama ürünü kontrolü
      const isDescriptionItem = (item) => {
        return item.quantity === 0 && item.description && item.description.trim() !== '';
      };

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

  // Filtreleri uygula - parent offerlar üzerinde (orijinal Offers.jsx mantığı)
  const applyFilters = () => {
    const parentOffers = getUniqueParentOffers();
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
      return <div className={styles.noRevisionMessage}>Bu teklif için revizyon bulunmuyor</div>;
    }

    return (
      <div className={styles.revisionContainer}>
        <div className={styles.revisionTitle}>
          📋 Revizyonlar ({revisions.length})
        </div>
        <Table
          className={`${styles.revisionTable} ${styles.revisionTableStyle}`}
          columns={[
            {
              title: 'Revize No',
              dataIndex: 'revision_no',
              key: 'revision_no',
              ellipsis: true,
              sorter: (a, b) => a.revision_no - b.revision_no,
              render: (rev_no) => `R${rev_no}`
            },
            {
              title: 'Teklif No',
              dataIndex: 'offer_no',
              key: 'offer_no',
              ellipsis: true,
            },
            {
              title: 'Oluşturma Tarihi',
              dataIndex: 'created_at',
              key: 'created_at',
              ellipsis: true,
              sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
              render: (date) => new Date(date).toLocaleDateString('tr-TR'),
            },
            {
              title: 'Durum',
              dataIndex: 'status',
              key: 'status',
              ellipsis: true,
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
              render: (name) => name || '-',
            },
            {
              title: 'Müşteri',
              dataIndex: 'customer',
              key: 'customer',
              ellipsis: true,
              render: (customer) => customer || '-',
            },
            {
              title: 'Firma',
              dataIndex: 'company_name',
              key: 'company_name',
              ellipsis: true,
              render: (company_name) => company_name || '-',
            },
            {
              title: 'İşlemler',
              key: 'actions',
              width: 270,
              fixed: 'right',
              render: (_, revRecord) => (
                <Space className={styles.actionSpace}>
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
                    className={revRecord.status === 'sent' ? styles.buttonSent : styles.buttonDraft}
                  />
                  
                  {/* 5. Müşteri Yanıtı */}
                  <Popconfirm
                    title={revRecord.status === 'sent' ? "Müşteri yanıtını seçin:" : "Bu teklif henüz gönderilmemiş"}
                    description={
                      revRecord.status === 'sent' ? (
                        <div className={styles.customerResponseContainer}>
                          <Button
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomerResponse(revRecord, 'accepted');
                            }}
                            disabled={revRecord.customer_response === 'accepted'}
                            className={revRecord.customer_response === 'accepted' ? styles.customerResponseButtonAccepted : styles.customerResponseButtonDefault}
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
                            className={revRecord.customer_response === 'rejected' ? styles.customerResponseButtonRejected : styles.customerResponseButtonDefault}
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
                              className={styles.buttonWarning}
                            >
                              Sıfırla
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className={styles.disabledNotice}>
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
                    className={styles.buttonExcel}
                  />
                  
                  {/* 7. PDF'e Aktar */}
                  <Button
                    type="default"
                    size="small"
                    icon={<FilePdfOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // PDF export functionality to be implemented
                    }}
                    title="PDF'e Aktar"
                    className={styles.buttonPdf}
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
        } catch {
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
      width: 270,
      fixed: 'right',
      render: (_, record) => (
        <Space className={styles.actionSpace}>
          {/* 1. Önizleme */}
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(record);
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
            className={record.status === 'sent' ? styles.buttonSent : styles.buttonDraft}
          />
          
          {/* 5. Müşteri Yanıtı */}
          <Popconfirm
            title={record.status === 'sent' ? "Müşteri yanıtını seçin:" : "Bu teklif henüz gönderilmemiş"}
            description={
              record.status === 'sent' ? (
                <div className={styles.customerResponseContainer}>
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
                <div className={styles.disabledNotice}>
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
            className={styles.buttonExcel}
          />
          
          {/* 7. PDF'e Aktar */}
          <Button
            type="default"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              // PDF export functionality to be implemented
            }}
            title="PDF'e Aktar"
            className={styles.buttonPdf}
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

  // Yeni Teklif modal aç
  const handleCreateOffer = async (templateMode = false) => {
    try {
      setLoading(true);
      
      // Wizard state'ini sıfırla
      wizardState.resetWizard();
      wizardState.setIsTemplateMode(templateMode);
      
      // Firmaları ve fiyat listelerini yükle
      const [companiesData, pricelistsData] = await Promise.all([
        offersService.fetchCompanies(),
        axios.get(`${API_BASE_URL}/api/pricelists-with-items`)
      ]);
      
      setCompanies(companiesData);
      
      if (pricelistsData.data.success) {
        setPricelists(pricelistsData.data.pricelists || []);
      }
      
      setEditingOffer(null);
      setWizardVisible(true);
    } catch (error) {
      console.error('Create offer error:', error);
      NotificationService.error('Hata', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Wizard modal kapat
  const handleWizardCancel = () => {
    setWizardVisible(false);
    wizardState.resetWizard();
    setEditingOffer(null);
  };

  // Teklif düzenle
  const handleEdit = async (offer) => {
    try {
      setLoading(true);
      setEditingOffer(offer);
      
      // Firmalar ve fiyat listelerini yükle
      const [companiesData, pricelistsData] = await Promise.all([
        offersService.fetchCompanies(),
        axios.get(`${API_BASE_URL}/api/pricelists-with-items`)
      ]);
      
      setCompanies(companiesData);
      
      if (pricelistsData.data.success) {
        setPricelists(pricelistsData.data.pricelists || []);
      }
      
      // Teklif detaylarını yükle
      const response = await offersService.getOfferById(offer.id);
      if (!response.success) {
        NotificationService.error('Hata', 'Teklif detayları yüklenemedi');
        return;
      }

      const offerData = response.offer;
      
      // Wizard state'ini sıfırla ve doldur
      wizardState.resetWizard();
      wizardState.updateOfferData({
        offer_no: offerData.offer_no,
        customer: offerData.customer || '',
        company_id: offerData.company_id
      });

      // Ürün kalemleri varsa doldur
      if (offerData.items && offerData.items.length > 0) {
        // Ürünleri map'le
        const mappedItems = offerData.items.map(item => {
          // Orijinal ürün bilgilerini fiyat listelerinden bul
          const originalItem = pricelistsData.data.pricelists
            .flatMap(p => p.items)
            .find(pi => pi.id === item.pricelist_item_id);
          
          return {
            id: item.pricelist_item_id,
            product_id: item.product_id,
            name_tr: item.product_name_tr,
            name_en: item.product_name_en,
            name: item.product_name_tr || item.product_name_en,
            description_tr: originalItem?.description_tr || '',
            description_en: originalItem?.description_en || '',
            description: item.description || '',
            price: parseFloat(item.original_price || item.price), // Orijinal fiyatı kullan!
            unit: item.unit,
            currency: item.currency,
            pricelist_id: item.pricelist_id,
            quantity: item.quantity,
            total_price: parseFloat(item.original_price || item.price) * item.quantity,
            stock: originalItem?.stock || 0
          };
        });
        
        wizardState.setSelectedItems(mappedItems);
        
        // Ürün bazında indirimleri geri yükle
        const itemDiscountsMap = {};
        offerData.items.forEach(item => {
          if (item.item_discount_rate && item.item_discount_rate > 0) {
            itemDiscountsMap[item.pricelist_item_id] = item.item_discount_rate;
          }
        });
        wizardState.setItemDiscounts(itemDiscountsMap);
        
        // Ürün notlarını geri yükle
        const itemNotesMap = {};
        offerData.items.forEach(item => {
          if (item.item_note) {
            itemNotesMap[item.pricelist_item_id] = item.item_note;
          }
        });
        wizardState.setItemNotes(itemNotesMap);
        
        // Liste bazında indirim ve kar oranlarını geri yükle
        const discountsMap = {};
        const profitsMap = {};
        
        offerData.items.forEach(item => {
          // Liste bazında indirimler
          if (item.list_discounts) {
            try {
              const discounts = typeof item.list_discounts === 'string' 
                ? JSON.parse(item.list_discounts) 
                : item.list_discounts;
              if (Array.isArray(discounts) && discounts.length > 0) {
                discountsMap[item.pricelist_id] = discounts;
              }
            } catch (e) {
              console.error('Parse list_discounts error:', e);
            }
          }
          
          // Liste bazında kar oranları
          if (item.list_profits) {
            try {
              const profits = typeof item.list_profits === 'string' 
                ? JSON.parse(item.list_profits) 
                : item.list_profits;
              if (Array.isArray(profits) && profits.length > 0) {
                profitsMap[item.pricelist_id] = profits;
              }
            } catch (e) {
              console.error('Parse list_profits error:', e);
            }
          }
        });
        
        wizardState.setDiscountData(discountsMap);
        wizardState.setProfitData(profitsMap);
        
        // Manuel fiyatları geri yükle
        const manualPricesMap = {};
        offerData.items.forEach(item => {
          if (item.manual_price) {
            try {
              const manualPrice = typeof item.manual_price === 'string'
                ? JSON.parse(item.manual_price)
                : item.manual_price;
              // enabled: false olanları da ekle ki checkbox durumu korunsun
              if (manualPrice && typeof manualPrice === 'object') {
                manualPricesMap[item.pricelist_item_id] = {
                  enabled: manualPrice.enabled || false,
                  price: manualPrice.price || 0
                };
              }
            } catch (e) {
              console.error('Parse manual_price error:', e);
            }
          }
        });
        wizardState.setManualPrices(manualPricesMap);
      }

      setWizardVisible(true);
    } catch (error) {
      console.error('Edit offer error:', error);
      NotificationService.error('Hata', 'Teklif düzenlenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Revizyon oluştur
  const handleCreateRevision = async (offer) => {
    try {
      setLoading(true);
      
      // Mevcut teklif verilerini yükle
      const response = await offersService.getOfferById(offer.id);
      if (!response.success) {
        NotificationService.error('Hata', 'Teklif detayları yüklenemedi');
        return;
      }

      const sourceOffer = response.offer;
      
      // Ana teklifi bul (parent_offer_id null olan)
      const parentOfferId = sourceOffer.parent_offer_id || offer.id;
      
      // Ana teklifin tüm revizyonlarını getir ve en yüksek revizyon numarasını bul
      const allOffersResponse = await offersService.getAllOffers();
      if (!allOffersResponse.success) {
        NotificationService.error('Hata', 'Teklifler yüklenemedi');
        return;
      }
      
      const allOffers = allOffersResponse.offers;
      const relatedOffers = allOffers.filter(o => 
        o.id === parentOfferId || o.parent_offer_id === parentOfferId
      );
      
      const maxRevisionNo = Math.max(...relatedOffers.map(o => o.revision_no || 0));
      const newRevisionNo = maxRevisionNo + 1;
      
      // Ana teklifin offer_no'sunu bul
      const parentOffer = allOffers.find(o => o.id === parentOfferId);
      const baseOfferNo = parentOffer ? parentOffer.offer_no : sourceOffer.offer_no.split('-R')[0];
      
      // Yeni teklif no
      const newOfferNo = `${baseOfferNo}-R${newRevisionNo}`;
      
      // Firmalar ve fiyat listelerini yükle
      const [companiesData, pricelistsData] = await Promise.all([
        offersService.fetchCompanies(),
        axios.get(`${API_BASE_URL}/api/pricelists-with-items`)
      ]);
      
      setCompanies(companiesData);
      
      if (pricelistsData.data.success) {
        setPricelists(pricelistsData.data.pricelists || []);
      }
      
      // Wizard state'ini sıfırla ve doldur
      wizardState.resetWizard();
      wizardState.updateOfferData({
        offer_no: newOfferNo,
        customer: sourceOffer.customer || '',
        company_id: sourceOffer.company_id,
        parent_offer_id: parentOfferId,
        revision_no: newRevisionNo
      });

      // Ürün kalemleri varsa doldur
      if (sourceOffer.items && sourceOffer.items.length > 0) {
        // Ürünleri map'le
        const mappedItems = sourceOffer.items.map(item => {
          // Orijinal ürün bilgilerini fiyat listelerinden bul
          const originalItem = pricelistsData.data.pricelists
            .flatMap(p => p.items)
            .find(pi => pi.id === item.pricelist_item_id);
          
          return {
            id: item.pricelist_item_id,
            product_id: item.product_id,
            name_tr: item.product_name_tr,
            name_en: item.product_name_en,
            name: item.product_name_tr || item.product_name_en,
            description_tr: originalItem?.description_tr || '',
            description_en: originalItem?.description_en || '',
            description: item.description || '',
            price: parseFloat(item.original_price || item.price), // Orijinal fiyatı kullan!
            unit: item.unit,
            currency: item.currency,
            pricelist_id: item.pricelist_id,
            quantity: item.quantity,
            total_price: parseFloat(item.original_price || item.price) * item.quantity,
            stock: originalItem?.stock || 0
          };
        });
        
        wizardState.setSelectedItems(mappedItems);
        
        // Ürün bazında indirimleri geri yükle
        const itemDiscountsMap = {};
        sourceOffer.items.forEach(item => {
          if (item.item_discount_rate && item.item_discount_rate > 0) {
            itemDiscountsMap[item.pricelist_item_id] = item.item_discount_rate;
          }
        });
        wizardState.setItemDiscounts(itemDiscountsMap);
        
        // Ürün notlarını geri yükle
        const itemNotesMap = {};
        sourceOffer.items.forEach(item => {
          if (item.item_note) {
            itemNotesMap[item.pricelist_item_id] = item.item_note;
          }
        });
        wizardState.setItemNotes(itemNotesMap);
        
        // Liste bazında indirim ve kar oranlarını geri yükle
        const discountsMap = {};
        const profitsMap = {};
        
        sourceOffer.items.forEach(item => {
          // Liste bazında indirimler
          if (item.list_discounts) {
            try {
              const discounts = typeof item.list_discounts === 'string' 
                ? JSON.parse(item.list_discounts) 
                : item.list_discounts;
              if (Array.isArray(discounts) && discounts.length > 0) {
                discountsMap[item.pricelist_id] = discounts;
              }
            } catch (e) {
              console.error('Parse list_discounts error:', e);
            }
          }
          
          // Liste bazında kar oranları
          if (item.list_profits) {
            try {
              const profits = typeof item.list_profits === 'string' 
                ? JSON.parse(item.list_profits) 
                : item.list_profits;
              if (Array.isArray(profits) && profits.length > 0) {
                profitsMap[item.pricelist_id] = profits;
              }
            } catch (e) {
              console.error('Parse list_profits error:', e);
            }
          }
        });
        
        wizardState.setDiscountData(discountsMap);
        wizardState.setProfitData(profitsMap);
        
        // Manuel fiyatları geri yükle
        const manualPricesMap = {};
        sourceOffer.items.forEach(item => {
          if (item.manual_price) {
            try {
              const manualPrice = typeof item.manual_price === 'string'
                ? JSON.parse(item.manual_price)
                : item.manual_price;
              // enabled: false olanları da ekle ki checkbox durumu korunsun
              if (manualPrice && typeof manualPrice === 'object') {
                manualPricesMap[item.pricelist_item_id] = {
                  enabled: manualPrice.enabled || false,
                  price: manualPrice.price || 0
                };
              }
            } catch (e) {
              console.error('Parse manual_price error:', e);
            }
          }
        });
        wizardState.setManualPrices(manualPricesMap);
      }
      
      setEditingOffer(null); // Revizyon için editingOffer null olmalı (yeni teklif gibi davranır)
      setWizardVisible(true);
      
      NotificationService.info('Bilgi', `Revizyon ${newRevisionNo} oluşturuluyor...`);
    } catch (error) {
      console.error('Create revision error:', error);
      NotificationService.error('Hata', 'Revizyon oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Teklif kaydet
  const handleSaveOffer = async (wizardData) => {
    try {
      const { offerData, selectedItems, itemNotes, itemDiscounts, discountData, profitData, manualPrices } = wizardData;
      
      // Kullanıcı bilgisini al
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        NotificationService.error('Hata', 'Kullanıcı bilgisi bulunamadı');
        return;
      }
      
      let offerId;
      const isEditing = editingOffer !== null;
      
      if (isEditing) {
        // Güncelleme modu
        const updatePayload = {
          offer_no: offerData.offer_no,
          customer: offerData.customer || null,
          company_id: offerData.company_id,
          status: editingOffer.status || 'draft',
          customer_response: editingOffer.customer_response || 'pending'
        };
        
        const offerResponse = await offersService.updateOffer(editingOffer.id, updatePayload);
        
        if (!offerResponse.success) {
          NotificationService.error('Hata', 'Teklif güncellenemedi');
          return;
        }
        
        offerId = editingOffer.id;
      } else {
        // Yeni teklif oluşturma modu
        const offerPayload = {
          offer_no: offerData.offer_no,
          customer: offerData.customer || null,
          company_id: offerData.company_id,
          created_by: user.id,
          parent_offer_id: offerData.parent_offer_id || null,
          revision_no: offerData.revision_no || 0,
          status: 'draft',
          customer_response: 'pending'
        };

        const offerResponse = await offersService.createOffer(offerPayload);

        if (!offerResponse.success) {
          NotificationService.error('Hata', 'Teklif kaydedilemedi: ' + (offerResponse.message || 'Bilinmeyen hata'));
          return;
        }

        offerId = offerResponse.offer.id;
      }
        
        // Offer items'ı hazırla - Backend'in beklediği formatta
        const offerItems = selectedItems.map(item => {
          const itemDiscount = itemDiscounts[item.id] || 0;
          const manualPrice = manualPrices[item.id];
          const note = itemNotes[item.id] || null;
          
          // Birim fiyat hesapla (sales_price - final birim fiyat)
          let salesPrice = parseFloat(item.price);
          
          // Manuel fiyat varsa onu kullan
          if (manualPrice && manualPrice.enabled && manualPrice.price > 0) {
            salesPrice = manualPrice.price;
          } else {
            // Ürün indirimi
            if (itemDiscount > 0) {
              salesPrice = salesPrice * (1 - itemDiscount / 100);
            }
            
            // Liste bazında indirimler
            const discounts = discountData[item.pricelist_id] || [];
            discounts.forEach(discount => {
              if (discount.rate > 0) {
                salesPrice = salesPrice * (1 - discount.rate / 100);
              }
            });
            
            // Kar oranları
            const profits = profitData[item.pricelist_id] || [];
            profits.forEach(profit => {
              if (profit.rate > 0) {
                salesPrice = salesPrice * (1 + profit.rate / 100);
              }
            });
          }
          
          // Backend'in beklediği format
          return {
            pricelist_item_id: item.id,
            quantity: item.quantity,
            price: salesPrice, // Birim satış fiyatı (final)
            total_price: salesPrice * item.quantity, // Toplam fiyat
            product_id: item.product_id,
            product_name_tr: item.name_tr || item.name,
            product_name_en: item.name_en || item.name,
            description: note || (item.description_tr || item.description_en || item.description || ''),
            unit: item.unit || 'adet',
            currency: item.currency,
            pricelist_id: item.pricelist_id,
            // Yeni alanlar - indirim ve kar bilgileri
            original_price: parseFloat(item.price), // Orijinal liste fiyatı
            item_discount_rate: itemDiscount, // Ürün bazında indirim %
            item_note: note, // Ürün notu
            list_discounts: discountData[item.pricelist_id] || [], // Liste bazında indirimler
            list_profits: profitData[item.pricelist_id] || [], // Liste bazında kar oranları
            manual_price: manualPrice || null // Manuel fiyat bilgisi
          };
        });
        
      // Offer items'ı kaydet
      const saveItemsResponse = await offersService.saveOfferItems(offerId, offerItems);

      if (!saveItemsResponse.success) {
        NotificationService.error('Hata', 'Teklif kalemleri kaydedilemedi: ' + (saveItemsResponse.message || 'Bilinmeyen hata'));
        return;
      }

      NotificationService.success('Başarılı', isEditing ? 'Teklif başarıyla güncellendi' : 'Teklif başarıyla kaydedildi');
      
      // Modal'ı kapat ve listeyi yenile
      handleWizardCancel();
      fetchOffers();
    } catch (error) {
      console.error('Save offer error:', error);
      NotificationService.error('Hata', 'Teklif kaydedilirken hata oluştu');
      throw error;
    }
  };

  return (
    <div className={styles.mainContainer}>
      {/* Header Component */}
      <OffersHeader 
        onCreateOffer={() => handleCreateOffer(true)}
        loading={loading}
      />

      <Card>
        {/* Filtreleme Component */}
        <OffersSearch
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          availableCustomers={availableCustomers}
          availableUsers={availableUsers}
        />

        {/* Teklifler Tablosu Component */}
        <OffersTable
          columns={columns}
          dataSource={filteredOffers}
          loading={loading}
          expandedRowKeys={expandedRowKeys}
          onExpandedRowKeysChange={setExpandedRowKeys}
          expandedRowRender={expandedRowRender}
          getRevisions={getRevisions}
        />
      </Card>

      {/* Preview Modal Component */}
      <PreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        offer={previewOffer}
        items={previewItems}
      />

      {/* Offer Wizard Modal */}
      <OfferWizard
        visible={wizardVisible}
        onCancel={handleWizardCancel}
        editingOffer={editingOffer}
        companies={companies}
        isTemplateMode={wizardState.isTemplateMode}
        wizardState={wizardState}
        pricelists={pricelists}
        onSave={handleSaveOffer}
      />
    </div>
  );
};

export default OffersTemp;