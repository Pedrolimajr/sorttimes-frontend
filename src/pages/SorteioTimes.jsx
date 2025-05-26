// SorteioTimes.jsx
import { useState, useEffect } from "react";
import { 
  FaRandom, FaUser, FaTshirt, FaBalanceScale, FaCheck, FaTimes, 
  FaSync, FaArrowLeft, FaHistory, FaEdit, FaShare, FaSave, 
  FaTrash, FaUserCheck, FaUserTimes, FaLink, FaRegCalendarAlt 
} from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { GiSoccerKick } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config/config';
import { FaWhatsapp } from "react-icons/fa";
import socket from '../services/socket';

// Constantes para organizar os valores fixos
const POSICOES = {
  GOLEIRO: "Goleiro",
  ZAGUEIRO: "Defensor",
  LATERAL_DIREITO: "Lateral-Direito",
  LATERAL_ESQUERDO: "Lateral-Esquerdo",
  VOLANTE: "Volante",
  MEIA_DIREITA: "Meia-Direita",
  MEIA_ESQUERDA: "Meia-Esquerda",
  ATACANTE: "Centroavante",
};

const POSICOES_ARRAY = Object.values(POSICOES);

const TIPOS_BALANCEAMENTO = {
  ALEATORIO: "aleatorio",
  NIVEL: "nivel",
  POSICAO: "posicao",
  MISTO: "misto"
};

const NIVEL_JOGADOR = {
  INICIANTE: 1,
  CONVIDADO: 2,
  ASSOCIADO: 3
};

/**
 * Componente principal para sorteio de times de futebol
 * Permite selecionar jogadores, definir posições e balancear times de diferentes formas
 */
export default function SorteioTimes() {
  const navigate = useNavigate();
  
  // Estados do componente
  const [jogadoresCadastrados, setJogadoresCadastrados] = useState([]);
  const [jogadoresSelecionados, setJogadoresSelecionados] = useState([]);
  const [times, setTimes] = useState([]);
  const [balanceamento, setBalanceamento] = useState(TIPOS_BALANCEAMENTO.POSICAO); //const [balanceamento, setBalanceamento] = useState(TIPOS_BALANCEAMENTO.ALEATORIO);
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState(() => {
    const saved = localStorage.getItem('historicoSorteios');
    return saved ? JSON.parse(saved) : [];
  });
  const [carregandoJogadores, setCarregandoJogadores] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [filtroPosicao, setFiltroPosicao] = useState('');
  const [socket, setSocket] = useState(null);
  const [dataJogo, setDataJogo] = useState('');

  // Configuração do socket.io para atualizações em tempo real
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    // Conecta ao socket quando o componente monta
    socket.connect();

    // Listener para atualizações de times
    socket.on('times-atualizados', (novosTimes) => {
      setTimes(novosTimes);
    });

    // Listener para presença
    socket.on('presencaAtualizada', ({ jogadorId, presente }) => {
      setJogadoresSelecionados(prev => 
        prev.map(j => j._id === jogadorId ? { ...j, presente } : j)
      );
    });

    // Cleanup quando o componente desmonta
    return () => {
      socket.off('times-atualizados');
      socket.off('presencaAtualizada');
      socket.disconnect();
    };
  }, []);

  /**
   * Gera um link para confirmação de presença e compartilha via WhatsApp
   */
  const gerarLinkPresenca = async () => {
    if (!dataJogo) {
      toast.warning('Por favor, selecione a data do jogo!');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/gerar-link-presenca`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jogadores: jogadoresSelecionados.map(j => ({
            id: j._id,
            nome: j.nome,
            presente: j.presente
          })),
          dataJogo
        })
      });

      const { linkId } = await response.json();
      const linkCompleto = `${window.location.origin}/confirmar-presenca/${linkId}`;
      
      const dataFormatada = new Date(dataJogo).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      const mensagem = `*⚽ Confirmação de Presença - Fut de ${dataFormatada}!*\n\n` +
        `Fala galera! Chegou a hora de confirmar presença para o nosso fut!\n\n` +
        `🗓️ Data: ${dataFormatada}\n\n` +
        `📲 *Confirme sua presença acessando:*\n\n`+
        `${linkCompleto}\n\n` +
        `_Clique no link acima para confirmar sua participação._`;

      if (navigator.share) {
        await navigator.share({
          title: 'Confirmação de Presença',
          text: mensagem
        });
      } else {
        await navigator.clipboard.writeText(mensagem);
        toast.success('Link copiado para área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error('Erro ao gerar link de presença');
    }
  };

  // Carrega jogadores do backend ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      setCarregandoJogadores(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/jogadores`);
        if (!response.ok) throw new Error('Erro ao carregar jogadores');
        
        const { data: jogadores } = await response.json();
        setJogadoresCadastrados(jogadores);
        
        setJogadoresSelecionados(jogadores.map(jogador => ({
          ...jogador,
          posicaoOriginal: jogador.posicao || POSICOES.MEIA,
          presente: false,
          posicao: jogador.posicao || POSICOES.MEIA,
          nivel: jogador.nivel === 'Associado' ? NIVEL_JOGADOR.ASSOCIADO : 
                jogador.nivel === 'Convidado' ? NIVEL_JOGADOR.CONVIDADO : 
                NIVEL_JOGADOR.INICIANTE
        })));

      } catch (erro) {
        console.error("Erro ao carregar jogadores:", erro);
        toast.error("Erro ao carregar jogadores: " + erro.message);
      } finally {
        setCarregandoJogadores(false);
      }
    };
    
    carregarDados();
  }, []);

  // Persiste o histórico no localStorage
  useEffect(() => {
    localStorage.setItem('historicoSorteios', JSON.stringify(historico));
  }, [historico]);

  /**
   * Alterna o estado de presença de um jogador
   * @param {string} id - ID do jogador
   */
  const alternarPresenca = (id) => {
    setJogadoresSelecionados(jogadoresSelecionados.map(jogador => 
      jogador._id === id ? { ...jogador, presente: !jogador.presente } : jogador
    ));
  };

  /**
   * Atualiza a posição de um jogador
   * @param {string} id - ID do jogador
   * @param {string} novaPosicao - Nova posição do jogador
   */
  const atualizarPosicao = (id, novaPosicao) => {
    setJogadoresSelecionados(jogadoresSelecionados.map(jogador => 
      jogador._id === id ? { 
        ...jogador, 
        posicao: novaPosicao,
        posicaoOriginal: novaPosicao
      } : jogador
    ));
  };
  
  /**
   * Aplica a mesma posição para todos os jogadores
   */
const aplicarFiltroPosicao = () => {
  setJogadoresSelecionados(prev => 
    prev.map(jogador => ({
      ...jogador,
      posicao: filtroPosicao ? filtroPosicao : jogador.posicaoOriginal,
      // NÃO altera posicaoOriginal aqui
    }))
  );
  toast.info(`Todos os jogadores definidos como ${filtroPosicao || 'posição original'}`);
};

  
  /**
   * Realiza o sorteio dos times com base nos jogadores selecionados
   */
  const sortearTimes = async () => {
    const jogadoresPresentes = jogadoresSelecionados.filter(j => j.presente);
    
    if (jogadoresPresentes.length < 2) {
      toast.error("Mínimo de 2 jogadores necessários");
      return;
    }
  
    setCarregando(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sorteio-times/sortear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jogadoresIds: jogadoresPresentes.map(j => j._id),
          posicaoUnica: filtroPosicao,
          balanceamento,
          posicoesEspecificas: balanceamento === TIPOS_BALANCEAMENTO.POSICAO ? 
            { [POSICOES.GOLEIRO]: 1 } : null,
          jogadoresPorTime: Math.ceil(jogadoresPresentes.length / 2)
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao sortear times');
      }
  
      const { data } = await response.json();
      
      if (!data?.times) {
        throw new Error('Resposta inválida do servidor');
      }
  
      const timesComIds = data.times.map(time => ({
        ...time,
        jogadores: time.jogadores.map(j => ({ 
          ...j, 
          id: j._id || Math.random().toString(36).substr(2, 9),
          posicao: filtroPosicao || j.posicao
        }))
      }));
      
      setTimes(timesComIds);
      
      const novoSorteio = {
        times: timesComIds,
        data: new Date(),
        jogadoresPresentes: jogadoresPresentes.length,
        balanceamento,
        posicaoUnica: filtroPosicao
      };
      
      setHistorico([novoSorteio, ...historico.slice(0, 4)]);
      toast.success(`Times sorteados com sucesso! ${data.times.length} times formados`);
  
    } catch (error) {
      console.error("Erro detalhado:", error);
      toast.error(error.message || 'Erro ao sortear times');
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Recarrega a lista de jogadores do servidor
   */
  const recarregarJogadores = async () => {
    setCarregandoJogadores(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/jogadores`);
      if (!response.ok) throw new Error('Erro ao recarregar jogadores');
      
      const { data: jogadores } = await response.json();
      setJogadoresCadastrados(jogadores);
      
      setJogadoresSelecionados(jogadores.map(jogador => {
        const existente = jogadoresSelecionados.find(j => j._id === jogador._id);
        return {
          ...jogador,
          posicaoOriginal: jogador.posicao || POSICOES.MEIA,
          presente: existente ? existente.presente : true,
          posicao: existente?.posicao || jogador.posicao || POSICOES.MEIA,
          nivel: jogador.nivel === 'Associado' ? NIVEL_JOGADOR.ASSOCIADO : 
                jogador.nivel === 'Convidado' ? NIVEL_JOGADOR.CONVIDADO : 
                NIVEL_JOGADOR.INICIANTE
        };
      }));
      
      toast.success('Jogadores atualizados com sucesso');
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error.message || 'Erro ao atualizar jogadores');
    } finally {
      setCarregandoJogadores(false);
    }
  };

  /**
   * Move um jogador entre times no modo de edição
   * @param {number} deTimeIdx - Índice do time de origem
   * @param {number} paraTimeIdx - Índice do time de destino
   * @param {string} jogadorId - ID do jogador a ser movido
   */
  const moverJogador = (deTimeIdx, paraTimeIdx, jogadorId) => {
    if (!modoEdicao) return;
    
    setTimes(prevTimes => {
      const novosTimes = [...prevTimes];
      const jogador = novosTimes[deTimeIdx].jogadores.find(j => j.id === jogadorId);
      
      if (!jogador) return prevTimes;
      
      novosTimes[deTimeIdx].jogadores = novosTimes[deTimeIdx].jogadores.filter(j => j.id !== jogadorId);
      novosTimes[paraTimeIdx].jogadores.push(jogador);
      
      return novosTimes;
    });
  };

  /**
   * Restaura um sorteio do histórico
   * @param {object} sorteio - Objeto contendo os times do sorteio
   */
  const restaurarSorteio = (sorteio) => {
    setTimes(sorteio.times);
    setBalanceamento(sorteio.balanceamento);
    toast.success('Sorteio restaurado!');
  };

  /**
   * Remove um sorteio do histórico
   * @param {number} index - Índice do sorteio no histórico
   */
  const excluirDoHistorico = (index) => {
    setHistorico(prev => prev.filter((_, i) => i !== index));
    toast.success('Sorteio removido do histórico');
  };

  /**
   * Compartilha os times sorteados
   */
  const compartilharTimes = () => {
    const texto = times.map(time => 
      `${time.nome}:\n${time.jogadores.map(j => `- ${j.nome} (${j.posicao})`).join('\n')}`
    ).join('\n\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'Times Sorteados',
        text: texto
      }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
      navigator.clipboard.writeText(texto);
      toast.success('Times copiados para área de transferência!');
    }
  };

  // Componente para exibir um jogador na lista
  const JogadorItem = ({ jogador }) => (
    <motion.div
      key={jogador._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-2 sm:p-3 rounded-md flex justify-between items-center mb-1 sm:mb-2 transition-colors ${
        jogador.presente 
          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
          : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm sm:text-base ${jogador.presente ? "font-medium text-white" : "text-gray-400"}`}>
          {jogador.nome}
        </span>
        <span className="text-xs text-yellow-400">{jogador.nivel} ⭐</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <select
          value={jogador.posicao}
          onChange={(e) => atualizarPosicao(jogador._id, e.target.value)}
          className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {POSICOES_ARRAY.map(pos => (
            <option key={pos} value={pos} className="bg-gray-800">{pos}</option>
          ))}
        </select>

        <motion.button
          onClick={() => alternarPresenca(jogador._id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`p-2 rounded-lg transition-all duration-300 ${
            jogador.presente 
              ? 'bg-green-900/30 text-green-400 hover:bg-green-800/40' 
              : 'bg-red-900/30 text-red-400 hover:bg-red-800/40'
          }`}
          title={jogador.presente ? 'Presente' : 'Ausente'}
        >
          <GiSoccerKick className={`text-sm sm:text-base transform transition-all duration-300 ${
            jogador.presente ? 'rotate-0' : 'rotate-45 opacity-50'
          }`} />
        </motion.button>
      </div>
    </motion.div>
  );

  // Componente para exibir um time sorteado
  const TimeSorteado = ({ time, index }) => (
    <div key={index} className={`border ${modoEdicao ? 'border-dashed border-yellow-400' : 'border-gray-700'} p-4 rounded-lg bg-gray-800/30`}>
      <h3 className="text-base sm:text-lg font-bold text-center mb-3 sm:mb-4 flex items-center justify-center gap-2 text-white">
        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
          index === 0 ? 'bg-gray-300 border-gray-400' : 'bg-blue-500 border-blue-400'
        }`}></div>
        {time.nome}
        <span className="text-xs sm:text-sm font-normal text-gray-400">
          (Nível: <span className="text-yellow-400">{time.nivelMedio}</span>)
        </span>
      </h3>
      <ul className="space-y-2 sm:space-y-3">
        {time.jogadores.map((jogador, idx) => (
          <motion.li
            key={jogador.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-2 sm:p-3 rounded-md border ${modoEdicao ? 'cursor-move border-dashed border-gray-500 hover:bg-gray-700/70' : 'border-gray-600 hover:bg-gray-700'} transition-colors`}
            draggable={modoEdicao}
            onDragStart={(e) => e.dataTransfer.setData('jogadorId', jogador.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const jogadorId = e.dataTransfer.getData('jogadorId');
              moverJogador(index, index, jogadorId);
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-white text-sm sm:text-base">{jogador.nome}</span>
              <span className="text-yellow-400 text-xs sm:text-sm">{jogador.nivel} ⭐</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">
              Posição: {jogador.posicao}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );

  // Componente para exibir um item do histórico
  const HistoricoItem = ({ sorteio, index }) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-700/30 p-3 sm:p-4 rounded-md border border-gray-700 hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs text-gray-400">
            {new Date(sorteio.data).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {sorteio.jogadoresPresentes} jogadores • {sorteio.times.length} times
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            excluirDoHistorico(index);
          }}
          className="text-red-400 hover:text-red-300 p-1"
          title="Excluir sorteio"
        >
          <FaTrash size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {sorteio.times.map((time, i) => (
          <div key={i}>
            <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">
              {time.nome} ({time.jogadores.length})
            </h4>
            <ul className="text-xs sm:text-sm space-y-1 text-gray-400">
              {time.jogadores.slice(0, 3).map((j, jIdx) => (
                <li key={jIdx} className="truncate">
                  {j.nome} <span className="text-gray-500 text-xs">({j.posicao})</span>
                </li>
              ))}
              {time.jogadores.length > 3 && (
                <li className="text-gray-500 text-xs">+{time.jogadores.length - 3} mais...</li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => restaurarSorteio(sorteio)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          Restaurar
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Efeito de fundo com partículas */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100, 
              y: Math.random() * 100, 
              opacity: 0.3 
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 50], 
              x: [null, (Math.random() - 0.5) * 50] 
            }}
            transition={{ 
              duration: 15 + Math.random() * 20, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
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
            className="absolute left-4 top-2 sm:top-8 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
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
              <FaRandom className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              >
                Sorteio de Times
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base"
            >
              Organize e sorteie os times para as partidas
            </motion.p>
          </div>
        </motion.div>

        {/* Seção principal de configuração */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden mb-6"
        >
         <div className="p-4 sm:p-10">
  {/* Controles de data e compartilhamento */}
<div className="flex justify-start max-sm:justify-center mb-4 w-full">
  {/* Container centralizador */}
  <div className="flex items-center gap-4 max-sm:gap-2 max-sm:flex-wrap w-full max-sm:justify-center">
    
    {/* Input com ícone e campo */}
    <FaRegCalendarAlt className="text-blue-400 w-4 h-4 flex-shrink-0" />
    <div className="flex items-center gap-1.5 bg-gray-700 rounded-lg border border-gray-600 focus-within:border-blue-500 pl-2 pr-2 
                    h-8 max-sm:h-7 
                    max-sm:flex-1 w-auto">
      
      <input
        type="datetime-local"
        value={dataJogo}
        onChange={(e) => setDataJogo(e.target.value)}
        className="px-0 py-0.5 bg-transparent text-white focus:outline-none text-xs 
                   h-full w-[140px] max-sm:w-full"
      />
    </div>

    {/* Botão "Compartilhar" */}
    <div className="relative inline-flex max-sm:flex-1 w-auto">
      <button
        onClick={gerarLinkPresenca}
        className="group relative bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-300 
                   flex items-center justify-center gap-1.5 
                   text-sm max-sm:text-xs w-full h-8 max-sm:h-7
                   hover:shadow-[0_2px_10px_rgba(59,130,246,0.5)]"
      >
        <FaLink className="w-4 h-4" />
        <span>Compartilhar</span>

        {/* Tooltip responsivo */}
        <span className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50 pointer-events-none
          sm:-top-8 sm:bottom-auto
          max-sm:top-full max-sm:mt-1">
          Compartilhar link de Presença
        </span>
      </button>
    </div>

  </div>
</div>


            {/* Filtro de posição */}
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
    <div className="flex-1 max-sm:w-full">
      <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
        <FaTshirt className="text-blue-400" /> Definir mesma posição para todos
      </label>
      <div className="flex gap-2 max-sm:flex-col">
        <select
          value={filtroPosicao}
          onChange={(e) => setFiltroPosicao(e.target.value)}
          className="flex-1 p-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm max-sm:w-full"
        >
          <option value="">Posição original</option>
          {POSICOES_ARRAY.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
                  <motion.button
                   onClick={aplicarFiltroPosicao}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm shadow-lg transition-all duration-300 flex items-center gap-2 max-sm:w-full max-sm:justify-center"
        >
          <FaCheck className="text-xs sm:text-sm" />
          Aplicar
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Lista de jogadores */}
            
<div className="mb-4">
              <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2 flex items-center gap-2">
                <FaUser className="text-blue-400 text-sm sm:text-base" /> Jogadores Disponíveis
              </label>


  {/* Botões */}
  <div className="flex flex-row gap-2 w-full sm:w-auto">
    <motion.button
      onClick={recarregarJogadores}
      disabled={carregandoJogadores}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-1/2 sm:flex-1 flex items-center justify-center gap-1 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all"
    >
      <FaSync className={carregandoJogadores ? "animate-spin w-3 h-3 sm:w-4 sm:h-4" : "w-3 h-3 sm:w-4 sm:h-4"} />
      <span>Atualizar</span>
    </motion.button>

    <motion.button
      onClick={() => setJogadoresSelecionados(jogadoresSelecionados.map(j => ({ ...j, presente: true })))}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-1/2 sm:flex-1 flex items-center justify-center gap-1 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all"
    >
      <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
      <span>Todos</span>
    </motion.button>
  </div>
</div>


            {/* Seletor de balanceamento */}
            <div className="mb-4">
              <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2 flex items-center gap-2">
                <FaBalanceScale className="text-blue-400 text-sm sm:text-base" /> Balanceamento
              </label>
              <select
                value={balanceamento}
                onChange={(e) => setBalanceamento(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value={TIPOS_BALANCEAMENTO.ALEATORIO} className="bg-gray-800">Aleatório</option>
                <option value={TIPOS_BALANCEAMENTO.NIVEL} className="bg-gray-800">Por Nível</option>
                <option value={TIPOS_BALANCEAMENTO.POSICAO} className="bg-gray-800">Por Posição</option>
                <option value={TIPOS_BALANCEAMENTO.MISTO} className="bg-gray-800">Misto (Nível + Posição)</option>
              </select>
            </div>

            {/* Lista de jogadores selecionados */}
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
                  <FaTshirt className="text-blue-400 text-sm sm:text-base" /> Jogadores Selecionados ({jogadoresSelecionados.filter(j => j.presente).length}/{jogadoresSelecionados.length})
                </h3>
                <div className="text-xs text-gray-400">
                  Serão formados 2 times
                </div>
              </div>

              {carregandoJogadores ? (
                <div className="flex justify-center py-3 sm:py-4">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="max-h-64 sm:max-h-96 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {jogadoresSelecionados.length === 0 ? (
                      <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">
                        Nenhum jogador cadastrado encontrado
                      </div>
                    ) : (
                      jogadoresSelecionados.map((jogador) => (
                        <JogadorItem key={jogador._id} jogador={jogador} />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Botão de sortear */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={sortearTimes}
              disabled={jogadoresSelecionados.filter(j => j.presente).length < 2 || carregando}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                jogadoresSelecionados.filter(j => j.presente).length < 2 || carregando
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg"
              }`}
            >
              {carregando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sorteando...</span>
                </>
              ) : (
                <>
                  <FaRandom className="text-sm" />
                  <span>Sortear Times</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Seção de times sorteados */}
        {times.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden mb-6"
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Times Sorteados
                  <span className="block text-xs sm:text-sm font-normal text-gray-400 mt-1">
                    {balanceamento === TIPOS_BALANCEAMENTO.ALEATORIO ? "Aleatório" : 
                     balanceamento === TIPOS_BALANCEAMENTO.NIVEL ? "Por Nível" : 
                     balanceamento === TIPOS_BALANCEAMENTO.POSICAO ? "Por Posição" : "Misto"}
                  </span>
                </h2>
                
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setModoEdicao(!modoEdicao)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg ${modoEdicao ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title={modoEdicao ? 'Salvar edição' : 'Editar times'}
                  >
                    {modoEdicao ? <FaSave size={14} /> : <FaEdit size={14} />}
                  </motion.button>
                  
                  <motion.button
                    onClick={compartilharTimes}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    title="Compartilhar times"
                  >
                    <FaShare size={14} />
                  </motion.button>
                </div>
              </div>
              
              <div className="space-y-4">
                {times.map((time, index) => (
                  <TimeSorteado key={index} time={time} index={index} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Seção de histórico */}
        {historico.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden"
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-300 flex items-center gap-2">
                  <FaHistory className="text-blue-400" /> Últimos Sorteios
                </h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto pr-2">
                {historico.map((sorteio, idx) => (
                  <HistoricoItem key={idx} sorteio={sorteio} index={idx} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

