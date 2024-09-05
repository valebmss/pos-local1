// app/api/login/route.js
import ddbDocClient from "@/lib/aws";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';


export async function POST(req) {
  const SECRET_KEY = process.env.JWT_SECRET; // Usa la misma clave secreta

  const { usuario_id, password } = await req.json();

  try {
    console.log('usuario_id:', usuario_id);
    console.log('password:', password);

    const params = {
      TableName: 'Usuarios',
      Key: { 
        usuario_id: parseInt(usuario_id),
        },
    };

    const { Item } = await ddbDocClient.send(new GetCommand(params));

    if (!Item) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    }

    
    const passwordMatch = password === Item.password;

    if (!passwordMatch) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    }

    const payload = {
      usuario_id: Item.usuario_id,
      nombre: Item.nombre, // Agrega cualquier otra información que desees incluir
    };


        // Genera el token JWT
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '12h' });

        // Configura la cookie
        const cookie = serialize('authToken', token, {
          maxAge: 3600, // 1 hora
          path: '/',
        });
    // Aquí puedes guardar la sesión usando cookies o JWT
    return new Response(JSON.stringify({ message: 'Login successful', userData: Item }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('An error occurred:', error);
    return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), { status: 500 });
  }
}