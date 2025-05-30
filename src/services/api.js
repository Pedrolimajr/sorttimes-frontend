import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
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

// Interceptadores
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    config.url = config.url.replace(/\/\//g, '/'); // Normaliza barra dupla
    console.log('📡 Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    let mensagemErro = 'Erro ao processar requisição';

    switch (error.response?.status) {
      case 405:
        mensagemErro = 'Operação não permitida. Por favor, contate o suporte.';
        break;
      case 404:
        mensagemErro = 'Recurso não encontrado';
        break;
      case 401:
        mensagemErro = 'Não autorizado. Faça login novamente';
        break;
      case 403:
        mensagemErro = 'Acesso negado';
        break;
      case 500:
        mensagemErro = 'Erro interno do servidor';
        break;
    }

    toast.error(mensagemErro);
    return Promise.reject(error);
  }
);

export default api;
