// OffersTable component
import React from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import styles from './OffersTable.module.css';

const OffersTable = ({ 
  offers = [], 
  loading = false, 
  pagination = {}, 
  onEdit, 
  onDelete, 
  onPreview, 
  onDuplicate,
  onTableChange 
}) => {
  const columns = [
    {
      title: 'Offer No',
      dataIndex: 'offer_no',
      key: 'offer_no',
      width: 120,
      sorter: true,
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right',
      render: (amount) => `₺${Number(amount || 0).toLocaleString()}`,
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          draft: { color: 'default', text: 'Draft' },
          sent: { color: 'processing', text: 'Sent' },
          accepted: { color: 'success', text: 'Accepted' },
          rejected: { color: 'error', text: 'Rejected' },
          expired: { color: 'warning', text: 'Expired' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
      sorter: true,
    },
    {
      title: 'Valid Until',
      dataIndex: 'valid_until',
      key: 'valid_until',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onPreview?.(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => onDuplicate?.(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete?.(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.tableContainer}>
      <Table
        columns={columns}
        dataSource={offers}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} offers`,
        }}
        onChange={onTableChange}
        rowKey="id"
        scroll={{ x: 800 }}
        className={styles.offersTable}
      />
    </div>
  );
};

export default OffersTable;