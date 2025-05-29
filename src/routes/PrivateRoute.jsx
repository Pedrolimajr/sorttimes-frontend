import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  return authService.isAuthenticated() ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;


