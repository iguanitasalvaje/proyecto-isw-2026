import React, { useState } from 'react';

const Personal = () => {
  // Lista de personal disponible (cumpliendo con teléfono, cargo y tarifa según RF4)
  const [trabajadoresDisponibles, setTrabajadoresDisponibles] = useState([
    {
      id: 101,
      nombre: 'Carlos Mendoza',
      cargo: 'Director de Cámara',
      telefono: '+56 9 8765 4321',
      tarifa: 75000,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 102,
      nombre: 'Sofía Valenzuela',
      cargo: 'Técnico de Sonido',
      telefono: '+56 9 1234 5678',
      tarifa: 60000,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 103,
      nombre: 'Matías Silva',
      cargo: 'Operador de Drone',
      telefono: '+56 9 5555 4444',
      tarifa: 85000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 104,
      nombre: 'Valeria Rojas',
      cargo: 'Switcherdor / Producción',
      telefono: '+56 9 9988 7766',
      tarifa: 70000,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    },
  ]);

  // Lista de eventos que recibirán al personal
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

  // Estado para controlar qué tarjeta de trabajador se está arrastrando
  const [trabajadorArrastrado, setTrabajadorArrastrado] = useState(null);

  // Funciones de Drag & Drop
  const handleDragStart = (trabajador) => {
    setTrabajadorArrastrado(trabajador);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Permitir la soltura (drop)
  };

  const handleDrop = (eventoId) => {
    if (!trabajadorArrastrado) return;

    // Agregar el trabajador al evento seleccionado si no está ya asignado
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

    // Quitar de la lista de disponibles
    setTrabajadoresDisponibles(prev => prev.filter(t => t.id !== trabajadorArrastrado.id));
    setTrabajadorArrastrado(null);
  };

  const desasignarTrabajador = (eventoId, trabajador) => {
    // Quitar del evento
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

    // Devolver a la lista de disponibles
    setTrabajadoresDisponibles(prev => [...prev, trabajador]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-8 font-sans">
      
      {/* Encabezado de la página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Asignación de Personal (RF4)</h1>
        <p className="text-slate-400 text-sm mt-1">
          Arrastra las tarjetas del personal disponible hacia el bloque del evento para organizar la logística humana.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Izquierdo: Personal Disponible (Origen Drag) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>👤</span> Personal Disponible ({trabajadoresDisponibles.length})
          </h2>

          <div className="space-y-4">
            {trabajadoresDisponibles.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center py-6">
                Todo el personal ha sido asignado.
              </p>
            ) : (
              trabajadoresDisponibles.map((trabajador) => (
                <div
                  key={trabajador.id}
                  draggable
                  onDragStart={() => handleDragStart(trabajador)}
                  className="bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md group relative"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={trabajador.avatar}
                      alt={trabajador.nombre}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                        {trabajador.nombre}
                      </h3>
                      <p className="text-xs text-blue-400 font-medium">{trabajador.cargo}</p>
                      
                      <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                        <p>📞 <span className="text-slate-300">{trabajador.telefono}</span></p>
                        <p>💰 Tarifa: <span className="text-green-400 font-bold">${trabajador.tarifa.toLocaleString('es-CL')}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 text-slate-600 group-hover:text-slate-400 text-xs">
                    ⠿ Arrastrar
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Derecho: Eventos Agendados (Drop Zone) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📅</span> Eventos Agendados
          </h2>

          {eventos.map((ev) => (
            <div
              key={ev.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(ev.id)}
              className="bg-slate-800 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 transition-colors shadow-lg"
            >
              <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{ev.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {ev.lugar} · 🗓️ {ev.fecha}</p>
                </div>
                <span className="bg-slate-900 text-blue-400 px-3 py-1 rounded-md text-xs border border-slate-700 font-medium">
                  {ev.personalAsignado.length} Asignados
                </span>
              </div>

              {/* Zona de tarjetas asignadas */}
              <div className="min-h-[100px] flex flex-wrap gap-4 items-center">
                {ev.personalAsignado.length === 0 ? (
                  <div className="w-full text-center py-6 text-slate-500 text-sm border border-slate-700/50 rounded-lg bg-slate-900/40">
                    Arrastra aquí tarjetas del personal para asignarlos a este evento.
                  </div>
                ) : (
                  ev.personalAsignado.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center gap-3 relative pr-8 shadow"
                    >
                      <img
                        src={p.avatar}
                        alt={p.nombre}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{p.nombre}</p>
                        <p className="text-[11px] text-blue-400">{p.cargo}</p>
                        <p className="text-[11px] text-green-400 font-semibold">${p.tarifa.toLocaleString('es-CL')}</p>
                      </div>

                      {/* Botón para quitar el trabajador del evento */}
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

    </div>
  );
};

export default Personal;