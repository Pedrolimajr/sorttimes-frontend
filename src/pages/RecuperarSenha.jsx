import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey } from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";

export default function RecuperarSenha() {
  // Estados do componente
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const navegar = useNavigate();

  const enviarRecuperacao = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem("");
    
    try {
      await new Promise(resolver => setTimeout(resolver, 1500));
      setMensagem("Um link de recuperação foi enviado para seu e-mail!");
    } catch (erro) {
      setMensagem("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-3 xs:p-4 sm:p-6">
      {/* Efeito de partículas de fundo */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ x: Math.random() * 100, y: Math.random() * 100, opacity: 0.3 }}
            animate={{ y: [null, (Math.random() - 0.5) * 50], x: [null, (Math.random() - 0.5) * 50] }}
            transition={{ duration: 15 + Math.random() * 20, repeat: Infinity, repeatType: "reverse" }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Container principal com breakpoints específicos */}
      <div className="w-full max-w-xs xs:max-w-sm sm:max-w-md mx-2">
        {/* Botão Voltar com tamanhos responsivos */}
        <motion.button 
          onClick={() => navegar(-1)}
          whileHover={{ 
            scale: 1.05,
            x: -5,
            backgroundColor: "rgba(37, 99, 235, 0.1)"
          }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-50 top-20 sm:top-20 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
          title="Voltar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
          <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
        </motion.button>

        {/* Card do formulário com paddings responsivos */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden p-4 xs:p-5 sm:p-6">
          {/* Conteúdo central */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cabeçalho com tamanhos responsivos */}
            <div className="text-center mb-4 xs:mb-5 sm:mb-6">
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-1 xs:p-1.5 sm:p-2 rounded-lg shadow-lg">
                  <img 
                    src="/src/img/logo_time.png" 
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
                <FaKey className="text-yellow-400 text-xs xs:text-sm" />
                Recupere sua senha
              </h2>
            </div>

            {/* Formulário de recuperação */}
            <form onSubmit={enviarRecuperacao} className="space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Campo Email com estilos responsivos */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-gray-400 mb-1 xs:mb-2">
                  Email cadastrado
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
                    className="w-full pl-9 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs xs:text-sm"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </motion.div>

              {/* Mensagem de feedback responsiva */}
              <AnimatePresence>
                {mensagem && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`overflow-hidden text-xs xs:text-sm p-2 xs:p-3 rounded-md ${
                      mensagem.includes("Erro") 
                        ? "text-red-300 bg-red-900/30 border border-red-800"
                        : "text-green-300 bg-green-900/30 border border-green-800"
                    }`}
                  >
                    {mensagem}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão de envio responsivo */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={carregando}
                // Atualizado o background para usar as cores da logo (azul para ciano)
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-medium py-2 xs:py-3 px-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-1 xs:gap-2 text-xs xs:text-sm"
              >
                {carregando ? (
                  <span className="inline-block h-3 w-3 xs:h-4 xs:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <FaEnvelope className="text-xs xs:text-sm" />
                    Enviar Link
                  </>
                )}
              </motion.button>

              {/* Link para página de login responsivo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-xs xs:text-sm text-gray-400 pt-3 xs:pt-4 border-t border-gray-700"
              >
                Lembrou sua senha?{" "}
                <Link 
                  to="/login" 
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
                >
                  Faça login
                </Link>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}