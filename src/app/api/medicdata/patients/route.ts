import { NextResponse } from 'next/server';
import { getMedicDataDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getMedicDataDb();
    const patients = db.all(
      'SELECT id, firstName, lastName, phone, email, username, role, created_at FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json(patients);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
