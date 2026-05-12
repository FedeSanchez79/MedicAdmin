import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { JWTPayload } from '@/types';

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const COOKIE_NAME = 'admin_token';

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthFromCookies(): JWTPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
