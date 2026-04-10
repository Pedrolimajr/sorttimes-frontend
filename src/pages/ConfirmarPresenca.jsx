import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';
import { GiSoccerKick } from 'react-icons/gi';
import { FaUser, FaLock, FaCalendarAlt, FaUserShield, FaEye, FaEyeSlash, FaSignOutAlt, FaShare } from 'react-icons/fa';

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

  const compartilharConfirmados = () => {
    const confirmados = jogadoresAdmin.filter(j => j.presente);

    if (confirmados.length === 0) {
      toast.info("Nenhum jogador confirmado.");
      return;
    }

    const listaNomes = confirmados
      .map((j, i) => `${i + 1}. ${j.nome} ⚽`)
      .join('\n');

    // Capitaliza a primeira letra da data se existir
    const dataFormatada = eventoData ? eventoData.charAt(0).toUpperCase() + eventoData.slice(1) : '';
    const linhaData = dataFormatada ? `🗓 *Data:* ${dataFormatada}\n` : '';

    const texto = `📋 *LISTA DE CONFIRMADOS* ✅\n\n` +
                  `${linhaData}` +
                  `👥 *Total:* ${confirmados.length} Jogadores\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${listaNomes}\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `🚀 _Bora pro jogo!_`;

    if (navigator.share) {
      navigator.share({
        title: 'Jogadores Confirmados',
        text: texto
      }).catch(err => console.error('Erro ao compartilhar:', err));
    } else {
      navigator.clipboard.writeText(texto);
      toast.success("Lista copiada!");
    }
  };

  const compartilharNaoConfirmados = () => {
    const naoConfirmados = jogadoresAdmin.filter(j => !j.presente);

    if (naoConfirmados.length === 0) {
      toast.info("Todos os jogadores confirmaram!");
      return;
    }

    const listaNomes = naoConfirmados
      .map((j, i) => `${i + 1}. ${j.nome}`)
      .join('\n');

    // Capitaliza a primeira letra da data se existir
    const dataFormatada = eventoData ? eventoData.charAt(0).toUpperCase() + eventoData.slice(1) : '';
    const linhaData = dataFormatada ? `🗓 *Data:* ${dataFormatada}\n` : '';

    const texto = `📋 *LISTA DE NÃO CONFIRMADOS* ❌\n\n` +
                  `${linhaData}` +
                  `👥 *Total:* ${naoConfirmados.length} Jogadores\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${listaNomes}\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `⚠️ _Favor confirmar presença!_`;

    if (navigator.share) {
      navigator.share({
        title: 'Jogadores Não Confirmados',
        text: texto
      }).catch(err => console.error('Erro ao compartilhar:', err));
    } else {
      navigator.clipboard.writeText(texto);
      toast.success("Lista copiada!");
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
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                modo === 'jogador'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <FaUser /> Jogador
            </button>
            <button
              type="button"
              onClick={() => setModo('admin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                modo === 'admin'
                  ? 'bg-amber-600 text-white'
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
                        <FaUser className="text-blue-500" /> Nome e Sobrenome
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Pedro Jr"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  )}

                  {usarNomeSalvo && nomeSalvo && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gray-800/60 border border-blue-500/30 rounded-2xl p-4 mb-6 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <FaUser className="text-white text-xl" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Confirmando presença como:</p>
                          <p className="text-xl font-bold text-white">{nomeSalvo}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUsarNomeSalvo(false)}
                        className="mt-3 text-xs text-red-400 hover:text-red-300 hover:underline w-full text-left pl-[4rem] transition-colors"
                      >
                        Não sou essa pessoa
                      </button>
                    </motion.div>
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
                  className="space-y-6 text-center"
                >
                  <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 mb-2 text-left">
                    {jogadorLogado.foto ? (
                      <img 
                        src={jogadorLogado.foto} 
                        alt={jogadorLogado.nome} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-lg shadow-blue-500/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                        <FaUser className="text-gray-400 text-2xl" />
                      </div>
                    )}
                    <div>
                      <p className="text-xl font-black text-white">Olá, {jogadorLogado.nome}!</p>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Confirme sua presença</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Sua presença para o jogo está:</p>
                    <motion.div
                      layout
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold tracking-wider border ${
                        jogadorLogado.presente
                          ? 'bg-green-900/50 text-green-300 border-green-500/30'
                          : 'bg-red-900/50 text-red-400 border-red-500/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${jogadorLogado.presente ? 'bg-green-400' : 'bg-red-400'}`} />
                      {jogadorLogado.presente ? 'CONFIRMADA' : 'NÃO CONFIRMADA'}
                    </motion.div>
                  </div>

                  <motion.button
                    onClick={alternarPresenca}
                    disabled={submetendo}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3
                      ${jogadorLogado.presente 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' 
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'}
                    `}
                  >
                    {submetendo ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <GiSoccerKick className={`text-2xl transition-transform duration-300 ${jogadorLogado.presente ? 'opacity-70' : 'rotate-[-15deg]'}`} />
                        <span>{jogadorLogado.presente ? 'Desmarcar Presença' : 'Confirmar Presença'}</span>
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => {
                      setAutenticado(false);
                      setJogadorLogado(null);
                      setSessionId(null);
                    }}
                    className="w-full mt-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                  >
                    <FaSignOutAlt className="group-hover:text-red-400 transition-colors text-lg" />
                    <span>Sair / Entrar com outro nome</span>
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
                      <FaUserShield className="text-amber-500" /> Usuário Admin
                    </label>
                    <input
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      placeholder="Usuário admin"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                      <FaLock className="text-amber-500" /> Senha Admin
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaAdmin ? 'text' : 'password'}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        placeholder="Senha admin"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
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
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-600/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
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
                      <FaUserShield className="text-amber-400" /> Painel Admin - Presenças
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
                    <div className="bg-gray-700/60 rounded-xl p-3 border border-gray-600 flex flex-col items-center justify-center">
                      <p className="text-gray-400 mb-1">Total</p>
                      <p className="text-lg font-bold text-white">
                        {jogadoresAdmin.length}
                      </p>
                    </div>
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      onClick={compartilharConfirmados}
                      className="bg-green-900/40 rounded-xl p-3 border border-green-600/40 cursor-pointer hover:bg-green-900/50 transition-colors flex flex-col items-center justify-center"
                      title="Clique para compartilhar a lista"
                    >
                      <p className="text-green-300 mb-1">Confirmados</p>
                      <p className="text-lg font-bold text-green-400 mb-1">
                        {jogadoresAdmin.filter(j => j.presente).length}
                      </p>
                      <FaShare size={12} className="text-green-400/70" />
                    </motion.div>
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      onClick={compartilharNaoConfirmados}
                      className="bg-red-900/40 rounded-xl p-3 border border-red-600/40 cursor-pointer hover:bg-red-900/50 transition-colors flex flex-col items-center justify-center"
                      title="Clique para compartilhar a lista de não confirmados"
                    >
                      <p className="text-red-300 mb-1">Não confirmados</p>
                      <p className="text-lg font-bold text-red-400 mb-1">
                        {jogadoresAdmin.filter(j => !j.presente).length}
                      </p>
                      <FaShare size={12} className="text-red-400/70" />
                    </motion.div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {jogadoresAdmin.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <FaUserShield className="text-4xl mb-2 opacity-20" />
                        <p className="text-sm">Nenhum jogador vinculado.</p>
                      </div>
                    ) : (
                      jogadoresAdmin.map((jogador) => (
                        <motion.div
                          layout
                          key={jogador.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                            jogador.presente 
                              ? 'bg-green-900/10 border-green-500/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]' 
                              : 'bg-gray-800/40 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {jogador.foto ? (
                                <img 
                                  src={jogador.foto} 
                                  alt={jogador.nome} 
                                  className="w-10 h-10 rounded-full object-cover border border-gray-600"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                                  <FaUser className="text-gray-500 text-xs" />
                                </div>
                              )}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 transition-colors duration-300 ${
                                jogador.presente ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'
                              }`} />
                            </div>
                            <div>
                              <p className={`font-medium text-sm transition-colors ${
                                jogador.presente ? 'text-white' : 'text-gray-300'
                              }`}>
                                {jogador.nome}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                                {jogador.presente ? 'Confirmado' : 'Pendente'}
                              </p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => alternarPresencaAdmin(jogador.id, jogador.presente)}
                            disabled={submetendo}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${
                              jogador.presente
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                            title={jogador.presente ? 'Desmarcar presença' : 'Confirmar presença'}
                          >
                            <GiSoccerKick className="text-2xl" />
                          </motion.button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>
      </div>
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
