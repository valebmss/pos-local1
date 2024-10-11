// pages/dashboard.js
'use client';

import { useUser } from '@/context/UserContext';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from 'react';
import { decode } from "base-64";
import Link from 'next/link'



export default function Dashboard() {
  global.atob = decode;

  const { user, setUser } = useUser();

  useEffect(() => {
    console.log("COOKIES:", document.cookie);
    const token = document.cookie
      .split('.')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[2];
      console.log("EL TOKEN:", token);

    if (token) {
      const decodedUser = decode(token);
      console.log("USER LOGGED:", decodedUser);
      setUser(decodedUser);
    }
    console.log("USER:", user);
  }, []);

  if (!user) {
    return <p>Vuelve a ingresar...</p>;
  }



  return (
<div className="bg-gray-800 p-4 shadow-lg">
  <nav className="flex justify-between items-center text-white">
    <ul className="flex space-x-6">
      <li>
        <a 
          href="/logout" 
          className="text-lg font-semibold hover:text-red-400 transition duration-300"
        >
          Cerrar sesión
        </a>
      </li>
    </ul>
    <div className="text-center">
      <h1 className="text-2xl font-bold">Bienvenido, {user.nombre}</h1>
    </div>
    <ul>
      <li>
        <h2 className="text-sm text-gray-400">Usuario ID: {user.usuario_id}</h2>
      </li>
    </ul>
  </nav>

  {/* Grid de Cards */}
  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <Link href="/ventas">
    <button className="bg-blue-500 text-white p-6 rounded-lg shadow-lg hover:bg-blue-600 transition duration-300">
        <h3 className="text-xl font-bold">Ventas</h3>
        <p className="mt-2 text-sm">Gestión de ventas</p>
      </button>
    </Link>

    <Link href="/inventario">
    <button className="bg-green-500 text-white p-6 rounded-lg shadow-lg hover:bg-green-600 transition duration-300">
      <h3 className="text-xl font-bold">Inventario</h3>
      <p className="mt-2 text-sm">Control de inventario</p>
    </button>
    </Link>
    
    <Link href="/provedores">
    <button className="bg-yellow-500 text-white p-6 rounded-lg shadow-lg hover:bg-yellow-600 transition duration-300">
      <h3 className="text-xl font-bold">Proveedores</h3>
      <p className="mt-2 text-sm">Administración de proveedores</p>
    </button>
    </Link>
    
    <Link href="/reports">
    <button className="bg-red-500 text-white p-6 rounded-lg shadow-lg hover:bg-red-600 transition duration-300">
      <h3 className="text-xl font-bold">Reportes</h3>
      <p className="mt-2 text-sm">Generación de reportes</p>
    </button>
    </Link>
  </div>
</div>


  );
}
