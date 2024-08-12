// app/api/protected/route.js
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  const user = verifyToken(req);

  if (!user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  // Datos protegidos
  return new Response(JSON.stringify({ message: 'Protected data', user }), { status: 200 });
}
