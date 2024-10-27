'use client';

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'react-datepicker/dist/react-datepicker.css';
import 'jspdf-autotable';
import MainLayout from '../components/MainLayout';


const ReportsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState([]); // Inicializamos reportData como un array vacío
  const [loading, setLoading] = useState(false); // Estado de carga
  const [reportType, setReportType] = useState('day');
  const [salesData, setSalesData] = useState([]);
  const [total, setTotal] = useState(0);
  const [expandedVenta, setExpandedVenta] = useState(null); // Estado para manejar qué venta está expandida





  const fetchReport = async () => {
    let url = '';
    if (reportType === 'day') {
      const formattedDate = format(startDate, 'yyyy-MM-dd');
      url = `/api/ventas?fecha=${formattedDate}`;
      console.log('url',  url);
    } else if (reportType === 'month') {
      const year = format(startDate, 'yyyy');
      const month = format(startDate, 'MM');
      url = `/api/ventas?anio=${year}&mes=${month}`;
      console.log('url',  url);
    } else if (reportType === 'year') {
      const year = format(startDate, 'yyyy');
      url = `/api/ventas?anio=${year}`;
      console.log('url',  url);

    } else if (reportType === 'range') {
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');
      url = `/api/ventas?fechaInicio=${start}&fechaFin=${end}`;
      console.log('url',  url);

    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      const formattedTotal = data.total ? data.total.toLocaleString() : '0';
      console.log('data',  data);
      setSalesData(data.ventas || []);
      console.log('data.ventas',  data.ventas);
      setTotal(formattedTotal);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setSalesData([]);
      setTotal(0);
    }
  };
  const toggleVenta = (index) => {
    if (expandedVenta === index) {
      setExpandedVenta(null); // Cierra la venta si está abierta
    } else {
      setExpandedVenta(index); // Expande la venta
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let startY = 26; // Inicializa startY aquí

    doc.text('Reporte de Ventas', 14, 16);
  
    console.log("salesData", salesData);
    
    salesData.forEach((venta, index) => {
      // Información de la venta principal
      const mainVentaData = [
        [`Venta #${index + 1}`, '', ''], // Título de la venta
        ['Fecha:', venta.fecha, ''], // Fecha de la venta
        ['Método de Pago:', venta.metodo_pago, ''], // Método de pago de la venta
        ['Monto Total:', `$${venta.monto_total}`, ''], // Monto total de la venta
      ];
      
      console.log("venta.items", venta.item);
      console.log("venta.array", Array.isArray(venta.item));
      // Productos de la venta
      if (venta.item && Array.isArray(venta.item)) {
        // Productos de la venta
        const productosData = venta.item.map(item => [
          item.Producto || '', // Nombre del producto (manejar si es undefined)
          item.Cantidad || 0, // Cantidad del producto (manejar si es undefined)
          `$${item.monto || 0}`, // Total del producto (manejar si es undefined)
        ]);
        doc.autoTable({
          head: [['Producto', 'Cantidad', 'Total']],
          body: productosData,
          startY: startY, // Usar el startY actual para la tabla de productos
        });
  
        // Incrementar startY para la próxima tabla principal
        startY = doc.autoTable.previous.finalY + 10;
  
      } else {
        // En caso de que no haya items, mostrar un mensaje o manejar el caso según necesidad
        console.log(`No hay productos para la venta #${index + 1}`);
      }
  
      // Añadir tabla principal de la venta
      doc.autoTable({
        head: [],
        body: mainVentaData,
        startY: index === 0 ? 26 : doc.autoTable.previous.finalY + 10,
      });
      });
  
    doc.save('reporte_de_ventas.pdf');
  };

  return (
    <MainLayout>

    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Generar Reporte de Ventas</h1>
      <div className="mb-4">
        <label className="block mb-2">
          Tipo de Reporte:
          <select
            className="ml-2 p-2 border border-gray-300 rounded"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="day">Día</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
            <option value="range">Rango de Fechas</option>
          </select>
        </label>
      </div>
      {reportType === 'range' ? (
        <div className="mb-4">
          <label className="block mb-2">
            Fecha Inicio:
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy-MM-dd"
              className="ml-2 p-2 border border-gray-300 rounded"
            />
          </label>
          <label className="block mb-2">
            Fecha Fin:
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="yyyy-MM-dd"
              className="ml-2 p-2 border border-gray-300 rounded"
            />
          </label>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block mb-2">
            Fecha:
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              showMonthYearPicker={reportType === 'month'}
              showYearPicker={reportType === 'year'}
              dateFormat={reportType === 'day' ? "yyyy-MM-dd" : reportType === 'month' ? "yyyy-MM" : "yyyy"}
              className="ml-2 p-2 border border-gray-300 rounded"
            />
          </label>
        </div>
      )}
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
        onClick={fetchReport}
        disabled={!startDate || (reportType === 'range' && !endDate)}
      >
        Consultar
      </button>
      <button
        className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ${!salesData.length && 'opacity-50 cursor-not-allowed'}`}
        onClick={generatePDF}
        disabled={!salesData.length}
      >
        Descargar PDF
      </button>
      <div className="mt-4">
        <h2 className="text-lg font-bold">Total: ${total}</h2>
        <ul className="mt-4 divide-y divide-gray-200">
          {salesData.map((venta, index) => (
            <li key={index} className="py-2">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleVenta(index)}
              >
                <div className="text-gray-800">{venta.fecha}</div>
                <div className="text-gray-600">${venta.monto_total}</div>
              </div>
              {expandedVenta === index && (
                <ul className="mt-2 pl-4">
                  {venta.item.map((item, idx) => (
                    <li key={idx} className="py-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800">{item.Producto}</span>
                        <span className="text-gray-600">
                          ${item.monto} (Cantidad: {item.Cantidad})
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
    </MainLayout>

  );
};
export default ReportsPage;
