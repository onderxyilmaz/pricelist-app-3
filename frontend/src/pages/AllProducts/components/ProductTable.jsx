import React from 'react';
import { Card, Table, Tag, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons';
import styles from '../AllProducts.module.css';

const ProductTable = ({
  products,
  loading,
  tableLanguage,
  pageSize,
  current,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onExport,
  getCurrencySymbol
}) => {
  const columns = [
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 120,
      sorter: (a, b) => a.product_id.localeCompare(b.product_id),
    },
    {
      title: 'Ürün Adı',
      key: 'name',
      sorter: (a, b) => {
        const nameA = (tableLanguage === 'tr' ? a.name_tr : a.name_en) || a.name_tr || a.name_en || '';
        const nameB = (tableLanguage === 'tr' ? b.name_tr : b.name_en) || b.name_tr || b.name_en || '';
        return nameA.localeCompare(nameB, 'tr');
      },
      ellipsis: true,
      render: (_, record) => {
        const displayName = tableLanguage === 'tr' ? record.name_tr : record.name_en;
        return displayName || record.name_tr || record.name_en || '-';
      },
    },
    {
      title: 'Açıklama',
      key: 'description',
      ellipsis: true,
      render: (_, record) => {
        const displayDescription = tableLanguage === 'tr' ? record.description_tr : record.description_en;
        return displayDescription || record.description_tr || record.description_en || '-';
      },
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
      width: 110,
      align: 'center',
      render: (currency) => getCurrencySymbol(currency),
      sorter: (a, b) => {
        const symbolA = getCurrencySymbol(a.currency);
        const symbolB = getCurrencySymbol(b.currency);
        return symbolA.localeCompare(symbolB);
      }
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
      render: (price) => parseFloat(price).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Birim',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Fiyat Listesi',
      dataIndex: 'pricelist_name',
      key: 'pricelist_name',
      width: 200,
      render: (text, record) => (
        <Tag color={record.color || 'blue'}>
          {text}
        </Tag>
      ),
      sorter: (a, b) => a.pricelist_name.localeCompare(b.pricelist_name),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
            title="Düzenle"
          />
          <Popconfirm
            title="Ürünü silmek istediğinizden emin misiniz?"
            onConfirm={() => onDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Sil"
            />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <Card className={styles.contentCard}>
      <div className={styles.tableActions}>
        <Button 
          type="primary" 
          icon={<ExportOutlined />}
          disabled={products.length === 0}
          onClick={onExport}
          className={styles.exportButton}
        >
          Excel'e Aktar
        </Button>
      </div>
      <Table
        className={styles.table}
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          total: products.length,
          pageSize: pageSize,
          current: current,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} / ${total} ürün`,
          pageSizeOptions: ['10', '25', '50', '100', '200'],
          onChange: (page, size) => {
            onPageChange(page, size);
          },
          onShowSizeChange: (current, size) => {
            onPageSizeChange(current, size);
          }
        }}
        scroll={{ x: 1200 }}
        size="middle"
      />
    </Card>
  );
};

export default ProductTable;
