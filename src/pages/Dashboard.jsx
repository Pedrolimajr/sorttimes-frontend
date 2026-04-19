// src/pages/Dashboard.jsx
import { Link } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { 
  FaUserPlus, 
  FaRandom, 
  FaCalendarAlt, 
  FaMoneyBillWave,
  FaUsers,
  FaHome,
  FaClipboardList,
  FaInfoCircle,
  FaFutbol,
  FaTachometerAlt,
  FaCog
} from 'react-icons/fa';
import socket from '../services/socket';

// Array de cards do dashboard com cores mais sóbrias
const cardsDashboard = [
  {
    categoria: "Jogadores",
    itens: [
      {
        titulo: "Cadastro de Jogadores",
        caminho: "/cadastro-jogadores",
        icone: <FaUserPlus />,
        descricao: "Adicione ou edite jogadores do sistema",
        cor: "from-blue-600 to-blue-400"
      },
      {
        titulo: "Listar Jogadores",
        caminho: "/lista-jogadores",
        icone: <FaUsers />,
        descricao: "Visualize e gerencie todos os jogadores",
        cor: "from-blue-600 to-blue-400"
      }
    ]
  },
  {
    categoria: "Partidas",
    itens: [
      {
        titulo: "Agendar Partida",
        caminho: "/agendar-partida",
        icone: <FaCalendarAlt />,
        descricao: "Marque novos jogos e treinos",
        cor: "from-blue-600 to-blue-400"
      },
      {
        titulo: "Partidas Agendadas",
        caminho: "/partidas-agendadas",
        icone: <FaClipboardList />,
        descricao: "Visualize todas as partidas",
        cor: "from-blue-600 to-blue-400"
      },
      {
        titulo: "Informações de Partidas",
        caminho: "/informacoes-partida",
        icone: <FaInfoCircle />,
        descricao: "Detalhes e estatísticas das partidas",
        cor: "from-blue-600 to-blue-400"
      },
      {
        titulo: "Sorteio de Times",
        caminho: "/sorteio-times",
        icone: <FaRandom />,
        descricao: "Divida os jogadores em equipes",
        cor: "from-blue-600 to-blue-400"
      }
    ]
  },
  {
    categoria: "Outros",
    itens: [
      {
        titulo: "Financeiro",
        caminho: "/financeiro",
        icone: <FaMoneyBillWave />,
        descricao: "Controle pagamentos e mensalidades",
        cor: "from-blue-600 to-blue-400"
      },
      {
        titulo: "Configurações",
        caminho: "/configuracoes",
        icone: <FaCog />,
        descricao: "Gerencie suas informações pessoais",
        cor: "from-blue-600 to-blue-400"
      },
      {
        titulo: "Voltar à Home",
        caminho: "/",
        icone: <FaHome />,
        descricao: "Retornar à página inicial",
        cor: "from-gray-600 to-gray-500"
      }
    ]
  }
];

export default function Dashboard() {
  const [dadosDashboard, setDadosDashboard] = useState([]);

  useEffect(() => {
    socket.connect();

    socket.on('dados-atualizados', (novosDados) => {
      // Atualiza os dados do dashboard
      setDadosDashboard(novosDados);
    });

    return () => {
      socket.off('dados-atualizados');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-6 sm:py-8">
      {/* Efeitos de luz de fundo (Glow) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Cabeçalho com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="mb-10 sm:mb-16 text-center"
      >
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <FaTachometerAlt className="text-blue-400 text-3xl sm:text-4xl" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight uppercase">
            Painel de Controle
          </h1>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg font-medium"
        >
          Central de gerenciamento do time
        </motion.p>
      </motion.div>

      {/* Grid organizado por categorias */}
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">
        {cardsDashboard.map((categoria, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <motion.h2 
              whileHover={{ x: 5 }}
              className="text-xs sm:text-sm font-black text-gray-500 mb-6 sm:mb-8 pl-4 border-l-4 border-blue-500/50 uppercase tracking-[0.3em]"
            >
              {categoria.categoria}
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categoria.itens.map((card, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15 
                  }}
                >
                  <Link
                    to={card.caminho}
                    className="block bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300 h-full group border border-gray-700/50 hover:border-blue-500/30 hover:shadow-blue-500/10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
                    
                    <div className="relative flex flex-col h-full">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${card.cor} text-white text-xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {React.cloneElement(card.icone, { className: "text-white" })}
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-white">
                          {card.titulo}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">
                          {card.descricao}
                        </p>
                      </div>
                      <div className="mt-auto pt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                         <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Efeito de partículas de fundo mais discreto */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100, 
              y: Math.random() * 100,
              opacity: 0.05
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 30],
              x: [null, (Math.random() - 0.5) * 30],
            }}
            transition={{ 
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-gray-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}