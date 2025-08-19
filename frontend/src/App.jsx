import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Spin, App as AntApp, Typography } from 'antd';
import trTR from 'antd/locale/tr_TR';
import { authApi } from './utils/api';
import NotificationService, { setNotificationApi } from './utils/notification';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Navbar from './components/Navbar.jsx';
import LogoutHandler from './components/LogoutHandler.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Sidebar from './components/Sidebar.jsx';
import PricelistList from './pages/PricelistList.jsx';
import PricelistDetail from './pages/PricelistDetail.jsx';
import Profile from './pages/Profile.jsx';
import CreatePricelist from './pages/CreatePricelist.jsx';
import ImportExcel from './pages/ImportExcel.jsx';
import UserManagement from './pages/UserManagement.jsx';
import AllProducts from './pages/AllProducts.jsx';
import Offers from './pages/Offers.jsx';
import Companies from './pages/Companies.jsx';
import './App.css';

const { Content } = Layout;
const { Title } = Typography;

// Router içindeki ana app component'i
const RouterApp = ({ user, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [hasNavigatedOnLogin, setHasNavigatedOnLogin] = useState(false);
  const { notification } = AntApp.useApp();
  
  useEffect(() => {
    // Set the notification API for the service
    setNotificationApi(notification);
  }, [notification]);
  
  useEffect(() => {
    // Sadece ilk login'de dashboard'a yönlendir
    if (user && !hasNavigatedOnLogin) {
      navigate('/');
      setHasNavigatedOnLogin(true);
    }
  }, [user, navigate, hasNavigatedOnLogin]);

  const handleLogout = () => {
    onLogout();
    // URL'yi temizlemek için sayfayı yenile
    window.location.href = '/';
  };

  return (
    <LogoutHandler onLogout={handleLogout}>
      {({ onLogout }) => (
        <Layout className="app-layout">
          <Navbar user={user} onLogout={onLogout} />
          <Layout>
            <Sidebar user={user} />
            <Content className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile user={user} onUserUpdate={onUserUpdate} />} />
                <Route path="/pricelists" element={<PricelistList />} />
                <Route path="/pricelists/create" element={<CreatePricelist />} />
                <Route path="/pricelists/:id" element={<PricelistDetail />} />
                <Route path="/all-products" element={<AllProducts />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/import-excel" element={<ImportExcel />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      )}
    </LogoutHandler>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [hasUsers, setHasUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setLoading(true);
    try {
      // Check if user is already logged in
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      }

      // Check if any users exist in database
      const response = await authApi.checkUsers();
      
      if (response.data.success) {
        setHasUsers(response.data.hasUsers);
        setShowRegister(!response.data.hasUsers); // Show register if no users exist
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleRegister = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setShowRegister(false);
  };

  const switchToRegister = () => {
    setShowRegister(true);
  };

  const switchToLogin = () => {
    setShowRegister(false);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Render main app
  return (
    <ConfigProvider locale={trTR}>
      <AntApp>
        {user ? (
          <Router>
            <RouterApp user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
          </Router>
        ) : (
          showRegister ? (
            <Register 
              onRegister={handleRegister}
              onSwitchToLogin={switchToLogin}
            />
          ) : (
            <Login 
              onLogin={handleLogin}
              onSwitchToRegister={switchToRegister}
            />
          )
        )}
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
