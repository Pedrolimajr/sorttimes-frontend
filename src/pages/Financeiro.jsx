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

  // ... rest of the code ...

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* ... existing code ... */}
      
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

      {/* ... rest of the code ... */}
    </div>
  );
} 