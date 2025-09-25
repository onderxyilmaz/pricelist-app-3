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
  message
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
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    document.title = 'Price List App v3 - User Management';
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = users.filter(user => 
      user.first_name.toLowerCase().includes(value.toLowerCase()) ||
      user.last_name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        // Güncelleme - şifre alanları hariç
        const updateData = {
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role
        };
        
        const response = await axios.put(`http://localhost:3001/api/admin/users/${editingUser.id}`, updateData);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Kullanıcı güncellendi');
          fetchUsers();
        }
      } else {
        // Yeni oluşturma
        const response = await axios.post('http://localhost:3001/api/admin/users', values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Kullanıcı oluşturuldu');
          fetchUsers();
        } else {
          NotificationService.error('Hata', response.data.message || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || (editingUser ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/admin/users/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Kullanıcı silindi');
        fetchUsers();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Silme işlemi başarısız';
      NotificationService.error('Hata', errorMessage);
    }
  };



  const canEditUser = (user) => {
    return currentUser?.id !== user.id;
  };

  const canDeleteUser = (user) => {
    return currentUser?.id !== user.id;
  };

  const columns = [
    {
      title: 'Ad',
      dataIndex: 'first_name',
      key: 'first_name',
      sorter: (a, b) => a.first_name.localeCompare(b.first_name, 'tr'),
    },
    {
      title: 'Soyad',
      dataIndex: 'last_name',
      key: 'last_name',
      sorter: (a, b) => a.last_name.localeCompare(b.last_name, 'tr'),
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email, 'tr'),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => (
        <Tag color={role === 'super_admin' ? 'red' : 'blue'}>
          {role === 'super_admin' ? 'Süper Admin' : 'Kullanıcı'}
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
            disabled={!canEditUser(record)}
            title={canEditUser(record) ? "Düzenle" : "Kendi kullanıcınızı düzenleyemezsiniz"}
          />
          <Popconfirm
            title="Kullanıcıyı silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
            disabled={!canDeleteUser(record)}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              disabled={!canDeleteUser(record)}
              title={canDeleteUser(record) ? "Sil" : "Kendi kullanıcınızı silemezsiniz"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Kullanıcı Yönetimi</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Yeni Kullanıcı
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="Kullanıcı ara..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            autoFocus
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
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
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => {
              const firstInput = document.querySelector('input[placeholder="Adınızı girin"]');
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
            name="first_name"
            label="Ad"
            rules={[{ required: true, message: 'Ad gereklidir!' }]}
          >
            <Input 
              placeholder="Adınızı girin" 
              autoComplete="off"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="last_name"
            label="Soyad"
            rules={[{ required: true, message: 'Soyad gereklidir!' }]}
          >
            <Input 
              placeholder="Soyadınızı girin" 
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'E-mail gereklidir!' },
              { type: 'email', message: 'Geçerli bir e-mail adresi girin!' }
            ]}
          >
            <Input 
              placeholder="E-mail adresinizi girin" 
              autoComplete="off"
              disabled={editingUser !== null}
            />
          </Form.Item>

          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label="Şifre"
                rules={[{ required: true, message: 'Şifre gereklidir!' }]}
              >
                <Input.Password 
                  placeholder="Şifrenizi girin" 
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Şifre Tekrar"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Şifre tekrarı gereklidir!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  placeholder="Şifrenizi tekrar girin" 
                  autoComplete="off"
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Rol seçimi gereklidir!' }]}
            initialValue="user"
          >
            <Select 
              placeholder="Rol seçin"
              disabled={editingUser && !canEditUser(editingUser)}
            >
              <Option value="user">Kullanıcı</Option>
              <Option value="super_admin">Süper Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Güncelle' : 'Oluştur'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;