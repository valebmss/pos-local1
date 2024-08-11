// app/api/login/route.js
import ddbDocClient from "@/lib/aws";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { usuario_id, password } = await req.json();

  try {
    const params = {
      TableName: 'Usuarios',
      Key: { usuario_id },
    };

    const { Item } = await ddbDocClient.send(new GetCommand(params));

    if (!Item) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, Item.password);

    if (!passwordMatch) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    }

    // Aquí puedes guardar la sesión usando cookies o JWT
    return new Response(JSON.stringify({ message: 'Login successful', userData: Item.userData }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal server errorrrr' }), { status: 500 });
  }
}
