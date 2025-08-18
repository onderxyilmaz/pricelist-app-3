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
      const response = await axios.get(`http://localhost:3001/api/pricelists/${id}`);
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
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      (item.product_id && item.product_id.toLowerCase().includes(value.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredItems(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      product_id: item.product_id,
      name: item.name,
      description: item.description,
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
        const response = await axios.put(`http://localhost:3001/api/items/${editingItem.id}`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün güncellendi');
          fetchPricelistDetail();
        }
      } else {
        // Yeni ekleme
        const response = await axios.post(`http://localhost:3001/api/pricelists/${id}/items`, values);
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
      const response = await axios.delete(`http://localhost:3001/api/items/${itemId}`);
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
          axios.delete(`http://localhost:3001/api/items/${itemId}`)
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
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name, 'tr'),
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
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
          <Search
            placeholder="Ürün ara... (ID, İsim, Açıklama)"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
          />
          
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
        onCancel={() => setModalVisible(false)}
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
            name="name"
            label="Ürün Adı"
            rules={[{ required: true, message: 'Ürün adı gereklidir!' }]}
          >
            <Input 
              placeholder="Ürün adını girin" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Ürün açıklaması (opsiyonel)" 
              autoComplete="off"
            />
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