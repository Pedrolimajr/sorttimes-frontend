// src/App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from "./routes/AppRoutes";
import Footer from "./components/Footer";
import { usePageLayout } from "./hooks/usePageLayout";
import { AuthProvider } from './context/AuthContext';
import { JogadoresProvider } from './context/JogadoresContext';

function AppContent() {
  const { containerClass, mainClass } = usePageLayout();

  return (
    <div className={`${containerClass} bg-gray-900 text-gray-100 flex flex-col`}>
      <main className={mainClass}>
        <AppRoutes />
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
          <ToastContainer position="top-right" autoClose={3000} />
        </Router>
      </JogadoresProvider>
    </AuthProvider>
  );
}

export default App;