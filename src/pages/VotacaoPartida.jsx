import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaUserTimes, FaCrown, FaCheckCircle, FaLock, FaUser, FaChartBar, FaShareAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function VotacaoPartida() {
  const { linkId } = useParams();
  const [etapa, setAba] = useState('login'); // login | votacao | admin | enviado
  const [isAdmin, setIsAdmin] = useState(false);
  const [partida, setPartida] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [jogadorAutenticado, setJogadorAutenticado] = useState(null);
  const [credenciais, setCredenciais] = useState({ nome: '', senha: '' });
  const [votos, setVotos] = useState({ melhorPartida: '', perebaPartida: '', golMaisBonito: '' });
  const [carregando, setCarregando] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [mostrarSenhaAdminCred, setMostrarSenhaAdminCred] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/partida-publica/${linkId}`);
        setPartida(res.data.data);
        setJogadores(res.data.jogadores || []);
      } catch (err) {
        toast.error("Link de votação expirado.");
      } finally {
        setCarregando(false);
      }
    };
    fetchData();
  }, [linkId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setCarregando(true);
      const res = await api.post(`/partida-publica/${linkId}/auth-jogador`, {
        nome: credenciais.nome,
        password: credenciais.senha
      });
      
      if (res.data.jaVotou) {
        toast.info("Você já realizou sua votação nesta partida!");
        setAba('enviado');
      } else {
        setJogadorAutenticado(res.data.jogador);
        setAba('votacao');
        toast.success(`Bem-vindo, ${res.data.jogador.nome}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao autenticar.");
    } finally {
      setCarregando(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setCarregando(true);
      const res = await api.post(`/partida-publica/${linkId}/auth-admin`, {
        username: adminCreds.username.trim(),
        password: adminCreds.password.trim()
      });
      if (res.data.success) {
        setIsAdmin(true);
        setAba('admin');
        setShowAdminModal(false);
      }
    } catch (err) {
      toast.error("Acesso negado.");
    } finally {
      setCarregando(false);
    }
  };

  const submeterVotacao = async () => {
    if (!votos.melhorPartida || !votos.perebaPartida || !votos.golMaisBonito) {
      return toast.warn("Por favor, vote em todas as categorias.");
    }
    try {
      const payload = Object.entries(votos).map(([categoria, jogador]) => ({ categoria, jogador }));
      await api.post(`/partida-publica/${linkId}/votar`, { 
        votos: payload, 
        jogadorId: jogadorAutenticado.id 
      });
      setAba('enviado'); // Define a etapa como 'enviado'
      toast.success("Votos enviados com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar votação.");
    }
  };

  const apurarVencedor = (cat) => {
    const vts = partida?.votos?.filter(v => v.categoria === cat) || [];
    if (vts.length === 0) return { nome: 'Ninguém', votos: 0 };
    const contagem = vts.reduce((acc, v) => { acc[v.jogador] = (acc[v.jogador] || 0) + 1; return acc; }, {});
    const sorted = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    return { nome: sorted[0][0], votos: sorted[0][1] };
  };

  const compartilharResultados = () => {
    const msg = `🏆 *RESULTADOS DA PARTIDA* 🏆\n\n` +
                `🌟 Melhor da Partida: ${apurarVencedor('melhorPartida').nome}\n` +
                `🐢 Pereba da Partida: ${apurarVencedor('perebaPartida').nome}\n` +
                `⚽ Gol Mais Bonito: ${apurarVencedor('golMaisBonito').nome}\n\n` +
                `*Universo Cajazeiras*`;
    
    navigator.clipboard.writeText(msg);
    toast.success("Resultados copiados para o WhatsApp!");
  };

  if (carregando && etapa === 'login') return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="max-w-md mx-auto space-y-8">
        <header className="text-center py-6">
          <h1 className="text-2xl font-black text-blue-400 uppercase tracking-tighter">Premiações da Partida</h1>
          <p className="text-gray-500 text-xs font-bold">VOTAÇÃO DOS ATLETAS</p>
        </header>

        <AnimatePresence mode="wait">
          {etapa === 'login' && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              onSubmit={handleLogin}
              className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2 mb-4">
                <FaLock className="mx-auto text-3xl text-gray-600" />
                <h2 className="text-lg font-bold">Identifique-se</h2>
                <p className="text-xs text-gray-500">Use seu nome de cadastro e data de nascimento</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <FaUser className="absolute left-4 top-4 text-gray-500" />
                  <input 
                    type="text" placeholder="Seu nome completo" required
                    className="w-full bg-gray-900 border-none rounded-2xl p-4 pl-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setCredenciais({...credenciais, nome: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-4 text-gray-500" />
                  <input 
                    type={mostrarSenha ? "text" : "password"} placeholder="Data de Nasc. (Ex: 10051990)" required
                    className="w-full bg-gray-900 border-none rounded-2xl p-4 pl-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setCredenciais({...credenciais, senha: e.target.value.replace(/\D/g, '')})}
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-4 top-4 text-gray-500">
                    {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black transition-all shadow-lg">
                ACESSAR VOTAÇÃO
              </button>
              <button type="button" onClick={() => setShowAdminModal(true)} className="w-full text-[10px] text-gray-600 font-bold uppercase tracking-widest hover:text-gray-400">
                Acesso Administrativo
              </button>
            </motion.form>
          )}

          {etapa === 'votacao' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-2xl space-y-8"
            >
              <div className="border-b border-gray-700 pb-4">
                <p className="text-xs text-blue-400 font-bold">LOGADO COMO:</p>
                <p className="text-lg font-black">{jogadorAutenticado?.nome}</p>
              </div>

              {[
                { id: 'melhorPartida', label: 'Melhor da Partida', icon: <FaTrophy className="text-yellow-500" /> },
                { id: 'perebaPartida', label: 'Pereba da Partida', icon: <FaUserTimes className="text-red-400" /> },
                { id: 'golMaisBonito', label: 'Gol Mais Bonito', icon: <FaCrown className="text-cyan-400" /> }
              ].map(premio => (
                <div key={premio.id} className="space-y-3">
                  <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    {premio.icon} {premio.label}
                  </label>
                  <select 
                    value={votos[premio.id]}
                    onChange={(e) => setVotos({...votos, [premio.id]: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Selecione um jogador...</option>
                    {jogadores.map(nome => <option key={nome} value={nome}>{nome}</option>)}
                    <option value="Convidado">Convidado / Outro</option>
                  </select>
                </div>
              ))}

              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={submeterVotacao}
                className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-2xl font-black text-lg transition-all shadow-lg mt-4"
              >
                CONFIRMAR MEUS VOTOS
              </motion.button>
            </motion.div>
          )}

          {etapa === 'admin' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-2xl space-y-6"
            >
              <h2 className="text-xl font-black text-center text-purple-400 flex items-center justify-center gap-2">
                <FaChartBar /> Apuração em Tempo Real
              </h2>
              <div className="space-y-4">
                {[
                  { id: 'melhorPartida', label: 'Melhor da Partida', icon: <FaTrophy className="text-yellow-500" /> },
                  { id: 'perebaPartida', label: 'Pereba da Partida', icon: <FaUserTimes className="text-red-400" /> },
                  { id: 'golMaisBonito', label: 'Gol Mais Bonito', icon: <FaCrown className="text-cyan-400" /> }
                ].map(cat => {
                  const vencedor = apurarVencedor(cat.id);
                  const totalVotosCat = partida.votos?.filter(v => v.categoria === cat.id).length || 0;
                  return (
                    <div key={cat.id} className="bg-gray-900 p-4 rounded-2xl border border-gray-700">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{cat.label}</p>
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                          {totalVotosCat} votos
                        </span>
                      </div>
                      <p className="text-base font-black text-white flex items-center gap-2">
                        {cat.icon} {vencedor.nome}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button onClick={compartilharResultados} className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all">
                <FaShareAlt /> COMPARTILHAR RESULTADOS
              </button>
              <button onClick={() => setAba('login')} className="w-full text-xs text-gray-500">Sair do Modo Admin</button>
            </motion.div>
          )}

          {etapa === 'enviado' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-3xl p-10 border border-gray-700 shadow-2xl text-center space-y-4"
            >
              <FaCheckCircle className="text-6xl text-green-500 mx-auto animate-bounce" />
              <h1 className="text-2xl font-black">Voto Registrado!</h1>
              <p className="text-gray-400 text-sm">Obrigado por participar. O resultado será compartilhado em breve pelo administrador.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Login Administrativo */}
        <AnimatePresence>
          {showAdminModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gray-800 border border-gray-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaLock className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-black text-white">Login Admin</h3>
                  <p className="text-xs text-gray-400">Acesso restrito para apuração</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Usuário"
                    className="w-full bg-gray-900 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    value={adminCreds.username}
                    onChange={(e) => setAdminCreds({...adminCreds, username: e.target.value})}
                    required
                  />
                  <div className="relative">
                    <input 
                      type={mostrarSenhaAdminCred ? "text" : "password"} 
                      placeholder="Senha"
                      className="w-full bg-gray-900 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                      value={adminCreds.password}
                      onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setMostrarSenhaAdminCred(!mostrarSenhaAdminCred)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {mostrarSenhaAdminCred ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAdminModal(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold text-xs"
                    >
                      CANCELAR
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold text-xs"
                    >
                      ENTRAR
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center text-[10px] text-gray-600 py-10 uppercase tracking-widest font-bold">
          SortTimes &copy; {new Date().getFullYear()} - Profissionalismo no Futebol
        </footer>
      </div>
      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
}