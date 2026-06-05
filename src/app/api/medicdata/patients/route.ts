import { NextResponse } from 'next/server';
import { medicDataFetch } from '@/lib/db';

export async function GET() {
  try {
    const res = await medicDataFetch('/api/admin/patients');
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
