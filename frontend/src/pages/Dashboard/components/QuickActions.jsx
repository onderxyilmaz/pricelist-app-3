import React from 'react';
import { Card, Row, Col, Button, Space } from 'antd';
import { 
  PlusOutlined,
  ImportOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '../Dashboard.module.css';

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Row gutter={[16, 16]} className={styles.quickActionsSection}>
      <Col span={24}>
        <Card title="Hızlı İşlemler" className={styles.quickActionsCard}>
          <Space wrap className={styles.quickActionsSpace}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/pricelists')}
              className={styles.quickActionButton}
            >
              Yeni Fiyat Listesi
            </Button>
            <Button 
              icon={<ImportOutlined />}
              onClick={() => navigate('/import-excel')}
              className={styles.quickActionButton}
            >
              Excel Import
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => navigate('/all-products')}
              className={styles.quickActionButton}
            >
              Tüm Ürünleri Gör
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default QuickActions;