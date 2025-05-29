// src/routes/AppRoutes.jsx

import React from 'react';
import { 
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CadastroJogadores from '../pages/CadastroJogadores';
import AgendarPartida from '../pages/AgendarPartida';
import PartidasAgendadas from '../pages/PartidasAgendadas';
import SorteioTimes from '../pages/SorteioTimes';
import Financeiro from '../pages/Financeiro';
import ListaJogadores from '../pages/ListaJogadores';
import RecuperarSenha from '../pages/RecuperarSenha';
import Cadastro from '../pages/Cadastro';
import InformacoesPartida from '../pages/InformacoesPartida';
import ConfiguracoesConta from '../pages/ConfiguracoesConta';
import ConfirmarPresenca from '../pages/ConfirmarPresenca';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to /login with current location stored in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isFixedHeight = ['/', '/login', '/cadastro', '/recuperar-senha'].includes(location.pathname);

  return (
    <div className={isFixedHeight ? 'h-[calc(100vh-64px)]' : 'min-h-full'}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/confirmar-presenca/:linkId" element={<ConfirmarPresenca />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/cadastro-jogadores" element={
          <ProtectedRoute>
            <CadastroJogadores />
          </ProtectedRoute>
        } />
        <Route path="/lista-jogadores" element={
          <ProtectedRoute>
            <ListaJogadores />
          </ProtectedRoute>
        } />
        <Route path="/agendar-partida" element={
          <ProtectedRoute>
            <AgendarPartida />
          </ProtectedRoute>
        } />
        <Route path="/partidas-agendadas" element={
          <ProtectedRoute>
            <PartidasAgendadas />
          </ProtectedRoute>
        } />
        <Route path="/informacoes-partida/:id" element={
          <ProtectedRoute>
            <InformacoesPartida />
          </ProtectedRoute>
        } />
        <Route path="/informacoes-partida" element={
          <ProtectedRoute>
            <InformacoesPartida />
          </ProtectedRoute>
        } />
        <Route path="/sorteio-times" element={
          <ProtectedRoute>
            <SorteioTimes />
          </ProtectedRoute>
        } />
        <Route path="/financeiro" element={
          <ProtectedRoute>
            <Financeiro />
          </ProtectedRoute>
        } />
        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <ConfiguracoesConta />
          </ProtectedRoute>
        } />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default AppRoutes;
