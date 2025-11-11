import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';

import CompanyHeader from './components/CompanyHeader';
import CompanySearch from './components/CompanySearch';
import CompanyTable from './components/CompanyTable';
import CompanyModal from './components/CompanyModal';
import NotificationService from '../../utils/notification';
import { companyApi } from '../../utils/api';
import styles from './Companies.module.css';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - Companies';
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
      const response = await companyApi.getCompanies();
      if (response.data && Array.isArray(response.data)) {
        setCompanies(response.data);
        setFilteredCompanies(response.data);
      } else if (response.data.success && Array.isArray(response.data.companies)) {
        setCompanies(response.data.companies);
        setFilteredCompanies(response.data.companies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      NotificationService.error('Hata', 'Firmalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = companies.filter(company => 
      company.company_name.toLowerCase().includes(value.toLowerCase())
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
      company_name: company.company_name
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCompany) {
        // Güncelleme
        const response = await companyApi.updateCompany(editingCompany.id, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Firma güncellendi');
          fetchCompanies();
        } else {
          NotificationService.error('Hata', response.data.message || 'Güncelleme başarısız');
        }
      } else {
        // Yeni oluşturma
        const response = await companyApi.createCompany(values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Firma oluşturuldu');
          fetchCompanies();
        } else {
          NotificationService.error('Hata', response.data.message || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving company:', error);
      const errorMessage = error.response?.data?.message || error.message || (editingCompany ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
      NotificationService.error('Hata', errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await companyApi.deleteCompany(id);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Firma silindi');
        fetchCompanies();
      } else {
        NotificationService.error('Hata', response.data.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Silme işlemi başarısız';
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