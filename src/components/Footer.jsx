import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>© {new Date().getFullYear()} SortTimes</span>
            <span>•</span>
            <span>Todos os direitos reservados</span>
          </div>
          <p className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors">
            Desenvolvido por Pedro Júnior
          </p>
        </div>
      </div>
    </footer>
  );
}