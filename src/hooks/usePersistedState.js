import { useState, useEffect } from 'react';

const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    try {
      // Verifica se estamos no cliente (navegador) antes de acessar localStorage
      if (typeof window !== 'undefined') {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [key, state]);

  return [state, setState];
};

export default usePersistedState;