// client/src/components/Sidebar.jsx

import { useAuth } from '../context/AuthContext';
import { ROLES, tienePermiso } from '../config/permisos';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const { usuario, rolActivo, logout } = useAuth();

  const nombresRoles = {
    [ROLES.DUENO]: 'Dueño',
    [ROLES.CONTADOR]: 'Contador',
    [ROLES.JEFE_TECNICO]: 'Jefe Técnico',
  };

  const perfilActivo = nombresRoles[rolActivo] ?? 'Sin perfil';

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Inventario', path: '/inventario' },
    { label: 'Personal', path: '/personal' },
    { label: 'Auspiciadores', path: '/auspiciadores' },
    { label: 'Finanzas', path: '/finanzas' },
    { label: 'Reportes', path: '/reportes' },
    { label: 'Calculadora de Pagos', path: '/calculadora-pagos' },
    { label: 'Gestión Usuarios', path: '/usuarios' }, // Solo Dueño
  ];

  // Mostrar solamente los módulos permitidos para el rol según la matriz definitiva
  const navItemsVisibles = navItems.filter((item) =>
    tienePermiso(rolActivo, item.path)
  );

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: '#0b1120',
      borderRight: '1px solid #1e293b',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Logo Six Seven */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '28px'
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: '#2563eb',
          color: '#ffffff',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px'
        }}>
          67
        </div>

        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '14px',
            color: '#f8fafc',
            lineHeight: 1.1
          }}>
            Six Seven
          </div>
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            letterSpacing: '0.05em'
          }}>
            TRANSMISIONES
          </div>
        </div>
      </div>

      {/* Navegación por módulos */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1
      }}>
        {navItemsVisibles.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              background: isActive ? '#1e293b' : 'transparent',
              color: isActive ? '#38bdf8' : '#94a3b8',
              borderLeft: isActive
                ? '3px solid #38bdf8'
                : '3px solid transparent',
              transition: 'all 0.15s ease'
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Información del usuario autenticado y Cerrar Sesión */}
      <div style={{
        borderTop: '1px solid #1e293b',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>
          <div style={{
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {usuario?.email || 'Usuario'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748b',
            fontSize: '11px',
            marginTop: '2px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#38bdf8'
            }}></span>
            <span>{perfilActivo}</span>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
