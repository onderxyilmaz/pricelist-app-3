import React from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Tabs, 
  Select, 
  Space, 
  Button, 
  Row, 
  Col, 
  Tag, 
  Divider 
} from 'antd';
import { 
  SelectOutlined, 
  ClearOutlined, 
  CheckOutlined 
} from '@ant-design/icons';
import styles from '../ImportExcel.module.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const SheetPreview = ({ 
  sheetData, 
  selectedRows, 
  sheetAssignments, 
  pricelists,
  onRowSelection,
  onSelectAllRows,
  onClearAllSelections,
  onSheetAssignment,
  onNext,
  onBack
}) => {
  const getTableColumns = (headers) => {
    return headers.map((header, index) => ({
      title: header || `Kolon ${index + 1}`,
      dataIndex: `col_${index}`,
      key: `col_${index}`,
      width: 150,
      ellipsis: true,
    }));
  };

  const canProceedToImport = () => {
    return Object.keys(sheetData).some(sheetName => {
      const hasSelectedRows = selectedRows[sheetName]?.length > 0;
      const hasAssignment = sheetAssignments[sheetName] !== null;
      return hasSelectedRows && hasAssignment;
    });
  };

  return (
    <Card className={styles.contentCard}>
      <div className={styles.sheetPreviewContainer}>
        <Title level={4} className={styles.sheetPreviewTitle}>
          Sheet Önizleme ve Seçim
        </Title>
        <Text type="secondary" className={styles.sheetPreviewDescription}>
          Her sheet'deki verileri kontrol edin ve import etmek istediğiniz satırları seçin
        </Text>
      </div>
      
      <Tabs>
        {Object.keys(sheetData).map(sheetName => {
          const sheet = sheetData[sheetName];
          const selectedCount = selectedRows[sheetName]?.length || 0;
          const totalCount = sheet.rows.length;
          
          return (
            <TabPane 
              tab={
                <span className={styles.sheetTab}>
                  {sheetName} 
                  <Tag 
                    color={selectedCount > 0 ? 'blue' : 'default'} 
                    className={styles.sheetTabBadge}
                  >
                    {selectedCount}/{totalCount}
                  </Tag>
                </span>
              } 
              key={sheetName}
            >
              <Row gutter={16} className={styles.sheetControls}>
                <Col span={12}>
                  <Space className={styles.sheetControlsLeft}>
                    <Button 
                      icon={<SelectOutlined />}
                      onClick={() => onSelectAllRows(sheetName)}
                      className={styles.actionButton}
                    >
                      Tümünü Seç
                    </Button>
                    <Button 
                      icon={<ClearOutlined />}
                      onClick={() => onClearAllSelections(sheetName)}
                      className={styles.actionButton}
                    >
                      Seçimi Temizle
                    </Button>
                  </Space>
                </Col>
                <Col span={12}>
                  <div className={styles.sheetControlsRight}>
                    <Text strong className={styles.pricelistLabel}>Hedef Fiyat Listesi: </Text>
                    <Select
                      placeholder="Fiyat listesi seçin"
                      className={styles.pricelistSelect}
                      value={sheetAssignments[sheetName]}
                      onChange={(value) => onSheetAssignment(sheetName, value)}
                    >
                      {pricelists.map(pricelist => (
                        <Option key={pricelist.id} value={pricelist.id}>
                          {pricelist.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
              </Row>
              
              <Table
                dataSource={sheet.rows}
                columns={getTableColumns(sheet.headers)}
                rowSelection={{
                  selectedRowKeys: selectedRows[sheetName] || [],
                  onChange: (selectedRowKeys) => onRowSelection(sheetName, selectedRowKeys),
                }}
                pagination={{ defaultPageSize: 10 }}
                scroll={{ x: 800 }}
                size="small"
                className={`${styles.sheetTable} ${styles.previewTable}`}
              />
            </TabPane>
          );
        })}
      </Tabs>
      
      <Divider />
      
      <div className={styles.sheetNavigation}>
        <Space>
          <Button onClick={onBack} className={styles.actionButton}>
            Geri
          </Button>
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            disabled={!canProceedToImport()}
            onClick={onNext}
            className={`${styles.actionButton} ${styles.primaryButton}`}
          >
            Import Özeti
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default SheetPreview;