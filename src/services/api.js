import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

export const pagamentosService = {
  async atualizarPagamento(jogadorId, mes, dados) {
    try {
      const response = await api.post(`/api/jogadores/${jogadorId}/pagamentos`, {
        mes,
        ...dados
      });
      
      // Atualiza o localStorage com os novos dados
      const cachedData = JSON.parse(localStorage.getItem('dadosFinanceiro') || '{}');
      
      if (response.data.data.jogador) {
        const jogadoresAtualizados = (cachedData.jogadoresCache || []).map(j => 
          j._id === jogadorId ? response.data.data.jogador : j
        );
        
        const transacoesAtualizadas = response.data.data.transacao 
          ? [response.data.data.transacao, ...(cachedData.transacoesCache || [])]
          : cachedData.transacoesCache || [];

        localStorage.setItem('dadosFinanceiro', JSON.stringify({
          jogadoresCache: jogadoresAtualizados,
          transacoesCache: transacoesAtualizadas,
          lastUpdate: new Date().toISOString()
        }));
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar pagamento:', error);
      throw error;
    }
  }
};

export default api;