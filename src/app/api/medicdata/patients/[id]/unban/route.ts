import { NextRequest, NextResponse } from 'next/server';
import { getMedicDataDb } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const db = await getMedicDataDb();

    const previous = await db.get(
      'SELECT id, banned_at, banned_by, ban_reason FROM users WHERE id = ?',
      [params.id]
    );
    if (!previous) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });

    await db.run(
      'UPDATE users SET banned_at = NULL, banned_by = NULL, ban_reason = NULL WHERE id = ?',
      [params.id]
    );

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicdata',
      accion: 'MODIFICAR',
      tabla: 'users',
      registroId: params.id,
      datosAnteriores: { banned_at: previous.banned_at, banned_by: previous.banned_by, ban_reason: previous.ban_reason },
      datosNuevos: { banned_at: null, banned_by: null, ban_reason: null },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
