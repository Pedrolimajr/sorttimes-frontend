import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaFilePdf, 
  FaFileImage, 
  FaTable,
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

  const refPlanilha = useRef(null);

  // Carrega planilhas ao montar componente
  useEffect(() => {
    const carregarPlanilhas = async () => {
      setCarregando(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/planilhas`);
        if (!response.ok) throw new Error('Erro ao carregar planilhas');
        const data = await response.json();
        setPlanilhas(data.data || []);
        if (data.data?.length > 0) {
          selecionarPlanilha(data.data[0]);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarPlanilhas();
  }, []);

  // Salvar planilha (POST ou PUT)
  const salvarPlanilha = async () => {
    if (!titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    setCarregando(true);
    try {
      const planilhaData = {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim(),
        tabela,
        dataAtualizacao: new Date().toISOString()
      };

      const url = planilhaAtiva?._id
        ? `${import.meta.env.VITE_API_URL}/api/planilhas/${planilhaAtiva._id}`
        : `${import.meta.env.VITE_API_URL}/api/planilhas`;

      const response = await fetch(url, {
        method: planilhaAtiva?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planilhaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar');
      }

      const { data } = await response.json();

      setPlanilhas(prev => 
        planilhaAtiva?._id 
          ? prev.map(p => p._id === data._id ? data : p)
          : [data, ...prev]
      );
      setPlanilhaAtiva(data);
      toast.success('Salvo com sucesso!');
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setCarregando(false);
    }
  };

  // Manipulação da tabela
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

  // Deletar planilha
  const deletarPlanilha = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta planilha permanentemente?')) return;
    setCarregando(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/planilhas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao excluir`);
      }
      await response.json();
      setPlanilhas(prev => prev.filter(p => p._id !== id));
      if (planilhaAtiva?._id === id) {
        setTitulo('Nova Planilha');
        setSubtitulo('');
        setTabela([['Cabeçalho', 'Valor'], ['', '']]);
        setPlanilhaAtiva(null);
      }
      toast.success('Planilha excluída com sucesso!');
    } catch (error) {
      toast.error(`Falha ao excluir: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  // Criar nova planilha
  const criarNovaPlanilha = () => {
    setTitulo(`Nova Planilha ${planilhas.length + 1}`);
    setSubtitulo('');
    setTabela([['Cabeçalho', 'Valor'], ['', '']]);
    setPlanilhaAtiva(null);
  };

  // Selecionar planilha existente
  const selecionarPlanilha = (planilha) => {
    setTitulo(planilha.titulo);
    setSubtitulo(planilha.subtitulo || '');
    setTabela(planilha.tabela || [['Cabeçalho', 'Valor'], ['', '']]);
    setPlanilhaAtiva(planilha);
  };

  // Voltar para dashboard
  const voltarParaDashboard = () => navigate('/dashboard');

  // Exportar PDF ou Imagem
  const exportarPDF = async () => {
    setCarregando(true);
    try {
      const exportarParaPDF = () => new Promise(async (resolve) => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(titulo, 14, 15);
        if (subtitulo) {
          doc.setFontSize(12);
          doc.text(subtitulo, 14, 22);
        }
        doc.setFontSize(10);
        doc.text(`Exportado em: ${new Date().toLocaleString()}`, 14, 29);

        let y = 40;
        tabela.forEach((linha, i) => {
          linha.forEach((celula, j) => {
            doc.setFontSize(i === 0 ? 12 : 10);
            doc.setTextColor(i === 0 ? '#000000' : '#333333');
            doc.text(celula || '', 14 + (j * 40), y);
          });
          y += 10;
        });
        doc.save(`planilha_${titulo}_${Date.now()}.pdf`);
        resolve();
      });

      const exportarParaImagem = async () => {
        const { toPng } = await import('html-to-image');
        if (refPlanilha.current) {
          const dataUrl = await toPng(refPlanilha.current);
          const link = document.createElement('a');
          link.download = `planilha_${titulo}_${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }
      };

      const tipoExportacao = window.confirm('Clique em OK para exportar como PDF ou Cancelar para exportar como Imagem');
      if (tipoExportacao) {
        await exportarParaPDF();
        toast.success('PDF gerado com sucesso!');
      } else {
        await exportarParaImagem();
        toast.success('Imagem gerada com sucesso!');
      }
    } catch (error) {
      toast.error(`Falha ao exportar: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Efeito partículas */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: Math.random() * 100, y: Math.random() * 100, opacity: 0.3 }}
            animate={{ y: [null, (Math.random() - 0.5) * 50], x: [null, (Math.random() - 0.5) * 50] }}
            transition={{ duration: 15 + Math.random() * 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <header className="mb-6 flex justify-between items-center">
        <button
          onClick={voltarParaDashboard}
          title="Voltar para Dashboard"
          className="btn-primary flex items-center gap-2"
        >
          <RiArrowLeftDoubleLine size={20} />
          Voltar
        </button>

        <div className="flex gap-3">
          <button
            onClick={criarNovaPlanilha}
            title="Nova Planilha"
            className="btn-secondary flex items-center gap-2"
          >
            <FaPlus />
            Nova
          </button>
          <button
            onClick={salvarPlanilha}
            title="Salvar Planilha"
            className="btn-primary flex items-center gap-2"
            disabled={carregando}
          >
            Salvar
          </button>
          {planilhaAtiva && (
            <button
              onClick={() => deletarPlanilha(planilhaAtiva._id)}
              title="Excluir Planilha"
              className="btn-danger flex items-center gap-2"
              disabled={carregando}
            >
              <FaTrash />
              Excluir
            </button>
          )}
          <button
            onClick={exportarPDF}
            title="Exportar PDF / Imagem"
            className="btn-primary flex items-center gap-2"
            disabled={carregando}
          >
            <FaFilePdf />
            Exportar
          </button>
        </div>
      </header>

      <main className="bg-gray-800 rounded-lg p-6 shadow-lg text-white" ref={refPlanilha}>
        {/* Seleção de planilhas */}
        <div className="mb-4 flex flex-wrap gap-2">
          {planilhas.map(p => (
            <button
              key={p._id}
              onClick={() => selecionarPlanilha(p)}
              className={`btn-tab ${planilhaAtiva?._id === p._id ? 'btn-tab-active' : ''}`}
              title={`Selecionar ${p.titulo}`}
            >
              <FaTable className="mr-1" />
              {p.titulo}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <input
          type="text"
          className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
          placeholder="Subtítulo"
          value={subtitulo}
          onChange={(e) => setSubtitulo(e.target.value)}
        />

        <table className="w-full border-collapse border border-gray-600">
          <tbody>
            {tabela.map((linha, linhaIndex) => (
              <tr key={linhaIndex} className={linhaIndex === 0 ? "bg-gray-700 font-bold" : "bg-gray-800"}>
                {linha.map((celula, colunaIndex) => (
                  <td
                    key={colunaIndex}
                    className="border border-gray-600 p-1"
                  >
                    <input
                      type="text"
                      className={`w-full bg-transparent text-white outline-none ${
                        linhaIndex === 0 ? 'font-semibold' : ''
                      }`}
                      value={celula}
                      onChange={e => atualizarCelula(linhaIndex, colunaIndex, e.target.value)}
                    />
                    {/* Botão remover coluna na linha de cabeçalho */}
                    {linhaIndex === 0 && colunaIndex > 0 && (
                      <button
                        onClick={() => removerColuna(colunaIndex)}
                        title="Remover coluna"
                        className="text-red-400 hover:text-red-600 ml-1"
                      >
                        &times;
                      </button>
                    )}
                  </td>
                ))}
                {/* Botão remover linha, não na primeira linha */}
                {linhaIndex > 0 && (
                  <td className="border border-gray-600 p-1 text-center">
                    <button
                      onClick={() => removerLinha(linhaIndex)}
                      title="Remover linha"
                      className="text-red-400 hover:text-red-600"
                    >
                      &times;
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex gap-2">
          <button
            onClick={adicionarLinha}
            className="btn-secondary"
            title="Adicionar linha"
          >
            + Linha
          </button>
          <button
            onClick={adicionarColuna}
            className="btn-secondary"
            title="Adicionar coluna"
          >
            + Coluna
          </button>
        </div>
      </main>
    </div>
  );
}
