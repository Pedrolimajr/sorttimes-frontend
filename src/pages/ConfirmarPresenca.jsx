import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../config/config';
import { GiSoccerKick } from "react-icons/gi";

export default function ConfirmarPresenca() {
  const { linkId } = useParams();
  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/presenca/${linkId}`);
        if (!response.ok) throw new Error('Link inválido ou expirado');

        const data = await response.json();
        if (data.success && data.jogadores) {
          // Força todos como ausentes ao carregar
          const jogadoresComPresencaFalse = data.jogadores.map(j => ({
            ...j,
            presente: false
          }));
          setJogadores(jogadoresComPresencaFalse);
        } else {
          throw new Error(data.message || 'Erro ao carregar dados');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error(error.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [linkId]);

const alternarPresenca = async (jogadorId) => {
    try {
      const jogador = jogadores.find(j => j.id === jogadorId);
      if (!jogador) return;

      const novoEstado = !jogador.presente;
      const response = await fetch(`${BACKEND_URL}/api/presenca/${linkId}/confirmar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jogadorId,
          presente: novoEstado
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar presença');

      const data = await response.json();
      if (data.success) {
        setJogadores(prev =>
          prev.map(j => j.id === jogadorId ? { ...j, presente: novoEstado } : j)
        );

        if (socket) {
          socket.emit('atualizarPresenca', {
            jogadorId,
            presente: novoEstado
          });
        }

        // Mensagens personalizadas com suas escolhas
        if (novoEstado) {
          toast.success('✅ 🏃‍♂️ CONFIRMADO! O peladeiro não falta!', {
            icon: '🏃‍♂️' // Corredor animado
          });
        } else {
          toast.info('🛑😔 SAIU DO JOGO! Esperamos você na próxima!', {
            icon: '👋' // Mão acenando (tchau)
          });
        }
      } else {
        throw new Error(data.message || 'Erro ao atualizar presença');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Falha na conexão: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Confirmação de Presença
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <p className="text-blue-400 text-lg font-medium">
              Confirme sua presença para o fut deste Domingo
            </p>
            <div className="mt-2 text-gray-400 text-sm">
              Clique no botão para confirmar ou desmarcar sua presença
            </div>
          </motion.div>

          <div className="space-y-4">
            {jogadores.map((jogador) => (
              <motion.div
                key={jogador.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                  <span className="text-white font-medium">{jogador.nome}</span>
                </div>
                <button
                  onClick={() => alternarPresenca(jogador.id)}
                  className={`
                    px-2.5 py-2 rounded-lg font-medium transition-all duration-200
                    ${jogador.presente
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'}
                  `}
                >
                  <GiSoccerKick
                    className={`
                      text-sm sm:text-base transform transition-all duration-300
                      ${jogador.presente ? 'rotate-0' : 'rotate-45 opacity-50'}
                    `}
                  />
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-gray-400 text-sm"
          >
            <p>Sua confirmação é importante para organização do Baba!</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
