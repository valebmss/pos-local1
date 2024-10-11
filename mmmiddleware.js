// middleware.js
import { NextResponse } from 'next/server';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

export function middleware(req) {
  const cookies = parse(req.headers.get('cookie') || '');
  const token = cookies.authToken;
  console.log("TOKENNN:", token);

  if (!token) {
    console.log("NO TOKEN");
  }

  try {
    jwt.verify(token, SECRET_KEY);
    return NextResponse.next();
  } catch (err) {
    console.log("ERROR:", err);
  }
}

export const config = {
  matcher: ['/dashboard/:path*'], // Aplica el middleware solo a rutas protegidas
};
