// src/pages/AgendarPartida.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowLeft, FaSave } from "react-icons/fa";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from "framer-motion";

export default function AgendarPartida() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    data: "",
    horario: "",
    local: "",
    observacoes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    if (location.state?.partidaParaEditar) {
      const partida = location.state.partidaParaEditar;
      // Ajusta a data para meio-dia para evitar problemas de fuso horário
      const dataAjustada = new Date(partida.data + 'T12:00:00').toISOString().split('T')[0];
      
      setFormData({
        data: dataAjustada,
        horario: partida.horario,
        local: partida.local,
        observacoes: partida.observacoes || ''
      });
      setModoEdicao(true);
      setEditandoId(partida._id);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ajusta a data para meio-dia antes de enviar
      const dataAjustada = new Date(formData.data + 'T12:00:00').toISOString();
      
      const dadosParaEnviar = {
        ...formData,
        data: dataAjustada
      };

      if (modoEdicao) {
        await api.put(`/api/agenda/${editandoId}`, dadosParaEnviar);
        toast.success('Partida atualizada com sucesso!');
      } else {
        await api.post('/api/agenda', dadosParaEnviar);
        toast.success('Partida agendada com sucesso!');
      }
      navigate('/partidas-agendadas');
    } catch (error) {
      console.error("Erro ao salvar partida:", error);
      const errorMsg = error.response?.data?.error || error.message || "Erro ao salvar partida";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Efeito de partículas */}
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

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative pt-16 sm:pt-0 text-center"
        >
          {/* Botão Voltar */}
          <motion.button 
            onClick={() => navigate('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              x: -5,
              backgroundColor: "rgba(37, 99, 235, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-4 top-2 sm:top-8 w-11 h-11 flex items-center justify-center bg-gray-800/40 hover:bg-gray-700/40 text-gray-200 rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:shadow-blue-500/20"
            title="Voltar para o Dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RiArrowLeftDoubleLine className="text-blue-400 text-2xl transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </motion.button>

          {/* Título e Subtítulo */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3">
              <FaCalendarAlt className="text-blue-400 text-2xl sm:text-3xl" />
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              >
                {modoEdicao ? 'Editar Partida' : 'Agendar Partida'}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base"
            >
              {modoEdicao ? 'Atualize os dados da partida' : 'Preencha os dados para agendar uma nova partida'}
            </motion.p>
          </div>
        </motion.div>

        {/* Conteúdo do formulário */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-800/50 backdrop-blur-sm text-white p-4 rounded-lg mb-6 border border-red-700/50"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-300 mb-2 flex items-center gap-2"><FaCalendarAlt /> Data</label>
                <input type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
              </div>
              <div>
                <label className="text-gray-300 mb-2 flex items-center gap-2"><FaClock /> Horário</label>
                <input type="time" value={formData.horario} onChange={(e) => setFormData({...formData, horario: e.target.value})} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-gray-300 mb-2 flex items-center gap-2"><FaMapMarkerAlt /> Local</label>
              <input type="text" value={formData.local} onChange={(e) => setFormData({...formData, local: e.target.value})} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Ex: Quadra A" />
            </div>
            <div className="mb-6">
              <label className="text-gray-300 mb-2">Observações</label>
              <textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 h-24" placeholder="Detalhes adicionais..." />
            </div>
            <motion.button 
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 rounded-lg font-medium shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <FaSave className="text-lg" />
                  {modoEdicao ? 'Atualizar Partida' : 'Agendar Partida'}
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
