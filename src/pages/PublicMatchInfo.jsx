

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaIdCard, FaTrophy, FaUserTimes, FaAward, FaCrown, FaClock, FaCircle, FaUser, FaTrash, FaEdit, FaCheck, FaTimes, FaExclamationTriangle, FaStickyNote } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function PublicMatchInfo() {
  const { linkId } = useParams();
  const [partida, setPartida] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [inputGol, setInputGol] = useState('');
  const [modalSelecao, setModalSelecao] = useState({ aberto: false, tipo: '', inputId: null });
  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [expireAt, setExpireAt] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Estados para Modais
  const [modalConfirm, setModalConfirm] = useState({ aberto: false, tipo: '', index: null, titulo: '', msg: '' });
  const [modalEdit, setModalEdit] = useState({ aberto: false, tipo: '', index: null, valor: '', nomeOriginal: '' });

  const coresTime = { Amarelo: 'text-yellow-400', Preto: 'text-gray-400' };
  const bgTime = { Amarelo: 'bg-yellow-400/10 border-yellow-500/30', Preto: 'bg-gray-800/40 border-gray-700' };

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // Note que usamos o linkId diretamente na URL conforme definido no backend
        const res = await api.get(`/partida-publica/${linkId}`);
        console.log("[DEBUG] Jogadores recebidos do servidor:", res.data.jogadores);
        setPartida(res.data.data);
        setJogadores(res.data.jogadores || []);
        setExpireAt(res.data.expireAt);
      } catch (err) {
        toast.error("Este link expirou ou não existe.");
      } finally {
        setCarregando(false);
      }
    };
    fetchPublicData();
  }, [linkId]);

  // Efeito para contagem regressiva
  useEffect(() => {
    if (!expireAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiration = new Date(expireAt);
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Expirado!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [expireAt]);

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

  const handleRemoverClick = (tipo, index, jogador) => {
    setModalConfirm({
      aberto: true,
      tipo,
      index,
      titulo: 'Confirmar Exclusão',
      msg: `Deseja realmente remover o registro de ${tipo === 'gol' ? 'gol' : 'cartão'} para ${jogador}?`
    });
  };

  const confirmarRemover = async () => {
    const { tipo, index } = modalConfirm;
    try {
      const res = await api.delete(`/partida-publica/${linkId}/evento/${tipo}/${index}`);
      setPartida(res.data.data);
      toast.success("Registro removido");
    } catch (err) {
      toast.error("Erro ao remover");
    } finally {
      setModalConfirm({ ...modalConfirm, aberto: false });
    }
  };

  const handleEditarClick = (tipo, index, nomeAtual) => {
    setModalEdit({ aberto: true, tipo, index, valor: nomeAtual, nomeOriginal: nomeAtual });
  };

  const confirmarEditar = async (e) => {
    if (e) e.preventDefault();
    const { tipo, index, valor, nomeOriginal } = modalEdit;
    if (!valor || valor.trim() === '' || valor === nomeOriginal) {
      return setModalEdit({ ...modalEdit, aberto: false });
    }
    try {
      const res = await api.patch(`/partida-publica/${linkId}/evento/${tipo}/${index}`, { novoNome: valor });
      setPartida(res.data.data);
      toast.success("Registro atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar");
    } finally {
      setModalEdit({ ...modalEdit, aberto: false });
    }
  };

  const salvarNotas = async (valor) => {
    try {
      const res = await api.patch(`/partida-publica/${linkId}/notas`, { notas: valor });
      setPartida(res.data.data);
      toast.success("Anotações salvas!");
    } catch (err) {
      toast.error("Erro ao salvar anotações");
    }
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

  // Lógica da Coroa: Apenas para o artilheiro isolado
  const getVencedorCoroa = () => {
    const contagem = {};
    partida?.gols?.forEach(g => contagem[g.jogador] = (contagem[g.jogador] || 0) + 1);
    const ranking = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    
    if (ranking.length === 0) return null;
    const maxGols = ranking[0][1];
    if (maxGols === 0) return null;
    
    const vencedores = ranking.filter(r => r[1] === maxGols);
    return vencedores.length === 1 ? vencedores[0][0] : null;
  };

  // Lógica para agrupar gols por jogador e somar as quantidades
  const getGolsAgrupados = () => {
    const agrupados = [];
    if (!partida?.gols) return agrupados;
    
    partida.gols.forEach((g, idx) => {
      const indexAgrupado = agrupados.findIndex(item => item.jogador === g.jogador);
      if (indexAgrupado > -1) {
        agrupados[indexAgrupado].total += 1;
        agrupados[indexAgrupado].ultimoIndex = idx; // Mantém o índice mais recente para edição/exclusão
      } else {
        agrupados.push({
          jogador: g.jogador,
          total: 1,
          time: g.time,
          ultimoIndex: idx
        });
      }
    });
    return agrupados.sort((a, b) => b.total - a.total);
  };

  const golsAgrupados = getGolsAgrupados();
  const vencedorCoroa = getVencedorCoroa();

  // Cálculo dinâmico do placar
  const golsPreto = partida?.gols?.filter(g => g.time === 'Preto').length || 0;
  const golsAmarelo = partida?.gols?.filter(g => g.time === 'Amarelo').length || 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4 font-sans pb-20">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center py-6">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-tighter">
            Informações da Partida
          </h1>
          <p className="text-gray-500 text-xs font-bold">UNIVERSO CAJAZEIRAS</p>
          {countdown && (
            <div className="mt-2 inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
              <p className="text-[10px] text-red-400 font-bold">Este link expira em: {countdown}</p>
            </div>
          )}
        </header>

        {/* Seção de Gols */}
        <section className="bg-gray-800/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-gray-700 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

          {/* Placar Bonito da Partida */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-600"></div>
            <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">PLACAR</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-600"></div>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 bg-black/40 p-6 rounded-[2rem] border border-gray-700/50 shadow-inner ring-1 ring-white/5 group">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <img src="/img/preto.png" className="w-14 h-14 object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500" alt="Preto" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">PRETO</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-6xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{golsPreto}</span>
              <span className="text-2xl font-black text-gray-700 italic">VS</span>
              <span className="text-6xl font-black text-yellow-400 tabular-nums drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">{golsAmarelo}</span>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <img src="/img/amarelo.png" className="w-14 h-14 object-contain drop-shadow-[0_5px_15px_rgba(250,204,21,0.2)] transform group-hover:scale-110 transition-transform duration-500" alt="Amarelo" />
              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-tighter">AMARELO</span>
            </div>
          </div>

          {/* Formulário de Registro (Abaixo do Placar) */}
          <div className="mt-8 bg-gray-900/40 p-6 rounded-3xl border border-gray-700/50 shadow-inner">
            <h2 className="flex items-center gap-2 text-md font-bold mb-4 text-green-400">
              <FaFutbol className="animate-bounce" /> Registrar Novo Gol
            </h2>
            <div className="flex gap-2 relative">
              <input 
                value={inputGol}
                onChange={(e) => setInputGol(e.target.value)}
                placeholder="Nome do Jogador..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl p-4 pr-12 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all text-white"
              />
              <button 
                type="button"
                onClick={() => setModalSelecao({ aberto: true, tipo: 'gol', inputId: null })}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                title="Escolher da lista"
              >
                <FaUser />
              </button>
            </div>
            <div className="flex gap-6 mt-6 justify-center">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => registrarEvento('gol', inputGol, 'Preto')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center border-2 border-gray-600 group-hover:border-white transition-all p-2 overflow-hidden shadow-lg">
                  <img src="/img/preto.png" className="w-full h-full object-contain" alt="Camisa Preta" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">TIME PRETO</span>
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => registrarEvento('gol', inputGol, 'Amarelo')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center border-2 border-yellow-500/30 group-hover:border-yellow-400 transition-all p-2 overflow-hidden shadow-lg">
                  <img src="/img/amarelo.png" className="w-full h-full object-contain" alt="Camisa Amarela" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">TIME AMARELO</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-700"></div>
              Gols da Partida
              <div className="h-px flex-1 bg-gray-700"></div>
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              <AnimatePresence>
                {golsAgrupados.map((g) => (
                  <motion.div
                    key={g.jogador}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${bgTime[g.time] || 'bg-gray-800/40 border-gray-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-900/50 border border-gray-700 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
                        <img src={`/img/${g.time?.toLowerCase()}.png`} className="w-full h-full object-contain" alt={g.time} />
                      </div>
                      <div>
                        <p className="text-sm font-bold flex items-center gap-2">
                          {g.jogador === vencedorCoroa && <FaCrown className="text-yellow-500 drop-shadow-glow" />}
                          {g.jogador}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-green-500/50 uppercase">{g.total} {g.total > 1 ? 'GOLS' : 'GOL'}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">• TIME {g.time?.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleRemoverClick('gol', g.ultimoIndex, g.jogador)}
                        className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Seção de Anotações do Juiz */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-gray-700 shadow-2xl">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-blue-400">
            <FaStickyNote /> Anotações do Juiz
          </h2>
          <textarea
            value={partida?.observacoes || ''}
            onChange={(e) => setPartida({ ...partida, observacoes: e.target.value })}
            onBlur={(e) => salvarNotas(e.target.value)}
            placeholder="Clique aqui para escrever observações sobre a partida (ex: conduta, clima, incidentes)..."
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-32 placeholder:text-gray-600 shadow-inner"
          />
          <div className="mt-2 text-[10px] text-gray-500 italic text-right">
            * As anotações são salvas automaticamente quando você clica fora da caixa.
          </div>
        </section>

        {/* Seção de Cartões (Grid Rápido) */}
    <h2 className="flex items-center justify-center gap-2 text-lg font-bold mb-4 text-orange-400">
      <FaIdCard /> Cartões da Partida
    </h2>
        <section className="grid grid-cols-3 gap-3">
          {[
            { tipo: 'amarelo', cor: 'bg-yellow-400', field: 'cartoesAmarelos', label: 'AMARELO', shadow: 'shadow-yellow-500/20' },
            { tipo: 'vermelho', cor: 'bg-red-500', field: 'cartoesVermelhos', label: 'VERMELHO', shadow: 'shadow-red-500/20' },
            { tipo: 'azul', cor: 'bg-blue-500', field: 'cartoesAzuis', label: 'AZUL', shadow: 'shadow-blue-500/20' }
          ].map(card => (
            <div 
              key={card.tipo} 
              className={`bg-gray-800/60 backdrop-blur-md p-4 rounded-3xl border border-gray-700 text-center flex flex-col items-center shadow-2xl transition-all hover:scale-[1.02] ${card.shadow}`}
            >
              <div className={`w-8 h-12 ${card.cor} rounded-lg mb-4 shadow-lg ring-2 ring-black/20`} />
              <div className="relative w-full mb-3">
                <input 
                  id={`input-${card.tipo}`}
                  placeholder="Nome do Jogador..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 pr-10 text-sm text-center outline-none focus:border-white transition-all text-white placeholder:text-gray-600"
                />
                <button 
                  type="button"
                  onClick={() => setModalSelecao({ aberto: true, tipo: card.tipo, inputId: `input-${card.tipo}` })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  title="Escolher da lista"
                >
                  <FaUser size={12} />
                </button>
              </div>
              <button 
                onClick={() => {
                  const inp = document.getElementById(`input-${card.tipo}`);
                  registrarEvento(card.tipo, inp.value);
                  inp.value = '';
                }}
                className="bg-gray-700 hover:bg-gray-600 text-xs font-black px-2 py-3 rounded-xl w-full transition-all"
              >
                REGISTRAR
              </button>

              {/* Lista de jogadores com este cartão - Aplicado scroll oculto para manter padrão */}
              <div className="mt-3 w-full space-y-2 max-h-[150px] overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {partida[card.field]?.map((nome, idx) => (
                  <div key={`${nome}-${idx}`} className="text-sm bg-gray-900/80 text-white font-bold py-3 px-3 rounded-2xl border border-gray-700 flex justify-between items-center shadow-inner">
                    <span className="truncate flex-1 text-left">{nome}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleRemoverClick(card.tipo, idx, nome)} className="text-red-500 p-1"><FaTrash size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Modal de Seleção de Jogador */}
      <AnimatePresence>
        {modalSelecao.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-700 p-6 rounded-3xl max-w-sm w-full flex flex-col max-h-[70vh] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <FaUser className="text-blue-400" /> Escolher Jogador
                </h3>
                <button onClick={() => setModalSelecao({ aberto: false, tipo: '', inputId: null })} className="text-gray-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>
              
              <div className="relative mb-4">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Pesquisar jogador..."
                  value={filtroPesquisa}
                  onChange={(e) => setFiltroPesquisa(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <FaUser className="absolute left-3 top-3.5 text-gray-500 text-sm" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {carregando ? (
                  <p className="text-center text-gray-500 py-4 text-sm italic animate-pulse">Carregando lista...</p>
                ) : (jogadores.filter(j => {
                    const nome = typeof j === 'string' ? j : j?.nome || '';
                    return nome.toLowerCase().includes(filtroPesquisa.toLowerCase());
                  }).length === 0) ? (
                  <p className="text-center text-gray-500 py-4 text-sm italic">Nenhum jogador encontrado.</p>
                ) : (
                  jogadores
                  .filter(j => {
                    const nome = typeof j === 'string' ? j : j?.nome || '';
                    return nome.toLowerCase().includes(filtroPesquisa.toLowerCase());
                  })
                  .map((j, index) => {
                    const nome = typeof j === 'string' ? j : j?.nome || '';
                    return (
                    <button
                      key={index}
                      onClick={() => {
                        if (modalSelecao.tipo === 'gol') {
                          setInputGol(nome);
                        } else if (modalSelecao.inputId) {
                          const input = document.getElementById(modalSelecao.inputId);
                          if (input) input.value = nome;
                        }
                        setModalSelecao({ aberto: false, tipo: '', inputId: null });
                        setFiltroPesquisa('');
                      }}
                      className="w-full text-left p-3 rounded-xl bg-gray-900/50 hover:bg-gray-700 border border-gray-700 transition-colors text-sm font-bold text-white truncate"
                    >
                      {nome}
                    </button>
                    );
                  })
                )}
              </div>
              <button 
                onClick={() => setModalSelecao({ aberto: false, tipo: '', inputId: null })} 
                className="mt-4 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xs text-white uppercase">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação */}
      <AnimatePresence>
        {modalConfirm.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 border border-gray-700 p-6 rounded-3xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle size={30} />
              </div>
              <h3 className="text-xl font-bold mb-2">{modalConfirm.titulo}</h3>
              <p className="text-gray-400 text-sm mb-6">{modalConfirm.msg}</p>
              <div className="flex gap-3">
                <button onClick={() => setModalConfirm({ ...modalConfirm, aberto: false })} className="flex-1 py-3 rounded-2xl bg-gray-700 font-bold">VOLTAR</button>
                <button onClick={confirmarRemover} className="flex-1 py-3 rounded-2xl bg-red-600 font-bold">EXCLUIR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      <AnimatePresence>
        {modalEdit.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-800 border border-gray-700 p-6 rounded-3xl max-w-sm w-full">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaEdit className="text-blue-400" /> Editar Registro</h3>
              <form onSubmit={confirmarEditar} className="space-y-4">
                <input 
                  autoFocus
                  value={modalEdit.valor}
                  onChange={(e) => setModalEdit({ ...modalEdit, valor: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalEdit({ ...modalEdit, aberto: false })} className="flex-1 py-3 rounded-2xl bg-gray-700 font-bold">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 font-bold">SALVAR</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
}
