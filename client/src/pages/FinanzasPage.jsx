// client/src/pages/FinanzasPage.jsx
import React from 'react';

const GASTOS_CATEGORIA = [
  { nombre: 'Sueldos', porcentaje: '76.0%', monto: '$965.000', color: '#a855f7' },
  { nombre: 'Transporte', porcentaje: '14.6%', monto: '$185.000', color: '#3b82f6' },
  { nombre: 'Alimentación', porcentaje: '7.9%', monto: '$100.000', color: '#22c55e' },
  { nombre: 'Peajes', porcentaje: '1.6%', monto: '$20.000', color: '#f97316' },
];

const AUSPICIADORES = [
  { empresa: 'Banco BCI', estado: 'Pagado', deuda: '—' },
  { empresa: 'Gatorade Chile', estado: 'Parcial', deuda: '$150.000' },
  { empresa: 'Universidad del Pacífico', estado: 'Pendiente', deuda: '$200.000' },
  { empresa: 'Copec Empresas', estado: 'Pagado', deuda: '—' },
  { empresa: 'Movistar Deportes', estado: 'Pendiente', deuda: '$800.000' },
];

const RENTABILIDAD_EVENTOS = [
  { evento: 'Final Copa Chile Sub-17', fecha: '30-ago', ingresos: '$1.200.000', gastos: '$393.000', rentabilidad: '+$807.000', margen: '67.3%', barra: '67%' },
  { evento: 'Liga Regional de Fútbol - Jornada 12', fecha: '09-ago', ingresos: '$850.000', gastos: '$257.000', rentabilidad: '+$593.000', margen: '69.8%', barra: '70%' },
  { evento: 'Lanzamiento Producto Falabella', fecha: '05-sept', ingresos: '$480.000', gastos: '$165.000', rentabilidad: '+$315.000', margen: '65.6%', barra: '65%' },
  { evento: 'Torneo Interempresas Basketball', fecha: '23-ago', ingresos: '$600.000', gastos: '$290.000', rentabilidad: '+$310.000', margen: '51.7%', barra: '52%' },
  { evento: 'Graduación Ingeniería 2025', fecha: '16-ago', ingresos: '$320.000', gastos: '$165.000', rentabilidad: '+$155.000', margen: '48.4%', barra: '48%' },
];

export default function FinanzasPage() {
  const badgeEstado = (estado) => {
    switch (estado) {
      case 'Pagado':
        return { color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)' };
      case 'Parcial':
        return { color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' };
      case 'Pendiente':
        return { color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)' };
      default:
        return { color: '#94a3b8', background: '#1e293b' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', padding: '32px 48px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Título de la vista */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Finanzas</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>Resumen financiero consolidado</p>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Ingresos Brutos</span>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80', margin: '10px 0 4px 0' }}>$3.450.000</p>
          <span style={{ fontSize: '12px', color: '#64748b' }}>5 eventos</span>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Gastos Totales</span>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171', margin: '10px 0 4px 0' }}>$1.270.000</p>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Operativos</span>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Rentabilidad Neta</span>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80', margin: '10px 0 4px 0' }}>+$2.180.000</p>
          <span style={{ fontSize: '12px', color: '#4ade80' }}>Margen 63.2%</span>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Por Cobrar</span>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24', margin: '10px 0 4px 0' }}>$1.150.000</p>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Auspiciadores</span>
        </div>
      </div>

      {/* Bloque central: Gastos por Categoría y Auspicio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        
        {/* Gastos por Categoría */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', color: '#ffffff' }}>Gastos por Categoría</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {GASTOS_CATEGORIA.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: cat.color }}></span>
                    <span style={{ color: '#f8fafc' }}>{cat.nombre}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', marginRight: '12px' }}>{cat.porcentaje}</span>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{cat.monto}</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: cat.porcentaje, height: '100%', background: cat.color, borderRadius: '2px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auspicio */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Auspicio</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>49% cobrado</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ width: '49%', height: '100%', background: '#22c55e', borderRadius: '3px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '20px' }}>
            <span style={{ color: '#4ade80' }}>Cobrado: $1.100.000</span>
            <span style={{ color: '#fbbf24' }}>Pendiente: $1.150.000</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={{ paddingBottom: '10px', fontWeight: 600 }}>EMPRESA</th>
                <th style={{ paddingBottom: '10px', fontWeight: 600 }}>ESTADO</th>
                <th style={{ paddingBottom: '10px', fontWeight: 600, textAlign: 'right' }}>DEUDA</th>
              </tr>
            </thead>
            <tbody>
              {AUSPICIADORES.map((ausp, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 0', color: '#f8fafc' }}>{ausp.empresa}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{ ...badgeEstado(ausp.estado), padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      {ausp.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: ausp.deuda === '—' ? '#475569' : '#fbbf24', fontWeight: 600 }}>
                    {ausp.deuda}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Tabla inferior: Rentabilidad por Evento */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Rentabilidad por Evento</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ background: '#0b1120', color: '#64748b', borderBottom: '1px solid #1e293b' }}>
            <tr>
              <th style={{ padding: '14px 24px', fontWeight: 600 }}>EVENTO</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>FECHA</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>INGRESOS</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>GASTOS</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>RENTABILIDAD</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>MARGEN</th>
              <th style={{ padding: '14px 24px', fontWeight: 600 }}>BARRA</th>
            </tr>
          </thead>
          <tbody>
            {RENTABILIDAD_EVENTOS.map((ev, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '14px 24px', color: '#f8fafc', fontWeight: 500 }}>{ev.evento}</td>
                <td style={{ padding: '14px 20px', color: '#64748b', fontFamily: 'monospace' }}>{ev.fecha}</td>
                <td style={{ padding: '14px 20px', color: '#4ade80', textAlign: 'right', fontWeight: 600 }}>{ev.ingresos}</td>
                <td style={{ padding: '14px 20px', color: '#f87171', textAlign: 'right', fontWeight: 600 }}>{ev.gastos}</td>
                <td style={{ padding: '14px 20px', color: '#4ade80', textAlign: 'right', fontWeight: 600 }}>{ev.rentabilidad}</td>
                <td style={{ padding: '14px 20px', color: '#f8fafc', textAlign: 'right' }}>{ev.margen}</td>
                <td style={{ padding: '14px 24px' }}>
                  <div style={{ width: '100px', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: ev.barra, height: '100%', background: '#22c55e', borderRadius: '2px' }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}