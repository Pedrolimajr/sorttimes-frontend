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
    <div className="min-h-screen bg-[#0a0f1d] px-4 py-8 sm:py-12 relative selection:bg-blue-500/30">
      {/* Fundo com padrão de grid técnico */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]" 
        style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '32px 32px' }} 
      />

      {/* Cabeçalho com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="mb-12 sm:mb-20 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between border-b border-white/5 pb-8"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <FaTachometerAlt className="text-blue-500 text-2xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Painel de Controle
          </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">
            Bem-vindo ao centro administrativo do SortTimes.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 flex items-center gap-4">
           <div className="text-right hidden sm:block">
             <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-40">Status do Sistema</p>
             <p className="text-green-500 text-[10px] font-bold flex items-center justify-end gap-1.5 mt-1">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> 
               SISTEMA OPERACIONAL
             </p>
           </div>
        </div>
      </motion.div>

      {/* Grid organizado por módulos */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-12">
        {cardsDashboard.map((categoria, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-[10px] font-black text-blue-500/80 uppercase tracking-[0.4em] whitespace-nowrap">
                {categoria.categoria}
              </h2>
              <div className="h-px w-full bg-gradient-to-r from-blue-500/20 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categoria.itens.map((card, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    to={card.caminho}
                    className="block bg-[#161b2c] p-6 rounded-xl border border-white/5 hover:border-blue-500/40 transition-all duration-300 h-full group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/[0.02] transition-colors" />
                    
                    <div className="relative flex flex-col h-full">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-900 border border-white/10 text-blue-500 text-lg mb-6 group-hover:border-blue-500/50 group-hover:text-white group-hover:bg-blue-600 transition-all duration-300">
                        {card.icone}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-100 group-hover:text-blue-400 transition-colors">
                          {card.titulo}
                        </h3>
                        <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                          {card.descricao}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}