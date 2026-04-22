// SorteioTimes.jsx
import { useState, useEffect } from "react";
import { 
  FaRandom, FaUser, FaTshirt, FaBalanceScale, FaCheck, FaTimes, 
  FaSync, FaArrowLeft, FaHistory, FaEdit, FaShare, FaSave, 
  FaTrash, FaUserCheck, FaUserTimes, FaSearch, FaCalendarAlt, FaUserPlus
} from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { GiSoccerKick } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import socket from '../services/socket';
import usePersistedState from '../hooks/usePersistedState';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
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

// Chaves para localStorage
const LOCAL_STORAGE_KEYS = {
  JOGADORES_SELECIONADOS: "jogadoresSelecionados",
  HISTORICO_SORTEIOS: "historicoSorteios"
  
};

// --- Sub-componentes movidos para fora para evitar re-montagens desnecessárias ---

const JogadorItem = ({ jogador, onAlternarPresenca, onAtualizarPosicao }) => (
  <motion.div
    key={jogador._id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className={`p-3 sm:p-4 rounded-2xl flex justify-between items-center mb-2 transition-all border ${jogador.presente ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_15px_-5px_rgba(59,130,246,0.2)]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
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
        onChange={(e) => onAtualizarPosicao(jogador._id, e.target.value)}
        className="bg-black/40 text-white text-[10px] p-2 rounded-xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none"
      >
        {POSICOES_ARRAY.map(pos => (
          <option key={pos} value={pos} className="bg-slate-900">{pos}</option>
        ))}
      </select>

      <motion.button
        onClick={() => onAlternarPresenca(jogador._id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-2.5 rounded-xl transition-all duration-300 border ${
          jogador.presente 
            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-500/20' 
            : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-500/20'
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

const TimeSorteado = ({ time, index, modoEdicao, onAddPlayer, onMoverJogador }) => {
  const isTimeAmarelo = index === 1;
  const nomeTime = index === 0 ? "Time (Preto)" : isTimeAmarelo ? "Time (Amarelo)" : time.nome;

  return (
    <div
      className={`border p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden ${
        modoEdicao ? 'border-dashed border-yellow-400' : 'border-white/10'
      } ${isTimeAmarelo ? 'bg-[#efdf8e] text-black' : 'bg-black/40 text-white'}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-50 bg-gradient-to-r from-transparent ${index === 0 ? 'via-slate-400' : 'via-yellow-400'} to-transparent`} />
      
      <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
        <div className="w-10"></div>
        <h3 className="text-xl font-black tracking-tighter uppercase flex items-center justify-center gap-2">
          <img 
            src={index === 0 ? "/img/preto.png" : "/img/amarelo.png"} 
            alt={nomeTime}
            className="w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transform transition-transform hover:scale-110"
          />
          {nomeTime}
        </h3>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAddPlayer(index)}
            className={`p-2 rounded-xl transition-all ${isTimeAmarelo ? 'bg-black/10 hover:bg-black/20 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title="Incluir jogador neste time"
          >
            <FaUserPlus size={14} />
          </motion.button>
        </div>
      </div>

      <ul className="space-y-2 sm:space-y-3">
        {time.jogadores.map((jogador, idx) => (
          <motion.li
            key={jogador.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-3 sm:p-4 rounded-2xl border ${isTimeAmarelo ? 'bg-black/10 border-black/10' : 'bg-[#111827] border-white/5'} hover:shadow-lg ${
              modoEdicao
                ? 'cursor-move border-dashed border-blue-500/50'
                : ''
            } transition-all`}
            draggable={modoEdicao}
            onDragStart={(e) => e.dataTransfer.setData('jogadorId', jogador.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const jogadorId = e.dataTransfer.getData('jogadorId');
              onMoverJogador(index, index, jogadorId);
            }}
          >
            <div className="flex justify-between items-center">
              <span className={`text-sm sm:text-base font-bold ${isTimeAmarelo ? 'text-black' : 'text-white'}`}>{jogador.nome}</span>
              <span className="text-yellow-400 text-xs sm:text-sm">{jogador.nivel} ⭐</span>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isTimeAmarelo ? 'text-black/60' : 'text-slate-500'}`}>
              Posição: {jogador.posicao}
            </div>
          </motion.li>
        ))}
      </ul>

      <div className={`mt-6 text-center text-[10px] font-black uppercase tracking-[0.2em] ${
        isTimeAmarelo ? 'text-black/50' : 'text-slate-500'
      }`}>
        Total: <span className={isTimeAmarelo ? 'text-black' : 'text-white'}>{time.jogadores.length}</span> Atletas
      </div>
    </div>
  );
};

/**
 * Componente principal para sorteio de times de futebol
 * Permite selecionar jogadores, definir posições e balancear times de diferentes formas
 */
export default function SorteioTimes() {
  const navigate = useNavigate();
  
  // Estados do componente
  const [jogadoresCadastrados, setJogadoresCadastrados] = useState([]);
  const [jogadoresSelecionados, setJogadoresSelecionados] = usePersistedState(LOCAL_STORAGE_KEYS.JOGADORES_SELECIONADOS, []);
  const [times, setTimes] = usePersistedState('timesSorteados', []);
  const [balanceamento, setBalanceamento] = useState(TIPOS_BALANCEAMENTO.POSICAO);
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [carregandoJogadores, setCarregandoJogadores] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [filtroPosicao, setFiltroPosicao] = useState('');
  const [filtroJogadoresSelecionados, setFiltroJogadoresSelecionados] = useState('');
  const [showLimparHistoricoModal, setShowLimparHistoricoModal] = useState(false);
  const [partidasAgenda, setPartidasAgenda] = useState([]);
  const [partidaVinculadaId, setPartidaVinculadaId] = useState('');

  // Estados para inclusão manual de jogadores pós-sorteio
  const [modalAddPlayer, setModalAddPlayer] = useState({ open: false, teamIndex: null });
  const [nomeNovoJogador, setNomeNovoJogador] = useState("");
  const [sugestoes, setSugestoes] = useState([]);

  // Configuração do socket.io para atualizações em tempo real.
  useEffect(() => {
  let isMounted = true; // Flag para evitar atualizações após desmontagem

  const connectToSocket = async () => {
    try {
      // Conecta ao Socket.IO
      socket.connect();

      // Configura listeners
      const setupListeners = () => {
        socket.on('connect', () => {
          console.log('Conectado ao Socket.IO');
          toast.success('Conexão em tempo real ativa');
        });

        socket.on('times-atualizados', (novosTimes) => {
          if (isMounted) {
            setTimes(novosTimes);
          }
        });

        socket.on('presencaAtualizada', ({ jogadorId, presente }) => {
          if (isMounted) {
            setJogadoresSelecionados(prev => 
              prev.map(j => j._id === jogadorId ? { ...j, presente } : j)
            );
          }
        });

        socket.on('connect_error', (err) => {
          console.error('Erro de conexão Socket.IO:', err);
          toast.warning('Conexão em tempo real interrompida');
          
          // Tentar reconectar após 5 segundos
          setTimeout(() => {
            if (isMounted) socket.connect();
          }, 5000);
        });

        socket.on('disconnect', (reason) => {
          console.log('Desconectado do Socket.IO:', reason);
          if (reason === 'io server disconnect') {
            // Reconexão manual necessária
            socket.connect();
          }
        });
      };

      setupListeners();

    } catch (err) {
      console.error('Erro ao configurar Socket.IO:', err);
      toast.error('Recursos em tempo real não disponíveis');
    }
  };

  connectToSocket();

  // Cleanup quando o componente desmonta
  return () => {
    isMounted = false;
    
    // Remove todos os listeners específicos
    socket.off('connect');
    socket.off('times-atualizados');
    socket.off('presencaAtualizada');
    socket.off('connect_error');
    socket.off('disconnect');
    
    // Desconecta apenas se o socket ainda está conectado
    if (socket.connected) {
      socket.disconnect();
    }
  };
}, []); // Dependências vazias para executar apenas no mount/unmount

  /**
   * Compartilha a lista de jogadores selecionados
   */
  const compartilharJogadoresSelecionados = () => {
  const jogadoresPresentes = jogadoresSelecionados.filter(j => j.presente);

  if (jogadoresPresentes.length === 0) {
    toast.info("Nenhum jogador marcado como presente.");
    return;
  }

  const listaNomes = jogadoresPresentes
    .map((j, i) => `${i + 1}. ${j.nome}`)
    .join('\n');

  const texto = `✅ *Lista dos Jogadores Confirmados:*\n\n${listaNomes}\n\nVamos com tudo pra mais um jogão! ⚽`;

  if (navigator.share) {
    navigator.share({
      title: 'Jogadores Confirmados',
      text: texto
    }).catch(err => console.error('Erro ao compartilhar:', err));
  } else {
    navigator.clipboard.writeText(texto);
    toast.success("Lista copiada para área de transferência!");
  }
};

  // Carrega jogadores do backend ao montar o componente
  useEffect(() => {
    const carregarPartidas = async () => {
      try {
        const res = await api.get('/agenda');
        setPartidasAgenda(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Erro ao carregar agenda");
      }
    };
    carregarPartidas();
  }, []);

  useEffect(() => {
    const carregarHistoricoGlobal = async () => {
      try {
        const res = await api.get('/sorteio-times/historico');
        if (res.data && res.data.success) {
          setHistorico(res.data.data);
        }
      } catch (err) {
        console.error("Erro ao carregar histórico global:", err);
      }
    };

  const carregarJogadores = async () => {
    setCarregandoJogadores(true);
    try {
      const response = await api.get('/jogadores');
      const apiData = response.data;
      const jogadores = Array.isArray(apiData?.data) ? apiData.data : [];

      setJogadoresSelecionados(prev => {
        // Mantém os estados existentes e adiciona novos jogadores
        return jogadores.map(jogador => {
          const existente = prev.find(j => j._id === jogador._id);
          return {
            ...jogador,
            presente: existente ? existente.presente : false, // Mantém o valor salvo
            posicao: existente?.posicao || jogador.posicao || POSICOES.MEIA,
            posicaoOriginal: jogador.posicao || POSICOES.MEIA,
            nivel: parseNivel(jogador.nivel)
          };
        });
      });
    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error("Erro ao carregar jogadores");
      }
    } finally {
      setCarregandoJogadores(false);
    }
  };

    carregarHistoricoGlobal();
  carregarJogadores();
}, []); // Executa apenas uma vez ao montar

//Carregar estado salvo
// Carrega estado salvo ao iniciar


//Evitar repetição de código
const parseNivel = (nivelStr) => {
  return nivelStr === 'Associado' ? NIVEL_JOGADOR.ASSOCIADO : 
         nivelStr === 'Convidado' ? NIVEL_JOGADOR.CONVIDADO : 
         NIVEL_JOGADOR.INICIANTE;
};

  /**
   * Alterna o estado de presença de um jogador
   * @param {string} id - ID do jogador
   */
const alternarPresenca = async (jogadorId) => {
  const linkId = localStorage.getItem('linkPresencaId');

  const jogador = jogadoresSelecionados.find(j => j._id === jogadorId);
  if (!jogador) return;

  const novoEstado = !jogador.presente;

  // Atualiza imediatamente localmente para feedback visual
  setJogadoresSelecionados(prev =>
    prev.map(j => j._id === jogadorId ? { ...j, presente: novoEstado } : j)
  );

  if (!linkId) {
    console.warn("Sem linkId encontrado, presença alterada apenas localmente.");
    return;
  }

  try {
    const response = await api.post(`/presenca/${linkId}/confirmar`, {
      jogadorId,
      presente: novoEstado
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Erro ao confirmar presença');
    }

    toast.success(novoEstado ? '✅ Presença confirmada!' : '❌ Presença desmarcada!');
  } catch (error) {
    console.error('Erro ao atualizar presença:', error);
    toast.error('Erro ao comunicar com o servidor.');
  }
};

 

useEffect(() => {
  const salvarAutomaticamente = setTimeout(() => {
    if (jogadoresSelecionados.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.JOGADORES_SELECIONADOS,
        JSON.stringify(jogadoresSelecionados)
      );
    }
  }, 1000); // Debounce de 1 segundo

  return () => clearTimeout(salvarAutomaticamente);
}, [jogadoresSelecionados]);
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

  // Helper para vincular participantes à partida (integração com votação)
  const vincularParticipantesNoSorteio = async (timesData) => {
    if (!partidaVinculadaId) return;
    
    try {
      // Extrai IDs válidos (MongoDB ObjectIds) de todos os jogadores nos times
      const participantesIds = timesData
        .flatMap(time => time.jogadores)
        .map(j => (j._id || j.id))
        .map(id => (id ? String(id) : null)) // Garante que seja string para o regex
        .filter(id => id && id.match(/^[0-9a-fA-F]{24}$/));

      if (participantesIds.length > 0) {
        console.log("[FRONTEND - SORTEIOTIMES] Sincronizando participantes para votação:", participantesIds);
        await api.post(`/partida-publica/vincular-participantes/${partidaVinculadaId}`, { 
          participantes: participantesIds 
        });
      }
    } catch (err) {
      console.error("Erro ao sincronizar participantes:", err);
    }
  };

  // Função para filtrar sugestões de jogadores ao digitar no modal
  const lidarMudancaNome = (valor) => {
    setNomeNovoJogador(valor);
    if (valor.trim().length > 1) {
      const jaEstaoNosTimes = times.flatMap(t => t.jogadores.map(j => j._id || j.id));
      const filtrados = jogadoresSelecionados.filter(j => 
        j.nome.toLowerCase().includes(valor.toLowerCase()) &&
        !jaEstaoNosTimes.includes(j._id)
      ).slice(0, 5);
      setSugestoes(filtrados);
    } else {
      setSugestoes([]);
    }
  };

  /**
   * Adiciona um jogador manualmente a um time após o sorteio
   */
  const adicionarJogadorAoTime = async () => {
    if (!nomeNovoJogador.trim() || modalAddPlayer.teamIndex === null) return;

    const nomeLimpado = nomeNovoJogador.trim();
    const index = modalAddPlayer.teamIndex;

    // Busca se o jogador já existe no sistema para manter o vínculo correto para votação
    // Pesquisa em jogadoresSelecionados que contém todos os atletas carregados do banco
    const jogadorExistente = jogadoresSelecionados.find(j =>
      j.nome.trim().toLowerCase() === nomeLimpado.toLowerCase()
    );

    const novoAtleta = {
      id: jogadorExistente?._id ? String(jogadorExistente._id) : `manual-${Date.now()}`,
      _id: jogadorExistente?._id ? String(jogadorExistente._id) : undefined,
      nome: jogadorExistente?.nome || nomeLimpado,
      posicao: jogadorExistente?.posicao || POSICOES.MEIA,
      nivel: jogadorExistente?.nivel || 1
    };

    // Atualiza os times criando uma nova referência (imutabilidade)
    const novosTimes = times.map((time, idx) => {
      if (idx === index) {
        const listaAtualizada = [...time.jogadores, novoAtleta];
        // Recalcula o nível médio do time atingido
        const nivelTotal = listaAtualizada.reduce((sum, j) => sum + (Number(j.nivel) || 1), 0);
        return {
          ...time,
          jogadores: listaAtualizada,
          nivelMedio: (nivelTotal / listaAtualizada.length).toFixed(2)
        };
      }
      return time;
    });
    
    setTimes(novosTimes);

    // Atualiza o histórico para garantir persistência ao restaurar
    if (historico.length > 0) {
      setHistorico(prev => prev.map((h, i) => i === 0 ? { ...h, times: novosTimes } : h));
    }

    // Integração automática com a votação
    if (partidaVinculadaId) {
      await vincularParticipantesNoSorteio(novosTimes);
    } else {
      console.warn("[SorteioTimes] Jogador adicionado apenas visualmente. Vincule uma partida para registrar na votação.");
    }

    toast.success(`${nomeLimpado} adicionado ao ${novosTimes[index].nome}`);
    setModalAddPlayer({ open: false, teamIndex: null });
    setNomeNovoJogador("");
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
    // Identifica a posição mais comum (posição padrão)
    const posicoes = jogadoresPresentes.map(j => j.posicao);
    const posicaoMaisComum = posicoes.sort((a,b) =>
      posicoes.filter(p => p === a).length - posicoes.filter(p => p === b).length
    ).pop();

    // Separa jogadores com posição diferente da mais comum
    const jogadoresDiferentes = jogadoresPresentes.filter(j => j.posicao !== posicaoMaisComum);
    const jogadoresPadrao = jogadoresPresentes.filter(j => j.posicao === posicaoMaisComum);

    // Embaralha os jogadores padrão
    const embaralhar = arr => arr.sort(() => Math.random() - 0.5);
    const jogadoresPadraoEmbaralhados = embaralhar([...jogadoresPadrao]);

    // Cria os times e garante que jogadores diferentes fiquem em times opostos
    let times = [[], []];

    // Distribui jogadores diferentes (um para cada time)
    jogadoresDiferentes.forEach((jogador, idx) => {
      times[idx % 2].push(jogador);
    });

    // Distribui o restante dos jogadores
    jogadoresPadraoEmbaralhados.forEach((jogador, idx) => {
      times[idx % 2].push(jogador);
    });

    // Monta o objeto de times para o restante do código
    const timesComIds = times.map((jogadores, idx) => ({
      nome: idx === 0 ? "Time (Preto)" : "Time (Amarelo)",
      jogadores: jogadores.map(j => ({
        ...j,
        id: j._id || Math.random().toString(36).substr(2, 9),
      }))
    }));

    setTimes(timesComIds);

    // Vincular participantes à partida agendada (não bloqueia o fluxo se falhar)
    try {
      if (partidaVinculadaId) {
        await vincularParticipantesNoSorteio(timesComIds);
      }
    } catch (syncErr) {
      console.error("Erro ao sincronizar participantes:", syncErr);
      toast.warning("Sorteio concluído, mas não foi possível sincronizar com a agenda.");
    }

    const novoSorteio = {
      times: timesComIds,
      data: new Date(),
      jogadoresPresentes: jogadoresPresentes.length,
      balanceamento,
      posicaoUnica: filtroPosicao
    };

    // Salva no banco de dados para compartilhamento entre dispositivos
    try {
      await api.post('/sorteio-times/historico', { ...novoSorteio, partidaVinculadaId });
      const resH = await api.get('/sorteio-times/historico');
      setHistorico(resH.data.data);
    } catch (err) {
      console.error("Erro ao persistir sorteio:", err);
      setHistorico(prev => [novoSorteio, ...prev].slice(0, 5));
    }

    toast.success(`Times sorteados com sucesso! ${timesComIds.length} times formados`);
  } catch (error) {
    console.error("Erro ao sortear times:", error);
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
    const response = await api.get('/jogadores');
    const apiData = response.data;
    const jogadores = Array.isArray(apiData?.data) ? apiData.data : [];

    setJogadoresCadastrados(jogadores);
    
    setJogadoresSelecionados(jogadores.map(jogador => {
      const existente = jogadoresSelecionados.find(j => j._id === jogador._id);
      return {
        ...jogador,
        posicaoOriginal: jogador.posicao || POSICOES.MEIA,
        presente: existente ? existente.presente : false,
        posicao: existente?.posicao || jogador.posicao || POSICOES.MEIA,
        nivel: jogador.nivel === 'Associado' ? NIVEL_JOGADOR.ASSOCIADO : 
              jogador.nivel === 'Convidado' ? NIVEL_JOGADOR.CONVIDADO : 
              NIVEL_JOGADOR.INICIANTE
      };
    }));
    
    toast.success('Jogadores atualizados com sucesso');
  } catch (error) {
    console.error("Erro:", error);
    if (error.response?.status === 401) {
      toast.error('Sessão expirada. Faça login novamente.');
    } else {
      toast.error(error.message || 'Erro ao atualizar jogadores');
    }
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
  const excluirDoHistorico = async (index) => {
    const itemSorteio = historico[index];
    
    if (itemSorteio && itemSorteio._id) {
      try {
        await api.delete(`/sorteio-times/historico/${itemSorteio._id}`);
      } catch (e) {
        console.error("Erro ao remover do histórico global:", e);
      }
    }

    // Se o item excluído for o mesmo que está na tela, limpa a exibição atual (apagar geral)
    if (itemSorteio && JSON.stringify(itemSorteio.times) === JSON.stringify(times)) {
      setTimes([]);
      setModoEdicao(false);
    }

    setHistorico(prev => prev.filter((_, i) => i !== index));
    toast.success('Sorteio removido!');
  };

  const limparTodoHistorico = () => {
    setShowLimparHistoricoModal(true);
  };

  const confirmarLimparHistorico = async () => {
    try {
      await api.delete('/sorteio-times/historico');
    } catch (e) {
      console.error("Erro ao limpar histórico global:", e);
    }

    setHistorico([]);
    setTimes([]); // Limpa também o resultado atual da tela
    setModoEdicao(false);
    setShowLimparHistoricoModal(false);
    toast.success("Histórico limpo com sucesso!");
  };

  /**
   * Compartilha os times sorteados
   */
   const compartilharTimes = () => {
    const texto = times.map((time, idx) => {
      let nomeTime;
      if (idx === 0) nomeTime = "Time (Preto)";
      else if (idx === 1) nomeTime = "Time (Amarelo)";
      else nomeTime = time.nome || `Time ${idx + 1}`;
      // Aqui faz a numeração dos jogadores
      return `${nomeTime}:\n${time.jogadores.map((j, i) => `${i + 1}. ${j.nome} (${j.posicao})`).join('\n')}`;
    }).join('\n\n');
    
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
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
              backgroundColor: "rgba(15, 23, 42, 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-0 -top-2 sm:top-2 w-12 h-12 flex items-center justify-center bg-slate-900/50 text-gray-200 rounded-2xl transition-all duration-300 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-blue-500/10"
            title="Voltar para o Dashboard"
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
          </motion.button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaRandom className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1 flex items-center justify-center gap-3"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  Sorteio de Times
                </span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"
            >
              Organização de Equipes
            </motion.p>
          </div>
        </motion.div>

        {/* Seção principal de configuração */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden mb-6"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
         <div className="p-4 sm:p-10">
            {/* Filtro de posição */}
            <div className="mb-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl shadow-inner">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                <FaCalendarAlt /> Vincular este Sorteio a uma Partida Agendada
              </label>
              <select
                value={partidaVinculadaId}
                onChange={(e) => setPartidaVinculadaId(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm appearance-none"
              >
                <option value="">Selecione a partida da agenda...</option>
                {partidasAgenda.map(p => (
                  <option key={p._id} value={p._id}>
                    {new Date(p.data).toLocaleDateString()} - {p.local}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">* Necessário para que apenas quem jogou possa votar depois.</p>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
    <div className="flex-1 max-sm:w-full">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
        <FaTshirt className="text-blue-400" /> Definir mesma posição para todos
      </label>
      <div className="flex gap-2 max-sm:flex-col">
        <select
          value={filtroPosicao}
          onChange={(e) => setFiltroPosicao(e.target.value)}
          className="flex-1 px-4 py-2 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm appearance-none max-sm:w-full"
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
          className="bg-slate-800 hover:bg-slate-700 text-blue-400 font-black uppercase tracking-widest px-5 py-2 rounded-xl transition-all text-[10px] border border-blue-500/20 max-sm:w-full max-sm:justify-center flex items-center gap-2"
        >
          <FaCheck className="text-xs" />
          Aplicar
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Lista de jogadores */}
            
<div className="mb-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                <FaUser className="text-blue-400 text-sm sm:text-base" /> Jogadores Disponíveis
              </label>

  {/* Botões */}
  <div className="flex flex-row gap-2 w-full sm:w-auto">
    <motion.button
      onClick={recarregarJogadores}
      disabled={carregandoJogadores}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-1/2 sm:flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all text-[10px] border border-white/5"
    >
      <FaSync className={carregandoJogadores ? "animate-spin w-3 h-3 sm:w-4 sm:h-4" : "w-3 h-3 sm:w-4 sm:h-4"} />
      <span>Atualizar</span>
    </motion.button>

    <motion.button
  onClick={() => {
    const todosPresentes = jogadoresSelecionados.every(j => j.presente);
    setJogadoresSelecionados(jogadoresSelecionados.map(j => ({
      ...j,
      presente: !todosPresentes
    })));
    toast.info(todosPresentes ? 'Todos os jogadores desmarcados' : 'Todos os jogadores marcados');
  }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="w-1/2 sm:flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all text-[10px] border border-white/5"
>
  <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{jogadoresSelecionados.every(j => j.presente) ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
</motion.button>
  </div>
</div>

            {/* Seletor de balanceamento */}
            <div className="mb-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                <FaBalanceScale className="text-blue-400 text-sm sm:text-base" /> Balanceamento
              </label>
              <select
                value={balanceamento}
                onChange={(e) => setBalanceamento(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm appearance-none"
              >
                <option value={TIPOS_BALANCEAMENTO.ALEATORIO} className="bg-gray-800">Aleatório</option>
                <option value={TIPOS_BALANCEAMENTO.NIVEL} className="bg-gray-800">Por Nível</option>
                <option value={TIPOS_BALANCEAMENTO.POSICAO} className="bg-gray-800">Por Posição</option>
                <option value={TIPOS_BALANCEAMENTO.MISTO} className="bg-gray-800">Misto (Nível + Posição)</option>
              </select>
            </div>

            {/* Lista de jogadores selecionados */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                  <FaTshirt className="text-blue-400 text-sm sm:text-base" />
                  Jogadores Selecionados ({jogadoresSelecionados.filter(j => j.presente).length}/{jogadoresSelecionados.length})
                </h3>

                <div className="flex items-center gap-2">
                  {/* Campo de pesquisa */}
                  <div className="relative w-48">
                    <input
                      type="text"
                      placeholder="Pesquisar jogador..."
                      value={filtroJogadoresSelecionados}
                      onChange={(e) => setFiltroJogadoresSelecionados(e.target.value)}
                      className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-[10px]"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-[10px]" />
                  </div>

                  <motion.button
                    onClick={compartilharJogadoresSelecionados}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                    title="Compartilhar jogadores presentes"
                  >
                    <FaShare className="text-white text-sm" />
                    Compartilhar
                  </motion.button>
                </div>
              </div>

              {carregandoJogadores ? (
                <div className="flex justify-center py-3 sm:py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="max-h-64 sm:max-h-96 overflow-y-auto pr-2 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <AnimatePresence>
                    {jogadoresSelecionados.length === 0 ? (
                      <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">
                        Nenhum jogador cadastrado encontrado
                      </div>
                    ) : (
                      jogadoresSelecionados
                        .filter(jogador => 
                          jogador.nome.toLowerCase().includes(filtroJogadoresSelecionados.toLowerCase())
                        )
                        .map((jogador) => (
                          <JogadorItem 
                            key={jogador._id} 
                            jogador={jogador} 
                            onAlternarPresenca={alternarPresenca}
                            onAtualizarPosicao={atualizarPosicao} />
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
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 text-sm shadow-xl ${
                jogadoresSelecionados.filter(j => j.presente).length < 2 || carregando
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white"
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
            className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden mb-6"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase">
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
                    className={`p-2.5 rounded-xl transition-all shadow-lg ${modoEdicao ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    title={modoEdicao ? 'Salvar edição' : 'Editar times'}
                  >
                    {modoEdicao ? <FaSave size={14} /> : <FaEdit size={14} />}
                  </motion.button>
                  
                  <motion.button
                    onClick={compartilharTimes}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                    title="Compartilhar times"
                  >
                    <FaShare size={14} />
                  </motion.button>
                </div>
              </div>
              
              <div className="space-y-4">
                {times.map((time, index) => (
                  <TimeSorteado 
                    key={index} 
                    time={time} 
                    index={index} 
                    modoEdicao={modoEdicao} 
                    onAddPlayer={(idx) => setModalAddPlayer({ open: true, teamIndex: idx })} 
                    onMoverJogador={moverJogador} />
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
            className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden mb-10"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50" />
            
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                  <FaHistory className="text-blue-400" /> Últimos Sorteios
                </h3>
                <button 
                  onClick={limparTodoHistorico}
                  className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20 flex items-center gap-2"
                >
                  <FaTrash size={10} /> Apagar Geral
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto pr-2 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {historico.map((sorteio, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-gray-400">{new Date(sorteio.data).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{sorteio.jogadoresPresentes} jogadores • {sorteio.times.length} times</div>
                      </div>
                      <button onClick={() => excluirDoHistorico(idx)} className="text-red-400 hover:text-red-300 p-1"><FaTrash size={14} /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {sorteio.times?.map((time, i) => (
                        <div key={i}>
                          <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm flex items-center gap-2">
                            {(i === 0 || i === 1) && (
                              <img 
                                src={i === 0 ? "/img/preto.png" : "/img/amarelo.png"} 
                                className="w-4 h-4 object-contain opacity-80" 
                                alt="" 
                              />
                            )}
                            {i === 0 ? "Time (Preto)" : i === 1 ? "Time (Amarelo)" : (time.nome || `Time ${i + 1}`)} ({time.jogadores?.length || 0})
                          </h4>
                          <ul className="text-xs sm:text-sm space-y-1 text-gray-400">
                            {time.jogadores?.slice(0, 3).map((j, jIdx) => (
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
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all text-[10px] border border-blue-500/20"
                      >
                        Restaurar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal para inclusão de jogador pós-sorteio */}
      <AnimatePresence>
        {modalAddPlayer.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setModalAddPlayer({ open: false, teamIndex: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaUserPlus className="text-blue-400" /> 
                Adicionar ao {modalAddPlayer.teamIndex === 0 ? 'Time Preto' : 'Time Amarelo'}
              </h3>
              <p className="text-gray-400 text-sm mb-4">Digite o nome do jogador que chegou para a partida ou selecione um da lista.</p>
              
              <input
                autoFocus
                list="jogadores-cadastrados-datalist"
                value={nomeNovoJogador}
                onChange={(e) => setNomeNovoJogador(e.target.value)}
                placeholder="Ex: Pedro Silva..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                onKeyPress={(e) => e.key === 'Enter' && adicionarJogadorAoTime()}
              />
              
              <datalist id="jogadores-cadastrados-datalist">
                {jogadoresSelecionados.map(j => (
                  <option key={j._id} value={j.nome} />
                ))}
              </datalist>

              <div className="flex gap-3">
                <button onClick={() => setModalAddPlayer({ open: false, teamIndex: null })} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors">CANCELAR</button>
                <button onClick={adicionarJogadorAoTime} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">ADICIONAR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={showLimparHistoricoModal}
        title="Confirmar exclusão de histórico"
        description="Deseja apagar TODO o histórico? Esta ação limpará todos os registros salvos e não pode ser desfeita."
        confirmLabel="Apagar Tudo"
        cancelLabel="Cancelar"
        onConfirm={confirmarLimparHistorico}
        onCancel={() => setShowLimparHistoricoModal(false)}
      />

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
