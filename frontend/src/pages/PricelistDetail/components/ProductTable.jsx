import React from 'react';
import { Table, Button, Space, Popconfirm, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../PricelistDetail.module.css';

const { Text } = Typography;

const ProductTable = ({ 
  items, 
  loading, 
  tableLanguage,
  selectedRowKeys,
  onSelectionChange,
  onEdit,
  onDelete,
  currency 
}) => {
  const getCurrencySymbol = (curr) => {
    const symbols = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'TRY': '₺', 'TL': '₺' };
    return symbols[curr?.toUpperCase()] || curr || 'TL';
  };

  const columns = [
    {
      title: tableLanguage === 'tr' ? 'Ürün ID' : 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 140,
      sorter: (a, b) => (a.product_id || '').localeCompare(b.product_id || ''),
      render: (text) => <Text code>{text || 'N/A'}</Text>,
    },
    {
      title: tableLanguage === 'tr' ? 'Ürün Adı' : 'Product Name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => {
        const productName = tableLanguage === 'tr' 
          ? (record.name_tr || record.name_en || 'Ad bulunamadı')
          : (record.name_en || record.name_tr || 'Name not found');
        
        return productName;
      },
      sorter: (a, b) => {
        const aName = tableLanguage === 'tr' ? (a.name_tr || a.name_en || '') : (a.name_en || a.name_tr || '');
        const bName = tableLanguage === 'tr' ? (b.name_tr || b.name_en || '') : (b.name_en || b.name_tr || '');
        return aName.localeCompare(bName, 'tr');
      },
    },
    {
      title: tableLanguage === 'tr' ? 'Açıklama' : 'Description',
      key: 'description',
      ellipsis: true,
      render: (_, record) => {
        const description = tableLanguage === 'tr' 
          ? (record.description_tr || record.description_en || '')
          : (record.description_en || record.description_tr || '');
        
        return description || '-';
      },
    },
    {
      title: tableLanguage === 'tr' ? 'Stok' : 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 84,
      align: 'center',
      sorter: (a, b) => parseInt(a.stock) - parseInt(b.stock),
      render: (stock) => (
        <Tag color={stock > 0 ? (stock > 10 ? 'green' : 'orange') : 'red'}>
          {parseInt(stock) || 0}
        </Tag>
      ),
    },
    {
      title: tableLanguage === 'tr' ? 'Birim' : 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
      render: (unit) => {
        const displayUnit = unit || 'adet';
        const formattedUnit = displayUnit.charAt(0).toUpperCase() + displayUnit.slice(1);
        return <Tag>{formattedUnit}</Tag>;
      },
    },
    {
      title: tableLanguage === 'tr' ? 'Fiyat' : 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
      render: (price) => (
        <Text strong>
          {getCurrencySymbol(currency)} {parseFloat(price)?.toLocaleString('tr-TR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </Text>
      ),
    },
    {
      title: tableLanguage === 'tr' ? 'İşlemler' : 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Düzenle"
            className={`${styles.actionButton} ${styles.editButton}`}
          />
          <Popconfirm
            title="Bu ürünü silmek istediğinizden emin misiniz?"
            onConfirm={() => onDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Sil"
              className={`${styles.actionButton} ${styles.tableDeleteButton}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="id"
      loading={loading}
      className={styles.table}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
        preserveSelectedRowKeys: true,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ürün`,
        pageSizeOptions: ['5', '10', '20', '50'],
      }}
      scroll={{ x: 800 }}
    />
  );
};

export default ProductTable;