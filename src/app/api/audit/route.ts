import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getAdminDb();
    const entries = db.all('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500');
    return NextResponse.json(entries);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
