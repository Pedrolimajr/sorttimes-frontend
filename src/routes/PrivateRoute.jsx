import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const isAuth = authService.isAuthenticated();
  console.log("🔒 Verificando autenticação:", isAuth);
  console.log("🔑 Token no localStorage:", localStorage.getItem('token'));
  console.log("👤 User no localStorage:", localStorage.getItem('user'));

  return isAuth ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;


