import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import api from '../../utils/api';
import NotificationService from '../../utils/notification';
import DashboardHeader from './components/DashboardHeader';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import RecentOffers from './components/RecentOffers';
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
      console.log('Dashboard API Response:', response);
      console.log('Dashboard API Response Data:', response.data);
      
      if (response.data && response.data.success) {
        setStats(response.data.stats);
        console.log('Dashboard stats:', response.data.stats);
        console.log('Recent Items:', response.data.stats?.recentItems);
        console.log('Recent Offers:', response.data.stats?.recentOffers);
      } else {
        console.error('Dashboard API response success is false:', response.data);
        NotificationService.error('Hata', response.data?.message || 'Dashboard verileri yüklenemedi');
      }
    } catch (error) {
      console.error('Dashboard API Error:', error);
      console.error('Dashboard API Error Response:', error.response);
      NotificationService.error('Hata', error.response?.data?.message || 'Dashboard verileri yüklenemedi');
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
        
        <Col xs={24} lg={12}>
          <RecentOffers stats={stats} loading={loading} />
        </Col>
        
        <Col xs={24} lg={12}>
          <RecentProducts stats={stats} loading={loading} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;