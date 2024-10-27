// pages/dashboard.js
'use client';

import { useUser } from '@/context/UserContext';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from 'react';
import { decode } from "base-64";
import Link from 'next/link';

export default function Dashboard() {
  global.atob = decode;

  const { user, setUser } = useUser();

  useEffect(() => {
    const token = document.cookie
      .split('.')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[2];

    if (token) {
      const decodedUser = decode(token);
      setUser(decodedUser);
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-8">Dashboard</h2>
        <nav className="flex flex-col space-y-4">
          <Link href="/ventas" className="hover:bg-gray-700 p-3 rounded transition">Ventas</Link>
          <Link href="/inventario" className="hover:bg-gray-700 p-3 rounded transition">Inventario</Link>
          <Link href="/provedores" className="hover:bg-gray-700 p-3 rounded transition">Proveedores</Link>
          <Link href="/reports" className="hover:bg-gray-700 p-3 rounded transition">Reportes</Link>
          <Link href="/logout" className="hover:bg-red-700 p-3 rounded transition">Cerrar sesión</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido, {user?.nombre || "Usuario"}
          </h1>
          <span className="text-gray-600">ID de usuario: {user?.usuario_id || "N/A"}</span>
        </header>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/ventas">
            <div className="bg-blue-500 p-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-bold text-white">Ventas</h3>
              <p className="mt-2 text-sm text-blue-200">Gestión de ventas</p>
            </div>
          </Link>

          <Link href="/inventario">
            <div className="bg-green-500 p-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-bold text-white">Inventario</h3>
              <p className="mt-2 text-sm text-green-200">Control de inventario</p>
            </div>
          </Link>

          <Link href="/provedores">
            <div className="bg-yellow-500 p-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-bold text-white">Proveedores</h3>
              <p className="mt-2 text-sm text-yellow-200">Administración de proveedores</p>
            </div>
          </Link>

          <Link href="/reports">
            <div className="bg-red-500 p-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 hover:shadow-2xl">
              <h3 className="text-xl font-bold text-white">Reportes</h3>
              <p className="mt-2 text-sm text-red-200">Generación de reportes</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
