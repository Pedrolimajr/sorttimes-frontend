import { useEffect, useRef, useState } from "react";
import {
  FaFilePdf,
  FaPlus,
  FaTable,
  FaTrash
} from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import axios from "axios";

export default function Planilhas({ voltarParaDashboard }) {
  const [planilhas, setPlanilhas] = useState([]);
  const [planilhaAtiva, setPlanilhaAtiva] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [tabela, setTabela] = useState([["", "", ""]]);
  const [carregando, setCarregando] = useState(false);
  const refPlanilha = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const carregar = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/planilhas`);
        setPlanilhas(data);
        if (data.length > 0) selecionarPlanilha(data[0]);
      } catch (err) {
        toast.error("Erro ao carregar planilhas.");
        console.error(err);
      }
    };
    carregar();
  }, []);

  const selecionarPlanilha = (planilha) => {
    setPlanilhaAtiva(planilha);
    setTitulo(planilha.titulo);
    setSubtitulo(planilha.subtitulo);
    setTabela(planilha.tabela);
  };

  const atualizarCelula = (linha, coluna, valor) => {
    const novaTabela = [...tabela];
    novaTabela[linha][coluna] = valor;
    setTabela(novaTabela);
  };

  const adicionarLinha = () => {
    const novaLinha = new Array(tabela[0].length).fill("");
    setTabela([...tabela, novaLinha]);
  };

  const adicionarColuna = () => {
    const novaTabela = tabela.map(linha => [...linha, ""]);
    setTabela(novaTabela);
  };

  const removerLinha = (index) => {
    if (tabela.length <= 1) return;
    setTabela(tabela.filter((_, i) => i !== index));
  };

  const removerColuna = (index) => {
    if (tabela[0].length <= 1) return;
    const novaTabela = tabela.map(linha =>
      linha.filter((_, i) => i !== index)
    );
    setTabela(novaTabela);
  };

  const salvarPlanilha = async () => {
    if (!titulo.trim()) {
      toast.warning("Dê um título à planilha!");
      return;
    }

    setCarregando(true);
    try {
      const novaPlanilha = {
        titulo,
        subtitulo,
        tabela
      };

      if (planilhaAtiva?._id) {
        const { data } = await axios.put(
          `${API_URL}/planilhas/${planilhaAtiva._id}`,
          novaPlanilha
        );
        const atualizadas = planilhas.map(p =>
          p._id === data._id ? data : p
        );
        setPlanilhas(atualizadas);
        setPlanilhaAtiva(data);
        toast.success("Planilha atualizada com sucesso!");
      } else {
        const { data } = await axios.post(`${API_URL}/planilhas`, novaPlanilha);
        setPlanilhas([...planilhas, data]);
        setPlanilhaAtiva(data);
        toast.success("Planilha criada com sucesso!");
      }
    } catch (err) {
      toast.error("Erro ao salvar planilha.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const criarNovaPlanilha = () => {
    setTitulo("");
    setSubtitulo("");
    setTabela([["", "", ""]]);
    setPlanilhaAtiva(null);
  };

  const deletarPlanilha = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta planilha?")) return;

    setCarregando(true);
    try {
      await axios.delete(`${API_URL}/planilhas/${id}`);
      const novas = planilhas.filter(p => p._id !== id);
      setPlanilhas(novas);
      setPlanilhaAtiva(null);
      criarNovaPlanilha();
      toast.success("Planilha excluída.");
    } catch (err) {
      toast.error("Erro ao excluir planilha.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const exportarPDF = async () => {
    const element = refPlanilha.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const width = pageWidth - 20;
    const height = width / ratio;

    pdf.addImage(imgData, "PNG", 10, 10, width, height);
    pdf.save(`${titulo || "planilha"}.pdf`);
  };

  return (
    <div className="p-4">
      <header className="mb-6 flex justify-between items-center">
        <button onClick={voltarParaDashboard} className="btn-primary flex items-center gap-2" title="Voltar para Dashboard">
          <RiArrowLeftDoubleLine size={20} />
          Voltar
        </button>

        <div className="flex gap-3">
          <button onClick={criarNovaPlanilha} className="btn-secondary flex items-center gap-2" title="Nova Planilha">
            <FaPlus />
            Nova
          </button>
          <button onClick={salvarPlanilha} className="btn-primary flex items-center gap-2" disabled={carregando} title="Salvar Planilha">
            Salvar
          </button>
          {planilhaAtiva && (
            <button onClick={() => deletarPlanilha(planilhaAtiva._id)} className="btn-danger flex items-center gap-2" disabled={carregando} title="Excluir Planilha">
              <FaTrash />
              Excluir
            </button>
          )}
          <button onClick={exportarPDF} className="btn-primary flex items-center gap-2" disabled={carregando} title="Exportar PDF">
            <FaFilePdf />
            Exportar
          </button>
        </div>
      </header>

      <main className="bg-gray-800 rounded-lg p-6 shadow-lg text-white" ref={refPlanilha}>
        <div className="mb-4 flex flex-wrap gap-2">
          {planilhas.map(p => (
            <button
              key={p._id}
              onClick={() => selecionarPlanilha(p)}
              className={`btn-tab ${planilhaAtiva?._id === p._id ? "btn-tab-active" : ""}`}
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
          onChange={e => setTitulo(e.target.value)}
        />
        <input
          type="text"
          className="w-full mb-4 p-2 rounded bg-gray-700 text-white"
          placeholder="Subtítulo"
          value={subtitulo}
          onChange={e => setSubtitulo(e.target.value)}
        />

        <table className="w-full border-collapse border border-gray-600">
          <tbody>
            {tabela.map((linha, linhaIndex) => (
              <tr key={linhaIndex} className={linhaIndex === 0 ? "bg-gray-700 font-bold" : "bg-gray-800"}>
                {linha.map((celula, colunaIndex) => (
                  <td key={colunaIndex} className="border border-gray-600 p-1">
                    <input
                      type="text"
                      className={`w-full bg-transparent text-white outline-none ${linhaIndex === 0 ? "font-semibold" : ""}`}
                      value={celula}
                      onChange={e => atualizarCelula(linhaIndex, colunaIndex, e.target.value)}
                    />
                    {linhaIndex === 0 && colunaIndex > 0 && (
                      <button
                        onClick={() => removerColuna(colunaIndex)}
                        className="text-red-400 hover:text-red-600 ml-1"
                        title="Remover coluna"
                      >
                        &times;
                      </button>
                    )}
                  </td>
                ))}
                {linhaIndex > 0 && (
                  <td className="border border-gray-600 p-1 text-center">
                    <button
                      onClick={() => removerLinha(linhaIndex)}
                      className="text-red-400 hover:text-red-600"
                      title="Remover linha"
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
          <button onClick={adicionarLinha} className="btn-secondary" title="Adicionar linha">
            + Linha
          </button>
          <button onClick={adicionarColuna} className="btn-secondary" title="Adicionar coluna">
            + Coluna
          </button>
        </div>
      </main>
    </div>
  );
}
