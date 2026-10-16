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

  const obtenerClasesBadge = (estado) => {
    switch (estado) {
      case 'Disponible':
        return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25';
      case 'En Uso':
        return 'text-blue-400 bg-blue-500/10 border border-blue-500/25';
      case 'Dañado':
        return 'text-amber-400 bg-amber-500/10 border border-amber-500/25';
      case 'Perdido':
        return 'text-rose-400 bg-rose-500/10 border border-rose-500/25';
      default:
        return 'text-slate-400 bg-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-8 font-sans box-border">
      
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white m-0">Inventario</h1>
          <p className="text-sm text-slate-500 mt-1.5">14 equipos registrados · 4 kits configurados</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-xs hover:bg-blue-500 transition-colors">
            + Nuevo Kit
          </button>
          <button className="px-4 py-2.5 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg cursor-pointer font-semibold text-xs hover:bg-slate-700 transition-colors">
            + Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4 my-7">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Disponibles</span>
          <p className="text-3xl font-bold text-emerald-400 mt-2.5 mb-0">10</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">En Uso</span>
          <p className="text-3xl font-bold text-blue-400 mt-2.5 mb-0">2</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Dañados</span>
          <p className="text-3xl font-bold text-amber-400 mt-2.5 mb-0">1</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Perdidos</span>
          <p className="text-3xl font-bold text-rose-400 mt-2.5 mb-0">1</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'kits', label: 'Kits' },
          { id: 'equipos', label: 'Todos los Equipos' },
          { id: 'bajas', label: 'Dados de Baja' },
        ].map((tab) => {
          const activo = tabActiva === tab.id;
          let clasesTab = 'px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ';
          
          if (activo) {
            clasesTab += tab.id === 'bajas' 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500' 
              : 'bg-blue-600 text-white';
          } else {
            clasesTab += 'bg-slate-900 text-slate-500 hover:text-slate-300';
          }

          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={clasesTab}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabla de Equipos */}
      {tabActiva === 'equipos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0b1120] text-slate-500 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Equipo</th>
                <th className="py-3.5 px-5 font-semibold">Tipo</th>
                <th className="py-3.5 px-5 font-semibold">Serie</th>
                <th className="py-3.5 px-5 font-semibold">Estado</th>
                <th className="py-3.5 px-5 font-semibold">Kits</th>
                <th className="py-3.5 px-5 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPOS_INICIALES.map((item) => (
                <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-100">{item.nombre}</td>
                  <td className="py-3.5 px-5 text-slate-400">{item.tipo}</td>
                  <td className="py-3.5 px-5 text-slate-500 font-mono">{item.serie}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${obtenerClasesBadge(item.estado)}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex gap-1.5 flex-wrap">
                      {item.kits.length > 0 ? (
                        item.kits.map((k, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700">
                            {k}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {(item.estado === 'Dañado' || item.estado === 'Perdido') && (
                      <button className="px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-md cursor-pointer hover:bg-rose-500/20 transition-colors">
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto mb-4 text-xl">
            ✓
          </div>
          <h3 className="text-base font-semibold text-slate-100 m-0">Sin equipos dados de baja</h3>
          <p className="text-xs text-slate-500 mt-1.5">Los equipos eliminados del inventario aparecerán aquí.</p>
        </div>
      )}

      {/* Vista Kits */}
      {tabActiva === 'kits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-sm">
          Configuración y asignación de Kits lógicos (en construcción).
        </div>
      )}

    </div>
  );
}