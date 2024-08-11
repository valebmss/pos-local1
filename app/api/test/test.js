export async function POST(req) {
    return new Response(JSON.stringify({ message: 'Login endpoint reached' }), { status: 200 });
  }