import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../config/permisos';

export default function RutaProtegida({ ruta, children }) {
  const { usuario, rolActivo, estaAutenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          color: '#94a3b8',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
            Six Seven Transmisiones
          </div>
          <p style={{ fontSize: '13px', margin: 0 }}>Comprobando sesión activa...</p>
        </div>
      </div>
    );
  }

  // 1. Sin sesión activa: Redirigir a Login recordando la ruta de origen
  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Con sesión y con permiso para el módulo
  if (tienePermiso(rolActivo, ruta)) {
    return children;
  }

  // 3. Con sesión pero sin permiso para esta sección (403)
  return (
    <div
      style={{
        minHeight: '100%',
        padding: '40px 30px',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '620px',
          margin: '70px auto',
          padding: '40px',
          backgroundColor: '#151b26',
          border: '1px solid #263142',
          borderRadius: '12px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '46px',
            marginBottom: '12px',
            color: '#ef4444',
            fontWeight: '700',
          }}
        >
          403
        </div>

        <h2
          style={{
            fontSize: '24px',
            color: '#ffffff',
            fontWeight: '700',
            marginBottom: '12px',
          }}
        >
          Acceso no autorizado
        </h2>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '15px',
            lineHeight: '1.7',
          }}
        >
          Tu cuenta con rol <strong>{usuario?.rol}</strong> no tiene permisos para acceder al módulo{' '}
          <code style={{ background: '#0b1120', padding: '2px 6px', borderRadius: '4px', color: '#60a5fa' }}>{ruta}</code>.
        </p>

        <div style={{ marginTop: '28px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
