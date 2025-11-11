import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';

import PricelistHeader from './components/PricelistHeader';
import PricelistSearch from './components/PricelistSearch';
import PricelistTable from './components/PricelistTable';
import PricelistModal from './components/PricelistModal';
import NotificationService from '../../utils/notification';
import { pricelistApi } from '../../utils/api';
import styles from './Pricelist.module.css';

const Pricelist = () => {
  const [pricelists, setPricelists] = useState([]);
  const [filteredPricelists, setFilteredPricelists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPricelist, setEditingPricelist] = useState(null);
  const [form] = Form.useForm();

  // Random renkler için - mevcut renkleri hariç tut
  const getRandomColor = () => {
    const allColors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
      '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#096dd9',
      '#ff4d4f', '#ffc53d', '#73d13d', '#40a9ff', '#9254de',
      '#36cfc9', '#ff85c0', '#ffa940', '#bae637', '#597ef7'
    ];
    
    // Mevcut fiyat listelerinin renklerini al
    const usedColors = pricelists.map(p => p.color?.toLowerCase());
    
    // Kullanılmamış renkleri filtrele
    const availableColors = allColors.filter(
      color => !usedColors.includes(color.toLowerCase())
    );
    
    // Eğer tüm renkler kullanılmışsa, tüm renklerden seç
    const colorPool = availableColors.length > 0 ? availableColors : allColors;
    
    return colorPool[Math.floor(Math.random() * colorPool.length)];
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
      const response = await pricelistApi.getPricelists();
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
    // Modal açıldıktan sonra random renk seç (mevcut listeler yüklendikten sonra)
    const randomColor = getRandomColor();
    form.setFieldsValue({ 
      currency: 'EUR',
      color: randomColor 
    });
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
        const response = await pricelistApi.updatePricelist(editingPricelist.id, submissionData);
        console.log('Update response:', response.data); // Debug log
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Fiyat listesi güncellendi');
          fetchPricelists();
        }
      } else {
        // Yeni oluşturma
        const response = await pricelistApi.createPricelist(submissionData);
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
      const response = await pricelistApi.deletePricelist(id);
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
      />
    </div>
  );
};

export default Pricelist;