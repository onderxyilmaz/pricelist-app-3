import React from 'react';
import { Card, Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '../OfferTemplates.module.css';

const { Compact } = Space;

const TemplatesSearch = ({ 
  value, 
  onChange, 
  placeholder = "Template ara..."
}) => {
  const handleSearch = () => {
    onChange(value);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <Card className={styles.searchCard}>
      <Compact style={{ width: 300 }}>
        <Input
          placeholder={placeholder}
          allowClear
          value={value}
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
    </Card>
  );
};

export default TemplatesSearch;