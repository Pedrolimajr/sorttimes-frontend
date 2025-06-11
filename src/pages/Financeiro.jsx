import React, { useState, useEffect } from 'react';
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
  FaDownload
} from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { Pie, Bar } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import ListaJogadores from './ListaJogadores';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useJogadores } from '../contexts/JogadoresContext';
import api from '../services/api';

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
    data: new Date().toISOString().substring(0, 10),
    jogadorId: "",
    jogadorNome: "",
    isento: false
  });

  const [estatisticas, setEstatisticas] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    pagamentosPendentes: 0,
    totalJogadores: 0
  });

  const [dadosGraficoPizza, setDadosGraficoPizza] = useState({
    labels: ['Pagamentos em dia', 'Pagamentos pendentes'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#4ade80', '#f87171'],
      hoverOffset: 4,
      borderWidth: 0
    }]
  });

  const [dadosGraficoBarras, setDadosGraficoBarras] = useState({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Receitas',
        data: Array(12).fill(0),
        backgroundColor: '#4ade80',
        borderRadius: 6
      },
      {
        label: 'Despesas',
        data: Array(12).fill(0),
        backgroundColor: '#f87171',
        borderRadius: 6
      }
    ]
  });

  const [filtroJogadorModal, setFiltroJogadorModal] = useState('');

  const STORAGE_KEY = 'dadosFinanceiros';

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        const [jogadoresResponse, transacoesResponse] = await Promise.all([
          api.get('/jogadores'),
          api.get('/financeiro/transacoes')
        ]);

        if (jogadoresResponse.data.success) {
          const jogadoresFormatados = jogadoresResponse.data.data.map(jogador => ({
            ...jogador,
            pagamentos: Array(12).fill().map((_, index) => {
              const pagamentoExistente = jogador.pagamentos?.[index];
              return {
                pago: pagamentoExistente?.pago || false,
                isento: pagamentoExistente?.isento || false,
                dataPagamento: pagamentoExistente?.dataPagamento || null,
                dataLimite: pagamentoExistente?.dataLimite || new Date(new Date().getFullYear(), index, 20)
              };
            })
          }));
          setJogadores(jogadoresFormatados);

          // Atualizar dados do gráfico de pizza
          const pagamentosPendentes = jogadoresFormatados.reduce((total, jogador) => {
            return total + (jogador.pagamentos || []).filter(p => !p.pago && !p.isento).length;
          }, 0);

          const pagamentosEmDia = jogadoresFormatados.reduce((total, jogador) => {
            return total + (jogador.pagamentos || []).filter(p => p.pago || p.isento).length;
          }, 0);

          setDadosGraficoPizza({
            labels: ['Pagamentos em dia', 'Pagamentos pendentes'],
            datasets: [{
              data: [pagamentosEmDia, pagamentosPendentes],
              backgroundColor: ['#4ade80', '#f87171'],
              hoverOffset: 4,
              borderWidth: 0
            }]
          });

          // Atualizar dados do gráfico de barras
          const receitasPorMes = Array(12).fill(0).map((_, i) => {
            return jogadoresFormatados.reduce((total, jogador) => {
              const pagamento = jogador.pagamentos[i];
              return total + (pagamento && pagamento.pago ? (jogador.valorMensalidade || 0) : 0);
            }, 0);
          });

          const despesasPorMes = Array(12).fill(0).map((_, i) => {
            return transacoesResponse.data.data
              .filter(t => {
                try {
                  const dataStr = typeof t.data === 'string' ? t.data : new Date(t.data).toISOString();
                  return dataStr.startsWith(`${filtroMes.slice(0, 4)}-${(i + 1).toString().padStart(2, '0')}`) && t.tipo === "despesa";
                } catch {
                  return false;
                }
              })
              .reduce((acc, t) => acc + (t.valor || 0), 0);
          });

          setDadosGraficoBarras({
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [
              {
                label: 'Receitas',
                data: receitasPorMes,
                backgroundColor: '#4ade80',
                borderRadius: 6
              },
              {
                label: 'Despesas',
                data: despesasPorMes,
                backgroundColor: '#f87171',
                borderRadius: 6
              }
            ]
          });
        }

        if (transacoesResponse.data.success) {
          setTransacoes(transacoesResponse.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [filtroMes]);

  // Atualizar estatísticas
  useEffect(() => {
    if (!transacoes || !jogadores) return;

    const receitasMes = transacoes
      .filter(t => t?.tipo === "receita" && 
                  t?.data?.startsWith(filtroMes?.slice(0, 4)) &&
                  !t.isento)
      .reduce((acc, t) => acc + (Number(t?.valor) || 0), 0);

    const despesasMes = transacoes
      .filter(t => t.tipo === "despesa" && t.data?.startsWith(filtroMes.slice(0, 4)))
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    const pagamentosPendentes = jogadores.reduce((total, jogador) => {
      return total + (jogador.pagamentos || []).filter(p => !p.pago && !p.isento).length;
    }, 0);

    setEstatisticas(prev => ({
      ...prev,
      totalReceitas: receitasMes,
      totalDespesas: despesasMes,
      saldo: receitasMes - despesasMes,
      pagamentosPendentes,
      totalJogadores: jogadores.length
    }));
  }, [transacoes, jogadores, filtroMes]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNovaTransacao(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const adicionarTransacao = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/financeiro/transacoes', novaTransacao);
      
      if (response.data.success) {
        setTransacoes(prev => [...prev, response.data.data]);
        setNovaTransacao({
          descricao: "",
          valor: "",
          tipo: "receita",
          categoria: "",
          data: new Date().toISOString().substring(0, 10),
          jogadorId: "",
          jogadorNome: "",
          isento: false
        });
        toast.success('Transação adicionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
    }
  };

  const togglePagamento = async (jogadorId, mesIndex) => {
    try {
      const jogador = jogadores.find(j => j._id === jogadorId);
      if (!jogador) throw new Error('Jogador não encontrado');

      const novoStatus = !jogador.pagamentos[mesIndex].pago;
      const mesAtual = new Date().getMonth();

      const response = await api.put(`/jogadores/${jogadorId}/pagamento/${mesIndex}`, {
        pago: novoStatus,
        isento: false,
        dataPagamento: novoStatus ? new Date().toISOString() : null
      });

      if (response.data.success) {
        const jogadoresAtualizados = jogadores.map(j => {
          if (j._id === jogadorId) {
            const pagamentosAtualizados = [...j.pagamentos];
            pagamentosAtualizados[mesIndex] = {
              ...jogador.pagamentos[mesIndex],
              pago: novoStatus,
              isento: false,
              dataPagamento: novoStatus ? new Date().toISOString() : null,
              dataLimite: new Date(new Date().getFullYear(), mesIndex, 20)
            };

            const mesesDevendo = pagamentosAtualizados
              .slice(0, mesAtual + 1)
              .filter(pago => !pago.pago && !pago.isento).length;

            return {
              ...j,
              pagamentos: pagamentosAtualizados,
              statusFinanceiro: mesesDevendo > 0 ? 'devendo' : 'em_dia'
            };
          }
          return j;
        });

        setJogadores(jogadoresAtualizados);
        toast.success(`Pagamento ${novoStatus ? 'confirmado' : 'cancelado'} com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const toggleStatusFinanceiro = async (jogadorId) => {
    try {
      const jogador = jogadores.find(j => j._id === jogadorId);
      if (!jogador) throw new Error('Jogador não encontrado');

      const novoStatus = jogador.statusFinanceiro === 'em_dia' ? 'devendo' : 'em_dia';
      const response = await api.put(`/jogadores/${jogadorId}/status`, {
        statusFinanceiro: novoStatus
      });

      if (response.data.success) {
        const jogadoresAtualizados = jogadores.map(j => {
          if (j._id === jogadorId) {
            return {
              ...j,
              statusFinanceiro: novoStatus
            };
          }
          return j;
        });

        setJogadores(jogadoresAtualizados);
        toast.success(`Status financeiro atualizado com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status financeiro:', error);
      toast.error('Erro ao atualizar status financeiro');
    }
  };

  const deletarTransacao = async (id) => {
    try {
      const response = await api.delete(`/financeiro/transacoes/${id}`);
      
      if (response.data.success) {
        setTransacoes(prev => prev.filter(t => t._id !== id));
        toast.success('Transação excluída com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
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
      const canvas = document.getElementById('graficoPizza');
      if (!canvas) throw new Error('Elemento do gráfico não encontrado');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'grafico-financeiro.png';
      link.href = dataUrl;
      link.click();
      
      toast.success('Gráfico exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
      toast.error('Erro ao exportar gráfico');
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
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Elemento não encontrado');

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#1f2937'
      });
      
      const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
      const file = new File([blob], 'controle-financeiro.png', { type: blob.type });
      
      if (navigator.share) {
        await navigator.share({
          title: 'Controle Financeiro',
          text: 'Confira o controle financeiro do time!',
          files: [file]
        });
        toast.success('Controle compartilhado com sucesso!');
      } else {
        const link = document.createElement('a');
        link.download = 'controle-financeiro.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Controle exportado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar controle:', error);
      toast.error('Erro ao compartilhar controle');
    }
  };

  const compartilharHistorico = async (elementId) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Elemento não encontrado');

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#1f2937'
      });
      
      const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
      const file = new File([blob], 'historico-financeiro.png', { type: blob.type });
      
      if (navigator.share) {
        await navigator.share({
          title: 'Histórico Financeiro',
          text: 'Confira o histórico financeiro do time!',
          files: [file]
        });
        toast.success('Histórico compartilhado com sucesso!');
      } else {
        const link = document.createElement('a');
        link.download = 'historico-financeiro.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Histórico exportado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar histórico:', error);
      toast.error('Erro ao compartilhar histórico');
    }
  };

  const desmarcarTodosPagamentos = async () => {
    try {
      const response = await api.put('/jogadores/pagamentos/reset');
      
      if (response.data.success) {
        const jogadoresAtualizados = jogadores.map(jogador => ({
          ...jogador,
          pagamentos: Array(12).fill().map((_, index) => ({
            pago: false,
            isento: false,
            dataPagamento: null,
            dataLimite: new Date(new Date().getFullYear(), index, 20)
          }))
        }));

        setJogadores(jogadoresAtualizados);
        toast.success('Todos os pagamentos foram desmarcados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao desmarcar pagamentos:', error);
      toast.error('Erro ao desmarcar pagamentos');
    }
  };

  const jogadoresFiltrados = jogadores.filter(jogador =>
    jogador.nome.toLowerCase().includes(filtroJogador.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setRelatorioModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Receitas</h3>
          <p className="text-2xl font-bold text-green-500">
            R$ {estatisticas.totalReceitas.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Despesas</h3>
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
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Status dos Pagamentos</h3>
            <button
              onClick={exportarImagem}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaDownload size={20} />
            </button>
          </div>
          <div className="h-64">
            <Pie data={dadosGraficoPizza} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
          <div className="h-64">
            <Bar data={dadosGraficoBarras} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transações</h3>
          <button
            onClick={() => setEditarModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Nova Transação
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="p-2">Data</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Valor</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoes
                .filter(t => t.data.startsWith(filtroMes))
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map(transacao => (
                  <tr key={transacao._id} className="border-t border-gray-700">
                    <td className="p-2">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2">{transacao.descricao}</td>
                    <td className="p-2">{transacao.categoria}</td>
                    <td className={`p-2 ${transacao.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                      R$ {transacao.valor.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => deletarTransacao(transacao._id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Transação */}
      {editarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Nova Transação</h3>
            <form onSubmit={adicionarTransacao}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    name="descricao"
                    value={novaTransacao.descricao}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Tipo
                  </label>
                  <select
                    name="tipo"
                    value={novaTransacao.tipo}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="categoria"
                    value={novaTransacao.categoria}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {novaTransacao.tipo === 'receita' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Jogador
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={filtroJogadorModal}
                          onChange={(e) => setFiltroJogadorModal(e.target.value)}
                          placeholder="Buscar jogador..."
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {mostrarListaJogadores && (
                          <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {jogadores
                              .filter(j => j.nome.toLowerCase().includes(filtroJogadorModal.toLowerCase()))
                              .map(jogador => (
                                <div
                                  key={jogador._id}
                                  onClick={() => {
                                    setNovaTransacao(prev => ({
                                      ...prev,
                                      jogadorId: jogador._id,
                                      jogadorNome: jogador.nome
                                    }));
                                    setMostrarListaJogadores(false);
                                    setFiltroJogadorModal('');
                                  }}
                                  className="px-4 py-2 hover:bg-gray-600 cursor-pointer"
                                >
                                  {jogador.nome}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {novaTransacao.jogadorId && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isento"
                          checked={novaTransacao.isento}
                          onChange={handleInputChange}
                          className="rounded text-blue-500 focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-400">
                          Marcar como isento
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditarModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Relatório */}
      {relatorioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Relatório Financeiro</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportarImagem}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaDownload size={20} />
                </button>
                <button
                  onClick={() => setRelatorioModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div id="relatorio-content" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2">Resumo Financeiro</h4>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Receitas:</span>
                      <span className="text-green-500">R$ {estatisticas.totalReceitas.toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Despesas:</span>
                      <span className="text-red-500">R$ {estatisticas.totalDespesas.toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Saldo:</span>
                      <span className={estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'}>
                        R$ {estatisticas.saldo.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2">Informações Adicionais</h4>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Total de Jogadores:</span>
                      <span>{estatisticas.totalJogadores}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Pagamentos Pendentes:</span>
                      <span className="text-yellow-500">{estatisticas.pagamentosPendentes}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Gráficos</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm text-gray-400 mb-2">Status dos Pagamentos</h5>
                    <div className="h-48">
                      <Pie data={dadosGraficoPizza} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm text-gray-400 mb-2">Fluxo de Caixa</h5>
                    <div className="h-48">
                      <Bar data={dadosGraficoBarras} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}