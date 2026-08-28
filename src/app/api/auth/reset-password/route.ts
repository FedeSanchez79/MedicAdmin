import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getAdminDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const row = await db.get(
      'SELECT id, expires_at, used FROM reset_tokens WHERE token = ?',
      [token]
    ) as { id: number; expires_at: string; used: number } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'El link es inválido o ya fue utilizado' }, { status: 400 });
    }

    if (row.used) {
      return NextResponse.json({ error: 'Este link ya fue utilizado' }, { status: 400 });
    }

    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: 'El link ha expirado' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.run('UPDATE admin_users SET password = ?', [hashed]);
    await db.run('UPDATE reset_tokens SET used = 1 WHERE id = ?', [row.id]);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
