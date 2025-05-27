import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Serviço de pagamentos
export const pagamentosAPI = {
  async atualizarPagamento(jogadorId, mes, dados) {
    try {
      const url = `jogadores/${jogadorId}/pagamentos`;
      console.log('🔄 Atualizando pagamento:', { url, dados });
      
      const response = await api.post(url, {
        mes,
        ...dados
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao atualizar pagamento');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar pagamento:', error);
      throw error;
    }
  }
};

// Interceptador de requisição
api.interceptors.request.use(
  config => {
    // Remove duplicação do /api
    config.url = config.url.replace('/api/api/', '/api/');
    
    console.log('📡 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL
    });
    return config;
  },
  error => Promise.reject(error)
);

// Interceptador de resposta com tratamento detalhado de erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api;