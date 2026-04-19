import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import {
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaTimes,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaPrint,
  FaCalendarAlt,
  FaUser,
  FaPlus,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaUsers,
  FaTimesCircle,
  FaShare,
  FaSearch,
  FaAward
} from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import ListaJogadores from './ListaJogadores';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api';
import domtoimage from 'dom-to-image';
import { getHojeSaoPauloISODate, getAnoMesAtualSaoPaulo } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
Chart.register(...registerables);

export default function Financeiro() {
  const navigate = useNavigate();
  const [filtroStatusFinanceiro, setFiltroStatusFinanceiro] = useState('');

  const [transacoes, setTransacoes] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [filtroMes, setFiltroMes] = useState(getAnoMesAtualSaoPaulo());
  const anoAtual = new Date().getFullYear().toString();
  const [carregando, setCarregando] = useState(true);
  const [relatorioModal, setRelatorioModal] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [mostrarListaJogadores, setMostrarListaJogadores] = useState(false);
  const [jogadorSelecionado, setJogadorSelecionado] = useState(null);
  const [filtroJogador, setFiltroJogador] = useState('');
  const [filtroHistorico, setFiltroHistorico] = useState({
    jogador: '',
    tipo: 'todos',
    categoria: '',
    ano: anoAtual
  });
  const [filtroExportacao, setFiltroExportacao] = useState({
    tipo: 'ano', // 'ano' ou 'mes'
    ano: anoAtual,
    mes: getAnoMesAtualSaoPaulo()
  });

  // Modal de confirmação para exclusão segura
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ open: false, transacao: null });
  const [novaTransacao, setNovaTransacao] = useState({
    descricao: "",
    valor: "",
    tipo: "receita",
    categoria: "",
    data: getHojeSaoPauloISODate(),
    jogadorId: "",
    jogadorNome: "",
    isento: false // Adicionando o estado para 'isento'
  });

  const [estatisticas, setEstatisticas] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    pagamentosPendentes: 0,
    totalJogadores: 0
  });

// No início do componente, adicione:
// const [isento, setIsento] = useState(false);

  const STORAGE_KEY = 'dadosFinanceiros';

  // Helper para normalizar datas (string ISO ou Date) em uma string ISO
  const getDataISO = (data) => {
    if (!data) return null;
    try {
      return typeof data === 'string' ? data : new Date(data).toISOString();
    } catch {
      return null;
    }
  };

 useEffect(() => {
  const carregarDados = async () => {
    try {
      setCarregando(true);

      // Tenta carregar do cache primeiro
      const cachedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (cachedData) {
        setJogadores(cachedData.jogadoresCache || []);
        setTransacoes(cachedData.transacoesCache || []);
      }

      // Busca dados da API
      const [jogadoresRes, transacoesRes] = await Promise.all([
        api.get('/jogadores'),
        api.get('/financeiro/transacoes')
      ]);

      const jogadoresData = jogadoresRes.data?.data || jogadoresRes.data || [];
      const transacoesData = transacoesRes.data?.data || transacoesRes.data || [];

      // Processa os jogadores
      const jogadoresProcessados = jogadoresData.map(jogador => {        
        const pagamentos = Array(12).fill({ pago: false, isento: false });
        if (jogador.pagamentos && Array.isArray(jogador.pagamentos)) {
          for (let i = 0; i < 12; i++) {
            const p = jogador.pagamentos[i];
            if (p && typeof p === 'object') {
              pagamentos[i] = { pago: !!p.pago, isento: !!p.isento };
            } else {
              // Legado: se for booleano, assume que é 'pago'
              pagamentos[i] = { pago: !!p, isento: false };
            }
          }
        }
        return {
          ...jogador,
          pagamentos: pagamentos,
              statusFinanceiro: jogador.statusFinanceiro || 'Inadimplente'
        };
      });

      // Atualiza estados
      setJogadores(jogadoresProcessados);
      setTransacoes(transacoesData);

      // Atualiza cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        jogadoresCache: jogadoresProcessados,
        transacoesCache: transacoesData,
        lastUpdate: new Date().toISOString()
      }));

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error('Erro ao carregar dados. Usando cache local se disponível.');
    } finally {
      setCarregando(false);
    }
  };

  carregarDados();
}, []);

  // Atualizar estatísticas
  useEffect(() => {
    const carregarEstatisticas = async () => {
      if (!transacoes || !jogadores) return; // Evita cálculos desnecessários
      
      try {
        // Usa apenas o ano do filtro para considerar todos os lançamentos do ano,
        // independente do mês de lançamento
        const anoFiltroEstatisticas = (filtroMes || '').slice(0, 4) || new Date().getFullYear().toString();

        const receitasAno = transacoes
          .filter(t => {
            if (!t || t.tipo !== "receita" || t.isento) return false; // Ignora transações isentas
            const dataStr = getDataISO(t.data || t.createdAt);
            if (!dataStr) return false;
            return dataStr.startsWith(anoFiltroEstatisticas);
          })
          .reduce((acc, t) => acc + (Number(t?.valor) || 0), 0);

        const despesasAno = transacoes
          .filter(t => {
            if (!t || t.tipo !== "despesa") return false;
            const dataStr = getDataISO(t.data || t.createdAt);
            if (!dataStr) return false;
            return dataStr.startsWith(anoFiltroEstatisticas);
          })
          .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

        const pagamentosPendentes = jogadores.reduce((total, jogador) => {
          return total + (jogador.pagamentos || []).filter(p => !p.pago && !p.isento).length;
        }, 0);

        setEstatisticas(prev => ({
          ...prev,
          totalReceitas: receitasAno,
          totalDespesas: despesasAno,
          saldo: receitasAno - despesasAno,
          pagamentosPendentes,
          totalJogadores: jogadores.length
        }));

      } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
        toast.error('Erro ao calcular estatísticas');
      }
    };

    carregarEstatisticas();
  }, [filtroMes, transacoes, jogadores]); // Dependências necessárias

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaTransacao(prev => ({ ...prev, [name]: value }));
  };

  // Adicionando transação
  const adicionarTransacao = async (e) => {
  e.preventDefault();

  // Declara a variável no escopo da função para que seja acessível no catch
  let transacaoTemporaria = null;

  try {
    if (!novaTransacao.data || !novaTransacao.valor || !novaTransacao.descricao) {
      throw new Error('Preencha todos os campos obrigatórios');
    }

    // Verificar se já existe transação para o mesmo jogador na mesma data
    if (novaTransacao.jogadorId) {
      const transacaoExistente = transacoes.find(t => {
        const dataTransacao = t.data?.split('T')[0];
        const dataNovaTransacao = novaTransacao.data;
        return dataTransacao === dataNovaTransacao && t.jogadorId === novaTransacao.jogadorId;
      });

      if (transacaoExistente) {
        throw new Error('Já existe uma transação para este jogador na data selecionada');
      }
    }

    const payload = {
      ...novaTransacao,
      valor: parseFloat(novaTransacao.valor),
      data: new Date(novaTransacao.data + 'T12:00:00').toISOString()
    };

    // Atualização otimista
    transacaoTemporaria = {
      ...payload,
      _id: 'temp-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    
    setTransacoes(prev => [transacaoTemporaria, ...prev]);

    // Chamada à API
    const response = await api.post('/financeiro/transacoes', payload);
    const transacaoReal = response.data?.data || response.data;

    if (!transacaoReal || !transacaoReal._id) {
      throw new Error('Resposta inválida do servidor ao criar transação');
    }

    // Atualizar estado com a transação real e atualizar cache com o novo array
    setTransacoes(prev => {
      const updated = [transacaoReal, ...prev.filter(t => t._id !== transacaoTemporaria._id)];
      // Atualiza cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        jogadoresCache: jogadores,
        transacoesCache: updated,
        lastUpdate: new Date().toISOString()
      }));
      return updated;
    });

    // Resetar formulário
    toast.success('Transação registrada com sucesso!');
      setNovaTransacao({
      descricao: "",
      valor: "",
      tipo: "receita",
      categoria: "",
      data: getHojeSaoPauloISODate(),
      jogadorId: "",
      jogadorNome: "",
      isento: false
    });

  } catch (error) {
    console.error("Erro ao adicionar transação:", error);
    
    // Remove a transação temporária apenas se ela foi criada
    if (transacaoTemporaria) {
      setTransacoes(prev => prev.filter(t => t._id !== transacaoTemporaria._id));
    }
    
    toast.error(error.message || 'Erro ao adicionar transação');
  }
};

  const togglePagamento = async (jogadorId, mesIndex) => {
    const jogadorAtual = jogadores.find(j => j._id === jogadorId);
    if (!jogadorAtual) {
      toast.error('Jogador não encontrado');
      return;
    }

    // Não permite alterar manualmente um pagamento isento
    if (jogadorAtual.pagamentos[mesIndex].isento) {
      toast.info('Este jogador é isento para este mês. A alteração manual não é permitida.');
      return;
    }

    const originalPagamentos = JSON.parse(JSON.stringify(jogadorAtual.pagamentos));

    try {
      // Atualização otimista - atualiza o estado imediatamente
      const updatedPagamentos = [...originalPagamentos];
      updatedPagamentos[mesIndex].pago = !updatedPagamentos[mesIndex].pago;

      // Atualiza o estado local primeiro
      setJogadores(prevJogadores => {
        const updatedJogadores = prevJogadores.map(j => {
          if (j._id === jogadorId) {
            return { ...j, pagamentos: updatedPagamentos };
          }
          return j;
        });

        // Atualiza o localStorage em batch
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          jogadoresCache: updatedJogadores,
          transacoesCache: transacoes,
          lastUpdate: new Date().toISOString()
        }));

        return updatedJogadores;
      });

      // Prepara o payload para a API
      const payload = {
        mes: mesIndex,
        pago: updatedPagamentos[mesIndex].pago,
        isento: false, // A isenção é tratada em outra rota
      };

      // Atualiza no banco de dados
      const response = await api.post(`/jogadores/${jogadorId}/pagamentos`, payload);

      if (!response.data || !response.data.data.jogador) {
        throw new Error('Resposta inválida do servidor');
      }

      // Atualiza o cache com os dados mais recentes
      const updatedJogador = response.data.data.jogador;
      setJogadores(prevJogadores => {
        const newJogadores = prevJogadores.map(j => 
          j._id === jogadorId ? {
            ...j,
            pagamentos: updatedJogador.pagamentos, // Usa o array de objetos completo do backend
            statusFinanceiro: updatedJogador.statusFinanceiro
          } : j
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          jogadoresCache: newJogadores,
          transacoesCache: transacoes,
          lastUpdate: new Date().toISOString()
        }));

        return newJogadores;
      });

    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      toast.error('Erro ao atualizar pagamento');
      
      // Reverte a mudança em caso de erro
      setJogadores(prevJogadores => {
        const revertedJogadores = prevJogadores.map(j => {
          if (j._id === jogadorId) {
            return {
              ...j, pagamentos: originalPagamentos
            };
          }
          return j;
        });

        // Atualiza o localStorage em batch
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          jogadoresCache: revertedJogadores,
          transacoesCache: transacoes,
          lastUpdate: new Date().toISOString()
        }));

        return revertedJogadores;
      });
    }
  };

  const toggleStatus = async (jogadorId) => {
    const jogadorAtual = jogadores.find(j => j._id === jogadorId);
    if (!jogadorAtual) {
      toast.error('Jogador não encontrado');
      return;
    }

    try {
      const newStatus = jogadorAtual.statusFinanceiro === 'Adimplente' ? 'Inadimplente' : 'Adimplente';

      // Atualização otimista - atualiza o estado imediatamente
      setJogadores(prevJogadores => {
        const updatedJogadores = prevJogadores.map(j => {
          if (j._id === jogadorId) {
            return {
              ...j,
              statusFinanceiro: newStatus
            };
          }
          return j;
        });

        // Atualiza o localStorage em batch
        requestAnimationFrame(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            jogadoresCache: updatedJogadores,
            transacoesCache: transacoes,
            lastUpdate: new Date().toISOString()
          }));
        });

        return updatedJogadores;
      });

      // Atualiza no banco de dados
      const response = await api.patch(`/jogadores/${jogadorId}/status`, { status: newStatus });

      if (!response.data) {
        throw new Error('Resposta inválida do servidor');
      }

    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error('Erro ao atualizar status');
      
      // Reverte a mudança em caso de erro
      setJogadores(prevJogadores => {
        const revertedJogadores = prevJogadores.map(j => {
          if (j._id === jogadorId) {
            return {
              ...j,
              statusFinanceiro: jogadorAtual.statusFinanceiro
            };
          }
          return j;
        });

        // Atualiza o localStorage em batch
        requestAnimationFrame(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            jogadoresCache: revertedJogadores,
            transacoesCache: transacoes,
            lastUpdate: new Date().toISOString()
          }));
        });

        return revertedJogadores;
      });
    }
  };

  const performDeleteTransacao = async (id) => {
    const originalTransacoes = [...transacoes];
    try {
      // Atualização otimista - remove a transação imediatamente e atualiza cache
      setTransacoes(prev => {
        const updated = prev.filter(t => t._id !== id);
        requestAnimationFrame(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            jogadoresCache: jogadores,
            transacoesCache: updated,
            lastUpdate: new Date().toISOString()
          }));
        });
        return updated;
      });

      // Chamada à API para deletar
      await api.delete(`/financeiro/transacoes/${id}`);

      toast.success('Transação removida com sucesso!');
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      // Reverte as mudanças em caso de erro
      setTransacoes(originalTransacoes);
      toast.error(error.message || 'Erro ao deletar transação');
    } finally {
      setConfirmDeleteModal({ open: false, transacao: null });
    }
  };

  const deletarTransacao = async (id) => {
    try {
      // Encontra a transação que será deletada
      const transacaoParaDeletar = transacoes.find(t => t._id === id);
      if (!transacaoParaDeletar) {
        throw new Error('Transação não encontrada');
      }

      // Segurança: somente permitir exclusão se a transação pertence ao ano filtrado
      const d = transacaoParaDeletar.data || transacaoParaDeletar.createdAt;
      if (!d) {
        throw new Error('Transação sem data não pode ser excluída por segurança');
      }
      const dataStr = typeof d === 'string' ? d : new Date(d).toISOString();
      const anoTransacao = Number(dataStr.slice(0,4));
      const filtroAnoSelecionado = filtroHistorico.ano;

      if (filtroAnoSelecionado && filtroAnoSelecionado !== 'Todos' && Number(filtroAnoSelecionado) !== anoTransacao) {
        toast.error('A exclusão só pode ser feita para transações do ano atualmente filtrado.');
        return;
      }

      // Abrir modal de confirmação para qualquer exclusão no histórico (garante confirmação explícita)
      setConfirmDeleteModal({ open: true, transacao: transacaoParaDeletar });
      return;
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      toast.error(error.message || 'Erro ao deletar transação');
    }
  };

  const deletarJogador = async (id) => {
    try {
      // Deletar jogador
      await api.delete(`/api/jogadores/${id}`);

      setJogadores(jogadores.filter(j => j._id !== id));
      setEditarModal(false);
      toast.success('Jogador removido com sucesso!');
    } catch (error) {
      console.error("Erro ao deletar jogador:", error);
      toast.error('Erro ao deletar jogador');
    }
  };

  // Filtrar transações do histórico (todas os anos, apenas por jogador/tipo)
  const transacoesFiltradas = transacoes
    .filter(t => {
      const d = t.data || t.createdAt;
      if (!d) return false;
      // Filtro por jogador
      if (filtroHistorico.jogador && t.jogadorId) {
        const jogador = jogadores.find(j => j._id === t.jogadorId);
        return jogador?.nome.toLowerCase().includes(filtroHistorico.jogador.toLowerCase());
      }
      return true;
    })
    .filter(t => {
      // Filtro por tipo
      if (filtroHistorico.tipo !== 'todos') {
        return t.tipo === filtroHistorico.tipo;
      }
      return true;
    })
    .filter(t => {
      // Filtro por ano (usa t.data, com fallback para createdAt)
      const d = t.data || t.createdAt;
      if (!d) return false;
      const dataStr = typeof d === 'string' ? d : new Date(d).toISOString();
      const anoTrans = dataStr.slice(0,4);
      if (filtroHistorico.ano && filtroHistorico.ano !== 'Todos') {
        return anoTrans === filtroHistorico.ano;
      }
      return true;
    })
    .sort((a, b) => new Date(b.data || b.createdAt) - new Date(a.data || a.createdAt)); // Ordena do mais recente para o mais antigo

  const dadosGraficoFluxoCaixa = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  datasets: [
    {
      label: 'Receitas',
      data: Array(12).fill(0).map((_, i) => {
        const mes = (i + 1).toString().padStart(2, '0');
        return transacoes
          .filter(t => {
            if (!t || t.tipo !== "receita") return false;
            const dataStr = getDataISO(t.data || t.createdAt);
            if (!dataStr) return false;
            return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${mes}`);
          })
          .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
      }),
      backgroundColor: '#4ade80',
      borderRadius: 6
    },
    {
      label: 'Despesas',
      data: Array(12).fill(0).map((_, i) => {
        const mes = (i + 1).toString().padStart(2, '0');
        return transacoes
          .filter(t => {
            if (!t || t.tipo !== "despesa") return false;
            const dataStr = getDataISO(t.data || t.createdAt);
            if (!dataStr) return false;
            return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${mes}`);
          })
          .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
      }),
      backgroundColor: '#f87171',
      borderRadius: 6
    },
    {
      label: 'Saldo',
      data: Array(12).fill(0).map((_, i) => {
        const mes = (i + 1).toString().padStart(2, '0');
        const receitas = transacoes
          .filter(t => {
            if (!t || t.tipo !== "receita") return false;
            const dataStr = getDataISO(t.data || t.createdAt);
            if (!dataStr) return false;
            return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${mes}`);
          })
          .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
        const despesas = transacoes
          .filter(t => {
            if (!t || t.tipo !== "despesa") return false;
            const dataStr = getDataISO(t.data || t.createdAt);
            if (!dataStr) return false;
            return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${mes}`);
          })
          .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
        return receitas - despesas;
      }),
      backgroundColor: '#60a5fa',
      borderRadius: 6
    }
  ]
};

  const dadosGraficoPizza = {
    labels: ['Pagamentos em dia', 'Pagamentos pendentes'],
    datasets: [{
      data: [
        jogadores.reduce((total, jogador) =>
          total + jogador.pagamentos.filter(p => p.pago || p.isento).length, 0
        ),
        jogadores.reduce((total, jogador) =>
          total + jogador.pagamentos.filter(p => !p.pago && !p.isento).length, 0
        )
      ],
      backgroundColor: ['#4ade80', '#f87171'],
      hoverOffset: 4,
      borderWidth: 0
    }]
  };

  const exportarPDF = async () => {
    try {
      const element = document.getElementById('relatorio-content');
      if (!element) {
        toast.error('Abra o relatório antes de exportar.');
        return;
      }

      // Ajusta estilos temporariamente para capturar todo o conteúdo (inclusive em mobile)
      const prevOverflow = element.style.overflow;
      const prevMaxHeight = element.style.maxHeight;
      const prevHeight = element.style.height;
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.height = 'auto';

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#1f2937',
      });

      // Restaura estilos
      element.style.overflow = prevOverflow;
      element.style.maxHeight = prevMaxHeight;
      element.style.height = prevHeight;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio-financeiro-${filtroMes}.pdf`);

      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const exportarImagem = async () => {
    try {
      const element = document.getElementById('relatorio-content');
      if (!element) {
        toast.error('Abra o relatório antes de exportar.');
        return;
      }

      // Ajusta estilos temporariamente para capturar todo o conteúdo (inclusive em mobile)
      const prevOverflow = element.style.overflow;
      const prevMaxHeight = element.style.maxHeight;
      const prevHeight = element.style.height;
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.height = 'auto';

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#1f2937',
      });

      // Restaura estilos
      element.style.overflow = prevOverflow;
      element.style.maxHeight = prevMaxHeight;
      element.style.height = prevHeight;

      const link = document.createElement('a');
      link.download = `relatorio-financeiro-${filtroMes}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem. Tente novamente.');
    }
  };

  const exportarExcel = () => {
    try {
      // Filtra as transações baseado no filtro de exportação
      let transacoesParaExportar = [...transacoes];

      if (filtroExportacao.tipo === 'ano') {
        // Filtra por ano
        const anoFiltro = filtroExportacao.ano;
        transacoesParaExportar = transacoesParaExportar.filter(t => {
          const dataStr = getDataISO(t.data || t.createdAt);
          if (!dataStr) return false;
          return dataStr.startsWith(anoFiltro);
        });
      } else if (filtroExportacao.tipo === 'mes') {
        // Filtra por mês específico
        const mesFiltro = filtroExportacao.mes;
        transacoesParaExportar = transacoesParaExportar.filter(t => {
          const dataStr = getDataISO(t.data || t.createdAt);
          if (!dataStr) return false;
          return dataStr.startsWith(mesFiltro);
        });
      }

      if (transacoesParaExportar.length === 0) {
        toast.warning('Nenhuma transação encontrada para o período selecionado.');
        return;
      }

      // Ordena por data (mais recente primeiro)
      transacoesParaExportar.sort((a, b) => {
        const dataA = new Date(a.data || a.createdAt);
        const dataB = new Date(b.data || b.createdAt);
        return dataB - dataA;
      });

      // Prepara os dados para o Excel
      const dadosExcel = transacoesParaExportar.map((t, index) => {
        const dataStr = getDataISO(t.data || t.createdAt);
        const dataFormatada = dataStr 
          ? new Date(dataStr).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })
          : 'Data não disponível';
        
        const jogadorNome = t.jogadorId 
          ? jogadores.find(j => j._id === t.jogadorId)?.nome || ''
          : '';

        return {
          'Nº': index + 1,
          'Data': dataFormatada,
          'Tipo': t.tipo === 'receita' ? 'Receita' : 'Despesa',
          'Descrição': t.descricao || '',
          'Jogador': jogadorNome,
          'Valor': Number(t.valor) || 0,
          'Status': t.isento ? 'Isento' : 'Normal',
          'Categoria': t.categoria || '-'
        };
      });

      // Cria a planilha
      const ws = XLSX.utils.json_to_sheet(dadosExcel);

      // Ajusta largura das colunas
      const colWidths = [
        { wch: 5 },   // Nº
        { wch: 12 },  // Data
        { wch: 10 },  // Tipo
        { wch: 30 },  // Descrição
        { wch: 20 },  // Jogador
        { wch: 15 },  // Valor
        { wch: 10 },  // Status
        { wch: 15 }   // Categoria
      ];
      ws['!cols'] = colWidths;

      // Formata cabeçalho
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }

      // Formata células de valor (coluna F - índice 5)
      for (let R = 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ c: 5, r: R });
        if (ws[cellAddress]) {
          ws[cellAddress].z = 'R$ #,##0.00';
          const tipo = transacoesParaExportar[R - 1]?.tipo;
          ws[cellAddress].s = {
            numFmt: 'R$ #,##0.00',
            font: { 
              color: { rgb: tipo === 'receita' ? '00B050' : 'FF0000' },
              bold: true
            }
          };
        }
      }

      // Formata células de tipo (coluna C - índice 2)
      for (let R = 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ c: 2, r: R });
        if (ws[cellAddress]) {
          const tipo = transacoesParaExportar[R - 1]?.tipo;
          ws[cellAddress].s = {
            fill: { 
              fgColor: { rgb: tipo === 'receita' ? 'C6EFCE' : 'FFC7CE' }
            },
            alignment: { horizontal: 'center' }
          };
        }
      }

      // Cria o workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transações');

      // Adiciona uma planilha de resumo
      const resumo = [
        { 'Métrica': 'Total de Transações', 'Valor': transacoesParaExportar.length },
        { 'Métrica': 'Total Receitas', 'Valor': transacoesParaExportar.filter(t => t.tipo === 'receita' && !t.isento).reduce((acc, t) => acc + (Number(t.valor) || 0), 0) },
        { 'Métrica': 'Total Despesas', 'Valor': transacoesParaExportar.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + (Number(t.valor) || 0), 0) },
        { 'Métrica': 'Saldo', 'Valor': transacoesParaExportar.filter(t => t.tipo === 'receita' && !t.isento).reduce((acc, t) => acc + (Number(t.valor) || 0), 0) - transacoesParaExportar.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + (Number(t.valor) || 0), 0) }
      ];

      const wsResumo = XLSX.utils.json_to_sheet(resumo);
      wsResumo['!cols'] = [{ wch: 20 }, { wch: 20 }];
      
      // Formata cabeçalho do resumo
      const rangeResumo = XLSX.utils.decode_range(wsResumo['!ref']);
      for (let C = rangeResumo.s.c; C <= rangeResumo.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!wsResumo[cellAddress]) continue;
        wsResumo[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '70AD47' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }

      // Formata valores do resumo
      for (let R = 1; R <= rangeResumo.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ c: 1, r: R });
        if (wsResumo[cellAddress] && R > 1) {
          wsResumo[cellAddress].z = 'R$ #,##0.00';
          wsResumo[cellAddress].s = {
            numFmt: 'R$ #,##0.00',
            font: { bold: true }
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

      // Gera o arquivo
      const nomeArquivo = filtroExportacao.tipo === 'ano' 
        ? `historico-transacoes-${filtroExportacao.ano}.xlsx`
        : `historico-transacoes-${filtroExportacao.mes}.xlsx`;

      XLSX.writeFile(wb, nomeArquivo);

      toast.success('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel. Tente novamente.');
    }
  };

  // const compartilharRelatorio = async () => {
  //   try {
  //     if (navigator.share) {
  //       const element = document.getElementById('relatorio-content');
  //       const canvas = await html2canvas(element, {
  //         scale: 2,
  //         logging: false,
  //         useCORS: true,
  //         backgroundColor: '#1f2937'
  //       });
        
  //       const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
  //       const file = new File([blob], 'relatorio-financeiro.png', { type: blob.type });
        
  //       await navigator.share({
  //         title: `Relatório Financeiro - ${filtroMes}`,
  //         text: `Status financeiro do time: ${estatisticas.saldo >= 0 ? 'Positivo' : 'Negativo'}`,
  //         files: [file]
  //       });
  //     } else {
  //       toast.info('Compartilhamento não suportado neste navegador');
  //     }
  //   } catch (error) {
  //     console.error('Erro ao compartilhar:', error);
  //     if (error.name !== 'AbortError') {
  //       toast.error('Erro ao compartilhar relatório');
  //     }
  //   }
  // };

  
 const compartilharControle = async () => {
  try {
    const tabelaOriginal = document.getElementById('tabela-mensalidades');
    if (!tabelaOriginal) throw new Error('Tabela não encontrada');

    // 1. Criar container principal com scroll horizontal
    const containerTemp = document.createElement('div');
    containerTemp.style.cssText = `
      background-color: #1f2937;
      padding: 15px;
      color: white;
      font-family: Arial, sans-serif;
      width: 100vw; /* Força largura total */
      overflow-x: auto; /* Permite scroll horizontal no mobile */
      -webkit-overflow-scrolling: touch; /* Melhora scroll no iOS */
      white-space: nowrap; /* Impede quebra de linha */
    `;

    // 2. Cabeçalho fixo (centralizado)
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = `
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #4ade80;
      margin-bottom: 15px;
      position: sticky;
      left: 0;
    `;
    cabecalho.textContent = '💰 MENSALIDADE: R$20,00';
    containerTemp.appendChild(cabecalho);

    // 3. Container FLEX para as tabelas (modificado para mobile)
    const tabelasContainer = document.createElement('div');
    tabelasContainer.style.cssText = `
      display: inline-flex; /* Mudei para inline-flex */
      gap: 15px;
      min-width: 200%; /* Dobro da largura para caber as duas tabelas */
    `;

    // 4. Clonagem das tabelas (igual ao anterior)
    const tabela1 = tabelaOriginal.cloneNode(false);
    const tabela2 = tabelaOriginal.cloneNode(false);
    
    // Cabeçalhos
    const theadOriginal = tabelaOriginal.querySelector('thead');
    if (theadOriginal) {
      tabela1.appendChild(theadOriginal.cloneNode(true));
      tabela2.appendChild(theadOriginal.cloneNode(true));
    }

    // Dividir jogadores
    const linhas = tabelaOriginal.querySelectorAll('tbody tr');
    const metade = Math.ceil(linhas.length / 2);

    // Preencher tabelas
    const tbody1 = document.createElement('tbody');
    const tbody2 = document.createElement('tbody');
    
    linhas.forEach((linha, index) => {
      (index < metade ? tbody1 : tbody2).appendChild(linha.cloneNode(true));
    });

    tabela1.appendChild(tbody1);
    tabela2.appendChild(tbody2);

    // 5. Estilo OTIMIZADO PARA MOBILE
    [tabela1, tabela2].forEach(tabela => {
      tabela.style.cssText = `
        width: auto; /* Tamanho automático */
        border-collapse: collapse;
        font-size: 12px; /* Reduzido para mobile */
        display: inline-table; /* Importante para mobile */
      `;
      
      Array.from(tabela.querySelectorAll('th, td')).forEach(cell => {
        cell.style.padding = '4px 2px';
        cell.style.border = '1px solid #374151';
        cell.style.fontSize = '12px';
      });
    });

    // 6. Montagem final
    tabelasContainer.appendChild(tabela1);
    tabelasContainer.appendChild(tabela2);
    containerTemp.appendChild(tabelasContainer);
    document.body.appendChild(containerTemp);

    // 7. Configuração de imagem ESPECÍFICA PARA MOBILE
    const options = {
      quality: 0.95,
      width: containerTemp.scrollWidth * 1.5, // Largura total incluindo scroll
      height: containerTemp.offsetHeight * 1.5,
      style: {
        transform: 'scale(1.5)',
        transformOrigin: 'top left',
        width: `${containerTemp.scrollWidth}px`,
        height: `${containerTemp.offsetHeight}px`
      },
      bgcolor: '#1f2937'
    };

    // 8. Geração da imagem
    const dataUrl = await domtoimage.toPng(containerTemp, options);
    document.body.removeChild(containerTemp);

    // 9. Compartilhamento (com fallback)
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'mensalidades.png', { 
      type: 'image/png',
      lastModified: Date.now()
    });

    if (navigator.share && /Mobile/.test(navigator.userAgent)) {
      await navigator.share({
        files: [file],
        title: 'Controle de Mensalidades'
      });
    } else {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'mensalidades.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast.success('Imagem gerada com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
    toast.error(error.message);
  }
};

  const compartilharHistorico = async (elementId) => {
    try {
      if (navigator.share) {
        const element = document.getElementById(elementId);
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#1f2937'
        });
        
        const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
        const file = new File([blob], 'historico-transacoes.png', { type: blob.type });
        
        await navigator.share({
          title: `Histórico de Transações - ${new Date(filtroMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          text: `Histórico de transações financeiras`,
          files: [file]
        });
      } else {
        toast.info('Compartilhamento não suportado neste navegador');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      if (error.name !== 'AbortError') {
        toast.error('Erro ao compartilhar histórico');
      }
    }
  };

const anosDisponiveis = Array.from(new Set(
  transacoes.map(t => {
    try {
      const dataStr = getDataISO(t.data || t.createdAt);
      return dataStr ? dataStr.slice(0, 4) : null;
    } catch {
      return null;
    }
  }).filter(Boolean)
)).sort((a,b) => b - a);

// Garantir que o ano atual esteja presente
if (!anosDisponiveis.includes(anoAtual)) {
  anosDisponiveis.unshift(anoAtual);
}

const jogadoresFiltrados = jogadores.filter(jogador =>
  jogador.nivel === 'Associado' &&
  jogador.nome.toLowerCase().includes(filtroJogador.toLowerCase())
);

// Dados adicionais para o relatório (baseados no ano selecionado em filtroMes)
const anoFiltro = filtroMes?.slice(0, 4) || new Date().getFullYear().toString();
const transacoesAno = transacoes.filter(t => {
  const dataStr = getDataISO(t.data || t.createdAt);
  if (!dataStr) return false;
  return dataStr.startsWith(anoFiltro);
});
const qtdReceitasAno = transacoesAno.filter(t => t.tipo === 'receita').length;
const qtdDespesasAno = transacoesAno.filter(t => t.tipo === 'despesa').length;

// Resumo mensal (receitas, despesas, saldo) para o ano selecionado
const resumoMensalAno = Array.from({ length: 12 }, (_, i) => {
  const mes = (i + 1).toString().padStart(2, '0');
  const receitasMes = transacoesAno
    .filter(t => {
      if (t.tipo !== 'receita') return false;
      const dataStr = getDataISO(t.data || t.createdAt);
      if (!dataStr) return false;
      return dataStr.startsWith(`${anoFiltro}-${mes}`);
    })
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  const despesasMes = transacoesAno
    .filter(t => {
      if (t.tipo !== 'despesa') return false;
      const dataStr = getDataISO(t.data || t.createdAt);
      if (!dataStr) return false;
      return dataStr.startsWith(`${anoFiltro}-${mes}`);
    })
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  return {
    mesIndex: i,
    receitas: receitasMes,
    despesas: despesasMes,
    saldo: receitasMes - despesasMes,
  };
}).filter(item => item.receitas !== 0 || item.despesas !== 0);

// Resumo por categoria no ano selecionado
const resumoCategoriasAno = transacoesAno.reduce((acc, t) => {
  const cat = t.categoria || (t.tipo === 'receita' ? 'mensalidade' : 'outros');
  if (!acc[cat]) {
    acc[cat] = { total: 0, quantidade: 0, tipo: t.tipo };
  }
  acc[cat].total += Number(t.valor) || 0;
  acc[cat].quantidade += 1;
  return acc;
}, {});


  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 p-4 sm:p-6 relative overflow-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      {/* Aurora Background Effects - Inspirado no Dashboard */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: Math.random() * 100, y: Math.random() * 100, opacity: 0.3 }}
            animate={{ y: [null, (Math.random() - 0.5) * 50], x: [null, (Math.random() - 0.5) * 50] }}
            transition={{ duration: 15 + Math.random() * 20, repeat: Infinity, repeatType: "reverse" }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 sm:mb-16 relative pt-16 sm:pt-0 text-center"
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
          </motion.button>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-grow flex justify-center items-center w-full">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-3">
                  <FaMoneyBillWave className="text-blue-400 text-2xl sm:text-3xl" />
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-tighter"
                  >
                    Financeiro
                  </motion.h1>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"
                >
                  Gerencie as finanças e mensalidades do time
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-0 sm:absolute sm:right-0 sm:top-2">
              <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-2 rounded-xl backdrop-blur-md">
                <FaCalendarAlt className="text-blue-400 text-sm sm:text-base" />
                <input
                  type="month"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs sm:text-sm"
                />
              </div>
              <motion.button
                onClick={() => setRelatorioModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-blue-500/25 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all"
              >
                <FaPrint className="text-xs sm:text-sm" />
                <span>Relatório</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 backdrop-blur-3xl p-5 sm:p-8 rounded-[2rem] shadow-2xl border border-white/10"
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <FaArrowUp className="text-green-400 text-sm" /> Receitas
            </h3>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tighter">
              R$ {(estatisticas.totalReceitas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 backdrop-blur-3xl p-5 sm:p-8 rounded-[2rem] shadow-2xl border border-white/10"
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <FaArrowDown className="text-red-400 text-sm" /> Despesas
            </h3>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tighter">
              R$ {(estatisticas.totalDespesas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className={`bg-slate-900/40 backdrop-blur-3xl p-5 sm:p-8 rounded-[2rem] shadow-2xl border border-white/10 ${(estatisticas.saldo || 0) >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo</h3>
            <p className={`text-xl sm:text-2xl font-black tracking-tighter ${(estatisticas.saldo || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              R$ {(estatisticas.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-3">Novo Lançamento</h2>

              <form onSubmit={adicionarTransacao} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={novaTransacao.data}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                  <input
                    type="text"
                    name="descricao"
                    value={novaTransacao.descricao}
                    onChange={handleInputChange}
                    placeholder="Ex: Mensalidade João"
                    className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                  <input
                    type="number"
                    name="valor"
                    min="0.01"
                    step="0.01"
                    value={novaTransacao.valor}
                    onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                        placeholder="0.00"
                    required
                  />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tipo</label>
                  <select
                    name="tipo"
                    value={novaTransacao.tipo}
                    onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm appearance-none"
                  >
                      <option value="receita" className="bg-slate-900">Receita</option>
                      <option value="despesa" className="bg-slate-900">Despesa</option>
                  </select>
                  </div>
                </div>

                {novaTransacao.tipo === "receita" && (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Jogador (opcional)</label>
    <div className="relative">
      <input
        type="text"
        value={novaTransacao.jogadorNome}
        onClick={() => setMostrarListaJogadores(true)}
        readOnly
        placeholder="Selecione um jogador (opcional)"
        className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm cursor-pointer"
      />
      <FaUser className="absolute right-3 top-2.5 text-gray-400 text-xs sm:text-sm" />
      {novaTransacao.jogadorNome && (
        <button
          type="button"
          onClick={() => {
            setNovaTransacao(prev => ({
              ...prev,
              jogadorId: "",
              jogadorNome: ""
            }));
          }}
          className="absolute right-8 top-2.5 text-gray-400 hover:text-white text-xs sm:text-sm"
        >
          <FaTimes />
        </button>
      )}
    </div>
  </div>
)}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white rounded-xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 text-[11px]"
                >
                  <FaPlus className="text-xs sm:text-sm" /> Adicionar
                </motion.button>
              </form>
            </motion.div>

            {/* Modal de seleção de jogadores */}
            <AnimatePresence>
              {mostrarListaJogadores && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col"
                  >
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaUsers className="text-blue-400" />
                        Selecionar Jogador
                      </h3>
                      <button
                        onClick={() => setMostrarListaJogadores(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <FaTimesCircle />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <ListaJogadores
                        modoSelecao={true}
                        onJogadorSelecionado={(jogador) => {
                          setNovaTransacao(prev => ({
                            ...prev,
                            jogadorId: jogador.id || jogador._id,
                            jogadorNome: jogador.nome
                          }));
                          setMostrarListaJogadores(false);
                        }}
                        closeModal={() => setMostrarListaJogadores(false)}
                      />
                    </div>

                    <div className="p-4 border-t border-gray-700 flex justify-end">
                      <motion.button
                        onClick={() => setMostrarListaJogadores(false)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                      >
                        Cancelar
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 mt-4 sm:mt-6 relative overflow-hidden"
            >
              <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8">Status de Pagamentos</h2>
              <div className="h-48 sm:h-64 relative z-10">
                <Pie
                  data={dadosGraficoPizza}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#e5e7eb',
                          font: {
                            size: window.innerWidth < 640 ? 10 : 12
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="mt-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {estatisticas.pagamentosPendentes} Pagamentos pendentes este ano
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase">Histórico</h2>
                  <motion.button
                    onClick={() => compartilharHistorico('tabela-historico')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-blue-600/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                    title="Compartilhar histórico de transações"
                  >
                    <FaShare className="text-sm sm:text-base" />
                  </motion.button>
                </div>
              </div>

              {/* Filtros do histórico */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar por jogador"
                    value={filtroHistorico.jogador}
                    onChange={(e) => setFiltroHistorico({...filtroHistorico, jogador: e.target.value})}
                    className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-xs sm:text-sm"
                  />
                  <FaSearch className="absolute right-3 top-2.5 text-gray-400 text-xs sm:text-sm" />
                </div>
                
                <select
                  value={filtroHistorico.tipo}
                  onChange={(e) => setFiltroHistorico({...filtroHistorico, tipo: e.target.value})}
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-xs sm:text-sm"
                >
                  <option value="todos" className="bg-slate-900">Todos os tipos</option>
                  <option value="receita" className="bg-slate-900">Receitas</option>
                  <option value="despesa" className="bg-slate-900">Despesas</option>
                </select>

                <select
                  value={filtroHistorico.ano}
                  onChange={(e) => setFiltroHistorico({...filtroHistorico, ano: e.target.value})}
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-xs sm:text-sm"
                >
                  <option value="Todos" className="bg-slate-900">Todos os anos</option>
                  {anosDisponiveis.map(y => (
                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setFiltroHistorico({ jogador: '', tipo: 'todos', categoria: '', ano: anoAtual })}
                  className="w-full bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all font-black uppercase tracking-widest"
                >
                  Limpar filtros
                </button>
              </div>

              {carregando ? (
                <div className="flex justify-center py-6 sm:py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-6 w-6 sm:h-8 sm:w-8 border-4 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : transacoes.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-400 text-xs sm:text-sm">
                  Nenhuma transação encontrada
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar" id="tabela-historico" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <table className="min-w-full divide-y divide-white/5">
                      <thead className="bg-black/40 backdrop-blur-md sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Gestão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                      {transacoesFiltradas.map((t) => (
<tr key={t._id} className={`${t.isento ? "bg-yellow-100/10 border-l-4 border-yellow-400/50" : ""}`}>
   <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-300">
      {new Date(t.data || t.createdAt).toLocaleDateString('pt-BR')}
    </td>
    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-white">
      {t.descricao}
      {t.jogadorId && (
        <span className="block text-xs text-gray-400">
          {jogadores.find(j => j._id === t.jogadorId)?.nome || ''}
          {t.isento && " (Isento)"}
        </span>
      )}
    </td>
    <td className={`px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium ${
      t.tipo === "receita" ? 
        (t.isento ? "text-yellow-400" : "text-green-400") : 
        "text-red-400"
    }`}>
      {t.tipo === "receita" ? "+" : "-"} R$ {(Number(t.valor) || 0).toFixed(2)}
      {t.isento && " (Isento)"}
    </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-400">
                              <motion.button
                                onClick={() => deletarTransacao(t._id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-red-400 hover:text-red-500 mr-2"
                              >
                                <FaTrash className="text-xs sm:text-sm" />
                              </motion.button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Mostrando {transacoesFiltradas.length} transações (todas as transações registradas)
                  </div>
                </div>
              )}
            </motion.div>

        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden"
>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
    <h2 className="text-xl font-black text-white tracking-tighter uppercase">Mensalidades</h2>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:flex-none">
        <input
          type="text"
          placeholder="Buscar jogador..."
          value={filtroJogador}
          onChange={(e) => setFiltroJogador(e.target.value)}
          className="w-full sm:w-40 px-4 py-2 bg-black/40 border border-white/5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-xs"
        />
        <FaSearch className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
      </div>

      {/* Filtro por status financeiro */}
      <select
        value={filtroStatusFinanceiro}
        onChange={(e) => setFiltroStatusFinanceiro(e.target.value)}
        className="w-full sm:w-40 px-4 py-2 bg-black/40 border border-white/5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-xs appearance-none"
      >
        <option value="" className="bg-slate-900">Todos</option>
        <option value="Adimplente" className="bg-slate-900">Adimplente</option>
        <option value="Inadimplente" className="bg-slate-900">Inadimplente</option>
        <option value="Isento" className="bg-slate-900">Isento</option>
      </select>

      <motion.button
        onClick={async () => await compartilharControle('tabela-mensalidades')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-blue-600/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg flex-shrink-0"
        title="Compartilhar controle de mensalidades"
      >
        <FaShare className="text-sm sm:text-base" />
      </motion.button>
    </div>
  </div>

  {carregando ? (
    <div className="flex justify-center py-6 sm:py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-6 w-6 sm:h-8 sm:w-8 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  ) : jogadores.length === 0 ? (
    <div className="text-center py-6 sm:py-8 text-gray-400 text-xs sm:text-sm">
      Nenhum jogador cadastrado
    </div>
  ) : (
    <div className="overflow-x-auto max-h-[60vh] sm:max-h-[70vh] md:max-h-[80vh] no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div id="tabela-mensalidades" className="min-w-[800px]">
        <table className="w-full divide-y divide-white/5">
          <thead className="bg-black/40 backdrop-blur-md sticky top-0 z-10">
            <tr>
              <th className="px-3 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Jogador</th>
              <th className="px-3 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              {dadosGraficoFluxoCaixa.labels.map((mes, i) => (
                <th key={i} className="px-1 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {jogadores
              .filter(jogador => {
                const isAssociado = jogador.nivel === 'Associado';
                const matchesNome = jogador.nome.toLowerCase().includes(filtroJogador.toLowerCase());
                
                if (!isAssociado || !matchesNome) {
                  return false;
                }

                if (filtroStatusFinanceiro === '') {
                  return true;
                }

                const isTotalmenteIsento = jogador.pagamentos?.every(p => p.isento);

                if (filtroStatusFinanceiro === 'Isento') {
                  return isTotalmenteIsento;
                }

                if (filtroStatusFinanceiro === 'Adimplente') {
                  // Mostra adimplentes que não são totalmente isentos
                  return jogador.statusFinanceiro === 'Adimplente' && !isTotalmenteIsento;
                }

                return jogador.statusFinanceiro === filtroStatusFinanceiro;
              })
              .map((jogador) => (
                <tr key={jogador._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-white">
                    {jogador.nome}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                    {jogador.pagamentos?.every(p => p.isento) ? (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 bg-orange-500/20 text-orange-400 w-fit cursor-help"
                        title="Este jogador está isento de todas as mensalidades."
                      >
                        <FaAward className="text-xs" />
                        <span>Isento</span>
                      </span>
                    ) : (
                      <motion.button
                        onClick={() => toggleStatus(jogador._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-300 ${
                          jogador.statusFinanceiro === 'Adimplente' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
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
                    )}
                  </td>
                  {jogador.pagamentos.map((pagamento, i) => (
                    <td key={i} className="px-1 sm:px-2 py-2 sm:py-3 whitespace-nowrap text-center">
                      {pagamento.isento ? (
                        <div
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center bg-orange-500/20 text-orange-400 cursor-help"
                          title="Isento"
                        >
                          <FaAward size={8} className="sm:text-xs" />
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => togglePagamento(jogador._id, i)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`
                            w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center
                            ${pagamento.pago ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                          `}
                          title={pagamento.pago ? "Mensalidade paga" : "Mensalidade pendente"}
                        >
                          {pagamento.pago ? <FaCheck size={8} className="sm:text-xs" /> : <FaTimes size={8} className="sm:text-xs" />}
                        </motion.button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</motion.div>


            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
              <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8">Fluxo de Caixa</h2>
<div className="h-48 sm:h-64 relative z-10">
  <Bar
    data={dadosGraficoFluxoCaixa}
    options={{
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(229, 231, 235, 0.1)' },
          ticks: {
            color: '#e5e7eb',
            font: { size: window.innerWidth < 640 ? 10 : 12 }
          }
        },
        x: {
          grid: { color: 'rgba(229, 231, 235, 0.1)' },
          ticks: {
            color: '#e5e7eb',
            font: { size: window.innerWidth < 640 ? 10 : 12 }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e5e7eb',
            font: { size: window.innerWidth < 640 ? 10 : 12 }
          }
        }
      }
    }}
  />
</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Confirmar exclusão (Modal customizado) */}
      <AnimatePresence>
        {confirmDeleteModal.open && confirmDeleteModal.transacao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setConfirmDeleteModal({ open: false, transacao: null })}
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
                  onClick={() => setConfirmDeleteModal({ open: false, transacao: null })}
                  whileHover={{ rotate: 90 }}
                  className="text-gray-400 hover:text-white text-sm sm:text-base"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-300">
                  Você está prestes a excluir uma transação do ano {new Date(confirmDeleteModal.transacao.data || confirmDeleteModal.transacao.createdAt).getFullYear()}. Esta ação é permanente e não pode ser desfeita.
                </p>
                <div className="mt-3">
                  <p className="text-xs text-gray-400">Descrição: <span className="font-medium text-white">{confirmDeleteModal.transacao.descricao}</span></p>
                  <p className="text-xs text-gray-400">Valor: <span className="font-medium text-white">R$ {(Number(confirmDeleteModal.transacao.valor) || 0).toFixed(2)}</span></p>
                  <p className="text-xs text-gray-400">Data: <span className="font-medium text-white">{new Date(confirmDeleteModal.transacao.data || confirmDeleteModal.transacao.createdAt).toLocaleDateString('pt-BR')}</span></p>
                </div>
              </div>

              <div className="mt-2 sm:mt-4 px-4 sm:px-6 pb-4 pt-2 border-t border-gray-700 flex justify-end gap-2 sm:gap-3 bg-gray-800/90">
                <motion.button
                  onClick={() => setConfirmDeleteModal({ open: false, transacao: null })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={() => performDeleteTransacao(confirmDeleteModal.transacao._id)}
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

      {/* Modal de Relatório */}
      <AnimatePresence>
        {relatorioModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setRelatorioModal(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md sm:max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 sm:px-6 pt-4 pb-2 border-b border-gray-700">
                <h3 className="text-lg sm:text-xl font-bold text-white">Relatório Financeiro</h3>
                <motion.button
                  onClick={() => setRelatorioModal(false)}
                  whileHover={{ rotate: 90 }}
                  className="text-gray-400 hover:text-white text-sm sm:text-base"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div
                id="relatorio-content"
                className="space-y-3 sm:space-y-4 px-4 sm:px-6 py-4 overflow-y-auto flex-1 no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Conteúdo existente do modal */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">Receitas</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-green-400">
                      R$ {estatisticas.totalReceitas.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">Despesas</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-red-400">
                      R$ {estatisticas.totalDespesas.toFixed(2)}
                    </p>
                  </div>
                </div>
                {/* Resto do conteúdo do modal */}
                <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">Saldo</h4>
                  <p className={`text-xl sm:text-2xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {estatisticas.saldo.toFixed(2)}
                  </p>
                </div>



                <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">Detalhes das Transações ({anoFiltro})</h4>
                  <p className="text-xs sm:text-sm text-gray-300 mb-1">
                    Total de transações: <span className="font-semibold text-white">{transacoesAno.length}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-green-300 mb-1">
                    Receitas: <span className="font-semibold">{qtdReceitasAno}</span> lançamentos
                  </p>
                  <p className="text-xs sm:text-sm text-red-300">
                    Despesas: <span className="font-semibold">{qtdDespesasAno}</span> lançamentos
                  </p>
                </div>

                {/* Seção de Exportação do Histórico de Transações */}
                <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 p-4 sm:p-5 rounded-lg border border-gray-600">
                  <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
                    <FaFileAlt className="text-green-400" />
                    Exportar Histórico de Transações para Excel
                  </h4>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Tipo de Exportação
                      </label>
                      <select
                        value={filtroExportacao.tipo}
                        onChange={(e) => setFiltroExportacao({...filtroExportacao, tipo: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-xs sm:text-sm"
                      >
                        <option value="ano">Por Ano</option>
                        <option value="mes">Por Mês</option>
                      </select>
                    </div>

                    {filtroExportacao.tipo === 'ano' ? (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                          Selecionar Ano
                        </label>
                        <select
                          value={filtroExportacao.ano}
                          onChange={(e) => setFiltroExportacao({...filtroExportacao, ano: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-xs sm:text-sm"
                        >
                          {anosDisponiveis.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                          Selecionar Mês
                        </label>
                        <input
                          type="month"
                          value={filtroExportacao.mes}
                          onChange={(e) => setFiltroExportacao({...filtroExportacao, mes: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-xs sm:text-sm"
                        />
                      </div>
                    )}

                    <motion.button
                      onClick={exportarExcel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-xs sm:text-sm font-medium"
                    >
                      <FaFileAlt className="text-sm sm:text-base" />
                      Exportar para Excel
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="mt-2 sm:mt-4 px-4 sm:px-6 pb-4 pt-2 border-t border-gray-700 flex justify-end gap-2 sm:gap-3 bg-gray-800/90">
                <motion.button
                  onClick={exportarPDF}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <FaFilePdf className="text-xs sm:text-sm" /> Exportar PDF
                </motion.button>
                <motion.button
                  onClick={exportarImagem}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <FaFileImage className="text-xs sm:text-sm" /> Exportar Imagem
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Editar Jogador */}
      <AnimatePresence>
        {editarModal && jogadorSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setEditarModal(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Editar Jogador</h3>
                <motion.button
                  onClick={() => setEditarModal(false)}
                  whileHover={{ rotate: 90 }}
                  className="text-gray-400 hover:text-white text-sm sm:text-base"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    value={jogadorSelecionado.nome}
                    onChange={(e) => setJogadorSelecionado({ ...jogadorSelecionado, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={jogadorSelecionado.email}
                    onChange={(e) => setJogadorSelecionado({ ...jogadorSelecionado, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Status de Pagamento</label>
                  <select
                    value={jogadorSelecionado.statusFinanceiro || 'Inadimplente'}
                    onChange={(e) => setJogadorSelecionado({ ...jogadorSelecionado, statusFinanceiro: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                  >
                    <option value="Adimplente">Adimplente</option>
                    <option value="Inadimplente">Inadimplente</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <motion.button
                    type="button"
                    onClick={() => deletarJogador(jogadorSelecionado._id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                  >
                    <FaTrash className="text-xs sm:text-sm" /> Excluir
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={editarJogador}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-3 py-2 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-xs sm:text-sm"
                  >
                    <FaEdit className="text-xs sm:text-sm" /> Salvar Alterações
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
