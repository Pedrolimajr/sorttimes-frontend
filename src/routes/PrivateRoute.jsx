// src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Verificação de roles (se necessário)
  if (requiredRoles.length > 0 && !requiredRoles.some(role => user.roles?.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;


