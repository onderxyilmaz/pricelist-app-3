import React from 'react';
import NotificationService from '../utils/notification';

const LogoutHandler = ({ children, onLogout }) => {
  const handleLogout = () => {
    NotificationService.logoutSuccess();
    onLogout();
  };

  return children({ onLogout: handleLogout });
};

export default LogoutHandler;