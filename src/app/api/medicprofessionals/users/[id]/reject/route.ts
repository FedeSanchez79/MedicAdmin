import { NextRequest, NextResponse } from 'next/server';
import { getMedicProfessionalsDb } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const db = await getMedicProfessionalsDb();

    const previous = db.get(
      'SELECT id, verification_status FROM users WHERE id = ?',
      [params.id]
    );
    if (!previous) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    db.run(
      "UPDATE users SET verification_status = 'rechazado' WHERE id = ?",
      [params.id]
    );

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicprofessionals',
      accion: 'MODIFICAR',
      tabla: 'users',
      registroId: params.id,
      datosAnteriores: { verification_status: previous.verification_status },
      datosNuevos: { verification_status: 'rechazado' },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
