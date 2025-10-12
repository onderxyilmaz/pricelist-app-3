// OffersSearch component
import React from 'react';
import { Input, Select, DatePicker, Row, Col, Button, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import styles from './OffersSearch.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const OffersSearch = ({
  searchTerm = '',
  status = '',
  customer = '',
  dateRange = [],
  onSearchTermChange,
  onStatusChange,
  onCustomerChange,
  onDateRangeChange,
  onClearFilters,
  customers = [],
  loading = false
}) => {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ];

  const hasActiveFilters = searchTerm || status || customer || dateRange?.length > 0;

  return (
    <div className={styles.searchContainer}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search offers..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={onSearchTermChange}
            allowClear
            className={styles.searchInput}
          />
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Select
            placeholder="Status"
            value={status}
            onChange={onStatusChange}
            allowClear
            className={styles.filterSelect}
            style={{ width: '100%' }}
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="Select customer"
            value={customer}
            onChange={onCustomerChange}
            allowClear
            showSearch
            filterOption={(input, option) =>
              option.children?.toLowerCase().includes(input.toLowerCase())
            }
            className={styles.filterSelect}
            style={{ width: '100%' }}
            loading={loading}
          >
            {customers.map(cust => (
              <Option key={cust.id} value={cust.id}>
                {cust.name}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <RangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder={['Start Date', 'End Date']}
            className={styles.dateRangePicker}
            style={{ width: '100%' }}
          />
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={2}>
          {hasActiveFilters && (
            <Button
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              className={styles.clearButton}
              title="Clear all filters"
            >
              Clear
            </Button>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default OffersSearch;