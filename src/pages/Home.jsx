// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30">
      {/* Mesh Gradient & Texture Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        
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

      {/* Container principal simplificado para Coluna Única (Estilo App) */}
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8 flex flex-col items-center"
        >
          {/* Cabeçalho com logo */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-black/40 border border-white/10 p-2 rounded-xl shadow-2xl backdrop-blur-md">
              <img
                src="/img/logo_time.png"
                alt="Logo SortTimes"
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 flex items-center gap-2">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.2 }} 
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <FaFutbol className="text-blue-500" />
              </motion.div>
              SortTimes
            </h1>
          </div>

          {/* Título principal com detalhe de linha */}
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm">
              Domine a sua <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Gestão de Futebol
            </span>
          </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full mx-auto" />
          </div>

          {/* Subtítulo */}
          <div className="flex flex-col gap-3">
            <p className="text-base sm:text-lg text-slate-500 font-semibold max-w-lg leading-relaxed">
              O sistema definitivo para boleiros. Organize sorteios, controle o financeiro e gerencie presença de forma profissional.
            </p>
          </div>

          {/* Imagem unificada - Mais compacta */}
          <div className="w-full max-w-lg mt-2 px-2">
            <motion.div
              whileHover={{
                rotate: [0, -8, 6, 0],
                x: [0, -12, 18, 0],
                scale: [1, 0.97, 1.05, 1],
                y: -8
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.35, ease: "backOut" }}
              className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 sm:p-3 aspect-video overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] group cursor-pointer"
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
              <div className="absolute top-6 left-6 bg-black/60 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Painel Operacional Ativo</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Botão de ação principal */}
          <Link to="/login" className="block w-fit group relative">
            {/* Button Outer Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-hover:bg-blue-500/40 transition-all duration-500 rounded-full" />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black py-4 px-10 rounded-[1.5rem] shadow-2xl border border-white/10 transition-all flex items-center gap-3 text-xs sm:text-sm uppercase tracking-[0.2em] overflow-hidden"
            >
              {/* Internal shine animation */}
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] group-hover:left-[150%] transition-all duration-1000 ease-in-out" />
              Acessar Painel <FaArrowRight />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}