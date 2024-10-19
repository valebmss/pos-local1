import { Parser } from 'json2csv';
import jsPDF from 'jspdf';


export const generateCSV = (data) => {
  const csvParser = new Parser();
  const csv = csvParser.parse(data);

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_ventas.csv';
  a.click();
};



export const generatePDF = (data) => {
  const doc = new jsPDF();
  
  doc.text('Reporte de Ventas', 10, 10);

  data.forEach((item, index) => {
    doc.text(`${item.fecha} - ${item.producto} - ${item.cantidad} - ${item.total}`, 10, 20 + (index * 10));
  });

  doc.save('reporte_ventas.pdf');
};
