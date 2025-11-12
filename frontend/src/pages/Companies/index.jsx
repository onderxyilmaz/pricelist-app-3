import React, { useState, useEffect } from 'react';
import { Card } from 'antd';

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
    setModalVisible(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      let response;
      if (editingCompany) {
        // Güncelleme
        response = await companyApi.updateCompany(editingCompany.id, values);
        if (response.data && response.data.id) {
          return response.data; // Return company data for logo upload
        } else {
          NotificationService.error('Hata', response.data?.error || response.data?.message || 'Güncelleme başarısız');
          throw new Error(response.data?.error || response.data?.message || 'Güncelleme başarısız');
        }
      } else {
        // Yeni oluşturma
        response = await companyApi.createCompany(values);
        if (response.data && response.data.id) {
          return response.data; // Return company data for logo upload
        } else {
          NotificationService.error('Hata', response.data?.error || response.data?.message || 'Oluşturma başarısız');
          throw new Error(response.data?.error || response.data?.message || 'Oluşturma başarısız');
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || (editingCompany ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
      NotificationService.error('Hata', errorMessage);
      throw error; // Re-throw for modal to handle
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await companyApi.deleteCompany(id);
      if (response.status === 200 || response.data?.message) {
        NotificationService.success('Başarılı', 'Firma silindi');
        fetchCompanies();
      } else {
        NotificationService.error('Hata', response.data?.error || response.data?.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Silme işlemi başarısız';
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
        onSubmit={async (values) => {
          try {
            const companyData = await handleSubmit(values);
            return companyData;
          } catch (error) {
            // Error already handled in handleSubmit
            throw error;
          }
        }}
        editingCompany={editingCompany}
        onComplete={() => {
          // Refresh list after all operations (including logo) are complete
          fetchCompanies();
          setModalVisible(false);
        }}
      />
    </div>
  );
};

export default Companies;