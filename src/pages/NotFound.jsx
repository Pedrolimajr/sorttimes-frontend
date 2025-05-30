// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center p-4">
      <h1 className="text-5xl font-bold mb-4 text-blue-400">404</h1>
      <p className="text-lg mb-6">Página não encontrada.</p>
      <Link 
        to="/" 
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md transition"
      >
        Voltar para a Home
      </Link>
    </div>
  );
}
