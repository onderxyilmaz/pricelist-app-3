import React from 'react';
import { Card, Typography, Upload, Button, Select, Alert } from 'antd';
import { InboxOutlined, FileExcelOutlined } from '@ant-design/icons';
import styles from '../ImportExcel.module.css';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const FileUpload = ({ 
  selectedLanguage, 
  onLanguageChange, 
  onFileUpload 
}) => {
  return (
    <Card className={styles.contentCard}>
      <div className={styles.uploadContainer}>
        <FileExcelOutlined className={styles.uploadIcon} />
        <Title level={3} className={styles.uploadTitle}>Excel Dosyası Seçin</Title>
        <Text type="secondary" className={styles.uploadDescription}>
          XLS ve XLSX formatlarını destekliyoruz
        </Text>
        
        <Alert
          message="Beklenen Sütun Formatı"
          description="Excel dosyanızda en az şu sütunlar olmalı: Ürün Adı (Name/Title) ve Fiyat (Price/Cost). Opsiyonel: ID, Açıklama, Stok. Sütun isimleri esnek - farklı isimler de kabul edilir."
          type="info"
          className={styles.infoAlert}
          style={{ margin: '16px 0', textAlign: 'left' }}
        />
        
        <div className={styles.languageSelection}>
          <Text strong className={styles.languageLabel}>Açıklama Dili:</Text>
          <Select
            value={selectedLanguage}
            onChange={onLanguageChange}
            placeholder="Dil seçin"
            className={styles.languageSelect}
          >
            <Option value="en">🇺🇸 İngilizce</Option>
            <Option value="tr">🇹🇷 Türkçe</Option>
          </Select>
          <div className={styles.languageHelper}>
            Excel'deki açıklamalar seçilen dile kaydedilecek
          </div>
        </div>
        
        {!selectedLanguage && (
          <Alert
            message="Önce açıklama dilini seçin"
            description="Excel dosyası yüklemek için önce açıklama dilini seçmeniz gerekiyor."
            type="warning"
            className={styles.warningAlert}
            style={{ margin: '16px 0' }}
          />
        )}
        
        <div style={{ marginTop: '24px' }}>
          <Dragger
            accept=".xls,.xlsx"
            beforeUpload={selectedLanguage ? onFileUpload : () => false}
            showUploadList={false}
            disabled={!selectedLanguage}
            className={`${styles.uploadDragger} ${!selectedLanguage ? styles.uploadDraggerDisabled : ''}`}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {selectedLanguage 
                ? "Dosyayı buraya sürükleyin veya tıklayın" 
                : "Önce açıklama dilini seçin"
              }
            </p>
            <p className="ant-upload-hint">Sadece .xls ve .xlsx dosyaları</p>
          </Dragger>
        </div>
      </div>
    </Card>
  );
};

export default FileUpload;