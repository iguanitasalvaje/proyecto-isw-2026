import { useState, useEffect } from 'react';
import FormularioTransmision from '../components/ui/FormularioTransmision';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/permisos';

const Eventos = () => {
  const { rolActivo } = useAuth();
  const puedeAdministrarEventos = rolActivo === ROLES.DUENO;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener los eventos reales desde el backend / PostgreSQL
  const cargarEventos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await api('/eventos');
      setEventos(data);
    } catch (err) {
      console.error('Error al obtener eventos:', err);
      setError(err.message || 'No se pudieron cargar los eventos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // Formateador auxiliar para fechas o montos financieros
  const formatearDinero = (monto) => {
    const num = Number(monto) || 0;
    return `$${num.toLocaleString('es-CL')}`;
  };

  // Cálculo de rentabilidad total acumulada para la cabecera
  const rentabilidadTotal = eventos.reduce((acc, ev) => {
    const precio = Number(ev.monto_total || ev.precioBase || 0);
    const gastos = Number(ev.gastos_monto || 0);
    return acc + (precio - gastos);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-8 font-sans relative">

      {/* Encabezado con totales automáticos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Eventos</h1>
          <p className="text-slate-400 text-sm mt-1">
            {eventos.length} eventos · Rentabilidad total:{' '}
            <span className="text-green-500 font-bold">
              {formatearDinero(rentabilidadTotal)}
            </span>
          </p>
        </div>

        {puedeAdministrarEventos && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer self-start md:self-auto"
          >
            + Nuevo Evento
          </button>
        )}
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
              // Soporte dinámico para datos del backend y fallback visual
              const precioBase = Number(ev.precio_base || ev.precioBase || 0);
              const montoPagado = Number(ev.monto_pagado || ev.montoPagado || 0);
              const requiereAlerta = montoPagado < precioBase * 0.5;

              const fechaFormatted = ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : (ev.fecha || 'Sin fecha');
              const horaFormatted = ev.fecha ? new Date(ev.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : (ev.hora || '12:00');

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
                    <div className="text-slate-100 font-medium">{fechaFormatted}</div>
                    <div className="text-xs">{horaFormatted}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-white">{ev.nombre}</div>
                    <div className="text-slate-400 text-xs">{ev.cliente || 'Cliente General'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md text-xs border border-slate-700">
                      {ev.tipo || 'Transmisión'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    <div className="text-slate-200">{ev.lugar || 'Por definir'}</div>
                    <div className="text-xs">{ev.ciudad || 'Santiago'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                      ev.estado === 'Confirmado' || ev.estado === 'en_curso'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {ev.estado || 'Agendado'}
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
                    {formatearDinero(precioBase)}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-100">
                    {formatearDinero(montoPagado)}
                  </td>
                  <td className="px-4 py-4 text-red-400">{ev.gastos || '$0'}</td>
                  <td className="px-4 py-4 text-green-500 font-bold">{ev.rentabilidad || formatearDinero(precioBase - (ev.gastos_monto || 0))}</td>
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
            <FormularioTransmision
              onClose={() => setMostrarFormulario(false)}
              onEventoCreado={cargarEventos}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Eventos;
