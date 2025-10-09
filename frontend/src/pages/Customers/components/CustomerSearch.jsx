import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../Customers.module.css';

const { Search } = Input;

const CustomerSearch = ({ onSearch }) => {
  return (
    <div className={styles.searchContainer}>
      <Search
        className={styles.searchInput}
        placeholder="Müşteri ara..."
        allowClear
        onSearch={onSearch}
        onChange={(e) => onSearch(e.target.value)}
        prefix={<SearchOutlined />}
        autoFocus
      />
    </div>
  );
};

export default CustomerSearch;
