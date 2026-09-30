import React from 'react';

const FormularioTransmision = () => {
  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '30px',
      backgroundColor: '#f9f9f9',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '20px' }}>Crear Nueva Transmisión</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#34495e', fontWeight: 'bold' }}>Precio Base ($):</label>
          <input type="number" name="precioBase" required placeholder="Ej: 150000"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#34495e', fontWeight: 'bold' }}>Fecha de la transmisión:</label>
          <input type="date" name="fecha" required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#34495e', fontWeight: 'bold' }}>Personal Requerido:</label>
          <textarea name="personalRequerido" placeholder="Ej: 2 Camarógrafos..." rows="3"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'none' }} />
        </div>
        
        <button type="submit"
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '12px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '10px',
            transition: 'background 0.3s'
          }}>
          Agendar Transmisión
        </button>
        
      </form>
    </div>
  );
};

export default FormularioTransmision;