import React from 'react';
import { Modal, Checkbox, Row, Col, Button } from 'antd';
import styles from '../AllProducts.module.css';

const ExportModal = ({
  visible,
  onCancel,
  onExport,
  selectedColumns,
  onColumnSelection,
  exportColumns,
  productCount
}) => {
  const handleSelectAll = () => {
    onColumnSelection(exportColumns.map(col => col.key));
  };

  const handleClearAll = () => {
    onColumnSelection([]);
  };

  return (
    <Modal
      className={styles.modal}
      title="Excel Export - Kolon Seçimi"
      open={visible}
      onCancel={onCancel}
      onOk={onExport}
      okText="Excel'e Aktar"
      cancelText="İptal"
      width={600}
    >
      <div className={styles.modalContent}>
        <div className={styles.exportModalDescription}>
          <p>Aşağıdaki kolonlardan hangilerinin Excel dosyasına dahil edilmesini istiyorsunuz?</p>
          <p className={styles.exportModalSubText}>
            Toplam {productCount} ürün aktarılacak.
          </p>
        </div>
        
        <Checkbox.Group 
          className={styles.columnCheckboxGroup}
          value={selectedColumns}
          onChange={onColumnSelection}
        >
          <Row gutter={[16, 16]} className={styles.columnCheckboxRow}>
            {exportColumns.map(column => (
              <Col span={12} key={column.key}>
                <Checkbox value={column.key}>
                  {column.title}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>

        <div className={styles.exportModalFooter}>
          <div>
            <span>Seçili Kolonlar: {selectedColumns.length}</span>
          </div>
          <div className={styles.selectAllButtons}>
            <Button 
              size="small" 
              onClick={handleSelectAll}
            >
              Tümünü Seç
            </Button>
            <Button 
              size="small" 
              onClick={handleClearAll}
            >
              Tümünü Kaldır
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;