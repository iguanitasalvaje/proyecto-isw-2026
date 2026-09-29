import React from 'react';

const FormularioTransmision = () => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
      <h2>Crear Nueva Transmisión</h2>
      <form>
        <div style={{ marginBottom: '10px' }}>
          <label>Precio Base ($): </label>
          <input type="number" name="precioBase" required placeholder="Ej: 150000" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Fecha de la transmisión: </label>
          <input type="date" name="fecha" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Personal Requerido: </label>
          <textarea name="personalRequerido" placeholder="Ej: 2 Camarógrafos..." />
        </div>
        <button type="submit">Agendar Transmisión</button>
      </form>
    </div>
  );
};

export default FormularioTransmision;