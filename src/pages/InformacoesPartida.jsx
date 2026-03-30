import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaLink, FaCopy, FaTrash, FaTrophy, FaUserTimes, FaAward, FaCalendarAlt, FaCheckCircle, FaLock } from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function InformacoesPartida() {
  const navigate = useNavigate();
  const [partidas, setPartidas] = useState([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [linkGerado, setLinkGerado] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Carrega partidas e jogadores ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resPartidas, resJogadores] = await Promise.all([
          api.get('/agenda'),
          api.get('/jogadores')
        ]);
        setPartidas(resPartidas.data || []);
        setJogadores(resJogadores.data?.data || []);
      } catch (err) {
        toast.error("Erro ao carregar dados do sistema.");
      }
    };
    carregarDados();
  }, []);

  const gerarLinkPublico = async () => {
    if (!partidaSelecionada) return toast.warn("Selecione uma partida primeiro!");
    
    try {
      setCarregando(true);
      const res = await api.post(`/partida-publica/gerar-link/${partidaSelecionada._id}`);
      const url = `${window.location.origin}/partida-publica/${res.data.linkId}`;
      setLinkGerado(url);
      toast.success("Link gerado com sucesso! Válido por 3 dias.");
    } catch (err) {
      toast.error("Erro ao gerar link público.");
    } finally {
      setCarregando(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    toast.info("Link copiado para a área de transferência!");
  };

  const encerrarPartida = async () => {
    if (!window.confirm("Deseja realmente encerrar a partida? Isso bloqueará novas edições no link público.")) return;
    try {
      // Lógica para marcar como encerrada no banco
      toast.success("Partida encerrada!");
    } catch (err) {
      toast.error("Erro ao encerrar partida.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="relative flex flex-col items-center mb-10">
          <motion.button 
            onClick={() => navigate('/dashboard')}
            className="absolute left-0 top-0 p-3 bg-gray-800 rounded-full border border-gray-700 hover:bg-gray-700 transition-all"
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-xl" />
          </motion.button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Painel de Informações da Partida
          </h1>
          <p className="text-gray-400 mt-2">Gerencie eventos e links públicos</p>
        </header>

        {/* Seleção de Partida e Gerador de Link */}
        <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-400" /> Selecionar Partida Agendada
              </label>
              <select 
                className="w-full bg-gray-900 border-gray-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setPartidaSelecionada(partidas.find(p => p._id === e.target.value))}
              >
                <option value="">Escolha uma partida...</option>
                {partidas.map(p => (
                  <option key={p._id} value={p._id}>
                    {new Date(p.data).toLocaleDateString()} - {p.local}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <motion.button
                onClick={gerarLinkPublico}
                disabled={!partidaSelecionada || carregando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  !partidaSelecionada ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
                }`}
              >
                <FaLink /> {carregando ? 'Gerando...' : 'Gerar Link de 72 Horas'}
              </motion.button>
            </div>
          </div>

          {/* Exibição do Link Gerado */}
          <AnimatePresence>
            {linkGerado && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4"
              >
                <div className="flex-1 text-xs sm:text-sm font-mono text-blue-300 break-all bg-gray-900 p-3 rounded-lg border border-blue-900/50">
                  {linkGerado}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={copiarLink}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCopy /> Copiar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Resumo em Tempo Real (Apenas Visualização para o Admin nesta tela) */}
        {partidaSelecionada && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Estatísticas Rápidas */}
            <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-400">
                <FaFutbol /> Gols Registrados
              </h2>
              <div className="space-y-3">
                {partidaSelecionada.gols?.length > 0 ? (
                  partidaSelecionada.gols.map((g, i) => (
                    <div key={i} className="flex justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <span className="font-medium">{g.jogador}</span>
                      <span className="text-gray-500 text-xs">{new Date(g.horario).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum gol registrado via link público ainda.</p>
                )}
              </div>
            </section>

            {/* Destaques e Encerramento */}
            <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl space-y-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <FaAward /> Destaques da Partida
              </h2>
              
              <div className="space-y-4">
                {[
                  { label: 'Melhor da Partida', val: partidaSelecionada.destaques?.melhorPartida, icon: <FaTrophy className="text-yellow-500"/> },
                  { label: 'Pereba da Partida', val: partidaSelecionada.destaques?.perebaPartida, icon: <FaUserTimes className="text-red-400"/> },
                  { label: 'Gol Mais Bonito', val: partidaSelecionada.destaques?.golMaisBonito, icon: <FaCheckCircle className="text-cyan-400"/> }
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl border border-gray-700">
                    <div className="text-lg">{d.icon}</div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-500 font-bold">{d.label}</p>
                      <p className="text-sm font-bold text-white">{d.val || 'Não definido'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                onClick={encerrarPartida}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <FaLock /> Encerrar Registro da Partida
              </motion.button>
            </section>
          </div>
        )}
      </div>
      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
}