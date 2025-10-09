import React from 'react';
import { Typography, Button, Space, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '../PricelistDetail.module.css';

const { Title } = Typography;

const PricelistDetailHeader = ({ pricelist, onAddItem }) => {
  const navigate = useNavigate();

  return (
    <>
      <Breadcrumb className={styles.breadcrumb}>
        <Breadcrumb.Item>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span 
            className={styles.breadcrumbItem}
            onClick={() => navigate('/pricelists')}
          >
            Fiyat Listeleri
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {pricelist?.name || 'Detay'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className={styles.header}>
        <div>
          <Title level={2} className={styles.title}>
            {pricelist ? pricelist.name : 'Yükleniyor...'}
          </Title>
        </div>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/pricelists')}
            className={styles.backButton}
          >
            Geri
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={onAddItem}
            className={styles.addButton}
          >
            Yeni Ürün
          </Button>
        </Space>
      </div>
    </>
  );
};

export default PricelistDetailHeader;