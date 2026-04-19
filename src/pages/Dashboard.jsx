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
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 pb-24 relative overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Estilo App */}
      <div className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <span className="text-blue-500"><FaFutbol /></span>
              SORT TIMES
            </h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] -mt-1">Painel Administrativo</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:scale-105 transition-all duration-300">
            <img 
              src="/img/Logo_Melhorado.png" 
              alt="Logo Administrador" 
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Card Hero de Boas-vindas */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 rounded-[2.5rem] p-8 sm:p-10 mb-12 shadow-2xl shadow-blue-500/20 relative overflow-hidden border border-white/10"
        >
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-blue-100/80 text-sm font-bold uppercase tracking-widest mb-2">{saudacao}, Administrador!</p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                Pronto para o <br/> próximo jogo?
              </h2>
            </div>

            <div className="bg-black/20 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center min-w-[180px] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] mb-2 opacity-70">Status Tempo Real</span>
              <div className="flex items-baseline gap-2 relative">
                <span className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">{relogioFormatado}</span>
                <span className="text-xl font-bold text-cyan-300 tabular-nums opacity-90">{segundos}</span>
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
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent ml-4" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoria.itens.map((card, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5, scale: 1.01 }}
                  >
                    <Link
                      to={card.caminho}
                      className="flex items-center gap-5 bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all group relative overflow-hidden shadow-xl"
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