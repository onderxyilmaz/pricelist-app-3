import React, { useState } from 'react';
import { Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../UserManagement.module.css';

const UserSearch = ({ onSearch }) => {
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
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Kullanıcı ara..."
          value={searchValue}
          onChange={handleChange}
          onPressEnter={handleSearch}
          className={styles.searchInput}
          prefix={<SearchOutlined />}
          autoFocus
          allowClear
          onClear={handleClear}
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          Ara
        </Button>
      </Space.Compact>
    </div>
  );
};

export default UserSearch;