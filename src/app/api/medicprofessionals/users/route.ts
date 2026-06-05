import { NextResponse } from 'next/server';
import { medicProfessionalsFetch } from '@/lib/db';

export async function GET() {
  try {
    const res = await medicProfessionalsFetch('/api/admin/users');
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
