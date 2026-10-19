import React, { useState } from 'react';

const Personal = () => {
  // Lista inicial de personal disponible (RF4)
  const [trabajadoresDisponibles, setTrabajadoresDisponibles] = useState([
    {
      id: 101,
      nombre: 'Rodrigo Salinas',
      cargo: 'Camarógrafo',
      telefono: '+56 9 8123 4567',
      tarifa: 45000,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      diasBloqueados: [10, 17, 24], // Días no disponibles del mes
    },
    {
      id: 102,
      nombre: 'Valentina Cruz',
      cargo: 'Técnico de Audio',
      telefono: '+56 9 1234 5678',
      tarifa: 40000,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      diasBloqueados: [5, 12],
    },
    {
      id: 103,
      nombre: 'Felipe Morales',
      cargo: 'Operador Switch',
      telefono: '+56 9 5555 4444',
      tarifa: 50000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      diasBloqueados: [],
    },
    {
      id: 104,
      nombre: 'Catalina Vega',
      cargo: 'Camarógrafo',
      telefono: '+56 9 9988 7766',
      tarifa: 42000,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      diasBloqueados: [18, 19, 20],
    },
  ]);

  // Eventos agendados
  const [eventos, setEventos] = useState([
    {
      id: 1,
      nombre: 'Lanzamiento Producto Falabella',
      fecha: '05 sept 2025',
      lugar: 'Hotel W Santiago',
      personalAsignado: [],
    },
    {
      id: 2,
      nombre: 'Final Copa Chile Sub-17',
      fecha: '30 ago 2025',
      lugar: 'Estadio Monumental',
      personalAsignado: [],
    },
  ]);

  // Estados para Modal de Agregar Personal
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('Camarógrafo');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaTarifa, setNuevaTarifa] = useState('');

  // Estados para Modal de Ver Calendario / Disponibilidad
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

  // Estado para Drag & Drop
  const [trabajadorArrastrado, setTrabajadorArrastrado] = useState(null);

  // --- Lógica Drag & Drop ---
  const handleDragStart = (trabajador) => {
    setTrabajadorArrastrado(trabajador);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (eventoId) => {
    if (!trabajadorArrastrado) return;

    setEventos(prevEventos =>
      prevEventos.map(ev => {
        if (ev.id === eventoId) {
          const yaAsignado = ev.personalAsignado.some(p => p.id === trabajadorArrastrado.id);
          if (yaAsignado) return ev;
          return { ...ev, personalAsignado: [...ev.personalAsignado, trabajadorArrastrado] };
        }
        return ev;
      })
    );

    setTrabajadoresDisponibles(prev => prev.filter(t => t.id !== trabajadorArrastrado.id));
    setTrabajadorArrastrado(null);
  };

  const desasignarTrabajador = (eventoId, trabajador) => {
    setEventos(prev =>
      prev.map(ev => {
        if (ev.id === eventoId) {
          return {
            ...ev,
            personalAsignado: ev.personalAsignado.filter(p => p.id !== trabajador.id),
          };
        }
        return ev;
      })
    );
    setTrabajadoresDisponibles(prev => [...prev, trabajador]);
  };

  // --- Lógica para Crear Personal ---
  const handleAgregarPersonal = (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoTelefono || !nuevaTarifa) return;

    const nuevoIntegrante = {
      id: Date.now(),
      nombre: nuevoNombre,
      cargo: nuevoCargo,
      telefono: nuevoTelefono,
      tarifa: Number(nuevaTarifa),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      diasBloqueados: [],
    };

    setTrabajadoresDisponibles(prev => [nuevoIntegrante, ...prev]);
    setNuevoNombre('');
    setNuevoCargo('Camarógrafo');
    setNuevoTelefono('');
    setNuevaTarifa('');
    setMostrarModalAgregar(false);
  };

  // Días simulados para el calendario mensual (31 días)
  const diasMes = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-50 p-8 font-sans">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión y Asignación de Personal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Haz clic en un trabajador para ver su calendario o arrastra su tarjeta hacia los eventos[cite: 3].
          </p>
        </div>

        <button
          onClick={() => setMostrarModalAgregar(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer self-start md:self-auto flex items-center gap-2"
        >
          <span>+</span> Agregar Personal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Izquierdo: Lista de Personal Disponible */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <span>👤</span> Disponibles ({trabajadoresDisponibles.length})
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {trabajadoresDisponibles.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center py-6">
                No hay personal disponible en este momento.
              </p>
            ) : (
              trabajadoresDisponibles.map((trabajador) => (
                <div
                  key={trabajador.id}
                  draggable
                  onDragStart={() => handleDragStart(trabajador)}
                  onClick={() => setTrabajadorSeleccionado(trabajador)} // Abrir calendario al hacer clic
                  className="bg-slate-800/80 border border-slate-700/80 hover:border-blue-500 rounded-lg p-3.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg group relative"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={trabajador.avatar}
                      alt={trabajador.nombre}
                      className="w-11 h-11 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                        {trabajador.nombre}
                      </h3>
                      <p className="text-xs text-blue-400 font-medium">{trabajador.cargo}</p>
                      
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>📞 {trabajador.telefono}</span>
                        <span className="text-green-400 font-bold">${trabajador.tarifa.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 text-slate-600 group-hover:text-slate-400 text-xs" title="Ver calendario / Arrastrar">
                    📅 ⠿
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Derecho: Drop Zone para Eventos */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📅</span> Eventos Agendados
          </h2>

          {eventos.map((ev) => (
            <div
              key={ev.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(ev.id)}
              className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-blue-500/80 rounded-xl p-6 transition-colors shadow-xl"
            >
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{ev.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {ev.lugar} · 🗓️ {ev.fecha}</p>
                </div>
                <span className="bg-slate-800 text-blue-400 px-3 py-1 rounded-md text-xs border border-slate-700 font-medium">
                  {ev.personalAsignado.length} Asignados
                </span>
              </div>

              <div className="min-h-[90px] flex flex-wrap gap-3 items-center">
                {ev.personalAsignado.length === 0 ? (
                  <div className="w-full text-center py-6 text-slate-500 text-sm border border-slate-800/60 rounded-lg bg-slate-950/40">
                    Arrastra tarjetas de personal aquí para asignarlos al evento[cite: 3].
                  </div>
                ) : (
                  ev.personalAsignado.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 flex items-center gap-3 relative pr-8 shadow"
                    >
                      <img
                        src={p.avatar}
                        alt={p.nombre}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{p.nombre}</p>
                        <p className="text-[11px] text-blue-400">{p.cargo}</p>
                        <p className="text-[11px] text-green-400 font-semibold">${p.tarifa.toLocaleString('es-CL')}</p>
                      </div>

                      <button
                        onClick={() => desasignarTrabajador(ev.id, p)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 text-xs font-bold transition-colors cursor-pointer"
                        title="Desasignar"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* --- MODAL 1: Calendario y Disponibilidad del Trabajador --- */}
      {trabajadorSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setTrabajadorSeleccionado(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            {/* Datos del Trabajador */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-5">
              <img
                src={trabajadorSeleccionado.avatar}
                alt={trabajadorSeleccionado.nombre}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
              />
              <div>
                <h2 className="text-xl font-bold text-white">{trabajadorSeleccionado.nombre}</h2>
                <p className="text-xs text-blue-400 font-semibold">{trabajadorSeleccionado.cargo}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>📞 {trabajadorSeleccionado.telefono}</span>
                  <span>💰 Tarifa: <strong className="text-green-400">${trabajadorSeleccionado.tarifa.toLocaleString('es-CL')}</strong></span>
                </div>
              </div>
            </div>

            {/* Calendario Mensual de Disponibilidad */}
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex justify-between items-center">
              <span>🗓️ Calendario de Disponibilidad (Octubre 2026)</span>
              <span className="text-xs text-slate-400 font-normal">🟢 Disponible · 🔴 Ocupado</span>
            </h3>

            <div className="grid grid-cols-7 gap-2 text-center text-xs mb-4">
              <span className="text-slate-500 font-bold">L</span>
              <span className="text-slate-500 font-bold">M</span>
              <span className="text-slate-500 font-bold">X</span>
              <span className="text-slate-500 font-bold">J</span>
              <span className="text-slate-500 font-bold">V</span>
              <span className="text-slate-500 font-bold">S</span>
              <span className="text-slate-500 font-bold">D</span>

              {diasMes.map((dia) => {
                const estaBloqueado = trabajadorSeleccionado.diasBloqueados?.includes(dia);
                return (
                  <div
                    key={dia}
                    className={`p-2 rounded-md font-semibold text-xs border ${
                      estaBloqueado
                        ? 'bg-red-950/60 border-red-800 text-red-400'
                        : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                    }`}
                  >
                    {dia}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setTrabajadorSeleccionado(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-sm transition-colors cursor-pointer mt-2"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Formulario para Agregar Nuevo Personal --- */}
      {mostrarModalAgregar && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setMostrarModalAgregar(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Agregar Nuevo Personal</h2>
            <p className="text-xs text-slate-400 mb-6">Completa los datos para registrar un nuevo integrante[cite: 3].</p>

            <form onSubmit={handleAgregarPersonal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Rodrigo Salinas"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Especialidad</label>
                <select
                  value={nuevoCargo}
                  onChange={(e) => setNuevoCargo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Camarógrafo">Camarógrafo</option>
                  <option value="Técnico de Audio">Técnico de Audio</option>
                  <option value="Operador Switch">Operador Switch</option>
                  <option value="Director de Cámara">Director de Cámara</option>
                  <option value="Operador de Drone">Operador de Drone</option>
                  <option value="Coordinador">Coordinador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  required
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  placeholder="Ej: +56 9 8123 4567"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tarifa por Evento (CLP)</label>
                <input
                  type="number"
                  required
                  value={nuevaTarifa}
                  onChange={(e) => setNuevaTarifa(e.target.value)}
                  placeholder="Ej: 45000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalAgregar(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Personal;