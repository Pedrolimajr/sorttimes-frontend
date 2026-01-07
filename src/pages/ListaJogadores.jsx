import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, FaUsers, FaEdit, FaTrash, FaPlus,
  FaSave, FaTimes, FaSearch, FaFilter, FaUserCircle,
  FaCheck, FaMoneyBillWave, FaTshirt, FaMapMarkerAlt, 
  FaStar, FaCalendarAlt, FaPhone, FaEnvelope, FaBan, FaUnlock
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useJogadores } from '../context/JogadoresContext';
import { calcularIdade } from '../utils/dateUtils';

const posicoes = [
  'Goleiro', 'Defensor', 'Lateral-Esquerdo', 'Lateral-Direito', 
  'Volante', 'Meia-Esquerda', 'Meia-Direita', 'Centroavante'
];

const statusFinanceiroOptions = ['Adimplente', 'Inadimplente'];
const niveisOptions = ['Associado', 'Convidado', 'Visitante'];

export default function ListaJogadores({ 
  modoSelecao = false, 
  onJogadorSelecionado = () => {}, 
  closeModal = () => {} 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { jogadores: jogadoresContext, carregando, atualizarStatusFinanceiro, atualizarJogador } = useJogadores();
  const [jogadores, setJogadores] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [filtroPosicao, setFiltroPosicao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos'); // todos | ativos | bloqueados
  const [editando, setEditando] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState({
    aberto: false,
    url: null,
    nome: ''
  });

  const [modalBloqueio, setModalBloqueio] = useState({
    aberto: false,
    jogador: null,
    novoAtivo: true,
  });
  
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    posicao: '',
    telefone: '',
    email: '',
    dataIngresso: '',
    statusFinanceiro: 'Adimplente',
    foto: null,
    endereco: '',
    numeroCamisa: '',
    nivel: 'Associado'
  });

  const abrirFotoAmpliada = (url, nome) => {
    setFotoAmpliada({
      aberto: true,
      url,
      nome
    });
  };

  const fecharFotoAmpliada = () => {
    setFotoAmpliada({
      aberto: false,
      url: null,
      nome: ''
    });
  };

  const fecharModalBloqueio = () => {
    setModalBloqueio({ aberto: false, jogador: null, novoAtivo: true });
  };

  const confirmarBloqueio = async () => {
    if (!modalBloqueio.jogador) return;

    const { jogador, novoAtivo } = modalBloqueio;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jogadores/${jogador._id}/bloqueio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: novoAtivo })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar bloqueio');
      }

      const data = await response.json();
      toast.success(data.message || (novoAtivo ? 'Jogador desbloqueado' : 'Jogador bloqueado'));

      atualizarJogador(data.data);
      setJogadores(prev => prev.map(j => j._id === data.data._id ? data.data : j));
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear jogador:', error);
      toast.error(error.message || 'Erro ao atualizar bloqueio');
    } finally {
      fecharModalBloqueio();
    }
  };

  useEffect(() => {
    if (location.state?.novoJogador) {
      setMensagemSucesso(location.state.mensagem);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (mensagemSucesso) {
      const timer = setTimeout(() => {
        setMensagemSucesso(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensagemSucesso]);

  const atualizarEstadoJogadores = (novosJogadores) => {
    novosJogadores.forEach(jogador => {
      atualizarJogador(jogador);
    });
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const dadosFinanceiros = JSON.parse(localStorage.getItem('dadosFinanceiros'));
      if (dadosFinanceiros && dadosFinanceiros.jogadoresCache) {
        const jogadoresAtualizados = jogadores.map(jogador => {
          const jogadorAtualizado = dadosFinanceiros.jogadoresCache.find(j => j._id === jogador._id);
          if (jogadorAtualizado) {
            return {
              ...jogador,
              statusFinanceiro: jogadorAtualizado.statusFinanceiro,
              pagamentos: jogadorAtualizado.pagamentos
            };
          }
          return jogador;
        });
        
        atualizarEstadoJogadores(jogadoresAtualizados);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [jogadores, atualizarJogador]);

  useEffect(() => {
    setJogadores(jogadoresContext);
  }, [jogadoresContext]);

  // Em modo de seleção (ex.: Financeiro, Sorteio, etc.), ocultar jogadores bloqueados (ativo === false)
  const jogadoresBase = modoSelecao
    ? jogadores.filter(j => j.ativo !== false)
    : jogadores.filter(jogador => {
        if (filtroAtivo === 'ativos') return jogador.ativo !== false;
        if (filtroAtivo === 'bloqueados') return jogador.ativo === false;
        return true; // 'todos'
      });

  const jogadoresFiltrados = jogadoresBase.filter(jogador => {
    const matchesNome = jogador.nome?.toLowerCase().includes(filtro.toLowerCase());
    const matchesPosicao = filtroPosicao ? jogador.posicao === filtroPosicao : true;
    const matchesStatus = filtroStatus ? jogador.statusFinanceiro === filtroStatus : true;
    const matchesNivel = filtroNivel ? jogador.nivel === filtroNivel : true;
    return matchesNome && matchesPosicao && matchesStatus && matchesNivel;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, foto: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const formDataToSend = new FormData();
    
    if (formData.dataNascimento) {
      const nascimento = new Date(formData.dataNascimento + 'T12:00:00');
      formDataToSend.append('dataNascimento', nascimento.toISOString());
    }

    if (formData.dataIngresso) {
      const ingresso = new Date(formData.dataIngresso + 'T12:00:00');
      formDataToSend.append('dataIngresso', ingresso.toISOString());
    }

    Object.keys(formData).forEach(key => {
      if (key !== 'dataNascimento' && key !== 'dataIngresso' && 
          formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (editando) {
      formDataToSend.append('id', editando);
    }

    const url = editando 
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jogadores/${editando}`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jogadores`;

    const response = await fetch(url, {
      method: editando ? 'PUT' : 'POST',
      body: formDataToSend
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao salvar jogador');
    }

    const data = await response.json();
    toast.success(`Jogador ${data.data.nome} ${editando ? 'atualizado' : 'cadastrado'} com sucesso!`);
    
    // Atualização usando o contexto
    if (editando) {
      atualizarJogador(data.data);
      setJogadores(prev =>
        prev.map(j => j._id === data.data._id ? data.data : j)
      );
    } else {
      setJogadores(prev => [...prev, data.data]);
      // Se você não tiver adicionarJogador no contexto, pode forçar uma recarga
      window.location.reload(); // Solução temporária
      // Idealmente, você deveria adicionar adicionarJogador ao seu contexto
    }
    
    setEditando(null);
    setFormData({
      nome: '',
      dataNascimento: '',
      posicao: '',
      telefone: '',
      email: '',
      dataIngresso: '',
      statusFinanceiro: 'Adimplente',
      foto: null,
      endereco: '',
      numeroCamisa: '',
      nivel: 'Associado'
    });
  } catch (error) {
    console.error("Erro ao salvar jogador:", error);
    toast.error(error.message || 'Erro ao salvar jogador');
  }
};

  const handleEditar = (jogador) => {
    setEditando(jogador._id);
    setFormData({
      nome: jogador.nome,
      dataNascimento: jogador.dataNascimento?.split('T')[0] || '',
      posicao: jogador.posicao,
      telefone: jogador.telefone,
      email: jogador.email,
      dataIngresso: jogador.dataIngresso?.split('T')[0] || '',
      statusFinanceiro: jogador.statusFinanceiro || 'Adimplente',
      foto: jogador.foto || null,
      endereco: jogador.endereco || '',
      numeroCamisa: jogador.numeroCamisa || '',
      nivel: jogador.nivel || 'Associado'
    });
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este jogador?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jogadores/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao excluir jogador');
        }
        
        const data = await response.json();
        toast.success(data.message || 'Jogador excluído com sucesso');
        setJogadores(prev => prev.filter(j => j._id !== id));
      } catch (error) {
        console.error("Erro ao excluir jogador:", error);
        toast.error(error.message || 'Erro ao excluir jogador');
      }
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      const sucesso = await atualizarStatusFinanceiro(id, status);
      if (sucesso) {
        toast.success(`Status atualizado para ${status}`);
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error('Erro ao atualizar status');
    }
  };

  const totalAssociados = jogadores.filter(j => j.nivel === 'Associado').length;
  const totalConvidados = jogadores.filter(j => j.nivel === 'Convidado').length;
  const totalVisitantes = jogadores.filter(j => j.nivel === 'Visitante').length;
  const totalGeral = jogadores.length;

  return (
    <div className={`${!modoSelecao ? 'min-h-screen' : ''} bg-gray-900 p-4 sm:p-6`}>
      {/* Modal para foto ampliada */}
      <AnimatePresence>
        {fotoAmpliada.aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
            onClick={fecharFotoAmpliada}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={fecharFotoAmpliada}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-gray-800 rounded-full p-2"
              >
                <FaTimes size={24} />
              </button>
              
              <div className="max-w-full max-h-full flex items-center justify-center">
                <img 
                  src={fotoAmpliada.url} 
                  alt="Foto do jogador"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para bloqueio/desbloqueio de jogador */}
      <AnimatePresence>
        {modalBloqueio.aberto && modalBloqueio.jogador && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            onClick={fecharModalBloqueio}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-white mb-3">
                {modalBloqueio.novoAtivo ? 'Desbloquear jogador' : 'Bloquear jogador'}
              </h2>

              <p className="text-gray-300 text-sm mb-4">
                {modalBloqueio.novoAtivo
                  ? `Deseja DESBLOQUEAR o jogador "${modalBloqueio.jogador.nome}"? Ele voltará a aparecer nas demais telas.`
                  : `Deseja BLOQUEAR o jogador "${modalBloqueio.jogador.nome}"? Ele não aparecerá mais nas telas de Financeiro, Sorteio e Presença.`}
              </p>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={fecharModalBloqueio}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarBloqueio}
                  className={`px-4 py-2 text-sm rounded-lg text-white ${
                    modalBloqueio.novoAtivo
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!modoSelecao && (
        <AnimatePresence>
          {mensagemSucesso && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <FaCheck className="text-white" />
                <span>{mensagemSucesso}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative pt-16 sm:pt-0 text-center"
        >
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-3 top-4 sm:top-8 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaUsers className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              >
                Lista de Jogadores
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base"
            >
              Gerencie todos os jogadores cadastrados no sistema
            </motion.p>
          </div>
        </motion.div>

        {!modoSelecao ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
          >
            <div className="flex items-center gap-4">
              {carregando && (
                <span className="text-sm text-gray-400">(Carregando...)</span>
              )}
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link 
                to="/cadastro-jogadores"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-lg shadow-lg transition-all duration-300 text-sm"
              >
                <FaPlus />
                Cadastrar Novo Jogador
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <FaUsers className="text-blue-400" /> 
              Selecione um Jogador
            </h2>
            <button 
              onClick={closeModal}
              className="text-gray-400 hover:text-white p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FaFilter className="text-blue-400" /> Filtros
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <FaSearch /> Buscar por nome
                </label>
                <input 
                  type="text" 
                  placeholder="Digite o nome..." 
                  className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={filtro} 
                  onChange={(e) => setFiltro(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Posição
                </label>
                <select 
                  className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={filtroPosicao} 
                  onChange={(e) => setFiltroPosicao(e.target.value)} 
                >
                  <option value="" className="bg-gray-800">Todas as posições</option>
                  {posicoes.map(posicao => (
                    <option key={posicao} value={posicao} className="bg-gray-800">
                      {posicao}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Status Financeiro
                </label>
                <select 
                  className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={filtroStatus} 
                  onChange={(e) => setFiltroStatus(e.target.value)} 
                >
                  <option value="" className="bg-gray-800">Todos os status</option>
                  {statusFinanceiroOptions.map(status => (
                    <option key={status} value={status} className="bg-gray-800">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Nível
                </label>
                <select 
                  className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={filtroNivel} 
                  onChange={(e) => setFiltroNivel(e.target.value)} 
                >
                  <option value="" className="bg-gray-800">Todos os níveis</option>
                  {niveisOptions.map(nivel => (
                    <option key={nivel} value={nivel} className="bg-gray-800">
                      {nivel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Status do Jogador
                </label>
                <select
                  className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filtroAtivo}
                  onChange={(e) => setFiltroAtivo(e.target.value)}
                >
                  <option value="todos" className="bg-gray-800">Todos</option>
                  <option value="ativos" className="bg-gray-800">Somente ativos</option>
                  <option value="bloqueados" className="bg-gray-800">Somente bloqueados</option>
                </select>
              </div>
            </div>
          </div>

          {!modoSelecao && (
            <AnimatePresence>
              {editando !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSubmit} className="p-6 border-b border-gray-700 bg-gray-700/30">
                  <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    {editando ? (
                      <>
                        <FaEdit className="text-yellow-400" /> Editar Jogador
                      </>
                    ) : (
                      <>
                        <FaPlus className="text-green-400" /> Adicionar Jogador
                      </>
                    )}
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Nome Completo</label>
                      <input 
                        type="text" 
                        name="nome" 
                        value={formData.nome} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Data de Nascimento</label>
                      <input 
                        type="date" 
                        name="dataNascimento" 
                        value={formData.dataNascimento} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Posição</label>
                      <select 
                        name="posicao" 
                        value={formData.posicao} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      >
                        <option value="" className="bg-gray-800">Selecione uma posição</option>
                        {posicoes.map(posicao => (
                          <option key={posicao} value={posicao} className="bg-gray-800">
                            {posicao}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaPhone /> Telefone
                      </label>
                      <input 
                        type="tel" 
                        name="telefone" 
                        value={formData.telefone} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaEnvelope /> E-mail
                      </label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaCalendarAlt /> Data de Ingresso
                      </label>
                      <input 
                        type="date" 
                        name="dataIngresso" 
                        value={formData.dataIngresso} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaMoneyBillWave /> Status Financeiro
                      </label>
                      <select 
                        name="statusFinanceiro" 
                        value={formData.statusFinanceiro} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      >
                        {statusFinanceiroOptions.map(status => (
                          <option key={status} value={status} className="bg-gray-800">
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaMapMarkerAlt /> Endereço
                      </label>
                      <input 
                        type="text" 
                        name="endereco" 
                        value={formData.endereco} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaTshirt /> Número da Camisa
                      </label>
                      <input 
                        type="number" 
                        name="numeroCamisa" 
                        value={formData.numeroCamisa} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FaStar /> Nível
                      </label>
                      <select 
                        name="nivel" 
                        value={formData.nivel} 
                        onChange={handleChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {niveisOptions.map(nivel => (
                          <option key={nivel} value={nivel} className="bg-gray-800">
                            {nivel}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Foto do Atleta</label>
                      <input 
                        type="file" 
                        name="foto" 
                        onChange={handleFileChange} 
                        className="w-full p-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600" 
                        accept="image/*" 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <motion.button
                      type="button" 
                      onClick={() => {
                        setEditando(null);
                        setFormData({
                          nome: '',
                          dataNascimento: '',
                          posicao: '',
                          telefone: '',
                          email: '',
                          dataIngresso: '',
                          statusFinanceiro: 'Adimplente',
                          foto: null,
                          endereco: '',
                          numeroCamisa: '',
                          nivel: 'Associado'
                        });
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all text-sm"
                    >
                      <FaTimes /> Cancelar
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all shadow-md text-sm"
                    >
                      <FaSave /> {editando ? 'Atualizar' : 'Adicionar'}
                    </motion.button>
                  </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <div className="p-4">
            {carregando ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-400">Carregando jogadores...</p>
              </div>
            ) : jogadoresFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Nenhum jogador encontrado
              </div>
            ) : modoSelecao ? (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {jogadoresFiltrados.map((jogador) => (
                  <motion.div
                    key={jogador._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onJogadorSelecionado(jogador);
                      closeModal();
                    }}
                    className="p-4 bg-gray-700 rounded-lg cursor-pointer flex items-center gap-4"
                  >
                    {jogador.foto ? (
                      <img 
                        className="h-12 w-12 rounded-full object-cover cursor-pointer" 
                        src={jogador.foto} 
                        alt={jogador.nome}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirFotoAmpliada(jogador.foto, jogador.nome);
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                        <FaUserCircle className="text-gray-400 text-xl" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">{jogador.nome}</div>
                      <div className="text-sm text-gray-400">
                        {jogador.posicao} • {jogador.telefone}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <div className="max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] lg:max-h-[75vh] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider sm:px-6">Jogador</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider sm:px-6">Informações</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider sm:px-6">Contato</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider sm:px-6">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider sm:px-6">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                          {jogadoresFiltrados.map((jogador) => (
                            <motion.tr 
                              key={jogador._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
                              className="transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                                <div className="flex items-center space-x-3">
                                  {jogador.foto ? (
                                    <div 
                                      className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 cursor-pointer"
                                      onClick={() => abrirFotoAmpliada(jogador.foto, jogador.nome)}
                                    >
                                      <img 
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" 
                                        src={jogador.foto} 
                                        alt={jogador.nome} 
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-700 flex items-center justify-center">
                                      <FaUserCircle className="text-gray-400 text-lg sm:text-xl" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-white">
                                      {jogador.nome}
                                      {jogador.ativo === false && (
                                        <span className="ml-2 text-xs text-red-400 font-normal">(Bloqueado)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {(() => {
                                        const idade = calcularIdade(jogador.dataNascimento);
                                        return idade !== null ? `${idade} anos` : 'Idade não informada';
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                                <div className="space-y-1">
                                  <div className="text-sm text-white flex items-center gap-2">
                                    <FaTshirt className="text-gray-400 hidden sm:inline" />
                                    {jogador.posicao} {jogador.numeroCamisa && `#${jogador.numeroCamisa}`}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-2">
                                    <FaStar className="text-yellow-400 hidden sm:inline" />
                                    {jogador.nivel || 'Associado'}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-2">
                                    <FaCalendarAlt className="hidden sm:inline" />
                                    {jogador.dataIngresso ? 
                                      `Ingresso: ${new Date(jogador.dataIngresso).toLocaleDateString()}` : 
                                      'Sem data'}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                                <div className="space-y-1">
                                  <div className="text-sm text-white flex items-center gap-2">
                                    <FaPhone className="hidden sm:inline" />
                                    {jogador.telefone || 'Não informado'}
                                  </div>
                                  <div className="text-sm text-white flex items-center gap-2">
                                    <FaEnvelope className="hidden sm:inline" />
                                    {jogador.email || 'Não informado'}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-2">
                                    <FaMapMarkerAlt className="hidden sm:inline" />
                                    {jogador.endereco || 'Endereço não informado'}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                                <motion.button
                                  onClick={() => toggleStatus(jogador._id)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-300 ${
                                    jogador.statusFinanceiro === 'Adimplente' ?
                                      'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                                      'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  }`}
                                >
                                  {jogador.statusFinanceiro === 'Adimplente' ? (
                                    <>
                                      <FaCheck className="text-xs" />
                                      <span>Adimplente</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaTimes className="text-xs" />
                                      <span>Inadimplente</span>
                                    </>
                                  )}
                                </motion.button>
                              </td>
                              
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sm:px-6">
                                <div className="flex gap-2 sm:gap-3">
                                  {/* Bloquear / Desbloquear antes do botão Editar */}
                                  <motion.button
                                    onClick={() => {
                                      const ativoAtual = jogador.ativo !== false;
                                      const novoAtivo = !ativoAtual;

                                      setModalBloqueio({
                                        aberto: true,
                                        jogador,
                                        novoAtivo,
                                      });
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={jogador.ativo === false ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}
                                    title={jogador.ativo === false ? 'Desbloquear' : 'Bloquear'}
                                  >
                                    {jogador.ativo === false ? (
                                      <FaUnlock className="text-sm sm:text-base" />
                                    ) : (
                                      <FaBan className="text-sm sm:text-base" />
                                    )}
                                  </motion.button>

                                  <motion.button
                                    onClick={() => handleEditar(jogador)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-blue-400 hover:text-blue-300"
                                    title="Editar"
                                  >
                                    <FaEdit className="text-sm sm:text-base" />
                                  </motion.button>
                                  
                                  <motion.button
                                    onClick={() => handleExcluir(jogador._id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-red-400 hover:text-red-300"
                                    title="Excluir"
                                  >
                                    <FaTrash className="text-sm sm:text-base" />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="sticky bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 py-3 px-4 text-center text-gray-300 text-sm sm:text-base z-20 shadow-inner">
                      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        <span>Associados: <strong>{totalAssociados}</strong></span>
                        <span>Convidados: <strong>{totalConvidados}</strong></span>
                        <span>Visitantes: <strong>{totalVisitantes}</strong></span>
                        <span>Total: <strong>{totalGeral}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}