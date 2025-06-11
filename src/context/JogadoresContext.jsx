import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const JogadoresContext = createContext();

export function JogadoresProvider({ children }) {
  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarJogadores = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/jogadores');
      if (response.data.success) {
        setJogadores(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    } finally {
      setCarregando(false);
    }
  };

  const atualizarJogador = (jogadorAtualizado) => {
    setJogadores(prevJogadores => 
      prevJogadores.map(j => 
        j._id === jogadorAtualizado._id ? jogadorAtualizado : j
      )
    );
  };

  const atualizarStatusFinanceiro = async (jogadorId, novoStatus) => {
    try {
      const response = await api.patch(`/jogadores/${jogadorId}/status`, {
        status: novoStatus
      });

      if (response.data.success) {
        atualizarJogador(response.data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarJogadores();
  }, []);

  return (
    <JogadoresContext.Provider value={{
      jogadores,
      carregando,
      carregarJogadores,
      atualizarJogador,
      atualizarStatusFinanceiro
    }}>
      {children}
    </JogadoresContext.Provider>
  );
}

export function useJogadores() {
  const context = useContext(JogadoresContext);
  if (!context) {
    throw new Error('useJogadores deve ser usado dentro de um JogadoresProvider');
  }
  return context;
} 