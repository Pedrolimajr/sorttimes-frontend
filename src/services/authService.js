import api from './api';

export const authService = {
  async login(email, senha) {
    try {
      console.log('Tentando login com:', { email });
      
      const response = await api.post('/api/auth/login', 
        { email, senha },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }

      throw new Error('Token não recebido');
    } catch (error) {
      console.error('Erro no login:', error.response?.data || error.message);
      throw error;
    }
  },

  async cadastrar(dados) {
    try {
      const response = await api.post('/api/auth/cadastro', dados);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      const mensagem = error.response?.data?.message || 'Erro ao cadastrar usuário';
      console.error('Erro no cadastro:', error);
      throw new Error(mensagem);
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