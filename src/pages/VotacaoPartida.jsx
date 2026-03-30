import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaUserTimes, FaCrown, FaCheckCircle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import api from '../services/api';

export default function VotacaoPartida() {
  const { linkId } = useParams();
  const [jogadores, setJogadores] = useState([]);
  const [votos, setVotos] = useState({ melhorPartida: '', perebaPartida: '', golMaisBonito: '' });
  const [carregando, setCarregando] = useState(true);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/partida-publica/${linkId}`);
        setJogadores(res.data.jogadores || []);
      } catch (err) {
        toast.error("Link de votação expirado.");
      } finally {
        setCarregando(false);
      }
    };
    fetchData();
  }, [linkId]);

  const submeterVotacao = async () => {
    if (!votos.melhorPartida || !votos.perebaPartida || !votos.golMaisBonito) {
      return toast.warn("Por favor, vote em todas as categorias.");
    }
    try {
      const payload = Object.entries(votos).map(([categoria, jogador]) => ({ categoria, jogador }));
      await api.post(`/partida-publica/${linkId}/votar`, { votos: payload });
      setEnviado(true);
      toast.success("Votos enviados com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar votação.");
    }
  };

  if (carregando) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando formulário...</div>;
  if (enviado) return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <FaCheckCircle className="text-6xl text-green-500 mb-4" />
      <h1 className="text-2xl font-bold">Votação Enviada!</h1>
      <p className="text-gray-400 mt-2">Obrigado por participar. Os resultados serão divulgados em breve pelo administrador.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="max-w-md mx-auto space-y-8">
        <header className="text-center py-6">
          <h1 className="text-2xl font-black text-blue-400 uppercase tracking-tighter">Premiações da Partida</h1>
          <p className="text-gray-500 text-xs font-bold">VOTAÇÃO DOS ATLETAS</p>
        </header>

        <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-2xl space-y-8">
          {[
            { id: 'melhorPartida', label: 'Melhor da Partida', icon: <FaTrophy className="text-yellow-500" /> },
            { id: 'perebaPartida', label: 'Pereba da Partida', icon: <FaUserTimes className="text-red-400" /> },
            { id: 'golMaisBonito', label: 'Gol Mais Bonito', icon: <FaCrown className="text-cyan-400" /> }
          ].map(premio => (
            <div key={premio.id} className="space-y-3">
              <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                {premio.icon} {premio.label}
              </label>
              <select 
                value={votos[premio.id]}
                onChange={(e) => setVotos({...votos, [premio.id]: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um jogador...</option>
                {jogadores.map(nome => <option key={nome} value={nome}>{nome}</option>)}
                <option value="Convidado">Convidado / Outro</option>
              </select>
            </div>
          ))}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submeterVotacao}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-lg transition-all shadow-lg mt-4"
          >
            CONFIRMAR MEUS VOTOS
          </motion.button>
        </div>
      </div>
      <ToastContainer theme="dark" position="bottom-center" />
    </div>
  );
}