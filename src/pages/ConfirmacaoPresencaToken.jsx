import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaCheckCircle, FaTimesCircle, FaSpinner, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function ConfirmacaoPresencaToken() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [jogador, setJogador] = useState(null);
  const [linkId, setLinkId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setErro('Token de convite não encontrado.');
        setCarregando(false);
        return;
      }

      try {
        const response = await api.get(`/validar-convite/${token}`);
        if (response.data.success) {
          setJogador(response.data.data.jogador);
          setLinkId(response.data.data.linkId);
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        setErro(error.response?.data?.message || 'Convite inválido ou expirado.');
      } finally {
        setCarregando(false);
      }
    };

    validarToken();
  }, [token]);

  const handleConfirmarPresenca = async (presente) => {
    if (!linkId || !token) return;

    setProcessando(true);
    try {
      await api.post(`/presenca/${linkId}/confirmar`, {
        presente,
        token, // Envia o token para autenticação no backend
      });
      setJogador({ ...jogador, presente });
      toast.success(`Presença ${presente ? 'confirmada' : 'desmarcada'} com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao registrar presença.');
    } finally {
      setProcessando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
        <FaTimesCircle className="text-5xl text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-gray-400">{erro}</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-blue-600 px-4 py-2 rounded-lg">Voltar ao Início</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <ToastContainer theme="dark" position="bottom-center" />
      
      {/* A renderização do conteúdo só acontece se 'jogador' existir */}
      {jogador && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 text-center border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          <div className="relative inline-block mb-6">
            {jogador.foto ? (
              <img src={jogador.foto} alt={jogador.nome} className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-blue-500 shadow-lg shadow-blue-500/20" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-slate-800 flex items-center justify-center mx-auto border-4 border-blue-500 shadow-lg shadow-blue-500/20">
                <FaUser className="text-5xl text-slate-600" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-slate-900">
              <FaShieldAlt size={16} />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tighter">Olá, {jogador.nome}!</h1>
          <p className="text-slate-400 mt-2 mb-8">Confirme sua presença para o próximo baba.</p>

          {jogador.presente ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-green-500/10 text-green-300 p-4 rounded-2xl border border-green-500/20">
                <p className="font-bold text-sm uppercase tracking-wider">Sua presença está confirmada!</p>
              </div>
              <motion.button
                onClick={() => handleConfirmarPresenca(false)}
                disabled={processando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                {processando ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                Desmarcar Presença
              </motion.button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-yellow-500/10 text-yellow-300 p-4 rounded-2xl border border-yellow-500/20">
                <p className="font-bold text-sm uppercase tracking-wider">Aguardando sua confirmação.</p>
              </div>
              <motion.button
                onClick={() => handleConfirmarPresenca(true)}
                disabled={processando}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                {processando ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                Confirmar Presença
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}