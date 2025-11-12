import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Spin, App as AntApp, Typography } from 'antd';
import { Toaster } from 'react-hot-toast';
import trTR from 'antd/locale/tr_TR';
import { authApi } from './utils/api';
import NotificationService, { setNotificationApi } from './utils/notification';
import logger from './utils/logger';
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
    // Eğer /login veya /register path'indeyse ve user varsa, dashboard'a yönlendir
    if ((location.pathname === '/login' || location.pathname === '/register') && user) {
      navigate('/', { replace: true });
      return;
    }
    
    // Sadece yeni login/register yapıldığında dashboard'a yönlendir
    // localStorage'da 'shouldNavigateToDashboard' flag'i varsa ve dashboard'da değilsek yönlendir
    const shouldNavigate = localStorage.getItem('shouldNavigateToDashboard');
    if (shouldNavigate === 'true') {
      // Flag'i hemen temizle (sadece bir kez kullanılacak)
      localStorage.removeItem('shouldNavigateToDashboard');
      
      // Eğer dashboard'da değilsek dashboard'a yönlendir
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, location.pathname, user]);

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
                <Route path="/profile" element={<Profile user={user} setUser={onUserUpdate} />} />
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

// AntApp içinde kullanılacak iç component
const AppContent = () => {
  const [user, setUser] = useState(null);
  const [hasUsers, setHasUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const { notification } = AntApp.useApp();

  useEffect(() => {
    // Set the notification API for the service (for login/register pages)
    setNotificationApi(notification);
  }, [notification]);

  useEffect(() => {
    const initializeApp = async () => {
    setLoading(true);
    try {
      // Check if user is already logged in
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        logger.debug('Found saved user:', { userId: userData.id, email: userData.email });
        
        // Validate user exists in database
        try {
          const userResponse = await authApi.getUser(userData.id);
          if (userResponse.data.success) {
            logger.debug('User validated successfully');
            setUser(userData);
          } else {
            logger.warn('User validation failed:', userResponse.data.message);
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          logger.warn('User validation error, clearing localStorage:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
        
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
    
    initializeApp();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // Login sonrası dashboard'a yönlendirmek için flag set et
    // Flag sadece bir kez kullanılacak, RouterApp içindeki useEffect tarafından temizlenecek
    localStorage.setItem('shouldNavigateToDashboard', 'true');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // Register sonrası dashboard'a yönlendirmek için flag set et
    // Flag sadece bir kez kullanılacak, RouterApp içindeki useEffect tarafından temizlenecek
    localStorage.setItem('shouldNavigateToDashboard', 'true');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    // Logout bildirimini göster
    NotificationService.logoutSuccess();

    // Bildirimin görünmesi için kısa bir gecikme ekle
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setShowRegister(false);
      // Logout sonrası login sayfasına yönlendir
      window.location.href = '/login';
    }, 500);
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
    <>
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
    </>
  );
};

function App() {
  return (
    <>
      <ConfigProvider locale={trTR}>
        <AntApp>
          <AppContent />
        </AntApp>
      </ConfigProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#52c41a',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4d4f',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
