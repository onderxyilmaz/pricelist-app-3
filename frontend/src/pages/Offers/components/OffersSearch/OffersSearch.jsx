// OffersSearch - Filtreleme ve Arama Component
import React from 'react';
import { Row, Col, Input, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import styles from './OffersSearch.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const OffersSearch = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableCustomers = [],
  availableUsers = []
}) => {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterHeader}>
        <FilterOutlined style={{ marginRight: 8 }} />
        Filtreler
      </div>
      
      <Row gutter={[16, 16]}>
        {/* İlk satır: Teklif No, Durum, Müşteri Yanıtı, Hazırlayan */}
        <Col xs={24} sm={12} md={6}>
          <div className={styles.filterLabel}>Teklif No</div>
          <Input
            value={filters.offerNo}
            onChange={(e) => onFilterChange('offerNo', e.target.value)}
            placeholder="Teklif no ara..."
            allowClear
            prefix={<SearchOutlined />}
            autoFocus
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <div className={styles.filterLabelInline}>Durum</div>
          <Select
            value={filters.status}
            onChange={(value) => onFilterChange('status', value)}
            style={{ width: '100%' }}
            placeholder="Tüm Durumlar"
          >
            <Option value="all">Tüm Durumlar</Option>
            <Option value="draft">Taslak</Option>
            <Option value="sent">Gönderildi</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <div className={styles.filterLabelInline}>Müşteri Yanıtı</div>
          <Select
            value={filters.customerResponse}
            onChange={(value) => onFilterChange('customerResponse', value)}
            style={{ width: '100%' }}
            placeholder="Tüm Yanıtlar"
          >
            <Option value="all">Tüm Yanıtlar</Option>
            <Option value="pending">Bekliyor</Option>
            <Option value="accepted">Kabul Edildi</Option>
            <Option value="rejected">Reddedildi</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <div className={styles.filterLabelInline}>Hazırlayan</div>
          <Select
            value={filters.createdBy}
            onChange={(value) => onFilterChange('createdBy', value)}
            style={{ width: '100%' }}
            placeholder="Tüm Kullanıcılar"
            showSearch
            optionFilterProp="children"
          >
            <Option value="all">Tüm Kullanıcılar</Option>
            {availableUsers.map(user => (
              <Option key={user} value={user}>{user}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} className={styles.filterRowMargin}>
        {/* İkinci satır: Müşteri, Oluşturma Tarihi, Temizle butonu */}
        <Col xs={24} sm={12} md={8}>
          <div className={styles.filterLabelInline}>Müşteri</div>
          <Select
            value={filters.customer}
            onChange={(value) => onFilterChange('customer', value)}
            style={{ width: '100%' }}
            placeholder="Tüm Müşteriler"
            showSearch
            optionFilterProp="children"
          >
            <Option value="all">Tüm Müşteriler</Option>
            {availableCustomers.map(customer => (
              <Option key={customer} value={customer}>{customer}</Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div className={styles.filterLabelInline}>Oluşturma Tarihi</div>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => onFilterChange('dateRange', dates)}
            style={{ width: '100%' }}
            placeholder={['Başlangıç', 'Bitiş']}
            format="DD/MM/YYYY"
          />
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div className={styles.filterLabelInline}>&nbsp;</div>
          <Button
            icon={<ClearOutlined />}
            onClick={onClearFilters}
            style={{ width: '100%' }}
          >
            Temizle
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default OffersSearch;
