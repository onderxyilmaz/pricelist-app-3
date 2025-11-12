import React from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../Companies.module.css';

const CompanyTable = ({ 
  companies, 
  loading, 
  onEdit, 
  onDelete 
}) => {
  const columns = [
    {
      title: 'Firma Adı',
      dataIndex: 'company_name',
      key: 'company_name',
      sorter: (a, b) => a.company_name.localeCompare(b.company_name, 'tr'),
    },
    {
      title: 'Teklif Sayısı',
      dataIndex: 'offer_count',
      key: 'offer_count',
      width: 150,
      sorter: (a, b) => parseInt(a.offer_count || 0) - parseInt(b.offer_count || 0),
      render: (count) => parseInt(count) || 0,
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => {
        if (!date) return '-';
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString('tr-TR');
      },
    },
    {
      title: 'Güncellenme',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 140,
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      render: (date) => {
        if (!date) return '-';
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString('tr-TR');
      },
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
            title="Firmayı silmek istediğinizden emin misiniz?"
            description={
              (record.offer_count || 0) > 0 
                ? (
                  <div className={styles.deleteConfirmDescription}>
                    Bu firma {record.offer_count} teklifte kullanılıyor. 
                    Silinirse tüm tekliflerden kaldırılacak.
                  </div>
                )
                : undefined
            }
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
      dataSource={companies}
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

export default CompanyTable;