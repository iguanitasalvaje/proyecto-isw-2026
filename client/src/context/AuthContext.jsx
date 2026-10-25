import { createContext, useContext, useState } from 'react';
import { ROLES } from '../config/permisos';

// Contexto para compartir el perfil en el frontend
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Perfil simulado para desarrollar RF1.
  // NO representa una sesión autenticada.
  const [rolActivo, setRolActivo] = useState(ROLES.DUENO);

  return (
    <AuthContext.Provider
      value={{
        rolActivo,
        setRolActivo,
        esDemo: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Permite acceder al perfil desde otros componentes.
export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return contexto;
}