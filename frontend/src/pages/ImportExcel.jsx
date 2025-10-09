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
  Modal
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
import axios from 'axios';
import NotificationService from '../utils/notification';
import { useLocation } from 'react-router-dom';

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
      const response = await axios.get('http://localhost:3000/api/pricelists');
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
          'stock': ['stok', 'stock', 'quantity', 'qty', 'amount'],
          'price': ['fiyat', 'price', 'cost', 'amount', 'value']
        };
      } else {
        return {
          'product_id': ['product id', 'productid', 'product_id', 'product code', 'productcode', 'product_code', 'id', 'item id', 'item_id'],
          'product_name': ['product name', 'productname', 'product_name', 'name', 'item name', 'item_name', 'title'],
          'product_description': ['product description', 'productdescription', 'product_description', 'description', 'desc'],
          'stock': ['stock', 'quantity', 'qty', 'amount'],
          'price': ['price', 'cost', 'amount', 'value']
        };
      }
    };

    const expectedColumns = getExpectedColumns(language);
    
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
        // İlk birkaç satırı header için kontrol et
        let headerRowIndex = -1;
        let headers = [];
        
        // İlk 3 satırda gerçek headerı ara
        for (let i = 0; i < Math.min(3, filteredData.length); i++) {
          const rowHeaders = filteredData[i].map(h => String(h || '').toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
          
          // Bu satırda beklenen sütunlar var mı?
          const columnMapping = {};
          let foundColumns = 0;
          
          Object.keys(expectedColumns).forEach(key => {
            const possibleNames = expectedColumns[key];
            for (let possibleName of possibleNames) {
              const cleanName = possibleName.toLowerCase().replace(/[^a-z0-9]/g, '');
              const headerIndex = rowHeaders.findIndex(header => header === cleanName);
              if (headerIndex !== -1) {
                columnMapping[key] = headerIndex;
                foundColumns++;
                break;
              }
            }
          });
          
          // En az 2 temel sütun bulundu mu?
          const hasMinimumColumns = columnMapping.product_name !== undefined && 
                                  columnMapping.price !== undefined;
          
          if (hasMinimumColumns) {
            headerRowIndex = i;
            headers = rowHeaders;
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          console.warn(`Sheet '${sheetName}' uygun header bulunamadı:`, {
            ilk3Satir: filteredData.slice(0, 3)
          });
          return;
        }
        
        // Sütunları eşleştir
        const columnMapping = {};
        let foundColumns = 0;
        
        Object.keys(expectedColumns).forEach(key => {
          const possibleNames = expectedColumns[key];
          for (let possibleName of possibleNames) {
            const cleanName = possibleName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const headerIndex = headers.findIndex(header => header === cleanName);
            if (headerIndex !== -1) {
              columnMapping[key] = headerIndex;
              foundColumns++;
              break;
            }
          }
        });
        
        // En az 2 temel sütun bulunmalı (product_name, price)
        const hasMinimumColumns = columnMapping.product_name !== undefined && 
                                columnMapping.price !== undefined;
        
        if (hasMinimumColumns) {
          // Header satırından sonraki satırları al
          const dataRows = filteredData.slice(headerRowIndex + 1);
          
          const rows = dataRows.map((row, index) => {
            // Açıklama alanını seçilen dile göre ata
            const description = columnMapping.product_description !== undefined ? (row[columnMapping.product_description] || '') : '';
            // Ürün adını seçilen dile göre ata
            const productName = row[columnMapping.product_name] || `Ürün ${index + 1}`;
            
            return {
              key: index,
              product_id: columnMapping.product_id !== undefined ? (row[columnMapping.product_id] || '') : `AUTO-${index + 1}`,
              name_tr: language === 'tr' ? productName : '',
              name_en: language === 'en' ? productName : '',
              description_tr: language === 'tr' ? description : '',
              description_en: language === 'en' ? description : '',
              stock: columnMapping.stock !== undefined ? (parseInt(row[columnMapping.stock]) || 0) : 0,
              price: parseFloat(row[columnMapping.price]) || 0,
              // Display kolonları (tablo için)
              col_0: columnMapping.product_id !== undefined ? (row[columnMapping.product_id] || `AUTO-${index + 1}`) : `AUTO-${index + 1}`,
              col_1: productName,
              col_2: description,
              col_3: columnMapping.stock !== undefined ? (row[columnMapping.stock] || '0') : '0',
              col_4: row[columnMapping.price] || '0'
            };
          }).filter(row => 
            // Boş satırları filtrele (en az product name olmalı ve geçerli fiyat)
            row.col_1.toString().trim() !== '' && 
            row.col_1 !== `Ürün ${row.key + 1}` &&
            row.price > 0
          );
          
          if (rows.length > 0) {
            // Başlıkları dile göre ayarla - ID/Code esnekliği ile
            const headers = language === 'tr' 
              ? ['Ürün ID/Kodu', 'Ürün Adı', 'Ürün Açıklaması', 'Stok', 'Fiyat']
              : ['Product ID/Code', 'Product Name', 'Product Description', 'Stock', 'Price'];
              
            sheets[sheetName] = {
              headers,
              rows,
              rawData: filteredData,
              columnMapping
            };
            
            selections[sheetName] = [];
            assignments[sheetName] = null;
            validSheetCount++;
          }
        } else {
          console.warn(`Sheet '${sheetName}' yetersiz sütuna sahip:`, {
            bulunanlar: Object.keys(columnMapping),
            headerlar: headers,
            eslestirme: columnMapping
          });
        }
      }
    });
    
    if (validSheetCount === 0) {
      const errorTitle = 'Geçersiz Excel Formatı'; // Her zaman Türkçe
      const errorMessage = language === 'tr' 
        ? `Hiçbir sheet uygun sütunlara sahip değil. Seçtiğiniz dil: ${language.toUpperCase()}. Gerekli sütunlar: "Ürün Adı" ve "Fiyat" (veya "Stok"). Console'u kontrol edin.`
        : `Hiçbir sheet uygun sütunlara sahip değil. Seçtiğiniz dil: ${language.toUpperCase()}. Gerekli sütunlar: "Product Name" and "Price" (or "Stock"). Console'u kontrol edin.`;
        
      NotificationService.error(errorTitle, errorMessage);
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
                unit: 'adet'
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
        const allPricelistsResponse = await axios.get('http://localhost:3000/api/pricelists');
        if (allPricelistsResponse.data.success) {
          for (const pricelist of allPricelistsResponse.data.pricelists) {
            try {
              const response = await axios.get(`http://localhost:3000/api/pricelists/${pricelist.id}`);
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
          
          if (canUpdateDescription || canUpdateName) {
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
          duplicatesByLocation[location].push(task.item.name);
        });
        
        duplicateInfo.push(...Object.entries(duplicatesByLocation).map(([location, items]) => ({
          pricelistName: location,
          count: items.length,
          items: items.slice(0, 5) // İlk 5 ürünü göster
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
              await axios.post(`http://localhost:3000/api/pricelists/${pricelistId}/items`, item);
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
                unit: existingItem.unit
              };
              
              await axios.put(`http://localhost:3000/api/items/${existingItem.id}`, updatedItem);
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
          description="Excel dosyanızda en az şu sütunlar olmalı: Ürün Adı (Name/Title) ve Fiyat (Price/Cost). Opsiyonel: ID, Açıklama, Stok. Sütun isimleri esnek - farklı isimler de kabul edilir."
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
              
              <Table
                dataSource={sheet.rows}
                columns={getTableColumns(sheet.headers)}
                rowSelection={{
                  selectedRowKeys: selectedRows[sheetName] || [],
                  onChange: (selectedRowKeys) => handleRowSelection(sheetName, selectedRowKeys),
                }}
                pagination={{ defaultPageSize: 10 }}
                scroll={{ x: 800 }}
                size="small"
              />
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
