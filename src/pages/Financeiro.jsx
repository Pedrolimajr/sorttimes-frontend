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

// No início do componente, adicione:
const [isento, setIsento] = useState(false);

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
        // Converte os pagamentos do formato do backend para o formato do frontend
        const pagamentos = Array(12).fill(false);
        if (jogador.pagamentos && Array.isArray(jogador.pagamentos)) {
          jogador.pagamentos.forEach((pagamento, index) => {
            if (typeof pagamento === 'object' && pagamento !== null) {
              pagamentos[index] = pagamento.pago || false;
            } else {
              pagamentos[index] = pagamento || false;
            }
          });
        }

        // Verifica status - Nova lógica considerando o mês anterior
        const mesAtual = new Date().getMonth();
        const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
        const todosMesesPagos = pagamentos[mesAnterior];

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

      const payload = {
        ...novaTransacao,
        valor: parseFloat(novaTransacao.valor),
        data: new Date(novaTransacao.data + 'T12:00:00').toISOString()
      };

      // Atualização otimista - adiciona a transação imediatamente
      const transacaoTemporaria = {
        ...payload,
        _id: 'temp-' + Date.now(),
        createdAt: new Date().toISOString()
      };
      
      setTransacoes(prev => [transacaoTemporaria, ...prev]);

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
      // Remove a transação temporária em caso de erro
      setTransacoes(prev => prev.filter(t => t._id !== transacaoTemporaria?._id));
      toast.error(error.message || 'Erro ao adicionar transação');
    }
  };

  const togglePagamento = async (jogadorId, mesIndex) => {
    const jogadorAtual = jogadores.find(j => j._id === jogadorId);
    if (!jogadorAtual) {
      toast.error('Jogador não encontrado');
      return;
    }

    try {
      // Atualização otimista - atualiza o estado imediatamente
      const updatedPagamentos = [...jogadorAtual.pagamentos];
      updatedPagamentos[mesIndex] = !updatedPagamentos[mesIndex];

      // Atualiza o estado local primeiro
      setJogadores(prevJogadores => {
        const updatedJogadores = prevJogadores.map(j => {
          if (j._id === jogadorId) {
            return {
              ...j,
              pagamentos: updatedPagamentos
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

      // Prepara o payload para a API
      const payload = {
        mes: mesIndex,
        pago: updatedPagamentos[mesIndex],
        isento: false,
        dataPagamento: updatedPagamentos[mesIndex] ? new Date() : null,
        dataLimite: new Date(new Date().getFullYear(), mesIndex, 20)
      };

      // Atualiza no banco de dados
      const response = await api.post(`/jogadores/${jogadorId}/pagamentos`, payload);

      if (!response.data) {
        throw new Error('Resposta inválida do servidor');
      }

      // Atualiza o cache com os dados mais recentes
      const updatedJogador = response.data.data.jogador;
      if (updatedJogador) {
        setJogadores(prevJogadores => {
          const newJogadores = prevJogadores.map(j => 
            j._id === jogadorId ? {
              ...j,
              pagamentos: updatedJogador.pagamentos.map(p => p.pago)
            } : j
          );

          // Atualiza o localStorage em batch
          requestAnimationFrame(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              jogadoresCache: newJogadores,
              transacoesCache: transacoes,
              lastUpdate: new Date().toISOString()
            }));
          });

          return newJogadores;
        });
      }

    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      toast.error('Erro ao atualizar pagamento');
      
      // Reverte a mudança em caso de erro
      setJogadores(prevJogadores => {
        const revertedJogadores = prevJogadores.map(j => {
          if (j._id === jogadorId) {
            return {
              ...j,
              pagamentos: jogadorAtual.pagamentos
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
          scale: 3,
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

  const compartilharControle = async () => {
    try {
      const element = document.getElementById('tabela-mensalidades');
      if (!element) {
        toast.error('Elemento não encontrado');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 4,
        logging: false,
        useCORS: true,
        backgroundColor: '#1f2937',
        width: element.offsetWidth,
        height: element.offsetHeight,
        imageTimeout: 0,
        pixelRatio: window.devicePixelRatio
      });

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'controle-mensalidades.png', { type: 'image/png' });
        
        try {
          await navigator.share({
            files: [file],
            title: 'Controle de Mensalidades',
            text: 'Controle de Mensalidades dos Jogadores'
          });
          toast.success('Compartilhamento realizado com sucesso!');
        } catch (error) {
          console.error('Erro ao compartilhar:', error);
          toast.error('Erro ao compartilhar imagem');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem');
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
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
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
          className="mb-12 sm:mb-16 relative"
        >
          {/* Novo botão voltar */}
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-2 -top-8 sm:-top-0 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-14 sm:mt-0">
            <div className="flex-grow flex justify-center items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-3">
                  <FaMoneyBillWave className="text-blue-400 text-2xl sm:text-3xl" />
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
                  >
                    Financeiro
                  </motion.h1>
                </div>

                {/* Novo subtítulo */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 text-sm sm:text-base"
                >
                  Gerencie as finanças e mensalidades do time
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-gray-800 bg-opacity-50 px-3 py-2 rounded-lg">
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
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg text-xs sm:text-sm"
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
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-1 sm:gap-2">
              <FaArrowUp className="text-green-400 text-sm" /> Receitas
            </h3>
            <p className="text-lg sm:text-xl font-bold text-white">
              R$ {(estatisticas.totalReceitas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-1 sm:gap-2">
              <FaArrowDown className="text-red-400 text-sm" /> Despesas
            </h3>
            <p className="text-lg sm:text-xl font-bold text-white">
              R$ {(estatisticas.totalDespesas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className={`bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border ${(estatisticas.saldo || 0) >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Saldo</h3>
            <p className={`text-lg sm:text-xl font-bold ${(estatisticas.saldo || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              R$ {(estatisticas.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Novo Lançamento</h2>

              <form onSubmit={adicionarTransacao} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={novaTransacao.data}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Descrição</label>
                  <input
                    type="text"
                    name="descricao"
                    value={novaTransacao.descricao}
                    onChange={handleInputChange}
                    placeholder="Ex: Mensalidade João"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Valor</label>
                  <input
                    type="number"
                    name="valor"
                    min="0.01"
                    step="0.01"
                    value={novaTransacao.valor}
                    onChange={handleInputChange}
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Tipo</label>
                  <select
                    name="tipo"
                    value={novaTransacao.tipo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                    
                  </select>
                </div>

                {novaTransacao.tipo === "receita" && (
  <div className="relative">
    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Jogador (opcional)</label>
    <div className="relative">
      <input
        type="text"
        value={novaTransacao.jogadorNome}
        onClick={() => setMostrarListaJogadores(true)}
        readOnly
        placeholder="Selecione um jogador (opcional)"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm cursor-pointer"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-xs sm:text-sm"
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

                    <div className="flex-1 overflow-y-auto p-4">
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
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 mt-4 sm:mt-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Status de Pagamentos</h2>
              <div className="h-48 sm:h-64">
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
              <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-400">
                {estatisticas.pagamentosPendentes} Pagamentos pendentes este ano
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Histórico de Transações</h2>
                  <motion.button
                    onClick={() => compartilharHistorico('tabela-historico')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-600 transition-colors"
                    title="Compartilhar histórico de transações"
                  >
                    <FaShare className="text-sm sm:text-base" />
                  </motion.button>
                </div>
              </div>

              {/* Filtros do histórico */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar por jogador"
                    value={filtroHistorico.jogador}
                    onChange={(e) => setFiltroHistorico({...filtroHistorico, jogador: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                  />
                  <FaSearch className="absolute right-3 top-2.5 text-gray-400 text-xs sm:text-sm" />
                </div>
                
                <select
                  value={filtroHistorico.tipo}
                  onChange={(e) => setFiltroHistorico({...filtroHistorico, tipo: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
                
                <button
                  onClick={() => setFiltroHistorico({ jogador: '', tipo: 'todos', categoria: '' })}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm"
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
                  <div className="max-h-[400px] overflow-y-auto" id="tabela-historico">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descrição</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                      {transacoesFiltradas.map((t) => (
 <tr className={`${t.isento ? "bg-yellow-100/10 border-l-4 border-yellow-400/50" : ""}`}>
    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-300">
      {new Date(t.data).toLocaleDateString('pt-BR')}
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
      {t.tipo === "receita" ? "+" : "-"} R$ {t.valor.toFixed(2)}
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
                    Mostrando {transacoesFiltradas.length} de {transacoes.length} transações
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Controle de Mensalidades</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder="Buscar jogador..."
                      value={filtroJogador}
                      onChange={(e) => setFiltroJogador(e.target.value)}
                      className="w-full sm:w-40 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                    />
                    <FaSearch className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                  </div>
                  <motion.button
                    onClick={() => compartilharControle('tabela-mensalidades')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white hover:bg-blue-700 transition-colors flex-shrink-0"
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
                <div className="overflow-x-auto max-h-[60vh] sm:max-h-[70vh] md:max-h-[80vh]">
                  <div id="tabela-mensalidades" className="min-w-[800px]">
                    <table className="w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Jogador</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          {dadosGraficoBarras.labels.map((mes, i) => (
                            <th key={i} className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                              {mes}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {jogadores.filter(jogador =>
                          jogador.nome.toLowerCase().includes(filtroJogador.toLowerCase())
                        ).map((jogador) => (
                          <tr key={jogador._id} className="hover:bg-gray-700/50">
                            <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-white">
                              {jogador.nome}
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-3 whitespace-nowrap">
                              <motion.button
                                onClick={() => toggleStatus(jogador._id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  jogador.statusFinanceiro === 'Adimplente' ?
                                    'bg-green-500/20 text-green-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {jogador.statusFinanceiro || 'Inadimplente'}
                              </motion.button>
                            </td>
                            {jogador.pagamentos.map((pago, i) => (
                              <td key={i} className="px-1 sm:px-2 py-2 sm:py-3 whitespace-nowrap text-center">
                                <motion.button
                                  onClick={() => togglePagamento(jogador._id, i)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`
                                    w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center
                                    ${pago ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                                  `}
                                  title={pago ? "Mensalidade paga" : "Mensalidade pendente"}
                                >
                                  {pago ? <FaCheck size={8} className="sm:text-xs" /> : <FaTimes size={8} className="sm:text-xs" />}
                                </motion.button>
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
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Fluxo Anual</h2>
              <div className="h-48 sm:h-64">
                <Bar
                  data={dadosGraficoBarras}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(229, 231, 235, 0.1)'
                        },
                        ticks: {
                          color: '#e5e7eb',
                          font: {
                            size: window.innerWidth < 640 ? 10 : 12
                          }
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(229, 231, 235, 0.1)'
                        },
                        ticks: {
                          color: '#e5e7eb',
                          font: {
                            size: window.innerWidth < 640 ? 10 : 12
                          }
                        }
                      }
                    },
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
            </motion.div>
          </div>
        </div>
      </div>

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
              className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md sm:max-w-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Relatório Financeiro</h3>
                <motion.button
                  onClick={() => setRelatorioModal(false)}
                  whileHover={{ rotate: 90 }}
                  className="text-gray-400 hover:text-white text-sm sm:text-base"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <div id="relatorio-content" className="space-y-3 sm:space-y-4">
                {/* Conteúdo existente do modal */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">Receitas</h4>
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                      R$ {estatisticas.totalReceitas.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">Despesas</h4>
                    <p className="text-xl sm:text-2xl font-bold text-red-400">
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
                  <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">Pagamentos Pendentes</h4>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {estatisticas.pagamentosPendentes} mensalidades
                  </p>
                </div>

                <div className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm">Total de Jogadores</h4>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {estatisticas.totalJogadores} jogadores
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end gap-2 sm:gap-3">
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
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
