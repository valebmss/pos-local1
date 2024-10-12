import { useState } from 'react';
import React from 'react';

const InventorySearch = ({ inventoryItems }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar los productos según el término de búsqueda
  const filteredItems = inventoryItems.filter((product) =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
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
  );
};

export default InventorySearch;
