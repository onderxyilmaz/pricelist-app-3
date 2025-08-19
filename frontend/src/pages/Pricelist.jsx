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
  ColorPicker,
  Select,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationService from '../utils/notification';

const { Title } = Typography;
const { Search } = Input;

const Pricelist = () => {
  const [pricelists, setPricelists] = useState([]);
  const [filteredPricelists, setFilteredPricelists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPricelist, setEditingPricelist] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Random renkler için
  const getRandomColor = () => {
    const colors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
      '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#096dd9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    document.title = 'Price List App v3 - Price Lists';
    fetchPricelists();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchPricelists = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/pricelists');
      if (response.data.success) {
        setPricelists(response.data.pricelists);
        setFilteredPricelists(response.data.pricelists);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Fiyat listeleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = pricelists.filter(pricelist => 
      pricelist.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredPricelists(filtered);
  };

  const handleCreate = () => {
    setEditingPricelist(null);
    form.resetFields();
    form.setFieldsValue({ color: getRandomColor() });
    setModalVisible(true);
  };

  const handleEdit = (pricelist) => {
    setEditingPricelist(pricelist);
    form.setFieldsValue({
      name: pricelist.name,
      description: pricelist.description,
      currency: pricelist.currency,
      color: pricelist.color
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    console.log('Form values:', values); // Debug log
    
    // ColorPicker object değerini hex string'e çevir (alpha kanalı olmadan)
    const submissionData = {
      ...values,
      color: typeof values.color === 'object' 
        ? values.color.toHex() // Alpha olmadan sadece HEX (#RRGGBB)
        : values.color
    };
    
    console.log('Submission data:', submissionData); // Debug log
    
    try {
      if (editingPricelist) {
        // Güncelleme
        const response = await axios.put(`http://localhost:3001/api/pricelists/${editingPricelist.id}`, submissionData);
        console.log('Update response:', response.data); // Debug log
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Fiyat listesi güncellendi');
          fetchPricelists();
        }
      } else {
        // Yeni oluşturma
        const response = await axios.post('http://localhost:3001/api/pricelists', submissionData);
        console.log('Create response:', response.data); // Debug log
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Fiyat listesi oluşturuldu');
          fetchPricelists();
        } else {
          console.error('Create failed:', response.data.message);
          NotificationService.error('Hata', response.data.message || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Submit error:', error); // Debug log
      NotificationService.error('Hata', editingPricelist ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/pricelists/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Fiyat listesi silindi');
        fetchPricelists();
      }
    } catch (error) {
      NotificationService.error('Hata', 'Silme işlemi başarısız');
    }
  };

  const getDeleteConfirmText = (record) => {
    if (record.item_count > 0) {
      return (
        <div>
          <div>Fiyat listesini silmek istediğinizden emin misiniz?</div>
          <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '8px' }}>
            Listedeki {record.item_count} adet ürünler de silinecek!
          </div>
        </div>
      );
    }
    return 'Fiyat listesini silmek istediğinizden emin misiniz?';
  };

  const columns = [
    {
      title: 'Renk',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color) => (
        <div 
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: color,
            border: '1px solid #d9d9d9'
          }}
        />
      ),
    },
    {
      title: 'İsim',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name, 'tr'),
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/pricelists/${record.id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
      width: 120,
      render: (currency) => <Tag>{currency}</Tag>,
    },
    {
      title: 'Ürün Sayısı',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.item_count - b.item_count,
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count} ürün
        </Tag>
      ),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
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
            title={getDeleteConfirmText(record)}
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
        <Title level={2} style={{ margin: 0 }}>Fiyat Listeleri</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Yeni Fiyat Listesi
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="Fiyat listesi ara..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredPricelists}
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
        title={editingPricelist ? 'Fiyat Listesi Düzenle' : 'Yeni Fiyat Listesi'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        afterOpenChange={(open) => {
          if (open) {
            // Modal açıldıktan sonra ilk alana focus
            setTimeout(() => {
              const nameInput = document.querySelector('input[placeholder="Fiyat listesi adını girin"]');
              if (nameInput) nameInput.focus();
            }, 100);
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ currency: 'EUR', color: getRandomColor() }}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Fiyat Listesi Adı"
            rules={[{ required: true, message: 'Fiyat listesi adı gereklidir!' }]}
          >
            <Input 
              placeholder="Fiyat listesi adını girin" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Açıklama (opsiyonel)" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Para Birimi"
            rules={[{ required: true, message: 'Para birimi gereklidir!' }]}
          >
            <Select placeholder="Para birimi seçin">
              <Select.Option value="EUR">EUR - Euro</Select.Option>
              <Select.Option value="USD">USD - Amerikan Doları</Select.Option>
              <Select.Option value="TRY">TRY - Türk Lirası</Select.Option>
              <Select.Option value="GBP">GBP - İngiliz Sterlini</Select.Option>
              <Select.Option value="JPY">JPY - Japon Yeni</Select.Option>
              <Select.Option value="CHF">CHF - İsviçre Frangı</Select.Option>
              <Select.Option value="CAD">CAD - Kanada Doları</Select.Option>
              <Select.Option value="AUD">AUD - Avustralya Doları</Select.Option>
              <Select.Option value="SEK">SEK - İsveç Kronu</Select.Option>
              <Select.Option value="NOK">NOK - Norveç Kronu</Select.Option>
              <Select.Option value="DKK">DKK - Danimarka Kronu</Select.Option>
              <Select.Option value="PLN">PLN - Polonya Zlotisi</Select.Option>
              <Select.Option value="CZK">CZK - Çek Kronu</Select.Option>
              <Select.Option value="HUF">HUF - Macar Forinti</Select.Option>
              <Select.Option value="RUB">RUB - Rus Rublesi</Select.Option>
              <Select.Option value="CNY">CNY - Çin Yuanı</Select.Option>
              <Select.Option value="KRW">KRW - Güney Kore Wonu</Select.Option>
              <Select.Option value="INR">INR - Hindistan Rupisi</Select.Option>
              <Select.Option value="BRL">BRL - Brezilya Reali</Select.Option>
              <Select.Option value="MXN">MXN - Meksika Pesosu</Select.Option>
              <Select.Option value="ZAR">ZAR - Güney Afrika Randı</Select.Option>
              <Select.Option value="SAR">SAR - Suudi Arabistan Riyali</Select.Option>
              <Select.Option value="AED">AED - BAE Dirhemi</Select.Option>
              <Select.Option value="QAR">QAR - Katar Riyali</Select.Option>
              <Select.Option value="KWD">KWD - Kuveyt Dinarı</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="color"
            label="Renk"
            rules={[{ required: true, message: 'Renk seçimi gereklidir!' }]}
          >
            <ColorPicker showText format="hex" disabledAlpha />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPricelist ? 'Güncelle' : 'Oluştur'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Pricelist;