// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FaFutbol, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function PaginaInicial() {
  return (
    <div className="h-full bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Efeito de partículas de fundo */}
      <div className="fixed inset-0 overflow-hidden -z-10 opacity-10">
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
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Cabeçalho com logo */}
          <div className="inline-flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-400 p-1 sm:p-2 rounded-lg shadow-lg">
              <img
                src="/src/img/logo_time.png"
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              SortTimes
            </h1>
          </div>

          {/* Título principal */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Sistema de Gestão de Futebol
            </span>
          </h2>

          {/* Subtítulo */}
          <p className="text-xl sm:text-2xl text-gray-400">
            Simplifique o gerenciamento do seu time
          </p>

          {/* Imagem em mobile - aparece abaixo do subtítulo com efeitos hover */}
          <div className="block md:hidden w-full mt-4">
            <motion.div
              whileHover={{
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                y: -5,
              }}
              transition={{ duration: 0.3 }}
              className="relative bg-gray-800 border border-gray-700 rounded-xl p-4 aspect-video overflow-hidden group transition-all duration-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
            >
              {/* Efeito de brilho azul */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Container da imagem */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <img
                  src="./src/img/sorttimes-img.jpg"
                  alt="Painel de Controle"
                  className="w-full h-full object-cover brightness-90 group-hover:brightness-110 scale-100 group-hover:scale-105 transition-all duration-500 ease-out"
                />
              </div>

              {/* Overlay escuro */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-500"></div>
            </motion.div>
          </div>

          {/* Descrição */}
          <p className="text-base sm:text-lg text-gray-400 max-w-lg">
            Plataforma completa para gestão de times de futebol. Cadastre
            jogadores, organize partidas, acompanhe finanças e muito mais.
          </p>

          {/* Botão de ação principal */}
          <Link to="/login" className="block w-fit">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-6 sm:py-3 sm:px-8 rounded-lg shadow-lg transition-all flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              Começar Agora <FaArrowRight className="text-xs sm:text-sm" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Coluna direita - Espaço para imagem/dashboard (apenas desktop) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block w-full"
        >
          {/* Placeholder do dashboard */}
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 aspect-video overflow-hidden group transition-all duration-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-2">
            {/* Efeito de brilho azul */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Container da imagem */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <img
                src="./src/img/sorttimes-img.jpg"
                alt="Painel de Controle"
                className="w-full h-full object-cover brightness-90 group-hover:brightness-110 scale-100 group-hover:scale-105 transition-all duration-500 ease-out"
              />
            </div>

            {/* Overlay escuro */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-500"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}