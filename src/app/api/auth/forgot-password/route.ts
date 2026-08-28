import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Always respond with ok to avoid exposing whether the email matches
    if (!email || email.trim().toLowerCase() !== (process.env.ADMIN_EMAIL || '').toLowerCase()) {
      return NextResponse.json({ ok: true });
    }

    const db = await getAdminDb();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.run(
      'INSERT INTO reset_tokens (token, expires_at) VALUES (?, ?)',
      [token, expiresAt]
    );

    const appUrl = (process.env.APP_URL || 'http://localhost:3002').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(resetUrl);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
