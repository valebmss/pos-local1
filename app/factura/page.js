'use client'; // Indica que este componente es un Client Component

import { useSearchParams } from 'next/navigation'; // Importar useSearchParams
import { useEffect, useState } from 'react'; // Importar useEffect y useState

export default function Factura() {
  const searchParams = useSearchParams(); // Obtener los parámetros de búsqueda
  const id = searchParams.get('id'); // Obtener el ID de la venta
  const [factura, setFactura] = useState(null); // Estado para almacenar la factura

  useEffect(() => {
    const obtenerFactura = async () => {
      if (id) {
        try {
          const response = await fetch(`/api/factura?id=${id}`); // Ajusta esta URL a tu API
          const data = await response.json();
          setFactura(data);
        } catch (error) {
          console.error("Error al obtener la factura:", error);
        }
      }
    };

    obtenerFactura(); // Llamar a la función para obtener la factura
  }, [id]); // Ejecutar el efecto cada vez que cambie el ID

  return (
    <div>
      <h1>Factura</h1>
      {/* Muestra los detalles de la factura */}
      {factura ? (
        <div>
          <p>Detalles de la venta: {JSON.stringify(factura)}</p>
          <p>Total: {factura.total}</p>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
}
