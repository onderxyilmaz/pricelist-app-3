import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Card,
  Typography,
  Upload,
  Button,
  Steps,
  Table,
  Tabs,
  Select,
  Space,
  Checkbox,
  Row,
  Col,
  Alert,
  Divider,
  Tag,
  Progress,
  Modal,
  Collapse
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  CheckOutlined,
  ImportOutlined,
  EyeOutlined,
  SelectOutlined,
  ClearOutlined
} from '@ant-design/icons';
import ExcelJS from 'exceljs';
import NotificationService from '../../utils/notification';
import { pricelistApi } from '../../utils/api';
import { useLocation } from 'react-router-dom';
import {
  createSectionState,
  applySectionToState,
  sectionStateToRowFields,
  findSectionInRow,
  isRowCompletelyEmpty
} from '../../utils/excelSectionRows';
import { groupItemsBySectionInOrder } from '../../utils/offerSectionGroups';
import SectionHeadingLabel from '../../components/SectionHeadingLabel';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Option } = Select;

const ImportExcel = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [excelFile, setExcelFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetData, setSheetData] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [pricelists, setPricelists] = useState([]);
  const [sheetAssignments, setSheetAssignments] = useState({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(null); // null, 'tr' veya 'en'
  const location = useLocation();

  useEffect(() => {
    document.title = 'Price List App v3 - Import Excel';
    fetchPricelists();
  }, []);

  useEffect(() => {
    setSelectedLanguage(null);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchPricelists = async () => {
    try {
      const response = await pricelistApi.getPricelists();
      if (response.data.success) {
        setPricelists(response.data.pricelists);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Fiyat listeleri yüklenemedi');
    }
  };

  // Excel parse etme fonksiyonu
  const parseExcelFile = (wb, language) => {
    // Beklenen sütun isimleri (dil seçimine göre)
    const getExpectedColumns = (lang) => {
      if (lang === 'tr') {
        return {
          'product_id': ['ürün id', 'ürün kodu', 'ürünid', 'ürünkodu', 'product id', 'productid', 'product_id', 'product code', 'productcode', 'product_code', 'id', 'item id', 'item_id'],
          'product_name': ['ürün adı', 'ürün ad', 'ürün', 'ad'],
          'product_description': ['ürün açıklaması', 'ürün açıklama', 'açıklama', 'açıklaması'],
          // 'amount' sadece fiyat — stokta olursa aynı sütun iki kez atanır, diğer sheet'lerde başlık geçersiz sayılır
          'stock': ['stok', 'stock', 'quantity', 'qty', 'miktar'],
          'price': ['fiyat', 'price', 'cost', 'amount', 'value', 'tutar']
        };
      } else {
        return {
          'product_id': ['product id', 'productid', 'product_id', 'product code', 'productcode', 'product_code', 'id', 'item id', 'item_id'],
          'product_name': ['product name', 'productname', 'product_name', 'name', 'item name', 'item_name', 'title'],
          'product_description': ['product description', 'productdescription', 'product_description', 'description', 'desc'],
          'stock': ['stock', 'quantity', 'qty'],
          'price': ['price', 'cost', 'amount', 'value', 'unit price', 'unitprice', 'list price', 'listprice']
        };
      }
    };

    const expectedColumns = getExpectedColumns(language);

    /** Aynı başlık metni iki alana (ör. "amount" hem stok hem fiyat) yanlışlanmasın; her sütun en fazla bir alan. Öncelik: ürün adı, fiyat, sonra diğerleri. */
    const buildColumnMapping = (rowHeaders) => {
      const columnMapping = {};
      const used = new Set();
      const fieldOrder = [
        'product_name',
        'price',
        'product_id',
        'product_description',
        'stock'
      ];
      keyLoop: for (const key of fieldOrder) {
        const possibleNames = expectedColumns[key] || [];
        for (const possibleName of possibleNames) {
          const cleanName = possibleName.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (let hi = 0; hi < rowHeaders.length; hi++) {
            if (used.has(hi)) continue;
            if (rowHeaders[hi] === cleanName) {
              columnMapping[key] = hi;
              used.add(hi);
              continue keyLoop;
            }
          }
        }
      }
      return columnMapping;
    };
    
    // Tüm sheet'leri parse et
    const sheets = {};
    const selections = {};
    const assignments = {};
    let validSheetCount = 0;
    
    wb.SheetNames.forEach(sheetName => {
      const worksheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Boş satırları filtrele
      const filteredData = jsonData.filter(row => 
        row.some(cell => cell !== undefined && cell !== null && cell !== '')
      );
      
      if (filteredData.length > 0) {
        let headerRowIndex = -1;
        
        // İlk N satırda header satırını ara (üstte açıklama/başlık satırları olabilir)
        const maxHeaderSearch = Math.min(30, filteredData.length);
        for (let i = 0; i < maxHeaderSearch; i++) {
          const rowHeaders = filteredData[i].map(h => String(h || '').toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
          const tryMap = buildColumnMapping(rowHeaders);
          if (tryMap.product_name !== undefined && tryMap.price !== undefined) {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          console.warn(`Sheet '${sheetName}' uygun header bulunamadı:`, {
            ilkSatirlar: filteredData.slice(0, Math.min(5, filteredData.length))
          });
          return;
        }

        const rowHeaders = filteredData[headerRowIndex].map((h) =>
          String(h || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '')
        );
        const columnMapping = buildColumnMapping(rowHeaders);

        if (columnMapping.product_name !== undefined && columnMapping.price !== undefined) {
          // Header satırından sonraki satırları al
          const dataRows = filteredData.slice(headerRowIndex + 1);
          let sectionState = createSectionState();
          const rawRows = [];
          let productKey = 0;

          for (let index = 0; index < dataRows.length; index++) {
            const row = dataRows[index];
            const sectionParsed = findSectionInRow(row, columnMapping);
            if (sectionParsed) {
              sectionState = applySectionToState(sectionState, sectionParsed);
              continue;
            }

            if (isRowCompletelyEmpty(row)) {
              continue;
            }

            const description = columnMapping.product_description !== undefined ? (row[columnMapping.product_description] || '') : '';
            const descStr = String(description || '').trim();
            const rawNameCell = row[columnMapping.product_name];
            const nameStr =
              rawNameCell != null && String(rawNameCell).trim() !== '' ? String(rawNameCell).trim() : '';
            const pidForName =
              columnMapping.product_id !== undefined
                ? String(row[columnMapping.product_id] != null ? row[columnMapping.product_id] : '').trim()
                : '';
            // Birçok fiyat listesinde "Product Name" boş, metin açıklama sütununda; yoksa koddan türet
            const productName =
              nameStr || pidForName || (descStr ? descStr.slice(0, 150) : '') || `Ürün ${index + 1}`;
            const sec = sectionStateToRowFields(sectionState, language);
            const s1d = language === 'tr' ? sec.section_l1_tr : sec.section_l1_en;
            const s2d = language === 'tr' ? sec.section_l2_tr : sec.section_l2_en;
            const pid = columnMapping.product_id !== undefined ? (row[columnMapping.product_id] || '') : `AUTO-${productKey + 1}`;

            rawRows.push({
              key: productKey,
              product_id: pid,
              name_tr: language === 'tr' ? productName : '',
              name_en: language === 'en' ? productName : '',
              description_tr: language === 'tr' ? description : '',
              description_en: language === 'en' ? description : '',
              stock: columnMapping.stock !== undefined ? (parseInt(row[columnMapping.stock]) || 0) : 0,
              price: parseFloat(row[columnMapping.price]) || 0,
              section_l1_tr: sec.section_l1_tr,
              section_l1_en: sec.section_l1_en,
              section_l2_tr: sec.section_l2_tr,
              section_l2_en: sec.section_l2_en,
              col_0: s1d,
              col_1: s2d,
              col_2: pid,
              col_3: productName,
              col_4: description,
              col_5: columnMapping.stock !== undefined ? (row[columnMapping.stock] || '0') : '0',
              col_6: row[columnMapping.price] || '0',
              _rowIndex: index
            });
            productKey++;
          }

          const rows = rawRows
            .filter((row) => {
              if (row.col_3.toString().trim() === '') return false;
              // Adı boş satırlar için col_3 artık ID veya açıklamadan gelir; eski "Ürün N" sahte eşleşmesi kaldırıldı
              if (!Number.isFinite(row.price) || row.price < 0) return false;
              return true;
            })
            .map(({ _rowIndex, ...rest }) => rest);

          const tableHeaders =
            language === 'tr'
              ? ['Bölüm 1', 'Bölüm 2', 'Ürün ID/Kodu', 'Ürün Adı', 'Ürün Açıklaması', 'Stok', 'Fiyat']
              : [
                  'Section 1',
                  'Section 2',
                  'Product ID/Code',
                  'Product Name',
                  'Product Description',
                  'Stock',
                  'Price'
                ];

          // Geçerli header bulunduysa sheet'i her zaman sekmelerde göster (0 satır olsa bile — fiyatı 0 olan listeler vb.)
          sheets[sheetName] = {
            headers: tableHeaders,
            rows,
            rawData: filteredData,
            columnMapping
          };

          selections[sheetName] = [];
          assignments[sheetName] = null;
          validSheetCount++;
        } else {
          console.warn(`Sheet '${sheetName}' ürün adı veya fiyat sütunu eşlenemedi:`, columnMapping);
        }
      }
    });
    
    if (validSheetCount === 0) {
      NotificationService.error(
        'Geçersiz Excel Formatı',
        `Hiçbir sheet uygun sütunlara sahip değil. Seçtiğiniz dil: ${language.toUpperCase()}. Gerekli sütunlar: "Ürün Adı" ve "Fiyat" (veya "Stok"). Console'u kontrol edin.`
      );
      return null;
    }
    
    return { sheets, selections, assignments };
  };

  // Excel dosyası yeniden parse etme (dil değiştiğinde)
  useEffect(() => {
    if (workbook && currentStep >= 1) {
      const result = parseExcelFile(workbook, selectedLanguage);
      if (result) {
        setSheetData(result.sheets);
        setSelectedRows(result.selections);
        setSheetAssignments(result.assignments);
      }
    }
  }, [selectedLanguage, workbook]);

  const handleFileUpload = (file) => {
    // Dil seçimi kontrolü
    if (!selectedLanguage) {
      NotificationService.error('Hata', 'Önce açıklama dilini seçin');
      return false;
    }
    
    setExcelFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        
        const result = parseExcelFile(wb, selectedLanguage);
        if (result) {
          setSheetData(result.sheets);
          setSelectedRows(result.selections);
          setSheetAssignments(result.assignments);
          setCurrentStep(1);
        }
        
      } catch (error) {
        console.error('Excel parse error:', error);
        NotificationService.error('Hata', 'Excel dosyası okunamadı');
      }
    };
    
    reader.readAsArrayBuffer(file);
    return false; // Prevent upload
  };

  const getTableColumns = (headers) => {
    return headers.map((header, index) => ({
      title: header || `Kolon ${index + 1}`,
      dataIndex: `col_${index}`,
      key: `col_${index}`,
      width: 150,
      ellipsis: true,
    }));
  };

  /** Bölüm sütunları hariç: ürün ID, ad, açıklama, stok, fiyat (col_2..col_6) */
  const getProductTableColumns = (headers) => {
    if (headers.length <= 2) {
      return getTableColumns(headers);
    }
    return headers.slice(2).map((header, j) => {
      const index = j + 2;
      return {
        title: header || `Kolon ${index + 1}`,
        dataIndex: `col_${index}`,
        key: `col_${index}`,
        width: 140,
        ellipsis: true
      };
    });
  };

  const sheetHasSectionHierarchy = (rows) =>
    (rows || []).some(
      (r) => r.section_l1_tr || r.section_l1_en || r.section_l2_tr || r.section_l2_en
    );

  const handleRowSelection = (sheetName, selectedRowKeys) => {
    setSelectedRows(prev => ({
      ...prev,
      [sheetName]: selectedRowKeys
    }));
  };

  const selectAllRows = (sheetName) => {
    const allKeys = sheetData[sheetName].rows.map(row => row.key);
    setSelectedRows(prev => ({
      ...prev,
      [sheetName]: allKeys
    }));
  };

  const clearAllSelections = (sheetName) => {
    setSelectedRows(prev => ({
      ...prev,
      [sheetName]: []
    }));
  };

  const handleSheetAssignment = (sheetName, pricelistId) => {
    setSheetAssignments(prev => ({
      ...prev,
      [sheetName]: pricelistId
    }));
  };

  const mergeGroupRowSelection = (sheetName, groupItems, newKeys) => {
    setSelectedRows((prev) => {
      const groupSet = new Set(groupItems.map((r) => r.key));
      const other = (prev[sheetName] || []).filter((k) => !groupSet.has(k));
      return { ...prev, [sheetName]: [...other, ...newKeys] };
    });
  };

  const canProceedToImport = () => {
    // En az bir sheet'te seçilmiş satır ve hedef fiyat listesi varsa yeterli
    return Object.keys(sheetData).some(sheetName => {
      const hasSelectedRows = selectedRows[sheetName]?.length > 0;
      const hasAssignment = sheetAssignments[sheetName] !== null;
      return hasSelectedRows && hasAssignment;
    });
  };

  const performImport = async () => {
    setImporting(true);
    setImportProgress(0);
    
    try {
      const importTasks = [];
      const duplicateInfo = [];
      
      // İlk olarak tüm seçilen ürünleri hazırla
      Object.keys(sheetData).forEach(sheetName => {
        const selectedRowKeys = selectedRows[sheetName] || [];
        const pricelistId = sheetAssignments[sheetName];
        
        if (selectedRowKeys.length > 0 && pricelistId) {
          const selectedItems = sheetData[sheetName].rows.filter(row => 
            selectedRowKeys.includes(row.key)
          );
          
          selectedItems.forEach(item => {
            importTasks.push({
              pricelistId,
              item: {
                product_id: item.product_id || '',
                name_tr: item.name_tr || '',
                name_en: item.name_en || '',
                description_tr: item.description_tr || '',
                description_en: item.description_en || '',
                stock: item.stock || 0,
                price: item.price || 0,
                unit: 'adet',
                section_l1_tr: item.section_l1_tr || null,
                section_l1_en: item.section_l1_en || null,
                section_l2_tr: item.section_l2_tr || null,
                section_l2_en: item.section_l2_en || null
              },
              sheetName
            });
          });
        }
      });
      
      // Her fiyat listesi için mevcut ürünleri kontrol et
      const allPricelistItems = {};
      
      // Tüm fiyat listelerini al (duplikasyon kontrolü için)
      try {
        const allPricelistsResponse = await pricelistApi.getPricelists();
        if (allPricelistsResponse.data.success) {
          for (const pricelist of allPricelistsResponse.data.pricelists) {
            try {
              const response = await pricelistApi.getPricelistById(pricelist.id);
              if (response.data.success) {
                allPricelistItems[pricelist.id] = {
                  name: pricelist.name,
                  items: response.data.data.items || []
                };
              }
            } catch (error) {
              console.error(`Fiyat listesi ${pricelist.id} ürünleri alınamadı:`, error);
              allPricelistItems[pricelist.id] = { name: pricelist.name, items: [] };
            }
          }
        }
      } catch (error) {
        console.error('Tüm fiyat listeleri alınamadı:', error);
      }
      
      // Duplikasyon kontrolü ve akıllı güncelleme
      const tasksToImport = [];
      const duplicateTasks = [];
      const updateTasks = []; // Açıklama güncellemesi için
      
      importTasks.forEach(task => {
        let isDuplicate = false;
        let duplicateLocation = null;
        let existingItem = null;
        
        // Tüm fiyat listelerinde kontrol et
        for (const [pricelistId, pricelistData] of Object.entries(allPricelistItems)) {
          const existingItems = pricelistData.items || [];
          const foundItem = existingItems.find(existingItem => 
            existingItem.product_id === task.item.product_id
          );
          
          if (foundItem) {
            isDuplicate = true;
            duplicateLocation = pricelistData.name;
            existingItem = foundItem;
            break;
          }
        }
        
        if (isDuplicate) {
          // Akıllı güncelleme kontrolü - hem açıklama hem de ad için
          const canUpdateDescription = 
            (task.item.description_en && !existingItem.description_en) ||   // İngilizce açıklama eklenebilir
            (task.item.description_tr && !existingItem.description_tr); // Türkçe açıklama eklenebilir
            
          const canUpdateName = 
            (task.item.name_en && !existingItem.name_en) ||   // İngilizce ad eklenebilir
            (task.item.name_tr && !existingItem.name_tr); // Türkçe ad eklenebilir

          const canUpdateSection =
            (task.item.section_l1_tr && !existingItem.section_l1_tr) ||
            (task.item.section_l1_en && !existingItem.section_l1_en) ||
            (task.item.section_l2_tr && !existingItem.section_l2_tr) ||
            (task.item.section_l2_en && !existingItem.section_l2_en);
          
          if (canUpdateDescription || canUpdateName || canUpdateSection) {
            updateTasks.push({
              ...task,
              existingItem,
              duplicateLocation
            });
          } else {
            duplicateTasks.push({
              ...task,
              duplicateLocation
            });
          }
        } else {
          tasksToImport.push(task);
        }
      });
      
      // Duplikasyon bilgilerini topla
      if (duplicateTasks.length > 0) {
        const duplicatesByLocation = {};
        duplicateTasks.forEach(task => {
          const location = task.duplicateLocation;
          
          if (!duplicatesByLocation[location]) {
            duplicatesByLocation[location] = [];
          }
          duplicatesByLocation[location].push(task.item.name_tr || task.item.name_en || task.item.product_id);
        });
        
        duplicateInfo.push(...Object.entries(duplicatesByLocation).map(([location, nameParts]) => ({
          pricelistName: location,
          count: nameParts.length,
          items: nameParts.slice(0, 5) // İlk 5 ürünü göster
        })));
      }
      
      // Toplam işlem sayısını hesapla
      const totalOperations = tasksToImport.length + updateTasks.length;
      
      if (totalOperations === 0) {
        NotificationService.warning('Uyarı', 'Tüm seçilen ürünler zaten mevcut, import edilecek yeni ürün yok');
        setSelectedLanguage(null);
        
        // Reset form to initial state
        setCurrentStep(0);
        setExcelFile(null);
        setWorkbook(null);
        setSheetData({});
        setSelectedRows({});
        setSheetAssignments({});
        setImporting(false);
        setImportProgress(0);
        return;
      }
      
      // Önce yeni ürünleri ekle
      const batchSize = 10;
      let newItemsAdded = 0;
      let existingItemsUpdated = 0;
      
      for (let i = 0; i < tasksToImport.length; i += batchSize) {
        const batch = tasksToImport.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ pricelistId, item }) => {
            try {
              await pricelistApi.addItem(pricelistId, item);
              newItemsAdded++;
              setImportProgress(((newItemsAdded + existingItemsUpdated) / totalOperations) * 100);
            } catch (error) {
              console.error('Import error:', error);
            }
          })
        );
      }
      
      // Sonra mevcut ürünleri güncelle (açıklama ekleme)
      for (let i = 0; i < updateTasks.length; i += batchSize) {
        const batch = updateTasks.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ item, existingItem }) => {
            try {
              // Mevcut ürün bilgilerini koru, sadece eksik açıklama ve adları ekle
              const updatedItem = {
                product_id: existingItem.product_id,
                name_tr: item.name_tr || existingItem.name_tr,
                name_en: item.name_en || existingItem.name_en,
                description_tr: item.description_tr || existingItem.description_tr,
                description_en: item.description_en || existingItem.description_en,
                price: existingItem.price,
                stock: existingItem.stock,
                unit: existingItem.unit,
                section_l1_tr: item.section_l1_tr || existingItem.section_l1_tr,
                section_l1_en: item.section_l1_en || existingItem.section_l1_en,
                section_l2_tr: item.section_l2_tr || existingItem.section_l2_tr,
                section_l2_en: item.section_l2_en || existingItem.section_l2_en
              };
              
              await pricelistApi.updateItem(existingItem.id, updatedItem);
              existingItemsUpdated++;
              setImportProgress(((newItemsAdded + existingItemsUpdated) / totalOperations) * 100);
            } catch (error) {
              console.error('Update error:', error);
            }
          })
        );
      }
      
      // Başarı mesajını yeni eklenen ve güncellenen ürünlere göre oluştur
      let successMessage = '';
      
      if (newItemsAdded > 0 && existingItemsUpdated > 0) {
        successMessage = `${newItemsAdded} yeni ürün eklendi, ${existingItemsUpdated} mevcut ürün güncellendi`;
      } else if (newItemsAdded > 0) {
        successMessage = `${newItemsAdded} ürün başarıyla import edildi`;
      } else if (existingItemsUpdated > 0) {
        successMessage = `${existingItemsUpdated} mevcut ürün başarıyla güncellendi`;
      }
      
      if (duplicateInfo.length > 0) {
        const duplicateDetails = duplicateInfo.map(info => 
          `${info.pricelistName}: ${info.items.join(', ')}${info.count > info.items.length ? ` ve ${info.count - info.items.length} ürün daha` : ''}`
        ).join('; ');
        
        successMessage += `. ${duplicateTasks.length} ürün zaten mevcut olduğu için atlandı (${duplicateDetails})`;
      }
      
      NotificationService.success('Başarılı', successMessage);
      setSelectedLanguage(null);
      
      // Reset form
      setCurrentStep(0);
      setExcelFile(null);
      setWorkbook(null);
      setSheetData({});
      setSelectedRows({});
      setSheetAssignments({});
      
    } catch (error) {
      NotificationService.error('Hata', 'Import işlemi sırasında hata oluştu');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const renderFileUpload = () => (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <FileExcelOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={3}>Excel Dosyası Seçin</Title>
        <Text type="secondary">XLS ve XLSX formatlarını destekliyoruz</Text>
        
        <Alert
          message="Beklenen Sütun Formatı"
          description="En az: Ürün Adı ve Fiyat. Opsiyonel: ID, Açıklama, Stok. Bölüm satırları: ürün satırı gibi ayrı satırda, ürün adı veya ID hücresinde N---Başlık (ör. 1---Yangın, 1-1---Alt başlık) ve tam üç adet tire; altındaki ürünler bu bölüme atanır. Sütun isimleri esnek eşleşir."
          type="info"
          style={{ margin: '16px 0', textAlign: 'left' }}
        />
        
        <div style={{ margin: '24px 0', textAlign: 'center' }}>
          <Text strong style={{ marginRight: '12px' }}>Açıklama Dili:</Text>
          <Select
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            placeholder="Dil seçin"
            style={{ width: 200 }}
          >
            <Option value="en">🇺🇸 İngilizce</Option>
            <Option value="tr">🇹🇷 Türkçe</Option>
          </Select>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Excel'deki açıklamalar seçilen dile kaydedilecek
          </div>
        </div>
        
        {!selectedLanguage && (
          <Alert
            message="Önce açıklama dilini seçin"
            description="Excel dosyası yüklemek için önce açıklama dilini seçmeniz gerekiyor."
            type="warning"
            style={{ margin: '16px 0' }}
          />
        )}
        
        <div style={{ marginTop: '24px' }}>
          <Dragger
            accept=".xls,.xlsx"
            beforeUpload={selectedLanguage ? handleFileUpload : () => false}
            showUploadList={false}
            disabled={!selectedLanguage}
            style={{ 
              padding: '20px',
              opacity: selectedLanguage ? 1 : 0.5,
              pointerEvents: selectedLanguage ? 'auto' : 'none'
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {selectedLanguage 
                ? "Dosyayı buraya sürükleyin veya tıklayın" 
                : "Önce açıklama dilini seçin"
              }
            </p>
            <p className="ant-upload-hint">Sadece .xls ve .xlsx dosyaları</p>
          </Dragger>
        </div>
      </div>
    </Card>
  );

  const renderSheetPreview = () => (
    <Card>
      <div style={{ marginBottom: '16px' }}>
        <Title level={4}>Sheet Önizleme ve Seçim</Title>
        <Text type="secondary">
          Her sheet'deki verileri kontrol edin ve import etmek istediğiniz satırları seçin
        </Text>
      </div>
      
      <Tabs>
        {Object.keys(sheetData).map(sheetName => {
          const sheet = sheetData[sheetName];
          const selectedCount = selectedRows[sheetName]?.length || 0;
          const totalCount = sheet.rows.length;
          const useHierarchy = sheetHasSectionHierarchy(sheet.rows);
          const sectionGroups = useHierarchy
            ? groupItemsBySectionInOrder(sheet.rows, selectedLanguage)
            : [];
          const targetPlColor =
            pricelists.find((p) => p.id === sheetAssignments[sheetName])?.color || '#1890ff';

          return (
            <TabPane 
              tab={
                <span>
                  {sheetName} 
                  <Tag color={selectedCount > 0 ? 'blue' : 'default'} style={{ marginLeft: '8px' }}>
                    {selectedCount}/{totalCount}
                  </Tag>
                </span>
              } 
              key={sheetName}
            >
              <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col span={12}>
                  <Space>
                    <Button 
                      icon={<SelectOutlined />}
                      onClick={() => selectAllRows(sheetName)}
                    >
                      Tümünü Seç
                    </Button>
                    <Button 
                      icon={<ClearOutlined />}
                      onClick={() => clearAllSelections(sheetName)}
                    >
                      Seçimi Temizle
                    </Button>
                  </Space>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'right' }}>
                    <Text strong>Hedef Fiyat Listesi: </Text>
                    <Select
                      placeholder="Fiyat listesi seçin"
                      style={{ width: 200 }}
                      value={sheetAssignments[sheetName]}
                      onChange={(value) => handleSheetAssignment(sheetName, value)}
                    >
                      {pricelists.map(pricelist => (
                        <Option key={pricelist.id} value={pricelist.id}>
                          {pricelist.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
              </Row>
              
              {useHierarchy ? (
                <Collapse
                  size="small"
                  defaultActiveKey={sectionGroups.map((_, i) => String(i))}
                  style={{ background: 'transparent' }}
                  items={sectionGroups.map((g, i) => {
                    return {
                      key: String(i),
                      label: (
                        <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <SectionHeadingLabel
                            l1={g.l1}
                            l2={g.l2}
                            pricelistColor={targetPlColor}
                            uncategorizedText={
                              selectedLanguage === 'tr' ? 'Bölüm yok' : 'No section'
                            }
                          />
                          <Tag
                            style={{
                              marginLeft: 0,
                              color: targetPlColor,
                              borderColor: targetPlColor,
                              background: 'transparent'
                            }}
                          >
                            {g.items.length} ürün
                          </Tag>
                        </span>
                      ),
                      children: (
                        <Table
                          dataSource={g.items}
                          rowKey="key"
                          columns={getProductTableColumns(sheet.headers)}
                          rowSelection={{
                            selectedRowKeys: (selectedRows[sheetName] || []).filter((k) =>
                              g.items.some((row) => row.key === k)
                            ),
                            onChange: (keys) => mergeGroupRowSelection(sheetName, g.items, keys)
                          }}
                          pagination={g.items.length > 10 ? { defaultPageSize: 10, size: 'small' } : false}
                          scroll={{ x: 880 }}
                          size="small"
                        />
                      )
                    };
                  })}
                />
              ) : (
                <Table
                  dataSource={sheet.rows}
                  columns={getTableColumns(sheet.headers)}
                  rowKey="key"
                  rowSelection={{
                    selectedRowKeys: selectedRows[sheetName] || [],
                    onChange: (selKeys) => handleRowSelection(sheetName, selKeys)
                  }}
                  pagination={{ defaultPageSize: 10 }}
                  scroll={{ x: 1024 }}
                  size="small"
                />
              )}
            </TabPane>
          );
        })}
      </Tabs>
      
      <Divider />
      
      <div style={{ textAlign: 'center' }}>
        <Space>
          <Button onClick={() => setCurrentStep(0)}>Geri</Button>
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            disabled={!canProceedToImport()}
            onClick={() => setCurrentStep(2)}
          >
            Import Özeti
          </Button>
        </Space>
      </div>
    </Card>
  );

  const renderImportSummary = () => {
    const totalSelectedItems = Object.values(selectedRows).reduce((sum, rows) => sum + rows.length, 0);
    
    return (
      <Card>
        <Title level={4}>Import Özeti</Title>
        
        <Alert
          message={`Toplam ${totalSelectedItems} ürün import edilecek`}
          type="info"
          style={{ marginBottom: '16px' }}
        />
        
        {Object.keys(sheetData).map(sheetName => {
          const selectedCount = selectedRows[sheetName]?.length || 0;
          const pricelistId = sheetAssignments[sheetName];
          const pricelist = pricelists.find(p => p.id === pricelistId);
          
          if (selectedCount === 0) return null;
          
          return (
            <Card key={sheetName} size="small" style={{ marginBottom: '8px' }}>
              <Row>
                <Col span={8}>
                  <Text strong>{sheetName}</Text>
                </Col>
                <Col span={8}>
                  <Tag color="blue">{selectedCount} ürün</Tag>
                </Col>
                <Col span={8}>
                  <Text>→ {pricelist?.name}</Text>
                </Col>
              </Row>
            </Card>
          );
        })}
        
        {importing && (
          <div style={{ margin: '24px 0' }}>
            <Text>Import ediliyor...</Text>
            <Progress percent={Math.round(importProgress)} />
          </div>
        )}
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={() => setCurrentStep(1)} disabled={importing}>Geri</Button>
            <Button 
              type="primary" 
              icon={<ImportOutlined />}
              loading={importing}
              onClick={performImport}
            >
              Import Et
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Excel Import</Title>
      
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        <Step title="Dosya Seç" icon={<InboxOutlined />} />
        <Step title="Veri Seçimi" icon={<EyeOutlined />} />
        <Step title="Import" icon={<ImportOutlined />} />
      </Steps>
      
      {currentStep === 0 && renderFileUpload()}
      {currentStep === 1 && renderSheetPreview()}
      {currentStep === 2 && renderImportSummary()}
    </div>
  );
};

export default ImportExcel;