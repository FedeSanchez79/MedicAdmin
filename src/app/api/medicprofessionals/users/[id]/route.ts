import { NextRequest, NextResponse } from 'next/server';
import { getMedicProfessionalsDb } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';
import { registrarAuditoria } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getMedicProfessionalsDb();
    const user = db.prepare(`
      SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role, u.created_at,
             pp.especialidad, pp.matricula, pp.institucion
      FROM users u
      LEFT JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.id = ?
    `).get(params.id);

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
    const body = await req.json();
    const { firstName, lastName, email, phone, username, especialidad, matricula, institucion } = body;

    const db = getMedicProfessionalsDb();
    const previous = db.prepare(`
      SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role,
             pp.especialidad, pp.matricula, pp.institucion
      FROM users u
      LEFT JOIN professional_profiles pp ON pp.user_id = u.id
      WHERE u.id = ?
    `).get(params.id) as { role: string } | undefined;

    if (!previous) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    db.prepare(`
      UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, username = ?
      WHERE id = ?
    `).run(firstName, lastName, email, phone || null, username, params.id);

    if ((previous as { role: string }).role === 'professional') {
      const existing = db.prepare('SELECT id FROM professional_profiles WHERE user_id = ?').get(params.id);
      if (existing) {
        db.prepare(`
          UPDATE professional_profiles SET especialidad = ?, matricula = ?, institucion = ?
          WHERE user_id = ?
        `).run(especialidad || null, matricula || null, institucion || null, params.id);
      } else {
        db.prepare(`
          INSERT INTO professional_profiles (user_id, especialidad, matricula, institucion)
          VALUES (?, ?, ?, ?)
        `).run(params.id, especialidad || null, matricula || null, institucion || null);
      }
    }

    registrarAuditoria({
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
