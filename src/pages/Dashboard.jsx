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
        icone: <FaUserPlus className="text-gray-300" />,
        descricao: "Adicione ou edite jogadores do sistema",
        cor: "bg-gray-700 hover:bg-gray-600"
      },
      {
        titulo: "Listar Jogadores",
        caminho: "/lista-jogadores",
        icone: <FaUsers className="text-gray-300" />,
        descricao: "Visualize e gerencie todos os jogadores",
        cor: "bg-gray-700 hover:bg-gray-600"
      }
    ]
  },
  {
    categoria: "Partidas",
    itens: [
      {
        titulo: "Agendar Partida",
        caminho: "/agendar-partida",
        icone: <FaCalendarAlt className="text-gray-300" />,
        descricao: "Marque novos jogos e treinos",
        cor: "bg-gray-700 hover:bg-gray-600"
      },
      {
        titulo: "Partidas Agendadas",
        caminho: "/partidas-agendadas",
        icone: <FaClipboardList className="text-gray-300" />,
        descricao: "Visualize todas as partidas",
        cor: "bg-gray-700 hover:bg-gray-600"
      },
      {
        titulo: "Informações de Partidas",
        caminho: "/informacoes-partida",
        icone: <FaInfoCircle className="text-gray-300" />,
        descricao: "Detalhes e estatísticas das partidas",
        cor: "bg-gray-700 hover:bg-gray-600"
      },
      {
        titulo: "Sorteio de Times",
        caminho: "/sorteio-times",
        icone: <FaRandom className="text-gray-300" />,
        descricao: "Divida os jogadores em equipes",
        cor: "bg-gray-700 hover:bg-gray-600"
      }
    ]
  },
  {
    categoria: "Outros",
    itens: [
      {
        titulo: "Financeiro",
        caminho: "/financeiro",
        icone: <FaMoneyBillWave className="text-gray-300" />,
        descricao: "Controle pagamentos e mensalidades",
        cor: "bg-gray-700 hover:bg-gray-600"
      },
      {
        titulo: "Configurações",
        caminho: "/configuracoes",
        icone: <FaCog className="text-gray-300" />,
        descricao: "Gerencie suas informações pessoais",
        cor: "bg-gray-700 hover:bg-gray-600"
      },
      {
        titulo: "Voltar à Home",
        caminho: "/",
        icone: <FaHome className="text-gray-300" />,
        descricao: "Retornar à página inicial",
        cor: "bg-gray-700 hover:bg-gray-600"
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
      {/* Cabeçalho com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="mb-8 sm:mb-12 text-center"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-200 flex items-center justify-center gap-3">
          <FaTachometerAlt className="text-blue-400 text-2xl sm:text-3xl" />
          <span>Painel de Controle</span>
        </h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 mt-2 sm:mt-3 text-base sm:text-lg"
        >
          Central de gerenciamento do time
        </motion.p>
      </motion.div>

      {/* Grid organizado por categorias */}
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {cardsDashboard.map((categoria, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <motion.h2 
              whileHover={{ x: 5 }}
              className="text-xl sm:text-2xl font-semibold text-gray-300 mb-4 sm:mb-6 pl-3 border-l-4 border-gray-500"
            >
              {categoria.categoria}
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categoria.itens.map((card, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15 
                  }}
                >
                  <Link
                    to={card.caminho}
                    className={`block ${card.cor} p-4 sm:p-6 rounded-lg shadow-md transition-all duration-300 h-full group border border-gray-600`}
                  >
                    <div className="flex items-start">
                      <div className="p-2 sm:p-3 bg-gray-600 rounded-lg mr-3 sm:mr-4 group-hover:bg-gray-500 transition-all">
                        {card.icone}
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-white">
                          {card.titulo}
                        </h3>
                        <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2">
                          {card.descricao}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      className="h-px bg-gray-500 mt-2 sm:mt-3"
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Efeito de partículas de fundo mais discreto */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        {[...Array(15)].map((_, i) => (
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