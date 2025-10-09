import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, Button, Table, Tag, Space } from 'antd';
import { 
  UnorderedListOutlined, 
  AppstoreOutlined, 
  DollarOutlined, 
  TrophyOutlined,
  PlusOutlined,
  ImportOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import NotificationService from '../utils/notification';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLanguage, setTableLanguage] = useState('en'); // Tablo görünümü için dil seçimi
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Price List App v3 - Dashboard';
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.stats);
        console.log('Dashboard stats:', response.data.stats);
        console.log('Recent Products:', response.data.stats.recentProducts);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'TRY': '₺', 'TL': '₺' };
    return symbols[currency?.toUpperCase()] || currency || 'TL';
  };

  const recentProductsColumns = [
    {
      title: 'Ürün Adı',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text, record) => {
        // Dil seçimine göre ürün adını göster
        const productName = tableLanguage === 'tr' 
          ? (record.name_tr || record.name || record.name_en || 'Ad bulunamadı')
          : (record.name_en || record.name || record.name_tr || 'Name not found');
        
        return productName;
      },
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        `${getCurrencySymbol(record.currency)} ${parseFloat(price).toFixed(2)}`
      ),
    },
    {
      title: 'Fiyat Listesi',
      dataIndex: 'pricelist_name',
      key: 'pricelist_name',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Tarih',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard</Title>
      
      {/* İstatistik Kartları */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Toplam Fiyat Listesi"
              value={stats?.totalPricelists || 0}
              prefix={<UnorderedListOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Toplam Ürün"
              value={stats?.totalItems || 0}
              prefix={<AppstoreOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Toplam Stok Değeri"
              value={stats?.totalValue || 0}
              precision={2}
              prefix="€"
              suffix="EUR"
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="En Pahalı Ürün"
              value={stats?.mostExpensive?.price || 0}
              precision={2}
              prefix={<TrophyOutlined />}
              suffix={getCurrencySymbol(stats?.mostExpensive?.currency)}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Hızlı İşlemler */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Hızlı İşlemler">
            <Space wrap>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/pricelists')}
              >
                Yeni Fiyat Listesi
              </Button>
              <Button 
                icon={<ImportOutlined />}
                onClick={() => navigate('/import-excel')}
              >
                Excel Import
              </Button>
              <Button 
                icon={<EyeOutlined />}
                onClick={() => navigate('/all-products')}
              >
                Tüm Ürünleri Gör
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Son Eklenen Ürünler */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title="Son Eklenen Ürünler"
            extra={
              <Space>
                <Button.Group size="small">
                  <Button
                    type={tableLanguage === 'en' ? 'primary' : 'default'}
                    onClick={() => setTableLanguage('en')}
                    style={{ 
                      backgroundColor: tableLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                      color: tableLanguage === 'en' ? 'white' : '#000'
                    }}
                  >
                    EN
                  </Button>
                  <Button
                    type={tableLanguage === 'tr' ? 'primary' : 'default'}
                    onClick={() => setTableLanguage('tr')}
                    style={{ 
                      backgroundColor: tableLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                      color: tableLanguage === 'tr' ? 'white' : '#000'
                    }}
                  >
                    TR
                  </Button>
                </Button.Group>
              </Space>
            }
          >
            <Table
              columns={recentProductsColumns}
              dataSource={stats?.recentItems || []}
              rowKey={(record, index) => index}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
