'use client';

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { generateCSV, generatePDF } from '@/lib/reports'; // Importamos las funciones para generar CSV y PDF
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'; // Para manipular fechas fácilmente

const ReportsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState([]); // Inicializamos reportData como un array vacío

  const fetchReport = async () => {
    if (startDate && endDate) {
      console.log('Consultando reporte de ventas...');
      try {
        // Formatear las fechas para obtener solo el día (YYYY-MM-DD)
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        console.log("startDate", formattedStartDate);
        console.log("endDate", formattedEndDate);
        const response = await fetch(`/api/reports?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
        if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.statusText}`);
        }
        const data = await response.json();
        setReportData(data.ventas || []); // Aseguramos que siempre sea un array
      } catch (error) {
        console.log('Error en la solicitud:', error);
        console.error('Error en la solicitud:', error);
      }
    }
  };

  // Funciones para rangos de tiempo rápidos
  const setQuickRange = (rangeType) => {
    const today = new Date();
    switch (rangeType) {
      case '1d':
        setStartDate(today);
        setEndDate(today);
        break;
      case '1w':
        setStartDate(addDays(today, -7));
        setEndDate(today);
        break;
      case '1m':
        setStartDate(addMonths(today, -1));
        setEndDate(today);
        break;
      case '1y':
        setStartDate(addYears(today, -1));
        setEndDate(today);
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reporte de Ventas</h1>

      <div className="mb-4">
        <label className="block text-lg mb-2">Selecciona el rango de fechas:</label>
        <div className="flex items-center mb-4">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Fecha de inicio"
            className="mr-2 border p-2"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="Fecha de fin"
            className="border p-2"
          />
        </div>

        {/* Botones de rango rápido */}
        <div className="flex space-x-4 mb-4">
          <button onClick={() => setQuickRange('1d')} className="bg-gray-500 text-white py-2 px-4 rounded">
            1 Día
          </button>
          <button onClick={() => setQuickRange('1w')} className="bg-gray-500 text-white py-2 px-4 rounded">
            1 Semana
          </button>
          <button onClick={() => setQuickRange('1m')} className="bg-gray-500 text-white py-2 px-4 rounded">
            1 Mes
          </button>
          <button onClick={() => setQuickRange('1y')} className="bg-gray-500 text-white py-2 px-4 rounded">
            1 Año
          </button>
        </div>
      </div>

      <button onClick={fetchReport} className="bg-blue-500 text-white py-2 px-4 rounded">
        Generar Reporte
      </button>

      {reportData.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Resultados del Reporte</h2>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((venta, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{venta.fecha}</td>
                  <td className="border px-4 py-2">{venta.producto}</td>
                  <td className="border px-4 py-2">{venta.cantidad}</td>
                  <td className="border px-4 py-2">${venta.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <button onClick={() => generateCSV(reportData)} className="bg-green-500 text-white py-2 px-4 rounded">
              Descargar CSV
            </button>
            <button onClick={() => generatePDF(reportData)} className="bg-red-500 text-white py-2 px-4 rounded ml-4">
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
