import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaSignInAlt, FaKey } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const fazerLogin = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!email || !senha) {
      setErro("Email e senha são obrigatórios");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const result = await login({ email, senha });
      
      if (!result.success) {
        setErro(result.error || "Erro ao fazer login");
        toast.error(result.error || "Erro ao fazer login");
        return;
      }

      // Redireciona para a página que tentava acessar ou para o dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
      
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      setErro(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCarregando(false);
    }
  };

  const voltarParaHome = () => {
    navigate("/");
  };

  return (
    <div className="h-full bg-gray-900 flex items-center justify-center p-3 xs:p-4 sm:p-6 relative">
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

      {/* Container principal com breakpoints específicos */}
      <div className="w-full max-w-xs xs:max-w-sm sm:max-w-md mx-2 relative">
        {/* Botão Voltar - Agora fora do form */}
        <motion.button 
          type="button"
          onClick={voltarParaHome}
          whileHover={{ 
            scale: 1.05,
            x: -5,
            backgroundColor: "rgba(37, 99, 235, 0.1)"
          }}
          whileTap={{ scale: 0.95 }}
          className="mb-6 w-10 h-10 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
          title="Voltar para Home"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <RiArrowLeftDoubleLine className="text-blue-400 text-xl transform transition-transform group-hover:translate-x-1" />
          <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form 
            onSubmit={fazerLogin} 
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-700 space-y-4 xs:space-y-5 sm:space-y-6"
          >
            {/* Cabeçalho dentro do formulário */}
            <div className="text-center mb-4 xs:mb-5 sm:mb-6">
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-1 xs:p-1.5 sm:p-2 rounded-lg shadow-lg">
                  <img 
                    src="/img/logo_time.png" 
                    alt="Logo" 
                    className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 object-contain"
                  />
                </div>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mb-1 xs:mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  SortTimes
                </span>
              </h1>
              <h2 className="text-xs xs:text-sm sm:text-lg text-gray-400 flex items-center justify-center gap-1 xs:gap-2">
                <FaKey className="text-yellow-400 text-xs xs:text-sm" /> Acesse sua conta
              </h2>
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-gray-400 mb-1 xs:mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm"
                placeholder="Digite seu email"
                required
                disabled={carregando}
              />
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex justify-between items-center mb-1 xs:mb-2">
                <label htmlFor="senha" className="block text-xs xs:text-sm font-medium text-gray-400">
                  Senha
                </label>
                <Link 
                  to="/recuperar-senha" 
                  className="text-xs xs:text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 xs:px-4 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 xs:pr-12 text-xs xs:text-sm"
                  placeholder="Digite sua senha"
                  required
                  disabled={carregando}
                />
                <motion.button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-2 xs:right-3 top-2 xs:top-3 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={carregando}
                >
                  {mostrarSenha ? 
                    <FaEyeSlash className="w-3 h-3 xs:w-4 xs:h-4" /> : 
                    <FaEye className="w-3 h-3 xs:w-4 xs:h-4" />
                  }
                </motion.button>
              </div>
            </div>

            {/* Exibição de erros */}
            <AnimatePresence>
              {erro && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-red-400 text-sm font-medium">
                        {erro}
                      </p>
                      <button 
                        type="button"
                        onClick={() => setErro("")}
                        className="ml-3 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <span className="text-xl">×</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão de Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregando}
              className={`w-full py-2 xs:py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1 xs:gap-2 text-xs xs:text-sm ${
                carregando
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
              }`}
            >
              {carregando ? (
                <span className="inline-block h-3 w-3 xs:h-4 xs:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <FaSignInAlt className="text-xs xs:text-sm" /> Entrar
                </>
              )}
            </motion.button>

            {/* Link para cadastro */}
            <div className="text-center text-xs xs:text-sm text-gray-400 pt-2 xs:pt-3 sm:pt-4 border-t border-gray-700">
              Não tem uma conta?{" "}
              <Link
                to="/cadastro"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Cadastre-se
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}