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