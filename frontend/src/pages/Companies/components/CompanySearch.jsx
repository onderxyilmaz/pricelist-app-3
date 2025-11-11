import React, { useState } from 'react';
import { Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../Companies.module.css';

const { Compact } = Space;

const CompanySearch = ({ onSearch }) => {
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
          placeholder="Firma ara..."
          allowClear
          value={searchValue}
          onChange={handleChange}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
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

export default CompanySearch;