import { NextResponse } from 'next/server';
import { getMedicProfessionalsDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getMedicProfessionalsDb();
    const users = db.all(
      `SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role, u.created_at,
              pp.especialidad, pp.matricula, pp.institucion
       FROM users u
       LEFT JOIN professional_profiles pp ON pp.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    return NextResponse.json(users);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
