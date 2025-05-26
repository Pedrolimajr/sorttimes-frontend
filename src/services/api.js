import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptador para logs
api.interceptors.request.use(config => {
  console.log('📡 Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    data: config.data
  });
  return config;
});

// Interceptador de resposta
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Serviço de pagamentos
export const pagamentosService = {
  async atualizarPagamento(jogadorId, mes, dados) {
    try {
      // Aqui removemos /api do início da URL
      const response = await api.post(`/jogadores/${jogadorId}/pagamentos`, {
        mes,
        ...dados
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao atualizar pagamento');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar pagamento:', error);
      toast.error('Erro ao atualizar pagamento: ' + error.message);
      throw error;
    }
  }
};

export default api;