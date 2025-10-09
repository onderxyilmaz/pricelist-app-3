import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../UserManagement.module.css';

const { Search } = Input;

const UserSearch = ({ onSearch }) => {
  return (
    <div className={styles.searchContainer}>
      <Search
        placeholder="Kullanıcı ara..."
        allowClear
        onSearch={onSearch}
        onChange={(e) => onSearch(e.target.value)}
        className={styles.searchInput}
        prefix={<SearchOutlined />}
        autoFocus
      />
    </div>
  );
};

export default UserSearch;