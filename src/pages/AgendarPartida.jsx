// src/pages/AgendarPartida.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaStickyNote, FaSave, FaShare, FaLink, FaBullhorn } from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion } from "framer-motion";

export default function AgendarPartida() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    data: "",
    horario: "",
    local: "",
    observacoes: ""
  });
  const [loading, setLoading] = useState(false);
  const [jogadores, setJogadores] = useState([]);
  const [error, setError] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // Carrega dados da partida para edição
  useEffect(() => {
    if (location.state?.partidaParaEditar) {
      const partida = location.state.partidaParaEditar;
      // Ajusta a data para meio-dia para evitar problemas de fuso horário
      const dataAjustada = new Date(partida.data + 'T12:00:00').toISOString().split('T')[0];
      
      setFormData({
        data: dataAjustada,
        horario: partida.horario,
        local: partida.local,
        observacoes: partida.observacoes || ''
      });
      setModoEdicao(true);
      setEditandoId(partida._id);
    }
  }, [location.state]);

  // Carrega jogadores para o link de presença
  useEffect(() => {
    const fetchJogadores = async () => {
      try {
        const response = await api.get('/jogadores');
        setJogadores(response.data?.data || []);
      } catch (error) {
        console.error("Erro ao carregar jogadores", error);
      }
    };
    fetchJogadores();
  }, []);

  const gerarLinkPresenca = async () => {
    if (!formData.data || !formData.horario) {
      toast.warning('Preencha a data e o horário para gerar o convite!');
      return;
    }

    const toastId = toast.loading("Gerando convite...");

    try {
      // Combina data e hora para o formato esperado
      const dataJogo = `${formData.data}T${formData.horario}`;

      const response = await api.post('/gerar-link-presenca', {
        jogadores: jogadores.map(j => ({
          id: j._id,
          nome: j.nome,
          presente: false // Inicialmente ninguém confirmou
        })),
        dataJogo
      });

      const linkId = response.data?.linkId;
      if (!linkId) throw new Error('Não foi possível gerar link');

      localStorage.setItem('linkPresencaId', linkId);

      const linkCompleto = `${window.location.origin}/confirmar-presenca/${linkId}`;
      
      const dataObj = new Date(dataJogo);
      const dataFormatada = dataObj.toLocaleString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      const horaFormatada = formData.horario;

      // Capitaliza a primeira letra da data
      const dataFinal = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

      const mensagem = `📢 *CONVOCAÇÃO GERAL* ⚽\n\n` +
        `Atenção, boleiros!\n` +
        `A lista de presença já está liberada! 🔥\n\n` +
        `Confirme sua participação e garanta sua vaga para mais uma grande partida.\n` +
        `Vamos fechar os times e fazer aquele baba de respeito! 💪⚽\n\n` +
        `🗓 *Data:* ${dataFinal} às ${horaFormatada}\n\n` +
        `🔗 *Confirme sua presença clicando no link abaixo:*\n` +
        `👇\n` +
        `${linkCompleto}\n\n` +
        `🔥 _Bora pro jogo!_ 🏃⚽`;
      
      toast.dismiss(toastId);

      if (navigator.share) {
        await navigator.share({
          title: 'Convocação SortTimes',
          text: mensagem,
        });
      } else {
        await navigator.clipboard.writeText(mensagem);
        toast.success('Link de presença copiado para a área de transferência!');
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Erro ao gerar link:', error);
      toast.error('Erro ao gerar link de presença');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ajusta a data para meio-dia antes de enviar
      const dataAjustada = new Date(formData.data + 'T12:00:00').toISOString();
      
      const dadosParaEnviar = {
        ...formData,
        data: dataAjustada
      };

      if (modoEdicao) {
        await api.put(`/agenda/${editandoId}`, dadosParaEnviar);
        toast.success('Partida atualizada com sucesso!');
      } else {
        await api.post('/agenda', dadosParaEnviar);
        toast.success('Partida agendada com sucesso!');
      }
      navigate('/partidas-agendadas');
    } catch (error) {
      console.error("Erro ao salvar partida:", error);
      const errorMsg = error.response?.data?.error || error.message || "Erro ao salvar partida";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Efeito de partículas */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100,
              y: Math.random() * 100,
              opacity: 0.3
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 50],
              x: [null, (Math.random() - 0.5) * 50],
            }}
            transition={{ 
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto w-full">
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
            className="absolute left-4 top-2 sm:top-8 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          {/* Título e Subtítulo */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaCalendarAlt className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              >
                Painel da Partida
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base"
            >
              Gerencie o agendamento e a convocação do time
            </motion.p>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-800/50 backdrop-blur-sm text-white p-4 rounded-lg mb-6 border border-red-700/50"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULÁRIO 1: Agendar Partida (Ocupa 2 colunas) */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700 h-full">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                <FaCalendarAlt className="text-blue-400" />
                {modoEdicao ? 'Editar Detalhes' : 'Agendar Partida'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-gray-300 mb-2 flex items-center gap-2 text-sm font-medium">
                      <FaCalendarAlt className="text-blue-400" /> Data
                    </label>
                    <input 
                      type="date" 
                      value={formData.data} 
                      onChange={(e) => setFormData({...formData, data: e.target.value})} 
                      required 
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 mb-2 flex items-center gap-2 text-sm font-medium">
                      <FaClock className="text-blue-400" /> Horário
                    </label>
                    <input 
                      type="time" 
                      value={formData.horario} 
                      onChange={(e) => setFormData({...formData, horario: e.target.value})} 
                      required 
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 mb-2 flex items-center gap-2 text-sm font-medium">
                    <FaMapMarkerAlt className="text-blue-400" /> Local
                  </label>
                  <input 
                    type="text" 
                    value={formData.local} 
                    onChange={(e) => setFormData({...formData, local: e.target.value})} 
                    required 
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    placeholder="Ex: Arena Society" 
                  />
                </div>

                <div>
                  <label className="text-gray-300 mb-2 flex items-center gap-2 text-sm font-medium">
                    <FaStickyNote className="text-blue-400" /> Observações
                  </label>
                  <textarea 
                    value={formData.observacoes} 
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})} 
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
                    placeholder="Detalhes adicionais..." 
                  />
                </div>

                <div className="pt-4">
                  <motion.button 
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3.5 rounded-lg font-bold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="text-lg" />
                        {modoEdicao ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* FORMULÁRIO 2: Gerar Link de Presença (Ocupa 1 coluna) */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700 h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                <FaBullhorn className="text-green-400" />
                Convocação
              </h2>

              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 py-4">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center border-2 border-gray-600">
                  <FaLink className="text-4xl text-blue-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Link de Presença</h3>
                  <p className="text-gray-400 text-sm">
                    Gere um link automático para compartilhar no WhatsApp e permitir que os jogadores confirmem presença.
                  </p>
                </div>

                {(formData.data && formData.horario) ? (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 w-full">
                    <p className="text-green-400 text-xs font-bold uppercase mb-1">Dados para o convite</p>
                    <p className="text-white font-medium">
                      {new Date(formData.data + 'T12:00:00').toLocaleDateString('pt-BR')} às {formData.horario}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 w-full">
                    <p className="text-yellow-400 text-xs">Preencha data e horário para habilitar</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4">
                <motion.button 
                  type="button"
                  onClick={gerarLinkPresenca}
                  disabled={!formData.data || !formData.horario}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-lg font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FaShare className="text-lg" />
                  Gerar e Compartilhar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
