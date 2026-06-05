import { NextRequest, NextResponse } from 'next/server';
import { medicDataFetch } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await medicDataFetch(`/api/admin/patients/${params.id}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { firstName, lastName, email, phone, username } = await req.json();

    const prevRes = await medicDataFetch(`/api/admin/patients/${params.id}`);
    if (prevRes.status === 404) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    const previous = await prevRes.json();

    const res = await medicDataFetch(`/api/admin/patients/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName, email, phone, username }),
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
      tabla: 'users',
      registroId: params.id,
      datosAnteriores: previous,
      datosNuevos: { firstName, lastName, email, phone, username },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const prevRes = await medicDataFetch(`/api/admin/patients/${params.id}`);
    if (prevRes.status === 404) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    const previous = await prevRes.json();

    const res = await medicDataFetch(`/api/admin/patients/${params.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
      return NextResponse.json(err, { status: res.status });
    }

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicdata',
      accion: 'ELIMINAR',
      tabla: 'users',
      registroId: params.id,
      datosAnteriores: previous,
      datosNuevos: null,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
