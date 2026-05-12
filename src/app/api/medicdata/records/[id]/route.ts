import { NextRequest, NextResponse } from 'next/server';
import { getMedicDataDb } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tipo, titulo, descripcion, fecha_registro, activo } = await req.json();
    const db = await getMedicDataDb();

    const previous = db.get(
      'SELECT id, tipo, titulo, descripcion, fecha_registro, activo FROM medical_records WHERE id = ?',
      [params.id]
    );
    if (!previous) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

    db.run(
      'UPDATE medical_records SET tipo = ?, titulo = ?, descripcion = ?, fecha_registro = ?, activo = ? WHERE id = ?',
      [tipo, titulo, descripcion || null, fecha_registro || null, activo ? 1 : 0, params.id]
    );

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicdata',
      accion: 'MODIFICAR',
      tabla: 'medical_records',
      registroId: params.id,
      datosAnteriores: previous as Record<string, unknown>,
      datosNuevos: { tipo, titulo, descripcion, fecha_registro, activo },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
