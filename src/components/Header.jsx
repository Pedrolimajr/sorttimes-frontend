import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // Adicione esta linha

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="bg-red-700 text-white shadow-md w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
        <h1 className="text-2xl font-bold">
          <Link to="/">SortTimes</Link>
        </h1>
        
        <nav className="hidden md:flex space-x-6 text-lg font-medium">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/login" className="hover:text-gray-300">Login</Link>
          <Link to="/dashboard" className="hover:text-gray-300">Painel</Link>
        </nav>
        
        <button className="md:hidden focus:outline-none" onClick={toggleMenu}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-red-600 px-4 pb-4">
          <Link to="/" className="block py-2 hover:text-gray-300" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/login" className="block py-2 hover:text-gray-300" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
          <Link to="/dashboard" className="block py-2 hover:text-gray-300" onClick={() => setMenuOpen(false)}>
            Painel
          </Link>
        </div>
      )}
    </header>
  );
}