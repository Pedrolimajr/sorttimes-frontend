// SorteioTimes.jsx
import { useState, useEffect } from "react";
import { 
  FaRandom, FaUser, FaTshirt, FaBalanceScale, FaCheck, FaTimes, 
  FaSync, FaArrowLeft, FaHistory, FaEdit, FaShare, FaSave, 
  FaTrash, FaUserCheck, FaUserTimes, FaLink, FaRegCalendarAlt, FaSearch 
} from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { GiSoccerKick } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from '../services/socket';
import usePersistedState from '../hooks/usePersistedState';
import api from '../services/api';
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
// Defina a chave para o localStorage
const STORAGE_KEY = 'jogadoresPresenca';
/**
 * Componente principal para sorteio de times de futebol
 * Permite selecionar jogadores, definir posições e balancear times de diferentes formas
 */
export default function SorteioTimes() {
  const navigate = useNavigate();
  
  // Estados do componente
  const [jogadoresCadastrados, setJogadoresCadastrados] = useState([]);
 const [jogadoresSelecionados, setJogadoresSelecionados] = usePersistedState(
  LOCAL_STORAGE_KEYS.JOGADORES_SELECIONADOS,
  []
);
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
  const [dataJogo, setDataJogo] = useState('');
  const [filtroJogadoresSelecionados, setFiltroJogadoresSelecionados] = useState('');

  // Carrega dados do localStorage ao montar o componente
  useEffect(() => {
    // Carregar histórico
    const historicoSalvo = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORICO_SORTEIOS);
    if (historicoSalvo) {
      setHistorico(JSON.parse(historicoSalvo));
    }

    // Carregar jogadores selecionados com estado de presença
    const jogadoresSalvos = localStorage.getItem(LOCAL_STORAGE_KEYS.JOGADORES_SELECIONADOS);
    if (jogadoresSalvos) {
      setJogadoresSelecionados(JSON.parse(jogadoresSalvos));
    }
  }, []);

  // Salva automaticamente no localStorage quando a lista de jogadores muda
  useEffect(() => {
    if (jogadoresSelecionados.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.JOGADORES_SELECIONADOS, 
        JSON.stringify(jogadoresSelecionados)
      );
    }
  }, [jogadoresSelecionados]);

  // Salva histórico no localStorage quando muda
  useEffect(() => {
    if (historico.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.HISTORICO_SORTEIOS, 
        JSON.stringify(historico)
      );
    }
  }, [historico]);

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
   * Gera um link para confirmação de presença e compartilha via WhatsApp
   */
  const gerarLinkPresenca = async () => {
    if (!dataJogo) {
      toast.warning('Por favor, selecione a data do jogo!');
      return;
    }

    try {
      const response = await api.post('/gerar-link-presenca', {
        jogadores: jogadoresSelecionados.map(j => ({
          id: j._id,
          nome: j.nome,
          presente: j.presente
        })),
        dataJogo
      });

      const linkId = response.data?.linkId;
      if (!linkId) throw new Error('Não foi possível gerar link');

      localStorage.setItem('linkPresencaId', linkId);

      const linkCompleto = `${window.location.origin}/confirmar-presenca/${linkId}`;
      
      const dataFormatada = new Date(dataJogo).toLocaleString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Capitaliza a primeira letra da data para ficar mais elegante
      const dataFinal = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

      const mensagem = `⚽ *CONVOCAÇÃO GERAL* ⚽\n\n` +
        `Fala galera! A lista de presença está liberada! 🔥\n` +
        `Quem vai pro jogo? Confirma aí pra gente fechar os times!\n\n` +
        `🗓 *Data:* ${dataFinal}\n\n` +
        `📲 *Link para confirmação:* 👇\n` +
        `${linkCompleto}\n\n` +
        `_Bora pro jogo!_ 🏃💨`;

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

  // Persiste o histórico no localStorage
  useEffect(() => {
    localStorage.setItem('historicoSorteios', JSON.stringify(historico));
  }, [historico]);

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

    const novoSorteio = {
      times: timesComIds,
      data: new Date(),
      jogadoresPresentes: jogadoresPresentes.length,
      balanceamento,
      posicaoUnica: filtroPosicao
    };

    setHistorico([novoSorteio, ...historico]);setHistorico([novoSorteio, ...historico.slice(0, 4)]);
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
  const excluirDoHistorico = (index) => {
    setHistorico(prev => prev.filter((_, i) => i !== index));
    toast.success('Sorteio removido do histórico');
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
const TimeSorteado = ({ time, index }) => {
  const isTimeAmarelo = index === 1;
  const nomeTime = index === 0 ? "Time (Preto)" : isTimeAmarelo ? "Time (Amarelo)" : time.nome;

  return (
    <div
      key={index}
      className={`border p-4 rounded-lg ${
        modoEdicao ? 'border-dashed border-yellow-400' : 'border-gray-700'
      } ${isTimeAmarelo ? 'bg-[#efdf8e] text-black' : 'bg-gray-800/30 text-white'}`}
    >
      <h3 className="text-base sm:text-lg font-bold text-center mb-3 sm:mb-4 flex items-center justify-center gap-2">
        <div
          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
            index === 0 ? 'bg-gray-300 border-gray-400' : 'bg-yellow-500 border-yellow-400'
          }`}
        ></div>
        {nomeTime}
        <span className={`text-xs sm:text-sm font-normal ${
          isTimeAmarelo ? 'text-gray-800' : 'text-gray-400'
        }`}>
          (Nível: <span className="text-yellow-600">{time.nivelMedio}</span>)
        </span>
      </h3>

      <ul className="space-y-2 sm:space-y-3">
        {time.jogadores.map((jogador, idx) => (
          <motion.li
            key={jogador.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-2 sm:p-3 rounded-md border bg-[#111827] hover:bg-[#1f2937] ${
              modoEdicao
                ? 'cursor-move border-dashed border-gray-500'
                : 'border-gray-600'
            } transition-colors`}
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
            <div className="text-xs text-gray-300 mt-0.5 sm:mt-1">
              Posição: {jogador.posicao}
            </div>
          </motion.li>
        ))}
      </ul>

      <div className={`mt-3 text-center text-xs sm:text-sm ${
        isTimeAmarelo ? 'text-gray-800' : 'text-gray-400'
      }`}>
        Total de jogadores: <strong>{time.jogadores.length}</strong>
      </div>
    </div>
  );
};

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 sm:px-6 lg:px-8 relative">
      {/* Efeitos de luz de fundo (Glow) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

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
  className="w-1/2 sm:flex-1 flex items-center justify-center gap-1 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all"
>
  <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{jogadoresSelecionados.every(j => j.presente) ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
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
                      className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  </div>

                  <motion.button
                    onClick={compartilharJogadoresSelecionados}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all"
                    title="Compartilhar jogadores presentes"
                  >
                    <FaShare className="text-white text-sm" />
                    Compartilhar
                  </motion.button>
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
                      jogadoresSelecionados
                        .filter(jogador => 
                          jogador.nome.toLowerCase().includes(filtroJogadoresSelecionados.toLowerCase())
                        )
                        .map((jogador) => (
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
