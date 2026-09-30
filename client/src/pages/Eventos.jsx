import React from 'react';

const Eventos = () => {
  // Datos simulados solo para el diseño visual
  const eventos = [
    {
      id: 1,
      fecha: '05 sept 2025',
      hora: '14:00',
      nombre: 'Lanzamiento Producto Falabella',
      cliente: 'Falabella Corporativo',
      tipo: 'Corporativo',
      tipoColor: '#1e293b',
      lugar: 'Hotel W Santiago',
      ciudad: 'Santiago',
      estado: 'Confirmado',
      estadoBg: '#1e3a8a',
      estadoColor: '#60a5fa',
      ingresos: '$480.000',
      gastos: '$165.000',
      rentabilidad: '+$315.000',
    },
    {
      id: 2,
      fecha: '30 ago 2025',
      hora: '18:00',
      nombre: 'Final Copa Chile Sub-17',
      cliente: 'ANFP',
      tipo: 'Deportivo',
      tipoColor: '#1e293b',
      lugar: 'Estadio Monumental',
      ciudad: 'Santiago',
      estado: 'Confirmado',
      estadoBg: '#1e3a8a',
      estadoColor: '#60a5fa',
      ingresos: '$1.200.000',
      gastos: '$393.000',
      rentabilidad: '+$807.000',
    },
    {
      id: 3,
      fecha: '23 ago 2025',
      hora: '09:00',
      nombre: 'Torneo Interempresas Basketball',
      cliente: 'Copec Empresas',
      tipo: 'Deportivo',
      tipoColor: '#1e293b',
      lugar: 'Gimnasio Municipal Ñuñoa',
      ciudad: 'Santiago',
      estado: 'En Curso',
      estadoBg: '#713f12',
      estadoColor: '#facc15',
      ingresos: '$600.000',
      gastos: '$290.000',
      rentabilidad: '+$310.000',
    },
    {
      id: 4,
      fecha: '16 ago 2025',
      hora: '11:00',
      nombre: 'Graduación Ingeniería 2025',
      cliente: 'Universidad del Pacífico',
      tipo: 'Graduacion',
      tipoColor: '#3b0764',
      lugar: 'Casino Enjoy',
      ciudad: 'Santiago',
      estado: 'Confirmado',
      estadoBg: '#1e3a8a',
      estadoColor: '#60a5fa',
      ingresos: '$320.000',
      gastos: '$165.000',
      rentabilidad: '+$155.000',
    },
  ];

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '30px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Eventos</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '5px' }}>
            5 eventos · Rentabilidad total: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>$2.180.000</span>
          </p>
        </div>
        <button style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          cursor: 'pointer'
        }}>
          + Nuevo Evento
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <input 
          type="text" 
          placeholder="Buscar evento, cliente, ciudad..." 
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc',
            padding: '10px 15px',
            borderRadius: '6px',
            width: '300px'
          }}
        />
        <select style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 15px', borderRadius: '6px' }}>
          <option>Todos los estados</option>
        </select>
        <select style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 15px', borderRadius: '6px' }}>
          <option>Todos los tipos</option>
        </select>
      </div>

      {/* Tabla de Eventos */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <th style={{ padding: '15px 20px' }}>Fecha</th>
              <th style={{ padding: '15px 20px' }}>Evento</th>
              <th style={{ padding: '15px 20px' }}>Tipo</th>
              <th style={{ padding: '15px 20px' }}>Lugar</th>
              <th style={{ padding: '15px 20px' }}>Estado</th>
              <th style={{ padding: '15px 20px' }}>Ingresos</th>
              <th style={{ padding: '15px 20px' }}>Gastos</th>
              <th style={{ padding: '15px 20px' }}>Rentabilidad</th>
              <th style={{ padding: '15px 20px' }}></th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px 20px', color: '#94a3b8' }}>
                  <div style={{ color: '#f8fafc', fontWeight: '500' }}>{ev.fecha}</div>
                  <div style={{ fontSize: '0.8rem' }}>{ev.hora}</div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{ev.nombre}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{ev.cliente}</div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{
                    backgroundColor: ev.tipoColor,
                    color: '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    border: '1px solid #334155'
                  }}>
                    {ev.tipo}
                  </span>
                </td>
                <td style={{ padding: '15px 20px', color: '#94a3b8' }}>
                  <div style={{ color: '#cbd5e1' }}>{ev.lugar}</div>
                  <div style={{ fontSize: '0.8rem' }}>{ev.ciudad}</div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{
                    backgroundColor: ev.estadoBg,
                    color: ev.estadoColor,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {ev.estado}
                  </span>
                </td>
                <td style={{ padding: '15px 20px', color: '#22c55e', fontWeight: 'bold' }}>{ev.ingresos}</td>
                <td style={{ padding: '15px 20px', color: '#ef4444' }}>{ev.gastos}</td>
                <td style={{ padding: '15px 20px', color: '#22c55e', fontWeight: 'bold' }}>{ev.rentabilidad}</td>
                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                  <button style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}>
                    Vista rápida
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Eventos;