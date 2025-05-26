import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, 
  FaMapMarkerAlt, FaTshirt, FaFutbol, FaMoneyBillWave
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PerfilJogador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jogador, setJogador] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarJogadores = async () => {
      try {
        setCarregando(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jogadores`);
  
        if (!response.ok) {
          throw new Error('Erro ao carregar jogadores');
        }
  
        const result = await response.json();
        console.log('Dados recebidos da API:', result);
  
        const jogadoresArray = Array.isArray(result.data) ? result.data : [];
  
        if (location.state?.novoJogador) {
          const jogadorExiste = jogadoresArray.some(j => j._id === location.state.novoJogador._id);
          if (!jogadorExiste) {
            jogadoresArray.unshift(location.state.novoJogador);
          }
          setMensagemSucesso(location.state.mensagem);
          navigate(location.pathname, { replace: true, state: {} });
        }
  
        setJogadores(jogadoresArray);
      } catch (error) {
        console.error("Erro ao carregar jogadores:", error);
        toast.error(error.message || 'Erro ao carregar jogadores');
        setJogadores([]);
      } finally {
        setCarregando(false);
      }
    };
  
    carregarJogadores();
  }, [location.state, navigate, location.pathname]);
  

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!jogador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
        Jogador não encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button 
            onClick={() => navigate('/lista-jogadores')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
          >
            <FaArrowLeft /> Voltar para lista
          </button>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              {jogador.foto ? (
                <img 
                  src={jogador.foto} 
                  alt={jogador.nome} 
                  className="w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-gray-700 flex items-center justify-center border-4 border-blue-500">
                  <FaUser className="text-gray-400 text-4xl" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {jogador.nome}
              </h1>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                jogador.statusFinanceiro === 'Adimplente' 
                  ? 'bg-green-900 text-green-100' 
                  : 'bg-red-900 text-red-100'
              }`}>
                {jogador.statusFinanceiro || 'Adimplente'}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FaTshirt className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">Número da Camisa</h3>
                    <p className="text-white">{jogador.numeroCamisa || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaFutbol className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">Posição/Nível</h3>
                    <p className="text-white">{jogador.posicao} ({jogador.nivel})</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaCalendarAlt className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">Data de Nascimento</h3>
                    <p className="text-white">
                      {jogador.dataNascimento ? 
                        new Date(jogador.dataNascimento).toLocaleDateString() + 
                        ` (${new Date().getFullYear() - new Date(jogador.dataNascimento).getFullYear()} anos)` : 
                        'Não informada'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaCalendarAlt className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">Data de Ingresso</h3>
                    <p className="text-white">
                      {jogador.dataIngresso ? 
                        new Date(jogador.dataIngresso).toLocaleDateString() : 
                        'Não informada'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaPhone className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">Telefone</h3>
                    <p className="text-white">{jogador.telefone || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaEnvelope className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">E-mail</h3>
                    <p className="text-white break-all">{jogador.email || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 sm:col-span-2">
                  <FaMapMarkerAlt className="text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-gray-400 text-sm">Endereço</h3>
                    <p className="text-white">{jogador.endereco || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}