import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaIdCard, FaTrophy, FaUserTimes, FaAward, FaCrown, FaClock, FaCircle, FaUser, FaTrash, FaEdit, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function PublicMatchInfo() {
  const { linkId } = useParams();
  const [partida, setPartida] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [inputGol, setInputGol] = useState('');

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

  const vencedorCoroa = getVencedorCoroa();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4 font-sans pb-20">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="text-center py-6">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-tighter">
            Informações da Partida
          </h1>
          <p className="text-gray-500 text-xs font-bold">UNIVERSO CAJAZEIRAS</p>
        </header>

        {/* Seção de Gols */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-gray-700 shadow-2xl">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-green-400">
            <FaFutbol className="animate-bounce" /> Registrar Gol
          </h2>
          <div className="flex gap-2">
            <input 
              list="lista-jogadores"
              value={inputGol}
              onChange={(e) => setInputGol(e.target.value)}
              placeholder="Nome do artilheiro..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-6 mt-6 justify-center">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => registrarEvento('gol', inputGol, 'Preto')}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-500 group-hover:border-white transition-all">
                <FaUser className="text-2xl text-black" />
              </div>
              <span className="text-[10px] font-bold text-gray-400">TIME PRETO</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => registrarEvento('gol', inputGol, 'Amarelo')}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-yellow-400/20 rounded-full flex items-center justify-center border-2 border-yellow-500/50 group-hover:border-yellow-400 transition-all">
                <FaUser className="text-2xl text-yellow-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-400">TIME AMARELO</span>
            </motion.button>
          </div>

          <div className="mt-10 space-y-3">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-700"></div>
              Gols da Partida
              <div className="h-px flex-1 bg-gray-700"></div>
            </h3>
            
            <AnimatePresence>
              {partida.gols?.map((g, idx) => (
                <motion.div
                  key={`${g.jogador}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${bgTime[g.time] || 'bg-gray-800/40 border-gray-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-gray-900/50 border border-gray-700 ${coresTime[g.time]}`}>
                      <FaUser size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold flex items-center gap-2">
                        {g.jogador === vencedorCoroa && <FaCrown className="text-yellow-500 drop-shadow-glow" />}
                        {g.jogador}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">1 GOL • TIME {g.time?.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditarClick('gol', idx, g.jogador)}
                      className="p-3 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button 
                      onClick={() => handleRemoverClick('gol', idx, g.jogador)}
                      className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Seção de Cartões (Grid Rápido) */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { tipo: 'amarelo', cor: 'bg-yellow-400', field: 'cartoesAmarelos', label: 'AMARELO' },
            { tipo: 'vermelho', cor: 'bg-red-500', field: 'cartoesVermelhos', label: 'VERMELHO' },
            { tipo: 'azul', cor: 'bg-blue-500', field: 'cartoesAzuis', label: 'AZUL' }
          ].map(card => (
            <div key={card.tipo} className="bg-gray-800/50 p-3 rounded-3xl border border-gray-700 text-center flex flex-col items-center shadow-xl">
              <div className={`w-8 h-10 ${card.cor} rounded-md mb-3 shadow-lg ring-2 ring-black/20`} />
              <input 
                id={`input-${card.tipo}`}
                list="lista-jogadores"
                placeholder="Nome..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2 text-[10px] text-center outline-none mb-2 focus:border-white transition-all"
              />
              <button 
                onClick={() => {
                  const inp = document.getElementById(`input-${card.tipo}`);
                  registrarEvento(card.tipo, inp.value);
                  inp.value = '';
                }}
                className="bg-gray-700 hover:bg-gray-600 text-[10px] font-black px-2 py-2 rounded-xl w-full transition-all"
              >
                REGISTRAR
              </button>

              {/* Lista de jogadores com este cartão */}
              <div className="mt-3 w-full space-y-2">
                {partida[card.field]?.map((nome, idx) => (
                  <div key={`${nome}-${idx}`} className="text-sm bg-gray-900/80 text-gray-200 py-3 px-2 rounded-xl border border-gray-700 flex justify-between items-center">
                    <span className="truncate flex-1 text-left">{nome}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditarClick(card.tipo, idx, nome)} className="text-blue-500 p-1"><FaEdit size={12}/></button>
                      <button onClick={() => handleRemoverClick(card.tipo, idx, nome)} className="text-red-500 p-1"><FaTrash size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <datalist id="lista-jogadores">
          {jogadores.map(nome => <option key={nome} value={nome} />)}
        </datalist>

        <footer className="text-center text-[11px] text-gray-500 pb-10 space-y-2 mt-10">
          <p>© 2026 SortTimes • Todos os direitos reservados</p>
          <p className="font-black text-gray-400 uppercase tracking-tighter">Desenvolvido por Pedro Júnior</p>
        </footer>
      </div>

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