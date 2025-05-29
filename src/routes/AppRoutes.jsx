// src/routes/AppRoutes.jsx
// src/routes/AppRoutes.jsx
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom"; // Adicionei Navigate aqui
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import CadastroJogadores from "../pages/CadastroJogadores";
import AgendarPartida from "../pages/AgendarPartida";
import PartidasAgendadas from "../pages/PartidasAgendadas";
import SorteioTimes from "../pages/SorteioTimes";
import Financeiro from "../pages/Financeiro";
import ListaJogadores from "../pages/ListaJogadores";
import RecuperarSenha from "../pages/RecuperarSenha";
import Cadastro from "../pages/Cadastro";
import InformacoesPartida from "../pages/InformacoesPartida";
import ConfiguracoesConta from "../pages/ConfiguracoesConta";
import ConfirmarPresenca from '../pages/ConfirmarPresenca';
import PrivateRoute from './PrivateRoute';
import { authService } from '../services/authService';

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const isFixedHeight = ['/', '/login', '/cadastro', '/recuperar-senha'].includes(location.pathname);

  // Verificação global de autenticação
  useEffect(() => {
    const publicRoutes = [
      '/',
      '/login', 
      '/cadastro',
      '/recuperar-senha',
      /^\/confirmar-presenca\/\w+$/ // Regex para rotas com parâmetros
    ];

    const isPublicRoute = publicRoutes.some(route => {
      if (typeof route === 'string') {
        return route === location.pathname;
      } else if (route instanceof RegExp) {
        return route.test(location.pathname);
      }
      return false;
    });

    if (!isPublicRoute && !authService.isAuthenticated()) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [location, navigate]);

  return (
    <div className={isFixedHeight ? 'h-[calc(100vh-64px)]' : 'min-h-full'}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/confirmar-presenca/:linkId" element={<ConfirmarPresenca />} />

        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        {/* ... outras rotas protegidas ... */}
        
        {/* Rota de fallback - redireciona para login */}
        <Route path="*" element={
          <Navigate to="/login" replace />
        } />
      </Routes>
    </div>
  );
}

export default AppRoutes;
