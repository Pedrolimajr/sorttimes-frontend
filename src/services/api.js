import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptador para logs de debug
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Requisição:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptador para tratar erros
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 405) {
      toast.error('Erro: Método não permitido. Por favor, contate o suporte.');
    }

    return Promise.reject(error);
  }
);

// Funções auxiliares para pagamentos
const pagamentosAPI = {
  atualizarPagamento: async (jogadorId, mes, dados) => {
    try {
      const response = await api.post(`/jogadores/${jogadorId}/pagamentos`, {
        mes,
        ...dados
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }
  }
};

export { pagamentosAPI };
export default api;