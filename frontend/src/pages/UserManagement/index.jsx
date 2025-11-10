import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import NotificationService from '../../utils/notification';
import UserManagementHeader from './components/UserManagementHeader';
import UserSearch from './components/UserSearch';
import UserTable from './components/UserTable';
import UserModal from './components/UserModal';
import styles from './UserManagement.module.css';

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
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`);
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
        
        const response = await axios.put(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, updateData);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Kullanıcı güncellendi');
          fetchUsers();
        }
      } else {
        // Yeni oluşturma
        const response = await axios.post(`${API_BASE_URL}/api/admin/users`, values);
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
      const response = await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Kullanıcı silindi');
        fetchUsers();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Silme işlemi başarısız';
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  return (
    <div className={styles.container}>
      <UserManagementHeader onCreateUser={handleCreate} />

      <Card className={styles.card}>
        <UserSearch onSearch={handleSearch} />
        <UserTable
          users={filteredUsers}
          loading={loading}
          currentUser={currentUser}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <UserModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleSubmit}
        editingUser={editingUser}
        form={form}
        currentUser={currentUser}
      />
    </div>
  );
};

export default UserManagement;