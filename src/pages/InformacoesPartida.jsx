import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaFilePdf, 
  FaFileImage, 
  FaArrowLeft, 
  FaSave, 
  FaTable,
  FaTimesCircle,
  FaFileDownload
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
export default function InformacoesPartida() {
  const navigate = useNavigate();
  const [planilhas, setPlanilhas] = useState([]);
  const [planilhaAtiva, setPlanilhaAtiva] = useState(null);
  const [titulo, setTitulo] = useState('Nova Planilha');
  const [subtitulo, setSubtitulo] = useState('');
  const [tabela, setTabela] = useState([['Cabeçalho', 'Valor'], ['', '']]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const refPlanilha = useRef(null);

  // Carrega planilhas ao iniciar
  useEffect(() => {
    const carregarPlanilhas = async () => {
      try {
        setCarregando(true);
        const response = await fetch('http://localhost:5000/api/planilhas');
        
        if (!response.ok) throw new Error('Erro ao carregar planilhas');
        
        const data = await response.json();
        setPlanilhas(data.data || []);
        
        if (data.data?.length > 0) {
          selecionarPlanilha(data.data[0]);
        }
      } catch (error) {
        setErro(error.message);
        toast.error(error.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarPlanilhas();
  }, []);

  // Função para salvar planilha
  const salvarPlanilha = async () => {
    try {
      setCarregando(true);
      
      const planilhaData = {
        titulo,
        subtitulo,
        tabela,
        dataAtualizacao: new Date().toISOString()
      };

      if (!titulo.trim()) {
        throw new Error('O título da planilha é obrigatório');
      }

      const url = planilhaAtiva?._id 
        ? `http://localhost:5000/api/planilhas/${planilhaAtiva._id}`
        : 'http://localhost:5000/api/planilhas';

      const method = planilhaAtiva?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planilhaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar planilha');
      }

      const data = await response.json();
      
      if (planilhaAtiva?._id) {
        setPlanilhas(planilhas.map(p => p._id === planilhaAtiva._id ? data.data : p));
      } else {
        setPlanilhas([data.data, ...planilhas]);
      }
      
      setPlanilhaAtiva(data.data);
      toast.success('Planilha salva com sucesso!');
      
    } catch (error) {
      toast.error(error.message);
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

  // Função para deletar planilha (corrigida)
const deletarPlanilha = async (id) => {
  if (!window.confirm('Tem certeza que deseja excluir esta planilha permanentemente?')) {
    return;
  }

  try {
    setCarregando(true);
    console.log(`🔄 Tentando excluir planilha com ID: ${id}`);
    
    const response = await fetch(`http://localhost:5000/api/planilhas/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include' // Se estiver usando autenticação
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🔴 Detalhes do erro:', errorData);
      throw new Error(errorData.message || `Erro ${response.status} ao excluir`);
    }

    const data = await response.json();
    console.log('🟢 Resposta do servidor:', data);

    // Atualização otimizada do estado
    setPlanilhas(prev => prev.filter(p => p._id !== id));
    
    if (planilhaAtiva?._id === id) {
      setTitulo('Nova Planilha');
      setSubtitulo('');
      setTabela([['Cabeçalho', 'Valor'], ['', '']]);
      setPlanilhaAtiva(null);
    }

    toast.success('Planilha excluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro completo:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    toast.error(`Falha ao excluir: ${error.message}`);
  } finally {
    setCarregando(false);
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

  const voltarParaDashboard = () => navigate('/dashboard');

 const exportarPDF = async () => {
  try {
    setCarregando(true);
    
    // Crie um objeto com os dados para exportação
    const dadosParaExportar = {
      titulo,
      subtitulo,
      tabela,
      data: new Date().toLocaleString()
    };

    // Opção 1: Exportar para PDF (usando jsPDF)
    const exportarParaPDF = () => {
      return new Promise((resolve) => {
        // Adia a execução para garantir que o estado de carregamento seja atualizado
        setTimeout(async () => {
          const { jsPDF } = await import('jspdf');
          const doc = new jsPDF();
          
          // Adiciona título
          doc.setFontSize(20);
          doc.text(titulo, 14, 15);
          
          // Adiciona subtítulo se existir
          if (subtitulo) {
            doc.setFontSize(12);
            doc.text(subtitulo, 14, 22);
          }
          
          // Adiciona data
          doc.setFontSize(10);
          doc.text(`Exportado em: ${new Date().toLocaleString()}`, 14, 29);
          
          // Adiciona tabela
          let y = 40;
          tabela.forEach((linha, i) => {
            linha.forEach((celula, j) => {
              doc.setFontSize(i === 0 ? 12 : 10); // Cabeçalho em negrito
              doc.setTextColor(i === 0 ? '#000000' : '#333333');
              doc.text(celula, 14 + (j * 40), y);
            });
            y += 10;
          });
          
          // Salva o PDF
          doc.save(`planilha_${titulo}_${new Date().getTime()}.pdf`);
          resolve();
        }, 100);
      });
    };

    // Opção 2: Exportar para Imagem (usando html-to-image)
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

    // Mostra um diálogo para selecionar o tipo de exportação
    const tipoExportacao = window.confirm('Clique em OK para exportar como PDF ou Cancelar para exportar como Imagem');
    
    if (tipoExportacao) {
      await exportarParaPDF();
      toast.success('PDF gerado com sucesso!');
    } else {
      await exportarParaImagem();
      toast.success('Imagem gerada com sucesso!');
    }

  } catch (error) {
    console.error('Erro ao exportar:', error);
    toast.error(`Falha ao exportar: ${error.message}`);
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
                  Informações das Partidas
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-sm sm:text-base mt-1"
              >
                Gerencie as informações e detalhes das partidas
              </motion.p>
            </div>

            {/* Botões de ação mantidos à direita */}
            <motion.div 
              className="flex gap-3 sm:flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
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
            </motion.div>
          </div>
        </motion.div>

        {/* Resto do conteúdo existente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seção de edição (ocupa 2 colunas em desktop) */}
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
      </div>
    </div>
  );
}