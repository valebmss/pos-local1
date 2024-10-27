'use client';

import ddbDocClient from "@/lib/aws";
import { ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { useEffect, useState, useMemo } from 'react';
import MainLayout from "../components/MainLayout";

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

const deleteProveedorFromDB = async (proveedor_id) => {
  const params = {
    TableName: 'Proveedor',
    Key: {
      proveedor_id: proveedor_id,
    },
  };

  try {
    await ddbDocClient.send(new DeleteCommand(params));
    return true;
  } catch (err) {
    console.error('Error deleting proveedor:', err);
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
  const [editingProveedor, setEditingProveedor] = useState(null); // Para editar
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Para mensajes de éxito
  const [searchQuery, setSearchQuery] = useState(''); // Estado para el buscador
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' }); // Estado para el ordenamiento

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchProveedorData();
      setProveedores(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProveedor((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddOrUpdateProveedor = async (e) => {
    e.preventDefault();

    // Validación: Verificar duplicados en proveedor_id y nombre
    const existingProveedor = proveedores.find(
      (prov) =>
        prov.proveedor_id === newProveedor.proveedor_id ||
        prov.nombre.toLowerCase() === newProveedor.nombre.toLowerCase()
    );

    if (
      existingProveedor &&
      (!editingProveedor ||
        existingProveedor.proveedor_id !== editingProveedor.proveedor_id)
    ) {
      setError('El proveedor con el mismo ID o nombre ya existe.');
      setSuccess(null); // Limpiar mensajes de éxito
      return;
    }

    const successOperation = await addOrUpdateProveedor(newProveedor);

    if (successOperation) {
      if (editingProveedor) {
        // Actualizar proveedor existente en la lista
        setProveedores((prev) =>
          prev.map((prov) =>
            prov.proveedor_id === editingProveedor.proveedor_id
              ? newProveedor
              : prov
          )
        );
        setSuccess('Proveedor actualizado correctamente.');
      } else {
        // Agregar nuevo proveedor a la lista
        setProveedores([...proveedores, newProveedor]);
        setSuccess('Proveedor agregado correctamente.');
      }

      setNewProveedor({
        proveedor_id: '',
        nombre: '',
        tienda: '',
      });
      setEditingProveedor(null);
      setError(null); // Limpiar mensajes de error
    } else {
      setError('Error al guardar el proveedor.');
      setSuccess(null); // Limpiar mensajes de éxito
    }
  };

  const handleEditProveedor = (proveedor) => {
    setNewProveedor(proveedor);
    setEditingProveedor(proveedor);
    setError(null); // Limpiar mensajes de error
    setSuccess(null); // Limpiar mensajes de éxito
  };

  const handleDeleteProveedor = async (proveedor_id) => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar este proveedor?'
    );
    if (!confirmDelete) return;

    const successDelete = await deleteProveedorFromDB(proveedor_id);
    if (successDelete) {
      setProveedores((prev) =>
        prev.filter((prov) => prov.proveedor_id !== proveedor_id)
      );
      setSuccess('Proveedor eliminado correctamente.');
      setError(null); // Limpiar mensajes de error
    } else {
      setError('Error al eliminar el proveedor.');
      setSuccess(null); // Limpiar mensajes de éxito
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProveedores = useMemo(() => {
    let sortableProveedores = [...proveedores];

    if (sortConfig.key !== null) {
      sortableProveedores.sort((a, b) => {
        const aKey = a[sortConfig.key].toLowerCase();
        const bKey = b[sortConfig.key].toLowerCase();

        if (aKey < bKey) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableProveedores;
  }, [proveedores, sortConfig]);

  const filteredProveedores = useMemo(() => {
    return sortedProveedores.filter(
      (prov) =>
        prov.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prov.tienda.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prov.proveedor_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedProveedores, searchQuery]);

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return '';
  };

  return (
    <MainLayout>

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
              disabled={editingProveedor !== null} // Evitar cambiar ID durante la edición
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

          {/* Mensajes de Éxito y Error */}
          {success && <p className="text-blue-500 mt-4">{success}</p>}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por ID, Nombre o Tienda..."
          className="p-2 w-full border border-gray-300 rounded"
        />
      </div>

      {/* Tabla de proveedores */}
      {!loading ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Lista de Proveedores</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('proveedor_id')}
                  >
                    Proveedor ID {getSortIndicator('proveedor_id')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre {getSortIndicator('nombre')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('tienda')}
                  >
                    Tienda {getSortIndicator('tienda')}
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProveedores.length > 0 ? (
                  filteredProveedores.map((proveedor) => (
                    <tr key={proveedor.proveedor_id} className="border-t">
                      <td className="px-4 py-2">{proveedor.proveedor_id}</td>
                      <td className="px-4 py-2">{proveedor.nombre}</td>
                      <td className="px-4 py-2">{proveedor.tienda}</td>
                      <td className="px-4 py-2 flex space-x-2">
                        <button
                          className="text-blue-500 hover:underline"
                          onClick={() => handleEditProveedor(proveedor)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => handleDeleteProveedor(proveedor.proveedor_id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No hay proveedores que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center">Cargando proveedores...</p>
      )}
    </div>
    </MainLayout>

  );
}
