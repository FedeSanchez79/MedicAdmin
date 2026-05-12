import { NextRequest, NextResponse } from 'next/server';
import { getMedicDataDb } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getMedicDataDb();
    const patient = db.get(
      'SELECT id, firstName, lastName, phone, email, username, role, created_at FROM users WHERE id = ?',
      [params.id]
    );
    if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    return NextResponse.json(patient);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { firstName, lastName, email, phone, username } = await req.json();
    const db = await getMedicDataDb();

    const previous = db.get(
      'SELECT id, firstName, lastName, phone, email, username FROM users WHERE id = ?',
      [params.id]
    );
    if (!previous) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });

    db.run(
      'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, username = ? WHERE id = ?',
      [firstName, lastName, email, phone || null, username, params.id]
    );

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicdata',
      accion: 'MODIFICAR',
      tabla: 'users',
      registroId: params.id,
      datosAnteriores: previous as Record<string, unknown>,
      datosNuevos: { firstName, lastName, email, phone, username },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
