import React from 'react';
import { Input, Button, Typography, Space, Popconfirm, Switch, Tooltip } from 'antd';
import { SearchOutlined, CheckSquareOutlined, CloseSquareOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../PricelistDetail.module.css';

const { Search } = Input;
const { Text } = Typography;

const ProductSearch = ({ 
  onSearch, 
  tableLanguage, 
  onLanguageChange,
  selectedRowKeys,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  totalItems,
  hasSections,
  groupBySections,
  onGroupBySectionsChange
}) => {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchLeft}>
        <Search
          placeholder="Ürün ara... (ID, isim, açıklama, bölüm)"
          allowClear
          onSearch={onSearch}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.searchInput}
          prefix={<SearchOutlined />}
          autoFocus
        />
        
        <div className={styles.languageToggle}>
          <Text strong className={styles.languageText}>Görünüm:</Text>
          <Button.Group>
            <Button 
              type={tableLanguage === 'en' ? 'primary' : 'default'}
              onClick={() => onLanguageChange('en')}
              className={`${styles.languageButton} ${
                tableLanguage === 'en' 
                  ? styles.languageButtonActive 
                  : styles.languageButtonInactive
              }`}
            >
              EN
            </Button>
            <Button 
              type={tableLanguage === 'tr' ? 'primary' : 'default'}
              onClick={() => onLanguageChange('tr')}
              className={`${styles.languageButton} ${
                tableLanguage === 'tr' 
                  ? `${styles.languageButtonActive} ${styles.languageButtonTr}`
                  : styles.languageButtonInactive
              }`}
            >
              TR
            </Button>
          </Button.Group>
        </div>

        {hasSections && (
          <div className={styles.languageToggle}>
            <Tooltip title="Kapalıyken tüm ürünler tek listede; açıkken bölüm başlıklarına göre gruplanır.">
              <Space size="small" align="center">
                <Text strong className={styles.languageText}>Bölüm başlıkları:</Text>
                <Switch
                  checked={groupBySections}
                  onChange={onGroupBySectionsChange}
                  checkedChildren="Açık"
                  unCheckedChildren="Kapalı"
                />
              </Space>
            </Tooltip>
          </div>
        )}
      </div>
      
      <Space className={styles.actionButtons}>
        <Button 
          onClick={onSelectAll}
          disabled={totalItems === 0}
          icon={<CheckSquareOutlined />}
          title="Tümünü Seç"
          className={styles.actionButton}
        >
          <span className="button-text">Tümünü Seç</span>
        </Button>
        <Button 
          onClick={onClearSelection}
          disabled={selectedRowKeys.length === 0}
          icon={<CloseSquareOutlined />}
          title="Seçimi Kaldır"
          className={styles.actionButton}
        >
          <span className="button-text">Seçimi Kaldır</span>
        </Button>
        <Popconfirm
          title={`Seçili ${selectedRowKeys.length} ürünü silmek istediğinizden emin misiniz?`}
          onConfirm={onBulkDelete}
          okText="Evet"
          cancelText="Hayır"
          disabled={selectedRowKeys.length === 0}
        >
          <Button 
            danger
            disabled={selectedRowKeys.length === 0}
            icon={<DeleteOutlined />}
            title={`Seçili Ürünleri Sil (${selectedRowKeys.length})`}
            className={styles.actionButton}
          >
            <span className="button-text">Seçili Ürünleri Sil ({selectedRowKeys.length})</span>
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );
};

export default ProductSearch;