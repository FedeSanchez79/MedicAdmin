import { NextRequest, NextResponse } from 'next/server';
import { medicDataFetch } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tipo, titulo, descripcion, fecha_registro, activo } = await req.json();

    const prevRes = await medicDataFetch(`/api/admin/records/${params.id}`);
    if (prevRes.status === 404) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    const previous = await prevRes.json();

    const res = await medicDataFetch(`/api/admin/records/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify({ tipo, titulo, descripcion, fecha_registro, activo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
      return NextResponse.json(err, { status: res.status });
    }

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicdata',
      accion: 'MODIFICAR',
      tabla: 'medical_records',
      registroId: params.id,
      datosAnteriores: previous,
      datosNuevos: { tipo, titulo, descripcion, fecha_registro, activo },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
