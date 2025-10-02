import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../Pricelist.module.css';

const { Search } = Input;

const PricelistSearch = ({ onSearch }) => {
  return (
    <div className={styles.searchContainer}>
      <Search
        className={styles.searchInput}
        placeholder="Fiyat listesi ara..."
        allowClear
        onSearch={onSearch}
        onChange={(e) => onSearch(e.target.value)}
        prefix={<SearchOutlined />}
        autoFocus
      />
    </div>
  );
};

export default PricelistSearch;