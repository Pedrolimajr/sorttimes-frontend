import { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaTimes,
  FaFilePdf,
  FaFileImage,
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
  FaFileAlt,
  FaImage
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
import { useJogadores } from '../context/JogadoresContext';

Chart.register(...registerables);

const API_URL = 'http://localhost:5000/api';

export default function Financeiro() {
  const navigate = useNavigate();
  const { jogadores, atualizarStatusFinanceiro } = useJogadores();
  const [transacoes, setTransacoes] = useState([]);
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
  const [carregando, setCarregando] = useState(true);
  const [relatorioModal, setRelatorioModal] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [mostrarListaJogadores, setMostrarListaJogadores] = useState(false);
  const [jogadorSelecionado, setJogadorSelecionado] = useState(null);
  const [filtroJogador, setFiltroJogador] = useState('');
  const [filtroHistorico, setFiltroHistorico] = useState({
    jogador: '',
    tipo: 'todos',
    categoria: ''
  });
  const [novaTransacao, setNovaTransacao] = useState({
    descricao: "",
    valor: "",
    tipo: "receita",
    categoria: "",
    data: new Date().toISOString().split('T')[0],
    jogadorId: "",
    jogadorNome: ""
  });

  const [estatisticas, setEstatisticas] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    pagamentosPendentes: 0,
    totalJogadores: 0
  });

  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Receitas',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Despesas',
        data: [],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  });

  const [filtroJogadorModal, setFiltroJogadorModal] = useState('');

  const STORAGE_KEY = 'dadosFinanceiros';

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []); // Executar apenas uma vez

  const carregarDados = async () => {
    try {
      setCarregando(true);
      
      const [jogadoresRes, transacoesRes] = await Promise.all([
        fetch(`${API_URL}/jogadores`),
        fetch(`${API_URL}/financeiro/transacoes`)
      ]);

      if (!jogadoresRes.ok) throw new Error('Erro ao carregar jogadores');
      if (!transacoesRes.ok) throw new Error('Erro ao carregar transações');

      const jogadoresData = await jogadoresRes.json();
      const transacoesData = await transacoesRes.json();

      // Normaliza os dados dos jogadores com validação
      const jogadoresProcessados = (Array.isArray(jogadoresData.data) ? jogadoresData.data : [])
        .map(jogador => ({
          ...jogador,
          pagamentos: Array.isArray(jogador.pagamentos) && jogador.pagamentos.length === 12
            ? jogador.pagamentos
            : Array(12).fill(false)
        }));

      setJogadores(jogadoresProcessados);
      setTransacoes(Array.isArray(transacoesData) ? transacoesData : []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error('Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  // Atualizar estatísticas
  useEffect(() => {
    const carregarEstatisticas = async () => {
      if (!transacoes || !jogadores) return; // Evita cálculos desnecessários
      
      try {
        const receitasMes = transacoes
          .filter(t => t?.tipo === "receita" && t?.data?.startsWith(filtroMes?.slice(0, 4)))
          .reduce((acc, t) => acc + (Number(t?.valor) || 0), 0);

        const despesasMes = transacoes
          .filter(t => t.tipo === "despesa" && t.data?.startsWith(filtroMes.slice(0, 4)))
          .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

        const pagamentosPendentes = jogadores.reduce((total, jogador) => {
          return total + (jogador.pagamentos || []).filter(p => !p).length;
        }, 0);

        setEstatisticas(prev => ({
          ...prev,
          totalReceitas: receitasMes,
          totalDespesas: despesasMes,
          saldo: receitasMes - despesasMes,
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

    try {
      if (!novaTransacao.data || !novaTransacao.valor || !novaTransacao.descricao) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Verifica se já existe uma transação para o mesmo jogador na mesma data
      if (novaTransacao.jogadorId) {
        const transacaoExistente = transacoes.find(t => 
          t.jogadorId === novaTransacao.jogadorId && 
          new Date(t.data).toISOString().split('T')[0] === novaTransacao.data
        );

        if (transacaoExistente) {
          toast.error('Já existe uma transação registrada para este jogador nesta data');
          return;
        }
      }

      const payload = {
        ...novaTransacao,
        valor: parseFloat(novaTransacao.valor),
        data: new Date(novaTransacao.data + 'T12:00:00').toISOString()
      };

      // Se for uma receita de mensalidade
      if (payload.tipo === 'receita' && payload.jogadorId) {
        const dataTransacao = new Date(payload.data);
        const mesTransacao = dataTransacao.getMonth();

        // Primeiro, atualiza o estado local ANTES da chamada à API
        setJogadores(prevJogadores => {
          const jogadoresAtualizados = prevJogadores.map(j => {
            if (j._id === payload.jogadorId) {
              const pagamentosAtualizados = [...j.pagamentos];
              pagamentosAtualizados[mesTransacao] = true;

              const mesAtual = new Date().getMonth();
              const mesesDevendo = pagamentosAtualizados
                .slice(0, mesAtual + 1)
                .filter(pago => !pago).length;

              return {
                ...j,
                pagamentos: pagamentosAtualizados,
                statusFinanceiro: mesesDevendo === 0 ? 'Adimplente' : 'Inadimplente'
              };
            }
            return j;
          });

          // Atualiza localStorage
          localStorage.setItem('dadosFinanceiros', JSON.stringify({
            jogadoresCache: jogadoresAtualizados,
            transacoesCache: transacoes
          }));

          return jogadoresAtualizados;
        });

        // Depois faz a chamada à API
        const pagamentoResponse = await fetch(`${API_URL}/jogadores/${payload.jogadorId}/pagamentos/${mesTransacao}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pago: true,
            valor: payload.valor,
            dataPagamento: payload.data
          })
        });

        if (!pagamentoResponse.ok) {
          throw new Error('Erro ao atualizar status de pagamento');
        }
      }

      // Continua com o registro da transação...
      const response = await fetch(`${API_URL}/financeiro/transacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao adicionar transação');

      const data = await response.json();
      
      // Atualiza o estado local das transações
      setTransacoes(prev => [data.data, ...prev]);
      
      // Atualiza as estatísticas
      setEstatisticas(prev => ({
        ...prev,
        totalReceitas: payload.tipo === 'receita' 
          ? prev.totalReceitas + parseFloat(payload.valor) 
          : prev.totalReceitas,
        totalDespesas: payload.tipo === 'despesa' 
          ? prev.totalDespesas + parseFloat(payload.valor) 
          : prev.totalDespesas,
        saldo: prev.totalReceitas - prev.totalDespesas
      }));

      // Reset do formulário
      toast.success('Transação registrada com sucesso!');
      setNovaTransacao({
        descricao: "",
        valor: "",
        tipo: "receita",
        categoria: "",
        data: new Date().toISOString().split("T")[0],
        jogadorId: "",
        jogadorNome: ""
      });
      
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      toast.error(error.message || 'Erro ao adicionar transação');
    }
  };

  const handleEditarTransacao = async (id, dados) => {
    try {
      const response = await api.put(`/financeiro/transacoes/${id}`, dados);
      if (response.data.success) {
        toast.success('Transação atualizada com sucesso!');
        setTransacoes(transacoes.map(t => t.id === id ? response.data.data : t));
      }
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const handleExcluirTransacao = async (id) => {
    try {
      const response = await api.delete(`/financeiro/transacoes/${id}`);
      if (response.data.success) {
        toast.success('Transação excluída com sucesso!');
        setTransacoes(transacoes.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const handleGerarRelatorio = async () => {
    try {
      const response = await api.get('/financeiro/relatorio', {
        params: {
          mes: filtroMes
        }
      });
      if (response.data.success) {
        // Implementar lógica de download do relatório
        toast.success('Relatório gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    }
  };

  const handleExportarPDF = async () => {
    try {
      const element = document.getElementById('relatorio');
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('relatorio-financeiro.pdf');
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleCompartilharRelatorio = async () => {
    try {
      const response = await api.post('/financeiro/compartilhar', {
        mes: filtroMes
      });
      if (response.data.success) {
        toast.success('Relatório compartilhado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar relatório:', error);
      toast.error('Erro ao compartilhar relatório');
    }
  };

  const handleImprimirRelatorio = () => {
    window.print();
  };

  const handleSelecionarJogador = (jogador) => {
    setJogadorSelecionado(jogador);
    setNovaTransacao(prev => ({
      ...prev,
      jogadorId: jogador.id,
      jogadorNome: jogador.nome
    }));
    setMostrarListaJogadores(false);
  };

  const handleFiltrarTransacoes = () => {
    // Implementar lógica de filtro
  };

  const handleLimparFiltros = () => {
    setFiltroHistorico({
      jogador: '',
      tipo: 'todos',
      categoria: ''
    });
  };

  const handleVoltar = () => {
    navigate('/');
  };

  const togglePagamento = async (jogadorId, mesIndex) => {
    try {
      const jogador = jogadores.find(j => j._id === jogadorId);
      if (!jogador) throw new Error('Jogador não encontrado');

      const novoStatus = !jogador.pagamentos[mesIndex];
      const mesAtual = new Date().getMonth();

      // Previne mudança de meses futuros
      if (mesIndex > mesAtual) {
        toast.warning('Não é possível marcar pagamentos de meses futuros');
        return;
      }

      // Atualização otimista do estado
      const jogadoresAtualizados = jogadores.map(j => {
        if (j._id === jogadorId) {
          const pagamentosAtualizados = [...j.pagamentos];
          pagamentosAtualizados[mesIndex] = novoStatus;

          // Verifica pagamentos até o mês atual para definir status
          const mesesDevendo = pagamentosAtualizados
            .slice(0, mesAtual + 1)
            .filter(pago => !pago).length;

          return {
            ...j,
            pagamentos: pagamentosAtualizados,
            statusFinanceiro: mesesDevendo === 0 ? 'Adimplente' : 'Inadimplente'
          };
        }
        return j;
      });

      setJogadores(jogadoresAtualizados);

      // Chamada à API
      const response = await fetch(`${API_URL}/jogadores/${jogadorId}/pagamentos/${mesIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pago: novoStatus,
          valor: 100,
          dataPagamento: novoStatus ? new Date().toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar pagamento');
      }

      // Se for um novo pagamento, registra a transação
      if (novoStatus) {
        const transacaoResponse = await fetch(`${API_URL}/financeiro/transacoes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descricao: `Mensalidade - ${jogador.nome} (${mesIndex + 1}/${new Date().getFullYear()})`,
            valor: 100,
            tipo: 'receita',
            categoria: 'mensalidade',
            data: new Date().toISOString(),
            jogadorId: jogadorId,
            jogadorNome: jogador.nome
          })
        });

        if (!transacaoResponse.ok) {
          throw new Error('Erro ao registrar transação');
        }

        const novaTransacao = await transacaoResponse.json();
        setTransacoes(prev => [novaTransacao, ...prev]);
      }

      toast.success(`Pagamento ${novoStatus ? 'registrado' : 'removido'} com sucesso!`);

    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      // Reverte o estado em caso de erro
      setJogadores(prev => [...prev]);
      toast.error('Erro ao atualizar status de pagamento');
    }
  };

  const deletarTransacao = async (id) => {
    try {
      // Primeiro, encontre a transação que será excluída
      const transacao = transacoes.find(t => t._id === id);
      if (!transacao) throw new Error('Transação não encontrada');

      // Se for uma transação de mensalidade (tipo receita com jogadorId)
      if (transacao.tipo === 'receita' && transacao.jogadorId) {
        const dataTransacao = new Date(transacao.data);
        const mesTransacao = dataTransacao.getMonth();

        // Atualiza o estado local dos jogadores IMEDIATAMENTE
        setJogadores(prevJogadores => {
          const jogadoresAtualizados = prevJogadores.map(j => {
            if (j._id === transacao.jogadorId) {
              const pagamentosAtualizados = [...j.pagamentos];
              pagamentosAtualizados[mesTransacao] = false;

              // Verifica se todos os meses até o mês atual estão pagos
              const mesAtual = new Date().getMonth();
              const mesesDevendo = pagamentosAtualizados
                .slice(0, mesAtual + 1)
                .filter(pago => !pago).length;

              return {
                ...j,
                pagamentos: pagamentosAtualizados,
                statusFinanceiro: mesesDevendo === 0 ? 'Adimplente' : 'Inadimplente'
              };
            }
            return j;
          });

          // Atualiza localStorage
          localStorage.setItem('dadosFinanceiros', JSON.stringify({
            jogadoresCache: jogadoresAtualizados,
            transacoesCache: transacoes.filter(t => t._id !== id)
          }));

          return jogadoresAtualizados;
        });

        // Depois faz a chamada à API para atualizar o pagamento
        await fetch(`${API_URL}/jogadores/${transacao.jogadorId}/pagamentos/${mesTransacao}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pago: false,
            valor: 0,
            dataPagamento: null
          })
        });
      }

      // Faz a chamada à API para deletar a transação
      const response = await fetch(`${API_URL}/financeiro/transacoes/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar transação');

      // Remove a transação do estado local
      setTransacoes(prev => prev.filter(t => t._id !== id));
      
      // Atualiza as estatísticas
      setEstatisticas(prev => ({
        ...prev,
        totalReceitas: transacao.tipo === 'receita' 
          ? prev.totalReceitas - transacao.valor 
          : prev.totalReceitas,
        totalDespesas: transacao.tipo === 'despesa' 
          ? prev.totalDespesas - transacao.valor 
          : prev.totalDespesas,
        saldo: prev.totalReceitas - prev.totalDespesas
      }));

      toast.success('Transação removida com sucesso!');
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      toast.error(error.message);
    }
  };

  const editarJogador = async () => {
    try {
      const response = await fetch(`${API_URL}/jogadores/${jogadorSelecionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jogadorSelecionado)
      });

      if (!response.ok) throw new Error('Erro ao atualizar jogador');

      const data = await response.json();
      setJogadores(jogadores.map(j => j._id === data._id ? data : j));
      setEditarModal(false);
      toast.success('Jogador atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar jogador:", error);
      toast.error(error.message);
    }
  };

  const deletarJogador = async (id) => {
    try {
      const response = await fetch(`${API_URL}/jogadores/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar jogador');

      setJogadores(jogadores.filter(j => j._id !== id));
      setEditarModal(false);
      toast.success('Jogador removido com sucesso!');
    } catch (error) {
      console.error("Erro ao deletar jogador:", error);
      toast.error(error.message);
    }
  };

  // Filtrar transações por mês/ano
  const transacoesFiltradas = transacoes
    .filter(t => {
      if (!t.data) return false;
      
      // Filtro por ano (não por mês)
      try {
        const dataStr = typeof t.data === 'string' 
          ? t.data 
          : new Date(t.data).toISOString();
        return dataStr.startsWith(filtroMes.slice(0, 4)); // Filtra por ano apenas
      } catch {
        return false;
      }
    })
    .filter(t => {
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
    .sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena do mais recente para o mais antigo

  const dadosGraficoBarras = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Receitas',
        data: Array(12).fill(0).map((_, i) => {
          const mes = (i + 1).toString().padStart(2, '0');
          return transacoes
            .filter(t => {
              try {
                const dataStr = typeof t.data === 'string' ? t.data : new Date(t.data).toISOString();
                return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${mes}`) && t.tipo === "receita";
              } catch {
                return false;
              }
            })
            .reduce((acc, t) => acc + (t.valor || 0), 0);
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
              try {
                const dataStr = typeof t.data === 'string' ? t.data : new Date(t.data).toISOString();
                return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${mes}`) && t.tipo === "despesa";
              } catch {
                return false;
              }
            })
            .reduce((acc, t) => acc + (t.valor || 0), 0);
        }),
        backgroundColor: '#f87171',
        borderRadius: 6
      }
    ]
  };

  const dadosGraficoPizza = {
    labels: ['Pagamentos em dia', 'Pagamentos pendentes'],
    datasets: [{
      data: [
        jogadores.reduce((total, jogador) => 
          total + jogador.pagamentos.filter(pago => pago).length, 0
        ),
        jogadores.reduce((total, jogador) => 
          total + jogador.pagamentos.filter(pago => !pago).length, 0
        )
      ],
      backgroundColor: ['#4ade80', '#f87171'],
      hoverOffset: 4,
      borderWidth: 0
    }]
  };

  const exportarPDF = async () => {
    try {
      // Fecha o modal de relatório antes de gerar o PDF
      setRelatorioModal(false);
      
      // Aguarda um pequeno delay para garantir que o modal foi fechado
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = document.getElementById('relatorio-content');
      if (!element) {
        // Cria um elemento temporário para o relatório
        const tempElement = document.createElement('div');
        tempElement.id = 'relatorio-content';
        tempElement.innerHTML = `
          <div style="padding: 20px; background-color: #1f2937; color: white;">
            <h2 style="margin-bottom: 20px;">Relatório Financeiro - ${new Date(filtroMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            
            <div style="margin-bottom: 20px;">
              <h3>Resumo Financeiro</h3>
              <p>Receitas: R$ ${estatisticas.totalReceitas.toFixed(2)}</p>
              <p>Despesas: R$ ${estatisticas.totalDespesas.toFixed(2)}</p>
              <p>Saldo: R$ ${estatisticas.saldo.toFixed(2)}</p>
            </div>
            
            <div>
              <h3>Informações Adicionais</h3>
              <p>Total de Jogadores: ${estatisticas.totalJogadores}</p>
              <p>Pagamentos Pendentes: ${estatisticas.pagamentosPendentes}</p>
            </div>
          </div>
        `;
        document.body.appendChild(tempElement);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(tempElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#1f2937'
        });
        
        document.body.removeChild(tempElement);
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`relatorio-financeiro-${filtroMes}.pdf`);
      } else {
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#1f2937'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`relatorio-financeiro-${filtroMes}.pdf`);
      }
      
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const exportarImagem = async () => {
    try {
      // Fecha o modal de relatório antes de gerar a imagem
      setRelatorioModal(false);
      
      // Aguarda um pequeno delay para garantir que o modal foi fechado
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = document.getElementById('relatorio-content');
      if (!element) {
        // Cria um elemento temporário para o relatório
        const tempElement = document.createElement('div');
        tempElement.id = 'relatorio-content';
        tempElement.innerHTML = `
          <div style="padding: 20px; background-color: #1f2937; color: white;">
            <h2 style="margin-bottom: 20px;">Relatório Financeiro - ${new Date(filtroMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            
            <div style="margin-bottom: 20px;">
              <h3>Resumo Financeiro</h3>
              <p>Receitas: R$ ${estatisticas.totalReceitas.toFixed(2)}</p>
              <p>Despesas: R$ ${estatisticas.totalDespesas.toFixed(2)}</p>
              <p>Saldo: R$ ${estatisticas.saldo.toFixed(2)}</p>
            </div>
            
            <div>
              <h3>Informações Adicionais</h3>
              <p>Total de Jogadores: ${estatisticas.totalJogadores}</p>
              <p>Pagamentos Pendentes: ${estatisticas.pagamentosPendentes}</p>
            </div>
          </div>
        `;
        document.body.appendChild(tempElement);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(tempElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#1f2937'
        });
        
        document.body.removeChild(tempElement);
        
        // Cria um link temporário para download da imagem
        const link = document.createElement('a');
        link.download = `relatorio-financeiro-${filtroMes}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#1f2937'
        });
        
        // Cria um link temporário para download da imagem
        const link = document.createElement('a');
        link.download = `relatorio-financeiro-${filtroMes}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      
      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem. Tente novamente.');
    }
  };

  const compartilharRelatorio = async () => {
    try {
      if (navigator.share) {
        const element = document.getElementById('relatorio-content');
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#1f2937'
        });
        
        const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
        const file = new File([blob], 'relatorio-financeiro.png', { type: blob.type });
        
        await navigator.share({
          title: `Relatório Financeiro - ${filtroMes}`,
          text: `Status financeiro do time: ${estatisticas.saldo >= 0 ? 'Positivo' : 'Negativo'}`,
          files: [file]
        });
      } else {
        toast.info('Compartilhamento não suportado neste navegador');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      if (error.name !== 'AbortError') {
        toast.error('Erro ao compartilhar relatório');
      }
    }
  };

  const compartilharControle = async (elementId) => {
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
        const file = new File([blob], 'controle-mensalidades.png', { type: blob.type });
        
        await navigator.share({
          title: `Controle de Mensalidades - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          text: `Controle de mensalidades dos jogadores`,
          files: [file]
        });
      } else {
        toast.info('Compartilhamento não suportado neste navegador');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      if (error.name !== 'AbortError') {
        toast.error('Erro ao compartilhar controle');
      }
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

  const jogadoresFiltrados = jogadores.filter(jogador =>
    jogador.nome.toLowerCase().includes(filtroJogador.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setRelatorioModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaFileAlt />
              Relatório
            </button>
            <button
              onClick={() => setEditarModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus />
              Nova Transação
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Total de Receitas</h3>
            <p className="text-2xl font-bold text-green-500">
              R$ {estatisticas.totalReceitas.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Total de Despesas</h3>
            <p className="text-2xl font-bold text-red-500">
              R$ {estatisticas.totalDespesas.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Saldo</h3>
            <p className={`text-2xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {estatisticas.saldo.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Pagamentos Pendentes</h3>
            <p className="text-2xl font-bold text-yellow-500">
              {estatisticas.pagamentosPendentes}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Pizza - Status de Pagamento */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Status de Pagamento</h3>
            <div className="h-64">
              <Pie data={dadosGraficoPizza} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: 'white'
                    }
                  }
                }
              }} />
            </div>
          </div>

          {/* Gráfico de Barras - Fluxo de Caixa */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
            <div className="h-64">
              <Bar data={dadosGraficoBarras} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: 'white'
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'white'
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: 'white'
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Histórico de Transações</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filtrar por jogador..."
                value={filtroHistorico.jogador}
                onChange={(e) => setFiltroHistorico(prev => ({ ...prev, jogador: e.target.value }))}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
              />
              <select
                value={filtroHistorico.tipo}
                onChange={(e) => setFiltroHistorico(prev => ({ ...prev, tipo: e.target.value }))}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
              >
                <option value="todos">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Descrição</th>
                  <th className="pb-2">Jogador</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((transacao) => (
                  <tr key={transacao._id} className="border-b border-gray-700">
                    <td className="py-2">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2">{transacao.descricao}</td>
                    <td className="py-2">
                      {jogadores.find(j => j._id === transacao.jogadorId)?.nome || 'N/A'}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        transacao.tipo === 'receita' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-2">
                      R$ {transacao.valor.toFixed(2)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleEditarTransacao(transacao._id, transacao)}
                        className="text-blue-500 hover:text-blue-400 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleExcluirTransacao(transacao._id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nova Transação */}
      {editarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nova Transação</h2>
            <form onSubmit={adicionarTransacao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Tipo
                </label>
                <select
                  value={novaTransacao.tipo}
                  onChange={handleInputChange}
                  name="tipo"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                  required
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  name="descricao"
                  value={novaTransacao.descricao}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  name="valor"
                  value={novaTransacao.valor}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  name="data"
                  value={novaTransacao.data}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Jogador
                </label>
                <select
                  name="jogadorId"
                  value={novaTransacao.jogadorId}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                  required
                >
                  <option value="">Selecione um jogador</option>
                  {jogadores.map((jogador) => (
                    <option key={jogador._id} value={jogador._id}>
                      {jogador.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditarModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Jogador */}
      {mostrarListaJogadores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Selecionar Jogador</h2>
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={filtroJogador}
                onChange={(e) => setFiltroJogador(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {jogadoresFiltrados.map((jogador) => (
                <div
                  key={jogador._id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    jogadorSelecionado?._id === jogador._id
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => handleSelecionarJogador(jogador)}
                >
                  <h3 className="font-semibold">{jogador.nome}</h3>
                  <p className="text-sm text-gray-400">
                    Status: {jogador.pagamentos[parseInt(filtroMes.slice(5, 7)) - 1] ? 'Pago' : 'Pendente'}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setMostrarListaJogadores(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatório */}
      {relatorioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div id="relatorio-content">
              <h2 className="text-xl font-semibold mb-4">
                Relatório Financeiro - {new Date(filtroMes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Resumo Financeiro</h3>
                  <p className="text-green-500">Receitas: R$ {estatisticas.totalReceitas.toFixed(2)}</p>
                  <p className="text-red-500">Despesas: R$ {estatisticas.totalDespesas.toFixed(2)}</p>
                  <p className={`font-bold ${estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    Saldo: R$ {estatisticas.saldo.toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Informações Adicionais</h3>
                  <p>Total de Jogadores: {estatisticas.totalJogadores}</p>
                  <p className="text-yellow-500">Pagamentos Pendentes: {estatisticas.pagamentosPendentes}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Status de Pagamento</h3>
                  <div className="h-48">
                    <Pie data={dadosGraficoPizza} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: 'white'
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Fluxo de Caixa</h3>
                  <div className="h-48">
                    <Bar data={dadosGraficoBarras} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: 'white'
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={exportarPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaFilePdf />
                Exportar PDF
              </button>
              <button
                onClick={exportarImagem}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaImage />
                Exportar Imagem
              </button>
              <button
                onClick={compartilharRelatorio}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FaShare />
                Compartilhar
              </button>
              <button
                onClick={() => setRelatorioModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}