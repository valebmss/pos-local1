'use client'; // Indica que este componente es un Client Component

import { useRouter } from 'next/navigation';

const FinalizarVenta = () => {
  const router = useRouter();

  const handleFinalizar = async () => {
    // Lógica para finalizar la venta
    const ventaDetalles = {
      // Detalles de la venta, como productos, total, etc.
    };

    // Aquí puedes enviar los detalles a tu backend o almacenarlos

    // Redirigir a la página de la factura con el ID de la venta
    router.push(`/factura?id=id-de-la-venta`); // Cambia 'id-de-la-venta' al ID real
  };

  return (
    <button onClick={handleFinalizar}>Finalizar Venta</button>
  );
};

export default FinalizarVenta;
