import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaIdCard, FaTrophy, FaUserTimes, FaAward, FaCrown, FaClock } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function PublicMatchInfo() {
  const { linkId } = useParams();
  const [partida, setPartida] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [inputGol, setInputGol] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // Note que usamos o linkId diretamente na URL conforme definido no backend
        const res = await api.get(`/partida-publica/${linkId}`);
        setPartida(res.data.data);
        setJogadores(res.data.jogadores || []);
      } catch (err) {
        toast.error("Este link expirou ou não existe.");
      } finally {
        setCarregando(false);
      }
    };
    fetchPublicData();
  }, [linkId]);

  const registrarEvento = async (tipo, jogador) => {
    if (!jogador || jogador.trim() === '') return toast.warn("Digite o nome do jogador");
    
    try {
      const res = await api.post(`/partida-publica/${linkId}/evento`, { tipo, jogador });
      setPartida(res.data.data);
      toast.success("Evento registrado com sucesso!");
      if (tipo === 'gol') setInputGol('');
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao registrar evento");
    }
  };

  const salvarDestaques = async (e) => {
    const { name, value } = e.target;
    try {
      const novosDestaques = { ...partida.destaques, [name]: value };
      const res = await api.patch(`/partida-publica/${linkId}/destaques`, novosDestaques);
      setPartida(res.data.data);
      toast.success("Destaque atualizado!");
    } catch (err) {
      toast.error("Erro ao salvar destaque.");
    }
  };

  // Lógica de Ranking para destaque visual
  const getRanking = () => {
    const contagem = {};
    partida?.gols?.forEach(g => {
      contagem[g.jogador] = (contagem[g.jogador] || 0) + 1;
    });
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  };

  if (carregando) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!partida) return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
      <FaClock className="text-6xl text-gray-600 mb-4" />
      <h1 className="text-2xl font-bold">Link Expirado</h1>
      <p className="text-gray-400 mt-2">As informações da partida agora estão disponíveis apenas no painel administrativo.</p>
    </div>
  );

  const ranking = getRanking();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-sans pb-20">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Cabeçalho Fixo */}
        <header className="text-center py-4">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-tighter">
            Informações da Partida
          </h1>
          <p className="text-gray-500 text-xs font-bold">UNIVERSO CAJAZEIRAS</p>
        </header>

        {/* Seção de Gols */}
        <section className="bg-gray-800 rounded-3xl p-5 border border-gray-700 shadow-2xl">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-green-400">
            <FaFutbol className="animate-bounce" /> Registrar Gol
          </h2>
          <div className="flex gap-2">
            <input 
              list="lista-jogadores"
              value={inputGol}
              onChange={(e) => setInputGol(e.target.value)}
              placeholder="Nome do artilheiro..."
              className="flex-1 bg-gray-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button 
              onClick={() => registrarEvento('gol', inputGol)}
              className="bg-green-600 hover:bg-green-700 active:scale-95 px-5 rounded-2xl font-black transition-all shadow-lg"
            >
              GOL
            </button>
          </div>

          {/* Lista de Gols / Ranking */}
          <div className="mt-6 space-y-2">
            {ranking.map(([nome, qtd], idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={nome} 
                className={`flex justify-between items-center p-3 rounded-xl ${idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-700/30'}`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {idx === 0 && <FaCrown className="text-yellow-500" />}
                  {nome}
                </span>
                <span className="bg-gray-900 px-3 py-1 rounded-full text-xs font-bold text-green-400">
                  {qtd} {qtd > 1 ? 'Gols' : 'Gol'}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Seção de Cartões (Grid Rápido) */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { tipo: 'amarelo', cor: 'bg-yellow-400', label: 'Amarelo' },
            { tipo: 'vermelho', cor: 'bg-red-500', label: 'Vermelho' },
            { tipo: 'azul', cor: 'bg-blue-500', label: 'Azul' }
          ].map(card => (
            <div key={card.tipo} className="bg-gray-800 p-3 rounded-2xl border border-gray-700 text-center">
              <div className={`w-6 h-8 ${card.cor} rounded-sm mb-2 shadow-lg mx-auto`} />
              <input 
                list="lista-jogadores"
                placeholder="Nome..."
                className="w-full bg-gray-900 border-none rounded-lg p-2 text-[10px] outline-none mb-1"
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                    registrarEvento(card.tipo, e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <p className="text-[8px] text-gray-500 uppercase font-bold">Enter p/ add</p>
            </div>
          ))}
        </section>

        {/* Seção de Destaques (Selects) */}
        <section className="bg-gray-800 rounded-3xl p-5 border border-gray-700 shadow-2xl">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-6 text-blue-400">
            <FaAward /> Premiações
          </h2>
          <div className="space-y-6">
            {[
              { id: 'melhorPartida', label: 'Melhor da Partida', icon: <FaTrophy className="text-yellow-500" /> },
              { id: 'perebaPartida', label: 'Pereba da Partida', icon: <FaUserTimes className="text-red-400" /> },
              { id: 'golMaisBonito', label: 'Gol Mais Bonito', icon: <FaCrown className="text-cyan-400" /> }
            ].map(premio => (
              <div key={premio.id} className="relative">
                <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
                  {premio.icon} {premio.label}
                </label>
                <select 
                  name={premio.id}
                  value={partida.destaques?.[premio.id] || ''}
                  onChange={salvarDestaques}
                  className="w-full bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="">Selecione...</option>
                  {jogadores.map(nome => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                  <option value="Convidado" className="italic text-gray-500">Convidado / Outro</option>
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Lista de Sugestão Oculta */}
        <datalist id="lista-jogadores">
          {jogadores.map(nome => <option key={nome} value={nome} />)}
        </datalist>

        <footer className="text-center text-[10px] text-gray-600 pb-10 uppercase tracking-widest">
          Sorteio de Times &copy; {new Date().getFullYear()}
        </footer>
      </div>

      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
}