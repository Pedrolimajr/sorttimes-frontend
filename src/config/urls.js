export const API_URLS = {
  BASE: import.meta.env.VITE_API_URL,
  SOCKET: import.meta.env.VITE_SOCKET_URL,
  ENDPOINTS: {
    JOGADORES: '/jogadores',
    TRANSACOES: '/financeiro/transacoes',
    PAGAMENTOS: (jogadorId) => `/jogadores/${jogadorId}/pagamentos`
  }
};

export default API_URLS;