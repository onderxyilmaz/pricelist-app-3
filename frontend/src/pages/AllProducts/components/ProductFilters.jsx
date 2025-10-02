import React from 'react';
import { Card, Input, Select, Button, Row, Col, Typography } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import styles from '../AllProducts.module.css';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const ProductFilters = ({
  searchText,
  onSearch,
  selectedPricelists,
  onPricelistFilter,
  pricelists,
  tableLanguage,
  onLanguageChange,
  onClearFilters,
  filteredCount
}) => {
  return (
    <Card className={styles.filterCard}>
      <Row gutter={16} className={styles.filterRow}>
        <Col span={6}>
          <Search
            className={styles.searchInput}
            placeholder="Ürün adı, ID veya açıklama ile ara..."
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
            onSearch={onSearch}
            prefix={<SearchOutlined />}
            allowClear
            autoComplete="off"
            autoFocus
          />
        </Col>
        <Col span={5}>
          <Select
            className={styles.pricelistSelect}
            mode="multiple"
            placeholder="Fiyat listesi seç"
            value={selectedPricelists}
            onChange={onPricelistFilter}
            allowClear
            maxTagCount="responsive"
          >
            {pricelists.map(pricelist => (
              <Option key={pricelist.id} value={pricelist.id}>
                {pricelist.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <div className={styles.languageToggle}>
            <Text strong className={styles.languageLabel}>Görünüm:</Text>
            <Button.Group className={styles.languageButtonGroup}>
              <Button 
                type={tableLanguage === 'en' ? 'primary' : 'default'}
                onClick={() => onLanguageChange('en')}
                size="small"
                className={`${styles.languageButton} ${
                  tableLanguage === 'en' ? styles.languageButtonEn : styles.languageButtonEnDefault
                }`}
              >
                EN
              </Button>
              <Button 
                type={tableLanguage === 'tr' ? 'primary' : 'default'}
                onClick={() => onLanguageChange('tr')}
                size="small"
                className={`${styles.languageButton} ${
                  tableLanguage === 'tr' ? styles.languageButtonTr : styles.languageButtonTrDefault
                }`}
              >
                TR
              </Button>
            </Button.Group>
          </div>
        </Col>
        <Col span={3}>
          <Button 
            className={styles.clearFiltersButton}
            icon={<FilterOutlined />} 
            onClick={onClearFilters}
          >
            Filtreleri Temizle
          </Button>
        </Col>
        <Col span={7}>
          <div className={styles.statsContainer}>
            <span className={styles.statsText}>
              Toplam: {filteredCount} ürün
            </span>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default ProductFilters;