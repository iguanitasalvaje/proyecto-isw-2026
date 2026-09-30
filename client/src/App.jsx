import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dueno/Dashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<Dashboard />} />
        {/* Ir agregando rutas de sus pages */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;