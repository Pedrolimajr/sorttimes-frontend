import api from './api';

export const financeiroService = {
  async listarTransacoes() {
    const response = await api.get('/api/financeiro/transacoes');
    return response.data;
  },

  async adicionarTransacao(dados) {
    const response = await api.post('/api/financeiro/transacoes', dados);
    return response.data;
  },

  async atualizarTransacao(id, dados) {
    const response = await api.put(`/api/financeiro/transacoes/${id}`, dados);
    return response.data;
  },

  async excluirTransacao(id) {
    const response = await api.delete(`/api/financeiro/transacoes/${id}`);
    return response.data;
  }
};