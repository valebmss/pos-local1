import { ScanCommand } from "@aws-sdk/client-dynamodb"; // Cambiado aquí
import { unmarshall } from "@aws-sdk/util-dynamodb";
import ddbDocClient from "@/lib/aws";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const method = 'GET'; // El método es GET porque esta función es para manejar las peticiones GET.

  try {
    switch (method) {
      case 'GET':
        if (searchParams.has('fecha')) {
          const fecha = searchParams.get('fecha');
          console.log(`Consultando ventas por fecha: ${fecha}`);
          return await getVentasPorDia(fecha);
        } else if (searchParams.has('anio') && searchParams.has('mes')) {
          const anio = searchParams.get('anio');
          const mes = searchParams.get('mes');
          console.log(`Consultando ventas por año: ${anio} y mes: ${mes}`);
          return await getVentasPorMes(anio, mes);
        } else if (searchParams.has('anio')) {
          const anio = searchParams.get('anio');
          console.log(`Consultando ventas por año: ${anio}`);
          return await getVentasPorAnio(anio);
        } else if (searchParams.has('fechaInicio') && searchParams.has('fechaFin')) {
          const fechaInicio = searchParams.get('fechaInicio');
          const fechaFin = searchParams.get('fechaFin');
          console.log(`Consultando ventas por rango de fechas: ${fechaInicio} - ${fechaFin}`);
          return await getVentasPorRangoFechas(fechaInicio, fechaFin);
        } else {
          console.log('Parámetros no válidos');
          return new Response(JSON.stringify({ error: 'Parámetros no válidos' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      default:
        console.log(`Método ${method} no permitido`);
        return new Response(`Método ${method} no permitido`, {
          status: 405,
          headers: { Allow: 'GET' },
        });
    }
  } catch (error) {
    console.error('Error en la API:', error);
    return new Response(JSON.stringify({ error: 'Error interno en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

const getVentasPorDia = async (fecha) => {
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
    return new Response(JSON.stringify({ ventas, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener ventas por día' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

const getVentasPorMes = async (anio, mes) => {
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
    return new Response(JSON.stringify({ ventas, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener ventas por mes:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener ventas por mes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

const getVentasPorAnio = async (anio) => {
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
    return new Response(JSON.stringify({ ventas, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener ventas por año:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener ventas por año' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

const getVentasPorRangoFechas = async (fechaInicio, fechaFin) => {
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
    const command = new ScanCommand(params); // Cambiado aquí
    const data = await ddbDocClient.send(command);
    const ventas = data.Items.map(unmarshall);
    const total = ventas.reduce((acc, venta) => acc + venta.monto_total, 0);
    return new Response(JSON.stringify({ ventas, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener ventas por rango de fechas:', error);
    return new Response(JSON.stringify({ error: 'Error interno en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
