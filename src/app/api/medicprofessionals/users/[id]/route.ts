import { NextRequest, NextResponse } from 'next/server';
import { getMedicProfessionalsDb } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getMedicProfessionalsDb();
    const user = db.get(
      `SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role, u.created_at,
              pp.especialidad, pp.matricula, pp.institucion
       FROM users u
       LEFT JOIN professional_profiles pp ON pp.user_id = u.id
       WHERE u.id = ?`,
      [params.id]
    );
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json(user);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAuthFromCookies();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { firstName, lastName, email, phone, username, especialidad, matricula, institucion } = await req.json();
    const db = await getMedicProfessionalsDb();

    const previous = db.get(
      `SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role,
              pp.especialidad, pp.matricula, pp.institucion
       FROM users u LEFT JOIN professional_profiles pp ON pp.user_id = u.id
       WHERE u.id = ?`,
      [params.id]
    ) as { role: string } | undefined;

    if (!previous) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    db.run(
      'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, username = ? WHERE id = ?',
      [firstName, lastName, email, phone || null, username, params.id]
    );

    if (previous.role === 'professional') {
      const existing = db.get('SELECT id FROM professional_profiles WHERE user_id = ?', [params.id]);
      if (existing) {
        db.run(
          'UPDATE professional_profiles SET especialidad = ?, matricula = ?, institucion = ? WHERE user_id = ?',
          [especialidad || null, matricula || null, institucion || null, params.id]
        );
      } else {
        db.run(
          'INSERT INTO professional_profiles (user_id, especialidad, matricula, institucion) VALUES (?, ?, ?, ?)',
          [params.id, especialidad || null, matricula || null, institucion || null]
        );
      }
    }

    await registrarAuditoria({
      adminId: admin.adminId,
      adminUsername: admin.username,
      proyecto: 'medicprofessionals',
      accion: 'MODIFICAR',
      tabla: 'users',
      registroId: params.id,
      datosAnteriores: previous as Record<string, unknown>,
      datosNuevos: { firstName, lastName, email, phone, username, especialidad, matricula, institucion },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
