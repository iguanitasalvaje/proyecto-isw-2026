/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { api, guardarToken, obtenerToken, eliminarToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Inicializamos cargando en true únicamente si existe un token previo por verificar
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()));
  const [errorAuth, setErrorAuth] = useState(null);

  // Verifica si ya existe un token almacenado e intenta recuperar la sesión
  useEffect(() => {
    let activo = true;
    const token = obtenerToken();

    if (!token) {
      return;
    }

    api('/auth/me')
      .then((res) => {
        if (activo) {
          setUsuario(res.usuario);
          setErrorAuth(null);
        }
      })
      .catch(() => {
        if (activo) {
          eliminarToken();
          setUsuario(null);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  // Iniciar sesión con email y contraseña
  const login = async (email, password) => {
    setErrorAuth(null);
    try {
      const datos = await api('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      guardarToken(datos.token);
      setUsuario(datos.usuario);
      return datos.usuario;
    } catch (err) {
      const mensaje = err.message || 'No se pudo iniciar sesión. Verifica tus credenciales.';
      setErrorAuth(mensaje);
      throw err;
    }
  };

  // Cerrar sesión
  const logout = () => {
    eliminarToken();
    setUsuario(null);
    setErrorAuth(null);
  };

  const rolActivo = usuario?.rol || null;
  const estaAutenticado = Boolean(usuario);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        rolActivo,
        estaAutenticado,
        cargando,
        errorAuth,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return contexto;
}
