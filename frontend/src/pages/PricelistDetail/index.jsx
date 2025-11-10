import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import NotificationService from '../../utils/notification';
import PricelistDetailHeader from './components/PricelistDetailHeader';
import PricelistStats from './components/PricelistStats';
import ProductSearch from './components/ProductSearch';
import ProductTable from './components/ProductTable';
import ProductModal from './components/ProductModal';
import styles from './PricelistDetail.module.css';

const PricelistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pricelist, setPricelist] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [formLanguage, setFormLanguage] = useState('en');
  const [tableLanguage, setTableLanguage] = useState('en');
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - Pricelist Detail';
    fetchPricelistDetail();
  }, [id]);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchPricelistDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pricelists/${id}`);
      if (response.data.success) {
        setPricelist(response.data.data);
        setItems(response.data.data.items || []);
        setFilteredItems(response.data.data.items || []);
      } else {
        NotificationService.error('Hata', 'Fiyat listesi bulunamadı');
        navigate('/pricelists');
      }
    } catch (error) {
      NotificationService.error('Hata', 'Fiyat listesi yüklenirken hata oluştu');
      navigate('/pricelists');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const filtered = items.filter(item => 
      (item.name_tr && item.name_tr.toLowerCase().includes(value.toLowerCase())) ||
      (item.name_en && item.name_en.toLowerCase().includes(value.toLowerCase())) ||
      (item.product_id && item.product_id.toLowerCase().includes(value.toLowerCase())) ||
      (item.description_tr && item.description_tr.toLowerCase().includes(value.toLowerCase())) ||
      (item.description_en && item.description_en.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredItems(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormLanguage('en');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormLanguage('en');
    form.setFieldsValue({
      product_id: item.product_id,
      name_tr: item.name_tr,
      name_en: item.name_en,
      description_tr: item.description_tr,
      description_en: item.description_en,
      price: item.price,
      stock: item.stock,
      unit: item.unit
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        const response = await axios.put(`${API_BASE_URL}/api/items/${editingItem.id}`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün güncellendi');
          fetchPricelistDetail();
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/pricelists/${id}/items`, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün eklendi');
          fetchPricelistDetail();
        }
      }
      setModalVisible(false);
    } catch (error) {
      NotificationService.error('Hata', editingItem ? 'Güncelleme başarısız' : 'Ekleme başarısız');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/items/${itemId}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Ürün silindi');
        fetchPricelistDetail();
      }
    } catch (error) {
      NotificationService.error('Hata', 'Silme işlemi başarısız');
    }
  };

  const handleSelectAll = () => {
    const allKeys = filteredItems.map(item => item.id);
    setSelectedRowKeys(allKeys);
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedRowKeys.map(id => 
        axios.delete(`${API_BASE_URL}/api/items/${id}`)
      );
      
      await Promise.all(deletePromises);
      NotificationService.success('Başarılı', `${selectedRowKeys.length} ürün silindi`);
      setSelectedRowKeys([]);
      fetchPricelistDetail();
    } catch (error) {
      NotificationService.error('Hata', 'Toplu silme işlemi başarısız');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingItem(null);
    setFormLanguage('en');
    form.resetFields();
  };

  return (
    <div className={styles.container}>
      <PricelistDetailHeader 
        pricelist={pricelist}
        onAddItem={handleCreate}
      />

      <PricelistStats 
        pricelist={pricelist}
        items={items}
      />

      <Card className={styles.card}>
        <ProductSearch
          onSearch={handleSearch}
          tableLanguage={tableLanguage}
          onLanguageChange={setTableLanguage}
          selectedRowKeys={selectedRowKeys}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkDelete={handleBulkDelete}
          totalItems={filteredItems.length}
        />

        <ProductTable
          items={filteredItems}
          loading={loading}
          tableLanguage={tableLanguage}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currency={pricelist?.currency}
        />
      </Card>

      <ProductModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        form={form}
        formLanguage={formLanguage}
        onLanguageChange={setFormLanguage}
      />
    </div>
  );
};

export default PricelistDetail;