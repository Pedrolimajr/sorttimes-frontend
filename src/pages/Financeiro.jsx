// Financeiro.jsx
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
  FaChartBar,
  FaPrint,
  FaCalendarAlt,
  FaPlus,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaUsers,
  FaTimesCircle,
  FaShare,
  FaSearch
} from "react-icons/fa";
// Os ícones FaFileImage, RiArrowLeftDoubleLine, FaUser não estão sendo usados neste componente
// e por isso não foram incluídos nos imports. Se você planeja usá-los, pode adicioná-los.
import { motion, AnimatePresence } from "framer-motion";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api'; // Certifique-se que este caminho está correto

Chart.register(...registerables);

export default function Financeiro() {
  const navigate = useNavigate();
  const [transacoes, setTransacoes] = useState([]);
  const [jogadores, setJogadores] = useState([]);
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
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
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [pagamentosPendentes, setPagamentosPendentes] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarGraficos, setMostrarGraficos] = useState(false);
  const [mostrarListaJogadores, setMostrarListaJogadores] = useState(false);
  const [jogadorSelecionado, setJogadorSelecionado] = useState(null);

  // ESTES SÃO OS ESTADOS QUE ESTAVAM CAUSANDO O ERRO DE REFERÊNCIA INDEFINIDA
  const [filtroTransacaoTipo, setFiltroTransacaoTipo] = useState("");
  const [filtroTransacaoCategoria, setFiltroTransacaoCategoria] = useState("");
  const [filtroTransacaoJogador, setFiltroTransacaoJogador] = useState("");
  // FIM DOS ESTADOS CRÍTICOS

  const [pesquisaJogador, setPesquisaJogador] = useState('');
  const [valorMensalidade, setValorMensalidade] = useState(50); // Valor padrão da mensalidade, pode ser buscado do backend se for dinâmico

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

  // Funções de manipulação de formulário e dados
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

  const adicionarTransacao = async (e) => {
    e.preventDefault();
    if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.tipo || !novaTransacao.data) {
      toast.error("Por favor, preencha todos os campos obrigatórios da transação.");
      return;
    }
    if (novaTransacao.tipo === 'receita' && novaTransacao.categoria === 'Mensalidade' && !novaTransacao.jogadorId) {
      toast.error("Por favor, selecione um jogador para a mensalidade.");
      return;
    }

    try {
      const transacaoParaEnviar = { ...novaTransacao };
      // Se for uma mensalidade isenta, o valor enviado deve ser 0
      if (transacaoParaEnviar.tipo === 'receita' && transacaoParaEnviar.categoria === 'Mensalidade' && transacaoParaEnviar.isento) {
        transacaoParaEnviar.valor = 0;
      }

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

  const deletarTransacao = async (id) => {
    try {
      await api.delete(`/financeiro/transacoes/${id}`);
      toast.success("Transação removida com sucesso!");
      fetchTransacoes();
      fetchEstatisticas();
    } catch (error) {
      console.error("Erro ao remover transação:", error);
      toast.error("Erro ao remover transação.");
    }
  };

  const deletarJogador = async (jogadorId) => {
    if (window.confirm("Tem certeza que deseja excluir este jogador? Todas as transações relacionadas serão mantidas, mas o status de pagamento será desvinculado.")) {
      try {
        await api.delete(`/jogadores/${jogadorId}`);
        toast.success("Jogador removido com sucesso!");
        fetchJogadores();
        fetchEstatisticas();
        setJogadorSelecionado(null); // Fecha o modal após a exclusão
      } catch (error) {
        console.error("Erro ao excluir jogador:", error);
        toast.error("Erro ao excluir jogador.");
      }
    }
  };

  const handleTogglePagamento = async (jogadorId, mesIndex, currentPago, currentIsento) => {
    try {
      let newPago = currentPago;
      let newIsento = currentIsento;

      if (currentIsento) {
        // Se já está isento, desmarcar isenção e perguntar se quer marcar como pago
        newIsento = false;
        const confirmar = window.confirm("A mensalidade de " + meses[mesIndex] + " não será mais isenta. Deseja marcar como Paga?");
        if (confirmar) {
          newPago = true;
        } else {
          newPago = false; // Se não quer pagar, fica "não pago"
        }
      } else if (currentPago) {
        // Se já está pago, desmarcar pagamento e perguntar se quer marcar como isento
        newPago = false;
        const confirmar = window.confirm("A mensalidade de " + meses[mesIndex] + " não será mais paga. Deseja marcar como Isenta?");
        if (confirmar) {
          newIsento = true;
        } else {
          newIsento = false; // Se não quer isentar, fica "não pago"
        }
      } else {
        // Se não está pago nem isento, perguntar a intenção
        const tipoConfirmado = window.prompt("A mensalidade de " + meses[mesIndex] + " está pendente. Digite 'pago' para marcar como pago, ou 'isento' para marcar como isento:");
        if (tipoConfirmado && tipoConfirmado.toLowerCase() === 'pago') {
          newPago = true;
          newIsento = false;
        } else if (tipoConfirmado && tipoConfirmado.toLowerCase() === 'isento') {
          newIsento = true;
          newPago = false;
        } else {
          toast.info("Ação de pagamento/isenção cancelada ou inválida.");
          return; // Usuário cancelou ou digitou algo inválido
        }
      }

      await api.post(`/jogadores/${jogadorId}/pagamentos/${mesIndex}`, {
        pago: newPago,
        isento: newIsento,
        valorMensalidade: valorMensalidade // Envia o valor da mensalidade para o backend
      });

      toast.success(`Mensalidade de ${meses[mesIndex]} ${newIsento ? 'isenta' : newPago ? 'paga' : 'removida'} com sucesso!`);
      fetchJogadores(); // Atualiza a lista de jogadores para refletir o novo status
      fetchEstatisticas(); // Atualiza as estatísticas financeiras
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      toast.error("Erro ao atualizar pagamento.");
    }
  };

  // Dados para os gráficos
  const pieData = {
    labels: ['Receitas', 'Despesas'],
    datasets: [{
      data: [totalReceitas, totalDespesas],
      backgroundColor: ['#36A2EB', '#FF6384'],
      hoverBackgroundColor: ['#36A2EB', '#FF6384']
    }]
  };

  const barData = {
    labels: meses,
    datasets: [
      {
        label: 'Receitas por Mês',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        data: meses.map((_, index) => {
          const mesTransacoes = transacoes.filter(t =>
            new Date(t.data).getMonth() === index && t.tipo === 'receita' && !t.isento // Apenas receitas NÃO ISENTAS
          );
          return mesTransacoes.reduce((sum, t) => sum + t.valor, 0);
        })
      },
      {
        label: 'Despesas por Mês',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        data: meses.map((_, index) => {
          const mesTransacoes = transacoes.filter(t => new Date(t.data).getMonth() === index && t.tipo === 'despesa');
          return mesTransacoes.reduce((sum, t) => sum + t.valor, 0);
        })
      }
    ]
  };

  // Funções de exportação e impressão
  const handleDownloadPDF = async () => {
    const input = document.getElementById('relatorio-financeiro');
    if (!input) {
      toast.error("Elemento para PDF não encontrado.");
      return;
    }

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-financeiro-${filtroMes}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('relatorio-financeiro');
    if (content) {
      const printWindow = window.open('', '', 'height=800,width=1200');
      printWindow.document.write('<html><head><title>Relatório Financeiro</title>');
      printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
      printWindow.document.write('<style>');
      printWindow.document.write('@media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }');
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div class="p-8">');
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</div></body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      toast.success("Preparando impressão...");
    } else {
      toast.error("Conteúdo para impressão não encontrado.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const title = `Relatório Financeiro - ${filtroMes}`;
        const text = `Confira o relatório financeiro do mês ${filtroMes} da nossa equipe.`;
        const url = window.location.href; // Ou uma URL específica para o relatório

        await navigator.share({
          title,
          text,
          url,
        });
        toast.success("Relatório compartilhado com sucesso!");
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        toast.error("Erro ao compartilhar o relatório.");
      }
    } else {
      toast.info("A funcionalidade de compartilhamento não é suportada neste navegador.");
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const filtrarJogadores = jogadores.filter(jogador =>
    jogador.nome.toLowerCase().includes(pesquisaJogador.toLowerCase())
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
                    onClick={() => deletarJogador(jogadorSelecionado._id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                  >
                    <FaTrash className="text-xs sm:text-sm" /> Excluir Jogador
                  </motion.button>
                  {/* Mantido o botão "Salvar Alterações" para o caso de você ter outra lógica em mente para ele,
                      mas se for apenas para fechar o modal, mude o texto e o onClick para:
                      onClick={() => setJogadorSelecionado(null)} */}
                  <motion.button
                    type="button"
                    onClick={() => setJogadorSelecionado(null)} // Este botão agora fecha o modal
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