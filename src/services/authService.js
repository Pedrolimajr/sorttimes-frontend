import api from './api';

export const authService = {
  async login(email, senha) {
    try {
      console.log('Tentando login com:', { email });
      
      const response = await api.post('/auth/login', 
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

isAuthenticated: () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return false;

    const parsedUser = JSON.parse(user);
    return typeof parsedUser === 'object' && Object.keys(parsedUser).length > 0;
  } catch (error) {
    console.error("Erro em isAuthenticated:", error);
    return false;
  }
},


  async atualizarEmail(novoEmail, senha) {
    try {
      const token = localStorage.getItem('token');
      console.log('Dados enviados:', { novoEmail, senha });

      const response = await api.put(
        '/auth/atualizar-email',
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

      const response = await api.put('/auth/atualizar-senha',
        { senhaAtual, novaSenha },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Após alterar a senha, força logout para invalidar sessão antiga
      authService.logout();

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error.response?.data || error.message);
      throw error;
    }
  }
};