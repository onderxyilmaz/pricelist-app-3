import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Spin, App as AntApp, Typography } from 'antd';
import trTR from 'antd/locale/tr_TR';
import { authApi } from './utils/api';
import NotificationService, { setNotificationApi } from './utils/notification';
import Login from './pages/Login/index.jsx';
import Register from './pages/Register/index.jsx';
import Navbar from './components/Navbar.jsx';
import LogoutHandler from './components/LogoutHandler.jsx';
import Dashboard from './pages/Dashboard/index.jsx';
import Sidebar from './components/Sidebar.jsx';
import Pricelist from './pages/Pricelist/index.jsx';
import PricelistDetail from './pages/PricelistDetail/index.jsx';
import Profile from './pages/Profile/index.jsx';
import ImportExcel from './pages/ImportExcel/index.jsx';
import UserManagement from './pages/UserManagement/index.jsx';
import AllProducts from './pages/AllProducts/index.jsx';
import Offers from './pages/Offers/index.jsx';
import OfferTemplates from './pages/OfferTemplates/index.jsx';
import Customers from './pages/Customers/index.jsx';
import Companies from './pages/Companies/index.jsx';
import './App.css';

const { Content } = Layout;
const { Title } = Typography;

// Router içindeki ana app component'i
const RouterApp = ({ user, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notification } = AntApp.useApp();

  useEffect(() => {
    // Set the notification API for the service
    setNotificationApi(notification);
  }, [notification]);

  useEffect(() => {
    // Sadece yeni login/register sonrası dashboard'a yönlendir
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      sessionStorage.removeItem('justLoggedIn');
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    onLogout();
    // Router otomatik olarak user null olduğunda login sayfasına yönlendirir
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
                <Route path="/pricelists" element={<Pricelist />} />
                <Route path="/pricelists/:id" element={<PricelistDetail />} />
                <Route path="/all-products" element={<AllProducts />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/offer-templates" element={<OfferTemplates />} />
                <Route path="/customers" element={<Customers />} />
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
      const savedToken = localStorage.getItem('token');

      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);

        // Validate user exists in database and refresh token
        try {
          const userResponse = await authApi.getUser(userData.id);
          if (userResponse.data.success) {
            // Update user data with fresh info from database (including avatar)
            const freshUserData = userResponse.data.user;
            setUser(freshUserData);
            localStorage.setItem('user', JSON.stringify(freshUserData));
            setHasUsers(true); // User var demek ki database'de en az 1 user var
          } else {
            console.warn('User validation failed:', userResponse.data.message);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            // User validate edilemedi, check users yap
            await checkUsersInDb();
          }
        } catch (error) {
          console.warn('User validation error, clearing localStorage:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          // Hata oldu, check users yap
          await checkUsersInDb();
        }

        setLoading(false);
        return;
      }

      // Saved user yoksa, check if any users exist in database
      await checkUsersInDb();
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if any users exist in database
  const checkUsersInDb = async () => {
    try {
      const response = await authApi.checkUsers();

      if (response.data.success) {
        const hasUsersInDb = response.data.hasUsers;
        setHasUsers(hasUsersInDb);
        setShowRegister(!hasUsersInDb); // Show register if no users exist
      }
    } catch (error) {
      console.error('Check users error:', error);
      // Backend çalışmıyorsa veya hata varsa, register sayfasını göster
      // (Yeni kurulumda backend çalışıyor ama DB boşsa register gösterilmeli)
      setHasUsers(false);
      setShowRegister(true);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    // Login sonrası flag ekle ki RouterApp ilk render'da dashboard'a yönlendirsin
    sessionStorage.setItem('justLoggedIn', 'true');
  };

  const handleRegister = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setHasUsers(true); // İlk kullanıcı kaydedildi
    setShowRegister(false); // Artık login göster
    // Register sonrası flag ekle ki RouterApp ilk render'da dashboard'a yönlendirsin
    sessionStorage.setItem('justLoggedIn', 'true');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Logout sonrası database'de kullanıcı var mı kontrol et
    await checkUsersInDb();
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
