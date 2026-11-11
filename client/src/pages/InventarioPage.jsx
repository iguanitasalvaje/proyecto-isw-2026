import { useState, useEffect } from 'react';
import KitsPanel from '../components/kits/KitsPanel';

const API_EQUIPOS_URL = 'http://localhost:1303/api/inventario/equipos';
const API_KITS_URL = 'http://localhost:1303/api/inventario/kits';

async function consultarInventario(signal) {
  const [resEquipos, resKits] = await Promise.all([
    fetch(API_EQUIPOS_URL, { signal }),
    fetch(API_KITS_URL, { signal }),
  ]);
  if (!resEquipos.ok || !resKits.ok) throw new Error('Error al cargar el inventario');
  const [equipos, kits] = await Promise.all([resEquipos.json(), resKits.json()]);
  return { equipos, kits };
}

export default function InventarioPage() {
  const [tabActiva, setTabActiva] = useState('equipos'); 
  const [equipos, setEquipos] = useState([]);
  const [kits, setKits] = useState([]);
  const [cargandoInventario, setCargandoInventario] = useState(true);
  const [errorInventario, setErrorInventario] = useState(null);

  // Estados para Modal Nuevo Equipo (RF9)
  const [mostrarModalEquipo, setMostrarModalEquipo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Cámara');
  const [nuevaSerie, setNuevaSerie] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  // Estados para Modal Nuevo Kit (RF7)
  const [mostrarModalKit, setMostrarModalKit] = useState(false);
  const [nombreKit, setNombreKit] = useState('');
  const [descripcionKit, setDescripcionKit] = useState('');

  // 1. Cargar datos desde la base de datos (Neon / PostgreSQL)
  const cargarDatos = async () => {
    try {
      setCargandoInventario(true);
      const { equipos: dataEquipos, kits: dataKits } = await consultarInventario();

      setEquipos(dataEquipos);
      setKits(dataKits);
      setErrorInventario(null);
    } catch (err) {
      setErrorInventario(err.message);
    } finally {
      setCargandoInventario(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    consultarInventario(controller.signal)
      .then(({ equipos, kits }) => {
        setEquipos(equipos);
        setKits(kits);
        setErrorInventario(null);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setErrorInventario(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoInventario(false);
      });
    return () => controller.abort();
  }, []);

  // 2. Guardar un nuevo equipo en el Backend (POST real RF9)
  const handleGuardarEquipo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_EQUIPOS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoNombre,
          tipo: nuevoTipo,
          serie: nuevaSerie,
          estado: 'Disponible',
          valorReposicion: Number(nuevoValor) || 0,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar el equipo');

      setMostrarModalEquipo(false);
      setNuevoNombre('');
      setNuevaSerie('');
      setNuevoValor('');
      setNuevoTipo('Cámara');
      await cargarDatos();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  // 3. Guardar un nuevo Kit en el Backend (POST real RF7)
  const handleGuardarKit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_KITS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreKit,
          descripcion: descripcionKit,
        }),
      });

      if (!res.ok) throw new Error('Error al registrar el kit');

      setMostrarModalKit(false);
      setNombreKit('');
      setDescripcionKit('');
      await cargarDatos();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  // 4. Cambiar estado a 'Dado de Baja' en Backend (PATCH real RF13)
  const handleDarDeBaja = async (id) => {
    try {
      const res = await fetch(`${API_EQUIPOS_URL}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Dado de Baja' }),
      });

      if (!res.ok) throw new Error('No se pudo dar de baja el equipo');
      await cargarDatos();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  // 5. Vincular / Desvincular equipo a un kit (PATCH real RF7)
  const handleAsignarKit = async (equipoId, kitId) => {
    try {
      const res = await fetch(`${API_EQUIPOS_URL}/${equipoId}/kit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitId: kitId ? Number(kitId) : null }),
      });

      if (!res.ok) throw new Error('No se pudo actualizar la asignación del kit');
      await cargarDatos();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const equiposDeBaja = equipos.filter((e) => e.estado === 'Dado de Baja');
  const perdidaTotal = equiposDeBaja.reduce((total, e) => total + (Number(e.valorReposicion) || 0), 0);

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
          <p className="text-[14px] font-[400] text-[#94a3b8] mt-1.5">
            {equipos.length} equipos registrados · {kits.length} kits configurados
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setTabActiva('kits'); setMostrarModalKit(true); }}
            className="px-4 py-2.5 bg-[#2563eb] text-[#f8fafc] border-none rounded-lg cursor-pointer font-semibold text-[13px] hover:bg-[#1d4ed8] transition-colors"
          >
            + Nuevo Kit de equipos
          </button>
          <button 
            onClick={() => setMostrarModalEquipo(true)}
            className="px-4 py-2.5 bg-[#0f172a] text-[#f8fafc] border border-[#334155] rounded-lg cursor-pointer font-semibold text-[13px] hover:bg-[#1e293b] transition-colors"
          >
            + Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Tarjetas resumen de métricas */}
      <div className="grid grid-cols-4 gap-4 my-7">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Disponibles</span>
          <p className="text-[30px] font-bold text-[#4ade80] mt-2.5 mb-0">
            {equipos.filter((e) => e.estado === 'Disponible').length}
          </p>
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">En Uso</span>
          <p className="text-[30px] font-bold text-[#3b82f6] mt-2.5 mb-0">
            {equipos.filter((e) => e.estado === 'En Uso').length}
          </p>
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Dañados</span>
          <p className="text-[30px] font-bold text-[#fbbf24] mt-2.5 mb-0">
            {equipos.filter((e) => e.estado === 'Dañado').length}
          </p>
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-wider">Perdidos</span>
          <p className="text-[30px] font-bold text-[#f87171] mt-2.5 mb-0">
            {equipos.filter((e) => e.estado === 'Perdido').length}
          </p>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'kits', label: 'Kits de equipos — Inventario' },
          { id: 'kits-eventos', label: 'Kits para eventos — RF5' },
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

      {tabActiva !== 'kits-eventos' && cargandoInventario && <p className="text-[#94a3b8]">Sincronizando con PostgreSQL (Neon)...</p>}
      {tabActiva !== 'kits-eventos' && errorInventario && <p role="alert" className="text-[#f87171]">⚠️ Error de conexión: {errorInventario}</p>}

      {/* Vista de Kits */}
      {!cargandoInventario && !errorInventario && tabActiva === 'kits' && (
        <div className="space-y-6">
          {kits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.map((kit) => (
                <div key={kit.id} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#2563eb]/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-[16px] text-[#f8fafc] m-0">{kit.nombre}</h3>
                    <span className="text-[11px] bg-[#1e293b] text-[#38bdf8] px-2 py-0.5 rounded border border-[#334155]">
                      {kit.equipos ? kit.equipos.length : 0} equipos
                    </span>
                  </div>
                  <p className="text-[13px] text-[#94a3b8] mb-4 min-h-[38px] line-clamp-2">
                    {kit.descripcion || 'Sin descripción asignada.'}
                  </p>
                  
                  <div className="border-t border-[#1e293b] pt-3 mt-2">
                    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">Equipos incluidos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {kit.equipos && kit.equipos.length > 0 ? (
                        kit.equipos.map((eq) => (
                          <span key={eq.id} className="bg-[#0b1120] text-[#cbd5e1] text-[11px] px-2 py-1 rounded border border-[#334155]">
                            {eq.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-[#64748b] italic">Sin equipos vinculados</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 text-[#94a3b8]">
              No hay kits de equipos registrados en Inventario.
            </div>
          )}
        </div>
      )}

      {tabActiva === 'kits-eventos' && <KitsPanel />}

      {/* Tabla de Todos los Equipos */}
      {!cargandoInventario && !errorInventario && tabActiva === 'equipos' && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[#0b1120] text-[#64748b] border-b border-[#1e293b]">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Equipo</th>
                <th className="py-3.5 px-5 font-semibold">Tipo</th>
                <th className="py-3.5 px-5 font-semibold">Serie</th>
                <th className="py-3.5 px-5 font-semibold">Estado</th>
                <th className="py-3.5 px-5 font-semibold">Kit Asignado</th>
                <th className="py-3.5 px-5 font-semibold">Valor Reposición</th>
                <th className="py-3.5 px-5 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {equipos.filter((e) => e.estado !== 'Dado de Baja').map((item) => (
                <tr key={item.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/40 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-[#f8fafc]">{item.nombre}</td>
                  <td className="py-3.5 px-5 text-[#94a3b8]">{item.tipo}</td>
                  <td className="py-3.5 px-5 text-[#64748b] font-mono">{item.serie || 'N/A'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${obtenerClasesBadge(item.estado)}`}>
                      {item.estado}
                    </span>
                  </td>
                  {/* Desplegable para seleccionar Kit (RF7) */}
                  <td className="py-3.5 px-5">
                    <select
                      value={item.kitId || ''}
                      onChange={(e) => handleAsignarKit(item.id, e.target.value)}
                      className="bg-[#0b1120] text-[#38bdf8] border border-[#334155] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#2563eb]"
                    >
                      <option value="">— Sin Kit —</option>
                      {kits.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-5 text-[#94a3b8]">
                    ${Number(item.valorReposicion || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button 
                      onClick={() => handleDarDeBaja(item.id)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/30 rounded-md cursor-pointer hover:bg-[#f87171]/20 transition-colors"
                    >
                      Dar de baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Dados de Baja (RF13 - Consolidado Financiero de Mermas) */}
      {!cargandoInventario && !errorInventario && tabActiva === 'bajas' && (
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
                      <td className="py-3.5 px-5 text-[#64748b] font-mono">{item.serie || 'N/A'}</td>
                      <td className="py-3.5 px-5 text-[#94a3b8] italic">{item.motivo ? `"${item.motivo}"` : '—'}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-[#f87171]">
                        ${Number(item.valorReposicion || 0).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal interactivo de Nuevo Kit (RF7) */}
      {mostrarModalKit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#f8fafc] m-0">Crear kit de equipos — Inventario</h3>
              <button onClick={() => setMostrarModalKit(false)} className="text-[#64748b] hover:text-[#f8fafc] bg-transparent border-none text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleGuardarKit} className="space-y-4">
              <div>
                <label htmlFor="nombre-kit-inventario" className="block text-xs font-semibold text-[#94a3b8] mb-1">Nombre del kit de equipos</label>
                <input 
                  type="text" 
                  required 
                  id="nombre-kit-inventario"
                  value={nombreKit} 
                  onChange={(e) => setNombreKit(e.target.value)} 
                  placeholder="Ej. Kit Transmisión Fútbol" 
                  className="w-full bg-[#0b1120] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f8fafc] focus:outline-none focus:border-[#2563eb]" 
                />
              </div>
              <div>
                <label htmlFor="descripcion-kit-inventario" className="block text-xs font-semibold text-[#94a3b8] mb-1">Descripción</label>
                <textarea 
                  rows="3" 
                  id="descripcion-kit-inventario"
                  value={descripcionKit} 
                  onChange={(e) => setDescripcionKit(e.target.value)} 
                  placeholder="Detalle de los requerimientos de este kit..." 
                  className="w-full bg-[#0b1120] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#f8fafc] focus:outline-none focus:border-[#2563eb]" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button type="button" onClick={() => setMostrarModalKit(false)} className="px-4 py-2 bg-[#1e293b] text-[#94a3b8] rounded-lg text-xs font-semibold border border-transparent">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563eb] text-[#f8fafc] rounded-lg text-xs font-semibold border-none cursor-pointer hover:bg-[#1d4ed8]">Guardar Kit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal interactivo de Registro de Nuevo Equipo (RF9) */}
      {mostrarModalEquipo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#f8fafc] m-0">Registrar Nuevo Equipo</h3>
              <button onClick={() => setMostrarModalEquipo(false)} className="text-[#64748b] hover:text-[#f8fafc] bg-transparent border-none text-lg cursor-pointer">✕</button>
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
                <button type="button" onClick={() => setMostrarModalEquipo(false)} className="px-4 py-2 bg-[#1e293b] text-[#94a3b8] rounded-lg text-xs font-semibold border border-transparent">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#2563eb] text-[#f8fafc] rounded-lg text-xs font-semibold border-none cursor-pointer hover:bg-[#1d4ed8]">Guardar Equipo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}