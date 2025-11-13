import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Popconfirm, Image } from 'antd';
import { EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../../config/env';
import styles from '../Companies.module.css';

// Get column widths from CSS variables
const getColumnWidths = () => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    return {
      logo: parseInt(getComputedStyle(root).getPropertyValue('--company-table-logo-width')) || 100,
      offerCount: parseInt(getComputedStyle(root).getPropertyValue('--company-table-offer-count-width')) || 150,
      logoDimension: parseInt(getComputedStyle(root).getPropertyValue('--company-table-logo-dimension-width')) || 180,
      date: parseInt(getComputedStyle(root).getPropertyValue('--company-table-date-width')) || 140,
      actions: parseInt(getComputedStyle(root).getPropertyValue('--company-table-actions-width')) || 120,
      scroll: parseInt(getComputedStyle(root).getPropertyValue('--company-table-scroll-width')) || 1160
    };
  }
  // Fallback values for SSR
  return {
    logo: 100,
    offerCount: 150,
    logoDimension: 180,
    date: 140,
    actions: 120,
    scroll: 1160
  };
};

const CompanyTable = ({ 
  companies, 
  loading, 
  onEdit, 
  onDelete 
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // Get column widths from CSS
  const COLUMN_WIDTHS = useMemo(() => getColumnWidths(), []);
  
  const columns = [
    {
      title: 'Logo',
      dataIndex: 'logo_filename',
      key: 'logo',
      width: COLUMN_WIDTHS.logo,
      align: 'center',
      render: (logoFilename) => {
        if (logoFilename) {
          const logoUrl = `${API_BASE_URL}/uploads/company_logos/${logoFilename}`;
          return (
            <div 
              className={styles.companyLogo}
              onClick={() => {
                setPreviewImage(logoUrl);
                setPreviewVisible(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={logoUrl}
                alt="Company Logo"
              />
            </div>
          );
        }
        return (
          <div className={styles.companyLogoPlaceholder}>
            <PictureOutlined />
          </div>
        );
      },
    },
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
      width: COLUMN_WIDTHS.offerCount,
      sorter: (a, b) => parseInt(a.offer_count || 0) - parseInt(b.offer_count || 0),
      render: (count) => parseInt(count) || 0,
    },
    {
      title: 'Logo Genişliği (cm)',
      dataIndex: 'logo_width',
      key: 'logo_width',
      width: COLUMN_WIDTHS.logoDimension,
      align: 'center',
      sorter: (a, b) => (a.logo_width || 0) - (b.logo_width || 0),
      render: (width) => width ? `${width} cm` : '-',
    },
    {
      title: 'Logo Yüksekliği (cm)',
      dataIndex: 'logo_height',
      key: 'logo_height',
      width: COLUMN_WIDTHS.logoDimension,
      align: 'center',
      sorter: (a, b) => (a.logo_height || 0) - (b.logo_height || 0),
      render: (height) => height ? `${height} cm` : '-',
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: COLUMN_WIDTHS.date,
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
      width: COLUMN_WIDTHS.date,
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
      width: COLUMN_WIDTHS.actions,
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
    <>
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
        scroll={{ x: COLUMN_WIDTHS.scroll }}
      />
      {previewImage && (
        <Image
          width={200}
          style={{ display: 'none' }}
          src={previewImage}
          preview={{
            visible: previewVisible,
            onVisibleChange: (visible) => {
              setPreviewVisible(visible);
              if (!visible) {
                setPreviewImage('');
              }
            },
          }}
        />
      )}
    </>
  );
};

export default CompanyTable;