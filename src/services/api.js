import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'https://sorttimes-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    // Anexa automaticamente o token JWT, se existir
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('Requisição:', config.url, config.data);
    return config;
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    console.log('Resposta:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Erro na resposta:', error.response?.status, error.response?.data);
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Não exibe o toast de "Não autorizado" na rota de login,
          // pois a própria página já trata o erro de credenciais.
          if (!error.config.url.includes('/auth/login')) {
            toast.error('Não autorizado. Por favor, faça login novamente.');
          }
          break;
        case 403:
          toast.error('Acesso negado.');
          break;
        case 404:
          toast.error('Recurso não encontrado.');
          break;
        case 500:
          toast.error('Erro interno do servidor.');
          break;
        default:
          toast.error(error.response.data?.message || 'Erro na requisição');
      }
    } else if (error.request) {
      toast.error('Não foi possível conectar ao servidor.');
    } else {
      toast.error('Erro ao processar a requisição.');
    }
    
    return Promise.reject(error);
  }
);

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

export default api;
