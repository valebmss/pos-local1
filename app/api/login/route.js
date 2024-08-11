// app/api/login/route.js
import ddbDocClient from "@/lib/aws";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req) {
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

    // Aquí puedes guardar la sesión usando cookies o JWT
    return new Response(JSON.stringify({ message: 'Login successful', userData: Item.nombre }), { status: 200 });
  } catch (error) {
    console.error('An error occurred:', error);
    console.log("KEY: ", usuario_id);
    return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), { status: 500 });
  }
}
