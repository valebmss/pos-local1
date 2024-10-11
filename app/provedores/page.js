'use client';

import ddbDocClient from "@/lib/aws";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { useEffect, useState } from 'react';

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

const addOrUpdateProveedor = async (newProveedor) => {
  const params = {
    TableName: 'Proveedor',
    Item: newProveedor,
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return true;
  } catch (err) {
    console.error('Error saving proveedor:', err);
    return false;
  }
};

export default function Proveedor() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProveedor, setNewProveedor] = useState({
    proveedor_id: '',
    nombre: '',
    tienda: '',
  });
  const [editingProveedor, setEditingProveedor] = useState(null); // For editing
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchProveedorData();
      setProveedores(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProveedor((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddOrUpdateProveedor = async (e) => {
    e.preventDefault();

    // Validation: Check for duplicate proveedor_id or nombre
    const existingProveedor = proveedores.find(
      (prov) =>
        prov.proveedor_id === newProveedor.proveedor_id ||
        prov.tienda === newProveedor.tienda
    );

    if (existingProveedor && (!editingProveedor || existingProveedor.proveedor_id !== editingProveedor.proveedor_id) && (!editingProveedor || existingProveedor.tienda !== editingProveedor.tienda)) {
      setError('El proveedor con el mismo ID o tienda ya existe.');
      return;
    }

    const success = await addOrUpdateProveedor(newProveedor);

    if (success) {
      if (editingProveedor) {
        // Update existing provider in the list
        setProveedores((prev) =>
          prev.map((prov) =>
            prov.proveedor_id === editingProveedor.proveedor_id
              ? newProveedor
              : prov
          )
        );
        setEditingProveedor(null);
      } else {
        // Add new provider to the list
        setProveedores([...proveedores, newProveedor]);
      }

      setNewProveedor({
        proveedor_id: '',
        nombre: '',
        tienda: '',
      });
    } else {
      setError('Error al guardar el proveedor.');
    }
  };

  const handleEditProveedor = (proveedor) => {
    setNewProveedor(proveedor);
    setEditingProveedor(proveedor);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Proveedores</h1>

      {/* Formulario para agregar o editar un proveedor */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {editingProveedor ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
        </h2>
        <form onSubmit={handleAddOrUpdateProveedor}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Proveedor ID
            </label>
            <input
              type="text"
              name="proveedor_id"
              value={newProveedor.proveedor_id}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              placeholder="Ingrese ID del proveedor"
              required
              disabled={editingProveedor !== null} // Prevent changing ID during edit
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={newProveedor.nombre}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              placeholder="Ingrese nombre del proveedor"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Tienda
            </label>
            <input
              type="text"
              name="tienda"
              value={newProveedor.tienda}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              placeholder="Ingrese tienda del proveedor"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            {editingProveedor ? 'Guardar Cambios' : 'Agregar Proveedor'}
          </button>

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
      </div>

      {/* Tabla de proveedores */}
      {!loading ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Lista de Proveedores</h2>
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Proveedor ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Tienda</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.proveedor_id} className="border-t">
                  <td className="px-4 py-2">{proveedor.proveedor_id}</td>
                  <td className="px-4 py-2">{proveedor.nombre}</td>
                  <td className="px-4 py-2">{proveedor.tienda}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => handleEditProveedor(proveedor)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center">Cargando proveedores...</p>
      )}
    </div>
  );
}
