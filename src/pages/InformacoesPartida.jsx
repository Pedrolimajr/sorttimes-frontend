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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/planilhas`);
        
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
    
    // Validação básica
    if (!titulo.trim()) {
      toast.error('Título é obrigatório');
      return setCarregando(false);
    }

    const planilhaData = {
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      tabela,
      dataAtualizacao: new Date().toISOString()
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const url = planilhaAtiva?._id 
      ? `${import.meta.env.VITE_API_URL}/api/planilhas/${planilhaAtiva._id}`
      : `${import.meta.env.VITE_API_URL}/api/planilhas`;

    const response = await fetch(url, {
      method: planilhaAtiva?._id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planilhaData),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao salvar');
    }

    const { data } = await response.json();

    // Atualização otimizada do estado
    setPlanilhas(prev => 
      planilhaAtiva?._id 
        ? prev.map(p => p._id === data._id ? data : p)
        : [data, ...prev]
    );
    
    setPlanilhaAtiva(data);
    toast.success('Salvo com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
    toast.error(
      error.name === 'AbortError' 
        ? 'Tempo limite excedido' 
        : error.message || 'Erro ao salvar'
    );
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
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/planilhas/${id}`, {
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
    <div className="min-h-screen bg-[#111827] px-4 py-8 sm:px-6 lg:px-8">
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
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-8">
          <motion.button 
            onClick={voltarParaDashboard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <RiArrowLeftDoubleLine className="text-2xl" />
            <span className="hidden sm:inline">Voltar</span>
          </motion.button>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={criarNovaPlanilha}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg"
            >
              <FaPlus /> Nova Planilha
            </motion.button>
            
            <motion.button
              onClick={salvarPlanilha}
              disabled={carregando}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave /> {carregando ? 'Salvando...' : 'Salvar'}
            </motion.button>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de planilhas (1 coluna em desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-gray-700/50 h-[calc(100vh-12rem)]">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                <FaTable /> Planilhas
              </h2>
              
              {planilhas.length === 0 ? (
                <div className="text-center py-8">
                  <FaTable className="mx-auto text-gray-600 text-4xl mb-3" />
                  <p className="text-gray-400">Nenhuma planilha cadastrada</p>
                </div>
              ) : (
                <div className="overflow-y-auto h-[calc(100%-3rem)] space-y-3 pr-2">
                  {planilhas.map((planilha) => (
                    <motion.div 
                      key={planilha._id}
                      onClick={() => selecionarPlanilha(planilha)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 border rounded-lg cursor-pointer transition-all relative group ${
                        planilhaAtiva?._id === planilha._id 
                          ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/20' 
                          : 'border-gray-600/50 hover:bg-gray-700/30 hover:border-gray-500'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletarPlanilha(planilha._id);
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Excluir planilha"
                      >
                        <FaTrash />
                      </button>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-700/50 p-2 rounded-lg">
                          <FaTable className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{planilha.titulo}</h3>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                            {new Date(planilha.dataAtualizacao).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Área da planilha (3 colunas em desktop) */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700/50 h-[calc(100vh-12rem)] flex flex-col">
              {/* Barra de ferramentas */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={adicionarLinha}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm"
                  >
                    <FaPlus size={12} /> Linha
                  </button>
                  
                  <button
                    onClick={adicionarColuna}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm"
                  >
                    <FaPlus size={12} /> Coluna
                  </button>
                </div>

                <button
                  onClick={exportarPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm"
                >
                  <FaFilePdf /> Exportar
                </button>
              </div>

              {/* Tabela editável com scroll */}
              <div className="flex-1 overflow-auto rounded-lg border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                <table className="min-w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-700/50">
                      {tabela[0].map((cabecalho, colIndex) => (
                        <th 
                          key={colIndex} 
                          className="p-3 border border-gray-600/50 sticky top-0 bg-gray-700/50 min-w-[150px] text-center backdrop-blur-sm"
                        >
                          <div className="flex flex-col items-center">
                            <input
                              value={cabecalho}
                              onChange={(e) => atualizarCelula(0, colIndex, e.target.value)}
                              className="w-full bg-transparent font-bold text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1.5 rounded"
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
                    </tr>
                  </thead>
                  <tbody>
                    {tabela.slice(1).map((linha, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className={`${
                          rowIndex % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'
                        } hover:bg-gray-700/30 transition-colors`}
                      >
                        {linha.map((celula, colIndex) => (
                          <td key={colIndex} className="border border-gray-600/50 p-0 text-center">
                            <input
                              value={celula}
                              onChange={(e) => atualizarCelula(rowIndex + 1, colIndex, e.target.value)}
                              className="w-full h-full bg-transparent text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 rounded"
                              style={{ minWidth: '100px' }}
                              placeholder="Digite aqui..."
                            />
                          </td>
                        ))}
                        <td className="border border-gray-600/50 w-12 text-center">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}