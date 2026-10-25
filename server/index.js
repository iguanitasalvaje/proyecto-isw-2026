const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rutas de control de acceso - RF1
const rf1Routes = require('./routes/rf1Routes');

const app = express();
const PORT = process.env.PORT || 1303;

app.use(cors());
app.use(express.json());

// Ruta original del proyecto
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    mensaje: 'Servidor del proyecto funcionando correctamente'
  });
});

// Rutas protegidas de RF1
app.use('/api/rf1', rf1Routes);

app.listen(PORT, () => {
  console.log(`Backend corriendo en el puerto ${PORT}`);
});