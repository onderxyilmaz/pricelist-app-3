import React, { useState } from 'react';
import { Input, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../Pricelist.module.css';

const { Compact } = Space;

const PricelistSearch = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    onSearch(searchValue);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div className={styles.searchContainer}>
      <Compact className={styles.searchInput}>
        <Input
          placeholder="Fiyat listesi ara..."
          value={searchValue}
          onChange={handleChange}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
          allowClear
          onClear={handleClear}
          autoFocus
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          Ara
        </Button>
      </Compact>
    </div>
  );
};

export default PricelistSearch;
