// PreviewModal component
import React from 'react';
import { Modal, Card, Descriptions, Table, Divider, Typography, Space, Tag } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import styles from './PreviewModal.module.css';

const { Title, Text } = Typography;

const PreviewModal = ({
  visible = false,
  onCancel,
  offer = null,
  loading = false
}) => {
  if (!offer) return null;

  const productColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      align: 'right',
      render: (price) => `₺${Number(price || 0).toLocaleString()}`,
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const total = (record.quantity || 0) * (record.unit_price || 0);
        return `₺${total.toLocaleString()}`;
      },
    },
  ];

  const getStatusTag = (status) => {
    const statusConfig = {
      draft: { color: 'default', text: 'Draft' },
      sent: { color: 'processing', text: 'Sent' },
      accepted: { color: 'success', text: 'Accepted' },
      rejected: { color: 'error', text: 'Rejected' },
      expired: { color: 'warning', text: 'Expired' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <Modal
      title={
        <Space>
          <span>Offer Preview - {offer.offer_no}</span>
          {getStatusTag(offer.status)}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      className={styles.previewModal}
      footer={[
        <Space key="actions">
          <button className={styles.actionButton} title="Print">
            <PrinterOutlined /> Print
          </button>
          <button className={styles.actionButton} title="Download PDF">
            <DownloadOutlined /> Download
          </button>
        </Space>
      ]}
    >
      <div className={styles.previewContainer}>
        {/* Header Information */}
        <Card className={styles.offerHeader}>
          <div className={styles.headerRow}>
            <div className={styles.companyInfo}>
              <Title level={3} style={{ margin: 0 }}>
                Your Company Name
              </Title>
              <Text type="secondary">
                Company Address<br />
                Phone: +90 xxx xxx xxxx<br />
                Email: info@company.com
              </Text>
            </div>
            <div className={styles.offerInfo}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                OFFER
              </Title>
              <Text strong>#{offer.offer_no}</Text>
            </div>
          </div>
        </Card>

        {/* Offer Details */}
        <Card title="Offer Details" className={styles.detailsCard}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Customer">
              {offer.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Offer Date">
              {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Valid Until">
              {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Delivery Days">
              {offer.delivery_days || '-'} days
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getStatusTag(offer.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                ₺{Number(offer.total_amount || 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Products Table */}
        <Card title="Products" className={styles.productsCard}>
          <Table
            columns={productColumns}
            dataSource={offer.products || []}
            pagination={false}
            size="small"
            className={styles.productsTable}
          />
          
          <Divider />
          
          {/* Totals */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsRow}>
              <Text>Subtotal:</Text>
              <Text>₺{Number(offer.subtotal || 0).toLocaleString()}</Text>
            </div>
            <div className={styles.totalsRow}>
              <Text>Discount:</Text>
              <Text>₺{Number(offer.discount || 0).toLocaleString()}</Text>
            </div>
            <div className={styles.totalsRow}>
              <Text>Tax ({offer.tax_rate || 18}%):</Text>
              <Text>₺{Number(offer.tax_amount || 0).toLocaleString()}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div className={styles.totalsRow} style={{ fontSize: '18px', fontWeight: 'bold' }}>
              <Text strong>Total:</Text>
              <Text strong style={{ color: '#1890ff' }}>
                ₺{Number(offer.total_amount || 0).toLocaleString()}
              </Text>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {offer.notes && (
          <Card title="Notes" className={styles.notesCard}>
            <Text>{offer.notes}</Text>
          </Card>
        )}

        {/* Terms */}
        {offer.terms && (
          <Card title="Terms & Conditions" className={styles.termsCard}>
            <Text>{offer.terms}</Text>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default PreviewModal;