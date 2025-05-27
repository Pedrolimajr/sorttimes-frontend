import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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

// Log de requisições
api.interceptors.request.use(config => {
  console.log('📡 Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    data: config.data,
    baseURL: config.baseURL
  });
  return config;
});

// Log de respostas
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.data);
    return response;
  },
  error => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;