import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import EconomiaEventos from './EconomiaEventos';
import './kits.css';

export default function KitsPanel() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [revision, setRevision] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [premium, setPremium] = useState(false);
  const [porcentaje, setPorcentaje] = useState('');
  const [vigencia, setVigencia] = useState('');
  const refrescar = () => setRevision(r => r + 1);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([api('/kits', { signal }), api('/configuracion/premium', { signal })])
      .then(([kits, config]) => setDatos({ kits, config }))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [revision]);
  async function ejecutar(e, tarea) {
    e.preventDefault(); setOcupado(true); setError(''); setMensaje('');
    try { await tarea(); refrescar(); }
    catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }
  return <div className="kits-rf5">
    <section className="kits-panel" aria-busy={ocupado}>
      <h2>Kits físicos</h2>
      <p>Un kit puede ocupar un solo evento pendiente o en curso. Al finalizar, vuelve a estar disponible y conserva su asignación histórica.</p>
      {error && <p role="alert" className="kits-error">{error}</p>}
      {mensaje && <p role="status" className="kits-exito">{mensaje}</p>}
      <button type="button" disabled={ocupado} onClick={() => { setError(''); refrescar(); }}>Actualizar catálogo</button>
      {!datos && !error && <p role="status">Cargando kits…</p>}
      {datos?.kits.length === 0 && <p>No hay kits registrados.</p>}
      {datos && <ul className="kits-lista">{datos.kits.map(k => <li key={k.id}>
        <strong>{k.nombre}</strong><span className={k.premium ? 'kits-premium' : ''}>{k.premium ? 'Premium' : 'Normal'}</span>
        <span className={k.disponible ? 'kits-exito' : 'kits-premium'}>{k.disponible ? 'Disponible' : 'Ocupado'}</span>
      </li>)}</ul>}
      <form onSubmit={e => ejecutar(e, async () => {
        await api('/kits', { method: 'POST', body: { nombre: nombre.trim(), premium } });
        setNombre(''); setPremium(false); setMensaje('Kit registrado.');
      })}>
        <h3>Registrar kit</h3>
        <label htmlFor="nombre-kit">Nombre del kit físico</label>
        <input id="nombre-kit" required value={nombre} disabled={ocupado} onChange={e => setNombre(e.target.value)} />
        <label className="kits-checkbox"><input type="checkbox" checked={premium} disabled={ocupado} onChange={e => setPremium(e.target.checked)} />Kit Premium</label>
        <button disabled={ocupado || !nombre.trim()}>Registrar kit</button>
      </form>
    </section>
    <section className="kits-panel">
      <h2>Configuración del recargo Premium</h2>
      {datos && <p>{datos.config ? `Porcentaje vigente: ${datos.config.porcentaje_centesimas / 100}% · Desde ${new Date(datos.config.vigente_desde).toLocaleString('es-CL')}` : 'No hay porcentaje vigente. Configúralo antes de asignar un Kit Premium.'}</p>}
      <p>Las nuevas vigencias se aplican al asignar o cambiar de kit. Los eventos ya calculados conservan su porcentaje.</p>
      <form onSubmit={e => ejecutar(e, async () => {
        if (!/^\d+(\.\d{1,2})?$/.test(porcentaje)) throw new Error('El porcentaje admite hasta dos decimales.');
        await api('/configuracion/premium', { method: 'POST', body: {
          porcentajeCentesimas: Math.round(Number(porcentaje) * 100),
          vigenteDesde: vigencia ? new Date(vigencia).toISOString() : new Date().toISOString(),
        } });
        setPorcentaje(''); setVigencia(''); setMensaje('Nueva vigencia Premium registrada.');
      })}>
        <label htmlFor="porcentaje-premium">Porcentaje Premium (%)</label>
        <input id="porcentaje-premium" type="number" min="0" max="100" step="0.01" required disabled={ocupado} value={porcentaje} onChange={e => setPorcentaje(e.target.value)} />
        <label htmlFor="vigencia-premium">Vigente desde (hora local; vacío = ahora)</label>
        <input id="vigencia-premium" type="datetime-local" disabled={ocupado} value={vigencia} onChange={e => setVigencia(e.target.value)} />
        <button disabled={ocupado}>Guardar configuración Premium</button>
      </form>
    </section>
    <EconomiaEventos editable onCambio={refrescar} />
  </div>;
}
