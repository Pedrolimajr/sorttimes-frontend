// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Aurora & Grid Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[100px]" />
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

      {/* Container principal simplificado para Coluna Única (Estilo App) */}
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8 lg:space-y-4 flex flex-col items-center"
        >
          {/* Cabeçalho com logo */}
          <div className="flex flex-col items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-slate-800/40 border border-white/10 p-4 rounded-[2rem] shadow-2xl backdrop-blur-sm"
            >
              <img
                src="/img/logo_time.png"
                alt="Logo SortTimes"
                className="w-full h-full object-contain brightness-125 contrast-125 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.2 }} 
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <FaFutbol className="text-blue-500" />
              </motion.div>
              SortTimes
            </h1>
          </div>

          {/* Título principal */}
          <h2 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black leading-[1.1] tracking-tighter text-white">
            A nova era da <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Gestão de Futebol
            </span>
          </h2>

          {/* Subtítulo */}
          <div className="flex flex-col gap-3">
            <p className="text-base sm:text-lg lg:text-base text-slate-400 font-medium max-w-xl">
              O sistema definitivo para boleiros. Organize sorteios, controle o financeiro e gerencie presença de forma profissional.
            </p>
          </div>

          {/* Imagem unificada - estilo App centralizado com efeito de chute */}
          <div className="w-full mt-4 lg:mt-2 px-2 max-w-lg lg:max-w-md">
            <motion.div
              whileHover={{
                rotate: [0, -6, 4, 0],
                x: [0, -8, 12, 0],
                scale: [1, 0.98, 1.03, 1],
                y: -5
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-3 sm:p-4 aspect-video overflow-hidden shadow-2xl group cursor-pointer"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Container da imagem */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <img
                  src="/img/sorttimes-img.jpg"
                  alt="Painel de Controle"
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-100 scale-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            </motion.div>
          </div>

          {/* Botão de ação principal */}
          <Link to="/login" className="block w-fit">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(37, 99, 235, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 lg:mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-black py-4 lg:py-3 px-10 lg:px-8 rounded-[2rem] shadow-xl hover:shadow-blue-500/25 transition-all flex items-center gap-4 text-xs lg:text-sm uppercase tracking-[0.2em]"
            >
              Acessar Painel <FaArrowRight />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}


