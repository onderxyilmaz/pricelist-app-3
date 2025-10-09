import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import axios from 'axios';

import CompanyHeader from './components/CompanyHeader';
import CompanySearch from './components/CompanySearch';
import CompanyTable from './components/CompanyTable';
import CompanyModal from './components/CompanyModal';
import { showErrorNotification, showSuccessNotification } from '../../utils/notification';
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
      const response = await axios.get('/api/companies');
      if (response.data && Array.isArray(response.data)) {
        setCompanies(response.data);
        setFilteredCompanies(response.data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      showErrorNotification('Hata', 'Firmalar yüklenirken hata oluştu');
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
        const response = await fetch(`/api/companies/${editingCompany.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          showSuccessNotification('Başarılı', 'Firma güncellendi');
          fetchCompanies();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Güncelleme başarısız');
        }
      } else {
        // Yeni oluşturma
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          showSuccessNotification('Başarılı', 'Firma oluşturuldu');
          fetchCompanies();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Oluşturma başarısız');
        }
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving company:', error);
      showErrorNotification('Hata', error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccessNotification('Başarılı', 'Firma silindi');
        fetchCompanies();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      showErrorNotification('Hata', error.message);
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