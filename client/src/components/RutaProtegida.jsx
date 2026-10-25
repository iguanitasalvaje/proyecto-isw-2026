import { tienePermiso } from '../config/permisos';

function RutaProtegida({ rol, ruta, children }) {
  const sinSesion = !rol;

  if (!sinSesion && tienePermiso(rol, ruta)) {
    return children;
  }

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
            color: '#3b82f6',
            fontWeight: '700',
          }}
        >
          {sinSesion ? '401' : '403'}
        </div>

        <h2
          style={{
            fontSize: '24px',
            color: '#ffffff',
            fontWeight: '700',
            marginBottom: '12px',
          }}
        >
          {sinSesion ? 'Sesión requerida' : 'Acceso denegado'}
        </h2>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '15px',
            lineHeight: '1.7',
          }}
        >
          {sinSesion
            ? 'Debes iniciar sesión para acceder a este módulo.'
            : 'Tu perfil no tiene los permisos necesarios para acceder a esta sección.'}
        </p>

        <div
          style={{
            marginTop: '28px',
            padding: '12px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            color: '#60a5fa',
            fontSize: '13px',
          }}
        >
          {sinSesion
            ? 'Inicia sesión con una cuenta autorizada.'
            : 'Contacta al administrador si necesitas acceso.'}
        </div>
      </div>
    </div>
  );
}

export default RutaProtegida;