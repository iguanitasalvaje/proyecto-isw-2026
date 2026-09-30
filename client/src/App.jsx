import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// 1. Importas las pantallas desde pages/
import Dashboard from "./pages/Dueno/Dashboard";
import InventarioPage from "./pages/InventarioPage";
import ReportesPage from "./pages/ReportesPage";
import AuspiciadoresPage from "./pages/AuspiciadoresPage"
import Eventos from "./pages/Eventos";
import FinanzasPage from "./pages/FinanzasPage";
import CalculadoraPagos from "./pages/CalculadoraPagos/CalculadoraPagos";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#090d16' }}>
        {/* La barra lateral se mantiene visible en todo momento */}
        <Sidebar />

        {/* El contenido cambia según la ruta activa */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<InventarioPage />} />
            
            {/* 2. Registras las nuevas rutas aquí: */}
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/finanzas" element={<FinanzasPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/auspiciadores" element={<AuspiciadoresPage />} />
            <Route path="/calculadora-pagos" element={<CalculadoraPagos />} />

            {/* 3. Ruta 404: */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-32">
                <h2 className="text-6xl font-bold text-white mb-4">404</h2>
                <p className="text-xl">Página no encontrada</p>
                <p className="text-sm mt-2 text-gray-500">Este módulo aún no ha sido implementado.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;