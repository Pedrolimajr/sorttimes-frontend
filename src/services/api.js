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
      // Correção na URL - mudando de 'pagamentos' para 'pagamento'
      const url = `jogadores/${jogadorId}/pagamento`;
      console.log('🔄 Atualizando pagamento:', { url, dados });
      
      const response = await api.post(url, {
        mes,
        ...dados
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao atualizar pagamento');
      }

      console.log('✅ Pagamento atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar pagamento:', error);
      throw error;
    }
  },

  // Novo método para buscar pagamentos
  async buscarPagamentos(jogadorId) {
    try {
      const response = await api.get(`jogadores/${jogadorId}/pagamentos`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos:', error);
      throw error;
    }
  }
};

// Interceptor melhorado para requisições
api.interceptors.request.use(
  config => {
    // Remove qualquer /api duplicado
    if (config.url.includes('/api/api/')) {
      config.url = config.url.replace('/api/api/', '/api/');
    }

    console.log('📡 Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor melhorado para respostas
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    // Mensagem amigável baseada no erro
    const mensagem = error.response?.status === 404 
      ? 'Recurso não encontrado'
      : error.response?.data?.message || 'Erro ao processar requisição';
    
    toast.error(mensagem);
    return Promise.reject(error);
  }
);

export default api;