import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaFilePdf, 
  FaFileImage, 
  FaArrowLeft, 
  FaSave, 
  FaTable,
  FaEdit,
  FaIdCard,
  FaTimesCircle,
  FaFileDownload,
  FaLink,
  FaSync,
  FaShareAlt,
  FaCopy,
  FaCalendarAlt,
  FaFutbol,
  FaAward,
  FaTrophy,
  FaCheckCircle,
  FaLock,
  FaUserTimes,
  FaUser,
  FaCrown,
  FaSkull,
  FaMagic,
  FaListOl,
  FaExclamationTriangle
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from "react-toastify";
import ConfirmModal from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function InformacoesPartida() {
  const navigate = useNavigate();
  const { id: partidaIdUrl } = useParams();
  const [abaAtiva, setAbaAtiva] = useState('partida'); // 'planilhas' ou 'partida'
  
  // Estados da Planilha (Existentes)
  const [planilhas, setPlanilhas] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [planilhaAtiva, setPlanilhaAtiva] = useState(null);
  const [titulo, setTitulo] = useState('Nova Planilha');
  const [subtitulo, setSubtitulo] = useState('');
  const [modalConfirm, setModalConfirm] = useState({ aberto: false, tipo: '', index: null, titulo: '', msg: '' });
  const [modalEdit, setModalEdit] = useState({ aberto: false, tipo: '', index: null, valor: '', nomeOriginal: '', time: 'Preto', quantidade: 1 });
  const [tabela, setTabela] = useState([['Cabeçalho', 'Valor'], ['', '']]);
  const [mostrarSugestoesEdit, setMostrarSugestoesEdit] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Estados da Partida (Novos)
  const [partidas, setPartidas] = useState([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [linkGeradoPartida, setLinkGeradoPartida] = useState('');
  const [linkGeradoPartidaExpireAt, setLinkGeradoPartidaExpireAt] = useState(null);
  const [linkVotacao, setLinkVotacao] = useState('');
  const [linkVotacaoExpireAt, setLinkVotacaoExpireAt] = useState(null);
  const [countdownEventos, setCountdownEventos] = useState('');
  const [countdownVotacao, setCountdownVotacao] = useState('');
  
  // Estados para Estatísticas de Atletas
  const [atletaParaStats, setAtletaParaStats] = useState("");
  const [showRankingModal, setShowRankingModal] = useState(false);

  // Modal de confirmação para exclusão de planilha
  const [confirmDeletePlanilha, setConfirmDeletePlanilha] = useState({ open: false, planilha: null });

  const refPlanilha = useRef(null);

  useEffect(() => {
    const carregarPlanilhas = async () => {
      try {
        setCarregando(true);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Faça login para carregar as planilhas');
        }

        const response = await api.get('/planilhas');
        const data = response.data?.data || response.data || [];
        setPlanilhas(data || []);

        if (data?.length > 0) {
          selecionarPlanilha(data[0]);
        }
      } catch (error) {
        setErro(error.message);
        toast.error(error.message);
      } finally {
        setCarregando(false);
      }
    };

    const carregarPartidasAgendadas = async () => {
      try {
        const res = await api.get('/agenda?populate=participantes'); // Solicita a população dos participantes
        setPartidas(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Erro ao carregar agenda", error);
      }
    };

    const carregarJogadores = async () => {
      try {
        const res = await api.get('/jogadores');
        setJogadores(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Erro ao carregar jogadores", error);
      }
    };

    carregarPlanilhas();
    carregarPartidasAgendadas();
    carregarJogadores();
  }, []);

  // Função para carregar links que já foram gerados anteriormente para esta partida
  const carregarLinksExistentes = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/partida-publica/links-por-partida/${id}`);
      const links = res.data.links || [];
      
      // Limpa os estados antes de preencher com os dados do banco
      setLinkGeradoPartida('');
      setLinkGeradoPartidaExpireAt(null);
      setLinkVotacao('');
      setLinkVotacaoExpireAt(null);

      links.forEach(l => {
        const url = l.tipo === 'eventos' 
          ? `${window.location.origin}/partida-publica/${l.linkId}`
          : `${window.location.origin}/votar-partida/${l.linkId}`;
        
        if (l.tipo === 'eventos') {
          setLinkGeradoPartida(url);
          setLinkGeradoPartidaExpireAt(l.expireAt);
        } else if (l.tipo === 'votacao') {
          setLinkVotacao(url);
          setLinkVotacaoExpireAt(l.expireAt);
        }
      });
    } catch (err) {
      console.error("Erro ao buscar links existentes", err);
    }
  };

  // Efeito para selecionar automaticamente a partida se vier via URL
  useEffect(() => {
    if (partidaIdUrl && partidas.length > 0) {
      const encontrada = partidas.find(p => p._id === partidaIdUrl);
      if (encontrada) {
        setPartidaSelecionada(encontrada);
        carregarLinksExistentes(encontrada._id);
      }
    }
  }, [partidaIdUrl, partidas]);

  // Função para salvar planilha
  const salvarPlanilha = async () => {
    try {
      setCarregando(true);
      
      // Validação básica
      if (!titulo.trim()) {
        toast.error('Título é obrigatório', {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true
        });
        return setCarregando(false);
      }

      const planilhaData = {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim(),
        tabela,
        dataAtualizacao: new Date().toISOString()
      };

      // Verificar token antes de salvar
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Faça login para salvar planilhas');
        return;
      }

      // Usar axios com timeout para salvar (PUT ou POST)
      const config = { timeout: 10000 };
      const endpoint = planilhaAtiva?._id ? `/planilhas/${planilhaAtiva._id}` : '/planilhas';
      const method = planilhaAtiva?._id ? api.put : api.post;

      const response = await method(endpoint, planilhaData, config);
      const data = response.data?.data || response.data;

      setPlanilhas(prev => 
        planilhaAtiva?._id 
          ? prev.map(p => p._id === data._id ? data : p)
          : [data, ...prev]
      );
      
      setPlanilhaAtiva(data);
      toast.success('Salvo!', {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: true
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error(
        error.name === 'AbortError' 
          ? 'Tempo limite excedido' 
          : error.message || 'Erro ao salvar',
        {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true
        }
      );
    } finally {
      setCarregando(false);
    }
  };

  // Função para calcular o vencedor de cada categoria em tempo real
  const getLiderVotacao = (categoriaId) => {
    if (!partidaSelecionada?.votos) return null;
    const votosCat = partidaSelecionada.votos.filter(v => v.categoria === categoriaId);
    if (votosCat.length === 0) return null;

    const contagem = votosCat.reduce((acc, v) => {
      acc[v.jogador] = (acc[v.jogador] || 0) + 1;
      return acc;
    }, {});

    const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);

    // Só considera líder se o primeiro tiver mais votos que o segundo
    if (ordenado.length > 1 && ordenado[0][1] === ordenado[1][1]) {
      return { nome: ordenado[0][0], total: ordenado[0][1], empate: true };
    }

    return { nome: ordenado[0][0], total: ordenado[0][1], empate: false };
  };

  // Função auxiliar para encontrar a foto do atleta pelo nome
  const getFotoJogador = (nome) => {
    if (!nome || nome === 'Ninguém' || nome === 'Houve um Empate' || nome === '-') return null;
    const nomeLimpo = nome.trim().toLowerCase();
    
    // 1. Tenta buscar nos participantes vinculados à partida (se populados)
    let p = partidaSelecionada?.participantes?.find(atleta => 
      (atleta.nome || atleta)?.toString().trim().toLowerCase() === nomeLimpo
    );

    // 2. Fallback: Busca na lista global de jogadores carregada do sistema
    if (!p || !p.foto) {
      p = jogadores.find(atleta => atleta.nome?.trim().toLowerCase() === nomeLimpo);
    }
    
    return p?.foto || null;
  };

  // Função para pegar a lista completa de votos por categoria
  const getTodosOsVotos = (categoriaId) => {
    if (!partidaSelecionada?.votos) return [];
    const votosCat = partidaSelecionada.votos.filter(v => v.categoria === categoriaId);
    if (votosCat.length === 0) return [];

    const contagem = votosCat.reduce((acc, v) => {
      acc[v.jogador] = (acc[v.jogador] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  };

  // Função para agrupar gols por jogador e mostrar o time
  const getGolsAgrupados = () => {
    const agrupados = [];
    if (!partidaSelecionada?.gols) return agrupados;
    
    partidaSelecionada.gols.forEach((g, index) => {
      const indexAgrupado = agrupados.findIndex(item => item.jogador === g.jogador);
      if (indexAgrupado > -1) {
        agrupados[indexAgrupado].total += 1;
        agrupados[indexAgrupado].ultimoIndex = index;
      } else {
        agrupados.push({
          jogador: g.jogador,
          total: 1,
          time: g.time,
          ultimoIndex: index
        });
      }
    });
    return agrupados.sort((a, b) => b.total - a.total);
  };

  // Cálculo dinâmico do placar para o painel admin
  const golsPreto = partidaSelecionada?.gols?.filter(g => g.time === 'Preto').length || 0;
  const golsAmarelo = partidaSelecionada?.gols?.filter(g => g.time === 'Amarelo').length || 0;

  const atualizarDadosPartida = async () => {
    if (!partidaSelecionada) return;
    try {
      setCarregando(true);
      const res = await api.get('/agenda?populate=participantes');
      const todas = res.data?.data || res.data || [];
      setPartidas(todas);
      const atualizada = todas.find(p => p._id === partidaSelecionada._id);
      if (atualizada) setPartidaSelecionada(atualizada);
      toast.success("Informações atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar dados da partida.");
    } finally {
      setCarregando(false);
    }
  };

  // Lógica para calcular estatísticas globais de todos os atletas
  const calcularEstatisticasGlobais = () => {
    const stats = {};
    
    // Inicializa estatísticas para todos os associados
    jogadores.filter(j => j.nivel === 'Associado').forEach(j => {
      stats[j.nome] = {
        nome: j.nome,
        foto: j.foto,
        gols: 0,
        amarelos: 0,
        vermelhos: 0,
        azuis: 0,
        melhor: 0,
        pereba: 0,
        golBonito: 0
      };
    });

    // Percorre todas as partidas para somar eventos
    partidas.forEach(p => {
      p.gols?.forEach(g => { if(stats[g.jogador]) stats[g.jogador].gols++; });
      p.cartoesAmarelos?.forEach(nome => { if(stats[nome]) stats[nome].amarelos++; });
      p.cartoesVermelhos?.forEach(nome => { if(stats[nome]) stats[nome].vermelhos++; });
      p.cartoesAzuis?.forEach(nome => { if(stats[nome]) stats[nome].azuis++; });
      
      // Integração com votos: Contabiliza apenas se foi o vencedor isolado da partida
      const categoriasVotos = [
        { id: 'melhorPartida', statKey: 'melhor' },
        { id: 'perebaPartida', statKey: 'pereba' },
        { id: 'golMaisBonito', statKey: 'golBonito' }
      ];

      categoriasVotos.forEach(cat => {
        const votosCat = p.votos?.filter(v => v.categoria === cat.id) || [];
        if (votosCat.length === 0) return;

        const contagem = votosCat.reduce((acc, v) => {
          acc[v.jogador] = (acc[v.jogador] || 0) + 1;
          return acc;
        }, {});

        const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
        const [vencedor, votosVencedor] = ordenado[0];
        const empate = ordenado.length > 1 && ordenado[1][1] === votosVencedor;

        // Só incrementa 1 ponto no ranking se não houver empate no primeiro lugar
        if (!empate && stats[vencedor]) {
          stats[vencedor][cat.statKey]++;
        }
      });
    });

    return stats;
  };

  // Função para capturar uma div específica e compartilhar como imagem (Print)
  const compartilharCaptura = async (idElemento, nomeArquivo) => {
    try {
      const { toPng } = await import('html-to-image');
      const elemento = document.getElementById(idElemento);
      if (!elemento) return;

      const dataUrl = await toPng(elemento, {
        backgroundColor: '#111827', // Fundo escuro padrão
        cacheBust: true,
        filter: (node) => {
          // Filtra elementos com a classe 'no-export' para não aparecerem no print
          return node.classList ? !node.classList.contains('no-export') : true;
        },
        style: {
          padding: '10px',
          borderRadius: '24px',
        }
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${nomeArquivo}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Resultados - SortTimes',
        });
      } else {
        const link = document.createElement('a');
        link.download = `${nomeArquivo}.png`;
        link.href = dataUrl;
        link.click();
        toast.info("Imagem baixada com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao capturar imagem:', error);
      toast.error('Erro ao gerar imagem para compartilhar');
    }
  };

  const estatisticasAtletas = calcularEstatisticasGlobais();
  const atletaSelecionadoStats = atletaParaStats ? estatisticasAtletas[atletaParaStats] : null;

  // Funções para manipulação da tabela
  const adicionarLinha = () => setTabela([...tabela, tabela[0].map(() => '')]);
  const adicionarColuna = () => setTabela(tabela.map(row => [...row, '']));
  
  const atualizarCelula = (linha, coluna, valor) => {
    const novaTabela = [...tabela];
    novaTabela[linha][coluna] = valor;
    setTabela(novaTabela);
  };

  const removerLinha = (index) => {
    if (index === 0 || tabela.length <= 2) return;
    setTabela(tabela.filter((_, i) => i !== index));
  };

  const removerColuna = (colIndex) => {
    if (tabela[0].length <= 1) return;
    setTabela(tabela.map(row => row.filter((_, i) => i !== colIndex)));
  };

  // Abre modal de confirmação para exclusão de planilha
  const deletarPlanilha = (id) => {
    const planilha = planilhas.find(p => p._id === id);
    if (!planilha) {
      toast.error('Planilha não encontrada');
      return;
    }

    setConfirmDeletePlanilha({ open: true, planilha });
  };

  // Realiza a exclusão efetiva (otimista com rollback)
  const performDeletePlanilha = async (id) => {
    const originalPlanilhas = [...planilhas];
    try {
      setCarregando(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Faça login para excluir planilhas');
        setConfirmDeletePlanilha({ open: false, planilha: null });
        return;
      }

      // Otimista: remove da UI imediatamente
      setPlanilhas(prev => prev.filter(p => p._id !== id));

      await api.delete(`/planilhas/${id}`);

      // Se a planilha ativa for a excluída, resetar o editor
      if (planilhaAtiva?._id === id) {
        setTitulo('Nova Planilha');
        setSubtitulo('');
        setTabela([['Cabeçalho', 'Valor'], ['', '']]);
        setPlanilhaAtiva(null);
      }

      toast.success('Excluído!', {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: true
      });
    } catch (error) {
      console.error('Erro:', error);
      setPlanilhas(originalPlanilhas);
      toast.error(`Falha ao excluir: ${error.message}`, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: true
      });
    } finally {
      setCarregando(false);
      setConfirmDeletePlanilha({ open: false, planilha: null });
    }
  };

  const criarNovaPlanilha = () => {
    setTitulo(`Nova Planilha ${planilhas.length + 1}`);
    setSubtitulo('');
    setTabela([['Cabeçalho', 'Valor'], ['', '']]);
    setPlanilhaAtiva(null);
  };

  const selecionarPlanilha = (planilha) => {
    setTitulo(planilha.titulo);
    setSubtitulo(planilha.subtitulo || '');
    setTabela(planilha.tabela);
    setPlanilhaAtiva(planilha);
  };

  // Funções para Modais de Confirmação e Edição (Gols e Cartões)
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
      // Usa o novo endpoint administrativo para exclusão
      const res = await api.delete(`/agenda/${partidaSelecionada._id}/evento/${tipo}/${index}`);
      setPartidaSelecionada(res.data.data);
      toast.success("Registro removido");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao remover");
    } finally {
      setModalConfirm({ ...modalConfirm, aberto: false });
    }
  };

  const handleEditarClick = (tipo, index, nomeAtual) => {
    let time = 'Preto';
    let quantidade = 1;

    if (tipo === 'gol-by-name') {
      const g = getGolsAgrupados().find(item => item.jogador === nomeAtual);
      if (g) {
        time = g.time;
        quantidade = g.total;
      }
    }
    setModalEdit({ aberto: true, tipo, index, valor: nomeAtual, nomeOriginal: nomeAtual, time, quantidade });
  };

  const confirmarEditar = async (e) => {
    if (e) e.preventDefault();
    const { tipo, index, valor, nomeOriginal } = modalEdit;

    // Se o valor estiver vazio, não faz nada
    if (!valor || valor.trim() === '') return;

    // Para cartões, se o nome não mudou, apenas fecha o modal. 
    // Para gols, permitimos prosseguir pois o time ou a quantidade podem ter mudado.
    if (tipo !== 'gol-by-name' && valor === nomeOriginal) {
      return setModalEdit({ ...modalEdit, aberto: false });
    }

    try {
      let res;
      if (tipo === 'gol-by-name') { // Edição de gol agregado por nome
        res = await api.patch(`/agenda/${partidaSelecionada._id}/evento/gol/by-name`, { 
          oldName: nomeOriginal, 
          newName: valor,
          newTime: modalEdit.time,
          newQuantity: modalEdit.quantidade
        });
      } else { // Edição de cartão por índice
        res = await api.patch(`/agenda/${partidaSelecionada._id}/evento/${tipo}/${index}`, { novoNome: valor });
      }
      setPartidaSelecionada(res.data.data);
      toast.success("Registro atualizado");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao atualizar");
    } finally {
      setModalEdit({ ...modalEdit, aberto: false });
    }
  };

  // Função auxiliar para formatar o tempo restante
  const formatTimeRemaining = (expireDate) => {
    if (!expireDate) return '';
    const now = new Date();
    const expiration = new Date(expireDate);
    const diff = expiration.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expirado!';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Efeito para contagem regressiva do link de Eventos
  useEffect(() => {
    let intervalIdEventos;
    if (linkGeradoPartidaExpireAt) {
      intervalIdEventos = setInterval(() => {
        setCountdownEventos(formatTimeRemaining(linkGeradoPartidaExpireAt));
      }, 1000);
    }
    return () => clearInterval(intervalIdEventos);
  }, [linkGeradoPartidaExpireAt]);

  // Efeito para contagem regressiva do link de Votação
  useEffect(() => {
    let intervalIdVotacao;
    if (linkVotacaoExpireAt) {
      intervalIdVotacao = setInterval(() => {
        setCountdownVotacao(formatTimeRemaining(linkVotacaoExpireAt));
      }, 1000);
    }
    return () => clearInterval(intervalIdVotacao);
  }, [linkVotacaoExpireAt]);

  // Funções para Geração de Link de Partida
  const gerarLinkPublicoPartida = async (tipo = 'eventos') => {
    if (!partidaSelecionada) return toast.warn("Selecione uma partida agendada!");
    try {
      setCarregando(true);
      
      const res = await api.post(`/partida-publica/gerar-link/${partidaSelecionada._id}`, { tipo });
      const linkId = res.data?.linkId || res.data?.data?.linkId;
      
      const expireAt = res.data?.expireAt; // Captura a data de expiração do backend

      const url = tipo === 'eventos' 
        ? `${window.location.origin}/partida-publica/${linkId}`
        : `${window.location.origin}/votar-partida/${linkId}`;

      if (tipo === 'eventos') {
        setLinkGeradoPartida(url);
        setLinkGeradoPartidaExpireAt(expireAt); // Armazena a data de expiração
      } else {
        setLinkVotacao(url);
        setLinkVotacaoExpireAt(expireAt); // Armazena a data de expiração
      }
      toast.success(`Link de ${tipo === 'eventos' ? 'Eventos' : 'Votação'} gerado com sucesso!`);
    } catch (error) {
      toast.error("Erro ao gerar link público.");
    } finally {
      setCarregando(false);
    }
  };

  const copiarLinkPartida = () => {
    navigator.clipboard.writeText(linkGeradoPartida);
    toast.info("Link copiado!");
  };

  const compartilharLinkVotacaoComMensagem = async () => {
    if (!linkVotacao || !partidaSelecionada) {
      toast.warn("Nenhum link de votação gerado ou partida selecionada.");
      return;
    }

    const mensagem = `🔥⚽ FALA, GALERA! ⚽🔥\n\n` +
      `Chegou a hora da resenha mais esperada 😎\n\n` +
      `️ A votação tá liberada!\n` +
      `Escolha seus destaques do jogo:\n\n` +
      `🥇 Melhor da Partida – quem brilhou em campo ✨\n` +
      `😅 Pereba da Partida – aquele que tava no modo economia 🐢\n` +
      `🚀 Gol Mais Bonito – o golaço da rodada 🎯\n\n` +
      `👇Clique no link abaixo e participe agora!\n\n` +
      `${linkVotacao}\n\n` +
      `Não fique de fora dessa resenha! 🔥\n\n` +
      `📲 Sua votação faz parte do jogo! ⚽💬`;

    await navigator.clipboard.writeText(mensagem);
    toast.success("Mensagem de votação copiada para a área de transferência!");
  };

  const compartilharResultados = () => {
    compartilharDestaques();
  };

  const compartilharGols = () => {
    const gols = getGolsAgrupados();
    if (gols.length === 0) return toast.info("Nenhum gol registrado.");
    const texto = gols.map(g => `⚽ ${g.jogador}: ${g.total} ${g.total > 1 ? 'GOLS' : 'GOL'} (${g.time})`).join('\n');
    const msg = `🔥 *RESUMO DE GOLS - SORT TIMES* 🔥\n\n${texto}`;
    navigator.clipboard.writeText(msg);
    toast.success("Resumo de gols copiado!");
  };

  const compartilharCartoes = () => {
    const p = partidaSelecionada;
    let texto = '';
    if (p.cartoesAmarelos?.length) texto += `🟨 Amarelos: ${p.cartoesAmarelos.join(', ')}\n`;
    if (p.cartoesVermelhos?.length) texto += `🟥 Vermelhos: ${p.cartoesVermelhos.join(', ')}\n`;
    if (p.cartoesAzuis?.length) texto += `🟦 Azuis: ${p.cartoesAzuis.join(', ')}\n`;
    if (!texto) return toast.info("Nenhum cartão registrado.");
    const msg = `⚠️ *RESUMO DE CARTÕES - SORT TIMES* ⚠️\n\n${texto}`;
    navigator.clipboard.writeText(msg);
    toast.success("Resumo de cartões copiado!");
  };

  const compartilharApuracao = () => {
    const p = partidaSelecionada;
    if (!p.votos?.length) return toast.info("Nenhum voto registrado ainda.");
    const cats = [
      { id: 'melhorPartida', label: 'Melhor' },
      { id: 'perebaPartida', label: 'Pereba' },
      { id: 'golMaisBonito', label: 'Golaço' }
    ];
    const texto = cats.map(c => {
      const lider = getLiderVotacao(c.id);
      return `${c.label}: ${lider ? `${lider.nome} (${lider.total} votos)` : '-'}`;
    }).join('\n');
    const msg = `🗳️ *APURAÇÃO DE VOTOS - SORT TIMES* 🗳️\n\n${texto}\n\nTotal de Participações: ${p.votos.length}`;
    navigator.clipboard.writeText(msg);
    toast.success("Resumo da apuração copiado!");
  };

  const compartilharDestaques = () => {
    const cats = [
      { id: 'melhorPartida', label: '🏆 Melhor' },
      { id: 'perebaPartida', label: '🐢 Pereba' },
      { id: 'golMaisBonito', label: '⚽ Golaço' }
    ];
    const texto = cats.map(d => `${d.label}: ${getLiderVotacao(d.id)?.nome || '-'}`).join('\n');
    const msg = `🌟 *DESTAQUES DA PARTIDA* 🌟\n\n${texto}`;
    navigator.clipboard.writeText(msg);
    toast.success("Destaques copiados!");
  };

  const compartilharRankingGeral = () => {
    const listaRanqueada = Object.values(estatisticasAtletas)
      .sort((a, b) => b.gols - a.gols || b.melhor - a.melhor);

    if (listaRanqueada.length === 0) return toast.info("Não há dados para compartilhar.");

    const medalhas = ["🥇", "🥈", "🥉"];
    const topRanking = listaRanqueada.slice(0, 10); // Compartilha o Top 10 para não ficar muito extenso

    let msg = `🏆 *RANKING GERAL DE ATLETAS* 🏆\n`;
    msg += `*SORT TIMES*\n\n`;

    topRanking.forEach((atleta, index) => {
      const pos = index < 3 ? medalhas[index] : `${index + 1}.`;
      msg += `${pos} *${atleta.nome.toUpperCase()}*\n`;
      msg += `   ⚽ Gols: ${atleta.gols} | 🏆 Melhor: ${atleta.melhor} | ✨ Golaços: ${atleta.golBonito}\n`;
      
      const temCartao = atleta.amarelos > 0 || atleta.vermelhos > 0 || atleta.azuis > 0;
      if (temCartao) {
        msg += `   ${atleta.amarelos > 0 ? `🟨 ${atleta.amarelos} ` : ""}${atleta.vermelhos > 0 ? `🟥 ${atleta.vermelhos} ` : ""}${atleta.azuis > 0 ? `🟦 ${atleta.azuis}` : ""}\n`;
      }
      msg += `\n`;
    });

    msg += `📊 _Total de Atletas Registrados: ${listaRanqueada.length}_\n`;
    msg += `🔥 *Universo Cajazeiras*`;

    if (navigator.share) {
      navigator.share({ title: 'Ranking Geral Sort Times', text: msg }).catch(err => console.error('Erro ao compartilhar:', err));
    } else {
      navigator.clipboard.writeText(msg);
      toast.success("Ranking copiado para o WhatsApp!");
    }
  };

  const voltarParaDashboard = () => navigate('/dashboard');

  const [exportModalOpen, setExportModalOpen] = useState(false);

  const exportarParaPDF = () => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(titulo, 14, 15);

        if (subtitulo) {
          doc.setFontSize(12);
          doc.text(subtitulo, 14, 22);
        }

        doc.setFontSize(10);
        doc.text(`Exportado em: ${new Date().toLocaleString()}`, 14, 29);

        let y = 40;
        tabela.forEach((linha, i) => {
          linha.forEach((celula, j) => {
            doc.setFontSize(i === 0 ? 12 : 10);
            doc.setTextColor(i === 0 ? '#000000' : '#333333');
            doc.text(celula, 14 + (j * 40), y);
          });
          y += 10;
        });

        doc.save(`planilha_${titulo}_${new Date().getTime()}.pdf`);
        resolve();
      }, 100);
    });
  };

  const exportarParaImagem = async () => {
    const { toPng } = await import('html-to-image');
    const elemento = refPlanilha.current;

    if (elemento) {
      const dataUrl = await toPng(elemento);
      const link = document.createElement('a');
      link.download = `planilha_${titulo}_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const exportarPDF = async () => {
    try {
      setCarregando(true);

      setExportModalOpen(true);

    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error(`Falha ao exportar: ${error.message}`, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: true
      });
      setCarregando(false);
    }
  };

  const confirmarExportarPDF = async () => {
    setExportModalOpen(false);
    try {
      setCarregando(true);
      await exportarParaPDF();
      toast.success('PDF gerado!', { position: 'bottom-right', autoClose: 1500, hideProgressBar: true });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Falha ao gerar PDF');
    } finally {
      setCarregando(false);
    }
  };

  const cancelarExportarImagem = async () => {
    setExportModalOpen(false);
    try {
      setCarregando(true);
      await exportarParaImagem();
      toast.success('Imagem gerada!', { position: 'bottom-right', autoClose: 1500, hideProgressBar: true });
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
      toast.error('Falha ao gerar imagem');
    } finally {
      setCarregando(false);
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

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative pt-16 sm:pt-0 text-center"
        >
          {/* Botão Voltar */}
          <motion.button 
            onClick={voltarParaDashboard}
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

          {/* Seletor de Abas */}
          <div className="flex bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl mb-10 w-fit mx-auto border border-white/5 shadow-2xl">
            <button
              onClick={() => setAbaAtiva('planilhas')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                abaAtiva === 'planilhas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Planilhas
            </button>
            <button
              onClick={() => setAbaAtiva('partida')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                abaAtiva === 'partida' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Informações Gerais
            </button>
          </div>

          {/* Cabeçalho com título e botões */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center flex-grow">
              <div className="flex items-center justify-center gap-3">
                <motion.h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1 flex items-center justify-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    {abaAtiva === 'planilhas' ? 'Gestão de Planilhas' : 'Painel Live'}
                  </span>
                </motion.h1>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                {abaAtiva === 'planilhas' ? 'Administração de Dados' : 'Monitoramento em Tempo Real'}
              </p>
            </div>

            <motion.div 
              className="flex gap-3 sm:flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {abaAtiva === 'planilhas' && (
                <>
              <button
                onClick={criarNovaPlanilha}
                className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/20 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all text-[10px]"
              >
                <FaPlus /> Nova Planilha
              </button>
              
              <button
                onClick={salvarPlanilha}
                disabled={carregando}
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl text-[10px] disabled:opacity-50"
              >
                <FaSave /> {carregando ? 'Salvando...' : 'Salvar'}
              </button>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {abaAtiva === 'planilhas' ? (
            <motion.div 
              key="aba-planilhas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              
              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Título da Planilha</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm font-bold"
                  placeholder="Ex: Estatísticas Maio"
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Subtítulo / Descrição</label>
                <input
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm"
                  placeholder="Detalhes adicionais..."
                />
              </div>

              {/* Tabela editável com scroll */}
              <div className="overflow-auto max-h-[60vh] rounded-lg border border-gray-700 shadow-xl no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <table className="min-w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-800/80 backdrop-blur-md">
                      {tabela[0].map((cabecalho, colIndex) => (
                        <th 
                          key={colIndex} 
                          className="p-4 border border-white/5 sticky top-0 min-w-[150px] text-center z-10"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <input
                              value={cabecalho}
                              onChange={(e) => atualizarCelula(0, colIndex, e.target.value)}
                              className="w-full bg-transparent font-bold text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1.5 placeholder-gray-400"
                              style={{ minWidth: '100px' }}
                            />
                            <div className="mt-1">
                              <button
                                onClick={() => removerColuna(colIndex)}
                                className="text-red-400/50 hover:text-red-400 transition-colors"
                                title="Remover coluna"
                              >
                                <FaTimesCircle />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="w-12 p-2 border border-white/5 sticky top-0 bg-slate-800/80 text-center z-10">
                        <button
                          onClick={adicionarColuna}
                          className="mx-auto flex justify-center text-blue-400 hover:text-blue-300 transition-colors"
                          title="Adicionar coluna"
                        >
                          <FaPlus />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabela.slice(1).map((linha, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className="hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        {linha.map((celula, colIndex) => (
                          <td key={colIndex} className="p-0 text-center border-r border-white/5">
                            <input
                              value={celula}
                              onChange={(e) => atualizarCelula(rowIndex + 1, colIndex, e.target.value)}
                              className="w-full h-full bg-transparent text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1.5"
                              style={{ minWidth: '100px' }}
                              placeholder="Digite aqui..."
                            />
                          </td>
                        ))}
                        <td className="w-10 text-center">
                          <button
                            onClick={() => removerLinha(rowIndex + 1)}
                            className="w-full h-full flex justify-center items-center text-red-400/30 hover:text-red-400 transition-colors"
                            title="Excluir linha"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 border-t border-white/5 pt-8">
                <button
                  onClick={adicionarLinha}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
                >
                  <FaPlus /> Adicionar Linha
                </button>
                
                <button
                  onClick={exportarPDF}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 border border-red-500/20"
                >
                  <FaFilePdf /> Gerar PDF
                </button>
              </div>
            </div>
          </div>

          {/* Lista de planilhas (1 coluna em desktop) com scroll */}
          <div className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10">
            <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-6 flex items-center gap-3">
              <FaTable /> Planilhas Salvas
            </h2>
            
            {planilhas.length === 0 ? (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic text-center py-8">Vazio...</p>
            ) : (
              <div className="overflow-y-auto max-h-[60vh] space-y-3 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {planilhas.map((planilha) => (
                  <div 
                    key={planilha._id}
                    onClick={() => selecionarPlanilha(planilha)}
                    className={`p-5 rounded-2xl cursor-pointer transition-all relative border ${
                      planilhaAtiva?._id === planilha._id 
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                        : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletarPlanilha(planilha._id);
                      }}
                      className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors"
                      title="Excluir planilha"
                    >
                      <FaTrash size={14} />
                    </button>
                    
                    <h3 className="font-bold">{planilha.titulo}</h3>
                    {planilha.subtitulo && <p className="text-sm text-gray-300 mt-1">{planilha.subtitulo}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Criada em: {new Date(planilha.dataAtualizacao).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
            </motion.div>
          ) : (
            <motion.div 
              key="aba-partida"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                    <FaAward className="text-blue-400" /> 
                    Estatísticas Acumuladas
                  </h2>
                  <button 
                    onClick={() => setShowRankingModal(true)}
                    className="flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <FaListOl /> Ver Ranking Geral
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  <div className="space-y-4 lg:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Selecionar Atleta</label>
                    <select 
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 text-white appearance-none transition-all"
                      value={atletaParaStats}
                      onChange={(e) => setAtletaParaStats(e.target.value)}
                    >
                      <option value="" className="bg-slate-900">Buscar atleta...</option>
                      {Object.keys(estatisticasAtletas).sort().map(nome => (
                        <option key={nome} value={nome}>{nome}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-500">* Os dados consideram todas as partidas e votos registrados no sistema.</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {atletaSelecionadoStats ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="lg:col-span-3 bg-black/40 p-5 rounded-2xl border border-blue-500/20 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                      >
                        <div className="relative">
                          {atletaSelecionadoStats.foto ? (
                            <img src={atletaSelecionadoStats.foto} className="w-24 h-24 rounded-full object-cover border-4 border-blue-600 shadow-xl" alt="" />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                              <FaUser className="text-slate-600 text-3xl" />
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                            <FaIdCard size={14} />
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">{atletaSelecionadoStats.nome}</h3>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                            {[
                              { label: 'Gols', value: atletaSelecionadoStats.gols, icon: <FaFutbol className="text-green-400" />, color: 'text-white' },
                              { label: 'Melhor', value: atletaSelecionadoStats.melhor, icon: '🏆', color: 'text-yellow-500' },
                              { label: 'Golaços', value: atletaSelecionadoStats.golBonito, icon: '✨', color: 'text-purple-400' },
                              { label: 'Pereba', value: atletaSelecionadoStats.pereba, icon: '💀', color: 'text-red-500' }
                            ].map((item, idx) => (
                              <div key={idx} className="bg-gray-900/80 p-2 rounded-xl border border-gray-700/50 text-center shadow-inner group hover:border-blue-500/30 transition-all">
                                <span className="block text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">{item.label}</span>
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-lg font-black ${item.color}`}>{item.value}</span>
                                  <span className="text-xs opacity-80">{item.icon}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            {[
                              { label: 'Amarelos', value: atletaSelecionadoStats.amarelos, color: 'bg-yellow-400', glow: 'shadow-[0_0_10px_rgba(250,204,21,0.4)]' },
                              { label: 'Vermelhos', value: atletaSelecionadoStats.vermelhos, color: 'bg-red-500', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.4)]' },
                              { label: 'Azuis', value: atletaSelecionadoStats.azuis, color: 'bg-blue-500', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]' }
                            ].map((card, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/50 pl-1.5 pr-3 py-1 rounded-xl group hover:border-gray-600 transition-colors">
                                <div className={`w-3 h-5 ${card.color} rounded-[2px] ${card.glow}`} />
                                <div className="flex flex-col items-start">
                                  <span className="text-[7px] text-gray-500 font-black uppercase leading-none mb-0.5">{card.label}</span>
                                  <span className="text-xs font-black text-white leading-none">{card.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="lg:col-span-3 h-40 border border-dashed border-white/5 bg-black/20 rounded-2xl flex flex-col items-center justify-center text-slate-600 w-full">
                        <FaUser size={24} className="mb-2 opacity-20" />
                        <p className="text-[10px] uppercase font-black tracking-widest">Selecione um associado</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-3">
                  <FaCalendarAlt className="text-cyan-400" /> Vínculo da Agenda
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Partida Correspondente</label>
                    <select 
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 text-white appearance-none transition-all"
                      value={partidaSelecionada?._id || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setPartidaSelecionada(partidas.find(p => p._id === id));
                        if (id) carregarLinksExistentes(id);
                      }}
                    >
                      <option value="">Escolha uma partida...</option>
                      {partidas.map(p => (
                        <option key={p._id} value={p._id}>
                          {new Date(p.data).toLocaleDateString()} - {p.local}
                        </option>
                      ))}
                    </select>
                    {partidaSelecionada && console.log("[FRONTEND - INFO PARTIDA] Partida Selecionada Participantes:", partidaSelecionada.participantes)}
                    {partidaSelecionada && (
                      <div className="mt-2 flex items-center gap-2">
                        {partidaSelecionada.participantes?.length > 0 ? (
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                            <FaCheckCircle /> Sorteio Realizado ({partidaSelecionada.participantes.length} atletas)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                            <FaExclamationTriangle /> Sorteio não vinculado. Votação bloqueada.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => gerarLinkPublicoPartida('eventos')}
                        disabled={!partidaSelecionada || carregando}
                        className="bg-blue-600 hover:shadow-blue-500/25 text-white py-2 px-4 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <FaFutbol className="animate-bounce" /> Link de Eventos
                      </button>
                      <button
                        onClick={() => gerarLinkPublicoPartida('votacao')}
                        disabled={!partidaSelecionada || carregando}
                        className="bg-amber-600 hover:shadow-amber-500/25 text-white py-2 px-4 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <FaAward /> Link de Votação (Pós-Jogo)
                      </button>
                    </div>
                </div>

                <AnimatePresence>
                  {(linkGeradoPartida || linkVotacao) && (
                    <motion.div 
                    key="links-container"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                    >
                      {/* Card do Link de Eventos */}
                      {linkGeradoPartida && (
                        <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 w-full sm:w-fit">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Link de Eventos (Gols e Cartões)</p>
                          <div className="text-xs font-mono text-blue-300 break-all bg-black/40 p-3 rounded-lg border border-white/5">
                            {linkGeradoPartida}
                          </div>
                          {countdownEventos && (
                            <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Expira em: <span className="text-white">{countdownEventos}</span></p>
                          )}
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(linkGeradoPartida); toast.info("Link de Eventos copiado!"); }}
                          className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center w-full sm:w-auto transition-all shadow-lg"
                          title="Copiar URL"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      )}

                      {/* Card do Link de Votação */}
                      {linkVotacao && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 w-full sm:w-fit">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Link de Votação para Atletas</p>
                          <div className="text-xs font-mono text-amber-400 break-all bg-black/40 p-3 rounded-lg border border-white/5">
                            {linkVotacao}
                          </div>
                          {countdownVotacao && (
                            <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Expira em: <span className="text-white">{countdownVotacao}</span></p>
                          )}
                        </div> 
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <button 
                            onClick={compartilharLinkVotacaoComMensagem}
                            className="bg-amber-600 hover:bg-amber-500 p-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center w-full sm:w-auto text-white transition-all shadow-lg"
                            title="Compartilhar Mensagem"
                          >
                            <FaShareAlt />
                          </button>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(linkVotacao); toast.info("Link de Votação copiado!"); }}
                            className="bg-amber-600 hover:bg-amber-500 p-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center w-full sm:w-auto text-white transition-all shadow-lg"
                            title="Copiar URL"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {partidaSelecionada && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> MONITORAMENTO LIVE
                    </span>
                    <button 
                      onClick={atualizarDadosPartida}
                      className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-xl"
                    >
                      <FaSync className={carregando ? 'animate-spin' : ''} /> Atualizar Placar
                    </button>
                  </div>

                  {/* Placar Bonito no Painel Admin */}
                  <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-green-400 tracking-tighter uppercase flex items-center gap-3">
                        <FaFutbol className="animate-pulse" /> Resumo de Gols
                      </h3>
                      <button onClick={compartilharGols} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-all" title="Compartilhar Gols">
                        <FaShareAlt size={16} />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {getGolsAgrupados().length > 0 ? (
                        getGolsAgrupados().map((g, i) => (
                          <div key={i} className="flex flex-col p-4 bg-black/20 rounded-[1.5rem] text-sm border border-white/5 hover:border-green-500/30 transition-all group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden shadow-inner group-hover:ring-2 ring-green-500/20 transition-all">
                                <img src={`/img/${g.time?.toLowerCase()}.png`} className="w-full h-full object-contain" alt={g.time} />
                              </div>
                              <span className="font-bold text-white">{g.jogador}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-green-500/20 uppercase tracking-tighter">{g.total} {g.total > 1 ? 'GOLS' : 'GOL'}</span>
                              <span className="text-[8px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Time {g.time}</span>
                            </div>
                            </div>
                            {/* Botões de Ação para Gols dentro do card */}
                            <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditarClick('gol-by-name', null, g.jogador)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Editar Gol">
                                <FaEdit size={14} />
                              </button>
                              <button onClick={() => handleRemoverClick('gol', g.ultimoIndex, g.jogador)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Remover Gol">
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">Nenhum evento registrado ainda.</p>
                      )}
                    </div>
                  </div>

                  {/* Resumo de Cartões no Painel Admin */}
                  <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-orange-400 tracking-tighter uppercase flex items-center gap-3">
                        <FaIdCard /> Cartões
                      </h3>
                      <button onClick={compartilharCartoes} className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-all" title="Compartilhar Cartões">
                        <FaShareAlt size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Amarelo', tipo: 'amarelo', field: 'cartoesAmarelos', bg: 'bg-yellow-400', shadow: 'shadow-yellow-500/20' },
                        { label: 'Vermelho', tipo: 'vermelho', field: 'cartoesVermelhos', bg: 'bg-red-500', shadow: 'shadow-red-500/20' },
                        { label: 'Azul', tipo: 'azul', field: 'cartoesAzuis', bg: 'bg-blue-500', shadow: 'shadow-blue-500/20' }
                      ].map(card => (
                        <div key={card.field} className="text-center bg-black/20 p-3 rounded-2xl border border-white/5 flex flex-col items-center transition-all hover:bg-black/30">
                          <div className={`w-5 h-7 ${card.bg} ${card.shadow} rounded-md mx-auto mb-2 shadow-lg ring-1 ring-white/10`}></div>
                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{card.label}</p>
                          <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto no-scrollbar w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {partidaSelecionada[card.field]?.length > 0 ? 
                              partidaSelecionada[card.field].map((nome, i) => (
                                <div key={i} className="flex justify-between items-center">
                                <p className="text-[10px] text-white truncate bg-gray-800/80 px-1.5 py-0.5 rounded-lg border border-gray-700/50 flex-1 mr-1 text-left">{nome}</p>
                                  <button onClick={() => handleEditarClick(card.tipo, i, nome)} className="text-blue-400 p-1"><FaEdit size={12}/></button>
                                  <button onClick={() => handleRemoverClick(card.tipo, i, nome)} className="text-red-400 p-1"><FaTrash size={12}/></button>
                                </div>
                              )) : <p className="text-[9px] text-gray-600">-</p>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card de Acesso Restrito: Apuração (Votação dos Atletas) */}
                  <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-amber-500 tracking-tighter uppercase flex items-center gap-3">
                        <FaLock className="size-4" /> Apuração
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-lg">
                          {partidaSelecionada.jogadoresQueVotaram?.length || 0} PARTICIPANTES
                        </span>
                        <button onClick={compartilharApuracao} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all" title="Compartilhar Apuração">
                          <FaShareAlt size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {[
                        { id: 'melhorPartida', label: 'Melhor da Partida', icon: <FaAward className="text-yellow-500" />, winnerIcon: <FaCrown size={8}/>, color: 'text-amber-500', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', border: 'border-amber-500', bgWinner: 'bg-amber-500' },
                        { id: 'perebaPartida', label: 'Pereba da Partida', icon: <FaUserTimes className="text-red-500" />, winnerIcon: <FaSkull size={8}/>, color: 'text-red-500', glow: 'shadow-red-500/20', bg: 'bg-red-500/10', border: 'border-red-500', bgWinner: 'bg-red-500' },
                        { id: 'golMaisBonito', label: 'Gol Mais Bonito', icon: <FaFutbol className="text-blue-400" />, winnerIcon: <FaMagic size={8}/>, color: 'text-blue-500', glow: 'shadow-blue-500/20', bg: 'bg-blue-500/10', border: 'border-blue-500', bgWinner: 'bg-blue-500' }
                      ].map(cat => {
                        const listaVotos = getTodosOsVotos(cat.id);
                        const totalCat = listaVotos.reduce((acc, v) => acc + v[1], 0);
                        const lider = getLiderVotacao(cat.id);

                        return (
                          <div key={cat.id} id={`apuracao-${cat.id}`} className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5 shadow-inner overflow-hidden">
                            <div className="flex justify-between items-center mb-2">
                              <span className="flex items-center gap-2">
                                {cat.icon}
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-tight">{cat.label}</p>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-amber-500/80">{totalCat} VOTOS</span>
                                <button 
                                  onClick={() => compartilharCaptura(`apuracao-${cat.id}`, `resultado-${cat.id}`)} 
                                  className="no-export text-gray-500 hover:text-white transition-colors p-1" 
                                  title="Compartilhar Print"
                                >
                                  <FaFileImage size={12} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Exibe o líder com foto no topo da categoria APENAS se houver um vencedor único (sem empate) */}
                            {lider && !lider.empate && (
                              <div className={`flex items-center gap-3 mb-3 ${cat.bg} p-2.5 rounded-2xl border border-${cat.color.split('-')[1]}/20`}>
                                <div className="relative">
                                  {getFotoJogador(lider.nome) ? (
                                    <img src={getFotoJogador(lider.nome)} className={`w-10 h-10 rounded-full object-cover border-2 ${cat.border} shadow-lg ${cat.glow}`} alt="" />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 ${cat.border} ${cat.color}`}><FaUser size={14} /></div>
                                  )}
                                  <div className={`absolute -top-1 -right-1 ${cat.bgWinner} text-black rounded-full p-0.5`}>{cat.winnerIcon}</div>
                                </div>
                                <div>
                                  <p className="text-xs font-black text-white">{lider.nome}</p>
                                </div>
                              </div>
                            )}

                            {listaVotos.length > 0 ? (
                              <div className="space-y-2">
                                {listaVotos.map(([nome, total], idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                      <div className="flex items-center gap-2">
                                        {getFotoJogador(nome) && (
                                          <img 
                                            src={getFotoJogador(nome)} 
                                            className="w-4 h-4 rounded-full object-cover border border-gray-600" 
                                            alt="" 
                                          />
                                        )}
                                        <span className={(idx === 0 && !lider?.empate) ? `font-bold ${cat.color}` : "text-gray-400"}>{nome}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-bold">{total} vts</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(total / totalCat) * 100}%` }}
                                        className={`h-full ${idx === 0 && !lider?.empate ? cat.bgWinner : 'bg-gray-600'}`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-600 italic">Nenhum voto ainda</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div id="secao-premiacoes" className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-yellow-500 tracking-tighter uppercase flex items-center gap-3">
                        <FaTrophy /> Premiações
                      </h3>
                      <button 
                        onClick={() => compartilharCaptura('secao-premiacoes', 'premiacoes-partida')} 
                        className="no-export p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all" 
                        title="Compartilhar Print das Premiações"
                      >
                        <FaFileImage size={16} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'melhorPartida', label: 'Melhor', icon: <FaAward className="text-yellow-500"/>, color: 'text-yellow-500', glow: 'ring-yellow-500/10', borderHover: 'hover:border-yellow-500/30' },
                        { id: 'perebaPartida', label: 'Pereba', icon: <FaUserTimes className="text-red-500"/>, color: 'text-red-500', glow: 'ring-red-500/10', borderHover: 'hover:border-red-500/30' },
                        { id: 'golMaisBonito', label: 'Gol Bonito', icon: <FaFutbol className="text-blue-400"/>, color: 'text-blue-400', glow: 'ring-blue-500/10', borderHover: 'hover:border-blue-500/30' }
                      ].map((d) => {
                        const lider = getLiderVotacao(d.id);
                        const valorOficial = partidaSelecionada.destaques?.[d.id];
                        const displayNome = lider?.empate ? "Houve um Empate" : (lider ? lider.nome : (valorOficial || '-'));
                        const foto = getFotoJogador(displayNome);
                        
                        return (
                          <div key={d.id} className={`group relative overflow-hidden bg-black/20 p-5 rounded-[1.5rem] border border-white/5 ${d.borderHover} transition-all`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform ring-4 ${d.glow}`}>
                                  {foto ? (
                                    <img src={foto} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="text-xl opacity-50">{d.icon}</div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-black text-gray-500 text-[9px] uppercase tracking-[0.2em] block mb-0.5">{d.label}</span>
                                  <span className={`${lider?.empate ? 'text-gray-500 italic text-xs' : 'text-white font-black text-sm uppercase'}`}>
                                    {displayNome}
                                  </span>
                                </div>
                              </div>
                              {lider && !lider.empate && (
                                <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/5 text-center shadow-lg">
                                  <span className={`text-[12px] font-black ${d.color} block leading-none`}>{lider.total}</span>
                                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Votos</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Confirmação (para exclusão de gols/cartões) */}
      <AnimatePresence>
        {modalConfirm.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 border border-gray-700 p-5 rounded-3xl max-w-[280px] w-full text-center">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle size={30} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{modalConfirm.titulo}</h3>
              <p className="text-gray-400 text-sm mb-6">{modalConfirm.msg}</p>
              <div className="flex gap-3">
                <button onClick={() => setModalConfirm({ ...modalConfirm, aberto: false })} className="flex-1 py-3 rounded-2xl bg-gray-700 font-bold text-white hover:bg-gray-600 transition-colors">VOLTAR</button>
                <button onClick={confirmarRemover} className="flex-1 py-3 rounded-2xl bg-red-600 font-bold text-white hover:bg-red-700 transition-colors">EXCLUIR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ranking Geral */}
      <AnimatePresence>
        {showRankingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-700 p-6 rounded-3xl max-w-4xl w-full flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
                  <FaListOl className="text-blue-400" /> Ranking Geral de Atletas
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={compartilharRankingGeral}
                    className="text-blue-400 hover:text-blue-300 p-2 bg-blue-500/10 rounded-xl transition-all"
                    title="Compartilhar Ranking"
                  >
                    <FaShareAlt size={18} />
                  </button>
                  <button onClick={() => setShowRankingModal(false)} className="text-gray-400 hover:text-white p-2">
                    <FaTimesCircle size={24} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto pr-1 no-scrollbar flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">
                      <th className="pb-2 text-left pl-4">Atleta</th>
                      <th className="pb-2">Gols</th>
                      <th className="pb-2">Melhor</th>
                      <th className="pb-2">Golaços</th>
                      <th className="pb-2">Cartões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(estatisticasAtletas)
                      .sort((a, b) => b.gols - a.gols || b.melhor - a.melhor)
                      .map((atleta, index) => (
                        <tr key={atleta.nome} className="bg-gray-900/50 hover:bg-gray-700 transition-colors rounded-xl">
                          <td className="py-3 px-4 rounded-l-2xl border-l border-t border-b border-gray-700">
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold w-5 ${index < 3 ? 'text-yellow-500' : 'text-gray-600'}`}>#{index + 1}</span>
                              {atleta.foto ? (
                                <img src={atleta.foto} className="w-8 h-8 rounded-full object-cover border border-gray-600 shadow-md" alt="" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-600"><FaUser size={12}/></div>
                              )}
                              <span className="text-sm font-bold text-white uppercase tracking-tighter">{atleta.nome}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center border-t border-b border-gray-700">
                            <span className="text-sm font-black text-green-400">⚽ {atleta.gols}</span>
                          </td>
                          <td className="py-3 text-center border-t border-b border-gray-700">
                            <span className="text-sm font-black text-yellow-500">🏆 {atleta.melhor}</span>
                          </td>
                          <td className="py-3 text-center border-t border-b border-gray-700">
                            <span className="text-sm font-black text-purple-400">✨ {atleta.golBonito}</span>
                          </td>
                          <td className="py-3 px-4 rounded-r-2xl border-r border-t border-b border-gray-700 text-center">
                            <div className="flex justify-center gap-2">
                              {atleta.amarelos > 0 && <span className="text-[10px] font-bold text-yellow-400">🟨{atleta.amarelos}</span>}
                              {atleta.vermelhos > 0 && <span className="text-[10px] font-bold text-red-500">🟥{atleta.vermelhos}</span>}
                              {atleta.azuis > 0 && <span className="text-[10px] font-bold text-blue-400">🟦{atleta.azuis}</span>}
                              {atleta.amarelos + atleta.vermelhos + atleta.azuis === 0 && <span className="text-gray-600 opacity-20">-</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-500 mt-4 text-center italic uppercase tracking-widest font-bold">* Ranking baseado no histórico completo do sistema</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edição (para gols/cartões) */}
      <AnimatePresence>
        {modalEdit.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-800 border border-gray-700 p-5 rounded-3xl max-w-[280px] w-full relative">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><FaEdit className="text-blue-400" /> Editar Registro</h3>
              <form onSubmit={confirmarEditar} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Jogador</label>
                  <div className="relative">
                    <style>{`
                      #modal-edit-input::-webkit-calendar-picker-indicator {
                        display: none !important;
                      }
                    `}</style>
                    <input 
                      id="modal-edit-input"
                      autoFocus
                      value={modalEdit.valor}
                      onChange={(e) => {
                        setModalEdit({ ...modalEdit, valor: e.target.value });
                        setMostrarSugestoesEdit(true);
                      }}
                      onFocus={() => setMostrarSugestoesEdit(true)}
                      className="w-full bg-gray-900 border border-gray-700 p-4 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white mt-1 appearance-none transition-all"
                      placeholder="Nome do jogador"
                    />
                    <button 
                      type="button"
                      onClick={() => setMostrarSugestoesEdit(!mostrarSugestoesEdit)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 mt-0.5 text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      <FaUser />
                    </button>
                    <AnimatePresence>
                      {mostrarSugestoesEdit && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full left-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto no-scrollbar"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {(() => {
                            const lista = jogadores
                            .filter(p => {
                              if (!p) return false;
                              const nome = (p.nome || '').toLowerCase();
                              const isAssociado = p.nivel === 'Associado';
                              const isAtivo = p.ativo !== false;
                              const matchesSearch = nome.includes((modalEdit.valor || '').toLowerCase());
                              const isPlaceholder = ['convidado', 'visitante', 'teste', 'outro'].some(t => nome.includes(t));
                              return isAssociado && isAtivo && !isPlaceholder && matchesSearch;
                            })
                            .sort((a, b) => a.nome.localeCompare(b.nome));

                            if (lista.length === 0) return <div className="p-4 text-center text-gray-500 text-xs italic">Nenhum associado encontrado</div>;

                            return lista.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setModalEdit({ ...modalEdit, valor: p.nome });
                                  setMostrarSugestoesEdit(false);
                                }}
                                className="w-full text-left p-3 hover:bg-blue-600/20 hover:text-blue-400 text-gray-300 text-sm border-b border-gray-800 last:border-0 transition-colors flex items-center gap-2"
                              >
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                {p.nome}
                              </button>
                            ));
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Overlay para fechar ao clicar fora */}
                    {mostrarSugestoesEdit && (
                      <div className="fixed inset-0 z-40" onClick={() => setMostrarSugestoesEdit(false)} />
                    )}
                  </div>
                </div>

                {modalEdit.tipo === 'gol-by-name' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time</label>
                      <select
                        value={modalEdit.time}
                        onChange={(e) => setModalEdit({ ...modalEdit, time: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white mt-1"
                      >
                        <option value="Preto">Preto</option>
                        <option value="Amarelo">Amarelo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gols</label>
                      <input 
                        type="number"
                        min="1"
                        max="99"
                        value={modalEdit.quantidade}
                        onChange={(e) => setModalEdit({ ...modalEdit, quantidade: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white mt-1"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalEdit({ ...modalEdit, aberto: false })} className="flex-1 py-3 rounded-2xl bg-gray-700 font-bold text-white hover:bg-gray-600 transition-colors">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700 transition-colors">SALVAR</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeletePlanilha.open && confirmDeletePlanilha.planilha && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setConfirmDeletePlanilha({ open: false, planilha: null })}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 sm:px-6 pt-4 pb-2 border-b border-gray-700">
                <h3 className="text-lg sm:text-xl font-bold text-white">Confirmar exclusão</h3>
                <motion.button
                  onClick={() => setConfirmDeletePlanilha({ open: false, planilha: null })}
                  whileHover={{ rotate: 90 }}
                  className="text-gray-400 hover:text-white text-sm sm:text-base"
                >
                  <FaTimesCircle />
                </motion.button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-300">
                  Você está prestes a excluir a planilha <span className="font-medium text-white">{confirmDeletePlanilha.planilha.titulo}</span>. Esta ação é permanente e não pode ser desfeita.
                </p>
                <div className="mt-3">
                  {confirmDeletePlanilha.planilha.subtitulo && (
                    <p className="text-xs text-gray-400">Subtítulo: <span className="font-medium text-white">{confirmDeletePlanilha.planilha.subtitulo}</span></p>
                  )}
                  <p className="text-xs text-gray-400">Atualizada em: <span className="font-medium text-white">{new Date(confirmDeletePlanilha.planilha.dataAtualizacao).toLocaleDateString()}</span></p>
                </div>
              </div>

              <div className="mt-2 sm:mt-4 px-4 sm:px-6 pb-4 pt-2 border-t border-gray-700 flex justify-end gap-2 sm:gap-3 bg-gray-800/90">
                <motion.button
                  onClick={() => setConfirmDeletePlanilha({ open: false, planilha: null })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={() => performDeletePlanilha(confirmDeletePlanilha.planilha._id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
                >
                  Confirmar exclusão
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={exportModalOpen}
        title="Exportar Planilha"
        description="Clique em 'Exportar como PDF' para gerar um PDF ou 'Exportar como Imagem' para gerar PNG."
        confirmLabel="Exportar como PDF"
        cancelLabel="Exportar como Imagem"
        onConfirm={confirmarExportarPDF}
        onCancel={cancelarExportarImagem}
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
