// lib/auth.js
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET; // Usa la misma clave secreta

export function verifyToken(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.authToken;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (err) {
    return null;
  }
}
