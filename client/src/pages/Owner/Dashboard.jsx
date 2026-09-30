import { useState, useEffect } from "react";

export default function Dashboard() {
  const [filtroMes, setFiltroMes] = useState("Septiembre");

  return (
    <div className="min-h-screen bg-[#13151a] text-gray-300 p-8 font-sans">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">martes, 29 de septiembre de 2026</p>
        </div>

        <div className="flex gap-4">
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-[#1c1f26] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none"
          >
            <option value="Septiembre">Septiembre 2026</option>
            <option value="Octubre">Octubre 2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1c1f26] h-28 rounded-lg border border-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Contenedor Ingresos</span>
        </div>
        <div className="bg-[#1c1f26] h-28 rounded-lg border border-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Contenedor Gastos</span>
        </div>
        <div className="bg-[#1c1f26] h-28 rounded-lg border border-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Contenedor Utilidad Neta</span>
        </div>
        <div className="bg-[#1c1f26] h-28 rounded-lg border border-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Contenedor Por Cobrar</span>
        </div>
      </div>
    </div>
  );
}
