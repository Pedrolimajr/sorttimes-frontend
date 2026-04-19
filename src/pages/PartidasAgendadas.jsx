// src/pages/PartidasAgendadas.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaInfoCircle, 
  FaClock,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaTimesCircle
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';

const PartidasAgendadas = () => {
  const navigate = useNavigate();
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmDeletePartida, setConfirmDeletePartida] = useState({ open: false, partida: null });


  useEffect(() => {
    const carregarPartidas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Faça login para ver as partidas agendadas');
          setLoading(false);
          return;
        }

        const response = await api.get('/agenda');
        const data = response.data?.data || response.data;
        setPartidas(data || []);
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

  // Abre o modal de confirmação ao tentar excluir
  const handleExcluirPartida = (id) => {
    const partida = partidas.find(p => p._id === id);
    if (!partida) {
      toast.error('Partida não encontrada');
      return;
    }

    setConfirmDeletePartida({ open: true, partida });
  };

  // Executa a exclusão (otimista com rollback)
  const performDeletePartida = async (id) => {
    const original = [...partidas];
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Faça login para excluir partidas');
        setConfirmDeletePartida({ open: false, partida: null });
        return;
      }

      // Atualização otimista
      setPartidas(prev => prev.filter(partida => partida._id !== id));

      await api.delete(`/agenda/${id}`);

      toast.success('Partida excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir partida:', error);
      setPartidas(original);
      toast.error('Erro ao excluir partida');
    } finally {
      setLoading(false);
      setConfirmDeletePartida({ open: false, partida: null });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl mx-auto w-full">
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
              backgroundColor: "rgba(15, 23, 42, 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-0 -top-2 sm:top-2 w-12 h-12 flex items-center justify-center bg-slate-900/50 text-gray-200 rounded-2xl transition-all duration-300 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-blue-500/10"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
          </motion.button>

          {/* Título Centralizado */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaCalendarAlt className="text-blue-400 text-3xl sm:text-4xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  Partidas Agendadas
                </span>
              </motion.h1>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"
            >
              Gestão de Calendário
            </motion.p>
          </div>
        </motion.div>

        {/* Botão Agendar Nova Partida */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end mb-10"
        >
          <Link 
            to="/agendar-partida"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all"
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
          className="space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar pr-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Data do Jogo</span>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-400" />
                      <span className="text-white font-black text-sm uppercase tracking-tight">{formatarData(partida.data)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horário</span>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-blue-400" />
                      <span className="text-white font-black text-sm tracking-tight">{partida.horario}</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Localização</span>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-blue-400" />
                      <span className="text-white font-black text-sm uppercase tracking-tight truncate">{partida.local}</span>
                    </div>
                  </div>
                </div>

                {partida.observacoes && (
                  <div className="mb-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Informações Adicionais</span>
                    <p className="text-slate-400 text-xs italic leading-relaxed">{partida.observacoes}</p>
                  </div>
                )}

                {/* Rodapé */}
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to={`/informacoes-partida/${partida._id}`}
                      className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all"
                    >
                      <FaInfoCircle /> 
                      <span>Detalhes</span>
                    </Link>
                  </motion.div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEditarPartida(partida)}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(234, 179, 8, 0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-slate-800/50 rounded-xl text-yellow-500 border border-white/5 transition-all"
                      title="Editar partida"
                    >
                      <FaEdit />
                    </motion.button>
                    <motion.button
                      onClick={() => handleExcluirPartida(partida._id)}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-slate-800/50 rounded-xl text-red-500 border border-white/5 transition-all"
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

      <AnimatePresence>
        {confirmDeletePartida.open && confirmDeletePartida.partida && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setConfirmDeletePartida({ open: false, partida: null })}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 sm:px-6 pt-4 pb-2 border-b border-gray-700">
                <h3 className="text-lg sm:text-xl font-bold text-white">Confirmar exclusão</h3>
                <motion.button
                  onClick={() => setConfirmDeletePartida({ open: false, partida: null })}
                  whileHover={{ rotate: 90 }}
                  className="text-gray-400 hover:text-white text-sm sm:text-base"
                >
                  <FaTimesCircle />
                </motion.button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-300">
                  Você está prestes a excluir a partida marcada para <span className="font-medium text-white">{formatarData(confirmDeletePartida.partida.data)}</span> às <span className="font-medium text-white">{confirmDeletePartida.partida.horario}</span>. Esta ação é permanente e não pode ser desfeita.
                </p>
                <div className="mt-3">
                  {confirmDeletePartida.partida.local && (
                    <p className="text-xs text-gray-400">Local: <span className="font-medium text-white">{confirmDeletePartida.partida.local}</span></p>
                  )}
                  {confirmDeletePartida.partida.observacoes && (
                    <p className="text-xs text-gray-400">Observações: <span className="font-medium text-white">{confirmDeletePartida.partida.observacoes}</span></p>
                  )}
                </div>
              </div>

              <div className="mt-2 sm:mt-4 px-4 sm:px-6 pb-4 pt-2 border-t border-gray-700 flex justify-end gap-2 sm:gap-3 bg-gray-800/90">
                <motion.button
                  onClick={() => setConfirmDeletePartida({ open: false, partida: null })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={() => performDeletePartida(confirmDeletePartida.partida._id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
                >
                  Confirmar exclusão
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

    </div>
  );
};

export default PartidasAgendadas;
