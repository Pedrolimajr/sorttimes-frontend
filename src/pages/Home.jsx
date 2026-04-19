// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
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

      {/* Container principal com layout responsivo */}
      <div className="max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
        {/* Coluna esquerda - Conteúdo textual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Cabeçalho com logo */}
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-slate-900 border border-white/10 p-2 rounded-2xl shadow-2xl">
              <img
                src="/img/logo_time.png"
                alt="Logo SortTimes"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              SortTimes
            </h1>
          </div>

          {/* Título principal */}
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tighter text-white">
            <span className="block">A nova era da</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Sistema de Gestão de Futebol
            </span>
          </h2>

          {/* Subtítulo */}
          <p className="text-xl sm:text-2xl text-slate-400 font-medium">
            Simplifique o gerenciamento do seu time
          </p>

          {/* Imagem em mobile - aparece abaixo do subtítulo com efeitos hover */}
          <div className="block md:hidden w-full mt-4">
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-4 aspect-video overflow-hidden group transition-all duration-500 shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Container da imagem */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <img
                  src="/img/sorttimes-img.jpg"
                  alt="Painel de Controle"
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-100 scale-100 group-hover:scale-105 transition-all duration-500 ease-out"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </motion.div>
          </div>

          {/* Descrição */}
          <p className="text-base sm:text-lg text-slate-500 max-w-lg leading-relaxed">
            O sistema definitivo para boleiros e gestores de arenas. Organize sorteios justos, 
            links de presença automáticos e controle financeiro completo em um só lugar.
          </p>

          {/* Botão de ação principal */}
          <Link to="/login" className="block w-fit">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:shadow-blue-500/25 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all flex items-center gap-3 text-sm uppercase tracking-widest"
            >
              Começar Agora <FaArrowRight className="text-xs sm:text-sm" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Coluna direita - Espaço para imagem/dashboard (apenas desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hidden md:block w-full"
        >
          <div className="relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[3rem] p-6 aspect-video overflow-hidden group transition-all duration-500 shadow-2xl hover:border-blue-500/30 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="absolute inset-6 overflow-hidden rounded-[2rem] border border-white/5">
              <img
                src="/img/sorttimes-img.jpg"
                alt="Painel de Controle"
                className="w-full h-full object-cover brightness-75 group-hover:brightness-100 scale-100 group-hover:scale-105 transition-all duration-500 ease-out"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}