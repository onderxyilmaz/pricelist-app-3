import React from 'react';

const LogoutHandler = ({ children, onLogout }) => {
  // Logout bildirimi App.jsx'deki handleLogout fonksiyonunda gösteriliyor
  // Bu component sadece logout işlemini yönetiyor
  return children({ onLogout });
};

export default LogoutHandler;