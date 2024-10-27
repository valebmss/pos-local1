'use client';

import { ScanCommand, UpdateCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import ddbDocClient from "@/lib/aws";
import { useEffect, useState } from 'react';
import MainLayout from "../components/MainLayout";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [cliente, setCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [clienteIdInput, setClienteIdInput] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [isNewClienteFormVisible, setIsNewClienteFormVisible] = useState(false);
  const [montoPagado, setMontoPagado] = useState(0);
const [cambio, setCambio] = useState(0);
  const [newClienteData, setNewClienteData] = useState({ celular: '', correo: '', nombre: '' });
  const clienteDefault = "No definido";

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

  const handleProductIdKeyPress = async (e) => {
    if (e.key === 'Enter') {
      await buscarProductoPorId();
    }
  };

  const handleMontoPagadoChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setMontoPagado(isNaN(value) ? "" : value);
  };
  
  useEffect(() => {
    setCambio(montoPagado - total);
  }, [montoPagado, total]);
  

  const buscarProductoPorId = async () => {
    
    if (!searchTerm.trim()) return;

    const params = {
      TableName: 'Inventario',
      Key: {
        product_id: searchTerm.trim(),
      },
    };

    try {
      const data = await ddbDocClient.send(new GetCommand(params));
      if (data.Item) {
        handleAddToCart(data.Item);
        setSearchTerm('');
      } else {
        console.log("Producto no encontrado");
      }
    } catch (err) {
      console.error('Error al buscar producto por product_id:', err);
    }
  };

  const buscarClientePorId = async () => {
    const params = {
      TableName: 'Cliente',
      Key: {
        cliente_id: clienteIdInput.trim(),
      },
    };

    try {
      const data = await ddbDocClient.send(new GetCommand(params));
      if (data.Item) {
        setSelectedCliente(data.Item.nombre);
        setIsNewClienteFormVisible(false); // Cliente existente encontrado
      } else {
        setSelectedCliente(clienteDefault);
        setIsNewClienteFormVisible(true); // Mostrar formulario de nuevo cliente
      }
    } catch (err) {
      console.error('Error al buscar cliente por cliente_id:', err);
    }
  };

  const handleNewClienteDataChange = (e) => {
    const { name, value } = e.target;
    setNewClienteData((prev) => ({ ...prev, [name]: value }));
  };

  const agregarNuevoCliente = async () => {
    const nuevoCliente = {
      cliente_id: clienteIdInput.trim(),
      ...newClienteData,
    };

    const params = {
      TableName: 'Cliente',
      Item: nuevoCliente,
    };

    try {
      await ddbDocClient.send(new PutCommand(params));
      setSelectedCliente(newClienteData.nombre);
      setIsNewClienteFormVisible(false);
      setNewClienteData({ celular: '', correo: '', nombre: '' });
      setSuccess("Nuevo cliente agregado exitosamente.");
    } catch (err) {
      console.error('Error al agregar nuevo cliente:', err);
      setError("Error al agregar el nuevo cliente.");
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
    setError("");
    setSuccess("");

    if (!metodoPago) {
      setError("El medio de pago es obligatorio.");
      return;
    }

    if (!carrito || carrito.length === 0) {
      setError("Debe haber al menos un artículo en la venta.");
      return;
    }

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
      await actualizarInventario(carrito);
      setSuccess("Venta guardada exitosamente.");
      setCarrito([]);
    } catch (err) {
      setError("Error al guardar la venta en DynamoDB.");
      console.error('Error al guardar la venta en DynamoDB:', err);
    }
    if (success) {
      router.push(`/factura/${ventaId}`); // Redirige a la página de factura
    }
  };

  const actualizarInventario = async (itemsVendidos) => {
    for (const item of itemsVendidos) {
      const params = {
        TableName: 'Inventario',
        Key: { product_id: item.product_id },
        UpdateExpression: 'SET stock = stock - :cantidadVendida',
        ExpressionAttributeValues: { ':cantidadVendida': item.quantity },
        ConditionExpression: 'stock >= :cantidadVendida',
      };

      try {
        await ddbDocClient.send(new UpdateCommand(params));
      } catch (err) {
        console.error(`Error al actualizar el stock del producto ${item.nombre}:`, err);
      }
    }
  };

  return (
    <MainLayout>

    <div className="container mx-auto py-8 flex flex-col md:flex-row">
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
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
                    <tr key={item.product_id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{item.nombre}</td>
                      <td className="py-2 px-4 border-b">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.product_id, parseInt(e.target.value, 10))
                          }
                          className="w-16 border rounded p-1 text-center"
                        />
                      </td>
                      <td className="py-2 px-4 border-b">${item.precio_venta}</td>
                      <td className="py-2 px-4 border-b">${item.precio_venta * item.quantity}</td>
                      <td className="py-2 px-4 border-b">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveFromCart(item.product_id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Detalles de la Venta</h2>
          <div className="mb-4">
            <label className="block font-semibold">Método de Pago:</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="border rounded w-full p-2 mt-2"
            >
              <option value="">Seleccione un método</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div className="mb-4">
          <label className="block font-semibold">Cliente:</label>
          <input
            type="text"
            placeholder="Ingrese ID del cliente"
            value={clienteIdInput}
            onChange={(e) => setClienteIdInput(e.target.value)}
            onKeyPress={handleClienteIdKeyPress}
            className="border rounded w-full p-2 mt-2"
          />
          <p className="text-red-800 mt-2">Cliente seleccionado: {selectedCliente}</p>
        </div>
        {isNewClienteFormVisible && (
            <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
              <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Cliente</h2>
              <input
                type="text"
                placeholder="Nombre"
                name="nombre"
                value={newClienteData.nombre}
                onChange={handleNewClienteDataChange}
                className="border rounded w-full p-2 mb-2"
              />
              <input
                type="text"
                placeholder="Celular"
                name="celular"
                value={newClienteData.celular}
                onChange={handleNewClienteDataChange}
                className="border rounded w-full p-2 mb-2"
              />
              <input
                type="email"
                placeholder="Correo"
                name="correo"
                value={newClienteData.correo}
                onChange={handleNewClienteDataChange}
                className="border rounded w-full p-2 mb-2"
              />
              <button
                className="mt-2 bg-green-500 text-white py-1 px-3 rounded"
                onClick={agregarNuevoCliente}
              >
                Guardar Nuevo Cliente
              </button>
            </div>
          )}

          <div className="mb-4">
            <label className="block font-semibold">Total:</label>
            <p className="text-lg">
  ${new Intl.NumberFormat('es-CO').format(total)}
</p>
          </div>
          <div className="mb-4">
  <label className="block font-semibold">Monto Pagado:</label>
  <input
    type="number"
    value={montoPagado}
    onChange={handleMontoPagadoChange}
    className="border rounded w-full p-2 mt-2"
      min="1000"
  step="1000"
  />
</div>
<div className="mb-4">
  <label className="block font-semibold text-lg text-blue-700">Cambio:</label>
  <p className="text-lg">
    {cambio >= 0
      ? `$${new Intl.NumberFormat('es-CO').format(cambio)}`
      : `Falta $${new Intl.NumberFormat('es-CO').format(Math.abs(cambio))}`}
  </p>
</div>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {success && <p className="text-green-500 text-md mb-2">{success}</p>}
          <button
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 mt-4"
            onClick={finalizarVenta}
          >
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
        </MainLayout>

  );
}
