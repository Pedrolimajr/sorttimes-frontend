export const PLANOS = {
  GRATUITO: {
    id: 'free',
    nome: 'Gratuito',
    preco: 0,
    recursos: [
      'Criar 1 time',
      'Até 15 jogadores',
      'Sorteio básico'
    ]
  },
  PRO: {
    id: 'pro',
    nome: 'Profissional',
    preco: 19.90,
    recursos: [
      'Times ilimitados',
      'Jogadores ilimitados', 
      'Sorteios avançados',
      'Histórico completo',
      'Estatísticas detalhadas'
    ]
  },
  PREMIUM: {
    id: 'premium',
    nome: 'Premium',
    preco: 39.90,
    recursos: [
      'Todos recursos do PRO',
      'API de integração',
      'Suporte prioritário',
      'Personalização completa',
      'Backup na nuvem'
    ]
  }
};