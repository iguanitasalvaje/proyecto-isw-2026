import React, { useState } from 'react';

// 1. Datos iniciales de prueba (Mock Data) con valor de reposición monetario (RF9 y RF13)
const EQUIPOS_INICIALES = [
  { id: 1, nombre: 'Sony FX3 #1', tipo: 'Cámara', serie: 'SN-FX3-001', estado: 'Disponible', kits: ['Fútbol', 'Corporativo'], valorReposicion: 3500000 },
  { id: 2, nombre: 'Sony FX3 #2', tipo: 'Cámara', serie: 'SN-FX3-002', estado: 'En Uso', kits: ['Fútbol'], valorReposicion: 3500000 },
  { id: 3, nombre: 'Canon C70 #1', tipo: 'Cámara', serie: 'CN-C70-001', estado: 'Disponible', kits: ['Fútbol', 'Graduación'], valorReposicion: 4000000 },
  { id: 4, nombre: 'Trípode Manfrotto #1', tipo: 'Trípode', serie: 'MF-T100-001', estado: 'Disponible', kits: ['Fútbol', 'Graduación'], valorReposicion: 450000 },
  { id: 5, nombre: 'Trípode Manfrotto #2', tipo: 'Trípode', serie: 'MF-T100-002', estado: 'Dañado', kits: [], valorReposicion: 450000 },
  { id: 6, nombre: 'Cable HDMI 15m #2', tipo: 'Cable', serie: 'HDMI-15-002', estado: 'Perdido', kits: [], valorReposicion: 35000 },
  { id: 7, nombre: 'Mezcladora Blackmagic ATEM Mini', tipo: 'Switch', serie: 'BM-AM-001', estado: 'Disponible', kits: ['Fútbol', 'Corporativo'], valorReposicion: 800000 },
  // Equipos en historial de baja para el reporte financiero de mermas (RF13)
  { id: 8, nombre: 'Monitor Feelworld 7"', tipo: 'Monitor', serie: 'FW-M7-002', estado: 'Dado de Baja', kits: [], valorReposicion: 250000, motivo: 'Pantalla rota en traslado' },
  { id: 9, nombre: 'Micrófono Sennheiser XSW-D', tipo: 'Micrófono', serie: 'SN-XSD-002', estado: 'Dado de Baja', kits: [], valorReposicion: 280000, motivo: 'Pérdida en evento 15-ago' },
];

export default function InventarioPage() {
  // Estados para controlar las pestañas y la lista de equipos
  const [tabActiva, setTabActiva] = useState('equipos'); 
  const [equipos, setEquipos] = useState(EQUIPOS_INICIALES);

  // Estado para el Modal de Nuevo Equipo (RF9)
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Cámara');
  const [nuevaSerie, setNuevaSerie] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  // Filtrar equipos dados de baja
  const equiposDeBaja = equipos.filter(e => e.estado === 'Dado de Baja');
  
  // Calcular pérdida financiera total (RF13)
  const perdidaTotal = equiposDeBaja.reduce((total, equipo) => total + (equipo.valorReposicion || 0), 0);

  // Función para procesar el guardado de un nuevo equipo en el estado reactivo
  const handleGuardarEquipo = (e) => {
    e.preventDefault();
    const nuevoEquipoObj = {
      id: Date.now(),
      nombre: nuevoNombre,
      tipo: nuevoTipo,
      serie: nuevaSerie,
      estado: 'Disponible',
      kits: [],
      valorReposicion: Number(nuevoValor) || 0,
    };

    setEquipos([nuevoEquipoObj, ...equipos]);
    setMostrarModalNuevo(false);
    
    // Limpiar formulario
    setNuevoNombre('');
    setNuevaSerie('');
    setNuevoValor('');
    setNuevoTipo('Cámara');
  };

  const obtenerClasesBadge = (estado) => {
    switch (estado) {
      case 'Disponible': return 'text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/25';
      case 'En Uso': return 'text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/25';
      case 'Dañado': return 'text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/25';
      case 'Perdido': return 'text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/25';
      case 'Dado de Baja': return 'text-[#64748b] bg-[#1e293b] border border-[#334155]';
      default: return 'text-[#94a3b8] bg-[#1e293b]';
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] p-8 font-sans box-border">
      
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-[30px] font-[700] text-[#f8fafc] m-0 tracking-tight">Inventario</h1>
          <p className="text-[14px] font-[400] text-[#94a3b8] mt-1.5">{equipos.length} equipos registrados · 4 kits configurados</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-[#2563eb] text-[#f8fafc] border-none rounded-lg cursor-pointer font-semibold text-[13px] hover:bg-[#1d4ed8] transition-colors">
            + Nuevo Kit
          </button>
          <button 
            onClick={() => setMostrarModalNuevo(true)}
            className="px-4 py-2.5 bg-[#0f172a] text-[#f8fafc] border border-[#334155] rounded-lg cursor-pointer font-semibold text-[13px] hover:bg-[#1e293b] transition-colors"
          >
            + Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4 my-7">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Disponibles</span>
          <p className="text-[30px] font-bold text-[#4ade80] mt-2.5 mb-0">
            {equipos.filter(e => e.estado === 'Disponible').length}
          </p>
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">En Uso</span>
          <p className="text-[30px] font-bold text-[#3b82f6] mt-2.5 mb-0">
            {equipos.filter(e => e.estado === 'En Uso').length}
          </p>
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Dañados</span>
          <p className="text-[30px] font-bold text-[#fbbf24] mt-2.5 mb-0">
            {equipos.filter(e => e.estado === 'Dañado').length}
          </p>
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Perdidos</span>
          <p className="text-[30px] font-bold text-[#f87171] mt-2.5 mb-0">
            {equipos.filter(e => e.estado === 'Perdido').length}
          </p>
        </div>
      </div>

      {/* Subnavegación de Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'kits', label: 'Kits' },
          { id: 'equipos', label: 'Todos los Equipos' },
          { id: 'bajas', label: 'Dados de Baja' },
        ].map((tab) => {
          const activo = tabActiva === tab.id;
          let clasesTab = 'px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors border ';
          
          if (activo) {
            clasesTab += tab.id === 'bajas' 
              ? 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]' 
              : 'bg-[#2563eb] text-[#f8fafc] border-[#2563eb]';
          } else {
            clasesTab += 'bg-[#0f172a] text-[#94a3b8] border-transparent hover:text-[#f8fafc]';
          }

          return (
            <button key={tab.id} onClick={() => setTabActiva(tab.id)} className={clasesTab}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabla de Todos los Equipos */}
      {tabActiva === 'equipos' && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[#0b1120] text-[#64748b] border-b border-[#1e293b]">
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
              {equipos.filter(e => e.estado !== 'Dado de Baja').map((item) => (
                <tr key={item.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/40 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-[#f8fafc]">{item.nombre}</td>
                  <td className="py-3.5 px-5 text-[#94a3b8]">{item.tipo}</td>
                  <td className="py-3.5 px-5 text-[#64748b] font-mono">{item.serie}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${obtenerClasesBadge(item.estado)}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex gap-1.5 flex-wrap">
                      {item.kits.length > 0 ? (
                        item.kits.map((k, idx) => (
                          <span key={idx} className="bg-[#0b1120] text-[#94a3b8] text-[11px] px-2 py-0.5 rounded border border-[#334155]">{k}</span>
                        ))
                      ) : (
                        <span className="text-[#64748b]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {(item.estado === 'Dañado' || item.estado === 'Perdido') && (
                      <button className="px-3 py-1.5 text-[12px] font-semibold text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/30 rounded-md cursor-pointer hover:bg-[#f87171]/20 transition-colors">
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

      {/* Vista Dados de Baja (RF13 - Consolidado Financiero de Mermas) */}
      {tabActiva === 'bajas' && (
        <div className="space-y-6">
          {equiposDeBaja.length > 0 && (
             <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl p-6 flex justify-between items-center">
               <div>
                 <h2 className="text-[#f87171] font-bold text-[18px] mb-1">Mermas y Pérdidas Financieras</h2>
                 <p className="text-[#94a3b8] text-[13px] m-0">Resumen de impacto económico por equipos dados de baja en el período actual.</p>
               </div>
               <div className="text-right">
                 <span className="text-[11px] uppercase text-[#f87171]/80 font-bold tracking-wider">Impacto Total</span>
                 <p className="text-[30px] font-bold text-[#f87171] m-0 mt-1">${perdidaTotal.toLocaleString('es-CL')}</p>
               </div>
             </div>
          )}

          {equiposDeBaja.length === 0 ? (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1e293b] text-[#94a3b8] flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
              <h3 className="text-[16px] font-semibold text-[#f8fafc] m-0">Sin equipos dados de baja</h3>
              <p className="text-[13px] text-[#94a3b8] mt-1.5">Los equipos eliminados del inventario aparecerán aquí.</p>
            </div>
          ) : (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="bg-[#0b1120] text-[#64748b] border-b border-[#1e293b]">
                  <tr>
                    <th className="py-3.5 px-5 font-semibold">Equipo Desincorporado</th>
                    <th className="py-3.5 px-5 font-semibold">Serie</th>
                    <th className="py-3.5 px-5 font-semibold">Motivo de Baja</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Valor de Reposición</th>
                  </tr>
                </thead>
                <tbody>
                  {equiposDeBaja.map((item) => (
                    <tr key={item.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/40 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-[#f8fafc] line-through decoration-[#64748b]">
                        {item.nombre} <span className="text-[#94a3b8] no-underline ml-2">({item.tipo})</span>
                      </td>
                      <td className="py-3.5 px-5 text-[#64748b] font-mono">{item.serie}</td>
                      <td className="py-3.5 px-5 text-[#94a3b8] italic">"{item.motivo}"</td>
                      <td className="py-3.5 px-5 text-right font-bold text-[#f87171]">
                        ${item.valorReposicion?.toLocaleString('es-CL') || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vista Kits */}
      {tabActiva === 'kits' && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-10 text-center text-[#64748b] text-[14px]">
          Configuración y asignación de Kits lógicos (en construcción).
        </div>
      )}

      {/* Modal interactivo de Registro de Nuevo Equipo (RF9) */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#f8fafc] m-0">Registrar Nuevo Equipo</h3>
              <button 
                onClick={() => setMostrarModalNuevo(false)}
                className="text-[#64748b] hover:text-[#f8fafc] bg-transparent border-none text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEquipo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Nombre del Equipo</label>
                <input 
                  type="text" 
                  required 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Cámara Sony A7IV" 
                  className="w-full bg-[#0b1120] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f8fafc] focus:outline-none focus:border-[#2563eb]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Categoría/Tipo</label>
                  <select 
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value)}
                    className="w-full bg-[#0b1120] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f8fafc] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option>Cámara</option>
                    <option>Trípode</option>
                    <option>Cable</option>
                    <option>Monitor</option>
                    <option>Audio</option>
                    <option>Switch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Número de Serie</label>
                  <input 
                    type="text" 
                    required 
                    value={nuevaSerie}
                    onChange={(e) => setNuevaSerie(e.target.value)}
                    placeholder="SN-000-XXX" 
                    className="w-full bg-[#0b1120] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f8fafc] focus:outline-none focus:border-[#2563eb]" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Valor de Reposición (CLP)</label>
                <input 
                  type="number" 
                  required 
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  placeholder="1500000" 
                  className="w-full bg-[#0b1120] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f8fafc] focus:outline-none focus:border-[#2563eb]" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button 
                  type="button" 
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 bg-[#1e293b] text-[#94a3b8] rounded-lg text-xs font-semibold hover:text-[#f8fafc] transition-colors border border-transparent"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#2563eb] text-[#f8fafc] rounded-lg text-xs font-semibold hover:bg-[#1d4ed8] transition-colors border-none cursor-pointer"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}