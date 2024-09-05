// app/inventario/page.js
'use client';

import ddbDocClient from "@/lib/aws";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
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

export default function Inventario() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchInventoryData();
      setInventoryItems(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Inventario</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Product ID</th>
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Categoría</th>
              <th className="py-3 px-6 text-left">Precio</th>
              <th className="py-3 px-6 text-left">Stock</th>
              <th className="py-3 px-6 text-left">Descripción</th>
              <th className="py-3 px-6 text-left">Proveedor</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {inventoryItems.map(item => (
              <tr key={item.product_id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{item.product_id}</td>
                <td className="py-3 px-6 text-left">{item.nombre}</td>
                <td className="py-3 px-6 text-left">{item.categoria}</td>
                <td className="py-3 px-6 text-left">{item.precio}</td>
                <td className="py-3 px-6 text-left">{item.stock}</td>
                <td className="py-3 px-6 text-left">{item.descripcion}</td>
                <td className="py-3 px-6 text-left">{item.proveedor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
