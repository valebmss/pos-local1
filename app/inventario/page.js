'use client';

import React from 'react';

import ddbDocClient from "@/lib/aws";
import { ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { useEffect, useState, useRef } from 'react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";
import MainLayout from '../components/MainLayout';

const fetchInventoryData = async () => {
  const params = { TableName: 'Inventario' };
  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    console.error('Error fetching data:', err);
    return [];
  }
};

const fetchProveedorData = async () => {
  const params = { TableName: 'Proveedor' };
  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    console.error('Error fetching data:', err);
    return [];
  }
};

const formatPrice = (price) => {
  if (price === '') return '';
  return `$${parseFloat(price).toLocaleString('es-CO')}`;
};

const addNewProduct = async (newProduct) => {
  const params = { TableName: 'Inventario', Item: newProduct };
  try {
    await ddbDocClient.send(new PutCommand(params));
    return true;
  } catch (err) {
    console.error('Error adding product:', err);
    return false;
  }
};

const deleteProduct = async (productId) => {
  const params = { TableName: 'Inventario', Key: { product_id: productId } };
  try {
    await ddbDocClient.send(new DeleteCommand(params));
    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    return false;
  }
};

const updateProduct = async (product) => {
  const params = { TableName: 'Inventario', Item: product };
  try {
    await ddbDocClient.send(new PutCommand(params));
    return true;
  } catch (err) {
    console.error('Error updating product:', err);
    return false;
  }
};

const downloadPDF = (inventoryItems, propiedadesVariacion) => {
  const doc = new jsPDF();

  // Encabezado del PDF
  doc.setFontSize(16);
  doc.text("Inventario de Productos", 14, 16);
  
  // Definición de la tabla
  const headers = ['Producto ID', 'Nombre', 'Categoría', 'Precio Venta', 'Precio Costo', 'Descripción', 'Proveedor', ...propiedadesVariacion, 'Stock'];

  const data = inventoryItems.map(product => {
    // Asegúrate de que las propiedades existan
    return [
      product.product_id,
      product.nombre,
      product.categoria,
      formatPrice(product.precio_venta),
      formatPrice(product.precio_costo),
      product.descripcion,
      product.proveedor,
      ...(product.variaciones ? product.variaciones.map(v => v[propiedadesVariacion[0]] || '') : ['']),
      ...(product.variaciones ? product.variaciones.map(v => v.stock || 0) : [0]) // Stock
    ];
  });

  // Agregar tabla
  autoTable(doc, {
    head: [headers],
    body: data,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    startY: 20 // Posición inicial para la tabla
  });

  // Guardar el PDF
  doc.save("inventario.pdf");
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
    proveedor: '',
    variaciones: []
  });
  const [variaciones, setVariaciones] = useState([]);
  const [newVariation, setNewVariation] = useState({});
  const [propiedadesVariacion, setPropiedadesVariacion] = useState(['color', 'talla']);
  const [nuevaPropiedad, setNuevaPropiedad] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRows, setExpandedRows] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [categoryFilter, setCategoryFilter] = useState('');
const [sizeFilter, setSizeFilter] = useState('');
const [stockFilter, setStockFilter] = useState('');
const [colorFilter, setColorFilter] = useState('');




  const csvLinkRef = useRef();

  const csvData = [
    [
      "Product ID",
      "Nombre",
      "Categoría",
      "Precio Venta",
      "Precio Costo",
      "Descripción",
      "Proveedor",
      ...propiedadesVariacion,
      "Stock"
    ],
    ...inventoryItems.flatMap(product =>
      (product.variaciones || []).map(variation => [
        product.product_id,
        product.nombre,
        product.categoria,
        formatPrice(product.precio_venta),
        formatPrice(product.precio_costo),
        product.descripcion,
        product.proveedor,
        ...propiedadesVariacion.map(prop => variation[prop]),
        variation.stock
      ])
    )
  ];

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
      variaciones: variaciones
    };

    const success = isEditing
      ? await updateProduct(productData)
      : await addNewProduct(productData);

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
        proveedor: '',
        variaciones: []
      });
      setVariaciones([]);
      setIsEditing(false);
      setCurrentProductId(null);
    }
  };

  const handleEditProduct = (item) => {
    setNewProduct(item);
    setVariaciones(item.variaciones || []);
    setIsEditing(true);
    setCurrentProductId(item.product_id);
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este producto?");
    
    if (confirmDelete) {
      const success = await deleteProduct(productId);
      if (success) {
        setInventoryItems((prev) => prev.filter(item => item.product_id !== productId));
      }
    }
  };
  
  const handleSort = (column) => {
    const order = (sortColumn === column && sortOrder === 'asc') ? 'desc' : 'asc';
    setSortColumn(column);
    setSortOrder(order);
  };

  const filteredItems = inventoryItems.filter(product => {
    const matchesCategory = !categoryFilter || product.categoria === categoryFilter;
    const matchesSize = !sizeFilter || (product.variaciones && product.variaciones.some(v => v.talla === sizeFilter));
    const matchesColor = !colorFilter || (product.variaciones && product.variaciones.some(v => v.color === colorFilter));
    const matchesStock = !stockFilter || product.stock >= parseInt(stockFilter, 10);
  
    return matchesCategory && matchesSize && matchesColor && matchesStock && (
      Object.values(product).some(value =>
        typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (product.variaciones && product.variaciones.length > 0 && product.variaciones.some(variation =>
        Object.values(variation).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      ))
    );
  });
  
  

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn] || '';
    const bValue = b[sortColumn] || '';
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Funciones de Variaciones
  const handleAddVariation = () => {
    const isValid = propiedadesVariacion.every(prop => newVariation[prop]);
    if (isValid && newVariation.stock !== '') {
      setVariaciones([...variaciones, { ...newVariation, variation_id: Date.now() }]);
      setNewVariation(propiedadesVariacion.reduce((acc, prop) => ({ ...acc, [prop]: '' }), { stock: '' })); // Reiniciar a valores vacíos
    } else {
      alert("Por favor, completa todas las propiedades de la variación.");
    }
  };

  const handleDeleteVariation = (variation_id) => {
    setVariaciones(variaciones.filter(v => v.variation_id !== variation_id));
  };

  // Funciones de Propiedades de Variación
  const handleAddPropiedad = () => {
    if (nuevaPropiedad.trim() !== '' && !propiedadesVariacion.includes(nuevaPropiedad.trim())) {
      setPropiedadesVariacion([...propiedadesVariacion, nuevaPropiedad.trim()]);
      setNuevaPropiedad('');
    } else {
      alert("La propiedad ya existe o está vacía.");
    }
  };

  const handleDeletePropiedad = (propiedad) => {
    setPropiedadesVariacion(propiedadesVariacion.filter(p => p !== propiedad));
    // También elimina la propiedad de las variaciones existentes
    setVariaciones(variaciones.map(v => {
      const { [propiedad]: _, ...rest } = v;
      return rest;
    }));
  };

  const toggleRow = (product_id) => {
    if (expandedRows.includes(product_id)) {
      setExpandedRows(expandedRows.filter(id => id !== product_id));
    } else {
      setExpandedRows([...expandedRows, product_id]);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  const categories = new Set();
const sizes = new Set();
const colors = new Set(); // Si también quieres incluir colores

inventoryItems.forEach(product => {
  // Añadir categoría
  if (product.categoria) {
    categories.add(product.categoria);
  }

  // Añadir tallas de las variaciones
  if (product.variaciones) {
    product.variaciones.forEach(variation => {
      if (variation.talla) {
        sizes.add(variation.talla);
      }
      if (variation.color) {
        colors.add(variation.color); // Si quieres incluir colores también
      }
    });
  }
});

// Convertir los Sets a Arrays
const uniqueCategories = Array.from(categories);
const uniqueSizes = Array.from(sizes);
const uniqueColors = Array.from(colors); // Si también quieres incluir colores


  return (
    <MainLayout>

    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>


       {/* Contenedor Flex para Configurar Propiedades y Formulario */}
       <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
              {/* Formulario para Configurar Propiedades de Variaciones */}
      <div className="mb-4 p-2 bg-white shadow-sm rounded w-1/2">
  <h2 className="text-md font-semibold mb-2">Configurar Propiedades de Variaciones</h2>
  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
    <input
      type="text"
      value={nuevaPropiedad}
      onChange={(e) => setNuevaPropiedad(e.target.value)}
      placeholder="Nueva Propiedad"
      className="flex-1 p-1.5 border border-gray-300 rounded "
    />
    <button type="button" onClick={handleAddPropiedad} className="bg-green-500 text-white px-3 py-1.5 rounded  hover:bg-green-600 transition">
      Añadir Propiedad
    </button>
  </div>

  {/* Lista de Propiedades Actuales */}
  <div className="flex flex-wrap gap-1 mt-2">
    {propiedadesVariacion.map(propiedad => (
      <span key={propiedad} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full flex items-center ">
        {propiedad}
        <button onClick={() => handleDeletePropiedad(propiedad)} className="ml-1 text-red-500 hover:text-red-700 ">
          &times;
        </button>
      </span>
    ))}
  </div>
</div>


      {/* Formulario para Añadir/Actualizar Producto */}
      <form onSubmit={handleAddOrUpdateProduct} className="mb-4 p-3 bg-white shadow-sm rounded w-1/2">
  <h2 className="text-md font-semibold mb-2">{isEditing ? 'Actualizar' : 'Añadir'} Producto</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    <input
      type="number"
      name="product_id"
      value={newProduct.product_id}
      onChange={handleInputChange}
      placeholder="ID"
      className="p-1 border border-gray-300 rounded"
      required
      disabled={isEditing}
    />
    <input
      type="text"
      name="nombre"
      value={newProduct.nombre}
      onChange={handleInputChange}
      placeholder="Nombre"
      className="p-1 border border-gray-300 rounded"
      required
    />
    <input
      type="text"
      name="categoria"
      value={newProduct.categoria}
      onChange={handleInputChange}
      placeholder="Categoría"
      className="p-1 border border-gray-300 rounded "
      required
    />
    <input
      type="number"
      name="precio_venta"
      value={newProduct.precio_venta}
      onChange={handleInputChange}
      placeholder="Precio Venta"
      className="p-1 border border-gray-300 rounded"
      required
    />
    <input
      type="number"
      name="precio_costo"
      value={newProduct.precio_costo}
      onChange={handleInputChange}
      placeholder="Precio Costo"
      className="p-1 border border-gray-300 rounded "
      required
    />
    <input
      type="number"
      name="stock"
      value={newProduct.stock}
      onChange={handleInputChange}
      placeholder="Stock"
      className="p-1 border border-gray-300 rounded "
      required
    />
    <input
      type="text"
      name="descripcion"
      value={newProduct.descripcion}
      onChange={handleInputChange}
      placeholder="Descripción"
      className="p-1 border border-gray-300 rounded "
    />
    <select
      name="proveedor"
      value={newProduct.proveedor}
      onChange={handleInputChange}
      className="p-1 border border-gray-300 rounded "
    >
      <option value="">Seleccione</option>
      {proveedores.map((proveedor, index) => (
        <option key={index} value={proveedor.tienda}>
          {proveedor.tienda}
        </option>
      ))}
    </select>
  </div>

  {/* Sección para Variaciones */}
  <div className="mt-4">
    <h3 className=" font-semibold mb-1">Variaciones</h3>
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
      {propiedadesVariacion.map(propiedad => (
        <input
          key={propiedad}
          type={propiedad === 'talla' || propiedad.includes('number') ? 'number' : 'text'}
          name={propiedad}
          value={newVariation[propiedad] || ''}
          onChange={(e) => setNewVariation({ ...newVariation, [propiedad]: e.target.value })}
          placeholder={propiedad.charAt(0).toUpperCase() + propiedad.slice(1)}
          className="p-1 border border-gray-300 rounded"
        />
      ))}
      <input
        type="number"
        name="stock"
        value={newVariation.stock || ''}
        onChange={(e) => setNewVariation({ ...newVariation, stock: e.target.value })}
        placeholder="Stock"
        className="p-1 border border-gray-300 rounded "
      />
        <button type="button" onClick={handleAddVariation} className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition">
          Añadir Variación
        </button>
    </div>

    {/* Lista de Variaciones Añadidas */}
    {variaciones.length > 0 && (
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-200 text-gray-700 ">
              {propiedadesVariacion.map(prop => (
                <th key={prop} className="py-1 px-2 border-b">{prop.charAt(0).toUpperCase() + prop.slice(1)}</th>
              ))}
              <th className="py-1 px-2 border-b">Stock</th>
              <th className="py-1 px-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {variaciones.map(variation => (
              <tr key={variation.variation_id} className="hover:bg-gray-100 ">
                {propiedadesVariacion.map(prop => (
                  <td key={prop} className="py-1 px-2 border-b">{variation[prop]}</td>
                ))}
                <td className="py-1 px-2 border-b">{variation.stock}</td>
                <td className="py-1 px-2 border-b">
                  <button onClick={() => handleDeleteVariation(variation.variation_id)} className="text-red-500 hover:text-red-700 ">
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

  <button type="submit" className="mt-3 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition w-full sm:w-auto">
    {isEditing ? 'Actualizar' : 'Añadir Producto'}
  </button>
</form>

      </div>



{/* Contenedor principal */}
<div className="flex mb-6">

  {/* Buscador */}
  <div className="p-4 bg-white shadow rounded-lg relative w-2/3 mb-4">
    <input
      type="text"
      placeholder="Buscar..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300 pr-40"
    />

    <div className="absolute right-2 top-2 flex space-x-2">
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Cat.</option>
        {uniqueCategories.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      <select
        value={sizeFilter}
        onChange={(e) => setSizeFilter(e.target.value)}
        className="p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Talla</option>
        {uniqueSizes.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      <select
        value={colorFilter}
        onChange={(e) => setColorFilter(e.target.value)}
        className="p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Color</option>
        {uniqueColors.map(color => (
          <option key={color} value={color}>{color}</option>
        ))}
      </select>
    </div>
  </div>

  {/* Botones de Exportación */}
  <div className="flex flex-col justify-center w-1/3 ml-4">
  <button
      onClick={() => downloadPDF(inventoryItems, propiedadesVariacion)}
      className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition mb-2"
    >
      Descargar PDF
    </button>

    <button
      onClick={() => downloadCSV(csvLinkRef)}
      className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 transition"
    >
      Descargar CSV
    </button>

    <CSVLink
      data={csvData}
      filename="inventario.csv"
      ref={csvLinkRef}
      className="hidden"
    />
  </div>
</div>






      {/* Tabla del Inventario con Variaciones Expandibles */}
      <div className="overflow-x-auto">
        <table id="inventory-table" className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm">
              <th onClick={() => handleSort('product_id')} className="py-2 px-4 border-b cursor-pointer">Product ID</th>
              <th onClick={() => handleSort('nombre')} className="py-2 px-4 border-b cursor-pointer">Nombre</th>
              <th onClick={() => handleSort('categoria')} className="py-2 px-4 border-b cursor-pointer">Categoría</th>
              <th onClick={() => handleSort('precio_venta')} className="py-2 px-4 border-b cursor-pointer">Precio Venta</th>
              <th onClick={() => handleSort('precio_costo')} className="py-2 px-4 border-b cursor-pointer">Precio Costo</th>
              <th onClick={() => handleSort('stock')} className="py-2 px-4 border-b cursor-pointer">Stock Total</th>
              <th onClick={() => handleSort('descripcion')} className="py-2 px-4 border-b cursor-pointer">Descripción</th>
              <th onClick={() => handleSort('proveedor')} className="py-2 px-4 border-b cursor-pointer">Proveedor</th>
              <th className="py-2 px-4 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <React.Fragment key={item.product_id}>
                <tr
                  className={`hover:bg-gray-100 ${
                    item.stock <= 0
                      ? 'bg-red-100 text-red-700'
                      : item.stock < 10
                      ? 'bg-yellow-100 text-yellow-700'
                      : ''
                  } text-sm`}
                >
                  <td className="py-2 px-4 border-b">{item.product_id}</td>
                  <td className="py-2 px-4 border-b">{item.nombre}</td>
                  <td className="py-2 px-4 border-b">{item.categoria}</td>
                  <td className="py-2 px-4 border-b">{formatPrice(item.precio_venta)}</td>
                  <td className="py-2 px-4 border-b">{formatPrice(item.precio_costo)}</td>
                  <td className="py-2 px-4 border-b">{item.stock}</td>
                  <td className="py-2 px-4 border-b">{item.descripcion}</td>
                  <td className="py-2 px-4 border-b">{item.proveedor}</td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <button onClick={() => toggleRow(item.product_id)} className="text-blue-500 hover:text-blue-700 text-sm">
                      {expandedRows.includes(item.product_id) ? 'Cerrar' : 'Ver Variaciones'}
                    </button>
                    <button onClick={() => handleEditProduct(item)} className="text-green-500 hover:text-green-700 text-sm">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteProduct(item.product_id)} className="text-red-500 hover:text-red-700 text-sm">
                      Eliminar
                    </button>
                  </td>
                </tr>
                {expandedRows.includes(item.product_id) && (
                  <tr>
                    <td colSpan="9" className="p-4 bg-gray-50">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 text-sm">
                            {propiedadesVariacion.map(prop => (
                              <th key={prop} className="py-2 px-4 border-b">{prop.charAt(0).toUpperCase() + prop.slice(1)}</th>
                            ))}
                            <th className="py-2 px-4 border-b">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                        {(item.variaciones || []).map(variation => (
  <tr key={variation.variation_id} className="hover:bg-gray-100 text-sm">
    {propiedadesVariacion.map(prop => (
      <td key={prop} className="py-2 px-4 border-b">{variation[prop] || ''}</td> // Manejar undefined
    ))}
    <td className="py-2 px-4 border-b">{variation.stock || 0}</td> 
  </tr>
))}

                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </MainLayout>

  );
}
