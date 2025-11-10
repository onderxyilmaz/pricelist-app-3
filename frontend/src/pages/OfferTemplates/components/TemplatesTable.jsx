import React from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Popconfirm,
  Card 
} from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import styles from '../OfferTemplates.module.css';

const TemplatesTable = ({
  templates,
  loading,
  onPreview,
  onEdit,
  onDelete
}) => {
  const columns = [
    {
      title: 'Template Adı',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name, 'tr'),
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Ürün Sayısı',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 140,
      align: 'center',
      sorter: (a, b) => a.item_count - b.item_count,
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count} ürün
        </Tag>
      ),
    },
    {
      title: 'Oluşturan',
      key: 'creator',
      width: 120,
      ellipsis: true,
      render: (_, record) => {
        if (record.creator_first_name && record.creator_last_name) {
          return `${record.creator_first_name} ${record.creator_last_name}`;
        }
        return '-';
      },
    },
    {
      title: 'Son Düzenleyen',
      key: 'updater',
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        if (record.updater_first_name && record.updater_last_name) {
          return `${record.updater_first_name} ${record.updater_last_name}`;
        }
        return record.creator_first_name && record.creator_last_name ? 
          `${record.creator_first_name} ${record.creator_last_name}` : '-';
      },
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: 'Son Güncelleme',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onPreview(record)}
            title="Önizleme"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Düzenle"
          />
          <Popconfirm
            title="Template'i silmek istediğinizden emin misiniz?"
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
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className={styles.tableCard}>
      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        className={styles.templatesTable}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kayıt`,
          pageSizeOptions: ['5', '10', '20', '50'],
        }}
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default TemplatesTable;
