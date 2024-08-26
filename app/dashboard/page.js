// pages/dashboard.js
'use client';

import { useUser } from '@/context/UserContext';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from 'react';
import { decode } from "base-64";



export default function Dashboard() {
  global.atob = decode;

  const { user, setUser } = useUser();

  useEffect(() => {
    const tokeninit=document.cookie;
    console.log("TOKEN:", tokeninit);
    const token = document.cookie
      .split('.')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
      console.log("TOKEN:", token);

    if (token) {
      const decodedUser = decode(token);
      console.log("USER LOGGED:", decodedUser);
      setUser(decodedUser);
    }
  }, []);

  if (!user) {
    return <p>Vuelve a ingresar...</p>;
  }



  return (
    <div>
      <h1>Bienvenido, {user.nombre}!</h1>
      <p>Usuario conectado: {user.usuario}</p>
    </div>
  );
}
