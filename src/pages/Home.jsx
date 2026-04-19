// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Tech Grid */}
        <div className="absolute inset-0 opacity-[0.05]" 
          style={{ backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} 
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

      <div className="max-w-2xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-5 sm:space-y-7 flex flex-col items-center w-full"
        >
          {/* Cabeçalho com logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center bg-black/40 border border-white/10 p-4 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <img
                src="/img/logo_time.png"
                alt="Logo SortTimes"
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.2 }} 
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <FaFutbol className="text-blue-500 text-2xl sm:text-4xl" />
              </motion.div>
              SortTimes
            </h1>
          </div>

          {/* Título principal e Subtítulo organizados */}
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm">
              A revolução na sua <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Arena de Futebol
            </span>
          </h2>
            <div className="h-1.5 w-20 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full mx-auto opacity-50" />
            
            <div className="pt-2">
              <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed">
                O sistema definitivo para boleiros e gestores. <br className="hidden sm:block"/>
                Organize sorteios, presença e financeiro com excelência.
              </p>
            </div>
          </div>

          {/* Imagem central reduzida para caber no viewport */}
          <div className="w-full max-w-sm sm:max-w-md px-4">
            <motion.div
              whileHover={{
                rotate: [0, -8, 6, 0],
                x: [0, -12, 18, 0],
                scale: [1, 0.97, 1.05, 1],
                y: -8
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.35, ease: "backOut" }}
              className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 aspect-video overflow-hidden shadow-2xl group cursor-pointer"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Container da imagem */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <img
                  src="/img/sorttimes-img.jpg"
                  alt="Painel de Controle"
                  className="w-full h-full object-cover brightness-[0.8] group-hover:brightness-110 scale-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
                />
              </div>
              
              {/* Reflective Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/5 pointer-events-none" />

              {/* Detalhe flutuante (Painel Operacional) */}
              <div className="absolute top-4 left-4 bg-black/60 border border-white/10 p-2 rounded-xl shadow-2xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Painel Operacional Ativo</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Botão de ação principal */}
          <Link to="/login" className="block w-full sm:w-fit group relative px-4">
            {/* Button Outer Glow */}
            <div className="absolute inset-0 bg-blue-500/30 blur-3xl group-hover:bg-blue-500/50 transition-all duration-500 rounded-full" />
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-full sm:w-auto bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white font-black py-5 px-16 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] border border-white/20 transition-all flex items-center justify-center gap-4 text-sm sm:text-base uppercase tracking-[0.25em] overflow-hidden"
            >
              {/* Efeito de brilho interno animado */}
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] group-hover:animate-shine" />
              
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] group-hover:left-[150%] transition-all duration-1000 ease-in-out" />
              Acessar Painel <FaArrowRight />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}