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

Chart.register(...registerables);

export default function Financeiro() {
  const navigate = useNavigate();
  const [transacoes, setTransacoes] = useState([]);
  const [jogadores, setJogadores] = useState([]);
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
    isento: false // Adicionando o estado para 'isento'
  });

  const [estatisticas, setEstatisticas] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    pagamentosPendentes: 0,
    totalJogadores: 0
  });

const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const categoriasReceita = ["Mensalidade", "Doação", "Venda", "Outros"];
  const categoriasDespesa = ["Aluguel", "Material Esportivo", "Transporte", "Alimentação", "Manutenção", "Outros"];

  // Funções de busca de dados
  useEffect(() => {
    fetchEstatisticas();
    fetchTransacoes();
    fetchJogadores();
  }, [filtroMes]);

  useEffect(() => {
    fetchTransacoes();
  }, [filtroTransacaoTipo, filtroTransacaoCategoria, filtroTransacaoJogador]);

  const fetchEstatisticas = async () => {
    try {
      const response = await api.get(`/financeiro/estatisticas?mes=${filtroMes}`);
      const { totalReceitas, totalDespesas, saldo, pagamentosPendentes } = response.data.data;
      setTotalReceitas(totalReceitas);
      setTotalDespesas(totalDespesas);
      setSaldo(saldo);
      setPagamentosPendentes(pagamentosPendentes);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      toast.error("Erro ao carregar estatísticas.");
    }
  };

  const fetchTransacoes = async () => {
    try {
      const params = {
        mes: filtroMes,
        tipo: filtroTransacaoTipo,
        categoria: filtroTransacaoCategoria,
        jogadorId: filtroTransacaoJogador
      };
      const response = await api.get("/financeiro/transacoes", { params });
      setTransacoes(response.data.data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast.error("Erro ao carregar transações.");
    }
  };

  const fetchJogadores = async () => {
    try {
      const response = await api.get("/jogadores");
      setJogadores(response.data.data);
    } catch (error) {
      console.error("Erro ao buscar jogadores:", error);
      toast.error("Erro ao carregar jogadores.");
    }
  };

  const STORAGE_KEY = 'dadosFinanceiros';
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
        // Verifica se há transações de mensalidade para este jogador
        const transacoesJogador = transacoesData.filter(t => 
          t.jogadorId === jogador._id && t.categoria === 'mensalidade'
        );

        // Cria array de pagamentos baseado nas transações
        const pagamentos = Array(12).fill(false);
        transacoesJogador.forEach(t => {
          const mes = new Date(t.data).getMonth();
          pagamentos[mes] = true;
        });

        // Verifica status
        const mesAtual = new Date().getMonth();
        const todosMesesPagos = pagamentos
          .slice(0, mesAtual + 1)
          .every(pago => pago);

        return {
          ...jogador,
          pagamentos: pagamentos,
          statusFinanceiro: todosMesesPagos ? 'Adimplente' : 'Inadimplente'
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
       const receitasMes = transacoes
  .filter(t => t?.tipo === "receita" && 
              t?.data?.startsWith(filtroMes?.slice(0, 4)) &&
              !t.isento) // Ignora transações isentas
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
    const { name, value, type, checked } = e.target;
    setNovaTransacao(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
const handleTipoChange = (e) => {
    const tipo = e.target.value;
    setNovaTransacao(prevState => ({
      ...prevState,
      tipo,
      categoria: "", // Limpa a categoria ao mudar o tipo
      jogadorId: "",
      jogadorNome: "",
      isento: false // Reseta isento ao mudar o tipo
    }));
  };
const handleJogadorChange = (e) => {
    const jogadorId = e.target.value;
    const jogador = jogadores.find(j => j._id === jogadorId);
    setNovaTransacao(prevState => ({
      ...prevState,
      jogadorId: jogadorId,
      jogadorNome: jogador ? jogador.nome : ""
    }));
  };
  // Adicionando transação
  const adicionarTransacao = async (e) => {
  e.preventDefault();

  try {
    if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.tipo || !novaTransacao.data) {
      toast.error("Por favor, preencha todos os campos obrigatórios da transação.");
      return;
    }

    // Verifica se já existe uma transação para o mesmo jogador na mesma data
    if (novaTransacao.jogadorId) {
      const transacaoExistente = transacoes.find(t => 
        t.jogadorId === novaTransacao.jogadorId && 
        new Date(t.data).toISOString().split('T')[0] === novaTransacao.data
      );
if (novaTransacao.tipo === 'receita' && novaTransacao.categoria === 'Mensalidade' && !novaTransacao.jogadorId) {
      toast.error("Por favor, selecione um jogador para a mensalidade.");
      return;
    }

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

    // Atualização otimista - adiciona a transação imediatamente
    const transacaoTemporaria = {
      ...payload,
      _id: 'temp-' + Date.now(), // ID temporário
      createdAt: new Date().toISOString()
    };
    
    setTransacoes(prev => [transacaoTemporaria, ...prev]);

    // Se for uma receita de mensalidade
    if (payload.tipo === 'receita' && payload.jogadorId) {
      const dataTransacao = new Date(payload.data);
      const mesTransacao = dataTransacao.getMonth();

      setJogadores(prevJogadores => {
        return prevJogadores.map(j => {
          if (j._id === payload.jogadorId) {
            const pagamentosAtualizados = [...j.pagamentos];
            pagamentosAtualizados[mesTransacao] = true;

            const mesAtual = new Date().getMonth();
            const todosMesesPagos = pagamentosAtualizados
              .slice(0, mesAtual + 1)
              .every(pago => pago);

            return {
              ...j,
              pagamentos: pagamentosAtualizados,
              statusFinanceiro: todosMesesPagos ? 'Adimplente' : 'Inadimplente'
            };
          }
          return j;
        });
      });
    }

    // Faz a chamada à API
    const response = await api.post('/financeiro/transacoes', payload);
    const transacaoReal = response.data.data;

    // Substitui a transação temporária pela real
    setTransacoes(prev => [
      transacaoReal,
      ...prev.filter(t => t._id !== transacaoTemporaria._id)
    ]);

    // Atualiza localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      jogadoresCache: jogadores,
      transacoesCache: [transacaoReal, ...transacoes.filter(t => t._id !== transacaoTemporaria._id)],
      lastUpdate: new Date().toISOString()
    }));

    // Reset do formulário
await api.post("/financeiro/transacoes", transacaoParaEnviar);
      toast.success("Transação adicionada com sucesso!");
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
      fetchTransacoes();
      fetchEstatisticas();
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      toast.error("Erro ao adicionar transação.");
    }
  };

const togglePagamento = async (jogadorId, mesIndex) => {
  try {
    const jogador = jogadores.find(j => j._id === jogadorId);
    if (!jogador) throw new Error('Jogador não encontrado');

    const mesAtual = new Date().getMonth();
    if (mesIndex > mesAtual) {
      toast.warning('Não é possível marcar pagamentos de meses futuros');
      return;
    }

    // Salva estado original para fallback
    const originalJogadores = [...jogadores];
    
    // Pergunta se é isenção apenas se estiver marcando como pago (status anterior false)
    let isento = false;
    if (!jogador.pagamentos[mesIndex]) {
      isento = window.confirm('Deseja marcar como isento? (Sem valor financeiro)');
    }

    // Atualização otimista incluindo informação de isenção
    const updatedJogadores = jogadores.map(j => {
      if (j._id === jogadorId) {
        const updatedPagamentos = [...j.pagamentos];
        const updatedIsentoMeses = { ...(j.isentoMeses || {}) };
        
        updatedPagamentos[mesIndex] = !j.pagamentos[mesIndex] || isento;
        
        // Atualiza o status de isenção
        if (isento) {
          updatedIsentoMeses[mesIndex] = true;
        } else if (updatedPagamentos[mesIndex] === false) {
          delete updatedIsentoMeses[mesIndex];
        }

        const todosMesesPagos = updatedPagamentos
          .slice(0, mesAtual + 1)
          .every(pago => pago);

        return {
          ...j,
          pagamentos: updatedPagamentos,
          isentoMeses: updatedIsentoMeses,
          statusFinanceiro: todosMesesPagos ? 'Adimplente' : 'Inadimplente'
        };
      }
      return j;
    });

    setJogadores(updatedJogadores);

    // Chamada à API
    const response = await api.post(`/jogadores/${jogadorId}/pagamentos`, {
      mes: mesIndex,
      pago: !jogador.pagamentos[mesIndex], // Inverte o status
      isento,                              // Passa a flag de isenção
      valor: isento ? 0 : 100,             // Zero se isento
      dataPagamento: !jogador.pagamentos[mesIndex] ? new Date().toISOString() : null
    });

    // Atualiza transações se necessário
    if (response.data.data.transacao) {
      setTransacoes(prev => [response.data.data.transacao, ...prev]);
    }

    toast.success(
      isento ? 'Mensalidade isentada com sucesso!' :
      jogador.pagamentos[mesIndex] ? 'Pagamento removido!' : 'Pagamento registrado!'
    );

  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    setJogadores(originalJogadores);
    toast.error(error.response?.data?.message || 'Erro ao atualizar pagamento');
  }
};

  const deletarTransacao = async (id) => {
  try {
    // Encontra a transação que será deletada
    const transacaoParaDeletar = transacoes.find(t => t._id === id);
    if (!transacaoParaDeletar) {
      throw new Error('Transação não encontrada');
    }

    // Atualização otimista - remove a transação imediatamente
    setTransacoes(prev => prev.filter(t => t._id !== id));

    // Se for uma transação de mensalidade, desmarca o mês correspondente
    if (transacaoParaDeletar.categoria === 'mensalidade' && transacaoParaDeletar.jogadorId) {
      const dataTransacao = new Date(transacaoParaDeletar.data);
      const mesTransacao = dataTransacao.getMonth();
      
      setJogadores(prevJogadores => {
        return prevJogadores.map(jogador => {
          if (jogador._id === transacaoParaDeletar.jogadorId) {
            const pagamentosAtualizados = [...jogador.pagamentos];
            pagamentosAtualizados[mesTransacao] = false;
            
            const mesAtual = new Date().getMonth();
            const todosMesesPagos = pagamentosAtualizados
              .slice(0, mesAtual + 1)
              .every(pago => pago);
            
            return {
              ...jogador,
              pagamentos: pagamentosAtualizados,
              statusFinanceiro: todosMesesPagos ? 'Adimplente' : 'Inadimplente'
            };
          }
          return jogador;
        });
      });
    }

    // Faz a chamada à API para deletar
    await api.delete(`/financeiro/transacoes/${id}`);

    // Atualiza localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      jogadoresCache: jogadores,
      transacoesCache: transacoes.filter(t => t._id !== id),
      lastUpdate: new Date().toISOString()
    }));

    toast.success('Transação removida com sucesso!');
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    // Reverte as mudanças em caso de erro
    setTransacoes(transacoes);
    setJogadores(jogadores);
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 relative">
      <ToastContainer />

      <motion.button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-full shadow-lg transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Voltar ao Início"
      >
        <FaArrowLeft className="text-xl" />
      </motion.button>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">Gestão Financeira</h1>

      <div className="w-full max-w-6xl bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 sm:mb-0">Visão Geral do Mês</h2>
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-gray-500 text-xl" />
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            className="bg-blue-100 p-4 rounded-lg shadow-md flex items-center justify-between"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <FaArrowUp className="text-blue-600 text-2xl" />
              <div>
                <p className="text-sm text-gray-600">Total Receitas</p>
                <p className="text-lg font-bold text-blue-800">{formatarValor(totalReceitas)}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="bg-red-100 p-4 rounded-lg shadow-md flex items-center justify-between"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <FaArrowDown className="text-red-600 text-2xl" />
              <div>
                <p className="text-sm text-gray-600">Total Despesas</p>
                <p className="text-lg font-bold text-red-800">{formatarValor(totalDespesas)}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            className={`p-4 rounded-lg shadow-md flex items-center justify-between ${saldo >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <FaMoneyBillWave className={`text-2xl ${saldo >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
              <div>
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className={`text-lg font-bold ${saldo >= 0 ? 'text-green-800' : 'text-orange-800'}`}>{formatarValor(saldo)}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="bg-yellow-100 p-4 rounded-lg shadow-md flex items-center justify-between"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <FaUsers className="text-yellow-600 text-2xl" />
              <div>
                <p className="text-sm text-gray-600">Mens. Pendentes</p>
                <p className="text-lg font-bold text-yellow-800">{pagamentosPendentes}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <motion.button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus className="text-sm" /> Adicionar Transação
          </motion.button>
          <motion.button
            onClick={() => setMostrarGraficos(!mostrarGraficos)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaChartBar className="text-sm" /> {mostrarGraficos ? "Ocultar Gráficos" : "Mostrar Gráficos"}
          </motion.button>
          <motion.button
            onClick={() => setMostrarListaJogadores(!mostrarListaJogadores)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaUsers className="text-sm" /> {mostrarListaJogadores ? "Ocultar Jogadores" : "Ver Pagamentos"}
          </motion.button>
          <motion.button
            onClick={handleDownloadPDF}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilePdf className="text-sm" /> Baixar PDF
          </motion.button>
          <motion.button
            onClick={handlePrint}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPrint className="text-sm" /> Imprimir
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaShare className="text-sm" /> Compartilhar
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center justify-between">
              Adicionar Nova Transação
              <motion.button
                onClick={() => setMostrarFormulario(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-2xl" />
              </motion.button>
            </h2>
            <form onSubmit={adicionarTransacao} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  value={novaTransacao.descricao}
                  onChange={handleInputChange}
                  placeholder="Ex: Mensalidade, Aluguel Campo"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  value={novaTransacao.valor}
                  onChange={handleInputChange}
                  placeholder="Ex: 50.00"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  min="0"
                  step="0.01"
                  required
                  disabled={novaTransacao.isento && novaTransacao.tipo === 'receita' && novaTransacao.categoria === 'Mensalidade'} // Desabilita se for isento
                />
              </div>
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  id="tipo"
                  name="tipo"
                  value={novaTransacao.tipo}
                  onChange={handleTipoChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={novaTransacao.categoria}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Selecione a Categoria</option>
                  {novaTransacao.tipo === "receita" ?
                    categoriasReceita.map(cat => <option key={cat} value={cat}>{cat}</option>) :
                    categoriasDespesa.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  }
                </select>
              </div>
              <div>
                <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  id="data"
                  name="data"
                  value={novaTransacao.data}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              {novaTransacao.tipo === "receita" && novaTransacao.categoria === "Mensalidade" && (
                <div>
                  <label htmlFor="jogador" className="block text-sm font-medium text-gray-700 mb-1">Jogador</label>
                  <select
                    id="jogador"
                    name="jogadorId"
                    value={novaTransacao.jogadorId}
                    onChange={handleJogadorChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="">Selecione um Jogador</option>
                    {jogadores.map(jogador => (
                      <option key={jogador._id} value={jogador._id}>{jogador.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {novaTransacao.tipo === "receita" && novaTransacao.categoria === "Mensalidade" && (
                <div className="flex items-center mt-2 col-span-full md:col-span-1">
                  <input
                    type="checkbox"
                    id="isento"
                    name="isento"
                    checked={novaTransacao.isento}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isento" className="ml-2 block text-sm text-gray-900">Marcar como Isento</label>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-sm sm:text-base"
                >
                  <FaPlus className="text-sm" /> Adicionar Transação
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarGraficos && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center justify-between">
              Gráficos Financeiros
              <motion.button
                onClick={() => setMostrarGraficos(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-2xl" />
              </motion.button>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Distribuição de Receitas e Despesas</h3>
                <Pie data={pieData} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Movimentação Mensal</h3>
                <Bar data={barData} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarListaJogadores && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center justify-between">
              Status de Pagamento dos Jogadores
              <motion.button
                onClick={() => setMostrarListaJogadores(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-2xl" />
              </motion.button>
            </h2>
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Pesquisar jogador..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={pesquisaJogador}
                onChange={(e) => setPesquisaJogador(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jogador</th>
                    {meses.map((mes, index) => (
                      <th key={index} className="py-3 px-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {mes.substring(0, 3)}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarJogadores.map(jogador => (
                    <tr key={jogador._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{jogador.nome}</td>
                      {jogador.pagamentos.map((statusMes, mesIndex) => (
                        <td key={mesIndex} className="py-3 px-2 text-center text-sm">
                          <motion.button
                            onClick={() => handleTogglePagamento(jogador._id, mesIndex, statusMes.pago, statusMes.isento)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1 rounded-full transition-all ${
                              statusMes.isento
                                ? 'bg-indigo-200 text-indigo-700'
                                : statusMes.pago
                                  ? 'bg-green-200 text-green-700'
                                  : 'bg-red-200 text-red-700'
                            }`}
                            title={statusMes.isento ? 'Isento' : statusMes.pago ? 'Pago' : 'Não Pago'}
                          >
                            {statusMes.isento ? <FaCheck className="text-sm" /> : statusMes.pago ? <FaCheck className="text-sm" /> : <FaTimes className="text-sm" />}
                          </motion.button>
                        </td>
                      ))}
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          jogador.statusFinanceiro === 'Adimplente'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {jogador.statusFinanceiro}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => setJogadorSelecionado(jogador)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1"
                          >
                            <FaEdit className="text-xs" /> Gerenciar
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {jogadorSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-lg relative"
            >
              <motion.button
                onClick={() => setJogadorSelecionado(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-2xl" />
              </motion.button>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Gerenciar Pagamentos de {jogadorSelecionado.nome}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {meses.map((mes, index) => (
                  <div key={index} className="flex flex-col items-center p-2 border rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{mes}</p>
                    <motion.button
                      onClick={() => handleTogglePagamento(jogadorSelecionado._id, index, jogadorSelecionado.pagamentos[index]?.pago, jogadorSelecionado.pagamentos[index]?.isento)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        jogadorSelecionado.pagamentos[index]?.isento
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                          : jogadorSelecionado.pagamentos[index]?.pago
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {jogadorSelecionado.pagamentos[index]?.isento ? (
                        <FaCheck className="text-lg" />
                      ) : jogadorSelecionado.pagamentos[index]?.pago ? (
                        <FaCheck className="text-lg" />
                      ) : (
                        <FaTimes className="text-lg" />
                      )}
                    </motion.button>
                    <p className={`mt-2 text-xs font-medium ${
                      jogadorSelecionado.pagamentos[index]?.isento
                        ? 'text-indigo-700'
                        : jogadorSelecionado.pagamentos[index]?.pago
                          ? 'text-green-700'
                          : 'text-red-700'
                    }`}>
                      {jogadorSelecionado.pagamentos[index]?.isento ? 'Isento' : jogadorSelecionado.pagamentos[index]?.pago ? 'Pago' : 'Não Pago'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <div className="flex space-x-4">
                  <motion.button
                    type="button"
                    onClick={() => deletarJogador(jogadorSelecionado._id)} // Mantido aqui para compatibilidade
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                  >
                    <FaTrash className="text-xs sm:text-sm" /> Excluir Jogador
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setJogadorSelecionado(null)} // Botão para fechar o modal
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-3 py-2 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-xs sm:text-sm"
                  >
                    <FaEdit className="text-xs sm:text-sm" /> Fechar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="relatorio-financeiro" className="w-full max-w-6xl bg-white p-6 sm:p-8 rounded-lg shadow-xl mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center justify-between">
          Histórico de Transações
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filtrar por jogador..."
              value={filtroTransacaoJogador}
              onChange={(e) => setFiltroTransacaoJogador(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <select
              value={filtroTransacaoTipo}
              onChange={(e) => setFiltroTransacaoTipo(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos os Tipos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
            <select
              value={filtroTransacaoCategoria}
              onChange={(e) => setFiltroTransacaoCategoria(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todas as Categorias</option>
              {filtroTransacaoTipo === "receita" ?
                categoriasReceita.map(cat => <option key={cat} value={cat}>{cat}</option>) :
                filtroTransacaoTipo === "despesa" ?
                  categoriasDespesa.map(cat => <option key={cat} value={cat}>{cat}</option>) :
                  [...categoriasReceita, ...categoriasDespesa].map(cat => <option key={cat} value={cat}>{cat}</option>)
              }
            </select>
          </div>
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Descrição</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoria</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jogador</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Isento</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoes.map(transacao => (
                <tr key={transacao._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{new Date(transacao.data).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm">{transacao.descricao}</td>
                  <td className="py-3 px-4 text-sm">{transacao.categoria}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      transacao.tipo === 'receita' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium">
                    {transacao.isento ? (
                      <span className="text-gray-500">Isento</span>
                    ) : (
                      formatarValor(transacao.valor)
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">{transacao.jogadorNome || 'N/A'}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    {transacao.isento ? <FaCheck className="text-green-500 mx-auto" /> : <FaTimes className="text-red-500 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <motion.button
                      onClick={() => deletarTransacao(transacao._id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1"
                    >
                      <FaTrash className="text-xs" /> Excluir
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}