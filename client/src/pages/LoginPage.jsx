import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, estaAutenticado, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si ya tiene sesión, redirigir al Dashboard
  if (!cargando && estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal('');

    if (!email.trim() || !password) {
      setErrorLocal('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setEnviando(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorLocal(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          boxSizing: 'border-box'
        }}
      >
        {/* Logo y Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }}
          >
            67
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
            Six Seven Transmisiones
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Control de acceso y gestión operativa
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorLocal && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: '1.4'
            }}
          >
            {errorLocal}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px'
              }}
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@sixseven.cl"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0b1120',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px'
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0b1120',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: enviando ? '#1d4ed8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: enviando ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              opacity: enviando ? 0.8 : 1
            }}
          >
            {enviando ? 'Verificando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
