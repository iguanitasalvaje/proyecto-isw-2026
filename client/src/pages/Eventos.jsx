import React, { useState } from 'react';
import FormularioTransmision from '../components/ui/FormularioTransmision';

const Eventos = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const eventos = [
    {
      id: 1,
      fecha: '05 sept 2025',
      hora: '14:00',
      nombre: 'Lanzamiento Producto Falabella',
      cliente: 'Falabella Corporativo',
      tipo: 'Corporativo',
      lugar: 'Hotel W Santiago',
      ciudad: 'Santiago',
      estado: 'Confirmado',
      precioBase: 480000,
      montoPagado: 240000, // 50% (OK)
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
      lugar: 'Estadio Monumental',
      ciudad: 'Santiago',
      estado: 'Confirmado',
      precioBase: 1200000,
      montoPagado: 300000, // 25% -> ALERTA ROJA (< 50%)
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
      lugar: 'Gimnasio Municipal Ñuñoa',
      ciudad: 'Santiago',
      estado: 'En Curso',
      precioBase: 600000,
      montoPagado: 600000, // 100% (OK)
      gastos: '$290.000',
      rentabilidad: '+$310.000',
    },
    {
      id: 4,
      fecha: '16 ago 2025',
      hora: '11:00',
      nombre: 'Graduación Ingeniería 2025',
      cliente: 'Universidad del Pacífico',
      tipo: 'Graduación',
      lugar: 'Casino Enjoy',
      ciudad: 'Santiago',
      estado: 'Agendado',
      precioBase: 320000,
      montoPagado: 100000, // 31.25% -> ALERTA ROJA (< 50%)
      gastos: '$165.000',
      rentabilidad: '+$155.000',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-8 font-sans relative">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Eventos</h1>
          <p className="text-slate-400 text-sm mt-1">
            5 eventos · Rentabilidad total: <span className="text-green-500 font-bold">$2.180.000</span>
          </p>
        </div>
        
        <button 
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer self-start md:self-auto"
        >
          + Nuevo Evento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Buscar evento, cliente, ciudad..." 
          className="bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-md w-full sm:w-80 focus:outline-none focus:border-blue-500"
        />
        <select className="bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-md focus:outline-none focus:border-blue-500 cursor-pointer">
          <option>Todos los estados</option>
        </select>
        <select className="bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-md focus:outline-none focus:border-blue-500 cursor-pointer">
          <option>Todos los tipos</option>
        </select>
      </div>

      {/* Tabla Completa con TODAS las columnas */}
      <div className="bg-slate-800 rounded-xl overflow-x-auto border border-slate-700 shadow-lg">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
              <th className="px-4 py-4">Fecha</th>
              <th className="px-4 py-4">Evento / Cliente</th>
              <th className="px-4 py-4">Tipo</th>
              <th className="px-4 py-4">Lugar</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4">Garantía</th>
              <th className="px-4 py-4">Precio Base</th>
              <th className="px-4 py-4">Pagado</th>
              <th className="px-4 py-4">Gastos</th>
              <th className="px-4 py-4">Rentabilidad</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60">
            {eventos.map((ev) => {
              const requiereAlerta = ev.montoPagado < ev.precioBase * 0.5;

              return (
                <tr 
                  key={ev.id} 
                  className={`transition-colors ${
                    requiereAlerta 
                      ? 'bg-red-950/20 hover:bg-red-950/40' 
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <td className="px-4 py-4 text-slate-400">
                    <div className="text-slate-100 font-medium">{ev.fecha}</div>
                    <div className="text-xs">{ev.hora}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-white">{ev.nombre}</div>
                    <div className="text-slate-400 text-xs">{ev.cliente}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md text-xs border border-slate-700">
                      {ev.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    <div className="text-slate-200">{ev.lugar}</div>
                    <div className="text-xs">{ev.ciudad}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                      ev.estado === 'Confirmado' 
                        ? 'bg-blue-950 text-blue-400 border border-blue-800' 
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {ev.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {requiereAlerta ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs bg-red-900/80 text-red-200 border border-red-600 animate-pulse">
                        ⚠️Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ✓ Pagada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-200 font-medium">
                    ${ev.precioBase.toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-100">
                    ${ev.montoPagado.toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-4 text-red-400">{ev.gastos}</td>
                  <td className="px-4 py-4 text-green-500 font-bold">{ev.rentabilidad}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="border border-slate-700 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer">
                      Gestionar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-lg bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            <button 
              onClick={() => setMostrarFormulario(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-xl px-2 py-1 rounded cursor-pointer z-10"
            >
              ✕
            </button>
            <FormularioTransmision onClose={() => setMostrarFormulario(false)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default Eventos;