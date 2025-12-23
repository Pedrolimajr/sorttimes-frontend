import { useState } from "react";
import { motion } from "framer-motion";
import { FaKey, FaEnvelope } from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function ConfiguracoesConta() {
  const [novoEmail, setNovoEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const atualizarEmail = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      console.log('Enviando dados:', { novoEmail, senha });
      
      const result = await authService.atualizarEmail(novoEmail, senha);

      // Mantém o contexto e o localStorage sincronizados com o novo email
      if (result?.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        login(result.user);
      }

      toast.success('Email atualizado com sucesso!');
      setNovoEmail('');
      setSenha('');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar email');
    } finally {
      setCarregando(false);
    }
  };

  const atualizarSenha = async (e) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarNovaSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    setCarregando(true);

    try {
      await authService.atualizarSenha(senhaAtual, novaSenha);

      // authService.atualizarSenha já faz logout (limpa localStorage),
      // aqui garantimos que o contexto também seja limpo e forçamos novo login.
      logout();
      toast.success("Senha atualizada com sucesso! Faça login novamente.");

      navigate("/login");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho com botão voltar */}
        <div className="mb-8 sm:mb-12">
          <motion.button 
            type="button"
            onClick={() => navigate("/dashboard")}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="mb-4 mt-5 sm:mt-12 w-10 h-10 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaKey className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              >
                Configurações da Conta
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base"
            >
              Gerencie suas informações de email e senha
            </motion.p>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Formulário de Email */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={atualizarEmail} 
            className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300"
          >
            <h2 className="text-xl sm:text-2xl text-white mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <FaEnvelope className="text-blue-400 text-xl sm:text-2xl" />
              </div>
              Atualizar Email
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-gray-300 text-sm font-medium">Novo Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-lg p-3 pl-10 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                    required
                  />
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-gray-300 text-sm font-medium">Confirme sua Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-lg p-3 pl-10 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                    required
                  />
                  <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={carregando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 rounded-lg font-medium shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Atualizando...</span>
                  </>
                ) : (
                  "Atualizar Email"
                )}
              </motion.button>
            </div>
          </motion.form>

          {/* Seção de segurança / sair da conta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-red-500/30 hover:border-red-500/60 transition-all duration-300"
          >
            <h2 className="text-xl sm:text-2xl text-white mb-4 flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <FaKey className="text-red-400 text-xl sm:text-2xl" />
              </div>
              Segurança da Conta
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Se estiver usando este dispositivo em ambiente compartilhado, recomendamos encerrar sua sessão após o uso.
            </p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white py-3 rounded-lg font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              Sair da conta
            </motion.button>
          </motion.div>

          {/* Formulário de Senha */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={atualizarSenha} 
            className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300"
          >
            <h2 className="text-xl sm:text-2xl text-white mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <FaKey className="text-blue-400 text-xl sm:text-2xl" />
              </div>
              Atualizar Senha
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-gray-300 text-sm font-medium">Senha Atual</label>
                <div className="relative">
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-lg p-3 pl-10 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                    required
                  />
                  <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-gray-300 text-sm font-medium">Nova Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-lg p-3 pl-10 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                    required
                  />
                  <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-300 text-sm font-medium">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-lg p-3 pl-10 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                    required
                  />
                  <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={carregando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 rounded-lg font-medium shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Atualizando...</span>
                  </>
                ) : (
                  "Atualizar Senha"
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}