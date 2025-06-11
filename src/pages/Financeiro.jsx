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
  FaSearch
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

          // Atualizar dados do gráfico de fluxo
          const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const receitas = Array(12).fill(0);
          const despesas = Array(12).fill(0);

          transacoesResponse.data.data.forEach(transacao => {
            const data = new Date(transacao.data);
            const mes = data.getMonth();
            if (transacao.tipo === 'receita') {
              receitas[mes] += Number(transacao.valor) || 0;
            } else {
              despesas[mes] += Number(transacao.valor) || 0;
            }
          });

          setBarChartData({
            labels: meses,
            datasets: [
              {
                label: 'Receitas',
                data: receitas,
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
              },
              {
                label: 'Despesas',
                data: despesas,
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1
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

  const handleNovaTransacao = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/financeiro/transacoes', novaTransacao);
      if (response.data.success) {
        toast.success('Transação registrada com sucesso!');
        setTransacoes([...transacoes, response.data.data]);
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
      }
    } catch (error) {
      console.error('Erro ao registrar transação:', error);
      toast.error('Erro ao registrar transação');
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

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleVoltar}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <RiArrowLeftDoubleLine className="mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-white">Gestão Financeira</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setRelatorioModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaFilePdf className="mr-2" />
              Relatório
            </button>
            <button
              onClick={() => setEditarModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Nova Transação
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Receitas</p>
                <p className="text-2xl font-bold text-green-500">R$ {estatisticas.totalReceitas.toFixed(2)}</p>
              </div>
              <FaArrowUp className="text-green-500 text-2xl" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Despesas</p>
                <p className="text-2xl font-bold text-red-500">R$ {estatisticas.totalDespesas.toFixed(2)}</p>
              </div>
              <FaArrowDown className="text-red-500 text-2xl" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Saldo</p>
                <p className={`text-2xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  R$ {estatisticas.saldo.toFixed(2)}
                </p>
              </div>
              <FaMoneyBillWave className={`${estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'} text-2xl`} />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">{estatisticas.pagamentosPendentes}</p>
              </div>
              <FaUsers className="text-yellow-500 text-2xl" />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Status de Pagamentos</h3>
            <div className="h-64">
              <Pie data={dadosGraficoPizza} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#e5e7eb'
                    }
                  }
                }
              }} />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Fluxo de Caixa</h3>
            <div className="h-64">
              <Bar data={dadosGraficoBarras} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#e5e7eb'
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
                      color: '#e5e7eb'
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#e5e7eb'
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Fluxo Anual</h3>
            <div className="h-64">
              <Bar data={barChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#e5e7eb'
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
                      color: '#e5e7eb'
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#e5e7eb'
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-200">Histórico de Transações</h3>
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar por jogador..."
                  value={filtroJogador}
                  onChange={(e) => setFiltroJogador(e.target.value)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              <select
                value={filtroHistorico.tipo}
                onChange={(e) => setFiltroHistorico(prev => ({ ...prev, tipo: e.target.value }))}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
              <select
                value={filtroHistorico.categoria}
                onChange={(e) => setFiltroHistorico(prev => ({ ...prev, categoria: e.target.value }))}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as categorias</option>
                <option value="mensalidade">Mensalidade</option>
                <option value="equipamento">Equipamento</option>
                <option value="aluguel">Aluguel</option>
                <option value="outros">Outros</option>
              </select>
              <button
                onClick={handleLimparFiltros}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Jogador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transacoes.map((transacao) => (
                  <tr key={transacao.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transacao.data).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transacao.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transacao.jogadorNome || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transacao.categoria}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transacao.tipo === 'receita' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      R$ {Number(transacao.valor).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditarTransacao(transacao.id, transacao)}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleExcluirTransacao(transacao.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nova Transação */}
      <AnimatePresence>
        {editarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Nova Transação</h3>
                <button
                  onClick={() => setEditarModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleNovaTransacao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                  <select
                    value={novaTransacao.tipo}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={novaTransacao.descricao}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                  <input
                    type="number"
                    value={novaTransacao.valor}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                  <select
                    value={novaTransacao.categoria}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="mensalidade">Mensalidade</option>
                    <option value="equipamento">Equipamento</option>
                    <option value="aluguel">Aluguel</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={novaTransacao.data}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Jogador</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={novaTransacao.jogadorNome}
                      onClick={() => setMostrarListaJogadores(true)}
                      readOnly
                      placeholder="Selecione um jogador..."
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <FaUser className="absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setEditarModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Lista de Jogadores */}
      <AnimatePresence>
        {mostrarListaJogadores && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Selecionar Jogador</h3>
                <button
                  onClick={() => setMostrarListaJogadores(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar jogador..."
                  value={filtroJogadorModal}
                  onChange={(e) => setFiltroJogadorModal(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              <div className="max-h-96 overflow-y-auto">
                <ListaJogadores
                  onSelect={handleSelecionarJogador}
                  filtro={filtroJogadorModal}
                />
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Gerar Relatório</h3>
                <button
                  onClick={() => setRelatorioModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Mês</label>
                  <input
                    type="month"
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleImprimirRelatorio}
                    className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FaPrint className="mr-2" />
                    Imprimir
                  </button>
                  <button
                    onClick={handleExportarPDF}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaFilePdf className="mr-2" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={handleCompartilharRelatorio}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaShare className="mr-2" />
                    Compartilhar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" />
    </div>
  );
} 