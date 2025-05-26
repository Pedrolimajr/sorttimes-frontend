import api from './api';

export const financeiroService = {
  async listarTransacoes() {
    try {
      console.log('Buscando transações...');
      const response = await api.get('/api/financeiro/transacoes');
      console.log('Transações recebidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      throw error;
    }
  },

  async adicionarTransacao(dados) {
    try {
      console.log('Adicionando transação:', dados);
      const response = await api.post('/api/financeiro/transacoes', dados);
      console.log('Resposta do servidor:', response.data);
      
      // Emitir evento de atualização via socket
      if (window.socket) {
        window.socket.emit('nova-transacao', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      throw error;
    }
  },

  async atualizarTransacao(id, dados) {
    try {
      console.log('Atualizando transação:', id, dados);
      const response = await api.put(`/api/financeiro/transacoes/${id}`, dados);
      console.log('Transação atualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  },

  async excluirTransacao(id) {
    try {
      console.log('Excluindo transação:', id);
      const response = await api.delete(`/api/financeiro/transacoes/${id}`);
      console.log('Transação excluída:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  },

  // Novo método para atualizar pagamento do jogador
  async registrarPagamentoJogador(jogadorId, mes) {
    try {
      console.log('Registrando pagamento:', { jogadorId, mes });
      const response = await api.post(`/api/jogadores/${jogadorId}/pagamentos/${mes}`);
      console.log('Pagamento registrado:', response.data);
      
      // Emitir evento de atualização via socket
      if (window.socket) {
        window.socket.emit('pagamento-atualizado', {
          jogadorId,
          mes,
          status: 'pago'
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw error;
    }
  }
};