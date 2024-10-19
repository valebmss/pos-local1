'use client';

import { ScanCommand, UpdateCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import ddbDocClient from "@/lib/aws";
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

export default function PanelVentas() {
  const [ventaItems, setVentaItems] = useState([]);
 
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [cliente, setCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [clienteIdInput, setClienteIdInput] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');



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

  const handleQuantityChange = (productoId, newQuantity) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.product_id === productoId ? { ...item, quantity: newQuantity } : item
      )
    );
  };


  const handleClienteIdKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarClientePorId();
    }
  };
  
  const buscarClientePorId = async () => {
    if (!clienteIdInput.trim()) return;
  
    const params = {
      TableName: 'Cliente',
      Key: {
        cliente_id: clienteIdInput.trim(),
      },
    };

    console.log("Region:", process.env.NEXT_PUBLIC_AWS_REGION);
console.log("Access Key:", process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID);
console.log("Secret Key:", process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY);

  
    try {
      const data = await ddbDocClient.send(new GetCommand(params));
      const clienteDefault = "No definido";

      if (data.Item) {
        console.log("Cliente input")
        setSelectedCliente(data.Item.nombre);
      } else {
        console.log("No encontrado")
        setSelectedCliente(clienteDefault);
      }
    } catch (err) {
      console.error('Error al buscar cliente por cliente_id:', err);
    }
  };
  

  useEffect(() => {
    const totalAmount = carrito.reduce((acc, item) => acc + item.precio_venta * item.quantity, 0);
    setTotal(totalAmount);
  }, [carrito]);

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    producto.product_id.toString().includes(searchTerm)
  );

  const finalizarVenta = async () => {
    const ventaData = {
      TableName: 'Ventas',
      Item: {
        venta_id: new Date().getTime().toString(),
        fecha: new Date().toISOString().split('T')[0],
        monto_total: total,
        metodo_pago: metodoPago,
        cliente: selectedCliente,
        item: carrito.map(item => ({
          Product_id: item.product_id,
          Producto: item.nombre,
          Cantidad: item.quantity,
          monto_unitario: item.precio_venta,
          monto: item.precio_venta * item.quantity,
        })),
      },
    };
  
    try {
      await ddbDocClient.send(new PutCommand(ventaData));
      console.log('Venta guardada exitosamente en DynamoDB');
      await actualizarInventario(carrito);
      setCarrito([]);
    } catch (err) {
      console.error('Error al guardar la venta en DynamoDB:', err);
    }
  };
  
  const verificarVenta = async (venta_id) => {
    const params = {
      TableName: 'Ventas',
      Key: { venta_id },
    };
  
    try {
      const data = await dynamoDb.get(params).promise();
      console.log('Verificación de venta en DynamoDB:', data);
    } catch (err) {
      console.error('Error al verificar venta:', err);
    }
  }


  const actualizarInventario = async (itemsVendidos) => {
    for (const item of itemsVendidos) {
      const params = {
        TableName: 'Inventario',
        Key: { product_id: item.product_id },  // Usar el ID único
        UpdateExpression: 'SET stock = stock - :cantidadVendida',
        ExpressionAttributeValues: { ':cantidadVendida': item.quantity },
        ConditionExpression: 'stock >= :cantidadVendida',  // Asegura que haya suficiente stock
      };
  
      try {
        await ddbDocClient.send(new UpdateCommand(params));
        console.log(`Stock actualizado para el producto ${item.nombre}`);
      } catch (err) {
        console.error(`Error al actualizar el stock del producto ${item.nombre}:`, err);
        alert(`Error al actualizar el stock del producto ${item.nombre}`);
      }
    }
  };
  
  
  return (
    <div className="container mx-auto py-8 flex flex-col md:flex-row">

      {/* Sección de Productos */}
      <div className="w-full md:w-3/5 mb-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Panel de Ventas</h1>

        <input
          type="text"
          placeholder="Buscar productos..."
          className="mb-4 p-2 border rounded w-10/12 ml-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Productos Disponibles</h2>
          {loading ? (
            <p className="text-center">Cargando productos...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProductos.map((producto) => (
                <div 
                  key={producto.product_id} 
                  className={`border p-4 rounded shadow ${producto.stock < 10 ? 'bg-red-100' : ''}`}
                >
                  <h3 className="font-bold">{producto.nombre}</h3>
                  <p>Precio: ${producto.precio_venta}</p>
                  <p>Stock: {producto.stock}</p>
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
      </div>

      {/* Sección de Carrito y Método de Pago */}
      <div className="w-full md:w-2/5 p-4">
        <div className="bg-gray-100 rounded-lg p-6 shadow-md mb-4">
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
                      <td className="py-4 px-4 font-semibold">${item.precio_venta * item.quantity}</td>
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
            </div>
          )}
        </div>

        {/* Método de Pago y Cliente */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">Método de Pago</h2>
          <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Cliente (ID)
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={clienteIdInput}
                onChange={(e) => setClienteIdInput(e.target.value)}
                onKeyPress={handleClienteIdKeyPress}
              />
                          <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Cliente Seleccionado
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={selectedCliente}
                readOnly
              />
            </div>
            </div>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="mb-4 p-2 border rounded w-full"
          >
            <option value="">Seleccionar Método de Pago</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Nequi</option>
            <option value="transferencia">Daviplata</option>
            <option value="transferencia">Addi</option>
            <option value="transferencia">Sistecredito</option>
          </select>
          <button
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition duration-200"
            onClick={finalizarVenta}
          >
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
}
