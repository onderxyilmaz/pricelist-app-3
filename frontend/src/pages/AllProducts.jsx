import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Modal,
  Checkbox,
  message,
  Popconfirm,
  Form,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import NotificationService from '../utils/notification';
import ExcelJS from 'exceljs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pricelists, setPricelists] = useState([]);
  const [selectedPricelists, setSelectedPricelists] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [current, setCurrent] = useState(1);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nameLanguage, setNameLanguage] = useState('tr');
  const [descriptionLanguage, setDescriptionLanguage] = useState('tr');
  const [tableLanguage, setTableLanguage] = useState('tr'); // Tablo görünümü için dil seçimi
  const [editForm] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - All Products';
    fetchAllProducts();
    fetchPricelists();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/all-items');
      if (response.data.success) {
        setProducts(response.data.items);
        setFilteredProducts(response.data.items);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricelists = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pricelists');
      if (response.data.success) {
        setPricelists(response.data.pricelists);
      }
    } catch (error) {
      console.error('Fiyat listeleri yüklenemedi:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    applyFilters(value, selectedPricelists);
  };

  const handlePricelistFilter = (pricelistIds) => {
    setSelectedPricelists(pricelistIds);
    applyFilters(searchText, pricelistIds);
  };

  const applyFilters = (search, pricelistFilters) => {
    let filtered = products;

    // Arama filtresi
    if (search) {
      filtered = filtered.filter(product =>
        (product.name_tr && product.name_tr.toLowerCase().includes(search.toLowerCase())) ||
        (product.name_en && product.name_en.toLowerCase().includes(search.toLowerCase())) ||
        product.product_id.toLowerCase().includes(search.toLowerCase()) ||
        (product.description_tr && product.description_tr.toLowerCase().includes(search.toLowerCase())) ||
        (product.description_en && product.description_en.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Fiyat listesi filtresi (çoklu seçim)
    if (pricelistFilters && pricelistFilters.length > 0) {
      filtered = filtered.filter(product => 
        pricelistFilters.includes(product.pricelist_id)
      );
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedPricelists([]);
    setFilteredProducts(products);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'TRY': '₺',
      'TL': '₺'
    };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  const formatPrice = (price, currency) => {
    return `${getCurrencySymbol(currency)} ${parseFloat(price).toLocaleString('tr-TR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Excel export için kolon tanımları
  const exportColumns = [
    { key: 'product_id', title: 'Product ID', dataIndex: 'product_id' },
    { key: 'name_tr', title: 'Ürün Adı (TR)', dataIndex: 'name_tr' },
    { key: 'name_en', title: 'Ürün Adı (EN)', dataIndex: 'name_en' },
    { key: 'description_tr', title: 'Açıklama (TR)', dataIndex: 'description_tr' },
    { key: 'description_en', title: 'Açıklama (EN)', dataIndex: 'description_en' },
    { key: 'price', title: 'Fiyat', dataIndex: 'price' },
    { key: 'currency', title: 'Para Birimi', dataIndex: 'currency' },
    { key: 'stock', title: 'Stok', dataIndex: 'stock' },
    { key: 'unit', title: 'Birim', dataIndex: 'unit' },
    { key: 'pricelist_name', title: 'Fiyat Listesi', dataIndex: 'pricelist_name' },
    { key: 'created_at', title: 'Oluşturulma Tarihi', dataIndex: 'created_at' }
  ];

  const handleExportClick = () => {
    if (filteredProducts.length === 0) {
      message.warning('Export edilecek ürün bulunamadı');
      return;
    }
    setSelectedColumns(exportColumns.map(col => col.key)); // Varsayılan olarak tüm kolonları seç
    setExportModalVisible(true);
  };

  const handleColumnSelection = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      message.warning('En az bir kolon seçmelisiniz');
      return;
    }

    // Seçili kolonlara göre veriyi hazırla
    const exportData = filteredProducts.map(product => {
      const row = {};
      selectedColumns.forEach(colKey => {
        const colDef = exportColumns.find(col => col.key === colKey);
        if (colDef) {
          let value = product[colDef.dataIndex];
          
          // Özel formatlamalar
          if (colKey === 'price') {
            value = parseFloat(value).toFixed(2);
          } else if (colKey === 'created_at') {
            value = new Date(value).toLocaleDateString('tr-TR');
          } else if (colKey === 'description' && !value) {
            value = '-';
          }
          
          row[colDef.title] = value;
        }
      });
      return row;
    });

    // Excel dosyası oluştur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');

    // Dosya adı oluştur
    const now = new Date();
    const fileName = `urunler_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

    // Dosyayı indir
    XLSX.writeFile(workbook, fileName);
    
    setExportModalVisible(false);
    NotificationService.success('Başarılı', `${filteredProducts.length} ürün Excel'e aktarıldı`);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // Mevcut verilere göre dil seçimini ayarla
    setNameLanguage(product.name_tr ? 'tr' : 'en');
    setDescriptionLanguage(product.description_tr ? 'tr' : 'en');
    editForm.setFieldsValue({
      product_id: product.product_id,
      name_tr: product.name_tr,
      name_en: product.name_en,
      description_tr: product.description_tr,
      description_en: product.description_en,
      price: product.price,
      stock: product.stock,
      unit: product.unit
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`http://localhost:3001/api/items/${productId}`);
      NotificationService.success('Başarılı', 'Ürün silindi');
      fetchAllProducts(); // Listeyi yenile
    } catch (error) {
      NotificationService.error('Hata', 'Ürün silinirken hata oluştu');
    }
  };

  const handleEditSubmit = async (values) => {
    try {
      await axios.put(`http://localhost:3001/api/items/${editingProduct.id}`, values);
      NotificationService.success('Başarılı', 'Ürün güncellendi');
      setEditModalVisible(false);
      setEditingProduct(null);
      editForm.resetFields();
      fetchAllProducts(); // Listeyi yenile
    } catch (error) {
      NotificationService.error('Hata', 'Ürün güncellenirken hata oluştu');
    }
  };

  const columns = [
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 120,
      sorter: (a, b) => a.product_id.localeCompare(b.product_id),
    },
    {
      title: 'Ürün Adı',
      key: 'name',
      sorter: (a, b) => {
        const nameA = (tableLanguage === 'tr' ? a.name_tr : a.name_en) || a.name_tr || a.name_en || '';
        const nameB = (tableLanguage === 'tr' ? b.name_tr : b.name_en) || b.name_tr || b.name_en || '';
        return nameA.localeCompare(nameB, 'tr');
      },
      ellipsis: true,
      render: (_, record) => {
        const displayName = tableLanguage === 'tr' ? record.name_tr : record.name_en;
        return displayName || record.name_tr || record.name_en || '-';
      },
    },
    {
      title: 'Açıklama',
      key: 'description',
      ellipsis: true,
      render: (_, record) => {
        const displayDescription = tableLanguage === 'tr' ? record.description_tr : record.description_en;
        return displayDescription || record.description_tr || record.description_en || '-';
      },
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
  width: 110,
      align: 'center',
      render: (currency) => getCurrencySymbol(currency),
      sorter: (a, b) => {
        const symbolA = getCurrencySymbol(a.currency);
        const symbolB = getCurrencySymbol(b.currency);
        return symbolA.localeCompare(symbolB);
      }
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
      render: (price) => parseFloat(price).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Birim',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Fiyat Listesi',
      dataIndex: 'pricelist_name',
      key: 'pricelist_name',
      width: 200,
      render: (text, record) => (
        <Tag color={record.color || 'blue'}>
          {text}
        </Tag>
      ),
      sorter: (a, b) => a.pricelist_name.localeCompare(b.pricelist_name),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            title="Düzenle"
          />
          <Popconfirm
            title="Ürünü silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Sil"
            />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <div>
      <Title level={2}>Tüm Ürünler</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="Ürün adı, ID veya açıklama ile ara..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
              autoComplete="off"
              autoFocus
            />
          </Col>
          <Col span={5}>
            <Select
              mode="multiple"
              placeholder="Fiyat listesi seç"
              value={selectedPricelists}
              onChange={handlePricelistFilter}
              style={{ width: '100%' }}
              allowClear
              maxTagCount="responsive"
            >
              {pricelists.map(pricelist => (
                <Option key={pricelist.id} value={pricelist.id}>
                  {pricelist.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong style={{ fontSize: '12px' }}>Görünüm:</Text>
              <Button.Group>
                <Button 
                  type={tableLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setTableLanguage('tr')}
                  size="small"
                  style={{ 
                    backgroundColor: tableLanguage === 'tr' ? '#1890ff' : '#f0f0f0',
                    color: tableLanguage === 'tr' ? 'white' : '#000'
                  }}
                >
                  TR
                </Button>
                <Button 
                  type={tableLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setTableLanguage('en')}
                  size="small"
                  style={{ 
                    backgroundColor: tableLanguage === 'en' ? '#52c41a' : '#f0f0f0',
                    color: tableLanguage === 'en' ? 'white' : '#000'
                  }}
                >
                  EN
                </Button>
              </Button.Group>
            </div>
          </Col>
          <Col span={3}>
            <Button 
              icon={<FilterOutlined />} 
              onClick={clearFilters}
            >
              Filtreleri Temizle
            </Button>
          </Col>
          <Col span={7}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ marginRight: 16, color: '#666' }}>
                Toplam: {filteredProducts.length} ürün
              </span>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                disabled={filteredProducts.length === 0}
                onClick={handleExportClick}
              >
                Excel'e Aktar
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredProducts.length,
            pageSize: pageSize,
            current: current,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} ürün`,
            pageSizeOptions: ['10', '25', '50', '100', '200'],
            onChange: (page, size) => {
              setCurrent(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrent(1); // Reset to first page when page size changes
              }
            },
            onShowSizeChange: (current, size) => {
              setPageSize(size);
              setCurrent(1);
            }
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Export Modal */}
      <Modal
        title="Excel Export - Kolon Seçimi"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={handleExport}
        okText="Excel'e Aktar"
        cancelText="İptal"
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Aşağıdaki kolonlardan hangilerinin Excel dosyasına dahil edilmesini istiyorsunuz?</p>
          <p style={{ color: '#666', fontSize: '12px' }}>
            Toplam {filteredProducts.length} ürün aktarılacak.
          </p>
        </div>
        
        <Checkbox.Group 
          value={selectedColumns}
          onChange={handleColumnSelection}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            {exportColumns.map(column => (
              <Col span={12} key={column.key}>
                <Checkbox value={column.key}>
                  {column.title}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>

        <div style={{ marginTop: 20, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Seçili Kolonlar: {selectedColumns.length}</span>
            <div>
              <Button 
                size="small" 
                onClick={() => setSelectedColumns(exportColumns.map(col => col.key))}
                style={{ marginRight: 8 }}
              >
                Tümünü Seç
              </Button>
              <Button 
                size="small" 
                onClick={() => setSelectedColumns([])}
              >
                Tümünü Kaldır
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Ürün Düzenle"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingProduct(null);
          setNameLanguage('tr');
          setDescriptionLanguage('tr');
          editForm.resetFields();
        }}
        footer={null}
        width={600}
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => {
              const firstInput = document.querySelector('input[placeholder="Ürün ID"]');
              if (firstInput) {
                firstInput.focus();
                firstInput.select();
              }
            }, 100);
          }
        }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="product_id"
            label="Product ID"
          >
            <Input 
              placeholder="Ürün ID" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="Ürün Adı"
          >
            <div style={{ marginBottom: 8 }}>
              <Button.Group>
                <Button 
                  type={nameLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setNameLanguage('tr')}
                  style={{ 
                    backgroundColor: nameLanguage === 'tr' ? '#1890ff' : '#f0f0f0',
                    color: nameLanguage === 'tr' ? 'white' : '#000'
                  }}
                >
                  TR
                </Button>
                <Button 
                  type={nameLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setNameLanguage('en')}
                  style={{ 
                    backgroundColor: nameLanguage === 'en' ? '#52c41a' : '#f0f0f0',
                    color: nameLanguage === 'en' ? 'white' : '#000'
                  }}
                >
                  EN
                </Button>
              </Button.Group>
            </div>
            
            {/* Her iki dil için de form item'ları, sadece biri görünür */}
            <Form.Item
              name="name_tr"
              style={{ marginBottom: 0, display: nameLanguage === 'tr' ? 'block' : 'none' }}
            >
              <Input 
                placeholder="Türkçe ürün adı" 
                autoComplete="off"
              />
            </Form.Item>
            
            <Form.Item
              name="name_en"
              style={{ marginBottom: 0, display: nameLanguage === 'en' ? 'block' : 'none' }}
            >
              <Input 
                placeholder="İngilizce ürün adı" 
                autoComplete="off"
              />
            </Form.Item>
          </Form.Item>

          <Form.Item
            label="Açıklama"
          >
            <div style={{ marginBottom: 8 }}>
              <Button.Group>
                <Button 
                  type={descriptionLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setDescriptionLanguage('tr')}
                  style={{ 
                    backgroundColor: descriptionLanguage === 'tr' ? '#1890ff' : '#f0f0f0',
                    color: descriptionLanguage === 'tr' ? 'white' : '#000'
                  }}
                >
                  TR
                </Button>
                <Button 
                  type={descriptionLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setDescriptionLanguage('en')}
                  style={{ 
                    backgroundColor: descriptionLanguage === 'en' ? '#52c41a' : '#f0f0f0',
                    color: descriptionLanguage === 'en' ? 'white' : '#000'
                  }}
                >
                  EN
                </Button>
              </Button.Group>
            </div>
            
            {/* Her iki dil için de form item'ları, sadece biri görünür */}
            <Form.Item
              name="description_tr"
              style={{ marginBottom: 0, display: descriptionLanguage === 'tr' ? 'block' : 'none' }}
            >
              <Input.TextArea 
                rows={2} 
                placeholder="Türkçe açıklama (opsiyonel)" 
                autoComplete="off"
              />
            </Form.Item>
            
            <Form.Item
              name="description_en"
              style={{ marginBottom: 0, display: descriptionLanguage === 'en' ? 'block' : 'none' }}
            >
              <Input.TextArea 
                rows={2} 
                placeholder="İngilizce açıklama (opsiyonel)" 
                autoComplete="off"
              />
            </Form.Item>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Fiyat"
                rules={[{ required: true, message: 'Fiyat gereklidir!' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  precision={2}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="Stok"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  step={1}
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="unit"
            label="Birim"
          >
            <Select placeholder="Birim seçin">
              <Option value="adet">Adet</Option>
              <Option value="kg">Kilogram</Option>
              <Option value="m">Metre</Option>
              <Option value="m2">Metrekare</Option>
              <Option value="m3">Metreküp</Option>
              <Option value="lt">Litre</Option>
              <Option value="paket">Paket</Option>
              <Option value="kutu">Kutu</Option>
              <Option value="takım">Takım</Option>
              <Option value="çift">Çift</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingProduct(null);
                editForm.resetFields();
              }}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                Güncelle
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AllProducts;
