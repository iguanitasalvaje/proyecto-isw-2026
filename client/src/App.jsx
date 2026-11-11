import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Páginas de módulos
import Dashboard from './pages/Dueno/Dashboard';
import InventarioPage from './pages/InventarioPage';
import ReportesPage from './pages/ReportesPage';
import AuspiciadoresPage from './pages/AuspiciadoresPage';
import Eventos from './pages/Eventos';
import Personal from './pages/Personal';
import FinanzasPage from './pages/FinanzasPage';
import CalculadoraPagos from './pages/CalculadoraPagos/CalculadoraPagos';
import UsuariosPage from './pages/Dueno/UsuariosPage';
import LoginPage from './pages/LoginPage';

import './App.css';
import RutaProtegida from './components/RutaProtegida';

// Layout para páginas operativas autenticadas
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#090d16' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: Inicio de sesión */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas según la Matriz Definitiva de Permisos */}
        <Route
          path="/"
          element={
            <RutaProtegida ruta="/">
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/eventos"
          element={
            <RutaProtegida ruta="/eventos">
              <AppLayout>
                <Eventos />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/inventario"
          element={
            <RutaProtegida ruta="/inventario">
              <AppLayout>
                <InventarioPage />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/personal"
          element={
            <RutaProtegida ruta="/personal">
              <AppLayout>
                <Personal />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/auspiciadores"
          element={
            <RutaProtegida ruta="/auspiciadores">
              <AppLayout>
                <AuspiciadoresPage />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/finanzas"
          element={
            <RutaProtegida ruta="/finanzas">
              <AppLayout>
                <FinanzasPage />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/reportes"
          element={
            <RutaProtegida ruta="/reportes">
              <AppLayout>
                <ReportesPage />
              </AppLayout>
            </RutaProtegida>
          }
        />

        <Route
          path="/calculadora-pagos"
          element={
            <RutaProtegida ruta="/calculadora-pagos">
              <AppLayout>
                <CalculadoraPagos />
              </AppLayout>
            </RutaProtegida>
          }
        />

        {/* Módulo exclusivo de administración de usuarios para el Dueño */}
        <Route
          path="/usuarios"
          element={
            <RutaProtegida ruta="/usuarios">
              <AppLayout>
                <UsuariosPage />
              </AppLayout>
            </RutaProtegida>
          }
        />

        {/* 404 No encontrado */}
        <Route
          path="*"
          element={
            <AppLayout>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8' }}>
                <h2 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#ffffff', margin: '0 0 16px 0' }}>404</h2>
                <p style={{ fontSize: '1.25rem', margin: '0 0 8px 0' }}>Página no encontrada</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>El módulo o ruta solicitada no existe en el sistema.</p>
              </div>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
