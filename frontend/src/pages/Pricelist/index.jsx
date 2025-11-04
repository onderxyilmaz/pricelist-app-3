import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import axios from 'axios';
import { API_BASE_URL } from '../../config/env';

import PricelistHeader from './components/PricelistHeader';
import PricelistSearch from './components/PricelistSearch';
import PricelistTable from './components/PricelistTable';
import PricelistModal from './components/PricelistModal';
import NotificationService from '../../utils/notification';
import styles from './Pricelist.module.css';

const Pricelist = () => {
  const [pricelists, setPricelists] = useState([]);
  const [filteredPricelists, setFilteredPricelists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPricelist, setEditingPricelist] = useState(null);
  const [form] = Form.useForm();

  // Akıllı renk seçimi için renk paleti
  const PREDEFINED_COLORS = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#096dd9',
    '#2f54eb', '#73d13d', '#ffc53d', '#ff4d4f', '#9254de',
    '#36cfc9', '#f759ab', '#ff7a45', '#bae637', '#1677ff',
    '#389e0d', '#d48806', '#cf1322', '#531dab', '#08979c',
    '#c41d7f', '#d4380d', '#7cb305', '#0050b3', '#006d75'
  ];

  // Akıllı renk seçimi - mevcut renkleri kontrol eder
  const getSmartColor = () => {
    if (pricelists.length === 0) {
      // Eğer hiç pricelist yoksa, ilk rengi döndür
      return PREDEFINED_COLORS[0];
    }

    // Mevcut kullanılan renkleri al
    const usedColors = pricelists.map(pricelist => pricelist.color?.toLowerCase());
    
    // Kullanılmamış renkleri bul
    const availableColors = PREDEFINED_COLORS.filter(color => 
      !usedColors.includes(color.toLowerCase())
    );

    if (availableColors.length > 0) {
      // Kullanılmamış renklerden birini seç
      return availableColors[0];
    } else {
      // Tüm renkler kullanılmışsa, rastgele bir renk döndür
      return PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
    }
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
      const response = await axios.get(`${API_BASE_URL}/api/pricelists`);
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
    form.setFieldsValue({ color: getSmartColor() });
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
    let colorValue = typeof values.color === 'object' 
      ? values.color.toHex() // Alpha olmadan sadece HEX (#RRGGBB)
      : values.color;
    // Renk kodunun başında '#' yoksa ekle
    if (typeof colorValue === 'string' && !colorValue.startsWith('#')) {
      colorValue = `#${colorValue}`;
    }
    const submissionData = {
      ...values,
      color: colorValue
    };
    
    console.log('Submission data:', submissionData); // Debug log
    
    try {
      if (editingPricelist) {
        // Güncelleme
        const response = await axios.put(`${API_BASE_URL}/api/pricelists/${editingPricelist.id}`, submissionData);
        console.log('Update response:', response.data); // Debug log
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Fiyat listesi güncellendi');
          fetchPricelists();
        }
      } else {
        // Yeni oluşturma
        const response = await axios.post(`${API_BASE_URL}/api/pricelists`, submissionData);
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
      const response = await axios.delete(`${API_BASE_URL}/api/pricelists/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Fiyat listesi silindi');
        fetchPricelists();
      }
    } catch (error) {
      NotificationService.error('Hata', 'Silme işlemi başarısız');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingPricelist(null);
  };

  return (
    <div className={styles.container}>
      <PricelistHeader onCreateClick={handleCreate} />

      <Card className={styles.mainCard}>
        <PricelistSearch onSearch={handleSearch} />
        
        <PricelistTable
          pricelists={filteredPricelists}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <PricelistModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleSubmit}
        editingPricelist={editingPricelist}
        form={form}
        getSmartColor={getSmartColor}
        predefinedColors={PREDEFINED_COLORS}
      />
    </div>
  );
};

export default Pricelist;
