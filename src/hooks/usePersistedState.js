// src/hooks/usePersistedState.js
import { useState, useEffect } from 'react';

const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    // Verifica se está no navegador e se há dados salvos
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    // Salva no localStorage sempre que o estado mudar
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

export default usePersistedState;