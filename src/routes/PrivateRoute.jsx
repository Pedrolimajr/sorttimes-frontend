import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Enquanto verifica o token com o backend, evita piscar a tela
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-100">
        Verificando sessão...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;


