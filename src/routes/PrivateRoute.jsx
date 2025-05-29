import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const isAuth = authService.isAuthenticated();

  console.log("🔒 Acesso verificado. Usuário autenticado?", isAuth);

  return isAuth ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

