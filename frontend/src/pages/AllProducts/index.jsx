import React, { useState, useEffect } from 'react';
import { Typography, message, Form } from 'antd';
import axios from 'axios';
import ExcelJS from 'exceljs';

import ProductFilters from './components/ProductFilters';
import ProductTable from './components/ProductTable';
import ExportModal from './components/ExportModal';
import EditProductModal from './components/EditProductModal';
import NotificationService from '../../utils/notification';
import styles from './AllProducts.module.css';

const { Title } = Typography;

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pricelists, setPricelists] = useState([]);
  const [selectedPricelists, setSelectedPricelists] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [current, setCurrent] = useState(1);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formLanguage, setFormLanguage] = useState('en'); // Tek dil state'i
  const [tableLanguage, setTableLanguage] = useState('en');
  const [editForm] = Form.useForm();

  useEffect(() => {
    document.title = 'Price List App v3 - All Products';
    fetchAllProducts();
    fetchPricelists();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/all-items');
      if (response.data.success) {
        setProducts(response.data.items);
        setFilteredProducts(response.data.items);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricelists = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/pricelists');
      if (response.data.success) {
        setPricelists(response.data.pricelists);
      }
    } catch (error) {
      console.error('Fiyat listeleri yüklenemedi:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    applyFilters(value, selectedPricelists);
  };

  const handlePricelistFilter = (pricelistIds) => {
    setSelectedPricelists(pricelistIds);
    applyFilters(searchText, pricelistIds);
  };

  const applyFilters = (search, pricelistFilters) => {
    let filtered = products;

    // Arama filtresi
    if (search) {
      filtered = filtered.filter(product =>
        (product.name_tr && product.name_tr.toLowerCase().includes(search.toLowerCase())) ||
        (product.name_en && product.name_en.toLowerCase().includes(search.toLowerCase())) ||
        product.product_id.toLowerCase().includes(search.toLowerCase()) ||
        (product.description_tr && product.description_tr.toLowerCase().includes(search.toLowerCase())) ||
        (product.description_en && product.description_en.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Fiyat listesi filtresi (çoklu seçim)
    if (pricelistFilters && pricelistFilters.length > 0) {
      filtered = filtered.filter(product => 
        pricelistFilters.includes(product.pricelist_id)
      );
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedPricelists([]);
    setFilteredProducts(products);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'TRY': '₺',
      'TL': '₺'
    };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  // Excel export için kolon tanımları
  const exportColumns = [
    { key: 'product_id', title: 'Product ID', dataIndex: 'product_id' },
    { key: 'name_tr', title: 'Ürün Adı (TR)', dataIndex: 'name_tr' },
    { key: 'name_en', title: 'Ürün Adı (EN)', dataIndex: 'name_en' },
    { key: 'description_tr', title: 'Açıklama (TR)', dataIndex: 'description_tr' },
    { key: 'description_en', title: 'Açıklama (EN)', dataIndex: 'description_en' },
    { key: 'price', title: 'Fiyat', dataIndex: 'price' },
    { key: 'currency', title: 'Para Birimi', dataIndex: 'currency' },
    { key: 'stock', title: 'Stok', dataIndex: 'stock' },
    { key: 'unit', title: 'Birim', dataIndex: 'unit' },
    { key: 'pricelist_name', title: 'Fiyat Listesi', dataIndex: 'pricelist_name' },
    { key: 'created_at', title: 'Oluşturulma Tarihi', dataIndex: 'created_at' }
  ];

  const handleExportClick = () => {
    if (filteredProducts.length === 0) {
      message.warning('Export edilecek ürün bulunamadı');
      return;
    }
    setSelectedColumns(exportColumns.map(col => col.key));
    setExportModalVisible(true);
  };

  const handleColumnSelection = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      message.warning('En az bir kolon seçmelisiniz');
      return;
    }

    // Seçili kolonlara göre veriyi hazırla
    const exportData = filteredProducts.map(product => {
      const row = {};
      selectedColumns.forEach(colKey => {
        const colDef = exportColumns.find(col => col.key === colKey);
        if (colDef) {
          let value = product[colDef.dataIndex];
          
          // Özel formatlamalar
          if (colKey === 'price') {
            value = parseFloat(value).toFixed(2);
          } else if (colKey === 'created_at') {
            value = new Date(value).toLocaleDateString('tr-TR');
          } else if (colKey === 'description' && !value) {
            value = '-';
          }
          
          row[colDef.title] = value;
        }
      });
      return row;
    });

    try {
      // Excel dosyası oluştur (ExcelJS kullanımı)
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ürünler');

      // Headers ekle
      const headers = selectedColumns.map(colKey => {
        const colDef = exportColumns.find(col => col.key === colKey);
        return colDef ? colDef.title : colKey;
      });
      worksheet.addRow(headers);

      // Data ekle
      exportData.forEach(row => {
        const rowData = headers.map(header => row[header] || '');
        worksheet.addRow(rowData);
      });

      // Dosya adı oluştur
      const now = new Date();
      const fileName = `urunler_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

      // Dosyayı indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportModalVisible(false);
      NotificationService.success('Başarılı', `${filteredProducts.length} ürün Excel'e aktarıldı`);
    } catch (error) {
      console.error('Export error:', error);
      NotificationService.error('Hata', 'Excel export sırasında hata oluştu');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // Default olarak EN seç
    setFormLanguage('en');
    editForm.setFieldsValue({
      product_id: product.product_id,
      name_tr: product.name_tr,
      name_en: product.name_en,
      description_tr: product.description_tr,
      description_en: product.description_en,
      price: product.price,
      stock: product.stock,
      unit: product.unit
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`http://localhost:3000/api/items/${productId}`);
      NotificationService.success('Başarılı', 'Ürün silindi');
      fetchAllProducts(); // Listeyi yenile
    } catch (error) {
      NotificationService.error('Hata', 'Ürün silinirken hata oluştu');
    }
  };

  const handleEditSubmit = async (values) => {
    try {
      await axios.put(`http://localhost:3000/api/items/${editingProduct.id}`, values);
      NotificationService.success('Başarılı', 'Ürün güncellendi');
      setEditModalVisible(false);
      setEditingProduct(null);
      editForm.resetFields();
      fetchAllProducts(); // Listeyi yenile
    } catch (error) {
      NotificationService.error('Hata', 'Ürün güncellenirken hata oluştu');
    }
  };

  const handlePageChange = (page, size) => {
    setCurrent(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrent(1);
    }
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrent(1);
  };

  const handleEditModalCancel = () => {
    setEditModalVisible(false);
    setEditingProduct(null);
    setFormLanguage('en'); // Tek dil state'i
    editForm.resetFields();
  };

  return (
    <div className={styles.container}>
      <Title level={2} className={styles.title}>Tüm Ürünler</Title>
      
      <ProductFilters
        searchText={searchText}
        onSearch={handleSearch}
        selectedPricelists={selectedPricelists}
        onPricelistFilter={handlePricelistFilter}
        pricelists={pricelists}
        tableLanguage={tableLanguage}
        onLanguageChange={setTableLanguage}
        onClearFilters={clearFilters}
        filteredCount={filteredProducts.length}
      />

      <ProductTable
        products={filteredProducts}
        loading={loading}
        tableLanguage={tableLanguage}
        pageSize={pageSize}
        current={current}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExportClick}
        getCurrencySymbol={getCurrencySymbol}
      />

      <ExportModal
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onExport={handleExport}
        selectedColumns={selectedColumns}
        onColumnSelection={handleColumnSelection}
        exportColumns={exportColumns}
        productCount={filteredProducts.length}
      />

      <EditProductModal
        visible={editModalVisible}
        onCancel={handleEditModalCancel}
        onSubmit={handleEditSubmit}
        editingProduct={editingProduct}
        form={editForm}
        formLanguage={formLanguage}
        onLanguageChange={setFormLanguage}
      />
    </div>
  );
};

export default AllProducts;
