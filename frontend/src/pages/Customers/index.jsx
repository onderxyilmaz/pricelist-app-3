import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import axios from 'axios';

import CustomerHeader from './components/CustomerHeader';
import CustomerSearch from './components/CustomerSearch';
import CustomerTable from './components/CustomerTable';
import CustomerModal from './components/CustomerModal';
import NotificationService from '../../utils/notification';
import styles from './Customers.module.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - Müşteriler';
    fetchCustomers();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/customers');
      if (response.data.success) {
        setCustomers(response.data.customers);
        setFilteredCustomers(response.data.customers);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Müşteriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      name: customer.name
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCustomer) {
        // Güncelleme
        const response = await axios.put(`http://localhost:3001/api/customers/${editingCustomer.id}`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Müşteri güncellendi');
          fetchCustomers();
        } else {
          NotificationService.error('Hata', response.data.message || 'Güncelleme başarısız');
        }
      } else {
        // Yeni oluşturma
        const response = await axios.post('http://localhost:3001/api/customers', values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Müşteri oluşturuldu');
          fetchCustomers();
        } else {
          NotificationService.error('Hata', response.data.message || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || (editingCustomer ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/customers/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Müşteri silindi');
        fetchCustomers();
      } else {
        NotificationService.error('Hata', response.data.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Silme işlemi başarısız';
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingCustomer(null);
  };

  return (
    <div className={styles.container}>
      <CustomerHeader onCreateClick={handleCreate} />

      <Card className={styles.mainCard}>
        <CustomerSearch onSearch={handleSearch} />
        
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <CustomerModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleSubmit}
        editingCustomer={editingCustomer}
        form={form}
      />
    </div>
  );
};

export default Customers;