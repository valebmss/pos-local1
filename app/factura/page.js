'use client'; // Indica que este componente es un Client Component

import { useEffect, useState } from 'react'; // Importar useEffect y useState

export default function Factura() {

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
