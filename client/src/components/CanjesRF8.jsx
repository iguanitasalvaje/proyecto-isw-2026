import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

const formatoCLP = (valor) => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
}).format(valor);

export default function CanjesRF8() {
  const [eventos, setEventos] = useState([]);
  const [auspiciadores, setAuspiciadores] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [auspiciadorId, setAuspiciadorId] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [resumen, setResumen] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoAuspiciador, setGuardandoAuspiciador] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    Promise.all([api('/eventos'), api('/auspiciadores')])
      .then(([listaEventos, listaAuspiciadores]) => {
        if (!activo) return;
        setEventos(listaEventos);
        setAuspiciadores(listaAuspiciadores);
        setEventoId((actual) => actual || listaEventos[0]?.id || '');
        setAuspiciadorId((actual) => actual || listaAuspiciadores[0]?.id || '');
        setError('');
      })
      .catch((err) => { if (activo) setError(`No se pudieron cargar los datos: ${err.message}`); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!eventoId) return;
    let activo = true;
    api(`/eventos/${eventoId}/canjes`)
      .then((datos) => { if (activo) { setResumen(datos); setError(''); } })
      .catch((err) => { if (activo) setError(`No se pudieron consultar los canjes: ${err.message}`); });
    return () => { activo = false; };
  }, [eventoId, recarga]);

  async function crearAuspiciador(evento) {
    evento.preventDefault();
    setAviso('');
    setError('');
    if (!nombreNuevo.trim()) { setError('Ingresa el nombre del auspiciador.'); return; }
    setGuardandoAuspiciador(true);
    try {
      const nuevo = await api('/auspiciadores', { method: 'POST', body: { nombre: nombreNuevo.trim() } });
      setAuspiciadores((actuales) => [...actuales, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setAuspiciadorId(nuevo.id);
      setNombreNuevo('');
      setAviso('Auspiciador registrado correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoAuspiciador(false);
    }
  }

  async function registrarCanje(evento) {
    evento.preventDefault();
    setError('');
    setAviso('');
    const montoNumero = Number(monto);
    if (!eventoId || !auspiciadorId) {
      setError('Selecciona un evento y un auspiciador.');
      return;
    }
    if (!Number.isSafeInteger(montoNumero) || montoNumero <= 0 || !/^\d+$/.test(monto.trim())) {
      setError('El valor estimado debe ser un número entero mayor que cero.');
      return;
    }
    setGuardando(true);
    try {
      await api(`/eventos/${eventoId}/canjes`, {
        method: 'POST',
        body: {
          auspiciadorId,
          descripcion: descripcion.trim() || undefined,
          montoEstimadoClp: montoNumero,
        },
      });
      setMonto('');
      setDescripcion('');
      setResumen(null);
      setRecarga((valor) => valor + 1);
      setAviso('Canje registrado correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const resumenActual = resumen?.eventoId === eventoId ? resumen : null;
  const estiloSelect = 'w-full rounded-lg border border-line-strong bg-field px-3 py-2 text-sm text-main focus:border-primary-alt focus:outline-none';

  return (
    <section className="mt-8 space-y-4 text-main" aria-labelledby="titulo-canjes-rf8">
      <div>
        <h2 id="titulo-canjes-rf8" className="text-xl font-bold">Canjes de auspiciadores</h2>
        <p className="mt-1 text-sm text-muted">Registra aportes en productos o servicios valorizados en pesos chilenos. No representan dinero recibido.</p>
      </div>
      {cargando && <p role="status" className="text-muted">Cargando eventos y auspiciadores...</p>}
      {error && <p role="alert" className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {aviso && <p role="status" className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">{aviso}</p>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card id="rf8-nuevo-auspiciador" className="scroll-mt-6">
          <h3 className="mb-3 text-base font-semibold">Nuevo auspiciador</h3>
          <form onSubmit={crearAuspiciador} className="space-y-3">
            <Input label="Nombre del auspiciador" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} maxLength={150} required placeholder="Ej.: Empresa deportiva" />
            <Button type="submit" disabled={guardandoAuspiciador}>{guardandoAuspiciador ? 'Guardando...' : 'Agregar auspiciador'}</Button>
          </form>
        </Card>
        <Card>
          <h3 className="mb-3 text-base font-semibold">Registrar canje</h3>
          <form onSubmit={registrarCanje} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="rf8-evento">Evento</label>
              <select id="rf8-evento" className={estiloSelect} value={eventoId} onChange={(e) => setEventoId(e.target.value)} required>
                <option value="">Selecciona un evento</option>
                {eventos.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="rf8-auspiciador">Auspiciador</label>
              <select id="rf8-auspiciador" className={estiloSelect} value={auspiciadorId} onChange={(e) => setAuspiciadorId(e.target.value)} required>
                <option value="">Selecciona un auspiciador</option>
                {auspiciadores.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}
              </select>
            </div>
            <Input label="Descripción del aporte (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={1000} placeholder="Ej.: Alimentación para el evento" />
            <Input label="Valor estimado (CLP)" type="number" min="1" step="1" required value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="25000" />
            <Button type="submit" disabled={guardando || !eventoId || !auspiciadorId}>{guardando ? 'Guardando...' : 'Registrar canje'}</Button>
          </form>
        </Card>
      </div>
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Canjes del evento seleccionado</h3>
          <p className="text-sm font-semibold text-success">Total valorizado: {resumenActual ? formatoCLP(resumenActual.totalEstimadoClp) : '—'}</p>
        </div>
        {!eventoId ? (
          <p className="text-sm text-muted">No hay eventos disponibles. Es necesario registrar uno primero.</p>
        ) : !resumenActual ? (
          <p className="text-sm text-muted">Consultando canjes...</p>
        ) : resumenActual.canjes.length === 0 ? (
          <p className="text-sm text-muted">Este evento todavía no tiene canjes registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="border-b border-line-strong text-muted"><tr><th className="p-2">Auspiciador</th><th className="p-2">Descripción</th><th className="p-2 text-right">Valor estimado</th></tr></thead>
              <tbody>{resumenActual.canjes.map((canje) => (
                <tr className="border-b border-line" key={canje.id}>
                  <td className="p-2">{canje.auspiciadorNombre}</td>
                  <td className="p-2 text-muted">{canje.descripcion || 'Sin descripción'}</td>
                  <td className="p-2 text-right">{formatoCLP(canje.montoEstimadoClp)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
