'use client';

import ddbDocClient from "@/lib/aws";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
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
const fetchProveedorData = async () => {
  const params = {
    TableName: 'Proveedor',
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    console.error('Error fetching data:', err);
    return [];
  }
};
const formatPrice = (price) => {
  if (price === '') return ''; // Para manejar el caso en que no hay precio
  return `$${parseFloat(price).toLocaleString('es-CO')}`;
};

const parsePrice = (formattedPrice) => {
  // Elimina el símbolo '$' y convierte a número
  return parseFloat(formattedPrice.replace(/\./g, '').replace('$', '').trim());
};
const addNewProduct = async (newProduct) => {
  const params = {
    TableName: 'Inventario',
    Item: newProduct,
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return true;
  } catch (err) {
    console.error('Error adding product:', err);
    return false;
  }
};

const deleteProduct = async (productId) => {
  const params = {
    TableName: 'Inventario',
    Key: {
      product_id: productId,
    },
  };

  try {
    await ddbDocClient.send(new DeleteCommand(params));
    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    return false;
  }
};

const updateProduct = async (product) => {
  const params = {
    TableName: 'Inventario',
    Item: product,
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return true;
  } catch (err) {
    console.error('Error updating product:', err);
    return false;
  }
};
export default function Inventario() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    product_id: '',
    nombre: '',
    categoria: '',
    precio_venta: '',
    precio_costo: '',
    stock: '',
    descripcion: '',
    proveedor: ''
  });

  const [searchTerm, setSearchTerm] = useState(''); // Para el buscador
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  const [sortColumn, setSortColumn] = useState(null); // Columna para ordenar
  const [sortOrder, setSortOrder] = useState('asc'); // Orden ascendente o descendente

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchInventoryData();
      setInventoryItems(data);
      const data_proveedor = await fetchProveedorData();
      setProveedores(data_proveedor);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();

    const productData = {
      ...newProduct,
      product_id: parseInt(newProduct.product_id, 10),
    };

    const success = isEditing
      ? await updateProduct(productData) // Update if editing
      : await addNewProduct(productData); // Add if not editing

    if (success) {
      setInventoryItems((prev) => {
        if (isEditing) {
          return prev.map(item =>
            item.product_id === currentProductId ? productData : item
          );
        } else {
          return [...prev, productData];
        }
      });

      setNewProduct({
        product_id: '',
        nombre: '',
        categoria: '',
        precio_venta: '',
        precio_costo: '',
        stock: '',
        descripcion: '',
        proveedor: ''
      });
      setIsEditing(false);
      setCurrentProductId(null);
    }
  };

  const handleEditProduct = (item) => {
    setNewProduct(item);
    setIsEditing(true);
    setCurrentProductId(item.product_id);
  };

  const handleDeleteProduct = async (productId) => {
    const success = await deleteProduct(productId);
    if (success) {
      setInventoryItems((prev) => prev.filter(item => item.product_id !== productId));
    }
  };


  // Función para ordenar
  const handleSort = (column) => {
    const order = (sortColumn === column && sortOrder === 'asc') ? 'desc' : 'asc';
    setSortColumn(column);
    setSortOrder(order);
  };

  // Función para filtrar los productos según el término de búsqueda
  const filteredItems = inventoryItems.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Función para ordenar los elementos
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = a[sortColumn] || '';
    const bValue = b[sortColumn] || '';
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Inventario</h1>

      {/* Buscador */}

      {/* Formulario para añadir un nuevo producto */}
      <form onSubmit={handleAddOrUpdateProduct} className="mb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="number"
            name="product_id"
            value={newProduct.product_id}
            onChange={handleInputChange}
            placeholder="Product ID"
            className="p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="text"
            name="nombre"
            value={newProduct.nombre}
            onChange={handleInputChange}
            placeholder="Nombre"
            className="p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="text"
            name="categoria"
            value={newProduct.categoria}
            onChange={handleInputChange}
            placeholder="Categoría"
            className="p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="number"
            name="precio_venta"
            value={(newProduct.precio_venta)}
            onChange={handleInputChange}
            placeholder="Precio Venta"
            className="p-2 border border-gray-300 rounded"
            required
          />
                    <input
            type="number"
            name="precio_costo"
            value={(newProduct.precio_costo)}
            onChange={handleInputChange}
            placeholder="Precio Costo"
            className="p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="number"
            name="stock"
            value={newProduct.stock}
            onChange={handleInputChange}
            placeholder="Stock"
            className="p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="text"
            name="descripcion"
            value={newProduct.descripcion}
            onChange={handleInputChange}
            placeholder="Descripción"
            className="p-2 border border-gray-300 rounded"
          />
 <select
          name="proveedor"
          value={newProduct.proveedor}
          onChange={handleInputChange}
          className="p-2 border border-gray-300 rounded"
          required
        >
          <option value="">Seleccione un proveedor</option>
          {proveedores.map((proveedor, index) => (
            <option key={index} value={proveedor.tienda}>
              {proveedor.tienda}
            </option>
          ))}
        </select>
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded">
          {isEditing ? 'Actualizar Producto' : 'Añadir Producto'}
        </button>
      </form>
      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="p-2 border border-gray-300 rounded mb-4"
      />


      {/* Tabla del inventario */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th onClick={() => handleSort('product_id')} className="py-3 px-6 text-left cursor-pointer">Product ID</th>
              <th onClick={() => handleSort('nombre')} className="py-3 px-6 text-left cursor-pointer">Nombre</th>
              <th onClick={() => handleSort('categoria')} className="py-3 px-6 text-left cursor-pointer">Categoría</th>
              <th onClick={() => handleSort('precio_venta')} className="py-3 px-6 text-left cursor-pointer">Precio Venta</th>
              <th onClick={() => handleSort('precio_costo')} className="py-3 px-6 text-left cursor-pointer">Precio Costo</th>

              <th onClick={() => handleSort('stock')} className="py-3 px-6 text-left cursor-pointer">Stock</th>
              <th onClick={() => handleSort('descripcion')} className="py-3 px-6 text-left cursor-pointer">Descripción</th>
              <th onClick={() => handleSort('proveedor')} className="py-3 px-6 text-left cursor-pointer">Proveedor</th>
              <th  className="py-3 px-6 text-left cursor-pointer">Acciones</th>

            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {sortedItems.map(item => (
              <tr key={item.product_id} className={`border-b border-gray-200 hover:bg-gray-100 ${item.stock <= 0 ? 'bg-red-200 font-bold' : item.stock < 10 ? 'text-red-600' : ''}`}>
                <td className="py-3 px-6 text-left">{item.product_id}</td>
                <td className="py-3 px-6 text-left">{item.nombre}</td>
                <td className="py-3 px-6 text-left">{item.categoria}</td>
                <td className="py-3 px-6 text-left">{formatPrice(item.precio_venta)}</td>
                <td className="py-3 px-6 text-left">{formatPrice(item.precio_costo)}</td>

                <td className="py-3 px-6 text-left">{item.stock}</td>
                <td className="py-3 px-6 text-left">{item.descripcion}</td>
                <td className="py-3 px-6 text-left">{item.proveedor}</td>
                <td className="py-3 px-6 text-left">
                  <button onClick={() => handleEditProduct(item)} className="text-blue-500">Editar</button>
                  <button onClick={() => handleDeleteProduct(item.product_id)} className="text-red-500 ml-2">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
