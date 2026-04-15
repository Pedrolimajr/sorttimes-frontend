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
  const [abaAtiva, setAbaAtiva] = useState('planilhas'); // 'planilhas' ou 'partida'
  
  // Estados da Planilha (Existentes)
  const [planilhas, setPlanilhas] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [planilhaAtiva, setPlanilhaAtiva] = useState(null);
  const [titulo, setTitulo] = useState('Nova Planilha');
  const [subtitulo, setSubtitulo] = useState('');
  const [modalConfirm, setModalConfirm] = useState({ aberto: false, tipo: '', index: null, titulo: '', msg: '' });
  const [modalEdit, setModalEdit] = useState({ aberto: false, tipo: '', index: null, valor: '', nomeOriginal: '', time: 'Preto', quantidade: 1 });
  const [tabela, setTabela] = useState([['Cabeçalho', 'Valor'], ['', '']]);
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
    if (!valor || valor.trim() === '' || valor === nomeOriginal) {
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
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Efeito de partículas */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100,
              y: Math.random() * 100,
              opacity: 0.3
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 50],
              x: [null, (Math.random() - 0.5) * 50],
            }}
            transition={{ 
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
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
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-4 top-0 sm:top-8 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          {/* Seletor de Abas */}
          <div className="flex bg-gray-800 p-1 rounded-xl mb-8 w-fit mx-auto border border-gray-700 shadow-lg">
            <button
              onClick={() => setAbaAtiva('planilhas')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                abaAtiva === 'planilhas' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Gerenciador de Planilhas
            </button>
            <button
              onClick={() => setAbaAtiva('partida')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                abaAtiva === 'partida' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Link de Eventos (Live)
            </button>
          </div>

          {/* Cabeçalho com título e botões */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Título e Subtítulo Centralizados */}
            <div className="flex flex-col items-center flex-grow">
              <div className="flex items-center justify-center gap-3">
                <FaTable className="text-blue-400 text-2xl sm:text-3xl" />
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
                >
                  {abaAtiva === 'planilhas' ? 'Informações das Partidas' : 'Registro em Tempo Real'}
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-sm sm:text-base mt-1"
              >
                {abaAtiva === 'planilhas' ? 'Gerencie as informações e detalhes das partidas' : 'Gere links públicos para registro de gols e cartões'}
              </motion.p>
            </div>

            {/* Botões de ação mantidos à direita */}
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
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg text-sm"
              >
                <FaPlus /> Nova Planilha
              </button>
              
              <button
                onClick={salvarPlanilha}
                disabled={carregando}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg text-sm"
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
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Título da Planilha"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">Subtítulo</label>
                <input
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Subtítulo"
                />
              </div>

              {/* Tabela editável com scroll */}
              <div className="overflow-auto max-h-[60vh] rounded-lg border border-gray-700 shadow-xl">
                <table className="min-w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-600">
                      {tabela[0].map((cabecalho, colIndex) => (
                        <th 
                          key={colIndex} 
                          className="p-2 border border-gray-500 sticky top-0 bg-gray-600 min-w-[150px] text-center"
                        >
                          <div className="flex flex-col items-center">
                            <input
                              value={cabecalho}
                              onChange={(e) => atualizarCelula(0, colIndex, e.target.value)}
                              className="w-full bg-transparent font-bold text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1.5 placeholder-gray-400"
                              style={{ minWidth: '100px' }}
                            />
                            <div className="mt-1">
                              <button
                                onClick={() => removerColuna(colIndex)}
                                className="text-red-400 hover:text-red-300 text-xs opacity-60 hover:opacity-100 transition-opacity"
                                title="Remover coluna"
                              >
                                <FaTimesCircle />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="w-10 p-2 border border-gray-500 sticky top-0 bg-gray-600 text-center">
                        <button
                          onClick={adicionarColuna}
                          className="mx-auto flex justify-center text-white hover:text-green-300 transition-colors"
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
                        className={`${
                          rowIndex % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'
                        } hover:bg-gray-600/50 transition-colors`}
                      >
                        {linha.map((celula, colIndex) => (
                          <td key={colIndex} className="border border-gray-600 p-0 text-center">
                            <input
                              value={celula}
                              onChange={(e) => atualizarCelula(rowIndex + 1, colIndex, e.target.value)}
                              className="w-full h-full bg-transparent text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 px-2 py-1.5"
                              style={{ minWidth: '100px' }}
                              placeholder="Digite aqui..."
                            />
                          </td>
                        ))}
                        <td className="border border-gray-600 w-10 text-center">
                          <button
                            onClick={() => removerLinha(rowIndex + 1)}
                            className="w-full h-full flex justify-center items-center text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition-opacity"
                            title="Remover linha"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-700 pt-4">
                <button
                  onClick={adicionarLinha}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg text-xs sm:text-sm"
                >
                  <FaPlus /> Adicionar Linha
                </button>
                
                <button
                  onClick={exportarPDF}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg text-xs sm:text-sm"
                >
                  <FaFilePdf /> Exportar PDF
                </button>
              </div>
            </div>
          </div>

          {/* Lista de planilhas (1 coluna em desktop) com scroll */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaTable /> Planilhas Salvas
            </h2>
            
            {planilhas.length === 0 ? (
              <p className="text-gray-400">Nenhuma planilha cadastrada</p>
            ) : (
              <div className="overflow-y-auto max-h-[60vh] space-y-3">
                {planilhas.map((planilha) => (
                  <div 
                    key={planilha._id}
                    onClick={() => selecionarPlanilha(planilha)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors relative ${
                      planilhaAtiva?._id === planilha._id 
                        ? 'bg-blue-900/30 border-blue-500' 
                        : 'border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletarPlanilha(planilha._id);
                      }}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      title="Excluir planilha"
                    >
                      <FaTrash />
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
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FaLink className="text-blue-400" /> Gerador de Link Público (24 Horas)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Selecionar Partida Agendada</label>
                    <select 
                      className="w-full bg-gray-900 border-gray-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
                      >
                        <FaLink /> Link de Eventos (Gols e Cartões)
                      </button>
                      <button
                        onClick={() => gerarLinkPublicoPartida('votacao')}
                        disabled={!partidaSelecionada || carregando}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
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
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Link de Eventos (Gols e Cartões)</p>
                          <div className="text-xs font-mono text-blue-300 break-all bg-gray-900 p-3 rounded-lg border border-blue-900/50">
                            {linkGeradoPartida}
                          </div>
                          {countdownEventos && (
                            <p className="text-xs text-gray-400 mt-2">Expira em: <span className="font-bold text-white">{countdownEventos}</span></p>
                          )}
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(linkGeradoPartida); toast.info("Link de Eventos copiado!"); }}
                          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2 w-full sm:w-auto"
                        >
                          <FaCopy /> Copiar
                        </button>
                      </div>
                      )}

                      {/* Card do Link de Votação */}
                      {linkVotacao && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Link de Votação para Atletas</p>
                          <div className="text-xs font-mono text-amber-400 break-all bg-gray-900 p-3 rounded-lg border border-amber-900/50">
                            {linkVotacao}
                          </div>
                          {countdownVotacao && (
                            <p className="text-xs text-gray-400 mt-2">Expira em: <span className="font-bold text-white">{countdownVotacao}</span></p>
                          )}
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(linkVotacao); toast.info("Link de Votação copiado!"); }}
                          className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2 w-full sm:w-auto text-white"
                        >
                          <FaCopy /> Copiar
                        </button>
                      </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {partidaSelecionada && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> MONITORAMENTO LIVE
                    </span>
                    <button 
                      onClick={atualizarDadosPartida}
                      className="text-xs flex items-center gap-2 text-gray-400 hover:text-white transition-all bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"
                    >
                      <FaSync className={carregando ? 'animate-spin' : ''} /> Atualizar Placar
                    </button>
                  </div>

                  {/* Placar Bonito no Painel Admin */}
                  <div className="bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-gray-700 shadow-2xl relative overflow-hidden group">
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
                  <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 border border-gray-700 shadow-xl border-t-green-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                        <div className="p-2 bg-green-500/10 rounded-lg"><FaFutbol className="animate-pulse" /></div> Resumo de Gols
                      </h3>
                      <button onClick={compartilharGols} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-all" title="Compartilhar Gols">
                        <FaShareAlt size={16} />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                      {getGolsAgrupados().length > 0 ? (
                        getGolsAgrupados().map((g, i) => (
                          <div key={i} className="flex flex-col p-3 bg-black/30 rounded-2xl text-sm border border-gray-700/50 hover:border-green-500/30 transition-colors group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center p-1.5 overflow-hidden shadow-inner group-hover:ring-2 ring-green-500/20 transition-all">
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
                            <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-gray-700 shadow-xl border-t-orange-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                        <FaIdCard /> Resumo de Cartões
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
                        <div key={card.field} className="text-center bg-black/20 p-2 sm:p-3 rounded-2xl border border-gray-700/50 flex flex-col items-center">
                          <div className={`w-5 h-7 ${card.bg} ${card.shadow} rounded-md mx-auto mb-2 shadow-lg ring-1 ring-white/10`}></div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{card.label}</p>
                          <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto no-scrollbar w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {partidaSelecionada[card.field]?.length > 0 ? 
                              partidaSelecionada[card.field].map((nome, i) => ( // Adicionado i para o key
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
                  <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-gray-700 shadow-xl border-t-amber-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
                        <FaLock className="text-amber-500 size-4" /> Votação dos Atletas (Apuração)
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
                          <div key={cat.id} className="bg-black/30 p-4 rounded-2xl border border-gray-700/50 shadow-inner overflow-hidden">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                {cat.icon}
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-tight">{cat.label}</p>
                              </div>
                              <span className="text-[9px] font-black text-amber-500/80">{totalCat} VOTOS</span>
                            </div>
                            
                            {/* Exibe o líder com foto no topo da categoria se houver votos */}
                            {lider && (
                              <div className={`flex items-center gap-3 mb-3 ${lider.empate ? 'bg-gray-800/50' : cat.bg} p-2.5 rounded-2xl border border-${cat.color.split('-')[1]}/20`}>
                                <div className="relative">
                                  {getFotoJogador(lider.nome) ? (
                                    <img src={getFotoJogador(lider.nome)} className={`w-10 h-10 rounded-full object-cover border-2 ${cat.border} shadow-lg ${cat.glow}`} alt="" />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border-2 ${cat.border} ${cat.color}`}><FaUser size={14} /></div>
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
                                      <span className="text-[10px] text-gray-500 font-bold">{total} vts</span>
                                    </div>
                                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
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
                              <p className="text-xs text-gray-600 italic">Nenhum voto ainda</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 border border-gray-700 shadow-xl border-t-yellow-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                        <FaTrophy /> Premiações da Partida
                      </h3>
                      <button onClick={compartilharDestaques} className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all" title="Compartilhar Destaques">
                        <FaShareAlt size={16} />
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
                          <div key={d.id} className={`group relative overflow-hidden bg-black/30 p-4 rounded-2xl border border-gray-700/50 ${d.borderHover} transition-all`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform ring-4 ${d.glow}`}>
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
                                <div className="bg-black/40 px-3 py-2 rounded-2xl border border-gray-700 text-center shadow-lg">
                                  <span className={`text-[12px] font-black ${d.color} block leading-none`}>{lider.total}</span>
                                  <span className="text-[8px] font-bold text-gray-500 uppercase">Votos</span>
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 border border-gray-700 p-6 rounded-3xl max-w-sm w-full text-center">
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

      {/* Modal de Edição (para gols/cartões) */}
      <AnimatePresence>
        {modalEdit.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-800 border border-gray-700 p-6 rounded-3xl max-w-sm w-full">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><FaEdit className="text-blue-400" /> Editar Registro</h3>
              <form onSubmit={confirmarEditar} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Jogador</label>
                  <input 
                    autoFocus
                    value={modalEdit.valor}
                    onChange={(e) => setModalEdit({ ...modalEdit, valor: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white mt-1"
                    placeholder="Nome do jogador"
                  />
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
