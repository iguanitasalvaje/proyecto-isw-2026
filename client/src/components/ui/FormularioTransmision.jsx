import React, { useState } from 'react';
import { api } from '../../services/api';

const FormularioTransmision = ({ onClose, onEventoCreado }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    precioBase: '',
    fecha: '',
    personalRequerido: '',
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación según Requisito Funcional RF2 (Precio Base > 0)
    const precio = Number(formData.precioBase);
    if (!Number.isSafeInteger(precio) || precio <= 0) {
      setError('El Precio Base debe ser un valor numérico entero mayor a cero (RF2).');
      return;
    }

    try {
      setCargando(true);

      // Petición POST real al endpoint del backend (/api/eventos)
      await api('/eventos', {
        method: 'POST',
        body: {
          nombre: formData.nombre.trim(),
          cliente: formData.cliente.trim(),
          precioBase: precio,
          montoTotalEvento: precio, // Asegura compatibilidad backend
          fecha: formData.fecha ? new Date(formData.fecha).toISOString() : null,
          lugar: formData.personalRequerido ? `Req: ${formData.personalRequerido.trim()}` : null,
          estado: 'pendiente', // Cumplimiento de Postcondición RF2 ("Agendado / Pendiente")
        },
      });

      // Refrescar la lista de eventos en el componente padre
      if (onEventoCreado) {
        await onEventoCreado();
      }

      // Cerrar el modal
      if (onClose) onClose();
    } catch (err) {
      console.error('Error al agendar la transmisión:', err);
      setError(err.message || 'No se pudo guardar la transmisión en el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-slate-800 text-slate-100 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-lg w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Crear Nueva Transmisión (RF2)
      </h2>

      {/* Alerta de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-950/80 border border-red-600 text-red-200 text-xs rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del Evento */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Nombre del Evento:
          </label>
          <input
            type="text"
            name="nombre"
            required
            placeholder="Ej: Lanzamiento Producto Falabella"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Cliente / Auspiciador:
          </label>
          <input
            type="text"
            name="cliente"
            required
            placeholder="Ej: Falabella Corporativo"
            value={formData.cliente}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* Precio Base (Requisito RF2) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Precio Base ($ CLP):
          </label>
          <input
            type="number"
            name="precioBase"
            min="1"
            required
            placeholder="Ej: 450000"
            value={formData.precioBase}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha y Hora (Requisito RF2) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Fecha y Hora de la transmisión:
          </label>
          <input
            type="datetime-local"
            name="fecha"
            required
            value={formData.fecha}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm scheme-dark"
          />
        </div>

        {/* Personal Requerido (Requisito RF2) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Personal Requerido:
          </label>
          <textarea
            name="personalRequerido"
            rows="3"
            placeholder="Ej: 2 Camarógrafos, 1 Sonidista..."
            value={formData.personalRequerido}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="w-1/2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={cargando}
            className={`${
              onClose ? 'w-1/2' : 'w-full'
            } bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {cargando ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Guardando...</span>
              </>
            ) : (
              'Agendar Transmisión'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioTransmision;