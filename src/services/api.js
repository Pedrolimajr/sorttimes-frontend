import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 10000
});

// Interceptador de requisição
api.interceptors.request.use(
  (config) => {
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
    console.log('✅ Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);
    
    if (error.code === 'ERR_NETWORK') {
      toast.error('Erro de conexão com o servidor');
    } else if (error.response?.status === 403) {
      toast.error('Acesso não autorizado');
    } else {
      toast.error(error.response?.data?.message || 'Erro ao processar requisição');
    }
    
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