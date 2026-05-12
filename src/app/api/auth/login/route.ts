import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getAdminDb } from '@/lib/db';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const db = await getAdminDb();
    const admin = db.get('SELECT id, username, password, nombre FROM admin_users WHERE username = ?', [username]) as
      { id: number; username: string; password: string; nombre: string } | undefined;

    if (!admin) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signToken({ adminId: admin.id, username: admin.username, nombre: admin.nombre });
    const response = NextResponse.json({ ok: true, nombre: admin.nombre });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return response;
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
