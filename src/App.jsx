// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Footer from "./components/Footer";
import { usePageLayout } from "./hooks/usePageLayout";
import { AuthProvider } from './context/AuthContext';
import { JogadoresProvider } from './context/JogadoresContext';

// Importando as páginas para as rotas
import Home from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import RecuperarSenha from './pages/RecuperarSenha';
import Dashboard from './pages/Dashboard';
import CadastroJogadores from './pages/CadastroJogadores';
import ListaJogadores from './pages/ListaJogadores';
import PerfilJogador from './pages/PerfilJogador';
import Financeiro from './pages/Financeiro';
import SorteioTimes from './pages/SorteioTimes';
import AgendarPartida from './pages/AgendarPartida';
import PartidasAgendadas from './pages/PartidasAgendadas';
import InformacoesPartida from './pages/InformacoesPartida';
import PublicMatchInfo from './pages/PublicMatchInfo';
import VotacaoPartida from './pages/VotacaoPartida';
import ConfirmarPresenca from './pages/ConfirmarPresenca';
import ConfirmacaoPresencaToken from './pages/ConfirmacaoPresencaToken';
import ConfiguracoesConta from './pages/ConfiguracoesConta';
import PrivateRoute from './routes/PrivateRoute';

function AppContent() {
  const { containerClass, mainClass } = usePageLayout();

  return (
    <div className={`${containerClass} bg-gray-900 text-gray-100 flex flex-col`}>
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/confirmar-presenca/:linkId" element={<ConfirmarPresenca />} />
          <Route path="/presenca/confirmar/:token" element={<ConfirmacaoPresencaToken />} />
          <Route path="/partida-publica/:linkId" element={<PublicMatchInfo />} />
          <Route path="/votar-partida/:linkId" element={<VotacaoPartida />} />

          {/* Rotas Privadas */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/cadastro-jogadores" element={<PrivateRoute><CadastroJogadores /></PrivateRoute>} />
          <Route path="/lista-jogadores" element={<PrivateRoute><ListaJogadores /></PrivateRoute>} />
          <Route path="/perfil-jogador/:id" element={<PrivateRoute><PerfilJogador /></PrivateRoute>} />
          <Route path="/financeiro" element={<PrivateRoute><Financeiro /></PrivateRoute>} />
          <Route path="/sorteio-times" element={<PrivateRoute><SorteioTimes /></PrivateRoute>} />
          <Route path="/agendar-partida" element={<PrivateRoute><AgendarPartida /></PrivateRoute>} />
          <Route path="/partidas-agendadas" element={<PrivateRoute><PartidasAgendadas /></PrivateRoute>} />
          <Route path="/informacoes-partida" element={<PrivateRoute><InformacoesPartida /></PrivateRoute>} />
          <Route path="/informacoes-partida/:id" element={<PrivateRoute><InformacoesPartida /></PrivateRoute>} />
          <Route path="/configuracoes" element={<PrivateRoute><ConfiguracoesConta /></PrivateRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <JogadoresProvider>
        <Router>
          <AppContent />
          <ToastContainer 
            position="bottom-right"
            autoClose={2000}
            hideProgressBar={true}
            closeOnClick={true}
            pauseOnHover={false}
            draggable={false}
            closeButton={false}
            style={{
              background: '#1F2937',
              color: '#fff',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              maxWidth: '300px',
              margin: '0.5rem'
            }}
          />
        </Router>
      </JogadoresProvider>
    </AuthProvider>
  );
}

export default App;