import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const isAuth = authService.isAuthenticated();
  return isAuth ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
