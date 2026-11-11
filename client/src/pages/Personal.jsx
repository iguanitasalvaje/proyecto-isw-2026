import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Personal = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [roles, setRoles] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

  // Formulario de creación (RF4)
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRolId, setNuevoRolId] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaTarifa, setNuevaTarifa] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar datos reales desde PostgreSQL (Neon)
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [personasData, rolesData, eventosData] = await Promise.all([
        api('/personas'),
        api('/roles'),
        api('/eventos')
      ]);
      setTrabajadores(personasData);
      setRoles(rolesData);
      setEventos(eventosData);

      if (rolesData.length > 0 && !nuevoRolId) {
        setNuevoRolId(rolesData[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos en Personal:', err);
      setError(err.message || 'Error al conectar con la base de datos Neon');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- ACCIÓN FINAL DE VINCULACIÓN (RF4) ---
  // Registra la relación entre la Persona y el Evento activo en Neon
  const handleVincularEvento = async (personaId, eventoId) => {
    if (!eventoId) return;

    try {
      // Buscar la persona para obtener su rol asignado por defecto
      const persona = trabajadores.find(p => p.id === personaId);
      const rolDefecto = roles[0]?.id; // O el rol de la persona

      // Petición POST a PostgreSQL
      await api(`/eventos/${eventoId}/asignaciones`, {
        method: 'POST',
        body: {
          personaId: personaId,
          rolId: persona?.rolId || rolDefecto,
        }
      });

      alert(`✅ ${persona ? persona.nombre : 'Trabajador'} asignado exitosamente al evento.`);
      await cargarDatos(); // Refresca disponibilidades en Neon
    } catch (err) {
      alert(`⚠️ ${err.message || 'No se pudo vincular la persona al evento. Revisa si ya está asignada.'}`);
    }
  };

  // Crear nuevo integrante (RF4)
  const handleAgregarPersonal = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoTelefono.trim()) return;

    try {
      setGuardando(true);
      await api('/personas', {
        method: 'POST',
        body: {
          nombre: nuevoNombre.trim(),
          telefono: nuevoTelefono.trim(),
        }
      });

      setNuevoNombre('');
      setNuevoTelefono('');
      setNuevaTarifa('');
      setMostrarModalAgregar(false);
      await cargarDatos();
    } catch (err) {
      alert(`⚠️ ${err.message || 'Error al registrar trabajador'}`);
    } finally {
      setGuardando(false);
    }
  };

  const formatearDinero = (monto) => `$${(Number(monto) || 0).toLocaleString('es-CL')}`;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-50 p-8 font-sans">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestión y Asignación de Personal (RF4)</h1>
          <p className="text-slate-400 text-sm mt-1">
            Vincular trabajadores freelance con eventos activos y gestionar la disponibilidad técnica[cite: 1, 2, 3].
          </p>
        </div>
        <button
          onClick={() => setMostrarModalAgregar(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer self-start md:self-auto"
        >
          + Registrar Integrante
        </button>
      </div>

      {cargando && <p className="text-slate-400 text-sm mb-4">Cargando personal técnico desde Neon PostgreSQL...</p>}
      {error && (
        <div className="bg-red-950/60 border border-red-800 text-red-200 p-4 rounded-lg mb-6 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={cargarDatos} className="bg-red-900 px-3 py-1 rounded text-xs font-bold hover:bg-red-800">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid principal de Trabajadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {trabajadores.map((t) => (
          <div
            key={t.id}
            className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg text-blue-400 border border-slate-600">
                    {t.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{t.nombre}</h3>
                    <span className="inline-block bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-xs border border-slate-700 mt-0.5">
                      {t.cargo || 'Técnico General'}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  t.disponible !== false 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {t.disponible !== false ? 'Disponible' : 'Asignado'}
                </span>
              </div>

              {/* Atributos Obligatorios RF4 */}
              <div className="space-y-2 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">📞 Teléfono / Contacto:</span>
                  <span className="font-mono text-slate-200">{t.telefono || 'Sin registro'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">💵 Tarifa Base Sugerida:</span>
                  <span className="font-bold text-emerald-400">{formatearDinero(t.tarifa || 45000)}</span>
                </div>
              </div>
            </div>

            {/* VINCULACIÓN CON EVENTOS ACTIVOS (RF4) */}
            <div className="space-y-2 border-t border-slate-700/60 pt-3">
              <label className="block text-[11px] font-semibold text-slate-400">
                Vincular a Transmisión Activa:
              </label>
              <select
                defaultValue=""
                onChange={(e) => handleVincularEvento(t.id, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- Seleccionar Evento --</option>
                {eventos.filter(ev => ev.estado !== 'finalizado').map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre} ({ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-CL') : 'Sin fecha'})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setTrabajadorSeleccionado(t)}
                className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 px-3 rounded text-xs font-medium transition-colors"
              >
                📅 Consultar Horarios / Disponibilidad
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Registrar Nuevo Trabajador */}
      {mostrarModalAgregar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Registrar Nuevo Integrante (RF4)</h2>
            <form onSubmit={handleAgregarPersonal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Rodrigo Salinas"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  required
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  placeholder="+56 9 8123 4567"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setMostrarModalAgregar(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar en Neon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Consulta de Disponibilidad */}
      {trabajadorSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{trabajadorSeleccionado.nombre}</h3>
                <p className="text-xs text-slate-400">Consulta de Disponibilidad por Horario y Días</p>
              </div>
              <button
                onClick={() => setTrabajadorSeleccionado(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-xs">
                <p className="text-slate-300 font-semibold mb-1">⏰ Bloqueos de Horario Activos:</p>
                <p className="text-slate-400">• Disponible para transmisiones agendadas en fin de semana[cite: 2].</p>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => setTrabajadorSeleccionado(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Personal;