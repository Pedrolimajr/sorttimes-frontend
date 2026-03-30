import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaIdCard, FaTrophy, FaUserTimes, FaAward, FaCrown, FaClock, FaCircle, FaUser, FaTrash, FaEdit } from 'react-icons/fa';
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

  const registrarEvento = async (tipo, jogador, time = null) => {
    if (!jogador || jogador.trim() === '') return toast.warn("Digite o nome do jogador");
    
    try {
      const res = await api.post(`/partida-publica/${linkId}/evento`, { tipo, jogador, time });
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
      const novosDestaques = { ...(partida?.destaques || {}), [name]: value };
      const res = await api.patch(`/partida-publica/${linkId}/destaques`, novosDestaques);
      setPartida(res.data.data);
      toast.success("Destaque atualizado!");
    } catch (err) {
      toast.error("Erro ao salvar destaque.");
    }
  };

  const removerEvento = async (tipo, index) => {
    if (!window.confirm("Deseja excluir este registro?")) return;
    try {
      const res = await api.delete(`/partida-publica/${linkId}/evento/${tipo}/${index}`);
      setPartida(res.data.data);
      toast.success("Registro removido");
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const editarEvento = async (tipo, index, nomeAtual) => {
    const novoNome = prompt("Editar nome do jogador:", nomeAtual);
    if (!novoNome || novoNome === nomeAtual) return;
    try {
      const res = await api.patch(`/partida-publica/${linkId}/evento/${tipo}/${index}`, { novoNome });
      setPartida(res.data.data);
      toast.success("Registro atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar");
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
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => registrarEvento('gol', inputGol, 'Preto')}
              className="flex flex-col items-center gap-1 group"
            >
              <FaUser className="text-4xl text-black bg-gray-600 p-1 rounded-full border-2 border-gray-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-400">TIME PRETO</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => registrarEvento('gol', inputGol, 'Amarelo')}
              className="flex flex-col items-center gap-1 group"
            >
              <FaUser className="text-4xl text-yellow-400 bg-yellow-900/20 p-1 rounded-full border-2 border-yellow-500/50 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-400">TIME AMARELO</span>
            </motion.button>
          </div>

          {/* Lista de Ranking com Coroa Dinâmica */}
          <div className="mt-6 space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center border-b border-gray-700 pb-2">Artilharia da Partida</h3>
            {(() => {
              const maxGols = ranking.length > 0 ? ranking[0][1] : 0;
              return ranking.map(([nome, qtd]) => (
                <motion.div 
                  key={nome} 
                  className={`flex justify-between items-center p-3 rounded-xl ${qtd === maxGols && maxGols > 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-700/30'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {qtd === maxGols && maxGols > 0 && <FaCrown className="text-yellow-500 animate-pulse" />}
                    {nome}
                  </span>
                  <span className="bg-gray-900 px-3 py-1 rounded-full text-xs font-bold text-green-400">
                    {qtd} {qtd > 1 ? 'Gols' : 'Gol'}
                  </span>
                </motion.div>
              ));
            })()}
          </div>

          {/* Log de Gols para Edição/Exclusão */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-3 text-center">Últimos Gols Registrados</p>
            <div className="space-y-2">
              {partida.gols?.map((g, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <FaUser className={g.time === 'Amarelo' ? 'text-yellow-400' : 'text-gray-400'} />
                    <span className="text-gray-300">{g.jogador}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editarEvento('gol', idx, g.jogador)} className="text-blue-400 p-1"><FaEdit size={10}/></button>
                    <button onClick={() => removerEvento('gol', idx)} className="text-red-400 p-1"><FaTrash size={10}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção de Cartões (Grid Rápido) */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { tipo: 'amarelo', cor: 'bg-yellow-400', field: 'cartoesAmarelos' },
            { tipo: 'vermelho', cor: 'bg-red-500', field: 'cartoesVermelhos' },
            { tipo: 'azul', cor: 'bg-blue-500', field: 'cartoesAzuis' }
          ].map(card => (
            <div key={card.tipo} className="bg-gray-800 p-3 rounded-2xl border border-gray-700 text-center flex flex-col items-center">
              <div className={`w-6 h-8 ${card.cor} rounded-sm mb-2 shadow-lg mx-auto`} />
              <input 
                id={`input-${card.tipo}`}
                list="lista-jogadores"
                placeholder="Nome..."
                className="w-full bg-gray-900 border-none rounded-lg p-2 text-[10px] outline-none mb-1"
              />
              <button 
                onClick={() => {
                  const inp = document.getElementById(`input-${card.tipo}`);
                  registrarEvento(card.tipo, inp.value);
                  inp.value = '';
                }}
                className="bg-gray-700 hover:bg-gray-600 text-[10px] font-bold px-2 py-1 rounded w-full"
              >
                REGISTRAR
              </button>

              {/* Lista de jogadores com este cartão */}
              <div className="mt-3 w-full space-y-2">
                {partida[card.field]?.map((nome, idx) => (
                  <div key={idx} className="text-xs bg-gray-900 text-gray-200 py-2 px-2 rounded border border-gray-700 flex justify-between items-center group">
                    <span className="truncate flex-1 text-left">{nome}</span>
                    <div className="flex gap-1">
                      <button onClick={() => editarEvento(card.tipo, idx, nome)} className="text-blue-500 p-1"><FaEdit size={8}/></button>
                      <button onClick={() => removerEvento(card.tipo, idx)} className="text-red-500 p-1"><FaTrash size={8}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Lista de Sugestão Oculta */}
        <datalist id="lista-jogadores">
          {jogadores.map(nome => <option key={nome} value={nome} />)}
        </datalist>

        <footer className="text-center text-[10px] text-gray-500 pb-10 space-y-1">
          <p>© 2026 SortTimes • Todos os direitos reservados</p>
          <p className="font-bold text-gray-400">Desenvolvido por Pedro Júnior</p>
        </footer>
      </div>

      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
}