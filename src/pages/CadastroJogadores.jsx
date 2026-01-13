import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  FaFutbol, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, 
  FaCamera, FaMapMarkerAlt, FaTshirt, FaArrowLeft 
} from 'react-icons/fa';
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
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

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8 relative pt-16 sm:pt-0"> {/* Aumentado o padding-top para mobile */}
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-4 -top-2 sm:top-4 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>
          
          <div className="flex items-center justify-center gap-3">
            <FaFutbol className="text-blue-400 text-2xl sm:text-3xl" />
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-2"
            >
              Cadastro de Jogadores
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm sm:text-base mt-1 sm:mt-0"
          >
            Preencha os dados do atleta para cadastrar no sistema
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onSubmit={manipularEnvio}
          className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          {/* Campo Nome Completo */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaUser className="text-blue-400 text-sm sm:text-base" />
              Nome completo
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              name="nome"
              value={jogador.nome}
              onChange={manipularMudanca}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.nome ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all text-sm sm:text-base`}
              placeholder="Nome completo do jogador"
            />
            {erros.nome && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.nome}</motion.p>}
          </div>

          {/* Campo Data de Nascimento */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaCalendarAlt className="text-blue-400 text-sm sm:text-base" />
              Data de nascimento
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="date"
              name="nascimento"
              value={jogador.nascimento}
              onChange={manipularMudanca}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.nascimento ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all text-sm sm:text-base`}
            />
            {erros.nascimento && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.nascimento}</motion.p>}
          </div>

          {/* Campo Endereço */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaMapMarkerAlt className="text-blue-400 text-sm sm:text-base" />
              Endereço
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              name="endereco"
              value={jogador.endereco}
              onChange={manipularMudanca}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.endereco ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all text-sm sm:text-base`}
              placeholder="Endereço completo"
            />
            {erros.endereco && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.endereco}</motion.p>}
          </div>

          {/* Campo Telefone */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaPhone className="text-blue-400 text-sm sm:text-base" />
              Telefone
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="tel"
              name="telefone"
              value={jogador.telefone}
              onChange={manipularMudancaTelefone}
              placeholder="(99) 99999-9999"
              maxLength={15}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.telefone ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all text-sm sm:text-base`}
            />
            {erros.telefone && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.telefone}</motion.p>}
          </div>

          {/* Campo E-mail */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaEnvelope className="text-blue-400 text-sm sm:text-base" />
              E-mail
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="email"
              name="email"
              value={jogador.email}
              onChange={manipularMudanca}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.email ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all text-sm sm:text-base`}
              placeholder="email@exemplo.com"
            />
            {erros.email && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.email}</motion.p>}
          </div>

          {/* Campo Data de Ingresso */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaCalendarAlt className="text-blue-400 text-sm sm:text-base" />
              Data de ingresso
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="date"
              name="ingresso"
              value={jogador.ingresso}
              onChange={manipularMudanca}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.ingresso ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all text-sm sm:text-base`}
            />
            {erros.ingresso && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.ingresso}</motion.p>}
          </div>

          {/* Campo Posição */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaFutbol className="text-blue-400 text-sm sm:text-base" />
              Posição
            </label>
            <motion.select
              whileFocus={{ scale: 1.01 }}
              name="posicao"
              value={jogador.posicao}
              onChange={manipularMudanca}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.posicao ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all text-sm sm:text-base`}
            >
              <option value="" className="bg-gray-800">Selecione</option>
              <option className="bg-gray-800">Goleiro</option>
              <option className="bg-gray-800">Defensor</option>
              <option className="bg-gray-800">Lateral-Esquerdo</option>
              <option className="bg-gray-800">Lateral-Direito</option>
              <option className="bg-gray-800">Volante</option>
              <option className="bg-gray-800">Meia-Direita</option>
              <option className="bg-gray-800">Meia-Esquerda</option>
              <option className="bg-gray-800">Centroavante</option>
            </motion.select>
            {erros.posicao && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.posicao}</motion.p>}
          </div>

          {/* Campo Número da Camisa */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaTshirt className="text-blue-400 text-sm sm:text-base" />
              Número da Camisa
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="number"
              name="numeroCamisa"
              value={jogador.numeroCamisa}
              onChange={manipularMudanca}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border ${erros.numeroCamisa ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all text-sm sm:text-base`}
              placeholder="Número da camisa"
            />
            {erros.numeroCamisa && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.numeroCamisa}</motion.p>}
          </div>

          {/* Campo Nível */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaFutbol className="text-blue-400 text-sm sm:text-base" />
              Nível
            </label>
            <motion.select
              whileFocus={{ scale: 1.01 }}
              name="nivel"
              value={jogador.nivel}
              onChange={manipularMudanca}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all text-sm sm:text-base"
            >
              <option value="Associado" className="bg-gray-800">Associado</option>
              <option value="Convidado" className="bg-gray-800">Convidado</option>
              <option value="Visitante" className="bg-gray-800">Visitante</option>
            </motion.select>
          </div>

          {/* Campo Foto do Atleta */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
              <FaCamera className="text-blue-400 text-sm sm:text-base" />
              Foto do atleta
            </label>
            
            {/* Preview da foto */}
            {jogador.fotoPreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-3 sm:mb-4 flex justify-center"
              >
                <img 
                  src={jogador.fotoPreview} 
                  alt="Preview" 
                  className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-full border-2 border-blue-500 shadow-lg"
                />
              </motion.div>
            )}
            
            {/* Input de arquivo */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              className={`relative overflow-hidden rounded-lg border ${erros.foto ? 'border-red-500' : 'border-gray-600'} bg-gray-700`}
            >
              <input
                type="file"
                name="foto"
                accept="image/*"
                onChange={manipularMudanca}
                ref={referenciaArquivo}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center">
                <span className="text-gray-300 text-xs sm:text-sm">
                  {jogador.foto ? jogador.foto.name : "Selecione uma foto"}
                </span>
                <button 
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm transition-colors"
                >
                  Procurar
                </button>
              </div>
            </motion.div>
            {erros.foto && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs sm:text-sm mt-1">{erros.foto}</motion.p>}
          </div>

          {/* Botão de Cadastro */}
          <div className="col-span-1 md:col-span-2 mt-2 sm:mt-4">
            <motion.button
              type="submit"
              disabled={enviando}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-all shadow-lg ${enviando ? 'opacity-80 cursor-not-allowed' : ''} text-sm sm:text-base`}
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
    </div>
  );
}