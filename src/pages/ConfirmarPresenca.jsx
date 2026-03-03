
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../services/api';
import { GiSoccerKick } from "react-icons/gi";
import { FaUser, FaLock, FaCalendarAlt, FaUserShield, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ConfirmarPresenca() {
  const { linkId } = useParams();

  // Modo de visualização: jogador ou admin
  const [modo, setModo] = useState('jogador'); // 'jogador' | 'admin'

  // Estado jogador
  const [autenticado, setAutenticado] = useState(false);
  const [jogadorLogado, setJogadorLogado] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Estado admin
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: ''
  });
  const [jogadoresAdmin, setJogadoresAdmin] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [submetendo, setSubmetendo] = useState(false);
  const [eventoData, setEventoData] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    password: '' // DDMMAAAA
  });

  // Nome salvo localmente para agilizar login de jogador
  const [nomeSalvo, setNomeSalvo] = useState('');
  const [usarNomeSalvo, setUsarNomeSalvo] = useState(true);
  const [mostrarSenhaJogador, setMostrarSenhaJogador] = useState(false);

  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);

  // Carregamento inicial dos dados do evento (sem lista de jogadores)
  useEffect(() => {
    const carregarEvento = async () => {
      try {
        setCarregando(true);
        const response = await api.get(`/presenca/${linkId}`);
        
        if (response.data.success) {
          const { dataJogo } = response.data.data;
          if (dataJogo) {
            const dataFormatada = new Date(dataJogo).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            });
            setEventoData(dataFormatada);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
        toast.error('Link inválido ou expirado');
      } finally {
        setCarregando(false);
      }
    };

    carregarEvento();

    // Carrega nome salvo (se existir) para agilizar login do jogador
    const storageKey = `presenca_nome_${linkId}`;
    const salvo = localStorage.getItem(storageKey);
    if (salvo) {
      setNomeSalvo(salvo);
      setFormData(prev => ({ ...prev, nome: salvo }));
      setUsarNomeSalvo(true);
    } else {
      setUsarNomeSalvo(false);
    }
  }, [linkId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.password) {
      toast.warn('Preencha seu nome e data de nascimento (DDMMAAAA)');
      return;
    }

    try {
      setSubmetendo(true);
      const storageKey = `presenca_nome_${linkId}`;

      // Usa o nome salvo quando disponível e habilitado
      const nomeParaLogin = usarNomeSalvo && nomeSalvo ? nomeSalvo : formData.nome;

      const response = await api.post(`/presenca/${linkId}/auth`, {
        nome: nomeParaLogin,
        password: formData.password
      });

      if (response.data.success) {
        setJogadorLogado(response.data.jogador);
        setSessionId(response.data.sessionId || null);
        setAutenticado(true);

        // Salva nome usado para agilizar próximos acessos
        if (nomeParaLogin) {
          localStorage.setItem(storageKey, nomeParaLogin);
          setNomeSalvo(nomeParaLogin);
          setUsarNomeSalvo(true);
        }

        toast.success(`Bem-vindo, ${response.data.jogador.nome}!`);
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      toast.error(error.response?.data?.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally {
      setSubmetendo(false);
    }
  };

  const alternarPresenca = async () => {
    if (!jogadorLogado) return;

    try {
      setSubmetendo(true);
      const novoEstado = !jogadorLogado.presente;
      const payload = sessionId 
        ? { sessionId, presente: novoEstado }
        : { jogadorId: jogadorLogado.id, presente: novoEstado };

      const response = await api.post(`/presenca/${linkId}/confirmar`, payload);

      if (response.data.success) {
        setJogadorLogado(prev => ({ ...prev, presente: novoEstado }));
        toast.success(novoEstado ? '✅ Presença confirmada!' : '❌ Presença removida!');
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar presença');
    } finally {
      setSubmetendo(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!adminForm.username || !adminForm.password) {
      toast.warn('Informe usuário e senha de admin');
      return;
    }

    try {
      setSubmetendo(true);
      const response = await api.post(`/presenca/${linkId}/admin-auth`, {
        username: adminForm.username,
        password: adminForm.password
      });

      if (response.data.success) {
        const { dataJogo, jogadores } = response.data.data || {};

        if (dataJogo && !eventoData) {
          const dataFormatada = new Date(dataJogo).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
          setEventoData(dataFormatada);
        }

        setJogadoresAdmin(jogadores || []);
        setAdminAutenticado(true);
        toast.success('Login de admin realizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no login admin:', error);
      toast.error(error.response?.data?.message || 'Erro ao autenticar admin.');
    } finally {
      setSubmetendo(false);
    }
  };

  const alternarPresencaAdmin = async (jogadorId, presenteAtual) => {
    try {
      setSubmetendo(true);
      const novoEstado = !presenteAtual;

      const response = await api.post(`/presenca/${linkId}/confirmar`, {
        jogadorId,
        presente: novoEstado
      });

      if (response.data.success) {
        setJogadoresAdmin(prev =>
          prev.map(j =>
            j.id === jogadorId ? { ...j, presente: novoEstado } : j
          )
        );
        toast.success(novoEstado ? '✅ Presença confirmada!' : '❌ Presença removida!');
      }
    } catch (error) {
      console.error('Erro ao atualizar presença (admin):', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar presença');
    } finally {
      setSubmetendo(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-3xl p-8 shadow-2xl border border-gray-700/80 backdrop-blur-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">SortTimes</h1>
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Confirmação de Presença</p>
            {eventoData && (
              <p className="text-gray-400 text-sm mt-2 flex items-center justify-center gap-2">
                <FaCalendarAlt className="text-blue-500" /> {eventoData}
              </p>
            )}
          </div>

          {/* Troca entre modo Jogador e Admin */}
          <div className="flex mb-6 bg-gray-900/80 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setModo('jogador')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                modo === 'jogador'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Jogador
            </button>
            <button
              type="button"
              onClick={() => setModo('admin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                modo === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <FaUserShield /> Admin
            </button>
          </div>

          <AnimatePresence mode="wait">
            {modo === 'jogador' ? (
              !autenticado ? (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  {/* Nome opcional – fica oculto quando já existe nome salvo para agilizar confirmação */}
                  {!usarNomeSalvo && (
                    <div className="space-y-2">
                      <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                        <FaUser className="text-blue-500" /> Seu Nome Completo
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  )}

                  {usarNomeSalvo && nomeSalvo && (
                    <div className="flex items-center justify-between bg-gray-900/70 border border-gray-700 rounded-2xl px-4 py-3 mb-1">
                      <div>
                        <p className="text-xs text-gray-400">Confirmando presença como:</p>
                        <p className="text-sm font-semibold text-white">{nomeSalvo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUsarNomeSalvo(false)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Não sou essa pessoa
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                      <FaLock className="text-blue-500" /> Data de Nascimento (Senha)
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaJogador ? 'text' : 'password'}
                        inputMode="numeric"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                        placeholder="DDMMAAAA"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenhaJogador((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
                        aria-label={mostrarSenhaJogador ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {mostrarSenhaJogador ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Apenas números. Ex: 15051990</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submetendo}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 rounded-2xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {submetendo ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      'Acessar Confirmação'
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="confirm-section"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 text-center"
                >
                  <div className="p-6 bg-gray-900/60 rounded-2xl border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Jogador</p>
                    <h2 className="text-xl font-bold text-white mb-4">{jogadorLogado.nome}</h2>
                    
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-gray-300">Sua presença está:</p>
                      <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                        jogadorLogado.presente ? 'bg-green-900/50 text-green-400 border border-green-500/30' : 'bg-red-900/50 text-red-400 border border-red-500/30'
                      }`}>
                        {jogadorLogado.presente ? 'CONFIRMADA' : 'NÃO CONFIRMADA'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={alternarPresenca}
                    disabled={submetendo}
                    className={`
                      w-full py-4 rounded-2xl font-black text-xl shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3
                      ${jogadorLogado.presente 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' 
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'}
                    `}
                  >
                    <GiSoccerKick className={`text-3xl transition-transform ${jogadorLogado.presente ? 'rotate-180' : ''}`} />
                    {jogadorLogado.presente ? 'DESMARCAR PRESENÇA' : 'CONFIRMAR PRESENÇA'}
                  </button>

                  <button
                    onClick={() => setAutenticado(false)}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    Sair / Entrar com outro nome
                  </button>
                </motion.div>
              )
            ) : (
              !adminAutenticado ? (
                <motion.form
                  key="admin-login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleAdminLogin}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                      <FaUserShield className="text-purple-500" /> Usuário Admin
                    </label>
                    <input
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      placeholder="Usuário admin"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                      <FaLock className="text-purple-500" /> Senha Admin
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaAdmin ? 'text' : 'password'}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        placeholder="Senha admin"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenhaAdmin((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
                        aria-label={mostrarSenhaAdmin ? 'Ocultar senha admin' : 'Mostrar senha admin'}
                      >
                        {mostrarSenhaAdmin ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submetendo}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {submetendo ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      'Entrar como Admin'
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="admin-panel"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <FaUserShield className="text-purple-400" /> Painel Admin - Presenças
                    </h2>
                    <button
                      onClick={() => {
                        setAdminAutenticado(false);
                        setJogadoresAdmin([]);
                      }}
                      className="text-gray-500 hover:text-gray-300 text-xs"
                    >
                      Sair do modo admin
                    </button>
                  </div>

                  <p className="text-gray-400 text-xs">
                    Você está visualizando todos os jogadores deste jogo e pode marcar ou desmarcar a presença de qualquer um.
                  </p>

                  {/* Resumo de quantidades */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-gray-700/60 rounded-xl p-3 border border-gray-600">
                      <p className="text-gray-400">Total</p>
                      <p className="text-lg font-bold text-white">
                        {jogadoresAdmin.length}
                      </p>
                    </div>
                    <div className="bg-green-900/40 rounded-xl p-3 border border-green-600/40">
                      <p className="text-green-300">Confirmados</p>
                      <p className="text-lg font-bold text-green-400">
                        {jogadoresAdmin.filter(j => j.presente).length}
                      </p>
                    </div>
                    <div className="bg-red-900/40 rounded-xl p-3 border border-red-600/40">
                      <p className="text-red-300">Não confirmados</p>
                      <p className="text-lg font-bold text-red-400">
                        {jogadoresAdmin.filter(j => !j.presente).length}
                      </p>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {jogadoresAdmin.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">
                        Nenhum jogador vinculado a este link de presença.
                      </p>
                    ) : (
                      jogadoresAdmin.map((jogador) => (
                        <div
                          key={jogador.id}
                          className="flex items-center justify-between bg-gray-700/60 border border-gray-600 rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="text-white font-medium text-sm">{jogador.nome}</p>
                            <p className="text-xs text-gray-400">
                              Status:{' '}
                              <span className={jogador.presente ? 'text-green-400' : 'text-red-400'}>
                                {jogador.presente ? 'Confirmado' : 'Não confirmado'}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => alternarPresencaAdmin(jogador.id, jogador.presente)}
                            disabled={submetendo}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                              jogador.presente
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {jogador.presente ? 'Desmarcar' : 'Confirmar'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}


