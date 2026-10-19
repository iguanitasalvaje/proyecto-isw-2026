// client/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const [perfilActivo, setPerfilActivo] = useState('Dueño');

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
          {['Dueño', 'Contador', 'Jefe Técnico'].map((rol) => (
            <button
              key={rol}
              onClick={() => setPerfilActivo(rol)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: perfilActivo === rol ? '1px solid #2563eb' : '1px solid transparent',
                background: perfilActivo === rol ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                color: perfilActivo === rol ? '#60a5fa' : '#94a3b8',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {rol}
            </button>
          ))}
        </div>
      </div>

      {/* Navegación por Módulos */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map((item) => (
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