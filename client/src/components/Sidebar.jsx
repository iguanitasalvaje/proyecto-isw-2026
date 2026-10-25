// client/src/components/Sidebar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/permisos';
import { NavLink } from 'react-router-dom';
import { tienePermiso } from '../config/permisos';

export default function Sidebar() {
  const { rolActivo, setRolActivo } = useAuth();

  const perfiles = [
    { nombre: 'Dueño', rol: ROLES.DUENO },
    { nombre: 'Contador', rol: ROLES.CONTADOR },
    { nombre: 'Jefe Técnico', rol: ROLES.JEFE_TECNICO },
  ];

  const perfilActivo =
    perfiles.find((perfil) => perfil.rol === rolActivo)?.nombre ?? 'Sin perfil';

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Inventario', path: '/inventario' },
    { label: 'Personal', path: '/personal' },
    { label: 'Auspiciadores', path: '/auspiciadores' },
    { label: 'Finanzas', path: '/finanzas' },
    { label: 'Reportes', path: '/reportes' },
    { label: 'Calculadora Pagos', path: '/calculadora-pagos' },
  ];

  // Filtramos únicamente los tres módulos definidos en RF1.
  // Los demás permanecen visibles hasta definir sus permisos.
  const modulosRF1 = ['/eventos', '/finanzas', '/inventario'];

  const navItemsVisibles = navItems.filter((item) => {
    if (!modulosRF1.includes(item.path)) {
     return true;
    }

    return tienePermiso(rolActivo, item.path);
  });

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
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
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc', lineHeight: 1.1 }}>Six Seven</div>
          <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.05em' }}>TRANSMISIONES</div>
        </div>
      </div>

      {/* Switch de Perfil (RF1) */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>
          Perfil Activo
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
          {perfiles.map(({ nombre, rol }) => (
            <button
              key={rol}
              onClick={() => setRolActivo(rol)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: rolActivo === rol ? '1px solid #2563eb' : '1px solid transparent',
                background: rolActivo === rol ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                color: rolActivo === rol ? '#60a5fa' : '#94a3b8',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Navegación por Módulos */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
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
              borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent'
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer de Perfil */}
      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
        <span>{perfilActivo}</span>
      </div>
    </aside>
  );
}