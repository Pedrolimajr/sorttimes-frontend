import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = authService.isAuthenticated();

  useEffect(() => {
    if (!isAuth) {
      toast.error('Acesso restrito - Faça login para continuar');
    }
  }, [isAuth]);

  return isAuth ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;


