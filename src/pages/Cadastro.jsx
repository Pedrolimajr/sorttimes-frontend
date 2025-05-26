import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaUserPlus } from "react-icons/fa";
import { authService } from "../services/authService";

export default function Cadastro() {
  // Estados para armazenar os dados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  
  // Estados para controle da UI
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  
  // Hook para navegação entre rotas
  const navegar = useNavigate();

  const manipularEnvio = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    
    try {
      if (senha !== confirmarSenha) {
        throw new Error("As senhas não coincidem");
      }

      const dadosCadastro = {
        nome,
        email,
        senha
      };

      await authService.cadastrar(dadosCadastro);
      navegar("/dashboard");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const voltarParaHome = () => {
    navegar("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-3 xs:p-4 sm:p-6 relative">
      {/* Efeito de partículas de fundo */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100, 
              y: Math.random() * 100, 
              opacity: 0.3 
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 50], 
              x: [null, (Math.random() - 0.5) * 50] 
            }}
            transition={{ 
              duration: 15 + Math.random() * 20, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
          />
        ))}
      </div>

      {/* Container principal - ajustado para diferentes tamanhos de tela */}
      <div className="w-full max-w-xs xs:max-w-sm sm:max-w-md mx-2">
        {/* Botão Voltar - ajustes de tamanho para mobile */}
        <motion.button
          onClick={voltarParaHome}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          className="mb-3 xs:mb-4 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 xs:px-4 xs:py-2 rounded-lg transition-all shadow-md text-xs xs:text-sm sm:text-base"
        >
          <FaArrowLeft className="text-xs xs:text-sm" /> Voltar
        </motion.button>

        {/* Formulário de cadastro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form 
            onSubmit={manipularEnvio} 
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-700 space-y-4 xs:space-y-5 sm:space-y-6"
          >
            {/* Cabeçalho dentro do formulário */}
            <div className="text-center mb-4 xs:mb-5 sm:mb-6">
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-1 xs:p-1.5 sm:p-2 rounded-lg shadow-lg">
                  <img 
                    src="/src/img/logo_time.png" 
                    alt="Logo" 
                    className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                  />
                </div>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mb-1 xs:mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  SortTimes
                </span>
              </h1>
              <h2 className="text-xs xs:text-sm sm:text-lg text-gray-400 flex items-center justify-center gap-1 xs:gap-2">
                <FaUserPlus className="text-yellow-400 text-xs xs:text-sm" /> Crie sua conta
              </h2>
            </div>

            {/* Campo Nome Completo */}
            <div>
              <label htmlFor="nome" className="block text-xs xs:text-sm font-medium text-gray-400 mb-1 xs:mb-2">
                Nome completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-500 text-xs xs:text-sm" />
                </div>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm sm:text-base"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-gray-400 mb-1 xs:mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-500 text-xs xs:text-sm" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm sm:text-base"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="block text-xs xs:text-sm font-medium text-gray-400 mb-1 xs:mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500 text-xs xs:text-sm" />
                </div>
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-9 xs:pl-10 pr-8 xs:pr-10 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm sm:text-base"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                <motion.button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-2 xs:right-3 top-2 xs:top-3 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {mostrarSenha ? 
                    <FaEyeSlash className="w-3 h-3 xs:w-4 xs:h-4" /> : 
                    <FaEye className="w-3 h-3 xs:w-4 xs:h-4" />
                  }
                </motion.button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" className="block text-xs xs:text-sm font-medium text-gray-400 mb-1 xs:mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500 text-xs xs:text-sm" />
                </div>
                <input
                  id="confirmarSenha"
                  type={mostrarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full pl-9 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm sm:text-base"
                  placeholder="Digite novamente"
                  required
                />
              </div>
            </div>

            {/* Exibição de erros */}
            <AnimatePresence>
              {erro && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs xs:text-sm text-red-300 bg-red-900/30 p-2 xs:p-3 rounded-md border border-red-800"
                >
                  {erro}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão de Cadastro */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregando}
              className={`w-full py-2 xs:py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1 xs:gap-2 text-xs xs:text-sm sm:text-base ${
                carregando
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
              }`}
            >
              {carregando ? (
                <span className="inline-block h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <FaUserPlus className="text-xs xs:text-sm" /> Cadastrar
                </>
              )}
            </motion.button>

            {/* Link para login */}
            <div className="text-center text-xs xs:text-sm text-gray-400 pt-2 xs:pt-3 sm:pt-4 border-t border-gray-700">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Faça login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}