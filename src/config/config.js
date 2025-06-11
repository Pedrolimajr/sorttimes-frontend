export const BACKEND_URL = import.meta.env.PROD 
  ? 'https://sorttimes-backend.onrender.com'
  : 'http://localhost:5000';

export const API_URL = `${BACKEND_URL}/api`;