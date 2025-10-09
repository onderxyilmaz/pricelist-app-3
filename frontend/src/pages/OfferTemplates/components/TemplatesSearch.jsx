import React from 'react';
import { Card, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../OfferTemplates.module.css';

const { Search } = Input;

const TemplatesSearch = ({ 
  value, 
  onChange, 
  placeholder = "Template ara..."
}) => {
  return (
    <Card className={styles.searchCard}>
      <Search
        placeholder={placeholder}
        allowClear
        value={value}
        onSearch={onChange}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 300 }}
        prefix={<SearchOutlined />}
        autoFocus
      />
    </Card>
  );
};

export default TemplatesSearch;