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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchInventoryData();
      setProductos(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddToCart = (producto) => {
    // Permitir agregar al carrito incluso si el stock es 0
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

  const handleQuantityChange = (productoId, newQuantity) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.product_id === productoId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleCheckout = async () => {
    for (const item of carrito) {
      const newStock = item.stock - item.quantity;
      await updateProductStock(item.product_id, newStock);
    }
    alert('Venta completada. ¡Gracias por su compra!');
    setCarrito([]);
    setTotal(0);
    window.location.reload();

  };

  useEffect(() => {
    const totalAmount = carrito.reduce((acc, item) => acc + item.precio_venta * item.quantity, 0);
    setTotal(totalAmount);
  }, [carrito]);

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    producto.product_id.toString().includes(searchTerm)
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Panel de Ventas</h1>

      <input
        type="text"
        placeholder="Buscar productos..."
        className="mb-4 p-2 border rounded w-full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Sección de productos */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Productos Disponibles</h2>
        {loading ? (
          <p className="text-center">Cargando productos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProductos.map((producto) => (
              <div 
                key={producto.product_id} 
                className={`border p-4 rounded shadow ${producto.stock < 10 ? 'bg-red-100' : ''}`}
              >
                <h3 className="font-bold">{producto.nombre}</h3>
                <p>Precio: ${producto.precio_venta}</p>
                <p>
                  Stock: { producto.stock}
                </p>
                <button
                  className="mt-2 bg-blue-500 text-white py-1 px-3 rounded"
                  onClick={() => handleAddToCart(producto)}
                >
                  Agregar al Carrito
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de carrito */}
      <div className="bg-gray-100 rounded-lg p-6 shadow-md">
  <h2 className="text-2xl font-semibold mb-4 text-center">Carrito de Compras</h2>
  {carrito.length === 0 ? (
    <p className="text-center">No hay productos en el carrito.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border-b text-left">Producto</th>
            <th className="py-2 px-4 border-b text-left">Cantidad</th>
            <th className="py-2 px-4 border-b text-left">Precio Unitario</th>
            <th className="py-2 px-4 border-b text-left">Subtotal</th>
            <th className="py-2 px-4 border-b text-left">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          {carrito.map((item) => (
            <tr key={item.product_id} className="hover:bg-gray-100 transition duration-200">
              <td className="py-4 px-4">{item.nombre}</td>
              <td className="py-4 px-4">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  className="w-16 border rounded p-1 text-center"
                  onChange={(e) => handleQuantityChange(item.product_id, Number(e.target.value))}
                />
              </td>
              <td className="py-4 px-4">${item.precio_venta}</td>
              <td className="py-4 px-4 font-semibold">
                ${item.precio_venta * item.quantity}
              </td>
              <td className="py-4 px-4">
                <button
                  className="text-red-500 hover:text-red-700 transition duration-200"
                  onClick={() => handleRemoveFromCart(item.product_id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="font-bold text-xl mt-4 text-right">Total: ${total}</h3>
      <button
        className="mt-6 bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded transition duration-200"
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
