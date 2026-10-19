import { useState, useEffect } from "react";

export default function Dashboard() {
  const [filtroMes, setFiltroMes] = useState("Septiembre");
  const [filtroCliente, setFiltroCliente] = useState("Todos");

  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-300 p-8 font-sans">


      {/*Encabezado y filtros*/}
      <div className="mb-8 flex justify-between items-end border-b border-[#21293A] pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard Rentabilidad</h1>
          <p className="text-sm text-gray-500">Miércoles, 30 de septiembre de 2026</p>
        </div>

        <div className="flex gap-4">
          {/* Filtro Cliente */}
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="bg-[#161B22] border border-[#21293A] rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="Todos">Todos los Clientes</option>
            <option value="Gatorade">Gatorade Chile</option>
            <option value="Universidad">Univ. del Pacífico</option>
          </select>

          {/* Filtro Mes */}
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-[#161B22] border border-[#21293A] rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="Septiembre">Septiembre 2026</option>
            <option value="Octubre">Octubre 2026</option>
          </select>
        </div>
      </div>

      {/*Tarjetas*/}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#161B22] p-5 rounded-xl border border-[#21293A] shadow-sm">
          <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2">Ingresos + Canjes + Kits</h3>
          <p className="text-3xl font-bold text-emerald-400">$3.450.000</p>
          <p className="text-xs text-gray-500 mt-2">Total bruto</p>
        </div>
        <div className="bg-[#161B22] p-5 rounded-xl border border-[#21293A] shadow-sm">
          <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2">Personal + Gastos Oper.</h3>
          <p className="text-3xl font-bold text-rose-400">$1.270.000</p>
          <p className="text-xs text-gray-500 mt-2">Liquidación total</p>
        </div>
        <div className="bg-[#161B22] p-5 rounded-xl border border-[#21293A] shadow-sm">
          <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2">Utilidad Neta</h3>
          <p className="text-3xl font-bold text-blue-400">$2.180.000</p>
          <p className="text-xs text-gray-500 mt-2">Rentabilidad neta</p>
        </div>
        <div className="bg-[#161B22] p-5 rounded-xl border border-[#21293A] shadow-sm">
          <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2">Por Cobrar</h3>
          <p className="text-3xl font-bold text-amber-400">$1.150.000</p>
          <p className="text-xs text-gray-500 mt-2">Auspiciadores pendientes</p>
        </div>
      </div>

      {/*Contenedor Principal*/}
      <div className="grid grid-cols-3 gap-6">

        {/*Gráfico de Rentabilidad*/}
        <div className="col-span-2 bg-[#161B22] rounded-xl border border-[#21293A] p-6 min-h-[350px] flex flex-col items-center justify-center">
          <div className="border-2 border-dashed border-[#21293A] rounded-lg p-10 text-center w-full max-w-md">
            <p className="text-gray-400 text-sm mb-2">Espacio para Gráfico de Rentabilidad</p>
          </div>
        </div>

        {/*Lista de cobros*/}
        <div className="bg-[#161B22] rounded-xl border border-[#21293A] p-6">
          <h3 className="text-sm text-white font-bold mb-4 border-b border-[#21293A] pb-3">Cobros Pendientes</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#0D1117] p-3 rounded-lg border border-[#21293A]">
              <div>
                <p className="text-sm text-gray-300 font-medium">Gatorade Chile</p>
                <p className="text-xs text-gray-500">Sandra Muñoz</p>
              </div>
              <span className="text-sm font-bold text-amber-400">$150.000</span>
            </div>
            <div className="flex justify-between items-center bg-[#0D1117] p-3 rounded-lg border border-[#21293A]">
              <div>
                <p className="text-sm text-gray-300 font-medium">Univ. del Pacífico</p>
                <p className="text-xs text-gray-500">Héctor Reyes</p>
              </div>
              <span className="text-sm font-bold text-amber-400">$200.000</span>
            </div>
            <div className="flex justify-between items-center bg-[#0D1117] p-3 rounded-lg border border-[#21293A]">
              <div>
                <p className="text-sm text-gray-300 font-medium">Movistar Deportes</p>
                <p className="text-xs text-gray-500">Jorge Castillo</p>
              </div>
              <span className="text-sm font-bold text-amber-400">$800.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}