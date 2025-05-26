import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptador de requisição
api.interceptors.request.use(
  (config) => {
    // Remove 'api/' do início da URL
    if (config.url.startsWith('api/')) {
      config.url = config.url.substring(4);
    }
    
    // Remove barras duplas na URL
    config.url = config.url.replace(/\/\//g, '/');
    
    console.log('📡 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptador de resposta
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);
    
    if (error.response?.status === 405) {
      toast.error('Método não permitido. Por favor, contate o suporte.');
    }
    
    return Promise.reject(error);
  }
);

export default api;