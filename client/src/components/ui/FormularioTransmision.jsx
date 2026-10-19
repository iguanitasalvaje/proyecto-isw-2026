import React, { useState } from 'react';

const FormularioTransmision = ({ onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    precioBase: '',
    fecha: '',
    personalRequerido: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos de la transmisión agendada:', formData);
    // Aquí irá la llamada a la API POST /api/eventos cuando conectemos el backend
    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-800 text-slate-100 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-lg w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Crear Nueva Transmisión
      </h2>

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
            Cliente:
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
            Precio Base ($):
          </label>
          <input
            type="number"
            name="precioBase"
            required
            placeholder="Ej: 150000"
            value={formData.precioBase}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha (Requisito RF2) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Fecha de la transmisión:
          </label>
          <input
            type="date"
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

        {/* Botón de envío */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer mt-2"
        >
          Agendar Transmisión
        </button>
      </form>
    </div>
  );
};

export default FormularioTransmision;