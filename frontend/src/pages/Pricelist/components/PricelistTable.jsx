import React from 'react';
import { Table, Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '../Pricelist.module.css';

const PricelistTable = ({ 
  pricelists, 
  loading, 
  onEdit, 
  onDelete 
}) => {
  const navigate = useNavigate();

  const getDeleteConfirmText = (record) => {
    if (record.item_count > 0) {
      return (
        <div>
          <div>Fiyat listesini silmek istediğinizden emin misiniz?</div>
          <div className={styles.deleteConfirmWarning}>
            Listedeki {record.item_count} adet ürünler de silinecek!
          </div>
        </div>
      );
    }
    return 'Fiyat listesini silmek istediğinizden emin misiniz?';
  };

  const columns = [
    {
      title: 'Renk',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color) => (
        <div 
          className={styles.colorCircle}
          style={{ backgroundColor: color }}
        />
      ),
    },
    {
      title: 'İsim',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name, 'tr'),
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/pricelists/${record.id}`)}
          className={styles.nameLink}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Para Birimi',
      dataIndex: 'currency',
      key: 'currency',
      width: 120,
      render: (currency) => <Tag className={styles.currencyTag}>{currency}</Tag>,
    },
    {
      title: 'Ürün Sayısı',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.item_count - b.item_count,
      render: (count) => (
        <Tag 
          color={count > 0 ? 'blue' : 'default'}
          className={styles.itemCountTag}
        >
          {count} ürün
        </Tag>
      ),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space className={styles.actionsContainer}>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Düzenle"
            className={styles.actionButton}
          />
          <Popconfirm
            className={styles.deleteConfirm}
            title={getDeleteConfirmText(record)}
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
              className={styles.actionButton}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      className={styles.table}
      columns={columns}
      dataSource={pricelists}
      rowKey="id"
      loading={loading}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kayıt`,
        pageSizeOptions: ['5', '10', '20', '50'],
      }}
      scroll={{ x: 800 }}
    />
  );
};

export default PricelistTable;