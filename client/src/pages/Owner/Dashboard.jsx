import { useState, useEffect } from "react";

export default function Dashboard() {
  const [filtro, setFiltro] = useState("mes");
  const [utilidad, setUtilidad] = useState(0);

  useEffect(() => {
    const cargarDatosSimulados = () => {
      const ganancia = filtro === "mes" ? 2500000 : 850000;
      setUtilidad(ganancia);
    };
    
    cargarDatosSimulados();
  }, [filtro]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard de Rentabilidad</h2>
      
      <div className="mb-6">
        <label className="mr-2 font-semibold">Evaluar desempeño por:</label>
        <select 
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="mes">Mes / Temporada</option>
          <option value="cliente">Cliente / Auspiciador</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-sm border-l-4 border-green-500">
        <h3 className="text-gray-500 text-sm font-bold uppercase">Utilidad Neta Real</h3>
        <p className="text-3xl font-black text-green-700 mt-2">
          ${utilidad.toLocaleString("es-CL")}
        </p>
      </div>
    </div>
  );
}