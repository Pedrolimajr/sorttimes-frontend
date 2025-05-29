// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";
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
import InformacoesPartida from "../pages/InformacoesPartida"; // Nome correto do componente
import ConfiguracoesConta from "../pages/ConfiguracoesConta";
import ConfirmarPresenca from '../pages/ConfirmarPresenca';
import PrivateRoute from './PrivateRoute'; // Importando o componente
function AppRoutes() {
  const location = useLocation();
  const isFixedHeight = ['/', '/login'].includes(location.pathname);

  return (
    <div className={isFixedHeight ? 'h-[calc(100vh-64px)]' : 'min-h-full'}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-jogadores" element={<CadastroJogadores />} />
        <Route path="/lista-jogadores" element={<ListaJogadores />} />
        <Route path="/agendar-partida" element={<AgendarPartida />} />
        <Route path="/partidas-agendadas" element={<PartidasAgendadas />} />
        {/* Corrigido o nome do componente abaixo */}
        <Route path="/informacoes-partida/:id" element={<InformacoesPartida />} />
        <Route path="/informacoes-partida" element={<InformacoesPartida />} />
        <Route path="/sorteio-times" element={<SorteioTimes />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/configuracoes" element={<ConfiguracoesConta />} />
        <Route path="/confirmar-presenca/:linkId" element={<ConfirmarPresenca />} />

        
        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/cadastro-jogadores" element={
          <PrivateRoute><CadastroJogadores /></PrivateRoute>
        } />
        <Route path="/lista-jogadores" element={
          <PrivateRoute><ListaJogadores /></PrivateRoute>
        } />
        <Route path="/agendar-partida" element={
          <PrivateRoute><AgendarPartida /></PrivateRoute>
        } />
        <Route path="/partidas-agendadas" element={
          <PrivateRoute><PartidasAgendadas /></PrivateRoute>
        } />
        <Route path="/informacoes-partida/:id" element={
          <PrivateRoute><InformacoesPartida /></PrivateRoute>
        } />
        <Route path="/informacoes-partida" element={
          <PrivateRoute><InformacoesPartida /></PrivateRoute>
        } />
        <Route path="/sorteio-times" element={
          <PrivateRoute><SorteioTimes /></PrivateRoute>
        } />
        <Route path="/financeiro" element={
          <PrivateRoute><Financeiro /></PrivateRoute>
        } />
        <Route path="/configuracoes" element={
          <PrivateRoute><ConfiguracoesConta /></PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default AppRoutes;