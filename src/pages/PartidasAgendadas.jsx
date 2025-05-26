// src/pages/PartidasAgendadas.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaInfoCircle, 
  FaClock,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const PartidasAgendadas = () => {
  const navigate = useNavigate();
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    const carregarPartidas = async () => {
      try {
        const response = await api.get('/api/agenda');
        setPartidas(response.data);
      } catch (error) {
        toast.error('Erro ao carregar partidas agendadas');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarPartidas();
  }, []);

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const handleEditarPartida = (partida) => {
    navigate('/agendar-partida', { 
      state: { 
        partidaParaEditar: {
          ...partida,
          data: partida.data.split('T')[0] // Formata a data para o input date
        }
      } 
    });
  };

  const handleExcluirPartida = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
      try {
        await api.delete(`/api/agenda/${id}`);
        setPartidas(partidas.filter(partida => partida._id !== id));
        toast.success('Partida excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir partida');
        console.error('Erro:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Carregando partidas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Mantém o efeito de partículas */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: Math.random() * 100, y: Math.random() * 100, opacity: 0.3 }}
            animate={{ y: [null, (Math.random() - 0.5) * 50], x: [null, (Math.random() - 0.5) * 50] }}
            transition={{ duration: 15 + Math.random() * 20, repeat: Infinity, repeatType: "reverse" }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative pt-16 sm:pt-0 text-center"
        >
          {/* Botão Voltar */}
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-4 top-1 sm:top-8 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          {/* Título Centralizado */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaCalendarAlt className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              >
                Partidas Agendadas
              </motion.h1>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base mt-1"
            >
              Gerencie todas as partidas agendadas no sistema
            </motion.p>
          </div>
        </motion.div>

        {/* Botão Agendar Nova Partida */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end mb-6"
        >
          <Link 
            to="/agendar-partida"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-lg shadow-lg transition-all duration-300 text-sm"
          >
            <FaCalendarAlt />
            Agendar Nova Partida
          </Link>
        </motion.div>

        {/* Lista de Partidas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {partidas.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Nenhuma partida agendada ainda.
            </div>
          ) : (
            partidas.map((partida) => (
              <motion.div
                key={partida._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-400 text-sm sm:text-base" />
                    <span className="text-white text-sm sm:text-base">{formatarData(partida.data)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-blue-400 text-sm sm:text-base" />
                    <span className="text-white text-sm sm:text-base">{partida.horario}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-blue-400 text-sm sm:text-base" />
                    <span className="text-white text-sm sm:text-base">{partida.local}</span>
                  </div>
                </div>

                {partida.observacoes && (
                  <div className="mb-3 sm:mb-4 text-gray-300 text-sm">
                    <p className="font-semibold">Observações:</p>
                    <p>{partida.observacoes}</p>
                  </div>
                )}

                {/* Rodapé */}
                <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to={`/informacoes-partida/${partida._id}`}
                      className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-all text-xs sm:text-sm"
                    >
                      <FaInfoCircle className="text-xs sm:text-sm" /> 
                      <span>Detalhes</span>
                    </Link>
                  </motion.div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEditarPartida(partida)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-yellow-400 hover:text-yellow-300 transition-all duration-300"
                      title="Editar partida"
                    >
                      <FaEdit />
                    </motion.button>
                    <motion.button
                      onClick={() => handleExcluirPartida(partida._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-red-400 hover:text-red-300 transition-all duration-300"
                      title="Excluir partida"
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PartidasAgendadas;
