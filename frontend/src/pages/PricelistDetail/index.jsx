import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { pricelistApi } from '../../utils/api';
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
  const [groupBySections, setGroupBySections] = useState(true);
  const [form] = Form.useForm();

  const hasSectionData = (list) =>
    (list || []).some(
      (i) => i?.section_l1_tr || i?.section_l1_en || i?.section_l2_tr || i?.section_l2_en
    );

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
      const response = await pricelistApi.getPricelistById(id);
      if (response.data.success) {
        setPricelist(response.data.data);
        setItems(response.data.data.items || []);
        setFilteredItems(response.data.data.items || []);
      } else {
        NotificationService.error('Hata', 'Fiyat listesi bulunamadı');
        navigate('/pricelists');
      }
    } catch (error) {
      console.error('Error fetching pricelist detail:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Fiyat listesi yüklenirken hata oluştu');
      navigate('/pricelists');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const v = (value || '').toLowerCase();
    const filtered = items.filter(
      (item) =>
        (item.name_tr && item.name_tr.toLowerCase().includes(v)) ||
        (item.name_en && item.name_en.toLowerCase().includes(v)) ||
        (item.product_id && item.product_id.toLowerCase().includes(v)) ||
        (item.description_tr && item.description_tr.toLowerCase().includes(v)) ||
        (item.description_en && item.description_en.toLowerCase().includes(v)) ||
        (item.section_l1_tr && item.section_l1_tr.toLowerCase().includes(v)) ||
        (item.section_l1_en && item.section_l1_en.toLowerCase().includes(v)) ||
        (item.section_l2_tr && item.section_l2_tr.toLowerCase().includes(v)) ||
        (item.section_l2_en && item.section_l2_en.toLowerCase().includes(v))
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
        const response = await pricelistApi.updateItem(editingItem.id, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün güncellendi');
          fetchPricelistDetail();
        }
      } else {
        const response = await pricelistApi.addItem(id, values);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Ürün eklendi');
          fetchPricelistDetail();
        }
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving item:', error);
      NotificationService.error('Hata', error.response?.data?.message || (editingItem ? 'Güncelleme başarısız' : 'Ekleme başarısız'));
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await pricelistApi.deleteItem(itemId);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Ürün silindi');
        fetchPricelistDetail();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Silme işlemi başarısız');
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
        pricelistApi.deleteItem(id)
      );
      
      await Promise.all(deletePromises);
      NotificationService.success('Başarılı', `${selectedRowKeys.length} ürün silindi`);
      setSelectedRowKeys([]);
      fetchPricelistDetail();
    } catch (error) {
      console.error('Error bulk deleting items:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'Toplu silme işlemi başarısız');
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
          hasSections={hasSectionData(items)}
          groupBySections={groupBySections}
          onGroupBySectionsChange={setGroupBySections}
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
          groupBySections={groupBySections}
          pricelistColor={pricelist?.color || '#1890ff'}
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