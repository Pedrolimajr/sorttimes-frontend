// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight, FaUser, FaChartLine, FaUsers, FaCalendarCheck } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[100px]" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
        />
      </div>

      {/* Efeito de partículas de fundo */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              opacity: 0.3,
            }}
            animate={{
              y: [null, (Math.random() - 0.5) * 50],
              x: [null, (Math.random() - 0.5) * 50],
            }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-slate-900 border border-white/10 p-2 rounded-2xl shadow-2xl">
                <img src="/img/logo_time.png" alt="Logo SortTimes" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                SortTimes
              </h1>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tighter text-white">
              A nova era da <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
                Gestão de Futebol
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              O sistema definitivo para boleiros. Organize sorteios justos, controle o financeiro e gerencie presença de forma profissional.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(37, 99, 235, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20"
                >
                  Começar Agora <FaArrowRight />
                </motion.button>
              </Link>
              
              <div className="flex -space-x-3 overflow-hidden p-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#020617] bg-slate-800 flex items-center justify-center">
                    <FaUser className="text-xs text-slate-500" />
                  </div>
                ))}
                <div className="flex items-center justify-center h-10 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 ml-4">
                  +150 JOGADORES
                </div>
              </div>
            </div>

            {/* Quick Feature Bento */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5">
              {[
                { icon: <FaChartLine />, label: "Financeiro" },
                { icon: <FaUsers />, label: "Sorteios" },
                { icon: <FaCalendarCheck />, label: "Presença" }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center lg:items-start gap-2 group cursor-default">
                  <div className="text-blue-500 text-lg group-hover:scale-110 transition-transform">{item.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Visual Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block group"
          >
            {/* Main Preview Frame */}
            <div className="relative rounded-[3rem] p-4 bg-gradient-to-b from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden group-hover:rotate-1 transition-transform duration-700">
              <img 
                src="/img/sorttimes-img.jpg" 
                alt="SortTimes Dashboard"
                className="rounded-[2rem] w-full h-auto brightness-90 contrast-110"
              />
              {/* Floating UI Simulation */}
              <div className="absolute top-10 -left-6 bg-slate-900/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Painel Operacional</span>
                </div>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/20 blur-[100px] rounded-full" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}