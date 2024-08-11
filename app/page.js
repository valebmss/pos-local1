// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Home() {
  const [usuario_id, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log('Logging in:', usuario_id);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario_id, password }),
    });
    

if (res.ok) {
  const data = await res.json();

  console.log('Login successful:',  data.userData);
  router.push(
 '/dashboard',
   );
} else {
  const errorData = await res.json();
  console.error('Login failed:', errorData);
}

  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="number"
            value={usuario_id}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
