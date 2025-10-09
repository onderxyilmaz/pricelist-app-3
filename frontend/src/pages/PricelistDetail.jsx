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
  Select,
  InputNumber,
  Breadcrumb,
  Statistic,
  Row,
  Col,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  ProductOutlined,
  DollarOutlined,
  StockOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationService from '../utils/notification';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const PricelistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pricelist, setPricelist] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [nameLanguage, setNameLanguage] = useState('en');
  const [descriptionLanguage, setDescriptionLanguage] = useState('en');
  const [tableLanguage, setTableLanguage] = useState('en'); // Tablo görünümü için dil seçimi
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - Pricelist Detail';
    fetchPricelistDetail();
  }, [id]);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchPricelistDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/pricelists/${id}`);
      if (response.data.success) {
        setPricelist(response.data.data);
        setItems(response.data.data.items || []);
        setFilteredItems(response.data.data.items || []);
      } else {
        NotificationService.error('Hata', 'Fiyat listesi bulunamadı');
        navigate('/pricelists');
      }
    } catch (error) {
      NotificationService.error('Hata', 'Fiyat listesi yüklenirken hata oluştu');
      navigate('/pricelists');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = items.filter(item => 
      (item.name_tr && item.name_tr.toLowerCase().includes(value.toLowerCase())) ||
      (item.name_en && item.name_en.toLowerCase().includes(value.toLowerCase())) ||
      (item.product_id && item.product_id.toLowerCase().includes(value.toLowerCase())) ||
      (item.description_tr && item.description_tr.toLowerCase().includes(value.toLowerCase())) ||
      (item.description_en && item.description_en.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredItems(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setNameLanguage('tr');
    setDescriptionLanguage('tr');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    // Mevcut verilere göre dil seçimini ayarla
    setNameLanguage(item.name_tr ? 'tr' : 'en');
    setDescriptionLanguage(item.description_tr ? 'tr' : 'en');
    form.setFieldsValue({
      product_id: item.product_id,
      name_tr: item.name_tr,
      name_en: item.name_en,
      description_tr: item.description_tr,
      description_en: item.description_en,
      price: item.price,
      stock: item.stock,
      unit: item.unit
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        // Güncelleme
        const response = await axios.put(`http://localhost:3000/api/items/${editingItem.id}`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün güncellendi');
          fetchPricelistDetail();
        }
      } else {
        // Yeni ekleme
        const response = await axios.post(`http://localhost:3000/api/pricelists/${id}/items`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün eklendi');
          fetchPricelistDetail();
        }
      }
      setModalVisible(false);
    } catch (error) {
      NotificationService.error('Hata', editingItem ? 'Güncelleme başarısız' : 'Ekleme başarısız');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/items/${itemId}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Ürün silindi');
        fetchPricelistDetail();
      }
    } catch (error) {
      NotificationService.error('Hata', 'Silme işlemi başarısız');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      NotificationService.warning('Uyarı', 'Lütfen silmek istediğiniz ürünleri seçin');
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map(itemId => 
          axios.delete(`http://localhost:3000/api/items/${itemId}`)
        )
      );
      NotificationService.success('Başarılı', `${selectedRowKeys.length} ürün silindi`);
      setSelectedRowKeys([]);
      fetchPricelistDetail();
    } catch (error) {
      NotificationService.error('Hata', 'Toplu silme işlemi başarısız');
    }
  };

  const handleSelectAll = () => {
    setSelectedRowKeys(filteredItems.map(item => item.id));
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
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

  const calculateStats = () => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * (item.stock || 1)), 0);
    const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0);
    
    const priceSum = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
    
    const avgPrice = totalItems > 0 ? priceSum / totalItems : 0;
    
    return { totalItems, totalValue, totalStock, avgPrice };
  };

  const columns = [
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 140, // 20px arttırıldı
      sorter: (a, b) => (a.product_id || '').localeCompare(b.product_id || ''),
      render: (text) => <Text code>{text || 'N/A'}</Text>,
    },
    {
      title: 'Ürün Adı',
      key: 'name',
      sorter: (a, b) => {
        const nameA = (tableLanguage === 'tr' ? a.name_tr : a.name_en) || a.name_tr || a.name_en || '';
        const nameB = (tableLanguage === 'tr' ? b.name_tr : b.name_en) || b.name_tr || b.name_en || '';
        return nameA.localeCompare(nameB, 'tr');
      },
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
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 80, // 10px arttırıldı (70 -> 80)
      align: 'center',
      sorter: (a, b) => (a.stock || 0) - (b.stock || 0),
      render: (stock) => (
        <Tag color={stock > 0 ? (stock > 10 ? 'green' : 'orange') : 'red'}>
          {stock || 0}
        </Tag>
      ),
    },
    {
      title: 'Birim',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
      render: (unit) => {
        const displayUnit = unit || 'adet';
        // İlk harfi büyük yap
        const formattedUnit = displayUnit.charAt(0).toUpperCase() + displayUnit.slice(1);
        return <Tag>{formattedUnit}</Tag>;
      },
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.price - b.price,
      render: (price) => (
        <Text strong>
          {getCurrencySymbol(pricelist?.currency)} {price?.toLocaleString('tr-TR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </Text>
      ),
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
            title="Ürünü silmek istediğinizden emin misiniz?"
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

  const stats = calculateStats();

  if (!pricelist) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/pricelists')}
            style={{ padding: 0 }}
          >
            Fiyat Listeleri
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{pricelist.name}</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <div 
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: pricelist.color,
                marginRight: '12px'
              }}
            />
            {pricelist.name}
          </Title>
          {pricelist.description && (
            <Text type="secondary">{pricelist.description}</Text>
          )}
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Yeni Ürün
        </Button>
      </div>

      {/* İstatistikler */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Toplam Ürün"
              value={stats.totalItems}
              prefix={<ProductOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Toplam Değer"
              value={stats.totalValue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={pricelist.currency || 'TL'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Toplam Stok"
              value={stats.totalStock}
              prefix={<StockOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ortalama Fiyat"
              value={stats.avgPrice}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={pricelist.currency || 'TL'}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Search
              placeholder="Ürün ara... (ID, İsim, Açıklama)"
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 400 }}
              prefix={<SearchOutlined />}
              autoFocus
            />
            
            {/* Tablo Dil Seçicisi */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong>Görünüm:</Text>
              <Button.Group>
                <Button 
                  type={tableLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setTableLanguage('en')}
                  style={{ 
                    backgroundColor: tableLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                    color: tableLanguage === 'en' ? 'white' : '#000'
                  }}
                >
                  EN
                </Button>
                <Button 
                  type={tableLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setTableLanguage('tr')}
                  style={{ 
                    backgroundColor: tableLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                    color: tableLanguage === 'tr' ? 'white' : '#000'
                  }}
                >
                  TR
                </Button>
              </Button.Group>
            </div>
          </div>
          
          <Space>
            <Button 
              onClick={handleSelectAll}
              disabled={filteredItems.length === 0}
            >
              Tümünü Seç
            </Button>
            <Button 
              onClick={handleClearSelection}
              disabled={selectedRowKeys.length === 0}
            >
              Seçimi Kaldır
            </Button>
            <Popconfirm
              title={`Seçili ${selectedRowKeys.length} ürünü silmek istediğinizden emin misiniz?`}
              onConfirm={handleBulkDelete}
              okText="Evet"
              cancelText="Hayır"
              disabled={selectedRowKeys.length === 0}
            >
              <Button 
                danger
                disabled={selectedRowKeys.length === 0}
              >
                Seçili Ürünleri Sil ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ürün`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingItem(null);
          setNameLanguage('tr');
          setDescriptionLanguage('tr');
          form.resetFields();
        }}
        footer={null}
        width={600}
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => {
              const productIdInput = document.querySelector('input[placeholder="Ürün ID"]');
              if (productIdInput) productIdInput.focus();
            }, 100);
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{ unit: 'adet' }}
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
                  type={nameLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setNameLanguage('en')}
                  style={{ 
                    backgroundColor: nameLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                    color: nameLanguage === 'en' ? 'white' : '#000'
                  }}
                >
                  EN
                </Button>
                <Button 
                  type={nameLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setNameLanguage('tr')}
                  style={{ 
                    backgroundColor: nameLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                    color: nameLanguage === 'tr' ? 'white' : '#000'
                  }}
                >
                  TR
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
                  type={descriptionLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setDescriptionLanguage('en')}
                  style={{ 
                    backgroundColor: descriptionLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                    color: descriptionLanguage === 'en' ? 'white' : '#000'
                  }}
                >
                  EN
                </Button>
                <Button 
                  type={descriptionLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setDescriptionLanguage('tr')}
                  style={{ 
                    backgroundColor: descriptionLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                    color: descriptionLanguage === 'tr' ? 'white' : '#000'
                  }}
                >
                  TR
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
              <Button onClick={() => setModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Güncelle' : 'Ekle'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PricelistDetail;
