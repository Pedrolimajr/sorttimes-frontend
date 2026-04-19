import { useState } from "react";
import { FaEye, FaEyeSlash, FaSignInAlt, FaKey, FaEnvelope, FaLock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import { RiArrowLeftDoubleLine } from "react-icons/ri";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const fazerLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      // NÃO limpe o localStorage aqui!
    // localStorage.clear();
      
      const response = await authService.login(email, senha);

      // Atualiza contexto de autenticação com o usuário logado
      if (response?.user) {
        login(response.user);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  const voltarParaHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos de luz de fundo (Glow) para profundidade */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[140px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[140px]" />
      </div>

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
          className="mb-8 w-12 h-12 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/50 text-gray-200 rounded-2xl transition-all duration-300 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-blue-500/10"
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
          transition={{ type: "spring", damping: 20 }}
        >
          <form 
            onSubmit={fazerLogin} 
            className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/10 space-y-8 relative overflow-hidden"
          >
            {/* Decoração sutil no topo do card */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <motion.div 
                  whileHover={{ rotate: -5, scale: 1.1 }}
                  className="w-28 h-28 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl p-2 bg-slate-950/80"
                >
                  <img src="/img/logo_time.png" alt="Logo SortTimes" className="w-full h-full object-contain" />
                </motion.div>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-1">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  SortTimes
                </span>
              </h1>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <FaKey className="text-yellow-400 text-xs xs:text-sm" /> Acesse sua conta
              </h2>
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label htmlFor="senha" className="block text-xs font-black text-slate-500 uppercase tracking-widest">Senha</label>
                <Link 
                  to="/recuperar-senha" 
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                  placeholder="Sua senha secreta"
                  required
                />
                <motion.button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {mostrarSenha ? 
                    <FaEyeSlash className="w-3 h-3 xs:w-4 xs:h-4" /> : 
                    <FaEye className="w-3 h-3 xs:w-4 xs:h-4" />
                  }
                </motion.button>
              </div>
            </div>

            {/* Exibição de erros */}
            {erro ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between"
              >
                <p className="text-red-400 text-xs font-bold leading-tight">{erro}</p>
                <button 
                  type="button"
                  onClick={() => setErro("")}
                  className="text-red-400 hover:text-red-300 text-lg font-bold px-2"
                >
                  ×
                </button>
              </motion.div>
            ) : null}

            {/* Botão de Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregando}
              className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-[0.1em] ${
                carregando
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white shadow-xl"
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
            <div className="text-center pt-4 border-t border-white/5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                Não tem uma conta?{" "}
              <Link
                to="/cadastro"
                  className="text-blue-400 hover:text-blue-300 transition-colors ml-1 underline underline-offset-4"
              >
                Cadastre-se
              </Link>
              </p>
            </div>
          </form>
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
    </div>
  );
}