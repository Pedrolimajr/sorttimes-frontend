import { useState } from "react";
import { motion } from "framer-motion";
import { FaKey, FaEnvelope } from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { toast, ToastContainer } from "react-toastify";
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
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative pt-16 sm:pt-0 text-center"
        >
          <motion.button
            type="button"
            onClick={() => navigate("/dashboard")}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(15, 23, 42, 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-0 -top-2 sm:top-2 w-12 h-12 flex items-center justify-center bg-slate-900/50 text-gray-200 rounded-2xl transition-all duration-300 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-blue-500/10"
            title="Voltar para Dashboard"
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-xl transform transition-transform group-hover:translate-x-1" />
          </motion.button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaKey className="text-blue-400 text-2xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1 flex items-center justify-center gap-3"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  Configurações
                </span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]"
            >
              Gerenciamento de Perfil
            </motion.p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Formulário de Email */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={atualizarEmail} 
            className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
            
            <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
              <FaEnvelope className="text-blue-400" />
              Atualizar Email
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Novo Email</label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                    placeholder="novo@email.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha Atual</label>
                <div className="relative group">
                  <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                    placeholder="Sua senha secreta"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={carregando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white rounded-xl font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
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
            className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-red-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
            
            <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-4 flex items-center gap-3">
              <FaKey className="text-red-400" />
              Sessão
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Para sua segurança, encerre sua sessão ao utilizar dispositivos compartilhados.
            </p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 transform active:scale-95 transition-all w-full flex items-center justify-center gap-2"
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
            className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
              <FaKey className="text-cyan-400" />
              Atualizar Senha
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha Atual</label>
                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                    placeholder="Senha antiga"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nova Senha</label>
                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirmar Nova Senha</label>
                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 transition-all text-sm"
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={carregando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 via-blue-500 to-blue-600 hover:shadow-cyan-500/25 text-white rounded-xl font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
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