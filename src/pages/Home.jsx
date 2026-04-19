// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight, FaHome, FaUserPlus, FaRandom, FaCalendarAlt, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30 pb-24">
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

      {/* Espaçador superior para empurrar o conteúdo para o centro */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full relative z-10 py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-5 sm:space-y-7 flex flex-col items-center w-full"
        >
          {/* Cabeçalho com logo */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center bg-black/40 border border-white/10 p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <img
                src="/img/logo_time.png"
                alt="Logo SortTimes"
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 flex items-center gap-3 sm:gap-4">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.2 }} 
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <FaFutbol className="text-blue-500 text-2xl sm:text-4xl lg:text-5xl" />
              </motion.div>
              SortTimes
            </h1>
          </div>

          {/* Título mais compacto */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm">
              Domine a sua <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Arena
            </span>
          </h2>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full mx-auto" />
          </div>

          {/* Subtítulo */}
          <div className="flex flex-col gap-3">
            <p className="text-sm sm:text-base text-slate-500 font-semibold max-w-md leading-relaxed">
              O sistema definitivo para boleiros e gestores. Organize sorteios e o financeiro de forma profissional.
            </p>
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
          <Link to="/login" className="block w-fit group relative">
            {/* Button Outer Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-hover:bg-blue-500/40 transition-all duration-500 rounded-full" />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black py-3.5 px-10 rounded-[1.2rem] shadow-2xl border border-white/10 transition-all flex items-center gap-3 text-xs sm:text-sm uppercase tracking-[0.2em] overflow-hidden"
            >
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] group-hover:left-[150%] transition-all duration-1000 ease-in-out" />
              Acessar Painel <FaArrowRight />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Rodapé fixo na base */}
      <footer className="w-full py-4 text-center relative z-10 opacity-30">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} SortTimes Suite
        </p>
      </footer>

      {/* Simulação de Bottom Navigation (Visível em Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 md:hidden pointer-events-none">
        <div className="max-w-xs mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-full h-16 flex items-center justify-around px-8 shadow-2xl pointer-events-auto">
          <button className="text-blue-500" title="Home"><FaHome size={20}/></button>
          <Link to="/cadastro-jogadores" className="text-slate-500 hover:text-blue-400 transition-colors" title="Novo Jogador"><FaUserPlus size={20}/></Link>
          <div className="w-12 h-12 bg-blue-600 rounded-full -mt-12 flex items-center justify-center shadow-lg shadow-blue-500/40 text-white border-4 border-[#020617]">
            <FaRandom />
          </div>
          <Link to="/agendar-partida" className="text-slate-500 hover:text-blue-400 transition-colors" title="Novo Jogo"><FaCalendarAlt size={20}/></Link>
          <Link to="/configuracoes" className="text-slate-500 hover:text-blue-400 transition-colors" title="Opções"><FaCog size={20}/></Link>
        </div>
      </div>
    </div>
  );
}