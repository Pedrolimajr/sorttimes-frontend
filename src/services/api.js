import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Serviço específico para pagamentos
export const pagamentosService = {
  async atualizarPagamento(jogadorId, mes, dados) {
    try {
      const response = await api.post(`/api/jogadores/${jogadorId}/pagamentos`, {
        mes,
        ...dados
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar pagamento:', error);
      throw error;
    }
  }
};

export default api;