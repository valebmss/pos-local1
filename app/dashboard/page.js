// pages/dashboard.js
'use client';

import { useUser } from '@/context/UserContext';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from 'react';



export default function Dashboard() {
  const { user } = useUser();

  useEffect(() => {
    console.log("COOKIES:", document.cookie);
    console.log("COOKIES:", document.cookie.split('.'));
    console.log("COOKIES:", document.cookie.split('.').find(row => row.startsWith('accessToken=')));
    const token = document.cookie
      .split('.')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
      console.log("TOKEN:", token);
      //tipo de token
      console.log("TOKEN:", jwtDecode(token).type);
      console.log("TOKEN:", jwtDecode(token));

    if (token) {
      const decodedUser = jwtDecode(token);
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
