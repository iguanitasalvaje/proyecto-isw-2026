import React, { useState } from 'react';

const EQUIPOS_INICIALES = [
  { id: 1, nombre: 'Sony FX3 #1', tipo: 'Cámara', serie: 'SN-FX3-001', estado: 'Disponible', kits: ['Fútbol', 'Corporativo'] },
  { id: 2, nombre: 'Sony FX3 #2', tipo: 'Cámara', serie: 'SN-FX3-002', estado: 'En Uso', kits: ['Fútbol'] },
  { id: 3, nombre: 'Canon C70 #1', tipo: 'Cámara', serie: 'CN-C70-001', estado: 'Disponible', kits: ['Fútbol', 'Graduación'] },
  { id: 4, nombre: 'Trípode Manfrotto #1', tipo: 'Trípode', serie: 'MF-T100-001', estado: 'Disponible', kits: ['Fútbol', 'Graduación'] },
  { id: 5, nombre: 'Trípode Manfrotto #2', tipo: 'Trípode', serie: 'MF-T100-002', estado: 'Dañado', kits: [] },
  { id: 6, nombre: 'Cable HDMI 15m #2', tipo: 'Cable', serie: 'HDMI-15-002', estado: 'Perdido', kits: [] },
  { id: 7, nombre: 'Mezcladora Blackmagic ATEM Mini', tipo: 'Switch', serie: 'BM-AM-001', estado: 'Disponible', kits: ['Fútbol', 'Corporativo'] },
];

export default function InventarioPage() {
  const [tabActiva, setTabActiva] = useState('equipos');

  const obtenerEstiloBadge = (estado) => {
    switch (estado) {
      case 'Disponible':
        return { color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)' };
      case 'En Uso':
        return { color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.25)' };
      case 'Dañado':
        return { color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)' };
      case 'Perdido':
        return { color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.25)' };
      default:
        return { color: '#94a3b8', background: '#1e293b' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', padding: '32px 48px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Inventario</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>14 equipos registrados · 4 kits configurados</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '9px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            + Nuevo Kit
          </button>
          <button style={{ padding: '9px 18px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            + Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Tarjetas resumen (RF9 / RF13) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '28px 0' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Disponibles</span>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ade80', margin: '10px 0 0 0' }}>10</p>
        </div>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>En Uso</span>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa', margin: '10px 0 0 0' }}>2</p>
        </div>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Dañados</span>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', margin: '10px 0 0 0' }}>1</p>
        </div>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Perdidos</span>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171', margin: '10px 0 0 0' }}>1</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'kits', label: 'Kits' },
          { id: 'equipos', label: 'Todos los Equipos' },
          { id: 'bajas', label: 'Dados de Baja' },
        ].map((tab) => {
          const activo = tabActiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: tab.id === 'bajas' && activo ? '1px solid #ef4444' : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                background: activo
                  ? tab.id === 'bajas' ? 'rgba(239, 68, 68, 0.2)' : '#2563eb'
                  : '#0f172a',
                color: activo ? (tab.id === 'bajas' ? '#f87171' : '#ffffff') : '#64748b',
                transition: '0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabla de Equipos */}
      {tabActiva === 'equipos' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ background: '#0b1120', color: '#64748b', borderBottom: '1px solid #1e293b' }}>
              <tr>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Equipo</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Serie</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Kits</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPOS_INICIALES.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500, color: '#f8fafc' }}>{item.nombre}</td>
                  <td style={{ padding: '14px 20px', color: '#94a3b8' }}>{item.tipo}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b', fontFamily: 'monospace' }}>{item.serie}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ ...obtenerEstiloBadge(item.estado), padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                      {item.estado}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.kits.length > 0 ? (
                        item.kits.map((k, idx) => (
                          <span key={idx} style={{ background: '#1e293b', color: '#cbd5e1', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
                            {k}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#475569' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {(item.estado === 'Dañado' || item.estado === 'Perdido') && (
                      <button style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '6px', cursor: 'pointer' }}>
                        Dar de baja
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Dados de Baja */}
      {tabActiva === 'bajas' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1e293b', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'justify-center', margin: '0 auto 16px auto', fontSize: '20px', lineHeight: '48px' }}>
            ✓
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#f8fafc' }}>Sin equipos dados de baja</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Los equipos eliminados del inventario aparecerán aquí.</p>
        </div>
      )}

      {/* Vista Kits */}
      {tabActiva === 'kits' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Configuración y asignación de Kits lógicos (en construcción).
        </div>
      )}

    </div>
  );
}