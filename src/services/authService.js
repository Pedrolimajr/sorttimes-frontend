import api from './api';

export const authService = {
  async login(email, senha) {
    try {
      console.log('Tentando login com:', { email });
      
      // Verifique a URL completa antes de fazer a requisição
      const apiUrl = import.meta.env.VITE_API_URL;
      console.log('URL da API:', apiUrl);
      
      const response = await api.post('/auth/login',  // Removi '/api' pois já está na baseURL
        { email, senha },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Mantenha se estiver usando cookies
        }
      );

      console.log('Resposta do login:', response.data);

      if (!response.data.token) {
        throw new Error('Token não recebido na resposta');
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Configura o token para requisições futuras
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data;
    } catch (error) {
      console.error('Detalhes do erro no login:', {
        request: error.config,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      // Tratamento específico para erros 404
      if (error.response?.status === 404) {
        throw new Error('Endpoint de login não encontrado. Verifique a URL.');
      }
      
      // Tratamento para outros erros
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Erro desconhecido ao fazer login';
      throw new Error(errorMessage);
    }
  },
}

  async cadastrar(dados) {
    try {
      console.log('Tentando cadastrar usuário:', dados);
      
      const response = await api.post('/api/auth/cadastro', dados, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        console.log('Cadastro realizado com sucesso:', response.data);
        return response.data;
      }

      throw new Error('Resposta inválida do servidor');
    } catch (error) {
      console.error('Erro no serviço de cadastro:', error.response?.data || error.message);
      throw error;
    }
  },

  logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return false;
    }
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!token && !!user;
  },

  async atualizarEmail(novoEmail, senha) {
    try {
      const token = localStorage.getItem('token');
      console.log('Dados enviados:', { novoEmail, senha });

      const response = await api.put(
        '/api/auth/atualizar-email',
        { novoEmail, senha },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro detalhado:', error.response?.data);
      throw error;
    }
  },

  async atualizarSenha(senhaAtual, novaSenha) {
    try {
      const token = localStorage.getItem('token');
      console.log('Token a ser enviado:', token?.substring(0, 20) + '...');

      const response = await api.put('/api/auth/atualizar-senha',
        { senhaAtual, novaSenha },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error.response?.data || error.message);
      throw error;
    }
  }
};