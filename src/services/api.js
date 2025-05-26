import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sorttimes-backend.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

export const pagamentosService = {
  async atualizarPagamento(jogadorId, mes, dados) {
    try {
      // Removido /api do início da URL
      const response = await api.post(`/jogadores/${jogadorId}/pagamentos`, {
        mes,
        ...dados
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao atualizar pagamento');
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }
  }
};

export default api;