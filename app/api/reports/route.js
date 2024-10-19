import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import ddbDocClient from "@/lib/aws";

export default async (req, res) => {
  const { method, query } = req;
  console.log('Query:', query);
  console.log('Method:', method);

  try {
    switch (method) {
      case 'GET':
        await handleGetRequest(query, res);
        break;
      default:
        handleMethodNotAllowed(res, method);
    }
  } catch (error) {
    console.error('Error en la API:', error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// Función para manejar solicitudes GET
const handleGetRequest = async (query, res) => {
  if (query.fecha) {
    console.log(`Consultando ventas por fecha: ${query.fecha}`);
    await getVentasPorDia(query.fecha, res);
  } else if (query.anio && query.mes) {
    console.log(`Consultando ventas por año: ${query.anio} y mes: ${query.mes}`);
    await getVentasPorMes(query.anio, query.mes, res);
  } else if (query.anio) {
    console.log(`Consultando ventas por año: ${query.anio}`);
    await getVentasPorAnio(query.anio, res);
  } else if (query.startDate && query.endDate) {  // Cambié los nombres aquí
    console.log(`Consultando ventas por rango de fechas: ${query.startDate} - ${query.endDate}`);
    await getVentasPorRangoFechas(query.startDate, query.endDate, res);  // Y aquí
  } else {
    console.log('Parámetros no válidos');
    res.status(400).json({ error: 'Parámetros no válidos' });
  }
};

// Función para manejar métodos no permitidos
const handleMethodNotAllowed = (res, method) => {
    console.log(`Método ${method} no permitido`); // Esto debería ayudar a identificar el problema.
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${method} no permitido`);
  };
  
// Función para obtener ventas por día
const getVentasPorDia = async (fecha, res) => {
  const params = {
    TableName: 'Ventas',
    FilterExpression: 'fecha = :fecha',
    ExpressionAttributeValues: { ':fecha': { S: fecha } },
  };

  console.log('Params para ventas por día:', params);

  try {
    const command = new ScanCommand(params);
    const data = await ddbDocClient.send(command);
    const ventas = data.Items.map(unmarshall);
    const total = ventas.reduce((acc, venta) => acc + venta.monto_total, 0);
    res.json({ ventas, total });
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    res.status(500).json({ error: 'Error al obtener ventas por día' });
  }
};

// Función para obtener ventas por mes
const getVentasPorMes = async (anio, mes, res) => {
  const params = {
    TableName: 'Ventas',
    FilterExpression: 'begins_with(fecha, :fecha)',
    ExpressionAttributeValues: { ':fecha': { S: `${anio}-${mes}` } },
  };

  console.log('Params para ventas por mes:', params);

  try {
    const command = new ScanCommand(params);
    const data = await ddbDocClient.send(command);
    const ventas = data.Items.map(unmarshall);
    const total = ventas.reduce((acc, venta) => acc + venta.monto_total, 0);
    res.json({ ventas, total });
  } catch (error) {
    console.error('Error al obtener ventas por mes:', error);
    res.status(500).json({ error: 'Error al obtener ventas por mes' });
  }
};

// Función para obtener ventas por año
const getVentasPorAnio = async (anio, res) => {
  const params = {
    TableName: 'Ventas',
    FilterExpression: 'begins_with(fecha, :fecha)',
    ExpressionAttributeValues: { ':fecha': { S: anio } },
  };

  console.log('Params para ventas por año:', params);

  try {
    const command = new ScanCommand(params);
    const data = await ddbDocClient.send(command);
    const ventas = data.Items.map(unmarshall);
    const total = ventas.reduce((acc, venta) => acc + venta.monto_total, 0);
    res.json({ ventas, total });
  } catch (error) {
    console.error('Error al obtener ventas por año:', error);
    res.status(500).json({ error: 'Error al obtener ventas por año' });
  }
};

// Función para obtener ventas por rango de fechas
const getVentasPorRangoFechas = async (fechaInicio, fechaFin, res) => {
  const params = {
    TableName: 'Ventas',
    FilterExpression: 'fecha BETWEEN :fechaInicio AND :fechaFin',
    ExpressionAttributeValues: {
      ':fechaInicio': { S: fechaInicio },
      ':fechaFin': { S: fechaFin },
    },
  };

  console.log('Params para ventas por rango de fechas:', params);

  try {
    const command = new ScanCommand(params);
    const data = await ddbDocClient.send(command);
    const ventas = data.Items.map(unmarshall);
    const total = ventas.reduce((acc, venta) => acc + venta.monto_total, 0);
    res.json({ ventas, total });
  } catch (error) {
    console.error('Error al obtener ventas por rango de fechas:', error);
    res.status(500).json({ error: 'Error al obtener ventas por rango de fechas' });
  }
};
