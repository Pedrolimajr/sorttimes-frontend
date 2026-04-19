// src/pages/AgendarPartida.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaStickyNote, FaSave, FaShare, FaLink, FaBullhorn, FaTimes, FaCheck } from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";

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

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState({ hour: '20', minute: '00' });
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

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

  const openTimePicker = () => {
    if (formData.horario) {
      const [h, m] = formData.horario.split(':');
      setTempTime({ hour: h, minute: m });
    } else {
      const now = new Date();
      // Arredonda para o próximo intervalo de 5 minutos
      let m = Math.ceil(now.getMinutes() / 5) * 5;
      let h = now.getHours();
      if (m >= 60) { m = 0; h = (h + 1) % 24; }
      setTempTime({ hour: String(h).padStart(2, '0'), minute: String(m).padStart(2, '0') });
    }
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    setFormData({ ...formData, horario: `${tempTime.hour}:${tempTime.minute}` });
    setShowTimePicker(false);
  };

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
          foto: j.foto,
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
        ` *Confirme sua presença clicando no link abaixo:*\n` +
        `👇\n` +
        `🔗 ${linkCompleto}\n\n` +
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
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Aurora Background Effects - Inspirado no Dashboard */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 relative pt-16 sm:pt-0 text-center"
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
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
          </motion.button>

          {/* Título e Subtítulo */}
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1 flex items-center justify-center gap-3">
            <FaCalendarAlt className="text-blue-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              Painel da Partida
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"
          >
            Agendamento e Convocação
          </motion.p>
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
            <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              
              <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                <FaCalendarAlt className="text-blue-400" />
                {modoEdicao ? 'Editar Detalhes' : 'Agendar Partida'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Data do Jogo
                    </label>
                    <input 
                      type="date" 
                      value={formData.data} 
                      onChange={(e) => setFormData({...formData, data: e.target.value})} 
                      required 
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Horário
                    </label>
                    <div 
                      onClick={openTimePicker}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/30 transition-all cursor-pointer flex items-center justify-between hover:bg-white/5"
                    >
                      <span className={formData.horario ? "text-white font-medium text-sm" : "text-slate-600 text-sm"}>
                        {formData.horario || "Selecione o horário"}
                      </span>
                      <FaClock className="text-slate-500" />
                    </div>
                    <input 
                      type="hidden" 
                      value={formData.horario} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Local da Partida
                  </label>
                  <input 
                    type="text" 
                    value={formData.local} 
                    onChange={(e) => setFormData({...formData, local: e.target.value})} 
                    className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm" 
                    placeholder="Ex: Arena Society" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Observações Adicionais
                  </label>
                  <textarea 
                    value={formData.observacoes} 
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})} 
                    className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm resize-none" 
                    placeholder="Detalhes adicionais..." 
                  />
                </div>

                <div className="pt-4">
                  <motion.button 
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white rounded-xl font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm"
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
            <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
              
              <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                <FaBullhorn className="text-green-400" />
                Convocação
              </h2>

              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 py-4">
                <div className="w-24 h-24 bg-black/40 rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl">
                  <FaLink className="text-4xl text-blue-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase tracking-tight text-lg">Convite WhatsApp</h3>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
                    Gere um link automático para compartilhar no WhatsApp e permitir que os jogadores confirmem presença.
                  </p>
                </div>

                {(formData.data && formData.horario) ? (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 w-full text-center">
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Evento Preparado</p>
                    <p className="text-white font-black tracking-tight text-sm">
                      {new Date(formData.data + 'T12:00:00').toLocaleDateString('pt-BR')} às {formData.horario}
                    </p>
                  </div>
                ) : (
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-black/20 px-3 py-2 rounded-lg italic">Aguardando preenchimento...</p>
                )}
              </div>

              <div className="mt-auto pt-4">
                <motion.button 
                  type="button"
                  onClick={gerarLinkPresenca}
                  disabled={!formData.data || !formData.horario}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 text-sm"
                >
                  <FaShare className="text-lg" />
                  Gerar e Compartilhar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Seleção de Horário Personalizado */}
      <AnimatePresence>
        {showTimePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setShowTimePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden"
              className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                  <FaClock className="text-blue-400" /> Escolha o Horário
                </h3>
                <button onClick={() => setShowTimePicker(false)} className="text-slate-500 hover:text-white transition-colors">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Mostrador Digital */}
                <div className="flex justify-center">
                  <div className="bg-black/40 px-10 py-6 rounded-[2rem] border border-white/5 flex items-center gap-2 shadow-inner ring-1 ring-white/5">
                    <span className="text-6xl font-mono font-black text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{tempTime.hour}</span>
                    <span className="text-5xl font-mono font-bold text-blue-500 animate-pulse pb-2">:</span>
                    <span className="text-6xl font-mono font-black text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{tempTime.minute}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-black text-center mb-3 tracking-widest">Horas</p>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                      {hours.map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setTempTime(prev => ({ ...prev, hour: h }))}
                          className={`p-2 rounded-lg text-sm font-bold transition-all ${
                            tempTime.hour === h ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-black text-center mb-3 tracking-widest">Minutos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {minutes.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTempTime(prev => ({ ...prev, minute: m }))}
                          className={`p-2 rounded-lg text-sm font-bold transition-all ${tempTime.minute === m ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowTimePicker(false)}
                  className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleTimeConfirm}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all"
                >
                  <FaCheck /> Confirmar Horário
                </button>
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
}
