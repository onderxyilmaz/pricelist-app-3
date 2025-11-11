import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import api from '../../utils/api';
import NotificationService from '../../utils/notification';
import DashboardHeader from './components/DashboardHeader';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import RecentProducts from './components/RecentProducts';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.log('Recent Items:', response.data.stats.recentItems);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <DashboardHeader />
      
      <Row gutter={[16, 16]} className={styles.content}>
        <Col span={24}>
          <StatsCards stats={stats} loading={loading} />
        </Col>
        
        <Col span={24}>
          <QuickActions />
        </Col>
        
        <Col span={24}>
          <RecentProducts stats={stats} loading={loading} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;