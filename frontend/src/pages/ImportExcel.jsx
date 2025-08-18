import React, { useState, useEffect } from 'react';
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
import * as XLSX from 'xlsx';
import axios from 'axios';
import NotificationService from '../utils/notification';

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

  useEffect(() => {
    document.title = 'Price List App v3 - Import Excel';
    fetchPricelists();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchPricelists = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pricelists');
      if (response.data.success) {
        setPricelists(response.data.pricelists);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Fiyat listeleri yüklenemedi');
    }
  };

  const handleFileUpload = (file) => {
    setExcelFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        
        // Beklenen sütun isimleri (büyük/küçük harf ve boşluk farkı yapmadan)
        const expectedColumns = {
          'product_id': ['product id', 'productid', 'product_id', 'id', 'item id', 'item_id'],
          'product_name': ['product name', 'productname', 'product_name', 'name', 'item name', 'item_name', 'title'],
          'product_description': ['product description', 'productdescription', 'product_description', 'description', 'desc'],
          'stock': ['stock', 'quantity', 'qty', 'amount', 'stok'],
          'price': ['price', 'cost', 'amount', 'value', 'fiyat']
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
                return {
                  key: index,
                  product_id: columnMapping.product_id !== undefined ? (row[columnMapping.product_id] || '') : `AUTO-${index + 1}`,
                  name: row[columnMapping.product_name] || `Ürün ${index + 1}`,
                  description: columnMapping.product_description !== undefined ? (row[columnMapping.product_description] || '') : '',
                  stock: columnMapping.stock !== undefined ? (parseInt(row[columnMapping.stock]) || 0) : 0,
                  price: parseFloat(row[columnMapping.price]) || 0,
                  // Display kolonları (tablo için)
                  col_0: columnMapping.product_id !== undefined ? (row[columnMapping.product_id] || `AUTO-${index + 1}`) : `AUTO-${index + 1}`,
                  col_1: row[columnMapping.product_name] || '',
                  col_2: columnMapping.product_description !== undefined ? (row[columnMapping.product_description] || '') : '',
                  col_3: columnMapping.stock !== undefined ? (row[columnMapping.stock] || '0') : '0',
                  col_4: row[columnMapping.price] || '0'
                };
              }).filter(row => 
                // Boş satırları filtrele (en az product name olmalı ve geçerli fiyat)
                row.name.toString().trim() !== '' && 
                row.name !== `Ürün ${row.key + 1}` &&
                row.price > 0
              );
              
              if (rows.length > 0) {
                sheets[sheetName] = {
                  headers: ['Product ID', 'Product Name', 'Product Description', 'Stock', 'Price'],
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
          NotificationService.error(
            'Geçersiz Excel Formatı', 
            'Hiçbir sheet uygun sütunlara sahip değil. En az şu sütunlar gerekli: Ürün Adı/Name ve Fiyat/Price. Console\'u kontrol edin.'
          );
          return;
        }
        
        setSheetData(sheets);
        setSelectedRows(selections);
        setSheetAssignments(assignments);
        setCurrentStep(1);
        
        NotificationService.success('Başarılı', `${validSheetCount} geçerli sheet başarıyla yüklendi`);
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
                name: item.name || 'İsimsiz Ürün',
                description: item.description || '',
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
        const allPricelistsResponse = await axios.get('http://localhost:3001/api/pricelists');
        if (allPricelistsResponse.data.success) {
          for (const pricelist of allPricelistsResponse.data.pricelists) {
            try {
              const response = await axios.get(`http://localhost:3001/api/pricelists/${pricelist.id}`);
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
      
      // Duplikasyon kontrolü (tüm fiyat listelerinde)
      const tasksToImport = [];
      const duplicateTasks = [];
      
      importTasks.forEach(task => {
        let isDuplicate = false;
        let duplicateLocation = null;
        
        // Tüm fiyat listelerinde kontrol et
        for (const [pricelistId, pricelistData] of Object.entries(allPricelistItems)) {
          const existingItems = pricelistData.items || [];
          const foundDuplicate = existingItems.some(existingItem => 
            existingItem.name.toLowerCase().trim() === task.item.name.toLowerCase().trim() &&
            existingItem.product_id === task.item.product_id
          );
          
          if (foundDuplicate) {
            isDuplicate = true;
            duplicateLocation = pricelistData.name;
            break;
          }
        }
        
        if (isDuplicate) {
          duplicateTasks.push({
            ...task,
            duplicateLocation
          });
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
      

      
      if (tasksToImport.length === 0) {
        NotificationService.warning('Uyarı', 'Tüm seçilen ürünler zaten mevcut, import edilecek yeni ürün yok');
        
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
      
      // Import işlemlerini batch'ler halinde yap
      const batchSize = 10;
      let completed = 0;
      
      for (let i = 0; i < tasksToImport.length; i += batchSize) {
        const batch = tasksToImport.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ pricelistId, item }) => {
            try {
              await axios.post(`http://localhost:3001/api/pricelists/${pricelistId}/items`, item);
              completed++;
              setImportProgress((completed / tasksToImport.length) * 100);
            } catch (error) {
              console.error('Import error:', error);
            }
          })
        );
      }
      
      let successMessage = `${completed} ürün başarıyla import edildi`;
      if (duplicateInfo.length > 0) {
        const duplicateDetails = duplicateInfo.map(info => 
          `${info.pricelistName}: ${info.items.join(', ')}${info.count > info.items.length ? ` ve ${info.count - info.items.length} ürün daha` : ''}`
        ).join('; ');
        
        successMessage += `. ${duplicateTasks.length} ürün zaten mevcut olduğu için atlandı (${duplicateDetails})`;
      }
      
      NotificationService.success('Başarılı', successMessage);
      
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
        
        <div style={{ marginTop: '24px' }}>
          <Dragger
            accept=".xls,.xlsx"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            style={{ padding: '20px' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Dosyayı buraya sürükleyin veya tıklayın</p>
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