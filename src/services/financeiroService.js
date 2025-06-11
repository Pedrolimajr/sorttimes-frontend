import api from './api';

export const financeiroService = {
  // Buscar todas as transações
  getTransacoes: async () => {
    try {
      const response = await api.get('/financeiro/transacoes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Adicionar nova transação
  adicionarTransacao: async (transacao) => {
    try {
      const response = await api.post('/financeiro/transacoes', transacao);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Deletar transação
  deletarTransacao: async (id) => {
    try {
      const response = await api.delete(`/financeiro/transacoes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Atualizar status de pagamento do jogador
  atualizarPagamento: async (jogadorId, mesIndex, dados) => {
    try {
      const response = await api.put(`/jogadores/${jogadorId}/pagamentos/${mesIndex}`, dados);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Buscar jogadores
  getJogadores: async () => {
    try {
      const response = await api.get('/jogadores');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Atualizar jogador
  atualizarJogador: async (jogadorId, dados) => {
    try {
      const response = await api.put(`/jogadores/${jogadorId}`, dados);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Deletar jogador
  deletarJogador: async (jogadorId) => {
    try {
      const response = await api.delete(`/jogadores/${jogadorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};