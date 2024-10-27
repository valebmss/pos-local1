'use client';

import ddbDocClient from "@/lib/aws";
import { ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { useEffect, useState, useMemo } from 'react';
import MainLayout from "../components/MainLayout";

const fetchClienteData = async () => {
  const params = {
    TableName: 'Cliente',
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    console.error('Error fetching data:', err);
    return [];
  }
};

const addOrUpdateCliente = async (newCliente) => {
  const params = {
    TableName: 'Cliente',
    Item: newCliente,
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return true;
  } catch (err) {
    console.error('Error saving Cliente:', err);
    return false;
  }
};

const deleteClienteFromDB = async (cliente_id) => {
  const params = {
    TableName: 'Cliente',
    Key: {
      cliente_id: cliente_id,
    },
  };

  try {
    await ddbDocClient.send(new DeleteCommand(params));
    return true;
  } catch (err) {
    console.error('Error deleting Cliente:', err);
    return false;
  }
};

export default function Cliente() {
  const [Clientees, setClientees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCliente, setNewCliente] = useState({
    cliente_id: '',
    nombre: '',
    correo: '',
    celular: '',
  });
  const [editingCliente, setEditingCliente] = useState(null); // Para editar
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Para mensajes de éxito
  const [searchQuery, setSearchQuery] = useState(''); // Estado para el buscador
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' }); // Estado para el ordenamiento

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchClienteData();
      setClientees(data);
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
    setNewCliente((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddOrUpdateCliente = async (e) => {
    e.preventDefault();

    // Validación: Verificar duplicados en Cliente_id y nombre
    const existingCliente = Clientees.find(
      (prov) =>
        prov.cliente_id === newCliente.cliente_id ||
        prov.nombre.toLowerCase() === newCliente.nombre.toLowerCase()
    );

    if (
      existingCliente &&
      (!editingCliente ||
        existingCliente.cliente_id !== editingCliente.cliente_id)
    ) {
      setError('El Cliente con el mismo ID o nombre ya existe.');
      setSuccess(null); // Limpiar mensajes de éxito
      return;
    }

    const successOperation = await addOrUpdateCliente(newCliente);

    if (successOperation) {
      if (editingCliente) {
        // Actualizar Cliente existente en la lista
        setClientees((prev) =>
          prev.map((prov) =>
            prov.cliente_id === editingCliente.cliente_id
              ? newCliente
              : prov
          )
        );
        setSuccess('Cliente actualizado correctamente.');
      } else {
        // Agregar nuevo Cliente a la lista
        setClientees([...Clientees, newCliente]);
        setSuccess('Cliente agregado correctamente.');
      }

      setNewCliente({
        cliente_id: '',
        nombre: '',
        correo: '',
        celular: '',

      });
      setEditingCliente(null);
      setError(null); // Limpiar mensajes de error
    } else {
      setError('Error al guardar el Cliente.');
      setSuccess(null); // Limpiar mensajes de éxito
    }
  };

  const handleEditCliente = (Cliente) => {
    setNewCliente(Cliente);
    setEditingCliente(Cliente);
    setError(null); // Limpiar mensajes de error
    setSuccess(null); // Limpiar mensajes de éxito
  };

  const handleDeleteCliente = async (cliente_id) => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar este Cliente?'
    );
    if (!confirmDelete) return;

    const successDelete = await deleteClienteFromDB(cliente_id);
    if (successDelete) {
      setClientees((prev) =>
        prev.filter((prov) => prov.cliente_id !== cliente_id)
      );
      setSuccess('Cliente eliminado correctamente.');
      setError(null); // Limpiar mensajes de error
    } else {
      setError('Error al eliminar el Cliente.');
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

  const sortedClientees = useMemo(() => {
    let sortableClientees = [...Clientees];

    if (sortConfig.key !== null) {
      sortableClientees.sort((a, b) => {
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

    return sortableClientees;
  }, [Clientees, sortConfig]);

  const filteredClientees = useMemo(() => {
    return sortedClientees.filter(
      (prov) =>
        prov.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prov.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prov.celular.toLowerCase().includes(searchQuery.toLowerCase()) ||

        prov.cliente_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedClientees, searchQuery]);

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return '';
  };

  return (
    <MainLayout>

    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Clientes</h1>

      {/* Formulario para agregar o editar un Cliente */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {editingCliente ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
        </h2>
        <form onSubmit={handleAddOrUpdateCliente}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Cliente ID
            </label>
            <input
              type="text"
              name="cliente_id"
              value={newCliente.cliente_id}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              placeholder="Ingrese ID del Cliente"
              required
              disabled={editingCliente !== null} // Evitar cambiar ID durante la edición
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={newCliente.nombre}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              placeholder="Ingrese nombre del Cliente"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              correo
            </label>
            <input
              type="text"
              name="correo"
              value={newCliente.correo}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              placeholder="Ingrese correo del Cliente"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            {editingCliente ? 'Guardar Cambios' : 'Agregar Cliente'}
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
          placeholder="Buscar por ID, Nombre o correo..."
          className="p-2 w-full border border-gray-300 rounded"
        />
      </div>

      {/* Tabla de Clientees */}
      {!loading ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Lista de Clientes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('Cliente_id')}
                  >
                    Cliente ID {getSortIndicator('Cliente_id')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre {getSortIndicator('nombre')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('nombre')}
                  >
                    Celular {getSortIndicator('celular')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                    onClick={() => handleSort('correo')}
                  >
                    correo {getSortIndicator('correo')}
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientees.length > 0 ? (
                  filteredClientees.map((Cliente) => (
                    <tr key={Cliente.cliente_id} className="border-t">
                      <td className="px-4 py-2">{Cliente.cliente_id}</td>
                      <td className="px-4 py-2">{Cliente.nombre}</td>
                      <td className="px-4 py-2">{Cliente.celular}</td>

                      <td className="px-4 py-2">{Cliente.correo}</td>
                      <td className="px-4 py-2 flex space-x-2">
                        <button
                          className="text-blue-500 hover:underline"
                          onClick={() => handleEditCliente(Cliente)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => handleDeleteCliente(Cliente.cliente_id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No hay clientes que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center">Cargando cientes...</p>
      )}
    </div>
    </MainLayout>

  );
}
