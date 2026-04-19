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
  FaCog,
  FaUser
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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    socket.connect();
    socket.on('dados-atualizados', (novosDados) => {
      // setDadosDashboard(novosDados);
    });

    return () => {
      clearInterval(timer);
      socket.off('dados-atualizados');
      socket.disconnect();
    };
  }, []);

  const hour = time.getHours();
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const relogioFormatado = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const segundos = time.toLocaleTimeString('pt-BR', { second: '2-digit' });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 selection:bg-blue-500/30 pb-24">
      {/* Header Estilo App */}
      <div className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span className="text-blue-500"><FaFutbol /></span>
              SORT TIMES
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Painel Administrativo</p>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/20 shadow-lg">
            <img 
              src="/img/Logo_Melhorado.png" 
              alt="Logo Administrador" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Card Hero de Boas-vindas */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2.5rem] p-8 mb-10 shadow-2xl shadow-blue-500/30 relative overflow-hidden border border-white/10"
        >
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl p-8" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-100 text-lg font-medium mb-1 opacity-90">{saudacao}, Administrador!</p>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                O que vamos <br/> organizar hoje?
              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 flex flex-col items-center justify-center min-w-[140px] shadow-inner">
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-1">Horário Local</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{relogioFormatado}</span>
                <span className="text-lg font-bold text-blue-200 opacity-80 tabular-nums">{segundos}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Seções por categoria estilo Mobile Menu */}
        <div className="space-y-12">
          {cardsDashboard.map((categoria, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                  {categoria.categoria}
                </h2>
                <div className="h-px flex-1 bg-slate-800 ml-4" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoria.itens.map((card, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={card.caminho}
                      className="flex items-center gap-5 bg-slate-800/40 p-5 rounded-[2rem] border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group"
                    >
                      <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${card.cor} flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-blue-500/20`}>
                        {card.icone}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-100 text-base mb-1">
                          {card.titulo}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          {card.descricao}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulação de Bottom Navigation (Visível em Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 md:hidden pointer-events-none">
        <div className="max-w-xs mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-full h-16 flex items-center justify-around px-8 shadow-2xl pointer-events-auto">
          <button className="text-blue-500" title="Home"><FaHome size={20}/></button>
          <Link to="/cadastro-jogadores" className="text-slate-500 hover:text-blue-400 transition-colors" title="Novo Jogador"><FaUserPlus size={20}/></Link>
          <div className="w-12 h-12 bg-blue-600 rounded-full -mt-12 flex items-center justify-center shadow-lg shadow-blue-500/40 text-white border-4 border-[#0f172a]">
            <FaRandom />
          </div>
          <Link to="/agendar-partida" className="text-slate-500 hover:text-blue-400 transition-colors" title="Novo Jogo"><FaCalendarAlt size={20}/></Link>
          <Link to="/configuracoes" className="text-slate-500 hover:text-blue-400 transition-colors" title="Opções"><FaCog size={20}/></Link>
        </div>
      </div>
    </div>
  );
}