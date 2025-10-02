import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import axios from 'axios';

import CompanyHeader from './components/CompanyHeader';
import CompanySearch from './components/CompanySearch';
import CompanyTable from './components/CompanyTable';
import CompanyModal from './components/CompanyModal';
import NotificationService from '../../utils/notification';
import styles from './Companies.module.css';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - Firmalar';
    fetchCompanies();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/companies');
      if (response.data.success) {
        setCompanies(response.data.companies);
        setFilteredCompanies(response.data.companies);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Firmalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCompanies(filtered);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    form.setFieldsValue({
      name: company.name
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCompany) {
        // Güncelleme
        const response = await axios.put(`http://localhost:3001/api/companies/${editingCompany.id}`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Firma güncellendi');
          fetchCompanies();
        } else {
          NotificationService.error('Hata', response.data.message || 'Güncelleme başarısız');
        }
      } else {
        // Yeni oluşturma
        const response = await axios.post('http://localhost:3001/api/companies', values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Firma oluşturuldu');
          fetchCompanies();
        } else {
          NotificationService.error('Hata', response.data.message || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || (editingCompany ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/companies/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Firma silindi');
        fetchCompanies();
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
    setEditingCompany(null);
  };

  return (
    <div className={styles.container}>
      <CompanyHeader onCreateClick={handleCreate} />

      <Card className={styles.mainCard}>
        <CompanySearch onSearch={handleSearch} />
        
        <CompanyTable
          companies={filteredCompanies}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <CompanyModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleSubmit}
        editingCompany={editingCompany}
        form={form}
      />
    </div>
  );
};

export default Companies;