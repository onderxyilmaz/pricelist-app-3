import React from 'react';
import { 
  Card, 
  Typography, 
  Alert, 
  Row, 
  Col, 
  Tag, 
  Progress, 
  Button, 
  Space, 
  Divider 
} from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import styles from '../ImportExcel.module.css';

const { Title, Text } = Typography;

const ImportSummary = ({ 
  sheetData,
  selectedRows,
  sheetAssignments,
  pricelists,
  importing,
  importProgress,
  onImport,
  onBack
}) => {
  const totalSelectedItems = Object.values(selectedRows).reduce(
    (sum, rows) => sum + rows.length, 
    0
  );

  return (
    <Card className={styles.contentCard}>
      <div className={styles.summaryContainer}>
        <Title level={4} className={styles.summaryTitle}>
          Import Özeti
        </Title>
        
        <Alert
          message={`Toplam ${totalSelectedItems} ürün import edilecek`}
          type="info"
          className={`${styles.summaryAlert} ${styles.infoAlert}`}
        />
        
        {Object.keys(sheetData).map(sheetName => {
          const selectedCount = selectedRows[sheetName]?.length || 0;
          const pricelistId = sheetAssignments[sheetName];
          const pricelist = pricelists.find(p => p.id === pricelistId);
          
          if (selectedCount === 0) return null;
          
          return (
            <Card key={sheetName} size="small" className={styles.summaryItem}>
              <Row className={styles.summaryRow}>
                <Col span={8}>
                  <Text strong className={styles.summarySheetName}>
                    {sheetName}
                  </Text>
                </Col>
                <Col span={8}>
                  <Tag color="blue" className={styles.summaryItemCount}>
                    {selectedCount} ürün
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text className={styles.summaryTarget}>
                    → {pricelist?.name}
                  </Text>
                </Col>
              </Row>
            </Card>
          );
        })}
        
        {importing && (
          <div className={styles.progressContainer}>
            <Text className={styles.progressText}>Import ediliyor...</Text>
            <Progress percent={Math.round(importProgress)} />
          </div>
        )}
        
        <Divider />
        
        <div className={styles.summaryNavigation}>
          <Space>
            <Button 
              onClick={onBack} 
              disabled={importing}
              className={styles.actionButton}
            >
              Geri
            </Button>
            <Button 
              type="primary" 
              icon={<ImportOutlined />}
              loading={importing}
              onClick={onImport}
              className={`${styles.actionButton} ${styles.primaryButton}`}
            >
              Import Et
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default ImportSummary;