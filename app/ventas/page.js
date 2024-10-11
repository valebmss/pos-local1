'use client';

import ddbDocClient from "@/lib/aws";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { useEffect, useState } from 'react';

const fetchInventoryData = async () => {
  const params = {
    TableName: 'Inventario',
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    console.error('Error fetching data:', err);
    return [];
  }
};

const updateProductStock = async (productId, newStock) => {
  const params = {
    TableName: 'Inventario',
    Key: { product_id: productId },
    UpdateExpression: 'set stock = :s',
    ExpressionAttributeValues: {
      ':s': newStock,
    },
  };

  try {
    await ddbDocClient.send(new UpdateCommand(params));
    return true;
  } catch (err) {
    console.error('Error updating stock:', err);
    return false;
  }
};

export default function PanelVentas() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchInventoryData();
      setProductos(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddToCart = (producto) => {
    setCarrito((prev) => {
      const existingProduct = prev.find((p) => p.product_id === producto.product_id);
      if (existingProduct) {
        return prev.map((p) =>
          p.product_id === producto.product_id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { ...producto, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productoId) => {
    setCarrito((prev) => prev.filter((p) => p.product_id !== productoId));
  };

  const handleCheckout = async () => {
    for (const item of carrito) {
      const newStock = item.stock - item.quantity;
      await updateProductStock(item.product_id, newStock);
    }
    alert('Venta completada. ¡Gracias por su compra!');
    setCarrito([]);
    setTotal(0);
  };

  useEffect(() => {
    const totalAmount = carrito.reduce((acc, item) => acc + item.precio_venta * item.quantity, 0);
    setTotal(totalAmount);
  }, [carrito]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Panel de Ventas</h1>

      {/* Sección de productos */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Productos Disponibles</h2>
        {loading ? (
          <p className="text-center">Cargando productos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((producto) => (
              <div key={producto.product_id} className="border p-4 rounded shadow">
                <h3 className="font-bold">{producto.nombre}</h3>
                <p>Precio: ${producto.precio_venta}</p>
                <p>Stock: {producto.stock}</p>
                <button
                  className="mt-2 bg-blue-500 text-white py-1 px-3 rounded"
                  onClick={() => handleAddToCart(producto)}
                  disabled={producto.stock <= 0}
                >
                  {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de carrito */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Carrito</h2>
        {carrito.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <div>
            <ul>
              {carrito.map((item) => (
                <li key={item.product_id} className="flex justify-between py-2">
                  <span>{item.nombre} (x{item.quantity})</span>
                  <span>${item.precio_venta * item.quantity}</span>
                  <button
                    className="text-red-500 ml-4"
                    onClick={() => handleRemoveFromCart(item.product_id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
            <h3 className="font-bold mt-4">Total: ${total}</h3>
            <button
              className="mt-4 bg-green-500 text-white py-2 px-4 rounded"
              onClick={handleCheckout}
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
