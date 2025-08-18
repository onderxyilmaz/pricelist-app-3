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
  InputNumber
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

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleSearch = (value) => {
    const filtered = offers.filter(offer => 
      offer.offer_no.toLowerCase().includes(value.toLowerCase()) ||
      offer.company.toLowerCase().includes(value.toLowerCase()) ||
      (offer.created_by_name && offer.created_by_name.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredOffers(filtered);
  };

  const handleCreate = () => {
    setEditingOffer(null);
    form.resetFields();
    // Yeni teklif için varsayılan değerler
    form.setFieldsValue({
      revision_no: 0
    });
    setModalVisible(true);
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
        // Yeni oluşturma
        const createData = {
          ...values,
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
      sorter: (a, b) => a.company.localeCompare(b.company, 'tr'),
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
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        afterOpenChange={(open) => {
          if (open) {
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
            />
          </Form.Item>

          <Form.Item
            name="revision_no"
            label="Revizyon No"
            rules={[{ required: true, message: 'Revizyon No gereklidir!' }]}
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
            rules={[{ required: true, message: 'Firma gereklidir!' }]}
          >
            <Input 
              placeholder="Firma adını girin" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingOffer ? 'Güncelle' : 'Oluştur'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Offers;
