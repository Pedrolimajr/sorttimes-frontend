// Crie um novo arquivo: src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isRestricted, setIsRestricted] = useState(true);
  
  return (
    <AuthContext.Provider value={{ isRestricted, setIsRestricted }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);