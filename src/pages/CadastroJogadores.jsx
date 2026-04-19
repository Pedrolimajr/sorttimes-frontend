// src/pages/CadastroJogadores.jsx
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  FaFutbol, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, 
  FaCamera, FaMapMarkerAlt, FaTshirt, FaArrowLeft,
  FaUserPlus
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function CadastroJogadores() {
  const navigate = useNavigate();
  const [jogador, setJogador] = useState({
    nome: "",
    nascimento: "",
    endereco: "",
    telefone: "",
    email: "",
    ingresso: "",
    posicao: "",
    numeroCamisa: "",
    nivel: "Associado",
    foto: null,
    fotoPreview: null
  });

  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const referenciaArquivo = useRef(null);

  const manipularMudanca = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "foto" && files && files[0]) {
      if (files[0].size > 5 * 1024 * 1024) {
        setErros(prev => ({ ...prev, foto: "A imagem deve ter no máximo 5MB" }));
        return;
      }
      
      const leitor = new FileReader();
      leitor.onloadend = () => {
        setJogador(prev => ({
          ...prev,
          foto: files[0],
          fotoPreview: leitor.result
        }));
        if (erros.foto) {
          setErros(prev => {
            const novosErros = { ...prev };
            delete novosErros.foto;
            return novosErros;
          });
        }
      };
      leitor.readAsDataURL(files[0]);
    } else {
      setJogador(prev => ({
        ...prev,
        [name]: value
      }));
      if (erros[name]) {
        setErros(prev => {
          const novosErros = { ...prev };
          delete novosErros[name];
          return novosErros;
        });
      }
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    // Validação do nome (obrigatório)
    if (!jogador.nome.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }

    // Validação da posição (obrigatória)
    if (!jogador.posicao) {
      novosErros.posicao = "Posição é obrigatória";
    }

    // Validação do nível (obrigatório)
    if (!jogador.nivel) {
      novosErros.nivel = "Nível é obrigatório";
    }

    // Se houver email, valida o formato
    if (jogador.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(jogador.email)) {
      novosErros.email = "Formato de email inválido";
    }

    // Se houver telefone, valida o formato
    if (jogador.telefone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(jogador.telefone)) {
      novosErros.telefone = "Formato de telefone inválido";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const manipularEnvio = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setEnviando(true);
    
    try {
      const formData = new FormData();
      formData.append('nome', jogador.nome);
      formData.append('posicao', jogador.posicao);
      formData.append('nivel', jogador.nivel);
      
      // Adiciona os campos opcionais apenas se tiverem valor
      if (jogador.nascimento) {
        const nascimento = new Date(jogador.nascimento + 'T12:00:00');
        formData.append('dataNascimento', nascimento.toISOString());
      }
      if (jogador.ingresso) {
        const ingresso = new Date(jogador.ingresso + 'T12:00:00');
        formData.append('dataIngresso', ingresso.toISOString());
      }
      if (jogador.endereco) formData.append('endereco', jogador.endereco);
      if (jogador.telefone) formData.append('telefone', jogador.telefone);
      if (jogador.email) formData.append('email', jogador.email);
      if (jogador.numeroCamisa) formData.append('numeroCamisa', jogador.numeroCamisa);
      if (jogador.foto) formData.append('foto', jogador.foto);

      // Verificar se há token. Se não houver, solicitar login para evitar 401 remoto.
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Faça login antes de cadastrar jogadores');
        setEnviando(false);
        return;
      }

      // Usar axios (`api`) para garantir que o token seja enviado automaticamente pelo interceptor
      const response = await api.post('/jogadores', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data?.data || response.data;
      toast.success('Jogador cadastrado com sucesso!');
      
      navigate('/lista-jogadores', {
        state: {
          novoJogador: data,
          mensagem: `Jogador ${data.nome} cadastrado com sucesso!`
        }
      });
      
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      toast.error(erro.message || 'Erro ao cadastrar jogador');
    } finally {
      setEnviando(false);
    }
  };

  const formatarTelefone = (valor) => {
    valor = valor.replace(/\D/g, '');
    if (valor.length > 0) {
      valor = `(${valor.substring(0, 2)}${valor.length > 2 ? ') ' + valor.substring(2, 7) : ''}${valor.length > 7 ? '-' + valor.substring(7, 11) : ''}`;
    }
    return valor;
  };

  const manipularMudancaTelefone = (e) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setJogador(prev => ({
      ...prev,
      telefone: valorFormatado
    }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Aurora Background Effects - Inspirado no Dashboard */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10 relative pt-16 sm:pt-0">
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(15, 23, 42, 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-0 -top-2 sm:top-2 w-12 h-12 flex items-center justify-center bg-slate-900/50 text-gray-200 rounded-2xl transition-all duration-300 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-blue-500/10"
            title="Voltar para o Dashboard"
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
          </motion.button>
          
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1 flex items-center justify-center gap-3">
            <FaUserPlus className="text-blue-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              Novo Jogador
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"
          >
            Painel de Recrutamento
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={manipularEnvio}
          className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative overflow-hidden"
        >
          {/* Decoração sutil no topo do card */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

          {/* Campo Nome Completo */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Nome do Atleta
            </label>
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                name="nome"
                value={jogador.nome}
                onChange={manipularMudanca}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                placeholder="Nome completo"
              />
            </div>
            {erros.nome && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.nome}</motion.p>}
          </div>

          {/* Campo Data de Nascimento */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Data de nascimento
            </label>
            <div className="relative group">
              <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="date"
                name="nascimento"
                value={jogador.nascimento}
                onChange={manipularMudanca}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm"
              />
            </div>
            {erros.nascimento && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.nascimento}</motion.p>}
          </div>

          {/* Campo Telefone */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Telefone
            </label>
            <div className="relative group">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="tel"
                name="telefone"
                value={jogador.telefone}
                onChange={manipularMudancaTelefone}
                placeholder="(99) 99999-9999"
                maxLength={15}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
              />
            </div>
            {erros.telefone && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.telefone}</motion.p>}
          </div>

          {/* Campo E-mail */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              E-mail
            </label>
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="email"
                name="email"
                value={jogador.email}
                onChange={manipularMudanca}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                placeholder="email@exemplo.com"
              />
            </div>
            {erros.email && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.email}</motion.p>}
          </div>

          {/* Campo Endereço */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Endereço
            </label>
            <div className="relative group">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                name="endereco"
                value={jogador.endereco}
                onChange={manipularMudanca}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                placeholder="Cidade, Bairro ou Rua"
              />
            </div>
          </div>

          {/* Campo Posição */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Posição
            </label>
            <div className="relative group">
              <FaFutbol className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
              <select
                name="posicao"
                value={jogador.posicao}
                onChange={manipularMudanca}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm appearance-none"
              >
                <option value="" className="bg-slate-900">Selecione</option>
                <option className="bg-slate-900">Goleiro</option>
                <option className="bg-slate-900">Defensor</option>
                <option className="bg-slate-900">Lateral-Esquerdo</option>
                <option className="bg-slate-900">Lateral-Direito</option>
                <option className="bg-slate-900">Volante</option>
                <option className="bg-slate-900">Meia-Direita</option>
                <option className="bg-slate-900">Meia-Esquerda</option>
                <option className="bg-slate-900">Centroavante</option>
              </select>
            </div>
            {erros.posicao && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.posicao}</motion.p>}
          </div>

          {/* Campo Número da Camisa */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Nº Camisa
            </label>
            <div className="relative group">
              <FaTshirt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="number"
                name="numeroCamisa"
                value={jogador.numeroCamisa}
                onChange={manipularMudanca}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                placeholder="00"
              />
            </div>
          </div>

          {/* Campo Nível */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Nível de Cadastro
            </label>
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
              <select
                name="nivel"
                value={jogador.nivel}
                onChange={manipularMudanca}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm appearance-none"
              >
                <option value="Associado" className="bg-slate-900">Associado</option>
                <option value="Convidado" className="bg-slate-900">Convidado</option>
                <option value="Visitante" className="bg-slate-900">Visitante</option>
              </select>
            </div>
          </div>

          {/* Campo Data de Ingresso */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Data de ingresso
            </label>
            <div className="relative group">
              <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="date"
                name="ingresso"
                value={jogador.ingresso}
                onChange={manipularMudanca}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white transition-all text-sm"
              />
            </div>
            {erros.ingresso && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.ingresso}</motion.p>}
          </div>

          {/* Campo Foto do Atleta */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
              Foto do Atleta
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview da foto */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
                {jogador.fotoPreview ? (
                <img 
                  src={jogador.fotoPreview} 
                  alt="Preview" 
                    className="w-full h-full object-cover"
                />
                ) : (
                  <FaCamera className="text-slate-700 text-3xl" />
                )}
              </div>
            
            {/* Input de arquivo */}
              <div className="flex-1 w-full">
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className={`relative overflow-hidden rounded-xl border ${erros.foto ? 'border-red-500/50' : 'border-white/5'} bg-black/40 group transition-all`}
                >
                  <input
                    type="file"
                    name="foto"
                    accept="image/*"
                    onChange={manipularMudanca}
                    ref={referenciaArquivo}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-500 text-xs truncate mr-2">
                      {jogador.foto ? jogador.foto.name : "Toque para selecionar imagem"}
                    </span>
                    <span className="bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shrink-0">
                      Procurar
                    </span>
                  </div>
                </motion.div>
                <p className="text-[9px] text-slate-600 mt-2 ml-1">* Resolução ideal: 500x500px (Máx: 5MB)</p>
              </div>
            </div>
            {erros.foto && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.foto}</motion.p>}
          </div>

          {/* Botão de Cadastro */}
          <div className="col-span-1 md:col-span-2 mt-2 sm:mt-4">
            <motion.button
              type="submit"
              disabled={enviando}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl font-black transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-[0.1em] ${
                enviando
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white shadow-xl"
              }`}
            >
              <motion.span
                animate={enviando ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                transition={enviando ? { duration: 1.5, repeat: Infinity } : {}}
              >
                {enviando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cadastrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaUser className="text-white text-sm sm:text-base" />
                    Cadastrar Jogador
                  </span>
                )}
              </motion.span>
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}